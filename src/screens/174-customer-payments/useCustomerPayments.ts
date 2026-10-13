import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CustomerPayView } from '@/data/repository';
import { CONFIRMING_POLL_MS, POLL_MS, viewKey } from './customer-payments.types';

export type CustomerPaymentsState = ReturnType<typeof useCustomerPayments>;

/** Screen 174. One repository read of the customer's payments for one project; the last good view is kept on the phone, and the page looks again sooner while a payment is being confirmed. */
export function useCustomerPayments() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const deal = params.get('p') ?? '';
  const stageId = params.get('stage') ?? '';
  const [view, setView] = useState<CustomerPayView | null>(() => {
    if (!user) return null;
    try { const v = JSON.parse(localStorage.getItem(viewKey(user.id, deal)) ?? 'null'); return v && typeof v === 'object' && Array.isArray(v.projects) ? (v as CustomerPayView) : null; } catch { return null; }
  });
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(view ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getCustomerPayments(deal || null, user.id);
      if (!alive.current || mine !== seq.current) return;
      setView(v); setLoad('ready'); setOffline(false);
      try { localStorage.setItem(viewKey(user.id, deal), JSON.stringify(v)); } catch { /* the phone may refuse; the screen still works */ }
    } catch {
      if (alive.current && mine === seq.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); }
    }
  }, [repository, user, deal]);
  const confirming = !!view?.project?.stages.some((s) => s.state === 'confirming');
  useEffect(() => {
    void read();
    const id = window.setInterval(() => void read(), confirming ? CONFIRMING_POLL_MS : POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read, confirming]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  return {
    load, view, offline, deal, stageId,
    refresh: read,
    pick: (id: string) => patch((n) => { n.set('p', id); n.delete('stage'); }),
    openStage: (id: string) => patch((n) => { n.set('stage', id); }),
    closeStage: () => patch((n) => { n.delete('stage'); }),
    goTo: (path: string) => navigate(path),
  };
}
