/**
 * Work orders and milestone gates, proved against a real Postgres with the same migrations Supabase runs. Every test acts as a browser
 * would: `authenticated` with the person's id in the JWT claims. Nothing goes through the app's code, so these hold for any client.
 */
import { afterAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { randomInt } from 'node:crypto';
import { DEFAULT_TEMPLATES, amountsFor, templateProblem } from '@/features/workorders/workOrder';
import type { MilestoneTemplate } from '@/features/workorders/workOrder';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
afterAll(() => pool.end());

type Q = pg.PoolClient;
let phoneSeq = randomInt(0, 9_000) * 10_000 + 7_000_000;
const nextPhone = () => `96${String(10_000_000 + (phoneSeq += 1)).padStart(8, '0')}`;

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
type P = Awaited<ReturnType<typeof person>>;

const refusal = async (p: Promise<unknown>): Promise<string> => { try { await p; return 'ok'; } catch (e) { return (e as Error).message; } };

const comps = JSON.stringify([
  { id: 'c1', partnerId: 'sp-1', partnerName: 'Vertex', kind: 'material', description: 'machine and cabin', partnerPriceInr: 600001 },
  { id: 'c2', partnerId: 't-1', partnerName: 'Santosh', kind: 'installation', description: 'install', partnerPriceInr: 400000 },
  { id: 'c3', partnerId: 'gov', partnerName: 'Inspectorate', kind: 'statutory', description: 'licence fee', partnerPriceInr: 20000 },
]);

interface World { owner: P; admin: P; customer: P; tech: P; supplier: P; otherCustomer: P; otherTech: P; quoteId: string; lead: string }

/** A sent quote whose customer has accepted all three parts. */
async function world(): Promise<World> {
  const [owner, admin, customer, tech, supplier, otherCustomer, otherTech] = await Promise.all(['owner', 'admin', 'customer', 'technician', 'supplier', 'customer', 'technician'].map((r) => person(r)));
  const lead = `l-wo-${randomInt(1, 1e9)}`;
  const quoteId = (await as(owner.authId, async (c) => (await c.query<{ id: string }>(
    `insert into public.facilitator_quotes (code, lead_ref, site_name, customer_id, components, bundle_discount_inr, totals, status, fee_inr, base_inr)
     values ('x', $1, 'Test Heights', $2, $3, 0, '{}'::jsonb, 'accepted', 1, 1) returning id`, [lead, customer.profileId, comps])).rows[0].id));
  await as(owner.authId, (c) => c.query("update public.facilitator_quotes set status = 'sent' where id = $1", [quoteId]));
  await as(customer.authId, async (c) => { for (const l of ['c1', 'c2', 'c3']) await c.query('insert into public.quote_acceptances (quote_id, line_id, customer_id) values ($1, $2, $3)', [quoteId, l, customer.profileId]); });
  return { owner, admin, customer, tech, supplier, otherCustomer, otherTech, quoteId, lead };
}
const issue = (w: World, partners?: Record<string, string>) => as(w.owner.authId, async (c) =>
  (await c.query<{ ids: string[] }>('select public.create_work_orders($1, $2::jsonb) as ids', [w.quoteId, JSON.stringify(partners ?? { c1: w.supplier.profileId, c2: w.tech.profileId })])).rows[0].ids);
const orders = (authId: string) => as(authId, async (c) => (await c.query<{ quote_id: string; id: string; kind: string; status: string; price_inr: string; partner_profile_id: string; code: string; template_version: number }>('select * from public.work_orders order by kind')).rows);
/** What one person can read of one world's orders (staff of the same world also see other tests' orders, so every check is scoped to its own quote). */
const ordersOf = async (w: World, who: P) => (await orders(who.authId)).filter((r) => r.quote_id === w.quoteId);
const milestones = (authId: string, wo: string) => as(authId, async (c) => (await c.query<{ milestone_id: string; amount_inr: string; status: string; evidence: string[]; position: number }>('select * from public.work_order_milestones where work_order_id = $1 order by position', [wo])).rows);
const call = (authId: string, sql: string, args: unknown[]) => as(authId, (c) => c.query(sql, args));
const events = async (lead: string) => (await pool.query<{ event_type: string; actor_profile_id: string; actor_role: string; seq: string; payload: Record<string, unknown> }>('select event_type, actor_profile_id, actor_role, seq, payload from public.platform_events where subject_id = $1 order by seq', [lead])).rows;

describe('milestone templates', () => {
  it('start from the defaults, only the Owner adds a version, bad ones are refused, and history is append-only', async () => {
    const owner = await person('owner');
    const admin = await person('admin');
    const v1 = (await pool.query<{ templates: Record<string, MilestoneTemplate[]> }>('select templates from public.milestone_template_versions where version = 1')).rows[0].templates;
    expect(v1.material.map((m) => m.pct)).toEqual([90, 10]);
    for (const kind of Object.keys(DEFAULT_TEMPLATES)) expect(v1[kind].map(({ id, pct, gate }) => ({ id, pct, gate }))).toEqual(DEFAULT_TEMPLATES[kind as keyof typeof DEFAULT_TEMPLATES].map(({ id, pct, gate }) => ({ id, pct, gate })));
    const add = (a: string, templates: unknown, reason = 'Pilot with a lower material advance') => as(a, (c) => c.query('insert into public.milestone_template_versions (version, templates, set_by_name, reason) values (0, $1, $2, $3)', [JSON.stringify(templates), 'x', reason]));
    expect(await refusal(add(admin.authId, v1))).toMatch(/owner_only|row-level security/);
    expect(await refusal(add(owner.authId, { ...v1, material: [{ id: 'a', label: 'a', pct: 60, gate: 'on_delivery' }] }))).toMatch(/template_sum/);
    expect(await refusal(add(owner.authId, { ...v1, material: [{ id: 'a', label: 'a', pct: 50, gate: 'on_delivery' }, { id: 'a', label: 'b', pct: 50, gate: 'on_handover' }] }))).toMatch(/template_duplicate/);
    expect(await refusal(add(owner.authId, { ...v1, material: [{ id: 'a', label: 'a', pct: 100, gate: 'whenever' }] }))).toMatch(/template_gate/);
    expect(await refusal(add(owner.authId, { ...v1, material: [{ id: 'a', label: 'a', pct: 33.5, gate: 'on_delivery' }, { id: 'b', label: 'b', pct: 66.5, gate: 'on_handover' }] }))).toMatch(/template_pct/);
    expect(await refusal(add(owner.authId, { material: v1.material }))).toMatch(/template_empty/);
    expect(await refusal(add(owner.authId, v1, 'short'))).toMatch(/check|reason/);
    expect(await refusal(add(owner.authId, v1))).toBe('ok');
    expect(await refusal(call(owner.authId, "update public.milestone_template_versions set reason = 'changed after the fact' where version = 1", []))).toMatch(/permission denied|append_only/);
    expect(await refusal(call(owner.authId, 'delete from public.milestone_template_versions', []))).toMatch(/permission denied|append_only/);
  });
});

describe('issuing work orders', () => {
  it('only the Owner issues them, each part needs a real partner account, and a refusal leaves nothing behind', async () => {
    const w = await world();
    const rpc = (who: P, partners: unknown) => call(who.authId, 'select public.create_work_orders($1, $2::jsonb)', [w.quoteId, JSON.stringify(partners)]);
    for (const who of [w.admin, w.customer, w.tech]) expect(await refusal(rpc(who, { c1: w.supplier.profileId, c2: w.tech.profileId }))).toBe('forbidden');
    expect(await refusal(rpc(w.owner, {}))).toBe('partner_account_required');
    expect(await refusal(rpc(w.owner, { c1: w.supplier.profileId }))).toBe('partner_account_required');
    expect(await refusal(rpc(w.owner, { c1: w.customer.profileId, c2: w.tech.profileId }))).toBe('partner_not_eligible'); // a customer cannot act as a partner
    expect(await refusal(rpc(w.owner, { c1: 'not-a-uuid', c2: w.tech.profileId }))).toBe('partner_not_eligible');
    const demoTech = await person('technician', { demo: true });
    expect(await refusal(rpc(w.owner, { c1: w.supplier.profileId, c2: demoTech.profileId }))).toBe('partner_not_eligible'); // demo and real never mix
    expect(await ordersOf(w, w.owner)).toHaveLength(0);
    expect(await refusal(as(null, (c) => c.query('select public.create_work_orders($1, $2::jsonb)', [w.quoteId, '{}'])))).toMatch(/permission denied/); // an anonymous visitor cannot even call it
    const ids = await issue(w);
    expect(ids).toHaveLength(2); // the statutory fee is paid to the authority: no work order
    const rows = await ordersOf(w, w.owner);
    expect(rows.map((r) => r.kind)).toEqual(['installation', 'material']);
    expect(rows.every((r) => /^AIEC-WO-\d+$/.test(r.code) && r.template_version >= 1)).toBe(true);
    expect(await issue(w, {})).toEqual([]); // idempotent, and nothing left to map
  });

  it('splits each price exactly, to whole rupees that add up', async () => {
    const w = await world();
    await issue(w);
    for (const o of await ordersOf(w, w.owner)) {
      const ms = await milestones(w.owner.authId, o.id);
      expect(ms.reduce((a, m) => a + Number(m.amount_inr), 0)).toBe(Number(o.price_inr));
    }
    const material = (await ordersOf(w, w.owner)).find((o) => o.kind === 'material')!;
    expect((await milestones(w.owner.authId, material.id)).map((m) => Number(m.amount_inr))).toEqual([540001, 60000]); // 600001 at 90 / 10: the odd rupee goes to the larger remainder
  });

  it('is visible to Admin/Owner, its customer and its partner, and to nobody else', async () => {
    const w = await world();
    await issue(w);
    expect(await ordersOf(w, w.owner)).toHaveLength(2);
    expect(await ordersOf(w, w.admin)).toHaveLength(2);
    expect(await ordersOf(w, w.customer)).toHaveLength(2);
    expect((await ordersOf(w, w.tech)).map((o) => o.kind)).toEqual(['installation']);
    expect((await ordersOf(w, w.supplier)).map((o) => o.kind)).toEqual(['material']);
    expect(await ordersOf(w, w.otherCustomer)).toHaveLength(0);
    expect(await ordersOf(w, w.otherTech)).toHaveLength(0);
    const demoAdmin = await person('admin', { demo: true });
    expect(await orders(demoAdmin.authId)).toHaveLength(0);
    const tech = (await ordersOf(w, w.tech))[0];
    expect(await milestones(w.otherTech.authId, tech.id)).toHaveLength(0);
    expect(await milestones(w.tech.authId, tech.id)).toHaveLength(2);
    expect(await orders(null as unknown as string).catch(() => [])).toEqual([]); // an anonymous visitor reads nothing
  });
});

describe('acceptance, start and the money gates', () => {
  async function started() {
    const w = await world();
    await issue(w);
    const inst = (await ordersOf(w, w.tech))[0];
    return { w, inst };
  }
  const acceptRpc = (who: P, id: string) => call(who.authId, 'select public.accept_work_order($1)', [id]);
  const startRpc = (who: P, id: string) => call(who.authId, 'select public.start_work_order($1)', [id]);
  const evidenceRpc = (who: P, id: string, ms: string, names: string[]) => call(who.authId, 'select public.submit_milestone_evidence($1, $2, $3::text[])', [id, ms, names]);
  const verifyRpc = (who: P, id: string, ms: string) => call(who.authId, 'select public.verify_milestone($1, $2)', [id, ms]);
  const payRpc = (who: P, id: string, ms: string, ref: string) => call(who.authId, 'select public.record_milestone_payment($1, $2, $3)', [id, ms, ref]);

  it('each side accepts once; strangers and staff cannot; work starts only after both', async () => {
    const { w, inst } = await started();
    expect(await refusal(startRpc(w.tech, inst.id))).toBe('not_accepted_by_customer');
    expect(await refusal(acceptRpc(w.admin, inst.id))).toBe('forbidden');
    expect(await refusal(acceptRpc(w.owner, inst.id))).toBe('forbidden');
    expect(await refusal(acceptRpc(w.otherCustomer, inst.id))).toBe('not_found');
    expect(await refusal(acceptRpc(w.otherTech, inst.id))).toBe('not_found');
    expect(await refusal(acceptRpc(w.customer, inst.id))).toBe('ok');
    expect(await refusal(acceptRpc(w.customer, inst.id))).toBe('forbidden'); // already accepted
    expect(await refusal(startRpc(w.tech, inst.id))).toBe('not_accepted_by_partner');
    expect(await refusal(evidenceRpc(w.tech, inst.id, 'progress', ['a.jpg']))).toBe('invalid_state');
    expect(await refusal(acceptRpc(w.tech, inst.id))).toBe('ok');
    expect(await refusal(startRpc(w.customer, inst.id))).toBe('forbidden');
    expect(await refusal(startRpc(w.tech, inst.id))).toBe('ok');
    expect(await refusal(startRpc(w.tech, inst.id))).toBe('wrong_state');
  });

  it('a suspended partner cannot start work', async () => {
    const { w, inst } = await started();
    await acceptRpc(w.customer, inst.id); await acceptRpc(w.tech, inst.id);
    await pool.query("update public.profiles set status = 'suspended' where id = $1", [w.tech.profileId]);
    expect(await refusal(startRpc(w.tech, inst.id))).toBe('partner_suspended');
    await pool.query("update public.profiles set status = 'active' where id = $1", [w.tech.profileId]);
    expect(await refusal(startRpc(w.tech, inst.id))).toBe('ok');
  });

  it('evidence, then the Owner verifies, then the customer records the payment — in that order, once', async () => {
    const { w, inst } = await started();
    await acceptRpc(w.customer, inst.id); await acceptRpc(w.tech, inst.id); await startRpc(w.tech, inst.id);
    expect(await refusal(payRpc(w.customer, inst.id, 'progress', 'UTR12345'))).toBe('not_payable');
    expect(await refusal(evidenceRpc(w.tech, inst.id, 'progress', []))).toBe('evidence_missing');
    expect(await refusal(evidenceRpc(w.tech, inst.id, 'progress', ['   ']))).toBe('evidence_missing');
    expect(await refusal(evidenceRpc(w.tech, inst.id, 'progress', Array.from({ length: 21 }, (_, i) => `f${i}.jpg`)))).toBe('evidence_too_many');
    expect(await refusal(evidenceRpc(w.tech, inst.id, 'progress', ['x'.repeat(201)]))).toBe('evidence_name_long');
    expect(await refusal(evidenceRpc(w.customer, inst.id, 'progress', ['x.jpg']))).toBe('forbidden');
    expect(await refusal(evidenceRpc(w.tech, inst.id, 'nope', ['x.jpg']))).toBe('not_found');
    expect(await refusal(verifyRpc(w.owner, inst.id, 'progress'))).toBe('not_submitted');
    expect(await refusal(evidenceRpc(w.tech, inst.id, 'progress', ['rails.jpg', ' level.mp4 ']))).toBe('ok');
    expect((await milestones(w.tech.authId, inst.id))[0].evidence).toEqual(['rails.jpg', 'level.mp4']);
    expect(await refusal(evidenceRpc(w.tech, inst.id, 'progress', ['again.jpg']))).toBe('not_waiting'); // evidence is kept as sent
    for (const who of [w.tech, w.customer, w.admin, w.otherTech]) expect(await refusal(verifyRpc(who, inst.id, 'progress'))).toMatch(/forbidden|not_found/); // the partner never verifies their own work, Admin never approves
    expect(await refusal(payRpc(w.customer, inst.id, 'progress', 'UTR12345'))).toBe('not_payable');
    expect(await refusal(verifyRpc(w.owner, inst.id, 'progress'))).toBe('ok');
    expect(await refusal(payRpc(w.tech, inst.id, 'progress', 'UTR12345'))).toBe('forbidden');
    expect(await refusal(payRpc(w.customer, inst.id, 'progress', 'x'))).toBe('reference_short');
    expect(await refusal(payRpc(w.customer, inst.id, 'progress', 'R'.repeat(61)))).toBe('reference_long');
    expect(await refusal(payRpc(w.customer, inst.id, 'progress', ' UTR12345 '))).toBe('ok');
    expect(await refusal(payRpc(w.customer, inst.id, 'progress', 'UTR99999'))).toBe('locked');
    expect((await ordersOf(w, w.customer))[0].status).toBe('in_progress');
    // the second milestone completes the order
    await evidenceRpc(w.tech, inst.id, 'handover', ['handover.pdf']); await verifyRpc(w.owner, inst.id, 'handover'); await payRpc(w.customer, inst.id, 'handover', 'UTR55555');
    expect((await ordersOf(w, w.customer)).find((o) => o.id === inst.id)!.status).toBe('completed');
    expect((await milestones(w.customer.authId, inst.id)).map((m) => m.status)).toEqual(['payment_recorded', 'payment_recorded']);
  });

  it('the table itself refuses what the functions refuse: browsers cannot write, and a paid milestone is locked even for the server', async () => {
    const { w, inst } = await started();
    await acceptRpc(w.customer, inst.id); await acceptRpc(w.tech, inst.id); await startRpc(w.tech, inst.id);
    expect(await refusal(call(w.customer.authId, "update public.work_order_milestones set status = 'verified' where work_order_id = $1", [inst.id]))).toMatch(/permission denied/);
    expect(await refusal(call(w.tech.authId, "update public.work_orders set price_inr = 1 where id = $1", [inst.id]))).toMatch(/permission denied/);
    expect(await refusal(call(w.owner.authId, 'delete from public.work_orders', []))).toMatch(/permission denied/);
    expect(await refusal(call(w.owner.authId, "insert into public.work_orders (code, quote_id, line_id, lead_ref, site_name, customer_id, partner_ref, partner_name, partner_profile_id, kind, price_inr, template_version, created_by) values ('x', $1, 'z', 'l', 's', $2, 'p', 'p', $3, 'amc', 1, 1, $2)", [w.quoteId, w.customer.profileId, w.tech.profileId]))).toMatch(/permission denied/);
    // The server (service role) is held to the same rules by triggers.
    expect(await refusal(asServer((c) => c.query("update public.work_orders set price_inr = price_inr + 1 where id = $1", [inst.id])))).toMatch(/work_order_is_fixed/);
    expect(await refusal(asServer((c) => c.query("update public.work_order_milestones set status = 'verified', verified_by = $2 where work_order_id = $1 and milestone_id = 'progress'", [inst.id, w.owner.profileId])))).toMatch(/invalid_state/); // cannot skip evidence
    await evidenceRpc(w.tech, inst.id, 'progress', ['a.jpg']); await verifyRpc(w.owner, inst.id, 'progress'); await payRpc(w.customer, inst.id, 'progress', 'UTR12345');
    expect(await refusal(asServer((c) => c.query("update public.work_order_milestones set payment_reference = 'EDITED' where work_order_id = $1 and milestone_id = 'progress'", [inst.id])))).toMatch(/milestone_is_locked/);
    expect(await refusal(asServer((c) => c.query("update public.work_order_milestones set amount_inr = 1 where work_order_id = $1 and milestone_id = 'handover'", [inst.id])))).toMatch(/milestone_is_fixed/);
    expect(await refusal(asServer((c) => c.query("update public.work_orders set customer_accepted_at = now() where id = $1", [inst.id])))).toMatch(/acceptance_is_kept/);
    expect(await refusal(asServer((c) => c.query("update public.work_orders set status = 'completed' where id = $1", [inst.id])))).toMatch(/milestones_open/);
  });

  it('every step is an event the caller made, in order, with the facts a dispute needs', async () => {
    const { w, inst } = await started();
    await acceptRpc(w.customer, inst.id); await acceptRpc(w.tech, inst.id); await startRpc(w.tech, inst.id);
    await evidenceRpc(w.tech, inst.id, 'progress', ['a.jpg']); await verifyRpc(w.owner, inst.id, 'progress'); await payRpc(w.customer, inst.id, 'progress', 'UTR12345');
    const log = await events(w.lead);
    expect(log.map((e) => e.event_type)).toEqual(['contract.work_order_created', 'contract.work_order_created', 'contract.accepted_in_app', 'contract.accepted_in_app', 'milestone.opened', 'milestone.evidence_submitted', 'milestone.verified', 'milestone.payment_recorded']);
    const by = (t: string, i = 0) => log.filter((e) => e.event_type === t)[i];
    expect(by('contract.work_order_created').actor_profile_id).toBe(w.owner.profileId);
    expect([by('contract.accepted_in_app', 0).actor_profile_id, by('contract.accepted_in_app', 1).actor_profile_id]).toEqual([w.customer.profileId, w.tech.profileId]);
    expect(by('contract.accepted_in_app', 0).payload).toMatchObject({ side: 'customer', method: 'in_app_acceptance' });
    expect(by('milestone.evidence_submitted').actor_profile_id).toBe(w.tech.profileId);
    expect(by('milestone.evidence_submitted').payload).toMatchObject({ milestoneId: 'progress', evidence: ['a.jpg'] });
    expect(by('milestone.verified').actor_profile_id).toBe(w.owner.profileId);
    expect(by('milestone.verified').actor_role).toBe('owner');
    expect(by('milestone.payment_recorded').payload).toMatchObject({ reference: 'UTR12345', movedByPlatform: false, amountInr: 200000 });
    const seqs = log.map((e) => Number(e.seq));
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
  });
});

describe('the database and the app split a price identically', () => {
  it('agrees with amountsFor on random prices and random valid templates', async () => {
    const splitSql = async (price: number, pcts: number[]) => (await pool.query<{ s: string[] }>('select app.wo_split($1::bigint, $2::int[]) as s', [price, pcts])).rows[0].s.map(Number);
    const tpl = (pcts: number[]): MilestoneTemplate[] => pcts.map((pct, i) => ({ id: `m${i}`, label: `m${i}`, pct, gate: 'on_delivery' as const }));
    const partition = () => { const n = randomInt(1, 6); const cuts = new Set<number>(); while (cuts.size < n - 1) cuts.add(randomInt(1, 100)); const xs = [0, ...[...cuts].sort((a, b) => a - b), 100]; return xs.slice(1).map((x, i) => x - xs[i]); };
    for (let i = 0; i < 150; i += 1) {
      const price = i < 10 ? i : randomInt(1, 900_000_000);
      const pcts = i % 5 === 0 ? [90, 10] : partition();
      const mine = amountsFor(price, tpl(pcts));
      expect(await splitSql(price, pcts), `price ${price} over ${pcts.join('/')}`).toEqual(mine);
    }
  });
  it('agrees on which templates are valid', async () => {
    const m = (id: string, pct: number, gate = 'on_delivery') => ({ id, label: id, pct, gate });
    const cases: Array<[string, ReturnType<typeof m>[]]> = [
      ['ok', [m('a', 90), m('b', 10, 'on_handover')]], ['template_empty', []], ['template_pct', [m('a', 0), m('b', 100)]],
      ['template_pct', [m('a', 33.5), m('b', 66.5)]], ['template_duplicate', [m('a', 50), m('a', 50)]], ['template_sum', [m('a', 60), m('b', 30)]],
    ];
    for (const [expected, list] of cases) {
      const ts = templateProblem(list.map((x) => ({ ...x, gate: x.gate as MilestoneTemplate['gate'] })));
      expect(ts ?? 'ok', 'app').toBe(expected);
      const base = Object.fromEntries(Object.keys(DEFAULT_TEMPLATES).map((k) => [k, DEFAULT_TEMPLATES[k as keyof typeof DEFAULT_TEMPLATES]]));
      const sql = (await pool.query<{ p: string | null }>('select app.wo_templates_problem($1::jsonb) as p', [JSON.stringify({ ...base, material: list })])).rows[0].p;
      expect(sql ?? 'ok', 'sql').toBe(expected);
    }
  });
});
