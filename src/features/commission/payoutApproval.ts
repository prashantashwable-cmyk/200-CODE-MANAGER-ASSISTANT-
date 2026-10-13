/**
 * The checkpoint before a worker payout is released, pure (163). The same pattern as the supplier payment approval (111): money is never moved on the strength of an
 * earned entry alone. A person looks at the exceptions and signs off; the routine ones can be cleared together. Nothing here is stored; the repository and the screen
 * read the same rules so a flag, a hold and a batch can never disagree.
 *
 * Every figure below is a placeholder business decision, flagged to Admin on the screen.
 */
import { days } from '@/features/sla/clock';

/** An entry with no flag and no more than this is routine and can be cleared in a batch. */
export const ROUTINE_LIMIT = 25_000;
/** Admin is asked to look at the queue within this long of the oldest entry arriving. */
export const APPROVE_DUE = days(2);
/** A hold is looked at again this long after it was put on, so nobody waits in silence. */
export const HOLD_REVIEW = days(7);
export const HOLD_REASON_MIN = 10;
export const EXPEDITE_REASON_MIN = 15;

export type QueueState = 'pending' | 'held' | 'cleared';

/** What a partner is told, in a kind and professional line, while their payout is held. The reason Admin wrote stays with Admin. */
export const HOLD_KINDS = ['quality', 'dispute', 'information', 'rule_check', 'other'] as const;
export type HoldKind = (typeof HOLD_KINDS)[number];

/** Things Admin should weigh before releasing a payout. Computed on read from the live records, never stored. */
export const FLAGS = ['open_snag', 'open_issue', 'open_dispute', 'damaged_parts', 'amount_high', 'amount_low', 'not_payable'] as const;
export type PayoutFlag = (typeof FLAGS)[number];
/** Flags that point at a related open record Admin can open; the rest are about the entry itself. */
export const RELATED_FLAGS: PayoutFlag[] = ['open_snag', 'open_issue', 'open_dispute', 'damaged_parts'];

export const isRoutine = (flags: PayoutFlag[], amount: number): boolean => flags.length === 0 && amount <= ROUTINE_LIMIT;

export type ApproveProblem = 'flags_unacknowledged' | 'reason_required' | 'not_pending' | 'already_decided';
export type HoldProblem = 'kind_invalid' | 'reason_required' | 'not_holdable';

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

/** A flagged payout can be released, but only by someone who has seen each flag; an urgent one also says why it cannot wait for the run. */
export function approveProblem(i: { flags: PayoutFlag[]; acknowledged: string[]; expedited: boolean; reason: string }): ApproveProblem | null {
  if (i.flags.some((f) => !i.acknowledged.includes(f))) return 'flags_unacknowledged';
  if (i.expedited && letters(i.reason) < EXPEDITE_REASON_MIN) return 'reason_required';
  return null;
}

export function holdProblem(i: { kind: string; reason: string }): HoldProblem | null {
  if (!(HOLD_KINDS as readonly string[]).includes(i.kind)) return 'kind_invalid';
  return letters(i.reason) < HOLD_REASON_MIN ? 'reason_required' : null;
}

/**
 * Where an entry stands in the queue. Only an entry the ledger calls approved is here at all. It is cleared only when Admin cleared exactly the amount now on it: an
 * amount changed afterwards (a judgement adjusting it) puts it back in front of Admin.
 */
export function stateOf(e: { status: string; amount: number; approval?: { status: 'approved' | 'held'; amount?: number } | undefined }): QueueState | null {
  if (e.status !== 'approved') return null;
  if (e.approval?.status === 'held') return 'held';
  if (e.approval?.status === 'approved' && e.approval.amount === e.amount) return 'cleared';
  return 'pending';
}

/** Why a batch skips an entry rather than clearing it: it is never cleared on Admin's behalf. */
export type SkipReason = 'flagged' | 'over_limit' | 'not_pending';
export function batchSkipReason(state: QueueState | null, flags: PayoutFlag[], amount: number): SkipReason | null {
  if (state !== 'pending') return 'not_pending';
  if (flags.length > 0) return 'flagged';
  return amount > ROUTINE_LIMIT ? 'over_limit' : null;
}
