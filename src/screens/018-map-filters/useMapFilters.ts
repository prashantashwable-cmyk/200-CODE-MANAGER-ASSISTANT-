import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { AlertSeverity, LeadStage } from '@/data/types';
import {
  ALL_LAYERS,
  ALL_SEVERITIES,
  ALL_STAGES,
  DEFAULT_FILTERS,
  FILTERS_STORAGE_KEY,
} from './map-filters.types';
import type { LayerId, MapFilterState, WindowId } from './map-filters.types';

interface MapFiltersState {
  filters: MapFilterState;
  toggleLayer: (id: LayerId) => void;
  toggleStage: (stage: LeadStage) => void;
  toggleSeverity: (severity: AlertSeverity) => void;
  setWindow: (window: WindowId) => void;
  setOnlyOnDuty: (value: boolean) => void;
  clearAll: () => void;
  /** How many filters are narrowing the map right now. */
  activeCount: number;
  /** How many map items the current selection would show. */
  previewCount: number;
  loading: boolean;
}

function readStored(): MapFilterState {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<MapFilterState>;
    // Merge onto the defaults and drop anything unrecognised, so a saved set
    // from an older build cannot resurrect a layer that no longer exists.
    return {
      layers: (parsed.layers ?? DEFAULT_FILTERS.layers).filter((l) => ALL_LAYERS.includes(l)),
      stages: (parsed.stages ?? DEFAULT_FILTERS.stages).filter((s) => ALL_STAGES.includes(s)),
      severities: (parsed.severities ?? DEFAULT_FILTERS.severities).filter((s) =>
        ALL_SEVERITIES.includes(s),
      ),
      window: parsed.window ?? DEFAULT_FILTERS.window,
      onlyOnDuty: parsed.onlyOnDuty ?? DEFAULT_FILTERS.onlyOnDuty,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

/**
 * Owns the map's filter selection.
 *
 * This screen and the live map share state through localStorage rather than a
 * React context, because the map must keep working if this screen was never
 * opened. The stored shape is the contract between them.
 */
export function useMapFilters(): MapFiltersState {
  const repository = useData();
  const [filters, setFilters] = useState<MapFilterState>(readStored);
  const [counts, setCounts] = useState({ staff: 0, leads: 0, jobs: 0, alerts: 0, zones: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  // The preview count is real: it comes from the same data the map draws.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [users, leads, jobs, alerts, zones] = await Promise.all([
          repository.listUsers(),
          repository.listLeads(),
          repository.listJobs(),
          repository.listAlerts({ status: ['open'] }),
          repository.listZones(),
        ]);
        if (cancelled) return;

        const days = filters.window === 'today' ? 1 : filters.window === 'all' ? null : Number(filters.window);
        const cutoff = days === null ? 0 : Date.now() - days * 86_400_000;

        setCounts({
          staff: users.filter(
            (u) =>
              (u.role === 'surveyor' || u.role === 'technician') &&
              u.location &&
              (!filters.onlyOnDuty || u.onDuty),
          ).length,
          leads: leads.filter(
            (l) =>
              filters.stages.includes(l.stage) && new Date(l.createdAt).getTime() >= cutoff,
          ).length,
          jobs: jobs.filter((j) => j.status !== 'completed').length,
          alerts: alerts.filter((a) => filters.severities.includes(a.severity)).length,
          zones: zones.length,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repository, filters]);

  const toggleIn = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const previewCount = useMemo(() => {
    let total = 0;
    if (filters.layers.includes('surveyors') || filters.layers.includes('technicians')) {
      total += counts.staff;
    }
    if (filters.layers.includes('leads')) total += counts.leads;
    if (filters.layers.includes('jobs')) total += counts.jobs;
    if (filters.layers.includes('alerts')) total += counts.alerts;
    if (filters.layers.includes('territories')) total += counts.zones;
    return total;
  }, [filters, counts]);

  const activeCount =
    ALL_LAYERS.length -
    filters.layers.length +
    (ALL_STAGES.length - filters.stages.length) +
    (ALL_SEVERITIES.length - filters.severities.length) +
    (filters.window === 'all' ? 0 : 1) +
    (filters.onlyOnDuty ? 1 : 0);

  return {
    filters,
    toggleLayer: useCallback(
      (id) => setFilters((f) => ({ ...f, layers: toggleIn(f.layers, id) })),
      [],
    ),
    toggleStage: useCallback(
      (stage) => setFilters((f) => ({ ...f, stages: toggleIn(f.stages, stage) })),
      [],
    ),
    toggleSeverity: useCallback(
      (severity) => setFilters((f) => ({ ...f, severities: toggleIn(f.severities, severity) })),
      [],
    ),
    setWindow: useCallback((window) => setFilters((f) => ({ ...f, window })), []),
    setOnlyOnDuty: useCallback((value) => setFilters((f) => ({ ...f, onlyOnDuty: value })), []),
    clearAll: useCallback(() => setFilters(DEFAULT_FILTERS), []),
    activeCount,
    previewCount,
    loading,
  };
}
