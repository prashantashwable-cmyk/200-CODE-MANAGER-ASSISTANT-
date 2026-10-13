import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Coins, ListChecks, Path, PlusCircle, Trophy, WifiSlash } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  StatTile,
  formatDateTime,
  formatINRCompact,
  formatTime,
  relativeTimeParts,
} from '@/design-system';
import { useSession } from '@/session/SessionProvider';
import { useSurveyorHome } from './useSurveyorHome';
import { SURVEYOR_HOME_KEYS as K } from './surveyor-home.types';

/**
 * Screen 031 — Surveyor Home / My Tasks. The true home screen: every other
 * surveyor screen is one tap away, since field workers need speed over
 * navigation depth. Capture New Lead is the single largest thing on screen.
 */
export function SurveyorHomeView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const s = useSurveyorHome();

  if (s.status === 'loading') {
    return (
      <Screen>
        <div className="mt-4 mb-4">
          <h1 className="t-2xl t-balance">{t(K.greeting, { name: user?.name.split(' ')[0] ?? '' })}</h1>
        </div>
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.data) {
    return (
      <Screen>
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </Screen>
    );
  }

  const { data } = s;
  const relative = relativeTimeParts(data.lastSyncedAt);

  return (
    <Screen className="pb-action-bar">
      <div className="mt-4 mb-4">
        <h1 className="t-2xl t-balance">{t(K.greeting, { name: user?.name.split(' ')[0] ?? '' })}</h1>
        {!s.isOnline && (
          <p className="t-xs t-warning row gap-2 mt-2">
            <WifiSlash size={14} className="shrink-0" />
            {t(K.offlineNote, { time: t(relative.key, { count: relative.count }) })}
          </p>
        )}
      </div>

      {/* One tap from opening the app to capturing a lead. */}
      <Button block size="md" icon={<PlusCircle size={20} weight="fill" />} onClick={() => navigate('/surveyor/capture')}>
        {t(K.captureNew)}
      </Button>

      {data.isFirstDay && (
        <Card className="mt-4">
          <p className="t-md t-semibold">{t(K.firstDay.title)}</p>
          <p className="t-sm t-muted mt-1">{t(K.firstDay.body)}</p>
        </Card>
      )}

      <div className="grid-2 gap-3 mt-4">
        <Card>
          <StatTile label={t(K.stat.leadsToday)} value={data.leadsToday} />
        </Card>
        <Card>
          <StatTile
            label={t(K.stat.followUpsDue)}
            value={
              <span className={data.followUps.some((f) => f.overdue) ? 't-warning' : undefined}>
                {data.followUps.length}
              </span>
            }
          />
        </Card>
        <Card>
          <StatTile
            label={t(K.stat.weeklyCommission)}
            value={<span className="num">{formatINRCompact(data.weeklyCommission)}</span>}
          />
        </Card>
        <Card>
          <StatTile
            label={t(K.stat.rank)}
            value={
              data.currentRank ? (
                <span className="row gap-1">
                  <Trophy size={18} className="t-accent" />
                  {t(K.rankValue, { rank: data.currentRank, total: data.totalActiveSurveyors })}
                </span>
              ) : (
                '—'
              )
            }
          />
        </Card>
      </div>

      <h2 className="t-lg mt-5 mb-2">{t(K.followUpsHeading)}</h2>
      {data.followUps.length === 0 ? (
        <Card body={t(K.followUpsEmpty)} />
      ) : (
        <Card flush>
          {data.followUps.map(({ stop, overdue }) => (
            <ListRow
              key={stop.id}
              title={stop.label}
              subtitle={stop.address}
              trailing={
                <Badge tone={overdue ? 'error' : 'neutral'}>
                  {overdue ? t(K.overdue) : t(K.dueAt, { time: formatTime(stop.windowStart, i18n.language) })}
                </Badge>
              }
              onClick={() => navigate('/surveyor/route')}
            />
          ))}
        </Card>
      )}

      <h2 className="t-lg mt-5 mb-2">{t(K.quickLinks)}</h2>
      <div className="grid-2 gap-3 mb-4">
        <Card onClick={() => navigate('/surveyor/route')}>
          <div className="row gap-3">
            <Path size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.link.route)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/surveyor/leads')}>
          <div className="row gap-3">
            <ListChecks size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.link.leads)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/surveyor/earnings')}>
          <div className="row gap-3">
            <Coins size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.link.earnings)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/surveyor/performance')}>
          <div className="row gap-3">
            <Trophy size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.link.performance)}</span>
          </div>
        </Card>
      </div>

      <p className="t-xs t-muted">
        {t(K.lastSynced, { time: formatDateTime(data.lastSyncedAt, i18n.language) })}
      </p>
    </Screen>
  );
}
