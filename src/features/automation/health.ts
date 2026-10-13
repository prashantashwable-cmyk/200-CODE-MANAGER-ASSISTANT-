/**
 * How the Automation Health Monitor (027) reads a rule's health, and how the dashboard (181) rolls it up by category. One function for both, so the two screens always
 * give the same answer for the same telemetry.
 */
import type { AutomationRule } from '@/data/types';

export type ComponentHealth = 'healthy' | 'degraded' | 'down' | 'paused';
/** Below this success rate today, a component reads as degraded rather than healthy. */
export const DEGRADED_THRESHOLD = 0.95;
/** Below this, it reads as down. */
export const DOWN_THRESHOLD = 0.5;

export function healthOf(rule: Pick<AutomationRule, 'enabled' | 'status' | 'runsToday' | 'failuresToday'>): ComponentHealth {
  if (!rule.enabled) return 'paused';
  if (rule.status === 'failing') return 'down';
  if (rule.status === 'degraded') return 'degraded';
  const successRate = rule.runsToday > 0 ? 1 - rule.failuresToday / rule.runsToday : 1;
  if (successRate < DOWN_THRESHOLD) return 'down';
  if (successRate < DEGRADED_THRESHOLD) return 'degraded';
  return 'healthy';
}

/** The worst of a group's members; a group where everything is paused reads paused, and an empty one reads healthy. */
export function rollUp(healths: ComponentHealth[]): ComponentHealth {
  if (healths.some((h) => h === 'down')) return 'down';
  if (healths.some((h) => h === 'degraded')) return 'degraded';
  if (healths.length > 0 && healths.every((h) => h === 'paused')) return 'paused';
  return 'healthy';
}
