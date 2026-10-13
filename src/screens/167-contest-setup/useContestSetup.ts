import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ContestAdminBoard, ContestAdminDetail, ContestAdminRow, ContestEndProblem, ContestInput, ContestPreviewView, ContestSaveProblem } from '@/data/repository';
import { STATE_FILTERS } from './contest-setup.types';
import type { StateFilter } from './contest-setup.types';

export type ContestSetupState = ReturnType<typeof useContestSetup>;
export type ActionResult<T> = { ok: true; value: T } | { ok: false; problem: ContestSaveProblem | ContestEndProblem | 'generic' };

const PROBLEMS = ['name_short', 'name_long', 'description_long', 'metric_invalid', 'dates_invalid', 'start_past', 'too_short', 'too_long', 'no_rewards', 'too_many_places', 'ranks_invalid', 'cash_invalid', 'cash_too_high', 'label_short', 'label_long', 'tenure_invalid', 'locked', 'not_found', 'not_live', 'reason_short', 'policy_invalid', 'not_admin'];
const problemOf = (e: unknown): ContestSaveProblem | ContestEndProblem | 'generic' => { const m = e instanceof Error ? e.message : ''; return PROBLEMS.includes(m) ? (m as ContestSaveProblem) : 'generic'; };

/**
 * Screen 167. Admin's contest tool: the list with its phases, the editor (rules are locked once a contest starts), a preview that scores the contest as it would stand today, and
 * early end with a reason the people in it will read. Everything is judged by the repository with the same rules the form shows; the address holds the filter, the open
 * contest and the open editor.
 */
export function useContestSetup() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const stateParam = params.get('state') ?? 'all';
  const state: StateFilter = (STATE_FILTERS as readonly string[]).includes(stateParam) ? (stateParam as StateFilter) : 'all';
  const contest = params.get('contest');
  const edit = params.get('edit');
  const [data, setData] = useState<ContestAdminBoard | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<ContestAdminDetail | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.getContestAdminBoard(user.id); if (alive.current) { setData(v); setLoad('ready'); } } catch { if (alive.current) setLoad((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, user]);
  useEffect(() => { setLoad((s) => (s === 'ready' ? s : 'loading')); void read(); const id = window.setInterval(() => void read(), 30_000); return () => window.clearInterval(id); }, [read]);
  const loadDetail = useCallback(async () => {
    if (!contest || !user) { setDetail(null); return; }
    try { const v = await repository.getContestAdminDetail(contest, user.id); if (alive.current) setDetail(v); } catch { if (alive.current) setDetail(null); }
  }, [repository, user, contest]);
  useEffect(() => { void loadDetail(); }, [loadDetail]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const after = async () => { await Promise.all([read(), loadDetail()]); };
  const run = async <T,>(fn: (adminId: string) => Promise<T>): Promise<ActionResult<T>> => {
    if (!user) return { ok: false, problem: 'not_admin' };
    try { const value = await fn(user.id); await after(); return { ok: true, value }; } catch (e) { await after(); return { ok: false, problem: problemOf(e) }; }
  };

  return {
    load, data, detail, state, contest, edit, refreshing, userId: user?.id ?? '',
    setState: (s: StateFilter) => patch((n) => { if (s === 'all') n.delete('state'); else n.set('state', s); }),
    openContest: (id: string | null) => patch((n) => { if (id) n.set('contest', id); else n.delete('contest'); }),
    openEditor: (id: string | null) => patch((n) => { if (id) { n.set('edit', id); n.delete('contest'); } else n.delete('edit'); }),
    /** Leaves the editor and opens the contest it made, in one change of the address (two separate ones would overwrite each other). */
    finishEdit: (id: string) => patch((n) => { n.delete('edit'); n.set('contest', id); }),
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await after(); } finally { if (alive.current) setRefreshing(false); } },
    preview: async (input: ContestInput, excludeId?: string): Promise<ContestPreviewView | null> => { if (!user) return null; try { return await repository.previewContest(input, user.id, excludeId); } catch { return null; } },
    save: (input: ContestInput & { id?: string }): Promise<ActionResult<ContestAdminRow>> => run((a) => repository.saveContest(input, a)),
    cancelScheduled: (id: string) => run((a) => repository.cancelScheduledContest(id, a)),
    endEarly: (id: string, input: { reason: string; rewards: 'pay' | 'none' }) => run((a) => repository.endContestEarly(id, input, a)),
  };
}
