/**
 * Facilitator quotes and the fee, proved against a real Postgres with the same migrations Supabase runs. Every test acts as a browser
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

const comps = (extra: Record<string, unknown>[] = []) => JSON.stringify([
  { id: 'c1', partnerId: 'sp-1', partnerName: 'Vertex', kind: 'material', description: 'm', partnerPriceInr: 600000 },
  { id: 'c2', partnerId: 't-1', partnerName: 'Santosh', kind: 'installation', description: 'i', partnerPriceInr: 400000 },
  { id: 'c3', partnerId: 'gov', partnerName: 'Inspectorate', kind: 'statutory', description: 's', partnerPriceInr: 20000 },
  ...extra,
]);
const feeSettings = (over: Record<string, unknown> = {}) => JSON.stringify({ mode: 'F', style: 'markup', targetPct: 60, assistantFloorPct: 30, humanFloorPct: 20, fixedFeeInr: 150000, tiers: [{ upToInr: 500000, pct: 60 }, { upToInr: 1500000, pct: 40 }, { upToInr: null, pct: 30 }], gstPctOnFee: 18, tokenInr: 10000, ...over });
const COSTS = JSON.stringify({ scoutCommissionPct: 5, salesCommissionPct: 5, qcFeeInr: 1500, mentorBonusPct: 1, providerCostsInr: 2000, infrastructurePct: 2, reservePct: 5 });

const newQuote = (authId: string, o: { customer?: string; discount?: number; client?: string; components?: string } = {}) => as(authId, async (c) => (await c.query<{ id: string; code: string; status: string; fee_inr: string; base_inr: string; effective_pct: string; created_by: string }>(
  `insert into public.facilitator_quotes (code, lead_ref, site_name, customer_id, components, bundle_discount_inr, totals, client_event_id, status, fee_inr, base_inr)
   values ('x', 'l-3', 'Test Heights', $1, $2, $3, '{}'::jsonb, $4, 'accepted', 1, 1) returning id, code, status, fee_inr, base_inr, effective_pct, created_by`,
  [o.customer ?? null, o.components ?? comps(), o.discount ?? 0, o.client ?? null])).rows[0]);
const sendQuote = (authId: string, id: string) => as(authId, (c) => c.query("update public.facilitator_quotes set status = 'sent' where id = $1", [id]));

describe('the fee', () => {
  it('only the Owner changes it, with valid values, and the history can never be edited', async () => {
    const owner = await person('owner');
    const admin = await person('admin');
    const insert = (a: string, settings: string, reason = 'A proper reason here') => as(a, (c) => c.query('insert into public.fee_settings_versions (version, settings, cost_rates, set_by_name, reason) values (0, $1, $2, $3, $4)', [settings, COSTS, 'x', reason]));
    expect(await refusal(insert(admin.authId, feeSettings()))).toMatch(/owner_only|row-level security/);
    expect(await refusal(insert(owner.authId, feeSettings({ humanFloorPct: 99 })))).toMatch(/floors_order/);
    expect(await refusal(insert(owner.authId, feeSettings({ gstPctOnFee: 90 })))).toMatch(/gst_range/);
    expect(await refusal(insert(owner.authId, feeSettings(), 'short'))).toMatch(/check|reason/);
    const before = (await pool.query<{ v: number }>('select max(version) v from public.fee_settings_versions')).rows[0].v;
    expect(await refusal(insert(owner.authId, feeSettings({ targetPct: 55 })))).toBe('ok');
    const row = (await pool.query<{ version: number; set_by: string }>('select version, set_by from public.fee_settings_versions order by version desc limit 1')).rows[0];
    expect(row.version).toBe(before + 1);
    expect(row.set_by).toBe(owner.profileId);
    expect(await refusal(as(owner.authId, (c) => c.query('update public.fee_settings_versions set reason = $1 where version = 1', ['changed after the fact'])))).toMatch(/permission denied|append_only/);
    expect(await refusal(as(owner.authId, (c) => c.query('delete from public.fee_settings_versions')))).toMatch(/permission denied|append_only/);
    await as(owner.authId, (c) => c.query('insert into public.fee_settings_versions (version, settings, cost_rates, set_by_name, reason) values (0, $1, $2, $3, $4)', [feeSettings(), COSTS, 'x', 'Back to the starting values']));
  });
  it('customers cannot read the fee settings or the platform costs', async () => {
    const customer = await person('customer');
    const rows = await as(customer.authId, async (c) => (await c.query('select * from public.fee_settings_versions')).rows);
    expect(rows).toEqual([]);
  });
});

describe('a quote', () => {
  it('is priced by the server: fee, band and code are not the browser’s to choose', async () => {
    const admin = await person('admin');
    const q = await newQuote(admin.authId);
    expect(q.status).toBe('draft');
    expect(q.code).toMatch(/^AIEC-FQ-\d+$/);
    expect(q.base_inr).toBe('1000000');
    expect(q.fee_inr).toBe('600000');
    expect(q.effective_pct).toBe('60.0');
    expect(q.created_by).toBe(admin.profileId);
  });
  it('Admin may not go below the person floor; the Owner may', async () => {
    const admin = await person('admin');
    const owner = await person('owner');
    expect(await refusal(newQuote(admin.authId, { discount: 450000 }))).toMatch(/needs_owner/);
    expect(await refusal(newQuote(admin.authId, { discount: 400000 }))).toBe('ok'); // 200000 = 20%
    const deep = await newQuote(owner.authId, { discount: 590000 });
    expect(deep.fee_inr).toBe('10000');
    expect(await refusal(newQuote(owner.authId, { discount: 700000 }))).toMatch(/discount_exceeds_fee/);
  });
  it('refuses a bad price, and customers, partners and anon cannot make one', async () => {
    const admin = await person('admin');
    const customer = await person('customer');
    const tech = await person('technician');
    expect(await refusal(newQuote(admin.authId, { components: JSON.stringify([{ id: 'x', kind: 'material', partnerPriceInr: 0 }]) }))).toMatch(/bad_price/);
    expect(await refusal(newQuote(customer.authId))).toMatch(/forbidden|row-level security/);
    expect(await refusal(newQuote(tech.authId))).toMatch(/forbidden|row-level security/);
  });
  it('the priced facts never change, only a draft is sent, and nothing is deleted', async () => {
    const admin = await person('admin');
    const q = await newQuote(admin.authId);
    const upd = (sql: string) => as(admin.authId, (c) => c.query(sql, [q.id]));
    expect(await refusal(upd("update public.facilitator_quotes set bundle_discount_inr = 1 where id = $1"))).toMatch(/quote_is_priced/);
    expect(await refusal(upd("update public.facilitator_quotes set components = '[]'::jsonb where id = $1"))).toMatch(/quote_is_priced|check/);
    expect(await refusal(upd("update public.facilitator_quotes set status = 'accepted' where id = $1"))).toMatch(/invalid_state/);
    expect(await refusal(sendQuote(admin.authId, q.id))).toBe('ok');
    expect(await refusal(sendQuote(admin.authId, q.id))).toMatch(/invalid_state/);
    expect(await refusal(upd('delete from public.facilitator_quotes where id = $1'))).toMatch(/permission denied|quotes_are_kept/);
  });
  it('a later fee change does not re-price a saved quote', async () => {
    const admin = await person('admin');
    const owner = await person('owner');
    const q = await newQuote(admin.authId);
    await as(owner.authId, (c) => c.query('insert into public.fee_settings_versions (version, settings, cost_rates, set_by_name, reason) values (0, $1, $2, $3, $4)', [feeSettings({ targetPct: 40 }), COSTS, 'x', 'Testing that old quotes stay']));
    const after = (await pool.query<{ fee_inr: string; fee_version: number }>('select fee_inr, fee_version from public.facilitator_quotes where id = $1', [q.id])).rows[0];
    expect(after.fee_inr).toBe('600000');
    await as(owner.authId, (c) => c.query('insert into public.fee_settings_versions (version, settings, cost_rates, set_by_name, reason) values (0, $1, $2, $3, $4)', [feeSettings(), COSTS, 'x', 'Back to the starting values']));
  });
  it('tiered fees are computed from the stored tiers, marginally', async () => {
    const owner = await person('owner');
    await as(owner.authId, (c) => c.query('insert into public.fee_settings_versions (version, settings, cost_rates, set_by_name, reason) values (0, $1, $2, $3, $4)', [feeSettings({ style: 'tiered' }), COSTS, 'x', 'Trying tiered fees']));
    const big = JSON.stringify([{ id: 'c1', partnerId: 'a', partnerName: 'A', kind: 'material', description: 'm', partnerPriceInr: 2000000 }]);
    const q = await newQuote(owner.authId, { components: big });
    expect(q.fee_inr).toBe(String(300000 + 400000 + 150000));
    await as(owner.authId, (c) => c.query('insert into public.fee_settings_versions (version, settings, cost_rates, set_by_name, reason) values (0, $1, $2, $3, $4)', [feeSettings(), COSTS, 'x', 'Back to the starting values']));
  });
});

describe('customer acceptance', () => {
  it('sees only their own sent quote; accepts each component once; the quote moves to accepted when all are', async () => {
    const admin = await person('admin');
    const cust = await person('customer');
    const other = await person('customer');
    const q = await newQuote(admin.authId, { customer: cust.profileId });
    const mine = (a: string) => as(a, async (c) => (await c.query('select id from public.facilitator_quotes where id = $1', [q.id])).rowCount);
    expect(await mine(cust.authId)).toBe(0); // a draft is not theirs to see yet
    await sendQuote(admin.authId, q.id);
    expect(await mine(cust.authId)).toBe(1);
    expect(await mine(other.authId)).toBe(0);
    const acc = (a: string, line: string) => as(a, (c) => c.query('insert into public.quote_acceptances (quote_id, line_id, customer_id) values ($1, $2, $3)', [q.id, line, q.id]));
    expect(await refusal(acc(other.authId, 'c1'))).toMatch(/not_found|row-level security/);
    expect(await refusal(acc(cust.authId, 'nope'))).toMatch(/not_found/);
    expect(await refusal(acc(cust.authId, 'c1'))).toBe('ok');
    expect((await pool.query('select status from public.facilitator_quotes where id = $1', [q.id])).rows[0].status).toBe('partly_accepted');
    expect(await refusal(acc(cust.authId, 'c1'))).toMatch(/duplicate|unique|pkey/);
    expect(await refusal(acc(cust.authId, 'c2'))).toBe('ok');
    expect(await refusal(acc(cust.authId, 'c3'))).toBe('ok');
    expect((await pool.query('select status from public.facilitator_quotes where id = $1', [q.id])).rows[0].status).toBe('accepted');
    expect(await refusal(as(cust.authId, (c) => c.query('delete from public.quote_acceptances')))).toMatch(/permission denied|acceptances_are_kept/);
    expect(await refusal(as(cust.authId, (c) => c.query("update public.quote_acceptances set line_id = 'z'")))).toMatch(/permission denied|acceptances_are_kept/);
  });
  it('a customer cannot move a quote’s status themselves', async () => {
    const admin = await person('admin');
    const cust = await person('customer');
    const q = await newQuote(admin.authId, { customer: cust.profileId });
    await sendQuote(admin.authId, q.id);
    const r = await as(cust.authId, (c) => c.query("update public.facilitator_quotes set status = 'accepted' where id = $1", [q.id]));
    expect(r.rowCount).toBe(0);
    expect((await pool.query('select status from public.facilitator_quotes where id = $1', [q.id])).rows[0].status).toBe('sent');
  });
});

describe('the database and the app compute the same quote', () => {
  it('totals written by the server equal computeQuote for the same lines and discount', async () => {
    const { computeQuote, DEFAULT_FEE_SETTINGS } = await import('../../src/features/quotes/facilitatorQuote');
    const owner = await person('owner');
    const lines = JSON.parse(comps([{ id: 'c4', partnerId: 'x', partnerName: 'X', kind: 'logistics', description: 'l', partnerPriceInr: 77_777 }]));
    for (const discount of [0, 12_345, 250_000]) {
      const q = await newQuote(owner.authId, { components: JSON.stringify(lines), discount });
      const row = (await pool.query<{ totals: Record<string, number | string> }>('select totals from public.facilitator_quotes where id = $1', [q.id])).rows[0].totals;
      const app = computeQuote({ lines, settings: DEFAULT_FEE_SETTINGS, bundleDiscountInr: discount });
      for (const k of Object.keys(app) as (keyof typeof app)[]) expect(row[k], `${k} @ discount ${discount}`).toEqual(app[k]);
    }
  });
});
