import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { SnagAddInput, SnagBoardView, SnagDetailView, SnagRowView } from '@/data/repository';
import type { DisputeDecision, SnagSeverity } from '@/features/qc/snags';
import { isOpen } from '@/features/qc/snags';
import type { SnagListStatus, StatusFilter } from './snag-list.types';
import { POLL_MS, SNAG_KEYS as K } from './snag-list.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

/** What the filters keep: the same rule for every row, so a count and the list below it always agree. */
export function matches(r: SnagRowView, f: { q: string; severity: SnagSeverity | 'all'; status: StatusFilter; jobId: string | 'all' }, label: string): boolean {
  if (f.severity !== 'all' && r.severity !== f.severity) return false;
  if (f.jobId !== 'all' && r.jobId !== f.jobId) return false;
  if (f.status === 'open' && !isOpen(r.status)) return false;
  if (f.status === 'pending' && r.status !== 'ready_for_retest') return false;
  if (f.status === 'disputed' && r.status !== 'disputed') return false;
  if (f.status === 'closed' && isOpen(r.status)) return false;
  const q = f.q.trim().toLowerCase();
  if (!q) return true;
  return [r.code, r.jobCode, r.siteName, r.title ?? '', label, r.ownerName ?? ''].some((x) => x.toLowerCase().includes(q));
}

export type SnagState = ReturnType<typeof useSnagList>;

/**
 * Screen 135. The one punch-list of everything QC found that is not yet put right: every fail from the mechanical and electrical checks and
 * anything the inspector adds, grouped by severity so the serious ones are never buried. A snag is closed only by QC's re-confirmation, never by
 * whoever fixed it; a safety-critical one blocks handover until it is.
 */
export function useSnagList() {
  const repository = useData();
  const { user } = useSession();
  const { jobId: jobParam } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [board, setBoard] = useState<SnagBoardView | null>(null);
  const [status, setStatus] = useState<SnagListStatus>('loading');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [severity, setSeverity] = useState<SnagSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [jobPick, setJobPick] = useState<string | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<SnagDetailView | null>(null);
  const openId = params.get('snag');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getSnagBoard(user.id, jobParam));
      setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (c === 'not_found' || c === 'forbidden') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobParam]);

  useEffect(() => {
    setBoard(null);
    setStatus('loading');
    setSelected(new Set());
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);

  const loadDetail = useCallback(async () => {
    if (!user || !openId) {
      setDetail(null);
      return;
    }
    try {
      setDetail(await repository.getSnag(openId, user.id));
    } catch {
      setDetail(null);
    }
  }, [repository, user, openId]);
  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const guard = async <R,>(fn: () => Promise<R>, okKey?: string): Promise<ActionResult> => {
    if (!navigator.onLine) return { ok: false, code: 'offline' };
    setBusy(true);
    try {
      await fn();
      await Promise.all([load(), loadDetail()]);
      if (okKey) push(t(okKey), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      setBusy(false);
    }
  };
  const uid = user?.id ?? '';
  const filter = { q, severity, status: statusFilter, jobId: jobParam ?? jobPick };
  const label = (r: SnagRowView) => (r.itemLabelKey ? t(r.itemLabelKey) : (r.title ?? ''));
  const rows = useMemo(() => (board?.rows ?? []).filter((r) => matches(r, filter, label(r))), [board, q, severity, statusFilter, jobPick, jobParam]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedRows = useMemo(() => (board?.rows ?? []).filter((r) => selected.has(r.id)), [board, selected]);
  const openSnag = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('snag', id);
    else next.delete('snag');
    setParams(next, { replace: true });
  };

  return {
    status,
    jobId: jobParam ?? null,
    board,
    rows,
    busy,
    reload: () => {
      setStatus('loading');
      void load();
    },
    q,
    setQ,
    severity,
    setSeverity,
    statusFilter,
    setStatusFilter,
    jobPick,
    setJobPick,
    clearFilters: () => {
      setQ('');
      setSeverity('all');
      setStatusFilter('open');
      setJobPick('all');
    },
    selected,
    selectedRows,
    toggle: (id: string) => setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    }),
    clearSelection: () => setSelected(new Set()),
    detail,
    openId,
    openSnag,
    add: (jobId: string, input: SnagAddInput) => guard(async () => { const d = await repository.addSnag(jobId, input, uid); openSnag(d.id); }, K.add.toast),
    assign: (ids: string[], technicianId: string) => guard(async () => { await repository.assignSnags(ids, technicianId, uid); setSelected(new Set()); }, K.assign.toast),
    regrade: (id: string, severity2: SnagSeverity, reason: string) => guard(() => repository.regradeSnag(id, severity2, reason, uid), K.regrade.toast),
    link: (ids: string[], primaryId: string, note: string) => guard(async () => { await repository.linkSnags({ snagIds: ids, primaryId, note }, uid); setSelected(new Set()); }, K.link.toast),
    dispute: (id: string, reason: string) => guard(() => repository.disputeSnag(id, reason, uid), K.dispute.toast),
    decide: (id: string, decision: DisputeDecision, note: string) => guard(() => repository.decideSnagDispute(id, decision, note, uid), K.decide.toast),
    waive: (id: string, by: string, note: string) => guard(() => repository.waiveSnag(id, { by, note }, uid), K.waive.toast),
    verify: (id: string, note: string) => guard(() => repository.verifySnag(id, note, uid), K.verify.toast),
    goto: (path: string) => navigate(path),
  };
}
