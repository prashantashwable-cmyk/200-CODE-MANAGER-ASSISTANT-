import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { QuotationSpecInput } from '@/data/repository';
import type { Lead, Quotation } from '@/data/types';
import type { QuotationGeneratorStatus } from './quotation-generator.types';
import { SPECIALIZED_REVIEW_STOPS } from './quotation-generator.types';

const EMPTY_DRAFT: QuotationSpecInput = {
  driveType: 'geared_traction',
  capacityPersons: 6,
  capacityKg: 408,
  stopsCount: 5,
  travelHeightM: 12,
  finishTier: 'standard',
  customConfiguration: false,
};

interface QuotationGeneratorState {
  status: QuotationGeneratorStatus;
  quotations: Quotation[];
  leads: Lead[];
  pickableLeads: Lead[];
  pickedLeadId: string;
  setPickedLeadId: (id: string) => void;
  startNewQuote: () => Promise<boolean>;

  editingQuotation: Quotation | null;
  openEdit: (q: Quotation) => void;
  closeEdit: () => void;
  draft: QuotationSpecInput;
  setDraftField: <K extends keyof QuotationSpecInput>(field: K, value: QuotationSpecInput[K]) => void;
  resuggestFromLead: () => void;
  isSpecializedReview: boolean;
  canSave: boolean;
  saving: boolean;
  generatedQuotation: Quotation | null;
  saveAndGenerate: () => Promise<boolean>;
  clearGenerated: () => void;

  reload: () => Promise<void>;
}

function suggestFromLead(lead: Lead | undefined): { stopsCount: number; travelHeightM: number } {
  const spec = lead?.spec;
  const stopsCount = spec ? spec.floors + spec.basements + 1 : 5;
  return { stopsCount, travelHeightM: Math.round(stopsCount * 3 * 10) / 10 };
}

/**
 * Owns the quotation index and the spec-input form. Draft creation and
 * saving both route through the repository's own cost engine — this hook
 * never computes a price itself, it only collects the inputs the engine needs.
 */
export function useQuotationGenerator(): QuotationGeneratorState {
  const repository = useData();
  const [status, setStatus] = useState<QuotationGeneratorStatus>('loading');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pickedLeadId, setPickedLeadId] = useState('');

  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [draft, setDraft] = useState<QuotationSpecInput>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [generatedQuotation, setGeneratedQuotation] = useState<Quotation | null>(null);

  const load = useCallback(async () => {
    try {
      const [quotationList, leadList] = await Promise.all([repository.listQuotations(), repository.listLeads({ sort: 'recent' })]);
      setQuotations(quotationList);
      setLeads(leadList);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = useCallback((q: Quotation) => {
    setEditingQuotation(q);
    setDraft({
      driveType: q.driveType,
      capacityPersons: q.capacityPersons,
      capacityKg: q.capacityKg,
      stopsCount: q.stopsCount,
      travelHeightM: q.travelHeightM,
      finishTier: q.finishTier,
      specOverrideNote: q.specOverrideNote,
      customConfiguration: q.customConfiguration,
    });
  }, []);

  const closeEdit = useCallback(() => setEditingQuotation(null), []);

  const pickableLeads = useMemo(() => leads.filter((l) => l.stage !== 'lost'), [leads]);

  const startNewQuote = useCallback(async () => {
    if (!pickedLeadId) return false;
    try {
      const quotation = await repository.createQuotationDraft(pickedLeadId);
      await load();
      openEdit(quotation);
      setPickedLeadId('');
      return true;
    } catch {
      return false;
    }
  }, [repository, pickedLeadId, load, openEdit]);

  const setDraftField = useCallback(<K extends keyof QuotationSpecInput>(field: K, value: QuotationSpecInput[K]) => {
    setDraft((d) => {
      const next = { ...d, [field]: value };
      if (field === 'capacityPersons') next.capacityKg = Math.round((value as number) * 68);
      return next;
    });
  }, []);

  const resuggestFromLead = useCallback(() => {
    if (!editingQuotation) return;
    const lead = leads.find((l) => l.id === editingQuotation.leadId);
    const suggestion = suggestFromLead(lead);
    setDraft((d) => ({ ...d, ...suggestion }));
  }, [editingQuotation, leads]);

  const isSpecializedReview = draft.stopsCount >= SPECIALIZED_REVIEW_STOPS;
  const canSave = !!draft.driveType && draft.capacityPersons > 0 && draft.stopsCount > 0;

  const saveAndGenerate = useCallback(async () => {
    if (!editingQuotation || !canSave) return false;
    setSaving(true);
    try {
      const updated = await repository.saveQuotationSpec(editingQuotation.id, draft);
      await load();
      setEditingQuotation(null);
      setGeneratedQuotation(updated);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, editingQuotation, draft, canSave, load]);

  const clearGenerated = useCallback(() => setGeneratedQuotation(null), []);

  return {
    status,
    quotations,
    leads,
    pickableLeads,
    pickedLeadId,
    setPickedLeadId,
    startNewQuote,
    editingQuotation,
    openEdit,
    closeEdit,
    draft,
    setDraftField,
    resuggestFromLead,
    isSpecializedReview,
    canSave,
    saving,
    generatedQuotation,
    saveAndGenerate,
    clearGenerated,
    reload: load,
  };
}
