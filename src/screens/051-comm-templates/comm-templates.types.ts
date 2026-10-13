/** Screen 051 — Communication Templates Library. Types and translation keys only. */

import type { CommChannel, Language, LeadStage } from '@/data/types';

export type CommTemplatesStatus = 'loading' | 'ready' | 'error';

export const KNOWN_MERGE_FIELDS = ['customerName', 'buildingName', 'quoteAmount', 'installStep', 'visitDate'] as const;

export const CHANNEL_FILTERS: CommChannel[] = ['whatsapp', 'sms', 'call'];

export const STAGE_FILTERS: (LeadStage | 'any')[] = ['any', 'captured', 'contacted', 'site_visit', 'quoted', 'negotiation', 'won'];

/** Rough single-segment SMS length before a carrier splits it into two. */
export const SMS_SEGMENT_LIMIT = 160;

export const EDITOR_LANGUAGES: Language[] = ['en', 'hi', 'mr'];

export const COMM_TEMPLATES_KEYS = {
  title: 'commTemplates.title',
  subtitle: 'commTemplates.subtitle',
  loading: 'commTemplates.loading',
  error: { title: 'commTemplates.error.title', body: 'commTemplates.error.body' },
  empty: { title: 'commTemplates.empty.title', body: 'commTemplates.empty.body' },
  noResults: { title: 'commTemplates.noResults.title', body: 'commTemplates.noResults.body' },
  searchPlaceholder: 'commTemplates.searchPlaceholder',
  allStagesOption: 'commTemplates.allStagesOption',
  anyStage: 'commTemplates.anyStage',

  statusBadge: {
    active: 'commTemplates.statusBadge.active',
    draft: 'commTemplates.statusBadge.draft',
  },
  languagesAvailable: 'commTemplates.languagesAvailable',

  editor: {
    title: 'commTemplates.editor.title',
    languageTab: 'commTemplates.editor.languageTab',
    bodyLabel: 'commTemplates.editor.bodyLabel',
    insertField: 'commTemplates.editor.insertField',
    previewHeading: 'commTemplates.editor.previewHeading',
    smsLengthWarning: 'commTemplates.editor.smsLengthWarning',
    mediaSlotHint: 'commTemplates.editor.mediaSlotHint',
    unknownFieldWarning: 'commTemplates.editor.unknownFieldWarning',
    save: 'commTemplates.editor.save',
    markActive: 'commTemplates.editor.markActive',
    markDraft: 'commTemplates.editor.markDraft',
    versionHistory: 'commTemplates.editor.versionHistory',
    versionRow: 'commTemplates.editor.versionRow',
    revert: 'commTemplates.editor.revert',
    concurrentEditWarning: 'commTemplates.editor.concurrentEditWarning',
  },
  mergeField: {
    customerName: 'commTemplates.mergeField.customerName',
    buildingName: 'commTemplates.mergeField.buildingName',
    quoteAmount: 'commTemplates.mergeField.quoteAmount',
    installStep: 'commTemplates.mergeField.installStep',
    visitDate: 'commTemplates.mergeField.visitDate',
  },
  toast: {
    saved: 'commTemplates.toast.saved',
    statusChanged: 'commTemplates.toast.statusChanged',
    error: 'commTemplates.toast.error',
  },

  quickLinks: {
    heading: 'commTemplates.quickLinks.heading',
    sequences: 'commTemplates.quickLinks.sequences',
    whatsapp: 'commTemplates.quickLinks.whatsapp',
    calls: 'commTemplates.quickLinks.calls',
    broadcast: 'commTemplates.quickLinks.broadcast',
    bot: 'commTemplates.quickLinks.bot',
    inbox: 'commTemplates.quickLinks.inbox',
    optOuts: 'commTemplates.quickLinks.optOuts',
    triggerRules: 'commTemplates.quickLinks.triggerRules',
    analytics: 'commTemplates.quickLinks.analytics',
  },
} as const;
