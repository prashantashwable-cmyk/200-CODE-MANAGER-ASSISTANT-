import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChartBar } from '@phosphor-icons/react';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  ProgressBar,
  Screen,
  ScreenHeader,
  Sheet,
  StatTile,
  Tabs,
  formatINRCompact,
  formatPercent,
} from '@/design-system';
import type { QuotationWinLossStat } from '@/data/repository';
import { useQuotationAnalytics } from './useQuotationAnalytics';
import { PRICE_BAND_ORDER, QUOTATION_ANALYTICS_KEYS as K, SEGMENT_FILTERS } from './quotation-analytics.types';

type Translate = (key: string, opts?: Record<string, unknown>) => string;

function rateTone(stat: QuotationWinLossStat): 'warning' | 'success' | 'error' {
  if (stat.lowSample) return 'warning';
  return stat.winRatePct >= 0.5 ? 'success' : 'error';
}

interface StatRowProps {
  stat: QuotationWinLossStat;
  label: string;
  t: Translate;
  onOpen: () => void;
  riseIndex: number;
}

function StatRow({ stat, label, t, onOpen, riseIndex }: StatRowProps) {
  return (
    <Card onClick={onOpen} className="mb-2" riseIndex={riseIndex}>
      <div className="row between items-center mb-1 gap-2">
        <span className="t-sm t-medium truncate">{label}</span>
        <div className="row gap-2 items-center shrink-0">
          {stat.lowSample && <Badge tone="warning">{t(K.lowSampleBadge)}</Badge>}
          <span className="num t-sm t-semibold">{formatPercent(stat.winRatePct, 0)}</span>
        </div>
      </div>
      <ProgressBar value={stat.winRatePct} tone={rateTone(stat)} label={label} />
      <span className="t-xs t-muted">{t(K.rowSummary, { won: stat.wonCount, total: stat.quotesCount })}</span>
    </Card>
  );
}

export function QuotationAnalyticsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useQuotationAnalytics();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.analytics) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const analytics = s.analytics;

  if (s.totalQuotesCount === 0) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <Tabs
          label={t(K.title)}
          value={s.segment}
          onChange={(id) => s.setSegment(id as typeof s.segment)}
          items={SEGMENT_FILTERS.map((f) => ({ id: f, label: t(K.segment[f]) }))}
          className="mb-4"
        />
        <EmptyState icon={<ChartBar size={26} />} title={t(K.empty.title)} body={t(K.empty.body)} />
      </Screen>
    );
  }

  const priceBandStats = PRICE_BAND_ORDER.map((key) => analytics.byPriceBand.find((row) => row.key === key)).filter(
    (row): row is QuotationWinLossStat => !!row,
  );

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <Tabs
        label={t(K.title)}
        value={s.segment}
        onChange={(id) => s.setSegment(id as typeof s.segment)}
        items={SEGMENT_FILTERS.map((f) => ({ id: f, label: t(K.segment[f]) }))}
        className="mb-3"
      />
      <p className="t-xs t-muted mb-4">{t(K.lowSampleNote)}</p>

      <div className="grid-auto mb-4" style={{ ['--min' as string]: '150px' }}>
        <Card>
          <StatTile
            label={t(K.kpi.overallWinRate)}
            value={<span className="num">{formatPercent(s.overallWinRatePct, 0)}</span>}
            large
            caption={t(K.kpi.overallWinRateCaption, { count: s.totalDecidedCount })}
          />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.totalQuotes)} value={<span className="num">{s.totalQuotesCount}</span>} large />
        </Card>
        <Card>
          <StatTile
            label={t(K.kpi.avgDecisionDaysWon)}
            value={<span className="num">{s.totalWonCount === 0 ? '—' : t(K.kpi.daysUnit, { count: analytics.avgDecisionDaysWon })}</span>}
            large
          />
        </Card>
        <Card>
          <StatTile
            label={t(K.kpi.avgDecisionDaysLost)}
            value={<span className="num">{s.totalLostCount === 0 ? '—' : t(K.kpi.daysUnit, { count: analytics.avgDecisionDaysLost })}</span>}
            large
          />
        </Card>
      </div>

      <h2 className="t-lg mb-2">{t(K.section.packageTier)}</h2>
      <div className="stack gap-0 mb-4">
        {analytics.byPackageTier.map((stat, i) => (
          <StatRow
            key={stat.key}
            stat={stat}
            t={t}
            riseIndex={i}
            label={t(K.packageTierLabel[stat.key as keyof typeof K.packageTierLabel] ?? K.packageTierLabel.standard)}
            onOpen={() => s.openDrill('packageTier', t(K.packageTierLabel[stat.key as keyof typeof K.packageTierLabel] ?? K.packageTierLabel.standard), stat.quotationIds)}
          />
        ))}
      </div>

      <h2 className="t-lg mb-2">{t(K.section.driveType)}</h2>
      <div className="stack gap-0 mb-4">
        {analytics.byDriveType.map((stat, i) => (
          <StatRow
            key={stat.key}
            stat={stat}
            t={t}
            riseIndex={i}
            label={t(`driveType.${stat.key}`)}
            onOpen={() => s.openDrill('driveType', t(`driveType.${stat.key}`), stat.quotationIds)}
          />
        ))}
      </div>

      <h2 className="t-lg mb-2">{t(K.section.priceBand)}</h2>
      <div className="stack gap-0 mb-4">
        {priceBandStats.map((stat, i) => (
          <StatRow
            key={stat.key}
            stat={stat}
            t={t}
            riseIndex={i}
            label={t(K.priceBand[stat.key as keyof typeof K.priceBand])}
            onOpen={() => s.openDrill('priceBand', t(K.priceBand[stat.key as keyof typeof K.priceBand]), stat.quotationIds)}
          />
        ))}
      </div>

      <h2 className="t-lg mb-2">{t(K.section.territory)}</h2>
      <div className="stack gap-0 mb-4">
        {analytics.byTerritory.map((stat, i) => (
          <StatRow key={stat.key} stat={stat} t={t} riseIndex={i} label={stat.key} onOpen={() => s.openDrill('territory', stat.key, stat.quotationIds)} />
        ))}
      </div>

      <h2 className="t-lg mb-2">{t(K.section.lossFactors)}</h2>
      {analytics.commonLossFactors.length === 0 ? (
        <p className="t-sm t-muted mb-4">{t(K.drillSheet.noQuotes)}</p>
      ) : (
        <div className="stack gap-0 mb-4">
          {analytics.commonLossFactors.map((factor, i) => (
            <Card key={factor.reasonKey} onClick={() => s.openDrill('lossFactor', t(`lostReason.${factor.reasonKey}`), factor.leadIds)} className="mb-2" riseIndex={i}>
              <div className="row between items-center">
                <span className="t-sm t-medium">{t(`lostReason.${factor.reasonKey}`)}</span>
                <Badge tone="error">{factor.count}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={s.drillKind !== null} onClose={s.closeDrill} title={s.drillTitle} closeLabel={t('action.close')}>
        {s.drillRows.length === 0 ? (
          <p className="t-sm t-muted">{t(K.drillSheet.noQuotes)}</p>
        ) : (
          <Card flush>
            {s.drillRows.map((row) => (
              <ListRow
                key={row.leadId}
                onClick={() => {
                  s.closeDrill();
                  navigate(`/admin/leads/${row.leadId}`);
                }}
                title={row.siteName}
                subtitle={row.quotationCode ? t(K.drillSheet.quoteLine, { code: row.quotationCode, price: row.finalPrice ? formatINRCompact(row.finalPrice) : '—' }) : row.builderName}
                trailing={<Badge tone={row.stage === 'won' ? 'success' : row.stage === 'lost' ? 'error' : 'neutral'}>{t(`stage.${row.stage}`)}</Badge>}
              />
            ))}
          </Card>
        )}
      </Sheet>
    </Screen>
  );
}
