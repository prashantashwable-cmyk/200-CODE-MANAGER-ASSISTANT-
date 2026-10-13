import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { ACCESS_CHANGED } from '@/features/access/AccessContext';
import type { MonitorAbsenceInput, MonitorConfigInput, MonitorPanelView } from '@/data/repository';
import type { CheckKind } from '@/features/monitor/signals';
import { POLL_MS } from './single-person-monitor.types';

export type MonitorState = ReturnType<typeof useSinglePersonMonitor>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');

/** Screen 193. The panel is read again every half minute and on returning to the tab; a check carries the fingerprint of the panel that was looked at, so "all fine" is never recorded against numbers that have moved. */
export function useSinglePersonMonitor() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [view, setView] = useState<MonitorPanelView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [denied, setDenied] = useState(false);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getMonitorPanel(uid); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); setDenied(false); }
    catch (e) { if (!alive.current) return; if (problemOf(e) === 'not_allowed') { setDenied(true); setLoad('ready'); } else { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener(ACCESS_CHANGED, read);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); window.removeEventListener(ACCESS_CHANGED, read); };
  }, [read]);

  const act = async (fn: () => Promise<MonitorPanelView>): Promise<Result<MonitorPanelView>> => {
    setBusy(true);
    try { const v = await fn(); if (alive.current) setView(v); return { ok: true, value: v }; }
    catch (e) { const problem = problemOf(e); if (problem === 'panel_changed') void read(); return { ok: false, problem }; }
    finally { if (alive.current) setBusy(false); }
  };
  return {
    load, offline, view, busy, denied,
    refresh: read,
    check: (kind: CheckKind, note: string) => (view ? act(() => repository.recordMonitorCheck(uid, { kind, note, hash: view.hash })) : Promise.resolve({ ok: false, problem: 'generic' } as Result<MonitorPanelView>)),
    saveConfig: (input: MonitorConfigInput) => act(() => repository.saveMonitorConfig(uid, input)),
    addConcern: (note: string, days: number) => act(() => repository.addMonitorConcern(uid, note, days)),
    resolveConcern: (id: string, note: string) => act(() => repository.resolveMonitorConcern(uid, id, note)),
    setAbsence: (input: MonitorAbsenceInput) => act(() => repository.setMonitorAbsence(uid, input)),
    endAbsence: (reason: string) => act(() => repository.endMonitorAbsence(uid, reason)),
  };
}
