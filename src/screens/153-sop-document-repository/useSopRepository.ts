import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { SopCategoryView, SopDocumentView, SopLibraryView, SopReferenceInput } from '@/data/repository';
import { copyStateOf } from '@/features/sop/library';
import type { CopyState } from '@/features/sop/library';
import { readJson, writeJson } from '@/features/training/offline';
import { FILTERS, POLL_MS, bookmarkQueueKey, docPath, libraryKey, listPath, offlineKey } from './sop-repository.types';
import type { Filter } from './sop-repository.types';
import { sopSearchText } from './sop-text';

export interface ActionResult<V = undefined> {
  ok: boolean;
  code?: string;
  value?: V;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type SopRepositoryState = ReturnType<typeof useSopRepository>;
type Saved = Record<string, { savedAt: string; doc: SopDocumentView }>;
type Queue = Record<string, boolean>;

/**
 * Screen 153. The repository is a reading view over the governed procedures, so this hook reads one library (every document with every version) and
 * filters it here, in the reader's language. Copies saved on the phone keep every version they knew of, so which version was in force is judged
 * from the clock and the copy itself, and a copy is called out of date only when the library knows of a version the copy never saw.
 */
export function useSopRepository() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { push } = useToast();
  const { docId } = useParams();
  const [params, setParams] = useSearchParams();
  const who = user?.id ?? '';
  const q = params.get('q') ?? '';
  const category = params.get('cat') ?? '';
  const filter = ((FILTERS as readonly string[]).includes(params.get('f') ?? '') ? params.get('f') : 'all') as Filter;
  const versionParam = Number(params.get('v')) || null;
  const [library, setLibrary] = useState<SopLibraryView | null>(null);
  const [fromCache, setFromCache] = useState(false);
  /** No library could be read, so the only documents known are the ones saved on the phone: there is nothing to compare them against. */
  const [onlySaved, setOnlySaved] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [saved, setSaved] = useState<Saved>({});
  const [queue, setQueue] = useState<Queue>({});
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!who) return;
    setSaved(readJson<Saved>(offlineKey(who)) ?? {});
    setQueue(readJson<Queue>(bookmarkQueueKey(who)) ?? {});
  }, [who]);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const setParam = useCallback((patch: Record<string, string | null>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) { if (!v || (k === 'f' && v === 'all')) next.delete(k); else next.set(k, v); }
      return next;
    }, { replace: true });
    setPage(1);
  }, [setParams]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      // The in-memory repository never loses its connection, so the phone's own signal decides whether this read can happen.
      if (!navigator.onLine) throw new Error('offline');
      const lib = await repository.getSopLibrary(user.id);
      if (!alive.current) return;
      setLibrary(lib);
      setFromCache(false);
      setOnlySaved(false);
      setStatus('ready');
      writeJson(libraryKey(user.id), lib);
    } catch {
      if (!alive.current) return;
      const kept = readJson<SopLibraryView>(libraryKey(user.id));
      const copies = readJson<Saved>(offlineKey(user.id)) ?? {};
      if (kept) { setLibrary(kept); setFromCache(true); setOnlySaved(false); setStatus('ready'); }
      else if (Object.keys(copies).length > 0) {
        // Nothing cached but something saved: the saved documents are still a library.
        const docs = Object.values(copies).map((c) => c.doc);
        setLibrary({ docs, categories: [], canEdit: false, at: new Date().toISOString() });
        setFromCache(true);
        setOnlySaved(true);
        setStatus('ready');
      } else setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user]);
  useEffect(() => { void load(); const id = window.setInterval(() => void load(), POLL_MS); return () => window.clearInterval(id); }, [load]);
  useEffect(() => { void load(); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bookmarks made without signal are sent when it returns.
  const flushQueue = useCallback(async () => {
    if (!user) return;
    const pending = readJson<Queue>(bookmarkQueueKey(user.id)) ?? {};
    const ids = Object.keys(pending);
    if (ids.length === 0 || !navigator.onLine) return;
    const left: Queue = { ...pending };
    for (const id of ids) {
      try { await repository.toggleSopBookmark(id, pending[id], user.id); delete left[id]; } catch (e) { if (codeOf(e) === 'not_found') delete left[id]; }
    }
    writeJson(bookmarkQueueKey(user.id), left);
    if (alive.current) { setQueue(left); void load(); }
  }, [repository, user, load]);
  useEffect(() => { if (online) void flushQueue(); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = Date.now();
  const bookmarked = useCallback((d: SopDocumentView) => (d.id in queue ? queue[d.id] : d.bookmarked), [queue]);
  const copyOf = useCallback((d: SopDocumentView): { state: CopyState; savedAt: string } | null => {
    const c = saved[d.id];
    if (!c) return null;
    return { state: copyStateOf(c.doc.versions, onlySaved ? null : d.currentVersion, now), savedAt: c.savedAt };
  }, [saved, onlySaved, now]);

  const docs = library?.docs ?? [];
  const lang = i18n.language;
  const words = q.trim().toLowerCase();
  const shown = useMemo(() => docs.filter((d) => {
    if (category && d.categoryId !== category) return false;
    if (filter === 'bookmarked' && !bookmarked(d)) return false;
    if (filter === 'saved' && !saved[d.id]) return false;
    if (words) {
      const cur = d.versions.find((v) => v.version === d.currentVersion) ?? d.versions[d.versions.length - 1];
      const hay = [sopSearchText(t, d.title), sopSearchText(t, d.summary), ...(cur?.sections ?? []).flatMap((s) => [sopSearchText(t, s.title), ...s.items.flatMap((i) => [sopSearchText(t, i.label), sopSearchText(t, i.detail)])])].join(' ').toLowerCase();
      if (!hay.includes(words)) return false;
    }
    return true;
  }).sort((a, b) => Number(bookmarked(b)) - Number(bookmarked(a))), [docs, category, filter, words, saved, bookmarked, t]); // eslint-disable-line react-hooks/exhaustive-deps
  // Without signal only what was saved on the phone opens: a saved copy is the document, not the last thing the list happened to cache.
  const exists = docId ? (library?.docs.some((d) => d.id === docId) ?? false) || !!saved[docId] : false;
  const open = docId ? (fromCache ? saved[docId]?.doc ?? null : docs.find((d) => d.id === docId) ?? null) : null;
  const openIsCopy = !!open && fromCache;
  const staleCopies = docs.filter((d) => saved[d.id] && copyOf(d)?.state === 'stale');
  const persistSaved = (next: Saved) => { setSaved(next); writeJson(offlineKey(who), next); };

  return {
    status, library, fromCache, onlySaved, online, busy, docs, shown, page, q, category, filter, versionParam, docId: docId ?? null, open, saved, staleCopies, lang, categories: library?.categories ?? [],
    canEdit: library?.canEdit ?? false, exists, openIsCopy, bookmarked, copyOf, hasFilters: !!(q || category || filter !== 'all'),
    setQuery: (v: string) => setParam({ q: v }),
    setCategory: (v: string) => setParam({ cat: v }),
    setFilter: (v: string) => setParam({ f: v }),
    setVersion: (v: number | null) => setParam({ v: v ? String(v) : null }),
    clear: () => { setParams(new URLSearchParams(), { replace: true }); setPage(1); },
    showMore: () => setPage((p) => p + 1),
    reload: () => { setStatus('loading'); void load(); },
    openDoc: (id: string) => navigate(docPath(id)),
    toList: () => navigate(listPath),
    goto: (path: string) => navigate(path),
    toggleBookmark: async (d: SopDocumentView) => {
      if (!user) return;
      const next = !bookmarked(d);
      const q2: Queue = { ...queue, [d.id]: next };
      setQueue(q2);
      writeJson(bookmarkQueueKey(user.id), q2);
      if (navigator.onLine) await flushQueue();
    },
    /** Keeps the document, with every version it has, on the phone. */
    saveCopy: async (d: SopDocumentView): Promise<ActionResult> => {
      if (!online) return { ok: false, code: 'offline' };
      const fresh = library?.docs.find((x) => x.id === d.id) ?? d;
      persistSaved({ ...saved, [d.id]: { savedAt: new Date().toISOString(), doc: fresh } });
      push(t('sopRepo.copy.savedToast'), 'success');
      return { ok: true };
    },
    removeCopy: (d: SopDocumentView) => {
      const next = { ...saved };
      delete next[d.id];
      persistSaved(next);
      push(t('sopRepo.copy.removedToast'), 'success');
    },
    updateCopies: async (list: SopDocumentView[]): Promise<ActionResult> => {
      if (!online) return { ok: false, code: 'offline' };
      await load();
      const lib = readJson<SopLibraryView>(libraryKey(who));
      const next = { ...saved };
      for (const d of list) { const fresh = lib?.docs.find((x) => x.id === d.id); if (fresh) next[d.id] = { savedAt: new Date().toISOString(), doc: fresh }; }
      persistSaved(next);
      push(t('sopRepo.offline.updated'), 'success');
      return { ok: true };
    },
    addCategory: async (input: { name: string; nameHi?: string; nameMr?: string }): Promise<ActionResult<SopCategoryView>> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try { const v = await repository.addSopCategory(input, user.id); await load(); return { ok: true, value: v }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
    },
    saveReference: async (input: SopReferenceInput): Promise<ActionResult<SopDocumentView>> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try { const v = await repository.saveSopReference(input, user.id); await load(); return { ok: true, value: v }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
    },
  };
}
