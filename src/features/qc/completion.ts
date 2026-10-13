/**
 * The Handover Completion Certificate's rules, pure (140). The certificate closes the project: it is issued once, it never changes, and it is
 * what sets the job to completed and triggers every final payout. What it needs first is kept here once, read by the screen and the repository alike.
 */
import { hours } from '@/features/sla/clock';
import { SIGNOFF_DUE_PRESENT, SIGNOFF_DUE_REMOTE } from '@/features/qc/walkthrough';

/** How long Admin has to issue it after everything it needs is in place (placeholder). */
export const ISSUE_DUE = hours(48);
export const WAIVE_REASON_MIN = 20;

export const MILESTONES = ['survey', 'quotation', 'contract', 'delivery', 'installation', 'qc', 'compliance', 'handover', 'warranty'] as const;
export type MilestoneId = (typeof MILESTONES)[number];

export type CompletionProblem = 'handover_not_ready' | 'walkthrough_not_done' | 'signoff_missing' | 'warranty_not_registered';
export type IssueProblem = CompletionProblem | 'already_issued' | 'waive_reason_required' | 'waive_not_allowed' | 'not_admin' | 'not_found' | 'forbidden' | 'invalid_state';

export interface ReadinessFacts {
  unlocked: boolean;
  conducted: { at: string } | null;
  mode: 'in_person' | 'video_call' | 'site_representative' | undefined;
  signedOff: boolean;
  warrantyRegistered: boolean;
}

/** When the customer's own sign-off is overdue: the point from which Admin may close the project without it, on the record. */
export function signoffDueAt(conductedAt: string, mode: ReadinessFacts['mode']): string {
  return new Date(new Date(conductedAt).getTime() + (mode === 'in_person' ? SIGNOFF_DUE_PRESENT : SIGNOFF_DUE_REMOTE)).toISOString();
}

export function readinessOf(f: ReadinessFacts, now: number): { problems: CompletionProblem[]; canWaiveSignoff: boolean; readyAt: string | null } {
  const problems: CompletionProblem[] = [];
  if (!f.unlocked) problems.push('handover_not_ready');
  if (!f.conducted) problems.push('walkthrough_not_done');
  if (f.conducted && !f.signedOff) problems.push('signoff_missing');
  if (!f.warrantyRegistered) problems.push('warranty_not_registered');
  const overdue = !!f.conducted && now >= new Date(signoffDueAt(f.conducted.at, f.mode)).getTime();
  // Only the customer's missing signature can be set aside, and only once it is overdue: nothing else about the project is optional.
  const canWaiveSignoff = problems.length === 1 && problems[0] === 'signoff_missing' && overdue;
  return { problems, canWaiveSignoff, readyAt: null };
}

export function issueProblem(i: { readiness: ReturnType<typeof readinessOf>; waiveReason?: string }): IssueProblem | null {
  const p = i.readiness.problems;
  const letters = (i.waiveReason ?? '').replace(/[^\p{L}\p{N}]/gu, '').length;
  if (p.length === 0) return null;
  if (i.readiness.canWaiveSignoff) return letters >= WAIVE_REASON_MIN ? null : 'waive_reason_required';
  return p[0];
}
