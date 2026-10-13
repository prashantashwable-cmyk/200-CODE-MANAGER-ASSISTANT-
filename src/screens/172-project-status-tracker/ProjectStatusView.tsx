import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, FileText } from '@phosphor-icons/react';
import { AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, Sheet, formatDate, formatINR } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { CustomerStageKey, ProjectMilestone, ProjectPhaseView, ProjectStatusView } from '@/data/repository';
import { STATUS_KEYS as K, PHASE_IDS, RECENT, captionKey, checkoutPath, homePath, paymentsPath } from './project-status.types';
import { useProjectStatus } from './useProjectStatus';
import type { ProjectStatusState } from './useProjectStatus';

type T = ReturnType<typeof useTranslation>['t'];
const STAGES: CustomerStageKey[] = ['agreed', 'contract', 'materials', 'installation', 'quality', 'handover'];
const phaseName = (t: T, phase: string) => t(`installTimeline.milestone.${phase}`);

/** Screen 172 — Project Status Tracker. The customer's view of one project's whole journey, built from the same records as the installation timeline's customer view (129): honest dates, a calm word for anything that has slowed it, a few chosen pictures, the documents, and an optional "more detail". */
export function ProjectStatusScreen() {
  const { t } = useTranslation();
  const s = useProjectStatus();
  const v = s.view;
  const head = (sub?: string) => <ScreenHeader title={t(K.title)} subtitle={sub ?? t(K.subtitle)} action={<span className="row gap-2"><Button size="sm" variant="ghost" onClick={() => s.goTo(homePath)}>{t(K.back)}</Button><Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh)}</Button></span>} />;
  if (s.load === 'loading' && !v) return <Screen width="default">{head()}<LoadingState label={t(K.loading)} variant="stats" rows={3} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="default">{head()}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const p = v.project;
  if (!p) return <Screen width="default">{head()}<EmptyState title={t(K.empty.title)} body={t(K.empty.body)} actionLabel={t(K.back)} onAction={() => s.goTo(homePath)} /></Screen>;
  const service = p.mode === 'service';
  return (
    <Screen width="default">
      {head(p.siteName)}
      {v.projects.length > 1 && (
        <div className="mb-3 row gap-2" data-switcher style={{ overflowX: 'auto', paddingBottom: 4 }}>
          {v.projects.map((x) => <span key={x.key} data-project={x.key} style={{ flex: '0 0 auto' }}><Chip pressed={x.key === p.key} onClick={() => s.pick(x.key)}>{x.siteName}</Chip></span>)}
        </div>
      )}
      {s.offline && <p className="t-xs t-muted mb-2" data-offline>{t(K.error.body)}</p>}
      <div className="main-aside">
        <div className="stack gap-3" data-main>
          <Where v={v} t={t} />
          <Concerns v={v} s={s} t={t} />
          {!service && <NextCard v={v} t={t} />}
          {v.phases.length > 0 && <Phases v={v} s={s} t={t} />}
          {v.hidden && p.jobId && <p className="t-sm t-muted" data-hidden>{t(K.hidden)}</p>}
          {p.early && !service && <Early t={t} from={Math.max(0, STAGES.indexOf((p.stage ?? 'agreed') as CustomerStageKey))} />}
        </div>
        <div className="stack gap-3" data-aside>
          <Highlights v={v} s={s} t={t} />
          <History v={v} s={s} t={t} />
          <Documents v={v} s={s} t={t} />
        </div>
      </div>
      <Sheet open={!!s.photo} onClose={() => s.openPhoto(null)} title={t(K.section.highlights)} closeLabel={t(K.close)}>
        {s.photo && (() => { const h = v.highlights.find((x) => x.id === s.photo); return h ? <figure className="stack gap-2" data-lightbox><img src={h.previewUrl} alt={t(captionKey(h.slot))} style={{ width: '100%', borderRadius: 'var(--radius-md, 12px)' }} /><figcaption className="t-sm">{t(captionKey(h.slot))}</figcaption></figure> : null; })()}
      </Sheet>
    </Screen>
  );
}

function Where({ v, t }: { v: ProjectStatusView; t: T }) {
  const { i18n } = useTranslation();
  const p = v.project as NonNullable<ProjectStatusView['project']>;
  const service = p.mode === 'service';
  const steps: AscensionStep[] = p.stages.map((st) => ({ id: st.key, label: t(`customerHome.stage.${st.key}`), meta: st.status === 'done' ? (st.doneAt ? t('customerHome.stage.doneOn', { date: formatDate(st.doneAt, i18n.language) }) : undefined) : st.status === 'current' && !service ? t('customerHome.stage.now') : undefined, status: st.status === 'done' ? 'complete' : st.status === 'current' && !service ? 'current' : 'upcoming' }));
  return (
    <Card>
      <div className="stack gap-3" data-where data-mode={p.mode} data-stage={p.stage ?? 'done'}>
        <h2 className="t-md t-semibold">{t(K.section.where)}</h2>
        <p className="t-sm">{service ? t(K.where.service) : t(p.mode === 'starting' && p.stage === 'agreed' ? 'customerHome.hero.starting' : `customerHome.hero.stage.${p.stage ?? 'agreed'}`, { site: p.siteName })}</p>
        <AscensionLine steps={steps} orientation="vertical" />
      </div>
    </Card>
  );
}

function Concerns({ v, s, t }: { v: ProjectStatusView; s: ProjectStatusState; t: T }) {
  const p = v.project as NonNullable<ProjectStatusView['project']>;
  const items = p.concerns.filter((c) => c.kind !== 'payment_overdue' && c.kind !== 'paused');
  if (!v.pausedFor && items.length === 0) return null;
  return (
    <Card>
      <div className="stack gap-2" data-concerns>
        {v.pausedFor && (
          <div className="stack gap-1" data-paused={v.pausedFor} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
            <p className="t-sm">{v.pausedFor === 'payment' ? t(K.paused.payment) : t(K.paused.issue)}</p>
            {v.pausedFor === 'issue' && p.concerns.find((c) => c.kind === 'paused')?.reason && <p className="t-sm t-muted">{t(`installTimeline.reason.customer.${p.concerns.find((c) => c.kind === 'paused')?.reason}`)}</p>}
            {v.pausedFor === 'payment' && <span className="row gap-2 wrap">{v.pausedPaymentId && <Button size="sm" data-pay={v.pausedPaymentId} onClick={() => s.goTo(checkoutPath(v.pausedPaymentId as string))}>{t(K.paused.payNow)}</Button>}<Button size="sm" variant="ghost" onClick={() => s.goTo(paymentsPath(p.dealId))}>{t(K.paused.payments)}</Button></span>}
          </div>
        )}
        {items.map((c) => (
          <div key={c.kind} className="stack gap-1" data-concern={c.kind} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
            <p className="t-sm">{t(c.kind === 'delay' ? K.concern.delay : K.concern.payment_disputed, { days: c.days ?? 0, amount: formatINR(c.amount ?? 0) })}</p>
            {c.reason && <p className="t-sm t-muted">{t(`installTimeline.reason.customer.${c.reason}`)}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function NextCard({ v, t }: { v: ProjectStatusView; t: T }) {
  const { i18n } = useTranslation();
  const n = v.next;
  return (
    <Card>
      <div className="stack gap-1" data-next={n?.id ?? 'none'}>
        <h2 className="t-md t-semibold">{t(K.section.next)}</h2>
        {!n ? <p className="t-sm t-muted">{t(K.next.none)}</p> : (
          <>
            <p className="t-sm"><strong>{n.phase ? phaseName(t, n.phase) : t(K.next.stage[n.stage])}</strong>{n.at ? ` · ${formatDate(n.at, i18n.language)}` : ` · ${t(K.later)}`}</p>
            {n.basis === 'estimate' && <p className="t-xs t-muted">{t(K.next.estimate)}</p>}
            {n.basis === 'booked' && <p className="t-xs t-muted">{t(K.next.booked)}</p>}
            {!n.at && <p className="t-xs t-muted">{t(K.next.none)}</p>}
            {n.slipDays > 0 && n.originalAt && <p className="t-xs t-muted">{t(K.next.firstPlanned, { date: formatDate(n.originalAt, i18n.language) })}</p>}
          </>
        )}
      </div>
    </Card>
  );
}

function PhaseRow({ ph, more, t }: { ph: ProjectPhaseView; more: boolean; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const status = ph.status === 'done' ? t(K.phase.status.done, { date: ph.doneAt ? formatDate(ph.doneAt, lang) : '' }) : ph.blocked ? t(K.phase.paused) : t(K.phase.status[ph.status]);
  return (
    <div className="stack gap-1" data-phase={ph.phase} data-status={ph.status}>
      <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><strong className="t-sm">{phaseName(t, ph.phase)}</strong><Badge tone={ph.status === 'done' ? 'success' : ph.status === 'current' ? 'accent' : 'neutral'}>{status}</Badge></span>
      {ph.status !== 'done' && ph.expectedAt && <span className="t-xs t-muted">{t(K.phase.expected, { date: formatDate(ph.expectedAt, lang) })}{ph.slipDays > 0 ? ` · ${t(K.phase.slip, { days: ph.slipDays })}` : ''}</span>}
      {ph.photoCount > 0 && <span className="t-xs t-muted">{t(K.phase.photos, { count: ph.photoCount })}</span>}
      {more && (
        <div className="stack gap-1" data-steps style={{ paddingLeft: 'var(--space-3)', borderLeft: '1px solid var(--color-border)' }}>
          <span className="t-xs t-muted">{t(K.phase.steps, { done: ph.stepsDone, total: ph.stepsTotal })}</span>
          {ph.steps.map((st) => <span key={st.labelKey} className="t-xs">{t(st.labelKey)} · {st.done ? t(K.detail.stepDone, { date: st.completedAt ? formatDate(st.completedAt, lang) : '' }) : t(K.detail.stepOpen)}</span>)}
        </div>
      )}
    </div>
  );
}

function Phases({ v, s, t }: { v: ProjectStatusView; s: ProjectStatusState; t: T }) {
  return (
    <Card>
      <div className="stack gap-3" data-phases>
        <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><h2 className="t-md t-semibold">{t(K.section.phases)}</h2><Button size="sm" variant="ghost" data-more onClick={() => s.setMore(!s.more)}>{s.more ? t(K.detail.less) : t(K.detail.more)}</Button></span>
        {PHASE_IDS.map((id) => v.phases.find((x) => x.phase === id)).filter((x): x is ProjectPhaseView => !!x).map((ph) => <PhaseRow key={ph.phase} ph={ph} more={s.more} t={t} />)}
      </div>
    </Card>
  );
}

function Early({ t, from }: { t: T; from: number }) {
  return (
    <Card>
      <div className="stack gap-2" data-early>
        <h2 className="t-md t-semibold">{t(K.early.heading)}</h2>
        <p className="t-sm t-muted">{t(K.early.body)}</p>
        <ol className="stack gap-2" style={{ paddingLeft: 'var(--space-5, 20px)' }}>
          {STAGES.slice(from).map((k) => <li key={k} className="t-sm"><strong>{t(`customerHome.stage.${k}`)}.</strong> {t(`customerHome.early.step.${k}`)}</li>)}
        </ol>
      </div>
    </Card>
  );
}

function Highlights({ v, s, t }: { v: ProjectStatusView; s: ProjectStatusState; t: T }) {
  const { i18n } = useTranslation();
  if (!v.project?.jobId || v.hidden) return null;
  return (
    <Card>
      <div className="stack gap-2" data-highlights>
        <h2 className="t-md t-semibold">{t(K.section.highlights)}</h2>
        {v.highlights.length === 0 ? <p className="t-sm t-muted" data-empty>{t(K.highlights.empty)}</p> : (
          <>
            <p className="t-xs t-muted">{t(K.highlights.note)}</p>
            <div className="grid-2 gap-2">
              {v.highlights.map((h) => (
                <button key={h.id} type="button" className="tappable stack gap-1" data-highlight={h.slot} onClick={() => s.openPhoto(h.id)} style={{ textAlign: 'left', padding: 0, border: 'none', background: 'none' }}>
                  <img src={h.previewUrl} alt={t(captionKey(h.slot))} loading="lazy" style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', borderRadius: 'var(--radius-md, 12px)', border: '1px solid var(--color-border)' }} />
                  <span className="t-xs"><strong>{t(captionKey(h.slot))}</strong><br /><span className="t-muted">{t(K.highlights.taken, { date: formatDate(h.capturedAt, i18n.language) })}</span></span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function milestoneText(t: T, m: ProjectMilestone): string {
  return t(`projectStatus.milestone.${m.kind}`, { code: m.code ?? '', phase: m.phase ? phaseName(t, m.phase) : '' });
}
function History({ v, s, t }: { v: ProjectStatusView; s: ProjectStatusState; t: T }) {
  const { i18n } = useTranslation();
  const rows = s.history ? v.milestones : v.milestones.slice(0, RECENT);
  return (
    <Card>
      <div className="stack gap-2" data-history>
        <h2 className="t-md t-semibold">{t(K.section.history)}</h2>
        {rows.length === 0 ? <p className="t-sm t-muted">{t(K.history.empty)}</p> : (
          <ul className="stack gap-2">{rows.map((m) => <li key={m.id} data-milestone={m.kind} className="stack gap-0"><span className="t-sm">{milestoneText(t, m)}</span><span className="t-xs t-muted">{formatDate(m.at, i18n.language)}</span></li>)}</ul>
        )}
        {v.milestones.length > RECENT && <div><Button size="sm" variant="ghost" data-history-toggle onClick={() => s.setHistory(!s.history)}>{s.history ? t(K.history.less) : t(K.history.more)}</Button></div>}
      </div>
    </Card>
  );
}

function Documents({ v, s, t }: { v: ProjectStatusView; s: ProjectStatusState; t: T }) {
  const { i18n } = useTranslation();
  return (
    <Card>
      <div className="stack gap-2" data-documents>
        <h2 className="t-md t-semibold">{t(K.section.documents)}</h2>
        {v.documents.length === 0 ? <p className="t-sm t-muted">{t(K.documents.empty)}</p> : v.documents.map((d) => (
          <div key={d.id} className="row gap-2" data-document={d.kind} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="row gap-2" style={{ alignItems: 'center' }}><FileText size={18} aria-hidden="true" /><span className="stack gap-0"><span className="t-sm">{t(`projectStatus.documents.${d.kind}`, { code: d.code ?? '' })}</span>{d.at && <span className="t-xs t-muted">{formatDate(d.at, i18n.language)}</span>}</span></span>
            {d.route && <Button size="sm" variant="secondary" onClick={() => s.goTo(d.route as string)}>{t(K.documents.open)}</Button>}
          </div>
        ))}
        <Button size="sm" variant="ghost" data-all-documents onClick={() => s.goTo('/documents')}>{t('documentVault.link.open')}</Button>
      </div>
    </Card>
  );
}
