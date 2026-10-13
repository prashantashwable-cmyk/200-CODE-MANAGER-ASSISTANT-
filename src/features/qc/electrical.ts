/**
 * The electrical and safety quality check's rules, pure (133). These are the checks that can hurt someone if they are wrong, so there is
 * deliberately no soft pass: a reading outside its reference, a check that did not work, or behaviour that was not the same every time is
 * a fail, and nothing short of a documented re-test that passes clears it. The two trial runs are the culminating test.
 *
 * THE NUMBERS BELOW ARE AIEC'S OWN PLACEHOLDER REFERENCE VALUES for a first deployment. They are not clause-level figures from IS 14665, the
 * National Building Code or the state Lift Inspectorate's procedure, and a qualified engineer must confirm or replace them before they are
 * relied on. They sit in one table so that is a one-place change.
 */
import type { QcElecItemId } from '@/data/types';

export const ELEC_ITEMS: QcElecItemId[] = ['wiring_grounding', 'control_panel', 'governor_overspeed', 'buffer_function', 'ard_function', 'door_sensors', 'overload_device', 'alarm_comms', 'trial_no_load', 'trial_full_load'];
export const NOTE_MIN = 15;

export interface ElecMeasure {
  key: string;
  unit: string;
  /** `max`: at or under `pass`; `min`: at or over; `range`: inside both. */
  kind: 'max' | 'min' | 'range';
  pass: number | [number, number];
}
export interface ElecItemDef {
  id: QcElecItemId;
  measures: ElecMeasure[];
  checks: string[];
  /** The culminating trial runs must be shown, whatever the result. */
  evidenceAlways: boolean;
  /** The 123 steps whose photos it is cross-checked against. */
  installSteps: string[];
}

export const ELEC_DEFS: ElecItemDef[] = [
  { id: 'wiring_grounding', measures: [{ key: 'earth_resistance', unit: 'Ω', kind: 'max', pass: 1 }, { key: 'insulation_resistance', unit: 'MΩ', kind: 'min', pass: 1 }], checks: [], evidenceAlways: false, installSteps: ['s7'] },
  { id: 'control_panel', measures: [], checks: ['contactors', 'safety_chain', 'fault_display'], evidenceAlways: false, installSteps: ['s7'] },
  { id: 'governor_overspeed', measures: [{ key: 'trip_speed_pct', unit: '% of rated speed', kind: 'range', pass: [115, 125] }], checks: ['safety_gear_engages'], evidenceAlways: false, installSteps: ['s8'] },
  { id: 'buffer_function', measures: [], checks: ['compresses_and_returns', 'switch_operates'], evidenceAlways: false, installSteps: ['s8'] },
  { id: 'ard_function', measures: [{ key: 'ard_response_s', unit: 's', kind: 'max', pass: 5 }], checks: ['reaches_landing', 'doors_open'], evidenceAlways: false, installSteps: ['s8'] },
  { id: 'door_sensors', measures: [], checks: ['reverses_door', 'all_beams_work'], evidenceAlways: false, installSteps: ['s6'] },
  { id: 'overload_device', measures: [{ key: 'overload_trip_pct', unit: '% of rated load', kind: 'range', pass: [105, 110] }], checks: ['blocks_start'], evidenceAlways: false, installSteps: ['s9'] },
  { id: 'alarm_comms', measures: [], checks: ['alarm_sounds', 'two_way_intercom', 'emergency_light'], evidenceAlways: false, installSteps: ['s9'] },
  { id: 'trial_no_load', measures: [{ key: 'runs', unit: 'runs', kind: 'min', pass: 10 }], checks: ['stops_accurately', 'no_abnormal_noise'], evidenceAlways: true, installSteps: ['s9'] },
  { id: 'trial_full_load', measures: [{ key: 'load_pct', unit: '% of rated load', kind: 'range', pass: [100, 110] }, { key: 'runs', unit: 'runs', kind: 'min', pass: 10 }], checks: ['holds_load', 'brake_holds', 'stops_accurately'], evidenceAlways: true, installSteps: ['s9'] },
];
export const defOf = (id: QcElecItemId): ElecItemDef => ELEC_DEFS.find((d) => d.id === id) as ElecItemDef;

export interface ElecReading {
  measures: { key: string; value: number }[];
  checks: { key: string; ok: boolean }[];
  intermittent: boolean;
}

export function measureOk(m: ElecMeasure, value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  if (m.kind === 'max') return value <= (m.pass as number);
  if (m.kind === 'min') return value >= (m.pass as number);
  const [a, b] = m.pass as [number, number];
  return value >= a && value <= b;
}

export function readingComplete(id: QcElecItemId, r: ElecReading): boolean {
  const d = defOf(id);
  return d.measures.every((m) => r.measures.some((x) => x.key === m.key && Number.isFinite(x.value))) && d.checks.every((c) => r.checks.some((x) => x.key === c));
}

/** The verdict the reference gives: a pass only if everything is read, in range, working and repeatable. Null until everything is read. */
export function suggestVerdict(id: QcElecItemId, r: ElecReading): 'pass' | 'fail' | null {
  if (!readingComplete(id, r)) return null;
  const d = defOf(id);
  if (r.intermittent) return 'fail';
  if (d.measures.some((m) => !measureOk(m, r.measures.find((x) => x.key === m.key)?.value ?? NaN))) return 'fail';
  if (d.checks.some((c) => !r.checks.find((x) => x.key === c)?.ok)) return 'fail';
  return 'pass';
}

export type ElecProblem = 'reading_incomplete' | 'note_required' | 'evidence_required' | 'cannot_soften' | 'unknown_item';

/** What stops a recording from being kept. A pass the reference does not support is refused outright: these checks have no override. */
export function attemptProblem(input: { itemId: QcElecItemId; verdict: 'pass' | 'fail'; reading: ElecReading; note?: string; evidenceCount: number }): ElecProblem | null {
  if (!ELEC_ITEMS.includes(input.itemId)) return 'unknown_item';
  if (!readingComplete(input.itemId, input.reading)) return 'reading_incomplete';
  const suggested = suggestVerdict(input.itemId, input.reading);
  if (input.verdict === 'pass' && suggested === 'fail') return 'cannot_soften';
  if (input.verdict === 'fail') {
    if ((input.note ?? '').trim().length < NOTE_MIN) return 'note_required';
    if (input.evidenceCount < 1) return 'evidence_required';
  }
  if (input.verdict === 'pass' && defOf(input.itemId).evidenceAlways && input.evidenceCount < 1) return 'evidence_required';
  return null;
}

export type ElecState = 'not_checked' | 'pass' | 'fail';
export const stateOf = (attempts: { verdict: 'pass' | 'fail' }[] | undefined): ElecState => {
  const last = attempts && attempts[attempts.length - 1];
  return last ? last.verdict : 'not_checked';
};

export type ElecSignOffProblem = 'items_open' | 'fail_open';
export const signOffProblem = (states: ElecState[]): ElecSignOffProblem | null => (states.some((s) => s === 'fail') ? 'fail_open' : states.some((s) => s === 'not_checked') ? 'items_open' : null);
