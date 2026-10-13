/** Screen 052 — Automated Sequence Builder. Types and translation keys only. */

import type { LeadStage, SequenceBranch } from '@/data/types';

export type SequenceBuilderStatus = 'loading' | 'ready' | 'error';
export type WizardStep = 'basics' | 'steps' | 'test' | 'review';

export const WIZARD_STEPS: WizardStep[] = ['basics', 'steps', 'test', 'review'];

export const TRIGGER_STAGES: LeadStage[] = ['captured', 'contacted', 'site_visit', 'quoted', 'negotiation', 'won'];

export const BRANCH_OPTIONS: SequenceBranch[] = ['always', 'no_response', 'positive_response', 'negative_response'];

export const SEQUENCE_BUILDER_KEYS = {
  title: 'sequenceBuilder.title',
  subtitle: 'sequenceBuilder.subtitle',
  loading: 'sequenceBuilder.loading',
  error: { title: 'sequenceBuilder.error.title', body: 'sequenceBuilder.error.body' },
  empty: { title: 'sequenceBuilder.empty.title', body: 'sequenceBuilder.empty.body' },
  newSequence: 'sequenceBuilder.newSequence',

  list: {
    triggerLabel: 'sequenceBuilder.list.triggerLabel',
    stepCount: 'sequenceBuilder.list.stepCount',
    active: 'sequenceBuilder.list.active',
    paused: 'sequenceBuilder.list.paused',
  },

  wizard: {
    step: {
      basics: 'sequenceBuilder.wizard.step.basics',
      steps: 'sequenceBuilder.wizard.step.steps',
      test: 'sequenceBuilder.wizard.step.test',
      review: 'sequenceBuilder.wizard.step.review',
    },
    back: 'sequenceBuilder.wizard.back',
    next: 'sequenceBuilder.wizard.next',
    finish: 'sequenceBuilder.wizard.finish',
  },

  basics: {
    nameLabel: 'sequenceBuilder.basics.nameLabel',
    namePlaceholder: 'sequenceBuilder.basics.namePlaceholder',
    triggerLabel: 'sequenceBuilder.basics.triggerLabel',
    maxNudgesLabel: 'sequenceBuilder.basics.maxNudgesLabel',
    maxNudgesHint: 'sequenceBuilder.basics.maxNudgesHint',
    priorityLabel: 'sequenceBuilder.basics.priorityLabel',
    restartLabel: 'sequenceBuilder.basics.restartLabel',
    restartHint: 'sequenceBuilder.basics.restartHint',
  },

  steps: {
    heading: 'sequenceBuilder.steps.heading',
    body: 'sequenceBuilder.steps.body',
    stepLabel: 'sequenceBuilder.steps.stepLabel',
    waitLabel: 'sequenceBuilder.steps.waitLabel',
    templateLabel: 'sequenceBuilder.steps.templateLabel',
    branchLabel: 'sequenceBuilder.steps.branchLabel',
    addStep: 'sequenceBuilder.steps.addStep',
    removeStep: 'sequenceBuilder.steps.removeStep',
    moveUp: 'sequenceBuilder.steps.moveUp',
    moveDown: 'sequenceBuilder.steps.moveDown',
    noSteps: 'sequenceBuilder.steps.noSteps',
  },
  branch: {
    always: 'sequenceBuilder.branch.always',
    no_response: 'sequenceBuilder.branch.no_response',
    positive_response: 'sequenceBuilder.branch.positive_response',
    negative_response: 'sequenceBuilder.branch.negative_response',
  },

  test: {
    heading: 'sequenceBuilder.test.heading',
    body: 'sequenceBuilder.test.body',
    pickLead: 'sequenceBuilder.test.pickLead',
    run: 'sequenceBuilder.test.run',
    resultHeading: 'sequenceBuilder.test.resultHeading',
    dueOn: 'sequenceBuilder.test.dueOn',
    immediately: 'sequenceBuilder.test.immediately',
    disclaimer: 'sequenceBuilder.test.disclaimer',
  },

  review: {
    heading: 'sequenceBuilder.review.heading',
    trigger: 'sequenceBuilder.review.trigger',
    maxNudges: 'sequenceBuilder.review.maxNudges',
    priority: 'sequenceBuilder.review.priority',
    restart: 'sequenceBuilder.review.restart',
    stepCount: 'sequenceBuilder.review.stepCount',
    activateNow: 'sequenceBuilder.review.activateNow',
    yes: 'sequenceBuilder.review.yes',
    no: 'sequenceBuilder.review.no',
  },

  pauseToggle: 'sequenceBuilder.pauseToggle',
  resumeToggle: 'sequenceBuilder.resumeToggle',
  toast: {
    saved: 'sequenceBuilder.toast.saved',
    toggled: 'sequenceBuilder.toast.toggled',
    error: 'sequenceBuilder.toast.error',
  },
} as const;
