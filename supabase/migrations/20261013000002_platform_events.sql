-- The platform event stream, kept by the database itself (master prompt P9, moved server-side).
-- One append-only, hash-chained table: the map, the Activity Log, timelines and the AI training set are projections of it.
-- The server decides who did it, when, and where in the chain; a browser cannot choose any of those, cannot pose as the system,
-- and cannot edit or delete. A correction is a new event, never an overwrite, and the four correction classes are enforced here.
--
-- The classes of event below mirror src/features/events/eventLog.ts (LOCKED_TYPES, MONEY_OR_RANK_TYPES); a unit test
-- fails if the two lists ever drift.

-- The Owner holds every authority Admin holds. Anything that must stay Owner-only checks app.is_owner() explicitly.
create or replace function app.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(app.my_role() in ('admin', 'owner'), false)
$$;

create function app.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(app.my_role() = 'owner', false)
$$;
grant execute on function app.is_owner() to anon, authenticated, service_role;

-- Class 4, locked: signatures, evidence, payment proofs, safety tripwires, verification reports, closed milestones, decisions.
create function app.event_locked(t text) returns boolean language sql immutable as $$
  select t = any (array['contract.signed','delivery.proof_captured','delivery.material_handover_signed','milestone.payment_recorded','milestone.payment_confirmed','milestone.verified','milestone.closed','safety.tripwire_raised','safety.check_recorded','milestone.evidence_submitted','qc.passed','qc.failed','decision.approved','decision.rejected'])
$$;

-- Class 3: anything touching money, rank or ownership always needs the Owner, however recent.
create function app.event_money_or_rank(t text) returns boolean language sql immutable as $$
  select t = any (array['quote.itemised','quote.component_accepted','tier.changed','payout.approved','payout.released','lead.ownership_claimed','milestone.opened'])
$$;

create table public.platform_events (
  seq bigint primary key,
  id uuid not null unique default gen_random_uuid(),
  event_type text not null check (event_type ~ '^[a-z]+\.[a-z_]+$' and length(event_type) <= 60),
  actor_kind text not null default 'person' check (actor_kind in ('person', 'system', 'ai')),
  actor_profile_id uuid references public.profiles (id),
  actor_role public.app_role,
  subject_kind text not null check (length(subject_kind) between 1 and 40),
  subject_id text not null check (length(subject_id) between 1 and 120),
  -- Device time and server time are never merged. skew_ms is the phone's clock error measured at send, 0 when not measured.
  captured_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  device_sent_at timestamptz,
  skew_ms bigint not null default 0,
  source text not null default 'app' check (source in ('app', 'ai', 'system', 'human')),
  geo_lat double precision check (geo_lat between -90 and 90),
  geo_lng double precision check (geo_lng between -180 and 180),
  geo_accuracy_m integer check (geo_accuracy_m >= 0),
  evidence jsonb not null default '[]'::jsonb,
  ai jsonb,
  reason_tag text check (length(reason_tag) <= 60),
  correlation_id text not null default gen_random_uuid()::text,
  -- Idempotency: the same capture sent twice is recorded once.
  client_event_id text check (length(client_event_id) <= 120),
  about_id uuid references public.platform_events (id),
  payload jsonb not null default '{}'::jsonb check (octet_length(payload::text) <= 20000),
  is_demo boolean not null default false,
  prev_hash text not null,
  hash text not null,
  constraint events_person_has_actor check (actor_kind <> 'person' or actor_profile_id is not null)
);
create unique index platform_events_idempotent on public.platform_events (actor_profile_id, client_event_id) where client_event_id is not null;
create index platform_events_subject on public.platform_events (subject_kind, subject_id);
create index platform_events_actor on public.platform_events (actor_profile_id);
create index platform_events_about on public.platform_events (about_id) where about_id is not null;
create index platform_events_type on public.platform_events (event_type);

-- The exact text a fingerprint covers. UTC times, so the server's time zone setting can never change a fingerprint.
create function app.event_payload(e public.platform_events) returns text
language sql immutable set search_path = public as $$
  select jsonb_build_object(
    'seq', e.seq,
    'event_type', e.event_type,
    'actor_kind', e.actor_kind,
    'actor_profile_id', e.actor_profile_id,
    'actor_role', e.actor_role,
    'subject_kind', e.subject_kind,
    'subject_id', e.subject_id,
    'captured_at', to_char(e.captured_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'received_at', to_char(e.received_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'skew_ms', e.skew_ms,
    'source', e.source,
    'geo', jsonb_build_array(e.geo_lat, e.geo_lng, e.geo_accuracy_m),
    'evidence', e.evidence,
    'ai', e.ai,
    'reason_tag', e.reason_tag,
    'correlation_id', e.correlation_id,
    'client_event_id', e.client_event_id,
    'about_id', e.about_id,
    'payload', e.payload,
    'is_demo', e.is_demo
  )::text
$$;

create function app.event_hash(prev text, e public.platform_events) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(prev || '|' || app.event_payload(e), 'sha256'), 'hex')
$$;

-- Read the newest entry and any target event whatever row-level security would hide, so the chain never forks and rules can look at the target.
create function app.event_last(out last_seq bigint, out last_hash text)
language sql stable security definer set search_path = public as $$
  select seq, hash from public.platform_events order by seq desc limit 1
$$;

create function app.event_get(eid uuid) returns public.platform_events
language sql stable security definer set search_path = public as $$
  select * from public.platform_events where id = eid
$$;

-- Runs as the caller (not security definer), so it can tell a person in the browser from the server.
create function app.events_before_insert() returns trigger
language plpgsql set search_path = public as $$
declare
  last record;
  target public.platform_events;
  me public.app_role;
begin
  perform pg_advisory_xact_lock(hashtext('public.platform_events'));
  select * into last from app.event_last();
  new.seq := coalesce(last.last_seq, 0) + 1;
  new.prev_hash := coalesce(last.last_hash, repeat('0', 64));
  new.id := gen_random_uuid();
  new.received_at := now();
  if new.captured_at is null then new.captured_at := new.received_at; end if;
  new.skew_ms := case when new.device_sent_at is null then 0
                      else round(extract(epoch from (new.device_sent_at - new.received_at)) * 1000)::bigint end;

  if app.from_client() then
    me := app.my_role();
    if me is null then raise exception 'not_active' using errcode = 'P0001'; end if;
    -- A person writes only as themself. A browser cannot claim to be the system or the AI, and cannot pretend a human wrote it.
    new.actor_kind := 'person';
    new.actor_profile_id := app.my_profile_id();
    new.actor_role := me;
    new.is_demo := app.my_is_demo();
    new.source := 'app';
    new.ai := null;
    -- Admin watches; it writes nothing but a flag.
    if me = 'admin' and new.event_type not like 'event.%' then
      raise exception 'admin_read_only' using errcode = 'P0001';
    end if;
    if me = 'admin' and new.event_type <> 'event.flagged' then
      raise exception 'admin_may_only_flag' using errcode = 'P0001';
    end if;
    -- Decisions belong to the Owner.
    if (new.event_type like 'decision.%' or new.event_type = 'correction.rejected') and me <> 'owner' then
      raise exception 'owner_only' using errcode = 'P0001';
    end if;
  end if;

  if new.event_type like 'correction.%' or new.event_type like 'event.%' then
    if new.about_id is null then raise exception 'about_required' using errcode = 'P0001'; end if;
    target := app.event_get(new.about_id);
    if target.id is null then raise exception 'about_not_found' using errcode = 'P0001'; end if;
    new.subject_kind := target.subject_kind;
    new.subject_id := target.subject_id;
    new.is_demo := target.is_demo;

    if app.from_client() then
      -- You may touch an event only if you could see it: the Owner and Admin see all, others their own.
      if me not in ('owner', 'admin') and target.actor_profile_id is distinct from new.actor_profile_id then
        raise exception 'forbidden' using errcode = 'P0001';
      end if;
      if new.event_type in ('correction.applied', 'correction.proposed') and app.event_locked(target.event_type) then
        raise exception 'locked' using errcode = 'P0001';
      end if;
      if new.event_type = 'correction.applied' and me <> 'owner' then
        -- Class 2: the author, inside the window, on something that does not touch money, rank or ownership.
        if app.event_money_or_rank(target.event_type) then raise exception 'needs_owner' using errcode = 'P0001'; end if;
        if target.actor_profile_id is distinct from new.actor_profile_id then raise exception 'not_author' using errcode = 'P0001'; end if;
        if now() - target.received_at > interval '15 minutes' then raise exception 'window_closed' using errcode = 'P0001'; end if;
      end if;
    end if;
  end if;

  new.hash := app.event_hash(new.prev_hash, new);
  return new;
end $$;

create trigger platform_events_chain before insert on public.platform_events
  for each row execute function app.events_before_insert();

create function app.events_refuse_change() returns trigger
language plpgsql as $$
begin
  raise exception 'append_only' using errcode = 'P0001';
end $$;

create trigger platform_events_no_update before update or delete on public.platform_events
  for each row execute function app.events_refuse_change();
create trigger platform_events_no_truncate before truncate on public.platform_events
  for each statement execute function app.events_refuse_change();

revoke update, delete, truncate on public.platform_events from anon, authenticated;

alter table public.platform_events enable row level security;

-- The Owner reads every event of their own world (real or demo); everyone else reads only what they themself did.
-- Admin reads through the masked view below, never this table.
create policy events_read_owner on public.platform_events for select to authenticated
  using (app.is_owner() and is_demo = app.my_is_demo());
create policy events_read_self on public.platform_events for select to authenticated
  using (actor_profile_id = app.my_profile_id());
create policy events_write on public.platform_events for insert to authenticated
  with check (app.my_role() is not null);

-- Contact data is masked for Admin (last four digits) and places are removed: Admin sees how many and what, never who or exactly where.
create function app.mask_event_payload(p jsonb) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_object_agg(
    k,
    case
      when k in ('phone', 'contactPhone', 'mobile') then to_jsonb('••••••' || right(v #>> '{}', 4))
      when k in ('contactName', 'customerName') then to_jsonb('••••'::text)
      else v
    end), '{}'::jsonb)
  from jsonb_each(p) as t(k, v)
  where k not in ('lat', 'lng', 'latitude', 'longitude')
$$;

create view public.platform_events_masked with (security_invoker = false) as
  select seq, id, event_type, actor_role, subject_kind, subject_id, captured_at, received_at, skew_ms, source,
         reason_tag, correlation_id, about_id, app.mask_event_payload(payload) as payload, is_demo
  from public.platform_events
  where app.my_role() = 'admin' and is_demo = app.my_is_demo();
grant select on public.platform_events_masked to authenticated;
revoke all on public.platform_events_masked from anon;

-- Walks the whole chain and says whether it holds, and if not, the first entry that does not.
create function app.verify_event_chain()
returns table (ok boolean, checked bigint, broken_at bigint)
language plpgsql stable security definer set search_path = public as $$
declare
  e public.platform_events;
  prev text := repeat('0', 64);
  expected_seq bigint := 1;
  n bigint := 0;
begin
  for e in select * from public.platform_events order by seq loop
    if e.seq <> expected_seq or e.prev_hash <> prev or e.hash <> app.event_hash(prev, e) then
      return query select false, n, expected_seq;
      return;
    end if;
    prev := e.hash;
    expected_seq := expected_seq + 1;
    n := n + 1;
  end loop;
  return query select true, n, null::bigint;
end $$;

revoke execute on function app.verify_event_chain() from public, anon;
grant execute on function app.verify_event_chain() to authenticated, service_role;
