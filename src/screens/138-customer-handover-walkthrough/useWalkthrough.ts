import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { WalkthroughArrangeInput, WalkthroughBoardView, WalkthroughView } from '@/data/repository';
import type { StepId, WalkthroughStatus } from './walkthrough.types';
import { POLL_MS, STEPS, WALK_KEYS as K, draftKey } from './walkthrough.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface Draft {
  mode: string;
  date: string;
  window: 'morning' | 'afternoon';
  conductorId: string;
  repName: string;
  repPhone: string;
  repRelation: string;
  note: string;
  comment: string;
  question: string;
}
const EMPTY: Draft = { mode: '', date: '', window: 'morning', conductorId: '', repName: '', repPhone: '', repRelation: '', note: '', comment: '', question: '' };
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : null;
  } catch {
    return null;
  }
}

export type WalkState = ReturnType<typeof useWalkthrough>;

/**
 * Screen 138. The human moment of the job: someone walks the customer through their lift, hands over the documents, and the customer confirms
 * for themselves that they understand the basics. Reachable only once Ready for Handover (137) has been said. The customer's sign-off is a
 * separate, later event from every technical gate; feedback, the AMC offer and any follow-up questions belong to the same moment.
 */
export function useWalkthrough() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<WalkthroughView | null>(null);
  const [board, setBoard] = useState<WalkthroughBoardView | null>(null);
  const [status, setStatus] = useState<WalkthroughStatus>('loading');
  const [busy, setBusy] = useState(false);
  const dKey = user && jobId ? draftKey(user.id, jobId) : '';
  const [draft, setDraftState] = useState<Draft>(() => (dKey ? (readDraft(dKey) ?? EMPTY) : EMPTY));
  const [restored, setRestored] = useState<boolean>(() => !!(dKey && readDraft(dKey)));

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (jobId) setView(await repository.getWalkthrough(jobId, user.id));
      else setBoard(await repository.getWalkthroughBoard(user.id));
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
    setDraftState(dKey ? (readDraft(dKey) ?? EMPTY) : EMPTY);
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
  const stepParam = params.get('step') as StepId | null;

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
    stepParam: stepParam && (STEPS as readonly string[]).includes(stepParam) ? stepParam : null,
    setStep: (s: StepId) => setParams({ step: s }, { replace: true }),
    draft,
    restored,
    setDraft: (patch: Partial<Draft>) => {
      setRestored(false);
      setDraftState((d) => ({ ...d, ...patch }));
    },
    clearDraft: (keys: (keyof Draft)[]) => setDraftState((d) => ({ ...d, ...Object.fromEntries(keys.map((k) => [k, EMPTY[k]])) })),
    arrange: (input: WalkthroughArrangeInput) => guard(() => repository.arrangeWalkthrough(id, input, uid), K.arrange.saved),
    tick: (itemId: string, done: boolean) => guard(() => repository.tickWalkthroughItem(id, itemId, done, uid)),
    provide: (kind: Parameters<typeof repository.provideWalkthroughDocument>[1], how: 'printed' | 'digital') => guard(() => repository.provideWalkthroughDocument(id, kind, how, uid)),
    conduct: () => guard(() => repository.completeWalkthrough(id, uid), K.sign.conductToast),
    signOff: (input: { understood: boolean; note?: string; signerName?: string; signature?: string }) => guard(() => repository.signOffWalkthrough(id, input, uid), K.sign.toast),
    amc: (input: Parameters<typeof repository.recordWalkthroughAmc>[1]) => guard(() => repository.recordWalkthroughAmc(id, input, uid), K.amc.toast),
    feedback: (input: { score: number; comment?: string }) => guard(() => repository.submitWalkthroughFeedback(id, input, uid), K.feedback.toast),
    ask: (text: string) => guard(() => repository.addWalkthroughQuestion(id, text, uid), K.ask.toast),
    answer: (questionId: string, text: string) => guard(() => repository.answerWalkthroughQuestion(id, questionId, text, uid), K.ask.answerToast),
    goto: (path: string, replace = false) => navigate(path, { replace }),
  };
}
