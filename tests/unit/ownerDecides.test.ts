/** Master prompt P1: business decisions are the Owner's. Admin may look and send a request to the Decision Desk, never decide. */
import { beforeAll, describe, expect, it } from 'vitest';
import { chaos } from '@/data/repository';
import type { Repository } from '@/data/repository';

let repo: Repository;
const OWNER = 'u-owner-1';
const ADMIN = 'u-admin-1';
const refusal = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return e instanceof Error ? e.message : String(e); } };

beforeAll(async () => {
  chaos.minLatency = 0; chaos.maxLatency = 0; chaos.failureRate = 0;
  repo = (await import('@/data/memoryRepository')).memoryRepository;
});

describe('legacy Admin approvals are the Owner\'s', () => {
  it('refuses Admin on payout release, tiers, commission rates and access, before anything else is checked', async () => {
    expect(await refusal(repo.approvePayout('c-anything', { acknowledged: [] }, ADMIN))).toBe('admin_cannot_decide');
    expect(await refusal(repo.approvePayoutsBatch(['c-anything'], ADMIN))).toBe('admin_cannot_decide');
    expect(await refusal(repo.releasePayoutHold('c-4', ADMIN))).toBe('admin_cannot_decide');
    expect(await refusal(repo.assignPartnerTier('u-tech-1', { tier: 'master', reason: 'Twenty letters of a real reason', effectiveFrom: new Date().toISOString().slice(0, 10) }, ADMIN))).toBe('admin_cannot_decide');
    expect(await refusal(repo.publishCommissionRule('qc_fee', {} as never, ADMIN))).toBe('admin_cannot_decide');
    expect(await refusal(repo.changeRolePermission(ADMIN, {} as never))).toBe('admin_cannot_decide');
    expect(await refusal(repo.setUserOverride(ADMIN, {} as never))).toBe('admin_cannot_decide');
    expect(await refusal(repo.assignUserRole(ADMIN, 'u-tech-5', 'cr-1', true, 'A reason of enough letters'))).toBe('admin_cannot_decide');
    expect(await refusal(repo.createCustomRole(ADMIN, {} as never))).toBe('admin_cannot_decide');
  });
  it('still lets the Owner act (a held payout goes back to the queue)', async () => {
    expect(await refusal(repo.releasePayoutHold('c-4', OWNER))).toBe('ok');
  });
  it('lets Admin send the request to the Owner\'s Decision Desk, where the Owner sees it in full', async () => {
    const card = await repo.prepareDecisionPacket(ADMIN, { kind: 'payout_release', title: 'Release the held QC payout', summary: 'The partner has sent the missing photos; I checked them against the job.' });
    expect(card.status).toBe('pending');
    const owner = await repo.listDecisionCards(OWNER, { status: 'open' });
    expect(JSON.stringify(owner)).toContain(card.code);
  });
});
