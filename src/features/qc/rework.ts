/**
 * The rework assignment's rules, pure (136). Rework is a small installation task in its own right: the same evidence capture, the same job
 * context. Two things are structural, not a matter of discipline: marking it done only ever hands the snag to QC to re-check (never closes it),
 * and a safety-critical snag is urgent. A fix that turns out bigger than the snag says can raise its own severity, never lower it.
 */
import type { ReworkRequest } from '@/data/types';
import { severityRank } from '@/features/qc/snags';
import type { SnagSeverity } from '@/features/qc/snags';

export type Urgency = 'immediate' | 'standard' | 'relaxed';
export const urgencyOf = (s: SnagSeverity): Urgency => (s === 'safety_critical' ? 'immediate' : s === 'functional' ? 'standard' : 'relaxed');

export const NOTES_MIN = 15;
export const REASON_MIN = 8;
export const SCOPE_NOTE_MIN = 20;
export const PART_MIN = 3;
export const MAX_EVIDENCE = 6;

export type ReworkProblem = 'notes_required' | 'evidence_required' | 'reason_required' | 'scope_note_required' | 'cannot_lower' | 'part_required' | 'quantity_required' | 'invalid_state' | 'not_owner' | 'no_owner' | 'not_found' | 'forbidden';

/** Done means a note on what was done and a picture of it. It then waits for QC: nothing here can close the snag. */
export function completeProblem(i: { status: ReworkRequest['status']; notes: string; evidenceCount: number }): ReworkProblem | null {
  if (i.status !== 'assigned' && i.status !== 'in_progress') return 'invalid_state';
  if (i.notes.trim().length < NOTES_MIN) return 'notes_required';
  if (i.evidenceCount < 1) return 'evidence_required';
  return null;
}

/** Someone who cannot do it says why, and it goes back to be given to someone else. */
export const handBackProblem = (reason: string): ReworkProblem | null => (reason.trim().length < REASON_MIN ? 'reason_required' : null);

/** A reassignment of work already given needs a reason, so the new person and the record know why. */
export const reassignProblem = (i: { hasOwner: boolean; reason: string }): ReworkProblem | null => (i.hasOwner && i.reason.trim().length < REASON_MIN ? 'reason_required' : null);

/** The fix uncovered something bigger: the severity can go up, the scope is always explained, and neither goes down. */
export function escalateProblem(i: { from: SnagSeverity; to: SnagSeverity; note: string }): ReworkProblem | null {
  if (i.note.trim().length < SCOPE_NOTE_MIN) return 'scope_note_required';
  if (severityRank(i.to) > severityRank(i.from)) return 'cannot_lower';
  return null;
}

export function partProblem(i: { description: string; quantity: number }): ReworkProblem | null {
  if (i.description.trim().length < PART_MIN) return 'part_required';
  if (!Number.isInteger(i.quantity) || i.quantity < 1) return 'quantity_required';
  return null;
}

export type PartStatus = 'requested' | 'drafted' | 'ordered' | 'in_transit' | 'received';
/** Where a part stands, read from its purchase order each time; nothing is stored about it. */
export function partStatusOf(p: { poId?: string }, po: { status: string; lineDelivered: boolean; lineShipped: boolean } | null): PartStatus {
  if (!p.poId || !po) return 'requested';
  if (po.status !== 'sent') return 'drafted';
  if (po.lineDelivered) return 'received';
  return po.lineShipped ? 'in_transit' : 'ordered';
}
