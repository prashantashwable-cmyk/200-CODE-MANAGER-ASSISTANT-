/** Screen 046 — Lead Scoring & Prioritization. Types and translation keys only. */

export type LeadScoringStatus = 'loading' | 'ready' | 'error';

export const SCORE_FACTOR_KEYS = ['buildingSize', 'constructionReadiness', 'responsiveness', 'territoryHistory'] as const;
export type ScoreFactorKey = (typeof SCORE_FACTOR_KEYS)[number];

/** Large enough a weighting change would visibly reshuffle the pipeline —
 *  mirrors the threshold the repository uses to flag `reshuffleWarning`. */
export const RESHUFFLE_WARNING_THRESHOLD = 0.3;

export const LEAD_SCORING_KEYS = {
  title: 'leadScoring.title',
  subtitle: 'leadScoring.subtitle',
  loading: 'leadScoring.loading',
  error: { title: 'leadScoring.error.title', body: 'leadScoring.error.body' },
  empty: { title: 'leadScoring.empty.title', body: 'leadScoring.empty.body' },

  showBreakdown: 'leadScoring.showBreakdown',
  hideBreakdown: 'leadScoring.hideBreakdown',
  breakdownNote: 'leadScoring.breakdownNote',
  factor: {
    buildingSize: 'leadScoring.factor.buildingSize',
    constructionReadiness: 'leadScoring.factor.constructionReadiness',
    responsiveness: 'leadScoring.factor.responsiveness',
    territoryHistory: 'leadScoring.factor.territoryHistory',
  },

  weighting: {
    heading: 'leadScoring.weighting.heading',
    body: 'leadScoring.weighting.body',
    totalNote: 'leadScoring.weighting.totalNote',
    save: 'leadScoring.weighting.save',
    reset: 'leadScoring.weighting.reset',
    reshuffleWarning: 'leadScoring.weighting.reshuffleWarning',
    confirmApply: 'leadScoring.weighting.confirmApply',
    updatedAt: 'leadScoring.weighting.updatedAt',
  },
  toast: {
    saved: 'leadScoring.toast.saved',
    error: 'leadScoring.toast.error',
  },
} as const;
