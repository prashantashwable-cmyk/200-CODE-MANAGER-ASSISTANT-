-- S0c: who someone is and what they may do. One profile per person; the role and status decide access.
-- Row-level security is the barrier: Supabase lets every signed-in request touch these tables, and the
-- policies below decide which rows. Nothing here trusts the browser.

create schema if not exists app;
grant usage on schema app to anon, authenticated, service_role;

create type public.app_role as enum ('admin', 'surveyor', 'technician', 'customer', 'supplier');
create type public.profile_status as enum ('pending', 'active', 'suspended', 'rejected');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  -- The Supabase sign-in this profile belongs to. Null for someone Admin has added who has not signed in yet.
  auth_user_id uuid unique references auth.users (id) on delete set null,
  phone text not null,
  -- The app's one phone rule: a person is their last 10 digits, whatever prefix was typed.
  phone_key text generated always as (right(regexp_replace(phone, '\D', '', 'g'), 10)) stored,
  name text not null default '',
  role public.app_role,
  status public.profile_status not null default 'pending',
  -- Demo data and real data never see each other.
  is_demo boolean not null default false,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi', 'mr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_10 check (length(phone_key) = 10),
  constraint profiles_active_has_role check (status <> 'active' or role is not null)
);
create unique index profiles_phone_unique on public.profiles (phone_key, is_demo);

-- ---- Who is asking (security definer so the policies below can read profiles without recursing) ----
create function app.my_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;

-- The caller's role, only while their profile is active: a pending or suspended person has no role.
create function app.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where auth_user_id = auth.uid() and status = 'active'
$$;

create function app.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(app.my_role() = 'admin', false)
$$;

create function app.my_is_demo() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_demo from public.profiles where auth_user_id = auth.uid()), false)
$$;

-- A request from the browser (signed in or not), as opposed to the server's own service role.
create function app.from_client() returns boolean
language sql stable as $$
  select current_user in ('anon', 'authenticated')
$$;

grant execute on function app.my_profile_id(), app.my_role(), app.is_admin(), app.my_is_demo(), app.from_client()
  to anon, authenticated, service_role;

-- ---- Row-level security ----
alter table public.profiles enable row level security;

create policy profiles_read on public.profiles for select to authenticated
  using (id = app.my_profile_id() or (app.is_admin() and is_demo = app.my_is_demo()));

-- Admin adds people (a partner before they first sign in); everyone else is created by signing in.
create policy profiles_admin_add on public.profiles for insert to authenticated
  with check (app.is_admin() and is_demo = app.my_is_demo());

create policy profiles_update on public.profiles for update to authenticated
  using (id = app.my_profile_id() or (app.is_admin() and is_demo = app.my_is_demo()))
  with check (id = app.my_profile_id() or (app.is_admin() and is_demo = app.my_is_demo()));
-- No delete policy: a profile is never deleted, it is suspended (history keeps pointing at it).

-- ---- What a change may touch ----
create function app.guard_profile_change() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.is_demo is distinct from old.is_demo then
    raise exception 'is_demo_fixed' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  if not app.from_client() then
    return new; -- the server itself (service role, migrations)
  end if;
  -- Only Admin changes who someone is or what they may do.
  if not app.is_admin() and (
       new.role is distinct from old.role or new.status is distinct from old.status
       or new.phone is distinct from old.phone or new.auth_user_id is distinct from old.auth_user_id) then
    raise exception 'forbidden_field' using errcode = 'P0001';
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

create trigger profiles_guard before update on public.profiles
  for each row execute function app.guard_profile_change();

-- ---- Signing in for the first time ----
-- A phone Admin already added is linked to that profile; an unknown phone gets a pending profile with no
-- role, so it can read nothing until Admin decides (004).
create function app.on_auth_user_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text := right(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), 10);
  linked uuid;
begin
  if length(k) <> 10 then
    return new; -- not a phone sign-in; nothing to link
  end if;
  update public.profiles set auth_user_id = new.id
    where phone_key = k and is_demo = false and auth_user_id is null
    returning id into linked;
  if linked is null then
    if exists (select 1 from public.profiles where phone_key = k and is_demo = false) then
      raise exception 'phone_already_linked' using errcode = 'P0001';
    end if;
    insert into public.profiles (auth_user_id, phone, status) values (new.id, '+91' || k, 'pending');
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function app.on_auth_user_created();
