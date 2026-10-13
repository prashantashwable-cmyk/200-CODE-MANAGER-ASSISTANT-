import { describe, expect, it } from 'vitest';
import { createDecisionStore, DecisionError } from '@/features/decisions/decisions';
import { verifyChain } from '@/features/audit/chain';
import type { DecisionCard } from '@/features/decisions/decisions';
import type { Role } from '@/data/types';

const ROLES: Record<string, Role> = { owner1: 'owner', admin1: 'admin', tech1: 'technician', cust1: 'customer' };
let clock = Date.parse('2026-10-13T10:00:00.000Z');
const makeStore = (seed: DecisionCard[] = []) => createDecisionStore(seed, { now: () => new Date((clock += 1000)).toISOString(), roleOf: (id) => ROLES[id] ?? null, nameOf: (id) => id });
const code = (fn: () => unknown): string => { try { fn(); return 'ok'; } catch (e) { return e instanceof DecisionError ? e.code : 'other'; } };
const packet = { kind: 'tier_change' as const, title: 'Raise Ganesh to Senior', summary: 'Twelve clean jobs, no open safety flags, certification passed.', amountInr: 0 };

describe('Decision Desk', () => {
  it('Admin prepares a packet and the Owner decides it', () => {
    const s = makeStore();
    const card = s.prepare('admin1', { ...packet, recommendation: 'approve' });
    expect(card.status).toBe('pending');
    expect(card.proposedBy.role).toBe('admin');
    const { card: after, record } = s.decide('owner1', { cardId: card.id, action: 'approve', reason: 'Evidence is complete.' });
    expect(after.status).toBe('approved');
    expect(record.eventType).toBe('decision.approved');
    expect(record.as).toBe('owner');
  });
  it('Admin can never decide, and the refusal leaves the card pending', () => {
    const s = makeStore();
    const card = s.prepare('admin1', packet);
    expect(code(() => s.decide('admin1', { cardId: card.id, action: 'approve', reason: 'I approve this one.' }))).toBe('admin_cannot_decide');
    expect(s.get('owner1', card.id)).toMatchObject({ level: 'detail', card: { status: 'pending' } });
  });
  it('Admin sees status only; the Owner sees evidence and impact', () => {
    const s = makeStore();
    const card = s.prepare('owner1', { ...packet, evidence: [{ label: 'Gate photo', kind: 'photo' }], impact: ['Raises fee tier'] });
    const adminList = s.list('admin1');
    expect(adminList.level).toBe('status');
    expect(JSON.stringify(adminList)).not.toContain('Gate photo');
    expect(JSON.stringify(adminList)).not.toContain('Raises fee tier');
    expect(s.get('owner1', card.id)).toMatchObject({ level: 'detail' });
    expect(s.get('admin1', card.id).level).toBe('status');
  });
  it('partners and customers cannot prepare, list or decide', () => {
    const s = makeStore();
    expect(code(() => s.prepare('tech1', packet))).toBe('forbidden');
    expect(s.list('cust1').cards).toEqual([]);
    const card = s.prepare('owner1', packet);
    expect(code(() => s.decide('tech1', { cardId: card.id, action: 'approve', reason: 'Let me approve it.' }))).toBe('forbidden');
    expect(code(() => s.get('cust1', card.id))).toBe('forbidden');
  });
  it('a decision needs a reason and what its action needs', () => {
    const s = makeStore();
    const card = s.prepare('owner1', packet);
    expect(code(() => s.decide('owner1', { cardId: card.id, action: 'reject', reason: 'no' }))).toBe('reason_short');
    expect(code(() => s.decide('owner1', { cardId: card.id, action: 'edit', reason: 'Change the amount.' }))).toBe('edits_missing');
    expect(code(() => s.decide('owner1', { cardId: card.id, action: 'delegate', reason: 'Away this week.' }))).toBe('delegate_missing');
  });
  it('ask-for-more-information keeps the card open; approve or reject closes it for good', () => {
    const s = makeStore();
    const card = s.prepare('owner1', packet);
    expect(s.decide('owner1', { cardId: card.id, action: 'ask_info', reason: 'Which jobs counted?' }).card.status).toBe('info_requested');
    expect(s.list('owner1', { status: 'open' }).cards).toHaveLength(1);
    s.decide('owner1', { cardId: card.id, action: 'reject', reason: 'Not enough jobs yet.' });
    expect(code(() => s.decide('owner1', { cardId: card.id, action: 'approve', reason: 'Changed my mind.' }))).toBe('already_decided');
  });
  it('a delegate can decide only the delegated card, only a delegable kind, and cannot delegate on', () => {
    const s = makeStore();
    const ok = s.prepare('owner1', packet);
    const feeCard = s.prepare('owner1', { ...packet, kind: 'fee_change', title: 'Change platform fee band' });
    s.decide('owner1', { cardId: ok.id, action: 'delegate', reason: 'Away this week.', delegateTo: 'tech1' });
    expect(code(() => s.decide('tech1', { cardId: feeCard.id, action: 'approve', reason: 'Not delegated to me.' }))).toBe('forbidden');
    expect(code(() => s.decide('tech1', { cardId: ok.id, action: 'delegate', reason: 'Passing it on.', delegateTo: 'cust1' }))).toBe('forbidden');
    expect(s.decide('tech1', { cardId: ok.id, action: 'approve', reason: 'Checked the evidence.' }).record.as).toBe('delegate');
    const notDelegable = s.prepare('owner1', { ...packet, kind: 'fee_change', title: 'Another fee decision' });
    s.decide('owner1', { cardId: notDelegable.id, action: 'delegate', reason: 'Try it anyway.', delegateTo: 'tech1' });
    expect(code(() => s.decide('tech1', { cardId: notDelegable.id, action: 'approve', reason: 'Fee is not delegable.' }))).toBe('forbidden');
  });
  it('records form an unbroken, frozen chain and tampering is detected', () => {
    const s = makeStore();
    const a = s.prepare('owner1', packet);
    const b = s.prepare('owner1', { ...packet, title: 'Second decision card' });
    s.decide('owner1', { cardId: a.id, action: 'approve', reason: 'First decision here.' });
    s.decide('owner1', { cardId: b.id, action: 'reject', reason: 'Second decision here.' });
    expect(s.verify('admin1')).toMatchObject({ ok: true, count: 2, brokenAtSeq: null });
    const rec = s.allRecords('owner1');
    expect(Object.isFrozen(rec[0])).toBe(true);
    expect(() => { (rec[0] as { reason: string }).reason = 'changed'; }).toThrow();
    expect(code(() => s.allRecords('admin1'))).toBe('forbidden');
    const link = (r: (typeof rec)[number]) => ({ id: r.id, seq: r.seq, sourceKey: r.eventType, triggeringCondition: r.action, actionTaken: r.reason, affectedRecordId: r.cardId, affectedRecordType: 'decision', subjectLabel: r.byUserId, at: r.at, prevHash: r.prevHash, hash: r.hash });
    expect(verifyChain(rec.map(link)).ok).toBe(true);
    expect(verifyChain(rec.map((r, i) => ({ ...link(r), ...(i === 0 ? { actionTaken: 'rewritten after the fact' } : {}) })))).toMatchObject({ ok: false, brokenAtSeq: 1 });
  });
});
