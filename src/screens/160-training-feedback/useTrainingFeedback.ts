import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { FeedbackInputView, FeedbackItemView, FeedbackStatusName, FeedbackTarget, TrainingFeedbackFormView, TrainingFeedbackListView, TrainingFeedbackMine, TrainingFeedbackModuleView, TrainingFeedbackOverview } from '@/data/repository';
import { FILTERS, feedbackPath } from './training-feedback.types';
import type { Filter } from './training-feedback.types';

export interface ActionResult<V = undefined> {
  ok: boolean;
  code?: string;
  value?: V;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type TrainingFeedbackState = ReturnType<typeof useTrainingFeedback>;

/**
 * Screen 160. A partner rates a training they took (clear? relevant?), says more in their own words, can stay anonymous, and can say that something looks wrong
 * or unsafe, which reaches Admin as an alert rather than waiting in a pile. Admin reads the replies per training, with how many answered out of how many finished,
 * says what was done about each, and can hide an abusive comment without losing its ratings.
 */
export function useTrainingFeedback() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const [params, setParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const filter: Filter = (FILTERS as readonly string[]).includes(params.get('f') ?? '') ? (params.get('f') as Filter) : 'open';
  const item = params.get('item');
  const lessonParam = params.get('lesson');
  const questionParam = params.get('question');
  const target: FeedbackTarget | null = lessonParam || questionParam ? { ...(lessonParam ? { lessonId: lessonParam } : {}), ...(questionParam ? { questionId: questionParam } : {}) } : null;
  const [overview, setOverview] = useState<TrainingFeedbackOverview | null>(null);
  const [moduleView, setModuleView] = useState<TrainingFeedbackModuleView | null>(null);
  const [list, setList] = useState<TrainingFeedbackListView | null>(null);
  const [form, setForm] = useState<TrainingFeedbackFormView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const latestId = useRef<string | undefined>(moduleId);
  latestId.current = moduleId;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (isAdmin) {
        const o = await repository.getTrainingFeedbackOverview(user.id);
        const m = moduleId ? await repository.getTrainingFeedbackModule(moduleId, user.id) : null;
        if (alive.current && latestId.current === moduleId) { setOverview(o); setModuleView(m); setStatus('ready'); }
      } else {
        const l = await repository.getTrainingFeedbackList(user.id);
        const f = moduleId ? await repository.getTrainingFeedbackForm(moduleId, user.id, target) : null;
        if (alive.current && latestId.current === moduleId) { setList(l); setForm(f); setStatus('ready'); }
      }
    } catch { if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error')); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, user, isAdmin, moduleId, lessonParam, questionParam]);
  useEffect(() => { setStatus((s) => (s === 'ready' ? s : 'loading')); void load(); const id = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(id); }, [load]);

  const run = async <V,>(fn: () => Promise<V>): Promise<ActionResult<V>> => {
    setBusy(true);
    try { const value = await fn(); await load(); return { ok: true, value }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
  };

  return {
    status, isAdmin, moduleId: moduleId ?? null, filter, item, target, overview, moduleView, list, form, refreshing, busy, userId: user?.id ?? '',
    setFilter: (f: string) => setParams((prev) => { const n = new URLSearchParams(prev); if (f === 'open') n.delete('f'); else n.set('f', f); return n; }, { replace: true }),
    openItem: (id: string | null) => setParams((prev) => { const n = new URLSearchParams(prev); if (id) n.set('item', id); else n.delete('item'); return n; }, { replace: true }),
    reload: () => { setStatus('loading'); void load(); },
    refresh: async () => { setRefreshing(true); await load(); if (alive.current) setRefreshing(false); },
    goto: (path: string) => navigate(path),
    toList: () => navigate(feedbackPath()),
    openModule: (id: string) => navigate(feedbackPath(id)),
    save: (input: FeedbackInputView): Promise<ActionResult<TrainingFeedbackMine>> => run(() => repository.saveTrainingFeedback(moduleId ?? '', input, user?.id ?? '')),
    handle: (id: string, input: { status: FeedbackStatusName; note: string; addressedInVersion?: number }): Promise<ActionResult<FeedbackItemView>> => run(() => repository.handleTrainingFeedback(id, input, user?.id ?? '')),
    moderate: (id: string, input: { hide: boolean; reason: string }): Promise<ActionResult<FeedbackItemView>> => run(() => repository.moderateTrainingFeedback(id, input, user?.id ?? '')),
  };
}
