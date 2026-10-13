import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowClockwise, CaretRight, ChatsCircle, CheckCircle, CloudCheck, CloudSlash, Compass, Cube, DownloadSimple, GraduationCap, HardHat, Lock, PlayCircle, Trash, Warning } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, SegBar, Select, Sheet, formatDate } from '@/design-system';
import type { TrainingModuleView } from '@/data/repository';
import type { TrainingTopic } from '@/data/types';
import { LIB_KEYS as K, SCOPES, STATUS_FILTERS, TOPICS, contentKey, sopPath, assessmentPath, certificationsPath } from './training-library.types';
import { useTrainingLibrary } from './useTrainingLibrary';
import type { TrainingLibraryState } from './useTrainingLibrary';

type T = ReturnType<typeof useTranslation>['t'];
const TOPIC_ICON: Record<TrainingTopic, ReactNode> = {
  onboarding: <Compass size={20} aria-hidden="true" />,
  safety: <HardHat size={20} aria-hidden="true" />,
  customer: <ChatsCircle size={20} aria-hidden="true" />,
  product: <Cube size={20} aria-hidden="true" />,
};
const STATUS_TONE = { not_started: 'neutral', in_progress: 'accent', completed: 'success', update_needed: 'warning' } as const;
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const sizeText = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
const titleOf = (t: T, m: { code: string }) => t(contentKey(m.code, 'title'), { defaultValue: m.code });

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>{children}</div>;
}

/**
 * Screen 151 — Training Module Library. A partner's own curriculum: what their role requires and how far along they are, grouped by topic, with
 * what is locked behind what, what changed since they last learned it, and what is saved on the phone for the field. For a technician it also says
 * plainly whether training is what stands between them and being given a job.
 */
export function TrainingLibraryScreen() {
  const { t } = useTranslation();
  const s = useTrainingLibrary();
  const v = s.view;
  if (s.state === 'loading' && !v) return <Screen width="default"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="list" rows={6} /></Screen>;
  if (s.state === 'error' || !v) return <Screen width="default"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;

  const words = s.query.trim().toLowerCase();
  const shown = v.modules.filter((m) => {
    if (s.topic !== 'all' && m.topic !== s.topic) return false;
    if (s.statusFilter === 'pending' && !(m.status === 'not_started' || m.status === 'update_needed')) return false;
    if (s.statusFilter === 'in_progress' && m.status !== 'in_progress') return false;
    if (s.statusFilter === 'completed' && m.status !== 'completed') return false;
    if (words && !`${m.code} ${t(contentKey(m.code, 'title'), { defaultValue: '' })} ${t(contentKey(m.code, 'summary'), { defaultValue: '' })}`.toLowerCase().includes(words)) return false;
    return true;
  });
  const groups = TOPICS.map((topic) => ({ topic, items: shown.filter((m) => m.topic === topic) })).filter((g) => g.items.length > 0);

  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      {(!s.online || s.fromCache) && (
        <p className="t-sm row gap-2" role="status" data-offline-banner style={{ alignItems: 'center', color: 'var(--color-warning)' }}>
          <CloudSlash size={16} aria-hidden="true" /> {s.fromCache ? t(K.offline.cached) : t(K.offline.banner)}
        </p>
      )}
      <div className="stack gap-3">
        <Hero s={s} t={t} />
        <Gate s={s} t={t} />
        {v.person.roles.includes('technician') && (
          <Card>
            <div className="row between gap-3 wrap" data-sop-link style={{ alignItems: 'center' }}>
              <span className="stack grow"><strong className="t-sm">{t(K.sop.heading)}</strong><span className="t-xs t-muted">{t(K.sop.body)}</span></span>
              <Button size="sm" variant="secondary" onClick={() => s.goto(sopPath)}>{t(K.sop.open)}</Button>
            </div>
          </Card>
        )}
        <Controls s={s} t={t} />
        {v.modules.length === 0 ? (
          <EmptyState icon={<GraduationCap size={28} />} title={t(K.empty.title)} body={t(K.empty.body)} />
        ) : shown.length === 0 ? (
          <EmptyState icon={<GraduationCap size={28} />} title={t(K.noMatch.title)} body={t(K.noMatch.body)} actionLabel={t(K.noMatch.action)} onAction={s.clear} />
        ) : (
          <div className="stack gap-4" data-library>
            {groups.map((g) => {
              const req = v.byTopic[g.topic];
              return (
                <section key={g.topic} className="stack gap-2" data-topic={g.topic}>
                  <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
                    <h2 className="t-lg">{t(K.topic[g.topic])}</h2>
                    <span className="t-xs t-muted">{req.required > 0 ? t(K.group.progress, { done: req.completed, total: req.required }) : t(K.group.none)}</span>
                  </div>
                  <div className="grid-auto" style={{ '--min': '340px', alignItems: 'start' } as React.CSSProperties}>
                    {g.items.map((m, i) => <ModuleRow key={m.id} m={m} t={t} s={s} index={i} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
      <DetailSheet s={s} t={t} />
    </Screen>
  );
}

function Hero({ s, t }: { s: TrainingLibraryState; t: T }) {
  const v = s.view as NonNullable<TrainingLibraryState['view']>;
  const c = v.curriculum;
  return (
    <Card>
      <div className="stack gap-2" data-hero>
        <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
          <strong className="t-md">{t(K.hero.heading)}</strong>
          <span className="t-xs t-muted">{v.person.roles.map((r) => t(K.role[r])).join(' · ')}</span>
        </div>
        {c.required === 0 ? <p className="t-sm t-muted">{t(K.hero.nothing)}</p> : (
          <>
            <ProgressBar value={c.percent / 100} tone={c.percent === 100 ? 'success' : 'accent'} label={t(K.hero.heading)} />
            <div className="row between gap-2 wrap">
              <span className="t-sm" data-hero-done>{t(K.hero.done, { done: c.completed, total: c.required })}</span>
              <span className="t-xs t-muted">{c.minutesLeft > 0 ? t(K.hero.left, { minutes: c.minutesLeft }) : t(K.hero.allDone)}</span>
            </div>
            <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} data-certs-link onClick={() => s.goto(certificationsPath)}>{t(K.hero.certs)}</Button>
            {c.updateNeeded > 0 && <p className="t-xs" style={{ color: 'var(--color-warning)' }} data-hero-update>{t(K.hero.updateNeeded, { count: c.updateNeeded })}</p>}
          </>
        )}
      </div>
    </Card>
  );
}

function Gate({ s, t }: { s: TrainingLibraryState; t: T }) {
  const g = (s.view as NonNullable<TrainingLibraryState['view']>).jobGate;
  if (!g.applies) return null;
  return (
    <Card>
      <div className="stack gap-1" data-gate={g.cleared ? 'cleared' : 'blocked'}>
        <span className="row gap-2" style={{ alignItems: 'center' }}>
          {g.cleared ? <CheckCircle size={18} weight="fill" aria-hidden="true" style={{ color: 'var(--color-success)' }} /> : <Warning size={18} weight="fill" aria-hidden="true" style={{ color: 'var(--color-warning)' }} />}
          <strong className="t-sm">{t(K.gate.heading)}</strong>
        </span>
        <p className="t-sm">{g.cleared ? t(K.gate.cleared) : t(K.gate.blocked, { count: g.missing.length })}</p>
        {!g.cleared && (
          <div className="row gap-2 wrap">
            {g.missing.map((m) => {
              const row = (s.view as NonNullable<TrainingLibraryState['view']>).modules.find((x) => x.id === m.id);
              return <Chip key={m.id} onClick={() => s.openModule(m.id)}>{row ? titleOf(t, row) : m.code}{m.needs === 'test' ? ` · ${t(K.gate.test)}` : ''}</Chip>;
            })}
          </div>
        )}
        {!g.cleared && <span className="t-xs t-muted">{t(K.gate.first)}</span>}
      </div>
    </Card>
  );
}

function Controls({ s, t }: { s: TrainingLibraryState; t: T }) {
  return (
    <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-controls>
      <Field label={t(K.search.label)}>{(p) => <Input id={p.id} type="search" value={s.query} placeholder={t(K.search.placeholder)} onChange={(e) => s.setQuery(e.target.value)} data-f="search" autoComplete="off" />}</Field>
      <SegBar label={t(K.scope.label)} value={s.scope} onChange={s.setScope} items={SCOPES.map((x) => ({ id: x, label: t(K.scope[x]) }))} />
      <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 2 }} role="group" aria-label={t(K.topic.all)}>
        {(['all', ...TOPICS] as const).map((x) => <span key={x} data-topic-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.topic === x} onClick={() => s.setTopic(x)}>{t(K.topic[x])}</Chip></span>)}
      </div>
      <Field label={t(K.statusFilter.label)}>{(p) => <Select id={p.id} value={s.statusFilter} onChange={(e) => s.setStatusFilter(e.target.value)} data-f="status">{STATUS_FILTERS.map((x) => <option key={x} value={x}>{t(K.statusFilter[x])}</option>)}</Select>}</Field>
    </div>
  );
}

function StatusIcon({ m }: { m: TrainingModuleView }) {
  if (m.status === 'completed') return <CheckCircle size={22} weight="fill" aria-hidden="true" style={{ color: 'var(--color-success)' }} />;
  if (m.lockedBy.length > 0) return <Lock size={20} aria-hidden="true" style={{ color: 'var(--color-text-muted)' }} />;
  if (m.status === 'update_needed') return <ArrowClockwise size={20} aria-hidden="true" style={{ color: 'var(--color-warning)' }} />;
  return <CaretRight size={16} aria-hidden="true" />;
}

function ModuleRow({ m, t, s, index }: { m: TrainingModuleView; t: T; s: TrainingLibraryState; index: number }) {
  const { i18n } = useTranslation();
  return (
    <Card riseIndex={Math.min(index, 8)} onClick={() => s.openModule(m.id)}>
      <div className="stack gap-2" data-module={m.code} data-status={m.status} data-locked={m.lockedBy.length > 0 ? '1' : '0'}>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <span aria-hidden="true" style={{ color: 'var(--color-accent-primary)' }}>{TOPIC_ICON[m.topic]}</span>
          <span className="stack grow" style={{ minWidth: 0 }}>
            <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{titleOf(t, m)}</strong>
            <span className="t-xs t-muted">{t(contentKey(m.code, 'summary'), { defaultValue: '' })}</span>
          </span>
          <StatusIcon m={m} />
        </div>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone={STATUS_TONE[m.status]}>{t(K.status[m.status])}</Badge>
          {m.required ? <Badge tone="accent">{t(K.row.required)}</Badge> : <Badge tone="neutral">{t(K.row.optional)}</Badge>}
          {m.gatesJobAssignment && m.required && <Badge tone="warning">{t(K.row.gates)}</Badge>}
          {m.lockedBy.length > 0 && <Badge tone="neutral">{t(K.row.locked)}</Badge>}
          {m.updatedSince && <Badge tone="emerald">{t(K.row.updated)}</Badge>}
          {!m.forMe && <Badge tone="neutral">{t(K.row.otherRole)}</Badge>}
          {!m.hasContent && <Badge tone="neutral">{t(K.row.soon)}</Badge>}
          {m.assessment?.state === 'certified' && <Badge tone="success">{t(K.row.certified)}</Badge>}
          {(m.assessment?.state === 'to_take' || m.assessment?.state === 'in_progress') && <Badge tone="accent">{t(K.row.testToTake)}</Badge>}
          {m.assessment?.state === 'cooldown' && <Badge tone="neutral">{t(K.row.testWait)}</Badge>}
          {m.assignment && m.status !== 'completed' && <Badge tone="warning" data-assigned>{t(K.row.assigned, { date: formatDate(m.assignment.dueDate, i18n.language) })}</Badge>}
          {s.isSaved(m) && <Badge tone="success">{t(K.row.saved)}</Badge>}
          <span className="t-xs t-muted">{t(K.row.minutes, { count: m.minutes })} · {t(K.row.lessons, { count: m.lessons })}</span>
        </div>
        {m.status === 'in_progress' && <ProgressBar value={m.percent / 100} label={titleOf(t, m)} />}
      </div>
    </Card>
  );
}

function DetailSheet({ s, t }: { s: TrainingLibraryState; t: T }) {
  const { i18n } = useTranslation();
  const m = s.open;
  const [problem, setProblem] = useState<string | null>(null);
  const view = s.view;
  return (
    <Sheet open={!!m} onClose={() => { setProblem(null); s.closeModule(); }} title={m ? titleOf(t, m) : t(K.title)} closeLabel={t(K.close)}>
      {m && view && (
        <div className="stack gap-3" data-detail={m.code}>
          <div className="row gap-2 wrap">
            <Badge tone={STATUS_TONE[m.status]}>{t(K.status[m.status])}</Badge>
            {m.required ? <Badge tone="accent">{t(K.row.required)}</Badge> : <Badge tone="neutral">{t(K.row.optional)}</Badge>}
            {m.gatesJobAssignment && <Badge tone="warning">{t(K.row.gates)}</Badge>}
          </div>
          <p className="t-sm">{t(contentKey(m.code, 'summary'), { defaultValue: '' })}</p>
          <dl className="stack gap-1 t-sm" aria-label={t(K.detail.facts)} data-facts>
            <div className="row between"><dt className="t-muted">{t(K.detail.duration)}</dt><dd>{t(K.row.minutes, { count: m.minutes })}</dd></div>
            <div className="row between"><dt className="t-muted">{t(K.detail.lessons)}</dt><dd>{t(K.row.lessons, { count: m.lessons })}</dd></div>
            <div className="row between"><dt className="t-muted">{t(K.detail.version)}</dt><dd>{m.version}</dd></div>
            <div className="row between"><dt className="t-muted">{t(K.detail.forRoles)}</dt><dd>{m.forRoles.map((r) => t(K.role[r])).join(' · ')}</dd></div>
            {m.status === 'in_progress' && <div className="row between"><dt className="t-muted">{t(K.detail.progress, { done: m.lessonsDone, total: m.lessons })}</dt><dd>{m.percent}%</dd></div>}
            {m.completedAt && <div className="row between"><dt className="t-muted">{t(K.detail.completedOn)}</dt><dd>{formatDate(m.completedAt, i18n.language)}</dd></div>}
          </dl>
          {m.gatesJobAssignment && <p className="t-xs t-muted">{t(K.detail.gatesBody)}</p>}
          {(m.updatedSince || m.status === 'update_needed') && m.changeKey && (
            <Card>
              <div className="stack gap-1" data-changed>
                <strong className="t-sm">{t(m.status === 'update_needed' ? K.detail.retake : K.detail.changed)}</strong>
                <p className="t-sm">{t(contentKey(m.code, 'change2'), { defaultValue: '' })}</p>
                {m.completedVersion !== null && <span className="t-xs t-muted">{t(K.detail.changedSince, { version: m.completedVersion })}</span>}
              </div>
            </Card>
          )}
          {m.lockedBy.length > 0 && (
            <Card>
              <div className="stack gap-2" data-locked-by>
                <span className="row gap-2" style={{ alignItems: 'center' }}><Lock size={16} aria-hidden="true" /><strong className="t-sm">{t(K.detail.buildsOn)}</strong></span>
                <p className="t-sm">{t(K.detail.lockedBody)}</p>
                <div className="row gap-2 wrap">
                  {m.lockedBy.map((l) => <Chip key={l.id} onClick={() => s.openModule(l.id)}>{t(contentKey(l.code, 'title'), { defaultValue: l.code })}</Chip>)}
                </div>
                <span className="t-xs t-muted">{t(K.detail.openFirst)}</span>
              </div>
            </Card>
          )}
          {!m.forMe && <p className="t-xs t-muted" data-not-for-you>{t(K.detail.notForYou)}</p>}
          {!m.hasContent && <p className="t-xs t-muted" data-soon>{t(K.detail.soonBody)}</p>}
          {m.assignment && m.status !== 'completed' && <p className="t-sm" data-assigned-note>{t(K.detail.assignedBody, { by: m.assignment.byName, date: formatDate(m.assignment.dueDate, i18n.language) })}{m.assignment.note ? ` “${m.assignment.note}”` : ''}</p>}
          {m.assessment && (
            <Card>
              <div className="stack gap-2" data-test={m.assessment.state}>
                <strong className="t-sm">{t(K.detail.testHeading)}</strong>
                <p className="t-sm">{t(K.detail.testBody[m.assessment.state], { percent: m.assessment.passPercent })}</p>
                {m.assessment.state !== 'locked' && <Button size="sm" variant={m.assessment.state === 'certified' ? 'secondary' : 'primary'} style={{ width: 'fit-content' }} data-open-test onClick={() => s.goto(assessmentPath(m.id))}>{t(K.detail.testOpen)}</Button>}
              </div>
            </Card>
          )}
          <div className="stack gap-1" data-offline-copy>
            {s.isSaved(m) ? (
              <>
                <span className="row gap-2 t-sm" style={{ alignItems: 'center' }}><CloudCheck size={16} aria-hidden="true" style={{ color: 'var(--color-success)' }} />{t(K.offlineCopy.saved)}</span>
                {s.savedStale(m) && <span className="t-xs" style={{ color: 'var(--color-warning)' }} data-stale>{t(K.offlineCopy.stale)}</span>}
                <div className="row gap-2 wrap">
                  {s.savedStale(m) && <Button size="sm" variant="secondary" icon={<DownloadSimple size={16} />} disabled={!s.online} data-save onClick={async () => { const r = await s.saveOffline(m); if (!r.ok) setProblem(r.code ?? 'generic'); }}>{t(K.offlineCopy.save)}</Button>}
                  <Button size="sm" variant="ghost" icon={<Trash size={16} />} data-remove-offline onClick={() => s.removeOffline(m)}>{t(K.offlineCopy.remove)}</Button>
                </div>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} icon={<DownloadSimple size={16} />} disabled={!s.online || !m.hasContent} data-save onClick={async () => { const r = await s.saveOffline(m); if (!r.ok) setProblem(r.code ?? 'generic'); }}>{t(K.offlineCopy.save)} · {sizeText(m.offlineKb)}</Button>
                <span className="t-xs t-muted">{s.online ? t(K.offlineCopy.hint) : t(K.offlineCopy.needsSignal)}</span>
              </>
            )}
          </div>
          {m.hasContent && m.status !== 'not_started' && <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} data-give-feedback onClick={() => s.goto(`/training-feedback/${m.id}`)}>{t('trainingFeedback.link.give')}</Button>}
          {problem && <p className="t-xs t-error" role="alert" data-problem={problem}>{t(problemKey(problem))}</p>}
          <Footer>
            <Button variant="ghost" onClick={() => { setProblem(null); s.closeModule(); }}>{t(K.close)}</Button>
            <Button
              icon={<PlayCircle size={18} />}
              disabled={s.busy || m.lockedBy.length > 0 || !m.forMe || !m.hasContent}
              data-begin
              onClick={async () => { const r = await s.begin(m); if (!r.ok) setProblem(r.code ?? 'generic'); }}
            >
              {m.status === 'completed' ? t(K.detail.review) : m.status === 'in_progress' ? t(K.detail.continue) : m.status === 'update_needed' ? t(K.detail.retakeButton) : t(K.detail.start)}
            </Button>
          </Footer>
        </div>
      )}
    </Sheet>
  );
}
