import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Lightning, ListChecks, ShieldWarning } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, Toggle, formatDate, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { PayoutDecisionView, PayoutQueueRow, PayoutQueueView } from '@/data/repository';
import { APPROVAL_KEYS as K, APPROVE_DUE, EXPEDITE_REASON_MIN, FLAG_FILTERS, HOLD_KINDS, HOLD_REASON_MIN, HOLD_REVIEW, PAGE, PULL_DISTANCE, RELATED_FLAGS, ROUTINE_LIMIT, STATES } from './payout-approval.types';
import type { PayoutFlag, QueueState } from './payout-approval.types';
import { usePayoutApproval } from './usePayoutApproval';
import type { ActionResult, PayoutApprovalState } from './usePayoutApproval';

type T = ReturnType<typeof useTranslation>['t'];
const DAY = 86_400_000;
const STATE_TONE: Record<QueueState, BadgeTone> = { pending: 'accent', held: 'warning', cleared: 'success' };
const ruleName = (t: T, id: string) => t(`commissionRules.rule.${id}.name`, { defaultValue: id });
const NAMED_RULES = ['site_visit', 'lead_qualified', 'conversion', 'sales_close', 'install_pool', 'qc_fee', 'referral_bonus'];
const triggerLabel = (t: T, r: Pick<PayoutQueueRow, 'trigger' | 'reasonKey'>) => (NAMED_RULES.includes(r.trigger) ? ruleName(t, r.trigger) : t(r.reasonKey, { defaultValue: r.reasonKey }));
const problemText = (t: T, p: string) => t(`payoutApproval.problem.${p}`, { min: p === 'reason_required' ? HOLD_REASON_MIN : undefined, defaultValue: t(K.problem.generic) });
const ageText = (t: T, days: number) => (days <= 0 ? t(K.row.earnedToday) : t(K.row.earned, { days }));

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}
function Fact({ label, value }: { label: string; value: string }) {
  return <div className="row between" style={{ gap: 'var(--space-3)' }}><dt className="t-xs t-muted">{label}</dt><dd className="t-sm" style={{ margin: 0, textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</dd></div>;
}

/**
 * Screen 163 — Payout Approval Queue. The checkpoint before a worker payout goes out: nothing is cleared on the strength of being earned alone. Admin looks at the exceptions
 * (each flag says what to look at and must be seen), clears the routine ones together, and can hold anything for a second look; the partner is told, kindly, that it is held.
 */
export function PayoutApprovalScreen() {
  const { t } = useTranslation();
  const s = usePayoutApproval();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  if (s.load === 'loading' && !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={4} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' || !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const d = s.data;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-payout-approval>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <div className="stack gap-4">
          <Summary d={d} s={s} t={t} />
          <Queue d={d} s={s} t={t} />
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}><p className="t-xs t-muted" data-note-disbursement>{t(K.note.disbursement)}</p><Button size="sm" variant="secondary" data-open-disbursement onClick={() => s.goTo('/payout-disbursement')}>{t('payoutDisbursement.link.open')}</Button></div>
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { limit: formatINR(ROUTINE_LIMIT), due: Math.round(APPROVE_DUE / DAY), review: Math.round(HOLD_REVIEW / DAY), times: 3 })}</p>
        </div>
      </Screen>
      <Detail s={s} t={t} />
      <BatchSheet s={s} d={d} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ The four figures */

function Summary({ d, s, t }: { d: PayoutQueueView; s: PayoutApprovalState; t: T }) {
  const card = (id: string, label: string, amount: number, caption: string, onClick: () => void, hero?: boolean) => (
    <Card onClick={onClick}>
      <div className="stack gap-1" data-kpi={id} style={{ cursor: 'pointer' }}>
        <span className="t-xs t-muted">{label}</span>
        <span className="num t-semibold" style={{ fontSize: hero ? 'var(--text-3xl, 2.25rem)' : 'var(--text-2xl, 1.75rem)', lineHeight: 1.1 }} data-value>{formatINR(amount)}</span>
        <span className="t-xs">{caption}</span>
      </div>
    </Card>
  );
  const none = t(K.summary.none);
  return (
    <div className="stack gap-3" data-summary>
      {card('pending', t(K.summary.pending), d.totals.pending.amount, d.totals.pending.count === 0 ? none : t(K.summary.pendingCaption, { count: d.totals.pending.count, days: d.oldestPendingDays ?? 0 }), () => { s.setState('pending'); s.setFlagged('all'); }, true)}
      <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties}>
        {card('routine', t(K.summary.routine), d.routine.amount, d.routine.count === 0 ? none : t(K.summary.routineCaption, { count: d.routine.count, limit: formatINR(d.limits.routineLimit) }), () => { s.setState('pending'); s.setFlagged('routine'); })}
        {card('held', t(K.summary.held), d.totals.held.amount, d.totals.held.count === 0 ? none : t(K.summary.heldCaption, { count: d.totals.held.count }), () => { s.setState('held'); s.setFlagged('all'); })}
        {card('cleared', t(K.summary.cleared), d.totals.cleared.amount, d.totals.cleared.count === 0 ? none : t(K.summary.clearedCaption, { count: d.totals.cleared.count }), () => { s.setState('cleared'); s.setFlagged('all'); })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ The queue */

function Queue({ d, s, t }: { d: PayoutQueueView; s: PayoutApprovalState; t: T }) {
  const toast = useToast();
  const filtered = s.state !== 'pending' || s.flagged !== 'all' || !!s.qInput;
  const routineIds = d.rows.filter((r) => r.state === 'pending' && r.routine).map((r) => r.id);
  const routineTotal = d.routine.count;
  const pickedRows = d.rows.filter((r) => s.picked.includes(r.id));
  const pickedAmount = pickedRows.reduce((a, r) => a + r.amount, 0);
  const quick = async (r: PayoutQueueRow) => {
    const res = await s.approve(r.id, { acknowledged: [] });
    toast.push(res.ok ? t(K.approve.done, { amount: formatINR(res.value.amount) }) : problemText(t, res.problem));
  };
  return (
    <section className="stack gap-3" data-queue>
      <div className="sticky-under-shell stack gap-2" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-filters>
        <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {([...STATES, 'all'] as const).map((x) => <span key={x} data-state-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.state === x} onClick={() => s.setState(x)}>{t(K.state[x])} · {d.counts[x]}</Chip></span>)}
        </div>
        <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {FLAG_FILTERS.map((x) => <span key={x} data-flag-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.flagged === x} onClick={() => s.setFlagged(x)}>{t(K.flagFilter[x])}</Chip></span>)}
        </div>
        <Input value={s.qInput} placeholder={t(K.search)} aria-label={t(K.search)} onChange={(e) => s.setQInput(e.target.value)} data-f="q" />
        {s.state === 'pending' && d.rows.length > 0 && (
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Button size="sm" variant={s.selecting ? 'primary' : 'secondary'} icon={<ListChecks size={16} />} data-select-toggle aria-pressed={s.selecting} onClick={() => s.setSelecting(!s.selecting)}>{s.selecting ? t(K.batch.done) : t(K.batch.select)}</Button>
            {s.selecting && routineIds.length > 0 && <Button size="sm" variant="ghost" data-select-all onClick={() => s.setPicked(routineIds)}>{t(K.batch.selectAll, { count: routineIds.length })}</Button>}
            {s.selecting && s.picked.length > 0 && <Button size="sm" variant="ghost" data-select-clear onClick={() => s.setPicked([])}>{t(K.batch.clear)}</Button>}
          </div>
        )}
        {s.selecting && <p className="t-xs t-muted" data-batch-hint>{t(K.batch.hint, { limit: formatINR(ROUTINE_LIMIT) })}{routineTotal > routineIds.length ? '' : ''}</p>}
        {filtered && <div><Button size="sm" variant="ghost" data-clear onClick={s.clear}>{t(K.empty.clear)}</Button></div>}
      </div>
      {d.total === 0 ? (
        d.counts.all === 0 && !filtered ? <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} /> : <EmptyState title={t(K.empty.noMatch)} body={t(K.empty.noMatchBody)} />
      ) : (
        <>
          <p className="t-sm" data-count>{t(K.list.count, { count: d.total })}</p>
          <div className="grid-auto" style={{ "--min": "340px" } as React.CSSProperties} data-rows>{d.rows.map((r) => <Row key={r.id} r={r} s={s} t={t} onQuick={quick} />)}</div>
          {d.rows.length < d.total && <div><Button variant="secondary" data-show-more onClick={s.more}>{t(K.list.showMore)} · {Math.min(PAGE, d.total - d.rows.length)}</Button></div>}
        </>
      )}
      {s.selecting && s.picked.length > 0 && <BatchBar count={s.picked.length} amount={pickedAmount} t={t} onOpen={() => s.openBatch()} />}
    </section>
  );
}

function BatchBar({ count, amount, t, onOpen }: { count: number; amount: number; t: T; onOpen: () => void }) {
  return <ActionBar><Button data-batch-review onClick={onOpen}>{t(K.batch.review, { count, amount: formatINR(amount) })}</Button></ActionBar>;
}

function FlagBadges({ flags, t }: { flags: PayoutFlag[]; t: T }) {
  return <>{flags.map((f) => <Badge key={f} tone="warning">{t(K.flag.short[f])}</Badge>)}</>;
}

function Row({ r, s, t, onQuick }: { r: PayoutQueueRow; s: PayoutApprovalState; t: T; onQuick: (r: PayoutQueueRow) => void }) {
  const { i18n } = useTranslation();
  const selectable = s.selecting && r.state === 'pending';
  const picked = s.picked.includes(r.id);
  return (
    <Card>
      <div className="stack gap-2" data-row={r.id} data-state={r.state} data-routine={r.routine ? '1' : '0'}>
        <div role={selectable ? undefined : 'button'} tabIndex={selectable ? undefined : 0} data-row-open={r.id} className="stack gap-2" style={{ cursor: selectable ? 'default' : 'pointer' }} onClick={selectable ? undefined : () => s.openEntry(r.id)} onKeyDown={selectable ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.openEntry(r.id); } }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="row gap-3" style={{ minWidth: 0, alignItems: 'flex-start' }}>
            {selectable && (r.routine ? <span data-pick={r.id}><Checkbox checked={picked} onChange={() => s.toggle(r.id)} label="" /></span> : <span className="t-xs t-muted" data-not-routine style={{ maxWidth: 90 }}>{t(K.batch.notRoutine)}</span>)}
            <span className="stack" style={{ minWidth: 0 }}>
              <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{r.partnerName}</strong>
              <span className="t-xs t-muted">{t(K.row.role[r.partnerRole])} · {triggerLabel(t, r)}</span>
            </span>
          </span>
          <span className="stack" style={{ alignItems: 'flex-end' }}><span className="num t-semibold">{formatINR(r.amount)}</span><Badge tone={STATE_TONE[r.state]}>{t(K.state[r.state])}</Badge></span>
        </div>
        <span className="row gap-2 wrap t-xs t-muted" style={{ alignItems: 'center' }}>
          <span>{r.state === 'held' && r.hold ? (r.hold.days <= 0 ? t(K.row.heldToday) : t(K.row.heldFor, { days: r.hold.days })) : r.state === 'cleared' && r.cleared ? t(K.row.clearedBy, { name: r.cleared.byName }) : ageText(t, r.ageDays)}</span>
          {r.dealCode && <span>{r.dealCode}</span>}
          {r.expedited && <Badge tone="accent">{t(K.row.urgent)}</Badge>}
          <FlagBadges flags={r.flags} t={t} />
        </span>
        </div>
        {r.state === 'pending' && !selectable && (
          <span className="row gap-2 wrap">
            {r.routine ? <Button size="sm" data-approve={r.id} onClick={() => onQuick(r)}>{t(K.row.approve)}</Button> : <Button size="sm" data-review={r.id} onClick={() => s.openEntry(r.id)}>{t(K.row.review)}</Button>}
            {r.routine && <Button size="sm" variant="ghost" data-open={r.id} onClick={() => s.openEntry(r.id)}>{t(K.row.review)}</Button>}
          </span>
        )}
        {r.state === 'cleared' && r.cleared && <span className="t-xs t-muted">{formatDate(r.cleared.at, i18n.language)}</span>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Several at once */

function BatchSheet({ s, d, t }: { s: PayoutApprovalState; d: PayoutQueueView; t: T }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const rows = d.rows.filter((r) => s.picked.includes(r.id));
  const total = rows.reduce((a, r) => a + r.amount, 0);
  const go = async () => {
    setBusy(true);
    const res: ActionResult<{ approved: string[]; skipped: { id: string }[]; amount: number }> = await s.approveBatch(s.picked);
    setBusy(false);
    s.closeBatch();
    if (!res.ok) { toast.push(problemText(t, res.problem)); return; }
    toast.push(t(K.batch.done_toast, { count: res.value.approved.length, amount: formatINR(res.value.amount) }));
    if (res.value.skipped.length > 0) toast.push(t(K.batch.skipped, { count: res.value.skipped.length }));
  };
  return (
    <Sheet open={s.batchOpen} onClose={s.closeBatch} title={t(K.batch.title, { count: rows.length })} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-batch-sheet>
        <p className="t-sm">{t(K.batch.intro)}</p>
        <ul className="stack gap-1" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {rows.map((r) => <li key={r.id} className="row between t-sm" style={{ gap: 'var(--space-3)' }}><span style={{ overflowWrap: 'anywhere' }}>{r.partnerName} · {triggerLabel(t, r)}</span><span className="num">{formatINR(r.amount)}</span></li>)}
        </ul>
        <div className="row between t-semibold"><span>{t(K.batch.total)}</span><span className="num">{formatINR(total)}</span></div>
        <Footer>
          <Button variant="ghost" onClick={s.closeBatch}>{t(K.cancel)}</Button>
          <Button data-batch-confirm disabled={busy || rows.length === 0} onClick={() => void go()}>{t(K.batch.confirm, { count: rows.length, amount: formatINR(total) })}</Button>
        </Footer>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ One payout */

function flagText(t: T, f: PayoutFlag, r: PayoutQueueRow): { title: string; hint: string | null } {
  const range = r.expected ? { low: formatINR(r.expected.low), high: formatINR(r.expected.high), amount: formatINR(r.amount) } : null;
  let hint: string | null = null;
  if (f === 'amount_high') hint = range ? t(K.flag.hint.amount_high_rule, range) : r.typical !== null ? t(K.flag.hint.amount_high_typical, { typical: formatINR(r.typical), amount: formatINR(r.amount) }) : null;
  else if (f === 'amount_low') hint = range ? t(K.flag.hint.amount_low_rule, range) : null;
  else if (f === 'not_payable') hint = t(K.flag.hint.not_payable);
  return { title: t(K.flag[f]), hint };
}

function Detail({ s, t }: { s: PayoutApprovalState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const row = s.detail?.row ?? null;
  const history = s.detail?.history ?? [];
  const [seen, setSeen] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(false);
  const [urgentReason, setUrgentReason] = useState('');
  const [mode, setMode] = useState<'view' | 'hold'>('view');
  const [kind, setKind] = useState<string>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forId, setForId] = useState<string | null>(null);
  if ((row?.id ?? null) !== forId) { setForId(row?.id ?? null); setSeen([]); setUrgent(false); setUrgentReason(''); setMode('view'); setKind(''); setReason(''); setError(null); }
  const close = () => s.openEntry(null);
  const fail = (p: string) => setError(problemText(t, p));
  const approve = async (r: PayoutQueueRow) => {
    setBusy(true); setError(null);
    const res = await s.approve(r.id, { acknowledged: seen, expedited: urgent, reason: urgent ? urgentReason : undefined });
    setBusy(false);
    if (!res.ok) { fail(res.problem); return; }
    toast.push(urgent ? t(K.approve.doneUrgent, { amount: formatINR(res.value.amount) }) : t(K.approve.done, { amount: formatINR(res.value.amount) }));
    close();
  };
  const hold = async (r: PayoutQueueRow) => {
    setBusy(true); setError(null);
    const res = await s.hold(r.id, { kind, reason });
    setBusy(false);
    if (!res.ok) { fail(res.problem); return; }
    toast.push(t(K.hold.done));
    close();
  };
  const release = async (r: PayoutQueueRow) => {
    setBusy(true); setError(null);
    const res = await s.release(r.id);
    setBusy(false);
    if (!res.ok) { fail(res.problem); return; }
    toast.push(t(K.approve.released));
  };
  const allSeen = row ? row.flags.every((f) => seen.includes(f)) : false;
  const urgentOk = !urgent || urgentReason.replace(/[^\p{L}\p{N}]/gu, '').length >= EXPEDITE_REASON_MIN;
  return (
    <Sheet open={!!row} onClose={close} title={t(K.detail.title)} closeLabel={t(K.close)}>
      {row && (
        <div className="stack gap-3" data-detail={row.id} data-state={row.state}>
          <div className="stack gap-1">
            <span className="num t-semibold" style={{ fontSize: 'var(--text-2xl, 1.75rem)' }}>{formatINR(row.amount)}</span>
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone={STATE_TONE[row.state]}>{t(K.state[row.state])}</Badge>{row.expedited && <Badge tone="accent">{t(K.row.urgent)}</Badge>}<span className="t-xs t-muted">{ageText(t, row.ageDays)}</span></span>
          </div>

          <section className="stack gap-1">
            <h3 className="t-sm t-semibold">{t(K.detail.what)}</h3>
            <dl className="stack gap-2" style={{ margin: 0 }}>
              <Fact label={row.partnerName} value={`${t(K.row.role[row.partnerRole])} · ${triggerLabel(t, row)}`} />
              {row.dealCode && <Fact label={t(K.detail.deal, { code: row.dealCode })} value={row.dealValue !== null ? formatINR(row.dealValue) : ''} />}
              {row.jobCode && <Fact label={t(K.detail.job, { code: row.jobCode })} value="" />}
            </dl>
            {!row.dealCode && !row.jobCode && <p className="t-xs t-muted">{t(K.detail.noRecord)}</p>}
          </section>

          <section className="stack gap-1" data-how>
            <h3 className="t-sm t-semibold">{t(K.detail.how)}</h3>
            {row.rule ? (
              <>
                <p className="t-sm" data-rule>{t(K.detail.rule, { rule: ruleName(t, row.rule.id), version: row.rule.version, date: formatDate(row.rule.effectiveFrom, lang) })}</p>
                {row.rule.inferred && <p className="t-xs t-muted">{t(K.detail.ruleInferred)}</p>}
                {row.dealValue !== null && <p className="t-xs t-muted">{t(K.detail.dealValue, { value: formatINR(row.dealValue) })}</p>}
                {row.tierPlusPct !== null && row.tierPlusPct > 0 && <p className="t-xs t-muted">{t(K.detail.tier, { plus: row.tierPlusPct })}</p>}
                {row.expected && <p className="t-sm" data-expected>{row.expected.low === row.expected.high ? t(K.detail.expectedExact, { amount: formatINR(row.expected.low) }) : t(K.detail.expected, { low: formatINR(row.expected.low), high: formatINR(row.expected.high) })}</p>}
              </>
            ) : <p className="t-xs t-muted" data-no-rule>{t(K.detail.noRule)}</p>}
          </section>

          <section className="stack gap-2" data-flags>
            <h3 className="t-sm t-semibold">{t(K.detail.flags)}</h3>
            {row.flags.length === 0 ? <p className="t-sm t-muted" data-no-flags>{t(K.detail.noFlags)}</p> : row.flags.map((f) => {
              const x = flagText(t, f, row);
              const related = row.related.filter((rel) => (f === 'open_snag' && rel.kind === 'snag') || (f === 'open_issue' && rel.kind === 'issue') || (f === 'open_dispute' && rel.kind === 'dispute') || (f === 'damaged_parts' && rel.kind === 'damaged_parts'));
              return (
                <div key={f} className="stack gap-1" data-flag={f} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
                  <span className="row gap-2" style={{ alignItems: 'flex-start' }}><ShieldWarning size={16} aria-hidden="true" style={{ color: 'var(--color-warning)', flex: '0 0 auto', marginTop: 2 }} /><span className="t-sm">{x.title}</span></span>
                  {x.hint && <span className="t-xs t-muted">{x.hint}</span>}
                  {RELATED_FLAGS.includes(f) && related.length > 0 && <span className="row gap-2 wrap">{related.slice(0, 4).map((rel) => <Button key={rel.id} size="sm" variant="secondary" data-related={rel.id} onClick={() => s.goTo(rel.route)}>{t(K.flag.openRelated, { code: rel.code })}</Button>)}</span>}
                  {row.state === 'pending' && <div data-seen={f}><Checkbox checked={seen.includes(f)} onChange={(v) => setSeen((p) => (v ? [...p, f] : p.filter((x2) => x2 !== f)))} label={t(K.flag.seen)} /></div>}
                </div>
              );
            })}
          </section>

          {row.state === 'held' && row.hold && (
            <div className="stack gap-1" data-held style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
              <p className="t-sm">{row.hold.days <= 0 ? t(K.detail.heldBodyToday, { review: Math.round(HOLD_REVIEW / DAY) }) : t(K.detail.heldBody, { days: row.hold.days, review: Math.round(HOLD_REVIEW / DAY) })}</p>
              {row.hold.reason && <p className="t-xs"><strong>{t(K.detail.heldReasonLabel)}:</strong> {row.hold.reason}</p>}
              <p className="t-xs t-muted">{t(K.detail.partnerSees, { line: t(`payoutApproval.partner.hold.${row.hold.kind}`) })}</p>
            </div>
          )}

          <section className="stack gap-1" data-history>
            <h3 className="t-sm t-semibold">{t(K.detail.history.heading)}</h3>
            {history.length === 0 ? <p className="t-xs t-muted">{t(K.detail.noHistory)}</p> : history.map((h) => <HistoryLine key={h.id} h={h} t={t} lang={lang} />)}
          </section>

          {row.state === 'pending' && mode === 'view' && (
            <div className="stack gap-2" data-urgent>
              <Toggle checked={urgent} onChange={setUrgent} label={t(K.urgent.toggle)} description={t(K.urgent.body)} />
              {urgent && <Field label={t(K.urgent.reason)} hint={t(K.urgent.reasonHint, { min: EXPEDITE_REASON_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={urgentReason} onChange={(e) => setUrgentReason(e.target.value)} data-f="urgent-reason" />}</Field>}
            </div>
          )}

          {mode === 'hold' && (
            <div className="stack gap-2" data-hold-form>
              <h3 className="t-sm t-semibold">{t(K.hold.title)}</h3>
              <Field label={t(K.hold.kindLabel)}>{(p) => <Select id={p.id} value={kind} onChange={(e) => setKind(e.target.value)} data-f="hold-kind"><option value="">—</option>{HOLD_KINDS.map((k) => <option key={k} value={k}>{t(K.hold.kind[k])}</option>)}</Select>}</Field>
              {kind && <p className="t-xs t-muted" data-partner-line>{t(K.detail.partnerSees, { line: t(`payoutApproval.partner.hold.${kind}`) })}</p>}
              <Field label={t(K.hold.reason)} hint={t(K.hold.reasonHint, { min: HOLD_REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="hold-reason" />}</Field>
            </div>
          )}

          {error && <p className="t-sm" role="alert" data-error style={{ color: 'var(--color-error)' }}>{error}</p>}

          <Footer>
            {row.state === 'pending' && mode === 'view' && (
              <>
                <Button size="sm" variant="secondary" data-hold-open onClick={() => { setMode('hold'); setError(null); }}>{t(K.detail.hold)}</Button>
                <Button size="sm" data-approve-detail icon={urgent ? <Lightning size={16} /> : undefined} disabled={busy || !allSeen || !urgentOk} onClick={() => void approve(row)}>{urgent ? t(K.detail.approveUrgent) : t(K.detail.approve)}</Button>
              </>
            )}
            {mode === 'hold' && (
              <>
                <Button size="sm" variant="ghost" onClick={() => { setMode('view'); setError(null); }}>{t(K.back)}</Button>
                <Button size="sm" data-hold-confirm disabled={busy || !kind || reason.replace(/[^\p{L}\p{N}]/gu, '').length < HOLD_REASON_MIN} onClick={() => void hold(row)}>{t(K.hold.confirm)}</Button>
              </>
            )}
            {row.state === 'held' && mode === 'view' && <Button size="sm" data-release disabled={busy} onClick={() => void release(row)}>{t(K.detail.releaseHold)}</Button>}
            {row.state === 'cleared' && mode === 'view' && <Button size="sm" variant="secondary" data-hold-open onClick={() => { setMode('hold'); setError(null); }}>{t(K.detail.hold)}</Button>}
            {row.rule && <Button size="sm" variant="ghost" data-open-rule onClick={() => s.goTo(`/commission-rules?rule=${(row.rule as { id: string }).id}`)}>{t(K.detail.openRule)}</Button>}
            {row.jobId && <Button size="sm" variant="ghost" data-open-certificate onClick={() => s.goTo(`/handover-certificate/${row.jobId}`)}>{t(K.detail.openCertificate)}</Button>}
          </Footer>
        </div>
      )}
    </Sheet>
  );
}

function HistoryLine({ h, t, lang }: { h: PayoutDecisionView; t: T; lang: string }) {
  const text = h.kind === 'held' ? t(K.detail.history.held, { name: h.byName, reason: h.reason ?? '' })
    : h.kind === 'released' ? t(K.detail.history.released, { name: h.byName })
    : h.expedited ? t(K.detail.history.approvedUrgent, { name: h.byName, reason: h.reason ?? '' })
    : h.batch ? t(K.detail.history.approvedBatch, { name: h.byName }) : t(K.detail.history.approved, { name: h.byName });
  return <p className="t-xs" data-history-line={h.kind}><span className="t-muted">{formatDate(h.at, lang)}</span> · {text}</p>;
}
