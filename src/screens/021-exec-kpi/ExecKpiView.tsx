import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Bell, ChartLineUp, Lightning, MapTrifold, Wallet } from '@phosphor-icons/react';
import {
  Badge,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  SegBar,
  StatTile,
} from '@/design-system';
import { useExecKpi } from './useExecKpi';
import { EXEC_KPI_KEYS as K, RANGES } from './exec-kpi.types';

/**
 * Screen 021 — Executive KPI Dashboard, the Admin's home. Answers "is the
 * business healthy right now" within ten seconds, no scrolling required for
 * the headline numbers.
 */
export function ExecKpiView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useExecKpi();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={6} />
      </Screen>
    );
  }

  if (s.status === 'error') {
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

  const funnelPeak = Math.max(...s.funnel.map((f) => f.count), 1);

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          s.openAlerts > 0 ? (
            <button
              type="button"
              className="tappable"
              onClick={() => navigate('/admin/alerts')}
              aria-label={t(K.alertsCta)}
            >
              <Bell size={20} className="t-warning" />
            </button>
          ) : undefined
        }
      />

      <SegBar
        label={t(K.range.month)}
        value="month"
        onChange={() => undefined}
        items={RANGES.map((r) => ({ id: r, label: t(K.range[r]) }))}
        className="mb-4"
      />

      <div className="grid-auto mb-4" style={{ ['--min' as string]: '170px' }}>
        {s.cards.map((card, index) => (
          <Card key={card.id} riseIndex={index} onClick={() => navigate(card.drillPath)}>
            {card.hasData ? (
              <StatTile
                label={t(card.labelKey)}
                value={<span className="num">{card.value}</span>}
                large
                delta={
                  card.trendPct === null
                    ? undefined
                    : {
                        value: `${card.trendPct >= 0 ? '+' : ''}${Math.round(card.trendPct * 100)}%`,
                        direction: card.trendPct >= 0 ? 'up' : 'down',
                        tone:
                          (card.trendPct >= 0) === (card.goodDirection === 'up')
                            ? 'success'
                            : 'error',
                      }
                }
                caption={card.smallSample ? t(K.smallSample) : undefined}
              />
            ) : (
              <div className="stack gap-1">
                <span className="ds-stat__label">{t(card.labelKey)}</span>
                <span className="t-sm t-muted">{t(K.noData)}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <div className="row between gap-2 mb-2">
          <h2 className="t-md t-semibold">{t('execKpi.revenueTrend')}</h2>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={s.revenueSeries}>
            <defs>
              <linearGradient id="execRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="var(--color-accent-primary)"
              strokeWidth={2}
              fill="url(#execRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <h2 className="t-lg mb-1">{t(K.funnelHeading)}</h2>
      <p className="t-sm t-muted mb-3">{t(K.funnelSubtitle)}</p>
      <Card className="mb-4">
        <div className="stack gap-3">
          {s.funnel.map((stage) => (
            <div key={stage.id} className="stack gap-1">
              <div className="row between">
                <span className="t-sm t-medium">{t(stage.labelKey)}</span>
                <span className="t-sm num">{stage.count}</span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-surface-alt)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(4, (stage.count / funnelPeak) * 100)}%`,
                    background: 'var(--color-accent-primary)',
                    borderRadius: 'var(--radius-pill)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="t-xs t-muted mt-3">{t(K.sameDataNote)}</p>
      </Card>

      <h2 className="t-lg mb-3">{t(K.quickLinks)}</h2>
      <div className="grid-auto" style={{ ['--min' as string]: '160px' }}>
        <Card onClick={() => navigate('/admin/map')}>
          <div className="row gap-3">
            <MapTrifold size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.link.map)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/analytics/funnel')}>
          <div className="row gap-3">
            <ChartLineUp size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.link.funnel)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/analytics/finance')}>
          <div className="row gap-3">
            <Wallet size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.link.finance)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/analytics/automation')}>
          <div className="row gap-3">
            <Lightning size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.link.automation)}</span>
          </div>
        </Card>
      </div>
    </Screen>
  );
}
