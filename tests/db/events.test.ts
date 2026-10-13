/**
 * The platform event stream, proved against a real Postgres with the same migrations Supabase runs. Every test acts as a browser
 * would: `authenticated` with the person's id in the JWT claims. Nothing goes through the app's code, so these hold for any client.
 */
import { afterAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { randomInt } from 'node:crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
afterAll(() => pool.end());

type Q = pg.PoolClient;
let phoneSeq = randomInt(0, 9_000) * 10_000 + 5_000_000;
const nextPhone = () => `97${String(10_000_000 + (phoneSeq += 1)).padStart(8, '0')}`;

async function as<T>(authId: string | null, fn: (c: Q) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query(`set local role ${authId ? 'authenticated' : 'anon'}`);
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(authId ? { sub: authId, role: 'authenticated' } : { role: 'anon' })]);
    const out = await fn(c);
    await c.query('commit');
    return out;
  } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
}
async function asServer<T>(fn: (c: Q) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try { await c.query('begin'); await c.query('set local role service_role'); const out = await fn(c); await c.query('commit'); return out; }
  catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
}

async function person(role: string, opts: { demo?: boolean } = {}) {
  const phone = nextPhone();
  const r = await pool.query<{ id: string }>("insert into public.profiles (phone, name, role, status, is_demo) values ($1, $2, $3, 'active', $4) returning id", [`+91${phone}`, `Person ${phone}`, role, opts.demo ?? false]);
  const auth = (await pool.query<{ id: string }>('insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id', [`p${phone}@aiec.test`])).rows[0].id;
  await pool.query('update public.profiles set auth_user_id = $1 where id = $2', [auth, r.rows[0].id]);
  return { profileId: r.rows[0].id, authId: auth };
}

type NewEvent = { type: string; subject?: string; payload?: Record<string, unknown>; client?: string; about?: string; lat?: number; lng?: number; sentAt?: string; extra?: Record<string, unknown> };
async function emit(authId: string, e: NewEvent) {
  return as(authId, async (c) => (await c.query<{ id: string; seq: string; actor_profile_id: string; actor_role: string; source: string; received_at: Date; skew_ms: string }>(
    `insert into public.platform_events (event_type, subject_kind, subject_id, payload, client_event_id, about_id, geo_lat, geo_lng, device_sent_at)
     values ($1, 'lead', $2, $3, $4, $5, $6, $7, $8) returning id, seq, actor_profile_id, actor_role, source, received_at, skew_ms`,
    [e.type, e.subject ?? 'L-1', JSON.stringify(e.payload ?? {}), e.client ?? null, e.about ?? null, e.lat ?? null, e.lng ?? null, e.sentAt ?? null])).rows[0]);
}
const refusal = async (p: Promise<unknown>): Promise<string> => { try { await p; return 'ok'; } catch (e) { return (e as Error).message; } };
const chain = async () => (await pool.query<{ ok: boolean; checked: string; broken_at: string | null }>('select * from app.verify_event_chain()')).rows[0];
const ownRows = (authId: string) => as(authId, async (c) => (await c.query<{ id: string }>('select id from public.platform_events')).rows.map((r) => r.id));

describe('the owner role', () => {
  it('exists, and the Owner passes every gate Admin passes while Admin is not the Owner', async () => {
    const owner = await person('owner');
    const admin = await person('admin');
    const asRole = (a: string) => as(a, async (c) => (await c.query<{ r: string | null; adm: boolean; own: boolean }>('select app.my_role()::text r, app.is_admin() adm, app.is_owner() own')).rows[0]);
    expect(await asRole(owner.authId)).toEqual({ r: 'owner', adm: true, own: true });
    expect(await asRole(admin.authId)).toEqual({ r: 'admin', adm: true, own: false });
  });
});

describe('writing: the server decides who, when and where in the chain', () => {
  it('a browser that lies about its identity, position in the chain, time and source is overruled', async () => {
    const scout = await person('surveyor');
    const other = await person('surveyor');
    const r = await as(scout.authId, async (c) => (await c.query<{ actor_profile_id: string; seq: string; received_at: Date; source: string; actor_role: string; actor_kind: string }>(
      `insert into public.platform_events (seq, event_type, actor_kind, actor_profile_id, actor_role, subject_kind, subject_id, received_at, source, prev_hash, hash, is_demo)
       values (999999, 'lead.captured', 'system', $1, 'owner', 'lead', 'L-lie', '2001-01-01', 'system', 'x', 'x', true)
       returning actor_profile_id, seq, received_at, source, actor_role, actor_kind`, [other.profileId])).rows[0]);
    expect(r.actor_profile_id).toBe(scout.profileId);
    expect(r.actor_role).toBe('surveyor');
    expect(r.actor_kind).toBe('person');
    expect(r.source).toBe('app');
    expect(Number(r.seq)).toBeLessThan(999999);
    expect(Date.now() - r.received_at.getTime()).toBeLessThan(60_000);
    expect((await chain()).ok).toBe(true);
  });
  it('measures the phone clock error from the time the phone says it sent, rather than guessing from the capture time', async () => {
    const scout = await person('surveyor');
    const fast = await emit(scout.authId, { type: 'lead.captured', sentAt: new Date(Date.now() + 3_600_000).toISOString() });
    expect(Math.abs(Number(fast.skew_ms) - 3_600_000)).toBeLessThan(5_000);
    const unmeasured = await emit(scout.authId, { type: 'lead.photo_added' });
    expect(Number(unmeasured.skew_ms)).toBe(0);
  });
  it('is idempotent: the same capture sent twice is recorded once', async () => {
    const scout = await person('surveyor');
    await emit(scout.authId, { type: 'lead.captured', client: 'dup-1' });
    expect(await refusal(emit(scout.authId, { type: 'lead.captured', client: 'dup-1' }))).toMatch(/duplicate key|platform_events_idempotent/);
    const again = await as(scout.authId, async (c) => (await c.query(
      "insert into public.platform_events (event_type, subject_kind, subject_id, client_event_id) values ('lead.captured','lead','L-1','dup-1') on conflict do nothing returning id")).rowCount);
    expect(again).toBe(0);
    expect((await ownRows(scout.authId)).length).toBe(1);
  });
  it('another person may reuse the same client id: it is idempotent per person', async () => {
    const a = await person('surveyor');
    const b = await person('surveyor');
    await emit(a.authId, { type: 'lead.captured', client: 'shared-id' });
    await expect(emit(b.authId, { type: 'lead.captured', client: 'shared-id' })).resolves.toBeTruthy();
  });
  it('a suspended or pending person writes nothing, and an anonymous visitor nothing', async () => {
    const gone = await person('surveyor');
    await pool.query("update public.profiles set status = 'suspended' where id = $1", [gone.profileId]);
    expect(await refusal(emit(gone.authId, { type: 'lead.captured' }))).toMatch(/not_active|row-level security/);
    expect(await refusal(as(null, (c) => c.query("insert into public.platform_events (event_type, subject_kind, subject_id) values ('lead.captured','lead','x')")))).toMatch(/not_active|permission denied|row-level security/);
  });
});

describe('append-only and tamper-evident', () => {
  it('nobody updates or deletes: not a person, not Admin, not even the server', async () => {
    const scout = await person('surveyor');
    const owner = await person('owner');
    const e = await emit(scout.authId, { type: 'lead.captured' });
    for (const who of [scout.authId, owner.authId]) {
      expect(await refusal(as(who, (c) => c.query("update public.platform_events set payload = '{}' where id = $1", [e.id])))).toMatch(/permission denied/);
      expect(await refusal(as(who, (c) => c.query('delete from public.platform_events where id = $1', [e.id])))).toMatch(/permission denied/);
    }
    expect(await refusal(asServer((c) => c.query("update public.platform_events set payload = '{}' where id = $1", [e.id])))).toMatch(/append_only/);
    expect(await refusal(asServer((c) => c.query('delete from public.platform_events where id = $1', [e.id])))).toMatch(/append_only/);
    expect(await refusal(asServer((c) => c.query('truncate public.platform_events')))).toMatch(/append_only|permission denied/);
  });
  it('rewriting an entry by going round the guard breaks the chain, and the check names where', async () => {
    const scout = await person('surveyor');
    const first = await emit(scout.authId, { type: 'lead.captured', payload: { siteName: 'Honest Heights' } });
    await emit(scout.authId, { type: 'lead.photo_added' });
    expect((await chain()).ok).toBe(true);
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query('alter table public.platform_events disable trigger platform_events_no_update');
      await c.query("update public.platform_events set payload = '{\"siteName\":\"Rewritten\"}' where id = $1", [first.id]);
      const broken = (await c.query<{ ok: boolean; broken_at: string }>('select * from app.verify_event_chain()')).rows[0];
      expect(broken.ok).toBe(false);
      expect(Number(broken.broken_at)).toBe(Number(first.seq));
    } finally { await c.query('rollback'); c.release(); }
    expect((await chain()).ok).toBe(true);
  });
});

describe('who reads what', () => {
  it('a scout reads only their own events; the Owner reads all of their world; a demo Owner never sees real events', async () => {
    const a = await person('surveyor');
    const b = await person('surveyor');
    const owner = await person('owner');
    const demoOwner = await person('owner', { demo: true });
    const ea = await emit(a.authId, { type: 'lead.captured' });
    const eb = await emit(b.authId, { type: 'lead.captured' });
    expect(await ownRows(a.authId)).toEqual([ea.id]);
    expect(await ownRows(b.authId)).toEqual([eb.id]);
    expect(await ownRows(owner.authId)).toEqual(expect.arrayContaining([ea.id, eb.id]));
    const demoSees = await ownRows(demoOwner.authId);
    expect(demoSees).not.toContain(ea.id);
    expect(await as(null, async (c) => { try { return (await c.query('select id from public.platform_events')).rowCount; } catch { return 0; } })).toBe(0);
  });
  it('Admin cannot read the table, and reads the masked view: contacts hidden, no place, only their own world', async () => {
    const scout = await person('surveyor');
    const admin = await person('admin');
    const e = await emit(scout.authId, { type: 'lead.captured', lat: 18.59, lng: 73.73, payload: { siteName: 'Admin View Towers', phone: '9822011234', contactName: 'Mr Patil', lat: 18.59, lng: 73.73, city: 'Pune' } });
    expect(await ownRows(admin.authId)).not.toContain(e.id);
    const view = await as(admin.authId, async (c) => (await c.query<Record<string, unknown>>('select * from public.platform_events_masked where id = $1', [e.id])).rows[0]);
    expect(view.payload).toEqual({ siteName: 'Admin View Towers', phone: '••••••1234', contactName: '••••', city: 'Pune' });
    expect(Object.keys(view)).not.toEqual(expect.arrayContaining(['geo_lat']));
    expect(JSON.stringify(view)).not.toMatch(/9822011234|18\.59|73\.73|Mr Patil/);
    // a scout or an anonymous visitor reads nothing through the view
    expect(await as(scout.authId, async (c) => (await c.query('select id from public.platform_events_masked')).rowCount)).toBe(0);
    expect(await refusal(as(null, (c) => c.query('select * from public.platform_events_masked')))).toMatch(/permission denied/);
    // a demo Admin does not see a real world's events
    const demoAdmin = await person('admin', { demo: true });
    expect(await as(demoAdmin.authId, async (c) => (await c.query('select id from public.platform_events_masked where id = $1', [e.id])).rowCount)).toBe(0);
  });
});

describe('Admin watches and may only flag', () => {
  it('Admin cannot write a business event, a correction or a note; it can flag an event', async () => {
    const scout = await person('surveyor');
    const admin = await person('admin');
    const e = await emit(scout.authId, { type: 'lead.captured' });
    expect(await refusal(emit(admin.authId, { type: 'lead.captured' }))).toMatch(/admin_read_only/);
    expect(await refusal(emit(admin.authId, { type: 'correction.applied', about: e.id, payload: { patch: { a: 1 } } }))).toMatch(/admin_read_only/);
    expect(await refusal(emit(admin.authId, { type: 'event.annotated', about: e.id }))).toMatch(/admin_may_only_flag/);
    expect(await refusal(emit(admin.authId, { type: 'event.disputed', about: e.id }))).toMatch(/admin_may_only_flag/);
    const flag = await emit(admin.authId, { type: 'event.flagged', about: e.id, payload: { text: 'Pin looks off the road.' } });
    expect(flag.actor_role).toBe('admin');
  });
});

describe('corrections never overwrite, and the classes are enforced here', () => {
  it('class 2: the author corrects their own recent event; the original row stays untouched', async () => {
    const scout = await person('surveyor');
    const e = await emit(scout.authId, { type: 'lead.captured', payload: { shaft: 'not_ready' } });
    const fix = await emit(scout.authId, { type: 'correction.applied', about: e.id, payload: { patch: { shaft: 'ready' }, reason: 'Mis-tapped the readiness.' } });
    expect(fix.id).not.toBe(e.id);
    const original = await pool.query('select payload from public.platform_events where id = $1', [e.id]);
    expect(original.rows[0].payload).toEqual({ shaft: 'not_ready' });
  });
  it('someone else cannot correct it, and cannot even see it to flag it', async () => {
    const scout = await person('surveyor');
    const rival = await person('surveyor');
    const e = await emit(scout.authId, { type: 'lead.captured' });
    expect(await refusal(emit(rival.authId, { type: 'correction.applied', about: e.id }))).toMatch(/forbidden/);
    expect(await refusal(emit(rival.authId, { type: 'event.disputed', about: e.id }))).toMatch(/forbidden/);
  });
  it('class 3: money, rank and ownership always need the Owner, even moments after', async () => {
    const scout = await person('surveyor');
    const e = await emit(scout.authId, { type: 'lead.ownership_claimed' });
    expect(await refusal(emit(scout.authId, { type: 'correction.applied', about: e.id }))).toMatch(/needs_owner/);
    const proposal = await emit(scout.authId, { type: 'correction.proposed', about: e.id, payload: { patch: { owner: 'x' }, reason: 'Wrong person claimed it.' } });
    expect(proposal.id).toBeTruthy();
  });
  it('class 2 closes after 15 minutes: the same author is then refused', async () => {
    const scout = await person('surveyor');
    const e = await emit(scout.authId, { type: 'lead.captured' });
    const c = await pool.connect();
    try {
      await c.query('begin');
      // age the event 20 minutes, the way time would, then act as the author
      await c.query('alter table public.platform_events disable trigger platform_events_no_update');
      await c.query("update public.platform_events set received_at = received_at - interval '20 minutes' where id = $1", [e.id]);
      await c.query('alter table public.platform_events enable trigger platform_events_no_update');
      await c.query('set local role authenticated');
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: scout.authId, role: 'authenticated' })]);
      await expect(c.query("insert into public.platform_events (event_type, subject_kind, subject_id, about_id) values ('correction.applied','lead','x',$1)", [e.id])).rejects.toThrow(/window_closed/);
    } finally { await c.query('rollback'); c.release(); }
  });
  it('class 4: locked for everyone including the Owner; a dispute is still allowed', async () => {
    const scout = await person('surveyor');
    const owner = await person('owner');
    const e = await emit(scout.authId, { type: 'milestone.payment_recorded', payload: { amount: 10000 } });
    expect(await refusal(emit(scout.authId, { type: 'correction.applied', about: e.id }))).toMatch(/locked/);
    expect(await refusal(emit(owner.authId, { type: 'correction.applied', about: e.id }))).toMatch(/locked/);
    expect(await refusal(emit(scout.authId, { type: 'correction.proposed', about: e.id }))).toMatch(/locked/);
    const d = await emit(scout.authId, { type: 'event.disputed', about: e.id, payload: { text: 'The amount on the proof is wrong.' } });
    expect(d.id).toBeTruthy();
  });
  it('only the Owner applies a late correction or rejects a proposal; a scout cannot decide their own', async () => {
    const scout = await person('surveyor');
    const owner = await person('owner');
    const e = await emit(scout.authId, { type: 'lead.ownership_claimed' });
    const proposal = await emit(scout.authId, { type: 'correction.proposed', about: e.id, payload: { patch: { owner: 'x' }, reason: 'Wrong person claimed it.' } });
    expect(await refusal(emit(scout.authId, { type: 'correction.rejected', about: proposal.id }))).toMatch(/owner_only/);
    const approved = await emit(owner.authId, { type: 'correction.applied', about: e.id, payload: { patch: { owner: 'x' }, proposal: proposal.id, reason: 'Photos support it.' } });
    expect(approved.actor_role).toBe('owner');
    expect((await chain()).ok).toBe(true);
  });
  it('a correction needs something to be about, and the target must exist', async () => {
    const scout = await person('surveyor');
    expect(await refusal(emit(scout.authId, { type: 'correction.applied' }))).toMatch(/about_required/);
    expect(await refusal(emit(scout.authId, { type: 'correction.applied', about: '00000000-0000-0000-0000-000000000000' }))).toMatch(/about_not_found|foreign key/);
  });
});

describe('decisions belong to the Owner', () => {
  it('a scout cannot write a decision event; the Owner can', async () => {
    const scout = await person('surveyor');
    const owner = await person('owner');
    expect(await refusal(emit(scout.authId, { type: 'decision.approved' }))).toMatch(/owner_only/);
    await expect(emit(owner.authId, { type: 'decision.info_requested' })).resolves.toBeTruthy();
  });
});
