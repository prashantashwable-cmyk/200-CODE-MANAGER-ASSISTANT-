/** Screen 157 — Skill Matrix & Gap Analysis. Constants and translation keys only. */

import type { SkillCellState } from '@/data/repository';
import { ASSIGN_MAX_DAYS, NOTE_MAX, SMALL_WORKFORCE, STRETCHED_AT } from '@/features/training/skills';

export { ASSIGN_MAX_DAYS, NOTE_MAX, SMALL_WORKFORCE, STRETCHED_AT };
export const VIEWS = ['matrix', 'demand', 'trend'] as const;
export type View = (typeof VIEWS)[number];
export const CELL_STATES: SkillCellState[] = ['held', 'missing', 'current', 'expiring', 'grace', 'lapsed', 'earlier', 'in_progress', 'none'];
export const SIGNALS = ['untracked', 'no_supply', 'stretched', 'tight', 'covered', 'no_demand'] as const;
export const PULL_DISTANCE = 70;
export const recruitmentPath = '/recruitment';
export const certificationsPath = '/certifications';
export const lessonsPath = (moduleId: string) => `/training/${moduleId}`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['not_admin', 'not_found', 'no_content', 'no_people', 'date_invalid', 'date_in_past', 'date_far', 'note_long', 'generic'] as const;

export const MATRIX_KEYS = {
  title: 'skillMatrix.title',
  subtitle: 'skillMatrix.subtitle',
  compliance: 'skillMatrix.compliance',
  loading: 'skillMatrix.loading',
  error: { title: 'skillMatrix.error.title', body: 'skillMatrix.error.body' },
  refresh: { button: 'skillMatrix.refresh.button', pull: 'skillMatrix.refresh.pull', release: 'skillMatrix.refresh.release', busy: 'skillMatrix.refresh.busy' },
  empty: { title: 'skillMatrix.empty.title', body: 'skillMatrix.empty.body', action: 'skillMatrix.empty.action' },
  view: rec('skillMatrix.view', VIEWS),
  kpi: {
    gaps: 'skillMatrix.kpi.gaps',
    gapsCaption: 'skillMatrix.kpi.gapsCaption',
    qualified: 'skillMatrix.kpi.qualified',
    qualifiedCaption: 'skillMatrix.kpi.qualifiedCaption',
    demandGaps: 'skillMatrix.kpi.demandGaps',
    demandGapsCaption: 'skillMatrix.kpi.demandGapsCaption',
    trend: 'skillMatrix.kpi.trend',
    trendCaption: 'skillMatrix.kpi.trendCaption',
    trendSmall: 'skillMatrix.kpi.trendSmall',
  },
  small: { workforce: 'skillMatrix.small.workforce', demand: 'skillMatrix.small.demand' },
  matrix: {
    technician: 'skillMatrix.matrix.technician',
    tags: 'skillMatrix.matrix.tags',
    certs: 'skillMatrix.matrix.certs',
    held: 'skillMatrix.matrix.held',
    gap: 'skillMatrix.matrix.gap',
    solo: 'skillMatrix.matrix.solo',
    safety: 'skillMatrix.matrix.safety',
    assigned: 'skillMatrix.matrix.assigned',
    openJobs: 'skillMatrix.matrix.openJobs',
    legend: 'skillMatrix.matrix.legend',
    tapHint: 'skillMatrix.matrix.tapHint',
  },
  cell: rec('skillMatrix.cell', CELL_STATES),
  cellBody: rec('skillMatrix.cellBody', CELL_STATES),
  sheet: {
    column: 'skillMatrix.sheet.column',
    holders: 'skillMatrix.sheet.holders',
    missing: 'skillMatrix.sheet.missing',
    nobody: 'skillMatrix.sheet.nobody',
    soloBody: 'skillMatrix.sheet.soloBody',
    gapBody: 'skillMatrix.sheet.gapBody',
    okBody: 'skillMatrix.sheet.okBody',
    noModule: 'skillMatrix.sheet.noModule',
    recruit: 'skillMatrix.sheet.recruit',
    recruitWhy: 'skillMatrix.sheet.recruitWhy',
    assignMissing: 'skillMatrix.sheet.assignMissing',
    assignOne: 'skillMatrix.sheet.assignOne',
    openLessons: 'skillMatrix.sheet.openLessons',
    close: 'skillMatrix.sheet.close',
  },
  demand: {
    heading: 'skillMatrix.demand.heading',
    body: 'skillMatrix.demand.body',
    deals: 'skillMatrix.demand.deals',
    value: 'skillMatrix.demand.value',
    supply: 'skillMatrix.demand.supply',
    ratio: 'skillMatrix.demand.ratio',
    skill: 'skillMatrix.demand.skill',
    signal: rec('skillMatrix.demand.signal', SIGNALS),
    signalBody: rec('skillMatrix.demand.signalBody', SIGNALS),
    noSkill: 'skillMatrix.demand.noSkill',
    recruitLever: 'skillMatrix.demand.recruitLever',
    recruit: 'skillMatrix.demand.recruit',
    smallNote: 'skillMatrix.demand.smallNote',
    placeholder: 'skillMatrix.demand.placeholder',
  },
  trend: {
    heading: 'skillMatrix.trend.heading',
    body: 'skillMatrix.trend.body',
    up: 'skillMatrix.trend.up',
    down: 'skillMatrix.trend.down',
    flat: 'skillMatrix.trend.flat',
    point: 'skillMatrix.trend.point',
    note: 'skillMatrix.trend.note',
    chart: 'skillMatrix.trend.chart',
  },
  assign: {
    title: 'skillMatrix.assign.title',
    body: 'skillMatrix.assign.body',
    module: 'skillMatrix.assign.module',
    people: 'skillMatrix.assign.people',
    due: 'skillMatrix.assign.due',
    dueHint: 'skillMatrix.assign.dueHint',
    note: 'skillMatrix.assign.note',
    noteHint: 'skillMatrix.assign.noteHint',
    confirm: 'skillMatrix.assign.confirm',
    cancel: 'skillMatrix.assign.cancel',
    done: 'skillMatrix.assign.done',
    skippedHead: 'skillMatrix.assign.skippedHead',
    skipped: rec('skillMatrix.assign.skipped', ['not_for_you', 'already_done', 'already_assigned', 'not_active'] as const),
    dueFirst: 'skillMatrix.assign.dueFirst',
    selectNone: 'skillMatrix.assign.selectNone',
    ok: 'skillMatrix.assign.ok',
  },
  close: 'skillMatrix.close',
  problem: rec('skillMatrix.problem', PROBLEMS),
} as const;
