/**
 * The defect / snag list's rules, pure (135). A snag is one finding that has to be put right before handover: every fail from the mechanical
 * and electrical checks lands here, and the inspector can add one the checklists do not cover. Three severities are read the same way
 * everywhere: safety-critical blocks handover structurally, functional and cosmetic do not. Nothing is closed by the person who fixed it: a
 * fix waits for QC to re-confirm it (the checklist's own re-test, or the inspector's verification of a snag the checklists do not cover).
 *
 * The due times are AIEC's own placeholders, kept in one place.
 */
import type { ReworkRequest } from '@/data/types';
import { days, hours } from '@/features/sla/clock';

export type SnagSeverity = 'safety_critical' | 'functional' | 'cosmetic';
export type SnagStatus = ReworkRequest['status'];
export const SEVERITIES: SnagSeverity[] = ['safety_critical', 'functional', 'cosmetic'];
export const severityRank = (s: SnagSeverity): number => SEVERITIES.indexOf(s);

export const TITLE_MIN = 3;
export const NOTE_MIN = 15;
export const REASON_MIN = 15;
export const DISPUTE_MIN = 20;
export const DECISION_MIN = 20;
export const WAIVER_NOTE_MIN = 8;

/** How long rework may take, by severity: a safety-critical one is treated as immediately urgent. */
export const REWORK_DUE: Record<SnagSeverity, number> = { safety_critical: hours(4), functional: days(3), cosmetic: days(7) };
/** How long a snag may sit without anyone being named to fix it. */
export const ASSIGN_DUE: Record<SnagSeverity, number> = { safety_critical: hours(4), functional: hours(24), cosmetic: days(3) };
/** QC re-verifies a fix within this, by severity. */
export const REVERIFY_DUE: Record<SnagSeverity, number> = { safety_critical: hours(4), functional: hours(24), cosmetic: days(2) };
export const DISPUTE_DECIDE_DUE = hours(24);

export const TERMINAL: SnagStatus[] = ['verified', 'waived', 'withdrawn'];
export const isOpen = (s: SnagStatus): boolean => !TERMINAL.includes(s);
/** An unresolved safety-critical snag stops handover, whatever else is true. */
export const blocksHandover = (s: { severity: SnagSeverity; status: SnagStatus }): boolean => s.severity === 'safety_critical' && isOpen(s.status);

/** A fail from the electrical and safety check is always safety-critical; one from the mechanical check is functional. */
export const severityOfSource = (source: ReworkRequest['source']): SnagSeverity => (source === 'qc_electrical' ? 'safety_critical' : 'functional');
/** Whether the checklist itself decides the snag's fate (its own re-test clears it) rather than a verification on the snag list. */
export const isChecklistSnag = (source: ReworkRequest['source']): boolean => source !== 'snag';

export type SnagProblem =
  | 'title_required' | 'note_required' | 'evidence_required' | 'reason_required' | 'cannot_lower' | 'not_cosmetic' | 'waiver_by_required' | 'waiver_note_required'
  | 'cannot_withdraw' | 'decision_note_required' | 'link_needs_two' | 'link_not_manual' | 'link_other_job' | 'link_closed' | 'primary_not_in_group' | 'link_note_required'
  | 'not_owner' | 'invalid_state' | 'not_ready_for_verification' | 'checklist_snag' | 'self_verify' | 'no_owner' | 'not_found' | 'forbidden';

export function raiseProblem(i: { title: string; note: string; severity: SnagSeverity; evidenceCount: number }): SnagProblem | null {
  if (i.title.trim().length < TITLE_MIN) return 'title_required';
  if (i.note.trim().length < NOTE_MIN) return 'note_required';
  if (i.severity === 'safety_critical' && i.evidenceCount < 1) return 'evidence_required';
  return null;
}

/** A checklist fail cannot be graded down from what its check is; anything else can be re-graded with a reason. */
export function regradeProblem(i: { source: ReworkRequest['source']; from: SnagSeverity; to: SnagSeverity; reason: string }): SnagProblem | null {
  if (i.reason.trim().length < REASON_MIN) return 'reason_required';
  if (isChecklistSnag(i.source) && severityRank(i.to) > severityRank(severityOfSource(i.source))) return 'cannot_lower';
  return null;
}

export type DisputeDecision = 'finding_stands' | 'retest_ordered' | 'finding_withdrawn';
/**
 * Admin's tie-break on a disputed finding. A checklist finding can only stand or be re-tested (the checklist's record is the truth and only a
 * passing re-test clears it); a safety-critical one can never be withdrawn. Only a snag raised on the list itself can be withdrawn.
 */
export function decisionProblem(i: { kind: DisputeDecision; note: string; source: ReworkRequest['source']; severity: SnagSeverity }): SnagProblem | null {
  if (i.note.trim().length < DECISION_MIN) return 'decision_note_required';
  if (i.kind === 'finding_withdrawn' && (isChecklistSnag(i.source) || i.severity === 'safety_critical')) return 'cannot_withdraw';
  return null;
}

/** A cosmetic finding the customer is content to live with, recorded as their choice and never as a defect that was fixed. */
export function waiveProblem(i: { severity: SnagSeverity; by: string; note: string }): SnagProblem | null {
  if (i.severity !== 'cosmetic') return 'not_cosmetic';
  if (i.by.trim().length < 2) return 'waiver_by_required';
  if (i.note.trim().length < WAIVER_NOTE_MIN) return 'waiver_note_required';
  return null;
}

/** Linking is for findings that share a root cause: snags raised on the list, on one job, still open. The primary is the one whose fix resolves the rest. */
export function linkProblem(i: { members: { id: string; jobId: string; source: ReworkRequest['source']; status: SnagStatus }[]; primaryId: string; note: string }): SnagProblem | null {
  if (i.members.length < 2) return 'link_needs_two';
  if (i.members.some((m) => m.source !== 'snag')) return 'link_not_manual';
  if (new Set(i.members.map((m) => m.jobId)).size > 1) return 'link_other_job';
  if (i.members.some((m) => !isOpen(m.status))) return 'link_closed';
  if (!i.members.some((m) => m.id === i.primaryId)) return 'primary_not_in_group';
  if (i.note.trim().length < WAIVER_NOTE_MIN) return 'link_note_required';
  return null;
}

/** Re-verification of a snag raised on the list: only once the fix is reported, by someone other than the person who fixed it. */
export function verifyProblem(i: { source: ReworkRequest['source']; status: SnagStatus; verifierId: string; fixedById?: string | null }): SnagProblem | null {
  if (isChecklistSnag(i.source)) return 'checklist_snag';
  if (i.status !== 'ready_for_retest') return 'not_ready_for_verification';
  if (i.fixedById && i.fixedById === i.verifierId) return 'self_verify';
  return null;
}

/** A technician's disagreement has to say why. */
export const disputeProblem = (reason: string): SnagProblem | null => (reason.trim().length < DISPUTE_MIN ? 'reason_required' : null);
