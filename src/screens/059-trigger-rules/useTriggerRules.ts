import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { TriggerRuleEvaluation } from '@/data/repository';
import type { CommSequence, CommTemplate, LeadStage, TriggerRule } from '@/data/types';
import type { ActionKind, TriggerRulesStatus } from './trigger-rules.types';
import { RULE_STAGES } from './trigger-rules.types';

export interface RuleRow {
  rule: TriggerRule;
  actionKind: ActionKind | null;
  actionName: string;
}

export interface StageGroup {
  stage: LeadStage;
  rules: RuleRow[];
}

export interface TemplateGroupOption {
  groupId: string;
  name: string;
}

export interface SaveRuleInput {
  id?: string;
  name: string;
  triggerStage: LeadStage;
  delayHours: number;
  actionKind: ActionKind;
  actionSequenceId?: string;
  actionTemplateGroupId?: string;
  allowStacking: boolean;
}

interface TriggerRulesState {
  status: TriggerRulesStatus;
  stageGroups: StageGroup[];
  sequences: CommSequence[];
  templateGroups: TemplateGroupOption[];

  sheetOpen: boolean;
  editingRule: TriggerRule | null;
  openCreate: () => void;
  openEdit: (rule: TriggerRule) => void;
  closeSheet: () => void;
  saveRule: (input: SaveRuleInput) => Promise<boolean>;

  toggle: (rule: TriggerRule) => void;
  disableConfirmRule: TriggerRule | null;
  closeDisableConfirm: () => void;
  confirmDisable: (choice: 'finish' | 'stop') => Promise<boolean>;

  reorder: (rule: TriggerRule, direction: 'up' | 'down') => Promise<boolean>;

  simStage: LeadStage;
  setSimStage: (s: LeadStage) => void;
  simResults: TriggerRuleEvaluation[] | null;
  simRunning: boolean;
  runSimulation: () => Promise<void>;

  reload: () => Promise<void>;
}

/**
 * Owns the trigger rule table. This is the live configuration the
 * Automated Sequence Builder and the wider automation engine read — saving
 * or toggling a rule here goes through the exact `saveTriggerRule` /
 * `toggleTriggerRule` calls any other consumer would, not a parallel path.
 */
export function useTriggerRules(): TriggerRulesState {
  const repository = useData();
  const [status, setStatus] = useState<TriggerRulesStatus>('loading');
  const [rules, setRules] = useState<TriggerRule[]>([]);
  const [sequences, setSequences] = useState<CommSequence[]>([]);
  const [templates, setTemplates] = useState<CommTemplate[]>([]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TriggerRule | null>(null);
  const [disableConfirmRule, setDisableConfirmRule] = useState<TriggerRule | null>(null);

  const [simStage, setSimStage] = useState<LeadStage>('captured');
  const [simResults, setSimResults] = useState<TriggerRuleEvaluation[] | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ruleList, sequenceList, templateList] = await Promise.all([
        repository.listTriggerRules(),
        repository.listSequences(),
        repository.listCommTemplates(),
      ]);
      setRules(ruleList);
      setSequences(sequenceList);
      setTemplates(templateList);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const templateGroups = useMemo<TemplateGroupOption[]>(() => {
    const seen = new Map<string, string>();
    for (const tpl of templates) if (!seen.has(tpl.groupId)) seen.set(tpl.groupId, tpl.name);
    return [...seen.entries()].map(([groupId, name]) => ({ groupId, name }));
  }, [templates]);

  const stageGroups = useMemo<StageGroup[]>(() => {
    return RULE_STAGES.map((stage) => {
      const stageRules = rules
        .filter((r) => r.triggerStage === stage)
        .sort((a, b) => a.priority - b.priority || b.createdAt.localeCompare(a.createdAt));
      const rows: RuleRow[] = stageRules.map((rule) => {
        if (rule.actionSequenceId) {
          const seq = sequences.find((s) => s.id === rule.actionSequenceId);
          return { rule, actionKind: 'sequence', actionName: seq?.name ?? rule.actionSequenceId };
        }
        if (rule.actionTemplateGroupId) {
          const name = templateGroups.find((t) => t.groupId === rule.actionTemplateGroupId)?.name ?? rule.actionTemplateGroupId;
          return { rule, actionKind: 'template', actionName: name };
        }
        return { rule, actionKind: null, actionName: '' };
      });
      return { stage, rules: rows };
    }).filter((g) => g.rules.length > 0);
  }, [rules, sequences, templateGroups]);

  const openCreate = useCallback(() => {
    setEditingRule(null);
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((rule: TriggerRule) => {
    setEditingRule(rule);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const saveRule = useCallback(
    async (input: SaveRuleInput) => {
      try {
        const existing = input.id ? rules.find((r) => r.id === input.id) : undefined;
        const stageRules = rules.filter((r) => r.triggerStage === input.triggerStage);
        const priority = existing ? existing.priority : (Math.max(0, ...stageRules.map((r) => r.priority)) + 1);
        await repository.saveTriggerRule({
          id: input.id,
          name: input.name,
          triggerStage: input.triggerStage,
          delayHours: input.delayHours,
          actionSequenceId: input.actionKind === 'sequence' ? input.actionSequenceId : undefined,
          actionTemplateGroupId: input.actionKind === 'template' ? input.actionTemplateGroupId : undefined,
          priority,
          enabled: existing ? existing.enabled : true,
          allowStacking: input.allowStacking,
        });
        await load();
        setSheetOpen(false);
        return true;
      } catch {
        return false;
      }
    },
    [repository, rules, load],
  );

  const toggle = useCallback(
    (rule: TriggerRule) => {
      if (rule.enabled && rule.actionSequenceId) {
        setDisableConfirmRule(rule);
        return;
      }
      void repository.toggleTriggerRule(rule.id, !rule.enabled).then(() => load());
    },
    [repository, load],
  );

  const closeDisableConfirm = useCallback(() => setDisableConfirmRule(null), []);

  const confirmDisable = useCallback(
    async (choice: 'finish' | 'stop') => {
      if (!disableConfirmRule) return false;
      try {
        await repository.toggleTriggerRule(disableConfirmRule.id, false);
        if (choice === 'stop' && disableConfirmRule.actionSequenceId) {
          await repository.toggleSequence(disableConfirmRule.actionSequenceId, false);
        }
        await load();
        setDisableConfirmRule(null);
        return true;
      } catch {
        return false;
      }
    },
    [repository, disableConfirmRule, load],
  );

  const reorder = useCallback(
    async (rule: TriggerRule, direction: 'up' | 'down') => {
      const stageRules = rules
        .filter((r) => r.triggerStage === rule.triggerStage)
        .sort((a, b) => a.priority - b.priority || b.createdAt.localeCompare(a.createdAt));
      const index = stageRules.findIndex((r) => r.id === rule.id);
      const siblingIndex = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || siblingIndex < 0 || siblingIndex >= stageRules.length) return false;
      const sibling = stageRules[siblingIndex];
      try {
        await Promise.all([
          repository.saveTriggerRule({ ...rule, priority: sibling.priority }),
          repository.saveTriggerRule({ ...sibling, priority: rule.priority }),
        ]);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, rules, load],
  );

  const runSimulation = useCallback(async () => {
    setSimRunning(true);
    try {
      const result = await repository.simulateTriggerRules(simStage);
      setSimResults(result);
    } catch {
      setSimResults(null);
    } finally {
      setSimRunning(false);
    }
  }, [repository, simStage]);

  return {
    status,
    stageGroups,
    sequences,
    templateGroups,
    sheetOpen,
    editingRule,
    openCreate,
    openEdit,
    closeSheet,
    saveRule,
    toggle,
    disableConfirmRule,
    closeDisableConfirm,
    confirmDisable,
    reorder,
    simStage,
    setSimStage,
    simResults,
    simRunning,
    runSimulation,
    reload: load,
  };
}
