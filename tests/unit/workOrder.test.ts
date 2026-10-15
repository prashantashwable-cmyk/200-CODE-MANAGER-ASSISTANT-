import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATES, acceptanceLabel, amountsFor, milestonesOf, paymentProblem, startProblem, statusOfMilestones, submitEvidenceProblem, templateProblem, verifyProblem } from '@/features/workorders/workOrder';
import type { Milestone } from '@/features/workorders/workOrder';

const good = { licenceValid: true, insuranceValid: true, suspended: false };
const ms = (over: Partial<Milestone> = {}): Milestone => ({ ...milestonesOf(1_000_000, DEFAULT_TEMPLATES.material)[0], ...over });

describe('milestone templates', () => {
  it('every default template adds to 100', () => { for (const t of Object.values(DEFAULT_TEMPLATES)) expect(templateProblem(t)).toBeNull(); });
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
