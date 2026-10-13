/** Screen 080 — Deal Won: Celebration & Next Steps Screen. Types and translation keys only. */

export type DealWonCelebrationStatus = 'loading' | 'ready' | 'error';

export const DEAL_WON_CELEBRATION_KEYS = {
  title: 'dealWonCelebration.title',
  loading: 'dealWonCelebration.loading',
  error: { title: 'dealWonCelebration.error.title', body: 'dealWonCelebration.error.body' },
  notReady: { title: 'dealWonCelebration.notReady.title', body: 'dealWonCelebration.notReady.body' },

  hero: {
    heading: 'dealWonCelebration.hero.heading',
    subheading: 'dealWonCelebration.hero.subheading',
    dealValue: 'dealWonCelebration.hero.dealValue',
  },

  staff: {
    heading: 'dealWonCelebration.staff.heading',
    roleOriginal: 'dealWonCelebration.staff.roleOriginal',
    roleCurrent: 'dealWonCelebration.staff.roleCurrent',
    total: 'dealWonCelebration.staff.total',
    noEntries: 'dealWonCelebration.staff.noEntries',
    reasonLine: 'dealWonCelebration.staff.reasonLine',
  },

  nextSteps: {
    heading: 'dealWonCelebration.nextSteps.heading',
    viewClosure: 'dealWonCelebration.nextSteps.viewClosure',
    viewClosureBody: 'dealWonCelebration.nextSteps.viewClosureBody',
  },

  feedback: {
    heading: 'dealWonCelebration.feedback.heading',
    prompt: 'dealWonCelebration.feedback.prompt',
    placeholder: 'dealWonCelebration.feedback.placeholder',
    submitted: 'dealWonCelebration.feedback.submitted',
  },

  internalNote: {
    heading: 'dealWonCelebration.internalNote.heading',
  },

  acknowledged: {
    banner: 'dealWonCelebration.acknowledged.banner',
    by: 'dealWonCelebration.acknowledged.by',
  },

  actionBar: {
    acknowledge: 'dealWonCelebration.actionBar.acknowledge',
  },

  toast: {
    acknowledged: 'dealWonCelebration.toast.acknowledged',
    error: 'dealWonCelebration.toast.error',
  },
} as const;
