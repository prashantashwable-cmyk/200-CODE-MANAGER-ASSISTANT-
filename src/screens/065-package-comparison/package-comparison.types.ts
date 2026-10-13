/** Screen 065 — Multi-Option Package Comparison. Types and translation keys only. */

import type { PackageTier } from '@/data/types';

export type PackageComparisonStatus = 'loading' | 'ready' | 'error';

export const PACKAGE_TIERS: PackageTier[] = ['basic', 'premium', 'luxury'];

/** Presentation-only per-tier warranty length — not independently
 *  configured elsewhere, unlike AMC pricing which reads the real
 *  PricingConfig.amcTiers so this table never invents a number Admin
 *  hasn't actually set. */
export const TIER_WARRANTY_YEARS: Record<PackageTier, number> = { basic: 1, premium: 2, luxury: 3 };

/** Index into PricingConfig.amcTiers (basic / standard / comprehensive). */
export const TIER_AMC_INDEX: Record<PackageTier, number> = { basic: 0, premium: 1, luxury: 2 };

/** Adjacent tiers priced closer than this look like a configuration quirk
 *  rather than a genuine choice — flagged for Admin review. */
export const PRICE_GAP_FLAG_THRESHOLD_PCT = 0.08;

export const PACKAGE_COMPARISON_KEYS = {
  title: 'packageComparison.title',
  subtitle: 'packageComparison.subtitle',
  loading: 'packageComparison.loading',
  error: { title: 'packageComparison.error.title', body: 'packageComparison.error.body' },
  empty: { title: 'packageComparison.empty.title', body: 'packageComparison.empty.body' },

  newComparison: {
    heading: 'packageComparison.newComparison.heading',
    pickLead: 'packageComparison.newComparison.pickLead',
    generate: 'packageComparison.newComparison.generate',
  },

  pastSets: {
    heading: 'packageComparison.pastSets.heading',
  },

  tier: {
    basic: 'packageComparison.tier.basic',
    premium: 'packageComparison.tier.premium',
    luxury: 'packageComparison.tier.luxury',
  },

  recommended: 'packageComparison.recommended',
  safetyIncludedNote: 'packageComparison.safetyIncludedNote',
  priceGapWarning: 'packageComparison.priceGapWarning',

  feature: {
    price: 'packageComparison.feature.price',
    finish: 'packageComparison.feature.finish',
    warranty: 'packageComparison.feature.warranty',
    warrantyValue: 'packageComparison.feature.warrantyValue',
    amc: 'packageComparison.feature.amc',
  },

  select: 'packageComparison.select',
  customize: 'packageComparison.customize',

  toast: {
    generated: 'packageComparison.toast.generated',
    error: 'packageComparison.toast.error',
  },
} as const;
