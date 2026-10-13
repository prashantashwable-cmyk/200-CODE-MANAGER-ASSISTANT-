/** Screen 083 — Automated Payment Reminder Configuration Screen. Types and translation keys only. */

import type { ReminderEscalationTier } from '@/data/types';

export type PaymentReminderConfigStatus = 'loading' | 'ready' | 'error';

export const ESCALATION_TIERS: ReminderEscalationTier[] = ['friendly', 'firm', 'call_task'];

/** Templates a message-tier step can send from — the Communication
 *  Templates Library groups this screen is allowed to reuse (051). Kept to
 *  the two payment-specific groups rather than every template in the app,
 *  since an unrelated template (e.g. a welcome message) has no business
 *  driving a payment reminder. */
export const REMINDER_TEMPLATE_GROUPS = ['tpl-payment-reminder', 'tpl-payment-reminder-firm'] as const;

export interface DraftReminderStep {
  key: string;
  daysOffset: number;
  escalationTier: ReminderEscalationTier;
  channel: 'sms' | 'whatsapp' | 'call';
  templateGroupId: string;
}

export const PAYMENT_REMINDER_CONFIG_KEYS = {
  title: 'paymentReminderConfig.title',
  subtitle: 'paymentReminderConfig.subtitle',
  loading: 'paymentReminderConfig.loading',
  error: { title: 'paymentReminderConfig.error.title', body: 'paymentReminderConfig.error.body' },

  tier: {
    friendly: 'paymentReminderConfig.tier.friendly',
    firm: 'paymentReminderConfig.tier.firm',
    call_task: 'paymentReminderConfig.tier.call_task',
  },

  cadence: {
    heading: 'paymentReminderConfig.cadence.heading',
    dayLabel: 'paymentReminderConfig.cadence.dayLabel',
    dayBefore: 'paymentReminderConfig.cadence.dayBefore',
    dayOf: 'paymentReminderConfig.cadence.dayOf',
    dayAfter: 'paymentReminderConfig.cadence.dayAfter',
    tierLabel: 'paymentReminderConfig.cadence.tierLabel',
    channelLabel: 'paymentReminderConfig.cadence.channelLabel',
    templateLabel: 'paymentReminderConfig.cadence.templateLabel',
    callTaskNote: 'paymentReminderConfig.cadence.callTaskNote',
    remove: 'paymentReminderConfig.cadence.remove',
    addStep: 'paymentReminderConfig.cadence.addStep',
  },

  sendWindow: {
    heading: 'paymentReminderConfig.sendWindow.heading',
    body: 'paymentReminderConfig.sendWindow.body',
    startLabel: 'paymentReminderConfig.sendWindow.startLabel',
    endLabel: 'paymentReminderConfig.sendWindow.endLabel',
    holidayNote: 'paymentReminderConfig.sendWindow.holidayNote',
  },

  preview: {
    heading: 'paymentReminderConfig.preview.heading',
    sampleLabel: 'paymentReminderConfig.preview.sampleLabel',
    outcome: {
      sent_in_past: 'paymentReminderConfig.preview.outcome.sent_in_past',
      due_today: 'paymentReminderConfig.preview.outcome.due_today',
      upcoming: 'paymentReminderConfig.preview.outcome.upcoming',
      skipped_opted_out: 'paymentReminderConfig.preview.outcome.skipped_opted_out',
      skipped_paused: 'paymentReminderConfig.preview.outcome.skipped_paused',
    },
    empty: 'paymentReminderConfig.preview.empty',
  },

  runNow: {
    heading: 'paymentReminderConfig.runNow.heading',
    body: 'paymentReminderConfig.runNow.body',
    button: 'paymentReminderConfig.runNow.button',
    resultSent: 'paymentReminderConfig.runNow.resultSent',
    resultCallTasks: 'paymentReminderConfig.runNow.resultCallTasks',
    resultSkippedOptedOut: 'paymentReminderConfig.runNow.resultSkippedOptedOut',
    resultSkippedPaused: 'paymentReminderConfig.runNow.resultSkippedPaused',
    resultSkippedWindow: 'paymentReminderConfig.runNow.resultSkippedWindow',
  },

  pauses: {
    heading: 'paymentReminderConfig.pauses.heading',
    empty: 'paymentReminderConfig.pauses.empty',
    longStanding: 'paymentReminderConfig.pauses.longStanding',
    pausedLine: 'paymentReminderConfig.pauses.pausedLine',
    resume: 'paymentReminderConfig.pauses.resume',
    addPause: 'paymentReminderConfig.pauses.addPause',
  },

  pauseSheet: {
    title: 'paymentReminderConfig.pauseSheet.title',
    hint: 'paymentReminderConfig.pauseSheet.hint',
    dealLabel: 'paymentReminderConfig.pauseSheet.dealLabel',
    reasonLabel: 'paymentReminderConfig.pauseSheet.reasonLabel',
    submit: 'paymentReminderConfig.pauseSheet.submit',
  },

  actionBar: {
    save: 'paymentReminderConfig.actionBar.save',
  },

  toast: {
    saved: 'paymentReminderConfig.toast.saved',
    paused: 'paymentReminderConfig.toast.paused',
    resumed: 'paymentReminderConfig.toast.resumed',
    ranNow: 'paymentReminderConfig.toast.ranNow',
    error: 'paymentReminderConfig.toast.error',
  },
} as const;
