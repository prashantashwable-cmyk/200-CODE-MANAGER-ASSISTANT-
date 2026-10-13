/**
 * The assessment's rules, pure (154). A partner is tested against the questions in force for the module version as it reads now, in an order that
 * differs every attempt; a pass issues the certification and nothing short of a pass does; a failed attempt earns a cooldown that grows with the
 * failures (enough to study again, too long to guess-spam), and several failures are a pattern Admin is told about as a chance to coach.
 *
 * THE PASS MARK, THE COOLDOWNS AND THE NUMBER OF FAILURES THAT COUNT AS A PATTERN ARE PLACEHOLDER BUSINESS DECISIONS, shown to Admin as such.
 */
import type { Assessment, AssessmentAnswer, AssessmentAttempt, AssessmentQuestion, CertificationBadge } from '@/data/types';

export const DEFAULT_PASS = 80;
export const DEFAULT_COOLDOWNS: [number, number, number] = [1, 4, 24];
export const PASS_MIN = 50;
export const PASS_MAX = 100;
export const COOLDOWN_MAX_H = 168;
/** This many failed attempts on the same version, with no pass, is a pattern worth a conversation. */
export const STRUGGLE_AT = 3;

/** The questions asked for this version of the module. */
export const questionsFor = (a: Pick<Assessment, 'questions'>, version: number): AssessmentQuestion[] => a.questions.filter((q) => q.sinceVersion <= version && (q.untilVersion === undefined || q.untilVersion > version));

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
/** A fixed order for one attempt that differs from other attempts, so a retake is not the same sheet read again. */
export const orderFor = (attemptKey: string, ids: string[]): string[] => [...ids].sort((a, b) => hash(`${attemptKey}:${a}`) - hash(`${attemptKey}:${b}`));

export function isCorrect(q: Pick<AssessmentQuestion, 'correct'>, selected: number[]): boolean {
  const a = [...new Set(selected)].sort();
  const b = [...q.correct].sort();
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export type AnswerProblem = 'none_chosen' | 'single_only' | 'out_of_range' | 'unknown_question';
export function answerProblem(q: AssessmentQuestion | undefined, selected: number[]): AnswerProblem | null {
  if (!q) return 'unknown_question';
  if (selected.length === 0) return 'none_chosen';
  if (selected.some((x) => !Number.isInteger(x) || x < 0 || x >= q.options)) return 'out_of_range';
  if (q.kind === 'single' && selected.length !== 1) return 'single_only';
  return null;
}

export interface Scored {
  correctCount: number;
  total: number;
  score: number;
  perQuestion: { questionId: string; selected: number[]; correct: boolean }[];
}
/** An unanswered question is a wrong one. */
export function scoreOf(questions: AssessmentQuestion[], answers: AssessmentAnswer[]): Scored {
  const perQuestion = questions.map((q) => {
    const selected = answers.find((a) => a.questionId === q.id)?.selected ?? [];
    return { questionId: q.id, selected, correct: selected.length > 0 && isCorrect(q, selected) };
  });
  const correctCount = perQuestion.filter((x) => x.correct).length;
  return { correctCount, total: questions.length, score: questions.length ? Math.round((correctCount / questions.length) * 100) : 0, perQuestion };
}

export const passedAt = (score: number, passPercent: number) => score >= passPercent;

/** Hours to wait after the Nth failed attempt on the same version. */
export const cooldownHoursFor = (cooldowns: [number, number, number], failedCount: number): number => (failedCount <= 0 ? 0 : cooldowns[Math.min(failedCount, 3) - 1]);

export function cooldownUntilOf(lastSubmittedAt: string | null, cooldowns: [number, number, number], failedCount: number): string | null {
  if (!lastSubmittedAt || failedCount <= 0) return null;
  return new Date(Date.parse(lastSubmittedAt) + cooldownHoursFor(cooldowns, failedCount) * 3_600_000).toISOString();
}

export const isStruggling = (failedCount: number, certified: boolean) => !certified && failedCount >= STRUGGLE_AT;

/** A badge counts while the version it was earned on still counts for the module (the same rule as the lessons). */
export const badgeValid = (b: Pick<CertificationBadge, 'version'> | undefined, minVersion: number) => !!b && b.version >= minVersion;

export type AssessmentState = 'none' | 'locked' | 'to_take' | 'in_progress' | 'cooldown' | 'certified';

export type ConfigProblem = 'pass_range' | 'cooldown_range';
export function configProblem(passPercent: number, cooldowns: number[]): ConfigProblem | null {
  if (!Number.isInteger(passPercent) || passPercent < PASS_MIN || passPercent > PASS_MAX) return 'pass_range';
  if (cooldowns.length !== 3 || cooldowns.some((h) => !Number.isFinite(h) || h < 0 || h > COOLDOWN_MAX_H)) return 'cooldown_range';
  return null;
}

export type AttemptKind = Pick<AssessmentAttempt, 'status' | 'passed'>;
export const failedCountOf = (attempts: AttemptKind[]) => attempts.filter((a) => a.status === 'submitted' && !a.passed).length;

/** Failures since the person last passed: a miss while renewing starts the waits again, it does not inherit misses from before they were certified. */
export function failsSinceLastPass(attempts: (AttemptKind & { submittedAt?: string })[]): number {
  const done = attempts.filter((a) => a.status === 'submitted').sort((x, y) => (x.submittedAt ?? '').localeCompare(y.submittedAt ?? ''));
  let n = 0;
  for (const a of done) n = a.passed ? 0 : n + 1;
  return n;
}

/** A certification can be renewed this long before it lapses, and the reminder starts then. */
export const RENEWAL_WINDOW_DAYS = 30;

export type BadgeStatus = 'valid' | 'expiring' | 'grace' | 'expired' | 'superseded' | 'retired';
/**
 * Where one certification stands. It was earned under the rules of its day and is kept in the record whatever happens to it: if the module has since been
 * revised past the version it was earned on, or retired, it reads as an earlier standard rather than disappearing. `grace` is past its end but the holder is
 * still eligible while they refresh; `expired` is past all of that. Only valid, expiring and grace count towards eligibility for work.
 */
export function badgeStatusOf(b: { version: number; expiresAt: string | null }, ctx: { minVersion: number; retired: boolean; now: number; eligibleUntil: number | null }): BadgeStatus {
  if (ctx.retired) return 'retired';
  if (b.version < ctx.minVersion) return 'superseded';
  if (b.expiresAt) {
    const left = Date.parse(b.expiresAt) - ctx.now;
    if (left > 0) return left <= RENEWAL_WINDOW_DAYS * 86_400_000 ? 'expiring' : 'valid';
    return ctx.eligibleUntil !== null && ctx.now < ctx.eligibleUntil ? 'grace' : 'expired';
  }
  return 'valid';
}
export const countsForWork = (s: BadgeStatus) => s === 'valid' || s === 'expiring' || s === 'grace';
export const daysLeftOf = (expiresAt: string | null, now: number): number | null => (expiresAt ? Math.ceil((Date.parse(expiresAt) - now) / 86_400_000) : null);
