import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Play, Warning } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  SegBar,
  Select,
  Sheet,
  Toggle,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import { KNOWN_DRIVE_TYPES } from '@/features/suppliers/catalogRules';
import { useAutoPoRules } from './useAutoPoRules';
import type { AutoPoRulesState } from './useAutoPoRules';
import { AUTO_PO_RULES_KEYS as K, MATCH_STRATEGIES, TRIGGER_CONDITIONS, WEIGHT_KEYS } from './auto-po-rules.types';

type T = (key: string, params?: Record<string, unknown>) => string;

/**
 * Screen 094 — Auto-PO Trigger Rules. The one place automated supplier
 * ordering is configured: when POs draft, how the supplier is chosen, and
 * how big a PO may be before Admin must sign it off. 092 reads these and
 * nothing else; the simulation runs the exact same matching code.
 */
export function AutoPoRulesView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useAutoPoRules();

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.rules || !s.draft) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { rules, draft } = s;
  const categoryLabel = (c: string) => (i18n.exists(`partCategory.${c}`) ? t(`partCategory.${c}`) : c.replace(/_/g, ' '));
  const notify = (ok: boolean, key: string) => toast.push(t(ok ? key : K.toast.error), ok ? 'success' : 'error');

  return (
    <Screen width="narrow" className="pb-action-bar">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} back={() => navigate(-1)} />
      <p className="t-xs t-muted mb-4">
        {rules.updatedAt
          ? t(K.meta, { version: rules.version, name: rules.updatedBy ?? '', date: formatDate(rules.updatedAt, i18n.language) })
          : t(K.metaDefault, { version: rules.version })}{' '}
        · {t(K.futureOnly)}
      </p>

      <div className="stack gap-5">
        {/* 1 — the master switch */}
        <section className="stack gap-2">
          <h2 className="t-lg">{t(K.automation.heading)}</h2>
          <Card>
            <Toggle
              checked={draft.autoDraftEnabled}
              onChange={(next) => s.update({ autoDraftEnabled: next })}
              label={t(K.automation.label)}
              description={t(draft.autoDraftEnabled ? K.automation.on : K.automation.off)}
            />
          </Card>
        </section>

        {/* 2 — when */}
        <section className="stack gap-2">
          <div className="row between gap-2">
            <h2 className="t-lg">{t(K.trigger.heading)}</h2>
            <span className="t-xs t-muted">{t(K.trigger.current, { value: t(K.trigger[rules.triggerCondition].title) })}</span>
          </div>
          <div className="stack gap-2" role="radiogroup" aria-label={t(K.trigger.heading)}>
            {TRIGGER_CONDITIONS.map((condition) => {
              const selected = draft.triggerCondition === condition;
              return (
                <button
                  key={condition}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!draft.autoDraftEnabled}
                  className={`ds-card ${selected ? 'ds-card--selected' : ''}`.trim()}
                  style={{
                    display: 'block',
                    textAlign: 'left',
                    width: '100%',
                    minHeight: 'var(--tap-target)',
                    cursor: draft.autoDraftEnabled ? 'pointer' : 'default',
                    font: 'inherit',
                    color: 'inherit',
                    opacity: draft.autoDraftEnabled ? 1 : 0.6,
                  }}
                  onClick={() => s.update({ triggerCondition: condition })}
                >
                  <span className="stack gap-1">
                    <span className="t-sm t-semibold">{t(K.trigger[condition].title)}</span>
                    <span className="t-xs t-muted">{t(K.trigger[condition].body)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3 — how the supplier is chosen */}
        <section className="stack gap-2">
          <div className="row between gap-2">
            <h2 className="t-lg">{t(K.matching.heading)}</h2>
            <span className="t-xs t-muted">{t(K.matching.current, { value: t(K.matching.strategy[rules.strategy]) })}</span>
          </div>
          <Card>
            <SegBar
              label={t(K.matching.heading)}
              value={draft.strategy}
              onChange={(id) => s.update({ strategy: id as typeof draft.strategy })}
              items={MATCH_STRATEGIES.map((strategy) => ({ id: strategy, label: t(K.matching.strategy[strategy]) }))}
            />
            <p className="t-xs t-muted mt-3">{t(K.matching.strategyHint[draft.strategy])}</p>
            {draft.strategy === 'blend' && (
              <div className="stack gap-4 mt-4">
                {WEIGHT_KEYS.map((key) => (
                  <div key={key} className="stack gap-1">
                    <div className="row between">
                      <span className="t-sm t-medium">{t(K.matching.weight[key])}</span>
                      <span className="t-sm num">{draft.weights[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={draft.weights[key]}
                      aria-label={t(K.matching.weight[key])}
                      onChange={(e) => s.setWeight(key, Number(e.target.value))}
                      className="full-w"
                    />
                    <span className="t-xs t-muted">{t(K.matching.weightHint[key])}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="hairline-top pt-3 mt-4">
              <Toggle
                checked={draft.preferAssignedSupplier}
                onChange={(next) => s.update({ preferAssignedSupplier: next })}
                label={t(K.matching.preferAssigned)}
                description={t(K.matching.preferAssignedHint)}
              />
            </div>
            <p className="t-xs t-muted mt-3">{t(K.matching.newSupplierNote)}</p>
          </Card>
        </section>

        {/* 4 — how big before Admin signs off */}
        <section className="stack gap-2">
          <div className="row between gap-2">
            <h2 className="t-lg">{t(K.approval.heading)}</h2>
            <span className="t-xs t-muted">{t(K.approval.current, { value: formatINR(rules.approvalThreshold) })}</span>
          </div>
          <Card>
            <Field label={t(K.approval.label)} hint={t(K.approval.hint)} error={s.thresholdValid ? undefined : t(K.approval.invalid)}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  mono
                  inputMode="numeric"
                  value={draft.approvalThreshold}
                  onChange={(e) => s.update({ approvalThreshold: e.target.value.replace(/[^\d]/g, '').slice(0, 9) })}
                />
              )}
            </Field>
          </Card>
        </section>

        {/* 5 — try it */}
        <Simulation s={s} t={t} categoryLabel={categoryLabel} notify={notify} lang={i18n.language} />
      </div>

      <ActionBar>
        <Button variant="ghost" disabled={!s.dirty || s.saving} onClick={s.discard}>
          {t(K.discard)}
        </Button>
        <Button
          className="grow"
          block
          disabled={!s.dirty || !s.thresholdValid}
          loading={s.saving && !s.confirmOpen}
          onClick={() =>
            void s.requestSave().then((result) => {
              if (result !== 'confirm') notify(result, K.toast.saved);
            })
          }
        >
          {t(K.save)}
        </Button>
      </ActionBar>

      {/* High-consequence changes get their own explicit step, in error-red. */}
      <Sheet
        open={s.confirmOpen}
        onClose={() => s.setConfirmOpen(false)}
        title={t(K.confirm.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block variant="danger" loading={s.saving} onClick={() => void s.commit().then((ok) => notify(ok, K.toast.saved))}>
            {t(K.confirm.submit)}
          </Button>
        }
      >
        <p className="t-sm mb-3">{t(K.confirm.intro)}</p>
        <ul className="stack gap-2">
          {s.consequences.map((c) => (
            <li key={c} className="t-sm t-error row gap-2" style={{ alignItems: 'flex-start' }}>
              <Warning size={16} className="shrink-0" />
              <span>{t(K.confirm[c], { from: formatINR(rules.approvalThreshold), to: formatINR(s.thresholdValue) })}</span>
            </li>
          ))}
        </ul>
      </Sheet>
    </Screen>
  );
}

function Simulation({
  s,
  t,
  categoryLabel,
  notify,
  lang,
}: {
  s: AutoPoRulesState;
  t: T;
  categoryLabel: (c: string) => string;
  notify: (ok: boolean, key: string) => void;
  lang: string;
}) {
  const sim = s.simulation;
  const nameOf = (id: string | null) => s.suppliers.find((sp) => sp.id === id)?.name ?? '';
  return (
    <section className="stack gap-2">
      <h2 className="t-lg">{t(K.simulation.heading)}</h2>
      <Card>
        <p className="t-xs t-muted">{t(K.simulation.intro)}</p>
        <div className="grid-2 gap-3 mt-3">
          <Field label={t(K.simulation.driveType)}>
            {({ id }) => (
              <Select id={id} value={s.simDriveType} onChange={(e) => s.setSimDriveType(e.target.value as typeof s.simDriveType)}>
                {KNOWN_DRIVE_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {t(`driveType.${d}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t(K.simulation.assigned)}>
            {({ id }) => (
              <Select id={id} value={s.simAssigned} onChange={(e) => s.setSimAssigned(e.target.value)}>
                <option value="">{t(K.simulation.assignedNone)}</option>
                {s.suppliers.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        {s.dirty && <p className="t-xs t-warning mt-2">{t(K.simulation.usingUnsaved)}</p>}
        <div className="mt-3">
          <Button
            variant="secondary"
            icon={<Play size={16} />}
            loading={s.simulating}
            onClick={() => void s.runSimulation().then((ok) => notify(ok, K.toast.simulated))}
          >
            {t(K.simulation.run)}
          </Button>
        </div>
      </Card>

      {!sim ? (
        <p className="t-sm t-muted">{t(K.simulation.none)}</p>
      ) : (
        <div className="stack gap-2">
          <p className="t-xs t-muted">
            {t(sim.usedUnsavedRules ? K.simulation.lastRunUnsaved : K.simulation.lastRun, {
              name: sim.byName,
              date: formatDate(sim.at, lang),
              driveType: sim.driveType ? t(`driveType.${sim.driveType}`) : '—',
              assigned: nameOf(sim.assignedSupplierId) || t(K.simulation.assignedNone),
            })}
          </p>
          {s.simulationStale && <p className="t-xs t-warning">{t(K.simulation.stale)}</p>}

          {s.concentrated && s.topShare && (
            <Card>
              <p className="t-sm t-warning row gap-2" style={{ alignItems: 'flex-start' }}>
                <Warning size={16} className="shrink-0" />
                {t(K.simulation.concentration, { name: s.topShare.supplierName, pct: s.topShare.sharePct })}
              </p>
              <p className="t-xs t-muted mt-2">{t(K.simulation.concentrationHint)}</p>
            </Card>
          )}

          {sim.results.map((r) => {
            const chosen = r.candidates.find((c) => c.supplierId === r.chosenSupplierId);
            return (
              <Card key={r.category}>
                <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
                  <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                    <span className="t-sm t-semibold">{categoryLabel(r.category)}</span>
                    <span className="t-xs t-muted">{t(K.simulation.reason[r.reason])}</span>
                  </span>
                  {chosen ? <span className="num t-semibold shrink-0">{formatINR(chosen.unitPrice)}</span> : <Badge tone="error">—</Badge>}
                </div>
                {r.driveTypeFallback && (
                  <p className="t-xs t-warning row gap-1 mt-2">
                    <Warning size={12} className="shrink-0" /> {t(K.simulation.fallback)}
                  </p>
                )}
                {r.candidates.length > 0 && (
                  <ol className="stack gap-2 mt-3">
                    {r.candidates.map((c) => (
                      <li key={c.supplierId} className="stack gap-1">
                        <div className="row between gap-2">
                          <span className={`t-sm ${c.supplierId === r.chosenSupplierId ? 't-semibold' : ''}`}>
                            {c.supplierName}
                            {c.supplierId === r.chosenSupplierId && (
                              <>
                                {' '}
                                <Badge tone="success">{t(K.simulation.chosen)}</Badge>
                              </>
                            )}
                          </span>
                          <span className="t-sm num shrink-0">{c.total.toFixed(2)}</span>
                        </div>
                        <span className="t-xs t-muted">
                          {t(K.simulation.scoreLine, {
                            price: formatINR(c.unitPrice),
                            lead: c.leadTimeDays,
                            priceScore: c.priceScore.toFixed(2),
                            speedScore: c.speedScore.toFixed(2),
                            perfScore: c.performanceScore.toFixed(2),
                          })}
                          {c.performanceIsDefault ? ` · ${t(K.simulation.newSupplier)}` : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            );
          })}

          <Card>
            <div className="row between gap-2">
              <span className="t-sm">{t(K.simulation.total)}</span>
              <span className="num t-semibold">{formatINR(sim.totalValue)}</span>
            </div>
            <p className={`t-xs mt-2 ${sim.wouldNeedApproval ? 't-warning' : 't-muted'}`}>
              {t(sim.wouldNeedApproval ? K.simulation.needsApproval : K.simulation.noApproval)}
            </p>
            <div className="stack gap-1 mt-3">
              {sim.valueShare.map((v) => (
                <div key={v.supplierId} className="row between gap-2 t-xs">
                  <span>{v.supplierName}</span>
                  <span className="num">{t(K.simulation.share, { pct: v.sharePct })}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
