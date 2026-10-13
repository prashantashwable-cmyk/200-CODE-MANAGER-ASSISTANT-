import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { CompletionBoardView, CompletionView } from '@/data/repository';
import type { JudgementDecision } from '@/features/commission/finalPayout';
import type { CompletionStatus } from './completion.types';
import { COMPLETION_KEYS as K, POLL_MS, judgementDraftKey } from './completion.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface JudgeDraft {
  decision: JudgementDecision | '';
  issue: string;
  reason: string;
  ids: string[];
  amounts: Record<string, string>;
}
const EMPTY: JudgeDraft = { decision: '', issue: '', reason: '', ids: [], amounts: {} };
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

function readDraft(key: string): JudgeDraft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<JudgeDraft>) } : null;
  } catch {
    return null;
  }
}

export type CompletionState = ReturnType<typeof useCompletion>;

/**
 * Screen 140. The project's closing record: a clean summary for the customer that stays available for good, and for Admin the one action that
 * closes the project: it issues the certificate, sets the job completed and triggers every final payout. A late-discovered defect is answered
 * by Admin's documented judgement here, never by an automatic clawback.
 */
export function useCompletion() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<CompletionView | null>(null);
  const [board, setBoard] = useState<CompletionBoardView | null>(null);
  const [status, setStatus] = useState<CompletionStatus>('loading');
  const [busy, setBusy] = useState(false);
  const dKey = user && jobId ? judgementDraftKey(user.id, jobId) : '';
  const [draft, setDraftState] = useState<JudgeDraft>(() => (dKey ? (readDraft(dKey) ?? EMPTY) : EMPTY));
  const [restored, setRestored] = useState<boolean>(() => !!(dKey && readDraft(dKey)));

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (jobId) setView(await repository.getCompletion(jobId, user.id));
      else setBoard(await repository.getCompletionBoard(user.id));
      setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (c === 'not_found' || c === 'forbidden') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  useEffect(() => {
    setView(null);
    setBoard(null);
    setStatus('loading');
    const kept = dKey ? readDraft(dKey) : null;
    setDraftState(kept ?? EMPTY);
    setRestored(!!kept);
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, dKey]);

  useEffect(() => {
    if (!dKey) return;
    try {
      if (JSON.stringify(draft) === JSON.stringify(EMPTY)) localStorage.removeItem(dKey);
      else localStorage.setItem(dKey, JSON.stringify(draft));
    } catch {
      // Not kept.
    }
  }, [dKey, draft]);

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
    board,
    busy,
    reload: () => {
      setStatus('loading');
      void load();
    },
    draft,
    restored,
    setDraft: (patch: Partial<JudgeDraft>) => {
      setRestored(false);
      setDraftState((d) => ({ ...d, ...patch }));
    },
    issue: (waiveSignoffReason?: string) => guard(() => repository.issueCompletionCertificate(id, waiveSignoffReason?.trim() ? { waiveSignoffReason } : {}, uid), K.issue.toast),
    judge: () =>
      guard(async () => {
        await repository.recordPayoutJudgement(
          id,
          {
            decision: draft.decision as JudgementDecision,
            issue: draft.issue,
            reason: draft.reason,
            ...(draft.decision !== 'no_change' ? { commissionIds: draft.ids } : {}),
            ...(draft.decision === 'adjust' ? { amounts: Object.fromEntries(draft.ids.map((x) => [x, Number(draft.amounts[x])])) } : {}),
          },
          uid,
        );
        setDraftState(EMPTY);
      }, K.judge.saved),
    goto: (path: string, replace = false) => navigate(path, { replace }),
  };
}
