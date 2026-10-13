import type { AlertSeverity } from '@/data/types';

/**
 * The one SLA clock. Targets are expressed with `hours()`/`days()`, never a
 * fresh per-screen constant in some other unit, and breach severity maps
 * onto the existing `AlertSeverity` vocabulary so every breach badge in the
 * app means the same thing.
 */
export function minutes(n: number): number {
  return n * 60_000;
}
export function hours(n: number): number {
  return n * 3_600_000;
}
export function days(n: number): number {
  return n * 86_400_000;
}

export function elapsedMs(startedAt: string, now: number): number {
  return now - new Date(startedAt).getTime();
}

export function elapsedRatio(startedAt: string, targetMs: number, now: number): number {
  return elapsedMs(startedAt, now) / targetMs;
}

export function isBreached(startedAt: string, targetMs: number, now: number): boolean {
  return elapsedRatio(startedAt, targetMs, now) >= 1;
}

/** Ratio-based, so a 60-minute SLA and a 5-day SLA escalate on the same
 *  relative schedule. */
export function severityForRatio(ratio: number): AlertSeverity {
  if (ratio >= 2) return 'critical';
  if (ratio >= 1) return 'high';
  if (ratio >= 0.75) return 'medium';
  return 'low';
}

export const BUSINESS_HOURS = { start: 9, end: 19 } as const;

function isBusinessHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end;
}

/** Business-hours time elapsed since `at` — overnight gaps don't count
 *  against the clock, the fairness rule first set by the Reply Inbox (057).
 *  Hour-granularity is plenty for a same-day SLA indicator. */
export function businessMinutesSince(at: string, now: number = Date.now()): number {
  const end = new Date(now);
  let businessHours = 0;
  const cursor = new Date(at);
  cursor.setMinutes(0, 0, 0);
  while (cursor < end) {
    if (isBusinessHour(cursor)) businessHours += 1;
    cursor.setHours(cursor.getHours() + 1);
  }
  return businessHours * 60;
}
