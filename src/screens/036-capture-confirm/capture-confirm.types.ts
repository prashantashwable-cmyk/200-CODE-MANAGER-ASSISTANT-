/** Screen 036 — Lead Submission Confirmation & Incentive Preview. Types and keys. */

export type SubmitStatus = 'idle' | 'submitting' | 'queuedOffline' | 'success' | 'error';

/** The starting (version 1) figures of the commission rules (161): the screen reads the rates in force, and uses these only until they have loaded. */
/** Base capture bonus, floored — paid the instant the lead is accepted. */
export const BASE_CAPTURE_BONUS = 500;
/** Rate applied to estimated deal value for the conversion bonus preview. */
export const CONVERSION_BONUS_RATE = 0.015;
export const CONVERSION_BONUS_FLOOR = 5_000;

/** A rough per-floor, per-person INR estimate — a starting point only, the
 *  same role the Auto-Quotation Engine will refine later. */
export function estimateLeadValue(floors: number, capacityPersons: number): number {
  const base = 900_000;
  const perFloor = 140_000;
  const perPerson = 45_000;
  return Math.round(base + floors * perFloor + capacityPersons * perPerson);
}

export const CAPTURE_CONFIRM_KEYS = {
  title: 'captureConfirm.title',
  subtitle: 'captureConfirm.subtitle',
  summary: {
    heading: 'captureConfirm.summary.heading',
    location: 'captureConfirm.summary.location',
    photos: 'captureConfirm.summary.photos',
    contact: 'captureConfirm.summary.contact',
    building: 'captureConfirm.summary.building',
    edit: 'captureConfirm.summary.edit',
    flaggedNote: 'captureConfirm.summary.flaggedNote',
  },
  incentive: {
    heading: 'captureConfirm.incentive.heading',
    base: 'captureConfirm.incentive.base',
    baseNote: 'captureConfirm.incentive.baseNote',
    conversion: 'captureConfirm.incentive.conversion',
    conversionNote: 'captureConfirm.incentive.conversionNote',
    estimateNote: 'captureConfirm.incentive.estimateNote',
  },
  submit: 'captureConfirm.submit',
  submitting: 'captureConfirm.submitting',
  offlineQueued: {
    title: 'captureConfirm.offlineQueued.title',
    body: 'captureConfirm.offlineQueued.body',
  },
  success: {
    title: 'captureConfirm.success.title',
    body: 'captureConfirm.success.body',
    code: 'captureConfirm.success.code',
    captureAnother: 'captureConfirm.success.captureAnother',
    backHome: 'captureConfirm.success.backHome',
    milestone: {
      captured: 'captureConfirm.success.milestone.captured',
      locked: 'captureConfirm.success.milestone.locked',
      pipeline: 'captureConfirm.success.milestone.pipeline',
    },
  },
  error: {
    title: 'captureConfirm.error.title',
    body: 'captureConfirm.error.body',
    retry: 'captureConfirm.error.retry',
  },
} as const;
