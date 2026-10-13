/** Screen 021 — Executive KPI Dashboard (Admin home). Types and keys only. */

export type ExecKpiStatus = 'loading' | 'ready' | 'error';

export type RangeId = 'today' | 'week' | 'month' | 'quarter';

export const RANGES: RangeId[] = ['today', 'week', 'month', 'quarter'];

/** A single top-line card. Trend is omitted entirely when there is no baseline. */
export interface KpiCard {
  id: string;
  labelKey: string;
  value: string;
  /** null when the metric has no data yet — never rendered as a misleading 0%. */
  trendPct: number | null;
  /** Rising is not always good — an overdue-payments card inverts this. */
  goodDirection: 'up' | 'down';
  /** True when the trend is computed from a base under 5 — shown with a caveat. */
  smallSample: boolean;
  drillPath: string;
  hasData: boolean;
}

export interface FunnelToCashStage {
  id: string;
  labelKey: string;
  count: number;
  value: number;
}

export const EXEC_KPI_KEYS = {
  title: 'execKpi.title',
  subtitle: 'execKpi.subtitle',
  loading: 'execKpi.loading',
  range: {
    today: 'execKpi.range.today',
    week: 'execKpi.range.week',
    month: 'execKpi.range.month',
    quarter: 'execKpi.range.quarter',
  },
  card: {
    leads: 'execKpi.card.leads',
    conversion: 'execKpi.card.conversion',
    revenue: 'execKpi.card.revenue',
    margin: 'execKpi.card.margin',
    activeJobs: 'execKpi.card.activeJobs',
    overdue: 'execKpi.card.overdue',
  },
  noData: 'execKpi.noData',
  smallSample: 'execKpi.smallSample',
  funnelHeading: 'execKpi.funnelHeading',
  funnelSubtitle: 'execKpi.funnelSubtitle',
  alertsHeading: 'execKpi.alertsHeading',
  alertsCta: 'execKpi.alertsCta',
  quickLinks: 'execKpi.quickLinks',
  link: {
    map: 'execKpi.link.map',
    funnel: 'execKpi.link.funnel',
    finance: 'execKpi.link.finance',
    automation: 'execKpi.link.automation',
  },
  sameDataNote: 'execKpi.sameDataNote',
  error: { title: 'execKpi.error.title', body: 'execKpi.error.body' },
} as const;
