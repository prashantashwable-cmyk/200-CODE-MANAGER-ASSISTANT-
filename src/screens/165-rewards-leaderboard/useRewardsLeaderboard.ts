import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ContestLeaderboardView } from '@/data/repository';
import { CLOSING_POLL_MS, LIVE_POLL_MS } from './rewards-leaderboard.types';

export type RewardsLeaderboardState = ReturnType<typeof useRewardsLeaderboard>;

/**
 * Screen 165. The standings of the contests running now, for the people in them and for Admin: one repository computation, so every role sees the same numbers. The page keeps
 * itself current (quicker in the last day of a contest), says when it last heard, and says so plainly when it could not update rather than showing stale numbers as live.
 */
export function useRewardsLeaderboard() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const contestId = params.get('contest') || null;
  const [data, setData] = useState<ContestLeaderboardView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [stale, setStale] = useState(false);
  const [heardAt, setHeardAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getContestLeaderboard(contestId, user.id);
      if (alive.current && mine === seq.current) { setData(v); setLoad('ready'); setStale(false); setHeardAt(Date.now()); }
    } catch {
      if (alive.current && mine === seq.current) { setLoad((s) => (s === 'ready' ? s : 'error')); setStale(true); }
    }
  }, [repository, user, contestId]);

  const closing = !!data?.selected?.closingSoon;
  useEffect(() => { setLoad((s) => (s === 'ready' ? s : 'loading')); void read(); const id = window.setInterval(() => void read(), closing ? CLOSING_POLL_MS : LIVE_POLL_MS); return () => window.clearInterval(id); }, [read, closing]);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), closing ? 1_000 : 15_000); return () => window.clearInterval(id); }, [closing]);
  // Coming back to the page counts as looking again: it refreshes at once.
  useEffect(() => { const on = () => { if (document.visibilityState === 'visible') void read(); }; document.addEventListener('visibilitychange', on); return () => document.removeEventListener('visibilitychange', on); }, [read]);

  return {
    load, data, stale, heardAt, now, refreshing, contestId, role: user?.role ?? null,
    pick: (id: string) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('contest', id); return n; }, { replace: true }),
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await read(); } finally { if (alive.current) setRefreshing(false); } },
  };
}
