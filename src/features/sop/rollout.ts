/**
 * The SOP rollout's rules, pure (159). A rollout is the announcement that a version of a governed procedure (the installation or delivery checklist, the
 * safety or quality checks, a reference document) is coming into force: who it is for, from which day, what changed, and whether a short quiz on only the
 * changed parts must be passed. It never changes the procedure itself (that stays where it is maintained); it makes the change reach, and be understood by,
 * the people who work to it. A correction is a new rollout that replaces the one before it, never an edit of what was already sent.
 *
 * THE NOTICE PERIOD, THE URGENT WINDOW AND THE LIMITS BELOW ARE PLACEHOLDER DECISIONS flagged to Admin on screen.
 */
import type { TrainingRole } from '@/data/types';
import type { SopSource } from '@/data/repository';

export const MIN_NOTICE_DAYS = 2;
export const URGENT_ACK_HOURS = 24;
export const SUMMARY_MIN = 20;
export const SUMMARY_MAX = 600;
export const REASON_MIN = 20;
export const MAX_QUESTIONS = 3;
export const QUESTION_MIN = 10;
export const OPTION_MAX = 4;
export const AWAY_MAX_DAYS = 90;
export const NOTE_MAX = 200;
export const REMIND_GAP_HOURS = 24;
export const ROLES: TrainingRole[] = ['technician', 'surveyor', 'supplier'];

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const today = (now: number) => new Date(now).toISOString().slice(0, 10);

/** Who works to a procedure unless Admin says otherwise: the field procedures are the technician's; a reference document may concern anyone. */
export function defaultRolesOf(source: SopSource): TrainingRole[] {
  return source === 'reference' ? ['technician', 'surveyor', 'supplier'] : ['technician'];
}

export interface RolloutQuestion { id: string; text: string; options: string[]; correct: number }
export interface RolloutInput {
  docId: string;
  version: number;
  roles: TrainingRole[];
  summary: string;
  effectiveDate: string;
  urgent: boolean;
  questions: { text: string; options: string[]; correct: number }[];
  reason?: string;
}
export type RolloutProblem =
  | 'doc_unknown' | 'version_unknown' | 'roles_required' | 'summary_required' | 'summary_long' | 'date_invalid' | 'notice_short' | 'already_announced'
  | 'question_invalid' | 'too_many_questions' | 'reason_required' | 'not_found' | 'superseded';

export function questionProblem(q: RolloutInput['questions'][number]): RolloutProblem | null {
  const options = q.options.map((o) => o.trim()).filter(Boolean);
  if (letters(q.text) < QUESTION_MIN) return 'question_invalid';
  if (options.length < 2 || options.length > OPTION_MAX) return 'question_invalid';
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return 'question_invalid';
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.filter((o) => o.trim()).length) return 'question_invalid';
  return null;
}

/** What is wrong with an announcement before it is sent, judged the same way by the screen and the repository. */
export function rolloutProblem(input: RolloutInput, ctx: { now: number; docKnown: boolean; versionKnown: boolean; taken: boolean; correction: boolean }): RolloutProblem | null {
  if (!ctx.docKnown) return 'doc_unknown';
  if (!ctx.versionKnown) return 'version_unknown';
  if (input.roles.length === 0) return 'roles_required';
  const s = letters(input.summary);
  if (s < SUMMARY_MIN) return 'summary_required';
  if (input.summary.trim().length > SUMMARY_MAX) return 'summary_long';
  if (ctx.correction && letters(input.reason ?? '') < REASON_MIN) return 'reason_required';
  if (!ctx.correction && ctx.taken) return 'already_announced';
  if (!input.urgent) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate) || Number.isNaN(Date.parse(input.effectiveDate))) return 'date_invalid';
    if (Date.parse(`${input.effectiveDate}T00:00:00Z`) < Date.parse(`${today(ctx.now)}T00:00:00Z`) + MIN_NOTICE_DAYS * 86_400_000) return 'notice_short';
  }
  if (input.questions.length > MAX_QUESTIONS) return 'too_many_questions';
  for (const q of input.questions) { const p = questionProblem(q); if (p) return p; }
  return null;
}

/** Where one partner stands. Seen is not understood: only a passed quiz (when there is one) and an explicit acknowledgement complete it. */
export type PartnerStatus = 'unseen' | 'seen' | 'quiz_passed' | 'complete';
export function partnerStatusOf(r: { seenAt?: string; acknowledgedAt?: string; quizPassedAt?: string }, requiresQuiz: boolean): PartnerStatus {
  if (r.acknowledgedAt && (!requiresQuiz || r.quizPassedAt)) return 'complete';
  if (requiresQuiz && r.quizPassedAt) return 'quiz_passed';
  return r.seenAt || r.acknowledgedAt ? 'seen' : 'unseen';
}

/** When the acknowledgement is due: at once for an urgent change (within the urgent window), otherwise the end of the effective day. */
export function dueAtOf(r: { urgent: boolean; effectiveDate: string; createdAt: string }): string {
  return r.urgent ? new Date(Date.parse(r.createdAt) + URGENT_ACK_HOURS * 3_600_000).toISOString() : new Date(`${r.effectiveDate}T17:00:00`).toISOString();
}

/** A normal rollout holds a technician from new work once it has taken effect, until they are caught up. An urgent one never blocks field operations. */
export function gatesWork(r: { urgent: boolean; effectiveDate: string; supersededById?: string | null }, now: number): boolean {
  return !r.urgent && !r.supersededById && r.effectiveDate <= today(now);
}

export interface Graded { passed: boolean; results: { correct: boolean; correctIndex: number }[] }
export function gradeQuiz(questions: RolloutQuestion[], answers: number[]): Graded {
  const results = questions.map((q, i) => ({ correct: answers[i] === q.correct, correctIndex: q.correct }));
  return { passed: results.every((r) => r.correct), results };
}

export type AwayProblem = 'date_invalid' | 'date_past' | 'date_far' | 'note_long';
export function awayProblem(until: string, note: string, now: number): AwayProblem | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until) || Number.isNaN(Date.parse(until))) return 'date_invalid';
  if (until < today(now)) return 'date_past';
  if (Date.parse(`${until}T00:00:00Z`) - Date.parse(`${today(now)}T00:00:00Z`) > AWAY_MAX_DAYS * 86_400_000) return 'date_far';
  if (note.length > NOTE_MAX) return 'note_long';
  return null;
}
