import { useTranslation } from 'react-i18next';
import { CheckCircle, Warning, Info } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Toggle,
} from '@/design-system';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { WizardShell } from '@/features/onboarding/WizardShell';
import {
  isValidAadhaar,
  isValidIfsc,
  isValidIndianMobile,
  isValidPan,
  maskAadhaar,
} from '@/features/onboarding/validators';
import { SURVEYOR_KEYS as K } from './onboard-surveyor.types';
import { SURVEYOR_STEPS, useOnboardSurveyor } from './useOnboardSurveyor';

/**
 * Screen 005 — Surveyor onboarding. Four steps, camera-first, phone-only:
 * personal details → ID proof → bank details for payouts → area preference.
 */
export function OnboardSurveyorView() {
  const { t } = useTranslation();
  const s = useOnboardSurveyor();
  const { draft, update, stepIndex } = s.wizard;

  return (
    <WizardShell
      title={t(K.title)}
      subtitle={t(K.subtitle)}
      steps={SURVEYOR_STEPS}
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
      errorKey={s.submitError}
    >
      {/* A failed penny-drop follows the applicant through the rest of the
          wizard — it does not block progress, it blocks money. */}
      {s.payoutsBlocked && (
        <Card>
          <p className="t-sm t-warning row gap-2">
            <Warning size={16} className="shrink-0" />
            {t(K.penny.blockedBanner)}
          </p>
        </Card>
      )}

      {stepIndex === 0 && (
        <>
          <Field
            label={t(K.field.fullName)}
            required
            error={
              draft.fullName.length > 0 && draft.fullName.trim().length < 3
                ? t(K.invalid.fullName)
                : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                autoComplete="name"
                value={draft.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
              />
            )}
          </Field>

          <Field
            label={t(K.field.phone)}
            required
            error={
              draft.phone.length > 0 && !isValidIndianMobile(draft.phone)
                ? t(K.invalid.phone)
                : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                mono
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={draft.phone}
                onChange={(e) => update({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            )}
          </Field>

          <Field label={t(K.field.city)} required>
            {({ id }) => (
              <Input
                id={id}
                value={draft.city}
                onChange={(e) => update({ city: e.target.value })}
              />
            )}
          </Field>
        </>
      )}

      {stepIndex === 1 && (
        <>
          <p className="t-xs t-muted">{t(K.identityNote)}</p>

          <Field
            label={t(K.field.aadhaar)}
            hint={t(K.field.aadhaarHint)}
            error={
              draft.aadhaarNumber.length >= 12 && !isValidAadhaar(draft.aadhaarNumber)
                ? t(K.invalid.aadhaar)
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
                maxLength={12}
                value={draft.aadhaarNumber}
                onChange={(e) =>
                  update({ aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
                }
              />
            )}
          </Field>
          {isValidAadhaar(draft.aadhaarNumber) && (
            <span className="row gap-2 t-xs t-success">
              <CheckCircle size={14} weight="fill" />
              <span className="num">{maskAadhaar(draft.aadhaarNumber)}</span>
            </span>
          )}

          <DocumentSlot
            label={t(K.doc.aadhaar)}
            hint={t(K.doc.aadhaarHint)}
            value={draft.aadhaarDoc}
            onChange={(value) => update({ aadhaarDoc: value })}
          />

          <Field
            label={t(K.field.pan)}
            error={
              draft.panNumber.length >= 10 && !isValidPan(draft.panNumber)
                ? t(K.invalid.pan)
                : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                mono
                maxLength={10}
                value={draft.panNumber}
                onChange={(e) => update({ panNumber: e.target.value.toUpperCase().slice(0, 10) })}
              />
            )}
          </Field>

          <DocumentSlot
            label={t(K.doc.pan)}
            value={draft.panDoc}
            onChange={(value) => update({ panDoc: value })}
          />
        </>
      )}

      {stepIndex === 2 && (
        <>
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
            label={t(K.doc.bank)}
            hint={t(K.doc.bankHint)}
            required
            value={draft.bankDoc}
            onChange={(value) => update({ bankDoc: value })}
          />

          {/* No bank-verification provider is connected, so nothing here claims the account was checked. */}
          <Card>
            <p className="t-sm t-semibold">{t(K.penny.explain)}</p>
            <p className="t-xs t-muted mt-2 row gap-2">
              <Info size={14} className="shrink-0" />
              {t(K.penny.notConnected)}
            </p>
          </Card>
        </>
      )}

      {stepIndex === 3 && (
        <>
          <div className="stack gap-1">
            <h2 className="t-md t-semibold">{t(K.area.heading)}</h2>
            <p className="t-sm t-muted">{t(K.area.body)}</p>
          </div>

          {s.zonesStatus === 'loading' && <LoadingState label={t(K.area.loading)} variant="cards" rows={3} />}

          {s.zonesStatus === 'error' && (
            <ErrorState
              title={t('state.error.title')}
              body={t(K.area.error)}
              retryLabel={t('action.retry')}
              onRetry={() => void s.reloadZones()}
            />
          )}

          {s.zonesStatus === 'empty' && <Card body={t(K.area.empty)} />}

          {s.zonesStatus === 'ready' && (
            <div className="row wrap gap-2">
              {s.zones.map((zone) => (
                <Chip
                  key={zone.id}
                  pressed={draft.preferredZoneIds.includes(zone.id)}
                  onClick={() => s.toggleZone(zone.id)}
                >
                  {zone.name} · {t(K.area.leadCount, { count: zone.leadCount })}
                </Chip>
              ))}
            </div>
          )}

          {draft.preferredZoneIds.length === 0 && s.zonesStatus === 'ready' && (
            <p className="t-xs t-warning">{t(K.area.required)}</p>
          )}

          <Card>
            <Toggle
              checked={draft.twoWheelerOwned}
              onChange={(value) => update({ twoWheelerOwned: value })}
              label={t(K.field.twoWheeler)}
              description={t(K.field.twoWheelerHint)}
            />
          </Card>
        </>
      )}
    </WizardShell>
  );
}
