import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { haversineKm } from '@/design-system';
import type { RoutePlan, RouteStop } from '@/data/types';
import type { DaySummary, RoutePlanStatus } from './route-plan.types';

interface RoutePlanState {
  status: RoutePlanStatus;
  stops: RouteStop[];
  summary: DaySummary;
  totalKm: number;
  totalMinutes: number;
  advanceStop: (stopId: string, next: RouteStop['status']) => void;
  moveStop: (stopId: string, direction: 'up' | 'down') => void;
  navigateUrl: (stop: RouteStop) => string;
  reload: () => Promise<void>;
}

/**
 * Owns the surveyor's own daily route.
 *
 * This screen suggests, it never forces: reordering and skipping are purely
 * local to this plan and never touch the live GPS ping records that are the
 * real ground truth everywhere else in the app. Skipping a stop reflows the
 * remaining plan rather than penalising anyone.
 */
export function useRoutePlan(): RoutePlanState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<RoutePlanStatus>('loading');
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    try {
      const found = await repository.getRoutePlan(user.id);
      setPlan(found);
      setStops(found?.stops ?? []);
      setStatus(!found || found.stops.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('error');
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const advanceStop = useCallback((stopId: string, next: RouteStop['status']) => {
    setStops((current) => current.map((s) => (s.id === stopId ? { ...s, status: next } : s)));
  }, []);

  const moveStop = useCallback((stopId: string, direction: 'up' | 'down') => {
    setStops((current) => {
      const index = current.findIndex((s) => s.id === stopId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      // Recompute each leg distance/time against the new neighbour, since a
      // manual reorder genuinely changes the travel between consecutive stops.
      return next.map((stop, i) => {
        if (i === 0) return { ...stop, legKm: 0, legMinutes: 0 };
        const distanceKm = haversineKm(next[i - 1].location, stop.location);
        return { ...stop, legKm: Math.round(distanceKm * 10) / 10, legMinutes: Math.round((distanceKm / 22) * 60) };
      });
    });
  }, []);

  const summary = useMemo<DaySummary>(
    () => ({
      plannedCount: stops.length,
      doneCount: stops.filter((s) => s.status === 'done').length,
      skippedCount: stops.filter((s) => s.status === 'skipped').length,
      remainingCount: stops.filter((s) => s.status === 'pending' || s.status === 'arrived').length,
    }),
    [stops],
  );

  const totalKm = useMemo(() => Math.round(stops.reduce((sum, s) => sum + s.legKm, 0) * 10) / 10, [stops]);
  const totalMinutes = useMemo(() => stops.reduce((sum, s) => sum + s.legMinutes, 0), [stops]);

  const navigateUrl = useCallback(
    (stop: RouteStop) => `https://www.google.com/maps/dir/?api=1&destination=${stop.location.lat},${stop.location.lng}`,
    [],
  );

  return { status, stops, summary, totalKm, totalMinutes, advanceStop, moveStop, navigateUrl, reload: load };
}
