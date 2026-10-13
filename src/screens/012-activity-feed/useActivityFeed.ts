import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { ActivityEvent } from '@/data/types';
import { MODULE_BY_KIND, PAGE_SIZE } from './activity-feed.types';
import type { FeedDay, FeedModule, FeedStatus } from './activity-feed.types';

interface ActivityFeedState {
  status: FeedStatus;
  days: FeedDay[];
  /** People who actually appear in the feed, for the person filter. */
  actors: string[];
  activeModules: FeedModule[];
  toggleModule: (module: FeedModule) => void;
  actorFilter: string | null;
  setActorFilter: (name: string | null) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  /** New events that arrived while scrolled down, not yet merged in. */
  pendingCount: number;
  showPending: () => void;
  loadMore: () => void;
  hasMore: boolean;
  reload: () => Promise<void>;
}

const LIVE_POLL_MS = 20_000;

/**
 * Owns the feed.
 *
 * Two behaviours here exist to keep a busy day usable. New events are held in a
 * pending buffer rather than injected under the reader's thumb — the count is
 * offered, and merging is their choice. And paging is forward-only from a
 * fixed window, so scrolling back never re-renders the whole day.
 */
export function useActivityFeed(): ActivityFeedState {
  const repository = useData();

  const [status, setStatus] = useState<FeedStatus>('loading');
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [pending, setPending] = useState<ActivityEvent[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeModules, setActiveModules] = useState<FeedModule[]>([]);
  const [actorFilter, setActorFilter] = useState<string | null>(null);

  const loadedOnceRef = useRef(false);

  /**
   * Newest first, with a stable tiebreak on id. Two webhooks landing in the
   * same millisecond would otherwise swap places on every refresh and make the
   * list visibly flicker.
   */
  const sortEvents = (list: ActivityEvent[]) =>
    [...list].sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));

  const reload = useCallback(async () => {
    if (!loadedOnceRef.current) setStatus('loading');
    try {
      const list = await repository.listActivity(200);
      const sorted = sortEvents(list);
      if (!loadedOnceRef.current) {
        setEvents(sorted);
        loadedOnceRef.current = true;
        setStatus(sorted.length === 0 ? 'empty' : 'live');
        return;
      }
      // Anything genuinely new goes to the buffer, not into the reader's view.
      setEvents((current) => {
        const known = new Set(current.map((e) => e.id));
        const fresh = sorted.filter((e) => !known.has(e.id));
        if (fresh.length > 0) {
          setPending((p) => {
            const pendingIds = new Set(p.map((e) => e.id));
            return sortEvents([...p, ...fresh.filter((e) => !pendingIds.has(e.id))]);
          });
        }
        return current;
      });
      setStatus('live');
    } catch {
      setStatus(loadedOnceRef.current ? 'live' : 'error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), LIVE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  const showPending = useCallback(() => {
    setEvents((current) => sortEvents([...pending, ...current]));
    setPending([]);
  }, [pending]);

  const toggleModule = useCallback((module: FeedModule) => {
    setActiveModules((current) =>
      current.includes(module) ? current.filter((m) => m !== module) : [...current, module],
    );
    setVisibleCount(PAGE_SIZE);
  }, []);

  const actors = useMemo(
    () => [...new Set(events.map((e) => e.actorName))].sort((a, b) => a.localeCompare(b)),
    [events],
  );

  const filtered = useMemo(
    () =>
      events
        .filter((e) => activeModules.length === 0 || activeModules.includes(MODULE_BY_KIND[e.kind]))
        .filter((e) => actorFilter === null || e.actorName === actorFilter),
    [events, activeModules, actorFilter],
  );

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  // Group by calendar day for the date headings.
  const days = useMemo<FeedDay[]>(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const event of visible) {
      const date = event.at.slice(0, 10);
      map.set(date, [...(map.get(date) ?? []), event]);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, list]) => ({ date, events: list }));
  }, [visible]);

  return {
    status: status === 'live' && filtered.length === 0 ? 'empty' : status,
    days,
    actors,
    activeModules,
    toggleModule,
    actorFilter,
    setActorFilter,
    clearFilters: () => {
      setActiveModules([]);
      setActorFilter(null);
      setVisibleCount(PAGE_SIZE);
    },
    hasFilters: activeModules.length > 0 || actorFilter !== null,
    pendingCount: pending.length,
    showPending,
    loadMore: () => setVisibleCount((c) => c + PAGE_SIZE),
    hasMore: visibleCount < filtered.length,
    reload,
  };
}
