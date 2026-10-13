import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SurveyorHomeData, SurveyorHomeStatus } from './surveyor-home.types';

const LAST_SYNC_KEY = 'aiec.lastSyncedAt';

interface SurveyorHomeState {
  status: SurveyorHomeStatus;
  data: SurveyorHomeData | null;
  isOnline: boolean;
  reload: () => Promise<void>;
}

/**
 * Owns the surveyor's true home screen.
 *
 * The weekly commission figure reads from the exact same `listCommissions`
 * call the dedicated Commission Tracker (038) uses, so the two numbers can
 * never drift apart. When offline, the screen keeps showing the last
 * successfully synced snapshot with a visible "last synced" time rather than
 * blanking or showing stale numbers as if they were fresh.
 */
export function useSurveyorHome(): SurveyorHomeState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<SurveyorHomeStatus>('loading');
  const [data, setData] = useState<SurveyorHomeData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    if (!navigator.onLine) {
      // Offline: keep whatever was last synced rather than blocking on a
      // network call that cannot succeed.
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      setData((current) => (current ? { ...current, lastSyncedAt: lastSync ?? current.lastSyncedAt } : current));
      setStatus((current) => (current === 'loading' ? 'loading' : current));
      return;
    }

    setStatus((current) => (current === 'ready' ? current : 'loading'));
    try {
      const [leads, plan, commissions, scores] = await Promise.all([
        repository.listLeads({ surveyorId: user.id }),
        repository.getRoutePlan(user.id),
        repository.listCommissions(user.id),
        repository.getSurveyorScores(),
      ]);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const leadsToday = leads.filter(
        (l) => new Date(l.createdAt).getTime() >= startOfToday.getTime(),
      ).length;

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weeklyCommission = commissions
        .filter(
          (c) =>
            c.status !== 'forfeited' &&
            new Date(c.earnedAt).getTime() >= startOfWeek.getTime(),
        )
        .reduce((sum, c) => sum + c.amount, 0);

      const now = Date.now();
      // Stops still pending or arrived (not yet done/skipped) that are due
      // now or already overdue count as follow-ups needing action today.
      const followUps = (plan?.stops ?? [])
        .filter((stop) => stop.status === 'pending' || stop.status === 'arrived')
        .map((stop) => ({
          stop,
          overdue: new Date(stop.windowEnd).getTime() < now,
        }));

      const ranked = [...scores].sort((a, b) => b.revenue - a.revenue);
      const rankIndex = ranked.findIndex((s) => s.userId === user.id);

      const syncedAt = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, syncedAt);

      setData({
        leadsToday,
        followUps,
        weeklyCommission,
        currentRank: rankIndex === -1 ? null : rankIndex + 1,
        totalActiveSurveyors: ranked.length,
        lastSyncedAt: syncedAt,
        isFirstDay: leads.length === 0,
      });
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { status, data, isOnline, reload: load };
}
