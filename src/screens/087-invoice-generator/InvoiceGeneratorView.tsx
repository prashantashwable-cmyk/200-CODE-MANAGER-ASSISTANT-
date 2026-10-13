import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IssuerBlock } from '@/features/brand/IssuerBlock';
import { Printer, Receipt, WarningCircle } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, EmptyState, ErrorState, Input, ListRow, LoadingState, Screen, ScreenHeader, Sheet, TextArea, formatDate, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { InvoiceType } from '@/data/types';
import { useInvoiceGenerator } from './useInvoiceGenerator';
import { INVOICE_GENERATOR_KEYS as K } from './invoice-generator.types';

const TYPE_TONE: Record<InvoiceType, BadgeTone> = {
  stage: 'neutral',
  final: 'accent',
  credit_note: 'warning',
  reissue: 'emerald',
};

export function InvoiceGeneratorView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useInvoiceGenerator();

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'not_found') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { view } = s;
  const selectedLine = view.invoices.find((l) => l.invoice.id === s.selectedInvoiceId) ?? null;
  const selected = selectedLine?.invoice ?? null;
  const canActOnSelected = selected && !selectedLine?.isSuperseded && selected.type !== 'credit_note';

  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={view.siteName} back={() => navigate(-1)} />

      <Card className="mb-4">
        <div className="row between mb-2">
          <span className="t-lg t-medium">{view.customerName}</span>
          {view.allStagesPaid && <Badge tone="success">{t(K.hero.allPaid)}</Badge>}
        </div>
        <span className="t-xs t-muted">{view.dealCode}</span>
        <div className="row between hairline-top mt-3">
          <span className="t-sm t-muted">{t(K.hero.agreedPrice)}</span>
          <span className="t-lg num t-medium">{formatINR(view.agreedPrice)}</span>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="t-md mb-2">{t(K.gstin.heading)}</h2>
        <div className="stack gap-2">
          <div className="row between">
            <span className="t-sm t-muted">{t(K.gstin.aiec)}</span>
            <span className="t-sm num">{view.aiecGstin}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.gstin.customer)}</span>
            <span className="t-sm num">{view.customerGstin ?? t(K.gstin.notSet)}</span>
          </div>
        </div>
        {s.isAdmin && (
          <div className="row gap-2 mt-3 hairline-top">
            <Input className="grow" placeholder={t(K.gstin.inputLabel)} value={s.gstinDraft} onChange={(e) => s.setGstinDraft(e.target.value.toUpperCase())} />
            <Button
              size="sm"
              variant="secondary"
              disabled={!s.gstinDraft.trim() || s.gstinDraft.trim() === view.customerGstin}
              loading={s.savingGstin}
              onClick={() => void s.saveGstin().then((ok) => toast.push(t(ok ? K.toast.gstinSaved : K.toast.error), ok ? 'success' : 'error'))}
            >
              {t(K.gstin.save)}
            </Button>
          </div>
        )}
      </Card>

      {s.isAdmin && !view.hasFinalInvoice && (
        <Card className="mb-4">
          <h2 className="t-md mb-2">{t(K.finalInvoice.heading)}</h2>
          <p className="t-sm t-muted mb-3">{t(K.finalInvoice.body)}</p>
          {!view.allStagesPaid && <p className="t-xs t-warning mb-2">{t(K.finalInvoice.notReady)}</p>}
          <Button size="sm" disabled={!view.allStagesPaid} loading={s.generatingFinal} onClick={() => void s.generateFinal().then((ok) => toast.push(t(ok ? K.toast.generated : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.finalInvoice.generate)}
          </Button>
        </Card>
      )}

      <h2 className="t-lg mb-2">{t(K.list.heading)}</h2>
      {view.invoices.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {view.invoices.map(({ invoice, isSuperseded }) => (
            <ListRow
              key={invoice.id}
              onClick={() => s.openInvoice(invoice.id)}
              leading={<Receipt size={22} className="t-emerald" />}
              title={invoice.code}
              subtitle={formatDate(invoice.issuedAt, i18n.language)}
              trailing={
                <div className="stack gap-1" style={{ alignItems: 'flex-end' }}>
                  <span className="t-sm num t-medium">{formatINR(invoice.totalAmount)}</span>
                  <div className="row gap-1">
                    <Badge tone={TYPE_TONE[invoice.type]}>{t(K.type[invoice.type])}</Badge>
                    {isSuperseded && <Badge tone="neutral">{t(K.list.superseded)}</Badge>}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      <Sheet open={!!selected} onClose={s.closeInvoice} title={selected?.code ?? ''} closeLabel={t('action.close')}>
        {selected && selectedLine && (
          <div className="stack gap-3">
            {selectedLine.isSuperseded && (
              <div className="row-top gap-2">
                <WarningCircle size={16} className="t-muted shrink-0" />
                <span className="t-xs t-muted">{t(K.detail.supersededNote)}</span>
              </div>
            )}
            {selected.type === 'credit_note' && (
              <div className="row-top gap-2">
                <WarningCircle size={16} className="t-warning shrink-0" />
                <span className="t-xs t-muted">{t(K.detail.referencesNote)}</span>
              </div>
            )}

            <p className="t-sm t-muted">
              {selected.type === 'stage' && selected.stage && t(K.detail.stageLine, { stage: t(`finance.paymentStage.${selected.stage}`) })}
              {selected.type === 'final' && t(K.detail.finalLine)}
              {selected.type === 'credit_note' && t(K.detail.creditNoteLine, { code: view.invoices.find((l) => l.invoice.id === selected.referencesInvoiceId)?.invoice.code ?? '' })}
              {selected.type === 'reissue' && t(K.detail.reissueLine, { code: view.invoices.find((l) => l.invoice.id === selected.supersedesInvoiceId)?.invoice.code ?? '' })}
            </p>

            <div className="stack gap-1">
              <span className="label">{t('brand.issuer.label')}</span>
              <IssuerBlock at={selected.issuedAt} />
            </div>

            <div className="stack gap-1">
              <span className="label">{t(K.detail.billedTo)}</span>
              <span className="t-sm t-medium">{selected.customerName}</span>
              <span className="t-xs t-muted">{selected.customerAddress}</span>
              {selected.customerGstin && <span className="t-xs t-muted">{t(K.detail.gstinLabel)}: {selected.customerGstin}</span>}
            </div>

            <div className="row between hairline-top">
              <span className="t-sm t-muted">{t(K.detail.issuedOn)}</span>
              <span className="t-sm">{formatDate(selected.issuedAt, i18n.language)}</span>
            </div>

            <div className="stack gap-2 hairline-top">
              <div className="row between">
                <span className="t-sm t-muted">{t(K.detail.taxableValue)}</span>
                <span className="t-sm num">{formatINR(selected.taxableValue)}</span>
              </div>
              <div className="row between">
                <span className="t-sm t-muted">{t(K.detail.gstAt, { percent: selected.gstPercent })}</span>
                <span className="t-sm num">{formatINR(selected.gstAmount)}</span>
              </div>
              <div className="row between hairline-top">
                <span className="t-sm t-medium">{t(K.detail.total)}</span>
                <span className="t-lg num t-medium">{formatINR(selected.totalAmount)}</span>
              </div>
            </div>

            <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>
              {t(K.detail.print)}
            </Button>

            {s.isAdmin && canActOnSelected && !s.creditNoteOpen && !s.reissueOpen && (
              <div className="row gap-2 hairline-top">
                <Button size="sm" variant="ghost" onClick={s.openCreditNote}>
                  {t(K.detail.issueCreditNote)}
                </Button>
                <Button size="sm" variant="ghost" onClick={s.openReissue}>
                  {t(K.detail.reissue)}
                </Button>
              </div>
            )}

            {s.creditNoteOpen && (
              <div className="stack gap-2 hairline-top">
                <p className="t-xs t-muted">{t(K.creditNoteSheet.hint)}</p>
                <span className="label">{t(K.creditNoteSheet.amountLabel)}</span>
                <Input type="number" mono value={s.creditAmount} onChange={(e) => s.setCreditAmount(e.target.value === '' ? '' : Number(e.target.value))} />
                <span className="label">{t(K.creditNoteSheet.reasonLabel)}</span>
                <TextArea value={s.creditReason} onChange={(e) => s.setCreditReason(e.target.value)} rows={3} />
                <Button
                  variant="secondary"
                  disabled={!s.creditReason.trim() || s.creditAmount === '' || s.creditAmount <= 0}
                  loading={s.submittingCredit}
                  onClick={() => void s.submitCreditNote().then((ok) => toast.push(t(ok ? K.toast.creditNoted : K.toast.error), ok ? 'success' : 'error'))}
                >
                  {t(K.creditNoteSheet.submit)}
                </Button>
              </div>
            )}

            {s.reissueOpen && (
              <div className="stack gap-2 hairline-top">
                <p className="t-xs t-muted">{t(K.reissueSheet.hint)}</p>
                <span className="label">{t(K.reissueSheet.reasonLabel)}</span>
                <TextArea value={s.reissueReason} onChange={(e) => s.setReissueReason(e.target.value)} rows={3} />
                <Button
                  variant="secondary"
                  disabled={!s.reissueReason.trim()}
                  loading={s.submittingReissue}
                  onClick={() => void s.submitReissue().then((ok) => toast.push(t(ok ? K.toast.reissued : K.toast.error), ok ? 'success' : 'error'))}
                >
                  {t(K.reissueSheet.submit)}
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
