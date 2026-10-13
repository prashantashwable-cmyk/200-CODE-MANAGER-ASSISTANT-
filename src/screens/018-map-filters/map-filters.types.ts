/** Screen 018 — Map Filters & Layers Control Panel. Types and keys only. */

import type { AlertSeverity, LeadStage } from '@/data/types';

/**
 * Layer ids are shared with screen 011 through localStorage, so this list must
 * stay in step with the map's own. They are duplicated rather than imported
 * because screens do not reach into each other — the storage contract below is
 * the interface, not a shared module.
 */
export type LayerId = 'surveyors' | 'technicians' | 'leads' | 'jobs' | 'territories' | 'alerts';

export const ALL_LAYERS: LayerId[] = [
  'surveyors',
  'technicians',
  'leads',
  'jobs',
  'territories',
  'alerts',
];

export const ALL_STAGES: LeadStage[] = [
  'captured',
  'contacted',
  'site_visit',
  'quoted',
  'negotiation',
  'won',
  'lost',
];

export const ALL_SEVERITIES: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];

export type WindowId = 'today' | '7' | '30' | 'all';

export const ALL_WINDOWS: WindowId[] = ['today', '7', '30', 'all'];

/** The exact shape written to localStorage and read by the live map. */
export interface MapFilterState {
  layers: LayerId[];
  stages: LeadStage[];
  severities: AlertSeverity[];
  window: WindowId;
  /** Hide anyone who has not pinged recently, to declutter a busy map. */
  onlyOnDuty: boolean;
}

export const FILTERS_STORAGE_KEY = 'aiec.mapFilters';

export const DEFAULT_FILTERS: MapFilterState = {
  layers: ALL_LAYERS,
  stages: ALL_STAGES,
  severities: ALL_SEVERITIES,
  window: '30',
  onlyOnDuty: false,
};

export const MAP_FILTER_KEYS = {
  title: 'mapFilters.title',
  subtitle: 'mapFilters.subtitle',
  activeCount: 'mapFilters.activeCount',
  noneHidden: 'mapFilters.noneHidden',
  clearAll: 'mapFilters.clearAll',
  backToMap: 'mapFilters.backToMap',
  saved: 'mapFilters.saved',
  section: {
    layers: 'mapFilters.section.layers',
    stages: 'mapFilters.section.stages',
    severities: 'mapFilters.section.severities',
    window: 'mapFilters.section.window',
    people: 'mapFilters.section.people',
  },
  layer: {
    surveyors: 'mapFilters.layer.surveyors',
    technicians: 'mapFilters.layer.technicians',
    leads: 'mapFilters.layer.leads',
    jobs: 'mapFilters.layer.jobs',
    territories: 'mapFilters.layer.territories',
    alerts: 'mapFilters.layer.alerts',
  },
  window: {
    today: 'mapFilters.window.today',
    '7': 'mapFilters.window.7',
    '30': 'mapFilters.window.30',
    all: 'mapFilters.window.all',
  },
  onlyOnDuty: 'mapFilters.onlyOnDuty',
  onlyOnDutyHint: 'mapFilters.onlyOnDutyHint',
  emptyLayerWarning: 'mapFilters.emptyLayerWarning',
  preview: 'mapFilters.preview',
  previewCount: 'mapFilters.previewCount',
} as const;
