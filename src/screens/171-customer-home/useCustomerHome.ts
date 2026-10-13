import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CustomerHomeView } from '@/data/repository';
import { POLL_MS, viewKey } from './customer-home.types';

export type CustomerHomeState = ReturnType<typeof useCustomerHome>;

/**
 * Screen 171. A summary: everything here is read from the same records the detailed customer screens use (the installation timeline, the deal's payments, the warranty), through one repository
 * read for the chosen project. The last good view is kept on the phone so the home opens even with no signal, and says so rather than showing old numbers as live.
 */
export function useCustomerHome() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const project = params.get('p') ?? '';
  const [view, setView] = useState<CustomerHomeView | null>(() => {
    if (!user) return null;
    try { const v = JSON.parse(localStorage.getItem(viewKey(user.id, project)) ?? 'null'); return v && typeof v === 'object' ? (v as CustomerHomeView) : null; } catch { return null; }
  });
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(view ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  // Something we would like to ask about, at the right moment (177): a quiet card, never a blocker.
  const [feedbackDue, setFeedbackDue] = useState(0);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getCustomerHome(project || null, user.id);
      if (!alive.current || mine !== seq.current) return;
      setView(v); setLoad('ready'); setOffline(false);
      void repository.getFeedbackDesk(user.id).then((d) => { if (alive.current) setFeedbackDue(d.due.length); }).catch(() => undefined);
      try { localStorage.setItem(viewKey(user.id, project), JSON.stringify(v)); } catch { /* the phone may refuse; the screen still works */ }
    } catch {
      if (alive.current && mine === seq.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); }
    }
  }, [repository, user, project]);
  useEffect(() => { void read(); const id = window.setInterval(() => void read(), POLL_MS); const onShow = () => { if (document.visibilityState === 'visible') void read(); }; document.addEventListener('visibilitychange', onShow); return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); }; }, [read]);

  return {
    load, view, offline, feedbackDue,
    project: view?.current?.key ?? project,
    refresh: read,
    pick: (key: string) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('p', key); return n; }, { replace: true }),
    goTo: (path: string) => navigate(path),
  };
}
