import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DisputeTargets, SupplierDisputeBoard, SupplierDisputeView } from '@/data/repository';
import type { DisputeProcessArea, SupplierDisputeDecision, SupplierDisputeKind } from '@/data/types';
import { canPartial, decisionProblem, maxAmountOf } from '@/features/suppliers/disputes';
import type { DisputeStatus, QueueFilter } from './supplier-dispute-resolution.types';
import { POLL_MS } from './supplier-dispute-resolution.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type SupplierDisputeState = ReturnType<typeof useSupplierDisputeResolution>;

export function useSupplierDisputeResolution() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const disputeParam = searchParams.get('dispute');

  const [status, setStatus] = useState<DisputeStatus>('loading');
  const [board, setBoard] = useState<SupplierDisputeBoard | null>(null);
  const [detail, setDetail] = useState<SupplierDisputeView | null>(null);
  const [detailMissing, setDetailMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getSupplierDisputeBoard(user.id));
      if (disputeParam) {
        try {
          setDetail(await repository.getSupplierDispute(disputeParam, user.id));
          setDetailMissing(false);
        } catch {
          setDetail(null);
          setDetailMissing(true);
        }
      } else {
        setDetail(null);
        setDetailMissing(false);
      }
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a queue that is already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, disputeParam]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  const [filter, setFilter] = useState<QueueFilter>('open');
  const [query, setQuery] = useState('');
  const counts = useMemo(() => ({ open: board?.totals.open ?? 0, resolved: board?.totals.resolved ?? 0, all: board?.rows.length ?? 0 }), [board]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (board?.rows ?? []).filter((r) => (filter === 'all' || r.status === filter) && (!q || [r.supplierName, r.poCode, r.code, r.siteName, r.position].some((v) => v.toLowerCase().includes(q))));
  }, [board, filter, query]);

  const openDispute = (id: string) => setSearchParams({ dispute: id });
  const closeDispute = () => setSearchParams({}, { replace: true });

  const run = async (fn: () => Promise<void>): Promise<ActionResult> => {
    setBusy(true);
    try {
      await fn();
      await load();
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------- decision */
  const [decideOpen, setDecideOpen] = useState(false);
  const [decision, setDecision] = useState<SupplierDisputeDecision>('uphold');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const openDecide = () => {
    setDecision('uphold');
    setAmount('');
    setNote('');
    setDecideOpen(true);
  };
  const amountNumber = Number(amount);
  /** The client checks with the same rules the repository does, so nothing is sent that would be refused. */
  const decisionError = useMemo(() => {
    if (!detail) return 'note_required' as const;
    return decisionProblem({ decision, amount: decision === 'uphold' ? 0 : Number.isFinite(amountNumber) ? amountNumber : 0, note }, { kind: detail.kind, claimed: detail.claimedAmount, alreadyGiven: detail.alreadyGiven });
  }, [detail, decision, amountNumber, note]);
  /** What a decision for the supplier would give, shown before it is made. */
  const giveAmount = useMemo(() => {
    if (!detail || decision === 'uphold') return 0;
    if (decision === 'partial') return Number.isFinite(amountNumber) ? amountNumber : 0;
    if (detail.kind === 'retention_timing') return detail.evidence.retention?.amount ?? 0;
    if (detail.kind === 'invoice') return 0;
    return maxAmountOf({ kind: detail.kind, claimed: detail.claimedAmount, alreadyGiven: detail.alreadyGiven }) ?? (Number.isFinite(amountNumber) ? amountNumber : 0);
  }, [detail, decision, amountNumber]);
  const amountNeeded = !!detail && detail.kind === 'amount' && (decision === 'partial' || (decision === 'supplier_favor' && detail.maxAmount === null));
  const confirmDecide = () =>
    run(async () => {
      if (!user || !detail) throw new Error('forbidden');
      await repository.resolveSupplierDispute(detail.id, { decision, amount: amountNeeded ? amountNumber : undefined, note }, user.id);
      setDecideOpen(false);
    });

  /* --------------------------------------------------------------- reopen */
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const openReopen = () => {
    setReopenReason('');
    setReopenOpen(true);
  };
  const confirmReopen = () =>
    run(async () => {
      if (!user || !detail) throw new Error('forbidden');
      await repository.reopenSupplierDispute(detail.id, reopenReason, user.id);
      setReopenOpen(false);
    });

  /* -------------------------------------------------------------- process */
  const [processOpen, setProcessOpen] = useState<'flag' | 'address' | null>(null);
  const [area, setArea] = useState<DisputeProcessArea>('invoice_matching');
  const [processNote, setProcessNote] = useState('');
  const openProcess = (mode: 'flag' | 'address') => {
    setProcessNote('');
    setArea('invoice_matching');
    setProcessOpen(mode);
  };
  const confirmProcess = () =>
    run(async () => {
      if (!user || !detail || !processOpen) throw new Error('forbidden');
      if (processOpen === 'flag') await repository.flagDisputeProcessIssue(detail.id, { area, note: processNote }, user.id);
      else await repository.addressDisputeProcessIssue(detail.id, processNote, user.id);
      setProcessOpen(null);
    });

  /* ----------------------------------------------------------------- raise */
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [targets, setTargets] = useState<DisputeTargets | null>(null);
  const [kind, setKind] = useState<SupplierDisputeKind>('amount');
  const [targetId, setTargetId] = useState('');
  const [position, setPosition] = useState('');
  const [claimed, setClaimed] = useState('');
  const [halt, setHalt] = useState(false);
  const openRaise = async () => {
    if (!user) return;
    setKind('amount');
    setTargetId('');
    setPosition('');
    setClaimed('');
    setHalt(false);
    setTargets(await repository.getDisputeTargets(user.id));
    setRaiseOpen(true);
  };
  const targetList = useMemo(() => {
    if (!targets) return [];
    if (kind === 'amount') return targets.payments.map((p) => ({ id: p.id, poId: p.poId, label: `${p.supplierName} · ${p.poCode} · ${p.code}` }));
    if (kind === 'retention_timing') return targets.retentions.map((r) => ({ id: r.id, poId: r.poId, label: `${r.supplierName} · ${r.poCode}` }));
    return targets.invoices.map((i) => ({ id: i.id, poId: i.poId, label: `${i.supplierName} · ${i.poCode} · ${i.number}` }));
  }, [targets, kind]);
  const chosen = targetList.find((t) => t.id === targetId);
  const claimedNumber = Number(claimed);
  const raiseValid = !!chosen && position.trim().length >= 15 && (kind !== 'amount' || (Number.isFinite(claimedNumber) && claimedNumber > 0));
  const confirmRaise = () =>
    run(async () => {
      if (!user || !chosen) throw new Error('forbidden');
      const v = await repository.raiseSupplierDispute(
        { kind, poId: chosen.poId, paymentId: kind === 'amount' ? chosen.id : undefined, retentionId: kind === 'retention_timing' ? chosen.id : undefined, invoiceId: kind === 'invoice' ? chosen.id : undefined, position, claimedAmount: kind === 'amount' ? claimedNumber : undefined, threatensHalt: halt },
        user.id,
      );
      setRaiseOpen(false);
      setSearchParams({ dispute: v.id });
    });

  return {
    status,
    reload,
    busy,
    board,
    detail,
    detailMissing,
    disputeParam,
    filter,
    setFilter,
    query,
    setQuery,
    counts,
    shown,
    openDispute,
    closeDispute,
    decideOpen,
    setDecideOpen,
    openDecide,
    decision,
    setDecision,
    amount,
    setAmount,
    note,
    setNote,
    decisionError,
    giveAmount,
    amountNeeded,
    canPartialHere: !!detail && canPartial(detail.kind),
    confirmDecide,
    reopenOpen,
    setReopenOpen,
    openReopen,
    reopenReason,
    setReopenReason,
    confirmReopen,
    processOpen,
    setProcessOpen,
    openProcess,
    area,
    setArea,
    processNote,
    setProcessNote,
    confirmProcess,
    raiseOpen,
    setRaiseOpen,
    openRaise,
    kind,
    setKind,
    targetId,
    setTargetId,
    targetList,
    position,
    setPosition,
    claimed,
    setClaimed,
    halt,
    setHalt,
    raiseValid,
    confirmRaise,
  };
}
