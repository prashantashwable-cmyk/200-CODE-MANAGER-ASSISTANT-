/** Screen 158 — Training Compliance Tracker. Constants and translation keys only. */

import { NOTE_MAX, REMIND_GAP_HOURS, REMIND_DUE_DAYS, REMIND_DUE_DAYS_SAFETY, REVIEW_EVERY_DAYS, SMALL_GROUP, WAVE_MIN, WAVE_WINDOW_DAYS, TREND_MONTHS } from '@/features/training/compliance';

export { NOTE_MAX, REMIND_GAP_HOURS, REMIND_DUE_DAYS, REMIND_DUE_DAYS_SAFETY, REVIEW_EVERY_DAYS, SMALL_GROUP, WAVE_MIN, WAVE_WINDOW_DAYS, TREND_MONTHS };
export const VIEWS = ['overview', 'partners', 'trend'] as const;
export type View = (typeof VIEWS)[number];
export const FILTERS = ['out', 'safety', 'coaching', 'refresher', 'nudge', 'soon', 'all'] as const;
export type Filter = (typeof FILTERS)[number];
export const ROLES = ['technician', 'surveyor', 'supplier'] as const;
export const REASONS = ['never_started', 'in_progress', 'test_pending', 'failed', 'update_needed', 'lapsed'] as const;
export const ITEM_STATES = ['current', 'due_soon', 'grace', 'new', ...REASONS] as const;
export const RESPONSES = ['nudge', 'coaching', 'refresher'] as const;
export const SKIPS = ['compliant', 'recently_reminded', 'coaching_only', 'not_active', 'nothing_to_send'] as const;
export const PAGE = 20;
export const PULL_DISTANCE = 70;
export const CSV_COLUMNS = ['partner_id', 'compliance_status', 'non_compliance_reason', 'role', 'territory'] as const;
export const recruitmentPath = '/recruitment';
export const coachingPath = '/assessment';
export const refreshersPath = '/refreshers';
export const skillMatrixPath = '/skill-matrix';
export const lessonsPath = (moduleId: string) => `/training/${moduleId}`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['not_admin', 'no_people', 'note_long', 'generic'] as const;

export const COMPLIANCE_KEYS = {
  title: 'trainingCompliance.title',
  subtitle: 'trainingCompliance.subtitle',
  loading: 'trainingCompliance.loading',
  error: { title: 'trainingCompliance.error.title', body: 'trainingCompliance.error.body' },
  refresh: { button: 'trainingCompliance.refresh.button', pull: 'trainingCompliance.refresh.pull', release: 'trainingCompliance.refresh.release', busy: 'trainingCompliance.refresh.busy' },
  empty: { title: 'trainingCompliance.empty.title', body: 'trainingCompliance.empty.body', action: 'trainingCompliance.empty.action' },
  view: rec('trainingCompliance.view', VIEWS),
  role: rec('trainingCompliance.role', ROLES),
  kpi: {
    rate: 'trainingCompliance.kpi.rate', rateCaption: 'trainingCompliance.kpi.rateCaption', rateSmall: 'trainingCompliance.kpi.rateSmall',
    safety: 'trainingCompliance.kpi.safety', safetyCaption: 'trainingCompliance.kpi.safetyCaption', safetyNone: 'trainingCompliance.kpi.safetyNone',
    out: 'trainingCompliance.kpi.out', outCaption: 'trainingCompliance.kpi.outCaption',
    blocked: 'trainingCompliance.kpi.blocked', blockedCaption: 'trainingCompliance.kpi.blockedCaption',
    soon: 'trainingCompliance.kpi.soon', soonCaption: 'trainingCompliance.kpi.soonCaption',
    trendUp: 'trainingCompliance.kpi.trendUp', trendDown: 'trainingCompliance.kpi.trendDown', trendFlat: 'trainingCompliance.kpi.trendFlat',
  },
  overview: {
    byRole: 'trainingCompliance.overview.byRole', byTerritory: 'trainingCompliance.overview.byTerritory', byTraining: 'trainingCompliance.overview.byTraining',
    count: 'trainingCompliance.overview.count', small: 'trainingCompliance.overview.small', trainingRow: 'trainingCompliance.overview.trainingRow', noTerritory: 'trainingCompliance.overview.noTerritory',
    open: 'trainingCompliance.overview.open', scope: 'trainingCompliance.overview.scope', suppliers: 'trainingCompliance.overview.suppliers', safetyTraining: 'trainingCompliance.overview.safetyTraining',
    placeholder: 'trainingCompliance.overview.placeholder',
  },
  wave: {
    heading: 'trainingCompliance.wave.heading', body: 'trainingCompliance.wave.body', lapsed: 'trainingCompliance.wave.lapsed', upcoming: 'trainingCompliance.wave.upcoming',
    plan: 'trainingCompliance.wave.plan', still: 'trainingCompliance.wave.still', tag: 'trainingCompliance.wave.tag',
  },
  status: rec('trainingCompliance.status', ['compliant', 'due_soon', 'non_compliant'] as const),
  urgency: { safety: 'trainingCompliance.urgency.safety', routine: 'trainingCompliance.urgency.routine' },
  flag: { blocked: 'trainingCompliance.flag.blocked', wave: 'trainingCompliance.flag.wave', coaching: 'trainingCompliance.flag.coaching' },
  reason: rec('trainingCompliance.reason', REASONS),
  reasonBody: rec('trainingCompliance.reasonBody', REASONS),
  state: rec('trainingCompliance.state', ITEM_STATES),
  response: rec('trainingCompliance.response', RESPONSES),
  responseBody: rec('trainingCompliance.responseBody', RESPONSES),
  filters: {
    search: 'trainingCompliance.filters.search', role: 'trainingCompliance.filters.role', allRoles: 'trainingCompliance.filters.allRoles', territory: 'trainingCompliance.filters.territory',
    allTerritories: 'trainingCompliance.filters.allTerritories', clear: 'trainingCompliance.filters.clear', count: 'trainingCompliance.filters.count', none: 'trainingCompliance.filters.none',
    chip: rec('trainingCompliance.filters.chip', FILTERS),
  },
  list: {
    lastReminded: 'trainingCompliance.list.lastReminded', neverReminded: 'trainingCompliance.list.neverReminded', jobs: 'trainingCompliance.list.jobs', more: 'trainingCompliance.list.more',
    allFine: 'trainingCompliance.list.allFine', itemsOpen: 'trainingCompliance.list.itemsOpen',
  },
  detail: {
    since: 'trainingCompliance.detail.since', fails: 'trainingCompliance.detail.fails', assigned: 'trainingCompliance.detail.assigned', openModule: 'trainingCompliance.detail.openModule',
    openCoaching: 'trainingCompliance.detail.openCoaching', openRefreshers: 'trainingCompliance.detail.openRefreshers', remind: 'trainingCompliance.detail.remind', holds: 'trainingCompliance.detail.holds',
    heldBody: 'trainingCompliance.detail.heldBody', openJobs: 'trainingCompliance.detail.openJobs', fine: 'trainingCompliance.detail.fine', fineBody: 'trainingCompliance.detail.fineBody',
    matrix: 'trainingCompliance.detail.matrix', sopOpen: 'trainingCompliance.detail.sopOpen', openRollouts: 'trainingCompliance.detail.openRollouts', due: 'trainingCompliance.detail.due',
  },
  bulk: {
    button: 'trainingCompliance.bulk.button', none: 'trainingCompliance.bulk.none', title: 'trainingCompliance.bulk.title', body: 'trainingCompliance.bulk.body', willSend: 'trainingCompliance.bulk.willSend',
    coaching: 'trainingCompliance.bulk.coaching', recent: 'trainingCompliance.bulk.recent', safetyFirst: 'trainingCompliance.bulk.safetyFirst', confirm: 'trainingCompliance.bulk.confirm', cancel: 'trainingCompliance.bulk.cancel',
    resultTitle: 'trainingCompliance.bulk.resultTitle', sent: 'trainingCompliance.bulk.sent', assignedN: 'trainingCompliance.bulk.assignedN', skippedHead: 'trainingCompliance.bulk.skippedHead', done: 'trainingCompliance.bulk.done',
    skip: rec('trainingCompliance.bulk.skip', SKIPS),
  },
  trend: {
    heading: 'trainingCompliance.trend.heading', body: 'trainingCompliance.trend.body', up: 'trainingCompliance.trend.up', down: 'trainingCompliance.trend.down', flat: 'trainingCompliance.trend.flat',
    chart: 'trainingCompliance.trend.chart', basisNote: 'trainingCompliance.trend.basisNote', small: 'trainingCompliance.trend.small', point: 'trainingCompliance.trend.point',
    basis: rec('trainingCompliance.trend.basis', ['live', 'recorded', 'rebuilt'] as const), few: 'trainingCompliance.trend.few',
  },
  review: {
    heading: 'trainingCompliance.review.heading', body: 'trainingCompliance.review.body', last: 'trainingCompliance.review.last', never: 'trainingCompliance.review.never', due: 'trainingCompliance.review.due',
    overdue: 'trainingCompliance.review.overdue', note: 'trainingCompliance.review.note', noteHint: 'trainingCompliance.review.noteHint', record: 'trainingCompliance.review.record', recorded: 'trainingCompliance.review.recorded',
    figures: 'trainingCompliance.review.figures', history: 'trainingCompliance.review.history', by: 'trainingCompliance.review.by',
  },
  export: { button: 'trainingCompliance.export.button', done: 'trainingCompliance.export.done' },
  close: 'trainingCompliance.close',
  alert: { safetyOnJob: 'trainingCompliance.alert.safetyOnJob' },
  problem: rec('trainingCompliance.problem', PROBLEMS),
} as const;
