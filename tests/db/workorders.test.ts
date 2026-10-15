/**
 * Work orders and milestone gates, proved against a real Postgres with the same migrations Supabase runs. Every test acts as a browser
 * would: `authenticated` with the person's id in the JWT claims. Nothing goes through the app's code, so these hold for any client.
 */
import { afterAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { randomInt } from 'node:crypto';
import { DEFAULT_TEMPLATES, amountsFor, templateProblem } from '@/features/workorders/workOrder';
import { projectProgress } from '@/features/projects/project';
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


/** Gets a project to a complete handover record: the supplier's order done and verified, an inspector named on the handover milestone, all three parties acknowledged. */
async function completeHandover(w: World, inst: { id: string }) {
  const mat = (await ordersOf(w, w.supplier))[0];
  await call(w.customer.authId, 'select public.accept_work_order($1)', [mat.id]);
  await call(w.supplier.authId, 'select public.accept_work_order($1)', [mat.id]);
  await call(w.supplier.authId, 'select public.start_work_order($1)', [mat.id]);
  await call(w.supplier.authId, 'select public.submit_milestone_evidence($1, $2, $3::text[])', [mat.id, 'delivery', ['d.jpg']]);
  await call(w.owner.authId, 'select public.verify_milestone($1, $2)', [mat.id, 'delivery']);
  await call(w.owner.authId, 'select public.assign_milestone_inspector($1, $2, $3)', [inst.id, 'handover', w.otherTech.profileId]);
  for (const who of [w.customer, w.tech, w.otherTech]) await call(who.authId, 'select public.acknowledge_handover($1)', [w.quoteId]);
}

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
    await evidenceRpc(w.tech, inst.id, 'handover', ['handover.pdf']); await completeHandover(w, inst); await verifyRpc(w.owner, inst.id, 'handover'); await payRpc(w.customer, inst.id, 'handover', 'UTR55555');
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

describe('QC inspectors for a milestone', () => {
  async function running() {
    const w = await world();
    await issue(w);
    const inst = (await ordersOf(w, w.tech))[0];
    await call(w.customer.authId, 'select public.accept_work_order($1)', [inst.id]);
    await call(w.tech.authId, 'select public.accept_work_order($1)', [inst.id]);
    await call(w.tech.authId, 'select public.start_work_order($1)', [inst.id]);
    return { w, inst };
  }
  const assign = (who: P, wo: string, ms: string, inspector: string | null) => call(who.authId, 'select public.assign_milestone_inspector($1, $2, $3)', [wo, ms, inspector]);
  const verify = (who: P, wo: string, ms: string) => call(who.authId, 'select public.verify_milestone($1, $2)', [wo, ms]);
  const submit = (who: P, wo: string, ms: string) => call(who.authId, 'select public.submit_milestone_evidence($1, $2, $3::text[])', [wo, ms, ['a.jpg']]);

  it('only the Owner names an inspector, who must be an eligible technician and not the partner', async () => {
    const { w, inst } = await running();
    const insp = w.otherTech;
    for (const who of [w.admin, w.customer, w.tech, w.otherTech]) expect(await refusal(assign(who, inst.id, 'progress', insp.profileId))).toBe('forbidden');
    expect(await refusal(assign(w.owner, inst.id, 'progress', null))).toBe('qc_inspector_required');
    expect(await refusal(assign(w.owner, inst.id, 'progress', w.tech.profileId))).toBe('inspector_is_partner');
    expect(await refusal(assign(w.owner, inst.id, 'progress', w.customer.profileId))).toBe('inspector_not_eligible');
    expect(await refusal(assign(w.owner, inst.id, 'progress', w.supplier.profileId))).toBe('inspector_not_eligible');
    const demoTech = await person('technician', { demo: true });
    expect(await refusal(assign(w.owner, inst.id, 'progress', demoTech.profileId))).toBe('inspector_not_eligible'); // demo and real never mix
    expect(await refusal(assign(w.owner, inst.id, 'nope', insp.profileId))).toBe('not_found');
    expect(await refusal(call(w.owner.authId, 'insert into public.work_order_qc_assignments (work_order_id, milestone_id, inspector_id, assigned_by) values ($1, $2, $3, $3)', [inst.id, 'progress', insp.profileId]))).toMatch(/permission denied/); // no direct writes
    expect(await refusal(assign(w.owner, inst.id, 'progress', insp.profileId))).toBe('ok');
    expect(await refusal(assign(w.owner, inst.id, 'progress', w.otherTech.profileId))).toBe('ok'); // renaming before verification is allowed
  });

  it('the named inspector sees the order and verifies only that milestone; nobody else can', async () => {
    const { w, inst } = await running();
    const ms = (await milestones(w.owner.authId, inst.id)).map((m) => m.milestone_id);
    const [a, b] = ms;
    expect(await ordersOf(w, w.otherTech)).toHaveLength(0);
    await assign(w.owner, inst.id, a, w.otherTech.profileId);
    expect((await ordersOf(w, w.otherTech)).map((o) => o.id)).toEqual([inst.id]);
    expect(await milestones(w.otherTech.authId, inst.id)).toHaveLength(ms.length);
    expect(await ordersOf(w, w.supplier)).toHaveLength(1); // unrelated people still see only their own order
    const stranger = await person('technician');
    expect(await milestones(stranger.authId, inst.id)).toHaveLength(0);
    await submit(w.tech, inst.id, a); await submit(w.tech, inst.id, b);
    expect(await refusal(verify(stranger, inst.id, a))).toBe('not_found');
    expect(await refusal(verify(w.tech, inst.id, a))).toBe('forbidden');
    expect(await refusal(verify(w.customer, inst.id, a))).toBe('forbidden');
    expect(await refusal(verify(w.admin, inst.id, a))).toBe('forbidden');
    expect(await refusal(verify(w.otherTech, inst.id, b))).toBe('forbidden'); // named for the other milestone, not this one
    expect(await refusal(call(w.otherTech.authId, 'select public.record_milestone_payment($1, $2, $3)', [inst.id, a, 'UTR12345']))).toMatch(/forbidden|not_found/); // an inspector never records a payment
    expect(await refusal(verify(w.otherTech, inst.id, a))).toBe('ok');
    expect((await milestones(w.owner.authId, inst.id)).find((m) => m.milestone_id === a)!.status).toBe('verified');
    expect(await refusal(assign(w.owner, inst.id, a, w.otherTech.profileId))).toBe('invalid_state'); // too late once verified
    await completeHandover(w, inst);
    expect(await refusal(verify(w.owner, inst.id, b))).toBe('ok'); // the Owner can still verify any milestone, once the handover record is complete
    const log = await events(w.lead);
    const qc = log.find((e) => e.event_type === 'qc.assigned')!;
    expect(qc.actor_profile_id).toBe(w.owner.profileId);
    expect(qc.payload).toMatchObject({ workOrderId: inst.id, milestoneId: a, inspectorId: w.otherTech.profileId });
    const v = log.filter((e) => e.event_type === 'milestone.verified');
    expect(v[0].actor_profile_id).toBe(w.otherTech.profileId);
  });

  it('assignments are readable by the parties and the Owner, not by strangers', async () => {
    const { w, inst } = await running();
    await assign(w.owner, inst.id, 'progress', w.otherTech.profileId);
    const read = (who: P) => as(who.authId, async (c) => (await c.query('select inspector_id from public.work_order_qc_assignments where work_order_id = $1', [inst.id])).rows.length);
    expect(await read(w.owner)).toBe(1);
    expect(await read(w.customer)).toBe(1);
    expect(await read(w.tech)).toBe(1);
    expect(await read(w.otherTech)).toBe(1);
    expect(await read(w.otherCustomer)).toBe(0);
    expect(await read(w.supplier)).toBe(0);
  });
});

describe('the partner confirms the payment', () => {
  it('only the paid partner closes a recorded milestone; a closed milestone never changes; the event is the partner\'s', async () => {
    const w = await world();
    await issue(w);
    const inst = (await ordersOf(w, w.tech))[0];
    for (const who of [w.customer, w.tech]) await call(who.authId, 'select public.accept_work_order($1)', [inst.id]);
    await call(w.tech.authId, 'select public.start_work_order($1)', [inst.id]);
    const ms = (await milestones(w.owner.authId, inst.id)).map((m) => m.milestone_id);
    const confirm = (who: P, ms0: string) => call(who.authId, 'select public.confirm_milestone_payment($1, $2)', [inst.id, ms0]);
    const [a, b] = ms;
    await call(w.tech.authId, 'select public.submit_milestone_evidence($1, $2, $3::text[])', [inst.id, a, ['a.jpg']]);
    expect(await refusal(confirm(w.tech, a))).toBe('not_recorded'); // nothing recorded yet
    await call(w.owner.authId, 'select public.verify_milestone($1, $2)', [inst.id, a]);
    expect(await refusal(confirm(w.tech, a))).toBe('not_recorded');
    await call(w.customer.authId, 'select public.record_milestone_payment($1, $2, $3)', [inst.id, a, 'UTR12345']);
    for (const who of [w.customer, w.admin, w.owner]) expect(await refusal(confirm(who, a))).toMatch(/forbidden|not_found/);
    expect(await refusal(confirm(w.otherTech, a))).toBe('not_found');
    expect(await refusal(as(null, (c) => c.query('select public.confirm_milestone_payment($1, $2)', [inst.id, a])))).toMatch(/permission denied/);
    expect(await refusal(confirm(w.tech, a))).toBe('ok');
    expect((await milestones(w.owner.authId, inst.id)).find((m) => m.milestone_id === a)!.status).toBe('closed');
    expect(await refusal(confirm(w.tech, a))).toBe('already_confirmed');
    expect(await refusal(call(w.customer.authId, 'select public.record_milestone_payment($1, $2, $3)', [inst.id, a, 'UTR99999']))).toBe('locked');
    // The browser cannot write the row directly, and not even the server can reopen or alter a closed milestone.
    expect(await refusal(call(w.tech.authId, "update public.work_order_milestones set status = 'payment_recorded' where work_order_id = $1", [inst.id]))).toMatch(/permission denied/);
    expect(await refusal(asServer((c) => c.query("update public.work_order_milestones set status = 'payment_recorded' where work_order_id = $1 and milestone_id = $2", [inst.id, a])))).toMatch(/milestone_is_locked/);
    expect(await refusal(asServer((c) => c.query("update public.work_order_milestones set payment_reference = 'CHANGED1' where work_order_id = $1 and milestone_id = $2", [inst.id, a])))).toMatch(/milestone_is_locked/);
    // The server cannot close a milestone that was never paid or skip the confirmer.
    expect(await refusal(asServer((c) => c.query("update public.work_order_milestones set status = 'closed', confirmed_by = $3, confirmed_at = now() where work_order_id = $1 and milestone_id = $2", [inst.id, b, w.tech.profileId])))).toMatch(/invalid_state/);
    const ev = (await events(w.lead)).find((e) => e.event_type === 'milestone.payment_confirmed')!;
    expect(ev.actor_profile_id).toBe(w.tech.profileId);
    expect(ev.payload).toMatchObject({ milestoneId: a, reference: 'UTR12345', movedByPlatform: false });
  });
});

describe('template versions and orders', () => {
  it('an order keeps the version it was issued under; the next one uses the new version', async () => {
    const owner = await person('owner');
    const add = (templates: unknown) => as(owner.authId, (c) => c.query('insert into public.milestone_template_versions (version, templates, set_by_name, reason) values (0, $1, $2, $3)', [JSON.stringify(templates), 'x', 'Pilot with a later release']));
    const cur = (await pool.query<{ version: number; templates: Record<string, MilestoneTemplate[]> }>('select version, templates from public.milestone_template_versions order by version desc limit 1')).rows[0];
    const first = await world();
    await issue(first);
    const a = (await ordersOf(first, first.owner))[0];
    expect(a.template_version).toBe(cur.version);
    const nextT = { ...cur.templates, installation: [{ id: 'progress', label: 'p', pct: 30, gate: 'on_progress' }, { id: 'handover', label: 'h', pct: 70, gate: 'on_handover' }] };
    await add(nextT);
    const second = await world();
    await issue(second);
    const b = (await ordersOf(second, second.owner)).find((o) => o.kind === 'installation')!;
    expect(b.template_version).toBe(cur.version + 1);
    expect((await milestones(second.owner.authId, b.id)).map((m) => Number(m.amount_inr))).toEqual([120000, 280000]); // 30 / 70 of 400000
    const old = (await ordersOf(first, first.owner)).find((o) => o.kind === 'installation')!;
    expect((await milestones(first.owner.authId, old.id)).map((m) => Number(m.amount_inr))).toEqual([200000, 200000]); // still 50 / 50
    // put the defaults back so later tests see the usual split
    await as(owner.authId, (c) => c.query('insert into public.milestone_template_versions (version, templates, set_by_name, reason) values (0, $1, $2, $3)', [JSON.stringify(cur.templates), 'x', 'Restore the defaults after the test']));
  });
});

describe('handover and completion record', () => {
  async function ready() {
    const w = await world();
    await issue(w);
    const inst = (await ordersOf(w, w.tech))[0];
    const mat = (await ordersOf(w, w.supplier))[0];
    for (const o of [inst, mat]) {
      await call(w.customer.authId, 'select public.accept_work_order($1)', [o.id]);
      await call((o === inst ? w.tech : w.supplier).authId, 'select public.accept_work_order($1)', [o.id]);
      await call((o === inst ? w.tech : w.supplier).authId, 'select public.start_work_order($1)', [o.id]);
    }
    const evidence = (who: P, o: { id: string }, ms: string) => call(who.authId, 'select public.submit_milestone_evidence($1, $2, $3::text[])', [o.id, ms, ['a.jpg']]);
    const verify = (o: { id: string }, ms: string) => call(w.owner.authId, 'select public.verify_milestone($1, $2)', [o.id, ms]);
    await evidence(w.supplier, mat, 'delivery'); await verify(mat, 'delivery');
    await evidence(w.tech, inst, 'progress'); await verify(inst, 'progress');
    return { w, inst, mat, evidence, verify };
  }
  const ack = (who: P, quote: string) => call(who.authId, 'select public.acknowledge_handover($1)', [quote]);
  const parties = (quote: string) => pool.query<{ role: string; profile_id: string }>('select role, profile_id from app.handover_parties($1) order by role', [quote]);

  it('needs the customer, the installer and a named inspector; nobody else; only once the earlier work is verified', async () => {
    const { w, inst, evidence, verify } = await ready();
    expect(await refusal(ack(w.otherCustomer, w.quoteId))).toMatch(/not_a_party|not_found/);
    expect(await refusal(ack(w.owner, w.quoteId))).toBe('not_a_party'); // the Owner is not a party to the record
    expect((await parties(w.quoteId)).rows.map((r) => r.role)).toEqual(['customer', 'installer']); // no inspector named yet
    expect(await refusal(ack(w.customer, w.quoteId))).toBe('qc_missing');
    await call(w.owner.authId, 'select public.assign_milestone_inspector($1, $2, $3)', [inst.id, 'handover', w.otherTech.profileId]);
    expect((await parties(w.quoteId)).rows.map((r) => `${r.role}`)).toEqual(['customer', 'installer', 'qc']);
    // the handover milestone cannot be verified while the record is incomplete
    await evidence(w.tech, inst, 'handover');
    expect(await refusal(verify(inst, 'handover'))).toBe('handover_unsigned');
    expect(await refusal(ack(w.customer, w.quoteId))).toBe('ok');
    expect(await refusal(ack(w.customer, w.quoteId))).toBe('already_acknowledged');
    expect(await refusal(ack(w.tech, w.quoteId))).toBe('ok');
    expect(await refusal(verify(inst, 'handover'))).toBe('handover_unsigned'); // two of three
    expect(await refusal(ack(w.otherTech, w.quoteId))).toBe('ok');
    expect(await refusal(call(w.otherTech.authId, 'select public.verify_milestone($1, $2)', [inst.id, 'handover']))).toBe('ok'); // the named inspector, now allowed
    // events: three in-app acknowledgements and the completion
    const ev = await events(w.lead);
    expect(ev.filter((e) => e.payload.kind === 'handover').map((e) => e.payload.role)).toEqual(['customer', 'installer', 'qc']);
    const done = ev.find((e) => e.event_type === 'installation.completed')!;
    expect(done.payload).toMatchObject({ record: 'handover_and_completion', statutoryNoc: false });
  });

  it('is refused before the earlier milestones are verified, and the record cannot be edited or removed', async () => {
    const w = await world();
    await issue(w);
    const inst = (await ordersOf(w, w.tech))[0];
    for (const o of await ordersOf(w, w.owner)) {
      await call(w.customer.authId, 'select public.accept_work_order($1)', [o.id]);
      const partner = o.partner_profile_id === w.tech.profileId ? w.tech : w.supplier;
      await call(partner.authId, 'select public.accept_work_order($1)', [o.id]);
      await call(partner.authId, 'select public.start_work_order($1)', [o.id]);
    }
    await call(w.owner.authId, 'select public.assign_milestone_inspector($1, $2, $3)', [inst.id, 'handover', w.otherTech.profileId]);
    expect(await refusal(ack(w.customer, w.quoteId))).toBe('handover_not_ready');
    const r = await ready();
    await call(r.w.owner.authId, 'select public.assign_milestone_inspector($1, $2, $3)', [r.inst.id, 'handover', r.w.otherTech.profileId]);
    await ack(r.w.customer, r.w.quoteId);
    expect(await refusal(call(r.w.customer.authId, 'delete from public.handover_acknowledgements', []))).toMatch(/permission denied/);
    expect(await refusal(asServer((c) => c.query('delete from public.handover_acknowledgements where quote_id = $1', [r.w.quoteId])))).toMatch(/handover_is_kept/);
    expect(await refusal(asServer((c) => c.query("update public.handover_acknowledgements set role = 'qc' where quote_id = $1", [r.w.quoteId])))).toMatch(/handover_is_kept/);
    expect(await refusal(as(null, (c) => c.query('select public.acknowledge_handover($1)', [r.w.quoteId])))).toMatch(/permission denied/);
  });
});

describe('project view', () => {
  it('shows progress across all orders, money only to staff and the customer, and matches the TypeScript rule', async () => {
    const w = await world();
    await issue(w);
    const inst = (await ordersOf(w, w.tech))[0];
    const mat = (await ordersOf(w, w.supplier))[0];
    const view = async (who: P) => (await call(who.authId, 'select public.project_view($1) as v', [w.quoteId])).rows[0].v as { percent: number; amounts: { totalInr: number; verifiedInr: number } | null; parties: { role: string; signed: boolean }[]; ready: boolean; qcMissing: boolean; complete: boolean };
    expect((await view(w.owner)).percent).toBe(0);
    for (const o of [mat, inst]) {
      await call(w.customer.authId, 'select public.accept_work_order($1)', [o.id]);
      const partner = o === mat ? w.supplier : w.tech;
      await call(partner.authId, 'select public.accept_work_order($1)', [o.id]);
      await call(partner.authId, 'select public.start_work_order($1)', [o.id]);
    }
    await call(w.supplier.authId, 'select public.submit_milestone_evidence($1, $2, $3::text[])', [mat.id, 'delivery', ['d.jpg']]);
    await call(w.owner.authId, 'select public.verify_milestone($1, $2)', [mat.id, 'delivery']);
    // material 540001 of a total of 600001 + 400000 = 1000001 -> 54%
    const o = await view(w.owner);
    const expected = projectProgress([
      { kind: 'material', customerId: 'c', partnerAccountId: 's', priceInr: 600001, milestones: [{ gate: 'on_delivery', amountInr: 540001, status: 'verified' }, { gate: 'on_handover', amountInr: 60000, status: 'waiting' }] },
      { kind: 'installation', customerId: 'c', partnerAccountId: 't', priceInr: 400000, milestones: [{ gate: 'on_progress', amountInr: 200000, status: 'waiting' }, { gate: 'on_handover', amountInr: 200000, status: 'waiting' }] },
    ]);
    expect(o.percent).toBe(expected.percent);
    expect(Number(o.amounts!.totalInr)).toBe(expected.totalInr);
    expect((await view(w.customer)).amounts).not.toBeNull();
    expect((await view(w.tech)).amounts).toBeNull(); // a partner sees the percentage, not the whole project's money
    expect((await view(w.tech)).percent).toBe(expected.percent);
    expect(await refusal(view(w.otherTech))).toBe('not_found');
    expect(await refusal(view(w.otherCustomer))).toBe('not_found');
    expect(await refusal(as(null, (c) => c.query('select public.project_view($1)', [w.quoteId])))).toMatch(/permission denied/);
    const v = await view(w.owner);
    expect(v.ready).toBe(false);
    expect(v.qcMissing).toBe(true);
    expect(v.parties.map((p) => p.role)).toEqual(['customer', 'installer']);
  });
});
