import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useCaptureDraft } from '@/features/leadCapture/CaptureDraftProvider';
import { recognizeBusinessCard } from '@/features/leadCapture/businessCardOcr';
import { isValidIndianMobile } from '@/features/onboarding/validators';
import type { PhoneCheckState } from './capture-contact.types';
import type { ContactRole } from './capture-contact.types';

interface CaptureContactState {
  fullName: string;
  setFullName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  noPhoneAvailable: boolean;
  setNoPhoneAvailable: (value: boolean) => void;
  company: string;
  setCompany: (value: string) => void;
  role: ContactRole;
  setRole: (value: ContactRole) => void;
  note: string;
  setNote: (value: string) => void;
  consent: boolean;
  setConsent: (value: boolean) => void;
  phoneCheck: PhoneCheckState;
  matchedName: string | null;
  scanningCard: boolean;
  cardApplied: boolean;
  scanBusinessCard: (file: File) => Promise<void>;
  canContinue: boolean;
  continueToNext: () => void;
}

/**
 * Owns the builder/owner contact step.
 *
 * Phone number is the real-time de-duplication key: every keystroke past 10
 * digits checks it against both the existing lead list and the customer list,
 * because a repeat client from a previous project is a materially different
 * situation from a fresh lead and the surveyor should know immediately.
 */
export function useCaptureContact(): CaptureContactState {
  const navigate = useNavigate();
  const repository = useData();
  const { draft, update } = useCaptureDraft();

  const [fullName, setFullName] = useState(draft.contactName);
  const [phone, setPhoneState] = useState(draft.contactPhone);
  const [noPhoneAvailable, setNoPhoneAvailable] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<ContactRole>('owner');
  const [note, setNote] = useState(draft.notes);
  const [consent, setConsent] = useState(false);
  const [phoneCheck, setPhoneCheck] = useState<PhoneCheckState>('idle');
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [scanningCard, setScanningCard] = useState(false);
  const [cardApplied, setCardApplied] = useState(false);

  const runPhoneCheck = useCallback(
    async (value: string) => {
      if (!isValidIndianMobile(value)) {
        setPhoneCheck('idle');
        return;
      }
      setPhoneCheck('checking');
      try {
        const [leads, customers] = await Promise.all([
          repository.listLeads({ query: value }),
          repository.listUsers({ role: 'customer' }),
        ]);
        const customerMatch = customers.find((c) => c.phone === value);
        if (customerMatch) {
          setMatchedName(customerMatch.name);
          setPhoneCheck('existingCustomer');
          return;
        }
        const leadMatch = leads.find((l) => l.contactPhone === value);
        if (leadMatch) {
          setMatchedName(leadMatch.contactName);
          setPhoneCheck('duplicateLead');
          return;
        }
        setMatchedName(null);
        setPhoneCheck('clear');
      } catch {
        setPhoneCheck('idle');
      }
    },
    [repository],
  );

  const setPhone = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setPhoneState(digits);
      update({ contactPhone: digits });
      if (digits.length === 10) void runPhoneCheck(digits);
      else setPhoneCheck('idle');
    },
    [update, runPhoneCheck],
  );

  const scanBusinessCard = useCallback(
    async (file: File) => {
      setScanningCard(true);
      setCardApplied(false);
      try {
        const fields = await recognizeBusinessCard(file);
        // OCR is a convenience only — it fills blanks, it never overwrites
        // something the surveyor already typed themselves.
        if (fields.name && !fullName) setFullName(fields.name);
        if (fields.company && !company) setCompany(fields.company);
        if (fields.phone && !phone) setPhone(fields.phone);
        setCardApplied(true);
      } finally {
        setScanningCard(false);
      }
    },
    [fullName, company, phone, setPhone],
  );

  const canContinue =
    fullName.trim().length >= 2 &&
    (noPhoneAvailable || isValidIndianMobile(phone)) &&
    consent &&
    phoneCheck !== 'checking';

  const continueToNext = useCallback(() => {
    update({
      contactName: fullName.trim(),
      contactPhone: noPhoneAvailable ? '' : phone,
      builderName: company.trim(),
      notes: note,
    });
    navigate('/surveyor/capture/spec');
  }, [update, fullName, noPhoneAvailable, phone, company, note, navigate]);

  return {
    fullName,
    setFullName,
    phone,
    setPhone,
    noPhoneAvailable,
    setNoPhoneAvailable,
    company,
    setCompany,
    role,
    setRole,
    note,
    setNote,
    consent,
    setConsent,
    phoneCheck,
    matchedName,
    scanningCard,
    cardApplied,
    scanBusinessCard,
    canContinue,
    continueToNext,
  };
}
