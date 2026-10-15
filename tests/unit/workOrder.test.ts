import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATES, MAX_EVIDENCE, MAX_EVIDENCE_NAME, acceptanceLabel, amountsFor, evidenceNamesProblem, milestonesOf, paymentProblem, permissionsOf, sideOf, skipsWorkOrder, startProblem, statusOfMilestones, submitEvidenceProblem, templateProblem, verifyProblem } from '@/features/workorders/workOrder';
import type { MilestoneTemplate } from '@/features/workorders/workOrder';
import type { Milestone } from '@/features/workorders/workOrder';

const good = { licenceValid: true, insuranceValid: true, suspended: false };
const ms = (over: Partial<Milestone> = {}): Milestone => ({ ...milestonesOf(1_000_000, DEFAULT_TEMPLATES.material)[0], ...over });

describe('milestone templates', () => {
  it('every default template adds to 100', () => { for (const t of Object.values(DEFAULT_TEMPLATES)) expect(templateProblem(t)).toBeNull(); });
  it('refuses repeated milestone ids and fractional percentages', () => {
    const a = { id: 'a', label: 'a', pct: 50, gate: 'on_delivery' as const };
    expect(templateProblem([a, { ...a, gate: 'on_handover' as const }])).toBe('template_duplicate');
    expect(templateProblem([{ ...a, pct: 33.5 }, { ...a, id: 'b', pct: 66.5 }])).toBe('template_pct');
  });
  it('refuses empty, non-positive and wrong-sum templates', () => {
    expect(templateProblem([])).toBe('template_empty');
    expect(templateProblem([{ id: 'a', label: 'a', pct: 0, gate: 'on_delivery' }, { id: 'b', label: 'b', pct: 100, gate: 'on_handover' }])).toBe('template_pct');
    expect(templateProblem([{ id: 'a', label: 'a', pct: 60, gate: 'on_delivery' }])).toBe('template_sum');
  });
  it('splits the 90 / 10 material price in whole rupees that add up exactly', () => {
    expect(amountsFor(1_000_000, DEFAULT_TEMPLATES.material)).toEqual([900_000, 100_000]);
    for (const p of [1, 7, 99_999, 1_234_567]) expect(amountsFor(p, DEFAULT_TEMPLATES.installation).reduce((a, b) => a + b, 0)).toBe(p);
    expect(() => amountsFor(10.5, DEFAULT_TEMPLATES.material)).toThrow();
  });
});

describe('the split is exact, whatever the price', () => {
  const t = (pcts: number[]): MilestoneTemplate[] => pcts.map((pct, i) => ({ id: `m${i}`, label: `m${i}`, pct, gate: 'on_delivery' as const }));
  it('gives the extra rupees to the largest remainders, ties to the earlier milestone', () => {
    // 3 rupees over 33 / 33 / 34: exact shares 0.99 / 0.99 / 1.02 -> floors 0 / 0 / 1, two left, equal remainders go to the earlier one first
    expect(amountsFor(3, t([33, 33, 34]))).toEqual([1, 1, 1]);
    expect(amountsFor(1, t([50, 50]))).toEqual([1, 0]);
    expect(amountsFor(0, t([50, 50]))).toEqual([0, 0]);
  });
  it('stays exact on very large prices where floating point would drift', () => {
    const price = 9_007_199_254_740; // price * pct stays below 2^53
    for (const pcts of [[33, 33, 34], [90, 10], [25, 25, 25, 25], [1, 99], [7, 13, 80]]) {
      const parts = amountsFor(price, t(pcts));
      expect(parts.reduce((a, b) => a + b, 0)).toBe(price);
      parts.forEach((p, i) => expect(Math.abs(p - (price * pcts[i]) / 100)).toBeLessThan(1));
    }
  });
});

describe('what becomes a work order, and what evidence is acceptable', () => {
  it('statutory pass-through fees are not work orders; everything else is', () => {
    expect(skipsWorkOrder('statutory')).toBe(true);
    for (const k of ['material', 'installation', 'logistics', 'amc'] as const) expect(skipsWorkOrder(k)).toBe(false);
  });
  it('evidence names are counted, bounded and non-empty', () => {
    expect(evidenceNamesProblem([])).toBe('evidence_missing');
    expect(evidenceNamesProblem(['  ', ''])).toBe('evidence_missing');
    expect(evidenceNamesProblem(Array.from({ length: MAX_EVIDENCE + 1 }, (_, i) => `f${i}.jpg`))).toBe('evidence_too_many');
    expect(evidenceNamesProblem(['x'.repeat(MAX_EVIDENCE_NAME + 1)])).toBe('evidence_name_long');
    expect(evidenceNamesProblem(['rails.jpg', 'level.mp4'])).toBeNull();
  });
});

describe('starting work', () => {
  const base = { status: 'issued' as const, customerAcceptedAt: 'x', partnerAcceptedAt: 'y' };
  it('needs both acceptances', () => {
    expect(startProblem({ ...base, customerAcceptedAt: undefined }, good)).toBe('not_accepted_by_customer');
    expect(startProblem({ ...base, partnerAcceptedAt: undefined }, good)).toBe('not_accepted_by_partner');
    expect(startProblem(base, good)).toBeNull();
  });
  it('is blocked by a lapsed licence, lapsed insurance or a suspension', () => {
    expect(startProblem(base, { ...good, licenceValid: false })).toBe('partner_licence_lapsed');
    expect(startProblem(base, { ...good, insuranceValid: false })).toBe('partner_insurance_lapsed');
    expect(startProblem(base, { ...good, suspended: true })).toBe('partner_suspended');
  });
  it('cannot start twice', () => { expect(startProblem({ ...base, status: 'in_progress' }, good)).toBe('wrong_state'); });
});

describe('milestone gates', () => {
  it('evidence first, then an independent verifier, then payment', () => {
    expect(submitEvidenceProblem(ms(), 0)).toBe('evidence_missing');
    expect(submitEvidenceProblem(ms(), 2)).toBeNull();
    expect(paymentProblem(ms({ status: 'evidence_submitted' }))).toBe('not_payable');
    expect(verifyProblem(ms(), { verifierId: 'q', submitterId: 's', qcPassed: true })).toBe('not_submitted');
    expect(verifyProblem(ms({ status: 'evidence_submitted' }), { verifierId: 's', submitterId: 's', qcPassed: true })).toBe('self_verify');
    expect(verifyProblem(ms({ status: 'evidence_submitted' }), { verifierId: 'q', submitterId: 's', qcPassed: false })).toBeNull();
    expect(paymentProblem(ms({ status: 'verified' }))).toBeNull();
  });
  it('handover and progress need a QC pass, delivery does not', () => {
    const sub = (gate: Milestone['gate']) => ms({ gate, status: 'evidence_submitted' });
    expect(verifyProblem(sub('on_handover'), { verifierId: 'q', submitterId: 's', qcPassed: false })).toBe('qc_required');
    expect(verifyProblem(sub('on_progress'), { verifierId: 'q', submitterId: 's', qcPassed: false })).toBe('qc_required');
    expect(verifyProblem(sub('on_progress'), { verifierId: 'q', submitterId: 's', qcPassed: true })).toBeNull();
  });
  it('a closed or paid milestone is locked', () => {
    for (const status of ['closed', 'payment_recorded'] as const) {
      expect(submitEvidenceProblem(ms({ status }), 3)).toBe('locked');
      expect(verifyProblem(ms({ status }), { verifierId: 'q', submitterId: 's', qcPassed: true })).toBe('locked');
      expect(paymentProblem(ms({ status }))).toBe('locked');
    }
  });
  it('the order completes only when every milestone is paid or closed', () => {
    const a = milestonesOf(100, DEFAULT_TEMPLATES.material);
    expect(statusOfMilestones(a)).toBe('in_progress');
    expect(statusOfMilestones(a.map((m) => ({ ...m, status: 'payment_recorded' as const })))).toBe('completed');
  });
});

describe('acceptance is not an e-signature until a provider is connected', () => {
  it('labels honestly', () => { expect(acceptanceLabel('not_connected')).toBe('in_app_acceptance'); expect(acceptanceLabel('connected')).toBe('esigned'); });
});

describe('who can do what on an order', () => {
  const order = { customerId: 'c', partnerAccountId: 'p' };
  it('works out the side from the account, never from a role name', () => {
    expect(sideOf('c', order)).toBe('customer');
    expect(sideOf('p', order)).toBe('partner');
    expect(sideOf('x', order)).toBe('staff');
    expect(sideOf(undefined, order)).toBe('staff');
  });
  const base = { role: 'customer', status: 'issued' as const, startBlock: null };
  it('each side accepts once, and only while the order is issued', () => {
    expect(permissionsOf({ ...base, side: 'customer' }).accept).toBe(true);
    expect(permissionsOf({ ...base, side: 'customer', customerAcceptedAt: 'x' }).accept).toBe(false);
    expect(permissionsOf({ ...base, side: 'partner', role: 'technician' }).accept).toBe(true);
    expect(permissionsOf({ ...base, side: 'partner', role: 'technician', partnerAcceptedAt: 'x' }).accept).toBe(false);
    expect(permissionsOf({ ...base, side: 'staff', role: 'owner' }).accept).toBe(false);
    expect(permissionsOf({ ...base, side: 'customer', status: 'in_progress' }).accept).toBe(false);
  });
  it('only the partner starts and sends evidence; only the customer records payment; only the Owner verifies', () => {
    const open = { ...base, status: 'in_progress' as const };
    expect(permissionsOf({ ...base, side: 'partner', role: 'technician' }).start).toBe(true);
    expect(permissionsOf({ ...base, side: 'partner', role: 'technician', startBlock: 'not_accepted_by_customer' }).start).toBe(false);
    expect(permissionsOf({ ...base, side: 'customer' }).start).toBe(false);
    expect(permissionsOf({ ...open, side: 'partner', role: 'technician' }).submitEvidence).toBe(true);
    expect(permissionsOf({ ...base, side: 'partner', role: 'technician' }).submitEvidence).toBe(false);
    expect(permissionsOf({ ...open, side: 'customer' }).recordPayment).toBe(true);
    expect(permissionsOf({ ...open, side: 'partner', role: 'technician' }).recordPayment).toBe(false);
    expect(permissionsOf({ ...open, side: 'staff', role: 'owner' }).verify).toBe(true);
    for (const role of ['admin', 'technician', 'supplier', 'customer']) expect(permissionsOf({ ...open, side: role === 'customer' ? 'customer' : 'staff', role }).verify).toBe(false);
    expect(permissionsOf({ ...base, side: 'staff', role: 'owner' }).verify).toBe(false); // not started yet
  });
});

import { mayVerify, qcAssignProblem } from '@/features/workorders/workOrder';
describe('QC inspector rules', () => {
  const ok = { inspectorId: 'i', partnerAccountId: 'p', inspectorEligible: true };
  it('names an inspector only before verification, never the partner, only an eligible technician', () => {
    expect(qcAssignProblem({ status: 'waiting' }, ok)).toBeNull();
    expect(qcAssignProblem({ status: 'evidence_submitted' }, ok)).toBeNull();
    expect(qcAssignProblem({ status: 'verified' }, ok)).toBe('invalid_state');
    expect(qcAssignProblem({ status: 'payment_recorded' }, ok)).toBe('locked');
    expect(qcAssignProblem({ status: 'waiting' }, { ...ok, inspectorId: '' })).toBe('qc_inspector_required');
    expect(qcAssignProblem({ status: 'waiting' }, { ...ok, inspectorId: 'p' })).toBe('inspector_is_partner');
    expect(qcAssignProblem({ status: 'waiting' }, { ...ok, inspectorEligible: false })).toBe('inspector_not_eligible');
  });
  it('lets the Owner or the named inspector verify, never the partner, and nobody when the order is not open', () => {
    const base = { role: 'technician', callerId: 'i', partnerAccountId: 'p', inspectorId: 'i', orderOpen: true };
    expect(mayVerify(base)).toBe(true);
    expect(mayVerify({ ...base, role: 'owner', callerId: 'o', inspectorId: undefined })).toBe(true);
    expect(mayVerify({ ...base, callerId: 'x' })).toBe(false);
    expect(mayVerify({ ...base, role: 'admin', callerId: 'a', inspectorId: undefined })).toBe(false);
    expect(mayVerify({ ...base, callerId: 'p', inspectorId: 'p' })).toBe(false);
    expect(mayVerify({ ...base, orderOpen: false })).toBe(false);
  });
});

import { confirmProblem } from '@/features/workorders/workOrder';
describe('payment confirmation rule', () => {
  it('only a recorded payment can be confirmed, once', () => {
    expect(confirmProblem({ status: 'payment_recorded' })).toBeNull();
    expect(confirmProblem({ status: 'closed' })).toBe('already_confirmed');
    for (const status of ['waiting', 'evidence_submitted', 'verified'] as const) expect(confirmProblem({ status })).toBe('not_recorded');
  });
});
