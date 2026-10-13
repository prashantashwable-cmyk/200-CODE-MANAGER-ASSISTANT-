import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, CheckCircle, Compass, MapPinLine, XCircle } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  StatTile,
  formatTime,
} from '@/design-system';
import type { MapMarker, MapRoute, MapTone } from '@/design-system';
import { useRoutePlan } from './useRoutePlan';
import { ROUTE_PLAN_KEYS as K } from './route-plan.types';
import type { RouteStop } from '@/data/types';

/** Badge tone (design-system semantic) per stop status. */
const STATUS_TONE = { pending: 'neutral', arrived: 'accent', done: 'success', skipped: 'error' } as const;
/** Map pin tone — a separate palette, since MapTone has no 'neutral'. */
const STATUS_MAP_TONE: Record<RouteStop['status'], MapTone> = {
  pending: 'muted',
  arrived: 'accent',
  done: 'success',
  skipped: 'error',
};

/**
 * Screen 039 — Surveyor Daily Route Plan. A sensible default plan without the
 * surveyor needing to think about what's most urgent — but purely advisory:
 * it never fights against real on-ground judgment, and skipping never
 * penalises anyone.
 */
export function RoutePlanView() {
  const { t, i18n } = useTranslation();
  const s = useRoutePlan();

  const markers = useMemo<MapMarker[]>(
    () =>
      s.stops.map((stop, index) => ({
        id: stop.id,
        lat: stop.location.lat,
        lng: stop.location.lng,
        tone: STATUS_MAP_TONE[stop.status],
        glyph: String(index + 1),
        label: stop.label,
      })),
    [s.stops],
  );

  const route = useMemo<MapRoute[]>(
    () =>
      s.stops.length > 1
        ? [{ id: 'today', points: s.stops.map((stop) => stop.location), tone: 'accent' }]
        : [],
    [s.stops],
  );

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
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

  if (s.status === 'empty') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <Card>
          <div className="row gap-3">
            <Compass size={22} className="t-emerald shrink-0" />
            <div className="stack gap-1">
              <span className="t-md t-semibold">{t(K.exploration.title)}</span>
              <span className="t-sm t-muted">{t(K.exploration.body)}</span>
            </div>
          </div>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <Card className="mb-4">
        <p className="t-xs t-muted">{t(K.advisoryNote)}</p>
      </Card>

      <div className="grid-auto mb-4" style={{ ['--min' as string]: '110px' }}>
        <Card>
          <StatTile label={t(K.summary.planned)} value={s.summary.plannedCount} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.done)} value={s.summary.doneCount} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.skipped)} value={s.summary.skippedCount} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.remaining)} value={s.summary.remainingCount} />
        </Card>
      </div>

      <MapCanvas label={t(K.mapLabel)} markers={markers} routes={route} height={280} />

      <div className="row gap-4 mt-2 mb-4">
        <span className="t-xs t-muted">
          {t(K.totals.distance, { km: s.totalKm })}
        </span>
        <span className="t-xs t-muted">{t(K.totals.time, { minutes: s.totalMinutes })}</span>
      </div>

      <div className="stack gap-2">
        {s.stops.map((stop, index) => (
          <StopCard
            key={stop.id}
            stop={stop}
            index={index}
            isFirst={index === 0}
            isLast={index === s.stops.length - 1}
            navigateUrl={s.navigateUrl(stop)}
            onAdvance={(next) => s.advanceStop(stop.id, next)}
            onMove={(direction) => s.moveStop(stop.id, direction)}
          />
        ))}
      </div>
    </Screen>
  );
}

function StopCard({
  stop,
  index,
  isFirst,
  isLast,
  navigateUrl,
  onAdvance,
  onMove,
}: {
  stop: RouteStop;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  navigateUrl: string;
  onAdvance: (next: RouteStop['status']) => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <Card riseIndex={index} selected={stop.status === 'arrived'}>
      <div className="row gap-3">
        <span className="t-lg t-semibold t-muted shrink-0" style={{ width: 24 }}>
          {index + 1}
        </span>
        <div className="grow stack gap-1" style={{ minWidth: 0 }}>
          <div className="row between gap-2">
            <span className="t-sm t-semibold truncate">{stop.label}</span>
            <Badge tone={STATUS_TONE[stop.status]}>{t(K.status[stop.status])}</Badge>
          </div>
          <span className="t-xs t-muted truncate">{stop.address}</span>
          <span className="t-xs t-muted">
            {t(K.stop.window, {
              start: formatTime(stop.windowStart, i18n.language),
              end: formatTime(stop.windowEnd, i18n.language),
            })}
            {stop.legKm > 0 && ` · ${t(K.stop.leg, { km: stop.legKm, minutes: stop.legMinutes })}`}
          </span>
        </div>
        <div className="stack gap-1 shrink-0">
          <button
            type="button"
            className="tappable"
            style={{ minWidth: 32, minHeight: 32 }}
            disabled={isFirst}
            onClick={() => onMove('up')}
            aria-label={t(K.stop.moveUp)}
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            className="tappable"
            style={{ minWidth: 32, minHeight: 32 }}
            disabled={isLast}
            onClick={() => onMove('down')}
            aria-label={t(K.stop.moveDown)}
          >
            <ArrowDown size={16} />
          </button>
        </div>
      </div>

      {(stop.status === 'pending' || stop.status === 'arrived') && (
        <div className="row gap-2 wrap mt-3">
          <Button
            size="sm"
            variant="ghost"
            icon={<MapPinLine size={13} />}
            onClick={() => window.open(navigateUrl, '_blank', 'noopener')}
          >
            {t(K.stop.navigate)}
          </Button>
          {stop.status === 'pending' && (
            <Button size="sm" variant="ghost" onClick={() => onAdvance('arrived')}>
              {t(K.stop.arrive)}
            </Button>
          )}
          <Button size="sm" icon={<CheckCircle size={13} />} onClick={() => onAdvance('done')}>
            {t(K.stop.complete)}
          </Button>
          <Button size="sm" variant="quiet" icon={<XCircle size={13} />} onClick={() => onAdvance('skipped')}>
            {t(K.stop.skip)}
          </Button>
        </div>
      )}
    </Card>
  );
}
