/** Screen 107 — Delivery SOP Checklist. Types and translation keys only. */

export type DeliverySopStatus = 'loading' | 'ready' | 'error';

export type PreviewLanguage = 'en' | 'hi' | 'mr';
export const PREVIEW_LANGUAGES: PreviewLanguage[] = ['en', 'hi', 'mr'];

/** A step being edited. `id` is set for a step that already exists, so older results keep lining up with it. */
export interface DraftStep {
  key: string;
  id?: string;
  label: string;
  labelHi: string;
  labelMr: string;
  hint: string;
  hintHi: string;
  hintMr: string;
  mandatory: boolean;
  needsPhoto: boolean;
}

export const DELIVERY_SOP_KEYS = {
  title: 'deliverySop.title',
  subtitle: 'deliverySop.subtitle',
  loading: 'deliverySop.loading',
  error: { title: 'deliverySop.error.title', body: 'deliverySop.error.body' },
  templates: {
    label: 'deliverySop.templates.label',
    master: 'deliverySop.templates.master',
    masterHint: 'deliverySop.templates.masterHint',
    add: 'deliverySop.templates.add',
    categoryHint: 'deliverySop.templates.categoryHint',
  },
  status: {
    active: 'deliverySop.status.active',
    scheduled: 'deliverySop.status.scheduled',
    retired: 'deliverySop.status.retired',
  },
  current: {
    heading: 'deliverySop.current.heading',
    version: 'deliverySop.current.version',
    since: 'deliverySop.current.since',
    none: 'deliverySop.current.none',
    noneBody: 'deliverySop.current.noneBody',
    amend: 'deliverySop.current.amend',
    steps: 'deliverySop.current.steps',
    inFlight: 'deliverySop.current.inFlight',
    scheduledNote: 'deliverySop.current.scheduledNote',
    coreNote: 'deliverySop.current.coreNote',
  },
  step: {
    mandatory: 'deliverySop.step.mandatory',
    optional: 'deliverySop.step.optional',
    photo: 'deliverySop.step.photo',
    fromMaster: 'deliverySop.step.fromMaster',
  },
  history: {
    heading: 'deliverySop.history.heading',
    intro: 'deliverySop.history.intro',
    effective: 'deliverySop.history.effective',
    by: 'deliverySop.history.by',
    show: 'deliverySop.history.show',
    hide: 'deliverySop.history.hide',
    view: 'deliverySop.history.view',
  },
  preview: {
    heading: 'deliverySop.preview.heading',
    intro: 'deliverySop.preview.intro',
    version: 'deliverySop.preview.version',
    language: 'deliverySop.preview.language',
    samplePart: 'deliverySop.preview.samplePart',
    core: 'deliverySop.preview.core',
    empty: 'deliverySop.preview.empty',
    notInForce: 'deliverySop.preview.notInForce',
  },
  editor: {
    titleAmend: 'deliverySop.editor.titleAmend',
    titleNew: 'deliverySop.editor.titleNew',
    intro: 'deliverySop.editor.intro',
    category: 'deliverySop.editor.category',
    categoryPick: 'deliverySop.editor.categoryPick',
    categoryOther: 'deliverySop.editor.categoryOther',
    categoryOtherHint: 'deliverySop.editor.categoryOtherHint',
    stepsHeading: 'deliverySop.editor.stepsHeading',
    stepN: 'deliverySop.editor.stepN',
    label: 'deliverySop.editor.label',
    hint: 'deliverySop.editor.hint',
    translations: 'deliverySop.editor.translations',
    labelHi: 'deliverySop.editor.labelHi',
    labelMr: 'deliverySop.editor.labelMr',
    hintHi: 'deliverySop.editor.hintHi',
    hintMr: 'deliverySop.editor.hintMr',
    mandatory: 'deliverySop.editor.mandatory',
    needsPhoto: 'deliverySop.editor.needsPhoto',
    up: 'deliverySop.editor.up',
    down: 'deliverySop.editor.down',
    remove: 'deliverySop.editor.remove',
    addStep: 'deliverySop.editor.addStep',
    effective: 'deliverySop.editor.effective',
    effectiveHint: 'deliverySop.editor.effectiveHint',
    changeNote: 'deliverySop.editor.changeNote',
    changeNoteHint: 'deliverySop.editor.changeNoteHint',
    publish: 'deliverySop.editor.publish',
    publishFirst: 'deliverySop.editor.publishFirst',
    noSteps: 'deliverySop.editor.noSteps',
    unchanged: 'deliverySop.editor.unchanged',
    issue: {
      label_short: 'deliverySop.editor.issue.label_short',
      duplicate_label: 'deliverySop.editor.issue.duplicate_label',
      no_steps: 'deliverySop.editor.issue.no_steps',
    },
  },
  toast: { published: 'deliverySop.toast.published' },
  problem: {
    forbidden: 'deliverySop.problem.forbidden',
    not_found: 'deliverySop.problem.not_found',
    note_required: 'deliverySop.problem.note_required',
    invalid_steps: 'deliverySop.problem.invalid_steps',
    effective_in_past: 'deliverySop.problem.effective_in_past',
    effective_before_previous: 'deliverySop.problem.effective_before_previous',
    invalid_category: 'deliverySop.problem.invalid_category',
    generic: 'deliverySop.problem.generic',
  },
} as const;
