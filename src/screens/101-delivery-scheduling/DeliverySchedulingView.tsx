import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ChatCircleDots, Check, Gear, HardHat, Package, Truck, Warning, WarningOctagon, X } from '@phosphor-icons/react';
import {
  AscensionLine,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  Tabs,
  TextArea,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { DeliveryCard } from '@/data/repository';
import type { DeliveryEvent, DeliveryRescheduleCause, DeliveryWindow, SupplierDispatchAvailability } from '@/data/types';
import { CalendarView } from '@/features/calendar/CalendarView';
import { CALENDAR_MODES } from '@/features/calendar/calendarMath';
import type { CalendarEvent } from '@/features/calendar/calendarMath';
import type { SlotState } from '@/features/logistics/deliverySlots';
import { DELIVERY_WINDOWS, READINESS_ITEMS, WINDOW_HOURS, parseKey, todayKey } from '@/features/logistics/deliverySlots';
import { useDeliveryScheduling } from './useDeliveryScheduling';
import type { ActionResult, DeliverySchedulingState } from './useDeliveryScheduling';
import { DELIVERY_FILTERS, DELIVERY_SCHEDULING_KEYS as K, RESCHEDULE_CAUSES, WINDOW_LABEL_KEYS } from './delivery-scheduling.types';

type T = ReturnType<typeof useTranslation>['t'];

const LOCALE: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const STATUS_TONE: Record<DeliveryCard['status'], BadgeTone> = { unscheduled: 'neutral', scheduled: 'accent', attempt_failed: 'error', delivered: 'success' };

/** A calendar day, e.g. "Thu, 1 Oct". */
function keyLabel(key: string, lang: string, withYear = false): string {
  return new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }).format(parseKey(key));
}
function weekdayLabel(day: number, lang: string): string {
  // Any Sunday-anchored week works for naming days.
  return new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { weekday: 'short' }).format(new Date(2026, 0, 4 + day));
}
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const blockedText = (t: T, state: SlotState | null | undefined) => (state && state !== 'free' ? t(K.slotState[state]) : '');

export function DeliverySchedulingView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const toast = useToast();
  const s = useDeliveryScheduling();

  /** One place turns a result into the right message, so every action says the same thing the same way. */
  const report = (r: ActionResult, success: string) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    toast.push(t(success), 'success');
    if (r.technicianNotified) toast.push(t(K.toast.technician), 'success');
    if (r.conflicts && r.conflicts.length > 0) toast.push(t(K.toast.conflicts, { codes: r.conflicts.join(', ') }), 'warning');
  };

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
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const dayCards = s.cardsOn(s.selectedDate);

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(s.isAdmin ? K.subtitleAdmin : K.subtitleSupplier)}
        action={
          !s.isAdmin && s.ownSupplier ? (
            <Button size="sm" variant="secondary" icon={<Gear size={16} />} onClick={() => s.openAvailability()}>
              {t(K.availability.open)}
            </Button>
          ) : undefined
        }
      />

      <div className="stack gap-3 mb-3">
        <Tabs
          label={t(K.view.label)}
          value={s.mode}
          onChange={(id) => s.setMode(id as typeof s.mode)}
          items={CALENDAR_MODES.map((m) => ({ id: m, label: t(K.view[m]) }))}
        />
        <div className="row wrap gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.label)}>
          {DELIVERY_FILTERS.map((f) => (
            <button key={f} type="button" className="ds-chip shrink-0" aria-pressed={s.filter === f} onClick={() => s.setFilter(f)}>
              {t(K.filter[f])}
            </button>
          ))}
          {s.isAdmin && s.suppliers.length > 1 && (
            <Select aria-label={t(K.filter.allSuppliers)} value={s.supplierFilter} onChange={(e) => s.setSupplierFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="">{t(K.filter.allSuppliers)}</option>
              {s.suppliers.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div className="main-aside">
        <div className="stack gap-3">
          <Card>
            <CalendarView
              mode={s.mode}
              cursor={s.cursor}
              onCursorChange={s.setCursor}
              events={s.events}
              selected={s.selectedDate}
              onSelect={s.selectDate}
              renderAgendaRow={(e) => <AgendaRow event={e} s={s} t={t} lang={lang} />}
            />
            <Legend t={t} />
          </Card>

          {s.mode !== 'agenda' && s.selectedDate && (
            <section aria-live="polite" className="stack gap-2">
              <h2 className="t-md t-semibold">{keyLabel(s.selectedDate, lang, true)}</h2>
              {dayCards.length === 0 ? (
                <EmptyState icon={<CalendarCheck size={28} />} title={t(K.day.empty)} body={t(K.day.emptyBody)} />
              ) : (
                <Card className="ds-card--flush">
                  {dayCards.map((c) => (
                    <DeliveryRow key={c.poId} card={c} s={s} t={t} lang={lang} />
                  ))}
                </Card>
              )}
            </section>
          )}
        </div>

        <QueueSection s={s} t={t} lang={lang} />
      </div>

      <DeliverySheet s={s} t={t} lang={lang} report={report} />
      <AvailabilitySheet s={s} t={t} lang={lang} report={report} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ pieces */

function Legend({ t }: { t: T }) {
  const items: { tone: CalendarEvent['tone']; key: string }[] = [
    { tone: 'accent', key: K.legend.onTrack },
    { tone: 'warning', key: K.legend.later },
    { tone: 'error', key: K.legend.problem },
    { tone: 'success', key: K.legend.delivered },
  ];
  return (
    <div className="row wrap gap-3 mt-3 hairline-top pt-2" role="list" aria-label={t(K.legend.heading)}>
      {items.map((i) => (
        <span key={i.tone} role="listitem" className="row gap-1 t-xs t-muted">
          <span className={`cal__dot cal__dot--${i.tone}`} aria-hidden="true" /> {t(i.key)}
        </span>
      ))}
    </div>
  );
}

function FlagBadges({ card, t }: { card: DeliveryCard; t: T }) {
  return (
    <>
      {card.laterThanPromise && <Badge tone="warning">{t(K.card.later)}</Badge>}
      {card.sequenceConflict && <Badge tone="error">{t(K.card.conflict)}</Badge>}
      {card.readinessLost && <Badge tone="error">{t(K.card.readinessLost)}</Badge>}
      {card.outsideSupplierWindows && <Badge tone="error">{t(K.card.outsideWindows)}</Badge>}
    </>
  );
}

function DeliveryRow({ card, s, t, lang }: { card: DeliveryCard; s: DeliverySchedulingState; t: T; lang: string }) {
  const sched = card.schedule;
  return (
    <button type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} onClick={() => s.openSheet(card.poId)}>
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="row between gap-2">
          <span className="t-medium">{card.poCode}</span>
          {sched?.status === 'scheduled' && sched.window && (
            <span className="t-xs t-muted shrink-0">
              {t(WINDOW_LABEL_KEYS[sched.window])} · {WINDOW_HOURS[sched.window].from}–{WINDOW_HOURS[sched.window].to}
            </span>
          )}
        </span>
        <span className="t-xs t-muted">
          {card.siteName || t(K.card.siteUnknown)} · {card.supplier.name}
        </span>
        {card.dependsOn && <span className="t-xs t-muted">{t(K.card.followsPo, { code: card.dependsOn.poCode })}</span>}
        <span className="row wrap gap-1">
          <Badge tone={STATUS_TONE[card.status]}>{t(K.card.status[card.status])}</Badge>
          <FlagBadges card={card} t={t} />
        </span>
        <span className="sr-only">{sched?.date ? keyLabel(sched.date, lang) : ''}</span>
      </span>
    </button>
  );
}

function AgendaRow({ event, s, t, lang }: { event: CalendarEvent; s: DeliverySchedulingState; t: T; lang: string }) {
  const card = s.cards.find((c) => c.poId === event.id);
  return card ? (
    <Card className="ds-card--flush">
      <DeliveryRow card={card} s={s} t={t} lang={lang} />
    </Card>
  ) : null;
}

function QueueSection({ s, t, lang }: { s: DeliverySchedulingState; t: T; lang: string }) {
  return (
    <section aria-labelledby="queue-heading" className="stack gap-2">
      <h2 id="queue-heading" className="t-lg">
        {t(K.queue.heading)} · {s.queue.length}
      </h2>
      <p className="t-xs t-muted">{t(s.isAdmin ? K.queue.hintAdmin : K.queue.hintSupplier)}</p>
      {s.queue.length === 0 ? (
        <EmptyState icon={<Truck size={28} />} title={t(K.queue.empty)} body={t(K.queue.emptyBody)} />
      ) : (
        <Card className="ds-card--flush">
          {s.queue.map((c) => (
            <button key={c.poId} type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} onClick={() => s.openSheet(c.poId)}>
              <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                <span className="row between gap-2">
                  <span className="t-medium">{c.poCode}</span>
                  {c.promisedDelivery && <span className="t-xs t-muted shrink-0">{t(K.queue.promised, { date: formatDate(c.promisedDelivery, lang) })}</span>}
                </span>
                <span className="t-xs t-muted">
                  {c.siteName || t(K.card.siteUnknown)} · {c.supplier.name}
                </span>
                <span className="row wrap gap-1">
                  <Badge tone={c.readinessConfirmed ? 'success' : 'warning'}>{t(c.readinessConfirmed ? K.queue.siteReady : K.queue.siteNotReady)}</Badge>
                  {c.status === 'attempt_failed' && <Badge tone="error">{t(K.card.status.attempt_failed)}</Badge>}
                  {c.schedule && c.schedule.failedAttempts > 0 && c.status !== 'attempt_failed' && <Badge tone="neutral">{t(K.queue.failedBefore, { count: c.schedule.failedAttempts })}</Badge>}
                  {!c.supplier.hasAvailability && <Badge tone="warning">{t(K.slotState.no_availability)}</Badge>}
                </span>
                {s.isAdmin ? (
                  <span>
                    <span className="ds-btn ds-btn--secondary ds-btn--sm" aria-hidden="true">
                      {t(c.status === 'attempt_failed' ? K.queue.rebook : K.queue.book)}
                    </span>
                  </span>
                ) : (
                  <span className="t-xs t-muted">{t(K.queue.waiting)}</span>
                )}
              </span>
            </button>
          ))}
        </Card>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- slot picker */

function SlotPicker({ s, t, lang, disabledHint }: { s: DeliverySchedulingState; t: T; lang: string; disabledHint?: string }) {
  const windows = s.bookDate ? s.windowsFor(s.bookDate) : [];
  const dayBlocked = !!s.bookDate && windows.length > 0 && windows.every((w) => w.state !== 'free');
  const firstReason = windows.find((w) => w.state && w.state !== 'free')?.state;
  return (
    <div className="stack gap-3">
      <div className="stack gap-1">
        <span className="label">{t(K.book.nextAvailable)}</span>
        {s.freeSlots.length === 0 ? (
          <p className="t-sm t-warning">{t(K.book.noneFree)}</p>
        ) : (
          <div className="row wrap gap-2">
            {s.freeSlots.map((slot) => (
              <button
                key={`${slot.date}|${slot.window}`}
                type="button"
                className="ds-chip"
                aria-pressed={s.bookDate === slot.date && s.bookWindow === slot.window}
                onClick={() => s.pickSlot(slot.date, slot.window)}
              >
                {keyLabel(slot.date, lang)} · {t(WINDOW_LABEL_KEYS[slot.window])}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid-2 gap-2">
        <Field label={t(K.book.otherDate)} error={dayBlocked ? blockedText(t, firstReason) || undefined : undefined}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} type="date" min={todayKey(Date.now())} value={s.bookDate} onChange={(e) => s.setPickedDate(e.target.value)} />
          )}
        </Field>
        <Field label={t(K.book.window)}>
          {({ id }) => (
            <Select id={id} value={s.bookWindow} disabled={!s.bookDate} onChange={(e) => s.setBookWindow(e.target.value as DeliveryWindow)}>
              <option value="">—</option>
              {windows.map((w) => (
                <option key={w.window} value={w.window} disabled={w.state !== 'free'}>
                  {t(WINDOW_LABEL_KEYS[w.window])}
                  {w.state && w.state !== 'free' ? ` — ${blockedText(t, w.state)}` : ''}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      {disabledHint && <p className="t-xs t-muted">{disabledHint}</p>}
    </div>
  );
}

function DependencyField({ card, s, t }: { card: DeliveryCard; s: DeliverySchedulingState; t: T }) {
  if (card.siblingPos.length === 0) return null;
  return (
    <Field label={t(K.book.dependsOn)} hint={t(K.book.dependsHint)}>
      {({ id, describedBy }) => (
        <Select id={id} aria-describedby={describedBy} value={s.dependsOn} onChange={(e) => s.setDependsOn(e.target.value)}>
          <option value="">{t(K.book.dependsNone)}</option>
          {card.siblingPos.map((p) => (
            <option key={p.poId} value={p.poId}>
              {p.poCode}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function AvailabilitySummary({ a, lang, t }: { a: SupplierDispatchAvailability; lang: string; t: T }) {
  return (
    <p className="t-xs t-muted">
      {t(K.availability.summary, {
        days: a.weekdays.map((d) => weekdayLabel(d, lang)).join(', '),
        windows: a.windows.map((w) => t(WINDOW_LABEL_KEYS[w])).join(' / '),
        max: a.maxPerDay,
        lead: a.leadDays,
      })}
    </p>
  );
}

/* --------------------------------------------------------- the delivery sheet */

function DeliverySheet({ s, t, lang, report }: { s: DeliverySchedulingState; t: T; lang: string; report: (r: ActionResult, success: string) => void }) {
  const navigate = useNavigate();
  const card = s.openCard;
  const availability = card ? (s.board?.availabilityBySupplier[card.supplier.id] ?? null) : null;
  return (
    <Sheet open={card !== null} onClose={s.closeSheet} title={card ? t(K.sheet.title, { code: card.poCode }) : ''} closeLabel={t('action.close')}>
      {card && (
        <div className="stack gap-4">
          <Card className="stack gap-1">
            <span className="t-sm t-semibold">{card.siteName || t(K.card.siteUnknown)}</span>
            {card.address && <span className="t-xs t-muted">{card.address}</span>}
            <span className="t-xs">{card.lineSummary}</span>
            <span className="t-xs t-muted">
              {t(K.sheet.supplier, { name: card.supplier.name })} · {t(K.sheet.value, { amount: formatINR(card.totalAmount) })}
              {card.promisedDelivery ? ` · ${t(K.sheet.promised, { date: formatDate(card.promisedDelivery, lang) })}` : ''}
            </span>
            <span className="row wrap gap-1 mt-1">
              <Badge tone={STATUS_TONE[card.status]}>{t(K.card.status[card.status])}</Badge>
              <Badge tone="neutral">{t(`fulfilmentStage.${card.poStage}`)}</Badge>
              <FlagBadges card={card} t={t} />
            </span>
            <span className="row wrap gap-2 mt-1">
              <Button size="sm" variant="ghost" icon={<Package size={16} />} onClick={() => navigate(`/orders?poId=${card.poId}`)}>
                {t(K.sheet.openOrder)}
              </Button>
              <Button size="sm" variant="ghost" icon={<ChatCircleDots size={16} />} onClick={() => navigate(`/supplier-messages?supplierId=${card.supplier.id}&poId=${card.poId}`)}>
                {t(K.sheet.messages)}
              </Button>
            </span>
          </Card>

          <Banners card={card} t={t} isAdmin={s.isAdmin} />
          {card.status !== 'delivered' && <ReadinessSection card={card} s={s} t={t} lang={lang} report={report} />}
          {card.status === 'unscheduled' || card.status === 'attempt_failed' ? (
            <BookSection card={card} s={s} t={t} lang={lang} availability={availability} report={report} />
          ) : card.status === 'scheduled' ? (
            <CurrentBooking card={card} s={s} t={t} lang={lang} availability={availability} report={report} />
          ) : null}
          <Sequence card={card} t={t} lang={lang} />
          <Installation card={card} t={t} />
          <Timeline card={card} t={t} lang={lang} />
        </div>
      )}
    </Sheet>
  );
}

function Banners({ card, t, isAdmin }: { card: DeliveryCard; t: T; isAdmin: boolean }) {
  const items: { show: boolean; key: string; tone: 'error' | 'warning' }[] = [
    { show: card.sequenceConflict, key: K.sheet.conflictBanner, tone: 'error' },
    { show: card.readinessLost, key: K.sheet.lostBanner, tone: 'error' },
    { show: card.outsideSupplierWindows, key: isAdmin ? K.sheet.outsideBanner : K.sheet.outsideBannerSupplier, tone: 'error' },
    { show: card.laterThanPromise, key: K.sheet.laterBanner, tone: 'warning' },
  ];
  return (
    <>
      {items
        .filter((i) => i.show)
        .map((i) => (
          <p key={i.key} className={`t-sm ${i.tone === 'error' ? 't-error' : 't-warning'} row-top gap-2`} role="alert">
            <Warning size={16} className="shrink-0" aria-hidden="true" /> {t(i.key, { code: card.dependsOn?.poCode ?? '' })}
          </p>
        ))}
    </>
  );
}

function ReadinessSection({ card, s, t, lang, report }: { card: DeliveryCard; s: DeliverySchedulingState; t: T; lang: string; report: (r: ActionResult, success: string) => void }) {
  const r = card.readiness;
  return (
    <section className="stack gap-2" aria-labelledby="readiness-heading">
      <div className="row between gap-2">
        <h3 id="readiness-heading" className="t-md t-semibold">
          {t(K.readiness.heading)}
        </h3>
        <Badge tone={card.readinessConfirmed ? 'success' : 'warning'}>{t(card.readinessConfirmed ? K.queue.siteReady : K.queue.siteNotReady)}</Badge>
      </div>
      <p className="t-xs t-muted">{t(K.readiness.hint)}</p>
      {r.resetReason && !card.readinessConfirmed && (
        <p className="t-sm t-error row-top gap-2">
          <WarningOctagon size={16} className="shrink-0" aria-hidden="true" /> {t(K.readiness.reset, { reason: r.resetReason })}
        </p>
      )}
      {card.readinessConfirmed && r.confirmedAt && (
        <p className="t-xs t-success">{t(K.readiness.confirmed, { name: r.confirmedBy ?? '', contact: r.contactName ?? '', date: formatDate(r.confirmedAt, lang) })}</p>
      )}
      {s.isAdmin ? (
        <div className="stack gap-2">
          {READINESS_ITEMS.map((item) => (
            <Checkbox key={item} checked={s.readyItems[item]} onChange={(v) => s.toggleReady(item, v)} label={t(K.readiness.item[item])} />
          ))}
          <Field label={t(K.readiness.contact)} hint={t(K.readiness.contactHint)}>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={s.contact} onChange={(e) => s.setContact(e.target.value)} />}
          </Field>
          <div>
            <Button
              size="sm"
              variant={s.allReady && !card.readinessConfirmed ? 'primary' : 'secondary'}
              disabled={s.allReady && s.contact.trim().length < 2}
              loading={s.busy}
              onClick={() => void s.saveReadiness().then((res) => report(res, s.allReady ? K.toast.readinessConfirmed : K.toast.readinessSaved))}
            >
              {t(s.allReady && !card.readinessConfirmed ? K.readiness.confirm : K.readiness.save)}
            </Button>
          </div>
        </div>
      ) : (
        <div className="stack gap-1">
          {READINESS_ITEMS.map((item) => (
            <span key={item} className="row gap-2 t-sm">
              {r.items[item] ? <Check size={14} className="t-success" aria-hidden="true" /> : <X size={14} className="t-error" aria-hidden="true" />}
              {t(K.readiness.item[item])}
            </span>
          ))}
          <p className="t-xs t-muted">{t(K.readiness.supplierNote)}</p>
        </div>
      )}
    </section>
  );
}

function BookSection({
  card,
  s,
  t,
  lang,
  availability,
  report,
}: {
  card: DeliveryCard;
  s: DeliverySchedulingState;
  t: T;
  lang: string;
  availability: SupplierDispatchAvailability | null;
  report: (r: ActionResult, success: string) => void;
}) {
  const rebook = card.status === 'attempt_failed';
  if (!s.isAdmin) {
    return (
      <section className="stack gap-2">
        <h3 className="t-md t-semibold">{t(rebook ? K.book.rebookHeading : K.book.heading)}</h3>
        <p className="t-sm t-muted">{t(K.queue.waiting)}</p>
      </section>
    );
  }
  return (
    <section className="stack gap-3" aria-labelledby="book-heading">
      <h3 id="book-heading" className="t-md t-semibold">
        {t(rebook ? K.book.rebookHeading : K.book.heading)}
      </h3>
      {!card.readinessConfirmed ? (
        <p className="t-sm t-warning row-top gap-2">
          <Warning size={16} className="shrink-0" aria-hidden="true" /> {t(K.book.needsReadiness)}
        </p>
      ) : !availability ? (
        <div className="stack gap-2">
          <p className="t-sm t-warning">{t(K.book.noWindowsTitle, { supplier: card.supplier.name })}</p>
          <p className="t-xs t-muted">{t(K.book.noWindowsAdmin)}</p>
          <div>
            <Button size="sm" variant="secondary" onClick={() => s.openAvailability(card.supplier.id)}>
              {t(K.book.enterWindows)}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <AvailabilitySummary a={availability} lang={lang} t={t} />
          <SlotPicker s={s} t={t} lang={lang} />
          <DependencyField card={card} s={s} t={t} />
          {s.lateBook && (
            <div className="stack gap-1">
              <Field label={t(K.book.lateCause)} hint={t(K.book.lateHint)} required>
                {({ id, describedBy }) => (
                  <Select id={id} aria-describedby={describedBy} value={s.lateCause} onChange={(e) => s.setLateCause(e.target.value as DeliveryRescheduleCause)}>
                    <option value="">—</option>
                    {RESCHEDULE_CAUSES.map((c) => (
                      <option key={c} value={c}>
                        {t(K.cause[c])}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {s.lateCause && <p className="t-xs t-muted">{t(s.lateCause === 'site' || s.lateCause === 'aiec' ? K.book.promiseMoves : K.book.promiseStays)}</p>}
            </div>
          )}
          <div>
            <Button icon={<CalendarCheck size={18} />} disabled={!s.canBook} loading={s.busy} onClick={() => void s.book().then((res) => report(res, K.toast.booked))}>
              {t(K.book.submit)}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function CurrentBooking({
  card,
  s,
  t,
  lang,
  availability,
  report,
}: {
  card: DeliveryCard;
  s: DeliverySchedulingState;
  t: T;
  lang: string;
  availability: SupplierDispatchAvailability | null;
  report: (r: ActionResult, success: string) => void;
}) {
  const sched = card.schedule!;
  return (
    <>
      <section className="stack gap-3" aria-labelledby="current-heading">
        <h3 id="current-heading" className="t-md t-semibold">
          {t(K.resched.heading)}
        </h3>
        <p className="t-sm">
          {t(K.resched.current, {
            date: sched.date ? keyLabel(sched.date, lang, true) : '',
            window: sched.window ? `${t(WINDOW_LABEL_KEYS[sched.window])} (${WINDOW_HOURS[sched.window].from}–${WINDOW_HOURS[sched.window].to})` : '',
          })}
        </p>
        {!s.moveOpen ? (
          <div>
            <Button size="sm" variant="secondary" onClick={() => s.setMoveOpen(true)}>
              {t(K.resched.open)}
            </Button>
          </div>
        ) : (
          <div className="stack gap-3">
            {availability && <AvailabilitySummary a={availability} lang={lang} t={t} />}
            <SlotPicker s={s} t={t} lang={lang} />
            <DependencyField card={card} s={s} t={t} />
            {s.isAdmin ? (
              <Field label={t(K.resched.cause)} required>
                {({ id }) => (
                  <Select id={id} value={s.moveCause} onChange={(e) => s.setMoveCause(e.target.value as DeliveryRescheduleCause)}>
                    {RESCHEDULE_CAUSES.map((c) => (
                      <option key={c} value={c}>
                        {t(K.cause[c])}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            ) : (
              <p className="t-xs t-muted">{t(K.resched.supplierNote)}</p>
            )}
            {s.lateMove && s.isAdmin && <p className="t-xs t-muted">{t(s.moveCause === 'site' || s.moveCause === 'aiec' ? K.book.promiseMoves : K.book.promiseStays)}</p>}
            <Field label={t(K.resched.reason)} hint={t(K.resched.reasonHint)} required>
              {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={s.moveReason} onChange={(e) => s.setMoveReason(e.target.value)} />}
            </Field>
            <div className="row gap-2">
              <Button disabled={!s.canMove} loading={s.busy} onClick={() => void s.move().then((res) => report(res, K.toast.rescheduled))}>
                {t(K.resched.submit)}
              </Button>
              <Button variant="ghost" onClick={() => s.setMoveOpen(false)}>
                {t('action.cancel')}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* A wasted trip is its own outcome — not a reschedule. */}
      <section className="stack gap-2 hairline-top pt-3" aria-labelledby="attempt-heading">
        <h3 id="attempt-heading" className="t-md t-semibold t-error row gap-2">
          <WarningOctagon size={16} aria-hidden="true" /> {t(K.attempt.heading)}
        </h3>
        <p className="t-xs t-muted">{t(K.attempt.body)}</p>
        {sched.failedAttempts > 0 && <p className="t-xs">{t(K.attempt.failedCount, { count: sched.failedAttempts })}</p>}
        {!s.attemptOpen ? (
          <div>
            <Button size="sm" variant="secondary" onClick={() => s.setAttemptOpen(true)}>
              <span className="t-error">{t(K.attempt.open)}</span>
            </Button>
          </div>
        ) : (
          <div className="stack gap-2">
            <p className="t-sm t-error">{t(K.attempt.warning)}</p>
            <Field label={t(K.attempt.note)} required>
              {({ id }) => <TextArea id={id} rows={3} value={s.attemptNote} onChange={(e) => s.setAttemptNote(e.target.value)} />}
            </Field>
            <div className="row gap-2">
              <Button variant="danger" disabled={!s.canRecordAttempt} loading={s.busy} onClick={() => void s.recordAttempt().then((res) => report(res, K.toast.attempt))}>
                {t(K.attempt.submit)}
              </Button>
              <Button variant="ghost" onClick={() => s.setAttemptOpen(false)}>
                {t('action.cancel')}
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function Sequence({ card, t, lang }: { card: DeliveryCard; t: T; lang: string }) {
  if (!card.dependsOn && card.dependents.length === 0) return null;
  const pre = card.dependsOn;
  return (
    <section className="stack gap-1">
      {pre && (
        <p className="t-sm">
          {pre.delivered
            ? t(K.sheet.dependsOnDelivered, { code: pre.poCode })
            : pre.date && pre.window
              ? t(K.sheet.dependsOnBooked, { code: pre.poCode, date: keyLabel(pre.date, lang), window: t(WINDOW_LABEL_KEYS[pre.window]) })
              : t(K.sheet.dependsOnUnbooked, { code: pre.poCode })}
        </p>
      )}
      {card.dependents.length > 0 && <p className="t-sm t-muted">{t(K.sheet.dependents, { codes: card.dependents.map((d) => d.poCode).join(', ') })}</p>}
    </section>
  );
}

function Installation({ card, t }: { card: DeliveryCard; t: T }) {
  if (card.status === 'delivered') return null;
  return (
    <p className="t-sm row gap-2">
      <HardHat size={16} aria-hidden="true" />
      {card.technician ? t(K.sheet.technician, { name: card.technician.name, job: card.jobCode ?? '' }) : t(K.sheet.noTechnician, { job: card.jobCode ?? '—' })}
    </p>
  );
}

function Timeline({ card, t, lang }: { card: DeliveryCard; t: T; lang: string }) {
  const events = card.schedule?.events ?? [];
  if (events.length === 0) return null;
  const stepFor = (e: DeliveryEvent, i: number): AscensionStep => {
    const label =
      e.kind === 'scheduled'
        ? t(K.timeline.scheduled, { date: e.date ? keyLabel(e.date, lang) : '', window: e.window ? t(WINDOW_LABEL_KEYS[e.window]) : '' })
        : e.kind === 'rescheduled'
          ? t(K.timeline.rescheduled, {
              from: e.fromDate ? keyLabel(e.fromDate, lang) : '',
              to: e.date ? keyLabel(e.date, lang) : '',
              window: e.window ? t(WINDOW_LABEL_KEYS[e.window]) : '',
            })
          : t(K.timeline.attempt_failed, { date: e.date ? keyLabel(e.date, lang) : '' });
    const meta = [
      t(K.timeline.by, { name: e.byName, when: formatDate(e.at, lang) }),
      e.cause ? t(K.timeline.cause, { cause: t(K.cause[e.cause]) }) : '',
      e.reason ?? '',
      e.promiseMovedFrom ? t(K.timeline.promiseMoved, { date: formatDate(e.promiseMovedFrom, lang) }) : '',
    ]
      .filter(Boolean)
      .join('\n');
    return { id: e.id, label, meta, status: i === events.length - 1 && card.status === 'scheduled' ? 'current' : e.kind === 'attempt_failed' ? 'blocked' : 'complete' };
  };
  return (
    <section className="stack gap-2" aria-labelledby="timeline-heading">
      <h3 id="timeline-heading" className="t-md t-semibold">
        {t(K.timeline.heading)}
      </h3>
      <AscensionLine steps={events.map(stepFor)} className="ds-ascension--multiline" />
    </section>
  );
}

/* --------------------------------------------------------- dispatch windows */

function AvailabilitySheet({ s, t, lang, report }: { s: DeliverySchedulingState; t: T; lang: string; report: (r: ActionResult, success: string) => void }) {
  const onBehalf = s.isAdmin;
  const supplierName = s.board?.cards.find((c) => c.supplier.id === s.availSupplierId)?.supplier.name ?? s.ownSupplier?.name ?? '';
  const today = todayKey(Date.now());
  return (
    <Sheet
      open={s.availOpen}
      onClose={s.closeAvailability}
      title={onBehalf ? t(K.availability.titleFor, { supplier: supplierName }) : t(K.availability.title)}
      closeLabel={t('action.close')}
      footer={
        <Button block disabled={!s.availValid} loading={s.busy} onClick={() => void s.saveAvailability().then((res) => report(res, K.toast.availabilitySaved))}>
          {t(K.availability.save)}
        </Button>
      }
    >
      <div className="stack gap-4">
        <p className="t-sm t-muted">{t(K.availability.intro)}</p>
        {onBehalf && <p className="t-xs t-warning">{t(K.availability.onBehalf)}</p>}
        <div className="stack gap-2">
          <span className="label">{t(K.availability.weekdays)}</span>
          <div className="row wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button key={d} type="button" className="ds-chip" aria-pressed={s.avail.weekdays.includes(d)} onClick={() => s.toggleWeekday(d)}>
                {weekdayLabel(d, lang)}
              </button>
            ))}
          </div>
        </div>
        <div className="stack gap-2">
          <span className="label">{t(K.availability.windows)}</span>
          <div className="row wrap gap-2">
            {DELIVERY_WINDOWS.map((w) => (
              <button key={w} type="button" className="ds-chip" aria-pressed={s.avail.windows.includes(w)} onClick={() => s.toggleWindow(w)}>
                {t(WINDOW_LABEL_KEYS[w])} · {WINDOW_HOURS[w].from}–{WINDOW_HOURS[w].to}
              </button>
            ))}
          </div>
        </div>
        <div className="grid-2 gap-2">
          <Field label={t(K.availability.maxPerDay)} hint={t(K.availability.maxHint)}>
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} type="number" inputMode="numeric" mono value={s.avail.maxPerDay} onChange={(e) => s.setAvail({ ...s.avail, maxPerDay: e.target.value })} />
            )}
          </Field>
          <Field label={t(K.availability.leadDays)} hint={t(K.availability.leadHint)}>
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} type="number" inputMode="numeric" mono value={s.avail.leadDays} onChange={(e) => s.setAvail({ ...s.avail, leadDays: e.target.value })} />
            )}
          </Field>
        </div>
        <div className="stack gap-2">
          <span className="label">{t(K.availability.blackouts)}</span>
          {s.avail.blackouts.length === 0 && <p className="t-xs t-muted">{t(K.availability.none)}</p>}
          {s.avail.blackouts.map((b) => (
            <div key={b.date} className="row between gap-2">
              <span className="t-sm">
                {keyLabel(b.date, lang)} · {b.reason}
              </span>
              <Button size="sm" variant="ghost" aria-label={t(K.availability.remove)} icon={<X size={14} />} onClick={() => s.removeBlackout(b.date)} />
            </div>
          ))}
          <div className="grid-2 gap-2">
            <Field label={t(K.availability.blackoutDate)}>
              {({ id }) => <Input id={id} type="date" min={today} value={s.newBlackoutDate} onChange={(e) => s.setNewBlackoutDate(e.target.value)} />}
            </Field>
            <Field label={t(K.availability.blackoutReason)}>
              {({ id }) => <Input id={id} value={s.newBlackoutReason} onChange={(e) => s.setNewBlackoutReason(e.target.value)} />}
            </Field>
          </div>
          <div>
            <Button size="sm" variant="secondary" disabled={!s.newBlackoutDate || s.newBlackoutReason.trim().length < 2} onClick={s.addBlackout}>
              {t(K.availability.addBlackout)}
            </Button>
          </div>
        </div>
        {!s.availValid && <p className="t-xs t-error">{t(K.availability.invalid)}</p>}
      </div>
    </Sheet>
  );
}
