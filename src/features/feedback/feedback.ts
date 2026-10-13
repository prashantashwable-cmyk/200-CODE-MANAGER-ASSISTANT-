/**
 * Customer feedback, pure (177). A short, considerate ask at the right moment (not straight after a handover, before anyone has used the lift), ratings that stay specific (a weak dimension is never lost in a
 * glowing overall score), a person called out in a comment routed correctly whether it is thanks or a serious concern, and a customer who is unhappy always reached by a person. **Every timing, threshold and weight is a
 * placeholder for the owner to confirm, flagged on screen.**
 */
import { days, hours } from '@/features/sla/clock';

export type Moment = 'handover' | 'ongoing' | 'visit';
export type Dimension = 'installation' | 'service' | 'communication' | 'timeliness' | 'value';
export const MOMENTS: Moment[] = ['handover', 'ongoing', 'visit'];
/** What is asked at each moment: only what the customer can have experienced by then. */
export const DIMENSIONS_FOR: Record<Moment, Dimension[]> = {
  handover: ['installation', 'communication', 'timeliness', 'value'],
  ongoing: ['service', 'communication', 'value'],
  visit: ['service', 'communication', 'timeliness'],
};
/** The installation question waits a day (so it is not asked in the middle of a handover); the "how is it going" question waits until there has been real use; a visit is asked about the next day. */
export const ASK_AFTER: Record<Moment, number> = { handover: days(1), ongoing: days(30), visit: days(1) };
/** A request lapses (it is history, not chased) this long after it became due. */
export const ASK_WINDOW = days(45);
export const NEGATIVE_AT = 2;
export const WEAK_AT = 2;
export const OUTREACH_DUE = hours(24);
export const WEAK_DUE = days(3);
export const MAX_COMMENT = 1000;
/** Customer ratings move a person's score with the weight of this many ratings already behind it, so a handful of ratings never swings it (placeholder). */
export const PRIOR_WEIGHT = 5;
/** A rating from fewer people than this is said to be an early look, not a trend. */
export const MIN_SAMPLE = 5;

export const requestIdOf = (moment: Moment, ref: string): string => `${moment}:${ref}`;
export function parseRequestId(id: string): { moment: Moment; ref: string } | null {
  const i = id.indexOf(':');
  const moment = id.slice(0, i) as Moment;
  return i > 0 && MOMENTS.includes(moment) && id.length > i + 1 ? { moment, ref: id.slice(i + 1) } : null;
}

/** When a request becomes due and when it lapses, from the day it is about. */
export const dueWindowOf = (moment: Moment, aboutAt: number): { from: number; until: number } => ({ from: aboutAt + ASK_AFTER[moment], until: aboutAt + ASK_AFTER[moment] + ASK_WINDOW });
export function availability(moment: Moment, aboutAt: number, now: number): 'not_yet' | 'due' | 'lapsed' {
  const w = dueWindowOf(moment, aboutAt);
  return now < w.from ? 'not_yet' : now > w.until ? 'lapsed' : 'due';
}

export type FeedbackProblem = 'overall_required' | 'rating_invalid' | 'dimension_unknown' | 'comment_long';
export function feedbackProblem(i: { moment: Moment; overall: number | null; dimensions: Partial<Record<Dimension, number>>; comment: string }): FeedbackProblem | null {
  const ok = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5;
  if (i.overall === null || i.overall === undefined) return 'overall_required';
  if (!ok(i.overall)) return 'rating_invalid';
  const allowed = DIMENSIONS_FOR[i.moment];
  for (const [k, v] of Object.entries(i.dimensions)) {
    if (!allowed.includes(k as Dimension)) return 'dimension_unknown';
    if (v !== undefined && !ok(v)) return 'rating_invalid';
  }
  if (i.comment.length > MAX_COMMENT) return 'comment_long';
  return null;
}

export type Flag = 'negative' | 'weak_dimension' | 'staff_concern';
export interface Flags { flags: Flag[]; weak: Dimension[]; sentiment: 'positive' | 'neutral' | 'negative' }
/** Which way a rating leans, and what a person must look at: an unhappy customer, a weak dimension behind a good overall, a named person in an unhappy comment. */
export function flagsOf(i: { overall: number; dimensions: Partial<Record<Dimension, number>>; mentioned: number }): Flags {
  const weak = (Object.entries(i.dimensions) as [Dimension, number][]).filter(([, v]) => v <= WEAK_AT).map(([k]) => k);
  const negative = i.overall <= NEGATIVE_AT;
  const flags: Flag[] = [];
  if (negative) flags.push('negative');
  if (!negative && weak.length > 0) flags.push('weak_dimension');
  // A named person is a concern only when the experience was poor: a good one that names someone is thanks, and a weak part of it is the business's to look at.
  if (negative && i.mentioned > 0) flags.push('staff_concern');
  return { flags, weak, sentiment: negative ? 'negative' : i.overall >= 4 ? 'positive' : 'neutral' };
}

/** Names of staff a comment mentions (a first name or full name of three letters or more, as a whole word); a person confirms, this only points. */
export function staffMentions(comment: string, staff: { id: string; name: string }[]): string[] {
  const hay = ` ${comment.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  const out: string[] = [];
  for (const s of staff) {
    const parts = s.name.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
    const full = s.name.toLowerCase().replace(/\s+/g, ' ');
    if (hay.includes(` ${full} `) || parts.some((p) => hay.includes(` ${p} `))) out.push(s.id);
  }
  return out;
}

/** A person's rating with customers' ratings blended in at a known weight, so a few ratings nudge it and many move it; with no baseline the customers' own average stands once there are enough. */
export function blendedRating(base: number, ratings: number[]): number {
  if (ratings.length === 0) return base;
  const sum = ratings.reduce((a, b) => a + b, 0);
  if (base <= 0) return ratings.length >= MIN_SAMPLE ? sum / ratings.length : 0;
  return (base * PRIOR_WEIGHT + sum) / (PRIOR_WEIGHT + ratings.length);
}

export const OUTREACH_NOTE_MIN = 15;
