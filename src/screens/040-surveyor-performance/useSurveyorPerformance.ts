import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Badge as BadgeRecord, Lead, SiteVisitVerification } from '@/data/types';
import type { SurveyorScore } from '@/data/repository';
import { BADGE_DEFS } from './surveyor-performance.types';
import type { PerformanceStatus, TrendPoint } from './surveyor-performance.types';

interface PerformanceState {
  status: PerformanceStatus;
  leadsCaptured: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  accuracyRate: number;
  trend: TrendPoint[];
  rank: number | null;
  totalPeers: number;
  badges: BadgeRecord[];
  reload: () => Promise<void>;
}

/**
 * Owns the surveyor's own performance and rewards.
 *
 * Every figure is a read-only reflection of data owned elsewhere — leads,
 * scores, site verifications — never a separate number computed a second way.
 * Badge criteria live in one place (`BADGE_DEFS`) so what a surveyor sees
 * they've earned can never drift from what actually earns it.
 */
export function useSurveyorPerformance(): PerformanceState {
  const repository = useData();
  const { user } = useSession();

  const [status, setStatus] = useState<PerformanceStatus>('loading');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<SiteVisitVerification[]>([]);
  const [scores, setScores] = useState<SurveyorScore[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    try {
      const [leadList, visitList, scoreList] = await Promise.all([
        repository.listLeads({ surveyorId: user.id }),
        repository.listSiteVisits(),
        repository.getSurveyorScores(),
      ]);
      setLeads(leadList);
      setVisits(visitList.filter((v) => v.surveyorId === user.id));
      setScores(scoreList);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const conversions = leads.filter((l) => l.stage === 'won').length;
  const closed = leads.filter((l) => l.stage === 'won' || l.stage === 'lost').length;
  const conversionRate = closed > 0 ? conversions / closed : 0;
  const revenue = leads.filter((l) => l.stage === 'won').reduce((sum, l) => sum + l.estimatedValue, 0);

  const flaggedCount = visits.filter((v) => v.status === 'flagged' || v.status === 'rejected').length;
  const accuracyRate = visits.length > 0 ? 1 - flaggedCount / visits.length : 1;

  // A real trend, built from each lead's own capture week — not invented.
  const trend = useMemo<TrendPoint[]>(() => {
    const byWeek = new Map<string, number>();
    for (const lead of leads) {
      const date = new Date(lead.createdAt);
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay());
      const key = monday.toISOString().slice(0, 10);
      byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
    }
    return [...byWeek.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([t, leadsCount]) => ({ t, leads: leadsCount }));
  }, [leads]);

  const ranked = useMemo(() => [...scores].sort((a, b) => b.revenue - a.revenue), [scores]);
  const rankIndex = ranked.findIndex((s) => s.userId === user?.id);

  const badges = useMemo<BadgeRecord[]>(
    () =>
      BADGE_DEFS.map((def) => {
        const progress = def.getProgress({ leadsCaptured: leads.length, conversions, flaggedCount, conversionRate });
        return {
          id: def.id,
          labelKey: def.labelKey,
          descriptionKey: def.descriptionKey,
          earned: progress >= def.target,
          progress: Math.min(progress, def.target),
          target: def.target,
        };
      }),
    [leads.length, conversions, flaggedCount, conversionRate],
  );

  return {
    status,
    leadsCaptured: leads.length,
    conversions,
    conversionRate,
    revenue,
    accuracyRate,
    trend,
    rank: rankIndex === -1 ? null : rankIndex + 1,
    totalPeers: ranked.length,
    badges,
    reload: load,
  };
}
