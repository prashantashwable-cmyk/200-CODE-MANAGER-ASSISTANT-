import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DisputeTargets, PayoutDecisionInput, PayoutDisputeBoard, PayoutDisputeFilter, PayoutDisputeView, PayoutEntryDetail, PayoutHistoryEntry, SupplierDisputeView } from '@/data/repository';
import { PAGE, STATES } from './payout-dispute.types';
import type { Flag, FormKind, Topic } from './payout-dispute.types';

export type DisputeState = ReturnType<typeof useDispute>;
export type Result<T = PayoutDisputeView> = { ok: true; value: T } | { ok: false; problem: string; earlier?: { code: string; notes: string | null } };
const PROBLEMS = ['text_short', 'topic_missing', 'claim_invalid', 'same_words', 'already_open', 'not_found', 'not_yours', 'not_admin', 'forbidden', 'not_open', 'explain_short', 'reason_short', 'update_short', 'correction_invalid', 'correction_too_large', 'entry_not_payable', 'already_resolved', 'systemic_short', 'no_review_needed', 'outcome_missing', 'rule_unknown', 'already_flagged', 'answer_short'];
const problemOf = (e: unknown): string => { const m = e instanceof Error ? e.message : ''; return PROBLEMS.includes(m) ? m : 'generic'; };
export const draftKey = (user: string, entry: string) => `aiec.payoutDisputeDraft.${user}.${entry}`;
export interface Draft { kind: FormKind; topic: Topic | ''; claimed: string; text: string }
const EMPTY: Draft = { kind: 'dispute', topic: '', claimed: '', text: '' };
const readDraft = (user: string, entry: string): Draft => { try { const v = JSON.parse(localStorage.getItem(draftKey(user, entry)) ?? 'null'); return v && typeof v === 'object' ? { ...EMPTY, ...v } : EMPTY; } catch { return EMPTY; } };

/**
 * Screen 170. One screen, three people. A partner asks or disputes about one payout (a draft is kept on the phone), a supplier raises a payment dispute that 117 decides, and Admin
 * settles the queue: explain, correct through the ledger, or escalate. The record is 168's own `PayoutQuery`, so a question asked from the payout and a dispute raised here are one thread.
 */
export function useDispute() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const role = user?.role ?? null;
  const isAdmin = role === 'admin';
  const isSupplier = role === 'supplier';
  const get = (k: string) => params.get(k) ?? '';
  const stateParam = get('state');
  const state = (stateParam === 'all' || (STATES as readonly string[]).includes(stateParam) || stateParam === 'active' ? stateParam : isAdmin ? 'active' : 'all') as NonNullable<PayoutDisputeFilter['state']>;
  const flag = (['late', 'repeat', 'systemic'].includes(get('flag')) ? get('flag') : 'all') as Flag;
  const q = get('q');
  const disputeId = get('dispute');
  const entryId = get('entry');
  const picking = get('new') === '1';
  const [qInput, setQInput] = useState(q);
  const [pages, setPages] = useState(1);
  const [board, setBoard] = useState<PayoutDisputeBoard | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [detail, setDetail] = useState<PayoutDisputeView | null>(null);
  const [detailLoad, setDetailLoad] = useState<'idle' | 'loading' | 'error'>('idle');
  const [entry, setEntry] = useState<PayoutEntryDetail | null>(null);
  const [recent, setRecent] = useState<PayoutHistoryEntry[] | null>(null);
  const [targets, setTargets] = useState<DisputeTargets | null>(null);
  const [draft, setDraftState] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const filter: PayoutDisputeFilter = { state, flag, q: q || undefined };
  const key = JSON.stringify(filter);
  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getPayoutDisputes({ ...filter, offset: 0, limit: PAGE * pages }, user.id);
      if (alive.current && mine === seq.current) { setBoard(v); setLoad('ready'); }
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
    if (!disputeId || !user || isSupplier) { setDetail(null); setDetailLoad('idle'); return; }
    try { const v = await repository.getPayoutDispute(disputeId, user.id); if (alive.current) { setDetail(v); setDetailLoad('idle'); } } catch { if (alive.current) { setDetail(null); setDetailLoad('error'); } }
  }, [repository, user, disputeId, isSupplier]);
  useEffect(() => { setDetailLoad(disputeId ? 'loading' : 'idle'); void loadDetail(); }, [loadDetail, disputeId]);

  // The form: the entry it is about, with what is already known about it.
  useEffect(() => {
    if (!entryId || !user || isAdmin || isSupplier) { setEntry(null); return; }
    let live = true;
    void repository.getPayoutEntryDetail(entryId, user.id).then((v) => { if (live) setEntry(v); }).catch(() => { if (live) setEntry(null); });
    setDraftState(readDraft(user.id, entryId));
    return () => { live = false; };
  }, [repository, user, entryId, isAdmin, isSupplier]);
  useEffect(() => {
    if (!picking || !user || isAdmin || isSupplier) return;
    let live = true;
    void repository.getPayoutHistory({ status: 'all', limit: 30 }, user.id).then((v) => { if (live) setRecent(v.rows); }).catch(() => { if (live) setRecent([]); });
    return () => { live = false; };
  }, [repository, user, picking, isAdmin, isSupplier]);
  useEffect(() => {
    if (!isSupplier || !user) return;
    void repository.getDisputeTargets(user.id).then((v) => { if (alive.current) setTargets(v); }).catch(() => { if (alive.current) setTargets(null); });
  }, [repository, user, isSupplier, board?.at]);

  const setDraft = (d: Partial<Draft>) => setDraftState((prev) => {
    const next = { ...prev, ...d };
    if (user && entryId) { try { localStorage.setItem(draftKey(user.id, entryId), JSON.stringify(next)); } catch { /* the phone may refuse; the form still works */ } }
    return next;
  });
  const after = async () => { await Promise.all([read(), loadDetail()]); };
  const guard = async <T,>(fn: (userId: string) => Promise<T>): Promise<Result<T>> => {
    if (!user) return { ok: false, problem: 'forbidden' };
    setBusy(true);
    try { const value = await fn(user.id); await after(); return { ok: true, value }; } catch (e) { await after(); return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };

  return {
    role, isAdmin, isSupplier, load, board, detail, detailLoad, entry, recent, targets, draft, busy, state, flag, q, qInput, disputeId, entryId, picking, filter,
    setQInput, setDraft,
    setState: (s: string) => patch((n) => { n.set('state', s); }),
    setFlag: (f: Flag) => patch((n) => { if (f === 'all') n.delete('flag'); else n.set('flag', f); }),
    open: (id: string | null) => patch((n) => { if (id) { n.set('dispute', id); n.delete('entry'); n.delete('new'); } else n.delete('dispute'); }),
    startNew: () => patch((n) => { n.set('new', '1'); n.delete('entry'); n.delete('dispute'); }),
    pick: (id: string) => patch((n) => { n.set('entry', id); n.delete('new'); n.delete('dispute'); }),
    closeForm: () => patch((n) => { n.delete('entry'); n.delete('new'); }),
    clear: () => { setQInput(''); setParams(new URLSearchParams(), { replace: true }); },
    more: () => setPages((p) => p + 1),
    goTo: (path: string) => navigate(path),
    refresh: after,
    submit: async (): Promise<Result> => {
      const d = draft;
      const claimed = d.claimed.trim() === '' ? null : Number(d.claimed.replace(/,/g, ''));
      const res = await guard(async (u) => {
        if (d.kind === 'question') { const qv = await repository.raisePayoutQuery(entryId, d.text, u); return repository.getPayoutDispute(qv.id, u); }
        return repository.raisePayoutDispute({ entryId, topic: d.topic as Topic, text: d.text, claimedAmount: claimed }, u);
      });
      if (res.ok) {
        try { localStorage.removeItem(draftKey(user?.id ?? '', entryId)); } catch { /* nothing to clear */ }
        setDraftState(EMPTY);
        patch((n) => { n.delete('entry'); n.delete('new'); n.set('dispute', res.value.row.id); });
      } else if (res.problem === 'same_words') {
        const earlier = entry?.queries?.length ? null : null;
        void earlier;
        try { const list = await repository.getPayoutDisputes({ entryId, state: 'all' }, user?.id ?? ''); const last = list.rows[0]; const v = last ? await repository.getPayoutDispute(last.id, user?.id ?? '') : null; return { ...res, earlier: v ? { code: v.row.code, notes: v.row.resolution?.notes ?? null } : undefined }; } catch { return res; }
      }
      return res;
    },
    withdraw: (id: string) => guard(async (u) => { await repository.resolvePayoutQuery(id, u); return repository.getPayoutDispute(id, u); }),
    askAgain: (entry: string) => patch((n) => { n.set('entry', entry); n.delete('dispute'); n.delete('new'); }),
    decide: (id: string, input: PayoutDecisionInput) => guard((u) => repository.decidePayoutDispute(id, input, u)),
    sendUpdate: (id: string, text: string) => guard((u) => repository.sendPayoutDisputeUpdate(id, text, u)),
    flagSystemic: (id: string, note: string) => guard((u) => repository.flagPayoutDisputeSystemic(id, note, u)),
    review: (id: string, input: { outcome: 'rule_changed' | 'no_change'; note: string }) => guard((u) => repository.recordSystemicReview(id, input, u)),
    raiseSupplier: (input: { poId: string; paymentId: string; position: string; claimedAmount: number | null }) => guard<SupplierDisputeView>((u) => repository.raiseSupplierDispute({ kind: 'amount', poId: input.poId, paymentId: input.paymentId, position: input.position, ...(input.claimedAmount ? { claimedAmount: input.claimedAmount } : {}) }, u)),
  };
}
