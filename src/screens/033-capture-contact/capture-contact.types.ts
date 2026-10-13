/** Screen 033 — Builder/Owner Details Capture. Types and keys only. */

export type ContactRole = 'owner' | 'contractor' | 'architect' | 'facilityManager';

export const CONTACT_ROLES: ContactRole[] = ['owner', 'contractor', 'architect', 'facilityManager'];

export type PhoneCheckState = 'idle' | 'checking' | 'clear' | 'duplicateLead' | 'existingCustomer';

export const CAPTURE_CONTACT_KEYS = {
  title: 'captureContact.title',
  subtitle: 'captureContact.subtitle',
  field: {
    name: 'captureContact.field.name',
    phone: 'captureContact.field.phone',
    phoneHint: 'captureContact.field.phoneHint',
    company: 'captureContact.field.company',
    role: 'captureContact.field.role',
    note: 'captureContact.field.note',
    noteHint: 'captureContact.field.noteHint',
  },
  role: {
    owner: 'captureContact.role.owner',
    contractor: 'captureContact.role.contractor',
    architect: 'captureContact.role.architect',
    facilityManager: 'captureContact.role.facilityManager',
  },
  noPhone: {
    toggle: 'captureContact.noPhone.toggle',
    hint: 'captureContact.noPhone.hint',
  },
  consent: {
    label: 'captureContact.consent.label',
    hint: 'captureContact.consent.hint',
    required: 'captureContact.consent.required',
  },
  phoneCheck: {
    checking: 'captureContact.phoneCheck.checking',
    clear: 'captureContact.phoneCheck.clear',
    duplicateLead: 'captureContact.phoneCheck.duplicateLead',
    existingCustomer: 'captureContact.phoneCheck.existingCustomer',
  },
  businessCard: {
    heading: 'captureContact.businessCard.heading',
    body: 'captureContact.businessCard.body',
    scanning: 'captureContact.businessCard.scanning',
    applied: 'captureContact.businessCard.applied',
    reviewNote: 'captureContact.businessCard.reviewNote',
  },
  invalid: {
    name: 'captureContact.invalid.name',
    phone: 'captureContact.invalid.phone',
  },
} as const;
