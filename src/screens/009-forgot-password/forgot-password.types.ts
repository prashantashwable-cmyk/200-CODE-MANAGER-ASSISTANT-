/** Screen 009 — Forgot password / reset flow. Types and keys only. */

export type ResetPhase =
  | 'identify'
  | 'sending'
  | 'code'
  | 'password'
  | 'submitting'
  | 'done'
  /** No verified phone or email on the account — needs a human. */
  | 'noChannels'
  /** Too many reset requests for this account in the window. */
  | 'rateLimited';

export type ResetChannel = 'sms' | 'whatsapp' | 'email';

export type ResetError =
  | 'unknownAccount'
  | 'wrongCode'
  | 'expiredCode'
  | 'supersededCode'
  | 'samePassword'
  | 'weakPassword'
  | 'mismatch'
  | 'network';

/** A reset code is single-use and dies after fifteen minutes. */
export const RESET_CODE_TTL_MS = 15 * 60 * 1000;
export const MAX_RESET_REQUESTS = 3;
export const RESET_WINDOW_MS = 15 * 60 * 1000;
export const RESET_CODE_LENGTH = 6;

/** No messaging gateway exists in this build; the code is shown on screen. */
export const DEMO_RESET_CODE = '654321';

export const RESET_KEYS = {
  title: 'forgotPassword.title',
  subtitle: 'forgotPassword.subtitle',
  identify: {
    label: 'forgotPassword.identify.label',
    hint: 'forgotPassword.identify.hint',
    action: 'forgotPassword.identify.action',
  },
  channel: {
    heading: 'forgotPassword.channel.heading',
    sms: 'forgotPassword.channel.sms',
    whatsapp: 'forgotPassword.channel.whatsapp',
    email: 'forgotPassword.channel.email',
  },
  code: {
    heading: 'forgotPassword.code.heading',
    label: 'forgotPassword.code.label',
    sentVia: 'forgotPassword.code.sentVia',
    resend: 'forgotPassword.code.resend',
    noGateway: 'forgotPassword.code.noGateway',
    verify: 'forgotPassword.code.verify',
  },
  password: {
    heading: 'forgotPassword.password.heading',
    newLabel: 'forgotPassword.password.newLabel',
    confirmLabel: 'forgotPassword.password.confirmLabel',
    strength: 'forgotPassword.password.strength',
    level: {
      0: 'forgotPassword.password.level.0',
      1: 'forgotPassword.password.level.1',
      2: 'forgotPassword.password.level.2',
      3: 'forgotPassword.password.level.3',
      4: 'forgotPassword.password.level.4',
    },
    rule: {
      length: 'forgotPassword.password.rule.length',
      upper: 'forgotPassword.password.rule.upper',
      digit: 'forgotPassword.password.rule.digit',
      symbol: 'forgotPassword.password.rule.symbol',
    },
    submit: 'forgotPassword.password.submit',
  },
  done: {
    title: 'forgotPassword.done.title',
    body: 'forgotPassword.done.body',
    sessions: 'forgotPassword.done.sessions',
    action: 'forgotPassword.done.action',
  },
  noChannels: {
    title: 'forgotPassword.noChannels.title',
    body: 'forgotPassword.noChannels.body',
  },
  rateLimited: {
    title: 'forgotPassword.rateLimited.title',
    body: 'forgotPassword.rateLimited.body',
  },
  error: {
    unknownAccount: 'forgotPassword.error.unknownAccount',
    wrongCode: 'forgotPassword.error.wrongCode',
    expiredCode: 'forgotPassword.error.expiredCode',
    supersededCode: 'forgotPassword.error.supersededCode',
    samePassword: 'forgotPassword.error.samePassword',
    weakPassword: 'forgotPassword.error.weakPassword',
    mismatch: 'forgotPassword.error.mismatch',
    network: 'forgotPassword.error.network',
  },
} as const;
