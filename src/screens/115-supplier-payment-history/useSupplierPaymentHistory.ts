import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PaymentHistoryDetail, PaymentHistoryEntry, PaymentHistoryFilter, PaymentHistoryPage } from '@/data/repository';
import type { PartFilter, PaymentHistoryStatus } from './supplier-payment-history.types';
import { PAGE_SIZE } from './supplier-payment-history.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type SupplierPaymentHistoryState = ReturnType<typeof useSupplierPaymentHistory>;

export function useSupplierPaymentHistory() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentParam = searchParams.get('payment');

  /* ------------------------------------------------------------- filters */
  const [supplierId, setSupplierId] = useState('');
  const [part, setPart] = useState<PartFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const badRange = from !== '' && to !== '' && from > to;
  const isFiltered = supplierId !== '' || part !== 'all' || from !== '' || to !== '' || query.trim() !== '';
  const clearFilters = () => {
    setSupplierId('');
    setPart('all');
    setFrom('');
    setTo('');
    setQuery('');
  };
  const filter: PaymentHistoryFilter = useMemo(
    () => ({ supplierId: supplierId || undefined, part: part === 'all' ? undefined : part, from: from || undefined, to: to || undefined, query: query.trim() || undefined }),
    [supplierId, part, from, to, query],
  );

  /* ---------------------------------------------------------------- data */
  const [status, setStatus] = useState<PaymentHistoryStatus>('loading');
  const [page, setPage] = useState<PaymentHistoryPage | null>(null);
  const [entries, setEntries] = useState<PaymentHistoryEntry[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);
  // A slow answer to an old filter must never overwrite the answer to the current one.
  const ticket = useRef(0);

  const load = useCallback(async () => {
    if (!user || badRange) return;
    const mine = ++ticket.current;
    try {
      const result = await repository.getSupplierPaymentHistory({ ...filter, offset: 0, limit: PAGE_SIZE }, user.id);
      if (mine !== ticket.current) return;
      setPage(result);
      setEntries(result.entries);
      setStatus('ready');
    } catch {
      if (mine === ticket.current) setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, filter, badRange]);

  useEffect(() => {
    void load();
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  const loadMore = async () => {
    if (!user || !page?.hasMore || loadingMore) return;
    setLoadingMore(true);
    const mine = ticket.current;
    try {
      const next = await repository.getSupplierPaymentHistory({ ...filter, offset: entries.length, limit: PAGE_SIZE }, user.id);
      if (mine === ticket.current) {
        setEntries((cur) => [...cur, ...next.entries.filter((e) => !cur.some((c) => c.id === e.id))]);
        setPage(next);
      }
    } catch {
      /* a failed "more" leaves what is showing alone */
    } finally {
      setLoadingMore(false);
    }
  };

  /* -------------------------------------------------------------- detail */
  const [detail, setDetail] = useState<PaymentHistoryDetail | null>(null);
  const [detailMissing, setDetailMissing] = useState(false);
  const loadDetail = useCallback(async () => {
    if (!user || !paymentParam) {
      setDetail(null);
      setDetailMissing(false);
      return;
    }
    try {
      setDetail(await repository.getSupplierPaymentHistoryEntry(paymentParam, user.id));
      setDetailMissing(false);
    } catch {
      setDetail(null);
      setDetailMissing(true);
    }
  }, [repository, user, paymentParam]);
  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);
  const openPayment = (id: string) => setSearchParams({ payment: id });
  const closePayment = () => setSearchParams({}, { replace: true });

  const run = async (fn: () => Promise<void>): Promise<ActionResult> => {
    setBusy(true);
    try {
      await fn();
      await Promise.all([load(), loadDetail()]);
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------- adjustment */
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [direction, setDirection] = useState<'credit' | 'top_up'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const openAdjust = () => {
    setDirection('credit');
    setAmount('');
    setReason('');
    setAdjustOpen(true);
  };
  const amountNumber = Number(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0 && (direction === 'top_up' || !detail || amountNumber <= detail.netAmount);
  const confirmAdjust = () =>
    run(async () => {
      if (!user || !detail) throw new Error('forbidden');
      await repository.recordPaymentAdjustment(detail.id, { direction, amount: amountNumber, reason }, user.id);
      setAdjustOpen(false);
    });

  /* --------------------------------------------------------------- query */
  const [queryOpen, setQueryOpen] = useState(false);
  const [note, setNote] = useState('');
  const openQuery = () => {
    setNote('');
    setQueryOpen(true);
  };
  const confirmQuery = () =>
    run(async () => {
      if (!user || !detail) throw new Error('forbidden');
      await repository.queryPayment(detail.id, note, user.id);
      setQueryOpen(false);
    });

  /* -------------------------------------------------------------- dispute */
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [position, setPosition] = useState('');
  const [claimed, setClaimed] = useState('');
  const [halt, setHalt] = useState(false);
  const openDispute = () => {
    setPosition('');
    setClaimed('');
    setHalt(false);
    setDisputeOpen(true);
  };
  const claimedNumber = Number(claimed);
  const disputeValid = position.trim().length >= 15 && Number.isFinite(claimedNumber) && claimedNumber > 0;
  const confirmDispute = () =>
    run(async () => {
      if (!user || !detail) throw new Error('forbidden');
      await repository.raiseSupplierDispute({ kind: 'amount', poId: detail.poId, paymentId: detail.id, position, claimedAmount: claimedNumber, threatensHalt: halt }, user.id);
      setDisputeOpen(false);
    });
  const [contestId, setContestId] = useState<string | null>(null);
  const [contestReason, setContestReason] = useState('');
  const openContest = (id: string) => {
    setContestReason('');
    setContestId(id);
  };
  const confirmContest = () =>
    run(async () => {
      if (!user || !contestId) throw new Error('forbidden');
      await repository.reopenSupplierDispute(contestId, contestReason, user.id);
      setContestId(null);
    });

  /* -------------------------------------------------------------- export */
  const [exporting, setExporting] = useState(false);
  /** Everything that matches the filter, not just the pages on screen. */
  const fetchAll = async (): Promise<PaymentHistoryEntry[]> => {
    if (!user) return [];
    setExporting(true);
    try {
      return (await repository.getSupplierPaymentHistory({ ...filter, offset: 0, limit: 0 }, user.id)).entries;
    } finally {
      setExporting(false);
    }
  };

  return {
    status,
    reload,
    busy,
    page,
    entries,
    isAdmin: page?.viewer !== 'supplier',
    supplierId,
    setSupplierId,
    part,
    setPart,
    from,
    setFrom,
    to,
    setTo,
    query,
    setQuery,
    badRange,
    isFiltered,
    clearFilters,
    loadMore,
    loadingMore,
    paymentParam,
    detail,
    detailMissing,
    openPayment,
    closePayment,
    adjustOpen,
    setAdjustOpen,
    openAdjust,
    direction,
    setDirection,
    amount,
    setAmount,
    amountValid,
    reason,
    setReason,
    confirmAdjust,
    queryOpen,
    setQueryOpen,
    openQuery,
    note,
    setNote,
    confirmQuery,
    disputeOpen,
    setDisputeOpen,
    openDispute,
    position,
    setPosition,
    claimed,
    setClaimed,
    halt,
    setHalt,
    disputeValid,
    confirmDispute,
    contestId,
    setContestId,
    contestReason,
    setContestReason,
    openContest,
    confirmContest,
    exporting,
    fetchAll,
  };
}
