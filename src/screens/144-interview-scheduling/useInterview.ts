import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { applyLanguage } from '@/i18n';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { InterviewApplicantView, InterviewBoardView, InterviewDetailView, InterviewSaveResult } from '@/data/repository';
import type { InterviewAvailability, InterviewMode } from '@/data/types';
import type { CompleteInput } from '@/features/recruitment/interview';
import { INTERVIEW_KEYS as K, POLL_MS, boardPath, detailPath, keyKey } from './interview.types';
import type { InterviewStatus } from './interview.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

export type InterviewState = ReturnType<typeof useInterview>;

/**
 * Screen 144. Admin sets the windows they can talk in; the applicant picks a time from what is left, so nobody trades messages. Admin sees the
 * interviews on a calendar, holds them, and records how each went: ratings, a note, any concern in words, an outcome. That record is what the
 * offer decision reads. The applicant's side is the same screen on their own link: no account, only their application's key.
 */
export function useInterview() {
  const repository = useData();
  const { user } = useSession();
  const { applicationId } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const admin = pathname.startsWith('/interviews');
  const key = useMemo(() => {
    if (admin || !applicationId) return '';
    const fromLink = new URLSearchParams(search).get('k');
    if (fromLink) {
      try {
        localStorage.setItem(keyKey(applicationId), fromLink);
      } catch {
        // The link still carries it.
      }
      return fromLink;
    }
    try {
      return localStorage.getItem(keyKey(applicationId)) ?? '';
    } catch {
      return '';
    }
  }, [admin, applicationId, search]);

  const [board, setBoard] = useState<InterviewBoardView | null>(null);
  const [detail, setDetail] = useState<InterviewDetailView | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'error' | 'gone'>('idle');
  const [mine, setMine] = useState<InterviewApplicantView | null>(null);
  const [status, setStatus] = useState<InterviewStatus>('loading');
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      if (admin) {
        if (!user) return;
        const b = await repository.getInterviewBoard(user.id);
        if (alive.current) setBoard(b);
      } else {
        if (!applicationId || !key) return alive.current && setStatus('invalid');
        const v = await repository.getInterviewForApplicant(applicationId, key);
        if (alive.current) setMine(v);
      }
      if (alive.current) setStatus('ready');
    } catch (e) {
      if (!alive.current) return;
      const c = codeOf(e);
      if (c === 'invalid_link') setStatus('invalid');
      else if (c === 'not_found' || c === 'forbidden' || c === 'not_approved') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, admin, applicationId, key]);

  useEffect(() => {
    setStatus('loading');
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const loadDetail = useCallback(async () => {
    if (!admin || !user || !applicationId) return;
    try {
      const d = await repository.getInterviewDetail(applicationId, user.id);
      if (alive.current) {
        setDetail(d);
        setDetailStatus('idle');
      }
    } catch (e) {
      if (alive.current) setDetailStatus(codeOf(e) === 'not_found' ? 'gone' : 'error');
    }
  }, [repository, user, admin, applicationId]);

  useEffect(() => {
    setDetail(null);
    if (!admin || !applicationId) {
      setDetailStatus('idle');
      return;
    }
    setDetailStatus('loading');
    void loadDetail();
  }, [admin, applicationId, loadDetail]);

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
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [user, load, push],
  );
  const asDetail = (d: InterviewDetailView) => {
    setDetail(d);
    setDetailStatus('idle');
  };
  const name = detail?.applicant.name ?? '';
  const id = applicationId ?? '';

  return {
    admin,
    status,
    board,
    detail,
    detailStatus,
    mine,
    busy,
    applicationId,
    reload: () => {
      setStatus('loading');
      void load();
    },
    goto: (path: string) => navigate(path),
    open: (appId: string) => navigate(detailPath(appId)),
    close: () => navigate(boardPath),
    setLanguage: applyLanguage,
    invite: (input: { modes: InterviewMode[]; details: { videoLink?: string; place?: string }; note?: string }): Promise<ActionResult> => act((u) => repository.inviteToInterview(id, input, u), t(K.invite.done, { name }), asDetail),
    skip: (reason: string): Promise<ActionResult> => act((u) => repository.skipInterview(id, reason, u), t(K.skipSheet.done, { name }), asDetail),
    book: (input: { start: string; mode: InterviewMode; details?: { videoLink?: string; place?: string }; reason?: string }): Promise<ActionResult> => act((u) => repository.scheduleInterview(id, input, u), t(K.book.done, { name }), asDetail),
    askMove: (reason: string): Promise<ActionResult> => act((u) => repository.requestInterviewMove(id, reason, u), t(K.move.done, { name }), asDetail),
    cancel: (reason: string): Promise<ActionResult> => act((u) => repository.cancelInterview(id, reason, u), t(K.cancelSheet.done, { name }), asDetail),
    notJoined: (): Promise<ActionResult> => act((u) => repository.markInterviewMissed(id, u), t(K.missed.done, { name }), asDetail),
    complete: (input: CompleteInput): Promise<ActionResult> => act((u) => repository.completeInterview(id, input, u), t(K.complete.done, { name }), asDetail),
    addAddendum: (input: Parameters<typeof repository.addInterviewAddendum>[1]): Promise<ActionResult> => act((u) => repository.addInterviewAddendum(id, input, u), t(K.addendum.done), asDetail),
    saveAvailability: (a: InterviewAvailability): Promise<{ ok: true; result: InterviewSaveResult } | { ok: false; code: string }> => {
      const { updatedAt: _u, updatedByName: _n, ...rest } = a;
      void _u;
      void _n;
      return act((uid) => repository.saveInterviewAvailability(rest, uid), t(K.avail.saved)).then((r) => (r.ok ? { ok: true as const, result: r.value } : r));
    },
    /** Asks each person whose confirmed time no longer fits to choose another. Nothing is cancelled. */
    askConflicted: async (ids: string[]): Promise<ActionResult> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        for (const x of ids) await repository.requestInterviewMove(x, 'availability', user.id);
        push(t(K.avail.askedAll, { count: ids.length }), 'success');
        await load();
        await loadDetail();
        return { ok: true };
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    keepConflicted: async (ids: string[]): Promise<ActionResult> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        for (const x of ids) await repository.confirmInterviewSlot(x, user.id);
        push(t(K.avail.keptAll, { count: ids.length }), 'success');
        await load();
        return { ok: true };
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    choose: async (start: string, mode: InterviewMode): Promise<ActionResult> => {
      if (!applicationId) return { ok: false, code: 'generic' };
      if (!navigator.onLine) return { ok: false, code: 'offline' };
      setBusy(true);
      try {
        const v = await repository.chooseInterviewSlot(applicationId, key, { start, mode });
        setMine(v);
        return { ok: true };
      } catch (e) {
        // A time somebody else just took: show what is open now, never a dead end.
        void load();
        return { ok: false, code: codeOf(e) };
      } finally {
        setBusy(false);
      }
    },
    refresh: () => void load(),
    reloadDetail: loadDetail,
  };
}
