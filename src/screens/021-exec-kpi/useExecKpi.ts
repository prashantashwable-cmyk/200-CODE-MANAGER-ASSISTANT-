import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { formatINRCompact, formatPercent } from '@/design-system';
import type { ExecutiveKpis, FunnelStage } from '@/data/repository';
import type { SeriesPoint } from '@/data/types';
import type { ExecKpiStatus, FunnelToCashStage, KpiCard, RangeId } from './exec-kpi.types';

interface ExecKpiState {
  status: ExecKpiStatus;
  range: RangeId;
  setRange: (range: RangeId) => void;
  cards: KpiCard[];
  funnel: FunnelToCashStage[];
  revenueSeries: SeriesPoint[];
  openAlerts: number;
  reload: () => Promise<void>;
}

/** Below this base, a percentage swing is more noise than signal. */
const SMALL_SAMPLE_BASE = 5;

const FUNNEL_LABELS: Record<FunnelStage['stage'], string> = {
  captured: 'stage.captured',
  contacted: 'stage.contacted',
  site_visit: 'stage.site_visit',
  quoted: 'stage.quoted',
  negotiation: 'stage.negotiation',
  won: 'stage.won',
  lost: 'stage.lost',
};

/**
 * Owns the Admin home screen — the daily starting point.
 *
 * Every figure here comes from `getExecutiveKpis()`, the same aggregation the
 * detail screens read, so nothing on this card is a separately-entered number.
 * A metric with genuinely no data renders a clean "no data yet" rather than a
 * misleading 0% or an infinite trend arrow from a zero base.
 */
export function useExecKpi(): ExecKpiState {
  const repository = useData();
  const [status, setStatus] = useState<ExecKpiStatus>('loading');
  const [range, setRange] = useState<RangeId>('month');
  const [kpis, setKpis] = useState<ExecutiveKpis | null>(null);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<SeriesPoint[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [k, f, series] = await Promise.all([
        repository.getExecutiveKpis(),
        repository.getFunnel(),
        repository.getSeries('revenuePerDay'),
      ]);
      setKpis(k);
      setFunnelStages(f);
      setRevenueSeries(series);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void load();
    // A daily-starting-point screen refreshes itself rather than waiting on a
    // manual pull — every few minutes is enough for numbers that move slowly.
    const timer = window.setInterval(() => void load(), 3 * 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const cards = useMemo<KpiCard[]>(() => {
    if (!kpis) return [];

    const smallSample = (base: number) => base < SMALL_SAMPLE_BASE;

    return [
      {
        id: 'leads',
        labelKey: 'execKpi.card.leads',
        value: String(kpis.leadsThisMonth),
        trendPct: kpis.leadsThisMonth === 0 && kpis.leadsDelta === 0 ? null : kpis.leadsDelta,
        goodDirection: 'up',
        smallSample: smallSample(kpis.leadsThisMonth),
        drillPath: '/admin/analytics/funnel',
        hasData: kpis.leadsThisMonth > 0,
      },
      {
        id: 'conversion',
        labelKey: 'execKpi.card.conversion',
        value: formatPercent(kpis.conversionRate, 0),
        trendPct: kpis.conversionDelta,
        goodDirection: 'up',
        smallSample: false,
        drillPath: '/admin/analytics/funnel',
        hasData: true,
      },
      {
        id: 'revenue',
        labelKey: 'execKpi.card.revenue',
        value: formatINRCompact(kpis.revenueThisMonth),
        trendPct: kpis.revenueThisMonth === 0 ? null : kpis.revenueDelta,
        goodDirection: 'up',
        smallSample: false,
        drillPath: '/admin/analytics/revenue',
        hasData: kpis.revenueThisMonth > 0,
      },
      {
        id: 'avgDeal',
        labelKey: 'execKpi.card.margin',
        value: formatINRCompact(kpis.avgDealSize),
        trendPct: null,
        goodDirection: 'up',
        smallSample: false,
        drillPath: '/admin/analytics/revenue',
        hasData: kpis.avgDealSize > 0,
      },
      {
        id: 'activeJobs',
        labelKey: 'execKpi.card.activeJobs',
        value: String(kpis.activeJobs),
        trendPct: null,
        goodDirection: 'up',
        smallSample: false,
        drillPath: '/admin/map',
        hasData: kpis.activeJobs > 0,
      },
      {
        id: 'overdue',
        labelKey: 'execKpi.card.overdue',
        value: formatINRCompact(kpis.overdueAmount),
        trendPct: null,
        // Overdue is the one card where "more" is bad — inverted deliberately.
        goodDirection: 'down',
        smallSample: smallSample(kpis.overduePayments),
        drillPath: '/admin/analytics/finance',
        hasData: kpis.overduePayments > 0,
      },
    ];
  }, [kpis]);

  const funnel = useMemo<FunnelToCashStage[]>(
    () =>
      funnelStages
        .filter((s) => s.stage !== 'lost')
        .map((s) => ({
          id: s.stage,
          labelKey: FUNNEL_LABELS[s.stage],
          count: s.count,
          value: s.value,
        })),
    [funnelStages],
  );

  return {
    status,
    range,
    setRange,
    cards,
    funnel,
    revenueSeries,
    openAlerts: kpis?.openAlerts ?? 0,
    reload: load,
  };
}
