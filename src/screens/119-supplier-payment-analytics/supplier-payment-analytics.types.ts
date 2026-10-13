/** Screen 119 — Supplier Payment Analytics. Types and translation keys only. */

import type { Direction, TrendTone } from '@/features/suppliers/paymentAnalytics';
import type { AnalyticsMonths } from '@/data/repository';

export type AnalyticsStatus = 'loading' | 'ready' | 'error';

/** How often the figures re-read while open. */
export const POLL_MS = 60_000;

export const PERIODS: AnalyticsMonths[] = [3, 6, 12];
export const DEFAULT_MONTHS: AnalyticsMonths = 6;

export type AnalyticsTab = 'spend' | 'speed' | 'retention' | 'disputes';
export const TABS: AnalyticsTab[] = ['spend', 'speed', 'retention', 'disputes'];

export type SpendGroup = 'suppliers' | 'categories';
export const SPEND_GROUPS: SpendGroup[] = ['suppliers', 'categories'];

export const REVIEW_REASONS = ['high_rate', 'halt_threat', 'slow_resolution', 'repeat_rounds'] as const;
export const NOTE_LABEL_MIN = 3;

export const TONE_CLASS: Record<TrendTone, string> = { good: 't-success', bad: 't-error', neutral: 't-muted' };
export const DIRECTIONS: Direction[] = ['up', 'down', 'flat'];

/** The names a downloaded row carries in its `metric_name` column. Fixed, so a spreadsheet keeps working in any language. */
export const METRIC_NAMES = {
  spend: 'supplier_spend',
  daysToPay: 'days_to_payment',
  retentionHeld: 'retention_held',
  disputeRate: 'dispute_rate_pct',
  resolutionDays: 'dispute_resolution_days',
} as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const ANALYTICS_KEYS = {
  title: 'supplierPaymentAnalytics.title',
  subtitle: 'supplierPaymentAnalytics.subtitle',
  loading: 'supplierPaymentAnalytics.loading',
  refresh: 'supplierPaymentAnalytics.refresh',
  error: { title: 'supplierPaymentAnalytics.error.title', body: 'supplierPaymentAnalytics.error.body' },
  alert: { review: 'supplierPaymentAnalytics.alert.review' },
  exportAction: { label: 'supplierPaymentAnalytics.exportAction.label', done: 'supplierPaymentAnalytics.exportAction.done' },
  period: { label: 'supplierPaymentAnalytics.period.label', months: 'supplierPaymentAnalytics.period.months' },
  setAside: { label: 'supplierPaymentAnalytics.setAside.label' },
  review: {
    title: 'supplierPaymentAnalytics.review.title',
    body: 'supplierPaymentAnalytics.review.body',
    open: 'supplierPaymentAnalytics.review.open',
    reason: rec('supplierPaymentAnalytics.review.reason', REVIEW_REASONS),
  },
  kpi: {
    spend: 'supplierPaymentAnalytics.kpi.spend',
    speed: 'supplierPaymentAnalytics.kpi.speed',
    retention: 'supplierPaymentAnalytics.kpi.retention',
    disputes: 'supplierPaymentAnalytics.kpi.disputes',
    spendCaption: 'supplierPaymentAnalytics.kpi.spendCaption',
    speedCaption: 'supplierPaymentAnalytics.kpi.speedCaption',
    retentionCaption: 'supplierPaymentAnalytics.kpi.retentionCaption',
    disputesCaption: 'supplierPaymentAnalytics.kpi.disputesCaption',
    noData: 'supplierPaymentAnalytics.kpi.noData',
    noCompare: 'supplierPaymentAnalytics.kpi.noCompare',
    vsBeforePct: 'supplierPaymentAnalytics.kpi.vsBeforePct',
    vsBeforeDays: 'supplierPaymentAnalytics.kpi.vsBeforeDays',
    vsBeforePts: 'supplierPaymentAnalytics.kpi.vsBeforePts',
    up: 'supplierPaymentAnalytics.kpi.up',
    down: 'supplierPaymentAnalytics.kpi.down',
    flat: 'supplierPaymentAnalytics.kpi.flat',
    open: 'supplierPaymentAnalytics.kpi.open',
  },
  unit: { days: 'supplierPaymentAnalytics.unit.days', pct: 'supplierPaymentAnalytics.unit.pct' },
  tab: { label: 'supplierPaymentAnalytics.tab.label', ...rec('supplierPaymentAnalytics.tab', TABS) },
  chart: { noData: 'supplierPaymentAnalytics.chart.noData', spendAria: 'supplierPaymentAnalytics.chart.spendAria', speedAria: 'supplierPaymentAnalytics.chart.speedAria', retentionAria: 'supplierPaymentAnalytics.chart.retentionAria' },
  spend: {
    intro: 'supplierPaymentAnalytics.spend.intro',
    monthsHeading: 'supplierPaymentAnalytics.spend.monthsHeading',
    typical: 'supplierPaymentAnalytics.spend.typical',
    emptyTitle: 'supplierPaymentAnalytics.spend.emptyTitle',
    emptyBody: 'supplierPaymentAnalytics.spend.emptyBody',
    otherCategory: 'supplierPaymentAnalytics.spend.otherCategory',
    group: { label: 'supplierPaymentAnalytics.spend.group.label', suppliers: 'supplierPaymentAnalytics.spend.group.suppliers', categories: 'supplierPaymentAnalytics.spend.group.categories' },
    groupHint: { suppliers: 'supplierPaymentAnalytics.spend.groupHint.suppliers', categories: 'supplierPaymentAnalytics.spend.groupHint.categories' },
    row: { share: 'supplierPaymentAnalytics.spend.row.share', change: 'supplierPaymentAnalytics.spend.row.change', fresh: 'supplierPaymentAnalytics.spend.row.fresh', payments: 'supplierPaymentAnalytics.spend.row.payments' },
    spike: {
      title: 'supplierPaymentAnalytics.spend.spike.title',
      ratio: 'supplierPaymentAnalytics.spend.spike.ratio',
      oneOrder: 'supplierPaymentAnalytics.spend.spike.oneOrder',
      several: 'supplierPaymentAnalytics.spend.spike.several',
      explained: 'supplierPaymentAnalytics.spend.spike.explained',
      explain: 'supplierPaymentAnalytics.spend.spike.explain',
      marker: 'supplierPaymentAnalytics.spend.spike.marker',
    },
    notes: {
      heading: 'supplierPaymentAnalytics.spend.notes.heading',
      by: 'supplierPaymentAnalytics.spend.notes.by',
      remove: 'supplierPaymentAnalytics.spend.notes.remove',
      add: 'supplierPaymentAnalytics.spend.notes.add',
      hint: 'supplierPaymentAnalytics.spend.notes.hint',
    },
    sheet: {
      title: 'supplierPaymentAnalytics.spend.sheet.title',
      month: 'supplierPaymentAnalytics.spend.sheet.month',
      label: 'supplierPaymentAnalytics.spend.sheet.label',
      labelHint: 'supplierPaymentAnalytics.spend.sheet.labelHint',
      note: 'supplierPaymentAnalytics.spend.sheet.note',
      save: 'supplierPaymentAnalytics.spend.sheet.save',
      saved: 'supplierPaymentAnalytics.spend.sheet.saved',
      removed: 'supplierPaymentAnalytics.spend.sheet.removed',
    },
  },
  speed: {
    intro: 'supplierPaymentAnalytics.speed.intro',
    monthsHeading: 'supplierPaymentAnalytics.speed.monthsHeading',
    average: 'supplierPaymentAnalytics.speed.average',
    median: 'supplierPaymentAnalytics.speed.median',
    within: 'supplierPaymentAnalytics.speed.within',
    target: 'supplierPaymentAnalytics.speed.target',
    setAsideNote: 'supplierPaymentAnalytics.speed.setAsideNote',
    includedNote: 'supplierPaymentAnalytics.speed.includedNote',
    waiting: {
      heading: 'supplierPaymentAnalytics.speed.waiting.heading',
      none: 'supplierPaymentAnalytics.speed.waiting.none',
      summary: 'supplierPaymentAnalytics.speed.waiting.summary',
      over: 'supplierPaymentAnalytics.speed.waiting.over',
      oldest: 'supplierPaymentAnalytics.speed.waiting.oldest',
      held: 'supplierPaymentAnalytics.speed.waiting.held',
      open: 'supplierPaymentAnalytics.speed.waiting.open',
    },
    suppliersHeading: 'supplierPaymentAnalytics.speed.suppliersHeading',
    early: 'supplierPaymentAnalytics.speed.early',
    earlyHint: 'supplierPaymentAnalytics.speed.earlyHint',
    row: { payments: 'supplierPaymentAnalytics.speed.row.payments', within: 'supplierPaymentAnalytics.speed.row.within' },
    slowestHeading: 'supplierPaymentAnalytics.speed.slowestHeading',
    settling: 'supplierPaymentAnalytics.speed.settling',
    emptyTitle: 'supplierPaymentAnalytics.speed.emptyTitle',
    emptyBody: 'supplierPaymentAnalytics.speed.emptyBody',
  },
  retention: {
    intro: 'supplierPaymentAnalytics.retention.intro',
    monthsHeading: 'supplierPaymentAnalytics.retention.monthsHeading',
    heldNow: 'supplierPaymentAnalytics.retention.heldNow',
    paused: 'supplierPaymentAnalytics.retention.paused',
    released: 'supplierPaymentAnalytics.retention.released',
    withheld: 'supplierPaymentAnalytics.retention.withheld',
    oldest: 'supplierPaymentAnalytics.retention.oldest',
    count: 'supplierPaymentAnalytics.retention.count',
    open: 'supplierPaymentAnalytics.retention.open',
    monthLine: 'supplierPaymentAnalytics.retention.monthLine',
    emptyTitle: 'supplierPaymentAnalytics.retention.emptyTitle',
    emptyBody: 'supplierPaymentAnalytics.retention.emptyBody',
  },
  disputes: {
    intro: 'supplierPaymentAnalytics.disputes.intro',
    rate: 'supplierPaymentAnalytics.disputes.rate',
    resolution: 'supplierPaymentAnalytics.disputes.resolution',
    target: 'supplierPaymentAnalytics.disputes.target',
    openNow: 'supplierPaymentAnalytics.disputes.openNow',
    processFlags: 'supplierPaymentAnalytics.disputes.processFlags',
    suppliersHeading: 'supplierPaymentAnalytics.disputes.suppliersHeading',
    row: {
      of: 'supplierPaymentAnalytics.disputes.row.of',
      resolution: 'supplierPaymentAnalytics.disputes.row.resolution',
      noneResolved: 'supplierPaymentAnalytics.disputes.row.noneResolved',
      open: 'supplierPaymentAnalytics.disputes.row.open',
      early: 'supplierPaymentAnalytics.disputes.row.early',
      review: 'supplierPaymentAnalytics.disputes.row.review',
      rounds: 'supplierPaymentAnalytics.disputes.row.rounds',
    },
    seeDispute: 'supplierPaymentAnalytics.disputes.seeDispute',
    seeSuppliers: 'supplierPaymentAnalytics.disputes.seeSuppliers',
    noneStandOut: 'supplierPaymentAnalytics.disputes.noneStandOut',
    emptyTitle: 'supplierPaymentAnalytics.disputes.emptyTitle',
    emptyBody: 'supplierPaymentAnalytics.disputes.emptyBody',
  },
  problem: rec('supplierPaymentAnalytics.problem', ['generic', 'forbidden', 'invalid_input', 'in_future', 'no_spend', 'duplicate', 'not_found'] as const),
} as const;
