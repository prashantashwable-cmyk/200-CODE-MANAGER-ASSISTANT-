/** Screen 008 — Customer quick signup. Types and translation keys only. */

export type CustomerSignupState =
  | 'loading'
  /** Prefilled from the surveyor's lead and ready to confirm. */
  | 'ready'
  /** This phone already has an account — link the project, never duplicate. */
  | 'linking'
  | 'submitting'
  | 'done'
  | 'error';

export type LoginPreference = 'otp' | 'password';

export interface CustomerConsent {
  whatsapp: boolean;
  sms: boolean;
  dataUsage: boolean;
}

export interface CustomerSignupDraft {
  name: string;
  phone: string;
  email: string;
  siteAddress: string;
  city: string;
  pincode: string;
  loginPreference: LoginPreference;
  password: string;
  consent: CustomerConsent;
}

export const CUSTOMER_KEYS = {
  title: 'onbCustomer.title',
  subtitle: 'onbCustomer.subtitle',
  fromLead: 'onbCustomer.fromLead',
  loading: 'onbCustomer.loading',
  existingPhone: 'onbCustomer.existingPhone',
  saveFailed: 'onbCustomer.saveFailed',
  passwordLater: 'onbCustomer.passwordLater',
  section: {
    details: 'onbCustomer.section.details',
    access: 'onbCustomer.section.access',
    consent: 'onbCustomer.section.consent',
  },
  field: {
    name: 'onbCustomer.field.name',
    phone: 'onbCustomer.field.phone',
    email: 'onbCustomer.field.email',
    emailHint: 'onbCustomer.field.emailHint',
    siteAddress: 'onbCustomer.field.siteAddress',
    addressHint: 'onbCustomer.field.addressHint',
    city: 'onbCustomer.field.city',
    pincode: 'onbCustomer.field.pincode',
    password: 'onbCustomer.field.password',
  },
  login: {
    otp: 'onbCustomer.login.otp',
    otpHint: 'onbCustomer.login.otpHint',
    password: 'onbCustomer.login.password',
    passwordHint: 'onbCustomer.login.passwordHint',
  },
  consent: {
    whatsapp: 'onbCustomer.consent.whatsapp',
    whatsappHint: 'onbCustomer.consent.whatsappHint',
    sms: 'onbCustomer.consent.sms',
    smsHint: 'onbCustomer.consent.smsHint',
    dataUsage: 'onbCustomer.consent.dataUsage',
    dataUsageHint: 'onbCustomer.consent.dataUsageHint',
    declineNote: 'onbCustomer.consent.declineNote',
  },
  existing: {
    title: 'onbCustomer.existing.title',
    body: 'onbCustomer.existing.body',
    action: 'onbCustomer.existing.action',
  },
  submit: 'onbCustomer.submit',
  done: {
    title: 'onbCustomer.done.title',
    body: 'onbCustomer.done.body',
    action: 'onbCustomer.done.action',
  },
  error: { title: 'onbCustomer.error.title', body: 'onbCustomer.error.body' },
  invalid: {
    name: 'onbCustomer.invalid.name',
    phone: 'onbCustomer.invalid.phone',
    password: 'onbCustomer.invalid.password',
  },
} as const;
