import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CheckCircle, Phone } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, LoadingState, Screen, ScreenHeader, TextArea, formatDate } from '@/design-system';
import type { FeedbackAdminRow, FeedbackRequestView, FeedbackRowView } from '@/data/repository';
import type { FeedbackDimension } from '@/data/types';
import { MAX_COMMENT, MIN_SAMPLE, OUTREACH_NOTE_MIN } from '@/features/feedback/feedback';
import { FEEDBACK_KEYS as K, RATINGS } from './feedback-rating.types';
import { useFeedback } from './useFeedback';
import type { FeedbackState } from './useFeedback';

type T = ReturnType<typeof useTranslation>['t'];
type Head = (sub: string, extra?: ReactNode) => ReactNode;
interface P { s: FeedbackState; t: T; head: Head }
const telOf = (p: string | null) => (p ? `tel:${p.replace(/[^\d+]/g, '')}` : undefined);
const names = (list: string[]) => list.join(', ');
const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;

/** Screen 177 — Feedback & Rating. Light by design: one overall score, a few optional specific ones, a few words. The timing respects the customer's experience, a weak part is never lost in a good overall score, and anyone unhappy is reached by a person. */
export function FeedbackScreen() {
  const { t } = useTranslation();
  const s = useFeedback();
  const head: Head = (sub, extra) => <ScreenHeader title={t(K.title)} subtitle={sub} action={<span className="row gap-2">{extra}<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh)}</Button></span>} />;
  if (s.role === 'admin') return s.feedbackId ? <AdminDetail s={s} t={t} head={head} /> : <AdminBoard s={s} t={t} head={head} />;
  return <CustomerDesk s={s} t={t} head={head} />;
}

function RatingRow({ value, onPick, label, size = 'big' }: { value: number | null; onPick: (n: number) => void; label: string; size?: 'big' | 'small' }) {
  return (
    <div className="row gap-2" role="radiogroup" aria-label={label} style={{ flexWrap: 'wrap' }}>
      {RATINGS.map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} data-rate={n} className={`ds-card ${value === n ? 'ds-card--selected' : ''}`.trim()} onClick={() => onPick(n)}
          style={{ minWidth: size === 'big' ? 52 : 44, minHeight: size === 'big' ? 52 : 44, padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'center' }}>
          <span className={size === 'big' ? 't-lg t-semibold' : 't-sm t-semibold'}>{n}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ the customer */

function CustomerDesk({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const d = s.desk;
  if (s.load === 'loading' && !d) return <Screen width="narrow">{head(t(K.subtitle.customer))}<LoadingState label={t(K.loading)} variant="list" rows={3} /></Screen>;
  if (s.load === 'error' && !d) return <Screen width="narrow">{head(t(K.subtitle.customer))}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!d) return null;
  const req = s.requestId ? d.due.find((r) => r.id === s.requestId) ?? null : null;
  if (s.requestId && (req || s.result)) return <Form s={s} t={t} head={head} req={req} />;
  return (
    <Screen width="narrow">
      {head(t(K.subtitle.customer))}
      {s.offline && <p className="t-xs t-muted mb-2" data-offline>{t(K.error.body)}</p>}
      <div className="stack gap-3">
        {d.due.length === 0 ? <Card><div className="stack gap-1" data-none><h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={18} aria-hidden="true" /> {t(K.none.title)}</h2><p className="t-sm t-muted">{t(K.none.body)}</p></div></Card>
          : d.due.map((r) => <AskCard key={r.id} r={r} s={s} t={t} />)}
        {d.upcoming.length > 0 && (
          <Card><div className="stack gap-1" data-upcoming><h2 className="t-md t-semibold">{t(K.upcoming.title)}</h2>{d.upcoming.map((r) => <p key={r.id} className="t-sm t-muted">{t(K.upcoming.body, { moment: t(`feedback.moment.${r.moment}.short`), date: formatDate(r.dueAt, lang) })}</p>)}</div></Card>
        )}
        <Card>
          <div className="stack gap-2" data-given>
            <h2 className="t-md t-semibold">{t(K.given.title)}</h2>
            {d.given.length === 0 ? <p className="t-sm t-muted">{t(K.given.empty)}</p> : d.given.map((g) => <GivenRow key={g.id} g={g} t={t} lang={lang} />)}
          </div>
        </Card>
      </div>
    </Screen>
  );
}

function AskCard({ r, s, t }: { r: FeedbackRequestView; s: FeedbackState; t: T }) {
  return (
    <Card>
      <div className="stack gap-2" data-ask={r.id}>
        <p className="t-xs t-muted">{t(K.ask.title)}</p>
        <h2 className="t-md t-semibold">{t(`feedback.moment.${r.moment}.title`)}</h2>
        <p className="t-sm">{t(`feedback.moment.${r.moment}.body`, { site: r.siteName, code: r.code })}</p>
        {r.people.length > 0 && <p className="t-xs t-muted">{t(K.moment.people, { people: names(r.people) })}</p>}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Button data-act="start" onClick={() => s.start(r.id)}>{t(K.ask.start)}</Button>
          <Button variant="ghost" data-act="later" onClick={() => void s.dismiss(r.id)}>{t(K.ask.later)}</Button>
        </div>
      </div>
    </Card>
  );
}

function GivenRow({ g, t, lang }: { g: FeedbackRowView; t: T; lang: string }) {
  return (
    <div className="stack gap-1" data-feedback={g.id}>
      <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm t-semibold">{t(`feedback.moment.${g.moment}.title`)}</span><Badge tone={g.overall >= 4 ? 'success' : g.overall <= 2 ? 'warning' : 'neutral'}>{g.overall}/5 · {t(`feedback.rating.${g.overall}`)}</Badge></span>
      <span className="t-xs t-muted">{g.siteName} · {formatDate(g.createdAt, lang)}</span>
      {g.comment && <span className="t-sm" style={{ overflowWrap: 'anywhere' }}>{g.comment}</span>}
      {g.followUp !== 'none' && <span className="t-xs t-muted" data-followup={g.followUp}>{t(`feedback.given.followUp.${g.followUp}`)}</span>}
    </div>
  );
}

function Form({ s, t, head, req }: P & { req: FeedbackRequestView | null }) {
  const [problem, setProblem] = useState<string | null>(null);
  const dr = s.draft;
  if (s.result) {
    const r = s.result;
    return (
      <Screen width="narrow">
        {head(t(K.subtitle.customer))}
        <Card>
          <div className="stack gap-2" data-thanks>
            <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={20} aria-hidden="true" /> {t(K.thanks.title)}</h2>
            <p className="t-sm">{t(K.thanks.body)}</p>
            {r.reachOut && (dr.overall !== null && dr.overall <= 2 ? <p className="t-sm" data-reach>{t(K.thanks.reach)}</p> : <p className="t-sm" data-reach>{t(K.thanks.reachWeak, { parts: Object.entries(dr.dimensions).filter(([, v]) => (v ?? 5) <= 2).map(([k2]) => t(`feedback.dim.${k2}`).toLowerCase()).join(', ') })}</p>)}
            {r.thanked.length > 0 && <p className="t-sm" data-passed>{t(K.thanks.passed, { names: names(r.thanked) })}</p>}
            <div><Button data-act="done" onClick={() => s.leave()}>{t(K.thanks.done)}</Button></div>
          </div>
        </Card>
      </Screen>
    );
  }
  const r = req as FeedbackRequestView;
  const submit = async () => { setProblem(null); const res = await s.submit(); if (!res.ok) setProblem(res.problem); };
  return (
    <Screen width="narrow">
      {head(t(`feedback.moment.${r.moment}.title`))}
      <div className="stack gap-3" data-form>
        <Card>
          <div className="stack gap-2">
            <p className="t-sm">{t(`feedback.moment.${r.moment}.body`, { site: r.siteName, code: r.code })}</p>
            {r.people.length > 0 && <p className="t-xs t-muted">{t(K.moment.people, { people: names(r.people) })}</p>}
            <h2 className="t-md t-semibold">{t(K.form.overall)}</h2>
            <RatingRow value={dr.overall} onPick={(n) => s.setDraft({ overall: n })} label={t(K.form.overall)} />
            {dr.overall !== null && <p className="t-sm t-muted" data-overall-label>{t(`feedback.rating.${dr.overall}`)}</p>}
          </div>
        </Card>
        <Card>
          <div className="stack gap-3" data-dimensions>
            <div className="stack gap-0"><h2 className="t-md t-semibold">{t(K.form.dimensionsTitle)}</h2><p className="t-xs t-muted">{t(K.form.dimensions.hint)}</p></div>
            {r.dimensions.map((d: FeedbackDimension) => (
              <div key={d} className="stack gap-1" data-dim={d}><span className="t-sm">{t(`feedback.dim.${d}`)}</span><RatingRow size="small" value={dr.dimensions[d] ?? null} onPick={(n) => s.setRating(d, n)} label={t(`feedback.dim.${d}`)} /></div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="stack gap-2">
            <Field label={t(K.form.commentLabel)} hint={t(K.form.comment.hint)}>{(p) => <TextArea id={p.id} rows={4} maxLength={MAX_COMMENT} value={dr.comment} data-f="comment" onChange={(e) => s.setDraft({ comment: e.target.value })} />}</Field>
            <p className="t-xs t-muted">{t(K.form.note)}</p>
            {problem && <p className="t-sm" role="alert" data-problem={problem} style={{ color: 'var(--color-error)' }}>{t(`feedback.problem.${problem}`, { defaultValue: t(K.problem.generic) })}</p>}
          </div>
        </Card>
      </div>
      <ActionBar>
        <Button className="grow" block data-act="submit" disabled={dr.overall === null} loading={s.sending} onClick={() => void submit()}>{s.sending ? t(K.form.sending) : t(K.form.submit)}</Button>
      </ActionBar>
    </Screen>
  );
}

/* ------------------------------------------------------------------ Admin */

const toneOf = (r: FeedbackAdminRow) => (r.sentiment === 'negative' ? 'warning' : r.sentiment === 'positive' ? 'success' : 'neutral');
function AdminBoard({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const b = s.board;
  const filters = ['outreach', 'weak', 'staff', 'low', 'all'] as const;
  return (
    <Screen width="default">
      {head(t(K.subtitle.admin))}
      <div className="row gap-2 mb-3" style={{ overflowX: 'auto' }} data-filters>
        {filters.map((f) => <span key={f} data-filter={f} style={{ flex: '0 0 auto' }}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(`feedback.board.filter.${f}`)}{b ? ` · ${b.counts[f]}` : ''}</Chip></span>)}
      </div>
      <p className="t-xs t-muted mb-2">{t(K.notice.placeholders)}</p>
      <div className="main-aside">
        <div className="stack gap-3" data-main>
          {s.load === 'loading' && !b ? <LoadingState label={t(K.loading)} variant="list" rows={4} />
            : s.load === 'error' && !b ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} />
            : !b || b.rows.length === 0 ? <EmptyState title={t(K.board.empty.title)} body={t(K.board.empty.body)} />
            : b.rows.map((r) => (
              <Card key={r.id}><button type="button" data-feedback={r.id} className="stack gap-1" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', width: '100%' }} onClick={() => s.open(r.id)}>
                <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm t-semibold">{r.customerName} · {r.code}</span><Badge tone={toneOf(r)}>{r.overall}/5</Badge></span>
                <span className="t-xs t-muted">{t(`feedback.moment.${r.moment}.title`)} · {r.siteName} · {formatDate(r.createdAt, i18n.language)}</span>
                <span className="row gap-1" style={{ flexWrap: 'wrap' }}>
                  {r.flags.map((f) => <Badge key={f} tone={f === 'weak_dimension' ? 'accent' : 'warning'}>{t(`feedback.flag.${f}`)}</Badge>)}
                  {r.sentiment === 'positive' && r.mentioned.length > 0 && <Badge tone="success">{t(K.sentiment.positive)}</Badge>}
                  {r.weak.map((d) => <Badge key={d} tone="neutral">{t(`feedback.dim.${d}`)}</Badge>)}
                  {r.flags.length > 0 && r.outreachDone && <Badge tone="success">{t(K.board.outreachDone)}</Badge>}
                </span>
              </button></Card>))}
        </div>
        <div className="stack gap-3" data-aside>{b && <Summary b={b} t={t} />}</div>
      </div>
    </Screen>
  );
}

function Summary({ b, t }: { b: NonNullable<FeedbackState['board']>; t: T }) {
  const sm = b.summary;
  return (
    <Card>
      <div className="stack gap-2" data-summary>
        <h2 className="t-md t-semibold">{t(K.summary.title)}</h2>
        <p className="t-sm">{t(K.summary.count, { count: sm.n })}{sm.avgOverall !== null ? ` · ${t(K.summary.avg, { avg: sm.avgOverall.toFixed(1) })}` : ''}</p>
        {sm.early && <p className="t-xs t-muted" data-early>{t(K.summary.early, { min: MIN_SAMPLE })}</p>}
        {sm.byDimension.length > 0 && <><h3 className="t-sm t-semibold">{t(K.summary.byDimension)}</h3>{sm.byDimension.map((d) => <p key={d.dimension} className="t-xs" data-dim={d.dimension}>{t(`feedback.dim.${d.dimension}`)}: {d.avg.toFixed(1)} ({d.n})</p>)}</>}
        {sm.byPerson.length > 0 && <><h3 className="t-sm t-semibold">{t(K.summary.byPerson)}</h3>{sm.byPerson.map((p) => <p key={p.userId} className="t-xs" data-person={p.userId}>{t(K.summary.person, { name: p.name, n: t(K.summary.count, { count: p.n }), avg: p.avg.toFixed(1) })}{p.small ? ` · ${t(K.summary.small)}` : ''}</p>)}</>}
      </div>
    </Card>
  );
}

function AdminDetail({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const d = s.detail;
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const back = <Button size="sm" variant="ghost" data-back onClick={() => s.list()}>{t(K.back)}</Button>;
  if (s.detailState === 'loading' && !d) return <Screen width="narrow">{head('', back)}<LoadingState label={t(K.loading)} variant="list" rows={3} /></Screen>;
  if (!d) return <Screen width="narrow">{head('', back)}{s.detailState === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /> : <EmptyState title={t(K.notFound)} body="" actionLabel={t(K.back)} onAction={() => s.list()} />}</Screen>;
  const save = async () => { setProblem(null); const r = await s.outreach(note); if (!r.ok) setProblem(r.problem); else setNote(''); };
  const needs = d.flags.length > 0;
  return (
    <Screen width="narrow">
      {head(`${d.code} · ${d.customerName}`, back)}
      <div className="stack gap-3" data-detail={d.id}>
        <Card>
          <div className="stack gap-2">
            <span className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}><Badge tone={toneOf(d)}>{t(K.detail.overall)} {d.overall}/5</Badge>{d.flags.map((f) => <Badge key={f} tone="warning">{t(`feedback.flag.${f}`)}</Badge>)}</span>
            <p className="t-xs t-muted">{t(`feedback.moment.${d.moment}.title`)} · {d.siteName} · {formatDate(d.createdAt, lang)}{d.ticketCode ? ` · ${t(K.detail.ticket, { code: d.ticketCode })}` : ''}</p>
            <h2 className="t-md t-semibold">{t(K.detail.ratings)}</h2>
            {Object.entries(d.dimensions).map(([k, v]) => <p key={k} className="t-sm" data-dim={k}>{t(`feedback.dim.${k}`)}: {v}/5</p>)}
            <h2 className="t-md t-semibold">{t(K.detail.comment)}</h2>
            <p className="t-sm" style={{ overflowWrap: 'anywhere' }} data-comment>{d.comment || t(K.detail.noComment)}</p>
            {d.people.length > 0 && <p className="t-xs t-muted">{t(K.detail.rated)}: {names(d.people)}</p>}
            {d.mentioned.length > 0 && <p className="t-sm" data-mentioned>{t(K.detail.mentioned, { names: names(d.mentioned) })}</p>}
            {d.sentiment === 'positive' && d.mentioned.length > 0 && <p className="t-xs t-muted">{t(K.detail.recognition)}</p>}
            {d.customerPhone && <div><a className="ds-btn ds-btn--secondary ds-btn--sm" href={telOf(d.customerPhone)}><Phone size={14} aria-hidden="true" /> {t(K.detail.call)} · {d.customerPhone}</a></div>}
          </div>
        </Card>
        {needs && (
          <Card>
            <div className="stack gap-2" data-outreach>
              <h2 className="t-md t-semibold">{t(K.detail.outreach.title)}</h2>
              {d.outreach ? <p className="t-sm" data-outreach-done>{t(K.detail.outreach.done, { name: d.outreach.byName, date: formatDate(d.outreach.at, lang) })}<br /><span className="t-muted">{d.outreach.note}</span></p> : (
                <>
                  <p className="t-sm">{t(K.detail.outreach.body)}</p>
                  <Field label={t(K.detail.outreach.note, { min: OUTREACH_NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={note} data-f="outreach-note" onChange={(e) => setNote(e.target.value)} />}</Field>
                  {problem && <p className="t-sm" role="alert" style={{ color: 'var(--color-error)' }}>{t(`feedback.problem.${problem}`, { defaultValue: t(K.problem.generic) })}</p>}
                  <Button data-act="outreach-save" disabled={lettersOf(note) < OUTREACH_NOTE_MIN} onClick={() => void save()}>{t(K.detail.outreach.save)}</Button>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </Screen>
  );
}
