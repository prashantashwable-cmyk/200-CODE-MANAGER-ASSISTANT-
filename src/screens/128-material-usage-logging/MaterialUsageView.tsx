import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowsLeftRight, CheckCircle, CloudArrowUp, FloppyDisk, Package, Plus, Recycle, Trash, WifiSlash } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, ListRow, LoadingState, Screen, ScreenHeader, Select, Sheet, StatTile, TextArea, formatDateTime, formatINR } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { MaterialBoardView, MaterialLogView, MaterialPlanLine } from '@/data/repository';
import type { JobMaterialUse } from '@/data/types';
import { IDENTIFIER_MIN, REASON_MIN, identifierKind, identifierOk, isMajor } from '@/features/technician/materials';
import { identifiersNeeded, modeOf, useMaterialUsage } from './useMaterialUsage';
import type { MaterialState, Mode } from './useMaterialUsage';
import { DEVIATION_IDS, EXTRA_CATEGORIES, LEFTOVER_IDS, MATERIAL_KEYS as K, boardPath, homePath, jobPath, scorecardPath, usagePath } from './material-usage.types';

type T = ReturnType<typeof useTranslation>['t'];

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATE_TONE: Record<string, BadgeTone> = { on_site: 'success', awaiting_signature: 'warning', in_transit: 'neutral', preparing: 'neutral', issue: 'error' };
const categoryLabel = (t: T, c: string) => (c === 'small_parts' ? t(K.category.small_parts) : t(`partCategory.${c}`, { defaultValue: c }));

/**
 * Screen 128 — Material Usage Logging. What was actually put in the lift, against what was planned. The record the warranty and the final
 * costing read, so it is kept honest: every departure from the plan has a reason, a serial number that cannot be read is said to be
 * unreadable, a part from the technician's own stock is never allowed to stand in for a major component, and leftovers say where they go.
 */
export function MaterialUsageView() {
  const { t, i18n } = useTranslation();
  const s = useMaterialUsage();
  const lang = i18n.language;

  if (!s.jobId && !s.isAdmin) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <EmptyState icon={<Package size={28} />} title={t(K.pick.title)} body={t(K.pick.body)} actionLabel={t(K.pick.action)} onAction={() => s.goto(homePath)} />
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
  return <JobLog s={s} v={s.view!} t={t} lang={lang} />;
}

/* ---------------------------------------------------------------- pieces */

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

function SyncLine({ s, t }: { s: MaterialState; t: T }) {
  if (!s.editable) return null;
  const line = !s.isOnline ? (s.pendingConfirm ? K.sync.pendingConfirm : K.sync.offline) : s.pendingConfirm ? K.sync.pendingConfirm : s.sending ? K.sync.sending : s.dirty ? K.sync.local : K.sync.saved;
  const Icon = !s.isOnline ? WifiSlash : s.dirty || s.pendingConfirm || s.sending ? CloudArrowUp : CheckCircle;
  return (
    <p className="t-xs t-muted row gap-2 mb-3" style={{ alignItems: 'center' }} role="status" data-sync={s.pendingConfirm ? 'pending' : s.dirty ? 'local' : 'saved'}>
      <Icon size={14} aria-hidden="true" /> {t(line)}
    </p>
  );
}

function JobLog({ s, v, t, lang }: { s: MaterialState; v: MaterialLogView; t: T; lang: string }) {
  const [confirming, setConfirming] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [reason, setReason] = useState('');
  const [reopenError, setReopenError] = useState<string | null>(null);
  const showForm = s.editable;
  const missing = s.unanswered.length > 0 ? t(K.confirm.missingLines, { count: s.unanswered.length }) : s.rowsWithProblems > 0 ? t(K.confirm.missingRows, { count: s.rowsWithProblems }) : null;

  const doConfirm = async () => {
    setConfirming(false);
    await s.confirm();
  };
  const doReopen = async () => {
    const r = await s.reopen(reason);
    if (r.ok) {
      setReopening(false);
      setReason('');
      setReopenError(null);
    } else setReopenError(t(errorKey(r.code)));
  };

  return (
    <Screen width="default" className={showForm ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={() => (s.isAdmin ? s.goto(boardPath) : s.goto(jobPath(v.job.id)))} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />
      <div className="row gap-2 wrap mb-3" style={{ alignItems: 'center' }}>
        <Badge tone={v.status === 'confirmed' ? 'success' : v.status === 'draft' ? 'warning' : 'neutral'} dot>
          {t(K.status[v.status])}
        </Badge>
        {v.status === 'confirmed' && v.confirmedAt && (
          <span className="t-xs t-muted">
            {t(K.confirm.by, { name: v.confirmedByName ?? '', when: formatDateTime(v.confirmedAt, lang) })}
          </span>
        )}
      </div>
      <SyncLine s={s} t={t} />

      {s.failed && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
          <div className="stack gap-2" role="alert">
            <p className="t-sm">{t(errorKey(s.failed))}</p>
            <Button size="sm" variant="secondary" onClick={s.dismissFailed} style={{ width: 'fit-content' }}>
              {t('action.close')}
            </Button>
          </div>
        </Card>
      )}

      {v.lockedReason && v.lockedReason !== 'confirmed' && (
        <Card className="mb-3">
          <p className="t-sm t-muted">{t(K.locked[v.lockedReason])}</p>
        </Card>
      )}
      {v.status === 'confirmed' && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-success)' }}>
          <div className="stack gap-2">
            <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}>
              <CheckCircle size={18} weight="fill" color="var(--color-success)" aria-hidden="true" /> {t(K.confirm.done)}
            </strong>
            <p className="t-sm">{t(K.confirm.doneBody)}</p>
            {v.canReopen && (
              <Button size="sm" variant="secondary" onClick={() => setReopening(true)} style={{ width: 'fit-content' }}>
                {t(K.admin.reopen)}
              </Button>
            )}
          </div>
        </Card>
      )}
      {v.reopened.length > 0 && (
        <Card className="mb-3">
          <div className="stack gap-1">
            <strong className="t-sm">{t(K.admin.reopenedHeading)}</strong>
            {v.reopened.map((r, n) => (
              <p key={n} className="t-xs t-muted">
                {t(K.confirm.reopened, { name: r.byName, when: formatDateTime(r.at, lang), reason: r.reason })}
              </p>
            ))}
          </div>
        </Card>
      )}

      {showForm && s.draftRestored && (
        <p className="t-xs t-muted mb-3" role="status">
          {t(K.sync.notSent)}
        </p>
      )}
      {showForm && (
        <Card className="mb-4">
          <div className="stack gap-1">
            <h2 className="t-lg t-semibold">{t(K.intro.title)}</h2>
            <p className="t-sm t-muted">{t(K.intro.body)}</p>
          </div>
        </Card>
      )}

      <div className="stack gap-4">
        {v.costs && <CostCard v={v} t={t} />}

        <Section title={t(K.plan.heading)} hint={showForm ? t(K.plan.subheading, { answered: v.planned.length - s.unanswered.length, total: v.planned.length }) : undefined}>
          {v.planned.length === 0 ? (
            <EmptyState icon={<Package size={28} />} title={t(K.empty.title)} body={t(K.empty.body)} />
          ) : (
            <div className="grid-auto" style={{ ['--min' as string]: '340px' }}>
              {v.planned.map((line) => (
                <PlanRow key={line.id} s={s} line={line} row={s.rows.find((r) => r.lineItemId === line.id)} t={t} showCost={!!v.costs} />
              ))}
            </div>
          )}
        </Section>

        <Section title={t(K.extra.heading)} hint={showForm ? t(K.extra.intro) : undefined}>
          {s.rows.filter((r) => !r.lineItemId).length === 0 && <p className="t-sm t-muted">{t(K.extra.empty)}</p>}
          <div className="grid-auto" style={{ ['--min' as string]: '340px' }}>
            {s.rows
              .filter((r) => !r.lineItemId)
              .map((r) => (
                <ExtraRow key={r.id} s={s} row={r} plan={v.planned} t={t} />
              ))}
          </div>
          {showForm && (
            <div className="row gap-2 wrap">
              <Button variant="secondary" icon={<ArrowsLeftRight size={16} aria-hidden="true" />} onClick={() => s.addExtra('substitute', v.planned.find((p) => !s.rows.some((r) => r.deviation?.replacesLineItemId === p.id))?.id ?? v.planned[0]?.id)} disabled={v.planned.length === 0} data-add="substitute">
                {t(K.extra.kindSubstitute)}
              </Button>
              <Button variant="secondary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => s.addExtra('extra_needed')} data-add="extra">
                {t(K.extra.add)}
              </Button>
            </div>
          )}
        </Section>

        {v.pool.length > 0 && (
          <Section title={t(K.pool.heading)} hint={t(K.pool.body)}>
            <Card flush>
              {v.pool.map((p, n) => (
                <ListRow key={`${p.jobId}-${n}`} leading={<Recycle size={20} aria-hidden="true" />} title={`${p.quantity} × ${p.description}`} subtitle={`${p.jobCode} · ${p.siteName}${p.distanceKm !== null ? ` · ${t(K.pool.away, { km: p.distanceKm })}` : ''}`} />
              ))}
            </Card>
            <p className="t-xs t-muted">{t(K.pool.note)}</p>
          </Section>
        )}
      </div>

      {showForm && (
        <ActionBar>
          {missing && <p className="t-xs t-muted mb-2">{missing}</p>}
          <div className="row gap-2">
            <Button variant="secondary" icon={<FloppyDisk size={18} aria-hidden="true" />} onClick={() => void s.saveDraftNow()} disabled={!s.dirty || s.sending || !s.isOnline} style={{ flex: '0 0 auto' }}>
              {t(K.confirm.saveDraft)}
            </Button>
            <Button block style={{ flex: '1 1 0' }} disabled={!s.valid || s.sending} icon={<CheckCircle size={18} aria-hidden="true" />} onClick={() => setConfirming(true)} data-confirm="open">
              {t(K.confirm.button)}
            </Button>
          </div>
        </ActionBar>
      )}

      <Sheet open={confirming} onClose={() => setConfirming(false)} title={t(K.confirm.title)} closeLabel={t('action.close')}>
        <ConfirmSummary s={s} t={t} onBack={() => setConfirming(false)} onGo={() => void doConfirm()} />
      </Sheet>
      <Sheet open={reopening} onClose={() => setReopening(false)} title={t(K.admin.reopenTitle)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <p className="t-sm">{t(K.admin.reopenBody)}</p>
          <Field label={t(K.admin.reopenReason)} required error={reopenError ?? undefined}>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <div className="row gap-2 wrap">
            <Button variant="secondary" onClick={() => setReopening(false)}>
              {t(K.confirm.back)}
            </Button>
            <Button disabled={reason.trim().length < REASON_MIN || s.busy} onClick={() => void doReopen()}>
              {t(K.admin.reopenGo)}
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}

function ConfirmSummary({ s, t, onBack, onGo }: { s: MaterialState; t: T; onBack: () => void; onGo: () => void }) {
  const used = s.rows.reduce((sum, r) => sum + r.usedQty, 0);
  const deviations = s.rows.filter((r) => r.deviation).length;
  const leftover = s.rows.reduce((sum, r) => sum + r.leftoverQty, 0);
  const unreadable = s.rows.reduce((sum, r) => sum + r.identifiers.filter((i) => !i.legible).length, 0);
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(K.confirm.body)}</p>
      <ul className="stack gap-1 t-sm">
        <li>{t(K.confirm.summaryUsed, { count: used })}</li>
        <li>{t(K.confirm.summaryDeviations, { count: deviations })}</li>
        <li>{t(K.confirm.summaryLeftover, { count: leftover })}</li>
        {unreadable > 0 && <li>{t(K.confirm.summaryUnlegible, { count: unreadable })}</li>}
      </ul>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onBack}>
          {t(K.confirm.back)}
        </Button>
        <Button onClick={onGo} data-confirm="go" icon={<CheckCircle size={18} aria-hidden="true" />}>
          {t(K.confirm.go)}
        </Button>
      </div>
    </div>
  );
}

function CostCard({ v, t }: { v: MaterialLogView; t: T }) {
  const c = v.costs!;
  return (
    <Card>
      <div className="stack gap-3">
        <div className="stack gap-1">
          <h3 className="t-sm t-semibold">{t(K.admin.costs)}</h3>
          <p className="t-xs t-muted">{t(K.admin.costsNote)}</p>
        </div>
        <div className="grid-auto" style={{ ['--min' as string]: '140px' }}>
          <StatTile label={t(K.admin.planned)} value={<span className="num">{formatINR(c.planned)}</span>} />
          <StatTile label={t(K.admin.asInstalled)} value={<span className="num">{v.status === 'none' ? '—' : formatINR(c.asInstalled)}</span>} />
          <StatTile label={t(K.admin.leftoverValue)} value={<span className="num">{formatINR(c.leftoverValue)}</span>} />
          <StatTile label={t(K.admin.extras)} value={<span className="num">{formatINR(c.extras)}</span>} />
        </div>
      </div>
    </Card>
  );
}

/** A number field that only takes whole numbers in a range: a small stepper on a phone is quicker than typing. */
function Qty({ id, value, min, max, onChange, label }: { id?: string; value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="row gap-2" style={{ alignItems: 'center' }}>
      <Button size="sm" variant="secondary" aria-label={`${label} −`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </Button>
      <Input id={id} className="num" style={{ width: 72, textAlign: 'center' }} inputMode="numeric" value={value} aria-label={label} onChange={(e) => onChange(Math.min(max, Math.max(min, Number.parseInt(e.target.value.replace(/\D/g, '') || String(min), 10))))} />
      <Button size="sm" variant="secondary" aria-label={`${label} +`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </Button>
    </div>
  );
}

function ReasonField({ s, row, kinds, t }: { s: MaterialState; row: JobMaterialUse; kinds: typeof DEVIATION_IDS; t: T }) {
  const d = row.deviation;
  if (!d) return null;
  const ok = d.reason.trim().length >= REASON_MIN;
  return (
    <div className="stack gap-2">
      {kinds.length > 0 && (
        <Field label={t(K.plan.why)}>
          {({ id }) => (
            <Select id={id} value={d.kind} onChange={(e) => s.patchRow(row.id, { deviation: { ...d, kind: e.target.value as typeof d.kind } })}>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {t(K.deviation[k])}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <Field label={t(K.plan.reason)} hint={t(K.plan.reasonHint, { count: REASON_MIN })} required>
        {({ id, describedBy }) => (
          <div className="stack gap-1">
            <TextArea id={id} aria-describedby={describedBy} rows={2} value={d.reason} onChange={(e) => s.patchRow(row.id, { deviation: { ...d, reason: e.target.value } })} />
            {ok && (
              <span className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}>
                <CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.plan.reasonOk)}
              </span>
            )}
          </div>
        )}
      </Field>
    </div>
  );
}

function LeftoverField({ s, row, t }: { s: MaterialState; row: JobMaterialUse; t: T }) {
  if (row.leftoverQty <= 0) return null;
  return (
    <div className="stack gap-2">
      <strong className="t-xs">{t(K.plan.leftoverAction)}</strong>
      <div className="row gap-2 wrap" role="group" aria-label={t(K.plan.leftoverAction)}>
        {LEFTOVER_IDS.map((a) => (
          <Chip key={a} pressed={row.leftoverAction === a} onClick={() => s.patchRow(row.id, { leftoverAction: a })} icon={a === 'return_to_pool' ? <Recycle size={14} aria-hidden="true" /> : undefined}>
            {t(K.leftover[a])}
          </Chip>
        ))}
      </div>
      {row.leftoverAction && <p className="t-xs t-muted">{t(K.leftoverHint[row.leftoverAction])}</p>}
    </div>
  );
}

/** One serial (or batch) number per unit, or an honest "cannot be read": a number is never made up to fill a box. */
function Identifiers({ s, row, t }: { s: MaterialState; row: JobMaterialUse; t: T }) {
  const need = identifiersNeeded(row);
  if (need === 0) return null;
  const batch = identifierKind(row.category) === 'batch';
  return (
    <div className="stack gap-2" data-identifiers={row.id}>
      <strong className="t-xs">{t(K.ids.heading)}</strong>
      <p className="t-xs t-muted">{t(batch ? K.ids.hintBatch : K.ids.hintSerial)}</p>
      {row.identifiers.slice(0, need).map((i, n) => {
        const value = (batch ? i.batch : i.serial) ?? '';
        const ok = i.legible && identifierOk(i);
        return (
          <div key={n} className="stack gap-1" style={{ paddingBottom: 'var(--space-2)' }}>
            {i.legible ? (
              <Field label={need > 1 ? t(K.ids.unit, { n: n + 1, label: t(batch ? K.ids.batch : K.ids.serial) }) : t(batch ? K.ids.batch : K.ids.serial)}>
                {({ id }) => (
                  <div className="stack gap-1">
                    <Input id={id} mono value={value} autoCapitalize="characters" autoComplete="off" onChange={(e) => s.setIdentifier(row.id, n, batch ? { batch: e.target.value } : { serial: e.target.value })} data-identifier={n} />
                    {ok && (
                      <span className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}>
                        <CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.ids.valid)}
                      </span>
                    )}
                    {!ok && value.length > 0 && <span className="t-xs t-muted">{t(K.ids.tooShort, { count: IDENTIFIER_MIN })}</span>}
                  </div>
                )}
              </Field>
            ) : (
              <Field label={t(K.ids.note)}>{({ id }) => <Input id={id} value={i.note ?? ''} onChange={(e) => s.setIdentifier(row.id, n, { note: e.target.value })} />}</Field>
            )}
            <Checkbox checked={!i.legible} onChange={(x) => s.setIdentifier(row.id, n, x ? { legible: false, serial: undefined, batch: undefined } : { legible: true })} label={<span className="stack"><span className="t-sm t-medium">{t(K.ids.notLegible)}</span><span className="t-xs t-muted">{t(K.ids.notLegibleHint)}</span></span>} />
          </div>
        );
      })}
    </div>
  );
}

function PlanRow({ s, line, row, t, showCost }: { s: MaterialState; line: MaterialPlanLine; row?: JobMaterialUse; t: T; showCost: boolean }) {
  const editable = s.editable;
  const mode: Mode | null = row ? modeOf(row) : null;
  const problem = row ? s.problemOf(row.id) : null;
  const replacements = s.rows.filter((r) => r.deviation?.replacesLineItemId === line.id);
  const remaining = row ? row.plannedQty - row.usedQty - row.leftoverQty : 0;
  const modes: Mode[] = line.quantity > 1 ? ['planned', 'part', 'none'] : ['planned', 'none'];
  return (
    <div data-line={line.id} data-answered={row ? 'yes' : 'no'}>
      <Card>
        <div className="stack gap-3">
          <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stack gap-1">
              <strong className="t-sm">{line.description}</strong>
              <span className="t-xs t-muted">
                {categoryLabel(t, line.category)} · {line.poCode}
                {line.supplierName ? ` · ${line.supplierName}` : ''}
              </span>
            </div>
            <span className="t-sm" style={{ whiteSpace: 'nowrap' }}>{t(K.plan.ordered, { count: line.quantity })}</span>
          </div>
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={STATE_TONE[line.state] ?? 'neutral'}>{t(K.state[line.state])}</Badge>
            {line.state !== 'on_site' && <span className="t-xs t-muted">{t(K.plan.unconfirmed)}</span>}
            {showCost && line.unitPrice !== null && <span className="t-xs t-muted num">{formatINR(line.unitPrice)}</span>}
          </div>

          {editable ? (
            <div className="stack gap-3">
              <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.plan.howUsed)}>
                {modes.map((m) => (
                  <Chip key={m} pressed={mode === m} onClick={() => s.answer(line, m)}>
                    {t(K.mode[m])}
                  </Chip>
                ))}
              </div>
              {row && mode === 'part' && (
                <div className="grid-2">
                  <Field label={t(K.plan.usedQty)}>{({ id }) => <Qty id={id} label={t(K.plan.usedQty)} value={row.usedQty} min={1} max={row.plannedQty} onChange={(n) => s.setQuantities(row.id, n, row.leftoverQty)} />}</Field>
                  <Field label={t(K.plan.leftoverQty)}>{({ id }) => <Qty id={id} label={t(K.plan.leftoverQty)} value={row.leftoverQty} min={0} max={Math.max(0, row.plannedQty - row.usedQty)} onChange={(n) => s.setQuantities(row.id, row.usedQty, n)} />}</Field>
                </div>
              )}
              {row && mode === 'part' && remaining > 0 && <p className="t-xs t-muted">{t(K.plan.remainingHint, { count: remaining })}</p>}
              {row && row.deviation && <ReasonField s={s} row={row} kinds={DEVIATION_IDS} t={t} />}
              {row && <LeftoverField s={s} row={row} t={t} />}
              {row && mode !== 'none' && <Identifiers s={s} row={row} t={t} />}
              {row && mode === 'none' && replacements.length === 0 && (
                <Button size="sm" variant="secondary" icon={<ArrowsLeftRight size={16} aria-hidden="true" />} onClick={() => s.addExtra('substitute', line.id)} style={{ width: 'fit-content' }}>
                  {t(K.plan.addReplacement)}
                </Button>
              )}
              {row && problem && (
                <p className="t-xs t-muted" data-problem={problem}>
                  • {t(errorKey(problem))}
                </p>
              )}
            </div>
          ) : row ? (
            <ReadRow row={row} t={t} />
          ) : (
            <p className="t-sm t-muted">{t(K.plan.noPlan)}</p>
          )}
          {replacements.length > 0 && (
            <p className="t-xs t-muted row gap-1" style={{ alignItems: 'center' }}>
              <ArrowsLeftRight size={14} aria-hidden="true" /> {t(K.plan.replacedBy, { what: replacements.map((r) => r.description || categoryLabel(t, r.category)).join(', ') })}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ReadRow({ row, t }: { row: JobMaterialUse; t: T }) {
  const m = modeOf(row);
  return (
    <div className="stack gap-1">
      <p className="t-sm">
        {row.lineItemId ? (
          <>
            {t(K.mode[m])} · <span className="num">{row.usedQty}</span>/<span className="num">{row.plannedQty}</span>
          </>
        ) : (
          <>
            {t(K.plan.usedQty)}: <span className="num">{row.usedQty}</span>
          </>
        )}
        {row.leftoverQty > 0 && row.leftoverAction ? ` · ${t(K.plan.leftoverQty)} ${row.leftoverQty}: ${t(K.leftover[row.leftoverAction])}` : ''}
      </p>
      {row.deviation && (
        <p className="t-xs t-muted">
          {t(K.deviation[row.deviation.kind])}: {row.deviation.reason}
        </p>
      )}
      {row.identifiers.map((i, n) => (
        <p key={n} className="t-xs t-muted num">
          {i.legible ? (i.serial ?? i.batch ?? '') : `${t(K.installed.unreadable)}${i.note ? ` (${i.note})` : ''}`}
        </p>
      ))}
    </div>
  );
}

function ExtraRow({ s, row, plan, t }: { s: MaterialState; row: JobMaterialUse; plan: MaterialPlanLine[]; t: T }) {
  const editable = s.editable;
  const d = row.deviation;
  const problem = s.problemOf(row.id);
  const major = isMajor(row.category);
  if (!editable) {
    return (
      <Card>
        <div className="stack gap-1">
          <strong className="t-sm">{row.description || categoryLabel(t, row.category)}</strong>
          <span className="t-xs t-muted">
            {categoryLabel(t, row.category)} · {t(K.source[row.source])} · <span className="num">{row.usedQty}</span>
            {row.unitCost ? ` · ${formatINR(row.unitCost)}` : ''}
          </span>
          <ReadRow row={row} t={t} />
        </div>
      </Card>
    );
  }
  const substitute = d?.kind === 'substitute';
  return (
    <div data-extra={row.id}>
      <Card>
        <div className="stack gap-3">
          <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.extra.kind)}>
            <Chip pressed={substitute} onClick={() => s.patchRow(row.id, { deviation: { kind: 'substitute', reason: d?.reason ?? '', replacesLineItemId: d?.replacesLineItemId ?? plan[0]?.id } })}>
              {t(K.extra.kindSubstitute)}
            </Chip>
            <Chip pressed={!substitute} onClick={() => s.patchRow(row.id, { deviation: { kind: 'extra_needed', reason: d?.reason ?? '' } })}>
              {t(K.extra.kindExtra)}
            </Chip>
          </div>
          {substitute && (
            <Field label={t(K.extra.replaces)} required>
              {({ id }) => (
                <Select id={id} value={d?.replacesLineItemId ?? ''} onChange={(e) => s.patchRow(row.id, { deviation: { kind: 'substitute', reason: d?.reason ?? '', replacesLineItemId: e.target.value || undefined } })}>
                  <option value="">{t(K.extra.pickReplaces)}</option>
                  {plan.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.description}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          <div className="grid-2">
            <Field label={t(K.extra.category)}>
              {({ id }) => (
                <Select id={id} value={row.category} onChange={(e) => s.setExtraCategory(row.id, e.target.value)}>
                  {EXTRA_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(t, c)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t(K.extra.source)}>
              {({ id }) => (
                <Select id={id} value={row.source} onChange={(e) => s.patchRow(row.id, { source: e.target.value as JobMaterialUse['source'] })}>
                  <option value="stock" disabled={major}>
                    {t(K.source.stock)}
                  </option>
                  <option value="local_purchase">{t(K.source.local_purchase)}</option>
                </Select>
              )}
            </Field>
          </div>
          <p className="t-xs t-muted">{t(row.source === 'stock' ? K.extra.stockNote : K.extra.boughtNote)}</p>
          {major && <p className="t-xs t-muted">{t(K.extra.stockMajor)}</p>}
          <Field label={t(K.extra.what)} hint={t(K.extra.whatHint)} required>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={row.description} onChange={(e) => s.patchRow(row.id, { description: e.target.value })} data-extra-what />}
          </Field>
          <div className="grid-2">
            <Field label={t(K.extra.qty)}>{({ id }) => <Qty id={id} label={t(K.extra.qty)} value={row.usedQty} min={1} max={999} onChange={(n) => s.patchRow(row.id, { usedQty: n })} />}</Field>
            {row.source === 'local_purchase' && (
              <Field label={t(K.extra.cost)} hint={t(K.extra.costHint)}>
                {({ id }) => <Input id={id} className="num" inputMode="numeric" value={row.unitCost ?? ''} onChange={(e) => s.patchRow(row.id, { unitCost: e.target.value ? Number.parseInt(e.target.value.replace(/\D/g, '') || '0', 10) : undefined })} />}
              </Field>
            )}
          </div>
          {d && <ReasonField s={s} row={row} kinds={[]} t={t} />}
          <Identifiers s={s} row={row} t={t} />
          {problem && (
            <p className="t-xs t-muted" data-problem={problem}>
              • {t(errorKey(problem))}
            </p>
          )}
          <Button size="sm" variant="ghost" icon={<Trash size={16} aria-hidden="true" />} onClick={() => s.removeRow(row.id)} style={{ width: 'fit-content' }}>
            {t(K.extra.remove)}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- Admin board */

function BoardView({ s, board, t, lang }: { s: MaterialState; board: MaterialBoardView; t: T; lang: string }) {
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.boardTitle)} subtitle={t(K.board.subtitle)} />
      <div className="grid-auto mb-4" style={{ ['--min' as string]: '140px' }}>
        <Card>
          <StatTile label={t(K.board.jobs)} value={board.totals.jobs} />
        </Card>
        <Card>
          <StatTile label={t(K.board.confirmed)} value={board.totals.confirmed} />
        </Card>
        <Card>
          <StatTile label={t(K.board.waiting)} value={board.totals.waiting} />
        </Card>
        <Card>
          <StatTile label={t(K.board.deviations)} value={board.totals.deviations} />
        </Card>
      </div>

      <div className="main-aside">
        <div className="stack gap-4">
          <Section title={t(K.board.jobsHeading)}>
            {board.rows.length === 0 ? (
              <EmptyState icon={<Package size={28} />} title={t(K.board.noJobs)} body={t(K.empty.body)} />
            ) : (
              <Card flush>
                {board.rows.map((r) => (
                  <ListRow
                    key={r.jobId}
                    title={`${r.jobCode} · ${r.siteName}`}
                    subtitle={r.logStatus === 'none' ? t(K.card.notLogged) : t(K.board.row, { deviations: r.deviations, substitutions: r.substitutions, leftovers: r.leftovers })}
                    trailing={
                      <Badge tone={r.logStatus === 'confirmed' ? 'success' : r.logStatus === 'draft' ? 'warning' : 'neutral'} dot>
                        {t(K.status[r.logStatus])}
                      </Badge>
                    }
                    onClick={() => s.goto(usagePath(r.jobId))}
                  />
                ))}
              </Card>
            )}
          </Section>
        </div>
        <div className="stack gap-4">
          <Section title={t(K.board.patterns)} hint={t(K.board.patternsBody)}>
            {board.patterns.length === 0 ? (
              <p className="t-sm t-muted">{t(K.board.noPatterns)}</p>
            ) : (
              board.patterns.map((p) => (
                <Card key={p.supplierId}>
                  <div className="stack gap-2" data-pattern={p.supplierId}>
                    <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong className="t-sm">{p.supplierName}</strong>
                      <Badge tone={p.needsReview ? 'warning' : 'neutral'} dot>
                        {t(p.needsReview ? K.board.review : K.board.watching)}
                      </Badge>
                    </div>
                    <p className="t-sm">{t(K.board.patternLine, { deviations: p.deviations, jobs: p.jobs })}</p>
                    <p className="t-xs t-muted">{p.kinds.map((k) => `${t(K.deviation[k.kind])} × ${k.count}`).join(' · ')}</p>
                    <p className="t-xs t-muted">{formatDateTime(p.lastAt, lang)}</p>
                    <Button size="sm" variant="secondary" onClick={() => s.goto(scorecardPath(p.supplierId))} style={{ width: 'fit-content' }}>
                      {t(K.board.scorecard)}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </Section>
          {board.pool.length > 0 && (
            <Section title={t(K.board.poolHeading)}>
              <Card flush>
                {board.pool.map((p, n) => (
                  <ListRow key={n} leading={<Recycle size={20} aria-hidden="true" />} title={`${p.quantity} × ${p.description}`} subtitle={`${p.jobCode} · ${p.siteName}`} />
                ))}
              </Card>
            </Section>
          )}
        </div>
      </div>
    </Screen>
  );
}
