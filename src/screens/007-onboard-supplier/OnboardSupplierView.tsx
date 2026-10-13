import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Info, Warning } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Field, Input, TextArea } from '@/design-system';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { WizardShell } from '@/features/onboarding/WizardShell';
import { isValidGstin, isValidIfsc, isValidIndianMobile, isValidPincode } from '@/features/onboarding/validators';
import {
  ACCEPTED_CATALOG_ATTR,
  ACCEPTED_CATALOG_EXTENSIONS,
  SUPPLIER_KEYS as K,
} from './onboard-supplier.types';
import { SUPPLIER_STEPS, useOnboardSupplier } from './useOnboardSupplier';

/**
 * Screen 007 — Supplier / manufacturer company KYC. Nothing here activates an
 * account: a supplier cannot receive a purchase order until an admin approves.
 */
export function OnboardSupplierView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useOnboardSupplier();
  const { draft, update, stepIndex } = s.wizard;

  return (
    <WizardShell
      title={t(K.title)}
      subtitle={t(K.subtitle)}
      steps={SUPPLIER_STEPS}
      stepStatuses={s.wizard.stepStatuses}
      stepIndex={stepIndex}
      goTo={s.wizard.goTo}
      restored={s.wizard.restored}
      daysSinceStarted={s.wizard.daysSinceStarted}
      discard={s.wizard.discard}
      status={s.wizard.status}
      isLastStep={s.wizard.isLastStep}
      isFirstStep={s.wizard.isFirstStep}
      canAdvance={s.wizard.canAdvance}
      canSubmit={s.wizard.canSubmit}
      next={s.wizard.next}
      back={s.wizard.back}
      onSubmit={() => void s.submit()}
    >
      {s.submitErrorKey && (
        <Card>
          <p className="t-sm t-error row gap-2">
            <Warning size={16} className="shrink-0" />
            {t(s.submitErrorKey)}
          </p>
        </Card>
      )}
      {s.payoutsBlocked && (
        <Card>
          <p className="t-sm t-warning row gap-2">
            <Warning size={16} className="shrink-0" />
            {t(K.bank.blocked)}
          </p>
        </Card>
      )}

      {stepIndex === 0 && (
        <>
          <Field
            label={t(K.field.companyName)}
            required
            error={
              draft.companyName.length > 0 && draft.companyName.trim().length < 3
                ? t(K.invalid.companyName)
                : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
              />
            )}
          </Field>

          <Field
            label={t(K.field.gstin)}
            hint={t(K.field.gstinHint)}
            required
            error={
              draft.gstin.length >= 15 && !isValidGstin(draft.gstin) ? t(K.invalid.gstin) : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                mono
                maxLength={15}
                value={draft.gstin}
                onChange={(e) =>
                  update({ gstin: e.target.value.toUpperCase().slice(0, 15), gstinCheck: 'notStarted' })
                }
              />
            )}
          </Field>

          <Card>
            <div className="row between gap-3">
              <span className="t-sm t-semibold grow">{t(K.gstin.verify)}</span>
              {draft.gstinCheck === 'matched' && <Badge tone="success" dot>{t(K.gstin.matched)}</Badge>}
              {draft.gstinCheck === 'lookupFailed' && (
                <Badge tone="warning" dot>{t('status.pending')}</Badge>
              )}
              {(draft.gstinCheck === 'mismatch' || draft.gstinCheck === 'duplicate') && (
                <Badge tone="error" dot>{t('status.rejected')}</Badge>
              )}
            </div>

            {draft.gstinCheck === 'lookupFailed' && (
              <p className="t-xs t-warning mt-2 row gap-2">
                <Info size={14} className="shrink-0" />
                {t(K.gstin.lookupFailed)}
              </p>
            )}
            {draft.gstinCheck === 'mismatch' && (
              <p className="t-xs t-error mt-2">{t(K.gstin.mismatch)}</p>
            )}
            {draft.gstinCheck === 'duplicate' && (
              <div className="stack gap-2 mt-2">
                <p className="t-xs t-error">{t(K.gstin.duplicate)}</p>
                <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>
                  {t(K.gstin.duplicateAction)}
                </Button>
              </div>
            )}

            <div className="mt-3">
              <Button
                size="sm"
                variant={draft.gstinCheck === 'matched' ? 'ghost' : 'primary'}
                loading={draft.gstinCheck === 'running'}
                disabled={!isValidGstin(draft.gstin)}
                onClick={() => void s.verifyGstin()}
              >
                {draft.gstinCheck === 'running' ? t(K.gstin.running) : t(K.gstin.verify)}
              </Button>
            </div>
          </Card>

          <Field label={t(K.field.registeredAddress)} required>
            {({ id }) => (
              <TextArea
                id={id}
                value={draft.registeredAddress}
                onChange={(e) => update({ registeredAddress: e.target.value })}
              />
            )}
          </Field>

          <div className="grid-2">
            <Field label={t(K.field.city)} required>
              {({ id }) => (
                <Input id={id} value={draft.city} onChange={(e) => update({ city: e.target.value })} />
              )}
            </Field>
            <Field
              label={t(K.field.pincode)}
              required
              error={
                draft.pincode.length >= 6 && !isValidPincode(draft.pincode)
                  ? t(K.invalid.pincode)
                  : undefined
              }
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  mono
                  inputMode="numeric"
                  maxLength={6}
                  value={draft.pincode}
                  onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                />
              )}
            </Field>
          </div>

          <Field label={t(K.field.signatoryName)} required>
            {({ id }) => (
              <Input
                id={id}
                value={draft.signatoryName}
                onChange={(e) => update({ signatoryName: e.target.value })}
              />
            )}
          </Field>
          <Field label={t(K.field.signatoryDesignation)}>
            {({ id }) => (
              <Input
                id={id}
                value={draft.signatoryDesignation}
                onChange={(e) => update({ signatoryDesignation: e.target.value })}
              />
            )}
          </Field>
          <Field
            label={t(K.field.signatoryPhone)}
            hint={t(K.field.signatoryPhoneHint)}
            required
            error={draft.signatoryPhone.length >= 10 && !isValidIndianMobile(draft.signatoryPhone) ? t(K.invalid.signatoryPhone) : undefined}
          >
            {({ id }) => (
              <Input
                id={id}
                type="tel"
                inputMode="numeric"
                value={draft.signatoryPhone}
                onChange={(e) => update({ signatoryPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            )}
          </Field>
        </>
      )}

      {stepIndex === 1 && (
        <>
          <div className="stack gap-1">
            <h2 className="t-md t-semibold">{t(K.catalog.heading)}</h2>
            <p className="t-sm t-muted">{t(K.catalog.body)}</p>
          </div>

          <DocumentSlot
            label={t(K.catalog.doc)}
            hint={t(K.catalog.formats, { formats: ACCEPTED_CATALOG_EXTENSIONS.join(', ') })}
            accept={ACCEPTED_CATALOG_ATTR}
            skipQualityCheck
            value={draft.catalogFile}
            onChange={(value) => update({ catalogFile: value })}
          />

          {draft.catalogFile && (
            <>
              <Field label={t(K.field.catalogRowCount)} hint={t(K.field.catalogRowCountHint)}>
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    mono
                    inputMode="numeric"
                    value={draft.catalogRowCount}
                    onChange={(e) =>
                      update({ catalogRowCount: e.target.value.replace(/\D/g, '').slice(0, 5) })
                    }
                  />
                )}
              </Field>
              <Card>
                <p className="t-xs t-muted row gap-2">
                  <Info size={14} className="shrink-0" />
                  {t(K.catalog.pendingReview)}
                </p>
              </Card>
            </>
          )}

          {!draft.catalogFile && <p className="t-xs t-muted">{t(K.catalog.skip)}</p>}
        </>
      )}

      {stepIndex === 2 && (
        <>
          <div className="stack gap-1">
            <h2 className="t-md t-semibold">{t(K.bank.heading)}</h2>
            <p className="t-sm t-muted">{t(K.bank.body)}</p>
          </div>

          <Field label={t(K.field.accountHolder)} required>
            {({ id }) => (
              <Input
                id={id}
                value={draft.accountHolder}
                onChange={(e) => update({ accountHolder: e.target.value })}
              />
            )}
          </Field>

          <Field
            label={t(K.field.accountNumber)}
            required
            error={
              draft.accountNumber.length > 0 && !/^\d{9,18}$/.test(draft.accountNumber)
                ? t(K.invalid.accountNumber)
                : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                mono
                inputMode="numeric"
                maxLength={18}
                value={draft.accountNumber}
                onChange={(e) =>
                  update({
                    accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18),
                    pennyDrop: 'notStarted',
                  })
                }
              />
            )}
          </Field>

          <Field
            label={t(K.field.ifsc)}
            required
            error={
              draft.ifsc.length >= 11 && !isValidIfsc(draft.ifsc) ? t(K.invalid.ifsc) : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                mono
                maxLength={11}
                value={draft.ifsc}
                onChange={(e) =>
                  update({ ifsc: e.target.value.toUpperCase().slice(0, 11), pennyDrop: 'notStarted' })
                }
              />
            )}
          </Field>

          <DocumentSlot
            label={t(K.bank.doc)}
            required
            value={draft.bankDoc}
            onChange={(value) => update({ bankDoc: value })}
          />

          {/* No bank-verification provider is connected, so nothing here claims the account was checked. */}
          <Card>
            <p className="t-sm t-semibold">{t(K.bank.verify)}</p>
            <p className="t-xs t-muted mt-2 row gap-2">
              <Info size={14} className="shrink-0" />
              {t(K.bank.notConnected)}
            </p>
          </Card>
        </>
      )}

      {stepIndex === 3 && (
        <>
          <h2 className="t-md t-semibold">{t(K.terms.heading)}</h2>

          <Card>
            <Checkbox
              checked={draft.slaAccepted}
              onChange={(value) => update({ slaAccepted: value })}
              label={
                <span className="stack gap-1">
                  <span className="t-semibold">{t(K.terms.sla)}</span>
                  <span className="t-xs t-muted">{t(K.terms.slaDetail)}</span>
                </span>
              }
            />
          </Card>

          <Card>
            <Checkbox
              checked={draft.paymentTermsAccepted}
              onChange={(value) => update({ paymentTermsAccepted: value })}
              label={
                <span className="stack gap-1">
                  <span className="t-semibold">{t(K.terms.payment)}</span>
                  <span className="t-xs t-muted">{t(K.terms.paymentDetail)}</span>
                </span>
              }
            />
          </Card>

          {/* The design system is explicit that the English contract stays the
              binding text; this says so rather than leaving it implied. */}
          <Card>
            <p className="t-xs t-muted">{t(K.terms.legalNote)}</p>
          </Card>

          <Card>
            <p className="t-xs t-muted">{t(K.poNote)}</p>
          </Card>

          {!(draft.slaAccepted && draft.paymentTermsAccepted) && (
            <p className="t-xs t-warning">{t(K.terms.required)}</p>
          )}
        </>
      )}
    </WizardShell>
  );
}
