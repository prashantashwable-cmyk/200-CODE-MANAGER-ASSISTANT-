import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, FileText, Lock, LockOpen, Plus, Receipt, WarningOctagon, X } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
  Badge,
  Button,
  Card,
  Checkbox,
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
  formatDate,
  formatDateTime,
  formatINR,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import type { SupplierInvoiceLineView, SupplierInvoiceView, WaitingForInvoice } from '@/data/repository';
import type { InvoiceMatchStatus, LineVerdict } from '@/features/suppliers/invoiceMatch';
import { useSupplierInvoiceMatching } from './useSupplierInvoiceMatching';
import type { ActionResult, SupplierInvoiceMatchingState } from './useSupplierInvoiceMatching';
import { INVOICE_FILTERS, MATCHING_KEYS as K } from './supplier-invoice-matching.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string, params?: Record<string, unknown>) => void;

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATUS_TONE: Record<InvoiceMatchStatus, BadgeTone> = { matched: 'success', awaiting_delivery: 'warning', mismatch: 'error', rejected: 'neutral' };
const VERDICT_TONE: Record<LineVerdict, BadgeTone> = { matched: 'success', partial: 'success', adjusted: 'accent', awaiting_delivery: 'warning', mismatch: 'error' };
const three: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-2)' };

/**
 * Screen 113 — Supplier Invoice Matching. Three documents, side by side: what the order says (its own recorded price
 * and quantity), what the supplier invoiced, and what the delivery checks accepted on site. None is ever re-typed:
 * the order and the delivery are read live, so an invoice can only ever be compared with the records themselves.
 * A clean match unlocks the balance payment in 111; anything else waits here and is chased, never passed through.
 */
export function SupplierInvoiceMatchingView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useSupplierInvoiceMatching();

  const report: Report = (r, success, params) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success, params), 'success');
  };

  if (s.status === 'loading' && !s.board) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.board) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const lang = i18n.language;

  if (s.invoiceParam) {
    return (
      <Screen width="narrow" className="pb-action-bar">
        <Detail s={s} t={t} lang={lang} report={report} />
        <SheetsFor s={s} t={t} lang={lang} report={report} />
      </Screen>
    );
  }

  const b = s.board;
  const showingWaiting = s.filter === 'missing';

  return (
    <Screen width="default">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(s.isAdmin ? K.subtitle : K.subtitleSupplier)}
        action={
          b.submittable.length > 0 ? (
            <Button size="sm" onClick={() => s.openForm()}>
              <Plus size={14} aria-hidden="true" /> {t(s.isAdmin ? K.action.submitFor : K.action.submit)}
            </Button>
          ) : undefined
        }
      />

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '104px' } as CSSProperties}>
        <StatTile label={t(K.totals.attention)} value={s.counts.attention} caption={t(K.totals.count, { count: s.counts.attention })} large />
        <StatTile label={t(K.totals.missing)} value={s.counts.missing} caption={t(K.totals.count, { count: s.counts.missing })} />
        <StatTile label={t(K.totals.matched)} value={s.counts.matched} caption={t(K.totals.count, { count: s.counts.matched })} />
      </div>

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.label)}>
          {INVOICE_FILTERS.map((f) => (
            <Chip key={f} pressed={s.filter === f} onClick={() => s.setFilter(f)}>
              {t(K.filter[f])} · {s.counts[f]}
            </Chip>
          ))}
        </div>
        {s.poParam && (
          <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
            <span className="t-xs t-muted">{t(K.list.onlyOrder, { code: b.invoices.find((i) => i.poId === s.poParam)?.poCode ?? b.waiting.find((w) => w.poId === s.poParam)?.poCode ?? b.submittable.find((p) => p.poId === s.poParam)?.poCode ?? '' })}</span>
            <Button size="sm" variant="ghost" onClick={s.clearPo}>
              <X size={12} aria-hidden="true" /> {t(K.list.showAll)}
            </Button>
          </div>
        )}
      </div>

      {showingWaiting ? (
        s.shownWaiting.length === 0 ? (
          <Empty s={s} t={t} />
        ) : (
          <Card className="ds-card--flush">
            {s.shownWaiting.map((w) => (
              <WaitingRow key={w.poId} w={w} s={s} t={t} lang={lang} />
            ))}
          </Card>
        )
      ) : s.shown.length === 0 ? (
        <Empty s={s} t={t} />
      ) : (
        <Card className="ds-card--flush">
          {s.shown.map((inv) => (
            <InvoiceRow key={inv.id} inv={inv} s={s} t={t} lang={lang} />
          ))}
        </Card>
      )}

      <SheetsFor s={s} t={t} lang={lang} report={report} />
    </Screen>
  );
}

function SheetsFor({ s, t, lang, report }: { s: SupplierInvoiceMatchingState; t: T; lang: string; report: Report }) {
  return (
    <>
      <SubmitSheet s={s} t={t} report={report} />
      <AdjustSheet s={s} t={t} lang={lang} report={report} />
      <RejectSheet s={s} t={t} report={report} />
    </>
  );
}

function Empty({ s, t }: { s: SupplierInvoiceMatchingState; t: T }) {
  const total = s.filter === 'missing' ? s.counts.missing : s.counts[s.filter];
  if (s.query.trim() !== '' && total > 0) {
    return <EmptyState icon={<Receipt size={28} />} title={t(K.list.emptySearchTitle)} body={t(K.list.emptySearchBody)} actionLabel={t(K.list.clear)} onAction={() => s.setQuery('')} />;
  }
  const keys = {
    attention: ['emptyAttentionTitle', 'emptyAttentionBody'],
    missing: ['emptyMissingTitle', 'emptyMissingBody'],
    matched: ['emptyMatchedTitle', 'emptyMatchedBody'],
    rejected: ['emptyRejectedTitle', 'emptyRejectedBody'],
  } as const;
  const [title, body] = keys[s.filter];
  return <EmptyState icon={<CheckCircle size={32} />} title={t(K.list[title])} body={t(K.list[body])} />;
}

/* ------------------------------------------------------------------ rows */

function InvoiceRow({ inv, s, t, lang }: { inv: SupplierInvoiceView; s: SupplierInvoiceMatchingState; t: T; lang: string }) {
  return (
    <button type="button" className="ds-listrow" onClick={() => s.openInvoice(inv.id)} style={{ width: '100%', textAlign: 'start' }}>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <strong className="t-sm">{s.isAdmin ? inv.supplierName : inv.poCode}</strong>
          <Badge tone={STATUS_TONE[inv.status]}>{t(K.status[inv.status])}</Badge>
        </span>
        <span className="t-xs t-muted">{[inv.invoiceNumber, s.isAdmin ? inv.poCode : null, inv.siteName].filter(Boolean).join(' · ')}</span>
        <span className="t-xs t-muted">
          {t(K.list.submittedOn, { date: formatDate(inv.submittedAt, lang) })} · {t(K.list.itemCount, { count: inv.lines.length })}
        </span>
        {inv.status === 'mismatch' && (
          <span className="t-xs t-error row gap-1" style={{ alignItems: 'center' }}>
            <WarningOctagon size={12} aria-hidden="true" />
            {[...new Set(inv.lines.flatMap((l) => l.issues))].map((i) => t(K.issue[i])).join(' · ')}
          </span>
        )}
      </span>
      <strong style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatINR(inv.subtotal)}</strong>
    </button>
  );
}

function WaitingRow({ w, s, t, lang }: { w: WaitingForInvoice; s: SupplierInvoiceMatchingState; t: T; lang: string }) {
  const gate = w.gate === 'incomplete' ? 'incomplete' : 'no_invoice';
  return (
    <div className="ds-listrow" style={{ alignItems: 'flex-start' }}>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <strong className="t-sm">{s.isAdmin ? w.supplierName : w.poCode}</strong>
          <Badge tone="warning">
            <Clock size={12} aria-hidden="true" /> {t(K.gate[gate])}
          </Badge>
        </span>
        <span className="t-xs t-muted">{[s.isAdmin ? w.poCode : null, w.siteName].filter(Boolean).join(' · ')}</span>
        <span className="t-xs t-muted">{t(K.list.deliveredOn, { date: formatDate(w.deliveredAt, lang) })}</span>
        <span className="t-xs">{t(K.gateBody[gate])}</span>
      </span>
      <Button size="sm" variant="secondary" onClick={() => s.openForm(w.poId)}>
        {t(s.isAdmin ? K.list.enter : K.list.send)}
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- detail */

function Detail({ s, t, lang, report }: { s: SupplierInvoiceMatchingState; t: T; lang: string; report: Report }) {
  const navigate = useNavigate();
  const inv = s.current;
  if (!inv) {
    return (
      <>
        <ScreenHeader title={t(K.title)} back={s.closeInvoice} backLabel={t(K.detail.back)} />
        <EmptyState icon={<FileText size={32} />} title={t(K.list.notFound)} body={t(K.list.notFoundBody)} actionLabel={t(K.detail.back)} onAction={s.closeInvoice} />
      </>
    );
  }
  const billableNow = inv.lines.filter((l) => l.unlocked).reduce((n, l) => n + l.invoicedQty * l.invoicedPrice, 0);
  const canAct = s.isAdmin && inv.status !== 'rejected';
  const gateKey = inv.gate === 'ok' ? null : inv.gate;
  const canResubmit = inv.status === 'rejected' && !!s.board?.submittable.some((p) => p.poId === inv.poId);
  const canWithdraw = !s.isAdmin && inv.status === 'mismatch';
  return (
    <>
      <ScreenHeader title={inv.invoiceNumber} subtitle={inv.code} back={s.closeInvoice} backLabel={t(K.detail.back)} />

      <Card>
        <div className="stack gap-2">
          <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
            <strong style={{ fontSize: '1.5rem', fontVariantNumeric: 'tabular-nums' }}>{formatINR(inv.subtotal)}</strong>
            <Badge tone={STATUS_TONE[inv.status]}>{t(K.status[inv.status])}</Badge>
          </div>
          <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
            <Row label={t(K.detail.supplier)} value={inv.supplierName} />
            <Row label={t(K.detail.order)} value={inv.poCode} />
            {inv.siteName && <Row label={t(K.detail.site)} value={inv.siteName} />}
            <Row label={t(K.detail.date)} value={formatDate(inv.invoiceDate, lang)} />
            <Row label={t(K.detail.document)} value={inv.documentName ?? t(K.detail.noDocument)} />
            <Row label={t(K.detail.submittedBy)} value={inv.submittedByRole === 'admin' ? t(K.detail.onBehalf, { name: inv.submittedByName }) : inv.submittedByName} />
          </dl>
        </div>
      </Card>

      {inv.status === 'rejected' ? (
        <Card>
          <div className="stack gap-1" role="note">
            <Badge tone="neutral">{t(K.status.rejected)}</Badge>
            <span className="t-sm">{t(inv.withdrawn ? K.detail.withdrawnBy : K.detail.rejectedBy, { name: inv.rejectedByName ?? '', reason: inv.rejectedReason ?? '' })}</span>
          </div>
        </Card>
      ) : (
        <section className="stack gap-2 mt-3" aria-labelledby="gate-h">
          <h3 id="gate-h" className="t-sm t-semibold">
            {t(K.detail.gateHeading)}
          </h3>
          <Card>
            {gateKey ? (
              <div className="stack gap-1" role="note">
                <Badge tone={gateKey === 'mismatch' ? 'error' : 'warning'}>
                  <Lock size={12} aria-hidden="true" /> {t(K.gate[gateKey])}
                </Badge>
                <span className="t-sm">{t(K.gateBody[gateKey])}</span>
              </div>
            ) : (
              <div className="stack gap-1" role="note">
                <Badge tone="success">
                  <LockOpen size={12} aria-hidden="true" /> {t(K.detail.unlocked)}
                </Badge>
                <span className="t-sm">{t(K.detail.paymentOk, { amount: formatINR(billableNow) })}</span>
              </div>
            )}
          </Card>
        </section>
      )}

      <section className="stack gap-2 mt-3" aria-labelledby="match-h">
        <div className="stack gap-1">
          <h3 id="match-h" className="t-sm t-semibold">
            {t(K.detail.matchHeading)}
          </h3>
          <span className="t-xs t-muted">{t(K.detail.matchHint)}</span>
        </div>
        <div className="grid-auto" style={{ ['--min' as string]: '300px' } as CSSProperties}>
          {inv.lines.map((l) => (
            <LineCard key={l.index} l={l} inv={inv} s={s} t={t} lang={lang} canAct={canAct} />
          ))}
        </div>
      </section>

      <section className="stack gap-2 mt-3" aria-labelledby="hist-h">
        <h3 id="hist-h" className="t-sm t-semibold">
          {t(K.detail.historyHeading)}
        </h3>
        <AscensionLine
          steps={inv.events.map((e) => ({
            id: e.id,
            label: t(K.event[e.kind]),
            meta: [formatDateTime(e.at, lang), t(K.detail.by, { name: e.byName }), e.note].filter(Boolean).join(' · '),
            status: e.kind === 'mismatch_notified' || e.kind === 'rejected' ? ('blocked' as const) : ('complete' as const),
          }))}
          className="ds-ascension--multiline"
        />
      </section>

      {(canAct || canWithdraw || (!s.isAdmin && canResubmit)) && (
        <ActionBar>
          {canAct && inv.gate === 'ok' && <Button onClick={() => navigate('/supplier-payments')}>{t(K.detail.seePayments)}</Button>}
          {canAct && (
            <Button variant={inv.gate === 'ok' ? 'secondary' : 'primary'} disabled={s.busy} onClick={() => s.openReject(inv)}>
              {t(K.action.reject)}
            </Button>
          )}
          {canWithdraw && (
            <Button disabled={s.busy} onClick={() => s.openReject(inv)}>
              {t(K.action.withdraw)}
            </Button>
          )}
          {!s.isAdmin && canResubmit && <Button onClick={() => s.openForm(inv.poId)}>{t(K.action.resubmit)}</Button>}
        </ActionBar>
      )}
      {!s.isAdmin && inv.status === 'mismatch' && (
        <p className="t-sm mt-3" role="note">
          {t(K.detail.supplierNote)}
        </p>
      )}
    </>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
    <dt className="t-muted">{label}</dt>
    <dd style={{ textAlign: 'end', margin: 0, minWidth: 0, overflowWrap: 'anywhere' }}>{value}</dd>
  </div>
);

function Cell({ label, top, bottom, tone }: { label: string; top: string; bottom?: string; tone?: 'error' }) {
  return (
    <div className="stack" style={{ minWidth: 0 }}>
      <span className="t-xs t-muted">{label}</span>
      <strong className={`t-sm ${tone === 'error' ? 't-error' : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {top}
      </strong>
      {bottom && (
        <span className="t-xs t-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {bottom}
        </span>
      )}
    </div>
  );
}

/** One line of the three-way match. */
function LineCard({ l, inv, s, t, lang, canAct }: { l: SupplierInvoiceLineView; inv: SupplierInvoiceView; s: SupplierInvoiceMatchingState; t: T; lang: string; canAct: boolean }) {
  const priceWrong = l.priceCheck === 'fail';
  const qtyWrong = l.quantityCheck === 'fail';
  return (
    <Card>
      <div className="stack gap-2">
        <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
          <strong className="t-sm" style={{ minWidth: 0 }}>
            {l.description}
          </strong>
          <Badge tone={VERDICT_TONE[l.verdict]}>{t(K.verdict[l.verdict])}</Badge>
        </div>

        <div style={three} role="group" aria-label={t(K.detail.threeWay)}>
          {l.orderedQty === null ? (
            <Cell label={t(K.detail.ordered)} top={t(K.detail.notOnOrder)} tone="error" />
          ) : (
            <Cell label={t(K.detail.ordered)} top={t(K.detail.qtyOnly, { qty: l.orderedQty })} bottom={formatINR(l.orderedPrice ?? 0)} />
          )}
          <Cell label={t(K.detail.invoiced)} top={t(K.detail.qtyOnly, { qty: l.invoicedQty })} bottom={formatINR(l.invoicedPrice)} tone={priceWrong || qtyWrong ? 'error' : undefined} />
          <Cell label={t(K.detail.delivered)} top={t(K.detail.qtyOnly, { qty: l.deliveredQty })} tone={l.issues.includes('over_delivered') ? 'error' : undefined} />
        </div>

        {l.billedElsewhere > 0 && <span className="t-xs t-muted">{t(K.detail.billedElsewhere, { qty: l.billedElsewhere })}</span>}

        <div className="stack gap-1" role="list">
          <div className="row between gap-2 t-sm" role="listitem">
            <span className="t-muted">{t(K.detail.quantityCheck)}</span>
            <span className={qtyWrong ? 't-error' : l.quantityCheck === 'awaiting' ? 't-warning' : 't-success'}>{t(l.quantityCheck === 'ok' ? K.detail.qtyOk : l.quantityCheck === 'awaiting' ? K.detail.qtyAwaiting : K.detail.qtyFail)}</span>
          </div>
          <div className="row between gap-2 t-sm" role="listitem">
            <span className="t-muted">{t(K.detail.priceCheck)}</span>
            <span className={priceWrong ? 't-error' : 't-success'}>{t(l.priceCheck === 'ok' ? K.detail.priceOk : l.priceCheck === 'explained' ? K.detail.priceExplained : K.detail.priceFail)}</span>
          </div>
        </div>

        {l.issues.length > 0 && (
          <span className="t-xs t-error" role="note">
            {l.issues.map((i) => t(K.issue[i])).join(' · ')}
            {priceWrong && l.priceGap !== 0 ? ` · ${t(K.detail.priceGap, { gap: `${l.priceGap > 0 ? '+' : '−'}${formatINR(Math.abs(l.priceGap))}` })}` : ''}
          </span>
        )}
        {l.verdict === 'partial' && <span className="t-xs t-muted">{t(K.detail.partialNote)}</span>}

        {l.adjustment && (
          <div className="stack gap-1" role="note">
            <Badge tone="accent">{t(K.detail.adjustmentBasis)}</Badge>
            <span className="t-xs">
              {t(l.adjustment.changeId.startsWith('dispute:') ? K.detail.adjustmentDispute : K.detail.adjustmentAccepted, { price: formatINR(l.adjustment.toPrice), name: l.adjustment.acceptedBy, date: formatDate(l.adjustment.acceptedAt, lang), dispute: l.adjustment.changeId.slice(8) })}
              {l.adjustment.note ? ` · ${t(K.detail.adjustmentNote, { note: l.adjustment.note })}` : ''}
            </span>
          </div>
        )}

        {priceWrong && canAct && (
          <div className="stack gap-1">
            {l.applicableChanges.length === 0 ? (
              <span className="t-xs t-muted">{t(K.detail.noApprovedChange)}</span>
            ) : (
              l.applicableChanges.map((c) => (
                <div key={c.id} className="stack gap-1">
                  <span className="t-xs">{t(K.detail.approvedChange, { price: formatINR(c.toPrice), name: c.requestedBy, date: formatDate(c.requestedAt, lang) })}</span>
                  <Button size="sm" variant="secondary" disabled={s.busy} onClick={() => s.openAdjust(inv, l.index, c.id)}>
                    {t(K.detail.useChange)}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {inv.status !== 'rejected' && (
          <span className={`t-xs row gap-1 ${l.unlocked ? 't-success' : 't-muted'}`} style={{ alignItems: 'center' }}>
            {l.unlocked ? <LockOpen size={12} aria-hidden="true" /> : <Lock size={12} aria-hidden="true" />}
            {t(l.unlocked ? K.detail.unlocked : K.detail.locked)}
          </span>
        )}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- sheets */

function SubmitSheet({ s, t, report }: { s: SupplierInvoiceMatchingState; t: T; report: Report }) {
  const po = s.formPo;
  const problems = s.preview.filter((p) => p.match.verdict === 'mismatch');
  return (
    <Sheet open={s.formOpen} onClose={() => s.setFormOpen(false)} title={t(s.isAdmin ? K.form.titleFor : K.form.title)} closeLabel={t(K.action.close)}>
      {s.submittable.length === 0 ? (
        <p className="t-sm t-muted">{t(K.form.noOrders)}</p>
      ) : (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(s.isAdmin ? K.form.introAdmin : K.form.intro)}</p>
          <Field label={t(K.form.order)} required>
            {({ id, describedBy }) => (
              <Select id={id} aria-describedby={describedBy} value={s.formPoId} onChange={(e) => s.pickOrder(e.target.value)}>
                {s.submittable.map((p) => (
                  <option key={p.poId} value={p.poId}>
                    {[p.poCode, s.isAdmin ? p.supplierName : null, p.siteName].filter(Boolean).join(' · ')}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid-2">
            <Field label={t(K.form.number)} hint={t(K.form.numberHint)} required>
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={s.number} onChange={(e) => s.setNumber(e.target.value)} />}
            </Field>
            <Field label={t(K.form.date)} required>
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="date" value={s.date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => s.setDate(e.target.value)} />}
            </Field>
          </div>
          <DocumentSlot label={t(K.form.document)} hint={t(K.form.documentHint)} value={s.doc} onChange={s.setDoc} accept="application/pdf,image/*" skipQualityCheck />

          <section className="stack gap-2" aria-labelledby="lines-h">
            <h3 id="lines-h" className="t-sm t-semibold">
              {t(K.form.linesHeading)}
            </h3>
            {s.lines.map((l) => {
              const src = po?.lines.find((x) => x.id === l.lineItemId);
              const remaining = src ? Math.max(0, src.orderedQty - src.billedQty) : null;
              const locked = src !== undefined && remaining === 0;
              return (
                <Card key={l.key}>
                  <div className="stack gap-2">
                    {l.lineItemId ? (
                      <Checkbox checked={l.include} disabled={locked} onChange={(v) => s.patchLine(l.key, { include: v })} label={<span className="t-sm">{l.description}</span>} />
                    ) : (
                      <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
                        <Field label={t(K.form.extraDescription)} required>
                          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={l.description} onChange={(e) => s.patchLine(l.key, { description: e.target.value })} />}
                        </Field>
                        <Button size="sm" variant="ghost" aria-label={t(K.form.removeExtra)} onClick={() => s.removeExtra(l.key)}>
                          <X size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                    {src && (
                      <span className="t-xs t-muted">
                        {locked ? t(K.form.fullyBilled) : t(K.form.remaining, { qty: remaining })} · {t(K.form.orderPrice, { price: formatINR(src.orderPrice) })} · {t(K.form.deliveredSoFar, { qty: src.deliveredQty })}
                      </span>
                    )}
                    {l.include && !locked && (
                      <div className="grid-2">
                        <Field label={t(K.form.quantity)}>{({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} inputMode="decimal" value={l.quantity} onChange={(e) => s.patchLine(l.key, { quantity: e.target.value })} />}</Field>
                        <Field label={t(K.form.unitPrice)}>{({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} inputMode="decimal" value={l.unitPrice} onChange={(e) => s.patchLine(l.key, { unitPrice: e.target.value })} />}</Field>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            <Button size="sm" variant="ghost" onClick={s.addExtra}>
              <Plus size={14} aria-hidden="true" /> {t(K.form.addExtra)}
            </Button>
          </section>

          {s.preview.length > 0 && (
            <div className="stack gap-1" role="status" aria-live="polite">
              <span className="t-xs t-muted">{t(K.form.previewHeading)}</span>
              {problems.length === 0 ? (
                <Badge tone="success">{t(K.form.previewClean)}</Badge>
              ) : (
                <>
                  <Badge tone="warning">{t(K.form.previewWarn, { count: problems.length })}</Badge>
                  {problems.map((p) => (
                    <span key={p.line.key} className="t-xs t-error">
                      {p.line.description || '—'}: {p.match.issues.map((i) => t(K.issue[i])).join(' · ')}
                    </span>
                  ))}
                </>
              )}
            </div>
          )}

          <div className="row between gap-2 t-sm">
            <span className="t-muted">{t(K.form.total)}</span>
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(s.formTotal)}</strong>
          </div>
          <Button
            disabled={s.busy || !s.formValid}
            onClick={async () => {
              const r = await s.submit();
              if (r.ok && r.invoice) report(r, r.invoice.status === 'mismatch' ? K.toast.submittedMismatch : r.invoice.status === 'awaiting_delivery' ? K.toast.submitted : K.toast.submittedClean);
              else report(r);
            }}
          >
            {t(K.form.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function AdjustSheet({ s, t, lang, report }: { s: SupplierInvoiceMatchingState; t: T; lang: string; report: Report }) {
  const f = s.adjustFor;
  const line = f?.invoice.lines[f.lineIndex];
  const change = line?.applicableChanges.find((c) => c.id === f?.changeId);
  return (
    <Sheet open={!!f} onClose={() => s.setAdjustFor(null)} title={t(K.adjust.title)} closeLabel={t(K.action.close)}>
      {f && line && change && (
        <div className="stack gap-3">
          <p className="t-sm">
            {t(K.adjust.intro, {
              item: line.description,
              price: formatINR(change.toPrice),
              name: change.requestedBy,
              date: formatDate(change.requestedAt, lang),
              order: formatINR(line.orderedPrice ?? 0),
            })}
          </p>
          <Field label={t(K.adjust.note)} hint={t(K.adjust.noteHint)}>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.adjustNote} onChange={(e) => s.setAdjustNote(e.target.value)} />}
          </Field>
          <Button disabled={s.busy} onClick={async () => report(await s.confirmAdjust(), K.toast.adjusted)}>
            {t(K.adjust.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function RejectSheet({ s, t, report }: { s: SupplierInvoiceMatchingState; t: T; report: Report }) {
  const inv = s.rejectFor;
  const own = !s.isAdmin;
  return (
    <Sheet open={!!inv} onClose={() => s.setRejectFor(null)} title={t(own ? K.rejectSheet.titleOwn : K.rejectSheet.title)} closeLabel={t(K.action.close)}>
      {inv && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{own ? t(K.rejectSheet.introOwn, { number: inv.invoiceNumber }) : t(K.rejectSheet.introSupplier, { supplier: inv.supplierName, number: inv.invoiceNumber })}</p>
          <Field label={t(K.rejectSheet.reason)} hint={t(K.rejectSheet.reasonHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.rejectReason} onChange={(e) => s.setRejectReason(e.target.value)} />}
          </Field>
          <Button disabled={s.busy || s.rejectReason.trim().length < 4} onClick={async () => report(await s.confirmReject(), own ? K.toast.withdrawn : K.toast.rejected)}>
            {t(own ? K.rejectSheet.confirmOwn : K.rejectSheet.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
