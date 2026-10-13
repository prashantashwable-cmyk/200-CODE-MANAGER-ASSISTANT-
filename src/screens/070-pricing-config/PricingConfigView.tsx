import { useTranslation } from 'react-i18next';
import { WarningCircle } from '@phosphor-icons/react';
import {
  Button,
  Card,
  Checkbox,
  ErrorState,
  Input,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  formatDate,
  formatINR,
  formatPercent,
  useToast,
} from '@/design-system';
import { usePricingConfig } from './usePricingConfig';
import { AMC_TIER_ORDER, DRIVE_TYPES, PER_FLOOR_INCREMENT_GUIDANCE_MAX, PER_FLOOR_INCREMENT_GUIDANCE_MIN, PRICING_CONFIG_KEYS as K } from './pricing-config.types';

export function PricingConfigView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = usePricingConfig();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.pricing) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const pricing = s.pricing;
  const perFloorDraftPct = s.driveTypeSheet ? Number(s.driveTypeSheet.perFloorDraft) : 0;
  const perFloorOutOfRange =
    s.driveTypeSheet !== null &&
    !Number.isNaN(perFloorDraftPct) &&
    (perFloorDraftPct < PER_FLOOR_INCREMENT_GUIDANCE_MIN * 100 || perFloorDraftPct > PER_FLOOR_INCREMENT_GUIDANCE_MAX * 100);

  const marginDraftNumber = Number(s.marginDraft);
  const marginIsLowering = !Number.isNaN(marginDraftNumber) && marginDraftNumber < pricing.minimumMarginFloorPct;
  const marginCanSave = !Number.isNaN(marginDraftNumber) && marginDraftNumber > 0 && (!marginIsLowering || s.marginLoweringConfirmed);

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      <p className="t-xs t-muted mb-4">{t(K.governanceNote)}</p>

      <Card title={t(K.section.basePricing)} className="mb-4">
        <div className="stack gap-0 mt-2">
          {DRIVE_TYPES.map((driveType) => (
            <ListRow
              key={driveType}
              onClick={() => s.openDriveTypeSheet(driveType)}
              title={t(`driveType.${driveType}`)}
              subtitle={t(K.basePricing.perFloorLabel, { pct: formatPercent(pricing.perFloorIncrementPct[driveType], 0) })}
              trailing={<span className="num t-sm t-semibold">{formatINR(pricing.driveTypeBasePrice[driveType])}</span>}
            />
          ))}
        </div>
      </Card>

      <Card title={t(K.section.marginFloor)} className="mb-4">
        <div className="mt-2">
          <ListRow
            onClick={s.openMarginSheet}
            title={t(K.marginFloor.label)}
            trailing={<span className="num t-sm t-semibold">{formatPercent(pricing.minimumMarginFloorPct / 100, 0)}</span>}
          />
          <p className="t-xs t-muted mt-2 row gap-1 items-start">
            <WarningCircle size={13} className="shrink-0 mt-1" />
            {t(K.marginFloor.riskWarning)}
          </p>
        </div>
      </Card>

      <Card title={t(K.section.gst)} className="mb-4">
        <div className="stack gap-2 mt-2">
          <ListRow onClick={s.openGstSheet} title={t(K.gst.currentLabel)} trailing={<span className="num t-sm t-semibold">{formatPercent(s.effectiveGstRatePct / 100, 0)}</span>} />
          {pricing.scheduledGstChange && (
            <div className="row between items-center px-3">
              <span className="t-xs t-muted">
                {t(s.gstScheduleIsPending ? K.gst.scheduledLabel : K.gst.appliedLabel, {
                  pct: formatPercent(pricing.scheduledGstChange.newRatePct / 100, 0),
                  date: formatDate(pricing.scheduledGstChange.effectiveDate, i18n.language),
                })}
              </span>
              {s.gstScheduleIsPending && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void s.cancelScheduledGst().then((ok) => toast.push(t(ok ? K.toast.cancelled : K.toast.error), ok ? 'success' : 'error'))}
                >
                  {t(K.gst.cancelScheduled)}
                </Button>
              )}
            </div>
          )}
          <p className="t-xs t-muted px-3">{t(K.gst.externalNote)}</p>
        </div>
      </Card>

      <Card title={t(K.section.amc)} className="mb-4">
        <div className="stack gap-0 mt-2">
          {AMC_TIER_ORDER.map((tier) => {
            const amc = pricing.amcTiers.find((a) => a.tier === tier);
            if (!amc) return null;
            return (
              <ListRow
                key={tier}
                onClick={() => s.openAmcSheet(tier)}
                title={t(K.amcTierLabel[tier])}
                subtitle={t(K.amc.responseLabel, { hours: amc.responseTimeHours })}
                trailing={<span className="num t-sm t-semibold">{formatINR(amc.annualPrice)}/yr</span>}
              />
            );
          })}
        </div>
      </Card>

      {/* -------------------------------------------------- Base pricing sheet */}
      <Sheet
        open={s.driveTypeSheet !== null}
        onClose={s.closeDriveTypeSheet}
        title={s.driveTypeSheet ? t(K.basePricing.sheetTitle, { driveType: t(`driveType.${s.driveTypeSheet.driveType}`) }) : ''}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            loading={s.saving}
            onClick={() => void s.saveDriveTypeSheet().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.basePricing.save)}
          </Button>
        }
      >
        {s.driveTypeSheet && (
          <div className="stack gap-3">
            <div className="stack gap-1">
              <span className="label">{t(K.basePricing.baseLabel)}</span>
              <Input type="number" min={0} mono value={s.driveTypeSheet.baseDraft} onChange={(e) => s.setDriveTypeDraft({ baseDraft: e.target.value })} />
            </div>
            <div className="stack gap-1">
              <span className="label">{t(K.basePricing.perFloorLabelInput)}</span>
              <Input type="number" step="0.5" min={0} mono invalid={perFloorOutOfRange} value={s.driveTypeSheet.perFloorDraft} onChange={(e) => s.setDriveTypeDraft({ perFloorDraft: e.target.value })} />
              <span className={`t-xs ${perFloorOutOfRange ? 't-warning' : 't-muted'}`}>{t(perFloorOutOfRange ? K.basePricing.perFloorOutOfRange : K.basePricing.perFloorHint)}</span>
            </div>
          </div>
        )}
      </Sheet>

      {/* ---------------------------------------------------- Margin floor sheet */}
      <Sheet
        open={s.marginSheetOpen}
        onClose={s.closeMarginSheet}
        title={t(K.marginFloor.sheetTitle)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            variant={marginIsLowering ? 'danger' : 'primary'}
            disabled={!marginCanSave}
            loading={s.saving}
            onClick={() => void s.saveMarginSheet().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.marginFloor.save)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.marginFloor.label)}</span>
            <Input type="number" step="0.5" min={0} mono invalid={Number.isNaN(marginDraftNumber) || marginDraftNumber <= 0} value={s.marginDraft} onChange={(e) => s.setMarginDraft(e.target.value)} />
            {(Number.isNaN(marginDraftNumber) || marginDraftNumber <= 0) && <span className="t-xs t-error">{t(K.marginFloor.mustBePositive)}</span>}
          </div>
          <p className="t-xs t-warning row gap-1 items-start">
            <WarningCircle size={13} className="shrink-0 mt-1" />
            {t(K.marginFloor.riskWarning)}
          </p>
          {marginIsLowering && (
            <Checkbox checked={s.marginLoweringConfirmed} onChange={s.setMarginLoweringConfirmed} label={t(K.marginFloor.loweringConfirm)} />
          )}
        </div>
      </Sheet>

      {/* ------------------------------------------------------------ GST sheet */}
      <Sheet
        open={s.gstSheetOpen}
        onClose={s.closeGstSheet}
        title={t(K.gst.editSheetTitle)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            loading={s.saving}
            onClick={() => {
              const isFutureDate = s.gstDateDraft !== '' && new Date(s.gstDateDraft).getTime() > Date.now();
              void s.saveGstSheet().then((ok) => toast.push(t(ok ? (isFutureDate ? K.toast.scheduled : K.toast.saved) : K.toast.error), ok ? 'success' : 'error'));
            }}
          >
            {t(K.gst.save)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-xs t-muted">{t(K.gst.externalNote)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.gst.newRateLabel)}</span>
            <Input type="number" step="0.5" min={0} mono value={s.gstRateDraft} onChange={(e) => s.setGstRateDraft(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.gst.effectiveDateLabel)}</span>
            <Input type="date" value={s.gstDateDraft} onChange={(e) => s.setGstDateDraft(e.target.value)} />
            <span className="t-xs t-muted">{t(K.gst.effectiveDateHint)}</span>
          </div>
        </div>
      </Sheet>

      {/* ------------------------------------------------------------ AMC sheet */}
      <Sheet
        open={s.amcSheet !== null}
        onClose={s.closeAmcSheet}
        title={s.amcSheet ? t(K.amc.sheetTitle, { tier: t(K.amcTierLabel[s.amcSheet.tier]) }) : ''}
        closeLabel={t('action.close')}
        footer={
          <Button block loading={s.saving} onClick={() => void s.saveAmcSheet().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.amc.save)}
          </Button>
        }
      >
        {s.amcSheet && (
          <div className="stack gap-3">
            <div className="stack gap-1">
              <span className="label">{t(K.amc.priceLabel)}</span>
              <Input type="number" min={0} mono value={s.amcSheet.priceDraft} onChange={(e) => s.setAmcDraft({ priceDraft: e.target.value })} />
            </div>
            <div className="stack gap-1">
              <span className="label">{t(K.amc.responseHoursLabel)}</span>
              <Input type="number" min={1} mono value={s.amcSheet.responseDraft} onChange={(e) => s.setAmcDraft({ responseDraft: e.target.value })} />
            </div>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
