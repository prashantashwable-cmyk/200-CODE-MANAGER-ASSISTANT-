/**
 * The manual override console (188): the few places where Admin may force what an automated rule would not, and the places where nobody may. Pure: the screen and the repository read the same rules,
 * so what the console warns about is exactly what it enforces. Every number is a placeholder flagged on the screen.
 */
import type { LeadStage } from '@/data/types';

export type OverrideKind = 'lead_stage' | 'payout_clear' | 'stop_reminders' | 'commitment_waive';
export const OVERRIDE_KINDS: OverrideKind[] = ['lead_stage', 'payout_clear', 'stop_reminders', 'commitment_waive'];

/** Guardrails built to have no override at all. The console refuses them structurally (and keeps the attempt), however it is asked. */
export const PROTECTED_KINDS = ['qc_failure', 'safety_check', 'handover_gate', 'compliance_certificate', 'training_gate'] as const;
export type ProtectedKind = (typeof PROTECTED_KINDS)[number];
export const isProtected = (k: string): k is ProtectedKind => (PROTECTED_KINDS as readonly string[]).includes(k);
/** What each protected guardrail is, and where the real fix lives. */
export const PROTECTED_ROUTE: Record<ProtectedKind, string> = { qc_failure: '/qc-assignments', safety_check: '/safety-checklist', handover_gate: '/handover-checklist', compliance_certificate: '/compliance', training_gate: '/training-compliance' };

export const REASON_MIN = 20;
/** A reminder stop always ends: it cannot be open-ended. */
export const STOP_MAX_DAYS = 30;
/** A lead this long in one stage is "stuck" and offered first. */
export const STUCK_DAYS = 14;
/** The same kind of override this often, this recently, says the rule is wrong, not the case. */
export const PATTERN_MIN = 3;
export const PATTERN_DAYS = 30;

/** Where the rule behind each kind is changed, so a recurring override can be fixed at its root. */
export const RULE_ROUTE: Record<OverrideKind, string> = { lead_stage: '/admin/leads/pipeline', payout_clear: '/payout-approval', stop_reminders: '/admin/analytics/collections/reminders', commitment_waive: '/automation-rules' };

/** Obligations whose chasing is itself a safety or compliance guardrail: waiving one is refused outright. */
export const PROTECTED_COMMITMENT = /^(safety_|qc_|snag_|handover_|walkthrough_|compliance_|certification_|escalation_|job_issue_|payout_disbursement|training_feedback_urgent|integration_followup)/;
export const commitmentProtected = (kind: string): boolean => PROTECTED_COMMITMENT.test(kind);

export const OVERRIDABLE_STAGES: LeadStage[] = ['captured', 'contacted', 'site_visit', 'quoted', 'negotiation'];
const STAGE_ORDER: LeadStage[] = ['captured', 'contacted', 'site_visit', 'quoted', 'negotiation', 'won', 'lost'];

export type OverrideProblem = 'reason_short' | 'confirm_required' | 'same_stage' | 'won_needs_deal' | 'lost_needs_reason' | 'until_required' | 'until_too_far' | 'until_past' | 'no_override_path' | 'safety_critical_open' | 'not_overridable_state';
export const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;
export const reasonProblem = (reason: string): OverrideProblem | null => (lettersOf(reason) < REASON_MIN ? 'reason_short' : null);

export function leadStageProblem(from: LeadStage, to: string): OverrideProblem | null {
  if (to === 'won') return 'won_needs_deal';
  if (to === 'lost') return 'lost_needs_reason';
  if (!OVERRIDABLE_STAGES.includes(to as LeadStage)) return 'not_overridable_state';
  if (to === from) return 'same_stage';
  return null;
}
/** The stages a forward move passes over: they never happened, so what each would have triggered did not. */
export function skippedStages(from: LeadStage, to: LeadStage): LeadStage[] {
  const a = STAGE_ORDER.indexOf(from);
  const b = STAGE_ORDER.indexOf(to);
  return b > a + 1 ? STAGE_ORDER.slice(a + 1, b) : [];
}
export const isBackwards = (from: LeadStage, to: LeadStage): boolean => STAGE_ORDER.indexOf(to) < STAGE_ORDER.indexOf(from);

export function untilProblem(until: string, now: number): OverrideProblem | null {
  if (!until) return 'until_required';
  const t = Date.parse(`${until}T23:59:59`);
  if (!Number.isFinite(t) || t < now) return 'until_past';
  return t > now + STOP_MAX_DAYS * 86_400_000 ? 'until_too_far' : null;
}

export interface OverrideLite { kind: string; status: 'applied' | 'refused'; at: string }
/** Kinds Admin keeps overriding: three in a month is a rule to fix, not a case to keep forcing. */
export function patternsOf(list: OverrideLite[], now: number): { kind: string; count: number }[] {
  const since = now - PATTERN_DAYS * 86_400_000;
  const counts = new Map<string, number>();
  for (const o of list) if (o.status === 'applied' && Date.parse(o.at) >= since) counts.set(o.kind, (counts.get(o.kind) ?? 0) + 1);
  return [...counts.entries()].filter(([, n]) => n >= PATTERN_MIN).map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);
}
