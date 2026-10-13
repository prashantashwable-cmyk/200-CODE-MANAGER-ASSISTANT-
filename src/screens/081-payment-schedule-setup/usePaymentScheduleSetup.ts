import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PaymentScheduleStage, PaymentScheduleType, PaymentStage } from '@/data/types';
import type { PaymentScheduleView } from '@/data/repository';
import type { DraftStage } from './payment-schedule-setup.types';
import { STAGE_DEFAULT_MILESTONE, STAGE_DEFAULT_TRIGGER, STAGE_PRESET_LABELS } from './payment-schedule-setup.types';
import type { PaymentScheduleSetupStatus } from './payment-schedule-setup.types';

const AUTOSAVE_DELAY_MS = 900;
let draftKeyCounter = 0;
const nextDraftKey = () => `draft-${(draftKeyCounter += 1)}`;

function draftFromStage(stage: PaymentScheduleStage): DraftStage {
  return {
    key: stage.id,
    stage: stage.stage,
    label: stage.label,
    amount: stage.amount,
    dueTrigger: stage.dueTrigger,
    fixedDueDate: stage.fixedDueDate ?? '',
    triggerMilestone: stage.triggerMilestone ?? '',
  };
}

function draftFromPlan(stage: PaymentStage, percentage: number, dealValue: number): DraftStage {
  return {
    key: nextDraftKey(),
    stage,
    label: STAGE_PRESET_LABELS[stage],
    amount: Math.round((dealValue * percentage) / 100),
    dueTrigger: STAGE_DEFAULT_TRIGGER[stage],
    fixedDueDate: '',
    triggerMilestone: STAGE_DEFAULT_MILESTONE[stage] ?? '',
  };
}

interface PaymentScheduleSetupState {
  status: PaymentScheduleSetupStatus;
  view: PaymentScheduleView | null;
  draftStages: DraftStage[];
  scheduleType: PaymentScheduleType;
  setScheduleType: (t: PaymentScheduleType) => void;
  customNote: string;
  setCustomNote: (v: string) => void;
  reconciledAmount: number;
  reconciles: boolean;
  updateStage: (key: string, patch: Partial<DraftStage>) => void;
  addStage: () => void;
  removeStage: (key: string) => void;
  moveStage: (key: string, direction: -1 | 1) => void;
  saving: boolean;
  activating: boolean;
  activate: () => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the draft schedule for one deal. Auto-saves (debounced) on every
 * edit — the layout guidance's own rule for any form with more than a
 * handful of fields — so a partial edit is never lost to a closed tab.
 * Activation is a separate, deliberate action that also re-validates
 * reconciliation server-side, since the client-side check here is a
 * convenience, not the enforcement point.
 */
export function usePaymentScheduleSetup(): PaymentScheduleSetupState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<PaymentScheduleSetupStatus>('loading');
  const [view, setView] = useState<PaymentScheduleView | null>(null);

  const [draftStages, setDraftStages] = useState<DraftStage[]>([]);
  const [scheduleType, setScheduleType] = useState<PaymentScheduleType>('standard');
  const [customNote, setCustomNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const hydrated = useRef(false);
  /** Hydrating the draft from the server sets `draftStages` too, which would
   *  otherwise trip the autosave effect below and silently deactivate an
   *  already-activated schedule on a plain page view with no real edit. */
  const skipNextAutosave = useRef(false);

  const load = useCallback(async () => {
    if (!dealId) {
      setStatus('error');
      return;
    }
    try {
      const result = await repository.getPaymentSchedule(dealId);
      if (!result) {
        setStatus('error');
        return;
      }
      setView(result);
      if (!hydrated.current) {
        skipNextAutosave.current = true;
        if (result.schedule) {
          setDraftStages(result.schedule.stages.map(draftFromStage));
          setScheduleType(result.schedule.scheduleType);
          setCustomNote(result.schedule.customNote ?? '');
        } else if (result.dealTerms) {
          setDraftStages(result.dealTerms.paymentStagePlan.map((p) => draftFromPlan(p.stage, p.percentage, result.dealValue)));
        }
        hydrated.current = true;
      }
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, dealId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  const reconciledAmount = useMemo(() => draftStages.reduce((sum, s) => sum + (Number.isFinite(s.amount) ? s.amount : 0), 0), [draftStages]);
  const reconciles = view !== null && reconciledAmount === view.expectedTotal;

  const persist = useCallback(async () => {
    if (!dealId || !user || draftStages.length === 0) return;
    setSaving(true);
    try {
      await repository.savePaymentSchedule(
        dealId,
        {
          scheduleType,
          customNote: scheduleType === 'bank_guarantee' ? customNote.trim() || undefined : undefined,
          stages: draftStages.map((d, i) => ({
            stage: d.stage,
            label: d.label,
            amount: d.amount,
            sequenceOrder: i + 1,
            dueTrigger: d.dueTrigger,
            fixedDueDate: d.dueTrigger === 'fixed_date' ? d.fixedDueDate || undefined : undefined,
            triggerMilestone: d.dueTrigger === 'milestone' ? d.triggerMilestone || undefined : undefined,
          })),
        },
        user.name,
      );
      await load();
    } finally {
      setSaving(false);
    }
  }, [repository, dealId, user, draftStages, scheduleType, customNote, load]);

  const autosaveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!hydrated.current || status !== 'ready') return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => void persist(), AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStages, scheduleType, customNote]);

  const updateStage = useCallback((key: string, patch: Partial<DraftStage>) => {
    setDraftStages((cur) => cur.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }, []);

  const addStage = useCallback(() => {
    setDraftStages((cur) => [
      ...cur,
      { key: nextDraftKey(), stage: 'material', label: 'Additional Stage', amount: 0, dueTrigger: 'fixed_date', fixedDueDate: '', triggerMilestone: '' },
    ]);
  }, []);

  const removeStage = useCallback((key: string) => {
    setDraftStages((cur) => (cur.length > 1 ? cur.filter((s) => s.key !== key) : cur));
  }, []);

  const moveStage = useCallback((key: string, direction: -1 | 1) => {
    setDraftStages((cur) => {
      const index = cur.findIndex((s) => s.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= cur.length) return cur;
      const next = [...cur];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const activate = useCallback(async () => {
    if (!dealId || !user) return false;
    setActivating(true);
    try {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
      await persist();
      await repository.activatePaymentSchedule(dealId, user.name);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setActivating(false);
    }
  }, [repository, dealId, user, persist, load]);

  return {
    status,
    view,
    draftStages,
    scheduleType,
    setScheduleType,
    customNote,
    setCustomNote,
    reconciledAmount,
    reconciles,
    updateStage,
    addStage,
    removeStage,
    moveStage,
    saving,
    activating,
    activate,
    reload: load,
  };
}
