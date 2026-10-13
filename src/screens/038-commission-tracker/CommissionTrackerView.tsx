import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChatCircleText } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  SegBar,
  StatTile,
  formatDate,
  formatINR,
  formatPercent,
  useToast,
} from '@/design-system';
import { useCommissionTracker } from './useCommissionTracker';
import { COMMISSION_TRACKER_KEYS as K, PERIODS, reasonIdFromKey } from './commission-tracker.types';

const STATUS_TONE = {
  projected: 'neutral',
  approved: 'accent',
  paid: 'success',
  forfeited: 'error',
} as const;

/**
 * Screen 038 — Commission & Incentive Tracker. A surveyor can independently
 * verify exactly how any rupee of their commission was earned, and this
 * ledger can never quietly disagree with the admin's payout records — it is
 * the same data, not a copy.
 */
export function CommissionTrackerView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useCommissionTracker();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </Screen>
    );
  }

  if (s.status === 'empty') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<span className="row gap-2"><Button size="sm" variant="secondary" data-open-rewards onClick={() => navigate('/rewards-leaderboard')}>{t('rewardsLeaderboard.link.open')}</Button><Button size="sm" variant="secondary" data-open-badges onClick={() => navigate('/badges')}>{t('badges.link.open')}</Button><Button size="sm" variant="secondary" data-open-tds onClick={() => navigate('/tds-statement')}>{t('tdsStatement.link.open')}</Button><Button size="sm" variant="secondary" data-open-history onClick={() => navigate('/payout-history')}>{t('payoutHistory.link.open')}</Button></span>} />

      <SegBar
        label={t(K.period.thisMonth)}
        value={s.period}
        onChange={(id) => s.setPeriod(id as typeof s.period)}
        items={PERIODS.map((p) => ({ id: p, label: t(K.period[p]) }))}
        className="mb-4"
      />

      <Card className="mb-4">
        <StatTile
          label={t(K.total)}
          value={<span className="num">{formatINR(s.totals.current)}</span>}
          large
          delta={
            s.totals.changePct === null
              ? undefined
              : {
                  value: formatPercent(Math.abs(s.totals.changePct), 0),
                  direction: s.totals.changePct >= 0 ? 'up' : 'down',
                  tone: s.totals.changePct >= 0 ? 'success' : 'error',
                }
          }
          caption={s.totals.changePct !== null ? t(K.vsLastPeriod) : undefined}
        />
      </Card>

      <div className="grid-2 gap-3 mb-4">
        <Card>
          <StatTile label={t(K.status.paid)} value={<span className="num t-success">{formatINR(s.paidToDate)}</span>} />
        </Card>
        <Card>
          <StatTile label={t(K.nextPayoutLabel)} value={formatDate(s.nextPayoutDate, i18n.language)} />
        </Card>
      </div>

      <Card className="mb-4">
        <h2 className="t-md t-semibold mb-3">{t(K.rulesHeading)}</h2>
        <div className="stack gap-2">
          <p className="t-sm t-muted">{t(K.rule.capture)}</p>
          <p className="t-sm t-muted">{t(K.rule.conversion)}</p>
          <p className="t-sm t-muted">{t(K.rule.bonus)}</p>
        </div>
        <p className="t-xs t-muted mt-3">{t(K.nextPayout, { date: formatDate(s.nextPayoutDate, i18n.language) })}</p>
      </Card>

      <h2 className="t-lg mb-2">{t(K.ledgerHeading)}</h2>
      <Card flush>
        {s.entries.map((entry) => {
          const reasonId = reasonIdFromKey(entry.reasonKey);
          return (
            <div key={entry.id} className="hairline-top p-3">
              <ListRow
                title={t(`commission.reason.${reasonId}`)}
                subtitle={formatDate(entry.earnedAt, i18n.language)}
                trailing={
                  <span className="stack items-end gap-1">
                    <span
                      className={`t-sm t-semibold num ${entry.status === 'forfeited' ? 't-error' : ''}`}
                    >
                      {formatINR(entry.amount)}
                    </span>
                    <Badge tone={STATUS_TONE[entry.status]}>{t(K.status[entry.status])}</Badge>
                  </span>
                }
              />
              {entry.status === 'approved' && entry.payoutApproval?.status === 'held' ? (
                <div className="stack gap-1 mt-1" data-payout-hold>
                  <Badge tone="warning">{t('payoutApproval.partner.onHold', { date: formatDate(entry.payoutApproval.at, i18n.language) })}</Badge>
                  <p className="t-xs t-muted">{t(`payoutApproval.partner.hold.${entry.payoutApproval.holdKind ?? 'other'}`)}</p>
                </div>
              ) : entry.status === 'approved' && entry.disbursement && entry.disbursement.status !== 'cancelled' && entry.disbursement.status !== 'completed' ? (
                <p className="t-xs t-muted mt-1" data-payout-disbursement={entry.disbursement.status}>{entry.disbursement.status === 'failed' ? t(['account_closed', 'invalid_account', 'bank_rejected', 'upi_invalid'].includes(entry.disbursement.failure ?? '') ? 'payoutDisbursement.partner.needsDetails' : 'payoutDisbursement.partner.retrying') : t('payoutDisbursement.partner.sending')}</p>
              ) : (
                <p className="t-xs t-muted mt-1">{entry.status === 'approved' && entry.payoutApproval?.status === 'approved' && entry.payoutApproval.amount === entry.amount ? t('payoutApproval.partner.cleared') : t(K.statusExplain[entry.status])}</p>
              )}
              <button
                type="button"
                className="tappable t-xs t-accent row gap-1 mt-1"
                style={{ minHeight: 32 }}
                data-ask-about={entry.id}
                onClick={() => navigate(`/payout-dispute?entry=${entry.id}`)}
              >
                <ChatCircleText size={13} />
                {t(K.raiseQuery)}
              </button>
            </div>
          );
        })}
      </Card>

      <p className="t-xs t-muted mt-3">{t(K.liveNote)}</p>
    </Screen>
  );
}
