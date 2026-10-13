/** Screen 016 — Heatmap, lead density by area. Types and keys only. */

import type { GeoZone, Lead } from '@/data/types';

export type HeatmapStatus = 'loading' | 'ready' | 'empty' | 'error';

/** What the heat is measuring. Switching reveals conversion gaps geographically. */
export type HeatMetric = 'leads' | 'deals';

export type RangeId = '7' | '30' | '90';

export const RANGES: RangeId[] = ['7', '30', '90'];

/**
 * A zone needs at least this many leads in the window before its colour means
 * anything. Below it, showing "cold" would be a claim the data cannot support.
 */
export const MIN_SAMPLE = 3;

export interface ZoneHeat {
  zone: GeoZone;
  leadCount: number;
  dealCount: number;
  areaKm2: number;
  /** Count per km². Normalising by area is what stops a big sparse zone
   *  looking busier than a small dense one purely because it is big. */
  density: number;
  /** 0..1 against the busiest zone in the window. */
  intensity: number;
  conversionRate: number;
  /** Change against the equally-long window immediately before this one. */
  changePct: number | null;
  hasEnoughData: boolean;
  /** True when AIEC had no coverage here for the whole window. */
  noCoverage: boolean;
  leads: Lead[];
}

export const HEATMAP_KEYS = {
  title: 'heatmap.title',
  subtitle: 'heatmap.subtitle',
  loading: 'heatmap.loading',
  mapLabel: 'heatmap.mapLabel',
  metric: { leads: 'heatmap.metric.leads', deals: 'heatmap.metric.deals' },
  range: {
    '7': 'heatmap.range.7',
    '30': 'heatmap.range.30',
    '90': 'heatmap.range.90',
  },
  normalisedNote: 'heatmap.normalisedNote',
  batchNote: 'heatmap.batchNote',
  ranking: 'heatmap.ranking',
  drillIn: 'heatmap.drillIn',
  notEnoughData: 'heatmap.notEnoughData',
  noCoverage: 'heatmap.noCoverage',
  conversionGap: 'heatmap.conversionGap',
  column: {
    zone: 'heatmap.column.zone',
    leads: 'heatmap.column.leads',
    deals: 'heatmap.column.deals',
    density: 'heatmap.column.density',
    conversion: 'heatmap.column.conversion',
    change: 'heatmap.column.change',
  },
  sheet: { title: 'heatmap.sheet.title', empty: 'heatmap.sheet.empty' },
  empty: { title: 'heatmap.empty.title', body: 'heatmap.empty.body' },
  error: { title: 'heatmap.error.title', body: 'heatmap.error.body' },
} as const;
