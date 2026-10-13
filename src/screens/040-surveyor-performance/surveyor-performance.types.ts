/** Screen 040 — Surveyor Performance & Rewards. Types and translation keys only. */

export type PerformanceStatus = 'loading' | 'ready' | 'error';

export type BadgeId =
  | 'firstLead'
  | 'tenLeads'
  | 'fiftyLeads'
  | 'hotStreak'
  | 'cleanRecord'
  | 'topConverter';

/**
 * Badge criteria, defined once here so what a surveyor sees they've earned can
 * never drift from what actually earns it — this is the one place the rule
 * lives, standing in for a central Training & Rewards configuration this
 * build does not model separately.
 */
export interface BadgeDef {
  id: BadgeId;
  labelKey: string;
  descriptionKey: string;
  target: number;
  getProgress: (stats: { leadsCaptured: number; conversions: number; flaggedCount: number; conversionRate: number }) => number;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'firstLead', labelKey: 'surveyorPerformance.badge.firstLead.label', descriptionKey: 'surveyorPerformance.badge.firstLead.description', target: 1, getProgress: (s) => s.leadsCaptured },
  { id: 'tenLeads', labelKey: 'surveyorPerformance.badge.tenLeads.label', descriptionKey: 'surveyorPerformance.badge.tenLeads.description', target: 10, getProgress: (s) => s.leadsCaptured },
  { id: 'fiftyLeads', labelKey: 'surveyorPerformance.badge.fiftyLeads.label', descriptionKey: 'surveyorPerformance.badge.fiftyLeads.description', target: 50, getProgress: (s) => s.leadsCaptured },
  { id: 'hotStreak', labelKey: 'surveyorPerformance.badge.hotStreak.label', descriptionKey: 'surveyorPerformance.badge.hotStreak.description', target: 3, getProgress: (s) => s.conversions },
  { id: 'cleanRecord', labelKey: 'surveyorPerformance.badge.cleanRecord.label', descriptionKey: 'surveyorPerformance.badge.cleanRecord.description', target: 1, getProgress: (s) => (s.flaggedCount === 0 && s.leadsCaptured >= 5 ? 1 : 0) },
  { id: 'topConverter', labelKey: 'surveyorPerformance.badge.topConverter.label', descriptionKey: 'surveyorPerformance.badge.topConverter.description', target: 1, getProgress: (s) => (s.conversionRate >= 0.5 ? 1 : 0) },
];

export interface TrendPoint {
  t: string;
  leads: number;
}

export const SURVEYOR_PERFORMANCE_KEYS = {
  title: 'surveyorPerformance.title',
  subtitle: 'surveyorPerformance.subtitle',
  loading: 'surveyorPerformance.loading',
  stat: {
    leads: 'surveyorPerformance.stat.leads',
    conversion: 'surveyorPerformance.stat.conversion',
    revenue: 'surveyorPerformance.stat.revenue',
    accuracy: 'surveyorPerformance.stat.accuracy',
  },
  trendHeading: 'surveyorPerformance.trendHeading',
  rankHeading: 'surveyorPerformance.rankHeading',
  rankValue: 'surveyorPerformance.rankValue',
  rankEncouragement: 'surveyorPerformance.rankEncouragement',
  contest: {
    heading: 'surveyorPerformance.contest.heading',
    standing: 'surveyorPerformance.contest.standing',
    prize: 'surveyorPerformance.contest.prize',
    inProgress: 'surveyorPerformance.contest.inProgress',
    none: {
      title: 'surveyorPerformance.contest.none.title',
      body: 'surveyorPerformance.contest.none.body',
    },
  },
  badgesHeading: 'surveyorPerformance.badgesHeading',
  badge: {
    firstLead: { label: 'surveyorPerformance.badge.firstLead.label', description: 'surveyorPerformance.badge.firstLead.description' },
    tenLeads: { label: 'surveyorPerformance.badge.tenLeads.label', description: 'surveyorPerformance.badge.tenLeads.description' },
    fiftyLeads: { label: 'surveyorPerformance.badge.fiftyLeads.label', description: 'surveyorPerformance.badge.fiftyLeads.description' },
    hotStreak: { label: 'surveyorPerformance.badge.hotStreak.label', description: 'surveyorPerformance.badge.hotStreak.description' },
    cleanRecord: { label: 'surveyorPerformance.badge.cleanRecord.label', description: 'surveyorPerformance.badge.cleanRecord.description' },
    topConverter: { label: 'surveyorPerformance.badge.topConverter.label', description: 'surveyorPerformance.badge.topConverter.description' },
  },
  badgeEarned: 'surveyorPerformance.badgeEarned',
  badgeProgress: 'surveyorPerformance.badgeProgress',
  error: { title: 'surveyorPerformance.error.title', body: 'surveyorPerformance.error.body' },
} as const;
