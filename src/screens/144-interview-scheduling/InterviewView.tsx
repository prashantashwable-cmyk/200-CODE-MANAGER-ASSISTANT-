import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, CalendarX, CheckCircle, Clock, Gear, Phone, Plus, UserCircle, VideoCamera, X } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, Toggle, formatDate, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { CalendarView } from '@/features/calendar/CalendarView';
import { CALENDAR_MODES } from '@/features/calendar/calendarMath';
import type { CalendarEvent, CalendarMode } from '@/features/calendar/calendarMath';
import { dateKey } from '@/features/logistics/deliverySlots';
import { WINDOW_CHOICES, completeProblem, suggestedConcern } from '@/features/recruitment/interview';
import type { Phase } from '@/features/recruitment/interview';
import type { InterviewApplicantView, InterviewDetailView, InterviewRowView, InterviewSaveResult } from '@/data/repository';
import type { InterviewAvailability, InterviewConcernCategory, InterviewMode, PartnerInterview } from '@/data/types';
import { useInterview } from './useInterview';
import type { InterviewState } from './useInterview';
import { BUFFERS, CONCERN_CATEGORIES, HORIZONS, INTERVIEW_KEYS as K, INTERVIEW_MODES, LEADS, NOTE_MIN, OUTCOMES, RATING_OPTIONS, REASON_MIN, SLOT_LENGTHS, WEEKDAYS, applyPath, draftKey, keyKey } from './interview.types';

type T = ReturnType<typeof useTranslation>['t'];
const LOCALE: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const dayLabel = (iso: string, lang: string, long = false) => new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso));
const timeLabel = (iso: string, lang: string) => new Intl.DateTimeFormat(LOCALE[lang] ?? 'en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
const whenLabel = (iso: string, lang: string) => `${dayLabel(iso, lang)} · ${timeLabel(iso, lang)}`;
const MODE_ICON: Record<InterviewMode, ReactNode> = { phone: <Phone size={16} aria-hidden="true" />, video: <VideoCamera size={16} aria-hidden="true" />, in_person: <UserCircle size={16} aria-hidden="true" /> };
const PHASE_TONE: Record<Phase, BadgeTone> = { to_arrange: 'neutral', invited: 'accent', scheduled: 'success', move_requested: 'warning', needs_outcome: 'warning', completed: 'success', missed: 'neutral', cancelled: 'neutral', skipped: 'neutral' };
const toggle = <X,>(list: X[], x: X): X[] => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

/**
 * Screen 144 — Interview Scheduling. Admin sees a calendar of interviews, what needs them, and each applicant's record; the applicant, on their own
 * application link, picks a time from Admin's open windows, gets it confirmed at once, and can change it without a message to anyone.
 */
export function InterviewScreen() {
  const { t } = useTranslation();
  const s = useInterview();
  const shell = (body: JSX.Element) => (s.admin ? <Screen width="default"><ScreenHeader title={t(K.title)} />{body}</Screen> : <div className="ds-screen ds-screen--narrow"><PublicHeader s={s} t={t} />{body}</div>);
  if (s.status === 'invalid') return shell(<EmptyState icon={<CalendarX size={28} />} title={t(K.invalid.title)} body={t(K.invalid.body)} actionLabel={t(K.invalid.action)} onAction={() => s.goto('/join')} />);
  if (s.status === 'not_found') return shell(<EmptyState icon={<CalendarX size={28} />} title={t(K.invalid.title)} body={t(K.invalid.body)} actionLabel={s.admin ? t(K.action.back) : t(K.invalid.action)} onAction={() => s.goto(s.admin ? '/interviews' : '/join')} />);
  if (s.status === 'loading' && !s.board && !s.mine) return shell(<LoadingState label={t(K.loading)} variant="list" rows={4} />);
  if (s.status === 'error' || (!s.board && !s.mine)) return shell(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  return s.admin ? <AdminBoard s={s} t={t} /> : s.mine ? <Applicant s={s} v={s.mine} t={t} /> : null;
}

function PublicHeader({ s, t }: { s: InterviewState; t: T }) {
  const { i18n } = useTranslation();
  return (
    <header className="stack gap-2 mb-3" style={{ alignItems: 'center', textAlign: 'center' }}>
      <span className="t-xs t-muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t(K.brand)}</span>
      <div className="row gap-2 wrap" role="group" aria-label={t(K.language)} style={{ justifyContent: 'center' }}>
        {(['en', 'hi', 'mr'] as const).map((l) => <span key={l} data-lang={l}><Chip pressed={i18n.language.startsWith(l)} onClick={() => s.setLanguage(l)}>{{ en: 'English', hi: 'हिन्दी', mr: 'मराठी' }[l]}</Chip></span>)}
      </div>
    </header>
  );
}

/** Stays in view at the bottom of a sheet while its content scrolls. */
function Footer({ children, spread }: { children: ReactNode; spread?: boolean }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: spread ? 'stretch' : 'flex-end' }}>{children}</div>;
}

/* ================================================================== Admin */

function eventsOf(rows: InterviewRowView[]): CalendarEvent[] {
  return rows
    .filter((r) => r.slot)
    .map((r) => ({
      id: r.id,
      date: dateKey(new Date((r.slot as NonNullable<typeof r.slot>).start)),
      label: `${new Date((r.slot as NonNullable<typeof r.slot>).start).toTimeString().slice(0, 5)} ${r.name.split(' ')[0]}`,
      tone: r.phase === 'completed' ? 'success' : r.phase === 'needs_outcome' || r.phase === 'move_requested' || r.conflict ? 'warning' : 'accent',
    }));
}

function AdminBoard({ s, t }: { s: InterviewState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const b = s.board as NonNullable<typeof s.board>;
  const [mode, setMode] = useState<CalendarMode>('week');
  const [cursor, setCursor] = useState(() => dateKey(new Date()));
  const [selected, setSelected] = useState<string | null>(() => dateKey(new Date()));
  const [availOpen, setAvailOpen] = useState(false);
  const events = useMemo(() => eventsOf(b.rows), [b.rows]);
  const byId = useMemo(() => new Map(b.rows.map((r) => [r.id, r])), [b.rows]);
  const dayRows = b.rows.filter((r) => r.slot && selected && dateKey(new Date((r.slot as NonNullable<typeof r.slot>).start)) === selected).sort((x, y) => (x.slot as NonNullable<typeof x.slot>).start.localeCompare((y.slot as NonNullable<typeof y.slot>).start));
  const group = (p: (r: InterviewRowView) => boolean) => b.rows.filter(p);
  const sections: { key: string; title: string; rows: InterviewRowView[] }[] = [
    { key: 'needs', title: t(K.admin.queue.needsOutcome), rows: group((r) => r.phase === 'needs_outcome') },
    { key: 'conflicts', title: t(K.admin.queue.conflicts), rows: group((r) => r.conflict) },
    { key: 'arrange', title: t(K.admin.queue.toArrange), rows: group((r) => r.phase === 'to_arrange') },
    { key: 'invited', title: t(K.admin.queue.invited), rows: group((r) => r.phase === 'invited') },
    { key: 'missed', title: t(K.admin.queue.missed), rows: group((r) => r.phase === 'missed') },
  ].filter((x) => x.rows.length > 0);
  const nothing = b.rows.length === 0;

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.admin.subtitle, { count: b.counts.scheduled })}
        action={<Button size="sm" variant="secondary" icon={<Gear size={16} />} data-availability-open onClick={() => setAvailOpen(true)}>{t(K.admin.availability.open)}</Button>}
      />
      {b.openSlots === 0 && <Card className="mb-3"><p className="t-sm t-warning" role="status" data-no-slots>{t(K.admin.availability.noSlots)}</p></Card>}

      <div className="stack gap-3 mb-3">
        <Tabs label={t(K.admin.view.label)} value={mode} onChange={(id) => setMode(id as CalendarMode)} items={CALENDAR_MODES.map((m) => ({ id: m, label: t(K.admin.view[m]) }))} />
      </div>

      <div className="main-aside">
        <div className="stack gap-3">
          <Card>
            <CalendarView
              mode={mode}
              cursor={cursor}
              onCursorChange={setCursor}
              events={events}
              selected={selected}
              onSelect={(k) => { setSelected(k); if (mode === 'month' && k.slice(0, 7) !== cursor.slice(0, 7)) setCursor(k); }}
              renderAgendaRow={(e) => { const r = byId.get(e.id); return r ? <InterviewRow r={r} s={s} t={t} lang={lang} /> : <span>{e.label}</span>; }}
            />
            <Legend t={t} />
          </Card>
          {mode !== 'agenda' && selected && (
            <section aria-live="polite" className="stack gap-2" data-day>
              <h2 className="t-md t-semibold">{dayLabel(`${selected}T12:00:00`, lang, true)}</h2>
              {dayRows.length === 0 ? <EmptyState icon={<CalendarCheck size={28} />} title={t(K.admin.day.empty)} body={t(K.admin.day.emptyBody)} /> : <Card className="ds-card--flush">{dayRows.map((r) => <InterviewRow key={r.id} r={r} s={s} t={t} lang={lang} />)}</Card>}
            </section>
          )}
        </div>

        <div className="stack gap-3" data-queue>
          <h2 className="t-md t-semibold">{t(K.admin.queue.heading)}</h2>
          {nothing || sections.length === 0 ? <EmptyState icon={<CheckCircle size={28} />} title={t(K.admin.queue.emptyTitle)} body={t(K.admin.queue.emptyBody)} /> : sections.map((sec) => (
            <section key={sec.key} className="stack gap-1" data-section={sec.key}>
              <h3 className="label">{sec.title} · {sec.rows.length}</h3>
              <Card className="ds-card--flush">{sec.rows.map((r) => <InterviewRow key={r.id} r={r} s={s} t={t} lang={lang} />)}</Card>
            </section>
          ))}
        </div>
      </div>

      <AvailabilitySheet s={s} t={t} lang={lang} open={availOpen} onClose={() => setAvailOpen(false)} initial={b.availability} openSlots={b.openSlots} />
      <DetailSheet s={s} t={t} lang={lang} />
    </Screen>
  );
}

function Legend({ t }: { t: T }) {
  const items: { tone: CalendarEvent['tone']; key: string }[] = [{ tone: 'accent', key: K.admin.legend.scheduled }, { tone: 'warning', key: K.admin.legend.attention }, { tone: 'success', key: K.admin.legend.held }];
  return <div className="row gap-3 wrap mt-3" aria-hidden="true">{items.map((i) => <span key={i.key} className="row gap-1 t-xs t-muted" style={{ alignItems: 'center' }}><span className={`cal__dot cal__dot--${i.tone}`} />{t(i.key)}</span>)}</div>;
}

function InterviewRow({ r, s, t, lang }: { r: InterviewRowView; s: InterviewState; t: T; lang: string }) {
  const line = r.slot ? `${whenLabel(r.slot.start, lang)} · ${t(K.mode[r.slot.mode])}` : r.phase === 'to_arrange' || r.phase === 'invited' ? (r.waitingDays === 0 ? t(K.admin.row.today) : t(K.admin.row.waiting, { count: r.waitingDays })) : t(K.admin.row.noTime);
  return (
    <button type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} data-interview={r.id} data-phase={r.phase} onClick={() => s.open(r.id)}>
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-medium">{r.name}</span>
        <span className="t-xs t-muted">{t(`application.admin.role.${r.role}`)} · {line}</span>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          {r.score !== null && <span className="t-xs t-muted">{t(K.admin.row.score, { score: r.score })}</span>}
          {r.misses > 0 && <Badge tone="neutral">{t(K.admin.row.misses, { count: r.misses })}</Badge>}
          {r.reschedules > 0 && <Badge tone="neutral">{t(K.admin.row.moves, { count: r.reschedules })}</Badge>}
          {r.conflict && <Badge tone="warning">{t(K.admin.row.conflict)}</Badge>}
          {r.signal === 'caution' && <Badge tone="warning">{t(K.signal.caution)}</Badge>}
          {r.signal === 'block' && <Badge tone="error">{t(K.signal.block)}</Badge>}
        </span>
      </span>
      <span className="shrink-0"><Badge tone={PHASE_TONE[r.phase]} dot>{t(K.phase[r.phase])}</Badge></span>
    </button>
  );
}

/* ------------------------------------------------------------------ one applicant */

type Mode = 'view' | 'invite' | 'book' | 'move' | 'cancel' | 'skip' | 'missed' | 'complete' | 'addendum';

function DetailSheet({ s, t, lang }: { s: InterviewState; t: T; lang: string }) {
  const d = s.detail;
  const open = !!s.applicationId;
  const [mode, setMode] = useState<Mode>('view');
  useEffect(() => setMode('view'), [s.applicationId]);
  const back = () => setMode('view');
  const name = d?.applicant.name ?? '';
  const titles: Record<Mode, string> = { view: name || t(K.title), invite: t(K.invite.heading, { name }), book: t(K.book.heading), move: t(K.move.heading), cancel: t(K.cancelSheet.heading), skip: t(K.skipSheet.heading), missed: t(K.missed.heading), complete: t(K.complete.heading), addendum: t(K.addendum.heading) };
  return (
    <Sheet open={open} onClose={s.close} title={titles[mode]} closeLabel={t('action.close')}>
      {s.detailStatus === 'loading' && !d && <LoadingState label={t(K.loading)} variant="list" rows={3} />}
      {s.detailStatus === 'error' && !d && <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reloadDetail()} />}
      {s.detailStatus === 'gone' && <EmptyState icon={<CalendarX size={28} />} title={t(K.invalid.title)} body={t(K.invalid.body)} />}
      {d && s.detailStatus !== 'gone' && (
        mode === 'view' ? <Detail s={s} d={d} t={t} lang={lang} setMode={setMode} />
        : mode === 'invite' ? <InviteForm s={s} t={t} back={back} />
        : mode === 'book' ? <BookForm s={s} d={d} t={t} lang={lang} back={back} />
        : mode === 'complete' ? <CompleteForm s={s} d={d} t={t} back={back} />
        : mode === 'addendum' ? <AddendumForm s={s} t={t} back={back} />
        : mode === 'missed' ? <MissedForm s={s} t={t} back={back} />
        : <ReasonForm s={s} t={t} back={back} kind={mode} />
      )}
    </Sheet>
  );
}

function Detail({ s, d, t, lang, setMode }: { s: InterviewState; d: InterviewDetailView; t: T; lang: string; setMode: (m: Mode) => void }) {
  const i = d.interview;
  const r = d.row;
  const phase = r.phase;
  const steps = [
    { id: 'approved', label: t(K.detail.steps.approved), status: 'complete' as const },
    { id: 'invited', label: t(K.detail.steps.invited), status: i && i.status !== 'cancelled' ? ('complete' as const) : ('upcoming' as const) },
    { id: 'scheduled', label: t(K.detail.steps.scheduled), status: i?.slot ? ('complete' as const) : ('upcoming' as const) },
    { id: 'held', label: t(K.detail.steps.held), status: i?.completed ? ('complete' as const) : phase === 'needs_outcome' ? ('current' as const) : ('upcoming' as const) },
    { id: 'outcome', label: t(K.detail.steps.outcome), status: i?.completed ? ('complete' as const) : ('upcoming' as const) },
  ];
  const slotPassed = !!i?.slot && Date.now() >= new Date(i.slot.start).getTime();
  return (
    <div className="stack gap-4" data-detail={r.id} data-phase={phase}>
      <div className="stack gap-1">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone={PHASE_TONE[phase]} dot>{t(K.phase[phase])}</Badge>
          {r.score !== null && <span className="t-sm t-muted">{t(K.admin.row.score, { score: r.score })}</span>}
          {d.signal.level !== 'neutral' && <Badge tone={d.signal.level === 'positive' ? 'success' : d.signal.level === 'caution' ? 'warning' : 'error'}>{t(K.signal[d.signal.level])}</Badge>}
        </div>
        <span className="t-sm">{r.code} · {t(`application.admin.role.${r.role}`)} · {d.applicant.city}</span>
        <span className="t-xs t-muted">{t(K.detail.summary.years)}: {d.applicant.years ? t(`application.field.year.${d.applicant.years}`) : '—'} · {t(K.detail.summary.languages)}: {d.applicant.languages.map((l) => ({ en: 'English', hi: 'हिन्दी', mr: 'मराठी' }[l])).join(', ')}</span>
        <a className="row gap-1 t-sm" style={{ alignItems: 'center', width: 'fit-content' }} href={`tel:${d.applicant.phone}`} data-call><Phone size={16} aria-hidden="true" /> {d.applicant.phone}</a>
      </div>

      <div style={{ overflowX: 'auto' }}><AscensionLine orientation="horizontal" steps={steps} /></div>

      <Card>
        <div className="stack gap-2" data-status-card>
          {phase === 'to_arrange' && <><p className="t-sm">{t(K.detail.toArrangeBody)}</p>{r.approvedAt && <span className="t-xs t-muted">{t(K.detail.approvedOn, { date: formatDate(r.approvedAt, lang) })}</span>}</>}
          {phase === 'invited' && <p className="t-sm">{t(K.detail.invitedBody, { date: i ? formatDate(i.invitedAt, lang) : '' })}</p>}
          {(phase === 'scheduled' || phase === 'move_requested' || phase === 'needs_outcome') && i?.slot && (
            <>
              <strong className="t-lg" data-slot>{whenLabel(i.slot.start, lang)}</strong>
              <span className="t-sm row gap-1" style={{ alignItems: 'center' }}>{MODE_ICON[i.slot.mode]} {t(K.mode[i.slot.mode])}</span>
              <p className="t-sm">{t(K.detail.how[i.slot.mode], { phone: d.applicant.phone, link: i.details.videoLink ?? '', place: i.details.place ?? '' })}</p>
              {phase === 'scheduled' && <p className="t-xs t-muted">{i.remindersSent.length > 0 ? t(K.detail.remindersSent, { count: i.remindersSent.length }) : t(K.detail.noReminders)}</p>}
              {phase === 'move_requested' && i.moveRequest && <p className="t-sm t-warning" data-move>{t(K.detail.moveBody, { reason: i.moveRequest.reason === 'availability' ? t(K.detail.moveReasonAvailability) : i.moveRequest.reason })}</p>}
              {phase === 'needs_outcome' && <p className="t-sm t-warning">{t(K.detail.needsOutcomeBody)}</p>}
            </>
          )}
          {phase === 'missed' && <p className="t-sm">{t(K.detail.missedBody, { count: r.misses })}{r.misses >= 2 ? ` ${t(K.detail.missedLimit)}` : ''}</p>}
          {phase === 'cancelled' && <p className="t-sm">{t(K.detail.cancelledBody)}</p>}
          {phase === 'skipped' && <p className="t-sm" data-skipped>{t(K.detail.skippedBody)}{i?.skipped ? ` “${i.skipped.reason}”` : ''}</p>}
          {phase === 'completed' && i?.completed && <CompletedBlock i={i} t={t} lang={lang} signal={d.signal} />}
          {(phase === 'invited' || phase === 'to_arrange' || phase === 'missed' || phase === 'cancelled') && d.slots.length === 0 && <p className="t-xs t-warning">{t(K.detail.noSlots)}</p>}
        </div>
      </Card>

      {i && i.addenda.length > 0 && (
        <div className="stack gap-2" data-addenda>
          <strong className="t-sm">{t(K.detail.addenda)}</strong>
          {i.addenda.map((a) => <p key={a.id} className="t-sm">“{a.text}”{a.concern ? ` · ${t(K.concern[a.concern.category])}: ${a.concern.text}` : ''} <span className="t-xs t-muted">— {a.byName}, {formatDate(a.at, lang)}</span></p>)}
        </div>
      )}

      {i && i.events.length > 0 && (
        <details data-timeline><summary className="t-sm t-muted" style={{ cursor: 'pointer' }}>{t(K.detail.timeline)}</summary>
          <div className="stack gap-1 mt-2">{[...i.events].reverse().map((e) => <p key={e.id} className="t-xs t-muted">{formatDateTime(e.at, lang)} · {t(K.detail.event[e.kind])}{e.note ? ` · ${e.note}` : ''}</p>)}</div>
        </details>
      )}

      <Footer spread>
        {(phase === 'to_arrange' || phase === 'missed' || phase === 'cancelled') && <Button style={{ flex: 1 }} data-invite disabled={s.busy} onClick={() => setMode('invite')}>{t(K.action.invite)}</Button>}
        {(phase === 'invited' || phase === 'to_arrange' || phase === 'missed' || phase === 'cancelled') && <Button variant="secondary" style={{ flex: 1 }} data-book onClick={() => setMode('book')}>{t(K.action.book)}</Button>}
        {phase === 'needs_outcome' && <Button style={{ flex: 1 }} data-held onClick={() => setMode('complete')}>{t(K.action.held)}</Button>}
        {phase === 'needs_outcome' && <Button variant="secondary" style={{ flex: 1 }} data-not-joined onClick={() => setMode('missed')}>{t(K.action.notJoined)}</Button>}
        {(phase === 'scheduled' || phase === 'move_requested') && slotPassed && <Button style={{ flex: 1 }} data-held onClick={() => setMode('complete')}>{t(K.action.held)}</Button>}
        {(phase === 'scheduled' || phase === 'move_requested') && slotPassed && <Button variant="secondary" style={{ flex: 1 }} data-not-joined onClick={() => setMode('missed')}>{t(K.action.notJoined)}</Button>}
        {(phase === 'scheduled' || phase === 'move_requested' || phase === 'needs_outcome') && <Button variant="secondary" style={{ flex: 1 }} data-reschedule onClick={() => setMode('book')}>{t(K.action.reschedule)}</Button>}
        {phase === 'scheduled' && <Button variant="secondary" style={{ flex: 1 }} data-ask-move onClick={() => setMode('move')}>{t(K.action.askMove)}</Button>}
        {phase === 'completed' && <Button style={{ flex: 1 }} data-add-note onClick={() => setMode('addendum')}>{t(K.action.addNote)}</Button>}
        {(phase === 'invited' || phase === 'scheduled' || phase === 'move_requested' || phase === 'missed') && <Button variant="ghost" data-cancel onClick={() => setMode('cancel')}>{t(K.action.cancel)}</Button>}
        <Button variant="ghost" data-open-verification onClick={() => s.goto(`/verification/${r.id}`)}>{t(K.action.verification)}</Button>
        {d.canSkip && <Button variant="ghost" data-skip onClick={() => setMode('skip')}>{t(K.action.skip)}</Button>}
      </Footer>
    </div>
  );
}

function CompletedBlock({ i, t, lang, signal }: { i: PartnerInterview; t: T; lang: string; signal: InterviewDetailView['signal'] }) {
  const c = i.completed as NonNullable<PartnerInterview['completed']>;
  return (
    <div className="stack gap-2" data-completed>
      <p className="t-xs t-muted">{t(K.detail.completedBody, { name: c.byName, date: formatDate(c.at, lang) })}</p>
      <div className="stack gap-1" aria-label={t(K.detail.ratings)}>
        {(['communication', 'reliability', 'experience'] as const).map((k) => <span key={k} className="t-sm" data-rating={k}>{t(K.detail.rating[k])}: <strong className={c.ratings[k] === 'concern' || c.ratings[k] === 'not_confirmed' ? 't-warning' : ''}>{t(K.detail.value[c.ratings[k]])}</strong></span>)}
      </div>
      <p className="t-sm">“{c.note}”</p>
      {signal.concerns.length > 0 && (
        <div className="stack gap-1" data-concerns>
          <strong className="t-sm">{t(K.detail.concernHeading)}</strong>
          {signal.concerns.map((x, n) => <p key={n} className="t-sm"><Badge tone="warning">{t(K.concern[x.category])}</Badge> {x.text}</p>)}
        </div>
      )}
      <p className="t-sm" data-outcome={c.outcome}><strong>{t(K.detail.outcome.label)}: {t(K.detail.outcome[c.outcome])}</strong>{c.outcomeReason ? ` — ${c.outcomeReason}` : ''}</p>
      <p className="t-xs t-muted">{t(K.detail.forOffer)}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ forms */

function ErrorLine({ code, t }: { code: string | null; t: T }) {
  return code ? <p className="t-xs t-error" role="alert" data-problem={code}>{t(problemKey(code))}</p> : null;
}

function InviteForm({ s, t, back }: { s: InterviewState; t: T; back: () => void }) {
  const [modes, setModes] = useState<InterviewMode[]>(['phone', 'video']);
  const [link, setLink] = useState('');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ok = modes.length > 0 && (!modes.includes('video') || /^https?:\/\/\S+\.\S+/.test(link.trim())) && (!modes.includes('in_person') || letters(place) >= 5);
  return (
    <>
      <div className="stack gap-3" data-form="invite">
        <p className="t-sm">{t(K.invite.body)}</p>
        <div className="stack gap-2" role="group" aria-label={t(K.invite.modes)}>
          <strong className="t-sm">{t(K.invite.modes)}</strong>
          <div className="row gap-2 wrap">{INTERVIEW_MODES.map((m) => <span key={m} data-mode={m}><Chip pressed={modes.includes(m)} onClick={() => setModes(toggle(modes, m))} icon={MODE_ICON[m]}>{t(K.mode[m])}</Chip></span>)}</div>
        </div>
        {modes.includes('video') && <Field label={t(K.invite.link)} hint={t(K.invite.linkHint)}>{(p) => <Input id={p.id} inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} data-f="link" />}</Field>}
        {modes.includes('in_person') && <Field label={t(K.invite.place)} hint={t(K.invite.placeHint)}>{(p) => <Input id={p.id} value={place} onChange={(e) => setPlace(e.target.value)} data-f="place" />}</Field>}
        <Field label={t(K.invite.note)}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        <ErrorLine code={error} t={t} />
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.action.back)}</Button><Button disabled={!ok || s.busy} data-confirm-invite onClick={async () => { const r = await s.invite({ modes, details: { ...(modes.includes('video') ? { videoLink: link } : {}), ...(modes.includes('in_person') ? { place } : {}) }, note }); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.action.send)}</Button></Footer>
    </>
  );
}

const toLocalInput = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

function BookForm({ s, d, t, lang, back }: { s: InterviewState; d: InterviewDetailView; t: T; lang: string; back: () => void }) {
  const i = d.interview;
  const moving = i?.status === 'scheduled';
  const [mode, setMode] = useState<InterviewMode>(i?.slot?.mode ?? i?.modes[0] ?? 'phone');
  const [when, setWhen] = useState('');
  const [reason, setReason] = useState('');
  const [link, setLink] = useState(i?.details.videoLink ?? '');
  const [place, setPlace] = useState(i?.details.place ?? '');
  const [error, setError] = useState<string | null>(null);
  const start = when ? new Date(when) : null;
  const valid = !!start && !Number.isNaN(start.getTime()) && start.getTime() > Date.now();
  const detailsOk = (mode !== 'video' || /^https?:\/\/\S+\.\S+/.test(link.trim())) && (mode !== 'in_person' || letters(place) >= 5);
  const ok = valid && detailsOk && (!moving || letters(reason) >= REASON_MIN);
  return (
    <>
      <div className="stack gap-3" data-form="book">
        <p className="t-sm">{t(K.book.body)}</p>
        <div className="stack gap-2" role="group" aria-label={t(K.book.mode)}>
          <strong className="t-sm">{t(K.book.mode)}</strong>
          <div className="row gap-2 wrap">{INTERVIEW_MODES.map((m) => <span key={m} data-mode={m}><Chip pressed={mode === m} onClick={() => setMode(m)} icon={MODE_ICON[m]}>{t(K.mode[m])}</Chip></span>)}</div>
        </div>
        {d.slots.length > 0 && (
          <div className="stack gap-2"><strong className="t-sm">{t(K.detail.nearest)}</strong>
            <div className="row gap-2 wrap">{d.slots.slice(0, 6).map((sl) => <span key={sl.start} data-slot={sl.start}><Chip pressed={start?.toISOString() === sl.start} onClick={() => setWhen(toLocalInput(sl.start))}>{whenLabel(sl.start, lang)}</Chip></span>)}</div>
          </div>
        )}
        <Field label={t(K.book.when)}>{(p) => <Input id={p.id} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} data-f="when" />}</Field>
        {mode === 'video' && <Field label={t(K.invite.link)}>{(p) => <Input id={p.id} inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} />}</Field>}
        {mode === 'in_person' && <Field label={t(K.invite.place)}>{(p) => <Input id={p.id} value={place} onChange={(e) => setPlace(e.target.value)} />}</Field>}
        {moving && <Field label={t(K.book.reason)} hint={t(K.book.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>}
        <ErrorLine code={error} t={t} />
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.action.back)}</Button><Button disabled={!ok || s.busy} data-confirm-book onClick={async () => { const r = await s.book({ start: (start as Date).toISOString(), mode, details: { ...(mode === 'video' ? { videoLink: link } : {}), ...(mode === 'in_person' ? { place } : {}) }, ...(moving ? { reason } : {}) }); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.action.confirm)}</Button></Footer>
    </>
  );
}

function ReasonForm({ s, t, back, kind }: { s: InterviewState; t: T; back: () => void; kind: 'move' | 'cancel' | 'skip' }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const copy = kind === 'move' ? { body: K.move.body, label: K.move.reason, hint: K.move.reasonHint } : kind === 'cancel' ? { body: K.cancelSheet.body, label: K.cancelSheet.reason, hint: K.move.reasonHint } : { body: K.skipSheet.body, label: K.skipSheet.reason, hint: K.move.reasonHint };
  const run = () => (kind === 'move' ? s.askMove(reason) : kind === 'cancel' ? s.cancel(reason) : s.skip(reason));
  return (
    <>
      <div className="stack gap-3" data-form={kind}>
        <p className="t-sm">{t(copy.body)}</p>
        <Field label={t(copy.label)} hint={t(copy.hint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
        <ErrorLine code={error} t={t} />
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.action.back)}</Button><Button variant={kind === 'cancel' ? 'danger' : 'primary'} disabled={letters(reason) < REASON_MIN || s.busy} data-confirm={kind} onClick={async () => { const r = await run(); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.action.confirm)}</Button></Footer>
    </>
  );
}

function MissedForm({ s, t, back }: { s: InterviewState; t: T; back: () => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <div className="stack gap-3" data-form="missed"><p className="t-sm">{t(K.missed.body)}</p><ErrorLine code={error} t={t} /></div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.action.back)}</Button><Button disabled={s.busy} data-confirm-missed onClick={async () => { const r = await s.notJoined(); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.action.confirm)}</Button></Footer>
    </>
  );
}

interface Draft {
  ratings: { communication?: 'clear' | 'ok' | 'concern'; reliability?: 'clear' | 'ok' | 'concern'; experience?: 'confirmed' | 'partly' | 'not_confirmed' };
  note: string;
  concernCategory: InterviewConcernCategory | '';
  concernText: string;
  outcome: (typeof OUTCOMES)[number] | '';
  outcomeReason: string;
}
const EMPTY_DRAFT: Draft = { ratings: {}, note: '', concernCategory: '', concernText: '', outcome: '', outcomeReason: '' };

function CompleteForm({ s, d, t, back }: { s: InterviewState; d: InterviewDetailView; t: T; back: () => void }) {
  const id = d.row.id;
  const [draft, setDraft] = useState<Draft>(() => { try { const raw = localStorage.getItem(draftKey(id)); return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Draft) } : EMPTY_DRAFT; } catch { return EMPTY_DRAFT; } });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { try { localStorage.setItem(draftKey(id), JSON.stringify(draft)); } catch { /* the draft is a convenience */ } }, [draft, id]);
  const input = { ratings: draft.ratings, note: draft.note, concern: { category: draft.concernCategory || undefined, text: draft.concernText }, outcome: draft.outcome || undefined, outcomeReason: draft.outcomeReason };
  const problem = completeProblem(input);
  const flagged = suggestedConcern(draft.ratings);
  const showConcern = !!flagged || !!draft.concernCategory || draft.concernText.length > 0;
  const set = (p: Partial<Draft>) => setDraft((cur) => ({ ...cur, ...p }));
  const rate = (k: keyof Draft['ratings'], v: string) => {
    const ratings = { ...draft.ratings, [k]: v } as Draft['ratings'];
    const sug = suggestedConcern(ratings);
    set({ ratings, ...(sug && !draft.concernCategory ? { concernCategory: sug } : {}) });
  };
  return (
    <>
      <div className="stack gap-4" data-form="complete">
        <p className="t-sm">{t(K.complete.body)}</p>
        <div className="stack gap-3" role="group" aria-label={t(K.complete.ratings)}>
          {(Object.keys(RATING_OPTIONS) as (keyof typeof RATING_OPTIONS)[]).map((k) => (
            <div key={k} className="stack gap-1" data-rating-group={k}>
              <strong className="t-sm">{t(K.detail.rating[k])}</strong>
              <div className="row gap-2 wrap">{RATING_OPTIONS[k].map((v) => <span key={v} data-rate={v}><Chip pressed={draft.ratings[k] === v} onClick={() => rate(k, v)}>{t(K.detail.value[v])}</Chip></span>)}</div>
            </div>
          ))}
        </div>
        <Field label={t(K.complete.note)} hint={t(K.complete.noteHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={4} value={draft.note} onChange={(e) => set({ note: e.target.value })} data-f="note" />}</Field>
        {showConcern ? (
          <div className="stack gap-2" data-concern-block>
            <strong className="t-sm">{t(K.complete.concernCategory)}</strong>
            <div className="row gap-2 wrap">{CONCERN_CATEGORIES.map((c) => <span key={c} data-concern-cat={c}><Chip pressed={draft.concernCategory === c} onClick={() => set({ concernCategory: c })}>{t(K.concern[c])}</Chip></span>)}</div>
            <Field label={t(K.complete.concernText)} hint={t(K.complete.concernHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={draft.concernText} onChange={(e) => set({ concernText: e.target.value })} data-f="concern" />}</Field>
          </div>
        ) : <Button variant="ghost" size="sm" style={{ width: 'fit-content' }} icon={<Plus size={14} />} data-concern-add onClick={() => set({ concernCategory: 'other' })}>{t(K.complete.concernAdd)}</Button>}
        <div className="stack gap-2" role="group" aria-label={t(K.complete.outcome)}>
          <strong className="t-sm">{t(K.complete.outcome)}</strong>
          <div className="row gap-2 wrap">{OUTCOMES.map((o) => <span key={o} data-outcome-pick={o}><Chip pressed={draft.outcome === o} onClick={() => set({ outcome: o })}>{t(K.detail.outcome[o])}</Chip></span>)}</div>
        </div>
        {draft.outcome && draft.outcome !== 'recommend' && <Field label={t(K.complete.reason)} hint={t(K.complete.reasonHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={draft.outcomeReason} onChange={(e) => set({ outcomeReason: e.target.value })} data-f="outcome-reason" />}</Field>}
        <p className="t-xs t-muted">{t(K.complete.draft)}</p>
        <ErrorLine code={error ?? (problem && (draft.note || draft.outcome) ? problem : null)} t={t} />
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.action.back)}</Button><Button disabled={!!problem || s.busy} data-confirm-complete onClick={async () => { const r = await s.complete(input); if (!r.ok) setError(r.code ?? 'generic'); else { try { localStorage.removeItem(draftKey(id)); } catch { /* nothing to clear */ } back(); } }}>{t(K.action.save)}</Button></Footer>
    </>
  );
}

function AddendumForm({ s, t, back }: { s: InterviewState; t: T; back: () => void }) {
  const [text, setText] = useState('');
  const [withConcern, setWithConcern] = useState(false);
  const [category, setCategory] = useState<InterviewConcernCategory>('other');
  const [concern, setConcern] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ok = letters(text) >= NOTE_MIN && (!withConcern || letters(concern) >= NOTE_MIN);
  return (
    <>
      <div className="stack gap-3" data-form="addendum">
        <p className="t-sm">{t(K.addendum.body)}</p>
        <Field label={t(K.addendum.text)} hint={t(K.complete.noteHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={text} onChange={(e) => setText(e.target.value)} data-f="text" />}</Field>
        <Toggle checked={withConcern} onChange={setWithConcern} label={t(K.addendum.concern)} />
        {withConcern && (
          <div className="stack gap-2">
            <div className="row gap-2 wrap">{CONCERN_CATEGORIES.map((c) => <span key={c} data-concern-cat={c}><Chip pressed={category === c} onClick={() => setCategory(c)}>{t(K.concern[c])}</Chip></span>)}</div>
            <Field label={t(K.complete.concernText)} hint={t(K.complete.concernHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={concern} onChange={(e) => setConcern(e.target.value)} data-f="concern" />}</Field>
          </div>
        )}
        <ErrorLine code={error} t={t} />
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.action.back)}</Button><Button disabled={!ok || s.busy} data-confirm-addendum onClick={async () => { const r = await s.addAddendum({ text, ...(withConcern ? { concern: { category, text: concern } } : {}) }); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.action.save)}</Button></Footer>
    </>
  );
}

/* ------------------------------------------------------------------ availability */

function AvailabilitySheet({ s, t, lang, open, onClose, initial, openSlots }: { s: InterviewState; t: T; lang: string; open: boolean; onClose: () => void; initial: InterviewAvailability; openSlots: number }) {
  const [draft, setDraft] = useState<InterviewAvailability>(initial);
  const [closedInput, setClosedInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InterviewSaveResult | null>(null);
  useEffect(() => { if (open) { setDraft(initial); setResult(null); setError(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const setDay = (day: number, win: { from: string; to: string } | null) => setDraft({ ...draft, weekly: { ...draft.weekly, [day]: win } });
  return (
    <Sheet open={open} onClose={onClose} title={t(K.avail.heading)} closeLabel={t('action.close')}>
      <div className="stack gap-4" data-availability>
        <p className="t-sm">{t(K.avail.body)}</p>
        <p className="t-xs t-muted" data-placeholder>{t(K.avail.placeholder)}</p>
        <div className="stack gap-2">
          {WEEKDAYS.map((day) => {
            const win = draft.weekly[day];
            return (
              <div key={day} className="row gap-2" data-day={day} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ minWidth: 96 }}><Toggle checked={!!win} onChange={(on) => setDay(day, on ? { from: '10:00', to: '13:00' } : null)} label={t(K.avail.day[day])} /></span>
                {win ? (
                  <>
                    <Select aria-label={t(K.avail.from)} style={{ width: 'auto' }} value={win.from} onChange={(e) => setDay(day, { ...win, from: e.target.value })}>{WINDOW_CHOICES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
                    <span aria-hidden="true">–</span>
                    <Select aria-label={t(K.avail.to)} style={{ width: 'auto' }} value={win.to} onChange={(e) => setDay(day, { ...win, to: e.target.value })}>{WINDOW_CHOICES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
                  </>
                ) : <span className="t-xs t-muted">{t(K.avail.off)}</span>}
              </div>
            );
          })}
        </div>
        <div className="grid-auto" style={{ '--min': '140px' } as React.CSSProperties}>
          <Field label={t(K.avail.slot)}>{(p) => <Select id={p.id} value={draft.slotMinutes} onChange={(e) => setDraft({ ...draft, slotMinutes: Number(e.target.value) })}>{SLOT_LENGTHS.map((n) => <option key={n} value={n}>{t(K.avail.slotUnit, { count: n })}</option>)}</Select>}</Field>
          <Field label={t(K.avail.buffer)}>{(p) => <Select id={p.id} value={draft.bufferMinutes} onChange={(e) => setDraft({ ...draft, bufferMinutes: Number(e.target.value) })}>{BUFFERS.map((n) => <option key={n} value={n}>{t(K.avail.slotUnit, { count: n })}</option>)}</Select>}</Field>
          <Field label={t(K.avail.lead)}>{(p) => <Select id={p.id} value={draft.leadHours} onChange={(e) => setDraft({ ...draft, leadHours: Number(e.target.value) })}>{LEADS.map((n) => <option key={n} value={n}>{t(K.avail.leadUnit, { count: n })}</option>)}</Select>}</Field>
          <Field label={t(K.avail.horizon)}>{(p) => <Select id={p.id} value={draft.horizonDays} onChange={(e) => setDraft({ ...draft, horizonDays: Number(e.target.value) })}>{HORIZONS.map((n) => <option key={n} value={n}>{t(K.avail.horizonUnit, { count: n })}</option>)}</Select>}</Field>
        </div>
        <div className="stack gap-2">
          <strong className="t-sm">{t(K.avail.closed)}</strong>
          <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
            <Field label={t(K.avail.closedHint)}>{(p) => <Input id={p.id} type="date" value={closedInput} onChange={(e) => setClosedInput(e.target.value)} data-f="closed" />}</Field>
            <Button variant="secondary" disabled={!closedInput || draft.closedDates.includes(closedInput)} data-closed-add onClick={() => { setDraft({ ...draft, closedDates: [...draft.closedDates, closedInput].sort() }); setClosedInput(''); }}>{t(K.avail.closedAdd)}</Button>
          </div>
          {draft.closedDates.length === 0 ? <p className="t-xs t-muted">{t(K.avail.closedNone)}</p> : <div className="row gap-2 wrap">{draft.closedDates.map((c) => <span key={c} data-closed={c}><Chip pressed onClick={() => setDraft({ ...draft, closedDates: draft.closedDates.filter((x) => x !== c) })} icon={<X size={12} aria-hidden="true" />}>{formatDate(c, lang)}</Chip></span>)}</div>}
        </div>
        <p className="t-xs t-muted">{initial.updatedAt ? t(K.avail.updated, { name: initial.updatedByName ?? '', date: formatDate(initial.updatedAt, lang) }) : t(K.avail.neverChanged)} · {t(K.admin.availability.openSlots, { count: openSlots })}</p>
        <ErrorLine code={error} t={t} />
        {result && result.conflicts.length > 0 && (
          <Card>
            <div className="stack gap-2" data-conflicts role="alert">
              <strong className="t-sm">{t(K.avail.conflictsHeading, { count: result.conflicts.length })}</strong>
              <p className="t-sm">{t(K.avail.conflictsBody)}</p>
              <ul className="stack gap-1" style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>{result.conflicts.map((c) => <li key={c.id} className="t-sm">{c.name} · {whenLabel(c.start, lang)}</li>)}</ul>
              <div className="row gap-2 wrap">
                <Button data-ask-all disabled={s.busy} onClick={async () => { const r = await s.askConflicted(result.conflicts.map((c) => c.id)); if (r.ok) setResult(null); else setError(r.code ?? 'generic'); }}>{t(K.avail.askAll)}</Button>
                <Button variant="secondary" data-keep-all disabled={s.busy} onClick={async () => { const r = await s.keepConflicted(result.conflicts.map((c) => c.id)); if (r.ok) setResult(null); else setError(r.code ?? 'generic'); }}>{t(K.avail.keepAll)}</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
      <Footer><Button variant="ghost" onClick={onClose}>{t('action.close')}</Button><Button disabled={s.busy} data-save-availability onClick={async () => { const r = await s.saveAvailability(draft); if (!r.ok) return setError(r.code); setError(null); setResult(r.result); if (r.result.conflicts.length === 0) onClose(); }}>{t(K.avail.save)}</Button></Footer>
    </Sheet>
  );
}

/* ================================================================== Applicant */

function Applicant({ s, v, t }: { s: InterviewState; v: InterviewApplicantView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const first = v.name.split(' ')[0];
  const link = v.applicationId ? `${applyPath(v.applicationId)}?k=${(() => { try { return localStorage.getItem(keyKey(v.applicationId)) ?? ''; } catch { return ''; } })()}` : '/join';
  const [changing, setChanging] = useState(false);
  useEffect(() => { if (v.phase !== 'scheduled') setChanging(false); }, [v.phase]);
  const picking = v.canSelfServe && (v.phase !== 'scheduled' || changing);

  return (
    <div className="ds-screen ds-screen--narrow pb-action-bar">
      <PublicHeader s={s} t={t} />
      <ScreenHeader title={t(K.applicant.heading)} subtitle={t(K.applicant.hello, { name: first })} />
      {v.moveRequest && (
        <Card className="mb-3">
          <div className="stack gap-1" data-move-banner style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
            <p className="t-sm">{v.moveRequest.reason === 'availability' ? t(K.applicant.moveBannerAvailability) : t(K.applicant.moveBanner)}</p>
            {v.moveRequest.reason !== 'availability' && <p className="t-sm">“{v.moveRequest.reason}”</p>}
            {v.slot && <p className="t-sm">{t(K.applicant.moveReason, { when: whenLabel(v.slot.start, lang) })}</p>}
          </div>
        </Card>
      )}
      {v.phase === 'missed' && <p className="t-sm mb-3" data-missed>{v.canSelfServe ? t(K.applicant.missedBanner) : t(K.applicant.missedLimit)}</p>}

      {picking ? <Picker s={s} v={v} t={t} lang={lang} onDone={() => setChanging(false)} /> : v.slot ? <Confirmed s={s} v={v} t={t} lang={lang} onChange={() => setChanging(true)} /> : (
        <Card><div className="stack gap-2" data-status={v.phase}><strong className="t-md">{v.phase === 'completed' ? t(K.applicant.thanksHeading) : t(K.applicant.chooseHeading)}</strong><p className="t-sm">{v.phase === 'completed' ? t(K.applicant.thanksBody) : v.phase === 'skipped' ? t(K.applicant.skippedBody) : t(K.applicant.waitingBody)}</p></div></Card>
      )}
      <Button variant="ghost" style={{ width: 'fit-content' }} className="mt-3" data-back-application onClick={() => s.goto(link)}>{t(K.applicant.backToApplication)}</Button>
    </div>
  );
}

function Confirmed({ s, v, t, lang, onChange }: { s: InterviewState; v: InterviewApplicantView; t: T; lang: string; onChange: () => void }) {
  const slot = v.slot as NonNullable<typeof v.slot>;
  const download = () => {
    if (!v.calendarFile) return;
    const url = URL.createObjectURL(new Blob([v.calendarFile], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aiec-interview.ics';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card>
      <div className="stack gap-3" data-confirmed>
        <div className="row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={26} weight="fill" aria-hidden="true" color="var(--color-success)" /><strong className="t-md">{t(K.applicant.confirmedHeading)}</strong></div>
        <div className="stack gap-1">
          <strong className="t-lg" data-when>{dayLabel(slot.start, lang, true)}</strong>
          <span className="t-md">{timeLabel(slot.start, lang)} – {timeLabel(slot.end, lang)}</span>
          <span className="row gap-1 t-sm" style={{ alignItems: 'center' }}>{MODE_ICON[slot.mode]} {t(K.applicant.mode[slot.mode])}</span>
        </div>
        <p className="t-sm" data-how>{slot.mode === 'phone' ? t(K.applicant.howPhone, { phone: v.phone }) : slot.mode === 'video' ? t(K.applicant.howVideo) : t(K.applicant.howInPerson, { place: v.details.place ?? '' })}</p>
        {slot.mode === 'video' && v.details.videoLink && <a className="ds-btn ds-btn--secondary" style={{ width: 'fit-content' }} href={v.details.videoLink} target="_blank" rel="noreferrer" data-join>{t(K.applicant.join)}</a>}
        <p className="t-xs t-muted">{t(K.applicant.reminderNote)}</p>
        <div className="row gap-2 wrap">
          <Button variant="secondary" data-ics onClick={download}>{t(K.applicant.addCalendar)}</Button>
          {v.canSelfServe ? <Button data-change onClick={onChange}>{t(K.applicant.change)}</Button> : <span className="t-xs t-muted" data-too-late>{t(K.applicant.tooLate)}</span>}
        </div>
        {s.busy && <span className="sr-only">{t(K.applicant.confirming)}</span>}
      </div>
    </Card>
  );
}

function Picker({ s, v, t, lang, onDone }: { s: InterviewState; v: InterviewApplicantView; t: T; lang: string; onDone: () => void }) {
  const [mode, setMode] = useState<InterviewMode | ''>(v.modes.length === 1 ? v.modes[0] : v.slot?.mode ?? '');
  const days = useMemo(() => { const m = new Map<string, typeof v.slots>(); for (const sl of v.slots) m.set(sl.date, [...(m.get(sl.date) ?? []), sl]); return [...m.entries()]; }, [v.slots]);
  const [day, setDay] = useState<string>('');
  const [slot, setSlot] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!days.some(([d]) => d === day)) setDay(days[0]?.[0] ?? ''); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (slot && !v.slots.some((x) => x.start === slot)) setSlot(''); }, [v.slots, slot]);
  const times = days.find(([d]) => d === day)?.[1] ?? [];
  const heading = v.phase === 'scheduled' ? K.applicant.changeHeading : K.applicant.chooseHeading;
  const go = async () => {
    if (!slot || !mode) return;
    const r = await s.choose(slot, mode);
    if (r.ok) { setError(null); onDone(); } else { setError(r.code ?? 'generic'); if (r.code === 'slot_taken') setSlot(''); }
  };
  return (
    <>
      <Card>
        <div className="stack gap-4" data-picker>
          <div className="stack gap-1"><strong className="t-md">{t(heading)}</strong><p className="t-sm">{t(K.applicant.chooseBody)}</p></div>
          {v.slots.length === 0 ? <EmptyState icon={<Clock size={28} />} title={t(K.applicant.noSlotsTitle)} body={t(K.applicant.noSlotsBody)} /> : (
            <>
              {v.modes.length > 1 && (
                <div className="stack gap-2" role="group" aria-label={t(K.applicant.modeHeading)}>
                  <strong className="t-sm">{t(K.applicant.modeHeading)}</strong>
                  <div className="row gap-2 wrap">{v.modes.map((m) => <span key={m} data-mode={m}><Chip pressed={mode === m} onClick={() => setMode(m)} icon={MODE_ICON[m]}>{t(K.applicant.mode[m])}</Chip></span>)}</div>
                </div>
              )}
              <div className="stack gap-2" role="group" aria-label={t(K.applicant.dayHeading)}>
                <strong className="t-sm">{t(K.applicant.dayHeading)}</strong>
                <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }}>{days.map(([d, list]) => <span key={d} className="shrink-0" data-day={d}><Chip pressed={day === d} onClick={() => { setDay(d); setSlot(''); }}>{dayLabel(list[0].start, lang)}</Chip></span>)}</div>
              </div>
              <div className="stack gap-2" role="group" aria-label={t(K.applicant.timeHeading)}>
                <strong className="t-sm">{t(K.applicant.timeHeading)} · {t(K.applicant.slotsCount, { count: times.length })}</strong>
                <div className="grid-auto" style={{ '--min': '104px' } as React.CSSProperties}>
                  {times.map((sl) => <span key={sl.start} data-time={sl.start}><Button variant={slot === sl.start ? 'primary' : 'secondary'} style={{ width: '100%', minHeight: 48, whiteSpace: 'nowrap' }} aria-pressed={slot === sl.start} onClick={() => setSlot(sl.start)}>{timeLabel(sl.start, lang)}</Button></span>)}
                </div>
              </div>
            </>
          )}
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{error === 'slot_taken' ? t(K.applicant.takenSlot) : t(problemKey(error))}</p>}
        </div>
      </Card>
      {v.slots.length > 0 && (
        <ActionBar>
          <Button style={{ width: '100%' }} data-confirm-slot disabled={!slot || !mode || s.busy} onClick={() => void go()}>{slot ? t(K.applicant.confirm, { when: whenLabel(slot, lang) }) : t(K.applicant.pickDay)}</Button>
        </ActionBar>
      )}
    </>
  );
}

