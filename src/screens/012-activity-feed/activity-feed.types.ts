/** Screen 012 — Live Activity Feed. Types and translation keys only. */

import type { ActivityEvent, ActivityKind } from '@/data/types';

export type FeedStatus = 'loading' | 'live' | 'empty' | 'error';

export type FeedModule = 'sales' | 'payments' | 'installation' | 'field' | 'system';

export const FEED_MODULES: FeedModule[] = ['sales', 'payments', 'installation', 'field', 'system'];

/**
 * Which module each event belongs to.
 *
 * Routine location pings are deliberately absent from the ActivityKind union
 * entirely — this feed is for business-meaningful events, and a ping is noise
 * that would bury the things an admin actually needs to see.
 */
export const MODULE_BY_KIND: Record<ActivityKind, FeedModule> = {
  lead_captured: 'sales',
  lead_stage_changed: 'sales',
  quote_sent: 'sales',
  deal_won: 'sales',
  deal_lost: 'sales',
  payment_received: 'payments',
  job_started: 'installation',
  job_step_completed: 'installation',
  job_completed: 'installation',
  qc_passed: 'installation',
  qc_failed: 'installation',
  surveyor_checked_in: 'field',
  technician_checked_in: 'field',
  automation_ran: 'system',
  alert_raised: 'system',
};

/** Where tapping an event should take you, when the record still exists. */
export const DEEP_LINK_BY_KIND: Partial<Record<ActivityKind, string>> = {
  lead_captured: '/admin/analytics/funnel',
  lead_stage_changed: '/admin/analytics/funnel',
  quote_sent: '/admin/analytics/revenue',
  deal_won: '/admin/analytics/revenue',
  deal_lost: '/admin/analytics/funnel',
  payment_received: '/admin/analytics/finance',
  job_started: '/admin/map',
  job_step_completed: '/admin/map',
  job_completed: '/admin/map',
  qc_passed: '/admin/alerts',
  qc_failed: '/admin/alerts',
  surveyor_checked_in: '/admin/site-visits',
  technician_checked_in: '/admin/map',
  automation_ran: '/admin/analytics/automation',
  alert_raised: '/admin/escalations',
};

/** One day's worth of events, already sorted. */
export interface FeedDay {
  /** ISO date, used as a stable key. */
  date: string;
  events: ActivityEvent[];
}

export const PAGE_SIZE = 25;

export const ACTIVITY_KEYS = {
  title: 'activityFeed.title',
  subtitle: 'activityFeed.subtitle',
  loading: 'activityFeed.loading',
  loadMore: 'activityFeed.loadMore',
  allLoaded: 'activityFeed.allLoaded',
  newEvents: 'activityFeed.newEvents',
  filterByModule: 'activityFeed.filterByModule',
  filterByPerson: 'activityFeed.filterByPerson',
  allPeople: 'activityFeed.allPeople',
  automated: 'activityFeed.automated',
  recordGone: 'activityFeed.recordGone',
  module: {
    sales: 'activityFeed.module.sales',
    payments: 'activityFeed.module.payments',
    installation: 'activityFeed.module.installation',
    field: 'activityFeed.module.field',
    system: 'activityFeed.module.system',
  },
  kind: {
    lead_captured: 'activityFeed.kind.lead_captured',
    lead_stage_changed: 'activityFeed.kind.lead_stage_changed',
    quote_sent: 'activityFeed.kind.quote_sent',
    deal_won: 'activityFeed.kind.deal_won',
    deal_lost: 'activityFeed.kind.deal_lost',
    payment_received: 'activityFeed.kind.payment_received',
    job_started: 'activityFeed.kind.job_started',
    job_step_completed: 'activityFeed.kind.job_step_completed',
    job_completed: 'activityFeed.kind.job_completed',
    qc_passed: 'activityFeed.kind.qc_passed',
    qc_failed: 'activityFeed.kind.qc_failed',
    surveyor_checked_in: 'activityFeed.kind.surveyor_checked_in',
    technician_checked_in: 'activityFeed.kind.technician_checked_in',
    automation_ran: 'activityFeed.kind.automation_ran',
    alert_raised: 'activityFeed.kind.alert_raised',
  },
  empty: { title: 'activityFeed.empty.title', body: 'activityFeed.empty.body' },
  error: { title: 'activityFeed.error.title', body: 'activityFeed.error.body' },
} as const;
