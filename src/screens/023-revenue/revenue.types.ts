/** Screen 023 — Revenue & Profit Analytics. Types and translation keys only. */

import type { Deal, SeriesPoint } from '@/data/types';

export type RevenueStatus = 'loading' | 'ready' | 'error';

export type RevenuePeriod = '7' | '30' | '90';

export const PERIODS: RevenuePeriod[] = ['7', '30', '90'];

/**
 * Revenue only "books" once a contract is signed (won), and only "collects"
 * as each payment stage actually clears — never speculative. This is the
 * distinction the spec insists on, so the two figures are modelled separately
 * rather than one number doing duty for both.
 */
export interface RevenueSummary {
  booked: number;
  collected: number;
  cogs: number;
  grossMarginPct: number;
  targetMarginPct: number;
  dealsWon: number;
  dealsLost: number;
  lostValue: number;
  avgDealSize: number;
}

export interface RegionBreakdown {
  region: string;
  booked: number;
  collected: number;
  margin: number;
  dealCount: number;
  smallSample: boolean;
}

export interface MarginPoint extends SeriesPoint {
  /** Whether this point sits inside the admin's target margin band. */
  withinTarget: boolean;
}

/** Displayed as a reference band, adjustable in a real build via Settings. */
export const DEFAULT_TARGET_MARGIN_PCT = 0.18;
export const TARGET_MARGIN_TOLERANCE_PCT = 0.03;
export const SMALL_SAMPLE_DEALS = 3;

export const REVENUE_KEYS = {
  title: 'revenue.title',
  subtitle: 'revenue.subtitle',
  loading: 'revenue.loading',
  period: { '7': 'revenue.period.7', '30': 'revenue.period.30', '90': 'revenue.period.90' },
  card: {
    booked: 'revenue.card.booked',
    collected: 'revenue.card.collected',
    cogs: 'revenue.card.cogs',
    margin: 'revenue.card.margin',
  },
  marginTrend: 'revenue.marginTrend',
  targetBand: 'revenue.targetBand',
  byRegion: 'revenue.byRegion',
  wonVsLost: 'revenue.wonVsLost',
  won: 'revenue.won',
  lost: 'revenue.lost',
  avgDeal: 'revenue.avgDeal',
  smallSample: 'revenue.smallSample',
  bookedVsCollectedNote: 'revenue.bookedVsCollectedNote',
  liveSourceNote: 'revenue.liveSourceNote',
  export: 'revenue.export',
  exported: 'revenue.exported',
  column: {
    region: 'revenue.column.region',
    booked: 'revenue.column.booked',
    collected: 'revenue.column.collected',
    margin: 'revenue.column.margin',
    deals: 'revenue.column.deals',
  },
  error: { title: 'revenue.error.title', body: 'revenue.error.body' },
} as const;
