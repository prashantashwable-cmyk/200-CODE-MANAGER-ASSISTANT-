import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import type { Lead, PricingConfig, Quotation } from '@/data/types';
import type { CostBreakdownStatus } from './cost-breakdown.types';

interface CostBreakdownState {
  status: CostBreakdownStatus;
  quotation: Quotation | null;
  lead: Lead | null;
  pricingConfig: PricingConfig | null;

  marginDraft: number;
  setMarginDraft: (v: number) => void;
  marginDirty: boolean;
  belowFloor: boolean;
  saving: boolean;
  saveMargin: () => Promise<boolean>;

  civilWorkSheetOpen: boolean;
  openCivilWorkSheet: () => void;
  closeCivilWorkSheet: () => void;
  civilWorkAmount: number;
  setCivilWorkAmount: (v: number) => void;
  civilWorkNote: string;
  setCivilWorkNote: (v: string) => void;
  saveCivilWork: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns one quotation's cost breakdown. Margin and civil-work adjustments
 * both route through the repository's `adjustQuotationCost`, the exact
 * same recompute the spec-save path uses — this screen never does its own
 * arithmetic, so the number Sales sees is always the number the margin
 * floor actually checked.
 */
export function useCostBreakdown(): CostBreakdownState {
  const { quotationId } = useParams<{ quotationId: string }>();
  const repository = useData();
  const [status, setStatus] = useState<CostBreakdownStatus>('loading');
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);

  const [marginDraft, setMarginDraft] = useState(0);
  const [saving, setSaving] = useState(false);

  const [civilWorkSheetOpen, setCivilWorkSheetOpen] = useState(false);
  const [civilWorkAmount, setCivilWorkAmount] = useState(0);
  const [civilWorkNote, setCivilWorkNote] = useState('');

  const load = useCallback(async () => {
    if (!quotationId) {
      setStatus('error');
      return;
    }
    try {
      const q = await repository.getQuotation(quotationId);
      if (!q) {
        setStatus('error');
        return;
      }
      const [leadResult, pricing] = await Promise.all([repository.getLead(q.leadId), repository.getPricingConfig()]);
      setQuotation(q);
      setLead(leadResult);
      setPricingConfig(pricing);
      setMarginDraft(q.cost.marginPct);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, quotationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const marginDirty = !!quotation && marginDraft !== quotation.cost.marginPct;
  const belowFloor = !!pricingConfig && marginDraft < pricingConfig.minimumMarginFloorPct;

  const saveMargin = useCallback(async () => {
    if (!quotation || belowFloor) return false;
    setSaving(true);
    try {
      const updated = await repository.adjustQuotationCost(quotation.id, { marginPct: marginDraft });
      setQuotation(updated);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, quotation, marginDraft, belowFloor]);

  const openCivilWorkSheet = useCallback(() => {
    if (!quotation) return;
    setCivilWorkAmount(quotation.cost.civilWorkEstimate);
    setCivilWorkNote(quotation.cost.civilWorkAdjustmentNote ?? '');
    setCivilWorkSheetOpen(true);
  }, [quotation]);

  const closeCivilWorkSheet = useCallback(() => setCivilWorkSheetOpen(false), []);

  const saveCivilWork = useCallback(async () => {
    if (!quotation || !civilWorkNote.trim()) return false;
    setSaving(true);
    try {
      const updated = await repository.adjustQuotationCost(quotation.id, {
        civilWorkOverride: { amount: civilWorkAmount, note: civilWorkNote.trim() },
      });
      setQuotation(updated);
      setMarginDraft(updated.cost.marginPct);
      setCivilWorkSheetOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, quotation, civilWorkAmount, civilWorkNote]);

  return {
    status,
    quotation,
    lead,
    pricingConfig,
    marginDraft,
    setMarginDraft,
    marginDirty,
    belowFloor,
    saving,
    saveMargin,
    civilWorkSheetOpen,
    openCivilWorkSheet,
    closeCivilWorkSheet,
    civilWorkAmount,
    setCivilWorkAmount,
    civilWorkNote,
    setCivilWorkNote,
    saveCivilWork,
    reload: load,
  };
}
