import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowsClockwise, CheckCircle, EyeSlash, ShieldWarning, Star } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, LoadingState, ProgressBar, Screen, ScreenHeader, Select, Sheet, TextArea, Toggle, formatDate, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { FeedbackItemView, FeedbackModuleSummary, FeedbackStatusName, FeedbackSummaryView, TrainingFeedbackFormView, TrainingFeedbackModuleView, TrainingFeedbackOverview, TrainingFeedbackRow } from '@/data/repository';
import { COMMENT_MAX, FEEDBACK_KEYS as K, FILTERS, MIN_RESPONSES, NOTE_MIN, PULL_DISTANCE, RATINGS, REASON_MIN, REVIEW_DUE_DAYS, SAFETY_DUE_HOURS, SERIOUS_MIN, URGENT_DUE_HOURS, draftKey, lessonsPath, questionKey } from './training-feedback.types';
import { useTrainingFeedback } from './useTrainingFeedback';
import type { TrainingFeedbackState } from './useTrainingFeedback';

type T = ReturnType<typeof useTranslation>['t'];
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const moduleTitle = (t: T, code: string) => t(`trainingLib.content.${code.toLowerCase()}.title`, { defaultValue: code });
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const STATUS_TONE: Record<FeedbackStatusName, BadgeTone> = { new: 'accent', reviewing: 'accent', addressed: 'success', dismissed: 'neutral' };
const lessonOrderOf = (id: string) => Number(id.split('-').pop()) || 0;

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

/** Five buttons, each a big target: a rating you can give with a thumb. */
function Rating({ id, value, onChange, label, hint, t }: { id: string; value: number; onChange: (n: number) => void; label: string; hint: string; t: T }) {
  return (
    <div className="stack gap-2" data-rating={id} role="radiogroup" aria-label={label}>
      <div className="stack gap-1"><strong className="t-md">{label}</strong><span className="t-xs t-muted">{hint}</span></div>
      <div className="row gap-2">
        {RATINGS.map((n) => {
          const on = value === n;
          return (
            <button key={n} type="button" role="radio" aria-checked={on} aria-label={t(K.form.ratingOf, { n })} data-star={`${id}:${n}`} onClick={() => onChange(n)}
              style={{ flex: 1, minHeight: 48, borderRadius: 'var(--radius-md, 12px)', border: `1px solid ${on ? 'var(--color-accent-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-accent-primary)' : 'var(--color-surface)', color: on ? 'var(--color-surface)' : 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 600 }}>
              {n}
            </button>
          );
        })}
      </div>
      <div className="row between t-xs t-muted"><span>{t(K.form.low)}</span><span>{t(K.form.high)}</span></div>
    </div>
  );
}

const stars = (v: number | null) => (v === null ? '—' : v.toFixed(1));

function Averages({ s, t }: { s: FeedbackSummaryView; t: T }) {
  return (
    <div className="row gap-4 wrap" data-averages style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span className="stack" style={{ gap: 2 }}><span className="t-xs t-muted">{t(K.admin.clarity)}</span><span className="t-display" style={{ fontSize: 'var(--text-xl, 1.5rem)', lineHeight: 1.1 }}>{stars(s.clarity)}</span></span>
      <span className="stack" style={{ gap: 2 }}><span className="t-xs t-muted">{t(K.admin.relevance)}</span><span className="t-display" style={{ fontSize: 'var(--text-xl, 1.5rem)', lineHeight: 1.1 }}>{stars(s.relevance)}</span></span>
    </div>
  );
}

/**
 * Screen 160 — Training Feedback. The loop that keeps training content honest: a partner says how clear and relevant a training was and what confused them
 * (anonymously, if they would rather), a flag that something looks wrong or unsafe goes to Admin as an alert, and Admin reads what came in per training
 * with how many answered out of how many finished, says what was done, and can hide an abusive comment while its ratings still count.
 */
export function TrainingFeedbackScreen() {
  const { t } = useTranslation();
  const s = useTrainingFeedback();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const title = s.isAdmin ? K.adminTitle : K.title;
  if (s.status === 'loading' && !(s.overview || s.list)) return <Screen width="wide"><ScreenHeader title={t(title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.status === 'error' || !(s.overview || s.list)) return <Screen width="wide"><ScreenHeader title={t(title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={s.moduleId ? t(K.back) : t('action.retry')} onRetry={s.moduleId ? s.toList : s.reload} /></Screen>;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-training-feedback={s.isAdmin ? 'admin' : 'partner'}>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      {s.isAdmin ? (s.moduleId ? <AdminModule s={s} t={t} /> : <AdminOverview s={s} t={t} />) : s.moduleId ? <PartnerForm s={s} t={t} /> : <PartnerList s={s} t={t} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Partner: which trainings */

function PartnerList({ s, t }: { s: TrainingFeedbackState; t: T }) {
  const { i18n } = useTranslation();
  const rows = s.list?.rows ?? [];
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
      {rows.length === 0 ? <EmptyState icon={<Star size={28} />} title={t(K.list.empty)} body={t(K.list.emptyBody)} /> : (
        <div className="stack gap-3" data-list>
          {rows.map((r: TrainingFeedbackRow) => (
            <Card key={r.moduleId} onClick={() => s.openModule(r.moduleId)}>
              <div className="stack gap-2" data-row={r.code} data-given={r.given ? '1' : '0'}>
                <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <span className="stack" style={{ minWidth: 0 }}><strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{moduleTitle(t, r.code)}</strong><span className="t-xs t-muted">{t(K.list.version, { version: r.version })} · {t(K.list.progress[r.progress])}</span></span>
                  {r.given ? <Badge tone="success">{t(K.list.given)}</Badge> : <Badge tone="accent">{t(K.list.give)}</Badge>}
                </div>
                <div className="row gap-2 wrap">
                  {r.safetyCritical && <Badge tone="neutral">{t(K.list.safety)}</Badge>}
                  {r.given && r.newer && <Badge tone="accent">{t(K.list.newer, { version: r.version })}</Badge>}
                  {r.given && <span className="t-xs t-muted">{formatDate(r.given.at, i18n.language)}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ Partner: the form */

interface Draft { clarity: number; relevance: number; comment: string; anonymous: boolean; serious: boolean; where: string }
const blank = (): Draft => ({ clarity: 0, relevance: 0, comment: '', anonymous: true, serious: false, where: '' });

function PartnerForm({ s, t }: { s: TrainingFeedbackState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const f = s.form as TrainingFeedbackFormView | null;
  const [d, setD] = useState<Draft>(blank);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const formKey = f ? `${f.moduleId}:${f.version}:${f.mine?.id ?? ''}:${f.target?.lessonId ?? ''}:${f.target?.questionId ?? ''}` : '';
  useEffect(() => {
    if (!f) return;
    setError(null);
    const targetWhere = f.target?.questionId ? `q:${f.target.questionId}` : f.target?.lessonId ? `l:${f.target.lessonId}` : '';
    if (f.mine) { setD({ clarity: f.mine.clarity, relevance: f.mine.relevance, comment: f.mine.comment, anonymous: f.mine.anonymous, serious: f.mine.serious, where: f.mine.target?.questionId ? `q:${f.mine.target.questionId}` : f.mine.target?.lessonId ? `l:${f.mine.target.lessonId}` : targetWhere }); return; }
    try { const raw = window.localStorage.getItem(draftKey(s.userId, f.moduleId)); if (raw) { setD({ ...blank(), ...(JSON.parse(raw) as Partial<Draft>), ...(targetWhere ? { where: targetWhere } : {}) }); return; } } catch { /* the draft is a convenience */ }
    setD({ ...blank(), where: targetWhere });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);
  const subjectKey = f ? `${f.moduleId}:${f.target?.lessonId ?? ''}:${f.target?.questionId ?? ''}` : '';
  useEffect(() => { setDone(false); }, [subjectKey]);
  if (!f) return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="block" /></Screen>;
  const set = (patch: Partial<Draft>) => setD((x) => { const next = { ...x, ...patch }; if (!f.mine) { try { window.localStorage.setItem(draftKey(s.userId, f.moduleId), JSON.stringify(next)); } catch { /* ignore */ } } return next; });
  const wordsOk = !d.serious || letters(d.comment) >= SERIOUS_MIN;
  const ready = d.clarity > 0 && d.relevance > 0 && wordsOk && d.comment.length <= COMMENT_MAX;
  const targetOf = () => (d.where.startsWith('q:') ? { questionId: d.where.slice(2) } : d.where.startsWith('l:') ? { lessonId: d.where.slice(2) } : null);
  const send = async () => {
    const r = await s.save({ clarity: d.clarity, relevance: d.relevance, comment: d.comment, anonymous: d.anonymous, serious: d.serious, target: d.serious || d.where ? targetOf() : null });
    if (!r.ok) { setError(r.code ?? 'generic'); return; }
    setError(null);
    try { window.localStorage.removeItem(draftKey(s.userId, f.moduleId)); } catch { /* ignore */ }
    toast.push(t(K.form.saved));
    setDone(true);
  };
  const m = f.mine;
  const aboutQuestion = d.where.startsWith('q:') ? d.where.slice(2) : null;
  const aboutLesson = d.where.startsWith('l:') ? lessonOrderOf(d.where.slice(2)) : null;
  return (
    <Screen width="narrow">
      <div className="stack gap-4" data-form-view={f.code}>
        <div><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />} data-back onClick={s.toList}>{t(K.back)}</Button></div>
        <div className="stack gap-1"><h1 className="t-xl" style={{ overflowWrap: 'anywhere' }}>{moduleTitle(t, f.code)}</h1><p className="t-sm t-muted">{t(K.list.version, { version: f.version })}{f.safetyCritical ? ` · ${t(K.list.safety)}` : ''}</p></div>
        {done ? (
          <Card><div className="stack gap-2" data-thanks><strong className="t-md"><CheckCircle size={18} aria-hidden="true" style={{ verticalAlign: 'text-bottom', color: 'var(--color-success)' }} /> {t(K.form.thanks)}</strong><p className="t-sm">{d.serious ? t(K.form.thanksSerious) : t(K.form.thanksBody)}</p><div className="row gap-2"><Button variant="secondary" onClick={() => setDone(false)}>{t(K.form.editAgain)}</Button><Button variant="ghost" onClick={s.toList}>{t(K.back)}</Button></div></div></Card>
        ) : (
          <>
            {m && <p className="t-xs t-muted" data-already>{t(K.form.already, { date: formatDate(m.updatedAt, i18n.language) })}</p>}
            {m && (m.status === 'addressed' || m.status === 'dismissed') && m.handledNote && <Card><div className="stack gap-1" data-handled><strong className="t-sm">{t(K.form.handled)}</strong><p className="t-sm">{m.handledNote}</p>{m.addressedInVersion && <p className="t-xs t-muted">{t(K.form.handledIn, { version: m.addressedInVersion })}</p>}</div></Card>}
            <p className="t-sm t-muted">{t(K.form.intro)}</p>
            {(aboutQuestion || aboutLesson) && <Card><div className="stack gap-1" data-target>{aboutQuestion ? <><strong className="t-sm">{t(K.form.aboutQuestion)}</strong><p className="t-sm">{t(questionKey(f.code, aboutQuestion), { defaultValue: aboutQuestion })}</p></> : <><strong className="t-sm">{t(K.form.aboutLesson, { n: aboutLesson })}</strong><p className="t-sm">{t(`lessonContent.${f.code.toLowerCase()}.l${aboutLesson}.title`, { defaultValue: '' })}</p></>}</div></Card>}
            <Rating id="clarity" value={d.clarity} onChange={(n) => set({ clarity: n })} label={t(K.form.clarity)} hint={t(K.form.clarityHint)} t={t} />
            <Rating id="relevance" value={d.relevance} onChange={(n) => set({ relevance: n })} label={t(K.form.relevance)} hint={t(K.form.relevanceHint)} t={t} />
            <Field label={t(K.form.comment)} hint={t(K.form.commentHint, { max: COMMENT_MAX })}>{(p) => <TextArea id={p.id} rows={4} value={d.comment} maxLength={COMMENT_MAX} placeholder={t(K.form.commentPlaceholder)} onChange={(e) => set({ comment: e.target.value })} data-f="comment" />}</Field>
            <div data-anonymous><Toggle checked={d.anonymous} onChange={(v) => set({ anonymous: v })} label={t(K.form.anonymous)} description={d.anonymous ? t(K.form.anonymousOn) : t(K.form.anonymousOff)} /></div>
            <div className="stack gap-2" data-serious>
              <Toggle checked={d.serious} onChange={(v) => set({ serious: v })} label={t(K.form.serious)} description={t(K.form.seriousHint)} />
              {d.serious && (
                <>
                  <Field label={t(K.form.where)}>{(p) => (
                    <Select id={p.id} value={d.where} onChange={(e) => set({ where: e.target.value })} data-f="where">
                      <option value="">{t(K.form.whereAll)}</option>
                      {f.lessons.map((l) => <option key={l.id} value={`l:${l.id}`}>{t(K.form.whereLesson, { n: l.order })}</option>)}
                      {aboutQuestion && <option value={`q:${aboutQuestion}`}>{t(K.form.whereQuestion)}</option>}
                    </Select>
                  )}</Field>
                  {!wordsOk && <p className="t-xs" style={{ color: 'var(--color-warning)' }} data-needs-words>{t(K.form.seriousNeeds, { min: SERIOUS_MIN })}</p>}
                </>
              )}
            </div>
            {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
            <div className="stack gap-1"><Button data-send disabled={!ready || s.busy} onClick={() => void send()}>{m ? t(K.form.update) : t(K.form.send)}</Button><p className="t-xs t-muted" aria-live="polite">{ready ? t(K.form.ready) : t(K.form.notReady)}{!m ? ` ${t(K.form.draftKept)}` : ''}</p></div>
          </>
        )}
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Admin: across trainings */

function ModuleCard({ m, t, onOpen }: { m: FeedbackModuleSummary; t: T; onOpen: () => void }) {
  const x = m.summary;
  return (
    <Card onClick={onOpen}>
      <div className="stack gap-2" data-module={m.code} data-enough={x.enough ? '1' : '0'}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span className="stack" style={{ minWidth: 0 }}><strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{moduleTitle(t, m.code)}</strong><span className="t-xs t-muted">{t(K.list.version, { version: m.version })}</span></span>
          <span className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>
            {m.urgentOpen > 0 && <Badge tone="error">{t(K.admin.urgentN, { count: m.urgentOpen })}</Badge>}
            {x.low && <Badge tone="warning">{t(K.admin.low)}</Badge>}
            {m.safetyCritical && <Badge tone="neutral">{t(K.list.safety)}</Badge>}
          </span>
        </div>
        {x.n === 0 ? <p className="t-sm t-muted">{t(K.admin.noReplies, { completed: x.completed })}</p> : (
          <>
            <Averages s={x} t={t} />
            <div className="stack gap-1">
              <ProgressBar value={x.rate === null ? 0 : x.rate / 100} label={`${x.n}/${x.completed}`} />
              <span className="t-xs t-muted">{t(K.admin.replies, { count: x.n, completed: x.completed })}{x.rate !== null ? ` · ${t(K.admin.rate, { rate: x.rate })}` : ''}</span>
              {!x.enough && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.admin.fewReplies, { min: MIN_RESPONSES })}</span>}
            </div>
          </>
        )}
        {m.open > 0 && <span className="t-xs t-muted">{t(K.admin.openN, { count: m.open })}</span>}
      </div>
    </Card>
  );
}

function ItemLine({ it, t, lang }: { it: FeedbackItemView; t: T; lang: string }) {
  const lesson = it.target?.lessonId ? lessonOrderOf(it.target.lessonId) : null;
  return (
    <div className="stack gap-1" data-where={it.target ? 'target' : 'whole'}>
      <span className="t-xs t-muted">{t(K.item.where)}: {it.target?.questionId ? `${t(K.item.question)} — ${t(questionKey(it.code, it.target.questionId), { defaultValue: it.target.questionId })}` : lesson ? `${t(K.item.lesson, { n: lesson })} — ${t(`lessonContent.${it.code.toLowerCase()}.l${lesson}.title`, { defaultValue: '' })}` : t(K.item.whole)} · {formatDate(it.createdAt, lang)}</span>
    </div>
  );
}

function AdminOverview({ s, t }: { s: TrainingFeedbackState; t: T }) {
  const { i18n } = useTranslation();
  const o = s.overview as TrainingFeedbackOverview;
  const k = o.kpis;
  const card = (id: string, label: string, value: number, caption: string, tone?: 'error' | 'warn') => (
    <Card><div className="stack gap-1" data-kpi={id}><span className="t-xs t-muted">{label}</span><span className="t-display" style={{ fontSize: 'var(--text-2xl, 1.75rem)', lineHeight: 1.1, color: tone === 'error' ? 'var(--color-error)' : tone === 'warn' ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>{value}</span><span className="t-xs t-muted">{caption}</span></div></Card>
  );
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.adminTitle)} subtitle={t(K.adminSubtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
      <div className="stack gap-4">
        <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties} data-kpis>
          {card('responses', t(K.kpi.responses), k.responses, t(K.kpi.responsesCaption))}
          {card('urgent', t(K.kpi.urgent), k.urgentOpen, k.urgentOpen > 0 ? t(K.kpi.urgentCaption) : t(K.kpi.urgentNone), k.urgentOpen > 0 ? 'error' : undefined)}
          {card('unreviewed', t(K.kpi.unreviewed), k.unreviewed, t(K.kpi.unreviewedCaption, { days: REVIEW_DUE_DAYS }), k.unreviewed > 0 ? 'warn' : undefined)}
          {card('hidden', t(K.kpi.hidden), k.hidden, t(K.kpi.hiddenCaption))}
        </div>
        {o.urgent.length > 0 && (
          <section className="stack gap-2" data-urgent-list>
            <h2 className="t-lg">{t(K.admin.urgentHeading)}</h2>
            <p className="t-sm t-muted">{t(K.admin.urgentBody, { hours: URGENT_DUE_HOURS, safety: SAFETY_DUE_HOURS })}</p>
            {o.urgent.map((it) => (
              <Card key={it.id} onClick={() => s.goto(`/training-feedback/${it.moduleId}?item=${it.id}`)}>
                <div className="stack gap-1" data-urgent={it.id} style={{ borderLeft: '3px solid var(--color-error)', paddingLeft: 'var(--space-3)' }}>
                  <strong className="t-md">{moduleTitle(t, it.code)}</strong>
                  <p className="t-sm">{it.comment}</p>
                  <ItemLine it={it} t={t} lang={i18n.language} />
                </div>
              </Card>
            ))}
          </section>
        )}
        <section className="stack gap-2">
          <h2 className="t-lg">{t(K.admin.modules)}</h2>
          {o.modules.length === 0 ? <EmptyState icon={<Star size={28} />} title={t(K.admin.empty)} body={t(K.admin.emptyBody)} /> : <div className="grid-auto" style={{ '--min': '300px' } as React.CSSProperties} data-modules>{o.modules.map((m) => <ModuleCard key={m.moduleId} m={m} t={t} onOpen={() => s.openModule(m.moduleId)} />)}</div>}
        </section>
        <p className="t-xs t-muted" data-placeholder>{t(K.admin.placeholder, { min: MIN_RESPONSES, days: REVIEW_DUE_DAYS, hours: URGENT_DUE_HOURS, safety: SAFETY_DUE_HOURS })}</p>
        <p className="t-xs t-muted">{t(K.admin.anonymousNote)}</p>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Admin: one training */

function AdminModule({ s, t }: { s: TrainingFeedbackState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const v = s.moduleView as TrainingFeedbackModuleView | null;
  const [handling, setHandling] = useState<FeedbackItemView | null>(null);
  const [hiding, setHiding] = useState<FeedbackItemView | null>(null);
  const items = v?.items ?? [];
  useEffect(() => { if (s.item && v) { const it = v.items.find((x) => x.id === s.item); if (it) setHandling(it); } }, [s.item, v?.module.moduleId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v) return <Screen width="wide"><ScreenHeader title={t(K.adminTitle)} /><LoadingState label={t(K.loading)} variant="block" /></Screen>;
  const m = v.module;
  const open = (x: FeedbackItemView) => (x.status === 'new' || x.status === 'reviewing') && !x.hidden;
  const shown = items.filter((x) => (s.filter === 'open' ? open(x) : s.filter === 'serious' ? x.serious : s.filter === 'hidden' ? !!x.hidden : true));
  const count = (f: string) => items.filter((x) => (f === 'open' ? open(x) : f === 'serious' ? x.serious : f === 'hidden' ? !!x.hidden : true)).length;
  const sum = m.summary;
  return (
    <Screen width="default">
      <div className="stack gap-4" data-module-view={m.code}>
        <div><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />} data-back onClick={s.toList}>{t(K.back)}</Button></div>
        <div className="stack gap-1"><h1 className="t-xl" style={{ overflowWrap: 'anywhere' }}>{moduleTitle(t, m.code)}</h1><div className="row gap-2 wrap"><Badge tone="neutral">{t(K.list.version, { version: m.version })}</Badge>{m.safetyCritical && <Badge tone="neutral">{t(K.list.safety)}</Badge>}{sum.low && <Badge tone="warning">{t(K.admin.low)}</Badge>}</div></div>
        <Card>
          <div className="stack gap-2" data-summary>
            {sum.n === 0 ? <p className="t-sm t-muted">{t(K.admin.noReplies, { completed: sum.completed })}</p> : (
              <>
                <Averages s={sum} t={t} />
                <span className="t-xs t-muted">{t(K.admin.replies, { count: sum.n, completed: sum.completed })}{sum.rate !== null ? ` · ${t(K.admin.rate, { rate: sum.rate })}` : ''}</span>
                {!sum.enough && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.admin.fewReplies, { min: MIN_RESPONSES })}</span>}
                {sum.perVersion.length > 1 && (
                  <div className="stack gap-1" data-by-version><strong className="t-sm">{t(K.admin.byVersion)}</strong>
                    {sum.perVersion.map((p) => <span key={p.version} className="t-sm" data-version={p.version}>{t(K.admin.versionRow, { version: p.version, n: p.n, clarity: stars(p.clarity), relevance: stars(p.relevance) })}{!p.enough ? ` · ${t(K.admin.versionFew)}` : ''}</span>)}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
        <div className="row gap-2" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.adminTitle)}>
          {FILTERS.map((f) => <span key={f} data-filter={f} style={{ flex: '0 0 auto' }}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(K.filter[f])} · {count(f)}</Chip></span>)}
        </div>
        <div className="stack gap-3" data-items>
          {shown.length === 0 ? <p className="t-sm t-muted" data-none>{t(K.admin.emptyBody)}</p> : shown.map((it) => (
            <Card key={it.id}>
              <div className="stack gap-2" data-item={it.id} data-status={it.status} data-serious={it.serious ? '1' : '0'} style={it.serious && open(it) ? { borderLeft: '3px solid var(--color-error)', paddingLeft: 'var(--space-3)' } : undefined}>
                <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <span className="stack" style={{ minWidth: 0 }}><strong className="t-sm">{it.authorName ?? t(K.item.anonymous)}</strong><span className="t-xs t-muted">{t(K.item.version, { version: it.version })} · {t(K.item.ratings, { clarity: it.clarity, relevance: it.relevance })}</span></span>
                  <span className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>{it.serious && <Badge tone="error">{t(K.item.serious)}</Badge>}<Badge tone={STATUS_TONE[it.status]}>{t(K.status[it.status])}</Badge></span>
                </div>
                {it.hidden ? (
                  <p className="t-sm t-muted" data-hidden><EyeSlash size={14} aria-hidden="true" style={{ verticalAlign: 'text-bottom' }} /> {t(K.item.hidden)} · {t(K.item.hiddenBy, { name: it.hidden.byName, reason: it.hidden.reason })}</p>
                ) : it.comment ? <p className="t-sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{it.comment}</p> : <p className="t-xs t-muted">{t(K.item.noComment)}</p>}
                <ItemLine it={it} t={t} lang={lang} />
                {it.handledNote && <p className="t-xs t-muted">{t(K.item.handledBy, { name: it.handledByName ?? '' })}: {it.handledNote}{it.addressedInVersion ? ` · ${t(K.item.addressedIn, { version: it.addressedInVersion })}` : ''}</p>}
                {it.serious && open(it) && <p className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.item.due, { date: formatDate(it.dueAt, lang) })}</p>}
                <div className="row gap-2 wrap">
                  {!it.hidden && <Button size="sm" data-handle={it.id} onClick={() => setHandling(it)}>{t(K.item.handle)}</Button>}
                  {it.hidden ? <Button size="sm" variant="secondary" data-restore={it.id} disabled={s.busy} onClick={() => void s.moderate(it.id, { hide: false, reason: '' })}>{t(K.item.restore)}</Button> : it.comment && <Button size="sm" variant="ghost" data-hide={it.id} onClick={() => setHiding(it)}>{t(K.item.hide)}</Button>}
                  {it.serious && it.target?.lessonId && <Button size="sm" variant="ghost" onClick={() => s.goto(lessonsPath(it.moduleId))}>{t(K.item.openLessons)}</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <HandleSheet item={handling ? items.find((x) => x.id === handling.id) ?? handling : null} versions={v.versions} s={s} t={t} onClose={() => { setHandling(null); s.openItem(null); }} />
      <HideSheet item={hiding} s={s} t={t} onClose={() => setHiding(null)} />
    </Screen>
  );
}

function HandleSheet({ item, versions, s, t, onClose }: { item: FeedbackItemView | null; versions: number[]; s: TrainingFeedbackState; t: T; onClose: () => void }) {
  const [status, setStatus] = useState<FeedbackStatusName>('reviewing');
  const [note, setNote] = useState('');
  const [version, setVersion] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setError(null); setStatus(item && item.status !== 'new' ? item.status : 'reviewing'); setNote(item?.handledNote ?? ''); setVersion(item?.addressedInVersion ? String(item.addressedInVersion) : ''); }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const needsNote = status === 'addressed' || status === 'dismissed';
  return (
    <Sheet open={!!item} onClose={onClose} title={t(K.handle.title)} closeLabel={t(K.close)}>
      {item && (
        <div className="stack gap-3" data-form="handle">
          {item.comment && <p className="t-sm" style={{ whiteSpace: 'pre-wrap' }}>{item.comment}</p>}
          <Field label={t(K.handle.status)}>{(p) => (
            <Select id={p.id} value={status} onChange={(e) => setStatus(e.target.value as FeedbackStatusName)} data-f="status">
              {(['reviewing', 'addressed', 'dismissed'] as const).map((x) => <option key={x} value={x}>{t(K.status[x])}</option>)}
            </Select>
          )}</Field>
          <Field label={t(K.handle.note)} hint={needsNote ? t(K.handle.noteHint, { min: NOTE_MIN }) : undefined}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
          {status === 'addressed' && (
            <Field label={t(K.handle.version)}>{(p) => (
              <Select id={p.id} value={version} onChange={(e) => setVersion(e.target.value)} data-f="version">
                <option value="">{t(K.handle.versionNone)}</option>
                {versions.map((x) => <option key={x} value={x}>{t(K.list.version, { version: x })}</option>)}
              </Select>
            )}</Field>
          )}
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
          <Footer>
            <Button variant="ghost" onClick={onClose}>{t(K.handle.cancel)}</Button>
            <Button data-confirm-handle disabled={s.busy || (needsNote && letters(note) < NOTE_MIN)} onClick={async () => { const r = await s.handle(item.id, { status, note, ...(status === 'addressed' && version ? { addressedInVersion: Number(version) } : {}) }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.handle.save)}</Button>
          </Footer>
        </div>
      )}
    </Sheet>
  );
}

function HideSheet({ item, s, t, onClose }: { item: FeedbackItemView | null; s: TrainingFeedbackState; t: T; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setReason(''); setError(null); }, [item?.id]);
  return (
    <Sheet open={!!item} onClose={onClose} title={t(K.handle.hideTitle)} closeLabel={t(K.close)}>
      {item && (
        <div className="stack gap-3" data-form="hide">
          <p className="t-sm">{t(K.handle.hideBody)}</p>
          <Field label={t(K.handle.hideReason)} hint={t(K.handle.hideReasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
          <Footer>
            <Button variant="ghost" onClick={onClose}>{t(K.handle.cancel)}</Button>
            <Button data-confirm-hide disabled={s.busy || letters(reason) < REASON_MIN} onClick={async () => { const r = await s.moderate(item.id, { hide: true, reason }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.handle.hideConfirm)}</Button>
          </Footer>
        </div>
      )}
    </Sheet>
  );
}
