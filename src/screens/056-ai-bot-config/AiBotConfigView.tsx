import { useTranslation } from 'react-i18next';
import { Robot, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  StatTile,
  TextArea,
  formatPercent,
  useToast,
} from '@/design-system';
import { MAX_SAFE_BOT_DISCOUNT_PCT } from '@/features/communication/botRules';
import { useAiBotConfig } from './useAiBotConfig';
import { AI_BOT_CONFIG_KEYS as K, TONE_OPTIONS } from './ai-bot-config.types';

export function AiBotConfigView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useAiBotConfig();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
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

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-auto mb-4" style={{ ['--min' as string]: '150px' }}>
        <Card>
          <StatTile label={t(K.stats.autoResolved)} value={<span className="num">{formatPercent(s.stats.autoResolvedRatePct / 100, 0)}</span>} large />
        </Card>
        <Card>
          <StatTile label={t(K.stats.escalated)} value={<span className="num">{formatPercent(s.stats.escalatedRatePct / 100, 0)}</span>} large />
        </Card>
      </div>

      <div className="stack gap-4 mb-4 pb-action-bar">
        <div>
          <h2 className="t-lg mb-2">{t(K.persona.heading)}</h2>
          <Card>
            <div className="stack gap-1">
              <span className="label">{t(K.persona.toneLabel)}</span>
              <Select value={s.draft.toneKey} onChange={(e) => s.setTone(e.target.value as typeof s.draft.toneKey)}>
                {TONE_OPTIONS.map((tone) => (
                  <option key={tone} value={tone}>
                    {t(K.persona.tone[tone])}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2">{t(K.discount.heading)}</h2>
          <Card>
            <div className="stack gap-3">
              <p className="t-xs t-muted">{t(K.discount.hint, { maxPct: MAX_SAFE_BOT_DISCOUNT_PCT })}</p>
              <div className="row gap-3">
                <div className="stack gap-1 grow">
                  <span className="label">{t(K.discount.minLabel)}</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={s.draft.allowedDiscountMinPct}
                    invalid={s.rangeInvalid}
                    onChange={(e) => s.setDiscountMin(Number(e.target.value))}
                  />
                </div>
                <div className="stack gap-1 grow">
                  <span className="label">{t(K.discount.maxLabel)}</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={s.draft.allowedDiscountMaxPct}
                    invalid={s.marginFloorError || s.rangeInvalid}
                    onChange={(e) => s.setDiscountMax(Number(e.target.value))}
                  />
                </div>
              </div>
              {s.marginFloorError && (
                <p className="t-xs t-error row gap-1 items-center">
                  <WarningCircle size={13} />
                  {t(K.discount.marginFloorError, { maxPct: MAX_SAFE_BOT_DISCOUNT_PCT })}
                </p>
              )}
              {s.rangeInvalid && !s.marginFloorError && (
                <p className="t-xs t-error row gap-1 items-center">
                  <WarningCircle size={13} />
                  {t(K.discount.rangeInvalid)}
                </p>
              )}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2">{t(K.escalation.heading)}</h2>
          <Card>
            <div className="stack gap-2">
              <div className="row between">
                <span className="t-sm t-medium">{t(K.escalation.thresholdLabel)}</span>
                <span className="t-sm num">{formatPercent(s.draft.escalationConfidenceThreshold, 0)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(s.draft.escalationConfidenceThreshold * 100)}
                onChange={(e) => s.setConfidenceThreshold(Number(e.target.value) / 100)}
                className="full-w"
                aria-label={t(K.escalation.thresholdLabel)}
              />
              <p className="t-xs t-muted">{t(K.escalation.hint)}</p>
              {s.lowConfidenceWarning && (
                <p className="t-xs t-warning row gap-1 items-center">
                  <WarningCircle size={13} />
                  {t(K.escalation.lowConfidenceWarning)}
                </p>
              )}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2">{t(K.simulator.heading)}</h2>
          <p className="t-sm t-muted mb-2">{t(K.simulator.subtitle)}</p>
          <Card>
            <div className="stack gap-3">
              {s.isDirty && <p className="t-xs t-muted">{t(K.simulator.testingUnsaved)}</p>}
              <TextArea
                rows={3}
                placeholder={t(K.simulator.placeholder)}
                value={s.sampleMessage}
                onChange={(e) => s.setSampleMessage(e.target.value)}
              />
              <Button
                variant="secondary"
                icon={<Robot size={16} />}
                loading={s.simRunning}
                disabled={!s.sampleMessage.trim()}
                onClick={() => void s.runSimulation()}
              >
                {t(K.simulator.run)}
              </Button>

              {s.simResult ? (
                <div className="stack gap-2 hairline-top pt-3">
                  <div className="row gap-2 items-center">
                    <Badge tone={s.simResult.escalate ? 'warning' : 'success'}>
                      {t(s.simResult.escalate ? K.simulator.escalatedBadge : K.simulator.autoResolvedBadge)}
                    </Badge>
                    <span className="t-xs t-muted">{t(K.simulator.confidence, { pct: Math.round(s.simResult.confidence * 100) })}</span>
                  </div>
                  {s.simResult.replyKey && <p className="t-sm">{t(s.simResult.replyKey, s.simResult.replyParams)}</p>}
                  {s.simResult.escalateReasonKey && <p className="t-sm t-muted">{t(s.simResult.escalateReasonKey)}</p>}
                </div>
              ) : (
                <div className="stack gap-1 hairline-top pt-3">
                  <span className="t-sm t-medium">{t(K.simulator.empty.title)}</span>
                  <p className="t-xs t-muted">{t(K.simulator.empty.body)}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ActionBar>
        <Button
          block
          disabled={!s.canSave}
          loading={s.saving}
          onClick={() => void s.save().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}
        >
          {t(K.save)}
        </Button>
      </ActionBar>
    </Screen>
  );
}
