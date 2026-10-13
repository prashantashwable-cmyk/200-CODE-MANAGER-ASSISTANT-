import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { BillingOverview, BillingServiceDetail, PaymentMethodInput, TierChangeInput, TierChangePreview } from '@/data/repository';
import { POLL_MS } from './subscription-billing.types';

export type BillingScreenState = ReturnType<typeof useSubscriptionBilling>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');

/** Screen 197. The overview and one service's detail are read from the repository; every change is judged and recorded there, then both are read again. */
export function useSubscriptionBilling() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [params, setParams] = useSearchParams();
  const serviceId = params.get('service') ?? '';
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const loadOverview = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getBillingOverview(uid); if (!alive.current) return; setOverview(v); setOffline(false); setLoad('ready'); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);
  const [detail, setDetail] = useState<BillingServiceDetail | null>(null);
  const [detailLoad, setDetailLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadDetail = useCallback(async (id: string) => {
    if (!uid || !id) { setDetail(null); return; }
    try { const v = await repository.getServiceBilling(uid, id); if (!alive.current) return; setDetail(v); setDetailLoad('ready'); } catch { if (alive.current) setDetailLoad('error'); }
  }, [repository, uid]);
  useEffect(() => { setDetailLoad('loading'); void loadDetail(serviceId); }, [serviceId, loadDetail]);
  useEffect(() => {
    void loadOverview();
    const id = window.setInterval(() => { void loadOverview(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void loadOverview(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [loadOverview]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); void loadOverview(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const keep = (v: BillingServiceDetail): BillingServiceDetail => { setDetail(v); return v; };
  const patch = (changes: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true });

  return {
    load, offline, busy, overview, serviceId, detail, detailLoad,
    refresh: async () => { await Promise.all([loadOverview(), loadDetail(serviceId)]); },
    openService: (id: string | null) => patch({ service: id }),
    previewTier: (id: string, tierId: string, when: 'renewal' | 'now') => repository.previewTierChange(uid, id, tierId, when).then((value) => ({ ok: true, value }) as Result<TierChangePreview>).catch((e) => ({ ok: false, problem: problemOf(e) }) as Result<TierChangePreview>),
    changeTier: (id: string, input: TierChangeInput) => act(() => repository.changeServiceTier(uid, id, input).then(keep)),
    updateCard: (id: string, input: PaymentMethodInput) => act(() => repository.updatePaymentMethod(uid, id, input).then(keep)),
    retry: (id: string) => act(() => repository.retryServicePayment(uid, id).then(keep)),
    setAutoRenew: (id: string, on: boolean, reason: string) => act(() => repository.setServiceAutoRenew(uid, id, on, reason).then(keep)),
    markRenewed: (id: string, note: string) => act(() => repository.markServiceRenewed(uid, id, note).then(keep)),
    noteUsage: (id: string, month: string, note: string) => act(() => repository.noteServiceUsage(uid, id, month, note).then(keep)),
    simulate: (id: string, kind: 'declined' | 'expired' | 'clear') => act(() => repository.simulateBillingProblem(uid, id, kind).then(keep)),
  };
}
