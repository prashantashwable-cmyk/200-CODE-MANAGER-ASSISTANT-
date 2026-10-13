import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle, CloudArrowUp, FileText, Gavel, Package, PauseCircle, Scales, ShieldCheck, ShieldWarning, VideoCamera, Warning, WifiSlash, XCircle } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, TextArea, formatDateTime } from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { PreInspectionSummaryView, SafetyItemView } from '@/data/repository';
import type { SafetyFixKind } from '@/data/types';
import { InlineCapture } from '@/features/technician/InlineCapture';
import type { InlineCaptureLabels } from '@/features/technician/InlineCapture';
import { DISAGREEMENT_NOTE_MIN, FAIL_NOTE_MIN, FIX_NOTE_MIN, OVERRIDE_REASON_MIN, READING_MIN, RESOLUTION_NOTE_MIN, isCleared } from '@/features/technician/safety';
import { useSafetyChecklist } from './useSafetyChecklist';
import type { ActionResult, SafetyState } from './useSafetyChecklist';
import { FIX_KINDS, SAFETY_KEYS as K, evidencePath, homePath } from './safety-checklist.types';

type T = ReturnType<typeof useTranslation>['t'];

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATE_TONE: Record<SafetyItemView['state'], BadgeTone> = { not_tested: 'neutral', passed: 'success', failed: 'error', retest_due: 'warning', held: 'error', in_review: 'warning', overridden: 'accent' };
const RAIL_STATUS = (i: SafetyItemView): AscensionStep['status'] => (isCleared(i.state) ? 'complete' : i.state === 'failed' || i.state === 'held' ? 'blocked' : 'upcoming');
const labelOf = (t: T, i: { id: string; label: string | null }) => (i.label ? i.label : t(`safetyChecklist.item.${i.id}.label`));

/**
 * Screen 126 — Safety Compliance Checklist. The checks the state lift inspector takes at the pre-commissioning inspection, in the order they
 * take them, so AIEC's own sign-off anticipates the real one. A pass needs its evidence (captured right here, inline) and its readings;
 * a failed check is fixed and retested on this screen, or, when the fault is fundamental or keeps recurring, it waits for Admin; only Admin,
 * with a named qualified engineer, can accept a failed check, and a technician who disagrees with how a check is done is heard by a
 * qualified reviewer instead of being overruled or trusted blindly. Nothing here reaches quality check until every check is cleared.
 */
export function SafetyChecklistView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useSafetyChecklist();
  const lang = i18n.language;
  const [selected, setSelected] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [statesOpen, setStatesOpen] = useState(false);

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
  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const v = s.view;
  const firstOpen = v.items.find((i) => !isCleared(i.state)) ?? v.items[0];
  const shown = v.items.find((i) => i.id === selected) ?? firstOpen;
  const readOnlyKey = s.isAdmin ? K.readOnly.admin : v.job.status === 'on_hold' ? K.readOnly.hold : v.job.status === 'scheduled' || v.job.status === 'materials_pending' ? K.readOnly.notStarted : v.readOnly ? K.readOnly.closed : null;

  const rail: AscensionStep[] = v.items.map((i) => ({
    id: i.id,
    label: labelOf(t, i),
    meta: t(K.state[i.state]),
    status: i.id === shown?.id && !isCleared(i.state) ? 'current' : RAIL_STATUS(i),
    onClick: () => setSelected(i.id),
    trailing: s.pending.has(i.id) ? <CloudArrowUp size={14} aria-label={t(K.sync.notSent)} /> : undefined,
  }));

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <div className="row gap-2 wrap">
            <Button size="sm" variant="secondary" icon={<FileText size={16} aria-hidden="true" />} onClick={() => setSummaryOpen(true)}>
              {t(K.summary.open)}
            </Button>
            {s.isAdmin && (
              <Button size="sm" variant="ghost" icon={<Scales size={16} aria-hidden="true" />} onClick={() => setStatesOpen(true)}>
                {t(K.states.open)}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={s.toJob} aria-label={t(K.back)}>
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
                {t(K.failed.item, { item: t(`safetyChecklist.item.${f.itemId}.label`, { defaultValue: f.itemId }), reason: t(errorKey(f.code)) })}
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

      <Hero v={v} t={t} />
      {readOnlyKey && (
        <Card className="mb-3">
          <p className="t-sm row-top gap-2 t-muted">
            <PauseCircle size={18} className="shrink-0" aria-hidden="true" /> {t(readOnlyKey)}
          </p>
        </Card>
      )}

      {v.items.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={28} />} title={t(K.hero.clear)} body={t(K.hero.intro)} />
      ) : (
        <div className="main-aside">
          <div style={{ minWidth: 0 }}>{shown && <ItemCard key={shown.id} item={shown} s={s} t={t} lang={lang} onDone={(next) => setSelected(next)} />}</div>
          <Card>
            <AscensionLine steps={rail} />
          </Card>
        </div>
      )}

      <SummarySheet open={summaryOpen} onClose={() => setSummaryOpen(false)} s={s} t={t} lang={lang} />
      {s.isAdmin && <StateItemsSheet open={statesOpen} onClose={() => setStatesOpen(false)} s={s} t={t} lang={lang} />}
    </Screen>
  );
}

/* ---------------------------------------------------------------- pieces */

function SyncBanner({ s, t }: { s: SafetyState; t: T }) {
  const waiting = s.queue.length;
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
        {s.videoAtRisk && !s.isOnline && <p className="t-sm t-warning">{t(K.sync.needsSignal)}</p>}
      </div>
    </Card>
  );
}

function Hero({ v, t }: { v: NonNullable<SafetyState['view']>; t: T }) {
  const pct = v.progress.total ? Math.round((v.progress.cleared / v.progress.total) * 100) : 0;
  return (
    <Card className="mb-3" style={{ borderColor: v.blocksQc ? 'var(--color-warning)' : 'var(--color-success)' }}>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
          <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}>
            {v.blocksQc ? <ShieldWarning size={20} color="var(--color-warning)" aria-hidden="true" /> : <ShieldCheck size={20} color="var(--color-success)" weight="fill" aria-hidden="true" />}
            {t(K.hero.progress, { done: v.progress.cleared, total: v.progress.total })}
          </h2>
          <Badge tone={v.blocksQc ? 'warning' : 'success'}>{t(v.blocksQc ? K.hero.blocks : K.hero.clear)}</Badge>
        </div>
        <ProgressBar value={pct} label={t(K.hero.progress, { done: v.progress.cleared, total: v.progress.total })} />
        <p className="t-sm">{t(K.hero.intro)}</p>
        <p className="t-xs t-muted">{t(K.hero.order)}</p>
        <p className="t-xs t-muted">{t(K.hero.standard)} {t(K.hero.clauses)}</p>
        <p className="t-xs t-muted">{v.state.fallback ? t(K.hero.stateFallback, { state: v.state.name ?? '—' }) : t(K.hero.stateConfigured, { count: v.state.configured, state: v.state.name ?? '' })}</p>
      </div>
    </Card>
  );
}

function ItemCard({ item, s, t, lang, onDone }: { item: SafetyItemView; s: SafetyState; t: T; lang: string; onDone: (nextId: string | null) => void }) {
  const [reading, setReading] = useState('');
  const [failing, setFailing] = useState(false);
  const [failNote, setFailNote] = useState('');
  const [fixKind, setFixKind] = useState<SafetyFixKind>('minor_adjustment');
  const [fixNote, setFixNote] = useState('');
  const [sheet, setSheet] = useState<null | 'disagree' | 'release' | 'override' | 'resolve'>(null);
  const [showMethod, setShowMethod] = useState(true);
  const v = s.view!;
  const testable = item.canRecord && (item.state === 'not_tested' || item.state === 'retest_due');
  const readingShort = item.requiresReading && reading.trim().length < READING_MIN;
  const passBlocked = !!item.passProblem || readingShort;
  const nextOpen = () => v.items.find((i) => i.id !== item.id && !isCleared(i.state))?.id ?? null;
  const labels = useMemo<InlineCaptureLabels>(
    () => ({ add: t(K.item.addPhoto), retake: t(K.item.retake), keep: t(K.capture.keep), keepAnyway: t(K.capture.keepAnyway), preparing: t(K.capture.preparing), unreadable: t(K.capture.unreadable), wrongKind: t(K.capture.wrongKind), tooLong: t(K.capture.tooLong), tooLarge: t(K.capture.tooLarge), quality: { blurry: t(K.capture.blurry), dark: t(K.capture.dark), glare: t(K.capture.glare), unchecked: t(K.capture.unchecked) } }),
    [t],
  );
  const stepDone = (stepId: string) => !!s.sop?.steps.find((x) => x.id === stepId)?.done;
  const noteKey = item.state === 'held' ? (item.hold?.reason === 'too_many_fails' ? K.stateNote.held_too_many_fails : K.stateNote.held_needs_rework) : item.state === 'in_review' ? K.stateNote.in_review : item.state === 'failed' ? K.stateNote.failed : item.state === 'retest_due' ? K.stateNote.retest_due : null;

  return (
    <Card style={{ borderColor: item.state === 'held' || item.state === 'failed' ? 'var(--color-error)' : undefined }} data-item={item.id}>
      <div className="stack gap-3">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone="warning">
            <ShieldWarning size={12} aria-hidden="true" /> {t(K.kind.critical)}
          </Badge>
          <Badge tone="neutral">{t(K.kind[item.kind])}</Badge>
          <Badge tone={STATE_TONE[item.state]}>{item.state === 'overridden' && item.override ? t(K.state.overridden) : t(K.state[item.state])}</Badge>
          {s.pending.has(item.id) && <Badge tone="neutral"><CloudArrowUp size={12} aria-hidden="true" /> {t(K.sync.notSent)}</Badge>}
        </div>
        <h2 className="t-lg t-semibold">{labelOf(t, item)}</h2>

        {noteKey && <p className="t-sm row-top gap-2" role="status" style={{ color: item.state === 'held' || item.state === 'failed' ? 'var(--color-error)' : undefined }}>{t(noteKey)}</p>}
        {item.state === 'overridden' && item.override && (
          <p className="t-sm">
            {t(K.stateNote.overridden, { engineer: item.override.engineerName, by: item.override.byName, date: formatDateTime(item.override.at, lang), reason: item.override.reason })}
          </p>
        )}
        {item.disagreement && (
          <div className="stack gap-1" style={{ padding: 'var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <span className="t-xs t-muted">{t(K.admin.theirWords, { name: item.disagreement.raisedByName })}</span>
            <span className="t-sm">{item.disagreement.note}</span>
            {item.disagreement.resolution && <span className="t-sm">{t(K.item.reviewDone, { decision: t(K.admin.decision[item.disagreement.resolution.decision]), by: item.disagreement.resolution.byName, note: item.disagreement.resolution.note })}</span>}
          </div>
        )}

        <div className="stack gap-1">
          <button type="button" className="t-sm t-semibold" style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-primary)' }} onClick={() => setShowMethod(!showMethod)} aria-expanded={showMethod}>
            {t(K.item.method)}
          </button>
          {showMethod && <p className="t-sm" style={{ whiteSpace: 'pre-line' }}>{item.method ?? t(`safetyChecklist.item.${item.id}.method`)}</p>}
          <span className="t-xs t-muted">{item.kind === 'state' ? t(K.hero.stateConfigured, { count: 1, state: v.state.name ?? '' }) : t(`safetyChecklist.item.${item.id}.standard`, { defaultValue: t(K.hero.standard) })}</span>
        </div>

        {item.waitingFor.length > 0 && (
          <p className="t-sm t-warning row-top gap-2">
            <Package size={18} className="shrink-0" aria-hidden="true" /> {t(K.item.waitingFor, { items: item.waitingFor.map((id) => labelOf(t, { id, label: v.items.find((x) => x.id === id)?.label ?? null })).join(', ') })}
          </p>
        )}

        {item.slots.length > 0 && (
          <div className="stack gap-2">
            <strong className="t-sm">{t(K.item.evidence)}</strong>
            {item.slots.map((sl) => (
              <div key={sl.id} className="row gap-3" style={{ alignItems: 'flex-start', padding: 'var(--space-2)', border: `1px ${sl.proof || sl.excepted ? 'solid' : 'dashed'} ${sl.proof || sl.excepted ? 'var(--color-border)' : 'var(--color-warning)'}`, borderRadius: 'var(--radius-md)' }} data-slot={sl.id}>
                {sl.proof && sl.proof.previewUrl ? (
                  <img src={sl.proof.previewUrl} alt={t(sl.labelKey)} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {sl.kind === 'video' ? <VideoCamera size={22} aria-hidden="true" /> : <Camera size={22} aria-hidden="true" />}
                  </div>
                )}
                <div className="stack gap-1 grow" style={{ minWidth: 0 }}>
                  <strong className="t-sm">{t(sl.labelKey)}</strong>
                  <span className="t-xs t-muted">{sl.proof ? t(K.item.proof, { date: formatDateTime(sl.proof.capturedAt, lang) }) : sl.excepted ? t(K.item.excepted) : t(K.item.evidenceNeeded, { kind: t(sl.kind === 'video' ? K.item.addVideo : K.item.addPhoto) })}</span>
                  {testable && !stepDone(sl.stepId) && (
                    <InlineCapture
                      kind={sl.kind}
                      labels={{ ...labels, add: t(sl.kind === 'video' ? K.item.addVideo : K.item.addPhoto) }}
                      replacing={!!sl.proof}
                      onKeep={(media, takenAt) => s.keepEvidence(sl.stepId, sl.id, media, takenAt)}
                    />
                  )}
                  {testable && !sl.proof && !sl.excepted && (
                    <div>
                      <Button size="sm" variant="ghost" onClick={() => s.goto(evidencePath(v.job.id, sl.stepId, sl.id))}>
                        {t(K.item.cannotCapture)}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {testable && (
          <div className="stack gap-3">
            <Field label={t(K.item.reading)} hint={t(item.requiresReading ? K.item.readingRequired : K.item.readingHint, { count: READING_MIN })}>
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={reading} onChange={(e) => setReading(e.target.value)} />}
            </Field>
            {passBlocked && <p className="t-xs t-muted" role="status">{t(K.item.passDisabled)}</p>}
            {!failing ? (
              <div className="grid-2">
                <Button size="md" className="ds-btn--big" disabled={passBlocked} icon={<CheckCircle size={22} aria-hidden="true" />} onClick={() => { s.pass(item.id, reading); onDone(nextOpen()); }}>
                  {t(K.item.pass)}
                </Button>
                <Button size="md" className="ds-btn--big" variant="danger" icon={<XCircle size={22} aria-hidden="true" />} onClick={() => setFailing(true)}>
                  {t(K.item.fail)}
                </Button>
              </div>
            ) : (
              <div className="stack gap-2">
                <Field label={t(K.item.failNote)} hint={t(K.item.failNoteHint, { count: FAIL_NOTE_MIN })} required>
                  {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={failNote} onChange={(e) => setFailNote(e.target.value)} />}
                </Field>
                <div className="row gap-2 wrap">
                  <Button variant="secondary" onClick={() => setFailing(false)}>
                    {t(K.item.cancel)}
                  </Button>
                  <Button variant="danger" disabled={failNote.trim().length < FAIL_NOTE_MIN} onClick={() => { s.fail(item.id, failNote); setFailing(false); setFailNote(''); }}>
                    {t(K.item.saveFail)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {item.canRecord && item.state === 'failed' && (
          <div className="stack gap-2" style={{ padding: 'var(--space-3)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)' }}>
            <strong className="t-sm">{t(K.item.fixHeading)}</strong>
            <p className="t-xs t-muted">{t(K.item.fixIntro)}</p>
            <div className="row gap-2 wrap" role="group" aria-label={t(K.item.fixHeading)}>
              {FIX_KINDS.map((k) => (
                <Chip key={k} pressed={fixKind === k} onClick={() => setFixKind(k)}>
                  {t(K.item.fixKind[k])}
                </Chip>
              ))}
            </div>
            <span className="t-xs t-muted">{t(K.item.fixKindHint[fixKind])}</span>
            <Field label={t(K.item.fixNote)} hint={t(K.item.fixNoteHint, { count: FIX_NOTE_MIN })} required>
              {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={fixNote} onChange={(e) => setFixNote(e.target.value)} />}
            </Field>
            <div>
              <Button disabled={fixNote.trim().length < FIX_NOTE_MIN} onClick={() => { s.fix(item.id, fixKind, fixNote); setFixNote(''); }}>
                {t(K.item.saveFix)}
              </Button>
            </div>
          </div>
        )}

        {item.attempts.length > 0 && (
          <div className="stack gap-1">
            <strong className="t-sm">{t(K.item.attempts)}</strong>
            {item.attempts.map((a) => (
              <div key={a.id} className="stack" style={{ paddingLeft: 'var(--space-3)', borderLeft: `2px solid ${a.result === 'pass' ? 'var(--color-success)' : 'var(--color-error)'}` }} data-attempt={a.n}>
                <span className="t-sm">
                  {t(K.item.attemptLine, { n: a.n, result: t(a.result === 'pass' ? K.item.attemptPass : K.item.attemptFail), name: a.byName, date: formatDateTime(a.at, lang) })}
                </span>
                {a.measured && <span className="t-xs t-muted">{a.measured}</span>}
                {a.note && <span className="t-xs">{a.note}</span>}
                {a.fix && <span className="t-xs t-muted">{t(K.item.fixed, { kind: t(K.item.fixKind[a.fix.kind]), note: a.fix.note })}</span>}
              </div>
            ))}
          </div>
        )}

        {item.canRecord && item.state !== 'passed' && item.state !== 'overridden' && !(item.disagreement && !item.disagreement.resolution) && (
          <div>
            <Button size="sm" variant="ghost" onClick={() => setSheet('disagree')}>
              {t(K.item.disagree)}
            </Button>
          </div>
        )}

        {s.isAdmin && (item.state === 'held' || item.state === 'in_review' || (item.fails > 0 && item.state !== 'passed' && item.state !== 'overridden')) && (
          <div className="stack gap-2" style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}>
              <Gavel size={16} aria-hidden="true" /> {t(K.admin.heading)}
            </strong>
            <div className="row gap-2 wrap">
              {item.state === 'held' && (
                <Button size="sm" variant="secondary" onClick={() => setSheet('release')}>
                  {t(K.admin.release)}
                </Button>
              )}
              {item.state === 'in_review' && (
                <Button size="sm" variant="secondary" onClick={() => setSheet('resolve')}>
                  {t(K.admin.resolve)}
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={() => setSheet('override')}>
                {t(K.admin.override)}
              </Button>
            </div>
          </div>
        )}
      </div>

      <TextSheet open={sheet === 'disagree'} onClose={() => setSheet(null)} title={t(K.disagree.title)} intro={t(K.disagree.intro)} field={{ label: t(K.disagree.note), hint: t(K.disagree.hint, { count: DISAGREEMENT_NOTE_MIN }), min: DISAGREEMENT_NOTE_MIN }} confirm={t(K.disagree.send)} busy={s.busy} onSubmit={(note) => s.disagree(item.id, note)} t={t} />
      <TextSheet open={sheet === 'release'} onClose={() => setSheet(null)} title={t(K.admin.releaseTitle)} intro={t(K.admin.releaseIntro)} field={{ label: t(K.admin.releaseNote), hint: t(K.admin.decisionNoteHint, { count: RESOLUTION_NOTE_MIN }), min: RESOLUTION_NOTE_MIN }} confirm={t(K.admin.releaseConfirm)} busy={s.busy} onSubmit={(note) => s.release(item.id, note)} t={t} />
      <OverrideSheet open={sheet === 'override'} onClose={() => setSheet(null)} item={item} s={s} t={t} />
      <ResolveSheet open={sheet === 'resolve'} onClose={() => setSheet(null)} item={item} s={s} t={t} />
    </Card>
  );
}

/** A sheet with one sentence to write, refused inline when it is too short or the server says no. */
function TextSheet({ open, onClose, title, intro, field, confirm, busy, onSubmit, t }: { open: boolean; onClose: () => void; title: string; intro: string; field: { label: string; hint: string; min: number }; confirm: string; busy: boolean; onSubmit: (note: string) => Promise<ActionResult>; t: T }) {
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
        <p className="t-sm">{intro}</p>
        <Field label={field.label} hint={field.hint} required error={error ? t(errorKey(error)) : undefined}>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <Button
          disabled={busy || note.trim().length < field.min}
          onClick={async () => {
            const r = await onSubmit(note);
            if (r.ok) onClose();
            else setError(r.code ?? 'generic');
          }}
        >
          {confirm}
        </Button>
      </div>
    </Sheet>
  );
}

function OverrideSheet({ open, onClose, item, s, t }: { open: boolean; onClose: () => void; item: SafetyItemView; s: SafetyState; t: T }) {
  const [engineer, setEngineer] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      setEngineer('');
      setReason('');
      setError(null);
    }
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.admin.overrideTitle)} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        <p className="t-sm">{t(K.admin.overrideIntro, { item: labelOf(t, item) })}</p>
        <Field label={t(K.admin.engineer)} hint={t(K.admin.engineerHint)} required>
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={engineer} onChange={(e) => setEngineer(e.target.value)} />}
        </Field>
        <Field label={t(K.admin.reason)} hint={t(K.admin.reasonHint, { count: OVERRIDE_REASON_MIN })} required error={error ? t(errorKey(error)) : undefined}>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
        <Button
          variant="danger"
          disabled={s.busy || engineer.trim().length < 3 || reason.trim().length < OVERRIDE_REASON_MIN}
          onClick={async () => {
            const r = await s.override(item.id, engineer, reason);
            if (r.ok) onClose();
            else setError(r.code ?? 'generic');
          }}
        >
          {t(K.admin.overrideConfirm)}
        </Button>
      </div>
    </Sheet>
  );
}

function ResolveSheet({ open, onClose, item, s, t }: { open: boolean; onClose: () => void; item: SafetyItemView; s: SafetyState; t: T }) {
  const [decision, setDecision] = useState<'method_stands' | 'method_changed'>('method_stands');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      setNote('');
      setError(null);
    }
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.admin.resolveTitle)} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        {item.disagreement && (
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.admin.theirWords, { name: item.disagreement.raisedByName })}</span>
            <span className="t-sm">{item.disagreement.note}</span>
          </div>
        )}
        <div className="row gap-2 wrap" role="group" aria-label={t(K.admin.resolveTitle)}>
          <Chip pressed={decision === 'method_stands'} onClick={() => setDecision('method_stands')}>
            {t(K.admin.decisionStands)}
          </Chip>
          <Chip pressed={decision === 'method_changed'} onClick={() => setDecision('method_changed')}>
            {t(K.admin.decisionChanged)}
          </Chip>
        </div>
        <Field label={t(K.admin.decisionNote)} hint={t(K.admin.decisionNoteHint, { count: RESOLUTION_NOTE_MIN })} required error={error ? t(errorKey(error)) : undefined}>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <Button
          disabled={s.busy || note.trim().length < RESOLUTION_NOTE_MIN}
          onClick={async () => {
            const r = await s.resolve(item.id, decision, note);
            if (r.ok) onClose();
            else setError(r.code ?? 'generic');
          }}
        >
          {t(K.admin.resolveConfirm)}
        </Button>
      </div>
    </Sheet>
  );
}

/** The internal pre-inspection readiness summary: what the state inspector would look at, as it stands now or as it stood when it was made. */
function SummarySheet({ open, onClose, s, t, lang }: { open: boolean; onClose: () => void; s: SafetyState; t: T; lang: string }) {
  const [sum, setSum] = useState<PreInspectionSummaryView | null>(null);
  const [failed, setFailed] = useState(false);
  const versions = s.view?.summaries ?? [];
  useEffect(() => {
    if (!open) return;
    setFailed(false);
    s.readSummary().then(setSum, () => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const download = () => {
    if (!sum) return;
    const rows = sum.lines.map((l) => `<tr><td>${esc(l.label ?? t(l.labelKey ?? ''))}</td><td>${esc(t(K.state[l.state]))}</td><td>${l.attempts}</td><td>${l.fixes}</td><td>${esc(l.overriddenBy ?? '')}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t(K.summary.fileTitle, { code: sum.job.code }))}</title><style>body{font-family:sans-serif;max-width:800px;margin:24px auto;padding:0 16px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}</style></head><body><h1>${esc(t(K.summary.fileTitle, { code: sum.job.code }))}</h1><p>${esc(sum.job.siteName)} · ${esc(sum.job.address)}</p><p><strong>${esc(t(sum.ready ? K.summary.ready : K.summary.notReady))}</strong></p><p>${esc(sum.generatedAt ? t(K.summary.version, { version: sum.version, name: sum.generatedByName, date: formatDateTime(sum.generatedAt, lang) }) : t(K.summary.liveNote))}</p><table><tr><th></th><th></th><th>#</th><th>fix</th><th></th></tr>${rows}</table><p>${esc(t(K.summary.disclaimer))}</p></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre-inspection-${sum.job.code}${sum.version ? `-v${sum.version}` : ''}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Sheet open={open} onClose={onClose} title={t(K.summary.title)} closeLabel={t('action.close')}>
      {failed ? (
        <p className="t-sm t-error">{t(K.error.body)}</p>
      ) : !sum ? (
        <LoadingState label={t(K.loading)} variant="block" />
      ) : (
        <div className="stack gap-3" data-summary="true">
          <p className="t-sm">{t(K.summary.intro)}</p>
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={sum.ready ? 'success' : 'warning'}>{t(sum.ready ? K.summary.ready : K.summary.notReady)}</Badge>
            <span className="t-xs t-muted">{sum.generatedAt ? t(K.summary.version, { version: sum.version, name: sum.generatedByName, date: formatDateTime(sum.generatedAt, lang) }) : t(K.summary.liveNote)}</span>
          </div>
          <p className="t-xs t-muted">{sum.stateFallback ? t(K.summary.stateFallback, { state: sum.state ?? '—' }) : t(K.summary.stateLine, { state: sum.state ?? '' })}</p>
          <div className="stack gap-1">
            {sum.lines.map((l) => (
              <div key={l.itemId} className="row between gap-2" style={{ alignItems: 'center' }}>
                <span className="t-sm">{l.label ?? t(l.labelKey ?? '')}</span>
                <span className="row gap-2" style={{ alignItems: 'center' }}>
                  <span className="t-xs t-muted">{t(K.summary.lineSummary, { attempts: l.attempts, fixes: l.fixes })}</span>
                  <Badge tone={STATE_TONE[l.state]}>{t(K.state[l.state])}</Badge>
                </span>
              </div>
            ))}
          </div>
          <p className="t-xs t-muted">{t(K.summary.disclaimer)}</p>
          <div className="row gap-2 wrap">
            {!sum.id && (
              <Button
                onClick={async () => {
                  const made = await s.generateSummary();
                  if (made) setSum(made);
                }}
              >
                {t(K.summary.generate)}
              </Button>
            )}
            <Button variant="secondary" onClick={download}>
              {t(K.summary.download)}
            </Button>
          </div>
          {versions.length > 0 && (
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.summary.versions)}</strong>
              {versions.map((x) => (
                <Button key={x.id} size="sm" variant="ghost" onClick={() => s.readSummary(x.id).then(setSum, () => setFailed(true))}>
                  {t(K.summary.version, { version: x.version, name: x.generatedByName, date: formatDateTime(x.generatedAt, lang) })} · {t(x.ready ? K.summary.ready : K.summary.notReady)}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => s.readSummary().then(setSum, () => setFailed(true))}>
                {t(K.summary.liveNote)}
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/** Admin's own additions to the standard list, per state. */
function StateItemsSheet({ open, onClose, s, t, lang }: { open: boolean; onClose: () => void; s: SafetyState; t: T; lang: string }) {
  const [state, setState] = useState('Maharashtra');
  const [label, setLabel] = useState('');
  const [method, setMethod] = useState('');
  const [reading, setReading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) void s.loadStateItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const valid = label.trim().length >= 5 && method.trim().length >= 15 && state.trim().length >= 3;
  return (
    <Sheet open={open} onClose={onClose} title={t(K.states.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        <p className="t-sm">{t(K.states.intro)}</p>
        {s.stateItems === null ? (
          <LoadingState label={t(K.loading)} variant="block" />
        ) : s.stateItems.length === 0 ? (
          <p className="t-sm t-muted">{t(K.states.empty)}</p>
        ) : (
          s.stateItems.map((i) => (
            <div key={i.id} className="stack gap-1" style={{ padding: 'var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} data-state-item={i.id}>
              <div className="row between gap-2 wrap" style={{ alignItems: 'center' }}>
                <strong className="t-sm">{i.label}</strong>
                <Badge tone={i.active ? 'success' : 'neutral'}>{t(i.active ? K.states.active : K.states.inactive)}</Badge>
              </div>
              <span className="t-xs t-muted">{i.state} · {t(K.states.by, { name: i.createdByName, date: formatDateTime(i.createdAt, lang) })}</span>
              <span className="t-xs">{i.method}</span>
              <div>
                <Button size="sm" variant="ghost" disabled={s.busy} onClick={() => void s.toggleStateItem(i.id, !i.active)}>
                  {t(i.active ? K.states.deactivate : K.states.activate)}
                </Button>
              </div>
            </div>
          ))
        )}
        <strong className="t-sm">{t(K.states.add)}</strong>
        <Field label={t(K.states.state)} required>
          {({ id }) => <Input id={id} value={state} onChange={(e) => setState(e.target.value)} />}
        </Field>
        <Field label={t(K.states.label)} hint={t(K.states.labelHint)} required>
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={label} onChange={(e) => setLabel(e.target.value)} />}
        </Field>
        <Field label={t(K.states.method)} hint={t(K.states.methodHint)} required error={error ? t(errorKey(error)) : undefined}>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={method} onChange={(e) => setMethod(e.target.value)} />}
        </Field>
        <Checkbox checked={reading} onChange={setReading} label={<span className="t-sm">{t(K.states.reading)}</span>} />
        <Button
          disabled={s.busy || !valid}
          onClick={async () => {
            const r = await s.addStateItem({ state, label, method, requiresReading: reading });
            if (r.ok) {
              setLabel('');
              setMethod('');
              setError(null);
            } else setError(r.code ?? 'generic');
          }}
        >
          {t(K.states.note)}
        </Button>
      </div>
    </Sheet>
  );
}
