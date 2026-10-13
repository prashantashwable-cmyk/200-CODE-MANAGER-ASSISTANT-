import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { formatINRCompact, formatPercent } from '@/design-system';
import type { SurveyorScore, TechnicianScore } from '@/data/repository';
import {
  NEW_JOINER_DAYS,
  TREND_WEEKS,
  SURVEYOR_METRICS,
  TECHNICIAN_METRICS,
} from './leaderboard.types';
import type { Cohort, LeaderboardRow, LeaderboardStatus, MetricId, PeriodId, ViewMode } from './leaderboard.types';

interface LeaderboardState {
  status: LeaderboardStatus;
  cohort: Cohort;
  setCohort: (cohort: Cohort) => void;
  period: PeriodId;
  setPeriod: (period: PeriodId) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  metric: MetricId;
  setMetric: (metric: MetricId) => void;
  availableMetrics: MetricId[];
  rows: LeaderboardRow[];
  excludeWorker: (userId: string, reason: string) => void;
  includeWorker: (userId: string) => void;
  reload: () => Promise<void>;
}

function joinedWithin(joinedAt: string | undefined, days: number): boolean {
  if (!joinedAt) return false;
  return Date.now() - new Date(joinedAt).getTime() < days * 86_400_000;
}

/** The weekly series behind a metric (oldest first, real dated records). A rate has none: a share of a few events per week would only wobble. */
function seriesOf(metricId: MetricId, s: SurveyorScore | TechnicianScore): number[] {
  if ('leadsCaptured' in s) {
    if (metricId === 'revenue') return s.weeklyRevenue;
    if (metricId === 'leadsConverted') return s.weeklyConversions;
    return [];
  }
  return metricId === 'jobsCompleted' ? s.weeklyJobs : [];
}

/** The count series "rising stars" compares, also for a rate metric (its underlying wins or finished jobs). */
function trendSeriesOf(metricId: MetricId, s: SurveyorScore | TechnicianScore): number[] {
  if ('leadsCaptured' in s) return metricId === 'revenue' ? s.weeklyRevenue : s.weeklyConversions;
  return s.weeklyJobs;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** The last `TREND_WEEKS` weeks against the ones before. Null when there was nothing before to compare with. */
function improvementOf(series: number[]): number | null {
  const recent = sum(series.slice(-TREND_WEEKS));
  const before = sum(series.slice(-2 * TREND_WEEKS, -TREND_WEEKS));
  return before > 0 ? (recent - before) / before : null;
}

/**
 * Owns the leaderboard.
 *
 * Ranking metric is admin-configurable per the spec — "best surveyor" changes
 * meaning depending on what the business cares about that period, so the
 * metric is a live selector rather than one hardcoded sort. Ties break on a
 * genuine secondary metric rather than sharing an ambiguous rank.
 */
export function useLeaderboard(): LeaderboardState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<LeaderboardStatus>('loading');
  const [cohort, setCohortState] = useState<Cohort>('surveyor');
  const [period, setPeriod] = useState<PeriodId>('month');
  const [view, setView] = useState<ViewMode>('ranked');
  const [metric, setMetric] = useState<MetricId>('leadsConverted');
  const [surveyorScores, setSurveyorScores] = useState<SurveyorScore[]>([]);
  const [technicianScores, setTechnicianScores] = useState<TechnicianScore[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [joinDates, setJoinDates] = useState<Record<string, string | undefined>>({});
  // Shared with every other view of the ranking (the partners' contest standings read it too), so it lives in the repository, not on this device.
  const [exclusions, setExclusions] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const [surveyors, technicians, allUsers, excluded] = await Promise.all([
        repository.getSurveyorScores(),
        repository.getTechnicianScores(),
        repository.listUsers(),
        repository.listLeaderboardExclusions(),
      ]);
      setExclusions(Object.fromEntries(excluded.map((x) => [x.userId, x.reason])));
      setSurveyorScores(surveyors);
      setTechnicianScores(technicians);
      setUsers(Object.fromEntries(allUsers.map((u) => [u.id, u.name])));
      setJoinDates(Object.fromEntries(allUsers.map((u) => [u.id, u.joinedAt])));
      setStatus(surveyors.length + technicians.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setCohort = useCallback((next: Cohort) => {
    setCohortState(next);
    setMetric(next === 'surveyor' ? 'leadsConverted' : 'jobsCompleted');
  }, []);

  const rows = useMemo<LeaderboardRow[]>(() => {
    // Counts follow the chosen period from the weekly records (last 7 days, last 4 weeks, everything); a rate is always all time.
    const buildValue = (metricId: MetricId, s: SurveyorScore | TechnicianScore): number | null => {
      const series = seriesOf(metricId, s);
      if (series.length > 0 && period !== 'allTime') return sum(series.slice(period === 'week' ? -1 : -TREND_WEEKS));
      if ('leadsCaptured' in s) {
        if (metricId === 'leadsConverted') return s.conversions;
        if (metricId === 'conversionRate') return s.conversionRate;
        if (metricId === 'revenue') return s.revenue;
        return 0;
      }
      if (metricId === 'jobsCompleted') return s.jobsCompleted;
      if (metricId === 'qualityScore') return s.qcPassRate;
      return 0;
    };
    const displayValue = (metricId: MetricId, value: number | null): string | null => {
      if (value === null) return null;
      if (metricId === 'conversionRate' || metricId === 'qualityScore') return formatPercent(value, 0);
      if (metricId === 'revenue') return formatINRCompact(value);
      return String(value);
    };

    const source: (SurveyorScore | TechnicianScore)[] =
      cohort === 'surveyor' ? surveyorScores : technicianScores;

    const withValues = source.map((s) => {
      const userId = s.userId;
      const primaryValue = buildValue(metric, s);
      // The secondary metric — rating — is what breaks a tie honestly rather
      // than leaving two people sharing an ambiguous #1.
      const secondaryValue = s.rating;
      const joinedAt = joinDates[userId];
      const isNewJoiner = joinedWithin(joinedAt, NEW_JOINER_DAYS);
      const sparkline = seriesOf(metric, s);
      const improvementPct = improvementOf(trendSeriesOf(metric, s));

      return {
        userId,
        name: users[userId] ?? s.name,
        rank: 0,
        primaryValue: primaryValue ?? -1,
        primaryDisplay: displayValue(metric, primaryValue),
        secondaryValue,
        secondaryDisplay: secondaryValue.toFixed(1),
        sparkline,
        improvementPct,
        isNewJoiner,
        excluded: Boolean(exclusions[userId]),
        excludedReason: exclusions[userId],
      };
    });

    // Only someone with something on record takes a place; "not rated yet" is listed after, without a place or a medal.
    const ranked = withValues
      .filter((r) => !r.excluded && r.primaryDisplay !== null)
      .sort((a, b) => b.primaryValue - a.primaryValue || b.secondaryValue - a.secondaryValue)
      .map((r, i) => ({ ...r, rank: i + 1 }));
    const unrated = withValues.filter((r) => !r.excluded && r.primaryDisplay === null).map((r) => ({ ...r, rank: 0 }));
    const excludedRows = withValues.filter((r) => r.excluded).map((r) => ({ ...r, rank: 0 }));

    if (view === 'risingStars') {
      // A rising star actually rose: only a real increase takes a place; a fall or no history is listed after, unranked.
      const active = withValues.filter((r) => !r.excluded);
      const rising = active
        .filter((r) => r.improvementPct !== null && r.improvementPct > 0)
        .sort((a, b) => (b.improvementPct ?? 0) - (a.improvementPct ?? 0) || b.secondaryValue - a.secondaryValue)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      const rest = active
        .filter((r) => !(r.improvementPct !== null && r.improvementPct > 0))
        .sort((a, b) => (b.improvementPct ?? -Infinity) - (a.improvementPct ?? -Infinity) || b.secondaryValue - a.secondaryValue)
        .map((r) => ({ ...r, rank: 0 }));
      return [...rising, ...rest];
    }
    return [...ranked, ...unrated, ...excludedRows];
  }, [cohort, metric, period, view, surveyorScores, technicianScores, users, joinDates, exclusions]);

  const excludeWorker = useCallback((userId: string, reason: string) => {
    if (!user) return;
    setExclusions((current) => ({ ...current, [userId]: reason || 'flagged for review' }));
    void repository.setLeaderboardExclusion(userId, reason || 'flagged for review', user.id).catch(() => void reload());
  }, [repository, user, reload]);

  const includeWorker = useCallback((userId: string) => {
    if (!user) return;
    setExclusions((current) => { const next = { ...current }; delete next[userId]; return next; });
    void repository.setLeaderboardExclusion(userId, null, user.id).catch(() => void reload());
  }, [repository, user, reload]);

  return {
    status,
    cohort,
    setCohort,
    period,
    setPeriod,
    view,
    setView,
    metric,
    setMetric,
    availableMetrics: cohort === 'surveyor' ? SURVEYOR_METRICS : TECHNICIAN_METRICS,
    rows,
    excludeWorker,
    includeWorker,
    reload,
  };
}
