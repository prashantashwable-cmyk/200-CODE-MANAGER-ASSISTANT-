import { hashCode } from '@/features/security/security';

/**
 * AIEC's legal wording, kept in one place (198). Pure: the screen and the repository judge with the same rules.
 * This is a register and a workflow around wording that lawyers write: nothing here is legal advice. All the numbers are placeholders for the owner to set.
 */
export const MIN_TEXT = 40;
export const MAX_TEXT = 4000;
export const NOTE_MIN = 20;
export const REFERENCE_MIN = 5;
export const CANCEL_MIN = 10;
/** A wording change may start today or later, never earlier, and no further out than this. */
export const EFFECTIVE_MAX_DAYS = 365;
/** A review that found a problem in wording already in use is put right within this many days. */
export const FIX_DAYS = 3;
/** A review is looked at again after this long unless the reviewer says otherwise. */
export const REVIEW_EVERY_DAYS = 365;
export const NEXT_DUE_MAX_DAYS = 730;
export const DUE_SOON_DAYS = 30;
/** After the wording changes, the review no longer covers it: a fresh one is owed within this long. */
export const REREVIEW_DAYS = 30;
export const CLOSE_NOTE_MIN = 30;
export const REVIEWER_MIN = 3;
export const AUTHORITY_MIN = 10;

export type LegalCategory = 'contract' | 'state' | 'partner' | 'supplier' | 'privacy' | 'guidance';
export const CATEGORIES: LegalCategory[] = ['contract', 'state', 'partner', 'supplier', 'privacy', 'guidance'];
/** Only these are written here; the rest are read from the screen that owns them. */
export const EDITABLE: LegalCategory[] = ['contract', 'state'];
export type LegalReviewState = 'never' | 'current' | 'due' | 'outdated' | 'issue_open';
export const REASONS = ['law_change', 'standard_change', 'legal_review', 'correction', 'new_state'] as const;
export type SelectableReason = (typeof REASONS)[number];
export const needsReference = (reason: string): boolean => reason === 'law_change' || reason === 'standard_change' || reason === 'new_state';

export const docKeyOf = (category: LegalCategory, ref: string): string => `${category}:${ref}`;
export const parseDocKey = (key: string): { category: LegalCategory; ref: string } | null => {
  const i = key.indexOf(':');
  if (i < 1) return null;
  const category = key.slice(0, i) as LegalCategory;
  return CATEGORIES.includes(category) ? { category, ref: key.slice(i + 1) } : null;
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

export const dayOf = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const isDay = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const dayMs = (s: string): number => Date.parse(`${s}T00:00:00Z`);
const DAY = 86_400_000;
const letters = (s: string): number => s.replace(/[^\p{L}\p{N}]/gu, '').length;

export interface RevisionInput { text: string; current: string; changeNote: string; reason: string; reference: string; effectiveFrom: string }
/** The first thing wrong with a proposed wording change, as a code the screen has words for; null when it can go ahead. */
export function revisionProblem(i: RevisionInput, now: number): string | null {
  const text = i.text.trim();
  if (letters(text) < MIN_TEXT) return 'text_short';
  if (text.length > MAX_TEXT) return 'text_long';
  if (text === i.current.trim()) return 'no_change';
  if (!(REASONS as readonly string[]).includes(i.reason)) return 'reason_unknown';
  if (needsReference(i.reason) && letters(i.reference) < REFERENCE_MIN) return 'reference_short';
  if (letters(i.changeNote) < NOTE_MIN) return 'note_short';
  if (!isDay(i.effectiveFrom)) return 'date_invalid';
  const today = dayMs(dayOf(now));
  if (dayMs(i.effectiveFrom) < today) return 'date_past';
  if (dayMs(i.effectiveFrom) > today + EFFECTIVE_MAX_DAYS * DAY) return 'date_far';
  return null;
}
/** A change made on the day it is written takes effect at once; a later day is scheduled. */
export const isImmediate = (effectiveFrom: string, now: number): boolean => dayMs(effectiveFrom) <= dayMs(dayOf(now));

/** What was previewed is what is published: any edit afterwards gives a different fingerprint. */
export const draftHash = (docKey: string, state: string | null, i: RevisionInput): string => hashCode([docKey, state ?? '', i.text.trim(), i.changeNote.trim(), i.reason, i.reference.trim(), i.effectiveFrom].join('\u0001'));

export interface ReviewInput { docKey: string; reviewedOn: string; reviewer: string; firm: string; outcome: string; note: string; nextDueOn: string }
export function reviewProblem(i: ReviewInput, now: number): string | null {
  if (!parseDocKey(i.docKey)) return 'doc_unknown';
  if (!isDay(i.reviewedOn)) return 'reviewed_on_invalid';
  if (dayMs(i.reviewedOn) > dayMs(dayOf(now))) return 'reviewed_in_future';
  if (letters(i.reviewer) < REVIEWER_MIN) return 'reviewer_short';
  if (i.outcome !== 'clear' && i.outcome !== 'issues_found') return 'outcome_unknown';
  if (letters(i.note) < NOTE_MIN) return 'note_short';
  if (!isDay(i.nextDueOn)) return 'next_due_invalid';
  if (dayMs(i.nextDueOn) <= dayMs(i.reviewedOn)) return 'next_due_before';
  if (dayMs(i.nextDueOn) > dayMs(i.reviewedOn) + NEXT_DUE_MAX_DAYS * DAY) return 'next_due_far';
  return null;
}
export const defaultNextDue = (reviewedOn: string): string => dayOf(dayMs(reviewedOn) + REVIEW_EVERY_DAYS * DAY);

export interface ReviewLine { id: string; outcome: 'clear' | 'issues_found'; versionReviewed: number; recordedAt: string; reviewedOn: string; nextDueOn: string; closedAt?: string }
/**
 * Where a document stands against its own legal reviews.
 * A problem found in wording still in use is `issue_open` until the wording has changed since (then it needs a fresh review) or Admin records why it is not a problem.
 */
export function reviewStateOf(reviews: ReviewLine[], doc: { version: number; changedAt: string }, now: number): { state: LegalReviewState; latest: ReviewLine | null; issue: ReviewLine | null; dueInDays: number | null } {
  const latest = [...reviews].sort((a, b) => (a.reviewedOn === b.reviewedOn ? (a.recordedAt < b.recordedAt ? 1 : -1) : a.reviewedOn < b.reviewedOn ? 1 : -1))[0] ?? null;
  if (!latest) return { state: 'never', latest: null, issue: null, dueInDays: null };
  const dueInDays = Math.floor((dayMs(latest.nextDueOn) - dayMs(dayOf(now))) / DAY);
  const changedSince = doc.changedAt > latest.recordedAt && doc.version !== latest.versionReviewed;
  if (latest.outcome === 'issues_found' && !latest.closedAt) {
    if (changedSince) return { state: 'outdated', latest, issue: null, dueInDays };
    return { state: 'issue_open', latest, issue: latest, dueInDays };
  }
  if (doc.version !== latest.versionReviewed) return { state: 'outdated', latest, issue: null, dueInDays };
  if (dueInDays < 0) return { state: 'due', latest, issue: null, dueInDays };
  return { state: 'current', latest, issue: null, dueInDays };
}
/** The wording is the one nobody has looked at since it changed: how long ago that was is what makes a fresh review due. */
export const rereviewDueAt = (changedAt: string): string => new Date(Date.parse(changedAt) + REREVIEW_DAYS * DAY).toISOString();

export const cityListOf = (text: string): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of text.split(/[\n,;]+/).map((x) => x.trim().replace(/\s+/g, ' ')).filter(Boolean)) {
    const k = c.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(c); }
  }
  return out;
};
export interface StateInput { state: string; cities: string[]; authority: string; known: Map<string, string[]> }
/** Adding a state, or more places to one already there. `city_taken` stops one city being decided by two states. */
export function stateProblem(i: StateInput): string | null {
  if (!(INDIAN_STATES as readonly string[]).includes(i.state)) return 'state_unknown';
  if (i.cities.length === 0) return 'cities_needed';
  if (i.cities.some((c) => letters(c) < 2 || c.length > 60)) return 'city_invalid';
  const exists = i.known.has(i.state);
  if (!exists && letters(i.authority) < AUTHORITY_MIN) return 'authority_short';
  for (const [st, cs] of i.known) {
    if (st === i.state) continue;
    const taken = new Set(cs.map((c) => c.toLowerCase()));
    if (i.cities.some((c) => taken.has(c.toLowerCase()))) return 'city_taken';
  }
  if (exists) {
    const mine = new Set((i.known.get(i.state) ?? []).map((c) => c.toLowerCase()));
    if (i.cities.every((c) => mine.has(c.toLowerCase()))) return 'nothing_new';
  }
  return null;
}
