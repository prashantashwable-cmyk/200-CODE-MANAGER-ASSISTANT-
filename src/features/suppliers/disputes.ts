/**
 * Screen 117's dispute rules, pure. A supplier dispute is decided against the objective records (the order's terms, its
 * invoices, its payments), never on memory, and the decision has a real financial effect on those records. The resolution clock is
 * the shared SLA clock: a supplier who says it may stop taking AIEC's orders is answered sooner.
 */
import { days, elapsedRatio, severityForRatio } from '@/features/sla/clock';
import type { AlertSeverity, SupplierDisputeDecision, SupplierDisputeKind } from '@/data/types';

/** How long a dispute may stay open, from the day it was raised or contested again. */
export const DISPUTE_TARGET = days(7);
/** The shorter target when the supplier has said it may halt future orders. */
export const DISPUTE_HALT_TARGET = days(3);
/** A resolved dispute can still be contested by the supplier for this long. */
export const REOPEN_WINDOW = days(30);
/** A flaw found in AIEC's own process is looked at within this. */
export const PROCESS_REVIEW_TARGET = days(14);
export const NOTE_MIN = 8;
export const POSITION_MIN = 15;

export const targetOf = (threatensHalt: boolean): number => (threatensHalt ? DISPUTE_HALT_TARGET : DISPUTE_TARGET);
export const dueAtOf = (roundStartedAt: string, threatensHalt: boolean): string => new Date(new Date(roundStartedAt).getTime() + targetOf(threatensHalt)).toISOString();

export type SlaState = 'on_track' | 'due_soon' | 'overdue' | 'resolved';
export function slaOf(status: 'open' | 'resolved', roundStartedAt: string, threatensHalt: boolean, now: number): { state: SlaState; severity: AlertSeverity | null } {
  if (status === 'resolved') return { state: 'resolved', severity: null };
  const ratio = elapsedRatio(roundStartedAt, targetOf(threatensHalt), now);
  return { state: ratio >= 1 ? 'overdue' : ratio >= 0.75 ? 'due_soon' : 'on_track', severity: severityForRatio(ratio) };
}

export type DisputeProblem = 'note_required' | 'amount_required' | 'amount_exceeds' | 'partial_not_allowed' | 'partial_needs_less' | 'nothing_left';

export interface DecisionFacts {
  kind: SupplierDisputeKind;
  /** What the supplier says it is owed in all; null when it did not say. */
  claimed: number | null;
  /** Already given to the supplier through earlier decisions on this dispute. */
  alreadyGiven: number;
}

/** What a "for the supplier" decision can give more of. Null means no limit was stated. */
export function maxAmountOf(f: DecisionFacts): number | null {
  return f.kind === 'amount' && f.claimed !== null ? Math.max(0, f.claimed - f.alreadyGiven) : null;
}

/** Partial only makes sense for a sum of money the supplier claims. */
export const canPartial = (kind: SupplierDisputeKind): boolean => kind === 'amount';

export function decisionProblem(input: { decision: SupplierDisputeDecision; amount: number; note: string }, f: DecisionFacts): DisputeProblem | null {
  if (input.note.trim().length < NOTE_MIN) return 'note_required';
  if (input.decision === 'uphold') return null;
  const max = maxAmountOf(f);
  if (input.decision === 'partial') {
    if (!canPartial(f.kind)) return 'partial_not_allowed';
    if (!(input.amount > 0)) return 'amount_required';
    if (max !== null && input.amount >= max) return 'partial_needs_less';
    return null;
  }
  // For the supplier in full: an amount dispute gives what is claimed (or what Admin names), the others give what they name.
  if (f.kind === 'amount') {
    if (max === 0) return 'nothing_left';
    const give = max ?? input.amount;
    if (!(give > 0)) return 'amount_required';
    if (max !== null && input.amount > max) return 'amount_exceeds';
  }
  return null;
}
