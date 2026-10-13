import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Alert, AlertSeverity, User } from '@/data/types';
import { SEVERITY_ORDER } from './alerts-board.types';
import type { AgeFilter, BoardStatus, ExceptionRow } from './alerts-board.types';

const POLL_MS = 20_000;

interface AlertsBoardState {
  status: BoardStatus;
  showResolved: boolean;
  setShowResolved: (value: boolean) => void;
  ageFilter: AgeFilter;
  setAgeFilter: (value: AgeFilter) => void;
  categories: string[];
  activeCategories: string[];
  toggleCategory: (category: string) => void;
  rows: ExceptionRow[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  bulkAcknowledge: () => Promise<void>;
  snooze: (alert: Alert, hours: number) => Promise<boolean>;
  delegate: (alert: Alert, toUserId: string) => Promise<boolean>;
  /** Active staff an alert can be handed to (Admin, surveyors, technicians), for the delegate picker and names. */
  staff: User[];
  reload: () => Promise<void>;
}

/**
 * Owns the consolidated exception queue — the deliberate single home for
 * everything the automation could not fully resolve on its own.
 *
 * Default sort is severity first, always, regardless of recency: a five-
 * minute-old critical alert outranks a two-day-old low one, because a bad day
 * is exactly when sorting by recency would bury the thing that matters most.
 */
export function useAlertsBoard(): AlertsBoardState {
  const repository = useData();
  const { user } = useSession();

  const [status, setStatus] = useState<BoardStatus>('loading');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [staff, setStaff] = useState<User[]>([]);

  const reload = useCallback(async () => {
    try {
      const [list, people] = await Promise.all([repository.listAlerts(), repository.listUsers({ status: 'active' })]);
      setAlerts(list);
      setStaff(people.filter((u) => u.role === 'admin' || u.role === 'surveyor' || u.role === 'technician'));
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

  const categories = useMemo(() => [...new Set(alerts.map((a) => a.category))], [alerts]);

  const rows = useMemo<ExceptionRow[]>(() => {
    const now = Date.now();
    const visible = alerts
      .filter((a) => (showResolved ? a.status === 'resolved' : a.status !== 'resolved'))
      .filter((a) => activeCategories.length === 0 || activeCategories.includes(a.category))
      .filter((a) => {
        // Snoozes are kept on the alert itself, so every Admin and every device sees the same board.
        return !a.snoozedUntil || new Date(a.snoozedUntil).getTime() <= now;
      })
      .filter((a) => {
        if (ageFilter === 'all') return true;
        const ageMs = now - new Date(a.raisedAt).getTime();
        return ageFilter === '24h' ? ageMs <= 24 * 3_600_000 : ageMs <= 7 * 86_400_000;
      });

    return visible
      .map((alert) => {
        // Two exceptions pointing at the same underlying record are linked
        // rather than shown as unrelated — e.g. a failed auto-payment retry
        // and the overdue-payment flag it also produced.
        const relatedIds = visible
          .filter((other) => other.id !== alert.id && other.relatedId && other.relatedId === alert.relatedId)
          .map((other) => other.code);
        return {
          alert,
          ageHours: Math.round((now - new Date(alert.raisedAt).getTime()) / 3_600_000),
          relatedIds,
        };
      })
      .sort((a, b) => {
        const sevDiff = SEVERITY_ORDER.indexOf(a.alert.severity) - SEVERITY_ORDER.indexOf(b.alert.severity);
        // Severity always wins, regardless of how recent either alert is.
        if (sevDiff !== 0) return sevDiff;
        return b.ageHours - a.ageHours;
      });
  }, [alerts, showResolved, activeCategories, ageFilter]);

  const toggleCategory = useCallback((category: string) => {
    setActiveCategories((current) =>
      current.includes(category) ? current.filter((c) => c !== category) : [...current, category],
    );
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((i) => i !== id) : [...current, id]));
  }, []);

  const bulkAcknowledge = useCallback(async () => {
    if (selectedIds.length === 0) return;
    await Promise.all(selectedIds.map((id) => repository.acknowledgeAlert(id, user?.id ?? 'unknown')));
    setSelectedIds([]);
    await reload();
  }, [selectedIds, repository, user?.id, reload]);

  const snooze = useCallback(
    async (alert: Alert, hours: number) => {
      if (!user) return false;
      try {
        await repository.snoozeAlert(alert.id, hours, user.id);
        await reload();
        return true;
      } catch {
        return false;
      }
    },
    [repository, user, reload],
  );

  const delegate = useCallback(
    async (alert: Alert, toUserId: string) => {
      if (!user) return false;
      try {
        await repository.delegateAlert(alert.id, toUserId, user.id);
        await reload();
        return true;
      } catch {
        return false;
      }
    },
    [repository, user, reload],
  );

  return {
    status,
    showResolved,
    setShowResolved,
    ageFilter,
    setAgeFilter,
    categories,
    activeCategories,
    toggleCategory,
    rows,
    selectedIds,
    toggleSelect,
    bulkAcknowledge,
    snooze,
    delegate,
    staff,
    reload,
  };
}
