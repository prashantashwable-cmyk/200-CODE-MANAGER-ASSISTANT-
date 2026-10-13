/** Screen 031 — Surveyor Home / My Tasks. Types and translation keys only. */

import type { RouteStop } from '@/data/types';

export type SurveyorHomeStatus = 'loading' | 'ready' | 'error';

export interface FollowUpTask {
  stop: RouteStop;
  overdue: boolean;
}

export interface SurveyorHomeData {
  leadsToday: number;
  followUps: FollowUpTask[];
  weeklyCommission: number;
  currentRank: number | null;
  totalActiveSurveyors: number;
  lastSyncedAt: string;
  isFirstDay: boolean;
}

export const SURVEYOR_HOME_KEYS = {
  title: 'surveyorHome.title',
  greeting: 'surveyorHome.greeting',
  loading: 'surveyorHome.loading',
  captureNew: 'surveyorHome.captureNew',
  stat: {
    leadsToday: 'surveyorHome.stat.leadsToday',
    followUpsDue: 'surveyorHome.stat.followUpsDue',
    weeklyCommission: 'surveyorHome.stat.weeklyCommission',
    rank: 'surveyorHome.stat.rank',
  },
  rankValue: 'surveyorHome.rankValue',
  followUpsHeading: 'surveyorHome.followUpsHeading',
  followUpsEmpty: 'surveyorHome.followUpsEmpty',
  overdue: 'surveyorHome.overdue',
  dueAt: 'surveyorHome.dueAt',
  quickLinks: 'surveyorHome.quickLinks',
  link: { route: 'surveyorHome.link.route', leads: 'surveyorHome.link.leads', earnings: 'surveyorHome.link.earnings', performance: 'surveyorHome.link.performance' },
  firstDay: { title: 'surveyorHome.firstDay.title', body: 'surveyorHome.firstDay.body' },
  lastSynced: 'surveyorHome.lastSynced',
  offlineNote: 'surveyorHome.offlineNote',
  error: { title: 'surveyorHome.error.title', body: 'surveyorHome.error.body' },
} as const;
