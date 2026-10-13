/** Screen 074 — Deal Terms Finalization. Types and translation keys only. */

import type { PaymentStage } from '@/data/types';

export type DealTermsFinalizationStatus = 'loading' | 'ready' | 'error';

/** These four must always total 100% of the final agreed price. */
export const CORE_PAYMENT_STAGES: PaymentStage[] = ['advance', 'material', 'installation', 'handover'];

/** An additional holdback on top of the core 100% — optional, defaults in
 *  at 0% until the admin opts in. */
export const RETENTION_STAGE: PaymentStage = 'retention';

export const ALL_PAYMENT_STAGES: PaymentStage[] = [...CORE_PAYMENT_STAGES, RETENTION_STAGE];

/** The standard AIEC split already implicit in every seeded Payment record
 *  (advance/material/installation/handover at 25/35/30/10, plus a 5%
 *  retention on top) — offered as the starting point for a fresh draft. */
export const DEFAULT_PAYMENT_STAGE_PLAN: { stage: PaymentStage; percentage: number }[] = [
  { stage: 'advance', percentage: 25 },
  { stage: 'material', percentage: 35 },
  { stage: 'installation', percentage: 30 },
  { stage: 'handover', percentage: 10 },
  { stage: 'retention', percentage: 5 },
];

export const DEAL_TERMS_FINALIZATION_KEYS = {
  title: 'dealTermsFinalization.title',
  loading: 'dealTermsFinalization.loading',
  error: { title: 'dealTermsFinalization.error.title', body: 'dealTermsFinalization.error.body' },

  status: {
    draft: 'dealTermsFinalization.status.draft',
    awaiting_customer: 'dealTermsFinalization.status.awaiting_customer',
    confirmed: 'dealTermsFinalization.status.confirmed',
  },

  summary: {
    finalPrice: 'dealTermsFinalization.summary.finalPrice',
    editElsewhere: 'dealTermsFinalization.summary.editElsewhere',
  },

  paymentPlan: {
    heading: 'dealTermsFinalization.paymentPlan.heading',
    subtitle: 'dealTermsFinalization.paymentPlan.subtitle',
    total: 'dealTermsFinalization.paymentPlan.total',
    totalMustBe100: 'dealTermsFinalization.paymentPlan.totalMustBe100',
    retentionHint: 'dealTermsFinalization.paymentPlan.retentionHint',
  },

  specialTerms: {
    heading: 'dealTermsFinalization.specialTerms.heading',
    placeholder: 'dealTermsFinalization.specialTerms.placeholder',
    hint: 'dealTermsFinalization.specialTerms.hint',
  },

  confirmation: {
    heading: 'dealTermsFinalization.confirmation.heading',
    internalStep: 'dealTermsFinalization.confirmation.internalStep',
    internalDone: 'dealTermsFinalization.confirmation.internalDone',
    customerStep: 'dealTermsFinalization.confirmation.customerStep',
    customerDone: 'dealTermsFinalization.confirmation.customerDone',
    confirmInternal: 'dealTermsFinalization.confirmation.confirmInternal',
    confirmCustomer: 'dealTermsFinalization.confirmation.confirmCustomer',
    confirmCustomerNote: 'dealTermsFinalization.confirmation.confirmCustomerNote',
    waitingOnCustomer: 'dealTermsFinalization.confirmation.waitingOnCustomer',
    bothConfirmed: 'dealTermsFinalization.confirmation.bothConfirmed',
    generateContract: 'dealTermsFinalization.confirmation.generateContract',
    setUpSchedule: 'dealTermsFinalization.confirmation.setUpSchedule',
  },

  amendments: {
    heading: 'dealTermsFinalization.amendments.heading',
    logButton: 'dealTermsFinalization.amendments.logButton',
    sheetTitle: 'dealTermsFinalization.amendments.sheetTitle',
    noteLabel: 'dealTermsFinalization.amendments.noteLabel',
    submit: 'dealTermsFinalization.amendments.submit',
    loggedBy: 'dealTermsFinalization.amendments.loggedBy',
  },

  toast: {
    saved: 'dealTermsFinalization.toast.saved',
    confirmedInternal: 'dealTermsFinalization.toast.confirmedInternal',
    confirmedCustomer: 'dealTermsFinalization.toast.confirmedCustomer',
    amended: 'dealTermsFinalization.toast.amended',
    error: 'dealTermsFinalization.toast.error',
  },
} as const;
