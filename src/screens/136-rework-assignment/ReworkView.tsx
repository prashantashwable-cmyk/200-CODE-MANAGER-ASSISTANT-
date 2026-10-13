import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CaretRight, CheckCircle, Flag, MapPin, Package, ShieldWarning, Sparkle, VideoCamera, Wrench, X } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { ReworkView, SnagRowView } from '@/data/repository';
import type { SnagSeverity } from '@/features/qc/snags';
import { severityRank } from '@/features/qc/snags';
import { NOTES_MIN, REASON_MIN, SCOPE_NOTE_MIN } from '@/features/qc/rework';
import { InlineCapture } from '@/features/technician/InlineCapture';
import type { InlineCaptureLabels } from '@/features/technician/InlineCapture';
import { useRework } from './useRework';
import type { ActionResult, ReworkState } from './useRework';
import { REWORK_KEYS as K, SEVERITY_LIST, listPath, reworkPath, snagListPath } from './rework.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const SEVERITY_TONE: Record<SnagSeverity, BadgeTone> = { safety_critical: 'error', functional: 'warning', cosmetic: 'neutral' };
const STATUS_TONE: Record<string, BadgeTone> = { open: 'warning', assigned: 'accent', in_progress: 'accent', ready_for_retest: 'accent', disputed: 'warning', verified: 'success', waived: 'success', withdrawn: 'neutral' };
const ICON = { safety_critical: ShieldWarning, functional: Wrench, cosmetic: Sparkle };

const captureLabels = (t: T, kind: 'photo' | 'video'): InlineCaptureLabels => ({
  add: t(kind === 'video' ? K.work.addVideo : K.work.addPhoto),
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
 * Screen 136 — Rework Assignment. A snag, and every snag that shares its cause, given to someone to put right: the finding with its evidence,
 * the technician's own notes and new pictures (the same guided capture as the installation), a way to ask for a part that was not delivered,
 * and a way to say the job is bigger than it looked or cannot be done. Reporting it done hands it to QC to re-check; it never closes it.
 */
export function ReworkScreen() {
  const { t } = useTranslation();
  const s = useRework();
  const wrap = (body: JSX.Element) => (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} />
      {body}
    </Screen>
  );
  if (s.status === 'not_found') return wrap(<EmptyState icon={<Flag size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(listPath)} />);
  if (s.status === 'loading' && !s.view && !s.board) return wrap(<LoadingState label={t(K.loading)} variant="list" rows={4} />);
  if (s.status === 'error' || (!s.view && !s.board)) return wrap(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  if (!s.snagId && s.board) return <Tasks s={s} t={t} />;
  return s.view ? <Form s={s} v={s.view} t={t} /> : null;
}

/* ------------------------------------------------------------------ the list of rework */

function Tasks({ s, t }: { s: ReworkState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const b = s.board!;
  const admin = b.viewer === 'admin';
  const me = b.rows;
  const groups: { key: string; title: string; rows: SnagRowView[] }[] = admin
    ? [
        { key: 'unassigned', title: t(K.list.unassigned), rows: me.filter((r) => r.status === 'open' && !r.ownerId) },
        { key: 'inHand', title: t(K.list.inHand), rows: me.filter((r) => r.status === 'assigned' || r.status === 'in_progress') },
        { key: 'waiting', title: t(K.list.waiting), rows: me.filter((r) => r.status === 'ready_for_retest') },
      ]
    : [
        { key: 'mine', title: t(K.list.mine), rows: me.filter((r) => r.status === 'assigned' || r.status === 'in_progress') },
        { key: 'waiting', title: t(K.list.waiting), rows: me.filter((r) => r.status === 'ready_for_retest') },
      ];
  const nothing = groups.every((g) => g.rows.length === 0);
  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={t(K.list.heading)} />
      {nothing ? (
        <EmptyState icon={<CheckCircle size={32} />} title={t(K.list.emptyTitle)} body={t(K.list.emptyBody)} actionLabel={t(K.list.all)} onAction={() => s.goto('/snags')} />
      ) : (
        <div className="stack gap-4">
          {groups.filter((g) => g.rows.length > 0).map((g) => (
            <section key={g.key} className="stack gap-2" data-group={g.key}>
              <h2 className="t-md t-semibold">{g.title} · {g.rows.length}</h2>
              <Card>
                <div className="stack">
                  {g.rows.map((r) => {
                    const Icon = ICON[r.severity];
                    const name = r.itemLabelKey ? t(r.itemLabelKey) : r.title;
                    return (
                      <button key={r.id} type="button" onClick={() => s.goto(reworkPath(r.id))} className="row gap-3" data-task={r.id} style={{ minHeight: 64, alignItems: 'center', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2) 0', cursor: 'pointer', color: 'inherit' }}>
                        <Icon size={22} aria-hidden="true" color={r.severity === 'safety_critical' ? 'var(--color-error)' : 'var(--color-accent-secondary)'} />
                        <span className="stack" style={{ flex: 1, minWidth: 0 }}>
                          <strong className="t-sm">{name}</strong>
                          <span className="t-xs t-muted">{r.code} · {r.jobCode} · {t(K.list.source[r.source])}</span>
                          <span className="t-xs t-muted">{r.ownerName ? t(K.list.owner, { name: r.ownerName }) : ''}{r.dueAt && r.status !== 'ready_for_retest' ? ` · ${t(K.list.due, { when: formatDateTime(r.dueAt, lang) })}` : ''}</span>
                        </span>
                        <span className="stack" style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Badge tone={SEVERITY_TONE[r.severity]}>{t(K.severity[r.severity])}</Badge>
                          {r.overdue && <Badge tone="error">{t(K.list.overdue)}</Badge>}
                        </span>
                        <CaretRight size={16} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </Card>
            </section>
          ))}
        </div>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ one snag's rework */

type Sub = null | 'part' | 'escalate' | 'handBack' | 'order';

function Form({ s, v, t }: { s: ReworkState; v: ReworkView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const d = v.snag;
  const a = v.actions;
  const name = d.itemLabelKey ? t(d.itemLabelKey) : (d.title ?? d.code);
  const [sub, setSub] = useState<Sub>(null);
  const [who, setWho] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const reassign = a.reassign;
  const assignOk = !!who && (!reassign || reason.trim().length >= REASON_MIN);
  const notesOk = s.notes.trim().length >= NOTES_MIN;
  const evidenceOk = s.attachments.length > 0;
  const closed = d.status === 'verified' || d.status === 'waived' || d.status === 'withdrawn';
  const sticky = a.assign || a.reassign || a.start || a.complete;
  const techs = v.technicians;
  const run = async (fn: () => Promise<ActionResult>, after?: () => void) => {
    const r = await fn();
    if (r.ok) {
      setError(null);
      after?.();
    } else setError(t(errorKey(r.code)));
  };
  return (
    <Screen width="narrow" className={sticky ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={name}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={() => s.goto(listPath)} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />
      <Card className="mb-3">
        <div className="stack gap-2" data-rework={d.id} data-status={d.status} data-urgency={v.urgency}>
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={SEVERITY_TONE[d.severity]}>{t(K.severity[d.severity])}</Badge>
            <Badge tone={d.severity === 'safety_critical' ? 'error' : 'neutral'}>{t(K.urgency[v.urgency])}</Badge>
            <Badge tone={STATUS_TONE[d.status]} dot>{t(K.status[d.status])}</Badge>
            <span className="t-xs t-muted">{d.code}</span>
          </div>
          <p className="t-xs t-muted">{t(K.urgencyHint[v.urgency])}</p>
          {d.dueAt && !closed && d.status !== 'ready_for_retest' && <p className="t-sm">{t(K.finding.due, { when: formatDateTime(d.dueAt, lang) })}{d.overdue ? ` · ${t(K.list.overdue)}` : ''}</p>}
          {d.ownerName && <p className="t-xs t-muted">{t(K.list.owner, { name: d.ownerName })}</p>}
          <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} onClick={() => s.goto(snagListPath(v.job.id, d.id))}>{t(K.toSnag)}</Button>
        </div>
      </Card>

      {d.status === 'disputed' && <p className="t-sm mb-3" role="status">{t(K.finding.disputed)}</p>}
      {d.status === 'ready_for_retest' && <p className="t-sm mb-3" role="status" data-pending>{t(K.finding.pending)}</p>}
      {closed && <p className="t-sm mb-3" role="status">{t(K.finding.closed)}</p>}

      <Card className="mb-3">
        <div className="stack gap-3">
          <strong className="t-sm">{t(K.finding.heading)}</strong>
          <p className="t-sm">{d.note}</p>
          <div className="stack gap-1">
            <strong className="t-xs">{t(K.finding.evidence)}</strong>
            {d.evidence.length === 0 ? <span className="t-xs t-muted">{t(K.finding.noEvidence)}</span> : <div className="row gap-2 wrap">{d.evidence.map((e) => (e.previewUrl ? <img key={e.id} src={e.previewUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : null))}</div>}
          </div>
          <div className="stack gap-1">
            <strong className="t-xs">{t(K.finding.site)}</strong>
            <p className="t-sm row gap-2" style={{ alignItems: 'center' }}><MapPin size={16} aria-hidden="true" /> {v.job.address}</p>
            <a className="t-xs" href={`https://www.google.com/maps?q=${v.job.location.lat},${v.job.location.lng}`} target="_blank" rel="noreferrer">{t(K.finding.map)}</a>
          </div>
          {d.group.length > 1 && (
            <div className="stack gap-1" data-group>
              <strong className="t-xs">{t(K.finding.group)}</strong>
              {d.group.map((g) => <p key={g.id} className="t-xs">{g.code} · {g.title}{g.primary ? ' *' : ''} · {t(K.status[g.status])}</p>)}
              <p className="t-xs t-muted">{t(K.finding.groupRule)}</p>
            </div>
          )}
          {v.scope.length > 0 && (
            <div className="stack gap-1" data-scope>
              <strong className="t-xs">{t(K.finding.scope)}</strong>
              {v.scope.map((x, i) => <p key={i} className="t-xs">{x.byName} · {formatDate(x.at, lang)} · {t(K.severity[x.from])} → {t(K.severity[x.to])}: {x.note}</p>)}
            </div>
          )}
          {v.rounds.filter((r) => r.completedAt).length > 0 && (
            <div className="stack gap-2" data-rounds>
              <strong className="t-xs">{t(K.finding.previous)}</strong>
              {v.rounds.filter((r) => r.completedAt).map((r) => (
                <div key={r.n} className="stack gap-1">
                  <span className="t-xs">{t(K.finding.previousBy, { n: r.n, name: r.startedByName, when: formatDate(r.completedAt as string, lang) })}</span>
                  {r.notes && <span className="t-xs t-muted">{r.notes}</span>}
                  {r.evidence.length > 0 && <div className="row gap-2 wrap">{r.evidence.map((e) => (e.previewUrl ? <img key={e.id} src={e.previewUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : null))}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {(a.assign || a.reassign) && (
        <Card className="mb-3">
          <div className="stack gap-3" data-assign-form>
            <strong className="t-sm">{t(K.assign.heading)}</strong>
            <p className="t-xs t-muted">{d.group.length > 1 ? t(K.assign.bodyGroup, { count: d.group.length }) : t(K.assign.body)}</p>
            {reassign && d.ownerName && <p className="t-sm">{t(K.assign.current, { name: d.ownerName })}</p>}
            <Field label={t(K.assign.who)} required>
              {({ id }) => (
                <Select id={id} value={who} onChange={(e) => setWho(e.target.value)} data-assign-tech>
                  <option value="">{t(K.assign.choose)}</option>
                  {techs.filter((x) => x.id !== d.ownerId).map((x) => <option key={x.id} value={x.id}>{t(K.assign.open, { name: x.name, count: x.openRework })}</option>)}
                </Select>
              )}
            </Field>
            <Field label={t(K.assign.reason)} hint={reassign ? t(K.assign.reasonHint, { count: REASON_MIN }) : t(K.assign.reasonNew)} required={reassign}>
              {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} data-assign-reason />}
            </Field>
            <p className="t-xs t-muted">{t(K.assign.due[d.severity])}</p>
          </div>
        </Card>
      )}

      {(a.start || a.complete || v.currentRound) && !closed && (
        <Card className="mb-3">
          <div className="stack gap-3" data-work-form>
            <strong className="t-sm">{t(K.work.heading)}</strong>
            {a.start && <p className="t-xs t-muted">{t(K.work.startHint)}</p>}
            {a.complete && (
              <>
                {d.recheckRoute && <p className="t-xs t-muted">{t(K.work.checklistHint)}</p>}
                {s.restored && <p className="t-xs t-muted" role="status">{t(K.work.draftRestored)}</p>}
                <Field label={t(K.work.notes)} hint={t(K.work.notesHint, { count: NOTES_MIN })} required>
                  {({ id, describedBy }) => (
                    <div className="stack gap-1">
                      <TextArea id={id} aria-describedby={describedBy} rows={4} value={s.notes} onChange={(e) => s.setNotes(e.target.value)} data-notes />
                      {notesOk && <span className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}><CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.work.notesOk)}</span>}
                    </div>
                  )}
                </Field>
                <div className="stack gap-2">
                  <strong className="t-xs">{t(K.work.evidence)} *</strong>
                  <span className="t-xs t-muted">{t(K.work.evidenceHint)}</span>
                  {s.attachments.length > 0 && (
                    <div className="row gap-2 wrap">
                      {s.attachments.map((x, i) => (
                        <div key={`${x.takenAt}-${i}`} style={{ position: 'relative' }}>
                          <img src={x.media.previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                          {x.media.kind === 'video' && <VideoCamera size={14} aria-hidden="true" style={{ position: 'absolute', left: 4, bottom: 4, background: 'var(--color-surface)', borderRadius: 4 }} />}
                          <button type="button" aria-label={t(K.work.remove)} onClick={() => s.setAttachments(s.attachments.filter((_, n) => n !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={12} aria-hidden="true" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="row gap-2 wrap">
                    <InlineCapture kind="photo" labels={captureLabels(t, 'photo')} onKeep={(m, takenAt) => s.setAttachments([...s.attachments, { media: m, takenAt }].slice(0, 6))} />
                    <InlineCapture kind="video" labels={captureLabels(t, 'video')} onKeep={(m, takenAt) => s.setAttachments([...s.attachments, { media: m, takenAt }].slice(0, 6))} />
                  </div>
                </div>
              </>
            )}
            {!a.start && !a.complete && v.viewer === 'owner' && d.status === 'ready_for_retest' && <p className="t-xs t-muted">{t(K.work.doneBody)}</p>}
          </div>
        </Card>
      )}

      {(v.parts.length > 0 || a.requestPart) && (
        <Card className="mb-3">
          <div className="stack gap-3" data-parts>
            <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}><Package size={18} aria-hidden="true" /> {t(K.parts.heading)}</strong>
            <p className="t-xs t-muted">{t(K.parts.intro)}</p>
            {v.parts.length === 0 && <p className="t-xs t-muted">{t(K.parts.none)}</p>}
            {v.parts.map((p) => (
              <div key={p.id} className="stack gap-1" data-part={p.id} data-part-status={p.status}>
                <p className="t-sm row gap-2 wrap" style={{ alignItems: 'center' }}>{t(K.parts.line, { qty: p.quantity, desc: p.description })} <Badge tone={p.status === 'received' ? 'success' : p.status === 'requested' ? 'warning' : 'accent'}>{t(K.parts.status[p.status])}</Badge></p>
                {p.poCode && <span className="t-xs t-muted">{t(K.parts.po, { code: p.poCode })}</span>}
                {p.note && <span className="t-xs t-muted">{p.note}</span>}
              </div>
            ))}
            <div className="row gap-2 wrap">
              {a.requestPart && <Button size="sm" variant="secondary" onClick={() => setSub('part')} data-request-part>{t(K.parts.request)}</Button>}
              {a.orderPart && <Button size="sm" onClick={() => { void s.loadOptions(); setSub('order'); }} data-order-part>{t(K.parts.order)}</Button>}
            </div>
          </div>
        </Card>
      )}

      {(a.escalate || a.handBack) && (
        <Card className="mb-3">
          <div className="stack gap-3">
            {a.escalate && (
              <div className="stack gap-1">
                <strong className="t-sm">{t(K.escalate.heading)}</strong>
                <p className="t-xs t-muted">{t(K.escalate.intro)}</p>
                <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => setSub('escalate')} data-escalate>{t(K.escalate.open)}</Button>
              </div>
            )}
            {a.handBack && (
              <div className="stack gap-1">
                <strong className="t-sm">{t(K.handBack.heading)}</strong>
                <p className="t-xs t-muted">{t(K.handBack.intro)}</p>
                <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} onClick={() => setSub('handBack')} data-hand-back>{t(K.handBack.open)}</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="stack gap-2">
          <strong className="t-sm">{t(K.history.heading)}</strong>
          <AscensionLine
            className="ds-ascension--multiline"
            steps={[...d.events].reverse().map((e, i) => ({ id: e.id, label: t(K.event[e.kind]), meta: `${formatDateTime(e.at, lang)} · ${e.byName}${e.note ? ` · ${e.note}` : ''}`, status: i === 0 ? 'current' : 'complete' }))}
          />
        </div>
      </Card>

      {error && <p className="t-xs t-error mt-3" role="alert">{error}</p>}

      {sticky && (
        <ActionBar>
          {(a.assign || a.reassign) && (
            <Button block disabled={!assignOk || s.busy} onClick={() => void run(() => s.assign(who, reason), () => { setWho(''); setReason(''); })} data-go="assign">{t(reassign ? K.assign.goReassign : K.assign.go)}</Button>
          )}
          {a.start && <Button block disabled={s.busy} onClick={() => void run(s.start)} data-go="start">{t(K.work.start)}</Button>}
          {a.complete && (
            <Button block disabled={!notesOk || !evidenceOk || s.busy} icon={<CheckCircle size={18} aria-hidden="true" />} onClick={() => void run(s.complete)} data-go="complete">{t(K.work.complete)}</Button>
          )}
        </ActionBar>
      )}

      <PartSheet open={sub === 'part'} onClose={() => setSub(null)} s={s} t={t} />
      <EscalateSheet open={sub === 'escalate'} onClose={() => setSub(null)} s={s} t={t} v={v} />
      <HandBackSheet open={sub === 'handBack'} onClose={() => setSub(null)} s={s} t={t} />
      <OrderSheet open={sub === 'order'} onClose={() => setSub(null)} s={s} t={t} v={v} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ small sheets */

function Actions({ t, onClose, go, disabled, onGo, dataGo }: { t: T; onClose: () => void; go: string; disabled: boolean; onGo: () => void; dataGo: string }) {
  return (
    <div className="row gap-2 wrap">
      <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
      <Button disabled={disabled} onClick={onGo} data-go={dataGo}>{go}</Button>
    </div>
  );
}

function PartSheet({ open, onClose, s, t }: { open: boolean; onClose: () => void; s: ReworkState; t: T }) {
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const q = Number(qty);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.parts.request)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="part">
        <Field label={t(K.parts.description)} hint={t(K.parts.descriptionHint)} required>
          {({ id }) => <Input id={id} value={desc} onChange={(e) => setDesc(e.target.value)} data-part-desc />}
        </Field>
        <Field label={t(K.parts.quantity)} required>
          {({ id }) => <Input id={id} className="num" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} data-part-qty />}
        </Field>
        <Field label={t(K.parts.note)}>
          {({ id }) => <TextArea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <Actions t={t} onClose={onClose} go={t(K.parts.send)} dataGo="part" disabled={desc.trim().length < 3 || !(q >= 1) || s.busy} onGo={async () => {
          const r = await s.requestPart({ description: desc, quantity: q, ...(note.trim() ? { note } : {}) });
          if (r.ok) {
            setDesc('');
            setQty('1');
            setNote('');
            setError(null);
            onClose();
          } else setError(t(errorKey(r.code)));
        }} />
      </div>
    </Sheet>
  );
}

function EscalateSheet({ open, onClose, s, t, v }: { open: boolean; onClose: () => void; s: ReworkState; t: T; v: ReworkView }) {
  const [sev, setSev] = useState<SnagSeverity | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const current = v.snag.severity;
  const choices = SEVERITY_LIST.filter((x) => severityRank(x) <= severityRank(current));
  const chosen = sev || current;
  return (
    <Sheet open={open} onClose={onClose} title={t(K.escalate.heading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="escalate">
        <p className="t-sm">{t(K.escalate.intro)}</p>
        <div className="stack gap-2" role="radiogroup" aria-label={t(K.escalate.severity)}>
          <strong className="t-xs">{t(K.escalate.severity)}</strong>
          <div className="row gap-2 wrap">
            {choices.map((x) => <Chip key={x} pressed={chosen === x} onClick={() => setSev(x)}>{t(K.severity[x])}</Chip>)}
          </div>
          {chosen === 'safety_critical' && current !== 'safety_critical' && <span className="t-xs" style={{ color: 'var(--color-error)' }}>{t(K.escalate.raisesBlock)}</span>}
        </div>
        <Field label={t(K.escalate.note)} hint={t(K.escalate.noteHint, { count: SCOPE_NOTE_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-text />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <Actions t={t} onClose={onClose} go={t(K.escalate.go)} dataGo="escalate" disabled={note.trim().length < SCOPE_NOTE_MIN || s.busy} onGo={async () => {
          const r = await s.escalate(chosen, note);
          if (r.ok) {
            setNote('');
            setSev('');
            setError(null);
            onClose();
          } else setError(t(errorKey(r.code)));
        }} />
      </div>
    </Sheet>
  );
}

function HandBackSheet({ open, onClose, s, t }: { open: boolean; onClose: () => void; s: ReworkState; t: T }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.handBack.heading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="handBack">
        <p className="t-sm">{t(K.handBack.intro)}</p>
        <Field label={t(K.handBack.reason)} hint={t(K.handBack.hint, { count: REASON_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-text />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <Actions t={t} onClose={onClose} go={t(K.handBack.go)} dataGo="handBack" disabled={reason.trim().length < REASON_MIN || s.busy} onGo={async () => {
          const r = await s.handBack(reason);
          if (r.ok) {
            setReason('');
            setError(null);
            onClose();
            s.goto(listPath);
          } else setError(t(errorKey(r.code)));
        }} />
      </div>
    </Sheet>
  );
}

function OrderSheet({ open, onClose, s, t, v }: { open: boolean; onClose: () => void; s: ReworkState; t: T; v: ReworkView }) {
  const pending = v.parts.filter((p) => p.status === 'requested');
  const [partId, setPartId] = useState('');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState<string | null>(null);
  const part = pending.find((p) => p.id === (partId || pending[0]?.id));
  const quantity = Number(qty || part?.quantity || 1);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.parts.orderTitle)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="order">
        <p className="t-sm">{t(K.parts.orderBody)}</p>
        {pending.length > 1 && (
          <Select aria-label={t(K.parts.description)} value={part?.id ?? ''} onChange={(e) => setPartId(e.target.value)}>
            {pending.map((p) => <option key={p.id} value={p.id}>{t(K.parts.line, { qty: p.quantity, desc: p.description })}</option>)}
          </Select>
        )}
        {part && <p className="t-sm">{t(K.parts.line, { qty: part.quantity, desc: part.description })}</p>}
        <Field label={t(K.parts.supplier)} required>
          {({ id }) => (
            <Select id={id} value={itemId} onChange={(e) => setItemId(e.target.value)} data-order-item>
              <option value="">{t(K.parts.chooseOption)}</option>
              {s.options.map((o) => <option key={o.itemId} value={o.itemId}>{t(K.parts.optionLine, { supplier: o.supplierName, desc: o.description, price: o.unitPrice, days: o.leadTimeDays })}</option>)}
            </Select>
          )}
        </Field>
        {s.options.length === 0 && <p className="t-xs t-muted">{t(K.parts.none2)}</p>}
        <Field label={t(K.parts.quantity)} required>
          {({ id }) => <Input id={id} className="num" inputMode="numeric" value={qty || String(part?.quantity ?? 1)} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <Actions t={t} onClose={onClose} go={t(K.parts.go)} dataGo="order" disabled={!part || !itemId || !(quantity >= 1) || s.busy} onGo={async () => {
          if (!part) return;
          const r = await s.orderPart(part.id, itemId, quantity);
          if (r.ok) {
            setItemId('');
            setQty('');
            setError(null);
            onClose();
          } else setError(t(errorKey(r.code)));
        }} />
      </div>
    </Sheet>
  );
}
