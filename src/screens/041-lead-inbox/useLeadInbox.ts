import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Lead, LeadSource, LeadStage, User } from '@/data/types';
import { PAGE_SIZE } from './lead-inbox.types';
import type { DateRangeFilter, LeadInboxStatus, LeadInboxSummary } from './lead-inbox.types';

const POLL_MS = 30_000;

function withinRange(iso: string, range: DateRangeFilter): boolean {
  if (range === 'all') return true;
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (range === 'today') return days <= 1;
  if (range === 'week') return days <= 7;
  return days <= 30;
}

interface LeadInboxState {
  status: LeadInboxStatus;
  leads: Lead[];
  visible: Lead[];
  hasMore: boolean;
  hasNoMatches: boolean;
  loadMore: () => void;
  summary: LeadInboxSummary;
  cities: string[];
  surveyors: User[];

  query: string;
  setQuery: (v: string) => void;
  activeStages: LeadStage[];
  toggleStage: (s: LeadStage) => void;
  activeSources: LeadSource[];
  toggleSource: (s: LeadSource) => void;
  city: string;
  setCity: (v: string) => void;
  dateRange: DateRangeFilter;
  setDateRange: (v: DateRangeFilter) => void;
  clearFilters: () => void;
  filtersActive: boolean;

  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;

  quickView: Lead | null;
  openQuickView: (lead: Lead) => void;
  closeQuickView: () => void;

  reassignSheetOpen: boolean;
  openReassignSheet: () => void;
  closeReassignSheet: () => void;
  submitReassign: (toSurveyorId: string, reason: string) => Promise<boolean>;

  markLostSheetOpen: boolean;
  openMarkLostSheet: () => void;
  closeMarkLostSheet: () => void;
  submitMarkLost: (reasonKey: string) => Promise<boolean>;

  exportSelected: () => void;
  reload: () => Promise<void>;
}

/**
 * Owns the CRM master list — every lead in the pipeline, one dataset shared
 * verbatim with the Kanban board (043) since both simply call
 * `repository.listLeads()`. Bulk actions here write through the same
 * repository mutations the single-lead screens use, so every bulk action
 * still produces a normal, per-lead audit-log entry on the Lead Detail timeline.
 */
export function useLeadInbox(): LeadInboxState {
  const repository = useData();
  const { user } = useSession();

  const [status, setStatus] = useState<LeadInboxStatus>('loading');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [surveyors, setSurveyors] = useState<User[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [query, setQuery] = useState('');
  const [activeStages, setActiveStages] = useState<LeadStage[]>([]);
  const [activeSources, setActiveSources] = useState<LeadSource[]>([]);
  const [city, setCity] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickView, setQuickView] = useState<Lead | null>(null);
  const [reassignSheetOpen, setReassignSheetOpen] = useState(false);
  const [markLostSheetOpen, setMarkLostSheetOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, surveyorList] = await Promise.all([
        repository.listLeads({ sort: 'stale' }),
        repository.listUsers({ role: 'surveyor', status: 'active' }),
      ]);
      setLeads(list);
      setSurveyors(surveyorList);
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

  const cities = useMemo(() => [...new Set(leads.map((l) => l.city))].sort(), [leads]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads
      .filter((l) => activeStages.length === 0 || activeStages.includes(l.stage))
      .filter((l) => activeSources.length === 0 || activeSources.includes(l.source))
      .filter((l) => !city || l.city === city)
      .filter((l) => withinRange(l.createdAt, dateRange))
      .filter(
        (l) =>
          !needle ||
          l.contactName.toLowerCase().includes(needle) ||
          l.builderName.toLowerCase().includes(needle) ||
          l.siteName.toLowerCase().includes(needle) ||
          l.code.toLowerCase().includes(needle),
      );
  }, [leads, query, activeStages, activeSources, city, dateRange]);

  const summary = useMemo<LeadInboxSummary>(
    () => ({
      total: filtered.length,
      unassigned: filtered.filter((l) => !l.surveyorId).length,
      totalValue: filtered.reduce((sum, l) => sum + l.estimatedValue, 0),
    }),
    [filtered],
  );

  const toggleStage = useCallback((s: LeadStage) => {
    setActiveStages((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
    setVisibleCount(PAGE_SIZE);
  }, []);
  const toggleSource = useCallback((s: LeadSource) => {
    setActiveSources((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
    setVisibleCount(PAGE_SIZE);
  }, []);
  const clearFilters = useCallback(() => {
    setActiveStages([]);
    setActiveSources([]);
    setCity('');
    setDateRange('all');
    setQuery('');
    setVisibleCount(PAGE_SIZE);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const submitReassign = useCallback(
    async (toSurveyorId: string, reason: string) => {
      if (!user || selectedIds.size === 0 || !reason.trim()) return false;
      try {
        await repository.bulkReassignLeads([...selectedIds], toSurveyorId, reason.trim(), user.name);
        setReassignSheetOpen(false);
        clearSelection();
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [user, selectedIds, repository, clearSelection, load],
  );

  const submitMarkLost = useCallback(
    async (reasonKey: string) => {
      if (!user || selectedIds.size === 0) return false;
      try {
        await repository.bulkMarkLeadsLost([...selectedIds], { reasonKey, actorName: user.name });
        setMarkLostSheetOpen(false);
        clearSelection();
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [user, selectedIds, repository, clearSelection, load],
  );

  const exportSelected = useCallback(() => {
    const rows = selectedIds.size > 0 ? filtered.filter((l) => selectedIds.has(l.id)) : filtered;
    const header = ['code', 'stage', 'builderName', 'contactName', 'contactPhone', 'city', 'estimatedValue', 'source'];
    const csv = [
      header.join(','),
      ...rows.map((l) =>
        [l.code, l.stage, l.builderName, l.contactName, l.contactPhone, l.city, l.estimatedValue, l.source]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiec-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, selectedIds]);

  return {
    status,
    leads: filtered,
    visible: filtered.slice(0, visibleCount),
    hasMore: visibleCount < filtered.length,
    hasNoMatches: status === 'ready' && leads.length > 0 && filtered.length === 0,
    loadMore: () => setVisibleCount((c) => c + PAGE_SIZE),
    summary,
    cities,
    surveyors,
    query,
    setQuery: (v) => {
      setQuery(v);
      setVisibleCount(PAGE_SIZE);
    },
    activeStages,
    toggleStage,
    activeSources,
    toggleSource,
    city,
    setCity: (v) => {
      setCity(v);
      setVisibleCount(PAGE_SIZE);
    },
    dateRange,
    setDateRange: (v) => {
      setDateRange(v);
      setVisibleCount(PAGE_SIZE);
    },
    clearFilters,
    filtersActive: activeStages.length > 0 || activeSources.length > 0 || city !== '' || dateRange !== 'all' || query !== '',
    selectedIds,
    toggleSelect,
    clearSelection,
    quickView,
    openQuickView: setQuickView,
    closeQuickView: () => setQuickView(null),
    reassignSheetOpen,
    openReassignSheet: () => setReassignSheetOpen(true),
    closeReassignSheet: () => setReassignSheetOpen(false),
    submitReassign,
    markLostSheetOpen,
    openMarkLostSheet: () => setMarkLostSheetOpen(true),
    closeMarkLostSheet: () => setMarkLostSheetOpen(false),
    submitMarkLost,
    exportSelected,
    reload: load,
  };
}
