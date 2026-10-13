/** Screen 037 — My Leads History. Types and translation keys only. */

import type { Lead, LeadStage } from '@/data/types';

export type MyLeadsStatus = 'loading' | 'ready' | 'empty' | 'error';

export const FILTERABLE_STAGES: LeadStage[] = [
  'captured',
  'contacted',
  'site_visit',
  'quoted',
  'negotiation',
  'won',
  'lost',
];

export interface MyLeadsSummary {
  total: number;
  won: number;
  lost: number;
  /** Computed identically to the admin-facing conversion screen (won / closed),
   *  just scoped to this one surveyor, so the two numbers can never disagree. */
  conversionRate: number;
}

export const PAGE_SIZE = 20;

export const MY_LEADS_KEYS = {
  title: 'myLeads.title',
  subtitle: 'myLeads.subtitle',
  loading: 'myLeads.loading',
  searchPlaceholder: 'myLeads.searchPlaceholder',
  summary: {
    total: 'myLeads.summary.total',
    won: 'myLeads.summary.won',
    conversion: 'myLeads.summary.conversion',
    matchesNote: 'myLeads.summary.matchesNote',
  },
  loadMore: 'myLeads.loadMore',
  allLoaded: 'myLeads.allLoaded',
  daysInStage: 'myLeads.daysInStage',
  readOnlyNote: 'myLeads.readOnlyNote',
  empty: { title: 'myLeads.empty.title', body: 'myLeads.empty.body' },
  noResults: { title: 'myLeads.noResults.title', body: 'myLeads.noResults.body' },
  error: { title: 'myLeads.error.title', body: 'myLeads.error.body' },
  detail: {
    title: 'myLeads.detail.title',
    stageHistory: 'myLeads.detail.stageHistory',
    estimatedValue: 'myLeads.detail.estimatedValue',
    incentive: 'myLeads.detail.incentive',
    contact: 'myLeads.detail.contact',
    lostReason: 'myLeads.detail.lostReason',
  },
} as const;
