import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';

/** Once a minute: frequent enough that "due in an hour" means it, rare
 *  enough to cost nothing. */
export const HEARTBEAT_MS = 60_000;

interface HeartbeatState {
  /** Unread assistant notifications for the signed-in person. */
  unread: number;
  /** Bumps after every engine run, so an open drawer knows to refresh. */
  tick: number;
  refreshUnread: () => Promise<void>;
}

/**
 * The app's one clock. Mounted once, in the AppShell, for every signed-in
 * role: it runs the follow-up engine on arrival and every minute after, then
 * refreshes the bell's unread count.
 *
 * In this build the clock only ticks while somebody has the app open. The
 * engine is the same function a server scheduler would call; wiring that
 * scheduler is the backend step BUILD_README names.
 */
export function useFollowUpHeartbeat(userId: string | undefined): HeartbeatState {
  const repository = useData();
  const [unread, setUnread] = useState(0);
  const [tick, setTick] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    try {
      const notifications = await repository.listWorkNotifications(userId);
      setUnread(notifications.filter((n) => !n.notification.readAt).length);
    } catch {
      // A missed count is harmless — the next beat corrects it.
    }
  }, [repository, userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    const beat = async () => {
      try {
        await repository.runFollowUpEngine();
      } catch {
        // One failed beat must never stop the clock; the next one retries
        // everything, because every step is idempotent.
      }
      if (cancelled) return;
      await refreshUnread();
      if (!cancelled) setTick((n) => n + 1);
    };
    void beat();
    const timer = window.setInterval(() => void beat(), HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [repository, userId, refreshUnread]);

  return { unread, tick, refreshUnread };
}
