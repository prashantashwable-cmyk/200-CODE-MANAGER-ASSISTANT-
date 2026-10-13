import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Lead, Quotation } from '@/data/types';
import type { QuotationHistoryStatus } from './quotation-history.types';

export interface LineageSummary {
  latest: Quotation;
  leadId: string;
  versionCount: number;
}

interface DiffEntry {
  fieldKey: string;
  from: string;
  to: string;
}

interface QuotationHistoryState {
  status: QuotationHistoryStatus;
  lineages: LineageSummary[];
  leads: Lead[];

  activeChain: Quotation[];
  activeLead: Lead | undefined;
  openLineage: (rootQuotationId: string) => void;
  closeLineage: () => void;

  diffFor: (version: Quotation, index: number) => DiffEntry[];

  restoring: string | null;
  restoreVersion: (version: Quotation) => Promise<boolean>;

  reload: () => Promise<void>;
}

function specDiff(prev: Quotation | undefined, current: Quotation): DiffEntry[] {
  if (!prev) return [];
  const entries: DiffEntry[] = [];
  if (prev.driveType !== current.driveType) entries.push({ fieldKey: 'driveType', from: prev.driveType, to: current.driveType });
  if (prev.finishTier !== current.finishTier) entries.push({ fieldKey: 'finishTier', from: prev.finishTier, to: current.finishTier });
  if (prev.capacityPersons !== current.capacityPersons) {
    entries.push({ fieldKey: 'capacityPersons', from: String(prev.capacityPersons), to: String(current.capacityPersons) });
  }
  if (prev.stopsCount !== current.stopsCount) entries.push({ fieldKey: 'stopsCount', from: String(prev.stopsCount), to: String(current.stopsCount) });
  if (prev.cost.finalPrice !== current.cost.finalPrice) {
    entries.push({ fieldKey: 'finalPrice', from: String(prev.cost.finalPrice), to: String(current.cost.finalPrice) });
  }
  if (prev.validityDate !== current.validityDate) {
    entries.push({ fieldKey: 'validityDate', from: prev.validityDate ?? '—', to: current.validityDate ?? '—' });
  }
  return entries;
}

/**
 * Owns the version-chain view. Every chain here is walked from the
 * repository's own `supersedesQuotationId` pointers — there is no separate
 * diff or history record; the diff between two versions is computed live
 * from the two real Quotation records each time, so it can never drift
 * from what actually changed.
 */
export function useQuotationHistory(): QuotationHistoryState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<QuotationHistoryStatus>('loading');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeRootId, setActiveRootId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

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

  const lineages = useMemo<LineageSummary[]>(() => {
    const byId = new Map(quotations.map((q) => [q.id, q]));
    const supersededIds = new Set(quotations.filter((q) => q.supersedesQuotationId).map((q) => q.supersedesQuotationId!));
    // The "head" of each lineage is any version nothing else supersedes.
    const heads = quotations.filter((q) => !supersededIds.has(q.id));
    return heads
      .map((head) => {
        let count = 1;
        let cursor = head;
        while (cursor.supersedesQuotationId) {
          const prior = byId.get(cursor.supersedesQuotationId);
          if (!prior) break;
          count += 1;
          cursor = prior;
        }
        return { latest: head, leadId: head.leadId, versionCount: count };
      })
      .sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt));
  }, [quotations]);

  const openLineage = useCallback((rootQuotationId: string) => setActiveRootId(rootQuotationId), []);
  const closeLineage = useCallback(() => setActiveRootId(null), []);

  const activeChain = useMemo<Quotation[]>(() => {
    if (!activeRootId) return [];
    const head = quotations.find((q) => q.id === activeRootId);
    if (!head) return [];
    let root = head;
    while (root.supersedesQuotationId) {
      const prior = quotations.find((q) => q.id === root.supersedesQuotationId);
      if (!prior) break;
      root = prior;
    }
    const chain: Quotation[] = [root];
    let current = root;
    for (;;) {
      const next = quotations.find((q) => q.supersedesQuotationId === current.id);
      if (!next) break;
      chain.push(next);
      current = next;
    }
    return chain;
  }, [quotations, activeRootId]);

  const activeLead = leads.find((l) => l.id === activeChain[0]?.leadId);

  const diffFor = useCallback((version: Quotation, index: number) => specDiff(index > 0 ? activeChain[index - 1] : undefined, version), [activeChain]);

  const restoreVersion = useCallback(
    async (version: Quotation) => {
      const current = activeChain[activeChain.length - 1];
      if (!current) return false;
      setRestoring(version.id);
      try {
        await repository.createQuotationVersion(
          current.id,
          {
            driveType: version.driveType,
            capacityPersons: version.capacityPersons,
            capacityKg: version.capacityKg,
            stopsCount: version.stopsCount,
            travelHeightM: version.travelHeightM,
            finishTier: version.finishTier,
            specOverrideNote: version.specOverrideNote,
            customConfiguration: version.customConfiguration,
          },
          { key: 'quotation.reason.restored', note: `v${version.version}` },
          user?.name ?? 'Sales',
        );
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setRestoring(null);
      }
    },
    [repository, activeChain, user, load],
  );

  return { status, lineages, leads, activeChain, activeLead, openLineage, closeLineage, diffFor, restoring, restoreVersion, reload: load };
}
