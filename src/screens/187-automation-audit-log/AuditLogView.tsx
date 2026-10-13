import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowsClockwise, Copy, DownloadSimple, ListChecks, ShieldCheck, ShieldWarning } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, formatDate, formatDateTime, useToast } from '@/design-system';
import type { AuditFilter, AuditRowView, AuditSearchView } from '@/data/repository';
import { categoryName } from '@/features/automation/registry';
import { csvCell } from '@/features/payout/history';
import { AUDIT_LOG_KEYS as K, PAGE } from './audit-log.types';
import { useAuditLog } from './useAuditLog';
import type { AuditLogState } from './useAuditLog';

type T = ReturnType<typeof useTranslation>['t'];
const catName = (t: T, id: string): string => (id === 'overrides' ? t(K.category.overrides) : t(`automationRules.category.${id}.name`, { defaultValue: categoryName(id) }));
const short = (h: string): string => (h ? `${h.slice(0, 12)}…` : '—');
const CSV_COLUMNS = ['audit_entry_id', 'sequence', 'recorded_at', 'automation_source', 'automation_type', 'triggering_condition', 'action_taken', 'affected_record_id', 'affected_record_type', 'record_label', 'fingerprint', 'previous_fingerprint'];
const download = (name: string, type: string, body: string) => {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};
const csvOf = (rows: AuditRowView[]): string => [CSV_COLUMNS.join(','), ...rows.map((r) => [r.code, r.seq, r.at, r.sourceKey, r.category, r.triggeringCondition, r.actionTaken, r.affectedRecordId, r.affectedRecordType, r.subjectLabel ?? '', r.hash, r.prevHash].map(csvCell).join(','))].join('\n');

/** Screen 187 — Audit Log of Automated Actions. List layout: one row anatomy, a sticky search and filter bar, a log kept searchable at volume (a page at a time, filters in the address), a detail sheet that says exactly which rule fired and on what, and an integrity banner for the chained, append-only record. */
export function AuditLogScreen() {
  const { t, i18n } = useTranslation();
  const s = useAuditLog();
  const v = s.view;
  const [exportOpen, setExportOpen] = useState(false);
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<span className="row gap-2"><Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button><Button size="sm" variant="secondary" icon={<DownloadSimple size={16} />} data-act="export" onClick={() => setExportOpen(true)}>{t(K.export.button)}</Button></span>} />;
  if (s.load === 'loading' && !v) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={6} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-3">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <Integrity v={v} t={t} />
        <Volume v={v} t={t} />
        <Filters s={s} v={v} t={t} />
        <List s={s} v={v} t={t} lang={i18n.language} />
        <Exports v={v} t={t} lang={i18n.language} />
      </div>
      <Detail s={s} t={t} lang={i18n.language} />
      <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} s={s} v={v} t={t} />
    </Screen>
  );
}

function Integrity({ v, t }: { v: AuditSearchView; t: T }) {
  const ok = v.chain.ok;
  return (
    <Card>
      <div className="stack gap-1" data-integrity={ok ? 'ok' : 'broken'}>
        <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: ok ? 'var(--color-success)' : 'var(--color-error)' }}>{ok ? <ShieldCheck size={18} aria-hidden="true" /> : <ShieldWarning size={18} aria-hidden="true" />}{ok ? t(K.integrity.ok) : t(K.integrity.broken)}</span>
        <p className="t-xs">{ok ? t(K.integrity.okBody, { count: v.chain.count }) : t(K.integrity.brokenBody, { seq: v.chain.brokenAtSeq })}</p>
        <p className="t-xs t-muted" style={{ fontFamily: 'var(--font-mono)' }}>{t(K.integrity.head, { hash: short(v.chain.headHash) })}</p>
        <p className="t-xs t-muted">{t(K.integrity.note)}</p>
      </div>
    </Card>
  );
}

function Volume({ v, t }: { v: AuditSearchView; t: T }) {
  const max = Math.max(1, ...v.perDay.map((d) => d.count));
  const today = v.perDay[v.perDay.length - 1]?.count ?? 0;
  return (
    <div className="row gap-4 wrap" data-volume style={{ alignItems: 'flex-end' }}>
      <span className="stack gap-0" data-stat="all"><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{v.all}</span><span className="t-xs t-muted">{t(K.stats.all)}</span></span>
      <span className="stack gap-0" data-stat="today"><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{today}</span><span className="t-xs t-muted">{t(K.stats.today)}</span></span>
      <span className="stack gap-1"><span className="row" aria-hidden="true" style={{ alignItems: 'flex-end', gap: 3, height: 28 }}>{v.perDay.map((d) => <span key={d.day} title={`${d.day}: ${d.count}`} style={{ width: 8, height: Math.max(3, Math.round((d.count / max) * 28)), borderRadius: 2, background: d.count === 0 ? 'var(--color-border)' : 'var(--color-accent-secondary)' }} />)}</span><span className="t-xs t-muted">{t(K.volume.title)}</span></span>
    </div>
  );
}

function Filters({ s, v, t }: { s: AuditLogState; v: AuditSearchView; t: T }) {
  const [q, setQ] = useState(s.filter.q ?? '');
  useEffect(() => { setQ(s.filter.q ?? ''); }, [s.filter.q]);
  useEffect(() => { if (q === (s.filter.q ?? '')) return undefined; const id = window.setTimeout(() => s.setFilter('q', q.trim()), 250); return () => window.clearTimeout(id); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="stack gap-2" data-filters>
      <div className="sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBottom: 8 }}>
        <Field label={t(K.filters.search)} hint={t(K.filters.searchHint)}>{(p) => <Input id={p.id} type="search" value={q} data-f="q" onChange={(e) => setQ(e.target.value)} />}</Field>
      </div>
      <div className="row gap-2 wrap" role="group" aria-label={t(K.filters.category)} data-categories>
        <span data-cat="all"><Chip pressed={!s.filter.category} onClick={() => s.setFilter('cat', '')}>{t(K.filters.allCategories)}</Chip></span>
        {v.categories.map((c) => <span key={c.id} data-cat={c.id}><Chip pressed={s.filter.category === c.id} onClick={() => s.setFilter('cat', s.filter.category === c.id ? '' : c.id)}>{catName(t, c.id)} · {c.count}</Chip></span>)}
      </div>
      <div className="grid-2">
        <Field label={t(K.filters.source)}>{(p) => (
          <Select id={p.id} value={s.filter.source ?? ''} data-f="src" onChange={(e) => s.setFilter('src', e.target.value)}>
            <option value="">{t(K.filters.allSources)}</option>
            {v.sources.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.count}</option>)}
          </Select>
        )}</Field>
        <Field label={t(K.filters.record)} hint={t(K.filters.recordHint)}>{(p) => <Input id={p.id} value={s.filter.record ?? ''} data-f="rec" onChange={(e) => s.setFilter('rec', e.target.value)} />}</Field>
        <Field label={t(K.filters.from)}>{(p) => <Input id={p.id} type="date" value={s.filter.from ?? ''} data-f="from" onChange={(e) => s.setFilter('from', e.target.value)} />}</Field>
        <Field label={t(K.filters.to)}>{(p) => <Input id={p.id} type="date" value={s.filter.to ?? ''} data-f="to" onChange={(e) => s.setFilter('to', e.target.value)} />}</Field>
      </div>
      {s.filtered && <div><Button size="sm" variant="ghost" data-act="clear" onClick={s.clear}>{t(K.filters.clear)}</Button></div>}
    </div>
  );
}

function Row({ r, onOpen, t, lang }: { r: AuditRowView; onOpen: () => void; t: T; lang: string }) {
  return (
    <button type="button" onClick={onOpen} data-row={r.id} className="row" style={{ background: 'none', border: 0, borderBottom: '1px solid var(--color-border)', padding: '12px 0', width: '100%', textAlign: 'start', cursor: 'pointer', color: 'inherit', gap: 12, alignItems: 'flex-start' }}>
      <ListChecks size={20} aria-hidden="true" style={{ color: 'var(--color-accent-secondary)', flexShrink: 0, marginTop: 2 }} />
      <span className="stack gap-0 grow" style={{ minWidth: 0 }}>
        <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>{r.sourceName}{r.subjectLabel ? ` · ${r.subjectLabel}` : ''}{r.manual && <Badge tone="warning" data-manual>{t(K.manual.badge)}</Badge>}</span>
        <span className="t-xs" style={{ overflowWrap: 'anywhere' }}>{r.actionTaken}</span>
        <span className="t-xs t-muted">{catName(t, r.category)}</span>
      </span>
      <span className="stack gap-0" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <span className="t-xs">{formatDateTime(r.at, lang)}</span>
        <span className="t-xs t-muted" style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</span>
      </span>
    </button>
  );
}

function List({ s, v, t, lang }: { s: AuditLogState; v: AuditSearchView; t: T; lang: string }) {
  if (v.all === 0) return <EmptyState title={t(K.list.empty)} body={t(K.list.emptyBody)} />;
  if (v.total === 0) return <EmptyState title={t(K.list.noMatch)} body={t(K.list.noMatchBody)} actionLabel={t(K.filters.clear)} onAction={s.clear} />;
  return (
    <section className="stack gap-1" data-list>
      <p className="t-xs t-muted" data-count>{t(K.list.showing, { shown: v.rows.length, total: v.total })}</p>
      <div>{v.rows.map((r) => <Row key={r.id} r={r} t={t} lang={lang} onOpen={() => s.open(r.id)} />)}</div>
      {v.rows.length < v.total && <div><Button variant="secondary" data-act="more" onClick={s.more}>{t(K.list.more)} ({Math.min(PAGE, v.total - v.rows.length)})</Button></div>}
    </section>
  );
}

function Exports({ v, t, lang }: { v: AuditSearchView; t: T; lang: string }) {
  if (v.exports.length === 0) return null;
  return (
    <section className="stack gap-1" data-exports>
      <h2 className="t-sm t-semibold">{t(K.exports.title)}</h2>
      {v.exports.map((e) => <p key={e.id} className="t-xs t-muted">{t(K.exports.line, { date: formatDateTime(e.at, lang), by: e.byName, count: e.count, scope: e.scope, hash: short(e.headHash) })}</p>)}
    </section>
  );
}

function Field2({ label, children }: { label: string; children: ReactNode }) {
  return <div className="stack gap-0"><span className="t-xs t-muted">{label}</span><span className="t-sm" style={{ overflowWrap: 'anywhere' }}>{children}</span></div>;
}

function Detail({ s, t, lang }: { s: AuditLogState; t: T; lang: string }) {
  const nav = useNavigate();
  const toast = useToast();
  const d = s.detail;
  if (!s.entryId || !d) return <Sheet open={false} onClose={() => s.open(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const r = d.row;
  const copy = async () => { try { await navigator.clipboard.writeText(`${r.code} ${r.hash}`); toast.push(t(K.detail.copied)); } catch { toast.push(r.code); } };
  const trail = async () => {
    const x = await s.exportRows({ record: r.affectedRecordId }, 'record_bundle');
    if (x) { download(`aiec-audit-${r.affectedRecordId}.json`, 'application/json', JSON.stringify({ record: r.affectedRecordId, takenAt: x.record.at, headFingerprint: x.chain.headHash, chainIntact: x.chain.ok, entries: x.rows }, null, 2)); toast.push(t(K.export.done, { count: x.rows.length })); }
  };
  return (
    <Sheet open onClose={() => s.open(null)} title={t(K.detail.title)} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-detail={r.id}>
        <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.detail.did)}</span><p className="t-sm" data-did style={{ overflowWrap: 'anywhere' }}>{r.actionTaken}</p></div>
        <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.detail.why)}</span><p className="t-sm" data-why style={{ overflowWrap: 'anywhere' }}>{r.triggeringCondition}</p></div>
        <div className="stack gap-2" data-which>
          <span className="t-sm t-semibold">{t(K.detail.which)}</span>
          <Field2 label={t(K.detail.source)}><span style={{ fontFamily: 'var(--font-mono)' }}>{r.sourceKey}</span> · {catName(t, r.category)}</Field2>
          {r.manual && <div className="stack gap-1" data-manual-note><p className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.manual.by, { name: r.manual.byName })}</p><div><Button size="sm" variant="ghost" onClick={() => nav('/override-console')}>{t(K.manual.open)} <ArrowRight size={14} /></Button></div></div>}
          {r.unitName && <Field2 label={t(K.detail.step)}>{r.unitName}</Field2>}
          {d.rule && <Field2 label={t(K.detail.rule)}>{d.rule.name}</Field2>}
          {d.ruleChangedSince && <p className="t-xs" data-rule-changed style={{ color: 'var(--color-warning)' }}>{t(K.detail.ruleChanged)}</p>}
        </div>
        <div className="stack gap-2" data-acted>
          <span className="t-sm t-semibold">{t(K.detail.acted)}</span>
          <Field2 label={t(K.detail.recordType)}>{r.affectedRecordType}</Field2>
          <Field2 label={t(K.detail.recordId)}>{r.subjectLabel ? `${r.subjectLabel} · ` : ''}<span style={{ fontFamily: 'var(--font-mono)' }}>{r.affectedRecordId}</span></Field2>
          {r.route ? <div><Button size="sm" variant="secondary" onClick={() => nav(r.route!)}>{t(K.detail.openRecord)} <ArrowRight size={14} /></Button></div> : <p className="t-xs t-muted">{t(K.detail.noRoute)}</p>}
        </div>
        <div className="stack gap-2" data-keeping>
          <span className="t-sm t-semibold">{t(K.detail.keeping)}</span>
          <Field2 label={t(K.detail.code)}><span style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</span></Field2>
          <Field2 label={t(K.detail.at)}>{formatDateTime(r.at, lang)}</Field2>
          <Field2 label={t(K.detail.hash)}><span style={{ fontFamily: 'var(--font-mono)' }}>{r.hash}</span></Field2>
          <Field2 label={t(K.detail.prev)}><span style={{ fontFamily: 'var(--font-mono)' }}>{r.prevHash}</span></Field2>
          <p className="t-xs t-muted">{t(K.detail.asRecorded)}</p>
          <div className="row gap-2 wrap"><Button size="sm" variant="secondary" data-act="copy" onClick={() => void copy()}><Copy size={14} /> {t(K.detail.copy)}</Button><Button size="sm" variant="secondary" data-act="trail" loading={s.busy} onClick={() => void trail()}><DownloadSimple size={14} /> {t(K.detail.exportTrail)}</Button></div>
        </div>
        <section className="stack gap-1" data-same>
          <span className="t-sm t-semibold">{t(K.detail.same)}</span>
          {d.related.length === 0 ? <p className="t-xs t-muted">{t(K.detail.sameNone)}</p> : d.related.map((x) => <button key={x.id} type="button" className="t-xs" data-related={x.id} onClick={() => s.open(x.id)} style={{ background: 'none', border: 0, padding: '4px 0', textAlign: 'start', cursor: 'pointer', color: 'inherit' }}>{formatDateTime(x.at, lang)} · {x.sourceName} · {x.actionTaken}</button>)}
        </section>
      </div>
    </Sheet>
  );
}

function ExportSheet({ open, onClose, s, v, t }: { open: boolean; onClose: () => void; s: AuditLogState; v: AuditSearchView; t: T }) {
  const toast = useToast();
  const f = s.filter as AuditFilter;
  const scope = [f.q ? `"${f.q}"` : '', f.category ? catName(t, f.category) : '', f.source ?? '', f.record ?? '', f.from ?? '', f.to ?? ''].filter(Boolean).join(', ') || t(K.export.everything);
  const go = async () => {
    const x = await s.exportRows(f, 'csv');
    if (x) { download(`aiec-audit-log-${x.record.at.slice(0, 10)}.csv`, 'text/csv;charset=utf-8', csvOf(x.rows)); toast.push(t(K.export.done, { count: x.rows.length })); onClose(); }
  };
  return (
    <Sheet open={open} onClose={onClose} title={t(K.export.title)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-export-sheet>
        {v.total === 0 ? <p className="t-sm">{t(K.export.empty)}</p> : <p className="t-sm">{t(K.export.body, { count: v.total, scope })}</p>}
        <Button data-act="download-csv" disabled={v.total === 0} loading={s.busy} onClick={() => void go()}><DownloadSimple size={16} /> {t(K.export.csv)}</Button>
      </div>
    </Sheet>
  );
}
