/**
 * The rules for evidence captured on site, pure (124). Evidence is what proves the procedure was followed, so it is guided (a slot says
 * exactly what to capture and why), tagged by the machine (job, step, slot, moment) and never deleted: a retake supersedes the earlier
 * capture, it does not remove it. A capture that shows a problem is kept in full and is not the proof the step needs. What genuinely cannot
 * be captured is explained in writing rather than blocking the work. The screen and the repository read the same functions.
 */
import type { InstallSopSlot, JobEvidence, JobEvidenceException, JobStep } from '@/data/types';

/** A still stays small enough to keep on a phone; a video is short and capped, so a day's clips are not lost to a full disk. */
export const VIDEO_MAX_BYTES = 20_000_000;
export const VIDEO_MAX_SECONDS = 30;
/** Words that make a finding or an exception readable later. */
export const FINDING_NOTE_MIN = 8;
export const EXCEPTION_REASON_MIN = 15;
/** A finding not tied to one of the step's slots: "something else is wrong here". */
export const FINDING_SLOT = '_finding';

export type EvidenceProblem = 'wrong_kind' | 'video_too_large' | 'video_too_long' | 'finding_note_required' | 'finding_only' | 'not_a_video' | 'not_a_photo';

export interface EvidenceFacts {
  kind: 'photo' | 'video';
  mimeType: string;
  sizeBytes: number;
  durationS?: number;
  finding?: boolean;
  note?: string;
}

/** Whether a capture is acceptable for this slot, or why not. `slotKind` is null for a free finding. */
export function evidenceProblem(slotKind: InstallSopSlot['kind'] | null, facts: EvidenceFacts): EvidenceProblem | null {
  if (slotKind === null && !facts.finding) return 'finding_only';
  if (slotKind && facts.kind !== slotKind) return 'wrong_kind';
  if (facts.kind === 'photo' && !facts.mimeType.startsWith('image/')) return 'not_a_photo';
  if (facts.kind === 'video') {
    if (!facts.mimeType.startsWith('video/')) return 'not_a_video';
    if (facts.sizeBytes > VIDEO_MAX_BYTES) return 'video_too_large';
    if ((facts.durationS ?? 0) > VIDEO_MAX_SECONDS + 0.5) return 'video_too_long';
  }
  if (facts.finding && (facts.note ?? '').trim().length < FINDING_NOTE_MIN) return 'finding_note_required';
  return null;
}

export type ExceptionProblem = 'reason_required' | 'not_required' | 'already_evidenced' | 'already_excepted';

/** A required slot that has neither proof nor an exception may be excepted, with a real explanation. */
export function exceptionProblem(slot: InstallSopSlot, step: JobStep, reason: string): ExceptionProblem | null {
  if (!slot.required) return 'not_required';
  if (activeProofOf(step, slot.id)) return 'already_evidenced';
  if ((step.evidenceExceptions ?? []).some((e) => e.slotId === slot.id)) return 'already_excepted';
  if (reason.trim().length < EXCEPTION_REASON_MIN) return 'reason_required';
  return null;
}

/** The capture that counts as the proof for a slot: the newest that is neither replaced nor a finding. */
export function activeProofOf(step: Pick<JobStep, 'evidence'>, slotId: string): JobEvidence | null {
  const mine = (step.evidence ?? []).filter((e) => e.slotId === slotId && !e.supersededAt && !e.finding);
  return mine.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))[mine.length - 1] ?? null;
}

export const exceptionOf = (step: Pick<JobStep, 'evidenceExceptions'>, slotId: string): JobEvidenceException | null => (step.evidenceExceptions ?? []).find((e) => e.slotId === slotId) ?? null;

/** Everything captured for a slot, replaced ones and findings included, oldest first: the record never loses a capture. */
export const historyOf = (step: Pick<JobStep, 'evidence'>, slotId: string): JobEvidence[] => (step.evidence ?? []).filter((e) => e.slotId === slotId).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));

export type EvidenceState = 'proven' | 'excepted' | 'finding_only' | 'missing' | 'optional';

/** Where a slot stands. A slot with only a finding is still missing its proof: the defect was recorded, not the pass. */
export function slotState(slot: InstallSopSlot, step: JobStep): EvidenceState {
  if (activeProofOf(step, slot.id)) return 'proven';
  if (exceptionOf(step, slot.id)) return 'excepted';
  if (!slot.required) return 'optional';
  return historyOf(step, slot.id).some((e) => e.finding) ? 'finding_only' : 'missing';
}

/** How the framing guide is drawn over the viewfinder. Only a hint at what belongs in frame: it is never part of the picture. */
export type FrameShape = 'wide' | 'close' | 'tall' | 'panel';
const FRAMES: Record<string, FrameShape> = {
  shaft: 'tall', pit: 'wide', alignment: 'tall', mount: 'close', frame: 'wide', sensors: 'tall', panel: 'panel', earthing: 'close', governor: 'close', buffers: 'close', gear: 'close', alarm: 'panel', ard: 'panel', noload: 'wide', overload: 'panel', load: 'panel', final: 'wide',
};
export const frameOf = (slotId: string): FrameShape => FRAMES[slotId.split('.').pop() ?? ''] ?? 'wide';

/** A safety-critical exception is not simply accepted: Admin has to acknowledge it before the job goes to QC. */
export const exceptionNeedsAdmin = (safetyCritical: boolean) => safetyCritical;

/** The key that ties an exception to the alert raised for it. */
export const exceptionKey = (jobId: string, stepId: string, slotId: string) => `evex:${jobId}:${stepId}:${slotId}`;
export const findingKey = (evidenceId: string) => `evfind:${evidenceId}`;

/** A photo's compressed size, honestly: what a technician on a poor connection needs to know it will go through. */
export const kb = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);
