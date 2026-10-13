/**
 * Training feedback's rules, pure (160). A partner rates how clear and how relevant a training was and may say more; they may do it anonymously (what Admin
 * sees then carries no name), and they may say that something in it looks wrong or unsafe, which is a different thing from "could be clearer" and is put
 * in front of Admin at once. Admin reads what came in per training, never as a verdict on a handful of replies: a number says how many answered and out of
 * whom, and is not read as a trend until enough people have. A comment that is abusive can be hidden (its ratings still count), so honest criticism is
 * never discouraged.
 *
 * THE SAMPLE SIZE, THE REVIEW AND URGENT WINDOWS AND THE LIMITS BELOW ARE PLACEHOLDER DECISIONS flagged to Admin on screen.
 */

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const COMMENT_MAX = 1000;
/** A flag that something is wrong needs the partner's own words. */
export const SERIOUS_MIN = 15;
/** Fewer replies than this are individual notes, not a trend. */
export const MIN_RESPONSES = 5;
/** An average under this reads as a training that needs another look. */
export const LOW_AVERAGE = 3;
/** Routine feedback is read within this many days; a serious flag within the hours below (sooner for safety training). */
export const REVIEW_DUE_DAYS = 14;
export const URGENT_DUE_HOURS = 24;
export const SAFETY_DUE_HOURS = 4;
export const REASON_MIN = 10;
export const NOTE_MIN = 10;

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

export type FeedbackStatus = 'new' | 'reviewing' | 'addressed' | 'dismissed';
export const STATUSES: FeedbackStatus[] = ['new', 'reviewing', 'addressed', 'dismissed'];
export const isOpen = (s: FeedbackStatus) => s === 'new' || s === 'reviewing';

export type FeedbackProblem = 'rating_required' | 'comment_long' | 'comment_required' | 'target_unknown' | 'not_eligible' | 'not_found' | 'reason_required' | 'note_required' | 'invalid_state' | 'version_unknown';

export interface FeedbackInput {
  clarity: number;
  relevance: number;
  comment: string;
  anonymous: boolean;
  serious: boolean;
  target?: { lessonId?: string; questionId?: string } | null;
}

/** What is wrong with a reply before it is kept, judged the same way by the screen and the repository. */
export function feedbackProblem(i: FeedbackInput, ctx: { lessonIds: string[]; questionIds: string[] }): FeedbackProblem | null {
  const ok = (n: number) => Number.isInteger(n) && n >= RATING_MIN && n <= RATING_MAX;
  if (!ok(i.clarity) || !ok(i.relevance)) return 'rating_required';
  if (i.comment.trim().length > COMMENT_MAX) return 'comment_long';
  if (i.serious && letters(i.comment) < SERIOUS_MIN) return 'comment_required';
  if (i.target?.lessonId && !ctx.lessonIds.includes(i.target.lessonId)) return 'target_unknown';
  if (i.target?.questionId && !ctx.questionIds.includes(i.target.questionId)) return 'target_unknown';
  return null;
}

/** A stable pseudonym for "this person on this training", so a reply can be updated by its author without Admin ever seeing who they are. */
export function authorKeyOf(userKey: string, moduleId: string): string {
  let h = 5381;
  const s = `aiec-feedback:${userKey}:${moduleId}`;
  for (let k = 0; k < s.length; k += 1) h = ((h << 5) + h + s.charCodeAt(k)) >>> 0;
  return `fb-${h.toString(36)}`;
}

export interface Reply { clarity: number; relevance: number; version: number }
export interface Summary {
  n: number;
  clarity: number | null;
  relevance: number | null;
  completed: number;
  /** Replies as a share of the people who finished it (capped at 100%); null when nobody has. */
  rate: number | null;
  /** Enough replies for the averages to be read as a signal rather than as a few people's notes. */
  enough: boolean;
  low: boolean;
  perVersion: { version: number; n: number; clarity: number | null; relevance: number | null; enough: boolean }[];
}

const avg = (xs: number[]): number | null => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export function summaryOf(replies: Reply[], completed: number): Summary {
  const versions = [...new Set(replies.map((r) => r.version))].sort((a, b) => a - b);
  const clarity = avg(replies.map((r) => r.clarity));
  const relevance = avg(replies.map((r) => r.relevance));
  const enough = replies.length >= MIN_RESPONSES;
  return {
    n: replies.length, clarity, relevance, completed, rate: completed > 0 ? Math.min(100, Math.round((replies.length / completed) * 100)) : null, enough,
    low: enough && ((clarity ?? 5) < LOW_AVERAGE || (relevance ?? 5) < LOW_AVERAGE),
    perVersion: versions.map((v) => { const mine = replies.filter((r) => r.version === v); return { version: v, n: mine.length, clarity: avg(mine.map((r) => r.clarity)), relevance: avg(mine.map((r) => r.relevance)), enough: mine.length >= MIN_RESPONSES }; }),
  };
}

export function dueAtOf(serious: boolean, safetyCritical: boolean, createdAt: string): string {
  const ms = Date.parse(createdAt);
  return new Date(serious ? ms + (safetyCritical ? SAFETY_DUE_HOURS : URGENT_DUE_HOURS) * 3_600_000 : ms + REVIEW_DUE_DAYS * 86_400_000).toISOString();
}

export function handleProblem(status: FeedbackStatus, note: string, versionOk: boolean): FeedbackProblem | null {
  if (!STATUSES.includes(status) || status === 'new') return 'invalid_state';
  if ((status === 'addressed' || status === 'dismissed') && letters(note) < NOTE_MIN) return 'note_required';
  if (!versionOk) return 'version_unknown';
  return null;
}

export const moderationProblem = (hide: boolean, reason: string): FeedbackProblem | null => (hide && letters(reason) < REASON_MIN ? 'reason_required' : null);
