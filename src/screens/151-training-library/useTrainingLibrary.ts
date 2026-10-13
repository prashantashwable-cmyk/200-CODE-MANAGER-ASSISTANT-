import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { TrainingLibraryView, TrainingModuleView, TrainingScope } from '@/data/repository';
import type { TrainingTopic } from '@/data/types';
import { DEFAULT_SCOPE, LIB_KEYS as K, SCOPES, STATUS_FILTERS, TOPICS, cacheKey, modulePath, offlineKey } from './training-library.types';
import type { StatusFilter } from './training-library.types';
import { writeLessonCache } from '@/features/training/offline';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type TrainingLibraryState = ReturnType<typeof useTrainingLibrary>;
type Saved = Record<string, { version: number; savedAt: string }>;

const readJson = <V,>(key: string): V | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as V) : null;
  } catch {
    return null;
  }
};
const writeJson = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // Not kept on this phone.
  }
};

/**
 * Screen 151. A partner's own library: what their role requires, how far along they are, what is locked behind what, and what has been saved
 * on the phone for the field. The list is read from the repository (which holds the one governed dataset), filtered here by topic, status and
 * words; the last good copy is kept on the phone so the library still opens without signal.
 */
export function useTrainingLibrary() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const scope = (SCOPES as string[]).includes(params.get('scope') ?? '') ? (params.get('scope') as TrainingScope) : DEFAULT_SCOPE;
  const topic = ((TOPICS as string[]).includes(params.get('topic') ?? '') ? params.get('topic') : 'all') as TrainingTopic | 'all';
  const statusFilter = ((STATUS_FILTERS as readonly string[]).includes(params.get('status') ?? '') ? params.get('status') : 'all') as StatusFilter;
  const moduleId = params.get('m');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<TrainingLibraryView | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [saved, setSaved] = useState<Saved>({});
  const alive = useRef(true);
  const who = user?.id ?? '';
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  useEffect(() => {
    if (who) setSaved(readJson<Saved>(offlineKey(who)) ?? {});
  }, [who]);

  const set = useCallback((patch: Record<string, string | null>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (!v || (k === 'scope' && v === DEFAULT_SCOPE) || (k === 'topic' && v === 'all') || (k === 'status' && v === 'all')) next.delete(k);
        else next.set(k, v);
      }
      return next;
    }, { replace: true });
  }, [setParams]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.getTrainingLibrary(scope, user.id);
      if (!alive.current) return;
      setView(v);
      setFromCache(false);
      setState('ready');
      // The full list for this person is kept on the phone, so the library opens in the field.
      if (scope === 'mine') writeJson(cacheKey(user.id), v);
    } catch {
      if (!alive.current) return;
      const kept = scope === 'mine' ? readJson<TrainingLibraryView>(cacheKey(user.id)) : null;
      if (kept) {
        setView(kept);
        setFromCache(true);
        setState('ready');
      } else setState((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user, scope]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);
  useEffect(() => {
    if (online) void load();
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  const open: TrainingModuleView | null = view?.modules.find((m) => m.id === moduleId) ?? null;
  const persist = (next: Saved) => {
    setSaved(next);
    writeJson(offlineKey(who), next);
  };

  return {
    state,
    view,
    fromCache,
    online,
    busy,
    scope,
    topic,
    statusFilter,
    query,
    setQuery,
    setScope: (v: string) => set({ scope: v }),
    setTopic: (v: string) => set({ topic: v }),
    setStatusFilter: (v: string) => set({ status: v }),
    clear: () => { setQuery(''); setParams(new URLSearchParams(), { replace: true }); },
    openModule: (id: string) => set({ m: id }),
    closeModule: () => set({ m: null }),
    open,
    saved,
    isSaved: (m: TrainingModuleView) => !!saved[m.id],
    savedStale: (m: TrainingModuleView) => !!saved[m.id] && saved[m.id].version < m.version,
    /** Saving keeps the module's lessons and the person's place in them on the phone (152 opens them from there), plus a marker of which version. */
    saveOffline: async (m: TrainingModuleView): Promise<ActionResult> => {
      if (!user) return { ok: false, code: 'generic' };
      if (!online) return { ok: false, code: 'offline' };
      try {
        if (m.hasContent) writeLessonCache(user.id, m.id, await repository.getModuleLessons(m.id, user.id));
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      }
      persist({ ...saved, [m.id]: { version: m.version, savedAt: new Date().toISOString() } });
      push(t(K.offlineCopy.savedToast), 'success');
      return { ok: true };
    },
    removeOffline: (m: TrainingModuleView) => {
      const next = { ...saved };
      delete next[m.id];
      persist(next);
      push(t(K.offlineCopy.removedToast), 'success');
    },
    reload: () => {
      setState('loading');
      void load();
    },
    goto: (path: string) => navigate(path),
    /** Begins (or continues) a module and opens it. A finished one is simply opened again. */
    begin: async (m: TrainingModuleView): Promise<ActionResult> => {
      if (!user) return { ok: false, code: 'generic' };
      if (!m.hasContent) return { ok: false, code: 'no_lessons' };
      if (m.status === 'not_started' || m.status === 'update_needed') {
        if (!online) return { ok: false, code: 'offline' };
        setBusy(true);
        try {
          await repository.recordTrainingProgress(m.id, { status: 'in_progress', lessonsDone: 0 }, user.id);
          void load();
        } catch (e) {
          return { ok: false, code: codeOf(e) };
        } finally {
          if (alive.current) setBusy(false);
        }
      }
      navigate(modulePath(m.id));
      return { ok: true };
    },
  };
}
