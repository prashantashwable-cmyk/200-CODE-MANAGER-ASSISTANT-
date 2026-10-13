/**
 * Who may check a finished installation, and when, pure (131). The check is independent of the installation: someone who took part in it
 * cannot be its inspector, and the tags that say a person is qualified are the same skill tags technician onboarding (006) records, so
 * there is one vocabulary. Nothing here reads the repository; the screen and the repository both call it.
 */
import type { QcWindow } from '@/data/types';

/** A QC inspector answers for both the mechanical and the electrical safety checks, and for the rescue and safety devices. */
export const QC_REQUIRED_SKILLS = ['mechanical', 'electrical', 'safety_rescue'] as const;
export type QcSkill = (typeof QC_REQUIRED_SKILLS)[number];

/** Tags recorded before onboarding (006) fixed its vocabulary, read as what they mean today, so nobody is qualified or not by spelling. */
const LEGACY: Record<string, string> = { mrl_install: 'mrl_gearless', traction: 'mechanical', door_operator: 'mechanical', wiring: 'electrical', controller: 'electrical' };
export const normalizeSkills = (skills: string[] | undefined): string[] => [...new Set((skills ?? []).map((s) => LEGACY[s] ?? s))];

/** The required tags a person does not have. */
export const missingQcSkills = (skills: string[] | undefined): QcSkill[] => {
  const have = normalizeSkills(skills);
  return QC_REQUIRED_SKILLS.filter((s) => !have.includes(s));
};

export type EligibilityProblem = 'not_active' | 'missing_skill' | 'not_independent';

/** How a person was part of the installation. Any of these makes them unfit to inspect it. */
export type Involvement = 'lead' | 'crew' | 'checked_in' | 'finished_steps' | 'left_the_job';

export interface InvolvementFacts {
  leadId?: string;
  crewIds: string[];
  checkedInIds: string[];
  /** Names credited on completed steps (a step keeps the name of whoever finished it). */
  finishedByNames: string[];
  /** People taken off the job while it was under way, by name (the team log). */
  removedNames: string[];
}

export function involvementOf(userId: string, userName: string, f: InvolvementFacts): Involvement[] {
  const out: Involvement[] = [];
  if (f.leadId === userId) out.push('lead');
  if (f.crewIds.includes(userId) && f.leadId !== userId) out.push('crew');
  if (f.checkedInIds.includes(userId)) out.push('checked_in');
  if (f.finishedByNames.includes(userName)) out.push('finished_steps');
  if (f.removedNames.includes(userName)) out.push('left_the_job');
  return out;
}

export interface Eligibility {
  eligible: boolean;
  problems: EligibilityProblem[];
  missing: QcSkill[];
  involvement: Involvement[];
}

export function eligibilityOf(person: { id: string; name: string; role: string; status: string; skills?: string[] }, f: InvolvementFacts): Eligibility {
  const problems: EligibilityProblem[] = [];
  if (person.role !== 'technician' || person.status !== 'active') problems.push('not_active');
  const missing = missingQcSkills(person.skills);
  if (missing.length > 0) problems.push('missing_skill');
  const involvement = involvementOf(person.id, person.name, f);
  if (involvement.length > 0) problems.push('not_independent');
  return { eligible: problems.length === 0, problems, missing, involvement };
}

/* ---------------------------------------------------------------- time */

export const WINDOWS: QcWindow[] = ['morning', 'afternoon'];
/** How far ahead a visit is offered. Further out than this is not a promise anyone should make. */
export const HORIZON_DAYS = 21;
/** A visit takes half a day. */
export const MAX_VISITS_PER_WINDOW = 1;
/** A half-day window ends at this hour, after which it cannot be booked for that day. */
export const WINDOW_END_HOUR: Record<QcWindow, number> = { morning: 13, afternoon: 18 };
export const windowPassed = (date: string, window: QcWindow, nowMs: number): boolean => date === dayKeyOf(nowMs) && new Date(nowMs).getHours() >= WINDOW_END_HOUR[window];

export const dayKeyOf = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const addDays = (key: string, n: number): string => dayKeyOf(new Date(`${key}T12:00:00`).getTime() + n * 86_400_000);
/** Sundays are not offered for a visit. */
export const isWorkingDay = (key: string): boolean => new Date(`${key}T12:00:00`).getDay() !== 0;

export interface BusyFacts {
  /** Visits already booked for this person, by day and window. */
  visits: { date: string; window: QcWindow }[];
  /** Days they said they cannot. */
  unavailable: { date: string; window: QcWindow | 'all' }[];
  /** Installation jobs booked for them on a day (a whole day). */
  installDays: string[];
}

export type BusyReason = 'booked' | 'unavailable' | 'installing';

/** Why a person cannot take a visit in this window, or null when they can. */
export function busyBecause(f: BusyFacts, date: string, window: QcWindow): BusyReason | null {
  if (f.unavailable.some((u) => u.date === date && (u.window === 'all' || u.window === window))) return 'unavailable';
  if (f.visits.filter((v) => v.date === date && v.window === window).length >= MAX_VISITS_PER_WINDOW) return 'booked';
  if (f.installDays.includes(date)) return 'installing';
  return null;
}

export interface SlotOffer {
  date: string;
  window: QcWindow;
  /** Eligible people free in this window. */
  free: string[];
  /** Whether the customer asked for it. */
  preferred: boolean;
}

/**
 * The next times an eligible inspector is really free, starting today, so a customer's request that nobody can meet is answered with what
 * can be promised, not a double booking. Customer-preferred times come first.
 */
export function suggestSlots(input: { today: string; now?: number; inspectors: { id: string; busy: BusyFacts }[]; preferred?: { dates: string[]; window: QcWindow | 'any' }; limit?: number }): SlotOffer[] {
  const offers: SlotOffer[] = [];
  for (let i = 0; i <= HORIZON_DAYS; i += 1) {
    const date = addDays(input.today, i);
    if (!isWorkingDay(date)) continue;
    for (const window of WINDOWS) {
      if (input.now !== undefined && windowPassed(date, window, input.now)) continue;
      const free = input.inspectors.filter((p) => busyBecause(p.busy, date, window) === null).map((p) => p.id);
      if (free.length === 0) continue;
      const preferred = !!input.preferred && input.preferred.dates.includes(date) && (input.preferred.window === 'any' || input.preferred.window === window);
      offers.push({ date, window, free, preferred });
    }
  }
  const sorted = [...offers.filter((o) => o.preferred), ...offers.filter((o) => !o.preferred)];
  return sorted.slice(0, input.limit ?? 6);
}

/** Whether a time is one the customer asked for. */
export const matchesPreference = (pref: { dates: string[]; window: QcWindow | 'any' } | undefined, date: string, window: QcWindow): boolean => !!pref && pref.dates.includes(date) && (pref.window === 'any' || pref.window === window);

export type SchedulingProblem = 'date_invalid' | 'in_past' | 'too_far' | 'not_working_day' | 'inspector_busy' | 'customer_unconfirmed';

export function schedulingProblem(input: { date: string; window: QcWindow; today: string; now?: number; busy: BusyReason | null; matchesPreference: boolean; customerAgreed: boolean }): SchedulingProblem | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(new Date(`${input.date}T12:00:00`).getTime())) return 'date_invalid';
  if (input.date < input.today || (input.now !== undefined && windowPassed(input.date, input.window, input.now))) return 'in_past';
  if (input.date > addDays(input.today, HORIZON_DAYS + 7)) return 'too_far';
  if (!isWorkingDay(input.date)) return 'not_working_day';
  if (input.busy) return 'inspector_busy';
  // A time that is not one the customer asked for is only booked once Admin has said the customer agreed to it.
  if (!input.matchesPreference && !input.customerAgreed) return 'customer_unconfirmed';
  return null;
}
