/** Screen 019 — Emergency / Escalation Alert Screen. Types and keys only. */

import type { Alert } from '@/data/types';
import type { AlertEscalationView } from '@/data/repository';

export type EscalationStatus = 'loading' | 'ready' | 'empty' | 'error';

/** Received → Acknowledged → Resolved. Nothing skips a step. */
export type EscalationStage = 'received' | 'acknowledged' | 'resolved';

export const ESCALATION_STAGES: EscalationStage[] = ['received', 'acknowledged', 'resolved'];

export interface EscalationEntry {
  alert: Alert;
  stage: EscalationStage;
  /** Other alerts raised close by at nearly the same time. */
  clusterWith: string[];
  /** True once the acknowledgement window has passed with no response. */
  overdueAcknowledgement: boolean;
  /** How far the alert has climbed its chain (184); absent when nothing could be read. */
  chain?: AlertEscalationView;
}

/** Alerts within this distance and time of each other are one incident. */
export const CLUSTER_RADIUS_KM = 0.5;
export const CLUSTER_WINDOW_MS = 30 * 60 * 1000;

/** Used only for an alert the escalation matrix (184) has no chain for: no acknowledgement within this window reads as overdue. */
export const ACK_DEADLINE_MS = 10 * 60 * 1000;

/** A field SOS can be cancelled within this window before the admin is alerted. One number, shared with the button that sends it. */
export { SOS_CANCEL_WINDOW_S } from '@/features/safety/sos';

export const ESCALATION_KEYS = {
  title: 'escalation.title',
  subtitle: 'escalation.subtitle',
  loading: 'escalation.loading',
  mapLabel: 'escalation.mapLabel',
  liveCall: 'escalation.liveCall',
  acknowledge: 'escalation.acknowledge',
  resolve: 'escalation.resolve',
  resolveNote: 'escalation.resolveNote',
  resolveNoteHint: 'escalation.resolveNoteHint',
  resolveRequired: 'escalation.resolveRequired',
  resolved: 'escalation.resolved',
  acknowledged: 'escalation.acknowledged',
  stage: {
    received: 'escalation.stage.received',
    acknowledged: 'escalation.stage.acknowledged',
    resolved: 'escalation.stage.resolved',
  },
  stageMeta: {
    received: 'escalation.stageMeta.received',
    acknowledged: 'escalation.stageMeta.acknowledged',
    resolved: 'escalation.stageMeta.resolved',
  },
  cluster: 'escalation.cluster',
  clusterNote: 'escalation.clusterNote',
  overdue: 'escalation.overdue',
  chainProgress: 'escalation.chainProgress',
  chainOut: 'escalation.chainOut',
  chainNone: 'escalation.chainNone',
  chainLink: 'escalation.chainLink',
  safetyBanner: 'escalation.safetyBanner',
  history: 'escalation.history',
  historyNote: 'escalation.historyNote',
  cancelWindowNote: 'escalation.cancelWindowNote',
  noDismiss: 'escalation.noDismiss',
  raisedAt: 'escalation.raisedAt',
  category: 'escalation.category',
  empty: { title: 'escalation.empty.title', body: 'escalation.empty.body' },
  error: { title: 'escalation.error.title', body: 'escalation.error.body' },
} as const;
