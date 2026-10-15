-- Facilitator quotes kept by the database (master prompt P0.5, moved server-side).
-- Partner prices are pass-through; the platform fee is disclosed on its own line. The server, not the browser, decides:
--   * who changed the fee (Owner only, with a reason, append-only history),
--   * the fee percentage a quote really carries (recomputed from its own lines) and whether Admin may offer it,
--   * who accepted which component (only the quote's own customer, once per component).
-- Defaults below are placeholders for the Owner [ASSUMPTION]. Mirrors src/features/quotes/facilitatorQuote.ts.

create table public.fee_settings_versions (
  version int primary key,
  settings jsonb not null,
  cost_rates jsonb not null,
  set_by uuid references public.profiles (id),
  set_by_name text not null,
  reason text not null check (length(btrim(reason)) >= 10),
  created_at timestamptz not null default now()
);

insert into public.fee_settings_versions (version, settings, cost_rates, set_by_name, reason) values (
  1,
  '{"mode":"F","style":"markup","targetPct":60,"assistantFloorPct":30,"humanFloorPct":20,"fixedFeeInr":150000,"tiers":[{"upToInr":500000,"pct":60},{"upToInr":1500000,"pct":40},{"upToInr":null,"pct":30}],"gstPctOnFee":18,"tokenInr":10000}',
  '{"scoutCommissionPct":5,"salesCommissionPct":5,"qcFeeInr":1500,"mentorBonusPct":1,"providerCostsInr":2000,"infrastructurePct":2,"reservePct":5}',
  'Initial default [ASSUMPTION]', 'Starting values for the Owner to replace');

create function app.fee_guard() returns trigger language plpgsql as $$
declare s jsonb := new.settings;
begin
  if app.from_client() then
    if not app.is_owner() then raise exception 'owner_only'; end if;
    new.version := (select coalesce(max(version), 0) + 1 from public.fee_settings_versions);
    new.set_by := app.my_profile_id();
    new.set_by_name := (select name from public.profiles where id = app.my_profile_id());
    new.created_at := now();
  end if;
  if not ((s->>'humanFloorPct')::numeric >= 0 and (s->>'humanFloorPct')::numeric <= (s->>'assistantFloorPct')::numeric and (s->>'assistantFloorPct')::numeric <= (s->>'targetPct')::numeric) then raise exception 'floors_order'; end if;
  if (s->>'targetPct')::numeric > 200 then raise exception 'target_too_high'; end if;
  if (s->>'gstPctOnFee')::numeric < 0 or (s->>'gstPctOnFee')::numeric > 40 then raise exception 'gst_range'; end if;
  if (s->>'tokenInr')::numeric < 0 then raise exception 'token_negative'; end if;
  return new;
end $$;
create trigger fee_guard before insert on public.fee_settings_versions for each row execute function app.fee_guard();

create function app.fee_refuse_change() returns trigger language plpgsql as $$
begin raise exception 'fee_history_is_append_only'; end $$;
create trigger fee_no_update before update or delete on public.fee_settings_versions for each row execute function app.fee_refuse_change();
create trigger fee_no_truncate before truncate on public.fee_settings_versions for each statement execute function app.fee_refuse_change();

alter table public.fee_settings_versions enable row level security;
create policy fee_read on public.fee_settings_versions for select to authenticated using (app.is_admin());
create policy fee_write on public.fee_settings_versions for insert to authenticated with check (app.is_owner());
revoke update, delete, truncate on public.fee_settings_versions from anon, authenticated;
grant select, insert on public.fee_settings_versions to authenticated;

-- ---- Quotes ----
create sequence public.facilitator_quote_seq start 3001;
grant usage on sequence public.facilitator_quote_seq to authenticated;

create table public.facilitator_quotes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  lead_ref text not null,
  site_name text not null check (length(btrim(site_name)) > 0),
  customer_id uuid references public.profiles (id),
  components jsonb not null check (jsonb_typeof(components) = 'array' and jsonb_array_length(components) > 0),
  bundle_discount_inr bigint not null default 0 check (bundle_discount_inr >= 0),
  fee_version int not null references public.fee_settings_versions (version),
  base_inr bigint not null default 0,
  fee_inr bigint not null default 0,
  effective_pct numeric not null default 0,
  totals jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'partly_accepted', 'accepted', 'rejected')),
  created_by uuid references public.profiles (id),
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  client_event_id text unique
);

-- Not security definer: it must know whether the caller is a browser (see app.from_client).
create function app.quote_guard() returns trigger language plpgsql as $$
declare
  s jsonb; gross numeric; base numeric; c jsonb; pct numeric; floor_pct numeric; me public.app_role := app.my_role();
  partner_total numeric; gst numeric; cust_total numeric; tok numeric;
  t jsonb; left_ numeric; from_ numeric := 0; top_ numeric; slice_ numeric;
begin
  if tg_op = 'INSERT' then
    if app.from_client() then
      if not app.is_admin() then raise exception 'forbidden'; end if;
      new.status := 'draft'; new.sent_at := null;
      new.created_by := app.my_profile_id();
      new.created_by_name := (select name from public.profiles where id = app.my_profile_id());
      new.created_at := now();
    end if;
    new.fee_version := (select max(version) from public.fee_settings_versions);
    select settings into s from public.fee_settings_versions where version = new.fee_version;
    if s->>'mode' <> 'F' then raise exception 'mode_p'; end if;
    for c in select * from jsonb_array_elements(new.components) loop
      if coalesce((c->>'partnerPriceInr')::numeric, 0) <= 0 then raise exception 'bad_price'; end if;
    end loop;
    select coalesce(sum((x->>'partnerPriceInr')::numeric), 0) into base from jsonb_array_elements(new.components) x where x->>'kind' <> 'statutory';
    if base <= 0 then gross := 0;
    elsif s->>'style' = 'fixed' then gross := (s->>'fixedFeeInr')::numeric;
    elsif s->>'style' = 'tiered' then
      gross := 0; left_ := base;
      for t in select * from jsonb_array_elements(s->'tiers') loop
        top_ := coalesce((t->>'upToInr')::numeric, 1e18);
        slice_ := least(left_, top_ - from_);
        if slice_ > 0 then gross := gross + slice_ * (t->>'pct')::numeric / 100; end if;
        left_ := left_ - greatest(slice_, 0); from_ := top_;
        exit when left_ <= 0;
      end loop;
      gross := round(gross);
    else gross := round(base * (s->>'targetPct')::numeric / 100); end if;
    if new.bundle_discount_inr > gross then raise exception 'discount_exceeds_fee'; end if;
    new.base_inr := base;
    new.fee_inr := gross - new.bundle_discount_inr;
    pct := case when base > 0 then new.fee_inr / base * 100 else 0 end;
    new.effective_pct := round(pct, 1);
    if me = 'admin' then
      floor_pct := (s->>'humanFloorPct')::numeric;
      if pct < floor_pct then raise exception 'needs_owner'; end if;
    end if;
    -- The totals a customer sees are written here, never taken from the browser (same maths as src/features/quotes/facilitatorQuote.ts).
    select coalesce(sum((x->>'partnerPriceInr')::numeric), 0) into partner_total from jsonb_array_elements(new.components) x;
    gst := round(new.fee_inr * (s->>'gstPctOnFee')::numeric / 100);
    cust_total := partner_total + new.fee_inr + gst;
    tok := least((s->>'tokenInr')::numeric, new.fee_inr + gst);
    new.totals := jsonb_build_object(
      'baseInr', base, 'partnerTotalInr', partner_total, 'grossFeeInr', gross, 'bundleDiscountInr', new.bundle_discount_inr,
          'feeInr', new.fee_inr, 'effectivePct', round(pct, 1),
      'band', case when pct >= (s->>'targetPct')::numeric then 'target' when pct >= (s->>'assistantFloorPct')::numeric then 'assistant_ok' when pct >= (s->>'humanFloorPct')::numeric then 'human_only' else 'owner_approval' end,
      'gstOnFeeInr', gst, 'customerTotalInr', cust_total,
      'feeShareOfTotalPct', case when cust_total > 0 then round((new.fee_inr + gst) / cust_total * 100, 1) else 0 end,
      'tokenInr', tok, 'feeAfterTokenInr', new.fee_inr + gst - tok);
    new.code := 'AIEC-FQ-' || nextval('public.facilitator_quote_seq');
    return new;
  end if;
  -- Updates: the priced facts never move. Staff may send a draft; the acceptance trigger moves a sent quote forward.
  if new.components is distinct from old.components or new.bundle_discount_inr is distinct from old.bundle_discount_inr
     or new.fee_version is distinct from old.fee_version or new.fee_inr is distinct from old.fee_inr or new.base_inr is distinct from old.base_inr
     or new.totals is distinct from old.totals or new.customer_id is distinct from old.customer_id or new.lead_ref is distinct from old.lead_ref
     or new.code is distinct from old.code or new.created_by is distinct from old.created_by then raise exception 'quote_is_priced'; end if;
  if app.from_client() then
    if not app.is_admin() then raise exception 'forbidden'; end if;
    if not (old.status = 'draft' and new.status = 'sent') then raise exception 'invalid_state'; end if;
    new.sent_at := now();
  end if;
  return new;
end $$;
create trigger quote_guard before insert or update on public.facilitator_quotes for each row execute function app.quote_guard();

create function app.quote_no_delete() returns trigger language plpgsql as $$ begin raise exception 'quotes_are_kept'; end $$;
create trigger quote_no_delete before delete or truncate on public.facilitator_quotes for each statement execute function app.quote_no_delete();

alter table public.facilitator_quotes enable row level security;
create policy quote_staff_read on public.facilitator_quotes for select to authenticated using (app.is_admin());
create policy quote_customer_read on public.facilitator_quotes for select to authenticated using (customer_id = app.my_profile_id() and status <> 'draft');
create policy quote_staff_insert on public.facilitator_quotes for insert to authenticated with check (app.is_admin());
create policy quote_staff_update on public.facilitator_quotes for update to authenticated using (app.is_admin()) with check (app.is_admin());
revoke delete, truncate on public.facilitator_quotes from anon, authenticated;
grant select, insert, update on public.facilitator_quotes to authenticated;

-- ---- Acceptance, component by component ----
create table public.quote_acceptances (
  quote_id uuid not null references public.facilitator_quotes (id),
  line_id text not null,
  customer_id uuid not null references public.profiles (id),
  accepted_at timestamptz not null default now(),
  primary key (quote_id, line_id)
);

create function app.acceptance_guard() returns trigger language plpgsql as $$
declare q public.facilitator_quotes;
begin
  select * into q from public.facilitator_quotes where id = new.quote_id;
  if q.id is null then raise exception 'not_found'; end if;
  if app.from_client() then
    if q.customer_id is distinct from app.my_profile_id() then raise exception 'not_found'; end if;
    new.customer_id := app.my_profile_id();
    new.accepted_at := now();
  end if;
  if q.status not in ('sent', 'partly_accepted') then raise exception 'invalid_state'; end if;
  if not exists (select 1 from jsonb_array_elements(q.components) c where c->>'id' = new.line_id) then raise exception 'not_found'; end if;
  return new;
end $$;
create trigger acceptance_guard before insert on public.quote_acceptances for each row execute function app.acceptance_guard();

create function app.acceptance_after() returns trigger language plpgsql security definer set search_path = public as $$
declare total int; got int;
begin
  select jsonb_array_length(components) into total from public.facilitator_quotes where id = new.quote_id;
  select count(*) into got from public.quote_acceptances where quote_id = new.quote_id;
  update public.facilitator_quotes set status = case when got >= total then 'accepted' else 'partly_accepted' end where id = new.quote_id;
  return new;
end $$;
create trigger acceptance_after after insert on public.quote_acceptances for each row execute function app.acceptance_after();

create function app.acceptance_refuse_change() returns trigger language plpgsql as $$ begin raise exception 'acceptances_are_kept'; end $$;
create trigger acceptance_no_change before update or delete or truncate on public.quote_acceptances for each statement execute function app.acceptance_refuse_change();

alter table public.quote_acceptances enable row level security;
create policy acc_read on public.quote_acceptances for select to authenticated using (app.is_admin() or customer_id = app.my_profile_id());
create policy acc_insert on public.quote_acceptances for insert to authenticated with check (customer_id = app.my_profile_id());
revoke update, delete, truncate on public.quote_acceptances from anon, authenticated;
grant select, insert on public.quote_acceptances to authenticated;
