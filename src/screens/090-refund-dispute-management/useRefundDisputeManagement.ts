import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Invoice } from '@/data/types';
import type { PaymentDisputeRow } from '@/data/repository';
import type { DisputeSegment, RefundDisputeManagementStatus } from './refund-dispute-management.types';

interface RefundDisputeManagementState {
  status: RefundDisputeManagementStatus;
  rows: PaymentDisputeRow[];
  segment: DisputeSegment;
  setSegment: (s: DisputeSegment) => void;
  openCount: number;
  resolvedCount: number;

  openRow: PaymentDisputeRow | null;
  openDetail: (row: PaymentDisputeRow) => void;
  closeDetail: () => void;
  lastCreditNote: Invoice | null;

  fullRefundOpen: boolean;
  openFullRefund: () => void;
  closeFullRefund: () => void;
  fullRefundReason: string;
  setFullRefundReason: (v: string) => void;
  submittingFullRefund: boolean;
  submitFullRefund: () => Promise<boolean>;

  partialRefundOpen: boolean;
  openPartialRefund: () => void;
  closePartialRefund: () => void;
  partialRefundAmount: string;
  setPartialRefundAmount: (v: string) => void;
  partialRefundReason: string;
  setPartialRefundReason: (v: string) => void;
  submittingPartialRefund: boolean;
  submitPartialRefund: () => Promise<boolean>;

  rejectOpen: boolean;
  openReject: () => void;
  closeReject: () => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  submittingReject: boolean;
  submitReject: () => Promise<boolean>;

  reload: () => Promise<void>;
}

export function useRefundDisputeManagement(): RefundDisputeManagementState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<RefundDisputeManagementStatus>('loading');
  const [allRows, setAllRows] = useState<PaymentDisputeRow[]>([]);
  const [segment, setSegment] = useState<DisputeSegment>('open');

  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);
  const [lastCreditNote, setLastCreditNote] = useState<Invoice | null>(null);

  const [fullRefundOpen, setFullRefundOpen] = useState(false);
  const [fullRefundReason, setFullRefundReason] = useState('');
  const [submittingFullRefund, setSubmittingFullRefund] = useState(false);

  const [partialRefundOpen, setPartialRefundOpen] = useState(false);
  const [partialRefundAmount, setPartialRefundAmount] = useState('');
  const [partialRefundReason, setPartialRefundReason] = useState('');
  const [submittingPartialRefund, setSubmittingPartialRefund] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await repository.getDisputeQueue();
      setAllRows(list);
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCount = useMemo(() => allRows.filter((r) => !r.isResolved).length, [allRows]);
  const resolvedCount = useMemo(() => allRows.filter((r) => r.isResolved).length, [allRows]);
  const rows = useMemo(() => allRows.filter((r) => (segment === 'open' ? !r.isResolved : r.isResolved)), [allRows, segment]);

  const openRow = useMemo(() => allRows.find((r) => r.payment.id === openPaymentId) ?? null, [allRows, openPaymentId]);

  const openDetail = useCallback((row: PaymentDisputeRow) => {
    setOpenPaymentId(row.payment.id);
    setLastCreditNote(null);
  }, []);
  const closeDetail = useCallback(() => {
    setOpenPaymentId(null);
    setFullRefundOpen(false);
    setPartialRefundOpen(false);
    setRejectOpen(false);
  }, []);

  const openFullRefund = useCallback(() => {
    setFullRefundReason('');
    setFullRefundOpen(true);
  }, []);
  const closeFullRefund = useCallback(() => setFullRefundOpen(false), []);

  const submitFullRefund = useCallback(async () => {
    if (!openRow || !user || !fullRefundReason.trim()) return false;
    setSubmittingFullRefund(true);
    try {
      const result = await repository.resolvePaymentDispute(openRow.payment.id, {
        resolutionType: 'full_refund',
        note: fullRefundReason.trim(),
        byName: user.name,
      });
      setLastCreditNote(result.creditNote);
      setFullRefundOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingFullRefund(false);
    }
  }, [repository, openRow, user, fullRefundReason, load]);

  const openPartialRefund = useCallback(() => {
    setPartialRefundAmount('');
    setPartialRefundReason('');
    setPartialRefundOpen(true);
  }, []);
  const closePartialRefund = useCallback(() => setPartialRefundOpen(false), []);

  const submitPartialRefund = useCallback(async () => {
    if (!openRow || !user || !partialRefundReason.trim()) return false;
    const amount = Number(partialRefundAmount);
    if (!amount || amount <= 0 || amount > openRow.amountPaid) return false;
    setSubmittingPartialRefund(true);
    try {
      const result = await repository.resolvePaymentDispute(openRow.payment.id, {
        resolutionType: 'partial_refund',
        resolutionAmount: amount,
        note: partialRefundReason.trim(),
        byName: user.name,
      });
      setLastCreditNote(result.creditNote);
      setPartialRefundOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingPartialRefund(false);
    }
  }, [repository, openRow, user, partialRefundAmount, partialRefundReason, load]);

  const openReject = useCallback(() => {
    setRejectReason('');
    setRejectOpen(true);
  }, []);
  const closeReject = useCallback(() => setRejectOpen(false), []);

  const submitReject = useCallback(async () => {
    if (!openRow || !user || !rejectReason.trim()) return false;
    setSubmittingReject(true);
    try {
      await repository.resolvePaymentDispute(openRow.payment.id, {
        resolutionType: 'rejected',
        note: rejectReason.trim(),
        byName: user.name,
      });
      setRejectOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingReject(false);
    }
  }, [repository, openRow, user, rejectReason, load]);

  return {
    status,
    rows,
    segment,
    setSegment,
    openCount,
    resolvedCount,
    openRow,
    openDetail,
    closeDetail,
    lastCreditNote,
    fullRefundOpen,
    openFullRefund,
    closeFullRefund,
    fullRefundReason,
    setFullRefundReason,
    submittingFullRefund,
    submitFullRefund,
    partialRefundOpen,
    openPartialRefund,
    closePartialRefund,
    partialRefundAmount,
    setPartialRefundAmount,
    partialRefundReason,
    setPartialRefundReason,
    submittingPartialRefund,
    submitPartialRefund,
    rejectOpen,
    openReject,
    closeReject,
    rejectReason,
    setRejectReason,
    submittingReject,
    submitReject,
    reload: load,
  };
}
