import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PaymentChainSummary, PaymentChainView } from '@/data/repository';
import type { SupplierPaymentPart } from '@/data/types';
import { checkDeviation, deviationIncreasesRisk } from '@/features/suppliers/paymentChain';
import type { ChainFilter, MilestoneReleaseStatus } from './milestone-payment-release.types';
import { POLL_MS } from './milestone-payment-release.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type MilestoneReleaseState = ReturnType<typeof useMilestonePaymentRelease>;

export function useMilestonePaymentRelease() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const poParam = searchParams.get('po');
  const paymentParam = searchParams.get('payment');
  const detailRef = poParam || paymentParam ? { poId: poParam ?? undefined, paymentId: paymentParam ?? undefined } : null;
  const refKey = `${poParam ?? ''}|${paymentParam ?? ''}`;

  const [status, setStatus] = useState<MilestoneReleaseStatus>('loading');
  const [chains, setChains] = useState<PaymentChainSummary[]>([]);
  const [chain, setChain] = useState<PaymentChainView | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (detailRef) {
        try {
          setChain(await repository.getSupplierPaymentChain(detailRef, user.id));
          setMissing(false);
        } catch (e) {
          if (e instanceof Error && e.message === 'not_found') {
            setChain(null);
            setMissing(true);
          } else throw e;
        }
      } else {
        setChains(await repository.getSupplierPaymentChains(user.id));
        setChain(null);
        setMissing(false);
      }
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a chain that is already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, user, refKey]);

  useEffect(() => {
    setStatus('loading');
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  const openChain = (poId: string) => setSearchParams({ po: poId });
  const closeChain = () => setSearchParams({});

  /* --------------------------------------------------------------- list */
  const [filter, setFilter] = useState<ChainFilter>('all');
  const [query, setQuery] = useState('');
  const counts = useMemo(
    () => ({ all: chains.length, attention: chains.filter((c) => c.anomaly || c.pending > 0).length, complete: chains.filter((c) => c.state === 'complete').length }),
    [chains],
  );
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chains
      .filter((c) => (filter === 'attention' ? c.anomaly || c.pending > 0 : filter === 'complete' ? c.state === 'complete' : true))
      .filter((c) => !q || [c.poCode, c.supplierName, c.siteName].some((v) => v.toLowerCase().includes(q)));
  }, [chains, filter, query]);

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

  /* --------------------------------------------------------- adjust split */
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [upfront, setUpfront] = useState('');
  const [retention, setRetention] = useState('');
  const [reason, setReason] = useState('');
  const [ackRisk, setAckRisk] = useState(false);
  const openAdjust = () => {
    if (!chain) return;
    setUpfront(String(chain.upfrontPct));
    setRetention(String(chain.retentionPct));
    setReason('');
    setAckRisk(false);
    setAdjustOpen(true);
  };
  const nextUpfront = Number(upfront);
  const nextRetention = Number(retention);
  const adjustIssues = chain
    ? checkDeviation({ termType: chain.termType, upfrontPct: chain.upfrontPct, retentionPct: chain.retentionPct, tier: 'standard', custom: chain.custom }, { upfrontPct: nextUpfront, retentionPct: nextRetention }, reason)
    : [];
  const risky = chain ? deviationIncreasesRisk({ upfrontPct: chain.upfrontPct, retentionPct: chain.retentionPct }, { upfrontPct: nextUpfront, retentionPct: nextRetention }) : false;
  const canSaveAdjust = adjustIssues.length === 0 && (!risky || ackRisk) && upfront !== '' && retention !== '';
  const saveAdjust = () =>
    run(async () => {
      if (!user || !chain) throw new Error('forbidden');
      await repository.adjustPaymentSplit(chain.poId, { upfrontPct: nextUpfront, retentionPct: nextRetention, reason, acknowledgeRisk: ackRisk }, user.id);
      setAdjustOpen(false);
    });

  /* -------------------------------------------------------- release early */
  const [earlyFor, setEarlyFor] = useState<SupplierPaymentPart | null>(null);
  const [earlyReason, setEarlyReason] = useState('');
  const openEarly = (part: SupplierPaymentPart) => {
    setEarlyReason('');
    setEarlyFor(part);
  };
  const confirmEarly = () =>
    run(async () => {
      if (!user || !chain || !earlyFor) throw new Error('forbidden');
      await repository.releasePortionEarly(chain.poId, earlyFor, earlyReason, user.id);
      setEarlyFor(null);
    });

  return {
    status,
    reload,
    busy,
    chains,
    chain,
    missing,
    hasDetail: !!detailRef,
    openChain,
    closeChain,
    filter,
    setFilter,
    query,
    setQuery,
    counts,
    shown,
    adjustOpen,
    setAdjustOpen,
    openAdjust,
    upfront,
    setUpfront,
    retention,
    setRetention,
    reason,
    setReason,
    ackRisk,
    setAckRisk,
    nextUpfront,
    nextRetention,
    adjustIssues,
    risky,
    canSaveAdjust,
    saveAdjust,
    earlyFor,
    setEarlyFor,
    earlyReason,
    setEarlyReason,
    openEarly,
    confirmEarly,
  };
}
