import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowClockwise, ArrowDown, ArrowUp, CheckCircle, CloudLightning, Minus, Plus, Trash, TrendUp, Truck, Warning } from '@phosphor-icons/react';
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
  Screen,
  ScreenHeader,
  Sheet,
  StatTile,
  Tabs,
  TextArea,
  formatDate,
  formatINR,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { DisruptionView, IncidentRowView, KpiFigure, OnTimeRowView, TransitRegionView } from '@/data/repository';
import { trendOf } from '@/features/logistics/deliveryAnalytics';
import type { Direction, TrendTone } from '@/features/logistics/deliveryAnalytics';
import { useDeliveryAnalytics } from './useDeliveryAnalytics';
import type { ActionResult, DeliveryAnalyticsState } from './useDeliveryAnalytics';
import { ANALYTICS_KEYS as K, ANALYTICS_TABS, ON_TIME_GROUPS, PERIODS, TONE_CLASS } from './delivery-analytics.types';
import type { AnalyticsTab } from './delivery-analytics.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string) => void;

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const DIRECTION_ICON: Record<Direction, ReactNode> = { up: <ArrowUp size={12} weight="bold" aria-hidden="true" />, down: <ArrowDown size={12} weight="bold" aria-hidden="true" />, flat: <Minus size={12} weight="bold" aria-hidden="true" /> };

const monthLabel = (key: string, lang: string) => new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(`${key}-01T00:00:00`));
const hoursText = (t: T, h: number | null) => (h === null ? '—' : t(K.unit.hours, { value: h }));

/**
 * Screen 110 — Delivery Analytics. Keeps no data of its own: everything is read off the checklists, reports,
 * delay alerts, ratings and carrier trips already recorded. Each figure says how sure it is: a region with too
 * few deliveries reads "emerging" rather than a false precision, a bad month an outside event explains is
 * annotated, and a cost is counted once per incident.
 */
export function DeliveryAnalyticsView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useDeliveryAnalytics();

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
  const overall = d.overall;
  const onTimeNow = s.setAside ? overall.onTimePctExcl : overall.onTimePct;
  const onTimeBefore = s.setAside ? overall.previousPctExcl : overall.previousPct;
  const onTimeTrend = trendOf(onTimeNow, onTimeBefore, 'higher', 1);

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button size="sm" variant="secondary" onClick={s.reload} aria-label={t(K.refresh)}>
            <ArrowClockwise size={14} aria-hidden="true" /> {t(K.refresh)}
          </Button>
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

      <div className="mb-3" style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <KpiCard
          label={t(K.kpi.ontime)}
          active={s.tab === 'ontime'}
          onClick={() => s.setTab('ontime')}
          value={onTimeNow === null ? t(K.kpi.noData) : `${onTimeNow}%`}
          trend={{ direction: onTimeTrend.direction, tone: onTimeTrend.tone, delta: onTimeTrend.delta }}
          deltaText={onTimeTrend.delta === null ? t(K.kpi.noCompare) : t(K.kpi.vsBeforePts, { value: Math.abs(Math.round(onTimeTrend.delta)), months: s.months })}
          caption={t(K.kpi.ontimeCaption)}
          t={t}
        />
        <KpiCard
          label={t(K.kpi.transit)}
          active={s.tab === 'transit'}
          onClick={() => s.setTab('transit')}
          value={d.transitKpi.value === null ? t(K.kpi.emerging) : hoursText(t, d.transitKpi.value)}
          trend={d.transitKpi}
          deltaText={d.transitKpi.delta === null ? t(K.kpi.noCompare) : t(K.kpi.vsBefore, { value: Math.abs(d.transitKpi.delta), months: s.months })}
          caption={t(K.kpi.transitCaption)}
          t={t}
        />
        <KpiCard
          label={t(K.kpi.damage)}
          active={s.tab === 'damage'}
          onClick={() => s.setTab('damage')}
          value={d.incidentKpi.value === null ? t(K.kpi.noData) : t(K.unit.per100, { value: d.incidentKpi.value })}
          trend={d.incidentKpi}
          deltaText={d.incidentKpi.delta === null ? t(K.kpi.noCompare) : t(K.kpi.vsBeforePer100, { value: Math.abs(d.incidentKpi.delta), months: s.months })}
          caption={t(K.kpi.damageCaption)}
          t={t}
        />
        <KpiCard
          label={t(K.kpi.cost)}
          active={s.tab === 'cost'}
          onClick={() => s.setTab('cost')}
          value={formatINRCompact(d.costKpi.value ?? 0)}
          trend={d.costKpi}
          deltaText={d.costKpi.delta === null ? t(K.kpi.noCompare) : t(K.kpi.vsBefore, { value: Math.abs(d.costKpi.delta), months: s.months })}
          caption={t(K.kpi.costCaption)}
          t={t}
        />
      </div>

      <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as AnalyticsTab)} items={ANALYTICS_TABS.map((id) => ({ id, label: t(K.tab[id]) }))} className="mb-3" />

      {s.tab === 'ontime' && <OnTimeTab s={s} t={t} lang={lang} />}
      {s.tab === 'transit' && <TransitTab regions={d.transit} t={t} lang={lang} />}
      {s.tab === 'damage' && <DamageTab s={s} t={t} lang={lang} />}
      {s.tab === 'cost' && <CostTab s={s} t={t} lang={lang} />}

      <Disruptions s={s} t={t} lang={lang} report={report} />
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

/* ---------------------------------------------------------------- bars */

interface BarDatum {
  key: string;
  /** Height as a fraction of the tallest, and the text over it. Null draws an honest gap. */
  value: number | null;
  text: string;
  note?: string;
}

function MonthBars({ data, max, months, disrupted, lang, aria, t }: { data: BarDatum[]; max: number; months: string[]; disrupted: Set<string>; lang: string; aria: string; t: T }) {
  return (
    <div className="row gap-1" style={{ alignItems: 'flex-end', height: 148 }} role="img" aria-label={aria}>
      {data.map((b, i) => (
        <div key={b.key} className="stack grow" style={{ alignItems: 'center', justifyContent: 'flex-end', height: '100%', minWidth: 0 }}>
          <span className="t-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {b.value === null ? '—' : b.text}
          </span>
          <div style={{ width: '70%', maxWidth: 40, height: b.value === null ? 2 : `${Math.max(3, (b.value / Math.max(1, max)) * 100)}%`, background: b.value === null ? 'var(--color-border)' : 'var(--color-accent-primary)', borderRadius: '4px 4px 0 0', opacity: disrupted.has(months[i]) ? 0.55 : 1 }} />
          <span className="t-xs t-muted row gap-1" style={{ alignItems: 'center' }}>
            {monthLabel(months[i], lang)}
            {disrupted.has(months[i]) && <CloudLightning size={11} aria-label={t(K.chart.disruption)} color="var(--color-warning)" />}
          </span>
        </div>
      ))}
    </div>
  );
}

const disruptedMonths = (list: DisruptionView[]): Set<string> => {
  const out = new Set<string>();
  for (const w of list) {
    const from = new Date(`${w.startsOn}T00:00:00`);
    const to = new Date(`${w.endsOn}T00:00:00`);
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) out.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
};

/* -------------------------------------------------------------- on time */

function OnTimeTab({ s, t, lang }: { s: DeliveryAnalyticsState; t: T; lang: string }) {
  const d = s.data!;
  const plotted = s.plotted;
  const marks = disruptedMonths(d.disruptions);
  const bars: BarDatum[] = (plotted?.buckets ?? []).map((b) => {
    const total = s.setAside ? b.totalExcl : b.total;
    const on = s.setAside ? b.onTimeExcl : b.onTime;
    return { key: b.key, value: total === 0 ? null : Math.round((on / total) * 100), text: total === 0 ? '—' : `${Math.round((on / total) * 100)}%` };
  });
  const setAsideCount = plotted?.setAside ?? 0;
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.ontime.intro)}</p>
      <Card>
        <div className="stack gap-2">
          <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
            <h2 className="t-md t-semibold">{plotted?.name || t(K.chart.overall)}</h2>
            {s.selected && (
              <Button size="sm" variant="ghost" onClick={() => s.setSelectedId(null)}>
                {t(K.chart.clear)}
              </Button>
            )}
          </div>
          {bars.every((b) => b.value === null) ? (
            <p className="t-sm t-muted">{t(K.chart.noData)}</p>
          ) : (
            <MonthBars data={bars} max={100} months={d.months} disrupted={marks} lang={lang} aria={t(K.chart.aria, { name: plotted?.name || t(K.chart.overall) })} t={t} />
          )}
          {s.setAside && setAsideCount > 0 && <p className="t-xs t-muted">{t(K.chart.setAsideNote, { count: setAsideCount })}</p>}
        </div>
      </Card>

      <Tabs label={t(K.ontime.group.label)} value={s.group} onChange={(id) => s.pickGroup(id as (typeof ON_TIME_GROUPS)[number])} items={ON_TIME_GROUPS.map((g) => ({ id: g, label: t(K.ontime.group[g]) }))} />
      <p className="t-xs t-muted">{t(s.group === 'suppliers' ? K.ontime.suppliersHint : K.ontime.carriersHint)}</p>
      {s.rows.length === 0 ? (
        <EmptyState icon={<Truck size={28} />} title={t(K.ontime.emptyTitle)} body={t(K.ontime.emptyBody)} />
      ) : (
        <Card className="ds-card--flush">
          {s.rows.map((r) => (
            <OnTimeRow key={r.id} r={r} selected={s.selectedId === r.id} setAside={s.setAside} onPick={() => s.setSelectedId(s.selectedId === r.id ? null : r.id)} t={t} />
          ))}
        </Card>
      )}
    </div>
  );
}

function OnTimeRow({ r, selected, setAside, onPick, t }: { r: OnTimeRowView; selected: boolean; setAside: boolean; onPick: () => void; t: T }) {
  const now = setAside ? r.onTimePctExcl : r.onTimePct;
  const before = setAside ? r.previousPctExcl : r.previousPct;
  const trend = trendOf(now, before, 'higher', 1);
  return (
    <button type="button" className="ds-listrow" aria-pressed={selected} style={{ width: '100%', textAlign: 'start', background: selected ? 'var(--color-surface-alt, transparent)' : undefined }} onClick={onPick}>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <strong className="t-sm">{r.name}</strong>
        <span className="t-xs t-muted">
          {t(K.ontime.deliveries, { count: r.deliveries })}
          {r.setAside > 0 && setAside ? ` · ${t(K.ontime.setAsideCount, { count: r.setAside })}` : ''}
        </span>
        {!r.rated && <Badge tone="neutral">{t(K.ontime.early)}</Badge>}
      </span>
      <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{now === null ? '—' : `${now}%`}</strong>
        <span className={`t-xs row gap-1 ${TONE_CLASS[trend.tone]}`} style={{ alignItems: 'center' }}>
          {DIRECTION_ICON[trend.direction]}
          {trend.delta === null ? '' : `${Math.abs(Math.round(trend.delta))}`}
        </span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------- transit */

function TransitTab({ regions, t, lang }: { regions: TransitRegionView[]; t: T; lang: string }) {
  if (regions.length === 0) return <EmptyState icon={<Truck size={28} />} title={t(K.transit.emptyTitle)} body={t(K.transit.emptyBody)} />;
  const established = regions.filter((r) => !r.summary.emerging);
  const emerging = regions.filter((r) => r.summary.emerging);
  const max = Math.max(1, ...regions.map((r) => r.summary.avgHours ?? 0));
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.transit.intro)}</p>
      <Card>
        <p className="t-sm">{t(K.transit.forQuotes)}</p>
      </Card>
      {established.length > 0 && (
        <section className="stack gap-2" aria-labelledby="est-h">
          <h2 id="est-h" className="t-md t-semibold">
            {t(K.transit.established)}
          </h2>
          <div className="grid-auto">
            {established.map((r) => (
              <RegionCard key={r.city} r={r} max={max} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}
      {emerging.length > 0 && (
        <section className="stack gap-2" aria-labelledby="em-h">
          <div className="stack">
            <h2 id="em-h" className="t-md t-semibold">
              {t(K.transit.emerging)}
            </h2>
            <p className="t-xs t-muted">{t(K.transit.emergingBody)}</p>
          </div>
          <div className="grid-auto">
            {emerging.map((r) => (
              <RegionCard key={r.city} r={r} max={max} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}
      <p className="t-xs t-muted">{t(K.transit.note)}</p>
    </div>
  );
}

function RegionCard({ r, max, t, lang }: { r: TransitRegionView; max: number; t: T; lang: string }) {
  const sm = r.summary;
  const trend = trendOf(sm.avgHours, r.previousAvgHours, 'lower', 0.5);
  return (
    <Card>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
          <strong className="t-md">{r.city}</strong>
          {sm.emerging ? <Badge tone="warning">{t(K.transit.emergingRow, { count: sm.trips })}</Badge> : <Badge tone="emerald">{t(K.transit.trips, { count: sm.trips })}</Badge>}
        </div>
        {sm.emerging ? (
          <p className="t-sm t-muted">{t(K.transit.emergingTitle, { hours: sm.avgHours ?? 0 })}</p>
        ) : (
          <>
            <div className="stack gap-1">
              <span className="row between t-sm">
                <span className="t-muted">{t(K.transit.average)}</span>
                <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{hoursText(t, sm.avgHours)}</strong>
              </span>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--color-border)' }} aria-hidden="true">
                <div style={{ width: `${((sm.avgHours ?? 0) / max) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--color-accent-secondary)' }} />
              </div>
              <span className="row between t-sm">
                <span className="t-muted">{t(K.transit.typical)}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{hoursText(t, sm.medianHours)}</span>
              </span>
            </div>
            <div className="stack">
              <Badge tone="accent">{t(K.transit.promise, { count: sm.suggestedDays ?? 1 })}</Badge>
            </div>
            {trend.delta !== null && (
              <span className={`t-xs row gap-1 ${TONE_CLASS[trend.tone]}`} style={{ alignItems: 'center' }}>
                {DIRECTION_ICON[trend.direction]} {t(K.transit.versusBefore, { value: Math.abs(Math.round(trend.delta * 10) / 10) })}
              </span>
            )}
          </>
        )}
        {r.lastArrivedAt && <span className="t-xs t-muted">{t(K.transit.lastArrived, { date: formatDate(r.lastArrivedAt, lang) })}</span>}
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- damage */

function IncidentRow({ r, showRate, t, onOpen }: { r: IncidentRowView; showRate: boolean; t: T; onOpen?: () => void }) {
  const tone: BadgeTone = r.rising ? 'error' : r.emerging ? 'neutral' : 'success';
  return (
    <div className="row between gap-2" style={{ padding: 'var(--space-2) var(--space-3)', borderTop: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
      <span className="stack" style={{ minWidth: 0 }}>
        <strong className="t-sm">{r.name}</strong>
        <span className="t-xs t-muted">
          {t(K.damage.incidents, { count: r.incidents })}
          {r.supplierFault > 0 ? ` · ${t(K.damage.supplierFault, { count: r.supplierFault })}` : ''}
          {showRate && r.per100 !== null ? ` · ${t(K.damage.rate, { value: r.per100 })}` : ''}
        </span>
        {r.rising && <span className="t-xs t-error">{t(K.damage.risingBody, { recent: r.recent, prior: r.prior })}</span>}
        {onOpen && r.rising && (
          <button type="button" className="t-xs" style={{ textAlign: 'start', color: 'var(--color-accent-primary)', background: 'none', border: 0, padding: 0 }} onClick={onOpen}>
            {t(K.damage.seeReports)}
          </button>
        )}
      </span>
      <Badge tone={tone}>
        {r.rising && <TrendUp size={12} aria-hidden="true" />} {t(r.rising ? K.damage.rising : r.emerging ? K.damage.tooFew : K.damage.steady)}
      </Badge>
    </div>
  );
}

function DamageTab({ s, t, lang }: { s: DeliveryAnalyticsState; t: T; lang: string }) {
  const navigate = useNavigate();
  const d = s.data!;
  const marks = disruptedMonths(d.disruptions);
  const max = Math.max(1, ...d.incidentMonths.map((m) => m.incidents));
  const bars: BarDatum[] = d.incidentMonths.map((m) => ({ key: m.key, value: m.incidents, text: String(m.incidents) }));
  const nothing = d.incidentMonths.every((m) => m.incidents === 0) && d.incidentSuppliers.length === 0;
  if (nothing) return <EmptyState icon={<CheckCircle size={28} />} title={t(K.damage.emptyTitle)} body={t(K.damage.emptyBody)} />;
  const risingSuppliers = d.incidentSuppliers.filter((r) => r.rising);
  const risingCategories = d.incidentCategories.filter((r) => r.rising);
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.damage.intro)}</p>
      {(risingSuppliers.length > 0 || risingCategories.length > 0) && (
        <Card>
          <div className="stack gap-1" role="note">
            <strong className="t-sm row gap-1" style={{ alignItems: 'center' }}>
              <Warning size={16} aria-hidden="true" /> {t(K.damage.rising)}
            </strong>
            {risingSuppliers.length > 0 && <span className="t-sm">{t(K.damage.actionSupplier, { names: risingSuppliers.map((r) => r.name).join(', ') })}</span>}
            {risingCategories.length > 0 && <span className="t-sm">{t(K.damage.actionCategory, { names: risingCategories.map((r) => t(`partCategory.${r.name}`, { defaultValue: r.name })).join(', ') })}</span>}
          </div>
        </Card>
      )}
      <Card>
        <div className="stack gap-2">
          <h2 className="t-md t-semibold">{t(K.damage.monthsHeading)}</h2>
          <MonthBars data={bars} max={max} months={d.months} disrupted={marks} lang={lang} aria={t(K.damage.monthsHeading)} t={t} />
        </div>
      </Card>
      <div className="grid-auto">
        <Card className="ds-card--flush">
          <h2 className="t-md t-semibold" style={{ padding: 'var(--space-3)' }}>
            {t(K.damage.suppliersHeading)}
          </h2>
          {d.incidentSuppliers.map((r) => (
            <IncidentRow key={r.id} r={r} showRate t={t} onOpen={() => navigate('/damaged-parts')} />
          ))}
        </Card>
        <Card className="ds-card--flush">
          <div className="stack" style={{ padding: 'var(--space-3)' }}>
            <h2 className="t-md t-semibold">{t(K.damage.categoriesHeading)}</h2>
            <p className="t-xs t-muted">{t(K.damage.categoriesHint)}</p>
          </div>
          {d.incidentCategories.map((r) => (
            <IncidentRow key={r.id} r={{ ...r, name: t(`partCategory.${r.name}`, { defaultValue: r.name }) }} showRate={false} t={t} onOpen={() => navigate('/damaged-parts')} />
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- cost */

function CostTab({ s, t, lang }: { s: DeliveryAnalyticsState; t: T; lang: string }) {
  const navigate = useNavigate();
  const c = s.data!.cost;
  if (c.rows.length === 0) return <EmptyState icon={<CheckCircle size={28} />} title={t(K.cost.emptyTitle)} body={t(K.cost.emptyBody)} />;
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.cost.intro)}</p>
      <div className="grid-auto">
        <StatTile label={t(K.cost.total)} value={formatINR(c.total)} large />
        <StatTile label={t(K.cost.parts)} value={formatINR(c.parts)} />
        <StatTile label={t(K.cost.rework)} value={formatINR(c.rework)} />
        <StatTile label={t(K.cost.schedule)} value={formatINR(c.schedule)} />
      </div>
      {c.exposure > 0 && (
        <Card>
          <div className="stack gap-1" role="note">
            <strong className="t-sm">{t(K.cost.exposure, { amount: formatINR(c.exposure) })}</strong>
            <span className="t-xs t-muted">{t(K.cost.exposureBody)}</span>
          </div>
        </Card>
      )}
      {c.retentionHeld > 0 && (
        <Card>
          <div className="stack gap-1" role="note">
            <strong className="t-sm">{t(K.cost.retention, { amount: formatINR(c.retentionHeld) })}</strong>
            <span className="t-xs t-muted">{t(K.cost.retentionBody)}</span>
          </div>
        </Card>
      )}
      <Card className="ds-card--flush">
        <div className="stack" style={{ padding: 'var(--space-3)' }}>
          <h2 className="t-md t-semibold">{t(K.cost.incidentsHeading)}</h2>
          <p className="t-xs t-muted">{t(K.cost.incidentsHint)}</p>
        </div>
        {c.rows.map((r) => (
          <button key={r.reportId} type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={() => navigate(`/damaged-parts?report=${r.reportId}`)}>
            <span className="stack grow" style={{ minWidth: 0 }}>
              <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                <strong className="t-sm">{r.code}</strong>
                <Badge tone={r.status === 'open' ? 'warning' : 'neutral'}>{t(r.status === 'open' ? K.cost.open : K.cost.resolved)}</Badge>
                {r.attribution ? <Badge tone={r.attribution === 'supplier' ? 'accent' : 'neutral'}>{t(K.attribution[r.attribution])}</Badge> : <Badge tone="warning">{t(K.cost.unjudged)}</Badge>}
              </span>
              <span className="t-xs t-muted">
                {r.supplierName}
                {r.category ? ` · ${t(`partCategory.${r.category}`, { defaultValue: r.category })}` : ''} · {formatDate(r.at, lang)}
              </span>
              <span className="t-xs t-muted">{r.total === 0 ? t(K.cost.noCost) : [r.parts ? `${t(K.cost.parts)} ${formatINR(r.parts)}` : '', r.rework ? `${t(K.cost.rework)} ${formatINR(r.rework)}` : '', r.schedule ? `${t(K.cost.schedule)} ${formatINR(r.schedule)}` : ''].filter(Boolean).join(' · ')}</span>
            </span>
            <strong style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatINR(r.total)}</strong>
          </button>
        ))}
      </Card>
      <details>
        <summary className="t-sm t-semibold">{t(K.cost.howHeading)}</summary>
        <ul className="stack gap-1 t-xs t-muted mt-2">
          <li>{t(K.cost.howParts)}</li>
          <li>{t(K.cost.howRework, { amount: formatINR(c.rates.revisit) })}</li>
          <li>{t(K.cost.howSchedule, { amount: formatINR(c.rates.schedulePerDay) })}</li>
          <li>{t(K.cost.howOnce)}</li>
        </ul>
      </details>
    </div>
  );
}

/* ---------------------------------------------------------- disruptions */

function Disruptions({ s, t, lang, report }: { s: DeliveryAnalyticsState; t: T; lang: string; report: Report }) {
  const list = s.data!.disruptions;
  return (
    <section className="stack gap-2 mt-4" aria-labelledby="dis-h">
      <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
        <div className="stack">
          <h2 id="dis-h" className="t-md t-semibold">
            {t(K.disruption.heading)}
          </h2>
          <p className="t-xs t-muted">{t(K.disruption.hint)}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={s.openSheet}>
          <Plus size={14} aria-hidden="true" /> {t(K.disruption.add)}
        </Button>
      </div>
      {list.length === 0 ? (
        <p className="t-sm t-muted">{t(K.disruption.none)}</p>
      ) : (
        <div className="grid-auto">
          {list.map((w) => (
            <Card key={w.id}>
              <div className="stack gap-1">
                <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
                  <strong className="t-sm row gap-1" style={{ alignItems: 'center' }}>
                    <CloudLightning size={16} aria-hidden="true" color="var(--color-warning)" /> {w.label}
                  </strong>
                  {w.source === 'admin' ? (
                    <Button size="sm" variant="ghost" aria-label={`${t(K.disruption.remove)}: ${w.label}`} onClick={async () => report(await s.removeDisruption(w.id), K.disruption.removed)}>
                      <Trash size={14} aria-hidden="true" />
                    </Button>
                  ) : (
                    <Badge tone="neutral">{t(K.disruption.fromAlerts)}</Badge>
                  )}
                </div>
                <span className="t-xs t-muted">{t(K.disruption.range, { from: formatDate(w.startsOn, lang), to: formatDate(w.endsOn, lang) })}</span>
                {w.note && <span className="t-xs">{w.note}</span>}
                <span className="t-xs t-muted">{t(K.disruption.affected, { count: w.deliveriesAffected })}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Sheet open={s.sheetOpen} onClose={() => s.setSheetOpen(false)} title={t(K.disruption.title)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.disruption.intro)}</p>
          <Field label={t(K.disruption.label)} hint={t(K.disruption.labelHint)} required>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={s.draft.label} onChange={(e) => s.patchDraft({ label: e.target.value })} />}
          </Field>
          <div className="grid-2">
            <Field label={t(K.disruption.startsOn)} required>
              {({ id }) => <Input id={id} type="date" value={s.draft.startsOn} onChange={(e) => s.patchDraft({ startsOn: e.target.value })} />}
            </Field>
            <Field label={t(K.disruption.endsOn)} required>
              {({ id }) => <Input id={id} type="date" value={s.draft.endsOn} onChange={(e) => s.patchDraft({ endsOn: e.target.value })} />}
            </Field>
          </div>
          <Field label={t(K.disruption.note)}>{({ id }) => <TextArea id={id} rows={2} value={s.draft.note} onChange={(e) => s.patchDraft({ note: e.target.value })} />}</Field>
          <Button disabled={!s.canSave || s.busy} onClick={async () => report(await s.saveDisruption(), K.disruption.saved)}>
            {t(K.disruption.save)}
          </Button>
        </div>
      </Sheet>
    </section>
  );
}
