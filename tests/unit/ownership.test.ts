import { describe, expect, it } from 'vitest';
import { decideOwnership, orderingTime, DEFAULT_OWNERSHIP } from '@/features/leads/ownership';
import type { Capture } from '@/features/leads/ownership';

const T0 = Date.parse('2026-10-13T10:00:00.000Z');
const iso = (ms: number) => new Date(ms).toISOString();
const HERE = { lat: 18.5913, lng: 73.7389 };
// about n metres north of HERE
const north = (m: number) => ({ lat: HERE.lat + m / 111_320, lng: HERE.lng });
const cap = (over: Partial<Capture> & { leadId: string }): Capture => ({ scoutId: 'a', at: HERE, capturedAt: iso(T0), receivedAt: iso(T0), accuracyM: 8, ...over });

describe('lead ownership', () => {
  it('a capture with nothing nearby claims the lead', () => {
    expect(decideOwnership([], cap({ leadId: 'L1' }))).toEqual({ outcome: 'claims' });
    expect(decideOwnership([cap({ leadId: 'L0', at: north(5_000) })], cap({ leadId: 'L1' }))).toEqual({ outcome: 'claims' });
  });
  it('a later capture of the same place becomes supporting evidence for the first, whoever made it', () => {
    const first = cap({ leadId: 'L1', scoutId: 'a' });
    const later = cap({ leadId: 'L2', scoutId: 'b', capturedAt: iso(T0 + 3_600_000), receivedAt: iso(T0 + 3_600_000), at: north(20) });
    expect(decideOwnership([first], later)).toEqual({ outcome: 'supporting', ownerLeadId: 'L1' });
    expect(decideOwnership([first], { ...later, scoutId: 'a' })).toEqual({ outcome: 'supporting', ownerLeadId: 'L1' });
  });
  it('the radius allows for GPS error: 90 m apart with poor fixes is the same place, with good fixes it is not', () => {
    const first = cap({ leadId: 'L1', accuracyM: 40 });
    const poor = cap({ leadId: 'L2', scoutId: 'b', at: north(90), accuracyM: 40, capturedAt: iso(T0 + 3_600_000), receivedAt: iso(T0 + 3_600_000) });
    const good = { ...poor, accuracyM: 5 };
    expect(decideOwnership([first], poor).outcome).toBe('supporting');
    expect(decideOwnership([{ ...first, accuracyM: 5 }], good).outcome).toBe('claims');
  });
  it('outside the time window an old capture no longer claims against a new one', () => {
    const old = cap({ leadId: 'L1', capturedAt: iso(T0 - DEFAULT_OWNERSHIP.windowMs - 86_400_000), receivedAt: iso(T0 - DEFAULT_OWNERSHIP.windowMs - 86_400_000) });
    expect(decideOwnership([old], cap({ leadId: 'L2', scoutId: 'b' })).outcome).toBe('claims');
  });
  it('two different scouts a few minutes apart cannot be ordered fairly, so the Owner decides', () => {
    const first = cap({ leadId: 'L1', scoutId: 'a' });
    const second = cap({ leadId: 'L2', scoutId: 'b', capturedAt: iso(T0 + 2 * 60_000), receivedAt: iso(T0 + 2 * 60_000) });
    expect(decideOwnership([first], second)).toEqual({ outcome: 'review', ownerLeadId: 'L1', reason: 'too_close_to_order' });
  });
  it('a poor first fix beaten by a good later fix from someone else goes to the Owner, not to whoever was first', () => {
    const first = cap({ leadId: 'L1', scoutId: 'a', accuracyM: 80 });
    const second = cap({ leadId: 'L2', scoutId: 'b', accuracyM: 6, capturedAt: iso(T0 + 3_600_000), receivedAt: iso(T0 + 3_600_000) });
    expect(decideOwnership([first], second)).toEqual({ outcome: 'review', ownerLeadId: 'L1', reason: 'accuracy_conflict' });
  });
  it('a phone whose clock is a week slow is put right by its measured error, so it neither steals nor loses the lead', () => {
    const first = cap({ leadId: 'L1', scoutId: 'a' });
    const sentAt = T0 + 3_600_000;
    const slow = cap({ leadId: 'L2', scoutId: 'b', capturedAt: iso(sentAt - 7 * 86_400_000), receivedAt: iso(sentAt), clockSkewMs: -7 * 86_400_000 });
    expect(orderingTime(slow)).toBe(sentAt);
    expect(decideOwnership([first], slow).outcome).toBe('supporting');
  });
  it('an honest offline capture sent hours later keeps its own time and is not mistaken for a wrong clock', () => {
    const received = T0 + 6 * 3_600_000;
    const offline = cap({ leadId: 'L2', scoutId: 'b', capturedAt: iso(T0 + 3_600_000), receivedAt: iso(received), clockSkewMs: 0 });
    expect(orderingTime(offline)).toBe(T0 + 3_600_000);
  });
  it('a capture can never be later than the server received it, nor older than the offline limit', () => {
    const received = T0;
    expect(orderingTime(cap({ leadId: 'x', capturedAt: iso(T0 + 86_400_000), receivedAt: iso(received) }))).toBe(received);
    expect(orderingTime(cap({ leadId: 'x', capturedAt: iso(T0 - 30 * 86_400_000), receivedAt: iso(received) }))).toBe(received - DEFAULT_OWNERSHIP.maxOfflineMs);
  });
  it('a different scout claiming to have captured before the lead on record cannot be verified, so the Owner decides', () => {
    const onRecord = cap({ leadId: 'L1', scoutId: 'a', capturedAt: iso(T0 + 3_600_000), receivedAt: iso(T0 + 3_600_000) });
    const offline = cap({ leadId: 'L2', scoutId: 'b', capturedAt: iso(T0 + 1_000_000), receivedAt: iso(T0 + 4_000_000) });
    expect(decideOwnership([onRecord], offline)).toEqual({ outcome: 'review', ownerLeadId: 'L1', reason: 'earlier_capture_synced_late' });
  });
});
