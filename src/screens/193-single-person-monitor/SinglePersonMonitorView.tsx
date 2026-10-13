import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowRight, ArrowUp, ArrowsClockwise, CheckCircle, Minus, ShieldWarning, UsersThree, WarningOctagon } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, formatINR, useToast } from '@/design-system';
import type { MonitorPanelView, MonitorSignalView } from '@/data/repository';
import { GROUPS, MAX_CONFIGURED, NOTE_MIN, PINNED_IDS, PRESETS, SIGNALS, isBetter, signalDef } from '@/features/monitor/signals';
import type { MonitorStatus } from '@/features/monitor/signals';
import { SINGLE_PERSON_MONITOR_KEYS as K } from './single-person-monitor.types';
import { useSinglePersonMonitor } from './useSinglePersonMonitor';
import type { MonitorState } from './useSinglePersonMonitor';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`monitor.error.${code}`, { defaultValue: t(K.error.generic) });
const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;
const timeOf = (iso: string, lang: string): string => new Date(iso).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
const RANK: Record<MonitorStatus, number> = { act: 0, watch: 1, ok: 2 };
const toneOf = (s: MonitorSignalView): 'success' | 'warning' | 'error' | 'neutral' => (s.critical ? 'error' : s.status === 'act' ? 'warning' : s.status === 'watch' ? 'neutral' : 'success');
const valueText = (s: MonitorSignalView): string => (s.value === null ? '—' : s.unit === 'inr' ? formatINR(s.value) : s.unit === 'pct' ? `${s.value}%` : String(s.value));

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-3">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}

/** Screen 193 — Single-Person Monitor Control Panel. A dashboard: the answer first (does anything need you?), then a grid of signal cards, most pressing first, each the same anatomy (label, number, since-your-last-check arrow, one sentence) and each opening the screen behind it. Then the one-tap record that you looked, and the things a number cannot show. */
export function SinglePersonMonitorScreen() {
  const { t, i18n } = useTranslation();
  const s = useSinglePersonMonitor();
  const v = s.view;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !v && !s.denied) return <Screen width="wide">{head}<LoadingState label={t(K.loading)} variant="cards" rows={4} /></Screen>;
  if (s.denied) return <Screen width="narrow">{head}<ErrorState title={t(K.error.title)} body={t(K.error.not_allowed)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="wide">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const backup = v.viewer === 'backup';
  const shown = v.signals.filter((x) => x.configured).sort((a, b) => Number(b.critical) - Number(a.critical) || RANK[a.status] - RANK[b.status] || v.panel.indexOf(a.id) - v.panel.indexOf(b.id));
  const outside = v.signals.filter((x) => v.outside.includes(x.id));
  return (
    <Screen width="wide" className={!backup && !v.checkedToday ? 'pb-action-bar' : undefined}>
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        {v.covering && <p className="t-sm" role="status" data-covering style={{ color: 'var(--color-warning)' }}>{t(K.absence.covering, { name: v.covering.adminName, date: formatDate(v.covering.until, i18n.language) })}</p>}
        <Hero v={v} t={t} lang={i18n.language} />
        <div className="kpi-grid" data-grid>{shown.map((sig, i) => <SignalCard key={sig.id} sig={sig} index={i} t={t} />)}</div>
        {outside.length > 0 && (
          <Section title={t(K.outside.title)} hint={t(K.outside.hint)}>
            <div className="kpi-grid" data-outside>{outside.map((sig, i) => <SignalCard key={sig.id} sig={sig} index={i} t={t} />)}</div>
          </Section>
        )}
        <Card>
          <div className="stack gap-1" data-judgement>
            <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center' }}><ShieldWarning size={16} aria-hidden="true" color="var(--color-accent-primary)" />{t(K.judgement.title)}</span>
            <span className="t-xs">{t(K.judgement.body)}</span>
          </div>
        </Card>
        {!backup && <Concerns v={v} s={s} t={t} lang={i18n.language} />}
        {!backup && <Recent v={v} t={t} lang={i18n.language} />}
        {!backup && (
          <div className="row gap-2 wrap">
            <ConfigButton v={v} s={s} t={t} />
            <AbsenceButton v={v} s={s} t={t} lang={i18n.language} />
          </div>
        )}
        <p className="t-xs t-muted">{t(K.note.team)}</p>
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
      {!backup && !v.checkedToday && <CheckBar v={v} s={s} t={t} />}
    </Screen>
  );
}

function Hero({ v, t, lang }: { v: MonitorPanelView; t: T; lang: string }) {
  const critical = v.anyCritical;
  return (
    <Card>
      <div className="stack gap-2" data-hero data-critical={critical} data-act={v.actCount}>
        <span className="t-lg t-semibold row gap-2" style={{ alignItems: 'center', fontFamily: 'var(--font-display)', color: critical ? 'var(--color-error)' : v.actCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
          {critical ? <WarningOctagon size={22} aria-hidden="true" /> : v.actCount > 0 ? <ShieldWarning size={22} aria-hidden="true" /> : <CheckCircle size={22} aria-hidden="true" />}
          {critical ? t(K.hero.critical) : v.actCount > 0 ? t(K.hero.act, { count: v.actCount }) : t(K.hero.allClear)}
        </span>
        {v.watchCount > 0 && <span className="t-sm t-muted">{t(K.hero.watch, { count: v.watchCount })}</span>}
        {v.viewer === 'admin' && (
          <>
            <span className="t-xs" data-checked-today={v.checkedToday}>{v.checkedToday ? t(K.hero.checkedToday, { time: timeOf(v.lastCheck?.at ?? new Date().toISOString(), lang) }) : t(K.hero.notChecked)}</span>
            <span className="t-xs t-muted">{v.lastCheck ? t(K.hero.last, { date: formatDate(v.lastCheck.at, lang), kind: t(`monitor.check.kind.${v.lastCheck.kind}`) }) : t(K.hero.never)}{v.streak > 0 ? ` · ${t(K.check.streak, { count: v.streak })}` : ''}</span>
            {v.team.length > 0 && <span className="t-xs t-muted" data-team>{t(K.check.team, { names: v.team.map((x) => x.adminName).join(', ') })}</span>}
          </>
        )}
      </div>
    </Card>
  );
}

function SignalCard({ sig, index, t }: { sig: MonitorSignalView; index: number; t: T }) {
  const nav = useNavigate();
  const def = signalDef(sig.id);
  const better = def ? isBetter(def, sig.direction) : null;
  const trend = sig.direction === null ? t(K.trend.first) : sig.direction === 'flat' ? t(K.trend.flat) : sig.direction === 'up' ? (sig.pct === null ? t(K.trend.upNoPct) : t(K.trend.up, { pct: sig.pct })) : sig.pct === null ? t(K.trend.downNoPct) : t(K.trend.down, { pct: sig.pct });
  const Arrow = sig.direction === 'up' ? ArrowUp : sig.direction === 'down' ? ArrowDown : Minus;
  return (
    <Card onClick={() => nav(sig.route)} riseIndex={index}>
      <div className="stack gap-1" data-signal={sig.id} data-status={sig.status} data-critical={sig.critical}>
        <div className="row between" style={{ alignItems: 'center', gap: 6 }}>
          <span className="t-xs t-muted">{t(`monitor.signal.${sig.id}.label`)}</span>
          <Badge tone={toneOf(sig)}>{t(`monitor.status.${sig.status}`)}</Badge>
        </div>
        <span className={sig.unit === 'inr' ? 'num' : undefined} data-value style={{ fontFamily: sig.unit === 'inr' ? 'var(--font-mono)' : 'var(--font-display)', fontSize: 'var(--text-xl)', lineHeight: 1.1 }}>{valueText(sig)}</span>
        <span className="t-xs">{t(`monitor.signal.${sig.id}.${sig.status}`, sig.params)}</span>
        {sig.direction !== null && (
          <span className="t-xs row gap-1" data-trend={sig.direction} style={{ alignItems: 'center', color: better === true ? 'var(--color-success)' : 'var(--color-text-secondary)' }}><Arrow size={12} aria-hidden="true" />{trend}</span>
        )}
        {sig.direction === null && <span className="t-xs t-muted">{trend}</span>}
        <span className="t-xs row gap-1" style={{ alignItems: 'center', color: 'var(--color-accent-primary)' }}>{t(K.card.open)} <ArrowRight size={12} aria-hidden="true" /></span>
      </div>
    </Card>
  );
}

function CheckBar({ v, s, t }: { v: MonitorPanelView; s: MonitorState; t: T }) {
  const toast = useToast();
  const [concerns, setConcerns] = useState(false);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const needs = v.actCount > 0;
  const fine = async () => { setProblem(null); const r = await s.check('all_fine', ''); if (r.ok) toast.push(t(K.check.doneFine)); else setProblem(r.problem); };
  const withConcerns = async () => { setProblem(null); const r = await s.check('with_concerns', note); if (r.ok) { setConcerns(false); setNote(''); toast.push(t(K.check.doneConcerns)); } else setProblem(r.problem); };
  return (
    <>
      <ActionBar>
        <div className="stack gap-1" style={{ width: '100%' }}>
          {needs && <span className="t-xs" data-need-you>{t(K.check.needYou, { count: v.actCount })}</span>}
          {problem && !concerns && <span className="t-xs t-error" role="alert" data-problem={problem}>{errText(t, problem)}</span>}
          <div className="row gap-2">
            {!needs && <Button className="grow" data-act="all-fine" loading={s.busy} icon={<CheckCircle size={18} />} onClick={() => void fine()}>{t(K.check.allFine)}</Button>}
            <Button className={needs ? 'grow' : undefined} variant={needs ? 'primary' : 'secondary'} data-act="with-concerns" onClick={() => { setProblem(null); setConcerns(true); }}>{t(K.check.withConcerns)}</Button>
          </div>
        </div>
      </ActionBar>
      <Sheet open={concerns} onClose={() => setConcerns(false)} title={t(K.check.withConcerns)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-concerns-sheet>
          <p className="t-xs">{t(K.check.hint)}</p>
          <Field label={t(K.check.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={3} value={note} data-f="check-note" onChange={(e) => setNote(e.target.value)} />}</Field>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <Button data-act="check-do" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={() => void withConcerns()}>{t(K.check.withConcerns)}</Button>
        </div>
      </Sheet>
    </>
  );
}

function Concerns({ v, s, t, lang }: { v: MonitorPanelView; s: MonitorState; t: T; lang: string }) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [days, setDays] = useState('7');
  const [problem, setProblem] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [why, setWhy] = useState('');
  const add = async () => { setProblem(null); const r = await s.addConcern(note, Number(days)); if (r.ok) { setNote(''); toast.push(t(K.concern.added)); } else setProblem(r.problem); };
  const close = async () => { if (!closing) return; setProblem(null); const r = await s.resolveConcern(closing, why); if (r.ok) { setClosing(null); setWhy(''); toast.push(t(K.concern.resolved)); } else setProblem(r.problem); };
  return (
    <Section title={t(K.concern.title)} hint={t(K.concern.hint)}>
      <Card>
        <div className="stack gap-3" data-concern-form>
          <Field label={t(K.concern.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="concern-note" onChange={(e) => setNote(e.target.value)} />}</Field>
          <Field label={t(K.concern.review)}>{(p) => <Input id={p.id} type="number" min={1} max={30} value={days} data-f="concern-days" onChange={(e) => setDays(e.target.value)} />}</Field>
          {problem && !closing && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <div><Button size="sm" data-act="concern-add" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={() => void add()}>{t(K.concern.add)}</Button></div>
        </div>
      </Card>
      <div className="stack gap-2" data-concerns>
        <span className="t-sm t-semibold">{t(K.concern.list)}</span>
        {v.concerns.length === 0 ? <span className="t-xs t-muted">{t(K.concern.none)}</span> : v.concerns.map((c) => (
          <Card key={c.id}>
            <div className="stack gap-1" data-concern={c.id}>
              <span className="t-sm">{c.note}</span>
              <span className="t-xs t-muted">{t(K.concern.due, { date: formatDate(c.reviewAt, lang) })}</span>
              {closing === c.id ? (
                <div className="stack gap-2">
                  <Field label={t(K.concern.resolveNote)} hint={`${lettersOf(why)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={why} data-f="concern-why" onChange={(e) => setWhy(e.target.value)} />}</Field>
                  {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
                  <Button size="sm" data-act="concern-resolve-do" disabled={lettersOf(why) < NOTE_MIN} loading={s.busy} onClick={() => void close()}>{t(K.concern.resolveDo)}</Button>
                </div>
              ) : <div><Button size="sm" variant="secondary" data-act={`concern-resolve-${c.id}`} onClick={() => { setProblem(null); setWhy(''); setClosing(c.id); }}>{t(K.concern.resolve)}</Button></div>}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function Recent({ v, t, lang }: { v: MonitorPanelView; t: T; lang: string }) {
  return (
    <Section title={t(K.check.history)}>
      {v.recent.length === 0 ? <p className="t-sm t-muted" data-no-checks>{t(K.check.empty)}</p> : (
        <div className="stack gap-2" data-recent>
          {v.recent.map((c) => (
            <Card key={c.id}>
              <div className="stack gap-1" data-check={c.id} data-kind={c.kind}>
                <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-xs t-semibold">{t(K.check.line, { code: c.code, date: formatDate(c.at, lang), kind: t(`monitor.check.kind.${c.kind}`) })}</span><Badge tone={c.kind === 'all_fine' ? 'success' : 'warning'}>{t(`monitor.check.kind.${c.kind}`)}</Badge></div>
                <span className="t-xs t-muted">{t(K.check.saw, { act: c.actIds.length, watch: Object.values(c.statuses).filter((x) => x === 'watch').length })}</span>
                {c.note && <span className="t-xs">{c.note}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

function ConfigButton({ v, s, t }: { v: MonitorPanelView; s: MonitorState; t: T }) {
  const toast = useToast();
  const cfg = v.config!;
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState<string[]>(cfg.signalIds);
  const [preset, setPreset] = useState<string | null>(cfg.preset);
  const [time, setTime] = useState(cfg.checkTime);
  const [days, setDays] = useState<number[]>(cfg.checkDays);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { if (open) { setIds(cfg.signalIds); setPreset(cfg.preset); setTime(cfg.checkTime); setDays(cfg.checkDays); setProblem(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const choosable = useMemo(() => SIGNALS.filter((x) => !x.pinned), []);
  const toggle = (id: string) => { setPreset(null); setIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])); };
  const save = async () => { setProblem(null); const r = await s.saveConfig({ signalIds: ids, preset, checkTime: time, checkDays: days }); if (r.ok) { setOpen(false); toast.push(t(K.config.saved)); } else setProblem(r.problem); };
  return (
    <>
      <Button size="sm" variant="secondary" data-act="config" onClick={() => setOpen(true)}>{t(K.config.title)}</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t(K.config.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-config-sheet>
          <p className="t-xs">{t(K.config.hint)}</p>
          <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.config.preset)}</span>
            <div className="row gap-2 wrap" role="group">
              {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((p) => <Chip key={p} pressed={preset === p} onClick={() => { setPreset(p); setIds([...PRESETS[p]]); }}>{t(`monitor.preset.${p}`)}</Chip>)}
              {preset === null && <Chip pressed onClick={() => undefined}>{t(K.preset.custom)}</Chip>}
            </div>
          </div>
          <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.config.pinned)}</span><span className="t-xs t-muted">{PINNED_IDS.map((id) => t(`monitor.signal.${id}.label`)).join(' · ')}</span></div>
          {GROUPS.map((g) => {
            const list = choosable.filter((x) => x.group === g);
            return list.length === 0 ? null : (
              <div key={g} className="stack gap-1"><span className="t-xs t-muted">{t(`monitor.group.${g}`)}</span>
                {list.map((x) => <div key={x.id} data-pick={x.id}><Checkbox checked={ids.includes(x.id)} onChange={() => toggle(x.id)} label={t(`monitor.signal.${x.id}.label`)} /></div>)}
              </div>
            );
          })}
          <p className="t-xs t-muted">{t(K.config.pick, { max: MAX_CONFIGURED })}</p>
          <div className="grid-2">
            <Field label={t(K.config.time)}>{(p) => <Input id={p.id} type="time" value={time} data-f="check-time" onChange={(e) => setTime(e.target.value)} />}</Field>
          </div>
          <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.config.days)}</span>
            <div className="row gap-1 wrap" role="group">{[1, 2, 3, 4, 5, 6, 0].map((d) => <Chip key={d} pressed={days.includes(d)} onClick={() => setDays((l) => (l.includes(d) ? l.filter((x) => x !== d) : [...l, d]))}>{t(`monitor.day.${d}`)}</Chip>)}</div>
          </div>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <Button data-act="config-save" loading={s.busy} onClick={() => void save()}>{t(K.config.save)}</Button>
        </div>
      </Sheet>
    </>
  );
}

function AbsenceButton({ v, s, t, lang }: { v: MonitorPanelView; s: MonitorState; t: T; lang: string }) {
  const toast = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [until, setUntil] = useState('');
  const [backup, setBackup] = useState('');
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { if (open) { setUntil(''); setBackup(''); setReason(''); setProblem(null); } }, [open]);
  const a = v.absence;
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const set = async () => { setProblem(null); const r = await s.setAbsence({ until: new Date(`${until}T23:59:59`).toISOString(), backupUserId: backup, reason }); if (r.ok) { setOpen(false); toast.push(t(K.absence.setDone)); } else setProblem(r.problem); };
  const end = async () => { setProblem(null); const r = await s.endAbsence(reason); if (r.ok) { setOpen(false); toast.push(t(K.absence.ended)); } else setProblem(r.problem); };
  return (
    <>
      <Button size="sm" variant="secondary" data-act="absence" icon={<UsersThree size={14} />} onClick={() => setOpen(true)}>{a ? t(K.absence.end) : t(K.absence.title)}</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t(K.absence.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-absence-sheet>
          {a ? (
            <>
              <p className="t-sm" data-absence-active>{t(K.absence.active, { date: formatDate(a.until, lang), name: a.backupName })}</p>
              <Field label={t(K.absence.endReason)} hint={`${lettersOf(reason)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="absence-end-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
              {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
              <Button data-act="absence-end" disabled={lettersOf(reason) < NOTE_MIN} loading={s.busy} onClick={() => void end()}>{t(K.absence.endDo)}</Button>
            </>
          ) : (
            <>
              <p className="t-xs">{t(K.absence.hint)}</p>
              <p className="t-xs t-muted">{t(K.absence.limit)}</p>
              <Field label={t(K.absence.until)}>{(p) => <Input id={p.id} type="date" min={tomorrow} value={until} data-f="absence-until" onChange={(e) => setUntil(e.target.value)} />}</Field>
              {v.candidates.length === 0 ? <p className="t-sm" data-no-candidates>{t(K.absence.noCandidates)} <Button size="sm" variant="ghost" onClick={() => nav('/escalation-matrix')}>{t(K.absence.matrixLink)}</Button></p> : (
                <Field label={t(K.absence.backup)}>{(p) => (
                  <Select id={p.id} value={backup} data-f="absence-backup" onChange={(e) => setBackup(e.target.value)}>
                    <option value="">{t(K.absence.pick)}</option>
                    {v.candidates.map((c) => <option key={c.userId} value={c.userId}>{c.name} · {t(`role.${c.role}`)} · {c.fromMatrix ? t(K.absence.matrix) : t(K.absence.other)}</option>)}
                  </Select>
                )}</Field>
              )}
              <Field label={t(K.absence.reason)} hint={`${lettersOf(reason)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="absence-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
              {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
              <Button data-act="absence-set" disabled={!until || !backup || lettersOf(reason) < NOTE_MIN} loading={s.busy} onClick={() => void set()}>{t(K.absence.set)}</Button>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
