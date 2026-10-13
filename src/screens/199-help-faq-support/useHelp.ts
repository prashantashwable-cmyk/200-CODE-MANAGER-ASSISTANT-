import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { HelpAdminFilter, HelpAdminView, HelpArticleInput, HelpArticleView, HelpFeedbackInput, HelpSearchView } from '@/data/repository';
import type { HelpFlag, SupportKind } from '@/features/help/help';
import { PAGE, POLL_MS, TABS } from './help-faq-support.types';
import type { HelpTab } from './help-faq-support.types';

export type HelpScreenState = ReturnType<typeof useHelp>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
export type ManageFilter = Pick<HelpAdminFilter, 'q' | 'status' | 'category' | 'role'>;

/** Screen 199. Help is searched for the signed-in role; the article, a rating and any change are judged in the repository, then read again. */
export function useHelp() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const isAdmin = user?.role === 'admin';
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab');
  const tab: HelpTab = TABS.includes(rawTab as HelpTab) && (isAdmin || rawTab === 'help') ? (rawTab as HelpTab) : 'help';
  const category = params.get('cat');
  const viewAs = isAdmin ? params.get('as') : null;
  const articleId = params.get('article') ?? '';
  const flag = (params.get('flag') as HelpFlag | 'attention' | 'all' | null) ?? 'all';
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const patch = useCallback((changes: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true }), [setParams]);

  // Reader: the query is typed freely and sent after a short pause.
  const [q, setQ] = useState('');
  const [sentQ, setSentQ] = useState('');
  useEffect(() => { const id = window.setTimeout(() => setSentQ(q), 280); return () => window.clearTimeout(id); }, [q]);
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => { setLimit(PAGE); }, [sentQ, category, viewAs]);
  const [search, setSearch] = useState<HelpSearchView | null>(null);
  const [searchLoad, setSearchLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadSearch = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.searchHelp(uid, { q: sentQ, category, role: viewAs, offset: 0, limit }); if (!alive.current) return; setSearch(v); setSearchLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setSearchLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid, sentQ, category, viewAs, limit]);
  useEffect(() => { void loadSearch(); }, [loadSearch]);
  // A search that found nothing is a content gap: remembered, without who searched, once the person has stopped typing.
  const logged = useRef('');
  useEffect(() => {
    if (!search || searchLoad !== 'ready' || search.total > 0 || sentQ.trim().length < 3 || logged.current === sentQ) return undefined;
    const id = window.setTimeout(() => { logged.current = sentQ; void repository.logHelpSearchMiss(uid, sentQ).catch(() => undefined); }, 1200);
    return () => window.clearTimeout(id);
  }, [search, searchLoad, sentQ, repository, uid]);

  const [article, setArticle] = useState<HelpArticleView | null>(null);
  const [articleLoad, setArticleLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadArticle = useCallback(async (id: string) => {
    if (!uid || !id || id === 'new') { setArticle(null); return; }
    try { const v = await repository.getHelpArticle(uid, id); if (!alive.current) return; setArticle(v); setArticleLoad('ready'); } catch { if (alive.current) setArticleLoad('error'); }
  }, [repository, uid]);
  useEffect(() => { setArticleLoad('loading'); setArticle(null); void loadArticle(articleId); }, [articleId, loadArticle]);

  // Admin: the library, with what people said, and the gaps.
  const [manage, setManage] = useState<ManageFilter>({ q: '', status: 'all', category: null, role: null });
  const [mlimit, setMlimit] = useState(PAGE);
  const [admin, setAdmin] = useState<HelpAdminView | null>(null);
  const [adminLoad, setAdminLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadAdmin = useCallback(async () => {
    if (!uid || !isAdmin || tab === 'help') return;
    try { const v = await repository.getHelpAdmin(uid, { ...manage, flag, offset: 0, limit: mlimit }); if (!alive.current) return; setAdmin(v); setAdminLoad('ready'); } catch { if (alive.current) setAdminLoad((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, uid, isAdmin, tab, manage, flag, mlimit]);
  useEffect(() => { void loadAdmin(); }, [loadAdmin]);
  useEffect(() => {
    const id = window.setInterval(() => { void loadSearch(); void loadAdmin(); }, POLL_MS);
    return () => window.clearInterval(id);
  }, [loadSearch, loadAdmin]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); void loadSearch(); void loadAdmin(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const keep = (v: HelpArticleView): HelpArticleView => { setArticle(v); return v; };

  return {
    isAdmin, role: user?.role ?? 'customer', busy, offline, tab, category, viewAs, articleId, flag,
    q, setQ, search, searchLoad, showMore: () => setLimit((l) => l + PAGE),
    article, articleLoad, admin, adminLoad, manage, setManage: (m: ManageFilter) => { setManage(m); setMlimit(PAGE); }, moreManage: () => setMlimit((l) => l + PAGE),
    refresh: async () => { await Promise.all([loadSearch(), loadAdmin(), loadArticle(articleId)]); },
    setTab: (t: HelpTab) => patch({ tab: t === 'help' ? null : t, flag: null }),
    setCategory: (c: string | null) => patch({ cat: c }),
    setViewAs: (r: string | null) => patch({ as: r }),
    setFlag: (f: string | null) => patch({ flag: f && f !== 'all' ? f : null }),
    openArticle: (id: string | null) => patch({ article: id }),
    rate: (id: string, input: HelpFeedbackInput) => act(() => repository.rateHelpArticle(uid, id, input).then(keep)),
    suggest: (text: string, searchedFor: string) => act(() => repository.suggestHelpTopic(uid, text, searchedFor)),
    escalate: (id: string | null, kind: SupportKind) => { void repository.trackHelpEscalation(uid, id, kind).catch(() => undefined); },
    saveArticle: (input: HelpArticleInput) => act(() => repository.saveHelpArticle(uid, input).then((v) => { if (input.id === null) patch({ article: v.row.id }); return keep(v); })),
    reviewArticle: (id: string, note: string) => act(() => repository.reviewHelpArticle(uid, id, note).then(keep)),
    setStatus: (id: string, status: 'published' | 'draft' | 'retired', note: string) => act(() => repository.setHelpArticleStatus(uid, id, status, note).then(keep)),
    handleSuggestion: (id: string, status: 'planned' | 'done' | 'declined', note: string, aid: string | null) => act(() => repository.handleHelpSuggestion(uid, id, status, note, aid)),
    handleMiss: (key: string, note: string) => act(() => repository.handleHelpMiss(uid, key, note)),
  };
}
