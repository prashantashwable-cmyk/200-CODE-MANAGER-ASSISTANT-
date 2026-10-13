import { useTranslation } from 'react-i18next';
import { CalendarBlank, CaretDown, CaretUp, Clock, Stack, WarningOctagon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  StatTile,
  Tabs,
  formatDate,
  formatINR,
  formatINRCompact,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { SupplierPaymentScheduleItem } from '@/data/repository';
import { CalendarView } from '@/features/calendar/CalendarView';
import type { CalendarEvent } from '@/features/calendar/calendarMath';
import { parseKey } from '@/features/logistics/deliverySlots';
import type { Bucket, ScheduleState } from '@/features/suppliers/paymentSchedule';
import { STATE_TONE, useSupplierPaymentSchedule } from './useSupplierPaymentSchedule';
import type { SupplierPaymentScheduleState } from './useSupplierPaymentSchedule';
import { PART_FILTERS, SCHEDULE_KEYS as K, VIEW_MODES } from './supplier-payment-schedule.types';

type T = ReturnType<typeof useTranslation>['t'];

const LOCALE: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const STATE_BADGE: Record<ScheduleState, BadgeTone> = { expected: 'emerald', owed: 'warning', waiting: 'error', held: 'neutral', approved: 'accent' };

const dayLabel = (key: string, lang: string, withYear = false) => new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }).format(parseKey(key));
const rangeLabel = (b: { start: string; end: string }, by: 'week' | 'month', lang: string) =>
  by === 'month'
    ? new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { month: 'long', year: 'numeric' }).format(parseKey(b.start))
    : `${new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { day: 'numeric', month: 'short' }).format(parseKey(b.start))} – ${new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { day: 'numeric', month: 'short' }).format(parseKey(b.end))}`;

/**
 * Screen 114 — Supplier Payment Schedule. A forward view of every supplier payment, read from the same milestone data as
 * 111's queue and 112's chains: nothing here is planned by hand. A payment that has really fired is shown as owed; the
 * rest are dated from where their milestone now realistically is, so a delivery that slips moves its balance with it, and an
 * order whose deal was lost or cancelled takes its unfired payments off the schedule. The week or month that carries far more
 * than a usual one is marked, so a concentration is seen well before the day.
 */
export function SupplierPaymentScheduleView() {
  const { t, i18n } = useTranslation();
  const s = useSupplierPaymentSchedule();
  const lang = i18n.language;

  if (s.status === 'loading' && !s.schedule) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.schedule) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const sched = s.schedule;
  if (sched.items.length === 0) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <EmptyState icon={<CalendarBlank size={32} />} title={t(K.empty.title)} body={t(K.empty.body)} />
        <Dropped s={s} t={t} />
      </Screen>
    );
  }

  const tot = s.totals;
  const suffix = s.isFiltered ? ` · ${t(K.totals.filtered)}` : '';
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '140px' } as React.CSSProperties}>
        <StatTile label={t(K.totals.owedNow)} value={<span className="num">{formatINRCompact(tot.owedNow)}</span>} caption={t(K.totals.count, { count: s.counts.owedNow }) + suffix} large />
        <StatTile label={t(K.totals.next7)} value={<span className="num">{formatINRCompact(tot.next7)}</span>} caption={t(K.totals.includesOwed)} />
        <StatTile label={t(K.totals.next30)} value={<span className="num">{formatINRCompact(tot.next30)}</span>} caption={t(K.totals.includesOwed)} />
        <StatTile label={t(K.totals.later)} value={<span className="num">{formatINRCompact(tot.later)}</span>} />
      </div>

      <div className="sticky-under-shell stack gap-2 mb-3">
        <div className="row wrap gap-2" style={{ alignItems: 'center' }}>
          <Select aria-label={t(K.filter.supplier)} value={s.supplierId} onChange={(e) => s.setSupplierId(e.target.value)} style={{ width: 'auto', maxWidth: '100%' }}>
            <option value="">{t(K.filter.allSuppliers)}</option>
            {sched.suppliers.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </Select>
          <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.type)}>
            {PART_FILTERS.map((f) => (
              <Chip key={f} pressed={s.part === f} onClick={() => s.setPart(f)}>
                {t(K.filter[f])}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {s.filtered.length === 0 ? (
        <EmptyState icon={<CalendarBlank size={28} />} title={t(K.noMatch.title)} body={t(K.noMatch.body)} actionLabel={t(K.noMatch.clear)} onAction={s.clearFilters} />
      ) : (
        <>
          <Flow s={s} t={t} lang={lang} />

          <div className="main-aside mt-3">
            <div className="stack gap-3">
              <Card>
                <Tabs label={t(K.view.label)} value={s.mode} onChange={(id) => s.changeMode(id as typeof s.mode)} items={VIEW_MODES.map((m) => ({ id: m, label: t(K.view[m]) }))} />
                <div className="mt-3">
                  <CalendarView
                    mode={s.mode}
                    cursor={s.cursor}
                    onCursorChange={s.setCursor}
                    events={s.events}
                    selected={s.selectedDate}
                    onSelect={s.selectDate}
                    renderAgendaRow={(e: CalendarEvent) => {
                      const item = s.itemOf(e.id);
                      return item ? <ItemRow item={item} s={s} t={t} lang={lang} /> : null;
                    }}
                  />
                </div>
                <Legend t={t} />
              </Card>

              {s.mode !== 'agenda' && s.selectedDate && (
                <section aria-live="polite" className="stack gap-2">
                  <h2 className="t-md t-semibold">{dayLabel(s.selectedDate, lang, true)}</h2>
                  {s.dayItems.length === 0 ? (
                    <EmptyState icon={<CalendarBlank size={28} />} title={t(K.day.empty)} body={t(K.day.emptyBody)} />
                  ) : (
                    <>
                      <Card className="ds-card--flush">
                        {s.dayItems.map((i) => (
                          <ItemRow key={i.id} item={i} s={s} t={t} lang={lang} />
                        ))}
                      </Card>
                      <span className="t-sm t-muted">{t(K.day.total, { amount: formatINR(s.dayItems.reduce((n, i) => n + i.amount, 0)) })}</span>
                    </>
                  )}
                </section>
              )}
            </div>

            <div className="stack gap-3">
              {s.undatedItems.length > 0 && (
                <Card>
                  <div className="stack gap-2">
                    <h2 className="t-md t-semibold">{t(K.flow.undated, { amount: formatINR(tot.undated) })}</h2>
                    <p className="t-xs t-muted">{t(K.flow.undatedBody)}</p>
                    <div className="stack">
                      {s.undatedItems.map((i) => (
                        <ItemRow key={i.id} item={i} s={s} t={t} lang={lang} />
                      ))}
                    </div>
                  </div>
                </Card>
              )}
              <Dropped s={s} t={t} />
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------- cash flow */

function Flow({ s, t, lang }: { s: SupplierPaymentScheduleState; t: T; lang: string }) {
  const by = s.groupBy;
  const heavy = s.heavyWeeks[0];
  return (
    <Card>
      <div className="stack gap-3">
        <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
          <div className="stack">
            <h2 className="t-md t-semibold">{t(K.flow.heading)}</h2>
            <span className="t-xs t-muted">{t(K.flow.hint)}</span>
          </div>
          <Tabs label={t(K.flow.by)} value={by} onChange={(id) => s.setGroupBy(id as 'week' | 'month')} items={[{ id: 'week', label: t(K.flow.week) }, { id: 'month', label: t(K.flow.month) }]} />
        </div>

        {heavy && (
          <div role="note" className="row gap-2" style={{ alignItems: 'flex-start' }}>
            <WarningOctagon size={18} aria-hidden="true" className="shrink-0" />
            <span className="t-sm">
              <strong>{t(K.flow.heavy)}</strong>{' '}
              {t(K.flow.heavyBody, {
                week: rangeLabel(heavy, 'week', lang),
                amount: formatINRCompact(heavy.amount),
                times: s.averageWeek > 0 ? (heavy.amount / s.averageWeek).toFixed(1) : '',
              })}
              {s.heavyWeeks.length > 1 ? ` ${t(K.flow.heavyWeek, { count: s.heavyWeeks.length - 1 })}` : ''}
            </span>
          </div>
        )}

        <div className="stack gap-2" role="list">
          {s.totals.owedNow > 0 && (
            <BucketRow
              key="now"
              label={t(K.flow.owedNow)}
              amount={s.totals.owedNow}
              running={s.totals.owedNow}
              biggest={s.biggest}
              heavy={false}
              items={s.dueNowItems}
              open={s.openBucket === 'now'}
              onToggle={() => s.toggleBucket('now')}
              s={s}
              t={t}
              lang={lang}
              tone="warning"
            />
          )}
          {s.buckets.map((b: Bucket<SupplierPaymentScheduleItem>) => (
            <BucketRow
              key={b.start}
              label={rangeLabel(b, by, lang)}
              amount={b.amount}
              running={b.running}
              biggest={s.biggest}
              heavy={b.heavy}
              items={b.items}
              open={s.openBucket === b.start}
              onToggle={() => s.toggleBucket(b.start)}
              s={s}
              t={t}
              lang={lang}
            />
          ))}
          {s.beyondItems.length > 0 && (
            <BucketRow
              key="beyond"
              label={t(K.flow.beyond)}
              amount={s.beyondItems.reduce((n, i) => n + i.amount, 0)}
              running={(s.buckets[s.buckets.length - 1]?.running ?? 0) + s.beyondItems.reduce((n, i) => n + i.amount, 0)}
              biggest={s.biggest}
              heavy={false}
              items={s.beyondItems}
              open={s.openBucket === 'beyond'}
              onToggle={() => s.toggleBucket('beyond')}
              s={s}
              t={t}
              lang={lang}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function BucketRow({
  label,
  amount,
  running,
  biggest,
  heavy,
  items,
  open,
  onToggle,
  s,
  t,
  lang,
  tone,
}: {
  label: string;
  amount: number;
  running: number;
  biggest: number;
  heavy: boolean;
  items: SupplierPaymentScheduleItem[];
  open: boolean;
  onToggle: () => void;
  s: SupplierPaymentScheduleState;
  t: T;
  lang: string;
  tone?: 'warning';
}) {
  const empty = items.length === 0;
  return (
    <div role="listitem" className="stack gap-1">
      <button type="button" className="stack gap-1" style={{ textAlign: 'start', width: '100%', background: 'none', border: 0, padding: 0, cursor: empty ? 'default' : 'pointer' }} onClick={empty ? undefined : onToggle} aria-expanded={empty ? undefined : open} disabled={empty}>
        <span className="row between gap-2" style={{ alignItems: 'baseline' }}>
          <span className="row gap-2" style={{ alignItems: 'center', minWidth: 0 }}>
            <span className="t-sm">{label}</span>
            {heavy && (
              <Badge tone="warning">
                <Stack size={12} aria-hidden="true" /> {t(K.flow.heavy)}
              </Badge>
            )}
          </span>
          <span className="row gap-2" style={{ alignItems: 'center' }}>
            <strong className="num t-sm">{amount > 0 ? formatINR(amount) : '—'}</strong>
            {!empty && (open ? <CaretUp size={14} aria-hidden="true" /> : <CaretDown size={14} aria-hidden="true" />)}
          </span>
        </span>
        <span aria-hidden="true" style={{ display: 'block', height: 8, borderRadius: 4, background: 'var(--color-border)' }}>
          <span style={{ display: 'block', height: '100%', width: `${Math.max(amount > 0 ? 2 : 0, Math.round((amount / biggest) * 100))}%`, borderRadius: 4, background: heavy || tone === 'warning' ? 'var(--color-warning)' : 'var(--color-accent-secondary)' }} />
        </span>
        <span className="t-xs t-muted">{t(K.flow.running, { amount: formatINR(running) })}</span>
      </button>
      {open && !empty && (
        <Card className="ds-card--flush">
          {items.map((i) => (
            <ItemRow key={i.id} item={i} s={s} t={t} lang={lang} />
          ))}
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ items */

function ItemRow({ item, s, t, lang }: { item: SupplierPaymentScheduleItem; s: SupplierPaymentScheduleState; t: T; lang: string }) {
  const dateLine = item.date === null ? t(K.item.undated) : item.isExpected ? t(K.item.expectedOn, { date: formatDate(item.date, lang) }) : t(K.item.owedSince, { date: formatDate(item.date, lang) });
  return (
    <div className="stack gap-1 ds-listrow" style={{ alignItems: 'stretch' }}>
      <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
        <span className="stack" style={{ minWidth: 0 }}>
          <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <strong className="t-sm">{item.supplierName}</strong>
            <Badge tone={STATE_BADGE[item.state]}>{t(K.state[item.state])}</Badge>
          </span>
          <span className="t-xs t-muted">{[item.poCode, item.siteName].filter(Boolean).join(' · ')}</span>
          <span className="t-xs t-muted">{t(K.part[item.part])}</span>
        </span>
        <strong className="num" style={{ flexShrink: 0 }}>
          {formatINR(item.amount)}
        </strong>
      </div>
      <span className="t-xs row gap-1" style={{ alignItems: 'center' }}>
        <Clock size={12} aria-hidden="true" /> {dateLine}
        {item.overdueDays > 0 && <span className="t-warning"> · {t(K.item.overdue, { count: item.overdueDays })}</span>}
      </span>
      {item.waitingOn && <span className="t-xs t-muted">{t(K.item.waitsFor, { what: t(K.waitingOn[item.waitingOn]) })}</span>}
      {item.slipDays > 0 && (
        <span className="t-xs t-warning">
          {t(K.item.slipped, { count: item.slipDays })}
          {item.plannedAt ? ` · ${t(K.item.plannedWas, { date: formatDate(item.plannedAt, lang) })}` : ''}
        </span>
      )}
      {item.flags.includes('orphaned') && <span className="t-xs t-error">{t(K.item.orphaned)}</span>}
      {item.flags.includes('invoice_unmatched') && <span className="t-xs t-error">{t(K.item.invoice)}</span>}
      {item.origin === 'override' && <span className="t-xs t-muted">{t(K.item.earlyRelease)}</span>}
      <div className="row gap-2 wrap">
        <Button size="sm" variant="secondary" onClick={() => s.openRelease(item)}>
          {t(K.item.release)}
        </Button>
        {item.paymentId && (
          <Button size="sm" variant="ghost" onClick={() => s.openApproval(item)}>
            {t(K.item.approvals)}
          </Button>
        )}
      </div>
    </div>
  );
}

function Legend({ t }: { t: T }) {
  const items: { tone: CalendarEvent['tone']; key: string }[] = [
    { tone: STATE_TONE.expected, key: K.legend.expected },
    { tone: STATE_TONE.owed, key: K.legend.owed },
    { tone: STATE_TONE.held, key: K.legend.held },
    { tone: STATE_TONE.approved, key: K.legend.approved },
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

function Dropped({ s, t }: { s: SupplierPaymentScheduleState; t: T }) {
  const dropped = s.schedule?.dropped ?? [];
  if (dropped.length === 0) return null;
  return (
    <Card>
      <div className="stack gap-1" role="note">
        <h2 className="t-sm t-semibold">{t(K.dropped.heading, { count: dropped.length })}</h2>
        <p className="t-xs t-muted">{t(K.dropped.body)}</p>
        {dropped.map((d) => (
          <span key={d.poId} className="t-xs">
            {t(K.dropped.row, { code: d.poCode, supplier: d.supplierName, amount: formatINR(d.amount) })}
          </span>
        ))}
      </div>
    </Card>
  );
}
