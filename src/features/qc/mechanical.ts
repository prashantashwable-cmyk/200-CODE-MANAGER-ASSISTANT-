/**
 * The mechanical quality check's rules, pure (132). It mirrors what a lift inspector's trial run looks at (rail alignment, balance, ride
 * quality, levelling, doors), and because ride quality is easy to judge differently, every measurable item comes with a reference
 * threshold the inspector reads a measurement against, so two inspectors reach the same verdict on the same lift.
 *
 * THE NUMBERS BELOW ARE AIEC'S OWN PLACEHOLDER REFERENCE VALUES, chosen to be sensible for a first deployment. They are not clause-level
 * figures from IS 14665, the National Building Code or the lift-inspection rules, and a qualified engineer must confirm or replace them
 * before they are relied on. They are kept in one table so that is a one-place change.
 */
import type { QcMechAttempt, QcMechItemId, QcVerdict } from '@/data/types';

export const MECH_ITEMS: QcMechItemId[] = ['rail_alignment', 'car_cwt_balance', 'ride_smoothness', 'levelling', 'door_smoothness'];
export const NOTE_MIN = 15;
export const OVERRIDE_MIN = 15;

/** The installation steps whose photos an item is cross-checked against (123's step ids). */
export const INSTALL_STEPS: Record<QcMechItemId, string[]> = { rail_alignment: ['s3'], car_cwt_balance: ['s4', 's5'], ride_smoothness: ['s4', 's7'], levelling: ['s5', 's7'], door_smoothness: ['s6'] };

export interface Measure {
  key: string;
  unit: string;
  /** Read as a value that must stay at or under `pass` to pass and at or under `exception` for a noted exception. */
  pass: number;
  exception: number;
}
export interface RangeMeasure {
  key: string;
  unit: string;
  /** Inside `pass` passes; outside it but inside `exception` is a noted exception; outside both fails. */
  pass: [number, number];
  exception: [number, number];
}

/** Reference thresholds (placeholders: see the note at the top of this file). */
export const THRESHOLDS = {
  rail_deviation: { key: 'rail_deviation', unit: 'mm/m', pass: 1, exception: 1.5 } satisfies Measure,
  balance: { key: 'balance', unit: '%', pass: [40, 50], exception: [35, 55] } satisfies RangeMeasure,
  vibration: { key: 'vibration', unit: 'milli-g', pass: 20, exception: 30 } satisfies Measure,
  jerk: { key: 'jerk', unit: 'm/s³', pass: 2, exception: 2.5 } satisfies Measure,
  levelling: { key: 'levelling', unit: 'mm', pass: 5, exception: 10 } satisfies Measure,
};

export type MeasureKey = 'rail_deviation' | 'balance' | 'vibration' | 'jerk';
/** Which measurements an item asks for. Levelling asks for one reading per floor, and the door is judged on a three-level rubric. */
export const MEASURES_OF: Record<QcMechItemId, MeasureKey[]> = { rail_alignment: ['rail_deviation'], car_cwt_balance: ['balance'], ride_smoothness: ['vibration', 'jerk'], levelling: [], door_smoothness: [] };
export const hasFloors = (id: QcMechItemId) => id === 'levelling';
export const hasRubric = (id: QcMechItemId) => id === 'door_smoothness';

const RANK: Record<QcVerdict, number> = { pass: 0, exception: 1, fail: 2 };
export const worse = (a: QcVerdict, b: QcVerdict): QcVerdict => (RANK[a] >= RANK[b] ? a : b);
export const isSofter = (chosen: QcVerdict, suggested: QcVerdict) => RANK[chosen] < RANK[suggested];

function upTo(value: number, m: Measure): QcVerdict {
  return value <= m.pass ? 'pass' : value <= m.exception ? 'exception' : 'fail';
}
function inRange(value: number, m: RangeMeasure): QcVerdict {
  return value >= m.pass[0] && value <= m.pass[1] ? 'pass' : value >= m.exception[0] && value <= m.exception[1] ? 'exception' : 'fail';
}

/** The verdict the reference thresholds give for one measurement. */
export function verdictOfMeasure(key: MeasureKey, value: number): QcVerdict {
  if (!Number.isFinite(value) || value < 0) return 'fail';
  switch (key) {
    case 'rail_deviation':
      return upTo(value, THRESHOLDS.rail_deviation);
    case 'balance':
      return inRange(value, THRESHOLDS.balance);
    case 'vibration':
      return upTo(value, THRESHOLDS.vibration);
    case 'jerk':
      return upTo(value, THRESHOLDS.jerk);
  }
}

export interface Reading {
  measures: { key: string; value: number }[];
  floors: { floor: number; mm: number }[];
  rubric?: 1 | 2 | 3;
}

/** Whether everything the item needs has been read. */
export function readingComplete(id: QcMechItemId, r: Reading, floorCount: number): boolean {
  if (hasRubric(id)) return r.rubric !== undefined;
  if (hasFloors(id)) return floorCount > 0 && Array.from({ length: floorCount }, (_, i) => i + 1).every((f) => r.floors.some((x) => x.floor === f && Number.isFinite(x.mm)));
  return MEASURES_OF[id].every((k) => r.measures.some((m) => m.key === k && Number.isFinite(m.value)));
}

/** What the reference says the verdict is: the worst reading decides. Null until everything is read. */
export function suggestVerdict(id: QcMechItemId, r: Reading, floorCount: number): QcVerdict | null {
  if (!readingComplete(id, r, floorCount)) return null;
  if (hasRubric(id)) return r.rubric === 1 ? 'pass' : r.rubric === 2 ? 'exception' : 'fail';
  if (hasFloors(id)) return r.floors.reduce<QcVerdict>((v, x) => worse(v, upTo(Math.abs(x.mm), THRESHOLDS.levelling)), 'pass');
  return MEASURES_OF[id].reduce<QcVerdict>((v, k) => worse(v, verdictOfMeasure(k, r.measures.find((m) => m.key === k)?.value ?? NaN)), 'pass');
}

export type AttemptProblem = 'reading_incomplete' | 'note_required' | 'evidence_required' | 'override_reason_required' | 'unknown_item';

/** What stops one recording from being kept. A fail needs a picture or a clip and words; an exception needs words; a verdict softer than
 *  the reference gives needs the inspector to say why. */
export function attemptProblem(input: { itemId: QcMechItemId; verdict: QcVerdict; reading: Reading; floorCount: number; note?: string; evidenceCount: number; overrideReason?: string }): AttemptProblem | null {
  if (!MECH_ITEMS.includes(input.itemId)) return 'unknown_item';
  if (!readingComplete(input.itemId, input.reading, input.floorCount)) return 'reading_incomplete';
  const note = (input.note ?? '').trim();
  if (input.verdict === 'fail' && note.length < NOTE_MIN) return 'note_required';
  if (input.verdict === 'fail' && input.evidenceCount < 1) return 'evidence_required';
  if (input.verdict === 'exception' && note.length < NOTE_MIN) return 'note_required';
  const suggested = suggestVerdict(input.itemId, input.reading, input.floorCount);
  if (suggested && isSofter(input.verdict, suggested) && (input.overrideReason ?? '').trim().length < OVERRIDE_MIN) return 'override_reason_required';
  return null;
}

export type ItemState = 'not_checked' | 'pass' | 'exception_pending' | 'exception_accepted' | 'fail';

/** Where an item stands, from its latest recording. A rejected exception is a fail. */
export function itemState(attempts: Pick<QcMechAttempt, 'verdict' | 'review'>[] | undefined): ItemState {
  const last = attempts && attempts[attempts.length - 1];
  if (!last) return 'not_checked';
  if (last.verdict === 'pass') return 'pass';
  if (last.verdict === 'fail') return 'fail';
  return last.review?.status === 'accepted' ? 'exception_accepted' : last.review?.status === 'rejected' ? 'fail' : 'exception_pending';
}

export const isCleared = (s: ItemState) => s === 'pass' || s === 'exception_accepted';

export type SignOffProblem = 'items_open' | 'exception_pending' | 'fail_open' | 'finding_open';

/** Whether the whole mechanical check can be signed off: every item cleared, no exception waiting, no unexplained difference from the install record. */
export function signOffProblem(states: ItemState[], openFindings: number): SignOffProblem | null {
  if (states.some((s) => s === 'fail')) return 'fail_open';
  if (states.some((s) => s === 'not_checked')) return 'items_open';
  if (states.some((s) => s === 'exception_pending')) return 'exception_pending';
  if (openFindings > 0) return 'finding_open';
  return null;
}
