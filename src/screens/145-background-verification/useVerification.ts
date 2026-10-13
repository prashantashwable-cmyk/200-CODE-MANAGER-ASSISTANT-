import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { VerificationBoardView, VerificationDetailView } from '@/data/repository';
import type { VerificationHow } from '@/data/types';
import { PAGE, POLL_MS, STATUS_FILTERS, VERIFICATION_KEYS as K, boardPath, detailPath } from './verification.types';
import type { RoleFilter, StatusFilter } from './verification.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
  message?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

export type VerificationState = ReturnType<typeof useVerification>;

/**
 * Screen 145. The gate in front of the offer: each approved applicant has the items their role needs, checked by the ID service where it can
 * answer and by a person where it cannot (or is down). A concerning result blocks and keeps its reason; a hard-to-get document can be allowed
 * conditionally with a deadline. Nothing here sends an offer: 146 reads the gate.
 */
export function useVerification() {
  const repository = useData();
  const { user } = useSession();
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const [board, setBoard] = useState<VerificationBoardView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [detail, setDetail] = useState<VerificationDetailView | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'error' | 'gone'>('idle');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [filter, setFilter] = useState<StatusFilter>(() => { const f = new URLSearchParams(window.location.search).get('status') as StatusFilter | null; return f && (STATUS_FILTERS as readonly string[]).includes(f) ? f : 'all'; });
  const [limit, setLimit] = useState(PAGE);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const b = await repository.getVerificationBoard(user.id);
      if (!alive.current) return;
      setBoard(b);
      setStatus('ready');
    } catch {
      if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user]);

  const loadDetail = useCallback(async () => {
    if (!user || !applicationId) return;
    try {
      const d = await repository.getVerification(applicationId, user.id);
      if (alive.current) {
        setDetail(d);
        setDetailStatus('idle');
      }
    } catch (e) {
      if (alive.current) setDetailStatus(['not_found', 'not_approved'].includes(codeOf(e)) ? 'gone' : 'error');
    }
  }, [repository, user, applicationId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    setDetail(null);
    if (!applicationId) return setDetailStatus('idle');
    setDetailStatus('loading');
    void loadDetail();
  }, [applicationId, loadDetail]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (board?.rows ?? []).filter((r) => (role === 'all' || r.role === role) && (filter === 'all' || (filter === 'failed' ? r.failed + r.lapsed > 0 : r.gate === filter)) && (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)));
  }, [board, query, role, filter]);

  const act = useCallback(
    async <R,>(fn: (userId: string) => Promise<R>, done?: string, apply?: (r: R) => void): Promise<{ ok: true; value: R } | { ok: false; code: string }> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        const value = await fn(user.id);
        if (alive.current && apply) apply(value);
        if (done) push(done, 'success');
        void load();
        return { ok: true, value };
      } catch (e) {
        void loadDetail();
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [user, load, loadDetail, push],
  );
  const asDetail = (d: VerificationDetailView) => {
    setDetail(d);
    setDetailStatus('idle');
  };
  const id = applicationId ?? '';

  return {
    status,
    board,
    shown,
    limit,
    more: () => setLimit((n) => n + PAGE),
    query,
    setQuery: (q: string) => {
      setQuery(q);
      setLimit(PAGE);
    },
    role,
    setRole: (r: RoleFilter) => {
      setRole(r);
      setLimit(PAGE);
    },
    filter,
    setFilter: (f: StatusFilter) => {
      setFilter(f);
      setLimit(PAGE);
    },
    applicationId,
    detail,
    detailStatus,
    busy,
    reload: () => {
      setStatus('loading');
      void load();
    },
    reloadDetail: loadDetail,
    open: (appId: string) => navigate(detailPath(appId)),
    close: () => navigate(boardPath),
    goto: (path: string) => navigate(path),
    runCheck: async (itemKey: string): Promise<ActionResult> => {
      const r = await act((u) => repository.runVerificationCheck(id, itemKey, u), undefined, asDetail);
      if (!r.ok) return r;
      const ev = [...r.value.events].reverse().find((e) => e.kind === 'service_check' && e.item === itemKey);
      const result = ev?.note?.startsWith('inconclusive') ? 'inconclusive' : ev?.note === 'passed' ? 'passed' : ev?.note === 'failed' ? 'failed' : 'inconclusive';
      push(t(result === 'inconclusive' ? K.check.inconclusive : result === 'passed' ? K.check.passed : K.check.failed), result === 'passed' ? 'success' : result === 'failed' ? 'warning' : 'accent');
      return { ok: true };
    },
    record: (itemKey: string, input: { result: 'passed' | 'failed'; how: VerificationHow | undefined; note: string; redFlag?: boolean }): Promise<ActionResult> => act((u) => repository.recordVerification(id, itemKey, input, u), t(K.manual.done), asDetail),
    allow: (itemKey: string, input: { reason: string; dueDate: string }): Promise<ActionResult> => act((u) => repository.grantConditionalVerification(id, itemKey, input, u), t(K.conditional.done), asDetail),
    setService: async (next: 'up' | 'down'): Promise<ActionResult> => {
      const r = await act((u) => repository.setVerificationService(next, u), t(K.service.changed));
      return r.ok ? { ok: true } : r;
    },
  };
}
