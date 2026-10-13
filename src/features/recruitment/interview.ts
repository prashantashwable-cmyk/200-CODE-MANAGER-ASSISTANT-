/**
 * The interview's rules, pure (144). Admin's availability makes the slots; the applicant picks one; both the screen and the repository judge a
 * pick with the same function, so a time the screen offered is a time the repository accepts, and a time just taken is refused the same way.
 * Interview notes end in a signal the offer decision (146) reads, so a concern raised in conversation is weighed, not left as an impression.
 */
import type { InterviewAvailability, InterviewConcernCategory, InterviewMode, PartnerInterview } from '@/data/types';
import { addDaysKey, dateKey, parseKey } from '@/features/logistics/deliverySlots';
import { days, hours, minutes } from '@/features/sla/clock';

export const INTERVIEW_MODES: InterviewMode[] = ['phone', 'video', 'in_person'];
export const CONCERN_CATEGORIES: InterviewConcernCategory[] = ['communication', 'reliability', 'safety_attitude', 'experience', 'other'];
export const SLOT_LENGTHS = [15, 20, 30, 45];
export const HORIZON_CHOICES = [7, 14, 21];

/** After the invitation, how long before Admin is asked to chase and the applicant is nudged once (placeholder). */
export const INVITE_WAIT = days(3);
/** An approved applicant with no interview and no decision to skip is Admin's to settle within this (placeholder). */
export const ARRANGE_DUE = days(3);
/** The time after a slot's end before it is read as "needs an outcome" rather than "in progress". */
export const GRACE = minutes(15);
/** An applicant can move their own time until this long before it. */
export const MIN_NOTICE = hours(2);
/** After this many missed slots the applicant is no longer offered self-service times: Admin decides, kindly, how to go on (placeholder). */
export const MAX_MISSES = 2;
/** Reminders before a confirmed slot, to the applicant (messages on their link) and Admin (the commitment's own nudge). */
export const REMINDERS = [
  { key: '24h', before: hours(24) },
  { key: '2h', before: hours(2) },
] as const;
export const NOTE_MIN = 15;
export const REASON_MIN = 10;

export const DEFAULT_AVAILABILITY: InterviewAvailability = {
  weekly: {
    0: null,
    1: { from: '10:00', to: '13:00' },
    2: { from: '10:00', to: '13:00' },
    3: { from: '10:00', to: '13:00' },
    4: { from: '10:00', to: '13:00' },
    5: { from: '10:00', to: '13:00' },
    6: { from: '10:00', to: '12:00' },
  },
  slotMinutes: 20,
  bufferMinutes: 10,
  closedDates: [],
  leadHours: 4,
  horizonDays: 14,
  updatedAt: null,
  updatedByName: null,
};

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const timeLabel = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
/** Half-hourly choices for a window's edges, 07:00 to 21:00. */
export const WINDOW_CHOICES: string[] = Array.from({ length: 29 }, (_, i) => timeLabel(7 * 60 + i * 30));

export interface Slot {
  start: string;
  end: string;
  date: string;
}
export interface Busy {
  start: string;
  end: string;
}

const at = (date: string, minutesFromMidnight: number): number => {
  const d = parseKey(date);
  d.setHours(0, minutesFromMidnight, 0, 0);
  return d.getTime();
};

const overlaps = (aStart: number, aEnd: number, b: Busy, buffer: number): boolean => aStart < new Date(b.end).getTime() + buffer && new Date(b.start).getTime() < aEnd + buffer;

/** Every time that can be offered, in order: Admin's open windows cut into slots, less what is past, too soon, closed, or already booked. */
export function slotsFor(av: InterviewAvailability, booked: Busy[], now: number, opts: { from?: string; days?: number } = {}): Slot[] {
  const out: Slot[] = [];
  const first = opts.from ?? dateKey(new Date(now));
  const span = opts.days ?? av.horizonDays;
  const earliest = now + hours(av.leadHours);
  const length = av.slotMinutes * 60_000;
  const buffer = av.bufferMinutes * 60_000;
  for (let i = 0; i < span; i += 1) {
    const date = addDaysKey(first, i);
    if (av.closedDates.includes(date)) continue;
    const win = av.weekly[parseKey(date).getDay()];
    if (!win) continue;
    const from = minutesOf(win.from);
    const to = minutesOf(win.to);
    for (let m = from; m + av.slotMinutes <= to; m += av.slotMinutes + av.bufferMinutes) {
      const start = at(date, m);
      const end = start + length;
      if (start < earliest) continue;
      if (booked.some((b) => overlaps(start, end, b, buffer))) continue;
      out.push({ start: new Date(start).toISOString(), end: new Date(end).toISOString(), date });
    }
  }
  return out;
}

export type SlotProblem = 'past' | 'too_soon' | 'closed' | 'outside' | 'taken';

/** Why a start time cannot be taken, or null. A time Admin types in by hand is judged by `adminSlotProblem` instead (it may sit outside the windows). */
export function slotProblem(av: InterviewAvailability, booked: Busy[], now: number, startIso: string): SlotProblem | null {
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start) || start <= now) return 'past';
  if (start < now + hours(av.leadHours)) return 'too_soon';
  const date = dateKey(new Date(start));
  if (av.closedDates.includes(date)) return 'closed';
  const free = slotsFor(av, booked, now, { from: date, days: 1 });
  if (free.some((s) => s.start === new Date(start).toISOString())) return null;
  // Why not free: is it a real slot that someone holds, or simply not one Admin offers?
  const all = slotsFor(av, [], now - hours(av.leadHours) - 1, { from: date, days: 1 });
  return all.some((s) => s.start === new Date(start).toISOString()) ? 'taken' : 'outside';
}

/** Admin may book any time in the future that does not overlap another interview. */
export function adminSlotProblem(booked: Busy[], now: number, startIso: string, lengthMinutes: number, bufferMinutes: number): 'past' | 'taken' | null {
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start) || start <= now) return 'past';
  return booked.some((b) => overlaps(start, start + lengthMinutes * 60_000, b, bufferMinutes * 60_000)) ? 'taken' : null;
}

/** Whether a confirmed time still sits inside Admin's windows (after availability is changed). */
export function stillFits(av: InterviewAvailability, startIso: string, endIso: string): boolean {
  const s = new Date(startIso);
  const date = dateKey(s);
  if (av.closedDates.includes(date)) return false;
  const win = av.weekly[s.getDay()];
  if (!win) return false;
  const startMin = s.getHours() * 60 + s.getMinutes();
  const e = new Date(endIso);
  const endMin = e.getHours() * 60 + e.getMinutes() + (dateKey(e) === date ? 0 : 24 * 60);
  return startMin >= minutesOf(win.from) && endMin <= minutesOf(win.to);
}

export type AvailabilityProblem = 'window_order' | 'slot_length' | 'horizon' | 'lead' | 'nothing_open' | 'closed_date';
export function availabilityProblem(av: InterviewAvailability): AvailabilityProblem | null {
  if (!SLOT_LENGTHS.includes(av.slotMinutes) || av.bufferMinutes < 0 || av.bufferMinutes > 30) return 'slot_length';
  if (!HORIZON_CHOICES.includes(av.horizonDays)) return 'horizon';
  if (!Number.isInteger(av.leadHours) || av.leadHours < 0 || av.leadHours > 72) return 'lead';
  const open = Object.values(av.weekly).filter((w): w is { from: string; to: string } => !!w);
  if (open.length === 0) return 'nothing_open';
  if (open.some((w) => minutesOf(w.to) - minutesOf(w.from) < av.slotMinutes)) return 'window_order';
  if (av.closedDates.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))) return 'closed_date';
  return null;
}

/* ------------------------------------------------------------------ the conversation itself */

export type Phase = 'to_arrange' | 'invited' | 'scheduled' | 'move_requested' | 'needs_outcome' | 'completed' | 'missed' | 'cancelled' | 'skipped';

export function phaseOf(i: PartnerInterview | undefined, now: number): Phase {
  if (!i) return 'to_arrange';
  if (i.status === 'scheduled' && i.slot) {
    if (now > new Date(i.slot.end).getTime() + GRACE) return 'needs_outcome';
    return i.moveRequest ? 'move_requested' : 'scheduled';
  }
  return i.status;
}

/** Whether the applicant may choose or change a time themselves right now. */
export function selfServiceOpen(i: PartnerInterview | undefined, now: number): boolean {
  if (!i) return false;
  if (i.status === 'invited') return true;
  if (i.status === 'missed') return i.misses < MAX_MISSES;
  // When AIEC asked for the move, the person may answer right up to the time itself; their own change needs a little notice.
  if (i.status === 'scheduled' && i.slot) return now < new Date(i.slot.start).getTime() - (i.moveRequest ? 0 : MIN_NOTICE);
  return false;
}

export type CompleteProblem = 'ratings_required' | 'note_required' | 'concern_required' | 'concern_text' | 'outcome_required' | 'outcome_reason_required';
export interface CompleteInput {
  ratings: Partial<NonNullable<PartnerInterview['completed']>['ratings']>;
  note: string;
  concern?: { category?: InterviewConcernCategory; text?: string };
  outcome?: NonNullable<PartnerInterview['completed']>['outcome'];
  outcomeReason?: string;
}
export function completeProblem(c: CompleteInput): CompleteProblem | null {
  if (!c.ratings.communication || !c.ratings.reliability || !c.ratings.experience) return 'ratings_required';
  if (letters(c.note) < NOTE_MIN) return 'note_required';
  const flagged = c.ratings.communication === 'concern' || c.ratings.reliability === 'concern' || c.ratings.experience === 'not_confirmed';
  if (flagged && (!c.concern || !c.concern.category)) return 'concern_required';
  if (c.concern && (c.concern.category || (c.concern.text ?? '').trim()) && letters(c.concern.text ?? '') < NOTE_MIN) return 'concern_text';
  if (!c.outcome) return 'outcome_required';
  if (c.outcome !== 'recommend' && letters(c.outcomeReason ?? '') < NOTE_MIN) return 'outcome_reason_required';
  return null;
}

/** A concern a rating implies, so a flagged rating can never be saved without its words. */
export function suggestedConcern(r: CompleteInput['ratings']): InterviewConcernCategory | null {
  if (r.communication === 'concern') return 'communication';
  if (r.reliability === 'concern') return 'reliability';
  if (r.experience === 'not_confirmed') return 'experience';
  return null;
}

export interface DecisionSignal {
  /** `positive` recommended with nothing raised; `neutral` no interview or skipped; `caution` something was raised or Admin held back; `block` not recommended. */
  level: 'positive' | 'neutral' | 'caution' | 'block';
  concerns: { category: InterviewConcernCategory; text: string; at: string; source: 'interview' | 'addendum' }[];
}

/** What the offer decision (146) must weigh: the outcome, and every concern in words, whichever moment it came from. */
export function decisionSignal(i: PartnerInterview | undefined): DecisionSignal {
  if (!i || i.status === 'skipped' || !i.completed) {
    // A concern added to a held-over interview still counts.
    const only = (i?.addenda ?? []).filter((a) => a.concern).map((a) => ({ category: (a.concern as NonNullable<typeof a.concern>).category, text: (a.concern as NonNullable<typeof a.concern>).text, at: a.at, source: 'addendum' as const }));
    return { level: only.length > 0 ? 'caution' : 'neutral', concerns: only };
  }
  const concerns: DecisionSignal['concerns'] = [];
  if (i.completed.concern) concerns.push({ category: i.completed.concern.category, text: i.completed.concern.text, at: i.completed.at, source: 'interview' });
  for (const a of i.addenda) if (a.concern) concerns.push({ category: a.concern.category, text: a.concern.text, at: a.at, source: 'addendum' });
  if (i.completed.outcome === 'not_recommended') return { level: 'block', concerns };
  if (i.completed.outcome === 'hold' || concerns.length > 0) return { level: 'caution', concerns };
  return { level: 'positive', concerns };
}

/** A calendar entry the applicant can keep (RFC 5545), so a confirmed time is on their own phone and not only in a message. */
export function icsOf(input: { uid: string; start: string; end: string; summary: string; description: string; location?: string }): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\;');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AIEC//Interview//EN', 'BEGIN:VEVENT', `UID:${input.uid}@aiec`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(input.start)}`, `DTEND:${stamp(input.end)}`, `SUMMARY:${esc(input.summary)}`, `DESCRIPTION:${esc(input.description)}`, ...(input.location ? [`LOCATION:${esc(input.location)}`] : []), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
