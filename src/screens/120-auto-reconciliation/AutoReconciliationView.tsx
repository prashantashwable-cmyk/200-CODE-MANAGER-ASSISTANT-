import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowClockwise, ArrowDownLeft, ArrowUpRight, Bank, CheckCircle, Clock, Warning, WarningOctagon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  StatTile,
  Tabs,
  TextArea,
  formatDateTime,
  formatINR,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { BankSideView, LedgerSideView, ReconExceptionView, ReconRunRow } from '@/data/repository';
import type { ReconReason, ReconRunStatus } from '@/data/types';
import { useAutoReconciliation } from './useAutoReconciliation';
import type { ActionResult, AutoReconciliationState } from './useAutoReconciliation';
import { RECON_KEYS as K, TABS } from './auto-reconciliation.types';
import type { ReconTab } from './auto-reconciliation.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = <V>(r: ActionResult<V>, success?: string) => void;

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STATUS_TONE: Record<ReconRunStatus, BadgeTone> = { passed: 'success', review: 'warning', failed: 'error', could_not_run: 'neutral' };
const SEVERITY_TONE = { critical: 'error', high: 'warning', low: 'neutral' } as const;

const signed = (direction: 'in' | 'out', amount: number) => `${direction === 'in' ? '+' : '−'}${formatINR(amount)}`;

/**
 * Screen 120 — Auto-Reconciliation. The last line of financial control: the bank's own statement against the app's records of money
 * in and out, so the books cannot be internally consistent yet wrong. A run says plainly what it could not check (no bank data is
 * "could not run", never a clean pass); a serious mismatch such as a payment made twice is an alert of its own and cannot be waved
 * through as a fee; a bank fee or small difference is listed and explained by hand, with a reason, without an alarm.
 */
export function AutoReconciliationView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useAutoReconciliation();
  const lang = i18n.language;

  const report: Report = (r, success) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success), 'success');
  };

  if (s.status === 'loading' && !s.board) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.board) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const b = s.board;
  const blind = b.feed.status === 'unavailable' || b.latest?.status === 'could_not_run';

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button
            size="sm"
            disabled={s.busy}
            onClick={async () => {
              const r = await s.runNow();
              if (!r.ok) return report(r);
              report(r, r.value?.status === 'could_not_run' ? K.runToast.couldNot : K.runToast.done);
            }}
          >
            <ArrowClockwise size={14} aria-hidden="true" /> {t(s.busy ? K.running : K.runNow)}
          </Button>
        }
      />

      <Hero s={s} t={t} lang={lang} report={report} />

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '130px' } as CSSProperties}>
        <StatTile label={t(K.totals.matched)} value={<span className="num">{b.totals.matched}</span>} />
        <StatTile label={t(K.totals.open)} value={<span className={`num ${b.totals.open > 0 ? 't-warning' : ''}`}>{b.totals.open}</span>} />
        <StatTile label={t(K.totals.serious)} value={<span className={`num ${b.totals.serious > 0 ? 't-error' : ''}`}>{b.totals.serious}</span>} />
        <StatTile label={t(K.totals.explained)} value={<span className="num">{b.totals.explained}</span>} />
        <StatTile label={t(K.totals.pending)} value={<span className="num">{b.totals.pending}</span>} />
      </div>

      <div className="sticky-under-shell mb-3">
        <Tabs label={t(K.tabs.label)} value={s.tab} onChange={(id) => s.setTab(id as ReconTab)} items={TABS.map((id) => ({ id, label: `${t(K.tabs[id])}${id === 'open' ? ` · ${b.open.length}` : id === 'explained' ? ` · ${b.explained.length}` : ` · ${b.runs.length}`}` }))} />
      </div>

      {s.tab === 'open' && <OpenTab s={s} blind={blind} t={t} lang={lang} />}
      {s.tab === 'runs' && <RunsTab s={s} t={t} lang={lang} />}
      {s.tab === 'explained' && <ExplainedTab s={s} t={t} lang={lang} />}

      <ExceptionSheet s={s} t={t} lang={lang} report={report} />
      <RunSheet s={s} t={t} lang={lang} />
    </Screen>
  );
}

/* ----------------------------------------------------------------- hero */

function Hero({ s, t, lang, report }: { s: AutoReconciliationState; t: T; lang: string; report: Report }) {
  const b = s.board!;
  const latest = b.latest;
  const down = b.feed.status === 'unavailable';
  const couldNot = latest?.status === 'could_not_run';
  const tone = latest ? STATUS_TONE[latest.status] : 'neutral';
  return (
    <Card className="mb-3" style={{ borderColor: couldNot || down ? 'var(--color-warning)' : latest?.status === 'failed' ? 'var(--color-error)' : undefined }}>
      <div className="stack gap-3">
        {!latest ? (
          <div className="row-top gap-3">
            <Clock size={24} aria-hidden="true" />
            <div className="stack gap-1">
              <h2 className="t-md t-semibold">{t(K.hero.noRunTitle)}</h2>
              <p className="t-sm t-muted">{t(K.hero.noRunBody)}</p>
            </div>
          </div>
        ) : couldNot ? (
          <div className="row-top gap-3">
            <WarningOctagon size={26} color="var(--color-warning)" aria-hidden="true" />
            <div className="stack gap-1 grow">
              <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                <h2 className="t-md t-semibold">{t(K.hero.couldNotTitle)}</h2>
                <Badge tone="neutral">{t(K.status.could_not_run)}</Badge>
              </div>
              <p className="t-sm">{t(K.hero.couldNotBody)}</p>
              <p className="t-xs t-muted">{t(K.hero.latest, { code: latest.code, date: formatDateTime(latest.runAt, lang) })}</p>
            </div>
          </div>
        ) : (
          <div className="row-top gap-3">
            {latest.status === 'passed' ? <CheckCircle size={26} color="var(--color-success)" aria-hidden="true" /> : <Warning size={26} color={latest.status === 'failed' ? 'var(--color-error)' : 'var(--color-warning)'} aria-hidden="true" />}
            <div className="stack gap-1 grow">
              <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                <Badge tone={tone}>{t(K.status[latest.status])}</Badge>
                <span className="t-xs t-muted">{t(K.hero.latest, { code: latest.code, date: formatDateTime(latest.runAt, lang) })}</span>
              </div>
              <p className="t-sm">{t(latest.status === 'passed' ? K.hero.passedBody : latest.status === 'review' ? K.hero.reviewBody : K.hero.failedBody, { matched: latest.matchedCount, open: latest.unmatchedCount })}</p>
              <p className="t-xs t-muted">{t(K.hero.counts, { matched: latest.matchedCount, open: latest.unmatchedCount, explained: latest.explainedCount, pending: latest.pendingCount })}</p>
            </div>
          </div>
        )}

        <div className="row between gap-3 wrap" style={{ alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <Bank size={18} aria-hidden="true" />
            <div className="stack">
              <strong className="t-sm">
                {t(K.feed.heading)}: {t(down ? K.feed.unavailable : K.feed.connected)}
              </strong>
              <span className="t-xs t-muted">
                {down ? t(K.feed.since, { date: formatDateTime(b.feed.since, lang), reason: b.feed.reason ? t(K.feed.reason[b.feed.reason]) : '' }) : t(K.feed.lastStatement, { date: formatDateTime(b.feed.lastStatementAt, lang) })}
                {' · '}
                {t(K.hero.next, { date: formatDateTime(b.nextRunAt, lang) })}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={s.busy}
            onClick={async () => report(await s.setFeed(down ? 'connected' : 'unavailable'), down ? K.feed.upToast : K.feed.downToast)}
          >
            {t(down ? K.feed.simulateUp : K.feed.simulateDown)}
          </Button>
        </div>
        <p className="t-xs t-muted">{t(K.feed.demoNote)}</p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ open */

function OpenTab({ s, blind, t, lang }: { s: AutoReconciliationState; blind: boolean; t: T; lang: string }) {
  const b = s.board!;
  const serious = b.open.filter((e) => e.severity === 'critical');
  const others = b.open.filter((e) => e.severity !== 'critical');
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.open.intro)}</p>
      {blind && (
        <Card style={{ borderColor: 'var(--color-warning)' }}>
          <div className="row-top gap-2">
            <Warning size={20} color="var(--color-warning)" aria-hidden="true" />
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.open.blindTitle)}</strong>
              <span className="t-sm t-muted">{t(K.open.blindBody)}</span>
            </div>
          </div>
        </Card>
      )}
      {b.open.length === 0 && !blind ? (
        <EmptyState icon={<CheckCircle size={28} />} title={t(K.open.emptyTitle)} body={t(K.open.emptyBody)} />
      ) : (
        <>
          {serious.length > 0 && (
            <section className="stack gap-2" aria-labelledby="serious-h">
              <h2 id="serious-h" className="t-md t-semibold t-error">
                {t(K.open.seriousHeading)}
              </h2>
              <Card className="ds-card--flush">
                {serious.map((e) => (
                  <ExceptionRow key={e.id} e={e} onOpen={() => s.openException(e.id)} t={t} lang={lang} />
                ))}
              </Card>
            </section>
          )}
          {others.length > 0 && (
            <section className="stack gap-2" aria-labelledby="other-h">
              {serious.length > 0 && (
                <h2 id="other-h" className="t-md t-semibold">
                  {t(K.open.otherHeading)}
                </h2>
              )}
              <Card className="ds-card--flush">
                {others.map((e) => (
                  <ExceptionRow key={e.id} e={e} onOpen={() => s.openException(e.id)} t={t} lang={lang} />
                ))}
              </Card>
            </section>
          )}
        </>
      )}
      {b.pending.length > 0 && (
        <section className="stack gap-2" aria-labelledby="pend-h">
          <h2 id="pend-h" className="t-md t-semibold">
            {t(K.open.pendingHeading, { count: b.pending.length })}
          </h2>
          <p className="t-xs t-muted">{t(K.open.pendingBody)}</p>
          <Card className="ds-card--flush">
            {b.pending.map((l) => (
              <div key={l.id} className="ds-listrow">
                <span className="stack grow" style={{ minWidth: 0 }}>
                  <strong className="t-sm">{l.codes.join(' + ')}</strong>
                  <span className="t-xs t-muted">
                    {l.counterparty} · {formatDateTime(l.date, lang)}
                  </span>
                </span>
                <strong className="num" style={{ flexShrink: 0 }}>
                  {signed(l.direction, l.amount)}
                </strong>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function ExceptionRow({ e, onOpen, t, lang }: { e: ReconExceptionView; onOpen: () => void; t: T; lang: string }) {
  return (
    <button type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={onOpen}>
      <span style={{ flexShrink: 0 }}>{e.direction === 'in' ? <ArrowDownLeft size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}</span>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <strong className="t-sm">{t(K.kind[e.kind].title)}</strong>
        <span className="t-xs t-muted">
          {e.counterparty} · {formatDateTime(e.occurredAt, lang)}
        </span>
        <span className="row gap-2 wrap">
          <Badge tone={SEVERITY_TONE[e.severity]}>{t(K.severity[e.severity])}</Badge>
          <span className="t-xs t-muted">{t(K.open.age, { count: e.ageDays })}</span>
        </span>
      </span>
      <span className="stack" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <strong className="num">{signed(e.direction, e.amount)}</strong>
        {e.difference !== null && <span className="t-xs t-muted num">{`${e.difference > 0 ? '+' : '−'}${formatINR(Math.abs(e.difference))}`}</span>}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ runs */

function RunsTab({ s, t, lang }: { s: AutoReconciliationState; t: T; lang: string }) {
  const b = s.board!;
  if (b.runs.length === 0) return <EmptyState icon={<Clock size={28} />} title={t(K.runs.emptyTitle)} body={t(K.runs.emptyBody)} />;
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.runs.intro)}</p>
      <Card className="ds-card--flush">
        {b.runs.map((r) => (
          <RunRow key={r.id} r={r} onOpen={() => s.openRun(r.id)} t={t} lang={lang} />
        ))}
      </Card>
    </div>
  );
}

function RunRow({ r, onOpen, t, lang }: { r: ReconRunRow; onOpen: () => void; t: T; lang: string }) {
  return (
    <button type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={onOpen}>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <strong className="t-sm">
          {r.code} · {formatDateTime(r.runAt, lang)}
        </strong>
        <span className="t-xs t-muted">
          {t(r.trigger === 'manual' ? K.runs.manual : K.runs.scheduled, { name: r.byName })} · {r.status === 'could_not_run' ? t(K.runs.countsNone) : t(K.runs.counts, { matched: r.matchedCount, open: r.unmatchedCount })}
        </span>
      </span>
      <Badge tone={STATUS_TONE[r.status]}>{t(K.status[r.status])}</Badge>
    </button>
  );
}

/* -------------------------------------------------------------- explained */

function ExplainedTab({ s, t, lang }: { s: AutoReconciliationState; t: T; lang: string }) {
  const b = s.board!;
  if (b.explained.length === 0) return <EmptyState icon={<CheckCircle size={28} />} title={t(K.explained.emptyTitle)} body={t(K.explained.emptyBody)} />;
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.explained.intro)}</p>
      <Card className="ds-card--flush">
        {b.explained.map((e) => (
          <button key={e.id} type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start' }} onClick={() => s.openException(e.id)}>
            <span className="stack grow" style={{ minWidth: 0 }}>
              <strong className="t-sm">
                {t(K.kind[e.kind].title)} · {e.counterparty}
              </strong>
              <span className="t-xs t-muted">
                {e.reconciled ? `${t(K.reconcile.reason[e.reconciled.category])} · ${t(K.explained.by, { name: e.reconciled.byName, date: formatDateTime(e.reconciled.at, lang) })}` : t(K.explained.cleared, { date: formatDateTime(e.clearedAt ?? e.occurredAt, lang) })}
              </span>
              {e.reconciled && <span className="t-xs">{e.reconciled.note}</span>}
            </span>
            <strong className="num" style={{ flexShrink: 0 }}>
              {signed(e.direction, e.amount)}
            </strong>
          </button>
        ))}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------ detail sheet */

function BankCard({ bank, t, lang }: { bank: BankSideView | null; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-1">
        <h3 className="t-sm t-semibold">{t(K.detail.bankHeading)}</h3>
        {bank ? (
          <>
            <strong className="num">{signed(bank.direction === 'credit' ? 'in' : 'out', bank.amount)}</strong>
            <span className="t-xs t-muted">{bank.narration}</span>
            <span className="t-xs t-muted">
              {t(K.detail.posted, { date: formatDateTime(bank.postedAt, lang) })} · {t(K.detail.reference)}: {bank.reference ?? t(K.detail.noReference)}
            </span>
          </>
        ) : (
          <span className="t-sm t-muted">{t(K.detail.nothingBank)}</span>
        )}
      </div>
    </Card>
  );
}

function AppCard({ ledger, t, lang }: { ledger: LedgerSideView | null; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-1">
        <h3 className="t-sm t-semibold">{t(K.detail.appHeading)}</h3>
        {ledger ? (
          <>
            <strong className="num">{signed(ledger.direction, ledger.amount)}</strong>
            <span className="t-xs t-muted">
              {t(K.ledgerKind[ledger.kind])} · {ledger.codes.join(' + ')} · {ledger.counterparty}
            </span>
            <span className="t-xs t-muted">
              {t(K.detail.recorded, { date: formatDateTime(ledger.date, lang) })} · {t(K.detail.reference)}: {ledger.reference ?? t(K.detail.noReference)}
            </span>
            {ledger.route && (
              <Link className="t-xs" to={ledger.route}>
                {t(K.detail.openRecord)}
              </Link>
            )}
          </>
        ) : (
          <span className="t-sm t-muted">{t(K.detail.nothingApp)}</span>
        )}
      </div>
    </Card>
  );
}

function ExceptionSheet({ s, t, lang, report }: { s: AutoReconciliationState; t: T; lang: string; report: Report }) {
  const e = s.current;
  return (
    <Sheet open={!!e} onClose={s.closeException} title={e ? t(K.kind[e.kind].title) : ''} closeLabel={t('action.close')}>
      {e && (
        <div className="stack gap-3">
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={SEVERITY_TONE[e.severity]}>{t(K.severity[e.severity])}</Badge>
            <strong className="num">{signed(e.direction, e.amount)}</strong>
            {e.difference !== null && (
              <span className="t-xs t-muted">
                {t(K.detail.difference)}: <span className="num">{`${e.difference > 0 ? '+' : '−'}${formatINR(Math.abs(e.difference))}`}</span>
              </span>
            )}
          </div>
          <div className="grid-2">
            <BankCard bank={e.bank} t={t} lang={lang} />
            <AppCard ledger={e.ledger} t={t} lang={lang} />
          </div>
          <div className="stack gap-1">
            <h3 className="t-sm t-semibold">{t(K.detail.whyHeading)}</h3>
            <p className="t-sm">{t(K.kind[e.kind].why)}</p>
            <p className="t-xs t-muted">{t(K.open.firstSeen, { date: formatDateTime(e.firstSeenAt, lang), code: e.firstSeenRunCode })}</p>
          </div>

          {e.status === 'open' ? <ReconcileForm s={s} e={e} t={t} report={report} /> : e.reconciled ? (
            <Card>
              <div className="stack gap-1">
                <strong className="t-sm">{t(K.reconcile.already, { category: t(K.reconcile.reason[e.reconciled.category]) })}</strong>
                <span className="t-sm">{e.reconciled.note}</span>
                <span className="t-xs t-muted">{t(K.explained.by, { name: e.reconciled.byName, date: formatDateTime(e.reconciled.at, lang) })}</span>
              </div>
            </Card>
          ) : (
            <p className="t-sm t-muted">{t(K.explained.cleared, { date: formatDateTime(e.clearedAt ?? e.occurredAt, lang) })}</p>
          )}
        </div>
      )}
    </Sheet>
  );
}

function ReconcileForm({ s, e, t, report }: { s: AutoReconciliationState; e: ReconExceptionView; t: T; report: Report }) {
  return (
    <div className="stack gap-3" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
      <h3 className="t-md t-semibold">{t(K.reconcile.heading)}</h3>
      {s.serious ? (
        <Card style={{ borderColor: 'var(--color-error)' }}>
          <div className="row-top gap-2">
            <WarningOctagon size={20} color="var(--color-error)" aria-hidden="true" />
            <p className="t-sm">{t(K.detail.seriousWarning)}</p>
          </div>
        </Card>
      ) : (
        <p className="t-sm t-muted">{t(K.reconcile.intro)}</p>
      )}
      <Field label={t(K.reconcile.category)} hint={s.chosen ? t(K.reconcile.reasonHint[s.chosen as ReconReason]) : undefined} required>
        {({ id, describedBy }) => (
          <Select id={id} aria-describedby={describedBy} value={s.chosen} onChange={(ev) => s.setCategory(ev.target.value as ReconReason)}>
            {e.canReconcileAs.map((r) => (
              <option key={r} value={r}>
                {t(K.reconcile.reason[r])}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={t(K.reconcile.note)} hint={t(s.serious || s.chosen === 'verified' ? K.reconcile.noteHintSerious : K.reconcile.noteHint, { count: s.needed })} required>
        {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.note} onChange={(ev) => s.setNote(ev.target.value)} />}
      </Field>
      {s.serious && <Checkbox checked={s.confirm} onChange={s.setConfirm} label={t(K.reconcile.confirm)} />}
      <Button
        disabled={!s.canSubmit || s.busy}
        onClick={async () => {
          report(await s.reconcile(), K.reconcile.done);
        }}
      >
        {t(K.reconcile.submit)}
      </Button>
    </div>
  );
}

/* --------------------------------------------------------------- run sheet */

function RunSheet({ s, t, lang }: { s: AutoReconciliationState; t: T; lang: string }) {
  const d = s.runDetail;
  const open = !!s.runParam;
  return (
    <Sheet open={open} onClose={s.closeRun} title={d ? `${d.code}` : t(K.run.heading)} closeLabel={t('action.close')}>
      {s.runLoading && !d ? (
        <LoadingState label={t(K.loading)} variant="list" rows={3} />
      ) : d ? (
        <div className="stack gap-3">
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={STATUS_TONE[d.status]}>{t(K.status[d.status])}</Badge>
            <span className="t-xs t-muted">{t(K.run.ran, { date: formatDateTime(d.runAt, lang), name: d.byName })}</span>
          </div>
          {d.status === 'could_not_run' ? (
            <Card style={{ borderColor: 'var(--color-warning)' }}>
              <p className="t-sm">{t(K.run.couldNot)}</p>
            </Card>
          ) : (
            <>
              <p className="t-xs t-muted">{t(K.run.window, { from: formatDateTime(d.windowFrom, lang), to: formatDateTime(d.windowTo, lang) })}</p>
              <section className="stack gap-2">
                <h3 className="t-md t-semibold">{t(K.run.unmatchedHeading, { count: d.unmatched.length })}</h3>
                {d.unmatched.length === 0 ? (
                  <p className="t-sm t-muted">{t(K.run.unmatchedNone)}</p>
                ) : (
                  <Card className="ds-card--flush">
                    {d.unmatched.map((e) => (
                      <ExceptionRow key={e.id} e={e} onOpen={() => s.openException(e.id)} t={t} lang={lang} />
                    ))}
                  </Card>
                )}
              </section>
              <section className="stack gap-2">
                <h3 className="t-md t-semibold">{t(K.run.matchedHeading, { count: d.matched.length, amount: formatINRCompact(d.matchedAmount) })}</h3>
                {d.matched.length === 0 ? (
                  <p className="t-sm t-muted">{t(K.run.matchedNone)}</p>
                ) : (
                  <Card className="ds-card--flush">
                    {d.matched.map((m) => (
                      <div key={m.ledger.id} className="ds-listrow">
                        <span className="stack grow" style={{ minWidth: 0 }}>
                          <strong className="t-sm">{m.ledger.codes.join(' + ')}</strong>
                          <span className="t-xs t-muted">
                            {m.ledger.counterparty} · {formatDateTime(m.bank.postedAt, lang)}
                          </span>
                          <span className="t-xs t-muted">{m.bank.narration}</span>
                        </span>
                        <CheckCircle size={16} color="var(--color-success)" aria-hidden="true" />
                        <strong className="num" style={{ flexShrink: 0 }}>
                          {signed(m.ledger.direction, m.ledger.amount)}
                        </strong>
                      </div>
                    ))}
                  </Card>
                )}
              </section>
            </>
          )}
        </div>
      ) : null}
    </Sheet>
  );
}
