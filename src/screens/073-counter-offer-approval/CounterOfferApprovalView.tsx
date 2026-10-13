import { useTranslation } from 'react-i18next';
import { ArrowClockwise, Gift, WarningCircle } from '@phosphor-icons/react';
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
  Sheet,
  TextArea,
  formatINR,
  relativeTimeParts,
  useToast,
} from '@/design-system';
import { useCounterOfferApproval } from './useCounterOfferApproval';
import { COUNTER_OFFER_APPROVAL_KEYS as K, SLA_WARNING_HOURS } from './counter-offer-approval.types';

function waitingHours(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / (60 * 60 * 1000);
}

export function CounterOfferApprovalView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useCounterOfferApproval();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={4} />
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

      {s.queue.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.queue.map((item) => {
            const hours = waitingHours(item.createdAt);
            const breached = hours >= SLA_WARNING_HOURS;
            const rel = relativeTimeParts(item.createdAt);
            const belowCompanyFloor = item.marginImpactPct < s.companyFloorPct;
            return (
              <Card key={item.id}>
                <div className="row between items-start gap-3 mb-2">
                  <div className="stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-sm t-semibold truncate">{item.lead.siteName}</span>
                    <span className="t-xs t-muted truncate">{item.deal.code}</span>
                  </div>
                  <Badge tone={breached ? 'warning' : 'neutral'}>
                    {breached && <WarningCircle size={11} />}
                    {t(breached ? K.row.slaBreached : K.row.waiting, { time: t(rel.key, { count: rel.count }) })}
                  </Badge>
                </div>

                {item.priorAskCount > 0 && (
                  <p className="t-xs t-muted row gap-1 items-center mb-1">
                    <ArrowClockwise size={12} />
                    {t(K.row.consolidatedNote, { count: item.priorAskCount })}
                  </p>
                )}

                <div className="row between items-end mb-1 hairline-top pt-2">
                  <div className="stack gap-1">
                    <span className="label">{t(K.row.customerAsk)}</span>
                    <span className="num t-lg t-semibold">{formatINR(item.customerRequestedPrice)}</span>
                  </div>
                  <div className="stack gap-1 items-end">
                    <span className="label">{t(K.row.standardPrice)}</span>
                    <span className="num t-sm t-muted">{formatINR(item.deal.quotedPrice)}</span>
                  </div>
                </div>

                <div className="row between t-xs mb-2">
                  <span className={belowCompanyFloor ? 't-error' : 't-muted'}>
                    {t(K.row.marginImpact, { pct: item.marginImpactPct })}
                  </span>
                  <span className="t-muted">{t(K.row.companyFloor, { pct: s.companyFloorPct })}</span>
                </div>

                {item.bundledConcessionNote && (
                  <div className="row gap-2 items-start mb-2">
                    <Gift size={16} className="t-emerald shrink-0" style={{ marginTop: 1 }} />
                    <p className="t-xs t-muted">
                      <strong className="t-semibold">{t(K.row.bundledConcession)}</strong> {item.bundledConcessionNote}
                    </p>
                  </div>
                )}

                <div className="row gap-2 mt-1">
                  <Button size="sm" loading={s.deciding === item.id} onClick={() => void s.approve(item.id).then((ok) => toast.push(t(ok ? K.toast.approved : K.toast.error), ok ? 'success' : 'error'))}>
                    {t(K.actions.approve)}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={s.deciding === item.id} onClick={() => s.openSheet(item, 'counter')}>
                    {t(K.actions.counter)}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={s.deciding === item.id} onClick={() => s.openSheet(item, 'reject')}>
                    {t(K.actions.reject)}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet
        open={s.sheetMode === 'reject'}
        onClose={s.closeSheet}
        title={t(K.rejectSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!s.rejectReason.trim()}
            loading={s.sheetTarget !== null && s.deciding === s.sheetTarget.id}
            onClick={() => void s.submitReject().then((ok) => toast.push(t(ok ? K.toast.rejected : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.rejectSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-1">
          <span className="label">{t(K.rejectSheet.reasonLabel)}</span>
          <TextArea rows={3} value={s.rejectReason} onChange={(e) => s.setRejectReason(e.target.value)} />
        </div>
      </Sheet>

      <Sheet
        open={s.sheetMode === 'counter'}
        onClose={s.closeSheet}
        title={t(K.counterSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!s.counterPrice || Number(s.counterPrice) <= 0}
            loading={s.sheetTarget !== null && s.deciding === s.sheetTarget.id}
            onClick={() => void s.submitCounter().then((ok) => toast.push(t(ok ? K.toast.countered : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.counterSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-2">
          <div className="stack gap-1">
            <span className="label">{t(K.counterSheet.priceLabel)}</span>
            <Input type="number" min={0} mono value={s.counterPrice} onChange={(e) => s.setCounterPrice(e.target.value)} />
          </div>
          <p className="t-xs t-muted row gap-1 items-start">
            <WarningCircle size={13} className="shrink-0 mt-1" />
            {t(K.counterSheet.belowFloorWarning)}
          </p>
        </div>
      </Sheet>
    </Screen>
  );
}
