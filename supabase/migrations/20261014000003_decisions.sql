-- The Owner's Decision Desk, kept by the database (master prompt P1 / P4, moved server-side).
-- The Owner decides; Admin may prepare packets and see status only; a delegate holds one card for a week within the kind's limit.
-- Every decision is an immutable, hash-chained record (SHA-256). Mirrors src/features/authority/authority.ts and
-- src/features/decisions/decisions.ts; tests/db/decisions.test.ts fails if the kinds or the maths drift.

create table public.decision_kinds (
  kind text primary key,
  delegable boolean not null,
  delegate_limit_inr bigint
);
insert into public.decision_kinds (kind, delegable, delegate_limit_inr) values
  ('fee_change', false, null), ('guardrail_change', false, null), ('rate_card_change', false, null), ('partner_admission', true, null),
  ('access_suspension', false, null), ('tier_change', true, null), ('verification_outcome', true, null), ('dispute', false, null),
  ('event_correction', true, null), ('payout_release', true, 50000), ('rule_change', false, null), ('exception', false, null),
  ('lead_ownership_dispute', true, null);
alter table public.decision_kinds enable row level security;
create policy kinds_read on public.decision_kinds for select to authenticated using (true);
revoke insert, update, delete, truncate on public.decision_kinds from anon, authenticated;
grant select on public.decision_kinds to authenticated;

create sequence public.decision_card_seq start 1001;
create table public.decision_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null references public.decision_kinds (kind),
  title text not null check (length(btrim(title)) >= 8),
  summary text not null check (length(btrim(summary)) >= 20),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'info_requested', 'delegated')),
  proposed_by_kind text not null check (proposed_by_kind in ('owner', 'admin', 'system', 'ai')),
  proposed_by uuid references public.profiles (id),
  proposed_by_name text not null,
  amount_inr bigint check (amount_inr >= 0),
  place jsonb,
  evidence jsonb not null default '[]'::jsonb,
  impact jsonb not null default '[]'::jsonb,
  ai jsonb,
  delegated_to uuid references public.profiles (id),
  delegated_at timestamptz,
  source_ref text unique,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.decision_records (
  seq bigint primary key,
  id uuid not null unique default gen_random_uuid(),
  card_id uuid not null references public.decision_cards (id),
  event_type text not null,
  action text not null check (action in ('approve', 'reject', 'edit', 'ask_info', 'delegate')),
  by_profile uuid not null references public.profiles (id),
  by_role public.app_role not null,
  as_kind text not null check (as_kind in ('owner', 'delegate')),
  reason text not null check (length(btrim(reason)) >= 10),
  edits text,
  delegate_to uuid references public.profiles (id),
  at timestamptz not null default now(),
  prev_hash text not null,
  hash text not null
);
create index decision_records_card on public.decision_records (card_id);

create function app.decision_payload(r public.decision_records) returns text
language sql immutable set search_path = public as $$
  select jsonb_build_object('seq', r.seq, 'card_id', r.card_id, 'event_type', r.event_type, 'action', r.action, 'by_profile', r.by_profile,
    'by_role', r.by_role, 'as', r.as_kind, 'reason', r.reason, 'edits', r.edits, 'delegate_to', r.delegate_to,
    'at', to_char(r.at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))::text
$$;
create function app.decision_hash(prev text, r public.decision_records) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(prev || '|' || app.decision_payload(r), 'sha256'), 'hex')
$$;

create function app.decision_refuse_change() returns trigger language plpgsql as $$ begin raise exception 'decision_records_are_immutable'; end $$;
create trigger decision_records_no_change before update or delete or truncate on public.decision_records for each statement execute function app.decision_refuse_change();

-- Cards change only through the functions below.
create function app.decision_card_guard() returns trigger language plpgsql as $$
begin
  if app.from_client() then raise exception 'use_the_decision_functions'; end if;
  return new;
end $$;
create trigger decision_card_guard before insert or update or delete on public.decision_cards for each statement execute function app.decision_card_guard();

-- ---- Preparing a packet (Admin or Owner) ----
create function public.prepare_decision(p_kind text, p_title text, p_summary text, p_amount_inr bigint default null, p_place jsonb default null,
  p_evidence jsonb default '[]', p_impact jsonb default '[]', p_recommendation text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := app.my_profile_id(); r public.app_role := app.my_role(); card public.decision_cards; impact jsonb := coalesce(p_impact, '[]'::jsonb);
begin
  if me is null or r not in ('owner', 'admin') then raise exception 'forbidden'; end if;
  if length(btrim(coalesce(p_title, ''))) < 8 then raise exception 'title_short'; end if;
  if length(btrim(coalesce(p_summary, ''))) < 20 then raise exception 'summary_short'; end if;
  if p_amount_inr is not null and p_amount_inr < 0 then raise exception 'amount_invalid'; end if;
  if not exists (select 1 from public.decision_kinds where kind = p_kind) then raise exception 'kind_invalid'; end if;
  if p_recommendation is not null and btrim(p_recommendation) <> '' then
    impact := impact || to_jsonb('Recommendation from ' || (select name from public.profiles where id = me) || ': ' || btrim(p_recommendation));
  end if;
  insert into public.decision_cards (code, kind, title, summary, proposed_by_kind, proposed_by, proposed_by_name, amount_inr, place, evidence, impact, is_demo)
  values ('AIEC-DC-' || lpad(nextval('public.decision_card_seq')::text, 4, '0'), p_kind, btrim(p_title), btrim(p_summary), r::text, me,
          (select name from public.profiles where id = me), p_amount_inr, p_place, coalesce(p_evidence, '[]'), impact, coalesce((select is_demo from public.profiles where id = me), false))
  returning * into card;
  return jsonb_build_object('id', card.id, 'code', card.code, 'status', card.status);
end $$;
revoke execute on function public.prepare_decision from public, anon;
grant execute on function public.prepare_decision to authenticated;

-- The system raises a card by itself (never callable from a browser). Idempotent on source_ref.
create function app.raise_decision(p_kind text, p_title text, p_summary text, p_source_ref text, p_by text, p_amount_inr bigint default null, p_place jsonb default null,
  p_evidence jsonb default '[]', p_impact jsonb default '[]') returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select id into cid from public.decision_cards where source_ref = p_source_ref;
  if cid is not null then return cid; end if;
  insert into public.decision_cards (code, kind, title, summary, proposed_by_kind, proposed_by_name, amount_inr, place, evidence, impact, source_ref)
  values ('AIEC-DC-' || lpad(nextval('public.decision_card_seq')::text, 4, '0'), p_kind, p_title, p_summary, 'system', p_by, p_amount_inr, p_place, p_evidence, p_impact, p_source_ref)
  returning id into cid;
  return cid;
end $$;
revoke execute on function app.raise_decision from public, anon, authenticated;

-- ---- Deciding ----
create function public.decide_decision(p_card uuid, p_action text, p_reason text, p_edits text default null, p_delegate_to uuid default null) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  me uuid := app.my_profile_id(); r public.app_role := app.my_role(); card public.decision_cards; k public.decision_kinds;
  how text; new_status text; rec public.decision_records; last_seq bigint; last_hash text; at_ timestamptz := now();
begin
  if me is null then raise exception 'forbidden'; end if;
  select * into card from public.decision_cards where id = p_card for update;
  if card.id is null then raise exception 'not_found'; end if;
  select * into k from public.decision_kinds where kind = card.kind;
  if r = 'owner' then how := 'owner';
  elsif r = 'admin' then raise exception 'admin_cannot_decide';
  elsif card.delegated_to = me and card.delegated_at is not null and at_ < card.delegated_at + interval '7 days' then
    if not k.delegable then raise exception 'forbidden'; end if;
    if card.amount_inr is not null and k.delegate_limit_inr is not null and card.amount_inr > k.delegate_limit_inr then raise exception 'forbidden'; end if;
    how := 'delegate';
  else raise exception 'forbidden'; end if;
  if card.status in ('approved', 'rejected') then raise exception 'already_decided'; end if;
  if p_action not in ('approve', 'reject', 'edit', 'ask_info', 'delegate') then raise exception 'action_invalid'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 10 then raise exception 'reason_short'; end if;
  if p_action = 'edit' and btrim(coalesce(p_edits, '')) = '' then raise exception 'edits_missing'; end if;
  if p_action = 'delegate' and p_delegate_to is null then raise exception 'delegate_missing'; end if;
  if p_action = 'delegate' and how = 'delegate' then raise exception 'forbidden'; end if;
  if p_action = 'delegate' and not exists (select 1 from public.profiles where id = p_delegate_to and status = 'active') then raise exception 'delegate_missing'; end if;
  new_status := case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'edit' then 'approved' when 'ask_info' then 'info_requested' else 'delegated' end;

  perform pg_advisory_xact_lock(7402);
  select seq, hash into last_seq, last_hash from public.decision_records order by seq desc limit 1;
  rec.seq := coalesce(last_seq, 0) + 1; rec.card_id := card.id; rec.event_type := 'decision.' || new_status; rec.action := p_action;
  rec.by_profile := me; rec.by_role := r; rec.as_kind := how; rec.reason := btrim(p_reason);
  rec.edits := nullif(btrim(coalesce(p_edits, '')), ''); rec.delegate_to := case when p_action = 'delegate' then p_delegate_to end; rec.at := at_;
  rec.prev_hash := coalesce(last_hash, repeat('0', 64));
  rec.hash := app.decision_hash(rec.prev_hash, rec);
  insert into public.decision_records (seq, card_id, event_type, action, by_profile, by_role, as_kind, reason, edits, delegate_to, at, prev_hash, hash)
  values (rec.seq, rec.card_id, rec.event_type, rec.action, rec.by_profile, rec.by_role, rec.as_kind, rec.reason, rec.edits, rec.delegate_to, rec.at, rec.prev_hash, rec.hash);
  update public.decision_cards set status = new_status,
    decided_at = case when new_status in ('approved', 'rejected') then at_ else decided_at end,
    delegated_to = case when p_action = 'delegate' then p_delegate_to else delegated_to end,
    delegated_at = case when p_action = 'delegate' then at_ else delegated_at end
   where id = card.id;
  return jsonb_build_object('cardId', card.id, 'status', new_status, 'seq', rec.seq, 'hash', rec.hash, 'as', how);
end $$;
revoke execute on function public.decide_decision from public, anon;
grant execute on function public.decide_decision to authenticated;

create function public.verify_decision_chain() returns table (ok boolean, checked bigint, broken_at bigint)
language plpgsql stable security definer set search_path = public, extensions as $$
declare r public.decision_records; prev text := repeat('0', 64); n bigint := 0;
begin
  if not app.is_admin() then raise exception 'forbidden'; end if;
  for r in select * from public.decision_records order by seq loop
    if r.prev_hash <> prev or r.hash <> app.decision_hash(prev, r) then return query select false, n, r.seq; return; end if;
    prev := r.hash; n := n + 1;
  end loop;
  return query select true, n, null::bigint;
end $$;
revoke execute on function public.verify_decision_chain from public, anon;
grant execute on function public.verify_decision_chain to authenticated;

-- ---- Who reads what ----
alter table public.decision_cards enable row level security;
alter table public.decision_records enable row level security;
create policy cards_owner_read on public.decision_cards for select to authenticated using (app.is_owner());
create policy cards_delegate_read on public.decision_cards for select to authenticated using (delegated_to = app.my_profile_id());
create policy records_owner_read on public.decision_records for select to authenticated using (app.is_owner());
create policy records_delegate_read on public.decision_records for select to authenticated using (exists (select 1 from public.decision_cards c where c.id = card_id and c.delegated_to = app.my_profile_id()));
revoke insert, update, delete, truncate on public.decision_cards, public.decision_records from anon, authenticated;
grant select on public.decision_cards, public.decision_records to authenticated;

-- Admin sees that a decision exists and where it stands: no evidence, impact, amounts or AI notes.
create view public.decision_cards_status as
  select id, code, kind, title, status, proposed_by_kind, proposed_by_name, created_at, decided_at, is_demo
    from public.decision_cards where app.is_admin();
grant select on public.decision_cards_status to authenticated;
revoke all on public.decision_cards_status from anon;

-- A scout dispute the server will not settle alone becomes a card for the Owner.
create function app.lead_review_card() returns trigger language plpgsql security definer set search_path = public as $$
declare l public.leads; o public.leads; why text;
begin
  select * into l from public.leads where id = new.lead_id;
  select * into o from public.leads where id = new.owner_lead_id;
  why := case new.reason when 'too_close_to_order' then 'Both were captured within minutes of each other, so the phones’ clocks cannot decide who was first.'
    when 'accuracy_conflict' then 'The earlier capture had a poor GPS reading and the later one a good one.'
    else 'A capture that says it was taken before the lead already on record arrived late.' end;
  perform app.raise_decision('lead_ownership_dispute', 'Two scouts claim ' || l.site_name,
    'Two scouts captured the same site. ' || why || ' The Owner decides who keeps the lead.', 'lead_review:' || new.id, 'Duplicate detection', null,
    jsonb_build_object('lat', l.lat, 'lng', l.lng, 'label', l.city),
    jsonb_build_array(jsonb_build_object('label', 'Earlier lead ' || o.code, 'kind', 'log'), jsonb_build_object('label', 'This lead ' || l.code, 'kind', 'log')),
    jsonb_build_array('The lead stays with its first scout until you decide', 'The other scout’s capture is kept as supporting evidence if you uphold the first'));
  return new;
end $$;
create trigger lead_review_card after insert on public.lead_reviews for each row execute function app.lead_review_card();
