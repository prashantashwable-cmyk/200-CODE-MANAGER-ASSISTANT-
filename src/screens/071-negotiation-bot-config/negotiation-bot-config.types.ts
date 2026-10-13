/** Screen 071 — Auto-Negotiation Bot Configuration. Types and translation keys only. */

import type { NegotiationObjectionKey, NegotiationStatus, NegotiationTone } from '@/data/types';

export type NegotiationBotConfigStatus = 'loading' | 'ready' | 'error';

export const TONE_OPTIONS: NegotiationTone[] = ['professional', 'warm', 'concise', 'firm'];

export const OBJECTION_KEYS: NegotiationObjectionKey[] = ['price_too_high', 'competitor_comparison', 'wants_to_delay'];

export const NEGOTIATION_BOT_CONFIG_KEYS = {
  title: 'negotiationBotConfig.title',
  subtitle: 'negotiationBotConfig.subtitle',
  loading: 'negotiationBotConfig.loading',
  error: { title: 'negotiationBotConfig.error.title', body: 'negotiationBotConfig.error.body' },
  save: 'negotiationBotConfig.save',
  counterOffersLink: 'negotiationBotConfig.counterOffersLink',

  guardrails: {
    heading: 'negotiationBotConfig.guardrails.heading',
    bufferLabel: 'negotiationBotConfig.guardrails.bufferLabel',
    bufferHint: 'negotiationBotConfig.guardrails.bufferHint',
    bufferMustBeNonNegative: 'negotiationBotConfig.guardrails.bufferMustBeNonNegative',
    effectiveFloor: 'negotiationBotConfig.guardrails.effectiveFloor',
  },

  rounds: {
    heading: 'negotiationBotConfig.rounds.heading',
    label: 'negotiationBotConfig.rounds.label',
    hint: 'negotiationBotConfig.rounds.hint',
    mustBeAtLeastOne: 'negotiationBotConfig.rounds.mustBeAtLeastOne',
  },

  persona: {
    heading: 'negotiationBotConfig.persona.heading',
    toneLabel: 'negotiationBotConfig.persona.toneLabel',
    tone: {
      professional: 'negotiationBotConfig.persona.tone.professional',
      warm: 'negotiationBotConfig.persona.tone.warm',
      concise: 'negotiationBotConfig.persona.tone.concise',
      firm: 'negotiationBotConfig.persona.tone.firm',
    },
  },

  autoClose: {
    heading: 'negotiationBotConfig.autoClose.heading',
    label: 'negotiationBotConfig.autoClose.label',
    hint: 'negotiationBotConfig.autoClose.hint',
    warning: 'negotiationBotConfig.autoClose.warning',
  },

  scenarios: {
    heading: 'negotiationBotConfig.scenarios.heading',
    subtitle: 'negotiationBotConfig.scenarios.subtitle',
    objectionLabel: {
      price_too_high: 'negotiationBotConfig.scenarios.objectionLabel.price_too_high',
      competitor_comparison: 'negotiationBotConfig.scenarios.objectionLabel.competitor_comparison',
      wants_to_delay: 'negotiationBotConfig.scenarios.objectionLabel.wants_to_delay',
    },
    strategyLabel: 'negotiationBotConfig.scenarios.strategyLabel',
    noMatchNote: 'negotiationBotConfig.scenarios.noMatchNote',
  },

  dashboard: {
    heading: 'negotiationBotConfig.dashboard.heading',
    subtitle: 'negotiationBotConfig.dashboard.subtitle',
    empty: 'negotiationBotConfig.dashboard.empty',
    roundsProgress: 'negotiationBotConfig.dashboard.roundsProgress',
    currentOffer: 'negotiationBotConfig.dashboard.currentOffer',
    floor: 'negotiationBotConfig.dashboard.floor',
    takeOver: 'negotiationBotConfig.dashboard.takeOver',
    openThread: 'negotiationBotConfig.dashboard.openThread',
    takenOverBy: 'negotiationBotConfig.dashboard.takenOverBy',
    lastActivity: 'negotiationBotConfig.dashboard.lastActivity',
    status: {
      bot_active: 'negotiationBotConfig.dashboard.status.bot_active',
      escalated: 'negotiationBotConfig.dashboard.status.escalated',
      human_takeover: 'negotiationBotConfig.dashboard.status.human_takeover',
    },
    escalationReason: {
      no_scenario_match: 'negotiationBotConfig.dashboard.escalationReason.no_scenario_match',
      max_rounds_reached: 'negotiationBotConfig.dashboard.escalationReason.max_rounds_reached',
      manual_takeover: 'negotiationBotConfig.dashboard.escalationReason.manual_takeover',
    },
  },

  toast: {
    saved: 'negotiationBotConfig.toast.saved',
    takenOver: 'negotiationBotConfig.toast.takenOver',
    error: 'negotiationBotConfig.toast.error',
  },
} as const;

export function dashboardStatusLabel(status: NegotiationStatus): string {
  if (status === 'bot_active' || status === 'escalated' || status === 'human_takeover') {
    return NEGOTIATION_BOT_CONFIG_KEYS.dashboard.status[status];
  }
  return NEGOTIATION_BOT_CONFIG_KEYS.dashboard.status.bot_active;
}
