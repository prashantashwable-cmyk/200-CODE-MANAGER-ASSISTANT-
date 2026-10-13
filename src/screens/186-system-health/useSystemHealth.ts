import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SystemHealthView } from '@/data/repository';
import type { IntegrationConfig } from '@/data/types';
import { POLL_MS } from './system-health.types';

export type SystemHealthState = ReturnType<typeof useSystemHealth>;
type Result = { ok: true } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');

/** Screen 186. Reads the health view (which also runs the checks that are due), and records what Admin learns from a provider's status page. */
export function useSystemHealth() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const recordId = params.get('integration') ?? '';
  const [view, setView] = useState<SystemHealthView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.getSystemHealth(user.id); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);
  const act = async <T,>(fn: () => Promise<T>): Promise<Result> => {
    setBusy(true);
    try { const v = (await fn()) as unknown; if (v && typeof v === 'object' && 'integrations' in (v as object) && alive.current) setView(v as SystemHealthView); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const uid = user?.id ?? '';
  return {
    load, offline, view, busy, recordId,
    refresh: read,
    openRecord: (id: string | null) => setParams((prev) => { const n = new URLSearchParams(prev); if (id) n.set('integration', id); else n.delete('integration'); return n; }, { replace: true }),
    check: (id: string) => act(() => repository.runIntegrationCheck(uid, id)),
    record: (id: string, status: IntegrationConfig['reported']['status'], note: string) => act(() => repository.recordProviderStatus(uid, id, status, note)),
    saveUrl: (id: string, url: string | null) => act(() => repository.setIntegrationStatusPage(uid, id, url)),
    setDemo: (id: string, state: IntegrationConfig['demo']) => act(() => repository.setIntegrationDemo(uid, id, state)),
    closeFollowUp: (incidentId: string, note: string) => act(() => repository.closeIntegrationFollowUp(uid, incidentId, note)),
  };
}
