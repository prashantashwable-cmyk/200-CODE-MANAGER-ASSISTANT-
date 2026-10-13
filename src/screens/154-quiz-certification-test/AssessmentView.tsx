import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Medal, CaretLeft, CheckCircle, CloudSlash, Gauge, GraduationCap, Lock, PencilSimple, Timer, Warning, XCircle } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Sheet, formatDateTime } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { AssessmentAttemptView, AssessmentOverviewRow, AssessmentResultView, AssessmentView } from '@/data/repository';
import { ASSESS_KEYS as K, qBase } from './assessment.types';
import { useAssessment } from './useAssessment';
import type { AssessmentState } from './useAssessment';

type T = ReturnType<typeof useTranslation>['t'];
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const moduleTitle = (t: T, code: string) => t(`trainingLib.content.${code.toLowerCase()}.title`, { defaultValue: code });

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

/**
 * Screen 154 — Quiz & Certification Test. The formal test that follows a module, as a wizard: what the test asks and what happens if you do not pass,
 * one step per question, a review of every answer, then the result with a kind explanation of anything missed. Passing issues the certification (and,
 * for the safety modules, is what lets a technician be given a job); not passing earns a cooldown, never a dead end.
 */
export function AssessmentScreen() {
  const { t } = useTranslation();
  const s = useAssessment();
  if (s.status === 'loading') return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="block" /></Screen>;
  if (s.status === 'error') {
    if (s.errorCode === 'no_assessment' || s.errorCode === 'not_found' || s.errorCode === 'forbidden' || s.errorCode === 'not_for_you' || s.errorCode === 'retired' || s.errorCode === 'locked') {
      return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><EmptyState icon={<GraduationCap size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={s.toLibrary} /></Screen>;
    }
    return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  }
  if (s.isAdmin) return <AdminOverview s={s} t={t} />;
  if (!s.view) return null;
  if (s.attempt) return <Wizard s={s} t={t} attempt={s.attempt} view={s.view} />;
  return <Overview s={s} t={t} view={s.view} />;
}

/* ------------------------------------------------------------------ before and after: the state of the test */

function Overview({ s, t, view }: { s: AssessmentState; t: T; view: AssessmentView }) {
  const { i18n } = useTranslation();
  const [problem, setProblem] = useState<string | null>(null);
  const code = view.moduleCode;
  const left = view.cooldownUntil ? Math.max(0, Date.parse(view.cooldownUntil) - s.now) : 0;
  const cooling = view.state === 'cooldown' && left > 0;
  const result = s.result ?? view.last;
  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.ceil((left % 3_600_000) / 60_000);
  return (
    <Screen width="narrow">
      <ScreenHeader title={moduleTitle(t, code)} subtitle={t(K.title)} action={<Button size="sm" variant="ghost" icon={<CaretLeft size={14} />} onClick={s.toLibrary}>{t(K.back)}</Button>} />
      {!s.online && <p className="t-sm row gap-2" role="status" data-offline-banner style={{ alignItems: 'center', color: 'var(--color-warning)' }}><CloudSlash size={16} aria-hidden="true" /> {t(K.rules.offline)}</p>}
      <div className="stack gap-3" data-overview data-state={view.state}>
        {s.result && <ResultCard r={s.result} t={t} lang={i18n.language} s={s} />}
        {view.state === 'certified' && (
          <Card>
            <div className="stack gap-2" data-badge>
              <span className="row gap-2" style={{ alignItems: 'center' }}><Medal size={26} weight="fill" aria-hidden="true" style={{ color: 'var(--color-accent-primary)' }} /><strong className="t-lg">{t(K.badge.heading)}</strong></span>
              <p className="t-sm">{t(K.badge.body, { module: moduleTitle(t, code) })}</p>
              {view.badge && <p className="t-xs t-muted">{t(K.badge.earned, { date: formatDateTime(view.badge.issuedAt, i18n.language) })} · {t(K.badge.score, { score: view.badge.score })} · {view.badge.expiresAt ? t(K.badge.expires, { date: formatDateTime(view.badge.expiresAt, i18n.language) }) : t(K.badge.noExpiry)}</p>}
              {view.badge && <p className="t-xs t-muted" data-code>{t(K.badge.code, { code: view.badge.code })}</p>}
              <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} data-my-certs onClick={() => s.navigateTo('/certifications')}>{t(K.badge.mine)}</Button>
            </div>
          </Card>
        )}
        {view.state === 'certified' && view.canRenew && (
          <Card>
            <div className="stack gap-2" data-renewal="due_soon">
              <strong className="t-md">{t(K.renewal.renew)}</strong>
              <p className="t-sm">{t(K.renewal.dueSoon, { date: view.badge?.expiresAt ? formatDateTime(view.badge.expiresAt, i18n.language) : '' })}</p>
              {problem && <p className="t-xs t-error" role="alert" data-problem={problem}>{t(problemKey(problem))}</p>}
              <Button style={{ width: 'fit-content' }} data-start disabled={s.busy || !s.online || cooling} onClick={async () => { const r = await s.begin(); if (!r.ok) setProblem(r.code ?? 'generic'); }}>{view.state === 'certified' && view.draft ? t(K.action.resume) : t(K.action.start)}</Button>
            </div>
          </Card>
        )}
        {view.state !== 'certified' && (
          <Card>
            <div className="stack gap-3" data-state-card>
              <span className="row gap-2" style={{ alignItems: 'center' }}>
                {view.state === 'locked' ? <Lock size={20} aria-hidden="true" /> : view.state === 'cooldown' ? <Timer size={20} aria-hidden="true" /> : <GraduationCap size={20} aria-hidden="true" />}
                <strong className="t-md">{t(K.state[view.state])}</strong>
              </span>
              <p className="t-sm">{t(K.stateBody[view.state])}</p>
              {view.renewal === 'expired' && view.lastExpiredAt && <p className="t-sm" data-lapsed style={{ color: 'var(--color-warning)' }}>{t(K.renewal.expired, { date: formatDateTime(view.lastExpiredAt, i18n.language) })}</p>}
              {cooling && <p className="t-sm" role="status" data-cooldown><strong>{t(K.rules.cooldownLeft, { hours, minutes })}</strong> · {t(K.rules.cooldownEnds, { time: formatDateTime(view.cooldownUntil as string, i18n.language) })}</p>}
              <Rules view={view} t={t} />
              {view.gatesJobAssignment && <p className="t-xs" data-gates style={{ color: 'var(--color-warning)' }}>{t(K.rules.gates)}</p>}
              {problem && <p className="t-xs t-error" role="alert" data-problem={problem}>{t(problemKey(problem))}</p>}
              <div className="row gap-2 wrap">
                {(view.state === 'to_take' || view.state === 'in_progress') && <Button data-start disabled={s.busy || !s.online} onClick={async () => { const r = await s.begin(); if (!r.ok) setProblem(r.code ?? 'generic'); }}>{view.state === 'in_progress' ? t(K.action.resume) : t(K.action.start)}</Button>}
                {(view.state === 'locked' || view.state === 'cooldown') && <Button variant={view.state === 'locked' ? 'primary' : 'secondary'} data-lessons onClick={s.toLessons}>{view.state === 'cooldown' ? t(K.action.studyAgain) : t(K.action.lessons)}</Button>}
              </div>
            </div>
          </Card>
        )}
        {result && !s.result && <ResultCard r={result} t={t} lang={i18n.language} s={s} compact />}
        {view.history.length > 0 && (
          <section className="stack gap-2" data-history>
            <h2 className="t-md">{t(K.history.heading)}</h2>
            {view.history.map((h) => (
              <Card key={h.attemptNumber}>
                <div className="row between gap-2" style={{ alignItems: 'center' }} data-attempt={h.attemptNumber}>
                  <span className="stack"><strong className="t-sm">{t(K.history.row, { n: h.attemptNumber, score: h.score })}</strong><span className="t-xs t-muted">{formatDateTime(h.submittedAt, i18n.language)}</span></span>
                  <Badge tone={h.passed ? 'success' : 'neutral'}>{h.passed ? t(K.history.passed) : t(K.history.notPassed)}</Badge>
                </div>
              </Card>
            ))}
          </section>
        )}
      </div>
    </Screen>
  );
}

function Rules({ view, t }: { view: AssessmentView; t: T }) {
  const [a, b, c] = view.cooldownHours;
  return (
    <div className="stack gap-1" data-rules>
      <strong className="t-sm">{t(K.rules.heading)}</strong>
      <ul className="stack gap-1" style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
        <li className="t-sm">{t(K.rules.questions, { count: view.questionCount })}</li>
        <li className="t-sm">{t(K.rules.pass, { percent: view.passPercent })}</li>
        <li className="t-sm">{t(K.rules.attempt, { n: view.nextAttemptNumber })}</li>
        <li className="t-sm">{t(K.rules.version, { version: view.version })}</li>
        <li className="t-sm">{t(K.rules.retakeBody, { first: a, second: b, third: c })}</li>
        {view.validMonths && <li className="t-sm">{t(K.renewal.validFor, { months: view.validMonths })}</li>}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ the wizard */

function Wizard({ s, t, attempt, view }: { s: AssessmentState; t: T; attempt: AssessmentAttemptView; view: AssessmentView }) {
  const code = attempt.moduleCode;
  const n = attempt.questions.length;
  const answered = (id: string) => (s.answers[id]?.length ?? 0) > 0;
  const allAnswered = attempt.questions.every((q) => answered(q.id));
  const steps: AscensionStep[] = [
    { id: 'start', label: t(K.wizard.start), status: s.step === 0 ? 'current' : 'complete', onClick: () => s.goto(0) },
    ...attempt.questions.map((q, i) => ({
      id: q.id, label: t(K.wizard.question, { n: i + 1 }),
      status: (s.step === i + 1 ? 'current' : answered(q.id) ? 'complete' : 'upcoming') as AscensionStep['status'],
      onClick: answered(q.id) || s.maxStep >= i + 1 ? () => s.goto(i + 1) : undefined,
    })),
    { id: 'review', label: t(K.wizard.review), status: s.step === n + 1 ? 'current' : 'upcoming', onClick: allAnswered || s.maxStep >= n + 1 ? () => s.goto(n + 1) : undefined },
  ];
  const q = s.step >= 1 && s.step <= n ? attempt.questions[s.step - 1] : null;
  const isReview = s.step === n + 1;
  return (
    <Screen width="narrow">
      <ScreenHeader title={moduleTitle(t, code)} subtitle={t(K.rules.attempt, { n: attempt.attemptNumber })} action={<Button size="sm" variant="ghost" icon={<CaretLeft size={14} />} data-leave onClick={s.leaveWizard}>{t(K.back)}</Button>} />
      <div className="stack gap-3 pb-action-bar" data-wizard data-step={s.step}>
        <div style={{ overflowX: 'auto', paddingBottom: 'var(--space-2)' }} data-steps aria-label={t(K.wizard.steps)}>
          <div style={{ minWidth: Math.max(300, steps.length * 92) }}><AscensionLine steps={steps} orientation="horizontal" /></div>
        </div>
        <p className="t-xs t-muted" role="status" data-saved={s.saved}>{s.saved === 'server' ? t(K.wizard.saved) : t(K.wizard.savedLocal)}</p>
        {s.step === 0 && (
          <Card>
            <div className="stack gap-3" data-intro>
              <p className="t-sm">{t(K.wizard.resumed, { count: Object.keys(s.answers).length, total: n })}</p>
              <Rules view={view} t={t} />
            </div>
          </Card>
        )}
        {q && <QuestionCard s={s} t={t} code={code} q={q} index={s.step} total={n} />}
        {isReview && <ReviewCard s={s} t={t} attempt={attempt} code={code} />}
      </div>
      <ActionBar>
        <div className="stack gap-1" style={{ width: '100%' }}>
          <div className="row gap-2" data-nav>
            <Button variant="secondary" disabled={s.step === 0} data-back-step onClick={() => s.goto(s.step - 1)}>{t(K.wizard.back)}</Button>
            {!isReview ? (
              <Button style={{ flex: 1 }} data-next disabled={q ? !answered(q.id) : false} onClick={() => s.goto(s.step + 1)}>{q && s.step === n ? t(K.wizard.toReview) : t(K.wizard.next)}</Button>
            ) : (
              <SubmitButton s={s} t={t} allAnswered={allAnswered} />
            )}
          </div>
          {q && !answered(q.id) && <p className="t-xs t-muted" style={{ textAlign: 'center' }}>{t(K.wizard.answerFirst)}</p>}
        </div>
      </ActionBar>
    </Screen>
  );
}

function QuestionCard({ s, t, code, q, index, total }: { s: AssessmentState; t: T; code: string; q: AssessmentAttemptView['questions'][number]; index: number; total: number }) {
  const base = qBase(code, q.id);
  const sel = s.answers[q.id] ?? [];
  const multi = q.kind === 'multi';
  return (
    <Card>
      <div className="stack gap-3" data-question={q.id} data-kind={q.kind}>
        <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
          <strong className="t-sm">{t(K.wizard.questionOf, { n: index, total })}</strong>
          <span className="t-xs t-muted">{multi ? t(K.wizard.multi) : t(K.wizard.single)}</span>
        </div>
        <p className="t-md" data-q>{t(`${base}.q`)}</p>
        <div className="stack gap-2" role={multi ? 'group' : 'radiogroup'} aria-label={t(`${base}.q`)}>
          {Array.from({ length: q.options }, (_, i) => {
            const on = sel.includes(i);
            return (
              <button key={i} type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={on} data-option={i} onClick={() => s.choose(q.id, i, multi)} className="row gap-3" style={{ textAlign: 'left', minHeight: 48, padding: 'var(--space-3)', borderRadius: 'var(--radius-md, 12px)', border: `1px solid ${on ? 'var(--color-accent-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-bg)' : 'var(--color-surface)', color: 'inherit', cursor: 'pointer', alignItems: 'center' }}>
                <span aria-hidden="true" style={{ width: 20, height: 20, flex: '0 0 auto', borderRadius: multi ? 4 : '50%', border: `2px solid ${on ? 'var(--color-accent-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-accent-primary)' : 'transparent' }} />
                <span className="t-sm">{t(`${base}.o.${i}`)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ReviewCard({ s, t, attempt, code }: { s: AssessmentState; t: T; attempt: AssessmentAttemptView; code: string }) {
  const missing = attempt.questions.filter((q) => (s.answers[q.id]?.length ?? 0) === 0).length;
  return (
    <Card>
      <div className="stack gap-3" data-review>
        <strong className="t-md">{t(K.review.heading)}</strong>
        <p className="t-sm">{t(K.review.body)}</p>
        {missing > 0 && <p className="t-sm" data-missing style={{ color: 'var(--color-warning)' }}>{t(K.review.missing, { count: missing })}</p>}
        <div className="stack gap-2">
          {attempt.questions.map((q, i) => {
            const sel = s.answers[q.id] ?? [];
            const base = qBase(code, q.id);
            return (
              <div key={q.id} className="stack gap-1" data-review-row={q.id} style={{ borderTop: i ? '1px solid var(--color-border)' : 0, paddingTop: i ? 'var(--space-2)' : 0 }}>
                <span className="t-sm"><strong>{i + 1}.</strong> {t(`${base}.q`)}</span>
                {sel.length ? <span className="t-xs">{t(K.review.answered)} {sel.map((x) => t(`${base}.o.${x}`)).join(' · ')}</span> : <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.review.unanswered)}</span>}
                <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} icon={<PencilSimple size={14} />} data-change={i + 1} onClick={() => s.goto(i + 1)}>{t(K.review.change)}</Button>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function SubmitButton({ s, t, allAnswered }: { s: AssessmentState; t: T; allAnswered: boolean }) {
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <div className="stack gap-1" style={{ flex: 1 }}>
      <Button data-submit disabled={!allAnswered || s.busy || !s.online} loading={s.busy} onClick={async () => { const r = await s.submit(); if (!r.ok) setProblem(r.code ?? 'generic'); }}>{t(K.review.submit)}</Button>
      {!s.online && <span className="t-xs t-muted">{t(K.review.needSignal)}</span>}
      {problem && <span className="t-xs t-error" role="alert" data-problem={problem}>{t(problemKey(problem))}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ the result */

function ResultCard({ r, t, lang, s, compact }: { r: AssessmentResultView; t: T; lang: string; s: AssessmentState; compact?: boolean }) {
  const code = r.moduleCode;
  const moduleId = r.moduleId;
  const wrong = r.review.filter((x) => !x.correct);
  return (
    <Card>
      <div className="stack gap-3" data-result={r.passed ? 'passed' : 'failed'} data-attempt-result={r.attemptNumber}>
        <span className="row gap-2" style={{ alignItems: 'center' }}>
          {r.passed ? <CheckCircle size={26} weight="fill" aria-hidden="true" style={{ color: 'var(--color-success)' }} /> : <Gauge size={26} aria-hidden="true" style={{ color: 'var(--color-warning)' }} />}
          <strong className="t-lg">{r.passed ? t(K.result.passed) : t(K.result.notPassed)}</strong>
        </span>
        <p className="t-sm" data-score><strong>{t(K.result.score, { score: r.score })}</strong> · {t(K.result.correctOf, { correct: r.correctCount, total: r.total })} · {t(K.result.needed, { percent: r.passPercent })}</p>
        {r.passed && r.badge && <p className="t-sm" data-badge-issued>{t(K.result.badge)} {t(K.result.badgeBody, { module: moduleTitle(t, code) })}</p>}
        {r.passed && r.gatesJobAssignment && r.jobGateCleared !== null && <p className="t-xs" data-gate-note>{r.jobGateCleared ? t(K.result.gateCleared) : t(K.result.gateStillOpen)}</p>}
        {!r.passed && <p className="t-sm">{t(K.result.kind)}</p>}
        {!r.passed && r.nextAttemptAt && <p className="t-sm" data-retry-at>{t(K.result.retryAt, { time: formatDateTime(r.nextAttemptAt, lang) })}</p>}
        {!r.passed && r.coaching && <p className="t-xs t-muted" data-coaching>{t(K.result.coaching)}</p>}
        {!compact && (
          <div className="stack gap-2" data-feedback>
            <strong className="t-md">{t(K.result.feedback)}</strong>
            {wrong.length === 0 ? <p className="t-sm">{t(K.result.allRight)}</p> : wrong.map((w) => <Feedback key={w.questionId} row={w} code={code} moduleId={moduleId} t={t} />)}
          </div>
        )}
        {compact && wrong.length > 0 && (
          <details data-feedback-compact>
            <summary className="t-sm" style={{ cursor: 'pointer' }}>{t(K.result.feedback)}</summary>
            <div className="stack gap-2 mt-2">{wrong.map((w) => <Feedback key={w.questionId} row={w} code={code} moduleId={moduleId} t={t} />)}</div>
          </details>
        )}
        {s.result && <Button variant="secondary" style={{ width: 'fit-content' }} data-result-done onClick={s.clearResult}>{t(K.result.done)}</Button>}
      </div>
    </Card>
  );
}

function Feedback({ row, code, moduleId, t }: { row: AssessmentResultView['review'][number]; code: string; moduleId: string; t: T }) {
  const base = qBase(code, row.questionId);
  const opts = (xs: number[]) => (xs.length ? xs.map((x) => t(`${base}.o.${x}`)).join(' · ') : '—');
  return (
    <div className="stack gap-1" data-wrong={row.questionId} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
      <span className="row gap-2" style={{ alignItems: 'baseline' }}><XCircle size={16} aria-hidden="true" style={{ color: 'var(--color-warning)' }} /><span className="t-sm"><strong>{t(`${base}.q`)}</strong></span></span>
      <span className="t-xs">{t(K.result.yourAnswer)} {opts(row.selected)}</span>
      <span className="t-xs"><strong>{t(K.result.rightAnswer)}</strong> {opts(row.correctAnswer)}</span>
      <span className="t-xs t-muted" data-why>{t(`${base}.why`)}</span>
      <Link to={`/training-feedback/${moduleId}?question=${row.questionId}`} className="t-xs" data-wrong-question={row.questionId}>{t('trainingFeedback.link.wrongQuestion')}</Link>
    </div>
  );
}

/* ------------------------------------------------------------------ Admin */

function AdminOverview({ s, t }: { s: AssessmentState; t: T }) {
  const { i18n } = useTranslation();
  const [editing, setEditing] = useState<AssessmentOverviewRow | null>(null);
  const rows = s.overview?.rows ?? [];
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.admin.heading)} subtitle={t(K.admin.intro)} action={<span className="row gap-2 wrap"><Button size="sm" variant="secondary" data-refreshers onClick={() => s.navigateTo('/refreshers')}>{t(K.admin.refreshers)}</Button><Button size="sm" variant="secondary" data-skill-matrix onClick={() => s.navigateTo('/skill-matrix')}>{t(K.admin.skillMatrix)}</Button><Button size="sm" variant="secondary" data-compliance onClick={() => s.navigateTo('/training-compliance')}>{t(K.admin.compliance)}</Button><Button size="sm" variant="secondary" data-feedback-link onClick={() => s.navigateTo('/training-feedback')}>{t('trainingFeedback.link.admin')}</Button></span>} />
      <p className="t-xs t-muted" data-placeholder-note>{t(K.admin.placeholder)}</p>
      {rows.length === 0 ? <EmptyState icon={<GraduationCap size={28} />} title={t(K.admin.empty)} body="" /> : (
        <div className="grid-auto mt-3" style={{ '--min': '360px', alignItems: 'start' } as React.CSSProperties} data-admin>
          {rows.map((r) => (
            <Card key={r.assessmentId}>
              <div className="stack gap-2" data-assessment={r.assessmentId}>
                <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
                  <strong className="t-md">{moduleTitle(t, r.moduleCode)}</strong>
                  <Button size="sm" variant="ghost" icon={<PencilSimple size={14} />} data-edit={r.assessmentId} onClick={() => setEditing(r)}>{t(K.admin.edit)}</Button>
                </div>
                <p className="t-xs t-muted">{t(K.admin.questionsOf, { count: r.questionCount, version: r.version })} · {t(K.admin.pass, { percent: r.passPercent })} · {t(K.admin.cooldowns, { first: r.cooldownHours[0], second: r.cooldownHours[1], third: r.cooldownHours[2] })} · {r.validMonths ? t(K.admin.validRow, { months: r.validMonths }) : t(K.admin.noExpiryRow)}</p>
                <p className="t-sm">{t(K.admin.attempts, { count: r.attempts })} · {t(K.admin.passes, { count: r.passes })} · {t(K.admin.certified, { count: r.certified })}</p>
                <div className="stack gap-1" data-struggling>
                  <strong className="t-sm">{t(K.admin.struggling)}</strong>
                  {r.struggling.length === 0 ? <span className="t-xs t-muted">{t(K.admin.strugglingNone)}</span> : r.struggling.map((p) => (
                    <span key={p.userId} className="t-sm" data-struggler={p.userId} style={s.partner === p.userId ? { background: 'var(--color-bg)', padding: 4, borderRadius: 8 } : undefined}>{t(K.admin.strugglingRow, { name: p.name, count: p.fails, date: formatDateTime(p.lastAt, i18n.language) })}</span>
                  ))}
                  {r.struggling.length > 0 && <span className="t-xs t-muted">{t(K.admin.coachingNote)}</span>}
                </div>
                <div className="stack gap-1" data-lapsed-list>
                  <strong className="t-sm">{t(K.admin.lapsed)}</strong>
                  {r.lapsed.length === 0 ? <span className="t-xs t-muted">{t(K.admin.lapsedNone)}</span> : r.lapsed.map((p) => (
                    <span key={p.userId} className="t-sm" data-lapsed={p.userId}>{t(K.admin.lapsedRow, { name: p.name, date: formatDateTime(p.endedAt, i18n.language), count: p.openJobs })}</span>
                  ))}
                  {r.lapsed.length > 0 && <span className="t-xs t-muted">{t(K.admin.lapsedNote)}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <ConfigSheet s={s} t={t} row={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

function ConfigSheet({ s, t, row, onClose }: { s: AssessmentState; t: T; row: AssessmentOverviewRow | null; onClose: () => void }) {
  const [pass, setPass] = useState('80');
  const [c, setC] = useState(['1', '4', '24']);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (row) { setPass(String(row.passPercent)); setC(row.cooldownHours.map(String)); setError(null); } }, [row?.assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={!!row} onClose={onClose} title={t(K.admin.editTitle)} closeLabel={t(K.close)}>
      {row && (
        <div className="stack gap-3" data-form="config">
          <p className="t-sm">{t(K.admin.editBody, { module: moduleTitle(t, row.moduleCode) })}</p>
          <Field label={t(K.admin.passPercent)} hint={t(K.admin.passHint)}>{(p) => <Input id={p.id} type="number" inputMode="numeric" min={50} max={100} value={pass} onChange={(e) => setPass(e.target.value)} data-f="pass" />}</Field>
          {[0, 1, 2].map((i) => <Field key={i} label={t([K.admin.cooldown1, K.admin.cooldown2, K.admin.cooldown3][i])} hint={i === 0 ? t(K.admin.cooldownHint) : undefined}>{(p) => <Input id={p.id} type="number" inputMode="numeric" min={0} max={168} value={c[i]} onChange={(e) => setC(c.map((x, n) => (n === i ? e.target.value : x)))} data-f={`cooldown${i + 1}`} />}</Field>)}
          <p className="t-xs t-muted" data-cadence-note>{t(K.admin.cadenceNote)}</p>
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
          <Footer>
            <Button variant="ghost" onClick={onClose}>{t(K.admin.cancel)}</Button>
            <Button disabled={s.busy} data-save-config onClick={async () => { const r = await s.saveConfig(row, { passPercent: Number(pass), cooldownHours: [Number(c[0]), Number(c[1]), Number(c[2])] }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.admin.save)}</Button>
          </Footer>
        </div>
      )}
    </Sheet>
  );
}
