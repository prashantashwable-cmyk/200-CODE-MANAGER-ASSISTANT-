import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { KANBAN_COLUMNS } from '@/features/crm/stageTone';
import type { Deal, Lead, LeadStage } from '@/data/types';
import type { LeadKanbanStatus, MoveResult } from './lead-kanban.types';

const POLL_MS = 30_000;

export interface KanbanColumn {
  stage: LeadStage;
  leads: Lead[];
  totalValue: number;
}

interface LeadKanbanState {
  status: LeadKanbanStatus;
  columns: KanbanColumn[];
  hasQuotation: (leadId: string) => boolean;
  hasAgreedDeal: (leadId: string) => boolean;
  moveLead: (leadId: string, toStage: LeadStage) => Promise<MoveResult>;
  reload: () => Promise<void>;
}

/**
 * Owns the Kanban board's data. Reads from the exact same `listLeads()` call
 * as the Master List (041) — the spec is explicit the two must render one
 * dataset, never two — and every move here writes through `updateLead`, so a
 * drag on this board is exactly as authoritative as a stage change made from
 * the Lead Detail screen.
 */
export function useLeadKanban(): LeadKanbanState {
  const repository = useData();
  const [status, setStatus] = useState<LeadKanbanStatus>('loading');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const load = useCallback(async () => {
    try {
      const [leadList, dealList] = await Promise.all([repository.listLeads({ sort: 'recent' }), repository.listDeals()]);
      setLeads(leadList);
      setDeals(dealList);
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

  const columns = useMemo<KanbanColumn[]>(
    () =>
      KANBAN_COLUMNS.map((stage) => {
        const inStage = leads.filter((l) => l.stage === stage);
        return { stage, leads: inStage, totalValue: inStage.reduce((sum, l) => sum + l.estimatedValue, 0) };
      }),
    [leads],
  );

  const hasQuotation = useCallback((leadId: string) => deals.some((d) => d.leadId === leadId), [deals]);
  const hasAgreedDeal = useCallback((leadId: string) => (deals.find((d) => d.leadId === leadId)?.agreedPrice ?? 0) > 0, [deals]);

  const moveLead = useCallback(
    async (leadId: string, toStage: LeadStage): Promise<MoveResult> => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.stage === toStage) return 'error';
      if (toStage === 'quoted' && !hasQuotation(leadId)) return 'blocked_quoted';
      if (toStage === 'won' && !hasAgreedDeal(leadId)) return 'blocked_won';

      const previous = leads;
      setLeads((current) => current.map((l) => (l.id === leadId ? { ...l, stage: toStage } : l)));
      try {
        await repository.updateLead(leadId, { stage: toStage });
        return 'moved';
      } catch {
        setLeads(previous);
        return 'error';
      }
    },
    [leads, repository, hasQuotation, hasAgreedDeal],
  );

  return { status, columns, hasQuotation, hasAgreedDeal, moveLead, reload: load };
}
