import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UsersThree, ArrowLeft, Camera, CheckCircle, CloudArrowUp, Flag, Images, ShieldCheck, Package, PauseCircle, ShieldWarning, VideoCamera, Warning, WifiSlash } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, EmptyState, ErrorState, Field, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { SopSlotView, SopStepView } from '@/data/repository';
import { NA_REASON_MIN } from '@/features/technician/installSop';
import type { InstallationSopState } from './useInstallationSopChecklist';
import { useInstallationSopChecklist } from './useInstallationSopChecklist';
import { SOP_KEYS as K, STEP_IDS, evidencePath, homePath, jobPath } from './installation-sop-checklist.types';

type T = ReturnType<typeof useTranslation>['t'];
type Slot = SopSlotView;

const hintKey = (id: string) => ((STEP_IDS as readonly string[]).includes(id) ? K.hint[id as (typeof STEP_IDS)[number]] : null);
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/**
 * Screen 123 — Installation SOP Checklist. The working record of the installation, under the central procedure: every step needs an
 * explicit "done", safety-critical steps (governor, buffers, rescue device, alarm, door sensors and the tests that prove them) cannot be
 * finished without their photos, and the job only reaches QC once every step is done with all its evidence. A step that does not apply is
 * set aside with a reason, distinct from one skipped; steps that do not depend on each other can be done in the order the site allows;
 * and nothing waits on the network: work is kept on the phone with the moment it was done, and sent when it can be.
 */
export function InstallationSopChecklistView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useInstallationSopChecklist();
  const lang = i18n.language;
  const [naFor, setNaFor] = useState<SopStepView | null>(null);
  const [naReason, setNaReason] = useState('');

  if (s.status === 'loading' && !s.view) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'not_found') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <EmptyState icon={<Package size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.back)} onAction={() => navigate(homePath)} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.view || !s.local) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const v = s.view;
  const shown = v.steps.find((x) => x.id === s.selectedId) ?? null;
  const working = v.job.status === 'in_progress';
  const notStarted = v.job.status === 'scheduled' || v.job.status === 'materials_pending' || v.job.status === 'on_hold';
  const waitingAdmin = working && v.awaitingAdmin.length > 0;
  const waitingSafety = working && v.awaitingAdmin.length === 0 && v.safetyOpen > 0;
  const finished = v.qcReady || (s.local.doneHere && working);

  const rail: AscensionStep[] = v.steps.map((x) => ({
    id: x.id,
    label: t(x.labelKey),
    meta: x.done ? (x.notApplicable ? t(K.step.naDone) : t(K.step.done)) : x.status === 'blocked' ? t(K.step.blocked) : x.status === 'current' ? t(K.step.next) : x.problem === 'depends_on' ? t(K.step.waiting, { steps: x.waitingFor.map((k) => t(k)).join(', ') }) : t(K.step.upcoming),
    status: x.done ? 'complete' : x.status,
    onClick: () => s.select(x.id),
    trailing: (
      <span className="row gap-1" style={{ alignItems: 'center' }}>
        {x.safetyCritical && <ShieldWarning size={14} color="var(--color-warning)" aria-label={t(K.step.safety)} />}
        {(s.local?.pendingSteps.has(x.id) || x.slots.some((sl) => s.local?.pendingSlots.has(`${x.id}:${sl.id}`))) && <CloudArrowUp size={14} aria-label={t(K.step.pending)} />}
      </span>
    ),
  }));

  const submitNa = () => {
    if (!naFor) return;
    s.markNa(naFor.id, naReason);
    setNaFor(null);
    setNaReason('');
  };

  return (
    <Screen width="wide" className={working && shown && !shown.done && shown.owner.isYou ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <div className="row gap-2 wrap" style={{ justifyContent: 'center' }}>
            <Button size="sm" variant="ghost" onClick={() => navigate(evidencePath(v.job.id))} icon={<Images size={16} aria-hidden="true" />}>
              {t(K.photo.gallery)}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/safety-checklist/${v.job.id}`)} icon={<ShieldCheck size={16} aria-hidden="true" />}>
              {t(K.safetyChecks)}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/job-issues/${v.job.id}`)} icon={<Flag size={16} aria-hidden="true" />}>
              {t(K.reportIssue)}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/material-usage/${v.job.id}`)} icon={<Package size={16} aria-hidden="true" />}>
              {t('materialLog.title')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/job-team/${v.job.id}`)} icon={<UsersThree size={16} aria-hidden="true" />}>
              {t('jobTeam.title')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(jobPath(v.job.id))} aria-label={t(K.back)}>
              <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
            </Button>
          </div>
        }
      />

      <SyncBanner s={s} t={t} />
      {s.failed.length > 0 && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
          <div className="stack gap-2" role="alert">
            <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}>
              <Warning size={18} color="var(--color-error)" aria-hidden="true" /> {t(K.failed.title)}
            </strong>
            {s.failed.map((f) => (
              <p key={f.id} className="t-sm">
                {t(K.failed.item, { step: f.stepId ? t(v.steps.find((x) => x.id === f.stepId)?.labelKey ?? K.title) : t(K.title), reason: t(errorKey(f.code)) })}
              </p>
            ))}
            <div>
              <Button size="sm" variant="secondary" onClick={s.dismissFailed}>
                {t(K.failed.dismiss)}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {notStarted && <StartCard s={s} t={t} lang={lang} onOpenJob={() => navigate(jobPath(v.job.id))} />}

      {finished && (
        <Card className="mb-3" style={{ borderColor: waitingAdmin || waitingSafety ? 'var(--color-warning)' : 'var(--color-success)' }}>
          <div className="row-top gap-3">
            <CheckCircle size={24} color="var(--color-success)" weight="fill" aria-hidden="true" />
            <div className="stack gap-1">
              <strong className="t-md">{t(K.finished.title)}</strong>
              <p className="t-sm">{waitingSafety ? t(K.finished.safety, { count: v.safetyOpen }) : t(waitingAdmin ? K.finished.admin : v.qcReady ? K.finished.body : K.finished.local)}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="main-aside">
        <div className="stack gap-3">
          {shown ? <StepCard step={shown} s={s} t={t} lang={lang} onNa={() => setNaFor(shown)} onCapture={(slotId) => navigate(evidencePath(v.job.id, shown.id, slotId))} /> : null}
        </div>
        <Card>
          <div className="stack gap-3">
            <div className="stack gap-1">
              <h2 className="t-md t-semibold">{t(K.rail.heading)}</h2>
              <ProgressBar value={v.progress.total ? v.progress.done / v.progress.total : 0} label={t(K.rail.progress, { done: v.progress.done, total: v.progress.total })} />
              <span className="t-xs t-muted">{t(K.rail.progress, { done: v.progress.done, total: v.progress.total })}</span>
            </div>
            <AscensionLine steps={rail} />
            {v.version && <p className="t-xs t-muted">{t(K.rail.version, { version: v.version.version, date: formatDate(v.version.effectiveFrom, lang) })}</p>}
          </div>
        </Card>
      </div>

      {working && shown && !shown.done && shown.owner.isYou && (
        <ActionBar>
          <ActionArea step={shown} s={s} t={t} onNa={() => setNaFor(shown)} />
        </ActionBar>
      )}

      <Sheet open={!!naFor} onClose={() => setNaFor(null)} title={t(K.na.title)} closeLabel={t('action.close')}>
        {naFor && (
          <div className="stack gap-3">
            <p className="t-sm">{t(naFor.applies ? K.na.intro : K.na.introConfig, { step: t(naFor.labelKey) })}</p>
            <Field label={t(K.na.reason)} hint={t(K.na.hint, { count: NA_REASON_MIN })} required>
              {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={naReason} onChange={(e) => setNaReason(e.target.value)} />}
            </Field>
            <Button disabled={naReason.trim().length < NA_REASON_MIN} onClick={submitNa}>
              {t(K.na.confirm)}
            </Button>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}

/* ---------------------------------------------------------------- pieces */

function SyncBanner({ s, t }: { s: InstallationSopState; t: T }) {
  const waiting = s.queue.length;
  if (s.isOnline && waiting === 0 && !s.storageFull) return null;
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
            <CloudArrowUp size={16} aria-hidden="true" /> {s.syncing ? t(K.sync.syncing, { count: waiting }) : t(K.sync.queued, { count: waiting })}
          </p>
        )}
        {s.storageFull && <p className="t-sm t-warning">{t(K.sync.storage)}</p>}
      </div>
    </Card>
  );
}

function StartCard({ s, t, lang, onOpenJob }: { s: InstallationSopState; t: T; lang: string; onOpenJob: () => void }) {
  const v = s.view!;
  const assistant = v.job.role === 'assistant';
  return (
    <Card className="mb-3" style={{ borderColor: v.startProblem === 'on_hold' ? 'var(--color-error)' : undefined }}>
      <div className="stack gap-2">
        <h2 className="t-md t-semibold">{t(K.start.heading)}</h2>
        {v.startProblem === 'on_hold' ? (
          <p className="t-sm t-error row-top gap-2">
            <PauseCircle size={18} className="shrink-0" aria-hidden="true" /> {t(K.start.hold, { reason: v.job.holdReason ?? '' })}
          </p>
        ) : v.startProblem === 'not_scheduled_yet' ? (
          <p className="t-sm t-warning row-top gap-2">
            <Package size={18} className="shrink-0" aria-hidden="true" /> {t(K.start.early, { date: formatDate(v.job.scheduledFor, lang) })}
          </p>
        ) : v.startProblem === 'materials_not_confirmed' ? (
          <>
            <p className="t-sm t-warning row-top gap-2">
              <Package size={18} className="shrink-0" aria-hidden="true" /> {t(K.start.materials)}
            </p>
            <div>
              <Button size="sm" variant="secondary" onClick={onOpenJob}>
                {t(K.start.openJob)}
              </Button>
            </div>
          </>
        ) : assistant ? (
          <p className="t-sm t-muted">{t(K.start.assistant)}</p>
        ) : (
          <>
            <p className="t-sm t-muted">{t(K.start.body)}</p>
            <Button block disabled={!v.canStart} onClick={s.start}>
              {t(K.start.button)}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

function StepCard({ step, s, t, lang, onNa, onCapture }: { step: SopStepView; s: InstallationSopState; t: T; lang: string; onNa: () => void; onCapture: (slotId: string) => void }) {
  const hint = hintKey(step.id);
  const canPhoto = !step.done && step.owner.isYou && s.view?.job.status === 'in_progress' && !step.satisfiedByDelivery;
  return (
    <Card style={{ borderColor: step.safetyCritical && !step.done ? 'var(--color-warning)' : undefined }}>
      <div className="stack gap-3">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone="neutral">{t(K.phase[step.phase])}</Badge>
          {step.safetyCritical && (
            <Badge tone="warning">
              <ShieldWarning size={12} aria-hidden="true" /> {t(K.step.safety)}
            </Badge>
          )}
          {step.done ? <Badge tone="success">{step.notApplicable ? t(K.step.naDone) : t(K.step.done)}</Badge> : step.status === 'blocked' ? <Badge tone="error">{t(K.step.blocked)}</Badge> : step.status === 'current' ? <Badge tone="accent">{t(K.step.next)}</Badge> : null}
        </div>

        <div className="stack gap-1">
          <h2 className="t-lg t-semibold">{t(step.labelKey)}</h2>
          {hint && <p className="t-sm t-muted">{t(hint)}</p>}
        </div>

        {step.done && (
          <div className="stack gap-1">
            <p className="t-sm t-success">
              {t(K.step.doneBy, { name: step.completedByName ?? '', date: step.completedAt ? formatDateTime(step.completedAt, lang) : '' })}
              {s.local?.pendingSteps.has(step.id) ? ` · ${t(K.step.pending)}` : ''}
            </p>
            {step.notApplicable && <p className="t-sm">{t(K.step.notApplicableHere, { reason: step.notApplicable.reason })}</p>}
            {step.satisfiedByDelivery && <p className="t-xs t-muted">{t(K.step.delivery)}</p>}
            {step.legacyEvidence && <p className="t-xs t-muted">{t(K.step.legacy)}</p>}
          </div>
        )}

        {!step.done && step.problem === 'not_yours' && <p className="t-sm t-muted">{t(K.step.notYours, { name: step.owner.name })}</p>}
        {!step.done && step.problem === 'depends_on' && <p className="t-sm t-warning">{t(K.step.waiting, { steps: step.waitingFor.map((k) => t(k)).join(', ') })}</p>}
        {!step.done && step.problem === 'materials_not_confirmed' && <p className="t-sm t-warning">{t(K.step.deliveryWaiting)}</p>}
        {!step.done && step.problem === 'read_only' && <p className="t-sm t-muted">{t(K.step.readOnly)}</p>}
        {step.satisfiedByDelivery && !step.done && step.problem !== 'materials_not_confirmed' && <p className="t-sm t-muted">{t(K.step.delivery)}</p>}

        {step.slots.length > 0 && (
          <div className="stack gap-2">
            {step.slots.map((slot) => (
              <PhotoSlot key={slot.id} stepId={step.id} slot={slot} canPhoto={canPhoto} pending={!!s.local?.pendingSlots.has(`${step.id}:${slot.id}`)} onOpen={() => onCapture(slot.id)} t={t} lang={lang} />
            ))}
          </div>
        )}
        {step.slots.length === 0 && !step.done && !step.satisfiedByDelivery && <p className="t-xs t-muted">{t(K.step.noPhotoNeeded)}</p>}

        {!step.done && step.owner.isYou && step.status !== 'current' && step.problem !== 'depends_on' && s.view?.job.status === 'in_progress' && (
          <div className="stack gap-1">
            <Button size="sm" variant="secondary" onClick={() => s.focus(step.id)}>
              {t(K.step.focusIt)}
            </Button>
            <span className="t-xs t-muted">{t(K.step.focusHint)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function PhotoSlot({ stepId, slot, canPhoto, pending, onOpen, t, lang }: { stepId: string; slot: Slot; canPhoto: boolean; pending: boolean; onOpen: () => void; t: T; lang: string }) {
  const Icon = slot.kind === 'video' ? VideoCamera : Camera;
  const findings = slot.history.filter((e) => e.finding).length;
  const state = slot.photo ? (pending ? K.photo.waiting : K.photo.taken) : slot.exception ? K.photo.excepted : slot.kind === 'video' ? K.photo.noneVideo : K.photo.none;
  return (
    <div className="row gap-3" style={{ alignItems: 'center', padding: 'var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} data-slot={`${stepId}:${slot.id}`}>
      {slot.photo ? <img src={slot.photo.previewUrl} alt={t(slot.labelKey)} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} /> : <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon size={22} aria-hidden="true" /></div>}
      <span className="stack grow" style={{ minWidth: 0 }}>
        <strong className="t-sm">
          {t(slot.labelKey)} {slot.required && <span className="t-error">*</span>}
        </strong>
        <span className="t-xs t-muted">
          {t(state)} · {t(slot.required ? K.photo.required : K.photo.optional)}
          {slot.photo ? ` · ${t(K.photo.at, { date: formatDateTime(slot.photo.capturedAt, lang) })}` : ''}
        </span>
        {slot.exception && <span className="t-xs t-warning">{t(K.photo.exceptionWhy, { reason: slot.exception.reason })}</span>}
        {findings > 0 && <span className="t-xs t-warning">{t(K.photo.findings, { count: findings })}</span>}
      </span>
      {canPhoto && (
        <Button size="sm" variant={slot.photo || slot.exception ? 'ghost' : 'secondary'} icon={<Icon size={16} aria-hidden="true" />} onClick={onOpen}>
          {t(slot.photo ? K.photo.retake : slot.kind === 'video' ? K.photo.takeVideo : K.photo.take)}
        </Button>
      )}
    </div>
  );
}

function ActionArea({ step, s, t, onNa }: { step: SopStepView; s: InstallationSopState; t: T; onNa: () => void }) {
  const can = step.owner.isYou && step.problem === null;
  const why = step.problem === 'evidence_missing' ? t(K.step.missing, { slots: step.missingSlotIds.map((id) => t(step.slots.find((sl) => sl.id === id)?.labelKey ?? id)).join(', ') }) : step.problem === 'depends_on' ? t(K.step.waiting, { steps: step.waitingFor.map((k) => t(k)).join(', ') }) : step.problem === 'materials_not_confirmed' ? t(K.step.deliveryWaiting) : null;
  return (
    <div className="stack gap-2">
      {why && <p className="t-xs t-muted">{why}</p>}
      <div className="row gap-2">
        <Button
          block
          disabled={!can}
          onClick={() => s.complete(step.id)}
        >
          <CheckCircle size={18} aria-hidden="true" /> {t(K.step.complete)}
        </Button>
        {step.canNotApplicable && (
          <Button variant="secondary" onClick={onNa}>
            {t(K.step.na)}
          </Button>
        )}
      </div>
    </div>
  );
}
