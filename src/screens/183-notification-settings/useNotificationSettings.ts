import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { InternalNotificationsView, InternalTypeInput, InternalTypeView } from '@/data/repository';
import type { InternalChannel, InternalChannelSet, InternalContent, InternalDelivery, InternalUrgency, Language } from '@/data/types';
import { POLL_MS } from './notification-settings.types';

export type SettingsState = ReturnType<typeof useNotificationSettings>;
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
type Result = { ok: true } | { ok: false; problem: string };
export interface TypeDraft { urgency: InternalUrgency | null; roles: Record<string, InternalChannelSet> | null; enabled: boolean; content: Partial<Record<Language, InternalContent>> }
const draftOf = (t: InternalTypeView): TypeDraft => ({ urgency: t.urgencySource === 'configured' ? t.urgency : null, roles: t.configured ? JSON.parse(JSON.stringify(t.roles)) : null, enabled: t.enabled, content: JSON.parse(JSON.stringify(t.content)) });

/** Screen 183. The settings of every kind of staff-facing notification: urgency decides the channels, each role has its own, wording can be overridden, and a test goes out before a real alert relies on it. */
export function useNotificationSettings() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const openId = params.get('type') ?? '';
  const query = params.get('q') ?? '';
  const [view, setView] = useState<InternalNotificationsView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<TypeDraft | null>(null);
  const [defaults, setDefaults] = useState<Record<InternalUrgency, InternalChannelSet> | null>(null);
  const [tested, setTested] = useState<InternalDelivery | null>(null);
  const loadedFor = useRef('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.getInternalNotifications(user.id); if (!alive.current) return; setView(v); setDefaults((d) => d ?? v.urgencyChannels); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);

  const type: InternalTypeView | null = view?.types.find((t) => t.typeId === openId) ?? null;
  useEffect(() => {
    if (!type) { loadedFor.current = ''; setDraft(null); setTested(null); return; }
    const key = `${type.typeId}|${type.version}`;
    if (loadedFor.current !== key) { loadedFor.current = key; setDraft(draftOf(type)); }
  }, [type]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const act = async <T,>(fn: () => Promise<T>, after?: (v: T) => void): Promise<Result> => {
    setBusy(true);
    try { const v = await fn(); after?.(v); await read(); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  return {
    load, offline, view, type, openId, query, busy, draft, defaults, tested,
    refresh: read,
    open: (id: string | null) => patch((n) => { if (id) n.set('type', id); else n.delete('type'); }),
    setQuery: (q: string) => patch((n) => { if (q) n.set('q', q); else n.delete('q'); }),
    edit: (next: Partial<TypeDraft>) => setDraft((d) => (d ? { ...d, ...next } : d)),
    revert: () => { if (type) setDraft(draftOf(type)); },
    editDefaults: (next: Record<InternalUrgency, InternalChannelSet>) => setDefaults(next),
    save: (confirm: boolean): Promise<Result> => { const input: InternalTypeInput = draft as TypeDraft; return act(() => repository.saveInternalType(user?.id ?? '', openId, input, confirm)); },
    saveDefaults: (confirm: boolean): Promise<Result> => act(() => repository.saveInternalUrgencyChannels(user?.id ?? '', defaults as Record<InternalUrgency, InternalChannelSet>, confirm), (v) => setDefaults(v.urgencyChannels)),
    test: (channel: InternalChannel, role: string, rendered: InternalContent): Promise<Result> => act(() => repository.testSendInternalNotification(user?.id ?? '', openId, channel, role, rendered), (d) => setTested(d)),
  };
}
