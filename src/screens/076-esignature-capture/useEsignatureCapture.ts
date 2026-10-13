import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SignatureView } from '@/data/repository';
import { DEMO_OTP, OTP_LENGTH, WRONG_ATTEMPTS_BEFORE_FALLBACK } from './esignature-capture.types';
import type { EsignatureCaptureStatus, OtpStepPhase, SigningMethodTab } from './esignature-capture.types';

interface EsignatureCaptureState {
  status: EsignatureCaptureStatus;
  view: SignatureView | null;

  otpPhase: OtpStepPhase;
  otpCode: string;
  setOtpCode: (v: string) => void;
  wrongAttempts: number;
  verifyOtp: () => void;
  useManualFallback: () => void;
  identityConfirmed: boolean;
  confirmedViaFallback: boolean;

  methodTab: SigningMethodTab;
  setMethodTab: (v: SigningMethodTab) => void;
  drawnDataUrl: string;
  setDrawnDataUrl: (v: string) => void;
  typedName: string;
  setTypedName: (v: string) => void;
  consentGiven: boolean;
  setConsentGiven: (v: boolean) => void;
  canSubmitSignature: boolean;

  signing: boolean;
  submitSignature: () => Promise<boolean>;

  countersigning: boolean;
  countersign: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns customer signing and AIEC countersignature for one deal's contract.
 * OTP correctness is a client-side check exactly like screen 003's login
 * OTP — nothing here ever sends a real code — so `identityConfirmed` is
 * purely local state until the moment of submission, when it travels with
 * the signature as `customerOtpVerified` on the repository record.
 */
export function useEsignatureCapture(): EsignatureCaptureState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<EsignatureCaptureStatus>('loading');
  const [view, setView] = useState<SignatureView | null>(null);

  const [otpPhase, setOtpPhase] = useState<OtpStepPhase>('entering');
  const [otpCode, setOtpCodeState] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [confirmedViaFallback, setConfirmedViaFallback] = useState(false);

  const [methodTab, setMethodTab] = useState<SigningMethodTab>('drawn');
  const [drawnDataUrl, setDrawnDataUrl] = useState('');
  const [typedName, setTypedName] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [signing, setSigning] = useState(false);
  const [countersigning, setCountersigning] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) {
      setStatus('error');
      return;
    }
    try {
      const result = await repository.getSignature(dealId);
      if (!result) {
        setStatus('error');
        return;
      }
      setView(result);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setOtpCode = useCallback((value: string) => {
    setOtpCodeState(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
  }, []);

  const verifyOtp = useCallback(() => {
    if (otpCode === DEMO_OTP) {
      setOtpPhase('verified');
      return;
    }
    setWrongAttempts((n) => n + 1);
    setOtpPhase('wrong');
    setOtpCodeState('');
  }, [otpCode]);

  const useManualFallback = useCallback(() => {
    setConfirmedViaFallback(true);
    setOtpPhase('verified');
  }, []);

  const identityConfirmed = otpPhase === 'verified';

  const canSubmitSignature =
    identityConfirmed &&
    consentGiven &&
    (methodTab === 'drawn' ? drawnDataUrl !== '' : typedName.trim() !== '');

  const submitSignature = useCallback(async () => {
    if (!dealId || !canSubmitSignature) return false;
    setSigning(true);
    try {
      await repository.recordCustomerSignature(dealId, {
        method: methodTab,
        data: methodTab === 'drawn' ? drawnDataUrl : typedName.trim(),
        consentGiven,
      });
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSigning(false);
    }
  }, [repository, dealId, canSubmitSignature, methodTab, drawnDataUrl, typedName, consentGiven, load]);

  const countersign = useCallback(async () => {
    if (!dealId || !user) return false;
    setCountersigning(true);
    try {
      await repository.recordAiecCountersignature(dealId, user.id);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setCountersigning(false);
    }
  }, [repository, dealId, user, load]);

  return {
    status,
    view,
    otpPhase,
    otpCode,
    setOtpCode,
    wrongAttempts,
    verifyOtp,
    useManualFallback,
    identityConfirmed,
    confirmedViaFallback,
    methodTab,
    setMethodTab,
    drawnDataUrl,
    setDrawnDataUrl,
    typedName,
    setTypedName,
    consentGiven,
    setConsentGiven,
    canSubmitSignature,
    signing,
    submitSignature,
    countersigning,
    countersign,
    reload: load,
  };
}
