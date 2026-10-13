/** Screen 106 — Inventory / Stock-in-Transit. Types and translation keys only. */

import type { ArrivalWindow, ReadinessStatus } from '@/features/logistics/transit';

export type StockInTransitStatus = 'loading' | 'ready' | 'error';

/** How often the board re-reads while open. */
export const POLL_MS = 60_000;

export type TransitTab = 'stock' | 'capacity' | 'attention';
export const TRANSIT_TABS: TransitTab[] = ['stock', 'capacity', 'attention'];

/** Smart defaults, so a large volume reads as a summary, not a dump. */
export type TransitGrouping = 'week' | 'category' | 'site' | 'supplier';
export const TRANSIT_GROUPINGS: TransitGrouping[] = ['week', 'category', 'site', 'supplier'];

export type WindowFilter = 'all' | ArrivalWindow;
export const WINDOW_FILTERS: WindowFilter[] = ['all', 'overdue', 'this_week', 'next_week', 'later'];

/** Rows shown per group before "show all", and groups opened by default. */
export const ROWS_PER_GROUP = 5;
export const GROUPS_OPEN_BY_DEFAULT = 3;

export const READINESS_ORDER: ReadinessStatus[] = ['conflict', 'unordered', 'no_job', 'on_track', 'ready'];

export const STOCK_IN_TRANSIT_KEYS = {
  title: 'stockInTransit.title',
  subtitle: 'stockInTransit.subtitle',
  loading: 'stockInTransit.loading',
  error: { title: 'stockInTransit.error.title', body: 'stockInTransit.error.body' },
  tab: {
    label: 'stockInTransit.tab.label',
    stock: 'stockInTransit.tab.stock',
    capacity: 'stockInTransit.tab.capacity',
    attention: 'stockInTransit.tab.attention',
  },
  kpi: {
    total: 'stockInTransit.kpi.total',
    totalCaption: 'stockInTransit.kpi.totalCaption',
    road: 'stockInTransit.kpi.road',
    made: 'stockInTransit.kpi.made',
    risk: 'stockInTransit.kpi.risk',
    caption: 'stockInTransit.kpi.caption',
  },
  note: 'stockInTransit.note',
  filter: {
    label: 'stockInTransit.filter.label',
    search: 'stockInTransit.filter.search',
    window: 'stockInTransit.filter.window',
    allSuppliers: 'stockInTransit.filter.allSuppliers',
    allCategories: 'stockInTransit.filter.allCategories',
    groupBy: 'stockInTransit.filter.groupBy',
    clear: 'stockInTransit.filter.clear',
  },
  window: {
    all: 'stockInTransit.window.all',
    overdue: 'stockInTransit.window.overdue',
    this_week: 'stockInTransit.window.this_week',
    next_week: 'stockInTransit.window.next_week',
    later: 'stockInTransit.window.later',
  },
  group: {
    week: 'stockInTransit.group.week',
    category: 'stockInTransit.group.category',
    site: 'stockInTransit.group.site',
    supplier: 'stockInTransit.group.supplier',
    weekOf: 'stockInTransit.group.weekOf',
    overdue: 'stockInTransit.group.overdue',
    lines: 'stockInTransit.group.lines',
    showAll: 'stockInTransit.group.showAll',
    showLess: 'stockInTransit.group.showLess',
    open: 'stockInTransit.group.open',
    collapse: 'stockInTransit.group.collapse',
  },
  row: {
    qty: 'stockInTransit.row.qty',
    arrives: 'stockInTransit.row.arrives',
    source_tracker: 'stockInTransit.row.source_tracker',
    source_estimate: 'stockInTransit.row.source_estimate',
    source_promised: 'stockInTransit.row.source_promised',
    onRoad: 'stockInTransit.row.onRoad',
    late: 'stockInTransit.row.late',
    watch: 'stockInTransit.row.watch',
    critical: 'stockInTransit.row.critical',
    vehicle: 'stockInTransit.row.vehicle',
  },
  empty: {
    title: 'stockInTransit.empty.title',
    body: 'stockInTransit.empty.body',
    filteredTitle: 'stockInTransit.empty.filteredTitle',
    filteredBody: 'stockInTransit.empty.filteredBody',
  },
  capacity: {
    intro: 'stockInTransit.capacity.intro',
    weeksHeading: 'stockInTransit.capacity.weeksHeading',
    dealsHeading: 'stockInTransit.capacity.dealsHeading',
    week: 'stockInTransit.capacity.week',
    thisWeek: 'stockInTransit.capacity.thisWeek',
    ready: 'stockInTransit.capacity.ready',
    newly: 'stockInTransit.capacity.newly',
    booked: 'stockInTransit.capacity.booked',
    conflicts: 'stockInTransit.capacity.conflicts',
    readyBy: 'stockInTransit.capacity.readyBy',
    readyNow: 'stockInTransit.capacity.readyNow',
    unknown: 'stockInTransit.capacity.unknown',
    starts: 'stockInTransit.capacity.starts',
    noStart: 'stockInTransit.capacity.noStart',
    confidence_confirmed: 'stockInTransit.capacity.confidence_confirmed',
    confidence_tracker: 'stockInTransit.capacity.confidence_tracker',
    confidence_estimate: 'stockInTransit.capacity.confidence_estimate',
    status: {
      conflict: 'stockInTransit.capacity.status.conflict',
      unordered: 'stockInTransit.capacity.status.unordered',
      no_job: 'stockInTransit.capacity.status.no_job',
      on_track: 'stockInTransit.capacity.status.on_track',
      ready: 'stockInTransit.capacity.status.ready',
    },
    statusBody: {
      conflict: 'stockInTransit.capacity.statusBody.conflict',
      unordered: 'stockInTransit.capacity.statusBody.unordered',
      no_job: 'stockInTransit.capacity.statusBody.no_job',
      on_track: 'stockInTransit.capacity.statusBody.on_track',
      ready: 'stockInTransit.capacity.statusBody.ready',
    },
    parts: 'stockInTransit.capacity.parts',
    emptyTitle: 'stockInTransit.capacity.emptyTitle',
    emptyBody: 'stockInTransit.capacity.emptyBody',
  },
  attention: {
    insightsHeading: 'stockInTransit.attention.insightsHeading',
    insightsHint: 'stockInTransit.attention.insightsHint',
    insightTitle: 'stockInTransit.attention.insightTitle',
    insightBody: 'stockInTransit.attention.insightBody',
    insightAdvice: 'stockInTransit.attention.insightAdvice',
    seeDelays: 'stockInTransit.attention.seeDelays',
    orphansHeading: 'stockInTransit.attention.orphansHeading',
    orphansHint: 'stockInTransit.attention.orphansHint',
    orphanTitle: 'stockInTransit.attention.orphanTitle',
    orphanBody: 'stockInTransit.attention.orphanBody',
    dealState: {
      lost: 'stockInTransit.attention.dealState.lost',
      cancelled: 'stockInTransit.attention.dealState.cancelled',
    },
    decide: 'stockInTransit.attention.decide',
    redirected: 'stockInTransit.attention.redirected',
    returned: 'stockInTransit.attention.returned',
    decidedBy: 'stockInTransit.attention.decidedBy',
    emptyTitle: 'stockInTransit.attention.emptyTitle',
    emptyBody: 'stockInTransit.attention.emptyBody',
  },
  decision: {
    title: 'stockInTransit.decision.title',
    intro: 'stockInTransit.decision.intro',
    redirect: 'stockInTransit.decision.redirect',
    return: 'stockInTransit.decision.return',
    redirectHint: 'stockInTransit.decision.redirectHint',
    returnHint: 'stockInTransit.decision.returnHint',
    deal: 'stockInTransit.decision.deal',
    pickDeal: 'stockInTransit.decision.pickDeal',
    note: 'stockInTransit.decision.note',
    noteHintReturn: 'stockInTransit.decision.noteHintReturn',
    noteHintRedirect: 'stockInTransit.decision.noteHintRedirect',
    noLogin: 'stockInTransit.decision.noLogin',
    submitRedirect: 'stockInTransit.decision.submitRedirect',
    submitReturn: 'stockInTransit.decision.submitReturn',
  },
  toast: {
    redirected: 'stockInTransit.toast.redirected',
    returned: 'stockInTransit.toast.returned',
  },
  problem: {
    forbidden: 'stockInTransit.problem.forbidden',
    not_found: 'stockInTransit.problem.not_found',
    invalid_state: 'stockInTransit.problem.invalid_state',
    invalid_input: 'stockInTransit.problem.invalid_input',
    generic: 'stockInTransit.problem.generic',
  },
} as const;
