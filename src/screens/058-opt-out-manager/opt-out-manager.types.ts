/** Screen 058 — Communication Compliance & Opt-Out Manager. Types and translation keys only. */

import type { CommChannel, OptOutChannel, OptOutEvent } from '@/data/types';

export type OptOutManagerStatus = 'loading' | 'ready' | 'error';

export const CHANNELS: CommChannel[] = ['whatsapp', 'sms', 'call'];

export const OPT_OUT_CHANNEL_OPTIONS: OptOutChannel[] = ['whatsapp', 'sms', 'call', 'all'];

export const OPT_OUT_SOURCES: OptOutEvent['source'][] = ['customer_request', 'manual_entry', 'dnd_registry', 'stop_keyword'];

export type ChannelComplianceStatus = 'dnd' | 'opted_out' | 'clear';

export type ContactFilter = 'all' | 'opted_out' | 'dnd' | 'clear';

export const OPT_OUT_MANAGER_KEYS = {
  title: 'optOutManager.title',
  subtitle: 'optOutManager.subtitle',
  loading: 'optOutManager.loading',
  error: { title: 'optOutManager.error.title', body: 'optOutManager.error.body' },
  empty: { title: 'optOutManager.empty.title', body: 'optOutManager.empty.body' },
  searchPlaceholder: 'optOutManager.searchPlaceholder',

  filter: {
    all: 'optOutManager.filter.all',
    opted_out: 'optOutManager.filter.optedOut',
    dnd: 'optOutManager.filter.dnd',
    clear: 'optOutManager.filter.clear',
  },

  status: {
    dnd: 'optOutManager.status.dnd',
    opted_out: 'optOutManager.status.optedOut',
    clear: 'optOutManager.status.clear',
  },

  channelStatusLine: 'optOutManager.channelStatusLine',

  source: {
    customer_request: 'optOutManager.source.customerRequest',
    manual_entry: 'optOutManager.source.manualEntry',
    dnd_registry: 'optOutManager.source.dndRegistry',
    stop_keyword: 'optOutManager.source.stopKeyword',
  },

  addEntry: 'optOutManager.addEntry',
  exportAudit: 'optOutManager.exportAudit',

  sheet: {
    title: 'optOutManager.sheet.title',
    nameLabel: 'optOutManager.sheet.nameLabel',
    phoneLabel: 'optOutManager.sheet.phoneLabel',
    channelLabel: 'optOutManager.sheet.channelLabel',
    typeLabel: 'optOutManager.sheet.typeLabel',
    typeOptOut: 'optOutManager.sheet.typeOptOut',
    typeOptIn: 'optOutManager.sheet.typeOptIn',
    sourceLabel: 'optOutManager.sheet.sourceLabel',
    reasonLabel: 'optOutManager.sheet.reasonLabel',
    transactionalHint: 'optOutManager.sheet.transactionalHint',
    save: 'optOutManager.sheet.save',
  },

  toast: {
    saved: 'optOutManager.toast.saved',
    error: 'optOutManager.toast.error',
  },
} as const;
