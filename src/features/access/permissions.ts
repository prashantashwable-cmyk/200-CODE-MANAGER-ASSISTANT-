/**
 * Who may open which screen (192): the one rule the router, the permission screen and the repository all read. Pure.
 * The code's own route table is the starting point (a screen lists the roles it was built for); what Admin decides is only ever a difference from it, so a new screen or a new role needs no change here.
 * A role's decision grants or revokes a screen for the whole role; a person may carry an exception of their own, always with a reason and (by default) an end. Every number is a placeholder flagged on the screen.
 */
import type { Role } from '@/data/types';

export interface ScreenRef { id: string; path: string; roles: Role[] | 'public'; titleKey: string }
export const BUILT_IN_ROLES: Role[] = ['admin', 'surveyor', 'technician', 'customer', 'supplier'];
export const EXTERNAL_ROLES: Role[] = ['customer', 'supplier'];
/** A custom role (a QC inspector, a team lead) behaves like one of the built-in kinds for its home and its tab bar, and adds screens on top of it. */
export const CUSTOM_BASES: Role[] = ['surveyor', 'technician', 'supplier', 'customer'];
export interface RoleLite { id: string; baseRole: Role; builtIn: boolean }
export type Decision = 'grant' | 'revoke';
export type OverrideEffect = 'allow' | 'deny';
export type Source = 'public' | 'locked' | 'role_default' | 'role_grant' | 'role_revoke' | 'custom_role' | 'override_allow' | 'override_deny' | 'none';

/** Placeholders for the owner to confirm. */
export const REASON_MIN_ROLE = 15;
export const REASON_MIN_OVERRIDE = 20;
export const NAME_MIN = 3;
export const MAX_SCREENS_PER_CHANGE = 60;
export const OVERRIDE_MAX_DAYS = 365;
/** An exception with no end is looked at again this often. */
export const REVIEW_DAYS = 90;
export const PAGE = 25;
/** More exceptions than this on one role or person is worth a look: the permission model is drifting from its roles. */
export const CREEP_OVERRIDES = 5;
/** Screens an Admin can never lose: this one, the alerts board, the emergency chain. Every role also always keeps its own home (or a refusal would have nowhere to send them). */
export const ESSENTIAL_ADMIN_IDS = ['192', '029', '019'];

export const moduleOf = (id: string): number => { const n = Number(id); return Number.isFinite(n) && n >= 1 && n <= 200 ? Math.ceil(n / 10) : 0; };
export const isGoverned = (r: ScreenRef): boolean => r.roles !== 'public';
export const adminOnly = (r: ScreenRef): boolean => r.roles !== 'public' && r.roles.length === 1 && r.roles[0] === 'admin';
export const decisionKey = (roleId: string, screenId: string): string => `${roleId}|${screenId}`;

export const defaultAllows = (ref: ScreenRef, role: RoleLite): boolean => role.builtIn && ref.roles !== 'public' && ref.roles.includes(role.id as Role);
/** Locked in: the Admin's essential screens, and every role's own home. */
export const lockedFor = (ref: ScreenRef, role: RoleLite, homes: Record<Role, string>): boolean => (role.builtIn && role.id === 'admin' && ESSENTIAL_ADMIN_IDS.includes(ref.id)) || (role.builtIn && homes[role.id as Role] === ref.path);

export interface Cell { allowed: boolean; source: Source; locked: boolean; defaultAllowed: boolean }
export function cellOf(ref: ScreenRef, role: RoleLite, decisions: Map<string, Decision>, homes: Record<Role, string>): Cell {
  const defaultAllowed = defaultAllows(ref, role);
  if (ref.roles === 'public') return { allowed: true, source: 'public', locked: true, defaultAllowed: true };
  if (lockedFor(ref, role, homes)) return { allowed: true, source: 'locked', locked: true, defaultAllowed: true };
  const d = decisions.get(decisionKey(role.id, ref.id));
  if (d === 'grant') return { allowed: true, source: 'role_grant', locked: false, defaultAllowed };
  if (d === 'revoke') return { allowed: false, source: 'role_revoke', locked: false, defaultAllowed };
  return { allowed: defaultAllowed, source: defaultAllowed ? 'role_default' : 'none', locked: false, defaultAllowed };
}

export interface PersonAccess { baseRole: Role; customRoleIds: string[]; overrides: Map<string, OverrideEffect> }
/** Whether one person may open one screen, and why: an explicit "deny" of their own, then an "allow", then their role's decision, then any custom role they hold. Locked screens cannot be taken away. */
export function accessFor(ref: ScreenRef, p: PersonAccess, decisions: Map<string, Decision>, homes: Record<Role, string>): { allowed: boolean; source: Source } {
  if (ref.roles === 'public') return { allowed: true, source: 'public' };
  const base: RoleLite = { id: p.baseRole, baseRole: p.baseRole, builtIn: true };
  if (lockedFor(ref, base, homes)) return { allowed: true, source: 'locked' };
  const o = p.overrides.get(ref.id);
  if (o === 'deny') return { allowed: false, source: 'override_deny' };
  if (o === 'allow') return { allowed: true, source: 'override_allow' };
  const c = cellOf(ref, base, decisions, homes);
  if (c.allowed) return { allowed: true, source: c.source };
  for (const id of p.customRoleIds) if (decisions.get(decisionKey(id, ref.id)) === 'grant') return { allowed: true, source: 'custom_role' };
  return { allowed: false, source: c.source === 'role_revoke' ? 'role_revoke' : 'none' };
}

export type Risk = 'low' | 'medium' | 'high';
/** How much a grant matters: an admin-only screen given to anyone else, or any screen given to an outside role (customer, supplier) it was not built for, is high; to another internal role it was not built for, medium. */
export function riskOf(ref: ScreenRef, target: RoleLite): Risk {
  if (ref.roles === 'public' || (target.builtIn && target.id === 'admin')) return 'low';
  if (defaultAllows(ref, { ...target, builtIn: true, id: target.baseRole })) return 'low';
  if (adminOnly(ref)) return 'high';
  if (EXTERNAL_ROLES.includes(target.baseRole)) return 'high';
  return 'medium';
}
export const worstRisk = (rs: Risk[]): Risk => (rs.includes('high') ? 'high' : rs.includes('medium') ? 'medium' : 'low');

export type ChangeProblem = 'reason_short' | 'no_screens' | 'too_many' | 'locked' | 'public_screen' | 'high_risk_unconfirmed' | 'nothing_to_revoke' | 'last_admin' | 'until_invalid' | 'name_short' | 'name_taken' | 'base_invalid' | 'role_in_use' | 'not_found';
export const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;
export const reasonProblem = (reason: string, min: number): ChangeProblem | null => (lettersOf(reason) < min ? 'reason_short' : null);
export const untilProblem = (until: string | null | undefined, now: number): ChangeProblem | null => {
  if (!until) return null;
  const at = Date.parse(until);
  if (!Number.isFinite(at) || at <= now || at > now + OVERRIDE_MAX_DAYS * 86_400_000) return 'until_invalid';
  return null;
};
/** When an exception is next looked at: its own end, or the review rhythm from when it was made or last reviewed. */
export const overrideDueAt = (o: { until?: string | null; createdAt: string; reviewedAt?: string | null }): string => {
  const review = Date.parse(o.reviewedAt ?? o.createdAt) + REVIEW_DAYS * 86_400_000;
  return new Date(o.until ? Math.min(Date.parse(o.until), review) : review).toISOString();
};
export const isExpired = (o: { until?: string | null }, now: number): boolean => !!o.until && Date.parse(o.until) <= now;
