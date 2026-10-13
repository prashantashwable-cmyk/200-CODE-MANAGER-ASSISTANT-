/**
 * The partner application's rules, pure (142). One record carries a person from first interest to onboarding; this says what a complete form is
 * for each role, section by section, so the screen and the repository judge exactly alike.
 *
 * What is optional is deliberate: references and certificates help a decision but never block the form, and a reference who cannot be reached is
 * carried as outstanding for the approval decision rather than holding the application up.
 */
import { isValidAadhaar, isValidGstin, isValidPan } from '@/features/onboarding/validators';
import type { ApplicationForm, ApplicationReference } from '@/data/types';
import { NAME_MIN, isMobile } from './interest';
import type { RecruitRole } from './interest';

export const SECTIONS = ['personal', 'experience', 'territory', 'availability', 'references', 'identity'] as const;
export type SectionId = (typeof SECTIONS)[number];
/** The sections that must be complete before the application can be sent; references are asked for but never required. */
export const REQUIRED: SectionId[] = ['personal', 'experience', 'territory', 'availability', 'identity'];

export const YEARS = ['none', 'under_1', '1_3', '3_5', 'over_5'] as const;
export const TECHNICIAN_SKILLS = ['mechanical', 'electrical', 'hydraulic', 'mrl_gearless', 'safety_rescue'] as const;
export const SURVEYOR_SECTORS = ['real_estate', 'construction', 'elevators', 'other_sales'] as const;
export const SUPPLIER_CATEGORIES = ['traction_machine', 'controller', 'cabin', 'door_operator', 'guide_rails', 'ropes', 'vfd', 'wiring', 'brackets', 'counterweight'] as const;
export const DAYS = [1, 2, 3, 4, 5, 6, 0] as const;
export const TIMES = ['full_day', 'mornings', 'afternoons', 'evenings'] as const;
export const HOURS = ['10', '20', '30', '40'] as const;
export const TRAVEL = ['5', '10', '20', '40'] as const;
export const LANGUAGES = ['en', 'hi', 'mr'] as const;
export const SUMMARY_MIN = 20;
export const REFERENCES_MAX = 3;
export const MIN_AGE = 18;

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

export const EMPTY_FORM: ApplicationForm = {
  personal: { fullName: '', phone: '', city: 'Pune', address: '', dob: '', languages: [] },
  experience: { years: '', skills: [], sectors: [], summary: '' },
  territory: { zoneIds: [], travelKm: '', ownTransport: false },
  availability: { days: [], timeOfDay: '', hoursPerWeek: '', earliestStart: '' },
  identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: '', panDoc: null, gstin: '', gstDoc: null },
  references: [],
  noReferences: false,
};

export function ageOn(dob: string, today: Date): number | null {
  const d = new Date(`${dob}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
}

export interface SectionState {
  id: SectionId;
  required: boolean;
  complete: boolean;
  /** Short codes for what is still missing or wrong, which the screen words in the active language. */
  missing: string[];
}

export function referenceProblem(r: Pick<ApplicationReference, 'name' | 'phone' | 'relationship'>): string | null {
  if (letters(r.name) < NAME_MIN) return 'reference_name';
  if (!isMobile(r.phone)) return 'reference_phone';
  if (letters(r.relationship) < 3) return 'reference_relationship';
  return null;
}

export function sectionStates(role: RecruitRole, f: ApplicationForm, today: Date = new Date()): SectionState[] {
  const out: SectionState[] = [];
  const add = (id: SectionId, missing: string[]) => out.push({ id, required: REQUIRED.includes(id), complete: missing.length === 0, missing });

  const p: string[] = [];
  if (letters(f.personal.fullName) < NAME_MIN) p.push('name');
  if (!isMobile(f.personal.phone)) p.push('phone');
  if (!f.personal.city.trim()) p.push('city');
  if (f.personal.languages.length === 0) p.push('languages');
  if (f.personal.dob) {
    const age = ageOn(f.personal.dob, today);
    if (age === null || age < MIN_AGE) p.push('age');
  }
  add('personal', p);

  const e: string[] = [];
  if (!f.experience.years) e.push('years');
  const structured = role === 'surveyor' ? f.experience.sectors.length > 0 : f.experience.skills.length > 0;
  // Informal experience in the person's own words is as good as a ticked list.
  if (!structured && letters(f.experience.summary) < SUMMARY_MIN) e.push('experience');
  add('experience', e);

  add('territory', f.territory.zoneIds.length === 0 ? ['zones'] : []);

  const a: string[] = [];
  if (f.availability.days.length === 0) a.push('days');
  if (!f.availability.timeOfDay) a.push('time');
  if (!f.availability.hoursPerWeek) a.push('hours');
  if (!f.availability.earliestStart || f.availability.earliestStart < today.toISOString().slice(0, 10)) a.push('start');
  add('availability', a);

  const r: string[] = [];
  if (f.references.length === 0 && !f.noReferences) r.push('references');
  for (const x of f.references) {
    const prob = referenceProblem(x);
    if (prob && !r.includes(prob)) r.push(prob);
  }
  add('references', r);

  const i: string[] = [];
  if (role === 'supplier') {
    if (!isValidGstin(f.identity.gstin)) i.push('gstin');
    if (!f.identity.gstDoc) i.push('gst_doc');
  } else {
    const aadhaar = hasValidAadhaar(f.identity) && !!f.identity.aadhaarDoc;
    const pan = isValidPan(f.identity.panNumber) && !!f.identity.panDoc;
    if (!aadhaar && !pan) i.push('identity');
  }
  add('identity', i);
  return out;
}

export function submitProblem(role: RecruitRole, f: ApplicationForm, today?: Date): 'incomplete' | null {
  return sectionStates(role, f, today).some((s) => s.required && !s.complete) ? 'incomplete' : null;
}

export function progressOf(states: SectionState[]): { done: number; total: number; percent: number } {
  const req = states.filter((s) => s.required);
  const done = req.filter((s) => s.complete).length;
  return { done, total: req.length, percent: Math.round((done / req.length) * 100) };
}

export interface Outstanding {
  kind: 'reference_unchecked' | 'reference_unreachable' | 'reference_declined' | 'no_references';
  refId?: string;
  name?: string;
}

/** What is still open for the eventual approval decision. None of it blocks screening. */
export function outstandingOf(f: ApplicationForm): Outstanding[] {
  const out: Outstanding[] = [];
  if (f.references.length === 0) return f.noReferences ? [{ kind: 'no_references' }] : [];
  for (const r of f.references) {
    if (!r.outcome) out.push({ kind: 'reference_unchecked', refId: r.id, name: r.name });
    else if (r.outcome.status === 'unreachable') out.push({ kind: 'reference_unreachable', refId: r.id, name: r.name });
    else if (r.outcome.status === 'declined') out.push({ kind: 'reference_declined', refId: r.id, name: r.name });
  }
  return out;
}

/** Aadhaar and PAN are shown to Admin only in part. */
/** A valid Aadhaar is either one typed on this phone that passes the checksum, or one AIEC recorded as checked (last four digits only). */
export const hasValidAadhaar = (id: ApplicationForm['identity']): boolean => isValidAadhaar(id.aadhaarNumber) || (id.aadhaarChecked && /^\d{4}$/.test(id.aadhaarLast4));

/** What may leave the phone: the last four digits and whether the checksum passed. Typing a new number replaces the one on file. */
export const identityForServer = (id: ApplicationForm['identity']): ApplicationForm['identity'] => {
  const typed = id.aadhaarNumber.replace(/\D/g, '');
  if (!typed) return { ...id, aadhaarNumber: '' };
  const ok = isValidAadhaar(id.aadhaarNumber);
  return { ...id, aadhaarNumber: '', aadhaarLast4: ok ? typed.slice(-4) : '', aadhaarChecked: ok };
};

export const maskId = (v: string): string => (v.length > 4 ? `${'•'.repeat(v.length - 4)}${v.slice(-4)}` : v);
