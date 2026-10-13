import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bank, DownloadSimple, Receipt, ShieldWarning, WarningOctagon } from '@phosphor-icons/react';
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
  Select,
  Sheet,
  StatTile,
  Tabs,
  TextArea,
  formatDate,
  formatDateTime,
  formatINR,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { GstDocument, GstSide, SupplierGstView } from '@/data/repository';
import type { SupplierRiskKind } from '@/features/tax/gst';
import { useTaxGstCompliance } from './useTaxGstCompliance';
import type { ActionResult, TaxGstComplianceState } from './useTaxGstCompliance';
import { DOC_FILTERS, GST_KEYS as K, GST_TABS, STANDINGS } from './tax-gst-compliance.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string) => void;

const LOCALE: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const RISK_TONE: Record<SupplierRiskKind, BadgeTone> = { ok: 'success', restricted: 'error', filing_late: 'warning', unverified: 'warning', no_gstin: 'error', invalid_gstin: 'error' };

const monthLabel = (period: string, lang: string) => new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { month: 'long', year: 'numeric' }).format(new Date(`${period}-01T12:00:00`));
const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const change = (cur: number, prev: number | null) => (prev === null || prev === 0 ? null : Math.round(((cur - prev) / Math.abs(prev)) * 100));

/**
 * Screen 116 — Tax / GST Compliance. A reconciliation and visibility view, not a filing tool: output GST from the customer
 * invoices actually issued, input credit from the supplier invoices actually matched, each at the rate written on the document
 * and split into CGST + SGST or IGST by the two GSTINs. A supplier whose standing is in doubt puts the credit on its invoices at
 * risk, including credit already handed to the accountant, and a month is handed over as a snapshot the accountant can be told has moved.
 */
export function TaxGstComplianceView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useTaxGstCompliance();
  const lang = i18n.language;

  const report: Report = (r, success) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success), 'success');
  };

  if (s.status === 'loading' && !s.view) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="stats" />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const v = s.view;
  const isOpenPeriod = v.period >= new Date().toISOString().slice(0, 7);
  const empty = v.documents.length === 0;

  const exportCsv = () => {
    const rows: string[] = [];
    rows.push([t(K.csv.period), v.period].map(cell).join(','), [t(K.csv.aiecGstin), v.aiecGstin].map(cell).join(','), '');
    rows.push([t(K.csv.summary), t(K.reconcile.taxable), t(K.reconcile.cgst), t(K.reconcile.sgst), t(K.reconcile.igst), t(K.reconcile.total)].map(cell).join(','));
    const side = (label: string, x: GstSide) => rows.push([label, x.taxable, x.split.cgst, x.split.sgst, x.split.igst, x.gst].map(cell).join(','));
    side(t(K.reconcile.output), v.output);
    side(t(K.reconcile.input), v.input);
    rows.push([t(K.reconcile.claimable), '', '', '', '', v.input.claimable].map(cell).join(','), [t(K.reconcile.pending), '', '', '', '', v.input.pendingMatch].map(cell).join(','), [t(K.reconcile.atRisk), '', '', '', '', v.input.atRisk].map(cell).join(','), [t(K.reconcile.net), '', '', '', '', v.net].map(cell).join(','), '');
    rows.push([t(K.csv.side), t(K.csv.code), t(K.csv.party), t(K.csv.reference), t(K.csv.date), t(K.csv.rate), t(K.csv.taxable), t(K.csv.cgst), t(K.csv.sgst), t(K.csv.igst), t(K.csv.total), t(K.csv.credit)].map(cell).join(','));
    for (const d of v.documents) {
      const sign = d.isCreditNote ? -1 : 1;
      rows.push([t(d.side === 'output' ? K.docs.outputTag : K.docs.inputTag) + (d.isCreditNote ? ` · ${t(K.docs.creditNote)}` : ''), d.code, d.party, d.ref, d.date.slice(0, 10), d.ratePct, sign * d.taxable, sign * d.split.cgst, sign * d.split.sgst, sign * d.split.igst, sign * d.gst, d.credit ? t(K.docs.credit[d.credit]) : ''].map(cell).join(','));
    }
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gst-${v.period}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.push(t(K.exportAction.done, { period: v.period }), 'success');
  };

  const netChange = change(v.net, v.previous?.net ?? null);
  const outChange = change(v.output.gst, v.previous?.outputGst ?? null);
  const inChange = change(v.input.claimable, v.previous?.claimable ?? null);
  const trend = (pct: number | null, goodWhenUp: boolean | null): { value: string; direction: 'up' | 'down'; tone: 'success' | 'error' | 'neutral' } | undefined =>
    pct === null ? undefined : { value: `${Math.abs(pct)}%`, direction: pct >= 0 ? 'up' : 'down', tone: pct === 0 || goodWhenUp === null ? 'neutral' : (pct > 0) === goodWhenUp ? 'success' : 'error' };

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button size="sm" variant="secondary" disabled={empty} onClick={exportCsv}>
            <DownloadSimple size={14} aria-hidden="true" /> {t(K.exportAction.label)}
          </Button>
        }
      />

      <div className="row between gap-2 wrap mb-3" style={{ alignItems: 'center' }}>
        <Select aria-label={t(K.period.label)} value={v.period} onChange={(e) => s.changePeriod(e.target.value)} style={{ width: 'auto', maxWidth: '100%' }}>
          {v.periods.map((p) => (
            <option key={p} value={p}>
              {monthLabel(p, lang)}
              {p >= new Date().toISOString().slice(0, 7) ? ` · ${t(K.period.current)}` : ''}
            </option>
          ))}
        </Select>
        <span className="t-xs t-muted">{t(K.reconcile.notFiled)}</span>
      </div>

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '150px' } as CSSProperties}>
        <Tappable onClick={() => s.goTo('reconcile')}>
          <StatTile
            label={t(v.net >= 0 ? K.kpi.net : K.kpi.netCredit)}
            value={<span className="num">{formatINRCompact(Math.abs(v.net))}</span>}
            delta={trend(netChange, null)}
            caption={netChange === null ? t(K.kpi.noTrend) : t(K.kpi.vsLast)}
            large
          />
        </Tappable>
        <Tappable onClick={() => s.goTo('documents', 'output')}>
          <StatTile label={t(K.kpi.output)} value={<span className="num">{formatINRCompact(v.output.gst)}</span>} delta={trend(outChange, null)} caption={outChange === null ? t(K.kpi.noTrend) : t(K.kpi.vsLast)} />
        </Tappable>
        <Tappable onClick={() => s.goTo('documents', 'input')}>
          <StatTile label={t(K.kpi.input)} value={<span className="num">{formatINRCompact(v.input.claimable)}</span>} delta={trend(inChange, true)} caption={inChange === null ? t(K.kpi.noTrend) : t(K.kpi.vsLast)} />
        </Tappable>
        <Tappable onClick={() => s.goTo('suppliers')}>
          <StatTile
            label={t(K.kpi.atRisk)}
            value={<span className={`num ${v.exposure.atRisk > 0 ? 't-error' : ''}`}>{formatINRCompact(v.exposure.atRisk)}</span>}
            caption={v.exposure.atRisk > 0 ? t(K.kpi.suppliersCount, { count: v.exposure.suppliersAffected }) : t(K.kpi.allClear)}
          />
        </Tappable>
        <Tappable onClick={() => s.goTo('documents', 'pending_match')}>
          <StatTile label={t(K.kpi.pending)} value={<span className="num">{formatINRCompact(v.input.pendingMatch)}</span>} />
        </Tappable>
        <Tappable onClick={() => s.goTo('suppliers')}>
          <StatTile label={t(K.kpi.toCheck)} value={<span className="num">{v.exposure.suppliersToCheck}</span>} caption={t(K.kpi.suppliersCount, { count: v.exposure.suppliersToCheck })} />
        </Tappable>
      </div>

      {v.exposure.atRisk > 0 && (
        <Card className="mb-3">
          <div className="row gap-2" role="alert" style={{ alignItems: 'flex-start' }}>
            <WarningOctagon size={20} aria-hidden="true" className="shrink-0" />
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.risk.banner, { amount: formatINR(v.exposure.atRisk), count: v.exposure.suppliersAffected })}</strong>
              {v.exposure.alreadyHandedOver > 0 && <span className="t-sm t-error">{t(K.risk.claimed, { amount: formatINR(v.exposure.alreadyHandedOver) })}</span>}
              <span className="t-xs t-muted">{t(K.risk.tell)}</span>
              <div>
                <Button size="sm" variant="secondary" onClick={() => s.goTo('suppliers')}>
                  {t(K.risk.see)}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Handover s={s} t={t} lang={lang} isOpenPeriod={isOpenPeriod} />

      <Tabs label={t(K.tabs.label)} value={s.tab} onChange={(id) => s.setTab(id as typeof s.tab)} items={GST_TABS.map((x) => ({ id: x, label: t(K.tabs[x]) }))} />

      <div className="mt-3">
        {s.tab === 'reconcile' && (empty ? <EmptyState icon={<Receipt size={32} />} title={t(K.empty.title)} body={t(K.empty.body)} /> : <Reconcile s={s} t={t} />)}
        {s.tab === 'suppliers' && <Suppliers s={s} t={t} lang={lang} />}
        {s.tab === 'documents' && <Documents s={s} t={t} lang={lang} />}
      </div>

      <SupplierSheet s={s} t={t} lang={lang} report={report} />
      <HandoverSheet s={s} t={t} report={report} />
    </Screen>
  );
}

function Tappable({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'none', border: 0, padding: 0, textAlign: 'start', cursor: 'pointer', width: '100%', height: '100%', display: 'block' }}>
      <Card style={{ height: '100%' }}>{children}</Card>
    </button>
  );
}

/* --------------------------------------------------------------- handover */

function Handover({ s, t, lang, isOpenPeriod }: { s: TaxGstComplianceState; t: T; lang: string; isOpenPeriod: boolean }) {
  const v = s.view!;
  const h = v.handover;
  if (!h && v.documents.length === 0) return null;
  return (
    <Card className="mb-3">
      <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
        <div className="row gap-2" style={{ alignItems: 'center', minWidth: 0 }}>
          <Bank size={20} aria-hidden="true" />
          <div className="stack">
            <strong className="t-sm">{t(K.handover.heading)}</strong>
            <span className="t-xs t-muted">{h ? t(K.handover.done, { date: formatDateTime(h.at, lang), name: h.byName }) : isOpenPeriod ? t(K.handover.openPeriod) : t(K.handover.open)}</span>
          </div>
        </div>
        {!h && !isOpenPeriod && (
          <Button size="sm" onClick={s.openHandover} disabled={s.busy}>
            {t(K.handover.action)}
          </Button>
        )}
      </div>
      {h?.changed && (
        <div className="stack gap-1 mt-2" role="note">
          <Badge tone="warning">
            <ShieldWarning size={12} aria-hidden="true" /> {t(K.handover.changed)}
          </Badge>
          <span className="t-xs">
            {t(K.handover.changedBody, { output: signedINR(h.outputDelta), input: signedINR(h.inputDelta) })}
          </span>
        </div>
      )}
    </Card>
  );
}

const signedINR = (n: number) => (n === 0 ? formatINR(0) : `${n < 0 ? '−' : '+'}${formatINR(Math.abs(n))}`);

/* ------------------------------------------------------------ reconcile */

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'error' | 'success' }) {
  return (
    <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
      <dt className={strong ? 't-sm t-semibold' : 't-sm t-muted'}>{label}</dt>
      <dd className={`num ${strong ? 't-semibold' : ''} ${tone === 'error' ? 't-error' : tone === 'success' ? 't-success' : ''}`} style={{ margin: 0 }}>
        {value}
      </dd>
    </div>
  );
}

function SideCard({ title, hint, side, t, children }: { title: string; hint: string; side: GstSide; t: T; children?: ReactNode }) {
  return (
    <Card>
      <div className="stack gap-2">
        <div className="stack">
          <h2 className="t-md t-semibold">{title}</h2>
          <span className="t-xs t-muted">{hint}</span>
        </div>
        <dl className="stack gap-1" style={{ margin: 0 }}>
          <Line label={t(K.reconcile.taxable)} value={formatINR(side.taxable)} />
          <Line label={t(K.reconcile.cgst)} value={formatINR(side.split.cgst)} />
          <Line label={t(K.reconcile.sgst)} value={formatINR(side.split.sgst)} />
          <Line label={t(K.reconcile.igst)} value={formatINR(side.split.igst)} />
          <Line label={t(K.reconcile.total)} value={formatINR(side.gst)} strong />
          {children}
        </dl>
        {side.byRate.length > 0 && (
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.reconcile.byRate)}</span>
            {side.byRate.map((b) => (
              <div key={b.ratePct} className="row between gap-2 t-xs">
                <span>{t(K.reconcile.rate, { rate: b.ratePct })}</span>
                <span className="num">
                  {formatINR(b.taxable)} → {formatINR(b.gst)}
                </span>
              </div>
            ))}
            {side.byRate.length > 1 && <span className="t-xs t-muted">{t(K.reconcile.rateNote)}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

function Reconcile({ s, t }: { s: TaxGstComplianceState; t: T }) {
  const v = s.view!;
  return (
    <div className="stack gap-3">
      <div className="grid-auto" style={{ ['--min' as string]: '300px' } as CSSProperties}>
        <SideCard title={t(K.reconcile.output)} hint={t(K.reconcile.outputHint)} side={v.output} t={t}>
          {v.output.creditNotes > 0 && <Line label={t(K.reconcile.creditNotes)} value={`−${formatINR(v.output.creditNotes)}`} />}
        </SideCard>
        <SideCard title={t(K.reconcile.input)} hint={t(K.reconcile.inputHint)} side={v.input} t={t}>
          <Line label={t(K.reconcile.claimable)} value={formatINR(v.input.claimable)} tone="success" />
          <Line label={t(K.reconcile.pending)} value={formatINR(v.input.pendingMatch)} />
          <Line label={t(K.reconcile.atRisk)} value={formatINR(v.input.atRisk)} tone={v.input.atRisk > 0 ? 'error' : undefined} />
        </SideCard>
      </div>
      <Card>
        <dl className="stack gap-1" style={{ margin: 0 }}>
          <Line label={t(v.net >= 0 ? K.reconcile.net : K.reconcile.netCarry)} value={formatINR(Math.abs(v.net))} strong />
        </dl>
        <p className="t-xs t-muted mt-2">{t(K.reconcile.netHint)}</p>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------- suppliers */

function riskBadge(t: T, sv: SupplierGstView) {
  return <Badge tone={RISK_TONE[sv.risk]}>{t(K.suppliers.risk[sv.risk])}</Badge>;
}

function Suppliers({ s, t, lang }: { s: TaxGstComplianceState; t: T; lang: string }) {
  const list = s.view!.suppliers;
  if (list.length === 0) return <EmptyState icon={<Receipt size={28} />} title={t(K.suppliers.empty)} body="" />;
  return (
    <Card className="ds-card--flush">
      {list.map((sv) => (
        <button key={sv.supplierId} type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={() => s.openSupplier(sv.supplierId)}>
          <span className="stack grow" style={{ minWidth: 0 }}>
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
              <strong className="t-sm">{sv.name}</strong>
              {riskBadge(t, sv)}
              {sv.stale && sv.risk !== 'unverified' && <Badge tone="warning">{t(K.suppliers.checkDue)}</Badge>}
            </span>
            <span className="t-xs t-muted">{sv.gstin ?? t(K.suppliers.noGstin)}</span>
            <span className="t-xs t-muted">
              {sv.current ? `${t(K.suppliers.lastReturn, { period: sv.current.lastReturnPeriod ? monthLabel(sv.current.lastReturnPeriod, lang) : t(K.suppliers.neverFiled) })} · ${t(K.suppliers.checked, { date: formatDate(sv.current.checkedAt, lang) })}` : t(K.suppliers.neverChecked)}
            </span>
            {sv.atRisk > 0 && (
              <span className="t-xs t-error">
                {t(K.suppliers.atRisk, { amount: formatINR(sv.atRisk) })}
                {sv.alreadyHandedOver > 0 ? ` · ${t(K.suppliers.claimedAlready, { amount: formatINR(sv.alreadyHandedOver) })}` : ''}
              </span>
            )}
          </span>
          <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <span className="num t-sm">{formatINR(sv.inputThisPeriod)}</span>
            <span className="t-xs t-muted">{t(K.suppliers.inputPeriod)}</span>
          </span>
        </button>
      ))}
    </Card>
  );
}

/* -------------------------------------------------------------- documents */

function Documents({ s, t, lang }: { s: TaxGstComplianceState; t: T; lang: string }) {
  const navigate = useNavigate();
  return (
    <div className="stack gap-2">
      <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.docs.filter.label)}>
        {DOC_FILTERS.map((f) => (
          <Chip key={f} pressed={s.docFilter === f} onClick={() => s.setDocFilter(f)}>
            {t(K.docs.filter[f])} · {s.docCounts[f]}
          </Chip>
        ))}
      </div>
      {s.documents.length === 0 ? (
        <EmptyState icon={<Receipt size={28} />} title={t(s.docCounts.all === 0 ? K.docs.empty : K.docs.emptyFilter)} body="" />
      ) : (
        <Card className="ds-card--flush">
          {s.documents.map((d) => (
            <DocRow key={d.id} d={d} t={t} lang={lang} onOpen={() => d.route && navigate(d.route)} />
          ))}
        </Card>
      )}
    </div>
  );
}

function DocRow({ d, t, lang, onOpen }: { d: GstDocument; t: T; lang: string; onOpen: () => void }) {
  return (
    <button type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={onOpen}>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <strong className="t-sm">{d.code}</strong>
          <Badge tone={d.side === 'output' ? 'accent' : 'emerald'}>{t(d.side === 'output' ? K.docs.outputTag : K.docs.inputTag)}</Badge>
          {d.isCreditNote && <Badge tone="neutral">{t(K.docs.creditNote)}</Badge>}
          {d.credit && <Badge tone={d.credit === 'claimable' ? 'success' : d.credit === 'at_risk' ? 'error' : 'warning'}>{t(K.docs.credit[d.credit])}</Badge>}
        </span>
        <span className="t-xs t-muted">{[d.party, d.ref].filter(Boolean).join(' · ')}</span>
        <span className="t-xs t-muted">
          {formatDate(d.date, lang)} · {t(K.docs.rateOf, { rate: d.ratePct })} · {t(d.supply === 'intra' ? K.docs.intra : K.docs.inter)}
        </span>
      </span>
      <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <strong className="num">
          {d.isCreditNote ? '−' : ''}
          {formatINR(d.gst)}
        </strong>
        <span className="t-xs t-muted num">{formatINR(d.taxable)}</span>
      </span>
    </button>
  );
}

/* ----------------------------------------------------------------- sheets */

function SupplierSheet({ s, t, lang, report }: { s: TaxGstComplianceState; t: T; lang: string; report: Report }) {
  const sv = s.supplier;
  const periods = s.view?.periods ?? [];
  return (
    <Sheet open={!!s.supplierId} onClose={s.closeSupplier} title={sv ? sv.name : t(K.tabs.suppliers)} closeLabel={t(K.action.close)}>
      {sv && (
        <div className="stack gap-3">
          <div className="stack gap-1">
            <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
              {riskBadge(t, sv)}
              {sv.stale && sv.risk !== 'unverified' && <Badge tone="warning">{t(K.suppliers.checkDue)}</Badge>}
            </div>
            <p className="t-sm" role="note">
              {t(K.suppliers.riskBody[sv.risk], { since: sv.riskSince ? formatDate(sv.riskSince, lang) : '' })}
            </p>
            <span className="t-xs t-muted num">{sv.gstin ?? t(K.suppliers.noGstin)}</span>
            {sv.atRisk > 0 && (
              <span className="t-sm t-error">
                {t(K.suppliers.atRisk, { amount: formatINR(sv.atRisk) })}
                {sv.alreadyHandedOver > 0 ? ` · ${t(K.suppliers.claimedAlready, { amount: formatINR(sv.alreadyHandedOver) })}` : ''}
              </span>
            )}
          </div>

          {!s.checking && sv.gstin && (
            <Button variant="secondary" onClick={s.startCheck}>
              {t(K.suppliers.record)}
            </Button>
          )}

          {s.checking && (
            <div className="stack gap-3">
              <p className="t-sm t-muted">{t(K.check.intro)}</p>
              <div className="row gap-2 wrap" role="group" aria-label={t(K.check.standing)}>
                {STANDINGS.map((x) => (
                  <Chip key={x} pressed={s.standing === x} onClick={() => s.setStanding(x)}>
                    {t(K.suppliers.standing[x])}
                  </Chip>
                ))}
              </div>
              <Field label={t(K.check.lastReturn)} hint={t(K.check.lastReturnHint)}>
                {({ id, describedBy }) => (
                  <Select id={id} aria-describedby={describedBy} value={s.lastReturn} onChange={(e) => s.setLastReturn(e.target.value)}>
                    <option value="">{t(K.check.never)}</option>
                    {[...new Set([...periods, ...(s.lastReturn ? [s.lastReturn] : [])])].sort().reverse().map((p) => (
                      <option key={p} value={p}>
                        {monthLabel(p, lang)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {s.standing !== 'active' && (
                <Field label={t(K.check.effectiveFrom)} hint={t(K.check.effectiveHint)} required>
                  {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="date" value={s.effectiveFrom} max={new Date().toISOString().slice(0, 10)} onChange={(e) => s.setEffectiveFrom(e.target.value)} />}
                </Field>
              )}
              <Field label={t(K.check.note)}>{({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={s.note} onChange={(e) => s.setNote(e.target.value)} />}</Field>
              <Button disabled={s.busy || !s.checkValid} onClick={async () => report(await s.confirmCheck(), K.toast.checked)}>
                {t(K.check.confirm)}
              </Button>
            </div>
          )}

          <section className="stack gap-1" aria-labelledby="gh-h">
            <h3 id="gh-h" className="t-sm t-semibold">
              {t(K.suppliers.history)}
            </h3>
            {sv.history.length === 0 ? (
              <span className="t-sm t-muted">{t(K.suppliers.neverChecked)}</span>
            ) : (
              sv.history.map((c) => (
                <div key={c.id} className="stack">
                  <span className="t-sm">
                    <strong>{t(K.suppliers.standing[c.standing])}</strong> · {t(K.suppliers.lastReturn, { period: c.lastReturnPeriod ? monthLabel(c.lastReturnPeriod, lang) : t(K.suppliers.neverFiled) })}
                    {c.effectiveFrom ? ` · ${t(K.suppliers.effective, { date: formatDate(c.effectiveFrom, lang) })}` : ''}
                  </span>
                  <span className="t-xs t-muted">
                    {formatDateTime(c.checkedAt, lang)} · {t(K.suppliers.by, { name: c.checkedByName })}
                    {c.note ? ` · ${c.note}` : ''}
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </Sheet>
  );
}

function HandoverSheet({ s, t, report }: { s: TaxGstComplianceState; t: T; report: Report }) {
  const v = s.view;
  return (
    <Sheet open={s.handoverOpen && !!v} onClose={() => s.setHandoverOpen(false)} title={t(K.handover.sheetTitle)} closeLabel={t(K.action.close)}>
      {v && (
        <div className="stack gap-3">
          <p className="t-sm">
            {t(K.handover.intro, { period: v.period, output: formatINR(v.output.gst), input: formatINR(v.input.claimable), atRisk: formatINR(v.input.atRisk) })}
          </p>
          <p className="t-xs t-muted">{t(K.handover.notFiling)}</p>
          <Field label={t(K.handover.note)} hint={t(K.handover.noteHint)}>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.handoverNote} onChange={(e) => s.setHandoverNote(e.target.value)} />}
          </Field>
          <Button disabled={s.busy} onClick={async () => report(await s.confirmHandover(), K.toast.handed)}>
            {t(K.handover.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
