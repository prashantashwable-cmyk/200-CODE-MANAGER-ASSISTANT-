/**
 * Screen 118's two non-routine payment exposures, pure. An advance is money out before the goods came; a retention is money
 * held back until the installation proves the parts. Neither is a flag someone sets: an advance's state is read from the order's
 * promised date and whether it was delivered, and a retention's readiness from the installation's own QC and handover state.
 */
import { days } from '@/features/sla/clock';
import type { Job } from '@/data/types';

/** An advance still undelivered this long after the date the supplier promised goes to formal recovery. */
export const RECOVERY_AFTER = days(14);
/** A recovery that has gone quiet this long is chased. */
export const RECOVERY_CHASE_EVERY = days(7);
/** A retention is ready this long before Admin is asked to release it. */
export const RELEASE_DUE_AFTER = days(3);
export const RECOVERY_REASON_MIN = 10;

export type AdvanceState = 'on_track' | 'late' | 'stalled' | 'deal_gone' | 'recovering';

export interface AdvanceFacts {
  /** The order was fully delivered: the advance is no longer exposure. */
  delivered: boolean;
  /** The date the supplier promised delivery by. */
  promisedAt: string | null;
  /** The deal the order was for was lost or cancelled. */
  dealGone: boolean;
  recoveryOpen: boolean;
}

export interface AdvanceReading {
  state: AdvanceState;
  /** Days past the promised date (0 when not yet due). */
  daysPastPromise: number;
  /** Formal recovery should be started: stalled or the deal is gone. */
  recommendRecovery: boolean;
}

export function readAdvance(f: AdvanceFacts, now: number): AdvanceReading {
  const past = f.promisedAt ? Math.max(0, Math.floor((now - new Date(f.promisedAt).getTime()) / 86_400_000)) : 0;
  const stalled = f.promisedAt !== null && now - new Date(f.promisedAt).getTime() >= RECOVERY_AFTER;
  const state: AdvanceState = f.recoveryOpen ? 'recovering' : f.dealGone ? 'deal_gone' : stalled ? 'stalled' : past > 0 || (f.promisedAt !== null && now > new Date(f.promisedAt).getTime()) ? 'late' : 'on_track';
  return { state, daysPastPromise: past, recommendRecovery: !f.recoveryOpen && (state === 'stalled' || state === 'deal_gone') };
}

/* --------------------------------------------------------------- retention */

export type RetentionReadiness = 'released' | 'withheld' | 'ready' | 'awaiting_qc' | 'installing' | 'rework' | 'no_installation';

export interface ReadinessReading {
  readiness: RetentionReadiness;
  /** How far the installation has got, 0 to 1. */
  progress: number;
  job: { code: string; siteName: string; status: Job['status']; stepsDone: number; stepsTotal: number; holdReason: string | null; completedAt: string | null } | null;
}

const done = (j: Job) => j.steps.filter((s) => s.status === 'complete').length;
const view = (j: Job): NonNullable<ReadinessReading['job']> => ({ code: j.code, siteName: j.siteName, status: j.status, stepsDone: done(j), stepsTotal: j.steps.length, holdReason: j.holdReason ?? null, completedAt: j.completedAt ?? null });

/** Reads readiness from the installation jobs on the deal the parts were for. QC pass and handover are the job's own
 *  `completed` status, never a second flag: a retention is ready only once a job finished after the retention began. */
export function readRetention(status: 'held' | 'paused' | 'released' | 'withheld', heldAt: string, jobs: Job[]): ReadinessReading {
  if (status === 'released') return { readiness: 'released', progress: 1, job: null };
  if (status === 'withheld') return { readiness: 'withheld', progress: 0, job: null };
  const finished = jobs.filter((j) => j.status === 'completed' && j.completedAt && j.completedAt >= heldAt).sort((a, b) => (a.completedAt! < b.completedAt! ? -1 : 1))[0];
  if (finished) return { readiness: 'ready', progress: 1, job: view(finished) };
  const rework = jobs.find((j) => j.status === 'on_hold' || j.steps.some((s) => s.status === 'blocked'));
  if (rework) return { readiness: 'rework', progress: rework.steps.length ? done(rework) / rework.steps.length : 0, job: view(rework) };
  const qc = jobs.find((j) => j.status === 'qc_pending' || j.status === 'handover_pending');
  if (qc) return { readiness: 'awaiting_qc', progress: qc.steps.length ? done(qc) / qc.steps.length : 0, job: view(qc) };
  const open = jobs.filter((j) => j.status !== 'completed').sort((a, b) => done(b) - done(a))[0];
  if (open) return { readiness: 'installing', progress: open.steps.length ? done(open) / open.steps.length : 0, job: view(open) };
  return { readiness: 'no_installation', progress: 0, job: null };
}

/** Why a ready retention still cannot go in a batch. */
export type RetentionHold = 'defect' | 'open_report' | 'open_dispute';
export type BatchSkip = 'not_found' | 'not_held' | 'not_ready' | RetentionHold;

export function batchSkipReason(status: string, readiness: RetentionReadiness, holds: RetentionHold[]): BatchSkip | null {
  if (status !== 'held') return 'not_held';
  if (holds.length > 0) return holds[0];
  if (readiness !== 'ready') return 'not_ready';
  return null;
}
