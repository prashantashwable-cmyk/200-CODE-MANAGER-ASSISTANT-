import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { IntegrationCredentialInput, IntegrationManagementView } from '@/data/repository';
import { INTEGRATIONS_CHANGED } from '@/features/integrations/SandboxBanner';
import { POLL_MS } from './integration-management.types';

export type IntegrationState = ReturnType<typeof useIntegrationManagement>;
type Result = { ok: true } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');

/** Screen 189. A secret is only ever held in the form while it is typed and is sent once: it is never put in the address, saved on the phone or sent back. */
export function useIntegrationManagement() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const openId = params.get('integration') ?? '';
  const [view, setView] = useState<IntegrationManagementView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const uid = user?.id ?? '';

  const read = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getIntegrationManagement(uid); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);
  const act = async (fn: () => Promise<unknown>): Promise<Result> => {
    setBusy(true);
    try { const v = await fn(); if (v && typeof v === 'object' && 'integrations' in (v as object) && alive.current) setView(v as IntegrationManagementView); window.dispatchEvent(new Event(INTEGRATIONS_CHANGED)); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  return {
    load, offline, view, busy, openId,
    refresh: read,
    open: (id: string | null) => setParams((prev) => { const n = new URLSearchParams(prev); if (id) n.set('integration', id); else n.delete('integration'); return n; }, { replace: true }),
    rotate: (id: string, input: IntegrationCredentialInput) => act(() => repository.saveIntegrationCredential(uid, id, input)),
    cancelRotation: (id: string, slot: 'sandbox' | 'live', reason: string) => act(() => repository.cancelIntegrationRotation(uid, id, slot, reason)),
    setMode: (id: string, to: 'sandbox' | 'live', reason: string, confirmed: boolean) => act(() => repository.setIntegrationMode(uid, id, { to, reason, confirmed })),
    setEnvironment: (env: 'demo' | 'production', reason: string, confirmed: boolean) => act(() => repository.setAppEnvironment(uid, env, { reason, confirmed })),
    test: (id: string) => act(() => repository.runIntegrationCheck(uid, id).then(() => repository.getIntegrationManagement(uid))),
    verifyIsolation: () => act(() => repository.verifyDemoIsolation(uid)),
  };
}
