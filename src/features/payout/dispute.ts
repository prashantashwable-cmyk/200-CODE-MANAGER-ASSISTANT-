/**
 * A partner's dispute about a payout, pure (170). A dispute is a `PayoutQuery` (168) that says something looks wrong; this file decides what a good one contains, how long
 * Admin has, when a partner is told "still working on it", whether a re-ask adds anything, and when several disputes together point at the commission rules rather than
 * at one partner's entry. It mirrors the pattern of 117 (supplier payment disputes): one record, a target time, a documented decision, a correction through the ledger.
 *
 * Every number below is a placeholder business decision, flagged on the screen.
 */
import { days, hours } from '@/features/sla/clock';

export const TOPICS = ['amount_low', 'missing', 'wrong_rule', 'held_long', 'deduction', 'other'] as const;
export type Topic = (typeof TOPICS)[number];
export const KINDS = ['question', 'dispute'] as const;
export type Kind = (typeof KINDS)[number];

export const TEXT_MIN = 15;
export const EXPLAIN_MIN = 30;
export const REASON_MIN = 20;
export const UPDATE_MIN = 15;
export const SYSTEMIC_MIN = 20;
/** The first reply, then the answer, then how often a long one is reported on (placeholders). */
export const FIRST_RESPONSE = hours(24);
export const RESOLVE_TARGET = days(5);
export const ESCALATED_TARGET = days(7);
export const PROGRESS_EVERY = days(3);
/** A correction larger than this is not made from here without a second look (placeholder). */
export const CORRECTION_MAX = 100_000;
/** Several people asking about the same rule within this long is a pattern, not coincidence (placeholders). */
export const PATTERN_DAYS = 30;
export const PATTERN_MIN = 3;
export const PATTERN_PEOPLE = 2;
/** The broader review a systemic flag asks for is due this long after (placeholder). */
export const REVIEW_DUE = days(7);
/** Words this alike to the earlier ones are a repeat; anything else is read as new information. */
export const SAME_AS = 0.85;
/** How many others who may be affected are listed for the review. */
export const OTHERS_SHOWN = 20;
/** After a resolution the partner's heads-up stays on their list this long. */
export const RESULT_DAYS = 7;
export const PAGE = 20;

export const STATES = ['open', 'in_review', 'escalated', 'answered', 'resolved'] as const;
export type State = (typeof STATES)[number];
export const RESOLUTIONS = ['adjustment', 'explanation', 'withdrawn'] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

export type Problem =
  | 'text_short' | 'topic_missing' | 'claim_invalid' | 'same_words' | 'already_open' | 'not_found' | 'not_yours' | 'not_admin' | 'forbidden'
  | 'not_open' | 'explain_short' | 'reason_short' | 'update_short' | 'correction_invalid' | 'correction_too_large' | 'entry_not_payable' | 'already_resolved' | 'systemic_short' | 'no_review_needed' | 'outcome_missing' | 'rule_unknown' | 'already_flagged';

const letters = (s: string): number => (s.match(/\p{L}/gu) ?? []).length;
const words = (s: string): Set<string> => new Set(s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);

/** How alike two pieces of writing are, 0 to 1, by the words they share. */
export function similarity(a: string, b: string): number {
  const x = words(a);
  const y = words(b);
  if (x.size === 0 && y.size === 0) return 1;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared += 1;
  return shared / (x.size + y.size - shared);
}

export interface RaiseInput { topic: Topic | null; text: string; claimedAmount?: number | null; current: number }
export function raiseProblem(i: RaiseInput): Problem | null {
  if (!i.topic) return 'topic_missing';
  if (letters(i.text) < TEXT_MIN) return 'text_short';
  if (i.topic === 'amount_low') {
    if (i.claimedAmount === null || i.claimedAmount === undefined || !Number.isFinite(i.claimedAmount) || i.claimedAmount <= i.current) return 'claim_invalid';
  } else if (i.claimedAmount !== null && i.claimedAmount !== undefined && (!Number.isFinite(i.claimedAmount) || i.claimedAmount < 0)) return 'claim_invalid';
  return null;
}

/** Asking again after an answer: the same words are a repeat (the earlier answer is shown back); different words are read as new information. */
export function repeatOf(earlierTexts: string[], text: string): { same: boolean; similarity: number } | null {
  if (earlierTexts.length === 0) return null;
  const best = Math.max(...earlierTexts.map((t) => similarity(t, text)));
  return { same: best >= SAME_AS, similarity: Math.round(best * 100) / 100 };
}

export interface Clock { kind: Kind; raisedAt: string; lastPartnerAt: string; firstReplyAt: string | null; escalatedAt: string | null }
/** What Admin has to do by when: a question is answered; a dispute is first acknowledged, then resolved; an escalated one has its own longer target. */
export function dueAtOf(c: Clock): { first: string | null; resolve: string } {
  if (c.escalatedAt) return { first: null, resolve: new Date(Date.parse(c.escalatedAt) + ESCALATED_TARGET).toISOString() };
  if (c.kind === 'question') return { first: null, resolve: new Date(Date.parse(c.lastPartnerAt) + days(2)).toISOString() };
  return { first: c.firstReplyAt ? null : new Date(Date.parse(c.raisedAt) + FIRST_RESPONSE).toISOString(), resolve: new Date(Date.parse(c.raisedAt) + RESOLVE_TARGET).toISOString() };
}

export type Sla = 'on_track' | 'due_soon' | 'overdue' | 'done';
export function slaOf(dueAt: string, startedAt: string, now: number, resolved: boolean): Sla {
  if (resolved) return 'done';
  const due = Date.parse(dueAt);
  if (now > due) return 'overdue';
  const total = due - Date.parse(startedAt);
  return total > 0 && (now - Date.parse(startedAt)) / total >= 0.75 ? 'due_soon' : 'on_track';
}

export interface ProgressInput { now: number; state: State; kind: Kind; resolveDueAt: string; lastToldAt: string }
/** A long one is reported on: once its target has passed (or it is escalated), the partner hears every `PROGRESS_EVERY`, never silence. */
export function progressDue(i: ProgressInput): boolean {
  if (i.state === 'resolved' || i.state === 'answered' || i.kind !== 'dispute') return false;
  const late = i.now > Date.parse(i.resolveDueAt) || i.state === 'escalated';
  return late && i.now - Date.parse(i.lastToldAt) >= PROGRESS_EVERY;
}

export function explainProblem(text: string): Problem | null { return letters(text) < EXPLAIN_MIN ? 'explain_short' : null; }
export function reasonProblem(text: string): Problem | null { return letters(text) < REASON_MIN ? 'reason_short' : null; }
export function updateProblem(text: string): Problem | null { return letters(text) < UPDATE_MIN ? 'update_short' : null; }

/** A correcting entry adds money: the figure it ends at must be above what was recorded and, if the partner said what they expected, no more than that. */
export function correctionProblem(input: { current: number; to: number; claimed: number | null }): Problem | null {
  if (!Number.isFinite(input.to) || input.to <= input.current) return 'correction_invalid';
  if (input.claimed !== null && input.to > input.claimed) return 'correction_invalid';
  if (input.to - input.current > CORRECTION_MAX) return 'correction_too_large';
  return null;
}

export interface PatternInput { ruleId: string | null; partnerId: string; at: string; flagged: boolean }
/** Disputes in the window that trace to one rule, from at least `PATTERN_PEOPLE` people, `PATTERN_MIN` or more in all: a hint that the rule, not a person, is the cause. */
export function patternsOf(items: PatternInput[], now: number): { ruleId: string; count: number; people: number }[] {
  const from = now - days(PATTERN_DAYS);
  const byRule = new Map<string, PatternInput[]>();
  for (const i of items) if (i.ruleId && Date.parse(i.at) >= from) byRule.set(i.ruleId, [...(byRule.get(i.ruleId) ?? []), i]);
  return [...byRule.entries()]
    .map(([ruleId, list]) => ({ ruleId, count: list.length, people: new Set(list.map((l) => l.partnerId)).size }))
    .filter((p) => p.count >= PATTERN_MIN && p.people >= PATTERN_PEOPLE)
    .sort((a, b) => b.count - a.count);
}

export const medianDays = (spans: number[]): number | null => {
  if (spans.length < 3) return null;
  const s = [...spans].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return Math.round(((s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) / 86_400_000) * 10) / 10;
};
