import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowsClockwise, BellRinging, CheckCircle, Megaphone, Plus, ShieldWarning, Trash } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Select, Sheet, TextArea, Toggle, formatDate, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { SopRolloutBoardView, SopRolloutChangeItem, SopRolloutDetailView, SopRolloutInput, SopRolloutPartnerStatus, SopRolloutPersonRow, SopRolloutView, SopUpdateDetailView, SopUpdateRow } from '@/data/repository';
import { AWAY_MAX_DAYS, FILTERS, MAX_QUESTIONS, MIN_NOTICE_DAYS, NOTE_MAX, OPTION_MAX, PULL_DISTANCE, REASON_MIN, REMIND_GAP_HOURS, ROLES, ROLLOUT_KEYS as K, SUMMARY_MAX, SUMMARY_MIN, URGENT_ACK_HOURS, draftKey } from './sop-rollout.types';
import { useSopRollout } from './useSopRollout';
import type { SopRolloutState } from './useSopRollout';
import { sopText } from './sop-text';

type T = ReturnType<typeof useTranslation>['t'];
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATUS_TONE: Record<SopRolloutPartnerStatus, BadgeTone> = { unseen: 'warning', seen: 'accent', quiz_passed: 'accent', complete: 'success' };
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

function Banner({ tone, children, id }: { tone: 'warning' | 'accent' | 'error'; children: ReactNode; id: string }) {
  const color = tone === 'error' ? 'var(--color-error)' : tone === 'warning' ? 'var(--color-warning)' : 'var(--color-accent-primary)';
  return <div role="status" data-banner={id} style={{ borderLeft: `3px solid ${color}`, background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md, 12px)' }} className="t-sm">{children}</div>;
}

/** The words of one step, and whether it moved: a changed or new step is what the reader needs to look at. */
function ChangeList({ items, t, lang }: { items: SopRolloutChangeItem[]; t: T; lang: string }) {
  if (items.length === 0) return null;
  const tone: Record<SopRolloutChangeItem['kind'], BadgeTone> = { added: 'emerald', changed: 'accent', removed: 'neutral' };
  return (
    <ul className="stack gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }} data-changes>
      {items.map((c) => (
        <li key={`${c.kind}:${c.id}`} className="row gap-2" style={{ alignItems: 'flex-start' }} data-change={c.kind}>
          <Badge tone={tone[c.kind]}>{t(K.change[c.kind])}</Badge>
          <span className="t-sm grow" style={{ overflowWrap: 'anywhere', textDecoration: c.kind === 'removed' ? 'line-through' : undefined }}>{sopText(t, c.label, lang)}{c.safetyCritical && <> <ShieldWarning size={14} aria-hidden="true" style={{ verticalAlign: 'text-bottom', color: 'var(--color-warning)' }} /></>}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Screen 159 — New SOP Rollout Notification. A change to a governed procedure becomes an acknowledged rollout rather than a silent configuration change:
 * Admin announces a version to the people it affects with an effective date and an optional short quiz on only what changed, tracks who has read and
 * understood it (a partner who is away stays pending and is caught up on return), can send an urgent change that does not stop field work, and corrects a
 * rollout with a new versioned one instead of editing what was already sent.
 */
export function SopRolloutScreen() {
  const { t } = useTranslation();
  const s = useSopRollout();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const title = s.isAdmin ? K.title : K.myTitle;
  if (s.status === 'loading' && !(s.board || s.mine)) return <Screen width="wide"><ScreenHeader title={t(title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.status === 'error' || !(s.board || s.mine)) return <Screen width="wide"><ScreenHeader title={t(title)} />{s.rolloutId ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.back)} onRetry={s.toBoard} /> : <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />}</Screen>;

  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-sop-rollout={s.isAdmin ? 'admin' : 'partner'}>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      {s.isAdmin ? (s.rolloutId ? <AdminDetail s={s} t={t} /> : <AdminBoard s={s} t={t} />) : s.rolloutId ? <PartnerDetail s={s} t={t} /> : <PartnerList s={s} t={t} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Admin: the board */

function StateBadges({ r, t }: { r: SopRolloutView; t: T }) {
  return (
    <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
      {r.urgent && <Badge tone="error">{t(K.badge.urgent)}</Badge>}
      {r.kind === 'correction' && <Badge tone="accent">{t(K.badge.correction)}</Badge>}
      {r.safetyChanged && <Badge tone="neutral">{t(K.badge.safety)}</Badge>}
      {r.requiresQuiz && <Badge tone="neutral">{t(K.badge.quiz)}</Badge>}
      {r.overdue && <Badge tone="warning">{t(K.badge.overdue)}</Badge>}
    </div>
  );
}

function RolloutCard({ r, t, lang, onOpen }: { r: SopRolloutView; t: T; lang: string; onOpen: () => void }) {
  const c = r.counts;
  return (
    <Card onClick={onOpen}>
      <div className="stack gap-2" data-rollout={r.id} data-state={r.state}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="stack" style={{ minWidth: 0 }}>
            <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{sopText(t, r.docTitle, lang)}</strong>
            <span className="t-xs t-muted">{r.code} · {t(K.board.version, { version: r.version })} · {r.state === 'upcoming' ? t(K.board.effective, { date: formatDate(r.effectiveDate, lang) }) : r.state === 'replaced' ? t(K.board.replacedBy, { code: r.supersededByCode ?? '' }) : t(K.board.inForce, { date: formatDate(r.effectiveDate, lang) })}</span>
          </span>
          <Badge tone={r.state === 'replaced' ? 'neutral' : r.state === 'upcoming' ? 'accent' : 'success'}>{t(K.state[r.state])}</Badge>
        </div>
        <StateBadges r={r} t={t} />
        {c.total === 0 ? <p className="t-xs t-muted">{t(K.board.noneAudience)}</p> : (
          <div className="stack gap-1">
            <ProgressBar value={c.total ? c.complete / c.total : 0} tone={c.complete === c.total ? 'success' : r.overdue ? 'warning' : 'accent'} label={`${c.complete}/${c.total}`} />
            <span className="t-xs t-muted">{t(K.board.progress, { done: c.complete, total: c.total })} · {t(K.board.breakdown, { unseen: c.unseen, seen: c.seen + c.quizPassed, away: c.away })}</span>
          </div>
        )}
        <span className="t-xs t-muted">{r.roles.map((x) => t(K.role[x])).join(', ')}</span>
      </div>
    </Card>
  );
}

function AdminBoard({ s, t }: { s: SopRolloutState; t: T }) {
  const { i18n } = useTranslation();
  const [composing, setComposing] = useState(false);
  const b = s.board as SopRolloutBoardView;
  const list = b.rollouts.filter((r) => (s.filter === 'active' ? r.state !== 'replaced' : r.state === 'replaced'));
  const k = b.kpis;
  const card = (id: string, label: string, value: number, caption: string, warn?: boolean) => (
    <Card><div className="stack gap-1" data-kpi={id}><span className="t-xs t-muted">{label}</span><span className="t-display" style={{ fontSize: 'var(--text-2xl, 1.75rem)', lineHeight: 1.1, color: warn ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>{value}</span><span className="t-xs t-muted">{caption}</span></div></Card>
  );
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
      <div className="stack gap-4">
        <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties} data-kpis>
          {card('active', t(K.kpi.active), k.active, t(K.kpi.activeCaption))}
          {card('waiting', t(K.kpi.waiting), k.waiting, t(K.kpi.waitingCaption), k.waiting > 0)}
          {card('overdue', t(K.kpi.overdue), k.overdue, t(K.kpi.overdueCaption), k.overdue > 0)}
          {card('away', t(K.kpi.away), k.away, t(K.kpi.awayCaption))}
          {card('held', t(K.kpi.held), k.held, t(K.kpi.heldCaption), k.held > 0)}
        </div>
        <div className="row gap-2" role="group" aria-label={t(K.title)}>
          {FILTERS.map((f) => <span key={f} data-filter={f}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(K.filter[f])} · {b.rollouts.filter((r) => (f === 'active' ? r.state !== 'replaced' : r.state === 'replaced')).length}</Chip></span>)}
        </div>
        {list.length === 0 ? (
          <EmptyState icon={<Megaphone size={28} />} title={s.filter === 'active' ? t(K.board.empty) : t(K.board.emptyReplaced)} body={s.filter === 'active' ? t(K.board.emptyBody) : ''} actionLabel={s.filter === 'active' ? t(K.board.announce) : undefined} onAction={s.filter === 'active' ? () => setComposing(true) : undefined} />
        ) : <div className="grid-auto" style={{ '--min': '320px' } as React.CSSProperties} data-list>{list.map((r) => <RolloutCard key={r.id} r={r} t={t} lang={i18n.language} onOpen={() => s.open(r.id)} />)}</div>}
        <p className="t-xs t-muted" data-placeholder>{t(K.board.placeholder, { days: MIN_NOTICE_DAYS, hours: URGENT_ACK_HOURS, remind: REMIND_GAP_HOURS })}</p>
      </div>
      <ActionBar><Button icon={<Megaphone size={16} />} data-announce onClick={() => setComposing(true)}>{t(K.board.announce)}</Button></ActionBar>
      <ComposeSheet open={composing} onClose={() => setComposing(false)} s={s} t={t} docs={b.docs} base={null} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ Admin: announce or correct */

interface Draft { docId: string; version: number | null; roles: string[]; summary: string; urgent: boolean; effectiveDate: string; quizOn: boolean; questions: { text: string; options: string[]; correct: number }[]; reason: string }
const blankQuestion = () => ({ text: '', options: ['', ''], correct: 0 });
const blankDraft = (): Draft => ({ docId: '', version: null, roles: [], summary: '', urgent: false, effectiveDate: plusDays(MIN_NOTICE_DAYS + 1), quizOn: false, questions: [blankQuestion()], reason: '' });

function ComposeSheet({ open, onClose, s, t, docs, base }: { open: boolean; onClose: () => void; s: SopRolloutState; t: T; docs: SopRolloutBoardView['docs']; base: SopRolloutDetailView | null }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const correcting = !!base;
  const [d, setD] = useState<Draft>(blankDraft);
  const [error, setError] = useState<string | null>(null);
  const openKey = open ? (base?.id ?? 'new') : '';
  useEffect(() => {
    if (!openKey) return;
    setError(null);
    if (base) {
      setD({ docId: base.docId, version: base.version, roles: [...base.roles], summary: base.summary, urgent: true, effectiveDate: today(), quizOn: base.questions.length > 0, questions: base.questions.length ? base.questions.map((q) => ({ text: q.text, options: [...q.options], correct: q.correct })) : [blankQuestion()], reason: '' });
      return;
    }
    try { const raw = window.localStorage.getItem(draftKey(s.userId)); if (raw) { setD({ ...blankDraft(), ...(JSON.parse(raw) as Partial<Draft>) }); return; } } catch { /* the draft is a convenience */ }
    setD(blankDraft());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey]);
  const set = (patch: Partial<Draft>) => setD((x) => { const next = { ...x, ...patch }; if (!correcting) { try { window.localStorage.setItem(draftKey(s.userId), JSON.stringify(next)); } catch { /* ignore */ } } return next; });
  const doc = docs.find((x) => x.id === d.docId);
  const ver = doc?.versions.find((v) => v.version === d.version);
  const pickDoc = (id: string) => {
    const nd = docs.find((x) => x.id === id);
    const latest = nd ? [...nd.versions].sort((a, b) => b.version - a.version)[0] : undefined;
    set({ docId: id, version: latest?.version ?? null, roles: nd ? [...nd.defaultRoles] : [], effectiveDate: latest && latest.state === 'upcoming' && latest.effectiveFrom.slice(0, 10) >= plusDays(MIN_NOTICE_DAYS) ? latest.effectiveFrom.slice(0, 10) : plusDays(MIN_NOTICE_DAYS + 1) });
  };
  const summaryOk = letters(d.summary) >= SUMMARY_MIN && d.summary.length <= SUMMARY_MAX;
  const ready = !!d.docId && d.version !== null && d.roles.length > 0 && summaryOk && (!correcting || letters(d.reason) >= REASON_MIN) && (!d.quizOn || d.questions.every((q) => letters(q.text) >= 10 && q.options.filter((o) => o.trim()).length >= 2));
  const input = (): SopRolloutInput => ({ docId: d.docId, version: d.version as number, roles: ROLES.filter((r) => d.roles.includes(r)), summary: d.summary, effectiveDate: d.urgent ? today() : d.effectiveDate, urgent: d.urgent, questions: d.quizOn ? d.questions.map((q) => ({ text: q.text, options: q.options.filter((o) => o.trim()), correct: Math.min(q.correct, q.options.filter((o) => o.trim()).length - 1) })) : [], ...(correcting ? { reason: d.reason } : {}) });
  const send = async () => {
    const r = correcting ? await s.correct((base as SopRolloutDetailView).id, input()) : await s.publish(input());
    if (!r.ok) { setError(r.code ?? 'generic'); return; }
    try { window.localStorage.removeItem(draftKey(s.userId)); } catch { /* ignore */ }
    toast.push(t(K.compose.sent));
    onClose();
    if (r.value) s.open(r.value.id);
  };
  return (
    <Sheet open={open} onClose={onClose} title={correcting ? t(K.compose.correctionTitle) : t(K.compose.title)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-form="compose">
        <p className="t-sm t-muted">{correcting ? t(K.compose.correctionBody) : t(K.compose.body)}</p>
        {correcting && <Field label={t(K.compose.reason)} hint={t(K.compose.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={d.reason} onChange={(e) => set({ reason: e.target.value })} data-f="reason" />}</Field>}
        <Field label={t(K.compose.doc)}>{(p) => (
          <Select id={p.id} value={d.docId} disabled={correcting} onChange={(e) => pickDoc(e.target.value)} data-f="doc">
            <option value="">{t(K.compose.docPick)}</option>
            {docs.map((x) => <option key={x.id} value={x.id}>{sopText(t, x.title, lang)}</option>)}
          </Select>
        )}</Field>
        {doc && (
          <Field label={t(K.compose.version)}>{(p) => (
            <Select id={p.id} value={String(d.version ?? '')} onChange={(e) => set({ version: Number(e.target.value) })} data-f="version">
              {[...doc.versions].sort((a, b) => b.version - a.version).map((v) => <option key={v.version} value={v.version}>{t(K.board.version, { version: v.version })} · {formatDate(v.effectiveFrom, lang)} · {t(K.compose.versionState[v.state])}</option>)}
            </Select>
          )}</Field>
        )}
        {ver && (
          <div className="stack gap-1" data-version-info>
            {ver.changeNote && <p className="t-sm"><strong>{t(K.compose.changes)}:</strong> {sopText(t, ver.changeNote, lang)}</p>}
            <p className="t-xs t-muted">{ver.changes ? t(K.compose.words, { added: ver.changes.added, changed: ver.changes.changed, removed: ver.changes.removed }) : t(K.compose.noChanges)}</p>
            {ver.safetyChanged && <p className="t-xs" style={{ color: 'var(--color-warning)' }} data-safety-changed>{t(K.compose.safetyChanged)}</p>}
            {ver.announcedCode && !correcting && <p className="t-xs" style={{ color: 'var(--color-warning)' }} data-announced>{t(K.compose.announced, { code: ver.announcedCode })}</p>}
          </div>
        )}
        <div className="stack gap-1"><strong className="t-sm">{t(K.compose.roles)}</strong><p className="t-xs t-muted">{t(K.compose.rolesHint)}</p>
          {ROLES.map((r) => <div key={r} data-role={r}><Checkbox checked={d.roles.includes(r)} onChange={(on) => set({ roles: on ? [...d.roles, r] : d.roles.filter((x) => x !== r) })} label={t(K.role[r])} /></div>)}
        </div>
        <Field label={t(K.compose.summary)} hint={t(K.compose.summaryHint, { min: SUMMARY_MIN, max: SUMMARY_MAX })}>{(p) => <TextArea id={p.id} rows={4} value={d.summary} maxLength={SUMMARY_MAX} placeholder={t(K.compose.summaryPlaceholder)} onChange={(e) => set({ summary: e.target.value })} data-f="summary" />}</Field>
        <div data-urgent><Toggle checked={d.urgent} onChange={(v) => set({ urgent: v })} label={t(K.compose.urgent)} description={t(K.compose.urgentHint, { hours: URGENT_ACK_HOURS })} /></div>
        {!d.urgent && <Field label={t(K.compose.effective)} hint={t(K.compose.effectiveHint, { days: MIN_NOTICE_DAYS })}>{(p) => <Input id={p.id} type="date" min={plusDays(MIN_NOTICE_DAYS)} value={d.effectiveDate} onChange={(e) => set({ effectiveDate: e.target.value })} data-f="effective" />}</Field>}
        <div className="stack gap-2" data-quiz>
          <Toggle checked={d.quizOn} onChange={(v) => set({ quizOn: v })} label={t(K.compose.quiz)} description={t(K.compose.quizHint)} />
          {ver?.safetyChanged && !d.quizOn && <p className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.compose.quizSuggest)}</p>}
          {d.quizOn && d.questions.map((q, i) => (
            <Card key={i}>
              <div className="stack gap-2" data-question={i}>
                <div className="row between"><strong className="t-sm">{t(K.compose.question, { n: i + 1 })}</strong>{d.questions.length > 1 && <Button size="sm" variant="ghost" icon={<Trash size={14} />} aria-label={t(K.compose.removeQuestion)} onClick={() => set({ questions: d.questions.filter((_, j) => j !== i) })} />}</div>
                <Field label={t(K.compose.questionText)}>{(p) => <Input id={p.id} value={q.text} onChange={(e) => set({ questions: d.questions.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} data-f={`q${i}`} />}</Field>
                {q.options.map((o, oi) => (
                  <div key={oi} className="row gap-2" style={{ alignItems: 'center' }}>
                    <input type="radio" name={`correct-${i}`} checked={q.correct === oi} onChange={() => set({ questions: d.questions.map((x, j) => (j === i ? { ...x, correct: oi } : x)) })} aria-label={t(K.compose.correct)} data-correct={`${i}:${oi}`} />
                    <span className="grow"><Input value={o} placeholder={t(K.compose.option, { n: oi + 1 })} aria-label={t(K.compose.option, { n: oi + 1 })} onChange={(e) => set({ questions: d.questions.map((x, j) => (j === i ? { ...x, options: x.options.map((y, k) => (k === oi ? e.target.value : y)) } : x)) })} data-f={`q${i}o${oi}`} /></span>
                  </div>
                ))}
                <div className="row gap-2">{q.options.length < OPTION_MAX && <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => set({ questions: d.questions.map((x, j) => (j === i ? { ...x, options: [...x.options, ''] } : x)) })}>{t(K.compose.addOption)}</Button>}</div>
              </div>
            </Card>
          ))}
          {d.quizOn && d.questions.length < MAX_QUESTIONS && <Button size="sm" variant="secondary" icon={<Plus size={14} />} data-add-question onClick={() => set({ questions: [...d.questions, blankQuestion()] })}>{t(K.compose.addQuestion)}</Button>}
          {d.quizOn && <p className="t-xs t-muted">{t(K.read.shownAsWritten)}</p>}
        </div>
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
        <Footer>
          <Button variant="ghost" onClick={onClose}>{t(K.compose.cancel)}</Button>
          <Button data-send disabled={!ready || s.busy} onClick={() => void send()}>{correcting ? t(K.compose.sendCorrection) : t(K.compose.send)}</Button>
        </Footer>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ Admin: one rollout */

function PersonRow({ p, t, lang, onAway, replaced }: { p: SopRolloutPersonRow; t: T; lang: string; onAway: () => void; replaced: boolean }) {
  return (
    <Card>
      <div className="stack gap-2" data-person={p.userId} data-status={p.status}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="stack" style={{ minWidth: 0 }}><strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{p.name}</strong><span className="t-xs t-muted">{t(K.role[p.role])}</span></span>
          <Badge tone={STATUS_TONE[p.status]}>{t(K.status[p.status])}</Badge>
        </div>
        <div className="row gap-2 wrap">
          {p.away && p.status !== 'complete' && <Badge tone="neutral">{t(K.badge.away, { date: formatDate(p.away.until, lang) })}</Badge>}
          {p.held && <Badge tone="warning">{t(K.badge.held)}</Badge>}
        </div>
        <span className="t-xs t-muted">
          {p.acknowledgedAt ? t(K.detail.acked, { date: formatDate(p.acknowledgedAt, lang) }) : p.seenAt ? t(K.detail.seen, { date: formatDate(p.seenAt, lang) }) : t(K.statusBody.unseen)}
          {p.attempts > 0 ? ` · ${t(K.detail.attempts, { count: p.attempts })}` : ''}{p.lastRemindedAt ? ` · ${t(K.detail.reminder, { date: formatDate(p.lastRemindedAt, lang) })}` : ''}
        </span>
        {p.away && p.away.note && p.status !== 'complete' && <span className="t-xs t-muted">{p.away.note}</span>}
        {!replaced && p.status !== 'complete' && <div className="row gap-2"><Button size="sm" variant="secondary" data-away={p.userId} onClick={onAway}>{p.away ? t(K.detail.clearAway) : t(K.detail.markAway)}</Button></div>}
      </div>
    </Card>
  );
}

function AwaySheet({ person, rolloutId, s, t, onClose }: { person: SopRolloutPersonRow | null; rolloutId: string; s: SopRolloutState; t: T; onClose: () => void }) {
  const [until, setUntil] = useState(plusDays(7));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setError(null); setNote(person?.away?.note ?? ''); setUntil(person?.away?.until ?? plusDays(7)); }, [person?.userId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={!!person} onClose={onClose} title={person ? person.name : t(K.away.title)} closeLabel={t(K.close)}>
      {person && (
        <div className="stack gap-3" data-form="away">
          <p className="t-sm">{person.away ? t(K.detail.awayUntil, { date: formatDate(person.away.until, '') }) : t(K.away.body)}</p>
          {!person.away && (<>
            <Field label={t(K.away.until)} hint={t(K.away.untilHint, { days: AWAY_MAX_DAYS })}>{(p) => <Input id={p.id} type="date" min={today()} value={until} onChange={(e) => setUntil(e.target.value)} data-f="until" />}</Field>
            <Field label={t(K.away.note)} hint={t(K.away.noteHint, { max: NOTE_MAX })}>{(p) => <TextArea id={p.id} rows={2} value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
          </>)}
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
          <Footer>
            <Button variant="ghost" onClick={onClose}>{t(K.away.cancel)}</Button>
            <Button data-confirm-away disabled={s.busy} onClick={async () => { const r = await s.setAway(rolloutId, person.userId, person.away ? null : { until, note }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{person.away ? t(K.detail.clearAway) : t(K.away.save)}</Button>
          </Footer>
        </div>
      )}
    </Sheet>
  );
}

function AdminDetail({ s, t }: { s: SopRolloutState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const d = s.detail as SopRolloutDetailView | null;
  const [correcting, setCorrecting] = useState(false);
  const [away, setAway] = useState<SopRolloutPersonRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!d) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="block" /></Screen>;
  const replaced = d.state === 'replaced';
  const pending = d.counts.total - d.counts.complete;
  return (
    <Screen width="default">
      <div className="stack gap-3" data-detail={d.id}>
        <div><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />} data-back onClick={s.toBoard}>{t(K.back)}</Button></div>
        <div className="stack gap-1">
          <h1 className="t-xl" style={{ overflowWrap: 'anywhere' }}>{sopText(t, d.docTitle, lang)}</h1>
          <p className="t-sm t-muted">{d.code} · {t(K.board.version, { version: d.version })} · {d.state === 'upcoming' ? t(K.board.effective, { date: formatDate(d.effectiveDate, lang) }) : d.state === 'replaced' ? t(K.board.replacedBy, { code: d.supersededByCode ?? '' }) : t(K.board.inForce, { date: formatDate(d.effectiveDate, lang) })} · {d.roles.map((r) => t(K.role[r])).join(', ')}</p>
          <StateBadges r={d} t={t} />
        </div>
        {replaced && <Banner tone="accent" id="replaced">{t(K.detail.replacedBody, { code: d.supersededByCode ?? '' })} {d.supersededById && <Button size="sm" variant="ghost" onClick={() => s.open(d.supersededById as string)}>{d.supersededByCode}</Button>}</Banner>}
        {d.kind === 'correction' && <Banner tone="accent" id="correction">{t(K.detail.correctionOf, { code: d.correctsCode ?? '' })} {d.correctionReason && <><br /><strong>{t(K.detail.correctionReason)}:</strong> {d.correctionReason}</>}</Banner>}
        {d.urgent && !replaced && <Banner tone="error" id="urgent">{t(K.detail.urgentBody, { hours: URGENT_ACK_HOURS })}</Banner>}
        {d.gatesWork && !replaced && <Banner tone="warning" id="gate">{t(K.detail.gateBody)}</Banner>}
        <Card><div className="stack gap-2"><strong className="t-md">{t(K.detail.summary)}</strong><p className="t-sm" style={{ whiteSpace: 'pre-wrap' }}>{d.summary}</p><span className="t-xs t-muted">{t(K.detail.sentBy, { name: d.createdByName, date: formatDate(d.createdAt, lang) })} · {t(K.detail.dueAt, { date: formatDate(d.dueAt, lang) })}</span></div></Card>
        {d.changes.length > 0 && <Card><div className="stack gap-2"><strong className="t-md">{t(K.detail.changes)}</strong><ChangeList items={d.changes} t={t} lang={lang} /></div></Card>}
        {d.questions.length > 0 && (
          <Card><details data-key><summary className="t-md" style={{ cursor: 'pointer' }}>{t(K.detail.key)}</summary>
            <div className="stack gap-2 mt-2"><p className="t-xs t-muted">{t(K.detail.keyHint)}</p>
              {d.questions.map((q, i) => <div key={q.id} className="stack gap-1"><strong className="t-sm">{i + 1}. {q.text}</strong>{q.options.map((o, oi) => <span key={oi} className="t-sm" style={{ fontWeight: oi === q.correct ? 600 : 400 }}>{oi === q.correct ? '✓ ' : '• '}{o}</span>)}</div>)}
            </div></details></Card>
        )}
        <div className="row gap-2 wrap">
          <Button size="sm" variant="secondary" onClick={() => s.goto(`/sops/${d.docId}?v=${d.version}`)}>{t(K.detail.openDoc)}</Button>
          {!replaced && pending > 0 && <Button size="sm" icon={<BellRinging size={14} />} data-remind disabled={s.busy} onClick={async () => { const r = await s.remind(d.id); if (!r.ok) setError(r.code ?? 'generic'); else { setError(null); toast.push(t(K.detail.reminded, { count: r.value?.reminded ?? 0, skipped: r.value?.skipped ?? 0 })); } }}>{t(K.detail.remind, { count: pending })}</Button>}
          {!replaced && <Button size="sm" variant="secondary" data-correct onClick={() => setCorrecting(true)}>{t(K.detail.correct)}</Button>}
        </div>
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
        <section className="stack gap-2">
          <div className="stack gap-1"><strong className="t-md">{t(K.detail.people)}</strong><ProgressBar value={d.counts.total ? d.counts.complete / d.counts.total : 0} tone={pending === 0 ? 'success' : 'accent'} label={`${d.counts.complete}/${d.counts.total}`} /><span className="t-xs t-muted">{t(K.board.progress, { done: d.counts.complete, total: d.counts.total })} · {t(K.board.breakdown, { unseen: d.counts.unseen, seen: d.counts.seen + d.counts.quizPassed, away: d.counts.away })}</span></div>
          {d.people.length === 0 ? <p className="t-sm t-muted">{t(K.detail.noPeople)}</p> : pending === 0 && <p className="t-sm" data-all-done><CheckCircle size={16} aria-hidden="true" style={{ verticalAlign: 'text-bottom', color: 'var(--color-success)' }} /> {t(K.detail.allDone)}</p>}
          <div className="grid-auto" style={{ '--min': '280px' } as React.CSSProperties} data-people>{d.people.map((p) => <PersonRow key={p.userId} p={p} t={t} lang={lang} replaced={replaced} onAway={() => setAway(p)} />)}</div>
        </section>
      </div>
      <ComposeSheet open={correcting} onClose={() => setCorrecting(false)} s={s} t={t} docs={s.board?.docs ?? []} base={d} />
      <AwaySheet person={away ? d.people.find((p) => p.userId === away.userId) ?? null : null} rolloutId={d.id} s={s} t={t} onClose={() => setAway(null)} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ Partner: what is waiting */

function UpdateRow({ r, t, lang, onOpen }: { r: SopUpdateRow; t: T; lang: string; onOpen: () => void }) {
  return (
    <Card onClick={onOpen}>
      <div className="stack gap-2" data-update={r.id} data-status={r.status}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="stack" style={{ minWidth: 0 }}><strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{sopText(t, r.docTitle, lang)}</strong><span className="t-xs t-muted">{r.code} · {t(K.board.version, { version: r.version })} · {t(K.mine.due, { date: formatDate(r.dueAt, lang) })}</span></span>
          <Badge tone={STATUS_TONE[r.status]}>{t(K.status[r.status])}</Badge>
        </div>
        <div className="row gap-2 wrap">
          {r.urgent && <Badge tone="error">{t(K.badge.urgent)}</Badge>}
          {r.kind === 'correction' && <Badge tone="accent">{t(K.badge.correction)}</Badge>}
          {r.requiresQuiz && r.status !== 'complete' && <Badge tone="neutral">{t(K.badge.quiz)}</Badge>}
          {r.held && <Badge tone="warning">{t(K.badge.held)}</Badge>}
          {r.away && r.status !== 'complete' && <Badge tone="neutral">{t(K.badge.away, { date: formatDate(r.away.until, lang) })}</Badge>}
        </div>
      </div>
    </Card>
  );
}

function PartnerList({ s, t }: { s: SopRolloutState; t: T }) {
  const { i18n } = useTranslation();
  const items = s.mine?.items ?? [];
  const waiting = items.filter((x) => x.status !== 'complete');
  const done = items.filter((x) => x.status === 'complete');
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.myTitle)} subtitle={t(K.mySubtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
      <div className="stack gap-4">
        {waiting.some((x) => x.held) && <Banner tone="warning" id="held">{t(K.mine.heldBanner)}</Banner>}
        {items.length === 0 ? <EmptyState icon={<Megaphone size={28} />} title={t(K.mine.none)} body={t(K.mine.noneBody)} /> : (
          <>
            {waiting.length > 0 && <section className="stack gap-2" data-pending><h2 className="t-lg">{t(K.mine.pending)} · {waiting.length}</h2>{waiting.map((r) => <UpdateRow key={r.id} r={r} t={t} lang={i18n.language} onOpen={() => s.open(r.id)} />)}</section>}
            {done.length > 0 && <section className="stack gap-2" data-done><h2 className="t-lg">{t(K.mine.done)} · {done.length}</h2>{done.map((r) => <UpdateRow key={r.id} r={r} t={t} lang={i18n.language} onOpen={() => s.open(r.id)} />)}</section>}
          </>
        )}
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Partner: read, answer, acknowledge */

function PartnerDetail({ s, t }: { s: SopRolloutState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const u = s.update as SopUpdateDetailView | null;
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const qn = u?.questions.length ?? 0;
  useEffect(() => { setAnswers(Array.from({ length: qn }, () => null)); }, [u?.rollout.id, qn]);
  if (!u) return <Screen width="narrow"><ScreenHeader title={t(K.myTitle)} /><LoadingState label={t(K.loading)} variant="block" /></Screen>;
  const r = u.rollout;
  const replaced = !!u.replacedBy;
  const complete = u.status === 'complete';
  const result = s.quiz;
  const quizPassed = !!u.quizPassedAt || !!result?.passed;
  const allAnswered = answers.length === qn && answers.every((a) => a !== null);
  return (
    <Screen width="narrow">
      <div className="stack gap-3" data-update-detail={r.id} data-status={u.status}>
        <div><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />} data-back onClick={s.toBoard}>{t(K.back)}</Button></div>
        <div className="stack gap-1">
          <h1 className="t-xl" style={{ overflowWrap: 'anywhere' }}>{sopText(t, r.docTitle, lang)}</h1>
          <p className="t-sm t-muted">{r.code} · {t(K.board.version, { version: r.version })} · {t(K.read.effective, { date: formatDate(r.effectiveDate, lang) })}</p>
          <div className="row gap-2 wrap"><Badge tone={STATUS_TONE[u.status]}>{t(K.status[u.status])}</Badge>{r.urgent && <Badge tone="error">{t(K.badge.urgent)}</Badge>}{r.kind === 'correction' && <Badge tone="accent">{t(K.badge.correction)}</Badge>}</div>
        </div>
        {replaced && <Banner tone="accent" id="replaced">{t(K.read.replacedBanner, { code: u.replacedBy?.code ?? '' })} {u.replacedBy && <Button size="sm" variant="ghost" onClick={() => s.open((u.replacedBy as { id: string }).id)}>{u.replacedBy.code}</Button>}</Banner>}
        {r.kind === 'correction' && !replaced && <Banner tone="accent" id="correction">{t(K.read.correctionBanner, { code: r.correctsCode ?? '' })}{r.correctionReason ? ` ${r.correctionReason}` : ''}</Banner>}
        {r.urgent && !complete && !replaced && <Banner tone="error" id="urgent">{t(K.read.urgentBanner, { hours: URGENT_ACK_HOURS })}</Banner>}
        {u.held && <Banner tone="warning" id="held">{t(K.read.heldBanner)}</Banner>}
        {u.away && !complete && <Banner tone="accent" id="away">{t(K.read.awayBanner, { date: formatDate(u.away.until, lang) })}</Banner>}
        <Card><div className="stack gap-2"><p className="t-sm" style={{ whiteSpace: 'pre-wrap' }} data-summary>{r.summary}</p></div></Card>
        {r.changes.length > 0 && <Card><div className="stack gap-2"><strong className="t-md">{t(K.read.whatChanged)}</strong><ChangeList items={r.changes} t={t} lang={lang} />{r.safetyChanged && <p className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.read.safetyNote)}</p>}</div></Card>}
        <div>{u.docRoute ? <Button variant="secondary" data-open-doc onClick={() => s.goto(u.docRoute as string)}>{t(K.read.openDoc)}</Button> : <p className="t-xs t-muted">{t(K.read.noDocForRole)}</p>}</div>
        {qn > 0 && !replaced && (
          <Card>
            <div className="stack gap-3" data-quiz>
              <div className="stack gap-1"><strong className="t-md">{t(K.read.quizHeading)}</strong><p className="t-sm t-muted">{t(K.read.quizBody)}</p></div>
              {u.questions.map((q, qi) => (
                <fieldset key={q.id} className="stack gap-2" style={{ border: 0, padding: 0, margin: 0 }} data-q={qi} disabled={quizPassed}>
                  <legend className="t-sm" style={{ fontWeight: 600 }}>{t(K.read.questionOf, { n: qi + 1, total: qn })} {q.text}</legend>
                  {q.options.map((o, oi) => {
                    const r1 = result?.results[qi];
                    const mark = result && !quizPassed ? (oi === r1?.correctIndex ? 'correct' : answers[qi] === oi ? 'wrong' : '') : '';
                    return (
                      <label key={oi} className="row gap-2" style={{ alignItems: 'center', minHeight: 48, padding: '0 var(--space-3)', border: `1px solid ${mark === 'correct' ? 'var(--color-success)' : mark === 'wrong' ? 'var(--color-warning)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md, 12px)', background: 'var(--color-surface)' }} data-option={`${qi}:${oi}`} data-mark={mark}>
                        <input type="radio" name={`q-${q.id}`} checked={answers[qi] === oi} onChange={() => { setAnswers((a) => a.map((x, i) => (i === qi ? oi : x))); }} />
                        <span className="t-sm">{o}</span>
                      </label>
                    );
                  })}
                </fieldset>
              ))}
              {quizPassed ? <p className="t-sm" role="status" data-quiz-passed><CheckCircle size={16} aria-hidden="true" style={{ verticalAlign: 'text-bottom', color: 'var(--color-success)' }} /> {t(K.read.passed)}</p> : (
                <>
                  {result && !result.passed && <p className="t-sm" role="status" data-quiz-failed style={{ color: 'var(--color-warning)' }}>{t(K.read.notYet)}</p>}
                  {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
                  <div className="row gap-2">
                    <Button data-check disabled={!allAnswered || s.busy} onClick={async () => { const x = await s.submitQuiz(answers.map((a) => a as number)); if (!x.ok) setError(x.code ?? 'generic'); else setError(null); }}>{t(K.read.check)}</Button>
                    {result && !result.passed && <Button variant="ghost" data-retry onClick={() => { setAnswers(Array.from({ length: qn }, () => null)); s.reload(); }}>{t(K.read.retry)}</Button>}
                  </div>
                  {!allAnswered && <p className="t-xs t-muted">{t(K.read.answerAll)}</p>}
                </>
              )}
              <p className="t-xs t-muted">{t(K.read.shownAsWritten)}</p>
            </div>
          </Card>
        )}
        {complete ? (
          <Card><div className="stack gap-1" data-complete><strong className="t-md"><CheckCircle size={18} aria-hidden="true" style={{ verticalAlign: 'text-bottom', color: 'var(--color-success)' }} /> {t(K.read.done)}</strong><p className="t-sm t-muted">{t(K.read.doneBody, { date: formatDate(u.acknowledgedAt as string, lang) })}</p></div></Card>
        ) : !replaced && (
          <div className="stack gap-1">
            {qn > 0 && !quizPassed && <p className="t-xs t-muted">{t(K.read.quizFirst)}</p>}
            {error && qn === 0 && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
            <Button data-acknowledge disabled={(qn > 0 && !quizPassed) || s.busy} onClick={async () => { const x = await s.acknowledge(); if (!x.ok) setError(x.code ?? 'generic'); else setError(null); }}>{t(K.read.acknowledge)}</Button>
            <p className="t-xs t-muted">{t(K.read.acknowledgeHint)}</p>
          </div>
        )}
      </div>
    </Screen>
  );
}
