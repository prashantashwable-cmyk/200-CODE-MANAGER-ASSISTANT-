import { hours } from '@/features/sla/clock';

export const COMPLAINT_CATEGORIES = ['defect', 'delay', 'payment', 'safety', 'conduct', 'other'] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
export type ComplaintStatus = 'open' | 'acknowledged' | 'resolved';
export type ComplaintOutcome = 'upheld' | 'not_upheld' | 'settled';
export const COMPLAINT_OUTCOMES: ComplaintOutcome[] = ['upheld', 'not_upheld', 'settled'];

export const TEXT_MIN = 15;
export const TEXT_MAX = 1000;
export const NOTE_MIN = 15;
export const REPLY_MIN = 15;
/** [ASSUMPTION] Time to acknowledge a complaint: 24 hours, 4 hours when it is about safety. The Owner confirms. */
export const ACK_HOURS = 24;
export const ACK_HOURS_SAFETY = 4;

export type ComplaintProblem = 'category_invalid' | 'text_short' | 'text_long' | 'not_open' | 'not_acknowledged' | 'locked' | 'outcome_invalid' | 'note_short' | 'reply_short' | 'already_replied';

export function raiseProblem(o: { category: string; text: string }): ComplaintProblem | null {
  if (!(COMPLAINT_CATEGORIES as readonly string[]).includes(o.category)) return 'category_invalid';
  const n = o.text.trim().length;
  return n < TEXT_MIN ? 'text_short' : n > TEXT_MAX ? 'text_long' : null;
}

/** The moment by which someone should have acknowledged the complaint. Read from the shared clock rules, never a local constant. */
export const ackDueAt = (category: ComplaintCategory, raisedAt: string): string => new Date(Date.parse(raisedAt) + hours(category === 'safety' ? ACK_HOURS_SAFETY : ACK_HOURS)).toISOString();
export const isAckOverdue = (c: { status: ComplaintStatus; ackDueAt: string }, now: number): boolean => c.status === 'open' && now > Date.parse(c.ackDueAt);

export function acknowledgeProblem(c: { status: ComplaintStatus }): ComplaintProblem | null {
  return c.status === 'resolved' ? 'locked' : c.status === 'open' ? null : 'not_open';
}
/** A complaint is resolved only after someone has acknowledged it, with an outcome and a note the customer can read. */
export function resolveProblem(c: { status: ComplaintStatus }, o: { outcome: string; note: string }): ComplaintProblem | null {
  if (c.status === 'resolved') return 'locked';
  if (c.status !== 'acknowledged') return 'not_acknowledged';
  if (!(COMPLAINT_OUTCOMES as string[]).includes(o.outcome)) return 'outcome_invalid';
  return o.note.trim().length < NOTE_MIN ? 'note_short' : null;
}

/** The partner a complaint names may answer it once, while it is not resolved. The reply is shown to the customer and to staff. */
export function replyProblem(c: { status: ComplaintStatus; partnerReply?: string }, text: string): ComplaintProblem | null {
  if (c.status === 'resolved') return 'locked';
  if (c.partnerReply) return 'already_replied';
  return text.trim().length < REPLY_MIN ? 'reply_short' : text.trim().length > TEXT_MAX ? 'text_long' : null;
}

/** Plain counts about a partner, with no hidden weighting: what was verified and closed, and how many complaints were upheld. */
export interface TrustSummary { verifiedMilestones: number; closedMilestones: number; complaintsRaised: number; complaintsUpheld: number; }
export const trustSummaryText = (s: TrustSummary): 'no_record' | 'clean' | 'watch' =>
  s.verifiedMilestones + s.complaintsRaised === 0 ? 'no_record' : s.complaintsUpheld === 0 ? 'clean' : 'watch';
