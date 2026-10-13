/** Screen 132 — QC Mechanical Checklist. Types and translation keys only. */

import type { QcMechItemId, QcVerdict } from '@/data/types';
import { MECH_ITEMS } from '@/features/qc/mechanical';

export type MechStatus = 'loading' | 'ready' | 'error' | 'not_found';
export const POLL_MS = 15_000;
export const draftKey = (userId: string, jobId: string) => `aiec.qcMechDraft.${userId}.${jobId}`;
export const outboxKey = (userId: string) => `aiec.qcMechOutbox.${userId}`;
export const viewKey = (userId: string, jobId: string) => `aiec.qcMechView.${userId}.${jobId}`;
export const ITEM_IDS: QcMechItemId[] = MECH_ITEMS;
export const VERDICTS: QcVerdict[] = ['pass', 'exception', 'fail'];

export const FINAL_ERRORS = [
  'reading_incomplete', 'note_required', 'evidence_required', 'override_reason_required', 'unknown_item', 'not_inspector', 'not_ready', 'invalid_state', 'too_many_attachments',
  'captured_in_future', 'captured_invalid', 'forbidden', 'not_found', 'items_open', 'exception_pending', 'fail_open', 'finding_open', 'video_too_large', 'video_too_long', 'wrong_kind', 'not_a_video', 'not_a_photo',
] as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const assignmentPath = (id: string) => `/qc-assignments/${id}`;
export const boardPath = '/qc-assignments';

export const MECH_KEYS = {
  title: 'qcMech.title',
  loading: 'qcMech.loading',
  back: 'qcMech.back',
  offline: 'qcMech.offline',
  error: { title: 'qcMech.error.title', body: 'qcMech.error.body' },
  notFound: { title: 'qcMech.notFound.title', body: 'qcMech.notFound.body', action: 'qcMech.notFound.action' },
  problem: rec('qcMech.problem', [...FINAL_ERRORS, 'generic', 'offline'] as const),
  item: rec('qcMech.item', ITEM_IDS),
  itemHint: rec('qcMech.itemHint', ITEM_IDS),
  state: rec('qcMech.state', ['not_checked', 'pass', 'exception_pending', 'exception_accepted', 'fail'] as const),
  verdict: rec('qcMech.verdict', VERDICTS),
  verdictHint: rec('qcMech.verdictHint', VERDICTS),
  measure: rec('qcMech.measure', ['rail_deviation', 'balance', 'vibration', 'jerk'] as const),
  reference: {
    heading: 'qcMech.reference.heading',
    upTo: 'qcMech.reference.upTo',
    range: 'qcMech.reference.range',
    levelling: 'qcMech.reference.levelling',
    rubric: 'qcMech.reference.rubric',
    placeholder: 'qcMech.reference.placeholder',
  },
  rubric: { 1: 'qcMech.rubric.1', 2: 'qcMech.rubric.2', 3: 'qcMech.rubric.3' } as Record<1 | 2 | 3, string>,
  form: {
    reading: 'qcMech.form.reading',
    floor: 'qcMech.form.floor',
    floorHint: 'qcMech.form.floorHint',
    suggested: 'qcMech.form.suggested',
    notYet: 'qcMech.form.notYet',
    result: 'qcMech.form.result',
    note: 'qcMech.form.note',
    noteHint: 'qcMech.form.noteHint',
    noteOk: 'qcMech.form.noteOk',
    override: 'qcMech.form.override',
    overrideHint: 'qcMech.form.overrideHint',
    evidence: 'qcMech.form.evidence',
    evidenceHint: 'qcMech.form.evidenceHint',
    addPhoto: 'qcMech.form.addPhoto',
    addVideo: 'qcMech.form.addVideo',
    remove: 'qcMech.form.remove',
    save: 'qcMech.form.save',
    recheck: 'qcMech.form.recheck',
    missing: 'qcMech.form.missing',
    draftRestored: 'qcMech.form.draftRestored',
    toast: 'qcMech.form.toast',
    toastQueued: 'qcMech.form.toastQueued',
    notSent: 'qcMech.form.notSent',
  },
  compare: { heading: 'qcMech.compare.heading', none: 'qcMech.compare.none', doneBy: 'qcMech.compare.doneBy', noPhotos: 'qcMech.compare.noPhotos', raise: 'qcMech.compare.raise', raiseTitle: 'qcMech.compare.raiseTitle', raiseBody: 'qcMech.compare.raiseBody', raiseLabel: 'qcMech.compare.raiseLabel', raiseGo: 'qcMech.compare.raiseGo', toastRaised: 'qcMech.compare.toastRaised' },
  finding: { heading: 'qcMech.finding.heading', by: 'qcMech.finding.by', waiting: 'qcMech.finding.waiting', explained: 'qcMech.finding.explained', accepted: 'qcMech.finding.accepted', explain: 'qcMech.finding.explain', explainTitle: 'qcMech.finding.explainTitle', explainLabel: 'qcMech.finding.explainLabel', explainGo: 'qcMech.finding.explainGo', accept: 'qcMech.finding.accept', toastExplained: 'qcMech.finding.toastExplained', toastAccepted: 'qcMech.finding.toastAccepted' },
  review: { heading: 'qcMech.review.heading', pending: 'qcMech.review.pending', accepted: 'qcMech.review.accepted', rejected: 'qcMech.review.rejected', accept: 'qcMech.review.accept', reject: 'qcMech.review.reject', rejectTitle: 'qcMech.review.rejectTitle', rejectLabel: 'qcMech.review.rejectLabel', rejectGo: 'qcMech.review.rejectGo', toastAccepted: 'qcMech.review.toastAccepted', toastRejected: 'qcMech.review.toastRejected', noteOptional: 'qcMech.review.noteOptional' },
  history: { heading: 'qcMech.history.heading', attempt: 'qcMech.history.attempt', overridden: 'qcMech.history.overridden' },
  rework: { open: 'qcMech.rework.open', status: rec('qcMech.rework.status', ['open', 'assigned', 'in_progress', 'ready_for_retest', 'disputed', 'verified', 'waived', 'withdrawn'] as const), note: 'qcMech.rework.note' },
  hero: { progress: 'qcMech.hero.progress', inspector: 'qcMech.hero.inspector', viewerLead: 'qcMech.hero.viewerLead', viewerAdmin: 'qcMech.hero.viewerAdmin', notAssigned: 'qcMech.hero.notAssigned', notReady: 'qcMech.hero.notReady' },
  signOff: {
    button: 'qcMech.signOff.button',
    done: 'qcMech.signOff.done',
    title: 'qcMech.signOff.title',
    body: 'qcMech.signOff.body',
    go: 'qcMech.signOff.go',
    back: 'qcMech.signOff.back',
    toast: 'qcMech.signOff.toast',
    waiting: rec('qcMech.signOff.waiting', ['items_open', 'exception_pending', 'fail_open', 'finding_open'] as const),
    unsent: 'qcMech.signOff.unsent',
  },
  cancel: 'qcMech.cancel',
  alert: { fail: 'qcMech.alert.fail' },
} as const;
