import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DecisionListView } from '@/data/repository';
import type { DecisionInput, DecisionView, PacketInput } from '@/features/decisions/decisions';
import type { DecisionStatus } from '@/features/authority/authority';

export type DeskFilter = 'open' | Extract<DecisionStatus, 'approved' | 'rejected' | 'delegated'> | 'all';
type Result = { ok: true } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
const POLL_MS = 30_000;

/** Screen 201. The list is read again every half minute and when the tab is shown, so a card another person prepared appears without a reload. */
export function useDecisionDesk() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [filter, setFilter] = useState<DeskFilter>('open');
  const [list, setList] = useState<DecisionListView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<DecisionView | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!uid) return;
    try {
      const v = await repository.listDecisionCards(uid, filter === 'all' ? {} : { status: filter });
      if (!alive.current) return;
      setList(v); setLoad('ready'); setOffline(false);
    } catch {
      if (!alive.current) return;
      setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, uid, filter]);

  useEffect(() => {
    setLoad((s) => (s === 'ready' ? s : 'loading'));
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);

  const act = async (fn: () => Promise<unknown>): Promise<Result> => {
    setBusy(true);
    try { await fn(); await read(); return { ok: true }; }
    catch (e) { return { ok: false, problem: problemOf(e) }; }
    finally { if (alive.current) setBusy(false); }
  };

  return {
    load, offline, busy, filter, setFilter, list, selected, refresh: read,
    open: async (cardId: string): Promise<Result> => {
      try { const v = await repository.getDecisionCard(uid, cardId); if (alive.current) setSelected(v); return { ok: true }; }
      catch (e) { return { ok: false, problem: problemOf(e) }; }
    },
    close: () => setSelected(null),
    decide: async (input: DecisionInput): Promise<Result> => {
      const r = await act(() => repository.decideDecisionCard(uid, input));
      if (r.ok) { try { const v = await repository.getDecisionCard(uid, input.cardId); if (alive.current) setSelected(v); } catch { /* the list is already fresh */ } }
      return r;
    },
    prepare: (input: PacketInput) => act(() => repository.prepareDecisionPacket(uid, input)),
    people: async () => (await repository.listPermissionUsers(uid, '')).filter((p) => p.status === 'active' && p.role !== 'admin' && p.role !== 'owner' && p.role !== 'customer'),
  };
}
