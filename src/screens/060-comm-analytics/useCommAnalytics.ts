import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { ChannelStat, SeriesPoint, TemplateStat } from '@/data/types';
import type { CommAnalyticsStatus } from './comm-analytics.types';
import { POOR_PERFORMER_THRESHOLD_PCT } from './comm-analytics.types';

interface CommAnalyticsState {
  status: CommAnalyticsStatus;
  channelStats: ChannelStat[];
  templateStats: TemplateStat[];
  volumeTrend: SeriesPoint[];
  slaCompliancePct: number;
  outageNoteKey?: string;
  totals: { totalSent: number; overallResponseRatePct: number; totalCost: number };
  averageResponseRatePct: number;
  medianResponseRatePct: number;
  poorPerformers: TemplateStat[];
  reload: () => Promise<void>;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Owns the Communication Analytics dashboard — a read-only view over the
 * same channel/template/SLA figures the repository already computes from
 * real message and reply-inbox records. Nothing here can be edited; fixing
 * a poor performer means going back to the Templates Library.
 */
export function useCommAnalytics(): CommAnalyticsState {
  const repository = useData();
  const [status, setStatus] = useState<CommAnalyticsStatus>('loading');
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([]);
  const [templateStats, setTemplateStats] = useState<TemplateStat[]>([]);
  const [volumeTrend, setVolumeTrend] = useState<SeriesPoint[]>([]);
  const [slaCompliancePct, setSlaCompliancePct] = useState(1);
  const [outageNoteKey, setOutageNoteKey] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const analytics = await repository.getCommunicationAnalytics();
      setChannelStats(analytics.channelStats);
      setTemplateStats([...analytics.templateStats].sort((a, b) => b.responseRatePct - a.responseRatePct));
      setVolumeTrend(analytics.volumeTrend);
      setSlaCompliancePct(analytics.slaCompliancePct);
      setOutageNoteKey(analytics.outageNote);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const totalSent = channelStats.reduce((sum, c) => sum + c.totalSent, 0);
    const totalResponded = channelStats.reduce((sum, c) => sum + Math.round(c.totalSent * c.responseRatePct), 0);
    const totalCost = channelStats.reduce((sum, c) => sum + c.cost, 0);
    return { totalSent, overallResponseRatePct: totalSent ? totalResponded / totalSent : 0, totalCost };
  }, [channelStats]);

  const matureRates = useMemo(
    () => templateStats.filter((t) => !t.earlyData).map((t) => t.responseRatePct),
    [templateStats],
  );
  const averageResponseRatePct = matureRates.length ? matureRates.reduce((sum, v) => sum + v, 0) / matureRates.length : 0;
  const medianResponseRatePct = median(matureRates);

  const poorPerformers = useMemo(
    () => templateStats.filter((t) => !t.earlyData && t.responseRatePct < POOR_PERFORMER_THRESHOLD_PCT),
    [templateStats],
  );

  return {
    status,
    channelStats,
    templateStats,
    volumeTrend,
    slaCompliancePct,
    outageNoteKey,
    totals,
    averageResponseRatePct,
    medianResponseRatePct,
    poorPerformers,
    reload: load,
  };
}
