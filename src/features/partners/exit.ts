/**
 * Partner exit rules, pure (150). Leaving is never a switch: the work a partner holds is handed on, the money they are owed is worked out from the
 * records the app already keeps, and only then does their access end. The one exception is an exit for a serious violation, where access ends
 * first and the money is reviewed afterwards. Every number of days below is a placeholder business decision.
 */
import { days } from '@/features/sla/clock';

export const VOLUNTARY_REASONS = ['better_opportunity', 'relocating', 'personal', 'workload', 'earnings', 'inactive', 'other'] as const;
export const INVOLUNTARY_REASONS = ['fraud', 'safety_violation', 'conduct', 'repeated_quality'] as const;
export const INTERVIEW_REASONS = ['earnings', 'workload', 'support', 'tools', 'training', 'communication', 'better_opportunity', 'personal', 'other'] as const;
export const REASON_MIN = 20;
export const ACTION_NOTE_MIN = 8;
export const WITHHOLD_MIN = 20;
export const DISPUTE_MIN = 20;
export const DECISION_MIN = 20;
/** A planned last day may be at most this far ahead. */
export const LAST_DAY_MAX_DAYS = 60;
/** Work in hand should be handed on within this long of an involuntary exit starting, and by the last day otherwise. */
export const INVOLUNTARY_WORK_DUE = days(1);
export const SETTLEMENT_DUE = days(5);
export const PAY_DUE_AFTER_ACCESS = days(7);
export const DISPUTE_DECIDE_DUE = days(3);

export type ExitKindId = 'voluntary' | 'involuntary';
export const reasonsFor = (kind: ExitKindId): readonly string[] => (kind === 'involuntary' ? INVOLUNTARY_REASONS : VOLUNTARY_REASONS);

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

export type StartProblem = 'reason_invalid' | 'note_required' | 'last_day_invalid';
export function startProblem(input: { kind: ExitKindId; reason: string; note: string; lastDay: string }, todayKey: string, maxKey: string): StartProblem | null {
  if (!reasonsFor(input.kind).includes(input.reason)) return 'reason_invalid';
  if (letters(input.note) < REASON_MIN) return 'note_required';
  // An involuntary exit takes effect now: there is no waiting period to plan.
  if (input.kind === 'involuntary') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.lastDay) || input.lastDay < todayKey || input.lastDay > maxKey) return 'last_day_invalid';
  return null;
}

export type Blocker = 'work_open' | 'work_finishing' | 'settlement_missing' | 'settlement_disputed';
/** What still stands between a voluntary exit and the end of access. An involuntary exit has none: access ends first. */
export function blockersOf(input: { kind: ExitKindId; workOpen: number; finishing: number; settlement: 'none' | 'proposed' | 'agreed' | 'disputed' | 'paid' }): Blocker[] {
  if (input.kind === 'involuntary') return [];
  const out: Blocker[] = [];
  if (input.workOpen > 0) out.push('work_open');
  if (input.finishing > 0) out.push('work_finishing');
  if (input.settlement === 'none') out.push('settlement_missing');
  if (input.settlement === 'disputed') out.push('settlement_disputed');
  return out;
}

export type Stage = 'plan' | 'work' | 'settlement' | 'access' | 'interview' | 'done';
export const STAGES = ['plan', 'work', 'settlement', 'access', 'interview'] as const;

export type DecisionProblem = 'note_required' | 'amount_invalid';
/** What a decision on a settlement dispute may give: nothing, all of what was claimed beyond the figure, or part of it. */
export function decisionProblem(input: { outcome: 'uphold' | 'partner_favor' | 'partial'; amount?: number; note: string }, calculated: number, claimed: number): DecisionProblem | null {
  if (letters(input.note) < DECISION_MIN) return 'note_required';
  const extra = Math.max(0, claimed - calculated);
  if (input.outcome === 'partial' && !(typeof input.amount === 'number' && input.amount > 0 && input.amount < extra)) return 'amount_invalid';
  return null;
}
export const decidedExtra = (outcome: 'uphold' | 'partner_favor' | 'partial', amount: number | undefined, calculated: number, claimed: number): number =>
  outcome === 'uphold' ? 0 : outcome === 'partner_favor' ? Math.max(0, claimed - calculated) : Math.max(0, amount ?? 0);
