/** Screen 028 — Financial Overview: Cash Flow & Receivables. Types and keys. */

import type { Payment } from '@/data/types';
import type { AgingBucket } from '@/features/payments/aging';

export type FinanceStatus = 'loading' | 'ready' | 'error';

/** The aging-bucket vocabulary and its one definition live in
 *  `@/features/payments/aging` — shared with screen 082's Payment
 *  Collection Dashboard so the two screens can never disagree on what
 *  "overdue" means. Re-exported here so this screen's own files don't need
 *  to change their import path. */
export { AGING_BUCKETS, OUTLIER_MULTIPLE } from '@/features/payments/aging';
export type { AgingBucket };

export interface AgingGroup {
  bucket: AgingBucket;
  payments: Payment[];
  total: number;
}

export interface UpcomingOutflow {
  payment: Payment;
  daysUntilDue: number;
}

export interface FinanceSummary {
  cashIn: number;
  cashOut: number;
  netPosition: number;
  totalReceivable: number;
  medianReceivable: number;
  /** True when one payment is large enough to distort the total on its own. */
  skewedByOutlier: boolean;
}

export const FINANCE_KEYS = {
  title: 'finance.title',
  subtitle: 'finance.subtitle',
  loading: 'finance.loading',
  card: {
    cashIn: 'finance.card.cashIn',
    cashOut: 'finance.card.cashOut',
    netPosition: 'finance.card.netPosition',
    totalReceivable: 'finance.card.totalReceivable',
    inTransit: 'finance.card.inTransit',
    inTransitNote: 'finance.card.inTransitNote',
    supplierOut: 'finance.card.supplierOut',
    supplierOutNote: 'finance.card.supplierOutNote',
    seeSchedule: 'finance.card.seeSchedule',
    payouts: 'finance.card.payouts',
    payoutsNote: 'finance.card.payoutsNote',
    seePayouts: 'finance.card.seePayouts',
  },
  outlierNote: 'finance.outlierNote',
  medianNote: 'finance.medianNote',
  agingHeading: 'finance.agingHeading',
  bucket: {
    current: 'finance.bucket.current',
    d30: 'finance.bucket.d30',
    d60: 'finance.bucket.d60',
    d90plus: 'finance.bucket.d90plus',
    disputed: 'finance.bucket.disputed',
  },
  dueDateNote: 'finance.dueDateNote',
  escalationNote: 'finance.escalationNote',
  upcomingHeading: 'finance.upcomingHeading',
  window: { '7': 'finance.window.7', '30': 'finance.window.30' },
  dueIn: 'finance.dueIn',
  dueToday: 'finance.dueToday',
  reconciliationNote: 'finance.reconciliationNote',
  currencyNote: 'finance.currencyNote',
  sheetTitle: 'finance.sheetTitle',
  paymentStage: {
    advance: 'finance.paymentStage.advance',
    material: 'finance.paymentStage.material',
    installation: 'finance.paymentStage.installation',
    handover: 'finance.paymentStage.handover',
    retention: 'finance.paymentStage.retention',
  },
  empty: { title: 'finance.empty.title', body: 'finance.empty.body' },
  error: { title: 'finance.error.title', body: 'finance.error.body' },
} as const;
