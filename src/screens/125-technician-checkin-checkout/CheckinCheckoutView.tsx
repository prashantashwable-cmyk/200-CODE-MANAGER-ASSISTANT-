import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, CloudArrowUp, MapPinLine, Package, PauseCircle, ShieldWarning, SignOut, SignIn, Warning, WifiSlash, WarningCircle } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, MapCanvas, Screen, ScreenHeader, Sheet, TextArea, formatDate, formatDateTime, formatTime } from '@/design-system';
import type { SitePersonView, SiteVisitView } from '@/data/repository';
import type { GeoPoint, SiteLeaveReason } from '@/data/types';
import { LEAVE_NOTE_MIN, hm } from '@/features/technician/presence';
import { useCheckinCheckout } from './useCheckinCheckout';
import type { CheckinState } from './useCheckinCheckout';
import { CHECKIN_KEYS as K, LEAVE_REASONS, checkinPath, homePath, sopPath } from './checkin-checkout.types';

type T = ReturnType<typeof useTranslation>['t'];

const problemKey = (code: string) => (code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const VERDICT_TONE = { clean: 'success', borderline: 'warning', mismatch: 'error', unverified: 'warning' } as const;

/** A circle drawn as a polygon, for the map's trusted-radius zone. */
function circle(centre: GeoPoint, metres: number): GeoPoint[] {
  const dLat = metres / 111_000;
  const dLng = metres / (111_000 * Math.cos((centre.lat * Math.PI) / 180));
  return Array.from({ length: 28 }, (_, i) => ({ lat: centre.lat + dLat * Math.sin((i / 28) * 2 * Math.PI), lng: centre.lng + dLng * Math.cos((i / 28) * 2 * Math.PI) }));
}

const dur = (t: T, minutes: number) => {
  const { h, m } = hm(minutes);
  return t(K.duration, { h, m });
};

/** `yyyy-mm-ddThh:mm` in the phone's own clock, for a datetime-local field. */
const localInput = (ms: number): string => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * Screen 125 — Technician Live Location Check-In/Check-Out. The one true record of who was on site and when (014, 122 and every duration
 * read it): arriving is GPS-verified against the job's site with the same accuracy-aware confidence as the surveyor's site visit (a phone
 * in a canyon of towers is judged against its own margin of error, and an arrival that cannot be explained can still be made with a reason),
 * each person's visits are their own, a forgotten check-out is asked about the next time the app opens, and leaving with steps still open
 * is told to Admin. Nothing waits on the network.
 */
export function CheckinCheckoutView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useCheckinCheckout();
  const lang = i18n.language;
  const [leaving, setLeaving] = useState(false);

  if (s.status === 'loading' && !s.view) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'not_found') {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <EmptyState icon={<Package size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.back)} onAction={() => navigate(homePath)} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const v = s.view;
  const stale = v.mine?.stale ? v.mine : null;
  const open = v.mine && !v.mine.stale ? v.mine : null;

  return (
    <Screen width="default" className={!stale && (open || !v.problem) ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={s.toJob} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />
      <SyncBanner s={s} t={t} />
      {s.failed.length > 0 && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
          <div className="stack gap-2" role="alert">
            <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}>
              <Warning size={18} color="var(--color-error)" aria-hidden="true" /> {t(K.failed.title)}
            </strong>
            {s.failed.map((f) => (
              <p key={f.id} className="t-sm">
                {t(K.failed.item, { reason: t(problemKey(f.code)) })}
              </p>
            ))}
            <div>
              <Button size="sm" variant="secondary" onClick={s.dismissFailed}>
                {t(K.failed.dismiss)}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="main-aside">
        <div className="stack gap-4" style={{ minWidth: 0 }}>
          {stale && <StaleCard visit={stale} s={s} t={t} lang={lang} />}
          {!stale && v.elsewhere && <ElsewhereCard s={s} t={t} />}
          {!stale && !v.elsewhere && open && <OnSiteCard visit={open} s={s} t={t} lang={lang} />}
          {!stale && !v.elsewhere && !open && <ArriveCard s={s} t={t} lang={lang} />}
        </div>
        <div className="stack gap-4" style={{ minWidth: 0 }}>
          <Team s={s} t={t} lang={lang} />
          <Days s={s} t={t} lang={lang} />
        </div>
      </div>
      <div className="mt-4">
        <Visits s={s} t={t} lang={lang} />
      </div>

      {open && !leaving && (
        <ActionBar>
          <Button block variant="secondary" icon={<SignOut size={18} aria-hidden="true" />} onClick={() => setLeaving(true)}>
            {t(K.checkOut.button)}
          </Button>
        </ActionBar>
      )}
      <LeaveSheet open={leaving} onClose={() => setLeaving(false)} s={s} t={t} />
    </Screen>
  );
}

/* ---------------------------------------------------------------- pieces */

function SyncBanner({ s, t }: { s: CheckinState; t: T }) {
  const waiting = s.queue.length;
  if (s.isOnline && waiting === 0) return null;
  return (
    <Card className="mb-3" style={{ borderColor: s.isOnline ? undefined : 'var(--color-warning)' }}>
      <div className="stack gap-1">
        {!s.isOnline && (
          <p className="t-sm row gap-2" style={{ alignItems: 'center' }}>
            <WifiSlash size={16} color="var(--color-warning)" aria-hidden="true" /> {t(K.sync.offline)}
          </p>
        )}
        {waiting > 0 && (
          <p className="t-sm row gap-2" style={{ alignItems: 'center' }}>
            <CloudArrowUp size={16} aria-hidden="true" /> {t(s.syncing ? K.sync.syncing : K.sync.queued, { count: waiting })}
          </p>
        )}
      </div>
    </Card>
  );
}

/** The map and the plain-words distance: where the phone is against where the site is, and whether that will be believed. */
function Where({ s, t }: { s: CheckinState; t: T }) {
  const v = s.view!;
  const { geo, read } = s;
  const site = v.job.location;
  const markers = [
    { id: 'site', lat: site.lat, lng: site.lng, label: t(K.gps.site), tone: 'accent' as const, glyph: 'S' },
    ...(geo.point ? [{ id: 'me', lat: geo.point.lat, lng: geo.point.lng, label: t(K.gps.you), tone: 'emerald' as const, glyph: '·', pulsing: true }] : []),
  ];
  const span = Math.max(0.004, geo.point ? Math.abs(geo.point.lat - site.lat) * 1.6 : 0, geo.point ? Math.abs(geo.point.lng - site.lng) * 1.6 : 0);
  const bounds = { minLat: site.lat - span, maxLat: site.lat + span, minLng: site.lng - span * 1.4, maxLng: site.lng + span * 1.4 };
  const verdict = geo.phase !== 'ready' || !read ? 'waiting' : read.verdict;
  return (
    <div className="stack gap-2">
      <MapCanvas label={t(K.gps.map)} markers={markers} zones={[{ id: 'radius', points: circle(site, v.job.radiusM), tone: 'emerald' }]} bounds={bounds} height={180} />
      <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
        <Badge tone={verdict === 'waiting' ? 'neutral' : VERDICT_TONE[verdict]}>{t(K.verdict[verdict])}</Badge>
        <span className="t-xs t-muted">{t(v.job.largeSite ? K.gps.largeSite : K.gps.radius, { radius: v.job.radiusM })}</span>
      </div>
      <p className="t-sm" role="status">
        {geo.phase === 'locating' && t(K.gps.locating)}
        {geo.phase === 'denied' && t(K.gps.denied)}
        {geo.phase === 'unavailable' && t(K.gps.unavailable)}
        {geo.phase === 'ready' && read && read.driftM !== null && t(K.gps.distance, { distance: read.driftM, accuracy: geo.accuracyM ?? '?' })}
      </p>
      {geo.phase === 'ready' && read?.weak && <p className="t-xs t-warning">{t(K.gps.weak)}</p>}
      {(geo.phase === 'denied' || geo.phase === 'unavailable') && (
        <div>
          <Button size="sm" variant="secondary" onClick={s.retryGeo}>
            {t(K.gps.retry)}
          </Button>
        </div>
      )}
    </div>
  );
}

function ArriveCard({ s, t, lang }: { s: CheckinState; t: T; lang: string }) {
  const v = s.view!;
  const { geo, read } = s;
  const [reason, setReason] = useState('');
  const [noGps, setNoGps] = useState(false);
  const blocked = v.problem;
  const needsReason = noGps || (geo.phase === 'ready' && (read?.verdict === 'mismatch' || read?.verdict === 'unverified'));
  const reasonOk = reason.trim().length >= s.reasonMin;
  const located = geo.phase === 'ready' && !!geo.point;
  const canSubmit = !blocked && (located || noGps) && (!needsReason || reasonOk);
  const noGpsAvailable = geo.phase === 'denied' || geo.phase === 'unavailable';
  return (
    <Card>
      <div className="stack gap-3">
        <div className="stack gap-1">
          <h2 className="t-lg t-semibold">{t(K.checkIn.heading)}</h2>
          <p className="t-sm t-muted">{t(K.checkIn.body)}</p>
        </div>
        {blocked ? (
          <p className="t-sm t-warning row-top gap-2" role="status">
            {blocked === 'job_on_hold' ? <PauseCircle size={18} className="shrink-0" aria-hidden="true" /> : <Package size={18} className="shrink-0" aria-hidden="true" />}
            {blocked === 'not_scheduled_yet' ? t(K.blocked.notScheduled, { date: formatDate(v.job.scheduledFor, lang) }) : blocked === 'job_on_hold' ? t(K.blocked.onHold) : t(K.blocked.closed)}
          </p>
        ) : (
          <>
            {!noGps && <Where s={s} t={t} />}
            {read?.verdict === 'borderline' && geo.phase === 'ready' && !noGps && <p className="t-xs t-muted">{t(K.checkIn.borderline)}</p>}
            {noGpsAvailable && (
              <Checkbox checked={noGps} onChange={setNoGps} label={<span className="t-sm">{t(K.checkIn.noGpsToggle)}</span>} />
            )}
            {needsReason && (
              <Field label={t(K.checkIn.reason)} hint={t(noGps ? K.checkIn.reasonNoGps : K.checkIn.reasonMismatch, { count: s.reasonMin })} required>
                {({ id, describedBy }) => (
                  <div className="stack gap-1">
                    <TextArea id={id} aria-describedby={describedBy} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                    {reasonOk && (
                      <span className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}>
                        <CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.checkIn.reasonHint)}
                      </span>
                    )}
                  </div>
                )}
              </Field>
            )}
          </>
        )}
      </div>
      {!blocked && (
        <ActionBar>
          <Button block disabled={!canSubmit} icon={<SignIn size={18} aria-hidden="true" />} onClick={() => s.checkIn(reason, noGps)}>
            {t(K.checkIn.button)}
          </Button>
        </ActionBar>
      )}
    </Card>
  );
}

function OnSiteCard({ visit, s, t, lang }: { visit: SiteVisitView; s: CheckinState; t: T; lang: string }) {
  const v = s.view!;
  const minutes = Math.max(0, Math.floor((s.now - new Date(visit.checkInAt).getTime()) / 60_000));
  const secs = Math.max(0, Math.floor((s.now - new Date(visit.checkInAt).getTime()) / 1000)) % 60;
  const today = v.team.find((p) => p.userId === visit.userId);
  const far = s.read && s.read.driftM !== null && s.read.verdict === 'mismatch';
  return (
    <Card style={{ borderColor: 'var(--color-success)' }}>
      <div className="stack gap-3">
        <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
          <h2 className="t-lg t-semibold row gap-2" style={{ alignItems: 'center' }}>
            <MapPinLine size={20} color="var(--color-success)" weight="fill" aria-hidden="true" /> {t(K.onSite.heading)}
          </h2>
          <Badge tone={VERDICT_TONE[visit.verdict]}>{t(K.verdict[visit.verdict])}</Badge>
        </div>
        <div className="stack">
          <span className="t-xs t-muted">{t(K.onSite.live)}</span>
          <strong className="t-mono" style={{ fontSize: 'var(--fs-2xl, 2rem)' }} data-testid="live-duration" aria-live="off">
            {String(Math.floor(minutes / 60)).padStart(2, '0')}:{String(minutes % 60).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </strong>
          <span className="t-sm t-muted">{t(K.onSite.since, { time: formatTime(visit.checkInAt, lang) })}{visit.local ? ` · ${t(K.sync.notSent)}` : ''}</span>
        </div>
        {today && <p className="t-sm">{t(K.onSite.today, { total: dur(t, today.minutes + minutes), count: today.days + 1 })}</p>}
        {s.geo.phase === 'ready' && s.read?.driftM !== null && s.read && <p className="t-sm t-muted">{t(K.onSite.distance, { distance: s.read.driftM, accuracy: s.geo.accuracyM ?? '?' })}</p>}
        {far && <p className="t-sm t-warning">{t(K.onSite.farNow)}</p>}
        <Where s={s} t={t} />
      </div>
    </Card>
  );
}

function ElsewhereCard({ s, t }: { s: CheckinState; t: T }) {
  const e = s.view!.elsewhere!;
  return (
    <Card style={{ borderColor: 'var(--color-warning)' }}>
      <div className="stack gap-2">
        <h2 className="t-md t-semibold">{t(K.elsewhere.title)}</h2>
        <p className="t-sm">{t(K.elsewhere.body, { site: e.siteName, code: e.code })}</p>
        <div>
          <Button size="sm" variant="secondary" onClick={() => s.goto(checkinPath(e.jobId))}>
            {t(K.elsewhere.action)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** They forgot to check out: ask when they left, now, rather than leaving "still checked in" to distort the record. */
function StaleCard({ visit, s, t, lang }: { visit: SiteVisitView; s: CheckinState; t: T; lang: string }) {
  const suggested = useMemo(() => {
    const ci = new Date(visit.checkInAt);
    const evening = new Date(ci);
    evening.setHours(18, 0, 0, 0);
    return Math.min(Date.now(), Math.max(evening.getTime(), ci.getTime() + 3_600_000));
  }, [visit.checkInAt]);
  const [when, setWhen] = useState(localInput(suggested));
  const [note, setNote] = useState('');
  const at = new Date(when).getTime();
  const problem = Number.isNaN(at) ? 'invalid' : at < new Date(visit.checkInAt).getTime() ? 'early' : at > Date.now() + 60_000 ? 'future' : null;
  return (
    <Card style={{ borderColor: 'var(--color-warning)' }} >
      <div className="stack gap-3" role="alert">
        <h2 className="t-lg t-semibold row gap-2" style={{ alignItems: 'center' }}>
          <WarningCircle size={22} color="var(--color-warning)" aria-hidden="true" /> {t(K.stale.title)}
        </h2>
        <p className="t-sm">{t(K.stale.body, { site: s.view!.job.siteName, since: formatDateTime(visit.checkInAt, lang) })}</p>
        <Field label={t(K.stale.when)} hint={t(K.stale.whenHint)} required error={problem === 'early' ? t(K.stale.tooEarly) : problem === 'future' ? t(K.stale.inFuture) : undefined}>
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="datetime-local" value={when} max={localInput(Date.now())} min={localInput(new Date(visit.checkInAt).getTime())} onChange={(e) => setWhen(e.target.value)} invalid={!!problem} />}
        </Field>
        <Field label={t(K.stale.note)}>{({ id }) => <TextArea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        <Button disabled={!!problem} icon={<CheckCircle size={18} aria-hidden="true" />} onClick={() => s.confirmLate(visit.id, new Date(when).toISOString(), note)}>
          {t(K.stale.confirm)}
        </Button>
      </div>
    </Card>
  );
}

function LeaveSheet({ open, onClose, s, t }: { open: boolean; onClose: () => void; s: CheckinState; t: T }) {
  const steps = s.view?.openSteps ?? [];
  const [reason, setReason] = useState<SiteLeaveReason>('end_of_day');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!open) {
      setReason('end_of_day');
      setNote('');
    }
  }, [open]);
  const needsReason = steps.length > 0;
  const noteShort = needsReason && reason === 'other' && note.trim().length < LEAVE_NOTE_MIN;
  const safetyOpen = steps.some((x) => x.safetyCritical && x.current);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.checkOut.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        {needsReason ? (
          <>
            <p className="t-sm">{t(K.checkOut.openIntro, { count: steps.length })}</p>
            <ul className="stack gap-1" style={{ paddingLeft: 'var(--space-4)' }}>
              {steps.map((x) => (
                <li key={x.id} className="t-sm">
                  {t(x.labelKey)}
                  {x.safetyCritical && <ShieldWarning size={14} color="var(--color-warning)" aria-label={t(K.checkOut.safety)} style={{ marginLeft: 6 }} />}
                </li>
              ))}
            </ul>
            <p className="t-xs t-muted">{t(K.checkOut.openWarn)}</p>
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.checkOut.why)}</strong>
              <div className="row gap-2 wrap" role="group" aria-label={t(K.checkOut.why)}>
                {LEAVE_REASONS.map((r) => (
                  <Chip key={r} pressed={reason === r} onClick={() => setReason(r)}>
                    {t(K.checkOut.reason[r])}
                  </Chip>
                ))}
              </div>
              <span className="t-xs t-muted">{t(K.checkOut.reasonHint[reason])}</span>
            </div>
            {(reason === 'other' || safetyOpen) && (
              <Field label={t(K.checkOut.noteLabel)} hint={t(K.checkOut.noteHint, { count: LEAVE_NOTE_MIN })} required={reason === 'other'}>
                {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
              </Field>
            )}
            <div className="row gap-2 wrap">
              <Button variant="secondary" onClick={() => s.goto(sopPath(s.view!.job.id))}>
                {t(K.checkOut.toChecklist)}
              </Button>
              <Button disabled={noteShort} onClick={() => { s.checkOut(reason, note); onClose(); }}>
                {t(K.checkOut.confirmOpen)}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="t-sm">{t(K.checkOut.plain)}</p>
            <Button onClick={() => { s.checkOut(undefined, ''); onClose(); }}>{t(K.checkOut.confirm)}</Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

function Team({ s, t, lang }: { s: CheckinState; t: T; lang: string }) {
  const v = s.view!;
  return (
    <Card>
      <div className="stack gap-3">
        <h2 className="t-md t-semibold">{t(K.team.heading)}</h2>
        {v.team.map((p) => (
          <TeamRow key={p.userId} p={p} t={t} lang={lang} />
        ))}
      </div>
    </Card>
  );
}

function TeamRow({ p, t, lang }: { p: SitePersonView; t: T; lang: string }) {
  return (
    <div className="stack gap-1" data-person={p.userId}>
      <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
        <strong className="t-sm">
          {p.name} <span className="t-xs t-muted">· {t(p.role === 'lead' ? K.team.lead : K.team.assistant)}</span>
        </strong>
        {p.onSiteNow ? <Badge tone="success" dot="live">{t(K.team.onSite, { time: p.since ? formatTime(p.since, lang) : '' })}</Badge> : p.lastLeftAt ? <Badge tone="neutral">{t(K.team.left, { date: formatDateTime(p.lastLeftAt, lang) })}</Badge> : <Badge tone="neutral">{t(K.team.notYet)}</Badge>}
      </div>
      <span className="t-xs t-muted">{t(K.team.total, { total: dur(t, p.minutes), count: p.days })}</span>
      {p.unconfirmed && <span className="t-xs t-warning">{t(K.team.unconfirmed)}</span>}
    </div>
  );
}

function Days({ s, t, lang }: { s: CheckinState; t: T; lang: string }) {
  const v = s.view!;
  return (
    <Card>
      <div className="stack gap-3">
        <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}>
          <Clock size={18} aria-hidden="true" /> {t(K.days.heading)}
        </h2>
        {v.days.length === 0 ? (
          <p className="t-sm t-muted">{t(K.days.empty)}</p>
        ) : (
          <>
            <p className="t-sm">
              <strong className="t-mono">{dur(t, v.totals.minutes)}</strong> · {t(K.days.total, { count: v.totals.days })}
            </p>
            {v.totals.unconfirmed > 0 && <p className="t-xs t-warning">{t(K.days.unconfirmed, { count: v.totals.unconfirmed })}</p>}
            <div className="stack gap-2">
              {v.days.slice(0, 12).map((d) => (
                <div key={d.date} className="stack" data-day={d.date}>
                  <div className="row between gap-2">
                    <span className="t-sm">{formatDate(`${d.date}T12:00:00`, lang)}</span>
                    <span className="t-sm t-mono">{dur(t, d.minutes)}</span>
                  </div>
                  {d.people.length > 1 && <span className="t-xs t-muted">{d.people.map((p) => `${p.name.split(' ')[0]} ${dur(t, p.minutes)}`).join(' · ')}</span>}
                </div>
              ))}
            </div>
          </>
        )}
        <p className="t-xs t-muted">{v.typical ? t(K.days.typical, { hours: Math.round(v.typical.medianMinutes / 60), days: v.typical.medianDays, jobs: v.typical.jobs }) : t(K.days.typicalNone)}</p>
      </div>
    </Card>
  );
}

function Visits({ s, t, lang }: { s: CheckinState; t: T; lang: string }) {
  const v = s.view!;
  const [all, setAll] = useState(false);
  const shown = all ? v.visits : v.visits.slice(0, 6);
  return (
    <section className="stack gap-2" aria-label={t(K.visits.heading)}>
      <h2 className="t-md t-semibold">{t(K.visits.heading)}</h2>
      {v.visits.length === 0 ? (
        <Card>
          <p className="t-sm t-muted">{t(K.visits.empty)}</p>
        </Card>
      ) : (
        <div className="grid-auto" style={{ ['--min' as string]: '300px' }}>
        {shown.map((x) => (
          <Card key={x.id}>
            <div className="stack gap-1" data-visit={x.id}>
              <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
                <strong className="t-sm">
                  {formatDate(x.checkInAt, lang)} · {x.checkOutAt ? t(K.visits.inOut, { from: formatTime(x.checkInAt, lang), to: formatTime(x.checkOutAt, lang) }) : t(K.visits.stillIn, { from: formatTime(x.checkInAt, lang) })}
                </strong>
                <Badge tone={VERDICT_TONE[x.verdict]}>{t(K.verdict[x.verdict])}</Badge>
              </div>
              <span className="t-xs t-muted">
                {x.name} · {x.checkOutAt ? dur(t, x.minutes) : x.stale ? t(K.visits.forgotten) : dur(t, x.minutes)}
                {x.driftM !== null ? ` · ${t(K.visits.drift, { drift: x.driftM, accuracy: x.accuracyM ?? '?' })}` : ''}
              </span>
              {x.kind === 'confirmed_late' && <span className="t-xs t-warning">{t(K.visits.lateConfirmed)}</span>}
              {x.reason && <span className="t-xs">{t(K.visits.reason, { reason: x.reason })}</span>}
              {x.leave && <span className="t-xs t-muted">{t(K.visits.left, { reason: t(K.checkOut.reason[x.leave.reason]) })} · {t(K.visits.openSteps, { count: x.leave.openSteps })}{x.leave.note ? ` · ${x.leave.note}` : ''}</span>}
              {x.local && <span className="t-xs t-muted row gap-1" style={{ alignItems: 'center' }}><CloudArrowUp size={12} aria-hidden="true" /> {t(K.sync.notSent)}</span>}
            </div>
          </Card>
        ))}
        </div>
      )}
      {v.visits.length > 6 && (
        <div>
          <Button size="sm" variant="ghost" onClick={() => setAll(!all)}>
            {t(all ? K.visits.less : K.visits.more, { count: v.visits.length })}
          </Button>
        </div>
      )}
    </section>
  );
}
