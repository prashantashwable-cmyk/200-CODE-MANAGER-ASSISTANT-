-- Leads and the ownership rule, kept by the database (master prompt P8.5 / P8.6, moved server-side).
-- A scout captures a site; the SERVER decides who owns it: the first valid capture in the Owner-set radius and window claims it,
-- a later one of the same place is supporting evidence, an unfair-to-order case is left for the Owner.
-- Browsers cannot insert leads or captures directly, cannot choose the time they are received, and cannot reassign ownership.
-- Mirrors src/features/leads/ownership.ts (a unit test compares the two). Starting values are placeholders [ASSUMPTION].

create function app.distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision) returns double precision
language sql immutable as $$
  select 2 * 6371000 * asin(least(1, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2))))
$$;

-- ---- Owner-set rule, append-only versions ----
create table public.ownership_settings_versions (
  version int primary key,
  radius_m numeric not null check (radius_m between 10 and 500),
  window_days numeric not null check (window_days between 1 and 365),
  accuracy_limit_m numeric not null check (accuracy_limit_m between 5 and 200),
  too_close_min numeric not null check (too_close_min between 0 and 120),
  max_offline_h numeric not null check (max_offline_h between 1 and 720),
  set_by uuid references public.profiles (id),
  reason text not null check (length(btrim(reason)) >= 10),
  created_at timestamptz not null default now()
);
insert into public.ownership_settings_versions (version, radius_m, window_days, accuracy_limit_m, too_close_min, max_offline_h, reason)
values (1, 60, 30, 30, 5, 72, 'Starting values for the Owner to replace');

create function app.ownership_guard() returns trigger language plpgsql as $$
begin
  if app.from_client() then
    if not app.is_owner() then raise exception 'owner_only'; end if;
    new.version := (select coalesce(max(version), 0) + 1 from public.ownership_settings_versions);
    new.set_by := app.my_profile_id();
    new.created_at := now();
  end if;
  return new;
end $$;
create trigger ownership_guard before insert on public.ownership_settings_versions for each row execute function app.ownership_guard();
create function app.ownership_refuse_change() returns trigger language plpgsql as $$ begin raise exception 'ownership_history_is_append_only'; end $$;
create trigger ownership_no_change before update or delete or truncate on public.ownership_settings_versions for each statement execute function app.ownership_refuse_change();
alter table public.ownership_settings_versions enable row level security;
create policy own_set_read on public.ownership_settings_versions for select to authenticated using (app.is_admin());
create policy own_set_write on public.ownership_settings_versions for insert to authenticated with check (app.is_owner());
revoke update, delete, truncate on public.ownership_settings_versions from anon, authenticated;
grant select, insert on public.ownership_settings_versions to authenticated;

-- ---- Leads ----
create sequence public.lead_seq start 1001;
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_scout_id uuid not null references public.profiles (id),
  original_scout_id uuid not null references public.profiles (id),
  site_name text not null check (length(btrim(site_name)) > 0),
  builder_name text not null default '',
  contact_name text not null default '',
  contact_phone text not null default '',
  address text not null default '',
  city text not null default '',
  pincode text not null default '',
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  accuracy_m numeric check (accuracy_m >= 0),
  stage text not null default 'captured',
  source text not null default 'field_survey',
  estimated_value bigint not null default 0,
  ownership text not null default 'claimed' check (ownership in ('claimed', 'disputed')),
  customer_id uuid references public.profiles (id),
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  skew_ms bigint not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_geo on public.leads (lat, lng);
create index leads_owner on public.leads (owner_scout_id);

-- Every capture, including the ones that only support an earlier lead.
create table public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id),
  scout_id uuid not null references public.profiles (id),
  outcome text not null check (outcome in ('claims', 'supporting', 'review')),
  review_reason text,
  owner_lead_id uuid references public.leads (id),
  lat double precision not null,
  lng double precision not null,
  accuracy_m numeric,
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  skew_ms bigint not null default 0,
  client_event_id text not null,
  unique (scout_id, client_event_id)
);

-- A case the server will not settle alone. The Owner decides (the Decision Desk reads these).
create table public.lead_reviews (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id),
  owner_lead_id uuid not null references public.leads (id),
  reason text not null check (reason in ('accuracy_conflict', 'too_close_to_order', 'earlier_capture_synced_late')),
  status text not null default 'open' check (status in ('open', 'decided')),
  created_at timestamptz not null default now()
);

-- When a capture really happened, for ordering: the phone's time put right by its measured clock error, never later than received,
-- never older than the offline limit. A phone cannot backdate a lead to take it from someone (mirrors orderingTime).
create function app.ordering_time(captured timestamptz, received timestamptz, skew_ms bigint, max_offline_h numeric) returns timestamptz
language sql immutable as $$
  select greatest(received - make_interval(secs => max_offline_h * 3600), least(received, captured - make_interval(secs => skew_ms / 1000.0)))
$$;

create function public.submit_lead_capture(
  p_client_event_id text, p_site_name text, p_contact_name text, p_contact_phone text, p_builder_name text, p_address text, p_city text, p_pincode text,
  p_lat double precision, p_lng double precision, p_accuracy_m numeric, p_captured_at timestamptz, p_device_sent_at timestamptz, p_scout_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := app.my_profile_id(); my_r public.app_role := app.my_role();
  scout uuid; s public.ownership_settings_versions; received timestamptz := now();
  skew bigint := 0; t_in timestamptz; first_cap public.lead_captures; first_t timestamptz; gap_ms numeric;
  outcome text := 'claims'; reason text; owner_lead uuid; new_lead uuid; prior public.lead_captures; code text; margin numeric; first_poor boolean; now_good boolean;
begin
  if me is null or my_r not in ('surveyor', 'owner') then raise exception 'forbidden'; end if;
  scout := coalesce(p_scout_id, me);
  if my_r = 'surveyor' and scout <> me then raise exception 'forbidden'; end if;
  if p_client_event_id is null or length(p_client_event_id) = 0 then raise exception 'client_event_id_required'; end if;
  if btrim(coalesce(p_site_name, '')) = '' then raise exception 'site_name_required'; end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then raise exception 'location_invalid'; end if;
  -- The same capture sent twice is recorded once.
  select * into prior from public.lead_captures where scout_id = scout and client_event_id = p_client_event_id;
  if prior.id is not null then
    return jsonb_build_object('outcome', prior.outcome, 'leadId', prior.lead_id, 'ownerLeadId', prior.owner_lead_id, 'reason', prior.review_reason, 'duplicate', true);
  end if;
  select * into s from public.ownership_settings_versions order by version desc limit 1;
  if p_device_sent_at is not null then skew := round(extract(epoch from (p_device_sent_at - received)) * 1000); end if;
  t_in := app.ordering_time(coalesce(p_captured_at, received), received, skew, s.max_offline_h);

  -- The earliest claiming capture of the same place inside the window.
  select c.* into first_cap
    from public.lead_captures c
   where c.outcome in ('claims', 'review')
     and t_in - app.ordering_time(c.captured_at, c.received_at, c.skew_ms, s.max_offline_h) <= make_interval(days => s.window_days::int)
     and app.distance_m(c.lat, c.lng, p_lat, p_lng) <= s.radius_m + least(coalesce(c.accuracy_m, 0), coalesce(p_accuracy_m, 0), 40)
   order by app.ordering_time(c.captured_at, c.received_at, c.skew_ms, s.max_offline_h) asc
   limit 1;

  if first_cap.id is not null then
    first_t := app.ordering_time(first_cap.captured_at, first_cap.received_at, first_cap.skew_ms, s.max_offline_h);
    gap_ms := extract(epoch from (t_in - first_t)) * 1000;
    owner_lead := first_cap.lead_id;
    outcome := 'supporting';
    if first_cap.scout_id <> scout then
      first_poor := first_cap.accuracy_m is not null and first_cap.accuracy_m > s.accuracy_limit_m;
      now_good := p_accuracy_m is not null and p_accuracy_m <= s.accuracy_limit_m;
      if abs(gap_ms) <= s.too_close_min * 60000 then outcome := 'review'; reason := 'too_close_to_order';
      elsif first_poor and now_good then outcome := 'review'; reason := 'accuracy_conflict';
      end if;
    end if;
    if outcome = 'supporting' and gap_ms < 0 then
      if first_cap.scout_id = scout then outcome := 'claims'; owner_lead := null;
      else outcome := 'review'; reason := 'earlier_capture_synced_late'; end if;
    end if;
  end if;

  if outcome = 'supporting' then
    insert into public.lead_captures (lead_id, scout_id, outcome, owner_lead_id, lat, lng, accuracy_m, captured_at, received_at, skew_ms, client_event_id)
    values (owner_lead, scout, 'supporting', owner_lead, p_lat, p_lng, p_accuracy_m, coalesce(p_captured_at, received), received, skew, p_client_event_id);
    return jsonb_build_object('outcome', 'supporting', 'leadId', owner_lead, 'ownerLeadId', owner_lead, 'duplicate', false);
  end if;

  code := 'AIEC-L-' || nextval('public.lead_seq');
  insert into public.leads (code, owner_scout_id, original_scout_id, site_name, builder_name, contact_name, contact_phone, address, city, pincode, lat, lng, accuracy_m, ownership, captured_at, received_at, skew_ms, is_demo)
  values (code, scout, scout, btrim(p_site_name), coalesce(p_builder_name, ''), coalesce(p_contact_name, ''), coalesce(p_contact_phone, ''), coalesce(p_address, ''), coalesce(p_city, ''), coalesce(p_pincode, ''),
          p_lat, p_lng, p_accuracy_m, case when outcome = 'review' then 'disputed' else 'claimed' end, coalesce(p_captured_at, received), received, skew,
          coalesce((select is_demo from public.profiles where id = scout), false))
  returning id into new_lead;
  insert into public.lead_captures (lead_id, scout_id, outcome, review_reason, owner_lead_id, lat, lng, accuracy_m, captured_at, received_at, skew_ms, client_event_id)
  values (new_lead, scout, outcome, reason, owner_lead, p_lat, p_lng, p_accuracy_m, coalesce(p_captured_at, received), received, skew, p_client_event_id);
  if outcome = 'review' then
    insert into public.lead_reviews (lead_id, owner_lead_id, reason) values (new_lead, owner_lead, reason);
  end if;
  return jsonb_build_object('outcome', outcome, 'leadId', new_lead, 'ownerLeadId', owner_lead, 'reason', reason, 'duplicate', false);
end $$;
revoke execute on function public.submit_lead_capture from public, anon;
grant execute on function public.submit_lead_capture to authenticated;

-- ---- Who may read what ----
alter table public.leads enable row level security;
alter table public.lead_captures enable row level security;
alter table public.lead_reviews enable row level security;
-- A scout sees their own leads exactly; the Owner sees every site exactly; nobody else reads this table.
create policy leads_scout_read on public.leads for select to authenticated using (owner_scout_id = app.my_profile_id() or original_scout_id = app.my_profile_id());
create policy leads_owner_read on public.leads for select to authenticated using (app.is_owner());
create policy caps_scout_read on public.lead_captures for select to authenticated using (scout_id = app.my_profile_id());
create policy caps_owner_read on public.lead_captures for select to authenticated using (app.is_owner());
create policy rev_owner_read on public.lead_reviews for select to authenticated using (app.is_owner());
revoke insert, update, delete, truncate on public.leads, public.lead_captures, public.lead_reviews from anon, authenticated;
grant select on public.leads, public.lead_captures, public.lead_reviews to authenticated;

-- Admin sees where leads cluster, never a single site: cells of about 1 km with at least 3 leads (privacy by geometry).
create function public.lead_density(p_min int default 3) returns table (cell_lat double precision, cell_lng double precision, leads bigint)
language sql stable security definer set search_path = public as $$
  select round(lat::numeric, 2)::double precision, round(lng::numeric, 2)::double precision, count(*)
    from public.leads
   where app.is_admin()
   group by 1, 2
  having count(*) >= greatest(p_min, 3)
$$;
revoke execute on function public.lead_density from public, anon;
grant execute on function public.lead_density to authenticated;

-- Quotes can now point at a real lead and take the customer from the lead.
alter table public.facilitator_quotes add column lead_id uuid references public.leads (id);
