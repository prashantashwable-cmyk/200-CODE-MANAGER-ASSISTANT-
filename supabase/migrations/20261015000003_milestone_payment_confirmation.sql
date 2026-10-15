-- The partner confirms they received the money the customer recorded; that closes the milestone. The platform still moves nothing.
-- Additive. Rollback (only if nothing depends on it):
--   drop function public.confirm_milestone_payment(uuid, text);
--   alter table public.work_order_milestones drop column confirmed_by, drop column confirmed_at;  (then restore app.wo_milestone_guard from 20261015000001)

alter table public.work_order_milestones add column confirmed_by uuid references public.profiles (id), add column confirmed_at timestamptz;

create or replace function app.wo_milestone_guard() returns trigger language plpgsql as $$
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
  -- The one step allowed on a paid milestone: the partner's confirmation closes it, and nothing else about it changes.
  if old.status = 'payment_recorded' and new.status = 'closed' then
    if new.confirmed_by is null or new.confirmed_at is null then raise exception 'invalid_state'; end if;
    if (new.evidence, new.evidence_by, new.evidence_at, new.verified_by, new.verified_at, new.payment_reference, new.paid_by, new.paid_at)
       is distinct from (old.evidence, old.evidence_by, old.evidence_at, old.verified_by, old.verified_at, old.payment_reference, old.paid_by, old.paid_at) then
      raise exception 'milestone_is_locked';
    end if;
    return new;
  end if;
  -- A paid (or closed) milestone is a locked record: nothing about it changes again.
  if old.status in ('payment_recorded', 'closed') then raise exception 'milestone_is_locked'; end if;
  if new.confirmed_by is not null or new.confirmed_at is not null then raise exception 'invalid_state'; end if;
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

create function public.confirm_milestone_payment(p_wo uuid, p_ms text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); w public.work_orders; m public.work_order_milestones;
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into w from public.work_orders where id = p_wo for update;
  if w.id is null or not (w.customer_id = me or w.partner_profile_id = me or app.is_admin()) then raise exception 'not_found'; end if;
  if w.partner_profile_id <> me then raise exception 'forbidden'; end if; -- only the partner who was paid can say they were paid
  select * into m from public.work_order_milestones where work_order_id = w.id and milestone_id = p_ms for update;
  if m.work_order_id is null then raise exception 'not_found'; end if;
  if m.status = 'closed' then raise exception 'already_confirmed'; end if;
  if m.status <> 'payment_recorded' then raise exception 'not_recorded'; end if;
  update public.work_order_milestones set status = 'closed', confirmed_by = me, confirmed_at = now() where work_order_id = w.id and milestone_id = p_ms;
  perform app.wo_event('milestone.payment_confirmed', w.lead_ref, jsonb_build_object('workOrderId', w.id, 'milestoneId', p_ms, 'amountInr', m.amount_inr, 'reference', m.payment_reference, 'movedByPlatform', false));
end $$;
revoke execute on function public.confirm_milestone_payment(uuid, text) from public, anon;
grant execute on function public.confirm_milestone_payment(uuid, text) to authenticated;
