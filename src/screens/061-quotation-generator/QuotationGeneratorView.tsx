import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChartBar, ClockCounterClockwise, FileText, Percent, Receipt, SlidersHorizontal, Stack, WarningCircle } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { QuotationStatus } from '@/data/types';
import { useQuotationGenerator } from './useQuotationGenerator';
import { DRIVE_TYPES, FINISH_TIERS, QUOTATION_GENERATOR_KEYS as K, statusBadgeKey } from './quotation-generator.types';

const STATUS_TONE: Record<QuotationStatus, BadgeTone> = {
  draft: 'neutral',
  sent: 'accent',
  viewed: 'accent',
  accepted: 'success',
  expired: 'error',
  superseded: 'neutral',
  change_requested: 'warning',
};

export function QuotationGeneratorView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useQuotationGenerator();

  useEffect(() => {
    if (s.generatedQuotation) {
      const id = s.generatedQuotation.id;
      s.clearGenerated();
      navigate(`/admin/quotes/${id}/cost`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.generatedQuotation]);

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

  const editingLead = s.editingQuotation ? s.leads.find((l) => l.id === s.editingQuotation?.leadId) : undefined;

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <h2 className="t-lg mb-2">{t(K.newQuote.heading)}</h2>
      <Card className="mb-4">
        <div className="stack gap-3">
          <Select value={s.pickedLeadId} onChange={(e) => s.setPickedLeadId(e.target.value)}>
            <option value="">{t(K.newQuote.pickLead)}</option>
            {s.pickableLeads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.siteName} — {lead.contactName}
              </option>
            ))}
          </Select>
          <Button icon={<Receipt size={16} />} disabled={!s.pickedLeadId} onClick={() => void s.startNewQuote().then((ok) => !ok && toast.push(t(K.toast.error), 'error'))}>
            {t(K.newQuote.start)}
          </Button>
        </div>
      </Card>

      <h2 className="t-lg mb-2">{t(K.listHeading)}</h2>
      {s.quotations.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.quotations.map((q) => {
            const lead = s.leads.find((l) => l.id === q.leadId);
            const clickable = q.status === 'draft';
            return (
              <Card key={q.id} onClick={clickable ? () => s.openEdit(q) : undefined}>
                <div className="row between items-start gap-3">
                  <div className="stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-sm t-semibold truncate">{lead?.siteName ?? q.code}</span>
                    <span className="t-xs t-muted truncate">
                      {q.code} · v{q.version} · {t(K.driveType[q.driveType])} · {t(K.finishTier[q.finishTier])}
                    </span>
                  </div>
                  <Badge tone={STATUS_TONE[q.status]}>{t(statusBadgeKey(q.status))}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="t-lg mb-3 mt-4">{t(K.quickLinks.heading)}</h2>
      <div className="grid-auto mb-4" style={{ ['--min' as string]: '160px' }}>
        <Card onClick={() => navigate('/admin/quotes/templates')}>
          <div className="row gap-3">
            <FileText size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.templates)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/quotes/compare')}>
          <div className="row gap-3">
            <Stack size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.compare)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/quotes/history')}>
          <div className="row gap-3">
            <ClockCounterClockwise size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.history)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/quotes/discounts')}>
          <div className="row gap-3">
            <Percent size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.discounts)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/quotes/analytics')}>
          <div className="row gap-3">
            <ChartBar size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.analytics)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/quotes/pricing')}>
          <div className="row gap-3">
            <SlidersHorizontal size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.pricing)}</span>
          </div>
        </Card>
      </div>

      <Sheet
        open={!!s.editingQuotation}
        onClose={s.closeEdit}
        title={editingLead?.siteName ?? t(K.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block loading={s.saving} disabled={!s.canSave} onClick={() => void s.saveAndGenerate().then((ok) => !ok && toast.push(t(K.toast.error), 'error'))}>
            {t(K.form.generate)}
          </Button>
        }
      >
        <div className="stack gap-4">
          {editingLead?.spec && (
            <p className="t-xs t-muted row gap-1 items-center">
              <WarningCircle size={13} />
              {t(K.form.sourcedFromSurvey)}
            </p>
          )}

          <div className="stack gap-1">
            <span className="label">{t(K.form.driveTypeLabel)}</span>
            <Select value={s.draft.driveType} onChange={(e) => s.setDraftField('driveType', e.target.value as (typeof DRIVE_TYPES)[number])}>
              {DRIVE_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {t(K.driveType[dt])}
                </option>
              ))}
            </Select>
            <span className="t-xs t-muted">{t(K.form.driveTypeHint)}</span>
          </div>

          <div className="row gap-3">
            <div className="stack gap-1 grow">
              <span className="label">{t(K.form.capacityPersonsLabel)}</span>
              <Input type="number" min={1} value={s.draft.capacityPersons} onChange={(e) => s.setDraftField('capacityPersons', Number(e.target.value))} />
            </div>
            <div className="stack gap-1 grow">
              <span className="label">{t(K.form.capacityKgLabel)}</span>
              <Input type="number" min={0} value={s.draft.capacityKg} onChange={(e) => s.setDraftField('capacityKg', Number(e.target.value))} />
            </div>
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.form.finishTierLabel)}</span>
            <Select value={s.draft.finishTier} onChange={(e) => s.setDraftField('finishTier', e.target.value as (typeof FINISH_TIERS)[number])}>
              {FINISH_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {t(K.finishTier[tier])}
                </option>
              ))}
            </Select>
          </div>

          <div className="row gap-3">
            <div className="stack gap-1 grow">
              <span className="label">{t(K.form.stopsCountLabel)}</span>
              <Input type="number" min={2} value={s.draft.stopsCount} onChange={(e) => s.setDraftField('stopsCount', Number(e.target.value))} />
            </div>
            <div className="stack gap-1 grow">
              <span className="label">{t(K.form.travelHeightLabel)}</span>
              <Input type="number" min={0} step="0.1" value={s.draft.travelHeightM} onChange={(e) => s.setDraftField('travelHeightM', Number(e.target.value))} />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={s.resuggestFromLead}>
            {t(K.form.reSuggest)}
          </Button>

          {s.isSpecializedReview && (
            <p className="t-xs t-warning row gap-1 items-center">
              <WarningCircle size={13} />
              {t(K.form.specializedReviewWarning)}
            </p>
          )}

          <div className="stack gap-1">
            <span className="label">{t(K.form.overrideNoteLabel)}</span>
            <TextArea rows={2} value={s.draft.specOverrideNote ?? ''} onChange={(e) => s.setDraftField('specOverrideNote', e.target.value)} />
            <span className="t-xs t-muted">{t(K.form.overrideNoteHint)}</span>
          </div>

          <Checkbox checked={s.draft.customConfiguration} onChange={(v) => s.setDraftField('customConfiguration', v)} label={t(K.form.customConfigToggle)} />
          {s.draft.customConfiguration && <p className="t-xs t-muted">{t(K.form.customConfigHint)}</p>}

          {!s.canSave && <p className="t-xs t-error">{t(K.form.missingRequired)}</p>}
        </div>
      </Sheet>
    </Screen>
  );
}
