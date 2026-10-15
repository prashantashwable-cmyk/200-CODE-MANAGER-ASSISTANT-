/** Work orders through the Repository the screens use. A server must keep all of these. */
import { beforeAll, describe, expect, it } from 'vitest';
import { chaos } from '@/data/repository';
import type { Repository } from '@/data/repository';

let repo: Repository;
const OWNER = 'u-owner-1';
const ADMIN = 'u-admin-1';
const CUST = 'u-cust-3';
const OTHER = 'u-cust-1';
const TECH = 'u-tech-1';
const OTHER_TECH = 'u-tech-2';
const refusal = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return e instanceof Error ? e.message : String(e); } };

beforeAll(async () => {
  chaos.minLatency = 0; chaos.maxLatency = 0; chaos.failureRate = 0;
  repo = (await import('@/data/memoryRepository')).memoryRepository;
});

describe('partner accounts', () => {
  it('the Owner and Admin can list active installers and suppliers; nobody else can', async () => {
    const owner = await repo.listPartnerAccounts(OWNER);
    expect(owner.map((a) => a.id)).toContain(TECH);
    expect(owner.every((a) => a.role === 'technician' || a.role === 'supplier')).toBe(true);
    expect((await repo.listPartnerAccounts(ADMIN)).length).toBe(owner.length);
    expect(await refusal(repo.listPartnerAccounts(CUST))).toBe('forbidden');
    expect(await refusal(repo.listPartnerAccounts(TECH))).toBe('forbidden');
  });
});

describe('work orders from an accepted quote', () => {
  it('only the Owner issues them, every part needs a real partner account, and a refusal leaves nothing behind', async () => {
    const quote = (await repo.listFacilitatorQuotes(ADMIN))[0];
    expect(await refusal(repo.createWorkOrdersFromQuote(CUST, quote.id, {}))).toBe('forbidden');
    expect(await refusal(repo.createWorkOrdersFromQuote(ADMIN, quote.id, {}))).toBe('forbidden');
    expect(await repo.createWorkOrdersFromQuote(OWNER, quote.id, {})).toHaveLength(0); // nothing accepted yet

    await repo.sendFacilitatorQuote(ADMIN, quote.id).catch(() => undefined);
    const mine = await repo.getMyQuote(CUST);
    const install = mine!.quote.components.find((c) => c.kind === 'installation')!;
    const statutory = mine!.quote.components.find((c) => c.kind === 'statutory')!;
    await repo.acceptQuoteComponents(CUST, quote.id, [install.id, statutory.id]);

    expect(await refusal(repo.createWorkOrdersFromQuote(OWNER, quote.id, {}))).toBe('partner_account_required');
    expect(await refusal(repo.createWorkOrdersFromQuote(OWNER, quote.id, { [install.id]: CUST }))).toBe('partner_not_eligible'); // a customer cannot act as a partner
    expect(await refusal(repo.createWorkOrdersFromQuote(OWNER, quote.id, { [install.id]: 'nobody' }))).toBe('partner_not_eligible');
    expect(await repo.listWorkOrders(OWNER)).toHaveLength(0);

    const made = await repo.createWorkOrdersFromQuote(OWNER, quote.id, { [install.id]: TECH });
    expect(made).toHaveLength(1); // the statutory fee is paid to the authority: no work order
    expect(made[0].kind).toBe('installation');
    expect(made[0].partnerAccountId).toBe(TECH);
    expect(made[0].milestones.reduce((a, m) => a + m.amountInr, 0)).toBe(made[0].priceInr);
    expect(await repo.createWorkOrdersFromQuote(OWNER, quote.id, {})).toHaveLength(0); // idempotent, and needs no mapping for what exists
  });

  it('is visible to its customer, its partner account and Admin; to nobody else', async () => {
    expect((await repo.listWorkOrders(CUST)).length).toBe(1);
    expect((await repo.listWorkOrders(TECH)).length).toBe(1);
    expect((await repo.listWorkOrders(ADMIN)).length).toBe(1);
    expect(await repo.listWorkOrders(OTHER)).toHaveLength(0);
    expect(await repo.listWorkOrders(OTHER_TECH)).toHaveLength(0); // another installer sees no one else's order
    const id = (await repo.listWorkOrders(TECH))[0].id;
    expect(await refusal(repo.acceptWorkOrder(OTHER_TECH, id))).toBe('not_found');
    expect(await refusal(repo.acceptWorkOrder(OTHER, id))).toBe('not_found');
  });

  it('work starts only after both sides accept, and the partner cannot skip the gates', async () => {
    const w = (await repo.listWorkOrders(TECH))[0];
    expect(w.side).toBe('partner');
    expect(await refusal(repo.startWorkOrder(TECH, w.id))).toBe('not_accepted_by_customer');
    expect(await refusal(repo.acceptWorkOrder(ADMIN, w.id))).toBe('forbidden');
    await repo.acceptWorkOrder(CUST, w.id);
    expect(await refusal(repo.acceptWorkOrder(CUST, w.id))).toBe('forbidden'); // already accepted
    expect(await refusal(repo.startWorkOrder(TECH, w.id))).toBe('not_accepted_by_partner');
    const acc = await repo.acceptWorkOrder(TECH, w.id);
    expect(acc.acceptance).toBe('in_app_acceptance'); // no signing provider is connected, said honestly
    expect(await refusal(repo.submitMilestoneEvidence(TECH, w.id, w.milestones[0].id, ['a.jpg']))).toBe('invalid_state');
    const started = await repo.startWorkOrder(TECH, w.id);
    expect(started.status).toBe('in_progress');
  });

  it('a milestone is payable only after evidence and the Owner has verified it', async () => {
    const w = (await repo.listWorkOrders(TECH))[0];
    const m = w.milestones[0];
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR12345'))).toBe('not_payable');
    expect(await refusal(repo.submitMilestoneEvidence(TECH, w.id, m.id, []))).toBe('evidence_missing');
    expect(await refusal(repo.submitMilestoneEvidence(TECH, w.id, m.id, Array.from({ length: 21 }, (_, i) => `f${i}.jpg`)))).toBe('evidence_too_many');
    expect(await refusal(repo.submitMilestoneEvidence(TECH, w.id, m.id, ['x'.repeat(201)]))).toBe('evidence_name_long');
    expect(await refusal(repo.submitMilestoneEvidence(CUST, w.id, m.id, ['x.jpg']))).toBe('forbidden');
    const sent = await repo.submitMilestoneEvidence(TECH, w.id, m.id, ['rails.jpg', 'level.mp4']);
    expect(sent.milestones[0].evidence).toEqual(['rails.jpg', 'level.mp4']);
    expect(await refusal(repo.verifyMilestone(TECH, w.id, m.id))).toBe('forbidden'); // the partner never verifies their own work
    expect(await refusal(repo.verifyMilestone(OTHER_TECH, w.id, m.id))).toBe('not_found'); // nor does another installer
    expect(await refusal(repo.verifyMilestone(CUST, w.id, m.id))).toBe('forbidden');
    expect(await refusal(repo.verifyMilestone(ADMIN, w.id, m.id))).toBe('forbidden'); // Admin never approves
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR12345'))).toBe('not_payable');
    await repo.verifyMilestone(OWNER, w.id, m.id);
    expect(await refusal(repo.recordMilestonePayment(TECH, w.id, m.id, 'UTR12345'))).toBe('forbidden');
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'x'))).toBe('reference_short');
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'R'.repeat(61)))).toBe('reference_long');
    const paid = await repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR12345');
    expect(paid.milestones[0].status).toBe('payment_recorded');
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR99999'))).toBe('locked');
  });

  it('the Owner can name a technician to check one milestone; only that technician (or the Owner) can verify it', async () => {
    const w = (await repo.listWorkOrders(TECH))[0];
    const m = w.milestones[1];
    await repo.submitMilestoneEvidence(TECH, w.id, m.id, ['handover.jpg']);
    expect(await refusal(repo.verifyMilestone(OTHER_TECH, w.id, m.id))).toBe('not_found'); // not named: cannot even see the order
    for (const who of [ADMIN, CUST, TECH, OTHER_TECH]) expect(await refusal(repo.assignMilestoneInspector(who, w.id, m.id, OTHER_TECH))).toMatch(/forbidden|not_found/); // only the Owner names an inspector
    expect(await refusal(repo.assignMilestoneInspector(OWNER, w.id, m.id, ''))).toBe('qc_inspector_required');
    expect(await refusal(repo.assignMilestoneInspector(OWNER, w.id, m.id, TECH))).toBe('inspector_is_partner');
    expect(await refusal(repo.assignMilestoneInspector(OWNER, w.id, m.id, CUST))).toBe('inspector_not_eligible');
    expect(await refusal(repo.assignMilestoneInspector(OWNER, w.id, m.id, 'nobody'))).toBe('inspector_not_eligible');
    const named = await repo.assignMilestoneInspector(OWNER, w.id, m.id, OTHER_TECH);
    expect(named.milestones[1].qcInspectorId).toBe(OTHER_TECH);
    const theirs = await repo.listWorkOrders(OTHER_TECH);
    expect(theirs).toHaveLength(1); // now able to see the order they were asked to check
    expect(theirs[0].side).toBe('staff');
    expect(await refusal(repo.submitMilestoneEvidence(OTHER_TECH, w.id, m.id, ['x.jpg']))).toBe('forbidden');
    expect(await refusal(repo.recordMilestonePayment(OTHER_TECH, w.id, m.id, 'UTR12345'))).toBe('forbidden');
    const first = w.milestones[0];
    expect(await refusal(repo.verifyMilestone(OTHER_TECH, w.id, first.id))).toBe('forbidden'); // named for one milestone only
    const done = await repo.verifyMilestone(OTHER_TECH, w.id, m.id);
    expect(done.milestones[1].status).toBe('verified');
    expect(await refusal(repo.assignMilestoneInspector(OWNER, w.id, m.id, OTHER_TECH))).toBe('invalid_state'); // too late once verified
    const log = await repo.listEvents(OWNER, {});
    expect(log.some((e) => e.type === 'qc.assigned')).toBe(true);
    await repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR55555');
  });

  it('the partner confirms receipt of a recorded payment, which closes the milestone; nobody else can', async () => {
    const w = (await repo.listWorkOrders(TECH))[0];
    const m = w.milestones[0];
    expect(m.status).toBe('payment_recorded');
    expect(w.can.confirmPayment).toBe(true);
    for (const who of [CUST, OWNER, ADMIN]) expect(await refusal(repo.confirmMilestonePayment(who, w.id, m.id))).toBe('forbidden');
    expect(await refusal(repo.confirmMilestonePayment(OTHER_TECH, w.id, m.id))).toMatch(/forbidden|not_found/);
    const closed = await repo.confirmMilestonePayment(TECH, w.id, m.id);
    expect(closed.milestones[0].status).toBe('closed');
    expect(closed.milestones[1].status).toBe('payment_recorded'); // only the one confirmed
    expect(await refusal(repo.confirmMilestonePayment(TECH, w.id, m.id))).toBe('already_confirmed');
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR99999'))).toBe('locked');
    const log = await repo.listEvents(OWNER, {});
    expect(log.some((e) => e.type === 'milestone.payment_confirmed')).toBe(true);
  });

  it('the Owner adds a version of the milestone templates; orders already issued keep theirs; nobody else can', async () => {
    const before = await repo.getMilestoneTemplates(OWNER);
    expect(before.current.version).toBe(1);
    expect((await repo.getMilestoneTemplates(ADMIN)).current.version).toBe(1);
    for (const who of [CUST, TECH]) expect(await refusal(repo.getMilestoneTemplates(who))).toBe('forbidden');
    const t = structuredClone(before.current.templates);
    t.installation = [{ id: 'progress', label: 'On verified progress', pct: 40, gate: 'on_progress' }, { id: 'handover', label: 'On handover', pct: 60, gate: 'on_handover' }];
    for (const who of [ADMIN, CUST, TECH]) expect(await refusal(repo.saveMilestoneTemplates(who, t, 'Pilot with a later release'))).toBe('forbidden');
    expect(await refusal(repo.saveMilestoneTemplates(OWNER, t, 'short'))).toBe('reason_short');
    expect(await refusal(repo.saveMilestoneTemplates(OWNER, before.current.templates, 'Nothing is different here'))).toBe('template_unchanged');
    const saved = await repo.saveMilestoneTemplates(OWNER, t, 'Pilot with a later release');
    expect(saved.version).toBe(2);
    const after = await repo.getMilestoneTemplates(OWNER);
    expect(after.history.map((h) => h.version)).toEqual([2, 1]);
    const w = (await repo.listWorkOrders(TECH))[0];
    expect(w.templateVersion).toBe(1); // issued under version 1
    expect(w.milestones.map((m) => m.pct)).toEqual([50, 50]); // unchanged by the new version
    const log = await repo.listEvents(OWNER, {});
    expect(log.some((e) => e.type === 'system.rule_changed')).toBe(true);
  });

  it('emits the events and says which providers are not connected', async () => {
    const log = await repo.listEvents(OWNER, {});
    const types = new Set(log.map((e) => e.type));
    for (const t of ['contract.work_order_created', 'contract.accepted_in_app', 'milestone.opened', 'milestone.evidence_submitted', 'milestone.verified', 'milestone.payment_recorded']) expect(types.has(t as never)).toBe(true);
    const providers = await repo.getProviderStatus(CUST);
    expect(providers.find((p) => p.id === 'esign')?.connected).toBe(false);
    expect(providers.every((p) => p.connected === false)).toBe(true);
  });
});
