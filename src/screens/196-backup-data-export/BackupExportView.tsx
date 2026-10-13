import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CloudArrowUp, DownloadSimple, ShieldCheck, WarningCircle, X } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, Toggle, formatDate, formatDateTime, relativeTimeParts, useToast } from '@/design-system';
import { ProgressBar } from '@/design-system/misc';
import type { BackupOverview, ExportPreview } from '@/data/repository';
import type { ExportJob } from '@/data/types';
import { ALLOWED, DATASETS, EVERY_OPTIONS, FAILURES, FORMATS, JUSTIFY_MIN, NOTE_MIN, PURPOSES, REASON_MIN, RESTORE_TEST_DAYS, allowedColumns, backupWeakenings, datasetDef, excessColumns, personalColumns } from '@/features/backup/backup';
import type { BackupConfig, DatasetDef, ExportFormat, ExportPurpose } from '@/features/backup/backup';
import { lettersOf } from '@/features/security/security';
import { BACKUP_EXPORT_KEYS as K } from './backup-export.types';
import { TABS, useBackupExport } from './useBackupExport';
import type { BackupState, BackupTab } from './useBackupExport';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`backups.error.${code}`, { defaultValue: t(K.error.generic) });
const STATE_TONE = { fresh: 'success', aging: 'warning', stale: 'error', none: 'error' } as const;
const ago = (t: T, iso: string): string => { const p = relativeTimeParts(iso); return t(p.key, { count: p.count }); };
const mb = (bytes: number): string => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const dayStr = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-3">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}
function Line({ label, value }: { label: string; value: ReactNode }) {
  return <div className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-muted">{label}</span><span className="t-sm">{value}</span></div>;
}
const Problem = ({ t, code }: { t: T; code: string | null }) => (code ? <p className="t-sm t-error" role="alert" data-problem={code}>{errText(t, code)}</p> : null);

/** Screen 196 — Backup & Data Export. Two parts: whether the business can be restored (and to when), and exports that carry only what their stated purpose needs. */
export function BackupExportScreen() {
  const { t, i18n } = useTranslation();
  const s = useBackupExport();
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !s.overview) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !s.overview) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  const o = s.overview;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as BackupTab)} items={TABS.map((id) => ({ id, label: t(`backups.tab.${id}`) }))} />
        {s.tab === 'backups' && o && <BackupsTab s={s} o={o} t={t} lang={i18n.language} />}
        {s.tab === 'exports' && <ExportsTab s={s} t={t} lang={i18n.language} />}
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ backups */

function BackupsTab({ s, o, t, lang }: { s: BackupState; o: BackupOverview; t: T; lang: string }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [demo, setDemo] = useState(false);
  const rp = o.restorePoint;
  const failedNow = o.latest?.status === 'failed';
  const run = async (): Promise<void> => { const r = await s.runNow(); if (r.ok) toast.push(r.value.latest?.status === 'success' ? t(K.backups.runOk) : t(K.backups.runFailed)); };
  const testDue = Date.parse(o.testDueAt) <= Date.now();
  return (
    <div className="stack gap-5">
      {failedNow && o.latest && (
        <Card>
          <div className="stack gap-1" data-failed role="alert" style={{ borderLeft: '3px solid var(--color-error)', paddingLeft: 12 }}>
            <span className="t-sm t-semibold" style={{ color: 'var(--color-error)' }}><WarningCircle size={16} aria-hidden="true" /> {t(K.backups.failedTitle, { code: o.latest.code })}</span>
            <span className="t-xs">{t(`backups.failure.${o.latest.failure ?? 'storage_unreachable'}`)}</span>
            <span className="t-xs t-muted">{o.retries ? t(K.backups.retries, { used: o.retries.used, max: o.retries.max, mins: 30 }) : ''} {t(K.backups.failedHint)}</span>
          </div>
        </Card>
      )}
      <Section title={t(K.backups.restoreTitle)} hint={t(K.backups.restoreHint)}>
        <Card>
          <div className="stack gap-2" data-restore-point data-state={rp?.state ?? 'none'}>
            {rp ? (
              <>
                <span className="t-lg t-semibold" data-rp-at style={{ fontFamily: 'var(--font-display)' }}>{formatDateTime(rp.at, lang)}</span>
                <span className="row gap-1 wrap"><Badge tone={STATE_TONE[rp.state]}>{t(`backups.state.${rp.state}`)}</Badge>{rp.verified && <Badge tone="success">{t(K.backups.verified)}</Badge>}<span className="t-xs t-muted">{t(K.backups.age, { when: ago(t, rp.at) })}</span></span>
                <p className="t-sm" data-loss>{t(K.backups.loss, { when: ago(t, rp.at) })}</p>
                <span className="t-xs t-muted">{t(K.backups.holds, { leads: rp.counts.leads ?? 0, deals: rp.counts.deals ?? 0, payments: rp.counts.payments ?? 0, invoices: rp.counts.invoices ?? 0, size: mb(rp.sizeBytes) })}</span>
              </>
            ) : <p className="t-sm" data-no-restore style={{ color: 'var(--color-error)' }}>{t(K.backups.none)}</p>}
            <div className="row gap-2 wrap"><Button size="sm" data-act="run-now" icon={<CloudArrowUp size={16} />} loading={s.busy} onClick={() => void run()}>{t(K.backups.runNow)}</Button></div>
          </div>
        </Card>
      </Section>

      <Section title={t(K.backups.scheduleTitle)} hint={t(K.backups.scheduleHint)}>
        <Card>
          <div className="stack gap-2" data-schedule>
            <Line label={t(K.backups.status)} value={<Badge tone={o.config.enabled ? 'success' : 'error'}>{o.config.enabled ? t(K.backups.on) : t(K.backups.off)}</Badge>} />
            <Line label={t(K.backups.every)} value={t(K.backups.everyValue, { hours: o.config.everyHours, at: `${String(o.config.atHour).padStart(2, '0')}:00` })} />
            <Line label={t(K.backups.keep)} value={t(K.backups.keepValue, { days: o.config.retainDays, points: o.restorePoints })} />
            <Line label={t(K.backups.verifyEach)} value={o.config.verifyEach ? t(K.yes) : t(K.no)} />
            {o.nextAt && <Line label={t(K.backups.next)} value={formatDateTime(o.nextAt, lang)} />}
            <span className="t-xs t-muted">{t(K.backups.version, { version: o.version })}</span>
            <div><Button size="sm" variant="secondary" data-act="schedule-edit" onClick={() => setEditing(true)}>{t(K.backups.change)}</Button></div>
          </div>
        </Card>
      </Section>

      <Section title={t(K.backups.testTitle)} hint={t(K.backups.testHint, { days: RESTORE_TEST_DAYS })}>
        <Card>
          <div className="stack gap-2" data-restore-test>
            {o.lastTest ? (
              <>
                <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone={o.lastTest.outcome === 'ok' ? 'success' : 'warning'}>{t(`backups.outcome.${o.lastTest.outcome}`)}</Badge><span className="t-xs t-muted">{formatDate(o.lastTest.at, lang)} · {o.lastTest.byName}</span></span>
                <p className="t-xs">{o.lastTest.note}</p>
              </>
            ) : <p className="t-sm">{t(K.backups.noTest)}</p>}
            <span className="t-xs" style={{ color: testDue ? 'var(--color-warning)' : undefined }}>{t(K.backups.testDue, { date: formatDate(o.testDueAt, lang) })}</span>
            <div><Button size="sm" variant="secondary" data-act="test-open" onClick={() => setTesting(true)} disabled={!rp}>{t(K.backups.recordTest)}</Button></div>
          </div>
        </Card>
      </Section>

      <Section title={t(K.backups.historyTitle)} hint={t(K.backups.historyHint, { runs: o.counts.runs30, failed: o.counts.failed30 })}>
        {o.runs.length === 0 ? <EmptyState title={t(K.backups.historyEmpty)} body={t(K.backups.historyEmptyHint)} /> : (
          <div className="grid-auto" data-runs>
            {o.runs.slice(0, 20).map((r) => (
              <Card key={r.id}>
                <div className="stack gap-1" data-run={r.id} data-status={r.status}>
                  <span className="row between wrap" style={{ gap: 8, alignItems: 'center' }}><span className="t-sm t-semibold num">{r.code}</span><span className="row gap-1 wrap"><Badge tone="neutral">{t(`backups.trigger.${r.trigger}`)}</Badge><Badge tone={r.status === 'success' ? 'success' : 'error'}>{t(`backups.runStatus.${r.status}`)}</Badge></span></span>
                  <span className="t-xs t-muted">{formatDateTime(r.finishedAt, lang)}</span>
                  {r.status === 'success' ? <span className="t-xs">{mb(r.sizeBytes ?? 0)}{r.verified ? ` · ${t(K.backups.verified)}` : ''}</span> : <span className="t-xs" style={{ color: 'var(--color-error)' }}>{t(`backups.failure.${r.failure ?? 'storage_unreachable'}`)}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title={t(K.demo.title)} hint={t(K.demo.hint)}>
        {!demo ? <div><Button size="sm" variant="ghost" data-act="demo-open" onClick={() => setDemo(true)}>{t(K.demo.open)}</Button></div> : <DemoTools s={s} o={o} t={t} />}
      </Section>

      <ConfigSheet open={editing} onClose={() => setEditing(false)} s={s} o={o} t={t} />
      <TestSheet open={testing} onClose={() => setTesting(false)} s={s} o={o} t={t} lang={lang} />
    </div>
  );
}

function DemoTools({ s, o, t }: { s: BackupState; o: BackupOverview; t: T }) {
  const [reason, setReason] = useState<(typeof FAILURES)[number]>('storage_unreachable');
  const failing = o.service.state === 'failing';
  return (
    <Card>
      <div className="stack gap-3" data-demo-tools>
        <Line label={t(K.demo.service)} value={<Badge tone={failing ? 'error' : 'success'}>{failing ? t(K.demo.failing) : t(K.demo.working)}</Badge>} />
        <Field label={t(K.demo.reason)}>{(p) => <Select id={p.id} value={reason} data-f="demo-reason" onChange={(e) => setReason(e.target.value as typeof reason)}>{FAILURES.map((f) => <option key={f} value={f}>{t(`backups.failure.${f}`)}</option>)}</Select>}</Field>
        <div className="row gap-2 wrap">
          <Button size="sm" variant="secondary" data-act="demo-fail" loading={s.busy} onClick={() => void s.setService('failing', reason)}>{t(K.demo.fail)}</Button>
          <Button size="sm" variant="secondary" data-act="demo-ok" loading={s.busy} onClick={() => void s.setService('working', null)}>{t(K.demo.fix)}</Button>
        </div>
      </div>
    </Card>
  );
}

function ConfigSheet({ open, onClose, s, o, t }: { open: boolean; onClose: () => void; s: BackupState; o: BackupOverview; t: T }) {
  const toast = useToast();
  const [cfg, setCfg] = useState<BackupConfig>(o.config);
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { if (open) { setCfg(o.config); setReason(''); setAck(false); setProblem(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const weak = backupWeakenings(o.config, cfg);
  const changed = JSON.stringify(cfg) !== JSON.stringify(o.config);
  const ready = changed && lettersOf(reason) >= REASON_MIN && (weak.length === 0 || ack);
  const save = async (): Promise<void> => { setProblem(null); const r = await s.saveConfig({ config: cfg, reason, confirmWeaken: ack }); if (r.ok) { toast.push(t(K.backups.saved)); onClose(); } else setProblem(r.problem); };
  return (
    <Sheet open={open} onClose={onClose} title={t(K.backups.change)} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-config-sheet>
        <Toggle checked={cfg.enabled} onChange={(v) => { setCfg({ ...cfg, enabled: v }); setAck(false); }} label={t(K.backups.on)} description={t(K.backups.toggleHint)} />
        <Field label={t(K.backups.every)}>{(p) => <Select id={p.id} value={cfg.everyHours} data-f="cfg-every" onChange={(e) => { setCfg({ ...cfg, everyHours: Number(e.target.value) as BackupConfig['everyHours'] }); setAck(false); }}>{EVERY_OPTIONS.map((h) => <option key={h} value={h}>{t(K.backups.everyOption, { hours: h })}</option>)}</Select>}</Field>
        <Field label={t(K.backups.atHour)}>{(p) => <Input id={p.id} type="number" min={0} max={23} value={String(cfg.atHour)} data-f="cfg-hour" onChange={(e) => setCfg({ ...cfg, atHour: Number(e.target.value) })} />}</Field>
        <Field label={t(K.backups.keep)} hint={t(K.backups.days)}>{(p) => <Input id={p.id} type="number" min={7} max={365} value={String(cfg.retainDays)} data-f="cfg-keep" onChange={(e) => { setCfg({ ...cfg, retainDays: Number(e.target.value) }); setAck(false); }} />}</Field>
        <Toggle checked={cfg.verifyEach} onChange={(v) => { setCfg({ ...cfg, verifyEach: v }); setAck(false); }} label={t(K.backups.verifyEach)} description={t(K.backups.verifyHint)} />
        {weak.length > 0 && (
          <div className="stack gap-1" data-weakenings>
            <span className="t-sm t-semibold" style={{ color: 'var(--color-warning)' }}>{t(K.backups.weaker)}</span>
            {weak.map((w) => <span key={w} className="t-xs" data-weak={w}>{t(`backups.weak.${w}`)}</span>)}
          </div>
        )}
        <Field label={t(K.backups.reason)} hint={`${lettersOf(reason)}/${REASON_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="cfg-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
        {weak.length > 0 && <label className="row gap-2" style={{ alignItems: 'flex-start', minHeight: 44 }}><input type="checkbox" checked={ack} data-f="cfg-ack" onChange={(e) => setAck(e.target.checked)} /><span className="t-sm">{t(K.backups.confirm)}</span></label>}
        <Problem t={t} code={problem} />
        <div className="row gap-2"><Button variant="ghost" onClick={onClose}>{t(K.cancel)}</Button><Button className="grow" data-act="cfg-save" disabled={!ready} loading={s.busy} onClick={() => void save()}>{t(K.backups.save)}</Button></div>
      </div>
    </Sheet>
  );
}

function TestSheet({ open, onClose, s, o, t, lang }: { open: boolean; onClose: () => void; s: BackupState; o: BackupOverview; t: T; lang: string }) {
  const toast = useToast();
  const ok = o.runs.filter((r) => r.status === 'success');
  const [runId, setRunId] = useState('');
  const [outcome, setOutcome] = useState<'ok' | 'problems'>('ok');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { if (open) { setRunId(ok[0]?.id ?? ''); setOutcome('ok'); setNote(''); setProblem(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async (): Promise<void> => { setProblem(null); const r = await s.recordTest(runId, outcome, note); if (r.ok) { toast.push(t(K.backups.testSaved)); onClose(); } else setProblem(r.problem); };
  return (
    <Sheet open={open} onClose={onClose} title={t(K.backups.recordTest)} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-test-sheet>
        <p className="t-xs">{t(K.backups.testBody)}</p>
        <Field label={t(K.backups.testRun)}>{(p) => <Select id={p.id} value={runId} data-f="test-run" onChange={(e) => setRunId(e.target.value)}>{ok.slice(0, 15).map((r) => <option key={r.id} value={r.id}>{r.code} · {formatDateTime(r.finishedAt, lang)}</option>)}</Select>}</Field>
        <div className="row gap-2" role="group">{(['ok', 'problems'] as const).map((v) => <Chip key={v} pressed={outcome === v} onClick={() => setOutcome(v)}>{t(`backups.outcome.${v}`)}</Chip>)}</div>
        <Field label={t(K.backups.testNote)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={3} value={note} data-f="test-note" onChange={(e) => setNote(e.target.value)} />}</Field>
        <Problem t={t} code={problem} />
        <div className="row gap-2"><Button variant="ghost" onClick={onClose}>{t(K.cancel)}</Button><Button className="grow" data-act="test-save" disabled={!runId || lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={() => void save()}>{t(K.backups.testSave)}</Button></div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ exports */

function download(file: { fileName: string; mime: string; content: string }): void {
  const url = URL.createObjectURL(new Blob([file.content], { type: file.mime }));
  const a = document.createElement('a');
  a.href = url; a.download = file.fileName; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const DRAFT = 'aiec.exportDraft';

function ExportsTab({ s, t, lang }: { s: BackupState; t: T; lang: string }) {
  const toast = useToast();
  const [datasetId, setDatasetId] = useState<string>('payments');
  const [purpose, setPurpose] = useState<ExportPurpose>('own_analysis');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [columns, setColumns] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [purposeNote, setPurposeNote] = useState('');
  const [justification, setJustification] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pv, setPv] = useState<ExportPreview | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const ds = datasetDef(datasetId) as DatasetDef;
  // Choosing a dataset or a purpose starts from what that purpose can reasonably need, never from everything.
  const resetColumns = (d: DatasetDef, p: ExportPurpose): void => { setColumns(allowedColumns(p, d)); setConfirmed(false); };
  useEffect(() => {
    try { const raw = localStorage.getItem(DRAFT); if (raw) { const d = JSON.parse(raw) as { datasetId: string; purpose: ExportPurpose; purposeNote: string }; if (datasetDef(d.datasetId)) { setDatasetId(d.datasetId); setPurpose(d.purpose); setPurposeNote(d.purposeNote ?? ''); resetColumns(datasetDef(d.datasetId) as DatasetDef, d.purpose); return; } } } catch { /* no draft */ }
    resetColumns(ds, purpose);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify({ datasetId, purpose, purposeNote })); } catch { /* storage may be unavailable */ } }, [datasetId, purpose, purposeNote]);
  const excess = useMemo(() => excessColumns(purpose, ds, columns), [purpose, ds, columns]);
  const input = useMemo(() => ({ datasetId, purpose, purposeNote, format, columns, from: from || null, to: to || null, justification, confirmed }), [datasetId, purpose, purposeNote, format, columns, from, to, justification, confirmed]);
  useEffect(() => {
    let live = true;
    const id = window.setTimeout(() => { void s.previewExport(input).then((r) => { if (live && r.ok) setPv(r.value); }); }, 250);
    return () => { live = false; window.clearTimeout(id); };
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = Object.fromEntries(s.counts.map((c) => [c.id, c.total]));
  const blocking = (pv?.problems ?? []).filter((p) => p !== 'justification_short' && p !== 'confirm_required');
  const ready = !!pv && pv.problems.length === 0 && columns.length > 0;
  const start = async (): Promise<void> => {
    setProblem(null);
    const r = await s.createExport(input);
    if (r.ok) { toast.push(r.value.status === 'ready' ? t(K.exports.readyNow) : t(K.exports.started)); setConfirmed(false); setJustification(''); setPurposeNote(''); } else setProblem(r.problem);
  };
  const toggle = (key: string): void => { setColumns((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key])); setConfirmed(false); };
  const personal = personalColumns(ds, columns);
  return (
    <div className="stack gap-5">
      <Section title={t(K.exports.newTitle)} hint={t(K.exports.newHint)}>
        <Card>
          <div className="stack gap-4" data-export-form>
            <Field label={t(K.exports.dataset)}>{(p) => <Select id={p.id} value={datasetId} data-f="ex-dataset" onChange={(e) => { const d = datasetDef(e.target.value) as DatasetDef; setDatasetId(d.id); resetColumns(d, purpose); setFrom(''); setTo(''); }}>{DATASETS.map((d) => <option key={d.id} value={d.id}>{t(`backups.dataset.${d.id}`)} ({counts[d.id] ?? 0})</option>)}</Select>}</Field>
            <Field label={t(K.exports.purpose)} hint={t(`backups.purposeHint.${purpose}`)}>{(p) => <Select id={p.id} value={purpose} data-f="ex-purpose" onChange={(e) => { const v = e.target.value as ExportPurpose; setPurpose(v); resetColumns(ds, v); }}>{PURPOSES.map((v) => <option key={v} value={v}>{t(`backups.purpose.${v}`)}</option>)}</Select>}</Field>
            <Field label={t(K.exports.purposeNote)} hint={t(K.exports.purposeNoteHint)}>{(p) => <TextArea id={p.id} rows={2} value={purposeNote} data-f="ex-note" onChange={(e) => setPurposeNote(e.target.value)} />}</Field>
            {ds.dateField && (
              <div className="grid-auto" data-period style={{ ['--min' as string]: '200px' }}>
                <Field label={t(K.exports.from)}>{(p) => <Input id={p.id} type="date" value={from} max={to || undefined} data-f="ex-from" onChange={(e) => setFrom(e.target.value)} />}</Field>
                <Field label={t(K.exports.to)}>{(p) => <Input id={p.id} type="date" value={to} min={from || undefined} data-f="ex-to" onChange={(e) => setTo(e.target.value)} />}</Field>
                <div className="row gap-2 wrap" style={{ gridColumn: '1 / -1' }}>
                  <Chip pressed={false} onClick={() => { const n = new Date(); const q = Math.floor(n.getMonth() / 3) * 3; setFrom(dayStr(new Date(n.getFullYear(), q, 1))); setTo(dayStr(n)); }}>{t(K.exports.thisQuarter)}</Chip>
                  <Chip pressed={false} onClick={() => { const n = new Date(); setFrom(dayStr(new Date(n.getFullYear(), n.getMonth() - 1, 1))); setTo(dayStr(new Date(n.getFullYear(), n.getMonth(), 0))); }}>{t(K.exports.lastMonth)}</Chip>
                  <Chip pressed={!from && !to} onClick={() => { setFrom(''); setTo(''); }}>{t(K.exports.allTime)}</Chip>
                </div>
              </div>
            )}
            <div className="stack gap-2" role="group" aria-label={t(K.exports.format)}>
              <span className="t-sm t-semibold">{t(K.exports.format)}</span>
              <div className="row gap-2 wrap">{FORMATS.map((f) => <Chip key={f} pressed={format === f} onClick={() => setFormat(f)}>{t(`backups.format.${f}`)}</Chip>)}</div>
              <span className="t-xs t-muted">{t(`backups.formatHint.${format}`)}</span>
            </div>
            <div className="stack gap-2" data-columns>
              <span className="t-sm t-semibold">{t(K.exports.columns)}</span>
              <p className="t-xs t-muted">{t(K.exports.columnsHint, { purpose: t(`backups.purpose.${purpose}`) })}</p>
              <div className="grid-auto" style={{ ['--min' as string]: '200px' }}>
                {ds.columns.map((col) => {
                  const need = col.personal !== 'none' && !ALLOWED[purpose].includes(col.personal);
                  return (
                    <label key={col.key} className="row gap-2" style={{ alignItems: 'flex-start', minHeight: 44 }} data-col={col.key} data-personal={col.personal}>
                      <input type="checkbox" checked={columns.includes(col.key)} onChange={() => toggle(col.key)} />
                      <span className="stack gap-0"><span className="t-sm">{t(`backups.col.${col.key}`)}</span>{col.personal !== 'none' && <span className="t-xs" style={{ color: need ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>{t(`backups.personal.${col.personal}`)}{need ? ` · ${t(K.exports.notNeeded)}` : ''}</span>}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            {excess.length > 0 && (
              <div className="stack gap-2" data-excess>
                <p className="t-sm" style={{ color: 'var(--color-warning)' }}><ShieldCheck size={14} aria-hidden="true" /> {t(K.exports.excessTitle, { count: excess.length })}</p>
                <p className="t-xs">{t(K.exports.excessBody)}</p>
                <Field label={t(K.exports.justification)} hint={`${lettersOf(justification)}/${JUSTIFY_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={justification} data-f="ex-justify" onChange={(e) => setJustification(e.target.value)} />}</Field>
                <label className="row gap-2" style={{ alignItems: 'flex-start', minHeight: 44 }}><input type="checkbox" checked={confirmed} data-f="ex-confirm" onChange={(e) => setConfirmed(e.target.checked)} /><span className="t-sm">{t(K.exports.confirm)}</span></label>
              </div>
            )}
            <div className="stack gap-1" data-preview>
              {pv && <p className="t-sm" data-rows={pv.rowCount}>{t(K.exports.preview, { rows: pv.rowCount, cols: columns.length, personal: personal.length })}</p>}
              {pv?.background && <p className="t-xs" data-background>{t(K.exports.background)}</p>}
              {blocking.map((p) => <p key={p} className="t-sm t-error" role="alert" data-problem={p}>{errText(t, p)}</p>)}
              <Problem t={t} code={problem} />
            </div>
            <Button data-act="export-start" disabled={!ready} loading={s.busy} onClick={() => void start()}>{t(K.exports.start)}</Button>
          </div>
        </Card>
      </Section>

      <Section title={t(K.exports.jobsTitle)} hint={t(K.exports.jobsHint)}>
        {!s.jobs ? <LoadingState label={t(K.loading)} variant="list" rows={2} /> : s.jobs.rows.length === 0 ? <EmptyState title={t(K.exports.empty)} body={t(K.exports.emptyHint)} /> : (
          <div className="stack gap-3" data-jobs>
            {s.jobs.rows.map((j) => <JobCard key={j.id} j={j} s={s} t={t} lang={lang} />)}
            {s.jobs.rows.length < s.jobs.total && <div><Button variant="secondary" data-act="jobs-more" onClick={s.moreJobs}>{t(K.exports.more)}</Button></div>}
          </div>
        )}
      </Section>
    </div>
  );
}

function JobCard({ j, s, t, lang }: { j: ExportJob; s: BackupState; t: T; lang: string }) {
  const toast = useToast();
  const [problem, setProblem] = useState<string | null>(null);
  const live = j.status === 'queued' || j.status === 'running';
  const pct = j.rowCount === 0 ? 100 : Math.round((j.rowsDone / j.rowCount) * 100);
  const get = async (): Promise<void> => { setProblem(null); const r = await s.download(j.id); if (r.ok) { download(r.value); toast.push(t(K.exports.downloaded)); } else setProblem(r.problem); };
  return (
    <Card>
      <div className="stack gap-2" data-job={j.id} data-status={j.status}>
        <div className="row between wrap" style={{ gap: 8, alignItems: 'center' }}><span className="t-sm t-semibold">{t(`backups.dataset.${j.datasetId}`)}</span><span className="row gap-1 wrap"><Badge tone="neutral">{j.format.toUpperCase()}</Badge><Badge tone={j.status === 'ready' ? 'success' : live ? 'accent' : j.status === 'failed' ? 'error' : 'neutral'}>{t(`backups.jobStatus.${j.status}`)}</Badge></span></div>
        <span className="t-xs t-muted">{j.code} · {formatDateTime(j.requestedAt, lang)} · {j.byName} · {t(`backups.purpose.${j.purpose}`)}</span>
        <span className="t-xs">{j.purposeNote}</span>
        <span className="t-xs t-muted">{j.from || j.to ? `${j.from ? formatDate(j.from, lang) : '…'} – ${j.to ? formatDate(j.to, lang) : '…'}` : t(K.exports.allTime)} · {t(K.exports.rows, { count: j.rowCount })} · {t(K.exports.colsCount, { count: j.columns.length })}</span>
        {j.personalColumns.length > 0 ? <span className="t-xs" data-personal-cols style={{ color: 'var(--color-warning)' }}>{t(K.exports.personalIn, { cols: j.personalColumns.join(', ') })}{j.justification ? ` — ${j.justification}` : ''}</span> : <span className="t-xs t-muted">{t(K.exports.noPersonal)}</span>}
        {live && <div className="stack gap-1" data-progress={pct}><ProgressBar value={pct / 100} label={t(K.exports.progress)} /><span className="t-xs t-muted">{t(K.exports.progressLine, { done: j.rowsDone, total: j.rowCount })}</span></div>}
        {j.status === 'ready' && <span className="t-xs t-muted">{mb(j.sizeBytes ?? 0)} · {t(K.exports.expires, { date: j.expiresAt ? formatDate(j.expiresAt, lang) : '' })}{j.downloads > 0 ? ` · ${t(K.exports.times, { count: j.downloads })}` : ''}</span>}
        {j.status === 'expired' && <span className="t-xs t-muted">{t(K.exports.expiredLine)}</span>}
        <Problem t={t} code={problem} />
        <div className="row gap-2 wrap">
          {j.status === 'ready' && <Button size="sm" data-act="job-download" icon={<DownloadSimple size={14} />} loading={s.busy} onClick={() => void get()}>{t(K.exports.download)}</Button>}
          {live && <Button size="sm" variant="ghost" data-act="job-cancel" icon={<X size={14} />} onClick={() => void s.cancel(j.id)}>{t(K.exports.cancel)}</Button>}
        </div>
      </div>
    </Card>
  );
}
