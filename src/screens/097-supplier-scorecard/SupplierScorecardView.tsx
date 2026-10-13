import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CaretDown, CaretUp, FileText, Info, NotePencil, Scales } from '@phosphor-icons/react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AscensionLine,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  Tabs,
  TextArea,
  formatDate,
  useToast,
} from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { ScoredOrderRating } from '@/data/repository';
import type { DefectAttribution } from '@/data/types';
import { computeSupplierPerformanceScore } from '@/features/suppliers/performanceScore';
import { SCORE_DELTA_ORDERS } from '@/features/suppliers/orderRating';
import { NEUTRAL_PERFORMANCE, performanceFor } from '@/features/suppliers/supplierMatching';
import { useSupplierScorecard } from './useSupplierScorecard';
import type { SupplierScorecardState } from './useSupplierScorecard';
import { SCORECARD_TABS, SUPPLIER_SCORECARD_KEYS as K } from './supplier-scorecard.types';

type T = (key: string, params?: Record<string, unknown>) => string;

const ATTRIBUTIONS: DefectAttribution[] = ['supplier', 'installation', 'transport'];
const STATUS_TONE: Record<string, BadgeTone> = { active: 'success', pending_approval: 'warning', suspended: 'error' };

/**
 * Screen 097 — Supplier Rating & Quality Scorecard. The drillable version of
 * 026's score: every rated order behind it, the formula in plain view for
 * the supplier too, and a fair route to challenge a rating. One engine —
 * nothing here computes a score its own way.
 */
export function SupplierScorecardView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useSupplierScorecard();
  const lang = i18n.language;
  const notify = (ok: boolean, key: string) => toast.push(t(ok ? key : K.toast.error), ok ? 'success' : 'error');

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }
  if (s.status === 'not_found') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </Screen>
    );
  }
  if (s.status === 'pick') {
    // Admin without a supplier chosen — every supplier, with the same score 026 shows.
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitleAdmin)} />
        <h2 className="t-lg mb-2">{t(K.pick.heading)}</h2>
        <Card className="ds-card--flush">
          {s.suppliers.map((sp) => (
            <button key={sp.id} type="button" className="ds-listrow" onClick={() => s.pickSupplier(sp.id)}>
              <span className="ds-avatar shrink-0" aria-hidden="true">
                <Scales size={20} />
              </span>
              <span className="grow t-medium">{sp.name}</span>
              <span className="num t-semibold">
                {performanceFor(sp).isDefault ? t(K.pick.unrated) : t(K.pick.score, { score: computeSupplierPerformanceScore(sp).toFixed(2) })}
              </span>
            </button>
          ))}
        </Card>
      </Screen>
    );
  }

  const card = s.card!;
  const { supplier } = card;
  const delta = card.previousScore !== null ? card.score - card.previousScore : null;
  // No delivery yet means nothing to score — never show a new supplier as 0%.
  const unrated = card.ratedOrders === 0;

  return (
    <Screen>
      <ScreenHeader
        title={supplier.name}
        subtitle={t(s.isAdmin ? K.subtitleAdmin : K.subtitleSupplier)}
        back={s.isAdmin ? () => navigate(-1) : undefined}
        action={
          s.isAdmin ? (
            <Button size="sm" icon={<NotePencil size={16} />} onClick={() => s.setNoteOpen(true)}>
              {t(K.context.add)}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => s.setTab('orders')}>
              {t(K.action.disputeCta)}
            </Button>
          )
        }
      />

      {/* Hero — the score and the two things it's made of. */}
      <Card className="mb-3">
        <div className="row between gap-2 wrap">
          <Badge tone={STATUS_TONE[supplier.status] ?? 'neutral'}>{t(`supplierDirectory.status.${supplier.status}`)}</Badge>
          <span className="t-xs t-muted">
            {unrated ? t(K.hero.noOrders, { neutral: NEUTRAL_PERFORMANCE.toFixed(2) }) : t(K.hero.basis, { count: Math.min(card.ratedOrders, card.windowSize) })}
          </span>
        </div>
        <div className="grid-auto gap-3 mt-3" style={{ ['--min' as string]: '140px' }}>
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.hero.score)}</span>
            <span className="stack gap-1">
              <span className="num t-semibold" style={{ fontSize: unrated ? undefined : 'var(--text-2xl, 1.75rem)' }}>
                {unrated ? t(K.hero.unrated) : card.score.toFixed(2)}
              </span>
              {delta !== null && (
                <span className={`t-xs row gap-1 ${delta > 0.005 ? 't-success' : delta < -0.005 ? 't-warning' : 't-muted'}`}>
                  {delta > 0.005 ? <CaretUp size={12} /> : delta < -0.005 ? <CaretDown size={12} /> : null}
                  {t(delta > 0.005 ? K.hero.up : delta < -0.005 ? K.hero.down : K.hero.steady, { delta: Math.abs(delta).toFixed(2), count: SCORE_DELTA_ORDERS })}
                </span>
              )}
            </span>
          </div>
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.hero.onTime)}</span>
            <span className="num t-semibold">{unrated ? '—' : `${Math.round(supplier.onTimeRate * 100)}%`}</span>
          </div>
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.hero.quality)}</span>
            <span className="num t-semibold">{unrated ? '—' : `${supplier.qualityScore.toFixed(1)} / 5`}</span>
          </div>
        </div>
        {/* The standard this score is read against — the supplier's own agreement (098). */}
        <div className="row between gap-2 wrap hairline-top pt-2 mt-3">
          <span className="t-xs t-muted grow" style={{ minWidth: 200 }}>
            {card.agreedTerms
              ? t(K.hero.agreed, { sla: card.agreedTerms.deliverySlaDays, quality: card.agreedTerms.minQualityScore.toFixed(1) })
              : t(K.hero.noAgreement)}
          </span>
          {card.agreedTerms && !unrated && supplier.qualityScore < card.agreedTerms.minQualityScore && <Badge tone="warning">{t(K.hero.belowAgreed)}</Badge>}
          <Button size="sm" variant="ghost" icon={<FileText size={16} />} onClick={() => navigate(s.isAdmin ? `/agreement?supplierId=${supplier.id}` : '/agreement')}>
            {t(K.hero.viewAgreement)}
          </Button>
        </div>
      </Card>

      {/* Context explains a number; it never changes it. */}
      {card.contextNotes.length > 0 && (
        <Card className="mb-3">
          <h2 className="t-sm t-semibold row gap-2">
            <Info size={16} /> {t(K.context.heading)}
          </h2>
          <div className="stack gap-2 mt-2">
            {card.contextNotes.map((n) => (
              <div key={n.id} className="stack gap-1">
                <p className="t-sm">{n.note}</p>
                <span className="t-xs t-muted row wrap gap-2">
                  {t(K.context.by, { name: n.addedBy, date: formatDate(n.addedAt, lang) })}
                  {n.sourceThreadId && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/supplier-messages?thread=${n.sourceThreadId}`)}>
                      {t(K.context.fromMessage)}
                    </Button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Tabs
        className="mb-3"
        label={supplier.name}
        value={s.tab}
        onChange={(id) => s.setTab(id as typeof s.tab)}
        items={SCORECARD_TABS.map((tab) => ({
          id: tab,
          label: tab === 'orders' ? `${t(K.tab.orders)} · ${card.ratedOrders}` : tab === 'disputes' ? `${t(K.tab.disputes)} · ${s.openDisputes}` : t(K.tab.breakdown),
        }))}
      />

      {s.tab === 'breakdown' && <Breakdown s={s} t={t} />}
      {s.tab === 'orders' && (
        <>
          {!s.isAdmin && <p className="t-xs t-muted mb-2">{t(K.action.disputeHint)}</p>}
          <OrderList rows={card.ratings} s={s} t={t} lang={lang} emptyKey={K.orders.empty} />
        </>
      )}
      {s.tab === 'disputes' && (
        <OrderList rows={s.disputed} s={s} t={t} lang={lang} emptyKey={K.disputes.empty} emptyBody={s.isAdmin ? undefined : t(K.action.disputeHint)} />
      )}

      <RatingSheet s={s} t={t} lang={lang} notify={notify} />

      <Sheet
        open={s.noteOpen}
        onClose={() => s.setNoteOpen(false)}
        title={t(K.context.addTitle)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={s.contextNote.trim().length < 10} loading={s.busy} onClick={() => void s.addContextNote().then((ok) => notify(ok, K.toast.noteAdded))}>
            {t(K.context.save)}
          </Button>
        }
      >
        <p className="t-xs t-muted mb-2">{t(K.context.addHint)}</p>
        <TextArea aria-label={t(K.context.addTitle)} rows={4} value={s.contextNote} onChange={(e) => s.setContextNote(e.target.value)} />
      </Sheet>
    </Screen>
  );
}

function Breakdown({ s, t }: { s: SupplierScorecardState; t: T }) {
  const card = s.card!;
  return (
    <div className="grid-auto gap-3" style={{ ['--min' as string]: '320px', alignItems: 'start' }}>
      <Card>
        <p className="t-sm">{t(K.breakdown.intro)}</p>
        {card.ratedOrders === 0 ? (
          <p className="t-sm t-muted mt-3">{t(K.hero.noOrders, { neutral: NEUTRAL_PERFORMANCE.toFixed(2) })}</p>
        ) : (
          <div className="stack gap-2 mt-3">
            {card.breakdown.map((c) => (
              <div key={c.key} className="stack gap-1 hairline-top pt-2">
                <div className="row between gap-2">
                  <span className="t-sm t-medium">{t(K.breakdown.component[c.key])}</span>
                  <span className="num t-sm">+{c.contribution.toFixed(3)}</span>
                </div>
                <span className="t-xs t-muted">
                  {t(K.breakdown.row, { value: c.value.toFixed(2), weight: Math.round(c.weight * 100) })}
                  {c.isPlaceholder ? ` · ${t(K.breakdown.placeholder)}` : ''}
                </span>
              </div>
            ))}
            <div className="row between gap-2 hairline-top pt-2">
              <span className="t-sm t-semibold">{t(K.breakdown.total)}</span>
              <span className="num t-semibold">{card.score.toFixed(3)}</span>
            </div>
          </div>
        )}
        <div className="stack gap-1 mt-3">
          <p className="t-xs t-muted">{t(K.breakdown.howOnTime)}</p>
          <p className="t-xs t-muted">{t(K.breakdown.howQuality)}</p>
          <p className="t-xs t-muted">{t(K.breakdown.howWindow, { count: card.windowSize })}</p>
          {card.deliveryReschedules.total > 0 && (
            <p className="t-xs t-muted">{t(K.breakdown.reschedules, { total: card.deliveryReschedules.total, supplier: card.deliveryReschedules.supplierCaused })}</p>
          )}
        </div>
      </Card>

      <Card>
        {/* One series, so no legend — the heading names it. */}
        <h2 className="t-md t-semibold">{t(K.breakdown.trend)}</h2>
        <p className="t-xs t-muted mb-2">{t(K.breakdown.trendHint)}</p>
        {s.trend.length < 2 ? (
          <p className="t-sm t-muted">{t(K.breakdown.trendEmpty)}</p>
        ) : (
          <div role="img" aria-label={t(K.breakdown.trend)}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={s.trend} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="code" hide />
                <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ stroke: 'var(--color-border)' }}
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)', fontSize: 12 }}
                  formatter={(value: number) => [value.toFixed(2), t(K.breakdown.trendTooltip)]}
                  labelFormatter={(code: string) => code}
                />
                <Line type="monotone" dataKey="score" stroke="var(--color-accent-secondary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-accent-secondary)', stroke: 'var(--color-surface)', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

function disputeBadge(r: ScoredOrderRating, t: T) {
  const status = r.rating.dispute?.status;
  if (!status) return null;
  const map = { open: ['warning', K.orders.disputeOpen], upheld: ['success', K.orders.disputeUpheld], rejected: ['neutral', K.orders.disputeRejected] } as const;
  return <Badge tone={map[status][0]}>{t(map[status][1])}</Badge>;
}

function OrderList({ rows, s, t, lang, emptyKey, emptyBody }: { rows: ScoredOrderRating[]; s: SupplierScorecardState; t: T; lang: string; emptyKey: string; emptyBody?: string }) {
  if (rows.length === 0) return <EmptyState title={t(emptyKey)} body={emptyBody ?? t(K.breakdown.howWindow, { count: s.card!.windowSize })} />;
  return (
    <Card className="ds-card--flush">
      {rows.map((r) => (
        <button key={r.rating.id} type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} onClick={() => s.openSheet(r.rating.id)}>
          <span className="grow stack gap-1" style={{ minWidth: 0 }}>
            <span className="t-medium">
              {r.rating.orderCode} · {r.rating.siteName}
            </span>
            <span className="t-xs t-muted">
              {formatDate(r.rating.deliveredAt, lang)} · {t(K.orders.quality, { quality: r.quality.toFixed(1) })}
              {r.rating.defects.length > 0 ? ` · ${t(K.orders.defects, { count: r.rating.defects.length })}` : ''}
              {!r.inWindow ? ` · ${t(K.orders.outsideWindow)}` : ''}
            </span>
            {s.tab === 'disputes' && r.rating.dispute && (
              <span className="t-xs t-muted">
                {t(K.disputes.raised, { date: formatDate(r.rating.dispute.raisedAt, lang) })} · {r.rating.dispute.raisedBy}
              </span>
            )}
            <span className="row wrap gap-1">
              <Badge tone={r.onTime ? 'success' : 'warning'}>
                {r.onTime ? t(K.orders.onTime) : t(K.orders.late, { days: r.rating.timelinessDays })}
              </Badge>
              {disputeBadge(r, t)}
              {r.rating.delayCause && <Badge tone={r.rating.delayCause === 'external_event' ? 'neutral' : 'warning'}>{t(`deliveryDelay.cause.${r.rating.delayCause}`)}</Badge>}
            </span>
          </span>
          <span className="num t-semibold shrink-0">{r.orderScore.toFixed(2)}</span>
        </button>
      ))}
    </Card>
  );
}

function RatingSheet({ s, t, lang, notify }: { s: SupplierScorecardState; t: T; lang: string; notify: (ok: boolean, key: string) => void }) {
  const r = s.openRating;
  if (!r) return <Sheet open={false} onClose={s.closeSheet} title="" closeLabel={t('action.close')}>{null}</Sheet>;
  const { rating } = r;
  const dispute = rating.dispute;

  // Every event in the order it happened. A resolution and the reattribution it
  // made share a moment, so the resolution is listed first and reads as the cause.
  const events: { at: string; step: AscensionStep }[] = [
    { at: rating.deliveredAt, step: { id: 'delivered', label: t(K.sheet.tlDelivered, { days: rating.timelinessDays }), meta: formatDate(rating.deliveredAt, lang), status: 'complete' } },
  ];
  if (dispute) {
    events.push({
      at: dispute.raisedAt,
      step: { id: 'dispute', label: t(K.sheet.tlDisputed, { reason: dispute.reason }), meta: `${dispute.raisedBy}, ${formatDate(dispute.raisedAt, lang)}`, status: dispute.status === 'open' ? 'current' : 'complete' },
    });
    if (dispute.resolvedAt) {
      events.push({
        at: dispute.resolvedAt,
        step: {
          id: 'resolved',
          label: t(K.sheet.tlResolved, { outcome: t(dispute.status === 'upheld' ? K.sheet.resolve.upheld : K.sheet.resolve.rejected), note: dispute.resolutionNote ?? '' }),
          meta: `${dispute.resolvedBy}, ${formatDate(dispute.resolvedAt, lang)}`,
          status: 'complete',
        },
      });
    }
  }
  if (rating.adminQuality) {
    const at = rating.adminQualityAt ?? rating.deliveredAt;
    events.push({
      at,
      step: { id: 'aq', label: t(K.sheet.tlAdminQuality, { quality: rating.adminQuality, note: rating.adminQualityNote ?? '' }), meta: `${rating.adminQualityBy ?? ''}, ${formatDate(at, lang)}`, status: 'complete' },
    });
  }
  for (const d of rating.defects) {
    events.push({
      at: d.loggedAt,
      step: { id: d.id, label: t(K.sheet.tlDefect, { note: d.note, who: t(K.sheet.attribution[d.attributedBefore ?? d.attribution]) }), meta: `${d.loggedBy}, ${formatDate(d.loggedAt, lang)}`, status: 'complete' },
    });
    if (d.reattributedAt) {
      events.push({
        at: d.reattributedAt,
        step: { id: `${d.id}-re`, label: t(K.sheet.tlReattributed, { who: t(K.sheet.attribution[d.attribution]) }), meta: `${d.reattributedBy}, ${formatDate(d.reattributedAt, lang)}`, status: 'complete' },
      });
    }
  }
  // Array sort is stable, so equal moments keep the order they were pushed in.
  const steps = events.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).map((e) => e.step);
  const supplierDefects = rating.defects.filter((d) => d.attribution === 'supplier');

  return (
    <Sheet open onClose={s.closeSheet} title={t(K.sheet.title, { code: rating.orderCode })} closeLabel={t('action.close')}>
      <div className="stack gap-4">
        <div className="grid-2 gap-2">
          <span className="t-xs t-muted">{t(K.sheet.promised, { date: formatDate(rating.expectedDeliveryDate, lang) })}</span>
          <span className="t-xs t-muted">{t(K.sheet.delivered, { date: formatDate(rating.deliveredAt, lang) })}</span>
          <span className="t-sm">{t(K.orders.quality, { quality: r.quality.toFixed(1) })}</span>
          <span className="t-sm num">{t(K.sheet.orderScore, { score: r.orderScore.toFixed(2) })}</span>
        </div>
        {rating.defects.some((d) => d.attribution !== 'supplier') && <p className="t-xs t-muted">{t(K.sheet.notCounted)}</p>}

        <section className="stack gap-2">
          <h3 className="label">{t(K.sheet.timeline)}</h3>
          <AscensionLine steps={steps} />
        </section>

        {/* Supplier: challenge the rating — it opens a case, nothing more. */}
        {!s.isAdmin && !dispute && (
          <section className="stack gap-2 hairline-top pt-3">
            <h3 className="t-md t-semibold">{t(K.sheet.dispute.heading)}</h3>
            <p className="t-xs t-muted">{t(K.sheet.dispute.hint)}</p>
            <TextArea aria-label={t(K.sheet.dispute.reason)} placeholder={t(K.sheet.dispute.reason)} value={s.disputeReason} onChange={(e) => s.setDisputeReason(e.target.value)} />
            <div>
              <Button size="sm" disabled={s.disputeReason.trim().length < 10} loading={s.busy} onClick={() => void s.raiseDispute().then((ok) => notify(ok, K.toast.disputed))}>
                {t(K.sheet.dispute.submit)}
              </Button>
            </div>
          </section>
        )}
        {!s.isAdmin && dispute?.status === 'open' && <p className="t-sm t-muted">{t(K.sheet.dispute.pending)}</p>}

        {/* Admin: decide an open dispute, with its effect shown first. */}
        {s.isAdmin && dispute?.status === 'open' && (
          <section className="stack gap-2 hairline-top pt-3">
            <h3 className="t-md t-semibold">{t(K.sheet.resolve.heading)}</h3>
            <Select aria-label={t(K.sheet.resolve.heading)} value={s.resolveOutcome} onChange={(e) => s.setResolveOutcome(e.target.value as 'upheld' | 'rejected')}>
              <option value="upheld">{t(K.sheet.resolve.upheld)}</option>
              <option value="rejected">{t(K.sheet.resolve.rejected)}</option>
            </Select>
            {s.resolveOutcome === 'upheld' && supplierDefects.length > 0 && (
              <div className="stack gap-2">
                <span className="t-sm">{t(K.sheet.resolve.reattribute)}</span>
                {supplierDefects.map((d) => (
                  <label key={d.id} className="stack gap-1">
                    <span className="t-xs">{d.note}</span>
                    <Select value={s.reattribute[d.id] ?? ''} onChange={(e) => s.setReattribute({ ...s.reattribute, [d.id]: (e.target.value || undefined) as DefectAttribution })}>
                      <option value="">{t(K.sheet.resolve.keep)}</option>
                      {ATTRIBUTIONS.filter((a) => a !== 'supplier').map((a) => (
                        <option key={a} value={a}>
                          {t(K.sheet.attribution[a])}
                        </option>
                      ))}
                    </Select>
                  </label>
                ))}
                {s.resolvePreview && (
                  <p className="t-xs t-muted">{t(K.sheet.resolve.preview, { quality: s.resolvePreview.quality.toFixed(1), score: s.resolvePreview.score.toFixed(2) })}</p>
                )}
              </div>
            )}
            <TextArea aria-label={t(K.sheet.resolve.note)} placeholder={t(K.sheet.resolve.note)} value={s.resolveNote} onChange={(e) => s.setResolveNote(e.target.value)} />
            <div>
              <Button size="sm" disabled={s.resolveNote.trim().length < 4} loading={s.busy} onClick={() => void s.resolveDispute().then((ok) => notify(ok, K.toast.resolved))}>
                {t(K.sheet.resolve.submit)}
              </Button>
            </div>
          </section>
        )}

        {s.isAdmin && (
          <>
            <section className="stack gap-2 hairline-top pt-3">
              <h3 className="t-md t-semibold">{t(K.sheet.defect.heading)}</h3>
              <TextArea aria-label={t(K.sheet.defect.note)} placeholder={t(K.sheet.defect.note)} value={s.defectNote} onChange={(e) => s.setDefectNote(e.target.value)} />
              <Select aria-label={t(K.sheet.defect.attribution)} value={s.defectAttribution} onChange={(e) => s.setDefectAttribution(e.target.value as DefectAttribution)}>
                {ATTRIBUTIONS.map((a) => (
                  <option key={a} value={a}>
                    {t(K.sheet.attribution[a])}
                  </option>
                ))}
              </Select>
              <div>
                <Button size="sm" variant="secondary" disabled={s.defectNote.trim().length < 4} loading={s.busy} onClick={() => void s.logDefect().then((ok) => notify(ok, K.toast.defectLogged))}>
                  {t(K.sheet.defect.submit)}
                </Button>
              </div>
            </section>
            <section className="stack gap-2 hairline-top pt-3">
              <h3 className="t-md t-semibold">{t(K.sheet.quality.heading)}</h3>
              <p className="t-xs t-muted">{t(K.sheet.quality.hint)}</p>
              <Select aria-label={t(K.sheet.quality.heading)} value={s.qualityValue} onChange={(e) => s.setQualityValue(e.target.value)}>
                <option value="">{t(K.sheet.quality.none)}</option>
                {[5, 4, 3, 2, 1].map((q) => (
                  <option key={q} value={q}>
                    {q} / 5
                  </option>
                ))}
              </Select>
              <TextArea aria-label={t(K.sheet.quality.note)} placeholder={t(K.sheet.quality.note)} value={s.qualityNote} onChange={(e) => s.setQualityNote(e.target.value)} />
              <div>
                <Button size="sm" variant="secondary" disabled={s.qualityNote.trim().length < 4} loading={s.busy} onClick={() => void s.saveQuality().then((ok) => notify(ok, K.toast.qualitySet))}>
                  {t(K.sheet.quality.submit)}
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </Sheet>
  );
}
