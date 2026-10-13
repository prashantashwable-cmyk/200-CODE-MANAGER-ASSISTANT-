import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { AutomationRule } from '@/data/types';
import { healthOf } from '@/features/automation/health';
import type { AutomationRow, ComponentHealth, FailureLogEntry, HealthStatus } from './automation-health.types';

const POLL_MS = 20_000;

interface AutomationHealthState {
  status: HealthStatus;
  rows: AutomationRow[];
  overall: ComponentHealth;
  retryingId: string | null;
  retry: (rule: AutomationRule) => Promise<void>;
  togglePause: (rule: AutomationRule) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Owns the single most important screen for the "one person monitors" model.
 *
 * A failed automated step never silently fails a business process — it always
 * lands in this visible retry queue. A component that has failed the same
 * record several times running is flagged as a stuck loop rather than left to
 * keep retrying forever, which is what an unattended retry loop would actually
 * do to a real system.
 */
export function useAutomationHealth(): AutomationHealthState {
  const repository = useData();
  const [status, setStatus] = useState<HealthStatus>('loading');
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({});

  const reload = useCallback(async () => {
    try {
      const list = await repository.listAutomations();
      setRules(list);
      setStatus(list.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  const rows = useMemo<AutomationRow[]>(() => {
    return rules.map((rule) => {
      const health = healthOf(rule);
      const uptimePct = rule.runsToday > 0 ? 1 - rule.failuresToday / Math.max(rule.runsToday, 1) : 1;

      // Only what was recorded: the last error the step itself reported (181's telemetry), never a reason picked for it.
      // A step failing several runs in a row (its status is `failing`) reads as stuck rather than one that will fix itself.
      const attempts = retryCounts[rule.id] ?? 0;
      const failures: FailureLogEntry[] =
        rule.failuresToday > 0
          ? [
              {
                id: `${rule.id}-last`,
                ruleId: rule.id,
                ruleName: rule.name,
                reasonText: rule.lastError ?? null,
                count: rule.failuresToday,
                at: rule.lastRunAt,
                isStuckLoop: rule.status === 'failing' || attempts >= 3,
              },
            ]
          : [];

      return { rule, health, uptimePct, failures };
    });
  }, [rules, retryCounts]);

  const overall = useMemo<ComponentHealth>(() => {
    if (rows.some((r) => r.health === 'down')) return 'down';
    if (rows.some((r) => r.health === 'degraded')) return 'degraded';
    if (rows.every((r) => r.health === 'paused')) return 'paused';
    return 'healthy';
  }, [rows]);

  const retry = useCallback(
    async (rule: AutomationRule) => {
      setRetryingId(rule.id);
      setRetryCounts((current) => ({ ...current, [rule.id]: (current[rule.id] ?? 0) + 1 }));
      try {
        // SIMULATED: there is no real automation runner to re-invoke in this
        // build. Re-enabling the rule stands in for a manual retry and is
        // reflected through the same repository call the pause toggle uses.
        await repository.toggleAutomation(rule.id, true);
        await reload();
      } finally {
        setRetryingId(null);
      }
    },
    [repository, reload],
  );

  const togglePause = useCallback(
    async (rule: AutomationRule) => {
      await repository.toggleAutomation(rule.id, !rule.enabled);
      await reload();
    },
    [repository, reload],
  );

  return { status, rows, overall, retryingId, retry, togglePause, reload };
}
