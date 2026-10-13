import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { RecruitmentDashboardView } from '@/data/repository';
import { PERIODS } from '@/features/recruitment/dashboard';
import type { Period } from '@/features/recruitment/dashboard';
import { DASHBOARD_KEYS as K, DEFAULT_PERIOD, POLL_MS } from './dashboard.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type Drill = { kind: 'reach' | 'now'; stage: string } | null;
export type DashboardState = ReturnType<typeof useDashboard>;

/**
 * Screen 147. The single page for recruitment: the funnel from interest to an active partner, where everyone is now, how long it takes, and
 * which areas most need new people against how many are on their way. Every number opens the people behind it. Nothing here is stored: it is
 * all read from the records the other recruitment screens keep, so it cannot drift from them.
 */
export function useDashboard() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const raw = Number(params.get('period'));
  const period: Period = (PERIODS as readonly number[]).includes(raw) && params.has('period') ? (raw as Period) : DEFAULT_PERIOD;
  const [view, setView] = useState<RecruitmentDashboardView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drill, setDrill] = useState<Drill>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.getRecruitmentDashboard(period, user.id);
      if (!alive.current) return;
      setView(v);
      setStatus('ready');
    } catch {
      if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user, period]);

  useEffect(() => {
    setStatus((s) => (view ? s : 'loading'));
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    view,
    period,
    setPeriod: (p: Period) => setParams((q) => { const n = new URLSearchParams(q); if (p === DEFAULT_PERIOD) n.delete('period'); else n.set('period', String(p)); return n; }, { replace: true }),
    refreshing,
    refresh: async () => {
      setRefreshing(true);
      await load();
      if (alive.current) setRefreshing(false);
    },
    reload: () => {
      setStatus('loading');
      void load();
    },
    busy,
    drill,
    setDrill,
    goto: (path: string) => navigate(path),
    waitlist: async (applicationId: string, reason: string): Promise<ActionResult> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        await repository.waitlistApplicant(applicationId, reason, user.id);
        push(t(K.waitlist.added), 'success');
        await load();
        return { ok: true };
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    release: async (applicationId: string): Promise<ActionResult> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        await repository.releaseWaitlisted(applicationId, user.id);
        push(t(K.waitlist.released), 'success');
        await load();
        return { ok: true };
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
  };
}
