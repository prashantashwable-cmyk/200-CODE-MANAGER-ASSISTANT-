import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, BellRinging, CaretRight, DownloadSimple, Info, Minus, ShieldWarning, TrendDown, TrendUp, UsersThree, X } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, formatDate, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { ComplianceItemView, CompliancePartnerView, ComplianceGroupView, ComplianceReminderResult, ComplianceTrackerView, ComplianceWaveView } from '@/data/repository';
import { COMPLIANCE_KEYS as K, FILTERS, NOTE_MAX, PULL_DISTANCE, REMIND_GAP_HOURS, REVIEW_EVERY_DAYS, ROLES, SMALL_GROUP, VIEWS, WAVE_MIN, WAVE_WINDOW_DAYS, coachingPath, lessonsPath, recruitmentPath, refreshersPath, skillMatrixPath } from './training-compliance.types';
import { planOf, useTrainingCompliance } from './useTrainingCompliance';
import type { TrainingComplianceState } from './useTrainingCompliance';

type T = ReturnType<typeof useTranslation>['t'];
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const moduleTitle = (t: T, code: string) => t(`trainingLib.content.${code.toLowerCase()}.title`, { defaultValue: code });
const STATUS_TONE: Record<CompliancePartnerView['status'], BadgeTone> = { compliant: 'success', due_soon: 'accent', non_compliant: 'warning' };

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

/** A rate in words: a count always, a percentage only when the group is large enough to mean something. */
function RateLine({ g, t, label, onClick, tone }: { g: ComplianceGroupView; t: T; label: ReactNode; onClick?: () => void; tone?: 'warning' }) {
  const body = (
    <div className="stack gap-1" data-group={g.key} data-small={g.small ? '1' : '0'}>
      <div className="row between" style={{ alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span className="t-sm" style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{label}</span>
        <span className="t-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{t(K.overview.count, { ok: g.compliant, total: g.total })}{g.percent !== null && !g.small ? ` · ${g.percent}%` : ''}</span>
      </div>
      <ProgressBar value={g.total ? g.compliant / g.total : 0} tone={g.percent !== null && g.percent >= 80 ? 'success' : tone === 'warning' ? 'warning' : 'accent'} label={`${g.compliant}/${g.total}`} />
      {g.small && <span className="t-xs t-muted">{t(K.overview.small, { count: g.total })}</span>}
    </div>
  );
  return onClick ? <button type="button" onClick={onClick} style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textAlign: 'left', cursor: 'pointer', width: '100%' }}>{body}</button> : body;
}

/**
 * Screen 158 — Training Compliance Tracker. The consolidated answer to "is my whole workforce properly trained right now": the rate across active partners by
 * role and territory, who is out of compliance and why (never started, failed and not retaken, refresher lapsed), a way to remind everyone at once that
 * separates the people who need a nudge from those who need coaching, and a history an auditor can read. Safety-critical training is always the louder voice.
 */
export function TrainingComplianceScreen() {
  const { t } = useTranslation();
  const s = useTrainingCompliance();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const d = s.data;
  if (s.status === 'loading' && !d) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={4} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.status === 'error' || !d) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  if (d.partners.length === 0) return <Screen width="wide"><ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} /><EmptyState icon={<UsersThree size={28} />} title={t(K.empty.title)} body={t(K.empty.body)} actionLabel={t(K.empty.action)} onAction={() => s.goto(recruitmentPath)} /></Screen>;

  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  const open = s.openId ? d.partners.find((p) => p.userId === s.openId) ?? null : null;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-training-compliance>
      <Screen width="wide">
        {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <div className="stack gap-4">
          <Kpis s={s} d={d} t={t} />
          <Tabs label={t(K.title)} value={s.view} onChange={s.setView} items={VIEWS.map((v) => ({ id: v, label: t(K.view[v]) }))} />
          {s.view === 'overview' && <Overview s={s} d={d} t={t} />}
          {s.view === 'partners' && <Partners s={s} d={d} t={t} />}
          {s.view === 'trend' && <Trend s={s} d={d} t={t} />}
        </div>
      </Screen>
      <PartnerSheet s={s} p={open} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ headline figures */

function Kpis({ s, d, t }: { s: TrainingComplianceState; d: ComplianceTrackerView; t: T }) {
  const dir = d.trend.direction;
  const card = (id: string, label: string, value: ReactNode, caption: ReactNode, onClick: () => void, tone?: 'error' | 'warn') => (
    <Card onClick={onClick}>
      <div className="stack gap-1" data-kpi={id}>
        <span className="t-xs t-muted">{label}</span>
        <span className="t-display" style={{ fontSize: 'var(--text-2xl, 1.75rem)', lineHeight: 1.1, color: tone === 'error' ? 'var(--color-error)' : tone === 'warn' ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>{value}</span>
        <span className="t-xs t-muted">{caption}</span>
      </div>
    </Card>
  );
  const o = d.overall;
  return (
    <div className="grid-auto" style={{ '--min': '160px' } as React.CSSProperties} data-kpis>
      {card('rate', t(K.kpi.rate), o.small || o.percent === null ? `${o.compliant} / ${o.total}` : `${o.percent}%`,
        <span className="stack" style={{ gap: 2 }}>
          <span>{o.small ? t(K.kpi.rateSmall) : t(K.kpi.rateCaption, { ok: o.compliant, total: o.total })}</span>
          <span className="row gap-1" style={{ alignItems: 'center' }}>{dir === 'up' ? <TrendUp size={13} aria-hidden="true" style={{ color: 'var(--color-success)' }} /> : dir === 'down' ? <TrendDown size={13} aria-hidden="true" style={{ color: 'var(--color-warning)' }} /> : <Minus size={13} aria-hidden="true" />}{d.trend.delta === null || dir === 'flat' ? t(K.kpi.trendFlat) : t(dir === 'up' ? K.kpi.trendUp : K.kpi.trendDown, { points: Math.abs(d.trend.delta) })}</span>
        </span>, () => s.setView('trend'))}
      {card('safety', t(K.kpi.safety), d.counts.safety, d.counts.safety > 0 ? t(K.kpi.safetyCaption) : t(K.kpi.safetyNone), () => s.drill({ filter: 'safety' }), d.counts.safety > 0 ? 'error' : undefined)}
      {card('out', t(K.kpi.out), d.counts.nonCompliant, t(K.kpi.outCaption, { routine: d.counts.routine }), () => s.drill({ filter: 'out' }), d.counts.nonCompliant > 0 ? 'warn' : undefined)}
      {card('blocked', t(K.kpi.blocked), d.counts.blocked, t(K.kpi.blockedCaption), () => s.drill({ filter: 'safety' }), d.counts.blocked > 0 ? 'warn' : undefined)}
      {card('soon', t(K.kpi.soon), d.counts.dueSoon, t(K.kpi.soonCaption), () => s.drill({ filter: 'soon' }))}
    </div>
  );
}

/* ------------------------------------------------------------------ overview */

function WaveCard({ w, t, lang }: { w: ComplianceWaveView; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-2" data-wave={w.moduleCode}>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <Info size={18} aria-hidden="true" style={{ color: 'var(--color-accent-secondary)' }} />
          <strong className="t-md">{t(K.wave.heading, { module: moduleTitle(t, w.moduleCode) })}</strong>
        </div>
        <p className="t-sm">{t(K.wave.body, { count: w.people.length, from: formatDate(w.from, lang), to: formatDate(w.to, lang) })}</p>
        <div className="row gap-2 wrap">
          {w.lapsed > 0 && <Badge tone="warning">{t(K.wave.lapsed, { count: w.lapsed })}</Badge>}
          {w.upcoming > 0 && <Badge tone="accent">{t(K.wave.upcoming, { count: w.upcoming })}</Badge>}
          {w.safetyCritical && <Badge tone="neutral">{t(K.urgency.safety)}</Badge>}
        </div>
        <p className="t-xs t-muted">{w.people.map((p) => p.name).join(', ')}</p>
        <p className="t-xs t-muted">{t(K.wave.plan)}</p>
      </div>
    </Card>
  );
}

function Overview({ s, d, t }: { s: TrainingComplianceState; d: ComplianceTrackerView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div className="stack gap-4" data-overview>
      {d.waves.length > 0 && (
        <section className="stack gap-2">
          <h2 className="t-lg">{t(K.wave.tag)}</h2>
          <div className="grid-auto" style={{ '--min': '280px' } as React.CSSProperties}>{d.waves.map((w) => <WaveCard key={w.moduleId} w={w} t={t} lang={lang} />)}</div>
        </section>
      )}
      <div className="grid-auto" style={{ '--min': '300px' } as React.CSSProperties}>
        <Card>
          <div className="stack gap-3" data-by-role>
            <h2 className="t-md">{t(K.overview.byRole)}</h2>
            {d.byRole.map((g) => <RateLine key={g.key} g={g} t={t} label={t(K.role[g.key as (typeof ROLES)[number]])} onClick={() => s.drill({ role: g.key, filter: 'all' })} />)}
          </div>
        </Card>
        <Card>
          <div className="stack gap-3" data-by-territory>
            <h2 className="t-md">{t(K.overview.byTerritory)}</h2>
            {d.byTerritory.map((g) => <RateLine key={g.key || 'none'} g={g} t={t} label={g.key || t(K.overview.noTerritory)} onClick={() => s.drill({ territory: g.key, filter: 'all' })} />)}
          </div>
        </Card>
        <Card>
          <div className="stack gap-3" data-by-training>
            <h2 className="t-md">{t(K.overview.byTraining)}</h2>
            {d.byModule.map((m) => {
              const g: ComplianceGroupView = { key: m.moduleCode, compliant: m.current, total: m.required, percent: m.required ? Math.round((m.current / m.required) * 100) : null, small: m.required < SMALL_GROUP };
              return <RateLine key={m.moduleId} g={g} t={t} tone={m.safetyCritical && m.current < m.required ? 'warning' : undefined} label={<>{moduleTitle(t, m.moduleCode)}{m.safetyCritical && <> <Badge tone="neutral">{t(K.overview.safetyTraining)}</Badge></>}</>} />;
            })}
          </div>
        </Card>
      </div>
      <div className="stack gap-1" data-scope>
        <p className="t-xs t-muted">{t(K.overview.scope, { without: d.notCounted.modulesWithoutLessons })}</p>
        {d.notCounted.suppliersWithoutLogin > 0 && <p className="t-xs t-muted">{t(K.overview.suppliers, { count: d.notCounted.suppliersWithoutLogin })}</p>}
        <p className="t-xs t-muted" data-placeholder>{t(K.overview.placeholder, { small: SMALL_GROUP, wave: WAVE_WINDOW_DAYS, min: WAVE_MIN, hours: REMIND_GAP_HOURS })}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ partners */

function reasonChips(p: CompliancePartnerView) { return p.items.filter((i) => i.response); }

function PartnerRow({ p, t, lang, onOpen }: { p: CompliancePartnerView; t: T; lang: string; onOpen: () => void }) {
  const open = reasonChips(p);
  return (
    <Card onClick={onOpen}>
      <div className="stack gap-2" data-partner={p.userId} data-status={p.status} data-urgency={p.urgency ?? ''}>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <span className="stack grow" style={{ minWidth: 0 }}>
            <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{p.name}</strong>
            <span className="t-xs t-muted">{t(K.role[p.role])}{p.territory ? ` · ${p.territory}` : ''}{p.openJobs > 0 ? ` · ${t(K.list.jobs, { count: p.openJobs })}` : ''}</span>
          </span>
          <CaretRight size={16} aria-hidden="true" />
        </div>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          {p.urgency === 'safety' ? <Badge tone="error">{t(K.urgency.safety)}</Badge> : <Badge tone={STATUS_TONE[p.status]}>{t(K.status[p.status])}</Badge>}
          {p.blocked && <Badge tone="warning">{t(K.flag.blocked)}</Badge>}
          {p.waveOnly && <Badge tone="neutral">{t(K.flag.wave)}</Badge>}
          {p.items.some((i) => i.response === 'coaching') && <Badge tone="accent">{t(K.flag.coaching)}</Badge>}
        </div>
        {open.length > 0 && (
          <ul className="stack gap-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {open.map((i) => <li key={i.moduleId} className="t-sm" data-item={i.moduleCode} data-state={i.state}>{moduleTitle(t, i.moduleCode)} · <span className="t-muted">{t(K.reason[i.state as keyof typeof K.reason])}</span></li>)}
          </ul>
        )}
        <span className="t-xs t-muted">{p.lastReminderAt ? t(K.list.lastReminded, { date: formatDate(p.lastReminderAt, lang) }) : p.status === 'non_compliant' ? t(K.list.neverReminded) : ''}</span>
      </div>
    </Card>
  );
}

function Partners({ s, d, t }: { s: TrainingComplianceState; d: ComplianceTrackerView; t: T }) {
  const { i18n } = useTranslation();
  const [bulk, setBulk] = useState(false);
  const [result, setResult] = useState<ComplianceReminderResult | null>(null);
  const territories = d.byTerritory.map((g) => g.key);
  const plan = planOf(s.rows, Date.now());
  const counts: Record<string, number> = { out: d.counts.nonCompliant, safety: d.counts.safety, coaching: d.counts.coaching, refresher: d.counts.refresher, nudge: d.counts.nudge, soon: d.counts.dueSoon, all: d.partners.length };
  const filtered = s.filter !== 'out' || s.role || s.territory || s.query;
  return (
    <>
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-controls>
        <Field label={t(K.filters.search)}>{(p) => <Input id={p.id} type="search" value={s.query} onChange={(e) => s.setQuery(e.target.value)} data-f="search" autoComplete="off" />}</Field>
        <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 2 }} role="group" aria-label={t(K.title)}>
          {FILTERS.map((f) => <span key={f} data-chip={f} style={{ flex: '0 0 auto' }}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(K.filters.chip[f])} · {counts[f]}</Chip></span>)}
        </div>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Select value={s.role} onChange={(e) => s.setRole(e.target.value)} aria-label={t(K.filters.role)} data-f="role" style={{ width: 'auto', minHeight: 36 }}>
            <option value="">{t(K.filters.allRoles)}</option>
            {ROLES.map((r) => <option key={r} value={r}>{t(K.role[r])}</option>)}
          </Select>
          <Select value={s.territory} onChange={(e) => s.setTerritory(e.target.value)} aria-label={t(K.filters.territory)} data-f="territory" style={{ width: 'auto', minHeight: 36 }}>
            <option value="">{t(K.filters.allTerritories)}</option>
            {territories.map((x) => <option key={x || 'none'} value={x}>{x || t(K.overview.noTerritory)}</option>)}
          </Select>
          {filtered && <Button size="sm" variant="ghost" icon={<X size={14} />} data-clear onClick={s.clearFilters}>{t(K.filters.clear)}</Button>}
          <Button size="sm" variant="ghost" icon={<DownloadSimple size={14} />} data-export onClick={() => s.exportCsv((r) => t(K.reason[r as keyof typeof K.reason], { defaultValue: r }), (x) => t(K.status[x as keyof typeof K.status]), (r) => t(K.role[r as (typeof ROLES)[number]]))}>{t(K.export.button)}</Button>
        </div>
        <p className="t-xs t-muted" role="status" data-count>{t(K.filters.count, { count: s.rows.length })}</p>
      </div>
      <div className="stack gap-3 mt-2" data-list>
        {s.rows.length === 0 ? (
          <EmptyState icon={<UsersThree size={28} />} title={filtered ? t(K.filters.none) : t(K.list.allFine)} body={filtered ? '' : t(K.detail.fineBody)} actionLabel={filtered ? t(K.filters.clear) : undefined} onAction={filtered ? s.clearFilters : undefined} />
        ) : s.visible.map((p) => <PartnerRow key={p.userId} p={p} t={t} lang={i18n.language} onOpen={() => s.open(p.userId)} />)}
        {s.visible.length < s.rows.length && <Button variant="secondary" data-more onClick={s.more}>{t(K.list.more, { count: s.rows.length - s.visible.length })}</Button>}
      </div>
      {s.rows.some((r) => r.status === 'non_compliant') && (
        <ActionBar>
          <Button icon={<BellRinging size={16} />} data-bulk onClick={() => setBulk(true)}>{t(K.bulk.button, { count: s.rows.filter((r) => r.status === 'non_compliant').length })}</Button>
        </ActionBar>
      )}
      <BulkSheet open={bulk} onClose={() => { setBulk(false); setResult(null); }} s={s} t={t} plan={plan} result={result} onResult={setResult} lang={i18n.language} />
    </>
  );
}

function BulkSheet({ open, onClose, s, t, plan, result, onResult, lang }: { open: boolean; onClose: () => void; s: TrainingComplianceState; t: T; plan: ReturnType<typeof planOf>; result: ComplianceReminderResult | null; onResult: (r: ComplianceReminderResult | null) => void; lang: string }) {
  const [error, setError] = useState<string | null>(null);
  const nameOf = (id: string) => s.data?.partners.find((p) => p.userId === id)?.name ?? id;
  return (
    <Sheet open={open} onClose={onClose} title={result ? t(K.bulk.resultTitle) : t(K.bulk.title)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-form="bulk">
        {result ? (
          <div className="stack gap-2" data-bulk-result>
            <p className="t-md" style={{ fontWeight: 600 }}>{t(K.bulk.sent, { count: result.sent.length })}</p>
            {result.sent.some((x) => x.assigned > 0) && <p className="t-sm t-muted">{t(K.bulk.assignedN, { count: result.sent.reduce((n, x) => n + x.assigned, 0) })}</p>}
            {result.skipped.length > 0 && (
              <div className="stack gap-1"><strong className="t-sm">{t(K.bulk.skippedHead)}</strong>
                {result.skipped.map((x) => <p key={x.userId} className="t-sm" data-skipped={x.reason}>{nameOf(x.userId)} · <span className="t-muted">{t(K.bulk.skip[x.reason])}</span></p>)}
              </div>
            )}
            <Footer><Button data-bulk-ok onClick={onClose}>{t(K.bulk.done)}</Button></Footer>
          </div>
        ) : (
          <>
            <p className="t-sm">{t(K.bulk.body, { days: 14, hours: REMIND_GAP_HOURS })}</p>
            {plan.willSend.length === 0 ? <p className="t-sm" data-bulk-none>{t(K.bulk.none)}</p> : (
              <div className="stack gap-1" data-bulk-send>
                <strong className="t-md">{t(K.bulk.willSend, { count: plan.willSend.length })}</strong>
                {plan.safetyFirst > 0 && <p className="t-xs t-muted">{t(K.bulk.safetyFirst, { count: plan.safetyFirst })}</p>}
                <p className="t-sm t-muted">{plan.willSend.map((p) => p.name).join(', ')}</p>
              </div>
            )}
            {plan.coaching.length > 0 && <div className="stack gap-1" data-bulk-coaching><strong className="t-sm">{t(K.bulk.coaching, { count: plan.coaching.length })}</strong><p className="t-sm t-muted">{plan.coaching.map((p) => p.name).join(', ')}</p></div>}
            {plan.recent.length > 0 && <div className="stack gap-1" data-bulk-recent><strong className="t-sm">{t(K.bulk.recent, { count: plan.recent.length, hours: REMIND_GAP_HOURS })}</strong><p className="t-sm t-muted">{plan.recent.map((p) => `${p.name}${p.lastReminderAt ? ` (${formatDate(p.lastReminderAt, lang)})` : ''}`).join(', ')}</p></div>}
            {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
            <Footer>
              <Button variant="ghost" onClick={onClose}>{t(K.bulk.cancel)}</Button>
              <Button disabled={plan.willSend.length === 0 || s.busy} data-confirm-bulk onClick={async () => { const r = await s.remind(plan.willSend.map((p) => p.userId)); if (!r.ok) setError(r.code ?? 'generic'); else { setError(null); onResult(r.value ?? null); } }}>{t(K.bulk.confirm, { count: plan.willSend.length })}</Button>
            </Footer>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ one partner */

function ItemCard({ i, p, t, s, lang }: { i: ComplianceItemView; p: CompliancePartnerView; t: T; s: TrainingComplianceState; lang: string }) {
  const bad = !!i.response;
  const tone: BadgeTone = bad ? (i.safetyCritical ? 'error' : 'warning') : i.state === 'current' ? 'success' : 'accent';
  return (
    <Card>
      <div className="stack gap-2" data-detail-item={i.moduleCode} data-state={i.state}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{moduleTitle(t, i.moduleCode)}</strong>
          <Badge tone={tone}>{t(K.state[i.state])}</Badge>
        </div>
        <div className="row gap-2 wrap">
          {i.safetyCritical && <Badge tone="neutral">{t(K.overview.safetyTraining)}</Badge>}
          {i.holdsWork && <Badge tone="warning">{t(K.detail.holds)}</Badge>}
          {i.inWave && <Badge tone="neutral">{t(K.flag.wave)}</Badge>}
          {i.assignedUntil && <Badge tone="accent">{t(K.detail.assigned, { date: formatDate(i.assignedUntil, lang) })}</Badge>}
        </div>
        {bad && (
          <>
            <p className="t-sm">{t(K.reasonBody[i.state as keyof typeof K.reasonBody], { date: i.since ? formatDate(i.since, lang) : '', count: i.fails })}</p>
            <p className="t-xs t-muted" data-response={i.response}><strong>{t(K.response[i.response as keyof typeof K.response])}.</strong> {t(K.responseBody[i.response as keyof typeof K.responseBody])}</p>
          </>
        )}
        <div className="row gap-2 wrap">
          <Button size="sm" variant="secondary" onClick={() => s.goto(lessonsPath(i.moduleId))}>{t(K.detail.openModule)}</Button>
          {i.response === 'coaching' && <Button size="sm" data-coaching onClick={() => s.goto(`${coachingPath}?partner=${p.userId}`)}>{t(K.detail.openCoaching)}</Button>}
          {i.response === 'refresher' && <Button size="sm" variant="secondary" data-refreshers onClick={() => s.goto(refreshersPath)}>{t(K.detail.openRefreshers)}</Button>}
        </div>
      </div>
    </Card>
  );
}

function PartnerSheet({ s, p, t }: { s: TrainingComplianceState; p: CompliancePartnerView | null; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const lang = i18n.language;
  const canRemind = !!p && p.status === 'non_compliant' && p.items.some((i) => i.response === 'nudge' || i.response === 'refresher');
  return (
    <Sheet open={!!p} onClose={() => { setError(null); s.open(null); }} title={p ? p.name : t(K.title)} closeLabel={t(K.close)}>
      {p && (
        <div className="stack gap-3" data-detail={p.userId}>
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={STATUS_TONE[p.status]}>{t(K.status[p.status])}</Badge>
            {p.urgency === 'safety' && <Badge tone="error">{t(K.urgency.safety)}</Badge>}
            <span className="t-xs t-muted">{t(K.role[p.role])}{p.territory ? ` · ${p.territory}` : ''}</span>
          </div>
          {p.sopOpen > 0 && <p className="t-sm" data-sop-open>{t(K.detail.sopOpen, { count: p.sopOpen })} <Button size="sm" variant="ghost" onClick={() => s.goto('/sop-rollouts')}>{t(K.detail.openRollouts)}</Button></p>}
          {p.blocked && <p className="t-sm" data-held><ShieldWarning size={16} aria-hidden="true" style={{ verticalAlign: 'text-bottom', color: 'var(--color-warning)' }} /> {t(K.detail.heldBody)}</p>}
          {p.openJobs > 0 && p.status === 'non_compliant' && <p className="t-xs t-muted">{t(K.detail.openJobs, { count: p.openJobs })}</p>}
          {p.status === 'compliant' && <p className="t-sm">{t(K.detail.fine)}</p>}
          {p.items.map((i) => <ItemCard key={i.moduleId} i={i} p={p} t={t} s={s} lang={lang} />)}
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
          <Footer>
            {p.roles.includes('technician') && <Button variant="ghost" onClick={() => s.goto(skillMatrixPath)}>{t(K.detail.matrix)}</Button>}
            {canRemind && <Button data-remind disabled={s.busy} onClick={async () => { const r = await s.remind([p.userId]); if (!r.ok) setError(r.code ?? 'generic'); else { setError(null); const x = r.value?.skipped[0]; toast.push(x ? t(K.bulk.skip[x.reason]) : t(K.bulk.sent, { count: 1 })); } }}>{t(K.detail.remind)}</Button>}
          </Footer>
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ history */

function Trend({ s, d, t }: { s: TrainingComplianceState; d: ComplianceTrackerView; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const pts = d.trend.points;
  const known = pts.filter((p) => p.percent !== null);
  const W = 320;
  const H = 120;
  const x = (i: number) => 16 + (i * (W - 32)) / Math.max(1, pts.length - 1);
  const y = (v: number) => H - 16 - (v / 100) * (H - 32);
  const path = pts.map((p, i) => (p.percent === null ? null : `${i === 0 || pts[i - 1].percent === null ? 'M' : 'L'}${x(i)},${y(p.percent)}`)).filter(Boolean).join(' ');
  const dir = d.trend.direction;
  const smallest = Math.min(...pts.filter((p) => p.total > 0).map((p) => p.total));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const last = d.reviews[0];
  const overdue = Date.parse(d.reviewDueAt) <= Date.now();
  return (
    <div className="stack gap-4" data-trend>
      <section className="stack gap-3">
        <div className="stack gap-1"><h2 className="t-lg">{t(K.trend.heading)}</h2><p className="t-sm t-muted">{t(K.trend.body)}</p></div>
        <Card>
          <div className="stack gap-2">
            <span className="row gap-2" style={{ alignItems: 'center' }} data-direction={dir}>
              {dir === 'up' ? <TrendUp size={20} aria-hidden="true" style={{ color: 'var(--color-success)' }} /> : dir === 'down' ? <TrendDown size={20} aria-hidden="true" style={{ color: 'var(--color-warning)' }} /> : <Minus size={20} aria-hidden="true" />}
              <strong className="t-md">{d.trend.delta === null || dir === 'flat' ? t(K.trend.flat) : t(K.trend[dir], { points: Math.abs(d.trend.delta) })}</strong>
            </span>
            {known.length < 2 ? <p className="t-sm t-muted">{t(K.trend.few)}</p> : (
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(K.trend.chart)} style={{ width: '100%', height: 'auto', maxHeight: 220 }} data-chart>
                {[0, 50, 100].map((g) => <line key={g} x1={16} x2={W - 16} y1={y(g)} y2={y(g)} stroke="var(--color-border)" strokeWidth={1} />)}
                <path d={path} fill="none" stroke="var(--color-accent-primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {pts.map((p, i) => p.percent === null ? null : <circle key={p.month} cx={x(i)} cy={y(p.percent)} r={3.5} fill={p.basis === 'rebuilt' ? 'var(--color-surface)' : 'var(--color-accent-primary)'} stroke="var(--color-accent-primary)" strokeWidth={1.5} />)}
              </svg>
            )}
            <div className="row between t-xs t-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{pts.map((p) => <span key={p.month} data-point={p.month} data-basis={p.basis} style={{ textAlign: 'center' }}>{p.month.slice(5)}<br />{p.percent === null ? '—' : t(K.trend.point, { ok: p.compliant, total: p.total })}</span>)}</div>
            {Number.isFinite(smallest) && smallest < SMALL_GROUP && <p className="t-xs t-muted">{t(K.trend.small, { count: smallest })}</p>}
            <p className="t-xs t-muted" data-trend-note>{t(K.trend.basisNote)}</p>
            <div className="row gap-2 wrap">{(['live', 'recorded', 'rebuilt'] as const).filter((b) => pts.some((p) => p.basis === b)).map((b) => <Badge key={b} tone="neutral">{t(K.trend.basis[b])}</Badge>)}</div>
          </div>
        </Card>
      </section>
      <section className="stack gap-3" data-review>
        <div className="stack gap-1"><h2 className="t-lg">{t(K.review.heading)}</h2><p className="t-sm t-muted">{t(K.review.body, { days: REVIEW_EVERY_DAYS })}</p></div>
        <Card>
          <div className="stack gap-2">
            <p className="t-sm" data-review-last>{last ? t(K.review.last, { date: formatDate(last.at, lang), name: last.byName }) : t(K.review.never)}</p>
            <p className="t-xs" style={{ color: overdue ? 'var(--color-warning)' : undefined }} data-review-due>{overdue ? t(K.review.overdue, { date: formatDate(d.reviewDueAt, lang) }) : t(K.review.due, { date: formatDate(d.reviewDueAt, lang) })}</p>
            <Field label={t(K.review.note)} hint={t(K.review.noteHint, { max: NOTE_MAX })}>{(p) => <TextArea id={p.id} rows={3} value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
            {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
            <div className="row gap-2"><Button data-record-review disabled={s.busy} onClick={async () => { const r = await s.review(note); if (!r.ok) setError(r.code ?? 'generic'); else { setError(null); setNote(''); toast.push(t(K.review.recorded)); } }}>{t(K.review.record)}</Button></div>
          </div>
        </Card>
        {d.reviews.length > 0 && (
          <div className="stack gap-2" data-review-history>
            <strong className="t-sm">{t(K.review.history)}</strong>
            {d.reviews.map((r) => (
              <Card key={r.id}>
                <div className="stack" style={{ gap: 2 }} data-review-entry={r.id}>
                  <span className="t-sm">{formatDate(r.at, lang)} · {t(K.review.by, { name: r.byName })}</span>
                  <span className="t-xs t-muted">{t(K.review.figures, { ok: r.compliant, total: r.total, safety: r.safetyOpen })}</span>
                  {r.note && <span className="t-xs">{r.note}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
