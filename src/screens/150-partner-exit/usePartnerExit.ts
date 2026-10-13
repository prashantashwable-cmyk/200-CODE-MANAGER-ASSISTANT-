import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { ExitBoardView, PartnerExitView } from '@/data/repository';
import type { ExitActionKind, ExitItemType, ExitKind } from '@/data/types';
import { EXIT_KEYS as K, POLL_MS, directoryPath, exitPath } from './partner-exit.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type PartnerExitState = ReturnType<typeof usePartnerExit>;

/**
 * Screen 150. One partner leaving, start to finish: why, the work in their hands, what they are owed, the end of their access, and an exit
 * conversation. Nothing here is a second copy of anything: the work is read from the leads, jobs and orders themselves, the money from the
 * commission ledger or the supplier payment records, and the repository refuses to end access before the rest is handled (except for a removal
 * for a serious violation, where access ends first).
 */
export function usePartnerExit() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const { partnerId } = useParams();
  const [board, setBoard] = useState<ExitBoardView | null>(null);
  const [view, setView] = useState<PartnerExitView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'not_found'>('loading');
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
      if (partnerId) setView(await repository.getPartnerExit(partnerId, user.id));
      else setBoard(await repository.getExitBoard(user.id));
      if (alive.current) setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (alive.current) setStatus((s) => (c === 'not_found' ? 'not_found' : s === 'ready' ? s : 'error'));
    }
  }, [repository, user, partnerId]);

  useEffect(() => {
    setView(null);
    setStatus('loading');
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const act = async (fn: () => Promise<PartnerExitView>, toast?: string): Promise<ActionResult> => {
    setBusy(true);
    try {
      setView(await fn());
      if (toast) push(t(toast), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const who = user?.id ?? '';
  const id = partnerId ?? '';

  return {
    status,
    board,
    view,
    busy,
    userId: who,
    partnerId: partnerId ?? null,
    reload: () => {
      setStatus('loading');
      void load();
    },
    goto: (path: string) => navigate(path),
    back: () => navigate('/partner-exit'),
    toDirectory: () => navigate(directoryPath),
    open: (pid: string) => navigate(exitPath(pid)),
    start: (input: { kind: ExitKind; reason: string; note: string; lastDay: string }) => act(() => repository.startPartnerExit(id, input, who), K.start.started),
    resolve: (input: { type: ExitItemType; itemIds: string[]; action: ExitActionKind; toId?: string; note: string }) => act(() => repository.resolveExitItems(id, input, who), K.work.applied),
    confirmSettlement: (input: { withholdReason?: string; releaseNote?: string }) => act(() => repository.confirmExitSettlement(id, input, who), K.settle.confirmed),
    agree: (input: { how: 'call' | 'message' | 'in_person'; note: string }) => act(() => repository.recordExitAgreement(id, input, who), K.settle.agreed),
    dispute: (input: { claimedAmount: number; grounds: string }) => act(() => repository.raiseExitSettlementDispute(id, input, who), K.settle.recorded),
    decide: (input: { outcome: 'uphold' | 'partner_favor' | 'partial'; amount?: number; note: string }) => act(() => repository.decideExitSettlementDispute(id, input, who), K.settle.decisionRecorded),
    pay: (reference: string) => act(() => repository.recordExitPayment(id, { reference }, who), K.settle.paid),
    endAccess: () => act(() => repository.endPartnerAccess(id, who), K.access.ended),
    interview: (input: { how: 'call' | 'in_person' | 'form' | 'declined'; reasons: string[]; wouldReturn: 'yes' | 'maybe' | 'no' | null; notes: string }) => act(() => repository.recordExitInterview(id, input, who), K.interview.saved),
    cancel: (reason: string) => act(() => repository.cancelPartnerExit(id, reason, who), K.cancel.done),
  };
}
