import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DisbursementActionResult, DisbursementBoardView, DisbursementDetailView, DisbursementFilter, DisbursementProblem, DisbursementRowView, PayoutAccountView } from '@/data/repository';
import { PAGE, STATES, csvCell } from './payout-disbursement.types';
import type { StateFilter } from './payout-disbursement.types';

export type PayoutDisbursementState = ReturnType<typeof usePayoutDisbursement>;
export type ActionResult<T> = { ok: true; value: T } | { ok: false; problem: DisbursementProblem | 'generic' };

const PROBLEMS: string[] = ['not_found', 'not_failed', 'details_unchanged', 'in_flight', 'nothing_ready', 'no_details', 'blocked', 'reason_required', 'details_invalid', 'schedule_invalid', 'not_admin'];
const problemOf = (e: unknown): DisbursementProblem | 'generic' => { const m = e instanceof Error ? e.message : ''; return PROBLEMS.includes(m) ? (m as DisbursementProblem) : 'generic'; };

/**
 * Screen 164. The engine behind Payout Approval: what is cleared and waiting, what is on its way to a partner's account, what did not reach them and why, and the weekly run.
 * Everything is read from the repository, which settles transfers on each read; filters live in the address. A transfer opened from an alert or a commitment is read on its own.
 */
export function usePayoutDisbursement() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';
  const stateParam = get('state');
  const state: StateFilter = stateParam === 'all' ? 'all' : (STATES as readonly string[]).includes(stateParam) ? (stateParam as StateFilter) : 'all';
  const disbursement = get('disbursement');
  const partner = get('partner');
  const q = get('q');
  const [qInput, setQInput] = useState(q);
  const [pages, setPages] = useState(1);
  const [data, setData] = useState<DisbursementBoardView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<DisbursementDetailView | null>(null);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const filter: DisbursementFilter = { status: state, q: q || undefined };
  const key = JSON.stringify(filter);
  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getPayoutDisbursements({ ...filter, offset: 0, limit: PAGE * pages }, user.id);
      if (alive.current && mine === seq.current) { setData(v); setLoad('ready'); }
    } catch {
      if (alive.current && mine === seq.current) setLoad((s) => (s === 'ready' ? s : 'error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, user, key, pages]);
  useEffect(() => { setLoad((s) => (s === 'ready' ? s : 'loading')); void read(); const id = window.setInterval(() => void read(), 20_000); return () => window.clearInterval(id); }, [read]);
  useEffect(() => { setPages(1); }, [key]);
  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  useEffect(() => { const h = window.setTimeout(() => { if (qInput !== q) patch((n) => { if (qInput.trim()) n.set('q', qInput.trim()); else n.delete('q'); }); }, 250); return () => window.clearTimeout(h); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const loadDetail = useCallback(async () => {
    if (!disbursement || !user) { setDetail(null); return; }
    try { const v = await repository.getDisbursementDetail(disbursement, user.id); if (alive.current) setDetail(v); } catch { if (alive.current) setDetail(null); }
  }, [repository, user, disbursement]);
  useEffect(() => { void loadDetail(); const id = window.setInterval(() => void loadDetail(), 20_000); return () => window.clearInterval(id); }, [loadDetail]);

  const after = async () => { await Promise.all([read(), loadDetail()]); };
  const run = async <T,>(fn: (adminId: string) => Promise<T>): Promise<ActionResult<T>> => {
    if (!user) return { ok: false, problem: 'not_admin' };
    try { const value = await fn(user.id); await after(); return { ok: true, value }; } catch (e) { await after(); return { ok: false, problem: problemOf(e) }; }
  };

  return {
    load, data, detail, filter, state, disbursement, partner, qInput, refreshing,
    setQInput,
    setState: (s: StateFilter) => patch((n) => { if (s === 'all') n.delete('state'); else n.set('state', s); }),
    clear: () => { setQInput(''); setParams(new URLSearchParams(), { replace: true }); },
    openDisbursement: (id: string | null) => patch((n) => { if (id) n.set('disbursement', id); else n.delete('disbursement'); }),
    openPartner: (id: string | null) => patch((n) => { if (id) n.set('partner', id); else n.delete('partner'); }),
    more: () => setPages((p) => p + 1),
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await after(); } finally { if (alive.current) setRefreshing(false); } },
    startRun: (): Promise<ActionResult<DisbursementActionResult>> => run((a) => repository.startPayoutRun(a)),
    sendNow: (partnerId: string, entryIds?: string[]): Promise<ActionResult<DisbursementActionResult>> => run((a) => repository.sendPayoutNow(partnerId, { entryIds }, a)),
    retry: (id: string): Promise<ActionResult<DisbursementRowView>> => run((a) => repository.retryDisbursement(id, a)),
    retryRun: (runId: string): Promise<ActionResult<DisbursementActionResult>> => run((a) => repository.retryRunFailures(runId, a)),
    updateAccount: (partnerId: string, input: { holderName?: string; upiId?: string; accountNumber?: string; ifsc?: string; bankName?: string; note: string; retry: boolean }): Promise<ActionResult<{ account: PayoutAccountView; retried: DisbursementRowView[] }>> => run((a) => repository.updatePayoutAccount(partnerId, input, a)),
    contact: (id: string, input: { channel: 'call' | 'whatsapp' | 'message'; note: string }) => run((a) => repository.recordDisbursementContact(id, input, a)),
    cancel: (id: string, reason: string) => run((a) => repository.cancelDisbursement(id, { reason }, a)),
    saveSchedule: (input: { enabled: boolean; weekday: number; hour: number; consolidate: boolean }) => run((a) => repository.savePayoutSchedule(input, a)),
    setRail: (input: { status: 'connected' | 'unavailable'; interruptAfter: number | null }) => run((a) => repository.setPayoutRail(input, a)),
    /** One line per payout entry, with the spec's columns plus names, amounts and the bank reference. */
    exportCsv: async (label: { status: (s: string) => string; reason: (r: string) => string }): Promise<number> => {
      if (!user) return 0;
      const all = await repository.getPayoutDisbursements({ ...filter, offset: 0, limit: 0 }, user.id);
      const lines = [['disbursement_id', 'payout_entry_id', 'disbursement_method', 'disbursement_status', 'failure_reason', 'partner_id', 'partner_name', 'transfer_amount', 'created_on', 'completed_on', 'bank_reference'].join(',')];
      for (const r of all.rows) for (const eid of r.entryIds) lines.push([r.code, eid, r.method, label.status(r.status), r.failure ? label.reason(r.failure) : '', r.partnerId, r.partnerName, r.amount, r.createdAt.slice(0, 10), r.completedAt ? r.completedAt.slice(0, 10) : '', r.bankReference ?? ''].map(csvCell).join(','));
      const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aiec-disbursements-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return lines.length - 1;
    },
  };
}
