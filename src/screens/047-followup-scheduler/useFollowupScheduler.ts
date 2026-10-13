import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { FollowUpTask, Lead, User } from '@/data/types';
import type { FollowupSchedulerStatus, TaskBucket } from './followup-scheduler.types';
import { TASK_BUCKETS } from './followup-scheduler.types';

const POLL_MS = 30_000;
const DAY_MS = 86_400_000;

function bucketOf(task: FollowUpTask, now: number): TaskBucket {
  const due = new Date(task.dueDate).getTime();
  if (due < now) return 'overdue';
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const daysAhead = Math.floor((due - startOfToday) / DAY_MS);
  if (daysAhead <= 0) return 'today';
  if (daysAhead === 1) return 'tomorrow';
  if (daysAhead <= 7) return 'thisWeek';
  return 'later';
}

interface FollowupSchedulerState {
  status: FollowupSchedulerStatus;
  groups: Array<{ bucket: TaskBucket; tasks: FollowUpTask[] }>;
  leadOf: (leadId: string) => Lead | null;
  assigneeOf: (userId: string) => User | null;
  surveyors: User[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  completeTask: (id: string) => Promise<boolean>;
  rescheduleTask: (id: string, newDate: string, reasonKey: string) => Promise<boolean>;
  bulkReschedule: (newDate: string, reasonKey: string) => Promise<boolean>;
  bulkReassign: (assignedTo: string) => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the follow-up queue: auto-generated tasks from the stage-based rule
 * engine sit alongside manually created ones in one list, bucketed by due
 * date. `listFollowUpTasks` already auto-cancels any task whose lead closed
 * before it was actioned, so this screen never has to special-case that itself.
 */
export function useFollowupScheduler(): FollowupSchedulerState {
  const repository = useData();
  const [status, setStatus] = useState<FollowupSchedulerStatus>('loading');
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [surveyors, setSurveyors] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [taskList, leadList, surveyorList] = await Promise.all([
        repository.listFollowUpTasks({ status: ['open'] }),
        repository.listLeads(),
        repository.listUsers({ role: 'surveyor' }),
      ]);
      setTasks(taskList);
      setLeads(leadList);
      setSurveyors(surveyorList);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const groups = useMemo(() => {
    const now = Date.now();
    const byBucket = new Map<TaskBucket, FollowUpTask[]>(TASK_BUCKETS.map((b) => [b, []]));
    for (const task of tasks) {
      byBucket.get(bucketOf(task, now))?.push(task);
    }
    return TASK_BUCKETS.map((bucket) => ({ bucket, tasks: byBucket.get(bucket) ?? [] })).filter((g) => g.tasks.length > 0);
  }, [tasks]);

  const leadOf = useCallback((leadId: string) => leads.find((l) => l.id === leadId) ?? null, [leads]);
  const assigneeOf = useCallback((userId: string) => surveyors.find((u) => u.id === userId) ?? null, [surveyors]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const completeTask = useCallback(
    async (id: string) => {
      try {
        await repository.completeFollowUpTask(id);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  const rescheduleTask = useCallback(
    async (id: string, newDate: string, reasonKey: string) => {
      try {
        await repository.rescheduleFollowUpTask(id, newDate, reasonKey);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  const bulkReschedule = useCallback(
    async (newDate: string, reasonKey: string) => {
      if (selectedIds.size === 0) return false;
      try {
        await repository.bulkRescheduleFollowUpTasks([...selectedIds], newDate, reasonKey);
        setSelectedIds(new Set());
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, selectedIds, load],
  );

  const bulkReassign = useCallback(
    async (assignedTo: string) => {
      if (selectedIds.size === 0) return false;
      try {
        await repository.bulkReassignFollowUpTasks([...selectedIds], assignedTo);
        setSelectedIds(new Set());
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, selectedIds, load],
  );

  return {
    status,
    groups,
    leadOf,
    assigneeOf,
    surveyors,
    selectedIds,
    toggleSelect,
    clearSelection: () => setSelectedIds(new Set()),
    completeTask,
    rescheduleTask,
    bulkReschedule,
    bulkReassign,
    reload: load,
  };
}
