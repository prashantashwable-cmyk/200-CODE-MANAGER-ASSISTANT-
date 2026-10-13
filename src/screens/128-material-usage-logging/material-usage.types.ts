/** Screen 128 — Material Usage Logging. Types and translation keys only. */

import type { LeftoverAction, MaterialDeviationKind, MaterialSource } from '@/data/types';
import { DEVIATION_KINDS, LEFTOVER_ACTIONS } from '@/features/technician/materials';

export type MaterialStatus = 'loading' | 'ready' | 'error' | 'not_found';

export const POLL_MS = 20_000;
export const draftKey = (userId: string, jobId: string) => `aiec.materialDraft.${userId}.${jobId}`;
export const viewKey = (userId: string, jobId: string) => `aiec.materialView.${userId}.${jobId}`;

/** Categories offered for something that was not on the plan. `small_parts` is fasteners and the like, from the technician's own stock. */
export const EXTRA_CATEGORIES = ['small_parts', 'wiring', 'brackets', 'ropes', 'door_operator', 'controller', 'vfd', 'traction_machine', 'cabin', 'guide_rails', 'counterweight'] as const;
export const EXTRA_SOURCES: MaterialSource[] = ['stock', 'local_purchase'];
export const DEVIATION_IDS: MaterialDeviationKind[] = DEVIATION_KINDS;
export const LEFTOVER_IDS: LeftoverAction[] = LEFTOVER_ACTIONS;

/** Errors that will never succeed on a second try: reported, not retried. */
export const FINAL_ERRORS = [
  'row_invalid', 'quantity_invalid', 'over_quantity', 'deviation_required', 'reason_required', 'leftover_action_required', 'identifier_required', 'stock_not_allowed_for_major',
  'replacement_needs_reason', 'unknown_replaced_line', 'extra_needs_reason', 'line_missing', 'unknown_line', 'duplicate_line', 'not_lead', 'not_started', 'forbidden', 'not_found',
  'invalid_state', 'captured_in_future', 'captured_invalid',
] as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const homePath = '/technician';
export const boardPath = '/material-usage';
export const jobPath = (id: string) => `/technician/jobs/${id}`;
export const usagePath = (id: string) => `/material-usage/${id}`;
export const scorecardPath = (supplierId: string) => `/scorecard?supplierId=${supplierId}`;

export const MATERIAL_KEYS = {
  title: 'materialLog.title',
  boardTitle: 'materialLog.boardTitle',
  loading: 'materialLog.loading',
  back: 'materialLog.back',
  error: { title: 'materialLog.error.title', body: 'materialLog.error.body' },
  notFound: { title: 'materialLog.notFound.title', body: 'materialLog.notFound.body' },
  pick: { title: 'materialLog.pick.title', body: 'materialLog.pick.body', action: 'materialLog.pick.action' },
  empty: { title: 'materialLog.empty.title', body: 'materialLog.empty.body' },
  sync: { offline: 'materialLog.sync.offline', local: 'materialLog.sync.local', saved: 'materialLog.sync.saved', sending: 'materialLog.sync.sending', pendingConfirm: 'materialLog.sync.pendingConfirm', notSent: 'materialLog.sync.notSent' },
  problem: rec('materialLog.problem', [...FINAL_ERRORS, 'generic'] as const),
  category: rec('materialLog.category', ['small_parts'] as const),
  source: rec('materialLog.source', ['delivered', 'stock', 'local_purchase'] as const),
  sourceHint: rec('materialLog.sourceHint', ['stock', 'local_purchase'] as const),
  deviation: rec('materialLog.deviation', [...DEVIATION_IDS, 'substitute', 'extra_needed'] as const),
  leftover: rec('materialLog.leftover', LEFTOVER_IDS),
  leftoverHint: rec('materialLog.leftoverHint', LEFTOVER_IDS),
  state: rec('materialLog.state', ['on_site', 'awaiting_signature', 'in_transit', 'preparing', 'issue'] as const),
  mode: rec('materialLog.mode', ['planned', 'part', 'none'] as const),
  intro: { title: 'materialLog.intro.title', body: 'materialLog.intro.body' },
  status: { none: 'materialLog.status.none', draft: 'materialLog.status.draft', confirmed: 'materialLog.status.confirmed' },
  locked: { assistant: 'materialLog.locked.assistant', admin: 'materialLog.locked.admin', confirmed: 'materialLog.locked.confirmed', not_started: 'materialLog.locked.not_started' },
  plan: {
    heading: 'materialLog.plan.heading',
    subheading: 'materialLog.plan.subheading',
    ordered: 'materialLog.plan.ordered',
    unconfirmed: 'materialLog.plan.unconfirmed',
    noPlan: 'materialLog.plan.noPlan',
    answered: 'materialLog.plan.answered',
    howUsed: 'materialLog.plan.howUsed',
    usedQty: 'materialLog.plan.usedQty',
    leftoverQty: 'materialLog.plan.leftoverQty',
    remaining: 'materialLog.plan.remaining',
    remainingHint: 'materialLog.plan.remainingHint',
    reason: 'materialLog.plan.reason',
    reasonHint: 'materialLog.plan.reasonHint',
    reasonOk: 'materialLog.plan.reasonOk',
    why: 'materialLog.plan.why',
    leftoverAction: 'materialLog.plan.leftoverAction',
    reusable: 'materialLog.plan.reusable',
    replacedBy: 'materialLog.plan.replacedBy',
    addReplacement: 'materialLog.plan.addReplacement',
  },
  ids: {
    heading: 'materialLog.ids.heading',
    hintSerial: 'materialLog.ids.hintSerial',
    hintBatch: 'materialLog.ids.hintBatch',
    serial: 'materialLog.ids.serial',
    batch: 'materialLog.ids.batch',
    unit: 'materialLog.ids.unit',
    notLegible: 'materialLog.ids.notLegible',
    notLegibleHint: 'materialLog.ids.notLegibleHint',
    note: 'materialLog.ids.note',
    valid: 'materialLog.ids.valid',
    tooShort: 'materialLog.ids.tooShort',
  },
  extra: {
    heading: 'materialLog.extra.heading',
    intro: 'materialLog.extra.intro',
    add: 'materialLog.extra.add',
    remove: 'materialLog.extra.remove',
    what: 'materialLog.extra.what',
    whatHint: 'materialLog.extra.whatHint',
    category: 'materialLog.extra.category',
    source: 'materialLog.extra.source',
    qty: 'materialLog.extra.qty',
    kind: 'materialLog.extra.kind',
    kindSubstitute: 'materialLog.extra.kindSubstitute',
    kindExtra: 'materialLog.extra.kindExtra',
    replaces: 'materialLog.extra.replaces',
    pickReplaces: 'materialLog.extra.pickReplaces',
    cost: 'materialLog.extra.cost',
    costHint: 'materialLog.extra.costHint',
    stockMajor: 'materialLog.extra.stockMajor',
    stockNote: 'materialLog.extra.stockNote',
    boughtNote: 'materialLog.extra.boughtNote',
    empty: 'materialLog.extra.empty',
  },
  pool: { heading: 'materialLog.pool.heading', body: 'materialLog.pool.body', away: 'materialLog.pool.away', empty: 'materialLog.pool.empty', note: 'materialLog.pool.note' },
  confirm: {
    button: 'materialLog.confirm.button',
    saveDraft: 'materialLog.confirm.saveDraft',
    missing: 'materialLog.confirm.missing',
    missingLines: 'materialLog.confirm.missingLines',
    missingRows: 'materialLog.confirm.missingRows',
    title: 'materialLog.confirm.title',
    body: 'materialLog.confirm.body',
    summaryUsed: 'materialLog.confirm.summaryUsed',
    summaryDeviations: 'materialLog.confirm.summaryDeviations',
    summaryLeftover: 'materialLog.confirm.summaryLeftover',
    summaryUnlegible: 'materialLog.confirm.summaryUnlegible',
    back: 'materialLog.confirm.back',
    go: 'materialLog.confirm.go',
    toast: 'materialLog.confirm.toast',
    toastQueued: 'materialLog.confirm.toastQueued',
    toastDraft: 'materialLog.confirm.toastDraft',
    done: 'materialLog.confirm.done',
    doneBody: 'materialLog.confirm.doneBody',
    by: 'materialLog.confirm.by',
    reopened: 'materialLog.confirm.reopened',
  },
  admin: {
    costs: 'materialLog.admin.costs',
    costsNote: 'materialLog.admin.costsNote',
    planned: 'materialLog.admin.planned',
    asInstalled: 'materialLog.admin.asInstalled',
    leftoverValue: 'materialLog.admin.leftoverValue',
    extras: 'materialLog.admin.extras',
    reopen: 'materialLog.admin.reopen',
    reopenTitle: 'materialLog.admin.reopenTitle',
    reopenBody: 'materialLog.admin.reopenBody',
    reopenReason: 'materialLog.admin.reopenReason',
    reopenGo: 'materialLog.admin.reopenGo',
    toastReopened: 'materialLog.admin.toastReopened',
    readOnly: 'materialLog.admin.readOnly',
    reopenedHeading: 'materialLog.admin.reopenedHeading',
  },
  board: {
    subtitle: 'materialLog.board.subtitle',
    jobs: 'materialLog.board.jobs',
    confirmed: 'materialLog.board.confirmed',
    waiting: 'materialLog.board.waiting',
    deviations: 'materialLog.board.deviations',
    patterns: 'materialLog.board.patterns',
    patternsBody: 'materialLog.board.patternsBody',
    patternLine: 'materialLog.board.patternLine',
    noPatterns: 'materialLog.board.noPatterns',
    review: 'materialLog.board.review',
    watching: 'materialLog.board.watching',
    scorecard: 'materialLog.board.scorecard',
    jobsHeading: 'materialLog.board.jobsHeading',
    noJobs: 'materialLog.board.noJobs',
    row: 'materialLog.board.row',
    substitutions: 'materialLog.board.substitutions',
    leftovers: 'materialLog.board.leftovers',
    poolHeading: 'materialLog.board.poolHeading',
  },
  installed: { heading: 'materialLog.installed.heading', body: 'materialLog.installed.body', substituted: 'materialLog.installed.substituted', unreadable: 'materialLog.installed.unreadable', none: 'materialLog.installed.none' },
  card: { open: 'materialLog.card.open', title: 'materialLog.card.title', logged: 'materialLog.card.logged', notLogged: 'materialLog.card.notLogged' },
  alert: { pattern: 'materialLog.alert.pattern' },
} as const;
