import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Payment, PaymentStage } from '@/data/types';
import type { PaymentCollectionLine } from '@/data/repository';
import { bucketFor, computeCashIn, computeTotalReceivable, isOutstanding, remainingBalance } from '@/features/payments/aging';
import type { AgingBucket } from '@/features/payments/aging';
import { LARGE_LINE_MULTIPLE } from './payment-collection-dashboard.types';
import type { PaymentCollectionDashboardStatus } from './payment-collection-dashboard.types';

/** `bucketFor` only means something for an outstanding payment (028's own
 *  only ever calls it after filtering to `isOutstanding`) — a paid or
 *  refunded stage has an old due date too, but that's not an overdue
 *  receivable, it's a closed one. This is the one place 082 needs its own
 *  status label broader than the aging-bucket vocabulary, for the "every
 *  stage, Paid included" fast-scan the spec asks for. */
export type LineDisplayStatus = 'paid' | 'refunded' | 'failed' | AgingBucket;

function displayStatusFor(payment: Payment, now: number): LineDisplayStatus {
  if (payment.status === 'paid') return 'paid';
  if (payment.status === 'refunded') return 'refunded';
  if (payment.status === 'failed') return 'failed';
  return bucketFor(payment, now);
}

interface DashboardKpis {
  collected: number;
  pending: number;
  overdueCount: number;
  overdueAmount: number;
  disputedCount: number;
  disputedAmount: number;
}

interface PaymentCollectionDashboardState {
  status: PaymentCollectionDashboardStatus;
  lines: PaymentCollectionLine[];
  kpis: DashboardKpis;
  displayStatusOf: (payment: Payment) => LineDisplayStatus;
  isLargeReceivable: (payment: Payment) => boolean;
  now: number;

  stageFilter: PaymentStage | null;
  setStageFilter: (s: PaymentStage | null) => void;
  severityFilter: AgingBucket | null;
  setSeverityFilter: (s: AgingBucket | null) => void;
  ownerFilter: string | null;
  setOwnerFilter: (o: string | null) => void;
  owners: string[];

  openLine: PaymentCollectionLine | null;
  openDetail: (line: PaymentCollectionLine) => void;
  closeDetail: () => void;

  sendingReminder: boolean;
  sendReminder: () => Promise<boolean>;
  escalating: boolean;
  escalate: () => Promise<boolean>;

  markPaidOpen: boolean;
  openMarkPaid: () => void;
  closeMarkPaid: () => void;
  markPaidAmount: string;
  setMarkPaidAmount: (v: string) => void;
  markPaidReference: string;
  setMarkPaidReference: (v: string) => void;
  markPaidMethod: NonNullable<Payment['method']>;
  setMarkPaidMethod: (m: NonNullable<Payment['method']>) => void;
  submittingMarkPaid: boolean;
  submitMarkPaid: () => Promise<boolean>;

  disputeOpen: boolean;
  openDispute: () => void;
  closeDispute: () => void;
  disputeReason: string;
  setDisputeReason: (v: string) => void;
  submittingDispute: boolean;
  submitDispute: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns the collections view. Every figure here — collected, pending, aging
 * buckets — is computed with the exact same shared functions screen 028's
 * Financial Overview uses (`@/features/payments/aging`), so the two can
 * never quietly disagree on what "overdue" or "collected" means.
 */
export function usePaymentCollectionDashboard(): PaymentCollectionDashboardState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<PaymentCollectionDashboardStatus>('loading');
  const [lines, setLines] = useState<PaymentCollectionLine[]>([]);

  const [stageFilter, setStageFilter] = useState<PaymentStage | null>(null);
  const [severityFilter, setSeverityFilter] = useState<AgingBucket | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [escalating, setEscalating] = useState(false);

  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidAmount, setMarkPaidAmount] = useState('');
  const [markPaidReference, setMarkPaidReference] = useState('');
  const [markPaidMethod, setMarkPaidMethod] = useState<NonNullable<Payment['method']>>('neft');
  const [submittingMarkPaid, setSubmittingMarkPaid] = useState(false);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await repository.getPaymentCollectionLines();
      setLines(list);
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const displayStatusOf = useCallback((payment: Payment) => displayStatusFor(payment, now), [now]);

  const owners = useMemo(() => [...new Set(lines.map((l) => l.ownerName).filter(Boolean))].sort(), [lines]);

  const filteredLines = useMemo(
    () =>
      lines
        .filter((l) => !stageFilter || l.payment.stage === stageFilter)
        .filter((l) => !severityFilter || displayStatusOf(l.payment) === severityFilter)
        .filter((l) => !ownerFilter || l.ownerName === ownerFilter)
        .sort((a, b) => remainingBalance(b.payment) - remainingBalance(a.payment)),
    [lines, stageFilter, severityFilter, ownerFilter, displayStatusOf],
  );

  const kpis = useMemo<DashboardKpis>(() => {
    const allPayments = lines.map((l) => l.payment);
    // bucketFor only means something once a payment is confirmed
    // outstanding — a paid stage keeps its old due date too, but that's a
    // closed stage, not an overdue receivable, exactly the bug this guard
    // exists to avoid (a paid payment's stale due date otherwise gets
    // misread as "overdue" and inflates this KPI).
    const outstandingPayments = allPayments.filter(isOutstanding);
    const overdueBuckets: AgingBucket[] = ['d30', 'd60', 'd90plus'];
    const overdueLines = outstandingPayments.filter((p) => overdueBuckets.includes(bucketFor(p, now)));
    const disputedLines = allPayments.filter((p) => p.status === 'disputed');
    return {
      collected: computeCashIn(allPayments),
      pending: computeTotalReceivable(allPayments),
      overdueCount: overdueLines.length,
      overdueAmount: overdueLines.reduce((sum, p) => sum + remainingBalance(p), 0),
      disputedCount: disputedLines.length,
      disputedAmount: disputedLines.reduce((sum, p) => sum + remainingBalance(p), 0),
    };
  }, [lines, now]);

  // The median (and so "large") is measured against the whole outstanding
  // portfolio, not whatever the current filter happens to show — a filter
  // narrowing to one owner shouldn't change what counts as a big receivable.
  const medianOutstandingBalance = useMemo(() => {
    const balances = lines
      .map((l) => l.payment)
      .filter(isOutstanding)
      .map(remainingBalance)
      .sort((a, b) => a - b);
    if (balances.length === 0) return 0;
    const mid = Math.floor(balances.length / 2);
    return balances.length % 2 === 0 ? (balances[mid - 1] + balances[mid]) / 2 : balances[mid];
  }, [lines]);

  // Deliberately scoped to overdue/disputed lines, not every outstanding
  // one — the edge case this exists for is a large *overdue* account
  // getting lost in a sea of small normal items, not a large upcoming
  // payment that isn't actually a risk yet.
  const isLargeReceivable = useCallback(
    (payment: Payment) => isOutstanding(payment) && bucketFor(payment, now) !== 'current' && medianOutstandingBalance > 0 && remainingBalance(payment) >= medianOutstandingBalance * LARGE_LINE_MULTIPLE,
    [medianOutstandingBalance, now],
  );

  const openLine = useMemo(() => lines.find((l) => l.payment.id === openId) ?? null, [lines, openId]);

  const openDetail = useCallback((line: PaymentCollectionLine) => setOpenId(line.payment.id), []);
  const closeDetail = useCallback(() => {
    setOpenId(null);
    setMarkPaidOpen(false);
    setDisputeOpen(false);
  }, []);

  const sendReminder = useCallback(async () => {
    if (!openLine || !user) return false;
    setSendingReminder(true);
    try {
      await repository.sendPaymentReminder(openLine.payment.id, user.name);
      return true;
    } catch {
      return false;
    } finally {
      setSendingReminder(false);
    }
  }, [repository, openLine, user]);

  const escalate = useCallback(async () => {
    if (!openLine) return false;
    setEscalating(true);
    try {
      await repository.escalatePayment(openLine.payment.id);
      return true;
    } catch {
      return false;
    } finally {
      setEscalating(false);
    }
  }, [repository, openLine]);

  const openMarkPaid = useCallback(() => {
    if (openLine) setMarkPaidAmount(String(remainingBalance(openLine.payment)));
    setMarkPaidReference('');
    setMarkPaidMethod('neft');
    setMarkPaidOpen(true);
  }, [openLine]);
  const closeMarkPaid = useCallback(() => setMarkPaidOpen(false), []);

  const submitMarkPaid = useCallback(async () => {
    if (!openLine || !user) return false;
    const amount = Number(markPaidAmount);
    if (!amount || amount <= 0 || !markPaidReference.trim()) return false;
    setSubmittingMarkPaid(true);
    try {
      await repository.recordPaymentReceived(openLine.payment.id, {
        amountReceived: amount,
        referenceNumber: markPaidReference.trim(),
        method: markPaidMethod,
        byUserId: user.id,
      });
      setMarkPaidOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingMarkPaid(false);
    }
  }, [repository, openLine, user, markPaidAmount, markPaidReference, markPaidMethod, load]);

  const openDispute = useCallback(() => {
    setDisputeReason('');
    setDisputeOpen(true);
  }, []);
  const closeDispute = useCallback(() => setDisputeOpen(false), []);

  const submitDispute = useCallback(async () => {
    if (!openLine || !user || !disputeReason.trim()) return false;
    setSubmittingDispute(true);
    try {
      await repository.disputePayment(openLine.payment.id, disputeReason.trim(), user.id);
      setDisputeOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingDispute(false);
    }
  }, [repository, openLine, user, disputeReason, load]);

  return {
    status,
    lines: filteredLines,
    kpis,
    displayStatusOf,
    isLargeReceivable,
    now,
    stageFilter,
    setStageFilter,
    severityFilter,
    setSeverityFilter,
    ownerFilter,
    setOwnerFilter,
    owners,
    openLine,
    openDetail,
    closeDetail,
    sendingReminder,
    sendReminder,
    escalating,
    escalate,
    markPaidOpen,
    openMarkPaid,
    closeMarkPaid,
    markPaidAmount,
    setMarkPaidAmount,
    markPaidReference,
    setMarkPaidReference,
    markPaidMethod,
    setMarkPaidMethod,
    submittingMarkPaid,
    submitMarkPaid,
    disputeOpen,
    openDispute,
    closeDispute,
    disputeReason,
    setDisputeReason,
    submittingDispute,
    submitDispute,
    reload: load,
  };
}
