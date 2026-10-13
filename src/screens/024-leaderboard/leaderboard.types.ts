/** Screen 024 — Worker Performance Leaderboard. Types and translation keys only. */

export type LeaderboardStatus = 'loading' | 'ready' | 'empty' | 'error';

export type Cohort = 'surveyor' | 'technician';

export type PeriodId = 'week' | 'month' | 'allTime';

export const PERIODS: PeriodId[] = ['week', 'month', 'allTime'];

/** Which number ranks the list — configurable per the spec's business-priority rule. */
export type MetricId =
  | 'leadsConverted'
  | 'conversionRate'
  | 'revenue'
  | 'jobsCompleted'
  | 'qualityScore';

export const SURVEYOR_METRICS: MetricId[] = ['leadsConverted', 'conversionRate', 'revenue'];
export const TECHNICIAN_METRICS: MetricId[] = ['jobsCompleted', 'qualityScore'];

export type ViewMode = 'ranked' | 'risingStars';

export interface LeaderboardRow {
  userId: string;
  name: string;
  rank: number;
  primaryValue: number;
  /** Null when nothing is on record to judge (e.g. no quality check yet): shown as "not rated yet", ranked last. */
  primaryDisplay: string | null;
  /** The tiebreaker, shown so a tie never looks arbitrary. */
  secondaryValue: number;
  secondaryDisplay: string;
  /** Real weekly counts, oldest first; empty for a rate metric. */
  sparkline: number[];
  /** Last 4 weeks against the 4 before, from dated records; null when there was nothing before. Powers "rising stars". */
  improvementPct: number | null;
  isNewJoiner: boolean;
  /** Set when an admin has pulled this person out of ranking pending review. */
  excluded: boolean;
  excludedReason?: string;
}

/** Below this tenure, comparing a full period's numbers is unfair. */
export const NEW_JOINER_DAYS = 14;

/** Weeks compared for "rising stars" and counted for the 4-week period. */
export const TREND_WEEKS = 4;

export const LEADERBOARD_KEYS = {
  title: 'leaderboard.title',
  subtitle: 'leaderboard.subtitle',
  loading: 'leaderboard.loading',
  cohort: { surveyor: 'leaderboard.cohort.surveyor', technician: 'leaderboard.cohort.technician' },
  period: { week: 'leaderboard.period.week', month: 'leaderboard.period.month', allTime: 'leaderboard.period.allTime' },
  view: { ranked: 'leaderboard.view.ranked', risingStars: 'leaderboard.view.risingStars' },
  metric: {
    label: 'leaderboard.metric.label',
    leadsConverted: 'leaderboard.metric.leadsConverted',
    conversionRate: 'leaderboard.metric.conversionRate',
    revenue: 'leaderboard.metric.revenue',
    jobsCompleted: 'leaderboard.metric.jobsCompleted',
    qualityScore: 'leaderboard.metric.qualityScore',
  },
  tieBreak: 'leaderboard.tieBreak',
  newJoinerNote: 'leaderboard.newJoinerNote',
  excluded: 'leaderboard.excluded',
  excludedNote: 'leaderboard.excludedNote',
  exclude: 'leaderboard.exclude',
  include: 'leaderboard.include',
  excludeReasonPrompt: 'leaderboard.excludeReasonPrompt',
  rewardsSyncNote: 'leaderboard.rewardsSyncNote',
  improvement: 'leaderboard.improvement',
  noTrend: 'leaderboard.noTrend',
  notRated: 'leaderboard.notRated',
  rateAllTime: 'leaderboard.rateAllTime',
  small: 'leaderboard.small',
  empty: { title: 'leaderboard.empty.title', body: 'leaderboard.empty.body' },
  error: { title: 'leaderboard.error.title', body: 'leaderboard.error.body' },
} as const;
