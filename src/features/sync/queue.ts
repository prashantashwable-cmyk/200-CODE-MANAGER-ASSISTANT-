/**
 * The offline queue (master prompt P9.5): everything captured without signal waits here with its own time, is sent in order,
 * and is idempotent so a retry never double-records. A conflict on a critical field is never resolved by "last write wins":
 * it is kept, shown, and sent to a person. Non-critical fields merge field by field.
 * Pure: the screen persists the queue in the browser and calls `flush` with a real sender.
 */

export type QueueStatus = 'pending' | 'synced' | 'failed' | 'conflict';

export interface QueueItem<P = Record<string, unknown>> {
  /** Idempotency key: the server records an item with this id once. */
  clientEventId: string;
  kind: string;
  payload: P;
  /** When it truly happened on the device. Never replaced by the time it was sent. */
  capturedAt: string;
  attempts: number;
  status: QueueStatus;
  lastError?: string;
  nextTryAt?: number;
  conflict?: { fields: string[]; remote: Record<string, unknown> };
}

export type SendResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; retry: true; error: string }
  | { ok: false; retry: false; error: string }
  | { ok: false; conflict: { fields: string[]; remote: Record<string, unknown> } };

export const MAX_ATTEMPTS = 6;
export const backoffMs = (attempts: number): number => Math.min(15 * 60_000, 2_000 * 2 ** Math.max(0, attempts - 1));

export function enqueue<P extends Record<string, unknown>>(queue: QueueItem[], item: Pick<QueueItem<P>, 'clientEventId' | 'kind' | 'payload' | 'capturedAt'>): QueueItem[] {
  if (queue.some((q) => q.clientEventId === item.clientEventId)) return queue; // the same capture tapped twice is one item
  return [...queue, { ...item, attempts: 0, status: 'pending' }];
}

/**
 * Sends what is due, oldest first, and stops at the first item that must wait: order matters (a correction cannot overtake the
 * capture it corrects). Returns the new queue; the caller saves it.
 */
export async function flush(queue: QueueItem[], send: (item: QueueItem) => Promise<SendResult>, now: number): Promise<QueueItem[]> {
  const out = queue.map((q) => ({ ...q }));
  for (const item of out) {
    if (item.status === 'synced' || item.status === 'conflict') continue;
    if (item.status === 'failed') break; // a failed item blocks the ones behind it until a person deals with it
    if (item.nextTryAt && item.nextTryAt > now) break;
    item.attempts += 1;
    let r: SendResult;
    try { r = await send(item); } catch (e) { r = { ok: false, retry: true, error: e instanceof Error ? e.message : 'network' }; }
    if (r.ok) { item.status = 'synced'; delete item.lastError; delete item.nextTryAt; continue; }
    if ('conflict' in r) { item.status = 'conflict'; item.conflict = r.conflict; continue; }
    item.lastError = r.error;
    if (r.retry && item.attempts < MAX_ATTEMPTS) { item.nextTryAt = now + backoffMs(item.attempts); break; }
    item.status = 'failed';
    break;
  }
  return out;
}

export const pendingCount = (q: QueueItem[]): number => q.filter((i) => i.status === 'pending').length;
export const needsAttention = (q: QueueItem[]): QueueItem[] => q.filter((i) => i.status === 'failed' || i.status === 'conflict');
/** Safe to remove from the phone: already on the server. */
export const prune = (q: QueueItem[]): QueueItem[] => q.filter((i) => i.status !== 'synced');

export interface MergeResult { merged: Record<string, unknown>; conflicts: string[] }

/**
 * Field-level merge of a device's edit and the server's copy, from a common base.
 * A field only one side changed takes that change. A field both changed to different values: if it is non-critical the later
 * capture wins (and that is recorded as a merge); if it is critical (money, price, evidence, status) it is a conflict for a person.
 */
export function mergeFields(base: Record<string, unknown>, local: Record<string, unknown>, remote: Record<string, unknown>, critical: string[], localAt: string, remoteAt: string): MergeResult {
  const merged: Record<string, unknown> = { ...base };
  const conflicts: string[] = [];
  for (const k of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])) {
    const b = JSON.stringify(base[k]);
    const l = JSON.stringify(local[k]);
    const r = JSON.stringify(remote[k]);
    if (l === r) { if (k in local) merged[k] = local[k]; else delete merged[k]; continue; }
    if (l === b) { if (k in remote) merged[k] = remote[k]; else delete merged[k]; continue; }
    if (r === b) { if (k in local) merged[k] = local[k]; else delete merged[k]; continue; }
    if (critical.includes(k)) { conflicts.push(k); merged[k] = base[k]; continue; }
    const laterIsLocal = Date.parse(localAt) >= Date.parse(remoteAt);
    const winner = laterIsLocal ? local : remote;
    if (k in winner) merged[k] = winner[k]; else delete merged[k];
  }
  return { merged, conflicts };
}
