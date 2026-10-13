import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AdvanceItemView, AdvanceRetentionBoard, ReleaseBatchResult, RetentionItemView } from '@/data/repository';
import type { AdvanceFilter, ExposureStatus, ExposureTab, RetentionFilter } from './advance-payment-retention.types';
import { POLL_MS } from './advance-payment-retention.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  batch?: ReleaseBatchResult;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type AdvanceRetentionState = ReturnType<typeof useAdvancePaymentRetention>;

export function useAdvancePaymentRetention() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const advanceParam = searchParams.get('advance');
  const tabParam = searchParams.get('tab');

  const [status, setStatus] = useState<ExposureStatus>('loading');
  const [board, setBoard] = useState<AdvanceRetentionBoard | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getAdvanceRetentionBoard(user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a board that is already showing.
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

  const [tab, setTab] = useState<ExposureTab>(tabParam === 'retentions' ? 'retentions' : 'advances');
  const [query, setQuery] = useState('');
  const [advanceFilter, setAdvanceFilter] = useState<AdvanceFilter>('all');
  const [retentionFilter, setRetentionFilter] = useState<RetentionFilter>('all');

  const matches = (q: string, values: string[]) => !q || values.some((v) => v.toLowerCase().includes(q));
  const advances = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (board?.advances ?? []).filter((a) => matches(q, [a.supplierName, a.poCode, a.siteName, a.code]) && (advanceFilter === 'all' ? true : advanceFilter === 'recovering' ? a.state === 'recovering' : a.state === 'late' || a.state === 'stalled' || a.state === 'deal_gone'));
  }, [board, query, advanceFilter]);
  const retentions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (board?.retentions ?? []).filter(
      (r) =>
        matches(q, [r.supplierName, r.poCode, r.siteName]) &&
        (retentionFilter === 'all' ? true : retentionFilter === 'ready' ? r.readiness === 'ready' : retentionFilter === 'blocked' ? r.readiness === 'rework' || r.holds.length > 0 : r.readiness === 'installing' || r.readiness === 'awaiting_qc' || r.readiness === 'no_installation'),
    );
  }, [board, query, retentionFilter]);
  const counts = useMemo(
    () => ({
      advanceAll: board?.advances.length ?? 0,
      advanceAttention: (board?.advances ?? []).filter((a) => a.state === 'late' || a.state === 'stalled' || a.state === 'deal_gone').length,
      advanceRecovering: (board?.advances ?? []).filter((a) => a.state === 'recovering').length,
      retAll: board?.retentions.length ?? 0,
      retReady: (board?.retentions ?? []).filter((r) => r.readiness === 'ready').length,
      retProgress: (board?.retentions ?? []).filter((r) => r.readiness === 'installing' || r.readiness === 'awaiting_qc' || r.readiness === 'no_installation').length,
      retBlocked: (board?.retentions ?? []).filter((r) => r.readiness === 'rework' || r.holds.length > 0).length,
    }),
    [board],
  );

  const run = async (fn: () => Promise<Partial<ActionResult> | void>): Promise<ActionResult> => {
    setBusy(true);
    try {
      const out = (await fn()) ?? {};
      await load();
      return { ok: true, ...out };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------- details */
  const currentAdvance: AdvanceItemView | null = useMemo(() => (board?.advances ?? []).find((a) => a.id === advanceParam) ?? null, [board, advanceParam]);
  const openAdvance = (id: string) => setSearchParams({ advance: id });
  const closeAdvance = () => setSearchParams({}, { replace: true });
  const [retentionId, setRetentionId] = useState<string | null>(null);
  const currentRetention: RetentionItemView | null = useMemo(() => (board?.retentions ?? []).find((r) => r.id === retentionId) ?? null, [board, retentionId]);

  /* ---------------------------------------------------------- auto release */
  const setAuto = (on: boolean) =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      await repository.setAutoReleaseRetention(on, user.id);
    });

  /* ------------------------------------------------------------- recovery */
  const [sheet, setSheet] = useState<'start' | 'recorded' | 'writeoff' | null>(null);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const openSheet = (which: 'start' | 'recorded' | 'writeoff') => {
    setReason('');
    setAmount('');
    setSheet(which);
  };
  const recovery = currentAdvance?.recovery ?? null;
  const amountNumber = Number(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0 && !!currentAdvance && amountNumber <= currentAdvance.outstanding;
  const confirmSheet = () =>
    run(async () => {
      if (!user || !currentAdvance) throw new Error('forbidden');
      if (sheet === 'start') await repository.startAdvanceRecovery(currentAdvance.id, reason, user.id);
      else if (sheet === 'recorded' && recovery) await repository.recordAdvanceRecovered(recovery.id, amountNumber, reason, user.id);
      else if (sheet === 'writeoff' && recovery) await repository.writeOffAdvance(recovery.id, reason, user.id);
      setSheet(null);
    });

  /* ------------------------------------------------------------- decision */
  const [decide, setDecide] = useState<'release' | 'withhold' | null>(null);
  const [decideReason, setDecideReason] = useState('');
  const openDecide = (which: 'release' | 'withhold') => {
    setDecideReason(which === 'release' && currentRetention?.readiness === 'ready' ? '' : '');
    setDecide(which);
  };
  const confirmDecide = () =>
    run(async () => {
      if (!user || !currentRetention || !decide) throw new Error('forbidden');
      await repository.decideRetention(currentRetention.id, decide, decideReason, user.id);
      setDecide(null);
      setRetentionId(null);
    });

  /* ---------------------------------------------------------------- batch */
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const toggleSelecting = () => {
    setSelecting((on) => !on);
    setSelected([]);
  };
  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const readyIds = useMemo(() => (board?.retentions ?? []).filter((r) => r.bulkOk).map((r) => r.id), [board]);
  const chosen = useMemo(() => (board?.retentions ?? []).filter((r) => r.bulkOk && selected.includes(r.id)), [board, selected]);
  const chosenTotal = chosen.reduce((n, r) => n + r.amount, 0);
  const confirmBatch = () =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      const batch = await repository.releaseRetentionsBatch(chosen.map((r) => r.id), user.id);
      setBatchOpen(false);
      setSelecting(false);
      setSelected([]);
      return { batch };
    });

  return {
    status,
    reload,
    busy,
    board,
    tab,
    setTab: (t: ExposureTab) => {
      setTab(t);
      if (t !== 'retentions' && selecting) toggleSelecting();
    },
    query,
    setQuery,
    advanceFilter,
    setAdvanceFilter,
    retentionFilter,
    setRetentionFilter,
    advances,
    retentions,
    counts,
    setAuto,
    advanceParam,
    currentAdvance,
    openAdvance,
    closeAdvance,
    retentionId,
    setRetentionId,
    currentRetention,
    sheet,
    setSheet,
    openSheet,
    reason,
    setReason,
    amount,
    setAmount,
    amountValid,
    confirmSheet,
    decide,
    setDecide,
    decideReason,
    setDecideReason,
    openDecide,
    confirmDecide,
    selecting,
    toggleSelecting,
    selected,
    toggle,
    readyIds,
    chosen,
    chosenTotal,
    selectAll: () => setSelected(readyIds),
    clearSelection: () => setSelected([]),
    batchOpen,
    setBatchOpen,
    confirmBatch,
  };
}
