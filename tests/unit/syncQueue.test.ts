import { describe, expect, it } from 'vitest';
import { backoffMs, enqueue, flush, mergeFields, needsAttention, pendingCount, prune, MAX_ATTEMPTS } from '@/features/sync/queue';
import type { QueueItem, SendResult } from '@/features/sync/queue';

const item = (id: string, over: Partial<QueueItem> = {}) => ({ clientEventId: id, kind: 'lead.captured', payload: { n: id }, capturedAt: '2026-10-13T09:00:00.000Z', ...over });
const NOW = Date.parse('2026-10-13T10:00:00.000Z');

describe('offline queue', () => {
  it('the same capture queued twice is one item, and keeps its own capture time', () => {
    let q = enqueue([], item('a'));
    q = enqueue(q, item('a'));
    expect(q).toHaveLength(1);
    expect(q[0].capturedAt).toBe('2026-10-13T09:00:00.000Z');
  });
  it('sends oldest first and marks each synced; a duplicate answer counts as synced', async () => {
    const sent: string[] = [];
    let q = enqueue(enqueue([], item('a')), item('b'));
    q = await flush(q, async (i) => { sent.push(i.clientEventId); return i.clientEventId === 'b' ? { ok: true, duplicate: true } : { ok: true }; }, NOW);
    expect(sent).toEqual(['a', 'b']);
    expect(q.every((i) => i.status === 'synced')).toBe(true);
    expect(prune(q)).toEqual([]);
  });
  it('a dropped connection retries later with backoff and blocks the items behind it, so order is kept', async () => {
    let q = enqueue(enqueue([], item('a')), item('b'));
    const calls: string[] = [];
    q = await flush(q, async (i) => { calls.push(i.clientEventId); throw new Error('offline'); }, NOW);
    expect(calls).toEqual(['a']);
    expect(q[0]).toMatchObject({ status: 'pending', attempts: 1, nextTryAt: NOW + backoffMs(1) });
    expect(pendingCount(q)).toBe(2);
    const early = await flush(q, async () => { calls.push('early'); return { ok: true }; }, NOW + 1000);
    expect(calls).toEqual(['a']);
    expect(early[0].status).toBe('pending');
    const later = await flush(q, async () => ({ ok: true }), NOW + backoffMs(1) + 1);
    expect(later.map((i) => i.status)).toEqual(['synced', 'synced']);
  });
  it('gives up after the attempt limit and then needs a person; later items wait behind it', async () => {
    let q = enqueue(enqueue([], item('a')), item('b'));
    let t = NOW;
    for (let n = 0; n < MAX_ATTEMPTS; n += 1) { q = await flush(q, async () => ({ ok: false, retry: true, error: 'timeout' } as SendResult), t); t += 20 * 60_000; }
    expect(q[0].status).toBe('failed');
    expect(needsAttention(q).map((i) => i.clientEventId)).toEqual(['a']);
    const again = await flush(q, async () => ({ ok: true }), t);
    expect(again[1].status).toBe('pending');
  });
  it('a refusal that will never succeed fails at once, without retries', async () => {
    const q = await flush(enqueue([], item('a')), async () => ({ ok: false, retry: false, error: 'forbidden' }), NOW);
    expect(q[0]).toMatchObject({ status: 'failed', attempts: 1, lastError: 'forbidden' });
  });
  it('a conflict is kept for a person and does not stop other captures syncing', async () => {
    const q = await flush(enqueue(enqueue([], item('a')), item('b')), async (i) => (i.clientEventId === 'a' ? { ok: false, conflict: { fields: ['price'], remote: { price: 5 } } } : { ok: true }), NOW);
    expect(q.map((i) => i.status)).toEqual(['conflict', 'synced']);
    expect(q[0].conflict?.fields).toEqual(['price']);
    expect(needsAttention(q)).toHaveLength(1);
  });
});

describe('field-level merge', () => {
  const base = { note: 'old', tag: 'a', price: 100, city: 'Pune' };
  it('a field only one side changed takes that change', () => {
    const r = mergeFields(base, { ...base, note: 'mine' }, { ...base, tag: 'theirs' }, ['price'], '2026-10-13T09:00:00Z', '2026-10-13T09:05:00Z');
    expect(r).toEqual({ merged: { ...base, note: 'mine', tag: 'theirs' }, conflicts: [] });
  });
  it('both sides changing a non-critical field keeps the later capture', () => {
    const r = mergeFields(base, { ...base, note: 'device' }, { ...base, note: 'server' }, ['price'], '2026-10-13T09:10:00Z', '2026-10-13T09:05:00Z');
    expect(r.merged.note).toBe('device');
    expect(r.conflicts).toEqual([]);
    expect(mergeFields(base, { ...base, note: 'device' }, { ...base, note: 'server' }, ['price'], '2026-10-13T09:00:00Z', '2026-10-13T09:05:00Z').merged.note).toBe('server');
  });
  it('both sides changing a critical field is a conflict for a person, never last write wins', () => {
    const r = mergeFields(base, { ...base, price: 90 }, { ...base, price: 120 }, ['price'], '2026-10-13T09:10:00Z', '2026-10-13T09:05:00Z');
    expect(r.conflicts).toEqual(['price']);
    expect(r.merged.price).toBe(100);
  });
  it('both sides making the same change is no conflict even on a critical field', () => {
    expect(mergeFields(base, { ...base, price: 90 }, { ...base, price: 90 }, ['price'], 'x', 'y').conflicts).toEqual([]);
  });
});
