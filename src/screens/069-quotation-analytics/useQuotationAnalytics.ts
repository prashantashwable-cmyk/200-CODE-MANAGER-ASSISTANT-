import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { QuotationAnalytics } from '@/data/repository';
import type { Lead, Quotation } from '@/data/types';
import type { DrillKind, DrillRow, QuotationAnalyticsStatus, SegmentFilter } from './quotation-analytics.types';

interface QuotationAnalyticsState {
  status: QuotationAnalyticsStatus;
  analytics: QuotationAnalytics | null;

  segment: SegmentFilter;
  setSegment: (segment: SegmentFilter) => void;

  overallWinRatePct: number;
  totalQuotesCount: number;
  totalDecidedCount: number;
  totalWonCount: number;
  totalLostCount: number;

  drillKind: DrillKind | null;
  drillTitle: string;
  drillRows: DrillRow[];
  openDrill: (kind: DrillKind, title: string, ids: string[]) => void;
  closeDrill: () => void;

  reload: () => Promise<void>;
}

function drillRowsFromQuotationIds(ids: string[], quotations: Quotation[], leads: Lead[]): DrillRow[] {
  return ids
    .map((quotationId): DrillRow | null => {
      const q = quotations.find((x) => x.id === quotationId);
      const lead = q ? leads.find((l) => l.id === q.leadId) : undefined;
      if (!q || !lead) return null;
      return {
        leadId: lead.id,
        siteName: lead.siteName,
        builderName: lead.builderName,
        quotationCode: q.code,
        finalPrice: q.cost.finalPrice,
        stage: lead.stage,
      };
    })
    .filter((row): row is DrillRow => row !== null);
}

function drillRowsFromLeadIds(ids: string[], leads: Lead[]): DrillRow[] {
  return ids
    .map((leadId): DrillRow | null => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return null;
      return { leadId: lead.id, siteName: lead.siteName, builderName: lead.builderName, stage: lead.stage };
    })
    .filter((row): row is DrillRow => row !== null);
}

/**
 * Owns the win/loss analytics dashboard and its drill-through. Every stat
 * card is backed by real quotation/lead ids returned by the repository, so
 * "which quotes actually produced this number" is always one tap away
 * rather than a client-side re-derivation that could drift from it.
 */
export function useQuotationAnalytics(): QuotationAnalyticsState {
  const repository = useData();
  const [status, setStatus] = useState<QuotationAnalyticsStatus>('loading');
  const [analytics, setAnalytics] = useState<QuotationAnalytics | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [segment, setSegment] = useState<SegmentFilter>('all');

  const [drillKind, setDrillKind] = useState<DrillKind | null>(null);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillIds, setDrillIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const [analyticsResult, quotationList, leadList] = await Promise.all([
        repository.getQuotationAnalytics(segment === 'all' ? undefined : { segment }),
        repository.listQuotations(),
        repository.listLeads(),
      ]);
      setAnalytics(analyticsResult);
      setQuotations(quotationList);
      setLeads(leadList);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, segment]);

  useEffect(() => {
    void load();
  }, [load]);

  const { overallWinRatePct, totalQuotesCount, totalDecidedCount, totalWonCount, totalLostCount } = useMemo(() => {
    if (!analytics) return { overallWinRatePct: 0, totalQuotesCount: 0, totalDecidedCount: 0, totalWonCount: 0, totalLostCount: 0 };
    const totalWon = analytics.byPackageTier.reduce((sum, row) => sum + row.wonCount, 0);
    const totalLost = analytics.commonLossFactors.reduce((sum, row) => sum + row.count, 0);
    const decided = totalWon + totalLost;
    return {
      overallWinRatePct: decided ? totalWon / decided : 0,
      totalQuotesCount: analytics.byPackageTier.reduce((sum, row) => sum + row.quotesCount, 0),
      totalDecidedCount: decided,
      totalWonCount: totalWon,
      totalLostCount: totalLost,
    };
  }, [analytics]);

  const openDrill = useCallback((kind: DrillKind, title: string, ids: string[]) => {
    setDrillKind(kind);
    setDrillTitle(title);
    setDrillIds(ids);
  }, []);
  const closeDrill = useCallback(() => setDrillKind(null), []);

  const drillRows = useMemo(() => {
    if (!drillKind) return [];
    return drillKind === 'lossFactor' ? drillRowsFromLeadIds(drillIds, leads) : drillRowsFromQuotationIds(drillIds, quotations, leads);
  }, [drillKind, drillIds, quotations, leads]);

  return {
    status,
    analytics,
    segment,
    setSegment,
    overallWinRatePct,
    totalQuotesCount,
    totalDecidedCount,
    totalWonCount,
    totalLostCount,
    drillKind,
    drillTitle,
    drillRows,
    openDrill,
    closeDrill,
    reload: load,
  };
}
