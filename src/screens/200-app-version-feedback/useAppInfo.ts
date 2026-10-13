import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AppInfoView, ProductFeedbackBoardView, ProductFeedbackHandleInput, ProductFeedbackInboxFilter, ProductFeedbackInboxView, ProductFeedbackInput, ProductFeedbackView, ReleaseInput, ReleaseView, SimilarProductFeedbackView } from '@/data/repository';
import { BUILD_VERSION } from '@/features/appinfo/credits';
import { CHECK_EVERY_MS, browserOf, compareVersions, compatibilityOf, deviceOf } from '@/features/appinfo/appinfo';
import { ADMIN_TABS, CHECKED_KEY, TABS, VERSION_KEY } from './app-version-feedback.types';
import type { AppInfoTab } from './app-version-feedback.types';

export type AppInfoState = ReturnType<typeof useAppInfo>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
const read = (k: string): string | null => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string): void => { try { window.localStorage.setItem(k, v); } catch { /* the page still works without it */ } };
const runningNow = (): string => { const saved = read(VERSION_KEY); return saved && compareVersions(saved, BUILD_VERSION) > 0 ? saved : BUILD_VERSION; };
export interface FeedbackDraft { kind: string; area: string; text: string }
export type InboxFilter = Pick<ProductFeedbackInboxFilter, 'status' | 'kind'>;

/** Screen 200. What version the person is on and what is newer, the honest answer on whether this device can take it, and the ideas they send. */
export function useAppInfo() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const isAdmin = user?.role === 'admin';
  const allowed = isAdmin ? ADMIN_TABS : TABS;
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab') as AppInfoTab | null;
  const tab: AppInfoTab = rawTab && allowed.includes(rawTab) ? rawTab : 'whatsnew';
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const patch = useCallback((changes: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true }), [setParams]);

  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const browser = useMemo(() => browserOf(ua), [ua]);
  const device = useMemo(() => deviceOf(ua, typeof window === 'undefined' ? 390 : window.innerWidth), [ua]);
  const [running, setRunning] = useState(runningNow);
  const [checkedAt, setCheckedAt] = useState<string | null>(() => read(CHECKED_KEY));
  const [info, setInfo] = useState<AppInfoView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadInfo = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getAppInfo(uid, running); if (!alive.current) return; setInfo(v); setOffline(false); setLoad('ready'); setCheckedAt(v.lastCheckedAt); write(CHECKED_KEY, v.lastCheckedAt); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid, running]);
  useEffect(() => {
    void loadInfo();
    const id = window.setInterval(() => { void loadInfo(); }, CHECK_EVERY_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void loadInfo(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [loadInfo]);

  const compat = useMemo(() => (info ? compatibilityOf(browser, info.requires) : null), [browser, info]);
  // What this device is on is reported so Admin can see who is behind; a version is never reported as latest when it is not.
  const reported = useRef('');
  useEffect(() => {
    if (!info || !compat || !uid) return;
    const key = `${uid}:${running}:${info.latest}`;
    if (reported.current === key) return;
    reported.current = key;
    void repository.reportAppVersion(uid, { version: running, browser: browser.name, major: browser.major, device, compatible: compat.state === 'ok' ? true : compat.state === 'too_old' ? false : null }).catch(() => undefined);
  }, [info, compat, uid, running, browser, device, repository]);

  const act = async <T,>(fn: () => Promise<T>, then?: () => void): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); then?.(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };

  // Ideas: the draft stays on the phone, and a close match is looked for once enough has been written.
  const draftKey = `aiec.appFeedbackDraft.${uid}`;
  const [draft, setDraftState] = useState<FeedbackDraft>(() => { try { const v = JSON.parse(read(`aiec.appFeedbackDraft.${uid}`) ?? 'null') as FeedbackDraft | null; return v && typeof v.text === 'string' ? v : { kind: 'idea', area: 'overall', text: '' }; } catch { return { kind: 'idea', area: 'overall', text: '' }; } });
  const setDraft = (d: FeedbackDraft) => { setDraftState(d); write(draftKey, JSON.stringify(d)); };
  const [board, setBoard] = useState<ProductFeedbackBoardView | null>(null);
  const [boardLoad, setBoardLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadBoard = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getProductFeedbackBoard(uid); if (!alive.current) return; setBoard(v); setBoardLoad('ready'); } catch { if (alive.current) setBoardLoad((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, uid]);
  useEffect(() => { if (tab === 'ideas') void loadBoard(); }, [tab, loadBoard]);
  const [similar, setSimilar] = useState<SimilarProductFeedbackView | null>(null);
  useEffect(() => {
    if (tab !== 'ideas' || draft.text.trim().length < 20) { setSimilar(null); return undefined; }
    let live = true;
    const id = window.setTimeout(() => { void repository.findSimilarProductFeedback(uid, draft.text).then((v) => { if (live) setSimilar(v); }).catch(() => undefined); }, 600);
    return () => { live = false; window.clearTimeout(id); };
  }, [tab, draft.text, uid, repository]);

  const [inboxFilter, setInboxFilter] = useState<InboxFilter>({ status: 'open', kind: 'all' });
  const [inbox, setInbox] = useState<ProductFeedbackInboxView | null>(null);
  const [inboxLoad, setInboxLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadInbox = useCallback(async () => {
    if (!uid || !isAdmin || tab !== 'inbox') return;
    try { const v = await repository.getProductFeedbackInbox(uid, { ...inboxFilter, offset: 0, limit: 40 }); if (!alive.current) return; setInbox(v); setInboxLoad('ready'); } catch { if (alive.current) setInboxLoad((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, uid, isAdmin, tab, inboxFilter]);
  useEffect(() => { void loadInbox(); }, [loadInbox]);

  return {
    isAdmin, role: user?.role ?? 'customer', busy, offline, tab, load, info, running, browser, device, compat, checkedAt,
    setTab: (t: AppInfoTab) => patch({ tab: t === 'whatsnew' ? null : t }),
    check: async () => { await loadInfo(); },
    refresh: async () => { await Promise.all([loadInfo(), loadBoard(), loadInbox()]); },
    update: async (): Promise<boolean> => {
      if (!info || compat?.state === 'too_old') return false;
      write(VERSION_KEY, info.latest);
      setRunning(info.latest);
      return true;
    },
    draft, setDraft, board, boardLoad, similar,
    submit: (input: ProductFeedbackInput) => act(() => repository.submitProductFeedback(uid, input), () => { void loadBoard(); setSimilar(null); }),
    clearDraft: () => setDraft({ ...draft, text: '' }),
    vote: async (id: string): Promise<Result<ProductFeedbackView>> => {
      const r = await act(() => repository.voteProductFeedback(uid, id), () => { void loadBoard(); });
      if (r.ok) setSimilar((p) => (p ? { ...p, published: p.published.map((f) => (f.id === id ? r.value : f)) } : p));
      return r;
    },
    inboxFilter, setInboxFilter, inbox, inboxLoad,
    handle: (id: string, input: ProductFeedbackHandleInput) => act(() => repository.handleProductFeedback(uid, id, input), () => { void loadInbox(); }),
    publish: (input: ReleaseInput) => act(() => repository.publishRelease(uid, input), () => { void loadInfo(); }) as Promise<Result<ReleaseView>>,
  };
}
