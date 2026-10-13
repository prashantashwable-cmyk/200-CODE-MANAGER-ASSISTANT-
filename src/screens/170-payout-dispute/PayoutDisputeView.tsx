import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CheckCircle, ChatCircleText, Scales } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { PayoutDisputeRow, PayoutDisputeView, PayoutMessageView, SupplierDisputeRow } from '@/data/repository';
import { raiseProblem } from '@/features/payout/dispute';
import { ADMIN_STATES, CORRECTION_MAX, DISPUTE_KEYS as K, EXPLAIN_MIN, FLAGS, PAGE, PATTERN_DAYS, REASON_MIN, SYSTEMIC_MIN, TEXT_MIN, TOPICS, UPDATE_MIN } from './payout-dispute.types';
import type { Topic } from './payout-dispute.types';
import { useDispute } from './useDispute';
import type { DisputeState, Result } from './useDispute';

type T = ReturnType<typeof useTranslation>['t'];
const STATE_TONE: Record<string, BadgeTone> = { open: 'accent', in_review: 'accent', escalated: 'warning', answered: 'success', resolved: 'neutral' };
const SLA_TONE: Record<string, BadgeTone> = { on_track: 'success', due_soon: 'warning', overdue: 'warning', done: 'neutral' };
const lettersOf = (s: string) => (s.match(/\p{L}/gu) ?? []).length;
const reasonText = (t: T, key: string) => t(key, { defaultValue: key });
const problemText = (t: T, p: string) => t(`payoutDispute.problem.${p}`, { min: Math.max(TEXT_MIN, EXPLAIN_MIN), defaultValue: t(K.problem.generic) });
const minFor = (p: string): number => (p === 'explain_short' ? EXPLAIN_MIN : p === 'reason_short' ? REASON_MIN : p === 'update_short' ? UPDATE_MIN : p === 'systemic_short' ? SYSTEMIC_MIN : TEXT_MIN);
const problemLine = (t: T, p: string) => t(`payoutDispute.problem.${p}`, { min: minFor(p), defaultValue: t(K.problem.generic) });
void problemText;

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}
const Scroller = ({ children }: { children: ReactNode }) => <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 4 }}>{children}</div>;

/** What a thread line says: the words written, or the app's own key rendered here in the reader's language. */
function messageText(t: T, m: PayoutMessageView, lang: string): string {
  if (m.text) return m.text;
  if (!m.key) return '';
  const p = m.params;
  return t(m.key, { ...p, date: p.date ? formatDate(String(p.date), lang) : '', amount: typeof p.amount === 'number' ? formatINR(p.amount) : '', to: typeof p.to === 'number' ? formatINR(p.to) : '', defaultValue: m.key });
}
function Thread({ messages, t, lang }: { messages: PayoutMessageView[]; t: T; lang: string }) {
  return (
    <div className="stack gap-2" data-thread>
      {messages.map((m, i) => (
        <div key={`${m.at}:${i}`} className="stack gap-1" data-message={m.from} style={{ borderLeft: `3px solid var(${m.from === 'partner' ? '--color-border' : '--color-accent-primary'})`, paddingLeft: 'var(--space-3)' }}>
          <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <strong className="t-sm">{m.from === 'admin' && m.byName ? m.byName : t(K.from[m.from])}</strong>
            {m.progress && <Badge tone="neutral">{t(K.progress)}</Badge>}
            <span className="t-xs t-muted">{formatDate(m.at, lang)}</span>
          </span>
          <p className="t-sm" style={{ overflowWrap: 'anywhere' }}>{messageText(t, m, lang)}</p>
        </div>
      ))}
    </div>
  );
}

function SlaLine({ row, t, lang, partner }: { row: Pick<PayoutDisputeRow, 'dueAt' | 'sla' | 'state'>; t: T; lang: string; partner: boolean }) {
  if (!row.dueAt) return null;
  if (partner) return <p className="t-sm t-muted" data-sla={row.sla}>{t(K.sla.answerBy, { date: formatDate(row.dueAt, lang) })}</p>;
  return <span className="row gap-2" style={{ alignItems: 'center' }} data-sla={row.sla}><Badge tone={SLA_TONE[row.sla]}>{t(K.sla[row.sla])}</Badge><span className="t-xs t-muted">{t(row.sla === 'overdue' ? K.sla.wasDue : K.admin.target, { date: formatDate(row.dueAt, lang) })}</span></span>;
}

/** Screen 170 — Dispute / Query on Payout. One record (168's PayoutQuery), three people: a partner asks or disputes, a supplier raises a payment dispute that 117 decides, Admin settles the queue. */
export function PayoutDisputeScreen() {
  const { t } = useTranslation();
  const s = useDispute();
  const head = (sub: string, action?: ReactNode) => <ScreenHeader title={t(K.title)} subtitle={t(sub)} action={action} />;
  if (s.load === 'loading' && !s.board) return <Screen>{head(K.subtitle)}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !s.board) return <Screen>{head(K.subtitle)}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (s.isAdmin) return <AdminView s={s} />;
  if (s.isSupplier) return <SupplierView s={s} />;
  return <PartnerView s={s} />;
}

/* ----------------------------------------------------------------- partner */

function PartnerView({ s }: { s: DisputeState }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const rows = s.board?.rows ?? [];
  const newButton = <Button size="sm" data-new onClick={() => s.startNew()}>{t(K.list.new)}</Button>;

  if (s.entryId) return <Screen width="narrow"><ScreenHeader title={t(K.form.heading)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" onClick={() => s.closeForm()}>{t(K.back)}</Button>} /><DisputeForm s={s} /></Screen>;
  if (s.picking) return <Screen width="narrow"><ScreenHeader title={t(K.pick.heading)} subtitle={t(K.pick.body)} action={<Button size="sm" variant="ghost" onClick={() => s.closeForm()}>{t(K.back)}</Button>} /><Picker s={s} /></Screen>;
  if (s.disputeId) return <Screen width="narrow"><ScreenHeader title={t(K.detail.heading)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" onClick={() => s.open(null)}>{t(K.back)}</Button>} /><PartnerDetail s={s} /></Screen>;

  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={newButton} />
      {rows.length === 0 ? (
        <EmptyState title={t(K.list.empty.title)} body={t(K.list.empty.body)} actionLabel={t(K.list.new)} onAction={() => s.startNew()} />
      ) : (
        <div className="stack gap-2" data-list>
          <h2 className="t-md t-semibold">{t(K.list.heading)}</h2>
          {rows.map((r) => (
            <Card key={r.id}>
              <div className="stack gap-1" role="button" tabIndex={0} data-open={r.id} data-state={r.state} style={{ cursor: 'pointer' }} onClick={() => s.open(r.id)} onKeyDown={(e) => { if (e.key === 'Enter') s.open(r.id); }}>
                <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><strong className="t-sm">{r.code}</strong><Badge tone={STATE_TONE[r.state]}>{t(K.state[r.state])}</Badge><Badge tone="neutral">{t(K.kind[r.kind])}</Badge>{r.round > 1 && <span className="t-xs t-muted">{t(K.row.round, { n: r.round })}</span>}</span>
                <span className="t-sm">{t(K.row.about, { reason: reasonText(t, r.reasonKey), amount: formatINR(r.entryAmount) })}</span>
                <span className="t-xs t-muted" style={{ overflowWrap: 'anywhere' }}>{r.lastWords}</span>
                <SlaLine row={r} t={t} lang={lang} partner />
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}

function Picker({ s }: { s: DisputeState }) {
  const { t, i18n } = useTranslation();
  if (!s.recent) return <LoadingState label={t(K.loading)} variant="list" rows={4} />;
  if (s.recent.length === 0) return <EmptyState title={t(K.pick.empty)} body={t(K.pick.body)} />;
  return (
    <div className="stack gap-2" data-picker>
      {s.recent.map((e) => (
        <Card key={e.id}>
          <div className="stack gap-1" role="button" tabIndex={0} data-pick={e.id} style={{ cursor: 'pointer' }} onClick={() => s.pick(e.id)} onKeyDown={(ev) => { if (ev.key === 'Enter') s.pick(e.id); }}>
            <strong className="t-sm">{reasonText(t, e.reasonKey)}</strong>
            <span className="t-xs t-muted">{formatINR(e.amount)} · {formatDate(e.earnedAt, i18n.language)}</span>
            {e.openQuery && <Badge tone="accent">{t(K.pick.open)}</Badge>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function DisputeForm({ s }: { s: DisputeState }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const [problem, setProblem] = useState<string | null>(null);
  const [same, setSame] = useState<{ code: string; notes: string | null } | null>(null);
  const e = s.entry?.entry;
  if (!s.entry || !e) return <EmptyState title={t(K.form.missing.title)} body={t(K.form.missing.body)} actionLabel={t(K.back)} onAction={() => s.closeForm()} />;
  const open = s.entry.queries.find((q) => q.status !== 'resolved');
  const earlier = s.entry.queries.filter((q) => q.status === 'resolved');
  const d = s.draft;
  const claimed = d.claimed.trim() === '' ? null : Number(d.claimed.replace(/,/g, ''));
  const dispute = d.kind === 'dispute';
  const inline = dispute ? raiseProblem({ topic: (d.topic || null) as Topic | null, text: d.text, claimedAmount: claimed, current: e.amount }) : lettersOf(d.text) < TEXT_MIN ? 'text_short' : null;
  const wordsOk = lettersOf(d.text) >= TEXT_MIN;
  const claimNeeded = dispute && d.topic === 'amount_low';
  const claimOk = !claimNeeded || (claimed !== null && Number.isFinite(claimed) && claimed > e.amount);
  const send = async () => {
    setProblem(null); setSame(null);
    const res: Result = await s.submit();
    if (res.ok) { toast.push(t(K.form.sentToast)); return; }
    if (res.problem === 'same_words') setSame(res.earlier ?? { code: earlier[earlier.length - 1]?.code ?? '', notes: null });
    setProblem(res.problem);
  };
  return (
    <div className="stack gap-3" data-form>
      <Card>
        <div className="stack gap-1" data-entry={e.id}>
          <span className="t-xs t-muted">{t(K.form.entry)}</span>
          <strong className="t-sm">{reasonText(t, e.reasonKey)}</strong>
          <span className="num t-semibold">{formatINR(e.amount)}</span>
          <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone="accent">{t(`payoutHistory.stage.${e.stage}`)}</Badge><span className="t-xs t-muted">{t(K.detail.earned, { date: formatDate(e.earnedAt, lang) })}</span></span>
        </div>
      </Card>
      {open ? (
        <Card><div className="stack gap-2" data-already-open><p className="t-sm">{t(K.problem.already_open)}</p><div><Button size="sm" variant="secondary" onClick={() => s.open(open.id)}>{t(K.detail.heading)}</Button></div></div></Card>
      ) : (
        <>
          {earlier.length > 0 && <p className="t-sm" data-repeat-note style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>{t(K.form.repeatNote, { code: earlier[earlier.length - 1].code })}</p>}
          <div className="stack gap-2" role="radiogroup" aria-label={t(K.form.choice.heading)}>
            <h2 className="t-md t-semibold">{t(K.form.choice.heading)}</h2>
            {(['dispute', 'question'] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={d.kind === k} data-kind={k} className="tappable" onClick={() => s.setDraft({ kind: k })} style={{ textAlign: 'left', minHeight: 56, padding: 'var(--space-3)', borderRadius: 'var(--radius-md, 12px)', border: `1px solid var(${d.kind === k ? '--color-accent-primary' : '--color-border'})`, background: 'var(--color-surface)' }}>
                <strong className="t-sm">{t(K.form.choice[k].label)}</strong><br /><span className="t-xs t-muted">{t(K.form.choice[k].hint)}</span>
              </button>
            ))}
          </div>
          {dispute && (
            <>
              <Field label={t(K.form.topic)}>{(p) => <Select id={p.id} value={d.topic} data-f="topic" onChange={(ev) => s.setDraft({ topic: ev.target.value as Topic | '' })}><option value="">—</option>{TOPICS.map((x) => <option key={x} value={x}>{t(K.topic[x])}</option>)}</Select>}</Field>
              {(claimNeeded || d.claimed !== '') && <Field label={t(K.form.claimed)} hint={t(K.form.claimedHint, { current: formatINR(e.amount) })}>{(p) => <Input id={p.id} inputMode="numeric" mono value={d.claimed} data-f="claimed" onChange={(ev) => s.setDraft({ claimed: ev.target.value })} />}</Field>}
            </>
          )}
          <Field label={t(K.form.text)} hint={t(K.form.textHint, { min: TEXT_MIN })}>{(p) => <TextArea id={p.id} rows={5} value={d.text} data-f="text" onChange={(ev) => s.setDraft({ text: ev.target.value })} />}</Field>
          {wordsOk && claimOk && (!dispute || d.topic) && <p className="t-xs t-success row gap-1" style={{ alignItems: 'center' }} data-valid><CheckCircle size={14} aria-hidden="true" />{t(K.form.valid)}</p>}
          <p className="t-xs t-muted">{t(K.form.draft)}</p>
          {same && (
            <div className="stack gap-2" data-same style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
              <strong className="t-sm">{t(K.form.same.title)}</strong>
              <p className="t-sm">{t(K.form.same.body, { code: same.code })}</p>
              <p className="t-sm" style={{ overflowWrap: 'anywhere' }}>{same.notes || t(K.form.same.none)}</p>
              <p className="t-sm">{t(K.form.same.add)}</p>
            </div>
          )}
          {problem && problem !== 'same_words' && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemLine(t, problem)}</p>}
          <ActionBar>
            <Button data-send disabled={s.busy || !!inline || !claimOk} onClick={() => void send()}>{dispute ? t(K.form.sendDispute) : t(K.form.sendQuestion)}</Button>
          </ActionBar>
        </>
      )}
    </div>
  );
}

function PartnerDetail({ s }: { s: DisputeState }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const v = s.detail;
  if (s.detailLoad === 'loading' && !v) return <LoadingState label={t(K.loading)} variant="list" rows={3} />;
  if (!v) return <EmptyState title={t(K.detail.missing.title)} body={t(K.detail.missing.body)} actionLabel={t(K.back)} onAction={() => s.open(null)} />;
  const r = v.row;
  const e = v.entry;
  const res = r.resolution;
  const withdraw = async () => { const out = await s.withdraw(r.id); toast.push(out.ok ? t(K.detail.withdrawn) : problemLine(t, out.problem)); };
  return (
    <div className="stack gap-3" data-detail={r.id} data-state={r.state}>
      <Card>
        <div className="stack gap-2">
          <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><strong>{r.code}</strong><Badge tone={STATE_TONE[r.state]}>{t(K.state[r.state])}</Badge><Badge tone="neutral">{t(K.kind[r.kind])}</Badge>{r.round > 1 && <span className="t-xs t-muted">{t(K.row.round, { n: r.round })}</span>}</span>
          <div className="stack gap-1" data-entry={e.id}>
            <span className="t-xs t-muted">{t(K.detail.entry)}</span>
            <strong className="t-sm">{reasonText(t, e.reasonKey)}</strong>
            <span className="num t-semibold">{formatINR(e.amount)}</span>
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone="accent">{t(`payoutHistory.stage.${e.stage}`)}</Badge><span className="t-xs t-muted">{t(K.detail.earned, { date: formatDate(e.earnedAt, lang) })}</span></span>
            {r.claimedAmount !== null && <span className="t-sm">{t(K.detail.claimed, { amount: formatINR(r.claimedAmount) })}</span>}
            {r.topic && <span className="t-xs t-muted">{t(K.topic[r.topic])}</span>}
          </div>
          <SlaLine row={r} t={t} lang={lang} partner />
          {v.nextUpdateBy && <p className="t-sm" data-next-update>{t(K.detail.nextUpdate, { date: formatDate(v.nextUpdateBy, lang) })}</p>}
          {v.escalation && <p className="t-sm" data-escalated>{t(K.detail.escalated, { date: formatDate(v.escalation.at, lang) })}</p>}
        </div>
      </Card>
      <Card><div className="stack gap-2"><h2 className="t-md t-semibold">{t(K.detail.thread)}</h2><Thread messages={v.messages} t={t} lang={lang} /></div></Card>
      {res && (
        <Card>
          <div className="stack gap-2" data-result={res.type}>
            <h2 className="t-md t-semibold row gap-1" style={{ alignItems: 'center' }}><Scales size={18} aria-hidden="true" />{t(K.detail.result)}</h2>
            <Badge tone={res.type === 'adjustment' ? 'success' : 'neutral'}>{t(K.resolution[res.type])}</Badge>
            {res.type === 'adjustment' && <><p className="t-sm">{t(K.detail.resultAdjust, { amount: formatINR(res.correction ?? 0) })}</p>{res.correctionStage && <p className="t-xs t-muted">{t(K.detail.resultStage, { stage: t(`payoutHistory.stage.${res.correctionStage}`) })}</p>}</>}
            {res.type === 'explanation' && <><p className="t-sm">{t(K.detail.resultExplain)}</p><p className="t-sm" style={{ overflowWrap: 'anywhere' }}>{res.notes}</p></>}
            {res.type === 'withdrawn' && <p className="t-sm">{t(K.detail.resultWithdrawn)}</p>}
          </div>
        </Card>
      )}
      {v.earlier.length > 0 && (
        <Card><div className="stack gap-2" data-earlier><h2 className="t-md t-semibold">{t(K.detail.earlier)}</h2>{v.earlier.map((x) => <p key={x.id} className="t-sm">{t(K.detail.earlierItem, { code: x.code, res: x.resolution ? t(K.resolution[x.resolution]) : t(K.state.open) })}</p>)}</div></Card>
      )}
      <div className="row gap-2 wrap">
        {r.state !== 'resolved' && <Button size="sm" variant="secondary" data-withdraw disabled={s.busy} onClick={() => void withdraw()}>{t(K.detail.withdraw)}</Button>}
        {v.canAskAgain && <Button size="sm" data-ask-again onClick={() => s.askAgain(r.entryId)}>{t(K.detail.askAgainButton)}</Button>}
        <Button size="sm" variant="ghost" data-open-entry onClick={() => s.goTo(`/payout-history?entry=${r.entryId}`)}>{t(K.detail.openEntry)}</Button>
      </div>
      {v.canAskAgain && <p className="t-xs t-muted">{t(K.detail.askAgain)}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- supplier */

function SupplierView({ s }: { s: DisputeState }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const [payment, setPayment] = useState('');
  const [position, setPosition] = useState('');
  const [claimed, setClaimed] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const targets = s.targets?.payments ?? [];
  const rows: SupplierDisputeRow[] = s.board?.supplierRows ?? [];
  const chosen = targets.find((p) => p.id === payment);
  const claim = claimed.trim() === '' ? null : Number(claimed.replace(/,/g, ''));
  const valid = !!chosen && lettersOf(position) >= TEXT_MIN && claim !== null && Number.isFinite(claim) && claim > 0;
  const send = async () => {
    if (!chosen) return;
    setProblem(null);
    const res = await s.raiseSupplier({ poId: chosen.poId, paymentId: chosen.id, position, claimedAmount: claim });
    if (res.ok) { setPayment(''); setPosition(''); setClaimed(''); toast.push(t(K.supplier.sent)); } else setProblem(res.problem);
  };
  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitleSupplier)} />
      <div className="stack gap-3">
        <Card>
          <div className="stack gap-3" data-supplier-form>
            <h2 className="t-md t-semibold">{t(K.supplier.heading)}</h2>
            <p className="t-sm t-muted">{t(K.supplier.body)}</p>
            {targets.length === 0 ? <p className="t-sm" data-none>{t(K.supplier.none)}</p> : (
              <>
                <Field label={t(K.supplier.payment)}>{(p) => <Select id={p.id} value={payment} data-f="payment" onChange={(e) => setPayment(e.target.value)}><option value="">—</option>{targets.map((x) => <option key={x.id} value={x.id}>{t(K.supplier.paymentItem, { po: x.poCode, part: t(`supplierPayment.part.${x.part}`, { defaultValue: x.part }), amount: formatINR(x.amount) })}</option>)}</Select>}</Field>
                <Field label={t(K.supplier.position)} hint={t(K.supplier.positionHint, { min: TEXT_MIN })}>{(p) => <TextArea id={p.id} rows={4} value={position} data-f="position" onChange={(e) => setPosition(e.target.value)} />}</Field>
                <Field label={t(K.supplier.claimed)}>{(p) => <Input id={p.id} inputMode="numeric" mono value={claimed} data-f="claimed" onChange={(e) => setClaimed(e.target.value)} />}</Field>
                {problem && <p className="t-sm t-error" role="alert">{problemLine(t, problem)}</p>}
                <ActionBar><Button data-send disabled={s.busy || !valid} onClick={() => void send()}>{t(K.supplier.send)}</Button></ActionBar>
              </>
            )}
          </div>
        </Card>
        <h2 className="t-md t-semibold">{t(K.supplier.list)}</h2>
        {rows.length === 0 ? <p className="t-sm t-muted" data-empty>{t(K.supplier.empty)}</p> : rows.map((r) => (
          <Card key={r.id}>
            <div className="stack gap-1" data-supplier-row={r.id}>
              <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><strong className="t-sm">{r.code}</strong><Badge tone={r.status === 'open' ? 'accent' : 'neutral'}>{t(K.supplier.status[r.status])}</Badge></span>
              <span className="t-sm">{t(K.supplier.row, { po: r.poCode, kind: t(K.supplier.kind[r.kind]) })}</span>
              {r.claimedAmount !== null && <span className="t-xs t-muted">{t(K.detail.claimed, { amount: formatINR(r.claimedAmount) })}</span>}
              {r.status === 'open' ? <span className="t-xs t-muted">{t(K.supplier.dueBy, { date: formatDate(r.dueAt, lang) })}</span> : r.lastDecision && <span className="t-xs t-muted">{t(K.supplier.decision[r.lastDecision])}</span>}
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------- admin */

function AdminView({ s }: { s: DisputeState }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const b = s.board;
  const rows = b?.rows ?? [];
  const tot = b?.totals;
  const refresh = <Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh.button)}</Button>;
  const kpi = (id: string, label: string, value: ReactNode, onClick?: () => void) => (
    <Card key={id}>
      <div className="stack gap-1" data-kpi={id} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} style={{ cursor: onClick ? 'pointer' : undefined }} onClick={onClick} onKeyDown={(e) => { if (onClick && e.key === 'Enter') onClick(); }}>
        <span className="t-xs t-muted">{label}</span><span className="num t-semibold" style={{ fontSize: 'var(--text-xl, 1.5rem)' }}>{value}</span>
      </div>
    </Card>
  );
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitleAdmin)} action={refresh} />
      {tot && (
        <div className="grid-auto gap-3 mb-4" data-kpis>
          {kpi('active', t(K.kpi.active), tot.active, () => s.setState('active'))}
          {kpi('late', t(K.kpi.late), tot.late, () => s.setFlag('late'))}
          {kpi('escalated', t(K.kpi.escalated), tot.escalated, () => s.setState('escalated'))}
          {kpi('systemic', t(K.kpi.systemic), tot.reviewDue, () => s.setFlag('systemic'))}
          {kpi('median', t(K.kpi.median), tot.medianDays === null ? <span className="t-sm t-muted">{t(K.kpi.medianNone)}</span> : tot.medianDays)}
        </div>
      )}
      {b && b.patterns.map((p) => (
        <Card key={p.ruleId}><div className="stack gap-2 mb-1" data-pattern={p.ruleId} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
          <strong className="t-sm">{t(K.pattern.heading)}</strong>
          <p className="t-sm">{t(K.pattern.body, { count: p.count, people: p.people, days: PATTERN_DAYS, rule: t(`payoutDispute.rule.${p.ruleId}`, { defaultValue: p.ruleId }) })}</p>
          <div><Button size="sm" variant="secondary" onClick={() => s.goTo(`/commission-rules?rule=${p.ruleId}`)}>{t(K.pattern.open)}</Button></div>
        </div></Card>
      ))}
      {b && b.supplier.open > 0 && (
        <Card><div className="row gap-2 wrap" data-supplier-note style={{ alignItems: 'center', justifyContent: 'space-between' }}><p className="t-sm">{t(K.supplier.note, { open: b.supplier.open, overdue: b.supplier.overdue })}</p><Button size="sm" variant="secondary" onClick={() => s.goTo('/supplier-disputes')}>{t(K.supplier.openThem)}</Button></div></Card>
      )}
      <div className="sticky-under-shell stack gap-2" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-filters>
        <Input value={s.qInput} placeholder={t(K.search.placeholder)} data-search onChange={(e) => s.setQInput(e.target.value)} />
        <Scroller>{ADMIN_STATES.map((x) => <span key={x} data-state-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.state === x} onClick={() => s.setState(x)}>{t(K.filter.state[x])}</Chip></span>)}</Scroller>
        <Scroller>{FLAGS.map((x) => <span key={x} data-flag-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.flag === x} onClick={() => s.setFlag(x)}>{t(K.filter.flag[x])}</Chip></span>)}</Scroller>
      </div>
      {rows.length === 0 ? (
        s.q || s.flag !== 'all' || s.state !== 'active'
          ? <EmptyState title={t(K.list.none.title)} body={t(K.list.none.body)} actionLabel={t(K.list.clear)} onAction={() => s.clear()} />
          : <EmptyState title={t(K.list.empty.title)} body={t(K.subtitleAdmin)} />
      ) : (
        <div className="grid-auto gap-3 mt-2" data-list>
          {rows.map((r) => (
            <Card key={r.id}>
              <div className="stack gap-1" role="button" tabIndex={0} data-open={r.id} data-state={r.state} data-sla={r.sla} style={{ cursor: 'pointer' }} onClick={() => s.open(r.id)} onKeyDown={(e) => { if (e.key === 'Enter') s.open(r.id); }}>
                <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><strong className="t-sm">{r.partnerName}</strong><Badge tone={STATE_TONE[r.state]}>{t(K.state[r.state])}</Badge><Badge tone="neutral">{t(K.kind[r.kind])}</Badge></span>
                <span className="t-xs t-muted">{r.code}{r.round > 1 ? ` · ${t(K.row.round, { n: r.round })}` : ''}</span>
                <span className="t-sm">{t(K.row.about, { reason: reasonText(t, r.reasonKey), amount: formatINR(r.entryAmount) })}</span>
                {r.claimedAmount !== null && <span className="t-xs t-muted">{t(K.row.claimed, { amount: formatINR(r.claimedAmount) })}</span>}
                <span className="t-xs t-muted" style={{ overflowWrap: 'anywhere' }}>{r.lastWords}</span>
                <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><SlaLine row={r} t={t} lang={lang} partner={false} />{r.systemic && !r.systemic.reviewed && <Badge tone="warning">{t(K.row.systemic)}</Badge>}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {b && b.total > rows.length && <div className="mt-3"><Button variant="secondary" data-more onClick={() => s.more()}>{t(K.list.more)} ({rows.length}/{b.total})</Button></div>}
      <p className="t-xs t-muted mt-4" data-placeholder>{t(K.placeholder.note)}</p>
      <AdminSheet s={s} />
      {void PAGE}
    </Screen>
  );
}

type Mode = 'explain' | 'adjust' | 'escalate' | 'update';

function AdminSheet({ s }: { s: DisputeState }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const v = s.detail;
  const [mode, setMode] = useState<Mode>('explain');
  const [text, setText] = useState('');
  const [to, setTo] = useState('');
  const [sys, setSys] = useState(false);
  const [sysNote, setSysNote] = useState('');
  const [outcome, setOutcome] = useState<'rule_changed' | 'no_change' | ''>('');
  const [problem, setProblem] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewProblem, setReviewProblem] = useState<string | null>(null);
  const reset = () => { setText(''); setTo(''); setSys(false); setSysNote(''); setOutcome(''); setProblem(null); setReviewText(''); setReviewProblem(null); };
  const done = (res: Result, toastKey: string) => { if (res.ok) { toast.push(t(toastKey)); reset(); } else setProblem(res.problem); };
  const close = () => { reset(); setMode('explain'); s.open(null); };
  const r = v?.row;
  const open = !!r && r.state !== 'resolved';
  const toNum = to.trim() === '' ? NaN : Number(to.replace(/,/g, ''));
  const rule = v?.trace.ruleId ? t(`payoutDispute.rule.${v.trace.ruleId}`, { defaultValue: v.trace.ruleId }) : '';
  const adj = v?.adjust ?? null;
  const adjOk = !!adj && Number.isFinite(toNum) && toNum > adj.current && toNum <= adj.max && lettersOf(text) >= REASON_MIN && (!sys || lettersOf(sysNote) >= SYSTEMIC_MIN);
  const canSend = mode === 'explain' ? lettersOf(text) >= EXPLAIN_MIN : mode === 'adjust' ? adjOk : mode === 'escalate' ? lettersOf(text) >= REASON_MIN : lettersOf(text) >= UPDATE_MIN;
  const submit = async () => {
    if (!r) return;
    setProblem(null);
    if (mode === 'explain') done(await s.decide(r.id, { type: 'explanation', text }), K.done.explained);
    else if (mode === 'adjust') done(await s.decide(r.id, { type: 'adjustment', to: toNum, reason: text, systemic: sys ? { note: sysNote } : null }), K.done.adjusted);
    else if (mode === 'escalate') done(await s.decide(r.id, { type: 'escalate', reason: text }), K.done.escalated);
    else done(await s.sendUpdate(r.id, text), K.done.update);
  };
  const flag = async () => { if (r) done(await s.flagSystemic(r.id, sysNote), K.done.flagged); };
  const review = async () => { if (!r || !outcome) return; const res = await s.review(r.id, { outcome, note: reviewText }); if (res.ok) { toast.push(t(K.done.reviewed)); reset(); } else setReviewProblem(res.problem); };
  const modes: Mode[] = ['explain', 'adjust', 'escalate', 'update'];
  const sysV = v?.systemic ?? null;
  return (
    <Sheet open={!!s.disputeId} onClose={close} title={r ? `${r.partnerName} · ${r.code}` : t(K.detail.heading)} closeLabel={t(K.close)}>
      {s.detailLoad === 'loading' && !v && <LoadingState label={t(K.loading)} variant="list" rows={3} />}
      {s.detailLoad === 'error' && !v && <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} />}
      {v && r && (
        <div className="stack gap-3" data-detail={r.id} data-state={r.state}>
          <div className="stack gap-1">
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone={STATE_TONE[r.state]}>{t(K.state[r.state])}</Badge><Badge tone="neutral">{t(K.kind[r.kind])}</Badge>{r.topic && <Badge tone="neutral">{t(K.topic[r.topic])}</Badge>}{r.round > 1 && <span className="t-xs t-muted">{t(K.row.round, { n: r.round })}</span>}</span>
            <SlaLine row={r} t={t} lang={lang} partner={false} />
            {r.firstDueAt && <span className="t-xs t-muted">{t(K.admin.firstBy, { date: formatDate(r.firstDueAt, lang) })}</span>}
            {r.repeat && <p className="t-sm" data-repeat>{t(K.admin.repeat, { code: r.repeat.code })}</p>}
          </div>
          <Card><div className="stack gap-1" data-entry={v.entry.id}>
            <span className="t-xs t-muted">{t(K.admin.context)}</span>
            <strong className="t-sm">{reasonText(t, v.entry.reasonKey)}</strong>
            <span className="num t-semibold">{formatINR(v.entry.amount)}</span>
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone="accent">{t(`payoutHistory.stage.${v.entry.stage}`)}</Badge><span className="t-xs t-muted">{t(K.detail.earned, { date: formatDate(v.entry.earnedAt, lang) })}</span></span>
            {r.claimedAmount !== null && <span className="t-sm">{t(K.row.claimed, { amount: formatINR(r.claimedAmount) })}</span>}
            <p className="t-xs t-muted" data-trace>{v.trace.ruleId ? t(K.admin.trace, { rule, version: v.trace.version ?? 0 }) : t(K.admin.noRule)}{v.trace.inferred && v.trace.ruleId ? ` ${t(K.admin.traceInferred)}` : ''}</p>
            <div className="row gap-2 wrap">
              <Button size="sm" variant="ghost" onClick={() => s.goTo(`/payout-tracker?entry=${v.entry.id}&days=all`)}>{t(K.admin.history)}</Button>
              {v.trace.ruleId && <Button size="sm" variant="ghost" onClick={() => s.goTo(`/commission-rules?rule=${v.trace.ruleId}`)}>{t(K.systemic.openRules)}</Button>}
            </div>
          </div></Card>
          <Card><div className="stack gap-2"><h3 className="t-sm t-semibold">{t(K.detail.thread)}</h3><Thread messages={v.messages} t={t} lang={lang} /></div></Card>
          {v.escalation && <p className="t-sm" data-escalation>{t(K.admin.escalation, { date: formatDate(v.escalation.at, lang), who: v.escalation.byName, reason: v.escalation.reason })}</p>}
          {v.earlier.length > 0 && <Card><div className="stack gap-1" data-earlier><h3 className="t-sm t-semibold">{t(K.detail.earlier)}</h3>{v.earlier.map((x) => <p key={x.id} className="t-sm">{t(K.detail.earlierItem, { code: x.code, res: x.resolution ? t(K.resolution[x.resolution]) : t(K.state.open) })}</p>)}</div></Card>}
          {r.resolution && <Card><div className="stack gap-1" data-result={r.resolution.type}><Badge tone={r.resolution.type === 'adjustment' ? 'success' : 'neutral'}>{t(K.resolution[r.resolution.type])}</Badge>{r.resolution.type === 'adjustment' && <p className="t-sm">{t(K.detail.resultAdjust, { amount: formatINR(r.resolution.correction ?? 0) })}</p>}</div></Card>}

          {sysV && (
            <Card><div className="stack gap-2" data-systemic style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
              <h3 className="t-sm t-semibold">{t(K.systemic.heading)}</h3>
              <p className="t-sm">{t(K.systemic.body, { date: formatDate(sysV.at, lang), who: sysV.byName, note: sysV.note })}</p>
              {sysV.ruleId ? (sysV.others > 0 ? <p className="t-sm">{t(K.systemic.others, { count: sysV.others, amount: formatINR(sysV.othersAmount) })}</p> : <p className="t-sm">{t(K.systemic.othersNone)}</p>) : <p className="t-sm">{t(K.systemic.noRule)}</p>}
              {sysV.othersList.length > 0 && <ul className="stack gap-1" data-others>{sysV.othersList.map((o) => <li key={o.entryId} className="t-xs">{o.partnerName} · {formatINR(o.amount)} · {formatDate(o.earnedAt, lang)}</li>)}</ul>}
              {sysV.review ? <p className="t-sm" data-reviewed>{t(K.systemic.reviewed, { date: formatDate(sysV.review.at, lang), who: sysV.review.byName, outcome: t(K.systemic[sysV.review.outcome]), note: sysV.review.note })}</p> : (
                <div className="stack gap-2" data-review-form>
                  <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.systemic.outcome)}>{(['rule_changed', 'no_change'] as const).map((o) => <Chip key={o} pressed={outcome === o} onClick={() => setOutcome(o)}>{t(K.systemic[o])}</Chip>)}</div>
                  <Field label={t(K.systemic.reviewNote)} hint={t(K.systemic.reviewHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reviewText} data-f="review-note" onChange={(e) => setReviewText(e.target.value)} />}</Field>
                  {reviewProblem && <p className="t-sm t-error" role="alert" data-problem={reviewProblem}>{problemLine(t, reviewProblem)}</p>}
                  <div><Button size="sm" data-review disabled={s.busy || !outcome || lettersOf(reviewText) < REASON_MIN} onClick={() => void review()}>{t(K.systemic.reviewSend)}</Button></div>
                </div>
              )}
            </div></Card>
          )}

          {open && (
            <Card><div className="stack gap-3" data-decide>
              <h3 className="t-sm t-semibold row gap-1" style={{ alignItems: 'center' }}><ChatCircleText size={16} aria-hidden="true" />{t(K.decide.heading)}</h3>
              <Scroller>{modes.map((m) => <span key={m} data-mode-chip={m} style={{ flex: '0 0 auto' }}><Chip pressed={mode === m} onClick={() => { setMode(m); setProblem(null); }}>{t(K.decide[m])}</Chip></span>)}</Scroller>
              {mode === 'adjust' && !adj && <p className="t-sm" data-not-payable>{t(K.adjust.notPayable)}</p>}
              {mode === 'adjust' && adj && (
                <>
                  <Field label={t(K.adjust.to)} hint={t(K.adjust.hint, { current: formatINR(adj.current), max: formatINR(Math.min(adj.max, adj.current + CORRECTION_MAX)) })}>{(p) => <Input id={p.id} inputMode="numeric" mono value={to} data-f="to" onChange={(e) => setTo(e.target.value)} />}</Field>
                  {Number.isFinite(toNum) && toNum > adj.current && <p className="t-sm" data-diff>{t(K.adjust.diff, { amount: formatINR(toNum - adj.current), rule: rule || t(K.admin.noRule) })}</p>}
                </>
              )}
              {!(mode === 'adjust' && !adj) && (
                <Field label={t(mode === 'explain' ? K.explain.label : mode === 'adjust' ? K.adjust.reason : mode === 'escalate' ? K.escalate.reason : K.update.label)} hint={t(mode === 'explain' ? K.explain.hint : mode === 'adjust' ? K.adjust.reasonHint : mode === 'escalate' ? K.escalate.hint : K.update.hint, { min: mode === 'explain' ? EXPLAIN_MIN : mode === 'update' ? UPDATE_MIN : REASON_MIN })}>{(p) => <TextArea id={p.id} rows={4} value={text} data-f="text" onChange={(e) => setText(e.target.value)} />}</Field>
              )}
              {mode === 'adjust' && adj && (
                <div className="stack gap-2">
                  <label className="row gap-2" style={{ alignItems: 'center' }}><input type="checkbox" data-f="systemic" checked={sys} onChange={(e) => setSys(e.target.checked)} /><span className="t-sm">{t(K.adjust.systemic)}</span></label>
                  {sys && <Field label={t(K.adjust.systemicNote)} hint={t(K.adjust.systemicHint, { min: SYSTEMIC_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={sysNote} data-f="sys-note" onChange={(e) => setSysNote(e.target.value)} />}</Field>}
                </div>
              )}
              {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemLine(t, problem)}</p>}
            </div></Card>
          )}
          {!sysV && (
            <Card><div className="stack gap-2" data-flag-form>
              <h3 className="t-sm t-semibold">{t(K.systemic.flag)}</h3>
              <Field label={t(K.adjust.systemicNote)} hint={t(K.adjust.systemicHint, { min: SYSTEMIC_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={sysNote} data-f="flag-note" onChange={(e) => setSysNote(e.target.value)} />}</Field>
              <div><Button size="sm" variant="secondary" data-flag disabled={s.busy || lettersOf(sysNote) < SYSTEMIC_MIN} onClick={() => void flag()}>{t(K.systemic.flagSend)}</Button></div>
            </div></Card>
          )}
          {open && !(mode === 'adjust' && !adj) && (
            <Footer>
              <Button variant="ghost" onClick={close}>{t(K.cancel)}</Button>
              <Button data-submit disabled={s.busy || !canSend} onClick={() => void submit()}>{t(mode === 'explain' ? K.explain.send : mode === 'adjust' ? K.adjust.send : mode === 'escalate' ? K.escalate.send : K.update.send)}</Button>
            </Footer>
          )}
        </div>
      )}
    </Sheet>
  );
}
