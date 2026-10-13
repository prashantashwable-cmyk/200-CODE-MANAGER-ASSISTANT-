import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AuditDetailView, AuditExportView, AuditFilter, AuditSearchView } from '@/data/repository';
import type { AuditExportRecord } from '@/data/types';
import { PAGE, POLL_MS } from './audit-log.types';

export type AuditLogState = ReturnType<typeof useAuditLog>;

/** Screen 187. Read-only over the log: every filter lives in the address, the list is asked for a page at a time (so thousands of entries stay quick), and an export is recorded. */
export function useAuditLog() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const filter: AuditFilter = { q: params.get('q') ?? '', category: params.get('cat') ?? '', source: params.get('src') ?? '', record: params.get('rec') ?? '', from: params.get('from') ?? '', to: params.get('to') ?? '' };
  const pages = Math.max(1, Number(params.get('n') ?? '1') || 1);
  const entryId = params.get('entry') ?? '';
  const [view, setView] = useState<AuditSearchView | null>(null);
  const [detail, setDetail] = useState<AuditDetailView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const key = JSON.stringify([filter, pages]);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.searchAutomatedActions(user.id, { ...filter, limit: PAGE * pages, offset: 0 }); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, user, key]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);
  useEffect(() => {
    if (!entryId || !user) { setDetail(null); return; }
    let live = true;
    void repository.getAutomatedActionDetail(user.id, entryId).then((d) => { if (live && alive.current) setDetail(d); }).catch(() => { if (live) setDetail(null); });
    return () => { live = false; };
  }, [repository, user, entryId]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const setFilter = (name: string, value: string) => patch((n) => { if (value) n.set(name, value); else n.delete(name); n.delete('n'); });
  const exportRows = async (f: AuditFilter, kind: AuditExportRecord['kind']): Promise<AuditExportView | null> => {
    setBusy(true);
    try { const r = await repository.exportAutomatedActions(user?.id ?? '', { ...f, limit: 0 }, kind); await read(); return r; } catch { return null; } finally { if (alive.current) setBusy(false); }
  };
  return {
    load, offline, view, detail, busy, filter, pages, entryId,
    refresh: read,
    setFilter,
    clear: () => patch((n) => { for (const k of ['q', 'cat', 'src', 'rec', 'from', 'to', 'n']) n.delete(k); }),
    more: () => patch((n) => n.set('n', String(pages + 1))),
    open: (id: string | null) => patch((n) => { if (id) n.set('entry', id); else n.delete('entry'); }),
    filtered: !!(filter.q || filter.category || filter.source || filter.record || filter.from || filter.to),
    exportRows,
  };
}
