import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CaretRight, CheckCircle, Flag, Plus, ShieldWarning, Sparkle, VideoCamera, Wrench, X } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, StatTile, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { SnagDetailView, SnagRowView, SopMediaInput } from '@/data/repository';
import type { DisputeDecision, SnagSeverity } from '@/features/qc/snags';
import { DECISION_MIN, DISPUTE_MIN, NOTE_MIN, REASON_MIN, WAIVER_NOTE_MIN, isOpen } from '@/features/qc/snags';
import { InlineCapture } from '@/features/technician/InlineCapture';
import type { InlineCaptureLabels } from '@/features/technician/InlineCapture';
import { useSnagList } from './useSnagList';
import type { ActionResult, SnagState } from './useSnagList';
import { DECISIONS, PAGE, SEVERITY_LIST, SNAG_KEYS as K, STATUS_FILTERS, boardPath } from './snag-list.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const SEVERITY_TONE: Record<SnagSeverity, BadgeTone> = { safety_critical: 'error', functional: 'warning', cosmetic: 'neutral' };
const STATUS_TONE: Record<string, BadgeTone> = { open: 'warning', assigned: 'accent', in_progress: 'accent', ready_for_retest: 'accent', disputed: 'warning', verified: 'success', waived: 'success', withdrawn: 'neutral' };
const SEVERITY_ICON = { safety_critical: ShieldWarning, functional: Wrench, cosmetic: Sparkle };

const captureLabels = (t: T, kind: 'photo' | 'video'): InlineCaptureLabels => ({
  add: t(kind === 'video' ? K.add.addVideo : K.add.addPhoto),
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
 * Screen 135 — Defect / Snag List. One punch-list for the mechanical and electrical checks and anything the inspector adds, grouped by severity
 * so safety-critical items are never buried. Assignment goes through here (per snag or in a batch); a fix is closed only by QC's re-check; a
 * technician's disagreement goes to Admin; linked snags resolve together; and a cosmetic item the customer accepts is logged as their choice.
 */
export function SnagListScreen() {
  const { t } = useTranslation();
  const s = useSnagList();
  const wrap = (body: JSX.Element) => (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} />
      {body}
    </Screen>
  );
  if (s.status === 'not_found') return wrap(<EmptyState icon={<Flag size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />);
  if (s.status === 'loading' && !s.board) return wrap(<LoadingState label={t(K.loading)} variant="list" rows={6} />);
  if (s.status === 'error' || !s.board) return wrap(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  return <List s={s} t={t} />;
}

function List({ s, t }: { s: SnagState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const b = s.board!;
  const admin = b.viewer === 'admin';
  const [sheet, setSheet] = useState<null | 'add' | 'assign' | 'link'>(null);
  const [more, setMore] = useState<Partial<Record<SnagSeverity, number>>>({});
  const addable = b.jobs.filter((j) => j.canAdd);
  const job = s.jobId ? b.jobs.find((j) => j.id === s.jobId) : null;
  const sel = s.selectedRows;
  const canLink = sel.length >= 2 && sel.every((r) => r.source === 'snag' && isOpen(r.status) && r.jobId === sel[0].jobId) && (admin || b.viewer === 'inspector');
  const canAssign = admin && sel.length >= 1 && sel.every((r) => r.status === 'open' || r.status === 'assigned' || r.status === 'in_progress');
  const filtered = s.statusFilter !== 'open' || s.severity !== 'all' || s.q.trim() !== '' || s.jobPick !== 'all';
  const bySeverity = SEVERITY_LIST.map((sv) => ({ sv, rows: s.rows.filter((r) => r.severity === sv) })).filter((g) => g.rows.length > 0);
  return (
    <Screen width="default" className={sel.length > 0 ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={job ? `${job.siteName} · ${job.code}` : undefined}
        action={
          <div className="row gap-2">
            {s.jobId && (
              <Button size="sm" variant="ghost" onClick={() => s.goto(boardPath)} aria-label={t(K.back)}>
                <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
              </Button>
            )}
            {addable.length > 0 && <Button size="sm" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setSheet('add')} data-add-snag>{t(K.add.open)}</Button>}
          </div>
        }
      />
      <div className="grid-auto mb-3" style={{ ['--min' as string]: '140px' }}>
        <StatTile label={t(K.stat.open)} value={b.totals.open} />
        <StatTile label={t(K.stat.blocking)} value={<span style={b.totals.blocking > 0 ? { color: 'var(--color-error)' } : undefined}>{b.totals.blocking}</span>} />
        <StatTile label={t(K.stat.pending)} value={b.totals.pendingVerification} />
        <StatTile label={t(K.stat.disputed)} value={b.totals.disputed} />
      </div>
      {b.totals.blocking > 0 && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
          <div className="row gap-2" style={{ alignItems: 'flex-start' }} role="alert" data-blocking>
            <ShieldWarning size={20} aria-hidden="true" color="var(--color-error)" />
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.block.title, { count: b.totals.blocking })}</strong>
              <span className="t-xs">{t(K.block.body)}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.q} onChange={(e) => s.setQ(e.target.value)} data-search />
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.label)}>
          {STATUS_FILTERS.map((f) => (
            <Chip key={f} pressed={s.statusFilter === f} onClick={() => s.setStatusFilter(f)}>{t(K.filter.status[f])}</Chip>
          ))}
        </div>
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.label)}>
          <Chip pressed={s.severity === 'all'} onClick={() => s.setSeverity('all')}>{t(K.filter.severityAll)}</Chip>
          {SEVERITY_LIST.map((sv) => (
            <Chip key={sv} pressed={s.severity === sv} onClick={() => s.setSeverity(sv)}>{t(K.severity[sv])}</Chip>
          ))}
        </div>
        {!s.jobId && b.jobs.length > 1 && (
          <Select aria-label={t(K.filter.job)} value={s.jobPick} onChange={(e) => s.setJobPick(e.target.value)}>
            <option value="all">{t(K.filter.jobAll)}</option>
            {b.jobs.map((j) => <option key={j.id} value={j.id}>{j.code} · {j.siteName}</option>)}
          </Select>
        )}
      </div>

      {b.rows.length === 0 ? (
        <EmptyState icon={<CheckCircle size={32} />} title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : s.rows.length === 0 ? (
        <EmptyState icon={<Flag size={28} />} title={t(K.empty.filtered)} body={t(K.empty.filteredBody)} actionLabel={filtered ? t(K.empty.clear) : undefined} onAction={filtered ? s.clearFilters : undefined} />
      ) : (
        <div className="stack gap-4">
          {bySeverity.map(({ sv, rows }) => {
            const shown = rows.slice(0, PAGE + (more[sv] ?? 0));
            const Icon = SEVERITY_ICON[sv];
            return (
              <section key={sv} className="stack gap-2" aria-labelledby={`sev-${sv}`} data-severity={sv}>
                <div className="row gap-2" style={{ alignItems: 'center' }}>
                  <Icon size={20} aria-hidden="true" color={sv === 'safety_critical' ? 'var(--color-error)' : 'var(--color-accent-secondary)'} />
                  <h2 id={`sev-${sv}`} className="t-md t-semibold">{t(K.severity[sv])}</h2>
                  <Badge tone={SEVERITY_TONE[sv]}>{t(K.section.count, { count: rows.length })}</Badge>
                </div>
                <p className="t-xs t-muted">{t(K.severityHint[sv])}</p>
                <Card>
                  <div className="stack">
                    {shown.map((r) => (
                      <Row key={r.id} r={r} s={s} t={t} lang={lang} selectable={admin || b.viewer === 'inspector'} />
                    ))}
                  </div>
                </Card>
                {rows.length > shown.length && <Button variant="ghost" size="sm" style={{ width: 'fit-content' }} onClick={() => setMore((m) => ({ ...m, [sv]: (m[sv] ?? 0) + PAGE }))}>{t(K.section.more, { count: rows.length - shown.length })}</Button>}
              </section>
            );
          })}
        </div>
      )}

      {sel.length > 0 && (
        <ActionBar>
          <div className="row gap-2 wrap" style={{ alignItems: 'center', justifyContent: 'space-between' }} data-selection>
            <span className="t-sm">{t(K.select.count, { count: sel.length })}</span>
            <div className="row gap-2 wrap">
              <Button size="sm" variant="ghost" onClick={s.clearSelection}>{t(K.select.clear)}</Button>
              {canLink && <Button size="sm" variant="secondary" onClick={() => setSheet('link')} data-batch-link>{t(K.select.link)}</Button>}
              {canAssign && <Button size="sm" onClick={() => setSheet('assign')} data-batch-assign>{t(K.select.assign)}</Button>}
            </div>
          </div>
        </ActionBar>
      )}

      <AddSheet open={sheet === 'add'} onClose={() => setSheet(null)} s={s} t={t} jobs={addable} fixedJob={s.jobId} />
      <AssignSheet open={sheet === 'assign'} onClose={() => setSheet(null)} s={s} t={t} ids={sel.map((r) => r.id)} severities={sel.map((r) => r.severity)} />
      <LinkSheet open={sheet === 'link'} onClose={() => setSheet(null)} s={s} t={t} rows={sel} />
      <DetailSheet s={s} t={t} lang={lang} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ row */

function Row({ r, s, t, lang, selectable }: { r: SnagRowView; s: SnagState; t: T; lang: string; selectable: boolean }) {
  const Icon = SEVERITY_ICON[r.severity];
  const name = r.itemLabelKey ? t(r.itemLabelKey) : r.title;
  const from = r.source === 'qc_mechanical' ? t(K.row.mechanical) : r.source === 'qc_electrical' ? t(K.row.electrical) : t(K.row.manual);
  return (
    <div className="row gap-2" style={{ alignItems: 'center', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2) 0' }} data-snag={r.id} data-status={r.status} data-severity={r.severity}>
      {selectable && isOpen(r.status) ? (
        <Checkbox checked={s.selected.has(r.id)} onChange={() => s.toggle(r.id)} label={<span className="sr-only">{t(K.row.select, { name })}</span>} />
      ) : (
        <span style={{ width: 28 }} aria-hidden="true" />
      )}
      <button type="button" onClick={() => s.openSnag(r.id)} className="row gap-3" style={{ flex: 1, minHeight: 56, alignItems: 'center', textAlign: 'left', background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit' }}>
        <Icon size={22} aria-hidden="true" color={r.severity === 'safety_critical' ? 'var(--color-error)' : 'var(--color-accent-secondary)'} />
        <span className="stack" style={{ flex: 1, minWidth: 0 }}>
          <strong className="t-sm">{name}</strong>
          <span className="t-xs t-muted">{r.code} · {r.jobCode} · {from} · {t(K.row.raised, { date: formatDate(r.raisedAt, lang) })}</span>
          <span className="t-xs t-muted">
            {r.ownerName ? t(K.row.owner, { name: r.ownerName }) : isOpen(r.status) ? t(K.row.unassigned) : ''}
            {r.dueAt && isOpen(r.status) && r.status !== 'ready_for_retest' && r.status !== 'disputed' ? ` · ${t(K.row.due, { when: formatDateTime(r.dueAt, lang) })}` : ''}
            {r.groupSize > 1 ? ` · ${t(K.row.linked, { count: r.groupSize })}` : ''}
          </span>
        </span>
        <span className="stack" style={{ alignItems: 'flex-end', gap: 4 }}>
          <Badge tone={STATUS_TONE[r.status]} dot>{t(K.status[r.status])}</Badge>
          {r.overdue && <Badge tone="error">{t(K.row.overdue)}</Badge>}
          {r.blocking && !r.overdue && <Badge tone="error">{t(K.row.blocking)}</Badge>}
        </span>
        <CaretRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ add a snag */

function AddSheet({ open, onClose, s, t, jobs, fixedJob }: { open: boolean; onClose: () => void; s: SnagState; t: T; jobs: { id: string; code: string; siteName: string }[]; fixedJob: string | null }) {
  const [jobId, setJobId] = useState('');
  const [name, setName] = useState('');
  const [sev, setSev] = useState<SnagSeverity>('functional');
  const [note, setNote] = useState('');
  const [media, setMedia] = useState<{ media: Omit<SopMediaInput, 'capturedAt'>; takenAt: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const target = fixedJob ?? (jobId || jobs[0]?.id || '');
  const ok = name.trim().length >= 3 && note.trim().length >= NOTE_MIN && (sev !== 'safety_critical' || media.length > 0) && !!target;
  return (
    <Sheet open={open} onClose={onClose} title={t(K.add.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-add-form>
        {!fixedJob && jobs.length > 1 && (
          <Field label={t(K.add.job)} required>
            {({ id }) => (
              <Select id={id} value={target} onChange={(e) => setJobId(e.target.value)}>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.code} · {j.siteName}</option>)}
              </Select>
            )}
          </Field>
        )}
        <Field label={t(K.add.name)} hint={t(K.add.nameHint)} required>
          {({ id }) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} data-add-name />}
        </Field>
        <div className="stack gap-2">
          <strong className="t-xs">{t(K.add.severity)}</strong>
          <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.add.severity)}>
            {SEVERITY_LIST.map((sv) => <Chip key={sv} pressed={sev === sv} onClick={() => setSev(sv)}>{t(K.severity[sv])}</Chip>)}
          </div>
          <span className="t-xs t-muted">{t(K.severityHint[sev])}</span>
        </div>
        <Field label={t(K.add.note)} hint={t(K.add.noteHint, { count: NOTE_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-add-note />}
        </Field>
        <div className="stack gap-2">
          <strong className="t-xs">{t(K.add.evidence)}{sev === 'safety_critical' ? ' *' : ''}</strong>
          <span className="t-xs t-muted">{t(sev === 'safety_critical' ? K.add.evidenceSafety : K.add.evidenceHint)}</span>
          {media.length > 0 && (
            <div className="row gap-2 wrap">
              {media.map((m, i) => (
                <div key={`${m.takenAt}-${i}`} style={{ position: 'relative' }}>
                  <img src={m.media.previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  {m.media.kind === 'video' && <VideoCamera size={14} aria-hidden="true" style={{ position: 'absolute', left: 4, bottom: 4, background: 'var(--color-surface)', borderRadius: 4 }} />}
                  <button type="button" aria-label={t(K.add.remove)} onClick={() => setMedia(media.filter((_, n) => n !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={12} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="row gap-2 wrap">
            <InlineCapture kind="photo" labels={captureLabels(t, 'photo')} onKeep={(m, takenAt) => setMedia((x) => [...x, { media: m, takenAt }].slice(0, 6))} />
            <InlineCapture kind="video" labels={captureLabels(t, 'video')} onKeep={(m, takenAt) => setMedia((x) => [...x, { media: m, takenAt }].slice(0, 6))} />
          </div>
        </div>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button
            disabled={!ok || s.busy}
            data-add-go
            onClick={async () => {
              const r = await s.add(target, { title: name, note, severity: sev, evidence: media.map((m) => ({ ...m.media, capturedAt: m.takenAt })) });
              if (r.ok) {
                setName('');
                setNote('');
                setMedia([]);
                setError(null);
                onClose();
              } else setError(t(errorKey(r.code)));
            }}
          >
            {t(K.add.go)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ assign (batch or single) */

function AssignSheet({ open, onClose, s, t, ids, severities, reassign }: { open: boolean; onClose: () => void; s: SnagState; t: T; ids: string[]; severities: SnagSeverity[]; reassign?: boolean }) {
  const [who, setWho] = useState('');
  const [error, setError] = useState<string | null>(null);
  const techs = s.board?.technicians ?? [];
  const worst = SEVERITY_LIST.find((sv) => severities.includes(sv));
  return (
    <Sheet open={open} onClose={onClose} title={t(reassign ? K.assign.reassign : K.assign.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-assign-form>
        <p className="t-sm">{t(K.assign.body, { count: ids.length })}</p>
        <Field label={t(K.assign.tech)} required>
          {({ id }) => (
            <Select id={id} value={who} onChange={(e) => setWho(e.target.value)} data-assign-tech>
              <option value="">{t(K.assign.choose)}</option>
              {techs.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
          )}
        </Field>
        {worst && <p className="t-xs t-muted">{t(K.assign.due[worst])}</p>}
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button
            disabled={!who || s.busy}
            data-assign-go
            onClick={async () => {
              const r = await s.assign(ids, who);
              if (r.ok) {
                setWho('');
                setError(null);
                onClose();
              } else setError(t(errorKey(r.code)));
            }}
          >
            {t(K.assign.go)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ link */

function LinkSheet({ open, onClose, s, t, rows }: { open: boolean; onClose: () => void; s: SnagState; t: T; rows: SnagRowView[] }) {
  const [primary, setPrimary] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const chosen = primary || rows[0]?.id || '';
  return (
    <Sheet open={open} onClose={onClose} title={t(K.link.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-link-form>
        <p className="t-sm">{t(K.link.body)}</p>
        <Field label={t(K.link.primary)} required>
          {({ id }) => (
            <Select id={id} value={chosen} onChange={(e) => setPrimary(e.target.value)} data-link-primary>
              {rows.map((r) => <option key={r.id} value={r.id}>{r.code} · {r.title}</option>)}
            </Select>
          )}
        </Field>
        <Field label={t(K.link.note)} hint={t(K.link.noteHint, { count: WAIVER_NOTE_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-link-note />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button
            disabled={note.trim().length < WAIVER_NOTE_MIN || s.busy}
            data-link-go
            onClick={async () => {
              const r = await s.link(rows.map((x) => x.id), chosen, note);
              if (r.ok) {
                setNote('');
                setError(null);
                onClose();
              } else setError(t(errorKey(r.code)));
            }}
          >
            {t(K.link.go)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ one snag */

type DetailSheetKind = null | 'assign' | 'regrade' | 'dispute' | 'decide' | 'waive' | 'verify';

function DetailSheet({ s, t, lang }: { s: SnagState; t: T; lang: string }) {
  const d = s.detail;
  const [sub, setSub] = useState<DetailSheetKind>(null);
  return (
    <>
      <Sheet open={!!s.openId && !!d} onClose={() => { setSub(null); s.openSnag(null); }} title={d ? (d.itemLabelKey ? t(d.itemLabelKey) : (d.title ?? d.code)) : ''} closeLabel={t('action.close')}>
        {d && <Detail d={d} s={s} t={t} lang={lang} onAct={setSub} />}
      </Sheet>
      {d && <AssignSheet open={sub === 'assign'} onClose={() => setSub(null)} s={s} t={t} ids={[d.id]} severities={[d.severity]} reassign={!!d.ownerId} />}
      {d && <TextAction open={sub === 'regrade'} onClose={() => setSub(null)} t={t} title={t(K.regrade.title)} label={t(K.regrade.reason)} hint={t(K.regrade.hint, { count: REASON_MIN })} min={REASON_MIN} go={t(K.regrade.go)} extra={(v, set) => (
        <div className="stack gap-2" role="radiogroup" aria-label={t(K.regrade.to)}>
          <strong className="t-xs">{t(K.regrade.to)}</strong>
          <div className="row gap-2 wrap">
            {SEVERITY_LIST.filter((sv) => sv !== d.severity).map((sv) => <Chip key={sv} pressed={v === sv} onClick={() => set(sv)}>{t(K.severity[sv])}</Chip>)}
          </div>
        </div>
      )} onSubmit={(text, pick) => s.regrade(d.id, (pick || SEVERITY_LIST.find((sv) => sv !== d.severity)) as SnagSeverity, text)} dataKey="regrade" />}
      {d && <TextAction open={sub === 'dispute'} onClose={() => setSub(null)} t={t} title={t(K.dispute.title)} body={t(K.dispute.body)} label={t(K.dispute.reason)} hint={t(K.dispute.hint, { count: DISPUTE_MIN })} min={DISPUTE_MIN} go={t(K.dispute.go)} onSubmit={(text) => s.dispute(d.id, text)} dataKey="dispute" />}
      {d && <DecideSheet open={sub === 'decide'} onClose={() => setSub(null)} s={s} t={t} d={d} />}
      {d && <WaiveSheet open={sub === 'waive'} onClose={() => setSub(null)} s={s} t={t} d={d} />}
      {d && <TextAction open={sub === 'verify'} onClose={() => setSub(null)} t={t} title={t(K.verify.title)} body={t(K.verify.body)} label={t(K.verify.note)} hint="" min={0} go={t(K.verify.go)} onSubmit={(text) => s.verify(d.id, text)} dataKey="verify" />}
    </>
  );
}

function Detail({ d, s, t, lang, onAct }: { d: SnagDetailView; s: SnagState; t: T; lang: string; onAct: (k: DetailSheetKind) => void }) {
  const a = d.actions;
  const any = a.assign || a.regrade || a.dispute || a.decide || a.waive || a.verify;
  return (
    <div className="stack gap-3" data-detail={d.id} data-status={d.status}>
      <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
        <Badge tone={SEVERITY_TONE[d.severity]}>{t(K.severity[d.severity])}</Badge>
        <Badge tone={STATUS_TONE[d.status]} dot>{t(K.status[d.status])}</Badge>
        <span className="t-xs t-muted">{d.code}</span>
      </div>
      {d.blocking && <p className="t-xs row gap-2" style={{ alignItems: 'center', color: 'var(--color-error)' }}><ShieldWarning size={16} aria-hidden="true" /> {t(K.detail.blocking)}</p>}
      <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
        <Line label={t(K.detail.job)} value={`${d.jobCode} · ${d.siteName}`} />
        <Line label={t(K.detail.source[d.source])} value={d.itemLabelKey ? t(d.itemLabelKey) : (d.title ?? '')} />
        <Line label={t(K.detail.raised)} value={`${d.raisedByName} · ${formatDateTime(d.raisedAt, lang)}`} />
        <Line label={t(K.detail.owner)} value={d.ownerName ?? t(K.detail.unassigned)} />
        {d.dueAt && isOpen(d.status) && <Line label={t(K.detail.due)} value={formatDateTime(d.dueAt, lang)} />}
      </dl>
      <div className="stack gap-1">
        <strong className="t-xs">{t(K.detail.note)}</strong>
        <p className="t-sm">{d.note}</p>
      </div>
      <div className="stack gap-1">
        <strong className="t-xs">{t(K.detail.evidence)}</strong>
        {d.evidence.length === 0 ? <span className="t-xs t-muted">{t(K.detail.noEvidence)}</span> : <div className="row gap-2 wrap">{d.evidence.map((e) => (e.previewUrl ? <img key={e.id} src={e.previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : null))}</div>}
      </div>

      {d.group.length > 1 && (
        <div className="stack gap-1" data-group>
          <strong className="t-xs">{t(K.detail.groupHeading)}</strong>
          {d.group.map((g) => (
            <p key={g.id} className="t-xs">{g.code} · {g.title}{g.primary ? ` · ${t(K.detail.groupPrimary)}` : ''} · {t(K.status[g.status])}</p>
          ))}
          {d.groupNote && <p className="t-xs t-muted">{d.groupNote}</p>}
          <p className="t-xs t-muted">{t(K.detail.groupRule)}</p>
        </div>
      )}
      {d.resolvedVia && <p className="t-xs t-muted">{t(K.detail.resolvedVia, { code: d.resolvedVia.code })}</p>}
      {d.dispute && (
        <div className="stack gap-1" data-dispute>
          <strong className="t-xs">{t(K.detail.disputeHeading)}</strong>
          <p className="t-xs">{t(K.detail.disputeBy, { name: d.dispute.byName, when: formatDateTime(d.dispute.at, lang) })}: {d.dispute.reason}</p>
          {d.dispute.decision && <p className="t-xs">{t(K.detail.decisionBy, { name: d.dispute.decision.byName, what: t(K.decide.kind[d.dispute.decision.kind]) })}: {d.dispute.decision.note}</p>}
        </div>
      )}
      {d.waiver && (
        <div className="stack gap-1" data-waiver>
          <strong className="t-xs">{t(K.detail.waiverHeading)}</strong>
          <p className="t-xs">{t(K.detail.waiverBy, { name: d.waiver.by, when: formatDateTime(d.waiver.at, lang) })}: {d.waiver.note}</p>
          <p className="t-xs t-muted">{t(K.detail.waiverFoot, { name: d.waiver.recordedByName })}</p>
        </div>
      )}
      {d.verifiedAt && <p className="t-xs">{t(K.detail.verified, { name: d.verifiedByName ?? '', when: formatDateTime(d.verifiedAt, lang) })}</p>}
      {d.status === 'ready_for_retest' && <p className="t-xs t-muted">{t(K.detail.pendingHint)}</p>}

      {d.recheckRoute && isOpen(d.status) && (
        <div className="stack gap-1">
          <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => s.goto(d.recheckRoute as string)} data-recheck>{t(K.detail.recheck)}</Button>
          <span className="t-xs t-muted">{t(K.detail.recheckHint)}</span>
        </div>
      )}
      {any && (
        <div className="stack gap-2" data-actions>
          <strong className="t-xs">{t(K.detail.actions)}</strong>
          <div className="row gap-2 wrap">
            {(a.assign || a.dispute || d.ownerId) && isOpen(d.status) && <Button size="sm" variant="secondary" onClick={() => s.goto(`/rework/${d.id}`)} data-act="rework">{t(K.detail.rework)}</Button>}
            {a.verify && <Button size="sm" onClick={() => onAct('verify')} data-act="verify">{t(K.verify.open)}</Button>}
            {a.decide && <Button size="sm" onClick={() => onAct('decide')} data-act="decide">{t(K.decide.open)}</Button>}
            {a.assign && <Button size="sm" variant="secondary" onClick={() => onAct('assign')} data-act="assign">{t(d.ownerId ? K.assign.reassign : K.assign.open)}</Button>}
            {a.dispute && <Button size="sm" variant="secondary" onClick={() => onAct('dispute')} data-act="dispute">{t(K.dispute.open)}</Button>}
            {a.waive && <Button size="sm" variant="secondary" onClick={() => onAct('waive')} data-act="waive">{t(K.waive.open)}</Button>}
            {a.regrade && <Button size="sm" variant="ghost" onClick={() => onAct('regrade')} data-act="regrade">{t(K.regrade.open)}</Button>}
          </div>
        </div>
      )}
      <div className="stack gap-2">
        <strong className="t-xs">{t(K.detail.timeline)}</strong>
        <AscensionLine
          className="ds-ascension--multiline"
          steps={[...d.events].reverse().map((e, i) => ({ id: e.id, label: t(K.detail.event[e.kind]), meta: `${formatDateTime(e.at, lang)} · ${e.byName}${e.note ? ` · ${e.note}` : ''}`, status: i === 0 ? 'current' : 'complete' }))}
        />
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="row gap-2" style={{ justifyContent: 'space-between' }}>
      <dt className="t-muted">{label}</dt>
      <dd style={{ margin: 0, textAlign: 'right' }}>{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ small sheets */

function TextAction({ open, onClose, t, title, body, label, hint, min, go, onSubmit, extra, dataKey }: { open: boolean; onClose: () => void; t: T; title: string; body?: string; label: string; hint: string; min: number; go: string; onSubmit: (text: string, pick: string) => Promise<ActionResult>; extra?: (value: string, set: (v: string) => void) => JSX.Element; dataKey: string }) {
  const [text, setText] = useState('');
  const [pick, setPick] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={title} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form={dataKey}>
        {body && <p className="t-sm">{body}</p>}
        {extra?.(pick, setPick)}
        <Field label={label} hint={hint || undefined} required={min > 0}>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={text} onChange={(e) => setText(e.target.value)} data-text />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button
            disabled={text.trim().length < min || busy}
            data-go={dataKey}
            onClick={async () => {
              setBusy(true);
              const r = await onSubmit(text, pick);
              setBusy(false);
              if (r.ok) {
                setText('');
                setPick('');
                setError(null);
                onClose();
              } else setError(t(errorKey(r.code)));
            }}
          >
            {go}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function DecideSheet({ open, onClose, s, t, d }: { open: boolean; onClose: () => void; s: SnagState; t: T; d: SnagDetailView }) {
  const [kind, setKind] = useState<DisputeDecision>('finding_stands');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const allowed = DECISIONS.filter((k) => d.actions.decisions.includes(k));
  return (
    <Sheet open={open} onClose={onClose} title={t(K.decide.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="decide">
        {d.dispute && <p className="t-sm">{d.dispute.reason}</p>}
        <div className="stack gap-2" role="radiogroup" aria-label={t(K.decide.title)}>
          {allowed.map((k) => (
            <div key={k} className="stack gap-1">
              <Chip pressed={kind === k} onClick={() => setKind(k)}>{t(K.decide.kind[k])}</Chip>
              {kind === k && <span className="t-xs t-muted">{t(K.decide.kindHint[k])}</span>}
            </div>
          ))}
          {!allowed.includes('finding_withdrawn') && <span className="t-xs t-muted">{t(K.decide.locked)}</span>}
        </div>
        <Field label={t(K.decide.note)} hint={t(K.decide.hint, { count: DECISION_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-text />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button
            disabled={note.trim().length < DECISION_MIN || s.busy}
            data-go="decide"
            onClick={async () => {
              const r = await s.decide(d.id, kind, note);
              if (r.ok) {
                setNote('');
                setError(null);
                onClose();
              } else setError(t(errorKey(r.code)));
            }}
          >
            {t(K.decide.go)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function WaiveSheet({ open, onClose, s, t, d }: { open: boolean; onClose: () => void; s: SnagState; t: T; d: SnagDetailView }) {
  const [by, setBy] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.waive.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="waive">
        <p className="t-sm">{t(K.waive.body)}</p>
        <Field label={t(K.waive.by)} hint={t(K.waive.byHint)} required>
          {({ id }) => <Input id={id} value={by} onChange={(e) => setBy(e.target.value)} data-waive-by />}
        </Field>
        <Field label={t(K.waive.note)} hint={t(K.waive.noteHint, { count: WAIVER_NOTE_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-text />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button
            disabled={by.trim().length < 2 || note.trim().length < WAIVER_NOTE_MIN || s.busy}
            data-go="waive"
            onClick={async () => {
              const r = await s.waive(d.id, by, note);
              if (r.ok) {
                setBy('');
                setNote('');
                setError(null);
                onClose();
              } else setError(t(errorKey(r.code)));
            }}
          >
            {t(K.waive.go)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

