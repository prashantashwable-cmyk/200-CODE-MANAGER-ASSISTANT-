import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CaretRight, Warning } from '@phosphor-icons/react';
import { AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, SegBar, Select, Sheet, TextArea, formatDate, formatINR } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { ExitRowView, ExitWorkItem, PartnerExitView } from '@/data/repository';
import type { ExitActionKind, ExitItemType, ExitKind, ExitSettlement, PartnerExit } from '@/data/types';
import { EXIT_KEYS as K, HOWS, INTERVIEW_HOWS, INTERVIEW_REASONS, INVOLUNTARY_REASONS, KINDS, LAST_DAY_MAX_DAYS, OUTCOMES, REASON_MIN, RETURNS, STAGES, VOLUNTARY_REASONS, draftKey, supplierPaymentsPath } from './partner-exit.types';
import { usePartnerExit } from './usePartnerExit';
import type { PartnerExitState } from './usePartnerExit';

type T = ReturnType<typeof useTranslation>['t'];
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const dayKey = (n: number) => { const d = new Date(Date.now() + n * 86_400_000); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const reasonName = (t: T, r: string) => t(K.reason[r] ?? 'partnerExit.reason.other', { defaultValue: r });
const totalOf = (s: ExitSettlement) => s.amount + (s.adjustment?.amount ?? 0);
const readJson = <V,>(key: string): V | null => { try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as V) : null; } catch { return null; } };
const writeJson = (key: string, v: unknown | null) => { try { if (v === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(v)); } catch { /* kept only while open */ } };

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>{children}</div>;
}
function Problem({ code, t }: { code: string | null; t: T }) {
  return code ? <p className="t-xs t-error" role="alert" data-problem={code}>{t(problemKey(code))}</p> : null;
}
const lineLabel = (t: T, kind: string, label: string) => (label.startsWith('commission.reason.') ? t(label, { defaultValue: label }) : `${t(K.settle.line[kind as keyof typeof K.settle.line] ?? K.settle.line.payment_owed)} ${label}`);

/**
 * Screen 150 — Partner Deactivation & Exit. A list of exits under way and the attrition picture, and one guided flow per partner: the reason,
 * the work in their hands, the settlement, the end of access and an exit conversation. A voluntary exit ends access last; a removal for a
 * serious violation ends it first.
 */
export function PartnerExitScreen() {
  const { t } = useTranslation();
  const s = usePartnerExit();
  if (s.status === 'loading' && !s.board && !s.view) return <Screen width="default"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  if (s.status === 'not_found') return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.back)} onAction={s.back} /></Screen>;
  if (s.status === 'error' && !s.board && !s.view) return <Screen width="default"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  if (s.partnerId) return s.view ? <Detail s={s} v={s.view} t={t} /> : <Screen width="default"><LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  return <Screen width="default"><Board s={s} t={t} /></Screen>;
}

/* ------------------------------------------------------------------ the board */

function ExitCard({ r, t, onOpen }: { r: ExitRowView; t: T; onOpen: () => void }) {
  const { i18n } = useTranslation();
  return (
    <Card onClick={onOpen}>
      <div className="stack gap-1" data-exit={r.partnerId} data-stage={r.stage} data-status={r.status}>
        <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="stack" style={{ minWidth: 0 }}><strong className="t-md">{r.partnerName}</strong><span className="t-xs t-muted">{t(K.type[r.partnerType])} · {r.code}</span></span>
          <CaretRight size={14} aria-hidden="true" />
        </div>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone={r.kind === 'involuntary' ? 'warning' : 'neutral'}>{t(K.kind[r.kind])}</Badge>
          <Badge tone={r.status === 'completed' ? 'success' : r.status === 'cancelled' ? 'neutral' : 'accent'}>{r.status === 'in_progress' ? t(K.stage[r.stage]) : t(K.status[r.status])}</Badge>
          <span className="t-xs t-muted">{reasonName(t, r.reason)}</span>
        </span>
        <span className="t-xs t-muted">
          {r.status === 'in_progress' ? [t(K.board.lastDay, { date: formatDate(r.lastDay, i18n.language) }), r.workOpen > 0 ? t(K.board.workLeft, { count: r.workOpen }) : null, r.amount !== null ? t(K.board.owed, { amount: formatINR(r.amount) }) : null].filter(Boolean).join(' · ') : t(K.board.closed, { date: formatDate(r.completedAt ?? r.startedAt, i18n.language) })}
        </span>
      </div>
    </Card>
  );
}

function Board({ s, t }: { s: PartnerExitState; t: T }) {
  const b = s.board as NonNullable<PartnerExitState['board']>;
  const a = b.attrition;
  const top = Math.max(1, a.byReason[0]?.count ?? 1);
  return (
    <div className="stack gap-4" data-board>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      <Card>
        <div className="row gap-3 wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="t-sm" style={{ flex: '1 1 220px' }}>{t(K.board.startHint)}</p>
          <Button size="sm" data-to-directory onClick={s.toDirectory}>{t(K.board.toDirectory)}</Button>
        </div>
      </Card>
      <div className="grid-auto" style={{ '--min': '340px', alignItems: 'start' } as React.CSSProperties}>
        <div className="stack gap-2">
          <h2 className="t-md t-semibold">{t(K.board.open)}</h2>
          {b.open.length === 0 ? <p className="t-sm t-muted" data-open-empty>{t(K.board.openEmpty)}</p> : b.open.map((r) => <ExitCard key={r.id} r={r} t={t} onOpen={() => s.open(r.partnerId)} />)}
        </div>
        <Card>
          <div className="stack gap-3" data-attrition>
            <div className="stack"><h2 className="t-md t-semibold">{t(K.board.attrition)}</h2><p className="t-xs t-muted">{t(K.board.attritionHint)}</p></div>
            {a.total === 0 ? <p className="t-sm t-muted">{t(K.board.attritionEmpty)}</p> : (
              <>
                <p className="t-sm">{t(K.board.attritionTotal, { count: a.total })} · {t(K.board.attritionInvoluntary, { count: a.involuntary })}{a.avgTenureMonths !== null ? ` · ${t(K.board.tenure, { count: a.avgTenureMonths })}` : ''}</p>
                <div className="stack gap-2">
                  <strong className="t-sm">{t(K.board.byReason)}</strong>
                  {a.byReason.map((r) => (
                    <div key={`${r.kind}:${r.reason}`} className="stack gap-1" data-reason={r.reason}>
                      <span className="row gap-2" style={{ justifyContent: 'space-between' }}><span className="t-sm">{reasonName(t, r.reason)}{r.kind === 'involuntary' ? ` · ${t(K.kind.involuntary)}` : ''}</span><strong className="num t-sm">{r.count}</strong></span>
                      <ProgressBar value={r.count / top} label={`${r.reason} ${r.count}`} tone={r.kind === 'involuntary' ? 'warning' : 'accent'} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
      <div className="stack gap-2">
        <h2 className="t-md t-semibold">{t(K.board.done)}</h2>
        {b.done.length === 0 ? <p className="t-sm t-muted">{t(K.board.doneEmpty)}</p> : <div className="grid-auto" style={{ '--min': '320px', alignItems: 'start' } as React.CSSProperties}>{b.done.map((r) => <ExitCard key={r.id} r={r} t={t} onOpen={() => s.open(r.partnerId)} />)}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ one partner */

function Detail({ s, v, t }: { s: PartnerExitState; v: PartnerExitView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const ex = v.exit;
  const live = ex && ex.status === 'in_progress';
  const [cancelOpen, setCancelOpen] = useState(false);
  const stepStatus = (id: (typeof STAGES)[number]): AscensionStep['status'] => {
    if (!ex) return id === 'plan' ? 'current' : 'upcoming';
    const order: string[] = [...STAGES];
    const cur = v.stage === 'done' ? order.length : order.indexOf(v.stage);
    return order.indexOf(id) < cur ? 'complete' : order.indexOf(id) === cur ? 'current' : 'upcoming';
  };
  const steps: AscensionStep[] = STAGES.map((id) => ({ id, label: t(K.steps[id]), status: stepStatus(id) }));
  return (
    <Screen width="default">
      <div className="stack gap-4" data-detail={v.partner.id} data-stage={v.stage} data-kind={ex?.kind ?? ''}>
        <div className="stack gap-2">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} style={{ width: 'fit-content' }} data-back onClick={s.back}>{t(K.back)}</Button>
          <ScreenHeader title={v.partner.name} subtitle={`${t(K.type[v.partner.type])}${v.partner.city ? ` · ${v.partner.city}` : ''}`} />
        </div>
        {!ex || ex.status === 'cancelled' ? (
          <>
            {ex?.status === 'cancelled' && <Card><p className="t-sm" data-cancelled>{t(K.summary.cancelled, { date: formatDate(ex.cancelled?.at ?? ex.startedAt, lang), name: ex.cancelled?.byName ?? '' })} “{ex.cancelled?.reason}”</p></Card>}
            <StartForm s={s} v={v} t={t} />
          </>
        ) : (
          <>
            <Card>
              <div className="stack gap-2" data-summary>
                <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                  <Badge tone={ex.kind === 'involuntary' ? 'warning' : 'neutral'}>{t(K.kind[ex.kind])}</Badge>
                  <Badge tone={ex.status === 'completed' ? 'success' : 'accent'}>{ex.status === 'completed' ? t(K.status.completed) : t(K.stage[v.stage])}</Badge>
                  <strong className="t-sm">{reasonName(t, ex.reason)}</strong>
                </span>
                <span className="t-xs t-muted">{t(K.summary.code, { code: ex.code })} · {t(K.summary.started, { date: formatDate(ex.startedAt, lang), name: ex.startedByName })} · {t(K.summary.lastDay, { date: formatDate(ex.lastDay, lang) })}</span>
                <p className="t-sm">“{ex.note}”</p>
                {ex.status === 'completed' && <p className="t-sm" data-completed>{t(K.summary.completed, { date: formatDate(ex.completedAt ?? ex.startedAt, lang) })}</p>}
                {live && !ex.accessRevoked && <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} data-open-cancel onClick={() => setCancelOpen(true)}>{t(K.summary.cancel)}</Button>}
              </div>
            </Card>
            <Card><AscensionLine steps={steps} orientation="vertical" /></Card>
            <WorkSection s={s} v={v} ex={ex} t={t} lang={lang} />
            <SettlementSection s={s} v={v} ex={ex} t={t} lang={lang} />
            <AccessSection s={s} v={v} ex={ex} t={t} lang={lang} />
            <InterviewSection s={s} ex={ex} t={t} lang={lang} />
          </>
        )}
      </div>
      <CancelSheet s={s} t={t} open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ 1. start */

interface StartDraft { kind: ExitKind; reason: string; note: string; lastDay: string }

function StartForm({ s, v, t }: { s: PartnerExitState; v: PartnerExitView; t: T }) {
  const key = draftKey(s.userId, v.partner.id);
  const blank: StartDraft = { kind: 'voluntary', reason: '', note: '', lastDay: dayKey(7) };
  const [f, setF] = useState<StartDraft>(blank);
  const [kept, setKept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const d = readJson<StartDraft>(key); setKept(!!d && (!!d.reason || !!d.note)); setF(d ?? blank); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch: Partial<StartDraft>) => setF((c) => { const n = { ...c, ...patch }; writeJson(key, n); return n; });
  const reasons = f.kind === 'involuntary' ? INVOLUNTARY_REASONS : VOLUNTARY_REASONS;
  const inv = f.kind === 'involuntary';
  const ok = !!f.reason && letters(f.note) >= REASON_MIN && (inv || !!f.lastDay);
  if (v.partner.status !== 'active') return <EmptyState title={t(K.start.heading)} body={t(K.start.notActive)} actionLabel={t(K.back)} onAction={s.back} />;
  return (
    <Card>
      <div className="stack gap-3" data-form="start">
        <div className="stack"><h2 className="t-md t-semibold">{t(K.start.heading)}</h2><p className="t-sm">{t(K.start.body)}</p></div>
        {kept && <p className="t-xs t-muted" data-draft-kept>{t(K.start.draftKept)}</p>}
        <div className="stack gap-1">
          <strong className="t-sm">{t(K.start.kind)}</strong>
          <SegBar label={t(K.start.kind)} value={f.kind} onChange={(id) => set({ kind: id as ExitKind, reason: '' })} items={KINDS.map((k) => ({ id: k, label: t(K.kind[k]) }))} />
          <p className="t-xs t-muted">{t(K.start.kindHint[f.kind])}</p>
        </div>
        {inv && <p className="t-sm" role="note" data-violation><Warning size={16} aria-hidden="true" color="var(--color-warning)" /> {t(K.start.violationWarn)}</p>}
        <Field label={t(K.start.reason)}>{(p) => <Select id={p.id} value={f.reason} onChange={(e) => set({ reason: e.target.value })} data-f="reason"><option value="">{t(K.start.reasonPlaceholder)}</option>{reasons.map((r) => <option key={r} value={r}>{reasonName(t, r)}</option>)}</Select>}</Field>
        <Field label={t(K.start.note)} hint={t(K.start.noteHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={f.note} onChange={(e) => set({ note: e.target.value })} data-f="note" />}</Field>
        {!inv && <Field label={t(K.start.lastDay)} hint={t(K.start.lastDayHint, { days: LAST_DAY_MAX_DAYS })}>{(p) => <Input id={p.id} type="date" min={dayKey(0)} max={dayKey(LAST_DAY_MAX_DAYS)} value={f.lastDay} onChange={(e) => set({ lastDay: e.target.value })} data-f="lastDay" />}</Field>}
        <div className="stack gap-1" data-in-hand>
          <strong className="t-sm">{t(K.start.inHand)}</strong>
          <span className="t-sm">{v.work.length === 0 ? t(K.start.inHandNone) : t(K.work.holds, { count: v.work.length, what: t(K.work.itemType[v.work[0].type]) })}</span>
          <span className="t-xs t-muted">{t(K.start.owed, { amount: formatINR(v.preview.amount) })}</span>
        </div>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={s.back}>{t(K.action.cancel)}</Button><Button disabled={!ok || s.busy} data-confirm-start onClick={async () => { const r = await s.start({ kind: f.kind, reason: f.reason, note: f.note, lastDay: f.lastDay }); if (!r.ok) setError(r.code ?? 'generic'); else writeJson(key, null); }}>{inv ? t(K.start.confirmViolation) : t(K.start.confirm)}</Button></Footer>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ 2. work in hand */

function WorkSection({ s, v, ex, t, lang }: { s: PartnerExitState; v: PartnerExitView; ex: PartnerExit; t: T; lang: string }) {
  const types: ExitItemType[] = v.partner.type === 'surveyor' ? ['lead'] : v.partner.type === 'technician' ? ['job'] : ['order'];
  const type = types[0];
  const items = v.work;
  const [sel, setSel] = useState<string[]>([]);
  const [action, setAction] = useState<ExitActionKind | ''>('');
  const [toId, setToId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setSel((c) => c.filter((id) => items.some((w) => w.id === id))), [items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const actions: ExitActionKind[] = type === 'lead' ? ['reassigned', 'returned_to_pool'] : type === 'job' ? ['reassigned'] : ex.kind === 'voluntary' ? ['reassigned', 'finish_first', 'alternate_sourcing', 'cancelled'] : ['reassigned', 'alternate_sourcing', 'cancelled'];
  const eff: ExitActionKind | '' = action || (actions.length === 1 ? actions[0] : '');
  const needsTarget = eff === 'reassigned' || eff === 'alternate_sourcing';
  const options = type === 'lead' ? v.targets.surveyors.map((x) => ({ id: x.id, label: `${x.name} · ${t(K.work.open, { count: x.openLeads })}` })) : type === 'job' ? v.targets.technicians.map((x) => ({ id: x.id, label: `${x.name} · ${x.canLead ? t(K.work.canLead) : t(K.work.cannotLead)}` })) : v.targets.suppliers.map((x) => ({ id: x.id, label: x.name }));
  const selectable = items.filter((w) => !w.finishing);
  const ready = sel.length > 0 && !!eff && (!needsTarget || !!toId) && letters(note) >= 8;
  const history = ex.actions.slice().reverse();
  return (
    <Card>
      <div className="stack gap-3" data-section="work">
        <div className="stack"><h2 className="t-md t-semibold">{t(K.work.heading)}</h2><p className="t-sm">{ex.kind === 'involuntary' ? t(K.work.bodyViolation) : t(K.work.body)}</p></div>
        {items.length === 0 ? <p className="t-sm t-muted" data-work-none>{t(K.work.none)}</p> : (
          <>
            <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
              <Button size="sm" variant="ghost" data-select-all onClick={() => setSel(sel.length === selectable.length ? [] : selectable.map((w) => w.id))}>{t(K.work.selectAll)}</Button>
              <span className="t-xs t-muted">{t(K.work.selected, { count: sel.length })}</span>
            </div>
            <div className="stack gap-1">
              {items.map((w) => (
                <div key={w.id} className="row gap-2" data-work-item={w.id} data-finishing={w.finishing ? 1 : 0} style={{ alignItems: 'center' }}>
                  {w.finishing ? <Badge tone="accent">{t(K.work.finishing)}</Badge> : <Checkbox checked={sel.includes(w.id)} onChange={(on) => setSel((c) => (on ? [...c, w.id] : c.filter((x) => x !== w.id)))} label="" />}
                  <button type="button" className="stack grow t-sm" style={{ textAlign: 'left', background: 'none', border: 0, padding: 0, cursor: w.route ? 'pointer' : 'default', color: 'inherit', minWidth: 0 }} onClick={() => w.route && s.goto(w.route)}><strong>{w.label}</strong><span className="t-xs t-muted">{w.detail}</span></button>
                </div>
              ))}
            </div>
            <div className="stack gap-2" data-form="work">
              <Field label={t(K.work.action)}>{(p) => <Select id={p.id} value={eff} onChange={(e) => setAction(e.target.value as ExitActionKind)} data-f="action"><option value="">—</option>{actions.map((a) => <option key={a} value={a}>{t(K.work.actionOption[a])}</option>)}</Select>}</Field>
              {eff && <p className="t-xs t-muted">{t(K.work.actionHint[eff])}</p>}
              {needsTarget && <Field label={t(K.work.to)}>{(p) => <Select id={p.id} value={toId} onChange={(e) => setToId(e.target.value)} data-f="to"><option value="">{t(K.work.toPlaceholder)}</option>{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select>}</Field>}
              <Field label={t(K.work.note)} hint={t(type === 'job' ? K.work.jobNote : type === 'order' ? K.work.orderNote : K.work.noteHint)}>{(p) => <TextArea id={p.id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
              <Problem code={error} t={t} />
              <Button disabled={!ready || s.busy} style={{ width: 'fit-content' }} data-apply-work onClick={async () => { const r = await s.resolve({ type, itemIds: sel, action: eff as ExitActionKind, ...(needsTarget ? { toId } : {}), note }); if (!r.ok) setError(r.code ?? 'generic'); else { setError(null); setSel([]); setNote(''); setToId(''); } }}>{t(K.work.apply)}</Button>
            </div>
          </>
        )}
        {history.length > 0 && (
          <div className="stack gap-1" data-work-history>
            <strong className="t-sm">{t(K.work.history)}</strong>
            {history.map((a) => <span key={a.id} className="t-xs">{t(K.work.historyRow, { label: a.label, action: t(K.work.actionOption[a.action]), to: a.toName ?? '', date: formatDate(a.at, lang) })} “{a.note}”</span>)}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ 3. settlement */

function Lines({ lines, held, t }: { lines: { kind: string; label: string; amount: number }[]; held: { kind: string; label: string; amount: number }[]; t: T }) {
  return (
    <div className="stack gap-1" data-lines>
      {lines.length === 0 ? <span className="t-sm t-muted">{t(K.settle.noLines)}</span> : lines.map((l, i) => <span key={i} className="row gap-2 t-sm" style={{ justifyContent: 'space-between' }}><span>{lineLabel(t, l.kind, l.label)}</span><strong className="num">{formatINR(l.amount)}</strong></span>)}
      {held.length > 0 && (
        <div className="stack gap-1" data-held style={{ marginTop: 'var(--space-2)' }}>
          {held.map((l, i) => <span key={i} className="row gap-2 t-xs t-muted" style={{ justifyContent: 'space-between' }}><span>{t(K.settle.held[l.kind as keyof typeof K.settle.held])} · {lineLabel(t, l.kind, l.label)}</span><span className="num">{formatINR(l.amount)}</span></span>)}
          <p className="t-xs t-muted">{t(K.settle.heldHint)}</p>
        </div>
      )}
    </div>
  );
}

function SettlementSection({ s, v, ex, t, lang }: { s: PartnerExitState; v: PartnerExitView; ex: PartnerExit; t: T; lang: string }) {
  const st = ex.settlement;
  const live = ex.status === 'in_progress';
  const [withhold, setWithhold] = useState(false);
  const [withholdReason, setWithholdReason] = useState('');
  const [how, setHow] = useState<(typeof HOWS)[number]>('call');
  const [note, setNote] = useState('');
  const [sheet, setSheet] = useState<'dispute' | 'decide' | 'release' | null>(null);
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const preview = st ?? { lines: v.preview.lines, held: v.preview.held, amount: v.preview.amount };
  const total = st ? totalOf(st) : v.preview.amount;
  return (
    <Card>
      <div className="stack gap-3" data-section="settlement" data-settle={st?.status ?? 'none'}>
        <div className="stack"><h2 className="t-md t-semibold">{t(K.settle.heading)}</h2><p className="t-sm">{ex.kind === 'involuntary' ? t(K.settle.bodyViolation) : t(K.settle.body)}</p></div>
        <Lines lines={preview.lines} held={preview.held} t={t} />
        {st?.adjustment && <span className="row gap-2 t-sm" style={{ justifyContent: 'space-between' }}><span>{t(K.settle.adjustment)}</span><strong className="num">{formatINR(st.adjustment.amount)}</strong></span>}
        <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
          <span className="t-sm">{total < 0 ? t(K.settle.totalNegative) : t(K.settle.total)}</span>
          <strong className="num t-lg" data-total>{formatINR(total)}</strong>
        </div>
        <span className="t-xs t-muted">{st ? t(K.settle.asOf, { date: formatDate(st.calculatedAt, lang), name: st.byName }) : t(K.settle.live)}</span>

        {st?.withheld && (
          <div className="stack gap-1" role="note" data-withheld>
            <strong className="t-sm"><Warning size={16} aria-hidden="true" color="var(--color-warning)" /> {t(K.settle.withheldTitle)}</strong>
            <p className="t-sm">{t(K.settle.withheldBody)} “{st.withheld.reason}”</p>
            {live && <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} data-open-release onClick={() => setSheet('release')}>{t(K.settle.release)}</Button>}
          </div>
        )}
        {live && !st && (
          <div className="stack gap-2" data-form="confirm-settlement">
            {ex.kind === 'involuntary' && (
              <>
                <div data-f="withhold"><Checkbox checked={withhold} onChange={setWithhold} label={t(K.settle.withhold)} /></div>
                <p className="t-xs t-muted">{t(K.settle.withholdHint)}</p>
                {withhold && <Field label={t(K.settle.withholdReason)}>{(p) => <TextArea id={p.id} rows={2} value={withholdReason} onChange={(e) => setWithholdReason(e.target.value)} data-f="withholdReason" />}</Field>}
              </>
            )}
            <Problem code={error} t={t} />
            <Button disabled={s.busy || (withhold && letters(withholdReason) < REASON_MIN)} style={{ width: 'fit-content' }} data-confirm-settlement onClick={async () => { const r = await s.confirmSettlement(withhold ? { withholdReason } : {}); if (!r.ok) setError(r.code ?? 'generic'); }}>{t(K.settle.confirm)}</Button>
          </div>
        )}
        {live && st?.status === 'proposed' && (
          <div className="stack gap-2" data-form="agree">
            <Field label={t(K.settle.agreeHow)}>{(p) => <Select id={p.id} value={how} onChange={(e) => setHow(e.target.value as (typeof HOWS)[number])} data-f="how">{HOWS.map((h) => <option key={h} value={h}>{t(K.settle.how[h])}</option>)}</Select>}</Field>
            <Field label={t(K.settle.agreeNote)}>{(p) => <TextArea id={p.id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-f="agreeNote" />}</Field>
            <Problem code={error} t={t} />
            <div className="row gap-2 wrap">
              <Button disabled={s.busy || letters(note) < 8} data-agree onClick={async () => { const r = await s.agree({ how, note }); if (!r.ok) setError(r.code ?? 'generic'); else setNote(''); }}>{t(K.settle.agree)}</Button>
              <Button variant="secondary" data-open-dispute onClick={() => setSheet('dispute')}>{t(K.settle.dispute)}</Button>
              <Button variant="ghost" disabled={s.busy} data-recalc onClick={() => void s.confirmSettlement({})}>{t(K.settle.recalc)}</Button>
            </div>
          </div>
        )}
        {st?.dispute && (
          <div className="stack gap-1" data-dispute data-dispute-status={st.dispute.status}>
            <Badge tone={st.dispute.status === 'open' ? 'warning' : 'neutral'}>{st.dispute.status === 'open' ? t(K.settle.disputeOpen) : t(K.settle.outcomeOption[st.dispute.decision?.outcome ?? 'uphold'])}</Badge>
            <span className="t-sm">{t(K.settle.disputeBy, { name: st.dispute.raisedByName, amount: formatINR(st.dispute.claimedAmount) })} “{st.dispute.grounds}”</span>
            {st.dispute.decision && <span className="t-sm" data-decision>{t(K.settle.decidedBy, { name: st.dispute.decision.byName, date: formatDate(st.dispute.decision.at, lang), amount: formatINR(st.dispute.decision.amount) })} “{st.dispute.decision.note}”</span>}
            {live && st.dispute.status === 'open' && <Button size="sm" style={{ width: 'fit-content' }} data-open-decide onClick={() => setSheet('decide')}>{t(K.settle.decide)}</Button>}
          </div>
        )}
        {st?.agreed && <p className="t-sm" data-agreed>{t(K.settle.how[st.agreed.how])} · {st.agreed.byName} · {formatDate(st.agreed.at, lang)} “{st.agreed.note}”</p>}
        {live && st?.status === 'agreed' && !st.withheld && total > 0 && v.partner.type !== 'supplier' && (
          <div className="stack gap-2" data-form="pay">
            <p className="t-xs t-muted">{t(K.settle.payHint)}</p>
            <Field label={t(K.settle.reference)}>{(p) => <Input id={p.id} value={reference} onChange={(e) => setReference(e.target.value)} data-f="reference" />}</Field>
            <Problem code={error} t={t} />
            <Button disabled={s.busy || reference.trim().length < 4} style={{ width: 'fit-content' }} data-pay onClick={async () => { const r = await s.pay(reference); if (!r.ok) setError(r.code ?? 'generic'); }}>{t(K.settle.pay)}</Button>
          </div>
        )}
        {st && st.status !== 'paid' && v.partner.type === 'supplier' && total > 0 && (
          <p className="t-xs t-muted" data-supplier-pay>{t(K.settle.supplierPay)} <button type="button" className="t-xs" style={{ background: 'none', border: 0, padding: 0, color: 'var(--color-accent-primary)', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => s.goto(supplierPaymentsPath)}>{t(K.settle.supplierPayLink)}</button></p>
        )}
        {st?.status === 'agreed' && total <= 0 && <p className="t-sm t-muted">{t(K.settle.nothing)}</p>}
        {st?.paid && <p className="t-sm" data-paid>{t(K.settle.paidBy, { name: st.paid.byName, date: formatDate(st.paid.at, lang), reference: st.paid.reference, amount: formatINR(st.paid.amount) })}</p>}
      </div>
      <DisputeSheet s={s} t={t} open={sheet === 'dispute'} floor={st ? totalOf(st) : 0} onClose={() => setSheet(null)} />
      <DecideSheet s={s} t={t} open={sheet === 'decide'} st={st} onClose={() => setSheet(null)} />
      <ReleaseSheet s={s} t={t} open={sheet === 'release'} onClose={() => setSheet(null)} />
    </Card>
  );
}

function DisputeSheet({ s, t, open, floor, onClose }: { s: PartnerExitState; t: T; open: boolean; floor: number; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [grounds, setGrounds] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setAmount(''); setGrounds(''); setError(null); } }, [open]);
  const n = Number(amount);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.settle.disputeHeading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="dispute">
        <p className="t-sm">{t(K.settle.disputeBody)}</p>
        <Field label={t(K.settle.claimed)} hint={t(K.settle.claimedHint, { amount: formatINR(floor) })}>{(p) => <Input id={p.id} type="number" min={0} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} data-f="claimed" />}</Field>
        <Field label={t(K.settle.grounds)} hint={t(K.settle.groundsHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={grounds} onChange={(e) => setGrounds(e.target.value)} data-f="grounds" />}</Field>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.action.cancel)}</Button><Button disabled={!(n > floor) || letters(grounds) < REASON_MIN || s.busy} data-confirm-dispute onClick={async () => { const r = await s.dispute({ claimedAmount: n, grounds }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.settle.raise)}</Button></Footer>
      </div>
    </Sheet>
  );
}

function DecideSheet({ s, t, open, st, onClose }: { s: PartnerExitState; t: T; open: boolean; st?: ExitSettlement; onClose: () => void }) {
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>('uphold');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setOutcome('uphold'); setAmount(''); setNote(''); setError(null); } }, [open]);
  const extra = st?.dispute ? Math.max(0, st.dispute.claimedAmount - totalOf(st)) : 0;
  return (
    <Sheet open={open} onClose={onClose} title={t(K.settle.decide)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="decide">
        <Field label={t(K.settle.outcome)}>{(p) => <Select id={p.id} value={outcome} onChange={(e) => setOutcome(e.target.value as (typeof OUTCOMES)[number])} data-f="outcome">{OUTCOMES.map((o) => <option key={o} value={o}>{t(K.settle.outcomeOption[o])}</option>)}</Select>}</Field>
        <p className="t-xs t-muted">{t(K.settle.outcomeHint[outcome])}</p>
        {outcome === 'partial' && <Field label={t(K.settle.amount)} hint={t(K.settle.amountHint, { max: formatINR(extra) })}>{(p) => <Input id={p.id} type="number" min={1} max={Math.max(1, extra - 1)} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} data-f="amount" />}</Field>}
        <Field label={t(K.settle.decisionNote)} hint={t(K.settle.decisionNoteHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.action.cancel)}</Button><Button disabled={letters(note) < REASON_MIN || (outcome === 'partial' && !(Number(amount) > 0)) || s.busy} data-confirm-decide onClick={async () => { const r = await s.decide({ outcome, ...(outcome === 'partial' ? { amount: Number(amount) } : {}), note }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.settle.decide)}</Button></Footer>
      </div>
    </Sheet>
  );
}

function ReleaseSheet({ s, t, open, onClose }: { s: PartnerExitState; t: T; open: boolean; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setNote(''); setError(null); } }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.settle.release)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="release">
        <Field label={t(K.settle.releaseNote)} hint={t(K.start.noteHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.action.cancel)}</Button><Button disabled={letters(note) < REASON_MIN || s.busy} data-confirm-release onClick={async () => { const r = await s.confirmSettlement({ releaseNote: note }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.settle.release)}</Button></Footer>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ 4. access */

function AccessSection({ s, v, ex, t, lang }: { s: PartnerExitState; v: PartnerExitView; ex: PartnerExit; t: T; lang: string }) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = ex.status === 'in_progress';
  return (
    <Card>
      <div className="stack gap-3" data-section="access" data-ended={ex.accessRevoked ? 1 : 0}>
        <div className="stack"><h2 className="t-md t-semibold">{t(K.access.heading)}</h2><p className="t-sm">{ex.kind === 'involuntary' ? t(K.access.bodyViolation) : t(K.access.body)}</p></div>
        {ex.accessRevoked ? (
          <p className="t-sm" data-access-ended>{ex.accessRevoked.first ? t(K.access.endedFirst, { date: formatDate(ex.accessRevoked.at, lang), name: ex.accessRevoked.byName }) : t(K.access.done, { date: formatDate(ex.accessRevoked.at, lang), name: ex.accessRevoked.byName })}</p>
        ) : (
          <>
            {v.blockers.length > 0 ? (
              <div className="stack gap-1" data-blockers><strong className="t-sm">{t(K.access.waiting)}</strong><ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>{v.blockers.map((b) => <li key={b} className="t-sm" data-blocker={b}>{t(K.blocker[b])}</li>)}</ul></div>
            ) : <p className="t-sm" data-ready>{t(K.access.ready)}</p>}
            <p className="t-xs t-muted">{t(K.access.effects[v.partner.type])} {ex.kind === 'voluntary' ? t(K.access.lastDayAuto, { date: formatDate(ex.lastDay, lang) }) : ''}</p>
            {live && <Button disabled={!v.canEndAccess || s.busy} style={{ width: 'fit-content' }} data-end-access onClick={() => { setError(null); setConfirm(true); }}>{t(K.access.end)}</Button>}
          </>
        )}
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title={t(K.access.endHeading, { name: v.partner.name })} closeLabel={t('action.close')}>
        <div className="stack gap-3" data-form="end-access">
          <p className="t-sm">{t(K.access.endBody)}</p>
          <p className="t-xs t-muted">{t(K.access.effects[v.partner.type])}</p>
          <Problem code={error} t={t} />
          <Footer><Button variant="ghost" onClick={() => setConfirm(false)}>{t(K.action.cancel)}</Button><Button disabled={s.busy} data-confirm-end onClick={async () => { const r = await s.endAccess(); if (!r.ok) setError(r.code ?? 'generic'); else setConfirm(false); }}>{t(K.access.endConfirm)}</Button></Footer>
        </div>
      </Sheet>
    </Card>
  );
}

/* ------------------------------------------------------------------ 5. exit conversation */

function InterviewSection({ s, ex, t, lang }: { s: PartnerExitState; ex: PartnerExit; t: T; lang: string }) {
  const [how, setHow] = useState<(typeof INTERVIEW_HOWS)[number]>('call');
  const [reasons, setReasons] = useState<string[]>([]);
  const [ret, setRet] = useState<(typeof RETURNS)[number] | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const iv = ex.interview;
  const declined = how === 'declined';
  const ok = declined || (reasons.length > 0 || letters(notes) >= 8);
  return (
    <Card>
      <div className="stack gap-3" data-section="interview">
        <div className="stack"><h2 className="t-md t-semibold">{t(K.interview.heading)}</h2><p className="t-sm">{t(K.interview.body)}</p></div>
        {iv ? (
          <div className="stack gap-1" data-interview-done>
            <span className="t-sm">{iv.how === 'declined' ? t(K.interview.declined) : t(K.interview.recorded, { how: t(K.interview.howOption[iv.how]), name: iv.byName, date: formatDate(iv.at, lang) })}</span>
            {iv.reasons.length > 0 && <span className="row gap-2 wrap">{iv.reasons.map((r) => <Badge key={r} tone="neutral">{reasonName(t, r)}</Badge>)}</span>}
            {iv.wouldReturn && <span className="t-xs t-muted">{t(K.interview.wouldReturn)}: {t(K.interview.returnOption[iv.wouldReturn])}</span>}
            {iv.notes && <span className="t-sm">“{iv.notes}”</span>}
          </div>
        ) : (
          <div className="stack gap-2" data-form="interview">
            <Field label={t(K.interview.how)}>{(p) => <Select id={p.id} value={how} onChange={(e) => setHow(e.target.value as (typeof INTERVIEW_HOWS)[number])} data-f="how">{INTERVIEW_HOWS.map((h) => <option key={h} value={h}>{t(K.interview.howOption[h])}</option>)}</Select>}</Field>
            {!declined && (
              <>
                <div className="stack gap-1"><strong className="t-sm">{t(K.interview.reasons)}</strong><div className="row gap-2 wrap">{INTERVIEW_REASONS.map((r) => <span key={r} data-reason-chip={r}><Chip pressed={reasons.includes(r)} onClick={() => setReasons((c) => (c.includes(r) ? c.filter((x) => x !== r) : [...c, r]))}>{reasonName(t, r)}</Chip></span>)}</div></div>
                <Field label={t(K.interview.wouldReturn)}>{(p) => <Select id={p.id} value={ret} onChange={(e) => setRet(e.target.value as (typeof RETURNS)[number])} data-f="return"><option value="">—</option>{RETURNS.map((r) => <option key={r} value={r}>{t(K.interview.returnOption[r])}</option>)}</Select>}</Field>
                <Field label={t(K.interview.notes)}>{(p) => <TextArea id={p.id} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} data-f="notes" />}</Field>
              </>
            )}
            <Problem code={error} t={t} />
            <Button disabled={!ok || s.busy} style={{ width: 'fit-content' }} data-save-interview onClick={async () => { const r = await s.interview({ how, reasons: declined ? [] : reasons, wouldReturn: declined ? null : ret || null, notes }); if (!r.ok) setError(r.code ?? 'generic'); }}>{t(K.interview.save)}</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function CancelSheet({ s, t, open, onClose }: { s: PartnerExitState; t: T; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setReason(''); setError(null); } }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.cancel.heading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="cancel">
        <p className="t-sm">{t(K.cancel.body)}</p>
        <Field label={t(K.cancel.reason)} hint={t(K.cancel.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.cancel.keep)}</Button><Button disabled={letters(reason) < REASON_MIN || s.busy} data-confirm-cancel onClick={async () => { const r = await s.cancel(reason); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.cancel.confirm)}</Button></Footer>
      </div>
    </Sheet>
  );
}
