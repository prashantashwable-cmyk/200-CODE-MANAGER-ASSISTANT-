import { describe, expect, it } from 'vitest';
import { AUTHORITY_MATRIX, DECISION_KINDS, canDecide, canPrepareDecisionPacket, canSeeDecisionDetail, decisionProblem, statusAfter } from '@/features/authority/authority';
import type { DelegateGrant } from '@/features/authority/authority';

const NOW = '2026-10-13T10:00:00.000Z';
const grant = (over: Partial<DelegateGrant> = {}): DelegateGrant => ({ kinds: ['payout_release', 'fee_change'], maxAmountInr: null, expiresAt: '2026-10-20T00:00:00.000Z', revoked: false, ...over });

describe('authority matrix', () => {
  it('has a row for every decision kind', () => {
    for (const k of DECISION_KINDS) expect(AUTHORITY_MATRIX[k].kind).toBe(k);
  });
  it('the Owner may decide anything', () => {
    for (const k of DECISION_KINDS) expect(canDecide('owner', k)).toEqual({ ok: true, as: 'owner' });
  });
  it('Admin can never decide, even with a grant', () => {
    for (const k of DECISION_KINDS) {
      expect(canDecide('admin', k)).toEqual({ ok: false, reason: 'admin_cannot_decide' });
      expect(canDecide('admin', k, { grant: grant({ kinds: [...DECISION_KINDS] }) })).toEqual({ ok: false, reason: 'admin_cannot_decide' });
    }
  });
  it('a partner or customer without a grant cannot decide', () => {
    for (const r of ['surveyor', 'technician', 'customer', 'supplier'] as const) expect(canDecide(r, 'payout_release').ok).toBe(false);
  });
  it('a delegate is limited by scope, delegability, amount and time', () => {
    expect(canDecide('surveyor', 'payout_release', { grant: grant(), amountInr: 10_000, now: NOW })).toEqual({ ok: true, as: 'delegate' });
    expect(canDecide('surveyor', 'payout_release', { grant: grant(), amountInr: 60_000, now: NOW })).toEqual({ ok: false, reason: 'delegate_limit' });
    expect(canDecide('surveyor', 'fee_change', { grant: grant(), now: NOW })).toEqual({ ok: false, reason: 'not_delegable' });
    expect(canDecide('surveyor', 'tier_change', { grant: grant(), now: NOW })).toEqual({ ok: false, reason: 'delegate_scope' });
    expect(canDecide('surveyor', 'payout_release', { grant: grant({ expiresAt: '2026-10-01T00:00:00.000Z' }), now: NOW })).toEqual({ ok: false, reason: 'delegate_expired' });
    expect(canDecide('surveyor', 'payout_release', { grant: grant({ revoked: true }), now: NOW })).toEqual({ ok: false, reason: 'delegate_expired' });
  });
  it('Admin prepares packets but sees no decision detail', () => {
    expect(canPrepareDecisionPacket('admin')).toBe(true);
    expect(canPrepareDecisionPacket('technician')).toBe(false);
    expect(canSeeDecisionDetail('admin')).toBe(false);
    expect(canSeeDecisionDetail('owner')).toBe(true);
  });
  it('a decision needs a reason and the fields its action needs', () => {
    expect(decisionProblem({ action: 'approve', reason: 'short' })).toBe('reason_short');
    expect(decisionProblem({ action: 'approve', reason: 'Evidence is complete.' })).toBeNull();
    expect(decisionProblem({ action: 'edit', reason: 'Lower the amount.' })).toBe('edits_missing');
    expect(decisionProblem({ action: 'delegate', reason: 'Away this week.' })).toBe('delegate_missing');
    expect(statusAfter('ask_info')).toBe('info_requested');
  });
});
