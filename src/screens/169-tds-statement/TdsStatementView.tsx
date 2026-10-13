import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, DownloadSimple } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, TextArea, Sheet, formatDate, formatINR, useToast } from '@/design-system';
import type { TdsAdminQuarter, TdsAdminView, TdsCertificateView, TdsPartnerView, TdsProfileRow, TdsRuleView } from '@/data/repository';
import { certificateHtml } from '@/features/tax/tds';
import type { CertificateInput } from '@/features/tax/tds';
import { themeTokens } from '@/features/training/reference';
import { TDS_KEYS as K, DEFAULT_RATES, NO_PAN_RATE, PULL_DISTANCE, csvCell, fyLabel } from './tds-statement.types';
import type { TdsSection } from './tds-statement.types';
import { useTdsStatement } from './useTdsStatement';
import type { TdsResult, TdsStatementState } from './useTdsStatement';

type T = ReturnType<typeof useTranslation>['t'];
const problemText = (t: T, p: string) => t(`tdsStatement.problem.${p}`, { defaultValue: t(K.problem.generic) });
const fyText = (t: T, fy: string) => t(K.fy.chip, { fy: fyLabel(fy) });
const monthText = (id: string, lang: string) => new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(`${id}-15T00:00:00`));
const rangeText = (from: string, to: string, lang: string) => { const f = new Intl.DateTimeFormat(lang, { month: 'short' }); return `${f.format(new Date(from))} - ${f.format(new Date(Date.parse(to) - 86_400_000))}`; };
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
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}
const sectionWhat = (t: T, s: TdsSection) => t(`tdsStatement.rule.section.${s}`);

function certificateInput(t: T, c: TdsCertificateView, lang: string): CertificateInput {
  const money = (n: number) => formatINR(n);
  const period = c.quarter === 0 ? t(K.cert.period.year, { fy: fyLabel(c.fy) }) : t(K.cert.period.quarter, { fy: fyLabel(c.fy), q: c.quarter });
  return {
    lang, brand: 'ALL INDIA ELEVATORS COMPANY', heading: c.status === 'final' ? t(K.cert.heading) : t(K.cert.headingProvisional), holderLabel: t(K.cert.holder), holder: c.person.name, panLabel: t(K.cert.pan), pan: c.pan ?? '—', deductorLabel: t(K.cert.deductor), deductor: c.deductor,
    numberLabel: t(K.cert.number), number: c.number,
    lines: [{ label: t(K.cert.line.period), value: period }, { label: t(K.cert.line.section), value: `${c.section} · ${sectionWhat(t, c.section)}` }, { label: t(K.cert.line.gross), value: money(c.gross) }, { label: t(K.cert.line.tds), value: money(c.tds) }, ...(c.returnAck ? [{ label: t(K.cert.line.ack), value: c.returnAck }] : []), ...(c.filedAt ? [{ label: t(K.cert.line.filed), value: formatDate(c.filedAt, lang) }] : [])],
    table: { head: [t(K.cert.col.date), t(K.cert.col.payout), t(K.cert.col.gross), t(K.cert.col.rate), t(K.cert.col.tax)], rows: c.rows.map((r) => [formatDate(r.date, lang), r.disbursementCode ?? r.code, money(r.grossAmount), `${r.rate}%`, money(r.amount)]) },
    statusNote: c.status === 'final' ? t(K.cert.status.final) : t(K.cert.status.provisional), footer: t(K.cert.footer), tokens: themeTokens(),
  };
}

/**
 * Screen 169 — Tax Deduction (TDS) Statement. AIEC deducts tax at source from partner payouts; this is each partner's own statement and certificate (a real zero below the yearly limit,
 * never a blank), and Admin's aggregate for the deposits and returns the accountant files. Rates are versioned and can start on a future date. All figures are placeholders for the
 * accountant to confirm; the app provides the data and the filing stays an external, accountant-handled step.
 */
export function TdsStatementScreen() {
  const { t } = useTranslation();
  const s = useTdsStatement();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  if (s.load === 'loading' && !s.partner && !s.aggregate) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' || (!s.partner && !s.aggregate)) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-tds>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={s.admin ? t(K.subtitleAdmin) : t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <div className="stack gap-4">
          {s.admin && s.aggregate ? <AdminView v={s.aggregate} s={s} t={t} /> : s.partner ? <PartnerView v={s.partner} s={s} t={t} /> : null}
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { h: DEFAULT_RATES['194H'].rate, ht: formatINR(DEFAULT_RATES['194H'].threshold), c: DEFAULT_RATES['194C'].rate, ct: formatINR(DEFAULT_RATES['194C'].threshold), q: DEFAULT_RATES['194Q'].rate, qt: formatINR(DEFAULT_RATES['194Q'].threshold), nopan: NO_PAN_RATE })}</p>
        </div>
      </Screen>
    </div>
  );
}

function YearChips({ fys, current, s, t }: { fys: string[]; current: string; s: TdsStatementState; t: T }) {
  return <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }} data-years>{fys.map((f) => <span key={f} data-fy={f} style={{ flex: '0 0 auto' }}><Chip pressed={current === f} onClick={() => s.setFy(f)}>{fyText(t, f)}</Chip></span>)}</div>;
}

/* ------------------------------------------------------------------ A partner's own statement */

function PartnerView({ v, s, t }: { v: TdsPartnerView; s: TdsStatementState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const getCert = async (fy: string, q: 0 | 1 | 2 | 3 | 4) => {
    const c = await s.certificate(fy, q);
    if (!c) return;
    download(`aiec-tds-${c.number}.html`, 'text/html;charset=utf-8', certificateHtml(certificateInput(t, c, lang)));
    toast.push(t(K.quarter.downloaded));
  };
  const lim = v.rule.threshold;
  const status = v.status;
  const params = { gross: formatINR(v.gross), threshold: formatINR(lim), section: v.section, rate: v.rule.rate };
  return (
    <div className="stack gap-4">
      <YearChips fys={v.fys} current={v.fy} s={s} t={t} />
      <section className="stack gap-3" data-summary>
        <div className="grid-auto" style={{ '--min': '180px' } as React.CSSProperties}>
          <Card><div className="stack gap-1" data-kpi="gross"><span className="t-xs t-muted">{t(K.summary.gross)}</span><span className="num t-semibold" style={{ fontSize: 'var(--text-2xl, 1.75rem)' }} data-value>{formatINR(v.gross)}</span></div></Card>
          <Card><div className="stack gap-1" data-kpi="deducted"><span className="t-xs t-muted">{t(K.summary.deducted)}</span><span className="num t-semibold" style={{ fontSize: 'var(--text-2xl, 1.75rem)' }} data-value>{formatINR(v.deducted)}</span></div></Card>
        </div>
        <Card>
          <div className="stack gap-2" data-status={status}>
            <strong className="t-sm">{t(K.summary.status[status].title)}</strong>
            <p className="t-sm">{t(K.summary.status[status].body, params)}</p>
            <ProgressBar value={Math.min(1, lim > 0 ? v.gross / lim : 0)} tone="accent" label={t(K.summary.limit, { gross: formatINR(v.gross), threshold: formatINR(lim) })} />
            <span className="t-xs t-muted">{t(K.summary.limit, { gross: formatINR(v.gross), threshold: formatINR(lim) })}</span>
            {v.toDeduct > 0 && <p className="t-sm" data-to-deduct>{t(K.summary.toDeduct, { amount: formatINR(v.toDeduct) })}</p>}
            {v.earlierGross > 0 && <p className="t-xs t-muted" data-earlier>{t(K.summary.earlier, { amount: formatINR(v.earlierGross) })}</p>}
          </div>
        </Card>
        {v.pan.onFile ? <p className="t-xs t-muted" data-pan>{t(K.pan.onFile, { pan: v.pan.masked ?? '' })}</p> : <Card><div className="stack gap-1" data-pan-missing style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}><strong className="t-sm">{t(K.pan.missing.title)}</strong><p className="t-sm">{t(K.pan.missing.body, { rate: NO_PAN_RATE })}</p></div></Card>}
      </section>

      <section className="stack gap-2" data-rule>
        <h2 className="t-md t-semibold">{t(K.rule.heading)}</h2>
        <Card>
          <div className="stack gap-1">
            <p className="t-sm">{t(K.rule.line, { section: v.section, what: sectionWhat(t, v.section), rate: v.rule.rate, threshold: formatINR(lim) })}</p>
            {v.nextRule && <p className="t-sm" data-next-rule>{t(K.rule.next, { date: formatDate(v.nextRule.effectiveFrom, lang), rate: v.nextRule.rate, threshold: formatINR(v.nextRule.threshold) })}</p>}
            <p className="t-xs t-muted">{t(K.rule.note)}</p>
          </div>
        </Card>
      </section>

      <section className="stack gap-2" data-quarters>
        <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.quarters.heading)}</h2><p className="t-sm">{t(K.quarters.body)}</p></div>
        <div className="grid-auto" style={{ '--min': '280px' } as React.CSSProperties}>
          {v.quarters.map((q) => (
            <Card key={q.quarter}>
              <div className="stack gap-1" data-quarter={q.quarter} data-cert={q.certificate}>
                <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}><strong className="t-sm">{t(K.quarter.label, { q: q.quarter, range: rangeText(q.from, q.to, lang) })}</strong><Badge tone={q.certificate === 'final' ? 'success' : q.certificate === 'provisional' ? 'warning' : 'neutral'}>{q.certificate === 'final' ? t(K.quarter.cert.final) : q.certificate === 'provisional' ? t(K.quarter.cert.provisional) : t(K.quarter.cert.none)}</Badge></div>
                <span className="t-sm">{t(K.quarter.gross, { amount: formatINR(q.gross) })} · {t(K.quarter.tds, { amount: formatINR(q.tds) })}</span>
                {q.certificate !== 'none' && <div><Button size="sm" variant={q.certificate === 'final' ? 'primary' : 'secondary'} icon={<DownloadSimple size={14} />} data-download-quarter={q.quarter} onClick={() => void getCert(v.fy, q.quarter)}>{q.certificate === 'final' ? t(K.quarter.download) : t(K.quarter.downloadProvisional)}</Button></div>}
              </div>
            </Card>
          ))}
          <Card><div className="stack gap-1" data-annual><strong className="t-sm">{t(K.annual.heading)}</strong><span className="t-sm">{t(K.quarter.gross, { amount: formatINR(v.gross) })} · {t(K.quarter.tds, { amount: formatINR(v.deducted) })}</span><div><Button size="sm" variant="secondary" icon={<DownloadSimple size={14} />} data-download-year onClick={() => void getCert(v.fy, 0)}>{t(K.annual.download)}</Button></div></div></Card>
        </div>
      </section>

      <section className="stack gap-2" data-deductions>
        <h2 className="t-md t-semibold">{t(K.deductions.heading)}</h2>
        {v.deductions.length === 0 ? <Card><p className="t-sm" data-deductions-none>{t(K.deductions.empty)}</p></Card> : (
          <div className="grid-auto" style={{ '--min': '300px' } as React.CSSProperties}>
            {v.deductions.map((d) => (
              <Card key={d.id}>
                <div className="stack gap-1" data-deduction={d.id}>
                  <strong className="t-sm">{t(K.deductions.line, { date: formatDate(d.date, lang), code: d.disbursementCode ?? d.code })}</strong>
                  <span className="t-sm">{t(K.deductions.detail, { gross: formatINR(d.grossAmount), rate: d.rate, amount: formatINR(d.amount) })}</span>
                  {d.higherRate && <span className="t-xs" data-higher style={{ color: 'var(--color-warning)' }}>{t(K.deductions.higher)}</span>}
                  {d.catchUp > 0 && <span className="t-xs t-muted">{t(K.deductions.catchUp, { amount: formatINR(d.catchUp) })}</span>}
                  {!d.confirmed && <span className="t-xs t-muted">{t(K.deductions.pending)}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
        <div><Button size="sm" variant="ghost" data-open-history onClick={() => s.goTo('/payout-history')}>{t(K.deductions.openHistory)}</Button></div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ Admin's aggregate */

type Form = { kind: 'deposit'; month: string; tds: number } | { kind: 'return'; q: 1 | 2 | 3 | 4 } | { kind: 'rate'; rule: TdsRuleView } | { kind: 'pan'; p: TdsProfileRow } | null;

function AdminView({ v, s, t }: { v: TdsAdminView; s: TdsStatementState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const [form, setForm] = useState<Form>(null);
  const exportCsv = async (q: 0 | 1 | 2 | 3 | 4) => {
    const rows = await s.exportRows(v.fy, q);
    const lines = [['deduction_id', 'date', 'partner_id', 'partner_name', 'pan', 'section', 'gross_payout_amount', 'applicable_section_rate', 'tds_deducted_amount', 'tds_period', 'disbursement_id'].join(',')];
    for (const r of rows) lines.push([r.code, r.date.slice(0, 10), r.partnerId, r.partnerName, r.pan, r.section, r.gross, r.rate, r.tds, `${fyLabel(v.fy)} Q${r.quarter}`, r.disbursement].map(csvCell).join(','));
    download(`aiec-tds-${v.fy}${q ? `-q${q}` : ''}.csv`, 'text/csv;charset=utf-8', `﻿${lines.join('\n')}`);
    toast.push(t(K.admin.export.done, { count: rows.length }));
  };
  const k = v.kpis;
  const kpi = (id: string, label: string, value: string) => <Card><div className="stack gap-1" data-kpi={id}><span className="t-xs t-muted">{label}</span><span className="num t-semibold" style={{ fontSize: 'var(--text-xl, 1.4rem)' }} data-value>{value}</span></div></Card>;
  return (
    <div className="stack gap-4">
      <YearChips fys={v.fys} current={v.fy} s={s} t={t} />
      <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties} data-kpis>
        {kpi('tds', t(K.admin.kpi.tds), formatINR(k.tds))}{kpi('gross', t(K.admin.kpi.gross), formatINR(k.gross))}{kpi('partners', t(K.admin.kpi.partners), String(k.partnersDeducted))}{kpi('below', t(K.admin.kpi.below), String(k.belowLimit))}{kpi('nopan', t(K.admin.kpi.noPan), String(k.withoutPan))}{kpi('deposited', t(K.admin.kpi.deposited), formatINR(k.deposited))}
      </div>
      <section className="stack gap-2" data-quarters>
        <div className="row between wrap" style={{ alignItems: 'center', gap: 'var(--space-2)' }}><h2 className="t-md t-semibold">{t(K.admin.quarters.heading)}</h2><Button size="sm" variant="secondary" icon={<DownloadSimple size={14} />} data-export onClick={() => void exportCsv(0)}>{t(K.admin.export.button)} · {t(K.admin.export.all)}</Button></div>
        <div className="grid-auto" style={{ '--min': '320px' } as React.CSSProperties}>{v.quarters.map((q) => <QuarterCard key={q.quarter} q={q} lang={lang} t={t} onDeposit={(month, tds) => setForm({ kind: 'deposit', month, tds })} onReturn={() => setForm({ kind: 'return', q: q.quarter })} onExport={() => void exportCsv(q.quarter)} />)}</div>
      </section>
      <Rates v={v} lang={lang} t={t} onSchedule={(rule) => setForm({ kind: 'rate', rule })} />
      <Profiles v={v} t={t} onPan={(p) => setForm({ kind: 'pan', p })} />
      <p className="t-xs t-muted" data-note-how>{t(K.admin.note.how)}</p>
      <p className="t-xs t-muted">{t(K.admin.note.supplier)}</p>
      <Forms form={form} close={() => setForm(null)} v={v} s={s} t={t} />
    </div>
  );
}

function QuarterCard({ q, lang, t, onDeposit, onReturn, onExport }: { q: TdsAdminQuarter; lang: string; t: T; onDeposit: (month: string, tds: number) => void; onReturn: () => void; onExport: () => void }) {
  return (
    <Card>
      <div className="stack gap-2" data-quarter={q.quarter}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}><strong className="t-sm">{t(K.quarter.label, { q: q.quarter, range: rangeText(q.from, q.to, lang) })}</strong>{q.returnFiledAt ? <Badge tone="success">{t(K.quarter.cert.final)}</Badge> : null}</div>
        {q.deductions === 0 ? <p className="t-sm t-muted" data-quarter-empty>{t(K.admin.quarter.empty)}</p> : (
          <>
            <span className="t-xs">{t(K.admin.quarter.line, { deductions: q.deductions, partners: q.partners })}</span>
            <span className="t-sm">{t(K.admin.quarter.totals, { gross: formatINR(q.gross), tds: formatINR(q.tds), deposited: formatINR(q.deposited) })}</span>
            {q.months.map((m) => (
              <div key={m.month} className="stack gap-1" data-month={m.month} style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>
                <span className="t-sm">{t(K.admin.month.line, { month: monthText(m.month, lang), tds: formatINR(m.tds), due: formatDate(m.due, lang) })}</span>
                {m.deposits.map((d) => <span key={d.id} className="t-xs" data-deposit>{t(K.admin.month.deposited, { amount: formatINR(d.amount), bsr: d.bsr, serial: d.serial, date: formatDate(d.date, lang) })}</span>)}
                {m.deposited < m.tds && <><span className="t-xs" data-undeposited style={{ color: 'var(--color-warning)' }}>{t(K.admin.month.open)}</span><div><Button size="sm" variant="secondary" data-deposit-open={m.month} onClick={() => onDeposit(m.month, m.tds)}>{t(K.admin.deposit.button)}</Button></div></>}
              </div>
            ))}
            <span className="t-xs" data-return-line>{q.returnAck ? t(K.admin.return.filed, { date: formatDate(q.returnFiledAt as string, lang), ack: q.returnAck }) : t(K.admin.return.due, { date: formatDate(q.returnDue, lang) })}</span>
            <span className="row gap-2 wrap"><Button size="sm" variant={q.returnAck ? 'ghost' : 'secondary'} data-return-open={q.quarter} onClick={onReturn}>{t(K.admin.return.button)}</Button><Button size="sm" variant="ghost" data-export-quarter={q.quarter} onClick={onExport}>{t(K.admin.export.button)}</Button></span>
          </>
        )}
      </div>
    </Card>
  );
}

function Rates({ v, lang, t, onSchedule }: { v: TdsAdminView; lang: string; t: T; onSchedule: (r: TdsRuleView) => void }) {
  return (
    <section className="stack gap-2" data-rates>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.admin.rates.heading)}</h2><p className="t-sm">{t(K.admin.rates.body)}</p></div>
      <div className="grid-auto" style={{ '--min': '300px' } as React.CSSProperties}>
        {v.rules.map((r) => (
          <Card key={r.section}>
            <div className="stack gap-1" data-rule={r.section}>
              <strong className="t-sm">{t(K.admin.rates.line, { section: r.section, what: sectionWhat(t, r.section), rate: r.current.rate, threshold: formatINR(r.current.threshold) })}</strong>
              <span className="t-xs t-muted">{t(K.admin.rates.role, { role: t(`tdsStatement.admin.role.${r.role}`) })}</span>
              {r.upcoming && <span className="t-sm" data-upcoming>{t(K.admin.rates.upcoming, { date: formatDate(r.upcoming.effectiveFrom, lang), rate: r.upcoming.rate, threshold: formatINR(r.upcoming.threshold), reason: r.upcoming.reason })}</span>}
              {r.history.length > 1 && <div className="stack gap-1"><span className="t-xs t-semibold">{t(K.admin.rates.history)}</span>{r.history.map((h) => <span key={h.version} className="t-xs t-muted">{t(K.admin.rates.version, { version: h.version, date: formatDate(h.effectiveFrom, lang), rate: h.rate, threshold: formatINR(h.threshold) })}</span>)}</div>}
              <div><Button size="sm" variant="secondary" data-schedule={r.section} onClick={() => onSchedule(r)}>{t(K.admin.rates.schedule)}</Button></div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Profiles({ v, t, onPan }: { v: TdsAdminView; t: T; onPan: (p: TdsProfileRow) => void }) {
  return (
    <section className="stack gap-2" data-profiles>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.admin.profiles.heading)}</h2><p className="t-sm">{t(K.admin.profiles.body)}</p></div>
      <div className="grid-auto" style={{ '--min': '280px' } as React.CSSProperties}>
        {v.profiles.map((p) => (
          <Card key={p.userId}>
            <div className="stack gap-1" data-profile={p.userId} data-pan-missing={p.higherRate ? '1' : '0'} style={p.higherRate ? { borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' } : undefined}>
              <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{p.name}</strong>
              <span className="t-xs t-muted">{t(`tdsStatement.admin.role.${p.role}`)} · {p.masked ?? t(K.admin.profiles.noPan)}</span>
              <span className="t-xs">{t(K.admin.profiles.row, { paid: formatINR(p.paid), tds: formatINR(p.deducted) })}</span>
              <div><Button size="sm" variant={p.higherRate ? 'primary' : 'ghost'} data-pan-open={p.userId} onClick={() => onPan(p)}>{t(K.admin.profiles.add)}</Button></div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Forms({ form, close, v, s, t }: { form: Form; close: () => void; v: TdsAdminView; s: TdsStatementState; t: T }) {
  const toast = useToast();
  const { i18n } = useTranslation();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [d, setD] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forKey, setForKey] = useState<string | null>(null);
  const key = form ? `${form.kind}:${form.kind === 'deposit' ? form.month : form.kind === 'return' ? form.q : form.kind === 'rate' ? form.rule.section : form.p.userId}` : null;
  if (key !== forKey) {
    setForKey(key); setError(null);
    if (form?.kind === 'deposit') { setA(''); setB(''); setC(today()); setD(String(form.tds)); }
    else if (form?.kind === 'return') { setA(''); setC(today()); }
    else if (form?.kind === 'rate') { setA(String(form.rule.current.rate)); setB(String(form.rule.current.threshold)); setC(today()); setD(''); }
    else if (form?.kind === 'pan') { setA(''); }
  }
  const finish = async (p: Promise<TdsResult>, message: string) => { setBusy(true); setError(null); const r = await p; setBusy(false); if (!r.ok) { setError(problemText(t, r.problem)); return; } toast.push(message); close(); };
  void v;
  const title = !form ? '' : form.kind === 'deposit' ? t(K.admin.deposit.title, { month: monthText(form.month, i18n.language) }) : form.kind === 'return' ? t(K.admin.return.title, { q: form.q }) : form.kind === 'rate' ? t(K.admin.rates.title, { section: form.rule.section }) : t(K.admin.profiles.title, { name: form.p.name });
  return (
    <Sheet open={!!form} onClose={close} title={title} closeLabel={t(K.close)}>
      {form && (
        <div className="stack gap-3" data-form={form.kind}>
          {form.kind === 'deposit' && (
            <>
              <p className="t-sm">{t(K.admin.deposit.note, { tds: formatINR(form.tds) })}</p>
              <Field label={t(K.admin.deposit.bsr)}>{(p) => <Input id={p.id} inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} data-f="bsr" />}</Field>
              <Field label={t(K.admin.deposit.serial)}>{(p) => <Input id={p.id} inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} data-f="serial" />}</Field>
              <Field label={t(K.admin.deposit.date)}>{(p) => <Input id={p.id} type="date" value={c} onChange={(e) => setC(e.target.value)} data-f="date" />}</Field>
              <Field label={t(K.admin.deposit.amount)}>{(p) => <Input id={p.id} type="number" value={d} onChange={(e) => setD(e.target.value)} data-f="amount" />}</Field>
            </>
          )}
          {form.kind === 'return' && (
            <>
              <p className="t-sm">{t(K.admin.return.note)}</p>
              <Field label={t(K.admin.return.ack)}>{(p) => <Input id={p.id} value={a} onChange={(e) => setA(e.target.value)} data-f="ack" />}</Field>
              <Field label={t(K.admin.return.date)}>{(p) => <Input id={p.id} type="date" value={c} onChange={(e) => setC(e.target.value)} data-f="filed" />}</Field>
            </>
          )}
          {form.kind === 'rate' && (
            <>
              <div className="grid-auto" style={{ '--min': '160px' } as React.CSSProperties}>
                <Field label={t(K.admin.rates.rate)}>{(p) => <Input id={p.id} type="number" step="0.1" value={a} onChange={(e) => setA(e.target.value)} data-f="rate" />}</Field>
                <Field label={t(K.admin.rates.threshold)}>{(p) => <Input id={p.id} type="number" value={b} onChange={(e) => setB(e.target.value)} data-f="threshold" />}</Field>
                <Field label={t(K.admin.rates.effective)}>{(p) => <Input id={p.id} type="date" value={c} onChange={(e) => setC(e.target.value)} data-f="effective" />}</Field>
              </div>
              <Field label={t(K.admin.rates.reason)} hint={t(K.admin.rates.reasonHint)}>{(p) => <TextArea id={p.id} rows={2} value={d} onChange={(e) => setD(e.target.value)} data-f="reason" />}</Field>
            </>
          )}
          {form.kind === 'pan' && <Field label={t(K.admin.profiles.pan)} hint={t(K.admin.profiles.panHint)}>{(p) => <Input id={p.id} value={a} autoCapitalize="characters" onChange={(e) => setA(e.target.value.toUpperCase())} data-f="pan" />}</Field>}
          {error && <p className="t-sm" role="alert" data-error style={{ color: 'var(--color-error)' }}>{error}</p>}
          <Footer>
            <Button variant="ghost" onClick={close}>{t(K.cancel)}</Button>
            {form.kind === 'deposit' && <Button data-save disabled={busy} onClick={() => void finish(s.deposit(form.month, { bsr: a, serial: b, date: c, amount: Number(d) }), t(K.admin.deposit.saved))}>{t(K.admin.deposit.save)}</Button>}
            {form.kind === 'return' && <Button data-save disabled={busy} onClick={() => void finish(s.fileReturn(v.fy, form.q, { ack: a, filedAt: c }), t(K.admin.return.saved))}>{t(K.admin.return.save)}</Button>}
            {form.kind === 'rate' && <Button data-save disabled={busy} onClick={() => void finish(s.scheduleRate(form.rule.section, { rate: Number(a), threshold: Number(b), effectiveFrom: c, reason: d }), t(K.admin.rates.saved))}>{t(K.admin.rates.save)}</Button>}
            {form.kind === 'pan' && <Button data-save disabled={busy || a.trim().length < 10} onClick={() => void finish(s.recordPan(form.p.userId, a), t(K.admin.profiles.saved))}>{t(K.admin.profiles.save)}</Button>}
          </Footer>
        </div>
      )}
    </Sheet>
  );
}
