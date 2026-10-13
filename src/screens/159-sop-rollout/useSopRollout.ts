import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { MySopUpdatesView, SopQuizResult, SopRolloutBoardView, SopRolloutDetailView, SopRolloutInput, SopRolloutView, SopUpdateDetailView } from '@/data/repository';
import { FILTERS, boardPath, rolloutPath } from './sop-rollout.types';
import type { Filter } from './sop-rollout.types';

export interface ActionResult<V = undefined> {
  ok: boolean;
  code?: string;
  value?: V;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type SopRolloutState = ReturnType<typeof useSopRollout>;

/**
 * Screen 159. Admin announces a version of a governed procedure to the partners it affects, with an effective date, an optional short quiz on only what changed,
 * and watches who has actually read and understood it; a partner reads what changed, answers the quiz and acknowledges. Both sides read the same record.
 */
export function useSopRollout() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { rolloutId } = useParams();
  const [params, setParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const filter: Filter = (FILTERS as readonly string[]).includes(params.get('f') ?? '') ? (params.get('f') as Filter) : 'active';
  const [board, setBoard] = useState<SopRolloutBoardView | null>(null);
  const [detail, setDetail] = useState<SopRolloutDetailView | null>(null);
  const [mine, setMine] = useState<MySopUpdatesView | null>(null);
  const [update, setUpdate] = useState<SopUpdateDetailView | null>(null);
  const [quiz, setQuiz] = useState<SopQuizResult | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const latestId = useRef<string | undefined>(rolloutId);
  latestId.current = rolloutId;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (isAdmin) {
        const b = await repository.getSopRolloutBoard(user.id);
        const d = rolloutId ? await repository.getSopRollout(rolloutId, user.id) : null;
        if (alive.current && latestId.current === rolloutId) { setBoard(b); setDetail(d); setStatus('ready'); }
      } else {
        const m = await repository.getMySopUpdates(user.id);
        const u = rolloutId ? await repository.markSopUpdateSeen(rolloutId, user.id) : null;
        if (alive.current && latestId.current === rolloutId) { setMine(m); setUpdate(u); setStatus('ready'); }
      }
    } catch { if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, user, isAdmin, rolloutId]);
  useEffect(() => { setQuiz(null); setStatus((s) => (s === 'ready' ? s : 'loading')); void load(); const id = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(id); }, [load]);

  const run = async <V,>(fn: () => Promise<V>): Promise<ActionResult<V>> => {
    setBusy(true);
    try { const value = await fn(); await load(); return { ok: true, value }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
  };

  return {
    status, isAdmin, rolloutId: rolloutId ?? null, filter, board, detail, mine, update, quiz, refreshing, busy, userId: user?.id ?? '',
    setFilter: (f: string) => setParams((prev) => { const n = new URLSearchParams(prev); if (f === 'active') n.delete('f'); else n.set('f', f); return n; }, { replace: true }),
    reload: () => { setStatus('loading'); void load(); },
    refresh: async () => { setRefreshing(true); await load(); if (alive.current) setRefreshing(false); },
    goto: (path: string) => navigate(path),
    open: (id: string) => navigate(rolloutPath(id)),
    toBoard: () => navigate(boardPath),
    publish: (input: SopRolloutInput): Promise<ActionResult<SopRolloutView>> => run(() => repository.publishSopRollout(input, user?.id ?? '')),
    correct: (id: string, input: SopRolloutInput): Promise<ActionResult<SopRolloutView>> => run(() => repository.correctSopRollout(id, input, user?.id ?? '')),
    remind: (id: string): Promise<ActionResult<{ reminded: number; skipped: number }>> => run(() => repository.remindSopRollout(id, user?.id ?? '')),
    setAway: (id: string, personId: string, input: { until: string; note: string } | null): Promise<ActionResult<SopRolloutDetailView>> => run(() => repository.setSopRolloutAway(id, personId, input, user?.id ?? '')),
    submitQuiz: async (answers: number[]): Promise<ActionResult<SopQuizResult>> => {
      if (!rolloutId) return { ok: false, code: 'generic' };
      const r = await run(() => repository.submitSopUpdateQuiz(rolloutId, answers, user?.id ?? ''));
      if (r.ok && r.value && alive.current) setQuiz(r.value);
      return r;
    },
    acknowledge: (): Promise<ActionResult<SopUpdateDetailView>> => run(() => repository.acknowledgeSopUpdate(rolloutId ?? '', user?.id ?? '')),
  };
}
