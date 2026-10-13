import { useCallback, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useWizard } from '@/features/onboarding/useWizard';
import type { WizardStepDef } from '@/features/onboarding/useWizard';
import { isValidIndianMobile } from '@/features/onboarding/validators';
import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import {
  EMPTY_TECHNICIAN_DRAFT,
  SKILL_IDS,
  SOP_ITEMS,
  TECHNICIAN_DRAFT_KEY,
  TECHNICIAN_KEYS as K,
  insuranceStatus,
  unverifiedSkills,
  verifiedSkills,
} from './onboard-technician.types';
import type { SkillId, SopItemId, TechnicianDraft } from './onboard-technician.types';

export const TECHNICIAN_STEPS: WizardStepDef<TechnicianDraft>[] = [
  {
    id: 'personal',
    labelKey: K.step.personal,
    isComplete: (d) => d.fullName.trim().length >= 3 && isValidIndianMobile(d.phone),
  },
  {
    id: 'skills',
    labelKey: K.step.skills,
    // At least one claimed skill. A claim without a certificate is allowed —
    // it simply will not count for job matching.
    isComplete: (d) => SKILL_IDS.some((id) => d.skills[id].claimed),
  },
  {
    id: 'insurance',
    labelKey: K.step.insurance,
    isComplete: (d) => insuranceStatus(d) === 'valid' || insuranceStatus(d) === 'expiringSoon',
    // An expired policy is a hard block, not a warning: the no-liability model
    // depends on the technician carrying their own cover.
    isBlocked: (d) => insuranceStatus(d) === 'expired',
  },
  {
    id: 'sop',
    labelKey: K.step.sop,
    isComplete: (d) => SOP_ITEMS.every((item) => d.sopAcknowledged[item]),
  },
];

interface OnboardTechnicianState {
  wizard: ReturnType<typeof useWizard<TechnicianDraft>>;
  toggleSkill: (id: SkillId) => void;
  setSkillCertificate: (id: SkillId, value: DocumentSlotValue | null) => void;
  toggleManualReview: (id: SkillId, value: boolean) => void;
  toggleSop: (id: SopItemId, value: boolean) => void;
  verified: SkillId[];
  unverified: SkillId[];
  insurance: ReturnType<typeof insuranceStatus>;
  submit: () => Promise<void>;
  /** Why the last submit was refused, when the reason is the applicant's to act on. */
  submitError: 'already_applied' | 'phone_taken' | null;
}

export function useOnboardTechnician(): OnboardTechnicianState {
  const repository = useData();
  const wizard = useWizard<TechnicianDraft>(
    TECHNICIAN_DRAFT_KEY,
    EMPTY_TECHNICIAN_DRAFT,
    TECHNICIAN_STEPS,
  );
  const { draft, update } = wizard;

  const toggleSkill = useCallback(
    (id: SkillId) => {
      const current = draft.skills[id];
      update({
        skills: { ...draft.skills, [id]: { ...current, claimed: !current.claimed } },
      });
    },
    [draft.skills, update],
  );

  const setSkillCertificate = useCallback(
    (id: SkillId, value: DocumentSlotValue | null) => {
      update({
        skills: { ...draft.skills, [id]: { ...draft.skills[id], certificate: value } },
      });
    },
    [draft.skills, update],
  );

  const toggleManualReview = useCallback(
    (id: SkillId, value: boolean) => {
      update({
        skills: { ...draft.skills, [id]: { ...draft.skills[id], needsManualReview: value } },
      });
    },
    [draft.skills, update],
  );

  const toggleSop = useCallback(
    (id: SopItemId, value: boolean) => {
      update({ sopAcknowledged: { ...draft.sopAcknowledged, [id]: value } });
    },
    [draft.sopAcknowledged, update],
  );

  const [submitError, setSubmitError] = useState<'already_applied' | 'phone_taken' | null>(null);

  const submit = useCallback(async () => {
    wizard.setStatus('submitting');
    setSubmitError(null);
    try {
      // Lands in pending_approval for Admin (004). Only certified skills count
      // for job matching; claims without a certificate are kept for review.
      const certified = verifiedSkills(draft);
      const documents = [
        ...certified.map((id) => ({ kind: 'certificate' as const, doc: draft.skills[id].certificate! })),
        ...(draft.insuranceDoc ? [{ kind: 'insurance' as const, doc: draft.insuranceDoc }] : []),
      ].map((d) => ({ kind: d.kind, label: d.doc.fileName, fileName: d.doc.fileName, capturedAt: d.doc.capturedAt }));
      await repository.submitFieldPartnerOnboarding({
        role: 'technician',
        name: draft.fullName,
        phone: draft.phone,
        city: draft.city,
        skills: certified,
        unverifiedSkills: unverifiedSkills(draft),
        yearsExperience: draft.yearsExperience,
        insuranceExpiry: draft.insuranceExpiry || undefined,
        documents,
      });
      wizard.setStatus('submitted');
      localStorage.removeItem(TECHNICIAN_DRAFT_KEY);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setSubmitError(code === 'already_applied' || code === 'phone_taken' ? code : null);
      wizard.setStatus('error');
    }
  }, [wizard, repository, draft]);

  return {
    wizard,
    toggleSkill,
    setSkillCertificate,
    toggleManualReview,
    toggleSop,
    verified: verifiedSkills(draft),
    unverified: unverifiedSkills(draft),
    insurance: insuranceStatus(draft),
    submit,
    submitError,
  };
}
