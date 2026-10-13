import type { Payment } from '@/data/types';

/**
 * Which of the receivables-aging buckets a payment stage falls in — the
 * single definition of "overdue" this app uses. Shared by the Financial
 * Overview screen (028) and the Payment Collection Dashboard (082) so the
 * two can never quietly define "overdue" two different ways; the spec for
 * 082 is explicit that any mismatch between them would be a data-integrity
 * bug, not an acceptable discrepancy.
 */
export type AgingBucket = 'current' | 'd30' | 'd60' | 'd90plus' | 'disputed';

export const AGING_BUCKETS: AgingBucket[] = ['current', 'd30', 'd60', 'd90plus', 'disputed'];

/** A single receivable this many times the median counts as an outlier. */
export const OUTLIER_MULTIPLE = 3;

/** A disputed payment still counts as money owed — a dispute pauses
 *  automated reminders/escalation for that stage, it doesn't forgive the
 *  amount or drop it from receivables. */
export function isOutstanding(payment: Payment): boolean {
  return payment.status === 'due' || payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'disputed';
}

export function daysOverdue(payment: Payment, now: number): number {
  return Math.floor((now - new Date(payment.dueDate).getTime()) / 86_400_000);
}

export function bucketFor(payment: Payment, now: number): AgingBucket {
  if (payment.status === 'disputed') return 'disputed';
  const overdue = daysOverdue(payment, now);
  if (overdue <= 0) return 'current';
  if (overdue <= 30) return 'd30';
  if (overdue <= 60) return 'd60';
  return 'd90plus';
}

/** What's left after any partial payment already received — never a forced
 *  all-or-nothing paid/unpaid state for a stage paid slightly short. */
export function remainingBalance(payment: Payment): number {
  return payment.amount - (payment.amountReceived ?? 0);
}

/** The actual amount collected on this one payment — its full amount once
 *  `'paid'`, or whatever partial amount has come in on a stage still
 *  open. Per-payment version of `computeCashIn`'s own rule — 088's own
 *  receipt list reads this directly rather than re-deriving it. */
export function receivedAmountOf(payment: Payment): number {
  return payment.status === 'paid' ? payment.amount : (payment.amountReceived ?? 0);
}

/** Money actually collected — a fully paid stage's full amount, plus any
 *  partial amount already received on a stage still open. The one
 *  definition of "cash in" both 028 and 082 read. */
export function computeCashIn(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + receivedAmountOf(p), 0);
}

/** Money still owed across every outstanding stage, net of any partial
 *  amount already received. The one definition of "total receivable" both
 *  028 and 082 read. */
export function computeTotalReceivable(payments: Payment[]): number {
  return payments.filter(isOutstanding).reduce((sum, p) => sum + remainingBalance(p), 0);
}
