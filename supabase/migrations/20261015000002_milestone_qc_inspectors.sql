-- Milestone QC inspectors: the Owner names the technician who checks one milestone; only that person (or the Owner) can verify it.
-- Additive. Rollback (only if nothing depends on it):
--   drop function public.assign_milestone_inspector(uuid, text, uuid); (then restore verify_milestone from 20261015000001)
--   drop policy wo_inspector_read on public.work_orders; drop table public.work_order_qc_assignments;
--   drop function app.is_wo_inspector(uuid);

create table public.work_order_qc_assignments (
  work_order_id uuid not null,
  milestone_id text not null,
  inspector_id uuid not null references public.profiles (id),
  assigned_by uuid not null references public.profiles (id),
  assigned_at timestamptz not null default now(),
  primary key (work_order_id, milestone_id),
  foreign key (work_order_id, milestone_id) references public.work_order_milestones (work_order_id, milestone_id)
);

alter table public.work_order_qc_assignments enable row level security;
revoke all on public.work_order_qc_assignments from anon, authenticated;
grant select on public.work_order_qc_assignments to authenticated;
create policy wo_qc_staff_read on public.work_order_qc_assignments for select to authenticated
  using (exists (select 1 from public.work_orders w where w.id = work_order_id and app.is_admin() and w.is_demo = app.my_is_demo()));
create policy wo_qc_inspector_read on public.work_order_qc_assignments for select to authenticated using (inspector_id = app.my_profile_id());
-- The partner and customer see who checks their milestone, nothing else about the assignment.
create policy wo_qc_party_read on public.work_order_qc_assignments for select to authenticated
  using (exists (select 1 from public.work_orders w where w.id = work_order_id and (w.customer_id = app.my_profile_id() or w.partner_profile_id = app.my_profile_id())));

-- An inspector can read the orders they have been asked to check (and, through the existing policy, their milestones).
-- Security definer on purpose: the assignment table has its own row rules and this must not recurse through them.
create function app.is_wo_inspector(p_wo uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.work_order_qc_assignments a where a.work_order_id = p_wo and a.inspector_id = app.my_profile_id());
$$;
revoke execute on function app.is_wo_inspector(uuid) from public, anon;
grant execute on function app.is_wo_inspector(uuid) to authenticated;
create policy wo_inspector_read on public.work_orders for select to authenticated using (app.is_wo_inspector(id));

create function public.assign_milestone_inspector(p_wo uuid, p_ms text, p_inspector uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; m public.work_order_milestones;
begin
  if me is null or not app.is_owner() then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where id = p_wo for update;
  if w.id is null or w.is_demo <> app.my_is_demo() then raise exception 'not_found'; end if;
  if w.status <> 'in_progress' then raise exception 'invalid_state'; end if;
  select * into m from public.work_order_milestones where work_order_id = w.id and milestone_id = p_ms for update;
  if m.work_order_id is null then raise exception 'not_found'; end if;
  if m.status in ('payment_recorded', 'closed') then raise exception 'locked'; end if;
  if m.status = 'verified' then raise exception 'invalid_state'; end if;
  if p_inspector is null then raise exception 'qc_inspector_required'; end if;
  if p_inspector = w.partner_profile_id then raise exception 'inspector_is_partner'; end if;
  if not exists (select 1 from public.profiles p where p.id = p_inspector and p.status = 'active' and p.role = 'technician' and p.is_demo = w.is_demo and p.id <> w.customer_id) then
    raise exception 'inspector_not_eligible';
  end if;
  insert into public.work_order_qc_assignments (work_order_id, milestone_id, inspector_id, assigned_by)
  values (w.id, p_ms, p_inspector, me)
  on conflict (work_order_id, milestone_id) do update set inspector_id = excluded.inspector_id, assigned_by = excluded.assigned_by, assigned_at = now();
  perform app.wo_event('qc.assigned', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'milestoneId', p_ms, 'inspectorId', p_inspector));
end $$;
revoke execute on function public.assign_milestone_inspector(uuid, text, uuid) from public, anon;
grant execute on function public.assign_milestone_inspector(uuid, text, uuid) to authenticated;

-- verify_milestone: the Owner, or the technician named for this milestone. Everything else is as before.
create or replace function public.verify_milestone(p_wo uuid, p_ms text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; m public.work_order_milestones;
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where id = p_wo for update;
  if w.id is null or not (w.customer_id = me or w.partner_profile_id = me or app.is_admin() or app.is_wo_inspector(w.id)) then raise exception 'not_found'; end if;
  if me = w.partner_profile_id then raise exception 'forbidden'; end if;
  if not app.is_owner() and not exists (select 1 from public.work_order_qc_assignments a where a.work_order_id = w.id and a.milestone_id = p_ms and a.inspector_id = me) then
    raise exception 'forbidden';
  end if;
  if w.status <> 'in_progress' then raise exception 'invalid_state'; end if;
  select * into m from public.work_order_milestones where work_order_id = w.id and milestone_id = p_ms for update;
  if m.work_order_id is null then raise exception 'not_found'; end if;
  if m.status in ('payment_recorded', 'closed') then raise exception 'locked'; end if;
  if m.status <> 'evidence_submitted' then raise exception 'not_submitted'; end if;
  if m.evidence_by = me then raise exception 'self_verify'; end if;
  update public.work_order_milestones set status = 'verified', verified_by = me, verified_at = now() where work_order_id = w.id and milestone_id = p_ms;
  perform app.wo_event('milestone.verified', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'milestoneId', p_ms, 'amountInr', m.amount_inr, 'verifierId', me));
end $$;
