import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Broadcast, ChatCircleDots, ShieldCheck, Timer, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  TextArea,
  Toggle,
  formatDate,
  formatINR,
  formatPercent,
  relativeTimeParts,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { NegotiationStatus } from '@/data/types';
import { useNegotiationBotConfig } from './useNegotiationBotConfig';
import { NEGOTIATION_BOT_CONFIG_KEYS as K, OBJECTION_KEYS, TONE_OPTIONS, dashboardStatusLabel } from './negotiation-bot-config.types';

const STATUS_TONE: Record<NegotiationStatus, BadgeTone> = {
  bot_active: 'success',
  escalated: 'warning',
  human_takeover: 'accent',
  closed_won: 'success',
  closed_lost: 'neutral',
};

export function NegotiationBotConfigView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useNegotiationBotConfig();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
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
    <Screen className="pb-action-bar">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button size="sm" variant="secondary" onClick={() => navigate('/admin/deals/counter-offers')}>
            {t(K.counterOffersLink)}
          </Button>
        }
      />

      <div className="stack gap-4 mb-4">
        <div>
          <h2 className="t-lg mb-2 row gap-2 items-center">
            <ShieldCheck size={18} className="t-emerald" />
            {t(K.guardrails.heading)}
          </h2>
          <Card>
            <div className="stack gap-3">
              <div className="stack gap-1">
                <span className="label">{t(K.guardrails.bufferLabel)}</span>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  mono
                  invalid={s.bufferInvalid}
                  value={s.draft.marginBufferPct}
                  onChange={(e) => s.setMarginBufferPct(Number(e.target.value))}
                />
                {s.bufferInvalid && <span className="t-xs t-error">{t(K.guardrails.bufferMustBeNonNegative)}</span>}
                <span className="t-xs t-muted">{t(K.guardrails.bufferHint)}</span>
              </div>
              <div className="row between items-center hairline-top pt-2">
                <span className="t-sm t-muted">{t(K.guardrails.effectiveFloor)}</span>
                <span className="num t-sm t-semibold">
                  {formatPercent(s.companyMarginFloorPct / 100, 0)} + {formatPercent(s.draft.marginBufferPct / 100, 0)} = {formatPercent(s.effectiveBotFloorPct / 100, 0)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2 row gap-2 items-center">
            <Timer size={18} className="t-emerald" />
            {t(K.rounds.heading)}
          </h2>
          <Card>
            <div className="stack gap-1">
              <span className="label">{t(K.rounds.label)}</span>
              <Input
                type="number"
                min={1}
                mono
                invalid={s.roundsInvalid}
                value={s.draft.maxNegotiationRounds}
                onChange={(e) => s.setMaxNegotiationRounds(Number(e.target.value))}
              />
              {s.roundsInvalid && <span className="t-xs t-error">{t(K.rounds.mustBeAtLeastOne)}</span>}
              <span className="t-xs t-muted">{t(K.rounds.hint)}</span>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2">{t(K.persona.heading)}</h2>
          <Card>
            <div className="stack gap-1">
              <span className="label">{t(K.persona.toneLabel)}</span>
              <Select value={s.draft.toneKey} onChange={(e) => s.setToneKey(e.target.value as typeof s.draft.toneKey)}>
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
          <h2 className="t-lg mb-2">{t(K.autoClose.heading)}</h2>
          <Card>
            <div className="stack gap-2">
              <Toggle
                checked={s.draft.autoCloseAuthorityFlag}
                onChange={s.setAutoCloseAuthorityFlag}
                label={t(K.autoClose.label)}
                description={t(K.autoClose.hint)}
              />
              {s.draft.autoCloseAuthorityFlag && (
                <p className="t-xs t-warning row gap-1 items-start">
                  <WarningCircle size={13} className="shrink-0 mt-1" />
                  {t(K.autoClose.warning)}
                </p>
              )}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2 row gap-2 items-center">
            <ChatCircleDots size={18} className="t-emerald" />
            {t(K.scenarios.heading)}
          </h2>
          <p className="t-sm t-muted mb-2">{t(K.scenarios.subtitle)}</p>
          <div className="stack gap-2">
            {OBJECTION_KEYS.map((objectionKey) => {
              const scenario = s.draft.objectionScenarios.find((sc) => sc.objectionKey === objectionKey);
              return (
                <Card key={objectionKey}>
                  <div className="stack gap-1">
                    <span className="t-sm t-semibold">{t(K.scenarios.objectionLabel[objectionKey])}</span>
                    <span className="label">{t(K.scenarios.strategyLabel)}</span>
                    <TextArea
                      rows={2}
                      value={scenario?.responseStrategy ?? ''}
                      onChange={(e) => s.setScenarioStrategy(objectionKey, e.target.value)}
                    />
                  </div>
                </Card>
              );
            })}
            <p className="t-xs t-muted row gap-1 items-start">
              <WarningCircle size={13} className="shrink-0 mt-1" />
              {t(K.scenarios.noMatchNote)}
            </p>
          </div>
        </div>

        <div>
          <h2 className="t-lg mb-2 row gap-2 items-center">
            <Broadcast size={18} className="t-emerald" />
            {t(K.dashboard.heading)}
          </h2>
          <p className="t-sm t-muted mb-2">{t(K.dashboard.subtitle)}</p>
          {s.negotiationRows.length === 0 ? (
            <EmptyState title={t(K.dashboard.empty)} body="" />
          ) : (
            <div className="stack gap-2">
              {s.negotiationRows.map(({ negotiation, deal, lead }) => (
                <Card key={negotiation.id}>
                  <div className="row between items-start gap-3 mb-2">
                    <div className="stack gap-1" style={{ minWidth: 0 }}>
                      <span className="t-sm t-semibold truncate">{lead?.siteName ?? deal?.code ?? negotiation.dealId}</span>
                      <span className="t-xs t-muted">
                        {t(K.dashboard.roundsProgress, { used: negotiation.roundsUsed, max: negotiation.maxRoundsAllowed })}
                      </span>
                    </div>
                    <Badge tone={STATUS_TONE[negotiation.status]}>{t(dashboardStatusLabel(negotiation.status))}</Badge>
                  </div>

                  <div className="row between t-xs t-muted mb-1">
                    <span>{t(K.dashboard.currentOffer, { amount: formatINR(negotiation.currentOfferPrice) })}</span>
                    <span>{t(K.dashboard.floor, { amount: formatINR(negotiation.floorPrice) })}</span>
                  </div>

                  {negotiation.lastEscalationReason && negotiation.status !== 'bot_active' && (
                    <p className="t-xs t-muted mb-1">{t(K.dashboard.escalationReason[negotiation.lastEscalationReason])}</p>
                  )}

                  {negotiation.status === 'human_takeover' && (
                    <p className="t-xs t-muted">
                      {t(K.dashboard.takenOverBy, {
                        date: negotiation.takenOverAt ? formatDate(negotiation.takenOverAt, i18n.language) : '',
                      })}
                    </p>
                  )}

                  <div className="row gap-2 mt-1">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/deals/${negotiation.id}/thread`)}>
                      {t(K.dashboard.openThread)}
                    </Button>
                    {negotiation.status !== 'human_takeover' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={s.takingOverId === negotiation.id}
                        onClick={() => void s.takeOver(negotiation.id).then((ok) => toast.push(t(ok ? K.toast.takenOver : K.toast.error), ok ? 'success' : 'error'))}
                      >
                        {t(K.dashboard.takeOver)}
                      </Button>
                    )}
                  </div>

                  <p className="t-xs t-muted mt-2">
                    {(() => {
                      const rel = relativeTimeParts(negotiation.lastActivityAt);
                      return t(K.dashboard.lastActivity, { time: t(rel.key, { count: rel.count }) });
                    })()}
                  </p>
                </Card>
              ))}
            </div>
          )}
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
