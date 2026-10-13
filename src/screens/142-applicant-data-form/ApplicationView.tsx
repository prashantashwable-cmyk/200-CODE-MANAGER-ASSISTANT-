import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Plus, Trash, UsersThree } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Select, TextArea, formatDate, formatDateTime } from '@/design-system';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { isValidAadhaar, isValidGstin, isValidPan } from '@/features/onboarding/validators';
import { DAYS, HOURS, LANGUAGES, REFERENCES_MAX, SECTIONS, SUMMARY_MIN, SUPPLIER_CATEGORIES, SURVEYOR_SECTORS, TECHNICIAN_SKILLS, TIMES, TRAVEL, YEARS, maskId } from '@/features/recruitment/application';
import type { SectionId } from '@/features/recruitment/application';
import { isMobile } from '@/features/recruitment/interest';
import type { PartnerApplicationView } from '@/data/repository';
import type { ApplicationForm, ApplicationReference } from '@/data/types';
import { useApplication } from './useApplication';
import type { ApplicationState } from './useApplication';
import { APPLICATION_KEYS as K, OUTCOMES, STATUSES, detailPath, boardPath, screeningPath } from './application.types';

type T = ReturnType<typeof useTranslation>['t'];
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const LANG_LABEL: Record<(typeof LANGUAGES)[number], string> = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const statusTone = (st: PartnerApplicationView['status']) => (st === 'submitted' || st === 'approved' ? 'success' : st === 'info_requested' ? 'warning' : st === 'draft' ? 'accent' : 'neutral') as 'success' | 'warning' | 'accent' | 'neutral';
const toggle = <X,>(list: X[], x: X): X[] => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

/**
 * Screen 142 — Applicant Data Collection Form. A form with one section per kind of thing asked, a progress rail, a draft that saves as the person
 * types, and nothing that blocks on someone else: an unreachable reference is carried as outstanding, never a stop. The same screen gives Admin
 * the board of applications and, for each, what was given and what is still open.
 */
export function ApplicationScreen() {
  const { t } = useTranslation();
  const s = useApplication();
  const shell = (body: JSX.Element) => (s.admin ? <Screen width="narrow"><ScreenHeader title={t(K.admin.title)} />{body}</Screen> : <div className="ds-screen ds-screen--narrow"><Header t={t} s={s} />{body}</div>);
  if (s.status === 'invalid') return shell(<EmptyState icon={<UsersThree size={28} />} title={t(K.invalid.title)} body={t(K.invalid.body)} actionLabel={t(K.invalid.action)} onAction={() => s.goto('/join')} />);
  if (s.status === 'not_found') return shell(<EmptyState icon={<UsersThree size={28} />} title={t(K.invalid.title)} body={t(K.invalid.body)} actionLabel={s.admin ? t(K.admin.detail.back) : t(K.invalid.action)} onAction={() => s.goto(s.admin ? boardPath : '/join')} />);
  if (s.status === 'loading' && !s.view && !s.board) return shell(<LoadingState label={t(K.loading)} variant="list" rows={4} />);
  if (s.status === 'error' || (!s.view && !s.board)) return shell(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  if (s.admin) return s.applicationId && s.view ? <AdminDetail s={s} v={s.view} t={t} /> : <AdminBoard s={s} t={t} />;
  return s.view ? <Applicant s={s} v={s.view} t={t} /> : null;
}

function Header({ t, s }: { t: T; s: ApplicationState }) {
  const { i18n } = useTranslation();
  return (
    <header className="stack gap-2 mb-3" style={{ alignItems: 'center', textAlign: 'center' }}>
      <span className="t-xs t-muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t(K.brand)}</span>
      <div className="row gap-2 wrap" role="group" aria-label={t(K.language)} style={{ justifyContent: 'center' }}>
        {LANGUAGES.map((l) => <span key={l} data-lang={l}><Chip pressed={i18n.language.startsWith(l)} onClick={() => s.setLanguage(l)}>{LANG_LABEL[l]}</Chip></span>)}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ the applicant's form */

function Applicant({ s, v, t }: { s: ApplicationState; v: PartnerApplicationView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const f = s.form;
  const [error, setError] = useState<string | null>(null);
  const progressDone = s.states.filter((x) => x.required && x.complete).length;
  const required = s.states.filter((x) => x.required).length;
  const canSubmit = s.states.filter((x) => x.required).every((x) => x.complete);
  const submitted = v.status === 'submitted' && !s.dirty;
  const state = (id: SectionId) => s.states.find((x) => x.id === id);
  const go = (id: SectionId) => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const saveText = s.saveState === 'saving' ? K.progress.saving : s.saveState === 'offline' ? K.progress.offline : s.saveState === 'failed' ? K.progress.failed : K.progress.saved;

  if (s.justSubmitted) return <Submitted s={s} v={v} t={t} />;
  return (
    <div className="ds-screen ds-screen--narrow pb-action-bar">
      <Header t={t} s={s} />
      <ScreenHeader title={t(K.title)} subtitle={`${v.code} · ${t(K.admin.role[v.role])}`} action={<span data-status={v.status}><Badge tone={statusTone(v.status)} dot>{t(K.status[v.status])}</Badge></span>} />
      <Notes t={t} v={v} lang={lang} go={go} onInterview={() => s.goto(`/interview/${v.id}`)} onAgreement={() => s.goto(`/agreement/${v.id}`)} />

      <Card className="mb-3">
        <div className="stack gap-2" data-progress>
          <strong className="t-md">{t(K.progress.heading)}</strong>
          <ProgressBar value={required ? progressDone / required : 0} label={t(K.progress.line, { done: progressDone, total: required })} tone={canSubmit ? 'success' : 'accent'} />
          <p className="t-sm" data-progress-line>{t(K.progress.line, { done: progressDone, total: required })}</p>
          <div style={{ overflowX: 'auto' }} data-rail>
            <AscensionLine
              orientation="horizontal"
              steps={SECTIONS.map((id) => ({ id, label: t(K.section.title[id]), status: state(id)?.complete ? 'complete' : 'upcoming', onClick: () => go(id) }))}
            />
          </div>
          <p className="t-xs t-muted" role="status" data-save={s.saveState}>{s.locked ? t(K.progress.locked) : t(saveText)}</p>
          {s.restored && <p className="t-xs t-muted" data-restored>{t(K.progress.restored)}</p>}
        </div>
      </Card>

      <Personal s={s} v={v} t={t} f={f} state={state('personal')} />
      <Experience s={s} v={v} t={t} f={f} state={state('experience')} />
      <Territory s={s} v={v} t={t} f={f} state={state('territory')} />
      <Availability s={s} t={t} f={f} state={state('availability')} />
      <References s={s} t={t} f={f} state={state('references')} lang={lang} />
      <Identity s={s} v={v} t={t} f={f} state={state('identity')} />

      {!s.locked && (
        <ActionBar>
          <div className="stack gap-1" style={{ width: '100%' }}>
            {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
            {!canSubmit && <p className="t-xs t-muted">{t(K.submit.waiting)}</p>}
            <Button style={{ width: '100%' }} disabled={!canSubmit || s.busy || (submitted && !s.dirty)} data-submit onClick={async () => { const r = await s.submit(); setError(r.ok ? null : (r.code ?? 'generic')); }}>{t(v.status === 'submitted' || v.status === 'info_requested' ? K.submit.resubmit : K.submit.button)}</Button>
          </div>
        </ActionBar>
      )}
      {v.submittedAt && <p className="t-xs t-muted" data-submitted-at>{t(K.done.body)} · {formatDate(v.submittedAt, lang)}</p>}
    </div>
  );
}

interface SectionProps {
  s: ApplicationState;
  t: T;
  f: ApplicationForm;
  state: ReturnType<ApplicationState['states']['find']>;
}

function Section({ id, t, state, children }: { id: SectionId; t: T; state: SectionProps['state']; children: React.ReactNode }) {
  const done = !!state?.complete;
  return (
    <Card className="mb-3">
      <div id={`sec-${id}`} className="stack gap-3" data-section={id} data-complete={done ? 1 : 0} style={{ scrollMarginTop: 'var(--shell-top-height, 16px)' }}>
        <div className="stack gap-1" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 'var(--space-2)' }}>
          <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong className="t-md">{t(K.section.title[id])}</strong>
            <Badge tone={done ? 'success' : state?.required ? 'neutral' : 'accent'} dot>{t(done ? K.section.done : state?.required ? K.section.pending : K.section.optional)}</Badge>
          </div>
          <p className="t-xs t-muted">{t(K.section.intro[id])}</p>
        </div>
        {children}
        {state && !state.complete && state.missing.length > 0 && (
          <ul className="stack gap-1" data-missing style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
            {state.missing.map((m) => <li key={m} className="t-xs t-muted">{t(K.missing[m as keyof typeof K.missing])}</li>)}
          </ul>
        )}
      </div>
    </Card>
  );
}

const ok = (label: string) => <p className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}><CheckCircle size={14} weight="fill" aria-hidden="true" /> {label}</p>;

function Personal({ s, v, t, f, state }: SectionProps & { v: PartnerApplicationView }) {
  const p = f.personal;
  const dis = s.locked;
  return (
    <Section id="personal" t={t} state={state}>
      <Field label={t(K.field.name)}>{({ id }) => <Input id={id} autoComplete="name" disabled={dis} value={p.fullName} onChange={(e) => s.update('personal', { fullName: e.target.value })} data-f="name" />}</Field>
      <Field label={t(K.field.phone)} hint={t(K.field.phoneLocked)}>{({ id }) => <Input id={id} value={p.phone} disabled readOnly data-f="phone" />}</Field>
      {isMobile(p.phone) && ok(t(K.identity.valid))}
      <Field label={t(K.field.city)}>{({ id }) => <Input id={id} disabled={dis} value={p.city} onChange={(e) => s.update('personal', { city: e.target.value })} data-f="city" />}</Field>
      <Field label={t(K.field.address)}>{({ id }) => <Input id={id} disabled={dis} value={p.address} onChange={(e) => s.update('personal', { address: e.target.value })} />}</Field>
      <Field label={t(K.field.dob)} hint={t(K.field.dobHint)}>{({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="date" disabled={dis} max={new Date().toISOString().slice(0, 10)} value={p.dob} onChange={(e) => s.update('personal', { dob: e.target.value })} data-f="dob" />}</Field>
      <div className="stack gap-1">
        <span className="t-xs t-muted">{t(K.field.languages)}</span>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.field.languages)}>
          {LANGUAGES.map((l) => <span key={l} data-lang-pick={l}><Chip pressed={p.languages.includes(l)} onClick={() => !dis && s.update('personal', { languages: toggle(p.languages, l) })}>{LANG_LABEL[l]}</Chip></span>)}
        </div>
      </div>
      <span hidden>{v.id}</span>
    </Section>
  );
}

function Experience({ s, v, t, f, state }: SectionProps & { v: PartnerApplicationView }) {
  const e = f.experience;
  const dis = s.locked;
  const choices = v.role === 'surveyor' ? [...SURVEYOR_SECTORS] : v.role === 'technician' ? [...TECHNICIAN_SKILLS] : [...SUPPLIER_CATEGORIES];
  const key: 'sectors' | 'skills' = v.role === 'surveyor' ? 'sectors' : 'skills';
  const label = (c: string) => (v.role === 'surveyor' ? t(K.field.sector[c as keyof typeof K.field.sector]) : v.role === 'technician' ? t(`onbTechnician.skill.name.${c}`) : t(`partCategory.${c}`));
  const words = letters(e.summary);
  return (
    <Section id="experience" t={t} state={state}>
      <Field label={t(K.field.years)}>
        {({ id }) => (
          <Select id={id} disabled={dis} value={e.years} onChange={(x) => s.update('experience', { years: x.target.value })} data-f="years">
            <option value="">—</option>
            {YEARS.map((y) => <option key={y} value={y}>{t(K.field.year[y])}</option>)}
          </Select>
        )}
      </Field>
      <div className="stack gap-1">
        <span className="t-xs t-muted">{t(v.role === 'surveyor' ? K.field.sectors : v.role === 'technician' ? K.field.skills : K.field.categories)}</span>
        <div className="row gap-2 wrap" role="group">
          {choices.map((c) => <span key={c} data-choice={c}><Chip pressed={e[key].includes(c)} onClick={() => !dis && s.update('experience', { [key]: toggle(e[key], c) } as never)}>{label(c)}</Chip></span>)}
        </div>
      </div>
      <Field label={t(K.field.summary)} hint={t(K.field.summaryHint, { count: SUMMARY_MIN })}>
        {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} disabled={dis} value={e.summary} onChange={(x) => s.update('experience', { summary: x.target.value })} data-f="summary" />}
      </Field>
      {words >= SUMMARY_MIN && ok(t(K.field.summaryOk))}
    </Section>
  );
}

function Territory({ s, v, t, f, state }: SectionProps & { v: PartnerApplicationView }) {
  const a = f.territory;
  const dis = s.locked;
  return (
    <Section id="territory" t={t} state={state}>
      <div className="stack gap-1" data-zones>
        <span className="t-xs t-muted">{t(K.field.zones)}</span>
        {v.zones.length === 0 ? <p className="t-sm">{t(K.field.zonesNone)}</p> : (
          <div className="row gap-2 wrap" role="group" aria-label={t(K.field.zones)}>
            {v.zones.map((z) => <span key={z.id} data-zone={z.id}><Chip pressed={a.zoneIds.includes(z.id)} onClick={() => !dis && s.update('territory', { zoneIds: toggle(a.zoneIds, z.id) })}>{z.name}</Chip></span>)}
          </div>
        )}
        <p className="t-xs t-muted">{t(K.field.zonesHint)}</p>
      </div>
      <Field label={t(K.field.travel)}>
        {({ id }) => (
          <Select id={id} disabled={dis} value={a.travelKm} onChange={(x) => s.update('territory', { travelKm: x.target.value })}>
            <option value="">—</option>
            {TRAVEL.map((k) => <option key={k} value={k}>{t(K.field.travelOption, { km: k })}</option>)}
          </Select>
        )}
      </Field>
      <Checkbox checked={a.ownTransport} disabled={dis} onChange={(on) => s.update('territory', { ownTransport: on })} label={<span className="t-sm">{t(K.field.ownTransport)}</span>} />
    </Section>
  );
}

function Availability({ s, t, f, state }: Omit<SectionProps, 'v'>) {
  const a = f.availability;
  const dis = s.locked;
  return (
    <Section id="availability" t={t} state={state}>
      <div className="stack gap-1">
        <span className="t-xs t-muted">{t(K.field.days)}</span>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.field.days)}>
          {DAYS.map((d) => <span key={d} data-day={d}><Chip pressed={a.days.includes(d)} onClick={() => !dis && s.update('availability', { days: toggle(a.days, d) })}>{t(K.field.day[d])}</Chip></span>)}
        </div>
      </div>
      <div className="stack gap-1">
        <span className="t-xs t-muted">{t(K.field.time)}</span>
        <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.field.time)}>
          {TIMES.map((x) => <span key={x} data-time={x}><Chip pressed={a.timeOfDay === x} onClick={() => !dis && s.update('availability', { timeOfDay: x })}>{t(K.field.timeOption[x])}</Chip></span>)}
        </div>
      </div>
      <Field label={t(K.field.hours)}>
        {({ id }) => (
          <Select id={id} disabled={dis} value={a.hoursPerWeek} onChange={(x) => s.update('availability', { hoursPerWeek: x.target.value })} data-f="hours">
            <option value="">—</option>
            {HOURS.map((h) => <option key={h} value={h}>{t(K.field.hoursOption, { hours: h })}</option>)}
          </Select>
        )}
      </Field>
      <Field label={t(K.field.start)} hint={t(K.field.startHint)}>
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="date" disabled={dis} min={new Date().toISOString().slice(0, 10)} value={a.earliestStart} onChange={(x) => s.update('availability', { earliestStart: x.target.value })} data-f="start" />}
      </Field>
    </Section>
  );
}

function References({ s, t, f, state, lang }: Omit<SectionProps, 'v'> & { lang: string }) {
  const dis = s.locked;
  const refs = f.references;
  const set = (i: number, patch: Partial<ApplicationReference>) => s.update('references', refs.map((r, j) => (j === i ? { ...r, ...patch } : r)) as never);
  return (
    <Section id="references" t={t} state={state}>
      {refs.map((r, i) => (
        <div key={r.id} className="stack gap-2" data-ref={i} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong className="t-sm">{t(K.references.count, { n: i + 1 })}</strong>
            {!dis && <Button variant="ghost" icon={<Trash size={16} aria-hidden="true" />} onClick={() => s.update('references', refs.filter((_, j) => j !== i) as never)}>{t(K.references.remove)}</Button>}
          </div>
          <Field label={t(K.references.name)}>{({ id }) => <Input id={id} disabled={dis} value={r.name} onChange={(e) => set(i, { name: e.target.value })} data-ref-name />}</Field>
          <Field label={t(K.references.phone)}>{({ id }) => <Input id={id} inputMode="tel" disabled={dis} value={r.phone} onChange={(e) => set(i, { phone: e.target.value.replace(/[^\d+ ]/g, '') })} data-ref-phone />}</Field>
          {isMobile(r.phone) && ok(t(K.identity.valid))}
          <Field label={t(K.references.relationship)}>{({ id }) => <Input id={id} disabled={dis} value={r.relationship} onChange={(e) => set(i, { relationship: e.target.value })} />}</Field>
          <Field label={t(K.references.organisation)}>{({ id }) => <Input id={id} disabled={dis} value={r.organisation} onChange={(e) => set(i, { organisation: e.target.value })} />}</Field>
          {r.outcome?.status === 'unreachable' && <p className="t-xs t-muted">{t(K.references.unreachableNote)} · {formatDate(r.outcome.at, lang)}</p>}
        </div>
      ))}
      {!dis && refs.length < REFERENCES_MAX && <Button variant="secondary" style={{ width: 'fit-content' }} icon={<Plus size={16} aria-hidden="true" />} data-ref-add onClick={() => s.update('references', [...refs, { id: `n${Date.now()}${refs.length}`, name: '', phone: '', relationship: '', organisation: '' }] as never)}>{t(K.references.add)}</Button>}
      {refs.length >= REFERENCES_MAX && <p className="t-xs t-muted">{t(K.references.max, { count: REFERENCES_MAX })}</p>}
      {refs.length === 0 && (
        <div className="stack gap-1" data-no-refs>
          <Checkbox checked={f.noReferences} disabled={dis} onChange={(on) => s.update('noReferences', on as never)} label={<span className="t-sm">{t(K.references.none)}</span>} />
          {f.noReferences && <p className="t-xs t-muted">{t(K.references.noneNote)}</p>}
        </div>
      )}
    </Section>
  );
}

function Identity({ s, v, t, f, state }: SectionProps & { v: PartnerApplicationView }) {
  const i = f.identity;
  const dis = s.locked;
  const supplier = v.role === 'supplier';
  return (
    <Section id="identity" t={t} state={state}>
      <p className="t-xs t-muted">{t(supplier ? K.identity.firmIntro : K.identity.personIntro)}</p>
      {supplier ? (
        <>
          <Field label={t(K.identity.gstin)}>{({ id }) => <Input id={id} disabled={dis} value={i.gstin} maxLength={15} onChange={(e) => s.update('identity', { gstin: e.target.value.toUpperCase() })} data-f="gstin" />}</Field>
          {isValidGstin(i.gstin) && ok(t(K.identity.valid))}
          <DocumentSlot label={t(K.identity.gstDoc)} value={i.gstDoc} onChange={(d) => !dis && s.update('identity', { gstDoc: d })} />
        </>
      ) : (
        <>
          <Field label={t(K.identity.aadhaar)}>{({ id }) => <Input id={id} inputMode="numeric" disabled={dis} value={i.aadhaarNumber} maxLength={14} onChange={(e) => s.update('identity', { aadhaarNumber: e.target.value.replace(/[^\d ]/g, '') })} data-f="aadhaar" />}</Field>
          {isValidAadhaar(i.aadhaarNumber) && ok(t(K.identity.valid))}
          {!i.aadhaarNumber && i.aadhaarChecked && i.aadhaarLast4 && <p className="t-xs t-muted">{t(K.identity.aadhaarOnFile, { last4: i.aadhaarLast4 })}</p>}
          <DocumentSlot label={t(K.identity.aadhaarDoc)} value={i.aadhaarDoc} onChange={(d) => !dis && s.update('identity', { aadhaarDoc: d })} />
          <p className="t-xs t-muted" style={{ textAlign: 'center' }}>{t(K.identity.or)}</p>
          <Field label={t(K.identity.pan)}>{({ id }) => <Input id={id} disabled={dis} value={i.panNumber} maxLength={10} onChange={(e) => s.update('identity', { panNumber: e.target.value.toUpperCase() })} data-f="pan" />}</Field>
          {isValidPan(i.panNumber) && ok(t(K.identity.valid))}
          <DocumentSlot label={t(K.identity.panDoc)} value={i.panDoc} onChange={(d) => !dis && s.update('identity', { panDoc: d })} />
        </>
      )}
      <p className="t-xs t-muted">{t(K.identity.later)}</p>
    </Section>
  );
}

/** What AIEC has said to this person, and, while it is open, what was asked for. Worded in the reader's language when it is read. */
/** A message's wording is a key; a time or a way of talking in it is filled in here, in the reader's language. */
const messageParams = (t: T, m: PartnerApplicationView['messages'][number], lang: string): Record<string, string> => ({ ...m.params, ...(m.params.at ? { when: formatDateTime(m.params.at, lang) } : {}), ...(m.params.mode ? { mode: t(`interview.mode.${m.params.mode}`) } : {}) });

function Notes({ t, v, lang, go, onInterview, onAgreement }: { t: T; v: PartnerApplicationView; lang: string; go: (id: SectionId) => void; onInterview: () => void; onAgreement: () => void }) {
  const messages = [...v.messages].reverse();
  const iv = v.interview;
  return (
    <>
      {v.infoRequest && (
        <Card className="mb-3">
          <div className="stack gap-2" data-info-request style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
            <strong className="t-md">{t(K.request.heading)}</strong>
            <p className="t-sm">{t(K.request.body)}</p>
            <p className="t-sm" data-info-note>“{v.infoRequest.note}”</p>
            <div className="row gap-2 wrap">
              {v.infoRequest.sections.map((id) => <span key={id} data-ask={id}><Chip onClick={() => go(id as SectionId)}>{t(K.section.title[id as SectionId])}</Chip></span>)}
            </div>
          </div>
        </Card>
      )}
      {v.offer && (
        <Card className="mb-3">
          <div className="stack gap-2" data-offer-card={v.offer.status}>
            <strong className="t-md">{v.offer.status === 'sent' ? t('agreement.applicant.signHeading') : t('agreement.applicant.doneHeading')}</strong>
            <Button style={{ width: 'fit-content' }} data-open-agreement onClick={onAgreement}>{t('agreement.applicant.heading')}</Button>
          </div>
        </Card>
      )}
      {iv && (iv.canSelfServe || iv.slot) && (
        <Card className="mb-3">
          <div className="stack gap-2" data-interview-card={iv.phase}>
            <strong className="t-md">{iv.slot ? t('interview.applicant.confirmedHeading') : t('interview.applicant.chooseHeading')}</strong>
            {iv.slot && <p className="t-sm">{formatDateTime(iv.slot.start, lang)} · {t(`interview.mode.${iv.slot.mode}`)}</p>}
            <Button style={{ width: 'fit-content' }} data-open-interview onClick={onInterview}>{iv.slot ? t('interview.applicant.heading') : t('interview.applicant.pickDay')}</Button>
          </div>
        </Card>
      )}
      {messages.length > 0 && (
        <Card className="mb-3">
          <div className="stack gap-3" data-messages>
            <strong className="t-md">{t(K.messages.heading)}</strong>
            {messages.map((m) => (
              <div key={m.id} className="stack gap-1" data-message={m.kind}>
                <p className="t-sm">{t(m.templateKey, messageParams(t, m, lang))}</p>
                {m.note && <p className="t-sm t-muted">“{m.note}”</p>}
                <span className="t-xs t-muted">{formatDateTime(m.at, lang)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function Submitted({ s, v, t }: { s: ApplicationState; v: PartnerApplicationView; t: T }) {
  const open = v.outstanding.length;
  return (
    <div className="ds-screen ds-screen--narrow">
      <Header t={t} s={s} />
      <Card>
        <div className="stack gap-3" data-submitted>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <CheckCircle size={26} weight="fill" aria-hidden="true" color="var(--color-success)" />
            <strong className="t-md">{t(K.done.heading)}</strong>
          </div>
          <p className="t-sm">{t(K.done.body)}</p>
          {open > 0 && <p className="t-xs t-muted" data-outstanding-note>{t(K.done.outstanding)}</p>}
          <p className="t-xs t-muted">{t(K.done.next)}</p>
          <Button variant="secondary" style={{ width: 'fit-content' }} data-edit onClick={s.editAgain}>{t(K.done.edit)}</Button>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ Admin: the board */

function AdminBoard({ s, t }: { s: ApplicationState; t: T }) {
  const { i18n } = useTranslation();
  const [filter, setFilter] = useState<'all' | (typeof STATUSES)[number]>('all');
  const b = s.board!;
  const rows = b.rows.filter((r) => filter === 'all' || r.status === filter);
  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.admin.title)} subtitle={t(K.admin.board.heading)} />
      <Card className="mb-3">
        <div className="row gap-4 wrap" data-counts>
          <span className="stack"><strong className="num t-lg">{b.counts.submitted}</strong><span className="t-xs t-muted">{t(K.admin.board.submitted)}</span></span>
          <span className="stack"><strong className="num t-lg">{b.counts.draft}</strong><span className="t-xs t-muted">{t(K.admin.board.draft)}</span></span>
          <span className="stack"><strong className="num t-lg">{b.counts.outstanding}</strong><span className="t-xs t-muted">{t(K.admin.board.outstanding)}</span></span>
        </div>
      </Card>
      <div className="row gap-2 wrap mb-3" role="group">
        {(['all', ...STATUSES] as const).map((x) => <span key={x} data-filter={x}><Chip pressed={filter === x} onClick={() => setFilter(x)}>{x === 'all' ? t(K.admin.board.filterAll) : t(K.status[x])}</Chip></span>)}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<UsersThree size={32} />} title={t(K.admin.board.emptyTitle)} body={t(K.admin.board.emptyBody)} />
      ) : (
        <Card>
          <div className="stack">
            {rows.map((r) => (
              <button key={r.id} type="button" data-app={r.id} onClick={() => s.goto(detailPath(r.id))} className="row gap-3" style={{ minHeight: 64, alignItems: 'center', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2) 0', cursor: 'pointer', color: 'inherit' }}>
                <span className="stack" style={{ flex: 1 }}>
                  <strong className="t-sm">{r.name}</strong>
                  <span className="t-xs t-muted">{t(K.admin.role[r.role])} · {t(K.admin.detail.channel[r.channel])} · {formatDate(r.submittedAt ?? r.updatedAt, i18n.language)}</span>
                  <span className="t-xs">{t(K.admin.board.row, { percent: r.percent, open: r.outstanding })}</span>
                </span>
                <Badge tone={statusTone(r.status)} dot>{t(K.status[r.status])}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ Admin: one application */

function AdminDetail({ s, v, t }: { s: ApplicationState; v: PartnerApplicationView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const f = v.form;
  const dl = (rows: [string, string][]) => (
    <dl className="stack gap-2" style={{ margin: 0 }}>
      {rows.filter(([, x]) => x).map(([label, val]) => (
        <div key={label} className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <dt className="t-xs t-muted">{label}</dt>
          <dd className="t-sm" style={{ margin: 0, textAlign: 'right' }}>{val}</dd>
        </div>
      ))}
    </dl>
  );
  const choiceLabel = (c: string) => (v.role === 'surveyor' ? t(K.field.sector[c as keyof typeof K.field.sector]) : v.role === 'technician' ? t(`onbTechnician.skill.name.${c}`) : t(`partCategory.${c}`));
  const zoneName = (id: string) => v.zones.find((z) => z.id === id)?.name ?? id;
  const sec = (id: SectionId) => v.sections.find((x) => x.id === id);
  return (
    <Screen width="narrow">
      <ScreenHeader title={f.personal.fullName || t(K.admin.title)} subtitle={`${v.code} · ${t(K.admin.role[v.role])}`} action={<span data-status={v.status}><Badge tone={statusTone(v.status)} dot>{t(K.status[v.status])}</Badge></span>} />
      <div className="row gap-2 wrap mb-3">
        <Button variant="ghost" style={{ width: 'fit-content' }} data-back onClick={() => s.goto(boardPath)}>{t(K.admin.detail.back)}</Button>
        <Button variant="secondary" style={{ width: 'fit-content' }} data-open-screening onClick={() => s.goto(screeningPath(v.id))}>{t(K.admin.detail.screening)}</Button>
      </div>

      <Card className="mb-3">
        <div className="stack gap-2" data-outstanding>
          <strong className="t-md">{t(K.admin.detail.outstanding)}</strong>
          {v.outstanding.length === 0 ? <p className="t-sm">{t(K.admin.detail.nothingOutstanding)}</p> : v.outstanding.map((o, i) => <p key={i} className="t-sm" data-open={o.kind}>{t(K.admin.outstanding[o.kind])}{o.name ? ` · ${o.name}` : ''}</p>)}
          <p className="t-xs t-muted">{t(K.admin.detail.source, { channel: t(K.admin.detail.channel[v.source.channel]), campaign: v.source.campaign ?? '—', date: formatDate(v.interestedAt, lang) })}</p>
          <div className="stack gap-1"><span className="t-xs t-muted">{t(K.progress.line, { done: v.progress.done, total: v.progress.total })}</span><ProgressBar value={v.progress.percent / 100} label={t(K.progress.line, { done: v.progress.done, total: v.progress.total })} tone={v.canSubmit ? 'success' : 'accent'} /></div>
        </div>
      </Card>

      {SECTIONS.filter((id) => id !== 'references').map((id) => (
        <Card key={id} className="mb-3">
          <div className="stack gap-2" data-section={id}>
            <div className="row gap-2" style={{ justifyContent: 'space-between' }}><strong className="t-md">{t(K.section.title[id])}</strong>{sec(id)?.complete ? <Badge tone="success" dot>{t(K.section.done)}</Badge> : <Badge tone="neutral" dot>{t(K.section.pending)}</Badge>}</div>
            {id === 'personal' && dl([[t(K.field.name), f.personal.fullName], [t(K.field.phone), f.personal.phone], [t(K.field.city), f.personal.city], [t(K.field.address), f.personal.address], [t(K.field.dob), f.personal.dob ? formatDate(`${f.personal.dob}T12:00:00Z`, lang) : ''], [t(K.field.languages), f.personal.languages.map((l) => LANG_LABEL[l]).join(', ')]])}
            {id === 'experience' && dl([[t(K.field.years), f.experience.years ? t(K.field.year[f.experience.years as keyof typeof K.field.year]) : ''], [t(v.role === 'surveyor' ? K.field.sectors : v.role === 'technician' ? K.field.skills : K.field.categories), (v.role === 'surveyor' ? f.experience.sectors : f.experience.skills).map(choiceLabel).join(', ')], [t(K.field.summary), f.experience.summary]])}
            {id === 'territory' && dl([[t(K.field.zones), f.territory.zoneIds.map(zoneName).join(', ')], [t(K.field.travel), f.territory.travelKm ? t(K.field.travelOption, { km: f.territory.travelKm }) : ''], [t(K.field.ownTransport), f.territory.ownTransport ? '✓' : '—']])}
            {id === 'availability' && dl([[t(K.field.days), f.availability.days.map((d) => t(K.field.day[d as keyof typeof K.field.day])).join(', ')], [t(K.field.time), f.availability.timeOfDay ? t(K.field.timeOption[f.availability.timeOfDay]) : ''], [t(K.field.hours), f.availability.hoursPerWeek ? t(K.field.hoursOption, { hours: f.availability.hoursPerWeek }) : ''], [t(K.field.start), f.availability.earliestStart ? formatDate(`${f.availability.earliestStart}T12:00:00Z`, lang) : '']])}
            {id === 'identity' && dl(v.role === 'supplier' ? [[t(K.identity.gstin), f.identity.gstin], [t(K.identity.gstDoc), f.identity.gstDoc ? t(K.admin.detail.docOnFile) : t(K.admin.detail.docMissing)]] : [[t(K.identity.aadhaar), f.identity.aadhaarLast4 ? `•••• •••• ${f.identity.aadhaarLast4}` : ''], [t(K.identity.aadhaarDoc), f.identity.aadhaarDoc ? t(K.admin.detail.docOnFile) : ''], [t(K.identity.pan), f.identity.panNumber ? maskId(f.identity.panNumber) : ''], [t(K.identity.panDoc), f.identity.panDoc ? t(K.admin.detail.docOnFile) : '']])}
            {sec(id) && !sec(id)?.complete && sec(id)!.missing.length > 0 && <p className="t-xs t-muted">{sec(id)!.missing.map((m) => t(K.missing[m as keyof typeof K.missing])).join(' · ')}</p>}
          </div>
        </Card>
      ))}

      <Card className="mb-3">
        <div className="stack gap-3" data-references>
          <strong className="t-md">{t(K.section.title.references)}</strong>
          {f.references.length === 0 ? <p className="t-sm">{f.noReferences ? t(K.references.noneNote) : t(K.admin.detail.empty)}</p> : f.references.map((r) => <Reference key={r.id} s={s} r={r} t={t} lang={lang} locked={v.status === 'withdrawn' || v.status === 'rejected'} />)}
        </div>
      </Card>

      <Card className="mb-3">
        <div className="stack gap-2" data-timeline>
          <strong className="t-md">{t(K.admin.detail.timeline)}</strong>
          {[...v.events].reverse().map((e) => <p key={e.id} className="t-xs t-muted">{formatDateTime(e.at, lang)} · {t(K.admin.detail.event[e.kind])}{e.note ? ` · ${e.note}` : ''}</p>)}
        </div>
      </Card>
    </Screen>
  );
}

function Reference({ s, r, t, lang, locked }: { s: ApplicationState; r: ApplicationReference; t: T; lang: string; locked: boolean }) {
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number] | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const needsNote = outcome !== '' && outcome !== 'verified';
  return (
    <div className="stack gap-2" data-reference={r.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
      <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stack"><strong className="t-sm">{r.name}</strong><span className="t-xs t-muted">{[r.relationship, r.organisation].filter(Boolean).join(' · ')}</span></span>
        <a href={`tel:${r.phone}`} className="t-sm num" data-call>{r.phone}</a>
      </div>
      {r.outcome ? (
        <p className="t-xs" data-outcome={r.outcome.status}><Badge tone={r.outcome.status === 'verified' ? 'success' : 'warning'} dot>{t(K.admin.outcome.label[r.outcome.status])}</Badge> {t(K.admin.outcome.by, { name: r.outcome.byName, date: formatDate(r.outcome.at, lang) })}{r.outcome.note ? ` · ${r.outcome.note}` : ''}</p>
      ) : (
        <p className="t-xs t-muted" data-open-ref>{t(K.admin.detail.notStarted)}</p>
      )}
      {!locked && (
        <>
          <p className="t-xs t-muted">{t(K.admin.outcome.callHint)}</p>
          <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.admin.outcome.heading)}>
            {OUTCOMES.map((o) => <span key={o} data-outcome-pick={o}><Chip pressed={outcome === o} onClick={() => setOutcome(o)}>{t(K.admin.outcome.label[o])}</Chip></span>)}
          </div>
          {needsNote && <Field label={t(K.admin.outcome.note)}>{({ id }) => <TextArea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-outcome-note />}</Field>}
          {error && <p className="t-xs t-error" role="alert">{t(problemKey(error))}</p>}
          <Button disabled={!outcome || s.busy || (needsNote && letters(note) < 8)} style={{ width: 'fit-content' }} data-outcome-save onClick={async () => { const x = await s.recordOutcome(r.id, outcome as (typeof OUTCOMES)[number], note); setError(x.ok ? null : (x.code ?? 'generic')); if (x.ok) { setOutcome(''); setNote(''); } }}>{t(K.admin.outcome.save)}</Button>
        </>
      )}
    </div>
  );
}

