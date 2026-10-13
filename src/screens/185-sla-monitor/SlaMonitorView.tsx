import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowRight, ArrowUp, ArrowsClockwise, Clock } from '@phosphor-icons/react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, formatDate } from '@/design-system';
import type { SlaCategoryView, SlaItemView, SlaOverviewView } from '@/data/repository';
import { SLA_CATEGORIES } from '@/features/sla/consolidated';
import { PULL_DISTANCE, SLA_MONITOR_KEYS as K } from './sla-monitor.types';
import { useSlaMonitor } from './useSlaMonitor';
import type { SlaMonitorState } from './useSlaMonitor';

type T = ReturnType<typeof useTranslation>['t'];
const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { on_track: 'success', at_risk: 'warning', breached: 'error', met: 'success', missed: 'warning' };
const consequenceOf = (id: string): number => SLA_CATEGORIES.find((c) => c.id === id)?.consequence ?? 1;

/** A duration in the largest unit that reads naturally. */
function dur(t: T, ms: number): string {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m >= 2880) return t(K.dur.d, { value: Math.round(m / 1440) });
  if (m >= 120) return t(K.dur.h, { value: Math.round(m / 60) });
  return t(K.dur.min, { value: m });
}

/** Screen 185 — SLA Timer & Breach Alert. Dashboard layout: the figure that matters most first, two-up KPI cards on a phone, the breaches to start with ranked by consequence, then a card per process with its status, trend and whether its target still fits. */
export function SlaMonitorScreen() {
  const { t } = useTranslation();
  const s = useSlaMonitor();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const v = s.view;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />;
  if (s.load === 'loading' && !v) return <Screen width="wide">{head}<LoadingState label={t(K.loading)} variant="stats" rows={4} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' && !v) return <Screen width="wide">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-sla-monitor>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        {head}
        <div className="stack gap-4">
          {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
          <Kpis v={v} t={t} />
          <Triage v={v} t={t} />
          <Categories v={v} s={s} t={t} />
          <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
        </div>
        <Detail v={v} s={s} t={t} />
      </Screen>
    </div>
  );
}

function Kpis({ v, t }: { v: SlaOverviewView; t: T }) {
  const closed = v.categories.reduce((n, c) => n + c.rollup.closed, 0);
  const met = v.categories.reduce((n, c) => n + c.rollup.met, 0);
  const enough = v.categories.some((c) => c.rollup.complianceRate !== null);
  const cards: { id: string; label: string; value: string; sub?: string; tone?: 'warning' | 'error' }[] = [
    { id: 'breached', label: t(K.kpi.breached), value: String(v.totals.breached), tone: v.totals.breached > 0 ? 'warning' : undefined },
    { id: 'atRisk', label: t(K.kpi.atRisk), value: String(v.totals.atRisk) },
    { id: 'processes', label: t(K.kpi.processes), value: String(v.totals.categoriesBreaching) },
    { id: 'compliance', label: t(K.kpi.compliance), value: enough ? t(K.kpi.complianceValue, { met, closed }) : '—', sub: enough ? t(K.kpi.window, { days: v.windowDays }) : t(K.kpi.notEnough) },
  ];
  return (
    <div className="grid-2" data-kpis style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      {cards.map((c) => (
        <Card key={c.id}>
          <div className="stack gap-1" data-kpi={c.id}>
            <span className="t-xs t-muted">{c.label}</span>
            <span className="t-xl t-semibold" style={{ fontFamily: 'var(--font-mono)', color: c.tone ? `var(--color-${c.tone})` : undefined }}>{c.value}</span>
            {c.sub && <span className="t-xs t-muted">{c.sub}</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-2">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}

function PauseNote({ item, t }: { item: SlaItemView; t: T }) {
  return item.pause ? <span className="t-xs t-muted row gap-1" style={{ alignItems: 'center' }} data-pause={item.pause}><Clock size={12} aria-hidden="true" />{t(`slaMonitor.pause.${item.pause}`)}</span> : null;
}

function ItemRow({ item, t, lang, showWhy }: { item: SlaItemView; t: T; lang: string; showWhy?: boolean }) {
  const nav = useNavigate();
  return (
    <div className="stack gap-1" data-item={item.id} data-status={item.status}>
      <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
        <span className="stack gap-0"><span className="t-xs t-muted">{t(`slaMonitor.cat.${item.category}.name`)}</span><span className="t-sm t-semibold">{item.label}</span></span>
        <Badge tone={STATUS_TONE[item.status]}>{t(`slaMonitor.status.${item.status}`)}</Badge>
      </div>
      <ProgressBar value={Math.min(1, item.ratio)} tone={item.status === 'breached' ? 'warning' : item.status === 'at_risk' ? 'warning' : 'accent'} label={t(K.detail.elapsed, { elapsed: dur(t, item.elapsedMs), target: dur(t, item.targetMs) })} />
      <span className="t-xs">{t(K.detail.elapsed, { elapsed: dur(t, item.elapsedMs), target: dur(t, item.targetMs) })} · {t(K.detail.since, { date: formatDate(item.startedAt, lang) })}</span>
      <PauseNote item={item} t={t} />
      {showWhy && <span className="t-xs t-muted">{t(K.triage.why, { weight: consequenceOf(item.category), ratio: item.ratio })}</span>}
      <div><Button size="sm" variant="secondary" data-act={`open-${item.id}`} onClick={() => nav(item.route)}>{t(K.triage.open)} <ArrowRight size={14} /></Button></div>
    </div>
  );
}

function Triage({ v, t }: { v: SlaOverviewView; t: T }) {
  const { i18n } = useTranslation();
  return (
    <Section title={t(K.triage.title)} hint={t(K.triage.hint)}>
      {v.triage.length === 0 ? <EmptyState title={t(K.triage.none)} body={t(K.triage.noneBody)} /> : (
        <div className="grid-auto" data-triage>
          {v.triage.map((i, n) => <Card key={i.id}><div data-triage-rank={n + 1}><ItemRow item={i} t={t} lang={i18n.language} showWhy /></div></Card>)}
        </div>
      )}
    </Section>
  );
}

const ARROW = { improving: ArrowUp, declining: ArrowDown, steady: ArrowRight, too_little: ArrowRight } as const;

function Spark({ c }: { c: SlaCategoryView }) {
  return (
    <div className="row" aria-hidden="true" style={{ alignItems: 'flex-end', gap: 3, height: 28 }}>
      {c.trend.points.map((p) => <span key={p.weekStart} style={{ width: 8, height: p.rate === null ? 3 : Math.max(3, Math.round((p.rate / 100) * 28)), borderRadius: 2, background: p.rate === null ? 'var(--color-border)' : 'var(--color-accent-secondary)' }} />)}
    </div>
  );
}

function Categories({ v, s, t }: { v: SlaOverviewView; s: SlaMonitorState; t: T }) {
  return (
    <Section title={t(K.cat.title)}>
      <div className="grid-auto" data-categories>
        {v.categories.map((c) => {
          const Arrow = ARROW[c.trend.direction];
          return (
            <Card key={c.category}>
              <button type="button" className="stack gap-2" data-category={c.category} onClick={() => s.openCategory(c.category)} style={{ background: 'none', border: 0, padding: 0, textAlign: 'start', cursor: 'pointer', color: 'inherit', width: '100%' }}>
                <span className="row between" style={{ alignItems: 'center', gap: 8 }}>
                  <span className="t-sm t-semibold">{t(`slaMonitor.cat.${c.category}.name`)}</span>
                  {c.rollup.breached > 0 ? <Badge tone="error">{t(K.card.breached)} {c.rollup.breached}</Badge> : c.rollup.atRisk > 0 ? <Badge tone="warning">{t(K.card.atRisk)} {c.rollup.atRisk}</Badge> : <Badge tone="success">{t(K.card.onTrack)}</Badge>}
                </span>
                <span className="t-xs t-muted">{t(`slaMonitor.cat.${c.category}.what`)}</span>
                <span className="t-xs">{c.targetMs ? t(K.card.target, { target: dur(t, c.targetMs) }) : t(K.card.targetNone)} · {t(K.card.running)} {c.rollup.open}</span>
                <span className="t-xs" data-rate>{c.rollup.complianceRate !== null ? t(K.card.rate, { rate: c.rollup.complianceRate, met: c.rollup.met, closed: c.rollup.closed }) : t(K.card.rateNone, { closed: c.rollup.closed })}</span>
                <span className="row gap-2" style={{ alignItems: 'center' }}><Spark c={c} /><span className="t-xs row gap-1" style={{ alignItems: 'center' }} data-trend={c.trend.direction}><Arrow size={12} aria-hidden="true" />{t(`slaMonitor.trend.${c.trend.direction}`)}</span></span>
                {(c.target.signal === 'tight' || c.target.signal === 'loose') && <span className="t-xs" data-target-signal={c.target.signal} style={{ color: 'var(--color-warning)' }}>{t(`slaMonitor.target.${c.target.signal}`)}</span>}
                <span className="t-xs t-muted">{t(K.card.details)}</span>
              </button>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function Detail({ v, s, t }: { v: SlaOverviewView; s: SlaMonitorState; t: T }) {
  const { i18n } = useTranslation();
  const nav = useNavigate();
  const c = v.categories.find((x) => x.category === s.category);
  if (!c) return <Sheet open={false} onClose={() => s.openCategory(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const items = v.open.filter((i) => i.category === c.category);
  return (
    <Sheet open onClose={() => s.openCategory(null)} title={t(`slaMonitor.cat.${c.category}.name`)} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-detail={c.category}>
        <p className="t-xs">{t(`slaMonitor.cat.${c.category}.what`)}</p>
        <div className="stack gap-1" data-fair>
          <span className="t-sm t-semibold">{t(K.detail.fair)}</span>
          <p className="t-xs">{c.measure === 'business' ? t(K.detail.fairBusiness) : t(K.detail.fairCalendar)}</p>
          <p className="t-xs t-muted">{c.ownAlert ? t(K.detail.alertOwn) : t(K.detail.alertSla)}</p>
        </div>
        <div className="stack gap-2" data-target-note>
          <p className="t-xs" style={c.target.signal === 'tight' || c.target.signal === 'loose' ? { color: 'var(--color-warning)' } : undefined}>{t(`slaMonitor.target.${c.target.signal}`)}</p>
          {c.target.medianRatio !== null && <p className="t-xs t-muted">{t(K.target.median, { pct: Math.round(c.target.medianRatio * 100), sample: c.target.sample })}</p>}
          <div><Button size="sm" variant="ghost" data-act="open-process" onClick={() => nav(c.route)}>{t(K.target.open)} <ArrowRight size={14} /></Button></div>
        </div>
        <section className="stack gap-2" data-running>
          <h3 className="t-sm t-semibold">{t(K.detail.running)}</h3>
          {items.length === 0 ? <p className="t-xs t-muted">{t(K.detail.none)}</p> : items.map((i) => <Card key={i.id}><ItemRow item={i} t={t} lang={i18n.language} /></Card>)}
        </section>
        <section className="stack gap-1" data-weeks>
          <h3 className="t-sm t-semibold">{t(K.detail.weeks)} · <span data-trend={c.trend.direction}>{t(`slaMonitor.trend.${c.trend.direction}`)}</span></h3>
          {[...c.trend.points].reverse().map((p) => <p key={p.weekStart} className="t-xs row between"><span>{t(K.detail.weekLine, { date: formatDate(p.weekStart, i18n.language) })}</span><span style={{ fontFamily: 'var(--font-mono)' }}>{p.rate === null ? (p.closed > 0 ? `0% · 0/${p.closed}` : t(K.detail.weekNone)) : `${p.rate}% · ${p.met}/${p.closed}`}</span></p>)}
        </section>
      </div>
    </Sheet>
  );
}
