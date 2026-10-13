/**
 * The customer's payment picture, pure (174). A customer's simple question is "what do I owe and when", so a stage reads as one word they can act on: paid, being confirmed, due now,
 * late, still ahead, in question or refunded. Nothing here is stored; it is the same Payment rows 028 / 082 / 088 read, put in the order a customer thinks in.
 */
import type { BankTransaction, Payment, ReminderRuleStep } from '@/data/types';
import { daysOverdue, receivedAmountOf, remainingBalance } from '@/features/payments/aging';
import { days } from '@/features/sla/clock';

/** A stage is "due now" this many days before its date (the same window the customer's home uses: 171). */
export const PAY_WINDOW_DAYS = 14;
/** Financing is mentioned only when at least this much is still to pay (placeholder). */
export const LOAN_MIN_REMAINING = 100_000;
/** A bank credit is looked for this far back when a stage still shows unpaid (placeholder). */
export const BANK_LOOKBACK = days(14);
/** How many coming reminders are shown. */
export const REMINDERS_SHOWN = 2;

export type StageState = 'paid' | 'confirming' | 'overdue' | 'due' | 'upcoming' | 'disputed' | 'refunded';

export interface StageFacts { status: Payment['status']; dueDate: string; amount: number; amountReceived?: number }
export function stageStateOf(p: StageFacts, now: number, bank: boolean): { state: StageState; payable: boolean } {
  if (p.status === 'refunded') return { state: 'refunded', payable: false };
  if (p.status === 'paid') return { state: 'paid', payable: false };
  // Honest, never "overdue" for something already raised as a question.
  if (p.status === 'disputed') return { state: 'disputed', payable: false };
  if (p.status === 'pending' || bank) return { state: 'confirming', payable: false };
  const late = daysOverdue(p as Payment, now) > 0;
  if (late) return { state: 'overdue', payable: true };
  const soon = Date.parse(p.dueDate) - now <= days(PAY_WINDOW_DAYS);
  return soon ? { state: 'due', payable: true } : { state: 'upcoming', payable: false };
}

/** A bank credit that looks like this customer's money and that no record accounts for yet: evidence the payment arrived, never a claim that it is recorded. */
export function bankEvidenceFor(txns: BankTransaction[], p: Pick<Payment, 'amount' | 'amountReceived' | 'status'>, names: string[], recorded: { reference: string | null; amount: number; at: string | null }[], now: number): BankTransaction | null {
  const remaining = remainingBalance(p as Payment);
  if (remaining <= 0 || p.status === 'paid' || p.status === 'disputed' || p.status === 'refunded') return null;
  const wanted = names.map((n) => n.trim().toLowerCase()).filter((n) => n.length >= 4);
  if (wanted.length === 0) return null;
  return txns.find((b) => {
    if (b.direction !== 'credit' || b.amount <= 0 || b.amount > remaining) return false;
    const at = Date.parse(b.postedAt);
    if (!(at <= now && now - at <= BANK_LOOKBACK)) return false;
    const hay = `${b.narration} ${b.counterparty}`.toLowerCase();
    if (!wanted.some((n) => hay.includes(n))) return false;
    // Already accounted for: the same reference, or a recorded receipt of that amount near the same day.
    return !recorded.some((r) => (b.reference && r.reference === b.reference) || (r.amount === b.amount && r.at && Math.abs(Date.parse(r.at) - at) <= days(3)));
  }) ?? null;
}

export type HeroKind = 'overdue' | 'due' | 'confirming' | 'disputed' | 'upcoming' | 'complete' | 'empty';
export function heroOf(stages: { state: StageState; remaining: number; dueDate: string }[]): { kind: HeroKind; amount: number } {
  if (stages.length === 0) return { kind: 'empty', amount: 0 };
  const sum = (s: StageState[]) => stages.filter((x) => s.includes(x.state)).reduce((a, x) => a + x.remaining, 0);
  if (stages.some((x) => x.state === 'overdue')) return { kind: 'overdue', amount: sum(['overdue', 'due']) };
  if (stages.some((x) => x.state === 'due')) return { kind: 'due', amount: sum(['due']) };
  if (stages.some((x) => x.state === 'confirming')) return { kind: 'confirming', amount: sum(['confirming']) };
  if (stages.some((x) => x.state === 'disputed')) return { kind: 'disputed', amount: sum(['disputed']) };
  if (stages.some((x) => x.state === 'upcoming')) return { kind: 'upcoming', amount: sum(['upcoming']) };
  return { kind: 'complete', amount: 0 };
}

export type LoanState = 'hidden' | 'available' | 'in_progress' | 'approved' | 'disbursed';
/** Financing is offered as a quiet option: only while there is real money still to pay and nothing already underway, and never over a stage that is in question. */
export function loanStateOf(loanable: number, application: { status: string } | null): LoanState {
  if (application) {
    if (application.status === 'disbursed') return 'disbursed';
    if (application.status === 'approved') return 'approved';
    if (application.status === 'submitted' || application.status === 'under_review') return 'in_progress';
  }
  return loanable >= LOAN_MIN_REMAINING ? 'available' : 'hidden';
}

/** The next reminders the customer will get for a stage, from the one governed cadence: only messages (a call step is for AIEC's own team), only still ahead. */
export function remindersOf(steps: ReminderRuleStep[], dueDate: string, now: number, skip: (s: ReminderRuleStep) => boolean): { at: string; channel: ReminderRuleStep['channel'] }[] {
  const due = Date.parse(dueDate);
  return steps
    .filter((s) => s.escalationTier !== 'call_task' && !skip(s))
    .map((s) => ({ at: new Date(due + s.daysOffset * 86_400_000).toISOString().slice(0, 10), channel: s.channel }))
    .filter((r) => Date.parse(r.at) + 86_400_000 > now)
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, REMINDERS_SHOWN);
}

export { receivedAmountOf, remainingBalance };
