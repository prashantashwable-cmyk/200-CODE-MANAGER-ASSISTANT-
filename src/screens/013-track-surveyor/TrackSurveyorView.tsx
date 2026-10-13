import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChatCircle, Clock, Image as ImageIcon, Phone, WarningCircle, WhatsappLogo } from '@phosphor-icons/react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  StatTile,
  formatPhone,
  formatTime,
} from '@/design-system';
import type { MapMarker, MapRoute } from '@/design-system';
import { useTrackSurveyor } from './useTrackSurveyor';
import { TRACK_SURVEYOR_KEYS as K } from './track-surveyor.types';

/**
 * Screen 013 — Surveyor Live Tracking Detail. An admin can audit any
 * surveyor's whole day, today or historical, without leaving this screen.
 * Strictly read-only: viewing and flagging, never editing their logged data.
 */
export function TrackSurveyorView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useTrackSurveyor();

  const routes = useMemo<MapRoute[]>(() => {
    if (!s.data) return [];
    return s.data.segments
      .filter((segment) => segment.points.length > 1)
      .map((segment) => ({
        id: segment.id,
        points: segment.points,
        // A poor-accuracy stretch is drawn dashed and muted so it is not read
        // with the same confidence as a clean one.
        tone: segment.lowAccuracy ? 'muted' : 'accent',
        dashed: segment.lowAccuracy,
      }));
  }, [s.data]);

  const markers = useMemo<MapMarker[]>(() => {
    if (!s.data) return [];
    const list: MapMarker[] = s.data.visits.map((visit, index) => ({
      id: visit.id,
      lat: visit.location.lat,
      lng: visit.location.lng,
      tone: visit.flagged ? 'error' : visit.status === 'done' ? 'success' : 'muted',
      glyph: String(index + 1),
      label: visit.label,
    }));
    if (s.data.surveyor.location) {
      list.push({
        id: 'current',
        lat: s.data.surveyor.location.lat,
        lng: s.data.surveyor.location.lng,
        tone: 'accent',
        glyph: 'S',
        label: s.data.surveyor.name,
        pulsing: s.data.minutesSincePing >= 0 && s.data.minutesSincePing < 20,
      });
    }
    return list;
  }, [s.data]);

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate('/admin/map')} backLabel={t('action.back')} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'notFound') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate('/admin/map')} backLabel={t('action.back')} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate('/admin/map')} backLabel={t('action.back')} />
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </Screen>
    );
  }

  const surveyor = s.data?.surveyor;

  return (
    <Screen>
      <ScreenHeader
        title={surveyor?.name ?? t(K.title)}
        subtitle={surveyor ? formatPhone(surveyor.phone) : undefined}
        back={() => navigate('/admin/map')}
        backLabel={t('action.back')}
        action={surveyor ? <Avatar name={surveyor.name} size="lg" /> : undefined}
      />

      <Card className="mb-3">
        <label className="stack gap-2">
          <span className="label">{t(K.datePicker)}</span>
          <Input
            type="date"
            value={s.date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => s.setDate(e.target.value)}
          />
        </label>
      </Card>

      {/* A phone that died is stated honestly rather than implied. */}
      {s.data && s.data.minutesSincePing >= 20 && (
        <Card className="mb-3">
          <p className="t-sm t-warning row gap-2">
            <WarningCircle size={16} className="shrink-0" />
            {t(K.signalLost, { count: s.data.minutesSincePing })}
          </p>
        </Card>
      )}

      {s.status === 'beforeJoining' && (
        <EmptyState title={t(K.beforeJoining.title)} body={t(K.beforeJoining.body)} />
      )}

      {s.status === 'empty' && <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />}

      {s.status === 'ready' && s.data && (
        <>
          <div className="grid-auto mb-3" style={{ ['--min' as string]: '140px' }}>
            <Card>
              <StatTile
                label={t(K.stat.distance)}
                value={
                  <>
                    {s.data.stats.distanceKm} <span className="t-sm t-muted">{t('unit.km')}</span>
                  </>
                }
              />
            </Card>
            <Card>
              <StatTile label={t(K.stat.leads)} value={s.data.stats.leadsCaptured} />
            </Card>
            <Card>
              <StatTile
                label={t(K.stat.avgPerSite)}
                value={
                  s.data.stats.averageMinutesPerSite === null ? (
                    '—'
                  ) : (
                    <>
                      {s.data.stats.averageMinutesPerSite}{' '}
                      <span className="t-sm t-muted">{t('unit.minutes')}</span>
                    </>
                  )
                }
              />
            </Card>
            <Card>
              <StatTile
                label={t(K.stat.flagged)}
                value={
                  <span className={s.data.stats.duplicateFlagged > 0 ? 't-error' : undefined}>
                    {s.data.stats.duplicateFlagged}
                  </span>
                }
              />
            </Card>
            <Card>
              <StatTile
                label={t(K.stat.progress)}
                value={`${s.data.stats.stopsDone}/${s.data.stats.stopsTotal}`}
              />
            </Card>
          </div>

          <MapCanvas label={t(K.mapLabel)} markers={markers} routes={routes} height={320} />
          {s.data.segments.some((seg) => seg.lowAccuracy) && (
            <p className="t-xs t-muted mt-2">{t(K.lowAccuracyNote)}</p>
          )}

          <h2 className="t-lg mt-5 mb-2">{t(K.visits.heading)}</h2>
          <Card flush>
            {s.data.visits.map((visit) => (
              <div key={visit.id} className="stack gap-2 p-3 hairline-top">
                <div className="row between gap-2">
                  <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                    <span className="t-medium truncate">{visit.label}</span>
                    <span className="t-xs t-muted truncate">{visit.address}</span>
                  </span>
                  <span className="shrink-0 stack items-end gap-1">
                    {visit.arrivedAt ? (
                      <span className="t-xs t-muted num">
                        {formatTime(visit.arrivedAt, i18n.language)}
                      </span>
                    ) : (
                      <Badge tone="neutral">{t(K.visits.notArrived)}</Badge>
                    )}
                  </span>
                </div>

                <div className="row wrap gap-2">
                  {visit.minutesOnSite !== null && (
                    <Badge tone={visit.isOutlier ? 'warning' : 'neutral'} dot={visit.isOutlier}>
                      <Clock size={12} />
                      {t(K.visits.onSite, { count: visit.minutesOnSite })}
                    </Badge>
                  )}
                  <Badge tone="neutral">
                    <ImageIcon size={12} />
                    {t(K.visits.photos, { count: visit.photoCount })}
                  </Badge>
                  {visit.leadCode && <Badge tone="emerald">{visit.leadCode}</Badge>}
                  {visit.flagged && <Badge tone="error" dot>{t(K.visits.flagged)}</Badge>}
                </div>

                {visit.isOutlier && <p className="t-xs t-warning">{t(K.visits.outlier)}</p>}
              </div>
            ))}
          </Card>

          {surveyor && (
            <div className="row wrap gap-2 mt-4">
              <Button
                variant="ghost"
                icon={<Phone size={16} />}
                onClick={() => {
                  window.location.href = `tel:+91${surveyor.phone}`;
                }}
              >
                {t(K.contact.call)}
              </Button>
              <Button
                variant="ghost"
                icon={<WhatsappLogo size={16} />}
                onClick={() => {
                  window.open(`https://wa.me/91${surveyor.phone}`, '_blank', 'noopener');
                }}
              >
                {t(K.contact.whatsapp)}
              </Button>
              <Button
                variant="ghost"
                icon={<ChatCircle size={16} />}
                onClick={() => {
                  window.location.href = `sms:+91${surveyor.phone}`;
                }}
              >
                {t(K.contact.message)}
              </Button>
            </div>
          )}

          <p className="t-xs t-muted mt-3">{t(K.readOnlyNote)}</p>
        </>
      )}
    </Screen>
  );
}
