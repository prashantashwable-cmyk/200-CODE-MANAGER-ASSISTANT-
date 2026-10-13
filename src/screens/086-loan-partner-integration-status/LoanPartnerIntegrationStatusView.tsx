import { useTranslation } from 'react-i18next';
import { Bank, CheckCircle, ClockCountdown, Prohibit, WarningCircle } from '@phosphor-icons/react';
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, LoadingState, ListRow, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { LoanApplicationStatus } from '@/data/types';
import { useLoanPartnerIntegrationStatus } from './useLoanPartnerIntegrationStatus';
import { CANCELLABLE_STATUSES, LOAN_PARTNER_STATUS_KEYS as K, STATUS_FILTERS } from './loan-partner-integration-status.types';

const STATUS_TONE: Record<LoanApplicationStatus, BadgeTone> = {
  submitted: 'neutral',
  under_review: 'warning',
  approved: 'accent',
  disbursed: 'success',
  cancelled: 'error',
};

const STATUS_ICON: Record<LoanApplicationStatus, typeof CheckCircle> = {
  submitted: ClockCountdown,
  under_review: ClockCountdown,
  approved: Bank,
  disbursed: CheckCircle,
  cancelled: Prohibit,
};

export function LoanPartnerIntegrationStatusView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useLoanPartnerIntegrationStatus();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
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

  const partner = s.partnerStats[0] ?? null;
  const selectedApp = s.selected?.application ?? null;
  const cancellable = selectedApp && CANCELLABLE_STATUSES.includes(selectedApp.status);

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      {partner && (
        <div className="grid-auto mb-4" style={{ '--min': '160px' } as never}>
          <Card>
            <span className="t-xs t-muted">{t(K.kpi.total)}</span>
            <div className="t-2xl num t-medium mt-2">{partner.totalApplications}</div>
            <span className="t-xs t-muted">{t(K.kpi.partnerCaption)}</span>
          </Card>
          <Card>
            <span className="t-xs t-muted">{t(K.kpi.approvalRate)}</span>
            <div className="t-2xl num t-medium mt-2">{partner.approvalRatePercent}%</div>
          </Card>
          <Card>
            <span className="t-xs t-muted">{t(K.kpi.avgDisbursement)}</span>
            <div className="t-2xl num t-medium mt-2">{partner.avgDaysToDisbursement === null ? '—' : t(K.kpi.avgDisbursementDays, { count: partner.avgDaysToDisbursement })}</div>
          </Card>
          <Card>
            <span className="t-xs t-muted">{t(K.kpi.stuck)}</span>
            <div className={`t-2xl num t-medium mt-2 ${s.stuckCount > 0 ? 't-error' : ''}`}>{s.stuckCount}</div>
          </Card>
        </div>
      )}

      <div className="mb-4">
        <Select value={s.statusFilter} onChange={(e) => s.setStatusFilter(e.target.value as never)}>
          <option value="all">{t(K.filters.all)}</option>
          <option value="stuck">{t(K.filters.stuck)}</option>
          {STATUS_FILTERS.map((st) => (
            <option key={st} value={st}>
              {t(K.status[st])}
            </option>
          ))}
        </Select>
      </div>

      {s.rows.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : s.filteredRows.length === 0 ? (
        <EmptyState title={t(K.noResults.title)} body={t(K.noResults.body)} />
      ) : (
        <div className="stack gap-2">
          {s.filteredRows.map((row) => {
            const Icon = STATUS_ICON[row.application.status];
            return (
              <ListRow
                key={row.application.id}
                onClick={() => s.openDetail(row)}
                leading={<Avatar name={row.customerName} />}
                title={`${row.customerName} · ${row.siteName}`}
                subtitle={`${row.dealCode} · ${formatINR(row.application.requestedAmount)}`}
                trailing={
                  <div className="stack gap-1" style={{ alignItems: 'flex-end' }}>
                    <Badge tone={STATUS_TONE[row.application.status]}>
                      <Icon size={12} />
                      {t(K.status[row.application.status])}
                    </Badge>
                    {row.isStuck && <Badge tone="error">{t(K.row.stuckBadge)}</Badge>}
                    {row.disbursementShortfall > 0 && <Badge tone="warning">{t(K.row.shortfallBadge)}</Badge>}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      <Sheet open={!!s.selected} onClose={s.closeDetail} title={s.selected ? `${s.selected.customerName} · ${s.selected.dealCode}` : ''} closeLabel={t('action.close')}>
        {selectedApp && s.selected && (
          <div className="stack gap-3">
            <div className="row between">
              <span className="t-sm t-muted">{t(K.detail.partner)}</span>
              <span className="t-sm t-medium">{selectedApp.partnerName}</span>
            </div>
            <div className="row between hairline-top">
              <span className="t-sm t-muted">{t(K.detail.requestedAmount)}</span>
              <span className="t-sm num">{formatINR(selectedApp.requestedAmount)}</span>
            </div>
            {selectedApp.approvedAmount !== undefined && (
              <div className="row between">
                <span className="t-sm t-muted">{t(K.detail.approvedAmount)}</span>
                <span className="t-sm num">{formatINR(selectedApp.approvedAmount)}</span>
              </div>
            )}
            {selectedApp.disbursedAmountReceived !== undefined && (
              <div className="row between">
                <span className="t-sm t-muted">{t(K.detail.disbursedAmountReceived)}</span>
                <span className="t-sm num">{formatINR(selectedApp.disbursedAmountReceived)}</span>
              </div>
            )}
            {s.selected.disbursementShortfall > 0 && (
              <div className="row-top gap-2 hairline-top">
                <WarningCircle size={16} className="t-warning shrink-0" />
                <div className="stack gap-1">
                  <div className="row between">
                    <span className="t-sm t-medium">{t(K.detail.shortfall)}</span>
                    <span className="t-sm num t-warning">{formatINR(s.selected.disbursementShortfall)}</span>
                  </div>
                  <span className="t-xs t-muted">{t(K.detail.shortfallNote)}</span>
                </div>
              </div>
            )}

            <div className="stack gap-2 hairline-top">
              <div className="row between">
                <span className="t-xs t-muted">{t(K.detail.submittedAt)}</span>
                <span className="t-xs">{formatDate(selectedApp.submittedAt, i18n.language)}</span>
              </div>
              {selectedApp.approvedAt && (
                <div className="row between">
                  <span className="t-xs t-muted">{t(K.detail.approvedAt)}</span>
                  <span className="t-xs">{formatDate(selectedApp.approvedAt, i18n.language)}</span>
                </div>
              )}
              {selectedApp.disbursedAt && (
                <div className="row between">
                  <span className="t-xs t-muted">{t(K.detail.disbursedAt)}</span>
                  <span className="t-xs">{formatDate(selectedApp.disbursedAt, i18n.language)}</span>
                </div>
              )}
            </div>

            {s.selected.isStuck && (
              <div className="row-top gap-2 hairline-top">
                <WarningCircle size={16} className="t-error shrink-0" />
                <span className="t-sm t-muted">{t(K.detail.stuckNote)}</span>
              </div>
            )}
            {selectedApp.status === 'cancelled' && (
              <div className="row-top gap-2 hairline-top">
                <Prohibit size={16} className="t-muted shrink-0" />
                <span className="t-sm t-muted">{t(K.detail.cancelledNote)}</span>
              </div>
            )}

            {s.selected.isStuck && (
              <Button
                variant="secondary"
                loading={s.escalating}
                onClick={() => void s.escalate(selectedApp.id).then((ok) => toast.push(t(ok ? K.toast.escalated : K.toast.error), ok ? 'success' : 'error'))}
              >
                {t(K.detail.escalate)}
              </Button>
            )}

            {cancellable && !s.cancelPromptOpen && (
              <Button variant="ghost" onClick={s.startCancel}>
                {t(K.detail.cancel)}
              </Button>
            )}

            {cancellable && s.cancelPromptOpen && (
              <div className="stack gap-2 hairline-top">
                <p className="t-xs t-muted">{t(K.detail.cancelHint)}</p>
                <span className="label">{t(K.detail.cancelReasonLabel)}</span>
                <TextArea value={s.cancelReason} onChange={(e) => s.setCancelReason(e.target.value)} rows={3} />
                <Button
                  variant="secondary"
                  disabled={!s.cancelReason.trim()}
                  loading={s.cancelling === selectedApp.id}
                  onClick={() => void s.submitCancel(selectedApp.id).then((ok) => toast.push(t(ok ? K.toast.cancelled : K.toast.error), ok ? 'success' : 'error'))}
                >
                  {t(K.detail.cancelConfirm)}
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
