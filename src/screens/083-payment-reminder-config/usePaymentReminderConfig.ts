import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CommChannel, ReminderEscalationTier } from '@/data/types';
import type { PaymentCollectionLine, PaymentReminderPauseView, ReminderRunResult, ReminderTimelineEntry } from '@/data/repository';
import { isOutstanding } from '@/features/payments/aging';
import type { DraftReminderStep } from './payment-reminder-config.types';
import type { PaymentReminderConfigStatus } from './payment-reminder-config.types';

let draftKeyCounter = 0;
const nextDraftKey = () => `rstep-draft-${(draftKeyCounter += 1)}`;

const DEFAULT_TEMPLATE_FOR_TIER: Record<ReminderEscalationTier, string> = {
  friendly: 'tpl-payment-reminder',
  firm: 'tpl-payment-reminder-firm',
  call_task: '',
};
const DEFAULT_CHANNEL_FOR_TIER: Record<ReminderEscalationTier, Exclude<CommChannel, 'in_app'>> = {
  friendly: 'sms',
  firm: 'whatsapp',
  call_task: 'call',
};

interface PaymentReminderConfigState {
  status: PaymentReminderConfigStatus;
  draftSteps: DraftReminderStep[];
  updateStep: (key: string, patch: Partial<DraftReminderStep>) => void;
  addStep: () => void;
  removeStep: (key: string) => void;
  sendWindowStart: number;
  setSendWindowStart: (h: number) => void;
  sendWindowEnd: number;
  setSendWindowEnd: (h: number) => void;
  dirty: boolean;
  saving: boolean;
  save: () => Promise<boolean>;

  samplePayments: PaymentCollectionLine[];
  sampleId: string | null;
  setSampleId: (id: string | null) => void;
  timeline: ReminderTimelineEntry[];

  pauses: PaymentReminderPauseView[];
  dealsForPause: PaymentCollectionLine[];
  pauseSheetOpen: boolean;
  openPauseSheet: () => void;
  closePauseSheet: () => void;
  pauseDealId: string;
  setPauseDealId: (id: string) => void;
  pauseReason: string;
  setPauseReason: (v: string) => void;
  submittingPause: boolean;
  submitPause: () => Promise<boolean>;
  resumeDeal: (dealId: string) => Promise<boolean>;

  runningNow: boolean;
  runResult: ReminderRunResult | null;
  runNow: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns the one governed reminder cadence plus the per-deal pause list.
 * The cadence itself is a deliberate, explicit save (not per-keystroke
 * autosave) since a half-typed step shouldn't silently become the live
 * rule everything else reads.
 */
export function usePaymentReminderConfig(): PaymentReminderConfigState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<PaymentReminderConfigStatus>('loading');

  const [draftSteps, setDraftSteps] = useState<DraftReminderStep[]>([]);
  const [sendWindowStart, setSendWindowStart] = useState(9);
  const [sendWindowEnd, setSendWindowEnd] = useState(19);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [samplePayments, setSamplePayments] = useState<PaymentCollectionLine[]>([]);
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ReminderTimelineEntry[]>([]);

  const [pauses, setPauses] = useState<PaymentReminderPauseView[]>([]);
  const [pauseSheetOpen, setPauseSheetOpen] = useState(false);
  const [pauseDealId, setPauseDealId] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [submittingPause, setSubmittingPause] = useState(false);

  const [runningNow, setRunningNow] = useState(false);
  const [runResult, setRunResult] = useState<ReminderRunResult | null>(null);

  const markDirty = useCallback((mutator: () => void) => {
    mutator();
    setDirty(true);
  }, []);

  const load = useCallback(async () => {
    try {
      const [config, lines, pauseList] = await Promise.all([repository.getPaymentReminderConfig(), repository.getPaymentCollectionLines(), repository.listPaymentReminderPauses()]);
      setDraftSteps(
        [...config.steps]
          .sort((a, b) => a.daysOffset - b.daysOffset)
          .map((s) => ({ key: s.id, daysOffset: s.daysOffset, escalationTier: s.escalationTier, channel: s.channel as 'sms' | 'whatsapp' | 'call', templateGroupId: s.templateGroupId ?? '' })),
      );
      setSendWindowStart(config.sendWindowStartHour);
      setSendWindowEnd(config.sendWindowEndHour);
      setDirty(false);
      const outstanding = lines.filter((l) => isOutstanding(l.payment));
      setSamplePayments(outstanding);
      setSampleId((cur) => cur ?? outstanding[0]?.payment.id ?? null);
      setPauses(pauseList);
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!sampleId) {
      setTimeline([]);
      return;
    }
    let cancelled = false;
    void repository.previewReminderTimeline(sampleId).then((result) => {
      if (!cancelled) setTimeline(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleId, dirty]);

  const updateStep = useCallback(
    (key: string, patch: Partial<DraftReminderStep>) => {
      markDirty(() => {
        setDraftSteps((cur) =>
          cur.map((s) => {
            if (s.key !== key) return s;
            const next = { ...s, ...patch };
            if (patch.escalationTier && patch.escalationTier !== s.escalationTier) {
              next.channel = DEFAULT_CHANNEL_FOR_TIER[patch.escalationTier];
              next.templateGroupId = DEFAULT_TEMPLATE_FOR_TIER[patch.escalationTier];
            }
            return next;
          }),
        );
      });
    },
    [markDirty],
  );

  const addStep = useCallback(() => {
    markDirty(() => {
      setDraftSteps((cur) => [...cur, { key: nextDraftKey(), daysOffset: 0, escalationTier: 'friendly', channel: 'sms', templateGroupId: 'tpl-payment-reminder' }]);
    });
  }, [markDirty]);

  const removeStep = useCallback(
    (key: string) => {
      markDirty(() => setDraftSteps((cur) => (cur.length > 1 ? cur.filter((s) => s.key !== key) : cur)));
    },
    [markDirty],
  );

  const save = useCallback(async () => {
    if (!user) return false;
    setSaving(true);
    try {
      await repository.savePaymentReminderConfig(
        [...draftSteps]
          .sort((a, b) => a.daysOffset - b.daysOffset)
          .map((s) => ({
            daysOffset: s.daysOffset,
            escalationTier: s.escalationTier,
            channel: s.channel,
            templateGroupId: s.escalationTier === 'call_task' ? undefined : s.templateGroupId,
          })),
        { startHour: sendWindowStart, endHour: sendWindowEnd },
        user.name,
      );
      setDirty(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, user, draftSteps, sendWindowStart, sendWindowEnd, load]);

  const openPauseSheet = useCallback(() => {
    setPauseDealId(samplePayments[0]?.payment.dealId ?? '');
    setPauseReason('');
    setPauseSheetOpen(true);
  }, [samplePayments]);
  const closePauseSheet = useCallback(() => setPauseSheetOpen(false), []);

  const dealsForPause = useMemo(() => {
    const seen = new Set<string>();
    return samplePayments.filter((l) => {
      if (seen.has(l.payment.dealId)) return false;
      seen.add(l.payment.dealId);
      return true;
    });
  }, [samplePayments]);

  const submitPause = useCallback(async () => {
    if (!user || !pauseDealId || !pauseReason.trim()) return false;
    setSubmittingPause(true);
    try {
      await repository.setDealReminderPause(pauseDealId, true, pauseReason.trim(), user.name);
      setPauseSheetOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingPause(false);
    }
  }, [repository, user, pauseDealId, pauseReason, load]);

  const resumeDeal = useCallback(
    async (dealId: string) => {
      if (!user) return false;
      try {
        await repository.setDealReminderPause(dealId, false, undefined, user.name);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, user, load],
  );

  const runNow = useCallback(async () => {
    if (!user) return false;
    setRunningNow(true);
    try {
      const result = await repository.runDueRemindersNow(user.name);
      setRunResult(result);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setRunningNow(false);
    }
  }, [repository, user, load]);

  return {
    status,
    draftSteps,
    updateStep,
    addStep,
    removeStep,
    sendWindowStart,
    setSendWindowStart: (h) => markDirty(() => setSendWindowStart(h)),
    sendWindowEnd,
    setSendWindowEnd: (h) => markDirty(() => setSendWindowEnd(h)),
    dirty,
    saving,
    save,
    samplePayments,
    sampleId,
    setSampleId,
    timeline,
    pauses,
    dealsForPause,
    pauseSheetOpen,
    openPauseSheet,
    closePauseSheet,
    pauseDealId,
    setPauseDealId,
    pauseReason,
    setPauseReason,
    submittingPause,
    submitPause,
    resumeDeal,
    runningNow,
    runResult,
    runNow,
    reload: load,
  };
}
