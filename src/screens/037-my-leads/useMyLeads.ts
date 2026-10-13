import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Lead, LeadStage } from '@/data/types';
import { PAGE_SIZE } from './my-leads.types';
import type { MyLeadsStatus, MyLeadsSummary } from './my-leads.types';

const POLL_MS = 30_000;

interface MyLeadsState {
  /** 'empty' means this surveyor has captured nothing at all, ever — the
   *  real empty state. A search or filter matching nothing while leads
   *  genuinely exist is 'ready' with `hasNoMatches` true instead, since
   *  clearing the filter is the fix, not capturing a first lead. */
  status: MyLeadsStatus;
  hasNoMatches: boolean;
  leads: Lead[];
  visible: Lead[];
  hasMore: boolean;
  loadMore: () => void;
  summary: MyLeadsSummary;
  query: string;
  setQuery: (value: string) => void;
  activeStages: LeadStage[];
  toggleStage: (stage: LeadStage) => void;
  selected: Lead | null;
  select: (lead: Lead | null) => void;
  reload: () => Promise<void>;
}

/**
 * Owns a surveyor's own lead history.
 *
 * The conversion rate here is computed with the exact same formula as the
 * admin-facing conversion screen (won / closed), scoped to this surveyor's
 * own leads, so the two can never quietly disagree. Polling picks up a stage
 * changed by someone else in the CRM without needing a full app restart.
 */
export function useMyLeads(): MyLeadsState {
  const repository = useData();
  const { user } = useSession();

  const [status, setStatus] = useState<MyLeadsStatus>('loading');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [query, setQuery] = useState('');
  const [activeStages, setActiveStages] = useState<LeadStage[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await repository.listLeads({ surveyorId: user.id });
      setLeads(list);
      setStatus(list.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads
      .filter((l) => activeStages.length === 0 || activeStages.includes(l.stage))
      .filter(
        (l) =>
          !needle ||
          l.siteName.toLowerCase().includes(needle) ||
          l.builderName.toLowerCase().includes(needle) ||
          l.code.toLowerCase().includes(needle),
      );
  }, [leads, query, activeStages]);

  const summary = useMemo<MyLeadsSummary>(() => {
    const won = leads.filter((l) => l.stage === 'won').length;
    const lost = leads.filter((l) => l.stage === 'lost').length;
    const closed = won + lost;
    return {
      total: leads.length,
      won,
      lost,
      conversionRate: closed > 0 ? won / closed : 0,
    };
  }, [leads]);

  const toggleStage = useCallback((stage: LeadStage) => {
    setActiveStages((current) =>
      current.includes(stage) ? current.filter((s) => s !== stage) : [...current, stage],
    );
    setVisibleCount(PAGE_SIZE);
  }, []);

  return {
    status,
    hasNoMatches: status === 'ready' && leads.length > 0 && filtered.length === 0,
    leads: filtered,
    visible: filtered.slice(0, visibleCount),
    hasMore: visibleCount < filtered.length,
    loadMore: () => setVisibleCount((c) => c + PAGE_SIZE),
    summary,
    query,
    setQuery,
    activeStages,
    toggleStage,
    selected,
    select: setSelected,
    reload: load,
  };
}
