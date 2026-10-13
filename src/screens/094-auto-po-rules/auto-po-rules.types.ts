/** Screen 094 — Auto-PO Trigger Rules. Types and translation keys only. */

import type { PoTriggerCondition, SupplierMatchStrategy, SupplierMatchWeights } from '@/data/types';

export type AutoPoRulesStatus = 'loading' | 'ready' | 'error';

export const TRIGGER_CONDITIONS: PoTriggerCondition[] = ['on_countersignature', 'on_first_payment'];
export const MATCH_STRATEGIES: SupplierMatchStrategy[] = ['blend', 'price', 'speed', 'performance'];
export const WEIGHT_KEYS: (keyof SupplierMatchWeights)[] = ['price', 'speed', 'performance'];

/** A change that raises financial exposure or removes oversight — asked
 *  about explicitly before it saves, never saved like a routine setting. */
export type HighConsequenceChange = 'automation_off' | 'automation_on' | 'earlier_trigger' | 'threshold_raised';

export const AUTO_PO_RULES_KEYS = {
  title: 'autoPoRules.title',
  subtitle: 'autoPoRules.subtitle',
  loading: 'autoPoRules.loading',
  error: { title: 'autoPoRules.error.title', body: 'autoPoRules.error.body' },
  meta: 'autoPoRules.meta',
  metaDefault: 'autoPoRules.metaDefault',
  futureOnly: 'autoPoRules.futureOnly',

  automation: {
    heading: 'autoPoRules.automation.heading',
    label: 'autoPoRules.automation.label',
    on: 'autoPoRules.automation.on',
    off: 'autoPoRules.automation.off',
  },
  trigger: {
    heading: 'autoPoRules.trigger.heading',
    current: 'autoPoRules.trigger.current',
    on_countersignature: { title: 'autoPoRules.trigger.on_countersignature.title', body: 'autoPoRules.trigger.on_countersignature.body' },
    on_first_payment: { title: 'autoPoRules.trigger.on_first_payment.title', body: 'autoPoRules.trigger.on_first_payment.body' },
  },
  matching: {
    heading: 'autoPoRules.matching.heading',
    current: 'autoPoRules.matching.current',
    strategy: {
      blend: 'autoPoRules.matching.strategy.blend',
      price: 'autoPoRules.matching.strategy.price',
      speed: 'autoPoRules.matching.strategy.speed',
      performance: 'autoPoRules.matching.strategy.performance',
    },
    strategyHint: {
      blend: 'autoPoRules.matching.strategyHint.blend',
      price: 'autoPoRules.matching.strategyHint.price',
      speed: 'autoPoRules.matching.strategyHint.speed',
      performance: 'autoPoRules.matching.strategyHint.performance',
    },
    weight: {
      price: 'autoPoRules.matching.weight.price',
      speed: 'autoPoRules.matching.weight.speed',
      performance: 'autoPoRules.matching.weight.performance',
    },
    weightHint: {
      price: 'autoPoRules.matching.weightHint.price',
      speed: 'autoPoRules.matching.weightHint.speed',
      performance: 'autoPoRules.matching.weightHint.performance',
    },
    preferAssigned: 'autoPoRules.matching.preferAssigned',
    preferAssignedHint: 'autoPoRules.matching.preferAssignedHint',
    newSupplierNote: 'autoPoRules.matching.newSupplierNote',
  },
  approval: {
    heading: 'autoPoRules.approval.heading',
    current: 'autoPoRules.approval.current',
    label: 'autoPoRules.approval.label',
    hint: 'autoPoRules.approval.hint',
    invalid: 'autoPoRules.approval.invalid',
  },
  simulation: {
    heading: 'autoPoRules.simulation.heading',
    intro: 'autoPoRules.simulation.intro',
    driveType: 'autoPoRules.simulation.driveType',
    assigned: 'autoPoRules.simulation.assigned',
    assignedNone: 'autoPoRules.simulation.assignedNone',
    run: 'autoPoRules.simulation.run',
    usingUnsaved: 'autoPoRules.simulation.usingUnsaved',
    none: 'autoPoRules.simulation.none',
    lastRun: 'autoPoRules.simulation.lastRun',
    lastRunUnsaved: 'autoPoRules.simulation.lastRunUnsaved',
    stale: 'autoPoRules.simulation.stale',
    chosen: 'autoPoRules.simulation.chosen',
    reason: {
      assigned_supplier: 'autoPoRules.simulation.reason.assigned_supplier',
      best_score: 'autoPoRules.simulation.reason.best_score',
      no_candidate: 'autoPoRules.simulation.reason.no_candidate',
    },
    fallback: 'autoPoRules.simulation.fallback',
    scoreLine: 'autoPoRules.simulation.scoreLine',
    newSupplier: 'autoPoRules.simulation.newSupplier',
    total: 'autoPoRules.simulation.total',
    needsApproval: 'autoPoRules.simulation.needsApproval',
    noApproval: 'autoPoRules.simulation.noApproval',
    share: 'autoPoRules.simulation.share',
    concentration: 'autoPoRules.simulation.concentration',
    concentrationHint: 'autoPoRules.simulation.concentrationHint',
  },
  save: 'autoPoRules.save',
  discard: 'autoPoRules.discard',
  confirm: {
    title: 'autoPoRules.confirm.title',
    intro: 'autoPoRules.confirm.intro',
    automation_off: 'autoPoRules.confirm.automation_off',
    automation_on: 'autoPoRules.confirm.automation_on',
    earlier_trigger: 'autoPoRules.confirm.earlier_trigger',
    threshold_raised: 'autoPoRules.confirm.threshold_raised',
    submit: 'autoPoRules.confirm.submit',
  },
  toast: {
    saved: 'autoPoRules.toast.saved',
    error: 'autoPoRules.toast.error',
    simulated: 'autoPoRules.toast.simulated',
  },
} as const;
