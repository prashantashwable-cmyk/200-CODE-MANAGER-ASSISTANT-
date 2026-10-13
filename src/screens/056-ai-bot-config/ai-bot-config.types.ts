/** Screen 056 — Conversation AI Bot Configuration. Types and translation keys only. */

import type { BotConfig } from '@/data/types';

export type AiBotConfigStatus = 'loading' | 'ready' | 'error';

export const TONE_OPTIONS: BotConfig['toneKey'][] = ['professional', 'warm', 'concise'];

export const AI_BOT_CONFIG_KEYS = {
  title: 'aiBotConfig.title',
  subtitle: 'aiBotConfig.subtitle',
  loading: 'aiBotConfig.loading',
  error: { title: 'aiBotConfig.error.title', body: 'aiBotConfig.error.body' },

  stats: {
    autoResolved: 'aiBotConfig.stats.autoResolved',
    escalated: 'aiBotConfig.stats.escalated',
  },

  persona: {
    heading: 'aiBotConfig.persona.heading',
    toneLabel: 'aiBotConfig.persona.toneLabel',
    tone: {
      professional: 'aiBotConfig.persona.tone.professional',
      warm: 'aiBotConfig.persona.tone.warm',
      concise: 'aiBotConfig.persona.tone.concise',
    },
  },

  discount: {
    heading: 'aiBotConfig.discount.heading',
    hint: 'aiBotConfig.discount.hint',
    minLabel: 'aiBotConfig.discount.minLabel',
    maxLabel: 'aiBotConfig.discount.maxLabel',
    marginFloorError: 'aiBotConfig.discount.marginFloorError',
    rangeInvalid: 'aiBotConfig.discount.rangeInvalid',
  },

  escalation: {
    heading: 'aiBotConfig.escalation.heading',
    thresholdLabel: 'aiBotConfig.escalation.thresholdLabel',
    hint: 'aiBotConfig.escalation.hint',
    lowConfidenceWarning: 'aiBotConfig.escalation.lowConfidenceWarning',
  },

  save: 'aiBotConfig.save',

  simulator: {
    heading: 'aiBotConfig.simulator.heading',
    subtitle: 'aiBotConfig.simulator.subtitle',
    placeholder: 'aiBotConfig.simulator.placeholder',
    run: 'aiBotConfig.simulator.run',
    empty: { title: 'aiBotConfig.simulator.empty.title', body: 'aiBotConfig.simulator.empty.body' },
    confidence: 'aiBotConfig.simulator.confidence',
    autoResolvedBadge: 'aiBotConfig.simulator.autoResolvedBadge',
    escalatedBadge: 'aiBotConfig.simulator.escalatedBadge',
    testingUnsaved: 'aiBotConfig.simulator.testingUnsaved',
  },

  toast: {
    saved: 'aiBotConfig.toast.saved',
    error: 'aiBotConfig.toast.error',
  },
} as const;
