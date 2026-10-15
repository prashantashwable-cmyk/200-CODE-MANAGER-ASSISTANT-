/**
 * Leads and the ownership rule, proved against a real Postgres with the same migrations Supabase runs. Every test acts as a browser
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

const refusal = async (p: Promise<unknown>): Promise<string> => { try { await p; return 'ok'; } catch (e) { return (e as Error).message; } };

type Out = { outcome: 'claims' | 'supporting' | 'review'; leadId: string; ownerLeadId: string | null; reason: string | null; duplicate: boolean };
const capture = (authId: string, o: { id: string; lat: number; lng: number; acc?: number | null; at?: Date | null; sent?: Date | null; site?: string; scout?: string }) => as(authId, async (c) =>
  (await c.query<{ r: Out }>('select public.submit_lead_capture($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) as r',
    [o.id, o.site ?? 'Test Heights', 'Mr Test', '9822000000', 'B', 'addr', 'Pune', '411057', o.lat, o.lng, o.acc ?? null, o.at ?? null, o.sent ?? null, o.scout ?? null])).rows[0].r);

// Each test works in its own square so tests never meet each other's leads.
let cell = 0;
const spot = () => { cell += 1; return { lat: 12 + cell * 0.05, lng: 70 + cell * 0.05 }; };
const east = (p: { lat: number; lng: number }, m: number) => ({ lat: p.lat, lng: p.lng + m / (111_320 * Math.cos((p.lat * Math.PI) / 180)) });

describe('capturing a site', () => {
  it('only a scout or the Owner can capture, and the server fills in who and when', async () => {
    const scout = await person('surveyor');
    const cust = await person('customer');
    const admin = await person('admin');
    const p = spot();
    expect(await refusal(capture(cust.authId, { id: 'a', ...p }))).toMatch(/forbidden/);
    expect(await refusal(capture(admin.authId, { id: 'a', ...p }))).toMatch(/forbidden/);
    expect(await refusal(capture(scout.authId, { id: '', ...p }))).toMatch(/client_event_id_required/);
    expect(await refusal(capture(scout.authId, { id: 'a', ...p, lat: 95 }))).toMatch(/location_invalid/);
    expect(await refusal(capture(scout.authId, { id: 'a', ...p, site: '  ' }))).toMatch(/site_name_required/);
    const r = await capture(scout.authId, { id: 'a', ...p, acc: 12 });
    expect(r.outcome).toBe('claims');
    const lead = (await pool.query<{ owner_scout_id: string; received_at: Date }>('select owner_scout_id, received_at from public.leads where id = $1', [r.leadId])).rows[0];
    expect(lead.owner_scout_id).toBe(scout.profileId);
    expect(Math.abs(Date.now() - lead.received_at.getTime())).toBeLessThan(60_000);
  });
  it('a scout cannot capture on another scout’s behalf, the Owner can; a retry is recorded once', async () => {
    const a = await person('surveyor');
    const b = await person('surveyor');
    const owner = await person('owner');
    const p = spot();
    expect(await refusal(capture(a.authId, { id: 'x', ...p, scout: b.profileId }))).toMatch(/forbidden/);
    const first = await capture(a.authId, { id: 'x', ...p });
    const again = await capture(a.authId, { id: 'x', ...p });
    expect(again.duplicate).toBe(true);
    expect(again.leadId).toBe(first.leadId);
    const forB = await capture(owner.authId, { id: 'y', ...east(spot(), 0), scout: b.profileId });
    expect((await pool.query('select owner_scout_id from public.leads where id = $1', [forB.leadId])).rows[0].owner_scout_id).toBe(b.profileId);
  });
  it('a second scout at the same place supports the first lead instead of making a rival', async () => {
    const a = await person('surveyor');
    const b = await person('surveyor');
    const p = spot();
    const first = await capture(a.authId, { id: '1', ...p, acc: 10, at: new Date(Date.now() - 3_600_000) });
    const second = await capture(b.authId, { id: '1', ...east(p, 30), acc: 10, at: new Date(Date.now() - 600_000) });
    expect(second.outcome).toBe('supporting');
    expect(second.ownerLeadId).toBe(first.leadId);
    expect((await pool.query('select count(*)::int n from public.leads where lat between $1 and $2', [p.lat - 0.001, p.lat + 0.001])).rows[0].n).toBe(1);
  });
  it('captures at two places far apart each claim', async () => {
    const a = await person('surveyor');
    const b = await person('surveyor');
    const p = spot();
    expect((await capture(a.authId, { id: '1', ...p })).outcome).toBe('claims');
    expect((await capture(b.authId, { id: '1', ...east(p, 400) })).outcome).toBe('claims');
  });
  it('two scouts too close in time go to the Owner, and the review is the Owner’s to read', async () => {
    const a = await person('surveyor');
    const b = await person('surveyor');
    const owner = await person('owner');
    const admin = await person('admin');
    const p = spot();
    const now = Date.now();
    await capture(a.authId, { id: '1', ...p, acc: 10, at: new Date(now - 60_000) });
    const r = await capture(b.authId, { id: '1', ...east(p, 20), acc: 10, at: new Date(now - 30_000) });
    expect(r.outcome).toBe('review');
    expect(r.reason).toBe('too_close_to_order');
    const rows = (a: string) => as(a, async (c) => (await c.query('select id from public.lead_reviews')).rowCount);
    expect(await rows(owner.authId)).toBeGreaterThan(0);
    expect(await rows(admin.authId)).toBe(0);
    expect(await rows(a.authId)).toBe(0);
  });
});

describe('who can read leads', () => {
  it('a scout sees their own site exactly, not another scout’s; the Owner sees all; Admin and customers see no single site', async () => {
    const a = await person('surveyor');
    const b = await person('surveyor');
    const owner = await person('owner');
    const admin = await person('admin');
    const cust = await person('customer');
    const pa = spot();
    const pb = spot();
    const la = await capture(a.authId, { id: '1', ...pa });
    const lb = await capture(b.authId, { id: '1', ...pb });
    const ids = (au: string) => as(au, async (c) => (await c.query<{ id: string }>('select id from public.leads')).rows.map((r) => r.id));
    expect(await ids(a.authId)).toContain(la.leadId);
    expect(await ids(a.authId)).not.toContain(lb.leadId);
    expect(await ids(owner.authId)).toEqual(expect.arrayContaining([la.leadId, lb.leadId]));
    expect(await ids(admin.authId)).toEqual([]);
    expect(await ids(cust.authId)).toEqual([]);
  });
  it('nobody writes leads or captures directly', async () => {
    const a = await person('surveyor');
    const owner = await person('owner');
    for (const who of [a, owner]) {
      expect(await refusal(as(who.authId, (c) => c.query("insert into public.leads (code, owner_scout_id, original_scout_id, site_name, lat, lng, captured_at) values ('x', $1, $1, 's', 1, 1, now())", [who.profileId])))).toMatch(/permission denied/);
      expect(await refusal(as(who.authId, (c) => c.query("update public.leads set owner_scout_id = $1", [who.profileId])))).toMatch(/permission denied/);
      expect(await refusal(as(who.authId, (c) => c.query('delete from public.lead_captures')))).toMatch(/permission denied/);
    }
  });
  it('Admin sees density only: cells with at least 3 leads, never a single site', async () => {
    const s = [await person('surveyor'), await person('surveyor'), await person('surveyor')];
    const admin = await person('admin');
    const p = spot();
    for (const [i, sc] of s.entries()) await capture(sc.authId, { id: 'd', ...east(p, i * 500), at: new Date(Date.now() - i * 10_000_000) });
    const cells = await as(admin.authId, async (c) => (await c.query<{ cell_lat: number; leads: string }>('select * from public.lead_density()')).rows);
    for (const c of cells) expect(Number(c.leads)).toBeGreaterThanOrEqual(3);
    const lone = spot();
    await capture(s[0].authId, { id: 'lone', ...lone });
    const after = await as(admin.authId, async (c) => (await c.query<{ cell_lat: number }>('select * from public.lead_density()')).rows);
    expect(after.some((c) => Math.abs(c.cell_lat - lone.lat) < 0.006)).toBe(false);
  });
});

describe('the ownership rule is the owner’s to set', () => {
  it('only the Owner changes it; history is append-only', async () => {
    const owner = await person('owner');
    const admin = await person('admin');
    const ins = (a: string) => as(a, (c) => c.query("insert into public.ownership_settings_versions (version, radius_m, window_days, accuracy_limit_m, too_close_min, max_offline_h, reason) values (0, 80, 30, 30, 5, 72, 'A good reason here')"));
    expect(await refusal(ins(admin.authId))).toMatch(/owner_only|row-level security/);
    expect(await refusal(ins(owner.authId))).toBe('ok');
    expect(await refusal(as(owner.authId, (c) => c.query("update public.ownership_settings_versions set radius_m = 1")))).toMatch(/permission denied|append_only/);
    await as(owner.authId, (c) => c.query("insert into public.ownership_settings_versions (version, radius_m, window_days, accuracy_limit_m, too_close_min, max_offline_h, reason) values (0, 60, 30, 30, 5, 72, 'Back to the starting values')"));
  });
});

describe('the database and the app decide ownership the same way', () => {
  it('120 random pairs of captures get the same outcome and reason', async () => {
    const { decideOwnership, DEFAULT_OWNERSHIP } = await import('../../src/features/leads/ownership');
    let seed = 12345;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const HOUR = 3_600_000;
    let seen: Record<string, number> = {};
    for (let i = 0; i < 120; i += 1) {
      const a = await person('surveyor');
      const same = rnd() < 0.5;
      const b = same ? a : await person('surveyor');
      const p = spot();
      const q = east(p, Math.floor(rnd() * 130));
      const accA = rnd() < 0.2 ? null : Math.floor(rnd() * 80);
      const accB = rnd() < 0.2 ? null : Math.floor(rnd() * 80);
      const nowMs = Date.now();
      const recA = new Date(nowMs - Math.floor(rnd() * 40 * 24) * HOUR - 3 * HOUR);
      const capA = new Date(recA.getTime() - Math.floor(rnd() * 20 * HOUR) * (rnd() < 0.5 ? 1 : 0));
      const skewA = rnd() < 0.7 ? 0 : Math.floor((rnd() - 0.5) * 2 * HOUR);
      // The earlier capture, put in as the server would have kept it.
      const lead = (await pool.query<{ id: string }>("insert into public.leads (code, owner_scout_id, original_scout_id, site_name, lat, lng, accuracy_m, captured_at, received_at, skew_ms) values ($1, $2, $2, 's', $3, $4, $5, $6, $7, $8) returning id", ['T' + i + '-' + nowMs, a.profileId, p.lat, p.lng, accA, capA, recA, skewA])).rows[0].id;
      await pool.query("insert into public.lead_captures (lead_id, scout_id, outcome, lat, lng, accuracy_m, captured_at, received_at, skew_ms, client_event_id) values ($1, $2, 'claims', $3, $4, $5, $6, $7, $8, 'seed')", [lead, a.profileId, p.lat, p.lng, accA, capA, recA, skewA]);
      const capB = new Date(nowMs - Math.floor(rnd() * 80 * HOUR));
      const sent = rnd() < 0.5 ? null : new Date(nowMs + Math.floor((rnd() - 0.5) * 2 * HOUR));
      const r = await capture(b.authId, { id: 'in', ...q, acc: accB, at: capB, sent });
      const got = (await pool.query<{ received_at: Date; skew_ms: string }>('select received_at, skew_ms from public.lead_captures where scout_id = $1 and client_event_id = $2', [b.profileId, 'in'])).rows[0];
      const verdict = decideOwnership(
        [{ leadId: lead, scoutId: a.profileId, at: p, capturedAt: capA.toISOString(), receivedAt: recA.toISOString(), clockSkewMs: skewA, accuracyM: accA }],
        { leadId: 'new', scoutId: b.profileId, at: q, capturedAt: capB.toISOString(), receivedAt: got.received_at.toISOString(), clockSkewMs: Number(got.skew_ms), accuracyM: accB },
        { ...DEFAULT_OWNERSHIP },
      );
      const label = `#${i} same=${same} d=${Math.round(Math.abs(q.lng - p.lng) * 111_320 * Math.cos((p.lat * Math.PI) / 180))}`;
      expect({ label, outcome: r.outcome, reason: r.reason ?? null }).toEqual({ label, outcome: verdict.outcome, reason: verdict.outcome === 'review' ? verdict.reason : null });
      seen[verdict.outcome] = (seen[verdict.outcome] ?? 0) + 1;
    }
    // The comparison is only worth something if it met every kind of outcome.
    expect(Object.keys(seen).sort()).toEqual(['claims', 'review', 'supporting']);
  });
});
