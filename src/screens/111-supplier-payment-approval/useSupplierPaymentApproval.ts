import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { BatchApproveResult, SupplierPaymentQueue, SupplierPaymentView } from '@/data/repository';
import type { QueueFilter, SupplierPaymentApprovalStatus } from './supplier-payment-approval.types';
import { POLL_MS } from './supplier-payment-approval.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  batch?: BatchApproveResult;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type SupplierPaymentApprovalState = ReturnType<typeof useSupplierPaymentApproval>;

export function useSupplierPaymentApproval() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentParam = searchParams.get('payment');

  const [status, setStatus] = useState<SupplierPaymentApprovalStatus>('loading');
  const [queue, setQueue] = useState<SupplierPaymentQueue | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setQueue(await repository.getSupplierPaymentQueue(user.id));
      setNow(Date.now());
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a queue that is already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  // A live clock only while an approval is still reversible, so its countdown is honest.
  const anyReversible = (queue?.recent ?? []).some((p) => p.status === 'approved');
  useEffect(() => {
    if (!anyReversible) return undefined;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [anyReversible]);
  // The moment a window closes, re-read so it shows as made.
  const closing = (queue?.recent ?? []).some((p) => p.status === 'approved' && p.reversibleUntil && new Date(p.reversibleUntil).getTime() <= now);
  useEffect(() => {
    if (closing) void load();
  }, [closing, load]);

  /* ------------------------------------------------------------- filters */
  const [filter, setFilter] = useState<QueueFilter>('toApprove');
  const [query, setQuery] = useState('');
  const counts = useMemo(() => ({ toApprove: queue?.toApprove.length ?? 0, waiting: queue?.waiting.length ?? 0, held: queue?.held.length ?? 0, recent: queue?.recent.length ?? 0 }), [queue]);
  const base: SupplierPaymentView[] = useMemo(() => (queue ? queue[filter] : []), [queue, filter]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return base.filter((p) => !q || [p.supplierName, p.poCode, p.siteName, p.code].some((v) => v.toLowerCase().includes(q)));
  }, [base, query]);

  /* -------------------------------------------------------------- detail */
  const all = useMemo(() => (queue ? [...queue.toApprove, ...queue.waiting, ...queue.held, ...queue.recent] : []), [queue]);
  const current = useMemo(() => all.find((p) => p.id === paymentParam) ?? null, [all, paymentParam]);
  const openPayment = (id: string) => setSearchParams({ payment: id }, { replace: false });
  const closePayment = () => {
    setAcknowledged(false);
    setSearchParams({}, { replace: true });
  };
  const [acknowledged, setAcknowledged] = useState(false);

  const run = async (fn: () => Promise<ActionResult | void>): Promise<ActionResult> => {
    setBusy(true);
    try {
      const out = (await fn()) ?? { ok: true };
      await load();
      return out;
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  const approve = (p: SupplierPaymentView) =>
    run(async () => {
      if (!user) return { ok: false, code: 'forbidden' };
      await repository.approveSupplierPayment(p.id, { acknowledgeFlags: acknowledged }, user.id);
      setAcknowledged(false);
      closePayment();
      return { ok: true };
    });

  /* ---------------------------------------------------------------- hold */
  const [holdFor, setHoldFor] = useState<SupplierPaymentView | null>(null);
  const [reason, setReason] = useState('');
  const openHold = (p: SupplierPaymentView) => {
    setReason('');
    setHoldFor(p);
  };
  const confirmHold = () =>
    run(async () => {
      if (!user || !holdFor) return { ok: false, code: 'forbidden' };
      await repository.holdSupplierPayment(holdFor.id, reason, user.id);
      setHoldFor(null);
      closePayment();
      return { ok: true };
    });
  const release = (p: SupplierPaymentView) =>
    run(async () => {
      if (!user) return { ok: false, code: 'forbidden' };
      await repository.releaseSupplierPaymentHold(p.id, user.id);
      closePayment();
      return { ok: true };
    });

  /* ------------------------------------------------------------- reverse */
  const [reverseFor, setReverseFor] = useState<SupplierPaymentView | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const openReverse = (p: SupplierPaymentView) => {
    setReverseReason('');
    setReverseFor(p);
  };
  const confirmReverse = () =>
    run(async () => {
      if (!user || !reverseFor) return { ok: false, code: 'forbidden' };
      await repository.reverseSupplierPaymentApproval(reverseFor.id, reverseReason, user.id);
      setReverseFor(null);
      return { ok: true };
    });

  /* --------------------------------------------------------------- batch */
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const toggleSelecting = () => {
    setSelecting((on) => !on);
    setSelected([]);
  };
  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const routineIds = useMemo(() => (queue?.toApprove ?? []).filter((p) => p.routine).map((p) => p.id), [queue]);
  // Only what is still routine and on screen stays selected.
  const chosen = useMemo(() => (queue?.toApprove ?? []).filter((p) => p.routine && selected.includes(p.id)), [queue, selected]);
  const chosenTotal = chosen.reduce((n, p) => n + p.amount, 0);
  const selectAllRoutine = () => setSelected(routineIds);
  const clearSelection = () => setSelected([]);
  const confirmBatch = () =>
    run(async () => {
      if (!user) return { ok: false, code: 'forbidden' };
      const batch = await repository.approveSupplierPaymentsBatch(chosen.map((p) => p.id), user.id);
      setBatchOpen(false);
      setSelecting(false);
      setSelected([]);
      return { ok: true, batch };
    });

  return {
    status,
    reload,
    busy,
    queue,
    now,
    filter,
    setFilter,
    query,
    setQuery,
    counts,
    shown,
    current,
    paymentParam,
    openPayment,
    closePayment,
    acknowledged,
    setAcknowledged,
    approve,
    holdFor,
    setHoldFor,
    reason,
    setReason,
    openHold,
    confirmHold,
    release,
    reverseFor,
    setReverseFor,
    reverseReason,
    setReverseReason,
    openReverse,
    confirmReverse,
    selecting,
    toggleSelecting,
    selected,
    toggle,
    routineIds,
    chosen,
    chosenTotal,
    selectAllRoutine,
    clearSelection,
    batchOpen,
    setBatchOpen,
    confirmBatch,
  };
}
