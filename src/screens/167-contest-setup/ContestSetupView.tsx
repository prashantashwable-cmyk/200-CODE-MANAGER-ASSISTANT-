import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Plus, Trash } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, Toggle, formatDate, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { ContestAdminDetail, ContestAdminRow, ContestPreviewView, ContestRewardView } from '@/data/repository';
import { SETUP_KEYS as K, END_REASON_MIN, MAX_CASH, MAX_DAYS, MAX_PLACES, METRICS_OF, MIN_DAYS, PULL_DISTANCE, STATE_FILTERS, contestProblem, durationDays, totalCash } from './contest-setup.types';
import type { ContestInput, ContestMetric, ContestPhase, RewardInput } from './contest-setup.types';
import { useContestSetup } from './useContestSetup';
import type { ActionResult, ContestSetupState } from './useContestSetup';

type T = ReturnType<typeof useTranslation>['t'];
const PHASE_TONE: Record<ContestPhase, BadgeTone> = { active: 'success', scheduled: 'accent', closed: 'neutral', ended_early: 'warning' };
const STATE_OF: Record<ContestPhase, Exclude<(typeof STATE_FILTERS)[number], 'all'>> = { active: 'live', scheduled: 'scheduled', closed: 'finished', ended_early: 'finished' };
const lettersOf = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemText = (t: T, p: string) => t(`contestSetup.problem.${p}`, { min: END_REASON_MIN, defaultValue: t(K.problem.generic) });
const metricName = (t: T, m: ContestMetric) => t(`rewardsLeaderboard.metric.${m}`);
const cohortName = (t: T, c: 'surveyor' | 'technician') => t(`rewardsLeaderboard.cohort.${c}`);
const phaseName = (t: T, p: ContestPhase) => t(`rewardsLeaderboard.phase.${p}`);
const valueText = (t: T, m: ContestMetric, v: number) => (m === 'revenue' ? formatINR(v) : t(`rewardsLeaderboard.value.${m}`, { count: v }));
const rewardWhat = (t: T, r: { kind: 'cash' | 'recognition'; amount: number | null; label: string | null }) => (r.kind === 'cash' ? t(K.reward.cash, { amount: formatINR(r.amount ?? 0) }) : (r.label ?? ''));
const rewardsLine = (t: T, rs: ContestRewardView[]) => rs.map((r) => t(K.reward.line, { rank: r.rank, what: rewardWhat(t, r) })).join(' · ');
const pad = (n: number) => String(n).padStart(2, '0');
const toLocal = (iso: string): string => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromLocal = (v: string): string => { const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : d.toISOString(); };

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

/**
 * Screen 167 — Competition/Contest Configuration. Admin sets a contest up with a prize structure, scores it as it would stand today before anyone sees it, and can end a flawed one
 * early with a reason the people in it read. Rules are locked once it starts; closing is what pays (each cash prize becomes a commission entry cleared through the payout approval);
 * past contests keep their outcomes so the next one can be designed from what happened.
 */
export function ContestSetupScreen() {
  const { t } = useTranslation();
  const s = useContestSetup();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  if (s.load === 'loading' && !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' || !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const d = s.data;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  const list = d.contests.filter((c) => s.state === 'all' || STATE_OF[c.phase] === s.state);
  const editing = s.edit ? (s.edit === 'new' ? 'new' : (d.contests.find((c) => c.id === s.edit) ?? null)) : null;
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-contest-setup>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<span className="row gap-2"><Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button><Button size="sm" icon={<Plus size={16} />} data-new onClick={() => s.openEditor('new')}>{t(K.new)}</Button></span>} />
        <div className="stack gap-4">
          <Summary d={d} s={s} t={t} />
          <section className="stack gap-3" data-list>
            <div className="sticky-under-shell stack gap-2" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-filters>
              <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                {STATE_FILTERS.map((x) => <span key={x} data-state-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.state === x} onClick={() => s.setState(x)}>{t(K.filter[x])} · {x === 'all' ? d.counts.all : d.counts[x]}</Chip></span>)}
              </div>
            </div>
            {d.contests.length === 0 ? <EmptyState title={t(K.list.empty.title)} body={t(K.list.empty.body)} /> : list.length === 0 ? <Card><p className="t-sm" data-none-in>{t(K.list.noneIn)}</p></Card> : (
              <div className="grid-auto" style={{ '--min': '340px' } as React.CSSProperties} data-rows>{list.map((c) => <ContestCard key={c.id} c={c} s={s} t={t} />)}</div>
            )}
          </section>
          <p className="t-xs t-muted" data-note-how>{t(K.note.how)}</p>
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { places: MAX_PLACES, cash: formatINR(MAX_CASH), min: MIN_DAYS, max: MAX_DAYS, reason: END_REASON_MIN })}</p>
        </div>
      </Screen>
      <Detail s={s} t={t} />
      {editing && <Editor key={editing === 'new' ? 'new' : editing.id} s={s} t={t} existing={editing === 'new' ? null : editing} />}
    </div>
  );
}

/* ------------------------------------------------------------------ The list */

function Summary({ d, s, t }: { d: NonNullable<ContestSetupState['data']>; s: ContestSetupState; t: T }) {
  const card = (id: 'live' | 'scheduled' | 'finished', label: string, n: number) => (
    <Card onClick={() => s.setState(id)}>
      <div className="stack gap-1" data-kpi={id} style={{ cursor: 'pointer' }}>
        <span className="t-xs t-muted">{label}</span>
        <span className="num t-semibold" style={{ fontSize: 'var(--text-2xl, 1.75rem)', lineHeight: 1.1 }} data-value>{n}</span>
        <span className="t-xs">{n === 0 ? t(K.summary.none) : t(K.list.count, { count: n })}</span>
      </div>
    </Card>
  );
  return <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties} data-summary>{card('live', t(K.summary.live), d.counts.live)}{card('scheduled', t(K.summary.scheduled), d.counts.scheduled)}{card('finished', t(K.summary.finished), d.counts.finished)}</div>;
}

function ContestCard({ c, s, t }: { c: ContestAdminRow; s: ContestSetupState; t: T }) {
  const { i18n } = useTranslation();
  const over = c.phase === 'closed' || c.phase === 'ended_early';
  return (
    <Card>
      <div className="stack gap-2" data-contest={c.id} data-phase={c.phase}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="stack" style={{ minWidth: 0 }}><strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{c.name}</strong><span className="t-xs t-muted">{c.code} · {cohortName(t, c.cohort)} · {metricName(t, c.metric)}</span></span>
          <Badge tone={PHASE_TONE[c.phase]}>{phaseName(t, c.phase)}</Badge>
        </div>
        <span className="t-xs t-muted">{t(K.card.window, { from: formatDate(c.startsAt, i18n.language), to: formatDate(c.endedAt ?? c.endsAt, i18n.language), days: durationDays(c.startsAt, c.endedAt ?? c.endsAt) })}</span>
        <span className="t-sm" data-prizes>{c.rewards.length > 0 ? t(K.card.prizes, { list: rewardsLine(t, c.rewards) }) : ''}</span>
        {over ? (
          <>
            <span className="t-sm" data-winners>{c.winners.length > 0 ? t(K.card.winners, { list: c.winners.map((w) => `#${w.rank} ${w.name}`).join(' · ') }) : t(K.card.noWinners)}</span>
            {c.paid && <span className="t-xs" data-paid>{t(K.card.paid, { amount: formatINR(c.paid.amount) })}</span>}
            {c.legacy && <span className="t-xs t-muted">{t(K.card.legacy)}</span>}
            {c.rewardPolicy === 'none' && <span className="t-xs t-muted">{t(K.card.notPaid)}</span>}
          </>
        ) : <span className="t-xs t-muted">{t(K.card.participants, { count: c.participants })}</span>}
        {c.phase === 'active' && <span className="t-xs t-muted">{t(K.card.locked)}</span>}
        <span className="row gap-2 wrap">
          <Button size="sm" variant="secondary" data-open={c.id} onClick={() => s.openContest(c.id)}>{t(K.card.open)}</Button>
          {c.phase === 'scheduled' && <Button size="sm" data-edit={c.id} onClick={() => s.openEditor(c.id)}>{t(K.card.edit)}</Button>}
        </span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ The editor, with its preview */

interface Draft { name: string; description: string; cohort: 'surveyor' | 'technician'; metric: ContestMetric; startsAt: string; endsAt: string; minTenure: string; lateJoin: boolean; rewards: { kind: 'cash' | 'recognition'; amount: string; label: string }[] }
const draftKey = (user: string, id: string) => `aiec.contestDraft.${user}.${id}`;

function initialDraft(existing: ContestAdminRow | null): Draft {
  if (existing) return { name: existing.name, description: existing.description ?? '', cohort: existing.cohort, metric: existing.metric, startsAt: toLocal(existing.startsAt), endsAt: toLocal(existing.endsAt), minTenure: String(existing.minTenureDays), lateJoin: existing.allowLateJoiners, rewards: existing.rewards.map((r) => ({ kind: r.kind, amount: r.amount !== null ? String(r.amount) : '', label: r.label ?? '' })) };
  const start = new Date(Date.now() + 86_400_000); start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 14 * 86_400_000); end.setHours(21, 0, 0, 0);
  return { name: '', description: '', cohort: 'surveyor', metric: 'leadsConverted', startsAt: toLocal(start.toISOString()), endsAt: toLocal(end.toISOString()), minTenure: '0', lateJoin: true, rewards: [{ kind: 'cash', amount: '5000', label: '' }, { kind: 'cash', amount: '3000', label: '' }] };
}
const inputOf = (d: Draft): ContestInput => ({
  name: d.name, description: d.description, cohort: d.cohort, metric: d.metric, startsAt: fromLocal(d.startsAt), endsAt: fromLocal(d.endsAt), minTenureDays: Number(d.minTenure) || 0, allowLateJoiners: d.lateJoin,
  rewards: d.rewards.map((r, i): RewardInput => (r.kind === 'cash' ? { rank: i + 1, kind: 'cash', amount: Number(r.amount) } : { rank: i + 1, kind: 'recognition', label: r.label })),
});

function Editor({ s, t, existing }: { s: ContestSetupState; t: T; existing: ContestAdminRow | null }) {
  const toast = useToast();
  const key = draftKey(s.userId, existing?.id ?? 'new');
  const [d, setD] = useState<Draft>(() => { try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw) as Draft; } catch { /* no draft */ } return initialDraft(existing); });
  const [preview, setPreview] = useState<ContestPreviewView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<Draft>) => setD((x) => { const n = { ...x, ...p }; try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* not kept */ } return n; });
  const input = inputOf(d);
  const local = (() => { const ms = Date.parse(input.startsAt); return Number.isFinite(ms) ? contestProblem(input, Date.now(), { editing: !!existing }) : 'dates_invalid'; })();
  const startsNow = Number.isFinite(Date.parse(input.startsAt)) && Math.abs(Date.parse(input.startsAt) - Date.now()) <= 5 * 60_000;
  // The preview follows the form, a moment after the last change.
  useEffect(() => { const h = window.setTimeout(() => { void s.preview(input, existing?.id).then(setPreview); }, 450); return () => window.clearTimeout(h); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(input)]);
  const metrics = METRICS_OF[d.cohort];
  const close = () => s.openEditor(null);
  const save = async () => {
    setBusy(true); setError(null);
    const res: ActionResult<ContestAdminRow> = await s.save({ ...input, ...(existing ? { id: existing.id } : {}) });
    setBusy(false);
    if (!res.ok) { setError(problemText(t, res.problem)); return; }
    try { localStorage.removeItem(key); } catch { /* nothing to clear */ }
    toast.push(res.value.phase === 'active' ? t(K.editor.savedLive) : t(K.editor.saved));
    s.finishEdit(res.value.id);
  };
  return (
    <Sheet open onClose={close} title={existing ? t(K.editor.titleEdit) : t(K.editor.titleNew)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-editor>
        <Field label={t(K.editor.name)} hint={t(K.editor.nameHint)}>{(p) => <Input id={p.id} value={d.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} data-f="name" />}</Field>
        <Field label={t(K.editor.description)}>{(p) => <TextArea id={p.id} rows={2} value={d.description} maxLength={300} onChange={(e) => set({ description: e.target.value })} data-f="description" />}</Field>
        <div className="grid-auto" style={{ '--min': '200px' } as React.CSSProperties}>
          <Field label={t(K.editor.cohort)}>{(p) => <Select id={p.id} value={d.cohort} onChange={(e) => { const c = e.target.value as 'surveyor' | 'technician'; set({ cohort: c, metric: METRICS_OF[c].includes(d.metric) ? d.metric : METRICS_OF[c][0] }); }} data-f="cohort"><option value="surveyor">{cohortName(t, 'surveyor')}</option><option value="technician">{cohortName(t, 'technician')}</option></Select>}</Field>
          <Field label={t(K.editor.metric)}>{(p) => <Select id={p.id} value={d.metric} onChange={(e) => set({ metric: e.target.value as ContestMetric })} data-f="metric">{metrics.map((m) => <option key={m} value={m}>{metricName(t, m)}</option>)}</Select>}</Field>
        </div>
        <p className="t-xs t-muted" data-metric-help>{t(`contestSetup.editor.metricHelp.${d.metric}`)}</p>
        <div className="grid-auto" style={{ '--min': '200px' } as React.CSSProperties}>
          <Field label={t(K.editor.starts)}>{(p) => <Input id={p.id} type="datetime-local" value={d.startsAt} onChange={(e) => set({ startsAt: e.target.value })} data-f="starts" />}</Field>
          <Field label={t(K.editor.ends)}>{(p) => <Input id={p.id} type="datetime-local" value={d.endsAt} onChange={(e) => set({ endsAt: e.target.value })} data-f="ends" />}</Field>
        </div>
        {Number.isFinite(Date.parse(input.endsAt)) && Number.isFinite(Date.parse(input.startsAt)) && Date.parse(input.endsAt) > Date.parse(input.startsAt) && <p className="t-xs t-muted" data-duration>{t(K.editor.duration, { days: durationDays(input.startsAt, input.endsAt) })}</p>}
        {startsNow && !existing && <p className="t-xs" data-starts-now>{t(K.editor.startsNow)}</p>}

        <section className="stack gap-2" data-eligibility>
          <h3 className="t-sm t-semibold">{t(K.editor.eligibility)}</h3>
          <Field label={t(K.editor.minTenure)} hint={t(K.editor.minTenureHint)}>{(p) => <Input id={p.id} type="number" min={0} value={d.minTenure} onChange={(e) => set({ minTenure: e.target.value })} data-f="tenure" />}</Field>
          <Toggle checked={d.lateJoin} onChange={(v) => set({ lateJoin: v })} label={t(K.editor.lateJoin)} description={t(K.editor.lateJoinHint)} />
        </section>

        <section className="stack gap-2" data-rewards>
          <h3 className="t-sm t-semibold">{t(K.editor.rewards.heading)}</h3>
          {d.rewards.map((r, i) => (
            <div key={i} className="stack gap-1" data-reward={i + 1} style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>
              <div className="row between" style={{ alignItems: 'center' }}><strong className="t-sm">{t(K.editor.rewards.place, { rank: i + 1 })}</strong>{d.rewards.length > 1 && <Button size="sm" variant="ghost" icon={<Trash size={14} />} data-remove={i + 1} onClick={() => set({ rewards: d.rewards.filter((_, j) => j !== i) })}>{t(K.editor.rewards.remove)}</Button>}</div>
              <div className="grid-auto" style={{ '--min': '180px' } as React.CSSProperties}>
                <Field label={t(K.editor.rewards.kind)}>{(p) => <Select id={p.id} value={r.kind} onChange={(e) => set({ rewards: d.rewards.map((x, j) => (j === i ? { ...x, kind: e.target.value as 'cash' | 'recognition' } : x)) })} data-f={`kind-${i + 1}`}><option value="cash">{t(K.editor.rewards.cash)}</option><option value="recognition">{t(K.editor.rewards.recognition)}</option></Select>}</Field>
                {r.kind === 'cash' ? <Field label={t(K.editor.rewards.amount)}>{(p) => <Input id={p.id} type="number" min={1} value={r.amount} onChange={(e) => set({ rewards: d.rewards.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)) })} data-f={`amount-${i + 1}`} />}</Field> : <Field label={t(K.editor.rewards.label)}>{(p) => <Input id={p.id} value={r.label} maxLength={60} onChange={(e) => set({ rewards: d.rewards.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} data-f={`label-${i + 1}`} />}</Field>}
              </div>
            </div>
          ))}
          {d.rewards.length < MAX_PLACES && <div><Button size="sm" variant="secondary" icon={<Plus size={14} />} data-add-place onClick={() => set({ rewards: [...d.rewards, { kind: 'cash', amount: '1000', label: '' }] })}>{t(K.editor.rewards.add)}</Button></div>}
          <p className="t-xs t-muted" data-cash-total>{t(K.editor.rewards.total, { amount: formatINR(totalCash(input.rewards)) })}</p>
          <p className="t-xs t-muted">{t(K.editor.rewards.note)}</p>
        </section>

        <Preview preview={preview} input={input} t={t} />

        {(local || error) && <p className="t-sm" role="alert" data-error style={{ color: 'var(--color-error)' }}>{error ?? problemText(t, local as string)}</p>}
        <p className="t-xs t-muted">{t(K.editor.draftKept)}</p>
        <Footer>
          <Button variant="ghost" onClick={close}>{t(K.cancelButton)}</Button>
          <Button data-save disabled={busy || !!local} onClick={() => void save()}>{existing ? t(K.editor.save) : startsNow ? t(K.editor.saveNow) : t(K.editor.saveNew)}</Button>
        </Footer>
      </div>
    </Sheet>
  );
}

function Preview({ preview, input, t }: { preview: ContestPreviewView | null; input: ContestInput; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <section className="stack gap-2" data-preview>
      <div className="stack gap-1"><h3 className="t-sm t-semibold">{t(K.preview.heading)}</h3><p className="t-xs t-muted">{t(K.preview.body)}</p></div>
      {!preview ? <p className="t-xs t-muted">…</p> : (
        <Card>
          <div className="stack gap-2">
            <p className="t-xs t-muted" data-window>{preview.window.trailing ? t(K.preview.windowTrailing, { from: formatDate(preview.window.from, lang), to: formatDate(preview.window.to, lang) }) : t(K.preview.windowLive, { from: formatDate(preview.window.from, lang), to: formatDate(preview.window.to, lang) })}</p>
            <p className="t-sm" data-participants>{preview.participants === 0 ? t(K.preview.empty) : t(K.preview.participants, { count: preview.participants })}</p>
            {preview.rows.map((r) => <div key={r.rank} className="row between t-sm" data-preview-row={r.rank}><span>{r.rank}. {r.name}</span><span className="num">{valueText(t, input.metric, r.value)}</span></div>)}
            {preview.checks.length === 0 ? <p className="t-xs t-muted" data-no-checks>{t(K.preview.nothing)}</p> : preview.checks.map((c) => <p key={c} className="t-xs" data-check={c} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>{t(`contestSetup.preview.check.${c}`)}</p>)}
          </div>
        </Card>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ One contest */

function Detail({ s, t }: { s: ContestSetupState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;
  const v: ContestAdminDetail | null = s.detail;
  const [mode, setMode] = useState<'view' | 'end' | 'cancel'>('view');
  const [reason, setReason] = useState('');
  const [rewards, setRewards] = useState<'pay' | 'none'>('pay');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forId, setForId] = useState<string | null>(null);
  if ((v?.row.id ?? null) !== forId) { setForId(v?.row.id ?? null); setMode('view'); setReason(''); setRewards('pay'); setError(null); }
  const close = () => s.openContest(null);
  const r = v?.row;
  const over = r ? r.phase === 'closed' || r.phase === 'ended_early' : false;
  const end = async () => {
    if (!r) return;
    setBusy(true); setError(null);
    const res = await s.endEarly(r.id, { reason, rewards });
    setBusy(false);
    if (!res.ok) { setError(problemText(t, res.problem)); return; }
    toast.push(t(K.end.done)); setMode('view');
  };
  const cancel = async () => {
    if (!r) return;
    setBusy(true); setError(null);
    const res = await s.cancelScheduled(r.id);
    setBusy(false);
    if (!res.ok) { setError(problemText(t, res.problem)); return; }
    toast.push(t(K.cancel.done)); close();
  };
  return (
    <Sheet open={!!v} onClose={close} title={t(K.detail.title)} closeLabel={t(K.close)}>
      {v && r && (
        <div className="stack gap-3" data-detail={r.id} data-phase={r.phase}>
          <div className="stack gap-1">
            <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{r.name}</strong>
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone={PHASE_TONE[r.phase]}>{phaseName(t, r.phase)}</Badge><span className="t-xs t-muted">{r.code} · {cohortName(t, r.cohort)}</span></span>
            {r.description && <p className="t-sm">{r.description}</p>}
            {r.endedReason && <p className="t-sm" data-ended-reason>{r.endedReason}</p>}
          </div>

          <section className="stack gap-1" data-rules>
            <h3 className="t-sm t-semibold">{t(K.detail.rules)}</h3>
            <p className="t-sm">{t(K.detail.counted, { metric: metricName(t, r.metric) })}</p>
            <p className="t-sm">{t(K.card.window, { from: formatDate(r.startsAt, lang), to: formatDate(r.endedAt ?? r.endsAt, lang), days: durationDays(r.startsAt, r.endedAt ?? r.endsAt) })}</p>
            <p className="t-sm">{t(K.detail.eligible, { cohort: cohortName(t, r.cohort) })}</p>
            {r.minTenureDays > 0 && <p className="t-sm">{t(K.detail.minTenure, { days: r.minTenureDays })}</p>}
            <p className="t-xs t-muted">{r.allowLateJoiners ? t(K.detail.lateYes) : t(K.detail.lateNo)}</p>
            <p className="t-sm" data-prizes>{t(K.card.prizes, { list: rewardsLine(t, r.rewards) })}</p>
            {r.locked && !over && <p className="t-xs t-muted" data-locked>{t(K.editor.rulesLocked)}</p>}
          </section>

          <section className="stack gap-1" data-standings>
            <h3 className="t-sm t-semibold">{t(K.detail.standings)}</h3>
            {v.standings.length === 0 ? <p className="t-xs t-muted">{t(K.detail.noStandings)}</p> : (
              <>
                {v.standings.slice(0, 10).map((x) => <div key={x.rank} className="row between t-sm" data-standing={x.rank}><span>{x.rank}. {x.name}</span><span className="num">{valueText(t, r.metric, x.value)}</span></div>)}
                <p className="t-xs t-muted">{t(K.detail.standingsNote)}</p>
              </>
            )}
            <div><Button size="sm" variant="ghost" data-partner-view onClick={() => s.goTo(`/rewards-leaderboard?contest=${r.id}`)}>{t(K.detail.partnerView)}</Button></div>
          </section>

          {v.outcome && (
            <section className="stack gap-1" data-outcome>
              <h3 className="t-sm t-semibold">{t(K.detail.outcome.heading)}</h3>
              <p className="t-sm">{t(K.detail.outcome.during, { value: valueText(t, r.metric, v.outcome.during) })}</p>
              <p className="t-sm">{t(K.detail.outcome.before, { value: valueText(t, r.metric, v.outcome.before) })}</p>
              {v.outcome.quality && <p className="t-sm" data-quality>{t(K.detail.outcome.quality, { captured: v.outcome.quality.during.captured, won: v.outcome.quality.during.won, lost: v.outcome.quality.during.lost, bCaptured: v.outcome.quality.before.captured, bWon: v.outcome.quality.before.won, bLost: v.outcome.quality.before.lost })}</p>}
              {v.outcome.small && <p className="t-xs" data-small>{t(K.detail.outcome.small)}</p>}
              <p className="t-xs t-muted">{t(K.detail.outcome.note)}</p>
            </section>
          )}

          {over && (
            <section className="stack gap-1" data-prizes-section>
              <h3 className="t-sm t-semibold">{t(K.detail.prizes.heading)}</h3>
              {v.prizes.map((p) => (
                <div key={p.entryId} className="row between t-sm" style={{ gap: 'var(--space-3)', alignItems: 'center' }} data-prize={p.entryId}>
                  <span className="stack"><span>#{p.rank} {p.name} · {formatINR(p.amount)}</span><span className="t-xs t-muted">{p.ledger === 'paid' ? t(K.detail.prize.state.paid) : p.approval ? t(`contestSetup.detail.prize.state.${p.approval}`) : t(`contestSetup.detail.prize.state.${p.ledger}`)}</span></span>
                  <span className="row gap-1"><Button size="sm" variant="ghost" data-open-queue onClick={() => s.goTo('/payout-approval')}>{t(K.detail.prize.openQueue)}</Button><Button size="sm" variant="ghost" onClick={() => s.goTo(`/payout-tracker?entry=${p.entryId}&days=all`)}>{t(K.detail.prize.openTracker)}</Button></span>
                </div>
              ))}
              {v.recognitions.length > 0 && <div className="stack gap-1" data-recognitions><span className="t-xs t-semibold">{t(K.detail.recognitions)}</span>{v.recognitions.map((x) => <span key={x.rank} className="t-sm">#{x.rank} {x.name} · {x.label}</span>)}</div>}
              {r.rewardPolicy === 'none' && <p className="t-xs t-muted">{t(K.card.notPaid)}</p>}
              {r.legacy && <p className="t-xs t-muted">{t(K.card.legacy)}</p>}
            </section>
          )}

          <section className="stack gap-1" data-events>
            <h3 className="t-sm t-semibold">{t(K.detail.events)}</h3>
            {v.events.length === 0 ? <p className="t-xs t-muted">—</p> : v.events.map((e, i) => <p key={`${e.at}:${i}`} className="t-xs" data-event={e.kind}><span className="t-muted">{formatDate(e.at, lang)}</span> · {t(`contestSetup.event.${e.kind}`, { defaultValue: e.kind })} · {e.byName}</p>)}
          </section>

          {mode === 'end' && (
            <div className="stack gap-2" data-end-form>
              <h3 className="t-sm t-semibold">{t(K.end.heading)}</h3>
              <p className="t-sm">{t(K.end.body)}</p>
              <Field label={t(K.end.reason)} hint={t(K.end.reasonHint, { min: END_REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="end-reason" />}</Field>
              <div className="stack gap-1"><span className="t-xs t-semibold">{t(K.end.rewards)}</span>
                <div data-policy="pay"><Checkbox checked={rewards === 'pay'} onChange={() => setRewards('pay')} label={t(K.end.pay)} /></div>
                <div data-policy="none"><Checkbox checked={rewards === 'none'} onChange={() => setRewards('none')} label={t(K.end.none)} /></div>
              </div>
            </div>
          )}
          {mode === 'cancel' && <div className="stack gap-2" data-cancel-form><h3 className="t-sm t-semibold">{t(K.cancel.heading)}</h3><p className="t-sm">{t(K.cancel.body)}</p></div>}

          {error && <p className="t-sm" role="alert" data-error style={{ color: 'var(--color-error)' }}>{error}</p>}
          <Footer>
            {r.phase === 'active' && mode === 'view' && <Button size="sm" variant="secondary" data-end-open onClick={() => { setMode('end'); setError(null); }}>{t(K.end.heading)}</Button>}
            {r.phase === 'scheduled' && mode === 'view' && <><Button size="sm" variant="ghost" data-cancel-open onClick={() => { setMode('cancel'); setError(null); }}>{t(K.cancel.heading)}</Button><Button size="sm" data-edit-open onClick={() => s.openEditor(r.id)}>{t(K.card.edit)}</Button></>}
            {mode === 'end' && <><Button size="sm" variant="ghost" onClick={() => setMode('view')}>{t(K.back)}</Button><Button size="sm" data-end-confirm disabled={busy || lettersOf(reason) < END_REASON_MIN} onClick={() => void end()}>{t(K.end.confirm)}</Button></>}
            {mode === 'cancel' && <><Button size="sm" variant="ghost" onClick={() => setMode('view')}>{t(K.back)}</Button><Button size="sm" data-cancel-confirm disabled={busy} onClick={() => void cancel()}>{t(K.cancel.confirm)}</Button></>}
          </Footer>
        </div>
      )}
    </Sheet>
  );
}
