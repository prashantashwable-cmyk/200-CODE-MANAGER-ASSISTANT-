/** Screen 067 — Discount & Approval Workflow. Types and translation keys only. */

import type { DiscountRequestStatus } from '@/data/types';

export type DiscountApprovalStatus = 'loading' | 'ready' | 'error';

export const REQUEST_STATUS_FILTERS: (DiscountRequestStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected'];

export const DISCOUNT_APPROVAL_KEYS = {
  title: 'discountApproval.title',
  subtitle: 'discountApproval.subtitle',
  loading: 'discountApproval.loading',
  error: { title: 'discountApproval.error.title', body: 'discountApproval.error.body' },
  empty: { title: 'discountApproval.empty.title', body: 'discountApproval.empty.body' },

  requestForm: {
    heading: 'discountApproval.requestForm.heading',
    pickQuotation: 'discountApproval.requestForm.pickQuotation',
    discountLabel: 'discountApproval.requestForm.discountLabel',
    reasonLabel: 'discountApproval.requestForm.reasonLabel',
    urgentLabel: 'discountApproval.requestForm.urgentLabel',
    urgentHint: 'discountApproval.requestForm.urgentHint',
    marginPreview: 'discountApproval.requestForm.marginPreview',
    submit: 'discountApproval.requestForm.submit',
  },

  statusFilter: {
    all: 'discountApproval.statusFilter.all',
    pending: 'discountApproval.statusFilter.pending',
    approved: 'discountApproval.statusFilter.approved',
    rejected: 'discountApproval.statusFilter.rejected',
  },

  statusBadge: {
    pending: 'discountApproval.statusBadge.pending',
    approved: 'discountApproval.statusBadge.approved',
    rejected: 'discountApproval.statusBadge.rejected',
  },

  urgentBadge: 'discountApproval.urgentBadge',
  autoApprovedBadge: 'discountApproval.autoApprovedBadge',
  resubmissionFlag: 'discountApproval.resubmissionFlag',
  requestedBy: 'discountApproval.requestedBy',
  resultingMargin: 'discountApproval.resultingMargin',
  decidedBy: 'discountApproval.decidedBy',
  rejectionReasonShown: 'discountApproval.rejectionReasonShown',
  counterSuggestionShown: 'discountApproval.counterSuggestionShown',

  actions: {
    approve: 'discountApproval.actions.approve',
    reject: 'discountApproval.actions.reject',
  },

  rejectSheet: {
    title: 'discountApproval.rejectSheet.title',
    reasonLabel: 'discountApproval.rejectSheet.reasonLabel',
    counterLabel: 'discountApproval.rejectSheet.counterLabel',
    submit: 'discountApproval.rejectSheet.submit',
  },

  toast: {
    submitted: 'discountApproval.toast.submitted',
    autoApproved: 'discountApproval.toast.autoApproved',
    approved: 'discountApproval.toast.approved',
    rejected: 'discountApproval.toast.rejected',
    error: 'discountApproval.toast.error',
  },
} as const;
