/** The field SOS, pure. An SOS is sent after a short window in which it can be cancelled, and it never depends on the phone staying open. */
import type { FieldSosAttempt } from '@/data/types';

/** Seconds a person has to cancel an accidental SOS before Admin hears of it (019 tells Admin the same number). */
export const SOS_CANCEL_WINDOW_S = 10;
export const SOS_CANCEL_WINDOW_MS = SOS_CANCEL_WINDOW_S * 1000;
/** A second press this soon after the last is the same emergency, not a new one. */
export const SOS_SAME_INCIDENT = 10 * 60_000;

export type SosPhase = 'sending' | 'sent' | 'cancelled';

export const sosPhaseOf = (a: Pick<FieldSosAttempt, 'status' | 'sendsAt'>): SosPhase => (a.status === 'pending' ? 'sending' : a.status === 'sent' ? 'sent' : 'cancelled');

/** Whole seconds left to cancel, never negative. */
export const secondsLeft = (sendsAt: string, now: number): number => Math.max(0, Math.ceil((new Date(sendsAt).getTime() - now) / 1000));
