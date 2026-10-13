import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  StatTile,
  TextArea,
  formatINR,
  useToast,
} from '@/design-system';
import { useCostBreakdown } from './useCostBreakdown';
import { COST_BREAKDOWN_KEYS as K, MARGIN_WARNING_BUFFER_PCT } from './cost-breakdown.types';

export function CostBreakdownView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useCostBreakdown();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="block" />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.quotation || !s.pricingConfig) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const q = s.quotation;
  const pricing = s.pricingConfig;
  const nearFloor = !s.belowFloor && s.marginDraft - pricing.minimumMarginFloorPct <= MARGIN_WARNING_BUFFER_PCT;
  const baseCost = q.cost.equipmentCost + q.cost.civilWorkEstimate + q.cost.installationLaborCost + q.cost.transportCost;

  return (
    <Screen>
      <ScreenHeader
        title={s.lead?.siteName ?? q.code}
        subtitle={`${q.code} · v${q.version}`}
        action={<Badge tone="accent">{t(`quotationStatus.${q.status}`)}</Badge>}
      />

      <Card className="mb-4">
        <StatTile label={t(K.finalPriceLabel)} value={<span className="num">{formatINR(q.cost.finalPrice)}</span>} large caption={t(K.gstInclusiveNote)} />
      </Card>

      <h2 className="t-lg mb-2">{t(K.lineItems.heading)}</h2>
      <Card className="mb-4">
        <div className="stack gap-2">
          <div className="row between">
            <span className="t-sm">{t(K.lineItems.equipment)}</span>
            <span className="t-sm num">{formatINR(q.cost.equipmentCost)}</span>
          </div>
          <div className="row between items-center">
            <span className="t-sm">{q.cost.civilWorkAdjustmentNote ? t(K.lineItems.civilWorkAdjusted) : t(K.lineItems.civilWork)}</span>
            <div className="row gap-2 items-center">
              <span className="t-sm num">{formatINR(q.cost.civilWorkEstimate)}</span>
              <button type="button" className="tappable t-xs t-accent" onClick={s.openCivilWorkSheet}>
                {t(K.lineItems.adjust)}
              </button>
            </div>
          </div>
          {q.cost.civilWorkAdjustmentNote && <p className="t-xs t-muted">{q.cost.civilWorkAdjustmentNote}</p>}
          <div className="row between">
            <span className="t-sm">{t(K.lineItems.labor)}</span>
            <span className="t-sm num">{formatINR(q.cost.installationLaborCost)}</span>
          </div>
          <div className="row between">
            <span className="t-sm">{t(K.lineItems.transport)}</span>
            <span className="t-sm num">{formatINR(q.cost.transportCost)}</span>
          </div>
          <div className="row between hairline-top pt-2">
            <span className="t-sm t-medium">{t(K.lineItems.subtotal)}</span>
            <span className="t-sm num t-medium">{formatINR(baseCost)}</span>
          </div>
          <div className="row between">
            <span className="t-sm">{t(K.lineItems.margin, { pct: q.cost.marginPct })}</span>
            <span className="t-sm num">{formatINR(q.cost.marginAmount)}</span>
          </div>
          <div className="row between">
            <span className="t-sm">{t(K.lineItems.gst, { pct: q.cost.gstPercent })}</span>
            <span className="t-sm num">{formatINR(q.cost.gstAmount)}</span>
          </div>
          <div className="row between hairline-top pt-2">
            <span className="t-sm t-semibold">{t(K.lineItems.total)}</span>
            <span className="t-sm num t-semibold">{formatINR(q.cost.finalPrice)}</span>
          </div>
        </div>
      </Card>

      <p className="t-xs t-muted mb-4">{t(K.perFloorDelta, { amount: formatINR(q.cost.perFloorCostDelta) })}</p>

      <h2 className="t-lg mb-1">{t(K.marginSection.heading)}</h2>
      <p className="t-sm t-muted mb-3">{t(K.marginSection.subtitle)}</p>
      <Card className="mb-4">
        <div className="stack gap-3">
          <div className="row between">
            <span className="t-xs t-muted">{t(K.marginSection.floorLabel, { pct: pricing.minimumMarginFloorPct })}</span>
            <span className="t-xs t-muted">{t(K.marginSection.currentLabel, { pct: q.cost.marginPct })}</span>
          </div>
          <Input
            type="number"
            step="0.1"
            min={0}
            value={s.marginDraft}
            invalid={s.belowFloor}
            onChange={(e) => s.setMarginDraft(Number(e.target.value))}
          />
          {s.belowFloor && (
            <p className="t-xs t-error row gap-1 items-center">
              <WarningCircle size={13} />
              {t(K.marginSection.blockedBelowFloor)}
            </p>
          )}
          {!s.belowFloor && nearFloor && (
            <p className="t-xs t-warning row gap-1 items-center">
              <WarningCircle size={13} />
              {t(K.marginSection.warningNearFloor)}
            </p>
          )}
          <Button
            variant="secondary"
            disabled={!s.marginDirty || s.belowFloor}
            loading={s.saving}
            onClick={() => void s.saveMargin().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.marginSection.save)}
          </Button>
        </div>
      </Card>

      <Sheet
        open={s.civilWorkSheetOpen}
        onClose={s.closeCivilWorkSheet}
        title={t(K.civilWorkSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!s.civilWorkNote.trim()}
            loading={s.saving}
            onClick={() => void s.saveCivilWork().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.civilWorkSheet.save)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.civilWorkSheet.body)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.civilWorkSheet.amountLabel)}</span>
            <Input type="number" min={0} value={s.civilWorkAmount} onChange={(e) => s.setCivilWorkAmount(Number(e.target.value))} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.civilWorkSheet.noteLabel)}</span>
            <TextArea rows={3} value={s.civilWorkNote} onChange={(e) => s.setCivilWorkNote(e.target.value)} />
            {!s.civilWorkNote.trim() && <span className="t-xs t-error">{t(K.civilWorkSheet.noteRequired)}</span>}
          </div>
        </div>
      </Sheet>

      <ActionBar>
        <Button block onClick={() => navigate(`/admin/quotes/${q.id}/preview`)}>
          {t(K.continue)}
        </Button>
      </ActionBar>
    </Screen>
  );
}
