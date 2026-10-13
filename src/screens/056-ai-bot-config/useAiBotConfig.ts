import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { LOW_CONFIDENCE_WARNING_THRESHOLD, MAX_SAFE_BOT_DISCOUNT_PCT } from '@/features/communication/botRules';
import type { BotSimulationResult } from '@/data/repository';
import type { BotConfig } from '@/data/types';
import type { AiBotConfigStatus } from './ai-bot-config.types';

interface Draft {
  toneKey: BotConfig['toneKey'];
  allowedDiscountMinPct: number;
  allowedDiscountMaxPct: number;
  escalationConfidenceThreshold: number;
}

interface AiBotConfigState {
  status: AiBotConfigStatus;
  stats: { autoResolvedRatePct: number; escalatedRatePct: number };
  draft: Draft;
  setTone: (tone: BotConfig['toneKey']) => void;
  setDiscountMin: (pct: number) => void;
  setDiscountMax: (pct: number) => void;
  setConfidenceThreshold: (fraction: number) => void;
  isDirty: boolean;
  marginFloorError: boolean;
  rangeInvalid: boolean;
  lowConfidenceWarning: boolean;
  canSave: boolean;
  saving: boolean;
  save: () => Promise<boolean>;

  sampleMessage: string;
  setSampleMessage: (v: string) => void;
  simResult: BotSimulationResult | null;
  simRunning: boolean;
  runSimulation: () => Promise<void>;

  reload: () => Promise<void>;
}

function toDraft(config: BotConfig): Draft {
  return {
    toneKey: config.toneKey,
    allowedDiscountMinPct: config.allowedDiscountMinPct,
    allowedDiscountMaxPct: config.allowedDiscountMaxPct,
    escalationConfidenceThreshold: config.escalationConfidenceThreshold,
  };
}

/**
 * Owns the bot config form and the live simulator. The simulator always
 * tests against the current draft (not just the last-saved config) so an
 * Admin can adjust a slider and immediately see the effect before saving —
 * the margin-floor and escalation rules are proven live, not just declared.
 */
export function useAiBotConfig(): AiBotConfigState {
  const repository = useData();
  const [status, setStatus] = useState<AiBotConfigStatus>('loading');
  const [saved, setSaved] = useState<BotConfig | null>(null);
  const [draft, setDraft] = useState<Draft>({
    toneKey: 'professional',
    allowedDiscountMinPct: 0,
    allowedDiscountMaxPct: 0,
    escalationConfidenceThreshold: 0.5,
  });
  const [saving, setSaving] = useState(false);

  const [sampleMessage, setSampleMessage] = useState('');
  const [simResult, setSimResult] = useState<BotSimulationResult | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  const load = useCallback(async () => {
    try {
      const config = await repository.getBotConfig();
      setSaved(config);
      setDraft(toDraft(config));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const setTone = useCallback((toneKey: BotConfig['toneKey']) => setDraft((d) => ({ ...d, toneKey })), []);
  const setDiscountMin = useCallback((allowedDiscountMinPct: number) => setDraft((d) => ({ ...d, allowedDiscountMinPct })), []);
  const setDiscountMax = useCallback((allowedDiscountMaxPct: number) => setDraft((d) => ({ ...d, allowedDiscountMaxPct })), []);
  const setConfidenceThreshold = useCallback(
    (escalationConfidenceThreshold: number) => setDraft((d) => ({ ...d, escalationConfidenceThreshold })),
    [],
  );

  const isDirty = !!saved && JSON.stringify(draft) !== JSON.stringify(toDraft(saved));
  const marginFloorError = draft.allowedDiscountMaxPct > MAX_SAFE_BOT_DISCOUNT_PCT;
  const rangeInvalid = draft.allowedDiscountMinPct > draft.allowedDiscountMaxPct;
  const lowConfidenceWarning = draft.escalationConfidenceThreshold < LOW_CONFIDENCE_WARNING_THRESHOLD;
  const canSave = isDirty && !marginFloorError && !rangeInvalid && !saving;

  const save = useCallback(async () => {
    if (!canSave) return false;
    setSaving(true);
    try {
      const updated = await repository.updateBotConfig(draft);
      setSaved(updated);
      setDraft(toDraft(updated));
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, draft, canSave]);

  const runSimulation = useCallback(async () => {
    if (!sampleMessage.trim()) return;
    setSimRunning(true);
    try {
      const result = await repository.simulateBotReply(sampleMessage.trim(), draft);
      setSimResult(result);
    } catch {
      setSimResult(null);
    } finally {
      setSimRunning(false);
    }
  }, [repository, sampleMessage, draft]);

  return {
    status,
    stats: {
      autoResolvedRatePct: saved ? Math.round(saved.autoResolvedRatePct * 100) : 0,
      escalatedRatePct: saved ? Math.round(saved.escalatedRatePct * 100) : 0,
    },
    draft,
    setTone,
    setDiscountMin,
    setDiscountMax,
    setConfidenceThreshold,
    isDirty,
    marginFloorError,
    rangeInvalid,
    lowConfidenceWarning,
    canSave,
    saving,
    save,
    sampleMessage,
    setSampleMessage,
    simResult,
    simRunning,
    runSimulation,
    reload: load,
  };
}
