import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, ClipboardText, ShieldCheck, ShieldWarning, VideoCamera, WifiSlash, X } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, TextArea, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { QcElecItemView } from '@/data/repository';
import { InlineCapture } from '@/features/technician/InlineCapture';
import type { InlineCaptureLabels } from '@/features/technician/InlineCapture';
import { NOTE_MIN, defOf } from '@/features/qc/electrical';
import { useQcElectrical } from './useQcElectrical';
import type { ElecState } from './useQcElectrical';
import { ELEC_KEYS as K, assignmentPath, boardPath, mechanicalPath } from './qc-electrical.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATE_TONE: Record<string, BadgeTone> = { not_checked: 'neutral', pass: 'success', fail: 'error' };
const VERDICT_TONE: Record<string, BadgeTone> = { pass: 'success', fail: 'error' };

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
 * Screen 133 — QC Electrical & Safety Checklist. The checks that can hurt someone if they are wrong, ending in the no-load and full-load trial
 * runs. There is no soft pass and no Admin override: a pass is only what the readings say, a fail needs proof and words and goes to rework,
 * and every attempt stays on the record beside the pass that followed it.
 */
export function QcElectricalScreen() {
  const { t } = useTranslation();
  const s = useQcElectrical();
  const wrap = (body: JSX.Element) => (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} />
      {body}
    </Screen>
  );
  if (!s.jobId || s.status === 'not_found') {
    return wrap(<EmptyState icon={<ClipboardText size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />);
  }
  if (s.status === 'loading' && !s.view) return wrap(<LoadingState label={t(K.loading)} variant="cards" rows={3} />);
  if (s.status === 'error' || !s.view) return wrap(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  return <Check s={s} t={t} />;
}

function Check({ s, t }: { s: ElecState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const v = s.view!;
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inspector = v.viewer === 'inspector';
  const so = v.signOff;
  const unsent = s.waiting > 0;
  const hb = v.hardBlock;
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
      <Card className="mb-3" style={hb.blocked && hb.failing.length > 0 ? { borderColor: 'var(--color-error)' } : undefined}>
        <div className="stack gap-2">
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={so.signedOff ? 'success' : 'accent'} dot>{t(K.hero.progress, { done: v.progress.cleared, total: v.progress.total })}</Badge>
            {v.assignment && <span className="t-sm">{t(K.hero.inspector, { name: v.assignment.inspectorName })}</span>}
          </div>
          <ProgressBar value={v.progress.total ? v.progress.cleared / v.progress.total : 0} label={t(K.hero.progress, { done: v.progress.cleared, total: v.progress.total })} tone={so.signedOff ? 'success' : 'accent'} />
          <div className="row gap-2" style={{ alignItems: 'flex-start' }} data-block={hb.blocked ? 'blocked' : 'clear'}>
            {hb.blocked ? <ShieldWarning size={20} aria-hidden="true" color="var(--color-error)" /> : <ShieldCheck size={20} aria-hidden="true" color="var(--color-success)" />}
            <div className="stack gap-1">
              <strong className="t-sm">{!hb.blocked ? t(K.block.clear) : hb.failing.length === 0 && hb.open.length === 0 ? t(K.block.awaiting) : t(K.block.blocked)}</strong>
              {hb.failing.length > 0 && <span className="t-xs">{t(K.block.failing, { items: hb.failing.map((i) => t(K.item[i])).join(', ') })}</span>}
              {hb.open.length > 0 && <span className="t-xs t-muted">{t(K.block.open, { count: hb.open.length })}</span>}
              <span className="t-xs t-muted">{t(K.block.note)}</span>
            </div>
          </div>
          {!v.assignment && <p className="t-xs t-muted">{t(K.hero.notAssigned)}</p>}
          {v.assignment && !v.canRecord && !so.signedOff && !inspector && <p className="t-xs t-muted">{t(K.hero.view)}</p>}
          {v.job.status !== 'qc_pending' && !so.signedOff && <p className="t-xs t-muted">{t(K.hero.notReady)}</p>}
          {v.assignment && (
            <p className="t-xs t-muted">
              {v.mechanicalSignedOff ? t(K.hero.mechanical) : t(K.hero.mechanicalOpen)}{' '}
              <a href={mechanicalPath(v.job.id)} onClick={(e) => { e.preventDefault(); s.goto(mechanicalPath(v.job.id)); }}>{t(K.hero.mechanicalLink)}</a>
            </p>
          )}
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

function referenceLines(id: QcElecItemView['id'], t: T): string[] {
  const d = defOf(id);
  const lines = d.measures.map((m) => {
    if (m.kind === 'range') return t(K.reference.range, { name: t(K.measure[m.key]), a: (m.pass as [number, number])[0], b: (m.pass as [number, number])[1], unit: m.unit });
    return t(m.kind === 'max' ? K.reference.max : K.reference.min, { name: t(K.measure[m.key]), value: m.pass as number, unit: m.unit });
  });
  if (d.checks.length > 0) lines.push(t(K.reference.checks, { items: d.checks.map((c) => t(K.check[c])).join(', ') }));
  return lines;
}

function ItemCard({ item, s, t, lang, pending }: { item: QcElecItemView; s: ElecState; t: T; lang: string; pending: boolean }) {
  const v = s.view!;
  const [showAll, setShowAll] = useState(false);
  const last = item.attempts[item.attempts.length - 1];
  const earlier = item.attempts.slice(0, -1);
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

          {last && <AttemptLine a={last} t={t} lang={lang} />}
          {earlier.length > 0 && (
            <div className="stack gap-2">
              <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} onClick={() => setShowAll((x) => !x)} data-history-toggle={item.id}>{t(K.history.heading, { count: item.attempts.length })}</Button>
              {showAll && earlier.map((a) => <AttemptLine key={a.id} a={a} t={t} lang={lang} />)}
            </div>
          )}

          {v.canRecord && <RecordForm item={item} s={s} t={t} />}

          <details data-compare={item.id}>
            <summary className="t-xs t-semibold" style={{ cursor: 'pointer', minHeight: 32 }}>{t(K.compare.heading)}</summary>
            <div className="stack gap-2 mt-2">
              {item.reference.length === 0 ? <p className="t-xs t-muted">{t(K.compare.none)}</p> : item.reference.map((r) => (
                <div key={r.stepId} className="stack gap-1">
                  <span className="t-xs">{t(r.labelKey)}{r.completedAt ? ` · ${formatDateTime(r.completedAt, lang)}` : ''}{r.completedByName ? ` · ${t(K.compare.doneBy, { name: r.completedByName })}` : ''}</span>
                  {r.photos.length === 0 ? <span className="t-xs t-muted">{t(K.compare.noPhotos)}</span> : <div className="row gap-2 wrap">{r.photos.map((p) => (p.previewUrl ? <img key={p.id} src={p.previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : null))}</div>}
                </div>
              ))}
            </div>
          </details>
        </div>
      </Card>
    </div>
  );
}

function AttemptLine({ a, t, lang }: { a: QcElecItemView['attempts'][number]; t: T; lang: string }) {
  return (
    <div className="stack gap-1" data-attempt={a.n} data-verdict={a.verdict}>
      <p className="t-xs row gap-2 wrap" style={{ alignItems: 'center' }}>
        <Badge tone={VERDICT_TONE[a.verdict]}>{t(K.verdict[a.verdict])}</Badge>
        <span>{t(K.history.attempt, { n: a.n, when: formatDateTime(a.at, lang), name: a.byName })}</span>
        {a.intermittent && <Badge tone="warning">{t(K.history.intermittent)}</Badge>}
      </p>
      {(a.measures.length > 0 || a.checks.length > 0) && (
        <p className="t-xs t-muted">
          {[...a.measures.map((m) => `${t(K.measure[m.key])}: ${m.value}`), ...a.checks.map((c) => `${t(K.check[c.key])}: ${t(c.ok ? K.form.yes : K.form.no)}`)].join(' · ')}
        </p>
      )}
      {a.note && <p className="t-xs t-muted">{a.note}</p>}
      {a.evidence.length > 0 && <div className="row gap-2 wrap">{a.evidence.map((e) => (e.previewUrl ? <img key={e.id} src={e.previewUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : null))}</div>}
    </div>
  );
}

function RecordForm({ item, s, t }: { item: QcElecItemView; s: ElecState; t: T }) {
  const f = s.formOf(item.id);
  const d = defOf(item.id);
  const sug = s.suggested(item.id);
  const verdict = s.verdictOf(item.id);
  const problem = s.problemOf(item.id);
  const noteOk = f.note.trim().length >= NOTE_MIN;
  const needsNote = verdict === 'fail';
  const needsEvidence = verdict === 'fail' || d.evidenceAlways;
  const lines = referenceLines(item.id, t);
  return (
    <div className="stack gap-3" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }} data-form={item.id}>
      <div className="stack gap-1">
        <strong className="t-xs">{t(K.reference.heading)}</strong>
        {lines.map((l) => <span key={l} className="t-xs t-muted">{l}</span>)}
        <span className="t-xs t-muted">{t(K.reference.noSoft)}</span>
        <span className="t-xs t-muted">{t(K.reference.placeholder)}</span>
      </div>

      <strong className="t-xs">{t(K.form.reading)}</strong>
      {d.measures.map((m) => (
        <Field key={m.key} label={`${t(K.measure[m.key])} (${m.unit})`}>
          {({ id }) => <Input id={id} className="num" inputMode="decimal" value={f.measures[m.key] ?? ''} onChange={(e) => s.setForm(item.id, { measures: { ...f.measures, [m.key]: e.target.value.replace(/[^0-9.]/g, '') } })} data-measure={m.key} />}
        </Field>
      ))}
      {d.checks.map((c) => (
        <div key={c} className="stack gap-1" data-check={c}>
          <span className="t-sm">{t(K.check[c])}</span>
          <div className="row gap-2" role="radiogroup" aria-label={t(K.check[c])}>
            <Chip pressed={f.checks[c] === true} onClick={() => s.setForm(item.id, { checks: { ...f.checks, [c]: true } })}>{t(K.form.yes)}</Chip>
            <Chip pressed={f.checks[c] === false} onClick={() => s.setForm(item.id, { checks: { ...f.checks, [c]: false } })}>{t(K.form.no)}</Chip>
          </div>
        </div>
      ))}
      <div className="stack gap-1" data-intermittent>
        <Checkbox checked={f.intermittent} onChange={(x) => s.setForm(item.id, { intermittent: x })} label={t(K.form.intermittent)} />
        <span className="t-xs t-muted">{t(K.form.intermittentHint)}</span>
      </div>

      <p className="t-sm row gap-2" style={{ alignItems: 'center' }} data-suggested={sug ?? 'none'}>
        {t(K.form.suggested)}: {sug ? <Badge tone={VERDICT_TONE[sug]}>{t(K.verdict[sug])}</Badge> : <span className="t-muted">{t(K.form.notYet)}</span>}
      </p>
      {sug === 'pass' && (
        <Checkbox checked={f.forceFail} onChange={(x) => s.setForm(item.id, { forceFail: x })} label={t(K.form.forceFail)} />
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
      {(needsEvidence || f.attachments.length > 0) && (
        <div className="stack gap-2">
          <strong className="t-xs">{t(K.form.evidence)}{needsEvidence ? ' *' : ''}</strong>
          <span className="t-xs t-muted">{t(d.evidenceAlways && verdict !== 'fail' ? K.form.evidenceTrial : K.form.evidenceHint)}</span>
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
        {t(item.attempts.length > 0 ? K.form.retest : K.form.save)}
      </Button>
    </div>
  );
}
