import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { scorePassword } from '@/features/onboarding/validators';
import type { PasswordStrength } from '@/features/onboarding/validators';
import type { User } from '@/data/types';
import { passwordProblems } from '@/features/security/security';
import type { PasswordPolicy } from '@/features/security/security';
import {
  DEMO_RESET_CODE,
  MAX_RESET_REQUESTS,
  RESET_CODE_LENGTH,
  RESET_CODE_TTL_MS,
  RESET_WINDOW_MS,
} from './forgot-password.types';
import type { ResetChannel, ResetError, ResetPhase } from './forgot-password.types';

/** An issued code. Only the newest one is ever accepted. */
interface IssuedCode {
  token: number;
  issuedAt: number;
  used: boolean;
}

interface ForgotPasswordState {
  phase: ResetPhase;
  error: ResetError | null;
  identifier: string;
  setIdentifier: (value: string) => void;
  account: User | null;
  channel: ResetChannel | null;
  code: string;
  setCode: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  strength: PasswordStrength;
  /** The shortest password the security settings (195) allow. */
  minLength: number;
  requestCode: () => Promise<void>;
  verifyCode: () => void;
  submitPassword: () => Promise<void>;
  /** How many other devices were signed out — shown on the confirmation. */
  sessionsClosed: number;
  reset: () => void;
}

/**
 * Owns account recovery.
 *
 * Two rules here are security properties rather than niceties, and both are
 * enforced in this hook: only the most recently issued code is ever valid, and
 * completing a reset invalidates every other session on the account.
 */
export function useForgotPassword(): ForgotPasswordState {
  const repository = useData();

  const [phase, setPhase] = useState<ResetPhase>('identify');
  const [error, setError] = useState<ResetError | null>(null);
  const [identifier, setIdentifierState] = useState('');
  const [account, setAccount] = useState<User | null>(null);
  const [channel, setChannel] = useState<ResetChannel | null>(null);
  const [code, setCodeState] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionsClosed, setSessionsClosed] = useState(0);

  const issuedRef = useRef<IssuedCode | null>(null);
  const requestTimesRef = useRef<number[]>([]);

  const setIdentifier = useCallback((value: string) => {
    setIdentifierState(value);
    setError(null);
  }, []);

  const setCode = useCallback((value: string) => {
    setCodeState(value.replace(/\D/g, '').slice(0, RESET_CODE_LENGTH));
    setError(null);
  }, []);

  const requestCode = useCallback(async () => {
    setError(null);
    const now = Date.now();
    // Rolling window, so an old burst does not lock someone out forever.
    requestTimesRef.current = requestTimesRef.current.filter((t) => now - t < RESET_WINDOW_MS);
    if (requestTimesRef.current.length >= MAX_RESET_REQUESTS) {
      setPhase('rateLimited');
      return;
    }

    setPhase('sending');
    try {
      const users = await repository.listUsers();
      const needle = identifier.trim().toLowerCase();
      const digits = identifier.replace(/\D/g, '');
      const match =
        users.find((u) => u.email?.toLowerCase() === needle) ??
        users.find((u) => digits.length >= 10 && u.phone === digits.slice(-10)) ??
        null;

      if (!match) {
        setError('unknownAccount');
        setPhase('identify');
        return;
      }

      // A rare old import can have neither a verified phone nor an email.
      // That cannot be self-served, so route it to a human rather than loop.
      if (!match.phone && !match.email) {
        setAccount(match);
        setPhase('noChannels');
        return;
      }

      setAccount(match);
      setChannel(match.phone ? 'sms' : 'email');
      requestTimesRef.current.push(now);
      // Issuing a new code supersedes any previous one.
      issuedRef.current = { token: now, issuedAt: now, used: false };
      setCodeState('');
      setPhase('code');
    } catch {
      setError('network');
      setPhase('identify');
    }
  }, [identifier, repository]);

  const verifyCode = useCallback(() => {
    const issued = issuedRef.current;
    if (!issued) {
      setError('supersededCode');
      return;
    }
    if (issued.used) {
      setError('supersededCode');
      return;
    }
    if (Date.now() - issued.issuedAt > RESET_CODE_TTL_MS) {
      setError('expiredCode');
      return;
    }
    if (code !== DEMO_RESET_CODE) {
      setError('wrongCode');
      return;
    }
    issued.used = true;
    setError(null);
    setPhase('password');
  }, [code]);

  // The rules for a password are the ones Admin set in the security settings (195), not a number written into this screen.
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  useEffect(() => { let live = true; void repository.getPasswordPolicy().then((p) => { if (live) setPolicy(p); }).catch(() => undefined); return () => { live = false; }; }, [repository]);
  const minLength = policy?.minLength ?? 8;
  const base = scorePassword(newPassword);
  const strength: PasswordStrength = { ...base, hasLength: newPassword.length >= minLength };

  const submitPassword = useCallback(async () => {
    if (strength.score < 3 || (policy && passwordProblems(policy, newPassword).length > 0)) {
      setError('weakPassword');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('mismatch');
      return;
    }
    // There is no stored credential to compare against in this build, so the
    // "same as your old password" rule is checked against the one thing we do
    // know: an obviously reused value derived from the account's own phone.
    if (account && newPassword === account.phone) {
      setError('samePassword');
      return;
    }

    setPhase('submitting');
    try {
      // Every other device is signed out. The count is what makes that
      // promise visible rather than merely claimed.
      const done = account ? await repository.recordPasswordReset(account.id) : { sessionsEnded: 0 };
      setSessionsClosed(done.sessionsEnded);
      setPhase('done');
    } catch {
      setError('network');
      setPhase('password');
    }
  }, [strength.score, newPassword, confirmPassword, account, policy, repository]);

  const reset = useCallback(() => {
    setPhase('identify');
    setError(null);
    setCodeState('');
    setNewPassword('');
    setConfirmPassword('');
    issuedRef.current = null;
  }, []);

  return {
    phase,
    error,
    identifier,
    setIdentifier,
    account,
    channel,
    code,
    setCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    strength,
    minLength,
    requestCode,
    verifyCode,
    submitPassword,
    sessionsClosed,
    reset,
  };
}
