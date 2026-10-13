/** Screen 020 — Route Optimization / Best-Match Suggestion Screen. */

import type { Job, Lead, Role, User } from '@/data/types';
import type { AssignmentBlock } from '@/data/repository';

export type SuggestStatus = 'loading' | 'ready' | 'empty' | 'error';

export type TaskKind = 'leadFollowUp' | 'jobAssignment';

export interface UnassignedTask {
  id: string;
  kind: TaskKind;
  title: string;
  address: string;
  location: { lat: number; lng: number };
  /** Skills a technician job needs matched, empty for a lead follow-up. */
  requiredSkills: string[];
  role: Role;
  lead?: Lead;
  job?: Job;
}

export interface Candidate {
  user: User;
  distanceKm: number;
  etaMinutes: number;
  currentWorkload: number;
  skillMatch: number;
  /** The single number candidates are ranked by — proximity, load and skill combined. */
  score: number;
  /** Any reason, read from the records, they cannot take this task. */
  unavailable: boolean;
  unavailableReason?: AssignmentBlock;
  isNewJoiner: boolean;
}

/** How much each factor counts toward the combined score, out of 1. */
export const SCORE_WEIGHTS = {
  proximity: 0.45,
  workload: 0.35,
  skill: 0.2,
};

/** Beyond this nobody is a sensible suggestion, however good their other numbers. */
export const MAX_REASONABLE_KM = 15;
export const AVERAGE_SPEED_KMH = 22;

export const ROUTE_OPTIMIZE_KEYS = {
  title: 'routeOptimize.title',
  subtitle: 'routeOptimize.subtitle',
  loading: 'routeOptimize.loading',
  mapLabel: 'routeOptimize.mapLabel',
  taskList: 'routeOptimize.taskList',
  candidates: 'routeOptimize.candidates',
  assign: 'routeOptimize.assign',
  assigning: 'routeOptimize.assigning',
  assigned: 'routeOptimize.assigned',
  alreadyAssigned: 'routeOptimize.alreadyAssigned',
  override: 'routeOptimize.override',
  overrideNote: 'routeOptimize.overrideNote',
  noneEligible: 'routeOptimize.noneEligible',
  noneEligibleBody: 'routeOptimize.noneEligibleBody',
  field: {
    distance: 'routeOptimize.field.distance',
    eta: 'routeOptimize.field.eta',
    workload: 'routeOptimize.field.workload',
    skillMatch: 'routeOptimize.field.skillMatch',
    score: 'routeOptimize.field.score',
  },
  reason: {
    not_active: 'routeOptimize.reason.not_active',
    leaving: 'routeOptimize.reason.leaving',
    training_incomplete: 'routeOptimize.reason.training_incomplete',
    tier_cannot_lead: 'routeOptimize.reason.tier_cannot_lead',
    day_off: 'routeOptimize.reason.day_off',
    booked_that_day: 'routeOptimize.reason.booked_that_day',
    missing_skill: 'routeOptimize.reason.missing_skill',
  },
  notOffered: 'routeOptimize.notOffered',
  tooFar: 'routeOptimize.tooFar',
  assignFailed: 'routeOptimize.assignFailed',
  newJoiner: 'routeOptimize.newJoiner',
  topPick: 'routeOptimize.topPick',
  kind: {
    leadFollowUp: 'routeOptimize.kind.leadFollowUp',
    jobAssignment: 'routeOptimize.kind.jobAssignment',
  },
  empty: { title: 'routeOptimize.empty.title', body: 'routeOptimize.empty.body' },
  error: { title: 'routeOptimize.error.title', body: 'routeOptimize.error.body' },
} as const;
