/** Screen 022 — Sales Funnel Analytics. Types and translation keys only. */

import type { Lead, LeadStage } from '@/data/types';

export type FunnelStatus = 'loading' | 'ready' | 'error';

export type BreakdownBy = 'none' | 'surveyor' | 'territory' | 'source';

/** Funnel order. A lead counts once, at its current stage — never every stage
 *  it passed through, which is what its own history is for. */
export const FUNNEL_STAGES: LeadStage[] = [
  'captured',
  'contacted',
  'site_visit',
  'quoted',
  'negotiation',
  'won',
];

/** Below this count in a stage, a percentage is more noise than signal. */
export const SMALL_SAMPLE_COUNT = 5;

export interface FunnelStep {
  stage: LeadStage;
  /** Leads currently AT this stage, not leads that ever reached it. */
  count: number;
  /** Leads that reached this stage or later — the cumulative funnel width. */
  reached: number;
  conversionFromPrevious: number | null;
  avgDaysInStage: number;
  smallSample: boolean;
}

export interface BreakdownGroup {
  id: string;
  label: string;
  steps: FunnelStep[];
  totalReached: number;
  overallConversion: number;
}

export interface LostReasonBreakdown {
  reason: string;
  count: number;
  leads: Lead[];
}

/** The fixed, admin-editable taxonomy — not free text, so it aggregates cleanly. */
export const LOST_REASON_TAXONOMY = [
  'price',
  'timeline',
  'competitor',
  'siteNotReady',
  'other',
] as const;

export const FUNNEL_KEYS = {
  title: 'funnel.title',
  subtitle: 'funnel.subtitle',
  loading: 'funnel.loading',
  breakdown: {
    label: 'funnel.breakdown.label',
    none: 'funnel.breakdown.none',
    surveyor: 'funnel.breakdown.surveyor',
    territory: 'funnel.breakdown.territory',
    source: 'funnel.breakdown.source',
  },
  biggestDrop: 'funnel.biggestDrop',
  avgDays: 'funnel.avgDays',
  smallSample: 'funnel.smallSample',
  lostHeading: 'funnel.lostHeading',
  lostReason: {
    price: 'funnel.lostReason.price',
    timeline: 'funnel.lostReason.timeline',
    competitor: 'funnel.lostReason.competitor',
    siteNotReady: 'funnel.lostReason.siteNotReady',
    other: 'funnel.lostReason.other',
  },
  reopenedNote: 'funnel.reopenedNote',
  skipStageNote: 'funnel.skipStageNote',
  sheetTitle: 'funnel.sheetTitle',
  currentStateNote: 'funnel.currentStateNote',
  error: { title: 'funnel.error.title', body: 'funnel.error.body' },
} as const;
