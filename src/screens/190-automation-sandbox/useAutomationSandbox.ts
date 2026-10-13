import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SandboxPromotionPreview, SandboxRunView, SandboxScenarioInput, SandboxView } from '@/data/repository';
import type { CustomRuleActivateOptions } from '@/data/repository';
import { POLL_MS, TABS } from './sandbox.types';
import type { SandboxTab } from './sandbox.types';

export type SandboxState = ReturnType<typeof useAutomationSandbox>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');

/** Screen 190. A test only reads: the result is shown, never applied. The words typed into a new scenario are kept on the phone until it is saved. */
export function useAutomationSandbox() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as SandboxTab | null;
  const tab: SandboxTab = tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam : 'test';
  const ruleParam = params.get('rule') ?? '';
  const [view, setView] = useState<SandboxView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SandboxRunView[]>([]);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getSandbox(uid); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const patch = (changes: Record<string, string | null>) => setParams((prev) => { const n = new URLSearchParams(prev); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true });

  return {
    load, offline, view, busy, tab, ruleParam, results,
    refresh: read,
    setTab: (t: SandboxTab) => patch({ tab: t === 'test' ? null : t }),
    clearResults: () => setResults([]),
    run: async (engine: string, ruleRef: string, scenarioIds: string[], expected: Record<string, string | number | boolean> | null) => {
      const r = await act(() => repository.runSandboxTest(uid, { engine, ruleRef, scenarioIds, expected }));
      if (r.ok) { setResults(r.value); void read(); }
      return r;
    },
    accept: async (runId: string, note?: string) => {
      const r = await act(() => repository.acceptSandboxBaseline(uid, runId, note));
      if (r.ok) { setView(r.value); setResults((list) => list.map((x) => (x.id === runId ? { ...x, accepted: true } : x))); }
      return r;
    },
    acceptMany: async (ids: string[]) => {
      const r = await act(async () => { let v: SandboxView | null = null; for (const id of ids) v = await repository.acceptSandboxBaseline(uid, id); return v; });
      if (r.ok && r.value) { setView(r.value); setResults((list) => list.map((x) => (ids.includes(x.id) ? { ...x, accepted: true } : x))); }
      return r;
    },
    saveScenario: async (input: SandboxScenarioInput) => { const r = await act(() => repository.saveSandboxScenario(uid, input)); if (r.ok) setView(r.value); return r; },
    deleteScenario: async (id: string) => { const r = await act(() => repository.deleteSandboxScenario(uid, id)); if (r.ok) setView(r.value); return r; },
    reviewScenarios: async (ids: string[], note: string) => { const r = await act(() => repository.reviewSandboxScenarios(uid, ids, note)); if (r.ok) setView(r.value); return r; },
    preview: (ruleId: string) => act<SandboxPromotionPreview>(() => repository.previewRulePromotion(uid, ruleId)),
    promote: async (ruleId: string, options: CustomRuleActivateOptions) => { const r = await act(() => repository.promoteRule(uid, ruleId, options)); if (r.ok) setView(r.value); return r; },
  };
}
