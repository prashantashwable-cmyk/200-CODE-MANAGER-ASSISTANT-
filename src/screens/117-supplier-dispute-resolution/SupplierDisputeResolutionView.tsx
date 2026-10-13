import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowsClockwise, Clock, FlagBanner, Handshake, Scales, WarningOctagon } from '@phosphor-icons/react';
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
import type { DisputeSlaState, SupplierDisputeRow } from '@/data/repository';
import { useSupplierDisputeResolution } from './useSupplierDisputeResolution';
import type { ActionResult, SupplierDisputeState } from './useSupplierDisputeResolution';
import { AREAS, DECISIONS, DISPUTE_KEYS as K, KINDS, QUEUE_FILTERS } from './supplier-dispute-resolution.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string) => void;

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const SLA_TONE: Record<DisputeSlaState, BadgeTone> = { on_track: 'success', due_soon: 'warning', overdue: 'error', resolved: 'neutral' };
const AREA_ROUTE: Record<string, string | null> = { invoice_matching: '/supplier-invoices', payment_terms: '/admin/suppliers/payment-terms', delivery_sop: '/delivery-sop', other: null };

/**
 * Screen 117 — Supplier Dispute Resolution. The supplier's own words sit beside what the order's records say, and a
 * decision makes a real correction: a further payment beside a paid one, a raised amount on an unpaid one, a retention released,
 * an invoice accepted. Because suppliers are long-term partners, the supplier's record and any threat to stop supplying
 * are shown with the facts. A decision the supplier contests is a new round, never a silent overwrite.
 */
export function SupplierDisputeResolutionView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useSupplierDisputeResolution();
  const lang = i18n.language;

  const report: Report = (r, success) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success), 'success');
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

  if (s.disputeParam) {
    return (
      <Screen width="default" className="pb-action-bar">
        <Detail s={s} t={t} lang={lang} />
        <Sheets s={s} t={t} report={report} />
      </Screen>
    );
  }

  const b = s.board;
  const emptyKey = s.filter === 'resolved' ? ['emptyResolvedTitle', 'emptyResolvedBody'] : ['emptyOpenTitle', 'emptyOpenBody'];
  return (
    <Screen width="default">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button size="sm" variant="secondary" onClick={() => void s.openRaise()}>
            <Handshake size={14} aria-hidden="true" /> {t(K.action.log)}
          </Button>
        }
      />

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '104px' } as CSSProperties}>
        <StatTile label={t(K.totals.open)} value={b.totals.open} caption={t(K.totals.count, { count: b.totals.open })} large />
        <StatTile label={t(K.totals.overdue)} value={<span className={b.totals.overdue > 0 ? 't-error' : ''}>{b.totals.overdue}</span>} />
        <StatTile label={t(K.totals.halt)} value={<span className={b.totals.halt > 0 ? 't-error' : ''}>{b.totals.halt}</span>} />
        <StatTile label={t(K.totals.claimed)} value={<span className="num">{formatINRCompact(b.totals.claimedOpen)}</span>} />
      </div>

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.label)}>
          {QUEUE_FILTERS.map((f) => (
            <Chip key={f} pressed={s.filter === f} onClick={() => s.setFilter(f)}>
              {t(K.filter[f])} · {s.counts[f]}
            </Chip>
          ))}
        </div>
      </div>

      {s.shown.length === 0 ? (
        s.query.trim() !== '' ? (
          <EmptyState icon={<Scales size={28} />} title={t(K.list.emptySearchTitle)} body={t(K.list.emptySearchBody)} actionLabel={t(K.list.clear)} onAction={() => s.setQuery('')} />
        ) : (
          <EmptyState icon={<Scales size={32} />} title={t(K.list[emptyKey[0] as 'emptyOpenTitle'])} body={t(K.list[emptyKey[1] as 'emptyOpenBody'])} />
        )
      ) : (
        <Card className="ds-card--flush">
          {s.shown.map((r) => (
            <Row key={r.id} r={r} s={s} t={t} lang={lang} />
          ))}
        </Card>
      )}

      <Sheets s={s} t={t} report={report} />
    </Screen>
  );
}

function Sheets({ s, t, report }: { s: SupplierDisputeState; t: T; report: Report }) {
  return (
    <>
      <DecideSheet s={s} t={t} report={report} />
      <ReopenSheet s={s} t={t} report={report} />
      <ProcessSheet s={s} t={t} report={report} />
      <RaiseSheet s={s} t={t} report={report} />
    </>
  );
}

/* ------------------------------------------------------------------ row */

function Row({ r, s, t, lang }: { r: SupplierDisputeRow; s: SupplierDisputeState; t: T; lang: string }) {
  const due = r.status === 'open' ? (r.sla === 'overdue' ? t(K.list.overdue, { date: formatDate(r.dueAt, lang) }) : t(K.list.due, { date: formatDate(r.dueAt, lang) })) : null;
  return (
    <button type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={() => s.openDispute(r.id)}>
      <span className="ds-listrow__lead" aria-hidden="true" style={{ display: 'grid', placeItems: 'center' }}>
        <Scales size={20} />
      </span>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <strong className="t-sm">{r.supplierName}</strong>
          {r.threatensHalt && r.status === 'open' && (
            <Badge tone="error">
              <WarningOctagon size={12} aria-hidden="true" /> {t(K.list.halt)}
            </Badge>
          )}
          {r.round > 1 && <Badge tone="warning">{t(K.list.round, { count: r.round })}</Badge>}
          {r.processFlagOpen && <Badge tone="neutral">{t(K.list.process)}</Badge>}
        </span>
        <span className="t-xs t-muted">{[r.poCode, r.siteName, t(K.kind[r.kind])].filter(Boolean).join(' · ')}</span>
        <span className="t-xs" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {r.position}
        </span>
        {due && (
          <span className={`t-xs row gap-1 ${r.sla === 'overdue' ? 't-error' : 't-muted'}`} style={{ alignItems: 'center' }}>
            <Clock size={12} aria-hidden="true" /> {due}
          </span>
        )}
      </span>
      <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <strong className="num">{r.claimedAmount !== null ? formatINR(r.claimedAmount) : '—'}</strong>
        <Badge tone={SLA_TONE[r.sla]}>{r.status === 'resolved' && r.lastDecision ? t(K.decision[r.lastDecision]) : t(K.sla[r.sla])}</Badge>
      </span>
    </button>
  );
}

/* --------------------------------------------------------------- detail */

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
    <dt className="t-muted">{label}</dt>
    <dd style={{ textAlign: 'end', margin: 0, minWidth: 0, overflowWrap: 'anywhere' }}>{value}</dd>
  </div>
);

function Detail({ s, t, lang }: { s: SupplierDisputeState; t: T; lang: string }) {
  const navigate = useNavigate();
  const d = s.detail;
  if (!d) {
    return (
      <>
        <ScreenHeader title={t(K.title)} back={s.closeDispute} backLabel={t(K.detail.back)} />
        {s.detailMissing ? <EmptyState icon={<Scales size={32} />} title={t(K.detail.notFound)} body={t(K.detail.notFoundBody)} actionLabel={t(K.detail.back)} onAction={s.closeDispute} /> : <LoadingState label={t(K.loading)} variant="list" rows={4} />}
      </>
    );
  }
  const ev = d.evidence;
  const rel = d.relationship;
  const events = [...d.events].sort((a, b) => (a.at < b.at ? -1 : 1));
  return (
    <>
      <ScreenHeader title={d.code} subtitle={`${d.supplierName} · ${d.poCode}`} back={s.closeDispute} backLabel={t(K.detail.back)} />

      <Card>
        <div className="stack gap-2">
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={SLA_TONE[d.sla]}>{d.status === 'resolved' && d.lastDecision ? t(K.decision[d.lastDecision]) : t(K.sla[d.sla])}</Badge>
            <Badge tone="neutral">{t(K.kind[d.kind])}</Badge>
            {d.round > 1 && <Badge tone="warning">{t(K.list.round, { count: d.round })}</Badge>}
          </div>
          <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
            <Fact label={t(K.detail.raised)} value={t(K.detail.raisedFor, { name: d.raisedByName, date: formatDateTime(d.raisedAt, lang) })} />
            {d.claimedAmount !== null && <Fact label={t(K.detail.claimed)} value={formatINR(d.claimedAmount)} />}
            {d.status === 'open' && <Fact label={t(K.detail.dueBy)} value={formatDate(d.dueAt, lang)} />}
            <Fact label={t(K.detail.about)} value={d.targetLabel || '—'} />
          </dl>
        </div>
      </Card>

      {d.threatensHalt && d.status === 'open' && (
        <Card className="mt-3">
          <div className="row gap-2" role="alert" style={{ alignItems: 'flex-start' }}>
            <WarningOctagon size={20} aria-hidden="true" className="shrink-0" />
            <div className="stack">
              <strong className="t-sm">{t(K.detail.haltHeading)}</strong>
              <span className="t-sm">{t(K.detail.haltBody, { supplier: d.supplierName, count: rel.openOrders })}</span>
            </div>
          </div>
        </Card>
      )}

      <section className="stack gap-2 mt-3" aria-labelledby="sides-h">
        <h2 id="sides-h" className="t-md t-semibold">
          {t(K.detail.sidesHeading)}
        </h2>
        <div className="grid-auto" style={{ ['--min' as string]: '300px' } as CSSProperties}>
          <Card>
            <div className="stack gap-2">
              <h3 className="t-sm t-semibold">{t(K.detail.positionHeading)}</h3>
              <p className="t-sm" style={{ margin: 0 }}>
                “{d.supplierPosition}”
              </p>
              <span className="t-xs t-muted">{d.raisedByName}</span>
            </div>
          </Card>
          <Card>
            <div className="stack gap-2">
              <div className="stack">
                <h3 className="t-sm t-semibold">{t(K.detail.evidenceHeading)}</h3>
                <span className="t-xs t-muted">{t(K.detail.evidenceHint)}</span>
              </div>
              <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
                <Fact label={t(K.detail.orderTotal)} value={formatINR(ev.poTotal)} />
                {ev.basis && ev.basis.termType && <Fact label={t(K.detail.terms)} value={ev.basis.pct !== null ? t(K.detail.termsShare, { type: t(K.detail.termType[ev.basis.termType]), pct: ev.basis.pct }) : t(K.detail.termType[ev.basis.termType])} />}
                {ev.payment && (
                  <>
                    <Fact label={t(K.detail.payment)} value={t(K.detail.paymentLine, { code: ev.payment.code, amount: formatINR(ev.payment.amount), status: t(K.detail.paymentStatus[ev.payment.status]) })} />
                    {ev.basis && ev.basis.reconciles !== null && <Fact label={' '} value={ev.basis.reconciles ? t(K.detail.reconciles) : t(K.detail.differs, { amount: formatINR(Math.abs(ev.basis.difference)) })} />}
                  </>
                )}
                {ev.adjustments.map((a) => (
                  <Fact key={a.id} label={t(K.detail.adjustment)} value={`${a.direction === 'credit' ? '−' : '+'}${formatINR(a.amount)} · ${a.reason}`} />
                ))}
                {ev.retention && <Fact label={t(K.detail.retention)} value={`${formatINR(ev.retention.amount)} · ${t(K.detail.retentionStatus[ev.retention.status])}${ev.retention.pausedAt ? ` · ${t(K.detail.retentionPaused, { date: formatDate(ev.retention.pausedAt, lang) })}` : ''}`} />}
              </dl>
              <div className="stack gap-1">
                <span className="t-xs t-muted">{t(K.detail.invoices)}</span>
                {ev.invoices.length === 0 && ev.rejectedInvoices.length === 0 ? (
                  <span className="t-xs">{t(K.detail.noInvoices)}</span>
                ) : (
                  <>
                    {ev.invoices.map((i) => (
                      <span key={i.id} className="t-xs">
                        {i.number} · {formatINR(i.subtotal)} · {t(K.detail.invoiceStatus[i.status])}
                      </span>
                    ))}
                    {ev.rejectedInvoices.map((i) => (
                      <span key={i.id} className="t-xs t-muted">
                        {t(K.detail.rejectedInvoice, { number: i.number, reason: i.reason ?? '' })}
                      </span>
                    ))}
                  </>
                )}
              </div>
              <div className="stack gap-1">
                <span className="t-xs t-muted">{t(K.detail.reports)}</span>
                {ev.openReports.length === 0 ? <span className="t-xs">{t(K.detail.noReports)}</span> : ev.openReports.map((r) => <span key={r.id} className="t-xs t-error">{r.code}</span>)}
                {ev.defects > 0 && <span className="t-xs">{t(K.detail.defects, { count: ev.defects })}</span>}
              </div>
              {ev.deliveredLines.length > 0 && (
                <div className="stack gap-1">
                  <span className="t-xs t-muted">{t(K.detail.delivered)}</span>
                  {ev.deliveredLines.map((l) => (
                    <span key={l.description} className="t-xs">
                      {l.description}: {l.accepted} / {l.ordered}
                    </span>
                  ))}
                </div>
              )}
              <div className="row gap-2 wrap">
                {ev.payment && (
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/supplier-payment-history?payment=${ev.payment!.id}`)}>
                    {t(K.detail.openEvidence)}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => navigate('/supplier-messages')}>
                  {t(K.detail.messages)}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="stack gap-2 mt-3" aria-labelledby="rel-h">
        <div className="stack">
          <h2 id="rel-h" className="t-md t-semibold">
            {t(K.detail.relationshipHeading)}
          </h2>
          <span className="t-xs t-muted">{t(K.detail.relationshipHint)}</span>
        </div>
        <Card>
          <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
            <Fact label={t(K.detail.onTime)} value={rel.ratedOrders > 0 && rel.onTimeRate !== null ? `${Math.round(rel.onTimeRate * 100)}%` : t(K.detail.notRated)} />
            <Fact label={t(K.detail.quality)} value={rel.ratedOrders > 0 && rel.qualityScore !== null ? `${rel.qualityScore.toFixed(1)} / 5` : t(K.detail.notRated)} />
            <Fact label={t(K.detail.rated)} value={String(rel.ratedOrders)} />
            <Fact label={t(K.detail.agreement)} value={t(K.detail.agreementState[rel.agreementState])} />
            <Fact label={t(K.detail.tier)} value={rel.tier in K.detail.tierName ? t(K.detail.tierName[rel.tier as 'new']) : rel.tier} />
            <Fact label={t(K.detail.openOrders)} value={String(rel.openOrders)} />
            <Fact label={t(K.detail.orderValue)} value={formatINR(rel.orderValue)} />
            <Fact label={t(K.detail.alternatives)} value={String(rel.alternatives)} />
            <Fact label={t(K.detail.priorDisputes)} value={rel.priorDisputes.total === 0 ? '—' : t(K.detail.priorBody, { total: rel.priorDisputes.total, favor: rel.priorDisputes.supplierFavor, partial: rel.priorDisputes.partial, upheld: rel.priorDisputes.upheld })} />
            {rel.otherOpenDisputes > 0 && <Fact label={t(K.detail.otherOpen)} value={String(rel.otherOpenDisputes)} />}
          </dl>
        </Card>
      </section>

      <section className="stack gap-2 mt-3" aria-labelledby="dec-h">
        <h2 id="dec-h" className="t-md t-semibold">
          {t(K.detail.decisionsHeading)}
        </h2>
        {d.decisions.length === 0 ? (
          <span className="t-sm t-muted">{t(K.detail.noDecision)}</span>
        ) : (
          d.decisions.map((x) => (
            <Card key={x.id}>
              <div className="stack gap-1">
                <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
                  <Badge tone={x.decision === 'uphold' ? 'neutral' : 'accent'}>{t(K.decision[x.decision])}</Badge>
                  {x.amount > 0 && <strong className="num">{formatINR(x.amount)}</strong>}
                </div>
                <span className="t-sm">{x.note}</span>
                <span className="t-xs t-muted">
                  {t(K.detail.decidedBy, { name: x.byName, date: formatDateTime(x.at, lang) })}
                </span>
                {x.correction !== 'none' && <span className="t-xs">{t(K.detail.correctionLine, { what: t(K.correction[x.correction]) })}</span>}
              </div>
            </Card>
          ))
        )}
        {d.canReopen && <p className="t-xs t-muted">{t(K.detail.reopenNote)}</p>}
      </section>

      <section className="stack gap-2 mt-3" aria-labelledby="proc-h">
        <div className="stack">
          <h2 id="proc-h" className="t-md t-semibold">
            {t(K.detail.processHeading)}
          </h2>
          <span className="t-xs t-muted">{t(K.detail.processHint)}</span>
        </div>
        {d.processFlag ? (
          <Card>
            <div className="stack gap-1">
              <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                <Badge tone={d.processFlag.status === 'open' ? 'warning' : 'success'}>{d.processFlag.status === 'open' ? t(K.detail.processOpen) : t(K.detail.processAddressed)}</Badge>
                <Badge tone="neutral">{t(K.area[d.processFlag.area])}</Badge>
              </div>
              <span className="t-sm">{d.processFlag.note}</span>
              <span className="t-xs t-muted">{t(K.detail.processBy, { name: d.processFlag.byName, date: formatDateTime(d.processFlag.at, lang) })}</span>
              {d.processFlag.status === 'addressed' && d.processFlag.addressedNote && <span className="t-xs">{d.processFlag.addressedNote}</span>}
              <div className="row gap-2 wrap">
                {AREA_ROUTE[d.processFlag.area] && (
                  <Button size="sm" variant="ghost" onClick={() => navigate(AREA_ROUTE[d.processFlag!.area]!)}>
                    {t(K.detail.processGo)}
                  </Button>
                )}
                {d.processFlag.status === 'open' && (
                  <Button size="sm" variant="secondary" disabled={s.busy} onClick={() => s.openProcess('address')}>
                    {t(K.action.address)}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div>
            <Button size="sm" variant="secondary" disabled={s.busy} onClick={() => s.openProcess('flag')}>
              <FlagBanner size={14} aria-hidden="true" /> {t(K.action.flag)}
            </Button>
          </div>
        )}
      </section>

      <section className="stack gap-2 mt-3" aria-labelledby="hist-h">
        <h2 id="hist-h" className="t-md t-semibold">
          {t(K.detail.historyHeading)}
        </h2>
        <AscensionLine
          className="ds-ascension--multiline"
          steps={events.map((e) => ({
            id: e.id,
            label: t(K.event[e.kind]),
            meta: [formatDateTime(e.at, lang), t(K.detail.by, { name: e.byName }), e.note].filter(Boolean).join(' · '),
            status: e.kind === 'reopened' ? ('blocked' as const) : ('complete' as const),
          }))}
        />
      </section>

      {(d.status === 'open' || d.canReopen) && (
        <ActionBar>
          {d.status === 'open' ? (
            <Button disabled={s.busy} onClick={s.openDecide}>
              <Scales size={14} aria-hidden="true" /> {t(K.action.decide)}
            </Button>
          ) : (
            <Button variant="secondary" disabled={s.busy} onClick={s.openReopen}>
              <ArrowsClockwise size={14} aria-hidden="true" /> {t(K.action.reopen)}
            </Button>
          )}
        </ActionBar>
      )}
    </>
  );
}

/* --------------------------------------------------------------- sheets */

function DecideSheet({ s, t, report }: { s: SupplierDisputeState; t: T; report: Report }) {
  const d = s.detail;
  const contextWarn = !!d && s.decision === 'uphold' && (d.threatensHalt || d.relationship.alternatives === 0);
  return (
    <Sheet open={s.decideOpen && !!d} onClose={() => s.setDecideOpen(false)} title={t(K.decide.title)} closeLabel={t(K.action.close)}>
      {d && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.decide.intro)}</p>
          <div className="row gap-2 wrap" role="group" aria-label={t(K.decide.choose)}>
            {DECISIONS.filter((x) => x !== 'partial' || s.canPartialHere).map((x) => (
              <Chip key={x} pressed={s.decision === x} onClick={() => s.setDecision(x)}>
                {t(K.decision[x])}
              </Chip>
            ))}
          </div>

          {s.decision !== 'uphold' && s.amountNeeded && (
            <Field label={t(K.decide.amount)} hint={d.maxAmount !== null ? t(K.decide.remaining, { amount: formatINR(d.maxAmount) }) : t(K.decide.amountHint)} required>
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} inputMode="decimal" value={s.amount} onChange={(e) => s.setAmount(e.target.value)} />}
            </Field>
          )}
          {s.decision === 'supplier_favor' && !s.amountNeeded && s.giveAmount > 0 && <span className="t-sm num">{t(K.decide.amountFixed, { amount: formatINR(s.giveAmount) })}</span>}

          <div className="stack gap-1" role="note">
            <span className="t-xs t-muted">{t(K.decide.willDo)}</span>
            <span className="t-sm">{s.decision === 'uphold' ? t(K.decide.upholdWill) : t(K.effect[d.effect], { code: d.evidence.payment?.code ?? '', amount: s.giveAmount > 0 ? formatINR(s.giveAmount) : '—' })}</span>
          </div>
          {contextWarn && <span className="t-xs t-error">{t(K.decide.contextWarn, { supplier: d.supplierName })}</span>}

          <Field label={t(K.decide.note)} hint={t(K.decide.noteHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.note} onChange={(e) => s.setNote(e.target.value)} />}
          </Field>
          <Button disabled={s.busy || s.decisionError !== null} onClick={async () => report(await s.confirmDecide(), K.toast.decided)}>
            {t(K.decide.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function ReopenSheet({ s, t, report }: { s: SupplierDisputeState; t: T; report: Report }) {
  return (
    <Sheet open={s.reopenOpen && !!s.detail} onClose={() => s.setReopenOpen(false)} title={t(K.reopenSheet.title)} closeLabel={t(K.action.close)}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.reopenSheet.intro)}</p>
        <Field label={t(K.reopenSheet.reason)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.reopenReason} onChange={(e) => s.setReopenReason(e.target.value)} />}
        </Field>
        <Button disabled={s.busy || s.reopenReason.trim().length < 8} onClick={async () => report(await s.confirmReopen(), K.toast.reopened)}>
          {t(K.reopenSheet.confirm)}
        </Button>
      </div>
    </Sheet>
  );
}

function ProcessSheet({ s, t, report }: { s: SupplierDisputeState; t: T; report: Report }) {
  const flag = s.processOpen === 'flag';
  return (
    <Sheet open={!!s.processOpen && !!s.detail} onClose={() => s.setProcessOpen(null)} title={t(flag ? K.processSheet.title : K.processSheet.addressTitle)} closeLabel={t(K.action.close)}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(flag ? K.processSheet.intro : K.processSheet.addressIntro)}</p>
        {flag && (
          <Field label={t(K.processSheet.area)} required>
            {({ id, describedBy }) => (
              <Select id={id} aria-describedby={describedBy} value={s.area} onChange={(e) => s.setArea(e.target.value as typeof s.area)}>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {t(K.area[a])}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label={t(flag ? K.processSheet.note : K.processSheet.addressNote)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.processNote} onChange={(e) => s.setProcessNote(e.target.value)} />}
        </Field>
        <Button disabled={s.busy || s.processNote.trim().length < 8} onClick={async () => report(await s.confirmProcess(), flag ? K.toast.flagged : K.toast.addressed)}>
          {t(flag ? K.processSheet.confirm : K.processSheet.addressConfirm)}
        </Button>
      </div>
    </Sheet>
  );
}

function RaiseSheet({ s, t, report }: { s: SupplierDisputeState; t: T; report: Report }) {
  return (
    <Sheet open={s.raiseOpen} onClose={() => s.setRaiseOpen(false)} title={t(K.raise.title)} closeLabel={t(K.action.close)}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.raise.intro)}</p>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.raise.kind)}>
          {KINDS.map((k) => (
            <Chip
              key={k}
              pressed={s.kind === k}
              onClick={() => {
                s.setKind(k);
                s.setTargetId('');
              }}
            >
              {t(K.kind[k])}
            </Chip>
          ))}
        </div>
        <Field label={t(K.raise.target)} hint={s.targetList.length === 0 ? t(K.raise.none) : undefined} required>
          {({ id, describedBy }) => (
            <Select id={id} aria-describedby={describedBy} value={s.targetId} onChange={(e) => s.setTargetId(e.target.value)}>
              <option value="">{t(K.raise.pick)}</option>
              {s.targetList.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t(K.raise.position)} hint={t(K.raise.positionHint)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={s.position} onChange={(e) => s.setPosition(e.target.value)} />}
        </Field>
        {s.kind === 'amount' && (
          <Field label={t(K.raise.claimed)} hint={t(K.raise.claimedHint)} required>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} inputMode="decimal" value={s.claimed} onChange={(e) => s.setClaimed(e.target.value)} />}
          </Field>
        )}
        <Toggle checked={s.halt} onChange={s.setHalt} label={t(K.raise.halt)} description={t(K.raise.haltHint)} />
        <Button disabled={s.busy || !s.raiseValid} onClick={async () => report(await s.confirmRaise(), K.toast.raised)}>
          {t(K.raise.confirm)}
        </Button>
      </div>
    </Sheet>
  );
}
