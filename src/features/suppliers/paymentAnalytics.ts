/**
 * Screen 119's maths, pure. Supplier payment analytics keeps no data of its own: every figure is read off the
 * payments (111), retentions (100/118) and disputes (117) already recorded. What lives here is only how to say
 * "spike", "early look" and "worth a review" once, so the screen, its explanation and the alert can never disagree.
 */
import { APPROVAL_DUE_AFTER } from '@/features/suppliers/supplierPayments';
import { DISPUTE_TARGET } from '@/features/suppliers/disputes';

const DAY = 86_400_000;

/** Paying faster than this is "on time" for AIEC's own processing: the same two days Admin is given to act (111). */
export const PAYMENT_TARGET = APPROVAL_DUE_AFTER;
export const PAYMENT_TARGET_DAYS = Math.round(PAYMENT_TARGET / DAY);

/** A supplier with fewer payments than this is a new relationship: one slow first payment is not their rhythm yet. */
export const MIN_PAYMENTS = 3;
/** A dispute rate needs this many orders behind it before it can single a supplier out. */
export const MIN_ORDERS_FOR_RATE = 3;
/** Disputes needed before a rate can call a supplier an outlier. One dispute is an event, not a pattern. */
export const MIN_DISPUTES_FOR_FLAG = 2;
/** A supplier's dispute rate this many times the rest of the suppliers' is flagged. */
export const HIGH_DISPUTE_RATIO = 2;

/** A month is a spike at this multiple of a typical month, and at least the floor (both assumptions, stated on screen). */
export const SPIKE_RATIO = 1.8;
export const SPIKE_FLOOR = 100_000;
/** One order making up at least this share of a spike is what explains it. */
export const ONE_ORDER_SHARE = 0.5;
/** A month needs this many other months with spending before "typical" means anything. */
export const MIN_MONTHS_FOR_TYPICAL = 2;

export const NOTE_LABEL_MIN = 3;

export { monthKey, monthKeys, pctChange, previousWindow, trendOf, windowStart } from '@/features/logistics/deliveryAnalytics';
export type { Direction, TrendTone } from '@/features/logistics/deliveryAnalytics';

export const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const average = (values: number[]): number | null => (values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length);

/** One decimal, the precision a days figure deserves. */
export const oneDecimal = (n: number | null): number | null => (n === null ? null : Math.round(n * 10) / 10);

/* ------------------------------------------------------------------- spend */

/** Splits an amount across an order's lines by what each is worth, so a payment counts towards the right categories.
 *  The rounding remainder goes to the largest line so the parts always add up to the whole. */
export function allocateByLines(amount: number, lines: { category: string; value: number }[]): Record<string, number> {
  const total = lines.reduce((sum, l) => sum + l.value, 0);
  if (lines.length === 0 || total <= 0) return { other: amount };
  const out: Record<string, number> = {};
  let given = 0;
  const sorted = [...lines].sort((a, b) => b.value - a.value);
  for (const l of sorted) {
    const part = Math.floor((amount * l.value) / total);
    out[l.category] = (out[l.category] ?? 0) + part;
    given += part;
  }
  out[sorted[0].category] += amount - given;
  return out;
}

export interface SpikeReading {
  /** The month against a typical one. */
  ratio: number;
  typical: number;
}

/** Whether a month's spending stands well above the others'. Judged against the median of the *other* months that had any
 *  spending, so the spike itself cannot raise the bar it is measured against. */
export function spikeOf(key: string, totals: { key: string; total: number }[]): SpikeReading | null {
  const own = totals.find((m) => m.key === key);
  if (!own || own.total < SPIKE_FLOOR) return null;
  const others = totals.filter((m) => m.key !== key && m.total > 0).map((m) => m.total);
  if (others.length < MIN_MONTHS_FOR_TYPICAL) return null;
  const typical = median(others) ?? 0;
  if (typical <= 0 || own.total < typical * SPIKE_RATIO) return null;
  return { ratio: Math.round((own.total / typical) * 10) / 10, typical };
}

/** The share one order had of a month's spending, and whether that alone explains a spike. */
export const oneOrderExplains = (largest: number, total: number): boolean => total > 0 && largest / total >= ONE_ORDER_SHARE;

/* ------------------------------------------------------------------- speed */

/** Days from the milestone firing to the money leaving: what a supplier actually experiences. */
export const daysToPay = (triggeredAt: string, executedAt: string): number => Math.max(0, (new Date(executedAt).getTime() - new Date(triggeredAt).getTime()) / DAY);

export const withinTarget = (daysTaken: number): boolean => daysTaken * DAY <= PAYMENT_TARGET;

/** A supplier's average is an early look until they have been paid this often. */
export const isRatedSupplier = (paidCount: number): boolean => paidCount >= MIN_PAYMENTS;

/* ---------------------------------------------------------------- retention */

/** What was held at the end of a month: put in on or before it, and not yet decided by then. */
export function heldAt(retentions: { amount: number; heldAt: string; decidedAt?: string; status: string }[], monthEnd: number): number {
  return retentions
    .filter((r) => new Date(r.heldAt).getTime() <= monthEnd && !(r.decidedAt && new Date(r.decidedAt).getTime() <= monthEnd && (r.status === 'released' || r.status === 'withheld')))
    .reduce((sum, r) => sum + r.amount, 0);
}

export const endOfMonth = (key: string, now: number): number => {
  const [y, m] = key.split('-').map(Number);
  return Math.min(now, new Date(y, m, 1).getTime() - 1);
};

/* ----------------------------------------------------------------- disputes */

export type ReviewReason = 'high_rate' | 'halt_threat' | 'slow_resolution' | 'repeat_rounds';
export const REVIEW_REASONS: ReviewReason[] = ['high_rate', 'halt_threat', 'slow_resolution', 'repeat_rounds'];

export interface DisputeFacts {
  orders: number;
  disputes: number;
  openThreatensHalt: boolean;
  /** Days an open dispute has run in its current round, longest first. */
  openAgesDays: number[];
  resolutionDays: number[];
  maxRound: number;
}

export const ratePct = (disputes: number, orders: number): number | null => (orders <= 0 ? null : Math.round((disputes / orders) * 1000) / 10);

/** What the rest of the suppliers' disputes look like as one rate: the yardstick an outlier is held to. */
export const fleetRate = (rows: { orders: number; disputes: number }[]): number | null => {
  const orders = rows.reduce((s, r) => s + r.orders, 0);
  return orders <= 0 ? null : rows.reduce((s, r) => s + r.disputes, 0) / orders;
};

/** Why a supplier's relationship is worth a review, from disputes alone: nothing is guessed about the supplier's fault.
 *  A new relationship is never called out for a rate (too few orders), though a stated intention to halt always shows. */
export function reviewReasons(f: DisputeFacts, others: number | null): ReviewReason[] {
  const out: ReviewReason[] = [];
  if (f.orders >= MIN_ORDERS_FOR_RATE && f.disputes >= MIN_DISPUTES_FOR_FLAG) {
    const own = f.disputes / f.orders;
    // Nobody else has disputes: any pattern of them at this supplier stands out on its own.
    if (!others || own >= others * HIGH_DISPUTE_RATIO) out.push('high_rate');
  }
  if (f.openThreatensHalt) out.push('halt_threat');
  const slowOpen = f.openAgesDays.some((d) => d * DAY > DISPUTE_TARGET);
  const avg = average(f.resolutionDays);
  if (slowOpen || (avg !== null && f.resolutionDays.length >= 2 && avg * DAY > DISPUTE_TARGET)) out.push('slow_resolution');
  if (f.maxRound >= 2) out.push('repeat_rounds');
  return out;
}

/** The reasons that need their own beacon: a stated intention to halt already has one (117), so it is not raised twice. */
export const alertingReasons = (reasons: ReviewReason[]): ReviewReason[] => reasons.filter((r) => r !== 'halt_threat');
