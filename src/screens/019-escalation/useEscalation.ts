import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { haversineKm } from '@/design-system';
import type { Alert } from '@/data/types';
import type { AlertEscalationView } from '@/data/repository';
import { ACK_DEADLINE_MS, CLUSTER_RADIUS_KM, CLUSTER_WINDOW_MS } from './escalation.types';
import type { EscalationEntry, EscalationStage, EscalationStatus } from './escalation.types';

interface EscalationState {
  status: EscalationStatus;
  open: EscalationEntry[];
  history: EscalationEntry[];
  acknowledge: (alert: Alert) => Promise<void>;
  resolve: (alert: Alert, note: string) => Promise<void>;
  busyId: string | null;
  reload: () => Promise<void>;
}

const POLL_MS = 15_000;

/** Where an alert sits on the Received → Acknowledged → Resolved track. */
function stageOf(alert: Alert): EscalationStage {
  if (alert.status === 'resolved') return 'resolved';
  if (alert.status === 'acknowledged') return 'acknowledged';
  return 'received';
}

/**
 * Owns the escalation queue.
 *
 * Two rules here are safety properties, not UI preferences. Nothing can be
 * dismissed — an alert only leaves the open list by being acknowledged and then
 * resolved with a written note. And resolved alerts are never removed, only
 * moved to history, because the history is what a safety audit reads.
 */
export function useEscalation(): EscalationState {
  const repository = useData();
  const { user } = useSession();

  const [status, setStatus] = useState<EscalationStatus>('loading');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chains, setChains] = useState<AlertEscalationView[]>([]);

  const reload = useCallback(async () => {
    try {
      const list = await repository.listAlerts();
      setAlerts(list);
      // How far each alert has climbed its chain (184) decides when it counts as overdue.
      setChains(user ? await repository.getAlertEscalations(user.id).catch(() => []) : []);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  const entries = useMemo<EscalationEntry[]>(() => {
    // Severity is the gate for this screen: it is for emergencies, not for
    // every routine exception, which lives on the alerts dashboard instead.
    const urgent = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high');

    return urgent.map((alert) => {
      // Several SOS signals from one small area at one time are probably one
      // larger incident, and should be read that way.
      const clusterWith = urgent
        .filter((other) => {
          if (other.id === alert.id) return false;
          if (!other.location || !alert.location) return false;
          const closeInSpace = haversineKm(alert.location, other.location) <= CLUSTER_RADIUS_KM;
          const closeInTime =
            Math.abs(new Date(alert.raisedAt).getTime() - new Date(other.raisedAt).getTime()) <=
            CLUSTER_WINDOW_MS;
          return closeInSpace && closeInTime;
        })
        .map((other) => other.code);

      const chain = chains.find((c) => c.alertId === alert.id);
      const waitMs = chain?.firstBackupAfterMinutes != null ? chain.firstBackupAfterMinutes * 60_000 : ACK_DEADLINE_MS;
      return {
        alert,
        stage: stageOf(alert),
        clusterWith,
        chain,
        overdueAcknowledgement: alert.status === 'open' && Date.now() - new Date(alert.raisedAt).getTime() > waitMs,
      };
    });
  }, [alerts, chains]);

  const acknowledge = useCallback(
    async (alert: Alert) => {
      setBusyId(alert.id);
      try {
        await repository.acknowledgeAlert(alert.id, user?.id ?? 'unknown');
        await reload();
      } finally {
        setBusyId(null);
      }
    },
    [repository, user?.id, reload],
  );

  const resolve = useCallback(
    async (alert: Alert, note: string) => {
      // A resolution without a note is not a resolution — it is a dismissal
      // wearing a different name, and this screen does not allow those.
      if (note.trim().length < 4) return;
      // Persisted through the repository so the 15s poll can't revert it.
      setBusyId(alert.id);
      try {
        await repository.resolveAlert(alert.id, user?.id ?? 'unknown', note);
        await reload();
      } finally {
        setBusyId(null);
      }
    },
    [repository, user?.id, reload],
  );

  const open = entries.filter((e) => e.stage !== 'resolved');
  const history = entries.filter((e) => e.stage === 'resolved');

  return {
    status: status === 'ready' && entries.length === 0 ? 'empty' : status,
    open,
    history,
    acknowledge,
    resolve,
    busyId,
    reload,
  };
}
