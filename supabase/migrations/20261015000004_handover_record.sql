-- Handover and Completion Record: the customer, the installer and the QC inspector the Owner named each acknowledge in the app,
-- and the final (handover-gated) milestone cannot be verified until all have. It is not a statutory NOC and not an e-signature.
-- Additive. Rollback (only if nothing depends on it): restore verify_milestone from 20261015000002, then
--   drop function public.acknowledge_handover(uuid); drop function app.handover_complete(uuid), app.handover_parties(uuid);
--   drop function public.project_view(uuid); drop table public.handover_acknowledgements;

create table public.handover_acknowledgements (
  quote_id uuid not null,
  role text not null check (role in ('customer', 'installer', 'qc')),
  profile_id uuid not null references public.profiles (id),
  acknowledged_at timestamptz not null default now(),
  is_demo boolean not null default false,
  primary key (quote_id, role, profile_id)
);
alter table public.handover_acknowledgements enable row level security;
revoke all on public.handover_acknowledgements from anon, authenticated;
grant select on public.handover_acknowledgements to authenticated;
-- Readable exactly when the project's orders are (the sub-select is itself filtered by the work-order rules).
create policy handover_ack_read on public.handover_acknowledgements for select to authenticated
  using (exists (select 1 from public.work_orders w where w.quote_id = handover_acknowledgements.quote_id));
create function app.handover_ack_refuse() returns trigger language plpgsql as $$ begin raise exception 'handover_is_kept'; end $$;
create trigger handover_ack_no_change before update or delete on public.handover_acknowledgements for each row execute function app.handover_ack_refuse();
create trigger handover_ack_no_truncate before truncate on public.handover_acknowledgements for each statement execute function app.handover_ack_refuse();

-- Who must acknowledge. Mirrors handoverParties() in src/features/projects/project.ts; a parity test keeps them identical.
create function app.handover_parties(p_quote uuid) returns table (role text, profile_id uuid)
language sql stable security definer set search_path = public as $$
  select distinct 'customer'::text, w.customer_id from public.work_orders w where w.quote_id = p_quote
  union
  select distinct 'installer'::text, w.partner_profile_id from public.work_orders w where w.quote_id = p_quote and w.kind = 'installation'
  union
  select distinct 'qc'::text, a.inspector_id from public.work_order_qc_assignments a
    join public.work_orders w on w.id = a.work_order_id
    join public.work_order_milestones m on m.work_order_id = a.work_order_id and m.milestone_id = a.milestone_id
    where w.quote_id = p_quote and w.kind = 'installation' and m.gate = 'on_handover';
$$;
revoke execute on function app.handover_parties(uuid) from public, anon;

create function app.handover_qc_missing(p_quote uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.work_orders w where w.quote_id = p_quote and w.kind = 'installation')
     and not exists (select 1 from app.handover_parties(p_quote) p where p.role = 'qc');
$$;
revoke execute on function app.handover_qc_missing(uuid) from public, anon;

create function app.handover_ready(p_quote uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.work_orders w where w.quote_id = p_quote)
     and not exists (select 1 from public.work_orders w join public.work_order_milestones m on m.work_order_id = w.id
                     where w.quote_id = p_quote and m.gate <> 'on_handover' and m.status not in ('verified', 'payment_recorded', 'closed'));
$$;
revoke execute on function app.handover_ready(uuid) from public, anon;

create function app.handover_complete(p_quote uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from app.handover_parties(p_quote))
     and not app.handover_qc_missing(p_quote)
     and not exists (select 1 from app.handover_parties(p_quote) p
                     where not exists (select 1 from public.handover_acknowledgements a where a.quote_id = p_quote and a.role = p.role and a.profile_id = p.profile_id));
$$;
revoke execute on function app.handover_complete(uuid) from public, anon;
grant execute on function app.handover_complete(uuid), app.handover_parties(uuid), app.handover_ready(uuid), app.handover_qc_missing(uuid) to authenticated;

create function public.acknowledge_handover(p_quote uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); r record; w public.work_orders; did boolean := false;
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where quote_id = p_quote limit 1;
  if w.id is null or w.is_demo <> app.my_is_demo() then raise exception 'not_found'; end if;
  if not exists (select 1 from app.handover_parties(p_quote) p where p.profile_id = me) then raise exception 'not_a_party'; end if;
  if not app.handover_ready(p_quote) then raise exception 'handover_not_ready'; end if;
  if app.handover_qc_missing(p_quote) then raise exception 'qc_missing'; end if;
  for r in select * from app.handover_parties(p_quote) p where p.profile_id = me loop
    if not exists (select 1 from public.handover_acknowledgements a where a.quote_id = p_quote and a.role = r.role and a.profile_id = me) then
      insert into public.handover_acknowledgements (quote_id, role, profile_id, is_demo) values (p_quote, r.role, me, w.is_demo);
      perform app.wo_event('contract.accepted_in_app', w.lead_ref, jsonb_build_object('quoteId', p_quote, 'kind', 'handover', 'role', r.role, 'method', 'in_app_acceptance'));
      did := true;
    end if;
  end loop;
  if not did then raise exception 'already_acknowledged'; end if;
  if app.handover_complete(p_quote) then
    perform app.wo_event('installation.completed', w.lead_ref, jsonb_build_object('quoteId', p_quote, 'record', 'handover_and_completion', 'statutoryNoc', false));
  end if;
end $$;
revoke execute on function public.acknowledge_handover(uuid) from public, anon;
grant execute on function public.acknowledge_handover(uuid) to authenticated;

-- verify_milestone: as in 20261015000002, plus the handover gate.
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
  if m.gate = 'on_handover' and not app.handover_complete(w.quote_id) then raise exception 'handover_unsigned'; end if;
  update public.work_order_milestones set status = 'verified', verified_by = me, verified_at = now() where work_order_id = w.id and milestone_id = p_ms;
  perform app.wo_event('milestone.verified', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'milestoneId', p_ms, 'amountInr', m.amount_inr, 'verifierId', me));
end $$;

-- One project (a quote's work orders) as the caller may see it: progress across ALL its orders, handover state and who has acknowledged.
-- Amounts only for staff and the customer; a partner or inspector sees the percentage, not other people's money. Mirrors projectProgress().
create function public.project_view(p_quote uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); staff boolean := app.is_admin(); demo boolean := app.my_is_demo();
        total numeric; verified numeric; paid numeric; is_customer boolean; q record; parties jsonb;
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.work_orders w where w.quote_id = p_quote and w.is_demo = demo
                 and ((staff) or w.customer_id = me or w.partner_profile_id = me or app.is_wo_inspector(w.id))) then raise exception 'not_found'; end if;
  select coalesce(sum(m.amount_inr), 0), coalesce(sum(m.amount_inr) filter (where m.status in ('verified', 'payment_recorded', 'closed')), 0),
         coalesce(sum(m.amount_inr) filter (where m.status in ('payment_recorded', 'closed')), 0)
    into total, verified, paid
    from public.work_orders w join public.work_order_milestones m on m.work_order_id = w.id where w.quote_id = p_quote;
  select exists (select 1 from public.work_orders w where w.quote_id = p_quote and w.customer_id = me) into is_customer;
  select site_name into q from public.work_orders where quote_id = p_quote limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('role', p.role, 'accountId', p.profile_id, 'name', pr.name,
           'signed', exists (select 1 from public.handover_acknowledgements a where a.quote_id = p_quote and a.role = p.role and a.profile_id = p.profile_id)) order by p.role), '[]'::jsonb)
    into parties from app.handover_parties(p_quote) p join public.profiles pr on pr.id = p.profile_id;
  return jsonb_build_object(
    'quoteId', p_quote,
    'siteName', q.site_name,
    'percent', case when total = 0 then 0 else floor(verified * 100 / total) end,
    'amounts', case when staff or is_customer then jsonb_build_object('verifiedInr', verified, 'paidInr', paid, 'totalInr', total) else null end,
    'ready', app.handover_ready(p_quote),
    'qcMissing', app.handover_qc_missing(p_quote),
    'complete', app.handover_complete(p_quote),
    'parties', parties);
end $$;
revoke execute on function public.project_view(uuid) from public, anon;
grant execute on function public.project_view(uuid) to authenticated;
