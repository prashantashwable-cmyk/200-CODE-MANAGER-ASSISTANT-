import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { QuotationSpecInput } from '@/data/repository';
import type { Lead, PricingConfig, Quotation } from '@/data/types';
import type { PackageComparisonStatus } from './package-comparison.types';
import { PACKAGE_TIERS, PRICE_GAP_FLAG_THRESHOLD_PCT } from './package-comparison.types';

export interface ComparisonSetSummary {
  comparisonSetId: string;
  leadId: string;
  createdAt: string;
}

interface PackageComparisonState {
  status: PackageComparisonStatus;
  leads: Lead[];
  pickedLeadId: string;
  setPickedLeadId: (id: string) => void;
  generating: boolean;
  generate: () => Promise<boolean>;

  pastSets: ComparisonSetSummary[];
  activeSetId: string | null;
  activeQuotations: Quotation[];
  activeLead: Lead | undefined;
  openSet: (comparisonSetId: string) => void;
  priceGapFlag: boolean;
  pricingConfig: PricingConfig | null;

  reload: () => Promise<void>;
}

function suggestFromLead(lead: Lead | undefined): { stopsCount: number; travelHeightM: number } {
  const spec = lead?.spec;
  const stopsCount = spec ? spec.floors + spec.basements + 1 : 5;
  return { stopsCount, travelHeightM: Math.round(stopsCount * 3 * 10) / 10 };
}

/**
 * Owns comparison-set generation and viewing. All three tiers a set
 * produces share one base spec and go through the exact same
 * `generateComparisonSet` → `computeQuotationCost` path as a single
 * quote — there is no special-cased pricing just for comparisons.
 */
export function usePackageComparison(): PackageComparisonState {
  const repository = useData();
  const [status, setStatus] = useState<PackageComparisonStatus>('loading');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [pickedLeadId, setPickedLeadId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [leadList, quotationList, pricing] = await Promise.all([
        repository.listLeads({ sort: 'recent' }),
        repository.listQuotations(),
        repository.getPricingConfig(),
      ]);
      setLeads(leadList.filter((l) => l.stage !== 'lost'));
      setQuotations(quotationList);
      setPricingConfig(pricing);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = useCallback(async () => {
    if (!pickedLeadId) return false;
    setGenerating(true);
    try {
      const lead = leads.find((l) => l.id === pickedLeadId);
      const suggestion = suggestFromLead(lead);
      const spec = lead?.spec;
      const baseSpec: QuotationSpecInput = {
        driveType: suggestion.stopsCount > 10 ? 'gearless_traction' : spec?.machineRoom === 'mrl' ? 'mrl' : 'geared_traction',
        capacityPersons: spec?.capacityPersons ?? 6,
        capacityKg: spec?.capacityKg ?? 408,
        stopsCount: suggestion.stopsCount,
        travelHeightM: suggestion.travelHeightM,
        finishTier: 'standard',
        customConfiguration: false,
      };
      const created = await repository.generateComparisonSet(pickedLeadId, baseSpec, PACKAGE_TIERS);
      await load();
      setActiveSetId(created[0]?.comparisonSetId ?? null);
      setPickedLeadId('');
      return true;
    } catch {
      return false;
    } finally {
      setGenerating(false);
    }
  }, [repository, pickedLeadId, leads, load]);

  const pastSets = useMemo<ComparisonSetSummary[]>(() => {
    const byId = new Map<string, ComparisonSetSummary>();
    for (const q of quotations) {
      if (!q.comparisonSetId) continue;
      const existing = byId.get(q.comparisonSetId);
      if (!existing || q.createdAt > existing.createdAt) {
        byId.set(q.comparisonSetId, { comparisonSetId: q.comparisonSetId, leadId: q.leadId, createdAt: q.createdAt });
      }
    }
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [quotations]);

  const openSet = useCallback((comparisonSetId: string) => setActiveSetId(comparisonSetId), []);

  const activeQuotations = useMemo(
    () =>
      activeSetId
        ? quotations
            .filter((q) => q.comparisonSetId === activeSetId)
            .sort((a, b) => PACKAGE_TIERS.indexOf(a.packageTier ?? 'basic') - PACKAGE_TIERS.indexOf(b.packageTier ?? 'basic'))
        : [],
    [quotations, activeSetId],
  );

  const activeLead = leads.find((l) => l.id === activeQuotations[0]?.leadId);

  const priceGapFlag = useMemo(() => {
    const prices = activeQuotations.map((q) => q.cost.finalPrice);
    for (let i = 1; i < prices.length; i += 1) {
      const gap = (prices[i] - prices[i - 1]) / prices[i - 1];
      if (gap < PRICE_GAP_FLAG_THRESHOLD_PCT) return true;
    }
    return false;
  }, [activeQuotations]);

  return {
    status,
    leads,
    pickedLeadId,
    setPickedLeadId,
    generating,
    generate,
    pastSets,
    activeSetId,
    activeQuotations,
    activeLead,
    openSet,
    priceGapFlag,
    pricingConfig,
    reload: load,
  };
}
