/** Screen 048 — Lead Source & Campaign Attribution. Types and translation keys only. */

export type LeadSourceAttributionStatus = 'loading' | 'ready' | 'error';

/** Below this count a rate/value is real but not yet statistically meaningful. */
export const LOW_SAMPLE_THRESHOLD = 5;

export const LEAD_SOURCE_ATTRIBUTION_KEYS = {
  title: 'leadSourceAttribution.title',
  subtitle: 'leadSourceAttribution.subtitle',
  loading: 'leadSourceAttribution.loading',
  error: { title: 'leadSourceAttribution.error.title', body: 'leadSourceAttribution.error.body' },
  empty: { title: 'leadSourceAttribution.empty.title', body: 'leadSourceAttribution.empty.body' },

  leadCount: 'leadSourceAttribution.leadCount',
  conversionRate: 'leadSourceAttribution.conversionRate',
  avgDealValue: 'leadSourceAttribution.avgDealValue',
  costPerConversion: 'leadSourceAttribution.costPerConversion',
  noCost: 'leadSourceAttribution.noCost',
  lowSampleLabel: 'leadSourceAttribution.lowSampleLabel',
  trendHeading: 'leadSourceAttribution.trendHeading',
  immutableNote: 'leadSourceAttribution.immutableNote',
} as const;
