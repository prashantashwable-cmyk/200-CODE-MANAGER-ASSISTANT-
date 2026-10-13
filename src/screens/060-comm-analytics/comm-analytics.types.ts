/** Screen 060 — Communication Analytics. Types and translation keys only. */

export type CommAnalyticsStatus = 'loading' | 'ready' | 'error';

/** A non-early-data template below this response rate is flagged for review. */
export const POOR_PERFORMER_THRESHOLD_PCT = 0.2;

export const COMM_ANALYTICS_KEYS = {
  title: 'commAnalytics.title',
  subtitle: 'commAnalytics.subtitle',
  loading: 'commAnalytics.loading',
  error: { title: 'commAnalytics.error.title', body: 'commAnalytics.error.body' },
  empty: { title: 'commAnalytics.empty.title', body: 'commAnalytics.empty.body' },

  kpi: {
    totalSent: 'commAnalytics.kpi.totalSent',
    responseRate: 'commAnalytics.kpi.responseRate',
    slaCompliance: 'commAnalytics.kpi.slaCompliance',
    totalCost: 'commAnalytics.kpi.totalCost',
  },

  outageNote: 'commAnalytics.outageNote',

  channelHeading: 'commAnalytics.channelHeading',
  channelSent: 'commAnalytics.channelSent',
  channelResponseRate: 'commAnalytics.channelResponseRate',
  channelCost: 'commAnalytics.channelCost',

  volumeHeading: 'commAnalytics.volumeHeading',
  volumeSubtitle: 'commAnalytics.volumeSubtitle',

  templateHeading: 'commAnalytics.templateHeading',
  templateSubtitle: 'commAnalytics.templateSubtitle',
  averageLabel: 'commAnalytics.averageLabel',
  medianLabel: 'commAnalytics.medianLabel',
  earlyDataBadge: 'commAnalytics.earlyDataBadge',
  sentCount: 'commAnalytics.sentCount',
  conversionInfluence: 'commAnalytics.conversionInfluence',
  poorPerformerWarning: 'commAnalytics.poorPerformerWarning',
} as const;
