import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Deal, Lead, Negotiation, NegotiationBotConfig, NegotiationObjectionScenario } from '@/data/types';
import type { NegotiationBotConfigStatus } from './negotiation-bot-config.types';

interface Draft {
  marginBufferPct: number;
  maxNegotiationRounds: number;
  toneKey: NegotiationBotConfig['toneKey'];
  autoCloseAuthorityFlag: boolean;
  objectionScenarios: NegotiationObjectionScenario[];
}

interface NegotiationRow {
  negotiation: Negotiation;
  deal: Deal | undefined;
  lead: Lead | undefined;
}

interface NegotiationBotConfigState {
  status: NegotiationBotConfigStatus;
  draft: Draft;
  setMarginBufferPct: (v: number) => void;
  setMaxNegotiationRounds: (v: number) => void;
  setToneKey: (v: NegotiationBotConfig['toneKey']) => void;
  setAutoCloseAuthorityFlag: (v: boolean) => void;
  setScenarioStrategy: (objectionKey: NegotiationObjectionScenario['objectionKey'], strategy: string) => void;

  companyMarginFloorPct: number;
  effectiveBotFloorPct: number;

  isDirty: boolean;
  bufferInvalid: boolean;
  roundsInvalid: boolean;
  canSave: boolean;
  saving: boolean;
  save: () => Promise<boolean>;

  negotiationRows: NegotiationRow[];
  takingOverId: string | null;
  takeOver: (id: string) => Promise<boolean>;

  reload: () => Promise<void>;
}

function toDraft(config: NegotiationBotConfig): Draft {
  return {
    marginBufferPct: config.marginBufferPct,
    maxNegotiationRounds: config.maxNegotiationRounds,
    toneKey: config.toneKey,
    autoCloseAuthorityFlag: config.autoCloseAuthorityFlag,
    objectionScenarios: config.objectionScenarios.map((s) => ({ ...s })),
  };
}

/**
 * Owns the deal-closing bot's own configuration plus the live monitoring
 * dashboard. The bot's floor is always shown as the company margin floor
 * (Pricing Rules, 070) plus this screen's own buffer — never a number typed
 * here in isolation — so it's structurally visible that the bot can only
 * ever be more conservative than Cost Breakdown would itself allow.
 */
export function useNegotiationBotConfig(): NegotiationBotConfigState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<NegotiationBotConfigStatus>('loading');
  const [saved, setSaved] = useState<NegotiationBotConfig | null>(null);
  const [draft, setDraft] = useState<Draft>({
    marginBufferPct: 0,
    maxNegotiationRounds: 1,
    toneKey: 'professional',
    autoCloseAuthorityFlag: false,
    objectionScenarios: [],
  });
  const [saving, setSaving] = useState(false);
  const [companyMarginFloorPct, setCompanyMarginFloorPct] = useState(0);

  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [takingOverId, setTakingOverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [config, pricing, negotiationList, dealList, leadList] = await Promise.all([
        repository.getNegotiationBotConfig(),
        repository.getPricingConfig(),
        repository.listActiveNegotiations(),
        repository.listDeals(),
        repository.listLeads(),
      ]);
      setSaved(config);
      setDraft(toDraft(config));
      setCompanyMarginFloorPct(pricing.minimumMarginFloorPct);
      setNegotiations(negotiationList);
      setDeals(dealList);
      setLeads(leadList);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const setMarginBufferPct = useCallback((marginBufferPct: number) => setDraft((d) => ({ ...d, marginBufferPct })), []);
  const setMaxNegotiationRounds = useCallback((maxNegotiationRounds: number) => setDraft((d) => ({ ...d, maxNegotiationRounds })), []);
  const setToneKey = useCallback((toneKey: NegotiationBotConfig['toneKey']) => setDraft((d) => ({ ...d, toneKey })), []);
  const setAutoCloseAuthorityFlag = useCallback((autoCloseAuthorityFlag: boolean) => setDraft((d) => ({ ...d, autoCloseAuthorityFlag })), []);
  const setScenarioStrategy = useCallback((objectionKey: NegotiationObjectionScenario['objectionKey'], strategy: string) => {
    setDraft((d) => ({
      ...d,
      objectionScenarios: d.objectionScenarios.map((s) => (s.objectionKey === objectionKey ? { ...s, responseStrategy: strategy } : s)),
    }));
  }, []);

  const isDirty = !!saved && JSON.stringify(draft) !== JSON.stringify(toDraft(saved));
  const bufferInvalid = draft.marginBufferPct < 0;
  const roundsInvalid = draft.maxNegotiationRounds < 1;
  const canSave = isDirty && !bufferInvalid && !roundsInvalid && !saving;
  const effectiveBotFloorPct = companyMarginFloorPct + (Number.isFinite(draft.marginBufferPct) ? draft.marginBufferPct : 0);

  const save = useCallback(async () => {
    if (!canSave) return false;
    setSaving(true);
    try {
      const updated = await repository.updateNegotiationBotConfig(draft);
      setSaved(updated);
      setDraft(toDraft(updated));
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, draft, canSave]);

  const takeOver = useCallback(
    async (id: string) => {
      if (!user) return false;
      setTakingOverId(id);
      try {
        await repository.takeOverNegotiation(id, user.id);
        const refreshed = await repository.listActiveNegotiations();
        setNegotiations(refreshed);
        return true;
      } catch {
        return false;
      } finally {
        setTakingOverId(null);
      }
    },
    [repository, user],
  );

  const negotiationRows: NegotiationRow[] = negotiations.map((negotiation) => ({
    negotiation,
    deal: deals.find((d) => d.id === negotiation.dealId),
    lead: leads.find((l) => l.id === negotiation.leadId),
  }));

  return {
    status,
    draft,
    setMarginBufferPct,
    setMaxNegotiationRounds,
    setToneKey,
    setAutoCloseAuthorityFlag,
    setScenarioStrategy,
    companyMarginFloorPct,
    effectiveBotFloorPct,
    isDirty,
    bufferInvalid,
    roundsInvalid,
    canSave,
    saving,
    save,
    negotiationRows,
    takingOverId,
    takeOver,
    reload: load,
  };
}
