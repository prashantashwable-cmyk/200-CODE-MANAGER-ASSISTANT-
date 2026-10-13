import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowsClockwise, Coins, DownloadSimple, Question, Receipt, Scales } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
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
  TextArea,
  Toggle,
  formatDate,
  formatDateTime,
  formatINR,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { PaymentHistoryEntry } from '@/data/repository';
import { useSupplierPaymentHistory } from './useSupplierPaymentHistory';
import type { ActionResult, SupplierPaymentHistoryState } from './useSupplierPaymentHistory';
import { HISTORY_KEYS as K, PART_FILTERS } from './supplier-payment-history.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string) => void;

const LOCALE: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const INVOICE_TONE: Record<string, BadgeTone> = { matched: 'success', awaiting_delivery: 'warning', mismatch: 'error', rejected: 'neutral' };

const monthOf = (iso: string, lang: string) => new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { month: 'long', year: 'numeric' }).format(new Date(iso));
const signed = (n: number) => `${n < 0 ? '−' : '+'}${formatINR(Math.abs(n))}`;

/** A CSV cell, quoted so a comma or quote in a site name cannot shift the columns. */
const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

/**
 * Screen 115 — Supplier Payment History. The permanent ledger of what was actually paid, one row anatomy repeated for every
 * payment. Nothing is stored here that the payments do not already say: each entry is read from the payment and links back to
 * its order and its invoice match, and a later correction is a separate entry pointing at the original, never an edit of it.
 */
export function SupplierPaymentHistoryView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useSupplierPaymentHistory();
  const lang = i18n.language;

  const report: Report = (r, success) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success), 'success');
  };

  if (s.status === 'loading' && !s.page) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={6} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.page) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const pg = s.page;

  const exportCsv = async () => {
    const all = await s.fetchAll();
    if (all.length === 0) {
      toast.push(t(K.exportAction.none), 'warning');
      return;
    }
    const head = [K.csv.code, K.csv.date, ...(s.isAdmin ? [K.csv.supplier] : []), K.csv.order, K.csv.site, K.csv.type, K.csv.invoices, K.csv.paid, K.csv.adjustments, K.csv.net, K.csv.reference].map((k) => cell(t(k)));
    const rows = all.map((e) =>
      [e.code, e.paidAt.slice(0, 10), ...(s.isAdmin ? [e.supplierName] : []), e.poCode, e.siteName, t(K.part[e.part]), e.invoiceNumbers.join(' '), e.amount, e.adjustmentsTotal, e.netAmount, e.bankReference ?? ''].map(cell).join(','),
    );
    // A leading BOM keeps ₹-free Devanagari names readable when the file is opened in a spreadsheet.
    const blob = new Blob(['﻿' + [head.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.push(t(K.exportAction.done, { count: all.length }), 'success');
  };

  // Month groups over the rows loaded so far.
  const groups: { key: string; label: string; items: PaymentHistoryEntry[] }[] = [];
  for (const e of s.entries) {
    const key = e.paidAt.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(e);
    else groups.push({ key, label: monthOf(e.paidAt, lang), items: [e] });
  }

  return (
    <Screen width="default">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(s.isAdmin ? K.subtitle : K.subtitleSupplier)}
        action={
          <span className="row gap-2">
            {!s.isAdmin && <Button size="sm" variant="ghost" data-open-tds onClick={() => navigate('/tds-statement')}>{t('tdsStatement.link.open')}</Button>}
            {!s.isAdmin && <Button size="sm" variant="ghost" data-open-statements onClick={() => navigate('/payout-history')}>{t('payoutHistory.link.open')}</Button>}
            <Button size="sm" variant="secondary" disabled={s.exporting || pg.matched === 0} onClick={() => void exportCsv()}>
              <DownloadSimple size={14} aria-hidden="true" /> {t(K.exportAction.label)}
            </Button>
          </span>
        }
      />

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '104px' } as React.CSSProperties}>
        <StatTile label={t(K.totals.paid)} value={<span className="num">{formatINRCompact(pg.totals.gross)}</span>} caption={t(K.totals.count, { count: pg.matched }) + (s.isFiltered ? ` · ${t(K.totals.filtered)}` : '')} large />
        <StatTile label={t(K.totals.adjustments)} value={<span className="num">{pg.totals.adjustments === 0 ? '—' : signed(pg.totals.adjustments)}</span>} />
        <StatTile label={t(K.totals.net)} value={<span className="num">{formatINRCompact(pg.totals.net)}</span>} />
      </div>

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row wrap gap-2" style={{ alignItems: 'center' }}>
          <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.type)}>
            {PART_FILTERS.map((f) => (
              <Chip key={f} pressed={s.part === f} onClick={() => s.setPart(f)}>
                {t(K.filter[f])}
              </Chip>
            ))}
          </div>
          {s.isAdmin && pg.suppliers.length > 1 && (
            <Select aria-label={t(K.filter.supplier)} value={s.supplierId} onChange={(e) => s.setSupplierId(e.target.value)} style={{ width: 'auto', maxWidth: '100%' }}>
              <option value="">{t(K.filter.allSuppliers)}</option>
              {pg.suppliers.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </Select>
          )}
        </div>
        <div className="grid-2">
          <Field label={t(K.filter.from)}>{({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="date" value={s.from} onChange={(e) => s.setFrom(e.target.value)} />}</Field>
          <Field label={t(K.filter.to)}>{({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="date" value={s.to} invalid={s.badRange} onChange={(e) => s.setTo(e.target.value)} />}</Field>
        </div>
        {s.badRange && (
          <span className="t-xs t-error" role="alert">
            {t(K.filter.badRange)}
          </span>
        )}
      </div>

      {s.entries.length === 0 ? (
        s.isFiltered ? (
          <EmptyState icon={<Receipt size={28} />} title={t(K.list.emptyFilterTitle)} body={t(K.list.emptyFilterBody)} actionLabel={t(K.filter.clear)} onAction={s.clearFilters} />
        ) : (
          <EmptyState icon={<Coins size={32} />} title={t(K.list.emptyTitle)} body={t(K.list.emptyBody)} />
        )
      ) : (
        <div className="stack gap-3">
          {groups.map((g) => (
            <section key={g.key} className="stack gap-1" aria-label={g.label}>
              <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
                <h2 className="t-sm t-semibold">{g.label}</h2>
                <span className="t-xs t-muted">{t(K.list.monthTotal, { amount: formatINR(g.items.reduce((n, e) => n + e.netAmount, 0)) })}</span>
              </div>
              <Card className="ds-card--flush">
                {g.items.map((e) => (
                  <LedgerRow key={e.id} e={e} s={s} t={t} lang={lang} />
                ))}
              </Card>
            </section>
          ))}
          <div className="stack gap-2" style={{ alignItems: 'center' }}>
            <span className="t-xs t-muted">{t(K.list.showing, { shown: s.entries.length, total: pg.matched })}</span>
            {pg.hasMore && (
              <Button variant="secondary" disabled={s.loadingMore} onClick={() => void s.loadMore()}>
                {t(K.list.more, { count: Math.min(20, pg.matched - s.entries.length) })}
              </Button>
            )}
          </div>
        </div>
      )}

      <DetailSheet s={s} t={t} lang={lang} />
      <AdjustSheet s={s} t={t} report={report} />
      <QuerySheet s={s} t={t} report={report} />
      <DisputeSheet s={s} t={t} report={report} />
      <ContestSheet s={s} t={t} report={report} />
    </Screen>
  );
}

/* ------------------------------------------------------------------- row */

function LedgerRow({ e, s, t, lang }: { e: PaymentHistoryEntry; s: SupplierPaymentHistoryState; t: T; lang: string }) {
  return (
    <button type="button" className="ds-listrow" onClick={() => s.openPayment(e.id)} style={{ width: '100%', textAlign: 'start' }}>
      <span className="ds-listrow__lead" aria-hidden="true" style={{ display: 'grid', placeItems: 'center' }}>
        <Coins size={20} />
      </span>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <strong className="t-sm">{s.isAdmin ? e.supplierName : e.poCode}</strong>
          {e.adjustmentCount > 0 && <Badge tone="accent">{t(K.list.adjusted)}</Badge>}
          {e.queried && (
            <Badge tone="warning">
              <Question size={12} aria-hidden="true" /> {t(K.list.queried)}
            </Badge>
          )}
        </span>
        <span className="t-xs t-muted">{[s.isAdmin ? e.poCode : null, t(K.part[e.part]), e.siteName].filter(Boolean).join(' · ')}</span>
        <span className="t-xs t-muted">
          {t(K.list.paidOn, { date: formatDate(e.paidAt, lang) })}
          {e.invoiceNumbers.length > 0 ? ` · ${e.invoiceNumbers.join(', ')}` : ` · ${t(K.list.unknownInvoice)}`}
        </span>
      </span>
      <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <strong className="num">{formatINR(e.netAmount)}</strong>
        {e.adjustmentsTotal !== 0 ? <span className="t-xs t-muted num">{t(K.detail.original, { amount: formatINR(e.amount) })}</span> : <Badge tone="success">{t(K.list.paid)}</Badge>}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------- detail */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
      <dt className="t-muted">{label}</dt>
      <dd style={{ textAlign: 'end', margin: 0, minWidth: 0, overflowWrap: 'anywhere' }}>{value}</dd>
    </div>
  );
}

function DetailSheet({ s, t, lang }: { s: SupplierPaymentHistoryState; t: T; lang: string }) {
  const navigate = useNavigate();
  const d = s.detail;
  const open = !!s.paymentParam;
  return (
    <Sheet open={open} onClose={s.closePayment} title={d ? t(K.detail.title, { code: d.code }) : t(K.title)} closeLabel={t(K.action.close)}>
      {!d ? (
        s.detailMissing ? (
          <EmptyState icon={<Receipt size={28} />} title={t(K.detail.notFound)} body={t(K.detail.notFoundBody)} />
        ) : (
          <LoadingState label={t(K.loading)} variant="list" rows={3} />
        )
      ) : (
        <div className="stack gap-3">
          <div className="stack gap-1">
            <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
              <strong className="num" style={{ fontSize: '1.5rem' }}>
                {formatINR(d.netAmount)}
              </strong>
              <Badge tone="success">{t(K.list.paid)}</Badge>
            </div>
            {d.adjustmentCount > 0 && (
              <span className="t-xs t-muted num">
                {t(K.detail.paidAmount, { amount: formatINR(d.amount) })} · {signed(d.adjustmentsTotal)} · {t(K.detail.nowStands, { amount: formatINR(d.netAmount) })}
              </span>
            )}
          </div>

          <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
            {s.isAdmin && <Row label={t(K.detail.supplier)} value={d.supplierName} />}
            <Row label={t(K.detail.order)} value={`${d.poCode} · ${t(K.part[d.part])}`} />
            {d.siteName && <Row label={t(K.detail.site)} value={d.siteName} />}
            <Row label={t(K.detail.paidOn)} value={formatDateTime(d.paidAt, lang)} />
            {d.bankReference && <Row label={t(K.detail.reference)} value={d.bankReference} />}
            {d.approvedByName && <Row label={t(K.detail.approvedBy)} value={d.approvedByName} />}
          </dl>

          <section className="stack gap-2" aria-labelledby="basis-h">
            <div className="stack">
              <h3 id="basis-h" className="t-sm t-semibold">
                {t(K.detail.basisHeading)}
              </h3>
              <span className="t-xs t-muted">{t(K.detail.basisHint)}</span>
            </div>
            <Card>
              {d.basis.termType === null ? (
                <span className="t-sm">{t(K.detail.noTerms)}</span>
              ) : (
                <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
                  <Row label={t(K.detail.basisOrder)} value={formatINR(d.basis.poTotal)} />
                  <Row label={t(d.basis.custom ? K.detail.basisTermsCustom : K.detail.basisTerms)} value={t(K.detail.termType[d.basis.termType])} />
                  {d.basis.pct !== null && <Row label={t(K.detail.basisShare)} value={`${d.basis.pct}%`} />}
                  {d.basis.termType === 'net' && d.basis.netDays !== null && d.part === 'balance' && <Row label={t(K.detail.basisNet)} value={String(d.basis.netDays)} />}
                  <Row label={t(K.detail.basisPaid)} value={formatINR(d.amount)} />
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    <Badge tone={d.basis.reconciles ? 'success' : 'warning'}>{d.basis.reconciles ? t(K.detail.agrees) : t(K.detail.differs, { amount: signed(d.basis.difference) })}</Badge>
                  </div>
                </dl>
              )}
            </Card>
          </section>

          <section className="stack gap-2" aria-labelledby="inv-h">
            <h3 id="inv-h" className="t-sm t-semibold">
              {t(K.detail.invoicesHeading)}
            </h3>
            {d.invoices.length === 0 ? (
              <span className="t-sm t-muted">{t(K.detail.noInvoice)}</span>
            ) : (
              <Card className="ds-card--flush">
                {d.invoices.map((i) => (
                  <button key={i.id} type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={() => navigate(`/supplier-invoices?invoice=${i.id}`)}>
                    <span className="stack grow">
                      <strong className="t-sm">{i.number}</strong>
                      <span className="t-xs t-muted">{formatDate(i.date, lang)}</span>
                    </span>
                    <span className="stack" style={{ alignItems: 'flex-end' }}>
                      <span className="num t-sm">{formatINR(i.subtotal)}</span>
                      <Badge tone={INVOICE_TONE[i.status]}>{t(K.detail.invoiceStatus[i.status])}</Badge>
                    </span>
                  </button>
                ))}
              </Card>
            )}
          </section>

          <section className="stack gap-2" aria-labelledby="adj-h">
            <div className="stack">
              <h3 id="adj-h" className="t-sm t-semibold">
                {t(K.detail.adjustmentsHeading)}
              </h3>
              <span className="t-xs t-muted">{t(K.detail.adjustmentsHint)}</span>
            </div>
            {d.adjustments.length === 0 ? (
              <span className="t-sm t-muted">{t(K.detail.noAdjustments)}</span>
            ) : (
              <AscensionLine
                className="ds-ascension--multiline"
                steps={[
                  { id: 'orig', label: `${t(K.detail.original, { amount: formatINR(d.amount) })}`, meta: formatDateTime(d.paidAt, lang), status: 'complete' as const },
                  ...d.adjustments.map((a) => ({
                    id: a.id,
                    label: `${t(a.direction === 'credit' ? K.detail.credit : K.detail.topUp)} ${a.direction === 'credit' ? '−' : '+'}${formatINR(a.amount)}`,
                    meta: [formatDateTime(a.at, lang), t(K.detail.by, { name: a.byName }), a.reason].join(' · '),
                    status: 'complete' as const,
                  })),
                ]}
              />
            )}
          </section>

          {d.queries.length > 0 && (
            <section className="stack gap-1" aria-labelledby="q-h">
              <h3 id="q-h" className="t-sm t-semibold">
                {t(K.detail.queriesHeading)}
              </h3>
              {d.queries.map((q) => (
                <span key={q.id} className="t-xs">
                  {t(K.detail.queryBy, { name: q.byName, date: formatDateTime(q.at, lang) })} · {q.note}
                </span>
              ))}
            </section>
          )}

          {d.disputes.length > 0 && (
            <section className="stack gap-2" aria-labelledby="dsp-h">
              <h3 id="dsp-h" className="t-sm t-semibold">
                {t(K.detail.disputesHeading)}
              </h3>
              {d.disputes.map((x) => (
                <div key={x.id} className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
                  <span className="t-sm">
                    {x.code}
                    {x.round > 1 ? ` · ${t(K.detail.disputeRound, { count: x.round })}` : ''}
                  </span>
                  <span className="row gap-2" style={{ alignItems: 'center' }}>
                    <Badge tone={x.status === 'open' ? 'warning' : 'neutral'}>{x.status === 'open' ? t(K.detail.disputeOpen) : x.lastDecision ? t(K.detail.disputeDecision[x.lastDecision]) : t(K.detail.disputeDecided)}</Badge>
                    {d.canQuery && x.canReopen && (
                      <Button size="sm" variant="ghost" disabled={s.busy} onClick={() => s.openContest(x.id)}>
                        {t(K.action.contest)}
                      </Button>
                    )}
                  </span>
                </div>
              ))}
            </section>
          )}

          <section className="stack gap-1" aria-labelledby="ev-h">
            <h3 id="ev-h" className="t-sm t-semibold">
              {t(K.detail.evidenceHeading)}
            </h3>
            {d.evidence.map((e, i) => {
              const bits = [e.at ? formatDateTime(e.at, lang) : null, e.by, e.kind === 'net_elapsed' ? null : e.ref].filter(Boolean).join(' · ');
              return (
                <span key={`${e.kind}-${i}`} className="t-xs">
                  {t(K.evidence[e.kind])}
                  {bits ? ` · ${bits}` : ''}
                </span>
              );
            })}
          </section>

          <section className="stack gap-1" aria-labelledby="his-h">
            <h3 id="his-h" className="t-sm t-semibold">
              {t(K.detail.historyHeading)}
            </h3>
            {d.events.map((e) => (
              <span key={e.id} className="t-xs t-muted">
                {t(K.event[e.kind])} · {t(K.detail.by, { name: e.byName })} · {formatDateTime(e.at, lang)}
                {e.note ? ` · ${e.note}` : ''}
              </span>
            ))}
          </section>

          {s.isAdmin && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/supplier-payment-release?po=${d.poId}`)}>
              {t(K.detail.release)}
            </Button>
          )}

          {(d.canAdjust || d.canQuery || d.canDispute) && (
            <ActionBar>
              {d.canAdjust && (
                <Button variant="secondary" disabled={s.busy} onClick={s.openAdjust}>
                  <ArrowsClockwise size={14} aria-hidden="true" /> {t(K.action.adjust)}
                </Button>
              )}
              {d.canQuery && (
                <Button variant="secondary" disabled={s.busy} onClick={s.openQuery}>
                  <Question size={14} aria-hidden="true" /> {t(K.action.query)}
                </Button>
              )}
              {d.canDispute && (
                <Button variant="secondary" disabled={s.busy} onClick={s.openDispute}>
                  <Scales size={14} aria-hidden="true" /> {t(K.action.dispute)}
                </Button>
              )}
            </ActionBar>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* ---------------------------------------------------------------- sheets */

function AdjustSheet({ s, t, report }: { s: SupplierPaymentHistoryState; t: T; report: Report }) {
  const d = s.detail;
  const n = Number(s.amount);
  const result = d && Number.isFinite(n) && n > 0 ? d.netAmount + (s.direction === 'credit' ? -n : n) : null;
  return (
    <Sheet open={s.adjustOpen && !!d} onClose={() => s.setAdjustOpen(false)} title={t(K.adjust.title)} closeLabel={t(K.action.close)}>
      {d && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.adjust.intro, { code: d.code, amount: formatINR(d.netAmount) })}</p>
          <div className="row gap-2" role="group" aria-label={t(K.adjust.direction)}>
            <Chip pressed={s.direction === 'credit'} onClick={() => s.setDirection('credit')}>
              {t(K.adjust.credit)}
            </Chip>
            <Chip pressed={s.direction === 'top_up'} onClick={() => s.setDirection('top_up')}>
              {t(K.adjust.topUp)}
            </Chip>
          </div>
          <Field label={t(K.adjust.amount)} hint={t(K.adjust.amountHint)} required>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} inputMode="decimal" value={s.amount} onChange={(e) => s.setAmount(e.target.value)} invalid={s.amount !== '' && !s.amountValid} />}
          </Field>
          <Field label={t(K.adjust.reason)} hint={t(K.adjust.reasonHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.reason} onChange={(e) => s.setReason(e.target.value)} />}
          </Field>
          {result !== null && s.amountValid && <span className="t-sm num">{t(K.adjust.result, { amount: formatINR(result) })}</span>}
          <Button disabled={s.busy || !s.amountValid || s.reason.trim().length < 8} onClick={async () => report(await s.confirmAdjust(), K.toast.adjusted)}>
            {t(K.adjust.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function QuerySheet({ s, t, report }: { s: SupplierPaymentHistoryState; t: T; report: Report }) {
  const d = s.detail;
  return (
    <Sheet open={s.queryOpen && !!d} onClose={() => s.setQueryOpen(false)} title={t(K.querySheet.title)} closeLabel={t(K.action.close)}>
      {d && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.querySheet.intro, { code: d.code, amount: formatINR(d.amount), order: d.poCode })}</p>
          <Field label={t(K.querySheet.note)} hint={t(K.querySheet.noteHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={s.note} onChange={(e) => s.setNote(e.target.value)} />}
          </Field>
          <Button disabled={s.busy || s.note.trim().length < 8} onClick={async () => report(await s.confirmQuery(), K.toast.queried)}>
            {t(K.querySheet.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function DisputeSheet({ s, t, report }: { s: SupplierPaymentHistoryState; t: T; report: Report }) {
  const d = s.detail;
  return (
    <Sheet open={s.disputeOpen && !!d} onClose={() => s.setDisputeOpen(false)} title={t(K.disputeSheet.title)} closeLabel={t(K.action.close)}>
      {d && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.disputeSheet.intro, { code: d.code, amount: formatINR(d.netAmount) })}</p>
          <Field label={t(K.disputeSheet.position)} hint={t(K.disputeSheet.positionHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={s.position} onChange={(e) => s.setPosition(e.target.value)} />}
          </Field>
          <Field label={t(K.disputeSheet.claimed)} hint={t(K.disputeSheet.claimedHint)} required>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} inputMode="decimal" value={s.claimed} onChange={(e) => s.setClaimed(e.target.value)} />}
          </Field>
          <Toggle checked={s.halt} onChange={s.setHalt} label={t(K.disputeSheet.halt)} description={t(K.disputeSheet.haltHint)} />
          <Button disabled={s.busy || !s.disputeValid} onClick={async () => report(await s.confirmDispute(), K.toast.disputed)}>
            {t(K.disputeSheet.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function ContestSheet({ s, t, report }: { s: SupplierPaymentHistoryState; t: T; report: Report }) {
  return (
    <Sheet open={!!s.contestId} onClose={() => s.setContestId(null)} title={t(K.contestSheet.title)} closeLabel={t(K.action.close)}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.contestSheet.intro)}</p>
        <Field label={t(K.contestSheet.reason)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.contestReason} onChange={(e) => s.setContestReason(e.target.value)} />}
        </Field>
        <Button disabled={s.busy || s.contestReason.trim().length < 8} onClick={async () => report(await s.confirmContest(), K.toast.contested)}>
          {t(K.contestSheet.confirm)}
        </Button>
      </div>
    </Sheet>
  );
}
