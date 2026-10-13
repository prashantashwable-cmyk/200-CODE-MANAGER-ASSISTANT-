import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  SegBar,
  Sheet,
  StatTile,
  formatINR,
  formatINRCompact,
  formatDate,
} from '@/design-system';
import { useFinance } from './useFinance';
import { AGING_BUCKETS, FINANCE_KEYS as K } from './finance.types';
import type { AgingGroup } from './finance.types';

/**
 * Screen 028 — Financial Overview: Cash Flow & Receivables. "How much are we
 * owed, and how overdue is it" answered in one glance, with every figure one
 * tap from the payment stage behind it.
 */
export function FinanceView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useFinance();
  const [openGroup, setOpenGroup] = useState<AgingGroup | null>(null);

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.summary) {
    return (
      <Screen width="wide">
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

  const { summary } = s;

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-auto mb-3" style={{ ['--min' as string]: '160px' }}>
        <Card>
          <StatTile label={t(K.card.cashIn)} value={<span className="num">{formatINRCompact(summary.cashIn)}</span>} large />
        </Card>
        <Card>
          <StatTile label={t(K.card.cashOut)} value={<span className="num">{formatINRCompact(summary.cashOut)}</span>} large />
        </Card>
        <Card>
          <StatTile
            label={t(K.card.netPosition)}
            value={
              <span className={`num ${summary.netPosition >= 0 ? 't-success' : 't-error'}`}>
                {formatINRCompact(summary.netPosition)}
              </span>
            }
            large
          />
        </Card>
        <Card>
          <StatTile
            label={t(K.card.totalReceivable)}
            value={<span className="num">{formatINRCompact(summary.totalReceivable)}</span>}
            large
          />
        </Card>
        {s.inTransit && (
          <Card>
            <StatTile label={t(K.card.inTransit)} value={<span className="num">{formatINRCompact(s.inTransit.value)}</span>} caption={t(K.card.inTransitNote)} large />
          </Card>
        )}
        {s.payouts && (
          <Card>
            <StatTile label={t(K.card.payouts)} value={<span className="num">{formatINRCompact(s.payouts.approvedNow)}</span>} caption={t(K.card.payoutsNote, { count: s.payouts.approvedCount, pending: formatINRCompact(s.payouts.projected) })} large />
            <Button size="sm" variant="ghost" onClick={() => navigate('/payout-tracker')}>
              {t(K.card.seePayouts)}
            </Button>
          </Card>
        )}
        {s.supplierOutflows && (
          <Card>
            <StatTile
              label={t(K.card.supplierOut)}
              value={<span className="num">{formatINRCompact(s.supplierOutflows.next30)}</span>}
              caption={t(K.card.supplierOutNote, { owed: formatINRCompact(s.supplierOutflows.owedNow), later: formatINRCompact(s.supplierOutflows.later) })}
              large
            />
            <Button size="sm" variant="ghost" onClick={() => navigate('/supplier-payment-schedule')}>
              {t(K.card.seeSchedule)}
            </Button>
          </Card>
        )}
      </div>

      {summary.skewedByOutlier && (
        <Card className="mb-4">
          <p className="t-sm t-warning row gap-2">
            <Warning size={16} className="shrink-0" />
            {t(K.outlierNote)}
          </p>
          <p className="t-xs t-muted mt-2">
            {t(K.medianNote, { median: formatINR(summary.medianReceivable) })}
          </p>
        </Card>
      )}

      <h2 className="t-lg mb-2">{t(K.agingHeading)}</h2>
      <div className="grid-auto mb-2" style={{ ['--min' as string]: '150px' }}>
        {AGING_BUCKETS.map((bucket) => {
          const group = s.agingGroups.find((g) => g.bucket === bucket)!;
          const tone =
            bucket === 'd90plus' ? 't-error' : bucket === 'd60' ? 't-warning' : bucket === 'disputed' ? 't-muted' : undefined;
          return (
            <Card key={bucket} onClick={group.payments.length > 0 ? () => setOpenGroup(group) : undefined}>
              <StatTile
                label={t(K.bucket[bucket])}
                value={<span className={`num ${tone ?? ''}`}>{formatINRCompact(group.total)}</span>}
              />
              <p className="t-xs t-muted mt-1">{group.payments.length}</p>
            </Card>
          );
        })}
      </div>
      <p className="t-xs t-muted mb-4">{t(K.dueDateNote)}</p>

      {(s.agingGroups.find((g) => g.bucket === 'd90plus')?.payments.length ?? 0) > 0 && (
        <Card className="mb-4">
          <p className="t-sm t-error">{t(K.escalationNote)}</p>
        </Card>
      )}

      <div className="row between mb-2">
        <h2 className="t-lg">{t(K.upcomingHeading)}</h2>
        <SegBar
          label={t(K.window['30'])}
          value={s.window}
          onChange={(id) => s.setWindow(id as '7' | '30')}
          items={[
            { id: '7', label: t(K.window['7']) },
            { id: '30', label: t(K.window['30']) },
          ]}
        />
      </div>

      <Card flush className="mb-4">
        {s.upcoming.length === 0 ? (
          <p className="t-sm t-muted p-3">{t(K.empty.body)}</p>
        ) : (
          s.upcoming.map((row) => (
            <ListRow
              key={row.payment.id}
              title={row.payment.code}
              subtitle={t(K.paymentStage[row.payment.stage])}
              trailing={
                <span className="stack items-end gap-1">
                  <span className="t-sm t-semibold num">{formatINR(row.payment.amount)}</span>
                  <Badge tone={row.daysUntilDue <= 0 ? 'error' : 'neutral'}>
                    {row.daysUntilDue <= 0 ? t(K.dueToday) : t(K.dueIn, { days: row.daysUntilDue })}
                  </Badge>
                </span>
              }
            />
          ))
        )}
      </Card>

      <p className="t-xs t-muted">{t(K.reconciliationNote)}</p>
      <p className="t-xs t-muted">{t(K.currencyNote)}</p>

      <Sheet
        open={openGroup !== null}
        onClose={() => setOpenGroup(null)}
        title={openGroup ? t(K.sheetTitle, { bucket: t(K.bucket[openGroup.bucket]) }) : ''}
        closeLabel={t('action.close')}
      >
        <Card flush>
          {openGroup?.payments.map((payment) => (
            <ListRow
              key={payment.id}
              title={payment.code}
              subtitle={formatDate(payment.dueDate, i18n.language)}
              trailing={<span className="t-sm t-semibold num">{formatINR(payment.amount)}</span>}
              onClick={() => navigate('/admin/analytics/revenue')}
            />
          ))}
        </Card>
      </Sheet>
    </Screen>
  );
}
