/** Screen 079 — Competitor Comparison Battlecard Screen. Types and translation keys only. */

import type { CompetitorPricePosition } from '@/data/types';

export type CompetitorBattlecardsStatus = 'loading' | 'ready' | 'error';

export const PRICE_POSITIONS: CompetitorPricePosition[] = ['premium', 'comparable', 'budget'];

export const COMPETITOR_BATTLECARDS_KEYS = {
  title: 'competitorBattlecards.title',
  subtitle: 'competitorBattlecards.subtitle',
  internalOnlyBanner: 'competitorBattlecards.internalOnlyBanner',
  loading: 'competitorBattlecards.loading',
  error: { title: 'competitorBattlecards.error.title', body: 'competitorBattlecards.error.body' },
  empty: { title: 'competitorBattlecards.empty.title', body: 'competitorBattlecards.empty.body' },
  noResults: { title: 'competitorBattlecards.noResults.title', body: 'competitorBattlecards.noResults.body' },
  searchPlaceholder: 'competitorBattlecards.searchPlaceholder',

  pricePosition: {
    premium: 'competitorBattlecards.pricePosition.premium',
    comparable: 'competitorBattlecards.pricePosition.comparable',
    budget: 'competitorBattlecards.pricePosition.budget',
  },

  row: {
    flagged: 'competitorBattlecards.row.flagged',
    lastReviewed: 'competitorBattlecards.row.lastReviewed',
  },

  detail: {
    strengthsHeading: 'competitorBattlecards.detail.strengthsHeading',
    differentiationHeading: 'competitorBattlecards.detail.differentiationHeading',
    lastReviewedLine: 'competitorBattlecards.detail.lastReviewedLine',
    flaggedBanner: 'competitorBattlecards.detail.flaggedBanner',
    flaggedByLine: 'competitorBattlecards.detail.flaggedByLine',
    versionHistoryHeading: 'competitorBattlecards.detail.versionHistoryHeading',
    versionRow: 'competitorBattlecards.detail.versionRow',
    edit: 'competitorBattlecards.detail.edit',
    flagForReview: 'competitorBattlecards.detail.flagForReview',
    goToObjectionScripts: 'competitorBattlecards.detail.goToObjectionScripts',
  },

  editForm: {
    priceSummaryLabel: 'competitorBattlecards.editForm.priceSummaryLabel',
    strengthsLabel: 'competitorBattlecards.editForm.strengthsLabel',
    strengthsHint: 'competitorBattlecards.editForm.strengthsHint',
    differentiationLabel: 'competitorBattlecards.editForm.differentiationLabel',
    differentiationHint: 'competitorBattlecards.editForm.differentiationHint',
    save: 'competitorBattlecards.editForm.save',
    cancel: 'competitorBattlecards.editForm.cancel',
  },

  flagSheet: {
    title: 'competitorBattlecards.flagSheet.title',
    hint: 'competitorBattlecards.flagSheet.hint',
    reasonLabel: 'competitorBattlecards.flagSheet.reasonLabel',
    submit: 'competitorBattlecards.flagSheet.submit',
  },

  addCompetitor: {
    button: 'competitorBattlecards.addCompetitor.button',
    sheetTitle: 'competitorBattlecards.addCompetitor.sheetTitle',
    nameLabel: 'competitorBattlecards.addCompetitor.nameLabel',
    pricePositionLabel: 'competitorBattlecards.addCompetitor.pricePositionLabel',
    submit: 'competitorBattlecards.addCompetitor.submit',
  },

  toast: {
    saved: 'competitorBattlecards.toast.saved',
    flagged: 'competitorBattlecards.toast.flagged',
    created: 'competitorBattlecards.toast.created',
    error: 'competitorBattlecards.toast.error',
  },
} as const;
