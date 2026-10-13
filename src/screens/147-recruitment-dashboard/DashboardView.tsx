import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CaretRight, MapTrifold, Users, Warning } from '@phosphor-icons/react';
import { Badge, Button, Card, EmptyState, ErrorState, Field, LoadingState, MapCanvas, ProgressBar, Screen, ScreenHeader, Sheet, StatTile, Tabs, TextArea, formatDate } from '@/design-system';
import type { MapZone } from '@/design-system';
import type { DashboardPerson, RecruitmentDashboardView } from '@/data/repository';
import { FUNNEL, NOW_STAGES, PERIODS } from '@/features/recruitment/dashboard';
import type { NowStage, Period, RecruitStage } from '@/features/recruitment/dashboard';
import { DASHBOARD_KEYS as K, PULL_DISTANCE, SIGNAL_TONE, WAITLIST_MIN, periodKey } from './dashboard.types';
import { useDashboard } from './useDashboard';
import type { DashboardState, Drill } from './useDashboard';

type T = ReturnType<typeof useTranslation>['t'];
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const roleKey = (r: string) => (r === 'undecided' ? 'recruit.roles.name.undecided' : `application.admin.role.${r}`);
const NOW_ROUTE: Record<NowStage, string> = { interested: '', form: '/applications', screening: '/screening', interviewing: '/interviews', verifying: '/verification', offer: '/offers', waitlisted: '/offers?stage=waiting', activated: '/offers?stage=signed' };
const REACH_ROUTE: Record<RecruitStage, string> = { interested: '', applied: '/applications', forward: '/screening?tab=decided', verified: '/verification?status=clear', offered: '/offers?stage=sent', activated: '/offers?stage=signed' };

/**
 * Screen 147 — New Partner Aggregation Dashboard. The recruitment pipeline on one page for the one person watching it: how many are at each
 * stage, how long it takes, where people fall away, and which areas most need new capacity.
 */
export function DashboardScreen() {
  const { t } = useTranslation();
  const s = useDashboard();
  const v = s.view;
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);

  if (s.status === 'loading' && !v) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={6} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.status === 'error' || !v) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;

  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-dashboard>
      <Screen width="wide">
        {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <Tabs label={t(K.period.label)} value={periodKey(s.period)} onChange={(id) => s.setPeriod((PERIODS.find((p) => periodKey(p) === id) ?? 30) as Period)} items={PERIODS.map((p) => ({ id: periodKey(p), label: t(K.period[periodKey(p) as 'd30' | 'd90' | 'all']) }))} />
        <div className="stack gap-4 mt-3">
          <Kpis s={s} v={v} t={t} />
          <div className="grid-auto" style={{ '--min': '340px', alignItems: 'start' } as React.CSSProperties}>
            <Funnel s={s} v={v} t={t} />
            <NowCard s={s} v={v} t={t} />
          </div>
          <Territories s={s} v={v} t={t} />
          <div className="grid-auto" style={{ '--min': '340px', alignItems: 'start' } as React.CSSProperties}>
            <Waitlist s={s} v={v} t={t} />
            <Channels v={v} t={t} />
          </div>
        </div>
        <DrillSheet s={s} v={v} t={t} />
      </Screen>
    </div>
  );
}

/* ------------------------------------------------------------------ the figures */

function Trend({ pct }: { pct: number | null }) {
  return pct === null ? undefined : { value: `${pct >= 0 ? '+' : ''}${pct}%`, direction: (pct >= 0 ? 'up' : 'down') as 'up' | 'down', tone: pct >= 0 ? ('success' as const) : ('neutral' as const) };
}

function Kpis({ s, v, t }: { s: DashboardState; v: RecruitmentDashboardView; t: T }) {
  const k = v.kpis;
  const cards: { id: string; label: string; value: React.ReactNode; large?: boolean; delta?: ReturnType<typeof Trend>; caption?: string; onClick: () => void }[] = [
    { id: 'tta', label: t(K.kpi.tta), value: k.timeToActivate.median === null ? <span className="t-md t-muted">{t(K.kpi.notEnough)}</span> : <span className="num">{t(K.kpi.ttaUnit, { count: k.timeToActivate.median })}</span>, large: true, caption: k.timeToActivate.median === null ? undefined : `${t(K.kpi.ttaCaption, { count: k.timeToActivate.n })}${k.timeToFull.median !== null ? ` · ${t(K.kpi.ttaFull, { count: k.timeToFull.median })}` : ''}`, onClick: () => s.setDrill({ kind: 'reach', stage: 'activated' }) },
    { id: 'waiting', label: t(K.kpi.waiting), value: <span className="num">{k.waitingOnAdmin}</span>, large: true, caption: k.overdueScreening > 0 ? t(K.kpi.waitingCaption, { count: k.overdueScreening }) : undefined, onClick: () => s.goto('/screening') },
    { id: 'interested', label: t(K.kpi.interested), value: <span className="num">{k.interested.value}</span>, delta: Trend({ pct: k.interested.trend }), caption: k.interested.trend === null ? undefined : t(K.kpi.trendCaption), onClick: () => s.setDrill({ kind: 'reach', stage: 'interested' }) },
    { id: 'applied', label: t(K.kpi.applied), value: <span className="num">{k.applied.value}</span>, delta: Trend({ pct: k.applied.trend }), caption: k.applied.trend === null ? undefined : t(K.kpi.trendCaption), onClick: () => s.setDrill({ kind: 'reach', stage: 'applied' }) },
    { id: 'activated', label: t(K.kpi.activated), value: <span className="num">{k.activated.value}</span>, delta: Trend({ pct: k.activated.trend }), caption: k.activated.trend === null ? undefined : t(K.kpi.trendCaption), onClick: () => s.setDrill({ kind: 'reach', stage: 'activated' }) },
    { id: 'approval', label: t(K.kpi.approval), value: k.approvalRate === null ? <span className="t-md t-muted">{t(K.kpi.notEnough)}</span> : <span className="num">{k.approvalRate}%</span>, caption: k.approvalRate === null ? undefined : t(K.kpi.approvalCaption), onClick: () => s.goto('/screening?tab=decided') },
  ];
  return (
    <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties} data-kpis>
      {cards.map((c, i) => (
        <Card key={c.id} riseIndex={i} onClick={c.onClick}>
          <div data-kpi={c.id}><StatTile label={c.label} value={c.value} large={c.large} delta={c.delta} caption={c.caption} /></div>
        </Card>
      ))}
    </div>
  );
}

function Funnel({ s, v, t }: { s: DashboardState; v: RecruitmentDashboardView; t: T }) {
  const top = Math.max(1, v.funnel[0]?.reached ?? 1);
  if ((v.funnel[0]?.reached ?? 0) === 0) return <Card><EmptyState icon={<Users size={28} />} title={t(K.funnel.heading)} body={t(K.funnel.empty)} /></Card>;
  return (
    <Card>
      <div className="stack gap-3" data-funnel>
        <div className="stack"><h2 className="t-md t-semibold">{t(K.funnel.heading)}</h2><p className="t-xs t-muted">{t(K.funnel.hint)}</p></div>
        {v.funnel.map((r) => (
          <button key={r.stage} type="button" className="stack gap-1" data-stage={r.stage} data-flagged={r.flagged ? 1 : 0} style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit', minHeight: 48 }} onClick={() => s.setDrill({ kind: 'reach', stage: r.stage })}>
            <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="t-sm t-medium">{t(K.funnel.stage[r.stage])}</span>
              <span className="row gap-2" style={{ alignItems: 'baseline' }}><strong className="num t-md">{r.reached}</strong><CaretRight size={12} aria-hidden="true" /></span>
            </span>
            <ProgressBar value={r.reached / top} tone={r.flagged ? 'warning' : 'accent'} label={`${t(K.funnel.stage[r.stage])} ${r.reached}`} />
            <span className="row gap-2 wrap t-xs t-muted">
              {r.conversion !== null && !r.smallSample && <span>{t(K.funnel.carried, { pct: Math.round(r.conversion * 100) })}</span>}
              {r.conversion !== null && r.smallSample && <span>{t(K.funnel.smallSample)}</span>}
              {r.avgDays !== null && r.stage !== 'interested' && <span>{t(K.funnel.avgDays, { count: r.avgDays })}</span>}
              {r.flagged && <Badge tone="warning">{t(K.funnel.flagged)}</Badge>}
            </span>
          </button>
        ))}
        {v.flaggedDetail && <p className="t-sm" role="note" data-flagged-detail><Warning size={16} aria-hidden="true" color="var(--color-warning)" /> {t(K.funnel.flaggedBody, { kept: v.flaggedDetail.kept, from: v.flaggedDetail.from, stage: t(K.funnel.stage[v.flaggedDetail.stage]) })}</p>}
        <p className="t-xs t-muted">{t(K.funnel.exits, { rejected: v.exits.rejected, withdrawn: v.exits.withdrawn })}</p>
      </div>
    </Card>
  );
}

function NowCard({ s, v, t }: { s: DashboardState; v: RecruitmentDashboardView; t: T }) {
  return (
    <Card>
      <div className="stack gap-3" data-now>
        <div className="stack"><h2 className="t-md t-semibold">{t(K.now.heading)}</h2><p className="t-xs t-muted">{t(K.now.hint)}</p></div>
        <div className="grid-auto" style={{ '--min': '130px' } as React.CSSProperties}>
          {NOW_STAGES.map((st) => (
            <button key={st} type="button" data-now-stage={st} className="stack gap-1" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: 'var(--space-3)', textAlign: 'left', cursor: 'pointer', color: 'inherit', minHeight: 72 }} onClick={() => s.setDrill({ kind: 'now', stage: st })}>
              <strong className="num t-lg">{v.now[st]}</strong>
              <span className="t-xs t-muted">{t(K.now.stage[st])}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ where people are needed */

function Territories({ s, v, t }: { s: DashboardState; v: RecruitmentDashboardView; t: T }) {
  const zones: MapZone[] = v.territories.map((z) => ({ id: z.zoneId, points: z.points, tone: SIGNAL_TONE[z.signal], label: z.name }));
  return (
    <Card>
      <div className="stack gap-3" data-territory>
        <div className="stack"><h2 className="t-md t-semibold"><MapTrifold size={18} aria-hidden="true" /> {t(K.territory.heading)}</h2><p className="t-sm">{t(K.territory.body)}</p><p className="t-xs t-muted">{t(K.territory.placeholder)}</p></div>
        {v.territories.length === 0 ? <EmptyState icon={<MapTrifold size={28} />} title={t(K.territory.heading)} body={t(K.territory.empty)} /> : (
          <>
            <MapCanvas label={t(K.territory.mapLabel)} zones={zones} height={240} />
            <div className="grid-auto" style={{ '--min': '260px' } as React.CSSProperties}>
              {[...v.territories].sort((a, b) => (a.signal === 'urgent_low_interest' ? 0 : 1) - (b.signal === 'urgent_low_interest' ? 0 : 1) || b.need - a.need).map((z) => {
                const push = z.signal === 'urgent_low_interest';
                return (
                  <div key={z.zoneId} className="stack gap-2" data-zone={z.zoneId} data-signal={z.signal} style={{ border: `${push ? 2 : 1}px solid ${push ? 'var(--color-warning)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-card)', padding: 'var(--space-3)' }}>
                    <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><strong className="t-sm">{z.name}</strong><Badge tone={push ? 'warning' : z.signal === 'full' ? 'success' : z.signal === 'urgent' ? 'accent' : 'neutral'} dot>{t(K.territory.signal[z.signal])}</Badge></div>
                    <ProgressBar value={z.need / 100} tone={z.need >= 75 ? 'warning' : 'accent'} label={`${z.name} ${z.need}`} />
                    <span className="t-xs t-muted">{t(K.territory.need, { need: z.need })} · {t(K.territory.leads, { leads: z.leads, people: z.people })}</span>
                    <span className="t-xs t-muted">{t(K.territory.pipeline, { count: z.pipeline })} · {z.room > 0 ? t(K.territory.room, { count: z.room }) : t(K.territory.noRoom)}</span>
                    {push && <p className="t-sm" data-push>{t(K.territory.push)}</p>}
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" style={{ width: 'fit-content' }} data-open-territories onClick={() => s.goto('/admin/territories')}>{t(K.territory.open)}</Button>
          </>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ waitlist and channels */

function Waitlist({ s, v, t }: { s: DashboardState; v: RecruitmentDashboardView; t: T }) {
  const { i18n } = useTranslation();
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <Card>
      <div className="stack gap-3" data-waitlist>
        <div className="stack"><h2 className="t-md t-semibold">{t(K.waitlist.heading)}</h2><p className="t-sm">{t(K.waitlist.body)}</p></div>
        {v.suggestWaitlist.length > 0 && (
          <div className="stack gap-2" data-suggest>
            <strong className="t-sm">{t(K.waitlist.suggestHeading)}</strong>
            <p className="t-xs t-muted">{t(K.waitlist.suggestBody)}</p>
            {v.suggestWaitlist.map((p) => <div key={p.id} className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm">{p.name} · {p.zones.join(', ')}</span><Button size="sm" variant="secondary" data-waitlist-add={p.id} onClick={() => { setTarget({ id: p.id, name: p.name }); setReason(''); setError(null); }}>{t(K.waitlist.add)}</Button></div>)}
          </div>
        )}
        {v.waitlist.length === 0 ? <p className="t-sm t-muted">{t(K.waitlist.empty)}</p> : v.waitlist.map((w) => (
          <div key={w.id} className="stack gap-1" data-waitlisted={w.id}>
            <strong className="t-sm">{w.name}</strong>
            <span className="t-xs t-muted">{t(K.waitlist.since, { date: formatDate(w.at, i18n.language) })} · {w.zones.join(', ')}</span>
            <span className="t-sm">“{w.reason}”</span>
            <div className="row gap-2"><Button size="sm" variant="secondary" disabled={s.busy} data-release={w.id} onClick={() => void s.release(w.id)}>{t(K.waitlist.release)}</Button><Button size="sm" variant="ghost" onClick={() => s.goto(`/offers/${w.id}`)}>{t(K.waitlist.openOffer)}</Button></div>
          </div>
        ))}
      </div>
      <Sheet open={!!target} onClose={() => setTarget(null)} title={t(K.waitlist.sheetHeading, { name: target?.name ?? '' })} closeLabel={t('action.close')}>
        <div className="stack gap-3" data-form="waitlist">
          <p className="t-sm">{t(K.waitlist.sheetBody)}</p>
          <Field label={t(K.waitlist.reason)} hint={t(K.waitlist.reasonHint, { min: WAITLIST_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
          <div className="row gap-2" style={{ justifyContent: 'flex-end' }}><Button variant="ghost" onClick={() => setTarget(null)}>{t(K.waitlist.back)}</Button><Button disabled={letters(reason) < WAITLIST_MIN || s.busy} data-confirm-waitlist onClick={async () => { const r = await s.waitlist((target as { id: string }).id, reason); if (r.ok) setTarget(null); else setError(r.code ?? 'generic'); }}>{t(K.waitlist.confirm)}</Button></div>
        </div>
      </Sheet>
    </Card>
  );
}

function Channels({ v, t }: { v: RecruitmentDashboardView; t: T }) {
  return (
    <Card>
      <div className="stack gap-2" data-channels>
        <div className="stack"><h2 className="t-md t-semibold">{t(K.channels.heading)}</h2><p className="t-xs t-muted">{t(K.channels.hint)}</p></div>
        {v.channels.length === 0 ? <p className="t-sm t-muted">{t(K.channels.empty)}</p> : v.channels.map((c) => (
          <div key={c.channel} className="stack gap-1" data-channel={c.channel}>
            <span className="row gap-2" style={{ justifyContent: 'space-between' }}><span className="t-sm t-medium">{t(`application.admin.detail.channel.${c.channel}`)}</span><strong className="num t-sm">{c.interested}</strong></span>
            <ProgressBar value={c.interested / Math.max(1, v.channels[0].interested)} label={`${c.channel} ${c.interested}`} />
            <span className="t-xs t-muted">{t(K.channels.row, { applied: c.applied, activated: c.activated })}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ the people behind a number */

function DrillSheet({ s, v, t }: { s: DashboardState; v: RecruitmentDashboardView; t: T }) {
  const { i18n } = useTranslation();
  const d: Drill = s.drill;
  const people: DashboardPerson[] = d ? (d.kind === 'reach' ? v.people.reach[d.stage as RecruitStage] : v.people.now[d.stage as NowStage]) ?? [] : [];
  const title = d ? (d.kind === 'reach' ? t(K.drill.reach, { stage: t(K.funnel.stage[d.stage as RecruitStage]) }) : t(K.drill.now, { stage: t(K.now.stage[d.stage as NowStage]) })) : '';
  const screen = d ? (d.kind === 'reach' ? REACH_ROUTE[d.stage as RecruitStage] : NOW_ROUTE[d.stage as NowStage]) : '';
  return (
    <Sheet open={!!d} onClose={() => s.setDrill(null)} title={title} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-drill={d ? `${d.kind}:${d.stage}` : ''}>
        {people.length === 0 ? <EmptyState icon={<Users size={28} />} title={t(K.drill.empty)} body="" /> : (
          <div className="stack">
            {people.map((p) => (
              <button key={p.id} type="button" className="ds-listrow" data-person={p.id} disabled={!p.route} onClick={() => p.route && s.goto(p.route)}>
                <span className="grow stack gap-1" style={{ minWidth: 0 }}><span className="t-medium">{p.name}</span><span className="t-xs t-muted">{t(roleKey(p.role))} · {t(K.drill.since, { date: formatDate(p.since, i18n.language) })}</span></span>
                {p.route && <CaretRight size={16} aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
        {people.length >= 50 && <p className="t-xs t-muted">{t(K.drill.more)}</p>}
        {screen ? <Button data-open-stage onClick={() => s.goto(screen)}>{t(K.drill.openStage)}</Button> : <p className="t-xs t-muted">{t(K.drill.noScreen)}</p>}
      </div>
    </Sheet>
  );
}
