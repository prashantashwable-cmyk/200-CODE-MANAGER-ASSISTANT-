import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, ClipboardText, Flag, ShieldCheck, VideoCamera, WifiSlash, X } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, TextArea, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { QcMechItemView } from '@/data/repository';
import type { QcMechItemId, QcVerdict } from '@/data/types';
import { InlineCapture } from '@/features/technician/InlineCapture';
import type { InlineCaptureLabels } from '@/features/technician/InlineCapture';
import { MEASURES_OF, NOTE_MIN, OVERRIDE_MIN, THRESHOLDS, hasFloors, hasRubric, isSofter } from '@/features/qc/mechanical';
import type { MeasureKey } from '@/features/qc/mechanical';
import { useQcMechanical } from './useQcMechanical';
import type { ActionResult, MechState } from './useQcMechanical';
import { MECH_KEYS as K, VERDICTS, assignmentPath, boardPath } from './qc-mechanical.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATE_TONE: Record<string, BadgeTone> = { not_checked: 'neutral', pass: 'success', exception_pending: 'warning', exception_accepted: 'success', fail: 'error' };
const VERDICT_TONE: Record<QcVerdict, BadgeTone> = { pass: 'success', exception: 'warning', fail: 'error' };

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

/**
 * Screen 132 — QC Mechanical Checklist. Five checks that mirror a lift inspector's trial run, each read against a reference threshold so the
 * verdict does not rest on individual judgment. A fail needs a picture or clip and words and goes straight to rework; a pass with a noted
 * exception waits for Admin; and each item can be cross-checked against what was logged at install time.
 */
export function QcMechanicalScreen() {
  const { t } = useTranslation();
  const s = useQcMechanical();

  if (!s.jobId) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <EmptyState icon={<ClipboardText size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />
      </Screen>
    );
  }
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
        <EmptyState icon={<ClipboardText size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />
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
  return <Check s={s} t={t} />;
}

function Check({ s, t }: { s: MechState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const v = s.view!;
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inspector = v.viewer === 'inspector';
  const so = v.signOff;
  const unsent = s.waiting > 0;
  const doSign = async () => {
    const r = await s.signOff();
    if (r.ok) setSigning(false);
    else setError(t(errorKey(r.code)));
  };
  return (
    <Screen width="default" className={inspector ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={() => s.goto(assignmentPath(v.job.id))} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />
      <Card className="mb-3">
        <div className="stack gap-2">
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={so.signedOff ? 'success' : 'accent'} dot>{t(K.hero.progress, { done: v.progress.cleared, total: v.progress.total })}</Badge>
            {v.assignment && <span className="t-sm">{t(K.hero.inspector, { name: v.assignment.inspectorName })}</span>}
          </div>
          <ProgressBar value={v.progress.total ? v.progress.cleared / v.progress.total : 0} label={t(K.hero.progress, { done: v.progress.cleared, total: v.progress.total })} tone={so.signedOff ? 'success' : 'accent'} />
          {!v.assignment && <p className="t-xs t-muted">{t(K.hero.notAssigned)}</p>}
          {v.assignment && !v.canRecord && !so.signedOff && !inspector && <p className="t-xs t-muted">{t(v.viewer === 'lead' ? K.hero.viewerLead : K.hero.viewerAdmin)}</p>}
          {v.job.status !== 'qc_pending' && !so.signedOff && <p className="t-xs t-muted">{t(K.hero.notReady)}</p>}
        </div>
      </Card>
      {(!s.isOnline || unsent) && (
        <p className="t-xs t-muted row gap-2 mb-3" style={{ alignItems: 'center' }} role="status" data-sync={unsent ? 'waiting' : 'offline'}>
          <WifiSlash size={14} aria-hidden="true" /> {unsent ? t(K.form.notSent, { count: s.waiting }) : t(K.offline)}
        </p>
      )}
      {s.failed.length > 0 && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
          <div className="stack gap-1" role="alert">
            {s.failed.map((f) => (
              <p key={f.id} className="t-xs">{t(K.item[f.itemId])}: {t(errorKey(f.code))}</p>
            ))}
            <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={s.dismissFailed}>{t('action.close')}</Button>
          </div>
        </Card>
      )}
      {s.restored && v.canRecord && <p className="t-xs t-muted mb-3" role="status">{t(K.form.draftRestored)}</p>}

      <div className="grid-auto" style={{ ['--min' as string]: '340px' }}>
        {v.items.map((item) => (
          <ItemCard key={item.id} item={item} s={s} t={t} lang={lang} pending={s.pendingItems.has(item.id)} />
        ))}
      </div>

      {inspector && (
        <ActionBar>
          {so.signedOff ? (
            <p className="t-sm row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={18} weight="fill" color="var(--color-success)" aria-hidden="true" /> {t(K.signOff.done, { name: so.signedOff.byName })}</p>
          ) : (
            <div className="stack gap-1">
              {(so.problem || unsent) && <p className="t-xs t-muted">{unsent ? t(K.signOff.unsent) : t(K.signOff.waiting[so.problem as keyof typeof K.signOff.waiting])}</p>}
              <Button block disabled={!!so.problem || unsent || !s.isOnline} icon={<ShieldCheck size={18} aria-hidden="true" />} onClick={() => setSigning(true)} data-signoff="open">{t(K.signOff.button)}</Button>
            </div>
          )}
        </ActionBar>
      )}
      <Sheet open={signing} onClose={() => setSigning(false)} title={t(K.signOff.title)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <p className="t-sm">{t(K.signOff.body)}</p>
          {error && <p className="t-xs t-error" role="alert">{error}</p>}
          <div className="row gap-2 wrap">
            <Button variant="secondary" onClick={() => setSigning(false)}>{t(K.signOff.back)}</Button>
            <Button disabled={s.busy} onClick={() => void doSign()} data-signoff="go">{t(K.signOff.go)}</Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}

function referenceLine(id: QcMechItemId, t: T): string[] {
  const lines = MEASURES_OF[id].map((k) => {
    const th = THRESHOLDS[k === 'rail_deviation' ? 'rail_deviation' : k];
    if ('unit' in th && Array.isArray(th.pass)) return t(K.reference.range, { name: t(K.measure[k]), a: th.pass[0], b: th.pass[1], ea: (th.exception as [number, number])[0], eb: (th.exception as [number, number])[1], unit: th.unit });
    return t(K.reference.upTo, { name: t(K.measure[k]), pass: th.pass as number, exception: th.exception as number, unit: th.unit });
  });
  if (hasFloors(id)) lines.push(t(K.reference.levelling, { pass: THRESHOLDS.levelling.pass, exception: THRESHOLDS.levelling.exception }));
  if (hasRubric(id)) lines.push(t(K.reference.rubric));
  return lines;
}

function ItemCard({ item, s, t, lang, pending }: { item: QcMechItemView; s: MechState; t: T; lang: string; pending: boolean }) {
  const v = s.view!;
  const [sheet, setSheet] = useState<null | 'raise' | 'explain' | 'reject'>(null);
  const [target, setTarget] = useState<string | null>(null);
  const canRecord = v.canRecord && item.state !== 'exception_pending';
  const last = item.attempts[item.attempts.length - 1];
  return (
    <div data-item={item.id} data-state={item.state}>
      <Card>
        <div className="stack gap-3">
          <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.item[item.id])}</strong>
              <span className="t-xs t-muted">{t(K.itemHint[item.id])}</span>
            </div>
            <Badge tone={STATE_TONE[item.state]} dot>{t(K.state[item.state])}</Badge>
          </div>
          {pending && <p className="t-xs t-muted">{t(K.form.notSent, { count: 1 })}</p>}
          {item.rework && <Badge tone="warning">{t(K.rework.open)}: {t(K.rework.status[item.rework.status])}</Badge>}

          {last && (
            <div className="stack gap-1">
              <p className="t-xs">{t(K.history.attempt, { n: last.n, verdict: t(K.verdict[last.verdict]), when: formatDateTime(last.at, lang) })}{last.overrideReason ? ` · ${t(K.history.overridden)}: ${last.overrideReason}` : ''}</p>
              {last.note && <p className="t-xs t-muted">{last.note}</p>}
              {last.evidence.length > 0 && <div className="row gap-2 wrap">{last.evidence.map((e) => (e.previewUrl ? <img key={e.id} src={e.previewUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : null))}</div>}
              {last.review && (
                <p className="t-xs">
                  <Badge tone={last.review.status === 'accepted' ? 'success' : last.review.status === 'rejected' ? 'error' : 'warning'}>{t(K.review[last.review.status])}</Badge>
                  {last.review.note ? ` ${last.review.note}` : ''}
                </p>
              )}
              {item.attempts.length > 1 && <p className="t-xs t-muted">{t(K.history.heading, { count: item.attempts.length })}</p>}
            </div>
          )}

          {v.canReview && item.state === 'exception_pending' && (
            <div className="stack gap-2" data-review>
              <strong className="t-xs">{t(K.review.heading)}</strong>
              <div className="row gap-2 wrap">
                <Button size="sm" disabled={s.busy} onClick={() => void s.review(item.id, 'accept', '')} data-review-accept>{t(K.review.accept)}</Button>
                <Button size="sm" variant="secondary" onClick={() => setSheet('reject')} data-review-reject>{t(K.review.reject)}</Button>
              </div>
            </div>
          )}

          {canRecord && <RecordForm item={item} s={s} t={t} />}

          <details data-compare={item.id}>
            <summary className="t-xs t-semibold" style={{ cursor: 'pointer', minHeight: 32 }}>{t(K.compare.heading)}</summary>
            <div className="stack gap-2 mt-2">
              {item.reference.length === 0 ? <p className="t-xs t-muted">{t(K.compare.none)}</p> : item.reference.map((r) => (
                <div key={r.stepId} className="stack gap-1">
                  <span className="t-xs">{t(r.labelKey)}{r.completedAt ? ` · ${formatDateTime(r.completedAt, lang)}` : ''}{r.completedByName ? ` · ${t(K.compare.doneBy, { name: r.completedByName })}` : ''}</span>
                  {r.photos.length === 0 ? <span className="t-xs t-muted">{t(K.compare.noPhotos)}</span> : <div className="row gap-2 wrap">{r.photos.map((p) => (p.previewUrl ? <img key={p.id} src={p.previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : null))}</div>}
                </div>
              ))}
              {v.viewer === 'inspector' && !v.signOff.signedOff && (
                <Button size="sm" variant="ghost" icon={<Flag size={14} aria-hidden="true" />} style={{ width: 'fit-content' }} onClick={() => setSheet('raise')} data-raise={item.id}>{t(K.compare.raise)}</Button>
              )}
            </div>
          </details>

          {item.findings.length > 0 && (
            <div className="stack gap-2">
              <strong className="t-xs">{t(K.finding.heading)}</strong>
              {item.findings.map((f) => (
                <div key={f.id} className="stack gap-1" data-finding={f.id} data-accepted={f.accepted ? 'yes' : 'no'}>
                  <p className="t-xs">{f.description} · {t(K.finding.by, { name: f.raisedByName })}</p>
                  {f.explanation ? <p className="t-xs t-muted">{t(K.finding.explained, { name: f.explanation.byName })}: {f.explanation.text}</p> : <p className="t-xs t-muted">{t(K.finding.waiting)}</p>}
                  {f.accepted ? <Badge tone="success">{t(K.finding.accepted)}</Badge> : (
                    <div className="row gap-2 wrap">
                      {v.canExplain && !f.explanation && <Button size="sm" variant="secondary" onClick={() => { setTarget(f.id); setSheet('explain'); }} data-explain={f.id}>{t(K.finding.explain)}</Button>}
                      {v.viewer !== 'lead' && f.explanation && <Button size="sm" disabled={s.busy} onClick={() => void s.accept(f.id)} data-accept={f.id}>{t(K.finding.accept)}</Button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Sheet open={sheet === 'raise'} onClose={() => setSheet(null)} title={t(K.compare.raiseTitle)} closeLabel={t('action.close')}>
        <TextSheet body={t(K.compare.raiseBody)} label={t(K.compare.raiseLabel)} min={NOTE_MIN} go={t(K.compare.raiseGo)} t={t} onClose={() => setSheet(null)} onSubmit={(x) => s.raise(item.id, x)} />
      </Sheet>
      <Sheet open={sheet === 'explain'} onClose={() => setSheet(null)} title={t(K.finding.explainTitle)} closeLabel={t('action.close')}>
        <TextSheet body="" label={t(K.finding.explainLabel)} min={NOTE_MIN} go={t(K.finding.explainGo)} t={t} onClose={() => setSheet(null)} onSubmit={(x) => s.explain(target ?? '', x)} />
      </Sheet>
      <Sheet open={sheet === 'reject'} onClose={() => setSheet(null)} title={t(K.review.rejectTitle)} closeLabel={t('action.close')}>
        <TextSheet body="" label={t(K.review.rejectLabel)} min={NOTE_MIN} go={t(K.review.rejectGo)} t={t} onClose={() => setSheet(null)} onSubmit={(x) => s.review(item.id, 'reject', x)} />
      </Sheet>
    </div>
  );
}

function TextSheet({ body, label, min, go, t, onClose, onSubmit }: { body: string; label: string; min: number; go: string; t: T; onClose: () => void; onSubmit: (x: string) => Promise<ActionResult> }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="stack gap-3">
      {body && <p className="t-sm">{body}</p>}
      <Field label={label} required error={error ?? undefined}>{({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={text} onChange={(e) => setText(e.target.value)} />}</Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button disabled={text.trim().length < min} data-sheet-go onClick={async () => { const r = await onSubmit(text); if (r.ok) onClose(); else setError(t(errorKey(r.code))); }}>{go}</Button>
      </div>
    </div>
  );
}

function RecordForm({ item, s, t }: { item: QcMechItemView; s: MechState; t: T }) {
  const f = s.formOf(item.id);
  const floors = s.view!.floors;
  const sug = s.suggested(item.id);
  const verdict = s.verdictOf(item.id);
  const problem = s.problemOf(item.id);
  const softer = !!verdict && !!sug && isSofter(verdict, sug);
  const needsNote = verdict === 'fail' || verdict === 'exception';
  const noteOk = f.note.trim().length >= NOTE_MIN;
  const lines = referenceLine(item.id, t);
  return (
    <div className="stack gap-3" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }} data-form={item.id}>
      <div className="stack gap-1">
        <strong className="t-xs">{t(K.reference.heading)}</strong>
        {lines.map((l) => <span key={l} className="t-xs t-muted">{l}</span>)}
        <span className="t-xs t-muted">{t(K.reference.placeholder)}</span>
      </div>

      <strong className="t-xs">{t(K.form.reading)}</strong>
      {(MEASURES_OF[item.id] as MeasureKey[]).map((k) => (
        <Field key={k} label={`${t(K.measure[k])} (${THRESHOLDS[k].unit})`}>
          {({ id }) => <Input id={id} className="num" inputMode="decimal" value={f.measures[k] ?? ''} onChange={(e) => s.setForm(item.id, { measures: { ...f.measures, [k]: e.target.value.replace(/[^0-9.]/g, '') } })} data-measure={k} />}
        </Field>
      ))}
      {hasFloors(item.id) && (
        <div className="stack gap-2">
          <span className="t-xs t-muted">{t(K.form.floorHint)}</span>
          <div className="grid-auto" style={{ ['--min' as string]: '110px' }}>
            {Array.from({ length: floors }, (_, i) => (
              <Field key={i} label={t(K.form.floor, { n: i + 1 })}>
                {({ id }) => <Input id={id} className="num" inputMode="decimal" value={f.floors[i] ?? ''} onChange={(e) => s.setForm(item.id, { floors: f.floors.map((x, n) => (n === i ? e.target.value.replace(/[^0-9.]/g, '') : x)) })} data-floor={i + 1} />}
              </Field>
            ))}
          </div>
        </div>
      )}
      {hasRubric(item.id) && (
        <div className="stack gap-2" role="radiogroup" aria-label={t(K.form.reading)}>
          {([1, 2, 3] as const).map((r) => (
            <Chip key={r} pressed={f.rubric === r} onClick={() => s.setForm(item.id, { rubric: r })}>{t(K.rubric[r])}</Chip>
          ))}
        </div>
      )}

      <p className="t-sm row gap-2" style={{ alignItems: 'center' }} data-suggested={sug ?? 'none'}>
        {t(K.form.suggested)}: {sug ? <Badge tone={VERDICT_TONE[sug]}>{t(K.verdict[sug])}</Badge> : <span className="t-muted">{t(K.form.notYet)}</span>}
      </p>

      <div className="stack gap-2">
        <strong className="t-xs">{t(K.form.result)}</strong>
        <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.form.result)}>
          {VERDICTS.map((vd) => (
            <Chip key={vd} pressed={verdict === vd} onClick={() => s.setForm(item.id, { verdict: vd })}>{t(K.verdict[vd])}</Chip>
          ))}
        </div>
        {verdict && <p className="t-xs t-muted">{t(K.verdictHint[verdict])}</p>}
      </div>

      {softer && (
        <Field label={t(K.form.override)} hint={t(K.form.overrideHint, { count: OVERRIDE_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={f.override} onChange={(e) => s.setForm(item.id, { override: e.target.value })} data-override />}
        </Field>
      )}
      {(needsNote || f.note) && (
        <Field label={t(K.form.note)} hint={t(K.form.noteHint, { count: NOTE_MIN })} required={needsNote}>
          {({ id, describedBy }) => (
            <div className="stack gap-1">
              <TextArea id={id} aria-describedby={describedBy} rows={3} value={f.note} onChange={(e) => s.setForm(item.id, { note: e.target.value })} data-note />
              {noteOk && <span className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}><CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.form.noteOk)}</span>}
            </div>
          )}
        </Field>
      )}
      {(verdict === 'fail' || f.attachments.length > 0) && (
        <div className="stack gap-2">
          <strong className="t-xs">{t(K.form.evidence)}{verdict === 'fail' ? ' *' : ''}</strong>
          <span className="t-xs t-muted">{t(K.form.evidenceHint)}</span>
          {f.attachments.length > 0 && (
            <div className="row gap-2 wrap">
              {f.attachments.map((a, i) => (
                <div key={`${a.takenAt}-${i}`} style={{ position: 'relative' }}>
                  <img src={a.media.previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  {a.media.kind === 'video' && <VideoCamera size={14} aria-hidden="true" style={{ position: 'absolute', left: 4, bottom: 4, background: 'var(--color-surface)', borderRadius: 4 }} />}
                  <button type="button" aria-label={t(K.form.remove)} onClick={() => s.setForm(item.id, { attachments: f.attachments.filter((_, n) => n !== i) })} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={12} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="row gap-2 wrap">
            <InlineCapture kind="photo" labels={captureLabels(t, 'photo')} onKeep={(media, takenAt) => s.setForm(item.id, { attachments: [...f.attachments, { media, takenAt }].slice(0, 6) })} />
            <InlineCapture kind="video" labels={captureLabels(t, 'video')} onKeep={(media, takenAt) => s.setForm(item.id, { attachments: [...f.attachments, { media, takenAt }].slice(0, 6) })} />
          </div>
        </div>
      )}
      {problem && problem !== 'reading_incomplete' && <p className="t-xs t-muted" data-problem={problem}>• {t(K.problem[problem])}</p>}
      <Button disabled={!!problem} icon={<CheckCircle size={16} aria-hidden="true" />} style={{ width: 'fit-content' }} onClick={() => s.record(item.id)} data-record={item.id}>
        {t(item.attempts.length > 0 ? K.form.recheck : K.form.save)}
      </Button>
    </div>
  );
}

