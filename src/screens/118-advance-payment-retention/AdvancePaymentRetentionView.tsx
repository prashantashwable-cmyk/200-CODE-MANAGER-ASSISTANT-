import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HandCoins, Lock, ShieldCheck, WarningOctagon } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  ProgressBar,
  Screen,
  ScreenHeader,
  Sheet,
  StatTile,
  Tabs,
  TextArea,
  Toggle,
  formatDate,
  formatDateTime,
  formatINR,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { AdvanceItemView, RetentionItemView } from '@/data/repository';
import type { AdvanceState, RetentionReadiness } from '@/features/suppliers/exposure';
import { useAdvancePaymentRetention } from './useAdvancePaymentRetention';
import type { ActionResult, AdvanceRetentionState } from './useAdvancePaymentRetention';
import { ADVANCE_FILTERS, EXPOSURE_KEYS as K, RETENTION_FILTERS, TABS } from './advance-payment-retention.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string, params?: Record<string, unknown>) => void;

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATE_TONE: Record<AdvanceState, BadgeTone> = { on_track: 'success', late: 'warning', stalled: 'error', deal_gone: 'error', recovering: 'accent' };
const READY_TONE: Record<RetentionReadiness, BadgeTone> = { released: 'neutral', withheld: 'neutral', ready: 'success', awaiting_qc: 'accent', installing: 'neutral', rework: 'error', no_installation: 'warning' };

/**
 * Screen 118 — Advance Payment & Retention. The two non-routine exposures side by side: money out before the goods came, and
 * money held back until the installation proves them. An advance's state is read from the order's promised date; a retention's
 * readiness is read from the installation job's own QC and handover state, never a separate flag. An advance that stays
 * undelivered goes to formal recovery instead of ageing. Retentions that are ready and clear can be released together, and
 * anything with an open report, dispute or defect is left out of a batch by name.
 */
export function AdvancePaymentRetentionView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useAdvancePaymentRetention();
  const lang = i18n.language;

  const report: Report = (r, success, params) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success, params), 'success');
  };

  if (s.status === 'loading' && !s.board) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.board) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const b = s.board;
  const inSelect = s.selecting && s.tab === 'retentions';
  return (
    <Screen width="default" className={inSelect ? 'pb-action-bar' : undefined}>
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          s.tab === 'retentions' && s.readyIds.length > 0 ? (
            <Button size="sm" variant={s.selecting ? 'primary' : 'secondary'} onClick={s.toggleSelecting}>
              {t(s.selecting ? K.batch.done : K.batch.select)}
            </Button>
          ) : undefined
        }
      />

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '120px' } as CSSProperties}>
        <StatTile label={t(K.totals.advanceOut)} value={<span className="num">{formatINRCompact(b.totals.advanceOut)}</span>} caption={t(K.totals.count, { count: b.advances.length })} large />
        <StatTile label={t(K.totals.advanceAtRisk)} value={<span className={`num ${b.totals.advanceAtRisk > 0 ? 't-error' : ''}`}>{formatINRCompact(b.totals.advanceAtRisk)}</span>} />
        <StatTile label={t(K.totals.retentionHeld)} value={<span className="num">{formatINRCompact(b.totals.retentionHeld)}</span>} caption={t(K.totals.count, { count: b.retentions.length })} />
        <StatTile label={t(K.totals.retentionReady)} value={<span className="num">{formatINRCompact(b.totals.retentionReady)}</span>} />
      </div>

      <Card className="mb-3">
        <Toggle checked={b.autoRelease} disabled={s.busy} onChange={async (on) => report(await s.setAuto(on), K.auto.toast)} label={t(K.auto.label)} description={t(b.autoRelease ? K.auto.on : K.auto.off)} />
      </Card>

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Tabs label={t(K.tabs.label)} value={s.tab} onChange={(id) => s.setTab(id as typeof s.tab)} items={TABS.map((x) => ({ id: x, label: `${t(K.tabs[x])} · ${x === 'advances' ? s.counts.advanceAll : s.counts.retAll}` }))} />
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.search)}>
          {s.tab === 'advances'
            ? ADVANCE_FILTERS.map((f) => (
                <Chip key={f} pressed={s.advanceFilter === f} onClick={() => s.setAdvanceFilter(f)}>
                  {t(K.filter.advance[f])} · {f === 'all' ? s.counts.advanceAll : f === 'attention' ? s.counts.advanceAttention : s.counts.advanceRecovering}
                </Chip>
              ))
            : RETENTION_FILTERS.map((f) => (
                <Chip key={f} pressed={s.retentionFilter === f} onClick={() => s.setRetentionFilter(f)}>
                  {t(K.filter.retention[f])} · {f === 'all' ? s.counts.retAll : f === 'ready' ? s.counts.retReady : f === 'in_progress' ? s.counts.retProgress : s.counts.retBlocked}
                </Chip>
              ))}
        </div>
        {inSelect && (
          <div className="row between gap-2 wrap">
            <span className="t-xs t-muted">{t(K.batch.hint)}</span>
            <span className="row gap-1">
              <Button size="sm" variant="ghost" onClick={s.selectAll}>
                {t(K.batch.selectAll, { count: s.readyIds.length })}
              </Button>
              {s.chosen.length > 0 && (
                <Button size="sm" variant="ghost" onClick={s.clearSelection}>
                  {t(K.batch.clear)}
                </Button>
              )}
            </span>
          </div>
        )}
      </div>

      {s.tab === 'advances' ? (
        s.advances.length === 0 ? (
          s.counts.advanceAll === 0 ? (
            <EmptyState icon={<HandCoins size={32} />} title={t(K.advance.emptyTitle)} body={t(K.advance.emptyBody)} />
          ) : (
            <EmptyState icon={<HandCoins size={28} />} title={t(K.advance.emptyFilterTitle)} body={t(K.advance.emptyFilterBody)} />
          )
        ) : (
          <Card className="ds-card--flush">
            {s.advances.map((a) => (
              <AdvanceRow key={a.id} a={a} s={s} t={t} lang={lang} />
            ))}
          </Card>
        )
      ) : s.retentions.length === 0 ? (
        s.counts.retAll === 0 ? (
          <EmptyState icon={<ShieldCheck size={32} />} title={t(K.retention.emptyTitle)} body={t(K.retention.emptyBody)} />
        ) : (
          <EmptyState icon={<ShieldCheck size={28} />} title={t(K.retention.emptyFilterTitle)} body={t(K.retention.emptyFilterBody)} />
        )
      ) : (
        <Card className="ds-card--flush">
          {s.retentions.map((r) => (
            <RetentionRow key={r.id} r={r} s={s} t={t} lang={lang} selecting={inSelect} />
          ))}
        </Card>
      )}

      {inSelect && (
        <ActionBar>
          <Button disabled={s.chosen.length === 0} onClick={() => s.setBatchOpen(true)}>
            {t(K.batch.review, { count: s.chosen.length, amount: formatINR(s.chosenTotal) })}
          </Button>
        </ActionBar>
      )}

      <AdvanceSheet s={s} t={t} lang={lang} />
      <RetentionSheet s={s} t={t} lang={lang} />
      <RecoverySheet s={s} t={t} report={report} />
      <DecideSheet s={s} t={t} report={report} />
      <BatchSheet s={s} t={t} report={report} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ rows */

function AdvanceRow({ a, s, t, lang }: { a: AdvanceItemView; s: AdvanceRetentionState; t: T; lang: string }) {
  return (
    <button type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={() => s.openAdvance(a.id)}>
      <span className="ds-listrow__lead" aria-hidden="true" style={{ display: 'grid', placeItems: 'center' }}>
        <HandCoins size={20} />
      </span>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <strong className="t-sm">{a.supplierName}</strong>
          <Badge tone={STATE_TONE[a.state]}>{t(K.advance.state[a.state])}</Badge>
        </span>
        <span className="t-xs t-muted">{[a.poCode, a.siteName].filter(Boolean).join(' · ')}</span>
        <span className="t-xs t-muted">{t(K.advance.paidLine, { date: formatDate(a.paidAt, lang), count: a.ageDays })}</span>
        <span className={`t-xs ${a.daysPastPromise > 0 ? 't-error' : 't-muted'}`}>
          {a.promisedAt ? (a.daysPastPromise > 0 ? t(K.advance.pastPromise, { count: a.daysPastPromise }) : t(K.advance.promisedLine, { date: formatDate(a.promisedAt, lang) })) : t(K.advance.noPromise)}
          {' · '}
          {t(K.stage[a.stage])}
        </span>
        {a.recommendRecovery && (
          <span className="t-xs t-error row gap-1" style={{ alignItems: 'center' }}>
            <WarningOctagon size={12} aria-hidden="true" /> {t(K.advance.recommend)}
          </span>
        )}
      </span>
      <strong className="num" style={{ flexShrink: 0 }}>
        {formatINR(a.outstanding)}
      </strong>
    </button>
  );
}

function RetentionRow({ r, s, t, lang, selecting }: { r: RetentionItemView; s: AdvanceRetentionState; t: T; lang: string; selecting: boolean }) {
  return (
    <div className="ds-listrow" style={{ alignItems: 'flex-start' }}>
      {selecting && (
        <span style={{ paddingTop: 2 }}>
          {r.bulkOk ? <Checkbox checked={s.selected.includes(r.id)} onChange={() => s.toggle(r.id)} label={<span className="sr-only">{r.supplierName}</span>} /> : <Lock size={20} aria-hidden="true" color="var(--color-text-secondary)" />}
        </span>
      )}
      <button type="button" style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: 0 }} onClick={() => s.setRetentionId(r.id)} aria-label={`${r.supplierName} ${formatINR(r.amount)}`}>
        <span className="ds-listrow__lead" aria-hidden="true" style={{ display: 'grid', placeItems: 'center' }}>
          <ShieldCheck size={20} />
        </span>
        <span className="stack grow" style={{ minWidth: 0 }}>
          <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <strong className="t-sm">{r.supplierName}</strong>
            <Badge tone={READY_TONE[r.readiness]}>{t(K.retention.readiness[r.readiness])}</Badge>
            {r.holds.map((h) => (
              <Badge key={h} tone="error">
                {t(K.retention.hold[h])}
              </Badge>
            ))}
          </span>
          <span className="t-xs t-muted">{[r.poCode, r.siteName].filter(Boolean).join(' · ')}</span>
          <span className="t-xs t-muted">{t(K.retention.heldLine, { date: formatDate(r.heldAt, lang), count: r.ageDays })}</span>
          {r.job ? (
            <span className="stack" style={{ maxWidth: 260 }}>
              <ProgressBar value={r.progress} tone={r.readiness === 'ready' ? 'success' : r.readiness === 'rework' ? 'error' : 'accent'} label={t(K.retention.steps, { done: r.job.stepsDone, total: r.job.stepsTotal, code: r.job.code })} />
            </span>
          ) : (
            <span className="t-xs t-muted">{t(K.retention.noInstallation)}</span>
          )}
          {r.reviewDue && <span className="t-xs t-warning">{t(K.retention.review)}</span>}
        </span>
        <strong className="num" style={{ flexShrink: 0 }}>
          {formatINR(r.amount)}
        </strong>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- sheets */

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
    <dt className="t-muted">{label}</dt>
    <dd style={{ textAlign: 'end', margin: 0, minWidth: 0, overflowWrap: 'anywhere' }}>{value}</dd>
  </div>
);

function AdvanceSheet({ s, t, lang }: { s: AdvanceRetentionState; t: T; lang: string }) {
  const navigate = useNavigate();
  const a = s.currentAdvance;
  const r = a?.recovery ?? null;
  return (
    <Sheet open={!!s.advanceParam} onClose={s.closeAdvance} title={a ? t(K.detail.advanceTitle, { code: a.code }) : t(K.title)} closeLabel={t(K.action.close)}>
      {a && (
        <div className="stack gap-3">
          <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
            <strong className="num" style={{ fontSize: '1.5rem' }}>
              {formatINR(a.outstanding)}
            </strong>
            <Badge tone={STATE_TONE[a.state]}>{t(K.advance.state[a.state])}</Badge>
          </div>
          <p className="t-sm" role="note">
            {t(K.advance.stateBody[a.state], { count: a.daysPastPromise })}
          </p>
          <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
            <Row label={t(K.detail.supplier)} value={a.supplierName} />
            <Row label={t(K.detail.order)} value={a.poCode} />
            {a.siteName && <Row label={t(K.detail.site)} value={a.siteName} />}
            <Row label={t(K.detail.paid)} value={`${formatINR(a.paidAmount)} · ${formatDate(a.paidAt, lang)}`} />
            <Row label={t(K.detail.age)} value={t(K.detail.days, { count: a.ageDays })} />
            <Row label={t(K.detail.promised)} value={a.promisedAt ? formatDate(a.promisedAt, lang) : t(K.advance.noPromise)} />
            <Row label={t(K.detail.stage)} value={t(K.stage[a.stage])} />
          </dl>

          {r && (
            <section className="stack gap-1" aria-labelledby="rec-h">
              <h3 id="rec-h" className="t-sm t-semibold">
                {t(K.detail.recoveryHeading)}
              </h3>
              <span className="t-sm">{t(K.detail.recoveryLine, { code: r.code, amount: formatINR(r.amount), name: r.startedByName, date: formatDate(r.startedAt, lang) })}</span>
              {r.recoveredAmount > 0 && <span className="t-sm t-success">{t(K.detail.recoveredSo, { amount: formatINR(r.recoveredAmount) })}</span>}
              <span className="t-xs t-muted">{r.reason}</span>
              {r.events.map((e) => (
                <span key={e.id} className="t-xs t-muted">
                  {t(K.detail.event[e.kind])}
                  {e.amount ? ` ${formatINR(e.amount)}` : ''} · {t(K.detail.by, { name: e.byName })} · {formatDateTime(e.at, lang)}
                  {e.note && e.kind !== 'started' ? ` · ${e.note}` : ''}
                </span>
              ))}
            </section>
          )}

          <div className="row gap-2 wrap">
            <Button size="sm" variant="ghost" onClick={() => navigate(`/supplier-payment-history?payment=${a.id}`)}>
              {t(K.detail.seePayment)}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/orders')}>
              {t(K.detail.seeOrder)}
            </Button>
          </div>

          {!r ? (
            <Button variant={a.recommendRecovery ? 'primary' : 'secondary'} disabled={s.busy} onClick={() => s.openSheet('start')}>
              {t(K.action.startRecovery)}
            </Button>
          ) : (
            <div className="row gap-2 wrap">
              <Button disabled={s.busy} onClick={() => s.openSheet('recorded')}>
                {t(K.action.recorded)}
              </Button>
              <Button variant="secondary" disabled={s.busy} onClick={() => s.openSheet('writeoff')}>
                {t(K.action.writeOff)}
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function RetentionSheet({ s, t, lang }: { s: AdvanceRetentionState; t: T; lang: string }) {
  const navigate = useNavigate();
  const r = s.currentRetention;
  return (
    <Sheet open={!!r} onClose={() => s.setRetentionId(null)} title={r ? t(K.detail.retentionTitle, { code: r.poCode }) : t(K.title)} closeLabel={t(K.action.close)}>
      {r && (
        <div className="stack gap-3">
          <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
            <strong className="num" style={{ fontSize: '1.5rem' }}>
              {formatINR(r.amount)}
            </strong>
            <Badge tone={READY_TONE[r.readiness]}>{t(K.retention.readiness[r.readiness])}</Badge>
          </div>
          <p className="t-sm" role="note">
            {t(K.retention.readinessBody[r.readiness], { code: r.job?.code ?? '', reason: r.job?.holdReason ?? '' })}
          </p>
          {r.job && (
            <div className="stack gap-1">
              <span className="t-xs t-muted">{t(K.retention.installation, { code: r.job.code, status: t(K.retention.jobStatus[r.job.status]) })}</span>
              <ProgressBar value={r.progress} tone={r.readiness === 'ready' ? 'success' : r.readiness === 'rework' ? 'error' : 'accent'} label={t(K.retention.steps, { done: r.job.stepsDone, total: r.job.stepsTotal, code: r.job.code })} />
            </div>
          )}
          {r.holds.length > 0 && (
            <section className="stack gap-1" aria-labelledby="holds-h">
              <h3 id="holds-h" className="t-sm t-semibold">
                {t(K.detail.holdsHeading)}
              </h3>
              {r.holds.map((h) => (
                <span key={h} className="t-sm t-error">
                  {t(K.retention.holdBody[h])}
                </span>
              ))}
              <div className="row gap-2 wrap">
                {r.holds.includes('open_report') && (
                  <Button size="sm" variant="ghost" onClick={() => navigate('/damaged-parts')}>
                    {t(K.detail.seeReports)}
                  </Button>
                )}
                {r.holds.includes('open_dispute') && (
                  <Button size="sm" variant="ghost" onClick={() => navigate('/supplier-disputes')}>
                    {t(K.detail.seeDisputes)}
                  </Button>
                )}
              </div>
            </section>
          )}
          <dl className="stack gap-1 t-sm" style={{ margin: 0 }}>
            <Row label={t(K.detail.supplier)} value={r.supplierName} />
            <Row label={t(K.detail.order)} value={r.poCode} />
            {r.siteName && <Row label={t(K.detail.site)} value={r.siteName} />}
            <Row label={t(K.detail.share)} value={`${r.pct}%`} />
            <Row label={t(K.detail.heldSince)} value={`${formatDate(r.heldAt, lang)} · ${t(K.detail.days, { count: r.ageDays })}`} />
          </dl>
          <section className="stack gap-1" aria-labelledby="dec-h">
            <h3 id="dec-h" className="t-sm t-semibold">
              {t(K.detail.decisionHeading)}
            </h3>
            <span className="t-xs t-muted">{t(K.detail.decisionHint)}</span>
            <div className="row gap-2 wrap">
              <Button disabled={s.busy} onClick={() => s.openDecide('release')}>
                {t(K.action.release)}
              </Button>
              <Button variant="secondary" disabled={s.busy} onClick={() => s.openDecide('withhold')}>
                {t(K.action.withhold)}
              </Button>
            </div>
          </section>
        </div>
      )}
    </Sheet>
  );
}

function RecoverySheet({ s, t, report }: { s: AdvanceRetentionState; t: T; report: Report }) {
  const a = s.currentAdvance;
  const which = s.sheet;
  const cfg = which === 'start' ? { title: K.recoverySheet.title, intro: K.recoverySheet.intro, confirm: K.recoverySheet.confirm, toast: K.toast.recovery } : which === 'recorded' ? { title: K.recordedSheet.title, intro: K.recordedSheet.intro, confirm: K.recordedSheet.confirm, toast: K.toast.recorded } : { title: K.writeOffSheet.title, intro: K.writeOffSheet.intro, confirm: K.writeOffSheet.confirm, toast: K.toast.writtenOff };
  const needsAmount = which === 'recorded';
  const minLen = which === 'start' || which === 'writeoff' ? 10 : 0;
  return (
    <Sheet open={!!which && !!a} onClose={() => s.setSheet(null)} title={t(cfg.title)} closeLabel={t(K.action.close)}>
      {a && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(cfg.intro, { amount: formatINR(a.outstanding), supplier: a.supplierName, code: a.poCode })}</p>
          {needsAmount && (
            <Field label={t(K.recordedSheet.amount)} hint={t(K.recordedSheet.amountHint, { amount: formatINR(a.outstanding) })} required>
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} inputMode="decimal" value={s.amount} onChange={(e) => s.setAmount(e.target.value)} invalid={s.amount !== '' && !s.amountValid} />}
            </Field>
          )}
          <Field label={t(which === 'start' ? K.recoverySheet.reason : which === 'recorded' ? K.recordedSheet.note : K.writeOffSheet.note)} hint={which === 'start' ? t(K.recoverySheet.reasonHint) : undefined} required={minLen > 0}>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.reason} onChange={(e) => s.setReason(e.target.value)} />}
          </Field>
          <Button disabled={s.busy || s.reason.trim().length < minLen || (needsAmount && !s.amountValid)} onClick={async () => report(await s.confirmSheet(), cfg.toast)}>
            {t(cfg.confirm)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function DecideSheet({ s, t, report }: { s: AdvanceRetentionState; t: T; report: Report }) {
  const r = s.currentRetention;
  const release = s.decide === 'release';
  const min = release ? 4 : 10;
  return (
    <Sheet open={!!s.decide && !!r} onClose={() => s.setDecide(null)} title={t(release ? K.decideSheet.releaseTitle : K.decideSheet.withholdTitle)} closeLabel={t(K.action.close)}>
      {r && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{release ? t(r.readiness === 'ready' && r.holds.length === 0 ? K.decideSheet.releaseIntro : K.decideSheet.releaseNotReady, { amount: formatINR(r.amount), supplier: r.supplierName }) : t(K.decideSheet.withholdIntro, { amount: formatINR(r.amount), supplier: r.supplierName })}</p>
          <Field label={t(K.decideSheet.reason)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.decideReason} onChange={(e) => s.setDecideReason(e.target.value)} />}
          </Field>
          <Button disabled={s.busy || s.decideReason.trim().length < min} onClick={async () => report(await s.confirmDecide(), K.toast.decided)}>
            {t(release ? K.decideSheet.confirmRelease : K.decideSheet.confirmWithhold)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function BatchSheet({ s, t, report }: { s: AdvanceRetentionState; t: T; report: Report }) {
  const toast = useToast();
  return (
    <Sheet open={s.batchOpen} onClose={() => s.setBatchOpen(false)} title={t(K.batch.title)} closeLabel={t(K.action.close)}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.batch.intro)}</p>
        <div className="stack gap-1">
          {s.chosen.map((r) => (
            <div key={r.id} className="row between gap-2 t-sm">
              <span className="stack" style={{ minWidth: 0 }}>
                <strong>{r.supplierName}</strong>
                <span className="t-xs t-muted">{[r.poCode, r.job?.code].filter(Boolean).join(' · ')}</span>
              </span>
              <span className="num">{formatINR(r.amount)}</span>
            </div>
          ))}
        </div>
        <div className="row between gap-2 t-sm t-semibold">
          <span>{t(K.batch.total)}</span>
          <span className="num">{formatINR(s.chosenTotal)}</span>
        </div>
        <p className="t-xs t-muted">{t(K.batch.excluded)}</p>
        <Button
          disabled={s.busy || s.chosen.length === 0}
          onClick={async () => {
            const r = await s.confirmBatch();
            report(r, K.toast.batch, { count: r.batch?.released.length ?? 0 });
            if (r.ok && r.batch && r.batch.skipped.length > 0) toast.push(t(K.batch.skipped, { count: r.batch.skipped.length, why: [...new Set(r.batch.skipped.map((x) => t(K.batch.skip[x.reason])))].join(', ') }), 'warning');
          }}
        >
          {t(K.batch.confirm, { count: s.chosen.length })}
        </Button>
      </div>
    </Sheet>
  );
}
