import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { OrphanRow, TransitBoard, TransitLine } from '@/data/repository';
import type { StockInTransitStatus, TransitGrouping, TransitTab, WindowFilter } from './stock-in-transit.types';
import { GROUPS_OPEN_BY_DEFAULT, POLL_MS, TRANSIT_TABS } from './stock-in-transit.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  kind?: 'redirect' | 'return';
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export interface TransitGroup {
  key: string;
  /** Already-resolved label parts: the view translates `labelKey` with `labelParams`, or shows `label` verbatim. */
  label?: string;
  labelKey?: string;
  labelParams?: Record<string, string>;
  lines: TransitLine[];
  value: number;
}

export interface DecisionDraft {
  kind: 'redirect' | 'return';
  toDealId: string;
  note: string;
}

export function useStockInTransit() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: TransitTab = TRANSIT_TABS.includes(tabParam as TransitTab) ? (tabParam as TransitTab) : 'stock';
  const setTab = (next: TransitTab) => setSearchParams(next === 'stock' ? {} : { tab: next }, { replace: true });

  const [status, setStatus] = useState<StockInTransitStatus>('loading');
  const [board, setBoard] = useState<TransitBoard | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getTransitBoard(user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a board that is already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  /* ------------------------------------------------------ filters + grouping */
  const [query, setQuery] = useState('');
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('all');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [grouping, setGrouping] = useState<TransitGrouping>('week');
  const filtered = windowFilter !== 'all' || supplierFilter !== '' || categoryFilter !== '' || query.trim() !== '';
  const clearFilters = () => {
    setQuery('');
    setWindowFilter('all');
    setSupplierFilter('');
    setCategoryFilter('');
  };

  const lines = useMemo(() => board?.lines ?? [], [board]);
  const suppliers = useMemo(() => [...new Map(lines.map((l) => [l.supplierId, l.supplierName])).entries()].map(([id, name]) => ({ id, name })), [lines]);
  const categories = useMemo(() => [...new Set(lines.map((l) => l.category))].sort(), [lines]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines
      .filter((l) => windowFilter === 'all' || l.window === windowFilter)
      .filter((l) => !supplierFilter || l.supplierId === supplierFilter)
      .filter((l) => !categoryFilter || l.category === categoryFilter)
      .filter((l) => !q || [l.description, l.siteName, l.supplierName, l.poCode, l.customerName].some((v) => v.toLowerCase().includes(q)));
  }, [lines, windowFilter, supplierFilter, categoryFilter, query]);

  const groups: TransitGroup[] = useMemo(() => {
    const map = new Map<string, TransitGroup>();
    const put = (key: string, base: Omit<TransitGroup, 'key' | 'lines' | 'value'>, line: TransitLine) => {
      const g = map.get(key) ?? { key, ...base, lines: [], value: 0 };
      g.lines.push(line);
      g.value += line.value;
      map.set(key, g);
    };
    for (const l of shown) {
      if (grouping === 'week') put(l.window === 'overdue' ? '0-overdue' : l.weekStart, l.window === 'overdue' ? { labelKey: 'overdue' } : { labelKey: 'weekOf', labelParams: { date: l.weekStart } }, l);
      else if (grouping === 'category') put(l.category, { labelKey: 'category', labelParams: { category: l.category } }, l);
      else if (grouping === 'site') put(l.dealId, { label: l.siteName }, l);
      else put(l.supplierId, { label: l.supplierName }, l);
    }
    const all = [...map.values()];
    // Weeks read in time order; every other grouping by what is at stake.
    return grouping === 'week' ? all.sort((a, b) => (a.key < b.key ? -1 : 1)) : all.sort((a, b) => b.value - a.value);
  }, [shown, grouping]);

  /* A handful of groups start open, so a big board reads as a summary. */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const isOpen = (g: TransitGroup, index: number) => openGroups[g.key] ?? index < GROUPS_OPEN_BY_DEFAULT;
  const toggleGroup = (g: TransitGroup, index: number) => setOpenGroups((cur) => ({ ...cur, [g.key]: !isOpen(g, index) }));
  const isExpanded = (g: TransitGroup) => !!expandedGroups[g.key];
  const toggleExpanded = (g: TransitGroup) => setExpandedGroups((cur) => ({ ...cur, [g.key]: !cur[g.key] }));

  /* --------------------------------------------------------- attention */
  const insights = useMemo(() => board?.insights ?? [], [board]);
  const orphans = useMemo(() => board?.orphans ?? [], [board]);
  const undecided = orphans.filter((o) => !o.resolution).length;
  const attentionCount = insights.length + undecided;

  const [deciding, setDeciding] = useState<OrphanRow | null>(null);
  const [decision, setDecision] = useState<DecisionDraft>({ kind: 'redirect', toDealId: '', note: '' });
  const startDecision = (row: OrphanRow) => {
    setDecision({ kind: 'redirect', toDealId: '', note: '' });
    setDeciding(row);
  };
  const patchDecision = (patch: Partial<DecisionDraft>) => setDecision((cur) => ({ ...cur, ...patch }));
  const canDecide = decision.kind === 'redirect' ? decision.toDealId !== '' : decision.note.trim().length >= 4;

  const resolve = async (): Promise<ActionResult> => {
    if (!user || !deciding || !canDecide) return { ok: false, code: 'invalid_input' };
    setBusy(true);
    try {
      await repository.resolveOrphanedPo(
        deciding.poId,
        decision.kind === 'redirect' ? { kind: 'redirect', toDealId: decision.toDealId, note: decision.note || undefined } : { kind: 'return', note: decision.note },
        user.id,
      );
      setDeciding(null);
      await load();
      return { ok: true, kind: decision.kind };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  return {
    status,
    board,
    reload,
    busy,
    tab,
    setTab,
    // stock
    query,
    setQuery,
    windowFilter,
    setWindowFilter,
    supplierFilter,
    setSupplierFilter,
    categoryFilter,
    setCategoryFilter,
    grouping,
    setGrouping,
    filtered,
    clearFilters,
    suppliers,
    categories,
    shown,
    groups,
    isOpen,
    toggleGroup,
    isExpanded,
    toggleExpanded,
    // attention
    insights,
    orphans,
    attentionCount,
    deciding,
    setDeciding,
    startDecision,
    decision,
    patchDecision,
    canDecide,
    resolve,
  };
}

export type StockInTransitState = ReturnType<typeof useStockInTransit>;
