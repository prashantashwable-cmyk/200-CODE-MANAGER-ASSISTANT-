import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, Eye, PaperPlaneTilt, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  TextArea,
  Toggle,
  formatDate,
  formatDateTime,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { QuotationDeliveryResult } from '@/data/types';
import { useQuotationSend } from './useQuotationSend';
import { QUOTATION_SEND_KEYS as K } from './quotation-send.types';

const RESULT_BADGE_TONE: Record<QuotationDeliveryResult['status'], BadgeTone> = {
  delivered: 'success',
  sent: 'accent',
  failed: 'error',
};

export function QuotationSendView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useQuotationSend();

  // Seeds the cover-message editor from the default template exactly once
  // per quotation — never overwriting what the sales user has since typed.
  useEffect(() => {
    if (s.quotation && !s.isSuperseded && !s.hasPendingScheduledSend && !s.isSent && s.coverMessage === '') {
      s.setCoverMessage(t(K.composeForm.defaultMessage, { name: s.lead?.contactName ?? '', code: s.quotation.code }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.quotation?.id, s.isSuperseded, s.hasPendingScheduledSend, s.isSent]);

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="block" />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.quotation) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const quotation = s.quotation;
  const subtitle = s.lead ? `${s.lead.siteName} · ${quotation.code}` : quotation.code;

  if (s.isSuperseded) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={subtitle} />
        <div className="ds-state">
          <span className="ds-state__title">{t(K.supersededState.title)}</span>
          <p className="ds-state__body">{t(K.supersededState.body)}</p>
          {s.latestVersionId && (
            <Button variant="ghost" onClick={() => navigate(`/admin/quotes/${s.latestVersionId}/send`)}>
              {t(K.supersededState.viewLatest)}
            </Button>
          )}
        </div>
      </Screen>
    );
  }

  if (s.hasPendingScheduledSend && quotation.scheduledSendAt) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={subtitle} />
        <Card className="mb-4">
          <div className="stack gap-2">
            <span className="row gap-2 items-center t-sm t-semibold">
              <Clock size={16} className="t-emerald" />
              {t(K.scheduledCard.title)}
            </span>
            <span className="t-sm t-muted">{t(K.scheduledCard.scheduledFor, { date: formatDateTime(quotation.scheduledSendAt, i18n.language) })}</span>
            <div className="row wrap gap-2">
              {quotation.deliveryChannels.map((channel) => (
                <Badge key={channel} tone="neutral">
                  {t(K.channel[channel])}
                </Badge>
              ))}
            </div>
            {quotation.coverMessage && <p className="t-xs t-muted">{quotation.coverMessage}</p>}
          </div>
        </Card>
        <Button
          variant="ghost"
          loading={s.cancelling}
          onClick={() => void s.cancelScheduled().then((ok) => toast.push(t(ok ? K.toast.cancelled : K.toast.error), ok ? 'success' : 'error'))}
        >
          {t(K.scheduledCard.cancel)}
        </Button>
      </Screen>
    );
  }

  if (s.isSent) {
    const results = quotation.deliveryResults;
    const allDelivered = results.length > 0 && results.every((r) => r.status !== 'failed');
    const allFailed = results.length > 0 && results.every((r) => r.status === 'failed');
    const bannerTone: BadgeTone = allDelivered ? 'success' : allFailed ? 'error' : 'warning';
    const bannerText = allDelivered ? t(K.confirmation.allDelivered) : allFailed ? t(K.confirmation.allFailed) : t(K.confirmation.mixedResult);

    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={subtitle} action={<Badge tone="accent">{t(`quotationStatus.${quotation.status}`)}</Badge>} />

        <Card className="mb-4">
          <div className="stack gap-3">
            <span className={`t-sm t-semibold t-${bannerTone === 'error' ? 'error' : bannerTone === 'warning' ? 'warning' : 'success'}`}>{bannerText}</span>
            <div className="stack gap-2">
              {results.map((result) => (
                <div key={result.channel} className="stack gap-1">
                  <div className="row between items-center">
                    <span className="t-sm">{t(K.channel[result.channel])}</span>
                    <Badge tone={RESULT_BADGE_TONE[result.status]}>{t(K.confirmation.channelStatus[result.status])}</Badge>
                  </div>
                  {result.status === 'failed' && result.failureReason && (
                    <p className="t-xs t-error row gap-1 items-center">
                      <WarningCircle size={12} />
                      {t(K.confirmation.failureReason[result.failureReason as keyof typeof K.confirmation.failureReason] ?? result.failureReason)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="mb-4">
          <span className="label">{t(K.confirmation.messageSentLabel)}</span>
          <p className="t-sm mt-1">{quotation.coverMessage}</p>
        </Card>

        <p className="t-xs t-muted row gap-1 items-center">
          <Eye size={13} />
          {quotation.viewedAt ? t(K.confirmation.viewTracking.viewed, { date: formatDate(quotation.viewedAt, i18n.language) }) : t(K.confirmation.viewTracking.sentNotViewed)}
        </p>
      </Screen>
    );
  }

  if (s.availableChannels.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={subtitle} />
        <EmptyState title={t(K.noChannelState.title)} body={t(K.noChannelState.body)} />
      </Screen>
    );
  }

  return (
    <Screen className="pb-action-bar">
      <ScreenHeader title={t(K.title)} subtitle={subtitle} />

      <h2 className="t-lg mb-2">{t(K.composeForm.heading)}</h2>
      <Card className="mb-4">
        <div className="stack gap-4">
          <div className="stack gap-2">
            <span className="label">{t(K.composeForm.channelHeading)}</span>
            {s.availableChannels.map((channel) => (
              <Checkbox key={channel} checked={s.selectedChannels.includes(channel)} onChange={() => s.toggleChannel(channel)} label={t(K.channel[channel])} />
            ))}
            {s.whatsappOptedOut && (
              <p className="t-xs t-muted row gap-1 items-center">
                <WarningCircle size={12} />
                {t(K.composeForm.whatsappOptedOutNote)}
              </p>
            )}
            {!s.hasEmail && (
              <p className="t-xs t-muted row gap-1 items-center">
                <WarningCircle size={12} />
                {t(K.composeForm.noEmailNote)}
              </p>
            )}
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.composeForm.messageLabel)}</span>
            <TextArea rows={4} value={s.coverMessage} onChange={(e) => s.setCoverMessage(e.target.value)} />
            {!s.coverMessage.trim() && <span className="t-xs t-error">{t(K.composeForm.messageRequired)}</span>}
          </div>

          <Toggle checked={s.scheduleEnabled} onChange={s.setScheduleEnabled} label={t(K.composeForm.scheduleToggleLabel)} description={t(K.composeForm.scheduleToggleHint)} />

          {s.scheduleEnabled && (
            <div className="stack gap-1">
              <span className="label">{t(K.composeForm.scheduleTimeLabel)}</span>
              <Input type="datetime-local" value={s.scheduledSendAt} invalid={s.scheduleInPast} onChange={(e) => s.setScheduledSendAt(e.target.value)} />
              {s.scheduleInPast && <span className="t-xs t-error">{t(K.composeForm.schedulePastError)}</span>}
            </div>
          )}
        </div>
      </Card>

      <ActionBar>
        <Button
          block
          disabled={!s.canSubmit}
          loading={s.sending}
          icon={<PaperPlaneTilt size={16} />}
          onClick={() =>
            void s.submitSend().then((ok) => {
              toast.push(t(ok ? (s.scheduleEnabled ? K.toast.scheduled : K.toast.sent) : K.toast.error), ok ? 'success' : 'error');
            })
          }
        >
          {t(s.scheduleEnabled ? K.composeForm.scheduleSend : K.composeForm.sendNow)}
        </Button>
      </ActionBar>
    </Screen>
  );
}
