-- S1: signing in for real.
-- 1. Sign-in codes: Supabase Auth hands each code to public.send_sms_hook (configured in config.toml / the dashboard),
--    which files it in the private sms_outbox. Whichever SMS provider AIEC chooses sends from there and records the
--    result; until one is connected the codes wait, unsent, and nothing pretends otherwise.
-- 2. Asking for a role: a person whose phone AIEC did not know chooses the role they want (requested_role); only Admin
--    gives a role, and every decision is written to the audit log by the database itself.

create table public.sms_outbox (
  id bigint generated always as identity primary key,
  phone text not null,
  purpose text not null default 'sign_in' check (purpose in ('sign_in')),
  -- The one-time code. A sender must clear it once the message is out (it is never needed afterwards).
  code text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  sent_at timestamptz,
  provider text,
  provider_ref text,
  failure text
);
create index sms_outbox_waiting on public.sms_outbox (created_at) where sent_at is null and failure is null;

-- Nobody in the browser can read or touch it, not even Admin: it holds live sign-in codes.
alter table public.sms_outbox enable row level security;
revoke all on public.sms_outbox from anon, authenticated;

create function public.send_sms_hook(event jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  insert into public.sms_outbox (phone, code, expires_at)
  values (event -> 'user' ->> 'phone', event -> 'sms' ->> 'otp', now() + interval '10 minutes');
  return '{}'::jsonb;
end $$;

-- Only Supabase Auth may call it (Supabase grants new public functions to the API roles by default; take that back).
revoke execute on function public.send_sms_hook(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.send_sms_hook(jsonb) to supabase_auth_admin;
  end if;
end $$;

-- ---- Asking for a role, and Admin's answer ----
alter table public.profiles
  add column requested_role public.app_role,
  add column decided_at timestamptz,
  add column decided_by uuid references public.profiles (id),
  add column decision_note text check (decision_note is null or length(decision_note) <= 500);

create or replace function app.guard_profile_change() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.is_demo is distinct from old.is_demo then
    raise exception 'is_demo_fixed' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  if not app.from_client() then
    return new; -- the server itself (service role, migrations)
  end if;
  -- Only Admin changes who someone is or what they may do, and Admin's decision is stamped by the database.
  if not app.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status
       or new.phone is distinct from old.phone or new.auth_user_id is distinct from old.auth_user_id
       or new.decided_at is distinct from old.decided_at or new.decided_by is distinct from old.decided_by
       or new.decision_note is distinct from old.decision_note then
      raise exception 'forbidden_field' using errcode = 'P0001';
    end if;
    -- A person may say which role they want only while they are waiting for a decision.
    if new.requested_role is distinct from old.requested_role and old.status <> 'pending' then
      raise exception 'not_pending' using errcode = 'P0001';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role or new.status is distinct from old.status then
    new.decided_at := now();
    new.decided_by := app.my_profile_id();
  end if;
  -- A lockout is impossible by design: the last active Admin cannot stop being one.
  if old.role = 'admin' and old.status = 'active'
     and (new.role is distinct from 'admin' or new.status <> 'active')
     and not exists (select 1 from public.profiles p
                     where p.id <> old.id and p.role = 'admin' and p.status = 'active' and p.is_demo = old.is_demo) then
    raise exception 'last_admin' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Every change of role or status goes into the permanent record, written by the database whoever made it.
create function app.log_profile_decision() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.role is distinct from old.role or new.status is distinct from old.status then
    insert into public.audit_events (actor_kind, actor_profile_id, source_key, record_type, record_id, summary, detail, is_demo, prev_hash, hash)
    values (
      case when app.from_client() then 'person' else 'automation' end,
      case when app.from_client() then app.my_profile_id() else null end,
      'profile.decided', 'profile', new.id::text,
      'Role or status changed for ' || coalesce(nullif(new.name, ''), new.phone) || ': '
        || coalesce(old.role::text, 'no role') || ' / ' || old.status || ' to '
        || coalesce(new.role::text, 'no role') || ' / ' || new.status || '.',
      jsonb_build_object('from_role', old.role, 'to_role', new.role, 'from_status', old.status, 'to_status', new.status,
                         'note', new.decision_note),
      new.is_demo, '', '');
  end if;
  return new;
end $$;

create trigger profiles_log_decision after update on public.profiles
  for each row execute function app.log_profile_decision();
