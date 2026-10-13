/** Screen 086 — Loan Partner Integration & Status Screen. Types and translation keys only. */

import type { LoanApplicationStatus } from '@/data/types';

export type LoanPartnerStatusScreenStatus = 'loading' | 'ready' | 'error';

export type StatusFilter = 'all' | 'stuck' | LoanApplicationStatus;

export const STATUS_FILTERS: LoanApplicationStatus[] = ['submitted', 'under_review', 'approved', 'disbursed', 'cancelled'];

/** Applications in these statuses haven't disbursed yet, so cancelling
 *  them is always a clean no-op on the deal's own payment schedule —
 *  mirrors `cancelLoanApplication`'s own guard exactly. */
export const CANCELLABLE_STATUSES: LoanApplicationStatus[] = ['submitted', 'under_review', 'approved'];

export const LOAN_PARTNER_STATUS_KEYS = {
  title: 'loanPartnerStatus.title',
  subtitle: 'loanPartnerStatus.subtitle',
  loading: 'loanPartnerStatus.loading',
  error: { title: 'loanPartnerStatus.error.title', body: 'loanPartnerStatus.error.body' },
  empty: { title: 'loanPartnerStatus.empty.title', body: 'loanPartnerStatus.empty.body' },
  noResults: { title: 'loanPartnerStatus.noResults.title', body: 'loanPartnerStatus.noResults.body' },

  kpi: {
    total: 'loanPartnerStatus.kpi.total',
    approvalRate: 'loanPartnerStatus.kpi.approvalRate',
    avgDisbursement: 'loanPartnerStatus.kpi.avgDisbursement',
    avgDisbursementDays: 'loanPartnerStatus.kpi.avgDisbursementDays',
    stuck: 'loanPartnerStatus.kpi.stuck',
    partnerCaption: 'loanPartnerStatus.kpi.partnerCaption',
  },

  filters: {
    all: 'loanPartnerStatus.filters.all',
    stuck: 'loanPartnerStatus.filters.stuck',
  },

  status: {
    submitted: 'loanPartnerStatus.status.submitted',
    under_review: 'loanPartnerStatus.status.under_review',
    approved: 'loanPartnerStatus.status.approved',
    disbursed: 'loanPartnerStatus.status.disbursed',
    cancelled: 'loanPartnerStatus.status.cancelled',
  },

  row: {
    stuckBadge: 'loanPartnerStatus.row.stuckBadge',
    shortfallBadge: 'loanPartnerStatus.row.shortfallBadge',
  },

  detail: {
    partner: 'loanPartnerStatus.detail.partner',
    requestedAmount: 'loanPartnerStatus.detail.requestedAmount',
    approvedAmount: 'loanPartnerStatus.detail.approvedAmount',
    disbursedAmountReceived: 'loanPartnerStatus.detail.disbursedAmountReceived',
    shortfall: 'loanPartnerStatus.detail.shortfall',
    shortfallNote: 'loanPartnerStatus.detail.shortfallNote',
    submittedAt: 'loanPartnerStatus.detail.submittedAt',
    approvedAt: 'loanPartnerStatus.detail.approvedAt',
    disbursedAt: 'loanPartnerStatus.detail.disbursedAt',
    stuckNote: 'loanPartnerStatus.detail.stuckNote',
    cancelledNote: 'loanPartnerStatus.detail.cancelledNote',
    escalate: 'loanPartnerStatus.detail.escalate',
    escalated: 'loanPartnerStatus.detail.escalated',
    cancel: 'loanPartnerStatus.detail.cancel',
    cancelReasonLabel: 'loanPartnerStatus.detail.cancelReasonLabel',
    cancelConfirm: 'loanPartnerStatus.detail.cancelConfirm',
    cancelHint: 'loanPartnerStatus.detail.cancelHint',
  },

  toast: {
    escalated: 'loanPartnerStatus.toast.escalated',
    cancelled: 'loanPartnerStatus.toast.cancelled',
    error: 'loanPartnerStatus.toast.error',
  },
} as const;
