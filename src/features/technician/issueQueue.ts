/**
 * A problem reported without signal, pure (127). A report is written down on the phone with the moment it was found and sent when the
 * network allows; the screen shows it at once, marked as not yet sent, and the job as paused when it is a blocking or safety report.
 * Notes are queued the same way. Anything that needs the server's answer (resolving, changing severity) is not.
 */
import type { JobIssueView, JobIssuesView, ReportIssueInput, SopMediaInput } from '@/data/repository';

export type IssueQueueItem = { id: string; jobId: string; capturedAt: string } & (
  | { kind: 'report'; input: Omit<ReportIssueInput, 'capturedAt'>; media: Omit<SopMediaInput, 'capturedAt'>[]; takenAt: string[] }
  | { kind: 'note'; issueId: string; note: string }
);
export type IssueQueueInput = IssueQueueItem extends infer T ? (T extends unknown ? Omit<T, 'id' | 'jobId' | 'capturedAt'> : never) : never;

/** Lays the reports not yet sent over what the server last said. */
export function applyIssueQueue(view: JobIssuesView, queue: IssueQueueItem[], user: { id: string; name: string }): JobIssuesView {
  let issues = [...view.issues];
  let paused = view.paused;
  let statusOnHold = view.job.status === 'on_hold';
  for (const q of queue.filter((x) => x.jobId === view.job.id)) {
    if (q.kind === 'report') {
      const pausing = q.input.severity !== 'minor';
      const local: JobIssueView = {
        id: `local-${q.id}`,
        code: '…',
        jobId: view.job.id,
        jobCode: view.job.code,
        siteName: view.job.siteName,
        category: q.input.category,
        severity: q.input.severity,
        description: q.input.description.trim(),
        stepId: q.input.stepId ?? null,
        stepLabelKey: view.steps.find((s) => s.id === q.input.stepId)?.labelKey ?? null,
        sopGap: !!q.input.sopGap && !!q.input.stepId,
        evidence: q.media.map((m, n) => ({ id: `local-${q.id}-${n}`, slotId: 'issue', ...m, capturedAt: q.takenAt[n] ?? q.capturedAt, byUserId: user.id, byName: user.name })),
        status: 'open',
        groupId: q.input.linkTo ?? `local-${q.id}`,
        groupSize: 1,
        reportedByUserId: user.id,
        reportedByName: user.name,
        createdAt: q.capturedAt,
        resolution: null,
        events: [],
        mine: true,
        canResolve: false,
        canReopen: false,
        local: true,
      };
      issues = [local, ...issues];
      if (pausing && !statusOnHold) {
        paused = true;
        statusOnHold = true;
      }
    } else {
      issues = issues.map((i) => (i.id === q.issueId ? { ...i, events: [...i.events, { id: `local-${q.id}`, kind: 'note', at: q.capturedAt, byUserId: user.id, byName: user.name, byRole: 'technician', note: q.note }] } : i));
    }
  }
  return { ...view, issues, paused, job: { ...view.job, status: statusOnHold ? 'on_hold' : view.job.status } };
}
