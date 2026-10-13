import type { Role } from '@/data/types';

/**
 * The Authority Matrix (master prompt P1 / P2): who may decide what.
 *
 * The Owner decides platform decisions; Admin is the control tower and may
 * only monitor, flag and prepare packets. A delegate holds an Owner-given,
 * scope-limited, amount-limited, time-bound permission and never more than
 * the Owner. Partners decide their own prices and methods, customers their own
 * acceptance: the Owner never decides those, so they are not decision kinds.
 *
 * Pure: the repository (and later the database) asks these functions; the
 * screens only reflect the answer.
 */

export const DECISION_KINDS = [
  'fee_change',
  'guardrail_change',
  'rate_card_change',
  'partner_admission',
  'access_suspension',
  'tier_change',
  'verification_outcome',
  'dispute',
  'event_correction',
  'payout_release',
  'rule_change',
  'exception',
  'lead_ownership_dispute',
] as const;
export type DecisionKind = (typeof DECISION_KINDS)[number];

export type DecisionProposer = 'ai' | 'admin' | 'senior_partner' | 'system';

export interface AuthorityRow {
  kind: DecisionKind;
  proposedBy: DecisionProposer[];
  /** Only the Owner decides; a delegate may when `delegable` and the Owner's grant covers it. */
  delegable: boolean;
  /** Amounts above this need the Owner personally even when delegable (INR). null = no amount applies. */
  delegateLimitInr: number | null;
}

export const AUTHORITY_MATRIX: Record<DecisionKind, AuthorityRow> = {
  fee_change: { kind: 'fee_change', proposedBy: ['ai', 'admin'], delegable: false, delegateLimitInr: null },
  guardrail_change: { kind: 'guardrail_change', proposedBy: ['ai', 'admin'], delegable: false, delegateLimitInr: null },
  rate_card_change: { kind: 'rate_card_change', proposedBy: ['admin'], delegable: false, delegateLimitInr: null },
  partner_admission: { kind: 'partner_admission', proposedBy: ['ai', 'admin', 'senior_partner'], delegable: true, delegateLimitInr: null },
  access_suspension: { kind: 'access_suspension', proposedBy: ['ai', 'admin', 'system'], delegable: false, delegateLimitInr: null },
  tier_change: { kind: 'tier_change', proposedBy: ['system', 'admin'], delegable: true, delegateLimitInr: null },
  verification_outcome: { kind: 'verification_outcome', proposedBy: ['ai', 'admin', 'senior_partner'], delegable: true, delegateLimitInr: null },
  dispute: { kind: 'dispute', proposedBy: ['admin', 'system'], delegable: false, delegateLimitInr: null },
  event_correction: { kind: 'event_correction', proposedBy: ['admin', 'system'], delegable: true, delegateLimitInr: null },
  payout_release: { kind: 'payout_release', proposedBy: ['system', 'admin'], delegable: true, delegateLimitInr: 50_000 },
  rule_change: { kind: 'rule_change', proposedBy: ['ai', 'admin'], delegable: false, delegateLimitInr: null },
  exception: { kind: 'exception', proposedBy: ['admin', 'system'], delegable: false, delegateLimitInr: null },
  lead_ownership_dispute: { kind: 'lead_ownership_dispute', proposedBy: ['system', 'admin'], delegable: true, delegateLimitInr: null },
};

export interface DelegateGrant {
  /** Kinds the Owner handed over. */
  kinds: DecisionKind[];
  /** Largest amount (INR) the delegate may decide; null = the matrix limit applies. */
  maxAmountInr: number | null;
  /** ISO time the grant ends. */
  expiresAt: string;
  revoked: boolean;
}

export type CanDecide = { ok: true; as: 'owner' | 'delegate' } | { ok: false; reason: 'admin_cannot_decide' | 'role_cannot_decide' | 'not_delegable' | 'delegate_scope' | 'delegate_expired' | 'delegate_limit' };

/** Who may record a decision of this kind. Admin never may, whatever the grant says. */
export function canDecide(role: Role, kind: DecisionKind, opts: { grant?: DelegateGrant | null; amountInr?: number | null; now?: string } = {}): CanDecide {
  if (role === 'owner') return { ok: true, as: 'owner' };
  if (role === 'admin') return { ok: false, reason: 'admin_cannot_decide' };
  const grant = opts.grant;
  if (!grant) return { ok: false, reason: 'role_cannot_decide' };
  const row = AUTHORITY_MATRIX[kind];
  if (!row.delegable) return { ok: false, reason: 'not_delegable' };
  if (grant.revoked || Date.parse(grant.expiresAt) <= Date.parse(opts.now ?? new Date().toISOString())) return { ok: false, reason: 'delegate_expired' };
  if (!grant.kinds.includes(kind)) return { ok: false, reason: 'delegate_scope' };
  const cap = Math.min(grant.maxAmountInr ?? Infinity, row.delegateLimitInr ?? Infinity);
  if (opts.amountInr != null && opts.amountInr > cap) return { ok: false, reason: 'delegate_limit' };
  return { ok: true, as: 'delegate' };
}

/** Admin and Owner may prepare a Decision Packet; Admin's packet takes effect only after an Owner decision. */
export const canPrepareDecisionPacket = (role: Role): boolean => role === 'owner' || role === 'admin';

/** Admin sees decision status and the packet it prepared, never the evidence's personal contact data. */
export const canSeeDecisionDetail = (role: Role): boolean => role === 'owner';
export const canSeeDecisionStatus = (role: Role): boolean => role === 'owner' || role === 'admin';

/** A reason is required for every Owner decision (impact is previewed first). */
export const DECISION_REASON_MIN = 10;

export type DecisionAction = 'approve' | 'reject' | 'edit' | 'ask_info' | 'delegate';
export const DECISION_ACTIONS: DecisionAction[] = ['approve', 'reject', 'edit', 'ask_info', 'delegate'];

export function decisionProblem(input: { action: DecisionAction; reason: string; edits?: string; delegateTo?: string }): string | null {
  if (!DECISION_ACTIONS.includes(input.action)) return 'action_invalid';
  if (input.reason.trim().length < DECISION_REASON_MIN) return 'reason_short';
  if (input.action === 'edit' && !(input.edits ?? '').trim()) return 'edits_missing';
  if (input.action === 'delegate' && !(input.delegateTo ?? '').trim()) return 'delegate_missing';
  return null;
}

export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'info_requested' | 'delegated';
export const statusAfter = (action: DecisionAction): DecisionStatus =>
  ({ approve: 'approved', reject: 'rejected', edit: 'approved', ask_info: 'info_requested', delegate: 'delegated' } as const)[action];

/** A screen built for Admin is also open to the Owner (who holds every authority Admin holds). Admin never gets Owner-only screens. */
export const rolesAdmit = (roles: readonly Role[], role: Role): boolean => roles.includes(role) || (role === 'owner' && roles.includes('admin'));
