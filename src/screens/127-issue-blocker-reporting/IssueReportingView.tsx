import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera, CheckCircle, ClockCounterClockwise, CloudArrowUp, Flag, Package, PauseCircle, Phone, ShieldWarning, Siren, VideoCamera, Warning, WifiSlash, X } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, LoadingState, Screen, ScreenHeader, Select, SegBar, Sheet, StatTile, TextArea, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { IssueBoardView, JobIssueView } from '@/data/repository';
import type { IssueSeverity } from '@/data/types';
import { InlineCapture } from '@/features/technician/InlineCapture';
import type { InlineCaptureLabels } from '@/features/technician/InlineCapture';
import { DESCRIPTION_MIN, NOTE_MIN } from '@/features/technician/issues';
import { useIssueReporting } from './useIssueReporting';
import type { ActionResult, IssueState } from './useIssueReporting';
import { CATEGORY_IDS, ISSUE_KEYS as K, OUTCOMES, RESOLUTION_IDS, SEVERITY_IDS, boardPath, homePath, issuesPath } from './issue-reporting.types';

type T = ReturnType<typeof useTranslation>['t'];

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const SEV_TONE: Record<IssueSeverity, BadgeTone> = { minor: 'neutral', blocking: 'warning', safety: 'error' };
const hoursText = (ms: number) => `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;

/**
 * Screen 127 — Issue/Blocker Reporting. The structured way out of the SOP for a real problem the procedure has no step for. Severity decides
 * what the system does: a minor report is logged and work goes on; a blocking one pauses the job and tells Admin; a safety one stops it at once
 * and escalates like an SOS. Every report stays in the job's history, the same problem reported twice is linked, a report that stops mattering
 * is resolved, and Admin is shown which steps keep being reported as a problem with the procedure itself.
 */
export function IssueReportingView() {
  const { t, i18n } = useTranslation();
  const s = useIssueReporting();
  const lang = i18n.language;

  if (!s.jobId && !s.isAdmin) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <EmptyState icon={<Flag size={28} />} title={t(K.pick.title)} body={t(K.pick.body)} actionLabel={t(K.pick.action)} onAction={() => s.goto(homePath)} />
      </Screen>
    );
  }
  if (s.status === 'loading' && !s.view && !s.board) {
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
        <EmptyState icon={<Package size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.back)} onAction={() => s.goto(s.isAdmin ? boardPath : homePath)} />
      </Screen>
    );
  }
  if (s.status === 'error' || (s.jobId ? !s.view : !s.board)) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  if (s.isAdmin && !s.jobId && s.board) return <BoardView s={s} board={s.board} t={t} lang={lang} />;
  const v = s.view!;
  const reporting = !s.isAdmin && v.canReport;

  return (
    <Screen width="default" className={reporting ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={() => (s.isAdmin ? s.goto(boardPath) : s.goto(`/technician/jobs/${v.job.id}`))} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />
      <SyncBanner s={s} t={t} />
      <FailedCard s={s} t={t} />
      {v.paused && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-warning)' }}>
          <div className="stack gap-1" role="status">
            <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}>
              <PauseCircle size={18} color="var(--color-warning)" aria-hidden="true" /> {t(K.paused.title)}
            </strong>
            <p className="t-sm">{t(K.paused.body)}</p>
          </div>
        </Card>
      )}
      {v.blocked.ms > 0 && <p className="t-xs t-muted mb-3">{t(K.paused.blocked, { time: hoursText(v.blocked.ms) })}</p>}

      <div className="stack gap-4">
        {reporting && <ReportForm s={s} t={t} lang={lang} />}
        {!v.canReport && !s.isAdmin && (
          <Card>
            <p className="t-sm t-muted">{t(K.form.closed)}</p>
          </Card>
        )}
        <IssueList issues={v.issues} s={s} t={t} lang={lang} />
      </div>
    </Screen>
  );
}

/* ---------------------------------------------------------------- pieces */

function SyncBanner({ s, t }: { s: IssueState; t: T }) {
  const waiting = s.queue.length;
  const safetyWaiting = s.queue.some((q) => q.kind === 'report' && q.input.severity === 'safety');
  if (s.isOnline && waiting === 0) return null;
  return (
    <Card className="mb-3" style={{ borderColor: s.isOnline ? undefined : 'var(--color-warning)' }}>
      <div className="stack gap-1">
        {!s.isOnline && (
          <p className="t-sm row gap-2" style={{ alignItems: 'center' }}>
            <WifiSlash size={16} color="var(--color-warning)" aria-hidden="true" /> {t(K.sync.offline)}
          </p>
        )}
        {waiting > 0 && (
          <p className="t-sm row gap-2" style={{ alignItems: 'center' }}>
            <CloudArrowUp size={16} aria-hidden="true" /> {t(s.syncing ? K.sync.syncing : K.sync.queued, { count: waiting })}
          </p>
        )}
        {s.videoAtRisk && <p className="t-sm t-warning">{t(K.sync.videoRisk)}</p>}
        {safetyWaiting && s.view?.adminPhone && (
          <a className="ds-btn ds-btn--danger ds-btn--sm" href={`tel:${s.view.adminPhone}`} style={{ width: 'fit-content' }}>
            <Phone size={16} aria-hidden="true" /> {t(K.sync.callNow)}
          </a>
        )}
      </div>
    </Card>
  );
}

function FailedCard({ s, t }: { s: IssueState; t: T }) {
  if (s.failed.length === 0) return null;
  return (
    <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
      <div className="stack gap-2" role="alert">
        <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}>
          <Warning size={18} color="var(--color-error)" aria-hidden="true" /> {t(K.failed.title)}
        </strong>
        {s.failed.map((f) => (
          <p key={f.id} className="t-sm">
            {t(K.failed.item, { reason: t(errorKey(f.code)) })}
          </p>
        ))}
        <div>
          <Button size="sm" variant="secondary" onClick={s.dismissFailed}>
            {t(K.failed.dismiss)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

const captureLabels = (t: T, kind: 'photo' | 'video'): InlineCaptureLabels => ({
  add: t(kind === 'video' ? K.form.addVideo : K.form.addPhoto),
  retake: t('issueReport.capture.retake'),
  keep: t('issueReport.capture.keep'),
  keepAnyway: t('issueReport.capture.keepAnyway'),
  preparing: t('issueReport.capture.preparing'),
  unreadable: t('issueReport.capture.unreadable'),
  wrongKind: t('issueReport.capture.wrongKind'),
  tooLong: t('issueReport.capture.tooLong'),
  tooLarge: t('issueReport.capture.tooLarge'),
  quality: { blurry: t('issueReport.capture.blurry'), dark: t('issueReport.capture.dark'), glare: t('issueReport.capture.glare'), unchecked: t('issueReport.capture.unchecked') },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="stack gap-3" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 'var(--space-3)' }}>
      <h3 className="t-sm t-semibold">{title}</h3>
      {children}
    </div>
  );
}

/** The quick report. Sections under a gold hairline, checks as the words are typed, and a sticky send that is disabled (never hidden) until valid. */
function ReportForm({ s, t, lang }: { s: IssueState; t: T; lang: string }) {
  const v = s.view!;
  const f = s.form;
  const [confirming, setConfirming] = useState(false);
  const descOk = f.description.trim().length >= DESCRIPTION_MIN;
  const severityLocked = f.category === 'safety_concern';
  const needsConfirm = f.severity === 'blocking' || f.severity === 'safety';
  const missing = !f.category ? K.form.kind : !f.severity ? K.form.severity : !descOk ? K.form.description : null;
  const send = () => {
    s.submit();
    setConfirming(false);
  };
  return (
    <Card>
      <div className="stack gap-4">
        <div className="stack gap-1">
          <h2 className="t-lg t-semibold">{t(K.form.heading)}</h2>
          <p className="t-sm t-muted">{t(K.form.intro)}</p>
          {s.draftRestored && <p className="t-xs t-muted">{t(K.form.draftRestored)}</p>}
        </div>

        <Section title={t(K.form.kind)}>
          <div className="row gap-2 wrap" role="group" aria-label={t(K.form.kind)}>
            {CATEGORY_IDS.map((c) => (
              <Chip key={c} pressed={f.category === c} onClick={() => s.setForm({ category: c })}>
                {t(K.category[c])}
              </Chip>
            ))}
          </div>
          {f.category && <p className="t-xs t-muted">{t(K.categoryHint[f.category])}</p>}
        </Section>

        <Section title={t(K.form.severity)}>
          {severityLocked && <p className="t-xs t-warning">{t(K.form.lockedSafety)}</p>}
          <div className="grid-auto" style={{ ['--min' as string]: '200px' }} role="radiogroup" aria-label={t(K.form.severity)}>
            {SEVERITY_IDS.map((sv) => {
              const selected = f.severity === sv;
              const disabled = severityLocked && sv !== 'safety';
              return (
                <button
                  key={sv}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  data-severity={sv}
                  onClick={() => s.setForm({ severity: sv })}
                  className="stack gap-1"
                  style={{ textAlign: 'left', padding: 'var(--space-3)', minHeight: 96, borderRadius: 'var(--radius-md)', border: `2px solid ${selected ? (sv === 'safety' ? 'var(--color-error)' : 'var(--color-accent-primary)') : 'var(--color-border)'}`, background: selected ? 'var(--color-surface-alt)' : 'var(--color-surface)', color: 'inherit', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                >
                  <span className="row gap-2" style={{ alignItems: 'center' }}>
                    {sv === 'safety' ? <Siren size={18} color="var(--color-error)" aria-hidden="true" /> : sv === 'blocking' ? <PauseCircle size={18} aria-hidden="true" /> : <Flag size={18} aria-hidden="true" />}
                    <strong className="t-sm">{t(K.severity[sv])}</strong>
                  </span>
                  <span className="t-xs t-muted">{t(K.severityHint[sv])}</span>
                </button>
              );
            })}
          </div>
          {f.severity === 'safety' && (
            <div className="stack gap-1" style={{ padding: 'var(--space-3)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)' }} role="alert">
              <p className="t-sm row-top gap-2">
                <ShieldWarning size={18} color="var(--color-error)" className="shrink-0" aria-hidden="true" /> {t(K.form.safetyDanger)}
              </p>
              {v.adminPhone && (
                <a className="ds-btn ds-btn--danger ds-btn--sm" href={`tel:${v.adminPhone}`} style={{ width: 'fit-content' }}>
                  <Phone size={16} aria-hidden="true" /> {t(K.form.safetyCall)}
                </a>
              )}
            </div>
          )}
        </Section>

        <Section title={t(K.form.about)}>
          <Field label={t(K.form.step)}>
            {({ id }) => (
              <Select id={id} value={f.stepId} onChange={(e) => s.setForm({ stepId: e.target.value })}>
                <option value="">{t(K.form.noStep)}</option>
                {v.steps.map((st) => (
                  <option key={st.id} value={st.id}>
                    {t(st.labelKey)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {f.stepId && <Checkbox checked={f.sopGap} onChange={(x) => s.setForm({ sopGap: x })} label={<span className="stack"><span className="t-sm t-medium">{t(K.form.sopGap)}</span><span className="t-xs t-muted">{t(K.form.sopGapHint)}</span></span>} />}
        </Section>

        <Section title={t(K.form.detail)}>
          <Field label={t(K.form.description)} hint={t(K.form.descriptionHint, { count: DESCRIPTION_MIN })} required>
            {({ id, describedBy }) => (
              <div className="stack gap-1">
                <TextArea id={id} aria-describedby={describedBy} rows={4} value={f.description} onChange={(e) => s.setForm({ description: e.target.value })} />
                {descOk && (
                  <span className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}>
                    <CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.form.descriptionOk)}
                  </span>
                )}
              </div>
            )}
          </Field>
          <div className="stack gap-2">
            <strong className="t-sm">{t(K.form.evidence)}</strong>
            <span className="t-xs t-muted">{t(K.form.evidenceHint, { count: s.maxAttachments })}</span>
            {f.attachments.length > 0 && (
              <div className="row gap-2 wrap">
                {f.attachments.map((a, i) => (
                  <div key={`${a.takenAt}-${i}`} style={{ position: 'relative' }} data-attachment={i}>
                    <img src={a.media.previewUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    {a.media.kind === 'video' && <VideoCamera size={16} aria-hidden="true" style={{ position: 'absolute', left: 4, bottom: 4, background: 'var(--color-surface)', borderRadius: 4 }} />}
                    <button type="button" aria-label={t(K.form.remove)} onClick={() => s.removeAttachment(i)} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                      <X size={12} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {f.attachments.length < s.maxAttachments && (
              <div className="row gap-3 wrap">
                <InlineCapture kind="photo" labels={captureLabels(t, 'photo')} onKeep={(media, takenAt) => s.addAttachment({ media, takenAt })} />
                <InlineCapture kind="video" labels={captureLabels(t, 'video')} onKeep={(media, takenAt) => s.addAttachment({ media, takenAt })} />
              </div>
            )}
          </div>
        </Section>

        {s.related.length > 0 && (
          <Section title={t(K.form.related)}>
            <p className="t-xs t-muted">{t(K.form.relatedHint)}</p>
            <div className="stack gap-2" role="radiogroup" aria-label={t(K.form.related)}>
              <RadioRow checked={!f.linkTo} label={t(K.form.relatedNone)} onSelect={() => s.setForm({ linkTo: '' })} />
              {v.issues
                .filter((i) => s.related.includes(i.id))
                .map((i) => (
                  <RadioRow key={i.id} checked={f.linkTo === i.id} label={`${i.code} · ${t(K.category[i.category])} · ${i.reportedByName}: ${i.description.slice(0, 80)}`} hint={t(K.form.looksRelated)} onSelect={() => s.setForm({ linkTo: i.id })} />
                ))}
            </div>
          </Section>
        )}
      </div>

      <ActionBar>
        {missing && <p className="t-xs t-muted mb-2">{t(K.form.sendMissing, { what: t(missing) })}</p>}
        <Button block variant={f.severity === 'safety' ? 'danger' : 'primary'} disabled={!s.valid} icon={<Flag size={18} aria-hidden="true" />} onClick={() => (needsConfirm ? setConfirming(true) : send())}>
          {t(K.form.send)}
        </Button>
      </ActionBar>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title={t(K.confirm.title)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <p className="t-sm">{t(f.severity === 'safety' ? K.confirm.safety : K.confirm.blocking)}</p>
          <div className="row gap-2 wrap">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              {t(K.confirm.back)}
            </Button>
            <Button variant={f.severity === 'safety' ? 'danger' : 'primary'} onClick={send}>
              {t(K.confirm.go)}
            </Button>
          </div>
        </div>
      </Sheet>
      <span hidden>{lang}</span>
    </Card>
  );
}

function RadioRow({ checked, label, hint, onSelect }: { checked: boolean; label: string; hint?: string; onSelect: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={checked} onClick={onSelect} className="row gap-3" style={{ textAlign: 'left', alignItems: 'flex-start', padding: 'var(--space-2)', border: `1px solid ${checked ? 'var(--color-accent-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'inherit', cursor: 'pointer' }}>
      <span aria-hidden="true" style={{ marginTop: 3, width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-accent-primary)', background: checked ? 'var(--color-accent-primary)' : 'transparent', flexShrink: 0 }} />
      <span className="stack">
        <span className="t-sm">{label}</span>
        {hint && <span className="t-xs t-muted">{hint}</span>}
      </span>
    </button>
  );
}

function IssueList({ issues, s, t, lang }: { issues: JobIssueView[]; s: IssueState; t: T; lang: string }) {
  const open = issues.filter((i) => i.status === 'open');
  const resolved = issues.filter((i) => i.status === 'resolved');
  return (
    <>
      <section className="stack gap-2" aria-label={t(K.list.open)}>
        <h2 className="t-md t-semibold">{t(K.list.open)}</h2>
        {open.length === 0 ? (
          <Card>
            <p className="t-sm t-muted">{t(K.list.empty)}</p>
          </Card>
        ) : (
          open.map((i) => <IssueCard key={i.id} issue={i} s={s} t={t} lang={lang} />)
        )}
      </section>
      {resolved.length > 0 && (
        <section className="stack gap-2" aria-label={t(K.list.resolved)}>
          <h2 className="t-md t-semibold">{t(K.list.resolved)}</h2>
          {resolved.map((i) => (
            <IssueCard key={i.id} issue={i} s={s} t={t} lang={lang} />
          ))}
        </section>
      )}
    </>
  );
}

function IssueCard({ issue, s, t, lang, showJob }: { issue: JobIssueView; s: IssueState; t: T; lang: string; showJob?: boolean }) {
  const [sheet, setSheet] = useState<null | 'note' | 'severity' | 'resolve' | 'reopen'>(null);
  const [timeline, setTimeline] = useState(false);
  const highlighted = s.highlight === issue.id;
  useEffect(() => {
    if (highlighted) document.getElementById(`issue-${issue.id}`)?.scrollIntoView({ block: 'center' });
  }, [highlighted, issue.id]);
  const canRaise = issue.status === 'open' && !issue.local && (s.isAdmin || issue.severity !== 'safety');
  return (
    <div data-issue={issue.id} id={`issue-${issue.id}`} style={{ minWidth: 0 }}>
    <Card style={{ borderColor: highlighted ? 'var(--color-accent-primary)' : issue.status === 'open' && issue.severity === 'safety' ? 'var(--color-error)' : undefined }}>
      <div className="stack gap-2">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone={SEV_TONE[issue.severity]}>{issue.severity === 'safety' && <Siren size={12} aria-hidden="true" />} {t(K.severity[issue.severity])}</Badge>
          <Badge tone="neutral">{t(K.category[issue.category])}</Badge>
          {issue.status === 'resolved' && <Badge tone="success">{t(K.list.resolved)}</Badge>}
          {issue.local && <Badge tone="neutral"><CloudArrowUp size={12} aria-hidden="true" /> {t(K.sync.notSent)}</Badge>}
          {issue.sopGap && <Badge tone="accent">{t(K.list.sopGap)}</Badge>}
          <span className="t-xs t-muted">{issue.code}</span>
        </div>
        {showJob && (
          <p className="t-xs">
            <button type="button" className="t-xs" style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-primary)' }} onClick={() => s.goto(issuesPath(issue.jobId, issue.id))}>
              {t(K.list.onJob, { code: issue.jobCode, site: issue.siteName })}
            </button>
          </p>
        )}
        <p className="t-sm">{issue.description}</p>
        <p className="t-xs t-muted">
          {t(K.list.by, { name: issue.reportedByName, date: formatDateTime(issue.createdAt, lang) })}
          {issue.stepLabelKey ? ` · ${t(K.list.step, { step: t(issue.stepLabelKey) })}` : ''}
        </p>
        {issue.groupSize > 1 && <p className="t-xs t-warning">{t(K.list.group, { count: issue.groupSize })}</p>}
        {issue.evidence.length > 0 && (
          <div className="row gap-2 wrap">
            {issue.evidence.map((e) => (e.previewUrl ? <img key={e.id} src={e.previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : null))}
          </div>
        )}
        {issue.resolution && (
          <p className="t-sm t-success">{t(K.list.resolvedBy, { how: t(K.resolution[issue.resolution.how]), name: issue.resolution.byName, date: formatDateTime(issue.resolution.at, lang), note: issue.resolution.note })}</p>
        )}
        <div className="row gap-2 wrap">
          {!issue.local && issue.status === 'open' && (
            <Button size="sm" variant="secondary" onClick={() => setSheet('note')}>
              {t(K.action.note)}
            </Button>
          )}
          {canRaise && (
            <Button size="sm" variant="ghost" onClick={() => setSheet('severity')}>
              {t(K.action.severity)}
            </Button>
          )}
          {issue.canResolve && !issue.local && (
            <Button size="sm" onClick={() => setSheet('resolve')}>
              {t(K.action.resolve)}
            </Button>
          )}
          {issue.status === 'open' && !issue.canResolve && issue.severity === 'safety' && !s.isAdmin && <span className="t-xs t-muted">{t(K.action.resolveSafetyAdmin)}</span>}
          {issue.canReopen && (
            <Button size="sm" variant="secondary" onClick={() => setSheet('reopen')}>
              {t(K.action.reopen)}
            </Button>
          )}
          {issue.events.length > 0 && (
            <Button size="sm" variant="ghost" icon={<ClockCounterClockwise size={14} aria-hidden="true" />} onClick={() => setTimeline(!timeline)}>
              {t(timeline ? K.list.hideTimeline : K.list.timeline)}
            </Button>
          )}
        </div>
        {timeline && (
          <div className="stack gap-1" style={{ paddingLeft: 'var(--space-3)', borderLeft: '2px solid var(--color-border)' }}>
            {issue.events.map((e) => (
              <div key={e.id} className="stack">
                <span className="t-xs">
                  {t(K.event[e.kind])} · {e.byName} · {formatDateTime(e.at, lang)}
                  {e.from && e.to ? ` · ${t(K.severity[e.from])} → ${t(K.severity[e.to])}` : ''}
                </span>
                {e.note && <span className="t-xs t-muted">{e.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <NoteSheet open={sheet === 'note'} onClose={() => setSheet(null)} s={s} issue={issue} t={t} />
      <SeveritySheet open={sheet === 'severity'} onClose={() => setSheet(null)} s={s} issue={issue} t={t} />
      <ResolveSheet open={sheet === 'resolve'} onClose={() => setSheet(null)} s={s} issue={issue} t={t} />
      <ReopenSheet open={sheet === 'reopen'} onClose={() => setSheet(null)} s={s} issue={issue} t={t} />
    </Card>
    </div>
  );
}

/** A sheet with one thing to write, refused inline when it is too short or the server says no. */
function WriteSheet({ open, onClose, title, children, label, hint, confirm, busy, onSubmit, t, min = NOTE_MIN }: { open: boolean; onClose: () => void; title: string; children?: React.ReactNode; label: string; hint: string; confirm: string; busy: boolean; onSubmit: (note: string) => Promise<ActionResult> | void; t: T; min?: number }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      setNote('');
      setError(null);
    }
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={title} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        {children}
        <Field label={label} hint={hint} required error={error ? t(errorKey(error)) : undefined}>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <Button
          disabled={busy || note.trim().length < min}
          onClick={async () => {
            const r = await onSubmit(note);
            if (!r || r.ok) onClose();
            else setError(r.code ?? 'generic');
          }}
        >
          {confirm}
        </Button>
      </div>
    </Sheet>
  );
}

function NoteSheet({ open, onClose, s, issue, t }: { open: boolean; onClose: () => void; s: IssueState; issue: JobIssueView; t: T }) {
  return (
    <WriteSheet open={open} onClose={onClose} title={t(K.action.noteTitle)} label={t(K.action.noteLabel)} hint={t(K.action.noteHint, { count: NOTE_MIN })} confirm={t(K.action.send)} busy={s.busy} t={t} onSubmit={(n) => (s.isAdmin ? s.adminNote(issue.id, n) : s.note(issue.id, n))}>
      {!s.isAdmin && (
        <InlineCapture kind="photo" labels={captureLabels(t, 'photo')} onKeep={(media, takenAt) => void s.addEvidence(issue.id, { ...media, capturedAt: takenAt })} />
      )}
    </WriteSheet>
  );
}

function SeveritySheet({ open, onClose, s, issue, t }: { open: boolean; onClose: () => void; s: IssueState; issue: JobIssueView; t: T }) {
  const [sev, setSev] = useState<IssueSeverity>(issue.severity);
  useEffect(() => {
    if (open) setSev(issue.severity);
  }, [open, issue.severity]);
  const rank = { minor: 0, blocking: 1, safety: 2 };
  const options = SEVERITY_IDS.filter((x) => x !== issue.severity && (s.isAdmin || rank[x] > rank[issue.severity]));
  return (
    <WriteSheet open={open} onClose={onClose} title={t(K.action.severityTitle)} label={t(K.action.severityWhy)} hint={t(K.action.noteHint, { count: NOTE_MIN })} confirm={t(K.action.apply)} busy={s.busy || sev === issue.severity} t={t} onSubmit={(n) => s.setSeverity(issue.id, sev, n)}>
      {!s.isAdmin && <p className="t-xs t-muted">{t(K.action.severityRaiseOnly)}</p>}
      <div className="row gap-2 wrap" role="group" aria-label={t(K.action.severityTitle)}>
        {options.map((x) => (
          <Chip key={x} pressed={sev === x} onClick={() => setSev(x)}>
            {t(K.severity[x])}
          </Chip>
        ))}
      </div>
    </WriteSheet>
  );
}

function ResolveSheet({ open, onClose, s, issue, t }: { open: boolean; onClose: () => void; s: IssueState; issue: JobIssueView; t: T }) {
  const [how, setHow] = useState<(typeof RESOLUTION_IDS)[number]>(s.isAdmin ? 'admin_resolved' : 'self_resolved');
  const options = RESOLUTION_IDS.filter((x) => s.isAdmin || x !== 'admin_resolved');
  return (
    <WriteSheet open={open} onClose={onClose} title={t(K.action.resolveTitle)} label={t(K.action.resolveNote)} hint={t(K.action.noteHint, { count: NOTE_MIN })} confirm={t(K.action.resolve)} busy={s.busy} t={t} onSubmit={(n) => s.resolve(issue.id, how, n)}>
      <div className="stack gap-1">
        <strong className="t-sm">{t(K.action.resolveHow)}</strong>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.action.resolveHow)}>
          {options.map((x) => (
            <Chip key={x} pressed={how === x} onClick={() => setHow(x)}>
              {t(K.resolution[x])}
            </Chip>
          ))}
        </div>
        {issue.severity !== 'minor' && <p className="t-xs t-muted">{t(K.action.resolveResumes)}</p>}
      </div>
    </WriteSheet>
  );
}

function ReopenSheet({ open, onClose, s, issue, t }: { open: boolean; onClose: () => void; s: IssueState; issue: JobIssueView; t: T }) {
  void issue;
  return <WriteSheet open={open} onClose={onClose} title={t(K.action.reopenTitle)} label={t(K.action.reopenNote)} hint={t(K.action.noteHint, { count: NOTE_MIN })} confirm={t(K.action.reopen)} busy={s.busy} t={t} onSubmit={(n) => s.reopen(issue.id, n)} />;
}

/* ------------------------------------------------------------------ Admin */

function BoardView({ s, board, t, lang }: { s: IssueState; board: IssueBoardView; t: T; lang: string }) {
  const [tab, setTab] = useState<'open' | 'resolved' | 'patterns'>(s.tab === 'patterns' ? 'patterns' : 'open');
  const [sev, setSev] = useState<'all' | IssueSeverity>('all');
  const [reviewing, setReviewing] = useState<IssueBoardView['patterns'][number] | null>(null);
  const list = board.issues.filter((i) => (tab === 'open' ? i.status === 'open' : i.status === 'resolved') && (sev === 'all' || i.severity === sev));
  const needs = board.patterns.filter((p) => p.needsReview).length;
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.boardTitle)} />
      <SyncBanner s={s} t={t} />
      <div className="grid-auto mb-3" style={{ ['--min' as string]: '132px' }}>
        <Card><StatTile label={t(K.board.tOpen)} value={String(board.totals.open)} /></Card>
        <Card><StatTile label={t(K.board.tBlocking)} value={String(board.totals.blocking)} /></Card>
        <Card><StatTile label={t(K.board.tSafety)} value={String(board.totals.safety)} /></Card>
        <Card><StatTile label={t(K.board.tResolved)} value={String(board.totals.resolved)} /></Card>
      </div>
      <SegBar
        label={t(K.boardTitle)}
        value={tab}
        onChange={(x) => setTab(x as typeof tab)}
        items={[
          { id: 'open', label: t(K.board.open) },
          { id: 'resolved', label: t(K.board.resolved) },
          { id: 'patterns', label: needs > 0 ? `${t(K.board.patterns)} (${needs})` : t(K.board.patterns) },
        ]}
      />
      {tab !== 'patterns' ? (
        <div className="stack gap-3 mt-3">
          <div className="row gap-2 wrap" role="group" aria-label={t(K.board.filterAll)}>
            <Chip pressed={sev === 'all'} onClick={() => setSev('all')}>{t(K.board.filterAll)}</Chip>
            {SEVERITY_IDS.map((x) => (
              <Chip key={x} pressed={sev === x} onClick={() => setSev(x)}>{t(K.severity[x])}</Chip>
            ))}
          </div>
          {list.length === 0 ? (
            <Card>
              <p className="t-sm t-muted">{t(tab === 'open' ? K.board.emptyOpen : K.list.emptyResolved)}</p>
            </Card>
          ) : (
            <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
              {list.map((i) => (
                <IssueCard key={i.id} issue={i} s={s} t={t} lang={lang} showJob />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="stack gap-3 mt-3">
          <p className="t-sm">{t(K.board.patternsIntro)}</p>
          {board.patterns.length === 0 ? (
            <Card><p className="t-sm t-muted">{t(K.board.patternsEmpty)}</p></Card>
          ) : (
            board.patterns.map((p) => (
              <Card key={p.stepId} style={{ borderColor: p.needsReview ? 'var(--color-warning)' : undefined }}>
                <div className="stack gap-2">
                  <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
                    <strong className="t-md">{p.stepLabelKey ? t(p.stepLabelKey) : p.stepId}</strong>
                    <Badge tone={p.needsReview ? 'warning' : 'success'}>{t(p.needsReview ? K.board.needsReview : K.board.reviewed)}</Badge>
                  </div>
                  <p className="t-sm">{t(K.board.patternLine, { reports: p.reports, jobs: p.jobs, people: p.people })}</p>
                  {p.review && <p className="t-xs t-muted">{t(K.board.outcome[p.review.outcome])} · {p.review.byName} · {formatDateTime(p.review.at, lang)}: {p.review.note}</p>}
                  <div className="stack gap-1">
                    <span className="t-xs t-muted">{t(K.board.reportsOnStep)}</span>
                    {board.issues.filter((i) => p.issueIds.includes(i.id)).slice(0, 4).map((i) => (
                      <span key={i.id} className="t-xs">{i.jobCode} · {i.reportedByName}: {i.description}</span>
                    ))}
                  </div>
                  <div>
                    <Button size="sm" variant={p.needsReview ? 'primary' : 'secondary'} onClick={() => setReviewing(p)}>
                      {t(K.board.review)}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
          {board.categories.length > 0 && (
            <Card>
              <div className="stack gap-2">
                <h3 className="t-md t-semibold">{t(K.board.categories)}</h3>
                <p className="t-xs t-muted">{t(K.board.categoriesIntro)}</p>
                {board.categories.map((c) => (
                  <div key={c.category} className="row between gap-2">
                    <span className="t-sm">{t(K.category[c.category])}</span>
                    <span className="t-sm t-mono">{c.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
      <PatternReview open={!!reviewing} onClose={() => setReviewing(null)} s={s} pattern={reviewing} t={t} />
    </Screen>
  );
}

function PatternReview({ open, onClose, s, pattern, t }: { open: boolean; onClose: () => void; s: IssueState; pattern: IssueBoardView['patterns'][number] | null; t: T }) {
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>('sop_updated');
  if (!pattern) return null;
  return (
    <WriteSheet open={open} onClose={onClose} title={t(K.board.reviewTitle)} label={t(K.board.reviewNote)} hint={t(K.board.reviewNoteHint, { count: NOTE_MIN })} confirm={t(K.board.reviewSave)} busy={s.busy} t={t} onSubmit={(n) => s.reviewPattern(pattern.stepId, outcome, n)}>
      <p className="t-sm">{t(K.board.reviewIntro, { step: pattern.stepLabelKey ? t(pattern.stepLabelKey) : pattern.stepId, reports: pattern.reports, jobs: pattern.jobs })}</p>
      <div className="stack gap-1">
        <strong className="t-sm">{t(K.board.reviewOutcome)}</strong>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.board.reviewOutcome)}>
          {OUTCOMES.map((o) => (
            <Chip key={o} pressed={outcome === o} onClick={() => setOutcome(o)}>
              {t(K.board.outcome[o])}
            </Chip>
          ))}
        </div>
      </div>
    </WriteSheet>
  );
}
