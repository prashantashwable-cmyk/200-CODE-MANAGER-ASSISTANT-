import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { Lead, User } from '@/data/types';
import { SIGNIFICANCE_THRESHOLD } from './region-conversion.types';
import type { Axis, MatrixCell, MatrixStatus } from './region-conversion.types';

type SortBy = 'name' | 'rate' | 'volume';

interface RegionConversionState {
  status: MatrixStatus;
  axis: Axis;
  flip: () => void;
  sortBy: SortBy;
  setSortBy: (value: SortBy) => void;
  rowIds: string[];
  rowLabel: (id: string) => string;
  columnIds: string[];
  cellFor: (rowId: string, columnId: string) => MatrixCell | null;
  selectedCell: MatrixCell | null;
  selectCell: (cell: MatrixCell) => void;
  selectedLeads: Lead[];
  closeSheet: () => void;
  reload: () => Promise<void>;
}

/**
 * Owns the surveyor × region conversion matrix.
 *
 * This is read-only analysis, never a place to edit an underlying lead — the
 * hook exposes exactly one mutation-shaped action, `selectCell`, and it only
 * opens a drill-down list. A cell with zero leads renders as a genuine blank,
 * not a 0% that would read as poor performance the surveyor never had a chance
 * to produce.
 */
export function useRegionConversion(): RegionConversionState {
  const repository = useData();
  const [status, setStatus] = useState<MatrixStatus>('loading');
  const [axis, setAxis] = useState<Axis>('surveyorRows');
  const [sortBy, setSortBy] = useState<SortBy>('volume');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [surveyors, setSurveyors] = useState<User[]>([]);
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const [leadList, surveyorList] = await Promise.all([
        repository.listLeads(),
        repository.listUsers({ role: 'surveyor' }),
      ]);
      setLeads(leadList);
      setSurveyors(surveyorList.filter((u) => u.status === 'active'));
      setStatus(leadList.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const cells = useMemo<MatrixCell[]>(() => {
    const map = new Map<string, MatrixCell>();
    for (const surveyor of surveyors) {
      const own = leads.filter((l) => l.surveyorId === surveyor.id);
      const regionsCovered = [...new Set(own.map((l) => l.city))];
      for (const region of regionsCovered) {
        const regionLeads = own.filter((l) => l.city === region);
        const won = regionLeads.filter((l) => l.stage === 'won').length;
        const closed = regionLeads.filter((l) => l.stage === 'won' || l.stage === 'lost').length;
        map.set(`${surveyor.id}::${region}`, {
          surveyorId: surveyor.id,
          surveyorName: surveyor.name,
          region,
          leadCount: regionLeads.length,
          dealCount: won,
          rate: closed > 0 ? won / closed : 0,
          isBlank: false,
          significant: regionLeads.length >= SIGNIFICANCE_THRESHOLD,
        });
      }
    }
    return [...map.values()];
  }, [surveyors, leads]);

  const allRegions = useMemo(
    () => [...new Set(cells.map((c) => c.region))].sort((a, b) => a.localeCompare(b)),
    [cells],
  );

  const surveyorRowOrder = useMemo(() => {
    const list = [...surveyors];
    if (sortBy === 'name') return list.sort((a, b) => a.name.localeCompare(b.name));
    const totalFor = (id: string) => cells.filter((c) => c.surveyorId === id);
    if (sortBy === 'volume') {
      return list.sort(
        (a, b) =>
          totalFor(b.id).reduce((s, c) => s + c.leadCount, 0) -
          totalFor(a.id).reduce((s, c) => s + c.leadCount, 0),
      );
    }
    const rateFor = (id: string) => {
      const own = totalFor(id);
      const leadsSum = own.reduce((s, c) => s + c.leadCount, 0);
      const dealsSum = own.reduce((s, c) => s + c.dealCount, 0);
      return leadsSum > 0 ? dealsSum / leadsSum : 0;
    };
    return list.sort((a, b) => rateFor(b.id) - rateFor(a.id));
  }, [surveyors, cells, sortBy]);

  const rowIds = axis === 'surveyorRows' ? surveyorRowOrder.map((s) => s.id) : allRegions;
  const columnIds = axis === 'surveyorRows' ? allRegions : surveyorRowOrder.map((s) => s.id);

  const rowLabel = useCallback(
    (id: string) => (axis === 'surveyorRows' ? surveyors.find((s) => s.id === id)?.name ?? id : id),
    [axis, surveyors],
  );

  const cellFor = useCallback(
    (rowId: string, columnId: string): MatrixCell | null => {
      const surveyorId = axis === 'surveyorRows' ? rowId : columnId;
      const region = axis === 'surveyorRows' ? columnId : rowId;
      const found = cells.find((c) => c.surveyorId === surveyorId && c.region === region);
      if (found) return found;
      // A surveyor who covers only one region should show clean blanks for
      // every other region, not zeros implying poor performance there.
      return {
        surveyorId,
        surveyorName: surveyors.find((s) => s.id === surveyorId)?.name ?? surveyorId,
        region,
        leadCount: 0,
        dealCount: 0,
        rate: 0,
        isBlank: true,
        significant: false,
      };
    },
    [cells, surveyors, axis],
  );

  const selectedLeads = useMemo(() => {
    if (!selectedCell) return [];
    return leads.filter(
      (l) => l.surveyorId === selectedCell.surveyorId && l.city === selectedCell.region,
    );
  }, [selectedCell, leads]);

  return {
    status,
    axis,
    flip: () => setAxis((a) => (a === 'surveyorRows' ? 'regionRows' : 'surveyorRows')),
    sortBy,
    setSortBy,
    rowIds,
    rowLabel,
    columnIds,
    cellFor,
    selectedCell,
    selectCell: setSelectedCell,
    selectedLeads,
    closeSheet: () => setSelectedCell(null),
    reload,
  };
}
