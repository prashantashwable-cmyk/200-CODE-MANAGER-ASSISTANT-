/** Screen 072 — Live Negotiation Thread. Types and translation keys only. */

import type { NegotiationStatus } from '@/data/types';

export type NegotiationThreadStatus = 'loading' | 'ready' | 'error';

/** What the thread's composer and banners key off — a simplified view of
 *  `NegotiationStatus` that only distinguishes who is (or should be)
 *  talking, not why. */
export type ControlMode = 'bot' | 'needs_human' | 'human' | 'closed';

export function controlModeOf(status: NegotiationStatus): ControlMode {
  if (status === 'bot_active') return 'bot';
  if (status === 'escalated') return 'needs_human';
  if (status === 'human_takeover') return 'human';
  return 'closed';
}

export const NEGOTIATION_THREAD_KEYS = {
  title: 'negotiationThread.title',
  finalizeTerms: 'negotiationThread.finalizeTerms',
  loading: 'negotiationThread.loading',
  error: { title: 'negotiationThread.error.title', body: 'negotiationThread.error.body' },

  header: {
    currentOffer: 'negotiationThread.header.currentOffer',
    floor: 'negotiationThread.header.floor',
    round: 'negotiationThread.header.round',
  },

  status: {
    bot_active: 'negotiationThread.status.bot_active',
    escalated: 'negotiationThread.status.escalated',
    human_takeover: 'negotiationThread.status.human_takeover',
    closed_won: 'negotiationThread.status.closed_won',
    closed_lost: 'negotiationThread.status.closed_lost',
  },

  escalationReason: {
    no_scenario_match: 'negotiationThread.escalationReason.no_scenario_match',
    max_rounds_reached: 'negotiationThread.escalationReason.max_rounds_reached',
    manual_takeover: 'negotiationThread.escalationReason.manual_takeover',
  },

  takeOver: {
    banner: 'negotiationThread.takeOver.banner',
    action: 'negotiationThread.takeOver.action',
  },

  bubble: {
    bot: 'negotiationThread.bubble.bot',
    photo: 'negotiationThread.bubble.photo',
    voice: 'negotiationThread.bubble.voice',
  },

  composer: {
    placeholder: 'negotiationThread.composer.placeholder',
    send: 'negotiationThread.composer.send',
    botHandlingNote: 'negotiationThread.composer.botHandlingNote',
    closedNote: 'negotiationThread.composer.closedNote',
  },

  empty: { title: 'negotiationThread.empty.title', body: 'negotiationThread.empty.body' },

  toast: {
    takenOver: 'negotiationThread.toast.takenOver',
    sent: 'negotiationThread.toast.sent',
    error: 'negotiationThread.toast.error',
  },
} as const;
