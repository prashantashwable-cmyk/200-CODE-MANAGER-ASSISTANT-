/**
 * The training library's rules, pure (151). Which modules a person must do follows the roles they hold (so it changes when they take on another
 * role), a module can sit behind others it builds on, a module has versions (a change that matters sends earlier completions back to "update
 * needed"), and the safety modules a technician must finish are what decide whether they can be put on a job. The repository and the screens
 * read the same functions, so a status can never differ between them.
 */
import type { TrainingModule, TrainingModuleVersion, TrainingProgress, TrainingRole, TrainingTopic } from '@/data/types';

export const TOPICS: TrainingTopic[] = ['onboarding', 'safety', 'customer', 'product'];
export const ROLES: TrainingRole[] = ['surveyor', 'technician', 'supplier'];

export type ModuleStatus = 'not_started' | 'in_progress' | 'completed' | 'update_needed';

const dayKey = (now: number) => new Date(now).toISOString().slice(0, 10);

/** The version in force today: the latest whose day has arrived. */
export function currentVersionOf(m: TrainingModule, now: number): TrainingModuleVersion {
  const today = dayKey(now);
  const live = m.versions.filter((v) => v.effectiveFrom <= today).sort((a, b) => b.version - a.version);
  return live[0] ?? m.versions[0];
}

/** Completed means completed on a version that still counts; an older one that no longer does is "update needed", never silently kept. */
export function statusOf(m: TrainingModule, p: TrainingProgress | undefined, now: number): ModuleStatus {
  if (!p) return 'not_started';
  if (p.status === 'in_progress') return 'in_progress';
  return p.version >= currentVersionOf(m, now).minVersion ? 'completed' : 'update_needed';
}

/** Completed on an earlier version that still counts: the partner is told what changed but is not sent back. */
export const updatedSince = (m: TrainingModule, p: TrainingProgress | undefined, now: number): boolean => !!p && p.status === 'completed' && p.version < currentVersionOf(m, now).version && p.version >= currentVersionOf(m, now).minVersion;

export const isDone = (s: ModuleStatus) => s === 'completed';

/** The modules that have to be finished before this one opens. */
export function lockedBy(m: TrainingModule, all: TrainingModule[], statusById: (id: string) => ModuleStatus): TrainingModule[] {
  return m.dependsOn.map((id) => all.find((x) => x.id === id)).filter((x): x is TrainingModule => !!x && x.status === 'published' && !isDone(statusById(x.id)));
}

export const requiredFor = (m: TrainingModule, roles: TrainingRole[]) => m.status === 'published' && m.requiredFor.some((r) => roles.includes(r));
export const relevantFor = (m: TrainingModule, roles: TrainingRole[]) => m.status === 'published' && m.relevantFor.some((r) => roles.includes(r));

export interface Curriculum {
  required: number;
  completed: number;
  inProgress: number;
  updateNeeded: number;
  percent: number;
  minutesLeft: number;
}
export function curriculumOf(modules: TrainingModule[], roles: TrainingRole[], statusById: (id: string) => ModuleStatus): Curriculum {
  const req = modules.filter((m) => requiredFor(m, roles));
  const st = req.map((m) => statusById(m.id));
  const completed = st.filter(isDone).length;
  return {
    required: req.length,
    completed,
    inProgress: st.filter((s) => s === 'in_progress').length,
    updateNeeded: st.filter((s) => s === 'update_needed').length,
    percent: req.length ? Math.round((completed / req.length) * 100) : 100,
    minutesLeft: req.filter((m) => !isDone(statusById(m.id))).reduce((n, m) => n + m.minutes, 0),
  };
}

/**
 * The structural link to real work: a technician can be put on a job only when every safety module that gates assignment is finished, and for a module
 * that has a test, passed (the certification the test issues). `certified` says whether the test, if there is one, is passed.
 */
export function jobGateOf(modules: TrainingModule[], roles: TrainingRole[], statusById: (id: string) => ModuleStatus, certified: (id: string) => boolean = () => true): { applies: boolean; cleared: boolean; missing: TrainingModule[] } {
  if (!roles.includes('technician')) return { applies: false, cleared: true, missing: [] };
  const missing = modules.filter((m) => m.gatesJobAssignment && requiredFor(m, ['technician']) && (!isDone(statusById(m.id)) || !certified(m.id)));
  return { applies: true, cleared: missing.length === 0, missing };
}

export const percentOfModule = (m: TrainingModule, p: TrainingProgress | undefined, s: ModuleStatus): number => (s === 'completed' ? 100 : s === 'in_progress' && p ? Math.min(99, Math.round((p.lessonsDone / Math.max(1, m.lessons)) * 100)) : 0);

export type StartProblem = 'locked' | 'not_for_you' | 'retired';
/** A module can be opened by someone it is shown to, once what it builds on is done. */
export function startProblem(m: TrainingModule, roles: TrainingRole[], locked: TrainingModule[]): StartProblem | null {
  if (m.status !== 'published') return 'retired';
  if (!relevantFor(m, roles)) return 'not_for_you';
  return locked.length > 0 ? 'locked' : null;
}
