/**
 * The lesson player's rules, pure (152). The screen and the repository read the same functions: how far a person may have played, which check
 * stands in the way, what counts as a correct answer, and when a lesson counts as genuinely finished. A lesson is finished by playing it through
 * and answering every check correctly, never by a clock reaching the end.
 */
import type { TrainingCheck, TrainingLesson, TrainingLessonProgress, TrainingModule, TrainingProgress } from '@/data/types';

export const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
/** A lesson is "played to the end" within this many seconds of its length (the last tick of a clock never lands exactly). */
export const END_SLACK_S = 1;

export const durationOf = (l: Pick<TrainingLesson, 'scenes'>) => l.scenes.reduce((n, s) => n + s.durationS, 0);

/** Second at which scene `i` starts. */
export const sceneStartS = (l: Pick<TrainingLesson, 'scenes'>, i: number) => l.scenes.slice(0, i).reduce((n, s) => n + s.durationS, 0);

/** Which scene the position is in (the last one at the very end). */
export function sceneIndexAt(l: Pick<TrainingLesson, 'scenes'>, positionS: number): number {
  let end = 0;
  for (let i = 0; i < l.scenes.length; i++) {
    end += l.scenes[i].durationS;
    if (positionS < end) return i;
  }
  return Math.max(0, l.scenes.length - 1);
}

/** The second at which a check appears: the end of the scene it follows. */
export const checkAtS = (l: Pick<TrainingLesson, 'scenes'>, c: Pick<TrainingCheck, 'afterScene'>) => sceneStartS(l, c.afterScene + 1);

export const clearedIds = (p: Pick<TrainingLessonProgress, 'checks'> | undefined): string[] => (p?.checks ?? []).filter((c) => !!c.clearedAt).map((c) => c.checkId);

/** The first check not yet answered correctly, in the order it appears. */
export function openCheckOf(l: TrainingLesson, cleared: string[]): TrainingCheck | null {
  return l.checks.filter((c) => !cleared.includes(c.id)).sort((a, b) => a.afterScene - b.afterScene)[0] ?? null;
}

/** How far playback may go: up to the first unanswered check, else to the end. Nobody can skip past a check by seeking or by letting time run. */
export function allowedFurthestS(l: TrainingLesson, cleared: string[]): number {
  const open = openCheckOf(l, cleared);
  return open ? checkAtS(l, open) : durationOf(l);
}

export const clampS = (v: number, max: number) => Math.max(0, Math.min(max, Number.isFinite(v) ? v : 0));

/** The same clamp the server applies to what a device reports. */
export function clampPlayback(l: TrainingLesson, cleared: string[], positionS: number, furthestS: number): { positionS: number; furthestS: number } {
  const cap = allowedFurthestS(l, cleared);
  const f = clampS(furthestS, cap);
  return { furthestS: f, positionS: clampS(positionS, f) };
}

/** Correct means exactly the right set, whatever order they were ticked in. */
export function isCorrect(c: Pick<TrainingCheck, 'correct'>, selected: number[]): boolean {
  const a = [...new Set(selected)].sort();
  const b = [...c.correct].sort();
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export type AnswerProblem = 'none_chosen' | 'single_only' | 'out_of_range';
export function answerProblem(c: Pick<TrainingCheck, 'kind' | 'options'>, selected: number[]): AnswerProblem | null {
  if (selected.length === 0) return 'none_chosen';
  if (selected.some((x) => !Number.isInteger(x) || x < 0 || x >= c.options)) return 'out_of_range';
  if (c.kind === 'single' && selected.length !== 1) return 'single_only';
  return null;
}

export type CompleteProblem = 'not_finished' | 'checks_open';
/** A lesson is finished once it has been played to its end and every check has been answered correctly. */
export function completeProblem(l: TrainingLesson, p: Pick<TrainingLessonProgress, 'furthestS' | 'checks'> | undefined): CompleteProblem | null {
  if (!p) return 'not_finished';
  if (openCheckOf(l, clearedIds(p))) return 'checks_open';
  if (p.furthestS < durationOf(l) - END_SLACK_S) return 'not_finished';
  return null;
}

/**
 * Is a lesson done for this person on the module as it reads now? Its own record counts when it was taken on a version that includes the lesson's
 * latest change. A person whose whole module was recorded as completed before lessons were kept one by one is covered by that completion: fully
 * while it still counts, and for the lessons that had not changed by the version they finished once it does not.
 */
export function lessonDone(l: TrainingLesson, own: TrainingLessonProgress | undefined, module: TrainingProgress | undefined, moduleCounts: boolean): boolean {
  if (own?.completedAt && own.version >= l.changedInVersion) return true;
  return !!module && module.status === 'completed' && (moduleCounts || module.version >= l.changedInVersion);
}

/** Done on an earlier version of the lesson, which has changed since: they are told what moved, not sent back (their module still counts). */
export function lessonUpdated(l: TrainingLesson, own: TrainingLessonProgress | undefined, module: TrainingProgress | undefined, moduleCounts: boolean): boolean {
  if (!lessonDone(l, own, module, moduleCounts)) return false;
  const took = own?.completedAt ? own.version : module?.version ?? l.changedInVersion;
  return l.changedInVersion > took;
}

export type LessonState = 'done' | 'current' | 'locked';
/** Lessons run in order: the first not done is where they are, later ones wait. */
export function lessonStates(lessons: TrainingLesson[], isDone: (l: TrainingLesson) => boolean): Record<string, LessonState> {
  const out: Record<string, LessonState> = {};
  let seenOpen = false;
  for (const l of [...lessons].sort((a, b) => a.order - b.order)) {
    if (isDone(l)) out[l.id] = 'done';
    else if (!seenOpen) { seenOpen = true; out[l.id] = 'current'; }
    else out[l.id] = 'locked';
  }
  return out;
}

export const hasLessons = (m: Pick<TrainingModule, 'id'>, lessons: TrainingLesson[]) => lessons.some((l) => l.moduleId === m.id);
