/**
 * Problems reported from the field, pure (127). Not every real problem fits a checklist item, so this is the structured way out of the SOP:
 * the severity chosen decides what the system does (minor is noted and the work goes on; blocking pauses the work and tells Admin; safety
 * stops it now and escalates at once). Reports are never deleted; a report that stops mattering is resolved, not removed. Repeated reports
 * about the same step across different jobs are a signal that the procedure itself needs a look, and are surfaced as one.
 */
import type { IssueCategory, IssuePatternReview, IssueSeverity, JobIssue } from '@/data/types';
import { days, hours } from '@/features/sla/clock';

export const DESCRIPTION_MIN = 15;
export const NOTE_MIN = 8;
export const MAX_ATTACHMENTS = 4;
/** A resolved report can be reopened by its reporter this long (a problem that comes back is the same problem). Admin any time. */
export const REOPEN_WINDOW = hours(24);
/** How long an Admin has to resolve what pauses work: a safety stop is chased in hours, a blocked job by the next day. */
export const RESOLVE_TARGET: Record<'blocking' | 'safety', number> = { blocking: hours(24), safety: hours(4) };
/** A pattern is real once this many reports about one step come from at least this many different jobs within the window.
 *  Placeholder business decisions: two reports are a coincidence, three across two jobs is a habit. */
export const PATTERN_MIN_REPORTS = 3;
export const PATTERN_MIN_JOBS = 2;
export const PATTERN_WINDOW = days(90);
/** Reports on one job with the same category this close together look like the same problem to whoever reads them. */
export const RELATED_WINDOW = hours(48);

export const CATEGORIES: IssueCategory[] = ['parts', 'site_condition', 'customer_readiness', 'safety_concern', 'other'];
export const SEVERITIES: IssueSeverity[] = ['minor', 'blocking', 'safety'];

/** Blocking and safety pause the work; minor never does. */
export const pausesWork = (s: IssueSeverity): boolean => s !== 'minor';

/** A safety concern is always a safety report: it cannot be quietly filed as minor. */
export const minSeverityFor = (c: IssueCategory): IssueSeverity => (c === 'safety_concern' ? 'safety' : 'minor');
const RANK: Record<IssueSeverity, number> = { minor: 0, blocking: 1, safety: 2 };
export const severityAtLeast = (s: IssueSeverity, min: IssueSeverity) => RANK[s] >= RANK[min];

export type ReportProblem = 'description_required' | 'severity_too_low' | 'unknown_step' | 'too_many_attachments' | 'read_only' | 'job_finished';

export function reportProblem(input: { category: IssueCategory; severity: IssueSeverity; description: string; attachments: number }): ReportProblem | null {
  if (input.description.trim().length < DESCRIPTION_MIN) return 'description_required';
  if (!severityAtLeast(input.severity, minSeverityFor(input.category))) return 'severity_too_low';
  if (input.attachments > MAX_ATTACHMENTS) return 'too_many_attachments';
  return null;
}

/** Who may close a report: a safety stop is Admin's alone (a technician who has just walked away from a hazard does not clear it); the
 *  reporter or Admin may close anything else. */
export function canResolve(issue: Pick<JobIssue, 'severity' | 'reportedByUserId'>, role: 'technician' | 'admin', userId: string): boolean {
  if (role === 'admin') return true;
  return issue.severity !== 'safety' && issue.reportedByUserId === userId;
}

/** Whether the reporter may still reopen a resolved report (Admin always may). */
export function canReopen(issue: Pick<JobIssue, 'status' | 'resolution'>, role: 'technician' | 'admin', now: number): boolean {
  if (issue.status !== 'resolved' || !issue.resolution) return false;
  return role === 'admin' || now - new Date(issue.resolution.at).getTime() <= REOPEN_WINDOW;
}

/** Milliseconds a job's work has been paused by reports: overlapping pauses count once. This is what moves a job's expected completion. */
export function blockedMs(issues: Pick<JobIssue, 'severity' | 'createdAt' | 'status' | 'resolution'>[], now: number): number {
  const spans = issues
    .filter((i) => pausesWork(i.severity))
    .map((i) => [new Date(i.createdAt).getTime(), i.resolution ? new Date(i.resolution.at).getTime() : now] as [number, number])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  let total = 0;
  let curStart = 0;
  let curEnd = 0;
  for (const [a, b] of spans) {
    if (curEnd === 0) [curStart, curEnd] = [a, b];
    else if (a <= curEnd) curEnd = Math.max(curEnd, b);
    else {
      total += curEnd - curStart;
      [curStart, curEnd] = [a, b];
    }
  }
  return total + (curEnd ? curEnd - curStart : 0);
}

/** Open reports on the same job that look like this one (same category, close in time): offered as "the same problem?", never joined
 *  without the person saying so. */
export function relatedCandidates(open: Pick<JobIssue, 'id' | 'category' | 'createdAt' | 'groupId'>[], category: IssueCategory, at: number): string[] {
  return open.filter((i) => i.category === category && Math.abs(at - new Date(i.createdAt).getTime()) <= RELATED_WINDOW).map((i) => i.id);
}

export interface IssuePattern {
  stepId: string;
  reports: number;
  jobs: number;
  people: number;
  lastAt: string;
  /** The reports that raised it, newest first. */
  issueIds: string[];
  /** A review since the newest report says it has been looked at. */
  review: IssuePatternReview | null;
  needsReview: boolean;
}

/** Steps that keep being reported as a problem with the procedure. */
export function patternsOf(issues: JobIssue[], reviews: IssuePatternReview[], now: number): IssuePattern[] {
  const recent = issues.filter((i) => i.sopGap && i.stepId && now - new Date(i.createdAt).getTime() <= PATTERN_WINDOW);
  const byStep = new Map<string, JobIssue[]>();
  for (const i of recent) byStep.set(i.stepId as string, [...(byStep.get(i.stepId as string) ?? []), i]);
  return [...byStep.entries()]
    .map(([stepId, list]): IssuePattern => {
      const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const review = reviews.filter((r) => r.stepId === stepId).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
      // A pattern that was reviewed comes back only if enough new reports arrive after the review.
      const since = review ? sorted.filter((i) => i.createdAt > review.at) : sorted;
      const real = since.length >= PATTERN_MIN_REPORTS && new Set(since.map((i) => i.jobId)).size >= PATTERN_MIN_JOBS;
      return { stepId, reports: sorted.length, jobs: new Set(sorted.map((i) => i.jobId)).size, people: new Set(sorted.map((i) => i.reportedByUserId)).size, lastAt: sorted[0].createdAt, issueIds: sorted.map((i) => i.id), review, needsReview: real };
    })
    .filter((p) => p.needsReview || p.review !== null || p.reports >= 2)
    .sort((a, b) => Number(b.needsReview) - Number(a.needsReview) || b.reports - a.reports);
}

/** The counts by kind of problem over the window: what keeps going wrong, so the process can be improved rather than the reports just filed. */
export function categoryCounts(issues: JobIssue[], now: number): { category: IssueCategory; count: number }[] {
  const recent = issues.filter((i) => now - new Date(i.createdAt).getTime() <= PATTERN_WINDOW);
  return CATEGORIES.map((category) => ({ category, count: recent.filter((i) => i.category === category).length })).filter((x) => x.count > 0).sort((a, b) => b.count - a.count);
}
