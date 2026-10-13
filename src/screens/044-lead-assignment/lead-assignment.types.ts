/** Screen 044 — Lead Assignment & Reassignment. Types and translation keys only. */

export type LeadAssignmentStatus = 'loading' | 'ready' | 'error';

export interface Suggestion {
  userId: string;
  name: string;
  reasonKey: string;
}

export const LEAD_ASSIGNMENT_KEYS = {
  title: 'leadAssignment.title',
  subtitle: 'leadAssignment.subtitle',
  loading: 'leadAssignment.loading',
  error: { title: 'leadAssignment.error.title', body: 'leadAssignment.error.body' },

  queue: {
    heading: 'leadAssignment.queue.heading',
    empty: 'leadAssignment.queue.empty',
    suggested: 'leadAssignment.queue.suggested',
    suggestedTag: 'leadAssignment.queue.suggestedTag',
    noSuggestion: 'leadAssignment.queue.noSuggestion',
    waitingDays: 'leadAssignment.queue.waitingDays',
  },
  assignSheet: {
    title: 'leadAssignment.assignSheet.title',
    assigneeLabel: 'leadAssignment.assignSheet.assigneeLabel',
    reasonLabel: 'leadAssignment.assignSheet.reasonLabel',
    reasonHint: 'leadAssignment.assignSheet.reasonHint',
    confirm: 'leadAssignment.assignSheet.confirm',
  },

  redistribute: {
    heading: 'leadAssignment.redistribute.heading',
    body: 'leadAssignment.redistribute.body',
    fromLabel: 'leadAssignment.redistribute.fromLabel',
    fromPlaceholder: 'leadAssignment.redistribute.fromPlaceholder',
    none: 'leadAssignment.redistribute.none',
    selectedCount: 'leadAssignment.redistribute.selectedCount',
    selectAll: 'leadAssignment.redistribute.selectAll',
    clear: 'leadAssignment.redistribute.clear',
    reassignButton: 'leadAssignment.redistribute.reassignButton',
  },
  bulkSheet: {
    title: 'leadAssignment.bulkSheet.title',
    previewHeading: 'leadAssignment.bulkSheet.previewHeading',
    assigneeLabel: 'leadAssignment.bulkSheet.assigneeLabel',
    reasonLabel: 'leadAssignment.bulkSheet.reasonLabel',
    confirm: 'leadAssignment.bulkSheet.confirm',
  },

  toast: {
    assigned: 'leadAssignment.toast.assigned',
    bulkAssigned: 'leadAssignment.toast.bulkAssigned',
    ineligible: 'leadAssignment.toast.ineligible',
  },
} as const;
