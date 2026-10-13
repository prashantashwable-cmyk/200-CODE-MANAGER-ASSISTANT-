import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowClockwise, ArrowDown, ArrowUp, ChartBar, DownloadSimple, Minus, Plus, Scales, Trash, Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  ProgressBar,
  Screen,
  ScreenHeader,
  Sheet,
  Tabs,
  TextArea,
  formatDate,
  formatINR,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { DisputeAnalyticsRowView, KpiFigure, PaySpeedRowView, SpendMonthView, SpendRowView } from '@/data/repository';
import { PAYMENT_TARGET_DAYS, trendOf } from '@/features/suppliers/paymentAnalytics';
import type { Direction, TrendTone } from '@/features/suppliers/paymentAnalytics';
import { useSupplierPaymentAnalytics } from './useSupplierPaymentAnalytics';
import type { ActionResult, SupplierPaymentAnalyticsState } from './useSupplierPaymentAnalytics';
import { ANALYTICS_KEYS as K, METRIC_NAMES, PERIODS, SPEND_GROUPS, TABS, TONE_CLASS } from './supplier-payment-analytics.types';
import type { AnalyticsTab } from './supplier-payment-analytics.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string) => void;

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const DIRECTION_ICON: Record<Direction, ReactNode> = {
  up: <ArrowUp size={12} weight="bold" aria-hidden="true" />,
  down: <ArrowDown size={12} weight="bold" aria-hidden="true" />,
  flat: <Minus size={12} weight="bold" aria-hidden="true" />,
};
const REASON_TONE: Record<string, BadgeTone> = { high_rate: 'error', halt_threat: 'error', slow_resolution: 'warning', repeat_rounds: 'warning' };

const monthShort = (key: string, lang: string) => new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(`${key}-01T00:00:00`));
const monthLong = (key: string, lang: string) => new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(`${key}-01T00:00:00`));
const daysText = (t: T, d: number | null) => (d === null ? '—' : t(K.unit.days, { count: d }));
/** A CSV cell, quoted so a comma or quote in a supplier name cannot shift the columns. */
const cell = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/**
 * Screen 119 — Supplier Payment Analytics. The money-out counterpart to the customer-facing analytics: a synthesis of the payments,
 * retentions and disputes already recorded, never a dataset of its own. Every figure says how sure it is. A new relationship's
 * first payments are set aside from the average by default and flagged as an early look, a month that stands out is explained by
 * the one order behind it (or by Admin's own note) rather than read as a cost-control failure, and a supplier whose disputes stand
 * out is flagged here and as one alert so a review is suggested rather than left in a statistic.
 */
export function SupplierPaymentAnalyticsView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useSupplierPaymentAnalytics();

  const report: Report = (r, success) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success), 'success');
  };

  if (s.status === 'loading' && !s.data) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.data) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const lang = i18n.language;
  const d = s.data;
  const speedKpi = s.setAside ? d.speed.kpiExcl : d.speed.kpi;

  const exportCsv = () => {
    const period = `${d.months[0]}..${d.months[d.months.length - 1]}`;
    const dir = (k: KpiFigure | null) => (k ? k.direction : '');
    const rows: (string | number | null)[][] = [
      [METRIC_NAMES.spend, '', period, d.spend.total, dir(d.spend.kpi)],
      [METRIC_NAMES.daysToPay, '', period, speedKpi.value, dir(speedKpi)],
      [METRIC_NAMES.retentionHeld, '', period, d.retention.heldNow, dir(d.retention.kpi)],
      [METRIC_NAMES.disputeRate, '', period, d.disputes.ratePct, dir(d.disputes.kpi)],
      [METRIC_NAMES.resolutionDays, '', period, d.disputes.avgResolutionDays, dir(d.disputes.resolutionKpi)],
      ...d.spend.suppliers.map((r) => [METRIC_NAMES.spend, r.id, period, r.total, r.changePct === null ? '' : r.changePct > 0 ? 'up' : r.changePct < 0 ? 'down' : 'flat']),
      ...d.speed.suppliers.map((r) => [METRIC_NAMES.daysToPay, r.id, period, r.avgDays, '']),
      ...d.disputes.suppliers.flatMap((r) => [
        [METRIC_NAMES.disputeRate, r.id, period, r.ratePct, ''],
        [METRIC_NAMES.resolutionDays, r.id, period, r.avgResolutionDays, ''],
      ]),
      ...d.spend.byMonth.map((m) => [METRIC_NAMES.spend, '', m.key, m.total, '']),
    ];
    const head = ['metric_name', 'supplier_id', 'period', 'metric_value', 'trend_direction'].map(cell).join(',');
    const blob = new Blob(['﻿' + [head, ...rows.map((r) => r.map(cell).join(','))].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier-payment-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.push(t(K.exportAction.done, { count: rows.length }), 'success');
  };

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <div className="row gap-2">
            <Button size="sm" variant="secondary" onClick={exportCsv}>
              <DownloadSimple size={14} aria-hidden="true" /> {t(K.exportAction.label)}
            </Button>
            <Button size="sm" variant="secondary" onClick={s.reload} aria-label={t(K.refresh)}>
              <ArrowClockwise size={14} aria-hidden="true" /> {t(K.refresh)}
            </Button>
          </div>
        }
      />

      <div className="sticky-under-shell stack gap-2 mb-3">
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.period.label)}>
          {PERIODS.map((m) => (
            <Chip key={m} pressed={s.months === m} onClick={() => s.setMonths(m)}>
              {t(K.period.months, { count: m })}
            </Chip>
          ))}
          <Chip pressed={s.setAside} onClick={() => s.setSetAside(!s.setAside)}>
            {t(K.setAside.label)}
          </Chip>
        </div>
      </div>

      <ReviewBanner rows={d.disputes.suppliers} onOpen={() => s.setTab('disputes')} t={t} />

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '150px' } as CSSProperties}>
        <KpiCard
          label={t(K.kpi.spend)}
          active={s.tab === 'spend'}
          onClick={() => s.setTab('spend')}
          value={formatINRCompact(d.spend.total)}
          trend={d.spend.kpi}
          deltaText={d.spend.kpi.delta === null ? t(K.kpi.noCompare) : t(K.kpi.vsBeforePct, { value: Math.abs(d.spend.kpi.delta), months: s.months })}
          caption={t(K.kpi.spendCaption)}
          t={t}
        />
        <KpiCard
          label={t(K.kpi.speed)}
          active={s.tab === 'speed'}
          onClick={() => s.setTab('speed')}
          value={speedKpi.value === null ? t(K.kpi.noData) : daysText(t, speedKpi.value)}
          trend={speedKpi}
          deltaText={speedKpi.delta === null ? t(K.kpi.noCompare) : t(K.kpi.vsBeforeDays, { value: Math.abs(speedKpi.delta), months: s.months })}
          caption={t(K.kpi.speedCaption, { days: PAYMENT_TARGET_DAYS })}
          t={t}
        />
        <KpiCard
          label={t(K.kpi.retention)}
          active={s.tab === 'retention'}
          onClick={() => s.setTab('retention')}
          value={formatINRCompact(d.retention.heldNow)}
          trend={d.retention.kpi}
          deltaText={d.retention.kpi.delta === null ? t(K.kpi.noCompare) : t(K.kpi.vsBeforePct, { value: Math.abs(d.retention.kpi.delta), months: s.months })}
          caption={t(K.kpi.retentionCaption)}
          t={t}
        />
        <KpiCard
          label={t(K.kpi.disputes)}
          active={s.tab === 'disputes'}
          onClick={() => s.setTab('disputes')}
          value={d.disputes.ratePct === null ? t(K.kpi.noData) : t(K.unit.pct, { value: d.disputes.ratePct })}
          trend={d.disputes.kpi}
          deltaText={d.disputes.kpi.delta === null ? t(K.kpi.noCompare) : t(K.kpi.vsBeforePts, { value: Math.abs(d.disputes.kpi.delta), months: s.months })}
          caption={t(K.kpi.disputesCaption)}
          t={t}
        />
      </div>

      <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as AnalyticsTab)} items={TABS.map((id) => ({ id, label: t(K.tab[id]) }))} className="mb-3" />

      {s.tab === 'spend' && <SpendTab s={s} t={t} lang={lang} report={report} />}
      {s.tab === 'speed' && <SpeedTab s={s} t={t} lang={lang} />}
      {s.tab === 'retention' && <RetentionTab s={s} t={t} lang={lang} />}
      {s.tab === 'disputes' && <DisputesTab s={s} t={t} />}

      <NoteSheet s={s} t={t} lang={lang} report={report} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ KPI */

function KpiCard({ label, value, trend, deltaText, caption, active, onClick, t }: { label: string; value: string; trend: Pick<KpiFigure, 'direction' | 'tone' | 'delta'>; deltaText: string; caption: string; active: boolean; onClick: () => void; t: T }) {
  const tone: TrendTone = trend.tone;
  return (
    <button type="button" className="ds-card ds-card--interactive" style={{ textAlign: 'start', width: '100%', outline: active ? '2px solid var(--color-accent-primary)' : undefined }} onClick={onClick} aria-pressed={active} aria-label={`${label}: ${value}. ${t(K.kpi.open)}`}>
      <div className="stack gap-1">
        <span className="t-xs t-muted">{label}</span>
        <strong style={{ fontFamily: 'var(--font-mono, inherit)', fontSize: '1.3rem', fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
        <span className={`t-xs row gap-1 ${TONE_CLASS[tone]}`} style={{ alignItems: 'center' }}>
          {DIRECTION_ICON[trend.direction]}
          <span className="sr-only">{t(K.kpi[trend.direction])}</span>
          {deltaText}
        </span>
        <span className="t-xs t-muted">{caption}</span>
      </div>
    </button>
  );
}

/* --------------------------------------------------------------- review */

/** A supplier whose disputes stand out is said out loud here, not left as one row in a table. */
function ReviewBanner({ rows, onOpen, t }: { rows: DisputeAnalyticsRowView[]; onOpen: () => void; t: T }) {
  const flagged = rows.filter((r) => r.reasons.length > 0);
  if (flagged.length === 0) return null;
  return (
    <Card className="mb-3" style={{ borderColor: 'var(--color-warning)' }}>
      <div className="row-top gap-3">
        <Warning size={22} color="var(--color-warning)" aria-hidden="true" />
        <div className="stack gap-1 grow">
          <h2 className="t-md t-semibold">{t(K.review.title, { count: flagged.length })}</h2>
          <p className="t-sm t-muted">{t(K.review.body)}</p>
          <ul className="stack gap-1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {flagged.map((r) => (
              <li key={r.id} className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                <strong className="t-sm">{r.name}</strong>
                {r.reasons.map((reason) => (
                  <Badge key={reason} tone={REASON_TONE[reason]}>
                    {t(K.review.reason[reason])}
                  </Badge>
                ))}
              </li>
            ))}
          </ul>
        </div>
        <Button size="sm" variant="secondary" onClick={onOpen}>
          {t(K.review.open)}
        </Button>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- bars */

interface BarDatum {
  key: string;
  /** Height as a fraction of the tallest, and the text over it. Null draws an honest gap. */
  value: number | null;
  text: string;
  tone?: 'accent' | 'warning' | 'muted';
  marked?: boolean;
}

const BAR_COLOR = { accent: 'var(--color-accent-primary)', warning: 'var(--color-warning)', muted: 'var(--color-border)' } as const;

function MonthBars({ data, max, lang, aria, t }: { data: BarDatum[]; max: number; lang: string; aria: string; t: T }) {
  return (
    <div className="row gap-1" style={{ alignItems: 'flex-end', height: 156 }} role="img" aria-label={aria}>
      {data.map((b) => (
        <div key={b.key} className="stack grow" style={{ alignItems: 'center', justifyContent: 'flex-end', height: '100%', minWidth: 0 }}>
          <span className="t-xs" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {b.value === null ? '—' : b.text}
          </span>
          <div style={{ width: '70%', maxWidth: 44, height: b.value === null ? 2 : `${Math.max(3, (b.value / Math.max(1, max)) * 100)}%`, background: b.value === null ? BAR_COLOR.muted : BAR_COLOR[b.tone ?? 'accent'], borderRadius: '4px 4px 0 0' }} />
          <span className="t-xs t-muted row gap-1" style={{ alignItems: 'center' }}>
            {monthShort(b.key, lang)}
            {b.marked && <ChartBar size={11} aria-label={t(K.spend.spike.marker)} color="var(--color-warning)" />}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- spend */

function SpendTab({ s, t, lang, report }: { s: SupplierPaymentAnalyticsState; t: T; lang: string; report: Report }) {
  const d = s.data!;
  if (!s.hasSpend) return <EmptyState icon={<ChartBar size={28} />} title={t(K.spend.emptyTitle)} body={t(K.spend.emptyBody)} />;
  const max = Math.max(1, ...d.spend.byMonth.map((m) => m.total));
  const bars: BarDatum[] = d.spend.byMonth.map((m) => ({ key: m.key, value: m.total === 0 ? null : m.total, text: formatINRCompact(m.total), tone: m.spike && !m.note ? 'warning' : 'accent', marked: !!m.spike || !!m.note }));
  const stand = d.spend.byMonth.filter((m) => m.spike);
  const rows = s.group === 'suppliers' ? d.spend.suppliers : d.spend.categories;
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.spend.intro)}</p>
      <Card>
        <div className="stack gap-2">
          <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
            <h2 className="t-md t-semibold">{t(K.spend.monthsHeading)}</h2>
            {d.spend.typicalMonth !== null && <span className="t-xs t-muted">{t(K.spend.typical, { amount: formatINRCompact(d.spend.typicalMonth) })}</span>}
          </div>
          <MonthBars data={bars} max={max} lang={lang} aria={t(K.chart.spendAria)} t={t} />
        </div>
      </Card>

      {stand.map((m) => (
        <SpikeCard key={m.key} m={m} s={s} t={t} lang={lang} />
      ))}

      <div className="stack gap-2">
        <Tabs label={t(K.spend.group.label)} value={s.group} onChange={(id) => s.setGroup(id as (typeof SPEND_GROUPS)[number])} items={SPEND_GROUPS.map((g) => ({ id: g, label: t(K.spend.group[g]) }))} />
        <p className="t-xs t-muted">{t(K.spend.groupHint[s.group])}</p>
        <Card className="ds-card--flush">
          {rows.map((r) => (
            <SpendRow key={r.id} r={r} name={s.group === 'categories' ? t(`partCategory.${r.id}`, { defaultValue: t(K.spend.otherCategory) }) : r.name} t={t} />
          ))}
        </Card>
      </div>

      <section className="stack gap-2" aria-labelledby="notes-h">
        <h2 id="notes-h" className="t-md t-semibold">
          {t(K.spend.notes.heading)}
        </h2>
        {d.notes.length === 0 ? (
          <p className="t-sm t-muted">{t(K.spend.notes.hint)}</p>
        ) : (
          <Card className="ds-card--flush">
            {d.notes.map((n) => (
              <div key={n.id} className="ds-listrow" style={{ alignItems: 'flex-start' }}>
                <span className="stack grow" style={{ minWidth: 0 }}>
                  <strong className="t-sm">
                    {monthLong(n.month, lang)} · {n.label}
                  </strong>
                  {n.note && <span className="t-sm">{n.note}</span>}
                  <span className="t-xs t-muted">{t(K.spend.notes.by, { name: n.byName, date: formatDate(n.at, lang) })}</span>
                </span>
                <Button size="sm" variant="ghost" disabled={s.busy} onClick={async () => report(await s.removeNote(n.id), K.spend.sheet.removed)} aria-label={t(K.spend.notes.remove)}>
                  <Trash size={14} aria-hidden="true" />
                </Button>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function SpikeCard({ m, s, t, lang }: { m: SpendMonthView; s: SupplierPaymentAnalyticsState; t: T; lang: string }) {
  const sp = m.spike!;
  return (
    <Card style={{ borderColor: m.note ? undefined : 'var(--color-warning)' }}>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
          <h3 className="t-md t-semibold">{t(K.spend.spike.title, { month: monthLong(m.key, lang) })}</h3>
          <Badge tone={m.note ? 'success' : 'warning'}>{t(K.spend.spike.ratio, { ratio: sp.ratio })}</Badge>
        </div>
        <p className="t-sm">
          {t(sp.oneOrder ? K.spend.spike.oneOrder : K.spend.spike.several, {
            po: sp.largest?.poCode ?? '',
            supplier: sp.largest?.supplierName ?? '',
            share: sp.largest?.sharePct ?? 0,
            amount: formatINR(sp.largest?.amount ?? 0),
          })}
        </p>
        {m.note ? (
          <p className="t-sm">
            <strong>{t(K.spend.spike.explained)}:</strong> {m.note.label}
            {m.note.note ? ` — ${m.note.note}` : ''}
          </p>
        ) : (
          <div>
            <Button size="sm" variant="secondary" onClick={() => s.openNote(m.key)}>
              <Plus size={14} aria-hidden="true" /> {t(K.spend.spike.explain)}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function SpendRow({ r, name, t }: { r: SpendRowView; name: string; t: T }) {
  const trend = r.changePct === null ? null : trendOf(r.changePct, 0, 'lower', 1);
  return (
    <div className="ds-listrow" style={{ alignItems: 'flex-start' }}>
      <span className="stack grow gap-1" style={{ minWidth: 0 }}>
        <strong className="t-sm">{name}</strong>
        <ProgressBar value={r.sharePct / 100} label={t(K.spend.row.share, { pct: r.sharePct })} />
        <span className="t-xs t-muted">
          {t(K.spend.row.share, { pct: r.sharePct })} · {t(K.spend.row.payments, { count: r.payments })}
        </span>
      </span>
      <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(r.total)}</strong>
        <span className="t-xs t-muted row gap-1" style={{ alignItems: 'center' }}>
          {trend ? DIRECTION_ICON[trend.direction] : null}
          {r.changePct === null ? t(K.spend.row.fresh) : t(K.spend.row.change, { value: Math.abs(r.changePct) })}
        </span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- speed */

function SpeedTab({ s, t, lang }: { s: SupplierPaymentAnalyticsState; t: T; lang: string }) {
  const d = s.data!.speed;
  const navigate = useNavigate();
  if (d.payments === 0 && d.waiting.count === 0) return <EmptyState icon={<Scales size={28} />} title={t(K.speed.emptyTitle)} body={t(K.speed.emptyBody)} />;
  const values = d.months.map((m) => (s.setAside ? m.avgDaysExcl : m.avgDays));
  const max = Math.max(1, d.targetDays, ...values.map((v) => v ?? 0));
  const bars: BarDatum[] = d.months.map((m, i) => ({ key: m.key, value: values[i], text: values[i] === null ? '—' : String(values[i]), tone: values[i] !== null && (values[i] as number) > d.targetDays ? 'warning' : 'accent' }));
  const avg = (s.setAside ? d.kpiExcl : d.kpi).value;
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.speed.intro)}</p>
      <div className="grid-auto" style={{ ['--min' as string]: '140px' } as CSSProperties}>
        <Tile label={t(K.speed.average)} value={daysText(t, avg)} />
        <Tile label={t(K.speed.median)} value={daysText(t, d.medianDays)} />
        <Tile label={t(K.speed.within, { days: d.targetDays })} value={d.withinTargetPct === null ? '—' : t(K.unit.pct, { value: d.withinTargetPct })} />
      </div>
      <Card>
        <div className="stack gap-2">
          <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
            <h2 className="t-md t-semibold">{t(K.speed.monthsHeading)}</h2>
            <span className="t-xs t-muted">{t(K.speed.target, { days: d.targetDays })}</span>
          </div>
          {bars.every((b) => b.value === null) ? <p className="t-sm t-muted">{t(K.chart.noData)}</p> : <MonthBars data={bars} max={max} lang={lang} aria={t(K.chart.speedAria)} t={t} />}
          {d.settling > 0 && <p className="t-xs t-muted">{t(s.setAside ? K.speed.setAsideNote : K.speed.includedNote, { count: d.settling })}</p>}
        </div>
      </Card>

      <Card>
        <div className="stack gap-2">
          <h2 className="t-md t-semibold">{t(K.speed.waiting.heading)}</h2>
          {d.waiting.count === 0 && d.waiting.heldCount === 0 ? (
            <p className="t-sm t-muted">{t(K.speed.waiting.none)}</p>
          ) : (
            <>
              {d.waiting.count > 0 && (
                <p className="t-sm">
                  {t(K.speed.waiting.summary, { count: d.waiting.count, amount: formatINR(d.waiting.amount) })}
                  {d.waiting.oldestDays !== null ? ` ${t(K.speed.waiting.oldest, { days: d.waiting.oldestDays })}` : ''}
                </p>
              )}
              {d.waiting.overTarget > 0 && <Badge tone="warning">{t(K.speed.waiting.over, { count: d.waiting.overTarget, days: d.targetDays })}</Badge>}
              {d.waiting.heldCount > 0 && <p className="t-xs t-muted">{t(K.speed.waiting.held, { count: d.waiting.heldCount })}</p>}
              <div>
                <Button size="sm" variant="secondary" onClick={() => navigate('/supplier-payments')}>
                  {t(K.speed.waiting.open)}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <section className="stack gap-2" aria-labelledby="speed-sup-h">
        <h2 id="speed-sup-h" className="t-md t-semibold">
          {t(K.speed.suppliersHeading)}
        </h2>
        <p className="t-xs t-muted">{t(K.speed.earlyHint)}</p>
        <Card className="ds-card--flush">
          {d.suppliers.map((r) => (
            <SpeedRow key={r.id} r={r} t={t} />
          ))}
        </Card>
      </section>

      {d.slowest.length > 0 && (
        <section className="stack gap-2" aria-labelledby="slow-h">
          <h2 id="slow-h" className="t-md t-semibold">
            {t(K.speed.slowestHeading)}
          </h2>
          <Card className="ds-card--flush">
            {d.slowest.map((p) => (
              <div key={p.id} className="ds-listrow">
                <span className="stack grow" style={{ minWidth: 0 }}>
                  <strong className="t-sm">
                    {p.code} · {p.poCode}
                  </strong>
                  <span className="t-xs t-muted">
                    {p.supplierName} · {formatDate(p.paidAt, lang)}
                  </span>
                  {p.settling && <Badge tone="neutral">{t(K.speed.settling)}</Badge>}
                </span>
                <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{daysText(t, p.days)}</strong>
                  <span className="t-xs t-muted">{formatINR(p.amount)}</span>
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="ds-card">
      <div className="stack gap-1">
        <span className="t-xs t-muted">{label}</span>
        <strong style={{ fontFamily: 'var(--font-mono, inherit)', fontSize: '1.2rem', fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
      </div>
    </div>
  );
}

function SpeedRow({ r, t }: { r: PaySpeedRowView; t: T }) {
  return (
    <div className="ds-listrow">
      <span className="stack grow" style={{ minWidth: 0 }}>
        <strong className="t-sm">{r.name}</strong>
        <span className="t-xs t-muted">
          {t(K.speed.row.payments, { count: r.payments })}
          {r.withinTargetPct !== null ? ` · ${t(K.speed.row.within, { pct: r.withinTargetPct })}` : ''}
        </span>
        {!r.rated && <Badge tone="neutral">{t(K.speed.early)}</Badge>}
      </span>
      <strong style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{daysText(t, r.avgDays)}</strong>
    </div>
  );
}

/* ------------------------------------------------------------ retention */

function RetentionTab({ s, t, lang }: { s: SupplierPaymentAnalyticsState; t: T; lang: string }) {
  const d = s.data!.retention;
  const navigate = useNavigate();
  const empty = d.heldNow === 0 && d.releasedInWindow === 0 && d.withheldInWindow === 0 && d.months.every((m) => m.held === 0);
  if (empty) return <EmptyState icon={<Scales size={28} />} title={t(K.retention.emptyTitle)} body={t(K.retention.emptyBody)} />;
  const max = Math.max(1, ...d.months.map((m) => m.held));
  const bars: BarDatum[] = d.months.map((m) => ({ key: m.key, value: m.held === 0 ? null : m.held, text: formatINRCompact(m.held) }));
  const moved = d.months.filter((m) => m.released > 0 || m.withheld > 0);
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.retention.intro)}</p>
      <div className="grid-auto" style={{ ['--min' as string]: '140px' } as CSSProperties}>
        <Tile label={t(K.retention.heldNow)} value={formatINR(d.heldNow)} />
        <Tile label={t(K.retention.paused)} value={formatINR(d.pausedNow)} />
        <Tile label={t(K.retention.released)} value={formatINR(d.releasedInWindow)} />
        <Tile label={t(K.retention.withheld)} value={formatINR(d.withheldInWindow)} />
      </div>
      <Card>
        <div className="stack gap-2">
          <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
            <h2 className="t-md t-semibold">{t(K.retention.monthsHeading)}</h2>
            {d.oldestHeldDays !== null && <span className="t-xs t-muted">{t(K.retention.oldest, { days: d.oldestHeldDays })}</span>}
          </div>
          <MonthBars data={bars} max={max} lang={lang} aria={t(K.chart.retentionAria)} t={t} />
        </div>
      </Card>
      {moved.length > 0 && (
        <Card className="ds-card--flush">
          {moved.map((m) => (
            <div key={m.key} className="ds-listrow">
              <strong className="t-sm grow">{monthLong(m.key, lang)}</strong>
              <span className="t-xs t-muted" style={{ textAlign: 'end' }}>
                {t(K.retention.monthLine, { released: formatINR(m.released), withheld: formatINR(m.withheld) })}
              </span>
            </div>
          ))}
        </Card>
      )}
      <div>
        <Button size="sm" variant="secondary" onClick={() => navigate('/advance-retention?tab=retentions')}>
          {t(K.retention.open)}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- disputes */

function DisputesTab({ s, t }: { s: SupplierPaymentAnalyticsState; t: T }) {
  const d = s.data!.disputes;
  if (d.suppliers.length === 0) return <EmptyState icon={<Scales size={28} />} title={t(K.disputes.emptyTitle)} body={t(K.disputes.emptyBody)} />;
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.disputes.intro)}</p>
      <div className="grid-auto" style={{ ['--min' as string]: '140px' } as CSSProperties}>
        <Tile label={t(K.disputes.rate)} value={d.ratePct === null ? '—' : t(K.unit.pct, { value: d.ratePct })} />
        <Tile label={t(K.disputes.resolution)} value={daysText(t, d.avgResolutionDays)} />
        <Tile label={t(K.disputes.openNow)} value={String(d.open)} />
        {d.processFlags > 0 && <Tile label={t(K.disputes.processFlags)} value={String(d.processFlags)} />}
      </div>
      <p className="t-xs t-muted">{t(K.disputes.target, { days: d.targetDays })}</p>
      <section className="stack gap-2" aria-labelledby="disp-sup-h">
        <h2 id="disp-sup-h" className="t-md t-semibold">
          {t(K.disputes.suppliersHeading)}
        </h2>
        {d.reviewCount === 0 && <p className="t-sm t-muted">{t(K.disputes.noneStandOut)}</p>}
        <div className="stack gap-2">
          {d.suppliers.map((r) => (
            <DisputeRow key={r.id} r={r} focus={s.focusSupplier === r.id} t={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DisputeRow({ r, focus, t }: { r: DisputeAnalyticsRowView; focus: boolean; t: T }) {
  const flagged = r.reasons.length > 0;
  return (
    <Card style={{ borderColor: flagged ? 'var(--color-warning)' : undefined, outline: focus ? '2px solid var(--color-accent-primary)' : undefined }}>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
          <strong className="t-sm">{r.name}</strong>
          <span className="row gap-2" style={{ alignItems: 'center' }}>
            {!r.rated && <Badge tone="neutral">{t(K.disputes.row.early)}</Badge>}
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{r.ratePct === null ? '—' : t(K.unit.pct, { value: r.ratePct })}</strong>
          </span>
        </div>
        <span className="t-xs t-muted">
          {t(K.disputes.row.of, { disputes: r.disputes, orders: r.orders })}
          {' · '}
          {r.avgResolutionDays === null ? t(K.disputes.row.noneResolved) : t(K.disputes.row.resolution, { days: r.avgResolutionDays })}
          {r.open > 0 ? ` · ${t(K.disputes.row.open, { count: r.open })}` : ''}
          {r.maxRound >= 2 ? ` · ${t(K.disputes.row.rounds, { count: r.maxRound - 1 })}` : ''}
        </span>
        {flagged && (
          <div className="stack gap-1">
            <div className="row gap-2 wrap">
              <Badge tone="warning">{t(K.disputes.row.review)}</Badge>
              {r.reasons.map((reason) => (
                <Badge key={reason} tone={REASON_TONE[reason]}>
                  {t(K.review.reason[reason])}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="row gap-2 wrap">
          {r.latestDisputeId && (
            <Link className="ds-btn ds-btn--secondary ds-btn--sm" to={`/supplier-disputes?dispute=${r.latestDisputeId}`}>
              {t(K.disputes.seeDispute)}
            </Link>
          )}
          {flagged && (
            <Link className="ds-btn ds-btn--secondary ds-btn--sm" to="/admin/suppliers">
              {t(K.disputes.seeSuppliers)}
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- notes */

function NoteSheet({ s, t, lang, report }: { s: SupplierPaymentAnalyticsState; t: T; lang: string; report: Report }) {
  return (
    <Sheet open={s.sheetOpen} onClose={() => s.setSheetOpen(false)} title={t(K.spend.sheet.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{s.draft.month ? monthLong(s.draft.month, lang) : ''}</p>
        <Field label={t(K.spend.sheet.label)} hint={t(K.spend.sheet.labelHint)} required>
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={s.draft.label} onChange={(e) => s.patchDraft({ label: e.target.value })} />}
        </Field>
        <Field label={t(K.spend.sheet.note)}>{({ id }) => <TextArea id={id} rows={3} value={s.draft.note} onChange={(e) => s.patchDraft({ note: e.target.value })} />}</Field>
        <Button
          disabled={!s.canSave || s.busy}
          onClick={async () => {
            report(await s.saveNote(), K.spend.sheet.saved);
          }}
        >
          {t(K.spend.sheet.save)}
        </Button>
      </div>
    </Sheet>
  );
}
