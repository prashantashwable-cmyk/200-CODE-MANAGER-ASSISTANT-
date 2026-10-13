/** Screen 002 — Login (with Demo Mode bypass tab). Types and keys only. */

import type { Role } from '@/data/types';

export type LoginTab = 'login' | 'demo';
/** Phone + OTP is the India-first primary path; the others are fallbacks. */
export type LoginMethod = 'phone' | 'email';

export type LoginStatus = 'idle' | 'submitting' | 'error';

export type LoginErrorKind =
  | 'unknownNumber'
  | 'roleMismatch'
  | 'network'
  | 'invalidPhone'
  | 'tooMany'
  | 'google';

/** The four roles offered on the Demo tab. Supplier onboards, it does not demo. */
export const DEMO_ROLES: Role[] = ['admin', 'surveyor', 'technician', 'customer'];

export const LOGIN_KEYS = {
  title: 'login.title',
  subtitle: 'login.subtitle',
  tab: { login: 'login.tab.login', demo: 'login.tab.demo' },
  method: { phone: 'login.method.phone', email: 'login.method.email' },
  field: {
    phone: 'login.field.phone',
    phoneHint: 'login.field.phoneHint',
    email: 'login.field.email',
    password: 'login.field.password',
  },
  remember: 'login.remember',
  continueWithOtp: 'login.continueWithOtp',
  google: 'login.google',
  forgot: 'login.forgot',
  simulatedNote: 'login.simulatedNote',
  serverNote: 'login.serverNote',
  emailNotConnected: 'login.emailNotConnected',
  googleNotConnected: 'login.googleNotConnected',
  googleReturn: {
    working: 'login.googleReturn.working',
    cancelledTitle: 'login.googleReturn.cancelledTitle',
    cancelledBody: 'login.googleReturn.cancelledBody',
    failedTitle: 'login.googleReturn.failedTitle',
    failedBody: 'login.googleReturn.failedBody',
    back: 'login.googleReturn.back',
  },
  demo: {
    heading: 'login.demo.heading',
    body: 'login.demo.body',
    entering: 'login.demo.entering',
    role: {
      admin: 'login.demo.role.admin',
      surveyor: 'login.demo.role.surveyor',
      technician: 'login.demo.role.technician',
      customer: 'login.demo.role.customer',
    },
    safety: 'login.demo.safety',
  },
  error: {
    unknownNumber: 'login.error.unknownNumber',
    roleMismatch: 'login.error.roleMismatch',
    network: 'login.error.network',
    invalidPhone: 'login.error.invalidPhone',
    tooMany: 'login.error.tooMany',
    google: 'login.error.google',
  },
} as const;

/** Indian mobile numbers: 10 digits, never starting 0-5. */
export { isIndianMobile as isValidIndianMobile } from '@/features/validation/india';
