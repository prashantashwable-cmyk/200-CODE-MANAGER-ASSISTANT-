/**
 * Safety results recorded without signal, pure (126). A result or a fix is written down on the phone with the moment it was done and sent
 * when the network allows; the screen shows the check as it now stands, marked as not yet sent, by applying the same rules the server
 * will (`safetyState`, `MAX_FAILS`). What only Admin can do (review, release, accept) is never queued: it needs the server.
 */
import type { SafetyChecklistView, SafetyItemView } from '@/data/repository';
import type { JobSafetyTest, SafetyAttempt, SafetyFixKind, SafetyResult } from '@/data/types';
import { MAX_FAILS, isCleared, safetyState } from '@/features/technician/safety';

export type SafetyQueueItem = { id: string; jobId: string; capturedAt: string; itemId: string } & (
  | { kind: 'result'; result: SafetyResult; measured?: string; note?: string }
  | { kind: 'fix'; fixKind: SafetyFixKind; note: string }
);
export type SafetyQueueInput = SafetyQueueItem extends infer T ? (T extends unknown ? Omit<T, 'id' | 'jobId' | 'capturedAt' | 'itemId'> : never) : never;

const asTest = (i: SafetyItemView): JobSafetyTest => ({
  id: i.id,
  jobId: '',
  itemId: i.id,
  attempts: i.attempts.map((a) => ({ ...a })),
  holds: i.hold ? [i.hold] : [],
  disagreement: i.disagreement ?? undefined,
  override: i.override ?? undefined,
  isDemo: true,
});

/** Lays the results not yet sent over what the server last said. `sending` marks the items only on this phone. */
export function applySafetyQueue(view: SafetyChecklistView, queue: SafetyQueueItem[], user: { id: string; name: string }): { view: SafetyChecklistView; pending: Set<string> } {
  const items = view.items.map((i) => ({ ...i, attempts: i.attempts.map((a) => ({ ...a })) }));
  const pending = new Set<string>();
  for (const q of queue.filter((x) => x.jobId === view.job.id)) {
    const item = items.find((i) => i.id === q.itemId);
    if (!item) continue;
    const test = asTest(item);
    const state = safetyState(test);
    if (q.kind === 'result') {
      if (state !== 'not_tested' && state !== 'retest_due') continue;
      const attempt: SafetyAttempt = { id: `local-${q.id}`, n: test.attempts.length + 1, result: q.result, at: q.capturedAt, byUserId: user.id, byName: user.name, ...(q.measured ? { measured: q.measured } : {}), ...(q.note ? { note: q.note } : {}) };
      test.attempts.push(attempt);
      if (q.result === 'fail' && test.attempts.filter((a) => a.result === 'fail').length >= MAX_FAILS) test.holds.push({ reason: 'too_many_fails', at: q.capturedAt });
    } else {
      if (state !== 'failed') continue;
      const last = test.attempts[test.attempts.length - 1];
      last.fix = { kind: q.fixKind, note: q.note, at: q.capturedAt, byName: user.name };
      if (q.fixKind === 'needs_rework') test.holds.push({ reason: 'needs_rework', at: q.capturedAt });
    }
    item.attempts = test.attempts;
    item.fails = test.attempts.filter((a) => a.result === 'fail').length;
    item.hold = test.holds.find((h) => !h.releasedAt) ?? null;
    item.state = safetyState(test);
    pending.add(item.id);
  }
  // What a cleared check unlocks: the ones that were waiting for it.
  const clearedIds = new Set(items.filter((i) => isCleared(i.state)).map((i) => i.id));
  const next = items.map((i) => ({ ...i, waitingFor: i.waitingFor.filter((id) => !clearedIds.has(id)) }));
  const cleared = next.filter((i) => isCleared(i.state)).length;
  return { view: { ...view, items: next, progress: { cleared, total: next.length }, blocksQc: cleared < next.length }, pending };
}
