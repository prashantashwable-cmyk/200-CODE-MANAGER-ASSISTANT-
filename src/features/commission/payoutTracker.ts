/**
 * The business-wide view of the commission ledger, pure (162). The ledger (`CommissionEntry`) is the one record every partner sees their own slice of;
 * nothing here is stored. This file only decides how the same entries are grouped (by what earned them), compared (this period against the one before it)
 * and flagged (an unusual spend, an entry out of line with its kind, an approved entry that has waited too long), so the repository and the screen read the
 * same judgement.
 *
 * Every threshold below is a placeholder business decision, flagged to Admin on the screen.
 */
import { days } from '@/features/sla/clock';
import { RULE_OF_REASON } from './rules';
import type { CommissionRuleId } from './rules';

export const STATUSES = ['projected', 'approved', 'paid', 'forfeited'] as const;
export type PayoutStatus = (typeof STATUSES)[number];

/** What earned the entry, in the groups Admin thinks in. */
export const CATEGORIES = ['capture', 'conversion', 'installation', 'qc', 'other'] as const;
export type PayoutCategory = (typeof CATEGORIES)[number];

const CATEGORY_OF_RULE: Record<CommissionRuleId, PayoutCategory> = {
  site_visit: 'capture',
  lead_qualified: 'capture',
  referral_bonus: 'capture',
  conversion: 'conversion',
  sales_close: 'conversion',
  install_pool: 'installation',
  qc_fee: 'qc',
};

/** The finer trigger: the rule that paid it, or the reason itself when no rate was involved (a monthly bonus, an exit settlement). */
export function triggerOf(reasonKey: string): string {
  return RULE_OF_REASON[reasonKey] ?? reasonKey.split('.').pop() ?? 'other';
}
export function categoryOf(reasonKey: string): PayoutCategory {
  const rule = RULE_OF_REASON[reasonKey];
  return rule ? CATEGORY_OF_RULE[rule] : 'other';
}

/** An approved entry that has waited this long for the payout run is worth a look (placeholder). */
export const APPROVED_WAIT = days(7);
/** A category is a spike when it is this many times the one before it and has risen by at least this much (placeholder). */
export const SPIKE_RATIO = 1.8;
export const SPIKE_MIN_RISE = 25_000;
/** One entry that makes up this much of a category's spend means the figure reads as a single large payout, not a pattern (placeholder). */
export const SINGLE_SHARE = 0.5;
/** An entry this many times the typical one of its kind is out of line (placeholder), once there are enough to call anything typical. */
export const OUTLIER_TIMES = 3;
export const OUTLIER_MIN_ENTRIES = 4;
/** A change needs at least this many entries behind the earlier period before it is read as a trend. */
export const TREND_MIN = 3;
export const PAGE = 20;

export type Trend = { dir: 'up' | 'down' | 'flat'; pct: number } | null;

/** The change from the period before, as a direction and a percentage; null when the earlier period is too thin to compare (never a made-up trend). */
export function trendOf(current: number, previous: number, previousCount: number): Trend {
  if (previousCount < TREND_MIN || previous <= 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { dir: Math.abs(pct) < 3 ? 'flat' : pct > 0 ? 'up' : 'down', pct: Math.abs(pct) };
}

export interface Window {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
}
export const PERIODS = ['7', '30', '90', 'all'] as const;
export type PeriodId = (typeof PERIODS)[number];

/** The period as [from, to) in ms, and the equal one just before it. `all` has nothing to compare against. */
export function windowOf(period: PeriodId, now: number): { from: number; to: number; prevFrom: number | null; prevTo: number | null } {
  if (period === 'all') return { from: 0, to: now + 1, prevFrom: null, prevTo: null };
  const len = days(Number(period));
  return { from: now - len, to: now + 1, prevFrom: now - 2 * len, prevTo: now - len };
}

export interface Spike {
  /** This period's spend over the one before it. */
  ratio: number;
  rise: number;
  /** One entry makes up most of it. */
  singleLarge: boolean;
}

export function spikeOf(current: number, previous: number, previousCount: number, largest: number): Spike | null {
  if (previousCount < 1 || previous <= 0) return null;
  const ratio = current / previous;
  if (ratio < SPIKE_RATIO || current - previous < SPIKE_MIN_RISE) return null;
  return { ratio: Math.round(ratio * 10) / 10, rise: current - previous, singleLarge: current > 0 && largest / current >= SINGLE_SHARE };
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length === 0 ? 0 : s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Entries out of line with the typical one of their own kind (a trigger with enough history to have a typical). */
export function outliersOf<T extends { id: string; amount: number; trigger: string }>(entries: T[]): { entry: T; typical: number }[] {
  const by = new Map<string, T[]>();
  for (const e of entries) by.set(e.trigger, [...(by.get(e.trigger) ?? []), e]);
  const out: { entry: T; typical: number }[] = [];
  for (const [, list] of by) {
    if (list.length < OUTLIER_MIN_ENTRIES) continue;
    const typical = median(list.map((x) => x.amount));
    if (typical <= 0) continue;
    for (const e of list) if (e.amount >= typical * OUTLIER_TIMES) out.push({ entry: e, typical });
  }
  return out;
}

export const isStaleApproved = (approvedSince: number, now: number): boolean => now - approvedSince >= APPROVED_WAIT;

export interface MoneyTotals {
  count: number;
  amount: number;
}
export const sum = (xs: { amount: number }[]): MoneyTotals => ({ count: xs.length, amount: xs.reduce((a, x) => a + x.amount, 0) });

/** Totals per currency: incompatible figures are never added together. A ledger with no currency on an entry is rupees. */
export function byCurrency<T extends { amount: number; currency?: string }>(entries: T[]): { currency: string; count: number; amount: number }[] {
  const m = new Map<string, MoneyTotals>();
  for (const e of entries) {
    const c = e.currency ?? 'INR';
    const cur = m.get(c) ?? { count: 0, amount: 0 };
    m.set(c, { count: cur.count + 1, amount: cur.amount + e.amount });
  }
  return [...m.entries()].map(([currency, v]) => ({ currency, ...v })).sort((a, b) => (a.currency === 'INR' ? -1 : b.currency === 'INR' ? 1 : a.currency.localeCompare(b.currency)));
}

export type AttentionKind = 'spike' | 'outlier' | 'stale_approved' | 'held';

/** CSV with the spec's columns; a cell that could be read as a formula is neutralised. */
export const csvCell = (v: string | number): string => {
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
