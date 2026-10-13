/** Screen 100 — Supplier Payment Terms Configuration. Types and translation keys only. */

import type { SupplierPaymentTermType } from '@/data/types';

export type SupplierPaymentTermsStatus = 'loading' | 'ready' | 'error';

export const TERM_TYPES: SupplierPaymentTermType[] = ['net', 'milestone', 'advance'];

/** The order value the "how would this be paid" preview uses. */
export const PREVIEW_ORDER_VALUE = 100_000;

export interface SettingsDraft {
  termType: SupplierPaymentTermType;
  upfrontPct: string;
  retentionPct: string;
}

export const SUPPLIER_PAYMENT_TERMS_KEYS = {
  title: 'supplierPaymentTerms.title',
  subtitle: 'supplierPaymentTerms.subtitle',
  loading: 'supplierPaymentTerms.loading',
  error: { title: 'supplierPaymentTerms.error.title', body: 'supplierPaymentTerms.error.body' },
  tierName: {
    new: 'supplierPaymentTerms.tierName.new',
    standard: 'supplierPaymentTerms.tierName.standard',
    trusted: 'supplierPaymentTerms.tierName.trusted',
  },
  termType: {
    net: 'supplierPaymentTerms.termType.net',
    milestone: 'supplierPaymentTerms.termType.milestone',
    advance: 'supplierPaymentTerms.termType.advance',
  },
  summary: {
    net: 'supplierPaymentTerms.summary.net',
    milestone: 'supplierPaymentTerms.summary.milestone',
    advance: 'supplierPaymentTerms.summary.advance',
    retention: 'supplierPaymentTerms.summary.retention',
    noRetention: 'supplierPaymentTerms.summary.noRetention',
  },
  tiers: {
    heading: 'supplierPaymentTerms.tiers.heading',
    hint: 'supplierPaymentTerms.tiers.hint',
    usage: 'supplierPaymentTerms.tiers.usage',
    edit: 'supplierPaymentTerms.tiers.edit',
  },
  suppliers: {
    heading: 'supplierPaymentTerms.suppliers.heading',
    hint: 'supplierPaymentTerms.suppliers.hint',
    empty: 'supplierPaymentTerms.suppliers.empty',
    emptyBody: 'supplierPaymentTerms.suppliers.emptyBody',
    custom: 'supplierPaymentTerms.suppliers.custom',
    score: 'supplierPaymentTerms.suppliers.score',
    unrated: 'supplierPaymentTerms.suppliers.unrated',
    graduate: 'supplierPaymentTerms.suppliers.graduate',
    noAgreement: 'supplierPaymentTerms.suppliers.noAgreement',
  },
  retention: {
    heading: 'supplierPaymentTerms.retention.heading',
    hint: 'supplierPaymentTerms.retention.hint',
    empty: 'supplierPaymentTerms.retention.empty',
    emptyBody: 'supplierPaymentTerms.retention.emptyBody',
    status: {
      held: 'supplierPaymentTerms.retention.status.held',
      paused: 'supplierPaymentTerms.retention.status.paused',
      released: 'supplierPaymentTerms.retention.status.released',
      withheld: 'supplierPaymentTerms.retention.status.withheld',
    },
    heldLine: 'supplierPaymentTerms.retention.heldLine',
    heldOverdue: 'supplierPaymentTerms.retention.heldOverdue',
    pausedLine: 'supplierPaymentTerms.retention.pausedLine',
    releasedAuto: 'supplierPaymentTerms.retention.releasedAuto',
    releasedBy: 'supplierPaymentTerms.retention.releasedBy',
    withheldBy: 'supplierPaymentTerms.retention.withheldBy',
    release: 'supplierPaymentTerms.retention.release',
    withhold: 'supplierPaymentTerms.retention.withhold',
    decideTitle: 'supplierPaymentTerms.retention.decideTitle',
    reason: 'supplierPaymentTerms.retention.reason',
    withholdWarning: 'supplierPaymentTerms.retention.withholdWarning',
    confirmRelease: 'supplierPaymentTerms.retention.confirmRelease',
    confirmWithhold: 'supplierPaymentTerms.retention.confirmWithhold',
    viewRecord: 'supplierPaymentTerms.retention.viewRecord',
  },
  history: {
    heading: 'supplierPaymentTerms.history.heading',
    empty: 'supplierPaymentTerms.history.empty',
    tier: 'supplierPaymentTerms.history.tier',
    override_set: 'supplierPaymentTerms.history.override_set',
    override_cleared: 'supplierPaymentTerms.history.override_cleared',
    tier_defaults: 'supplierPaymentTerms.history.tier_defaults',
    scoreAt: 'supplierPaymentTerms.history.scoreAt',
    by: 'supplierPaymentTerms.history.by',
  },
  schedule: {
    heading: 'supplierPaymentTerms.schedule.heading',
    on_send: 'supplierPaymentTerms.schedule.on_send',
    on_acknowledge: 'supplierPaymentTerms.schedule.on_acknowledge',
    after_delivery: 'supplierPaymentTerms.schedule.after_delivery',
    after_delivery_unknown: 'supplierPaymentTerms.schedule.after_delivery_unknown',
    on_handover: 'supplierPaymentTerms.schedule.on_handover',
  },
  form: {
    tierTitle: 'supplierPaymentTerms.form.tierTitle',
    supplierTitle: 'supplierPaymentTerms.form.supplierTitle',
    termType: 'supplierPaymentTerms.form.termType',
    upfront: 'supplierPaymentTerms.form.upfront',
    upfrontHint: 'supplierPaymentTerms.form.upfrontHint',
    retention: 'supplierPaymentTerms.form.retention',
    retentionHint: 'supplierPaymentTerms.form.retentionHint',
    tier: 'supplierPaymentTerms.form.tier',
    evidence: 'supplierPaymentTerms.form.evidence',
    suggestion: 'supplierPaymentTerms.form.suggestion',
    openScorecard: 'supplierPaymentTerms.form.openScorecard',
    custom: 'supplierPaymentTerms.form.custom',
    customHint: 'supplierPaymentTerms.form.customHint',
    reason: 'supplierPaymentTerms.form.reason',
    reasonHint: 'supplierPaymentTerms.form.reasonHint',
    riskWarning: 'supplierPaymentTerms.form.riskWarning',
    tierRiskWarning: 'supplierPaymentTerms.form.tierRiskWarning',
    riskConfirm: 'supplierPaymentTerms.form.riskConfirm',
    inFlightNote: 'supplierPaymentTerms.form.inFlightNote',
    noChange: 'supplierPaymentTerms.form.noChange',
    save: 'supplierPaymentTerms.form.save',
    history: 'supplierPaymentTerms.form.history',
    issue: {
      upfront_range: 'supplierPaymentTerms.form.issue.upfront_range',
      retention_range: 'supplierPaymentTerms.form.issue.retention_range',
      net_has_upfront: 'supplierPaymentTerms.form.issue.net_has_upfront',
      upfront_required: 'supplierPaymentTerms.form.issue.upfront_required',
      total_too_high: 'supplierPaymentTerms.form.issue.total_too_high',
    },
  },
  toast: {
    saved: 'supplierPaymentTerms.toast.saved',
    released: 'supplierPaymentTerms.toast.released',
    withheld: 'supplierPaymentTerms.toast.withheld',
    error: 'supplierPaymentTerms.toast.error',
  },
} as const;
