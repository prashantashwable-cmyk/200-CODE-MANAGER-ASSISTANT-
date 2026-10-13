/** Screen 054 — Call Log / Auto-Dialer. Types and translation keys only. */

import type { CallOutcome } from '@/data/types';

export type CallLogStatus = 'loading' | 'ready' | 'error';

export const DISPOSITION_OPTIONS: CallOutcome[] = ['connected_interested', 'connected_not_interested', 'no_answer', 'wrong_number', 'pocket_dial'];

/** Consecutive true no-answers (pocket dials don't count) before suggesting
 *  a channel switch instead of another redial. */
export const NO_ANSWER_SWITCH_THRESHOLD = 3;
/** How long an undispositioned call can sit before nudging the agent. */
export const DISPOSITION_REMINDER_HOURS = 1;

export const CALL_LOG_KEYS = {
  title: 'callLog.title',
  subtitle: 'callLog.subtitle',
  loading: 'callLog.loading',
  error: { title: 'callLog.error.title', body: 'callLog.error.body' },
  empty: { title: 'callLog.empty.title', body: 'callLog.empty.body' },

  callSection: {
    heading: 'callLog.callSection.heading',
    pickLead: 'callLog.callSection.pickLead',
    callNow: 'callLog.callSection.callNow',
    logManually: 'callLog.callSection.logManually',
  },
  manualSheet: {
    title: 'callLog.manualSheet.title',
    outcomeLabel: 'callLog.manualSheet.outcomeLabel',
    durationLabel: 'callLog.manualSheet.durationLabel',
    consentLabel: 'callLog.manualSheet.consentLabel',
    confirm: 'callLog.manualSheet.confirm',
  },

  outcome: {
    connected_interested: 'callLog.outcome.connected_interested',
    connected_not_interested: 'callLog.outcome.connected_not_interested',
    no_answer: 'callLog.outcome.no_answer',
    wrong_number: 'callLog.outcome.wrong_number',
    pocket_dial: 'callLog.outcome.pocket_dial',
  },
  needsDisposition: 'callLog.needsDisposition',
  dispositionReminder: 'callLog.dispositionReminder',
  switchChannelSuggestion: 'callLog.switchChannelSuggestion',
  durationLabel: 'callLog.durationLabel',
  loggedByManual: 'callLog.loggedByManual',
  dispositionPrompt: 'callLog.dispositionPrompt',

  toast: {
    logged: 'callLog.toast.logged',
    dispositioned: 'callLog.toast.dispositioned',
    error: 'callLog.toast.error',
  },
} as const;
