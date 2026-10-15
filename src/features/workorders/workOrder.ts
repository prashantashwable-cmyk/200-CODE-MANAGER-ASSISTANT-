/**
 * Customer–partner work orders and payment milestones (master prompt P0.3, P0.7, A6 steps 7–14), pure.
 *
 * A work order is between the CUSTOMER and ONE PARTNER (Mode F): the platform facilitates, records and
 * gates, and never holds partner money. A milestone becomes payable only after it is verified, and a
 * closed milestone is locked. In-app acceptance is NOT an electronic signature: a legal e-signature
 * needs a connected signing provider, and until one is connected the work order says so.
 *
 * Every default split below is a placeholder for the Owner: [ASSUMPTION]; legal effect is [VERIFY].
 */
import type { LineKind } from '@/features/quotes/facilitatorQuote';

export type WorkOrderStatus = 'issued' | 'in_progress' | 'completed' | 'declined' | 'cancelled';
export type MilestoneGate = 'on_acceptance' | 'on_delivery' | 'on_progress' | 'on_handover';
export type MilestoneStatus = 'waiting' | 'evidence_submitted' | 'verified' | 'payment_recorded' | 'closed';

export interface MilestoneTemplate { id: string; label: string; pct: number; gate: MilestoneGate; }

/** Material 90 / 10 comes from the original brief (90% on container arrival, 10% on handover). The rest are [ASSUMPTION]. */
export const DEFAULT_TEMPLATES: Record<LineKind, MilestoneTemplate[]> = {
  material: [
    { id: 'delivery', label: 'On verified delivery', pct: 90, gate: 'on_delivery' },
    { id: 'handover', label: 'On handover', pct: 10, gate: 'on_handover' },
  ],
  installation: [
    { id: 'progress', label: 'On verified progress', pct: 50, gate: 'on_progress' },
    { id: 'handover', label: 'On handover', pct: 50, gate: 'on_handover' },
  ],
  logistics: [{ id: 'delivery', label: 'On verified delivery', pct: 100, gate: 'on_delivery' }],
  amc: [{ id: 'start', label: 'On acceptance', pct: 100, gate: 'on_acceptance' }],
  statutory: [{ id: 'start', label: 'On acceptance (pass-through)', pct: 100, gate: 'on_acceptance' }],
};

export type WorkOrderProblem = 'template_empty' | 'template_sum' | 'template_pct' | 'template_duplicate' | 'price_invalid';

export function templateProblem(t: MilestoneTemplate[]): WorkOrderProblem | null {
  if (t.length === 0) return 'template_empty';
  if (t.some((m) => !Number.isInteger(m.pct) || m.pct <= 0)) return 'template_pct';
  if (new Set(t.map((m) => m.id)).size !== t.length) return 'template_duplicate';
  return t.reduce((s, m) => s + m.pct, 0) === 100 ? null : 'template_sum';
}

/**
 * Split a price across the template in whole rupees; the parts always add up to the price (largest remainder).
 * Integer arithmetic only: the remainder of milestone i is (price * pct) % 100, so ties are exact and always go to the
 * earlier milestone. The database function app.wo_split does the same sum; a parity test keeps the two identical.
 */
export function amountsFor(priceInr: number, t: MilestoneTemplate[]): number[] {
  if (!Number.isInteger(priceInr) || priceInr < 0 || templateProblem(t)) throw new Error('price_invalid');
  const floors = t.map((m) => Math.floor((priceInr * m.pct) / 100));
  const rem = t.map((m) => (priceInr * m.pct) % 100);
  let left = priceInr - floors.reduce((a, b) => a + b, 0);
  const order = rem.map((r, i) => ({ i, r })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const o of order) { if (left <= 0) break; floors[o.i] += 1; left -= 1; }
  return floors;
}

/** Statutory fees are passed through to the authority: there is no partner contract, so no work order. */
export const skipsWorkOrder = (kind: LineKind): boolean => kind === 'statutory';

export const MIN_EVIDENCE = 1;
export const MAX_EVIDENCE = 20;
export const MAX_EVIDENCE_NAME = 200;
export type EvidenceProblem = 'evidence_missing' | 'evidence_too_many' | 'evidence_name_long';
/** Evidence is recorded by file name until a storage provider is connected; the names must be present and bounded. */
export function evidenceNamesProblem(names: string[]): EvidenceProblem | null {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length < MIN_EVIDENCE) return 'evidence_missing';
  if (clean.length > MAX_EVIDENCE) return 'evidence_too_many';
  return clean.some((n) => n.length > MAX_EVIDENCE_NAME) ? 'evidence_name_long' : null;
}

export interface Milestone { id: string; label: string; gate: MilestoneGate; pct: number; amountInr: number; status: MilestoneStatus; evidence: string[]; /** The technician the Owner named to check this milestone (QC). */ qcInspectorId?: string; qcInspectorName?: string; }

export function milestonesOf(priceInr: number, t: MilestoneTemplate[]): Milestone[] {
  const amounts = amountsFor(priceInr, t);
  return t.map((m, i) => ({ id: m.id, label: m.label, gate: m.gate, pct: m.pct, amountInr: amounts[i], status: 'waiting' as const, evidence: [] }));
}

export interface PartyStanding { licenceValid: boolean; insuranceValid: boolean; suspended: boolean; }

export type StartProblem = 'not_accepted_by_customer' | 'not_accepted_by_partner' | 'partner_licence_lapsed' | 'partner_insurance_lapsed' | 'partner_suspended' | 'wrong_state';

/** Work starts only when both sides accepted and the partner is in good standing (registry gate, P0.9). */
export function startProblem(w: { status: WorkOrderStatus; customerAcceptedAt?: string; partnerAcceptedAt?: string }, partner: PartyStanding): StartProblem | null {
  if (w.status !== 'issued') return 'wrong_state';
  if (!w.customerAcceptedAt) return 'not_accepted_by_customer';
  if (!w.partnerAcceptedAt) return 'not_accepted_by_partner';
  if (partner.suspended) return 'partner_suspended';
  if (!partner.licenceValid) return 'partner_licence_lapsed';
  if (!partner.insuranceValid) return 'partner_insurance_lapsed';
  return null;
}

export type MilestoneProblem = 'reference_short' | 'reference_long' | 'locked' | 'not_waiting' | 'evidence_missing' | 'not_submitted' | 'not_verified' | 'qc_required' | 'self_verify' | 'not_payable';

/** Handover and progress milestones need an independent QC pass; delivery and acceptance need evidence only. */
export const needsQc = (g: MilestoneGate): boolean => g === 'on_handover' || g === 'on_progress';

export function submitEvidenceProblem(m: Milestone, evidenceCount: number): MilestoneProblem | null {
  if (m.status === 'closed' || m.status === 'payment_recorded') return 'locked';
  if (m.status !== 'waiting') return 'not_waiting';
  return evidenceCount >= MIN_EVIDENCE ? null : 'evidence_missing';
}

export function verifyProblem(m: Milestone, o: { verifierId: string; submitterId: string; qcPassed: boolean }): MilestoneProblem | null {
  if (m.status === 'closed' || m.status === 'payment_recorded') return 'locked';
  if (m.status !== 'evidence_submitted') return 'not_submitted';
  if (o.verifierId === o.submitterId) return 'self_verify';
  if (needsQc(m.gate) && !o.qcPassed) return 'qc_required';
  return null;
}

export type QcAssignProblem = 'locked' | 'invalid_state' | 'qc_inspector_required' | 'inspector_is_partner' | 'inspector_not_eligible';
/** The Owner may name an inspector until a milestone is verified. The inspector must be an active technician who is not the partner's own account. */
export function qcAssignProblem(m: Pick<Milestone, 'status'>, o: { inspectorId: string; partnerAccountId: string; inspectorEligible: boolean }): QcAssignProblem | null {
  if (m.status === 'closed' || m.status === 'payment_recorded') return 'locked';
  if (m.status === 'verified') return 'invalid_state';
  if (!o.inspectorId) return 'qc_inspector_required';
  if (o.inspectorId === o.partnerAccountId) return 'inspector_is_partner';
  return o.inspectorEligible ? null : 'inspector_not_eligible';
}
/** Who may verify one milestone: the Owner, or the technician the Owner named for it. Never the partner. */
export const mayVerify = (o: { role: string | undefined; callerId: string; partnerAccountId: string; inspectorId: string | undefined; orderOpen: boolean }): boolean =>
  o.orderOpen && o.callerId !== o.partnerAccountId && (o.role === 'owner' || (!!o.inspectorId && o.inspectorId === o.callerId));

export const REFERENCE_MIN = 4;
export const REFERENCE_MAX = 60;
/** The payment reference the customer types (UTR, cheque number…): present and bounded. */
export function referenceProblem(reference: string): MilestoneProblem | null {
  const r = reference.trim();
  return r.length < REFERENCE_MIN ? 'reference_short' : r.length > REFERENCE_MAX ? 'reference_long' : null;
}

/** A payment can be recorded only against a verified milestone; the platform records it, it does not move it. */
export function paymentProblem(m: Milestone): MilestoneProblem | null {
  if (m.status === 'closed' || m.status === 'payment_recorded') return 'locked';
  return m.status === 'verified' ? null : 'not_payable';
}

export function statusOfMilestones(ms: Milestone[]): WorkOrderStatus {
  return ms.length > 0 && ms.every((m) => m.status === 'closed' || m.status === 'payment_recorded') ? 'completed' : 'in_progress';
}

/** What the signing provider can honestly do. Until one is connected, acceptance is recorded in-app and labelled as such. */
export type SigningState = 'not_connected' | 'connected';
export function acceptanceLabel(signing: SigningState): 'in_app_acceptance' | 'esigned' { return signing === 'connected' ? 'esigned' : 'in_app_acceptance'; }

export type Side = 'customer' | 'partner' | 'staff';
/** Which side of an order an account is on: decided by the account, not by a role name. */
export function sideOf(callerId: string | undefined, o: { customerId: string; partnerAccountId: string }): Side {
  if (!callerId) return 'staff';
  return callerId === o.customerId ? 'customer' : callerId === o.partnerAccountId ? 'partner' : 'staff';
}

export interface Permissions { accept: boolean; start: boolean; submitEvidence: boolean; verify: boolean; assignQc: boolean; recordPayment: boolean; }
/** What each person may do next, the one definition the in-memory repository and the database mapping both use. The server still enforces every one. */
export function permissionsOf(o: { side: Side; role: string | undefined; status: WorkOrderStatus; customerAcceptedAt?: string; partnerAcceptedAt?: string; startBlock: StartProblem | null }): Permissions {
  const open = o.status === 'in_progress';
  return {
    accept: o.status === 'issued' && ((o.side === 'customer' && !o.customerAcceptedAt) || (o.side === 'partner' && !o.partnerAcceptedAt)),
    start: o.side === 'partner' && o.startBlock === null,
    submitEvidence: o.side === 'partner' && open,
    verify: open && o.role === 'owner', // verification outcomes are the Owner's (master prompt P1); a named QC inspector may verify only their own milestone (mayVerify)
    assignQc: open && o.role === 'owner',
    recordPayment: o.side === 'customer' && open,
  };
}
