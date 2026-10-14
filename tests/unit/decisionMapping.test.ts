import { describe, expect, it } from 'vitest';
import { cardFromRow, chainFrom, decisionErrorCode, recordFromRow, statusRowFromRow } from '@/data/supabase/decisionMapping';
import type { CardRow, RecordRow } from '@/data/supabase/decisionMapping';

const row: CardRow = { id: 'c1', code: 'AIEC-DC-1001', kind: 'payout_release', title: 'Release payout', summary: 'A summary that is long enough', status: 'pending', proposed_by_kind: 'admin', proposed_by: 'u1', proposed_by_name: 'Admin', amount_inr: 42000, place: null, evidence: [], impact: ['x'], ai: null, delegated_to: null, is_demo: false, created_at: 't', decided_at: null };
describe('decision row mapping', () => {
  it('maps a card the way the Desk screen already reads it', () => {
    const c = cardFromRow(row);
    expect(c.proposedBy).toEqual({ role: 'admin', userId: 'u1', name: 'Admin' });
    expect(c.amountInr).toBe(42000);
    expect(c.decidedAt).toBeUndefined();
  });
  it('a system card has no user, and the status row carries no evidence, impact or amount', () => {
    const s = statusRowFromRow({ ...row, proposed_by_kind: 'system', proposed_by: null });
    expect(s.proposedBy).toEqual({ role: 'system', name: 'Admin' });
    expect(Object.keys(s)).not.toContain('evidence');
    expect(Object.keys(s)).not.toContain('amountInr');
  });
  it('maps records and the chain check', () => {
    const r: RecordRow = { seq: 2, id: 'r', card_id: 'c1', event_type: 'decision.approved', action: 'approve', by_profile: 'o', by_role: 'owner', as_kind: 'owner', reason: 'because', edits: null, delegate_to: null, at: 't', prev_hash: 'p', hash: 'h' };
    expect(recordFromRow(r)).toMatchObject({ seq: 2, as: 'owner', cardId: 'c1' });
    expect(chainFrom([{ ok: false, checked: '3', broken_at: '2' }], 'h')).toEqual({ ok: false, count: 3, headHash: 'h', brokenAtSeq: 2 });
  });
  it('turns database errors into known codes', () => {
    expect(decisionErrorCode('admin_cannot_decide')).toBe('admin_cannot_decide');
    expect(decisionErrorCode('permission denied for table decision_cards')).toBe('forbidden');
    expect(decisionErrorCode('fetch failed')).toBe('network');
  });
});
