/** Screen 013 — Surveyor Live Tracking Detail. Types and keys only. */

import type { GeoPoint, Lead, RouteStop, SiteVisitVerification, User } from '@/data/types';

export type TrackStatus = 'loading' | 'ready' | 'notFound' | 'beforeJoining' | 'empty' | 'error';

/** A stop on the day, enriched with what the admin actually needs to judge it. */
export interface VisitEntry {
  id: string;
  label: string;
  address: string;
  location: GeoPoint;
  arrivedAt: string | null;
  minutesOnSite: number | null;
  /** Unusually long on one site: a big survey, or an idle afternoon. */
  isOutlier: boolean;
  photoCount: number;
  leadCode: string | null;
  /** Set when this visit tripped the site-verification checks. */
  flagged: boolean;
  flagReason?: string;
  status: RouteStop['status'];
}

export interface DailyStats {
  distanceKm: number;
  leadsCaptured: number;
  averageMinutesPerSite: number | null;
  duplicateFlagged: number;
  stopsDone: number;
  stopsTotal: number;
}

/** A stretch of the day's path, split so poor-accuracy runs can be drawn faintly. */
export interface PathSegment {
  id: string;
  points: GeoPoint[];
  lowAccuracy: boolean;
}

/** Anything longer than this at one address is worth an admin's eye. */
export const OUTLIER_MINUTES = 90;

export const TRACK_SURVEYOR_KEYS = {
  title: 'trackSurveyor.title',
  loading: 'trackSurveyor.loading',
  mapLabel: 'trackSurveyor.mapLabel',
  datePicker: 'trackSurveyor.datePicker',
  readOnlyNote: 'trackSurveyor.readOnlyNote',
  lastSeen: 'trackSurveyor.lastSeen',
  signalLost: 'trackSurveyor.signalLost',
  lowAccuracyNote: 'trackSurveyor.lowAccuracyNote',
  stat: {
    distance: 'trackSurveyor.stat.distance',
    leads: 'trackSurveyor.stat.leads',
    avgPerSite: 'trackSurveyor.stat.avgPerSite',
    flagged: 'trackSurveyor.stat.flagged',
    progress: 'trackSurveyor.stat.progress',
  },
  visits: {
    heading: 'trackSurveyor.visits.heading',
    onSite: 'trackSurveyor.visits.onSite',
    notArrived: 'trackSurveyor.visits.notArrived',
    outlier: 'trackSurveyor.visits.outlier',
    photos: 'trackSurveyor.visits.photos',
    flagged: 'trackSurveyor.visits.flagged',
  },
  contact: {
    call: 'trackSurveyor.contact.call',
    whatsapp: 'trackSurveyor.contact.whatsapp',
    message: 'trackSurveyor.contact.message',
  },
  notFound: { title: 'trackSurveyor.notFound.title', body: 'trackSurveyor.notFound.body' },
  beforeJoining: {
    title: 'trackSurveyor.beforeJoining.title',
    body: 'trackSurveyor.beforeJoining.body',
  },
  empty: { title: 'trackSurveyor.empty.title', body: 'trackSurveyor.empty.body' },
  error: { title: 'trackSurveyor.error.title', body: 'trackSurveyor.error.body' },
} as const;

export interface TrackSurveyorData {
  surveyor: User;
  visits: VisitEntry[];
  stats: DailyStats;
  segments: PathSegment[];
  leads: Lead[];
  verifications: SiteVisitVerification[];
  minutesSincePing: number;
}
