import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '@/data/DataProvider';
import { isValidIndianMobile } from '@/features/onboarding/validators';
import type { Language, Lead, User } from '@/data/types';
import type {
  CustomerConsent,
  CustomerSignupDraft,
  CustomerSignupState,
} from './onboard-customer.types';

/** The lead used when this screen is opened directly rather than from a deal. */
const FALLBACK_LEAD_ID = 'l-1';

const EMPTY_DRAFT: CustomerSignupDraft = {
  name: '',
  phone: '',
  email: '',
  siteAddress: '',
  city: '',
  pincode: '',
  loginPreference: 'otp',
  password: '',
  consent: { whatsapp: true, sms: true, dataUsage: true },
};

interface OnboardCustomerHook {
  state: CustomerSignupState;
  draft: CustomerSignupDraft;
  update: (patch: Partial<CustomerSignupDraft>) => void;
  setConsent: (patch: Partial<CustomerConsent>) => void;
  lead: Lead | null;
  /** Populated when this phone is already an AIEC customer. */
  existingCustomer: User | null;
  canSubmit: boolean;
  submit: () => Promise<void>;
  linkToExisting: () => Promise<void>;
  reload: () => Promise<void>;
  /** Why the last confirmation did not go through. */
  submitError: 'existingPhone' | 'saveFailed' | null;
}

/**
 * Owns the lightweight confirmation a customer sees the moment their deal
 * closes. Almost nothing is asked for: everything comes from the surveyor's
 * original lead capture and is simply offered for correction.
 */
export function useOnboardCustomer(): OnboardCustomerHook {
  const repository = useData();
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId') ?? FALLBACK_LEAD_ID;

  const [state, setState] = useState<CustomerSignupState>('loading');
  const [draft, setDraft] = useState<CustomerSignupDraft>(EMPTY_DRAFT);
  const [lead, setLead] = useState<Lead | null>(null);
  const [existingCustomer, setExistingCustomer] = useState<User | null>(null);
  const [submitError, setSubmitError] = useState<'existingPhone' | 'saveFailed' | null>(null);

  const reload = useCallback(async () => {
    setState('loading');
    try {
      const found = await repository.getLead(leadId);
      if (!found) {
        setState('error');
        return;
      }
      setLead(found);
      setDraft({
        ...EMPTY_DRAFT,
        name: found.contactName,
        phone: found.contactPhone,
        email: found.contactEmail ?? '',
        siteAddress: found.address,
        city: found.city,
        pincode: found.pincode,
      });

      // A builder buying a second lift must end up with one account holding
      // two projects, not two accounts holding one each.
      const customers = await repository.listUsers({ role: 'customer' });
      const last10 = (p: string) => p.replace(/\D/g, '').slice(-10);
      const match = customers.find((c) => last10(c.phone) === last10(found.contactPhone)) ?? null;
      setExistingCustomer(match);
      setState(match ? 'linking' : 'ready');
    } catch {
      setState('error');
    }
  }, [repository, leadId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const update = useCallback((patch: Partial<CustomerSignupDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const setConsent = useCallback((patch: Partial<CustomerConsent>) => {
    setDraft((current) => ({ ...current, consent: { ...current.consent, ...patch } }));
  }, []);

  // Sign-in is by a one-time code; there is no password to choose here.
  const canSubmit = draft.name.trim().length >= 3 && isValidIndianMobile(draft.phone);

  const confirm = useCallback(async () => {
    if (!lead) return;
    const back = existingCustomer ? 'linking' : 'ready';
    setState('submitting');
    setSubmitError(null);
    try {
      // Declining a channel is recorded, not blocked: every automated message
      // reads these choices before it sends anything.
      await repository.confirmCustomerAccount({
        leadId: lead.id,
        name: draft.name,
        phone: draft.phone,
        email: draft.email,
        siteAddress: draft.siteAddress,
        city: draft.city,
        pincode: draft.pincode,
        language: (['en', 'hi', 'mr'].includes(i18n.language) ? i18n.language : 'en') as Language,
        consent: draft.consent,
      });
      setState('done');
    } catch (err) {
      setSubmitError(err instanceof Error && err.message === 'phone_taken' ? 'existingPhone' : 'saveFailed');
      setState(back);
    }
  }, [repository, lead, draft, existingCustomer, i18n.language]);

  return {
    state,
    draft,
    update,
    setConsent,
    lead,
    existingCustomer,
    canSubmit,
    submit: confirm,
    linkToExisting: confirm,
    reload,
    submitError,
  };
}
