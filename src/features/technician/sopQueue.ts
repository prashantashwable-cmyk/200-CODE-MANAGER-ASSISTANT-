/**
 * Work done on site while the network is poor, pure (123). Every change to the checklist is written down on the phone first, with the
 * moment it was actually done, and sent when the network allows. The technician's physical progress never waits on a connection: this
 * lays the changes not yet sent over what the server last said, so the screen shows the work as done and marks it as not yet synced.
 */
import type { InstallationSopView, SopMediaInput, SopStepView } from '@/data/repository';
import type { JobEvidence } from '@/data/types';
import { FINDING_SLOT, EXCEPTION_REASON_MIN } from '@/features/technician/evidence';
import { NA_REASON_MIN } from '@/features/technician/installSop';

export type SopQueueItem = { id: string; jobId: string; capturedAt: string } & (
  | { kind: 'start' }
  | { kind: 'evidence'; stepId: string; slotId: string; media: Omit<SopMediaInput, 'capturedAt'> }
  | { kind: 'exception'; stepId: string; slotId: string; reason: string }
  | { kind: 'complete'; stepId: string }
  | { kind: 'na'; stepId: string; reason: string }
  | { kind: 'focus'; stepId: string }
);

/** A change as the screen describes it: the queue adds the id, the job and the moment it was done. */
export type SopQueueInput = SopQueueItem extends infer T ? (T extends unknown ? Omit<T, 'id' | 'jobId' | 'capturedAt'> : never) : never;

export interface LocalSop {
  view: InstallationSopView;
  /** Steps whose completion is only on this phone so far. */
  pendingSteps: Set<string>;
  /** `stepId:slotId` of captures and exceptions only on this phone so far. */
  pendingSlots: Set<string>;
  /** Ids of the captures only on this phone so far (`local-<queue id>`), for the per-item "not sent yet" mark. */
  pendingEvidence: Set<string>;
  pendingStart: boolean;
  /** Every step is done here, though the server has not heard it yet. */
  doneHere: boolean;
}

const isDone = (s: SopStepView) => s.done;

/** Recomputes what stops each step, from the steps' own state: the same three things the server checks. */
function recompute(steps: SopStepView[], inProgress: boolean): SopStepView[] {
  const done = new Set(steps.filter(isDone).map((s) => s.id));
  const labelOf = new Map(steps.map((s) => [s.id, s.labelKey]));
  return steps.map((s) => {
    if (s.done) return { ...s, problem: null, waitingFor: [], missingSlotIds: [] };
    const waiting = s.dependsOn.filter((id) => !done.has(id));
    const missing = s.slots.filter((sl) => sl.required && !sl.photo && !sl.exception).map((sl) => sl.id);
    let problem: SopStepView['problem'] = s.problem;
    if (!s.owner.isYou) problem = 'not_yours';
    else if (!inProgress) problem = s.problem === 'read_only' ? 'read_only' : 'not_started';
    else if (waiting.length > 0) problem = 'depends_on';
    else if (s.satisfiedByDelivery) problem = s.problem === 'materials_not_confirmed' ? 'materials_not_confirmed' : null;
    else if (!s.legacyEvidence && missing.length > 0) problem = 'evidence_missing';
    else problem = null;
    return { ...s, problem, waitingFor: waiting.map((id) => labelOf.get(id) ?? id), missingSlotIds: s.legacyEvidence ? [] : missing };
  });
}

/** The step in hand: keep the one already chosen if it is still open, else the first open one whose prerequisites are done. */
function pickCurrent(steps: SopStepView[], prefer: string | null): string | null {
  const open = steps.filter((s) => !s.done);
  const eligible = (s: SopStepView) => s.dependsOn.every((id) => steps.find((x) => x.id === id)?.done);
  if (prefer && open.some((s) => s.id === prefer)) return prefer;
  return (open.find(eligible) ?? open[0])?.id ?? null;
}

export function applyQueue(view: InstallationSopView, queue: SopQueueItem[], userName: string): LocalSop {
  const items = queue.filter((q) => q.jobId === view.job.id);
  let steps: SopStepView[] = view.steps.map((s) => ({ ...s, otherFindings: [...s.otherFindings], slots: s.slots.map((sl) => ({ ...sl, history: [...sl.history] })) }));
  let status = view.job.status;
  let canStart = view.canStart;
  let currentStepId = view.currentStepId;
  const pendingSteps = new Set<string>();
  const pendingSlots = new Set<string>();
  const pendingEvidence = new Set<string>();
  let pendingStart = false;

  for (const item of items) {
    if (item.kind === 'start') {
      if (status === 'scheduled' && canStart) {
        status = 'in_progress';
        canStart = false;
        pendingStart = true;
        steps = recompute(steps, true);
        currentStepId = pickCurrent(steps, currentStepId);
      }
      continue;
    }
    const step = steps.find((s) => s.id === item.stepId);
    if (!step || status !== 'in_progress') continue;
    if (item.kind === 'evidence') {
      if (step.done) continue;
      const local: JobEvidence = { ...item.media, id: `local-${item.id}`, slotId: item.slotId, capturedAt: item.capturedAt, byUserId: '', byName: userName };
      if (item.slotId === FINDING_SLOT) {
        if (!item.media.finding) continue;
        step.otherFindings.push(local);
      } else {
        const slot = step.slots.find((sl) => sl.id === item.slotId);
        if (!slot) continue;
        if (item.media.finding) {
          slot.history = [...slot.history, local];
        } else {
          slot.history = [...slot.history.map((e) => (e.id === slot.photo?.id ? { ...e, supersededAt: item.capturedAt } : e)), local];
          slot.photo = local;
          slot.exception = null;
        }
      }
      pendingSlots.add(`${item.stepId}:${item.slotId}`);
      pendingEvidence.add(local.id);
      steps = recompute(steps, true);
    } else if (item.kind === 'exception') {
      if (step.done || item.reason.trim().length < EXCEPTION_REASON_MIN) continue;
      const slot = step.slots.find((sl) => sl.id === item.slotId);
      if (!slot || !slot.required || slot.photo || slot.exception) continue;
      slot.exception = { slotId: item.slotId, reason: item.reason.trim(), byName: userName, at: item.capturedAt, acknowledged: false };
      pendingSlots.add(`${item.stepId}:${item.slotId}`);
      steps = recompute(steps, true);
    } else if (item.kind === 'complete') {
      if (step.done || step.problem !== null) continue;
      steps = steps.map((s) => (s.id === item.stepId ? { ...s, done: true, status: 'complete' as const, completedAt: item.capturedAt, completedByName: userName } : s));
      pendingSteps.add(item.stepId);
      steps = recompute(steps, true);
      currentStepId = pickCurrent(steps, currentStepId === item.stepId ? null : currentStepId);
    } else if (item.kind === 'na') {
      if (step.done || !step.canNotApplicable || item.reason.trim().length < NA_REASON_MIN) continue;
      steps = steps.map((s) => (s.id === item.stepId ? { ...s, done: true, status: 'complete' as const, completedAt: item.capturedAt, completedByName: userName, notApplicable: { reason: item.reason.trim(), byName: userName, at: item.capturedAt } } : s));
      pendingSteps.add(item.stepId);
      steps = recompute(steps, true);
      currentStepId = pickCurrent(steps, currentStepId === item.stepId ? null : currentStepId);
    } else if (item.kind === 'focus') {
      if (step.done || step.waitingFor.length > 0) continue;
      currentStepId = item.stepId;
    }
  }

  steps = steps.map((s) => (s.done ? s : { ...s, status: s.id === currentStepId ? ('current' as const) : s.status === 'blocked' ? s.status : ('upcoming' as const) }));
  const done = steps.filter((s) => s.done).length;
  return {
    view: {
      ...view,
      job: { ...view.job, status },
      steps,
      progress: { done, total: steps.length },
      currentStepId,
      canStart,
      awaitingAdmin: steps.flatMap((s) => (s.safetyCritical ? s.slots.filter((sl) => sl.exception && !sl.exception.acknowledged).map((sl) => ({ stepId: s.id, slotId: sl.id })) : [])),
      findings: steps.reduce((n, s) => n + s.otherFindings.length + s.slots.reduce((m, sl) => m + sl.history.filter((e) => e.finding).length, 0), 0),
    },
    pendingSteps,
    pendingSlots,
    pendingEvidence,
    pendingStart,
    doneHere: steps.length > 0 && done === steps.length,
  };
}

/** A photo straight off a phone camera is many megabytes: it is scaled down before it is written to the phone's storage, so a day's
 *  photos still fit while offline. Runs in the browser only. */
export async function shrinkPhoto(file: File, maxEdge = 1280, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('unreadable');
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}
