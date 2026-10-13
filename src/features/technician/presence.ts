/**
 * Who was on site, and for how long, pure (125). One record per person per visit (`SiteCheckIn`); everything else (the duration, the
 * "on site now" list, the days a job has spanned, whether a check-in can be believed) is read from those records and never stored.
 *
 * Believing a check-in is not a rigid single radius. A phone in a canyon of tall buildings can be 80 m out and honest, so the fix is judged
 * against the phone's own reported accuracy, in the same way the surveyor's site-visit verification (017) judges a visit: a fix outside the
 * trusted radius but within the device's own margin of error is *borderline*, allowed and recorded; only a fix that cannot be explained by
 * the phone's own uncertainty is a mismatch, and even then the person may say why (a gate on the far side of the estate) instead of being
 * locked out of the job.
 */
import type { GeoPoint, Job, SiteCheckIn, SiteLeaveReason } from '@/data/types';
import { hours } from '@/features/sla/clock';
import { dayKey } from '@/features/technician/jobs';

/** The trusted radius around a site, and the wider one for a site spread over an area (a township under construction). Same values the
 *  surveyor's verification (017) and duplicate check (035) use. */
export const SITE_RADIUS_METRES = 150;
export const LARGE_SITE_RADIUS_METRES = 600;
/** Leads whose sites are genuinely large (kept in step with 017). */
export const LARGE_SITE_LEAD_IDS = ['l-15', 'l-6'];
/** A fix worse than this is a weak one: the person is asked to try in the open, and what is recorded says it was weak (032's threshold). */
export const POOR_ACCURACY_METRES = 50;
/** Worse than this and the phone cannot tell where it is at all. */
export const UNUSABLE_ACCURACY_METRES = 300;

/** Words that make an override readable later. */
export const OVERRIDE_REASON_MIN = 15;
export const LEAVE_NOTE_MIN = 8;

/** Completed installations needed before their on-site time is offered as a typical figure. Placeholder business decision: AIEC finishes few jobs, so two is the least that is more than one. */
export const MIN_TYPICAL_JOBS = 2;

/** Someone still "checked in" this long after arriving, or on a different calendar day, has forgotten to check out. */
export const STALE_AFTER = hours(14);

export type PresenceVerdict = SiteCheckIn['checkInVerdict'];

export interface PresenceRead {
  verdict: PresenceVerdict;
  driftM: number | null;
  accuracyM: number | null;
  /** How far out the fix is, in units of the phone's own uncertainty. */
  sigma: number | null;
  /** The phone could not tell where it was well enough to judge either way. */
  weak: boolean;
  radiusM: number;
}

/** Judges one GPS fix against a site. */
export function readPresence(input: { driftM: number | null; accuracyM: number | null; radiusM: number }): PresenceRead {
  const { driftM, radiusM } = input;
  if (driftM === null) return { verdict: 'unverified', driftM: null, accuracyM: input.accuracyM, sigma: null, weak: true, radiusM };
  const accuracyM = input.accuracyM === null ? POOR_ACCURACY_METRES : Math.max(1, input.accuracyM);
  const weak = accuracyM > POOR_ACCURACY_METRES;
  const sigma = Math.round((driftM / accuracyM) * 10) / 10;
  if (driftM <= radiusM) return { verdict: 'clean', driftM, accuracyM: input.accuracyM, sigma, weak, radiusM };
  // Outside the radius. If the phone's own margin of error explains the gap, it is borderline, not a mismatch.
  if (driftM - radiusM <= accuracyM) return { verdict: 'borderline', driftM, accuracyM: input.accuracyM, sigma, weak, radiusM };
  // A fix so poor that it says nothing either way cannot condemn anyone.
  if (accuracyM >= UNUSABLE_ACCURACY_METRES) return { verdict: 'borderline', driftM, accuracyM: input.accuracyM, sigma, weak: true, radiusM };
  return { verdict: 'mismatch', driftM, accuracyM: input.accuracyM, sigma, weak, radiusM };
}

/** The radius that applies to a job's site. */
export const radiusFor = (leadId: string | undefined): number => (leadId && LARGE_SITE_LEAD_IDS.includes(leadId) ? LARGE_SITE_RADIUS_METRES : SITE_RADIUS_METRES);

export type CheckInProblem = 'job_on_hold' | 'read_only' | 'not_scheduled_yet' | 'already_checked_in' | 'checked_in_elsewhere' | 'reason_required' | 'captured_in_future' | 'captured_invalid';

const CAN_VISIT: Job['status'][] = ['scheduled', 'materials_pending', 'in_progress', 'qc_pending'];

/** Whether someone may arrive at this job now. A job booked for a later day is not visited today, and a held or finished one is not visited at all. */
export function jobVisitProblem(job: Pick<Job, 'status' | 'scheduledFor'>, now: number): CheckInProblem | null {
  if (job.status === 'on_hold') return 'job_on_hold';
  if (!CAN_VISIT.includes(job.status)) return 'read_only';
  if ((job.status === 'scheduled' || job.status === 'materials_pending') && dayKey(job.scheduledFor) > dayKey(now)) return 'not_scheduled_yet';
  return null;
}

/** An open record that has run past a working day: forgotten, not "still on site". */
export function isStale(s: Pick<SiteCheckIn, 'checkInAt' | 'checkOutAt'>, now: number): boolean {
  if (s.checkOutAt) return false;
  const at = new Date(s.checkInAt).getTime();
  return now - at > STALE_AFTER || dayKey(at) !== dayKey(now);
}

/** Minutes on site for one visit. A stale open visit has no known end, so it counts for nothing until the person says when they left. */
export function visitMinutes(s: Pick<SiteCheckIn, 'checkInAt' | 'checkOutAt'>, now: number): number {
  if (!s.checkOutAt && isStale(s, now)) return 0;
  const end = s.checkOutAt ? new Date(s.checkOutAt).getTime() : now;
  return Math.max(0, Math.round((end - new Date(s.checkInAt).getTime()) / 60_000));
}

export interface PersonTime {
  userId: string;
  minutes: number;
  days: number;
  onSiteNow: boolean;
  since: string | null;
  lastLeftAt: string | null;
  /** An open visit from an earlier day, waiting for the person to say when they left. */
  unconfirmed: boolean;
}

/** One person's time on a job across every visit: independent of everyone else on the job. */
export function timeOf(sessions: SiteCheckIn[], userId: string, now: number): PersonTime {
  const mine = sessions.filter((s) => s.userId === userId).sort((a, b) => a.checkInAt.localeCompare(b.checkInAt));
  const open = mine.find((s) => !s.checkOutAt && !isStale(s, now));
  const stale = mine.some((s) => isStale(s, now));
  const closed = mine.filter((s) => s.checkOutAt);
  return {
    userId,
    minutes: mine.reduce((sum, s) => sum + visitMinutes(s, now), 0),
    days: new Set(mine.filter((s) => s.checkOutAt || !isStale(s, now)).map((s) => dayKey(s.checkInAt))).size,
    onSiteNow: !!open,
    since: open?.checkInAt ?? null,
    lastLeftAt: closed.length ? (closed[closed.length - 1].checkOutAt as string) : null,
    unconfirmed: stale,
  };
}

export interface DayRow {
  date: string;
  minutes: number;
  people: { userId: string; minutes: number }[];
}

/** The days a job has spanned, newest first. */
export function daysOf(sessions: SiteCheckIn[], now: number): DayRow[] {
  const byDay = new Map<string, Map<string, number>>();
  for (const s of sessions) {
    const m = visitMinutes(s, now);
    if (m <= 0 && !s.checkOutAt) continue;
    const day = dayKey(s.checkInAt);
    const people = byDay.get(day) ?? new Map<string, number>();
    people.set(s.userId, (people.get(s.userId) ?? 0) + m);
    byDay.set(day, people);
  }
  return [...byDay.entries()]
    .map(([date, people]) => ({ date, minutes: [...people.values()].reduce((a, b) => a + b, 0), people: [...people.entries()].map(([userId, minutes]) => ({ userId, minutes })) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** A leave the time it left is believable: after they arrived, and not in the future. */
export function leaveTimeProblem(arrivedAt: string, leftAt: string, now: number): 'invalid' | 'before_arrival' | 'in_future' | null {
  const t = new Date(leftAt).getTime();
  if (Number.isNaN(t)) return 'invalid';
  if (t > now + 60_000) return 'in_future';
  if (t < new Date(arrivedAt).getTime()) return 'before_arrival';
  return null;
}

/** How loudly Admin is told about a checkout with steps still open. An ordinary end of day on a multi-day job is worth a line, never an
 *  alarm, even mid-way through a safety step (the work simply continues tomorrow); leaving for any other reason mid-way through one is. */
export function leaveSeverity(reason: SiteLeaveReason, safetyStepCurrent: boolean): 'low' | 'medium' | 'high' | 'critical' {
  if (reason === 'end_of_day') return 'low';
  if (reason === 'waiting_material' || reason === 'site_blocked') return safetyStepCurrent ? 'high' : 'medium';
  return safetyStepCurrent ? 'critical' : 'high';
}

/** Median of a list of numbers, or null for none. */
export function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Minutes as `Xh Ym`. */
export const hm = (minutes: number): { h: number; m: number } => ({ h: Math.floor(minutes / 60), m: minutes % 60 });

export const samePlace = (a: GeoPoint, b: GeoPoint) => a.lat === b.lat && a.lng === b.lng;
