import { useTranslation } from 'react-i18next';
import { Area, AreaChart, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { DownloadSimple } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  SegBar,
  StatTile,
  formatINR,
  formatINRCompact,
  formatPercent,
  useToast,
} from '@/design-system';
import { useRevenue } from './useRevenue';
import {
  DEFAULT_TARGET_MARGIN_PCT,
  PERIODS,
  REVENUE_KEYS as K,
  TARGET_MARGIN_TOLERANCE_PCT,
} from './revenue.types';

/**
 * Screen 023 — Revenue & Profit Analytics. True profitability, reconciled
 * exactly with the same deal and payment records the Quotation and Payment
 * modules use — never a separate manual estimate.
 */
export function RevenueView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useRevenue();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.summary) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </Screen>
    );
  }

  const { summary } = s;
  const targetLow = (DEFAULT_TARGET_MARGIN_PCT - TARGET_MARGIN_TOLERANCE_PCT) * 100;
  const targetHigh = (DEFAULT_TARGET_MARGIN_PCT + TARGET_MARGIN_TOLERANCE_PCT) * 100;

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button
            size="sm"
            variant="ghost"
            icon={<DownloadSimple size={16} />}
            onClick={() => {
              s.exportCsv();
              toast.push(t(K.exported), 'success');
            }}
          >
            {t(K.export)}
          </Button>
        }
      />

      <SegBar
        label={t(K.period['30'])}
        value={s.period}
        onChange={(id) => s.setPeriod(id as '7' | '30' | '90')}
        items={PERIODS.map((p) => ({ id: p, label: t(K.period[p]) }))}
        className="mb-4"
      />

      <div className="grid-auto mb-4" style={{ ['--min' as string]: '160px' }}>
        <Card>
          <StatTile label={t(K.card.booked)} value={<span className="num">{formatINRCompact(summary.booked)}</span>} large />
        </Card>
        <Card>
          <StatTile
            label={t(K.card.collected)}
            value={<span className="num">{formatINRCompact(summary.collected)}</span>}
            large
          />
        </Card>
        <Card>
          <StatTile label={t(K.card.cogs)} value={<span className="num">{formatINRCompact(summary.cogs)}</span>} large />
        </Card>
        <Card>
          <StatTile
            label={t(K.card.margin)}
            value={<span className="num">{formatPercent(summary.grossMarginPct, 1)}</span>}
            large
          />
        </Card>
      </div>

      <Card className="mb-4">
        <p className="t-xs t-muted">{t(K.bookedVsCollectedNote)}</p>
      </Card>

      <h2 className="t-lg mb-2">{t(K.marginTrend)}</h2>
      <Card className="mb-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={s.marginSeries}>
            <defs>
              <linearGradient id="marginFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-secondary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-accent-secondary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={[0, 'dataMax + 5']} />
            <ReferenceArea
              y1={targetLow}
              y2={targetHigh}
              fill="var(--color-success)"
              fillOpacity={0.1}
              stroke="none"
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="var(--color-accent-secondary)"
              strokeWidth={2}
              fill="url(#marginFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="t-xs t-muted mt-2">
          {t(K.targetBand, { low: targetLow.toFixed(0), high: targetHigh.toFixed(0) })}
        </p>
      </Card>

      <Card className="mb-4">
        <h2 className="t-md t-semibold mb-3">{t(K.wonVsLost)}</h2>
        <div className="grid-2">
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.won)}</span>
            <span className="t-lg t-semibold num t-success">{summary.dealsWon}</span>
          </div>
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.lost)}</span>
            <span className="t-lg t-semibold num t-error">
              {summary.dealsLost}{' '}
              <span className="t-xs t-muted">({formatINRCompact(summary.lostValue)})</span>
            </span>
          </div>
        </div>
        <div className="mt-3">
          <span className="t-xs t-muted">{t(K.avgDeal)}</span>
          <div className="t-md t-semibold num">{formatINR(summary.avgDealSize)}</div>
        </div>
      </Card>

      <h2 className="t-lg mb-2">{t(K.byRegion)}</h2>
      <Card flush>
        <div className="scroll-x">
          <table className="ds-table">
            <thead>
              <tr>
                <th>{t(K.column.region)}</th>
                <th className="ds-table__num">{t(K.column.booked)}</th>
                <th className="ds-table__num">{t(K.column.collected)}</th>
                <th className="ds-table__num">{t(K.column.margin)}</th>
                <th className="ds-table__num">{t(K.column.deals)}</th>
              </tr>
            </thead>
            <tbody>
              {s.regions.map((region) => (
                <tr key={region.region}>
                  <td>
                    {region.region}
                    {region.smallSample && (
                      <div className="t-xs t-muted">{t(K.smallSample)}</div>
                    )}
                  </td>
                  <td className="ds-table__num">{formatINRCompact(region.booked)}</td>
                  <td className="ds-table__num">{formatINRCompact(region.collected)}</td>
                  <td className="ds-table__num">{formatPercent(region.margin, 0)}</td>
                  <td className="ds-table__num">{region.dealCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="t-xs t-muted mt-3">{t(K.liveSourceNote)}</p>
    </Screen>
  );
}
