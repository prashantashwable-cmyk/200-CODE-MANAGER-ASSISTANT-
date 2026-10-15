import { describe, expect, it } from 'vitest';
import { acknowledgeProblem, handoverGateProblem, handoverParties, handoverReady, handoverState, projectProgress } from '@/features/projects/project';
import type { ProjectOrder } from '@/features/projects/project';

const ms = (gate: ProjectOrder['milestones'][number]['gate'], amountInr: number, status: ProjectOrder['milestones'][number]['status'] = 'waiting', qcInspectorId?: string) => ({ gate, amountInr, status, ...(qcInspectorId ? { qcInspectorId } : {}) });
const install = (over: Partial<ProjectOrder> = {}): ProjectOrder => ({ kind: 'installation', customerId: 'cust', partnerAccountId: 'inst', priceInr: 400, milestones: [ms('on_progress', 200, 'verified'), ms('on_handover', 200, 'waiting', 'qc1')], ...over });
const material = (): ProjectOrder => ({ kind: 'material', customerId: 'cust', partnerAccountId: 'sup', priceInr: 600, milestones: [ms('on_delivery', 540, 'closed'), ms('on_handover', 60)] });

describe('project progress', () => {
  it('is the verified share of the price, in whole numbers rounded down, and 100 only when everything is verified', () => {
    expect(projectProgress([]).percent).toBe(0);
    expect(projectProgress([install(), material()])).toMatchObject({ percent: 74, verifiedInr: 740, paidInr: 540, totalInr: 1000 });
    expect(projectProgress([{ ...install(), milestones: [ms('on_progress', 1, 'verified'), ms('on_handover', 2)] }]).percent).toBe(33);
    const done = install({ milestones: [ms('on_progress', 200, 'closed'), ms('on_handover', 200, 'verified')] });
    expect(projectProgress([done]).percent).toBe(100);
    expect(projectProgress([{ ...done, milestones: [ms('on_progress', 999999, 'verified'), ms('on_handover', 1)] }]).percent).toBe(99);
  });
});

describe('handover parties and state', () => {
  it('needs the customer, each installer and the inspector named on the installation handover; flags a missing inspector', () => {
    expect(handoverParties([]).parties).toEqual([]);
    expect(handoverParties([material()])).toEqual({ parties: [{ role: 'customer', accountId: 'cust' }], qcMissing: false });
    const p = handoverParties([install(), material()]);
    expect(p.parties.map((x) => `${x.role}:${x.accountId}`)).toEqual(['customer:cust', 'installer:inst', 'qc:qc1']);
    expect(handoverParties([install({ milestones: [ms('on_handover', 400)] })]).qcMissing).toBe(true);
  });
  it('is ready only when everything before the handover milestones is verified', () => {
    expect(handoverReady([install(), material()])).toBe(true);
    expect(handoverReady([install({ milestones: [ms('on_progress', 200, 'evidence_submitted'), ms('on_handover', 200, 'waiting', 'qc1')] })])).toBe(false);
    expect(handoverReady([])).toBe(false);
  });
  it('lets a party acknowledge once, refuses others, an unready project and a missing inspector', () => {
    const orders = [install(), material()];
    expect(acknowledgeProblem({ orders, callerId: 'stranger', acks: [] })).toBe('not_a_party');
    expect(acknowledgeProblem({ orders, callerId: 'cust', acks: [] })).toBeNull();
    expect(acknowledgeProblem({ orders, callerId: 'cust', acks: [{ role: 'customer', accountId: 'cust' }] })).toBe('already_acknowledged');
    expect(acknowledgeProblem({ orders: [install({ milestones: [ms('on_progress', 200, 'waiting'), ms('on_handover', 200, 'waiting', 'qc1')] })], callerId: 'cust', acks: [] })).toBe('handover_not_ready');
    expect(acknowledgeProblem({ orders: [install({ milestones: [ms('on_progress', 200, 'verified'), ms('on_handover', 200)] })], callerId: 'cust', acks: [] })).toBe('qc_missing');
  });
  it('is complete only when every party has acknowledged', () => {
    const orders = [install()];
    const acks = [{ role: 'customer' as const, accountId: 'cust' }, { role: 'installer' as const, accountId: 'inst' }];
    expect(handoverState(orders, acks).complete).toBe(false);
    const all = handoverState(orders, [...acks, { role: 'qc', accountId: 'qc1' }]);
    expect(all.complete).toBe(true);
    expect(all.parties.every((p) => p.signed)).toBe(true);
    expect(handoverState([install({ milestones: [ms('on_handover', 400)] })], acks).complete).toBe(false);
  });
  it('gates only the handover milestone', () => {
    expect(handoverGateProblem('on_handover', false)).toBe('handover_unsigned');
    expect(handoverGateProblem('on_handover', true)).toBeNull();
    for (const g of ['on_acceptance', 'on_delivery', 'on_progress'] as const) expect(handoverGateProblem(g, false)).toBeNull();
  });
});
