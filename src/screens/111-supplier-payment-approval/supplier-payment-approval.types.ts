/** Screen 111 — Supplier Payment Approval. Types and translation keys only. */

import type { HoldFlagKind } from '@/features/suppliers/supplierPayments';
import type { PaymentEvidenceKind } from '@/data/repository';
import type { SupplierPaymentEventKind, SupplierPaymentPart, SupplierPaymentStatus, SupplierPaymentTrigger } from '@/data/types';

export type SupplierPaymentApprovalStatus = 'loading' | 'ready' | 'error';

/** How often the queue re-reads while open. */
export const POLL_MS = 20_000;

export type QueueFilter = 'toApprove' | 'waiting' | 'held' | 'recent';
export const QUEUE_FILTERS: QueueFilter[] = ['toApprove', 'waiting', 'held', 'recent'];

export const PARTS: SupplierPaymentPart[] = ['upfront', 'balance', 'retention'];
export const TRIGGERS: SupplierPaymentTrigger[] = ['on_send', 'on_acknowledge', 'after_delivery', 'on_handover'];
export const STATUSES: SupplierPaymentStatus[] = ['pending_approval', 'held', 'approved', 'executed'];
export const FLAG_KINDS: HoldFlagKind[] = ['invoice_unmatched', 'supplier_blocked', 'open_report', 'supplier_dispute', 'orphaned', 'rating_dispute', 'high_value', 'early_release'];
export const EVIDENCE_KINDS: PaymentEvidenceKind[] = ['invoice_matched', 'manual_override', 'po_sent', 'acknowledged', 'delivery_received', 'delivery_signed', 'net_elapsed', 'retention_released', 'installation_handover'];
export const EVENT_KINDS: SupplierPaymentEventKind[] = ['triggered', 'held', 'hold_released', 'approved', 'reversed', 'executed', 'amount_changed'];

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

/** 111 owns the shared `supplierPayment.*` vocabulary (part, trigger, status, flag) that 112–120 read. */
export const SUPPLIER_PAYMENT_SHARED = {
  part: rec('supplierPayment.part', PARTS),
  trigger: rec('supplierPayment.trigger', TRIGGERS),
  status: rec('supplierPayment.status', STATUSES),
  flag: rec('supplierPayment.flag', FLAG_KINDS),
  flagBody: rec('supplierPayment.flagBody', FLAG_KINDS),
  /** Why an order's invoice is not clean yet, by 113's gate. Owned here because the flag is. */
  invoiceGate: rec('supplierPayment.invoiceGate', ['no_invoice', 'mismatch', 'incomplete', 'awaiting_delivery'] as const),
} as const;

export const APPROVAL_KEYS = {
  title: 'supplierPaymentApproval.title',
  subtitle: 'supplierPaymentApproval.subtitle',
  loading: 'supplierPaymentApproval.loading',
  error: { title: 'supplierPaymentApproval.error.title', body: 'supplierPaymentApproval.error.body' },
  totals: {
    toApprove: 'supplierPaymentApproval.totals.toApprove',
    waiting: 'supplierPaymentApproval.totals.waiting',
    held: 'supplierPaymentApproval.totals.held',
    routine: 'supplierPaymentApproval.totals.routine',
    count: 'supplierPaymentApproval.totals.count',
  },
  filter: { label: 'supplierPaymentApproval.filter.label', search: 'supplierPaymentApproval.filter.search', ...rec('supplierPaymentApproval.filter', QUEUE_FILTERS) },
  list: {
    emptyTitle: 'supplierPaymentApproval.list.emptyTitle',
    emptyBody: 'supplierPaymentApproval.list.emptyBody',
    emptyWaitingTitle: 'supplierPaymentApproval.list.emptyWaitingTitle',
    emptyWaitingBody: 'supplierPaymentApproval.list.emptyWaitingBody',
    emptyHeldTitle: 'supplierPaymentApproval.list.emptyHeldTitle',
    emptyHeldBody: 'supplierPaymentApproval.list.emptyHeldBody',
    emptyRecentTitle: 'supplierPaymentApproval.list.emptyRecentTitle',
    emptyRecentBody: 'supplierPaymentApproval.list.emptyRecentBody',
    emptySearchTitle: 'supplierPaymentApproval.list.emptySearchTitle',
    emptySearchBody: 'supplierPaymentApproval.list.emptySearchBody',
    clear: 'supplierPaymentApproval.list.clear',
    dueToday: 'supplierPaymentApproval.list.dueToday',
    overdue: 'supplierPaymentApproval.list.overdue',
    triggered: 'supplierPaymentApproval.list.triggered',
    routine: 'supplierPaymentApproval.list.routine',
    ofOrder: 'supplierPaymentApproval.list.ofOrder',
    heldOn: 'supplierPaymentApproval.list.heldOn',
    reversibleFor: 'supplierPaymentApproval.list.reversibleFor',
    madeOn: 'supplierPaymentApproval.list.madeOn',
    reverse: 'supplierPaymentApproval.list.reverse',
    windowClosing: 'supplierPaymentApproval.list.windowClosing',
    notFound: 'supplierPaymentApproval.list.notFound',
  },
  part: SUPPLIER_PAYMENT_SHARED.part,
  trigger: SUPPLIER_PAYMENT_SHARED.trigger,
  status: SUPPLIER_PAYMENT_SHARED.status,
  flag: SUPPLIER_PAYMENT_SHARED.flag,
  flagBody: SUPPLIER_PAYMENT_SHARED.flagBody,
  invoiceGate: SUPPLIER_PAYMENT_SHARED.invoiceGate,
  detail: {
    title: 'supplierPaymentApproval.detail.title',
    amount: 'supplierPaymentApproval.detail.amount',
    order: 'supplierPaymentApproval.detail.order',
    supplier: 'supplierPaymentApproval.detail.supplier',
    site: 'supplierPaymentApproval.detail.site',
    paidSoFar: 'supplierPaymentApproval.detail.paidSoFar',
    dueOn: 'supplierPaymentApproval.detail.dueOn',
    evidenceHeading: 'supplierPaymentApproval.detail.evidenceHeading',
    evidenceHint: 'supplierPaymentApproval.detail.evidenceHint',
    noEvidence: 'supplierPaymentApproval.detail.noEvidence',
    flagsHeading: 'supplierPaymentApproval.detail.flagsHeading',
    openReport: 'supplierPaymentApproval.detail.openReport',
    reportsHeading: 'supplierPaymentApproval.detail.reportsHeading',
    reportBody: 'supplierPaymentApproval.detail.reportBody',
    rush: 'supplierPaymentApproval.detail.rush',
    acknowledge: 'supplierPaymentApproval.detail.acknowledge',
    historyHeading: 'supplierPaymentApproval.detail.historyHeading',
    by: 'supplierPaymentApproval.detail.by',
    heldBecause: 'supplierPaymentApproval.detail.heldBecause',
    heldAuto: 'supplierPaymentApproval.detail.heldAuto',
    seeChain: 'supplierPaymentApproval.detail.seeChain',
    reference: 'supplierPaymentApproval.detail.reference',
    blockedNote: 'supplierPaymentApproval.detail.blockedNote',
    invoiceNote: 'supplierPaymentApproval.detail.invoiceNote',
    seeInvoices: 'supplierPaymentApproval.detail.seeInvoices',
    seeHistory: 'supplierPaymentApproval.detail.seeHistory',
  },
  evidence: {
    ...rec('supplierPaymentApproval.evidence', EVIDENCE_KINDS),
    open: 'supplierPaymentApproval.evidence.open',
    netDays: 'supplierPaymentApproval.evidence.netDays',
  },
  event: rec('supplierPaymentApproval.event', EVENT_KINDS),
  action: {
    approve: 'supplierPaymentApproval.action.approve',
    approveAnyway: 'supplierPaymentApproval.action.approveAnyway',
    hold: 'supplierPaymentApproval.action.hold',
    release: 'supplierPaymentApproval.action.release',
    reverse: 'supplierPaymentApproval.action.reverse',
    close: 'supplierPaymentApproval.action.close',
  },
  hold: {
    title: 'supplierPaymentApproval.hold.title',
    intro: 'supplierPaymentApproval.hold.intro',
    reason: 'supplierPaymentApproval.hold.reason',
    reasonHint: 'supplierPaymentApproval.hold.reasonHint',
    confirm: 'supplierPaymentApproval.hold.confirm',
  },
  reverse: {
    title: 'supplierPaymentApproval.reverse.title',
    intro: 'supplierPaymentApproval.reverse.intro',
    reason: 'supplierPaymentApproval.reverse.reason',
    confirm: 'supplierPaymentApproval.reverse.confirm',
  },
  batch: {
    select: 'supplierPaymentApproval.batch.select',
    done: 'supplierPaymentApproval.batch.done',
    selectAll: 'supplierPaymentApproval.batch.selectAll',
    clear: 'supplierPaymentApproval.batch.clear',
    hint: 'supplierPaymentApproval.batch.hint',
    notRoutine: 'supplierPaymentApproval.batch.notRoutine',
    review: 'supplierPaymentApproval.batch.review',
    title: 'supplierPaymentApproval.batch.title',
    intro: 'supplierPaymentApproval.batch.intro',
    total: 'supplierPaymentApproval.batch.total',
    confirm: 'supplierPaymentApproval.batch.confirm',
    skipped: 'supplierPaymentApproval.batch.skipped',
    skipped_not_routine: 'supplierPaymentApproval.batch.skipped_not_routine',
    skipped_not_pending: 'supplierPaymentApproval.batch.skipped_not_pending',
    skipped_not_found: 'supplierPaymentApproval.batch.skipped_not_found',
  },
  duration: { minutes: 'supplierPaymentApproval.duration.minutes', seconds: 'supplierPaymentApproval.duration.seconds' },
  toast: {
    approved: 'supplierPaymentApproval.toast.approved',
    held: 'supplierPaymentApproval.toast.held',
    released: 'supplierPaymentApproval.toast.released',
    reversed: 'supplierPaymentApproval.toast.reversed',
    batch: 'supplierPaymentApproval.toast.batch',
  },
  problem: {
    forbidden: 'supplierPaymentApproval.problem.forbidden',
    not_found: 'supplierPaymentApproval.problem.not_found',
    invalid_state: 'supplierPaymentApproval.problem.invalid_state',
    supplier_blocked: 'supplierPaymentApproval.problem.supplier_blocked',
    invoice_unmatched: 'supplierPaymentApproval.problem.invoice_unmatched',
    flags_unacknowledged: 'supplierPaymentApproval.problem.flags_unacknowledged',
    note_required: 'supplierPaymentApproval.problem.note_required',
    window_closed: 'supplierPaymentApproval.problem.window_closed',
    generic: 'supplierPaymentApproval.problem.generic',
  },
} as const;
