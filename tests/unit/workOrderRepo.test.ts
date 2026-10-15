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
const refusal = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return e instanceof Error ? e.message : String(e); } };

beforeAll(async () => {
  chaos.minLatency = 0; chaos.maxLatency = 0; chaos.failureRate = 0;
  repo = (await import('@/data/memoryRepository')).memoryRepository;
});

describe('work orders from an accepted quote', () => {
  it('creates one per accepted component, once, and only the Owner issues them', async () => {
    const quote = (await repo.listFacilitatorQuotes(ADMIN))[0];
    expect(await refusal(repo.createWorkOrdersFromQuote(CUST, quote.id))).toBe('forbidden');
    expect(await refusal(repo.createWorkOrdersFromQuote(ADMIN, quote.id))).toBe('forbidden');
    expect(await repo.createWorkOrdersFromQuote(OWNER, quote.id)).toHaveLength(0); // nothing accepted yet
    await repo.sendFacilitatorQuote(ADMIN, quote.id).catch(() => undefined);
    const mine = await repo.getMyQuote(CUST);
    const ids = mine!.quote.components.filter((c) => c.partnerId === TECH).map((c) => c.id);
    await repo.acceptQuoteComponents(CUST, quote.id, ids);
    const made = await repo.createWorkOrdersFromQuote(OWNER, quote.id);
    expect(made).toHaveLength(ids.length);
    expect(made.every((w) => w.milestones.reduce((a, m) => a + m.amountInr, 0) === w.priceInr)).toBe(true);
    expect(await repo.createWorkOrdersFromQuote(OWNER, quote.id)).toHaveLength(0); // idempotent
  });

  it('another customer sees none of them', async () => {
    expect(await repo.listWorkOrders(OTHER)).toHaveLength(0);
    expect((await repo.listWorkOrders(CUST)).length).toBeGreaterThan(0);
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

  it('a milestone is payable only after evidence and an independent verification', async () => {
    const w = (await repo.listWorkOrders(TECH))[0];
    const m = w.milestones[0];
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR12345'))).toBe('not_payable');
    expect(await refusal(repo.submitMilestoneEvidence(TECH, w.id, m.id, []))).toBe('evidence_missing');
    expect(await refusal(repo.submitMilestoneEvidence(CUST, w.id, m.id, ['x.jpg']))).toBe('forbidden');
    await repo.submitMilestoneEvidence(TECH, w.id, m.id, ['rails.jpg', 'level.mp4']);
    expect(await refusal(repo.verifyMilestone(TECH, w.id, m.id))).toBe('forbidden'); // the partner never verifies their own work
    expect(await refusal(repo.verifyMilestone(ADMIN, w.id, m.id))).toBe('forbidden'); // Admin never approves
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR12345'))).toBe('not_payable');
    await repo.verifyMilestone(OWNER, w.id, m.id);
    expect(await refusal(repo.recordMilestonePayment(TECH, w.id, m.id, 'UTR12345'))).toBe('forbidden');
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'x'))).toBe('reference_short');
    const paid = await repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR12345');
    expect(paid.milestones[0].status).toBe('payment_recorded');
    expect(await refusal(repo.recordMilestonePayment(CUST, w.id, m.id, 'UTR99999'))).toBe('locked');
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
