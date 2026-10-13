import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CheckCircle, Phone, User as UserIcon } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, formatINR, formatTime } from '@/design-system';
import type { MaintenanceDeskView, MaintenanceLiftView, MaintenanceSlotView, TechnicianProfile } from '@/data/repository';
import { ADHOC_NOTE_MIN } from '@/features/service/booking';
import { MAINTENANCE_KEYS as K, NOTICE_HOURS, planPath, requestPath } from './maintenance-booking.types';
import { useMaintenance } from './useMaintenance';
import type { MaintenanceState } from './useMaintenance';

type T = ReturnType<typeof useTranslation>['t'];
type Head = (sub: string, extra?: ReactNode) => ReactNode;
interface P { s: MaintenanceState; t: T; head: Head }
const telOf = (p: string | null) => (p ? `tel:${p.replace(/[^\d+]/g, '')}` : undefined);
const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;
const windowWord = (t: T, w: string) => t(`maintenance.window.${w}`);
const problemText = (t: T, code: string) => t(`maintenance.problem.${code}`, { hours: NOTICE_HOURS, defaultValue: t(K.problem.generic) });

/** Screen 178 — AMC / Maintenance Booking. The same visit record as a service request (175), booked by the customer themself: their cover said first, real slots only, a technician matched and named, and live arrival on the day. */
export function MaintenanceBookingScreen() {
  const { t } = useTranslation();
  const s = useMaintenance();
  const head: Head = (sub, extra) => <ScreenHeader title={t(K.title)} subtitle={sub} action={<span className="row gap-2">{extra}<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh)}</Button></span>} />;
  return s.ticketId ? <VisitScreen s={s} t={t} head={head} /> : <BookingScreen s={s} t={t} head={head} />;
}

function Choice({ selected, onClick, title, body, tag }: { selected: boolean; onClick: () => void; title: string; body?: string; tag?: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} data-choice={tag} className={`ds-card ${selected ? 'ds-card--selected' : ''}`.trim()} style={{ display: 'block', textAlign: 'left', width: '100%', minHeight: 'var(--tap-target)', cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={onClick}>
      <span className="stack gap-1"><span className="t-sm t-semibold">{title}</span>{body && <span className="t-xs t-muted">{body}</span>}</span>
    </button>
  );
}

function Tech({ p, t }: { p: TechnicianProfile; t: T }) {
  return (
    <div className="row gap-3" data-tech={p.id} style={{ alignItems: 'center' }}>
      <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-surface-alt)', border: '1px solid var(--color-accent-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><UserIcon size={22} /></span>
      <span className="stack gap-0">
        <span className="t-sm t-semibold">{p.name}</span>
        <span className="t-xs t-muted">{p.rating !== null ? t(K.tech.rating, { rating: p.rating.toFixed(1) }) : t(K.tech.unrated)} · {t(K.tech.jobs, { count: p.jobsDone })}</span>
      </span>
    </div>
  );
}

function Cover({ lift, t, lang }: { lift: MaintenanceLiftView; t: T; lang: string }) {
  const a = lift.amc;
  const date = a.state === 'warranty' ? lift.warrantyEndsOn : a.endsOn;
  const tone = a.state === 'active' ? 'success' : a.state === 'expiring' ? 'warning' : 'neutral';
  return (
    <Card>
      <div className="stack gap-2" data-cover={a.state}>
        <h2 className="t-md t-semibold">{t(K.cover.title)}</h2>
        <span className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}><Badge tone={tone}>{t(`maintenance.cover.state.${a.state}`, { date: date ? formatDate(date, lang) : '' })}</Badge></span>
        {(a.state === 'active' || a.state === 'expiring') && <p className="t-sm" data-visits>{t(K.cover.visits, { left: a.visitsLeft, total: a.visitsTotal })}</p>}
        {(a.state === 'expiring' || a.state === 'lapsed' || a.state === 'none' || a.state === 'warranty') && (
          <div className="stack gap-2" data-renew>
            <p className="t-sm t-muted">{a.state === 'warranty' ? t(K.cover.renew.none) : t(`maintenance.cover.renew.${a.state}`)}</p>
            <PlanLink jobId={lift.jobId} t={t} />
          </div>
        )}
      </div>
    </Card>
  );
}
function PlanLink({ jobId, t }: { jobId: string; t: T }) {
  return <a className="ds-btn ds-btn--secondary ds-btn--sm" data-plan href={planPath(jobId)}>{t(K.cover.renew.cta)}</a>;
}

function Days({ slots, value, onPick, lang, t }: { slots: MaintenanceSlotView[]; value: { date: string; window: 'morning' | 'afternoon' } | null; onPick: (s: MaintenanceSlotView) => void; lang: string; t: T }) {
  const dates = useMemo(() => [...new Set(slots.map((x) => x.date))], [slots]);
  const [day, setDay] = useState<string>(value?.date ?? dates[0] ?? '');
  const shown = dates.includes(day) ? day : dates[0] ?? '';
  return (
    <div className="stack gap-2" data-slots>
      <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 4 }} data-days>{dates.map((d) => <span key={d} data-day={d} style={{ flex: '0 0 auto' }}><Chip pressed={d === shown} onClick={() => setDay(d)}>{formatDate(d, lang)}</Chip></span>)}</div>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        {(['morning', 'afternoon'] as const).map((w) => {
          const slot = slots.find((x) => x.date === shown && x.window === w);
          return slot
            ? <Button key={w} size="sm" variant={value?.date === slot.date && value.window === w ? 'primary' : 'secondary'} data-slot={`${slot.date}:${w}`} onClick={() => onPick(slot)}>{windowWord(t, w)}</Button>
            : <Button key={w} size="sm" variant="ghost" disabled data-slot-none={w}>{windowWord(t, w)} · {t(K.slots.day.none)}</Button>;
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the booking desk */

function BookingScreen({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const d = s.desk;
  const [slot, setSlot] = useState<{ date: string; window: 'morning' | 'afternoon' } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  if (s.load === 'loading' && !d) return <Screen width="narrow">{head(t(K.subtitle))}<LoadingState label={t(K.loading)} variant="list" rows={3} /></Screen>;
  if (s.load === 'error' && !d) return <Screen width="narrow">{head(t(K.subtitle))}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!d) return null;
  if (s.result) return <Done s={s} t={t} head={head} lang={lang} />;
  const lift = d.lifts.find((l) => l.jobId === d.chosen) ?? null;
  if (!lift) return <Screen width="narrow">{head(t(K.subtitle))}<UrgentCard d={d} s={s} t={t} /><EmptyState title={t(K.noLift.title)} body={t(K.noLift.body)} /></Screen>;
  const chosenSlot = slot ? d.slots.find((x) => x.date === slot.date && x.window === slot.window) ?? null : null;
  const dr = s.draft;
  const noteOk = dr.purpose === 'routine' || lettersOf(dr.note) >= ADHOC_NOTE_MIN;
  const noSlots = d.slots.length === 0;
  const chargeable = !(lift.amc.state === 'active' || lift.amc.state === 'expiring') || lift.amc.visitsLeft <= 0;
  const submit = async (arrange: boolean) => { setProblem(null); const r = await s.book(lift.jobId, arrange ? null : slot); if (!r.ok) setProblem(r.problem); else setSlot(null); };
  return (
    <Screen width="narrow">
      {head(t(K.subtitle))}
      {s.offline && <p className="t-xs t-muted mb-2" data-offline>{t(K.error.body)}</p>}
      <div className="stack gap-3" data-form>
        <UrgentCard d={d} s={s} t={t} />
        {d.lifts.length > 1 && <Card><Field label={t(K.lift.label)}>{(p) => <Select id={p.id} value={lift.jobId} data-f="lift" onChange={(e) => { setSlot(null); s.pickLift(e.target.value); }}>{d.lifts.map((l) => <option key={l.jobId} value={l.jobId}>{l.siteName} · {l.code}</option>)}</Select>}</Field></Card>}
        <Cover lift={lift} t={t} lang={lang} />
        <Card>
          <div className="stack gap-2" data-section="purpose">
            <h2 className="t-md t-semibold">{t(K.purpose.title)}</h2>
            <div className="stack gap-2" role="radiogroup" aria-label={t(K.purpose.title)}>
              <Choice tag="routine" selected={dr.purpose === 'routine'} onClick={() => s.setDraft({ purpose: 'routine' })} title={t(K.purpose.routine.title)} body={t(K.purpose.routine.body)} />
              <Choice tag="adhoc" selected={dr.purpose === 'adhoc'} onClick={() => s.setDraft({ purpose: 'adhoc' })} title={t(K.purpose.adhoc.title)} body={t(K.purpose.adhoc.body)} />
            </div>
            <Field label={dr.purpose === 'adhoc' ? t(K.note.label.adhoc) : t(K.note.label.routine)} hint={t(K.note.hint)}>{(p) => <TextArea id={p.id} rows={3} value={dr.note} data-f="note" onChange={(e) => s.setDraft({ note: e.target.value })} />}</Field>
            <p className="t-sm" data-cost={chargeable ? 'chargeable' : 'included'}>{chargeable ? (lift.amc.estimatedPrice ? t(K.cover.chargeable, { price: formatINR(lift.amc.estimatedPrice) }) : t(K.cover.chargeableNoPrice)) : t(K.cover.free)}</p>
          </div>
        </Card>
        <Card>
          <div className="stack gap-2" data-section="when">
            <h2 className="t-md t-semibold">{t(K.slots.title)}</h2>
            {d.honesty === 'none_in_window' && d.earliest && <p className="t-sm" data-honesty="none_in_window">{t(K.slots.none.none_in_window, { date: formatDate(d.earliest.date, lang), window: windowWord(t, d.earliest.window).toLowerCase() })}</p>}
            {noSlots ? (
              <div className="stack gap-2" data-honesty={d.honesty}>
                {d.honesty !== 'none_in_window' && <p className="t-sm">{t(`maintenance.slots.none.${d.honesty === 'ok' ? 'none_soon' : d.honesty}`)}</p>}
                <p className="t-xs t-muted">{t(K.slots.arrange.body)}</p>
              </div>
            ) : <>{d.earliest && <p className="t-xs t-muted">{t(K.slots.earliest, { date: formatDate(d.earliest.date, lang), window: windowWord(t, d.earliest.window).toLowerCase() })}</p>}<Days slots={d.slots} value={slot} onPick={(x) => setSlot({ date: x.date, window: x.window })} lang={lang} t={t} /></>}
          </div>
        </Card>
        {chosenSlot?.technician && (
          <Card>
            <div className="stack gap-2" data-section="who">
              <h2 className="t-md t-semibold">{t(K.tech.title)}</h2>
              <Tech p={chosenSlot.technician} t={t} />
              <p className="t-xs t-muted">{t(K.tech.note)}</p>
            </div>
          </Card>
        )}
        {problem && <p className="t-sm" role="alert" data-problem={problem} style={{ color: 'var(--color-error)' }}>{problemText(t, problem)}</p>}
        <Bookings d={d} s={s} t={t} lang={lang} />
        <p className="t-xs t-muted">{t(K.notice.placeholders)}</p>
      </div>
      <ActionBar>
        {noSlots
          ? <Button className="grow" block data-act="arrange" disabled={!noteOk} loading={s.sending} onClick={() => void submit(true)}>{s.sending ? t(K.confirm.sending) : t(K.confirm.arrange)}</Button>
          : <Button className="grow" block data-act="confirm" disabled={!slot || !noteOk} loading={s.sending} onClick={() => void submit(false)}>{s.sending ? t(K.confirm.sending) : t(K.confirm.submit)}</Button>}
      </ActionBar>
    </Screen>
  );
}

function UrgentCard({ d, s, t }: { d: MaintenanceDeskView; s: MaintenanceState; t: T }) {
  return (
    <Card>
      <div className="stack gap-2" data-urgent style={{ borderLeft: '4px solid var(--color-warning)', paddingLeft: 12 }}>
        <h2 className="t-md t-semibold">{t(K.urgent.title)}</h2>
        <p className="t-sm">{t(K.urgent.body)}</p>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Button size="sm" variant="secondary" data-act="urgent" onClick={() => s.goTo(requestPath)}>{t(K.urgent.cta)}</Button>
          {d.emergencyPhone && <a className="ds-btn ds-btn--ghost ds-btn--sm" href={telOf(d.emergencyPhone)}><Phone size={14} aria-hidden="true" /> {t(K.urgent.call)}</a>}
        </div>
      </div>
    </Card>
  );
}

function Bookings({ d, s, t, lang }: { d: MaintenanceDeskView; s: MaintenanceState; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-2" data-bookings>
        <h2 className="t-md t-semibold">{t(K.bookings.title)}</h2>
        {d.bookings.length === 0 ? <p className="t-sm t-muted">{t(K.bookings.empty)}</p> : d.bookings.map((r) => (
          <button key={r.id} type="button" data-booking={r.id} className="row gap-2" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => s.open(r.id)}>
            <span className="stack gap-0"><span className="t-sm t-semibold">{r.code}</span><span className="t-xs t-muted">{r.visit ? t(K.bookings.when, { date: formatDate(r.visit.date, lang), window: windowWord(t, r.visit.window) }) : t(K.bookings.pending)}</span></span>
            <Badge tone={r.status === 'resolved' ? 'success' : r.status === 'withdrawn' ? 'neutral' : 'accent'}>{t(`serviceTickets.status.${r.status}`)}</Badge>
          </button>
        ))}
      </div>
    </Card>
  );
}

function Done({ s, t, head, lang }: P & { lang: string }) {
  const r = s.result as NonNullable<MaintenanceState['result']>;
  const tk = r.ticket.ticket;
  return (
    <Screen width="narrow">
      {head(t(K.subtitle))}
      <Card>
        <div className="stack gap-3" data-done={r.pending ? 'pending' : 'booked'}>
          <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={20} aria-hidden="true" /> {r.pending ? t(K.done.pending.title) : t(K.done.title)}</h2>
          {r.pending || !tk.visit ? <p className="t-sm">{t(K.done.pendingBody)}</p> : <p className="t-sm">{t(K.done.body, { name: tk.visit.technicianName.split(/\s+/)[0] ?? '', date: formatDate(tk.visit.date, lang), window: windowWord(t, tk.visit.window).toLowerCase() })}</p>}
          {r.technician && <Tech p={r.technician} t={t} />}
          {r.chargeable && <p className="t-sm" data-cost="chargeable">{r.estimatedPrice ? t(K.cover.chargeable, { price: formatINR(r.estimatedPrice) }) : t(K.cover.chargeableNoPrice)}</p>}
          <p className="t-xs t-muted">{t(K.done.reference, { code: tk.code })}</p>
          <div className="row gap-2"><Button data-act="open-visit" onClick={() => { s.clearResult(); s.open(tk.id); }}>{t(K.done.open)}</Button><Button variant="ghost" onClick={() => s.clearResult()}>{t(K.back)}</Button></div>
        </div>
      </Card>
    </Screen>
  );
}

/* ------------------------------------------------------------------ one visit */

function VisitScreen({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const v = s.ticket;
  const tr = s.tracking;
  const [sheet, setSheet] = useState<'move' | 'cancel' | null>(null);
  const [reason, setReason] = useState('');
  const [slot, setSlot] = useState<{ date: string; window: 'morning' | 'afternoon' } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const back = <Button size="sm" variant="ghost" data-back onClick={() => s.list()}>{t(K.back)}</Button>;
  if (s.ticketState === 'loading' && !v) return <Screen width="narrow">{head('', back)}<LoadingState label={t(K.loading)} variant="list" rows={3} /></Screen>;
  if (!v || !tr) return <Screen width="narrow">{head('', back)}{s.ticketState === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /> : <EmptyState title={t(K.notFound)} body="" actionLabel={t(K.back)} onAction={() => s.list()} />}</Screen>;
  const tk = v.ticket;
  const visit = tk.visit;
  const first = tr.technician?.firstName.split(/\s+/)[0] ?? '';
  const movable = tk.status === 'assigned' && visit?.status === 'planned';
  const run = async (fn: () => Promise<{ ok: true } | { ok: false; problem: string }>, done: () => void) => { setProblem(null); const r = await fn(); if (!r.ok) setProblem(r.problem); else done(); };
  const slots = s.desk?.slots ?? [];
  const phaseText = tr.phase === 'on_the_way' ? t(K.track.on_the_way, { name: first })
    : tr.phase === 'scheduled' ? t(K.track.scheduled, { name: first, window: tr.window ? windowWord(t, tr.window).toLowerCase() : '' })
    : tr.phase === 'arrived' ? t(K.track.arrived, { name: first })
    : t(`maintenance.track.${tr.phase}`);
  return (
    <Screen width="narrow">
      {head(`${tk.code} · ${tk.siteName}`, back)}
      <div className="stack gap-3" data-visit-screen>
        <Card>
          <div className="stack gap-2" data-visit={tk.status}>
            <span className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}><Badge tone={tk.status === 'resolved' ? 'success' : tk.status === 'withdrawn' ? 'neutral' : 'accent'}>{t(`serviceTickets.status.${tk.status}`)}</Badge>{tk.booking?.status === 'pending' && <Badge tone="warning">{t(K.bookings.pending)}</Badge>}</span>
            {visit ? <p className="t-md t-semibold">{t(K.bookings.when, { date: formatDate(visit.date, lang), window: windowWord(t, visit.window) })}</p> : <p className="t-sm">{t(K.done.pendingBody)}</p>}
            {tr.technician && <><span className="t-xs t-muted">{t(K.detail.technician)}</span><Tech p={tr.technician} t={t} /></>}
            {tk.booking?.chargeable && <p className="t-sm" data-cost="chargeable">{tk.booking.estimatedPrice ? t(K.cover.chargeable, { price: formatINR(tk.booking.estimatedPrice) }) : t(K.cover.chargeableNoPrice)}</p>}
            {tk.description && <p className="t-sm t-muted" style={{ overflowWrap: 'anywhere' }}>{tk.description}</p>}
          </div>
        </Card>
        <Card>
          <div className="stack gap-1" data-tracking={tr.phase}>
            <h2 className="t-md t-semibold">{t(K.track.title)}</h2>
            <p className="t-sm">{phaseText}</p>
            {tr.phase === 'on_the_way' && (tr.eta ? <p className="t-sm" data-eta>{t(K.track.eta, { minutes: tr.eta.minutes, ago: tr.eta.positionAgeMin })}</p> : tr.onTheWayAt ? <p className="t-xs t-muted" data-noeta>{t(K.track.noEta, { time: formatTime(tr.onTheWayAt, lang) })}</p> : null)}
          </div>
        </Card>
        {movable && (
          <Card>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }} data-manage>
              <Button variant="secondary" data-act="move" onClick={() => { setProblem(null); setSlot(null); setSheet('move'); }}>{t(K.detail.rescheduleOpen)}</Button>
              {tk.canWithdraw && <Button variant="ghost" data-act="cancel" onClick={() => { setProblem(null); setSheet('cancel'); }}>{t(K.detail.cancelOpen)}</Button>}
            </div>
          </Card>
        )}
        {tk.status === 'resolved' && tk.visit?.status === 'done' && <Card><Button variant="ghost" data-act="rate" onClick={() => s.goTo(`/feedback?request=visit:${tk.id}`)}>{t('feedback.link.open')}</Button></Card>}
      </div>
      <Sheet open={sheet === 'move'} onClose={() => setSheet(null)} title={t(K.detail.rescheduleOpen)} closeLabel={t(K.close)}>
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.detail.reschedule.hint, { hours: NOTICE_HOURS })}</p>
          {slots.length === 0 ? <p className="t-sm">{t(K.slots.none.none_soon)}</p> : <Days slots={slots} value={slot} onPick={(x) => setSlot({ date: x.date, window: x.window })} lang={lang} t={t} />}
          {problem && <p className="t-sm" role="alert" data-problem={problem} style={{ color: 'var(--color-error)' }}>{problemText(t, problem)}</p>}
          <Button data-act="confirm-move" disabled={!slot} onClick={() => void run(() => s.reschedule((slot as NonNullable<typeof slot>).date, (slot as NonNullable<typeof slot>).window), () => setSheet(null))}>{t(K.detail.reschedule.confirm)}</Button>
        </div>
      </Sheet>
      <Sheet open={sheet === 'cancel'} onClose={() => setSheet(null)} title={t(K.detail.cancel.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3">
          <p className="t-sm">{t(K.detail.cancel.body)}</p>
          <Field label={t(K.detail.cancel.reason)}>{(p) => <TextArea id={p.id} rows={3} value={reason} data-f="reason" onChange={(e) => setReason(e.target.value)} />}</Field>
          {problem && <p className="t-sm" role="alert" style={{ color: 'var(--color-error)' }}>{problemText(t, problem)}</p>}
          <div className="row gap-2"><Button data-act="confirm-cancel" disabled={lettersOf(reason) < 3} onClick={() => void run(() => s.cancel(reason), () => { setSheet(null); setReason(''); })}>{t(K.detail.cancel.confirm)}</Button><Button variant="ghost" onClick={() => setSheet(null)}>{t(K.detail.cancel.keep)}</Button></div>
        </div>
      </Sheet>
    </Screen>
  );
}
