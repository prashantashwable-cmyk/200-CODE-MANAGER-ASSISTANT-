/** Screen 015 — Geo-fence & Territory Management. Types and keys only. */

import type { GeoZone, User } from '@/data/types';

export type TerritoryStatus = 'loading' | 'ready' | 'empty' | 'error';

export interface TerritoryStats {
  leadsTotal: number;
  leadsThisMonth: number;
  conversions: number;
  conversionRate: number;
  areaKm2: number;
  /** Leads per km², so a small dense zone is not judged against a sprawling one. */
  density: number;
  assignedSurveyors: User[];
}

export interface TerritoryRow {
  zone: GeoZone;
  stats: TerritoryStats;
  /** Other zones this one overlaps. Allowed, but it should be deliberate. */
  overlapsWith: string[];
  /** Warnings that should block or at least interrupt a save. */
  problems: TerritoryProblem[];
}

export type TerritoryProblem =
  | 'noSurveyor'
  | 'selfIntersecting'
  | 'tooSmall'
  | 'overlapping'
  | 'draft';

/** Below this a hand-drawn shape is almost certainly a mis-drag. */
export const MIN_SENSIBLE_AREA_KM2 = 0.25;

/** How far the bounding-box nudge controls move an edge, in degrees. */
export const NUDGE_STEP = 0.005;

export const TERRITORY_KEYS = {
  title: 'territories.title',
  subtitle: 'territories.subtitle',
  loading: 'territories.loading',
  mapLabel: 'territories.mapLabel',
  unassignedHeading: 'territories.unassignedHeading',
  unassignedBody: 'territories.unassignedBody',
  unassignedCount: 'territories.unassignedCount',
  editorNote: 'territories.editorNote',
  save: 'territories.save',
  saved: 'territories.saved',
  activate: 'territories.activate',
  makeDraft: 'territories.makeDraft',
  assignHeading: 'territories.assignHeading',
  boundsHeading: 'territories.boundsHeading',
  bound: {
    north: 'territories.bound.north',
    south: 'territories.bound.south',
    east: 'territories.bound.east',
    west: 'territories.bound.west',
    grow: 'territories.bound.grow',
    shrink: 'territories.bound.shrink',
  },
  stat: {
    leadsMonth: 'territories.stat.leadsMonth',
    leadsTotal: 'territories.stat.leadsTotal',
    conversion: 'territories.stat.conversion',
    area: 'territories.stat.area',
    density: 'territories.stat.density',
    surveyors: 'territories.stat.surveyors',
  },
  problem: {
    noSurveyor: 'territories.problem.noSurveyor',
    selfIntersecting: 'territories.problem.selfIntersecting',
    tooSmall: 'territories.problem.tooSmall',
    overlapping: 'territories.problem.overlapping',
    draft: 'territories.problem.draft',
  },
  overlapNote: 'territories.overlapNote',
  tieBreakNote: 'territories.tieBreakNote',
  forwardOnlyNote: 'territories.forwardOnlyNote',
  empty: { title: 'territories.empty.title', body: 'territories.empty.body' },
  error: { title: 'territories.error.title', body: 'territories.error.body' },
} as const;
