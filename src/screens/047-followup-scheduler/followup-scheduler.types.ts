/** Screen 047 — Follow-up Task Scheduler. Types and translation keys only. */

export type FollowupSchedulerStatus = 'loading' | 'ready' | 'error';

export type TaskBucket = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later';
export const TASK_BUCKETS: TaskBucket[] = ['overdue', 'today', 'tomorrow', 'thisWeek', 'later'];

/** Fixed taxonomy so a reschedule reason is always aggregable — the spec
 *  calls out spotting a territory's most common reschedule reason. */
export const RESCHEDULE_REASONS = ['customerNotReachable', 'customerRequestedDelay', 'internalWorkload', 'other'] as const;
export type RescheduleReason = (typeof RESCHEDULE_REASONS)[number];

export const FOLLOWUP_SCHEDULER_KEYS = {
  title: 'followupScheduler.title',
  subtitle: 'followupScheduler.subtitle',
  loading: 'followupScheduler.loading',
  error: { title: 'followupScheduler.error.title', body: 'followupScheduler.error.body' },
  empty: { title: 'followupScheduler.empty.title', body: 'followupScheduler.empty.body' },

  bucket: {
    overdue: 'followupScheduler.bucket.overdue',
    today: 'followupScheduler.bucket.today',
    tomorrow: 'followupScheduler.bucket.tomorrow',
    thisWeek: 'followupScheduler.bucket.thisWeek',
    later: 'followupScheduler.bucket.later',
  },
  autoTag: 'followupScheduler.autoTag',
  unavailableTag: 'followupScheduler.unavailableTag',
  dueOn: 'followupScheduler.dueOn',
  complete: 'followupScheduler.complete',
  reschedule: 'followupScheduler.reschedule',

  rescheduleSheet: {
    title: 'followupScheduler.rescheduleSheet.title',
    dateLabel: 'followupScheduler.rescheduleSheet.dateLabel',
    reasonLabel: 'followupScheduler.rescheduleSheet.reasonLabel',
    confirm: 'followupScheduler.rescheduleSheet.confirm',
  },
  reason: {
    customerNotReachable: 'followupScheduler.reason.customerNotReachable',
    customerRequestedDelay: 'followupScheduler.reason.customerRequestedDelay',
    internalWorkload: 'followupScheduler.reason.internalWorkload',
    other: 'followupScheduler.reason.other',
    leadClosed: 'followupScheduler.reason.leadClosed',
  },

  bulkBar: {
    selectedCount: 'followupScheduler.bulkBar.selectedCount',
    clear: 'followupScheduler.bulkBar.clear',
    reschedule: 'followupScheduler.bulkBar.reschedule',
    reassign: 'followupScheduler.bulkBar.reassign',
  },
  reassignSheet: {
    title: 'followupScheduler.reassignSheet.title',
    assigneeLabel: 'followupScheduler.reassignSheet.assigneeLabel',
    confirm: 'followupScheduler.reassignSheet.confirm',
  },
  toast: {
    completed: 'followupScheduler.toast.completed',
    rescheduled: 'followupScheduler.toast.rescheduled',
    reassigned: 'followupScheduler.toast.reassigned',
    error: 'followupScheduler.toast.error',
  },
} as const;
