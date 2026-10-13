import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { BadgeCollectionView } from '@/data/repository';
import { CATEGORY_FILTERS } from './badges-milestones.types';
import type { CategoryFilter } from './badges-milestones.types';

export type BadgesState = ReturnType<typeof useBadges>;

const showcaseKey = (userId: string) => `aiec.badgeShowcase.${userId}`;
const readShowcase = (userId: string): string[] | null => { try { const v = localStorage.getItem(showcaseKey(userId)); return v ? (JSON.parse(v) as string[]) : null; } catch { return null; } };

/**
 * Screen 166. The partner's own collection: badges from their work, their training certifications and their time with AIEC, read from the repository (training badges are
 * not copied, they are read from the training record). Which badges go on the shareable page is the partner's own choice, kept on the phone.
 */
export function useBadges() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const catParam = params.get('cat') ?? 'all';
  const category: CategoryFilter = (CATEGORY_FILTERS as readonly string[]).includes(catParam) ? (catParam as CategoryFilter) : 'all';
  const badge = params.get('badge');
  const [data, setData] = useState<BadgeCollectionView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [shown, setShown] = useState<string[] | null>(() => (user ? readShowcase(user.id) : null));
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.getBadgeCollection(user.id); if (alive.current) { setData(v); setLoad('ready'); } } catch { if (alive.current) setLoad((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, user]);
  useEffect(() => { setLoad((s) => (s === 'ready' ? s : 'loading')); void read(); const id = window.setInterval(() => void read(), 60_000); return () => window.clearInterval(id); }, [read]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  // What goes on the shareable page: nothing is chosen until the partner chooses, and then everything earned is on it by default.
  const selected = (data?.earned ?? []).filter((e) => (shown === null ? true : shown.includes(e.id))).map((e) => e.id);
  return {
    load, data, category, badge, refreshing, selected,
    setCategory: (c: CategoryFilter) => patch((n) => { if (c === 'all') n.delete('cat'); else n.set('cat', c); }),
    openBadge: (id: string | null) => patch((n) => { if (id) n.set('badge', id); else n.delete('badge'); }),
    toggleShown: (id: string, on: boolean) => {
      if (!user || !data) return;
      const base = shown === null ? data.earned.map((e) => e.id) : shown;
      const next = on ? [...new Set([...base, id])] : base.filter((x) => x !== id);
      setShown(next);
      try { localStorage.setItem(showcaseKey(user.id), JSON.stringify(next)); } catch { /* the choice just is not remembered */ }
    },
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await read(); } finally { if (alive.current) setRefreshing(false); } },
  };
}
