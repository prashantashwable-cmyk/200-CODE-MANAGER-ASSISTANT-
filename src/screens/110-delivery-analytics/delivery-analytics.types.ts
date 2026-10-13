/** Screen 110 — Delivery Analytics. Types and translation keys only. */

import type { Direction, TrendTone } from '@/features/logistics/deliveryAnalytics';
import type { AnalyticsMonths } from '@/data/repository';

export type DeliveryAnalyticsStatus = 'loading' | 'ready' | 'error';

/** How often the figures re-read while open. */
export const POLL_MS = 60_000;

export const PERIODS: AnalyticsMonths[] = [3, 6, 12];
export const DEFAULT_MONTHS: AnalyticsMonths = 6;

export type AnalyticsTab = 'ontime' | 'transit' | 'damage' | 'cost';
export const ANALYTICS_TABS: AnalyticsTab[] = ['ontime', 'transit', 'damage', 'cost'];

export type OnTimeGroup = 'suppliers' | 'carriers';
export const ON_TIME_GROUPS: OnTimeGroup[] = ['suppliers', 'carriers'];

export const ARROW: Record<Direction, 'up' | 'down' | 'flat'> = { up: 'up', down: 'down', flat: 'flat' };
export const TONE_CLASS: Record<TrendTone, string> = { good: 't-success', bad: 't-error', neutral: 't-muted' };

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const ANALYTICS_KEYS = {
  title: 'deliveryAnalytics.title',
  subtitle: 'deliveryAnalytics.subtitle',
  loading: 'deliveryAnalytics.loading',
  refresh: 'deliveryAnalytics.refresh',
  error: { title: 'deliveryAnalytics.error.title', body: 'deliveryAnalytics.error.body' },
  period: { label: 'deliveryAnalytics.period.label', months: 'deliveryAnalytics.period.months' },
  setAside: { label: 'deliveryAnalytics.setAside.label', hint: 'deliveryAnalytics.setAside.hint', on: 'deliveryAnalytics.setAside.on' },
  tab: { label: 'deliveryAnalytics.tab.label', ...rec('deliveryAnalytics.tab', ANALYTICS_TABS) },
  kpi: {
    ontime: 'deliveryAnalytics.kpi.ontime',
    transit: 'deliveryAnalytics.kpi.transit',
    damage: 'deliveryAnalytics.kpi.damage',
    cost: 'deliveryAnalytics.kpi.cost',
    ontimeCaption: 'deliveryAnalytics.kpi.ontimeCaption',
    transitCaption: 'deliveryAnalytics.kpi.transitCaption',
    damageCaption: 'deliveryAnalytics.kpi.damageCaption',
    costCaption: 'deliveryAnalytics.kpi.costCaption',
    noData: 'deliveryAnalytics.kpi.noData',
    emerging: 'deliveryAnalytics.kpi.emerging',
    vsBefore: 'deliveryAnalytics.kpi.vsBefore',
    vsBeforePts: 'deliveryAnalytics.kpi.vsBeforePts',
    vsBeforePer100: 'deliveryAnalytics.kpi.vsBeforePer100',
    noCompare: 'deliveryAnalytics.kpi.noCompare',
    up: 'deliveryAnalytics.kpi.up',
    down: 'deliveryAnalytics.kpi.down',
    flat: 'deliveryAnalytics.kpi.flat',
    open: 'deliveryAnalytics.kpi.open',
  },
  unit: { hours: 'deliveryAnalytics.unit.hours', per100: 'deliveryAnalytics.unit.per100', days: 'deliveryAnalytics.unit.days' },
  chart: {
    aria: 'deliveryAnalytics.chart.aria',
    noData: 'deliveryAnalytics.chart.noData',
    disruption: 'deliveryAnalytics.chart.disruption',
    setAsideNote: 'deliveryAnalytics.chart.setAsideNote',
    deliveries: 'deliveryAnalytics.chart.deliveries',
    incidents: 'deliveryAnalytics.chart.incidents',
    overall: 'deliveryAnalytics.chart.overall',
    showing: 'deliveryAnalytics.chart.showing',
    clear: 'deliveryAnalytics.chart.clear',
  },
  ontime: {
    intro: 'deliveryAnalytics.ontime.intro',
    group: { label: 'deliveryAnalytics.ontime.group.label', suppliers: 'deliveryAnalytics.ontime.group.suppliers', carriers: 'deliveryAnalytics.ontime.group.carriers' },
    suppliersHint: 'deliveryAnalytics.ontime.suppliersHint',
    carriersHint: 'deliveryAnalytics.ontime.carriersHint',
    deliveries: 'deliveryAnalytics.ontime.deliveries',
    early: 'deliveryAnalytics.ontime.early',
    setAsideCount: 'deliveryAnalytics.ontime.setAsideCount',
    emptyTitle: 'deliveryAnalytics.ontime.emptyTitle',
    emptyBody: 'deliveryAnalytics.ontime.emptyBody',
    tapToPlot: 'deliveryAnalytics.ontime.tapToPlot',
  },
  transit: {
    intro: 'deliveryAnalytics.transit.intro',
    forQuotes: 'deliveryAnalytics.transit.forQuotes',
    emergingTitle: 'deliveryAnalytics.transit.emergingTitle',
    emergingBody: 'deliveryAnalytics.transit.emergingBody',
    average: 'deliveryAnalytics.transit.average',
    typical: 'deliveryAnalytics.transit.typical',
    promise: 'deliveryAnalytics.transit.promise',
    trips: 'deliveryAnalytics.transit.trips',
    lastArrived: 'deliveryAnalytics.transit.lastArrived',
    versusBefore: 'deliveryAnalytics.transit.versusBefore',
    emergingRow: 'deliveryAnalytics.transit.emergingRow',
    emptyTitle: 'deliveryAnalytics.transit.emptyTitle',
    emptyBody: 'deliveryAnalytics.transit.emptyBody',
    established: 'deliveryAnalytics.transit.established',
    emerging: 'deliveryAnalytics.transit.emerging',
    note: 'deliveryAnalytics.transit.note',
  },
  damage: {
    intro: 'deliveryAnalytics.damage.intro',
    monthsHeading: 'deliveryAnalytics.damage.monthsHeading',
    suppliersHeading: 'deliveryAnalytics.damage.suppliersHeading',
    categoriesHeading: 'deliveryAnalytics.damage.categoriesHeading',
    categoriesHint: 'deliveryAnalytics.damage.categoriesHint',
    incidents: 'deliveryAnalytics.damage.incidents',
    supplierFault: 'deliveryAnalytics.damage.supplierFault',
    rate: 'deliveryAnalytics.damage.rate',
    rising: 'deliveryAnalytics.damage.rising',
    risingBody: 'deliveryAnalytics.damage.risingBody',
    steady: 'deliveryAnalytics.damage.steady',
    tooFew: 'deliveryAnalytics.damage.tooFew',
    emptyTitle: 'deliveryAnalytics.damage.emptyTitle',
    emptyBody: 'deliveryAnalytics.damage.emptyBody',
    actionSupplier: 'deliveryAnalytics.damage.actionSupplier',
    actionCategory: 'deliveryAnalytics.damage.actionCategory',
    seeReports: 'deliveryAnalytics.damage.seeReports',
  },
  cost: {
    intro: 'deliveryAnalytics.cost.intro',
    total: 'deliveryAnalytics.cost.total',
    parts: 'deliveryAnalytics.cost.parts',
    rework: 'deliveryAnalytics.cost.rework',
    schedule: 'deliveryAnalytics.cost.schedule',
    exposure: 'deliveryAnalytics.cost.exposure',
    exposureBody: 'deliveryAnalytics.cost.exposureBody',
    retention: 'deliveryAnalytics.cost.retention',
    retentionBody: 'deliveryAnalytics.cost.retentionBody',
    incidentsHeading: 'deliveryAnalytics.cost.incidentsHeading',
    incidentsHint: 'deliveryAnalytics.cost.incidentsHint',
    noCost: 'deliveryAnalytics.cost.noCost',
    open: 'deliveryAnalytics.cost.open',
    resolved: 'deliveryAnalytics.cost.resolved',
    unjudged: 'deliveryAnalytics.cost.unjudged',
    howHeading: 'deliveryAnalytics.cost.howHeading',
    howParts: 'deliveryAnalytics.cost.howParts',
    howRework: 'deliveryAnalytics.cost.howRework',
    howSchedule: 'deliveryAnalytics.cost.howSchedule',
    howOnce: 'deliveryAnalytics.cost.howOnce',
    emptyTitle: 'deliveryAnalytics.cost.emptyTitle',
    emptyBody: 'deliveryAnalytics.cost.emptyBody',
  },
  attribution: { supplier: 'deliveryAnalytics.attribution.supplier', transport: 'deliveryAnalytics.attribution.transport', installation: 'deliveryAnalytics.attribution.installation' },
  disruption: {
    heading: 'deliveryAnalytics.disruption.heading',
    hint: 'deliveryAnalytics.disruption.hint',
    none: 'deliveryAnalytics.disruption.none',
    add: 'deliveryAnalytics.disruption.add',
    remove: 'deliveryAnalytics.disruption.remove',
    range: 'deliveryAnalytics.disruption.range',
    affected: 'deliveryAnalytics.disruption.affected',
    fromAlerts: 'deliveryAnalytics.disruption.fromAlerts',
    title: 'deliveryAnalytics.disruption.title',
    intro: 'deliveryAnalytics.disruption.intro',
    label: 'deliveryAnalytics.disruption.label',
    labelHint: 'deliveryAnalytics.disruption.labelHint',
    note: 'deliveryAnalytics.disruption.note',
    startsOn: 'deliveryAnalytics.disruption.startsOn',
    endsOn: 'deliveryAnalytics.disruption.endsOn',
    save: 'deliveryAnalytics.disruption.save',
    saved: 'deliveryAnalytics.disruption.saved',
    removed: 'deliveryAnalytics.disruption.removed',
  },
  problem: {
    forbidden: 'deliveryAnalytics.problem.forbidden',
    not_found: 'deliveryAnalytics.problem.not_found',
    invalid_input: 'deliveryAnalytics.problem.invalid_input',
    dates_reversed: 'deliveryAnalytics.problem.dates_reversed',
    too_long: 'deliveryAnalytics.problem.too_long',
    in_future: 'deliveryAnalytics.problem.in_future',
    duplicate: 'deliveryAnalytics.problem.duplicate',
    generic: 'deliveryAnalytics.problem.generic',
  },
} as const;
