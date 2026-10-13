import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { HOME_PATH_BY_ROLE } from '@/navigation/registry';
import { serverConfigured } from '@/data/supabase/client';
import { ServerAuthFailure, requestPhoneLink, requestServerRole, sendSignInCode, verifyPhoneLink, verifySignInCode } from '@/features/auth/serverAuth';
import { isIndianMobile } from '@/features/validation/india';
import type { Role, ServerProfile } from '@/data/types';
import {
  DEMO_OTP,
  ESCALATED_COOLDOWN_S,
  MAX_RESENDS,
  OTP_LENGTH,
  OTP_TTL_MS,
  RESEND_COOLDOWN_S,
  RESEND_WINDOW_MS,
  WRONG_ATTEMPTS_BEFORE_ESCALATION,
} from './otp.types';
import type { OtpError, OtpPhase } from './otp.types';

interface OtpNavState {
  userId?: string;
  phone?: string;
  remember?: boolean;
  /** S1: the code was asked for from the server (Supabase), which checks it. */
  server?: boolean;
  /** Back from Google with no profile yet: the person confirms a mobile number once, and that links their account. */
  link?: boolean;
  /** Back from Google with a profile that is waiting for Admin or not open: show that straight away. */
  profile?: ServerProfile;
}

interface OtpState {
  phase: OtpPhase;
  error: OtpError | null;
  code: string;
  setCode: (value: string) => void;
  phone: string;
  /** Seconds left before resend is allowed again; 0 means allowed now. */
  resendIn: number;
  /** Seconds left on the wrong-code lockout. */
  cooldownIn: number;
  resendsUsed: number;
  wrongAttempts: number;
  canVerify: boolean;
  verify: () => Promise<void>;
  resend: () => void;
  changeNumber: () => void;
  /** S1: signed in through the server, so no code is shown on screen. */
  server: boolean;
  /** Whether text messages are connected (set with the SMS provider, VITE_SMS_CONNECTED). */
  smsConnected: boolean;
  /** S1: a person waiting for Admin may say which role they want. */
  requestedRole: Role | null;
  askState: 'idle' | 'saving' | 'saved' | 'failed';
  askForRole: (role: Role) => Promise<void>;
  /** Google sign-in confirming a mobile number (phase `phone` asks for it). */
  link: boolean;
  phoneInput: string;
  setPhoneInput: (value: string) => void;
  canSendPhone: boolean;
  sendingPhone: boolean;
  sendPhone: () => Promise<void>;
}

/**
 * Owns OTP verification, its two independent timers, and its abuse limits.
 *
 * Two separate countdowns matter here and are easy to conflate: `resendIn`
 * throttles how often a code can be requested (SMS cost), while `cooldownIn`
 * locks entry after repeated wrong codes (brute force). They run independently.
 */
export function useOtp(): OtpState {
  const navigate = useNavigate();
  const location = useLocation();
  const repository = useData();
  const { signInAs, signInWithServer, signOut } = useSession();

  const navState = (location.state ?? {}) as OtpNavState;
  const userId = navState.userId;
  const server = Boolean(navState.server) && serverConfigured;
  const link = server && Boolean(navState.link);
  const landed = server ? navState.profile ?? null : null;
  const [phone, setPhone] = useState(navState.phone ?? '');
  const [phoneInput, setPhoneInputState] = useState('');
  const [sendingPhone, setSendingPhone] = useState(false);
  const hasContext = server ? link || Boolean(landed) || phone.length === 10 : Boolean(userId);

  const [phase, setPhase] = useState<OtpPhase>(
    landed ? (landed.status === 'pending' ? 'pending' : 'inactive') : link ? 'phone' : 'entering',
  );
  const [error, setError] = useState<OtpError | null>(hasContext ? null : 'missingContext');
  const [pendingProfile, setPendingProfile] = useState<ServerProfile | null>(landed?.status === 'pending' ? landed : null);
  const [askState, setAskState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [code, setCodeState] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN_S);
  const [cooldownIn, setCooldownIn] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [resendsUsed, setResendsUsed] = useState(1);

  const sentAtRef = useRef<number>(Date.now());
  const firstResendAtRef = useRef<number>(Date.now());

  // Resend throttle.
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  // Wrong-code lockout.
  useEffect(() => {
    if (cooldownIn <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldownIn((s) => {
        const next = Math.max(0, s - 1);
        if (next === 0) setPhase('entering');
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownIn]);

  // A code that aged out while the app was backgrounded must say so, rather
  // than silently rejecting a code the user typed correctly.
  useEffect(() => {
    const check = () => {
      if (Date.now() - sentAtRef.current > OTP_TTL_MS) {
        setPhase((current) =>
          current === 'entering' || current === 'verifying' ? 'expired' : current,
        );
      }
    };
    const timer = window.setInterval(check, 5000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  const setCode = useCallback((value: string) => {
    // Autofill can pull a code out of an unrelated SMS — keep digits only and
    // let the length check below decide whether it is submittable.
    setCodeState(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
    setError(null);
  }, []);

  // S1: the server makes and checks the code, counts wrong tries itself, and says who this person is.
  const verifyOnServer = useCallback(async () => {
    setPhase('verifying');
    setError(null);
    try {
      const profile = link ? await verifyPhoneLink(phone, code) : await verifySignInCode(phone, code);
      if (profile.status === 'active' && profile.role) {
        await signInWithServer(profile);
        setPhase('success');
        const home = HOME_PATH_BY_ROLE[profile.role];
        window.setTimeout(() => navigate(home, { replace: true }), 450);
        return;
      }
      if (profile.status === 'pending') {
        setPendingProfile(profile);
        setPhase('pending');
        return;
      }
      setPhase('inactive');
    } catch (err) {
      const kind = err instanceof ServerAuthFailure ? err.kind : 'network';
      setCodeState('');
      setError(kind === 'wrong_code' ? 'wrongServerCode' : kind === 'too_many' ? 'tooMany' : kind === 'phone_linked' ? (link ? 'phoneTaken' : 'phoneLinked') : 'network');
      setPhase('entering');
    }
  }, [phone, code, link, signInWithServer, navigate]);

  const setPhoneInput = useCallback((value: string) => {
    // Accept what a person actually types (+91, spaces) and keep the 10 digits.
    setPhoneInputState(value.replace(/\D/g, '').slice(-10));
    setError(null);
  }, []);

  // Google sign-in: ask Supabase to send a code to the number the person gave; the code screen then checks it.
  const sendPhone = useCallback(async () => {
    if (!isIndianMobile(phoneInput)) {
      setError('invalidPhone');
      return;
    }
    setSendingPhone(true);
    setError(null);
    try {
      await requestPhoneLink(phoneInput);
      setPhone(phoneInput);
      sentAtRef.current = Date.now();
      firstResendAtRef.current = Date.now();
      setResendsUsed(1);
      setResendIn(RESEND_COOLDOWN_S);
      setCodeState('');
      setPhase('entering');
    } catch (err) {
      const kind = err instanceof ServerAuthFailure ? err.kind : 'network';
      setError(kind === 'phone_linked' ? 'phoneTaken' : kind === 'too_many' ? 'tooMany' : 'network');
    } finally {
      setSendingPhone(false);
    }
  }, [phoneInput]);

  const verify = useCallback(async () => {
    if (server) {
      if (code.length !== OTP_LENGTH) {
        setError('malformed');
        return;
      }
      await verifyOnServer();
      return;
    }
    if (!userId) {
      setError('missingContext');
      return;
    }
    if (code.length !== OTP_LENGTH) {
      setError('malformed');
      return;
    }
    if (Date.now() - sentAtRef.current > OTP_TTL_MS) {
      setPhase('expired');
      return;
    }

    setPhase('verifying');
    setError(null);
    try {
      const user = await repository.getUser(userId);
      if (!user) {
        setError('missingContext');
        setPhase('entering');
        return;
      }
      // Repeated failures pause an account's sign-in for the time the security settings say (195): a paused account is not told whether the code was right.
      const paused = await repository.precheckSignIn(user.id);
      if (paused.paused && paused.until) {
        setCodeState('');
        setCooldownIn(Math.max(1, Math.ceil((Date.parse(paused.until) - Date.now()) / 1000)));
        setPhase('cooldown');
        return;
      }
      if (code !== DEMO_OTP) {
        const attempts = wrongAttempts + 1;
        setWrongAttempts(attempts);
        setError('wrongCode');
        setCodeState('');
        const failed = await repository.recordLoginFailure(user.id);
        if (failed.paused && failed.until) {
          setCooldownIn(Math.max(1, Math.ceil((Date.parse(failed.until) - Date.now()) / 1000)));
          setPhase('cooldown');
          return;
        }
        if (attempts >= WRONG_ATTEMPTS_BEFORE_ESCALATION) {
          setCooldownIn(ESCALATED_COOLDOWN_S);
          setPhase('cooldown');
        } else {
          setPhase('entering');
        }
        return;
      }

      // Verified: the session is established before we navigate anywhere, so
      // the destination screen never renders against a half-built session.
      // Any prior demo session is discarded first.
      signOut();
      await signInAs(user.id);
      setPhase('success');
      window.setTimeout(() => navigate(HOME_PATH_BY_ROLE[user.role], { replace: true }), 450);
    } catch {
      setError('network');
      setPhase('entering');
    }
  }, [server, verifyOnServer, userId, code, wrongAttempts, repository, signInAs, signOut, navigate]);

  // The spec asks for no extra "continue" tap: the moment six valid digits are
  // present, verification runs itself. The button below stays for keyboard and
  // screen-reader users, and for a retry after a wrong code.
  useEffect(() => {
    if (phase === 'entering' && code.length === OTP_LENGTH) void verify();
  }, [code, phase, verify]);

  const resend = useCallback(() => {
    const now = Date.now();
    if (server) {
      // Ask the server for a fresh code; it applies its own limits too.
      void (link ? requestPhoneLink(phone) : sendSignInCode(phone)).catch((err: unknown) => setError(err instanceof ServerAuthFailure && err.kind === 'too_many' ? 'tooMany' : 'network'));
    }
    // The cap is per rolling window, so an old window resets the counter.
    if (now - firstResendAtRef.current > RESEND_WINDOW_MS) {
      firstResendAtRef.current = now;
      setResendsUsed(0);
    }
    if (resendsUsed >= MAX_RESENDS) {
      setPhase('resendBlocked');
      return;
    }
    sentAtRef.current = now;
    setResendsUsed((n) => n + 1);
    setResendIn(RESEND_COOLDOWN_S);
    setCodeState('');
    setError(null);
    setPhase('entering');
  }, [resendsUsed, server, link, phone]);

  const changeNumber = useCallback(() => {
    // Signed in with Google and confirming a number: another number is asked for here, the Google sign-in stays.
    if (link && phase !== 'pending' && phase !== 'inactive') {
      setCodeState('');
      setError(null);
      setPhase('phone');
      return;
    }
    // Going back a step must not lose the rest of the login flow, so this is a
    // plain navigation rather than a session teardown.
    navigate('/login');
  }, [navigate, link, phase]);

  const askForRole = useCallback(
    async (role: Role) => {
      if (!pendingProfile) return;
      setAskState('saving');
      try {
        await requestServerRole(pendingProfile.id, role);
        setPendingProfile({ ...pendingProfile, requestedRole: role });
        setAskState('saved');
      } catch {
        setAskState('failed');
      }
    },
    [pendingProfile],
  );

  return {
    server,
    smsConnected: import.meta.env.VITE_SMS_CONNECTED === 'true',
    requestedRole: pendingProfile?.requestedRole ?? null,
    askState,
    askForRole,
    link,
    phoneInput,
    setPhoneInput,
    canSendPhone: isIndianMobile(phoneInput) && phase === 'phone' && !sendingPhone,
    sendingPhone,
    sendPhone,
    phase,
    error,
    code,
    setCode,
    phone,
    resendIn,
    cooldownIn,
    resendsUsed,
    wrongAttempts,
    canVerify: code.length === OTP_LENGTH && phase === 'entering',
    verify,
    resend,
    changeNumber,
  };
}
