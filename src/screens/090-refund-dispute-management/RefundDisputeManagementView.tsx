import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowSquareOut, ArrowUUpLeft, Percent, Receipt, Scales, Warning, XCircle } from '@phosphor-icons/react';
import {
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
  Sheet,
  TextArea,
  formatINR,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { useRefundDisputeManagement } from './useRefundDisputeManagement';
import { REFUND_DISPUTE_MANAGEMENT_KEYS as K } from './refund-dispute-management.types';

const RESOLUTION_TONE: Record<string, BadgeTone> = { full_refund: 'success', partial_refund: 'warning', rejected: 'neutral' };

export function RefundDisputeManagementView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useRefundDisputeManagement();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={4} />
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

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <SegBar
        label={t(K.title)}
        className="mb-4"
        value={s.segment}
        onChange={(v) => s.setSegment(v as never)}
        items={[
          { id: 'open', label: `${t(K.segment.open)} (${s.openCount})` },
          { id: 'resolved', label: `${t(K.segment.resolved)} (${s.resolvedCount})` },
        ]}
      />

      {s.rows.length === 0 ? (
        <EmptyState
          icon={<Scales size={26} />}
          title={t(s.segment === 'open' ? K.empty.title : K.noResults.title)}
          body={t(s.segment === 'open' ? K.empty.body : K.noResults.body)}
        />
      ) : (
        <div className="stack gap-3">
          {s.rows.map((row) => (
            <Card key={row.payment.id} onClick={() => s.openDetail(row)}>
              <div className="row between items-start gap-3">
                <div className="stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-medium truncate">{row.siteName}</span>
                  <span className="t-xs t-muted truncate">
                    {row.dealCode} · {row.customerName}
                  </span>
                  <span className="t-xs t-muted truncate">{row.payment.disputeReason}</span>
                </div>
                <div className="stack gap-1 items-end shrink-0">
                  <span className="num t-semibold t-sm">{row.amountPaid > 0 ? formatINR(row.amountPaid) : t(K.row.notYetPaid)}</span>
                  {row.isResolved ? (
                    <Badge tone={RESOLUTION_TONE[row.payment.resolutionType ?? 'rejected']}>{t(K.resolutionType[row.payment.resolutionType ?? 'rejected'])}</Badge>
                  ) : (
                    <Badge tone={row.slaBreached ? 'error' : 'neutral'}>{t(K.row.slaHours, { hours: row.slaHours })}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={s.openRow !== null}
        onClose={s.closeDetail}
        title={s.openRow?.siteName ?? ''}
        closeLabel={t('action.close')}
        footer={
          s.openRow &&
          !s.openRow.isResolved && (
            <div className="stack gap-2">
              <div className="row gap-2">
                <Button block variant="secondary" icon={<ArrowUUpLeft size={16} />} disabled={s.openRow.amountPaid <= 0} onClick={s.openFullRefund}>
                  {t(K.detail.approveFullRefund)}
                </Button>
                <Button block variant="secondary" icon={<Percent size={16} />} disabled={s.openRow.amountPaid <= 0} onClick={s.openPartialRefund}>
                  {t(K.detail.approvePartialRefund)}
                </Button>
              </div>
              <Button block variant="ghost" icon={<XCircle size={16} />} onClick={s.openReject}>
                {t(K.detail.reject)}
              </Button>
            </div>
          )
        }
      >
        {s.openRow && (
          <div className="stack gap-3">
            <Card>
              <p className="t-xs t-muted mb-1">{t(K.detail.disputeReasonLabel)}</p>
              <p className="t-sm">{s.openRow.payment.disputeReason}</p>
            </Card>
            <div className="row between t-sm">
              <span className="t-muted">{t(K.detail.amountPaidLabel)}</span>
              <span className="num t-semibold">{s.openRow.amountPaid > 0 ? formatINR(s.openRow.amountPaid) : t(K.row.notYetPaid)}</span>
            </div>
            {!s.openRow.isResolved && (
              <div className="row between t-sm">
                <span className="t-muted">{t(K.detail.slaLabel)}</span>
                <span className={s.openRow.slaBreached ? 't-error' : ''}>
                  {t(K.row.slaHours, { hours: s.openRow.slaHours })}
                  {s.openRow.slaBreached && ` · ${t(K.row.slaBreached)}`}
                </span>
              </div>
            )}
            {s.openRow.isFinancingPayment && (
              <Card style={{ borderColor: 'var(--color-warning)' }}>
                <p className="t-sm t-warning row gap-1 items-start">
                  <Warning size={16} className="shrink-0" /> {t(K.detail.financingWarning)}
                </p>
              </Card>
            )}
            {s.openRow.hasDownstreamAllocation && (
              <Card style={{ borderColor: 'var(--color-warning)' }}>
                <p className="t-sm t-warning row gap-1 items-start">
                  <Warning size={16} className="shrink-0" /> {t(K.detail.downstreamWarning)}
                </p>
              </Card>
            )}
            {s.openRow.isResolved && (
              <Card>
                <div className="row between t-sm mb-1">
                  <Badge tone={RESOLUTION_TONE[s.openRow.payment.resolutionType ?? 'rejected']}>{t(K.resolutionType[s.openRow.payment.resolutionType ?? 'rejected'])}</Badge>
                  <span className="t-muted">
                    {t(K.detail.resolvedByLabel)}: {s.openRow.payment.resolvedBy}
                  </span>
                </div>
                <p className="t-xs t-muted mb-1 mt-2">{t(K.detail.resolutionNoteLabel)}</p>
                <p className="t-sm">{s.openRow.payment.resolutionNote}</p>
                {s.openRow.payment.resolutionAmount ? <p className="t-sm num t-semibold mt-1">{formatINR(s.openRow.payment.resolutionAmount)}</p> : null}
              </Card>
            )}
            {s.lastCreditNote && (
              <Card>
                <p className="t-sm t-success row gap-1 items-center">
                  <Receipt size={14} /> {t(K.detail.creditNoteIssued, { code: s.lastCreditNote.code })}
                </p>
              </Card>
            )}
            <button type="button" className="tappable t-sm t-emerald row gap-1 items-center" onClick={() => navigate(`/admin/leads/${s.openRow?.leadId}`)}>
              {t(K.detail.viewHistory)} <ArrowSquareOut size={14} />
            </button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={s.fullRefundOpen}
        onClose={s.closeFullRefund}
        title={t(K.fullRefundSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!s.fullRefundReason.trim()} loading={s.submittingFullRefund} onClick={() => void s.submitFullRefund().then((ok) => toast.push(t(ok ? K.toast.resolved : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.fullRefundSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.fullRefundSheet.hint)}</p>
          <div className="row between t-sm">
            <span className="t-muted">{t(K.fullRefundSheet.amountLabel)}</span>
            <span className="num t-semibold">{s.openRow ? formatINR(s.openRow.amountPaid) : ''}</span>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.fullRefundSheet.reasonLabel)}</span>
            <TextArea value={s.fullRefundReason} onChange={(e) => s.setFullRefundReason(e.target.value)} rows={3} />
          </div>
        </div>
      </Sheet>

      <Sheet
        open={s.partialRefundOpen}
        onClose={s.closePartialRefund}
        title={t(K.partialRefundSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!s.partialRefundReason.trim() || !s.partialRefundAmount || Number(s.partialRefundAmount) <= 0 || (s.openRow ? Number(s.partialRefundAmount) > s.openRow.amountPaid : true)}
            loading={s.submittingPartialRefund}
            onClick={() => void s.submitPartialRefund().then((ok) => toast.push(t(ok ? K.toast.resolved : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.partialRefundSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.partialRefundSheet.hint, { amount: s.openRow ? formatINR(s.openRow.amountPaid) : '' })}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.partialRefundSheet.amountLabel)}</span>
            <Input type="number" min={0} max={s.openRow?.amountPaid} value={s.partialRefundAmount} onChange={(e) => s.setPartialRefundAmount(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.partialRefundSheet.reasonLabel)}</span>
            <TextArea value={s.partialRefundReason} onChange={(e) => s.setPartialRefundReason(e.target.value)} rows={3} />
          </div>
        </div>
      </Sheet>

      <Sheet
        open={s.rejectOpen}
        onClose={s.closeReject}
        title={t(K.rejectSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block variant="danger" disabled={!s.rejectReason.trim()} loading={s.submittingReject} onClick={() => void s.submitReject().then((ok) => toast.push(t(ok ? K.toast.resolved : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.rejectSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.rejectSheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.rejectSheet.reasonLabel)}</span>
            <TextArea value={s.rejectReason} onChange={(e) => s.setRejectReason(e.target.value)} rows={3} />
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
