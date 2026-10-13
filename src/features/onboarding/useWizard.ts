import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AscensionStepStatus } from '@/design-system';

/**
 * The step machine behind the three partner onboarding wizards.
 *
 * It owns four things they all need identically: which step you are on, whether
 * each step is genuinely complete, the auto-saved draft so an applicant can
 * close the app and come back, and whether the whole thing may be submitted.
 * Nothing here knows what a surveyor or a supplier is.
 */

export interface WizardStepDef<TDraft> {
  id: string;
  labelKey: string;
  /** A step is complete only when its own required data is genuinely present. */
  isComplete: (draft: TDraft) => boolean;
  /** Optional hard block, e.g. an expired insurance document. */
  isBlocked?: (draft: TDraft) => boolean;
}

export type WizardStatus = 'editing' | 'submitting' | 'submitted' | 'error';

interface WizardState<TDraft> {
  draft: TDraft;
  update: (patch: Partial<TDraft>) => void;
  stepIndex: number;
  step: WizardStepDef<TDraft>;
  stepStatuses: AscensionStepStatus[];
  completedCount: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canAdvance: boolean;
  canSubmit: boolean;
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  status: WizardStatus;
  setStatus: (status: WizardStatus) => void;
  /** True when the draft came back from a previous, abandoned session. */
  restored: boolean;
  /** Days since this draft was first saved — drives the reminder copy. */
  daysSinceStarted: number;
  discard: () => void;
}

interface StoredDraft<TDraft> {
  draft: TDraft;
  startedAt: string;
  stepIndex: number;
}

export function useWizard<TDraft extends object>(
  storageKey: string,
  initialDraft: TDraft,
  steps: WizardStepDef<TDraft>[],
): WizardState<TDraft> {
  const restoredRef = useRef(false);
  const startedAtRef = useRef<string>(new Date().toISOString());

  const [draft, setDraft] = useState<TDraft>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return initialDraft;
      const parsed = JSON.parse(raw) as StoredDraft<TDraft>;
      restoredRef.current = true;
      startedAtRef.current = parsed.startedAt;
      // Merge rather than replace, so a draft saved by an older build that is
      // missing newer fields still loads instead of throwing.
      return { ...initialDraft, ...parsed.draft };
    } catch {
      return initialDraft;
    }
  });

  const [stepIndex, setStepIndex] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as StoredDraft<TDraft>;
      return Math.min(Math.max(0, parsed.stepIndex ?? 0), steps.length - 1);
    } catch {
      return 0;
    }
  });

  const [status, setStatus] = useState<WizardStatus>('editing');

  // Auto-save after every change, which is what makes "resume later" true.
  useEffect(() => {
    if (status === 'submitted') return;
    const payload: StoredDraft<TDraft> = {
      draft,
      startedAt: startedAtRef.current,
      stepIndex,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [draft, stepIndex, storageKey, status]);

  const update = useCallback((patch: Partial<TDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const stepStatuses = useMemo<AscensionStepStatus[]>(
    () =>
      steps.map((definition, index) => {
        if (definition.isBlocked?.(draft)) return 'blocked';
        if (definition.isComplete(draft)) return 'complete';
        if (index === stepIndex) return 'current';
        return 'upcoming';
      }),
    [steps, draft, stepIndex],
  );

  const completedCount = stepStatuses.filter((s) => s === 'complete').length;
  const currentStep = steps[stepIndex];
  const canAdvance = currentStep.isComplete(draft) && !currentStep.isBlocked?.(draft);
  // Every step must show complete before this goes to an admin for review.
  const canSubmit = steps.every((s) => s.isComplete(draft) && !s.isBlocked?.(draft));

  const next = useCallback(() => {
    setStepIndex((index) => Math.min(steps.length - 1, index + 1));
  }, [steps.length]);

  const back = useCallback(() => {
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const goTo = useCallback(
    (index: number) => setStepIndex(Math.min(Math.max(0, index), steps.length - 1)),
    [steps.length],
  );

  const discard = useCallback(() => {
    localStorage.removeItem(storageKey);
    setDraft(initialDraft);
    setStepIndex(0);
    setStatus('editing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const daysSinceStarted = Math.floor(
    (Date.now() - new Date(startedAtRef.current).getTime()) / 86_400_000,
  );

  return {
    draft,
    update,
    stepIndex,
    step: currentStep,
    stepStatuses,
    completedCount,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === steps.length - 1,
    canAdvance,
    canSubmit,
    next,
    back,
    goTo,
    status,
    setStatus,
    restored: restoredRef.current,
    daysSinceStarted,
    discard,
  };
}
