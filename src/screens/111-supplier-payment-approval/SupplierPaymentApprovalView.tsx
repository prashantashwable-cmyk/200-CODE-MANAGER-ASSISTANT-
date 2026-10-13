import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Lock, ShieldWarning, WarningOctagon, Wallet } from '@phosphor-icons/react';
import {
  ActionBar,
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
  Sheet,
  StatTile,
  TextArea,
  formatDate,
  formatDateTime,
  formatINR,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { SupplierPaymentView } from '@/data/repository';
import type { FlagSeverity } from '@/features/suppliers/supplierPayments';
import { useSupplierPaymentApproval } from './useSupplierPaymentApproval';
import type { ActionResult, SupplierPaymentApprovalState } from './useSupplierPaymentApproval';
import { APPROVAL_KEYS as K, QUEUE_FILTERS } from './supplier-payment-approval.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string, params?: Record<string, unknown>) => void;

/** A due payment held up by a missing or unmatched invoice reads as waiting, not as a decision for Admin. */
const statusKey = (p: SupplierPaymentView) => (p.status === 'pending_approval' && p.flags.some((f) => f.kind === 'invoice_unmatched') ? K.totals.waiting : K.status[p.status]);
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const FLAG_TONE: Record<FlagSeverity, BadgeTone> = { block: 'error', hold: 'warning', care: 'neutral' };
const STATUS_TONE: Record<SupplierPaymentView['status'], BadgeTone> = { pending_approval: 'warning', held: 'neutral', approved: 'accent', executed: 'success' };

/** "9 min" / "45 s": the time left to take an approval back. */
function left(t: T, ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return s >= 60 ? t(K.duration.minutes, { count: Math.ceil(s / 60) }) : t(K.duration.seconds, { count: s });
}

/**
 * Screen 111 — Supplier Payment Approval. The queue holds only payments whose configured milestone has genuinely
 * fired, each with the evidence that fired it. Anything that should give Admin pause (an open damaged-parts report,
 * a lost deal, a supplier no longer cleared) is a flag on the payment itself. Approving is the last human step
 * before money moves, so it opens a short window in which it can be taken back.
 */
export function SupplierPaymentApprovalView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useSupplierPaymentApproval();

  const report: Report = (r, success, params) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success, params), 'success');
  };

  if (s.status === 'loading' && !s.queue) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.queue) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const lang = i18n.language;
  const q = s.queue;
  const inSelect = s.selecting && s.filter === 'toApprove';

  return (
    <Screen width="default" className={inSelect ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          q.totals.routineCount > 0 && s.filter === 'toApprove' ? (
            <Button size="sm" variant={s.selecting ? 'primary' : 'secondary'} onClick={s.toggleSelecting}>
              {t(s.selecting ? K.batch.done : K.batch.select)}
            </Button>
          ) : undefined
        }
      />

      <div className="grid-auto mb-3">
        <StatTile label={t(K.totals.toApprove)} value={formatINR(q.totals.toApproveAmount)} caption={t(K.totals.count, { count: q.toApprove.length })} large />
        <StatTile label={t(K.totals.routine)} value={formatINR(q.totals.routineAmount)} caption={t(K.totals.count, { count: q.totals.routineCount })} />
        <StatTile label={t(K.totals.waiting)} value={formatINR(q.totals.waitingAmount)} caption={t(K.totals.count, { count: q.waiting.length })} />
        <StatTile label={t(K.totals.held)} value={formatINR(q.totals.heldAmount)} caption={t(K.totals.count, { count: q.held.length })} />
      </div>

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.label)}>
          {QUEUE_FILTERS.map((f) => (
            <Chip
              key={f}
              pressed={s.filter === f}
              onClick={() => {
                s.setFilter(f);
                if (f !== 'toApprove' && s.selecting) s.toggleSelecting();
              }}
            >
              {t(K.filter[f])} · {s.counts[f]}
            </Chip>
          ))}
        </div>
        {inSelect && (
          <div className="row between gap-2 wrap">
            <span className="t-xs t-muted">{t(K.batch.hint, { limit: formatINR(q.limits.routineLimit) })}</span>
            <span className="row gap-1">
              <Button size="sm" variant="ghost" onClick={s.selectAllRoutine}>
                {t(K.batch.selectAll, { count: s.routineIds.length })}
              </Button>
              {s.chosen.length > 0 && (
                <Button size="sm" variant="ghost" onClick={s.clearSelection}>
                  {t(K.batch.clear)}
                </Button>
              )}
            </span>
          </div>
        )}
      </div>

      {s.shown.length === 0 ? (
        <Empty s={s} t={t} />
      ) : (
        <Card className="ds-card--flush">
          {s.shown.map((p) => (
            <PaymentRow key={p.id} p={p} s={s} t={t} lang={lang} report={report} selecting={inSelect} />
          ))}
        </Card>
      )}

      {inSelect && (
        <ActionBar>
          <Button disabled={s.chosen.length === 0} onClick={() => s.setBatchOpen(true)}>
            {t(K.batch.review, { count: s.chosen.length, amount: formatINR(s.chosenTotal) })}
          </Button>
        </ActionBar>
      )}

      <DetailSheet s={s} t={t} lang={lang} report={report} />
      <HoldSheet s={s} t={t} report={report} />
      <ReverseSheet s={s} t={t} report={report} />
      <BatchSheet s={s} t={t} report={report} />
    </Screen>
  );
}

function Empty({ s, t }: { s: SupplierPaymentApprovalState; t: T }) {
  if (s.query.trim() !== '' && s.counts[s.filter] > 0) {
    return <EmptyState icon={<Wallet size={28} />} title={t(K.list.emptySearchTitle)} body={t(K.list.emptySearchBody)} actionLabel={t(K.list.clear)} onAction={() => s.setQuery('')} />;
  }
  const key = s.filter === 'toApprove' ? ['emptyTitle', 'emptyBody'] : s.filter === 'waiting' ? ['emptyWaitingTitle', 'emptyWaitingBody'] : s.filter === 'held' ? ['emptyHeldTitle', 'emptyHeldBody'] : ['emptyRecentTitle', 'emptyRecentBody'];
  return <EmptyState icon={<CheckCircle size={32} />} title={t(K.list[key[0] as 'emptyTitle'])} body={t(K.list[key[1] as 'emptyBody'])} />;
}

/* ------------------------------------------------------------------- row */

function PaymentRow({ p, s, t, lang, report, selecting }: { p: SupplierPaymentView; s: SupplierPaymentApprovalState; t: T; lang: string; report: Report; selecting: boolean }) {
  const reversible = p.status === 'approved';
  const remaining = reversible && p.reversibleUntil ? new Date(p.reversibleUntil).getTime() - s.now : 0;
  const due = p.status === 'pending_approval' ? (p.overdueDays > 0 ? t(K.list.overdue, { count: p.overdueDays }) : t(K.list.dueToday)) : null;
  const top = p.flags[0];
  const checkbox = selecting && p.status === 'pending_approval';
  return (
    <div className="ds-listrow" style={{ alignItems: 'flex-start' }}>
      {checkbox && (
        <span style={{ paddingTop: 2 }}>
          {p.routine ? (
            <Checkbox checked={s.selected.includes(p.id)} onChange={() => s.toggle(p.id)} label={<span className="sr-only">{p.supplierName}</span>} />
          ) : (
            <Lock size={20} aria-label={t(K.batch.notRoutine)} color="var(--color-text-secondary)" />
          )}
        </span>
      )}
      <button type="button" style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: 0 }} onClick={() => s.openPayment(p.id)} aria-label={`${p.supplierName} ${formatINR(p.amount)}`}>
        <span className="ds-listrow__lead" aria-hidden="true">
          <Wallet size={22} color="var(--color-accent-secondary)" />
        </span>
        <span className="stack grow" style={{ minWidth: 0 }}>
          <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <strong className="t-sm">{p.supplierName}</strong>
            {p.routine && p.status === 'pending_approval' && <Badge tone="emerald">{t(K.list.routine)}</Badge>}
            {top && (
              <Badge tone={FLAG_TONE[top.severity]}>
                <ShieldWarning size={12} aria-hidden="true" /> {t(K.flag[top.kind])}
              </Badge>
            )}
          </span>
          <span className="t-xs t-muted">{[p.poCode, p.siteName].filter(Boolean).join(' · ')}</span>
          <span className="t-xs t-muted">
            {t(K.part[p.part])} · {t(K.trigger[p.trigger])}
          </span>
          {due && (
            <span className={`t-xs row gap-1 ${p.overdueDays > 0 ? 't-warning' : 't-muted'}`} style={{ alignItems: 'center' }}>
              <Clock size={12} aria-hidden="true" /> {due}
            </span>
          )}
          {p.status === 'held' && p.heldAt && <span className="t-xs t-muted">{t(K.list.heldOn, { date: formatDate(p.heldAt, lang) })}</span>}
          {p.status === 'executed' && p.executedAt && (
            <span className="t-xs t-muted">
              {t(K.list.madeOn, { date: formatDateTime(p.executedAt, lang) })}
              {p.bankReference ? ` · ${p.bankReference}` : ''}
            </span>
          )}
          {reversible && (
            <span className="t-xs" aria-live="polite">
              {remaining > 0 ? t(K.list.reversibleFor, { time: left(t, remaining) }) : t(K.list.windowClosing)}
            </span>
          )}
        </span>
        <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(p.amount)}</strong>
          <Badge tone={STATUS_TONE[p.status]}>{t(statusKey(p))}</Badge>
        </span>
      </button>
      {reversible && remaining > 0 && (
        <Button size="sm" variant="secondary" disabled={s.busy} onClick={() => s.openReverse(p)}>
          {t(K.list.reverse)}
        </Button>
      )}
      {p.status === 'held' && (
        <Button size="sm" variant="secondary" disabled={s.busy} onClick={async () => report(await s.release(p), K.toast.released)}>
          {t(K.action.release)}
        </Button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- detail */

function DetailSheet({ s, t, lang, report }: { s: SupplierPaymentApprovalState; t: T; lang: string; report: Report }) {
  const navigate = useNavigate();
  const p = s.current;
  const gateHold = !!p && p.flags.some((f) => f.severity === 'hold');
  const blocked = !!p && p.flags.some((f) => f.severity === 'block');
  return (
    <Sheet open={!!p} onClose={s.closePayment} title={p ? t(K.detail.title, { code: p.code }) : ''} closeLabel={t(K.action.close)}>
      {p && (
        <div className="stack gap-3">
          <div className="stack gap-1">
            <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
              <strong style={{ fontSize: '1.5rem', fontVariantNumeric: 'tabular-nums' }}>{formatINR(p.amount)}</strong>
              <Badge tone={STATUS_TONE[p.status]}>{t(statusKey(p))}</Badge>
            </div>
            <span className="t-sm">
              {t(K.part[p.part])} · {t(K.trigger[p.trigger])}
            </span>
          </div>
          <dl className="stack gap-1 t-sm">
            <Row label={t(K.detail.supplier)} value={p.supplierName} />
            <Row label={t(K.detail.order)} value={`${p.poCode} · ${formatINR(p.poTotal)}`} />
            <Row label={t(K.detail.site)} value={p.siteName} />
            <Row label={t(K.detail.paidSoFar)} value={formatINR(p.paidOnOrder)} />
            <Row label={t(K.detail.dueOn)} value={formatDate(p.dueAt, lang)} />
          </dl>

          {p.flags.length > 0 && (
            <section className="stack gap-2" aria-labelledby="flags-h">
              <h3 id="flags-h" className="t-sm t-semibold">
                {t(K.detail.flagsHeading)}
              </h3>
              {p.flags.map((f) => (
                <Card key={f.kind}>
                  <div className="stack gap-1" role="note">
                    <Badge tone={FLAG_TONE[f.severity]}>
                      <WarningOctagon size={12} aria-hidden="true" /> {t(K.flag[f.kind])}
                    </Badge>
                    <span className="t-sm">{f.kind === 'invoice_unmatched' && f.detail ? t(K.invoiceGate[f.detail as keyof typeof K.invoiceGate]) : t(K.flagBody[f.kind])}</span>
                  </div>
                </Card>
              ))}
            </section>
          )}

          {p.reports.length > 0 && (
            <section className="stack gap-2" aria-labelledby="rep-h">
              <h3 id="rep-h" className="t-sm t-semibold">
                {t(K.detail.reportsHeading)}
              </h3>
              {p.reports.map((r) => (
                <Card key={r.id}>
                  <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
                    <span className="stack">
                      <strong className="t-sm">
                        {r.code} {r.rush && <Badge tone="error">{t(K.detail.rush)}</Badge>}
                      </strong>
                      <span className="t-xs t-muted">{t(K.detail.reportBody, { count: r.itemCount })}</span>
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/damaged-parts?report=${r.id}`)}>
                      {t(K.detail.openReport)}
                    </Button>
                  </div>
                </Card>
              ))}
            </section>
          )}

          <section className="stack gap-2" aria-labelledby="ev-h">
            <div className="stack">
              <h3 id="ev-h" className="t-sm t-semibold">
                {t(K.detail.evidenceHeading)}
              </h3>
              <p className="t-xs t-muted">{t(K.detail.evidenceHint)}</p>
            </div>
            {p.evidence.length === 0 ? (
              <p className="t-sm t-muted">{t(K.detail.noEvidence)}</p>
            ) : (
              p.evidence.map((e, i) => (
                <div key={`${e.kind}-${i}`} className="row between gap-2" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
                  <span className="stack" style={{ minWidth: 0 }}>
                    <span className="t-sm">{t(K.evidence[e.kind])}</span>
                    <span className="t-xs t-muted">
                      {[e.at ? formatDateTime(e.at, lang) : null, e.by, e.kind === 'net_elapsed' && e.ref ? t(K.evidence.netDays, { count: Number(e.ref) }) : e.ref].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {e.route && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(e.route!)}>
                      {t(K.evidence.open)}
                    </Button>
                  )}
                </div>
              ))
            )}
          </section>

          {p.status === 'held' && (p.heldAuto || p.heldReason) && (
            <p className="t-sm" role="note">
              {p.heldAuto ? t(K.detail.heldAuto) : t(K.detail.heldBecause, { reason: p.heldReason, name: p.heldByName ?? '' })}
            </p>
          )}
          <div className="row gap-2 wrap">
            <Button size="sm" variant="ghost" onClick={() => navigate(`/supplier-payment-release?payment=${p.id}`)}>
              {t(K.detail.seeChain)}
            </Button>
            {p.status === 'executed' && (
              <Button size="sm" variant="ghost" onClick={() => navigate(`/supplier-payment-history?payment=${p.id}`)}>
                {t(K.detail.seeHistory)}
              </Button>
            )}
            {p.part === 'balance' && (
              <Button size="sm" variant="ghost" onClick={() => navigate(`/supplier-invoices?po=${p.poId}`)}>
                {t(K.detail.seeInvoices)}
              </Button>
            )}
          </div>
          {p.status === 'executed' && p.bankReference && <p className="t-sm">{t(K.detail.reference, { ref: p.bankReference })}</p>}

          {p.status === 'pending_approval' && gateHold && !blocked && <Checkbox checked={s.acknowledged} onChange={s.setAcknowledged} label={<span className="t-sm">{t(K.detail.acknowledge)}</span>} />}
          {blocked && p.status === 'pending_approval' && <p className="t-sm t-error">{t(p.flags.some((f) => f.kind === 'invoice_unmatched') ? K.detail.invoiceNote : K.detail.blockedNote)}</p>}

          {p.status === 'pending_approval' && (
            <div className="row gap-2 wrap">
              <Button disabled={s.busy || blocked || (gateHold && !s.acknowledged)} onClick={async () => report(await s.approve(p), K.toast.approved, { minutes: s.queue?.limits.reversalMinutes ?? 10 })}>
                {t(gateHold ? K.action.approveAnyway : K.action.approve)}
              </Button>
              <Button variant="secondary" disabled={s.busy} onClick={() => s.openHold(p)}>
                {t(K.action.hold)}
              </Button>
            </div>
          )}
          {p.status === 'held' && (
            <Button variant="secondary" disabled={s.busy} onClick={async () => report(await s.release(p), K.toast.released)}>
              {t(K.action.release)}
            </Button>
          )}

          <section className="stack gap-1" aria-labelledby="hist-h">
            <h3 id="hist-h" className="t-sm t-semibold">
              {t(K.detail.historyHeading)}
            </h3>
            {[...p.events].reverse().map((e) => (
              <span key={e.id} className="t-xs t-muted">
                {t(K.event[e.kind])} · {t(K.detail.by, { name: e.byName })} · {formatDateTime(e.at, lang)}
                {e.note ? ` · ${e.note}` : ''}
              </span>
            ))}
          </section>
        </div>
      )}
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
      <dt className="t-muted">{label}</dt>
      <dd style={{ textAlign: 'end', margin: 0 }}>{value}</dd>
    </div>
  );
}

/* --------------------------------------------------------------- sheets */

function HoldSheet({ s, t, report }: { s: SupplierPaymentApprovalState; t: T; report: Report }) {
  return (
    <Sheet open={!!s.holdFor} onClose={() => s.setHoldFor(null)} title={t(K.hold.title)} closeLabel={t(K.action.close)}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.hold.intro)}</p>
        <Field label={t(K.hold.reason)} hint={t(K.hold.reasonHint)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.reason} onChange={(e) => s.setReason(e.target.value)} />}
        </Field>
        <Button disabled={s.busy || s.reason.trim().length < 4} onClick={async () => report(await s.confirmHold(), K.toast.held)}>
          {t(K.hold.confirm)}
        </Button>
      </div>
    </Sheet>
  );
}

function ReverseSheet({ s, t, report }: { s: SupplierPaymentApprovalState; t: T; report: Report }) {
  return (
    <Sheet open={!!s.reverseFor} onClose={() => s.setReverseFor(null)} title={t(K.reverse.title)} closeLabel={t(K.action.close)}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.reverse.intro)}</p>
        <Field label={t(K.reverse.reason)} required>
          {({ id }) => <TextArea id={id} rows={2} value={s.reverseReason} onChange={(e) => s.setReverseReason(e.target.value)} />}
        </Field>
        <Button disabled={s.busy || s.reverseReason.trim().length < 4} onClick={async () => report(await s.confirmReverse(), K.toast.reversed)}>
          {t(K.reverse.confirm)}
        </Button>
      </div>
    </Sheet>
  );
}

function BatchSheet({ s, t, report }: { s: SupplierPaymentApprovalState; t: T; report: Report }) {
  const toast = useToast();
  return (
    <Sheet open={s.batchOpen} onClose={() => s.setBatchOpen(false)} title={t(K.batch.title, { count: s.chosen.length })} closeLabel={t(K.action.close)}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.batch.intro)}</p>
        <div className="stack">
          {s.chosen.map((p) => (
            <div key={p.id} className="row between gap-2" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
              <span className="stack" style={{ minWidth: 0 }}>
                <strong className="t-sm">{p.supplierName}</strong>
                <span className="t-xs t-muted">
                  {p.poCode} · {t(K.part[p.part])} · {t(K.trigger[p.trigger])}
                </span>
              </span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(p.amount)}</strong>
            </div>
          ))}
        </div>
        <div className="row between gap-2" style={{ borderTop: '2px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
          <strong>{t(K.batch.total)}</strong>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(s.chosenTotal)}</strong>
        </div>
        <Button
          disabled={s.busy || s.chosen.length === 0}
          onClick={async () => {
            const r = await s.confirmBatch();
            report(r, K.toast.batch, { count: r.batch?.approved.length ?? 0, minutes: s.queue?.limits.reversalMinutes ?? 10 });
            if (r.ok && r.batch && r.batch.skipped.length > 0) toast.push(t(K.batch.skipped, { count: r.batch.skipped.length }), 'warning');
          }}
        >
          {t(K.batch.confirm, { count: s.chosen.length, amount: formatINR(s.chosenTotal) })}
        </Button>
      </div>
    </Sheet>
  );
}
