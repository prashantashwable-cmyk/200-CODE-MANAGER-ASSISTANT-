-- Signing in with Google (owner's decision, 2026-10-10: anyone may, and a Google account AIEC does not know confirms a
-- mobile number once). AIEC knows a person by the last 10 digits of their phone, so a Google sign-in has no profile until
-- its phone is confirmed: Supabase sets auth.users.phone when the one-time code is verified (type phone_change), and the
-- trigger below then links it exactly as a phone sign-in is linked. One person keeps one profile however they sign in.

-- The one rule for "this sign-in now has this phone": link to the profile Admin already added, else a pending profile
-- with no role (Admin decides on 004). A phone already linked to another sign-in is refused.
create function app.link_profile_by_phone(uid uuid, phone text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  k text := right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10);
  linked uuid;
begin
  if length(k) <> 10 then
    return null; -- not a phone; nothing to link
  end if;
  update public.profiles set auth_user_id = uid
    where phone_key = k and is_demo = false and auth_user_id is null
    returning id into linked;
  if linked is null then
    if exists (select 1 from public.profiles where phone_key = k and is_demo = false) then
      raise exception 'phone_already_linked' using errcode = 'P0001';
    end if;
    insert into public.profiles (auth_user_id, phone, status) values (uid, '+91' || k, 'pending') returning id into linked;
  end if;
  return linked;
end $$;
revoke execute on function app.link_profile_by_phone(uuid, text) from public, anon, authenticated;

-- First sign-in (phone code): the same rule as before, now through the shared function.
create or replace function app.on_auth_user_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform app.link_profile_by_phone(new.id, new.phone);
  return new;
end $$;

-- A sign-in that had no phone (Google) confirms one: link it then. A sign-in that already has a profile is never moved
-- to another one by a phone change (that would hand one person's account to another number).
create function app.on_auth_user_phone_set() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.phone is distinct from old.phone
     and not exists (select 1 from public.profiles where auth_user_id = new.id) then
    perform app.link_profile_by_phone(new.id, new.phone);
  end if;
  return new;
end $$;

create trigger on_auth_user_phone_set after update of phone on auth.users
  for each row execute function app.on_auth_user_phone_set();

-- The send-SMS hook files each code under the number it goes to. That number is sms.phone: for a sign-in it equals the
-- user's phone, but for a Google sign-in confirming its mobile (phone_change) the user has no phone yet and the code goes
-- to the new number (seen on Supabase's own Auth service). Replacing the function keeps its grants (only Auth may call it).
create or replace function public.send_sms_hook(event jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  insert into public.sms_outbox (phone, code, expires_at)
  values (coalesce(nullif(event -> 'sms' ->> 'phone', ''), event -> 'user' ->> 'phone'),
          event -> 'sms' ->> 'otp', now() + interval '10 minutes');
  return '{}'::jsonb;
end $$;
