/** Screen 082 — Payment Collection Dashboard Screen. Types and translation keys only. */

import type { PaymentStage } from '@/data/types';
import type { AgingBucket } from '@/features/payments/aging';

export type PaymentCollectionDashboardStatus = 'loading' | 'ready' | 'error';

export const STAGE_FILTERS: PaymentStage[] = ['advance', 'material', 'installation', 'handover', 'retention'];

export const SEVERITY_FILTERS: AgingBucket[] = ['current', 'd30', 'd60', 'd90plus', 'disputed'];

/** A receivable this many times the median line counts as large enough to
 *  weight visually — same idea as screen 028's own outlier flag, applied
 *  per line instead of to the portfolio total. */
export const LARGE_LINE_MULTIPLE = 2;

export const PAYMENT_COLLECTION_DASHBOARD_KEYS = {
  title: 'paymentCollectionDashboard.title',
  subtitle: 'paymentCollectionDashboard.subtitle',
  reminderSettingsLink: 'paymentCollectionDashboard.reminderSettingsLink',
  loading: 'paymentCollectionDashboard.loading',
  error: { title: 'paymentCollectionDashboard.error.title', body: 'paymentCollectionDashboard.error.body' },
  empty: { title: 'paymentCollectionDashboard.empty.title', body: 'paymentCollectionDashboard.empty.body' },
  noResults: { title: 'paymentCollectionDashboard.noResults.title', body: 'paymentCollectionDashboard.noResults.body' },

  kpi: {
    collected: 'paymentCollectionDashboard.kpi.collected',
    pending: 'paymentCollectionDashboard.kpi.pending',
    overdue: 'paymentCollectionDashboard.kpi.overdue',
    disputed: 'paymentCollectionDashboard.kpi.disputed',
  },

  filters: {
    stageAll: 'paymentCollectionDashboard.filters.stageAll',
    severityAll: 'paymentCollectionDashboard.filters.severityAll',
    ownerAll: 'paymentCollectionDashboard.filters.ownerAll',
  },

  bucket: {
    current: 'paymentCollectionDashboard.bucket.current',
    d30: 'paymentCollectionDashboard.bucket.d30',
    d60: 'paymentCollectionDashboard.bucket.d60',
    d90plus: 'paymentCollectionDashboard.bucket.d90plus',
    disputed: 'paymentCollectionDashboard.bucket.disputed',
  },

  row: {
    daysOverdue: 'paymentCollectionDashboard.row.daysOverdue',
    dueIn: 'paymentCollectionDashboard.row.dueIn',
    dueToday: 'paymentCollectionDashboard.row.dueToday',
    partiallyReceived: 'paymentCollectionDashboard.row.partiallyReceived',
    large: 'paymentCollectionDashboard.row.large',
    paid: 'paymentCollectionDashboard.row.paid',
    refunded: 'paymentCollectionDashboard.row.refunded',
    failed: 'paymentCollectionDashboard.row.failed',
  },

  detail: {
    ownerLabel: 'paymentCollectionDashboard.detail.ownerLabel',
    amountLabel: 'paymentCollectionDashboard.detail.amountLabel',
    receivedLabel: 'paymentCollectionDashboard.detail.receivedLabel',
    remainingLabel: 'paymentCollectionDashboard.detail.remainingLabel',
    disputeReasonLabel: 'paymentCollectionDashboard.detail.disputeReasonLabel',
    disputedLine: 'paymentCollectionDashboard.detail.disputedLine',
    manualPaymentLine: 'paymentCollectionDashboard.detail.manualPaymentLine',
    sendReminder: 'paymentCollectionDashboard.detail.sendReminder',
    escalate: 'paymentCollectionDashboard.detail.escalate',
    markPaid: 'paymentCollectionDashboard.detail.markPaid',
    dispute: 'paymentCollectionDashboard.detail.dispute',
  },

  markPaidSheet: {
    title: 'paymentCollectionDashboard.markPaidSheet.title',
    hint: 'paymentCollectionDashboard.markPaidSheet.hint',
    amountLabel: 'paymentCollectionDashboard.markPaidSheet.amountLabel',
    referenceLabel: 'paymentCollectionDashboard.markPaidSheet.referenceLabel',
    methodLabel: 'paymentCollectionDashboard.markPaidSheet.methodLabel',
    submit: 'paymentCollectionDashboard.markPaidSheet.submit',
  },

  disputeSheet: {
    title: 'paymentCollectionDashboard.disputeSheet.title',
    hint: 'paymentCollectionDashboard.disputeSheet.hint',
    reasonLabel: 'paymentCollectionDashboard.disputeSheet.reasonLabel',
    submit: 'paymentCollectionDashboard.disputeSheet.submit',
  },

  toast: {
    reminderSent: 'paymentCollectionDashboard.toast.reminderSent',
    escalated: 'paymentCollectionDashboard.toast.escalated',
    markedPaid: 'paymentCollectionDashboard.toast.markedPaid',
    partialRecorded: 'paymentCollectionDashboard.toast.partialRecorded',
    disputed: 'paymentCollectionDashboard.toast.disputed',
    error: 'paymentCollectionDashboard.toast.error',
  },
} as const;
