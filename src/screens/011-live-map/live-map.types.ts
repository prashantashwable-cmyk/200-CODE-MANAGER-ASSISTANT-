/** Screen 011 — Live Map Dashboard. Types and translation keys only. */

import type { Alert, GeoZone, Job, Lead, Role, User } from '@/data/types';

/**
 * A live screen has more states than loading/error, and naming them is the
 * point: 'reconnecting' must look different from 'error', and both must look
 * different from a genuinely quiet map.
 */
export type LiveStatus = 'connecting' | 'live' | 'reconnecting' | 'error';

/**
 * What a field person is actually doing. 'lostSignal' is deliberately distinct
 * from 'idle' — someone whose phone died is not the same as someone taking a
 * break, and the spec requires that difference to be visible.
 */
export type StaffStatus = 'idle' | 'traveling' | 'onsite' | 'lostSignal';

export type LayerId = 'surveyors' | 'technicians' | 'leads' | 'jobs' | 'territories' | 'alerts';

export const ALL_LAYERS: LayerId[] = [
  'surveyors',
  'technicians',
  'leads',
  'jobs',
  'territories',
  'alerts',
];

export const LAYERS_STORAGE_KEY = 'aiec.mapFilters';

/** Pins refresh at least this often; anything slower feels dead. */
export const POLL_INTERVAL_MS = 15_000;
/** No ping for this long during working hours means the signal is lost. */
export const LOST_SIGNAL_MS = 20 * 60 * 1000;
/** Within this distance of a site, a person counts as on-site. */
export const ONSITE_RADIUS_KM = 0.15;
/** A jump further than this between pings is GPS noise, not travel. */
export const IMPLAUSIBLE_JUMP_KM = 2;

export interface StaffPin {
  user: User;
  status: StaffStatus;
  /** Smoothed position actually drawn, which may lag a noisy raw fix. */
  lat: number;
  lng: number;
  minutesSincePing: number;
  /** Lead or job this person is currently at, if any. */
  activeTaskLabel: string | null;
  activeTaskId: string | null;
}

/** Several people sharing a vehicle land on one coordinate — cluster them. */
export interface PinCluster {
  id: string;
  lat: number;
  lng: number;
  members: StaffPin[];
}

export interface LiveCounters {
  onDuty: number;
  leadsToday: number;
  jobsInProgress: number;
  alertsNeedingAttention: number;
  lostSignal: number;
}

export interface LiveMapData {
  staff: StaffPin[];
  clusters: PinCluster[];
  leads: Lead[];
  jobs: Job[];
  zones: GeoZone[];
  alerts: Alert[];
  counters: LiveCounters;
}

export const ROLE_GLYPH: Record<Role, string> = {
  surveyor: 'S',
  technician: 'T',
  admin: 'A',
  customer: 'C',
  supplier: 'P',
};

export const LIVE_MAP_KEYS = {
  title: 'liveMap.title',
  subtitle: 'liveMap.subtitle',
  mapLabel: 'liveMap.mapLabel',
  status: {
    connecting: 'liveMap.status.connecting',
    live: 'liveMap.status.live',
    reconnecting: 'liveMap.status.reconnecting',
    error: 'liveMap.status.error',
    updatedAgo: 'liveMap.status.updatedAgo',
  },
  counter: {
    onDuty: 'liveMap.counter.onDuty',
    leadsToday: 'liveMap.counter.leadsToday',
    jobsInProgress: 'liveMap.counter.jobsInProgress',
    alerts: 'liveMap.counter.alerts',
    lostSignal: 'liveMap.counter.lostSignal',
  },
  layer: {
    heading: 'liveMap.layer.heading',
    surveyors: 'liveMap.layer.surveyors',
    technicians: 'liveMap.layer.technicians',
    leads: 'liveMap.layer.leads',
    jobs: 'liveMap.layer.jobs',
    territories: 'liveMap.layer.territories',
    alerts: 'liveMap.layer.alerts',
    manage: 'liveMap.layer.manage',
  },
  staffStatus: {
    idle: 'liveMap.staffStatus.idle',
    traveling: 'liveMap.staffStatus.traveling',
    onsite: 'liveMap.staffStatus.onsite',
    lostSignal: 'liveMap.staffStatus.lostSignal',
  },
  card: {
    timeOnSite: 'liveMap.card.timeOnSite',
    lastPing: 'liveMap.card.lastPing',
    noTask: 'liveMap.card.noTask',
    viewDetail: 'liveMap.card.viewDetail',
    call: 'liveMap.card.call',
    message: 'liveMap.card.message',
    clusterTitle: 'liveMap.card.clusterTitle',
    clusterBody: 'liveMap.card.clusterBody',
  },
  empty: { title: 'liveMap.empty.title', body: 'liveMap.empty.body' },
  error: { title: 'liveMap.error.title', body: 'liveMap.error.body' },
  loading: 'liveMap.loading',
  activityLink: 'liveMap.activityLink',
  schematicNote: 'liveMap.schematicNote',
} as const;
