-- Customer complaints and service tracking, and plain partner trust counts.
-- A customer raises a complaint about a project (optionally about one work order); the Owner acknowledges and resolves it with an outcome and a note the
-- customer can read. Additive. Rollback (only if nothing depends on it):
--   drop function public.raise_complaint(uuid, uuid, text, text, uuid), public.acknowledge_complaint(uuid), public.resolve_complaint(uuid, text, text), public.partner_trust(uuid);
--   drop table public.complaints; drop sequence public.complaint_seq; drop function app.complaint_guard(), app.complaint_refuse_delete();

create sequence public.complaint_seq start 1001;

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('AIEC-CP-' || nextval('public.complaint_seq')),
  quote_id uuid not null,
  work_order_id uuid references public.work_orders (id),
  lead_ref text not null,
  customer_id uuid not null references public.profiles (id),
  category text not null check (category in ('defect', 'delay', 'payment', 'safety', 'conduct', 'other')),
  description text not null check (length(btrim(description)) between 15 and 1000),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  ack_due_at timestamptz not null,
  acknowledged_at timestamptz, acknowledged_by uuid references public.profiles (id),
  resolved_at timestamptz, resolved_by uuid references public.profiles (id),
  outcome text check (outcome in ('upheld', 'not_upheld', 'settled')),
  resolution_note text,
  client_event_id uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (customer_id, client_event_id)
);

-- Not security definer: the rules hold for a browser, a function and the server alike.
create function app.complaint_guard() returns trigger language plpgsql as $$
begin
  if old.status = 'resolved' then raise exception 'complaint_is_locked'; end if;
  if new.id is distinct from old.id or new.code is distinct from old.code or new.quote_id is distinct from old.quote_id or new.work_order_id is distinct from old.work_order_id
     or new.lead_ref is distinct from old.lead_ref or new.customer_id is distinct from old.customer_id or new.category is distinct from old.category
     or new.description is distinct from old.description or new.ack_due_at is distinct from old.ack_due_at or new.client_event_id is distinct from old.client_event_id
     or new.is_demo is distinct from old.is_demo or new.created_at is distinct from old.created_at then
    raise exception 'complaint_is_fixed';
  end if;
  if new.status is distinct from old.status then
    if not ((old.status = 'open' and new.status = 'acknowledged') or (old.status = 'acknowledged' and new.status = 'resolved')) then raise exception 'invalid_state'; end if;
    if new.status = 'acknowledged' and (new.acknowledged_by is null or new.acknowledged_at is null) then raise exception 'invalid_state'; end if;
    if new.status = 'resolved' and (new.outcome is null or new.resolved_by is null or new.resolved_at is null or length(btrim(coalesce(new.resolution_note, ''))) < 15) then raise exception 'note_short'; end if;
  elsif new is distinct from old then
    raise exception 'invalid_state';
  end if;
  return new;
end $$;
create trigger complaint_guard before update on public.complaints for each row execute function app.complaint_guard();
create function app.complaint_refuse_delete() returns trigger language plpgsql as $$ begin raise exception 'complaints_are_kept'; end $$;
create trigger complaint_no_delete before delete or truncate on public.complaints for each statement execute function app.complaint_refuse_delete();

alter table public.complaints enable row level security;
revoke all on public.complaints from anon, authenticated;
grant select on public.complaints to authenticated;
create policy complaint_staff_read on public.complaints for select to authenticated using (app.is_admin() and is_demo = app.my_is_demo());
create policy complaint_customer_read on public.complaints for select to authenticated using (customer_id = app.my_profile_id());
-- The partner a complaint names can read it (and its outcome); a complaint that names no work order is not shown to any partner.
create policy complaint_partner_read on public.complaints for select to authenticated
  using (work_order_id is not null and exists (select 1 from public.work_orders w where w.id = work_order_id and w.partner_profile_id = app.my_profile_id()));

create function public.raise_complaint(p_quote uuid, p_wo uuid, p_category text, p_text text, p_client uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; t text := btrim(coalesce(p_text, '')); id uuid; due interval;
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where quote_id = p_quote and customer_id = me and is_demo = app.my_is_demo() limit 1;
  if w.id is null then raise exception 'not_found'; end if;
  if p_category is null or p_category not in ('defect', 'delay', 'payment', 'safety', 'conduct', 'other') then raise exception 'category_invalid'; end if;
  if length(t) < 15 then raise exception 'text_short'; end if;
  if length(t) > 1000 then raise exception 'text_long'; end if;
  if p_wo is not null and not exists (select 1 from public.work_orders x where x.id = p_wo and x.quote_id = p_quote) then raise exception 'not_found'; end if;
  if p_client is not null then
    select c.id into id from public.complaints c where c.customer_id = me and c.client_event_id = p_client;
    if id is not null then return id; end if; -- a double tap or a retry after a lost reply is the same complaint
  end if;
  due := case when p_category = 'safety' then interval '4 hours' else interval '24 hours' end; -- mirrors ackDueAt() in src/features/complaints/complaint.ts
  insert into public.complaints (quote_id, work_order_id, lead_ref, customer_id, category, description, ack_due_at, client_event_id, is_demo)
  values (p_quote, p_wo, w.lead_ref, me, p_category, t, now() + due, p_client, w.is_demo) returning complaints.id into id;
  perform app.wo_event('complaint.raised', w.lead_ref, jsonb_build_object('complaintId', id, 'quoteId', p_quote, 'workOrderId', p_wo, 'category', p_category));
  return id;
end $$;

create function public.acknowledge_complaint(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); c public.complaints;
begin
  if me is null or not app.is_owner() then raise exception 'forbidden'; end if;
  select * into c from public.complaints where id = p_id and is_demo = app.my_is_demo() for update;
  if c.id is null then raise exception 'not_found'; end if;
  if c.status = 'resolved' then raise exception 'locked'; end if;
  if c.status <> 'open' then raise exception 'not_open'; end if;
  update public.complaints set status = 'acknowledged', acknowledged_by = me, acknowledged_at = now() where id = p_id;
  perform app.wo_event('complaint.acknowledged', c.lead_ref, jsonb_build_object('complaintId', p_id, 'overdue', now() > c.ack_due_at));
end $$;

create function public.resolve_complaint(p_id uuid, p_outcome text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); c public.complaints; n text := btrim(coalesce(p_note, ''));
begin
  if me is null or not app.is_owner() then raise exception 'forbidden'; end if;
  select * into c from public.complaints where id = p_id and is_demo = app.my_is_demo() for update;
  if c.id is null then raise exception 'not_found'; end if;
  if c.status = 'resolved' then raise exception 'locked'; end if;
  if c.status <> 'acknowledged' then raise exception 'not_acknowledged'; end if;
  if p_outcome is null or p_outcome not in ('upheld', 'not_upheld', 'settled') then raise exception 'outcome_invalid'; end if;
  if length(n) < 15 then raise exception 'note_short'; end if;
  update public.complaints set status = 'resolved', outcome = p_outcome, resolution_note = n, resolved_by = me, resolved_at = now() where id = p_id;
  perform app.wo_event('complaint.resolved', c.lead_ref, jsonb_build_object('complaintId', p_id, 'outcome', p_outcome));
end $$;

-- Plain counts about a partner, with no hidden weighting. Staff and the partner themself may read them.
create function public.partner_trust(p_profile uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); v int; cl int; raised int; upheld int;
begin
  if me is null or not (app.is_admin() or me = p_profile) then raise exception 'forbidden'; end if;
  select count(*) filter (where m.status in ('verified', 'payment_recorded', 'closed')), count(*) filter (where m.status = 'closed') into v, cl
    from public.work_orders w join public.work_order_milestones m on m.work_order_id = w.id where w.partner_profile_id = p_profile and w.is_demo = app.my_is_demo();
  select count(*), count(*) filter (where c.outcome = 'upheld') into raised, upheld
    from public.complaints c join public.work_orders w on w.id = c.work_order_id where w.partner_profile_id = p_profile and c.is_demo = app.my_is_demo();
  return jsonb_build_object('verifiedMilestones', v, 'closedMilestones', cl, 'complaintsRaised', raised, 'complaintsUpheld', upheld);
end $$;

revoke execute on function public.raise_complaint(uuid, uuid, text, text, uuid), public.acknowledge_complaint(uuid), public.resolve_complaint(uuid, text, text), public.partner_trust(uuid) from public, anon;
grant execute on function public.raise_complaint(uuid, uuid, text, text, uuid), public.acknowledge_complaint(uuid), public.resolve_complaint(uuid, text, text), public.partner_trust(uuid) to authenticated;
