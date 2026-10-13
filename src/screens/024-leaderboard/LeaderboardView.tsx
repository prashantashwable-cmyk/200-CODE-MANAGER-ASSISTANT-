import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Medal, TrendDown, TrendUp, Warning } from '@phosphor-icons/react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  SegBar,
  Tabs,
  TextArea,
} from '@/design-system';
import { useLeaderboard } from './useLeaderboard';
import { LEADERBOARD_KEYS as K, PERIODS } from './leaderboard.types';
import type { LeaderboardRow } from './leaderboard.types';

/**
 * Screen 024 — Worker Performance Leaderboard. Top and bottom performers are
 * identifiable in one glance, for both surveyors and technicians, and the
 * ranking rule stays in step with whatever the Rewards module is running.
 */
export function LeaderboardView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useLeaderboard();
  const [excludeTarget, setExcludeTarget] = useState<LeaderboardRow | null>(null);
  const [excludeReason, setExcludeReason] = useState('');

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={6} />
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

  if (s.status === 'empty') {
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

      <Tabs
        label={t(K.cohort.surveyor)}
        value={s.cohort}
        onChange={(id) => s.setCohort(id as 'surveyor' | 'technician')}
        items={[
          { id: 'surveyor', label: t(K.cohort.surveyor) },
          { id: 'technician', label: t(K.cohort.technician) },
        ]}
        className="mb-3"
      />

      <div className="row wrap gap-3 mb-4">
        <SegBar
          label={t(K.period.month)}
          value={s.period}
          onChange={(id) => s.setPeriod(id as 'week' | 'month' | 'allTime')}
          items={PERIODS.map((p) => ({ id: p, label: t(K.period[p]) }))}
        />
        <SegBar
          label={t(K.view.ranked)}
          value={s.view}
          onChange={(id) => s.setView(id as 'ranked' | 'risingStars')}
          items={[
            { id: 'ranked', label: t(K.view.ranked) },
            { id: 'risingStars', label: t(K.view.risingStars) },
          ]}
        />
        <label className="grow" style={{ maxWidth: 220 }}>
          <span className="sr-only">{t(K.metric.label)}</span>
          <Select value={s.metric} onChange={(e) => s.setMetric(e.target.value as typeof s.metric)}>
            {s.availableMetrics.map((m) => (
              <option key={m} value={m}>
                {t(K.metric[m])}
              </option>
            ))}
          </Select>
        </label>
      </div>
      {(s.metric === 'conversionRate' || s.metric === 'qualityScore') && s.period !== 'allTime' && (
        <p className="t-xs t-muted mb-3">{t(K.rateAllTime)}</p>
      )}

      <Card flush>
        {s.rows.map((row, index) => (
          <div key={row.userId} className="hairline-top">
            <div className="ds-listrow" style={{ cursor: 'default' }}>
              <span
                className="row center shrink-0 t-semibold"
                style={{ width: 28 }}
              >
                {row.rank > 0 && row.rank <= 3 && !row.excluded ? (
                  <Medal size={20} className={row.rank === 1 ? 't-accent' : 't-muted'} weight="fill" />
                ) : (
                  <span className="num t-muted">{row.rank || '—'}</span>
                )}
              </span>
              <Avatar name={row.name} size="sm" />
              <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                <span className="row gap-2">
                  <span className="t-medium truncate">{row.name}</span>
                  {row.isNewJoiner && <Badge tone="neutral">{t(K.newJoinerNote)}</Badge>}
                  {row.excluded && <Badge tone="warning">{t(K.excluded)}</Badge>}
                </span>
                {row.sparkline.length > 0 && <Sparkline points={row.sparkline} />}
              </span>
              <span className="shrink-0 stack items-end gap-1">
                {row.primaryDisplay === null ? (
                  <span className="t-sm t-muted">{t(K.notRated)}</span>
                ) : (
                  <span className="t-md t-semibold num">{row.primaryDisplay}</span>
                )}
              </span>
            </div>
            <div className="row between p-3" style={{ paddingTop: 0 }}>
              <span className="t-xs t-muted">
                {t(K.tieBreak, { value: row.secondaryDisplay })}
                {s.view === 'risingStars' && (
                  <>
                    {' · '}
                    {row.improvementPct === null ? (
                      t(K.noTrend)
                    ) : (
                      <>
                        {row.improvementPct > 0 ? (
                          <TrendUp size={11} className="t-success" style={{ display: 'inline' }} />
                        ) : (
                          <TrendDown size={11} className="t-muted" style={{ display: 'inline' }} />
                        )}{' '}
                        {t(K.improvement, { pct: Math.round(row.improvementPct * 100) })}
                      </>
                    )}
                  </>
                )}
              </span>
              <span className="row gap-2">
                {row.excluded ? (
                  <Button size="sm" variant="quiet" onClick={() => s.includeWorker(row.userId)}>
                    {t(K.include)}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="quiet"
                    icon={<Warning size={13} />}
                    onClick={() => setExcludeTarget(row)}
                  >
                    {t(K.exclude)}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    navigate(
                      s.cohort === 'surveyor'
                        ? `/admin/tracking/surveyor/${row.userId}`
                        : `/admin/tracking/technician/${row.userId}`,
                    )
                  }
                >
                  {t('action.viewDetails')}
                </Button>
              </span>
            </div>
            {row.excludedReason && (
              <p className="t-xs t-muted p-3" style={{ paddingTop: 0 }}>
                {t(K.excludedNote, { reason: row.excludedReason })}
              </p>
            )}
          </div>
        ))}
      </Card>

      <p className="t-xs t-muted mt-3">{t(K.rewardsSyncNote)}</p>

      {excludeTarget && (
        <Card className="mt-4">
          <h2 className="t-md t-semibold">{t(K.excludeReasonPrompt, { name: excludeTarget.name })}</h2>
          <div className="mt-3">
            <TextArea value={excludeReason} onChange={(e) => setExcludeReason(e.target.value)} />
          </div>
          <div className="row gap-2 mt-3">
            <Button
              onClick={() => {
                s.excludeWorker(excludeTarget.userId, excludeReason);
                setExcludeTarget(null);
                setExcludeReason('');
              }}
            >
              {t(K.exclude)}
            </Button>
            <Button variant="quiet" onClick={() => setExcludeTarget(null)}>
              {t('action.cancel')}
            </Button>
          </div>
        </Card>
      )}
    </Screen>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  return (
    <span className="row gap-1" aria-hidden="true" style={{ height: 16, alignItems: 'flex-end' }}>
      {points.map((p, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: Math.max(2, (p / max) * 16),
            background: 'var(--color-accent-primary)',
            opacity: 0.4 + (i / points.length) * 0.6,
            borderRadius: 1,
          }}
        />
      ))}
    </span>
  );
}
