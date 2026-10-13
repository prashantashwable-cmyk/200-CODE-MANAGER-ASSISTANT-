import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, IdentificationCard, Info, Warning } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Screen,
  ScreenHeader,
  Select,
  TextArea,
} from '@/design-system';
import { CaptureStepRail } from '@/features/leadCapture/CaptureStepRail';
import { isValidIndianMobile } from '@/features/onboarding/validators';
import { useCaptureContact } from './useCaptureContact';
import { CAPTURE_CONTACT_KEYS as K, CONTACT_ROLES } from './capture-contact.types';

/**
 * Screen 033 — Builder/Owner Details Capture. Real on-device OCR reads a
 * scanned business card via the phone's actual camera; every field it fills
 * stays fully editable, and phone number is checked live against existing
 * leads and customers as it's typed.
 */
export function CaptureContactView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useCaptureContact();
  const cardInputRef = useRef<HTMLInputElement>(null);

  return (
    <Screen width="narrow" className="pb-action-bar">
      <div className="mt-4">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      </div>
      <CaptureStepRail current="contact" />

      <Card className="mb-4">
        <h2 className="t-md t-semibold row gap-2">
          <IdentificationCard size={18} className="t-emerald" />
          {t(K.businessCard.heading)}
        </h2>
        <p className="t-sm t-muted mt-1">{t(K.businessCard.body)}</p>

        <input
          ref={cardInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void s.scanBusinessCard(file);
            e.target.value = '';
          }}
        />
        <div className="row gap-2 mt-3">
          <Button
            size="sm"
            variant="ghost"
            loading={s.scanningCard}
            onClick={() => cardInputRef.current?.click()}
          >
            {s.scanningCard ? t(K.businessCard.scanning) : t(K.businessCard.heading)}
          </Button>
          {s.cardApplied && (
            <Badge tone="success" dot>
              <CheckCircle size={12} />
              {t(K.businessCard.applied)}
            </Badge>
          )}
        </div>
        <p className="t-xs t-muted mt-2">{t(K.businessCard.reviewNote)}</p>
      </Card>

      <div className="stack gap-3">
        <Field
          label={t(K.field.name)}
          required
          error={s.fullName.length > 0 && s.fullName.trim().length < 2 ? t(K.invalid.name) : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="name"
              value={s.fullName}
              onChange={(e) => s.setFullName(e.target.value)}
            />
          )}
        </Field>

        {!s.noPhoneAvailable && (
          <Field
            label={t(K.field.phone)}
            hint={t(K.field.phoneHint)}
            required
            error={s.phone.length > 0 && !isValidIndianMobile(s.phone) ? t(K.invalid.phone) : undefined}
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
                value={s.phone}
                onChange={(e) => s.setPhone(e.target.value)}
              />
            )}
          </Field>
        )}

        {s.phoneCheck === 'checking' && <p className="t-xs t-muted">{t(K.phoneCheck.checking)}</p>}
        {s.phoneCheck === 'clear' && (
          <p className="t-xs t-success row gap-2">
            <CheckCircle size={13} />
            {t(K.phoneCheck.clear)}
          </p>
        )}
        {s.phoneCheck === 'duplicateLead' && (
          <Card>
            <p className="t-sm t-warning row gap-2">
              <Warning size={15} className="shrink-0" />
              {t(K.phoneCheck.duplicateLead, { name: s.matchedName })}
            </p>
          </Card>
        )}
        {s.phoneCheck === 'existingCustomer' && (
          <Card>
            <p className="t-sm t-accent row gap-2">
              <Info size={15} className="shrink-0" />
              {t(K.phoneCheck.existingCustomer, { name: s.matchedName })}
            </p>
          </Card>
        )}

        <Checkbox
          checked={s.noPhoneAvailable}
          onChange={(value) => {
            s.setNoPhoneAvailable(value);
            if (value) s.setPhone('');
          }}
          label={
            <span className="stack gap-1">
              <span>{t(K.noPhone.toggle)}</span>
              <span className="t-xs t-muted">{t(K.noPhone.hint)}</span>
            </span>
          }
        />

        <Field label={t(K.field.company)}>
          {({ id }) => (
            <Input id={id} value={s.company} onChange={(e) => s.setCompany(e.target.value)} />
          )}
        </Field>

        <Field label={t(K.field.role)}>
          {({ id }) => (
            <Select id={id} value={s.role} onChange={(e) => s.setRole(e.target.value as typeof s.role)}>
              {CONTACT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(K.role[role])}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t(K.field.note)} hint={t(K.field.noteHint)}>
          {({ id, describedBy }) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              value={s.note}
              onChange={(e) => s.setNote(e.target.value)}
            />
          )}
        </Field>

        <Card>
          <Checkbox
            checked={s.consent}
            onChange={s.setConsent}
            label={
              <span className="stack gap-1">
                <span>{t(K.consent.label)}</span>
                <span className="t-xs t-muted">{t(K.consent.hint)}</span>
              </span>
            }
          />
          {!s.consent && <p className="t-xs t-warning mt-2">{t(K.consent.required)}</p>}
        </Card>
      </div>

      <ActionBar>
        <Button variant="ghost" onClick={() => navigate('/surveyor/capture')}>
          {t('action.back')}
        </Button>
        <Badge tone="neutral">2 / 5</Badge>
        <Button className="grow" block disabled={!s.canContinue} onClick={s.continueToNext}>
          {t('action.next')}
        </Button>
      </ActionBar>
    </Screen>
  );
}
