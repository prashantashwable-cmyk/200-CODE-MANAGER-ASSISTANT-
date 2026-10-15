/**
 * Structural checks across the whole schema, so a new migration cannot quietly weaken the guarantees the others rely on.
 * They read the catalogue of a real Postgres built from every migration, not the migration text.
 */
import { afterAll, describe, expect, it } from 'vitest';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
afterAll(() => pool.end());
const q = async <T extends object>(sql: string, args: unknown[] = []) => (await pool.query<T>(sql, args)).rows;

describe('schema hardening', () => {
  it('every table in public has row-level security switched on', async () => {
    const rows = await q<{ relname: string }>("select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity order by 1");
    expect(rows.map((r) => r.relname)).toEqual([]);
  });

  it('a signed-in browser (authenticated) can write to a table only if it is on the short, reviewed list', async () => {
    const rows = await q<{ table_name: string; privilege_type: string }>(
      "select table_name, privilege_type from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'public' and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') order by 1, 2");
    // Reviewed: the tables where row-level security and guard triggers decide what a browser may write. Everything else changes only through a security-definer function.
    const reviewed = new Set(['profiles', 'milestone_template_versions', 'facilitator_quotes', 'fee_settings_versions', 'quote_acceptances', 'lead_captures', 'lead_reviews', 'ownership_settings_versions', 'decision_cards', 'sms_outbox', 'platform_events', 'audit_events', 'heartbeat_runs']);
    const unexpected = rows.filter((r) => !reviewed.has(r.table_name)).map((r) => `${r.table_name}:${r.privilege_type}`);
    expect(unexpected).toEqual([]);
  });

  it('nothing in public is writable by anon', async () => {
    const rows = await q<{ table_name: string; privilege_type: string }>(
      "select table_name, privilege_type from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public' and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') order by 1, 2");
    expect(rows).toEqual([]);
  });

  it('no view in public can be written to by a browser role', async () => {
    const rows = await q<{ table_name: string; grantee: string; privilege_type: string }>(
      "select g.table_name, g.grantee, g.privilege_type from information_schema.role_table_grants g join pg_views v on v.viewname = g.table_name and v.schemaname = g.table_schema where g.table_schema = 'public' and g.grantee in ('anon', 'authenticated') and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')");
    expect(rows).toEqual([]);
  });

  it('every security-definer function pins its search path, so a caller cannot shadow what it calls', async () => {
    const rows = await q<{ nspname: string; proname: string }>(
      "select n.nspname, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'app') and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%') order by 1, 2");
    expect(rows.map((r) => `${r.nspname}.${r.proname}`)).toEqual([]);
  });

  it('anon can run none of the new business functions', async () => {
    const rows = await q<{ proname: string }>(
      "select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute') order by 1");
    // Reviewed: functions that must work before anyone has signed in.
    const preSignIn = new Set(['phone_status', 'claim_profile_for_phone', 'link_phone_to_account']);
    expect(rows.map((r) => r.proname).filter((n) => !preSignIn.has(n))).toEqual([]);
  });
});

describe('views cannot be used to write', () => {
  async function asPerson(role: string, fn: (c: pg.PoolClient) => Promise<unknown>) {
    const phone = `+9197${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
    const p = (await pool.query<{ id: string }>("insert into public.profiles (phone, name, role, status) values ($1, 'V', $2, 'active') returning id", [phone, role])).rows[0].id;
    const auth = (await pool.query<{ id: string }>('insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id', [`v${phone}@aiec.test`])).rows[0].id;
    await pool.query('update public.profiles set auth_user_id = $1 where id = $2', [auth, p]);
    const c = await pool.connect();
    try {
      await c.query('begin'); await c.query('set local role authenticated');
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: auth, role: 'authenticated' })]);
      const r = await fn(c); await c.query('rollback'); return r;
    } catch (e) { await c.query('rollback'); return (e as Error).message; } finally { c.release(); }
  }
  const attempt = (role: string, sql: string) => asPerson(role, async (c) => { const r = await c.query(sql); return `wrote ${r.rowCount}`; });

  it('no signed-in person, whatever their role, can insert, change or remove anything through the event or decision views', async () => {
    for (const role of ['customer', 'admin', 'owner']) {
      for (const sql of [
        "insert into public.platform_events_masked (event_type, subject_kind, subject_id) values ('payout.released', 'lead', 'x')",
        "update public.platform_events_masked set event_type = 'payout.released'",
        'delete from public.platform_events_masked',
        "insert into public.decision_cards_status (code, kind, title, status, proposed_by_kind, proposed_by_name) values ('x', 'k', 't', 'pending', 'system', 'x')",
        "update public.decision_cards_status set status = 'approved'",
        'delete from public.decision_cards_status',
      ]) {
        const out = await attempt(role, sql);
        expect(String(out), `${role}: ${sql}`).not.toMatch(/^wrote [1-9]/);
        expect(String(out), `${role}: ${sql}`).toMatch(/permission denied|not_active|owner_only|admin_read_only|use_the_decision_functions|wrote 0|cannot|read-only|not allowed|forbidden|violates|null value|does not exist/);
      }
    }
  });
});
