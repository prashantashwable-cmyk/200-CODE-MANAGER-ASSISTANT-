-- The partner a complaint names may answer it once (master prompt: partner reply path). Additive.
-- Rollback: drop function public.reply_to_complaint(uuid, text);
--           alter table public.complaints drop column partner_reply, drop column partner_replied_at, drop column partner_replied_by;
--           and recreate app.complaint_guard() as in 20261015000005_complaints.sql.

alter table public.complaints
  add column partner_reply text check (partner_reply is null or length(btrim(partner_reply)) between 15 and 1000),
  add column partner_replied_at timestamptz,
  add column partner_replied_by uuid references public.profiles (id);

-- Same rules as before, plus: the three reply columns may be set once, together, on a complaint that is not resolved; nothing else changes with them.
create or replace function app.complaint_guard() returns trigger language plpgsql as $$
begin
  if old.status = 'resolved' then raise exception 'complaint_is_locked'; end if;
  if new.id is distinct from old.id or new.code is distinct from old.code or new.quote_id is distinct from old.quote_id or new.work_order_id is distinct from old.work_order_id
     or new.lead_ref is distinct from old.lead_ref or new.customer_id is distinct from old.customer_id or new.category is distinct from old.category
     or new.description is distinct from old.description or new.ack_due_at is distinct from old.ack_due_at or new.client_event_id is distinct from old.client_event_id
     or new.is_demo is distinct from old.is_demo or new.created_at is distinct from old.created_at then
    raise exception 'complaint_is_fixed';
  end if;
  if old.partner_reply is not null and (new.partner_reply is distinct from old.partner_reply or new.partner_replied_at is distinct from old.partner_replied_at or new.partner_replied_by is distinct from old.partner_replied_by) then
    raise exception 'complaint_is_fixed';
  end if;
  if old.partner_reply is null and new.partner_reply is not null then
    if new.status is distinct from old.status or new.partner_replied_at is null or new.partner_replied_by is null then raise exception 'invalid_state'; end if;
    return new;
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

create function public.reply_to_complaint(p_id uuid, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); c public.complaints; t text := btrim(coalesce(p_text, ''));
begin
  if me is null or app.my_role() is null then raise exception 'forbidden'; end if;
  select * into c from public.complaints where id = p_id and is_demo = app.my_is_demo() for update;
  if c.id is null then raise exception 'not_found'; end if;
  if c.work_order_id is null or not exists (select 1 from public.work_orders w where w.id = c.work_order_id and w.partner_profile_id = me) then raise exception 'forbidden'; end if;
  if c.status = 'resolved' then raise exception 'locked'; end if;
  if c.partner_reply is not null then raise exception 'already_replied'; end if;
  if length(t) < 15 then raise exception 'reply_short'; end if;
  if length(t) > 1000 then raise exception 'text_long'; end if;
  update public.complaints set partner_reply = t, partner_replied_at = now(), partner_replied_by = me where id = p_id;
  perform app.wo_event('complaint.replied', c.lead_ref, jsonb_build_object('complaintId', p_id));
end $$;

revoke execute on function public.reply_to_complaint(uuid, text) from public, anon;
grant execute on function public.reply_to_complaint(uuid, text) to authenticated;
