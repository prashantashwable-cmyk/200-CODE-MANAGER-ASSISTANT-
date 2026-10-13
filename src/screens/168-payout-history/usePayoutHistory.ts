import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PayoutEntryDetail, PayoutHistoryFilter, PayoutHistoryView, PayoutQueryView, PayoutStatementView } from '@/data/repository';
import { PAGE, STATUS_FILTERS } from './payout-history.types';
import type { StatusFilter } from './payout-history.types';

export type PayoutHistoryState = ReturnType<typeof usePayoutHistory>;
export type QueryResult = { ok: true; value: PayoutQueryView } | { ok: false; problem: string };
const PROBLEMS = ['text_short', 'answer_short', 'not_found', 'not_yours', 'already_open', 'not_open', 'forbidden'];
const problemOf = (e: unknown): string => { const m = e instanceof Error ? e.message : ''; return PROBLEMS.includes(m) ? m : 'generic'; };

/**
 * Screen 168. A partner's own payout record. It reads the one commission ledger (a supplier's reads their supplier payments) through the repository, filtered and paged there so a
 * history of many years stays quick; the filters live in the address. A statement is built by the repository from the same entries, so its totals are the list's totals.
 */
export function usePayoutHistory() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';
  const statusParam = get('status');
  const status: StatusFilter = (STATUS_FILTERS as readonly string[]).includes(statusParam) ? (statusParam as StatusFilter) : 'all';
  const category = get('cat');
  const from = get('from');
  const to = get('to');
  const q = get('q');
  const entry = get('entry');
  const ask = get('ask') === '1';
  const periodParam = get('period');
  const [qInput, setQInput] = useState(q);
  const [pages, setPages] = useState(1);
  const [data, setData] = useState<PayoutHistoryView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<PayoutEntryDetail | null>(null);
  const [statement, setStatement] = useState<PayoutStatementView | null>(null);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const filter: PayoutHistoryFilter = { status, category: (category || 'all') as PayoutHistoryFilter['category'], from: from || undefined, to: to || undefined, q: q || undefined };
  const key = JSON.stringify(filter);
  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getPayoutHistory({ ...filter, offset: 0, limit: PAGE * pages }, user.id);
      if (alive.current && mine === seq.current) { setData(v); setLoad('ready'); }
    } catch {
      if (alive.current && mine === seq.current) setLoad((s) => (s === 'ready' ? s : 'error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, user, key, pages]);
  useEffect(() => { setLoad((s) => (s === 'ready' ? s : 'loading')); void read(); const id = window.setInterval(() => void read(), 60_000); return () => window.clearInterval(id); }, [read]);
  useEffect(() => { setPages(1); }, [key]);
  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  useEffect(() => { const h = window.setTimeout(() => { if (qInput !== q) patch((n) => { if (qInput.trim()) n.set('q', qInput.trim()); else n.delete('q'); }); }, 250); return () => window.clearTimeout(h); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const loadDetail = useCallback(async () => {
    if (!entry || !user) { setDetail(null); return; }
    try { const v = await repository.getPayoutEntryDetail(entry, user.id); if (alive.current) setDetail(v); } catch { if (alive.current) setDetail(null); }
  }, [repository, user, entry]);
  useEffect(() => { void loadDetail(); }, [loadDetail]);

  // The statement shown is the chosen period, or the most recent month that has something in it.
  const periods = data?.periods ?? [];
  const period = periodParam && periods.some((p) => p.id === periodParam) ? periodParam : (periods.find((p) => p.kind === 'month')?.id ?? periods[0]?.id ?? null);
  useEffect(() => {
    if (!period || !user) { setStatement(null); return; }
    let live = true;
    void repository.getPayoutStatement(period, user.id).then((v) => { if (live) setStatement(v); }).catch(() => { if (live) setStatement(null); });
    return () => { live = false; };
  }, [repository, user, period, data?.at]);

  const after = async () => { await Promise.all([read(), loadDetail()]); };
  const run = async (fn: (userId: string) => Promise<PayoutQueryView>): Promise<QueryResult> => {
    if (!user) return { ok: false, problem: 'forbidden' };
    try { const value = await fn(user.id); await after(); return { ok: true, value }; } catch (e) { await after(); return { ok: false, problem: problemOf(e) }; }
  };

  return {
    load, data, detail, statement, period, filter, status, category, from, to, entry, ask, qInput, refreshing, role: data?.person.role ?? user?.role ?? null,
    setQInput,
    setStatus: (s: StatusFilter) => patch((n) => { if (s === 'all') n.delete('status'); else n.set('status', s); }),
    setCategory: (c: string) => patch((n) => { if (c) n.set('cat', c); else n.delete('cat'); }),
    setRange: (a: string, b: string) => patch((n) => { if (a) n.set('from', a); else n.delete('from'); if (b) n.set('to', b); else n.delete('to'); }),
    setPeriod: (id: string) => patch((n) => { n.set('period', id); }),
    clear: () => { setQInput(''); setParams(new URLSearchParams(), { replace: true }); },
    openEntry: (id: string | null) => patch((n) => { if (id) n.set('entry', id); else { n.delete('entry'); n.delete('ask'); } }),
    more: () => setPages((p) => p + 1),
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await after(); } finally { if (alive.current) setRefreshing(false); } },
    askQuestion: (entryId: string, text: string) => run((u) => repository.raisePayoutQuery(entryId, text, u)),
    resolveQuestion: (id: string) => run((u) => repository.resolvePayoutQuery(id, u)),
  };
}
