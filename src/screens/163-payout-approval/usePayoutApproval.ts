import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PayoutApprovalFilter, PayoutApprovalProblem, PayoutBatchResult, PayoutDecisionView, PayoutQueueRow, PayoutQueueView } from '@/data/repository';
import { FLAG_FILTERS, PAGE, STATES } from './payout-approval.types';
import type { FlagFilter, QueueState } from './payout-approval.types';

export type PayoutApprovalState = ReturnType<typeof usePayoutApproval>;
export type ActionResult<T = PayoutQueueRow> = { ok: true; value: T } | { ok: false; problem: PayoutApprovalProblem | 'generic' };

const PROBLEMS: string[] = ['not_found', 'not_pending', 'not_holdable', 'in_flight', 'not_held', 'flags_unacknowledged', 'reason_required', 'kind_invalid', 'not_admin'];
const problemOf = (e: unknown): PayoutApprovalProblem | 'generic' => { const m = e instanceof Error ? e.message : ''; return PROBLEMS.includes(m) ? (m as PayoutApprovalProblem) : 'generic'; };

/**
 * Screen 163. The checkpoint before a worker payout goes out. It reads the queue (entries the ledger calls approved, each with its own state and the flags worked out
 * from the live records), and every decision goes through the repository, which applies the same rules this screen shows. Filters live in the address.
 */
export function usePayoutApproval() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';
  const stateParam = get('state');
  const state: QueueState | 'all' = stateParam === 'all' ? 'all' : (STATES as readonly string[]).includes(stateParam) ? (stateParam as QueueState) : 'pending';
  const flagged: FlagFilter = (FLAG_FILTERS as readonly string[]).includes(get('flagged')) ? (get('flagged') as FlagFilter) : 'all';
  const entry = get('entry');
  const q = get('q');
  const [qInput, setQInput] = useState(q);
  const [pages, setPages] = useState(1);
  const [data, setData] = useState<PayoutQueueView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [detail, setDetail] = useState<{ row: PayoutQueueRow; history: PayoutDecisionView[] } | null>(null);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const filter: PayoutApprovalFilter = { state, flagged, q: q || undefined };
  const key = JSON.stringify(filter);
  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getPayoutApprovalQueue({ ...filter, offset: 0, limit: PAGE * pages }, user.id);
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

  // The open payout is read on its own (with its history), so a link from an alert or a commitment opens it whatever the filters show.
  const loadDetail = useCallback(async () => {
    if (!entry || !user) { setDetail(null); return; }
    try { const v = await repository.getPayoutApprovalDetail(entry, user.id); if (alive.current) setDetail(v); } catch { if (alive.current) setDetail(null); }
  }, [repository, user, entry]);
  useEffect(() => { void loadDetail(); }, [loadDetail]);

  const after = async () => { await Promise.all([read(), loadDetail()]); };
  const run = async <T,>(fn: (adminId: string) => Promise<T>): Promise<ActionResult<T>> => {
    if (!user) return { ok: false, problem: 'not_admin' };
    try { const value = await fn(user.id); await after(); return { ok: true, value }; } catch (e) { await after(); return { ok: false, problem: problemOf(e) }; }
  };

  return {
    load, data, detail, filter, state, flagged, entry, qInput, refreshing, selecting, picked, batchOpen,
    setQInput,
    setState: (s: QueueState | 'all') => patch((n) => { if (s === 'pending') n.delete('state'); else n.set('state', s); setPicked([]); }),
    setFlagged: (f: FlagFilter) => patch((n) => { if (f === 'all') n.delete('flagged'); else n.set('flagged', f); }),
    clear: () => { setQInput(''); setParams(new URLSearchParams(), { replace: true }); },
    openEntry: (id: string | null) => patch((n) => { if (id) n.set('entry', id); else n.delete('entry'); }),
    more: () => setPages((p) => p + 1),
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await read(); await loadDetail(); } finally { if (alive.current) setRefreshing(false); } },
    setSelecting: (on: boolean) => { setSelecting(on); if (!on) setPicked([]); },
    toggle: (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    setPicked,
    openBatch: () => setBatchOpen(true),
    closeBatch: () => setBatchOpen(false),
    approve: (id: string, input: { acknowledged: string[]; expedited?: boolean; reason?: string }) => run((a) => repository.approvePayout(id, input, a)),
    approveBatch: async (ids: string[]): Promise<ActionResult<PayoutBatchResult>> => { const r = await run((a) => repository.approvePayoutsBatch(ids, a)); if (r.ok) setPicked([]); return r; },
    hold: (id: string, input: { kind: string; reason: string }) => run((a) => repository.holdPayout(id, input, a)),
    release: (id: string) => run((a) => repository.releasePayoutHold(id, a)),
  };
}
