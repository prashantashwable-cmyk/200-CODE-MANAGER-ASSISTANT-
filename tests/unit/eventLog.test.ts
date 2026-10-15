import { describe, expect, it } from 'vitest';
import { createEventLog, EventError, classOf, CORRECTION_WINDOW_MS } from '@/features/events/eventLog';
import { EVENT_TYPES, isEventType } from '@/features/events/taxonomy';
import type { Role } from '@/data/types';

const ROLES: Record<string, Role> = { owner1: 'owner', admin1: 'admin', scout1: 'surveyor', scout2: 'surveyor', cust1: 'customer' };
let clock = Date.parse('2026-10-13T10:00:00.000Z');
const tick = (ms: number) => { clock += ms; };
const make = () => createEventLog({ now: () => new Date(clock).toISOString(), roleOf: (id) => ROLES[id] ?? null, canSee: (id, _r, e) => e.actor.id === id });
const code = (fn: () => unknown): string => { try { fn(); return 'ok'; } catch (e) { return e instanceof EventError ? e.code : 'other'; } };
const lead = (id = 'L1') => ({ kind: 'lead', id });

describe('taxonomy', () => {
  it('has at least 60 event types, all distinct and well formed', () => {
    expect(EVENT_TYPES.length).toBeGreaterThanOrEqual(60);
    expect(new Set(EVENT_TYPES).size).toBe(EVENT_TYPES.length);
    expect(EVENT_TYPES.every((t) => /^[a-z]+\.[a-z_]+$/.test(t))).toBe(true);
    expect(isEventType('lead.captured')).toBe(true);
    expect(isEventType('lead.invented')).toBe(false);
  });
});

describe('appending', () => {
  it('records who did it from the session, not from the client, keeps device time and server time apart, and measures clock error rather than guessing it', () => {
    const log = make();
    const { event } = log.append('scout1', { type: 'lead.captured', subject: lead(), capturedAt: new Date(clock - 3 * 3_600_000).toISOString(), geo: { lat: 18.59, lng: 73.73, accuracyM: 9 } });
    expect(event.actor).toEqual({ role: 'surveyor', id: 'scout1' });
    expect(event.capturedAt).not.toBe(event.receivedAt);
    // an offline capture sent hours later is not a wrong clock: with no measurement the error is simply unknown (0)
    expect(event.skewMs).toBe(0);
    // a phone that reports its clock at send lets the server measure the error
    const fast = log.append('scout1', { type: 'lead.photo_added', subject: lead(), deviceSentAt: new Date(clock + 3_600_000).toISOString() });
    expect(fast.event.skewMs).toBe(3_600_000);
  });
  it('is idempotent on clientEventId, so a retry after a dropped connection does not double-record', () => {
    const log = make();
    const a = log.append('scout1', { type: 'lead.captured', subject: lead(), clientEventId: 'dev-1' });
    const b = log.append('scout1', { type: 'lead.captured', subject: lead(), clientEventId: 'dev-1' });
    expect(b.duplicate).toBe(true);
    expect(b.event.id).toBe(a.event.id);
    expect(log.size()).toBe(1);
    expect(code(() => log.append('scout2', { type: 'lead.captured', subject: lead(), clientEventId: 'dev-1' }))).toBe('forbidden');
  });
  it('refuses unknown types and bad times; Admin cannot write business events', () => {
    const log = make();
    expect(code(() => log.append('scout1', { type: 'lead.invented', subject: lead() }))).toBe('unknown_type');
    expect(code(() => log.append('scout1', { type: 'lead.captured', subject: lead(), capturedAt: 'not a time' }))).toBe('time_invalid');
    expect(code(() => log.append('admin1', { type: 'lead.captured', subject: lead() }))).toBe('admin_read_only');
  });
  it('the chain verifies and detects nothing wrong on an honest log', () => {
    const log = make();
    log.append('scout1', { type: 'lead.captured', subject: lead() });
    log.append('scout1', { type: 'lead.photo_added', subject: lead() });
    expect(log.verify()).toMatchObject({ ok: true, count: 2 });
  });
});

describe('visibility', () => {
  it('a scout sees only their own events; the Owner sees all; Admin sees all with contact data masked', () => {
    const log = make();
    log.append('scout1', { type: 'lead.captured', subject: lead('L1'), payload: { phone: '9822011001', contactName: 'Mr Patil' } });
    log.append('scout2', { type: 'lead.captured', subject: lead('L2') });
    expect(log.list('scout1')).toHaveLength(1);
    expect(log.list('owner1')).toHaveLength(2);
    const adminView = log.list('admin1').find((e) => e.subject.id === 'L1')!;
    expect(adminView.payload.phone).toBe('••••••1001');
    expect(adminView.payload.contactName).toBe('••••');
    expect(log.list('owner1').find((e) => e.subject.id === 'L1')!.payload.phone).toBe('9822011001');
    // Admin sees what happened, never exactly where: no place on the event and none in its payload
    const placed = make();
    placed.append('scout1', { type: 'lead.captured', subject: lead('L9'), geo: { lat: 18.59, lng: 73.73, accuracyM: 9 }, payload: { siteName: 'Hidden Heights', lat: 18.59, lng: 73.73, city: 'Pune' } });
    const seen = placed.list('admin1')[0];
    expect(seen.geo).toBeUndefined();
    expect(seen.payload).toEqual({ siteName: 'Hidden Heights', city: 'Pune' });
    expect(placed.list('owner1')[0].geo).toEqual({ lat: 18.59, lng: 73.73, accuracyM: 9 });
    expect(placed.list('scout1')[0].payload.lat).toBe(18.59);
  });
});

describe('corrections', () => {
  it('class 2: the author amends their own recent event; the original stays and the record reads corrected', () => {
    const log = make();
    const { event } = log.append('scout1', { type: 'lead.captured', subject: lead(), payload: { shaft: 'not_ready' } });
    const r = log.correct('scout1', event.id, { shaft: 'ready' }, 'Mis-tapped the readiness.');
    expect(r.status).toBe('applied');
    expect(r.class).toBe(2);
    expect(log.effective('scout1', event.id).payload.shaft).toBe('ready');
    expect(log.list('scout1').find((e) => e.id === event.id)!.payload.shaft).toBe('not_ready');
  });
  it('after the window the same correction needs the Owner (class 3) and changes nothing until approved', () => {
    const log = make();
    const { event } = log.append('scout1', { type: 'lead.captured', subject: lead(), payload: { shaft: 'not_ready' } });
    tick(CORRECTION_WINDOW_MS + 1000);
    const r = log.correct('scout1', event.id, { shaft: 'ready' }, 'Realised later it was ready.');
    expect(r).toMatchObject({ status: 'needs_approval', class: 3 });
    expect(log.effective('scout1', event.id).payload.shaft).toBe('not_ready');
    expect(code(() => log.decideCorrection('scout1', r.event.id, true, 'I approve my own change.'))).toBe('forbidden');
    expect(code(() => log.decideCorrection('admin1', r.event.id, true, 'Admin approves it here.'))).toBe('admin_cannot_approve');
    log.decideCorrection('owner1', r.event.id, true, 'Photos support the correction.');
    expect(log.effective('scout1', event.id).payload.shaft).toBe('ready');
    expect(code(() => log.decideCorrection('owner1', r.event.id, false, 'Changed my mind later.'))).toBe('already_decided');
  });
  it('an unsynced event can be corrected by its author even after the window', () => {
    const log = make();
    const { event } = log.append('scout1', { type: 'lead.captured', subject: lead() });
    tick(CORRECTION_WINDOW_MS * 3);
    expect(log.correct('scout1', event.id, { a: 1 }, 'Still on my phone, fixing it.', false).status).toBe('applied');
  });
  it('anything touching money, rank or ownership is class 3 even when recent', () => {
    const log = make();
    const { event } = log.append('scout1', { type: 'lead.ownership_claimed', subject: lead() });
    expect(log.correct('scout1', event.id, { owner: 'x' }, 'Wrong person claimed it.').status).toBe('needs_approval');
  });
  it('class 4 is locked for everyone including the Owner; only annotate or dispute remain', () => {
    const log = make();
    const { event } = log.append('scout1', { type: 'milestone.payment_recorded', subject: { kind: 'milestone', id: 'M1' }, payload: { amount: 10000 } });
    expect(classOf(event, 'scout1', new Date(clock).toISOString())).toBe(4);
    expect(code(() => log.correct('scout1', event.id, { amount: 1 }, 'Trying to change a proof.'))).toBe('locked');
    expect(code(() => log.correct('owner1', event.id, { amount: 1 }, 'Owner tries to change it.'))).toBe('locked');
    expect(log.mark('scout1', event.id, 'disputed', 'The amount on the proof is wrong.').type).toBe('event.disputed');
    expect(log.effective('scout1', event.id).payload.amount).toBe(10000);
  });
  it('Admin cannot correct and may only flag', () => {
    const log = make();
    const { event } = log.append('scout1', { type: 'lead.captured', subject: lead() });
    expect(code(() => log.correct('admin1', event.id, { a: 1 }, 'Admin fixes a value.'))).toBe('admin_cannot_correct');
    expect(log.mark('admin1', event.id, 'flagged', 'Location looks wrong to me.').type).toBe('event.flagged');
    expect(code(() => log.mark('admin1', event.id, 'annotated', 'Adding my own note.'))).toBe('admin_may_only_flag');
  });
  it('a correction needs a reason', () => {
    const log = make();
    const { event } = log.append('scout1', { type: 'lead.captured', subject: lead() });
    expect(code(() => log.correct('scout1', event.id, { a: 1 }, 'oops'))).toBe('reason_short');
  });
});
