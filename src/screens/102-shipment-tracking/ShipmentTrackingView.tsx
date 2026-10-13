import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Package, Phone, Truck, Warning, WifiSlash } from '@phosphor-icons/react';
import {
  AscensionLine,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  formatDate,
  formatTime,
  relativeTimeParts,
  useToast,
} from '@/design-system';
import type { AscensionStep, BadgeTone, MapBounds, MapMarker, MapRoute } from '@/design-system';
import type { ShipmentView } from '@/data/repository';
import type { ShipmentMilestone } from '@/data/types';
import { splitMinutes, roundToQuarter } from '@/features/logistics/shipmentTracking';
import { useShipmentTracking } from './useShipmentTracking';
import type { ActionResult, ShipmentTrackingState } from './useShipmentTracking';
import { SHIPMENT_TRACKING_KEYS as K, TRACKING_SOURCES } from './shipment-tracking.types';

type T = ReturnType<typeof useTranslation>['t'];

const FEED_TONE: Record<ShipmentView['feed'], BadgeTone> = { live: 'success', lost: 'error', manual: 'neutral' };
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/** "1 h 24 min" / "12 min", from a count of minutes. */
function durationText(t: T, total: number): string {
  const { hours, minutes } = splitMinutes(total);
  return hours > 0 ? t(K.hero.hoursMinutes, { hours, minutes }) : t(K.hero.minutesOnly, { minutes });
}

/** Room around the route so the pins never sit on the map's edge. */
function boundsOf(points: { lat: number; lng: number }[]): MapBounds {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const padLat = Math.max(0.02, (Math.max(...lats) - Math.min(...lats)) * 0.15);
  const padLng = Math.max(0.02, (Math.max(...lngs) - Math.min(...lngs)) * 0.15);
  return { minLat: Math.min(...lats) - padLat, maxLat: Math.max(...lats) + padLat, minLng: Math.min(...lngs) - padLng, maxLng: Math.max(...lngs) + padLng };
}

/**
 * Screen 102 — Live Shipment Tracking. One answer first: where is it and when
 * does it arrive. A live vehicle is on the map; a manual one is a milestone
 * card, never a pin that isn't real; a dropped feed says how stale the last fix is.
 */
export function ShipmentTrackingView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const toast = useToast();
  const navigate = useNavigate();
  const s = useShipmentTracking();

  const report = (r: ActionResult, success: string) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    toast.push(t(success), 'success');
  };

  const subtitle = s.isAdmin ? K.subtitleAdmin : s.isSupplier ? K.subtitleSupplier : s.isCustomer ? K.subtitleCustomer : K.subtitleTechnician;

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.board) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const header = (
    <ScreenHeader
      title={t(K.title)}
      subtitle={t(subtitle)}
      action={
        s.canDispatch ? (
          <div className="row gap-2 wrap">
            <Button size="sm" icon={<Truck size={16} />} onClick={() => s.openDispatch()}>
              {t(K.dispatch.open)}
            </Button>
            {s.isAdmin && (
              <Button size="sm" variant="secondary" onClick={() => navigate('/delivery-partners?tab=book')}>
                {t(K.dispatch.bookCarrier)}
              </Button>
            )}
          </div>
        ) : undefined
      }
    />
  );

  return (
    <Screen width="wide">
      {header}
      {s.shipments.length === 0 || !s.selected ? (
        <EmptyState
          icon={<Truck size={32} />}
          title={t(K.empty.title)}
          body={t(s.isCustomer ? K.empty.bodyCustomer : K.empty.bodyAdmin)}
        />
      ) : (
        <div className="stack gap-3">
          {s.shipments.length > 1 && <LegPicker s={s} t={t} />}
          <div className="main-aside">
            <div className="stack gap-3">
              <Hero leg={s.selected} now={s.now} lang={lang} t={t} isCustomer={s.isCustomer} onUpdate={s.openUpdate} canUpdate={s.selected.canUpdate} />
              <WindowBanner leg={s.selected} lang={lang} t={t} />
              {s.selected.position && <TrackMap leg={s.selected} t={t} lang={lang} />}
            </div>
            <div className="stack gap-3">
              <Timeline leg={s.selected} t={t} lang={lang} isCustomer={s.isCustomer} isAdmin={s.isAdmin} />
              <Details leg={s.selected} t={t} lang={lang} isCustomer={s.isCustomer} isAdmin={s.isAdmin} canCheck={s.isAdmin || (!s.isSupplier && !s.isCustomer)} navigate={navigate} />
            </div>
          </div>
        </div>
      )}
      <DispatchSheet s={s} t={t} report={report} />
      <UpdateSheet s={s} t={t} report={report} />
    </Screen>
  );
}

/* ------------------------------------------------------------ leg picker */

function LegPicker({ s, t }: { s: ShipmentTrackingState; t: T }) {
  return (
    <section className="stack gap-2" aria-label={t(K.list.heading)}>
      <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group">
        {s.shipments.map((leg) => {
          const on = leg.legId === s.selected?.legId;
          return (
            <Chip key={leg.legId} pressed={on} onClick={() => s.select(leg.legId)}>
              {leg.poCode}
              {leg.legCount > 1 ? ` · ${t(K.list.legOf, { n: leg.legNumber, total: leg.legCount })}` : ''} · {leg.arrived ? t(K.list.arrivedBadge) : t(K.milestone[leg.milestone])}
            </Chip>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- the hero */

function Hero({ leg, now, lang, t, isCustomer, onUpdate, canUpdate }: { leg: ShipmentView; now: number; lang: string; t: T; isCustomer: boolean; onUpdate: () => void; canUpdate: boolean }) {
  const navigate = useNavigate();
  const minutesLeft = Math.round((new Date(leg.etaAt).getTime() - now) / 60_000);
  const arrivedAt = leg.timeline.find((e) => e.milestone === 'arrived')?.reachedAt ?? null;
  const fix = leg.fixAt ? relativeTimeParts(leg.fixAt, now) : null;
  const lastManual = [...leg.timeline].reverse().find((e) => e.reachedAt && e.source === 'manual');

  let headline: string;
  let sub: string | null = null;
  if (leg.arrived) {
    headline = isCustomer ? t(K.customer.arrived) : t(K.hero.arrivedAt, { time: arrivedAt ? formatTime(arrivedAt, lang) : '' });
  } else if (isCustomer) {
    headline = leg.milestone === 'nearby' ? t(K.customer.nearby) : leg.milestone === 'dispatched' ? t(K.customer.dispatched) : t(K.customer.onTheWay);
    sub = t(K.customer.around, { time: formatTime(roundToQuarter(leg.etaAt).toISOString(), lang) });
  } else if (minutesLeft >= 0) {
    headline = t(K.hero.etaIn, { duration: durationText(t, minutesLeft) });
    sub = t(K.hero.etaAt, { time: formatTime(leg.etaAt, lang) });
  } else {
    headline = t(K.hero.etaLate, { duration: durationText(t, -minutesLeft) });
    sub = t(K.hero.etaAt, { time: formatTime(leg.etaAt, lang) });
  }

  return (
    <Card>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap">
          <div className="row gap-2 wrap">
            <Badge tone={leg.arrived ? 'success' : FEED_TONE[leg.feed]}>{leg.arrived ? t(K.milestone.arrived) : t(K.feed[leg.feed])}</Badge>
            <span className="t-sm t-muted">
              {leg.poCode} · {leg.siteName}
            </span>
          </div>
          {leg.legCount > 1 && <span className="t-xs t-muted">{t(K.list.legOf, { n: leg.legNumber, total: leg.legCount })}</span>}
        </div>
        <p className="t-xl t-semibold" aria-live="polite">
          {headline}
        </p>
        {sub && <p className="t-sm t-muted">{sub}</p>}
        {!isCustomer && !leg.arrived && leg.feed === 'live' && leg.remainingKm != null && (
          <p className="t-sm">{t(K.hero.remainingKm, { km: Math.max(0.1, Math.round(leg.remainingKm * 10) / 10) })}</p>
        )}
        {!isCustomer && leg.feed === 'lost' && !leg.arrived && (
          <div className="stack gap-1">
            <p className="t-sm t-error row-top gap-2" role="alert">
              <WifiSlash size={16} className="shrink-0" aria-hidden="true" />
              <span>
                {t(K.hero.lastKnown, { ago: fix ? t(fix.key, { count: fix.count }) : '' })} {t(K.hero.lostBody)}
              </span>
            </p>
          </div>
        )}
        {!isCustomer && leg.feed === 'manual' && !leg.arrived && (
          <p className="t-sm t-muted">
            {t(K.hero.manualBody)}
            {lastManual?.reachedAt ? ` ${t(K.hero.manualLast, { milestone: t(K.milestone[lastManual.milestone]).toLowerCase(), time: formatTime(lastManual.reachedAt, lang) })}` : ''}
          </p>
        )}
        {isCustomer && leg.feed !== 'live' && !leg.arrived && <p className="t-xs t-muted">{t(K.customer.manualHint)}</p>}
        {isCustomer && leg.arrived && (
          <div>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/delivery-confirmation?poId=${leg.poId}`)}>
              {t(K.customer.viewConfirmation)}
            </Button>
          </div>
        )}
        {canUpdate && (
          <div>
            <Button size="sm" variant={leg.feed === 'lost' ? 'primary' : 'secondary'} onClick={onUpdate}>
              {t(K.update.open)}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function WindowBanner({ leg, lang, t }: { leg: ShipmentView; lang: string; t: T }) {
  if (!leg.booked || leg.arrived) return null;
  const when = `${formatDate(`${leg.booked.date}T12:00:00`, lang)} · ${t(K.window[leg.booked.window])}`;
  return (
    <p className={`t-sm ${leg.etaOutsideWindow ? 't-warning' : 't-muted'} row-top gap-2`} role={leg.etaOutsideWindow ? 'alert' : undefined}>
      {leg.etaOutsideWindow ? <Warning size={16} className="shrink-0" aria-hidden="true" /> : <CalendarCheck size={16} className="shrink-0" aria-hidden="true" />}
      <span>{t(leg.etaOutsideWindow ? K.window.outside : K.window.inside, { when })}</span>
    </p>
  );
}

/* --------------------------------------------------------------- the map */

function TrackMap({ leg, t, lang }: { leg: ShipmentView; t: T; lang: string }) {
  const pos = leg.position!;
  const lost = leg.feed === 'lost';
  const markers = useMemo<MapMarker[]>(
    () => [
      { id: 'origin', lat: leg.origin.lat, lng: leg.origin.lng, tone: 'muted', label: t(K.map.origin, { name: leg.origin.name }) },
      { id: 'site', lat: leg.destination.lat, lng: leg.destination.lng, tone: 'emerald', glyph: '⌂', label: t(K.map.site, { name: leg.siteName }) },
      {
        id: 'vehicle',
        lat: pos.lat,
        lng: pos.lng,
        tone: lost ? 'error' : leg.arrived ? 'success' : 'accent',
        glyph: lost ? '!' : undefined,
        pulsing: !lost && !leg.arrived,
        selected: true,
        label: lost && leg.fixAt ? t(K.map.lastKnown, { time: formatTime(leg.fixAt, lang) }) : t(K.map.vehicle),
      },
    ],
    [leg.origin, leg.destination, leg.siteName, pos.lat, pos.lng, lost, leg.arrived, leg.fixAt, t, lang],
  );
  const routes = useMemo<MapRoute[]>(
    () => [
      { id: 'planned', points: leg.route, tone: 'muted', dashed: true },
      { id: 'travelled', points: leg.travelled, tone: lost ? 'error' : 'accent' },
    ],
    [leg.route, leg.travelled, lost],
  );
  // Fitted to the whole route once per leg, never to the moving vehicle.
  const bounds = useMemo(() => boundsOf(leg.route), [leg.route]);

  return (
    <Card className="ds-card--flush">
      <MapCanvas key={leg.legId} label={t(K.map.label)} markers={markers} routes={routes} bounds={bounds} height={340}>
        <div
          className="ds-map__overlay"
          style={{
            left: 'var(--space-2)',
            bottom: 'var(--space-2)',
            background: 'var(--color-surface)',
            border: 'var(--border-width) solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-2) var(--space-3)',
          }}
        >
          <div className="stack gap-1 t-xs">
            <span className="row gap-2">
              <span aria-hidden="true" style={{ width: 18, borderTop: `3px solid ${lost ? 'var(--color-error)' : 'var(--color-accent-primary)'}` }} />
              {t(K.map.legendTravelled)}
            </span>
            <span className="row gap-2">
              <span aria-hidden="true" style={{ width: 18, borderTop: '3px dashed var(--color-text-secondary)' }} />
              {t(K.map.legendPlanned)}
            </span>
          </div>
        </div>
      </MapCanvas>
    </Card>
  );
}

/* ------------------------------------------------------------- timeline */

function Timeline({ leg, t, lang, isCustomer, isAdmin }: { leg: ShipmentView; t: T; lang: string; isCustomer: boolean; isAdmin: boolean }) {
  const firstOpen = leg.timeline.findIndex((e) => !e.reachedAt);
  const steps: AscensionStep[] = leg.timeline.map((e, i) => {
    const bits: string[] = [];
    if (e.reachedAt) {
      bits.push(formatTime(e.reachedAt, lang));
      if (!isCustomer) bits.push(e.source === 'manual' ? (e.byName ? t(K.milestoneMeta.manualBy, { name: e.byName }) : t(K.milestoneMeta.manual)) : t(K.milestoneMeta.gps));
      if (isAdmin) bits.push(t(e.customerNotified ? K.milestoneMeta.notified : K.milestoneMeta.notNotified));
      if (!isCustomer && e.note) bits.push(`“${e.note}”`);
    }
    return { id: e.milestone, label: t(K.milestone[e.milestone as ShipmentMilestone]), meta: bits.join(' · ') || undefined, status: e.reachedAt ? 'complete' : i === firstOpen ? 'current' : 'upcoming' };
  });
  return (
    <Card>
      <section className="stack gap-2" aria-labelledby="timeline-heading">
        <h3 id="timeline-heading" className="t-md t-semibold">
          {t(K.detail.timelineHeading)}
        </h3>
        <AscensionLine steps={steps} className="ds-ascension--multiline" />
      </section>
    </Card>
  );
}

/* -------------------------------------------------------------- details */

function Details({ leg, t, lang, isCustomer, isAdmin, canCheck, navigate }: { leg: ShipmentView; t: T; lang: string; isCustomer: boolean; isAdmin: boolean; canCheck: boolean; navigate: (to: string) => void }) {
  return (
    <Card>
      <div className="stack gap-3">
        <section className="stack gap-2" aria-labelledby="lines-heading">
          <h3 id="lines-heading" className="t-md t-semibold">
            {t(K.detail.linesHeading)}
          </h3>
          <ul className="stack gap-1">
            {leg.lines.map((l) => (
              <li key={l.id} className="t-sm row gap-2">
                <Package size={16} aria-hidden="true" className="shrink-0" /> {l.description}
              </li>
            ))}
          </ul>
        </section>
        <dl className="stack gap-2 t-sm">
          {!isCustomer && leg.supplierName && <Row label={t(K.detail.supplier)} value={leg.supplierName} />}
          {!isCustomer && leg.partnerName && <Row label={t(K.detail.carrier)} value={leg.partnerName} />}
          {!isCustomer && leg.vehicleLabel && <Row label={t(K.detail.vehicle)} value={leg.vehicleLabel} />}
          {!isCustomer && leg.driverName && <Row label={t(K.detail.driver)} value={leg.driverName} />}
          <Row label={t(K.detail.from)} value={leg.origin.name} hide={isCustomer} />
          <Row label={t(K.detail.to)} value={leg.siteName} />
          <Row label={t(K.detail.dispatched)} value={`${formatDate(leg.dispatchedAt, lang)} · ${formatTime(leg.dispatchedAt, lang)}`} />
        </dl>
        {!isCustomer && leg.driverPhone && (
          <div>
            <a className="ds-btn ds-btn--secondary ds-btn--sm" href={`tel:${leg.driverPhone}`}>
              <Phone size={16} aria-hidden="true" /> {t(K.detail.callDriver)}
            </a>
          </div>
        )}
        {(isAdmin || canCheck) && (
          <div className="row gap-2 wrap">
            {canCheck && !leg.arrived && (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/delivery-checklist?poId=${leg.poId}`)}>
                {t(K.detail.checkDelivery)}
              </Button>
            )}
            {isAdmin && (
              <>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/orders?poId=${leg.poId}`)}>
                  {t(K.detail.openPo)}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/deliveries?poId=${leg.poId}`)}>
                  {t(K.detail.openDelivery)}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function Row({ label, value, hide }: { label: string; value: string; hide?: boolean }) {
  if (hide) return null;
  return (
    <div className="row between gap-3" style={{ alignItems: 'baseline' }}>
      <dt className="t-muted">{label}</dt>
      <dd style={{ textAlign: 'right' }}>{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------- dispatch */

function DispatchSheet({ s, t, report }: { s: ShipmentTrackingState; t: T; report: (r: ActionResult, success: string) => void }) {
  return (
    <Sheet open={s.dispatchOpen} onClose={() => s.setDispatchOpen(false)} title={t(K.dispatch.title)} closeLabel={t('action.close')}>
      {s.dispatchable.length === 0 ? (
        <EmptyState icon={<Package size={28} />} title={t(K.dispatch.nothing)} body={t(K.dispatch.nothingBody)} />
      ) : (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.dispatch.intro)}</p>
          <Field label={t(K.dispatch.po)}>
            {({ id }) => (
              <Select id={id} value={s.dispatchPo?.poId ?? ''} onChange={(e) => s.pickDispatchPo(e.target.value)}>
                {s.dispatchable.map((p) => (
                  <option key={p.poId} value={p.poId}>
                    {p.poCode} · {p.siteName}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <fieldset className="stack gap-1" style={{ border: 0, padding: 0 }}>
            <legend className="t-sm t-semibold">{t(K.dispatch.lines)}</legend>
            {s.dispatchPo?.lines.map((l) => (
              <Checkbox key={l.id} checked={s.lineIds.includes(l.id)} onChange={(v) => s.toggleLine(l.id, v)} label={l.description} />
            ))}
          </fieldset>
          <Field label={t(K.dispatch.vehicle)} hint={t(K.dispatch.vehicleHint)} required>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={s.vehicle} onChange={(e) => s.setVehicle(e.target.value)} />}
          </Field>
          <Field label={t(K.dispatch.driver)} required>
            {({ id }) => <Input id={id} value={s.driver} onChange={(e) => s.setDriver(e.target.value)} />}
          </Field>
          <Field label={t(K.dispatch.phone)}>
            {({ id }) => <Input id={id} type="tel" inputMode="tel" value={s.phone} onChange={(e) => s.setPhone(e.target.value)} />}
          </Field>
          <fieldset className="stack gap-2" style={{ border: 0, padding: 0 }}>
            <legend className="t-sm t-semibold">{t(K.dispatch.source)}</legend>
            {TRACKING_SOURCES.map((src) => (
              <label key={src} className="row-top gap-2">
                <input type="radio" name="shipment-source" checked={s.source === src} onChange={() => s.setSource(src)} />
                <span className="stack">
                  <span className="t-sm t-semibold">{t(src === 'live_gps' ? K.dispatch.sourceLive : K.dispatch.sourceManual)}</span>
                  <span className="t-xs t-muted">{t(src === 'live_gps' ? K.dispatch.sourceLiveHint : K.dispatch.sourceManualHint)}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="row gap-2">
            <Button disabled={!s.canDispatchNow} loading={s.busy} onClick={() => void s.dispatch().then((r) => report(r, K.toast.dispatched))}>
              {t(K.dispatch.submit)}
            </Button>
            <Button variant="ghost" onClick={() => s.setDispatchOpen(false)}>
              {t('action.cancel')}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* --------------------------------------------------------- manual update */

function UpdateSheet({ s, t, report }: { s: ShipmentTrackingState; t: T; report: (r: ActionResult, success: string) => void }) {
  const leg = s.selected;
  return (
    <Sheet open={s.updateOpen && !!leg} onClose={() => s.setUpdateOpen(false)} title={t(K.update.title)} closeLabel={t('action.close')}>
      {leg && s.offeredMilestones.length === 0 ? (
        <EmptyState icon={<Truck size={28} />} title={t(K.update.none)} body={t(K.update.noneBody)} />
      ) : (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(s.isAdmin ? K.update.introAdmin : K.update.intro)}</p>
          {leg?.feed === 'lost' && <p className="t-xs t-warning">{t(K.update.lostNote)}</p>}
          <Field label={t(K.update.milestone)} required>
            {({ id }) => (
              <Select id={id} value={s.milestone} onChange={(e) => s.setMilestone(e.target.value as ShipmentMilestone)}>
                {s.offeredMilestones.map((m) => (
                  <option key={m} value={m}>
                    {t(K.milestone[m])}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {s.milestone !== 'arrived' && (
            <Field label={t(K.update.eta)} hint={t(K.update.etaHint)}>
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="datetime-local" value={s.etaLocal} onChange={(e) => s.setEtaLocal(e.target.value)} />}
            </Field>
          )}
          <Field label={t(K.update.note)} hint={t(s.noteRequired ? K.update.noteHintAdmin : K.update.noteHint)} required={s.noteRequired}>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={s.note} onChange={(e) => s.setNote(e.target.value)} />}
          </Field>
          <div className="row gap-2">
            <Button disabled={!s.canUpdateNow} loading={s.busy} onClick={() => void s.submitUpdate().then((r) => report(r, K.toast.updated))}>
              {t(K.update.submit)}
            </Button>
            <Button variant="ghost" onClick={() => s.setUpdateOpen(false)}>
              {t('action.cancel')}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
