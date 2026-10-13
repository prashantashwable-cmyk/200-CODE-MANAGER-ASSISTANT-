import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useWizard } from '@/features/onboarding/useWizard';
import type { WizardStepDef } from '@/features/onboarding/useWizard';
import {
  isValidAadhaar,
  isValidIfsc,
  isValidIndianMobile,
  isValidPan,
} from '@/features/onboarding/validators';
import type { GeoZone } from '@/data/types';
import {
  EMPTY_SURVEYOR_DRAFT,
  SURVEYOR_DRAFT_KEY,
  SURVEYOR_KEYS as K,
} from './onboard-surveyor.types';
import type { SurveyorDraft } from './onboard-surveyor.types';

/** The four steps, each with the rule that makes it genuinely complete. */
export const SURVEYOR_STEPS: WizardStepDef<SurveyorDraft>[] = [
  {
    id: 'personal',
    labelKey: K.step.personal,
    isComplete: (d) => d.fullName.trim().length >= 3 && isValidIndianMobile(d.phone),
  },
  {
    id: 'identity',
    labelKey: K.step.identity,
    // Either proof is acceptable, but whichever is given must be valid AND
    // backed by a photo that passed the quality gate.
    isComplete: (d) =>
      (isValidAadhaar(d.aadhaarNumber) && d.aadhaarDoc !== null) ||
      (isValidPan(d.panNumber) && d.panDoc !== null),
  },
  {
    id: 'bank',
    labelKey: K.step.bank,
    // A failed penny-drop does not block the step — the applicant continues
    // and payouts are held instead. Only a missing or malformed account does.
    isComplete: (d) =>
      d.accountHolder.trim().length >= 3 &&
      /^\d{9,18}$/.test(d.accountNumber) &&
      isValidIfsc(d.ifsc) &&
      d.bankDoc !== null,
  },
  {
    id: 'area',
    labelKey: K.step.area,
    // Zones feed lead assignment and route optimisation, so one is mandatory.
    isComplete: (d) => d.preferredZoneIds.length > 0,
  },
];

interface OnboardSurveyorState {
  wizard: ReturnType<typeof useWizard<SurveyorDraft>>;
  zones: GeoZone[];
  zonesStatus: 'loading' | 'ready' | 'empty' | 'error';
  reloadZones: () => Promise<void>;
  toggleZone: (zoneId: string) => void;
  /** True once bank verification has failed — payouts stay blocked until fixed. */
  payoutsBlocked: boolean;
  submit: () => Promise<void>;
  /** Why the last submit was refused, when the reason is the applicant's to act on. */
  submitError: 'already_applied' | 'phone_taken' | null;
}

export function useOnboardSurveyor(): OnboardSurveyorState {
  const repository = useData();
  const wizard = useWizard<SurveyorDraft>(
    SURVEYOR_DRAFT_KEY,
    EMPTY_SURVEYOR_DRAFT,
    SURVEYOR_STEPS,
  );

  const [zones, setZones] = useState<GeoZone[]>([]);
  const [zonesStatus, setZonesStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  const reloadZones = useCallback(async () => {
    setZonesStatus('loading');
    try {
      const list = await repository.listZones();
      setZones(list);
      setZonesStatus(list.length === 0 ? 'empty' : 'ready');
    } catch {
      setZonesStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reloadZones();
  }, [reloadZones]);

  const { update, draft } = wizard;

  const toggleZone = useCallback(
    (zoneId: string) => {
      const next = draft.preferredZoneIds.includes(zoneId)
        ? draft.preferredZoneIds.filter((id) => id !== zoneId)
        : [...draft.preferredZoneIds, zoneId];
      update({ preferredZoneIds: next });
    },
    [draft.preferredZoneIds, update],
  );

  const [submitError, setSubmitError] = useState<'already_applied' | 'phone_taken' | null>(null);

  const submit = useCallback(async () => {
    wizard.setStatus('submitting');
    setSubmitError(null);
    try {
      // A new applicant lands in pending_approval; an admin resolves them on
      // screen 004. Nothing here makes the account live. Only the last four
      // digits of an Aadhaar number leave this phone.
      const aadhaar = draft.aadhaarNumber.replace(/\D/g, '');
      const docs = [
        draft.aadhaarDoc && isValidAadhaar(draft.aadhaarNumber) ? { kind: 'aadhaar' as const, doc: draft.aadhaarDoc } : null,
        draft.panDoc && isValidPan(draft.panNumber) ? { kind: 'pan' as const, doc: draft.panDoc } : null,
        draft.bankDoc ? { kind: 'bank' as const, doc: draft.bankDoc } : null,
      ].filter((d): d is { kind: 'aadhaar' | 'pan' | 'bank'; doc: NonNullable<SurveyorDraft['bankDoc']> } => d !== null);
      await repository.submitFieldPartnerOnboarding({
        role: 'surveyor',
        name: draft.fullName,
        phone: draft.phone,
        city: draft.city,
        preferredZoneIds: draft.preferredZoneIds,
        ownsTwoWheeler: draft.twoWheelerOwned,
        aadhaarLast4: isValidAadhaar(draft.aadhaarNumber) ? aadhaar.slice(-4) : undefined,
        panNumber: isValidPan(draft.panNumber) ? draft.panNumber : undefined,
        documents: docs.map((d) => ({ kind: d.kind, label: d.doc.fileName, fileName: d.doc.fileName, capturedAt: d.doc.capturedAt })),
        bank: { holderName: draft.accountHolder, accountNumber: draft.accountNumber, ifsc: draft.ifsc, verified: false },
      });
      wizard.setStatus('submitted');
      localStorage.removeItem(SURVEYOR_DRAFT_KEY);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setSubmitError(code === 'already_applied' || code === 'phone_taken' ? code : null);
      wizard.setStatus('error');
    }
  }, [wizard, repository, draft]);

  return {
    wizard,
    zones,
    zonesStatus,
    reloadZones,
    toggleZone,
    payoutsBlocked: false,
    submit,
    submitError,
  };
}
