import { useTranslation } from 'react-i18next';
import { Info } from '@phosphor-icons/react';
import { Button, Card, ErrorState, Input, LoadingState, Screen, ScreenHeader, Sheet, TextArea, formatDate, useToast } from '@/design-system';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import { useQuotationTemplate } from './useQuotationTemplate';
import { OVERRIDE_STATE, QUOTATION_TEMPLATE_KEYS as K } from './quotation-template.types';

export function QuotationTemplateView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useQuotationTemplate();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
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

  const validUntilPreview = new Date(Date.now() + s.draft.validityPeriodDays * 86_400_000).toISOString();

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="stack gap-2 mb-4">
        {s.templates.map((template) => (
          <Card key={template.id} onClick={() => s.openEdit(template)}>
            <div className="row between items-start gap-3">
              <div className="stack gap-1">
                <span className="t-sm t-semibold">{template.name}</span>
                <span className="t-xs t-muted">{t(K.variant[template.variant])}</span>
              </div>
              <div className="stack gap-1" style={{ textAlign: 'right' }}>
                <span className="t-xs t-muted">{t(K.listRow.version, { version: template.version })}</span>
                <span className="t-xs t-muted">{t(K.listRow.validity, { days: template.validityPeriodDays })}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet
        open={!!s.editingTemplate}
        onClose={s.closeEdit}
        title={s.editingTemplate?.name ?? ''}
        closeLabel={t('action.close')}
        footer={
          <Button block loading={s.saving} onClick={() => void s.save().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.form.save)}
          </Button>
        }
      >
        <div className="stack gap-4">
          <p className="t-xs t-muted row gap-1 items-center">
            <Info size={13} />
            {t(K.form.openQuotesNote)}
          </p>

          <div>
            <h3 className="t-sm t-semibold mb-2">{t(K.form.logoHeading)}</h3>
            <DocumentSlot
              label={t(K.form.logoLabel)}
              hint={t(K.form.logoHint)}
              value={s.draft.logoAssetUrl ? { fileName: 'logo', capturedAt: '', previewUrl: s.draft.logoAssetUrl } : null}
              onChange={(v: DocumentSlotValue | null) => s.setDraftField('logoAssetUrl', v?.previewUrl)}
            />
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.form.taglineLabel)}</span>
            <Input value={s.draft.footerTagline} onChange={(e) => s.setDraftField('footerTagline', e.target.value)} />
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.form.validityLabel)}</span>
            <Input type="number" min={1} value={s.draft.validityPeriodDays} onChange={(e) => s.setDraftField('validityPeriodDays', Number(e.target.value))} />
            <span className="t-xs t-muted">{t(K.form.validityHint)}</span>
          </div>

          <div>
            <h3 className="t-sm t-semibold mb-2">{t(K.form.boilerplateHeading)}</h3>
            <div className="stack gap-3">
              <div className="stack gap-1">
                <span className="label">{t(K.form.nationalLabel)}</span>
                <TextArea rows={4} value={s.draft.legalBoilerplate} onChange={(e) => s.setDraftField('legalBoilerplate', e.target.value)} />
              </div>
              <div className="stack gap-1">
                <span className="label">{t(K.form.stateOverrideLabel, { state: OVERRIDE_STATE })}</span>
                <TextArea rows={3} value={s.draft.stateOverrideText} onChange={(e) => s.setDraftField('stateOverrideText', e.target.value)} />
                <span className="t-xs t-muted">{t(K.form.stateOverrideHint)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="t-sm t-semibold mb-2">{t(K.preview.heading)}</h3>
            <Card>
              <div className="stack gap-2">
                <p className="t-xs t-muted">{t(K.preview.validUntil, { date: formatDate(validUntilPreview, i18n.language) })}</p>
                <p className="t-sm">{s.draft.legalBoilerplate}</p>
                {s.draft.stateOverrideText && <p className="t-sm">{s.draft.stateOverrideText}</p>}
                <p className="t-xs t-muted hairline-top pt-2">{s.draft.footerTagline}</p>
              </div>
            </Card>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
