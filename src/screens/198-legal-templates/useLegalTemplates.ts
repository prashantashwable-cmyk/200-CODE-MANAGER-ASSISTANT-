import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { LegalDocDetail, LegalOverview, LegalReviewInput, LegalRevisionInput, LegalRevisionPreview, LegalStateInput } from '@/data/repository';
import { POLL_MS, TABS } from './legal-templates.types';
import type { LegalTab } from './legal-templates.types';

export type LegalScreenState = ReturnType<typeof useLegalTemplates>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');

/** Screen 198. The overview and one document are read from the repository; every change is judged and recorded there, then both are read again. */
export function useLegalTemplates() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab');
  const tab: LegalTab = TABS.includes(rawTab as LegalTab) ? (rawTab as LegalTab) : 'library';
  const docKey = params.get('doc') ?? '';
  const editParam = params.get('edit');
  const reviewParam = params.get('review');
  const stateParam = params.get('state');
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const [overview, setOverview] = useState<LegalOverview | null>(null);
  const loadOverview = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getLegalOverview(uid); if (!alive.current) return; setOverview(v); setOffline(false); setLoad('ready'); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);
  const [detail, setDetail] = useState<LegalDocDetail | null>(null);
  const [detailLoad, setDetailLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadDetail = useCallback(async (key: string) => {
    if (!uid || !key) { setDetail(null); return; }
    try { const v = await repository.getLegalDocument(uid, key); if (!alive.current) return; setDetail(v); setDetailLoad('ready'); } catch { if (alive.current) setDetailLoad('error'); }
  }, [repository, uid]);
  useEffect(() => { setDetailLoad('loading'); void loadDetail(docKey); }, [docKey, loadDetail]);
  useEffect(() => {
    void loadOverview();
    const id = window.setInterval(() => { void loadOverview(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void loadOverview(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [loadOverview]);

  const patch = useCallback((changes: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true }), [setParams]);
  // A link to a review opens the document it is about.
  useEffect(() => {
    if (!reviewParam || !overview) return;
    const r = overview.reviews.find((x) => x.id === reviewParam);
    patch({ review: null, ...(r ? { doc: r.docKey } : {}) });
  }, [reviewParam, overview, patch]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); void loadOverview(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const keep = (v: LegalDocDetail): LegalDocDetail => { setDetail(v); return v; };

  return {
    load, offline, busy, overview, tab, docKey, detail, detailLoad, editParam, stateParam,
    refresh: async () => { await Promise.all([loadOverview(), loadDetail(docKey)]); },
    setTab: (t: LegalTab) => patch({ tab: t === 'library' ? null : t, state: null }),
    openDoc: (key: string | null, edit?: string | null) => patch({ doc: key, edit: edit ?? null }),
    clearEdit: () => patch({ edit: null }),
    previewRevision: (input: LegalRevisionInput) => repository.previewLegalRevision(uid, input).then((value) => ({ ok: true, value }) as Result<LegalRevisionPreview>).catch((e) => ({ ok: false, problem: problemOf(e) }) as Result<LegalRevisionPreview>),
    saveRevision: (input: LegalRevisionInput, token: string, confirmed: boolean) => act(() => repository.saveLegalRevision(uid, input, token, confirmed).then((v) => { void loadDetail(docKey); return v; })),
    cancelRevision: (id: string, reason: string) => act(() => repository.cancelLegalRevision(uid, id, reason).then((v) => { void loadDetail(docKey); return v; })),
    recordReview: (input: LegalReviewInput) => act(() => repository.recordLegalReview(uid, input).then((v) => { if (input.docKey === docKey) keep(v); return v; })),
    closeIssue: (id: string) => (note: string) => act(() => repository.closeLegalIssue(uid, id, note).then((v) => { void loadDetail(docKey); return v; })),
    saveState: (input: LegalStateInput) => act(() => repository.saveLegalState(uid, input).then((v) => { setOverview(v); return v; })),
  };
}
