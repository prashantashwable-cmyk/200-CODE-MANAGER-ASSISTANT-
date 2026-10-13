import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Camera, Siren, Warning } from '@phosphor-icons/react';
import {
  AscensionLine,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  StatTile,
  formatDateTime,
  formatPhone,
} from '@/design-system';
import type { AscensionStep, MapMarker } from '@/design-system';
import { useTrackTechnician } from './useTrackTechnician';
import { CHECKIN_RADIUS_METRES, TRACK_TECH_KEYS as K } from './track-technician.types';

/**
 * Screen 014 — Technician Live Tracking Detail. An admin can see exactly which
 * SOP step every active installation is on without calling anyone, and a
 * checkout with safety steps still open is impossible to miss.
 */
export function TrackTechnicianView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useTrackTechnician();

  const markers = useMemo<MapMarker[]>(() => {
    if (!s.data?.job) return [];
    const list: MapMarker[] = [
      {
        id: 'site',
        lat: s.data.job.location.lat,
        lng: s.data.job.location.lng,
        tone: 'emerald',
        glyph: 'J',
        label: s.data.job.siteName,
      },
    ];
    if (s.data.technician.location) {
      const outOfRange =
        s.data.distanceFromSiteMetres !== null &&
        s.data.distanceFromSiteMetres > CHECKIN_RADIUS_METRES;
      list.push({
        id: 'tech',
        lat: s.data.technician.location.lat,
        lng: s.data.technician.location.lng,
        tone: outOfRange ? 'error' : 'success',
        glyph: 'T',
        label: s.data.technician.name,
        pulsing: !outOfRange,
      });
    }
    return list;
  }, [s.data]);

  const railSteps = useMemo<AscensionStep[]>(() => {
    if (!s.data) return [];
    return s.data.steps.map((step) => ({
      id: step.id,
      label: t(step.labelKey),
      meta:
        step.requiresEvidence && step.status !== 'upcoming'
          ? step.evidenceCount > 0
            ? t(K.sop.evidenceCount, { count: step.evidenceCount })
            : t(K.sop.noEvidence)
          : undefined,
      // A safety-critical step with no evidence attached is blocked, not
      // merely current — the rail should show it as stuck.
      status:
        step.status === 'current' && step.requiresEvidence && step.evidenceCount === 0
          ? 'blocked'
          : step.status,
    }));
  }, [s.data, t]);

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

  const technician = s.data?.technician;

  return (
    <Screen>
      <ScreenHeader
        title={technician?.name ?? t(K.title)}
        subtitle={technician ? formatPhone(technician.phone) : undefined}
        back={() => navigate('/admin/map')}
        backLabel={t('action.back')}
        action={technician ? <Avatar name={technician.name} size="lg" /> : undefined}
      />

      {/* Anomalies first, before anything else on the screen. */}
      {s.data && s.data.anomalies.length > 0 && (
        <Card className="mb-3">
          <h2 className="t-md t-semibold row gap-2 t-error">
            <Warning size={18} />
            {t(K.anomaly.heading)}
          </h2>
          <div className="stack gap-2 mt-3">
            {s.data.anomalies.map((finding) => (
              <div key={finding.id} className="row-top gap-2">
                <Badge
                  tone={finding.severity === 'critical' ? 'error' : finding.severity === 'high' ? 'warning' : 'neutral'}
                  dot={finding.severity === 'critical' ? 'live' : true}
                >
                  {t(`severity.${finding.severity}`)}
                </Badge>
                <span className="stack gap-1 grow">
                  <span className="t-sm">{t(K.anomaly[finding.id], { context: finding.context })}</span>
                  <span className="t-xs t-muted num">{finding.context}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              variant="danger"
              icon={<Siren size={16} />}
              onClick={() =>
                navigate('/admin/escalations', {
                  state: { technicianId: technician?.id, jobId: s.data?.job?.id },
                })
              }
            >
              {t(K.escalate)}
            </Button>
          </div>
        </Card>
      )}

      {s.status === 'noJob' ? (
        <EmptyState title={t(K.noJob.title)} body={t(K.noJob.body)} />
      ) : (
        s.data?.job && (
          <>
            <Card className="mb-3" title={s.data.job.siteName} body={s.data.job.address}>
              <div className="row wrap gap-2 mt-3">
                <Badge tone="neutral">{s.data.job.code}</Badge>
                <Badge tone={s.data.job.status === 'on_hold' ? 'warning' : 'emerald'}>
                  {t(`status.${s.data.job.status === 'in_progress' ? 'inProgress' : s.data.job.status === 'on_hold' ? 'onHold' : 'scheduled'}`)}
                </Badge>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/safety-checklist/${s.data?.job?.id}`)}>
                  {t(K.safety)}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/job-issues/${s.data?.job?.id}`)}>
                  {t(K.issues)}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/material-usage/${s.data?.job?.id}`)}>
                  {t('materialLog.title')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/installation-timeline/${s.data?.job?.id}`)}>
                  {t('installTimeline.title')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/job-team/${s.data?.job?.id}`)}>
                  {t('jobTeam.title')}
                </Button>
              </div>
            </Card>

            <div className="grid-auto mb-3" style={{ ['--min' as string]: '140px' }}>
              <Card>
                <StatTile
                  label={t(K.stat.checkIn)}
                  value={
                    <span className="t-sm">
                      {s.data.checkInAt ? formatDateTime(s.data.checkInAt, i18n.language) : '—'}
                    </span>
                  }
                />
              </Card>
              <Card>
                <StatTile
                  label={t(K.stat.checkOut)}
                  value={
                    <span className="t-sm">
                      {s.data.checkOutAt
                        ? formatDateTime(s.data.checkOutAt, i18n.language)
                        : t(K.stat.stillOnSite)}
                    </span>
                  }
                />
              </Card>
              <Card>
                <StatTile
                  label={t(K.stat.hoursOnSite)}
                  value={s.data.hoursOnSite === null ? '—' : `${s.data.hoursOnSite} h`}
                />
              </Card>
              <Card>
                <StatTile
                  label={t(K.stat.stepProgress)}
                  value={`${s.data.completedSteps}/${s.data.steps.length}`}
                />
              </Card>
              <Card>
                <StatTile label={t(K.stat.evidence)} value={s.data.evidenceCount} />
              </Card>
            </div>

            <MapCanvas label={t(K.mapLabel)} markers={markers} height={260} />

            <h2 className="t-lg mt-5 mb-2">{t(K.sop.heading)}</h2>
            <Card>
              <AscensionLine steps={railSteps} />
            </Card>
            <p className="t-xs t-muted mt-2">{t(K.oneSourceNote)}</p>

            <h2 className="t-lg mt-5 mb-2">{t(K.crew.heading)}</h2>
            <Card flush>
              {s.data.crew.map((member) => (
                <ListRow
                  key={member.user.id}
                  leading={<Avatar name={member.user.name} size="sm" />}
                  title={member.user.name}
                  subtitle={
                    member.distanceMetres === null
                      ? undefined
                      : t(K.crew.away, { metres: member.distanceMetres })
                  }
                  trailing={
                    <Badge tone={member.checkedIn ? 'success' : 'neutral'} dot>
                      {member.checkedIn ? t(K.crew.checkedIn) : t(K.crew.notCheckedIn)}
                    </Badge>
                  }
                  onClick={() => navigate(`/admin/tracking/technician/${member.user.id}`)}
                />
              ))}
            </Card>

            <h2 className="t-lg mt-5 mb-2">{t(K.evidence.heading)}</h2>
            {s.data.evidenceCount === 0 ? (
              <Card body={t(K.evidence.empty)} />
            ) : (
              <>
                <div className="row wrap gap-2">
                  {Array.from({ length: Math.min(s.data.evidenceCount, 12) }, (_, i) => (
                    <span
                      key={i}
                      className="row center"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 'var(--radius-control)',
                        background: 'var(--color-surface-alt)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <Camera size={20} />
                    </span>
                  ))}
                </div>
                <p className="t-xs t-muted mt-2">{t(K.evidence.note)}</p>
              </>
            )}
          </>
        )
      )}
    </Screen>
  );
}
