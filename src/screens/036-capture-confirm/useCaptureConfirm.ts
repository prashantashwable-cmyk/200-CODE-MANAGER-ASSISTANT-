import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useCaptureDraft } from '@/features/leadCapture/CaptureDraftProvider';
import type { Lead } from '@/data/types';
import type { CommissionRatesView } from '@/data/repository';
import { amountOf } from '@/features/commission/rules';
import {
  BASE_CAPTURE_BONUS,
  CONVERSION_BONUS_FLOOR,
  CONVERSION_BONUS_RATE,
  estimateLeadValue,
} from './capture-confirm.types';
import type { SubmitStatus } from './capture-confirm.types';

const OFFLINE_QUEUE_KEY = 'aiec.queuedLeadSubmissions';

interface CaptureConfirmState {
  status: SubmitStatus;
  estimatedValue: number;
  baseBonus: number;
  conversionBonus: number;
  submittedCode: string | null;
  isOnline: boolean;
  submit: () => Promise<void>;
  captureAnother: () => void;
  goHome: () => void;
}

/**
 * Owns final review and submission.
 *
 * Submitting locks the capture as immutable evidence — photos, GPS and
 * timestamp — the instant it succeeds, which is the exact moment this lead
 * formally enters the CRM pipeline. Offline, the submission is queued locally
 * rather than blocked or lost, and sends the moment connectivity returns.
 */
export function useCaptureConfirm(): CaptureConfirmState {
  const navigate = useNavigate();
  const repository = useData();
  const { user } = useSession();
  const { draft, reset } = useCaptureDraft();

  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // A connection returning while a submission sits queued sends it without
  // the surveyor needing to do anything else.
  useEffect(() => {
    if (!isOnline || status !== 'queuedOffline') return;
    void submitNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, status]);

  const estimatedValue = estimateLeadValue(draft.spec.floors ?? 0, draft.spec.capacityPersons ?? 0);
  // The figures are the commission rules' (161), including what the surveyor's tier adds; the constants only stand in until they have loaded.
  const [rates, setRates] = useState<CommissionRatesView | null>(null);
  useEffect(() => {
    if (!user) return;
    let live = true;
    void repository.getMyCommissionRates(user.id).then((r) => { if (live) setRates(r); }).catch(() => undefined);
    return () => { live = false; };
  }, [repository, user]);
  const ruleParams = (id: string) => rates?.rules.find((r) => r.id === id)?.params;
  const baseBonus = ruleParams('site_visit')?.amount ?? BASE_CAPTURE_BONUS;
  const conv = ruleParams('conversion');
  const conversionBonus = conv
    ? amountOf('conversion', conv, { dealValue: estimatedValue, tierPlusPct: rates?.tierPlusPct ?? 0 })
    : Math.max(CONVERSION_BONUS_FLOOR, Math.round(estimatedValue * CONVERSION_BONUS_RATE));

  async function submitNow() {
    if (!user) return;
    setStatus('submitting');
    try {
      const lead = await repository.createLead({
        stage: 'captured',
        surveyorId: user.id,
        source: 'field_survey',
        builderName: draft.builderName,
        contactName: draft.contactName,
        contactPhone: draft.contactPhone,
        contactEmail: draft.contactEmail || undefined,
        siteName: draft.siteName || draft.address.slice(0, 40) || draft.contactName,
        address: draft.address,
        city: draft.city,
        pincode: draft.pincode,
        location: draft.location ?? { lat: 0, lng: 0 },
        photos: draft.photos,
        spec: Object.keys(draft.spec).length > 0 ? (draft.spec as Lead['spec']) : undefined,
        estimatedValue,
        incentiveAmount: conversionBonus,
        incentiveStatus: 'projected',
        duplicateOfLeadId: draft.duplicateOfLeadId,
        notes: draft.notes,
      });
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      setSubmittedCode(lead.code);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  const submit = useCallback(async () => {
    if (!navigator.onLine) {
      // Queued, not lost — evidence already captured (photos, GPS, contact)
      // stays in the persisted draft until connectivity returns.
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify({ queuedAt: new Date().toISOString() }));
      setStatus('queuedOffline');
      return;
    }
    await submitNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureAnother = useCallback(() => {
    reset();
    navigate('/surveyor/capture');
  }, [reset, navigate]);

  const goHome = useCallback(() => {
    reset();
    navigate('/surveyor');
  }, [reset, navigate]);

  return {
    status,
    estimatedValue,
    baseBonus,
    conversionBonus,
    submittedCode,
    isOnline,
    submit,
    captureAnother,
    goHome,
  };
}
