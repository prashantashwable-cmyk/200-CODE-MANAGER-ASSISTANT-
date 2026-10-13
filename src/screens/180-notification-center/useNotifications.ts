import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { NotificationCenterView, NotificationItemView, NotificationPrefsView, NotificationStateView } from '@/data/repository';
import { CATEGORIES } from '@/features/notifications/center';
import type { NotificationCategory, OptionalChoices } from '@/features/notifications/center';
import { PAGE } from '@/features/notifications/center';
import { POLL_MS, viewKey } from './notification-center.types';

export type NotificationsState = ReturnType<typeof useNotifications>;
function readJson<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown): void { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* the phone may refuse; the screen still works */ } }
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
export interface PrefsDraft { sms: boolean; whatsapp: boolean; optional: OptionalChoices }
type Result = { ok: true } | { ok: false; problem: string };

/** Screen 180. The customer's notification centre: what we have sent them (read state, filters, the current state of what a notice was about) and the preferences that feed the opt-out record. */
export function useNotifications() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'prefs' ? 'prefs' : 'feed';
  const catParam = params.get('cat') as NotificationCategory | null;
  const category = catParam && (CATEGORIES as readonly string[]).includes(catParam) ? catParam : null;
  const unreadOnly = params.get('f') === 'unread';
  const openId = params.get('n') ?? '';
  const [limit, setLimit] = useState(PAGE);
  const [view, setView] = useState<NotificationCenterView | null>(() => (user ? readJson<NotificationCenterView | null>(viewKey(user.id), null) : null));
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(view ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefsView | null>(null);
  const [draft, setDraft] = useState<PrefsDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<NotificationStateView | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.getNotificationCenter(user.id, { category, unreadOnly, limit });
      if (!alive.current) return;
      setView(v);
      if (!category && !unreadOnly) writeJson(viewKey(user.id), v);
      setLoad('ready'); setOffline(false);
    } catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user, category, unreadOnly, limit]);
  const readPrefs = useCallback(async () => {
    if (!user) return;
    try { const p = await repository.getNotificationPrefs(user.id); if (!alive.current) return; setPrefs(p); setDraft((d) => d ?? { sms: p.channels.sms.on, whatsapp: p.channels.whatsapp.on, optional: p.optional }); } catch { /* the feed still works */ }
  }, [repository, user]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);
  useEffect(() => { void readPrefs(); }, [readPrefs]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const item: NotificationItemView | null = view?.items.find((i) => i.id === openId) ?? null;
  useEffect(() => {
    if (!user || !openId) { setState(null); return; }
    let live = true;
    repository.getNotificationState(user.id, openId).then((s) => { if (live) setState(s); }).catch(() => { if (live) setState(null); });
    return () => { live = false; };
  }, [repository, user, openId]);

  return {
    load, offline, view, tab, category, unreadOnly, openId, item, state, prefs, draft, saving,
    refresh: async () => { await Promise.all([read(), readPrefs()]); },
    setTab: (t: 'feed' | 'prefs') => patch((n) => { if (t === 'prefs') n.set('tab', 'prefs'); else n.delete('tab'); }),
    setCategory: (c: NotificationCategory | null) => { setLimit(PAGE); patch((n) => { if (c) n.set('cat', c); else n.delete('cat'); }); },
    setUnreadOnly: (on: boolean) => { setLimit(PAGE); patch((n) => { if (on) n.set('f', 'unread'); else n.delete('f'); }); },
    showMore: () => setLimit((l) => l + PAGE),
    open: async (i: NotificationItemView) => {
      patch((n) => { n.set('n', i.id); });
      if (user && !i.read) { try { await repository.markNotificationsSeen(user.id, [i.id]); await read(); } catch { /* it stays unread and will be offered again */ } }
    },
    close: () => patch((n) => { n.delete('n'); }),
    markAll: async () => { if (!user) return; try { await repository.markNotificationsSeen(user.id, 'all'); await read(); } catch { /* nothing changed */ } },
    markGroup: async (ids: string[]) => { if (!user) return; try { await repository.markNotificationsSeen(user.id, ids); await read(); } catch { /* nothing changed */ } },
    edit: (next: Partial<PrefsDraft>) => setDraft((d) => (d ? { ...d, ...next } : d)),
    save: async (): Promise<Result> => {
      if (!user || !draft) return { ok: false, problem: 'generic' };
      setSaving(true);
      try {
        const p = await repository.saveNotificationPrefs(user.id, draft);
        if (alive.current) { setPrefs(p); setDraft({ sms: p.channels.sms.on, whatsapp: p.channels.whatsapp.on, optional: p.optional }); }
        void read();
        return { ok: true };
      } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setSaving(false); }
    },
    discard: () => { if (prefs) setDraft({ sms: prefs.channels.sms.on, whatsapp: prefs.channels.whatsapp.on, optional: prefs.optional }); },
  };
}
