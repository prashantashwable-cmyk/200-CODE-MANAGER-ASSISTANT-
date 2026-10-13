/** Screen 124 — Photo/Video Evidence Capture. Types and translation keys only. */

import type { EvidenceProblem } from '@/features/technician/evidence';

export type EvidenceStatus = 'loading' | 'ready' | 'error' | 'not_found';

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

/** The last part of a slot id (`s8.governor` → `governor`): what its guidance is filed under. */
export const SLOT_KEYS = ['shaft', 'pit', 'alignment', 'mount', 'frame', 'sensors', 'panel', 'earthing', 'governor', 'buffers', 'gear', 'alarm', 'ard', 'noload', 'overload', 'load', 'final'] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];
export const slotKeyOf = (slotId: string): SlotKey | null => {
  const last = slotId.split('.').pop() ?? '';
  return (SLOT_KEYS as readonly string[]).includes(last) ? (last as SlotKey) : null;
};

/** The refusals this screen has words for, apart from `generic`. */
export const PROBLEM_CODES = [
  'wrong_kind', 'video_too_large', 'video_too_long', 'finding_note_required', 'finding_only', 'not_a_video', 'not_a_photo', 'photo_too_large', 'unreadable',
  'reason_required', 'not_required', 'already_evidenced', 'already_excepted', 'already_done', 'not_yours', 'forbidden', 'not_found', 'read_only', 'job_on_hold', 'not_started', 'invalid_state',
  'captured_in_future', 'captured_before_job', 'captured_invalid', 'depends_on',
] as const;
export type ProblemCode = (typeof PROBLEM_CODES)[number];
export const isProblemCode = (c: string): c is ProblemCode => (PROBLEM_CODES as readonly string[]).includes(c);
/** Problems a capture can show before it is saved. */
export type DraftProblem = EvidenceProblem | 'unreadable';

export const jobPath = (id: string) => `/technician/jobs/${id}`;
export const sopPath = (id: string) => `/technician/jobs/${id}/sop`;
export const homePath = '/technician';
export const evidencePath = (jobId: string, stepId?: string, slotId?: string) => `/technician/jobs/${jobId}/evidence${stepId && slotId ? `?step=${stepId}&slot=${encodeURIComponent(slotId)}` : ''}`;

export const EVIDENCE_KEYS = {
  title: 'installEvidence.title',
  loading: 'installEvidence.loading',
  back: 'installEvidence.back',
  error: { title: 'installEvidence.error.title', body: 'installEvidence.error.body' },
  notFound: { title: 'installEvidence.notFound.title', body: 'installEvidence.notFound.body' },
  readOnly: { notStarted: 'installEvidence.readOnly.notStarted', closed: 'installEvidence.readOnly.closed', hold: 'installEvidence.readOnly.hold' },
  summary: {
    proofs: 'installEvidence.summary.proofs',
    problems: 'installEvidence.summary.problems',
    missing: 'installEvidence.summary.missing',
    safety: 'installEvidence.summary.safety',
    safetyValue: 'installEvidence.summary.safetyValue',
    awaiting: 'installEvidence.summary.awaiting',
  },
  sync: { offline: 'installEvidence.sync.offline', queued: 'installEvidence.sync.queued', syncing: 'installEvidence.sync.syncing', storage: 'installEvidence.sync.storage', videoRisk: 'installEvidence.sync.videoRisk' },
  failed: { title: 'installEvidence.failed.title', item: 'installEvidence.failed.item', dismiss: 'installEvidence.failed.dismiss' },
  capture: {
    heading: 'installEvidence.capture.heading',
    photo: 'installEvidence.capture.photo',
    video: 'installEvidence.capture.video',
    required: 'installEvidence.capture.required',
    optional: 'installEvidence.capture.optional',
    safety: 'installEvidence.capture.safety',
    what: 'installEvidence.capture.what',
    why: 'installEvidence.capture.why',
    framing: 'installEvidence.capture.framing',
    shutter: 'installEvidence.capture.shutter',
    record: 'installEvidence.capture.record',
    stop: 'installEvidence.capture.stop',
    recording: 'installEvidence.capture.recording',
    starting: 'installEvidence.capture.starting',
    cameraOff: 'installEvidence.capture.cameraOff',
    useApp: 'installEvidence.capture.useApp',
    useAppVideo: 'installEvidence.capture.useAppVideo',
    preparing: 'installEvidence.capture.preparing',
    earlier: 'installEvidence.capture.earlier',
    problemFor: 'installEvidence.capture.problemFor',
    close: 'installEvidence.capture.close',
    finishedStep: 'installEvidence.capture.finishedStep',
    limit: 'installEvidence.capture.limit',
  },
  review: {
    heading: 'installEvidence.review.heading',
    retake: 'installEvidence.review.retake',
    use: 'installEvidence.review.use',
    useProblem: 'installEvidence.review.useProblem',
    keepAnyway: 'installEvidence.review.keepAnyway',
    details: 'installEvidence.review.details',
    place: 'installEvidence.review.place',
    noPlace: 'installEvidence.review.noPlace',
    replaces: 'installEvidence.review.replaces',
    quality: rec('installEvidence.review.quality', ['blurry', 'dark', 'glare', 'unreadable'] as const),
    finding: { toggle: 'installEvidence.review.finding.toggle', hint: 'installEvidence.review.finding.hint', note: 'installEvidence.review.finding.note', noteHint: 'installEvidence.review.finding.noteHint' },
  },
  exception: {
    open: 'installEvidence.exception.open',
    title: 'installEvidence.exception.title',
    intro: 'installEvidence.exception.intro',
    safety: 'installEvidence.exception.safety',
    reason: 'installEvidence.exception.reason',
    hint: 'installEvidence.exception.hint',
    confirm: 'installEvidence.exception.confirm',
    awaiting: 'installEvidence.exception.awaiting',
    acknowledged: 'installEvidence.exception.acknowledged',
    told: 'installEvidence.exception.told',
  },
  gallery: {
    heading: 'installEvidence.gallery.heading',
    hint: 'installEvidence.gallery.hint',
    emptyTitle: 'installEvidence.gallery.emptyTitle',
    emptyBody: 'installEvidence.gallery.emptyBody',
    stepProgress: 'installEvidence.gallery.stepProgress',
    noSlots: 'installEvidence.gallery.noSlots',
    legacy: 'installEvidence.gallery.legacy',
    proof: 'installEvidence.gallery.proof',
    replaced: 'installEvidence.gallery.replaced',
    problem: 'installEvidence.gallery.problem',
    missing: 'installEvidence.gallery.missing',
    excepted: 'installEvidence.gallery.excepted',
    notSent: 'installEvidence.gallery.notSent',
    sending: 'installEvidence.gallery.sending',
    saved: 'installEvidence.gallery.saved',
    capture: 'installEvidence.gallery.capture',
    recapture: 'installEvidence.gallery.recapture',
    reportProblem: 'installEvidence.gallery.reportProblem',
    otherProblems: 'installEvidence.gallery.otherProblems',
    stepDone: 'installEvidence.gallery.stepDone',
    notApplicable: 'installEvidence.gallery.notApplicable',
    video: 'installEvidence.gallery.video',
  },
  lightbox: {
    label: 'installEvidence.lightbox.label',
    close: 'installEvidence.lightbox.close',
    prev: 'installEvidence.lightbox.prev',
    next: 'installEvidence.lightbox.next',
    of: 'installEvidence.lightbox.of',
    by: 'installEvidence.lightbox.by',
    taken: 'installEvidence.lightbox.taken',
    size: 'installEvidence.lightbox.size',
    place: 'installEvidence.lightbox.place',
    note: 'installEvidence.lightbox.note',
    replacedAt: 'installEvidence.lightbox.replacedAt',
    noVideo: 'installEvidence.lightbox.noVideo',
  },
  toast: { saved: 'installEvidence.toast.saved', savedProblem: 'installEvidence.toast.savedProblem', exception: 'installEvidence.toast.exception' },
  guide: rec('installEvidence.guide', ['shaft', 'pit', 'alignment', 'mount', 'frame', 'sensors', 'panel', 'earthing', 'governor', 'buffers', 'gear', 'alarm', 'ard', 'noload', 'overload', 'load', 'final', 'other'] as const),
  why: rec('installEvidence.why', ['shaft', 'pit', 'alignment', 'mount', 'frame', 'sensors', 'panel', 'earthing', 'governor', 'buffers', 'gear', 'alarm', 'ard', 'noload', 'overload', 'load', 'final', 'other'] as const),
  problem: rec('installEvidence.problem', [...PROBLEM_CODES, 'generic'] as const),
} as const;
