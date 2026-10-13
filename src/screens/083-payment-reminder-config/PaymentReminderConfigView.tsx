import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CaretRight, Clock, Pause, Play, Plus, TrashSimple, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { usePaymentReminderConfig } from './usePaymentReminderConfig';
import { ESCALATION_TIERS, PAYMENT_REMINDER_CONFIG_KEYS as K, REMINDER_TEMPLATE_GROUPS } from './payment-reminder-config.types';

const OUTCOME_TONE: Record<string, BadgeTone> = {
  sent_in_past: 'success',
  due_today: 'warning',
  upcoming: 'neutral',
  skipped_opted_out: 'error',
  skipped_paused: 'neutral',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PaymentReminderConfigView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = usePaymentReminderConfig();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  return (
    <Screen className="pb-action-bar">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} back={() => navigate(-1)} />

      <h2 className="t-lg mb-2">{t(K.cadence.heading)}</h2>
      <div className="stack gap-3 mb-4">
        {s.draftSteps.map((step) => (
          <Card key={step.key}>
            <div className="stack gap-3">
              <div className="row gap-2">
                <div className="grow stack gap-1">
                  <span className="label">{t(K.cadence.dayLabel)}</span>
                  <input
                    type="number"
                    className="ds-input"
                    value={step.daysOffset}
                    onChange={(e) => s.updateStep(step.key, { daysOffset: Number(e.target.value) || 0 })}
                  />
                  <span className="t-xs t-muted">{step.daysOffset < 0 ? t(K.cadence.dayBefore, { count: Math.abs(step.daysOffset) }) : step.daysOffset === 0 ? t(K.cadence.dayOf) : t(K.cadence.dayAfter, { count: step.daysOffset })}</span>
                </div>
                <button type="button" className="tappable shrink-0" style={{ marginTop: 22 }} aria-label={t(K.cadence.remove)} disabled={s.draftSteps.length <= 1} onClick={() => s.removeStep(step.key)}>
                  <TrashSimple size={16} className={s.draftSteps.length <= 1 ? 't-muted' : 't-error'} />
                </button>
              </div>

              <div className="stack gap-1">
                <span className="label">{t(K.cadence.tierLabel)}</span>
                <Select value={step.escalationTier} onChange={(e) => s.updateStep(step.key, { escalationTier: e.target.value as never })}>
                  {ESCALATION_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {t(K.tier[tier])}
                    </option>
                  ))}
                </Select>
              </div>

              {step.escalationTier === 'call_task' ? (
                <p className="t-xs t-muted row gap-1 items-start">
                  <WarningCircle size={13} className="shrink-0 mt-1" />
                  {t(K.cadence.callTaskNote)}
                </p>
              ) : (
                <>
                  <div className="stack gap-1">
                    <span className="label">{t(K.cadence.channelLabel)}</span>
                    <Select value={step.channel} onChange={(e) => s.updateStep(step.key, { channel: e.target.value as never })}>
                      <option value="sms">{t('commChannel.sms')}</option>
                      <option value="whatsapp">{t('commChannel.whatsapp')}</option>
                    </Select>
                  </div>
                  <div className="stack gap-1">
                    <span className="label">{t(K.cadence.templateLabel)}</span>
                    <Select value={step.templateGroupId} onChange={(e) => s.updateStep(step.key, { templateGroupId: e.target.value })}>
                      {REMINDER_TEMPLATE_GROUPS.map((tpl) => (
                        <option key={tpl} value={tpl}>
                          {tpl}
                        </option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Button size="sm" variant="secondary" icon={<Plus size={16} />} className="mb-4" onClick={s.addStep}>
        {t(K.cadence.addStep)}
      </Button>

      <h2 className="t-lg mb-2">{t(K.sendWindow.heading)}</h2>
      <Card className="mb-4">
        <p className="t-sm t-muted mb-3">{t(K.sendWindow.body)}</p>
        <div className="row gap-3">
          <div className="grow stack gap-1">
            <span className="label">{t(K.sendWindow.startLabel)}</span>
            <Select value={s.sendWindowStart} onChange={(e) => s.setSendWindowStart(Number(e.target.value))}>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </Select>
          </div>
          <div className="grow stack gap-1">
            <span className="label">{t(K.sendWindow.endLabel)}</span>
            <Select value={s.sendWindowEnd} onChange={(e) => s.setSendWindowEnd(Number(e.target.value))}>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="t-xs t-muted mt-3 row gap-1 items-start">
          <WarningCircle size={13} className="shrink-0 mt-1" />
          {t(K.sendWindow.holidayNote)}
        </p>
      </Card>

      <h2 className="t-lg mb-2">{t(K.preview.heading)}</h2>
      <Card className="mb-4">
        <div className="stack gap-1 mb-3">
          <span className="label">{t(K.preview.sampleLabel)}</span>
          <Select value={s.sampleId ?? ''} onChange={(e) => s.setSampleId(e.target.value || null)}>
            {s.samplePayments.map((line) => (
              <option key={line.payment.id} value={line.payment.id}>
                {line.siteName} · {t(`finance.paymentStage.${line.payment.stage}`)} · {formatINR(line.payment.amount)}
              </option>
            ))}
          </Select>
        </div>
        {s.timeline.length === 0 ? (
          <p className="t-sm t-muted">{t(K.preview.empty)}</p>
        ) : (
          <div className="stack gap-2">
            {s.timeline.map((entry) => (
              <div key={entry.step.id} className="row between items-center gap-2 hairline-top pt-2">
                <div className="stack gap-1">
                  <span className="t-sm t-medium">{t(K.tier[entry.step.escalationTier])}</span>
                  <span className="t-xs t-muted">{formatDate(entry.fireDate, i18n.language)}</span>
                </div>
                <Badge tone={OUTCOME_TONE[entry.outcome]}>{t(K.preview.outcome[entry.outcome])}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <h2 className="t-lg mb-2">{t(K.runNow.heading)}</h2>
      <Card className="mb-4">
        <p className="t-sm t-muted mb-3">{t(K.runNow.body)}</p>
        <Button size="sm" icon={<Play size={16} />} loading={s.runningNow} onClick={() => void s.runNow().then((ok) => toast.push(t(ok ? K.toast.ranNow : K.toast.error), ok ? 'success' : 'error'))}>
          {t(K.runNow.button)}
        </Button>
        {s.runResult && (
          <div className="stack gap-1 mt-3 hairline-top pt-3">
            <span className="t-xs t-muted">{t(K.runNow.resultSent, { count: s.runResult.sent })}</span>
            <span className="t-xs t-muted">{t(K.runNow.resultCallTasks, { count: s.runResult.callTasksCreated })}</span>
            <span className="t-xs t-muted">{t(K.runNow.resultSkippedOptedOut, { count: s.runResult.skippedOptedOut })}</span>
            <span className="t-xs t-muted">{t(K.runNow.resultSkippedPaused, { count: s.runResult.skippedPaused })}</span>
            <span className="t-xs t-muted">{t(K.runNow.resultSkippedWindow, { count: s.runResult.skippedOutsideWindow })}</span>
          </div>
        )}
      </Card>

      <h2 className="t-lg mb-2">{t(K.pauses.heading)}</h2>
      <div className="stack gap-3 mb-4">
        {s.pauses.length === 0 ? (
          <Card>
            <p className="t-sm t-muted">{t(K.pauses.empty)}</p>
          </Card>
        ) : (
          s.pauses.map((view) => (
            <Card key={view.pause.id}>
              <div className="row between items-start gap-3">
                <div className="stack gap-1">
                  <span className="t-medium">{view.siteName}</span>
                  <span className="t-xs t-muted">{view.dealCode}</span>
                  <span className="t-xs t-muted">{view.pause.reason}</span>
                  <span className="t-xs t-muted">{t(K.pauses.pausedLine, { name: view.pause.pausedBy, date: formatDate(view.pause.pausedAt, i18n.language) })}</span>
                </div>
                <Button size="sm" variant="secondary" icon={<Pause size={14} />} onClick={() => void s.resumeDeal(view.pause.dealId).then((ok) => toast.push(t(ok ? K.toast.resumed : K.toast.error), ok ? 'success' : 'error'))}>
                  {t(K.pauses.resume)}
                </Button>
              </div>
              {view.isLongStanding && (
                <p className="t-xs t-warning mt-2 row gap-1 items-center">
                  <Clock size={13} /> {t(K.pauses.longStanding)}
                </p>
              )}
            </Card>
          ))
        )}
      </div>
      <Button size="sm" variant="secondary" icon={<CaretRight size={16} />} className="mb-4" onClick={s.openPauseSheet}>
        {t(K.pauses.addPause)}
      </Button>

      <ActionBar>
        <Button block disabled={!s.dirty} loading={s.saving} onClick={() => void s.save().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}>
          {t(K.actionBar.save)}
        </Button>
      </ActionBar>

      <Sheet
        open={s.pauseSheetOpen}
        onClose={s.closePauseSheet}
        title={t(K.pauseSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block variant="secondary" disabled={!s.pauseDealId || !s.pauseReason.trim()} loading={s.submittingPause} onClick={() => void s.submitPause().then((ok) => toast.push(t(ok ? K.toast.paused : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.pauseSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.pauseSheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.pauseSheet.dealLabel)}</span>
            <Select value={s.pauseDealId} onChange={(e) => s.setPauseDealId(e.target.value)}>
              {s.dealsForPause.map((line) => (
                <option key={line.payment.dealId} value={line.payment.dealId}>
                  {line.siteName} ({line.dealCode})
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.pauseSheet.reasonLabel)}</span>
            <TextArea value={s.pauseReason} onChange={(e) => s.setPauseReason(e.target.value)} rows={3} />
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
