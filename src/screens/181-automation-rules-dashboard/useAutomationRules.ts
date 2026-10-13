import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AutomationOverviewView } from '@/data/repository';
import type { AutomationPause, AutomationRule } from '@/data/types';
import { POLL_MS, viewKey } from './automation-rules.types';

export type AutomationRulesState = ReturnType<typeof useAutomationRules>;
function readJson<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown): void { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* the phone may refuse; the screen still works */ } }
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
type Result = { ok: true } | { ok: false; problem: string };

/** Screen 181. Every category of automation, its health (the Health Monitor's own telemetry), the activity folded to stay readable, and an emergency pause with a stated effect. */
export function useAutomationRules() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const openId = params.get('category') ?? '';
  const filter = params.get('f') ?? '';
  const [view, setView] = useState<AutomationOverviewView | null>(() => (user ? readJson<AutomationOverviewView | null>(viewKey(user.id), null) : null));
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(view ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [pauses, setPauses] = useState<AutomationPause[]>([]);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try {
      const [v, r, p] = await Promise.all([repository.getAutomationOverview(user.id), repository.listAutomations(), repository.listAutomationPauses()]);
      if (!alive.current) return;
      setView(v); setRules(r); setPauses(p); writeJson(viewKey(user.id), v);
      setLoad('ready'); setOffline(false);
    } catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const act = async (fn: () => Promise<unknown>): Promise<Result> => {
    setBusy(true);
    try { await fn(); await read(); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  return {
    load, offline, view, rules, pauses, busy, openId, filter,
    refresh: read,
    open: (id: string | null) => patch((n) => { if (id) n.set('category', id); else n.delete('category'); }),
    setFilter: (id: string | null) => patch((n) => { if (id) n.set('f', id); else n.delete('f'); }),
    pause: (category: string, reason: string) => act(() => repository.pauseAutomationCategory(user?.id ?? '', category, reason)),
    resume: (category: string) => act(() => repository.resumeAutomationCategory(user?.id ?? '', category)),
  };
}
