/**
 * The Decision Desk, proved against a real Postgres with the same migrations Supabase runs. Every test acts as a browser
 * would: `authenticated` with the person's id in the JWT claims. Nothing goes through the app's code, so these hold for any client.
 */
import { afterAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { randomInt } from 'node:crypto';
import { AUTHORITY_MATRIX } from '../../src/features/authority/authority';

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

const prepare = (authId: string, o: { kind?: string; title?: string; amount?: number | null } = {}) => as(authId, async (c) => (await c.query<{ r: { id: string; code: string; status: string } }>(
  'select public.prepare_decision($1, $2, $3, $4) as r', [o.kind ?? 'payout_release', o.title ?? 'Release weekly payout to Anil', 'Milestone 2 passed independent QC; customer confirmed the work.', o.amount ?? null])).rows[0].r);
const decide = (authId: string, card: string, action: string, reason = 'Looks right on the evidence', o: { edits?: string; to?: string } = {}) => as(authId, async (c) => (await c.query<{ r: { status: string; as: string; seq: number } }>(
  'select public.decide_decision($1, $2, $3, $4, $5) as r', [card, action, reason, o.edits ?? null, o.to ?? null])).rows[0].r);
const chain = (authId: string) => as(authId, async (c) => (await c.query<{ ok: boolean; checked: string; broken_at: string | null }>('select * from public.verify_decision_chain()')).rows[0]);

describe('the kinds of decision', () => {
  it('match the app’s authority matrix exactly', async () => {
    const rows = (await pool.query<{ kind: string; delegable: boolean; delegate_limit_inr: string | null }>('select * from public.decision_kinds')).rows;
    const fromDb = Object.fromEntries(rows.map((r) => [r.kind, { delegable: r.delegable, limit: r.delegate_limit_inr == null ? null : Number(r.delegate_limit_inr) }]));
    const fromApp = Object.fromEntries(Object.values(AUTHORITY_MATRIX).map((a) => [a.kind, { delegable: a.delegable, limit: a.delegateLimitInr }]));
    expect(fromDb).toEqual(fromApp);
  });
});

describe('preparing and deciding', () => {
  it('Admin and Owner prepare a packet; nobody else; the Owner alone decides, with a reason', async () => {
    const admin = await person('admin');
    const owner = await person('owner');
    const cust = await person('customer');
    const scout = await person('surveyor');
    expect(await refusal(prepare(cust.authId))).toMatch(/forbidden/);
    expect(await refusal(prepare(scout.authId))).toMatch(/forbidden/);
    expect(await refusal(prepare(admin.authId, { title: 'short' }))).toMatch(/title_short/);
    const card = await prepare(admin.authId);
    expect(card.status).toBe('pending');
    expect(await refusal(decide(admin.authId, card.id, 'approve'))).toMatch(/admin_cannot_decide/);
    expect(await refusal(decide(cust.authId, card.id, 'approve'))).toMatch(/forbidden/);
    expect(await refusal(decide(owner.authId, card.id, 'approve', 'no'))).toMatch(/reason_short/);
    expect(await refusal(decide(owner.authId, card.id, 'edit'))).toMatch(/edits_missing/);
    expect(await refusal(decide(owner.authId, card.id, 'delegate'))).toMatch(/delegate_missing/);
    expect((await decide(owner.authId, card.id, 'approve')).status).toBe('approved');
    expect(await refusal(decide(owner.authId, card.id, 'reject'))).toMatch(/already_decided/);
  });
  it('asking for more information leaves the card open for a later decision', async () => {
    const owner = await person('owner');
    const card = await prepare(owner.authId);
    expect((await decide(owner.authId, card.id, 'ask_info', 'Need the QC photos first')).status).toBe('info_requested');
    expect((await decide(owner.authId, card.id, 'edit', 'Approved with a smaller amount', { edits: 'Pay 30,000 now' })).status).toBe('approved');
  });
});

describe('delegation', () => {
  it('a delegate decides only the card handed to them, for a week, within the kind’s limit; never a kind that cannot be delegated', async () => {
    const owner = await person('owner');
    const delegate = await person('technician');
    const other = await person('technician');
    const small = await prepare(owner.authId, { kind: 'payout_release', amount: 40_000 });
    const big = await prepare(owner.authId, { kind: 'payout_release', amount: 60_000 });
    const fee = await prepare(owner.authId, { kind: 'fee_change', title: 'Lower the fee target' });
    for (const c of [small, big, fee]) await decide(owner.authId, c.id, 'delegate', 'Please take this one', { to: delegate.profileId });
    expect(await refusal(decide(other.authId, small.id, 'approve'))).toMatch(/forbidden/);
    expect(await refusal(decide(delegate.authId, big.id, 'approve'))).toMatch(/forbidden/);
    expect(await refusal(decide(delegate.authId, fee.id, 'approve'))).toMatch(/forbidden/);
    expect(await refusal(decide(delegate.authId, small.id, 'delegate', 'Passing it on', { to: other.profileId }))).toMatch(/forbidden/);
    const r = await decide(delegate.authId, small.id, 'approve', 'Checked the QC report myself');
    expect(r.as).toBe('delegate');
  });
  it('a delegation lapses after seven days', async () => {
    const owner = await person('owner');
    const delegate = await person('technician');
    const card = await prepare(owner.authId, { kind: 'tier_change', title: 'Raise a scout to senior' });
    await decide(owner.authId, card.id, 'delegate', 'Please take this one', { to: delegate.profileId });
    await pool.query("update public.decision_cards set delegated_at = now() - interval '8 days' where id = $1", [card.id]);
    expect(await refusal(decide(delegate.authId, card.id, 'approve'))).toMatch(/forbidden/);
  });
  it('a delegate sees only their own card; Admin sees status without evidence or amounts; the Owner sees all', async () => {
    const owner = await person('owner');
    const admin = await person('admin');
    const delegate = await person('technician');
    const mine = await prepare(owner.authId, { kind: 'tier_change', title: 'Raise a scout to senior', amount: 5 });
    const notMine = await prepare(owner.authId, { kind: 'tier_change', title: 'Raise another to senior' });
    await decide(owner.authId, mine.id, 'delegate', 'Please take this one', { to: delegate.profileId });
    const ids = (a: string) => as(a, async (c) => (await c.query<{ id: string }>('select id from public.decision_cards')).rows.map((r) => r.id));
    expect(await ids(delegate.authId)).toEqual([mine.id]);
    expect(await ids(admin.authId)).toEqual([]);
    expect(await ids(owner.authId)).toEqual(expect.arrayContaining([mine.id, notMine.id]));
    const status = await as(admin.authId, async (c) => (await c.query('select * from public.decision_cards_status where id = $1', [mine.id])).rows[0]);
    expect(status.status).toBe('delegated');
    expect(Object.keys(status)).not.toEqual(expect.arrayContaining(['evidence']));
    expect(Object.keys(status)).not.toEqual(expect.arrayContaining(['amount_inr']));
    expect(await as(delegate.authId, async (c) => (await c.query('select * from public.decision_cards_status')).rowCount)).toBe(0);
  });
});

describe('the record of decisions', () => {
  it('is chained, immutable for everyone, and a tamper is found', async () => {
    const owner = await person('owner');
    const admin = await person('admin');
    for (let i = 0; i < 3; i += 1) await decide(owner.authId, (await prepare(owner.authId)).id, 'approve');
    const ok = await chain(admin.authId);
    expect(ok.ok).toBe(true);
    expect(Number(ok.checked)).toBeGreaterThanOrEqual(3);
    for (const who of [owner, admin]) {
      expect(await refusal(as(who.authId, (c) => c.query("update public.decision_records set reason = 'rewritten history'")))).toMatch(/permission denied/);
      expect(await refusal(as(who.authId, (c) => c.query('delete from public.decision_records')))).toMatch(/permission denied/);
      expect(await refusal(as(who.authId, (c) => c.query("insert into public.decision_cards (code, kind, title, summary, proposed_by_kind, proposed_by_name) values ('x', 'dispute', 'abcdefgh', 'abcdefghijklmnopqrstu', 'owner', 'x')")))).toMatch(/permission denied/);
      expect(await refusal(as(who.authId, (c) => c.query("update public.decision_cards set status = 'approved'")))).toMatch(/permission denied/);
    }
    expect(await refusal(chain((await person('customer')).authId))).toMatch(/forbidden/);
    // Someone with the database's own keys rewrites a record; the chain no longer verifies.
    const c = await pool.connect();
    try {
      await c.query('alter table public.decision_records disable trigger decision_records_no_change');
      await c.query("update public.decision_records set reason = 'rewritten after the fact' where seq = (select max(seq) from public.decision_records)");
      expect((await chain(admin.authId)).ok).toBe(false);
      await c.query("update public.decision_records set reason = 'Looks right on the evidence' where seq = (select max(seq) from public.decision_records)");
      await c.query('alter table public.decision_records enable trigger decision_records_no_change');
    } finally { c.release(); }
    expect((await chain(admin.authId)).ok).toBe(true);
  });
});

describe('disputes between scouts become cards for the Owner', () => {
  it('a capture the server will not settle alone raises exactly one card', async () => {
    const a = await person('surveyor');
    const b = await person('surveyor');
    const owner = await person('owner');
    const cap = (au: string, id: string, lng: number, at: Date) => as(au, (c) => c.query('select public.submit_lead_capture($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', [id, 'Baner Road Heights', 'x', '9822000000', 'B', 'a', 'Pune', '411045', 33.3, lng, 10, at, null, null]));
    const now = Date.now();
    await cap(a.authId, '1', 77.7, new Date(now - 60_000));
    await cap(b.authId, '1', 77.70005, new Date(now - 30_000));
    const before = (await as(owner.authId, async (c) => (await c.query("select id from public.decision_cards where kind = 'lead_ownership_dispute' and title like 'Two scouts claim Baner Road Heights'")).rowCount));
    expect(before).toBe(1);
    await cap(b.authId, '1', 77.70005, new Date(now - 30_000)); // the same capture again
    expect(await as(owner.authId, async (c) => (await c.query("select id from public.decision_cards where title like 'Two scouts claim Baner Road Heights'")).rowCount)).toBe(1);
  });
});
