/** Screen 118 — Advance Payment & Retention. Types and translation keys only. */

import type { AdvanceState, BatchSkip, RetentionReadiness } from '@/features/suppliers/exposure';

export type ExposureStatus = 'loading' | 'ready' | 'error';

/** How often the board re-reads while open: an installation clearing QC changes what can be released. */
export const POLL_MS = 30_000;

export type ExposureTab = 'advances' | 'retentions';
export const TABS: ExposureTab[] = ['advances', 'retentions'];
export type AdvanceFilter = 'all' | 'attention' | 'recovering';
export const ADVANCE_FILTERS: AdvanceFilter[] = ['all', 'attention', 'recovering'];
export type RetentionFilter = 'all' | 'ready' | 'in_progress' | 'blocked';
export const RETENTION_FILTERS: RetentionFilter[] = ['all', 'ready', 'in_progress', 'blocked'];
export const ADVANCE_STATES: AdvanceState[] = ['on_track', 'late', 'stalled', 'deal_gone', 'recovering'];
export const READINESS: RetentionReadiness[] = ['released', 'withheld', 'ready', 'awaiting_qc', 'installing', 'rework', 'no_installation'];
export const HOLDS = ['defect', 'open_report', 'open_dispute'] as const;
export const SKIPS: BatchSkip[] = ['not_found', 'not_held', 'not_ready', 'defect', 'open_report', 'open_dispute'];
export const JOB_STATUSES = ['scheduled', 'materials_pending', 'in_progress', 'qc_pending', 'handover_pending', 'completed', 'on_hold'] as const;
export const STAGES = ['sent', 'acknowledged', 'in_production', 'ready_to_ship', 'shipped', 'delivered'] as const;
export const RECOVERY_EVENTS = ['started', 'recovered', 'written_off'] as const;
export const REASON_MIN = 10;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const EXPOSURE_KEYS = {
  title: 'advanceRetention.title',
  subtitle: 'advanceRetention.subtitle',
  loading: 'advanceRetention.loading',
  error: { title: 'advanceRetention.error.title', body: 'advanceRetention.error.body' },
  alert: { exposure: 'advanceRetention.alert.exposure' },
  totals: { advanceOut: 'advanceRetention.totals.advanceOut', advanceAtRisk: 'advanceRetention.totals.advanceAtRisk', retentionHeld: 'advanceRetention.totals.retentionHeld', retentionReady: 'advanceRetention.totals.retentionReady', count: 'advanceRetention.totals.count' },
  auto: { label: 'advanceRetention.auto.label', on: 'advanceRetention.auto.on', off: 'advanceRetention.auto.off', toast: 'advanceRetention.auto.toast' },
  tabs: { label: 'advanceRetention.tabs.label', ...rec('advanceRetention.tabs', TABS) },
  filter: {
    search: 'advanceRetention.filter.search',
    advance: rec('advanceRetention.filter.advance', ADVANCE_FILTERS),
    retention: rec('advanceRetention.filter.retention', RETENTION_FILTERS),
  },
  advance: {
    emptyTitle: 'advanceRetention.advance.emptyTitle',
    emptyBody: 'advanceRetention.advance.emptyBody',
    emptyFilterTitle: 'advanceRetention.advance.emptyFilterTitle',
    emptyFilterBody: 'advanceRetention.advance.emptyFilterBody',
    paidLine: 'advanceRetention.advance.paidLine',
    promisedLine: 'advanceRetention.advance.promisedLine',
    pastPromise: 'advanceRetention.advance.pastPromise',
    noPromise: 'advanceRetention.advance.noPromise',
    recommend: 'advanceRetention.advance.recommend',
    state: rec('advanceRetention.advance.state', ADVANCE_STATES),
    stateBody: rec('advanceRetention.advance.stateBody', ADVANCE_STATES),
  },
  retention: {
    emptyTitle: 'advanceRetention.retention.emptyTitle',
    emptyBody: 'advanceRetention.retention.emptyBody',
    emptyFilterTitle: 'advanceRetention.retention.emptyFilterTitle',
    emptyFilterBody: 'advanceRetention.retention.emptyFilterBody',
    heldLine: 'advanceRetention.retention.heldLine',
    review: 'advanceRetention.retention.review',
    readiness: rec('advanceRetention.retention.readiness', READINESS),
    readinessBody: rec('advanceRetention.retention.readinessBody', READINESS),
    hold: rec('advanceRetention.retention.hold', HOLDS),
    holdBody: rec('advanceRetention.retention.holdBody', HOLDS),
    installation: 'advanceRetention.retention.installation',
    noInstallation: 'advanceRetention.retention.noInstallation',
    steps: 'advanceRetention.retention.steps',
    jobStatus: rec('advanceRetention.retention.jobStatus', JOB_STATUSES),
  },
  /** 095 owns the fulfilment stage names. */
  stage: rec('fulfilmentStage', STAGES),
  batch: {
    select: 'advanceRetention.batch.select',
    done: 'advanceRetention.batch.done',
    selectAll: 'advanceRetention.batch.selectAll',
    clear: 'advanceRetention.batch.clear',
    hint: 'advanceRetention.batch.hint',
    review: 'advanceRetention.batch.review',
    title: 'advanceRetention.batch.title',
    intro: 'advanceRetention.batch.intro',
    total: 'advanceRetention.batch.total',
    confirm: 'advanceRetention.batch.confirm',
    excluded: 'advanceRetention.batch.excluded',
    skipped: 'advanceRetention.batch.skipped',
    skip: rec('advanceRetention.batch.skip', SKIPS),
  },
  detail: {
    advanceTitle: 'advanceRetention.detail.advanceTitle',
    retentionTitle: 'advanceRetention.detail.retentionTitle',
    supplier: 'advanceRetention.detail.supplier',
    order: 'advanceRetention.detail.order',
    site: 'advanceRetention.detail.site',
    paid: 'advanceRetention.detail.paid',
    age: 'advanceRetention.detail.age',
    promised: 'advanceRetention.detail.promised',
    stage: 'advanceRetention.detail.stage',
    heldSince: 'advanceRetention.detail.heldSince',
    share: 'advanceRetention.detail.share',
    seePayment: 'advanceRetention.detail.seePayment',
    seeOrder: 'advanceRetention.detail.seeOrder',
    seeReports: 'advanceRetention.detail.seeReports',
    seeDisputes: 'advanceRetention.detail.seeDisputes',
    holdsHeading: 'advanceRetention.detail.holdsHeading',
    recoveryHeading: 'advanceRetention.detail.recoveryHeading',
    recoveryLine: 'advanceRetention.detail.recoveryLine',
    recoveredSo: 'advanceRetention.detail.recoveredSo',
    event: rec('advanceRetention.detail.event', RECOVERY_EVENTS),
    by: 'advanceRetention.detail.by',
    decisionHeading: 'advanceRetention.detail.decisionHeading',
    decisionHint: 'advanceRetention.detail.decisionHint',
    days: 'advanceRetention.detail.days',
  },
  action: {
    startRecovery: 'advanceRetention.action.startRecovery',
    recorded: 'advanceRetention.action.recorded',
    writeOff: 'advanceRetention.action.writeOff',
    release: 'advanceRetention.action.release',
    withhold: 'advanceRetention.action.withhold',
    close: 'advanceRetention.action.close',
  },
  recoverySheet: { title: 'advanceRetention.recoverySheet.title', intro: 'advanceRetention.recoverySheet.intro', reason: 'advanceRetention.recoverySheet.reason', reasonHint: 'advanceRetention.recoverySheet.reasonHint', confirm: 'advanceRetention.recoverySheet.confirm' },
  recordedSheet: { title: 'advanceRetention.recordedSheet.title', intro: 'advanceRetention.recordedSheet.intro', amount: 'advanceRetention.recordedSheet.amount', amountHint: 'advanceRetention.recordedSheet.amountHint', note: 'advanceRetention.recordedSheet.note', confirm: 'advanceRetention.recordedSheet.confirm' },
  writeOffSheet: { title: 'advanceRetention.writeOffSheet.title', intro: 'advanceRetention.writeOffSheet.intro', note: 'advanceRetention.writeOffSheet.note', confirm: 'advanceRetention.writeOffSheet.confirm' },
  decideSheet: { releaseTitle: 'advanceRetention.decideSheet.releaseTitle', withholdTitle: 'advanceRetention.decideSheet.withholdTitle', releaseIntro: 'advanceRetention.decideSheet.releaseIntro', releaseNotReady: 'advanceRetention.decideSheet.releaseNotReady', withholdIntro: 'advanceRetention.decideSheet.withholdIntro', reason: 'advanceRetention.decideSheet.reason', confirmRelease: 'advanceRetention.decideSheet.confirmRelease', confirmWithhold: 'advanceRetention.decideSheet.confirmWithhold' },
  toast: { released: 'advanceRetention.toast.released', recovery: 'advanceRetention.toast.recovery', recorded: 'advanceRetention.toast.recorded', writtenOff: 'advanceRetention.toast.writtenOff', decided: 'advanceRetention.toast.decided', batch: 'advanceRetention.toast.batch' },
  problem: {
    forbidden: 'advanceRetention.problem.forbidden',
    not_found: 'advanceRetention.problem.not_found',
    already_open: 'advanceRetention.problem.already_open',
    note_required: 'advanceRetention.problem.note_required',
    reason_required: 'advanceRetention.problem.reason_required',
    invalid_amount: 'advanceRetention.problem.invalid_amount',
    exceeds_payment: 'advanceRetention.problem.exceeds_payment',
    invalid_state: 'advanceRetention.problem.invalid_state',
    generic: 'advanceRetention.problem.generic',
  },
} as const;
