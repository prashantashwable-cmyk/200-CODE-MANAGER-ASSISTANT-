import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowCircleUp, ClockCountdown, HandCoins, PencilSimple, ShieldWarning, Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  Toggle,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { SupplierPaymentTermSettings, SupplierRetentionStatus, SupplierTermsChange, SupplierTrustTier } from '@/data/types';
import { TRUST_TIERS, paymentSchedule } from '@/features/suppliers/paymentTerms';
import type { SettingsIssue } from '@/features/suppliers/paymentTerms';
import { useSupplierPaymentTerms } from './useSupplierPaymentTerms';
import type { SupplierPaymentTermsState } from './useSupplierPaymentTerms';
import { PREVIEW_ORDER_VALUE, SUPPLIER_PAYMENT_TERMS_KEYS as K, TERM_TYPES } from './supplier-payment-terms.types';
import type { SettingsDraft } from './supplier-payment-terms.types';

type T = ReturnType<typeof useTranslation>['t'];

const TIER_TONE: Record<SupplierTrustTier, BadgeTone> = { new: 'neutral', standard: 'accent', trusted: 'emerald' };
const RETENTION_TONE: Record<SupplierRetentionStatus, BadgeTone> = { held: 'neutral', paused: 'warning', released: 'success', withheld: 'error' };

/** The current value, always shown next to the setting's name. */
function summaryOf(s: SupplierPaymentTermSettings, t: T): string {
  const main = t(K.summary[s.termType], { pct: s.upfrontPct });
  return `${main} · ${s.retentionPct > 0 ? t(K.summary.retention, { pct: s.retentionPct }) : t(K.summary.noRetention)}`;
}

export function SupplierPaymentTermsView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const s = useSupplierPaymentTerms();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.view) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }
  const view = s.view;

  return (
    // A settings page: narrow, so each current value reads next to its name.
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      <div className="stack gap-6">
        {/* Tier defaults — what every supplier on a tier is paid on. */}
        <section aria-labelledby="tiers-heading" className="stack gap-2">
          <h2 id="tiers-heading" className="t-lg">
            {t(K.tiers.heading)}
          </h2>
          <p className="t-xs t-muted">{t(K.tiers.hint)}</p>
          <Card className="ds-card--flush">
            {TRUST_TIERS.map((tier) => (
              <div key={tier} className="ds-listrow" style={{ alignItems: 'flex-start' }}>
                <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                  <span className="row gap-2 wrap">
                    <Badge tone={TIER_TONE[tier]}>{t(K.tierName[tier])}</Badge>
                    <span className="t-xs t-muted">{t(K.tiers.usage, { count: view.tierUsage[tier] })}</span>
                  </span>
                  <span className="t-sm">{summaryOf(view.config.tiers[tier], t)}</span>
                </span>
                <Button size="sm" variant="ghost" icon={<PencilSimple size={16} />} onClick={() => s.openTier(tier)}>
                  {t(K.tiers.edit)}
                </Button>
              </div>
            ))}
          </Card>
        </section>

        {/* Each supplier — tier, any negotiated override, and the record behind it. */}
        <section aria-labelledby="suppliers-heading" className="stack gap-2">
          <h2 id="suppliers-heading" className="t-lg">
            {t(K.suppliers.heading)}
          </h2>
          <p className="t-xs t-muted">{t(K.suppliers.hint)}</p>
          {view.suppliers.length === 0 ? (
            <EmptyState title={t(K.suppliers.empty)} body={t(K.suppliers.emptyBody)} />
          ) : (
            <Card className="ds-card--flush">
              {view.suppliers.map((r) => (
                <button key={r.supplier.id} type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} onClick={() => s.openSupplier(r.supplier.id)}>
                  <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-medium">{r.supplier.name}</span>
                    <span className="t-sm">{summaryOf(r.settings, t)}</span>
                    <span className="t-xs t-muted">
                      {r.ratedOrders > 0 ? t(K.suppliers.score, { score: r.score.toFixed(2), count: r.ratedOrders }) : t(K.suppliers.unrated)}
                      {' · '}
                      {r.agreementNetDays !== null ? t(K.schedule.after_delivery, { days: r.agreementNetDays }) : t(K.suppliers.noAgreement)}
                    </span>
                    <span className="row wrap gap-1">
                      <Badge tone={TIER_TONE[r.tier]}>{t(K.tierName[r.tier])}</Badge>
                      {r.custom && <Badge tone="warning">{t(K.suppliers.custom)}</Badge>}
                      {r.graduateTo && (
                        <Badge tone="success">
                          <ArrowCircleUp size={12} aria-hidden="true" /> {t(K.suppliers.graduate, { tier: t(K.tierName[r.graduateTo]) })}
                        </Badge>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </Card>
          )}
        </section>

        <RetentionSection s={s} t={t} lang={lang} />

        <section aria-labelledby="history-heading" className="stack gap-2">
          <h2 id="history-heading" className="t-lg">
            {t(K.history.heading)}
          </h2>
          {view.history.length === 0 ? (
            <p className="t-sm t-muted">{t(K.history.empty)}</p>
          ) : (
            <Card className="ds-card--flush">
              {view.history.map((h) => (
                <HistoryRow key={h.id} h={h} name={view.suppliers.find((r) => r.supplier.id === h.supplierId)?.supplier.name ?? ''} t={t} lang={lang} />
              ))}
            </Card>
          )}
        </section>
      </div>

      <TierSheet s={s} t={t} />
      <SupplierSheet s={s} t={t} lang={lang} />
      <DecisionSheet s={s} t={t} />
    </Screen>
  );
}

function HistoryRow({ h, name, t, lang }: { h: SupplierTermsChange; name: string; t: T; lang: string }) {
  return (
    <div className="ds-listrow" style={{ alignItems: 'flex-start' }}>
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-sm t-medium">
          {t(K.history[h.kind], {
            supplier: name,
            from: h.fromTier ? t(K.tierName[h.fromTier]) : '',
            to: h.toTier ? t(K.tierName[h.toTier]) : '',
            terms: h.settings ? summaryOf(h.settings, t) : '',
          })}
        </span>
        <span className="t-xs">{h.reason}</span>
        <span className="t-xs t-muted">
          {t(K.history.by, { name: h.by, date: formatDate(h.at, lang) })}
          {h.scoreAtChange !== null ? ` · ${t(K.history.scoreAt, { score: h.scoreAtChange.toFixed(2), count: h.ratedOrdersAtChange })}` : ''}
        </span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------- retention */

function RetentionSection({ s, t, lang }: { s: SupplierPaymentTermsState; t: T; lang: string }) {
  const navigate = useNavigate();
  const items = s.view!.retentions;
  return (
    <section aria-labelledby="retention-heading" className="stack gap-2">
      <h2 id="retention-heading" className="t-lg">
        {t(K.retention.heading)}
      </h2>
      <p className="t-xs t-muted">{t(K.retention.hint)}</p>
      {items.length === 0 ? (
        <EmptyState icon={<HandCoins size={28} />} title={t(K.retention.empty)} body={t(K.retention.emptyBody)} />
      ) : (
        <Card className="ds-card--flush">
          {items.map((item) => {
            const r = item.retention;
            const line =
              r.status === 'held'
                ? t(item.overdueForReview ? K.retention.heldOverdue : K.retention.heldLine, { date: formatDate(r.heldAt, lang) })
                : r.status === 'paused'
                  ? t(K.retention.pausedLine)
                  : r.status === 'released'
                    ? r.decidedBy === 'system'
                      ? t(K.retention.releasedAuto, { date: formatDate(r.decidedAt ?? r.heldAt, lang) })
                      : t(K.retention.releasedBy, { name: r.decidedBy ?? '', reason: r.decisionReason ?? '' })
                    : t(K.retention.withheldBy, { name: r.decidedBy ?? '', reason: r.decisionReason ?? '' });
            return (
              <div key={r.id} className="ds-listrow" style={{ alignItems: 'flex-start' }}>
                <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                  <span className="row between gap-2">
                    <span className="t-sm t-medium">
                      {item.poCode} · {item.supplierName}
                    </span>
                    <span className="num t-semibold shrink-0">{formatINR(r.amount)}</span>
                  </span>
                  <span className={`t-xs ${r.status === 'paused' || item.overdueForReview ? 't-warning' : 't-muted'} row-top gap-1`}>
                    {(r.status === 'paused' || item.overdueForReview) && <ClockCountdown size={12} className="shrink-0" aria-hidden="true" />}
                    {line}
                  </span>
                  <span className="row wrap gap-2">
                    <Badge tone={RETENTION_TONE[r.status]}>{t(K.retention.status[r.status], { pct: r.pct })}</Badge>
                    {(r.status === 'paused' || item.overdueForReview) && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => s.openDecision(item, 'release')}>
                          {t(K.retention.release)}
                        </Button>
                        <Button size="sm" variant="ghost" icon={<ShieldWarning size={16} />} onClick={() => s.openDecision(item, 'withhold')}>
                          <span className="t-error">{t(K.retention.withhold)}</span>
                        </Button>
                      </>
                    )}
                    {r.status === 'paused' && (
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/scorecard?supplierId=${r.supplierId}`)}>
                        {t(K.retention.viewRecord)}
                      </Button>
                    )}
                  </span>
                </span>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}

function DecisionSheet({ s, t }: { s: SupplierPaymentTermsState; t: T }) {
  const toast = useToast();
  const d = s.deciding;
  const withhold = d?.decision === 'withhold';
  return (
    <Sheet
      open={d !== null}
      onClose={s.closeDecision}
      title={d ? t(K.retention.decideTitle, { code: d.item.poCode, amount: formatINR(d.item.retention.amount) }) : ''}
      closeLabel={t('action.close')}
      footer={
        <Button
          block
          variant={withhold ? 'danger' : 'primary'}
          disabled={!s.canDecide}
          loading={s.busy}
          onClick={() => void s.decide().then((ok) => toast.push(t(ok ? (withhold ? K.toast.withheld : K.toast.released) : K.toast.error), ok ? 'success' : 'error'))}
        >
          {t(withhold ? K.retention.confirmWithhold : K.retention.confirmRelease)}
        </Button>
      }
    >
      {d && (
        <div className="stack gap-3">
          {withhold && (
            <p className="t-sm t-error row-top gap-2">
              <Warning size={16} className="shrink-0" aria-hidden="true" /> {t(K.retention.withholdWarning, { supplier: d.item.supplierName })}
            </p>
          )}
          <Field label={t(K.retention.reason)} required>
            {({ id }) => <TextArea id={id} rows={3} value={s.decisionReason} onChange={(e) => s.setDecisionReason(e.target.value)} />}
          </Field>
        </div>
      )}
    </Sheet>
  );
}

/* ----------------------------------------------------------------- sheets */

function SettingsFields({ draft, onChange, issues, t }: { draft: SettingsDraft; onChange: (d: SettingsDraft) => void; issues: SettingsIssue[]; t: T }) {
  const upfrontIssue = issues.find((i) => i === 'upfront_range' || i === 'net_has_upfront' || i === 'upfront_required');
  const retentionIssue = issues.find((i) => i === 'retention_range' || i === 'total_too_high');
  return (
    <div className="stack gap-3">
      <Field label={t(K.form.termType)}>
        {({ id }) => (
          <Select id={id} value={draft.termType} onChange={(e) => onChange({ ...draft, termType: e.target.value as SettingsDraft['termType'], upfrontPct: e.target.value === 'net' ? '0' : draft.upfrontPct })}>
            {TERM_TYPES.map((tt) => (
              <option key={tt} value={tt}>
                {t(K.termType[tt])}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="grid-2 gap-2">
        <Field label={t(K.form.upfront)} hint={t(K.form.upfrontHint)} error={upfrontIssue ? t(K.form.issue[upfrontIssue]) : undefined}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              type="number"
              inputMode="numeric"
              mono
              disabled={draft.termType === 'net'}
              value={draft.upfrontPct}
              onChange={(e) => onChange({ ...draft, upfrontPct: e.target.value })}
            />
          )}
        </Field>
        <Field label={t(K.form.retention)} hint={t(K.form.retentionHint)} error={retentionIssue ? t(K.form.issue[retentionIssue]) : undefined}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} type="number" inputMode="numeric" mono value={draft.retentionPct} onChange={(e) => onChange({ ...draft, retentionPct: e.target.value })} />
          )}
        </Field>
      </div>
    </div>
  );
}

function SchedulePreview({ settings, netDays, t }: { settings: SupplierPaymentTermSettings; netDays: number | null; t: T }) {
  const parts = paymentSchedule(PREVIEW_ORDER_VALUE, settings, netDays);
  return (
    <Card className="stack gap-1">
      <span className="t-sm t-semibold">{t(K.schedule.heading, { amount: formatINR(PREVIEW_ORDER_VALUE) })}</span>
      {parts.map((p) => (
        <span key={p.kind} className="row between gap-2 t-sm">
          <span>{p.trigger === 'after_delivery' && p.netDays === undefined ? t(K.schedule.after_delivery_unknown) : t(K.schedule[p.trigger], { days: p.netDays })}</span>
          <span className="num">{formatINR(p.amount)}</span>
        </span>
      ))}
    </Card>
  );
}

function TierSheet({ s, t }: { s: SupplierPaymentTermsState; t: T }) {
  const toast = useToast();
  const tier = s.tierEditing;
  return (
    <Sheet
      open={tier !== null}
      onClose={s.closeTier}
      title={tier ? t(K.form.tierTitle, { tier: t(K.tierName[tier]) }) : ''}
      closeLabel={t('action.close')}
      footer={
        <Button block variant={s.tierRisky ? 'danger' : 'primary'} disabled={!s.canSaveTier} loading={s.busy} onClick={() => void s.saveTier().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}>
          {t(K.form.save)}
        </Button>
      }
    >
      {tier && (
        <div className="stack gap-3">
          <SettingsFields draft={s.tierDraft} onChange={s.setTierDraft} issues={s.tierIssues} t={t} />
          <SchedulePreview settings={s.tierSettings} netDays={null} t={t} />
          <p className="t-xs t-muted">{t(K.form.inFlightNote)}</p>
          <Field label={t(K.form.reason)} hint={t(K.form.reasonHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={s.tierReason} onChange={(e) => s.setTierReason(e.target.value)} />}
          </Field>
          {s.tierRisky && (
            <div className="stack gap-2">
              <p className="t-sm t-error row-top gap-2">
                <Warning size={16} className="shrink-0" aria-hidden="true" /> {t(K.form.tierRiskWarning, { count: s.view!.tierUsage[tier] })}
              </p>
              <Checkbox checked={s.tierRiskAck} onChange={s.setTierRiskAck} label={t(K.form.riskConfirm)} />
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function SupplierSheet({ s, t, lang }: { s: SupplierPaymentTermsState; t: T; lang: string }) {
  const toast = useToast();
  const navigate = useNavigate();
  const r = s.row;
  return (
    <Sheet
      open={r !== null}
      onClose={s.closeSupplier}
      title={r ? t(K.form.supplierTitle, { supplier: r.supplier.name }) : ''}
      closeLabel={t('action.close')}
      footer={
        <Button block variant={s.supplierRisky ? 'danger' : 'primary'} disabled={!s.canSaveSupplier} loading={s.busy} onClick={() => void s.saveSupplier().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}>
          {t(K.form.save)}
        </Button>
      }
    >
      {r && (
        <div className="stack gap-4">
          {/* The case for a tier change is the scorecard, not memory. */}
          <Card className="stack gap-1">
            <span className="t-sm t-semibold">{t(K.form.evidence)}</span>
            <span className="t-sm">{r.ratedOrders > 0 ? t(K.suppliers.score, { score: r.score.toFixed(2), count: r.ratedOrders }) : t(K.suppliers.unrated)}</span>
            {r.graduateTo && <span className="t-xs t-success">{t(K.form.suggestion, { tier: t(K.tierName[r.graduateTo]) })}</span>}
            <div>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/scorecard?supplierId=${r.supplier.id}`)}>
                {t(K.form.openScorecard)}
              </Button>
            </div>
          </Card>

          <Field label={t(K.form.tier)}>
            {({ id }) => (
              <Select id={id} value={s.tierChoice} onChange={(e) => s.setTierChoice(e.target.value as SupplierTrustTier)}>
                {TRUST_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {t(K.tierName[tier])} · {summaryOf(s.view!.config.tiers[tier], t)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Toggle checked={s.customOn} onChange={s.setCustomOn} label={t(K.form.custom)} description={t(K.form.customHint)} />
          {s.customOn && <SettingsFields draft={s.customDraft} onChange={s.setCustomDraft} issues={s.customIssues} t={t} />}

          {s.nextSettings && <SchedulePreview settings={s.nextSettings} netDays={r.agreementNetDays} t={t} />}
          <p className="t-xs t-muted">{t(K.form.inFlightNote)}</p>

          <Field label={t(K.form.reason)} hint={t(K.form.reasonHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={s.supplierReason} onChange={(e) => s.setSupplierReason(e.target.value)} />}
          </Field>
          {!s.supplierChanged && <p className="t-xs t-muted">{t(K.form.noChange)}</p>}
          {s.supplierRisky && (
            <div className="stack gap-2">
              <p className="t-sm t-error row-top gap-2">
                <Warning size={16} className="shrink-0" aria-hidden="true" /> {t(K.form.riskWarning, { supplier: r.supplier.name })}
              </p>
              <Checkbox checked={s.supplierRiskAck} onChange={s.setSupplierRiskAck} label={t(K.form.riskConfirm)} />
            </div>
          )}

          {s.supplierHistory.length > 0 && (
            <section className="stack gap-2">
              <h3 className="label">{t(K.form.history)}</h3>
              <Card className="ds-card--flush">
                {s.supplierHistory.map((h) => (
                  <HistoryRow key={h.id} h={h} name={r.supplier.name} t={t} lang={lang} />
                ))}
              </Card>
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
}
