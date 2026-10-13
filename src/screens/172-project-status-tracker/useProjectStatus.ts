import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ProjectStatusView } from '@/data/repository';
import { POLL_MS, viewKey } from './project-status.types';

export type ProjectStatusState = ReturnType<typeof useProjectStatus>;

/** Screen 172. One repository read of the customer's project (the installation timeline's customer view, with the whole journey, curated pictures and documents); the last good view is kept on the phone. */
export function useProjectStatus() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const project = params.get('p') ?? '';
  const more = params.get('more') === '1';
  const [view, setView] = useState<ProjectStatusView | null>(() => {
    if (!user) return null;
    try { const v = JSON.parse(localStorage.getItem(viewKey(user.id, project)) ?? 'null'); return v && typeof v === 'object' ? (v as ProjectStatusView) : null; } catch { return null; }
  });
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(view ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const [history, setHistory] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getProjectStatus(project || null, user.id);
      if (!alive.current || mine !== seq.current) return;
      setView(v); setLoad('ready'); setOffline(false);
      try { localStorage.setItem(viewKey(user.id, project), JSON.stringify({ ...v, highlights: v.highlights.slice(0, 4) })); } catch { /* the phone may refuse; the screen still works */ }
    } catch {
      if (alive.current && mine === seq.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); }
    }
  }, [repository, user, project]);
  useEffect(() => { void read(); const id = window.setInterval(() => void read(), POLL_MS); const onShow = () => { if (document.visibilityState === 'visible') void read(); }; document.addEventListener('visibilitychange', onShow); return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); }; }, [read]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  return {
    load, view, offline, more, history, photo,
    refresh: read,
    pick: (key: string) => patch((n) => { n.set('p', key); }),
    setMore: (on: boolean) => patch((n) => { if (on) n.set('more', '1'); else n.delete('more'); }),
    setHistory,
    openPhoto: setPhoto,
    goTo: (path: string) => navigate(path),
  };
}
