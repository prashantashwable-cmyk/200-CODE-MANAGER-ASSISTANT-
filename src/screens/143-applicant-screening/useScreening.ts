import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { ScoringConfigView, ScoringSaveResult, ScreeningDetailView, ScreeningQueueView, ScreeningRowView } from '@/data/repository';
import type { DeclineReason, Weights } from '@/features/recruitment/screening';
import { POLL_MS, ROLE_FILTERS, SCREENING_KEYS as K, TABS, applicationPath, screeningPath } from './screening.types';
import type { RoleFilter, ScreeningTab } from './screening.types';

export type ScreeningStatus = 'loading' | 'ready' | 'error';
export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

export type ScreeningState = ReturnType<typeof useScreening>;

/**
 * Screen 143. Applications that have been submitted are scored from five things and ranked, so Admin looks first where it counts; a person
 * decides every one (move forward, ask for more, or decline with a kind message in the applicant's own language). The score is explainable down
 * to each factor, adjustable by Admin with a reason, and frozen with the decision. The shares behind it are tunable, with a warning before a
 * change that would reshuffle the queue, and a feedback view that reads how earlier approvals turned out.
 */
export function useScreening() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as ScreeningTab | null;
  const tab: ScreeningTab = tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam : 'queue';
  const appId = params.get('app');

  const [status, setStatus] = useState<ScreeningStatus>('loading');
  const [view, setView] = useState<ScreeningQueueView | null>(null);
  const [detail, setDetail] = useState<ScreeningDetailView | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'error' | 'gone'>('idle');
  const [config, setConfig] = useState<ScoringConfigView | null>(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadQueue = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.getScreeningQueue(user.id);
      if (!alive.current) return;
      setView(v);
      setStatus('ready');
    } catch {
      if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user]);

  const loadConfig = useCallback(async () => {
    if (!user) return;
    try {
      const c = await repository.getScoringConfig(user.id);
      if (alive.current) setConfig(c);
    } catch {
      // The tab shows its own error state when there is nothing to show.
    }
  }, [repository, user]);

  useEffect(() => {
    void loadQueue();
    const id = setInterval(() => void loadQueue(), POLL_MS);
    return () => clearInterval(id);
  }, [loadQueue]);

  useEffect(() => {
    if (tab === 'scoring') void loadConfig();
  }, [tab, loadConfig]);

  useEffect(() => {
    setDetail(null);
    if (!user || !appId) {
      setDetailStatus('idle');
      return;
    }
    let live = true;
    setDetailStatus('loading');
    repository
      .getScreeningDetail(appId, user.id)
      .then((d) => {
        if (!live) return;
        setDetail(d);
        setDetailStatus('idle');
      })
      .catch((e) => {
        if (live) setDetailStatus(codeOf(e) === 'not_found' ? 'gone' : 'error');
      });
    return () => {
      live = false;
    };
  }, [repository, user, appId]);

  const setSearch = useCallback(
    (next: { tab?: ScreeningTab; app?: string | null }) => {
      setParams(
        (p) => {
          const n = new URLSearchParams(p);
          if (next.tab) {
            if (next.tab === 'queue') n.delete('tab');
            else n.set('tab', next.tab);
          }
          if (next.app !== undefined) {
            if (next.app) n.set('app', next.app);
            else n.delete('app');
          }
          return n;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const rowsOf = useMemo(() => {
    const q = query.trim().toLowerCase();
    const keep = (r: ScreeningRowView) => (role === 'all' || r.role === role) && (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    return { queue: (view?.queue ?? []).filter(keep), waiting: (view?.waiting ?? []).filter(keep), decided: (view?.decided ?? []).filter(keep) };
  }, [view, query, role]);

  const run = useCallback(
    async <R,>(fn: (userId: string) => Promise<R>): Promise<{ ok: true; value: R } | { ok: false; code: string }> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        const value = await fn(user.id);
        return { ok: true, value };
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [user],
  );

  /** After a decision, go straight on to the next application in the queue: the point of a ranking is to keep moving down it. */
  const afterDecision = useCallback(
    async (d: ScreeningDetailView) => {
      await loadQueue();
      setSearch({ app: d.nextId });
    },
    [loadQueue, setSearch],
  );

  return {
    status,
    view,
    tab,
    setTab: (next: ScreeningTab) => {
      setSelecting(false);
      setSelected([]);
      setSearch({ tab: next });
    },
    appId,
    detail,
    detailStatus,
    openApplication: (id: string) => setSearch({ app: id }),
    closeDetail: () => setSearch({ app: null }),
    query,
    setQuery,
    role,
    setRole: (r: RoleFilter) => setRole((ROLE_FILTERS as readonly string[]).includes(r) ? r : 'all'),
    rows: rowsOf,
    selecting,
    selected,
    toggleSelecting: () => {
      setSelecting((v) => !v);
      setSelected([]);
    },
    toggle: (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])),
    selectAllShown: () => setSelected(rowsOf.queue.map((r) => r.id)),
    busy,
    config,
    reload: () => {
      setStatus('loading');
      void loadQueue();
    },
    goto: (path: string) => navigate(path),
    fullApplication: (id: string) => navigate(applicationPath(id)),
    approve: async (note: string): Promise<ActionResult> => {
      if (!detail) return { ok: false, code: 'generic' };
      const r = await run((uid) => repository.decideApplication(detail.application.id, { decision: 'approve', ...(note.trim() ? { note: note.trim() } : {}) }, uid));
      if (!r.ok) return r;
      push(t(K.approve.done, { name: detail.application.form.personal.fullName }), 'success');
      await afterDecision(r.value);
      return { ok: true };
    },
    askForMore: async (sections: string[], note: string): Promise<ActionResult> => {
      if (!detail) return { ok: false, code: 'generic' };
      const r = await run((uid) => repository.decideApplication(detail.application.id, { decision: 'request_info', sections, note }, uid));
      if (!r.ok) return r;
      push(t(K.ask.done, { name: detail.application.form.personal.fullName }), 'success');
      await afterDecision(r.value);
      return { ok: true };
    },
    decline: async (reason: DeclineReason, note: string): Promise<ActionResult> => {
      if (!detail) return { ok: false, code: 'generic' };
      const r = await run((uid) => repository.decideApplication(detail.application.id, { decision: 'reject', reason, ...(note.trim() ? { note: note.trim() } : {}) }, uid));
      if (!r.ok) return r;
      push(t(K.declineSheet.done, { name: detail.application.form.personal.fullName }), 'success');
      await afterDecision(r.value);
      return { ok: true };
    },
    declineSelected: async (reason: DeclineReason, note: string): Promise<ActionResult> => {
      const ids = selected;
      const r = await run((uid) => repository.bulkRejectApplications(ids, { reason, ...(note.trim() ? { note: note.trim() } : {}) }, uid));
      if (!r.ok) return r;
      push(t(K.bulk.done, { count: r.value.rejected }) + (r.value.skipped ? ` ${t(K.bulk.skipped, { count: r.value.skipped })}` : ''), 'success');
      setSelected([]);
      setSelecting(false);
      await loadQueue();
      return { ok: true };
    },
    adjust: async (points: number | null, reason: string): Promise<ActionResult> => {
      if (!detail) return { ok: false, code: 'generic' };
      const r = await run((uid) => repository.setApplicationAdjustment(detail.application.id, points === null ? null : { points, reason }, uid));
      if (!r.ok) return r;
      setDetail(r.value);
      push(t(points === null ? K.adjust.removed : K.adjust.saved), 'success');
      await loadQueue();
      return { ok: true };
    },
    saveWeights: async (weights: Weights, confirm: boolean): Promise<{ ok: true; result: ScoringSaveResult } | { ok: false; code: string }> => {
      const r = await run((uid) => repository.saveScoringConfig(weights, confirm, uid));
      if (!r.ok) return r;
      if (r.value.saved) {
        push(t(K.scoring.saved), 'success');
        await Promise.all([loadQueue(), loadConfig()]);
      }
      return { ok: true, result: r.value };
    },
    rate: async (id: string, rating: 'strong' | 'steady' | 'weak', note: string): Promise<ActionResult> => {
      const r = await run((uid) => repository.recordApplicantOutcome(id, { rating, ...(note.trim() ? { note: note.trim() } : {}) }, uid));
      if (!r.ok) return r;
      push(t(K.feedback.saved), 'success');
      if (detail && detail.application.id === id) setDetail(r.value);
      await loadConfig();
      return { ok: true };
    },
    backToQueue: () => navigate(screeningPath()),
  };
}
