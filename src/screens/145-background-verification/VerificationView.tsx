import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ClipboardText, Phone, ShieldCheck, ShieldWarning, WarningCircle } from '@phosphor-icons/react';
import { AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Sheet, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { VerificationDetailView, VerificationItemView, VerificationRowView } from '@/data/repository';
import type { VerificationHow } from '@/data/types';
import { CONDITIONAL_MAX_DAYS, FALLBACK_NOTE_MIN, HOWS, NOTE_MIN, REASON_MIN, ROLE_FILTERS, STATUS_FILTERS, VERIFICATION_KEYS as K } from './verification.types';
import { useVerification } from './useVerification';
import type { VerificationState } from './useVerification';

type T = ReturnType<typeof useTranslation>['t'];
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const GATE_TONE: Record<VerificationRowView['gate'], BadgeTone> = { clear: 'success', conditional: 'warning', blocked: 'neutral' };
const STATE_TONE: Record<VerificationItemView['state'], BadgeTone> = { pending: 'neutral', passed: 'success', failed: 'error', conditional: 'warning', lapsed: 'error' };
const roleKey = (r: string) => `application.admin.role.${r}`;
const isoDay = (offset: number) => { const d = new Date(Date.now() + offset * 86_400_000); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

/**
 * Screen 145 — Background & Document Verification. A list of everyone moved forward with how far their checks have got; each opens to the
 * items their role needs, answered by the ID service where it can and by a person where it cannot.
 */
export function VerificationScreen() {
  const { t, i18n } = useTranslation();
  const s = useVerification();
  const lang = i18n.language;
  const b = s.board;
  if (s.status === 'loading' && !b) return <Screen width="default"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  if (s.status === 'error' || !b) return <Screen width="default"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  const visible = s.shown.slice(0, s.limit);

  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle, { count: b.counts.blocked })} />
      <ServiceBanner s={s} t={t} lang={lang} />

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.status)}>
          {STATUS_FILTERS.map((f) => <span key={f} className="shrink-0" data-status-filter={f}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(K.filter[f])} · {f === 'all' ? b.counts.all : f === 'failed' ? b.counts.failed : b.counts[f]}</Chip></span>)}
        </div>
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.role)}>
          {ROLE_FILTERS.map((r) => <span key={r} className="shrink-0" data-role-filter={r}><Chip pressed={s.role === r} onClick={() => s.setRole(r)}>{r === 'all' ? t(K.filter.all) : t(roleKey(r))}</Chip></span>)}
        </div>
      </div>

      {b.rows.length === 0 ? <EmptyState icon={<ShieldCheck size={32} />} title={t(K.list.emptyTitle)} body={t(K.list.emptyBody)} /> : (
        <section className="stack gap-2" aria-labelledby="vf-heading">
          <div className="stack"><h2 id="vf-heading" className="t-md t-semibold">{t(K.list.heading)}</h2><p className="t-xs t-muted">{t(K.list.hint)}</p></div>
          {s.shown.length === 0 ? <EmptyState icon={<ClipboardText size={28} />} title={t(K.list.emptyFilteredTitle)} body={t(K.list.emptyFilteredBody)} actionLabel={t(K.list.clear)} onAction={() => { s.setQuery(''); s.setRole('all'); s.setFilter('all'); }} /> : (
            <Card className="ds-card--flush">{visible.map((r) => <VRow key={r.id} r={r} s={s} t={t} lang={lang} />)}</Card>
          )}
          {s.shown.length > visible.length && <Button variant="secondary" data-more onClick={s.more}>{t(K.list.more, { count: s.shown.length - visible.length })}</Button>}
        </section>
      )}
      <DetailSheet s={s} t={t} lang={lang} />
    </Screen>
  );
}

function ServiceBanner({ s, t, lang }: { s: VerificationState; t: T; lang: string }) {
  const sv = (s.board as NonNullable<typeof s.board>).service;
  const down = sv.status === 'down';
  return (
    <Card className="mb-3">
      <div className="stack gap-2" data-service={sv.status} role="status">
        <div className="row gap-2" style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span className="row gap-2" style={{ alignItems: 'center' }}>{down ? <WarningCircle size={20} aria-hidden="true" color="var(--color-warning)" /> : <CheckCircle size={20} weight="fill" aria-hidden="true" color="var(--color-success)" />}<strong className="t-sm">{t(down ? K.service.down : K.service.up)}</strong></span>
          <Button size="sm" variant="ghost" data-service-toggle disabled={s.busy} onClick={() => void s.setService(down ? 'up' : 'down')}>{t(down ? K.service.setUp : K.service.setDown)}</Button>
        </div>
        {down && <p className="t-sm">{t(K.service.downBody)}</p>}
        <p className="t-xs t-muted">{t(K.service.demo)}{sv.changedAt ? ` · ${formatDateTime(sv.changedAt, lang)}` : ''}</p>
      </div>
    </Card>
  );
}

function VRow({ r, s, t, lang }: { r: VerificationRowView; s: VerificationState; t: T; lang: string }) {
  const icon = r.gate === 'clear' ? <ShieldCheck size={24} weight="fill" aria-hidden="true" color="var(--color-success)" /> : r.failed + r.lapsed > 0 ? <ShieldWarning size={24} aria-hidden="true" color="var(--color-error)" /> : <ShieldCheck size={24} aria-hidden="true" color="var(--color-text-secondary)" />;
  return (
    <button type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} data-verify={r.id} data-gate={r.gate} onClick={() => s.open(r.id)}>
      <span className="shrink-0" style={{ minHeight: 24, display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-medium">{r.name}</span>
        <span className="t-xs t-muted">{t(roleKey(r.role))} · {t(K.row.progress, { passed: r.passed, total: r.total })}</span>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          {r.failed > 0 && <Badge tone="error">{t(K.row.failed, { count: r.failed })}</Badge>}
          {r.lapsed > 0 && <Badge tone="error">{t(K.row.lapsed, { count: r.lapsed })}</Badge>}
          {r.conditionalDue && <Badge tone="warning">{t(K.row.due, { date: formatDate(r.conditionalDue, lang) })}</Badge>}
          <span className="t-xs t-muted">{r.waitingDays === 0 ? t(K.row.today) : t(K.row.waiting, { count: r.waitingDays })}</span>
        </span>
      </span>
      <span className="shrink-0"><Badge tone={GATE_TONE[r.gate]} dot>{t(K.gate[r.gate])}</Badge></span>
    </button>
  );
}

/* ------------------------------------------------------------------ one applicant */

type Form = { kind: 'manual' | 'conditional'; item: VerificationItemView; result?: 'passed' | 'failed' } | null;

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>{children}</div>;
}

function DetailSheet({ s, t, lang }: { s: VerificationState; t: T; lang: string }) {
  const d = s.detail;
  const [form, setForm] = useState<Form>(null);
  useEffect(() => setForm(null), [s.applicationId]);
  const title = form ? (form.kind === 'manual' ? t(K.manual.heading) : t(K.conditional.heading)) : d?.applicant.name ?? t(K.title);
  return (
    <Sheet open={!!s.applicationId} onClose={s.close} title={title} closeLabel={t('action.close')}>
      {s.detailStatus === 'loading' && !d && <LoadingState label={t(K.loading)} variant="list" rows={3} />}
      {s.detailStatus === 'error' && !d && <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reloadDetail()} />}
      {s.detailStatus === 'gone' && <EmptyState icon={<ClipboardText size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} />}
      {d && s.detailStatus !== 'gone' && (form ? <ItemForm s={s} d={d} f={form} t={t} back={() => setForm(null)} /> : <Detail s={s} d={d} t={t} lang={lang} open={setForm} />)}
    </Sheet>
  );
}

const itemTitle = (t: T, it: VerificationItemView) => (it.kind === 'skill' ? t(K.item.skill, { skill: t(`onbTechnician.skill.name.${it.skill}`) }) : t(K.item[it.kind]));

function factLine(t: T, it: VerificationItemView): string {
  const f = it.facts;
  if (it.kind === 'identity' || it.kind === 'registration') return f.type === 'none' ? t(K.fact.identityNone) : t(K.fact.identity, { type: t(K.fact.type[f.type as 'pan' | 'aadhaar' | 'gstin']), number: f.number, doc: t(f.doc ? K.fact.docYes : K.fact.docNo) });
  if (it.kind === 'reference') return Number(f.total) === 0 ? t(K.fact.referenceNone) : t(K.fact.reference, { total: f.total, verified: f.verified, unreachable: f.unreachable, declined: f.declined, unchecked: f.unchecked });
  if (it.kind === 'skill') return t(K.fact.skill);
  return '';
}

function Detail({ s, d, t, lang, open }: { s: VerificationState; d: VerificationDetailView; t: T; lang: string; open: (f: Form) => void }) {
  const g = d.gate;
  const down = d.service.status === 'down';
  const steps = d.items.map((it) => ({ id: it.key, label: itemTitle(t, it), status: it.state === 'passed' ? ('complete' as const) : ('upcoming' as const) }));
  return (
    <div className="stack gap-4" data-detail={d.row.id} data-gate={g.state}>
      <div className="stack gap-1">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone={GATE_TONE[g.state]} dot>{t(K.gate[g.state])}</Badge><span className="t-sm t-muted">{t(K.detail.progress, { passed: g.passed, total: g.total })}</span></div>
        <span className="t-sm">{d.row.code} · {t(roleKey(d.row.role))} · {d.applicant.city}</span>
        <a className="row gap-1 t-sm" style={{ alignItems: 'center', width: 'fit-content' }} href={`tel:${d.applicant.phone}`}><Phone size={16} aria-hidden="true" /> {d.applicant.phone}</a>
      </div>

      <Card>
        <div className="stack gap-2" data-gate-card>
          <strong className="t-sm">{t(K.detail.gateHeading)}</strong>
          <p className="t-sm" data-gate-body>{t(K.gateBody[g.state], { open: g.pending.length + g.failed.length + g.lapsed.length, date: g.conditional[0] ? formatDate(g.conditional[0].dueAt, lang) : '' })}</p>
        </div>
      </Card>

      <div style={{ overflowX: 'auto' }}><AscensionLine orientation="horizontal" steps={steps} /></div>

      {down && <p className="t-sm t-warning" role="status" data-service-down>{t(K.service.downBody)}</p>}

      <section className="stack gap-3" aria-label={t(K.detail.items)}>
        {d.items.map((it) => <ItemCard key={it.key} it={it} d={d} s={s} t={t} lang={lang} open={open} />)}
      </section>

      <Card>
        <div className="stack gap-1" data-interview-context>
          <strong className="t-sm">{t(K.detail.interview)}</strong>
          {d.interview.outcome ? <p className="t-sm">{t(K.detail.interviewOutcome, { outcome: t(`interview.detail.outcome.${d.interview.outcome}`) })}</p> : <p className="t-sm t-muted">{t(K.detail.interviewNone)}</p>}
          {d.interview.concerns.map((c, n) => <p key={n} className="t-sm"><Badge tone="warning">{t(`interview.concern.${c.category}`)}</Badge> {c.text}</p>)}
        </div>
      </Card>

      <div className="row gap-2 wrap">
        <Button variant="secondary" data-open-interview onClick={() => s.goto(`/interviews/${d.row.id}`)}>{t(K.detail.openInterview)}</Button>
        <Button variant="ghost" data-open-application onClick={() => s.goto(`/applications/${d.row.id}`)}>{t(K.detail.openApplication)}</Button>
      </div>

      {d.events.length > 0 && (
        <details data-timeline><summary className="t-sm t-muted" style={{ cursor: 'pointer' }}>{t(K.detail.timeline)}</summary>
          <div className="stack gap-1 mt-2">{[...d.events].reverse().map((e) => <p key={e.id} className="t-xs t-muted">{formatDateTime(e.at, lang)} · {t(K.detail.event[e.kind])}{e.item ? ` · ${e.item.replace('skill:', '')}` : ''}{e.note ? ` · ${e.note}` : ''}</p>)}</div>
        </details>
      )}
    </div>
  );
}

function ItemCard({ it, d, s, t, lang, open }: { it: VerificationItemView; d: VerificationDetailView; s: VerificationState; t: T; lang: string; open: (f: Form) => void }) {
  const rec = it.record;
  const down = d.service.status === 'down';
  const resolved = it.state === 'passed';
  return (
    <Card>
      <div className="stack gap-2" data-item={it.key} data-state={it.state}>
        <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="stack" style={{ minWidth: 0 }}><strong className="t-md">{itemTitle(t, it)}</strong><span className="t-xs t-muted">{t(K.why[it.kind])}</span></span>
          <Badge tone={STATE_TONE[it.state]} dot>{t(K.state[it.state])}</Badge>
        </div>
        <p className="t-sm">{factLine(t, it)}</p>
        {rec && (
          <div className="stack gap-1" data-record>
            <span className="t-xs t-muted">{rec.method === 'third_party' ? t(K.method.third_party) : rec.serviceDown ? t(K.method.fallback) : t(K.method.manual)}{rec.how ? ` · ${t(K.how[rec.how])}` : ''} · {t(K.detail.checkedBy, { name: rec.byName, date: formatDate(rec.at, lang) })}</span>
            {rec.method === 'third_party' && rec.reference && <span className="t-xs t-muted">{t(K.detail.reference, { ref: rec.reference })}{rec.note ? ` · ${t(K.serviceDetail[rec.note as keyof typeof K.serviceDetail] ?? K.detail.none)}` : ''}</span>}
            {rec.method === 'manual' && rec.note && it.state !== 'conditional' && <p className="t-sm">“{rec.note}”</p>}
            {rec.redFlag && <p className="t-sm t-error" data-red-flag><strong>{t(K.detail.redFlag)}</strong> {t(K.detail.redFlagBody)}</p>}
            {rec.conditional && <p className="t-sm" data-conditional>{t(K.detail.conditionalUntil, { date: formatDate(rec.conditional.dueAt, lang) })} · {t(K.detail.conditionalReason)}: “{rec.conditional.reason}”</p>}
            {it.state === 'lapsed' && <p className="t-sm t-error">{t(K.detail.lapsedBody)}</p>}
            {rec.history.length > 0 && <details><summary className="t-xs t-muted" style={{ cursor: 'pointer' }}>{t(K.detail.history)} · {rec.history.length}</summary><div className="stack gap-1 mt-1">{rec.history.map((h, n) => <span key={n} className="t-xs t-muted">{formatDate(h.at, lang)} · {t(K.state[h.status])} · {h.byName}{h.note ? ` · “${h.note}”` : ''}</span>)}</div></details>}
          </div>
        )}
        {!resolved && (
          <div className="row gap-2 wrap">
            {it.thirdParty && !rec?.redFlag && it.state !== 'conditional' && <Button size="sm" data-check disabled={s.busy || down} onClick={async () => { await s.runCheck(it.key); }}>{t(rec ? K.action.recheck : K.action.check)}</Button>}
            <Button size="sm" variant="secondary" data-pass onClick={() => open({ kind: 'manual', item: it, result: 'passed' })}>{t(K.action.pass)}</Button>
            <Button size="sm" variant="secondary" data-fail onClick={() => open({ kind: 'manual', item: it, result: 'failed' })}>{t(K.action.fail)}</Button>
            {it.canBeConditional && it.state !== 'failed' && it.state !== 'conditional' && <Button size="sm" variant="ghost" data-conditional-open onClick={() => open({ kind: 'conditional', item: it })}>{t(K.action.conditional)}</Button>}
          </div>
        )}
        {!it.canBeConditional && !resolved && it.kind !== 'reference' && <span className="t-xs t-muted">{t(K.conditional.never)}</span>}
      </div>
    </Card>
  );
}

function ItemForm({ s, d, f, t, back }: { s: VerificationState; d: VerificationDetailView; f: NonNullable<Form>; t: T; back: () => void }) {
  return f.kind === 'manual' ? <ManualForm s={s} d={d} it={f.item} initial={f.result ?? 'passed'} t={t} back={back} /> : <ConditionalForm s={s} it={f.item} t={t} back={back} />;
}

function ManualForm({ s, d, it, initial, t, back }: { s: VerificationState; d: VerificationDetailView; it: VerificationItemView; initial: 'passed' | 'failed'; t: T; back: () => void }) {
  const [result, setResult] = useState<'passed' | 'failed'>(initial);
  const [how, setHow] = useState<VerificationHow | undefined>(undefined);
  const [note, setNote] = useState('');
  const [redFlag, setRedFlag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fallback = d.service.status === 'down' && it.thirdParty;
  const clearing = it.state === 'failed' && result === 'passed';
  const min = fallback || clearing ? FALLBACK_NOTE_MIN : NOTE_MIN;
  const ok = !!how && letters(note) >= min;
  return (
    <>
      <div className="stack gap-3" data-form="manual">
        <p className="t-sm"><strong>{itemTitle(t, it)}</strong></p>
        <p className="t-sm">{t(fallback ? K.manual.bodyFallback : K.manual.body)}</p>
        <div className="row gap-2" role="group" aria-label={t(K.manual.result)}>
          <span data-result="passed"><Chip pressed={result === 'passed'} onClick={() => { setResult('passed'); setRedFlag(false); }}>{t(K.action.pass)}</Chip></span>
          <span data-result="failed"><Chip pressed={result === 'failed'} onClick={() => setResult('failed')}>{t(K.action.fail)}</Chip></span>
        </div>
        <div className="stack gap-2" role="group" aria-label={t(K.manual.how)}>
          <strong className="t-sm">{t(K.manual.how)}</strong>
          <div className="row gap-2 wrap">{HOWS.map((h) => <span key={h} data-how={h}><Chip pressed={how === h} onClick={() => setHow(h)}>{t(K.how[h])}</Chip></span>)}</div>
        </div>
        <Field label={t(K.manual.note)} hint={t(fallback ? K.manual.noteHintFallback : clearing ? K.manual.noteHintClearing : K.manual.noteHint, { min })}>{(p) => <TextArea id={p.id} rows={4} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
        {result === 'failed' && <div className="row gap-2" style={{ alignItems: 'center' }} data-red-flag-toggle><Chip pressed={redFlag} onClick={() => setRedFlag(!redFlag)}>{t(K.manual.redFlag)}</Chip><span className="t-xs t-muted">{t(K.manual.redFlagHint)}</span></div>}
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.action.back)}</Button><Button disabled={!ok || s.busy} data-confirm-manual onClick={async () => { const r = await s.record(it.key, { result, how, note, redFlag: result === 'failed' && redFlag }); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.action.save)}</Button></Footer>
    </>
  );
}

function ConditionalForm({ s, it, t, back }: { s: VerificationState; it: VerificationItemView; t: T; back: () => void }) {
  const [reason, setReason] = useState('');
  const [due, setDue] = useState(isoDay(14));
  const [error, setError] = useState<string | null>(null);
  const ok = letters(reason) >= REASON_MIN && due > isoDay(0) && due <= isoDay(CONDITIONAL_MAX_DAYS);
  return (
    <>
      <div className="stack gap-3" data-form="conditional">
        <p className="t-sm"><strong>{itemTitle(t, it)}</strong></p>
        <p className="t-sm">{t(K.conditional.body, { days: CONDITIONAL_MAX_DAYS })}</p>
        <Field label={t(K.conditional.reason)} hint={t(K.conditional.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
        <Field label={t(K.conditional.due)} hint={t(K.conditional.dueHint, { days: CONDITIONAL_MAX_DAYS })}>{(p) => <Input id={p.id} type="date" min={isoDay(1)} max={isoDay(CONDITIONAL_MAX_DAYS)} value={due} onChange={(e) => setDue(e.target.value)} data-f="due" />}</Field>
        <p className="t-xs t-muted">{t(K.conditional.limit)}</p>
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.action.back)}</Button><Button disabled={!ok || s.busy} data-confirm-conditional onClick={async () => { const r = await s.allow(it.key, { reason, dueDate: due }); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.action.grant)}</Button></Footer>
    </>
  );
}


