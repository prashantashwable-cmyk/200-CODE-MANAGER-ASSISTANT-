/** Screen 133 — QC Electrical & Safety Checklist. Types and translation keys only. */

import type { QcElecItemId } from '@/data/types';
import { ELEC_DEFS, ELEC_ITEMS } from '@/features/qc/electrical';

export type ElecStatus = 'loading' | 'ready' | 'error' | 'not_found';
export const POLL_MS = 15_000;
export const draftKey = (userId: string, jobId: string) => `aiec.qcElecDraft.${userId}.${jobId}`;
export const outboxKey = (userId: string) => `aiec.qcElecOutbox.${userId}`;
export const viewKey = (userId: string, jobId: string) => `aiec.qcElecView.${userId}.${jobId}`;
export const ITEM_IDS: QcElecItemId[] = ELEC_ITEMS;

export const FINAL_ERRORS = [
  'reading_incomplete', 'note_required', 'evidence_required', 'cannot_soften', 'unknown_item', 'not_inspector', 'not_ready', 'invalid_state', 'too_many_attachments',
  'captured_in_future', 'captured_invalid', 'forbidden', 'not_found', 'items_open', 'fail_open', 'video_too_large', 'video_too_long', 'wrong_kind', 'not_a_video', 'not_a_photo',
] as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const allChecks = [...new Set(ELEC_DEFS.flatMap((d) => d.checks))];
const allMeasures = [...new Set(ELEC_DEFS.flatMap((d) => d.measures.map((m) => m.key)))];

export const assignmentPath = (id: string) => `/qc-assignments/${id}`;
export const boardPath = '/qc-assignments';
export const mechanicalPath = (id: string) => `/qc-mechanical/${id}`;

export const ELEC_KEYS = {
  title: 'qcElec.title',
  loading: 'qcElec.loading',
  back: 'qcElec.back',
  offline: 'qcElec.offline',
  error: { title: 'qcElec.error.title', body: 'qcElec.error.body' },
  notFound: { title: 'qcElec.notFound.title', body: 'qcElec.notFound.body', action: 'qcElec.notFound.action' },
  problem: rec('qcElec.problem', [...FINAL_ERRORS, 'generic', 'offline'] as const),
  item: rec('qcElec.item', ITEM_IDS),
  itemHint: rec('qcElec.itemHint', ITEM_IDS),
  state: rec('qcElec.state', ['not_checked', 'pass', 'fail'] as const),
  verdict: rec('qcElec.verdict', ['pass', 'fail'] as const),
  measure: rec('qcElec.measure', allMeasures as readonly string[]),
  check: rec('qcElec.check', allChecks as readonly string[]),
  reference: { heading: 'qcElec.reference.heading', max: 'qcElec.reference.max', min: 'qcElec.reference.min', range: 'qcElec.reference.range', checks: 'qcElec.reference.checks', noSoft: 'qcElec.reference.noSoft', placeholder: 'qcElec.reference.placeholder' },
  block: { blocked: 'qcElec.block.blocked', awaiting: 'qcElec.block.awaiting', failing: 'qcElec.block.failing', open: 'qcElec.block.open', clear: 'qcElec.block.clear', note: 'qcElec.block.note' },
  form: {
    reading: 'qcElec.form.reading',
    yes: 'qcElec.form.yes',
    no: 'qcElec.form.no',
    intermittent: 'qcElec.form.intermittent',
    intermittentHint: 'qcElec.form.intermittentHint',
    forceFail: 'qcElec.form.forceFail',
    suggested: 'qcElec.form.suggested',
    notYet: 'qcElec.form.notYet',
    result: 'qcElec.form.result',
    note: 'qcElec.form.note',
    noteHint: 'qcElec.form.noteHint',
    noteOk: 'qcElec.form.noteOk',
    evidence: 'qcElec.form.evidence',
    evidenceHint: 'qcElec.form.evidenceHint',
    evidenceTrial: 'qcElec.form.evidenceTrial',
    addPhoto: 'qcElec.form.addPhoto',
    addVideo: 'qcElec.form.addVideo',
    remove: 'qcElec.form.remove',
    save: 'qcElec.form.save',
    retest: 'qcElec.form.retest',
    draftRestored: 'qcElec.form.draftRestored',
    toast: 'qcElec.form.toast',
    toastQueued: 'qcElec.form.toastQueued',
    notSent: 'qcElec.form.notSent',
  },
  history: { heading: 'qcElec.history.heading', attempt: 'qcElec.history.attempt', intermittent: 'qcElec.history.intermittent' },
  compare: { heading: 'qcElec.compare.heading', none: 'qcElec.compare.none', doneBy: 'qcElec.compare.doneBy', noPhotos: 'qcElec.compare.noPhotos' },
  rework: { open: 'qcElec.rework.open', status: rec('qcElec.rework.status', ['open', 'assigned', 'in_progress', 'ready_for_retest', 'disputed', 'verified', 'waived', 'withdrawn'] as const) },
  hero: { progress: 'qcElec.hero.progress', inspector: 'qcElec.hero.inspector', view: 'qcElec.hero.view', notAssigned: 'qcElec.hero.notAssigned', notReady: 'qcElec.hero.notReady', mechanical: 'qcElec.hero.mechanical', mechanicalOpen: 'qcElec.hero.mechanicalOpen', mechanicalLink: 'qcElec.hero.mechanicalLink' },
  signOff: {
    button: 'qcElec.signOff.button',
    done: 'qcElec.signOff.done',
    title: 'qcElec.signOff.title',
    body: 'qcElec.signOff.body',
    go: 'qcElec.signOff.go',
    back: 'qcElec.signOff.back',
    toast: 'qcElec.signOff.toast',
    waiting: rec('qcElec.signOff.waiting', ['items_open', 'fail_open'] as const),
    unsent: 'qcElec.signOff.unsent',
  },
  cancel: 'qcElec.cancel',
  alert: { fail: 'qcElec.alert.fail' },
} as const;
