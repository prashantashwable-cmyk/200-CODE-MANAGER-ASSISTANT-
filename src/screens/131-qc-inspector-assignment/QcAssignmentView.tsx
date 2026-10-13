import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CalendarCheck, CheckCircle, Circle, ClipboardText, Flag, Plus, ShieldCheck, Trash, UserCheck, WarningCircle, X } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Avatar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, ListRow, LoadingState, Screen, ScreenHeader, Select, Sheet, StatTile, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { QcBoardRow, QcBoardView, QcBriefingView, QcCandidateView, QcJobDetail } from '@/data/repository';
import type { InspectorUnavailability, QcWindow } from '@/data/types';
import { useQcAssignment } from './useQcAssignment';
import type { ActionResult, QcState } from './useQcAssignment';
import { EXCEPTION_MIN, QC_KEYS as K, REASON_MIN, WINDOW_IDS, boardPath, detailPath, homePath, jobPath } from './qc-assignment.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATUS_TONE: Record<string, BadgeTone> = { assigned: 'warning', scheduled: 'accent', in_progress: 'accent', completed: 'success', cancelled: 'neutral' };
const skillLabel = (t: T, id: string) => t(`qcAssignment.inspector.skill.${id}`, { defaultValue: id });

/**
 * Screen 131 — QC Inspector Assignment. A finished installation is checked by someone independent of the people who did it, so a job is
 * assigned an inspector only once its checklists are really complete, only from people who hold the right skill tags and took no part in
 * the installation, at a time the customer agreed that no double booking can defeat. Where nobody qualified and independent exists yet,
 * Admin can do the check themself as a documented exception. The inspector starts with all the evidence already on file.
 */
export function QcAssignmentScreen() {
  const { t } = useTranslation();
  const s = useQcAssignment();

  if (s.status === 'loading' && !s.detail && !s.board) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(s.jobId ? K.title : K.boardTitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'not_found') {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(s.isAdmin ? boardPath : homePath)} />
      </Screen>
    );
  }
  if (s.status === 'error' || (s.jobId ? !s.detail : !s.board)) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }
  if (!s.jobId && s.board) return <Board s={s} b={s.board} t={t} />;
  return <JobScreen s={s} d={s.detail!} t={t} />;
}

/* ---------------------------------------------------------------- shared */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="stack gap-3" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 'var(--space-3)' }}>
      <div className="stack gap-1">
        <h3 className="t-sm t-semibold">{title}</h3>
        {hint && <p className="t-xs t-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function useSubmit(onClose: () => void, t: T) {
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<ActionResult>) => {
    const r = await fn();
    if (r.ok) {
      setError(null);
      onClose();
    } else setError(t(errorKey(r.code)));
    return r;
  };
  return { error, run, setError };
}

const slotLabel = (t: T, date: string, window: QcWindow, lang: string) => `${formatDate(`${date}T12:00:00`, lang)} · ${t(K.window[window])}`;

/* ---------------------------------------------------------------- board */

function Board({ s, b, t }: { s: QcState; b: QcBoardView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [offFor, setOffFor] = useState<string | null>(null);
  const admin = b.viewer === 'admin';
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.boardTitle)} subtitle={t(admin ? K.board.subtitle : K.board.mineBody)} />
      {admin && (
        <div className="grid-auto mb-4" style={{ ['--min' as string]: '140px' }}>
          <Card><StatTile label={t(K.board.ready)} value={b.totals.ready} /></Card>
          <Card><StatTile label={t(K.board.unassigned)} value={b.totals.unassigned} /></Card>
          <Card><StatTile label={t(K.board.scheduled)} value={b.totals.scheduled} /></Card>
          <Card><StatTile label={t(K.board.conflicts)} value={b.totals.conflicts} /></Card>
        </div>
      )}
      <div className="main-aside">
        <div className="stack gap-4">
          <Section title={t(admin ? K.board.heading : K.board.mine)}>
            {b.rows.length === 0 ? (
              <EmptyState icon={<ClipboardText size={28} />} title={t(admin ? K.empty.title : K.emptyMine.title)} body={t(admin ? K.empty.body : K.emptyMine.body)} />
            ) : (
              <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
                {b.rows.map((r) => (
                  <BoardCard key={r.jobId} r={r} t={t} lang={lang} onOpen={() => s.goto(detailPath(r.jobId))} />
                ))}
              </div>
            )}
          </Section>
        </div>
        {admin && (
          <div className="stack gap-4">
            <Section title={t(K.board.inspectors)} hint={t(K.board.inspectorsNote)}>
              <Card flush>
                {b.inspectors.map((i) => (
                  <ListRow
                    key={i.userId}
                    leading={<Avatar name={i.name} size="sm" />}
                    title={i.name}
                    subtitle={`${t(K.board.week, { count: i.qcThisWeek })}${i.unavailable.length ? ` · ${i.unavailable.map((u) => `${t(K.board.off)} ${formatDate(`${u.date}T12:00:00`, lang)}${u.window === 'all' ? '' : ` (${t(K.window[u.window])})`}`).join(', ')}` : ''}`}
                    trailing={<Button size="sm" variant="ghost" onClick={() => setOffFor(i.userId)}>{t(K.board.addOff)}</Button>}
                  />
                ))}
              </Card>
            </Section>
          </div>
        )}
      </div>
      <Sheet open={!!offFor} onClose={() => setOffFor(null)} title={t(K.mine.off)} closeLabel={t('action.close')}>
        {offFor && <OffSheet s={s} userId={offFor} t={t} onClose={() => setOffFor(null)} />}
      </Sheet>
    </Screen>
  );
}

function BoardCard({ r, t, lang, onOpen }: { r: QcBoardRow; t: T; lang: string; onOpen: () => void }) {
  return (
    <Card>
      <div className="stack gap-2" data-job={r.jobId}>
        <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="stack gap-1">
            <strong className="t-sm">{r.siteName}</strong>
            <span className="t-xs t-muted">{r.code}</span>
          </div>
          <Badge tone={r.ready ? 'accent' : 'neutral'} dot>{t(K.jobStatus[r.jobStatus])}</Badge>
        </div>
        {r.ready && !r.assignment && <p className="t-sm">{t(K.board.noInspector)}{r.waitingHours !== null ? ` · ${t(K.board.waiting, { hours: r.waitingHours })}` : ''}</p>}
        {r.assignment && (
          <p className="t-sm row gap-2 wrap" style={{ alignItems: 'center' }}>
            <span>{r.assignment.inspectorName}</span>
            <Badge tone={STATUS_TONE[r.assignment.status] ?? 'neutral'}>{t(K.status[r.assignment.status])}</Badge>
            {r.assignment.mode === 'admin_exception' && <Badge tone="warning">{t(K.board.exceptionTag)}</Badge>}
            {r.assignment.conflict && <Badge tone="error">{t(K.board.conflictTag)}</Badge>}
          </p>
        )}
        {r.assignment?.scheduledDate && r.assignment.window && <p className="t-xs t-muted">{slotLabel(t, r.assignment.scheduledDate, r.assignment.window, lang)}</p>}
        {!r.ready && !r.assignment && r.problems.length > 0 && <p className="t-xs t-muted">{r.problems.map((p) => t(K.board.problems[p])).join(' · ')}</p>}
        {r.preference && !r.assignment?.scheduledDate && <Badge tone="neutral">{t(K.board.prefTag)}</Badge>}
        <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={onOpen}>{t(K.board.open)}</Button>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- one job */

function JobScreen({ s, d, t }: { s: QcState; d: QcJobDetail; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [sheet, setSheet] = useState<null | 'reassign' | 'clear' | 'report' | 'off'>(null);
  const a = d.assignment;
  const admin = s.isAdmin;
  const inspectorView = d.viewer === 'inspector';
  const openConflict = a?.conflict ?? null;

  const events: AscensionStep[] = (a?.events ?? []).map((e) => ({ id: e.id, label: t(K.assigned.event[e.kind]), meta: `${formatDateTime(e.at, lang)} · ${t(K.assigned.by, { name: e.byName })}${e.note ? ` · ${e.note}` : ''}`, status: 'complete' as const }));

  return (
    <Screen width="default" className={admin && (d.canAssign || d.canSchedule) ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${d.job.siteName} · ${d.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={() => s.goto(admin ? boardPath : boardPath)} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />
      <div className="row gap-2 wrap mb-3" style={{ alignItems: 'center' }}>
        <Badge tone={d.readiness.ready ? 'accent' : 'neutral'} dot>{t(K.jobStatus[d.job.status])}</Badge>
        {a && <Badge tone={STATUS_TONE[a.status] ?? 'neutral'}>{t(K.status[a.status])}</Badge>}
        {a?.mode === 'admin_exception' && <Badge tone="warning">{t(K.board.exceptionTag)}</Badge>}
      </div>
      {s.restored && admin && <p className="t-xs t-muted mb-3" role="status">{t(K.sync.draftRestored)}</p>}

      {openConflict && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-warning)' }}>
          <div className="stack gap-2" role="alert" data-conflict>
            <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}><WarningCircle size={18} color="var(--color-warning)" aria-hidden="true" /> {t(K.conflict.heading)}</strong>
            <p className="t-sm">{t(openConflict.kind === 'self_reported' ? K.conflict.self : K.conflict.installation, { name: a?.inspectorName ?? '', what: openConflict.involvement.map((i) => t(K.inspector.involvement[i as keyof typeof K.inspector.involvement])).join(', ') })}</p>
            {openConflict.note && <p className="t-xs t-muted">{openConflict.note}</p>}
            {admin ? (
              <>
                <p className="t-xs">{t(K.conflict.body)}</p>
                <div className="row gap-2 wrap">
                  <Button size="sm" variant="secondary" onClick={() => setSheet('reassign')}>{t(K.assigned.reassign)}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSheet('clear')} data-open="clear">{t(K.conflict.clear)}</Button>
                </div>
              </>
            ) : (
              <p className="t-xs">{t(K.conflict.told)}</p>
            )}
          </div>
        </Card>
      )}

      <div className="stack gap-4">
        <ReadinessSection d={d} t={t} />

        {admin && d.readiness.ready && (
          <PreferenceSection s={s} d={d} t={t} lang={lang} />
        )}
        {!admin && d.preference && (
          <Section title={t(K.pref.heading)}>
            <p className="t-sm">{d.preference.dates.map((x) => formatDate(`${x}T12:00:00`, lang)).join(', ')} · {t(K.window[d.preference.window])}</p>
            {d.preference.note && <p className="t-xs t-muted">{d.preference.note}</p>}
          </Section>
        )}

        {a ? (
          <Section title={t(K.assigned.heading)}>
            <Card>
              <div className="stack gap-2" data-assignment>
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <Avatar name={a.inspectorName} size="md" />
                  <div className="stack gap-1">
                    <strong className="t-sm">{a.inspectorName}</strong>
                    <span className="t-xs t-muted">{t(K.assigned.assignedBy, { name: a.assignedByName, when: formatDateTime(a.assignedAt, lang) })}</span>
                  </div>
                </div>
                {a.mode === 'admin_exception' && (
                  <div className="stack gap-1">
                    <p className="t-sm">{t(a.exceptionGaps.includes('admin_role') ? K.assigned.exceptionAdmin : K.assigned.exception, { gaps: a.exceptionGaps.map((g) => skillLabel(t, g)).join(', ') })}</p>
                    {a.exceptionNote && <p className="t-xs t-muted">{t(K.assigned.exceptionNote)}: {a.exceptionNote}</p>}
                  </div>
                )}
                {a.notifiedAt && <p className="t-xs t-muted">{t(K.assigned.notified, { when: formatDateTime(a.notifiedAt, lang) })}</p>}
                {a.previous.length > 0 && <p className="t-xs t-muted">{a.previous.map((p) => t(K.assigned.previous, { name: p.inspectorName, reason: p.reason })).join(' · ')}</p>}
                {(admin || inspectorView) && (a.status === 'assigned' || a.status === 'scheduled' || a.status === 'in_progress') && d.readiness.ready && (
                  <div className="row gap-2 wrap">
                    <Button size="sm" variant="secondary" icon={<ClipboardText size={16} aria-hidden="true" />} onClick={() => s.goto(`/qc-mechanical/${d.job.id}`)} data-open="mechanical">{t('qcMech.title')}</Button>
                    <Button size="sm" variant="secondary" icon={<ClipboardText size={16} aria-hidden="true" />} onClick={() => s.goto(`/qc-electrical/${d.job.id}`)} data-open="electrical">{t('qcElec.title')}</Button>
                    <Button size="sm" variant="secondary" icon={<ClipboardText size={16} aria-hidden="true" />} onClick={() => s.goto(`/compliance/${d.job.id}`)} data-open="compliance">{t('compliance.title')}</Button>
                    <Button size="sm" variant="secondary" icon={<ClipboardText size={16} aria-hidden="true" />} onClick={() => s.goto(`/snags/${d.job.id}`)} data-open="snags">{t('snagList.title')}</Button>
                    <Button size="sm" variant="secondary" icon={<ClipboardText size={16} aria-hidden="true" />} onClick={() => s.goto(`/handover-checklist/${d.job.id}`)} data-open="handover">{t('handover.title')}</Button>
                  </div>
                )}
                {admin && (a.status === 'assigned' || a.status === 'scheduled') && (
                  <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => setSheet('reassign')} data-open="reassign">{t(K.assigned.reassign)}</Button>
                )}
                {inspectorView && (a.status === 'assigned' || a.status === 'scheduled') && !openConflict && (
                  <Button size="sm" variant="ghost" icon={<Flag size={16} aria-hidden="true" />} style={{ width: 'fit-content' }} onClick={() => setSheet('report')} data-open="report">{t(K.conflict.report)}</Button>
                )}
              </div>
            </Card>
          </Section>
        ) : (
          admin && d.canAssign && <InspectorSection s={s} d={d} t={t} lang={lang} />
        )}

        {a && (
          <Section title={t(K.visit.heading)} hint={admin && d.canSchedule ? t(K.visit.intro) : undefined}>
            {a.scheduledDate && a.window ? (
              <p className="t-sm row gap-2" style={{ alignItems: 'center' }} data-visit>
                <CalendarCheck size={18} aria-hidden="true" /> {t(K.visit.scheduled, { when: slotLabel(t, a.scheduledDate, a.window, lang) })}
              </p>
            ) : (
              <p className="t-sm t-muted">{t(K.visit.notScheduled)}</p>
            )}
            {admin && d.canSchedule && <VisitSection s={s} d={d} t={t} lang={lang} />}
          </Section>
        )}

        {inspectorView && <MySection s={s} d={d} t={t} lang={lang} onAdd={() => setSheet('off')} />}

        {events.length > 0 && (
          <Section title={t(K.assigned.history)}>
            <Card><AscensionLine steps={events} className="ds-ascension--multiline" /></Card>
          </Section>
        )}

        {d.briefing && <Briefing b={d.briefing} t={t} lang={lang} />}
      </div>

      {admin && (d.canAssign || d.canSchedule) && (
        <ActionBar>
          <PrimaryAction s={s} d={d} t={t} />
        </ActionBar>
      )}

      <Sheet open={sheet === 'reassign'} onClose={() => setSheet(null)} title={t(K.assigned.reassignTitle)} closeLabel={t('action.close')}>
        <ReassignSheet s={s} d={d} t={t} onClose={() => setSheet(null)} />
      </Sheet>
      <Sheet open={sheet === 'clear'} onClose={() => setSheet(null)} title={t(K.conflict.clearTitle)} closeLabel={t('action.close')}>
        <NoteSheet body={t(K.conflict.clearBody)} label={t(K.conflict.clearNote)} min={EXCEPTION_MIN} go={t(K.conflict.clearGo)} t={t} onClose={() => setSheet(null)} onSubmit={(x) => s.clearConflict(x)} />
      </Sheet>
      <Sheet open={sheet === 'report'} onClose={() => setSheet(null)} title={t(K.conflict.reportTitle)} closeLabel={t('action.close')}>
        <NoteSheet body={t(K.conflict.reportBody)} label={t(K.conflict.reportNote)} min={REASON_MIN} go={t(K.conflict.reportGo)} t={t} onClose={() => setSheet(null)} onSubmit={(x) => s.reportConflict(x)} />
      </Sheet>
      <Sheet open={sheet === 'off'} onClose={() => setSheet(null)} title={t(K.mine.off)} closeLabel={t('action.close')}>
        <OffSheet s={s} userId={s.userId} t={t} onClose={() => setSheet(null)} />
      </Sheet>
    </Screen>
  );
}

function PrimaryAction({ s, d, t }: { s: QcState; d: QcJobDetail; t: T }) {
  const [error, setError] = useState<string | null>(null);
  const missing = d.canAssign ? (!s.selected ? t(K.inspector.pick) : s.onlyMissingSkill && s.draft.exceptionNote.trim().length < EXCEPTION_MIN ? t(K.inspector.exceptionLabel) : null) : !s.draft.visitDate ? t(K.visit.date) : !s.matchesPref && !s.draft.agreed ? t(K.visit.agreed) : null;
  const run = async () => {
    const r = await (d.canAssign ? s.assign() : s.book());
    setError(r.ok ? null : t(errorKey(r.code)));
  };
  const ok = d.canAssign ? s.canAssign : s.canBook;
  return (
    <div className="stack gap-1">
      {(error || (missing && !ok)) && <p className={`t-xs ${error ? 't-error' : 't-muted'}`} role={error ? 'alert' : undefined}>{error ?? t(K.missing, { what: missing ?? '' })}</p>}
      <Button block disabled={!ok || s.busy} icon={d.canAssign ? <UserCheck size={18} aria-hidden="true" /> : <CalendarCheck size={18} aria-hidden="true" />} onClick={() => void run()} data-primary>
        {d.canAssign ? t(s.onlyMissingSkill ? K.inspector.assignException : K.inspector.assign) : t(d.assignment?.status === 'scheduled' ? K.visit.move : K.visit.book)}
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- sections */

function ReadinessSection({ d, t }: { d: QcJobDetail; t: T }) {
  const r = d.readiness;
  const beyond = r.jobStatus === 'handover_pending' || r.jobStatus === 'completed';
  const rows: { label: string; ok: boolean; note?: string }[] = [
    { label: t(K.readiness.installation), ok: beyond || r.installationOpen === 0, note: r.installationOpen > 0 ? t(K.readiness.open, { count: r.installationOpen }) : undefined },
    { label: t(K.readiness.safety), ok: beyond || r.safetyOpen === 0, note: r.safetyOpen > 0 ? t(K.readiness.open, { count: r.safetyOpen }) : undefined },
    { label: t(K.readiness.lead), ok: beyond || !r.awaitingLead },
  ];
  return (
    <Section title={t(K.readiness.heading)} hint={t(K.readiness.intro)}>
      <Card>
        <div className="stack gap-2" data-readiness={r.ready ? 'ready' : 'not'}>
          {rows.map((x) => (
            <p key={x.label} className="t-sm row gap-2" style={{ alignItems: 'center' }}>
              {x.ok ? <CheckCircle size={18} weight="fill" color="var(--color-success)" aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />} {x.label}
              {x.note && <span className="t-xs t-muted">· {x.note}</span>}
            </p>
          ))}
          <p className="t-xs t-muted">{t(beyond ? K.readiness.beyond : r.ready ? K.readiness.ready : K.readiness.blocked)}</p>
        </div>
      </Card>
    </Section>
  );
}

function PreferenceSection({ s, d, t, lang }: { s: QcState; d: QcJobDetail; t: T; lang: string }) {
  const [error, setError] = useState<string | null>(null);
  const p = d.preference;
  const dr = s.draft;
  return (
    <Section title={t(K.pref.heading)} hint={t(K.pref.intro)}>
      {p && (
        <p className="t-sm" data-pref>
          {t(K.pref.recorded, { dates: p.dates.map((x) => formatDate(`${x}T12:00:00`, lang)).join(', '), window: t(K.window[p.window]), name: p.recordedByName })}
          {p.note ? ` · ${p.note}` : ''}
        </p>
      )}
      <Card>
        <div className="stack gap-3">
          <div className="stack gap-2">
            <strong className="t-xs">{t(K.pref.dates)}</strong>
            {dr.prefDates.map((x, n) => (
              <div key={n} className="row gap-2" style={{ alignItems: 'center' }}>
                <Input type="date" aria-label={t(K.pref.date)} value={x} onChange={(e) => s.setDraft({ prefDates: dr.prefDates.map((y, i) => (i === n ? e.target.value : y)) })} data-pref-date />
                {dr.prefDates.length > 1 && <Button size="sm" variant="ghost" aria-label={t(K.pref.removeDate)} onClick={() => s.setDraft({ prefDates: dr.prefDates.filter((_, i) => i !== n) })}><X size={14} aria-hidden="true" /></Button>}
              </div>
            ))}
            {dr.prefDates.length < 3 && <Button size="sm" variant="ghost" icon={<Plus size={14} aria-hidden="true" />} style={{ width: 'fit-content' }} onClick={() => s.setDraft({ prefDates: [...dr.prefDates, ''] })}>{t(K.pref.addDate)}</Button>}
          </div>
          <Field label={t(K.pref.window)}>
            {({ id }) => (
              <Select id={id} value={dr.prefWindow} onChange={(e) => s.setDraft({ prefWindow: e.target.value as QcWindow | 'any' })}>
                <option value="any">{t(K.window.any)}</option>
                {WINDOW_IDS.map((w) => <option key={w} value={w}>{t(K.window[w])}</option>)}
              </Select>
            )}
          </Field>
          <Field label={t(K.pref.note)} error={error ?? undefined}>{({ id }) => <Input id={id} value={dr.prefNote} onChange={(e) => s.setDraft({ prefNote: e.target.value })} />}</Field>
          <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} disabled={!s.prefValid || s.busy} data-pref-save onClick={async () => { const r = await s.savePreference(); setError(r.ok ? null : t(errorKey(r.code))); }}>{t(K.pref.save)}</Button>
        </div>
      </Card>
    </Section>
  );
}

function CandidateCard({ c, selected, onPick, t }: { c: QcCandidateView; selected: boolean; onPick: () => void; t: T }) {
  const onlyGap = !c.eligible && c.problems.every((p) => p === 'missing_skill');
  const selectable = c.eligible || onlyGap;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!selectable}
      data-candidate={c.userId}
      data-eligible={c.eligible ? 'yes' : 'no'}
      onClick={onPick}
      className="stack gap-2"
      style={{ textAlign: 'left', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: `2px solid ${selected ? 'var(--color-accent-primary)' : 'var(--color-border)'}`, background: selected ? 'var(--color-surface-alt)' : 'var(--color-surface)', color: 'inherit', opacity: selectable ? 1 : 0.6, cursor: selectable ? 'pointer' : 'not-allowed' }}
    >
      <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <strong className="t-sm">{c.name}</strong>
        <Badge tone={c.eligible ? 'success' : onlyGap ? 'warning' : 'neutral'}>{c.eligible ? t(K.inspector.eligible) : onlyGap ? t(K.inspector.gap) : t(K.inspector.blocked)}</Badge>
      </span>
      <span className="row gap-1 wrap">
        {c.skills.map((sk) => <Badge key={sk} tone="neutral">{skillLabel(t, sk)}</Badge>)}
      </span>
      {c.problems.length > 0 && (
        <span className="t-xs stack gap-1">
          {c.problems.includes('missing_skill') && <span>{t(K.inspector.missing, { skills: c.missing.map((m) => skillLabel(t, m)).join(', ') })}</span>}
          {c.problems.includes('not_independent') && <span>{t(K.inspector.problem.not_independent)}: {c.involvement.map((i) => t(K.inspector.involvement[i])).join(', ')}</span>}
          {c.problems.includes('not_active') && <span>{t(K.inspector.problem.not_active)}</span>}
        </span>
      )}
      <span className="t-xs t-muted">{t(K.inspector.load, { qc: c.qcThisWeek, jobs: c.installJobs })}{c.distanceKm !== null ? ` · ${t(K.inspector.away, { km: c.distanceKm })}` : ''}</span>
      {c.onPreferred.length > 0 && (
        <span className="t-xs">
          {c.onPreferred.map((x) => (x.busy ? `${t(K.inspector.onPref)}: ${t(K.busy[x.busy])}` : t(K.inspector.free))).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
        </span>
      )}
    </button>
  );
}

function InspectorSection({ s, d, t, lang }: { s: QcState; d: QcJobDetail; t: T; lang: string }) {
  void lang;
  const [error, setError] = useState<string | null>(null);
  const dr = s.draft;
  return (
    <Section title={t(K.inspector.heading)} hint={t(K.inspector.intro)}>
      {d.exceptionAdvised && (
        <Card style={{ borderColor: 'var(--color-warning)' }}>
          <p className="t-sm" role="status">{t(K.inspector.noneEligible)}</p>
        </Card>
      )}
      <div className="grid-auto" style={{ ['--min' as string]: '300px' }} role="radiogroup" aria-label={t(K.inspector.heading)}>
        {d.candidates.map((c) => (
          <CandidateCard key={c.userId} c={c} selected={dr.selected === c.userId} onPick={() => s.setDraft({ selected: c.userId })} t={t} />
        ))}
      </div>
      {s.onlyMissingSkill && (
        <Field label={t(K.inspector.exceptionLabel)} hint={t(K.inspector.exceptionHint, { count: EXCEPTION_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={dr.exceptionNote} onChange={(e) => s.setDraft({ exceptionNote: e.target.value })} data-exception-note />}
        </Field>
      )}
      <Card>
        <div className="stack gap-2" data-admin-exception>
          <strong className="t-sm">{t(K.inspector.adminHeading)}</strong>
          <p className="t-xs t-muted">{t(d.exceptionAdvised ? K.inspector.adminAdvised : K.inspector.adminBody)}</p>
          <Field label={t(K.inspector.adminReason)} hint={t(K.inspector.exceptionHint, { count: EXCEPTION_MIN })} error={error ?? undefined}>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={dr.adminReason} onChange={(e) => s.setDraft({ adminReason: e.target.value })} data-admin-reason />}
          </Field>
          <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} disabled={!s.adminValid || s.busy} data-admin-go onClick={async () => { const r = await s.assignAdmin(); setError(r.ok ? null : t(errorKey(r.code))); }}>
            {t(K.inspector.adminGo)}
          </Button>
        </div>
      </Card>
    </Section>
  );
}

function VisitSection({ s, d, t, lang }: { s: QcState; d: QcJobDetail; t: T; lang: string }) {
  const dr = s.draft;
  const pref = d.preference;
  const prefMet = !!pref && d.suggestions.some((o) => o.preferred);
  return (
    <div className="stack gap-3">
      {pref && !prefMet && <p className="t-sm" role="status" data-unmet>{t(K.visit.unmet)}</p>}
      <div className="stack gap-2">
        <strong className="t-xs">{t(K.visit.suggestions)}</strong>
        {d.suggestions.length === 0 ? (
          <p className="t-sm t-muted">{t(K.visit.none)}</p>
        ) : (
          <div className="row gap-2 wrap" role="group" aria-label={t(K.visit.suggestions)}>
            {d.suggestions.map((o) => (
              <Chip key={`${o.date}-${o.window}`} pressed={dr.visitDate === o.date && dr.visitWindow === o.window} onClick={() => s.setDraft({ visitDate: o.date, visitWindow: o.window })}>
                {slotLabel(t, o.date, o.window, lang)}{o.preferred ? ` · ${t(K.visit.preferred)}` : ''}
              </Chip>
            ))}
          </div>
        )}
      </div>
      <div className="grid-2">
        <Field label={t(K.visit.date)}>{({ id }) => <Input id={id} type="date" value={dr.visitDate} onChange={(e) => s.setDraft({ visitDate: e.target.value })} data-visit-date />}</Field>
        <Field label={t(K.visit.window)}>
          {({ id }) => (
            <Select id={id} value={dr.visitWindow} onChange={(e) => s.setDraft({ visitWindow: e.target.value as QcWindow })}>
              {WINDOW_IDS.map((w) => <option key={w} value={w}>{t(K.window[w])}</option>)}
            </Select>
          )}
        </Field>
      </div>
      {dr.visitDate && s.matchesPref ? (
        <p className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}><CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.visit.matches)}</p>
      ) : (
        <Checkbox checked={dr.agreed} onChange={(x) => s.setDraft({ agreed: x })} label={<span className="stack"><span className="t-sm t-medium">{t(K.visit.agreed)}</span><span className="t-xs t-muted">{t(K.visit.agreedHint)}</span></span>} />
      )}
    </div>
  );
}

function Briefing({ b, t, lang }: { b: QcBriefingView; t: T; lang: string }) {
  return (
    <Section title={t(K.briefing.heading)} hint={t(K.briefing.intro)}>
      <div className="stack gap-3" data-briefing>
        <Card>
          <div className="stack gap-2">
            <strong className="t-sm">{t(K.briefing.steps)}</strong>
            {b.steps.map((st) => (
              <details key={st.id} data-brief-step={st.id}>
                <summary className="row gap-2" style={{ cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
                  <span className="t-sm">{t(st.labelKey)}</span>
                  <span className="row gap-1">
                    {st.safetyCritical && <Badge tone="error">{t(K.briefing.safetyCritical)}</Badge>}
                    <Badge tone={st.status === 'complete' ? 'success' : 'neutral'}>{st.notApplicable ? t(K.briefing.notApplicable) : t(`installTimeline.detail.stepStatus.${st.status}`)}</Badge>
                  </span>
                </summary>
                <div className="stack gap-2 mt-2">
                  <p className="t-xs t-muted">{st.completedAt ? `${formatDateTime(st.completedAt, lang)}${st.completedByName ? ` · ${t(K.briefing.doneBy, { name: st.completedByName })}` : ''}` : ''}</p>
                  {st.evidence.length === 0 ? <p className="t-xs t-muted">{t(K.briefing.noPhotos)}</p> : (
                    <div className="row gap-2 wrap">
                      {st.evidence.map((e) => (e.previewUrl ? <img key={e.id} src={e.previewUrl} alt={t(K.briefing.photos)} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : <Badge key={e.id} tone="neutral">{t(K.briefing.photos)}</Badge>))}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </Card>
        <div className="grid-auto" style={{ ['--min' as string]: '260px' }}>
          <Card>
            <div className="stack gap-1">
              <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}><ShieldCheck size={16} aria-hidden="true" /> {t(K.briefing.safety)}</strong>
              <p className="t-sm">{b.safety.total - b.safety.open} / {b.safety.total}</p>
              <strong className="t-sm mt-2">{t(K.briefing.issues)}</strong>
              {b.issues.length === 0 ? <p className="t-xs t-muted">{t(K.briefing.noIssues)}</p> : b.issues.map((i) => <p key={i.code} className="t-xs">{i.code} · {t(`issueReport.category.${i.category}`)} · {t(i.status === 'open' ? K.briefing.open : K.briefing.resolved)}</p>)}
            </div>
          </Card>
          <Card>
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.briefing.parts)}</strong>
              {b.materials.parts.length === 0 ? <p className="t-xs t-muted">{t(K.briefing.noParts)}</p> : b.materials.parts.map((p, n) => (
                <p key={n} className="t-xs">
                  {p.quantity} × {p.description}{p.substituted ? ` · ${t(K.briefing.substituted)}` : ''}
                  {p.identifiers.length > 0 ? ` · ${p.identifiers.map((i) => (i.legible ? i.value : t(K.briefing.unreadable))).join(', ')}` : ''}
                </p>
              ))}
            </div>
          </Card>
          <Card>
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.briefing.team)}</strong>
              {b.team.map((m) => <p key={m.name} className="t-xs">{m.name} · {t(m.role === 'lead' ? K.briefing.lead : K.briefing.assistant)}</p>)}
              <strong className="t-sm mt-2">{t(K.briefing.site)}</strong>
              <p className="t-xs">{b.site.address}</p>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

function MySection({ s, d, t, lang, onAdd }: { s: QcState; d: QcJobDetail; t: T; lang: string; onAdd: () => void }) {
  return (
    <Section title={t(K.mine.heading)} hint={t(K.mine.offBody)}>
      {d.myUnavailable.length === 0 ? <p className="t-sm t-muted">{t(K.mine.offNone)}</p> : (
        <Card flush>
          {d.myUnavailable.map((u) => (
            <ListRow key={u.id} title={`${formatDate(`${u.date}T12:00:00`, lang)}${u.window === 'all' ? '' : ` · ${t(K.window[u.window])}`}`} subtitle={u.reason} trailing={<Button size="sm" variant="ghost" aria-label={t(K.mine.offRemove)} onClick={() => void s.removeOff(u.id)}><Trash size={14} aria-hidden="true" /></Button>} />
          ))}
        </Card>
      )}
      <Button size="sm" variant="secondary" icon={<Plus size={14} aria-hidden="true" />} style={{ width: 'fit-content' }} onClick={onAdd}>{t(K.mine.offAdd)}</Button>
    </Section>
  );
}

/* ---------------------------------------------------------------- sheets */

function OffSheet({ s, userId, t, onClose }: { s: QcState; userId: string; t: T; onClose: () => void }) {
  const [date, setDate] = useState('');
  const [window, setWindow] = useState<QcWindow | 'all'>('all');
  const [reason, setReason] = useState('');
  const { error, run } = useSubmit(onClose, t);
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(K.mine.offBody)}</p>
      <div className="grid-2">
        <Field label={t(K.mine.offDate)}>{({ id }) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} data-off-date />}</Field>
        <Field label={t(K.mine.offWindow)}>
          {({ id }) => (
            <Select id={id} value={window} onChange={(e) => setWindow(e.target.value as QcWindow | 'all')}>
              <option value="all">{t(K.mine.offAll)}</option>
              {WINDOW_IDS.map((w) => <option key={w} value={w}>{t(K.window[w])}</option>)}
            </Select>
          )}
        </Field>
      </div>
      <Field label={t(K.mine.offReason)} required error={error ?? undefined}>{({ id }) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button disabled={!date || reason.trim().length < 3 || s.busy} onClick={() => void run(() => s.addOff({ ...(s.isAdmin ? { userId } : {}), date, window, reason }))} data-sheet-go>{t(K.mine.offAdd)}</Button>
      </div>
    </div>
  );
}

function NoteSheet({ body, label, min, go, t, onClose, onSubmit }: { body: string; label: string; min: number; go: string; t: T; onClose: () => void; onSubmit: (text: string) => Promise<ActionResult> }) {
  const [text, setText] = useState('');
  const { error, run } = useSubmit(onClose, t);
  return (
    <div className="stack gap-3">
      <p className="t-sm">{body}</p>
      <Field label={label} required error={error ?? undefined}>{({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={text} onChange={(e) => setText(e.target.value)} />}</Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button disabled={text.trim().length < min} onClick={() => void run(() => onSubmit(text))} data-sheet-go>{go}</Button>
      </div>
    </div>
  );
}

function ReassignSheet({ s, d, t, onClose }: { s: QcState; d: QcJobDetail; t: T; onClose: () => void }) {
  const eligible = d.candidates.filter((c) => c.eligible && c.userId !== d.assignment?.inspectorId);
  const [pick, setPick] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const self = pick === s.userId;
  const { error, run } = useSubmit(onClose, t);
  const ok = !!pick && reason.trim().length >= REASON_MIN && (!self || note.trim().length >= EXCEPTION_MIN);
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(K.assigned.reassignBody)}</p>
      <Field label={t(K.assigned.reassignPick)}>
        {({ id }) => (
          <Select id={id} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">{t(K.inspector.pick)}</option>
            {eligible.map((c) => <option key={c.userId} value={c.userId}>{c.name}</option>)}
            <option value={s.userId}>{t(K.assigned.reassignSelf)}</option>
          </Select>
        )}
      </Field>
      {self && <Field label={t(K.inspector.exceptionLabel)} hint={t(K.inspector.exceptionHint, { count: EXCEPTION_MIN })}>{({ id }) => <TextArea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>}
      <Field label={t(K.assigned.reassignReason)} required error={error ?? undefined}>{({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button disabled={!ok || s.busy} onClick={() => void run(() => s.reassign({ inspectorId: pick, reason, ...(self ? { exceptionNote: note } : {}) }))} data-sheet-go>{t(K.assigned.reassignGo)}</Button>
      </div>
    </div>
  );
}
