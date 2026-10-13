/**
 * The installation timeline's rules, pure (129). Nothing here is stored: the timeline is a presentation of the job's own steps (123), its
 * evidence (124) and its issue reports (127), so what a customer is shown is always what is really true on site. The one thing it works out
 * is when the job is now expected to finish, from how far it has got, how fast the work has really gone, and how long it has been stopped.
 */
import type { InstallSopPhase, IssueCategory } from '@/data/types';
import { days, hours } from '@/features/sla/clock';

/** The stages a customer sees, in the order a lift is built: one for each phase of the procedure. */
export const PHASES: InstallSopPhase[] = ['preparation', 'rails', 'machine', 'car', 'wiring', 'safety', 'final'];

/** How long a whole installation is planned to take when there are not yet enough finished ones to go on. A placeholder business decision. */
export const DEFAULT_PLANNED_DAYS = 12;
/** Finished jobs needed before their own durations replace the default. */
export const MIN_TYPICAL_JOBS = 2;
/** A change of at least this many days is called a slip, and shown as one. */
export const SLIP_NOTICE_DAYS = 1;
/** A step finished this recently, with the next one not yet begun, is "in progress, next update soon" and not a gap. */
export const FRESH_WINDOW = hours(6);
/** Work under way with no news for this long is said to be quiet (not silently assumed fine). */
export const QUIET_AFTER = hours(30);
/** Pace is only believed once this share of the job is done, and counts for more the further it has got. */
const PACE_FROM = 0.2;
const PACE_FULL = 0.6;
const PACE_MIN = 0.6;
const PACE_MAX = 2;

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface PlannedDuration {
  ms: number;
  basis: 'typical' | 'default';
  jobs: number;
}

/** What an installation usually takes here: the median of finished jobs, else the placeholder. */
export function plannedDuration(finished: { startedAt?: string; completedAt?: string }[]): PlannedDuration {
  const spans = finished.filter((j) => j.startedAt && j.completedAt).map((j) => new Date(j.completedAt as string).getTime() - new Date(j.startedAt as string).getTime()).filter((x) => x > 0);
  const m = spans.length >= MIN_TYPICAL_JOBS ? median(spans) : null;
  return m ? { ms: m, basis: 'typical', jobs: spans.length } : { ms: days(DEFAULT_PLANNED_DAYS), basis: 'default', jobs: spans.length };
}

export interface EstimateInput {
  now: number;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  stepsTotal: number;
  stepsDone: number;
  plannedMs: number;
  /** Time the work has been stopped by reports, an open one counted up to now (127). */
  blockedMs: number;
  /** Work is stopped right now, so the date cannot be firmer than "not before". */
  stoppedNow: boolean;
  /** How much longer an open report is expected to keep the work stopped (its resolve target less the time already gone). */
  stopAllowanceMs?: number;
}

export interface Estimate {
  /** The date first promised: the start plus the planned duration. It never moves. */
  originalAt: number;
  /** The date now expected: it moves as work goes faster or slower and as it is stopped. */
  currentAt: number;
  slipDays: number;
  slipped: boolean;
  /** Work is stopped, so this is the earliest it could be. */
  atLeast: boolean;
  /** How the pace so far compares with plan: above 1 is slower. */
  pace: number;
}

const dayStart = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * The expected finish. What is left is the planned time for the remaining share of the steps, stretched or shrunk by how the work has really
 * gone once enough of it is done to say; it starts from now, so any time the work was stopped is already inside it, and while it is
 * stopped it moves on each day and is only ever "not before". Recomputed on every read, so logging or resolving a blocking report
 * changes it at once.
 */
export function estimateOf(i: EstimateInput): Estimate {
  const total = Math.max(1, i.stepsTotal);
  const done = Math.min(total, Math.max(0, i.stepsDone));
  const frac = done / total;
  const start = i.startedAt ? new Date(i.startedAt).getTime() : new Date(i.scheduledFor).getTime();
  const originalAt = start + i.plannedMs;
  if (i.completedAt) {
    const at = new Date(i.completedAt).getTime();
    return { originalAt, currentAt: at, slipDays: Math.round((dayStart(at) - dayStart(originalAt)) / days(1)), slipped: dayStart(at) - dayStart(originalAt) >= days(SLIP_NOTICE_DAYS), atLeast: false, pace: 1 };
  }
  let pace = 1;
  if (i.startedAt && frac >= PACE_FROM) {
    const worked = Math.max(0, i.now - start - i.blockedMs);
    const expected = i.plannedMs * frac;
    const raw = expected > 0 ? worked / expected : 1;
    const weight = Math.min(1, (frac - PACE_FROM) / (PACE_FULL - PACE_FROM));
    pace = 1 + (Math.min(PACE_MAX, Math.max(PACE_MIN, raw)) - 1) * weight;
  }
  const remaining = i.plannedMs * (1 - frac) * pace;
  // A job that has not started begins on its booked day, or today if that has gone by.
  const from = i.startedAt ? i.now : Math.max(i.now, start);
  const base = (i.startedAt ? from + remaining : from + i.plannedMs) + Math.max(0, i.stopAllowanceMs ?? 0);
  const currentAt = Math.max(i.now, base);
  const slipDays = Math.round((dayStart(currentAt) - dayStart(originalAt)) / days(1));
  return { originalAt, currentAt, slipDays, slipped: dayStart(currentAt) - dayStart(originalAt) >= days(SLIP_NOTICE_DAYS), atLeast: i.stoppedNow, pace };
}

/** When a stage is expected to be done, spread over what is left in proportion to the steps still to do. */
export function stageExpectedAt(now: number, currentAt: number, remainingThrough: number, remainingAll: number): number {
  if (remainingAll <= 0) return currentAt;
  return now + (currentAt - now) * (remainingThrough / remainingAll);
}

export type DelayReason = 'parts' | 'site' | 'readiness' | 'safety' | 'other' | 'materials_pending' | 'hold' | 'pace';

/** What a report category means to the person waiting, without the report itself. */
export const REASON_OF: Record<IssueCategory, DelayReason> = { parts: 'parts', site_condition: 'site', customer_readiness: 'readiness', safety_concern: 'safety', other: 'other' };

export type Freshness = 'not_started' | 'done' | 'blocked' | 'just_completed' | 'quiet' | 'in_progress';

/**
 * How to read the moment: a stage that has just finished with the next not yet begun is said to be in progress, next update soon, never
 * an empty gap; work with no news for a long while is said to be quiet; and a stopped or finished job says so.
 */
export function freshnessOf(input: { status: string; lastAt: number | null; now: number; stoppedNow: boolean; nextStarted: boolean; justCompletedStage: boolean }): Freshness {
  if (input.status === 'completed') return 'done';
  if (input.status === 'scheduled' || input.status === 'materials_pending') return 'not_started';
  if (input.stoppedNow || input.status === 'on_hold') return 'blocked';
  if (input.justCompletedStage && !input.nextStarted && input.lastAt !== null && input.now - input.lastAt <= FRESH_WINDOW) return 'just_completed';
  if (input.lastAt !== null && input.now - input.lastAt > QUIET_AFTER) return 'quiet';
  return 'in_progress';
}
