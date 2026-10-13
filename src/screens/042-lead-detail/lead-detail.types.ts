/** Screen 042 — Lead Detail / Timeline. Types and translation keys only. */

import type { LeadStage } from '@/data/types';

export type LeadDetailStatus = 'loading' | 'ready' | 'not_found' | 'error';

export const TIMELINE_COLLAPSE_THRESHOLD = 6;

export const NEXT_STAGE: Partial<Record<LeadStage, LeadStage>> = {
  captured: 'contacted',
  contacted: 'site_visit',
  site_visit: 'quoted',
  quoted: 'negotiation',
  negotiation: 'won',
};

/** 'lost' is deliberately excluded — disqualifying a lead needs the fixed
 *  reason taxonomy from screen 049, not a silent, reason-less stage flip. */
export const STAGE_SHEET_OPTIONS: LeadStage[] = [
  'captured',
  'contacted',
  'site_visit',
  'quoted',
  'negotiation',
  'won',
];

export const LEAD_DETAIL_KEYS = {
  loading: 'leadDetail.loading',
  notFound: { title: 'leadDetail.notFound.title', body: 'leadDetail.notFound.body' },
  error: { title: 'leadDetail.error.title', body: 'leadDetail.error.body' },

  section: {
    overview: 'leadDetail.section.overview',
    contact: 'leadDetail.section.contact',
    spec: 'leadDetail.section.spec',
    deal: 'leadDetail.section.deal',
    timeline: 'leadDetail.section.timeline',
  },
  unassigned: 'leadDetail.unassigned',
  owner: 'leadDetail.owner',
  capturedBy: 'leadDetail.capturedBy',
  source: 'leadDetail.source',
  estimatedValue: 'leadDetail.estimatedValue',
  incentive: 'leadDetail.incentive',
  contactName: 'leadDetail.contactName',
  contactPhone: 'leadDetail.contactPhone',
  address: 'leadDetail.address',
  spec: {
    buildingType: 'leadDetail.spec.buildingType',
    floors: 'leadDetail.spec.floors',
    capacity: 'leadDetail.spec.capacity',
    constructionStage: 'leadDetail.spec.constructionStage',
    none: 'leadDetail.spec.none',
  },
  deal: {
    none: 'leadDetail.deal.none',
    quoted: 'leadDetail.deal.quoted',
    agreed: 'leadDetail.deal.agreed',
    status: 'leadDetail.deal.status',
  },
  lostBanner: {
    title: 'leadDetail.lostBanner.title',
    reopen: 'leadDetail.lostBanner.reopen',
  },
  duplicateBanner: 'leadDetail.duplicateBanner',

  actions: {
    changeStage: 'leadDetail.actions.changeStage',
    addNote: 'leadDetail.actions.addNote',
    scheduleFollowUp: 'leadDetail.actions.scheduleFollowUp',
    sendMessage: 'leadDetail.actions.sendMessage',
    markLost: 'leadDetail.actions.markLost',
  },
  stageSheet: {
    title: 'leadDetail.stageSheet.title',
    label: 'leadDetail.stageSheet.label',
    blockedQuoted: 'leadDetail.stageSheet.blockedQuoted',
    blockedWon: 'leadDetail.stageSheet.blockedWon',
    confirm: 'leadDetail.stageSheet.confirm',
  },
  noteSheet: {
    title: 'leadDetail.noteSheet.title',
    placeholder: 'leadDetail.noteSheet.placeholder',
    confirm: 'leadDetail.noteSheet.confirm',
  },
  followUpSheet: {
    title: 'leadDetail.followUpSheet.title',
    titleLabel: 'leadDetail.followUpSheet.titleLabel',
    titlePlaceholder: 'leadDetail.followUpSheet.titlePlaceholder',
    dueLabel: 'leadDetail.followUpSheet.dueLabel',
    assigneeLabel: 'leadDetail.followUpSheet.assigneeLabel',
    confirm: 'leadDetail.followUpSheet.confirm',
  },
  messageSheet: {
    title: 'leadDetail.messageSheet.title',
    placeholder: 'leadDetail.messageSheet.placeholder',
    disclaimer: 'leadDetail.messageSheet.disclaimer',
    confirm: 'leadDetail.messageSheet.confirm',
  },

  timeline: {
    showEarlier: 'leadDetail.timeline.showEarlier',
    empty: 'leadDetail.timeline.empty',
    captured: 'leadDetail.timeline.captured',
    stageChanged: 'leadDetail.timeline.stageChanged',
    noteAdded: 'leadDetail.timeline.noteAdded',
    assigned: 'leadDetail.timeline.assigned',
    reassigned: 'leadDetail.timeline.reassigned',
    communicationSent: 'leadDetail.timeline.communicationSent',
    communicationFailed: 'leadDetail.timeline.communicationFailed',
    quoteCreated: 'leadDetail.timeline.quoteCreated',
    quoteChangeRequested: 'leadDetail.timeline.quoteChangeRequested',
    taskCompleted: 'leadDetail.timeline.taskCompleted',
    merged: 'leadDetail.timeline.merged',
    markedLost: 'leadDetail.timeline.markedLost',
    reopened: 'leadDetail.timeline.reopened',
  },
} as const;
