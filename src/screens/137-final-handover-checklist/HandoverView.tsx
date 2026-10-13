import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Circle, ClipboardText, DotsThree, FileText, ShieldCheck, Warning } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, EmptyState, ErrorState, Field, LoadingState, Screen, ScreenHeader, Sheet, TextArea, formatDateTime } from '@/design-system';
import type { HandoverChecklistView, HandoverDocView } from '@/data/repository';
import { CORRECTION_MIN, ISSUE_MIN, REVIEW_NOTE_MIN, REVIEW_REASON_MIN } from '@/features/qc/handover';
import type { HandoverDocKind } from '@/features/qc/handover';
import { useHandover } from './useHandover';
import type { ActionResult, HandoverState } from './useHandover';
import { DOCS, HANDOVER_KEYS as K, assignmentPath, boardPath, compliancePath, electricalPath, mechanicalPath, snagsPath, walkthroughPath } from './handover.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/**
 * Screen 137 — Final Handover Checklist. A completeness gate, not a third inspection: the quality checks, the snag list and the compliance
 * certificate are read as they stand, and the customer's documentation package is confirmed here. Every step has a large, high-contrast card;
 * nothing can be ticked that is not true. Ready for Handover is the single action that unlocks the customer walkthrough.
 */
export function HandoverScreen() {
  const { t } = useTranslation();
  const s = useHandover();
  const wrap = (body: JSX.Element) => (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} />
      {body}
    </Screen>
  );
  if (!s.jobId) return wrap(<EmptyState icon={<ClipboardText size={28} />} title={t(K.noJob.title)} body={t(K.noJob.body)} actionLabel={t(K.noJob.action)} onAction={() => s.goto(boardPath)} />);
  if (s.status === 'not_found') return wrap(<EmptyState icon={<ClipboardText size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />);
  if (s.status === 'loading' && !s.view) return wrap(<LoadingState label={t(K.loading)} variant="cards" rows={4} />);
  if (s.status === 'error' || !s.view) return wrap(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  return <Checklist s={s} v={s.view} t={t} />;
}

type Sub = null | 'more' | 'confirm' | 'review' | 'completeReview' | { kind: 'report' | 'resolve' | 'typo'; doc: HandoverDocKind; issueId?: string };

function Checklist({ s, v, t }: { s: HandoverState; v: HandoverChecklistView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [sub, setSub] = useState<Sub>(null);
  const [error, setError] = useState<string | null>(null);
  const admin = v.viewer === 'admin';
  const p = v.readiness.problems;
  const checksDone = !p.includes('checks_open');
  const snagsDone = !p.includes('snags_open');
  const certDone = !p.includes('certificate_missing');
  const docsDone = !p.includes('docs_open');
  const reviewDone = !v.adminReview || !!v.adminReview.completedAt;
  const total = 3 + DOCS.length + (v.adminReview ? 1 : 0);
  const done = (checksDone ? 1 : 0) + (snagsDone ? 1 : 0) + (certDone ? 1 : 0) + v.docs.filter((d) => d.state === 'ready').length + (v.adminReview && reviewDone ? 1 : 0);
  const confirmed = v.status === 'confirmed';
  const beforeRecords = confirmed && !v.confirmed;
  const cur = (() => {
    const first = [!checksDone, !snagsDone, !certDone, !docsDone, !reviewDone].indexOf(true);
    return first;
  })();
  const close = () => {
    setSub(null);
    setError(null);
  };
  const run = async (fn: () => Promise<ActionResult>, after?: () => void): Promise<boolean> => {
    const r = await fn();
    if (r.ok) {
      setError(null);
      after?.();
    } else setError(t(errorKey(r.code)));
    return r.ok;
  };
  return (
    <Screen width="narrow" className="pb-action-bar">
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <div className="row gap-2">
            <Button size="sm" variant="ghost" onClick={() => s.goto(assignmentPath(v.job.id))} aria-label={t(K.back)}>
              <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
            </Button>
            {admin && v.canRequestReview && <Button size="sm" variant="ghost" onClick={() => setSub('more')} aria-label={t(K.more)} data-more><DotsThree size={20} aria-hidden="true" /></Button>}
          </div>
        }
      />
      <Card className="mb-3">
        <div className="stack gap-3" data-status={v.status}>
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <ShieldCheck size={22} aria-hidden="true" color="var(--color-accent-secondary)" />
            <strong className="t-lg" style={{ fontFamily: 'var(--font-heading)' }}>{t(K.hero.heading)}</strong>
            <Badge tone={confirmed ? 'success' : v.status === 'reopened' ? 'error' : v.status === 'ready' ? 'accent' : 'neutral'} dot>{t(K.status[v.status])}</Badge>
          </div>
          <p className="t-sm">{t(K.hero.intro)}</p>
          <p className="t-sm" style={{ fontWeight: 600 }}>{done === total ? t(K.hero.allDone) : t(K.hero.remaining, { done, total })}</p>
          <AscensionLine
            steps={[
              { id: 'qc', label: t(K.step.qc.title), status: checksDone ? 'complete' : cur === 0 ? 'current' : 'upcoming' },
              { id: 'snags', label: t(K.step.snags.title), status: snagsDone ? 'complete' : cur === 1 ? 'current' : 'upcoming' },
              { id: 'cert', label: t(K.step.certificate.title), status: certDone ? 'complete' : cur === 2 ? 'current' : 'upcoming' },
              { id: 'docs', label: t(K.docs.heading), status: docsDone ? 'complete' : cur === 3 ? 'current' : 'upcoming' },
              ...(v.adminReview ? [{ id: 'review', label: t(K.step.review.title), status: reviewDone ? ('complete' as const) : cur === 4 ? ('current' as const) : ('upcoming' as const) }] : []),
              { id: 'ready', label: t(K.status.confirmed), status: confirmed ? 'complete' : v.readiness.ready ? 'current' : 'upcoming' },
            ]}
          />
        </div>
      </Card>

      <div className="stack gap-3">
        <StepCard done={checksDone} mandatory t={t} title={t(K.step.qc.title)} id="qc">
          <p className="t-sm">{t(K.step.qc.body)}</p>
          <p className="t-sm">{v.checks.mechanical ? t(K.step.qc.signed, { what: t(K.step.qc.mech), name: v.checks.mechanical.byName, when: formatDateTime(v.checks.mechanical.at, lang) }) : t(K.step.qc.open, { what: t(K.step.qc.mech) })}</p>
          <p className="t-sm">{v.checks.electrical ? t(K.step.qc.signed, { what: t(K.step.qc.elec), name: v.checks.electrical.byName, when: formatDateTime(v.checks.electrical.at, lang) }) : t(K.step.qc.open, { what: t(K.step.qc.elec) })}</p>
          {!checksDone && (
            <div className="row gap-2 wrap">
              <Button size="sm" variant="secondary" onClick={() => s.goto(mechanicalPath(v.job.id))}>{t('qcMech.title')}</Button>
              <Button size="sm" variant="secondary" onClick={() => s.goto(electricalPath(v.job.id))}>{t('qcElec.title')}</Button>
            </div>
          )}
        </StepCard>

        <StepCard done={snagsDone} mandatory t={t} title={t(K.step.snags.title)} id="snags" alert={v.snags.safetyCritical > 0}>
          <p className="t-sm">{t(K.step.snags.body)}</p>
          {snagsDone ? (
            <p className="t-sm">{t(K.step.snags.clear, { resolved: v.snags.resolved, waived: v.snags.waived })}</p>
          ) : (
            <div className="stack gap-1">
              <p className="t-sm" style={{ fontWeight: 600 }}>{t(K.step.snags.open, { count: v.snags.open })}</p>
              {v.snags.safetyCritical > 0 && <p className="t-sm" style={{ color: 'var(--color-error)' }}>{t(K.step.snags.safety, { count: v.snags.safetyCritical })}</p>}
              {v.snags.functional > 0 && <p className="t-sm">{t(K.step.snags.functional, { count: v.snags.functional })}</p>}
              {v.snags.cosmetic > 0 && <p className="t-sm">{t(K.step.snags.cosmetic, { count: v.snags.cosmetic })}</p>}
              {v.snags.pendingVerification > 0 && <p className="t-xs t-muted">{t(K.step.snags.pending, { count: v.snags.pendingVerification })}</p>}
              {v.snags.disputed > 0 && <p className="t-xs t-muted">{t(K.step.snags.disputed, { count: v.snags.disputed })}</p>}
            </div>
          )}
          <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => s.goto(snagsPath(v.job.id))} data-open-snags>{t(K.step.snags.link)}</Button>
        </StepCard>

        <StepCard done={certDone} mandatory t={t} title={t(K.step.certificate.title)} id="certificate">
          <p className="t-sm">{t(K.step.certificate.body)}</p>
          {v.certificate && !v.certificate.historic ? <p className="t-sm">{t(K.step.certificate.issued, { code: v.certificate.code, version: v.certificate.version, when: formatDateTime(v.certificate.issuedAt, lang) })}</p> : <p className="t-sm">{v.certificate?.historic ? t(K.step.certificate.historic) : t(K.step.certificate.missing)}</p>}
          <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => s.goto(compliancePath(v.job.id))} data-open-certificate>{t(K.step.certificate.link)}</Button>
        </StepCard>

        <div className="stack gap-1" style={{ paddingTop: 'var(--space-2)' }}>
          <h2 className="t-md t-semibold">{t(K.docs.heading)}</h2>
          <p className="t-xs t-muted">{t(K.docs.intro)}</p>
        </div>
        {v.docs.map((d) => (
          <DocCard key={d.kind} d={d} v={v} s={s} t={t} lang={lang} onSub={setSub} />
        ))}

        {v.adminReview && (
          <StepCard done={reviewDone} t={t} title={t(K.step.review.title)} id="review">
            <p className="t-sm">{t(K.step.review.body)}</p>
            <p className="t-sm">{t(K.step.review.reason)}: {v.adminReview.reason}</p>
            {v.adminReview.completedAt ? <p className="t-sm">{t(K.step.review.done, { name: v.adminReview.completedByName ?? '', when: formatDateTime(v.adminReview.completedAt, lang) })}: {v.adminReview.note}</p> : v.canCompleteReview && <Button size="sm" style={{ width: 'fit-content' }} onClick={() => setSub('completeReview')} data-complete-review>{t(K.step.review.complete)}</Button>}
          </StepCard>
        )}
      </div>

      <ActionBar>
        {confirmed ? (
          <div className="stack gap-1" data-confirmed>
            <p className="t-sm row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={20} weight="fill" color="var(--color-success)" aria-hidden="true" /> {beforeRecords ? t(K.confirm.legacy) : t(K.confirm.done, { name: v.confirmed?.byName ?? '', when: v.confirmed ? formatDateTime(v.confirmed.at, lang) : '' })}</p>
            <p className="t-xs t-muted">{t(K.confirm.unlocked)}</p>
            <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => s.goto(walkthroughPath(v.job.id))} data-open-walkthrough>{t(K.confirm.openWalkthrough)}</Button>
          </div>
        ) : (
          <div className="stack gap-1">
            {v.status === 'reopened' && <p className="t-xs" style={{ color: 'var(--color-error)' }}>{t(K.confirm.reopened)}</p>}
            {!v.readiness.ready && <p className="t-xs t-muted">{t(K.confirm.waiting)}</p>}
            <Button block className="ds-btn--big" disabled={!v.canConfirm || s.busy} icon={<ShieldCheck size={20} aria-hidden="true" />} onClick={() => { setError(null); setSub('confirm'); }} data-confirm="open">{t(v.status === 'reopened' ? K.confirm.reconfirm : K.confirm.button)}</Button>
          </div>
        )}
      </ActionBar>

      <Sheet open={sub === 'confirm'} onClose={close} title={t(K.confirm.title)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <p className="t-sm">{t(K.confirm.body)}</p>
          {error && <p className="t-xs t-error" role="alert">{error}</p>}
          <div className="row gap-2 wrap">
            <Button variant="secondary" onClick={close}>{t(K.confirm.back)}</Button>
            <Button disabled={s.busy} data-confirm="go" onClick={() => void run(s.confirm, close)}>{t(K.confirm.go)}</Button>
          </div>
        </div>
      </Sheet>
      <Sheet open={sub === 'more'} onClose={close} title={t(K.more)} closeLabel={t('action.close')}>
        <div className="stack gap-2">
          <Button variant="secondary" onClick={() => setSub('review')} data-more-review>{t(K.review.add)}</Button>
        </div>
      </Sheet>
      <TextSheet open={sub === 'review'} onClose={close} t={t} title={t(K.review.title)} body={t(K.review.body)} label={t(K.review.reason)} hint={t(K.review.hint, { count: REVIEW_REASON_MIN })} min={REVIEW_REASON_MIN} go={t(K.review.go)} busy={s.busy} error={error} onSubmit={(x) => run(() => s.requestReview(x), close)} dataKey="review" />
      <TextSheet open={sub === 'completeReview'} onClose={close} t={t} title={t(K.step.review.complete)} label={t(K.step.review.note)} hint={t(K.step.review.noteHint, { count: REVIEW_NOTE_MIN })} min={REVIEW_NOTE_MIN} go={t(K.step.review.go)} busy={s.busy} error={error} onSubmit={(x) => run(() => s.completeReview(x), close)} dataKey="completeReview" />
      {typeof sub === 'object' && sub && sub.kind === 'report' && <TextSheet open onClose={close} t={t} title={t(K.docs.reportTitle, { doc: t(K.docs.name[sub.doc]) })} body={t(K.docs.reportBody)} label={t(K.docs.reportLabel)} hint={t(K.docs.reportHint, { count: ISSUE_MIN })} min={ISSUE_MIN} go={t(K.docs.reportGo)} busy={s.busy} error={error} onSubmit={(x) => run(() => s.flagIssue((sub as { doc: HandoverDocKind }).doc, x), close)} dataKey="report" />}
      {typeof sub === 'object' && sub && sub.kind === 'resolve' && <TextSheet open onClose={close} t={t} title={t(K.docs.resolveTitle, { doc: t(K.docs.name[sub.doc]) })} body={t(K.docs.resolveBody)} label={t(K.docs.resolveLabel)} hint={t(K.docs.reportHint, { count: ISSUE_MIN })} min={ISSUE_MIN} go={t(K.docs.resolveGo)} busy={s.busy} error={error} onSubmit={(x) => run(() => s.resolveIssue((sub as { issueId?: string }).issueId ?? '', x), close)} dataKey="resolve" />}
      {typeof sub === 'object' && sub && sub.kind === 'typo' && <TextSheet open onClose={close} t={t} title={t(K.docs.typoTitle, { doc: t(K.docs.name[sub.doc]) })} body={t(K.docs.typoBody)} label={t(K.docs.typoLabel)} hint={t(K.docs.reportHint, { count: CORRECTION_MIN })} min={CORRECTION_MIN} go={t(K.docs.typoGo)} busy={s.busy} error={error} onSubmit={(x) => run(() => s.correctDoc((sub as { doc: HandoverDocKind }).doc, x), close)} dataKey="typo" />}
    </Screen>
  );
}

/* ------------------------------------------------------------------ cards */

function StepCard({ done, mandatory, t, title, id, alert, children }: { done: boolean; mandatory?: boolean; t: T; title: string; id: string; alert?: boolean; children: React.ReactNode }) {
  return (
    <Card style={alert && !done ? { borderColor: 'var(--color-error)' } : undefined}>
      <div className="row gap-3" style={{ alignItems: 'flex-start' }} data-step={id} data-done={done ? 'yes' : 'no'}>
        {done ? <CheckCircle size={32} weight="fill" aria-hidden="true" color="var(--color-success)" /> : alert ? <Warning size={32} aria-hidden="true" color="var(--color-error)" /> : <Circle size={32} aria-hidden="true" color="var(--color-text-secondary)" />}
        <div className="stack gap-2" style={{ flex: 1, minWidth: 0 }}>
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <strong className="t-md">{title}</strong>
            <span className="t-xs" style={{ border: '1px solid var(--color-accent-primary)', borderRadius: 999, padding: '2px 8px', color: 'var(--color-accent-primary)' }}>{t(mandatory ? K.mandatory : K.optional)}</span>
          </div>
          {children}
        </div>
      </div>
    </Card>
  );
}

function DocCard({ d, v, s, t, lang, onSub }: { d: HandoverDocView; v: HandoverChecklistView; s: HandoverState; t: T; lang: string; onSub: (x: Sub) => void }) {
  const open = d.issues.find((i) => !i.resolvedAt);
  const tone = d.state === 'ready' ? 'success' : d.state === 'issue' || d.state === 'outdated' ? 'error' : d.state === 'blocked' ? 'neutral' : 'warning';
  return (
    <StepCard done={d.state === 'ready'} mandatory t={t} title={t(K.docs.name[d.kind])} id={d.kind} alert={d.state === 'issue' || d.state === 'outdated'}>
      <div data-doc={d.kind} data-state={d.state} className="stack gap-2">
        <p className="t-xs t-muted">{t(K.docs.about[d.kind])}</p>
        <div><Badge tone={tone} dot>{t(K.docs.state[d.state])}</Badge></div>
        {d.blockedBy && <p className="t-sm">{t(K.docs.block[d.blockedBy])}</p>}
        {d.current && !d.blockedBy && <p className="t-xs t-muted">{t(K.docs.basis, { quotation: d.current.quotationCode, version: d.current.version, tier: t(`finishTier.${d.current.finishTier}`), drive: t(`driveType.${d.current.driveType}`) })}</p>}
        {d.confirmedAt && d.state === 'ready' && <p className="t-xs t-muted">{t(K.docs.checkedBy, { name: d.confirmedByName ?? '', when: formatDateTime(d.confirmedAt, lang) })}</p>}
        {d.state === 'outdated' && <p className="t-sm" style={{ color: 'var(--color-error)' }}>{t(K.docs.outdated)}</p>}
        {open && (
          <div className="stack gap-1" data-issue>
            <p className="t-sm" style={{ color: 'var(--color-error)' }}>{t(K.docs.issue, { name: open.raisedByName })}: {open.text}</p>
          </div>
        )}
        {d.issues.filter((i) => i.resolvedAt).map((i) => <p key={i.id} className="t-xs t-muted">{t(K.docs.resolved, { name: i.resolvedByName ?? '', when: formatDateTime(i.resolvedAt as string, lang) })}: {i.resolution}</p>)}
        {d.corrections.length > 0 && <p className="t-xs t-muted">{t(K.docs.corrections, { count: d.corrections.length })}: {d.corrections.map((c) => c.note).join('; ')}</p>}
        {v.canEditDocs && (
          <div className="row gap-2 wrap">
            {(d.state === 'pending' || d.state === 'outdated') && <Button className="ds-btn--big" disabled={s.busy} onClick={() => void s.confirmDoc(d.kind)} data-confirm-doc={d.kind}>{t(K.docs.confirm)}</Button>}
            {open && <Button size="sm" variant="secondary" onClick={() => onSub({ kind: 'resolve', doc: d.kind, issueId: open.id })} data-resolve={d.kind}>{t(K.docs.resolve)}</Button>}
            {!open && d.state !== 'blocked' && <Button size="sm" variant="secondary" onClick={() => onSub({ kind: 'report', doc: d.kind })} data-report={d.kind}>{t(K.docs.report)}</Button>}
            {(d.state === 'ready' || d.state === 'pending') && <Button size="sm" variant="ghost" icon={<FileText size={14} aria-hidden="true" />} onClick={() => onSub({ kind: 'typo', doc: d.kind })} data-typo={d.kind}>{t(K.docs.typo)}</Button>}
          </div>
        )}
      </div>
    </StepCard>
  );
}

function TextSheet({ open, onClose, t, title, body, label, hint, min, go, busy, error, onSubmit, dataKey }: { open: boolean; onClose: () => void; t: T; title: string; body?: string; label: string; hint: string; min: number; go: string; busy: boolean; error: string | null; onSubmit: (text: string) => Promise<boolean>; dataKey: string }) {
  const [text, setText] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title={title} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form={dataKey}>
        {body && <p className="t-sm">{body}</p>}
        <Field label={label} hint={hint} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={text} onChange={(e) => setText(e.target.value)} data-text />}
        </Field>
        {error && <p className="t-xs t-error" role="alert">{error}</p>}
        <div className="row gap-2 wrap">
          <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
          <Button disabled={text.trim().length < min || busy} data-go={dataKey} onClick={async () => { if (await onSubmit(text)) setText(''); }}>{go}</Button>
        </div>
      </div>
    </Sheet>
  );
}
