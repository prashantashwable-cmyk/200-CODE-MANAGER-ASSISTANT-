-- S0c: the one permanent record, kept by the database itself (187's chain, moved server-side).
-- Every entry carries the fingerprint of the one before it (SHA-256), so changing or removing any entry
-- breaks every fingerprint after it, and app.verify_audit_chain() says exactly where. Entries are never
-- updated or deleted, by anyone. The server sets the sequence, the time and (for a person) who did it;
-- nothing the browser sends can choose those.

-- Supabase ships pgcrypto in the extensions schema; this is a no-op there.
create extension if not exists pgcrypto with schema extensions;

create table public.audit_events (
  seq bigint primary key,
  id uuid not null unique default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_kind text not null check (actor_kind in ('person', 'automation')),
  actor_profile_id uuid references public.profiles (id),
  source_key text not null check (length(source_key) between 1 and 120),
  record_type text not null default 'other' check (length(record_type) between 1 and 40),
  record_id text,
  -- What happened, in English exactly as written (shown as recorded, never translated or edited).
  summary text not null check (length(summary) between 1 and 2000),
  detail jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  prev_hash text not null,
  hash text not null,
  constraint audit_person_has_actor check (actor_kind <> 'person' or actor_profile_id is not null)
);
create index audit_events_record on public.audit_events (record_type, record_id);
create index audit_events_actor on public.audit_events (actor_profile_id);

-- The exact text an entry's fingerprint covers. Times are written in UTC so the server's time zone setting
-- can never change a fingerprint; jsonb text is canonical (key order is fixed by Postgres).
create function app.audit_payload(e public.audit_events) returns text
language sql immutable set search_path = public as $$
  select jsonb_build_object(
    'seq', e.seq,
    'occurred_at', to_char(e.occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'actor_kind', e.actor_kind,
    'actor_profile_id', e.actor_profile_id,
    'source_key', e.source_key,
    'record_type', e.record_type,
    'record_id', e.record_id,
    'summary', e.summary,
    'detail', e.detail,
    'is_demo', e.is_demo
  )::text
$$;

create function app.audit_hash(prev text, e public.audit_events) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(prev || '|' || app.audit_payload(e), 'sha256'), 'hex')
$$;

-- The newest entry, whoever is asking (row-level security would otherwise hide other people's entries
-- from the writer and the chain would fork).
create function app.audit_last(out last_seq bigint, out last_hash text)
language sql stable security definer set search_path = public as $$
  select seq, hash from public.audit_events order by seq desc limit 1
$$;

-- Runs as the caller (not security definer), so it can tell a person in the browser from the server.
create function app.audit_before_insert() returns trigger
language plpgsql set search_path = public as $$
declare
  last record;
begin
  -- One writer at a time, so two entries can never claim the same place in the chain.
  perform pg_advisory_xact_lock(hashtext('public.audit_events'));
  select * into last from app.audit_last();
  new.seq := coalesce(last.last_seq, 0) + 1;
  new.prev_hash := coalesce(last.last_hash, repeat('0', 64));
  new.occurred_at := now();
  new.id := gen_random_uuid();
  if app.from_client() then
    -- A person writes only as themself, and only while their account is active.
    if app.my_role() is null then
      raise exception 'not_active' using errcode = 'P0001';
    end if;
    new.actor_kind := 'person';
    new.actor_profile_id := app.my_profile_id();
    new.is_demo := app.my_is_demo();
  end if;
  new.hash := app.audit_hash(new.prev_hash, new);
  return new;
end $$;

create trigger audit_events_chain before insert on public.audit_events
  for each row execute function app.audit_before_insert();

create function app.audit_refuse_change() returns trigger
language plpgsql as $$
begin
  raise exception 'append_only' using errcode = 'P0001';
end $$;

create trigger audit_events_no_update before update or delete on public.audit_events
  for each row execute function app.audit_refuse_change();
create trigger audit_events_no_truncate before truncate on public.audit_events
  for each statement execute function app.audit_refuse_change();

-- A request from the browser is refused at the door; the triggers above stop everyone else.
revoke update, delete, truncate on public.audit_events from anon, authenticated;

alter table public.audit_events enable row level security;

-- Admin reads the log of their own world (real or demo); anyone else reads only what they themself did.
create policy audit_read on public.audit_events for select to authenticated
  using ((app.is_admin() and is_demo = app.my_is_demo()) or actor_profile_id = app.my_profile_id());

create policy audit_write on public.audit_events for insert to authenticated
  with check (app.my_role() is not null);

-- Walks the whole chain and says whether it holds, and if not, the first entry that does not.
create function app.verify_audit_chain()
returns table (ok boolean, checked bigint, broken_at bigint)
language plpgsql stable security definer set search_path = public as $$
declare
  e public.audit_events;
  prev text := repeat('0', 64);
  expected_seq bigint := 1;
  n bigint := 0;
begin
  for e in select * from public.audit_events order by seq loop
    if e.seq <> expected_seq or e.prev_hash <> prev or e.hash <> app.audit_hash(prev, e) then
      return query select false, n, expected_seq;
      return;
    end if;
    prev := e.hash;
    expected_seq := expected_seq + 1;
    n := n + 1;
  end loop;
  return query select true, n, null::bigint;
end $$;

revoke execute on function app.verify_audit_chain() from public, anon;
grant execute on function app.verify_audit_chain() to authenticated, service_role;
