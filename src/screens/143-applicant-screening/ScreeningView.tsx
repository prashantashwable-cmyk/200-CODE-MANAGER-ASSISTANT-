import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, ListMagnifyingGlass, SlidersHorizontal, Warning } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, Tabs, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { ScreeningDetailView, ScreeningFactorView, ScreeningRowView } from '@/data/repository';
import { ADJUST_MAX, ADJUST_MIN, DECLINE_REASONS, REASON_MIN } from '@/features/recruitment/screening';
import type { DeclineReason, Factor, Weights } from '@/features/recruitment/screening';
import { useScreening } from './useScreening';
import type { ScreeningState } from './useScreening';
import { FACTORS, RATINGS, ROLE_FILTERS, SCREENING_KEYS as K, SECTIONS, TABS, WEIGHT_MAX, WEIGHT_STEP } from './screening.types';

type T = ReturnType<typeof useTranslation>['t'];
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const scoreTone = (n: number): BadgeTone => (n >= 70 ? 'success' : n >= 45 ? 'accent' : 'neutral');
const barTone = (n: number) => (n >= 70 ? 'success' : n >= 40 ? 'accent' : 'warning') as 'success' | 'accent' | 'warning';
const roleKey = (role: ScreeningRowView['role']) => `application.admin.role.${role}`;
const channelKey = (c: string) => `application.admin.detail.channel.${c}`;

/** The wording of what a factor's number was made of. Frozen decisions keep the numbers only, so there may be nothing to say. */
function factorDetail(t: T, f: ScreeningFactorView): string | null {
  const d = f.detail;
  const has = (k: string) => k in d;
  if (f.key === 'completeness') return has('done') ? t(K.d.completeness, { done: d.done, total: d.total }) : null;
  if (f.key === 'experience') return has('years') ? `${t(K.d.experience, { years: t(`application.field.year.${d.years}`), picked: Number(d.choices) })} ${t(Number(d.words) ? K.d.experienceWords : K.d.experienceNoWords)}` : null;
  if (f.key === 'territory') {
    if (d.basis === 'zone' && d.zone) return t(K.d.zone, { zone: d.zone, leads: d.leads, count: Number(d.people) });
    if (d.basis === 'supplier' && d.category) return t(K.d.supplier, { category: t(`partCategory.${d.category}`), count: Number(d.suppliers) });
    return has('basis') ? t(K.d.noTerritory) : null;
  }
  if (f.key === 'availability') {
    if (!has('hours')) return null;
    const start = Number(d.startIn) >= 0 ? t(K.d.startSoon, { days: Number(d.startIn) }) : t(K.d.startNone);
    return t(K.d.availability, { hours: d.hours, days: d.days, start });
  }
  if (!has('total')) return null;
  return Number(d.total) === 0 ? t(K.d.noReferences) : t(K.d.references, { total: d.total, verified: d.verified, unchecked: d.unchecked, bad: d.bad });
}

/**
 * Screen 143 — Applicant Screening & Scoring. A ranked list of submitted applications with the reason for each number one tap away, quick
 * actions that keep the queue moving, and a scoring tab where the weights can be tuned and earlier approvals' outcomes read back.
 */
export function ScreeningScreen() {
  const { t, i18n } = useTranslation();
  const s = useScreening();
  const lang = i18n.language;
  const v = s.view;

  if (s.status === 'loading' && !v) return <Screen width="default"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  if (s.status === 'error' || !v) return <Screen width="default"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;

  const counts: Record<(typeof TABS)[number], number> = { queue: v.counts.queue, waiting: v.counts.waiting, decided: v.counts.approved + v.counts.rejected, scoring: 0 };
  const listTab = s.tab !== 'scoring';
  const shown = s.tab === 'queue' ? s.rows.queue : s.tab === 'waiting' ? s.rows.waiting : s.rows.decided;
  const total = s.tab === 'queue' ? v.queue.length : s.tab === 'waiting' ? v.waiting.length : v.decided.length;

  return (
    <Screen width="default">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle, { count: v.counts.queue })}
        action={s.tab === 'queue' && v.queue.length > 1 ? <Button size="sm" variant={s.selecting ? 'primary' : 'secondary'} data-select onClick={s.toggleSelecting}>{t(s.selecting ? K.filter.done : K.filter.select)}</Button> : undefined}
      />

      {v.demand.level !== 'normal' && (
        <Card className="mb-3">
          <div className="row gap-2" data-demand={v.demand.level} role="status" style={{ alignItems: 'flex-start' }}>
            <Warning size={22} aria-hidden="true" color="var(--color-warning)" />
            <p className="t-sm">{t(v.demand.level === 'surge' ? K.demand.surge : K.demand.busy, { count: v.demand.lastDay })}</p>
          </div>
        </Card>
      )}
      {v.counts.overdue > 0 && s.tab === 'queue' && <p className="t-xs t-warning mb-3" data-overdue-note>{t(K.overdueNote, { count: v.counts.overdue })}</p>}

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Tabs label={t(K.tabs.label)} value={s.tab} onChange={(id) => s.setTab(id as typeof s.tab)} items={TABS.map((id) => ({ id, label: id === 'scoring' ? t(K.tabs.scoring) : `${t(K.tabs[id])} · ${counts[id]}` }))} />
        {listTab && (
          <>
            <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
            <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.role)}>
              {ROLE_FILTERS.map((r) => <span key={r} data-role-filter={r}><Chip pressed={s.role === r} onClick={() => s.setRole(r)}>{r === 'all' ? t(K.filter.all) : t(roleKey(r))}</Chip></span>)}
            </div>
          </>
        )}
      </div>

      {listTab ? <List s={s} shown={shown} total={total} lang={lang} t={t} /> : <Scoring s={s} t={t} lang={lang} />}

      {s.selecting && s.selected.length > 0 && <BulkBar s={s} t={t} />}
      <DetailSheet s={s} t={t} lang={lang} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ the lists */

function Row({ leading, title, children, trailing, onClick, id }: { leading?: ReactNode; title: string; children: ReactNode; trailing: ReactNode; onClick: () => void; id: string }) {
  return (
    <button type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} data-app={id} onClick={onClick}>
      {leading && <span className="shrink-0" style={{ minHeight: 24, display: 'inline-flex', alignItems: 'center' }}>{leading}</span>}
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-medium">{title}</span>
        {children}
      </span>
      <span className="shrink-0">{trailing}</span>
    </button>
  );
}

function List({ s, shown, total, lang, t }: { s: ScreeningState; shown: ScreeningRowView[]; total: number; lang: string; t: T }) {
  const heading = s.tab === 'queue' ? K.list.queueHeading : s.tab === 'waiting' ? K.list.waitingHeading : K.list.decidedHeading;
  const hint = s.tab === 'queue' ? K.list.queueHint : s.tab === 'waiting' ? K.list.waitingHint : K.list.decidedHint;
  if (total === 0) {
    const empty = s.tab === 'queue' ? [K.list.emptyQueueTitle, K.list.emptyQueueBody] : s.tab === 'waiting' ? [K.list.emptyWaitingTitle, K.list.emptyWaitingBody] : [K.list.emptyDecidedTitle, K.list.emptyDecidedBody];
    return <EmptyState icon={<CheckCircle size={32} />} title={t(empty[0])} body={t(empty[1])} />;
  }
  return (
    <section className="stack gap-2" aria-labelledby="list-heading">
      <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="stack">
          <h2 id="list-heading" className="t-md t-semibold">{t(heading)}</h2>
          <p className="t-xs t-muted">{t(hint)}</p>
        </div>
        {s.selecting && <Button size="sm" variant="ghost" data-select-all onClick={s.selectAllShown}>{t(K.filter.selectAll)}</Button>}
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={<ListMagnifyingGlass size={28} />} title={t(K.list.emptyFilteredTitle)} body={t(K.list.emptyFilteredBody)} actionLabel={t(K.list.clearFilter)} onAction={() => { s.setQuery(''); s.setRole('all'); }} />
      ) : (
        <Card className="ds-card--flush">
          {shown.map((r, i) => <AppRow key={r.id} r={r} index={i} s={s} lang={lang} t={t} />)}
        </Card>
      )}
    </section>
  );
}

function AppRow({ r, index, s, lang, t }: { r: ScreeningRowView; index: number; s: ScreeningState; lang: string; t: T }) {
  const selectable = s.selecting && r.status === 'submitted';
  const waiting = r.waitingDays === 0 ? t(K.row.today) : t(K.row.waiting, { count: r.waitingDays });
  const queued = r.status === 'submitted';
  return (
    <Row
      id={r.id}
      leading={selectable ? <Checkbox checked={s.selected.includes(r.id)} onChange={() => s.toggle(r.id)} label={<span className="sr-only">{t(K.row.select, { name: r.name })}</span>} /> : queued ? <span className="t-sm t-muted num" aria-hidden="true">{index + 1}</span> : r.status === 'approved' ? <CheckCircle size={22} weight="fill" aria-hidden="true" color="var(--color-success)" /> : <Clock size={22} aria-hidden="true" color="var(--color-text-secondary)" />}
      title={r.name}
      trailing={
        <span className="stack" style={{ alignItems: 'flex-end' }} data-score={r.effective}>
          <strong className="num t-lg">{r.effective}</strong>
          {r.adjustment !== 0 && <span className="t-xs t-muted">{t(K.row.adjusted, { points: `${r.adjustment > 0 ? '+' : ''}${r.adjustment}` })}</span>}
        </span>
      }
      onClick={() => (selectable ? s.toggle(r.id) : s.openApplication(r.id))}
    >
      <span className="t-xs t-muted">{t(roleKey(r.role))} · {r.city} · {t(channelKey(r.channel))}</span>
      {queued || r.status === 'info_requested' ? (
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <span className={`t-xs ${r.overdue ? 't-warning' : 't-muted'}`}>{r.status === 'info_requested' ? (r.waitingDays === 0 ? t(K.row.askedToday) : t(K.row.askedAgo, { count: r.waitingDays })) : waiting}</span>
          {r.overdue && <Badge tone="warning">{t(K.row.overdue)}</Badge>}
          {r.outstanding > 0 && <Badge tone="neutral">{t(K.row.toCheck, { count: r.outstanding })}</Badge>}
        </span>
      ) : (
        <span className="t-xs t-muted">{t(r.status === 'approved' ? K.row.approved : K.row.rejected)}{r.submittedAt ? ` · ${formatDate(r.submittedAt, lang)}` : ''}</span>
      )}
      <span className="t-xs t-muted">{t(K.row.why, { top: t(K.factor.name[r.topFactor]), weak: t(K.factor.name[r.weakFactor]) })}</span>
    </Row>
  );
}

function BulkBar({ s, t }: { s: ScreeningState; t: T }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<DeclineReason | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <ActionBar>
        <Button variant="danger" style={{ width: '100%' }} data-bulk-open onClick={() => setOpen(true)}>{t(K.filter.declineSelected, { count: s.selected.length })}</Button>
      </ActionBar>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t(K.bulk.heading, { count: s.selected.length })}
        closeLabel={t('action.close')}
        footer={<Button variant="danger" style={{ width: '100%' }} disabled={!reason || s.busy} data-bulk-confirm onClick={async () => { const r = await s.declineSelected(reason as DeclineReason, note); if (r.ok) { setOpen(false); setReason(''); setNote(''); setError(null); } else setError(r.code ?? 'generic'); }}>{t(K.bulk.confirm, { count: s.selected.length })}</Button>}
      >
        <div className="stack gap-3">
          <p className="t-sm">{t(K.bulk.body)}</p>
          <ReasonPicker t={t} value={reason} onChange={setReason} />
          <Field label={t(K.declineSheet.note)}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
          {error && <p className="t-xs t-error" role="alert">{t(problemKey(error))}</p>}
        </div>
      </Sheet>
    </>
  );
}

function ReasonPicker({ t, value, onChange }: { t: T; value: DeclineReason | ''; onChange: (r: DeclineReason) => void }) {
  return (
    <div className="stack gap-2" role="group" aria-label={t(K.declineSheet.reason)}>
      <strong className="t-sm">{t(K.declineSheet.reason)}</strong>
      <div className="row gap-2 wrap">
        {DECLINE_REASONS.map((r) => <span key={r} data-reason={r}><Chip pressed={value === r} onClick={() => onChange(r)}>{t(K.decline[r])}</Chip></span>)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ one application */

type Mode = 'view' | 'approve' | 'ask' | 'decline' | 'adjust';

function DetailSheet({ s, t, lang }: { s: ScreeningState; t: T; lang: string }) {
  const d = s.detail;
  const open = !!s.appId;
  const [mode, setMode] = useState<Mode>('view');
  useEffect(() => setMode('view'), [s.appId]);
  const name = d?.application.form.personal.fullName ?? '';
  const title = mode === 'approve' ? t(K.approve.heading, { name }) : mode === 'ask' ? t(K.ask.heading) : mode === 'decline' ? t(K.declineSheet.heading, { name }) : mode === 'adjust' ? t(K.adjust.heading) : name || t(K.title);
  return (
    <Sheet open={open} onClose={s.closeDetail} title={title} closeLabel={t('action.close')}>
      {s.detailStatus === 'loading' && !d && <LoadingState label={t(K.loading)} variant="list" rows={3} />}
      {s.detailStatus === 'error' && !d && <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => s.openApplication(s.appId ?? '')} />}
      {s.detailStatus === 'gone' && <EmptyState icon={<ListMagnifyingGlass size={28} />} title={t(K.detail.notOpen)} body="" />}
      {d && s.detailStatus !== 'gone' && (mode === 'view' ? <Detail s={s} d={d} t={t} lang={lang} setMode={setMode} /> : mode === 'approve' ? <ApproveForm s={s} t={t} done={() => setMode('view')} back={() => setMode('view')} /> : mode === 'ask' ? <AskForm s={s} d={d} t={t} back={() => setMode('view')} /> : mode === 'decline' ? <DeclineForm s={s} d={d} t={t} back={() => setMode('view')} /> : <AdjustForm s={s} d={d} t={t} back={() => setMode('view')} />)}
      {d && s.detailStatus !== 'gone' && mode === 'view' && <ViewActions s={s} d={d} t={t} setMode={setMode} />}
    </Sheet>
  );
}

function ViewActions({ s, d, t, setMode }: { s: ScreeningState; d: ScreeningDetailView; t: T; setMode: (m: Mode) => void }) {
  const submitted = d.application.status === 'submitted';
  if (!d.canDecide) return d.nextId ? <Footer spread><Button variant="secondary" style={{ flex: 1 }} data-next onClick={() => s.openApplication(d.nextId as string)}>{t(K.detail.next)}</Button></Footer> : null;
  return (
    <Footer spread>
      {submitted && <Button style={{ flex: 1 }} data-approve disabled={s.busy} onClick={() => setMode('approve')}>{t(K.action.approve)}</Button>}
      {submitted && <Button variant="secondary" style={{ flex: 1 }} data-ask disabled={s.busy} onClick={() => setMode('ask')}>{t(K.action.ask)}</Button>}
      <Button variant="danger" style={{ flex: 1 }} data-decline disabled={s.busy} onClick={() => setMode('decline')}>{t(K.action.decline)}</Button>
    </Footer>
  );
}

function Detail({ s, d, t, lang, setMode }: { s: ScreeningState; d: ScreeningDetailView; t: T; lang: string; setMode: (m: Mode) => void }) {
  const a = d.application;
  const decision = d.decision;
  return (
    <div className="stack gap-4" data-detail={a.id}>
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <div className="stack" style={{ alignItems: 'center', minWidth: 72 }} data-effective={d.effective}>
          <strong className="num" style={{ fontSize: 'var(--font-size-3xl, 2rem)', lineHeight: 1 }}>{d.effective}</strong>
          <span className="t-xs t-muted">{t(K.detail.outOf)}</span>
        </div>
        <div className="stack gap-1 grow">
          <span className="t-sm">{a.code} · {t(roleKey(a.role))}</span>
          <span className="t-xs t-muted">{a.form.personal.city} · {t(channelKey(a.source.channel))}{a.submittedAt ? ` · ${formatDate(a.submittedAt, lang)}` : ''}</span>
          {d.place !== null && <Badge tone={scoreTone(d.effective)}>{t(K.detail.place, { place: d.place, size: d.queueSize })}</Badge>}
        </div>
      </div>

      {a.status === 'info_requested' && d.infoRequest && (
        <Card>
          <div className="stack gap-1" data-asked>
            <strong className="t-sm">{t(K.detail.asked, { date: formatDate(d.infoRequest.at, lang) })}</strong>
            <p className="t-sm">“{d.infoRequest.note}”</p>
            <p className="t-xs t-muted">{t(K.detail.waitingNote)}</p>
          </div>
        </Card>
      )}
      {d.infoRequest?.answeredAt && a.status === 'submitted' && <p className="t-xs t-muted" data-answered>{t(K.detail.answered, { date: formatDateTime(d.infoRequest.answeredAt, lang) })}</p>}

      <section className="stack gap-3" data-breakdown aria-label={t(K.detail.breakdown)}>
        <div className="stack">
          <strong className="t-md">{t(K.detail.breakdown)}</strong>
          <span className="t-xs t-muted">{t(d.frozen ? K.detail.frozen : K.detail.live)}</span>
        </div>
        {d.rows.map((f) => {
          const text = factorDetail(t, f);
          return (
            <div key={f.key} className="stack gap-1" data-factor={f.key} data-value={f.value}>
              <div className="row gap-2" style={{ justifyContent: 'space-between' }}>
                <span className="t-sm t-medium">{t(K.factor.name[f.key])} <span className="t-xs t-muted">· {t(K.detail.weight, { weight: f.weight })}</span></span>
                <span className="t-sm num">{t(K.detail.points, { points: (Math.round(f.contribution * 10) / 10).toString() })}</span>
              </div>
              <ProgressBar value={f.value / 100} tone={barTone(f.value)} label={`${t(K.factor.name[f.key])} ${f.value}`} />
              <span className="t-xs t-muted">{text ?? t(K.factor.hint[f.key])}</span>
            </div>
          );
        })}
        {d.adjustment && (
          <p className="t-sm" data-adjustment>
            <strong>{d.adjustment.points > 0 ? '+' : ''}{d.adjustment.points}</strong> · {d.adjustment.reason}
            <span className="t-xs t-muted"> — {t(K.adjust.by, { name: d.adjustment.byName, date: formatDate(d.adjustment.at, lang) })}</span>
          </p>
        )}
        {d.canDecide && <Button variant="ghost" size="sm" style={{ width: 'fit-content' }} data-adjust-open onClick={() => setMode('adjust')}>{t(K.adjust.open)}</Button>}
      </section>

      <p className="t-sm" data-outstanding>{a.outstanding.length > 0 ? t(K.detail.outstanding, { count: a.outstanding.length }) : t(K.detail.outstandingNone)}</p>
      <Button variant="secondary" style={{ width: 'fit-content' }} data-open-full onClick={() => s.fullApplication(a.id)}>{t(K.detail.open)}</Button>

      {decision && (
        <Card>
          <div className="stack gap-1" data-decision={decision.status}>
            <strong className="t-sm">{t(decision.status === 'approved' ? K.detail.decisionApproved : K.detail.decisionRejected, { name: decision.byName, date: formatDate(decision.at, lang) })}</strong>
            {decision.reasonKey && <p className="t-sm">{t(K.detail.reason)}: {t(decision.reasonKey)}</p>}
            {decision.note && <p className="t-sm">“{decision.note}”</p>}
          </div>
        </Card>
      )}
      {a.status === 'approved' && <Button variant="secondary" style={{ width: 'fit-content' }} data-open-interview onClick={() => s.goto(`/interviews/${a.id}`)}>{t(K.detail.interview)}</Button>}
      {a.status === 'approved' && <OutcomeBox s={s} d={d} t={t} />}
    </div>
  );
}

function OutcomeBox({ s, d, t }: { s: ScreeningState; d: ScreeningDetailView; t: T }) {
  const [note, setNote] = useState('');
  return (
    <Card>
      <div className="stack gap-2" data-outcome>
        <strong className="t-sm">{t(K.feedback.outcomeHeading)}</strong>
        {d.outcome ? <p className="t-sm" data-rated={d.outcome.rating}>{t(K.feedback.rate[d.outcome.rating])}{d.outcome.note ? ` · “${d.outcome.note}”` : ''}</p> : null}
        <Field label={t(K.feedback.note)}>{(p) => <Input id={p.id} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.feedback.rate.label)}>
          {RATINGS.map((r) => <span key={r} data-rate={r}><Chip pressed={d.outcome?.rating === r} onClick={() => void s.rate(d.application.id, r, note)}>{t(K.feedback.rate[r])}</Chip></span>)}
        </div>
      </div>
    </Card>
  );
}

/** Stays in view at the bottom of the sheet while its long content scrolls, so the decision buttons are never off-screen. */
function Footer({ children, spread }: { children: ReactNode; spread?: boolean }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: spread ? 'stretch' : 'flex-end' }}>{children}</div>;
}

function ApproveForm({ s, t, done, back }: { s: ScreeningState; t: T; done: () => void; back: () => void }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <>
    <div className="stack gap-3" data-form="approve">
      <p className="t-sm">{t(K.approve.body)}</p>
      <Field label={t(K.approve.note)}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      {error && <p className="t-xs t-error" role="alert">{t(problemKey(error))}</p>}
    </div>
      <Footer>
        <Button variant="ghost" onClick={back}>{t(K.action.back)}</Button>
        <Button disabled={s.busy} data-confirm-approve onClick={async () => { const r = await s.approve(note); if (!r.ok) setError(r.code ?? 'generic'); else done(); }}>{t(K.action.confirm)}</Button>
      </Footer>
    </>
  );
}

function AskForm({ s, d, t, back }: { s: ScreeningState; d: ScreeningDetailView; t: T; back: () => void }) {
  const missing = d.application.sections.filter((x) => !x.complete).map((x) => x.id as string);
  const [sections, setSections] = useState<string[]>(missing.length > 0 ? missing : []);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ok = sections.length > 0 && letters(note) >= 8;
  return (
    <>
    <div className="stack gap-3" data-form="ask">
      <p className="t-sm">{t(K.ask.body)}</p>
      <div className="stack gap-2" role="group" aria-label={t(K.ask.sections)}>
        <strong className="t-sm">{t(K.ask.sections)}</strong>
        <div className="row gap-2 wrap">
          {SECTIONS.map((id) => <span key={id} data-section={id}><Chip pressed={sections.includes(id)} onClick={() => setSections((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))}>{t(`application.section.title.${id}`)}</Chip></span>)}
        </div>
      </div>
      <Field label={t(K.ask.note)} hint={t(K.ask.noteHint)}>{(p) => <TextArea id={p.id} rows={4} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      {error && <p className="t-xs t-error" role="alert">{t(problemKey(error))}</p>}
    </div>
      <Footer>
        <Button variant="ghost" onClick={back}>{t(K.action.back)}</Button>
        <Button disabled={!ok || s.busy} data-confirm-ask onClick={async () => { const r = await s.askForMore(sections, note); if (!r.ok) setError(r.code ?? 'generic'); }}>{t(K.action.send)}</Button>
      </Footer>
    </>
  );
}

function DeclineForm({ s, d, t, back }: { s: ScreeningState; d: ScreeningDetailView; t: T; back: () => void }) {
  const { i18n } = useTranslation();
  const [reason, setReason] = useState<DeclineReason | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const a = d.application.form.personal;
  const applicantLang = a.languages[0] ?? 'en';
  const there = useMemo(() => i18n.getFixedT(applicantLang), [i18n, applicantLang]);
  return (
    <>
    <div className="stack gap-3" data-form="decline">
      <p className="t-sm">{t(K.declineSheet.body)}</p>
      <ReasonPicker t={t} value={reason} onChange={setReason} />
      <Field label={t(K.declineSheet.note)}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      {reason && (
        <Card>
          <div className="stack gap-1" data-preview>
            <strong className="t-xs t-muted">{t(K.declineSheet.preview, { name: a.fullName })}</strong>
            <p className="t-sm">{there(K.message.decline[reason], { name: a.fullName.split(' ')[0] })}</p>
            {note.trim() && <p className="t-sm">“{note.trim()}”</p>}
            <span className="t-xs t-muted">{t(K.detail.languageNote, { language: ({ en: 'English', hi: 'हिन्दी', mr: 'मराठी' } as Record<string, string>)[applicantLang] ?? applicantLang })}</span>
          </div>
        </Card>
      )}
      {error && <p className="t-xs t-error" role="alert">{t(problemKey(error))}</p>}
    </div>
      <Footer>
        <Button variant="ghost" onClick={back}>{t(K.action.back)}</Button>
        <Button variant="danger" disabled={!reason || s.busy} data-confirm-decline onClick={async () => { const r = await s.decline(reason as DeclineReason, note); if (!r.ok) setError(r.code ?? 'generic'); }}>{t(K.action.decline)}</Button>
      </Footer>
    </>
  );
}

function AdjustForm({ s, d, t, back }: { s: ScreeningState; d: ScreeningDetailView; t: T; back: () => void }) {
  const [points, setPoints] = useState(d.adjustment ? String(d.adjustment.points) : '');
  const [reason, setReason] = useState(d.adjustment?.reason ?? '');
  const [error, setError] = useState<string | null>(null);
  const n = Number(points);
  const ok = Number.isInteger(n) && n !== 0 && n >= ADJUST_MIN && n <= ADJUST_MAX && letters(reason) >= REASON_MIN;
  return (
    <>
    <div className="stack gap-3" data-form="adjust">
      <p className="t-sm">{t(K.adjust.body)}</p>
      <Field label={t(K.adjust.points)} hint={t(K.adjust.pointsHint, { min: ADJUST_MIN, max: ADJUST_MAX })}>{(p) => <Input id={p.id} inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value.replace(/[^\d-+]/g, ''))} />}</Field>
      <Field label={t(K.adjust.reason)} hint={t(K.adjust.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      {error && <p className="t-xs t-error" role="alert">{t(problemKey(error))}</p>}
    </div>
      <Footer>
        <Button variant="ghost" onClick={back}>{t(K.action.back)}</Button>
        {d.adjustment && <Button variant="secondary" disabled={s.busy} data-adjust-remove onClick={async () => { const r = await s.adjust(null, ''); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.adjust.remove)}</Button>}
        <Button disabled={!ok || s.busy} data-adjust-save onClick={async () => { const r = await s.adjust(n, reason); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.adjust.save)}</Button>
      </Footer>
    </>
  );
}

/* ------------------------------------------------------------------ scoring */

function Scoring({ s, t, lang }: { s: ScreeningState; t: T; lang: string }) {
  const c = s.config;
  const [draft, setDraft] = useState<Weights | null>(null);
  const [reshuffle, setReshuffle] = useState<{ moved: number; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (c) setDraft((cur) => cur ?? { ...c.weights });
  }, [c]);
  if (!c || !draft) return <LoadingState label={t(K.loading)} variant="list" rows={4} />;

  const sum = FACTORS.reduce((n, k) => n + draft[k], 0);
  const changed = FACTORS.some((k) => draft[k] !== c.weights[k]);
  const step = (k: Factor, delta: number) => { setReshuffle(null); setDraft({ ...draft, [k]: Math.max(0, Math.min(WEIGHT_MAX, draft[k] + delta)) }); };
  const save = async (confirm: boolean) => {
    const r = await s.saveWeights(draft, confirm);
    if (!r.ok) return setError(r.code);
    setError(null);
    if (r.result.saved) setReshuffle(null);
    else setReshuffle({ moved: Math.round(r.result.reshuffle * r.result.queueSize), size: r.result.queueSize });
  };

  return (
    <div className="grid-auto" style={{ '--min': '340px', alignItems: 'start' } as React.CSSProperties}>
      <Card>
        <div className="stack gap-3" data-weights>
          <div className="stack gap-1">
            <strong className="t-md"><SlidersHorizontal size={18} aria-hidden="true" /> {t(K.scoring.heading)}</strong>
            <p className="t-sm">{t(K.scoring.body)}</p>
            <p className="t-xs t-muted" data-placeholder>{t(K.scoring.placeholder)}</p>
          </div>
          {FACTORS.map((k) => (
            <div key={k} className="row gap-2" data-weight={k} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stack grow" style={{ minWidth: 0 }}>
                <span className="t-sm t-medium">{t(K.factor.name[k])}</span>
                <span className="t-xs t-muted">{t(K.factor.hint[k])}</span>
              </span>
              <Button size="sm" variant="secondary" aria-label={t(K.scoring.less, { factor: t(K.factor.name[k]) })} data-less disabled={draft[k] <= 0} onClick={() => step(k, -WEIGHT_STEP)}>−</Button>
              <strong className="num" style={{ minWidth: 44, textAlign: 'center' }} data-weight-value>{draft[k]}%</strong>
              <Button size="sm" variant="secondary" aria-label={t(K.scoring.more, { factor: t(K.factor.name[k]) })} data-more disabled={draft[k] >= WEIGHT_MAX} onClick={() => step(k, WEIGHT_STEP)}>+</Button>
            </div>
          ))}
          <div className="row gap-2 wrap" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge tone={sum === 100 ? 'success' : 'error'} dot>{t(K.scoring.total, { sum })}</Badge>
            <span className="t-xs t-muted">{c.updatedAt ? t(K.scoring.changed, { name: c.updatedByName ?? '', date: formatDate(c.updatedAt, lang) }) : t(K.scoring.neverChanged)}</span>
          </div>
          {sum !== 100 && <p className="t-xs t-error" role="alert">{t(K.problem.sum_not_100)}</p>}
          <p className="t-xs t-muted">{t(K.scoring.max, { max: WEIGHT_MAX })}</p>
          {reshuffle && (
            <Card>
              <div className="stack gap-2" data-reshuffle role="alert">
                <strong className="t-sm">{t(K.scoring.reshuffleHeading)}</strong>
                <p className="t-sm">{t(K.scoring.reshuffleBody, { moved: reshuffle.moved, size: reshuffle.size })}</p>
                <div className="row gap-2">
                  <Button variant="secondary" onClick={() => { setReshuffle(null); setDraft({ ...c.weights }); }}>{t(K.scoring.keep)}</Button>
                  <Button data-apply-anyway disabled={s.busy} onClick={() => void save(true)}>{t(K.scoring.apply)}</Button>
                </div>
              </div>
            </Card>
          )}
          {error && <p className="t-xs t-error" role="alert">{t(problemKey(error))}</p>}
          <div className="row gap-2 wrap">
            <Button variant="ghost" disabled={FACTORS.every((k) => draft[k] === c.defaults[k])} data-reset onClick={() => { setReshuffle(null); setDraft({ ...c.defaults }); }}>{t(K.scoring.reset)}</Button>
            <Button data-save-weights disabled={!changed || sum !== 100 || s.busy} onClick={() => void save(false)}>{t(K.scoring.save)}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="stack gap-3" data-feedback>
          <div className="stack gap-1">
            <strong className="t-md">{t(K.feedback.heading)}</strong>
            <p className="t-sm">{t(K.feedback.body)}</p>
          </div>
          {!c.feedback.enough ? <p className="t-sm" data-enough="0">{t(K.feedback.notEnough, { rated: c.feedback.rated, needed: 5 })}</p> : (
            <>
              {c.feedback.perFactor.map((p) => (
                <div key={p.key} className="stack gap-1" data-gap={p.key}>
                  <span className="t-sm t-medium">{t(K.factor.name[p.key])}</span>
                  <span className="t-xs t-muted">{t(K.feedback.row, { strong: p.strong ?? t(K.feedback.na), weak: p.weak ?? t(K.feedback.na) })}</span>
                </div>
              ))}
              <p className="t-sm" data-suggest={c.feedback.suggest ?? ''}>{c.feedback.suggest ? t(K.feedback.suggest, { factor: t(K.factor.name[c.feedback.suggest]) }) : t(K.feedback.noSuggest)}</p>
            </>
          )}
          <strong className="t-sm">{t(K.feedback.toRate)}</strong>
          {c.toRate.length === 0 ? <p className="t-xs t-muted">{t(K.feedback.toRateNone)}</p> : c.toRate.map((x) => <ToRate key={x.id} s={s} x={x} t={t} lang={lang} />)}
        </div>
      </Card>
    </div>
  );
}

function ToRate({ s, x, t, lang }: { s: ScreeningState; x: { id: string; name: string; role: ScreeningRowView['role']; decidedAt: string }; t: T; lang: string }) {
  return (
    <div className="stack gap-1" data-torate={x.id}>
      <span className="t-sm"><strong>{x.name}</strong> · {t(roleKey(x.role))} · {formatDate(x.decidedAt, lang)}</span>
      <div className="row gap-2 wrap" role="group" aria-label={t(K.feedback.rate.label)}>
        {RATINGS.map((r) => <span key={r} data-rate={r}><Chip onClick={() => void s.rate(x.id, r, '')}>{t(K.feedback.rate[r])}</Chip></span>)}
      </div>
    </div>
  );
}
