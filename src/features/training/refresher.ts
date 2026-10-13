/**
 * The refresher rules, pure (156). A certification that ends is not a cliff: it ends, a grace period follows during which the holder can still be given
 * work while they refresh, and only after that do new assignments stop. The same pattern applies to every certification, the cadence that sets the dates is a
 * versioned setting (never an assumption in code), and a documented extension (approved leave) moves the last eligible day without anyone editing a date.
 *
 * THE CADENCES, THE GRACE PERIODS AND THE LIMITS BELOW ARE PLACEHOLDER BUSINESS DECISIONS for the owner to confirm; Admin changes the cadences on screen.
 */
import type { CertificationBadge, RefresherCadenceVersion, RefresherExtension } from '@/data/types';

/** How far ahead a refresher shows in the queue as "coming up". */
export const UPCOMING_DAYS = 60;
export const MAX_GRACE_DAYS = 90;
export const MAX_MONTHS = 60;
/** A documented extension can carry a partner at most this long past where the grace period would have ended. */
export const MAX_EXTENSION_DAYS = 120;
/** A reminder sent by hand, or by the heartbeat as grace runs out, is not repeated more often than this. */
export const REMIND_EVERY_H = 24;
/** The partner is reminded again once this few days of eligibility are left. */
export const GRACE_WARN_DAYS = 7;
export const NOTE_MIN = 15;

const DAY = 86_400_000;
const ms = (iso: string) => Date.parse(iso);

/** The cadence in force on a day: the latest version whose date had arrived. */
export function cadenceAt(versions: RefresherCadenceVersion[], at: number): RefresherCadenceVersion | null {
  return [...versions].filter((v) => ms(v.effectiveFrom) <= at).sort((a, b) => b.version - a.version)[0] ?? null;
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

/** The last moment the holder stays eligible without refreshing: the end, plus grace, or a documented extension if that is later. */
export function eligibleUntilOf(b: Pick<CertificationBadge, 'expiresAt' | 'graceDays'>, extensions: Pick<RefresherExtension, 'until'>[]): number | null {
  if (!b.expiresAt) return null;
  const grace = ms(b.expiresAt) + b.graceDays * DAY;
  const extended = extensions.map((x) => ms(`${x.until}T23:59:59.999Z`));
  return Math.max(grace, ...extended);
}

export type RefresherTier = 'upcoming' | 'due' | 'grace' | 'extended' | 'blocked';
/**
 * Where a certification stands as a refresher. `due` is inside the renewal window; `grace` is past the end but still eligible; `extended` is eligible only
 * because of a documented extension; `blocked` is past all of it (new work needing it is held).
 */
export function tierOf(b: Pick<CertificationBadge, 'expiresAt' | 'graceDays'>, extensions: Pick<RefresherExtension, 'until'>[], now: number, renewalDays: number): RefresherTier | null {
  if (!b.expiresAt) return null;
  const end = ms(b.expiresAt);
  const until = eligibleUntilOf(b, extensions) as number;
  if (now >= until) return 'blocked';
  if (now >= end) return extensions.length > 0 && now >= end + b.graceDays * DAY ? 'extended' : 'grace';
  if (end - now <= renewalDays * DAY) return 'due';
  if (end - now <= UPCOMING_DAYS * DAY) return 'upcoming';
  return null;
}

const TIER_RANK: Record<RefresherTier, number> = { blocked: 0, grace: 1, extended: 2, due: 3, upcoming: 4 };
/** Most urgent first; a safety-critical certification outranks an ordinary one in the same state, and within that the nearer date comes first. */
export function priorityOf(tier: RefresherTier, safetyCritical: boolean, untilMs: number): number[] {
  return [TIER_RANK[tier], safetyCritical ? 0 : 1, untilMs];
}
export const comparePriority = (a: number[], b: number[]) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

export const daysBetween = (a: number, b: number) => Math.ceil((b - a) / DAY);

export type CadenceProblem = 'months_range' | 'grace_range' | 'date_invalid' | 'date_in_past' | 'reason_required';
/** A new cadence needs a sensible length, a grace period that is not a way of avoiding refreshing, a date that has not passed, and the reason for the change. */
export function cadenceProblem(input: { months: number | null; graceDays: number; effectiveFrom: string; reason: string }, previousEffective: string | null, now: number): CadenceProblem | null {
  if (input.months !== null && (!Number.isInteger(input.months) || input.months < 1 || input.months > MAX_MONTHS)) return 'months_range';
  if (!Number.isInteger(input.graceDays) || input.graceDays < 0 || input.graceDays > MAX_GRACE_DAYS) return 'grace_range';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom) || Number.isNaN(ms(input.effectiveFrom))) return 'date_invalid';
  if (input.effectiveFrom < new Date(now).toISOString().slice(0, 10)) return 'date_in_past';
  if (previousEffective && input.effectiveFrom < previousEffective.slice(0, 10)) return 'date_in_past';
  if (input.reason.replace(/[^\p{L}\p{N}]/gu, '').length < NOTE_MIN) return 'reason_required';
  return null;
}

export type ExtensionProblem = 'date_invalid' | 'date_in_past' | 'too_long' | 'reason_required' | 'nothing_to_extend';
export function extensionProblem(input: { until: string; reason: string }, b: Pick<CertificationBadge, 'expiresAt' | 'graceDays'>, now: number): ExtensionProblem | null {
  if (!b.expiresAt) return 'nothing_to_extend';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.until) || Number.isNaN(ms(input.until))) return 'date_invalid';
  if (input.until < new Date(now).toISOString().slice(0, 10)) return 'date_in_past';
  if (ms(`${input.until}T23:59:59.999Z`) > ms(b.expiresAt) + (b.graceDays + MAX_EXTENSION_DAYS) * DAY) return 'too_long';
  if (input.reason.replace(/[^\p{L}\p{N}]/gu, '').length < NOTE_MIN) return 'reason_required';
  return null;
}
