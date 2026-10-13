import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, ChatCircleText, DownloadSimple } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { PayoutEntryDetail, PayoutEventView, PayoutHistoryEntry, PayoutHistoryView, PayoutQueryView, PayoutStatementPeriod, PayoutStatementView } from '@/data/repository';
import { statementHtml } from '@/features/payout/history';
import type { StatementInput } from '@/features/payout/history';
import { themeTokens } from '@/features/training/reference';
import { HISTORY_KEYS as K, CATEGORIES, MONTHS_OFFERED, PAGE, PULL_DISTANCE, QUERY_DUE, QUERY_MIN, STATUS_FILTERS, csvCell } from './payout-history.types';
import type { Stage } from './payout-history.types';
import { usePayoutHistory } from './usePayoutHistory';
import type { PayoutHistoryState } from './usePayoutHistory';

type T = ReturnType<typeof useTranslation>['t'];
const STAGE_TONE: Record<Stage, BadgeTone> = { projected: 'neutral', approved: 'accent', held: 'warning', cleared: 'accent', sending: 'accent', failed: 'warning', paid: 'success', forfeited: 'neutral', reversed: 'warning' };
const reasonText = (t: T, key: string) => t(key, { defaultValue: key });
const lettersOf = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemText = (t: T, p: string) => t(`payoutHistory.problem.${p}`, { min: QUERY_MIN, defaultValue: t(K.problem.generic) });
const monthLabel = (iso: string, lang: string) => new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(iso));
const monthKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

function periodLabel(t: T, p: Pick<PayoutStatementPeriod, 'id' | 'kind' | 'from'>, lang: string): string {
  if (p.kind === 'month') return monthLabel(p.from, lang);
  if (p.kind === 'fy') { const y = Number(p.id.slice(3)); return t(K.statements.fy, { from: y, to: String((y + 1) % 100).padStart(2, '0') }); }
  return t(K.statements.all);
}
const methodText = (t: T, m: string) => (m === 'upi' ? t(K.row.method.upi) : m === 'bank_transfer' ? t(K.row.method.bank_transfer) : '');
const download = (name: string, type: string, body: string) => {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}
function stageHint(t: T, e: PayoutHistoryEntry): string {
  if (e.stage === 'held' && e.holdKind) return t(`payoutApproval.partner.hold.${e.holdKind}`);
  if (e.stage === 'failed') return t(e.needsDetails ? 'payoutDisbursement.partner.needsDetails' : 'payoutDisbursement.partner.retrying');
  if (e.stage === 'sending') return t('payoutDisbursement.partner.sending');
  return t(`payoutHistory.stage.hint.${e.stage}`);
}

/**
 * Screen 168 — Payout History & Statements. A partner's permanent record of what they have earned, read from the same ledger Admin's tracker and the disbursement engine use, so it
 * is never a separate figure. A payout that was changed or taken back is shown with what it was and why, never silently removed; a statement can be downloaded for any month, financial
 * year or everything; and anything that looks wrong can be asked about from the entry itself.
 */
export function PayoutHistoryScreen() {
  const { t } = useTranslation();
  const s = usePayoutHistory();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  if (s.load === 'loading' && !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' || !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const d = s.data;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-payout-history>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <div className="stack gap-4">
          <Hero d={d} s={s} t={t} />
          <Statements d={d} s={s} t={t} />
          <Ledger d={d} s={s} t={t} />
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { page: PAGE, months: MONTHS_OFFERED, days: Math.round(QUERY_DUE / 86_400_000) })}</p>
        </div>
      </Screen>
      <Detail v={s.detail} s={s} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ The running total */

function Hero({ d, s, t }: { d: PayoutHistoryView; s: PayoutHistoryState; t: T }) {
  const { i18n } = useTranslation();
  const k = d.totals;
  const tile = (id: string, label: string, m: { count: number; amount: number }, filter: 'paid' | 'inProgress' | 'projected' | 'reversed') => (
    <Card onClick={() => s.setStatus(filter)}>
      <div className="stack gap-1" data-total={id} style={{ cursor: 'pointer' }}>
        <span className="t-xs t-muted">{label}</span>
        <span className="num t-semibold" style={{ fontSize: 'var(--text-xl, 1.4rem)' }} data-value>{formatINR(m.amount)}</span>
        <span className="t-xs">{m.count === 0 ? t(K.hero.none) : t(K.hero.entries, { count: m.count })}</span>
      </div>
    </Card>
  );
  return (
    <div className="stack gap-3" data-hero>
      <Card onClick={() => s.setStatus('all')}>
        <div className="stack gap-1" data-total="earned" style={{ cursor: 'pointer' }}>
          <span className="t-xs t-muted">{t(K.hero.earned)}</span>
          <span className="num t-semibold" style={{ fontSize: 'var(--text-3xl, 2.25rem)', lineHeight: 1.1 }} data-value>{formatINR(k.earned.amount)}</span>
          <span className="t-xs">{k.firstEarnedAt ? t(K.hero.since, { date: formatDate(k.firstEarnedAt, i18n.language) }) : t(K.hero.none)}</span>
          <span className="t-xs t-muted">{t(K.hero.note)}</span>
        </div>
      </Card>
      <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties}>
        {tile('paid', t(K.hero.paid), k.paid, 'paid')}
        {tile('inProgress', t(K.hero.inProgress), k.inProgress, 'inProgress')}
        {tile('notFinal', t(K.hero.notFinal), k.notFinal, 'projected')}
        {k.reversed.count > 0 && tile('reversed', t(K.hero.reversed), k.reversed, 'reversed')}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Statements to keep */

function statementInput(t: T, v: PayoutStatementView, lang: string): StatementInput {
  const money = (n: number) => formatINR(n);
  return {
    lang, brand: 'ALL INDIA ELEVATORS COMPANY', heading: t(K.statement.heading), number: v.number, numberLabel: t(K.statement.number), holderLabel: t(K.statement.holder), holder: v.person.name,
    periodLabel: t(K.statement.period), period: periodLabel(t, v.period, lang),
    totals: [{ label: t(K.statement.totals.earned), value: money(v.totals.earned) }, { label: t(K.statement.totals.paid), value: money(v.totals.paid) }, ...(v.totals.tds > 0 ? [{ label: t(K.statement.totals.tds), value: money(v.totals.tds) }] : []), { label: t(K.statement.totals.reversed), value: money(v.totals.reversed) }, { label: t(K.statement.totals.outstanding), value: money(v.totals.outstanding) }],
    columns: { date: t(K.statement.col.date), title: t(K.statement.col.title), type: t(K.statement.col.type), amount: t(K.statement.col.amount), status: t(K.statement.col.status) },
    lines: v.lines.map((l) => ({ date: l.date, title: reasonText(t, l.reasonKey), type: t(K.statement.type[l.type]), amount: l.amount, status: t(K.stage[l.stage]), reference: l.reference ? t(K.row.ref, { ref: l.reference }) : '' })),
    money, dateOf: (iso) => formatDate(iso, lang), generated: t(K.statement.generated, { date: formatDate(v.generatedAt, lang) }), footer: t(K.statement.footer), tokens: themeTokens(),
  };
}

function Statements({ d, s, t }: { d: PayoutHistoryView; s: PayoutHistoryState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const v = s.statement;
  const htmlFile = () => { if (!v) return; download(`aiec-statement-${v.period.id}.html`, 'text/html;charset=utf-8', statementHtml(statementInput(t, v, lang))); toast.push(t(K.statements.downloaded)); };
  const csvFile = () => {
    if (!v) return;
    const lines = [['statement_number', 'partner_id', 'payout_entry_id', 'period', 'entry_type', 'date', 'description', 'amount', 'status', 'bank_reference', 'total_earned'].join(',')];
    for (const l of v.lines) lines.push([v.number, v.person.id, l.entryId, v.period.id, l.type, l.date.slice(0, 10), reasonText(t, l.reasonKey), l.amount, l.stage, l.reference ?? '', v.totals.earned].map(csvCell).join(','));
    download(`aiec-statement-${v.period.id}.csv`, 'text/csv;charset=utf-8', `﻿${lines.join('\n')}`);
    toast.push(t(K.statements.csvDone));
  };
  return (
    <section className="stack gap-2" data-statements>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.statements.heading)}</h2><p className="t-sm">{t(K.statements.body)}</p></div>
      {d.periods.length <= 1 && d.periods[0]?.count === 0 ? <Card><p className="t-sm" data-statements-none>{t(K.statements.none)}</p></Card> : (
        <>
          <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }} data-periods>
            {d.periods.map((p) => <span key={p.id} data-period={p.id} style={{ flex: '0 0 auto' }}><Chip pressed={s.period === p.id} onClick={() => s.setPeriod(p.id)}>{periodLabel(t, p, lang)}</Chip></span>)}
          </div>
          {v && (
            <Card>
              <div className="stack gap-1" data-statement={v.period.id}>
                {v.lines.length === 0 ? <p className="t-sm" data-statement-empty>{t(K.statements.empty)}</p> : (
                  <>
                    <span className="t-sm">{t(K.statements.earned, { amount: formatINR(v.totals.earned) })}</span>
                    <span className="t-sm">{t(K.statements.paid, { amount: formatINR(v.totals.paid) })}</span>
                    {v.totals.tds > 0 && <span className="t-sm" data-statement-tds>{t(K.statements.tds, { amount: formatINR(v.totals.tds) })}</span>}
                    {v.totals.reversed > 0 && <span className="t-sm" data-reversed>{t(K.statements.reversed, { amount: formatINR(v.totals.reversed) })}</span>}
                    <span className="t-xs t-muted">{t(K.statements.outstanding, { amount: formatINR(v.totals.outstanding) })}</span>
                  </>
                )}
                <span className="row gap-2 wrap mt-1">
                  <Button size="sm" icon={<DownloadSimple size={16} />} data-download-statement disabled={v.lines.length === 0} onClick={htmlFile}>{t(K.statements.download)}</Button>
                  <Button size="sm" variant="secondary" data-download-csv disabled={v.lines.length === 0} onClick={csvFile}>{t(K.statements.csv)}</Button>
                </span>
              </div>
            </Card>
          )}
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ Every payout */

function Ledger({ d, s, t }: { d: PayoutHistoryView; s: PayoutHistoryState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [more, setMore] = useState(false);
  const filtered = !!(s.status !== 'all' || s.category || s.from || s.to || s.qInput);
  const supplier = d.person.role === 'supplier';
  const cats = CATEGORIES.filter((c) => (supplier ? c === 'supply' : c !== 'supply'));
  // Grouped by the month they were earned, with that month's total for what is shown.
  const groups: { key: string; label: string; rows: PayoutHistoryEntry[] }[] = [];
  for (const r of d.rows) {
    const k = monthKey(r.earnedAt);
    const g = groups[groups.length - 1];
    if (g && g.key === k) g.rows.push(r); else groups.push({ key: k, label: monthLabel(r.earnedAt, lang), rows: [r] });
  }
  return (
    <section className="stack gap-3" data-ledger>
      <h2 className="t-md t-semibold">{t(K.list.heading)}</h2>
      <div className="sticky-under-shell stack gap-2" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-filters>
        <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {STATUS_FILTERS.map((x) => <span key={x} data-status-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.status === x} onClick={() => s.setStatus(x)}>{t(K.filter.status[x])}</Chip></span>)}
        </div>
        <Input value={s.qInput} placeholder={t(K.filter.search)} aria-label={t(K.filter.search)} onChange={(e) => s.setQInput(e.target.value)} data-f="q" />
        <div><Button size="sm" variant="ghost" data-more-filters aria-expanded={more} onClick={() => setMore(!more)}>{t(K.filter.more)}</Button>{filtered && <Button size="sm" variant="ghost" data-clear onClick={() => { setMore(false); s.clear(); }}>{t(K.filter.clear)}</Button>}</div>
        {more && (
          <div className="grid-auto" style={{ '--min': '170px' } as React.CSSProperties} data-filter-panel>
            <Field label={t(K.filter.from)}>{(p) => <Input id={p.id} type="date" value={s.from} onChange={(e) => s.setRange(e.target.value, s.to)} data-f="from" />}</Field>
            <Field label={t(K.filter.to)}>{(p) => <Input id={p.id} type="date" value={s.to} onChange={(e) => s.setRange(s.from, e.target.value)} data-f="to" />}</Field>
            <Field label={t(K.filter.category)}>{(p) => <Select id={p.id} value={s.category} onChange={(e) => s.setCategory(e.target.value)} data-f="category"><option value="">{t(K.filter.allCategories)}</option>{cats.map((c) => <option key={c} value={c}>{t(K.category[c])}</option>)}</Select>}</Field>
          </div>
        )}
      </div>
      {d.total === 0 ? (
        d.totals.firstEarnedAt === null && !filtered ? <EmptyState title={t(K.list.empty.title)} body={t(K.list.empty.body)} /> : <EmptyState title={t(K.list.noMatch)} body={t(K.list.noMatchBody)} />
      ) : (
        <>
          <p className="t-sm" data-summary>{t(K.list.count, { count: d.total, amount: formatINR(d.filteredAmount) })}</p>
          <div className="stack gap-3" data-rows>
            {groups.map((g) => (
              <div key={g.key} className="stack gap-2" data-month={g.key}>
                <div className="row between" style={{ alignItems: 'baseline' }}><h3 className="t-sm t-semibold">{g.label}</h3><span className="t-xs t-muted num">{formatINR(g.rows.reduce((a, r) => a + r.amount, 0))}</span></div>
                <div className="grid-auto" style={{ '--min': '320px' } as React.CSSProperties}>{g.rows.map((r) => <Row key={r.id} r={r} s={s} t={t} />)}</div>
              </div>
            ))}
          </div>
          {d.rows.length < d.total && <div><Button variant="secondary" data-show-more onClick={s.more}>{t(K.list.showMore)} · {Math.min(PAGE, d.total - d.rows.length)}</Button></div>}
        </>
      )}
    </section>
  );
}

function Row({ r, s, t }: { r: PayoutHistoryEntry; s: PayoutHistoryState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <Card>
      <div role="button" tabIndex={0} className="stack gap-1" data-row={r.id} data-stage={r.stage} style={{ cursor: 'pointer' }} onClick={() => s.openEntry(r.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.openEntry(r.id); } }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="stack" style={{ minWidth: 0 }}>
            <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{reasonText(t, r.reasonKey)}</strong>
            <span className="t-xs t-muted">{[r.dealCode, r.jobCode, t(K.row.earned, { date: formatDate(r.earnedAt, lang) })].filter(Boolean).join(' · ')}</span>
          </span>
          <span className="stack" style={{ alignItems: 'flex-end' }}><span className="num t-semibold">{formatINR(r.amount)}</span><Badge tone={STAGE_TONE[r.stage]}>{t(K.stage[r.stage])}</Badge></span>
        </div>
        {r.payment && r.paidAt && <span className="t-xs" data-paid-line>{t(K.row.paidOn, { date: formatDate(r.paidAt, lang) })}{r.payment.method ? ` · ${t(K.row.via, { method: methodText(t, r.payment.method), where: '' })}` : ''}{r.payment.bankReference ? ` · ${t(K.row.ref, { ref: r.payment.bankReference })}` : ''}</span>}
        {r.stage !== 'paid' && r.stage !== 'projected' && r.stage !== 'approved' && r.stage !== 'cleared' && r.stage !== 'forfeited' && <span className="t-xs" data-hint>{stageHint(t, r)}</span>}
        {r.adjusted && <span className="t-xs" data-adjusted style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-2)' }}>{t(K.row.adjusted, { from: formatINR(r.adjusted.from), to: formatINR(r.adjusted.to) })}</span>}
        {r.reversal && <span className="t-xs" data-reversal style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-2)' }}>{t(K.row.reversed, { date: formatDate(r.reversal.at, lang) })}: {r.reversal.reason}</span>}
        {r.openQuery && <Badge tone="accent">{t(K.row.question)}</Badge>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ One payout */

function eventText(t: T, e: PayoutEventView): string {
  const p = e.params;
  switch (e.kind) {
    case 'earned': return t(K.event.earned, { amount: formatINR(Number(p.amount)) });
    case 'cleared': return t(K.event.cleared);
    case 'held': return p.issue ? t(K.event.heldReview, { issue: String(p.issue) }) : p.kind ? `${t(K.event.held)}: ${t(`payoutApproval.partner.hold.${String(p.kind)}`)}` : t(K.event.held);
    case 'released': return t(K.event.released);
    case 'adjusted': return t(K.event.adjusted, { from: formatINR(Number(p.from)), to: formatINR(Number(p.to)), issue: String(p.issue ?? '') });
    case 'sent': return t(K.event.sent, { method: methodText(t, String(p.method)), code: String(p.code) });
    case 'failed': return p.needsDetails ? t(K.event.failedDetails) : t(K.event.failed);
    case 'paid': return t(K.event.paid, { how: [p.method ? ` ${methodText(t, String(p.method))}` : '', p.destination ? ` → ${String(p.destination)}` : '', p.reference ? ` · ${t(K.row.ref, { ref: String(p.reference) })}` : ''].join('') });
    case 'reversed': return t(K.event.reversed, { reason: String(p.reason) });
    case 'forfeited': return t(K.event.forfeited);
    case 'asked': return t(K.event.asked, { code: String(p.code) });
    default: return t(K.event.answered, { code: String(p.code) });
  }
}

function Detail({ v, s, t }: { v: PayoutEntryDetail | null; s: PayoutHistoryState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const e = v?.entry ?? null;
  return (
    <Sheet open={!!e} onClose={() => s.openEntry(null)} title={t(K.detail.title)} closeLabel={t(K.close)}>
      {v && e && (
        <div className="stack gap-3" data-detail={e.id} data-stage={e.stage}>
          <div className="stack gap-1">
            <span className="num t-semibold" style={{ fontSize: 'var(--text-2xl, 1.75rem)' }}>{formatINR(e.amount)}</span>
            <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{reasonText(t, e.reasonKey)}</strong>
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone={STAGE_TONE[e.stage]}>{t(K.stage[e.stage])}</Badge><span className="t-xs t-muted">{[e.dealCode ? t(K.detail.deal, { code: e.dealCode }) : null, e.jobCode ? t(K.detail.job, { code: e.jobCode }) : null, t(K.detail.earnedOn, { date: formatDate(e.earnedAt, lang) })].filter(Boolean).join(' · ')}</span></span>
            <p className="t-sm" data-stage-hint>{stageHint(t, e)}</p>
          </div>
          {e.payment && <p className="t-sm" data-payment>{t(K.detail.paidFacts, { date: formatDate(e.payment.completedAt, lang), method: methodText(t, e.payment.method) })}{e.payment.destination ? ` · ${e.payment.destination}` : ''}{e.payment.bankReference ? ` · ${t(K.row.ref, { ref: e.payment.bankReference })}` : ''}</p>}
          {e.payment && e.payment.tds > 0 && <p className="t-sm" data-tds>{t(K.detail.tds, { amount: formatINR(e.payment.tds) })} <Button size="sm" variant="ghost" data-open-tds onClick={() => s.goTo('/tds-statement')}>{t(K.detail.tdsLink)}</Button></p>}
          {e.adjusted && <p className="t-sm" data-adjusted-block style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>{t(K.detail.adjusted, { from: formatINR(e.adjusted.from), to: formatINR(e.adjusted.to) })}</p>}
          {e.reversal && (
            <div className="stack gap-1" data-reversal-block style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
              <p className="t-sm">{t(K.detail.reversal, { date: formatDate(e.reversal.at, lang), reason: e.reversal.reason })}</p>
              <p className="t-xs t-muted">{t(K.detail.reversalNote)}</p>
            </div>
          )}
          {v.events.length > 0 && (
            <section className="stack gap-1" data-timeline>
              <h3 className="t-sm t-semibold">{t(K.detail.timeline)}</h3>
              {v.events.map((x, i) => <p key={`${x.at}:${i}`} className="t-xs" data-event={x.kind}><span className="t-muted">{formatDate(x.at, lang)}</span> · {eventText(t, x)}</p>)}
            </section>
          )}
          {e.source === 'supplier' ? (
            <div className="stack gap-1" data-supplier-note><p className="t-xs t-muted">{t(K.detail.supplier.note)}</p>{e.route && <div><Button size="sm" variant="secondary" data-open-supplier onClick={() => s.goTo(e.route as string)}>{t(K.detail.supplier.open)}</Button></div>}</div>
          ) : <Ask v={v} s={s} t={t} />}
        </div>
      )}
    </Sheet>
  );
}

function Thread({ q, t }: { q: PayoutQueryView; t: T }) {
  const { i18n } = useTranslation();
  return (
    <div className="stack gap-1" data-query={q.id} data-query-status={q.status}>
      <span className="row gap-2" style={{ alignItems: 'center' }}><span className="t-xs t-muted">{q.code}</span><Badge tone={q.status === 'answered' ? 'success' : q.status === 'resolved' ? 'neutral' : 'accent'}>{t(K.ask.status[q.status])}</Badge></span>
      {q.messages.map((m, i) => <p key={`${m.at}:${i}`} className="t-sm" data-message={m.from}><strong>{m.from === 'partner' ? t(K.ask.from.partner) : m.from === 'system' ? t('payoutDispute.from.system') : t(K.ask.from.admin)}</strong> <span className="t-xs t-muted">{formatDate(m.at, i18n.language)}</span><br />{m.text ?? t(m.key ?? '', { ...m.params, date: m.params.date ? formatDate(String(m.params.date), i18n.language) : '', amount: typeof m.params.amount === 'number' ? formatINR(m.params.amount) : '', to: typeof m.params.to === 'number' ? formatINR(m.params.to) : '' })}</p>)}
    </div>
  );
}

function Ask({ v, s, t }: { v: PayoutEntryDetail; s: PayoutHistoryState; t: T }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const last = v.queries[v.queries.length - 1];
  const open = last && last.status === 'open';
  const answered = last && last.status === 'answered';
  useEffect(() => { if (s.ask && ref.current) ref.current.scrollIntoView({ block: 'center' }); }, [s.ask, v.entry.id]);
  const send = async () => {
    setBusy(true); setError(null);
    const res = await s.askQuestion(v.entry.id, text);
    setBusy(false);
    if (!res.ok) { setError(problemText(t, res.problem)); return; }
    setText(''); toast.push(t(K.ask.sent));
  };
  const resolve = async (id: string) => { const res = await s.resolveQuestion(id); toast.push(res.ok ? t(K.ask.resolved) : problemText(t, res.problem)); };
  return (
    <section className="stack gap-2" data-ask ref={ref}>
      {v.queries.length > 0 && <div className="stack gap-2" data-threads><h3 className="t-sm t-semibold">{t(K.ask.thread)}</h3>{v.queries.map((q) => <Thread key={q.id} q={q} t={t} />)}</div>}
      {v.canAsk && <div><Button size="sm" variant="ghost" data-open-dispute onClick={() => s.goTo(`/payout-dispute?entry=${v.entry.id}`)}>{t('payoutDispute.link.open')}</Button></div>}
      {answered && <div><Button size="sm" variant="secondary" data-resolve onClick={() => void resolve(last.id)}>{t(K.ask.resolve)}</Button></div>}
      {!open && v.canAsk && (
        <div className="stack gap-2" data-ask-form>
          <h3 className="t-sm t-semibold row gap-1" style={{ alignItems: 'center' }}><ChatCircleText size={16} aria-hidden="true" />{answered ? t(K.ask.followUp) : t(K.ask.heading)}</h3>
          <p className="t-xs t-muted">{t(K.ask.body, { days: Math.round(QUERY_DUE / 86_400_000) })}</p>
          <Field label={t(K.ask.label)} hint={t(K.ask.hint, { min: QUERY_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={text} onChange={(e) => setText(e.target.value)} data-f="ask" />}</Field>
          {error && <p className="t-sm" role="alert" data-error style={{ color: 'var(--color-error)' }}>{error}</p>}
          <Footer><Button size="sm" data-ask-send disabled={busy || lettersOf(text) < QUERY_MIN} onClick={() => void send()}>{t(K.ask.send)}</Button></Footer>
        </div>
      )}
    </section>
  );
}
