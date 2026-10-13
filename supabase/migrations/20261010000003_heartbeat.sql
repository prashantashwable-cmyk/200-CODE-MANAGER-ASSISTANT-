-- S0c: the server's own clock. Until now every automation ran only while someone had the app open.
-- app.heartbeat() is what a scheduler calls every minute; today it checks the audit chain and records the
-- beat (so a silent scheduler shows as a gap), and each module moved onto the server adds its own steps here.

create table public.heartbeat_runs (
  id bigint generated always as identity primary key,
  source text not null check (source in ('cron', 'manual', 'test')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  chain_ok boolean,
  chain_checked bigint,
  chain_broken_at bigint
);

alter table public.heartbeat_runs enable row level security;
create policy heartbeat_read on public.heartbeat_runs for select to authenticated
  using (app.is_admin() and not app.my_is_demo());

create function app.heartbeat(p_source text default 'cron') returns public.heartbeat_runs
language plpgsql security definer set search_path = public as $$
declare
  run public.heartbeat_runs;
  v record;
  was_broken boolean;
begin
  insert into public.heartbeat_runs (source) values (p_source) returning * into run;
  select * into v from app.verify_audit_chain();
  -- A break is written to the log once, when first seen, not on every beat.
  select chain_ok = false into was_broken from public.heartbeat_runs
    where id < run.id and finished_at is not null order by id desc limit 1;
  if not v.ok and not coalesce(was_broken, false) then
    insert into public.audit_events (actor_kind, source_key, record_type, record_id, summary, detail)
    values ('automation', 'audit.chain_broken', 'other', v.broken_at::text,
            'The audit log no longer matches its fingerprints from entry ' || v.broken_at || ' onward.',
            jsonb_build_object('checked', v.checked, 'broken_at', v.broken_at));
  end if;
  update public.heartbeat_runs
     set finished_at = now(), chain_ok = v.ok, chain_checked = v.checked, chain_broken_at = v.broken_at
   where id = run.id returning * into run;
  return run;
end $$;

revoke execute on function app.heartbeat(text) from public, anon, authenticated;
grant execute on function app.heartbeat(text) to service_role;

-- Every minute on Supabase (pg_cron). Skipped where pg_cron is not available, e.g. a plain local Postgres.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('aiec-heartbeat', '* * * * *', $job$select app.heartbeat('cron')$job$);
  end if;
end $$;
