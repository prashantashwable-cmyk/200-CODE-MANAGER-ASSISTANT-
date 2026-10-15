-- SECURITY FIX. Found by tests/db/hardening.test.ts.
-- The views platform_events_masked and decision_cards_status run with their owner's rights (the first is security_invoker = false) and carried the
-- database's default write privileges. A signed-in customer could INSERT through platform_events_masked and so add events to the append-only
-- event stream as the owner, bypassing the guard that tells a browser from the server. Views are for reading: take every write privilege away
-- from the browser roles, on every view in public, and from anon on every table.
-- Additive. Rollback: none needed (it only removes privileges that should never have been there). Not applied to any hosted Supabase project.

do $$
declare r record;
begin
  for r in select schemaname, viewname from pg_views where schemaname = 'public' loop
    execute format('revoke insert, update, delete, truncate on %I.%I from anon, authenticated', r.schemaname, r.viewname);
  end loop;
  for r in select schemaname, tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke insert, update, delete, truncate on %I.%I from anon', r.schemaname, r.tablename);
  end loop;
end $$;
