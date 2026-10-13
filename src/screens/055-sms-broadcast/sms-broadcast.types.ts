/** Screen 055 — SMS Broadcast & Delivery Report. Types and translation keys only. */

import type { LeadSource, LeadStage } from '@/data/types';

export type SmsBroadcastStatus = 'loading' | 'ready' | 'error';

export const SEGMENT_STAGES: LeadStage[] = ['captured', 'contacted', 'site_visit', 'quoted', 'negotiation', 'won'];

export const SEGMENT_SOURCES: LeadSource[] = [
  'field_survey',
  'referral_repeat',
  'inbound_website',
  'inbound_whatsapp',
  'bulk_import',
];

/** Rough single-segment SMS length before a carrier splits it into two. */
export const SMS_SEGMENT_LIMIT = 160;

/** A segment past this size gets an explicit confirm step — protects against
 *  a filter mistake accidentally reaching far more people than intended. */
export const LARGE_SEND_THRESHOLD = 15;

/** TRAI/DND rules block promotional SMS between 9 PM and 9 AM IST. */
export const RESTRICTED_HOUR_START = 21;
export const RESTRICTED_HOUR_END = 9;

export const SMS_BROADCAST_KEYS = {
  title: 'smsBroadcast.title',
  subtitle: 'smsBroadcast.subtitle',
  loading: 'smsBroadcast.loading',
  error: { title: 'smsBroadcast.error.title', body: 'smsBroadcast.error.body' },
  empty: { title: 'smsBroadcast.empty.title', body: 'smsBroadcast.empty.body' },

  kpi: {
    sentThisMonth: 'smsBroadcast.kpi.sentThisMonth',
    deliveryRate: 'smsBroadcast.kpi.deliveryRate',
    totalCost: 'smsBroadcast.kpi.totalCost',
  },

  newBroadcast: 'smsBroadcast.newBroadcast',

  compose: {
    title: 'smsBroadcast.compose.title',
    nameLabel: 'smsBroadcast.compose.nameLabel',
    messageLabel: 'smsBroadcast.compose.messageLabel',
    charCount: 'smsBroadcast.compose.charCount',
    segmentHeading: 'smsBroadcast.compose.segmentHeading',
    stageLabel: 'smsBroadcast.compose.stageLabel',
    sourceLabel: 'smsBroadcast.compose.sourceLabel',
    cityLabel: 'smsBroadcast.compose.cityLabel',
    allCities: 'smsBroadcast.compose.allCities',
    allSegment: 'smsBroadcast.compose.allSegment',
    searchPlaceholder: 'smsBroadcast.compose.searchPlaceholder',
    previewMatching: 'smsBroadcast.compose.previewMatching',
    previewExcluded: 'smsBroadcast.compose.previewExcluded',
    previewCost: 'smsBroadcast.compose.previewCost',
    scheduleLabel: 'smsBroadcast.compose.scheduleLabel',
    scheduleHint: 'smsBroadcast.compose.scheduleHint',
    restrictedHourWarning: 'smsBroadcast.compose.restrictedHourWarning',
    largeSendWarning: 'smsBroadcast.compose.largeSendWarning',
    largeSendConfirmLabel: 'smsBroadcast.compose.largeSendConfirmLabel',
    sendNow: 'smsBroadcast.compose.sendNow',
    schedule: 'smsBroadcast.compose.schedule',
    noMatches: 'smsBroadcast.compose.noMatches',
  },

  report: {
    segmentSize: 'smsBroadcast.report.segmentSize',
    sent: 'smsBroadcast.report.sent',
    delivered: 'smsBroadcast.report.delivered',
    failed: 'smsBroadcast.report.failed',
    excludedOptedOut: 'smsBroadcast.report.excludedOptedOut',
    scheduledFor: 'smsBroadcast.report.scheduledFor',
    cancel: 'smsBroadcast.report.cancel',
    statusBadge: {
      draft: 'smsBroadcast.report.statusBadge.draft',
      scheduled: 'smsBroadcast.report.statusBadge.scheduled',
      sending: 'smsBroadcast.report.statusBadge.sending',
      sent: 'smsBroadcast.report.statusBadge.sent',
      cancelled: 'smsBroadcast.report.statusBadge.cancelled',
    },
  },

  failureReason: {
    invalid_number: 'smsBroadcast.failureReason.invalidNumber',
    carrier_block: 'smsBroadcast.failureReason.carrierBlock',
    handset_unreachable: 'smsBroadcast.failureReason.handsetUnreachable',
  },

  toast: {
    sent: 'smsBroadcast.toast.sent',
    scheduled: 'smsBroadcast.toast.scheduled',
    cancelled: 'smsBroadcast.toast.cancelled',
    error: 'smsBroadcast.toast.error',
  },

  action: { close: 'action.close' },
} as const;
