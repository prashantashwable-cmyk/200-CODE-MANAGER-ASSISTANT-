/** Screen 006 — Technician onboarding wizard. Types and translation keys only. */

import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import { DRAFT_KEYS } from '@/features/onboarding/handoff';

/** Skill tags feed job-assignment eligibility directly, so they are a fixed set. */
export const SKILL_IDS = [
  'mechanical',
  'electrical',
  'hydraulic',
  'mrl_gearless',
  'safety_rescue',
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

/**
 * A claimed skill with no supporting certificate is allowed through, but it is
 * marked unverified and excluded from job matching until proof is added — the
 * spec is explicit that claiming is not the same as proving.
 */
export interface SkillClaim {
  claimed: boolean;
  certificate: DocumentSlotValue | null;
  /** Set when the certificate is in a language admin review must read. */
  needsManualReview: boolean;
}

export type InsuranceStatus = 'missing' | 'expired' | 'expiringSoon' | 'valid';

/** The SOP items a technician must tick before they can be sent to a site. */
export const SOP_ITEMS = [
  'lockout',
  'ppe',
  'loadTest',
  'evidence',
  'escalate',
] as const;

export type SopItemId = (typeof SOP_ITEMS)[number];

export interface TechnicianDraft {
  fullName: string;
  phone: string;
  city: string;
  yearsExperience: string;

  skills: Record<SkillId, SkillClaim>;

  insuranceDoc: DocumentSlotValue | null;
  insuranceExpiry: string;

  sopAcknowledged: Record<SopItemId, boolean>;
}

const emptySkill: SkillClaim = { claimed: false, certificate: null, needsManualReview: false };

export const EMPTY_TECHNICIAN_DRAFT: TechnicianDraft = {
  fullName: '',
  phone: '',
  city: 'Pune',
  yearsExperience: '',
  skills: {
    mechanical: { ...emptySkill },
    electrical: { ...emptySkill },
    hydraulic: { ...emptySkill },
    mrl_gearless: { ...emptySkill },
    safety_rescue: { ...emptySkill },
  },
  insuranceDoc: null,
  insuranceExpiry: '',
  sopAcknowledged: {
    lockout: false,
    ppe: false,
    loadTest: false,
    evidence: false,
    escalate: false,
  },
};

export const TECHNICIAN_DRAFT_KEY = DRAFT_KEYS.technician;

/** Warn this far ahead of an insurance lapse, and block once it passes. */
export const INSURANCE_WARN_DAYS = 30;

export function insuranceStatus(draft: TechnicianDraft, now = Date.now()): InsuranceStatus {
  if (!draft.insuranceDoc || !draft.insuranceExpiry) return 'missing';
  const expiry = new Date(draft.insuranceExpiry).getTime();
  if (Number.isNaN(expiry)) return 'missing';
  if (expiry <= now) return 'expired';
  const daysLeft = Math.floor((expiry - now) / 86_400_000);
  return daysLeft <= INSURANCE_WARN_DAYS ? 'expiringSoon' : 'valid';
}

/** Skills that will actually count for job matching. */
export function verifiedSkills(draft: TechnicianDraft): SkillId[] {
  return SKILL_IDS.filter((id) => draft.skills[id].claimed && draft.skills[id].certificate !== null);
}

export function unverifiedSkills(draft: TechnicianDraft): SkillId[] {
  return SKILL_IDS.filter((id) => draft.skills[id].claimed && draft.skills[id].certificate === null);
}

export const TECHNICIAN_KEYS = {
  title: 'onbTechnician.title',
  subtitle: 'onbTechnician.subtitle',
  step: {
    personal: 'onbTechnician.step.personal',
    skills: 'onbTechnician.step.skills',
    insurance: 'onbTechnician.step.insurance',
    sop: 'onbTechnician.step.sop',
  },
  field: {
    fullName: 'onbTechnician.field.fullName',
    phone: 'onbTechnician.field.phone',
    city: 'onbTechnician.field.city',
    years: 'onbTechnician.field.years',
    yearsHint: 'onbTechnician.field.yearsHint',
    expiry: 'onbTechnician.field.expiry',
    expiryHint: 'onbTechnician.field.expiryHint',
  },
  skill: {
    heading: 'onbTechnician.skill.heading',
    body: 'onbTechnician.skill.body',
    required: 'onbTechnician.skill.required',
    certificate: 'onbTechnician.skill.certificate',
    unverifiedNote: 'onbTechnician.skill.unverifiedNote',
    manualReview: 'onbTechnician.skill.manualReview',
    manualReviewHint: 'onbTechnician.skill.manualReviewHint',
    name: {
      mechanical: 'onbTechnician.skill.name.mechanical',
      electrical: 'onbTechnician.skill.name.electrical',
      hydraulic: 'onbTechnician.skill.name.hydraulic',
      mrl_gearless: 'onbTechnician.skill.name.mrl_gearless',
      safety_rescue: 'onbTechnician.skill.name.safety_rescue',
    },
  },
  insurance: {
    heading: 'onbTechnician.insurance.heading',
    body: 'onbTechnician.insurance.body',
    doc: 'onbTechnician.insurance.doc',
    status: {
      missing: 'onbTechnician.insurance.status.missing',
      expired: 'onbTechnician.insurance.status.expired',
      expiringSoon: 'onbTechnician.insurance.status.expiringSoon',
      valid: 'onbTechnician.insurance.status.valid',
    },
    expiredBlock: 'onbTechnician.insurance.expiredBlock',
    inProgressNote: 'onbTechnician.insurance.inProgressNote',
  },
  sop: {
    heading: 'onbTechnician.sop.heading',
    body: 'onbTechnician.sop.body',
    required: 'onbTechnician.sop.required',
    item: {
      lockout: 'onbTechnician.sop.item.lockout',
      ppe: 'onbTechnician.sop.item.ppe',
      loadTest: 'onbTechnician.sop.item.loadTest',
      evidence: 'onbTechnician.sop.item.evidence',
      escalate: 'onbTechnician.sop.item.escalate',
    },
  },
  invalid: {
    fullName: 'onbTechnician.invalid.fullName',
    phone: 'onbTechnician.invalid.phone',
    expiryPast: 'onbTechnician.invalid.expiryPast',
  },
} as const;
