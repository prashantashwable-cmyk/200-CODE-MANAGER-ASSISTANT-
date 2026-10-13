import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { RefresherCadenceView, RefresherQueueView, RefresherRowView } from '@/data/repository';
import { POLL_MS, ROLES, TABS, TIERS } from './refreshers.types';
import type { Tab } from './refreshers.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type RefreshersState = ReturnType<typeof useRefreshers>;

/**
 * Screen 156. Admin reads one queue of every certification that is coming due, in its grace period, extended or past it, most urgent first and safety-critical
 * ones ahead of the rest; a partner reads their own. Filters, search and the open row live in the URL so a link goes to the same place.
 */
export function useRefreshers() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const tab: Tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'queue';
  const tier = (TIERS as readonly string[]).includes(params.get('tier') ?? '') ? params.get('tier') : '';
  const role = (ROLES as readonly string[]).includes(params.get('role') ?? '') ? params.get('role') : '';
  const safetyOnly = params.get('sc') === '1';
  const q = params.get('q') ?? '';
  const rowId = params.get('row');
  const [view, setView] = useState<RefresherQueueView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const set = useCallback((patch: Record<string, string | null>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) { if (!v || (k === 'tab' && v === 'queue')) next.delete(k); else next.set(k, v); }
      return next;
    }, { replace: true });
    setPage(1);
  }, [setParams]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.getRefresherQueue(user.id);
      if (alive.current) { setView(v); setStatus('ready'); }
    } catch { if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, user]);
  useEffect(() => { void load(); const id = window.setInterval(() => void load(), POLL_MS); return () => window.clearInterval(id); }, [load]);

  const rows = view?.rows ?? [];
  const words = q.trim().toLowerCase();
  const shown = useMemo(() => rows.filter((r) => {
    if (tier && r.tier !== tier) return false;
    if (role && r.role !== role) return false;
    if (safetyOnly && !r.safetyCritical) return false;
    if (words && !`${r.name} ${r.moduleCode}`.toLowerCase().includes(words)) return false;
    return true;
  }), [rows, tier, role, safetyOnly, words]);
  const open: RefresherRowView | null = rows.find((r) => r.id === rowId) ?? null;

  const run = async <V,>(fn: () => Promise<V>, doneKey: string): Promise<ActionResult> => {
    setBusy(true);
    try { await fn(); await load(); push(t(doneKey), 'success'); return { ok: true }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
  };

  return {
    status, view, isAdmin, busy, tab, tier, role, safetyOnly, q, rows, shown, page, open, cadences: view?.cadences ?? ([] as RefresherCadenceView[]), counts: view?.counts,
    setTab: (v: string) => set({ tab: v }),
    setTier: (v: string) => set({ tier: v }),
    setRole: (v: string) => set({ role: v }),
    setSafety: (on: boolean) => set({ sc: on ? '1' : null }),
    setQuery: (v: string) => set({ q: v }),
    clear: () => { setParams(new URLSearchParams(), { replace: true }); setPage(1); },
    hasFilters: !!(tier || role || safetyOnly || q),
    showMore: () => setPage((p) => p + 1),
    openRow: (id: string) => set({ row: id }),
    closeRow: () => set({ row: null }),
    reload: () => { setStatus('loading'); void load(); },
    goto: (path: string) => navigate(path),
    remind: (r: RefresherRowView) => run(() => repository.sendRefresherReminder(r.id, user?.id ?? ''), 'refreshers.detail.reminded'),
    extend: (r: RefresherRowView, input: { until: string; reason: string }) => run(() => repository.extendRefresher(r.id, input, user?.id ?? ''), 'refreshers.extend.done'),
    publishCadence: (c: RefresherCadenceView, input: { months: number | null; graceDays: number; effectiveFrom: string; reason: string }) => run(() => repository.publishRefresherCadence(c.assessmentId, input, user?.id ?? ''), 'refreshers.cadence.published'),
  };
}
