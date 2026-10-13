import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CheckCircle, FileText, SealCheck, ShieldCheck, WarningCircle } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, OtpInput, Screen, ScreenHeader, Select, Sheet, SignaturePad, Tabs, TextArea, formatDate, formatDateTime, formatINR } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { AgreementTemplatesView, OfferApplicantView, OfferDetailView, OfferRowView, OfferTermDef } from '@/data/repository';
import type { AgreementTerms } from '@/data/types';
import { useAgreement } from './useAgreement';
import type { AgreementState } from './useAgreement';
import { AGREEMENT_KEYS as K, DEMO_OTP, MAX_ADDENDUM_ITEMS, OTP_LENGTH, REASON_MIN, REQUEST_MIN, ROLES, STAGE_FILTERS, TABS, WRONG_BEFORE_FALLBACK, applyPath, keyKey } from './agreement.types';

type T = ReturnType<typeof useTranslation>['t'];
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STAGE_TONE: Record<OfferRowView['stage'], BadgeTone> = { interview_open: 'neutral', verifying: 'neutral', waitlisted: 'warning', to_prepare: 'accent', draft: 'accent', sent: 'warning', signed: 'success', withdrawn: 'neutral' };
const roleKey = (r: string) => `application.admin.role.${r}`;
const isoDay = (offset: number) => { const d = new Date(Date.now() + offset * 86_400_000); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

const fmtTerm = (t: T, unit: OfferTermDef['unit'], v: number | string): string => (unit === 'pct' ? `${v}%` : unit === 'inr' ? formatINR(Number(v)) : unit === 'days' ? t(K.unit.days, { count: Number(v) }) : unit === 'months' ? t(K.unit.months, { count: Number(v) }) : `${v} / 5`);

/** The values a clause's wording refers to, from the terms that actually bind. */
const clauseParams = (terms: AgreementTerms, zoneNames: string[], name: string): Record<string, string | number> => ({
  name,
  conversionPct: terms.conversionPct ?? 0,
  closePct: terms.closePct ?? 0,
  installPoolPct: terms.installPoolPct ?? 0,
  leadBonusPct: terms.leadBonusPct ?? 0,
  qcFee: formatINR(terms.qcFee ?? 0),
  deliverySlaDays: terms.deliverySlaDays ?? 0,
  paymentTermsDays: terms.paymentTermsDays ?? 0,
  minQualityScore: terms.minQualityScore ?? 0,
  qualityStandards: terms.qualityStandards ?? '',
  warrantyMonths: terms.warrantyMonths ?? 0,
  territory: zoneNames.join(', '),
});

/**
 * Screen 146 — Offer & Onboarding Agreement. Admin prepares the role's agreement from its versioned template (with Admin-approved custom terms
 * where someone has negotiated one) once verification clears; the partner reads and signs it on their own link, and signing activates the account.
 */
export function AgreementScreen() {
  const { t } = useTranslation();
  const s = useAgreement();
  const shell = (body: JSX.Element) => (s.admin ? <Screen width="default"><ScreenHeader title={t(K.title)} />{body}</Screen> : <div className="ds-screen ds-screen--narrow"><PublicHeader s={s} t={t} />{body}</div>);
  if (s.status === 'invalid') return shell(<EmptyState icon={<FileText size={28} />} title={t(K.invalid.title)} body={t(K.invalid.body)} actionLabel={t(K.invalid.action)} onAction={() => s.goto('/join')} />);
  if (s.status === 'not_found') return shell(<EmptyState icon={<FileText size={28} />} title={t(K.invalid.title)} body={t(K.invalid.body)} actionLabel={s.admin ? t(K.detail.back) : t(K.invalid.action)} onAction={() => s.goto(s.admin ? '/offers' : '/join')} />);
  if (s.status === 'loading' && !s.board && !s.mine) return shell(<LoadingState label={t(K.loading)} variant="list" rows={4} />);
  if (s.status === 'error' || (!s.board && !s.mine)) return shell(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  return s.admin ? <AdminBoard s={s} t={t} /> : s.mine ? <Applicant s={s} v={s.mine} t={t} /> : null;
}

function PublicHeader({ s, t }: { s: AgreementState; t: T }) {
  const { i18n } = useTranslation();
  return (
    <header className="stack gap-2 mb-3" style={{ alignItems: 'center', textAlign: 'center' }}>
      <span className="t-xs t-muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t(K.brand)}</span>
      <div className="row gap-2 wrap" role="group" aria-label={t(K.language)} style={{ justifyContent: 'center' }}>
        {(['en', 'hi', 'mr'] as const).map((l) => <span key={l} data-lang={l}><Chip pressed={i18n.language.startsWith(l)} onClick={() => s.setLanguage(l)}>{{ en: 'English', hi: 'हिन्दी', mr: 'मराठी' }[l]}</Chip></span>)}
      </div>
    </header>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2 wrap" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>{children}</div>;
}

/* ================================================================== Admin */

function AdminBoard({ s, t }: { s: AgreementState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const b = s.board as NonNullable<typeof s.board>;
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(K.admin.subtitle, { count: b.counts.toPrepare })} />
      <div className="sticky-under-shell stack gap-2 mb-3">
        <Tabs label={t(K.tabs.label)} value={s.tab} onChange={(id) => s.setTab(id as typeof s.tab)} items={TABS.map((id) => ({ id, label: t(K.tabs[id]) }))} />
        {s.tab === 'offers' && (
          <>
            <Input aria-label={t(K.admin.search)} placeholder={t(K.admin.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
            <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.stageFilter.label)}>
              {STAGE_FILTERS.map((f) => <span key={f} className="shrink-0" data-stage-filter={f}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(K.stageFilter[f])}</Chip></span>)}
            </div>
          </>
        )}
      </div>
      {s.tab === 'terms' ? <Templates s={s} t={t} lang={lang} /> : b.rows.length === 0 ? <EmptyState icon={<FileText size={32} />} title={t(K.admin.emptyTitle)} body={t(K.admin.emptyBody)} /> : (
        <section className="stack gap-2" aria-labelledby="of-heading">
          <div className="stack"><h2 id="of-heading" className="t-md t-semibold">{t(K.admin.heading)}</h2><p className="t-xs t-muted">{t(K.admin.hint)}</p></div>
          {s.shown.length === 0 ? <EmptyState icon={<FileText size={28} />} title={t(K.admin.filteredTitle)} body={t(K.admin.filteredBody)} actionLabel={t(K.admin.clear)} onAction={() => { s.setQuery(''); s.setFilter('all'); }} /> : <Card className="ds-card--flush">{s.shown.map((r) => <OfferRow key={r.id} r={r} s={s} t={t} />)}</Card>}
        </section>
      )}
      <DetailSheet s={s} t={t} lang={lang} />
    </Screen>
  );
}

function OfferRow({ r, s, t }: { r: OfferRowView; s: AgreementState; t: T }) {
  return (
    <button type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} data-offer={r.id} data-stage={r.stage} onClick={() => s.open(r.id)}>
      <span className="shrink-0" style={{ minHeight: 24, display: 'inline-flex', alignItems: 'center' }}>{r.stage === 'signed' ? <SealCheck size={24} weight="fill" aria-hidden="true" color="var(--color-success)" /> : <FileText size={24} aria-hidden="true" color="var(--color-text-secondary)" />}</span>
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-medium">{r.name}</span>
        <span className="t-xs t-muted">{t(roleKey(r.role))} · {t(K.admin.stageBody[r.stage])}</span>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          {r.templateVersion && <span className="t-xs t-muted">{t(K.admin.row.version, { version: r.templateVersion })}</span>}
          {r.daysSinceSent !== null && r.stage === 'sent' && <span className="t-xs t-muted">{t(K.admin.row.sentAgo, { count: r.daysSinceSent })}</span>}
          {r.openRequest && <Badge tone="warning">{t(K.admin.row.question)}</Badge>}
          {r.signal === 'block' && <Badge tone="error">{t(K.admin.row.concern)}</Badge>}
          {r.stage === 'signed' && <Badge tone={r.capability === 'full' ? 'success' : 'warning'}>{t(r.capability === 'full' ? K.admin.row.full : K.admin.row.basic)}</Badge>}
        </span>
      </span>
      <span className="shrink-0"><Badge tone={STAGE_TONE[r.stage]} dot>{t(K.stage[r.stage])}</Badge></span>
    </button>
  );
}

type Mode = 'view' | 'addendum' | 'send' | 'withdraw';

function DetailSheet({ s, t, lang }: { s: AgreementState; t: T; lang: string }) {
  const d = s.detail;
  const [mode, setMode] = useState<Mode>('view');
  useEffect(() => setMode('view'), [s.applicationId]);
  const titles: Record<Mode, string> = { view: d?.applicant.name ?? t(K.title), addendum: t(K.detail.addendumHeading), send: t(K.detail.send), withdraw: t(K.detail.withdraw) };
  return (
    <Sheet open={!!s.applicationId} onClose={s.close} title={titles[mode]} closeLabel={t('action.close')}>
      {s.detailStatus === 'loading' && !d && <LoadingState label={t(K.loading)} variant="list" rows={3} />}
      {s.detailStatus === 'error' && !d && <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reloadDetail()} />}
      {s.detailStatus === 'gone' && <EmptyState icon={<FileText size={28} />} title={t(K.invalid.title)} body={t(K.invalid.body)} />}
      {d && s.detailStatus !== 'gone' && (mode === 'view' ? <Detail s={s} d={d} t={t} lang={lang} setMode={setMode} /> : mode === 'addendum' ? <AddendumForm s={s} d={d} t={t} back={() => setMode('view')} /> : <ReasonForm s={s} t={t} mode={mode} back={() => setMode('view')} />)}
    </Sheet>
  );
}

function Detail({ s, d, t, lang, setMode }: { s: AgreementState; d: OfferDetailView; t: T; lang: string; setMode: (m: Mode) => void }) {
  const o = d.offer;
  const stage = d.row.stage;
  const [zonesSel, setZonesSel] = useState<string[]>(d.terms.territoryZoneIds ?? []);
  const [override, setOverride] = useState('');
  const [error, setError] = useState<string | null>(null);
  const field = d.row.role !== 'supplier';
  const g = d.gate;
  const steps = [
    { id: 'verified', label: t(K.detail.gate), status: g.state !== 'blocked' ? ('complete' as const) : ('upcoming' as const) },
    { id: 'prepared', label: t(K.stage.draft), status: o && o.status !== 'withdrawn' ? ('complete' as const) : ('upcoming' as const) },
    { id: 'sent', label: t(K.stage.sent), status: o?.sentAt && o.status !== 'withdrawn' ? ('complete' as const) : ('upcoming' as const) },
    { id: 'signed', label: t(K.stage.signed), status: o?.status === 'signed' ? ('complete' as const) : ('upcoming' as const) },
  ];
  return (
    <div className="stack gap-4" data-detail={d.row.id} data-stage={stage}>
      <div className="stack gap-1">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}><Badge tone={STAGE_TONE[stage]} dot>{t(K.stage[stage])}</Badge>{o && <span className="t-sm t-muted">{o.documentNo} · {t(K.admin.row.version, { version: o.templateVersion })}</span>}</div>
        <span className="t-sm">{d.row.code} · {t(roleKey(d.row.role))} · {d.applicant.city}</span>
      </div>
      <div style={{ overflowX: 'auto' }}><AscensionLine orientation="horizontal" steps={steps} /></div>

      <Card>
        <div className="stack gap-2" data-gate-card>
          <strong className="t-sm"><ShieldCheck size={16} aria-hidden="true" /> {t(K.detail.gate)}</strong>
          <p className="t-sm">{g.state === 'clear' ? t(K.detail.gateClear) : g.state === 'conditional' ? t(K.detail.gateConditional, { date: g.conditional[0] ? formatDate(g.conditional[0].dueAt, lang) : '' }) : t(K.detail.gateBlocked, { count: g.pending.length + g.failed.length + g.lapsed.length })}</p>
          <Button variant="ghost" size="sm" style={{ width: 'fit-content' }} data-open-verification onClick={() => s.goto(`/verification/${d.row.id}`)}>{t(K.detail.openVerification)}</Button>
        </div>
      </Card>

      <Card>
        <div className="stack gap-1" data-interview-card>
          <strong className="t-sm">{t(K.detail.interview)}</strong>
          <p className="t-sm">{d.interviewOutcome === 'skipped' ? t(K.detail.skipped) : d.interviewOutcome ? t(`interview.detail.outcome.${d.interviewOutcome}`) : t(K.detail.interviewNone)}</p>
          {d.signal.concerns.map((c, n) => <p key={n} className="t-sm"><Badge tone="warning">{t(`interview.concern.${c.category}`)}</Badge> {c.text}</p>)}
          <Button variant="ghost" size="sm" style={{ width: 'fit-content' }} data-open-interview onClick={() => s.goto(`/interviews/${d.row.id}`)}>{t(K.detail.openInterview)}</Button>
        </div>
      </Card>

      {d.canPrepare && d.needsOverride && (
        <Card>
          <div className="stack gap-2" data-override>
            <strong className="t-sm t-error"><WarningCircle size={16} aria-hidden="true" /> {t(K.detail.overrideHeading)}</strong>
            <p className="t-sm">{t(K.detail.overrideBody)}</p>
            <Field label={t(K.detail.overrideReason)} hint={t(K.detail.addendumReason, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={override} onChange={(e) => setOverride(e.target.value)} data-f="override" />}</Field>
          </div>
        </Card>
      )}
      {o?.concernOverride && <p className="t-sm" data-override-kept>{t(K.detail.overrideKept, { name: o.concernOverride.byName })}: “{o.concernOverride.reason}”</p>}
      {d.phoneTaken && d.canPrepare && <p className="t-sm t-error" role="alert">{t(K.detail.phoneTaken)}</p>}

      {d.canPrepare && field && (
        <div className="stack gap-2" role="group" aria-label={t(K.detail.territory)}>
          <strong className="t-sm">{t(K.detail.territory)}</strong>
          <p className="t-xs t-muted">{t(K.detail.territoryHint)}</p>
          <div className="row gap-2 wrap">{d.zones.map((z) => <span key={z.id} data-zone={z.id}><Chip pressed={zonesSel.includes(z.id)} onClick={() => setZonesSel(zonesSel.includes(z.id) ? zonesSel.filter((x) => x !== z.id) : [...zonesSel, z.id])}>{z.name}</Chip></span>)}</div>
        </div>
      )}

      {(o || d.canPrepare) && <TermsTable d={d} t={t} />}
      {o && o.addendum && <p className="t-sm" data-addendum>{t(K.detail.custom)}: “{o.addendum.reason}” <span className="t-xs t-muted">— {t(K.detail.addendumBy, { name: o.addendum.approvedByName, date: formatDate(o.addendum.approvedAt, lang) })}</span></p>}
      {o && d.template.newerExists && o.status === 'draft' && <p className="t-xs t-warning">{t(K.detail.newer, { version: d.template.version })}</p>}
      {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}

      {o && o.requests.length > 0 && <Requests s={s} d={d} t={t} lang={lang} />}
      {o?.status === 'signed' && <Activation s={s} d={d} t={t} lang={lang} />}

      {o && o.events.length > 0 && (
        <details data-timeline><summary className="t-sm t-muted" style={{ cursor: 'pointer' }}>{t(K.detail.timeline)}</summary>
          <div className="stack gap-1 mt-2">{[...o.events].reverse().map((e) => <p key={e.id} className="t-xs t-muted">{formatDateTime(e.at, lang)} · {t(K.detail.event[e.kind])}{e.note ? ` · ${e.note}` : ''}</p>)}</div>
        </details>
      )}

      <Footer>
        {d.canPrepare && <Button data-prepare disabled={s.busy || d.phoneTaken || (d.needsOverride && letters(override) < REASON_MIN) || (field && zonesSel.length === 0)} onClick={async () => { const r = await s.prepare({ territoryZoneIds: zonesSel, ...(d.needsOverride ? { overrideReason: override } : {}) }); setError(r.ok ? null : r.code ?? 'generic'); }}>{t(o && o.status === 'draft' ? K.detail.reprepare : K.detail.prepare)}</Button>}
        {o && (o.status === 'draft' || o.status === 'sent') && <Button variant="secondary" data-addendum-open onClick={() => setMode('addendum')}>{t(K.detail.addendumOpen)}</Button>}
        {o?.status === 'draft' && <Button data-send disabled={s.busy} onClick={() => setMode('send')}>{t(K.detail.send)}</Button>}
        {o && (o.status === 'draft' || o.status === 'sent') && <Button variant="ghost" data-withdraw onClick={() => setMode('withdraw')}>{t(K.detail.withdraw)}</Button>}
      </Footer>
    </div>
  );
}

function TermsTable({ d, t }: { d: OfferDetailView; t: T }) {
  const bound = d.terms;
  return (
    <div className="stack gap-1" data-terms aria-label={t(K.detail.termsHeading)}>
      <strong className="t-sm">{t(K.detail.termsHeading)}</strong>
      {d.termDefs.map((def) => {
        const v = (bound as Record<string, unknown>)[def.key] as number | undefined;
        const custom = v !== undefined && v !== def.standard && d.offer?.addendum?.items.some((i) => i.key === def.key);
        return <div key={def.key} className="row gap-2" data-term={def.key} style={{ justifyContent: 'space-between' }}><span className="t-sm">{t(K.term[def.key])}</span><span className="t-sm num">{v === undefined ? '—' : fmtTerm(t, def.unit, v)}{custom && <> <Badge tone="warning">{t(K.detail.custom)}</Badge></>}</span></div>;
      })}
      {bound.qualityStandards && <div className="row gap-2" style={{ justifyContent: 'space-between' }}><span className="t-sm">{t(K.term.qualityStandards)}</span><span className="t-sm" style={{ textAlign: 'right' }}>{bound.qualityStandards}</span></div>}
      {d.template.version > 0 && <span className="t-xs t-muted">{t(K.detail.template, { version: d.offer?.templateVersion ?? d.template.version, date: formatDate(d.template.effectiveFrom, 'en') })}</span>}
    </div>
  );
}

function Requests({ s, d, t, lang }: { s: AgreementState; d: OfferDetailView; t: T; lang: string }) {
  const o = d.offer as NonNullable<typeof d.offer>;
  return (
    <section className="stack gap-2" data-requests aria-label={t(K.detail.requestsHeading)}>
      <strong className="t-sm">{t(K.detail.requestsHeading)}</strong>
      {o.requests.map((r) => r.response ? (
        <Card key={r.id}><div className="stack gap-1"><p className="t-sm">{t(K.detail.requestFrom, { date: formatDate(r.at, lang) })}: “{r.text}”</p><p className="t-xs t-muted">{r.response.outcome === 'approved' ? t(K.detail.respondApprove) : t(K.detail.respondDecline)} · {r.response.byName}: “{r.response.note}”</p></div></Card>
      ) : <OpenRequest key={r.id} s={s} d={d} t={t} lang={lang} id={r.id} text={r.text} at={r.at} />)}
    </section>
  );
}

function OpenRequest({ s, d, t, lang, id, text, at }: { s: AgreementState; d: OfferDetailView; t: T; lang: string; id: string; text: string; at: string }) {
  const negotiable = d.termDefs.filter((x) => x.negotiable);
  const [key, setKey] = useState<string>(negotiable[0]?.key ?? '');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const def = negotiable.find((x) => x.key === key);
  return (
    <Card>
      <div className="stack gap-2" data-open-request={id}>
        <p className="t-sm">{t(K.detail.requestFrom, { date: formatDate(at, lang) })}: “{text}”</p>
        {def && (
          <div className="row gap-2 wrap" style={{ alignItems: 'flex-end' }}>
            <Field label={t(K.detail.addendumValue)}>{(p) => <Select id={p.id} value={key} onChange={(e) => setKey(e.target.value)} data-f="req-key">{negotiable.map((x) => <option key={x.key} value={x.key}>{t(K.term[x.key])}</option>)}</Select>}</Field>
            <Field label={t(K.detail.addendumRange, { min: def.min, max: def.max })}>{(p) => <Input id={p.id} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))} data-f="req-value" style={{ width: 110 }} />}</Field>
          </div>
        )}
        <Field label={t(K.detail.respondNote)} hint={t(K.detail.respondNoteHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-f="req-note" />}</Field>
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
        <div className="row gap-2 wrap">
          <Button size="sm" data-respond-approve disabled={s.busy || !def || !value || letters(note) < REASON_MIN} onClick={async () => { const r = await s.respond(id, { outcome: 'approved', note, items: [{ key: key as keyof AgreementTerms, value: Number(value) }] }); setError(r.ok ? null : r.code ?? 'generic'); }}>{t(K.detail.respondApprove)}</Button>
          <Button size="sm" variant="secondary" data-respond-decline disabled={s.busy || letters(note) < REQUEST_MIN} onClick={async () => { const r = await s.respond(id, { outcome: 'declined', note }); setError(r.ok ? null : r.code ?? 'generic'); }}>{t(K.detail.respondDecline)}</Button>
        </div>
      </div>
    </Card>
  );
}

function Activation({ s, d, t, lang }: { s: AgreementState; d: OfferDetailView; t: T; lang: string }) {
  const o = d.offer as NonNullable<typeof d.offer>;
  const a = o.activation;
  const sig = o.signature;
  if (!a || !sig) return null;
  const full = Object.values(a.steps).every((x) => x.done);
  return (
    <Card>
      <div className="stack gap-2" data-activation>
        <strong className="t-sm"><SealCheck size={16} aria-hidden="true" /> {t(K.detail.signedBody, { name: sig.signerName, date: formatDateTime(sig.at, lang) })}</strong>
        <p className="t-xs t-muted">{sig.viaFallback ? t(K.detail.fallback) : t(K.detail.otp)}</p>
        <Badge tone={full ? 'success' : 'warning'} dot>{t(full ? K.detail.capability.full : K.detail.capability.basic)}</Badge>
        <p className="t-sm">{t(K.detail.activationBody)}</p>
        {Object.entries(a.steps).map(([key, st]) => (
          <div key={key} className="row gap-2" data-step={key} data-done={st.done ? 1 : 0} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="t-sm">{t(K.detail.step[key as 'bank' | 'photo'])}{st.done && st.at ? ` · ${t(K.detail.stepDone, { date: formatDate(st.at, lang) })}` : ''}</span>
            <Button size="sm" variant={st.done ? 'ghost' : 'secondary'} disabled={s.busy} onClick={() => void s.step(key, !st.done)}>{t(st.done ? K.detail.stepUndo : K.detail.stepMark)}</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AddendumForm({ s, d, t, back }: { s: AgreementState; d: OfferDetailView; t: T; back: () => void }) {
  const negotiable = d.termDefs.filter((x) => x.negotiable);
  const [rows, setRows] = useState<{ key: string; value: string }[]>(d.offer?.addendum?.items.map((i) => ({ key: i.key, value: String(i.value) })) ?? [{ key: negotiable[0]?.key ?? '', value: '' }]);
  const [reason, setReason] = useState(d.offer?.addendum?.reason ?? '');
  const [error, setError] = useState<string | null>(null);
  const ok = rows.length > 0 && rows.every((r) => r.key && r.value && Number.isFinite(Number(r.value))) && letters(reason) >= REASON_MIN;
  return (
    <>
      <div className="stack gap-3" data-form="addendum">
        <p className="t-sm">{t(K.detail.addendumBody)}</p>
        {rows.map((r, i) => {
          const def = negotiable.find((x) => x.key === r.key);
          return (
            <div key={i} className="row gap-2 wrap" data-row={i} style={{ alignItems: 'flex-end' }}>
              <Field label={t(K.detail.addendumValue)}>{(p) => <Select id={p.id} value={r.key} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}>{negotiable.map((x) => <option key={x.key} value={x.key}>{t(K.term[x.key])}</option>)}</Select>}</Field>
              <Field label={def ? t(K.detail.addendumRange, { min: def.min, max: def.max }) : ''}>{(p) => <Input id={p.id} inputMode="decimal" value={r.value} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value.replace(/[^\d.]/g, '') } : x)))} data-f="value" style={{ width: 110 }} />}</Field>
              {rows.length > 1 && <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</Button>}
            </div>
          );
        })}
        {rows.length < MAX_ADDENDUM_ITEMS && <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} onClick={() => setRows([...rows, { key: negotiable[0]?.key ?? '', value: '' }])}>+</Button>}
        <Field label={t(K.detail.addendumReason, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.detail.back)}</Button><Button disabled={!ok || s.busy} data-addendum-save onClick={async () => { const r = await s.addendum(rows.map((x) => ({ key: x.key as keyof AgreementTerms, value: Number(x.value) })), reason); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.detail.addendumSave)}</Button></Footer>
    </>
  );
}

function ReasonForm({ s, t, mode, back }: { s: AgreementState; t: T; mode: 'send' | 'withdraw'; back: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <div className="stack gap-3" data-form={mode}>
        <p className="t-sm">{t(mode === 'send' ? K.detail.sendBody : K.detail.withdrawBody)}</p>
        {mode === 'withdraw' && <Field label={t(K.detail.withdrawReason)}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>}
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
      </div>
      <Footer><Button variant="ghost" onClick={back}>{t(K.detail.back)}</Button><Button variant={mode === 'withdraw' ? 'danger' : 'primary'} disabled={s.busy || (mode === 'withdraw' && letters(reason) < 10)} data-confirm={mode} onClick={async () => { const r = mode === 'send' ? await s.send() : await s.withdraw(reason); if (!r.ok) setError(r.code ?? 'generic'); else back(); }}>{t(K.detail.confirm)}</Button></Footer>
    </>
  );
}

/* ------------------------------------------------------------------ the standard terms, versioned */

function Templates({ s, t, lang }: { s: AgreementState; t: T; lang: string }) {
  const v = s.templates;
  if (!v) return <LoadingState label={t(K.loading)} variant="list" rows={3} />;
  return (
    <div className="stack gap-3" data-templates>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.templates.heading)}</h2><p className="t-sm">{t(K.templates.body)}</p><p className="t-xs t-muted" data-legal>{t(K.templates.legal)}</p></div>
      <div className="grid-auto" style={{ '--min': '320px', alignItems: 'start' } as React.CSSProperties}>
        {ROLES.map((role) => <TemplateCard key={role} s={s} t={t} lang={lang} v={v.roles.find((x) => x.role === role) as AgreementTemplatesView['roles'][number]} />)}
      </div>
    </div>
  );
}

function TemplateCard({ s, t, lang, v }: { s: AgreementState; t: T; lang: string; v: AgreementTemplatesView['roles'][number] }) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(v.defs.map((d) => [d.key, String((v.current.terms as Record<string, unknown>)[d.key] ?? '')])));
  const [standards, setStandards] = useState(v.current.terms.qualityStandards ?? '');
  const [effective, setEffective] = useState(isoDay(1));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const changed = v.defs.some((d) => Number(vals[d.key]) !== Number((v.current.terms as Record<string, unknown>)[d.key])) || (v.role === 'supplier' && standards.trim() !== (v.current.terms.qualityStandards ?? ''));
  const ok = changed && v.defs.every((d) => Number(vals[d.key]) >= d.min && Number(vals[d.key]) <= d.max) && letters(note) >= REASON_MIN && effective >= isoDay(0);
  return (
    <Card>
      <div className="stack gap-3" data-template={v.role}>
        <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><strong className="t-md">{t(roleKey(v.role))}</strong><Badge tone="accent">{t(K.templates.version, { version: v.current.version })}</Badge></div>
        {v.defs.map((d) => d.fromRules ? (
          <div key={d.key} className="stack gap-1" data-from-rules={d.key}>
            <span className="t-sm t-semibold">{t(K.term[d.key])}</span>
            <span className="t-sm num">{vals[d.key]}</span>
            <span className="t-xs t-muted">{t('commissionRules.link.fromRules')} <Link to="/commission-rules">{t('commissionRules.link.open')}</Link></span>
          </div>
        ) : (
          <Field key={d.key} label={`${t(K.term[d.key])} (${d.min}–${d.max})`}>{(p) => <Input id={p.id} inputMode="decimal" value={vals[d.key]} onChange={(e) => setVals({ ...vals, [d.key]: e.target.value.replace(/[^\d.]/g, '') })} data-f={d.key} />}</Field>
        ))}
        {v.role === 'supplier' && <Field label={t(K.templates.standards)}>{(p) => <TextArea id={p.id} rows={2} value={standards} onChange={(e) => setStandards(e.target.value)} />}</Field>}
        {changed && (
          <>
            <Field label={t(K.templates.effective)} hint={t(K.templates.effectiveHint)}>{(p) => <Input id={p.id} type="date" min={isoDay(0)} value={effective} onChange={(e) => setEffective(e.target.value)} data-f="effective" />}</Field>
            <Field label={t(K.templates.note)} hint={t(K.templates.noteHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
            <p className="t-xs t-muted">{t(K.templates.forward)}</p>
          </>
        )}
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
        <Button disabled={!ok || s.busy} data-publish={v.role} onClick={async () => { const terms: AgreementTerms = Object.fromEntries(v.defs.map((d) => [d.key, Number(vals[d.key])])); if (v.role === 'supplier') terms.qualityStandards = standards; const r = await s.publish(v.role, { terms, effectiveFrom: effective, changeNote: note }); if (!r.ok) setError(r.code ?? 'generic'); else { setNote(''); setError(null); } }}>{t(K.templates.publish)}</Button>
        <details><summary className="t-xs t-muted" style={{ cursor: 'pointer' }}>{t(K.templates.versions)} · {v.versions.length}</summary>
          <div className="stack gap-1 mt-2">{v.versions.map((x) => <span key={x.id} className="t-xs t-muted" data-version={x.version}>v{x.version} · {formatDate(x.effectiveFrom, lang)} · {x.createdByName} · “{x.changeNote}”</span>)}</div>
        </details>
      </div>
    </Card>
  );
}

/* ================================================================== Partner */

function DocumentBody({ v, t, lang }: { v: OfferApplicantView; t: T; lang: string }) {
  const params = clauseParams(v.terms, v.zoneNames, v.name);
  return (
    <div className="stack gap-3" id="agreement-doc" data-doc>
      <div className="stack gap-1">
        <strong className="t-lg">{t(K.doc.heading, { role: t(K.doc.role[v.role]) })}</strong>
        <span className="t-xs t-muted">{t(K.doc.number, { no: v.documentNo ?? '' })} · {t(K.doc.version, { version: v.templateVersion ?? 1 })}</span>
        <span className="t-sm">{t(K.doc.between, { name: v.name })}</span>
      </div>
      {v.clauses.map((c, i) => (
        <section key={c.id} className="stack gap-1" data-clause={c.id}>
          <h3 className="t-md t-semibold">{i + 1}. {t(c.heading)}</h3>
          <p className="t-sm">{t(c.body, params)}</p>
        </section>
      ))}
      {v.addendum && (
        <section className="stack gap-1" data-doc-addendum style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>
          <h3 className="t-md t-semibold">{t(K.doc.custom)}</h3>
          <p className="t-sm">{t(K.doc.customBody, { by: v.addendum.approvedByName, date: formatDate(v.addendum.approvedAt, lang) })}</p>
          {v.addendum.items.map((i) => <p key={i.key} className="t-sm num">{t(K.term[i.key])}: <strong>{i.key === 'qcFee' ? formatINR(i.value) : i.key.endsWith('Pct') ? `${i.value}%` : i.value}</strong></p>)}
          <p className="t-sm">“{v.addendum.reason}”</p>
        </section>
      )}
      {v.zoneNames.length > 0 && <p className="t-sm">{t(K.doc.territory)}: {v.zoneNames.join(', ')}</p>}
    </div>
  );
}

function Applicant({ s, v, t }: { s: AgreementState; v: OfferApplicantView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const link = `${applyPath(v.applicationId)}?k=${(() => { try { return localStorage.getItem(keyKey(v.applicationId)) ?? ''; } catch { return ''; } })()}`;
  const first = v.name.split(' ')[0];
  const back = <Button variant="ghost" style={{ width: 'fit-content' }} className="mt-3" data-back-application onClick={() => s.goto(link)}>{t(K.applicant.backToApplication)}</Button>;
  if (v.status === 'none') return <div className="ds-screen ds-screen--narrow"><PublicHeader s={s} t={t} /><ScreenHeader title={t(K.applicant.heading)} subtitle={t(K.applicant.hello, { name: first })} /><Card><div className="stack gap-2"><strong className="t-md">{t(K.applicant.noneTitle)}</strong><p className="t-sm">{t(K.applicant.noneBody)}</p></div></Card>{back}</div>;
  if (v.status === 'withdrawn') return <div className="ds-screen ds-screen--narrow"><PublicHeader s={s} t={t} /><ScreenHeader title={t(K.applicant.heading)} subtitle={t(K.applicant.hello, { name: first })} /><Card><div className="stack gap-2"><strong className="t-md">{t(K.applicant.withdrawnTitle)}</strong><p className="t-sm">{t(K.applicant.withdrawnBody)}</p></div></Card>{back}</div>;
  return (
    <div className="ds-screen ds-screen--narrow pb-action-bar">
      <PublicHeader s={s} t={t} />
      <ScreenHeader title={t(K.applicant.heading)} subtitle={t(K.applicant.hello, { name: first })} />
      {v.status === 'signed' ? <Signed s={s} v={v} t={t} lang={lang} /> : <Sign s={s} v={v} t={t} lang={lang} />}
      {back}
    </div>
  );
}

function download(v: OfferApplicantView, t: T) {
  const root = document.getElementById('agreement-doc');
  if (!root) return;
  const cs = getComputedStyle(document.documentElement);
  const vars = ['--color-bg', '--color-surface', '--color-text-primary', '--color-text-secondary', '--color-accent-primary', '--color-border', '--font-body', '--font-display'].map((k) => `${k}:${cs.getPropertyValue(k)}`).join(';');
  const sig = v.signature ? `<hr/><p><strong>${t(K.doc.signedHeading)}</strong></p><p>${t(K.doc.signedBy, { name: v.signature.signerName, date: formatDateTime(v.signature.at, v.signature.language) })}</p>${v.signature.method === 'drawn' ? `<img alt="" style="max-width:260px;border:1px solid var(--color-border)" src="${v.signature.data}"/>` : `<p style="font-size:1.6em;font-style:italic">${v.signature.data.replace(/</g, '&lt;')}</p>`}` : '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${v.documentNo ?? 'Agreement'}</title><style>:root{${vars}}body{background:var(--color-bg);color:var(--color-text-primary);font-family:var(--font-body,sans-serif);max-width:720px;margin:24px auto;padding:0 16px;line-height:1.55}h3{margin:16px 0 4px}hr{border:0;border-top:1px solid var(--color-border);margin:24px 0}</style></head><body>${root.innerHTML}${sig}</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${v.documentNo ?? 'agreement'}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function Sign({ s, v, t, lang }: { s: AgreementState; v: OfferApplicantView; t: T; lang: string }) {
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<'entering' | 'wrong' | 'verified'>('entering');
  const [wrong, setWrong] = useState(0);
  const [fallback, setFallback] = useState(false);
  const [method, setMethod] = useState<'drawn' | 'typed'>('drawn');
  const [drawn, setDrawn] = useState('');
  const [typed, setTyped] = useState('');
  const [name, setName] = useState(v.name);
  const [ask, setAsk] = useState('');
  const [error, setError] = useState<string | null>(null);
  const openRequest = v.requests.some((r) => !r.response);
  const data = method === 'drawn' ? drawn : typed.trim();
  const ready = consent && phase === 'verified' && letters(name) >= 3 && !!data && !openRequest;
  const verify = () => { if (otp === DEMO_OTP) setPhase('verified'); else { setWrong((n) => n + 1); setPhase('wrong'); setOtp(''); } };
  const L = (['en', 'hi', 'mr'] as const).find((x) => lang.startsWith(x)) ?? 'en';
  const addTime = useMemo(() => v.requests, [v.requests]);
  return (
    <>
      <Card className="mb-3"><DocumentBody v={v} t={t} lang={lang} /></Card>

      <Card className="mb-3">
        <div className="stack gap-2" data-ask>
          <strong className="t-md">{t(K.applicant.askHeading)}</strong>
          <p className="t-sm">{t(K.applicant.askBody)}</p>
          {addTime.map((r) => <p key={r.id} className="t-sm" data-request>“{r.text}”{r.response ? <> — <strong>{r.response.outcome === 'approved' ? t(K.applicant.askAnswered) : t(K.applicant.askAnswered)}</strong>: “{r.response.note}”</> : <> — <em>{t(K.applicant.askWaiting)}</em></>}</p>)}
          {!openRequest && (
            <>
              <Field label={t(K.applicant.askLabel)} hint={t(K.applicant.askHint, { min: REQUEST_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={ask} onChange={(e) => setAsk(e.target.value)} data-f="ask" />}</Field>
              <Button variant="secondary" style={{ width: 'fit-content' }} data-ask-send disabled={letters(ask) < REQUEST_MIN || s.busy} onClick={async () => { const r = await s.askChange(ask); if (r.ok) { setAsk(''); setError(null); } else setError(r.code ?? 'generic'); }}>{t(K.applicant.askSend)}</Button>
            </>
          )}
        </div>
      </Card>

      <Card className="mb-3">
        <div className="stack gap-4" data-sign>
          <div className="stack gap-1"><strong className="t-md">{t(K.applicant.signHeading)}</strong><p className="t-sm">{t(K.applicant.signBody)}</p></div>
          <Checkbox checked={consent} onChange={setConsent} label={<span className="t-sm">{t(K.applicant.consent)}</span>} />
          <div className="stack gap-2" data-otp data-phase={phase}>
            <strong className="t-sm">{t(K.applicant.otpHeading)}</strong>
            {phase === 'verified' ? <p className="t-sm t-success"><CheckCircle size={16} weight="fill" aria-hidden="true" /> {fallback ? t(K.applicant.otpFallbackNote) : t(K.applicant.otpVerified)}</p> : (
              <>
                <p className="t-sm">{t(K.applicant.otpBody)}</p>
                <OtpInput value={otp} onChange={(x) => setOtp(x.replace(/\D/g, '').slice(0, OTP_LENGTH))} label={t(K.applicant.otpLabel)} invalid={phase === 'wrong'} />
                {phase === 'wrong' && <p className="t-xs t-error" role="alert">{t(K.applicant.otpWrong)}</p>}
                <div className="row gap-2 wrap"><Button variant="secondary" data-otp-verify disabled={otp.length < OTP_LENGTH} onClick={verify}>{t(K.applicant.otpVerify)}</Button>{wrong >= WRONG_BEFORE_FALLBACK && <Button variant="ghost" data-otp-fallback onClick={() => { setFallback(true); setPhase('verified'); }}>{t(K.applicant.otpFallback)}</Button>}</div>
              </>
            )}
          </div>
          <Field label={t(K.applicant.nameLabel)} hint={t(K.applicant.nameHint)}>{(p) => <Input id={p.id} value={name} onChange={(e) => setName(e.target.value)} data-f="name" />}</Field>
          <div className="row gap-2" role="group"><span data-method="drawn"><Chip pressed={method === 'drawn'} onClick={() => setMethod('drawn')}>{t(K.applicant.methodDrawn)}</Chip></span><span data-method="typed"><Chip pressed={method === 'typed'} onClick={() => setMethod('typed')}>{t(K.applicant.methodTyped)}</Chip></span></div>
          {method === 'drawn' ? <div className="stack gap-1"><span className="t-sm">{t(K.applicant.drawLabel)}</span><SignaturePad value={drawn} onChange={setDrawn} clearLabel={t(K.applicant.clear)} /></div> : <Field label={t(K.applicant.typedLabel)}>{(p) => <Input id={p.id} value={typed} onChange={(e) => setTyped(e.target.value)} data-f="typed" />}</Field>}
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
        </div>
      </Card>
      <ActionBar>
        <div className="stack gap-1" style={{ width: '100%' }}>
          {openRequest && <p className="t-xs t-muted">{t(K.applicant.waitingToSign)}</p>}
          <Button style={{ width: '100%' }} data-sign-submit disabled={!ready || s.busy} onClick={async () => { const r = await s.sign({ method, data, signerName: name, language: L, consentGiven: consent, otpVerified: phase === 'verified', viaFallback: fallback }); setError(r.ok ? null : r.code ?? 'generic'); }}>{s.busy ? t(K.applicant.signing) : t(K.applicant.sign)}</Button>
        </div>
      </ActionBar>
    </>
  );
}

function Signed({ s, v, t, lang }: { s: AgreementState; v: OfferApplicantView; t: T; lang: string }) {
  const a = v.activation;
  return (
    <>
      <Card className="mb-3">
        <div className="stack gap-3" data-signed>
          <div className="row gap-2" style={{ alignItems: 'center' }}><SealCheck size={28} weight="fill" aria-hidden="true" color="var(--color-success)" /><strong className="t-md">{t(K.applicant.doneHeading)}</strong></div>
          <p className="t-sm">{t(K.applicant.doneBody)}</p>
          {a && <Badge tone={a.capability === 'full' ? 'success' : 'warning'} dot>{t(a.capability === 'full' ? K.applicant.capabilityFull : K.applicant.capabilityBasic)}</Badge>}
          {a && Object.keys(a.steps).length > 0 && (
            <div className="stack gap-1" data-steps>
              <strong className="t-sm">{t(K.applicant.stepsHeading)}</strong>
              <p className="t-xs t-muted">{t(K.applicant.stepsBody)}</p>
              {Object.entries(a.steps).map(([k, st]) => <span key={k} className="t-sm" data-step={k} data-done={st.done ? 1 : 0}>{st.done ? '✓ ' : '○ '}{t(K.detail.step[k as 'bank' | 'photo'])}</span>)}
            </div>
          )}
          <div className="row gap-2 wrap"><Button data-sign-in onClick={() => s.goto('/login')}>{t(K.applicant.signIn)}</Button><Button variant="secondary" data-download onClick={() => download(v, t)}>{t(K.doc.download)}</Button></div>
        </div>
      </Card>
      <Card className="mb-3"><DocumentBody v={v} t={t} lang={lang} /></Card>
      {v.signature && <p className="t-xs t-muted" data-signature>{t(K.doc.signedBy, { name: v.signature.signerName, date: formatDateTime(v.signature.at, lang) })}</p>}
    </>
  );
}
