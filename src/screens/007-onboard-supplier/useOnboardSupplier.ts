import { useCallback, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useWizard } from '@/features/onboarding/useWizard';
import type { WizardStepDef } from '@/features/onboarding/useWizard';
import { isValidGstin, isValidIfsc, isValidIndianMobile, isValidPincode } from '@/features/onboarding/validators';
import {
  EMPTY_SUPPLIER_DRAFT,
  SUPPLIER_DRAFT_KEY,
  SUPPLIER_KEYS as K,
} from './onboard-supplier.types';
import type { SupplierDraft } from './onboard-supplier.types';

export const SUPPLIER_STEPS: WizardStepDef<SupplierDraft>[] = [
  {
    id: 'company',
    labelKey: K.step.company,
    // A lookup that could not run still lets the supplier through, flagged for
    // manual verification. A genuine mismatch or a duplicate does not.
    isComplete: (d) =>
      d.companyName.trim().length >= 3 &&
      isValidGstin(d.gstin) &&
      (d.gstinCheck === 'matched' || d.gstinCheck === 'lookupFailed') &&
      d.registeredAddress.trim().length >= 6 &&
      isValidPincode(d.pincode) &&
      d.signatoryName.trim().length >= 3 &&
      isValidIndianMobile(d.signatoryPhone),
    isBlocked: (d) => d.gstinCheck === 'duplicate' || d.gstinCheck === 'mismatch',
  },
  {
    id: 'catalog',
    labelKey: K.step.catalog,
    // Seeding a catalogue is genuinely optional — a supplier can be onboarded
    // and add products later, so this step is complete either way.
    isComplete: () => true,
  },
  {
    id: 'bank',
    labelKey: K.step.bank,
    isComplete: (d) =>
      d.accountHolder.trim().length >= 3 &&
      /^\d{9,18}$/.test(d.accountNumber) &&
      isValidIfsc(d.ifsc) &&
      d.bankDoc !== null,
  },
  {
    id: 'terms',
    labelKey: K.step.terms,
    isComplete: (d) => d.slaAccepted && d.paymentTermsAccepted,
  },
];

interface OnboardSupplierState {
  wizard: ReturnType<typeof useWizard<SupplierDraft>>;
  verifyGstin: () => Promise<void>;
  payoutsBlocked: boolean;
  submit: () => Promise<void>;
  /** Translation key for why the last submission was refused, if it was. */
  submitErrorKey: string | null;
}

export function useOnboardSupplier(): OnboardSupplierState {
  const repository = useData();
  const wizard = useWizard<SupplierDraft>(
    SUPPLIER_DRAFT_KEY,
    EMPTY_SUPPLIER_DRAFT,
    SUPPLIER_STEPS,
  );
  const { draft, update } = wizard;

  const verifyGstin = useCallback(async () => {
    update({ gstinCheck: 'running' });
    try {
      // A GSTIN may only be registered once. This is a real check against the
      // supplier list rather than a simulated one.
      const suppliers = await repository.listSuppliers();
      const normalised = draft.gstin.trim().toUpperCase();
      if (suppliers.some((s) => s.gstin?.toUpperCase() === normalised)) {
        update({ gstinCheck: 'duplicate' });
        return;
      }

      // The legal-name lookup needs the GST registry, which is not connected: the format and the
      // one-account rule are checked here, and an admin confirms the legal name during KYC review (091).
      update({ gstinCheck: 'lookupFailed' });
    } catch {
      // A failed request is exactly the offline case: allow, flag for review.
      update({ gstinCheck: 'lookupFailed' });
    }
  }, [draft.gstin, repository, update]);

  const [submitErrorKey, setSubmitErrorKey] = useState<string | null>(null);

  const submit = useCallback(async () => {
    wizard.setStatus('submitting');
    setSubmitErrorKey(null);
    try {
      // The account lands pending — a real Supplier plus the signatory's own
      // login, usable straight away to follow the review. No purchase order
      // can be issued against it until an admin approves KYC in the Supplier
      // Directory.
      await repository.submitSupplierOnboarding({
        companyName: draft.companyName,
        gstin: draft.gstin,
        city: draft.city,
        signatoryName: draft.signatoryName,
        signatoryPhone: draft.signatoryPhone,
      });
      wizard.setStatus('submitted');
      localStorage.removeItem(SUPPLIER_DRAFT_KEY);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setSubmitErrorKey(code === 'duplicate_gstin' || code === 'phone_taken' ? K.submitError[code] : K.submitError.generic);
      wizard.setStatus('error');
    }
  }, [wizard, repository, draft]);

  return {
    wizard,
    verifyGstin,
    payoutsBlocked: false,
    submit,
    submitErrorKey,
  };
}
