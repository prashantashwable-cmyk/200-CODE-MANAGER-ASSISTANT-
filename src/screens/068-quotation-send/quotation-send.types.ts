/** Screen 068 — Quotation Send & E-Delivery. Types and translation keys only. */

import type { QuotationDeliveryChannel } from '@/data/types';

export type QuotationSendStatus = 'loading' | 'ready' | 'error';

export const ALL_CHANNELS: QuotationDeliveryChannel[] = ['whatsapp', 'email'];

export const QUOTATION_SEND_KEYS = {
  title: 'quotationSend.title',
  loading: 'quotationSend.loading',
  error: { title: 'quotationSend.error.title', body: 'quotationSend.error.body' },

  supersededState: {
    title: 'quotationSend.supersededState.title',
    body: 'quotationSend.supersededState.body',
    viewLatest: 'quotationSend.supersededState.viewLatest',
  },

  noChannelState: {
    title: 'quotationSend.noChannelState.title',
    body: 'quotationSend.noChannelState.body',
  },

  scheduledCard: {
    title: 'quotationSend.scheduledCard.title',
    scheduledFor: 'quotationSend.scheduledCard.scheduledFor',
    cancel: 'quotationSend.scheduledCard.cancel',
  },

  composeForm: {
    heading: 'quotationSend.composeForm.heading',
    channelHeading: 'quotationSend.composeForm.channelHeading',
    whatsappOptedOutNote: 'quotationSend.composeForm.whatsappOptedOutNote',
    noEmailNote: 'quotationSend.composeForm.noEmailNote',
    messageLabel: 'quotationSend.composeForm.messageLabel',
    defaultMessage: 'quotationSend.composeForm.defaultMessage',
    messageRequired: 'quotationSend.composeForm.messageRequired',
    scheduleToggleLabel: 'quotationSend.composeForm.scheduleToggleLabel',
    scheduleToggleHint: 'quotationSend.composeForm.scheduleToggleHint',
    scheduleTimeLabel: 'quotationSend.composeForm.scheduleTimeLabel',
    schedulePastError: 'quotationSend.composeForm.schedulePastError',
    sendNow: 'quotationSend.composeForm.sendNow',
    scheduleSend: 'quotationSend.composeForm.scheduleSend',
  },

  channel: {
    whatsapp: 'quotationChannel.whatsapp',
    email: 'quotationChannel.email',
  },

  confirmation: {
    messageSentLabel: 'quotationSend.confirmation.messageSentLabel',
    allDelivered: 'quotationSend.confirmation.allDelivered',
    allFailed: 'quotationSend.confirmation.allFailed',
    mixedResult: 'quotationSend.confirmation.mixedResult',
    channelStatus: {
      delivered: 'quotationSend.confirmation.channelStatus.delivered',
      sent: 'quotationSend.confirmation.channelStatus.sent',
      failed: 'quotationSend.confirmation.channelStatus.failed',
    },
    failureReason: {
      opted_out: 'quotationSend.confirmation.failureReason.opted_out',
      not_on_whatsapp: 'quotationSend.confirmation.failureReason.not_on_whatsapp',
      no_email_on_file: 'quotationSend.confirmation.failureReason.no_email_on_file',
    },
    viewTracking: {
      viewed: 'quotationSend.confirmation.viewTracking.viewed',
      sentNotViewed: 'quotationSend.confirmation.viewTracking.sentNotViewed',
    },
  },

  toast: {
    sent: 'quotationSend.toast.sent',
    scheduled: 'quotationSend.toast.scheduled',
    cancelled: 'quotationSend.toast.cancelled',
    error: 'quotationSend.toast.error',
  },
} as const;
