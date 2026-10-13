import { useTranslation } from 'react-i18next';
import { IssuerBlock } from '@/features/brand/IssuerBlock';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Eye } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  StatTile,
  TextArea,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import { useQuotationPreview } from './useQuotationPreview';
import { QUOTATION_PREVIEW_KEYS as K } from './quotation-preview.types';

export function QuotationPreviewView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useQuotationPreview();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="block" />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.view) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const view = s.view;

  if (view.effectiveStatus === 'expired') {
    return (
      <Screen>
        <ScreenHeader title={view.leadSiteName} subtitle={view.code} />
        <div className="ds-state">
          <Clock size={26} className="t-warning" />
          <span className="ds-state__title">{t(K.expiredState.title)}</span>
          <p className="ds-state__body">{t(K.expiredState.body)}</p>
          <Button
            loading={s.requoting}
            onClick={() =>
              void s.requestNewQuote().then((newId) => {
                if (newId) {
                  toast.push(t(K.toast.requoted), 'success');
                  navigate(`/admin/quotes/${newId}/cost`);
                } else {
                  toast.push(t(K.toast.error), 'error');
                }
              })
            }
          >
            {t(K.expiredState.requote)}
          </Button>
        </div>
      </Screen>
    );
  }

  if (view.effectiveStatus === 'accepted') {
    return (
      <Screen>
        <ScreenHeader title={view.leadSiteName} subtitle={view.code} />
        <div className="ds-state">
          <CheckCircle size={26} className="t-success" weight="fill" />
          <span className="ds-state__title">{t(K.acceptedState.title)}</span>
          <p className="ds-state__body">{t(K.acceptedState.body)}</p>
        </div>
      </Screen>
    );
  }

  if (view.effectiveStatus === 'superseded') {
    return (
      <Screen>
        <ScreenHeader title={view.leadSiteName} subtitle={view.code} />
        <div className="ds-state">
          <span className="ds-state__title">{t(K.supersededState.title)}</span>
          <p className="ds-state__body">{t(K.supersededState.body)}</p>
        </div>
      </Screen>
    );
  }

  const viewTrackingLabel = view.viewedAt
    ? t(K.viewTracking.viewed, { date: formatDate(view.viewedAt, i18n.language) })
    : view.sentAt
      ? t(K.viewTracking.sentNotViewed)
      : t(K.viewTracking.notSent);

  return (
    <Screen>
      <ScreenHeader title={view.leadSiteName} subtitle={view.code} action={<Badge tone="accent">{t(`quotationStatus.${view.effectiveStatus}`)}</Badge>} />

      <Card className="mb-4">
        <IssuerBlock at={view.sentAt ?? null} />
      </Card>

      <Card className="mb-4">
        <StatTile label={t(K.finalPriceLabel)} value={<span className="num">{formatINR(view.finalPrice)}</span>} large caption={t(K.gstInclusiveNote, { pct: view.gstPercent })} />
      </Card>

      <Card className="mb-4">
        <p className="t-sm">
          {t(K.configSummary, {
            finish: t(`finishTier.${view.finishTier}`),
            drive: t(`driveType.${view.driveType}`),
            capacity: view.capacityPersons,
            stops: view.stopsCount,
          })}
        </p>
      </Card>

      {view.validityDate && (
        <p className="t-sm t-muted mb-2">{t(K.validUntil, { date: formatDate(view.validityDate, i18n.language) })}</p>
      )}

      <p className="t-xs t-muted row gap-1 items-center mb-4">
        <Eye size={13} />
        {viewTrackingLabel}
      </p>

      <Sheet
        open={s.changeSheetOpen}
        onClose={s.closeChangeSheet}
        title={t(K.changeRequestSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!s.changeNote.trim()}
            loading={s.submittingChange}
            onClick={() => void s.submitChangeRequest().then((ok) => toast.push(t(ok ? K.toast.changesRequested : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.changeRequestSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-2">
          <span className="label">{t(K.changeRequestSheet.noteLabel)}</span>
          <TextArea rows={3} value={s.changeNote} onChange={(e) => s.setChangeNote(e.target.value)} />
          {!s.changeNote.trim() && <span className="t-xs t-error">{t(K.changeRequestSheet.noteRequired)}</span>}
        </div>
      </Sheet>

      <ActionBar>
        <div className="stack gap-2">
          <Button block variant="secondary" onClick={() => navigate(`/admin/quotes/${view.id}/send`)}>
            {t(view.effectiveStatus === 'draft' || view.effectiveStatus === 'change_requested' ? K.actions.send : K.actions.deliveryStatus)}
          </Button>
          <Button block loading={s.accepting} onClick={() => void s.accept().then((ok) => toast.push(t(ok ? K.toast.accepted : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.actions.accept)}
          </Button>
          <Button block variant="ghost" onClick={s.openChangeSheet}>
            {t(K.actions.requestChanges)}
          </Button>
        </div>
      </ActionBar>
    </Screen>
  );
}
