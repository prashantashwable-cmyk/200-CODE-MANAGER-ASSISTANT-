import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type {
  AutoPoRules,
  AutoPoSimulationResult,
  DriveType,
  PoTriggerCondition,
  Supplier,
  SupplierMatchStrategy,
  SupplierMatchWeights,
} from '@/data/types';
import { CONCENTRATION_WARNING_PCT } from '@/features/suppliers/supplierMatching';
import { WEIGHT_KEYS } from './auto-po-rules.types';
import type { AutoPoRulesStatus, HighConsequenceChange } from './auto-po-rules.types';

/** The editable part of the rules, held locally until Save. */
export interface RulesDraft {
  autoDraftEnabled: boolean;
  triggerCondition: PoTriggerCondition;
  strategy: SupplierMatchStrategy;
  weights: SupplierMatchWeights;
  preferAssignedSupplier: boolean;
  approvalThreshold: string;
}

const toDraft = (rules: AutoPoRules): RulesDraft => ({
  autoDraftEnabled: rules.autoDraftEnabled,
  triggerCondition: rules.triggerCondition,
  strategy: rules.strategy,
  weights: rules.weights,
  preferAssignedSupplier: rules.preferAssignedSupplier,
  approvalThreshold: String(rules.approvalThreshold),
});

/**
 * Moves one weight and rebalances the other two in proportion, so the three
 * always total exactly 100 — no "weights don't add up" error state to hit.
 */
export function rebalance(weights: SupplierMatchWeights, key: keyof SupplierMatchWeights, value: number): SupplierMatchWeights {
  const next = Math.max(0, Math.min(100, Math.round(value)));
  const others = WEIGHT_KEYS.filter((k) => k !== key);
  const otherSum = others.reduce((sum, k) => sum + weights[k], 0);
  const remaining = 100 - next;
  const result = { ...weights, [key]: next };
  if (otherSum === 0) {
    result[others[0]] = Math.floor(remaining / 2);
    result[others[1]] = remaining - result[others[0]];
  } else {
    result[others[0]] = Math.round((weights[others[0]] / otherSum) * remaining);
    result[others[1]] = remaining - result[others[0]];
  }
  return result;
}

export function useAutoPoRules() {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<AutoPoRulesStatus>('loading');
  const [rules, setRules] = useState<AutoPoRules | null>(null);
  const [draft, setDraft] = useState<RulesDraft | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const load = useCallback(async () => {
    try {
      const [nextRules, nextSuppliers] = await Promise.all([repository.getAutoPoRules(), repository.listSuppliers()]);
      setRules(nextRules);
      setDraft(toDraft(nextRules));
      setSuppliers(nextSuppliers);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (patch: Partial<RulesDraft>) => setDraft((current) => (current ? { ...current, ...patch } : current));
  const setWeight = (key: keyof SupplierMatchWeights, value: number) =>
    setDraft((current) => (current ? { ...current, weights: rebalance(current.weights, key, value) } : current));

  const thresholdValue = Number((draft?.approvalThreshold ?? '').replace(/[,\s₹]/g, ''));
  const thresholdValid = draft !== null && draft.approvalThreshold.trim() !== '' && Number.isFinite(thresholdValue) && thresholdValue >= 0;

  const dirty = useMemo(() => {
    if (!rules || !draft) return false;
    return (
      draft.autoDraftEnabled !== rules.autoDraftEnabled ||
      draft.triggerCondition !== rules.triggerCondition ||
      draft.strategy !== rules.strategy ||
      draft.preferAssignedSupplier !== rules.preferAssignedSupplier ||
      WEIGHT_KEYS.some((k) => draft.weights[k] !== rules.weights[k]) ||
      thresholdValue !== rules.approvalThreshold
    );
  }, [rules, draft, thresholdValue]);

  /** What this save would do that deserves a second look. */
  const consequences = useMemo<HighConsequenceChange[]>(() => {
    if (!rules || !draft) return [];
    const list: HighConsequenceChange[] = [];
    if (rules.autoDraftEnabled && !draft.autoDraftEnabled) list.push('automation_off');
    if (!rules.autoDraftEnabled && draft.autoDraftEnabled) list.push('automation_on');
    if (rules.triggerCondition === 'on_first_payment' && draft.triggerCondition === 'on_countersignature') list.push('earlier_trigger');
    if (thresholdValid && thresholdValue > rules.approvalThreshold) list.push('threshold_raised');
    return list;
  }, [rules, draft, thresholdValid, thresholdValue]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const commit = async (): Promise<boolean> => {
    if (!user || !draft || !thresholdValid) return false;
    setSaving(true);
    try {
      const saved = await repository.updateAutoPoRules(
        {
          autoDraftEnabled: draft.autoDraftEnabled,
          triggerCondition: draft.triggerCondition,
          strategy: draft.strategy,
          weights: draft.weights,
          preferAssignedSupplier: draft.preferAssignedSupplier,
          approvalThreshold: thresholdValue,
        },
        user.id,
      );
      setRules(saved);
      setDraft(toDraft(saved));
      setConfirmOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** High-consequence saves stop at a confirmation; routine ones go straight through. */
  const requestSave = async (): Promise<boolean | 'confirm'> => {
    if (consequences.length > 0) {
      setConfirmOpen(true);
      return 'confirm';
    }
    return commit();
  };

  const discard = () => rules && setDraft(toDraft(rules));

  /* ------------------------------------------------------------ simulation */
  const [simDriveType, setSimDriveType] = useState<DriveType | ''>('geared_traction');
  const [simAssigned, setSimAssigned] = useState('');
  const [simulating, setSimulating] = useState(false);

  const simulation: AutoPoSimulationResult | null = rules?.lastSimulation ?? null;

  const runSimulation = async (): Promise<boolean> => {
    if (!user || !draft) return false;
    setSimulating(true);
    try {
      const result = await repository.simulateAutoPoMatching(
        {
          driveType: simDriveType || null,
          assignedSupplierId: simAssigned || null,
          // Unsaved edits are exactly what Admin wants to try before saving.
          rulesOverride: dirty
            ? {
                strategy: draft.strategy,
                weights: draft.weights,
                preferAssignedSupplier: draft.preferAssignedSupplier,
                approvalThreshold: thresholdValid ? thresholdValue : rules?.approvalThreshold,
              }
            : undefined,
        },
        user.id,
      );
      setRules((current) => (current ? { ...current, lastSimulation: result } : current));
      return true;
    } catch {
      return false;
    } finally {
      setSimulating(false);
    }
  };

  const topShare = simulation?.valueShare[0] ?? null;
  const concentrated = topShare !== null && (simulation?.valueShare.length ?? 0) > 0 && topShare.sharePct >= CONCENTRATION_WARNING_PCT;
  /** The rules have been saved again since this simulation ran. */
  const simulationStale = simulation !== null && rules !== null && !simulation.usedUnsavedRules && simulation.rulesVersion !== rules.version;

  return {
    status,
    rules,
    draft,
    suppliers,
    reload: load,
    update,
    setWeight,
    thresholdValue,
    thresholdValid,
    dirty,
    consequences,
    confirmOpen,
    setConfirmOpen,
    saving,
    commit,
    requestSave,
    discard,
    simDriveType,
    setSimDriveType,
    simAssigned,
    setSimAssigned,
    simulating,
    simulation,
    runSimulation,
    topShare,
    concentrated,
    simulationStale,
  };
}

export type AutoPoRulesState = ReturnType<typeof useAutoPoRules>;
