/**
 * The customer handover walkthrough's rules, pure (138). This is the human moment the brief calls the final manager handover: someone walks
 * the customer through their lift, hands over the documents, and the customer confirms for themselves that they understand the basics. The
 * customer's sign-off is a separate, later event from every technical gate: it says the customer was shown and understood, not that the lift
 * passed. It is also the moment to offer AMC, and to ask how it went.
 */
import { days, hours } from '@/features/sla/clock';

export type WalkthroughMode = 'in_person' | 'video_call' | 'site_representative';
export const MODES: WalkthroughMode[] = ['in_person', 'video_call', 'site_representative'];

export type ScriptGroup = 'operation' | 'emergency' | 'care';
export interface ScriptItem {
  id: string;
  group: ScriptGroup;
  mandatory: boolean;
  /** Only when the sold configuration has it (for example the automatic rescue device needs power backup). */
  appliesWhen?: 'powerBackup';
}

export const SCRIPT: ScriptItem[] = [
  { id: 'call_and_ride', group: 'operation', mandatory: true },
  { id: 'doors_and_sensors', group: 'operation', mandatory: true },
  { id: 'car_controls', group: 'operation', mandatory: true },
  { id: 'power_cut', group: 'emergency', mandatory: true },
  { id: 'ard_rescue', group: 'emergency', mandatory: true, appliesWhen: 'powerBackup' },
  { id: 'alarm_intercom', group: 'emergency', mandatory: true },
  { id: 'stuck_in_lift', group: 'emergency', mandatory: true },
  { id: 'cleaning', group: 'care', mandatory: true },
  { id: 'what_not_to_do', group: 'care', mandatory: true },
  { id: 'servicing', group: 'care', mandatory: false },
];

export type WalkthroughDoc = 'warranty_terms' | 'amc_options' | 'user_manual' | 'emergency_contacts';
export const DOCS: WalkthroughDoc[] = ['warranty_terms', 'amc_options', 'user_manual', 'emergency_contacts'];

export const scriptFor = (powerBackup: boolean): ScriptItem[] => SCRIPT.filter((i) => i.appliesWhen !== 'powerBackup' || powerBackup);

/** When the customer cannot be there, their own sign-off is collected separately and soon after. These are AIEC's placeholder windows. */
export const SIGNOFF_DUE_PRESENT = hours(24);
export const SIGNOFF_DUE_REMOTE = days(3);
export const FOLLOWUP_DUE = hours(24);
export const ARRANGE_DUE = hours(48);
export const NEGATIVE_AT = 2;
export const QUESTION_MIN = 10;
export const NAME_MIN = 2;

export const isNegative = (score: number): boolean => score <= NEGATIVE_AT;

export type WalkthroughProblem =
  | 'mode_required' | 'conductor_required' | 'representative_required' | 'script_open' | 'documents_open' | 'not_unlocked' | 'invalid_state' | 'not_conducted'
  | 'understood_required' | 'signature_required' | 'signer_required' | 'already_signed' | 'score_invalid' | 'tier_required' | 'question_required' | 'answer_required'
  | 'not_found' | 'forbidden' | 'date_required';

export function arrangeProblem(i: { mode: WalkthroughMode | undefined; conductorId: string | undefined; representative?: { name: string; phone: string } }): WalkthroughProblem | null {
  if (!i.mode || !MODES.includes(i.mode)) return 'mode_required';
  if (!i.conductorId) return 'conductor_required';
  if (i.mode === 'site_representative' && (!i.representative || i.representative.name.trim().length < NAME_MIN || i.representative.phone.replace(/\D/g, '').length < 10)) return 'representative_required';
  return null;
}

/** The walkthrough is done only once everything that had to be shown was shown, and every document was handed over. */
export function conductProblem(i: { arranged: boolean; scriptOpen: number; docsOpen: number }): WalkthroughProblem | null {
  if (!i.arranged) return 'mode_required';
  if (i.scriptOpen > 0) return 'script_open';
  if (i.docsOpen > 0) return 'documents_open';
  return null;
}

export function signoffProblem(i: { conducted: boolean; signed: boolean; understood: boolean; onDevice: boolean; signature: string; signer: string }): WalkthroughProblem | null {
  if (i.signed) return 'already_signed';
  if (!i.conducted) return 'not_conducted';
  if (!i.understood) return 'understood_required';
  if (i.onDevice) {
    if (i.signer.trim().length < NAME_MIN) return 'signer_required';
    if (!i.signature) return 'signature_required';
  }
  return null;
}

export const scoreProblem = (score: number): WalkthroughProblem | null => (Number.isInteger(score) && score >= 1 && score <= 5 ? null : 'score_invalid');
export const amcProblem = (i: { choice: 'enrol' | 'later' | 'declined'; tier?: string }): WalkthroughProblem | null => (i.choice === 'enrol' && !i.tier ? 'tier_required' : null);
export const questionProblem = (text: string): WalkthroughProblem | null => (text.trim().length < QUESTION_MIN ? 'question_required' : null);
