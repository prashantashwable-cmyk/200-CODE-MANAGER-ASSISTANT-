/**
 * The safety compliance checklist's rules, pure (126). The checks are modelled on what the state lift inspector takes at the
 * pre-commissioning inspection, in the order they take it: the electrical work, then each safety device, then the trial runs, empty and
 * loaded. A failed check is the one kind of checklist failure a technician cannot wave through: it is fixed and retested (a minor
 * adjustment is a few minutes' work, not a rework assignment), or it goes to Admin, and only Admin with a named qualified engineer can
 * accept it as it stands. The screen and the repository read these same functions.
 *
 * The references given are the ones AIEC's own contract already cites (IS 14665 and the National Building Code). Clause-level references
 * belong to AIEC's qualified engineer to confirm: they are deliberately not invented here.
 */
import type { JobSafetyTest, SafetyItemDef, SafetyStateItem } from '@/data/types';
import { appliesTo } from '@/features/technician/installSop';
import type { SpecFacts } from '@/features/technician/installSop';

export const FAIL_NOTE_MIN = 8;
export const FIX_NOTE_MIN = 8;
export const READING_MIN = 8;
export const DISAGREEMENT_NOTE_MIN = 15;
export const OVERRIDE_REASON_MIN = 20;
export const RESOLUTION_NOTE_MIN = 15;
/** A check that has failed this many times is not one more fix away: Admin looks at it before it is tried again. */
export const MAX_FAILS = 3;

/** In the inspector's order. */
export const SAFETY_ITEMS: SafetyItemDef[] = [
  { id: 'wiring', kind: 'device', stepId: 's7', slots: ['s7.panel', 's7.earthing'], dependsOn: [] },
  { id: 'sensors', kind: 'device', stepId: 's6', slots: ['s6.sensors'], dependsOn: [], appliesWhen: { field: 'doorType', oneOf: ['automatic_centre', 'automatic_side'] } },
  { id: 'governor', kind: 'device', stepId: 's8', slots: ['s8.governor', 's8.gear'], dependsOn: ['wiring'] },
  { id: 'buffers', kind: 'device', stepId: 's8', slots: ['s8.buffers'], dependsOn: [] },
  { id: 'alarm', kind: 'device', stepId: 's8', slots: ['s8.alarm'], dependsOn: [] },
  { id: 'ard', kind: 'device', stepId: 's8', slots: ['s8.ard'], dependsOn: ['wiring'], appliesWhen: { field: 'powerBackup', equals: true } },
  { id: 'overload', kind: 'device', stepId: 's9', slots: ['s9.overload'], dependsOn: ['wiring'] },
  { id: 'noload', kind: 'trial', stepId: 's9', slots: ['s9.noload'], dependsOn: ['wiring', 'governor', 'buffers', 'sensors'] },
  { id: 'fullload', kind: 'trial', stepId: 's9', slots: ['s9.load'], dependsOn: ['noload', 'overload'] },
];

export const defOf = (id: string) => SAFETY_ITEMS.find((d) => d.id === id);

/** The standard checks that apply to this configuration (no automatic door, no door-sensor test; no power backup, no rescue device). */
export const itemsFor = (spec: SpecFacts): SafetyItemDef[] => SAFETY_ITEMS.filter((d) => appliesTo(d.appliesWhen, spec));

export type SafetyState = 'not_tested' | 'passed' | 'failed' | 'retest_due' | 'held' | 'in_review' | 'overridden';

const lastOf = (t: JobSafetyTest | undefined) => t?.attempts[t.attempts.length - 1];
const openHold = (t: JobSafetyTest | undefined) => t?.holds.find((h) => !h.releasedAt);
const openDisagreement = (t: JobSafetyTest | undefined) => (t?.disagreement && !t.disagreement.resolution ? t.disagreement : undefined);

/** Where one check stands. */
export function safetyState(t: JobSafetyTest | undefined): SafetyState {
  const last = lastOf(t);
  if (last?.result === 'pass') return 'passed';
  if (t?.override) return 'overridden';
  if (openHold(t)) return 'held';
  if (openDisagreement(t)) return 'in_review';
  if (!last) return 'not_tested';
  return last.fix ? 'retest_due' : 'failed';
}

/** Passed, or accepted by someone with the standing to accept it: the only two states that let the job move on. */
export const isCleared = (state: SafetyState): boolean => state === 'passed' || state === 'overridden';

export const failCount = (t: JobSafetyTest | undefined): number => (t?.attempts ?? []).filter((a) => a.result === 'fail').length;

export type SafetyProblem =
  | 'already_passed'
  | 'overridden'
  | 'held'
  | 'in_review'
  | 'fix_required'
  | 'evidence_missing'
  | 'depends_on'
  | 'note_required'
  | 'reading_required'
  | 'not_failed'
  | 'nothing_to_review';

export interface SafetyContext {
  /** Whether each evidence slot the check needs has proof (or an accepted explanation). */
  missingSlots: string[];
  /** The checks this one stands on that are not yet cleared. */
  unmetDeps: string[];
  requiresReading: boolean;
}

/** Why a result cannot be recorded for this check now, or null when it can. */
export function resultProblem(t: JobSafetyTest | undefined, result: 'pass' | 'fail', input: { measured?: string; note?: string }, ctx: SafetyContext): SafetyProblem | null {
  const state = safetyState(t);
  if (state === 'passed') return 'already_passed';
  if (state === 'overridden') return 'overridden';
  if (state === 'held') return 'held';
  if (state === 'in_review') return 'in_review';
  if (state === 'failed') return 'fix_required';
  if (ctx.unmetDeps.length > 0) return 'depends_on';
  if (result === 'fail') return (input.note ?? '').trim().length < FAIL_NOTE_MIN ? 'note_required' : null;
  if (ctx.missingSlots.length > 0) return 'evidence_missing';
  if (ctx.requiresReading && (input.measured ?? '').trim().length < READING_MIN) return 'reading_required';
  return null;
}

export function fixProblem(t: JobSafetyTest | undefined, note: string): SafetyProblem | 'note_required' | null {
  if (safetyState(t) !== 'failed') return 'not_failed';
  return note.trim().length < FIX_NOTE_MIN ? 'note_required' : null;
}

export function overrideProblem(t: JobSafetyTest | undefined, reason: string, engineerName: string): SafetyProblem | 'reason_required' | 'engineer_required' | null {
  const state = safetyState(t);
  if (state === 'passed') return 'already_passed';
  if (state === 'overridden') return 'overridden';
  // Only something that actually failed, or is stuck with Admin, can be accepted: an untested check is tested, not overridden.
  if (failCount(t) === 0 && state !== 'in_review') return 'not_failed';
  if (engineerName.trim().length < 3) return 'engineer_required';
  return reason.trim().length < OVERRIDE_REASON_MIN ? 'reason_required' : null;
}

export function disagreementProblem(t: JobSafetyTest | undefined, note: string): SafetyProblem | 'note_required' | null {
  const state = safetyState(t);
  if (state === 'passed') return 'already_passed';
  if (state === 'overridden') return 'overridden';
  if (openDisagreement(t)) return 'in_review';
  return note.trim().length < DISAGREEMENT_NOTE_MIN ? 'note_required' : null;
}

export interface Readiness {
  ready: boolean;
  open: string[];
  cleared: number;
  total: number;
}

/** Whether the whole checklist stands cleared: what "ready for QC" means for safety. */
export function readiness(ids: string[], tests: JobSafetyTest[]): Readiness {
  const stateOf = (id: string) => safetyState(tests.find((t) => t.itemId === id));
  const open = ids.filter((id) => !isCleared(stateOf(id)));
  return { ready: open.length === 0, open, cleared: ids.length - open.length, total: ids.length };
}

/** The label a state item is shown under. */
export const stateItemLabel = (i: Pick<SafetyStateItem, 'label'>) => i.label;
