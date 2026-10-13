/** Screen 090 — Refund & Dispute Management Screen. Types and translation keys only. */

export type RefundDisputeManagementStatus = 'loading' | 'ready' | 'error';

export type DisputeSegment = 'open' | 'resolved';

export const REFUND_DISPUTE_MANAGEMENT_KEYS = {
  title: 'refundDisputeManagement.title',
  subtitle: 'refundDisputeManagement.subtitle',
  loading: 'refundDisputeManagement.loading',
  error: { title: 'refundDisputeManagement.error.title', body: 'refundDisputeManagement.error.body' },
  empty: { title: 'refundDisputeManagement.empty.title', body: 'refundDisputeManagement.empty.body' },
  noResults: { title: 'refundDisputeManagement.noResults.title', body: 'refundDisputeManagement.noResults.body' },

  segment: {
    open: 'refundDisputeManagement.segment.open',
    resolved: 'refundDisputeManagement.segment.resolved',
  },

  row: {
    slaHours: 'refundDisputeManagement.row.slaHours',
    slaBreached: 'refundDisputeManagement.row.slaBreached',
    notYetPaid: 'refundDisputeManagement.row.notYetPaid',
  },

  resolutionType: {
    full_refund: 'refundDisputeManagement.resolutionType.full_refund',
    partial_refund: 'refundDisputeManagement.resolutionType.partial_refund',
    rejected: 'refundDisputeManagement.resolutionType.rejected',
  },

  detail: {
    disputeReasonLabel: 'refundDisputeManagement.detail.disputeReasonLabel',
    disputedByLabel: 'refundDisputeManagement.detail.disputedByLabel',
    amountPaidLabel: 'refundDisputeManagement.detail.amountPaidLabel',
    slaLabel: 'refundDisputeManagement.detail.slaLabel',
    financingWarning: 'refundDisputeManagement.detail.financingWarning',
    downstreamWarning: 'refundDisputeManagement.detail.downstreamWarning',
    resolutionNoteLabel: 'refundDisputeManagement.detail.resolutionNoteLabel',
    resolvedByLabel: 'refundDisputeManagement.detail.resolvedByLabel',
    creditNoteIssued: 'refundDisputeManagement.detail.creditNoteIssued',
    approveFullRefund: 'refundDisputeManagement.detail.approveFullRefund',
    approvePartialRefund: 'refundDisputeManagement.detail.approvePartialRefund',
    reject: 'refundDisputeManagement.detail.reject',
    viewHistory: 'refundDisputeManagement.detail.viewHistory',
  },

  fullRefundSheet: {
    title: 'refundDisputeManagement.fullRefundSheet.title',
    hint: 'refundDisputeManagement.fullRefundSheet.hint',
    amountLabel: 'refundDisputeManagement.fullRefundSheet.amountLabel',
    reasonLabel: 'refundDisputeManagement.fullRefundSheet.reasonLabel',
    submit: 'refundDisputeManagement.fullRefundSheet.submit',
  },

  partialRefundSheet: {
    title: 'refundDisputeManagement.partialRefundSheet.title',
    hint: 'refundDisputeManagement.partialRefundSheet.hint',
    amountLabel: 'refundDisputeManagement.partialRefundSheet.amountLabel',
    reasonLabel: 'refundDisputeManagement.partialRefundSheet.reasonLabel',
    submit: 'refundDisputeManagement.partialRefundSheet.submit',
  },

  rejectSheet: {
    title: 'refundDisputeManagement.rejectSheet.title',
    hint: 'refundDisputeManagement.rejectSheet.hint',
    reasonLabel: 'refundDisputeManagement.rejectSheet.reasonLabel',
    submit: 'refundDisputeManagement.rejectSheet.submit',
  },

  toast: {
    resolved: 'refundDisputeManagement.toast.resolved',
    error: 'refundDisputeManagement.toast.error',
  },
} as const;
