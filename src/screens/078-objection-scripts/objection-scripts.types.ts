/** Screen 078 — Customer Objection/Concern Handling Script Screen. Types and translation keys only. */

import type { ObjectionCategory } from '@/data/types';

export type ObjectionScriptsStatus = 'loading' | 'ready' | 'error';

export type ObjectionStatusFilter = 'approved' | 'suggested' | 'archived';

export const STATUS_TABS: ObjectionStatusFilter[] = ['approved', 'suggested', 'archived'];

export const OBJECTION_CATEGORIES: ObjectionCategory[] = [
  'safety_new_brand',
  'installation_disruption',
  'timeline_worry',
  'competitor_comparison',
  'price_too_high',
  'wants_to_delay',
  'other',
];

/** Below this many recorded uses, an effectiveness score is more noise than
 *  signal — mirrors screen 060's own early-data threshold. */
export const EARLY_DATA_THRESHOLD = 3;

/** Horizontal drag distance, in px, that reveals the swipe-to-copy action. */
export const SWIPE_REVEAL_PX = 72;

export const OBJECTION_SCRIPTS_KEYS = {
  title: 'objectionScripts.title',
  subtitle: 'objectionScripts.subtitle',
  loading: 'objectionScripts.loading',
  error: { title: 'objectionScripts.error.title', body: 'objectionScripts.error.body' },
  empty: { title: 'objectionScripts.empty.title', body: 'objectionScripts.empty.body' },
  noResults: { title: 'objectionScripts.noResults.title', body: 'objectionScripts.noResults.body' },
  searchPlaceholder: 'objectionScripts.searchPlaceholder',

  statusTab: {
    approved: 'objectionScripts.statusTab.approved',
    suggested: 'objectionScripts.statusTab.suggested',
    archived: 'objectionScripts.statusTab.archived',
  },

  category: {
    safety_new_brand: 'objectionScripts.category.safety_new_brand',
    installation_disruption: 'objectionScripts.category.installation_disruption',
    timeline_worry: 'objectionScripts.category.timeline_worry',
    competitor_comparison: 'objectionScripts.category.competitor_comparison',
    price_too_high: 'objectionScripts.category.price_too_high',
    wants_to_delay: 'objectionScripts.category.wants_to_delay',
    other: 'objectionScripts.category.other',
  },

  effectiveness: {
    score: 'objectionScripts.effectiveness.score',
    earlyData: 'objectionScripts.effectiveness.earlyData',
    noData: 'objectionScripts.effectiveness.noData',
    usageCount: 'objectionScripts.effectiveness.usageCount',
  },

  row: {
    copy: 'objectionScripts.row.copy',
    usedByBot: 'objectionScripts.row.usedByBot',
  },

  detail: {
    citedStandards: 'objectionScripts.detail.citedStandards',
    territoryHeading: 'objectionScripts.detail.territoryHeading',
    territoryRow: 'objectionScripts.detail.territoryRow',
    versionHistoryHeading: 'objectionScripts.detail.versionHistoryHeading',
    versionRow: 'objectionScripts.detail.versionRow',
    sourceNoteLabel: 'objectionScripts.detail.sourceNoteLabel',
    usedByBotBanner: 'objectionScripts.detail.usedByBotBanner',
    goToBotConfig: 'objectionScripts.detail.goToBotConfig',
    copyResponse: 'objectionScripts.detail.copyResponse',
    editResponse: 'objectionScripts.detail.editResponse',
    responseLabel: 'objectionScripts.detail.responseLabel',
    saveEdit: 'objectionScripts.detail.saveEdit',
    approve: 'objectionScripts.detail.approve',
    archive: 'objectionScripts.detail.archive',
    restore: 'objectionScripts.detail.restore',
  },

  addScript: {
    button: 'objectionScripts.addScript.button',
    sheetTitle: 'objectionScripts.addScript.sheetTitle',
    sheetHint: 'objectionScripts.addScript.sheetHint',
    categoryLabel: 'objectionScripts.addScript.categoryLabel',
    responseLabel: 'objectionScripts.addScript.responseLabel',
    sourceNoteLabel: 'objectionScripts.addScript.sourceNoteLabel',
    sourceNoteHint: 'objectionScripts.addScript.sourceNoteHint',
    submit: 'objectionScripts.addScript.submit',
  },

  toast: {
    copied: 'objectionScripts.toast.copied',
    saved: 'objectionScripts.toast.saved',
    approved: 'objectionScripts.toast.approved',
    archived: 'objectionScripts.toast.archived',
    restored: 'objectionScripts.toast.restored',
    created: 'objectionScripts.toast.created',
    error: 'objectionScripts.toast.error',
  },
} as const;
