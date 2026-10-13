/** Screen 081 — Payment Stage Schedule Setup Screen. Types and translation keys only. */

import type { PaymentDueTriggerType, PaymentScheduleType, PaymentStage } from '@/data/types';

export type PaymentScheduleSetupStatus = 'loading' | 'ready' | 'error';

export const STAGE_PRESETS: PaymentStage[] = ['advance', 'material', 'installation', 'handover', 'retention'];

export const STAGE_PRESET_LABELS: Record<PaymentStage, string> = {
  advance: 'Booking Advance',
  material: 'Material Order Payment',
  installation: 'Pre-Installation Payment',
  handover: 'Final Handover Payment',
  retention: 'Retention',
};

export const STAGE_DEFAULT_TRIGGER: Record<PaymentStage, PaymentDueTriggerType> = {
  advance: 'fixed_date',
  material: 'milestone',
  installation: 'fixed_date',
  handover: 'milestone',
  retention: 'fixed_date',
};

export const STAGE_DEFAULT_MILESTONE: Partial<Record<PaymentStage, string>> = {
  material: 'job.step.materialsReceived',
  handover: 'job.step.finishHandover',
};

/** Every real installation SOP step (owned by screen 014) a stage can be
 *  milestone-triggered against. */
export const MILESTONE_OPTIONS = [
  'job.step.siteReadiness',
  'job.step.materialsReceived',
  'job.step.guideRails',
  'job.step.machineMount',
  'job.step.carAssembly',
  'job.step.doorOperator',
  'job.step.wiringControl',
  'job.step.safetyGearTest',
  'job.step.loadTest',
  'job.step.finishHandover',
] as const;

export const SCHEDULE_TYPES: PaymentScheduleType[] = ['standard', 'custom', 'bank_guarantee'];

/** Draft, editable shape of one stage row — kept separate from
 *  `PaymentScheduleStage` since a draft has no `id`/`isDemo` yet. */
export interface DraftStage {
  key: string;
  stage: PaymentStage;
  label: string;
  amount: number;
  dueTrigger: PaymentDueTriggerType;
  fixedDueDate: string;
  triggerMilestone: string;
}

export const PAYMENT_SCHEDULE_SETUP_KEYS = {
  title: 'paymentScheduleSetup.title',
  loading: 'paymentScheduleSetup.loading',
  error: { title: 'paymentScheduleSetup.error.title', body: 'paymentScheduleSetup.error.body' },
  notReady: { title: 'paymentScheduleSetup.notReady.title', body: 'paymentScheduleSetup.notReady.body' },

  scheduleType: {
    heading: 'paymentScheduleSetup.scheduleType.heading',
    standard: 'paymentScheduleSetup.scheduleType.standard',
    custom: 'paymentScheduleSetup.scheduleType.custom',
    bank_guarantee: 'paymentScheduleSetup.scheduleType.bank_guarantee',
    noteLabel: 'paymentScheduleSetup.scheduleType.noteLabel',
    noteHint: 'paymentScheduleSetup.scheduleType.noteHint',
  },

  reconcile: {
    heading: 'paymentScheduleSetup.reconcile.heading',
    target: 'paymentScheduleSetup.reconcile.target',
    current: 'paymentScheduleSetup.reconcile.current',
    ok: 'paymentScheduleSetup.reconcile.ok',
    short: 'paymentScheduleSetup.reconcile.short',
    over: 'paymentScheduleSetup.reconcile.over',
  },

  stage: {
    heading: 'paymentScheduleSetup.stage.heading',
    presetLabel: 'paymentScheduleSetup.stage.presetLabel',
    nameLabel: 'paymentScheduleSetup.stage.nameLabel',
    amountLabel: 'paymentScheduleSetup.stage.amountLabel',
    triggerLabel: 'paymentScheduleSetup.stage.triggerLabel',
    triggerFixed: 'paymentScheduleSetup.stage.triggerFixed',
    triggerMilestone: 'paymentScheduleSetup.stage.triggerMilestone',
    dueDateLabel: 'paymentScheduleSetup.stage.dueDateLabel',
    milestoneLabel: 'paymentScheduleSetup.stage.milestoneLabel',
    milestoneResolved: 'paymentScheduleSetup.stage.milestoneResolved',
    milestonePending: 'paymentScheduleSetup.stage.milestonePending',
    noDateSet: 'paymentScheduleSetup.stage.noDateSet',
    moveUp: 'paymentScheduleSetup.stage.moveUp',
    moveDown: 'paymentScheduleSetup.stage.moveDown',
    remove: 'paymentScheduleSetup.stage.remove',
    addStage: 'paymentScheduleSetup.stage.addStage',
  },

  preview: {
    heading: 'paymentScheduleSetup.preview.heading',
    subtitle: 'paymentScheduleSetup.preview.subtitle',
  },

  activated: {
    banner: 'paymentScheduleSetup.activated.banner',
    by: 'paymentScheduleSetup.activated.by',
  },

  actionBar: {
    activate: 'paymentScheduleSetup.actionBar.activate',
    savedDraft: 'paymentScheduleSetup.actionBar.savedDraft',
  },

  toast: {
    saved: 'paymentScheduleSetup.toast.saved',
    activated: 'paymentScheduleSetup.toast.activated',
    reconcileError: 'paymentScheduleSetup.toast.reconcileError',
    error: 'paymentScheduleSetup.toast.error',
  },
} as const;
