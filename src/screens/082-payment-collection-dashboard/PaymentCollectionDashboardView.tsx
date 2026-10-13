import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, Flag, GearSix, Scales, Warning, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  Chip,
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
  formatDate,
  formatINR,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { remainingBalance } from '@/features/payments/aging';
import { usePaymentCollectionDashboard } from './usePaymentCollectionDashboard';
import { PAYMENT_COLLECTION_DASHBOARD_KEYS as K, SEVERITY_FILTERS, STAGE_FILTERS } from './payment-collection-dashboard.types';

const BUCKET_TONE: Record<string, BadgeTone> = { current: 'success', d30: 'warning', d60: 'warning', d90plus: 'error', disputed: 'neutral' };

export function PaymentCollectionDashboardView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = usePaymentCollectionDashboard();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
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
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <button type="button" className="tappable" aria-label={t(K.reminderSettingsLink)} onClick={() => navigate('/admin/analytics/collections/reminders')}>
            <GearSix size={20} className="t-emerald" />
          </button>
        }
      />

      <div className="grid-auto mb-4" style={{ ['--min' as string]: '160px' }}>
        <Card>
          <StatTile label={t(K.kpi.collected)} value={<span className="num">{formatINRCompact(s.kpis.collected)}</span>} large />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.pending)} value={<span className="num">{formatINRCompact(s.kpis.pending)}</span>} large />
        </Card>
        <Card>
          <StatTile
            label={t(K.kpi.overdue)}
            value={<span className="num t-warning">{formatINRCompact(s.kpis.overdueAmount)}</span>}
            caption={String(s.kpis.overdueCount)}
            large
          />
        </Card>
        <Card>
          <StatTile
            label={t(K.kpi.disputed)}
            value={<span className="num t-muted">{formatINRCompact(s.kpis.disputedAmount)}</span>}
            caption={String(s.kpis.disputedCount)}
            large
          />
        </Card>
      </div>

      <div className="stack gap-3 mb-4">
        <div className="row wrap gap-2">
          <Chip pressed={s.stageFilter === null} onClick={() => s.setStageFilter(null)}>
            {t(K.filters.stageAll)}
          </Chip>
          {STAGE_FILTERS.map((stg) => (
            <Chip key={stg} pressed={s.stageFilter === stg} onClick={() => s.setStageFilter(s.stageFilter === stg ? null : stg)}>
              {t(`finance.paymentStage.${stg}`)}
            </Chip>
          ))}
        </div>
        <div className="row wrap gap-2">
          <Chip pressed={s.severityFilter === null} onClick={() => s.setSeverityFilter(null)}>
            {t(K.filters.severityAll)}
          </Chip>
          {SEVERITY_FILTERS.map((bucket) => (
            <Chip key={bucket} pressed={s.severityFilter === bucket} onClick={() => s.setSeverityFilter(s.severityFilter === bucket ? null : bucket)}>
              {t(K.bucket[bucket])}
            </Chip>
          ))}
        </div>
        {s.owners.length > 0 && (
          <Select value={s.ownerFilter ?? ''} onChange={(e) => s.setOwnerFilter(e.target.value || null)}>
            <option value="">{t(K.filters.ownerAll)}</option>
            {s.owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </Select>
        )}
      </div>

      {s.lines.length === 0 ? (
        <EmptyState title={t(K.noResults.title)} body={t(K.noResults.body)} />
      ) : (
        <div className="stack gap-3">
          {s.lines.map((line) => {
            const displayStatus = s.displayStatusOf(line.payment);
            const balance = remainingBalance(line.payment);
            const isLarge = s.isLargeReceivable(line.payment);
            const overdueDays = Math.floor((s.now - new Date(line.payment.dueDate).getTime()) / 86_400_000);
            const isAgingBucket = displayStatus !== 'paid' && displayStatus !== 'refunded' && displayStatus !== 'failed';
            return (
              <Card key={line.payment.id} onClick={() => s.openDetail(line)} style={isLarge ? { borderLeft: '3px solid var(--color-warning)' } : undefined}>
                <div className="row between items-start gap-3">
                  <div className="stack gap-1" style={{ minWidth: 0 }}>
                    <span className={`t-medium truncate ${isLarge ? 't-lg' : ''}`}>{line.siteName}</span>
                    <span className="t-xs t-muted truncate">
                      {line.dealCode} · {t(`finance.paymentStage.${line.payment.stage}`)} {line.ownerName && `· ${line.ownerName}`}
                    </span>
                    {line.payment.amountReceived ? <span className="t-xs t-warning">{t(K.row.partiallyReceived, { amount: formatINR(line.payment.amountReceived) })}</span> : null}
                  </div>
                  <div className="stack gap-1 items-end shrink-0">
                    <span className={`num t-semibold ${isLarge ? 't-xl' : 't-sm'}`}>{formatINR(displayStatus === 'paid' ? line.payment.amount : balance)}</span>
                    <Badge tone={isAgingBucket ? BUCKET_TONE[displayStatus] : displayStatus === 'paid' ? 'success' : 'neutral'}>
                      {isAgingBucket ? t(K.bucket[displayStatus]) : t(K.row[displayStatus])}
                    </Badge>
                    {isAgingBucket && displayStatus !== 'current' && displayStatus !== 'disputed' && overdueDays > 0 && <span className="t-xs t-muted">{t(K.row.daysOverdue, { days: overdueDays })}</span>}
                  </div>
                </div>
                {isLarge && (
                  <p className="t-xs t-warning mt-2 row gap-1 items-center">
                    <Warning size={12} /> {t(K.row.large)}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Sheet
        open={s.openLine !== null}
        onClose={s.closeDetail}
        title={s.openLine?.siteName ?? ''}
        closeLabel={t('action.close')}
        footer={
          s.openLine && (
            <div className="stack gap-2">
              {s.openLine.payment.status !== 'paid' && s.openLine.payment.status !== 'disputed' && (
                <div className="row gap-2">
                  <Button block variant="secondary" icon={<Bell size={16} />} loading={s.sendingReminder} onClick={() => void s.sendReminder().then((ok) => toast.push(t(ok ? K.toast.reminderSent : K.toast.error), ok ? 'success' : 'error'))}>
                    {t(K.detail.sendReminder)}
                  </Button>
                  <Button block variant="secondary" icon={<WarningCircle size={16} />} loading={s.escalating} onClick={() => void s.escalate().then((ok) => toast.push(t(ok ? K.toast.escalated : K.toast.error), ok ? 'success' : 'error'))}>
                    {t(K.detail.escalate)}
                  </Button>
                </div>
              )}
              <div className="row gap-2">
                {s.openLine.payment.status !== 'paid' && (
                  <Button block icon={<Scales size={16} />} onClick={s.openMarkPaid}>
                    {t(K.detail.markPaid)}
                  </Button>
                )}
                {/* A paid stage can still be disputed — a customer noticing a
                    quality issue after the fact is exactly screen 090's own
                    refund scenario, not something only an unpaid stage can
                    reach. */}
                {s.openLine.payment.status !== 'disputed' && s.openLine.payment.status !== 'refunded' && (
                  <Button block variant="ghost" icon={<Flag size={16} />} onClick={s.openDispute}>
                    {t(K.detail.dispute)}
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {s.openLine && (
          <div className="stack gap-3">
            <div className="row between t-sm">
              <span className="t-muted">{t(K.detail.ownerLabel)}</span>
              <span>{s.openLine.ownerName || '—'}</span>
            </div>
            <div className="row between t-sm">
              <span className="t-muted">{t(K.detail.amountLabel)}</span>
              <span className="num">{formatINR(s.openLine.payment.amount)}</span>
            </div>
            {s.openLine.payment.amountReceived ? (
              <div className="row between t-sm">
                <span className="t-muted">{t(K.detail.receivedLabel)}</span>
                <span className="num t-success">{formatINR(s.openLine.payment.amountReceived)}</span>
              </div>
            ) : null}
            <div className="row between t-sm hairline-top pt-2">
              <span className="t-muted">{t(K.detail.remainingLabel)}</span>
              <span className="num t-semibold">{formatINR(remainingBalance(s.openLine.payment))}</span>
            </div>
            {s.openLine.payment.status === 'disputed' && (
              <Card>
                <p className="t-sm t-warning mb-1">{t(K.detail.disputedLine)}</p>
                <p className="t-xs t-muted">{s.openLine.payment.disputeReason}</p>
              </Card>
            )}
            {s.openLine.payment.manualReferenceNumber && (
              <p className="t-xs t-muted">{t(K.detail.manualPaymentLine, { reference: s.openLine.payment.manualReferenceNumber, date: s.openLine.payment.paidAt ? formatDate(s.openLine.payment.paidAt, i18n.language) : '' })}</p>
            )}
          </div>
        )}
      </Sheet>

      <Sheet
        open={s.markPaidOpen}
        onClose={s.closeMarkPaid}
        title={t(K.markPaidSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!s.markPaidAmount || !s.markPaidReference.trim()} loading={s.submittingMarkPaid} onClick={() => void s.submitMarkPaid().then((ok) => toast.push(t(ok ? K.toast.markedPaid : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.markPaidSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.markPaidSheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.markPaidSheet.amountLabel)}</span>
            <Input type="number" value={s.markPaidAmount} onChange={(e) => s.setMarkPaidAmount(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.markPaidSheet.referenceLabel)}</span>
            <Input value={s.markPaidReference} onChange={(e) => s.setMarkPaidReference(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.markPaidSheet.methodLabel)}</span>
            <Select value={s.markPaidMethod} onChange={(e) => s.setMarkPaidMethod(e.target.value as never)}>
              {(['neft', 'upi', 'card', 'cash', 'cheque'] as const).map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={s.disputeOpen}
        onClose={s.closeDispute}
        title={t(K.disputeSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block variant="danger" disabled={!s.disputeReason.trim()} loading={s.submittingDispute} onClick={() => void s.submitDispute().then((ok) => toast.push(t(ok ? K.toast.disputed : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.disputeSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.disputeSheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.disputeSheet.reasonLabel)}</span>
            <TextArea value={s.disputeReason} onChange={(e) => s.setDisputeReason(e.target.value)} rows={3} />
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
