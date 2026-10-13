import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { MyWork, ReliabilityScore, WorkNotificationView } from '@/data/repository';
import type { AutomatedActionLogEntry, Role } from '@/data/types';

export type AssistantStatus = 'loading' | 'ready' | 'error';

interface AssistantDrawerState {
  status: AssistantStatus;
  work: MyWork | null;
  notifications: WorkNotificationView[];
  /** Ids that were unread when the drawer opened — shown as new this time. */
  freshIds: Set<string>;
  reliability: ReliabilityScore | null;
  doneForYou: AutomatedActionLogEntry[];
  busyCommitmentId: string | null;
  runQuickAction: (commitmentId: string) => Promise<boolean>;
  reload: () => Promise<void>;
}

const UPDATES_SHOWN = 5;
const DONE_FOR_YOU_SHOWN = 8;

/**
 * Everything the assistant shows one person: their own promises, anything
 * of someone else's that escalated to them, recent updates, and — for Admin,
 * who owns the automations — what the system did without being asked.
 */
export function useAssistantDrawer(
  open: boolean,
  userId: string | undefined,
  role: Role | null,
  tick: number,
  onRead: () => void,
): AssistantDrawerState {
  const repository = useData();
  const [status, setStatus] = useState<AssistantStatus>('loading');
  const [work, setWork] = useState<MyWork | null>(null);
  const [notifications, setNotifications] = useState<WorkNotificationView[]>([]);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [reliability, setReliability] = useState<ReliabilityScore | null>(null);
  const [doneForYou, setDoneForYou] = useState<AutomatedActionLogEntry[]>([]);
  const [busyCommitmentId, setBusyCommitmentId] = useState<string | null>(null);

  const load = useCallback(
    async (markRead: boolean) => {
      if (!userId) return;
      try {
        const [nextWork, nextNotifications, nextReliability, nextActions] = await Promise.all([
          repository.listMyWork(userId),
          repository.listWorkNotifications(userId),
          repository.getReliability(userId),
          role === 'admin' ? repository.listAutomatedActions(DONE_FOR_YOU_SHOWN * 5) : Promise.resolve([]),
        ]);
        setWork(nextWork);
        setNotifications(nextNotifications.slice(0, UPDATES_SHOWN));
        setReliability(nextReliability);
        // The engine's own nudges and escalations already show as Updates;
        // "done for you" is the business work it did — sends, invoices, orders.
        setDoneForYou(nextActions.filter((a) => !a.sourceKey.startsWith('followup.')).slice(0, DONE_FOR_YOU_SHOWN));
        const unread = nextNotifications.filter((n) => !n.notification.readAt).map((n) => n.notification.id);
        if (unread.length > 0) {
          setFreshIds((current) => new Set([...current, ...unread]));
          if (markRead) {
            await repository.markWorkNotificationsRead(userId);
            onRead();
          }
        }
        setStatus('ready');
      } catch {
        setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
      }
    },
    [repository, userId, role, onRead],
  );

  useEffect(() => {
    if (!open) {
      setFreshIds(new Set());
      return;
    }
    setStatus((current) => (current === 'ready' ? 'ready' : 'loading'));
    // Opening the drawer is reading it.
    void load(true);
  }, [open, load]);

  // A heartbeat while it's open brings new items in without a reopen.
  useEffect(() => {
    if (open && tick > 0) void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const runQuickAction = useCallback(
    async (commitmentId: string) => {
      if (!userId) return false;
      setBusyCommitmentId(commitmentId);
      try {
        await repository.completeCommitmentQuickAction(commitmentId, userId);
        await load(false);
        return true;
      } catch {
        return false;
      } finally {
        setBusyCommitmentId(null);
      }
    },
    [repository, userId, load],
  );

  return {
    status,
    work,
    notifications,
    freshIds,
    reliability,
    doneForYou,
    busyCommitmentId,
    runQuickAction,
    reload: () => load(false),
  };
}
