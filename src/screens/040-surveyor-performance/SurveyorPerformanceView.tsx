import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, XAxis } from 'recharts';
import { Medal, Trophy } from '@phosphor-icons/react';
import {
  Card,
  ErrorState,
  LoadingState,
  ProgressBar,
  Screen,
  ScreenHeader,
  StatTile,
  formatINRCompact,
  formatPercent,
} from '@/design-system';
import { useSurveyorPerformance } from './useSurveyorPerformance';
import { SURVEYOR_PERFORMANCE_KEYS as K } from './surveyor-performance.types';
import type { BadgeId } from './surveyor-performance.types';

/**
 * Screen 040 — Surveyor Performance & Rewards. Tangible proof of growth and
 * standing, framed as encouragement throughout — never as surveillance. A
 * surveyor below average sees the next achievable step, not a red mark.
 */
export function SurveyorPerformanceView() {
  const { t } = useTranslation();
  const s = useSurveyorPerformance();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
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

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-2 gap-3 mb-4">
        <Card>
          <StatTile label={t(K.stat.leads)} value={s.leadsCaptured} />
        </Card>
        <Card>
          <StatTile label={t(K.stat.conversion)} value={formatPercent(s.conversionRate, 0)} />
        </Card>
        <Card>
          <StatTile label={t(K.stat.revenue)} value={<span className="num">{formatINRCompact(s.revenue)}</span>} />
        </Card>
        <Card>
          <StatTile label={t(K.stat.accuracy)} value={formatPercent(s.accuracyRate, 0)} />
        </Card>
      </div>

      {s.trend.length > 1 && (
        <>
          <h2 className="t-lg mb-2">{t(K.trendHeading)}</h2>
          <Card className="mb-4">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={s.trend}>
                <XAxis dataKey="t" hide />
                <Bar dataKey="leads" fill="var(--color-accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {s.rank && (
        <Card className="mb-4">
          <div className="row gap-3">
            <Trophy size={24} className="t-accent shrink-0" />
            <div className="stack gap-1">
              <span className="t-md t-semibold">{t(K.rankValue, { rank: s.rank, total: s.totalPeers })}</span>
              <span className="t-sm t-muted">{t(K.rankEncouragement)}</span>
            </div>
          </div>
        </Card>
      )}

      <h2 className="t-lg mb-2">{t(K.contest.heading)}</h2>
      <Card className="mb-4">
        <p className="t-sm t-muted">{t(K.contest.none.body)}</p>
      </Card>

      <h2 className="t-lg mb-2">{t(K.badgesHeading)}</h2>
      <div className="grid-auto" style={{ ['--min' as string]: '150px' }}>
        {s.badges.map((badge, index) => (
          <Card key={badge.id} riseIndex={index} selected={badge.earned}>
            <div className="row gap-2 mb-2">
              <Medal
                size={22}
                weight={badge.earned ? 'fill' : 'regular'}
                className={badge.earned ? 't-accent' : 't-muted'}
              />
              <span className="t-sm t-semibold">{t(K.badge[badge.id as BadgeId].label)}</span>
            </div>
            <p className="t-xs t-muted mb-2">{t(K.badge[badge.id as BadgeId].description)}</p>
            {badge.earned ? (
              <span className="t-xs t-success">{t(K.badgeEarned)}</span>
            ) : (
              <>
                <ProgressBar value={badge.progress / badge.target} />
                <span className="t-xs t-muted mt-1">
                  {t(K.badgeProgress, { progress: badge.progress, target: badge.target })}
                </span>
              </>
            )}
          </Card>
        ))}
      </div>
    </Screen>
  );
}
