import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChatCircle, Phone, SlidersHorizontal, WifiSlash } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  ListRow,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  Sheet,
  StatTile,
  formatPhone,
  relativeTimeParts,
} from '@/design-system';
import type { MapMarker, MapTone, MapZone } from '@/design-system';
import { useLiveMap } from './useLiveMap';
import { useMapLayers } from './useMapLayers';
import { ALL_LAYERS, LIVE_MAP_KEYS as K, ROLE_GLYPH } from './live-map.types';
import type { PinCluster, StaffPin, StaffStatus } from './live-map.types';

const STATUS_TONE: Record<StaffStatus, MapTone> = {
  onsite: 'success',
  traveling: 'accent',
  idle: 'muted',
  lostSignal: 'error',
};

/**
 * Screen 011 — Live Map Dashboard. The single-person monitoring nerve centre:
 * one map, every moving part, and an answer within five seconds to "is anyone
 * in trouble right now?"
 */
export function LiveMapView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, data, lastUpdatedAt, retry } = useLiveMap();
  const layers = useMapLayers();

  const [selectedPin, setSelectedPin] = useState<StaffPin | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<PinCluster | null>(null);

  const clusteredIds = useMemo(
    () => new Set((data?.clusters ?? []).flatMap((c) => c.members.map((m) => m.user.id))),
    [data],
  );

  const markers = useMemo<MapMarker[]>(() => {
    if (!data) return [];
    const list: MapMarker[] = [];

    for (const pin of data.staff) {
      if (clusteredIds.has(pin.user.id)) continue;
      const layer = pin.user.role === 'surveyor' ? 'surveyors' : 'technicians';
      if (!layers.isOn(layer)) continue;
      list.push({
        id: pin.user.id,
        lat: pin.lat,
        lng: pin.lng,
        tone: STATUS_TONE[pin.status],
        glyph: ROLE_GLYPH[pin.user.role],
        label: `${pin.user.name} — ${t(K.staffStatus[pin.status])}`,
        pulsing: pin.status === 'onsite',
        selected: selectedPin?.user.id === pin.user.id,
        onClick: () => {
          setSelectedCluster(null);
          setSelectedPin(pin);
        },
      });
    }

    for (const cluster of data.clusters) {
      const anySurveyor = cluster.members.some((m) => m.user.role === 'surveyor');
      if (!layers.isOn(anySurveyor ? 'surveyors' : 'technicians')) continue;
      list.push({
        id: cluster.id,
        lat: cluster.lat,
        lng: cluster.lng,
        tone: 'emerald',
        glyph: String(cluster.members.length),
        label: t(K.card.clusterTitle, { count: cluster.members.length }),
        onClick: () => {
          setSelectedPin(null);
          setSelectedCluster(cluster);
        },
      });
    }

    if (layers.isOn('leads')) {
      for (const lead of data.leads) {
        if (lead.stage === 'won' || lead.stage === 'lost') continue;
        list.push({
          id: `lead-${lead.id}`,
          lat: lead.location.lat,
          lng: lead.location.lng,
          tone: 'warning',
          label: `${lead.siteName} — ${t(`stage.${lead.stage}`)}`,
        });
      }
    }

    if (layers.isOn('jobs')) {
      for (const job of data.jobs) {
        if (job.status === 'completed') continue;
        list.push({
          id: `job-${job.id}`,
          lat: job.location.lat,
          lng: job.location.lng,
          tone: 'emerald',
          label: job.siteName,
        });
      }
    }

    if (layers.isOn('alerts')) {
      for (const alert of data.alerts) {
        if (!alert.location) continue;
        list.push({
          id: `alert-${alert.id}`,
          lat: alert.location.lat,
          lng: alert.location.lng,
          tone: 'error',
          glyph: '!',
          label: alert.context,
          pulsing: alert.severity === 'critical',
          onClick: () => navigate('/admin/escalations'),
        });
      }
    }

    return list;
  }, [data, layers, clusteredIds, selectedPin, t, navigate]);

  const zones = useMemo<MapZone[]>(() => {
    if (!data || !layers.isOn('territories')) return [];
    return data.zones.map((zone) => ({
      id: zone.id,
      points: zone.points,
      tone: zone.status === 'active' ? 'emerald' : 'muted',
      label: zone.name,
    }));
  }, [data, layers]);

  if (status === 'connecting' && !data) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
        <div className="mt-3">
          <LoadingState label={t(K.loading)} variant="block" />
        </div>
      </Screen>
    );
  }

  if (status === 'error' || !data) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const updated = lastUpdatedAt ? relativeTimeParts(lastUpdatedAt) : null;

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button
            size="sm"
            variant="ghost"
            icon={<SlidersHorizontal size={16} />}
            onClick={() => navigate('/admin/map/filters')}
          >
            {t(K.layer.manage)}
          </Button>
        }
      />

      {/* The counter strip answers "is anyone in trouble" before the map does. */}
      <div className="grid-auto mb-3" style={{ ['--min' as string]: '130px' }}>
        <Card>
          <StatTile label={t(K.counter.onDuty)} value={data.counters.onDuty} />
        </Card>
        <Card>
          <StatTile label={t(K.counter.leadsToday)} value={data.counters.leadsToday} />
        </Card>
        <Card>
          <StatTile label={t(K.counter.jobsInProgress)} value={data.counters.jobsInProgress} />
        </Card>
        <Card>
          <StatTile
            label={t(K.counter.alerts)}
            value={
              <span className={data.counters.alertsNeedingAttention > 0 ? 't-error' : undefined}>
                {data.counters.alertsNeedingAttention}
              </span>
            }
          />
        </Card>
        <Card>
          <StatTile
            label={t(K.counter.lostSignal)}
            value={
              <span className={data.counters.lostSignal > 0 ? 't-warning' : undefined}>
                {data.counters.lostSignal}
              </span>
            }
          />
        </Card>
      </div>

      <div className="row wrap gap-2 mb-3">
        {ALL_LAYERS.map((layer) => (
          <Chip key={layer} pressed={layers.isOn(layer)} onClick={() => layers.toggle(layer)}>
            {t(K.layer[layer])}
          </Chip>
        ))}
      </div>

      <MapCanvas
        label={t(K.mapLabel)}
        markers={markers}
        zones={zones}
        height={460}
      >
        {/* Connection state lives on the map, where it is being relied on. */}
        <div className="ds-map__overlay" style={{ top: 'var(--space-3)', left: 'var(--space-3)' }}>
          <Badge
            tone={status === 'live' ? 'success' : status === 'reconnecting' ? 'warning' : 'neutral'}
            dot={status === 'live' ? 'live' : true}
          >
            {t(K.status[status])}
          </Badge>
        </div>
        {updated && (
          <div
            className="ds-map__overlay"
            style={{ bottom: 'var(--space-3)', left: 'var(--space-3)' }}
          >
            <Badge tone="neutral">
              {t(K.status.updatedAgo, { time: t(updated.key, { count: updated.count }) })}
            </Badge>
          </div>
        )}
      </MapCanvas>

      <p className="t-xs t-muted mt-2">{t(K.schematicNote)}</p>

      {data.staff.length === 0 && (
        <Card className="mt-3" title={t(K.empty.title)} body={t(K.empty.body)} />
      )}

      <div className="mt-4">
        <Button variant="ghost" onClick={() => navigate('/admin/activity')}>
          {t(K.activityLink)}
        </Button>
      </div>

      {/* Tapping a pin opens an overlay — the Admin never loses map context. */}
      <Sheet
        open={selectedPin !== null}
        onClose={() => setSelectedPin(null)}
        title={selectedPin?.user.name ?? ''}
        closeLabel={t('action.close')}
      >
        {selectedPin && <StaffCard pin={selectedPin} />}
      </Sheet>

      <Sheet
        open={selectedCluster !== null}
        onClose={() => setSelectedCluster(null)}
        title={t(K.card.clusterTitle, { count: selectedCluster?.members.length ?? 0 })}
        closeLabel={t('action.close')}
      >
        <p className="t-sm t-muted mb-3">{t(K.card.clusterBody)}</p>
        <Card flush>
          {selectedCluster?.members.map((member) => (
            <ListRow
              key={member.user.id}
              title={member.user.name}
              subtitle={t(K.staffStatus[member.status])}
              trailing={<Badge tone="neutral">{t(`role.${member.user.role}`)}</Badge>}
              onClick={() => {
                setSelectedCluster(null);
                setSelectedPin(member);
              }}
            />
          ))}
        </Card>
      </Sheet>
    </Screen>
  );
}

function StaffCard({ pin }: { pin: StaffPin }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const detailPath =
    pin.user.role === 'surveyor'
      ? `/admin/tracking/surveyor/${pin.user.id}`
      : `/admin/tracking/technician/${pin.user.id}`;

  return (
    <div className="stack gap-3">
      <div className="row between gap-2">
        <Badge
          tone={
            pin.status === 'onsite'
              ? 'success'
              : pin.status === 'lostSignal'
                ? 'error'
                : pin.status === 'idle'
                  ? 'neutral'
                  : 'accent'
          }
          dot
        >
          {t(K.staffStatus[pin.status])}
        </Badge>
        <Badge tone="neutral">{t(`role.${pin.user.role}`)}</Badge>
      </div>

      <div className="stack gap-1">
        <span className="label">{t(K.card.timeOnSite)}</span>
        <span className="t-sm">{pin.activeTaskLabel ?? t(K.card.noTask)}</span>
      </div>

      <div className="stack gap-1">
        <span className="label">{t(K.card.lastPing)}</span>
        <span className={`t-sm num ${pin.status === 'lostSignal' ? 't-error' : ''}`}>
          {pin.minutesSincePing >= 0
            ? t('time.minutesAgo', { count: pin.minutesSincePing })
            : '—'}
        </span>
      </div>

      {pin.status === 'lostSignal' && (
        <p className="t-xs t-error row gap-2">
          <WifiSlash size={14} className="shrink-0" />
          {t(K.staffStatus.lostSignal)}
        </p>
      )}

      <div className="row gap-2 wrap">
        <Button size="sm" variant="ghost" icon={<Phone size={16} />} onClick={() => {
          window.location.href = `tel:+91${pin.user.phone}`;
        }}>
          {t(K.card.call)}
        </Button>
        <Button size="sm" variant="ghost" icon={<ChatCircle size={16} />} onClick={() => {
          window.location.href = `sms:+91${pin.user.phone}`;
        }}>
          {t(K.card.message)}
        </Button>
        <Button size="sm" onClick={() => navigate(detailPath)}>
          {t(K.card.viewDetail)}
        </Button>
      </div>

      <span className="t-xs t-muted num">{formatPhone(pin.user.phone)}</span>
    </div>
  );
}
