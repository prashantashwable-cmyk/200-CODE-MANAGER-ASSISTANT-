/** Screen 041 — Lead Inbox / Master List. Types and translation keys only. */

import type { LeadSource, LeadStage } from '@/data/types';

export type LeadInboxStatus = 'loading' | 'ready' | 'error';

export const FILTERABLE_STAGES: LeadStage[] = [
  'captured',
  'contacted',
  'site_visit',
  'quoted',
  'negotiation',
  'won',
  'lost',
];

export const FILTERABLE_SOURCES: LeadSource[] = [
  'field_survey',
  'referral_repeat',
  'inbound_website',
  'inbound_whatsapp',
  'bulk_import',
];

export type DateRangeFilter = 'all' | 'today' | 'week' | 'month';

export interface LeadInboxSummary {
  total: number;
  unassigned: number;
  totalValue: number;
}

export const PAGE_SIZE = 25;

export const LEAD_INBOX_KEYS = {
  title: 'leadInbox.title',
  subtitle: 'leadInbox.subtitle',
  loading: 'leadInbox.loading',
  searchPlaceholder: 'leadInbox.searchPlaceholder',
  summary: {
    total: 'leadInbox.summary.total',
    unassigned: 'leadInbox.summary.unassigned',
    totalValue: 'leadInbox.summary.totalValue',
  },
  filters: {
    stage: 'leadInbox.filters.stage',
    source: 'leadInbox.filters.source',
    city: 'leadInbox.filters.city',
    date: 'leadInbox.filters.date',
    allCities: 'leadInbox.filters.allCities',
    clear: 'leadInbox.filters.clear',
    date_all: 'leadInbox.filters.dateAll',
    date_today: 'leadInbox.filters.dateToday',
    date_week: 'leadInbox.filters.dateWeek',
    date_month: 'leadInbox.filters.dateMonth',
  },
  unassignedBadge: 'leadInbox.unassignedBadge',
  daysStale: 'leadInbox.daysStale',
  selectRow: 'leadInbox.selectRow',
  bulkBar: {
    selectedCount: 'leadInbox.bulkBar.selectedCount',
    reassign: 'leadInbox.bulkBar.reassign',
    markLost: 'leadInbox.bulkBar.markLost',
    export: 'leadInbox.bulkBar.export',
    clear: 'leadInbox.bulkBar.clear',
  },
  reassignSheet: {
    title: 'leadInbox.reassignSheet.title',
    assigneeLabel: 'leadInbox.reassignSheet.assigneeLabel',
    reasonLabel: 'leadInbox.reassignSheet.reasonLabel',
    reasonHint: 'leadInbox.reassignSheet.reasonHint',
    confirm: 'leadInbox.reassignSheet.confirm',
  },
  markLostSheet: {
    title: 'leadInbox.markLostSheet.title',
    reasonLabel: 'leadInbox.markLostSheet.reasonLabel',
    confirm: 'leadInbox.markLostSheet.confirm',
  },
  quickView: {
    title: 'leadInbox.quickView.title',
    openFull: 'leadInbox.quickView.openFull',
    estimatedValue: 'leadInbox.quickView.estimatedValue',
    contact: 'leadInbox.quickView.contact',
    owner: 'leadInbox.quickView.owner',
    source: 'leadInbox.quickView.source',
    daysInStage: 'leadInbox.quickView.daysInStage',
  },
  quickLinks: {
    heading: 'leadInbox.quickLinks.heading',
    pipeline: 'leadInbox.quickLinks.pipeline',
    assignment: 'leadInbox.quickLinks.assignment',
    duplicates: 'leadInbox.quickLinks.duplicates',
    scoring: 'leadInbox.quickLinks.scoring',
    followUps: 'leadInbox.quickLinks.followUps',
    attribution: 'leadInbox.quickLinks.attribution',
    importExport: 'leadInbox.quickLinks.importExport',
  },
  loadMore: 'leadInbox.loadMore',
  allLoaded: 'leadInbox.allLoaded',
  empty: { title: 'leadInbox.empty.title', body: 'leadInbox.empty.body' },
  noResults: { title: 'leadInbox.noResults.title', body: 'leadInbox.noResults.body' },
  error: { title: 'leadInbox.error.title', body: 'leadInbox.error.body' },
  toast: {
    reassigned: 'leadInbox.toast.reassigned',
    markedLost: 'leadInbox.toast.markedLost',
    exported: 'leadInbox.toast.exported',
  },
} as const;
