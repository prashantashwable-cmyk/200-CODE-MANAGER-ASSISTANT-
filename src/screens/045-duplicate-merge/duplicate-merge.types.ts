/** Screen 045 — Duplicate Lead Merge/Resolution. Types and translation keys only. */

export type DuplicateMergeStatus = 'loading' | 'ready' | 'error';

export const DUPLICATE_MERGE_KEYS = {
  title: 'duplicateMerge.title',
  subtitle: 'duplicateMerge.subtitle',
  loading: 'duplicateMerge.loading',
  error: { title: 'duplicateMerge.error.title', body: 'duplicateMerge.error.body' },
  empty: { title: 'duplicateMerge.empty.title', body: 'duplicateMerge.empty.body' },

  queueHeading: 'duplicateMerge.queueHeading',
  detectedAgo: 'duplicateMerge.detectedAgo',

  compare: {
    capturedBy: 'duplicateMerge.compare.capturedBy',
    capturedAt: 'duplicateMerge.compare.capturedAt',
    stage: 'duplicateMerge.compare.stage',
    contact: 'duplicateMerge.compare.contact',
    value: 'duplicateMerge.compare.value',
    distance: 'duplicateMerge.compare.distance',
    keepThis: 'duplicateMerge.compare.keepThis',
    primaryTag: 'duplicateMerge.compare.primaryTag',
  },
  impact: {
    heading: 'duplicateMerge.impact.heading',
    summary: 'duplicateMerge.impact.summary',
  },
  actions: {
    merge: 'duplicateMerge.actions.merge',
    notDuplicate: 'duplicateMerge.actions.notDuplicate',
  },
  toast: {
    merged: 'duplicateMerge.toast.merged',
    notDuplicate: 'duplicateMerge.toast.notDuplicate',
    error: 'duplicateMerge.toast.error',
  },
} as const;
