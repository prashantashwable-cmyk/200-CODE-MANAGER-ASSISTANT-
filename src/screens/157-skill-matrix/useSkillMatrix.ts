import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AssignTrainingResult, SkillMatrixView } from '@/data/repository';
import { VIEWS } from './skill-matrix.types';
import type { View } from './skill-matrix.types';

export interface ActionResult<V = undefined> {
  ok: boolean;
  code?: string;
  value?: V;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type SkillMatrixState = ReturnType<typeof useSkillMatrix>;

/**
 * Screen 157. One read of the whole technician workforce against every skill tag and certification, the demand the pipeline puts on each drive type, and how
 * certification coverage has moved; the person looking is Admin, deciding where to train and where to recruit. Training assigned from here becomes work its
 * owner is reminded of (a commitment), not a note.
 */
export function useSkillMatrix() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view: View = (VIEWS as readonly string[]).includes(params.get('view') ?? '') ? (params.get('view') as View) : 'matrix';
  const [data, setData] = useState<SkillMatrixView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.getSkillMatrix(user.id);
      if (alive.current) { setData(v); setStatus('ready'); }
    } catch { if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, user]);
  useEffect(() => { void load(); const id = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(id); }, [load]);

  return {
    status, data, view, refreshing, busy,
    setView: (v: string) => setParams((prev) => { const next = new URLSearchParams(prev); if (v === 'matrix') next.delete('view'); else next.set('view', v); return next; }, { replace: true }),
    reload: () => { setStatus('loading'); void load(); },
    refresh: async () => { setRefreshing(true); await load(); if (alive.current) setRefreshing(false); },
    goto: (path: string) => navigate(path),
    assign: async (input: { userIds: string[]; moduleId: string; dueDate: string; note: string }): Promise<ActionResult<AssignTrainingResult>> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try { const r = await repository.assignTraining(input, user.id); await load(); return { ok: true, value: r }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
    },
  };
}
