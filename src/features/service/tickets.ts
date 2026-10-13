/**
 * Service tickets, pure (175). One set of rules the screen and the repository both read: how a request is triaged (automatically where it is clear, to a person where it is not),
 * how soon the customer is told they will hear back, what a visit and a claim decision must say, and the order a ticket moves in. **Every threshold and word list is a placeholder
 * for the owner to confirm, flagged on screen.**
 */
import type { TicketCategory, TicketCoverage, TicketCoverageState, TicketImpact, TicketResponsibility, TicketStatus, TicketUrgency, TicketRoute, VisitOutcome } from '@/data/types';
import { days, hours, minutes } from '@/features/sla/clock';

export const CATEGORIES: TicketCategory[] = ['emergency', 'safety', 'fault', 'billing', 'general'];
export const IMPACTS: TicketImpact[] = ['out_of_service', 'working_badly', 'minor'];
export const RESPONSIBILITIES: TicketResponsibility[] = ['aiec_installation', 'manufacturer_defect', 'customer_misuse', 'normal_wear'];
export const OUTCOMES: VisitOutcome[] = ['fixed', 'needs_parts', 'needs_followup', 'no_fault_found', 'unsafe_shut_down'];
export const WINDOWS: ('morning' | 'afternoon')[] = ['morning', 'afternoon'];
export const WINDOW_END_HOUR = { morning: 13, afternoon: 18 } as const;

/** A request this short and with no category is "vague": it still goes somewhere sensible, to a person (placeholder). */
export const VAGUE_WORDS = 6;
export const MIN_DESCRIPTION = 15;
/** A general or "not sure" request may be very short: a person will ask for more, so the customer is never made to explain more than they can. */
export const MIN_GENERAL = 5;
export const minLettersFor = (c: TicketCategory | null): number => (c === 'general' ? MIN_GENERAL : MIN_DESCRIPTION);
export const MAX_DESCRIPTION = 2000;
export const MAX_ATTACHMENTS = 6;
export const MIN_NOTE = 15;
export const CLAIM_NOTE_MIN = 20;
/** The customer may reopen a resolved request for this long. */
export const REOPEN_WINDOW = days(7);
export const VISIT_HORIZON_DAYS = 60;

/** Words that, whatever box was ticked, mean a person should look at once (placeholder list: English, Hindi and Marathi, in script and as typed in Latin letters). */
export const SAFETY_WORDS = [
  'stuck', 'trapped', 'stranded', 'fire', 'smoke', 'burning', 'burnt', 'spark', 'shock', 'free fall', 'freefall', 'fell', 'dropped', 'falling', 'grinding', 'screech', 'jerk', 'door open', 'opens while', 'injur', 'bleed', 'snapped',
  'फँस', 'फंस', 'आग', 'धुआं', 'धुआँ', 'चिंगारी', 'करंट', 'झटका', 'गिर', 'घायल', 'चोट',
  'अडकल', 'अडकली', 'अडकलो', 'धूर', 'ठिणग', 'शॉक', 'पडल', 'जखमी', 'दुखापत',
  'fas gaya', 'fasa', 'adkal', 'aag', 'dhuan', 'dhur',
];
export function safetyWordsIn(text: string): string[] {
  const hay = text.toLowerCase();
  return SAFETY_WORDS.filter((w) => hay.includes(w));
}
const wordCount = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;
export const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;

export interface TriageInput { category: TicketCategory | null; impact: TicketImpact | null; text: string; claim: boolean; coverage: TicketCoverageState }
export interface Triage {
  category: TicketCategory;
  urgency: TicketUrgency;
  route: TicketRoute;
  confidence: 'confident' | 'needs_human';
  reason: 'vague' | 'safety_words' | 'general' | 'claim' | null;
  words: string[];
  /** Responsibility is unclear (the customer says it is covered): Admin investigates from the installation's evidence trail, and nothing is decided automatically. */
  claimReview: boolean;
}
const URGENCY_ORDER: TicketUrgency[] = ['low', 'normal', 'high', 'emergency'];
const atLeast = (u: TicketUrgency, floor: TicketUrgency): TicketUrgency => (URGENCY_ORDER.indexOf(u) >= URGENCY_ORDER.indexOf(floor) ? u : floor);

/** Automated where confident, a person where it genuinely is not: the same idea as lead scoring and applicant screening. */
export function triageOf(i: TriageInput): Triage {
  const category = i.category ?? 'general';
  const words = safetyWordsIn(i.text);
  if (category === 'emergency') return { category, urgency: 'emergency', route: 'emergency', confidence: 'confident', reason: null, words, claimReview: false };
  let urgency: TicketUrgency = category === 'safety' ? 'high' : category === 'fault' ? (i.impact === 'out_of_service' ? 'high' : i.impact === 'minor' ? 'low' : 'normal') : 'low';
  const route: TicketRoute = category === 'fault' || category === 'safety' ? 'site_visit' : category === 'billing' ? 'accounts' : 'triage';
  const claimReview = i.claim && (category === 'fault' || category === 'safety');
  let reason: Triage['reason'] = null;
  if (words.length > 0) { urgency = atLeast(urgency, 'high'); reason = 'safety_words'; }
  else if (claimReview) reason = 'claim';
  else if (category === 'general') reason = !i.category || wordCount(i.text) < VAGUE_WORDS ? 'vague' : 'general';
  return { category, urgency, route: words.length > 0 && (category === 'billing' || category === 'general') ? 'triage' : route, confidence: reason ? 'needs_human' : 'confident', reason, words, claimReview };
}

/** How long AIEC aims to take to answer, by urgency (placeholders), sooner where an AMC promises it. */
export const RESPONSE_TARGET: Record<TicketUrgency, number> = { emergency: minutes(15), high: hours(4), normal: days(2), low: days(3) };
export function responseTargetOf(urgency: TicketUrgency, route: TicketRoute, coverage: Pick<TicketCoverage, 'responseHours'> | null): number {
  const base = route === 'accounts' ? Math.min(RESPONSE_TARGET[urgency], days(2)) : RESPONSE_TARGET[urgency];
  if (urgency === 'emergency' || route === 'accounts' || !coverage?.responseHours) return base;
  return Math.min(base, hours(coverage.responseHours));
}

export interface CoverageFacts { warrantyEndsOn: string | null; amc: { status: 'active' | 'later' | 'declined'; endsOn: string | null; tier: string | null; responseHours: number | null } | null }
/** What cover a lift has on a day; "unknown" when nothing is registered yet, never guessed. */
export function coverageOf(f: CoverageFacts, now: number): TicketCoverage {
  const endOf = (d: string | null) => (d ? Date.parse(d) + 86_400_000 - 1 : null);
  const warrantyEnd = endOf(f.warrantyEndsOn);
  const amcEnd = f.amc?.status === 'active' ? endOf(f.amc.endsOn) : null;
  const inWarranty = warrantyEnd !== null && now <= warrantyEnd;
  const onAmc = amcEnd !== null && now <= amcEnd;
  const base = { warrantyEndsOn: f.warrantyEndsOn, amcEndsOn: f.amc?.endsOn ?? null, amcTier: f.amc?.tier ?? null, responseHours: onAmc ? f.amc?.responseHours ?? null : null };
  if (inWarranty) return { state: 'in_warranty', ...base };
  if (onAmc) return { state: 'on_amc', ...base };
  if (f.warrantyEndsOn === null && !f.amc) return { state: 'unknown', ...base };
  return { state: 'out_of_cover', ...base };
}

export type FilingProblem = 'category_required' | 'lift_required' | 'description_short' | 'description_long' | 'too_many_attachments' | 'impact_required';
export function filingProblem(i: { category: TicketCategory | null; jobId: string | null; description: string; impact: TicketImpact | null; attachments: number }): FilingProblem | null {
  if (!i.category) return 'category_required';
  if (i.category === 'emergency') return i.jobId ? null : 'lift_required';
  if ((i.category === 'safety' || i.category === 'fault') && !i.jobId) return 'lift_required';
  if (i.category === 'fault' && !i.impact) return 'impact_required';
  if (lettersOf(i.description) < minLettersFor(i.category)) return 'description_short';
  if (i.description.length > MAX_DESCRIPTION) return 'description_long';
  if (i.attachments > MAX_ATTACHMENTS) return 'too_many_attachments';
  return null;
}

export const isOpen = (s: TicketStatus): boolean => s === 'submitted' || s === 'assigned' || s === 'in_progress';
export const STAGES: TicketStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved'];
export const stageIndexOf = (s: TicketStatus): number => Math.max(0, STAGES.indexOf(s === 'withdrawn' ? 'submitted' : s));

export type VisitProblem = 'date_past' | 'window_passed' | 'too_far' | 'date_invalid';
export function visitProblem(date: string, window: 'morning' | 'afternoon', now: number): VisitProblem | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return 'date_invalid';
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const day = new Date(`${date}T00:00:00`).getTime();
  if (day < today.getTime()) return 'date_past';
  if (day === today.getTime() && new Date(now).getHours() >= WINDOW_END_HOUR[window]) return 'window_passed';
  if (day - today.getTime() > days(VISIT_HORIZON_DAYS)) return 'too_far';
  return null;
}
export const visitEndOf = (date: string, window: 'morning' | 'afternoon'): number => new Date(`${date}T00:00:00`).getTime() + WINDOW_END_HOUR[window] * 3_600_000;

export type CompleteProblem = 'outcome_required' | 'notes_short' | 'parts_note_required';
export function completeProblem(i: { outcome: VisitOutcome | null; notes: string; partsNote: string }): CompleteProblem | null {
  if (!i.outcome) return 'outcome_required';
  if (lettersOf(i.notes) < MIN_NOTE) return 'notes_short';
  if (i.outcome === 'needs_parts' && lettersOf(i.partsNote) < 8) return 'parts_note_required';
  return null;
}
/** A visit that fixed it closes the request; every other outcome leaves it with Admin (and an unsafe shut-down is told loudly). */
export const closesTicket = (o: VisitOutcome): boolean => o === 'fixed' || o === 'no_fault_found';

export type ClaimProblem = 'responsibility_required' | 'note_short' | 'evidence_unreviewed';
export function claimProblem(i: { responsibility: TicketResponsibility | null; note: string; reviewedEvidence: boolean }): ClaimProblem | null {
  if (!i.responsibility) return 'responsibility_required';
  if (!i.reviewedEvidence) return 'evidence_unreviewed';
  if (lettersOf(i.note) < CLAIM_NOTE_MIN) return 'note_short';
  return null;
}
/** What the customer is told about a decision: whether it is theirs to pay. */
export const chargeableOf = (r: TicketResponsibility): boolean => r === 'customer_misuse' || r === 'normal_wear';

export const summaryOf = (description: string): string => {
  const t = description.trim().replace(/\s+/g, ' ');
  return t.length <= 80 ? t : `${t.slice(0, 77).trimEnd()}…`;
};
