/** Screen 003 — OTP Verification. Types and translation keys only. */

export type OtpPhase =
  | 'entering'
  | 'verifying'
  | 'success'
  /** The code aged out while the app was backgrounded — resend, don't retype. */
  | 'expired'
  /** Too many wrong codes; a visible countdown, never a silent block. */
  | 'cooldown'
  /** Resend cap hit — protects SMS spend and blocks abuse. */
  | 'resendBlocked'
  /** S1: signed in, but Admin has not given this phone a role yet. */
  | 'pending'
  /** S1: the account is suspended or was turned away. */
  | 'inactive'
  /** Signed in with Google, no profile yet: the person types the mobile number to confirm. */
  | 'phone';

export type OtpError =
  | 'wrongCode'
  | 'malformed'
  | 'network'
  | 'missingContext'
  | 'tooMany'
  | 'phoneLinked'
  | 'wrongServerCode'
  /** Google sign-in: that number already has its own AIEC sign-in (one person, one account). */
  | 'phoneTaken'
  | 'invalidPhone';

/** Roles a person waiting for Admin may ask for (Admin itself is never asked for). */
export const REQUESTABLE_ROLES = ['surveyor', 'technician', 'customer', 'supplier'] as const;

export const OTP_LENGTH = 6;
/** A code is good for five minutes from the moment it was sent. */
export const OTP_TTL_MS = 5 * 60 * 1000;
export const RESEND_COOLDOWN_S = 30;
/** The spec's rule: from the third wrong code, the wait doubles. */
export const ESCALATED_COOLDOWN_S = 60;
export const WRONG_ATTEMPTS_BEFORE_ESCALATION = 3;
export const MAX_RESENDS = 5;
export const RESEND_WINDOW_MS = 10 * 60 * 1000;

/**
 * The in-memory build (no Supabase project) has no SMS gateway, so its code cannot arrive by message: it is shown on
 * screen instead, and the screen says why. With a Supabase project (S1) the server makes and checks a real code.
 */
export const DEMO_OTP = '123456';

export const OTP_KEYS = {
  title: 'otp.title',
  sentTo: 'otp.sentTo',
  inputLabel: 'otp.inputLabel',
  verify: 'otp.verify',
  verifying: 'otp.verifying',
  success: 'otp.success',
  changeNumber: 'otp.changeNumber',
  resend: 'otp.resend',
  resendIn: 'otp.resendIn',
  resendCount: 'otp.resendCount',
  countryNote: 'otp.countryNote',
  noGateway: 'otp.noGateway',
  server: { smsConnected: 'otp.server.smsConnected', smsNotConnected: 'otp.server.smsNotConnected' },
  pending: {
    title: 'otp.pending.title',
    body: 'otp.pending.body',
    ask: 'otp.pending.ask',
    asked: 'otp.pending.asked',
    askFailed: 'otp.pending.askFailed',
  },
  inactive: { title: 'otp.inactive.title', body: 'otp.inactive.body' },
  link: {
    title: 'otp.link.title',
    body: 'otp.link.body',
    field: 'otp.link.field',
    hint: 'otp.link.hint',
    send: 'otp.link.send',
  },
  expired: { title: 'otp.expired.title', body: 'otp.expired.body', action: 'otp.expired.action' },
  cooldown: { title: 'otp.cooldown.title', body: 'otp.cooldown.body' },
  resendBlocked: { title: 'otp.resendBlocked.title', body: 'otp.resendBlocked.body' },
  error: {
    wrongCode: 'otp.error.wrongCode',
    malformed: 'otp.error.malformed',
    network: 'otp.error.network',
    missingContext: 'otp.error.missingContext',
    tooMany: 'otp.error.tooMany',
    phoneLinked: 'otp.error.phoneLinked',
    wrongServerCode: 'otp.error.wrongServerCode',
    phoneTaken: 'otp.error.phoneTaken',
    invalidPhone: 'otp.error.invalidPhone',
  },
} as const;
