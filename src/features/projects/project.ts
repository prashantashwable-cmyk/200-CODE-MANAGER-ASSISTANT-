import type { LineKind } from '@/features/quotes/facilitatorQuote';
import type { MilestoneGate, MilestoneStatus } from '@/features/workorders/workOrder';

/** Just the facts of an order that a project's progress and handover are worked out from. */
export interface ProjectOrder {
  kind: LineKind;
  customerId: string;
  partnerAccountId: string;
  priceInr: number;
  milestones: { gate: MilestoneGate; amountInr: number; status: MilestoneStatus; qcInspectorId?: string }[];
}

const PAST_VERIFIED: MilestoneStatus[] = ['verified', 'payment_recorded', 'closed'];
export const isVerifiedOrBeyond = (s: MilestoneStatus): boolean => PAST_VERIFIED.includes(s);

export interface Progress { percent: number; verifiedInr: number; paidInr: number; totalInr: number; }
/**
 * How far a project is, weighted by money: the share of the agreed price whose milestones have been verified. Whole numbers, rounded down,
 * so 100% is shown only when every milestone has been verified. A project with nothing in it is 0%.
 */
export function projectProgress(orders: ProjectOrder[]): Progress {
  let total = 0; let verified = 0; let paid = 0;
  for (const o of orders) for (const m of o.milestones) {
    total += m.amountInr;
    if (isVerifiedOrBeyond(m.status)) verified += m.amountInr;
    if (m.status === 'payment_recorded' || m.status === 'closed') paid += m.amountInr;
  }
  return { percent: total === 0 ? 0 : Math.floor((verified * 100) / total), verifiedInr: verified, paidInr: paid, totalInr: total };
}

export type HandoverRole = 'customer' | 'installer' | 'qc';
export interface HandoverParty { role: HandoverRole; accountId: string; }

/**
 * Who must acknowledge the handover: the customer; the installer of each installation order; and the QC inspector the Owner named on that order's
 * handover milestone. If there is an installation but no inspector has been named, `qcMissing` says so and the handover cannot complete.
 */
export function handoverParties(orders: ProjectOrder[]): { parties: HandoverParty[]; qcMissing: boolean } {
  if (orders.length === 0) return { parties: [], qcMissing: false };
  const parties: HandoverParty[] = [{ role: 'customer', accountId: orders[0].customerId }];
  const installs = orders.filter((o) => o.kind === 'installation');
  for (const o of installs) if (!parties.some((p) => p.role === 'installer' && p.accountId === o.partnerAccountId)) parties.push({ role: 'installer', accountId: o.partnerAccountId });
  let qcFound = false;
  for (const o of installs) for (const m of o.milestones) {
    if (m.gate === 'on_handover' && m.qcInspectorId) { qcFound = true; if (!parties.some((p) => p.role === 'qc' && p.accountId === m.qcInspectorId)) parties.push({ role: 'qc', accountId: m.qcInspectorId }); }
  }
  return { parties, qcMissing: installs.length > 0 && !qcFound };
}

export type HandoverProblem = 'not_a_party' | 'handover_not_ready' | 'qc_missing' | 'already_acknowledged';
/** Everything before the handover milestones must be verified first; then each party acknowledges once. */
export function handoverReady(orders: ProjectOrder[]): boolean {
  return orders.length > 0 && orders.every((o) => o.milestones.every((m) => m.gate === 'on_handover' || isVerifiedOrBeyond(m.status)));
}
export function acknowledgeProblem(o: { orders: ProjectOrder[]; callerId: string; acks: HandoverParty[] }): HandoverProblem | null {
  const { parties, qcMissing } = handoverParties(o.orders);
  const mine = parties.filter((p) => p.accountId === o.callerId);
  if (mine.length === 0) return 'not_a_party';
  if (!handoverReady(o.orders)) return 'handover_not_ready';
  if (qcMissing) return 'qc_missing';
  return mine.every((p) => o.acks.some((a) => a.role === p.role && a.accountId === p.accountId)) ? 'already_acknowledged' : null;
}

export interface HandoverState { complete: boolean; parties: (HandoverParty & { signed: boolean })[]; qcMissing: boolean; ready: boolean; }
export function handoverState(orders: ProjectOrder[], acks: HandoverParty[]): HandoverState {
  const { parties, qcMissing } = handoverParties(orders);
  const marked = parties.map((p) => ({ ...p, signed: acks.some((a) => a.role === p.role && a.accountId === p.accountId) }));
  return { parties: marked, qcMissing, ready: handoverReady(orders), complete: marked.length > 0 && !qcMissing && marked.every((p) => p.signed) };
}

export type HandoverGateProblem = 'handover_unsigned';
/** The final, handover-gated milestone can be verified only after the handover record is complete. */
export const handoverGateProblem = (gate: MilestoneGate, handoverComplete: boolean): HandoverGateProblem | null => (gate === 'on_handover' && !handoverComplete ? 'handover_unsigned' : null);
