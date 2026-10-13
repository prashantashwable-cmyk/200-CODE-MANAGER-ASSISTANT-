import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SlaOverviewView } from '@/data/repository';
import { POLL_MS } from './sla-monitor.types';

export type SlaMonitorState = ReturnType<typeof useSlaMonitor>;

/** Screen 185. Read-only: the timers are each process's own, gathered on every read and polled, so the numbers here are the numbers there. */
export function useSlaMonitor() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const [view, setView] = useState<SlaOverviewView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.getSlaOverview(user.id); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);
  return {
    load, offline, view, category, refreshing,
    refresh: async () => { setRefreshing(true); try { await read(); } finally { if (alive.current) setRefreshing(false); } },
    openCategory: (id: string | null) => setParams((prev) => { const n = new URLSearchParams(prev); if (id) n.set('category', id); else n.delete('category'); return n; }, { replace: true }),
  };
}
