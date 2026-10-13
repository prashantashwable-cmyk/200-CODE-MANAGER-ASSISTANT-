import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Check, GraduationCap, HourglassMedium, Minus, TrendDown, TrendUp, Warning, XCircle } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, SegBar, Sheet, TextArea, formatINR } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { AssignTrainingResult, DriveDemandView, SkillCellState, SkillColumnView, SkillMatrixView, SkillRowView } from '@/data/repository';
import { ASSIGN_MAX_DAYS, MATRIX_KEYS as K, NOTE_MAX, PULL_DISTANCE, SMALL_WORKFORCE, STRETCHED_AT, VIEWS, lessonsPath, recruitmentPath } from './skill-matrix.types';
import { useSkillMatrix } from './useSkillMatrix';
import type { SkillMatrixState } from './useSkillMatrix';

type T = ReturnType<typeof useTranslation>['t'];
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const moduleTitle = (t: T, code: string) => t(`trainingLib.content.${code.toLowerCase()}.title`, { defaultValue: code });
const columnLabel = (t: T, c: SkillColumnView) => (c.kind === 'tag' ? t(`partnerDir.skill.${c.id}`, { defaultValue: c.id }) : moduleTitle(t, c.moduleCode as string));
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
const HOLDS: SkillCellState[] = ['held', 'current', 'expiring', 'grace'];
const CELL_ICON: Record<SkillCellState, ReactNode> = {
  held: <Check size={14} weight="bold" aria-hidden="true" style={{ color: 'var(--color-success)' }} />,
  current: <Check size={14} weight="bold" aria-hidden="true" style={{ color: 'var(--color-success)' }} />,
  expiring: <HourglassMedium size={14} aria-hidden="true" style={{ color: 'var(--color-warning)' }} />,
  grace: <HourglassMedium size={14} aria-hidden="true" style={{ color: 'var(--color-warning)' }} />,
  lapsed: <XCircle size={14} aria-hidden="true" style={{ color: 'var(--color-warning)' }} />,
  earlier: <Warning size={14} aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }} />,
  in_progress: <GraduationCap size={14} aria-hidden="true" style={{ color: 'var(--color-accent-primary)' }} />,
  missing: <Minus size={14} aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }} />,
  none: <Minus size={14} aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }} />,
};
const SIGNAL_TONE: Record<DriveDemandView['signal'], BadgeTone> = { untracked: 'neutral', no_supply: 'error', stretched: 'warning', tight: 'accent', covered: 'success', no_demand: 'neutral' };

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

type Selected = { kind: 'cell'; userId: string; colId: string } | { kind: 'col'; colId: string } | null;

/**
 * Screen 157 — Skill Matrix & Gap Analysis. Every technician against every skill tag and certification, on one grid, with the gaps called out; the demand the
 * pipeline puts on each drive type against the people qualified for it; and whether certification coverage is improving. It is deliberately modest about a small
 * workforce (counts, not percentages) and never offers training as the only answer: where training cannot close a gap in time it points to recruitment.
 */
export function SkillMatrixScreen() {
  const { t } = useTranslation();
  const s = useSkillMatrix();
  const [selected, setSelected] = useState<Selected>(null);
  const [assigning, setAssigning] = useState<{ moduleId: string; moduleCode: string; userIds: string[] } | null>(null);
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const d = s.data;
  if (s.status === 'loading' && !d) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={4} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.status === 'error' || !d) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  if (d.rows.length === 0) return <Screen width="wide"><ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} /><EmptyState icon={<GraduationCap size={28} />} title={t(K.empty.title)} body={t(K.empty.body)} actionLabel={t(K.empty.action)} onAction={() => s.goto(recruitmentPath)} /></Screen>;

  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-skill-matrix>
      <Screen width="wide">
        {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<span className="row gap-2 wrap"><Button size="sm" variant="ghost" data-compliance onClick={() => s.goto('/training-compliance')}>{t(K.compliance)}</Button><Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button></span>} />
        <div className="stack gap-4">
          <Kpis s={s} d={d} t={t} />
          <SegBar label={t(K.title)} value={s.view} onChange={s.setView} items={VIEWS.map((v) => ({ id: v, label: t(K.view[v]) }))} />
          {d.small && <p className="t-xs t-muted" data-small-note>{t(K.small.workforce, { count: d.kpis.technicians, min: SMALL_WORKFORCE })}</p>}
          {s.view === 'matrix' && <Matrix d={d} t={t} onCell={(userId, colId) => setSelected({ kind: 'cell', userId, colId })} onCol={(colId) => setSelected({ kind: 'col', colId })} />}
          {s.view === 'demand' && <Demand s={s} d={d} t={t} />}
          {s.view === 'trend' && <Trend d={d} t={t} />}
        </div>
        <DetailSheet s={s} d={d} t={t} selected={selected} onClose={() => setSelected(null)} onAssign={(moduleId, moduleCode, userIds) => { setSelected(null); setAssigning({ moduleId, moduleCode, userIds }); }} />
        <AssignSheet s={s} d={d} t={t} state={assigning} onClose={() => setAssigning(null)} />
      </Screen>
    </div>
  );
}

/* ------------------------------------------------------------------ the KPI cards */

function Kpis({ s, d, t }: { s: SkillMatrixState; d: SkillMatrixView; t: T }) {
  const last = [...d.trend.points].reverse().find((p) => p.coverage !== null)?.coverage ?? null;
  const cols = d.columns.length;
  const dir = d.trend.direction;
  const card = (id: string, label: string, value: ReactNode, caption: ReactNode, view: string, tone?: 'warn') => (
    <Card onClick={() => s.setView(view)}>
      <div className="stack gap-1" data-kpi={id}>
        <span className="t-xs t-muted">{label}</span>
        <span className="t-display" style={{ fontSize: 'var(--text-2xl, 1.75rem)', lineHeight: 1.1, color: tone === 'warn' ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>{value}</span>
        <span className="t-xs t-muted">{caption}</span>
      </div>
    </Card>
  );
  return (
    <div className="grid-auto" style={{ '--min': '150px' } as React.CSSProperties} data-kpis>
      {card('gaps', t(K.kpi.gaps), d.kpis.gaps, t(K.kpi.gapsCaption, { total: cols }), 'matrix', d.kpis.gaps > 0 ? 'warn' : undefined)}
      {card('qualified', t(K.kpi.qualified), `${d.kpis.fullyQualified} / ${d.kpis.technicians}`, t(K.kpi.qualifiedCaption), 'matrix')}
      {card('demand', t(K.kpi.demandGaps), d.kpis.demandGaps, t(K.kpi.demandGapsCaption), 'demand', d.kpis.demandGaps > 0 ? 'warn' : undefined)}
      {card('trend', t(K.kpi.trend), d.small || last === null ? (last === null ? '—' : `${last}%`) : `${last}%`, <span className="row gap-1" style={{ alignItems: 'center' }}>{dir === 'up' ? <TrendUp size={13} aria-hidden="true" style={{ color: 'var(--color-success)' }} /> : dir === 'down' ? <TrendDown size={13} aria-hidden="true" style={{ color: 'var(--color-warning)' }} /> : <Minus size={13} aria-hidden="true" />}{d.trend.delta === null ? t(K.trend.flat) : t(K.trend[dir], { points: Math.abs(d.trend.delta) })}{d.small ? ` · ${t(K.kpi.trendSmall)}` : ''}</span>, 'trend')}
    </div>
  );
}

/* ------------------------------------------------------------------ the grid */

function Matrix({ d, t, onCell, onCol }: { d: SkillMatrixView; t: T; onCell: (userId: string, colId: string) => void; onCol: (colId: string) => void }) {
  const tags = d.columns.filter((c) => c.kind === 'tag');
  const certs = d.columns.filter((c) => c.kind === 'cert');
  return (
    <section className="stack gap-2" data-matrix>
      <p className="t-xs t-muted">{t(K.matrix.tapHint)}</p>
      <div style={{ overflowX: 'auto' }} data-grid-scroll>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 'max-content', width: '100%' }}>
          <thead>
            <tr>
              <th rowSpan={2} scope="col" style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--color-bg)', textAlign: 'left', padding: 'var(--space-2)', minWidth: 120 }} className="t-xs t-muted">{t(K.matrix.technician)}</th>
              <th colSpan={tags.length} scope="colgroup" className="t-xs t-muted" style={{ padding: 'var(--space-1) var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>{t(K.matrix.tags)}</th>
              <th colSpan={certs.length} scope="colgroup" className="t-xs t-muted" style={{ padding: 'var(--space-1) var(--space-2)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }}>{t(K.matrix.certs)}</th>
            </tr>
            <tr>
              {d.columns.map((c, i) => (
                <th key={c.id} scope="col" style={{ padding: 'var(--space-1)', minWidth: 96, verticalAlign: 'bottom', borderLeft: i === tags.length ? '1px solid var(--color-border)' : undefined }}>
                  <button type="button" data-col={c.id} onClick={() => onCol(c.id)} className="stack gap-1" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', textAlign: 'center', width: '100%', alignItems: 'center', padding: 'var(--space-1)' }}>
                    <span className="t-xs" style={{ fontWeight: 600 }}>{columnLabel(t, c)}</span>
                    <span className="t-xs t-muted" data-held>{t(K.matrix.held, { held: c.held, total: c.total })}{c.coverage !== null ? ` · ${c.coverage}%` : ''}</span>
                    {c.gap && <Badge tone="warning">{c.solo ? t(K.matrix.solo) : t(K.matrix.gap)}</Badge>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r) => <MatrixRow key={r.userId} r={r} d={d} t={t} onCell={onCell} tagCount={tags.length} />)}
          </tbody>
        </table>
      </div>
      <p className="t-xs t-muted" data-legend>{t(K.matrix.legend)}</p>
    </section>
  );
}

function MatrixRow({ r, d, t, onCell, tagCount }: { r: SkillRowView; d: SkillMatrixView; t: T; onCell: (userId: string, colId: string) => void; tagCount: number }) {
  return (
    <tr data-row={r.userId}>
      <th scope="row" style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--color-bg)', textAlign: 'left', padding: 'var(--space-2)', borderTop: '1px solid var(--color-border)', fontWeight: 600 }} className="t-sm">
        <span className="stack"><span>{r.name}</span><span className="t-xs t-muted">{t(K.matrix.openJobs, { count: r.openJobs })}</span></span>
      </th>
      {d.columns.map((c, i) => {
        const cell = r.cells[c.id];
        return (
          <td key={c.id} style={{ padding: 0, borderTop: '1px solid var(--color-border)', borderLeft: i === tagCount ? '1px solid var(--color-border)' : undefined }}>
            <button type="button" data-cell={`${r.userId}:${c.id}`} data-state={cell.state} onClick={() => onCell(r.userId, c.id)} className="stack" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 'var(--space-1)', gap: 2 }} aria-label={`${r.name}, ${columnLabel(t, c)}: ${t(K.cell[cell.state])}`}>
              <span className="row gap-1 t-xs" style={{ alignItems: 'center' }}>{CELL_ICON[cell.state]}{t(K.cell[cell.state])}</span>
              {cell.assigned && <span className="t-xs" style={{ color: 'var(--color-accent-primary)' }}>{t(K.matrix.assigned)}</span>}
            </button>
          </td>
        );
      })}
    </tr>
  );
}

/* ------------------------------------------------------------------ the sheet behind a cell or a column header */

function DetailSheet({ s, d, t, selected, onClose, onAssign }: { s: SkillMatrixState; d: SkillMatrixView; t: T; selected: Selected; onClose: () => void; onAssign: (moduleId: string, moduleCode: string, userIds: string[]) => void }) {
  const col = selected ? d.columns.find((c) => c.id === selected.colId) ?? null : null;
  const row = selected?.kind === 'cell' ? d.rows.find((r) => r.userId === selected.userId) ?? null : null;
  const holders = col ? d.rows.filter((r) => HOLDS.includes(r.cells[col.id].state)) : [];
  const missing = col ? d.rows.filter((r) => !HOLDS.includes(r.cells[col.id].state)) : [];
  const assignable = col?.kind === 'cert' ? missing.filter((r) => !r.cells[col.id].assigned) : [];
  return (
    <Sheet open={!!selected && !!col} onClose={onClose} title={col ? (row ? row.name : columnLabel(t, col)) : ''} closeLabel={t(K.close)}>
      {col && (
        <div className="stack gap-3" data-detail={selected?.kind} data-col={col.id}>
          {row ? (
            <>
              <p className="t-sm"><strong>{columnLabel(t, col)}:</strong> {t(K.cell[row.cells[col.id].state])}</p>
              <p className="t-sm">{t(K.cellBody[row.cells[col.id].state])}</p>
              {row.cells[col.id].assigned && <p className="t-xs" data-assigned-note>{t(K.matrix.assigned)} · {row.cells[col.id].dueDate}</p>}
            </>
          ) : (
            <>
              <p className="t-sm">{t(K.matrix.held, { held: col.held, total: col.total })}{col.coverage !== null ? ` · ${col.coverage}%` : ''}</p>
              <p className="t-sm">{col.solo ? t(K.sheet.soloBody) : col.gap ? t(K.sheet.gapBody) : t(K.sheet.okBody)}</p>
              <div className="stack gap-1"><strong className="t-sm">{t(K.sheet.holders)}</strong><span className="t-sm">{holders.length ? holders.map((r) => r.name).join(', ') : t(K.sheet.nobody)}</span></div>
              <div className="stack gap-1"><strong className="t-sm">{t(K.sheet.missing)}</strong><span className="t-sm">{missing.length ? missing.map((r) => r.name).join(', ') : '—'}</span></div>
            </>
          )}
          {!col.trainable && (col.gap || row) && <p className="t-xs t-muted" data-no-module>{t(K.sheet.noModule)}</p>}
          <Footer>
            {(col.gap || !col.trainable) && <Button variant="secondary" data-recruit onClick={() => s.goto(recruitmentPath)}>{t(K.sheet.recruit)}</Button>}
            {col.kind === 'cert' && col.moduleId && <Button variant="ghost" data-open-lessons onClick={() => s.goto(lessonsPath(col.moduleId as string))}>{t(K.sheet.openLessons)}</Button>}
            {col.kind === 'cert' && col.moduleId && row && !HOLDS.includes(row.cells[col.id].state) && !row.cells[col.id].assigned && <Button data-assign-one onClick={() => onAssign(col.moduleId as string, col.moduleCode as string, [row.userId])}>{t(K.sheet.assignOne)}</Button>}
            {col.kind === 'cert' && col.moduleId && !row && assignable.length > 0 && <Button data-assign-missing onClick={() => onAssign(col.moduleId as string, col.moduleCode as string, assignable.map((r) => r.userId))}>{t(K.sheet.assignMissing, { count: assignable.length })}</Button>}
          </Footer>
          {(col.gap || !col.trainable) && <p className="t-xs t-muted">{t(K.sheet.recruitWhy)}</p>}
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ assign training */

function AssignSheet({ s, d, t, state, onClose }: { s: SkillMatrixState; d: SkillMatrixView; t: T; state: { moduleId: string; moduleCode: string; userIds: string[] } | null; onClose: () => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [due, setDue] = useState(plusDays(14));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssignTrainingResult | null>(null);
  useEffect(() => { if (state) { setChosen(state.userIds); setDue(plusDays(14)); setNote(''); setError(null); setResult(null); } }, [state?.moduleId, state?.userIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const people = state ? d.rows.filter((r) => state.userIds.includes(r.userId) || chosen.includes(r.userId)) : [];
  const nameOf = (id: string) => d.rows.find((r) => r.userId === id)?.name ?? id;
  return (
    <Sheet open={!!state} onClose={onClose} title={t(K.assign.title)} closeLabel={t(K.close)}>
      {state && (
        <div className="stack gap-3" data-form="assign">
          {result ? (
            <div className="stack gap-2" data-assigned-result>
              <p className="t-sm" role="status"><strong>{t(K.assign.done, { count: result.assigned.length })}</strong></p>
              {result.skipped.length > 0 && <div className="stack gap-1"><strong className="t-sm">{t(K.assign.skippedHead)}</strong>{result.skipped.map((x) => <span key={x.userId} className="t-xs">{nameOf(x.userId)}: {t(K.assign.skipped[x.reason])}</span>)}</div>}
              <Footer><Button data-assign-ok onClick={onClose}>{t(K.assign.ok)}</Button></Footer>
            </div>
          ) : (
            <>
              <p className="t-sm">{t(K.assign.body, { module: moduleTitle(t, state.moduleCode) })}</p>
              <div className="stack gap-1" data-people><strong className="t-sm">{t(K.assign.people)}</strong>{people.map((r) => <div key={r.userId} data-person={r.userId}><Checkbox checked={chosen.includes(r.userId)} onChange={(on) => setChosen((c) => (on ? [...c, r.userId] : c.filter((x) => x !== r.userId)))} label={r.name} /></div>)}</div>
              <Field label={t(K.assign.due)} hint={t(K.assign.dueHint, { days: ASSIGN_MAX_DAYS })}>{(p) => <Input id={p.id} type="date" min={today()} value={due} onChange={(e) => setDue(e.target.value)} data-f="due" />}</Field>
              <Field label={t(K.assign.note)} hint={t(K.assign.noteHint, { max: NOTE_MAX })}>{(p) => <TextArea id={p.id} rows={3} value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
              {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
              <Footer>
                <Button variant="ghost" onClick={onClose}>{t(K.assign.cancel)}</Button>
                <Button disabled={chosen.length === 0 || !due || s.busy} data-confirm-assign onClick={async () => { const r = await s.assign({ userIds: chosen, moduleId: state.moduleId, dueDate: due, note }); if (!r.ok) setError(r.code ?? 'generic'); else { setError(null); setResult(r.value ?? null); } }}>{t(K.assign.confirm, { count: chosen.length })}</Button>
              </Footer>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ demand against supply */

function Demand({ s, d, t }: { s: SkillMatrixState; d: SkillMatrixView; t: T }) {
  const shown = d.demand.filter((x) => x.deals > 0 || x.skill !== null || x.signal !== 'no_demand');
  return (
    <section className="stack gap-3" data-demand>
      <div className="stack gap-1"><h2 className="t-lg">{t(K.demand.heading)}</h2><p className="t-sm t-muted">{t(K.demand.body)}</p></div>
      <div className="grid-auto" style={{ '--min': '320px', alignItems: 'start' } as React.CSSProperties}>
        {shown.map((x) => (
          <Card key={x.driveType}>
            <div className="stack gap-2" data-drive={x.driveType} data-signal={x.signal}>
              <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
                <strong className="t-md">{t(`driveType.${x.driveType}`, { defaultValue: x.driveType })}</strong>
                <Badge tone={SIGNAL_TONE[x.signal]}>{t(K.demand.signal[x.signal])}</Badge>
              </div>
              <div className="row gap-4 wrap t-sm">
                <span><span className="t-xs t-muted">{t(K.demand.deals)}</span><br /><strong style={{ fontVariantNumeric: 'tabular-nums' }}>{x.deals}</strong></span>
                <span><span className="t-xs t-muted">{t(K.demand.value)}</span><br /><strong style={{ fontVariantNumeric: 'tabular-nums' }}>{x.deals ? formatINR(x.value) : '—'}</strong></span>
                <span><span className="t-xs t-muted">{t(K.demand.supply)}</span><br /><strong style={{ fontVariantNumeric: 'tabular-nums' }}>{x.skill ? x.supply : '—'}</strong></span>
                <span><span className="t-xs t-muted">{t(K.demand.ratio)}</span><br /><strong style={{ fontVariantNumeric: 'tabular-nums' }}>{x.ratio === null ? '—' : x.ratio}</strong></span>
              </div>
              <p className="t-sm">{t(K.demand.signalBody[x.signal], { skill: x.skill ? t(`partnerDir.skill.${x.skill}`, { defaultValue: x.skill }) : '', stretched: STRETCHED_AT })}</p>
              {x.small && <p className="t-xs t-muted" data-small-demand>{t(K.demand.smallNote, { count: x.deals })}</p>}
              {(x.signal === 'no_supply' || x.signal === 'stretched' || x.signal === 'untracked') && (
                <div className="stack gap-1" data-lever>
                  <p className="t-xs">{t(K.demand.recruitLever)}</p>
                  <div className="row gap-2 wrap">
                    <Button size="sm" variant="secondary" data-recruit onClick={() => s.goto(recruitmentPath)}>{t(K.demand.recruit)}</Button>
                    <Button size="sm" variant="ghost" onClick={() => s.setView('matrix')}>{t(K.view.matrix)}</Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      <p className="t-xs t-muted" data-placeholder>{t(K.demand.placeholder)}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ the trend */

function Trend({ d, t }: { d: SkillMatrixView; t: T }) {
  const pts = d.trend.points;
  const known = pts.filter((p) => p.coverage !== null);
  const W = 320;
  const H = 120;
  const x = (i: number) => 16 + (i * (W - 32)) / Math.max(1, pts.length - 1);
  const y = (v: number) => H - 16 - (v / 100) * (H - 32);
  const path = pts.map((p, i) => (p.coverage === null ? null : `${i === 0 || pts[i - 1].coverage === null ? 'M' : 'L'}${x(i)},${y(p.coverage)}`)).filter(Boolean).join(' ');
  const dir = d.trend.direction;
  return (
    <section className="stack gap-3" data-trend>
      <div className="stack gap-1"><h2 className="t-lg">{t(K.trend.heading)}</h2><p className="t-sm t-muted">{t(K.trend.body)}</p></div>
      <Card>
        <div className="stack gap-2">
          <span className="row gap-2" style={{ alignItems: 'center' }} data-direction={dir}>
            {dir === 'up' ? <TrendUp size={20} aria-hidden="true" style={{ color: 'var(--color-success)' }} /> : dir === 'down' ? <TrendDown size={20} aria-hidden="true" style={{ color: 'var(--color-warning)' }} /> : <Minus size={20} aria-hidden="true" />}
            <strong className="t-md">{d.trend.delta === null ? t(K.trend.flat) : t(K.trend[dir], { points: Math.abs(d.trend.delta) })}</strong>
          </span>
          {known.length < 2 ? <p className="t-sm t-muted">{t(K.trend.note)}</p> : (
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(K.trend.chart)} style={{ width: '100%', height: 'auto', maxHeight: 220 }} data-chart>
              {[0, 50, 100].map((g) => <line key={g} x1={16} x2={W - 16} y1={y(g)} y2={y(g)} stroke="var(--color-border)" strokeWidth={1} />)}
              <path d={path} fill="none" stroke="var(--color-accent-primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => p.coverage === null ? null : <circle key={p.month} cx={x(i)} cy={y(p.coverage)} r={3.5} fill="var(--color-accent-primary)" />)}
            </svg>
          )}
          <div className="row between t-xs t-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{pts.map((p) => <span key={p.month} data-point={p.month}>{p.month.slice(5)}<br />{p.coverage === null ? '—' : `${p.coverage}%`}</span>)}</div>
          {d.small && <p className="t-xs t-muted">{t(K.small.workforce, { count: d.kpis.technicians, min: SMALL_WORKFORCE })}</p>}
          <p className="t-xs t-muted" data-trend-note>{t(K.trend.note)}</p>
        </div>
      </Card>
    </section>
  );
}

