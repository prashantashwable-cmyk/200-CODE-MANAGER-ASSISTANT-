import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, ArrowsClockwise, DownloadSimple, Minus, ShieldWarning } from '@phosphor-icons/react';
import { Badge, Button, TextArea, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Select, Sheet, formatDate, formatINR, formatINRCompact, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { PayoutAttentionItem, PayoutCategoryView, PayoutRowView, PayoutTrackerView } from '@/data/repository';
import type { Trend } from '@/features/commission/payoutTracker';
import { APPROVED_WAIT, OUTLIER_TIMES, PAYOUT_KEYS as K, PAGE, PERIODS, PULL_DISTANCE, SINGLE_SHARE, SPIKE_MIN_RISE, SPIKE_RATIO, STATUSES } from './payout-tracker.types';
import type { PayoutCategory, PayoutStatus } from './payout-tracker.types';
import { usePayoutTracker } from './usePayoutTracker';
import type { PayoutTrackerState } from './usePayoutTracker';

type T = ReturnType<typeof useTranslation>['t'];
const STATUS_TONE: Record<PayoutStatus, BadgeTone> = { projected: 'neutral', approved: 'accent', paid: 'success', forfeited: 'neutral' };
const reasonLabel = (t: T, key: string) => t(key, { defaultValue: key });
const ruleName = (t: T, id: string) => t(`commissionRules.rule.${id}.name`, { defaultValue: id });
const triggerLabel = (t: T, r: Pick<PayoutRowView, 'trigger' | 'reasonKey'>) => (r.reasonKey.startsWith('commission.reason.') && !['site_visit', 'lead_qualified', 'conversion', 'sales_close', 'install_pool', 'qc_fee'].includes(r.trigger) ? reasonLabel(t, r.reasonKey) : ruleName(t, r.trigger));

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

/** The trend beside a figure: an arrow and a percentage against the period before. It never says good or bad (more spend can be more business). */
function TrendLine({ trend, t, hasWindow }: { trend: Trend; t: T; hasWindow: boolean }) {
  if (!hasWindow) return <span className="t-xs t-muted">{t(K.kpi.noWindow)}</span>;
  if (!trend) return <span className="t-xs t-muted" data-trend="none">{t(K.kpi.noTrend)}</span>;
  const Icon = trend.dir === 'up' ? ArrowUp : trend.dir === 'down' ? ArrowDown : Minus;
  return <span className="row gap-1 t-xs" style={{ alignItems: 'center' }} data-trend={trend.dir}><Icon size={14} aria-hidden="true" />{trend.dir === 'flat' ? t(K.kpi.trendFlat) : t(trend.dir === 'up' ? K.kpi.trendUp : K.kpi.trendDown, { pct: trend.pct })}</span>;
}

/** Every KPI card has the same anatomy: a small label, a large number, a trend or a caption, and it opens the payouts behind it. */
function Kpi({ id, label, value, children, hero, onClick }: { id: string; label: string; value: string; children: ReactNode; hero?: boolean; onClick: () => void }) {
  return (
    <Card onClick={onClick}>
      <div className="stack gap-1" data-kpi={id} style={{ cursor: 'pointer' }}>
        <span className="t-xs t-muted">{label}</span>
        <span className="num t-semibold" style={{ fontSize: hero ? 'var(--text-3xl, 2.25rem)' : 'var(--text-2xl, 1.75rem)', lineHeight: 1.1 }} data-value>{value}</span>
        {children}
      </div>
    </Card>
  );
}

/**
 * Screen 162 — Stage-Wise Payout Tracker. Admin's view over the single commission ledger every partner sees their own slice of: what is waiting to be paid, what is not final
 * yet, what was paid, grouped by what earned it, with whatever stands out (a category that jumped, a payout out of line with its kind, one that has waited long) raised first.
 */
export function PayoutTrackerScreen() {
  const { t } = useTranslation();
  const s = usePayoutTracker();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  if (s.state === 'loading' && !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={4} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.state === 'error' || !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const d = s.data;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-payout-tracker>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <div className="stack gap-4">
          <Kpis d={d} s={s} t={t} />
          <Attention d={d} s={s} t={t} />
          <Categories d={d} s={s} t={t} />
          <Currencies d={d} t={t} />
          <Ledger d={d} s={s} t={t} />
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { ratio: SPIKE_RATIO, rise: formatINR(SPIKE_MIN_RISE), single: Math.round(SINGLE_SHARE * 100), times: OUTLIER_TIMES, days: Math.round(APPROVED_WAIT / 86_400_000) })}</p>
        </div>
      </Screen>
      <Detail row={s.entryRow} s={s} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ The four figures */

function Kpis({ d, s, t }: { d: PayoutTrackerView; s: PayoutTrackerState; t: T }) {
  const a = d.stock.approved;
  const hasWindow = d.window.days !== null;
  return (
    <div className="stack gap-3" data-kpis>
      <Kpi id="approved" hero label={t(K.kpi.approved.label)} value={formatINR(a.amount)} onClick={() => s.drill('approved', null)}>
        <span className="t-xs">{a.count === 0 ? t(K.kpi.approved.none) : t(K.kpi.approved.caption, { count: a.count, days: a.oldestDays ?? 0 })}</span>
        <span className="t-xs t-muted">{t(K.kpi.approved.note)}</span>
      </Kpi>
      <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties}>
      <Kpi id="pending" label={t(K.kpi.pending.label)} value={formatINR(d.stock.projected.amount)} onClick={() => s.drill('projected', null)}>
        <span className="t-xs">{t(K.kpi.pending.caption, { count: d.stock.projected.count })}</span>
        {d.stock.projected.held.count > 0 && <span className="t-xs t-muted">{t(K.kpi.pending.held, { amount: formatINR(d.stock.projected.held.amount) })}</span>}
      </Kpi>
      <Kpi id="earned" label={t(K.kpi.earned.label)} value={formatINR(d.flow.earned.amount)} onClick={() => s.setStatus(null)}>
        <span className="t-xs">{t(K.kpi.earned.caption, { count: d.flow.earned.count })}</span>
        <TrendLine trend={d.flow.earned.trend} t={t} hasWindow={hasWindow} />
      </Kpi>
      <Kpi id="paid" label={t(K.kpi.paid.label)} value={formatINR(d.flow.paid.amount)} onClick={() => s.setStatus('paid')}>
        <span className="t-xs">{t(K.kpi.paid.caption, { count: d.flow.paid.count })}</span>
        <TrendLine trend={d.flow.paid.trend} t={t} hasWindow={hasWindow} />
      </Kpi>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ What stands out */

function attentionText(t: T, it: PayoutAttentionItem): string {
  const f = it.facts;
  if (it.kind === 'spike') return t(K.attention.spike, { category: t(K.category[it.category as PayoutCategory]), ratio: f.ratio, rise: formatINR(Number(f.rise)) });
  if (it.kind === 'outlier') return t(K.attention.outlier, { partner: it.partnerName ?? '', amount: formatINR(it.amount), typical: formatINR(Number(f.typical)) });
  if (it.kind === 'stale_approved') return t(K.attention.stale, { count: Number(f.count), amount: formatINR(it.amount), days: f.days });
  return t(K.attention.held, { count: Number(f.count), amount: formatINR(it.amount) });
}

function Attention({ d, s, t }: { d: PayoutTrackerView; s: PayoutTrackerState; t: T }) {
  const { i18n } = useTranslation();
  const open = (it: PayoutAttentionItem) => {
    if (it.kind === 'outlier' && it.entryId) s.openEntry(it.entryId);
    else if (it.kind === 'spike') s.setCategory(it.category);
    else if (it.kind === 'stale_approved') s.drill('approved', null);
    else s.drill('projected', null);
  };
  return (
    <section className="stack gap-2" data-attention>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.attention.heading)}</h2><p className="t-sm">{t(K.attention.body)}</p></div>
      {d.attention.length === 0 ? <Card><p className="t-sm" data-attention-none>{t(K.attention.none)}</p></Card> : d.attention.map((it, i) => (
        <Card key={`${it.kind}:${it.entryId ?? it.category ?? i}`}>
          <div className="stack gap-1" data-attention-item={it.kind} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
            <span className="row gap-2" style={{ alignItems: 'flex-start' }}><ShieldWarning size={16} aria-hidden="true" style={{ color: 'var(--color-warning)', flex: '0 0 auto', marginTop: 2 }} /><span className="t-sm">{attentionText(t, it)}</span></span>
            {it.kind === 'spike' && <span className="t-xs t-muted">{Number(it.facts.single) === 1 ? t(K.attention.spikeSingle) : t(K.attention.spikeActivity)}</span>}
            {it.kind === 'spike' && it.facts.rule && <span className="t-xs" data-rule-change>{t(K.attention.spikeRule, { rule: ruleName(t, String(it.facts.rule)), version: it.facts.version, date: formatDate(String(it.facts.on), i18n.language) })}</span>}
            <span className="row gap-2 wrap">
              <Button size="sm" variant="secondary" data-attention-open={it.kind} onClick={() => open(it)}>{t(K.attention.open)}</Button>
              {it.kind === 'spike' && it.facts.rule && <Button size="sm" variant="ghost" data-attention-rule onClick={() => s.goTo(`/commission-rules?rule=${String(it.facts.rule)}`)}>{t(K.attention.openRule)}</Button>}
            </span>
          </div>
        </Card>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ By what earned it */

function Categories({ d, s, t }: { d: PayoutTrackerView; s: PayoutTrackerState; t: T }) {
  return (
    <section className="stack gap-2" data-categories>
      <h2 className="t-md t-semibold">{t(K.category.heading)}</h2>
      <div className="grid-auto" style={{ '--min': '260px' } as React.CSSProperties}>
        {d.categories.map((c) => <CategoryCard key={c.id} c={c} s={s} t={t} hasWindow={d.window.days !== null} />)}
      </div>
    </section>
  );
}

function CategoryCard({ c, s, t, hasWindow }: { c: PayoutCategoryView; s: PayoutTrackerState; t: T; hasWindow: boolean }) {
  return (
    <Card onClick={() => s.setCategory(s.category === c.id ? null : c.id)}>
      <div className="stack gap-2" data-category={c.id} data-spike={c.spike ? '1' : '0'} data-selected={s.category === c.id ? '1' : '0'} style={{ cursor: 'pointer', ...(s.category === c.id ? { outline: '2px solid var(--color-accent-primary)', outlineOffset: 4, borderRadius: 'var(--radius-md)' } : {}) }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{t(K.category[c.id])}</strong>
          {c.spike && <Badge tone="warning">{t(K.category.spikeBadge)}</Badge>}
        </div>
        <span className="num t-semibold" style={{ fontSize: 'var(--text-xl, 1.4rem)' }}>{formatINR(c.amount)}</span>
        {c.count === 0 ? <span className="t-xs t-muted">{t(K.category.empty)}</span> : (
          <>
            <ProgressBar value={Math.min(1, c.share)} tone="accent" label={t(K.category.share, { pct: Math.round(c.share * 100) })} />
            <span className="t-xs t-muted">{t(K.category.share, { pct: Math.round(c.share * 100) })} · {t(K.category.count, { count: c.count })}</span>
            <span className="row gap-1 wrap t-xs">{STATUSES.filter((x) => c.byStatus[x] > 0).map((x) => <span key={x} className="t-muted">{t(`commissionTracker.status.${x}`)} {formatINRCompact(c.byStatus[x])}</span>)}</span>
          </>
        )}
        <TrendLine trend={c.trend} t={t} hasWindow={hasWindow} />
      </div>
    </Card>
  );
}

function Currencies({ d, t }: { d: PayoutTrackerView; t: T }) {
  const others = d.currencies.filter((c) => c.currency !== 'INR');
  return (
    <div className="stack gap-1" data-currencies>
      {others.length === 0 ? <p className="t-xs t-muted" data-currency-note="inr">{t(K.currency.inr)}</p> : (
        <>
          <p className="t-xs t-muted">{t(K.currency.others)}</p>
          {others.map((c) => <p key={c.currency} className="t-sm num" data-currency={c.currency}>{t(K.currency.line, { currency: c.currency, amount: new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(c.amount), count: c.count })}</p>)}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ The payouts */

function Ledger({ d, s, t }: { d: PayoutTrackerView; s: PayoutTrackerState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const [more, setMore] = useState(false);
  const filtered = !!(s.status || s.category || s.partnerId || s.qInput || s.custom || s.period !== '30');
  const money = (n: number) => formatINR(n);
  return (
    <section className="stack gap-3" data-ledger>
      <div className="row between wrap" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
        <h2 className="t-md t-semibold">{t(K.filter.heading)}</h2>
        <Button size="sm" variant="secondary" icon={<DownloadSimple size={16} />} data-export disabled={d.total === 0} onClick={async () => { const n = await s.exportCsv({ status: (x) => t(`commissionTracker.status.${x}`), trigger: (r) => r.trigger }); toast.push(t(K.export.done, { count: n })); }}>{t(K.export.button)}</Button>
      </div>
      <div className="sticky-under-shell stack gap-2" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-filters>
        <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {PERIODS.map((p) => <span key={p} data-period={p} style={{ flex: '0 0 auto' }}><Chip pressed={!s.custom && s.period === p} onClick={() => s.setPeriod(p)}>{t(K.period[p])}</Chip></span>)}
        </div>
        <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          <span data-status-chip="all" style={{ flex: '0 0 auto' }}><Chip pressed={!s.status} onClick={() => s.setStatus(null)}>{t(K.filter.statusAll)} · {d.statusCounts.all}</Chip></span>
          {STATUSES.map((x) => <span key={x} data-status-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.status === x} onClick={() => s.setStatus(s.status === x ? null : x)}>{t(K.status[x])} · {d.statusCounts[x]}</Chip></span>)}
        </div>
        <Input value={s.qInput} placeholder={t(K.filter.search)} aria-label={t(K.filter.search)} onChange={(e) => s.setQInput(e.target.value)} data-f="q" />
        <div><Button size="sm" variant="ghost" data-more-filters aria-expanded={more} onClick={() => setMore(!more)}>{t(K.filter.more)}</Button>{filtered && <Button size="sm" variant="ghost" data-clear onClick={() => { setMore(false); s.clear(); }}>{t(K.filter.clear)}</Button>}</div>
        {more && (
          <div className="grid-auto" style={{ '--min': '180px' } as React.CSSProperties} data-filter-panel>
            <Field label={t(K.filter.partner)}>{(p) => <Select id={p.id} value={s.partnerId} onChange={(e) => s.setPartner(e.target.value)} data-f="partner"><option value="">{t(K.filter.allPartners)}</option>{d.partners.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field>
            <Field label={t(K.filter.category)}>{(p) => <Select id={p.id} value={s.category ?? ''} onChange={(e) => s.setCategory((e.target.value || null) as PayoutCategory | null)} data-f="category"><option value="">{t(K.filter.allCategories)}</option>{d.categories.map((c) => <option key={c.id} value={c.id}>{t(K.category[c.id])}</option>)}</Select>}</Field>
            <Field label={t(K.filter.from)}>{(p) => <Input id={p.id} type="date" value={s.from} onChange={(e) => s.setRange(e.target.value, s.to)} data-f="from" />}</Field>
            <Field label={t(K.filter.to)}>{(p) => <Input id={p.id} type="date" value={s.to} onChange={(e) => s.setRange(s.from, e.target.value)} data-f="to" />}</Field>
            <Field label={t(K.filter.sort)}>{(p) => <Select id={p.id} value={s.sort} onChange={(e) => s.setSort(e.target.value as 'recent' | 'amount')} data-f="sort"><option value="recent">{t(K.filter.sortRecent)}</option><option value="amount">{t(K.filter.sortAmount)}</option></Select>}</Field>
          </div>
        )}
        <p className="t-xs t-muted" data-showing>{s.from || s.to ? t(K.period.showing, { from: s.from ? formatDate(s.from, i18n.language) : '…', to: s.to ? formatDate(s.to, i18n.language) : '…' }) : t(K.period.showingAll)}</p>
      </div>
      {d.total === 0 ? (
        d.statusCounts.all === 0 && !filtered && d.currencies.length === 0 ? <EmptyState title={t(K.list.empty)} body={t(K.list.emptyBody)} /> : <EmptyState title={t(K.list.noMatch)} body={t(K.list.noMatchBody)} />
      ) : (
        <>
          <p className="t-sm" data-summary>{t(K.list.summary, { count: d.total, amount: money(d.filteredAmount) })}</p>
          <div className="stack gap-2" data-rows>{d.rows.map((r) => <Row key={r.id} r={r} s={s} t={t} lang={i18n.language} />)}</div>
          {d.rows.length < d.total && <div><Button variant="secondary" data-show-more onClick={s.more}>{t(K.list.showMore)} · {Math.min(PAGE, d.total - d.rows.length)}</Button></div>}
        </>
      )}
    </section>
  );
}

function Row({ r, s, t, lang }: { r: PayoutRowView; s: PayoutTrackerState; t: T; lang: string }) {
  return (
    <Card onClick={() => s.openEntry(r.id)}>
      <div className="stack gap-1" data-row={r.id} data-status={r.status} data-category={r.category} style={{ cursor: 'pointer' }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="stack" style={{ minWidth: 0 }}>
            <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{r.partnerName}</strong>
            <span className="t-xs t-muted">{t(K.list.role[r.partnerRole])} · {triggerLabel(t, r)}</span>
          </span>
          <span className="stack" style={{ alignItems: 'flex-end' }}><span className="num t-semibold">{formatINR(r.amount)}</span><Badge tone={STATUS_TONE[r.status]}>{t(K.status[r.status])}</Badge></span>
        </div>
        <span className="row gap-2 wrap t-xs t-muted">
          <span>{r.paidAt ? t(K.list.paid, { date: formatDate(r.paidAt, lang) }) : t(K.list.earned, { date: formatDate(r.earnedAt, lang) })}</span>
          {r.dealCode && <span>{r.dealCode}</span>}
          {r.flags.includes('held') && <Badge tone="warning">{t(K.list.held)}</Badge>}
          {r.flags.includes('outlier') && <Badge tone="warning">{t(K.list.outlier)}</Badge>}
          {r.flags.includes('stale_approved') && <Badge tone="warning">{t(K.list.stale)}</Badge>}
        </span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ One payout */

function Detail({ row, s, t }: { row: PayoutRowView | null; s: PayoutTrackerState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <Sheet open={!!row} onClose={() => s.openEntry(null)} title={t(K.detail.title)} closeLabel={t(K.close)}>
      {row && (
        <div className="stack gap-3" data-detail={row.id}>
          <div className="stack gap-1">
            <span className="num t-semibold" style={{ fontSize: 'var(--text-2xl, 1.75rem)' }}>{formatINR(row.amount)}</span>
            <span className="row gap-2" style={{ alignItems: 'center' }}><Badge tone={STATUS_TONE[row.status]}>{t(K.status[row.status])}</Badge><span className="t-xs t-muted">{t(K.status.explain[row.status])}</span></span>
          </div>
          <dl className="stack gap-2" style={{ margin: 0 }}>
            <Fact label={t(K.detail.partner)} value={`${row.partnerName} · ${t(K.list.role[row.partnerRole])}`} />
            <Fact label={t(K.detail.reason)} value={`${reasonLabel(t, row.reasonKey)}`} />
            {row.dealCode && <Fact label={t(K.detail.deal)} value={row.dealCode} />}
            {row.jobCode && <Fact label={t(K.detail.job)} value={row.jobCode} />}
            <Fact label={t(K.detail.earned)} value={formatDate(row.earnedAt, lang)} />
            {row.paidAt && <Fact label={t(K.detail.paid)} value={formatDate(row.paidAt, lang)} />}
            <Fact label={t(K.detail.id)} value={row.id} />
          </dl>
          {row.rule ? (
            <div className="stack gap-1" data-rule-trace>
              <strong className="t-sm">{t(K.detail.rule, { rule: ruleName(t, row.rule.id), version: row.rule.version })}</strong>
              {row.rule.inferred && <span className="t-xs t-muted">{t(K.detail.ruleInferred)}</span>}
            </div>
          ) : <p className="t-xs t-muted" data-no-rule>{t(K.detail.noRule)}</p>}
          <Questions s={s} t={t} lang={lang} />
          {row.held && <p className="t-sm" data-held style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>{t(K.detail.heldBody)}</p>}
          <Footer>
            {row.rule && <Button size="sm" variant="secondary" data-open-rule onClick={() => s.goTo(`/commission-rules?rule=${(row.rule as { id: string }).id}`)}>{t(K.detail.openRule)}</Button>}
            {row.jobId && <Button size="sm" variant="secondary" data-open-certificate onClick={() => s.goTo(`/handover-certificate/${row.jobId}`)}>{t(K.detail.openCertificate)}</Button>}
            <Button size="sm" variant="ghost" data-open-partner onClick={() => s.goTo(`/partner-directory?q=${encodeURIComponent(row.partnerName)}`)}>{t(K.detail.openPartner)}</Button>
          </Footer>
        </div>
      )}
    </Sheet>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="row between" style={{ gap: 'var(--space-3)' }}><dt className="t-xs t-muted">{label}</dt><dd className="t-sm" style={{ margin: 0, textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</dd></div>;
}

/** A partner's questions about this payout (168): Admin answers here, and the partner reads it on their own history. */
function Questions({ s, t, lang }: { s: PayoutTrackerState; t: T; lang: string }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (s.queries.length === 0) return null;
  const open = s.queries.find((q) => q.status === 'open');
  const send = async () => {
    if (!open) return;
    setBusy(true); setError(false);
    const ok = await s.answerQuery(open.id, text);
    setBusy(false);
    if (!ok) { setError(true); return; }
    setText(''); toast.push(t(K.detail.query.sent));
  };
  return (
    <section className="stack gap-2" data-queries>
      <h3 className="t-sm t-semibold">{t(K.detail.query.heading)}</h3>
      {s.queries.map((q) => (
        <div key={q.id} className="stack gap-1" data-query={q.id} data-query-status={q.status}>
          <span className="row gap-2" style={{ alignItems: 'center' }}><span className="t-xs t-muted">{q.code}</span><Badge tone={q.status === 'open' ? 'accent' : q.status === 'answered' ? 'success' : 'neutral'}>{t(K.detail.query.status[q.status])}</Badge></span>
          {q.messages.map((m, i) => <p key={`${m.at}:${i}`} className="t-sm"><strong>{m.from === 'partner' ? t(K.detail.query.from.partner) : m.from === 'system' ? t('payoutDispute.from.system') : t(K.detail.query.from.admin)}</strong> <span className="t-xs t-muted">{formatDate(m.at, lang)}</span><br />{m.text ?? t(m.key ?? '', { ...m.params, date: m.params.date ? formatDate(String(m.params.date), lang) : '', amount: typeof m.params.amount === 'number' ? formatINR(m.params.amount) : '', to: typeof m.params.to === 'number' ? formatINR(m.params.to) : '' })}</p>)}
          <div><Button size="sm" variant="ghost" data-open-dispute={q.id} onClick={() => s.goTo(`/payout-dispute?dispute=${q.id}`)}>{t('payoutDispute.link.open')}</Button></div>
        </div>
      ))}
      {open && (
        <div className="stack gap-2" data-answer-form>
          <Field label={t(K.detail.query.answer)} hint={t(K.detail.query.hint, { min: 15 })}>{(p) => <TextArea id={p.id} rows={3} value={text} onChange={(e) => setText(e.target.value)} data-f="answer" />}</Field>
          {error && <p className="t-sm" role="alert" data-error style={{ color: 'var(--color-error)' }}>{t(K.detail.query.problem, { min: 15 })}</p>}
          <div><Button size="sm" data-answer-send disabled={busy || text.replace(/[^\p{L}\p{N}]/gu, '').length < 15} onClick={() => void send()}>{t(K.detail.query.send)}</Button></div>
        </div>
      )}
    </section>
  );
}
