import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { FieldSosView, TechnicianHome } from '@/data/repository';
import type { TechnicianHomeStatus } from './technician-home.types';
import { LAST_SYNC_KEY, POLL_MS } from './technician-home.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what happened. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type TechnicianHomeState = ReturnType<typeof useTechnicianHome>;

/**
 * Owns the technician's home. The day is read from the same job records delivery scheduling creates and moves, never from a
 * calendar of its own. Offline it keeps the last day it synced, with a visible "last synced", rather than blanking. The SOS
 * is sent by the repository when its window closes, so this hook only starts it, cancels it, and reads what became of it.
 */
export function useTechnicianHome() {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<TechnicianHomeStatus>('loading');
  const [home, setHome] = useState<TechnicianHome | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => localStorage.getItem(LAST_SYNC_KEY) ?? new Date().toISOString());
  const [busy, setBusy] = useState(false);
  const [qcOpen, setQcOpen] = useState(0);
  const [reworkOpen, setReworkOpen] = useState(0);
  const [serviceOpen, setServiceOpen] = useState(0);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const load = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    try {
      setHome(await repository.getTechnicianHome(user.id));
      // Quality checks the person has been named to make (131): a card on the home only when there are some.
      setQcOpen(await repository.getQcBoard(user.id).then((b) => b.rows.filter((r) => r.assignment && r.assignment.status !== 'completed').length).catch(() => 0));
      // Rework the person has been given to put right (136).
      setReworkOpen(await repository.getSnagBoard(user.id).then((b) => b.rows.filter((r) => r.ownerId === user.id && (r.status === 'assigned' || r.status === 'in_progress')).length).catch(() => 0));
      // Service visits a customer's request has put in the person's day (175).
      setServiceOpen(await repository.listMyServiceVisits(user.id).then((r) => r.filter((x) => x.visit && (x.visit.status === 'planned' || x.visit.status === 'in_progress') && (x.status === 'assigned' || x.status === 'in_progress')).length).catch(() => 0));
      const at = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, at);
      setLastSyncedAt(at);
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a day that is already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  // Back online: catch up at once.
  useEffect(() => {
    if (isOnline) void load();
  }, [isOnline, load]);

  const reload = () => {
    setStatus('loading');
    void load();
  };

  const run = async (fn: () => Promise<unknown>): Promise<ActionResult> => {
    setBusy(true);
    try {
      await fn();
      await load();
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  const beginSos = () =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      // No waiting for a fresh fix: the last known position (kept current while on duty) goes with it, and the repository falls back to the job's site.
      await repository.beginFieldSos(user.id);
    });
  const cancelSos = (sos: FieldSosView) =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      await repository.cancelFieldSos(sos.id, user.id);
    });

  return { status, home, isOnline, lastSyncedAt, busy, qcOpen, reworkOpen, serviceOpen, reload, refresh: load, beginSos, cancelSos };
}
