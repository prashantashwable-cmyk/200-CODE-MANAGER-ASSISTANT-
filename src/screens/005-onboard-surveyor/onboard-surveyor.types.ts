/** Screen 005 — Surveyor onboarding wizard. Types and translation keys only. */

import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import { DRAFT_KEYS } from '@/features/onboarding/handoff';

/**
 * Bank verification is a penny-drop: a token deposit is made and the account
 * name that comes back is compared against the applicant. It is asynchronous
 * and it can genuinely fail, so it gets its own status rather than a boolean.
 */
export type PennyDropStatus = 'notStarted' | 'running' | 'verified' | 'failed';

export interface SurveyorDraft {
  fullName: string;
  phone: string;
  city: string;

  aadhaarNumber: string;
  aadhaarDoc: DocumentSlotValue | null;
  panNumber: string;
  panDoc: DocumentSlotValue | null;

  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankDoc: DocumentSlotValue | null;
  pennyDrop: PennyDropStatus;

  preferredZoneIds: string[];
  twoWheelerOwned: boolean;
}

export const EMPTY_SURVEYOR_DRAFT: SurveyorDraft = {
  fullName: '',
  phone: '',
  city: 'Pune',
  aadhaarNumber: '',
  aadhaarDoc: null,
  panNumber: '',
  panDoc: null,
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
  bankDoc: null,
  pennyDrop: 'notStarted',
  preferredZoneIds: [],
  twoWheelerOwned: false,
};

export const SURVEYOR_DRAFT_KEY = DRAFT_KEYS.surveyor;

export const SURVEYOR_KEYS = {
  title: 'onbSurveyor.title',
  subtitle: 'onbSurveyor.subtitle',
  step: {
    personal: 'onbSurveyor.step.personal',
    identity: 'onbSurveyor.step.identity',
    bank: 'onbSurveyor.step.bank',
    area: 'onbSurveyor.step.area',
  },
  field: {
    fullName: 'onbSurveyor.field.fullName',
    phone: 'onbSurveyor.field.phone',
    city: 'onbSurveyor.field.city',
    aadhaar: 'onbSurveyor.field.aadhaar',
    aadhaarHint: 'onbSurveyor.field.aadhaarHint',
    pan: 'onbSurveyor.field.pan',
    accountHolder: 'onbSurveyor.field.accountHolder',
    accountNumber: 'onbSurveyor.field.accountNumber',
    ifsc: 'onbSurveyor.field.ifsc',
    twoWheeler: 'onbSurveyor.field.twoWheeler',
    twoWheelerHint: 'onbSurveyor.field.twoWheelerHint',
  },
  doc: {
    aadhaar: 'onbSurveyor.doc.aadhaar',
    aadhaarHint: 'onbSurveyor.doc.aadhaarHint',
    pan: 'onbSurveyor.doc.pan',
    bank: 'onbSurveyor.doc.bank',
    bankHint: 'onbSurveyor.doc.bankHint',
  },
  invalid: {
    fullName: 'onbSurveyor.invalid.fullName',
    phone: 'onbSurveyor.invalid.phone',
    aadhaar: 'onbSurveyor.invalid.aadhaar',
    pan: 'onbSurveyor.invalid.pan',
    ifsc: 'onbSurveyor.invalid.ifsc',
    accountNumber: 'onbSurveyor.invalid.accountNumber',
  },
  penny: {
    start: 'onbSurveyor.penny.start',
    running: 'onbSurveyor.penny.running',
    verified: 'onbSurveyor.penny.verified',
    failed: 'onbSurveyor.penny.failed',
    blockedBanner: 'onbSurveyor.penny.blockedBanner',
    notConnected: 'onbSurveyor.penny.notConnected',
    retry: 'onbSurveyor.penny.retry',
    explain: 'onbSurveyor.penny.explain',
  },
  area: {
    heading: 'onbSurveyor.area.heading',
    body: 'onbSurveyor.area.body',
    required: 'onbSurveyor.area.required',
    loading: 'onbSurveyor.area.loading',
    error: 'onbSurveyor.area.error',
    empty: 'onbSurveyor.area.empty',
    leadCount: 'onbSurveyor.area.leadCount',
  },
  identityNote: 'onbSurveyor.identityNote',
} as const;
