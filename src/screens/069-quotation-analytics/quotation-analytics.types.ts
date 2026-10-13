/** Screen 069 — Quotation Analytics (Win/Loss). Types and translation keys only. */

import type { QuotationAnalyticsSegment } from '@/data/repository';

export type QuotationAnalyticsStatus = 'loading' | 'ready' | 'error';

export type SegmentFilter = 'all' | QuotationAnalyticsSegment;

export const SEGMENT_FILTERS: SegmentFilter[] = ['all', 'residential', 'commercial'];

export const PRICE_BAND_ORDER = ['under10L', '10to25L', '25to50L', 'above50L'] as const;

export type DrillKind = 'packageTier' | 'driveType' | 'priceBand' | 'territory' | 'lossFactor';

export interface DrillRow {
  leadId: string;
  siteName: string;
  builderName: string;
  quotationCode?: string;
  finalPrice?: number;
  stage: string;
}

export const QUOTATION_ANALYTICS_KEYS = {
  title: 'quotationAnalytics.title',
  subtitle: 'quotationAnalytics.subtitle',
  loading: 'quotationAnalytics.loading',
  error: { title: 'quotationAnalytics.error.title', body: 'quotationAnalytics.error.body' },
  empty: { title: 'quotationAnalytics.empty.title', body: 'quotationAnalytics.empty.body' },

  segment: {
    all: 'quotationAnalytics.segment.all',
    residential: 'quotationAnalytics.segment.residential',
    commercial: 'quotationAnalytics.segment.commercial',
  },

  kpi: {
    overallWinRate: 'quotationAnalytics.kpi.overallWinRate',
    overallWinRateCaption: 'quotationAnalytics.kpi.overallWinRateCaption',
    totalQuotes: 'quotationAnalytics.kpi.totalQuotes',
    avgDecisionDaysWon: 'quotationAnalytics.kpi.avgDecisionDaysWon',
    avgDecisionDaysLost: 'quotationAnalytics.kpi.avgDecisionDaysLost',
    daysUnit: 'quotationAnalytics.kpi.daysUnit',
  },

  section: {
    packageTier: 'quotationAnalytics.section.packageTier',
    driveType: 'quotationAnalytics.section.driveType',
    priceBand: 'quotationAnalytics.section.priceBand',
    territory: 'quotationAnalytics.section.territory',
    lossFactors: 'quotationAnalytics.section.lossFactors',
  },

  packageTierLabel: {
    standard: 'quotationAnalytics.packageTierLabel.standard',
    basic: 'quotationAnalytics.packageTierLabel.basic',
    premium: 'quotationAnalytics.packageTierLabel.premium',
    luxury: 'quotationAnalytics.packageTierLabel.luxury',
  },

  priceBand: {
    under10L: 'priceBand.under10L',
    '10to25L': 'priceBand.10to25L',
    '25to50L': 'priceBand.25to50L',
    above50L: 'priceBand.above50L',
  },

  rowSummary: 'quotationAnalytics.rowSummary',
  lowSampleBadge: 'quotationAnalytics.lowSampleBadge',
  lowSampleNote: 'quotationAnalytics.lowSampleNote',

  drillSheet: {
    quoteLine: 'quotationAnalytics.drillSheet.quoteLine',
    noQuotes: 'quotationAnalytics.drillSheet.noQuotes',
  },
} as const;
