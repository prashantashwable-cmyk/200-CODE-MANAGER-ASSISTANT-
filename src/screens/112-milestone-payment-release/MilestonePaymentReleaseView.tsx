import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Hand, Lightning, Robot, Scales, WarningOctagon, Wallet } from '@phosphor-icons/react';
import {
  AscensionLine,
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
  TextArea,
  formatDate,
  formatDateTime,
  formatINR,
  useToast,
} from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { PaymentChainNodeView, PaymentSplitPartView } from '@/data/repository';
import type { ChainSource } from '@/features/suppliers/paymentChain';
import { splitOf } from '@/features/suppliers/paymentChain';
import { useMilestonePaymentRelease } from './useMilestonePaymentRelease';
import type { ActionResult, MilestoneReleaseState } from './useMilestonePaymentRelease';
import { CHAIN_FILTERS, RELEASE_KEYS as K } from './milestone-payment-release.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string) => void;

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const SOURCE_TONE: Record<ChainSource, BadgeTone> = { event: 'emerald', system: 'neutral', manual: 'warning' };
const SOURCE_ICON: Record<ChainSource, JSX.Element> = {
  event: <Lightning size={12} aria-hidden="true" />,
  system: <Robot size={12} aria-hidden="true" />,
  manual: <Hand size={12} aria-hidden="true" />,
};
const STATE_TONE: Record<PaymentSplitPartView['state'], BadgeTone> = { not_due: 'neutral', pending: 'warning', held: 'warning', approved: 'accent', paid: 'success' };

/**
 * Screen 112 — Milestone-Linked Payment Release. The full chain behind one order's payments: which real event fires
 * each portion, when each did, and who (or what) fired it. What a person decided is always drawn differently from
 * what the system did on its own, so the record stays honest about where judgement intervened.
 */
export function MilestonePaymentReleaseView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useMilestonePaymentRelease();

  const report: Report = (r, success) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success), 'success');
  };

  if (s.status === 'loading' && !s.chain && s.chains.length === 0) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }
  if (s.status === 'error') {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }
  const lang = i18n.language;
  if (s.hasDetail) {
    if (s.missing || !s.chain) {
      return (
        <Screen width="narrow">
          <ScreenHeader title={t(K.title)} back={s.closeChain} backLabel={t('action.back')} />
          <EmptyState icon={<Wallet size={32} />} title={t(K.list.notFound)} body={t(K.list.emptyBody)} actionLabel={t(K.list.back)} onAction={s.closeChain} />
        </Screen>
      );
    }
    return <ChainDetail s={s} t={t} lang={lang} report={report} />;
  }
  return <ChainList s={s} t={t} />;
}

/* ------------------------------------------------------------------ list */

function ChainList({ s, t }: { s: MilestoneReleaseState; t: T }) {
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      {s.chains.length === 0 ? (
        <EmptyState icon={<Wallet size={32} />} title={t(K.list.emptyTitle)} body={t(K.list.emptyBody)} />
      ) : (
        <>
          <div className="sticky-under-shell stack gap-2 mb-3">
            <Input aria-label={t(K.list.search)} placeholder={t(K.list.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
            <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.list.filterLabel)}>
              {CHAIN_FILTERS.map((f) => (
                <Chip key={f} pressed={s.filter === f} onClick={() => s.setFilter(f)}>
                  {t(K.list[f])} · {s.counts[f]}
                </Chip>
              ))}
            </div>
          </div>
          {s.shown.length === 0 ? (
            <EmptyState
              icon={<Wallet size={28} />}
              title={t(K.list.emptySearchTitle)}
              body={t(K.list.emptySearchBody)}
              actionLabel={t(K.list.clear)}
              onAction={() => {
                s.setFilter('all');
                s.setQuery('');
              }}
            />
          ) : (
            <Card className="ds-card--flush">
              {s.shown.map((c) => (
                <button key={c.poId} type="button" className="ds-listrow" style={{ width: '100%', textAlign: 'start', alignItems: 'flex-start' }} onClick={() => s.openChain(c.poId)}>
                  <span className="ds-listrow__lead" aria-hidden="true">
                    <Wallet size={22} color="var(--color-accent-secondary)" />
                  </span>
                  <span className="stack grow" style={{ minWidth: 0, gap: 'var(--space-1)' }}>
                    <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                      <strong className="t-sm">{c.poCode}</strong>
                      {c.anomaly && (
                        <Badge tone="error">
                          <WarningOctagon size={12} aria-hidden="true" /> {t(K.list.outOfOrder)}
                        </Badge>
                      )}
                      {c.custom && <Badge tone="accent">{t(K.list.customSplit)}</Badge>}
                      {c.pending > 0 && <Badge tone="warning">{t(K.list.waiting, { count: c.pending })}</Badge>}
                    </span>
                    <span className="t-xs t-muted">{[c.supplierName, c.siteName].filter(Boolean).join(' · ')}</span>
                    <ProgressBar value={c.total === 0 ? 0 : c.paid / c.total} label={t(K.list.paidOf, { paid: formatINR(c.paid), total: formatINR(c.total) })} />
                    <span className="t-xs t-muted">{t(K.list.paidOf, { paid: formatINR(c.paid), total: formatINR(c.total) })}</span>
                  </span>
                  <Badge tone={c.state === 'complete' ? 'success' : c.state === 'in_progress' ? 'accent' : 'neutral'}>{t(c.state === 'complete' ? K.list.complete : c.state === 'in_progress' ? K.list.inProgress : K.list.awaiting)}</Badge>
                </button>
              ))}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

/* ---------------------------------------------------------------- detail */

function ChainDetail({ s, t, lang, report }: { s: MilestoneReleaseState; t: T; lang: string; report: Report }) {
  const navigate = useNavigate();
  const c = s.chain!;
  const steps: AscensionStep[] = c.nodes.map((n) => nodeStep(n, c.netDays, t, lang, navigate));
  return (
    <Screen width="default">
      <ScreenHeader
        title={c.poCode}
        subtitle={[c.supplierName, c.siteName].filter(Boolean).join(' · ')}
        back={s.closeChain}
        backLabel={t('action.back')}
        action={
          <Badge tone={c.custom ? 'accent' : 'neutral'}>
            {c.upfrontPct}% / {c.retentionPct}%
          </Badge>
        }
      />
      {c.anomalies.length > 0 && (
        <Card className="mb-3">
          <div className="stack gap-1" role="alert">
            <strong className="t-sm row gap-1" style={{ alignItems: 'center' }}>
              <WarningOctagon size={16} aria-hidden="true" color="var(--color-error)" /> {t(K.anomaly.heading)}
            </strong>
            {c.anomalies.map((a) => (
              <span key={a} className="t-sm">
                {t(K.anomaly[a])}
              </span>
            ))}
            <span className="t-xs t-muted">{t(K.anomaly.action)}</span>
          </div>
        </Card>
      )}
      <div className="main-aside">
        <div className="stack gap-3">
          <Card>
            <div className="stack gap-3">
              <div className="stack">
                <h2 className="t-md t-semibold">{t(K.chain.heading)}</h2>
                <p className="t-xs t-muted">{t(K.chain.hint)}</p>
              </div>
              <AscensionLine steps={steps} className="ds-ascension--multiline" />
            </div>
          </Card>
          <Timeline s={s} t={t} lang={lang} />
        </div>
        <div className="stack gap-3">
          <SplitCard s={s} t={t} lang={lang} navigate={navigate} />
          {c.deviations.length > 0 && (
            <Card>
              <div className="stack gap-2">
                <h2 className="t-md t-semibold row gap-1" style={{ alignItems: 'center' }}>
                  <Scales size={18} aria-hidden="true" /> {t(K.deviation.heading)}
                </h2>
                {c.deviations.map((d) => (
                  <div key={d.id} className="stack" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                    <span className="t-sm">{t(K.deviation.change, { from: `${d.before.upfrontPct}% / ${d.before.retentionPct}%`, to: `${d.after.upfrontPct}% / ${d.after.retentionPct}%` })}</span>
                    <span className="t-sm">{d.reason}</span>
                    <span className="t-xs t-muted">
                      {t(K.deviation.by, { name: d.byName })} · {formatDateTime(d.at, lang)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
      <AdjustSheet s={s} t={t} report={report} />
      <EarlySheet s={s} t={t} report={report} />
    </Screen>
  );
}

function nodeStep(n: PaymentChainNodeView, netDays: number | null, t: T, lang: string, navigate: (to: string) => void): AscensionStep {
  const status: AscensionStep['status'] = n.state === 'done' ? 'complete' : n.state === 'current' ? 'current' : n.state === 'anomaly' ? 'blocked' : 'upcoming';
  const bits: string[] = [];
  if (n.at) bits.push(t(K.chain.firedOn, { when: formatDateTime(n.at, lang) }));
  else if (n.expectedAt) bits.push(t(K.chain.expected, { date: formatDate(n.expectedAt, lang) }));
  else bits.push(t(K.chain.notYet));
  if (n.byName) bits.push(n.byName);
  if (n.ref && n.kind === 'net_period' && netDays !== null) bits.push(t(K.chain.netDays, { count: netDays }));
  else if (n.ref && n.kind === 'delivery_confirmed') bits.push(n.ref);
  if (n.state === 'anomaly') bits.push(t(K.chain.outOfOrderNode));
  return {
    id: n.kind,
    label: t(K.node[n.kind]),
    meta: `${t(K.nodeHint[n.kind])} ${bits.join(' · ')}`,
    status,
    trailing: (
      <span className="stack" style={{ alignItems: 'flex-end', gap: 4 }}>
        {n.source && (
          <Badge tone={SOURCE_TONE[n.source]}>
            {SOURCE_ICON[n.source]} {t(K.source[n.source])}
          </Badge>
        )}
        {n.route && n.at && (
          <Button size="sm" variant="ghost" onClick={() => navigate(n.route!)}>
            {t(K.chain.open)}
          </Button>
        )}
      </span>
    ),
  };
}

function SplitCard({ s, t, lang, navigate }: { s: MilestoneReleaseState; t: T; lang: string; navigate: (to: string) => void }) {
  const c = s.chain!;
  const anyEditable = c.parts.some((p) => p.editable);
  return (
    <Card>
      <div className="stack gap-3">
        <div className="stack">
          <h2 className="t-md t-semibold">{t(K.split.heading)}</h2>
          <p className="t-xs t-muted">{t(K.split.hint)}</p>
        </div>
        {c.custom && (
          <p className="t-xs" role="note">
            {t(K.split.customBanner)}
          </p>
        )}
        {c.parts.map((p) => (
          <PartRow key={p.part} p={p} s={s} t={t} lang={lang} navigate={navigate} />
        ))}
        <div className="row between gap-2" style={{ borderTop: '2px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
          <strong>{t(K.split.total)}</strong>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(c.total)}</strong>
        </div>
        <span className="t-xs t-muted">{t(K.split.paidOnOrder, { amount: formatINR(c.paid) })}</span>
        <div className="stack gap-1">
          <Button variant="secondary" disabled={!anyEditable || s.busy} onClick={s.openAdjust}>
            {t(K.split.adjust)}
          </Button>
          {!anyEditable && <span className="t-xs t-muted">{t(K.split.nothingEditable)}</span>}
        </div>
      </div>
    </Card>
  );
}

function PartRow({ p, s, t, lang, navigate }: { p: PaymentSplitPartView; s: MilestoneReleaseState; t: T; lang: string; navigate: (to: string) => void }) {
  const focus = !!p.paymentId && p.paymentId === s.chain!.focusPaymentId;
  return (
    <div className="stack gap-1" style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', outline: focus ? '2px solid var(--color-accent-primary)' : undefined }}>
      <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
        <strong className="t-sm">
          {t(K.split.part[p.part])} · {p.pct}%
        </strong>
        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(p.amount)}</strong>
      </div>
      <div className="row gap-1 wrap" style={{ alignItems: 'center' }}>
        <Badge tone={STATE_TONE[p.state]}>{t(K.split.state[p.state])}</Badge>
        {p.origin === 'override' && (
          <Badge tone="warning">
            <Hand size={12} aria-hidden="true" /> {t(K.split.early)}
          </Badge>
        )}
        {p.heldAuto && <Badge tone="neutral">{t(K.split.heldAuto)}</Badge>}
      </div>
      <span className="t-xs t-muted">{p.dueAt ? t(p.dueIsExpected ? K.split.expectedDue : K.split.due, { date: formatDate(p.dueAt, lang) }) : t(K.split.noDate)}</span>
      {p.overrideReason && <span className="t-xs">{p.overrideReason}</span>}
      {!p.editable && p.state !== 'not_due' && p.state !== 'pending' && p.state !== 'held' && <span className="t-xs t-muted">{t(K.split.locked)}</span>}
      <div className="row gap-2 wrap">
        {p.paymentId && (p.state === 'pending' || p.state === 'held' || p.state === 'approved') && (
          <Button size="sm" variant="secondary" onClick={() => navigate(`/supplier-payments?payment=${p.paymentId}`)}>
            {t(K.split.openInQueue)}
          </Button>
        )}
        {p.canReleaseEarly && (
          <Button size="sm" variant="ghost" disabled={s.busy} onClick={() => s.openEarly(p.part)}>
            {t(K.split.releaseEarly)}
          </Button>
        )}
      </div>
    </div>
  );
}

function Timeline({ s, t, lang }: { s: MilestoneReleaseState; t: T; lang: string }) {
  const c = s.chain!;
  return (
    <Card>
      <div className="stack gap-2">
        <div className="stack">
          <h2 className="t-md t-semibold">{t(K.timeline.heading)}</h2>
          <p className="t-xs t-muted">{t(K.timeline.hint)}</p>
        </div>
        {c.timeline.length === 0 ? (
          <p className="t-sm t-muted">{t(K.timeline.empty)}</p>
        ) : (
          c.timeline.map((e) => (
            <div
              key={e.id}
              className="stack"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderInlineStart: `3px solid ${e.source === 'manual' ? 'var(--color-warning)' : 'var(--color-border)'}`,
                background: e.source === 'manual' ? 'var(--color-surface-alt, transparent)' : undefined,
              }}
            >
              <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                <strong className="t-sm">{t(K.timeline.kind[e.kind])}</strong>
                <Badge tone={SOURCE_TONE[e.source]}>
                  {SOURCE_ICON[e.source]} {t(K.source[e.source])}
                </Badge>
                {e.part && <span className="t-xs t-muted">{t(K.split.part[e.part])}</span>}
              </span>
              <span className="t-xs t-muted">
                {formatDateTime(e.at, lang)}
                {e.byName ? ` · ${t(K.timeline.by, { name: e.byName })}` : ''}
              </span>
              {e.note && <span className="t-xs">{e.note}</span>}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- sheets */

function AdjustSheet({ s, t, report }: { s: MilestoneReleaseState; t: T; report: Report }) {
  const c = s.chain;
  const previewParts = c && Number.isFinite(s.nextUpfront) && Number.isFinite(s.nextRetention) ? splitOf(c.total, { termType: c.termType, upfrontPct: s.nextUpfront, retentionPct: s.nextRetention }) : [];
  const shownIssues = s.adjustIssues.filter((i) => i !== 'reason_required' || s.reason.length > 0);
  const lockedParts = c ? c.parts.filter((p) => !p.editable && p.state !== 'not_due') : [];
  return (
    <Sheet open={s.adjustOpen} onClose={() => s.setAdjustOpen(false)} title={t(K.adjust.title)} closeLabel={t('action.close')}>
      {c && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.adjust.intro)}</p>
          <div className="grid-2">
            <Field label={t(c.termType === 'net' ? K.adjust.upfrontNet : K.adjust.upfront)} required>
              {({ id }) => <Input id={id} type="number" inputMode="numeric" min={0} value={s.upfront} disabled={c.termType === 'net'} onChange={(e) => s.setUpfront(e.target.value)} />}
            </Field>
            <Field label={t(K.adjust.retention)} required>
              {({ id }) => <Input id={id} type="number" inputMode="numeric" min={0} value={s.retention} onChange={(e) => s.setRetention(e.target.value)} />}
            </Field>
          </div>
          {previewParts.length > 0 && (
            <div className="stack gap-1" aria-live="polite">
              <span className="t-xs t-muted">{t(K.adjust.preview)}</span>
              {previewParts.map((p) => (
                <span key={p.part} className="row between t-sm">
                  <span>
                    {t(K.split.part[p.part])} · {p.pct}%
                  </span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(p.amount)}</strong>
                </span>
              ))}
            </div>
          )}
          {lockedParts.length > 0 && <p className="t-xs t-muted">{t(K.adjust.lockedNote, { parts: lockedParts.map((p) => t(K.split.part[p.part])).join(', ') })}</p>}
          <Field label={t(K.adjust.reason)} hint={t(K.adjust.reasonHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.reason} onChange={(e) => s.setReason(e.target.value)} />}
          </Field>
          {shownIssues.map((i) => (
            <p key={i} className="t-xs t-error" role="alert">
              {t(K.adjust.issue[i])}
            </p>
          ))}
          {s.risky && (
            <div className="stack gap-1" role="note">
              <span className="t-sm">{t(K.adjust.risk)}</span>
              <Checkbox checked={s.ackRisk} onChange={s.setAckRisk} label={<span className="t-sm">{t(K.adjust.riskAck)}</span>} />
            </div>
          )}
          <Button disabled={!s.canSaveAdjust || s.busy} onClick={async () => report(await s.saveAdjust(), K.adjust.saved)}>
            {t(K.adjust.save)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function EarlySheet({ s, t, report }: { s: MilestoneReleaseState; t: T; report: Report }) {
  return (
    <Sheet open={!!s.earlyFor} onClose={() => s.setEarlyFor(null)} title={t(K.early.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.early.intro)}</p>
        <Field label={t(K.early.reason)} hint={t(K.early.reasonHint)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.earlyReason} onChange={(e) => s.setEarlyReason(e.target.value)} />}
        </Field>
        <Button disabled={s.busy || s.earlyReason.trim().length < 8} onClick={async () => report(await s.confirmEarly(), K.early.done)}>
          {t(K.early.confirm)}
        </Button>
      </div>
    </Sheet>
  );
}

