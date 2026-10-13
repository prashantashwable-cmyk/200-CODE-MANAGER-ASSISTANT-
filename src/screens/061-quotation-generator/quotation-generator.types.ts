/** Screen 061 — Quotation Generator / Input Specs. Types and translation keys only. */

import type { DriveType, FinishTier, QuotationStatus } from '@/data/types';

export type QuotationGeneratorStatus = 'loading' | 'ready' | 'error';

export const DRIVE_TYPES: DriveType[] = ['hydraulic', 'geared_traction', 'gearless_traction', 'mrl', 'vacuum', 'screw_driven'];

export const FINISH_TIERS: FinishTier[] = ['standard', 'premium', 'luxury'];

/** Floor count at or above this is outside the standard residential scope
 *  and gets flagged for specialized review rather than the auto flow. */
export const SPECIALIZED_REVIEW_STOPS = 20;

export const QUOTATION_GENERATOR_KEYS = {
  title: 'quotationGenerator.title',
  subtitle: 'quotationGenerator.subtitle',
  loading: 'quotationGenerator.loading',
  error: { title: 'quotationGenerator.error.title', body: 'quotationGenerator.error.body' },
  empty: { title: 'quotationGenerator.empty.title', body: 'quotationGenerator.empty.body' },

  newQuote: {
    heading: 'quotationGenerator.newQuote.heading',
    pickLead: 'quotationGenerator.newQuote.pickLead',
    start: 'quotationGenerator.newQuote.start',
  },

  listHeading: 'quotationGenerator.listHeading',

  driveType: {
    hydraulic: 'driveType.hydraulic',
    geared_traction: 'driveType.geared_traction',
    gearless_traction: 'driveType.gearless_traction',
    mrl: 'driveType.mrl',
    vacuum: 'driveType.vacuum',
    screw_driven: 'driveType.screw_driven',
  },
  finishTier: {
    standard: 'finishTier.standard',
    premium: 'finishTier.premium',
    luxury: 'finishTier.luxury',
  },
  quotationStatus: {
    draft: 'quotationStatus.draft',
    sent: 'quotationStatus.sent',
    viewed: 'quotationStatus.viewed',
    accepted: 'quotationStatus.accepted',
    expired: 'quotationStatus.expired',
    superseded: 'quotationStatus.superseded',
    change_requested: 'quotationStatus.change_requested',
  },

  form: {
    sourcedFromSurvey: 'quotationGenerator.form.sourcedFromSurvey',
    driveTypeLabel: 'quotationGenerator.form.driveTypeLabel',
    driveTypeHint: 'quotationGenerator.form.driveTypeHint',
    capacityPersonsLabel: 'quotationGenerator.form.capacityPersonsLabel',
    capacityKgLabel: 'quotationGenerator.form.capacityKgLabel',
    finishTierLabel: 'quotationGenerator.form.finishTierLabel',
    stopsCountLabel: 'quotationGenerator.form.stopsCountLabel',
    travelHeightLabel: 'quotationGenerator.form.travelHeightLabel',
    reSuggest: 'quotationGenerator.form.reSuggest',
    overrideNoteLabel: 'quotationGenerator.form.overrideNoteLabel',
    overrideNoteHint: 'quotationGenerator.form.overrideNoteHint',
    customConfigToggle: 'quotationGenerator.form.customConfigToggle',
    customConfigHint: 'quotationGenerator.form.customConfigHint',
    specializedReviewWarning: 'quotationGenerator.form.specializedReviewWarning',
    generate: 'quotationGenerator.form.generate',
    missingRequired: 'quotationGenerator.form.missingRequired',
  },

  toast: {
    started: 'quotationGenerator.toast.started',
    saved: 'quotationGenerator.toast.saved',
    error: 'quotationGenerator.toast.error',
  },

  quickLinks: {
    heading: 'quotationGenerator.quickLinks.heading',
    templates: 'quotationGenerator.quickLinks.templates',
    compare: 'quotationGenerator.quickLinks.compare',
    history: 'quotationGenerator.quickLinks.history',
    discounts: 'quotationGenerator.quickLinks.discounts',
    analytics: 'quotationGenerator.quickLinks.analytics',
    pricing: 'quotationGenerator.quickLinks.pricing',
  },
} as const;

export function statusBadgeKey(status: QuotationStatus): string {
  return QUOTATION_GENERATOR_KEYS.quotationStatus[status];
}
