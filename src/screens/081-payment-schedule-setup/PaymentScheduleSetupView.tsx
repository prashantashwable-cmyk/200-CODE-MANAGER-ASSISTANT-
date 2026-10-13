import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CaretDown, CaretUp, CheckCircle, Clock, Plus, TrashSimple, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  SegBar,
  Select,
  TextArea,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import { usePaymentScheduleSetup } from './usePaymentScheduleSetup';
import { MILESTONE_OPTIONS, PAYMENT_SCHEDULE_SETUP_KEYS as K, SCHEDULE_TYPES, STAGE_PRESETS } from './payment-schedule-setup.types';

export function PaymentScheduleSetupView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = usePaymentScheduleSetup();

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { deal, lead, expectedTotal, schedule } = s.view;

  if (!s.view.canSetUp) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} />
        <EmptyState title={t(K.notReady.title)} body={t(K.notReady.body)} />
      </Screen>
    );
  }

  const remainder = expectedTotal - s.reconciledAmount;

  return (
    <Screen className="pb-action-bar" width="narrow">
      <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} action={schedule?.activated ? <Badge tone="success">{t(K.activated.banner)}</Badge> : undefined} />

      {schedule?.activated && schedule.activatedBy && schedule.activatedAt && (
        <Card className="mb-4">
          <p className="t-xs t-muted">{t(K.activated.by, { name: schedule.activatedBy, date: formatDate(schedule.activatedAt, i18n.language) })}</p>
        </Card>
      )}

      <div className="mb-4">
        <h2 className="t-lg mb-2">{t(K.scheduleType.heading)}</h2>
        <SegBar
          label={t(K.scheduleType.heading)}
          value={s.scheduleType}
          onChange={(id) => s.setScheduleType(id as never)}
          items={SCHEDULE_TYPES.map((st) => ({ id: st, label: t(K.scheduleType[st]) }))}
        />
        {s.scheduleType === 'bank_guarantee' && (
          <div className="stack gap-1 mt-2">
            <span className="label">{t(K.scheduleType.noteLabel)}</span>
            <TextArea value={s.customNote} onChange={(e) => s.setCustomNote(e.target.value)} rows={3} />
            <span className="t-xs t-muted">{t(K.scheduleType.noteHint)}</span>
          </div>
        )}
      </div>

      <Card className="mb-4">
        <div className="stack gap-2">
          <div className="row between t-sm">
            <span className="t-muted">{t(K.reconcile.target)}</span>
            <span className="num t-semibold">{formatINR(expectedTotal)}</span>
          </div>
          <div className="row between t-sm">
            <span className="t-muted">{t(K.reconcile.current)}</span>
            <span className="num t-semibold">{formatINR(s.reconciledAmount)}</span>
          </div>
          <div className="hairline-top pt-2">
            {remainder === 0 ? (
              <p className="t-sm t-success row gap-1 items-center">
                <CheckCircle size={15} /> {t(K.reconcile.ok)}
              </p>
            ) : remainder > 0 ? (
              <p className="t-sm t-warning row gap-1 items-center">
                <WarningCircle size={15} /> {t(K.reconcile.short, { amount: formatINR(remainder) })}
              </p>
            ) : (
              <p className="t-sm t-error row gap-1 items-center">
                <WarningCircle size={15} /> {t(K.reconcile.over, { amount: formatINR(-remainder) })}
              </p>
            )}
          </div>
        </div>
      </Card>

      <h2 className="t-lg mb-2">{t(K.stage.heading)}</h2>
      <div className="stack gap-3 mb-4">
        {s.draftStages.map((stage, index) => (
          <Card key={stage.key}>
            <div className="stack gap-3">
              <div className="row gap-2">
                <div className="grow stack gap-1">
                  <span className="label">{t(K.stage.presetLabel)}</span>
                  <Select value={stage.stage} onChange={(e) => s.updateStage(stage.key, { stage: e.target.value as never })}>
                    {STAGE_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {t(`finance.paymentStage.${p}`)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="stack gap-1 items-center" style={{ paddingTop: 22 }}>
                  <button type="button" className="tappable" aria-label={t(K.stage.moveUp)} disabled={index === 0} onClick={() => s.moveStage(stage.key, -1)}>
                    <CaretUp size={16} className={index === 0 ? 't-muted' : 't-emerald'} />
                  </button>
                  <button type="button" className="tappable" aria-label={t(K.stage.moveDown)} disabled={index === s.draftStages.length - 1} onClick={() => s.moveStage(stage.key, 1)}>
                    <CaretDown size={16} className={index === s.draftStages.length - 1 ? 't-muted' : 't-emerald'} />
                  </button>
                </div>
              </div>

              <div className="stack gap-1">
                <span className="label">{t(K.stage.nameLabel)}</span>
                <Input value={stage.label} onChange={(e) => s.updateStage(stage.key, { label: e.target.value })} />
              </div>

              <div className="stack gap-1">
                <span className="label">{t(K.stage.amountLabel)}</span>
                <Input
                  type="number"
                  value={stage.amount}
                  onChange={(e) => s.updateStage(stage.key, { amount: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="stack gap-1">
                <span className="label">{t(K.stage.triggerLabel)}</span>
                <SegBar
                  label={t(K.stage.triggerLabel)}
                  value={stage.dueTrigger}
                  onChange={(id) => s.updateStage(stage.key, { dueTrigger: id as never })}
                  items={[
                    { id: 'fixed_date', label: t(K.stage.triggerFixed) },
                    { id: 'milestone', label: t(K.stage.triggerMilestone) },
                  ]}
                />
              </div>

              {stage.dueTrigger === 'fixed_date' ? (
                <div className="stack gap-1">
                  <span className="label">{t(K.stage.dueDateLabel)}</span>
                  <input type="date" className="ds-input" value={stage.fixedDueDate.slice(0, 10)} onChange={(e) => s.updateStage(stage.key, { fixedDueDate: e.target.value })} />
                </div>
              ) : (
                <div className="stack gap-1">
                  <span className="label">{t(K.stage.milestoneLabel)}</span>
                  <Select value={stage.triggerMilestone} onChange={(e) => s.updateStage(stage.key, { triggerMilestone: e.target.value })}>
                    {MILESTONE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {t(m)}
                      </option>
                    ))}
                  </Select>
                  {(() => {
                    const resolved = s.view?.resolvedStages.find((rs) => rs.stage.triggerMilestone === stage.triggerMilestone && rs.stage.stage === stage.stage)?.resolvedDueDate;
                    return resolved ? (
                      <p className="t-xs t-success row gap-1 items-center">
                        <CheckCircle size={13} /> {t(K.stage.milestoneResolved, { date: formatDate(resolved, i18n.language) })}
                      </p>
                    ) : (
                      <p className="t-xs t-muted row gap-1 items-center">
                        <Clock size={13} /> {t(K.stage.milestonePending)}
                      </p>
                    );
                  })()}
                </div>
              )}

              <Button size="sm" variant="ghost" icon={<TrashSimple size={14} />} disabled={s.draftStages.length <= 1} onClick={() => s.removeStage(stage.key)}>
                {t(K.stage.remove)}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button size="sm" variant="secondary" icon={<Plus size={16} />} className="mb-4" onClick={s.addStage}>
        {t(K.stage.addStage)}
      </Button>

      <h2 className="t-lg mb-2">{t(K.preview.heading)}</h2>
      <p className="t-sm t-muted mb-2">{t(K.preview.subtitle)}</p>
      <Card className="mb-4" flush>
        {[...s.draftStages]
          .map((stage, i) => ({ stage, i }))
          .map(({ stage }) => {
            const resolved = stage.dueTrigger === 'fixed_date' ? stage.fixedDueDate : s.view?.resolvedStages.find((rs) => rs.stage.triggerMilestone === stage.triggerMilestone && rs.stage.stage === stage.stage)?.resolvedDueDate;
            const pendingLabel = t(stage.dueTrigger === 'fixed_date' ? K.stage.noDateSet : K.stage.milestonePending);
            return (
              <div key={stage.key} className="ds-listrow">
                <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-medium truncate">{stage.label}</span>
                  <span className="t-xs t-muted truncate">{resolved ? formatDate(resolved, i18n.language) : pendingLabel}</span>
                </span>
                <span className="num t-sm t-semibold">{formatINR(stage.amount)}</span>
              </div>
            );
          })}
      </Card>

      <ActionBar>
        <Button block disabled={!s.reconciles} loading={s.activating} onClick={() => void s.activate().then((ok) => toast.push(t(ok ? K.toast.activated : K.toast.reconcileError), ok ? 'success' : 'error'))}>
          {t(K.actionBar.activate)}
        </Button>
      </ActionBar>
    </Screen>
  );
}
