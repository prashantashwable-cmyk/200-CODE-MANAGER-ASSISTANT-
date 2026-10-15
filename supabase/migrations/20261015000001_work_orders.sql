-- Work orders and payment milestones kept by the database (master prompt P0.3, P0.7, A6 steps 7-14).
--
-- A work order is between ONE customer and ONE partner. The platform facilitates, records and gates; it never holds or moves partner money.
-- The server, not the browser, decides:
--   * who may issue an order (the Owner), which partner account acts on it, and how its price is split into milestones,
--   * who accepted it (each side once), and that work starts only after both did,
--   * that a milestone moves forward exactly one step at a time: evidence -> the Owner verifies -> the customer records a payment,
--   * that a paid milestone can never change again, for anyone, including the server.
-- Acceptance here is NOT an electronic signature: no signing provider is connected, so every acceptance says 'in_app_acceptance'.
-- Statutory fees are paid to the authority and are never work orders (kind check below). Default splits are placeholders for the Owner [ASSUMPTION];
-- legal effect of an in-app acceptance is [VERIFY]. Mirrors src/features/workorders/workOrder.ts; a test keeps the split and the template rules identical.
--
-- Rollback (new objects only, nothing existing is altered):
--   drop table public.work_order_milestones, public.work_orders, public.milestone_template_versions;
--   drop sequence public.work_order_seq;
--   drop function public.create_work_orders(uuid, jsonb), public.accept_work_order(uuid), public.start_work_order(uuid),
--     public.submit_milestone_evidence(uuid, text, text[]), public.verify_milestone(uuid, text), public.record_milestone_payment(uuid, text, text);
--   drop function app.wo_event(text, text, jsonb), app.wo_split(bigint, int[]), app.wo_templates_problem(jsonb),
--     app.wo_template_guard(), app.wo_template_refuse_change(), app.wo_guard(), app.wo_milestone_guard(), app.wo_refuse_delete();

-- ---- Payment-milestone templates: Owner-editable, versioned, append-only ----
create function app.wo_templates_problem(t jsonb) returns text language plpgsql immutable as $$
declare k text; m jsonb; total int; n int;
begin
  if t is null or jsonb_typeof(t) <> 'object' then return 'template_empty'; end if;
  foreach k in array array['material', 'installation', 'logistics', 'amc', 'statutory'] loop
    if coalesce(jsonb_typeof(t -> k), '') <> 'array' or jsonb_array_length(t -> k) = 0 then return 'template_empty'; end if;
    total := 0;
    for m in select e.value from jsonb_array_elements(t -> k) e loop
      if coalesce(m ->> 'id', '') = '' or coalesce(m ->> 'label', '') = '' then return 'template_shape'; end if;
      if coalesce(m ->> 'gate', '') not in ('on_acceptance', 'on_delivery', 'on_progress', 'on_handover') then return 'template_gate'; end if;
      if jsonb_typeof(m -> 'pct') <> 'number' or (m ->> 'pct')::numeric <= 0 or (m ->> 'pct')::numeric <> trunc((m ->> 'pct')::numeric) then return 'template_pct'; end if;
      total := total + (m ->> 'pct')::int;
    end loop;
    select count(distinct e.value ->> 'id') into n from jsonb_array_elements(t -> k) e;
    if n <> jsonb_array_length(t -> k) then return 'template_duplicate'; end if;
    if total <> 100 then return 'template_sum'; end if;
  end loop;
  return null;
end $$;

create table public.milestone_template_versions (
  version int primary key,
  templates jsonb not null,
  set_by uuid references public.profiles (id),
  set_by_name text not null,
  reason text not null check (length(btrim(reason)) >= 10),
  created_at timestamptz not null default now()
);

-- Not security definer: it must know whether the caller is a browser (see app.from_client).
create function app.wo_template_guard() returns trigger language plpgsql as $$
declare p text;
begin
  if app.from_client() then
    if not app.is_owner() then raise exception 'owner_only'; end if;
    new.version := (select coalesce(max(version), 0) + 1 from public.milestone_template_versions);
    new.set_by := app.my_profile_id();
    new.set_by_name := (select name from public.profiles where id = app.my_profile_id());
    new.created_at := now();
  end if;
  p := app.wo_templates_problem(new.templates);
  if p is not null then raise exception '%', p; end if;
  return new;
end $$;
create trigger wo_template_guard before insert on public.milestone_template_versions for each row execute function app.wo_template_guard();

create function app.wo_template_refuse_change() returns trigger language plpgsql as $$
begin raise exception 'template_history_is_append_only'; end $$;
create trigger wo_template_no_update before update or delete on public.milestone_template_versions for each row execute function app.wo_template_refuse_change();
create trigger wo_template_no_truncate before truncate on public.milestone_template_versions for each statement execute function app.wo_template_refuse_change();

insert into public.milestone_template_versions (version, templates, set_by_name, reason) values (
  1,
  '{
    "material":     [{"id":"delivery","label":"On verified delivery","pct":90,"gate":"on_delivery"},{"id":"handover","label":"On handover","pct":10,"gate":"on_handover"}],
    "installation": [{"id":"progress","label":"On verified progress","pct":50,"gate":"on_progress"},{"id":"handover","label":"On handover","pct":50,"gate":"on_handover"}],
    "logistics":    [{"id":"delivery","label":"On verified delivery","pct":100,"gate":"on_delivery"}],
    "amc":          [{"id":"start","label":"On acceptance","pct":100,"gate":"on_acceptance"}],
    "statutory":    [{"id":"start","label":"On acceptance (pass-through)","pct":100,"gate":"on_acceptance"}]
  }',
  'Initial default [ASSUMPTION]', 'Starting values for the Owner to replace; material 90/10 is from the original brief');

alter table public.milestone_template_versions enable row level security;
create policy wo_tpl_read on public.milestone_template_versions for select to authenticated using (app.is_admin());
create policy wo_tpl_write on public.milestone_template_versions for insert to authenticated with check (app.is_owner());
revoke update, delete, truncate on public.milestone_template_versions from anon, authenticated;
grant select, insert on public.milestone_template_versions to authenticated;

-- ---- Whole-rupee split: largest remainder, integer arithmetic, ties to the earlier milestone (mirrors amountsFor) ----
create function app.wo_split(price bigint, pcts int[]) returns bigint[] language plpgsql immutable as $$
declare n int := coalesce(array_length(pcts, 1), 0); floors bigint[] := '{}'; rems int[] := '{}'; left_ bigint; i int; best int;
begin
  if price is null or price < 0 or n = 0 then raise exception 'price_invalid'; end if;
  left_ := price;
  for i in 1..n loop
    floors[i] := (price * pcts[i]) / 100;
    rems[i] := ((price * pcts[i]) % 100)::int;
    left_ := left_ - floors[i];
  end loop;
  while left_ > 0 loop
    best := 1;
    for i in 2..n loop if rems[i] > rems[best] then best := i; end if; end loop;
    floors[best] := floors[best] + 1; rems[best] := -1; left_ := left_ - 1;
  end loop;
  return floors;
end $$;

-- ---- The orders ----
create sequence public.work_order_seq start 4001;

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  quote_id uuid not null references public.facilitator_quotes (id),
  line_id text not null,
  lead_ref text not null,
  site_name text not null,
  customer_id uuid not null references public.profiles (id),
  -- The partner as the quote named it (free text), and the one account the Owner bound to act for it.
  partner_ref text not null,
  partner_name text not null,
  partner_profile_id uuid not null references public.profiles (id),
  -- A statutory fee is paid to the authority: there is no partner contract, so it can never be a work order.
  kind text not null check (kind in ('material', 'installation', 'logistics', 'amc')),
  description text not null default '',
  price_inr bigint not null check (price_inr > 0),
  template_version int not null references public.milestone_template_versions (version),
  status text not null default 'issued' check (status in ('issued', 'in_progress', 'completed', 'declined', 'cancelled')),
  customer_accepted_at timestamptz,
  partner_accepted_at timestamptz,
  started_at timestamptz,
  is_demo boolean not null default false,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (quote_id, line_id)
);
create index work_orders_customer on public.work_orders (customer_id);
create index work_orders_partner on public.work_orders (partner_profile_id);

create table public.work_order_milestones (
  work_order_id uuid not null references public.work_orders (id),
  milestone_id text not null,
  position int not null,
  label text not null,
  gate text not null check (gate in ('on_acceptance', 'on_delivery', 'on_progress', 'on_handover')),
  pct int not null check (pct > 0 and pct <= 100),
  amount_inr bigint not null check (amount_inr >= 0),
  status text not null default 'waiting' check (status in ('waiting', 'evidence_submitted', 'verified', 'payment_recorded', 'closed')),
  -- Evidence is recorded by file name until a storage provider is connected; hashes and files come with storage.
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  evidence_by uuid references public.profiles (id),
  evidence_at timestamptz,
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  payment_reference text check (payment_reference is null or length(payment_reference) <= 60),
  paid_by uuid references public.profiles (id),
  paid_at timestamptz,
  primary key (work_order_id, milestone_id)
);

-- Not security definer, and none of these depend on who is asking: the same rules hold for a browser, a function and the server.
create function app.wo_guard() returns trigger language plpgsql as $$
begin
  if old.status = 'completed' and new is distinct from old then raise exception 'work_order_is_closed'; end if;
  if new.id is distinct from old.id or new.code is distinct from old.code or new.quote_id is distinct from old.quote_id or new.line_id is distinct from old.line_id
     or new.lead_ref is distinct from old.lead_ref or new.site_name is distinct from old.site_name or new.customer_id is distinct from old.customer_id
     or new.partner_ref is distinct from old.partner_ref or new.partner_name is distinct from old.partner_name or new.partner_profile_id is distinct from old.partner_profile_id
     or new.kind is distinct from old.kind or new.description is distinct from old.description or new.price_inr is distinct from old.price_inr
     or new.template_version is distinct from old.template_version or new.is_demo is distinct from old.is_demo
     or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'work_order_is_fixed';
  end if;
  if (old.customer_accepted_at is not null and new.customer_accepted_at is distinct from old.customer_accepted_at)
     or (old.partner_accepted_at is not null and new.partner_accepted_at is distinct from old.partner_accepted_at)
     or (old.started_at is not null and new.started_at is distinct from old.started_at) then
    raise exception 'acceptance_is_kept';
  end if;
  if new.status is distinct from old.status then
    if not ((old.status = 'issued' and new.status = 'in_progress') or (old.status = 'in_progress' and new.status = 'completed')) then raise exception 'invalid_state'; end if;
    if new.status = 'in_progress' and (new.customer_accepted_at is null or new.partner_accepted_at is null) then raise exception 'not_accepted'; end if;
    if new.status = 'completed' and exists (select 1 from public.work_order_milestones m where m.work_order_id = new.id and m.status not in ('payment_recorded', 'closed')) then
      raise exception 'milestones_open';
    end if;
  end if;
  return new;
end $$;
create trigger wo_guard before update on public.work_orders for each row execute function app.wo_guard();

create function app.wo_milestone_guard() returns trigger language plpgsql as $$
declare ws text;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'waiting' or new.evidence <> '[]'::jsonb then raise exception 'invalid_state'; end if;
    return new;
  end if;
  if new.work_order_id is distinct from old.work_order_id or new.milestone_id is distinct from old.milestone_id or new.position is distinct from old.position
     or new.label is distinct from old.label or new.gate is distinct from old.gate or new.pct is distinct from old.pct or new.amount_inr is distinct from old.amount_inr then
    raise exception 'milestone_is_fixed';
  end if;
  -- A paid (or closed) milestone is a locked record: nothing about it changes again.
  if old.status in ('payment_recorded', 'closed') then raise exception 'milestone_is_locked'; end if;
  if not ((old.status = 'waiting' and new.status = 'evidence_submitted') or (old.status = 'evidence_submitted' and new.status = 'verified') or (old.status = 'verified' and new.status = 'payment_recorded')) then
    raise exception 'invalid_state';
  end if;
  select status into ws from public.work_orders where id = new.work_order_id;
  if ws is distinct from 'in_progress' then raise exception 'invalid_state'; end if;
  if new.status = 'evidence_submitted' and (jsonb_array_length(new.evidence) = 0 or new.evidence_by is null) then raise exception 'evidence_missing'; end if;
  if new.status = 'verified' and new.verified_by is null then raise exception 'invalid_state'; end if;
  if new.status = 'payment_recorded' and (new.payment_reference is null or length(btrim(new.payment_reference)) < 4 or new.paid_by is null) then raise exception 'reference_short'; end if;
  -- Evidence stays exactly as sent once it exists.
  if old.status <> 'waiting' and new.evidence is distinct from old.evidence then raise exception 'milestone_is_locked'; end if;
  return new;
end $$;
create trigger wo_milestone_guard before insert or update on public.work_order_milestones for each row execute function app.wo_milestone_guard();

create function app.wo_refuse_delete() returns trigger language plpgsql as $$ begin raise exception 'work_orders_are_kept'; end $$;
create trigger wo_no_delete before delete or truncate on public.work_orders for each statement execute function app.wo_refuse_delete();
create trigger wo_ms_no_delete before delete or truncate on public.work_order_milestones for each statement execute function app.wo_refuse_delete();

-- ---- Who reads what ----
alter table public.work_orders enable row level security;
alter table public.work_order_milestones enable row level security;
create policy wo_staff_read on public.work_orders for select to authenticated using (app.is_admin() and is_demo = app.my_is_demo());
create policy wo_customer_read on public.work_orders for select to authenticated using (customer_id = app.my_profile_id());
create policy wo_partner_read on public.work_orders for select to authenticated using (partner_profile_id = app.my_profile_id());
-- The sub-select is itself filtered by the policies above: a milestone is readable exactly when its order is.
create policy wo_ms_read on public.work_order_milestones for select to authenticated using (exists (select 1 from public.work_orders w where w.id = work_order_id));
revoke insert, update, delete, truncate on public.work_orders, public.work_order_milestones from anon, authenticated;
revoke all on public.work_orders, public.work_order_milestones from anon;
grant select on public.work_orders, public.work_order_milestones to authenticated;

-- ---- Every step is also an event, written by the same transaction as the step, as the person who took it ----
create function app.wo_event(p_type text, p_lead text, p_payload jsonb) returns void language plpgsql as $$
begin
  insert into public.platform_events (event_type, actor_kind, actor_profile_id, actor_role, subject_kind, subject_id, source, payload, is_demo)
  values (p_type, 'person', app.my_profile_id(), app.my_role(), 'lead', p_lead, 'app', p_payload, app.my_is_demo());
end $$;

-- ---- The only ways to change an order. Each checks who is asking from their profile, never from the request. ----
create function public.create_work_orders(p_quote uuid, p_partners jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := app.my_profile_id(); demo boolean := app.my_is_demo();
  q public.facilitator_quotes; tv public.milestone_template_versions; c jsonb; partner uuid; tpl jsonb; pcts int[]; amounts bigint[]; wid uuid; made jsonb := '[]'::jsonb;
begin
  if me is null or not app.is_owner() then raise exception 'forbidden'; end if;
  select * into q from public.facilitator_quotes where id = p_quote;
  if q.id is null then raise exception 'not_found'; end if;
  if q.customer_id is null then raise exception 'no_customer'; end if;
  select * into tv from public.milestone_template_versions order by version desc limit 1;
  -- First look at every part that still needs an order, so a refusal never leaves half a set behind.
  for c in
    select e.value from jsonb_array_elements(q.components) with ordinality as e(value, ord)
     where e.value ->> 'kind' <> 'statutory'
       and exists (select 1 from public.quote_acceptances a where a.quote_id = q.id and a.line_id = e.value ->> 'id')
       and not exists (select 1 from public.work_orders w where w.quote_id = q.id and w.line_id = e.value ->> 'id')
  loop
    begin
      partner := nullif(p_partners ->> (c ->> 'id'), '')::uuid;
    exception when invalid_text_representation then raise exception 'partner_not_eligible';
    end;
    if partner is null then raise exception 'partner_account_required'; end if;
    if not exists (select 1 from public.profiles p where p.id = partner and p.status = 'active' and p.role in ('technician', 'supplier') and p.is_demo = demo) then
      raise exception 'partner_not_eligible';
    end if;
  end loop;
  for c in
    select e.value from jsonb_array_elements(q.components) with ordinality as e(value, ord)
     where e.value ->> 'kind' <> 'statutory'
       and exists (select 1 from public.quote_acceptances a where a.quote_id = q.id and a.line_id = e.value ->> 'id')
       and not exists (select 1 from public.work_orders w where w.quote_id = q.id and w.line_id = e.value ->> 'id')
     order by e.ord
  loop
    partner := (p_partners ->> (c ->> 'id'))::uuid;
    tpl := tv.templates -> (c ->> 'kind');
    select array_agg((t.x ->> 'pct')::int order by t.ord) into pcts from jsonb_array_elements(tpl) with ordinality as t(x, ord);
    amounts := app.wo_split((c ->> 'partnerPriceInr')::bigint, pcts);
    wid := gen_random_uuid();
    insert into public.work_orders (id, code, quote_id, line_id, lead_ref, site_name, customer_id, partner_ref, partner_name, partner_profile_id, kind, description, price_inr, template_version, is_demo, created_by)
    values (wid, 'AIEC-WO-' || nextval('public.work_order_seq'), q.id, c ->> 'id', q.lead_ref, q.site_name, q.customer_id, c ->> 'partnerId', c ->> 'partnerName', partner,
            c ->> 'kind', coalesce(c ->> 'description', ''), (c ->> 'partnerPriceInr')::bigint, tv.version, demo, me);
    insert into public.work_order_milestones (work_order_id, milestone_id, position, label, gate, pct, amount_inr)
    select wid, t.x ->> 'id', t.ord::int, t.x ->> 'label', t.x ->> 'gate', (t.x ->> 'pct')::int, amounts[t.ord] from jsonb_array_elements(tpl) with ordinality as t(x, ord);
    perform app.wo_event('contract.work_order_created', q.lead_ref,
      jsonb_build_object('workOrderId', wid, 'quoteId', q.id, 'partnerId', c ->> 'partnerId', 'partnerAccountId', partner, 'priceInr', (c ->> 'partnerPriceInr')::bigint, 'kind', c ->> 'kind'));
    made := made || to_jsonb(wid);
  end loop;
  return made;
end $$;

create function public.accept_work_order(p_wo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; side text;
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where id = p_wo for update;
  if w.id is null or not (w.customer_id = me or w.partner_profile_id = me or app.is_admin()) then raise exception 'not_found'; end if;
  if me not in (w.customer_id, w.partner_profile_id) then raise exception 'forbidden'; end if;
  if w.status <> 'issued' then raise exception 'invalid_state'; end if;
  side := case when me = w.customer_id then 'customer' else 'partner' end;
  if side = 'customer' then
    if w.customer_accepted_at is not null then raise exception 'forbidden'; end if;
    update public.work_orders set customer_accepted_at = now() where id = w.id;
  else
    if w.partner_accepted_at is not null then raise exception 'forbidden'; end if;
    update public.work_orders set partner_accepted_at = now() where id = w.id;
  end if;
  perform app.wo_event('contract.accepted_in_app', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'side', side, 'method', 'in_app_acceptance'));
end $$;

create function public.start_work_order(p_wo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; n int;
begin
  if me is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where id = p_wo for update;
  if w.id is null or not (w.customer_id = me or w.partner_profile_id = me or app.is_admin()) then raise exception 'not_found'; end if;
  if w.partner_profile_id <> me then raise exception 'forbidden'; end if;
  if w.status <> 'issued' then raise exception 'wrong_state'; end if;
  if w.customer_accepted_at is null then raise exception 'not_accepted_by_customer'; end if;
  if w.partner_accepted_at is null then raise exception 'not_accepted_by_partner'; end if;
  -- [GAP] no licence or insurance expiry registry exists yet: the gate is the partner account being active.
  if (select status from public.profiles where id = me) <> 'active' then raise exception 'partner_suspended'; end if;
  update public.work_orders set status = 'in_progress', started_at = now() where id = w.id;
  select count(*) into n from public.work_order_milestones where work_order_id = w.id;
  perform app.wo_event('milestone.opened', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'milestones', n));
end $$;

create function public.submit_milestone_evidence(p_wo uuid, p_ms text, p_evidence text[]) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; m public.work_order_milestones; names text[];
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where id = p_wo for update;
  if w.id is null or not (w.customer_id = me or w.partner_profile_id = me or app.is_admin()) then raise exception 'not_found'; end if;
  if w.partner_profile_id <> me then raise exception 'forbidden'; end if;
  if w.status <> 'in_progress' then raise exception 'invalid_state'; end if;
  select * into m from public.work_order_milestones where work_order_id = w.id and milestone_id = p_ms for update;
  if m.work_order_id is null then raise exception 'not_found'; end if;
  select coalesce(array_agg(btrim(n) order by o), '{}') into names from unnest(coalesce(p_evidence, '{}')) with ordinality as u(n, o) where btrim(n) <> '';
  if cardinality(names) < 1 then raise exception 'evidence_missing'; end if;
  if cardinality(names) > 20 then raise exception 'evidence_too_many'; end if;
  if exists (select 1 from unnest(names) n where length(n) > 200) then raise exception 'evidence_name_long'; end if;
  if m.status in ('payment_recorded', 'closed') then raise exception 'locked'; end if;
  if m.status <> 'waiting' then raise exception 'not_waiting'; end if;
  update public.work_order_milestones set status = 'evidence_submitted', evidence = to_jsonb(names), evidence_by = me, evidence_at = now() where work_order_id = w.id and milestone_id = p_ms;
  perform app.wo_event('milestone.evidence_submitted', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'milestoneId', p_ms, 'evidence', to_jsonb(names), 'submitterId', me));
end $$;

create function public.verify_milestone(p_wo uuid, p_ms text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; m public.work_order_milestones;
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where id = p_wo for update;
  if w.id is null or not (w.customer_id = me or w.partner_profile_id = me or app.is_admin()) then raise exception 'not_found'; end if;
  -- Verification outcomes are the Owner's (master prompt P1). Admin watches; a QC inspector arrives with QC tasks.
  if not app.is_owner() then raise exception 'forbidden'; end if;
  if w.status <> 'in_progress' then raise exception 'invalid_state'; end if;
  select * into m from public.work_order_milestones where work_order_id = w.id and milestone_id = p_ms for update;
  if m.work_order_id is null then raise exception 'not_found'; end if;
  if m.status in ('payment_recorded', 'closed') then raise exception 'locked'; end if;
  if m.status <> 'evidence_submitted' then raise exception 'not_submitted'; end if;
  if m.evidence_by = me then raise exception 'self_verify'; end if;
  update public.work_order_milestones set status = 'verified', verified_by = me, verified_at = now() where work_order_id = w.id and milestone_id = p_ms;
  perform app.wo_event('milestone.verified', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'milestoneId', p_ms, 'amountInr', m.amount_inr, 'verifierId', me));
end $$;

create function public.record_milestone_payment(p_wo uuid, p_ms text, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; m public.work_order_milestones; ref text := btrim(coalesce(p_reference, ''));
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where id = p_wo for update;
  if w.id is null or not (w.customer_id = me or w.partner_profile_id = me or app.is_admin()) then raise exception 'not_found'; end if;
  if w.customer_id <> me then raise exception 'forbidden'; end if;
  select * into m from public.work_order_milestones where work_order_id = w.id and milestone_id = p_ms for update;
  if m.work_order_id is null then raise exception 'not_found'; end if;
  if length(ref) < 4 then raise exception 'reference_short'; end if;
  if length(ref) > 60 then raise exception 'reference_long'; end if;
  if m.status in ('payment_recorded', 'closed') then raise exception 'locked'; end if;
  if m.status <> 'verified' then raise exception 'not_payable'; end if;
  update public.work_order_milestones set status = 'payment_recorded', payment_reference = ref, paid_by = me, paid_at = now() where work_order_id = w.id and milestone_id = p_ms;
  if not exists (select 1 from public.work_order_milestones x where x.work_order_id = w.id and x.status not in ('payment_recorded', 'closed')) then
    update public.work_orders set status = 'completed' where id = w.id;
  end if;
  -- The platform records the payment the customer made to the partner. It does not move this money.
  perform app.wo_event('milestone.payment_recorded', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'milestoneId', p_ms, 'amountInr', m.amount_inr, 'reference', ref, 'movedByPlatform', false));
end $$;

revoke execute on function public.create_work_orders(uuid, jsonb), public.accept_work_order(uuid), public.start_work_order(uuid),
  public.submit_milestone_evidence(uuid, text, text[]), public.verify_milestone(uuid, text), public.record_milestone_payment(uuid, text, text) from public, anon;
grant execute on function public.create_work_orders(uuid, jsonb), public.accept_work_order(uuid), public.start_work_order(uuid),
  public.submit_milestone_evidence(uuid, text, text[]), public.verify_milestone(uuid, text), public.record_milestone_payment(uuid, text, text) to authenticated;
