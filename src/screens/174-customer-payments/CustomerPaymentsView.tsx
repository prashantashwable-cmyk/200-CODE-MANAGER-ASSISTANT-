import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Phone } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, formatDate, formatINR } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { CustomerPayStage, CustomerPayView } from '@/data/repository';
import { PAYMENT_KEYS as K, checkoutPath, historyPath, loanPath, receiptPath, receiptsPath } from './customer-payments.types';
import { useCustomerPayments } from './useCustomerPayments';
import type { CustomerPaymentsState } from './useCustomerPayments';

type T = ReturnType<typeof useTranslation>['t'];
type Project = NonNullable<CustomerPayView['project']>;
const stageName = (t: T, stage: string) => t(`customerPayments.stage.${stage}`);
const toneOf = (s: CustomerPayStage['state']) => (s === 'paid' || s === 'refunded' ? 'success' : s === 'overdue' ? 'warning' : s === 'confirming' || s === 'due' ? 'accent' : 'neutral');

/** Screen 174 — Payments (customer view). One project's payment schedule, receipts and financing option in one calm place: what is due and when is the first thing said, a payment being confirmed or in question is never shown as late, and each project keeps its own schedule. */
export function CustomerPaymentsScreen() {
  const { t } = useTranslation();
  const s = useCustomerPayments();
  const v = s.view;
  const head = () => <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !v) return <Screen width="default">{head()}<LoadingState label={t(K.loading)} variant="stats" rows={3} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="default">{head()}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const p = v.project;
  if (!p) return <Screen width="default">{head()}<EmptyState title={t(K.empty.title)} body={t(K.empty.body)} /></Screen>;
  const payable = p.stages.find((x) => x.id === p.hero.paymentId) ?? null;
  const open = p.stages.find((x) => x.id === s.stageId) ?? null;
  return (
    <Screen width="default">
      {head()}
      {v.projects.length > 1 && (
        <div className="stack gap-1 mb-3" data-switcher>
          <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 4 }}>
            {v.projects.map((x) => <span key={x.dealId} data-project={x.dealId} style={{ flex: '0 0 auto' }}><Chip pressed={x.dealId === p.dealId} onClick={() => s.pick(x.dealId)}>{x.siteName}{x.outstanding > 0 ? ` · ${formatINR(x.outstanding)}` : ''}</Chip></span>)}
          </div>
          <p className="t-xs t-muted">{t(K.project.separate)}</p>
        </div>
      )}
      {s.offline && <p className="t-xs t-muted mb-2" data-offline>{t(K.offline)}</p>}
      <div className="main-aside">
        <div className="stack gap-3" data-main>
          <Hero p={p} payable={payable} t={t} />
          <Summary p={p} t={t} />
          <Schedule p={p} s={s} t={t} />
        </div>
        <div className="stack gap-3" data-aside>
          <Loan p={p} s={s} t={t} />
          <Reminders p={p} t={t} />
          <Received p={p} s={s} t={t} />
          <Help phone={v.supportPhone} t={t} />
        </div>
      </div>
      {payable && (p.hero.kind === 'overdue' || p.hero.kind === 'due') && (
        <ActionBar>
          <Button className="grow" block data-pay-now={payable.id} onClick={() => s.goTo(checkoutPath(payable.id))}>{t(K.hero.payNow, { amount: formatINR(payable.remaining) })}</Button>
        </ActionBar>
      )}
      <Sheet open={!!open} onClose={s.closeStage} title={open ? stageName(t, open.stage) : ''} closeLabel={t(K.close)}>
        {open && <StageDetail stage={open} supportPhone={v.supportPhone} s={s} t={t} />}
      </Sheet>
    </Screen>
  );
}

function Hero({ p, payable, t }: { p: Project; payable: CustomerPayStage | null; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const h = p.hero;
  const when = h.dueAt ? formatDate(h.dueAt, lang) : '';
  const confirming = p.stages.find((x) => x.state === 'confirming');
  const body = h.kind === 'overdue' ? t(K.hero.overdue.body, { date: when, count: h.days })
    : h.kind === 'due' ? t(K.hero.due.body, { date: when })
    : h.kind === 'confirming' ? t(K.hero.confirming.body, { amount: formatINR(confirming?.confirming?.amount ?? h.amount) })
    : h.kind === 'disputed' ? t(K.hero.disputed.body, { amount: formatINR(h.amount) })
    : h.kind === 'upcoming' ? t(K.hero.upcoming.body, { amount: formatINR(p.stages.find((x) => x.state === 'upcoming')?.remaining ?? h.amount), date: when })
    : h.kind === 'complete' ? t(K.hero.complete.body, { amount: formatINR(p.received) }) : t(K.hero.empty.body);
  const title = h.kind === 'overdue' || h.kind === 'due' ? t(K.hero[h.kind].title, { amount: formatINR(h.amount) })
    : h.kind === 'disputed' ? t(K.hero.disputed.title)
    : h.kind === 'confirming' ? t(K.hero.confirming.title)
    : h.kind === 'upcoming' ? t(K.hero.upcoming.title)
    : h.kind === 'complete' ? t(K.hero.complete.title) : t(K.hero.empty.title);
  return (
    <Card>
      <div className="stack gap-2" data-hero={h.kind}>
        <p className="t-xs t-muted">{p.siteName} · {p.code}</p>
        <h2 className="t-xl t-semibold">{title}</h2>
        <p className="t-sm">{body}</p>
        {payable && (h.kind === 'overdue' || h.kind === 'due') && <p className="t-xs t-muted">{t(K.hero.forStage, { stage: stageName(t, payable.stage) })}</p>}
        {p.workHeld && <p className="t-sm t-muted" data-held>{t(K.held.body)}</p>}
      </div>
    </Card>
  );
}

function Summary({ p, t }: { p: Project; t: T }) {
  if (p.agreedTotal <= 0) return null;
  return (
    <Card>
      <div className="stack gap-2" data-summary>
        <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.paid)}</span><span className="t-lg t-semibold t-mono">{formatINR(p.received)}</span></span>
          <span className="stack gap-0" style={{ textAlign: 'right' }}><span className="t-xs t-muted">{t(K.summary.remaining)}</span><span className="t-lg t-semibold t-mono">{formatINR(p.remaining)}</span></span>
        </div>
        <ProgressBar value={p.percentPaid} label={t(K.summary.percent, { percent: Math.round(p.percentPaid * 100) })} />
        <p className="t-xs t-muted">{t(K.summary.percent, { percent: Math.round(p.percentPaid * 100) })} · {t(K.summary.total)} {formatINR(p.agreedTotal)}</p>
        {p.inQuestion > 0 && <p className="t-xs t-muted" data-in-question>{t(K.summary.inQuestion, { amount: formatINR(p.inQuestion) })}</p>}
      </div>
    </Card>
  );
}

function rowMeta(x: CustomerPayStage, t: T, lang: string): string {
  if (x.state === 'paid') return x.paidAt || x.lastReceivedAt ? t(K.row.paidOn, { date: formatDate((x.paidAt ?? x.lastReceivedAt) as string, lang) }) : t(K.state.paid);
  if (x.state === 'confirming') return t(K.row.confirming, { amount: formatINR(x.confirming?.amount ?? x.remaining) });
  if (x.state === 'disputed') return x.dispute?.raisedAt ? t(K.row.raised, { date: formatDate(x.dispute.raisedAt, lang) }) : t(K.row.raisedNoDate);
  if (x.state === 'refunded') return t(K.row.refund, { amount: formatINR(x.dispute?.refundAmount ?? x.amount) });
  if (x.received > 0) return t(K.row.partial, { received: formatINR(x.received), remaining: formatINR(x.remaining) });
  return t(K.row.dueOn, { date: formatDate(x.dueDate, lang) });
}

function Schedule({ p, s, t }: { p: Project; s: CustomerPaymentsState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const firstOpen = p.stages.findIndex((x) => x.state !== 'paid' && x.state !== 'refunded');
  const steps: AscensionStep[] = p.stages.map((x, i) => ({
    id: x.id,
    label: stageName(t, x.stage),
    meta: rowMeta(x, t, lang),
    status: x.state === 'paid' || x.state === 'refunded' ? 'complete' : i === firstOpen ? 'current' : 'upcoming',
    onClick: () => s.openStage(x.id),
    trailing: (
      <span className="stack gap-1" style={{ alignItems: 'flex-end' }} data-stage={x.id} data-state={x.state}>
        <span className="t-sm t-semibold t-mono">{formatINR(x.state === 'paid' ? x.amount : x.remaining || x.amount)}</span>
        <Badge tone={toneOf(x.state)}>{t(`customerPayments.state.${x.state}`)}</Badge>
      </span>
    ),
  }));
  return (
    <Card>
      <div className="stack gap-2" data-schedule>
        <h2 className="t-md t-semibold">{t(K.section.schedule)}</h2>
        <AscensionLine steps={steps} />
      </div>
    </Card>
  );
}

function Loan({ p, s, t }: { p: Project; s: CustomerPaymentsState; t: T }) {
  const l = p.loan;
  if (l.state === 'hidden') return null;
  return (
    <Card>
      <div className="stack gap-2" data-loan={l.state}>
        <h2 className="t-md t-semibold">{t(K.section.loan)}</h2>
        <p className="t-sm t-muted">{t(`customerPayments.loan.${l.state}.body`, { amount: formatINR(l.loanable) })}</p>
        {l.state === 'available' && <div><Button size="sm" variant="secondary" onClick={() => s.goTo(loanPath(p.dealId))}>{t(K.loan.available.cta)}</Button></div>}
        {(l.state === 'in_progress' || l.state === 'approved') && <div><Button size="sm" variant="secondary" onClick={() => s.goTo(loanPath(p.dealId))}>{t(K.loan.view)}</Button></div>}
      </div>
    </Card>
  );
}

function Reminders({ p, t }: { p: Project; t: T }) {
  const { i18n } = useTranslation();
  if (p.stages.every((x) => x.state === 'paid' || x.state === 'refunded')) return null;
  return (
    <Card>
      <div className="stack gap-1" data-reminders>
        <h2 className="t-md t-semibold">{t(K.section.reminders)}</h2>
        {p.remindersPaused ? <p className="t-sm t-muted">{t(K.reminders.paused)}</p>
          : p.reminders.length === 0 ? <p className="t-sm t-muted">{t(K.reminders.none)}</p>
          : p.reminders.map((r) => <p key={`${r.at}${r.channel}`} className="t-sm" data-reminder>{t(K.reminders.line, { date: formatDate(r.at, i18n.language), channel: t(`commChannel.${r.channel}`) })}</p>)}
        <p className="t-xs t-muted">{t(K.reminders.body)}</p>
      </div>
    </Card>
  );
}

function Received({ p, s, t }: { p: Project; s: CustomerPaymentsState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const got = p.stages.filter((x) => x.received > 0).sort((a, b) => (b.lastReceivedAt ?? '').localeCompare(a.lastReceivedAt ?? '')).slice(0, 4);
  return (
    <Card>
      <div className="stack gap-2" data-received>
        <h2 className="t-md t-semibold">{t(K.section.received)}</h2>
        {got.length === 0 ? <p className="t-sm t-muted">{t(K.received.empty)}</p> : got.map((x) => (
          <div key={x.id} className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }} data-receipt={x.id}>
            <button type="button" className="stack gap-0" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer' }} onClick={() => s.openStage(x.id)}>
              <span className="t-sm">{stageName(t, x.stage)}</span>
              <span className="t-xs t-muted">{x.lastReceivedAt ? formatDate(x.lastReceivedAt, lang) : ''}{x.method ? ` · ${t(`documentVault.method.${x.method}`)}` : ''}</span>
            </button>
            <span className="t-sm t-semibold t-mono">{formatINR(x.received)}</span>
          </div>
        ))}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" onClick={() => s.goTo(receiptsPath)}>{t(K.received.documents)}</Button>
          <Button size="sm" variant="ghost" onClick={() => s.goTo(historyPath)}>{t(K.received.history)}</Button>
        </div>
      </div>
    </Card>
  );
}

function Help({ phone, t }: { phone: string | null; t: T }) {
  if (!phone) return null;
  return (
    <Card>
      <div className="stack gap-2" data-help>
        <h2 className="t-md t-semibold">{t(K.section.help)}</h2>
        <p className="t-sm t-muted">{t(K.help.body)}</p>
        <div><a className="ds-btn ds-btn--secondary ds-btn--sm" href={`tel:${phone}`}><Phone size={14} aria-hidden="true" /> {t(K.detail.call)}</a></div>
      </div>
    </Card>
  );
}

function StageDetail({ stage: x, supportPhone, s, t }: { stage: CustomerPayStage; supportPhone: string | null; s: CustomerPaymentsState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const fact = (label: string, value: string) => <div className="row gap-2" style={{ justifyContent: 'space-between' }}><dt className="t-sm t-muted">{label}</dt><dd className="t-sm t-mono" style={{ margin: 0 }}>{value}</dd></div>;
  const d = x.dispute;
  return (
    <div className="stack gap-3" data-detail={x.id}>
      <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}><Badge tone={toneOf(x.state)}>{t(`customerPayments.state.${x.state}`)}</Badge><span className="t-xs t-muted">{x.code}</span></div>
      <dl className="stack gap-1">
        {fact(t(K.detail.amount), formatINR(x.amount))}
        {x.received > 0 && fact(t(K.detail.received), formatINR(x.received))}
        {x.remaining > 0 && x.state !== 'paid' && x.state !== 'confirming' && fact(t(K.detail.remaining), formatINR(x.remaining))}
        {fact(t(K.detail.due), formatDate(x.dueDate, lang))}
        {x.state === 'paid' && x.paidAt && fact(t(K.detail.paidOn), formatDate(x.paidAt, lang))}
        {x.method && x.received > 0 && fact(t(K.detail.method), t(`documentVault.method.${x.method}`))}
        {x.reference && x.received > 0 && fact(t(K.detail.reference), x.reference)}
      </dl>
      {x.confirming?.basis === 'gateway' && <p className="t-sm" data-note="gateway">{t(K.detail.confirming.gateway)}</p>}
      {x.confirming?.basis === 'bank' && <p className="t-sm" data-note="bank">{t(K.detail.confirming.bank, { amount: formatINR(x.confirming.amount), date: x.confirming.at ? formatDate(x.confirming.at, lang) : '' })}</p>}
      {d && d.state === 'open' && <p className="t-sm" data-note="dispute">{t(K.detail.dispute.open)}</p>}
      {d && d.state === 'decided' && d.outcome && <p className="t-sm" data-note="decided">{d.outcome === 'rejected' ? t(K.detail.dispute.rejected) : t(`customerPayments.detail.dispute.${d.outcome}`, { amount: formatINR(d.refundAmount ?? 0) })}</p>}
      {x.state === 'upcoming' && <p className="t-sm t-muted">{t(K.detail.later)}</p>}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        {x.payable && <Button data-act="pay" onClick={() => s.goTo(checkoutPath(x.id))}>{t(K.detail.pay, { amount: formatINR(x.remaining) })}</Button>}
        {x.receiptDocId && <Button variant="secondary" data-act="receipt" onClick={() => s.goTo(receiptPath(x.receiptDocId as string))}>{t(K.detail.receipt)}</Button>}
        {supportPhone && (x.state === 'confirming' || x.state === 'disputed' || x.state === 'overdue') && <a className="ds-btn ds-btn--ghost" href={`tel:${supportPhone}`}><Phone size={16} aria-hidden="true" /> {t(K.detail.call)}</a>}
      </div>
    </div>
  );
}
