/** Screen 007 — Supplier / manufacturer KYC wizard. Types and keys only. */

import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import { DRAFT_KEYS } from '@/features/onboarding/handoff';

/**
 * GSTIN verification has more than two outcomes, and the difference matters:
 * a lookup that could not run is not the same as a name that did not match.
 * The first lets the supplier continue under manual review; the second does not.
 */
export type GstinCheck = 'notStarted' | 'running' | 'matched' | 'lookupFailed' | 'mismatch' | 'duplicate';

export type PennyDropStatus = 'notStarted' | 'running' | 'verified' | 'failed';

/** The only catalogue formats the importer accepts, stated up front. */
export const ACCEPTED_CATALOG_EXTENSIONS = ['.csv', '.xlsx'] as const;
export const ACCEPTED_CATALOG_ATTR = '.csv,.xlsx';

export interface SupplierDraft {
  companyName: string;
  gstin: string;
  gstinCheck: GstinCheck;
  /** Set when the registry lookup could not run — an admin verifies by hand. */
  registeredAddress: string;
  city: string;
  pincode: string;
  signatoryName: string;
  signatoryDesignation: string;
  /** The signatory's own mobile — what they sign in with once KYC is approved. */
  signatoryPhone: string;

  catalogFile: DocumentSlotValue | null;
  catalogRowCount: string;

  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankDoc: DocumentSlotValue | null;
  pennyDrop: PennyDropStatus;

  slaAccepted: boolean;
  paymentTermsAccepted: boolean;
}

export const EMPTY_SUPPLIER_DRAFT: SupplierDraft = {
  companyName: '',
  gstin: '',
  gstinCheck: 'notStarted',
  registeredAddress: '',
  city: '',
  pincode: '',
  signatoryName: '',
  signatoryDesignation: '',
  signatoryPhone: '',
  catalogFile: null,
  catalogRowCount: '',
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
  bankDoc: null,
  pennyDrop: 'notStarted',
  slaAccepted: false,
  paymentTermsAccepted: false,
};

export const SUPPLIER_DRAFT_KEY = DRAFT_KEYS.supplier;

export const SUPPLIER_KEYS = {
  title: 'onbSupplier.title',
  subtitle: 'onbSupplier.subtitle',
  step: {
    company: 'onbSupplier.step.company',
    catalog: 'onbSupplier.step.catalog',
    bank: 'onbSupplier.step.bank',
    terms: 'onbSupplier.step.terms',
  },
  field: {
    companyName: 'onbSupplier.field.companyName',
    gstin: 'onbSupplier.field.gstin',
    gstinHint: 'onbSupplier.field.gstinHint',
    registeredAddress: 'onbSupplier.field.registeredAddress',
    city: 'onbSupplier.field.city',
    pincode: 'onbSupplier.field.pincode',
    signatoryName: 'onbSupplier.field.signatoryName',
    signatoryDesignation: 'onbSupplier.field.signatoryDesignation',
    signatoryPhone: 'onbSupplier.field.signatoryPhone',
    signatoryPhoneHint: 'onbSupplier.field.signatoryPhoneHint',
    catalogRowCount: 'onbSupplier.field.catalogRowCount',
    catalogRowCountHint: 'onbSupplier.field.catalogRowCountHint',
    accountHolder: 'onbSupplier.field.accountHolder',
    accountNumber: 'onbSupplier.field.accountNumber',
    ifsc: 'onbSupplier.field.ifsc',
  },
  gstin: {
    verify: 'onbSupplier.gstin.verify',
    running: 'onbSupplier.gstin.running',
    matched: 'onbSupplier.gstin.matched',
    lookupFailed: 'onbSupplier.gstin.lookupFailed',
    mismatch: 'onbSupplier.gstin.mismatch',
    duplicate: 'onbSupplier.gstin.duplicate',
    duplicateAction: 'onbSupplier.gstin.duplicateAction',
  },
  catalog: {
    heading: 'onbSupplier.catalog.heading',
    body: 'onbSupplier.catalog.body',
    doc: 'onbSupplier.catalog.doc',
    formats: 'onbSupplier.catalog.formats',
    pendingReview: 'onbSupplier.catalog.pendingReview',
    skip: 'onbSupplier.catalog.skip',
  },
  bank: {
    heading: 'onbSupplier.bank.heading',
    body: 'onbSupplier.bank.body',
    doc: 'onbSupplier.bank.doc',
    verify: 'onbSupplier.bank.verify',
    running: 'onbSupplier.bank.running',
    verified: 'onbSupplier.bank.verified',
    failed: 'onbSupplier.bank.failed',
    blocked: 'onbSupplier.bank.blocked',
    notConnected: 'onbSupplier.bank.notConnected',
  },
  terms: {
    heading: 'onbSupplier.terms.heading',
    sla: 'onbSupplier.terms.sla',
    slaDetail: 'onbSupplier.terms.slaDetail',
    payment: 'onbSupplier.terms.payment',
    paymentDetail: 'onbSupplier.terms.paymentDetail',
    legalNote: 'onbSupplier.terms.legalNote',
    required: 'onbSupplier.terms.required',
  },
  invalid: {
    companyName: 'onbSupplier.invalid.companyName',
    gstin: 'onbSupplier.invalid.gstin',
    pincode: 'onbSupplier.invalid.pincode',
    ifsc: 'onbSupplier.invalid.ifsc',
    accountNumber: 'onbSupplier.invalid.accountNumber',
    signatoryPhone: 'onbSupplier.invalid.signatoryPhone',
  },
  submitError: {
    duplicate_gstin: 'onbSupplier.submitError.duplicate_gstin',
    phone_taken: 'onbSupplier.submitError.phone_taken',
    generic: 'onbSupplier.submitError.generic',
  },
  poNote: 'onbSupplier.poNote',
} as const;
