import { useTranslation } from 'react-i18next';
import { ChatCircleText, Megaphone, WarningCircle } from '@phosphor-icons/react';
import {
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
  Select,
  Sheet,
  StatTile,
  TextArea,
  Chip,
  formatDateTime,
  formatINR,
  formatPercent,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { BroadcastStatus, SmsFailureReason } from '@/data/types';
import { useSmsBroadcast } from './useSmsBroadcast';
import { SEGMENT_SOURCES, SEGMENT_STAGES, SMS_BROADCAST_KEYS as K, SMS_SEGMENT_LIMIT } from './sms-broadcast.types';

const STATUS_TONE: Record<BroadcastStatus, BadgeTone> = {
  draft: 'neutral',
  scheduled: 'accent',
  sending: 'warning',
  sent: 'success',
  cancelled: 'neutral',
};

const FAILURE_REASONS: SmsFailureReason[] = ['invalid_number', 'carrier_block', 'handset_unreachable'];

export function SmsBroadcastView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useSmsBroadcast();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const segmentDescription = (() => {
    const parts: string[] = [];
    if (s.filter.city) parts.push(s.filter.city);
    if (s.filter.stages.length) parts.push(s.filter.stages.map((st) => t(`stage.${st}`)).join('/'));
    if (s.filter.sources.length) parts.push(s.filter.sources.map((sr) => t(`leadSource.${sr}`)).join('/'));
    return parts.length ? parts.join(' · ') : t(K.compose.allSegment);
  })();

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-auto mb-4" style={{ ['--min' as string]: '150px' }}>
        <Card>
          <StatTile label={t(K.kpi.sentThisMonth)} value={<span className="num">{s.kpi.sentThisMonth}</span>} large />
        </Card>
        <Card>
          <StatTile
            label={t(K.kpi.deliveryRate)}
            value={<span className="num">{s.kpi.deliveryRatePct === null ? '—' : formatPercent(s.kpi.deliveryRatePct / 100)}</span>}
            large
          />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.totalCost)} value={<span className="num">{formatINR(s.kpi.totalCost)}</span>} large />
        </Card>
      </div>

      <Card className="mb-4" onClick={s.openCompose}>
        <div className="row gap-3">
          <Megaphone size={22} className="t-emerald" />
          <span className="t-sm t-medium">{t(K.newBroadcast)}</span>
        </div>
      </Card>

      {s.broadcasts.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.broadcasts.map((b) => (
            <Card key={b.id}>
              <div className="row between items-start gap-3 mb-2">
                <div className="stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-sm t-semibold truncate">{b.name}</span>
                  <span className="t-xs t-muted truncate">{b.segmentDescription}</span>
                </div>
                <Badge tone={STATUS_TONE[b.status]}>{t(K.report.statusBadge[b.status])}</Badge>
              </div>

              {b.status === 'scheduled' && b.scheduledFor && (
                <p className="t-xs t-muted mb-2">{t(K.report.scheduledFor, { date: formatDateTime(b.scheduledFor, i18n.language) })}</p>
              )}

              {b.sentCount > 0 && (
                <div className="row wrap gap-4 mb-2">
                  <span className="t-xs t-muted">{t(K.report.sent)}: <span className="num t-medium">{b.sentCount}</span></span>
                  <span className="t-xs t-muted">{t(K.report.delivered)}: <span className="num t-medium">{b.deliveredCount}</span></span>
                  <span className="t-xs t-muted">{t(K.report.failed)}: <span className="num t-medium">{b.failedCount}</span></span>
                  {b.optedOutExcludedCount > 0 && (
                    <span className="t-xs t-muted">{t(K.report.excludedOptedOut)}: <span className="num t-medium">{b.optedOutExcludedCount}</span></span>
                  )}
                </div>
              )}

              {b.failureBreakdown && (
                <div className="row wrap gap-2 mb-2">
                  {FAILURE_REASONS.filter((reason) => (b.failureBreakdown?.[reason] ?? 0) > 0).map((reason) => (
                    <Badge key={reason} tone="warning">
                      {t(K.failureReason[reason])}: {b.failureBreakdown?.[reason]}
                    </Badge>
                  ))}
                </div>
              )}

              {b.status === 'scheduled' && (
                <Button variant="ghost" size="sm" onClick={() => void s.cancel(b.id).then((ok) => toast.push(t(ok ? K.toast.cancelled : K.toast.error), ok ? 'success' : 'error'))}>
                  {t(K.report.cancel)}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Sheet open={s.composeOpen} onClose={s.closeCompose} title={t(K.compose.title)} closeLabel={t(K.action.close)}>
        <div className="stack gap-4">
          <div className="stack gap-1">
            <span className="label">{t(K.compose.nameLabel)}</span>
            <Input value={s.name} onChange={(e) => s.setName(e.target.value)} />
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.compose.messageLabel)}</span>
            <TextArea rows={4} value={s.messageBody} onChange={(e) => s.setMessageBody(e.target.value)} />
            <span className="t-xs t-muted">{t(K.compose.charCount, { count: s.messageBody.length, limit: SMS_SEGMENT_LIMIT })}</span>
          </div>

          <div className="stack gap-2">
            <span className="t-sm t-semibold">{t(K.compose.segmentHeading)}</span>

            <span className="t-xs t-muted">{t(K.compose.stageLabel)}</span>
            <div className="row wrap gap-2">
              {SEGMENT_STAGES.map((stage) => (
                <Chip key={stage} pressed={s.filter.stages.includes(stage)} onClick={() => s.toggleStage(stage)}>
                  {t(`stage.${stage}`)}
                </Chip>
              ))}
            </div>

            <span className="t-xs t-muted">{t(K.compose.sourceLabel)}</span>
            <div className="row wrap gap-2">
              {SEGMENT_SOURCES.map((source) => (
                <Chip key={source} pressed={s.filter.sources.includes(source)} onClick={() => s.toggleSource(source)}>
                  {t(`leadSource.${source}`)}
                </Chip>
              ))}
            </div>

            <Select value={s.filter.city} onChange={(e) => s.setCity(e.target.value)}>
              <option value="">{t(K.compose.allCities)}</option>
              {s.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>

            <Input placeholder={t(K.compose.searchPlaceholder)} value={s.filter.query} onChange={(e) => s.setQuery(e.target.value)} />
          </div>

          <Card>
            {s.preview ? (
              s.preview.leadIds.length === 0 ? (
                <span className="t-sm t-muted">{t(K.compose.noMatches)}</span>
              ) : (
                <div className="stack gap-1">
                  <span className="t-sm t-medium">{t(K.compose.previewMatching, { count: s.preview.leadIds.length })}</span>
                  {s.preview.excludedOptedOutCount > 0 && (
                    <span className="t-xs t-muted">{t(K.compose.previewExcluded, { count: s.preview.excludedOptedOutCount })}</span>
                  )}
                  <span className="t-xs t-muted">{t(K.compose.previewCost, { amount: formatINR(s.preview.estimatedCost) })}</span>
                </div>
              )
            ) : (
              <span className="t-sm t-muted">…</span>
            )}
          </Card>

          {s.isLargeSend && (
            <div className="stack gap-2">
              <p className="t-xs t-warning row gap-1 items-center">
                <WarningCircle size={13} />
                {t(K.compose.largeSendWarning, { count: s.preview?.leadIds.length ?? 0 })}
              </p>
              <Checkbox checked={s.largeSendConfirmed} onChange={s.setLargeSendConfirmed} label={t(K.compose.largeSendConfirmLabel)} />
            </div>
          )}

          <div className="stack gap-1">
            <span className="label">{t(K.compose.scheduleLabel)}</span>
            <Input type="datetime-local" value={s.scheduledFor} onChange={(e) => s.setScheduledFor(e.target.value)} />
            <span className="t-xs t-muted">{t(K.compose.scheduleHint)}</span>
          </div>

          {s.isRestrictedHour && (
            <p className="t-xs t-error row gap-1 items-center">
              <WarningCircle size={13} />
              {t(K.compose.restrictedHourWarning)}
            </p>
          )}

          <Button
            block
            disabled={!s.canSend}
            icon={<ChatCircleText size={16} />}
            onClick={() =>
              void s.send(segmentDescription).then((ok) => {
                toast.push(t(ok ? (s.scheduledFor ? K.toast.scheduled : K.toast.sent) : K.toast.error), ok ? 'success' : 'error');
              })
            }
          >
            {t(s.scheduledFor ? K.compose.schedule : K.compose.sendNow)}
          </Button>
        </div>
      </Sheet>
    </Screen>
  );
}
