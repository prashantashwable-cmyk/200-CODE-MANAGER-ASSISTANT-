import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, CheckCircle, CloudArrowUp, Images, Package, PauseCircle, Play, ShieldWarning, VideoCamera, Warning, WifiSlash, X } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, EmptyState, ErrorState, Field, LoadingState, Screen, ScreenHeader, Sheet, StatTile, TextArea, formatDateTime } from '@/design-system';
import type { SopSlotView, SopStepView } from '@/data/repository';
import type { JobEvidence } from '@/data/types';
import { CaptureCamera, FramingGuide } from '@/features/technician/CaptureCamera';
import { EXCEPTION_REASON_MIN, FINDING_NOTE_MIN, FINDING_SLOT, VIDEO_MAX_SECONDS, frameOf, kb } from '@/features/technician/evidence';
import type { EvidenceCaptureState, Shot } from './useEvidenceCapture';
import { useEvidenceCapture } from './useEvidenceCapture';
import { EVIDENCE_KEYS as K, homePath, isProblemCode, slotKeyOf } from './evidence-capture.types';

type T = ReturnType<typeof useTranslation>['t'];

const errorKey = (code?: string) => (code && isProblemCode(code) ? K.problem[code] : K.problem.generic);
const guideOf = (slotId: string | null) => {
  const key = slotId ? slotKeyOf(slotId) : null;
  return { guide: K.guide[key ?? 'other'], why: K.why[key ?? 'other'] };
};

/**
 * Screen 124 — Photo/Video Evidence Capture. The proof that the installation followed the procedure, so it is guided (what to capture,
 * why, with an outline over the viewfinder), tagged by the app (job, step, slot, moment, place when the phone can say), reviewed before
 * it is kept, and never deleted: a retake replaces the proof, a capture that shows a problem is kept in full and raises Admin's
 * attention, and a required capture that truly cannot be made is explained in writing instead of blocking the work.
 */
export function EvidenceCaptureView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useEvidenceCapture();
  const lang = i18n.language;

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
  const readOnlyKey = v.job.status === 'on_hold' ? K.readOnly.hold : v.job.status === 'scheduled' || v.job.status === 'materials_pending' ? K.readOnly.notStarted : v.job.status !== 'in_progress' ? K.readOnly.closed : null;

  return (
    <Screen width="wide" className={s.draft ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={s.toChecklist} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
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
      {readOnlyKey && (
        <Card className="mb-3">
          <p className="t-sm row-top gap-2 t-muted">
            <PauseCircle size={18} className="shrink-0" aria-hidden="true" /> {t(readOnlyKey)}
          </p>
        </Card>
      )}

      <div className="mb-3">
        <Summary s={s} t={t} />
      </div>
      {s.target ? (
        <div className="main-aside">
          <div style={{ minWidth: 0 }}>{s.draft ? <ReviewPanel s={s} t={t} lang={lang} /> : <CapturePanel s={s} t={t} />}</div>
          <Gallery s={s} t={t} lang={lang} />
        </div>
      ) : (
        <Gallery s={s} t={t} lang={lang} />
      )}

      <Lightbox s={s} t={t} lang={lang} />
      <ExceptionSheet s={s} t={t} />
    </Screen>
  );
}

/* ---------------------------------------------------------------- pieces */

function SyncBanner({ s, t }: { s: EvidenceCaptureState; t: T }) {
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
        {s.videoAtRisk && !s.isOnline && <p className="t-sm t-warning">{t(K.sync.videoRisk)}</p>}
        {s.storageFull && <p className="t-sm t-warning">{t(K.sync.storage)}</p>}
      </div>
    </Card>
  );
}

function Summary({ s, t }: { s: EvidenceCaptureState; t: T }) {
  const x = s.totals;
  return (
    <div className="stack gap-3">
      <div className="grid-auto" style={{ ['--min' as string]: '140px' }}>
        <Card>
          <StatTile label={t(K.summary.proofs)} value={String(x.proofs)} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.missing)} value={String(x.missing)} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.problems)} value={String(x.problems)} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.safety)} value={t(K.summary.safetyValue, { done: x.safetyCovered, total: x.safetyTotal })} />
        </Card>
      </div>
      {x.awaiting > 0 && (
        <Card style={{ borderColor: 'var(--color-warning)' }}>
          <p className="t-sm t-warning row-top gap-2">
            <ShieldWarning size={18} className="shrink-0" aria-hidden="true" /> {t(K.summary.awaiting, { count: x.awaiting })}
          </p>
        </Card>
      )}
    </div>
  );
}

function CapturePanel({ s, t }: { s: EvidenceCaptureState; t: T }) {
  const target = s.target!;
  const slot = target.slot;
  const { guide, why } = guideOf(slot ? slot.id : FINDING_SLOT);
  const input = useRef<HTMLInputElement>(null);
  const kind = target.kind;
  const label = slot ? t(slot.labelKey) : t(K.capture.problemFor, { step: t(target.step.labelKey) });
  const earlier = slot?.history.filter((e) => !e.supersededAt) ?? [];
  const exceptionOk = !!slot && slot.required && !slot.photo && !slot.exception;
  return (
    <Card style={{ borderColor: target.step.safetyCritical ? 'var(--color-warning)' : undefined }} data-capture={slot?.id ?? FINDING_SLOT}>
      <div className="stack gap-3">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone="accent">{kind === 'video' ? <VideoCamera size={12} aria-hidden="true" /> : <Camera size={12} aria-hidden="true" />} {t(kind === 'video' ? K.capture.video : K.capture.photo)}</Badge>
          {slot && <Badge tone={slot.required ? 'neutral' : 'emerald'}>{t(slot.required ? K.capture.required : K.capture.optional)}</Badge>}
          {target.step.safetyCritical && (
            <Badge tone="warning">
              <ShieldWarning size={12} aria-hidden="true" /> {t(K.capture.safety)}
            </Badge>
          )}
        </div>
        <div className="stack gap-1">
          <h2 className="t-lg t-semibold">{label}</h2>
          <p className="t-xs t-muted">{t(target.step.labelKey)}</p>
        </div>
        <div className="stack gap-1">
          <strong className="t-sm">{t(K.capture.what)}</strong>
          <p className="t-sm">{t(guide)}</p>
          <strong className="t-sm">{t(K.capture.why)}</strong>
          <p className="t-sm t-muted">{t(why)}</p>
          {kind === 'video' && <p className="t-xs t-muted">{t(K.capture.limit, { seconds: VIDEO_MAX_SECONDS })}</p>}
        </div>

        {s.preparing ? (
          <LoadingState label={t(K.capture.preparing)} variant="block" />
        ) : (
          <>
            {!s.liveOff ? (
              <CaptureCamera
                kind={kind}
                shape={frameOf(slot?.id ?? FINDING_SLOT)}
                labels={{ shutter: t(K.capture.shutter), record: t(K.capture.record), stop: t(K.capture.stop), starting: t(K.capture.starting), unavailable: t(K.capture.cameraOff), recording: t(K.capture.recording) }}
                onFile={(f) => void s.receive(f)}
                onUnavailable={() => s.setLiveOff(true)}
              />
            ) : (
              <div className="stack gap-2">
                <div style={{ position: 'relative', aspectRatio: '21 / 9', maxHeight: 200, width: '100%', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-lg)' }}>
                  <FramingGuide shape={frameOf(slot?.id ?? FINDING_SLOT)} />
                </div>
                <p className="t-xs t-muted">{t(K.capture.cameraOff)}</p>
              </div>
            )}
            {s.problem && (
              <p className="t-sm t-error" role="alert">
                {t(errorKey(s.problem))}
              </p>
            )}
            <input
              ref={input}
              type="file"
              accept={kind === 'video' ? 'video/*' : 'image/*'}
              capture="environment"
              hidden
              data-testid="evidence-file"
              aria-label={label}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void s.receive(file);
              }}
            />
            <div className="row gap-2 wrap">
              <Button variant="secondary" size="sm" icon={kind === 'video' ? <VideoCamera size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />} onClick={() => input.current?.click()}>
                {t(kind === 'video' ? K.capture.useAppVideo : K.capture.useApp)}
              </Button>
              {exceptionOk && slot && (
                <Button variant="ghost" size="sm" onClick={() => s.openException(target.step, slot)}>
                  {t(K.exception.open)}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={s.close}>
                {t(K.capture.close)}
              </Button>
            </div>
          </>
        )}
        {earlier.length > 0 && (
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.capture.earlier)}</span>
            <div className="row gap-2 wrap">
              {earlier.map((e) => (
                <img key={e.id} src={e.previewUrl} alt={label} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function ReviewPanel({ s, t, lang }: { s: EvidenceCaptureState; t: T; lang: string }) {
  const draft = s.draft!;
  const target = s.target!;
  const p = draft.prepared;
  const [asProblem, setAsProblem] = useState(target.free);
  const [note, setNote] = useState('');
  const slot = target.slot;
  const label = slot ? t(slot.labelKey) : t(K.capture.problemFor, { step: t(target.step.labelKey) });
  const quality = p.kind === 'photo' && p.quality !== 'ok' ? p.quality : null;
  const replaces = !!slot?.photo && !asProblem;
  const noteShort = asProblem && note.trim().length < FINDING_NOTE_MIN;
  return (
    <Card data-review="true">
      <div className="stack gap-3">
        <h2 className="t-lg t-semibold">{t(K.review.heading)}</h2>
        <p className="t-sm t-muted">{label}</p>
        {p.kind === 'video' ? (
          <video src={p.mediaUrl} poster={p.previewUrl} controls playsInline style={{ width: '100%', maxHeight: 360, borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-alt)' }} />
        ) : (
          <img src={p.previewUrl} alt={label} style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-alt)' }} />
        )}
        <p className="t-xs t-muted">
          {t(K.review.details, { date: formatDateTime(draft.takenAt, lang), size: kb(p.sizeBytes) })}
          {p.kind === 'video' ? ` · ${p.durationS}s` : ''} · {draft.place ? t(K.review.place, { lat: draft.place.lat.toFixed(4), lng: draft.place.lng.toFixed(4) }) : t(K.review.noPlace)}
        </p>
        {draft.problem && (
          <p className="t-sm t-error" role="alert">
            {t(errorKey(draft.problem))}
          </p>
        )}
        {quality && !draft.problem && (
          <p className="t-sm t-warning row-top gap-2" role="status">
            <Warning size={18} className="shrink-0" aria-hidden="true" /> {t(K.review.quality[quality])}
          </p>
        )}
        {replaces && <p className="t-xs t-muted">{t(K.review.replaces)}</p>}
        {!target.free && (
          <Checkbox checked={asProblem} onChange={setAsProblem} label={<span className="stack"><span className="t-sm t-medium">{t(K.review.finding.toggle)}</span><span className="t-xs t-muted">{t(K.review.finding.hint)}</span></span>} />
        )}
        {asProblem && (
          <Field label={t(K.review.finding.note)} hint={t(K.review.finding.noteHint, { count: FINDING_NOTE_MIN })} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        )}
        {s.problem && s.problem !== 'unreadable' && (
          <p className="t-sm t-error" role="alert">
            {t(errorKey(s.problem))}
          </p>
        )}
      </div>
      <ActionBar>
        <div className="row gap-2">
          <Button variant="secondary" onClick={s.retake}>
            {t(K.review.retake)}
          </Button>
          <Button className="grow" disabled={!!draft.problem || noteShort} icon={<CheckCircle size={18} aria-hidden="true" />} onClick={() => s.keep(asProblem, note)}>
            {t(asProblem ? K.review.useProblem : quality ? K.review.keepAnyway : K.review.use)}
          </Button>
        </div>
      </ActionBar>
    </Card>
  );
}

function Gallery({ s, t, lang }: { s: EvidenceCaptureState; t: T; lang: string }) {
  const v = s.view!;
  // What still needs the technician comes first; finished steps follow, each group in procedure order.
  const steps = v.steps.filter((x) => x.slots.length > 0 || x.otherFindings.length > 0 || x.legacyEvidence).sort((a, b) => Number(a.done) - Number(b.done));
  const any = s.shots.length > 0 || steps.some((x) => x.slots.some((sl) => sl.exception));
  return (
    <section className="stack gap-3" aria-label={t(K.gallery.heading)}>
      <div className="stack gap-1">
        <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}>
          <Images size={18} aria-hidden="true" /> {t(K.gallery.heading)}
        </h2>
        <p className="t-xs t-muted">{t(K.gallery.hint)}</p>
      </div>
      {steps.length === 0 || (!any && !v.steps.some((x) => x.slots.length > 0)) ? (
        <EmptyState icon={<Images size={28} />} title={t(K.gallery.emptyTitle)} body={t(K.gallery.emptyBody)} />
      ) : (
        steps.map((step) => <StepEvidence key={step.id} step={step} s={s} t={t} lang={lang} />)
      )}
    </section>
  );
}

function StepEvidence({ step, s, t, lang }: { step: SopStepView; s: EvidenceCaptureState; t: T; lang: string }) {
  const canCapture = !step.done && step.owner.isYou && s.view?.job.status === 'in_progress' && !step.satisfiedByDelivery;
  const required = step.slots.filter((sl) => sl.required);
  const covered = required.filter((sl) => sl.photo || sl.exception).length;
  // A finished step with nothing captured for a slot was finished before the app kept evidence: nothing to show, and nothing missing.
  const shownSlots = step.slots.filter((sl) => !(step.done && sl.history.length === 0 && !sl.exception));
  return (
    <Card data-step={step.id} style={{ borderColor: step.safetyCritical && !step.done ? 'var(--color-warning)' : undefined }}>
      <div className="stack gap-3">
        <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <h3 className="t-md t-semibold">{t(step.labelKey)}</h3>
            {step.safetyCritical && (
              <Badge tone="warning">
                <ShieldWarning size={12} aria-hidden="true" /> {t(K.capture.safety)}
              </Badge>
            )}
            {step.done && <Badge tone="success">{step.notApplicable ? t(K.gallery.notApplicable) : t(K.gallery.stepDone)}</Badge>}
          </div>
          {required.length > 0 && !step.legacyEvidence && !(step.done && covered === 0) && <span className="t-xs t-muted">{t(K.gallery.stepProgress, { done: covered, total: required.length })}</span>}
        </div>
        {step.legacyEvidence && <p className="t-xs t-muted">{t(K.gallery.legacy)}</p>}
        {step.slots.length === 0 && step.otherFindings.length === 0 && !step.legacyEvidence && <p className="t-xs t-muted">{t(K.gallery.noSlots)}</p>}
        {shownSlots.map((slot) => (
          <SlotBlock key={slot.id} step={step} slot={slot} canCapture={canCapture} s={s} t={t} lang={lang} />
        ))}
        {step.otherFindings.length > 0 && (
          <div className="stack gap-2">
            <strong className="t-sm">{t(K.gallery.otherProblems)}</strong>
            <div className="grid-auto" style={{ ['--min' as string]: '132px' }}>
              {step.otherFindings.map((e) => (
                <Tile key={e.id} e={e} label={null} s={s} t={t} lang={lang} />
              ))}
            </div>
          </div>
        )}
        {canCapture && (
          <div>
            <Button size="sm" variant="ghost" icon={<Warning size={16} aria-hidden="true" />} onClick={() => s.open(step.id, FINDING_SLOT)}>
              {t(K.gallery.reportProblem)}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function SlotBlock({ step, slot, canCapture, s, t, lang }: { step: SopStepView; slot: SopSlotView; canCapture: boolean; s: EvidenceCaptureState; t: T; lang: string }) {
  const Icon = slot.kind === 'video' ? VideoCamera : Camera;
  const proven = !!slot.photo;
  return (
    <div className="stack gap-2" data-slot={`${step.id}:${slot.id}`}>
      <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
        <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}>
          <Icon size={16} aria-hidden="true" /> {t(slot.labelKey)} {slot.required && <span className="t-error">*</span>}
        </strong>
        {canCapture && (
          <Button size="sm" variant={proven ? 'ghost' : 'secondary'} onClick={() => s.open(step.id, slot.id)}>
            {t(proven ? K.gallery.recapture : K.gallery.capture)}
          </Button>
        )}
      </div>
      <div className="grid-auto" style={{ ['--min' as string]: '132px' }}>
        {slot.history.map((e) => (
          <Tile key={e.id} e={e} label={null} s={s} t={t} lang={lang} />
        ))}
        {slot.history.length === 0 && !slot.exception && (
          <button
            type="button"
            disabled={!canCapture}
            onClick={() => s.open(step.id, slot.id)}
            className="stack gap-1"
            style={{ minHeight: 96, border: `1px dashed ${slot.required ? 'var(--color-warning)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', background: 'transparent', color: 'inherit', display: 'grid', placeItems: 'center', padding: 'var(--space-3)', cursor: canCapture ? 'pointer' : 'default' }}
          >
            <span className="t-xs t-muted">{t(slot.required ? K.gallery.missing : K.capture.optional)}</span>
          </button>
        )}
      </div>
      {slot.exception && (
        <p className="t-xs row-top gap-2" style={{ padding: 'var(--space-2)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)' }}>
          <ShieldWarning size={16} className="shrink-0" color="var(--color-warning)" aria-hidden="true" />
          <span>
            <strong>{t(K.gallery.excepted)}</strong> {slot.exception.reason} · {slot.exception.byName}, {formatDateTime(slot.exception.at, lang)}
            {step.safetyCritical && <span className="t-muted"> · {t(slot.exception.acknowledged ? K.exception.acknowledged : K.exception.awaiting)}</span>}
          </span>
        </p>
      )}
    </div>
  );
}

function Tile({ e, s, t, lang }: { e: JobEvidence; label: string | null; s: EvidenceCaptureState; t: T; lang: string }) {
  const shot = s.shots.find((x) => x.evidence.id === e.id);
  const sending = shot?.local && s.sendingId && e.id === `local-${s.sendingId}`;
  const status = shot?.local ? (sending ? K.gallery.sending : K.gallery.notSent) : K.gallery.saved;
  const tag = e.finding ? K.gallery.problem : e.supersededAt ? K.gallery.replaced : K.gallery.proof;
  return (
    <button
      type="button"
      onClick={() => s.setLightbox(e.id)}
      data-evidence={e.id}
      aria-label={`${t(tag)} · ${formatDateTime(e.capturedAt, lang)}`}
      className="stack gap-1"
      style={{ padding: 0, border: `1px solid ${e.finding ? 'var(--color-warning)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'inherit', overflow: 'hidden', textAlign: 'left', opacity: e.supersededAt ? 0.6 : 1, cursor: 'pointer' }}
    >
      <span style={{ position: 'relative', display: 'block', aspectRatio: '4 / 3', background: 'var(--color-surface-alt)' }}>
        {e.previewUrl ? <img src={e.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Images size={24} aria-hidden="true" /></span>}
        {e.kind === 'video' && (
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface)' }}>
              <Play size={18} weight="fill" aria-hidden="true" />
            </span>
          </span>
        )}
      </span>
      <span className="stack" style={{ padding: '0 var(--space-2) var(--space-2)' }}>
        <span className={`t-xs t-semibold ${e.finding ? 't-warning' : ''}`}>{t(tag)}</span>
        <span className="t-xs t-muted">{formatDateTime(e.capturedAt, lang)}</span>
        <span className="t-xs t-muted row gap-1" style={{ alignItems: 'center' }}>
          {shot?.local && <CloudArrowUp size={12} aria-hidden="true" />} {t(status)}
        </span>
      </span>
    </button>
  );
}

function Lightbox({ s, t, lang }: { s: EvidenceCaptureState; t: T; lang: string }) {
  const index = s.shots.findIndex((x) => x.evidence.id === s.lightbox);
  const shot: Shot | undefined = index >= 0 ? s.shots[index] : undefined;
  const close = () => s.setLightbox(null);
  const move = (by: number) => s.setLightbox(s.shots[(index + by + s.shots.length) % s.shots.length].evidence.id);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!shot) return undefined;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') close();
      else if (ev.key === 'ArrowRight') move(1);
      else if (ev.key === 'ArrowLeft') move(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    box.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot?.evidence.id]);
  if (!shot) return null;
  const e = shot.evidence;
  return (
    <div ref={box} role="dialog" aria-modal="true" aria-label={t(K.lightbox.label)} tabIndex={-1} data-lightbox="true" style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div className="row between gap-2" style={{ padding: 'var(--space-3) var(--space-4)', alignItems: 'center' }}>
        <span className="t-sm t-muted">{t(K.lightbox.of, { index: index + 1, total: s.shots.length })}</span>
        <Button size="sm" variant="ghost" onClick={close} aria-label={t(K.lightbox.close)} icon={<X size={18} aria-hidden="true" />}>
          {t(K.lightbox.close)}
        </Button>
      </div>
      <div className="grow" style={{ display: 'grid', placeItems: 'center', padding: '0 var(--space-4)', minHeight: 240 }}>
        {e.kind === 'video' ? (
          e.mediaUrl ? <video src={e.mediaUrl} poster={e.previewUrl} controls playsInline style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 'var(--radius-lg)' }} /> : (
            <div className="stack gap-2" style={{ alignItems: 'center' }}>
              <img src={e.previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '50vh', borderRadius: 'var(--radius-lg)' }} />
              <p className="t-xs t-muted">{t(K.lightbox.noVideo)}</p>
            </div>
          )
        ) : (
          <img src={e.previewUrl} alt={shot.slotLabelKey ? t(shot.slotLabelKey) : t(shot.stepLabelKey)} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }} />
        )}
      </div>
      <div className="stack gap-2" style={{ padding: 'var(--space-4)', maxWidth: 720, width: '100%', margin: '0 auto' }}>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone={e.finding ? 'warning' : e.supersededAt ? 'neutral' : 'success'}>{t(e.finding ? K.gallery.problem : e.supersededAt ? K.gallery.replaced : K.gallery.proof)}</Badge>
          {e.kind === 'video' && <Badge tone="accent">{t(K.gallery.video)}</Badge>}
        </div>
        <h2 className="t-md t-semibold">{shot.slotLabelKey ? t(shot.slotLabelKey) : t(K.capture.problemFor, { step: t(shot.stepLabelKey) })}</h2>
        <p className="t-sm t-muted">{t(shot.stepLabelKey)}</p>
        <dl className="stack gap-1 t-sm">
          <div>{t(K.lightbox.taken, { date: formatDateTime(e.capturedAt, lang) })}</div>
          <div>{t(K.lightbox.by, { name: e.byName })}</div>
          <div>{t(K.lightbox.size, { size: kb(e.sizeBytes) })}{e.durationS ? ` · ${e.durationS}s` : ''}</div>
          {e.location && <div>{t(K.lightbox.place, { lat: e.location.lat.toFixed(4), lng: e.location.lng.toFixed(4) })}</div>}
          {e.note && <div>{t(K.lightbox.note, { note: e.note })}</div>}
          {e.supersededAt && <div className="t-muted">{t(K.lightbox.replacedAt, { date: formatDateTime(e.supersededAt, lang) })}</div>}
        </dl>
        {s.shots.length > 1 && (
          <div className="row gap-2">
            <Button variant="secondary" size="sm" onClick={() => move(-1)} icon={<ArrowLeft size={16} aria-hidden="true" />}>
              {t(K.lightbox.prev)}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => move(1)} icon={<ArrowRight size={16} aria-hidden="true" />}>
              {t(K.lightbox.next)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ExceptionSheet({ s, t }: { s: EvidenceCaptureState; t: T }) {
  const [reason, setReason] = useState('');
  const open = s.exceptionFor;
  useEffect(() => {
    if (!open) setReason('');
  }, [open]);
  return (
    <Sheet open={!!open} onClose={s.closeException} title={t(K.exception.title)} closeLabel={t('action.close')}>
      {open && (
        <div className="stack gap-3">
          <p className="t-sm">{t(K.exception.intro, { slot: t(open.slot.labelKey) })}</p>
          {open.step.safetyCritical && (
            <p className="t-sm t-warning row-top gap-2">
              <ShieldWarning size={18} className="shrink-0" aria-hidden="true" /> {t(K.exception.safety)}
            </p>
          )}
          <Field label={t(K.exception.reason)} hint={t(K.exception.hint, { count: EXCEPTION_REASON_MIN })} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <p className="t-xs t-muted">{t(K.exception.told)}</p>
          <Button disabled={reason.trim().length < EXCEPTION_REASON_MIN} onClick={() => s.saveException(reason)}>
            {t(K.exception.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
