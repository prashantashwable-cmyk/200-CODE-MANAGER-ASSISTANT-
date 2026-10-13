import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CaretDown, CaretUp, DownloadSimple, Phone, WhatsappLogo } from '@phosphor-icons/react';
import { AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, Toggle, formatDate, formatINR, useToast } from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { DisbursementBoardView, DisbursementDetailView, DisbursementRowView, PayoutRunView, ReadyPartnerView } from '@/data/repository';
import { ATTENTION_DUE, CHANNELS, DISBURSEMENT_KEYS as K, FAILURES, NOTE_MIN, PAGE, PULL_DISTANCE, SETTLE_MS, STATES, UPI_LIMIT } from './payout-disbursement.types';
import type { Channel, DisbursementStatus, FailureReason } from './payout-disbursement.types';
import { usePayoutDisbursement } from './usePayoutDisbursement';
import type { ActionResult, PayoutDisbursementState } from './usePayoutDisbursement';

type T = ReturnType<typeof useTranslation>['t'];
const STATUS_TONE: Record<DisbursementStatus, BadgeTone> = { initiated: 'neutral', processing: 'accent', completed: 'success', failed: 'error', cancelled: 'neutral' };
const reasonLabel = (t: T, key: string) => t(key, { defaultValue: key });
const problemText = (t: T, p: string) => t(`payoutDisbursement.problem.${p}`, { min: NOTE_MIN, defaultValue: t(K.problem.generic) });
const failureLabel = (t: T, f: FailureReason) => t(K.failure[f]);
const lettersOf = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const whenOf = (iso: string, lang: string) => new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const weekdayName = (day: number, lang: string) => new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(new Date(2024, 0, 7 + day));

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}
function Fact({ label, value }: { label: string; value: string }) {
  return <div className="row between" style={{ gap: 'var(--space-3)' }}><dt className="t-xs t-muted">{label}</dt><dd className="t-sm" style={{ margin: 0, textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</dd></div>;
}

/**
 * Screen 164 — Automated Payout Disbursement. The engine behind the approval queue (163): the weekly run and individual urgent sends, the live status of every transfer, what
 * failed and why (with a direct path to put the partner's details right and send again), and the history reconciliation reads. A partner is waiting on money they earned, so
 * a failure is never left to sit: it is an alert, a standing task, and the first thing in the list.
 */
export function PayoutDisbursementScreen() {
  const { t } = useTranslation();
  const s = usePayoutDisbursement();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  if (s.load === 'loading' && !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={4} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' || !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const d = s.data;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-payout-disbursement>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <div className="stack gap-4">
          <Kpis d={d} s={s} t={t} />
          <NextRun d={d} s={s} t={t} />
          <Ready d={d} s={s} t={t} />
          <Runs d={d} s={s} t={t} />
          <History d={d} s={s} t={t} />
          <Rail d={d} s={s} t={t} />
          <p className="t-xs t-muted" data-note-ledger>{t(K.note.ledger)}</p>
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { upi: formatINR(UPI_LIMIT), upiSecs: Math.round(SETTLE_MS.upi / 1000), bankMins: Math.round(SETTLE_MS.bank_transfer / 60_000), due: Math.round(ATTENTION_DUE / 3_600_000) })}</p>
        </div>
      </Screen>
      <Detail s={s} t={t} />
      <AccountSheet s={s} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ The four figures */

function Kpis({ d, s, t }: { d: DisbursementBoardView; s: PayoutDisbursementState; t: T }) {
  const k = d.kpis;
  const card = (id: string, label: string, amount: number, caption: string, onClick: () => void, opts: { hero?: boolean; alarm?: boolean; extra?: string | null } = {}) => (
    <Card onClick={onClick}>
      <div className="stack gap-1" data-kpi={id} style={{ cursor: 'pointer', ...(opts.alarm ? { borderLeft: '3px solid var(--color-error)', paddingLeft: 'var(--space-3)' } : {}) }}>
        <span className="t-xs t-muted">{label}</span>
        <span className="num t-semibold" style={{ fontSize: opts.hero ? 'var(--text-3xl, 2.25rem)' : 'var(--text-2xl, 1.75rem)', lineHeight: 1.1 }} data-value>{formatINR(amount)}</span>
        <span className="t-xs">{caption}</span>
        {opts.extra && <span className="t-xs t-muted">{opts.extra}</span>}
      </div>
    </Card>
  );
  return (
    <div className="stack gap-3" data-kpis>
      {card('ready', t(K.kpi.ready.label), k.ready.amount, k.ready.count === 0 ? t(K.kpi.ready.none) : t(K.kpi.ready.caption, { count: k.ready.count, partners: k.ready.partners }), () => document.querySelector('[data-ready]')?.scrollIntoView({ behavior: 'smooth' }), { hero: true, extra: k.ready.urgent > 0 ? t(K.kpi.ready.urgent, { count: k.ready.urgent }) : null })}
      <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties}>
        {card('inflight', t(K.kpi.inFlight.label), k.inFlight.amount, k.inFlight.count === 0 ? t(K.kpi.inFlight.none) : t(K.kpi.inFlight.caption, { count: k.inFlight.count }), () => s.setState('processing'))}
        {card('failed', t(K.kpi.failed.label), k.failed.amount, k.failed.count === 0 ? t(K.kpi.failed.none) : t(K.kpi.failed.caption, { count: k.failed.count, days: k.failed.oldestDays ?? 0 }), () => s.setState('attention'), { alarm: k.failed.count > 0 })}
        {card('completed', t(K.kpi.completed.label), k.completed.amount, k.completed.count === 0 ? t(K.kpi.completed.none) : t(K.kpi.completed.caption, { count: k.completed.count }), () => s.setState('completed'))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ The weekly run */

function NextRun({ d, s, t }: { d: DisbursementBoardView; s: PayoutDisbursementState; t: T }) {
  const { i18n } = useTranslation();
  const [sched, setSched] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const toast = useToast();
  const sch = d.schedule;
  const sendable = d.ready.filter((r) => !r.blocked);
  const startNow = async () => {
    const res = await s.startRun();
    setConfirm(false);
    if (!res.ok) { toast.push(problemText(t, res.problem)); return; }
    toast.push(t(K.run.started, { code: res.value.run?.code ?? '', count: res.value.disbursements.length }));
  };
  return (
    <section className="stack gap-2" data-next-run>
      <Card>
        <div className="stack gap-2">
          <h2 className="t-md t-semibold">{t(K.next.heading)}</h2>
          <p className="t-sm" data-next-when>{sch.nextRunAt ? t(K.next.when, { when: whenOf(sch.nextRunAt, i18n.language) }) : t(K.next.off)}</p>
          {sch.lastRunAt && <p className="t-xs t-muted">{t(K.next.last, { when: whenOf(sch.lastRunAt, i18n.language) })}</p>}
          <p className="t-xs t-muted">{sch.consolidate ? t(K.next.consolidated) : t(K.next.separate)}</p>
          <div className="row gap-2 wrap">
            <Button size="sm" data-run-now disabled={sendable.length === 0} onClick={() => setConfirm(true)}>{t(K.next.runNow)}</Button>
            <Button size="sm" variant="secondary" data-schedule-open onClick={() => setSched(true)}>{t(K.next.change)}</Button>
          </div>
        </div>
      </Card>
      <ScheduleSheet open={sched} onClose={() => setSched(false)} d={d} s={s} t={t} />
      <Sheet open={confirm} onClose={() => setConfirm(false)} title={t(K.run.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-run-confirm>
          <p className="t-sm">{t(K.run.body, { count: sendable.length, amount: formatINR(sendable.reduce((a, r) => a + r.amount, 0)) })}</p>
          <Footer><Button variant="ghost" onClick={() => setConfirm(false)}>{t(K.cancel)}</Button><Button data-run-confirm-go onClick={() => void startNow()}>{t(K.run.confirm)}</Button></Footer>
        </div>
      </Sheet>
    </section>
  );
}

function ScheduleSheet({ open, onClose, d, s, t }: { open: boolean; onClose: () => void; d: DisbursementBoardView; s: PayoutDisbursementState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const [enabled, setEnabled] = useState(d.schedule.enabled);
  const [weekday, setWeekday] = useState(d.schedule.weekday);
  const [hour, setHour] = useState(d.schedule.hour);
  const [consolidate, setConsolidate] = useState(d.schedule.consolidate);
  const [seenOpen, setSeenOpen] = useState(false);
  if (open !== seenOpen) { setSeenOpen(open); if (open) { setEnabled(d.schedule.enabled); setWeekday(d.schedule.weekday); setHour(d.schedule.hour); setConsolidate(d.schedule.consolidate); } }
  const save = async () => {
    const res = await s.saveSchedule({ enabled, weekday, hour, consolidate });
    if (!res.ok) { toast.push(problemText(t, res.problem)); return; }
    toast.push(t(K.schedule.saved));
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={t(K.schedule.title)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-schedule-sheet>
        <Toggle checked={enabled} onChange={setEnabled} label={t(K.schedule.enabled)} description={t(K.schedule.enabledHint)} />
        <Field label={t(K.schedule.weekday)}>{(p) => <Select id={p.id} value={String(weekday)} onChange={(e) => setWeekday(Number(e.target.value))} data-f="weekday">{[1, 2, 3, 4, 5, 6, 0].map((x) => <option key={x} value={x}>{weekdayName(x, i18n.language)}</option>)}</Select>}</Field>
        <Field label={t(K.schedule.hour)}>{(p) => <Select id={p.id} value={String(hour)} onChange={(e) => setHour(Number(e.target.value))} data-f="hour">{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</Select>}</Field>
        <Toggle checked={consolidate} onChange={setConsolidate} label={t(K.schedule.consolidate)} description={t(K.schedule.consolidateHint)} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.cancel)}</Button><Button data-schedule-save onClick={() => void save()}>{t(K.schedule.save)}</Button></Footer>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ Cleared and waiting */

function Ready({ d, s, t }: { d: DisbursementBoardView; s: PayoutDisbursementState; t: T }) {
  const [send, setSend] = useState<ReadyPartnerView | null>(null);
  const toast = useToast();
  const go = async (r: ReadyPartnerView) => {
    const res = await s.sendNow(r.partnerId, r.entryIds);
    setSend(null);
    if (!res.ok) { toast.push(problemText(t, res.problem)); return; }
    toast.push(t(K.ready.sent, { code: res.value.disbursements.map((x) => x.code).join(', ') }));
  };
  return (
    <section className="stack gap-2" data-ready>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.ready.heading)}</h2><p className="t-sm">{t(K.ready.body)}</p></div>
      {d.ready.length === 0 ? <Card><p className="t-sm" data-ready-none>{t(K.ready.empty)}</p><div className="mt-2"><Button size="sm" variant="ghost" onClick={() => s.goTo('/payout-approval')}>{t(K.ready.openApproval)}</Button></div></Card> : (
        <div className="grid-auto" style={{ '--min': '300px' } as React.CSSProperties}>
          {d.ready.map((r) => (
            <Card key={r.partnerId}>
              <div className="stack gap-2" data-ready-partner={r.partnerId} data-blocked={r.blocked ?? ''}>
                <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <span className="stack" style={{ minWidth: 0 }}><strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{r.name}</strong><span className="t-xs t-muted">{t(K.role[r.role])} · {t(K.ready.entries, { count: r.entryCount })}{r.method ? ` · ${t(K.method[r.method])}` : ''}</span></span>
                  <span className="stack" style={{ alignItems: 'flex-end' }}><span className="num t-semibold">{formatINR(r.amount)}</span>{r.urgentCount > 0 && <Badge tone="accent">{t(K.ready.urgent, { count: r.urgentCount })}</Badge>}</span>
                </div>
                {r.blocked && <p className="t-xs" data-blocked-reason style={{ color: 'var(--color-error)' }}>{t(K.ready.blocked[r.blocked])}</p>}
                <span className="row gap-2 wrap">
                  {!r.blocked && <Button size="sm" data-send-now={r.partnerId} onClick={() => setSend(r)}>{t(K.ready.sendNow)}</Button>}
                  {r.blocked === 'no_details' && <Button size="sm" data-add-details={r.partnerId} onClick={() => s.openPartner(r.partnerId)}>{t(K.ready.addDetails)}</Button>}
                  {r.blocked === 'failed_open' && <Button size="sm" variant="secondary" data-open-failed={r.partnerId} onClick={() => { s.setQInput(r.name); s.setState('attention'); }}>{t(K.ready.openFailed)}</Button>}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Sheet open={!!send} onClose={() => setSend(null)} title={send ? t(K.ready.sendTitle, { name: send.name }) : ''} closeLabel={t(K.close)}>
        {send && (
          <div className="stack gap-3" data-send-sheet>
            <p className="t-sm">{t(K.ready.sendBody, { count: 1, where: send.method ? t(K.method[send.method]) : '', amount: formatINR(send.amount) })}</p>
            <Footer><Button variant="ghost" onClick={() => setSend(null)}>{t(K.cancel)}</Button><Button data-send-confirm onClick={() => void go(send)}>{t(K.ready.sendConfirm, { amount: formatINR(send.amount) })}</Button></Footer>
          </div>
        )}
      </Sheet>
    </section>
  );
}

/* ------------------------------------------------------------------ Runs */

function Runs({ d, s, t }: { d: DisbursementBoardView; s: PayoutDisbursementState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const retryAll = async (r: PayoutRunView) => {
    const res = await s.retryRun(r.id);
    if (!res.ok) { toast.push(problemText(t, res.problem)); return; }
    toast.push(t(K.runs.retried, { count: res.value.disbursements.length }));
    if (res.value.skipped.length > 0) toast.push(t(K.runs.retrySkipped, { count: res.value.skipped.length }));
  };
  return (
    <section className="stack gap-2" data-runs>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.runs.heading)}</h2><p className="t-sm">{t(K.runs.body)}</p></div>
      {d.runs.length === 0 ? <Card><p className="t-sm">{t(K.runs.empty)}</p></Card> : (
        <div className="grid-auto" style={{ '--min': '320px' } as React.CSSProperties}>
          {d.runs.map((r) => (
            <Card key={r.id}>
              <div className="stack gap-2" data-run={r.id} data-run-status={r.status}>
                <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <span className="stack"><strong className="t-sm">{r.code}</strong><span className="t-xs t-muted">{t(K.runs.kind[r.kind])} · {formatDate(r.startedAt, i18n.language)}</span></span>
                  <Badge tone={r.status === 'completed' ? 'success' : r.status === 'interrupted' ? 'warning' : 'accent'}>{t(K.runs.status[r.status])}</Badge>
                </div>
                <p className="t-sm" data-run-breakdown>{t(K.runs.breakdown, { sent: r.sent, completed: r.completed, processing: r.processing, failed: r.failed })}</p>
                <p className="t-xs t-muted">{t(K.runs.amounts, { done: formatINR(r.completedAmount), total: formatINR(r.amount) })}</p>
                {r.interruptedReason && <p className="t-xs" data-run-interrupted style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>{t(r.interruptedReason === 'bank_unavailable' ? K.runs.interrupted.bank_unavailable : K.runs.interrupted.rail)}</p>}
                {r.skipped.length > 0 && (
                  <div className="stack gap-1">
                    <Button size="sm" variant="ghost" aria-expanded={open === r.id} icon={open === r.id ? <CaretUp size={14} /> : <CaretDown size={14} />} data-run-skipped-toggle onClick={() => setOpen(open === r.id ? null : r.id)}>{t(K.runs.skippedHeading)} · {r.skipped.length}</Button>
                    {open === r.id && <ul className="stack gap-1" style={{ margin: 0, paddingLeft: 'var(--space-4)' }} data-run-skipped>{r.skipped.map((x) => <li key={x.partnerId} className="t-xs">{x.partnerName} · {formatINR(x.amount)} · {t(K.runs.skipReason[x.reason as 'no_details' | 'failed_open'])}</li>)}</ul>}
                  </div>
                )}
                {r.unfinishedIds.length > 0 && <div><Button size="sm" data-run-retry={r.id} onClick={() => void retryAll(r)}>{t(K.runs.retryAll, { count: r.unfinishedIds.length })}</Button></div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ Every transfer */

function History({ d, s, t }: { d: DisbursementBoardView; s: PayoutDisbursementState; t: T }) {
  const toast = useToast();
  const filtered = s.state !== 'all' || !!s.qInput;
  const counts = d.statusCounts;
  const countOf = (x: string) => (x === 'attention' ? counts.attention : x === 'processing' ? counts.processing + counts.initiated : counts[x as keyof typeof counts]);
  return (
    <section className="stack gap-3" data-history>
      <div className="row between wrap" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
        <h2 className="t-md t-semibold">{t(K.list.heading)}</h2>
        <Button size="sm" variant="secondary" icon={<DownloadSimple size={16} />} data-export disabled={d.total === 0} onClick={async () => { const n = await s.exportCsv({ status: (x) => t(K.status[x as DisbursementStatus]), reason: (x) => failureLabel(t, x as FailureReason) }); toast.push(t(K.list.exported, { count: n })); }}>{t(K.list.export)}</Button>
      </div>
      <div className="sticky-under-shell stack gap-2" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-filters>
        <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {([...STATES, 'all'] as const).map((x) => <span key={x} data-state-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.state === x} onClick={() => s.setState(x)}>{t(K.state[x])} · {x === 'all' ? counts.all : countOf(x)}</Chip></span>)}
        </div>
        <Input value={s.qInput} placeholder={t(K.search)} aria-label={t(K.search)} onChange={(e) => s.setQInput(e.target.value)} data-f="q" />
        {filtered && <div><Button size="sm" variant="ghost" data-clear onClick={s.clear}>{t(K.list.clear)}</Button></div>}
      </div>
      {d.total === 0 ? (
        counts.all === 0 && !filtered ? <EmptyState title={t(K.list.empty.title)} body={t(K.list.empty.body)} /> : <EmptyState title={t(K.list.noMatch)} body={t(K.list.noMatchBody)} />
      ) : (
        <>
          <p className="t-sm" data-count>{t(K.list.count, { count: d.total })}</p>
          <div className="grid-auto" style={{ '--min': '340px' } as React.CSSProperties} data-rows>{d.rows.map((r) => <Row key={r.id} r={r} s={s} t={t} />)}</div>
          {d.rows.length < d.total && <div><Button variant="secondary" data-show-more onClick={s.more}>{t(K.list.showMore)} · {Math.min(PAGE, d.total - d.rows.length)}</Button></div>}
        </>
      )}
    </section>
  );
}

function Row({ r, s, t }: { r: DisbursementRowView; s: PayoutDisbursementState; t: T }) {
  const { i18n } = useTranslation();
  const open = r.status === 'failed' && !r.continuedBy;
  return (
    <Card>
      <div role="button" tabIndex={0} className="stack gap-1" data-row={r.id} data-status={r.status} data-open={open ? '1' : '0'} style={{ cursor: 'pointer', ...(open ? { borderLeft: '3px solid var(--color-error)', paddingLeft: 'var(--space-3)' } : {}) }} onClick={() => s.openDisbursement(r.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.openDisbursement(r.id); } }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="stack" style={{ minWidth: 0 }}>
            <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{r.partnerName}</strong>
            <span className="t-xs t-muted">{r.code} · {t(K.method[r.method])}{r.destination ? ` · ${r.destination}` : ''}</span>
          </span>
          <span className="stack" style={{ alignItems: 'flex-end' }}><span className="num t-semibold">{formatINR(r.amount)}</span><Badge tone={STATUS_TONE[r.status]}>{t(K.status[r.status])}</Badge></span>
        </div>
        {r.failure && <span className="t-xs" data-failure style={{ color: open ? 'var(--color-error)' : undefined }}>{failureLabel(t, r.failure)}</span>}
        <span className="row gap-2 wrap t-xs t-muted">
          <span>{formatDate(r.completedAt ?? r.failedAt ?? r.createdAt, i18n.language)}</span>
          <span>{t(K.kind[r.kind])}</span>
          {r.runCode && <span>{r.runCode}</span>}
          {r.entryCount > 1 && <span>{t(K.row.entries, { count: r.entryCount })}</span>}
          {r.minutesOut !== null && <span>{t(K.row.out, { minutes: r.minutesOut })}</span>}
          {r.retryOfCode && <span>{t(K.row.retryOf, { code: r.retryOfCode })}</span>}
          {r.continuedBy && <span>{t(K.row.continued, { code: r.continuedBy })}</span>}
        </span>
        {open && r.needsDetails && <span className="t-xs" data-needs-details>{t(K.row.needsDetails)}</span>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ The banking partner (demo controls) */

function Rail({ d, s, t }: { d: DisbursementBoardView; s: PayoutDisbursementState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [down, setDown] = useState(d.rail.status === 'unavailable');
  const [after, setAfter] = useState(d.rail.interruptAfter === null ? '' : String(d.rail.interruptAfter));
  const apply = async () => {
    const res = await s.setRail({ status: down ? 'unavailable' : 'connected', interruptAfter: after.trim() === '' ? null : Math.max(0, Number(after) || 0) });
    toast.push(res.ok ? t(K.rail.saved) : problemText(t, res.problem));
  };
  return (
    <section className="stack gap-2" data-rail>
      <Button size="sm" variant="ghost" aria-expanded={open} icon={open ? <CaretUp size={14} /> : <CaretDown size={14} />} data-rail-toggle onClick={() => setOpen(!open)}>{t(K.rail.heading)} · {d.rail.status === 'connected' ? t(K.rail.connected) : t(K.state.failed)}</Button>
      {open && (
        <Card>
          <div className="stack gap-3" data-rail-panel>
            <p className="t-xs t-muted">{t(K.rail.demo)}</p>
            <p className="t-sm">{d.rail.status === 'connected' ? t(K.rail.connected) : t(K.rail.unavailable, { when: whenOf(d.rail.since, i18n.language) })}</p>
            <Toggle checked={down} onChange={setDown} label={t(K.rail.simulateOutage)} />
            <Field label={t(K.rail.interrupt)} hint={t(K.rail.interruptHint)}>{(p) => <Input id={p.id} type="number" min={0} value={after} onChange={(e) => setAfter(e.target.value)} data-f="interrupt-after" />}</Field>
            <div><Button size="sm" data-rail-apply onClick={() => void apply()}>{t(K.rail.save)}</Button></div>
          </div>
        </Card>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ One transfer */

function progressOf(t: T, d: DisbursementDetailView): AscensionStep[] {
  const r = d.row;
  const failed = r.status === 'failed';
  const cancelled = r.status === 'cancelled';
  return [
    { id: 'initiated', label: t(K.detail.progress.initiated), meta: r.sentAt ?? r.createdAt ? undefined : undefined, status: 'complete' },
    { id: 'processing', label: t(K.detail.progress.processing), status: r.sentAt || r.status === 'completed' ? (r.status === 'processing' ? 'current' : 'complete') : failed || cancelled ? 'blocked' : 'upcoming' },
    { id: 'end', label: cancelled ? t(K.detail.progress.cancelled) : failed ? t(K.detail.progress.failed) : t(K.detail.progress.completed), status: r.status === 'completed' ? 'complete' : failed ? 'blocked' : 'upcoming' },
  ];
}

function Detail({ s, t }: { s: PayoutDisbursementState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const v = s.detail;
  const [mode, setMode] = useState<'view' | 'update' | 'contact' | 'cancel'>('view');
  const [channel, setChannel] = useState<Channel>('call');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forId, setForId] = useState<string | null>(null);
  if ((v?.row.id ?? null) !== forId) { setForId(v?.row.id ?? null); setMode('view'); setNote(''); setReason(''); setError(null); }
  const close = () => s.openDisbursement(null);
  const done = async <R,>(p: Promise<ActionResult<R>>, ok: (r: R) => void) => { setBusy(true); setError(null); const res = await p; setBusy(false); if (!res.ok) { setError(problemText(t, res.problem)); return; } ok(res.value); };
  return (
    <Sheet open={!!v} onClose={close} title={t(K.detail.title)} closeLabel={t(K.close)}>
      {v && (
        <div className="stack gap-3" data-detail={v.row.id} data-status={v.row.status}>
          <div className="stack gap-1">
            <span className="num t-semibold" style={{ fontSize: 'var(--text-2xl, 1.75rem)' }}>{formatINR(v.row.amount)}</span>
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone={STATUS_TONE[v.row.status]}>{t(K.status[v.row.status])}</Badge><span className="t-xs t-muted">{v.row.partnerName} · {t(K.role[v.row.partnerRole])}</span></span>
          </div>
          <div data-progress><AscensionLine steps={progressOf(t, v)} orientation="horizontal" /></div>

          {v.row.failure && (
            <div className="stack gap-1" data-failure-block style={{ borderLeft: '3px solid var(--color-error)', paddingLeft: 'var(--space-3)' }}>
              <strong className="t-sm">{failureLabel(t, v.row.failure)}</strong>
              <span className="t-sm">{t(`payoutDisbursement.failure.hint.${v.row.failure}`)}</span>
              {v.row.continuedBy && <span className="t-xs t-muted">{t(K.row.continued, { code: v.row.continuedBy })}</span>}
            </div>
          )}

          <dl className="stack gap-2" style={{ margin: 0 }}>
            <Fact label={t(K.detail.method)} value={t(K.method[v.row.method])} />
            {v.row.tdsAmount > 0 && <Fact label={t(K.detail.gross)} value={formatINR(v.row.grossAmount)} />}
            {v.row.tdsAmount > 0 && <Fact label={t(K.detail.tds)} value={`− ${formatINR(v.row.tdsAmount)}`} />}
            {v.row.tdsAmount > 0 && <Fact label={t(K.detail.net)} value={formatINR(v.row.amount)} />}
            {v.row.destination && <Fact label={t(K.detail.to)} value={v.row.destination} />}
            {v.row.bankReference && <Fact label={t(K.detail.reference)} value={v.row.bankReference} />}
            {v.row.runCode && <Fact label={t(K.detail.run)} value={`${v.row.runCode} · ${t(K.kind[v.row.kind])}`} />}
            {!v.row.runCode && <Fact label={t(K.detail.run)} value={t(K.kind[v.row.kind])} />}
            <Fact label={t(K.detail.started)} value={formatDate(v.row.sentAt ?? v.row.createdAt, lang)} />
            {(v.row.completedAt ?? v.row.failedAt) && <Fact label={t(K.detail.finished)} value={formatDate((v.row.completedAt ?? v.row.failedAt) as string, lang)} />}
          </dl>

          {v.row.tdsAmount > 0 && <p className="t-xs t-muted" data-tds-note>{t(K.detail.tdsNote)}</p>}
          {v.row.status === 'completed' && (
            <p className="t-sm" data-reconciled={v.reconciled ? '1' : '0'}>{v.reconciled ? t(K.detail.reconciled) : t(K.detail.notReconciled)} <Button size="sm" variant="ghost" data-open-reconciliation onClick={() => s.goTo('/reconciliation')}>{t(K.detail.openReconciliation)}</Button></p>
          )}

          <section className="stack gap-1" data-entries>
            <h3 className="t-sm t-semibold">{t(K.detail.entries)}</h3>
            {v.entries.map((e) => (
              <div key={e.id} className="row between t-sm" style={{ gap: 'var(--space-3)', alignItems: 'flex-start' }} data-entry={e.id}>
                <span className="stack" style={{ minWidth: 0 }}><span style={{ overflowWrap: 'anywhere' }}>{reasonLabel(t, e.reasonKey)}</span><span className="t-xs t-muted">{[e.dealCode, e.jobCode, formatDate(e.earnedAt, lang)].filter(Boolean).join(' · ')}</span></span>
                <span className="row gap-2" style={{ alignItems: 'center' }}><span className="num">{formatINR(e.amount)}</span><Button size="sm" variant="ghost" onClick={() => s.goTo(`/payout-tracker?entry=${e.id}&days=all`)}>{t(K.detail.openPayout)}</Button></span>
              </div>
            ))}
          </section>

          <section className="stack gap-1" data-account>
            <h3 className="t-sm t-semibold">{t(K.detail.account.heading)}</h3>
            {v.account ? (
              <>
                <p className="t-sm">{[v.account.upiId ? t(K.detail.account.upi, { id: v.account.upiId }) : null, v.account.accountMasked ? t(K.detail.account.bank, { bank: v.account.bankName ?? '', account: v.account.accountMasked, ifsc: v.account.ifsc ?? '' }) : null].filter(Boolean).join(' · ')}</p>
                <p className="t-xs t-muted">{t(K.detail.account.holder, { name: v.account.holderName })} · {t(K.detail.account.checked, { date: formatDate(v.account.updatedAt, lang), name: v.account.updatedByName })}</p>
              </>
            ) : <p className="t-sm" data-no-account>{t(K.detail.account.none)}</p>}
            {v.detailsChangedSince && <p className="t-xs" data-details-changed>{t(K.detail.account.changedSince)}</p>}
          </section>

          <section className="stack gap-1" data-events>
            <h3 className="t-sm t-semibold">{t(K.detail.events)}</h3>
            {v.events.map((e, i) => (
              <p key={`${e.at}:${i}`} className="t-xs" data-event={e.kind}><span className="t-muted">{formatDate(e.at, lang)}</span> · {t(K.event[e.kind as keyof typeof K.event] ?? K.event.note)} · {e.byName}{e.detail ? ` · ${eventDetail(t, e.kind, e.detail)}` : ''}</p>
            ))}
          </section>

          {mode === 'update' && v.row.status === 'failed' && <AccountForm key="u" partnerId={v.row.partnerId} account={v.account} retryDefault failedCount={1} s={s} t={t} onDone={(msg) => { toast.push(msg); setMode('view'); }} />}

          {mode === 'contact' && (
            <div className="stack gap-2" data-contact-form>
              <h3 className="t-sm t-semibold">{t(K.detail.contact.log)}</h3>
              <Field label={t(K.detail.contact.how)}>{(p) => <Select id={p.id} value={channel} onChange={(e) => setChannel(e.target.value as Channel)} data-f="channel">{CHANNELS.map((c) => <option key={c} value={c}>{t(K.detail.contact.channel[c])}</option>)}</Select>}</Field>
              <Field label={t(K.detail.contact.note)} hint={t(K.detail.contact.noteHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-f="contact-note" />}</Field>
            </div>
          )}

          {mode === 'cancel' && (
            <div className="stack gap-2" data-cancel-form>
              <h3 className="t-sm t-semibold">{t(K.detail.cancel.button)}</h3>
              <p className="t-sm">{t(K.detail.cancel.body)}</p>
              <Field label={t(K.detail.cancel.reason)} hint={t(K.detail.contact.noteHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="cancel-reason" />}</Field>
            </div>
          )}

          {error && <p className="t-sm" role="alert" data-error style={{ color: 'var(--color-error)' }}>{error}</p>}

          <Footer>
            {v.row.status === 'failed' && !v.row.continuedBy && mode === 'view' && (
              <>
                {v.partnerPhone && <a className="ds-btn ds-btn--ghost ds-btn--sm" data-call href={`tel:${v.partnerPhone}`}><Phone size={16} aria-hidden="true" /> {t(K.detail.contact.call)}</a>}
                {v.partnerPhone && <a className="ds-btn ds-btn--ghost ds-btn--sm" data-whatsapp target="_blank" rel="noreferrer" href={`https://wa.me/${v.partnerPhone.replace(/\D/g, '')}`}><WhatsappLogo size={16} aria-hidden="true" /> {t(K.detail.contact.whatsapp)}</a>}
                <Button size="sm" variant="ghost" data-contact-open onClick={() => { setMode('contact'); setError(null); }}>{t(K.detail.contact.log)}</Button>
                <Button size="sm" variant="ghost" data-cancel-open onClick={() => { setMode('cancel'); setError(null); }}>{t(K.detail.cancel.button)}</Button>
                {v.row.needsDetails && <Button size="sm" variant="secondary" data-update-open onClick={() => { setMode('update'); setError(null); }}>{t(K.detail.update.heading)}</Button>}
                <Button size="sm" data-retry disabled={busy || v.retryProblem !== null} onClick={() => void done(s.retry(v.row.id), (r) => toast.push(t(K.detail.retry.done, { code: r.code })))}>{t(K.detail.retry.button)}</Button>
              </>
            )}
            {mode === 'contact' && <><Button size="sm" variant="ghost" onClick={() => setMode('view')}>{t(K.back)}</Button><Button size="sm" data-contact-save disabled={busy || lettersOf(note) < NOTE_MIN} onClick={() => void done(s.contact(v.row.id, { channel, note }), () => { toast.push(t(K.detail.contact.saved)); setMode('view'); setNote(''); })}>{t(K.detail.contact.save)}</Button></>}
            {mode === 'cancel' && <><Button size="sm" variant="ghost" onClick={() => setMode('view')}>{t(K.back)}</Button><Button size="sm" data-cancel-confirm disabled={busy || lettersOf(reason) < NOTE_MIN} onClick={() => void done(s.cancel(v.row.id, reason), () => { toast.push(t(K.detail.cancel.done)); close(); })}>{t(K.detail.cancel.confirm)}</Button></>}
            {mode === 'update' && <Button size="sm" variant="ghost" onClick={() => setMode('view')}>{t(K.back)}</Button>}
          </Footer>
          {v.row.status === 'failed' && !v.row.continuedBy && v.retryProblem && mode === 'view' && v.retryProblem !== 'not_failed' && <p className="t-xs t-muted" data-retry-blocked>{t(`payoutDisbursement.detail.retry.blocked.${v.retryProblem}`, { defaultValue: '' })}</p>}
        </div>
      )}
    </Sheet>
  );
}

function eventDetail(t: T, kind: string, detail: string): string {
  if (kind === 'failed' && (FAILURES as readonly string[]).includes(detail)) return failureLabel(t, detail as FailureReason);
  if (kind === 'created' && ['scheduled', 'urgent'].includes(detail)) return t(K.kind[detail as 'scheduled' | 'urgent']);
  return detail;
}

/* ------------------------------------------------------------------ Putting a partner's details right */

function AccountForm({ partnerId, account, retryDefault, failedCount, s, t, onDone }: { partnerId: string; account: { holderName: string } | null; retryDefault: boolean; failedCount: number; s: PayoutDisbursementState; t: T; onDone: (message: string) => void }) {
  const [holder, setHolder] = useState(account?.holderName ?? '');
  const [upi, setUpi] = useState('');
  const [acc, setAcc] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bank, setBank] = useState('');
  const [note, setNote] = useState('');
  const [retry, setRetry] = useState(retryDefault);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true); setError(null);
    const res = await s.updateAccount(partnerId, { holderName: holder, upiId: upi, accountNumber: acc, ifsc, bankName: bank, note, retry });
    setBusy(false);
    if (!res.ok) { setError(problemText(t, res.problem)); return; }
    onDone(res.value.retried.length > 0 ? t(K.detail.update.savedRetried, { code: res.value.retried.map((x) => x.code).join(', ') }) : t(K.detail.update.saved));
  };
  const typed = upi.trim() || acc.trim() || ifsc.trim();
  return (
    <div className="stack gap-2" data-account-form>
      <h3 className="t-sm t-semibold">{t(K.detail.update.heading)}</h3>
      <p className="t-sm">{t(K.detail.update.body)}</p>
      <div className="grid-auto" style={{ '--min': '200px' } as React.CSSProperties}>
        <Field label={t(K.detail.update.holder)}>{(p) => <Input id={p.id} value={holder} onChange={(e) => setHolder(e.target.value)} data-f="holder" />}</Field>
        <Field label={t(K.detail.update.upi)}>{(p) => <Input id={p.id} value={upi} autoCapitalize="none" onChange={(e) => setUpi(e.target.value)} data-f="upi" />}</Field>
        <Field label={t(K.detail.update.account)}>{(p) => <Input id={p.id} inputMode="numeric" value={acc} onChange={(e) => setAcc(e.target.value)} data-f="account" />}</Field>
        <Field label={t(K.detail.update.ifsc)}>{(p) => <Input id={p.id} value={ifsc} autoCapitalize="characters" onChange={(e) => setIfsc(e.target.value.toUpperCase())} data-f="ifsc" />}</Field>
        <Field label={t(K.detail.update.bank)}>{(p) => <Input id={p.id} value={bank} onChange={(e) => setBank(e.target.value)} data-f="bank" />}</Field>
      </div>
      <Field label={t(K.detail.update.note)} hint={t(K.detail.update.noteHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-f="update-note" />}</Field>
      {failedCount > 0 && <div data-retry-toggle><Checkbox checked={retry} onChange={setRetry} label={t(K.detail.update.retry)} /></div>}
      {error && <p className="t-sm" role="alert" data-error style={{ color: 'var(--color-error)' }}>{error}</p>}
      <div><Button size="sm" data-account-save disabled={busy || !typed || lettersOf(note) < NOTE_MIN} onClick={() => void save()}>{t(K.detail.update.save)}</Button></div>
    </div>
  );
}

/** Adding details for a partner who has cleared money and nowhere to send it (no transfer has failed yet). */
function AccountSheet({ s, t }: { s: PayoutDisbursementState; t: T }) {
  const toast = useToast();
  const p = s.partner ? s.data?.ready.find((r) => r.partnerId === s.partner) : null;
  const close = () => s.openPartner(null);
  return (
    <Sheet open={!!s.partner} onClose={close} title={p ? `${t(K.ready.addDetails)} · ${p.name}` : t(K.ready.addDetails)} closeLabel={t(K.close)}>
      {s.partner && <AccountForm key={s.partner} partnerId={s.partner} account={null} retryDefault={false} failedCount={0} s={s} t={t} onDone={(m) => { toast.push(m); close(); }} />}
    </Sheet>
  );
}
