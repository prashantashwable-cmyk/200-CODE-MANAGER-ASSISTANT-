/**
 * Getting a cleared payout into the partner's account, pure (164). The checkpoint (163) decides what may go out; this file only decides how: which method, in
 * what groups, when the weekly run is due, what the bank would answer and how a failure should be handled. Nothing here is stored, and the screen and the repository
 * read the same rules so a method, a group and a failure can never disagree.
 *
 * The banking partner is simulated (`railOutcome`): a real connector reports its own answer. Every figure below is a placeholder business decision, flagged to Admin
 * on the screen.
 */
import { isValidIfsc } from '@/features/onboarding/validators';
import { days, hours } from '@/features/sla/clock';

export const METHODS = ['bank_transfer', 'upi'] as const;
export type DisbursementMethod = (typeof METHODS)[number];
export const STATUSES = ['initiated', 'processing', 'completed', 'failed', 'cancelled'] as const;
export type DisbursementStatus = (typeof STATUSES)[number];
export const KINDS = ['scheduled', 'urgent', 'retry'] as const;
export type DisbursementKind = (typeof KINDS)[number];

/** One UPI payment cannot exceed this (placeholder, the rail's own limit); a bigger payout goes by bank transfer, or is split when only UPI is on file. */
export const UPI_LIMIT = 100_000;
/** How long the banking partner takes to answer, by method (placeholders for the simulation). */
export const SETTLE_MS: Record<DisbursementMethod, number> = { upi: 45_000, bank_transfer: 3 * 60_000 };
/** A failed or unfinished payout is looked at within this long (a partner is waiting on money they earned). */
export const ATTENTION_DUE = hours(24);
/** The weekly run, until Admin changes it (placeholders): Fridays at 11:00, a partner's cleared payouts sent together as one transfer. */
export const DEFAULT_SCHEDULE = { enabled: true, weekday: 5, hour: 11, consolidate: true } as const;
export const NOTE_MIN = 10;
export const PAGE = 20;
export const RUNS_SHOWN = 8;

/** What can go wrong. The first group needs the partner's details put right; the second is the bank or the system and is simply tried again. */
export const FAILURES = ['invalid_account', 'account_closed', 'bank_rejected', 'upi_invalid', 'limit_exceeded', 'bank_unavailable', 'interrupted'] as const;
export type FailureReason = (typeof FAILURES)[number];
const NEEDS_DETAILS: FailureReason[] = ['invalid_account', 'account_closed', 'bank_rejected', 'upi_invalid'];
export const needsDetails = (r: FailureReason | null | undefined): boolean => !!r && NEEDS_DETAILS.includes(r);

export type DetailsStatus = 'verified' | 'unverified';
export interface AccountFacts {
  upiId?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  /** What the bank would answer. A real connector reports this; the demo keeps it on the record so "closed since onboarding" can be shown. */
  simulatedBank?: 'ok' | 'closed' | 'rejected';
}

export const isValidUpi = (v: string): boolean => /^[a-zA-Z0-9._-]{2,40}@[a-zA-Z][a-zA-Z0-9]{1,20}$/.test(v.trim());
export const isValidAccountNumber = (v: string): boolean => /^\d{9,18}$/.test(v.trim());
export const hasBank = (a: AccountFacts | null | undefined): boolean => !!a && !!a.accountNumber && !!a.ifsc;
export const hasUpi = (a: AccountFacts | null | undefined): boolean => !!a && !!a.upiId;
/** Last four digits only: the full number never leaves the repository. */
export const maskAccount = (n: string): string => `•••• ${n.trim().slice(-4)}`;

export type DetailsProblem = 'nothing' | 'upi_invalid' | 'account_invalid' | 'ifsc_invalid' | 'incomplete_bank';
/** Whether details a person typed are in a usable shape (the bank still gets the last word). */
export function detailsProblem(i: { upiId?: string; accountNumber?: string; ifsc?: string }): DetailsProblem | null {
  const upi = (i.upiId ?? '').trim();
  const acc = (i.accountNumber ?? '').trim();
  const ifsc = (i.ifsc ?? '').trim();
  if (!upi && !acc && !ifsc) return 'nothing';
  if (upi && !isValidUpi(upi)) return 'upi_invalid';
  if (acc || ifsc) {
    if (!acc || !ifsc) return 'incomplete_bank';
    if (!isValidAccountNumber(acc)) return 'account_invalid';
    if (!isValidIfsc(ifsc)) return 'ifsc_invalid';
  }
  return null;
}

/** The method for one transfer of this size, from what is on file; `null` when nothing usable is. UPI is preferred (it is instant) while it fits its limit. */
export function methodFor(a: AccountFacts | null | undefined, amount: number): { method: DisbursementMethod } | { problem: 'no_details' | 'limit_exceeded' } {
  const upi = hasUpi(a);
  const bank = hasBank(a);
  if (!upi && !bank) return { problem: 'no_details' };
  if (upi && amount <= UPI_LIMIT) return { method: 'upi' };
  if (bank) return { method: 'bank_transfer' };
  return { problem: 'limit_exceeded' };
}

/** What the banking partner answers for this destination. Formats are checked first, then what the bank itself knows. */
export function railOutcome(a: AccountFacts | null | undefined, method: DisbursementMethod): { ok: true } | { ok: false; reason: FailureReason } {
  if (!a) return { ok: false, reason: 'invalid_account' };
  if (method === 'upi') return a.upiId && isValidUpi(a.upiId) ? (a.simulatedBank === 'closed' || a.simulatedBank === 'rejected' ? { ok: false, reason: 'upi_invalid' } : { ok: true }) : { ok: false, reason: 'upi_invalid' };
  if (!a.accountNumber || !isValidAccountNumber(a.accountNumber) || !a.ifsc || !isValidIfsc(a.ifsc)) return { ok: false, reason: 'invalid_account' };
  if (a.simulatedBank === 'closed') return { ok: false, reason: 'account_closed' };
  if (a.simulatedBank === 'rejected') return { ok: false, reason: 'bank_rejected' };
  return { ok: true };
}

/**
 * A partner's cleared entries as transfers. Consolidated, one transfer carries them all while it fits the method's limit (a single bigger entry goes alone); not
 * consolidated, one each. Entries are taken in the order earned so the oldest are never left behind.
 */
export function groupTransfers<T extends { id: string; amount: number }>(entries: T[], opts: { consolidate: boolean; limit: number | null }): T[][] {
  if (!opts.consolidate) return entries.map((e) => [e]);
  const out: T[][] = [];
  let cur: T[] = [];
  let sum = 0;
  for (const e of entries) {
    if (opts.limit !== null && cur.length > 0 && sum + e.amount > opts.limit) { out.push(cur); cur = []; sum = 0; }
    cur.push(e);
    sum += e.amount;
  }
  if (cur.length) out.push(cur);
  return out;
}

export interface ScheduleFacts { enabled: boolean; weekday: number; hour: number }
/** The most recent run time at or before `now` (local time), or null when switched off. */
export function lastSlot(s: ScheduleFacts, now: number): number {
  const d = new Date(now);
  const back = (d.getDay() - s.weekday + 7) % 7;
  const slot = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back, s.hour, 0, 0, 0).getTime();
  return slot <= now ? slot : slot - days(7);
}
export const nextSlot = (s: ScheduleFacts, now: number): number => {
  const d = new Date(lastSlot(s, now));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7, s.hour, 0, 0, 0).getTime();
};

export type ScheduleProblem = 'weekday_invalid' | 'hour_invalid';
export const scheduleProblem = (s: { weekday: number; hour: number }): ScheduleProblem | null => (!Number.isInteger(s.weekday) || s.weekday < 0 || s.weekday > 6 ? 'weekday_invalid' : !Number.isInteger(s.hour) || s.hour < 0 || s.hour > 23 ? 'hour_invalid' : null);

export type RetryProblem = 'not_failed' | 'details_unchanged' | 'in_flight' | 'blocked';
/** A transfer that failed for the partner's details cannot simply be sent again until the details are put right. */
export const retryProblem = (d: { status: DisbursementStatus; failure: FailureReason | null }, detailsChangedSince: boolean): RetryProblem | null => {
  if (d.status !== 'failed') return 'not_failed';
  if (needsDetails(d.failure) && !detailsChangedSince) return 'details_unchanged';
  return null;
};

export const csvCell = (v: string | number): string => {
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
