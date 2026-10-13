/** Screen 059 — Follow-up Stage Trigger Rules. Types and translation keys only. */

import type { LeadStage } from '@/data/types';

export type TriggerRulesStatus = 'loading' | 'ready' | 'error';

export const RULE_STAGES: LeadStage[] = ['captured', 'contacted', 'site_visit', 'quoted', 'negotiation', 'won', 'lost'];

export type ActionKind = 'sequence' | 'template';

export const TRIGGER_RULES_KEYS = {
  title: 'triggerRules.title',
  subtitle: 'triggerRules.subtitle',
  loading: 'triggerRules.loading',
  error: { title: 'triggerRules.error.title', body: 'triggerRules.error.body' },
  empty: { title: 'triggerRules.empty.title', body: 'triggerRules.empty.body' },

  priorityLabel: 'triggerRules.priorityLabel',
  delayNow: 'triggerRules.delayNow',
  delayHours: 'triggerRules.delayHours',
  actionSequence: 'triggerRules.actionSequence',
  actionTemplate: 'triggerRules.actionTemplate',
  stackingBadge: 'triggerRules.stackingBadge',
  enabledToggle: 'triggerRules.enabledToggle',
  moveUp: 'triggerRules.moveUp',
  moveDown: 'triggerRules.moveDown',
  addRule: 'triggerRules.addRule',

  disableConfirm: {
    title: 'triggerRules.disableConfirm.title',
    body: 'triggerRules.disableConfirm.body',
    letFinish: 'triggerRules.disableConfirm.letFinish',
    stopNow: 'triggerRules.disableConfirm.stopNow',
  },

  sheet: {
    title: 'triggerRules.sheet.title',
    nameLabel: 'triggerRules.sheet.nameLabel',
    stageLabel: 'triggerRules.sheet.stageLabel',
    delayHoursLabel: 'triggerRules.sheet.delayHoursLabel',
    actionKindLabel: 'triggerRules.sheet.actionKindLabel',
    sequenceLabel: 'triggerRules.sheet.sequenceLabel',
    templateLabel: 'triggerRules.sheet.templateLabel',
    allowStackingLabel: 'triggerRules.sheet.allowStackingLabel',
    allowStackingHint: 'triggerRules.sheet.allowStackingHint',
    save: 'triggerRules.sheet.save',
  },

  simulator: {
    heading: 'triggerRules.simulator.heading',
    subtitle: 'triggerRules.simulator.subtitle',
    stageLabel: 'triggerRules.simulator.stageLabel',
    run: 'triggerRules.simulator.run',
    empty: { title: 'triggerRules.simulator.empty.title', body: 'triggerRules.simulator.empty.body' },
    noMatch: 'triggerRules.simulator.noMatch',
    wouldFire: 'triggerRules.simulator.wouldFire',
    disabled: 'triggerRules.simulator.disabled',
    suppressed: 'triggerRules.simulator.suppressed',
  },

  toast: {
    saved: 'triggerRules.toast.saved',
    toggled: 'triggerRules.toast.toggled',
    reordered: 'triggerRules.toast.reordered',
    error: 'triggerRules.toast.error',
  },
} as const;
