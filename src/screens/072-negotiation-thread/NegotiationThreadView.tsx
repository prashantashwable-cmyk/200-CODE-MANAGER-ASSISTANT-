import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, HandPalm, Microphone, WarningCircle } from '@phosphor-icons/react';
import {
  AscensionLine,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  formatINR,
  formatTime,
  useToast,
} from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { NegotiationStatus } from '@/data/types';
import { useNegotiationThread } from './useNegotiationThread';
import { NEGOTIATION_THREAD_KEYS as K, controlModeOf } from './negotiation-thread.types';

const STATUS_TONE: Record<NegotiationStatus, BadgeTone> = {
  bot_active: 'success',
  escalated: 'warning',
  human_takeover: 'accent',
  closed_won: 'success',
  closed_lost: 'neutral',
};

export function NegotiationThreadView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useNegotiationThread();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.thread) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { negotiation, lead, deal, messages } = s.thread;
  const controlMode = controlModeOf(negotiation.status);

  const roundSteps: AscensionStep[] = Array.from({ length: negotiation.maxRoundsAllowed }, (_, i) => {
    const roundNumber = i + 1;
    return {
      id: `round-${roundNumber}`,
      label: t(K.header.round, { number: roundNumber }),
      status: roundNumber < negotiation.roundsUsed ? 'complete' : roundNumber === negotiation.roundsUsed ? 'current' : 'upcoming',
    };
  });

  return (
    <Screen className="pb-action-bar">
      <ScreenHeader
        title={lead.siteName}
        subtitle={deal.code}
        back={() => navigate(-1)}
        action={
          <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/deals/${deal.id}/terms`)}>
            {t(K.finalizeTerms)}
          </Button>
        }
      />

      <Card className="mb-3">
        <div className="row between items-start gap-3 mb-3">
          <div className="stack gap-1">
            <span className="label">{t(K.header.currentOffer)}</span>
            <span className="num t-xl t-semibold">{formatINR(negotiation.currentOfferPrice)}</span>
          </div>
          <div className="stack gap-1 items-end">
            <span className="label">{t(K.header.floor)}</span>
            <span className="num t-sm t-muted">{formatINR(negotiation.floorPrice)}</span>
          </div>
        </div>
        <div className="row between items-center gap-3">
          <Badge tone={STATUS_TONE[negotiation.status]}>{t(K.status[negotiation.status])}</Badge>
          {negotiation.lastEscalationReason && controlMode !== 'bot' && (
            <span className="t-xs t-muted">{t(K.escalationReason[negotiation.lastEscalationReason])}</span>
          )}
        </div>
        <div className="hairline-top pt-3 mt-3">
          <AscensionLine steps={roundSteps} orientation="horizontal" />
        </div>
      </Card>

      {controlMode !== 'human' && controlMode !== 'closed' && (
        <Card className="mb-3">
          <div className="row gap-2 items-start mb-2">
            <WarningCircle size={18} className={controlMode === 'needs_human' ? 't-warning' : 't-muted'} style={{ marginTop: 2 }} />
            <span className="t-sm">{t(K.takeOver.banner)}</span>
          </div>
          <Button
            size="sm"
            icon={<HandPalm size={16} />}
            onClick={() => void s.takeOver().then((ok) => toast.push(t(ok ? K.toast.takenOver : K.toast.error), ok ? 'success' : 'error'))}
            loading={s.takingOver}
          >
            {t(K.takeOver.action)}
          </Button>
        </Card>
      )}

      {messages.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2 mb-3">
          {messages.map((msg) => {
            const isCustomer = msg.sender === 'customer';
            return (
              <div key={msg.id} className="row" style={{ justifyContent: isCustomer ? 'flex-start' : 'flex-end' }}>
                <div
                  className="stack gap-1"
                  style={{
                    maxWidth: '80%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-control)',
                    background: isCustomer ? 'var(--color-surface-alt)' : 'var(--color-accent-primary)',
                    color: isCustomer ? 'var(--color-text-primary)' : 'var(--color-bg)',
                  }}
                >
                  {msg.sender !== 'customer' && (
                    <span className="t-xs" style={{ opacity: 0.8 }}>
                      {msg.sender === 'bot' ? t(K.bubble.bot) : msg.senderName}
                    </span>
                  )}
                  {msg.mediaKind ? (
                    <span className="row gap-2 items-center">
                      {msg.mediaKind === 'photo' ? <Camera size={16} /> : <Microphone size={16} />}
                      {t(msg.mediaKind === 'photo' ? K.bubble.photo : K.bubble.voice)}
                    </span>
                  ) : (
                    <span className="t-sm">{msg.body}</span>
                  )}
                  <span className="t-xs" style={{ opacity: 0.7, alignSelf: 'flex-end' }}>
                    {formatTime(msg.at, i18n.language)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="ds-action-bar">
        {controlMode === 'human' ? (
          <div className="row gap-2">
            <Input
              value={s.composerText}
              onChange={(e) => s.setComposerText(e.target.value)}
              placeholder={t(K.composer.placeholder)}
              style={{ flex: 1 }}
            />
            <Button
              disabled={!s.composerText.trim()}
              loading={s.sending}
              onClick={() => void s.send().then((ok) => toast.push(t(ok ? K.toast.sent : K.toast.error), ok ? 'success' : 'error'))}
            >
              {t(K.composer.send)}
            </Button>
          </div>
        ) : (
          <p className="t-xs t-muted" style={{ margin: 0 }}>
            {t(controlMode === 'closed' ? K.composer.closedNote : K.composer.botHandlingNote)}
          </p>
        )}
      </div>
    </Screen>
  );
}
