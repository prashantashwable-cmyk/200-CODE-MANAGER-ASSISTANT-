import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { HandoverChecklistView } from '@/data/repository';
import type { HandoverDocKind } from '@/features/qc/handover';
import type { HandoverStatus } from './handover.types';
import { HANDOVER_KEYS as K, POLL_MS } from './handover.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

export type HandoverState = ReturnType<typeof useHandover>;

/**
 * Screen 137. The final completeness gate before handover: it reads what the earlier screens already keep (both quality checks, the snag list,
 * the compliance certificate) and adds the one thing only this moment can confirm, the customer's documentation package. Ready for Handover
 * is the single event that moves the job to handover and unlocks the customer walkthrough.
 */
export function useHandover() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<HandoverChecklistView | null>(null);
  const [status, setStatus] = useState<HandoverStatus>(jobId ? 'loading' : 'ready');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user || !jobId) return;
    try {
      setView(await repository.getHandoverChecklist(jobId, user.id));
      setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (c === 'not_found' || c === 'forbidden') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  useEffect(() => {
    setView(null);
    if (jobId) setStatus('loading');
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, jobId]);

  const guard = async (fn: () => Promise<unknown>, okKey?: string): Promise<ActionResult> => {
    if (!navigator.onLine) return { ok: false, code: 'offline' };
    setBusy(true);
    try {
      await fn();
      await load();
      if (okKey) push(t(okKey), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      setBusy(false);
    }
  };
  const uid = user?.id ?? '';
  const id = jobId ?? '';

  return {
    status,
    jobId: jobId ?? null,
    view,
    busy,
    reload: () => {
      setStatus('loading');
      void load();
    },
    confirmDoc: (kind: HandoverDocKind) => guard(() => repository.confirmHandoverDocument(id, kind, uid), K.docs.confirmToast),
    flagIssue: (kind: HandoverDocKind, text: string) => guard(() => repository.flagHandoverDocIssue(id, kind, text, uid), K.docs.reportToast),
    resolveIssue: (issueId: string, text: string) => guard(() => repository.resolveHandoverDocIssue(id, issueId, text, uid), K.docs.resolveToast),
    correctDoc: (kind: HandoverDocKind, note: string) => guard(() => repository.correctHandoverDocument(id, kind, note, uid), K.docs.typoToast),
    requestReview: (reason: string) => guard(() => repository.requestHandoverAdminReview(id, reason, uid), K.review.toast),
    completeReview: (note: string) => guard(() => repository.completeHandoverAdminReview(id, note, uid), K.step.review.toast),
    confirm: () => guard(() => repository.confirmReadyForHandover(id, uid), K.confirm.toast),
    goto: (path: string) => navigate(path),
  };
}
