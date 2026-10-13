import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { FeedbackBoard, FeedbackDeskView, FeedbackDetail, FeedbackSubmitResult } from '@/data/repository';
import type { FeedbackDimension } from '@/data/types';
import { POLL_MS, draftKey, viewKey } from './feedback-rating.types';
import { newClientId } from '@/features/ids/clientId';

export type FeedbackState = ReturnType<typeof useFeedback>;
export interface Draft { overall: number | null; dimensions: Partial<Record<FeedbackDimension, number>>; comment: string }
const EMPTY: Draft = { overall: null, dimensions: {}, comment: '' };
const newId = (): string => newClientId('f-');
function readJson<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown): void { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* the phone may refuse; the screen still works */ } }
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');

/** Screen 177. The customer's desk (what we would like to ask, what they told us), the short form with its draft kept on the phone, and Admin's board and follow-up. */
export function useFeedback() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { feedbackId = '' } = useParams<{ feedbackId?: string }>();
  const [params, setParams] = useSearchParams();
  const role = user?.role === 'admin' ? 'admin' : 'customer';
  const requestId = params.get('request') ?? '';
  const filter = (params.get('f') ?? 'outreach') as 'outreach' | 'weak' | 'staff' | 'low' | 'all';
  const [desk, setDesk] = useState<FeedbackDeskView | null>(() => (user && role === 'customer' ? readJson<FeedbackDeskView | null>(viewKey(user.id), null) : null));
  const [board, setBoard] = useState<FeedbackBoard | null>(null);
  const [detail, setDetail] = useState<FeedbackDetail | null>(null);
  const [detailState, setDetailState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(desk ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const [draft, setDraftState] = useState<Draft>(EMPTY);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<FeedbackSubmitResult | null>(null);
  const clientId = useRef(newId());
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try {
      if (role === 'customer') { const v = await repository.getFeedbackDesk(user.id); if (!alive.current) return; setDesk(v); writeJson(viewKey(user.id), v); }
      else { const v = await repository.getFeedbackBoard({ state: filter }, user.id); if (!alive.current) return; setBoard(v); }
      setLoad('ready'); setOffline(false);
    } catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user, role, filter]);
  const readDetail = useCallback(async () => {
    if (!user || role !== 'admin' || !feedbackId) { setDetail(null); return; }
    try { const v = await repository.getFeedback(feedbackId, user.id); if (alive.current) { setDetail(v); setDetailState('ready'); } }
    catch (e) { if (alive.current) setDetailState(e instanceof Error && e.message === 'not_found' ? 'missing' : 'error'); }
  }, [repository, user, role, feedbackId]);
  useEffect(() => { setDetailState('loading'); void readDetail(); }, [readDetail]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => void read(), POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);
  // A draft of one request is kept on the phone, so a closed app loses nothing.
  useEffect(() => { setResult(null); clientId.current = newId(); setDraftState(user && requestId ? { ...EMPTY, ...readJson<Partial<Draft>>(draftKey(user.id, requestId), {}) } : EMPTY); }, [user, requestId]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const setDraft = (next: Partial<Draft>) => setDraftState((d) => { const v = { ...d, ...next }; if (user && requestId) writeJson(draftKey(user.id, requestId), v); return v; });
  return {
    role, load, offline, desk, board, detail, detailState, draft, sending, result, requestId, filter, feedbackId,
    refresh: read,
    setDraft,
    setRating: (d: FeedbackDimension, n: number) => setDraftState((cur) => { const dims = { ...cur.dimensions }; if (dims[d] === n) delete dims[d]; else dims[d] = n; const v = { ...cur, dimensions: dims }; if (user && requestId) writeJson(draftKey(user.id, requestId), v); return v; }),
    submit: async (): Promise<{ ok: true } | { ok: false; problem: string }> => {
      if (!user || !requestId) return { ok: false, problem: 'generic' };
      if (draft.overall === null) return { ok: false, problem: 'overall_required' };
      setSending(true);
      try {
        const r = await repository.submitFeedback(user.id, { clientId: clientId.current, requestId, overall: draft.overall, dimensions: draft.dimensions, comment: draft.comment });
        try { localStorage.removeItem(draftKey(user.id, requestId)); } catch { /* nothing to clear */ }
        if (alive.current) setResult(r);
        void read();
        return { ok: true };
      } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setSending(false); }
    },
    dismiss: async (id: string) => { if (!user) return; try { await repository.dismissFeedbackRequest(user.id, id); await read(); } catch { /* it stays on the list */ } },
    outreach: async (note: string): Promise<{ ok: true } | { ok: false; problem: string }> => { if (!user) return { ok: false, problem: 'generic' }; try { const v = await repository.recordFeedbackOutreach(feedbackId, user.id, note); setDetail(v); void read(); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; } },
    start: (id: string) => patch((n) => { n.set('request', id); }),
    leave: () => { setResult(null); patch((n) => { n.delete('request'); }); },
    setFilter: (f: string) => patch((n) => { if (f && f !== 'outreach') n.set('f', f); else n.delete('f'); }),
    open: (id: string) => navigate(`/feedback/${id}`),
    list: () => navigate('/feedback'),
    goTo: (path: string) => navigate(path),
  };
}
