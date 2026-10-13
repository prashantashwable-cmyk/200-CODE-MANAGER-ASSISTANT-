/**
 * Authentication integrity (195): who must use a second factor, how long a session may live, when repeated failures pause a sign-in, when a sign-in from somewhere new needs a word from
 * the person, and how an account is recovered after a lost device. Pure: the screen, the sign-in gate and the repository judge with the same rules.
 * Every number below is a placeholder business decision flagged on the screen.
 */
import { isIndianMobile } from '@/features/validation/india';
export type SecRole = 'admin' | 'surveyor' | 'technician' | 'customer' | 'supplier';
export const SEC_ROLES: SecRole[] = ['admin', 'surveyor', 'technician', 'supplier', 'customer'];

export const METHODS = ['authenticator', 'second_phone'] as const;
export type SecondFactorMethod = (typeof METHODS)[number];

export interface PasswordPolicy { minLength: number; requireUpper: boolean; requireDigit: boolean; requireSymbol: boolean; rotateDays: number; reuseBlock: number }
export interface SignInPolicy { maxFailed: number; failedWindowMin: number; lockoutMin: number }
export interface SessionLimit { idleMinutes: number; maxHours: number }
export interface RoleTwoFactor { required: boolean; graceDays: number }
export interface SecurityConfig {
  twoFactor: Record<SecRole, RoleTwoFactor>;
  password: PasswordPolicy;
  signIn: SignInPolicy;
  sessions: Record<SecRole, SessionLimit>;
}

/** Defaults (placeholders). Admin's second factor is not optional: it guards every other account. */
export const DEFAULT_CONFIG: SecurityConfig = {
  twoFactor: {
    admin: { required: true, graceDays: 0 },
    surveyor: { required: false, graceDays: 14 },
    technician: { required: false, graceDays: 14 },
    supplier: { required: false, graceDays: 14 },
    customer: { required: false, graceDays: 14 },
  },
  password: { minLength: 10, requireUpper: true, requireDigit: true, requireSymbol: false, rotateDays: 0, reuseBlock: 3 },
  signIn: { maxFailed: 5, failedWindowMin: 15, lockoutMin: 15 },
  sessions: {
    admin: { idleMinutes: 60, maxHours: 12 },
    surveyor: { idleMinutes: 10_080, maxHours: 720 },
    technician: { idleMinutes: 10_080, maxHours: 720 },
    supplier: { idleMinutes: 10_080, maxHours: 720 },
    customer: { idleMinutes: 20_160, maxHours: 2_160 },
  },
};

export const REASON_MIN = 10;
export const NOTE_MIN = 20;
export const EXCEPTION_MAX_DAYS = 90;
export const EXCEPTION_NUDGE_DAYS = 7;
export const RECOVERY_TTL_H = 24;
export const RECOVERY_MAX_TRIES = 5;
export const RECOVERY_CODE_LENGTH = 8;
/** A place a person confirmed ("yes, that was me, I am travelling") is trusted for this long. */
export const TRUST_DAYS = 30;
export const LOCATION_REVIEW_H = 24;
export const DECIDE_DAYS = 2;
export const EVENTS_PAGE = 30;
/** A second code is simulated in this build (no authenticator or SMS gateway): it is shown on screen and said so. */
/** A person excused from the second step has sessions capped at this many hours, and a new place needs Admin's word. */
export const EXCUSED_MAX_HOURS = 8;
export const TWOFA_TRIES = 5;
export const DEMO_SECOND_CODE = '246810';

export type SecurityEventKind =
  | 'login_success' | 'login_failed' | 'login_paused' | 'new_location' | 'location_confirmed' | 'location_denied'
  | 'session_revoked' | 'sessions_revoked_all' | 'session_expired' | 'device_lost' | 'account_locked'
  | 'recovery_started' | 'recovery_completed' | 'recovery_failed' | 'recovery_cancelled'
  | 'twofa_enrolled' | 'twofa_passed' | 'twofa_failed' | 'twofa_requested' | 'twofa_exception_granted' | 'twofa_exception_declined' | 'twofa_exception_ended'
  | 'policy_changed' | 'password_reset';
export type EventSeverity = 'info' | 'notice' | 'warning' | 'critical';

export const SEVERITY_OF: Record<SecurityEventKind, EventSeverity> = {
  login_success: 'info', login_failed: 'notice', login_paused: 'warning', new_location: 'warning', location_confirmed: 'info', location_denied: 'critical',
  session_revoked: 'notice', sessions_revoked_all: 'notice', session_expired: 'info', device_lost: 'critical', account_locked: 'critical',
  recovery_started: 'warning', recovery_completed: 'notice', recovery_failed: 'warning', recovery_cancelled: 'info',
  twofa_enrolled: 'info', twofa_passed: 'info', twofa_failed: 'notice', twofa_requested: 'notice', twofa_exception_granted: 'warning', twofa_exception_declined: 'info', twofa_exception_ended: 'info',
  policy_changed: 'notice', password_reset: 'notice',
};
export const EVENT_GROUPS: Record<string, SecurityEventKind[]> = {
  signins: ['login_success', 'login_failed', 'login_paused', 'session_expired'],
  places: ['new_location', 'location_confirmed', 'location_denied'],
  devices: ['session_revoked', 'sessions_revoked_all', 'device_lost', 'account_locked', 'recovery_started', 'recovery_completed', 'recovery_failed', 'recovery_cancelled'],
  factors: ['twofa_enrolled', 'twofa_passed', 'twofa_failed', 'twofa_requested', 'twofa_exception_granted', 'twofa_exception_declined', 'twofa_exception_ended'],
  rules: ['policy_changed', 'password_reset'],
};

export type ConfigProblem =
  | 'admin_2fa_locked' | 'grace_range' | 'min_length_range' | 'rotate_range' | 'reuse_range' | 'failed_range' | 'window_range' | 'lockout_range' | 'idle_range' | 'hours_range';
const inRange = (n: number, lo: number, hi: number): boolean => Number.isInteger(n) && n >= lo && n <= hi;

/** What stops a configuration from being saved. */
export function configProblems(c: SecurityConfig): ConfigProblem[] {
  const out: ConfigProblem[] = [];
  if (!c.twoFactor.admin.required) out.push('admin_2fa_locked');
  if (SEC_ROLES.some((r) => !inRange(c.twoFactor[r].graceDays, 0, 30)) || c.twoFactor.admin.graceDays > 7) out.push('grace_range');
  if (!inRange(c.password.minLength, 8, 64)) out.push('min_length_range');
  if (!(c.password.rotateDays === 0 || inRange(c.password.rotateDays, 30, 365))) out.push('rotate_range');
  if (!inRange(c.password.reuseBlock, 0, 10)) out.push('reuse_range');
  if (!inRange(c.signIn.maxFailed, 3, 10)) out.push('failed_range');
  if (!inRange(c.signIn.failedWindowMin, 5, 60)) out.push('window_range');
  if (!inRange(c.signIn.lockoutMin, 5, 1440)) out.push('lockout_range');
  if (SEC_ROLES.some((r) => !inRange(c.sessions[r].idleMinutes, 5, 43_200))) out.push('idle_range');
  if (SEC_ROLES.some((r) => !inRange(c.sessions[r].maxHours, 1, 2_160))) out.push('hours_range');
  return out;
}

/** Changes that make sign-in easier to get wrong or to abuse: each is allowed, but only with an explicit confirmation. */
export function weakenings(prev: SecurityConfig, next: SecurityConfig): string[] {
  const out: string[] = [];
  for (const r of SEC_ROLES) {
    if (prev.twoFactor[r].required && !next.twoFactor[r].required) out.push(`twofa_off:${r}`);
    if (next.twoFactor[r].required && next.twoFactor[r].graceDays > prev.twoFactor[r].graceDays && prev.twoFactor[r].required) out.push(`grace_longer:${r}`);
    if (next.sessions[r].maxHours > prev.sessions[r].maxHours) out.push(`session_longer:${r}`);
    if (next.sessions[r].idleMinutes > prev.sessions[r].idleMinutes) out.push(`idle_longer:${r}`);
  }
  if (next.password.minLength < prev.password.minLength) out.push('password_shorter');
  if ((prev.password.requireUpper && !next.password.requireUpper) || (prev.password.requireDigit && !next.password.requireDigit) || (prev.password.requireSymbol && !next.password.requireSymbol)) out.push('password_classes');
  if ((prev.password.rotateDays !== 0 && next.password.rotateDays === 0) || (prev.password.rotateDays !== 0 && next.password.rotateDays > prev.password.rotateDays)) out.push('rotation_longer');
  if (next.password.reuseBlock < prev.password.reuseBlock) out.push('reuse_less');
  if (next.signIn.maxFailed > prev.signIn.maxFailed) out.push('more_failures');
  if (next.signIn.lockoutMin < prev.signIn.lockoutMin) out.push('shorter_pause');
  return out;
}

export type PasswordProblem = 'length' | 'upper' | 'digit' | 'symbol';
export function passwordProblems(p: PasswordPolicy, password: string): PasswordProblem[] {
  const out: PasswordProblem[] = [];
  if (password.length < p.minLength) out.push('length');
  // Devanagari has no upper case: a letter of that script counts as a distinct letter class.
  if (p.requireUpper && !/[A-Z\u0900-\u097F]/.test(password)) out.push('upper');
  if (p.requireDigit && !/\d/.test(password)) out.push('digit');
  if (p.requireSymbol && !/[^A-Za-z0-9\s]/.test(password)) out.push('symbol');
  return out;
}

export type LocationVerdict = 'unknown' | 'usual' | 'new';
const norm = (s: string): string => s.trim().toLowerCase();
/** Is a sign-in from this city one the person is known to make? A sign-in with no place on it is not judged either way. */
export function locationVerdict(city: string | null | undefined, usual: string[]): LocationVerdict {
  if (!city || !city.trim()) return 'unknown';
  return usual.map(norm).includes(norm(city)) ? 'usual' : 'new';
}

export type TwoFactorState = 'not_required' | 'enrolled' | 'grace' | 'excepted' | 'blocked';
export interface TwoFactorInput {
  required: boolean;
  graceDays: number;
  /** When the role's requirement last came into force. */
  requiredSince: string | null;
  enrolled: boolean;
  exceptionUntil: string | null;
}
export function twoFactorStateOf(i: TwoFactorInput, now: number): { state: TwoFactorState; graceEnds: string | null } {
  if (i.enrolled) return { state: 'enrolled', graceEnds: null };
  if (!i.required) return { state: 'not_required', graceEnds: null };
  if (i.exceptionUntil && Date.parse(i.exceptionUntil) > now) return { state: 'excepted', graceEnds: null };
  const ends = i.requiredSince ? Date.parse(i.requiredSince) + i.graceDays * 86_400_000 : now;
  return Date.parse(new Date(ends).toISOString()) > now ? { state: 'grace', graceEnds: new Date(ends).toISOString() } : { state: 'blocked', graceEnds: null };
}

export type ExceptionProblem = 'reason_short' | 'until_invalid' | 'until_too_far';
export function exceptionProblem(input: { reason: string; until: string }, now: number): ExceptionProblem | null {
  if (lettersOf(input.reason) < NOTE_MIN) return 'reason_short';
  const t = Date.parse(input.until);
  if (!Number.isFinite(t) || t <= now) return 'until_invalid';
  if (t > now + EXCEPTION_MAX_DAYS * 86_400_000) return 'until_too_far';
  return null;
}

export const lettersOf = (s: string): number => (s.match(/[\p{L}\p{N}]/gu) ?? []).length;
export const digitsOf = (s: string): string => s.replace(/\D/g, '');
export const last10 = (s: string): string => digitsOf(s).slice(-10);
export const maskPhone = (p: string): string => { const d = digitsOf(p); return d.length >= 4 ? `••••••${d.slice(-4)}` : '••••'; };
export const isValidPhone = (p: string): boolean => isIndianMobile(p);

/** A fast non-cryptographic hash: the recovery code is never stored as typed. A real backend would use a slow salted hash. */
export function hashCode(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export interface FailureLine { at: string; kind: 'login_failed' | 'login_success' }
/** Has repeated failure paused this sign-in? Failures count from the last success, inside the window. */
export function pauseOf(lines: FailureLine[], p: SignInPolicy, now: number): { paused: boolean; until: string | null; recent: number } {
  const sorted = [...lines].sort((a, b) => (a.at < b.at ? -1 : 1));
  const lastOk = [...sorted].reverse().find((l) => l.kind === 'login_success');
  const since = Math.max(now - p.failedWindowMin * 60_000, lastOk ? Date.parse(lastOk.at) : 0);
  const fails = sorted.filter((l) => l.kind === 'login_failed' && Date.parse(l.at) > since);
  if (fails.length < p.maxFailed) return { paused: false, until: null, recent: fails.length };
  const until = Date.parse(fails[fails.length - 1].at) + p.lockoutMin * 60_000;
  return until > now ? { paused: true, until: new Date(until).toISOString(), recent: fails.length } : { paused: false, until: null, recent: fails.length };
}

export type SessionEnd = 'idle' | 'too_long' | null;
/** Has a session outlived what its role allows? */
export function expiryOf(s: { openedAt: string; lastActiveAt: string }, limit: SessionLimit, now: number): SessionEnd {
  if (now - Date.parse(s.openedAt) > limit.maxHours * 3_600_000) return 'too_long';
  if (now - Date.parse(s.lastActiveAt) > limit.idleMinutes * 60_000) return 'idle';
  return null;
}

/** "Chrome on Android" from a browser's own description of itself. */
export function deviceLabelOf(ua: string): { label: string; platform: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other' } {
  const platform = /android/i.test(ua) ? 'android' : /iphone|ipad|ios/i.test(ua) ? 'ios' : /windows/i.test(ua) ? 'windows' : /mac os/i.test(ua) ? 'mac' : /linux/i.test(ua) ? 'linux' : 'other';
  const browser = /edg\//i.test(ua) ? 'Edge' : /firefox/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Browser';
  const os = { android: 'Android', ios: 'iPhone', windows: 'Windows', mac: 'Mac', linux: 'Linux', other: 'this device' }[platform];
  return { label: `${browser} · ${os}`, platform };
}
