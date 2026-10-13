/**
 * The installation SOP's rules, pure (123). The procedure is central: it says what each step needs (which photos, which steps must come
 * first, which parts only apply to some configurations) and the job records what happened. The same rules are read by the screen (to
 * say why a step cannot be finished yet) and by the repository (to refuse it), so what the screen promises is what is enforced.
 */
import type { BuildingSpec, InstallSopApplicability, InstallSopSlot, InstallSopStepDef, JobStep } from '@/data/types';

/** A "not applicable" needs a reason someone can read later. */
export const NA_REASON_MIN = 8;

export type SpecFacts = Pick<BuildingSpec, 'powerBackup' | 'doorType'> | null;

/** Whether an applicability rule holds for this configuration. With the configuration unknown, everything applies: the safe side. */
export function appliesTo(a: InstallSopApplicability | undefined, spec: SpecFacts): boolean {
  if (!a || !spec) return true;
  return a.field === 'powerBackup' ? spec.powerBackup === a.equals : a.oneOf.includes(spec.doorType);
}

export const stepApplies = (def: InstallSopStepDef, spec: SpecFacts) => appliesTo(def.appliesWhen, spec);
export const slotsFor = (def: InstallSopStepDef, spec: SpecFacts): InstallSopSlot[] => def.slots.filter((s) => appliesTo(s.appliesWhen, spec));
export const requiredSlotsFor = (def: InstallSopStepDef, spec: SpecFacts): InstallSopSlot[] => slotsFor(def, spec).filter((s) => s.required);

/** Whether a step needs a photo at all, for this configuration. */
export const needsEvidence = (def: InstallSopStepDef, spec: SpecFacts) => requiredSlotsFor(def, spec).length > 0;

export const isDone = (s: Pick<JobStep, 'status'> | undefined) => s?.status === 'complete';

/** A step finished before evidence was kept in the app has only a count. It is taken as evidenced, never re-asked. */
const isLegacy = (s: JobStep) => s.evidence === undefined && s.evidenceCount > 0;

/** The required photos this step still lacks. */
export function missingSlots(def: InstallSopStepDef, step: JobStep, spec: SpecFacts): InstallSopSlot[] {
  if (isLegacy(step)) return [];
  // Proof is the newest capture that is neither replaced nor a finding; a documented exception (124) also answers a required photo.
  const have = new Set([...(step.evidence ?? []).filter((e) => !e.supersededAt && !e.finding).map((e) => e.slotId), ...(step.evidenceExceptions ?? []).map((e) => e.slotId)]);
  return requiredSlotsFor(def, spec).filter((s) => !have.has(s.id));
}

/** The steps this one waits for that are not done yet, in procedure order. */
export function unmetDependencies(def: InstallSopStepDef, steps: JobStep[]): string[] {
  return def.dependsOn.filter((id) => !isDone(steps.find((s) => s.id === id)));
}

export type CompletionProblem = 'depends_on' | 'evidence_missing' | 'materials_not_confirmed' | 'already_done';

export interface CompletionFacts {
  /** A signed delivery confirmation (104) says every part is on site. */
  materialsConfirmed: boolean;
}

/** Why a step cannot be marked done yet, or null when it can. The order is the order a person would want to hear it in. */
export function completionProblem(def: InstallSopStepDef, steps: JobStep[], spec: SpecFacts, facts: CompletionFacts): CompletionProblem | null {
  const step = steps.find((s) => s.id === def.id);
  if (!step) return 'depends_on';
  if (isDone(step)) return 'already_done';
  if (unmetDependencies(def, steps).length > 0) return 'depends_on';
  if (def.satisfiedByDelivery) return facts.materialsConfirmed ? null : 'materials_not_confirmed';
  if (missingSlots(def, step, spec).length > 0) return 'evidence_missing';
  return null;
}

export type NaProblem = 'not_allowed' | 'safety_step_applies' | 'reason_required' | 'already_done';

/** A step that genuinely does not apply is marked so, with a reason, and is distinct from one that applies and was skipped. A
 *  safety-critical step that does apply can never be marked this way. */
export function naProblem(def: InstallSopStepDef, step: JobStep | undefined, spec: SpecFacts, reason: string): NaProblem | null {
  if (!step) return 'not_allowed';
  if (isDone(step)) return 'already_done';
  const applies = stepApplies(def, spec);
  // The configuration says it does not apply: allowed, once someone confirms it with a reason, whatever the step is.
  // Otherwise only steps the procedure marks as optional may be set aside, and never a safety-critical one.
  if (applies) {
    if (!def.canBeNotApplicable) return 'not_allowed';
    if (def.safetyCritical) return 'safety_step_applies';
  }
  if (reason.trim().length < NA_REASON_MIN) return 'reason_required';
  return null;
}

/** The step to be doing next when nobody has picked: the first not done whose prerequisites are done, else the first not done. */
export function suggestedNext(defs: InstallSopStepDef[], steps: JobStep[]): string | null {
  const open = defs.filter((d) => !isDone(steps.find((s) => s.id === d.id)));
  return (open.find((d) => unmetDependencies(d, steps).length === 0) ?? open[0])?.id ?? null;
}

export interface QcReadiness {
  ready: boolean;
  /** Steps still to do. */
  open: string[];
  /** Steps marked done that are short of a required photo (only possible on old data), with the photos missing. */
  short: { stepId: string; slotIds: string[] }[];
}

/** Whether the whole checklist is finished with all its evidence, which is what "ready for QC" means. */
export function qcReadiness(defs: InstallSopStepDef[], steps: JobStep[], spec: SpecFacts): QcReadiness {
  const open = defs.filter((d) => !isDone(steps.find((s) => s.id === d.id))).map((d) => d.id);
  const short = defs
    .map((d) => ({ stepId: d.id, slotIds: missingSlots(d, steps.find((s) => s.id === d.id) as JobStep, spec).map((s) => s.id) }))
    .filter((x) => x.slotIds.length > 0 && isDone(steps.find((s) => s.id === x.stepId)) && !steps.find((s) => s.id === x.stepId)?.notApplicable);
  return { ready: open.length === 0 && short.length === 0, open, short };
}

/** The newest procedure version in force at `at`. */
export function versionInForce<V extends { version: number; effectiveFrom: string }>(versions: V[], at: number): V | null {
  return [...versions].filter((v) => new Date(v.effectiveFrom).getTime() <= at).sort((a, b) => b.version - a.version)[0] ?? null;
}

/** The evidence photo timestamps must be believable: not in the future, and not from before the job was even booked. */
export function capturedAtProblem(capturedAt: string, notBefore: string, now: number): 'in_future' | 'before_job' | 'invalid' | null {
  const t = new Date(capturedAt).getTime();
  if (Number.isNaN(t)) return 'invalid';
  if (t > now + 60_000) return 'in_future';
  if (t < new Date(notBefore).getTime()) return 'before_job';
  return null;
}
