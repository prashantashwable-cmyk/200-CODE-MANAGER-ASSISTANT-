import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Circle, ClipboardText, DotsThree, DownloadSimple, Lock, SealCheck, ShieldCheck, Warning } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, SegBar, Sheet, StatTile, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { ComplianceCertificateView, ComplianceView } from '@/data/repository';
import type { ComplianceStandard } from '@/data/types';
import { MAX_ADDITIONAL, REASON_MIN, STANDARD_NUMBER } from '@/features/qc/compliance';
import { useCompliance, EMPTY_STANDARDS } from './useCompliance';
import type { ComplianceState, StandardsForm } from './useCompliance';
import { ADDITIONAL_CHOICES, COMPLIANCE_KEYS as K, STANDARDS, TABS, assignmentPath, boardPath } from './compliance.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATE_TONE: Record<string, BadgeTone> = { not_checked: 'neutral', pass: 'success', fail: 'error', exception_pending: 'warning', exception_accepted: 'success' };
const SAFETY_TONE: Record<string, BadgeTone> = { not_tested: 'neutral', passed: 'success', failed: 'error', retest_due: 'warning', held: 'error', in_review: 'warning', overridden: 'warning' };

const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const stdName = (t: T, s: ComplianceStandard) => (s.id === 'other' ? (s.label ?? '') : `${STANDARD_NUMBER[s.id]} — ${t(K.standardDesc[s.id])}`);
const stdNumber = (s: ComplianceStandard) => (s.id === 'other' ? (s.label ?? '') : STANDARD_NUMBER[s.id]);

/**
 * Screen 134 — Compliance Certification. AIEC's own internal certificate that a checked installation is ready for the customer's government
 * inspection, the evidence package behind it, and the customer's next external step. It never presents itself as the licence to operate.
 * Locked once issued; a paperwork correction is a new version that voids the original.
 */
export function ComplianceScreen() {
  const { t } = useTranslation();
  const s = useCompliance();
  const wrap = (body: JSX.Element) => (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} />
      {body}
    </Screen>
  );
  if (!s.jobId) return wrap(<EmptyState icon={<ClipboardText size={28} />} title={t(K.noJob.title)} body={t(K.noJob.body)} actionLabel={t(K.noJob.action)} onAction={() => s.goto(boardPath)} />);
  if (s.status === 'not_found') return wrap(<EmptyState icon={<ClipboardText size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />);
  if (s.status === 'loading' && !s.view) return wrap(<LoadingState label={t(K.loading)} variant="cards" rows={3} />);
  if (s.status === 'error' || !s.view) return wrap(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  return <Detail s={s} v={s.view} t={t} />;
}

function Detail({ s, v, t }: { s: ComplianceState; v: ComplianceView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const admin = v.viewer === 'admin';
  const cur = v.current;
  const [sheet, setSheet] = useState<null | 'more' | 'issue' | 'reissue' | 'guidance'>(null);
  const [viewing, setViewing] = useState<ComplianceCertificateView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mechDone = v.package.mechanical.items.filter((i) => i.state === 'pass' || i.state === 'exception_accepted').length;
  const elecDone = v.package.electrical.items.filter((i) => i.state === 'pass').length;
  const statusKey = cur ? (cur.historic ? K.status.issuedHistoric : K.status.issued) : v.readiness.problems.includes('before_records') ? K.status.before : v.readiness.ready ? K.status.ready : K.status.waiting;
  const statusTone: BadgeTone = cur ? 'success' : v.readiness.ready ? 'accent' : 'neutral';
  const primary = cur ? cur.primary : s.primaryNow(s.form);
  const formProblem = s.problem(s.form);
  const doIssue = async () => {
    const r = await s.issue();
    if (r.ok) {
      setSheet(null);
      setError(null);
      s.resetForm();
    } else setError(t(errorKey(r.code)));
  };
  return (
    <Screen width="narrow" className={admin || cur ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <div className="row gap-2">
            <Button size="sm" variant="ghost" onClick={() => s.goto(assignmentPath(v.job.id))} aria-label={t(K.back)}>
              <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
            </Button>
            {admin && <Button size="sm" variant="ghost" onClick={() => setSheet('more')} aria-label={t(K.more)} data-more><DotsThree size={20} aria-hidden="true" /></Button>}
          </div>
        }
      />
      <Card className="mb-3">
        <div className="stack gap-3">
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <SealCheck size={22} aria-hidden="true" color="var(--color-accent-secondary)" />
            <strong className="t-lg" style={{ fontFamily: 'var(--font-heading)' }}>{cur ? cur.code : `CERT-${v.job.code}`}</strong>
            <Badge tone={statusTone} dot data-status={cur ? 'issued' : v.readiness.ready ? 'ready' : 'waiting'}>{t(statusKey)}</Badge>
          </div>
          <div className="grid-auto" style={{ ['--min' as string]: '150px' }}>
            <StatTile label={t(K.stat.standard)} value={primary ? stdNumber(primary) : t(K.stat.standardNone)} caption={v.driveType ? t(`driveType.${v.driveType}`) : undefined} />
            <StatTile label={t(K.stat.checks)} value={`${mechDone + elecDone} / ${v.package.mechanical.items.length + v.package.electrical.items.length}`} caption={t(K.stat.checksValue, { mech: mechDone, elec: elecDone })} />
            <StatTile label={cur ? t(K.stat.version, { n: cur.version }) : t(K.stat.issued)} value={cur ? formatDate(cur.issuedAt, lang) : t(K.stat.notIssued)} caption={cur ? cur.issuedByName : undefined} />
          </div>
        </div>
      </Card>
      <Card className="mb-3" style={{ borderColor: 'var(--color-accent-primary)' }}>
        <div className="row gap-2" style={{ alignItems: 'flex-start' }} data-disclaimer>
          <ShieldCheck size={20} aria-hidden="true" color="var(--color-accent-secondary)" />
          <div className="stack gap-1">
            <strong className="t-sm">{t(K.disclaimer.title)}</strong>
            <span className="t-xs">{t(K.disclaimer.body)}</span>
          </div>
        </div>
      </Card>
      <SegBar items={TABS.map((id) => ({ id, label: t(K.tab[id]) }))} value={s.tab} onChange={(id) => s.setTab(id as (typeof TABS)[number])} label={t(K.title)} className="mb-3" />

      {s.tab === 'certificate' && (
        <div className="stack gap-3">
          {cur ? <CertificateBody c={cur} v={v} t={t} lang={lang} /> : <BeforeIssue s={s} v={v} t={t} admin={admin} problem={formProblem} />}
          {!admin && !cur && <p className="t-xs t-muted">{t(K.inspector.readOnly)}</p>}
        </div>
      )}
      {s.tab === 'package' && <PackageView pkg={v.package} historic={!!cur?.historic} frozen={!!cur} t={t} lang={lang} />}
      {s.tab === 'next' && <NextSteps v={v} cur={cur} t={t} lang={lang} admin={admin} onEdit={() => setSheet('guidance')} />}
      {s.tab === 'history' && <History v={v} t={t} lang={lang} onView={setViewing} />}

      {(cur || admin) && (
        <ActionBar>
          {cur ? (
            <Button block icon={<DownloadSimple size={18} aria-hidden="true" />} onClick={() => download(cur, v, t, lang)} data-download>{t(K.cert.download)}</Button>
          ) : (
            <div className="stack gap-1">
              {!v.canIssue && <p className="t-xs t-muted">{t(K.issue.waiting)}</p>}
              <Button block disabled={!v.canIssue || !!formProblem} icon={<Lock size={18} aria-hidden="true" />} onClick={() => { setError(null); setSheet('issue'); }} data-issue="open">{t(K.issue.button)}</Button>
            </div>
          )}
        </ActionBar>
      )}

      <Sheet open={sheet === 'issue'} onClose={() => setSheet(null)} title={t(K.issue.title)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <p className="t-sm">{t(K.issue.body, { standard: primary ? stdNumber(primary) : '' })}</p>
          {error && <p className="t-xs t-error" role="alert">{error}</p>}
          <div className="row gap-2 wrap">
            <Button variant="secondary" onClick={() => setSheet(null)}>{t(K.issue.back)}</Button>
            <Button disabled={s.busy} onClick={() => void doIssue()} data-issue="go">{t(K.issue.go)}</Button>
          </div>
        </div>
      </Sheet>
      <Sheet open={sheet === 'more'} onClose={() => setSheet(null)} title={t(K.more)} closeLabel={t('action.close')}>
        <div className="stack gap-2">
          {cur && !cur.historic && <Button variant="secondary" onClick={() => setSheet('reissue')} data-more-reissue>{t(K.reissue.open)}</Button>}
          {v.canEditGuidance && <Button variant="secondary" onClick={() => setSheet('guidance')} data-more-guidance>{t(K.next.edit)}</Button>}
          {!(cur && !cur.historic) && !v.canEditGuidance && <p className="t-xs t-muted">{t(K.issue.adminOnly)}</p>}
        </div>
      </Sheet>
      {cur && <ReissueSheet open={sheet === 'reissue'} onClose={() => setSheet(null)} s={s} v={v} cur={cur} t={t} />}
      <GuidanceSheet open={sheet === 'guidance'} onClose={() => setSheet(null)} s={s} v={v} t={t} />
      <Sheet open={!!viewing} onClose={() => setViewing(null)} title={t(K.history.viewTitle, { code: viewing?.code ?? '' })} closeLabel={t('action.close')}>
        {viewing && (
          <div className="stack gap-3">
            <CertificateBody c={viewing} v={v} t={t} lang={lang} />
            <Button variant="secondary" icon={<DownloadSimple size={16} aria-hidden="true" />} style={{ width: 'fit-content' }} onClick={() => download(viewing, v, t, lang)}>{t(K.cert.download)}</Button>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}

/* ------------------------------------------------------------------ certificate */

function CertificateBody({ c, v, t, lang }: { c: ComplianceCertificateView; v: ComplianceView; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-3" data-certificate={c.code} data-status={c.status}>
        <div className="row gap-2 wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <strong className="t-sm">{t(K.cert.heading)}</strong>
          <Badge tone={c.status === 'current' ? 'success' : 'error'} dot>{c.status === 'current' ? t(K.history.current) : t(K.history.voided)}</Badge>
        </div>
        {c.supersededBy && (
          <div className="row gap-2" style={{ alignItems: 'flex-start' }} role="alert">
            <Warning size={18} aria-hidden="true" color="var(--color-error)" />
            <div className="stack gap-1">
              <strong className="t-xs">{t(K.cert.voided)}</strong>
              <span className="t-xs">{t(K.cert.voidedBody, { code: c.supersededBy.code, when: formatDateTime(c.supersededBy.at, lang), reason: c.supersededBy.reason })}</span>
            </div>
          </div>
        )}
        <p className="t-sm">{t(K.cert.statement, { standard: stdNumber(c.primary), site: v.job.siteName })}</p>
        <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
          <Row label={t(K.cert.code)} value={`${c.code} · v${c.version}`} />
          <Row label={t(K.cert.job)} value={`${v.job.siteName} · ${v.job.address}`} />
          <Row label={t(K.cert.quotation)} value={c.quotationCode} />
          <Row label={t(K.cert.drive)} value={t(`driveType.${c.driveType}`)} />
          <Row label={t(K.cert.state)} value={c.state ?? t(K.cert.stateNone)} />
          <Row label={t(K.cert.issuedBy)} value={`${c.issuedByName} · ${formatDateTime(c.issuedAt, lang)}`} />
        </dl>
        <div className="stack gap-1">
          <strong className="t-xs">{t(K.cert.checkedAgainst)}</strong>
          <p className="t-sm" data-primary={c.primary.id}>{t(K.cert.primary)}: {stdName(t, c.primary)}</p>
          <p className="t-xs t-muted">{t(K.basis[c.basis], { drive: t(`driveType.${c.driveType}`) })}{c.overrideReason ? ` · ${t(K.cert.because)}: ${c.overrideReason}` : ''}</p>
          {c.additional.map((a, i) => (
            <p key={i} className="t-sm" data-additional={a.id}>{t(K.cert.additional)}: {stdName(t, a)}<span className="t-xs t-muted"> · {t(K.cert.because)}: {a.reason}</span></p>
          ))}
        </div>
        {c.supersedes && <p className="t-xs t-muted">{t(K.cert.supersedes, { code: c.supersedes.code })}</p>}
        {c.historic && <p className="t-xs t-muted">{t(K.cert.historic)}</p>}
        <p className="t-xs t-muted row gap-2" style={{ alignItems: 'center' }}><Lock size={14} aria-hidden="true" /> {t(K.cert.locked)}</p>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="row gap-2" style={{ justifyContent: 'space-between' }}>
      <dt className="t-muted">{label}</dt>
      <dd style={{ margin: 0, textAlign: 'right' }}>{value}</dd>
    </div>
  );
}

function BeforeIssue({ s, v, t, admin, problem }: { s: ComplianceState; v: ComplianceView; t: T; admin: boolean; problem: string | null }) {
  const r = v.readiness;
  const items: { ok: boolean; label: string }[] = r.problems.includes('before_records')
    ? []
    : [
        { ok: !r.problems.includes('mechanical_open'), label: t(K.ready.mechanical) },
        { ok: !r.problems.includes('electrical_open'), label: t(K.ready.electrical) },
        { ok: !r.problems.includes('rework_open'), label: r.openRework > 0 ? t(K.ready.rework, { count: r.openRework }) : t(K.ready.reworkNone) },
        { ok: !r.problems.includes('no_spec'), label: t(K.ready.spec) },
      ];
  return (
    <>
      <Card>
        <div className="stack gap-2" data-ready={r.ready ? 'yes' : 'no'}>
          <strong className="t-sm">{t(K.ready.heading)}</strong>
          {r.problems.includes('before_records') ? (
            <p className="t-sm t-muted">{t(K.ready.before)}</p>
          ) : (
            <>
              {items.map((i) => (
                <p key={i.label} className="t-sm row gap-2" style={{ alignItems: 'center' }}>
                  {i.ok ? <CheckCircle size={18} weight="fill" aria-hidden="true" color="var(--color-success)" /> : <Circle size={18} aria-hidden="true" color="var(--color-text-secondary)" />}
                  {i.label}
                </p>
              ))}
              <p className="t-xs t-muted">{r.ready ? t(K.ready.allGood) : t(K.ready.open)}</p>
              {!r.ready && (
                <div className="row gap-2 wrap">
                  <Button size="sm" variant="secondary" onClick={() => s.goto(`/qc-mechanical/${v.job.id}`)}>{t('qcMech.title')}</Button>
                  <Button size="sm" variant="secondary" onClick={() => s.goto(`/qc-electrical/${v.job.id}`)}>{t('qcElec.title')}</Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
      {admin && !r.problems.includes('before_records') && (
        <Card>
          <StandardsEditor s={s} v={v} t={t} form={s.form} onChange={s.setForm} problem={problem} />
        </Card>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ standards choice */

function StandardsEditor({ s, v, t, form, onChange, problem, current }: { s: ComplianceState; v: ComplianceView; t: T; form: StandardsForm; onChange: (p: Partial<StandardsForm>) => void; problem: string | null; current?: ComplianceCertificateView }) {
  const auto = v.autoStandard;
  const drive = v.driveType ? t(`driveType.${v.driveType}`) : '';
  const choosing = !!form.primary || !auto;
  const primary = s.primaryNow(form);
  const differs = !!auto && !!form.primary && form.primary !== auto;
  void current;
  return (
    <div className="stack gap-3" data-standards>
      <strong className="t-sm">{t(K.form.heading)}</strong>
      {!choosing && auto && (
        <div className="stack gap-2" data-auto={auto}>
          <p className="t-sm">{t(K.form.auto, { standard: primary ? stdName(t, primary) : '', drive })}</p>
          <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} onClick={() => onChange({ primary: auto })} data-change-standard>{t(K.form.change)}</Button>
        </div>
      )}
      {choosing && (
        <div className="stack gap-2">
          {!auto && <p className="t-xs" role="status" data-no-auto>{t(K.form.none, { drive })}</p>}
          <span className="t-xs t-semibold">{t(K.form.primary)}</span>
          <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.form.primary)}>
            {STANDARDS.map((id) => (
              <Chip key={id} pressed={form.primary === id} onClick={() => onChange({ primary: id })}>{id === 'other' ? t(K.standard.other) : STANDARD_NUMBER[id]}</Chip>
            ))}
          </div>
          {form.primary === 'other' && (
            <Field label={t(K.form.otherLabel)} hint={t(K.form.otherHint)} required>
              {({ id }) => <Input id={id} value={form.primaryLabel} onChange={(e) => onChange({ primaryLabel: e.target.value })} data-primary-label />}
            </Field>
          )}
          {differs && (
            <Field label={t(K.form.overrideReason)} hint={t(K.form.overrideHint, { count: REASON_MIN })} required>
              {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={form.overrideReason} onChange={(e) => onChange({ overrideReason: e.target.value })} data-override />}
            </Field>
          )}
          {auto && <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} onClick={() => onChange({ primary: '', primaryLabel: '', overrideReason: '' })} data-use-auto>{t(K.form.useAuto)}</Button>}
        </div>
      )}

      <div className="stack gap-2">
        <strong className="t-xs">{t(K.form.additionalHeading)}</strong>
        <span className="t-xs t-muted">{t(K.form.additionalHint)}</span>
        {form.additional.map((a, i) => (
          <div key={i} className="stack gap-2" data-additional-row={i} style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: 'var(--space-3)' }}>
            <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.form.additionalHeading)}>
              {ADDITIONAL_CHOICES.map((id) => (
                <Chip key={id} pressed={a.id === id} onClick={() => onChange({ additional: form.additional.map((x, n) => (n === i ? { ...x, id } : x)) })}>{id === 'other' ? t(K.standard.other) : STANDARD_NUMBER[id as 'IS_14671']}</Chip>
              ))}
            </div>
            {a.id === 'other' && (
              <Field label={t(K.form.otherLabel)} required>
                {({ id }) => <Input id={id} value={a.label} onChange={(e) => onChange({ additional: form.additional.map((x, n) => (n === i ? { ...x, label: e.target.value } : x)) })} data-additional-label />}
              </Field>
            )}
            <Field label={t(K.form.reason)} hint={t(K.form.reasonHint, { count: REASON_MIN })} required>
              {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={a.reason} onChange={(e) => onChange({ additional: form.additional.map((x, n) => (n === i ? { ...x, reason: e.target.value } : x)) })} data-additional-reason />}
            </Field>
            <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} onClick={() => onChange({ additional: form.additional.filter((_, n) => n !== i) })}>{t(K.form.remove)}</Button>
          </div>
        ))}
        {form.additional.length < MAX_ADDITIONAL && (
          <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => onChange({ additional: [...form.additional, { id: form.additional.some((x) => x.id === 'IS_14671') ? 'other' : 'IS_14671', label: '', reason: '' }] })} data-add-additional>{t(K.form.add)}</Button>
        )}
      </div>
      {problem ? <p className="t-xs t-muted" data-problem={problem}>• {t(K.problem[problem as keyof typeof K.problem] ?? K.problem.generic)}</p> : <p className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}><CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.form.ok)}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ reissue */

function ReissueSheet({ open, onClose, s, v, cur, t }: { open: boolean; onClose: () => void; s: ComplianceState; v: ComplianceView; cur: ComplianceCertificateView; t: T }) {
  const initial = (): StandardsForm => ({
    primary: cur.basis === 'selected' ? cur.primary.id : '',
    primaryLabel: cur.primary.label ?? '',
    overrideReason: cur.overrideReason ?? '',
    additional: cur.additional.map((a) => ({ id: a.id, label: a.label ?? '', reason: a.reason ?? '' })),
  });
  const [form, setForm] = useState<StandardsForm>(initial);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const problem = s.problem(form);
  const ok = reason.trim().length >= REASON_MIN && !problem;
  return (
    <Sheet open={open} onClose={onClose} title={t(K.reissue.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-reissue>
        <p className="t-sm">{t(K.reissue.intro, { code: cur.code })}</p>
        <Field label={t(K.reissue.reason)} hint={t(K.reissue.reasonHint, { count: REASON_MIN })} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-reissue-reason />}
        </Field>
        <StandardsEditor s={s} v={v} t={t} form={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} problem={problem} current={cur} />
        <p className="t-xs t-muted">{t(K.reissue.keeps)}</p>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button
            disabled={!ok || s.busy}
            data-reissue-go
            onClick={async () => {
              const r = await s.reissue(form, reason);
              if (r.ok) {
                setError(null);
                setReason('');
                setForm(EMPTY_STANDARDS);
                onClose();
              } else setError(t(errorKey(r.code)));
            }}
          >
            {t(K.reissue.go)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ evidence package */

function PackageView({ pkg, historic, frozen, t, lang }: { pkg: ComplianceView['package']; historic: boolean; frozen: boolean; t: T; lang: string }) {
  const tone = (st: string) => STATE_TONE[st] ?? 'neutral';
  const section = (key: string, title: string, body: JSX.Element, open = false) => (
    <details open={open} data-section={key} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
      <summary className="t-sm t-semibold" style={{ cursor: 'pointer', minHeight: 40, display: 'flex', alignItems: 'center' }}>{title}</summary>
      <div className="stack gap-2 mt-2">{body}</div>
    </details>
  );
  return (
    <Card>
      <div className="stack gap-3" data-package={frozen ? 'frozen' : 'live'}>
        <div className="stack gap-1">
          <strong className="t-sm">{t(K.pkg.heading)}</strong>
          <span className="t-xs t-muted">{historic ? t(K.pkg.historic) : frozen ? t(K.pkg.frozen, { when: formatDateTime(pkg.builtAt, lang) }) : t(K.pkg.live)}</span>
        </div>
        {!historic && (
          <>
            {section('installation', t(K.pkg.installation), (
              <>
                <p className="t-sm">{t(K.pkg.installationValue, { done: pkg.installation.stepsDone, total: pkg.installation.stepsTotal })}{pkg.installation.completedAt ? ` · ${formatDate(pkg.installation.completedAt, lang)}` : ''}</p>
                <p className="t-xs t-muted">{t(K.pkg.team, { name: pkg.installation.leadName ?? '—', count: pkg.installation.teamCount })}</p>
              </>
            ))}
            {section('mechanical', t(K.pkg.mechanical), (
              <>
                <p className="t-xs t-muted">{pkg.mechanical.signedOff ? t(K.pkg.signedOff, { name: pkg.mechanical.signedOff.byName, when: formatDateTime(pkg.mechanical.signedOff.at, lang) }) : t(K.pkg.notSigned)}</p>
                {pkg.mechanical.items.map((i) => (
                  <p key={i.id} className="t-sm row gap-2 wrap" style={{ alignItems: 'center' }}>
                    <Badge tone={tone(i.state)}>{t(K.pkg.itemState[i.state as keyof typeof K.pkg.itemState])}</Badge>
                    {t(`qcMech.item.${i.id}`)}
                    <span className="t-xs t-muted">{t(K.pkg.attempts, { count: i.attempts, fails: i.fails })}</span>
                  </p>
                ))}
              </>
            ))}
            {section('electrical', t(K.pkg.electrical), (
              <>
                <p className="t-xs t-muted">{pkg.electrical.signedOff ? t(K.pkg.signedOff, { name: pkg.electrical.signedOff.byName, when: formatDateTime(pkg.electrical.signedOff.at, lang) }) : t(K.pkg.notSigned)}</p>
                {pkg.electrical.items.map((i) => (
                  <div key={i.id} className="stack gap-1">
                    <p className="t-sm row gap-2 wrap" style={{ alignItems: 'center' }}>
                      <Badge tone={tone(i.state)}>{t(K.pkg.itemState[i.state as keyof typeof K.pkg.itemState])}</Badge>
                      {t(`qcElec.item.${i.id}`)}
                      <span className="t-xs t-muted">{t(K.pkg.attempts, { count: i.attempts, fails: i.fails })}</span>
                    </p>
                    {i.measures.length > 0 && <p className="t-xs t-muted">{i.measures.map((m) => `${t(`qcElec.measure.${m.key}`)}: ${m.value}`).join(' · ')}</p>}
                  </div>
                ))}
              </>
            ))}
            {section('trials', t(K.pkg.trials), (
              <>
                {pkg.trials.map((tr) => (
                  <p key={tr.id} className="t-sm" data-trial={tr.id}>
                    {tr.at
                      ? t(tr.loadPct !== null ? K.pkg.trialLine : K.pkg.trialLineNoLoad, { name: t(`qcElec.item.${tr.id}`), runs: tr.runs ?? 0, load: tr.loadPct ?? 0, count: tr.evidence, when: formatDate(tr.at, lang) })
                      : `${t(`qcElec.item.${tr.id}`)}: ${t(K.pkg.trialNone)}`}
                  </p>
                ))}
              </>
            ))}
            {section('safety', t(K.pkg.safety), (
              <>
                <p className="t-xs t-muted">{pkg.safety.ready ? t(K.pkg.safetyReady) : t(K.pkg.safetyOpen)}</p>
                {pkg.safety.lines.map((l) => (
                  <p key={l.itemId} className="t-sm row gap-2 wrap" style={{ alignItems: 'center' }}>
                    <Badge tone={SAFETY_TONE[l.state] ?? 'neutral'}>{t(K.pkg.safetyState[l.state as keyof typeof K.pkg.safetyState])}</Badge>
                    {l.label ?? (l.labelKey ? t(l.labelKey) : l.itemId)}
                    {l.overriddenBy && <span className="t-xs t-muted">{t(K.pkg.overridden, { name: l.overriddenBy })}</span>}
                  </p>
                ))}
              </>
            ))}
            {section('parts', t(K.pkg.parts), (
              <>
                {pkg.parts.length === 0 ? <p className="t-xs t-muted">{t(K.pkg.noParts)}</p> : <p className="t-xs t-muted">{pkg.partsConfirmedAt ? t(K.pkg.partsConfirmed, { when: formatDate(pkg.partsConfirmedAt, lang) }) : ''}</p>}
                {pkg.parts.map((p, i) => (
                  <p key={i} className="t-sm row gap-2 wrap" style={{ alignItems: 'center' }}>
                    {t(K.pkg.partLine, { qty: p.quantity, desc: p.description, category: t(`partCategory.${p.category}`, { defaultValue: p.category }), ids: p.identifiers })}
                    {p.substituted && <Badge tone="warning">{t(K.pkg.substituted)}</Badge>}
                  </p>
                ))}
              </>
            ))}
          </>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ next steps */

function NextSteps({ v, cur, t, lang, admin, onEdit }: { v: ComplianceView; cur: ComplianceCertificateView | null; t: T; lang: string; admin: boolean; onEdit: () => void }) {
  const g = cur ? cur.guidance : v.guidance;
  const changed = !!cur && !cur.historic && JSON.stringify(cur.guidance.steps) !== JSON.stringify(v.guidance.steps);
  return (
    <div className="stack gap-3">
      <Card>
        <div className="stack gap-2">
          <strong className="t-sm">{t(K.next.heading)}</strong>
          <p className="t-sm">{t(K.next.intro)}</p>
          <strong className="t-xs">{t(K.next.baselineHeading)}</strong>
          <ol className="stack gap-1 t-sm" style={{ margin: 0, paddingLeft: 20 }}>
            <li>{t(K.next.b1)}</li>
            <li>{t(K.next.b2)}</li>
            <li>{t(K.next.b3)}</li>
          </ol>
        </div>
      </Card>
      <Card>
        <div className="stack gap-2" data-state-guidance={g.fallback ? 'fallback' : 'state'}>
          <strong className="t-sm">{t(K.next.stateHeading, { state: g.state ?? '—' })}</strong>
          {!g.state ? (
            <p className="t-sm t-muted">{t(K.next.noState)}</p>
          ) : g.fallback ? (
            <p className="t-sm t-muted">{t(K.next.noneForState, { state: g.state })}</p>
          ) : (
            <>
              <p className="t-sm">{t(K.next.authority)}: {g.authority}</p>
              <ol className="stack gap-1 t-sm" style={{ margin: 0, paddingLeft: 20 }}>
                {g.steps.map((x, i) => <li key={i}>{x}</li>)}
              </ol>
              {g.note && <p className="t-xs t-muted">{g.note}</p>}
              {!cur && v.guidance.updatedByName && v.guidance.updatedAt && <p className="t-xs t-muted">{t(K.next.updated, { name: v.guidance.updatedByName, when: formatDate(v.guidance.updatedAt, lang) })}</p>}
            </>
          )}
          {changed && <p className="t-xs t-muted" role="status">{t(K.next.changed)}</p>}
          {admin && v.canEditGuidance && <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={onEdit} data-edit-guidance>{t(K.next.edit)}</Button>}
        </div>
      </Card>
    </div>
  );
}

function GuidanceSheet({ open, onClose, s, v, t }: { open: boolean; onClose: () => void; s: ComplianceState; v: ComplianceView; t: T }) {
  const g = v.guidance;
  const [authority, setAuthority] = useState(g.authority ?? '');
  const [steps, setSteps] = useState(g.steps.join('\n'));
  const [note, setNote] = useState(g.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const list = steps.split('\n').map((x) => x.trim()).filter(Boolean);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.next.editTitle, { state: g.state ?? '' })} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-guidance-form>
        <Field label={t(K.next.authorityLabel)} required>
          {({ id }) => <Input id={id} value={authority} onChange={(e) => setAuthority(e.target.value)} data-guidance-authority />}
        </Field>
        <Field label={t(K.next.stepsLabel)} hint={t(K.next.stepsHint)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} data-guidance-steps />}
        </Field>
        <Field label={t(K.next.noteLabel)}>
          {({ id }) => <TextArea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button
            disabled={s.busy || authority.trim().length < 3 || list.length === 0}
            data-guidance-save
            onClick={async () => {
              const r = await s.saveGuidance({ authority, steps: list, note });
              if (r.ok) {
                setError(null);
                onClose();
              } else setError(t(errorKey(r.code)));
            }}
          >
            {t(K.next.save)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ history */

function History({ v, t, lang, onView }: { v: ComplianceView; t: T; lang: string; onView: (c: ComplianceCertificateView) => void }) {
  if (v.history.length === 0) return <EmptyState icon={<SealCheck size={28} />} title={t(K.history.none)} body="" />;
  return (
    <Card>
      <div className="stack gap-3" data-history>
        <strong className="t-sm">{t(K.history.heading)}</strong>
        <AscensionLine
          className="ds-ascension--multiline"
          steps={v.history.map((c) => ({
            id: c.id,
            label: `${c.code} · v${c.version}`,
            meta: `${formatDateTime(c.issuedAt, lang)} · ${c.issuedByName}${c.supersedes ? ` · ${t(K.history.voids, { code: c.supersedes.code })}` : ''}${c.supersededBy ? ` · ${t(K.history.voided)}` : ''}`,
            status: c.status === 'current' ? 'current' : 'complete',
            trailing: <Button size="sm" variant="ghost" onClick={() => onView(c)} data-view-version={c.version}>{t(K.history.view)}</Button>,
          }))}
        />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ download */

function download(c: ComplianceCertificateView, v: ComplianceView, t: T, lang: string) {
  const pkg = c.package;
  const rows = (items: string[][]) => items.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t(K.cert.fileTitle, { code: c.code }))}</title><style>body{font-family:sans-serif;max-width:820px;margin:24px auto;padding:0 16px;color:#2A2723}table{border-collapse:collapse;width:100%;margin-bottom:16px}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:14px}.note{border:1px solid #B8873D;padding:10px 12px;border-radius:8px}.void{border:2px solid #B23B3B;padding:10px 12px;border-radius:8px;color:#B23B3B}</style></head><body>` +
    `<h1>${esc(t(K.cert.fileTitle, { code: c.code }))}</h1>` +
    (c.supersededBy ? `<p class="void"><strong>${esc(t(K.cert.voided))}</strong> ${esc(t(K.cert.voidedBody, { code: c.supersededBy.code, when: formatDateTime(c.supersededBy.at, lang), reason: c.supersededBy.reason }))}</p>` : '') +
    `<p class="note">${esc(t(K.disclaimer.body))}</p>` +
    `<p>${esc(t(K.cert.statement, { standard: stdNumber(c.primary), site: v.job.siteName }))}</p>` +
    `<table>${rows([[t(K.cert.code), `${c.code} · v${c.version}`], [t(K.cert.job), `${v.job.siteName} · ${v.job.address}`], [t(K.cert.quotation), c.quotationCode], [t(K.cert.drive), t(`driveType.${c.driveType}`)], [t(K.cert.primary), stdName(t, c.primary)], ...c.additional.map((a) => [t(K.cert.additional), `${stdName(t, a)} (${a.reason ?? ''})`]), [t(K.cert.issuedBy), `${c.issuedByName} · ${formatDateTime(c.issuedAt, lang)}`]])}</table>` +
    (c.historic ? `<p>${esc(t(K.cert.historic))}</p>` : `<h2>${esc(t(K.pkg.mechanical))}</h2><table>${rows(pkg.mechanical.items.map((i) => [t(`qcMech.item.${i.id}`), t(K.pkg.itemState[i.state as keyof typeof K.pkg.itemState]), t(K.pkg.attempts, { count: i.attempts, fails: i.fails })]))}</table>` +
      `<h2>${esc(t(K.pkg.electrical))}</h2><table>${rows(pkg.electrical.items.map((i) => [t(`qcElec.item.${i.id}`), t(K.pkg.itemState[i.state as keyof typeof K.pkg.itemState]), i.measures.map((m) => `${t(`qcElec.measure.${m.key}`)}: ${m.value}`).join(' · ')]))}</table>` +
      `<h2>${esc(t(K.pkg.trials))}</h2><table>${rows(pkg.trials.map((tr) => [t(`qcElec.item.${tr.id}`), tr.at ? t(tr.loadPct !== null ? K.pkg.trialLine : K.pkg.trialLineNoLoad, { name: '', runs: tr.runs ?? 0, load: tr.loadPct ?? 0, count: tr.evidence, when: formatDate(tr.at, lang) }) : t(K.pkg.trialNone)]))}</table>` +
      `<h2>${esc(t(K.pkg.safety))}</h2><table>${rows(pkg.safety.lines.map((l) => [l.label ?? (l.labelKey ? t(l.labelKey) : l.itemId), t(K.pkg.safetyState[l.state as keyof typeof K.pkg.safetyState])]))}</table>` +
      `<h2>${esc(t(K.pkg.parts))}</h2><table>${rows(pkg.parts.map((p) => [t(K.pkg.partLine, { qty: p.quantity, desc: p.description, category: t(`partCategory.${p.category}`, { defaultValue: p.category }), ids: p.identifiers }), p.substituted ? t(K.pkg.substituted) : '']))}</table>`) +
    `<h2>${esc(t(K.next.heading))}</h2><p>${esc(t(K.next.intro))}</p><ol><li>${esc(t(K.next.b1))}</li><li>${esc(t(K.next.b2))}</li><li>${esc(t(K.next.b3))}</li></ol>` +
    (c.guidance.state && !c.guidance.fallback ? `<h3>${esc(t(K.next.stateHeading, { state: c.guidance.state }))}</h3><p>${esc(t(K.next.authority))}: ${esc(c.guidance.authority ?? '')}</p><ol>${c.guidance.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>${c.guidance.note ? `<p>${esc(c.guidance.note)}</p>` : ''}` : '') +
    `</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.code}-v${c.version}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
