/**
 * The hand-off from the public recruitment page (141) into the three onboarding wizards (005–007). The wizards keep their own draft on the
 * device; this puts the name and phone the person already gave into that draft, so they are never asked twice, and does nothing else: the
 * wizards stay the one place partner data is collected, whatever door the person came in by.
 */
export type OnboardingRole = 'surveyor' | 'technician' | 'supplier';

export const DRAFT_KEYS: Record<OnboardingRole, string> = {
  surveyor: 'aiec.onboarding.surveyor',
  technician: 'aiec.onboarding.technician',
  supplier: 'aiec.onboarding.supplier',
};

export const ONBOARDING_PATH: Record<OnboardingRole, string> = {
  surveyor: '/onboarding/surveyor',
  technician: '/onboarding/technician',
  supplier: '/onboarding/supplier',
};

/** The wizard's own field names for the two things asked first. */
const FIELDS: Record<OnboardingRole, { name: string; phone: string }> = {
  surveyor: { name: 'fullName', phone: 'phone' },
  technician: { name: 'fullName', phone: 'phone' },
  supplier: { name: 'signatoryName', phone: 'signatoryPhone' },
};

/** Only fills what is empty: a draft the person already made is never overwritten. */
export function seedOnboardingDraft(role: OnboardingRole, who: { name: string; phone: string }, extra: Record<string, unknown> = {}): void {
  try {
    const key = DRAFT_KEYS[role];
    const f = FIELDS[role];
    const raw = localStorage.getItem(key);
    const stored = raw ? (JSON.parse(raw) as { draft?: Record<string, unknown>; startedAt?: string; stepIndex?: number }) : null;
    const draft = { ...(stored?.draft ?? {}) };
    if (!draft[f.name]) draft[f.name] = who.name;
    if (!draft[f.phone]) draft[f.phone] = who.phone;
    for (const [k, v] of Object.entries(extra)) {
      const empty = draft[k] === undefined || draft[k] === null || draft[k] === '' || (Array.isArray(draft[k]) && (draft[k] as unknown[]).length === 0);
      if (empty && v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) draft[k] = v;
    }
    localStorage.setItem(key, JSON.stringify({ draft, startedAt: stored?.startedAt ?? new Date().toISOString(), stepIndex: stored?.stepIndex ?? 0 }));
  } catch {
    // Not kept: the wizard simply asks again.
  }
}
