/** Screen 014 — Technician Live Tracking Detail. Types and keys only. */

import type { Job, JobStep, User } from '@/data/types';

export type TechTrackStatus = 'loading' | 'ready' | 'notFound' | 'noJob' | 'error';

/**
 * The anomalies this screen exists to surface. Each is a specific, checkable
 * condition rather than a general "something looks off".
 */
export type TechAnomaly =
  /** Checked in but no visit is scheduled here today. */
  | 'unscheduledCheckIn'
  /** GPS is outside the site radius, so the check-in cannot be trusted. */
  | 'checkInOutOfRange'
  /** Left the site while a safety-critical step is still open. */
  | 'leftDuringCriticalStep'
  /** Checked out with SOP steps unfinished. */
  | 'checkoutIncomplete'
  /** A safety step is blocked because its evidence is missing. */
  | 'blockedStepNoEvidence'
  /** Still checked in from an earlier day: nobody has said when they left, so that time is not counted (125). */
  | 'visitUnconfirmed'
  | 'signalLost';

export interface AnomalyFinding {
  id: TechAnomaly;
  severity: 'critical' | 'high' | 'medium';
  /** Free-text specifics that do not belong in a translation file. */
  context: string;
}

/** A technician assigned to the same job — shown together, not on separate screens. */
export interface CrewMember {
  user: User;
  checkedIn: boolean;
  distanceMetres: number | null;
  minutesSincePing: number;
}

export interface TechTrackData {
  technician: User;
  job: Job | null;
  crew: CrewMember[];
  steps: JobStep[];
  currentStep: JobStep | null;
  completedSteps: number;
  evidenceCount: number;
  checkInAt: string | null;
  checkOutAt: string | null;
  hoursOnSite: number | null;
  distanceFromSiteMetres: number | null;
  minutesSincePing: number;
  anomalies: AnomalyFinding[];
}

/** A check-in further than this from the site address is not trusted. */
export const CHECKIN_RADIUS_METRES = 200;

/** Steps whose interruption is a safety matter, not a scheduling one. */
export const HIGH_RISK_STEP_IDS = ['s8', 's9'];

export const TRACK_TECH_KEYS = {
  title: 'trackTechnician.title',
  loading: 'trackTechnician.loading',
  mapLabel: 'trackTechnician.mapLabel',
  escalate: 'trackTechnician.escalate',
  safety: 'trackTechnician.safety',
  issues: 'trackTechnician.issues',
  openTimeline: 'trackTechnician.openTimeline',
  oneSourceNote: 'trackTechnician.oneSourceNote',
  stat: {
    checkIn: 'trackTechnician.stat.checkIn',
    checkOut: 'trackTechnician.stat.checkOut',
    hoursOnSite: 'trackTechnician.stat.hoursOnSite',
    stepProgress: 'trackTechnician.stat.stepProgress',
    evidence: 'trackTechnician.stat.evidence',
    stillOnSite: 'trackTechnician.stat.stillOnSite',
  },
  sop: {
    heading: 'trackTechnician.sop.heading',
    evidenceRequired: 'trackTechnician.sop.evidenceRequired',
    evidenceCount: 'trackTechnician.sop.evidenceCount',
    noEvidence: 'trackTechnician.sop.noEvidence',
  },
  crew: {
    heading: 'trackTechnician.crew.heading',
    checkedIn: 'trackTechnician.crew.checkedIn',
    notCheckedIn: 'trackTechnician.crew.notCheckedIn',
    away: 'trackTechnician.crew.away',
  },
  evidence: {
    heading: 'trackTechnician.evidence.heading',
    empty: 'trackTechnician.evidence.empty',
    note: 'trackTechnician.evidence.note',
  },
  anomaly: {
    heading: 'trackTechnician.anomaly.heading',
    unscheduledCheckIn: 'trackTechnician.anomaly.unscheduledCheckIn',
    checkInOutOfRange: 'trackTechnician.anomaly.checkInOutOfRange',
    leftDuringCriticalStep: 'trackTechnician.anomaly.leftDuringCriticalStep',
    checkoutIncomplete: 'trackTechnician.anomaly.checkoutIncomplete',
    blockedStepNoEvidence: 'trackTechnician.anomaly.blockedStepNoEvidence',
    visitUnconfirmed: 'trackTechnician.anomaly.visitUnconfirmed',
    signalLost: 'trackTechnician.anomaly.signalLost',
  },
  notFound: { title: 'trackTechnician.notFound.title', body: 'trackTechnician.notFound.body' },
  noJob: { title: 'trackTechnician.noJob.title', body: 'trackTechnician.noJob.body' },
  error: { title: 'trackTechnician.error.title', body: 'trackTechnician.error.body' },
  step: {
    siteReadiness: 'job.step.siteReadiness',
    materialsReceived: 'job.step.materialsReceived',
    guideRails: 'job.step.guideRails',
    machineMount: 'job.step.machineMount',
    carAssembly: 'job.step.carAssembly',
    doorOperator: 'job.step.doorOperator',
    wiringControl: 'job.step.wiringControl',
    safetyGearTest: 'job.step.safetyGearTest',
    loadTest: 'job.step.loadTest',
    finishHandover: 'job.step.finishHandover',
  },
} as const;
