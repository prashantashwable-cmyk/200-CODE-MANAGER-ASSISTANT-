/** Screen 039 — Surveyor Daily Route Plan. Types and translation keys only. */

import type { RouteStop } from '@/data/types';

export type RoutePlanStatus = 'loading' | 'ready' | 'empty' | 'error';

export interface DaySummary {
  plannedCount: number;
  doneCount: number;
  skippedCount: number;
  remainingCount: number;
}

export const ROUTE_PLAN_KEYS = {
  title: 'routePlan.title',
  subtitle: 'routePlan.subtitle',
  loading: 'routePlan.loading',
  mapLabel: 'routePlan.mapLabel',
  advisoryNote: 'routePlan.advisoryNote',
  summary: {
    planned: 'routePlan.summary.planned',
    done: 'routePlan.summary.done',
    skipped: 'routePlan.summary.skipped',
    remaining: 'routePlan.summary.remaining',
  },
  totals: {
    distance: 'routePlan.totals.distance',
    time: 'routePlan.totals.time',
  },
  stop: {
    window: 'routePlan.stop.window',
    leg: 'routePlan.stop.leg',
    navigate: 'routePlan.stop.navigate',
    arrive: 'routePlan.stop.arrive',
    complete: 'routePlan.stop.complete',
    skip: 'routePlan.stop.skip',
    moveUp: 'routePlan.stop.moveUp',
    moveDown: 'routePlan.stop.moveDown',
  },
  status: {
    pending: 'routePlan.status.pending',
    arrived: 'routePlan.status.arrived',
    done: 'routePlan.status.done',
    skipped: 'routePlan.status.skipped',
  },
  exploration: {
    title: 'routePlan.exploration.title',
    body: 'routePlan.exploration.body',
  },
  empty: { title: 'routePlan.empty.title', body: 'routePlan.empty.body', action: 'routePlan.empty.action' },
  error: { title: 'routePlan.error.title', body: 'routePlan.error.body' },
} as const;
