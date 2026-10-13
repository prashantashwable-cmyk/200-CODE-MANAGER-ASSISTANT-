import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Eye, EyeSlash, Flag, ShieldCheck, WifiSlash } from '@phosphor-icons/react';
import { AscensionLine, Avatar, Badge, Button, Card, EmptyState, ErrorState, Field, ListRow, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, StatTile, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { InstallTimelineView, TimelineListItem, TimelineMilestone } from '@/data/repository';
import { useInstallTimeline } from './useInstallTimeline';
import type { TimelineState } from './useInstallTimeline';
import { TIMELINE_KEYS as K, homePathOf, jobPath, listPath, timelinePath } from './install-timeline.types';

type T = ReturnType<typeof useTranslation>['t'];

const REASON_MIN = 8;
const STEP_TONE: Record<string, BadgeTone> = { complete: 'success', current: 'accent', upcoming: 'neutral', blocked: 'warning' };
const SEV_TONE: Record<string, BadgeTone> = { minor: 'neutral', blocking: 'warning', safety: 'error' };

/**
 * Screen 129 — Installation Progress Timeline. The Ascension Line made literal: one rail of milestones, solid once done, outlined for the
 * stage being worked on, hollow for what is ahead, each with the date it was done and, for what is ahead, the date it is now expected.
 * The customer sees plain milestones and an honest date with a tactful reason; the technician and Admin see the same rail with the
 * procedure steps, reports, team and activity behind each milestone.
 */
export function InstallTimelineScreen() {
  const { t } = useTranslation();
  const s = useInstallTimeline();

  if (!s.jobId) return <ListScreen s={s} t={t} />;
  if (s.status === 'loading' && !s.view) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'not_found') {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(s.role === 'technician' ? '/technician' : listPath)} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }
  return <JobTimeline s={s} v={s.view} t={t} />;
}

/* ---------------------------------------------------------------- list */

function ListScreen({ s, t }: { s: TimelineState; t: T }) {
  const { i18n } = useTranslation();
  if (s.status === 'loading' || (s.status === 'ready' && !s.list)) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.listTitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.list) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.listTitle)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.listTitle)} />
      {s.list.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
          {s.list.map((row) => (
            <ListCard key={row.jobId} row={row} t={t} lang={i18n.language} onOpen={() => s.goto(timelinePath(row.jobId))} />
          ))}
        </div>
      )}
    </Screen>
  );
}

function ListCard({ row, t, lang, onOpen }: { row: TimelineListItem; t: T; lang: string; onOpen: () => void }) {
  return (
    <Card>
      <div className="stack gap-3" data-job={row.jobId}>
        <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="stack gap-1">
            <strong className="t-sm">{row.siteName}</strong>
            <span className="t-xs t-muted">{row.code}</span>
          </div>
          <Badge tone={row.status === 'completed' ? 'success' : row.blocked ? 'warning' : 'accent'} dot>
            {t(K.jobStatus[row.status])}
          </Badge>
        </div>
        <ProgressBar value={row.percent / 100} label={t(K.progress.label)} tone={row.blocked ? 'warning' : row.status === 'completed' ? 'success' : 'accent'} />
        <div className="row gap-2 wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="t-sm">{row.hiddenFromCustomer ? t(K.list.hiddenRow) : row.status === 'completed' ? t(K.list.row, { percent: row.percent }) : t(K.list.expected, { date: row.currentAt ? formatDate(row.currentAt, lang) : '—' })}</span>
          {row.slipped && row.status !== 'completed' && !row.hiddenFromCustomer && <Badge tone="warning">{t(K.list.slip, { count: row.slipDays })}</Badge>}
        </div>
        <Button size="sm" variant="secondary" onClick={onOpen} style={{ width: 'fit-content' }}>
          {t(K.list.open)}
        </Button>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- one job */

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

function JobTimeline({ s, v, t }: { s: TimelineState; v: InstallTimelineView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const staff = v.audience === 'staff';
  const customer = !staff;
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  if (customer && v.hiddenFromCustomer) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} subtitle={`${v.job.siteName} · ${v.job.code}`} />
        <EmptyState title={t(K.hidden.title)} body={t(K.hidden.body)} />
      </Screen>
    );
  }

  const label = (phase: string) => t(K.milestone[phase as keyof typeof K.milestone]);
  const doneMilestones = v.milestones.filter((m) => m.status === 'done');
  const currentMilestone = v.milestones.find((m) => m.status === 'current') ?? null;
  const lastDone = doneMilestones[doneMilestones.length - 1] ?? null;

  const metaOf = (m: TimelineMilestone): string => {
    const parts: string[] = [];
    if (m.status === 'done' && m.doneAt) {
      parts.push(t(K.rail.doneOn, { date: formatDate(m.doneAt, lang) }));
      if (m.slipDays >= 1) parts.push(t(K.rail.firstPlanned, { date: formatDate(m.originalAt, lang) }));
    } else if (m.blocked) {
      parts.push(t(K.rail.paused));
      if (m.expectedAt) parts.push(t(K.rail.notBefore, { date: formatDate(m.expectedAt, lang) }));
    } else if (m.expectedAt) {
      parts.push(t(K.rail.expectedOn, { date: formatDate(m.expectedAt, lang) }));
      if (m.slipDays >= 1) parts.push(t(K.rail.firstPlanned, { date: formatDate(m.originalAt, lang) }));
    }
    if (staff) parts.push(t(K.rail.stepsOf, { done: m.stepsDone, total: m.stepsTotal }));
    else if (m.evidenceCount > 0 && m.status !== 'upcoming') parts.push(t(K.rail.photos, { count: m.evidenceCount }));
    return parts.join(' · ');
  };

  const rail: AscensionStep[] = v.milestones.map((m) => ({
    id: m.phase,
    label: label(m.phase),
    meta: metaOf(m),
    status: m.blocked ? 'blocked' : m.status === 'done' ? 'complete' : m.status === 'current' ? 'current' : 'upcoming',
  }));

  const hero = (() => {
    const params = { milestone: label((v.freshness === 'just_completed' ? lastDone : currentMilestone)?.phase ?? 'preparation'), date: formatDate(v.job.completedAt ?? v.job.scheduledFor, lang), when: v.lastUpdateAt ? formatDateTime(v.lastUpdateAt, lang) : '—' };
    return { title: t(K.hero[v.freshness], params), sub: t(K.heroSub[v.freshness], params) };
  })();

  const e = v.estimate;
  const finished = v.job.status === 'completed';
  const reasonText = (code: string) => t(staff ? K.reason.staff[code as keyof typeof K.reason.staff] : K.reason.customer[code as keyof typeof K.reason.customer]);
  const shownReasons = v.reasons.filter((r) => r.open || v.estimate?.slipped);

  const submitVisibility = async (visible: boolean) => {
    if (!visible && reason.trim().length < REASON_MIN) {
      setProblem(t(K.visibility.reasonRequired));
      return;
    }
    const r = await s.setVisible(visible, reason);
    if (r.ok) {
      setAsking(false);
      setReason('');
      setProblem(null);
    } else setProblem(t(K.visibility.reasonRequired));
  };

  return (
    <Screen width="default">
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={() => s.goto(s.role === 'technician' ? jobPath(v.job.id) : listPath)} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />
      {(!s.isOnline || s.stale) && (
        <p className="t-xs t-muted row gap-2 mb-3" style={{ alignItems: 'center' }} role="status">
          <WifiSlash size={14} aria-hidden="true" /> {t(K.offline)}
        </p>
      )}

      <Card className="mb-4">
        <div className="stack gap-3" data-freshness={v.freshness}>
          <div className="stack gap-1">
            <h2 className="t-lg t-semibold" role="status">
              {hero.title}
            </h2>
            <p className="t-sm t-muted">{hero.sub}</p>
          </div>
          {finished && (s.role === 'customer' || s.role === 'admin') && <Button variant="secondary" style={{ width: 'fit-content' }} data-certificate-link onClick={() => s.goto(`/handover-certificate/${v.job.id}`)}>{t(K.certificate)}</Button>}
          <ProgressBar value={v.progress.percent / 100} label={t(K.progress.label)} tone={finished ? 'success' : v.freshness === 'blocked' ? 'warning' : 'accent'} />
          <div className="grid-auto" style={{ ['--min' as string]: '160px' }}>
            <StatTile label={t(K.progress.label)} value={<span className="num">{v.progress.percent}%</span>} />
            {e && (
              <StatTile
                label={t(finished ? K.estimate.tileDone : e.atLeast ? K.estimate.tileNotBefore : K.estimate.tileExpected)}
                value={<span className="num" data-estimate>{formatDate(e.currentAt, lang)}</span>}
              />
            )}
            {staff && <StatTile label={t(K.progress.steps)} value={<span className="num">{`${v.progress.stepsDone}/${v.progress.stepsTotal}`}</span>} />}
          </div>
          {e && (
            <div className="stack gap-1" data-estimate-note>
              {e.slipped ? (
                <p className="t-sm row gap-2" style={{ alignItems: 'center' }}>
                  <Badge tone="warning">{t(K.estimate.later, { count: Math.abs(e.slipDays) })}</Badge>
                  <span>{t(K.estimate.firstPlanned, { date: formatDate(e.originalAt, lang) })}</span>
                </p>
              ) : e.slipDays <= -1 && !finished ? (
                <p className="t-sm row gap-2" style={{ alignItems: 'center' }}>
                  <Badge tone="success">{t(K.estimate.earlier, { count: Math.abs(e.slipDays) })}</Badge>
                  <span>{t(K.estimate.firstPlanned, { date: formatDate(e.originalAt, lang) })}</span>
                </p>
              ) : !finished ? (
                <p className="t-sm t-muted">{t(K.estimate.onTrack)}</p>
              ) : null}
              {staff && (
                <p className="t-xs t-muted">
                  {t(e.basis === 'typical' ? K.estimate.basisTypical : K.estimate.basisDefault, { days: e.plannedDays })}
                  {e.pace !== null && !finished ? ` · ${t(K.estimate.pace, { pace: e.pace })}` : ''}
                </p>
              )}
            </div>
          )}
          {shownReasons.length > 0 && !finished && (
            <div className="stack gap-1" data-reasons>
              <strong className="t-xs">{t(K.reason.heading)}</strong>
              <ul className="stack gap-1">
                {shownReasons.map((r) => (
                  <li key={r.code} className="t-sm row gap-2" style={{ alignItems: 'flex-start' }}>
                    <Badge tone={r.open ? 'warning' : 'neutral'}>{t(r.open ? K.reason.open : K.reason.past)}</Badge>
                    <span>{reasonText(r.code)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      <div className="main-aside">
        <div className="stack gap-4">
          <Section title={t(K.rail.heading)}>
            {v.milestones.length === 0 ? (
              <p className="t-sm t-muted">{t(K.empty.body)}</p>
            ) : (
              <Card>
                <AscensionLine steps={rail} className="ds-ascension--multiline" />
              </Card>
            )}
          </Section>

          {staff && (
            <Section title={t(K.detail.heading)} hint={t(K.detail.note)}>
              <div className="stack gap-3">
                {v.milestones.map((m) => (
                  <MilestoneDetail key={m.phase} m={m} label={label(m.phase)} t={t} lang={lang} />
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="stack gap-4">
          {customer && (
            <Card>
              <p className="t-sm t-muted">{t(K.customerNote)}</p>
            </Card>
          )}
          {v.canToggleVisibility && (
            <Section title={t(K.visibility.heading)}>
              <Card>
                <div className="stack gap-2" data-visibility={v.hiddenFromCustomer ? 'hidden' : 'visible'}>
                  <p className="t-sm row gap-2" style={{ alignItems: 'center' }}>
                    {v.hiddenFromCustomer ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />} {t(v.hiddenFromCustomer ? K.visibility.hiddenState : K.visibility.visible)}
                  </p>
                  <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => (v.hiddenFromCustomer ? void submitVisibility(true) : setAsking(true))} disabled={s.busy}>
                    {t(v.hiddenFromCustomer ? K.visibility.show : K.visibility.hide)}
                  </Button>
                </div>
              </Card>
            </Section>
          )}
          {staff && v.team.length > 0 && (
            <Section title={t(K.team.heading)} hint={t(K.team.note)}>
              <Card flush>
                {v.team.map((p) => (
                  <ListRow
                    key={p.userId}
                    leading={<Avatar name={p.name} size="sm" />}
                    title={p.name}
                    subtitle={`${t(p.role === 'lead' ? K.team.lead : K.team.assistant)} · ${p.owned === null ? t(K.team.wholeJob, { done: p.ownedDone, total: v.progress.stepsTotal }) : t(K.team.owned, { done: p.ownedDone, total: p.owned })} · ${t(K.team.completedBy, { count: p.completedByThem })}`}
                    trailing={p.onSiteNow ? <Badge tone="success" dot>{t(K.team.onSite)}</Badge> : undefined}
                  />
                ))}
              </Card>
            </Section>
          )}
          {staff && (
            <Section title={t(K.events.heading)}>
              {v.events.length === 0 ? (
                <p className="t-sm t-muted">{t(K.events.empty)}</p>
              ) : (
                <Card flush>
                  {v.events.map((ev) => (
                    <ListRow
                      key={ev.id}
                      leading={ev.kind === 'issue_reported' ? <Flag size={18} aria-hidden="true" color={ev.severity === 'safety' ? 'var(--color-error)' : undefined} /> : ev.kind === 'issue_resolved' ? <ShieldCheck size={18} aria-hidden="true" /> : <CheckCircle size={18} aria-hidden="true" />}
                      title={ev.kind === 'step_done' && ev.labelKey ? `${t(K.events.step_done)}: ${t(ev.labelKey)}` : ev.code ? `${t(K.events[ev.kind])} · ${ev.code}` : t(K.events[ev.kind])}
                      subtitle={`${formatDateTime(ev.at, lang)}${ev.byName ? ` · ${t(K.events.by, { name: ev.byName })}` : ''}`}
                    />
                  ))}
                </Card>
              )}
            </Section>
          )}
        </div>
      </div>

      <Sheet open={asking} onClose={() => setAsking(false)} title={t(K.visibility.title)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <p className="t-sm">{t(K.visibility.body)}</p>
          <Field label={t(K.visibility.reason)} required error={problem ?? undefined}>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={reason} onChange={(ev) => setReason(ev.target.value)} />}
          </Field>
          <div className="row gap-2 wrap">
            <Button variant="secondary" onClick={() => setAsking(false)}>
              {t(K.visibility.cancel)}
            </Button>
            <Button disabled={reason.trim().length < REASON_MIN || s.busy} onClick={() => void submitVisibility(false)} data-hide-go>
              {t(K.visibility.confirmHide)}
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}

/** The procedure steps and reports behind one milestone. The current stage is open; the rest fold away. */
function MilestoneDetail({ m, label, t, lang }: { m: TimelineMilestone; label: string; t: T; lang: string }) {
  const openIssues = m.issues.filter((i) => i.status === 'open').length;
  return (
    <Card>
      <details open={m.status === 'current' || openIssues > 0} data-milestone={m.phase}>
        <summary className="row gap-2" style={{ cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <span className="t-sm t-semibold">{label}</span>
          <span className="row gap-2" style={{ alignItems: 'center' }}>
            {openIssues > 0 && <Badge tone="warning">{t(K.detail.openIssues, { count: openIssues })}</Badge>}
            <Badge tone={m.status === 'done' ? 'success' : m.status === 'current' ? 'accent' : 'neutral'}>{t(K.status[m.blocked ? 'blocked' : m.status])}</Badge>
          </span>
        </summary>
        <div className="stack gap-3 mt-3">
          {m.steps.length === 0 ? (
            <p className="t-xs t-muted">{t(K.detail.noSteps)}</p>
          ) : (
            <ul className="stack gap-2">
              {m.steps.map((st) => (
                <li key={st.id} className="stack gap-1" data-step={st.id}>
                  <div className="row gap-2 wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="t-sm">{t(st.labelKey)}</span>
                    <span className="row gap-1 wrap">
                      {st.safetyCritical && <Badge tone="error">{t(K.detail.safety)}</Badge>}
                      <Badge tone={STEP_TONE[st.status] ?? 'neutral'}>{st.notApplicable ? t(K.detail.notApplicable) : t(K.detail.stepStatus[st.status])}</Badge>
                    </span>
                  </div>
                  <p className="t-xs t-muted">
                    {st.completedAt ? `${formatDateTime(st.completedAt, lang)}${st.completedByName ? ` · ${t(K.detail.doneBy, { name: st.completedByName })}` : ''} · ` : ''}
                    {st.evidenceCount > 0 ? t(K.detail.evidence, { count: st.evidenceCount }) : t(K.detail.noEvidence)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {m.issues.length > 0 && (
            <div className="stack gap-1">
              <strong className="t-xs">{t(K.detail.issues)}</strong>
              {m.issues.map((i) => (
                <p key={i.id} className="t-xs row gap-2 wrap" style={{ alignItems: 'center' }}>
                  <Badge tone={SEV_TONE[i.severity] ?? 'neutral'}>{t(`issueReport.severity.${i.severity}`)}</Badge>
                  <span>{i.code} · {t(`issueReport.category.${i.category}`)} · {t(i.status === 'open' ? K.detail.open : K.detail.resolved)}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </details>
    </Card>
  );
}
