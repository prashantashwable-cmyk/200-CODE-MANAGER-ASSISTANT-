import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DealTermsView } from '@/data/repository';
import type { PaymentStage } from '@/data/types';
import { ALL_PAYMENT_STAGES, DEFAULT_PAYMENT_STAGE_PLAN } from './deal-terms-finalization.types';
import type { DealTermsFinalizationStatus } from './deal-terms-finalization.types';

interface Draft {
  paymentStagePlan: { stage: PaymentStage; percentage: number }[];
  specialTermsNotes: string;
}

interface DealTermsFinalizationState {
  status: DealTermsFinalizationStatus;
  view: DealTermsView | null;
  draft: Draft;
  isEditable: boolean;
  corePct: number;
  setStagePercentage: (stage: PaymentStage, pct: number) => void;
  setSpecialTermsNotes: (v: string) => void;

  saving: boolean;
  save: () => Promise<boolean>;

  confirming: boolean;
  confirmInternal: () => Promise<boolean>;
  confirmCustomer: () => Promise<boolean>;

  amendSheetOpen: boolean;
  openAmendSheet: () => void;
  closeAmendSheet: () => void;
  amendNote: string;
  setAmendNote: (v: string) => void;
  amending: boolean;
  submitAmend: () => Promise<boolean>;

  reload: () => Promise<void>;
}

function toDraft(view: DealTermsView): Draft {
  if (view.terms) {
    // Fill in any stage the saved plan left out (e.g. an older draft saved
    // before retention was added) at 0%, so every stage always has a row.
    const byStage = new Map(view.terms.paymentStagePlan.map((s) => [s.stage, s.percentage]));
    return {
      paymentStagePlan: ALL_PAYMENT_STAGES.map((stage) => ({ stage, percentage: byStage.get(stage) ?? 0 })),
      specialTermsNotes: view.terms.specialTermsNotes,
    };
  }
  return { paymentStagePlan: DEFAULT_PAYMENT_STAGE_PLAN.map((s) => ({ ...s })), specialTermsNotes: '' };
}

/**
 * Owns the single choke point between an active negotiation and a binding
 * deal. Editing the payment plan or special terms is only ever allowed
 * while nothing has been confirmed yet — once internal confirmation has
 * happened, the repository itself refuses further plain edits, so a
 * correction after both parties have confirmed always goes through
 * `amendDealTerms`'s logged path instead of a silent patch.
 */
export function useDealTermsFinalization(): DealTermsFinalizationState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<DealTermsFinalizationStatus>('loading');
  const [view, setView] = useState<DealTermsView | null>(null);
  const [draft, setDraft] = useState<Draft>({ paymentStagePlan: DEFAULT_PAYMENT_STAGE_PLAN.map((s) => ({ ...s })), specialTermsNotes: '' });
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [amendSheetOpen, setAmendSheetOpen] = useState(false);
  const [amendNote, setAmendNote] = useState('');
  const [amending, setAmending] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) {
      setStatus('error');
      return;
    }
    try {
      const result = await repository.getDealTerms(dealId);
      if (!result) {
        setStatus('error');
        return;
      }
      setView(result);
      setDraft(toDraft(result));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isEditable = !view?.terms || view.terms.status === 'draft';
  const corePct = draft.paymentStagePlan.filter((s) => s.stage !== 'retention').reduce((sum, s) => sum + s.percentage, 0);

  const setStagePercentage = useCallback((stage: PaymentStage, pct: number) => {
    setDraft((d) => ({ ...d, paymentStagePlan: d.paymentStagePlan.map((s) => (s.stage === stage ? { ...s, percentage: pct } : s)) }));
  }, []);

  const setSpecialTermsNotes = useCallback((specialTermsNotes: string) => setDraft((d) => ({ ...d, specialTermsNotes })), []);

  const save = useCallback(async () => {
    if (!dealId || !isEditable) return false;
    setSaving(true);
    try {
      await repository.saveDealTermsDraft(dealId, draft);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, dealId, isEditable, draft, load]);

  const confirmInternal = useCallback(async () => {
    if (!dealId || !user || Math.abs(corePct - 100) > 0.01) return false;
    setConfirming(true);
    try {
      await repository.saveDealTermsDraft(dealId, draft);
      await repository.confirmDealTermsInternal(dealId, user.id);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setConfirming(false);
    }
  }, [repository, dealId, user, corePct, draft, load]);

  const confirmCustomer = useCallback(async () => {
    if (!dealId) return false;
    setConfirming(true);
    try {
      await repository.confirmDealTermsCustomer(dealId);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setConfirming(false);
    }
  }, [repository, dealId, load]);

  const openAmendSheet = useCallback(() => {
    setAmendNote('');
    setAmendSheetOpen(true);
  }, []);
  const closeAmendSheet = useCallback(() => setAmendSheetOpen(false), []);

  const submitAmend = useCallback(async () => {
    if (!dealId || !user || !amendNote.trim()) return false;
    setAmending(true);
    try {
      await repository.amendDealTerms(dealId, amendNote.trim(), user.id);
      await load();
      setAmendSheetOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setAmending(false);
    }
  }, [repository, dealId, user, amendNote, load]);

  return {
    status,
    view,
    draft,
    isEditable,
    corePct,
    setStagePercentage,
    setSpecialTermsNotes,
    saving,
    save,
    confirming,
    confirmInternal,
    confirmCustomer,
    amendSheetOpen,
    openAmendSheet,
    closeAmendSheet,
    amendNote,
    setAmendNote,
    amending,
    submitAmend,
    reload: load,
  };
}
