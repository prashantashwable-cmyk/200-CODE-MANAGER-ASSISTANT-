import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '@/design-system';
import type { SopSlotView, SopStepView } from '@/data/repository';
import type { GeoPoint, JobEvidence } from '@/data/types';
import { FINDING_SLOT, EXCEPTION_REASON_MIN, FINDING_NOTE_MIN, evidenceProblem } from '@/features/technician/evidence';
import { currentPlace, prepareStill, prepareVideo } from '@/features/technician/mediaCapture';
import type { PreparedStill, PreparedVideo } from '@/features/technician/mediaCapture';
import { useSopWork } from '@/features/technician/useSopWork';
import type { DraftProblem } from './evidence-capture.types';
import { EVIDENCE_KEYS as K, evidencePath, sopPath } from './evidence-capture.types';

export type Prepared = PreparedStill | PreparedVideo;

export interface Draft {
  prepared: Prepared;
  takenAt: string;
  place?: GeoPoint;
  problem: DraftProblem | null;
}

/** Everything the lightbox needs to say about one capture. */
export interface Shot {
  evidence: JobEvidence;
  stepId: string;
  slotId: string;
  slotLabelKey: string | null;
  stepLabelKey: string;
  /** Only on this phone so far. */
  local: boolean;
}

export type EvidenceCaptureState = ReturnType<typeof useEvidenceCapture>;

/**
 * Screen 124. Capture is guided: the slot (or "a problem here") is chosen first, the technician is told what to capture and why, and the
 * result is reviewed before it is kept. Everything after that is the same queue the checklist uses, so a capture is on the phone with the
 * moment it was taken before any connection is asked for. Nothing is ever deleted: a retake replaces the proof and the earlier capture
 * stays in the record.
 */
export function useEvidenceCapture() {
  const work = useSopWork();
  const { jobId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [liveOff, setLiveOff] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [exceptionFor, setExceptionFor] = useState<{ step: SopStepView; slot: SopSlotView } | null>(null);
  const took = useRef(0);

  const view = work.view;
  const stepId = params.get('step');
  const slotId = params.get('slot');
  const step = view?.steps.find((s) => s.id === stepId) ?? null;
  const isFree = slotId === FINDING_SLOT;
  const slot = step && slotId && !isFree ? (step.slots.find((sl) => sl.id === slotId) ?? null) : null;
  const inProgress = view?.job.status === 'in_progress';
  const canCapture = !!step && !step.done && step.owner.isYou && inProgress && !step.satisfiedByDelivery;
  /** What is being captured, or null when the address does not name something that can be captured now. */
  const target = canCapture && (slot || isFree) ? { step: step as SopStepView, slot, free: isFree, kind: (slot?.kind ?? 'photo') as 'photo' | 'video' } : null;

  // A different target means a different capture: nothing carries over.
  useEffect(() => {
    setDraft(null);
    setProblem(null);
    took.current += 1;
  }, [stepId, slotId]);

  const open = (sId: string, slId: string) => navigate(evidencePath(jobId ?? '', sId, slId), { replace: false });
  const close = () => navigate(evidencePath(jobId ?? ''), { replace: true });
  const toChecklist = () => navigate(sopPath(jobId ?? ''));

  /** The next required slot of this step with neither proof nor explanation, after `afterSlotId`. */
  const nextMissing = useCallback(
    (from: SopStepView, afterSlotId: string | null) => {
      const rest = from.slots.filter((sl) => sl.required && !sl.photo && !sl.exception && sl.id !== afterSlotId);
      return rest[0] ?? null;
    },
    [],
  );

  /** A capture arrives (from the live viewfinder or the phone's camera app): make it small, look at it, and put it in front of the person. */
  const receive = async (file: File) => {
    if (!target) return;
    const mine = ++took.current;
    setPreparing(true);
    setProblem(null);
    const takenAt = new Date().toISOString();
    const placeP = currentPlace();
    try {
      const prepared: Prepared = target.kind === 'video' ? (file.type.startsWith('video/') ? await prepareVideo(file) : (() => { throw new Error('not_a_video'); })()) : (file.type.startsWith('image/') ? await prepareStill(file) : (() => { throw new Error('not_a_photo'); })());
      if (mine !== took.current) return;
      const found = evidenceProblem(target.slot ? target.kind : null, { kind: prepared.kind, mimeType: prepared.mimeType, sizeBytes: prepared.sizeBytes, durationS: prepared.kind === 'video' ? prepared.durationS : undefined, finding: target.free || undefined, note: 'x'.repeat(FINDING_NOTE_MIN) });
      setDraft({ prepared, takenAt, problem: found });
      void placeP.then((place) => place && mine === took.current && setDraft((d) => (d ? { ...d, place } : d)));
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      setProblem(code === 'not_a_video' || code === 'not_a_photo' ? code : 'unreadable');
    } finally {
      if (mine === took.current) setPreparing(false);
    }
  };

  const retake = () => {
    setDraft(null);
    setProblem(null);
  };

  /** Keeps the capture: queued with the moment it was taken. A capture for a slot with several to go moves on to the next one. */
  const keep = (asProblem: boolean, note: string) => {
    if (!target || !draft || draft.problem) return;
    const p = draft.prepared;
    const finding = asProblem || target.free;
    if (finding && note.trim().length < FINDING_NOTE_MIN) {
      setProblem('finding_note_required');
      return;
    }
    work.addEvidence(
      target.step.id,
      target.free ? FINDING_SLOT : (slotId as string),
      {
        kind: p.kind,
        fileName: p.fileName,
        previewUrl: p.previewUrl,
        ...(p.kind === 'video' ? { mediaUrl: p.mediaUrl, durationS: p.durationS } : {}),
        mimeType: p.mimeType,
        sizeBytes: p.sizeBytes,
        ...(draft.place ? { location: draft.place } : {}),
        ...(finding ? { finding: true } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      draft.takenAt,
    );
    push(t(finding ? K.toast.savedProblem : K.toast.saved), 'success');
    setDraft(null);
    setProblem(null);
    // The proof for this slot is in: the next one the step still needs, else back to the gallery.
    const next = !finding && !target.free ? nextMissing(target.step, slotId) : null;
    if (next) navigate(evidencePath(jobId ?? '', target.step.id, next.id), { replace: true });
    else navigate(evidencePath(jobId ?? ''), { replace: true });
  };

  const saveException = (reason: string): boolean => {
    if (!exceptionFor || reason.trim().length < EXCEPTION_REASON_MIN) return false;
    work.addException(exceptionFor.step.id, exceptionFor.slot.id, reason.trim());
    push(t(K.toast.exception), 'success');
    setExceptionFor(null);
    if (slotId === exceptionFor.slot.id) close();
    return true;
  };

  /** Every capture on the job, oldest step first, for the gallery and the lightbox's previous/next. */
  const shots: Shot[] = useMemo(() => {
    if (!view) return [];
    const pendingIds = work.local?.pendingEvidence ?? new Set<string>();
    return view.steps.flatMap((s) => [
      ...s.slots.flatMap((sl) => sl.history.map((e) => ({ evidence: e, stepId: s.id, slotId: sl.id, slotLabelKey: sl.labelKey, stepLabelKey: s.labelKey, local: pendingIds.has(e.id) }))),
      ...s.otherFindings.map((e) => ({ evidence: e, stepId: s.id, slotId: FINDING_SLOT, slotLabelKey: null, stepLabelKey: s.labelKey, local: pendingIds.has(e.id) })),
    ]);
  }, [view, work.local?.pendingEvidence]);

  const totals = useMemo(() => {
    const steps = view?.steps ?? [];
    const slots = steps.flatMap((s) => s.slots.filter((sl) => !s.notApplicable).map((sl) => ({ s, sl })));
    const required = slots.filter(({ sl }) => sl.required);
    const safety = required.filter(({ s }) => s.safetyCritical);
    const covered = (x: { sl: SopSlotView }) => !!x.sl.photo || !!x.sl.exception;
    return {
      proofs: slots.filter(({ sl }) => sl.photo).length,
      problems: view?.findings ?? 0,
      // Only what is yours to capture: an assistant is not told about the lead's steps.
      missing: required.filter((x) => !covered(x) && !x.s.done && x.s.owner.isYou).length,
      safetyCovered: safety.filter(covered).length,
      safetyTotal: safety.length,
      awaiting: view?.awaitingAdmin.length ?? 0,
    };
  }, [view]);

  return {
    ...work,
    jobId: jobId ?? '',
    target,
    step,
    canCapture,
    draft,
    preparing,
    problem,
    liveOff,
    setLiveOff,
    receive,
    retake,
    keep,
    open,
    close,
    toChecklist,
    lightbox,
    setLightbox,
    exceptionFor,
    openException: (s: SopStepView, sl: SopSlotView) => setExceptionFor({ step: s, slot: sl }),
    closeException: () => setExceptionFor(null),
    saveException,
    shots,
    totals,
    clearProblem: () => setProblem(null),
  };
}
