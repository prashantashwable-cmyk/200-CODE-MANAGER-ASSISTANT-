import { useTranslation } from 'react-i18next';
import { Area, AreaChart, ResponsiveContainer, XAxis } from 'recharts';
import { Badge, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, formatINRCompact, formatPercent } from '@/design-system';
import { useLeadSourceAttribution } from './useLeadSourceAttribution';
import { LEAD_SOURCE_ATTRIBUTION_KEYS as K, LOW_SAMPLE_THRESHOLD } from './lead-source-attribution.types';

/**
 * Screen 048 — Lead Source & Campaign Attribution. Where to invest
 * incremental acquisition effort — surveyor headcount vs referrals vs
 * inbound — read from the same immutable `source` field every lead was
 * tagged with at capture, never recomputed after the fact.
 */
export function LeadSourceAttributionView() {
  const { t } = useTranslation();
  const s = useLeadSourceAttribution();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  if (s.rows.length === 0) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-auto gap-3 mb-4" style={{ ['--min' as string]: '260px' }}>
        {s.rows.map((row, index) => {
          const lowSample = row.leadCount < LOW_SAMPLE_THRESHOLD;
          return (
            <Card key={row.source} riseIndex={index}>
              <div className="row between items-start mb-2">
                <span className="t-sm t-semibold">{t(`leadSource.${row.source}`)}</span>
                {lowSample && <Badge tone="warning">{t(K.lowSampleLabel)}</Badge>}
              </div>

              <div className="grid-2 gap-2 mb-3">
                <div className="stack gap-1">
                  <span className="t-xs t-muted">{t(K.leadCount)}</span>
                  <span className="t-md t-semibold num">{row.leadCount}</span>
                </div>
                <div className="stack gap-1">
                  <span className="t-xs t-muted">{t(K.conversionRate)}</span>
                  <span className="t-md t-semibold num">{formatPercent(row.conversionRate, 0)}</span>
                </div>
                <div className="stack gap-1">
                  <span className="t-xs t-muted">{t(K.avgDealValue)}</span>
                  <span className="t-md t-semibold num">{formatINRCompact(row.avgDealValue)}</span>
                </div>
                <div className="stack gap-1">
                  <span className="t-xs t-muted">{t(K.costPerConversion)}</span>
                  <span className="t-md t-semibold num">{row.costPerConversion !== undefined ? formatINRCompact(row.costPerConversion) : t(K.noCost)}</span>
                </div>
              </div>

              {row.trend.length > 1 && (
                <>
                  <span className="t-xs t-muted">{t(K.trendHeading)}</span>
                  <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={row.trend}>
                      <defs>
                        <linearGradient id={`sourceFill-${row.source}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="t" hide />
                      <Area type="monotone" dataKey="v" stroke="var(--color-accent-primary)" strokeWidth={2} fill={`url(#sourceFill-${row.source})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <p className="t-xs t-muted">{t(K.immutableNote)}</p>
    </Screen>
  );
}
