/**
 * The server's own rules, proved against a real Postgres with the same migrations Supabase runs.
 * A request from the browser is `authenticated` (or `anon`) with the person's id in the JWT claims, exactly
 * as Supabase sets it; the server itself is `service_role`. Nothing here goes through the app's code.
 */
import { afterAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { randomInt } from 'node:crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 25 });
afterAll(() => pool.end());

type Q = pg.PoolClient;
// Each run takes its own range of numbers, so a database kept between runs (a local Supabase stack) never collides.
let phoneSeq = randomInt(0, 9_000) * 10_000;
const nextPhone = () => `98${String(10_000_000 + (phoneSeq += 1)).padStart(8, '0')}`;

/** Runs as a signed-in person (their auth id), or as an anonymous visitor (null), inside one transaction. */
async function as<T>(authId: string | null, fn: (c: Q) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query(`set local role ${authId ? 'authenticated' : 'anon'}`);
    await c.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(authId ? { sub: authId, role: 'authenticated' } : { role: 'anon' }),
    ]);
    const out = await fn(c);
    await c.query('commit');
    return out;
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    c.release();
  }
}

/** Runs as the server (Supabase's service role). */
async function asServer<T>(fn: (c: Q) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query('set local role service_role');
    const out = await fn(c);
    await c.query('commit');
    return out;
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    c.release();
  }
}

/** What Supabase Auth does when someone verifies a phone code for the first time. */
async function signIn(phone: string): Promise<string> {
  const r = await pool.query<{ id: string }>('insert into auth.users (id, phone) values (gen_random_uuid(), $1) returning id', [phone]);
  return r.rows[0].id;
}

/** A person Admin added (or the seed), optionally signed in already. */
async function person(role: string | null, opts: { status?: string; demo?: boolean; signIn?: boolean } = {}) {
  const phone = nextPhone();
  const r = await pool.query<{ id: string }>(
    'insert into public.profiles (phone, name, role, status, is_demo) values ($1, $2, $3, $4, $5) returning id',
    [`+91${phone}`, `Person ${phone}`, role, opts.status ?? (role ? 'active' : 'pending'), opts.demo ?? false],
  );
  let authId: string | null = null;
  if (opts.signIn !== false && !opts.demo) authId = await signIn(phone);
  if (opts.demo) {
    // Demo sign-ins are created linked, since the phone-link trigger only links real profiles.
    authId = (await pool.query<{ id: string }>('insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id', [`demo${phone}@aiec.test`])).rows[0].id;
    await pool.query('update public.profiles set auth_user_id = $1 where id = $2', [authId, r.rows[0].id]);
  }
  return { profileId: r.rows[0].id, authId: authId as string, phone };
}

const visibleProfiles = (authId: string | null) =>
  as(authId, async (c) => (await c.query<{ id: string }>('select id from public.profiles')).rows.map((r) => r.id));

describe('signing in (Supabase phone code → profile)', () => {
  it('links a phone Admin already added, whatever prefix was typed', async () => {
    const phone = nextPhone();
    const added = await pool.query<{ id: string }>(
      "insert into public.profiles (phone, name, role, status) values ($1, 'Santosh', 'technician', 'active') returning id",
      [`+91 ${phone.slice(0, 5)} ${phone.slice(5)}`],
    );
    const authId = await signIn(`91${phone}`);
    const linked = await pool.query('select id from public.profiles where auth_user_id = $1', [authId]);
    expect(linked.rows).toEqual([{ id: added.rows[0].id }]);
  });

  it('gives an unknown phone a pending profile with no role, which can read only itself', async () => {
    const someone = await person('technician');
    const authId = await signIn(`91${nextPhone()}`);
    const mine = await pool.query('select role, status from public.profiles where auth_user_id = $1', [authId]);
    expect(mine.rows).toEqual([{ role: null, status: 'pending' }]);
    const seen = await visibleProfiles(authId);
    expect(seen).toHaveLength(1);
    expect(seen).not.toContain(someone.profileId);
  });

  it('refuses a second sign-in for a phone that is already linked', async () => {
    const p = await person('surveyor');
    await expect(signIn(`+91${p.phone}`)).rejects.toThrow(/phone_already_linked|duplicate key/);
  });

  it('shows an anonymous visitor nothing', async () => {
    await person('admin');
    expect(await visibleProfiles(null)).toEqual([]);
  });
});

describe('who sees whom', () => {
  it('Admin sees every real profile and no demo one; a demo Admin sees only demo profiles', async () => {
    const admin = await person('admin');
    const tech = await person('technician');
    const demoAdmin = await person('admin', { demo: true });
    const demoTech = await person('technician', { demo: true });
    const real = await visibleProfiles(admin.authId);
    expect(real).toEqual(expect.arrayContaining([admin.profileId, tech.profileId]));
    expect(real).not.toContain(demoTech.profileId);
    const demo = await visibleProfiles(demoAdmin.authId);
    expect(demo).toEqual(expect.arrayContaining([demoAdmin.profileId, demoTech.profileId]));
    expect(demo).not.toContain(tech.profileId);
  });

  it('a technician sees only themself', async () => {
    const tech = await person('technician');
    await person('technician');
    expect(await visibleProfiles(tech.authId)).toEqual([tech.profileId]);
  });

  it('a suspended Admin is no longer an Admin', async () => {
    await person('admin');
    const gone = await person('admin', { status: 'suspended' });
    expect(await visibleProfiles(gone.authId)).toEqual([gone.profileId]);
  });
});

describe('changing a profile', () => {
  it('a person may change their own name and language, never their role or status', async () => {
    const tech = await person('technician');
    await as(tech.authId, (c) => c.query("update public.profiles set name = 'Santosh K', preferred_language = 'mr' where id = $1", [tech.profileId]));
    const now = await pool.query('select name, preferred_language from public.profiles where id = $1', [tech.profileId]);
    expect(now.rows[0]).toEqual({ name: 'Santosh K', preferred_language: 'mr' });
    await expect(as(tech.authId, (c) => c.query("update public.profiles set role = 'admin' where id = $1", [tech.profileId]))).rejects.toThrow(/forbidden_field/);
    await expect(as(tech.authId, (c) => c.query("update public.profiles set status = 'suspended' where id = $1", [tech.profileId]))).rejects.toThrow(/forbidden_field/);
  });

  it('a person cannot touch someone else (the row is simply not theirs)', async () => {
    const a = await person('technician');
    const b = await person('technician');
    const r = await as(a.authId, (c) => c.query("update public.profiles set name = 'x' where id = $1", [b.profileId]));
    expect(r.rowCount).toBe(0);
  });

  it('Admin approves a pending person and gives them a role', async () => {
    const admin = await person('admin');
    const authId = await signIn(`91${nextPhone()}`);
    const r = await as(admin.authId, (c) => c.query("update public.profiles set role = 'surveyor', status = 'active' where auth_user_id = $1", [authId]));
    expect(r.rowCount).toBe(1);
    expect(await as(authId, async (c) => (await c.query('select app.my_role() as r')).rows[0].r)).toBe('surveyor');
  });

  it('demo or real is fixed for life', async () => {
    const admin = await person('admin');
    const tech = await person('technician');
    await expect(as(admin.authId, (c) => c.query('update public.profiles set is_demo = true where id = $1', [tech.profileId]))).rejects.toThrow(/is_demo_fixed/);
  });

  it('nobody deletes a profile, not even Admin', async () => {
    const admin = await person('admin');
    const tech = await person('technician');
    const r = await as(admin.authId, (c) => c.query('delete from public.profiles where id = $1', [tech.profileId]));
    expect(r.rowCount).toBe(0);
  });
});

describe('the last Admin', () => {
  it('cannot stop being an Admin while no other active Admin exists; can once there is one', async () => {
    // A world of its own: demo, with any demo Admin from earlier tests suspended by the server first.
    const only = await person('admin', { demo: true });
    await asServer((c) => c.query("update public.profiles set status = 'suspended' where is_demo and role = 'admin' and id <> $1", [only.profileId]));
    await expect(as(only.authId, (c) => c.query("update public.profiles set role = 'surveyor' where id = $1", [only.profileId]))).rejects.toThrow(/last_admin/);
    await expect(as(only.authId, (c) => c.query("update public.profiles set status = 'suspended' where id = $1", [only.profileId]))).rejects.toThrow(/last_admin/);
    const second = await person('admin', { demo: true });
    expect(second.profileId).toBeTruthy();
    const r = await as(only.authId, (c) => c.query("update public.profiles set role = 'surveyor' where id = $1", [only.profileId]));
    expect(r.rowCount).toBe(1);
  });
});

describe('the audit log', () => {
  it('records who acted and when from the server, whatever the browser sends', async () => {
    const tech = await person('technician');
    const other = await person('admin');
    const row = await as(tech.authId, async (c) => (await c.query(
      `insert into public.audit_events (seq, occurred_at, actor_kind, actor_profile_id, source_key, summary, is_demo, prev_hash, hash)
       values (999, '2020-01-01', 'automation', $1, 'job.step_done', 'Finished step 3', true, 'forged', 'forged')
       returning seq, occurred_at, actor_kind, actor_profile_id, is_demo, prev_hash, hash`,
      [other.profileId],
    )).rows[0]);
    expect(row.actor_kind).toBe('person');
    expect(row.actor_profile_id).toBe(tech.profileId);
    expect(row.is_demo).toBe(false);
    expect(row.seq).not.toBe('999');
    expect(new Date(row.occurred_at).getFullYear()).toBeGreaterThan(2020);
    expect(row.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses a person whose account is not active', async () => {
    const pendingAuth = await signIn(`91${nextPhone()}`);
    await expect(as(pendingAuth, (c) => c.query("insert into public.audit_events (actor_kind, source_key, summary, prev_hash, hash) values ('person', 'x', 'y', '', '')"))).rejects.toThrow(/not_active|row-level security/);
  });

  it('can never be edited or removed, by a person, by Admin, or by the server', async () => {
    const admin = await person('admin');
    await as(admin.authId, (c) => c.query("insert into public.audit_events (actor_kind, source_key, summary, prev_hash, hash) values ('person', 'test.entry', 'An entry', '', '')"));
    await expect(as(admin.authId, (c) => c.query("update public.audit_events set summary = 'changed'"))).rejects.toThrow(/permission denied/);
    await expect(as(admin.authId, (c) => c.query('delete from public.audit_events'))).rejects.toThrow(/permission denied/);
    await expect(asServer((c) => c.query("update public.audit_events set summary = 'changed'"))).rejects.toThrow(/append_only/);
    await expect(asServer((c) => c.query('delete from public.audit_events'))).rejects.toThrow(/append_only/);
    await expect(pool.query('truncate public.audit_events')).rejects.toThrow(/append_only/);
  });

  it('shows Admin everything and a person only their own entries', async () => {
    const admin = await person('admin');
    const a = await person('surveyor');
    const b = await person('surveyor');
    for (const p of [a, b]) {
      await as(p.authId, (c) => c.query("insert into public.audit_events (actor_kind, source_key, summary, prev_hash, hash) values ('person', 'lead.note', 'A note', '', '')"));
    }
    const mine = await as(a.authId, async (c) => (await c.query('select distinct actor_profile_id from public.audit_events')).rows);
    expect(mine).toEqual([{ actor_profile_id: a.profileId }]);
    const all = await as(admin.authId, async (c) => (await c.query('select distinct actor_profile_id from public.audit_events')).rows.map((r) => r.actor_profile_id));
    expect(all).toEqual(expect.arrayContaining([a.profileId, b.profileId]));
  });

  it('keeps one unbroken chain when many people write at the same moment', async () => {
    const people = await Promise.all(Array.from({ length: 12 }, () => person('technician')));
    await Promise.all(people.map((p, i) => as(p.authId, (c) => c.query(
      "insert into public.audit_events (actor_kind, source_key, summary, prev_hash, hash) values ('person', 'job.step_done', $1, '', '')", [`Step ${i}`],
    ))));
    const gaps = await pool.query('select count(*)::int as n from public.audit_events a where seq > 1 and not exists (select 1 from public.audit_events b where b.seq = a.seq - 1)');
    expect(gaps.rows[0].n).toBe(0);
    const v = await pool.query('select * from app.verify_audit_chain()');
    expect(v.rows[0]).toMatchObject({ ok: true, broken_at: null });
  });

  it('is kept: what one connection wrote, a new connection reads back', async () => {
    const tech = await person('technician');
    await as(tech.authId, (c) => c.query("insert into public.audit_events (actor_kind, source_key, record_type, record_id, summary, prev_hash, hash) values ('person', 'job.check_in', 'job', 'j-1', 'Arrived on site', '', '')"));
    const fresh = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await fresh.connect();
    const r = await fresh.query("select summary from public.audit_events where record_id = 'j-1' and actor_profile_id = $1", [tech.profileId]);
    await fresh.end();
    expect(r.rows).toEqual([{ summary: 'Arrived on site' }]);
  });
});

describe('the heartbeat (the server clock)', () => {
  it('only the server may run it', async () => {
    const admin = await person('admin');
    await expect(as(admin.authId, (c) => c.query("select app.heartbeat('manual')"))).rejects.toThrow(/permission denied/);
    const run = await asServer(async (c) => (await c.query("select * from app.heartbeat('test')")).rows[0]);
    expect(run).toMatchObject({ source: 'test', chain_ok: true, chain_broken_at: null });
    expect(run.finished_at).toBeTruthy();
  });

  // Last on purpose: it breaks the chain for everything after it.
  it('finds a tampered entry, says where, and writes the break to the log once', async () => {
    await pool.query("alter table public.audit_events disable trigger audit_events_no_update");
    await pool.query("update public.audit_events set summary = 'tampered' where seq = 2");
    await pool.query("alter table public.audit_events enable trigger audit_events_no_update");
    const v = await pool.query('select * from app.verify_audit_chain()');
    expect(v.rows[0]).toMatchObject({ ok: false, broken_at: '2' });
    const first = await asServer(async (c) => (await c.query("select * from app.heartbeat('test')")).rows[0]);
    expect(first).toMatchObject({ chain_ok: false, chain_broken_at: '2' });
    await asServer((c) => c.query("select app.heartbeat('test')"));
    const notes = await pool.query("select count(*)::int as n from public.audit_events where source_key = 'audit.chain_broken'");
    expect(notes.rows[0].n).toBe(1);
  });
});

describe('sign-in codes (S1)', () => {
  it('Supabase Auth files each code in the outbox through the hook, with an expiry', async () => {
    const phone = `+91${nextPhone()}`;
    await pool.query('select public.send_sms_hook($1::jsonb)', [JSON.stringify({ user: { phone }, sms: { otp: '482913' } })]);
    const r = await pool.query('select code, purpose, sent_at, expires_at > now() as live from public.sms_outbox where phone = $1', [phone]);
    expect(r.rows).toEqual([{ code: '482913', purpose: 'sign_in', sent_at: null, live: true }]);
  });

  it('files a code under the number it is sent to, also when a signed-in account is confirming a new mobile', async () => {
    const phone = `91${nextPhone()}`;
    // What Supabase Auth passes for a phone change: the user has no phone yet; sms.phone is the destination.
    await pool.query('select public.send_sms_hook($1::jsonb)', [JSON.stringify({ user: { phone: '', new_phone: phone }, sms: { otp: '135790', phone } })]);
    const r = await pool.query('select code from public.sms_outbox where phone = $1', [phone]);
    expect(r.rows).toEqual([{ code: '135790' }]);
  });

  it('nobody in the browser can call the hook or read the outbox, not even Admin', async () => {
    const admin = await person('admin');
    const hook = JSON.stringify({ user: { phone: '+919800000000' }, sms: { otp: '111111' } });
    for (const who of [admin.authId, null]) {
      await expect(as(who, (c) => c.query('select public.send_sms_hook($1::jsonb)', [hook]))).rejects.toThrow(/permission denied/);
      await expect(as(who, (c) => c.query('select code from public.sms_outbox'))).rejects.toThrow(/permission denied/);
    }
  });
});

describe('asking for a role and Admin deciding (S1)', () => {
  it('a waiting person may say which role they want, but not once they have one', async () => {
    const authId = await signIn(`91${nextPhone()}`);
    await as(authId, (c) => c.query("update public.profiles set requested_role = 'technician' where auth_user_id = $1", [authId]));
    expect((await pool.query('select requested_role, role, status from public.profiles where auth_user_id = $1', [authId])).rows[0])
      .toEqual({ requested_role: 'technician', role: null, status: 'pending' });
    const tech = await person('technician');
    await expect(as(tech.authId, (c) => c.query("update public.profiles set requested_role = 'surveyor' where id = $1", [tech.profileId]))).rejects.toThrow(/not_pending/);
  });

  it('a person cannot stamp a decision on themself', async () => {
    const authId = await signIn(`91${nextPhone()}`);
    await expect(as(authId, (c) => c.query("update public.profiles set decision_note = 'approved by me' where auth_user_id = $1", [authId]))).rejects.toThrow(/forbidden_field/);
    await expect(as(authId, (c) => c.query('update public.profiles set decided_at = now() where auth_user_id = $1', [authId]))).rejects.toThrow(/forbidden_field/);
  });

  it("Admin's decision is stamped by the database and written to the audit log", async () => {
    const admin = await person('admin');
    const authId = await signIn(`91${nextPhone()}`);
    const r = await as(admin.authId, (c) => c.query(
      "update public.profiles set role = 'surveyor', status = 'active', decision_note = 'Known to Prashant', decided_by = null where auth_user_id = $1 and status = 'pending' returning id, decided_by, decided_at",
      [authId],
    ));
    expect(r.rows[0].decided_by).toBe(admin.profileId);
    expect(r.rows[0].decided_at).toBeTruthy();
    const log = await pool.query("select actor_kind, actor_profile_id, record_id, detail from public.audit_events where source_key = 'profile.decided' and record_id = $1", [r.rows[0].id]);
    expect(log.rows).toHaveLength(1);
    expect(log.rows[0]).toMatchObject({ actor_kind: 'person', actor_profile_id: admin.profileId });
    expect(log.rows[0].detail).toMatchObject({ from_role: null, to_role: 'surveyor', from_status: 'pending', to_status: 'active', note: 'Known to Prashant' });
  });

  it('a second Admin deciding the same person after the first finds nothing still pending', async () => {
    const a1 = await person('admin');
    const a2 = await person('admin');
    const authId = await signIn(`91${nextPhone()}`);
    const first = await as(a1.authId, (c) => c.query("update public.profiles set role = 'customer', status = 'active' where auth_user_id = $1 and status = 'pending'", [authId]));
    const second = await as(a2.authId, (c) => c.query("update public.profiles set status = 'rejected' where auth_user_id = $1 and status = 'pending'", [authId]));
    expect([first.rowCount, second.rowCount]).toEqual([1, 0]);
  });
});

describe('Google sign-in confirms a mobile number (S1)', () => {
  /** What Supabase Auth does for a Google sign-in: a user with an email and no phone. */
  async function googleSignIn(): Promise<string> {
    const r = await pool.query<{ id: string }>('insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id', [`g${nextPhone()}@gmail.test`]);
    return r.rows[0].id;
  }
  /** What Supabase Auth does when the phone_change code is verified. */
  const confirmPhone = (authId: string, phone: string) => pool.query('update auth.users set phone = $1 where id = $2', [phone, authId]);
  const profileOf = async (authId: string) => (await pool.query('select id, role, status from public.profiles where auth_user_id = $1', [authId])).rows;

  it('has no profile until the phone is confirmed, so it can read nothing', async () => {
    const authId = await googleSignIn();
    expect(await profileOf(authId)).toEqual([]);
    expect(await visibleProfiles(authId)).toEqual([]);
  });

  it('links the profile Admin already added once its phone is confirmed', async () => {
    const tech = await person('technician', { signIn: false });
    const authId = await googleSignIn();
    await confirmPhone(authId, `91${tech.phone}`);
    expect(await profileOf(authId)).toEqual([{ id: tech.profileId, role: 'technician', status: 'active' }]);
    expect(await as(authId, async (c) => (await c.query('select app.my_role() as r')).rows[0].r)).toBe('technician');
  });

  it('gives an unknown phone a pending profile with no role, waiting for Admin', async () => {
    const authId = await googleSignIn();
    await confirmPhone(authId, `+91${nextPhone()}`);
    expect(await profileOf(authId)).toEqual([{ id: expect.any(String), role: null, status: 'pending' }]);
  });

  it('refuses a phone that already belongs to another sign-in (one person, one account)', async () => {
    const tech = await person('technician');
    const authId = await googleSignIn();
    // (Supabase itself refuses a phone held by another sign-in; this proves the database refuses too.)
    await pool.query('update auth.users set phone = null where id = $1', [tech.authId]);
    await expect(confirmPhone(authId, `+91${tech.phone}`)).rejects.toThrow(/phone_already_linked/);
    expect(await profileOf(authId)).toEqual([]);
  });

  it('never moves a sign-in that already has a profile to another number', async () => {
    const tech = await person('technician');
    const other = await person('surveyor', { signIn: false });
    await confirmPhone(tech.authId, `+91${other.phone}`);
    expect(await profileOf(tech.authId)).toEqual([{ id: tech.profileId, role: 'technician', status: 'active' }]);
    expect((await pool.query('select auth_user_id from public.profiles where id = $1', [other.profileId])).rows[0].auth_user_id).toBeNull();
  });

  it('nobody in the browser can call the linking rule directly', async () => {
    const admin = await person('admin');
    await expect(as(admin.authId, (c) => c.query("select app.link_profile_by_phone(gen_random_uuid(), '+919800000001')"))).rejects.toThrow(/permission denied/);
  });
});
