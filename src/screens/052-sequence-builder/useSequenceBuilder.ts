import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { CommSequence, CommTemplate, Lead, LeadStage, SequenceStep } from '@/data/types';
import type { SequenceTestStep } from '@/data/repository';
import type { SequenceBuilderStatus, WizardStep } from './sequence-builder.types';
import { WIZARD_STEPS } from './sequence-builder.types';

const POLL_MS = 60_000;

export interface SequenceDraft {
  id?: string;
  name: string;
  triggerStage: LeadStage;
  maxNudgesPerLead: number;
  priority: number;
  restartOnReopen: boolean;
  steps: SequenceStep[];
  isActive: boolean;
}

const emptyDraft = (): SequenceDraft => ({
  name: '',
  triggerStage: 'captured',
  maxNudgesPerLead: 3,
  priority: 5,
  restartOnReopen: false,
  steps: [],
  isActive: false,
});

let localStepCounter = 0;

interface SequenceBuilderState {
  status: SequenceBuilderStatus;
  sequences: CommSequence[];
  templateOptions: CommTemplate[];
  leadOptions: Lead[];
  toggleSequence: (id: string, isActive: boolean) => Promise<boolean>;
  reload: () => Promise<void>;

  wizardOpen: boolean;
  wizardStep: WizardStep;
  openNewSequence: () => void;
  openEditSequence: (sequence: CommSequence) => void;
  closeWizard: () => void;
  goNext: () => Promise<void>;
  goBack: () => void;
  goToStep: (step: WizardStep) => void;
  canProceed: boolean;

  draft: SequenceDraft;
  setDraftField: <K extends keyof SequenceDraft>(key: K, value: SequenceDraft[K]) => void;
  addStep: () => void;
  removeStep: (stepId: string) => void;
  moveStep: (stepId: string, direction: 'up' | 'down') => void;
  updateStep: (stepId: string, patch: Partial<SequenceStep>) => void;

  testLeadId: string;
  setTestLeadId: (id: string) => void;
  testResult: SequenceTestStep[] | null;
  runTest: () => Promise<void>;

  finish: (activate: boolean) => Promise<boolean>;
}

/**
 * Owns the sequence list and the wizard that creates or edits one. The
 * wizard draft-saves at the steps→test boundary (as a draft, never active)
 * so the test-send step always runs against a real, persisted sequence —
 * never a fictional in-memory-only preview.
 */
export function useSequenceBuilder(): SequenceBuilderState {
  const repository = useData();
  const [status, setStatus] = useState<SequenceBuilderStatus>('loading');
  const [sequences, setSequences] = useState<CommSequence[]>([]);
  const [templateOptions, setTemplateOptions] = useState<CommTemplate[]>([]);
  const [leadOptions, setLeadOptions] = useState<Lead[]>([]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('basics');
  const [draft, setDraft] = useState<SequenceDraft>(emptyDraft());
  const [testLeadId, setTestLeadId] = useState('');
  const [testResult, setTestResult] = useState<SequenceTestStep[] | null>(null);

  const load = useCallback(async () => {
    try {
      const [seqList, templates, leads] = await Promise.all([
        repository.listSequences(),
        repository.listCommTemplates({ language: 'en' }),
        repository.listLeads({ sort: 'recent' }),
      ]);
      setSequences(seqList);
      setTemplateOptions(templates);
      setLeadOptions(leads.slice(0, 30));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const toggleSequence = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        await repository.toggleSequence(id, isActive);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  const openNewSequence = useCallback(() => {
    setDraft(emptyDraft());
    setWizardStep('basics');
    setTestResult(null);
    setTestLeadId('');
    setWizardOpen(true);
  }, []);

  const openEditSequence = useCallback((sequence: CommSequence) => {
    setDraft({ ...sequence });
    setWizardStep('basics');
    setTestResult(null);
    setTestLeadId('');
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => setWizardOpen(false), []);

  const setDraftField = useCallback(<K extends keyof SequenceDraft>(key: K, value: SequenceDraft[K]) => {
    setDraft((cur) => ({ ...cur, [key]: value }));
  }, []);

  const addStep = useCallback(() => {
    setDraft((cur) => {
      const nextOrder = cur.steps.length + 1;
      const step: SequenceStep = {
        id: `local-step-${(localStepCounter += 1)}`,
        order: nextOrder,
        waitDays: nextOrder === 1 ? 0 : 2,
        templateGroupId: '',
        branch: 'always',
      };
      return { ...cur, steps: [...cur.steps, step] };
    });
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setDraft((cur) => ({
      ...cur,
      steps: cur.steps.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 })),
    }));
  }, []);

  const moveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    setDraft((cur) => {
      const index = cur.steps.findIndex((s) => s.id === stepId);
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= cur.steps.length) return cur;
      const next = [...cur.steps];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return { ...cur, steps: next.map((s, i) => ({ ...s, order: i + 1 })) };
    });
  }, []);

  const updateStep = useCallback((stepId: string, patch: Partial<SequenceStep>) => {
    setDraft((cur) => ({ ...cur, steps: cur.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }));
  }, []);

  const persistDraft = useCallback(async () => {
    const saved = await repository.saveSequence({
      id: draft.id ?? '',
      name: draft.name.trim(),
      triggerStage: draft.triggerStage,
      steps: draft.steps,
      maxNudgesPerLead: draft.maxNudgesPerLead,
      priority: draft.priority,
      isActive: draft.id ? draft.isActive : false,
      restartOnReopen: draft.restartOnReopen,
      updatedAt: new Date().toISOString(),
      isDemo: true,
    });
    setDraft((cur) => ({ ...cur, id: saved.id }));
    return saved;
  }, [repository, draft]);

  const canProceed = useMemo(() => {
    if (wizardStep === 'basics') return draft.name.trim().length > 0;
    if (wizardStep === 'steps') return draft.steps.length > 0 && draft.steps.every((s) => s.templateGroupId);
    return true;
  }, [wizardStep, draft]);

  const goNext = useCallback(async () => {
    const currentIndex = WIZARD_STEPS.indexOf(wizardStep);
    if (wizardStep === 'steps') {
      // Draft-save at the steps→test boundary, so test-send always runs
      // against a real, persisted sequence.
      await persistDraft();
    }
    if (currentIndex < WIZARD_STEPS.length - 1) setWizardStep(WIZARD_STEPS[currentIndex + 1]);
  }, [wizardStep, persistDraft]);

  const goBack = useCallback(() => {
    const currentIndex = WIZARD_STEPS.indexOf(wizardStep);
    if (currentIndex > 0) setWizardStep(WIZARD_STEPS[currentIndex - 1]);
  }, [wizardStep]);

  const goToStep = useCallback(
    (step: WizardStep) => {
      // Only allow jumping to a step no further than one past the current
      // progress, so later steps can't be reached with unsaved gaps.
      if (WIZARD_STEPS.indexOf(step) <= WIZARD_STEPS.indexOf(wizardStep)) setWizardStep(step);
    },
    [wizardStep],
  );

  const runTest = useCallback(async () => {
    if (!draft.id || !testLeadId) return;
    try {
      const result = await repository.testSendSequence(draft.id, testLeadId);
      setTestResult(result);
    } catch {
      setTestResult(null);
    }
  }, [repository, draft.id, testLeadId]);

  const finish = useCallback(
    async (activate: boolean) => {
      try {
        const saved = await repository.saveSequence({
          id: draft.id ?? '',
          name: draft.name.trim(),
          triggerStage: draft.triggerStage,
          steps: draft.steps,
          maxNudgesPerLead: draft.maxNudgesPerLead,
          priority: draft.priority,
          isActive: activate,
          restartOnReopen: draft.restartOnReopen,
          updatedAt: new Date().toISOString(),
          isDemo: true,
        });
        setDraft((cur) => ({ ...cur, id: saved.id, isActive: activate }));
        await load();
        setWizardOpen(false);
        return true;
      } catch {
        return false;
      }
    },
    [repository, draft, load],
  );

  return {
    status,
    sequences,
    templateOptions,
    leadOptions,
    toggleSequence,
    reload: load,
    wizardOpen,
    wizardStep,
    openNewSequence,
    openEditSequence,
    closeWizard,
    goNext,
    goBack,
    goToStep,
    canProceed,
    draft,
    setDraftField,
    addStep,
    removeStep,
    moveStep,
    updateStep,
    testLeadId,
    setTestLeadId,
    testResult,
    runTest,
    finish,
  };
}
