/**
 * The compliance certification's rules, pure (134). The certificate is AIEC's own internal quality-assurance document: it says the installation
 * was checked and is ready for the customer's own application to the State Lift / Electrical Inspectorate. It is not the government's licence
 * and never says so. The standard it cites follows the drive type that was sold; where the configuration is not one the two common standards
 * cover (a vacuum or screw-driven lift), nothing is guessed: Admin names the standard that applies and says why.
 *
 * Clause-level requirements are deliberately not reproduced: only the standard numbers AIEC's own contract and the brief already cite.
 */
import type { ComplianceStandard, ComplianceStandardId, DriveType } from '@/data/types';

export const STANDARD_IDS: ComplianceStandardId[] = ['IS_14665', 'IS_15259', 'IS_14671', 'other'];
/** The numbered standards, as written on the certificate. `other` carries the name Admin gave it. */
export const STANDARD_NUMBER: Record<Exclude<ComplianceStandardId, 'other'>, string> = { IS_14665: 'IS 14665', IS_15259: 'IS 15259', IS_14671: 'IS 14671' };
export const LABEL_MIN = 3;
export const REASON_MIN = 15;
export const MAX_ADDITIONAL = 4;

/** Electric traction lifts follow IS 14665 and hydraulic ones IS 15259. Null where the sold drive type is neither, so the choice is Admin's. */
export function standardFor(driveType: DriveType | null): Exclude<ComplianceStandardId, 'other' | 'IS_14671'> | null {
  if (driveType === 'hydraulic') return 'IS_15259';
  if (driveType === 'geared_traction' || driveType === 'gearless_traction' || driveType === 'mrl') return 'IS_14665';
  return null;
}

export type StandardsProblem = 'standard_required' | 'standard_label_required' | 'override_reason_required' | 'additional_reason_required' | 'duplicate_standard' | 'too_many_additional' | 'unknown_standard';

export interface StandardsInput {
  primary?: ComplianceStandard;
  additional: ComplianceStandard[];
  overrideReason?: string;
}

const known = (s: ComplianceStandard) => STANDARD_IDS.includes(s.id);
const keyOf = (s: ComplianceStandard) => (s.id === 'other' ? `other:${(s.label ?? '').trim().toLowerCase()}` : s.id);

/** What stops the standards choice from being kept. */
export function standardsProblem(driveType: DriveType | null, input: StandardsInput): StandardsProblem | null {
  const auto = standardFor(driveType);
  const primary = input.primary ?? (auto ? { id: auto } : null);
  if (!primary) return 'standard_required';
  if (![primary, ...input.additional].every(known)) return 'unknown_standard';
  if (![primary, ...input.additional].every((s) => s.id !== 'other' || (s.label ?? '').trim().length >= LABEL_MIN)) return 'standard_label_required';
  if (input.additional.length > MAX_ADDITIONAL) return 'too_many_additional';
  if (new Set([primary, ...input.additional].map(keyOf)).size !== 1 + input.additional.length) return 'duplicate_standard';
  // A primary that is not what the drive type gives is a documented choice; with no automatic answer the choice itself is the decision.
  if (auto && primary.id !== auto && (input.overrideReason ?? '').trim().length < REASON_MIN) return 'override_reason_required';
  if (input.additional.some((s) => (s.reason ?? '').trim().length < REASON_MIN)) return 'additional_reason_required';
  return null;
}

/** The primary standard as it will be cited: the automatic one, or what Admin chose. */
export function primaryOf(driveType: DriveType | null, input: StandardsInput): ComplianceStandard | null {
  const auto = standardFor(driveType);
  return input.primary ?? (auto ? { id: auto } : null);
}

export type ReadinessProblem = 'no_spec' | 'mechanical_open' | 'electrical_open' | 'rework_open' | 'before_records';
export interface ReadinessFacts {
  hasSpec: boolean;
  mechanicalSigned: boolean;
  electricalSigned: boolean;
  openRework: number;
  /** The job finished before digital checks were kept, so there is nothing to certify now. */
  beforeRecords: boolean;
}

/** Everything that has to be true before the certificate can be issued. */
export function readinessOf(f: ReadinessFacts): ReadinessProblem[] {
  if (f.beforeRecords) return ['before_records'];
  const out: ReadinessProblem[] = [];
  if (!f.hasSpec) out.push('no_spec');
  if (!f.mechanicalSigned) out.push('mechanical_open');
  if (!f.electricalSigned) out.push('electrical_open');
  if (f.openRework > 0) out.push('rework_open');
  return out;
}

export type ReissueProblem = 'reason_required';
export const reissueProblem = (reason: string): ReissueProblem | null => (reason.trim().length < REASON_MIN ? 'reason_required' : null);

export type GuidanceProblem = 'authority_required' | 'steps_required' | 'no_state';
export const guidanceProblem = (input: { state: string | null; authority: string; steps: string[] }): GuidanceProblem | null => {
  if (!input.state) return 'no_state';
  if (input.authority.trim().length < LABEL_MIN) return 'authority_required';
  if (input.steps.filter((s) => s.trim().length >= 3).length === 0) return 'steps_required';
  return null;
};
