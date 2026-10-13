import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PayoutQueryView, PayoutRowView, PayoutTrackerFilter, PayoutTrackerView } from '@/data/repository';
import { csvCell } from '@/features/commission/payoutTracker';
import { CATEGORIES, PAGE, PERIODS, SORTS, STATUSES } from './payout-tracker.types';
import type { PayoutCategory, PayoutStatus, PeriodId, Sort } from './payout-tracker.types';

const isoDay = (offset: number) => { const d = new Date(); d.setDate(d.getDate() - offset); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export type PayoutTrackerState = ReturnType<typeof usePayoutTracker>;

/**
 * Screen 162. The whole workforce's commission ledger in one place: what is waiting to be paid, what is not final yet and what was paid, grouped by what earned it, with
 * whatever stands out raised to the top. It reads the same entries every partner sees their own slice of, filtered in the repository, and keeps the filters in the address.
 */
export function usePayoutTracker() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';
  const status = (STATUSES as readonly string[]).includes(get('status')) ? (get('status') as PayoutStatus) : null;
  const category = (CATEGORIES as readonly string[]).includes(get('cat')) ? (get('cat') as PayoutCategory) : null;
  const partnerId = get('partner');
  const sort: Sort = (SORTS as readonly string[]).includes(get('sort')) ? (get('sort') as Sort) : 'recent';
  const rawFrom = get('from');
  const rawTo = get('to');
  const custom = DAY.test(rawFrom) || DAY.test(rawTo);
  const period: PeriodId = (PERIODS as readonly string[]).includes(get('days')) ? (get('days') as PeriodId) : '30';
  const from = custom ? (DAY.test(rawFrom) ? rawFrom : '') : period === 'all' ? '' : isoDay(Number(period));
  const to = custom ? (DAY.test(rawTo) ? rawTo : '') : period === 'all' ? '' : isoDay(0);
  const entry = get('entry');
  const [qInput, setQInput] = useState(get('q'));
  const q = get('q');
  const [pages, setPages] = useState(1);
  const [data, setData] = useState<PayoutTrackerView | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [fetched, setFetched] = useState<PayoutRowView | null>(null);
  const [queries, setQueries] = useState<PayoutQueryView[]>([]);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const filter: PayoutTrackerFilter = { status: status ?? 'all', category: category ?? 'all', partnerId: partnerId || undefined, from: from || undefined, to: to || undefined, q: q || undefined, sort };
  const key = JSON.stringify(filter);
  const load = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getPayoutTracker({ ...filter, offset: 0, limit: PAGE * pages }, user.id);
      if (alive.current && mine === seq.current) { setData(v); setState('ready'); }
    } catch {
      if (alive.current && mine === seq.current) setState((s) => (s === 'ready' ? s : 'error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, user, key, pages]);
  useEffect(() => { setState((s) => (s === 'ready' ? s : 'loading')); void load(); const id = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(id); }, [load]);
  useEffect(() => { setPages(1); }, [key]);
  useEffect(() => { const h = window.setTimeout(() => { if (qInput !== q) patch((n) => { if (qInput.trim()) n.set('q', qInput.trim()); else n.delete('q'); }); }, 250); return () => window.clearTimeout(h); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  // A payout opened from an alert or a link may not be on the page that is showing: it is looked up on its own.
  const inPage = entry && data ? (data.rows.find((r) => r.id === entry) ?? null) : null;
  useEffect(() => {
    if (!entry || inPage || !user) { setFetched(null); return; }
    let live = true;
    void repository.getPayoutTracker({ q: entry, limit: 5, from: undefined }, user.id).then((v) => { if (live) setFetched(v.rows.find((r) => r.id === entry) ?? null); }).catch(() => undefined);
    return () => { live = false; };
  }, [repository, user, entry, inPage]);
  // A partner's questions about the open payout (168), so Admin can answer them from here.
  const loadQueries = useCallback(async () => {
    if (!entry || !user) { setQueries([]); return; }
    try { const v = await repository.listPayoutQueries(entry, user.id); if (alive.current) setQueries(v); } catch { if (alive.current) setQueries([]); }
  }, [repository, user, entry]);
  useEffect(() => { void loadQueries(); }, [loadQueries]);
  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  return {
    queries, answerQuery: async (id: string, text: string): Promise<boolean> => { if (!user) return false; try { await repository.answerPayoutQuery(id, text, user.id); await loadQueries(); return true; } catch { await loadQueries(); return false; } },
    state, data, entryRow: inPage ?? fetched, filter, status, category, partnerId, sort, period, custom, from, to, entry, qInput, refreshing, pages,
    setQInput,
    setStatus: (s: PayoutStatus | null) => patch((n) => { if (s) n.set('status', s); else n.delete('status'); }),
    setCategory: (c: PayoutCategory | null) => patch((n) => { if (c) n.set('cat', c); else n.delete('cat'); }),
    setPartner: (id: string) => patch((n) => { if (id) n.set('partner', id); else n.delete('partner'); }),
    setSort: (s: Sort) => patch((n) => { if (s === 'recent') n.delete('sort'); else n.set('sort', s); }),
    setPeriod: (p: PeriodId) => patch((n) => { n.delete('from'); n.delete('to'); if (p === '30') n.delete('days'); else n.set('days', p); }),
    setRange: (a: string, b: string) => patch((n) => { n.delete('days'); if (a) n.set('from', a); else n.delete('from'); if (b) n.set('to', b); else n.delete('to'); }),
    /** A figure that stands for what is owed right now opens exactly the payouts behind it, whatever the date range. */
    drill: (s: PayoutStatus | null, c: PayoutCategory | null) => patch((n) => { n.delete('from'); n.delete('to'); n.set('days', 'all'); n.delete('q'); n.delete('partner'); if (s) n.set('status', s); else n.delete('status'); if (c) n.set('cat', c); else n.delete('cat'); setQInput(''); }),
    clear: () => { setQInput(''); setParams(new URLSearchParams(), { replace: true }); },
    openEntry: (id: string | null) => patch((n) => { if (id) n.set('entry', id); else n.delete('entry'); }),
    more: () => setPages((p) => p + 1),
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await load(); } finally { if (alive.current) setRefreshing(false); } },
    /** Every payout the filters match, as the spec's columns plus names and dates. */
    exportCsv: async (label: { status: (s: string) => string; trigger: (r: PayoutRowView) => string }): Promise<number> => {
      if (!user) return 0;
      const all = await repository.getPayoutTracker({ ...filter, offset: 0, limit: 0 }, user.id);
      const lines = [['payout_entry_id', 'partner_id', 'partner_name', 'trigger_type', 'amount', 'currency', 'status', 'earned_on', 'paid_on'].join(',')];
      for (const r of all.rows) lines.push([r.id, r.partnerId, r.partnerName, label.trigger(r), r.amount, r.currency, label.status(r.status), r.earnedAt.slice(0, 10), r.paidAt ? r.paidAt.slice(0, 10) : ''].map(csvCell).join(','));
      const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aiec-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return all.rows.length;
    },
  };
}
