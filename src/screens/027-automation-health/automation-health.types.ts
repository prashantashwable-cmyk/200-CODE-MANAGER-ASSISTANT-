/** Screen 027 — Automation Health Monitor. Types and translation keys only. */

import type { AutomationRule } from '@/data/types';

export type HealthStatus = 'loading' | 'ready' | 'empty' | 'error';

export type { ComponentHealth } from '@/features/automation/health';
import type { ComponentHealth } from '@/features/automation/health';

export interface FailureLogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  /** The error the step itself recorded, shown as written; null when none was kept. */
  reasonText: string | null;
  /** Failures today this line stands for. */
  count: number;
  at: string;
  /** Set once several failures in a row hit the same record — a stuck loop. */
  isStuckLoop: boolean;
}

export interface AutomationRow {
  rule: AutomationRule;
  health: ComponentHealth;
  uptimePct: number;
  failures: FailureLogEntry[];
}

/** The thresholds and the health rule are shared with the master dashboard (181): `@/features/automation/health`. */
export { DEGRADED_THRESHOLD, DOWN_THRESHOLD } from '@/features/automation/health';

export const AUTOMATION_HEALTH_KEYS = {
  title: 'automationHealth.title',
  subtitle: 'automationHealth.subtitle',
  loading: 'automationHealth.loading',
  overallHeading: 'automationHealth.overallHeading',
  status: {
    healthy: 'automationHealth.status.healthy',
    degraded: 'automationHealth.status.degraded',
    down: 'automationHealth.status.down',
    paused: 'automationHealth.status.paused',
  },
  uptime: 'automationHealth.uptime',
  runsToday: 'automationHealth.runsToday',
  failuresToday: 'automationHealth.failuresToday',
  lastRun: 'automationHealth.lastRun',
  avgLatency: 'automationHealth.avgLatency',
  retry: 'automationHealth.retry',
  retrying: 'automationHealth.retrying',
  retried: 'automationHealth.retried',
  pause: 'automationHealth.pause',
  resume: 'automationHealth.resume',
  failureLog: 'automationHealth.failureLog',
  noFailures: 'automationHealth.noFailures',
  stuckLoop: 'automationHealth.stuckLoop',
  stuckLoopNote: 'automationHealth.stuckLoopNote',
  pausedNeedsAttention: 'automationHealth.pausedNeedsAttention',
  fullCheckNote: 'automationHealth.fullCheckNote',
  fullCheckLink: 'automationHealth.fullCheckLink',
  reason: {
    recorded: 'automationHealth.reason.recorded',
    unrecorded: 'automationHealth.reason.unrecorded',
  },
  empty: { title: 'automationHealth.empty.title', body: 'automationHealth.empty.body' },
  error: { title: 'automationHealth.error.title', body: 'automationHealth.error.body' },
} as const;
