import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Certificate, CheckCircle, Circle, DownloadSimple, FileText, Scales } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Sheet, StatTile, TextArea, formatDate, formatINR } from '@/design-system';
import type { CompletionPayoutLineView, CompletionView } from '@/data/repository';
import type { CompletionMilestone } from '@/data/types';
import { JUDGEMENT_DECISIONS, judgementProblem } from '@/features/commission/finalPayout';
import { IssuerBlock } from '@/features/brand/IssuerBlock';
import { useBrandAt } from '@/features/brand/BrandProvider';
import { displayName } from '@/features/brand/brand';
import { useCompletion } from './useCompletion';
import type { ActionResult, CompletionState } from './useCompletion';
import { COMPLETION_KEYS as K, boardPath, walkthroughPath, warrantyPath } from './completion.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const day = (d: string) => `${d}T12:00:00Z`;
const STANDARDS = ['IS_14665', 'IS_15259', 'IS_14671'];
const standardLabel = (t: T, id: string) => (STANDARDS.includes(id) ? t(`compliance.standard.${id}`) : id);

/**
 * Screen 140 — Handover Completion Certificate. The project's closing record: a premium, single summary of the whole journey (survey to
 * warranty) that the customer keeps for good, and the one event Admin uses to close the project, set the job completed and trigger every
 * final payout. Detail layout: a hero, then stacked sections, with the Ascension Line for the project's history.
 */
export function CompletionScreen() {
  const { t } = useTranslation();
  const s = useCompletion();
  const wrap = (body: JSX.Element) => (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} />
      {body}
    </Screen>
  );
  // A customer with a single project is taken straight to it.
  useEffect(() => {
    if (!s.jobId && s.board && s.board.viewer === 'customer' && s.board.rows.length === 1) s.goto(`${boardPath}/${s.board.rows[0].jobId}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.board, s.jobId]);
  if (s.status === 'not_found') return wrap(<EmptyState icon={<Certificate size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />);
  if (s.status === 'loading' && !s.view && !s.board) return wrap(<LoadingState label={t(K.loading)} variant="list" rows={4} />);
  if (s.status === 'error' || (!s.view && !s.board)) return wrap(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  if (!s.jobId && s.board) return <Board s={s} t={t} />;
  return s.view ? <Detail s={s} v={s.view} t={t} /> : null;
}

function Board({ s, t }: { s: CompletionState; t: T }) {
  const { i18n } = useTranslation();
  const b = s.board!;
  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={t(K.board.heading)} />
      {b.rows.length === 0 ? (
        <EmptyState icon={<Certificate size={32} />} title={t(K.board.emptyTitle)} body={t(K.board.emptyBody)} />
      ) : (
        <Card>
          <div className="stack">
            {b.rows.map((r) => (
              <button key={r.jobId} type="button" onClick={() => s.goto(`${boardPath}/${r.jobId}`)} data-job={r.jobId} className="row gap-3" style={{ minHeight: 64, alignItems: 'center', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2) 0', cursor: 'pointer', color: 'inherit' }}>
                <span className="stack" style={{ flex: 1 }}>
                  <strong className="t-sm">{r.siteName}</strong>
                  <span className="t-xs t-muted">{r.code}{r.certificateNo ? ` · ${r.certificateNo}` : ''}{r.issuedAt ? ` · ${formatDate(r.issuedAt, i18n.language)}` : ''}</span>
                </span>
                <Badge tone={r.status === 'issued' ? 'success' : r.status === 'ready' ? 'accent' : 'neutral'} dot>{t(K.status[r.status])}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}
    </Screen>
  );
}

function Problem({ code, t }: { code: string | null; t: T }) {
  return code ? <p className="t-xs t-error" role="alert" data-problem={code}>{t(errorKey(code))}</p> : null;
}

/* ------------------------------------------------------------------ facts in words, so the summary reads in whichever language is active */

function factLine(m: CompletionMilestone, t: T): string | null {
  const f = m.facts;
  switch (m.id) {
    case 'survey':
      return Number(f.visits) > 0 ? t(K.lifecycle.fact.visits, { count: Number(f.visits) }) : null;
    case 'quotation':
      return Number(f.value) > 0 ? t(K.lifecycle.fact.value, { value: formatINR(Number(f.value)) }) : null;
    case 'delivery':
      return Number(f.count) > 0 ? t(K.lifecycle.fact.count, { count: Number(f.count) }) : null;
    case 'installation':
      return m.at ? t(K.lifecycle.fact.installation, { steps: f.steps, people: f.people, days: f.days }) : null;
    case 'compliance':
      return f.standard ? t(K.lifecycle.fact.standard, { standard: standardLabel(t, String(f.standard)) }) : null;
    case 'handover':
      return m.at ? t(Number(f.signed) === 1 ? K.lifecycle.fact.signed : K.lifecycle.fact.unsigned) : null;
    case 'warranty':
      return Number(f.parts) > 0 ? t(K.lifecycle.fact.parts, { count: Number(f.parts) }) : null;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ the page */

function Detail({ s, v, t }: { s: CompletionState; v: CompletionView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const staff = v.viewer === 'admin';
  const [confirm, setConfirm] = useState(false);
  const sm = v.summary;
  const showBar = v.issued || v.actions.issue;
  const amc = sm.warranty?.amc ?? null;
  const issuer = useBrandAt(v.issuedAt ?? null);
  return (
    <Screen width="narrow" className={showBar ? 'pb-action-bar' : undefined}>
      <ScreenHeader title={t(K.title)} subtitle={`${sm.siteName} · ${sm.jobCode}`} action={<span data-status={v.status}><Badge tone={v.issued ? 'success' : v.status === 'ready' ? 'accent' : 'neutral'} dot>{t(K.status[v.status])}</Badge></span>} />

      <Card className="mb-3">
        <div className="stack gap-3" data-hero style={{ borderTop: '2px solid var(--color-accent-primary)', paddingTop: 'var(--space-3)' }}>
          <IssuerBlock at={v.issuedAt ?? null} />
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <Certificate size={26} aria-hidden="true" color="var(--color-accent-primary)" />
            <strong className="t-lg">{t(K.hero.heading)}</strong>
          </div>
          {v.issued && v.certificateNo && v.issuedAt ? (
            <>
              <p className="t-sm"><strong className="num" data-certificate-no>{v.certificateNo}</strong> · {t(K.hero.issued, { date: formatDate(v.issuedAt, lang), name: v.issuedByName ?? '' })}</p>
              <p className="t-sm">{t(K.hero.statement, { site: sm.siteName })}</p>
            </>
          ) : (
            <p className="t-sm" data-preparing>{t(K.hero.preparing)}</p>
          )}
          <p className="t-xs t-muted">{t(K.hero.customer, { name: sm.customerName })}</p>
          <div className="grid-auto" style={{ gap: 'var(--space-2)' }}>
            <StatTile label={t(K.hero.complete)} value={v.issuedAt ? formatDate(v.issuedAt, lang) : '—'} />
            <StatTile label={t(K.hero.warrantyUntil)} value={sm.warranty ? formatDate(day(sm.warranty.serviceEndsOn), lang) : '—'} />
            <StatTile label={t(K.hero.amc)} value={amc?.status === 'active' && amc.endsOn ? formatDate(day(amc.endsOn), lang) : t(K.hero.amcNone)} />
          </div>
          {v.issued && <p className="t-xs t-muted">{t(K.hero.permanent)}</p>}
        </div>
      </Card>

      {!v.issued && <Readiness s={s} v={v} t={t} />}

      <Card className="mb-3">
        <div className="stack gap-2" data-project>
          <strong className="t-md">{t(K.project.heading)}</strong>
          <dl className="stack gap-2" style={{ margin: 0 }}>
            {[
              [K.project.site, `${sm.siteName}${sm.address ? `, ${sm.address}` : ''}`],
              [K.project.customer, sm.customerName],
              [K.project.deal, `${sm.dealCode} · ${sm.jobCode}`],
              [K.project.value, sm.value > 0 ? formatINR(sm.value) : ''],
              [K.project.drive, sm.driveType ? t(`driveType.${sm.driveType}`, { defaultValue: sm.driveType }) : ''],
              [K.project.finish, sm.finishTier ? t(`finishTier.${sm.finishTier}`, { defaultValue: sm.finishTier }) : ''],
              [K.project.capacity, sm.capacityPersons ? String(sm.capacityPersons) : ''],
              [K.project.stops, sm.stops ? String(sm.stops) : ''],
            ]
              .filter(([, val]) => val)
              .map(([label, val]) => (
                <div key={label} className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <dt className="t-xs t-muted">{t(label)}</dt>
                  <dd className="t-sm" style={{ margin: 0, textAlign: 'right' }}>{val}</dd>
                </div>
              ))}
          </dl>
          <div className="stack gap-1" data-compliance style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
            <strong className="t-sm">{t(K.project.compliance)}</strong>
            {sm.compliance ? <p className="t-sm">{t(K.lifecycle.fact.standard, { standard: standardLabel(t, sm.compliance.standard) })} · <span className="num">{sm.compliance.code}</span> · {formatDate(sm.compliance.issuedAt, lang)}{sm.compliance.state ? ` · ${sm.compliance.state}` : ''}</p> : <p className="t-sm t-muted">{t(K.project.complianceNone)}</p>}
            <p className="t-xs t-muted">{t(K.project.complianceNote)}</p>
          </div>
          <div className="stack gap-1" data-warranty style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
            <strong className="t-sm">{t(K.project.warranty)}</strong>
            {sm.warranty ? (
              <>
                <p className="t-sm">{t(K.project.warrantyLine, { from: formatDate(day(sm.warranty.startsOn), lang), to: formatDate(day(sm.warranty.serviceEndsOn), lang), count: sm.warranty.partsCount })}</p>
                <p className="t-sm">{amc ? (amc.status === 'active' ? t(K.project.amcActive, { tier: amc.tier ? t(`warranty.amc.tier.${amc.tier}`) : '', date: amc.endsOn ? formatDate(day(amc.endsOn), lang) : '' }) : t(amc.status === 'later' ? K.project.amcLater : K.project.amcDeclined)) : ''}</p>
              </>
            ) : (
              <p className="t-sm t-muted">{t(K.project.warrantyNone)}</p>
            )}
          </div>
          {staff && v.signoffWaived && <p className="t-xs" data-waived><Badge tone="warning">{t(K.project.waived)}</Badge> {v.signoffWaived.reason}</p>}
        </div>
      </Card>

      <Card className="mb-3">
        <div className="stack gap-3" data-lifecycle>
          <strong className="t-md">{t(K.lifecycle.heading)}</strong>
          <p className="t-xs t-muted">{t(K.lifecycle.intro)}</p>
          <AscensionLine
            orientation="vertical"
            steps={sm.milestones.map((m) => {
              const fact = factLine(m, t);
              const parts = [m.at ? formatDate(m.at, lang) : t(K.lifecycle.notOnRecord), m.ref, m.byName ? t(K.lifecycle.by, { name: m.byName }) : null, fact].filter(Boolean);
              return { id: m.id, label: t(K.lifecycle.milestone[m.id]), meta: parts.join(' · '), status: m.at ? 'complete' : 'upcoming' };
            })}
          />
        </div>
      </Card>

      <Card className="mb-3">
        <div className="stack gap-2" data-team>
          <strong className="t-md">{t(K.team.heading)}</strong>
          <p className="t-xs t-muted">{t(K.team.intro)}</p>
          {v.team.length === 0 ? <p className="t-sm">{t(K.team.none)}</p> : v.team.map((p) => (
            <div key={p.userId} className="stack" data-person={p.userId} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              <strong className="t-sm">{p.name}</strong>
              <span className="t-xs t-muted">{p.roles.map((r) => t(K.team.role[r])).join(' · ')}</span>
              {staff && (p.minutes > 0 || p.steps > 0 || p.results > 0) && (
                <span className="t-xs">{t(K.team.work, { parts: [p.minutes > 0 ? t(K.team.hours, { hours: Math.round(p.minutes / 6) / 10 }) : '', p.steps > 0 ? t(K.team.steps, { count: p.steps }) : '', p.results > 0 ? t(K.team.results, { count: p.results }) : ''].filter(Boolean).join(' · ') })}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-3">
        <div className="stack gap-2" data-docs>
          <strong className="t-md">{t(K.docs.heading)}</strong>
          <p className="t-xs t-muted">{t(K.docs.intro)}</p>
          {v.documents.map((d) => (
            <div key={d.id} className="row gap-3" data-doc={d.id} style={{ alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', minHeight: 48 }}>
              <span className="row gap-2" style={{ alignItems: 'center', flex: 1 }}>
                <FileText size={20} aria-hidden="true" color="var(--color-accent-secondary)" />
                <span className="stack"><strong className="t-sm">{t(K.docs.doc[d.id])}</strong><span className="t-xs t-muted">{[d.ref, d.at ? formatDate(d.at, lang) : null].filter(Boolean).join(' · ') || (d.route ? '' : t(K.docs.onRecord))}</span></span>
              </span>
              {d.route ? <Button variant="secondary" onClick={() => s.goto(d.route as string)}>{t(K.docs.open)}</Button> : <span className="t-xs t-muted">{t(K.docs.onRecord)}</span>}
            </div>
          ))}
        </div>
      </Card>

      {v.issued && (
        <Card className="mb-3">
          <div className="stack gap-2" data-next>
            <strong className="t-md">{t(K.next.heading)}</strong>
            <p className="t-sm">{t(K.next.body)}</p>
            {v.ongoing.warrantyEndsOn && <p className="t-sm">{t(K.next.warranty, { date: formatDate(day(v.ongoing.warrantyEndsOn), lang) })}</p>}
            <p className="t-sm">{v.ongoing.amcStatus === 'active' && v.ongoing.amcEndsOn ? t(K.next.amcActive, { date: formatDate(day(v.ongoing.amcEndsOn), lang) }) : t(K.next.amcOther)}</p>
            <Button variant="secondary" style={{ width: 'fit-content' }} onClick={() => s.goto(warrantyPath(v.job.id))}>{t(K.next.manage)}</Button>
          </div>
        </Card>
      )}

      {staff && v.payout && <Payout s={s} v={v} t={t} />}
      {staff && v.issued && <Judge s={s} v={v} t={t} />}

      {staff && <Button variant="secondary" style={{ width: 'fit-content' }} data-all onClick={() => s.goto(boardPath)}>{t(K.back)}</Button>}

      {showBar && (
        <ActionBar>
          <div className="stack gap-1" style={{ width: '100%' }}>
            {v.issued ? (
              <Button style={{ width: '100%' }} icon={<DownloadSimple size={18} aria-hidden="true" />} data-download onClick={() => download(v, t, lang, issuer ? `${displayName(issuer, lang)} · ${issuer.addressLine} · GSTIN ${issuer.gstin}` : t(K.hero.brand))}>{t(K.download.button)}</Button>
            ) : (
              <Button style={{ width: '100%' }} data-issue onClick={() => setConfirm(true)}>{t(K.issue.button)}</Button>
            )}
          </div>
        </ActionBar>
      )}
      {v.actions.issue && <ConfirmSheet s={s} v={v} t={t} open={confirm} onClose={() => setConfirm(false)} />}
    </Screen>
  );
}

/* ------------------------------------------------------------------ what is still needed */

function Readiness({ s, v, t }: { s: CompletionState; v: CompletionView; t: T }) {
  const { i18n } = useTranslation();
  const p = v.readiness.problems;
  const rows: { key: 'handover' | 'walkthrough' | 'signoff' | 'warranty'; done: boolean; go: string }[] = [
    { key: 'handover', done: !p.includes('handover_not_ready'), go: `/handover-checklist/${v.job.id}` },
    { key: 'walkthrough', done: !p.includes('walkthrough_not_done') && !p.includes('handover_not_ready'), go: walkthroughPath(v.job.id) },
    { key: 'signoff', done: !p.includes('signoff_missing') && !p.includes('walkthrough_not_done') && !p.includes('handover_not_ready'), go: walkthroughPath(v.job.id) },
    { key: 'warranty', done: !p.includes('warranty_not_registered'), go: warrantyPath(v.job.id) },
  ];
  const staff = v.viewer === 'admin';
  return (
    <Card className="mb-3">
      <div className="stack gap-2" data-readiness>
        <strong className="t-md">{t(K.ready.heading)}</strong>
        <p className="t-sm">{t(staff ? K.ready.adminIntro : K.ready.customerIntro)}</p>
        {rows
          .filter((r) => staff || r.key !== 'handover')
          .map((r) => (
            <div key={r.key} className="row gap-2" data-need={r.key} data-done={r.done ? 1 : 0} style={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
              <span className="row gap-2" style={{ alignItems: 'center', flex: 1 }}>
                {r.done ? <CheckCircle size={20} weight="fill" aria-hidden="true" color="var(--color-success)" /> : <Circle size={20} aria-hidden="true" />}
                <span className="t-sm">{t(K.ready[r.key])}</span>
              </span>
              {r.done ? <span className="t-xs t-muted">{t(K.ready.done)}</span> : (r.key !== 'handover' || staff) && <Button variant="secondary" onClick={() => s.goto(r.go)}>{t(K.ready.open)}</Button>}
            </div>
          ))}
        {v.readiness.signoffDueAt && p.includes('signoff_missing') && <p className="t-xs t-muted">{t(K.ready.dueOn, { date: formatDate(v.readiness.signoffDueAt, i18n.language) })}</p>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ confirm and issue */

function ConfirmSheet({ s, v, t, open, onClose }: { s: CompletionState; v: CompletionView; t: T; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const waive = v.readiness.problems.length > 0;
  const letters = reason.replace(/[^\p{L}\p{N}]/gu, '').length;
  const total = (v.payout?.lines ?? []).reduce((sum, l) => sum + l.currentAmount, 0);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.issue.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-confirm>
        <p className="t-sm">{t(K.issue.body)}</p>
        {waive && (
          <div className="stack gap-1" data-waive>
            <strong className="t-sm">{t(K.ready.waiveHeading)}</strong>
            <p className="t-xs t-muted">{t(K.ready.waiveBody)}</p>
            <Field label={t(K.ready.waiveLabel)} hint={t(K.ready.waiveHint)}>{({ id }) => <TextArea id={id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
          </div>
        )}
        <div className="stack gap-1" data-confirm-payouts>
          <strong className="t-sm">{t(K.issue.payouts, { total: formatINR(total) })}</strong>
          {(v.payout?.lines ?? []).map((l) => (
            <div key={l.id} className="row gap-2" style={{ justifyContent: 'space-between' }}>
              <span className="t-sm">{l.name} <span className="t-xs t-muted">· {t(K.team.role[l.role])}</span></span>
              <span className="num t-sm">{formatINR(l.currentAmount)}</span>
            </div>
          ))}
        </div>
        <Problem code={error} t={t} />
        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>{t(K.issue.cancel)}</Button>
          <Button disabled={s.busy || (waive && letters < 20)} data-issue-confirm onClick={async () => { const r = await s.issue(waive ? reason : undefined); if (r.ok) onClose(); else setError(r.code ?? 'generic'); }}>{t(K.issue.confirm)}</Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ the payouts (Admin) */

function basisLine(l: CompletionPayoutLineView, t: T): string {
  const pct = Math.round((l.share ?? 0) * 100);
  switch (l.basis) {
    case 'time':
      return t(K.payout.basis.time, { hours: Math.round((l.minutes ?? 0) / 6) / 10, share: pct });
    case 'steps':
      return t(K.payout.basis.steps, { steps: l.steps ?? 0, share: pct });
    case 'fixed':
      return t(K.payout.basis.fixed, { results: l.results ?? 0 });
    default:
      return t(K.payout.basis[l.basis]);
  }
}

function Payout({ s, v, t }: { s: CompletionState; v: CompletionView; t: T }) {
  const p = v.payout!;
  const { i18n } = useTranslation();
  const total = p.lines.reduce((sum, l) => sum + l.currentAmount, 0);
  void s;
  return (
    <Card className="mb-3">
      <div className="stack gap-2" data-payout>
        <strong className="t-md">{t(K.payout.heading)}</strong>
        <p className="t-xs t-muted">{p.triggered && p.triggeredAt ? t(K.payout.introDone, { date: formatDate(p.triggeredAt, i18n.language) }) : t(K.payout.introPreview)}</p>
        {p.lines.length === 0 ? <p className="t-sm">{t(K.payout.none)}</p> : p.lines.map((l) => (
          <div key={l.id} className="stack" data-line={l.userId} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
            <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stack" style={{ flex: 1 }}><strong className="t-sm">{l.name}</strong><span className="t-xs t-muted">{t(K.team.role[l.role])}</span></span>
              <span className="stack" style={{ textAlign: 'right' }}>
                <strong className="num t-md">{formatINR(l.currentAmount)}</strong>
                <span className="t-xs">{t(l.status === 'paid' ? K.payout.statusPaid : l.status === 'approved' ? K.payout.statusApproved : l.status === 'forfeited' ? K.payout.statusForfeited : K.payout.statusProjected)}</span>
              </span>
            </div>
            <span className="t-xs t-muted">{basisLine(l, t)}</span>
            {l.leadBonus ? <span className="t-xs t-muted">{t(K.payout.leadBonus, { amount: formatINR(l.leadBonus) })}</span> : null}
            <span className="row gap-2 wrap">
              {l.leftEarly && <Badge tone="neutral">{t(K.payout.leftEarly)}</Badge>}
              {l.held && <Badge tone="warning">{t(K.payout.held)}</Badge>}
              {l.currentAmount !== l.amount && <span className="t-xs t-muted">{t(K.payout.changed, { from: formatINR(l.amount) })}</span>}
            </span>
          </div>
        ))}
        <p className="t-sm"><strong>{t(K.payout.total)}</strong> <span className="num">{formatINR(total)}</span></p>
        {p.notPaid.length > 0 && <p className="t-xs t-muted" data-not-paid>{t(K.payout.notPaid, { names: p.notPaid.map((x) => x.name).join(', ') })}</p>}
        <p className="t-xs t-muted">{t(K.payout.pools, { install: formatINR(p.pools.installation), qc: formatINR(p.pools.qc) })}</p>
        <p className="t-xs t-muted">{t(K.payout.placeholder)}</p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ a defect found after the payouts (Admin) */

function Judge({ s, v, t }: { s: CompletionState; v: CompletionView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const d = s.draft;
  const [error, setError] = useState<string | null>(null);
  const lines = v.payout?.lines ?? [];
  const chosen = lines.filter((l) => d.ids.includes(l.commissionId));
  const problem = judgementProblem({
    decision: d.decision,
    issue: d.issue,
    reason: d.reason,
    targets: chosen.map((l) => ({ status: l.status, held: l.held, amount: l.currentAmount, ...(d.amounts[l.commissionId] !== undefined && d.amounts[l.commissionId] !== '' ? { newAmount: Number(d.amounts[l.commissionId]) } : {}) })),
  });
  const needsEntries = d.decision !== '' && d.decision !== 'no_change';
  const toggle = (id: string, on: boolean) => s.setDraft({ ids: on ? [...d.ids, id] : d.ids.filter((x) => x !== id) });
  return (
    <Card className="mb-3">
      <div className="stack gap-3" data-judge>
        <div className="row gap-2" style={{ alignItems: 'center' }}><Scales size={22} aria-hidden="true" color="var(--color-accent-secondary)" /><strong className="t-md">{t(K.judge.heading)}</strong></div>
        <p className="t-xs t-muted">{t(K.judge.intro)}</p>
        <Field label={t(K.judge.issue)} hint={t(K.judge.issueHint)}>{({ id }) => <TextArea id={id} rows={3} value={d.issue} onChange={(e) => s.setDraft({ issue: e.target.value })} data-judge-issue />}</Field>
        <div className="stack gap-2" role="radiogroup" aria-label={t(K.judge.heading)}>
          {JUDGEMENT_DECISIONS.map((x) => (
            <div key={x} className="stack gap-1">
              <span data-decision={x}><Chip pressed={d.decision === x} onClick={() => s.setDraft({ decision: x, ids: x === 'no_change' ? [] : d.ids })}>{t(K.judge.decision[x])}</Chip></span>
              {d.decision === x && <span className="t-xs t-muted">{t(K.judge.decisionHint[x])}</span>}
            </div>
          ))}
        </div>
        {needsEntries && (
          <div className="stack gap-2" data-judge-entries>
            <strong className="t-sm">{t(K.judge.entries)}</strong>
            {lines.map((l) => (
              <div key={l.commissionId} className="stack gap-1">
                <Checkbox checked={d.ids.includes(l.commissionId)} disabled={l.status === 'paid'} onChange={(on) => toggle(l.commissionId, on)} label={<span className="t-sm">{l.name} · {t(K.team.role[l.role])} · <span className="num">{formatINR(l.currentAmount)}</span>{l.status === 'paid' ? ` · ${t(K.judge.entryPaid)}` : ''}</span>} />
                {d.decision === 'adjust' && d.ids.includes(l.commissionId) && (
                  <Field label={t(K.judge.amount)}>{({ id }) => <Input id={id} inputMode="numeric" value={d.amounts[l.commissionId] ?? ''} onChange={(e) => s.setDraft({ amounts: { ...d.amounts, [l.commissionId]: e.target.value.replace(/[^0-9]/g, '') } })} />}</Field>
                )}
              </div>
            ))}
          </div>
        )}
        <Field label={t(K.judge.reason)} hint={t(K.judge.reasonHint)}>{({ id }) => <TextArea id={id} rows={3} value={d.reason} onChange={(e) => s.setDraft({ reason: e.target.value })} data-judge-reason />}</Field>
        {s.restored && <p className="t-xs t-muted" data-restored>{t(K.judge.draftRestored)}</p>}
        <Problem code={error} t={t} />
        <Button disabled={!!problem || s.busy} style={{ width: 'fit-content' }} data-judge-save onClick={async () => { const r: ActionResult = await s.judge(); setError(r.ok ? null : (r.code ?? 'generic')); }}>{t(K.judge.save)}</Button>
        <div className="stack gap-2" data-judge-history style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
          <strong className="t-sm">{t(K.judge.history)}</strong>
          {v.judgements.length === 0 ? <p className="t-xs t-muted">{t(K.judge.none)}</p> : v.judgements.map((j) => (
            <div key={j.id} className="stack" data-judgement={j.decision} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              <span className="t-xs t-muted">{formatDate(j.at, lang)} · {j.byName} · <strong>{t(K.judge.decision[j.decision])}</strong></span>
              <span className="t-sm">{j.issue}</span>
              <span className="t-xs">{j.reason}</span>
              {j.changes.map((c) => <span key={c.commissionId} className="t-xs t-muted">{t(K.judge.change, { name: c.name, from: formatINR(c.before.amount), to: formatINR(c.after.amount), before: t(statusKey(c.before.status)), after: t(statusKey(c.after.status)) })}</span>)}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

const statusKey = (st: string) => (st === 'paid' ? K.payout.statusPaid : st === 'approved' ? K.payout.statusApproved : st === 'forfeited' ? K.payout.statusForfeited : K.payout.statusProjected);

/* ------------------------------------------------------------------ the downloadable certificate */

const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/** A standalone copy the customer can keep, print or hand to a regulator or buyer. It takes its colours from the active theme's own tokens. */
function download(v: CompletionView, t: T, lang: string, issuerLine: string) {
  const css = getComputedStyle(document.documentElement);
  const tok = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const sm = v.summary;
  const rows = sm.milestones
    .map((m) => `<tr><td>${esc(t(K.lifecycle.milestone[m.id]))}</td><td>${esc(m.at ? formatDate(m.at, lang) : t(K.lifecycle.notOnRecord))}</td><td>${esc([m.ref, m.byName ? t(K.lifecycle.by, { name: m.byName }) : null, factLine(m, t)].filter(Boolean).join(' · '))}</td></tr>`)
    .join('');
  const team = v.team.map((p) => `<li>${esc(p.name)}: ${esc(p.roles.map((r) => t(K.team.role[r])).join(' · '))}</li>`).join('');
  const docs = v.documents.map((d) => `<li>${esc(t(K.docs.doc[d.id]))}${d.ref ? ` · ${esc(d.ref)}` : ''}${d.at ? ` · ${esc(formatDate(d.at, lang))}` : ''}</li>`).join('');
  const comp = sm.compliance ? `<p>${esc(t(K.project.compliance))}: ${esc(standardLabel(t, sm.compliance.standard))} · ${esc(sm.compliance.code)} · ${esc(formatDate(sm.compliance.issuedAt, lang))}</p><p class="n">${esc(t(K.project.complianceNote))}</p>` : '';
  const war = sm.warranty ? `<p>${esc(t(K.project.warrantyLine, { from: formatDate(day(sm.warranty.startsOn), lang), to: formatDate(day(sm.warranty.serviceEndsOn), lang), count: sm.warranty.partsCount }))}</p>` : '';
  const html = `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t(K.download.file, { no: v.certificateNo ?? '' }))}</title><style>body{font-family:sans-serif;max-width:820px;margin:24px auto;padding:0 16px;background:${tok('--color-bg', 'transparent')};color:${tok('--color-text-primary', 'inherit')}}h1{border-top:3px solid ${tok('--color-accent-primary', 'currentColor')};padding-top:12px}table{border-collapse:collapse;width:100%}td,th{border:1px solid ${tok('--color-border', '#ccc')};padding:6px 8px;text-align:left}.n{color:${tok('--color-text-secondary', 'inherit')};font-size:.9em}</style></head><body><p class="n">${esc(issuerLine)}</p><h1>${esc(t(K.hero.heading))}</h1><p><strong>${esc(v.certificateNo ?? '')}</strong> · ${esc(v.issuedAt ? t(K.hero.issued, { date: formatDate(v.issuedAt, lang), name: v.issuedByName ?? '' }) : '')}</p><p>${esc(t(K.hero.statement, { site: sm.siteName }))}</p><p>${esc(t(K.hero.customer, { name: sm.customerName }))} · ${esc(sm.address)}</p><h2>${esc(t(K.lifecycle.heading))}</h2><table>${rows}</table><h2>${esc(t(K.project.heading))}</h2>${comp}${war}<h2>${esc(t(K.team.heading))}</h2><ul>${team}</ul><h2>${esc(t(K.docs.heading))}</h2><ul>${docs}</ul><p class="n">${esc(t(K.download.footer))}</p></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `handover-certificate-${v.certificateNo ?? sm.jobCode}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

