/**
 * What must be checked before an offer, pure (145). The list is role-aware: a technician's safety skills and insurance matter in a way a
 * surveyor's do not, a supplier's registration in a way neither does. A third-party service answers where it can; everything else, and any
 * outage, falls to a person with a stronger note. A concerning result blocks the offer and its reason is kept. A document that is hard to obtain
 * can be allowed conditionally, with a firm deadline, never open-ended.
 */
import type { ApplicationForm, PartnerVerification, VerificationHow, VerificationRecord } from '@/data/types';
import { isValidAadhaar, isValidGstin, isValidPan } from '@/features/onboarding/validators';
import { days } from '@/features/sla/clock';
import type { RecruitRole } from './interest';

export type ItemKind = 'identity' | 'skill' | 'insurance' | 'licence' | 'reference' | 'registration';
export interface RequiredItem {
  key: string;
  kind: ItemKind;
  /** The skill id for a `skill:<id>` item. */
  skill?: string;
  /** Whether the ID service can answer it (identity and registration only). */
  thirdParty: boolean;
  /** Whether a hard-to-get document may be allowed conditionally. Identity never can. */
  canBeConditional: boolean;
}
export const HOWS: VerificationHow[] = ['saw_original', 'called_issuer', 'online_registry', 'practical_test', 'other'];

/** How long a conditional allowance may run, how many an applicant may have at once, and how long before the deadline Admin is reminded (placeholders). */
export const CONDITIONAL_MAX_DAYS = 30;
export const MAX_CONDITIONAL = 2;
export const CONDITIONAL_NUDGE = days(3);
export const NOTE_MIN = 15;
export const FALLBACK_NOTE_MIN = 25;
export const REASON_MIN = 20;
/** How long an approved applicant's verification may stay open before Admin is chased (placeholder). */
export const VERIFY_DUE = days(5);

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

/** The items this role must have resolved, read from what the applicant said they do. */
export function requiredItemsOf(role: RecruitRole, form: ApplicationForm): RequiredItem[] {
  const identity: RequiredItem = { key: 'identity', kind: role === 'supplier' ? 'registration' : 'identity', thirdParty: true, canBeConditional: false };
  const reference: RequiredItem = { key: 'reference', kind: 'reference', thirdParty: false, canBeConditional: false };
  if (role === 'supplier') return [identity, reference];
  if (role === 'technician') {
    const skills = form.experience.skills.map((s): RequiredItem => ({ key: `skill:${s}`, kind: 'skill', skill: s, thirdParty: false, canBeConditional: true }));
    return [identity, ...skills, { key: 'insurance', kind: 'insurance', thirdParty: false, canBeConditional: true }, reference];
  }
  return [identity, ...(form.territory.ownTransport ? [{ key: 'licence', kind: 'licence', thirdParty: false, canBeConditional: true } as RequiredItem] : []), reference];
}

export type ItemState = 'pending' | 'passed' | 'failed' | 'conditional' | 'lapsed';

export function itemStateOf(rec: VerificationRecord | undefined, now: number): ItemState {
  if (!rec) return 'pending';
  if (rec.status === 'conditional') return rec.conditional && new Date(rec.conditional.dueAt).getTime() < now ? 'lapsed' : 'conditional';
  return rec.status;
}

export interface Gate {
  /** `clear`: every item passed. `conditional`: only conditional allowances remain, all within their deadline. `blocked`: something is pending, failed or lapsed. */
  state: 'clear' | 'conditional' | 'blocked';
  passed: number;
  total: number;
  pending: string[];
  failed: string[];
  lapsed: string[];
  conditional: { key: string; dueAt: string }[];
}

export function gateOf(items: RequiredItem[], v: PartnerVerification | undefined, now: number): Gate {
  const g: Gate = { state: 'clear', passed: 0, total: items.length, pending: [], failed: [], lapsed: [], conditional: [] };
  for (const it of items) {
    const rec = v?.records[it.key];
    const st = itemStateOf(rec, now);
    if (st === 'passed') g.passed += 1;
    else if (st === 'pending') g.pending.push(it.key);
    else if (st === 'failed') g.failed.push(it.key);
    else if (st === 'lapsed') g.lapsed.push(it.key);
    else g.conditional.push({ key: it.key, dueAt: (rec as VerificationRecord).conditional!.dueAt });
  }
  g.state = g.pending.length + g.failed.length + g.lapsed.length > 0 ? 'blocked' : g.conditional.length > 0 ? 'conditional' : 'clear';
  return g;
}

export type ServiceResult = { result: 'passed' | 'failed' | 'inconclusive'; detail: 'verified' | 'name_mismatch' | 'no_document' | 'bad_number' | 'no_number' };

/**
 * What a registry would say, worked out from what is on file (a real connector would return the registry's own answer). A PAN's fifth letter is the
 * first letter of the holder's surname, so a PAN that does not match the name given is a genuine mismatch, not an arbitrary failure.
 */
export function serviceCheck(role: RecruitRole, form: ApplicationForm): ServiceResult {
  const id = form.identity;
  if (role === 'supplier') {
    if (!id.gstin.trim()) return { result: 'inconclusive', detail: 'no_number' };
    if (!isValidGstin(id.gstin)) return { result: 'failed', detail: 'bad_number' };
    return id.gstDoc ? { result: 'passed', detail: 'verified' } : { result: 'inconclusive', detail: 'no_document' };
  }
  const hasPan = isValidPan(id.panNumber);
  const hasAadhaar = isValidAadhaar(id.aadhaarNumber) || (id.aadhaarChecked && /^\d{4}$/.test(id.aadhaarLast4));
  if (!id.panNumber.trim() && !id.aadhaarNumber.trim() && !id.aadhaarLast4) return { result: 'inconclusive', detail: 'no_number' };
  if (id.panNumber.trim() && !hasPan && !hasAadhaar) return { result: 'failed', detail: 'bad_number' };
  if (hasPan) {
    if (!id.panDoc) return { result: 'inconclusive', detail: 'no_document' };
    const surname = form.personal.fullName.trim().split(/\s+/).pop() ?? '';
    return surname && id.panNumber.trim().toUpperCase()[4] === surname[0].toUpperCase() ? { result: 'passed', detail: 'verified' } : { result: 'failed', detail: 'name_mismatch' };
  }
  return id.aadhaarDoc ? { result: 'passed', detail: 'verified' } : { result: 'inconclusive', detail: 'no_document' };
}

export type ManualProblem = 'how_required' | 'note_required' | 'fallback_note_required' | 'reference_not_verified' | 'red_flag_failed_only';
export function manualProblem(input: { result: 'passed' | 'failed'; how?: VerificationHow; note: string; serviceDown: boolean; item: RequiredItem; redFlag?: boolean; verifiedReferences: number; noReferences: boolean }): ManualProblem | null {
  if (!input.how) return 'how_required';
  if (letters(input.note) < NOTE_MIN) return 'note_required';
  if (input.serviceDown && input.item.thirdParty && letters(input.note) < FALLBACK_NOTE_MIN) return 'fallback_note_required';
  if (input.redFlag && input.result !== 'failed') return 'red_flag_failed_only';
  // Passing the reference check needs someone who actually vouched; with nobody named, the note must say what was relied on instead.
  if (input.item.kind === 'reference' && input.result === 'passed' && input.verifiedReferences === 0 && !input.noReferences) return 'reference_not_verified';
  return null;
}

export type ConditionalProblem = 'not_allowed' | 'reason_required' | 'deadline_invalid' | 'too_many' | 'already_resolved';
export function conditionalProblem(item: RequiredItem, state: ItemState, reason: string, dueIso: string, openConditional: number, now: number): ConditionalProblem | null {
  if (!item.canBeConditional) return 'not_allowed';
  if (state === 'passed' || state === 'conditional') return 'already_resolved';
  if (state === 'failed') return 'not_allowed';
  if (letters(reason) < REASON_MIN) return 'reason_required';
  const due = new Date(dueIso).getTime();
  if (Number.isNaN(due) || due <= now || due > now + days(CONDITIONAL_MAX_DAYS)) return 'deadline_invalid';
  if (openConditional >= MAX_CONDITIONAL) return 'too_many';
  return null;
}
