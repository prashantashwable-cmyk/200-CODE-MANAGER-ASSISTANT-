import { useTranslation } from 'react-i18next';
import { ShieldCheck, Warning } from '@phosphor-icons/react';
import { Badge, Card, Checkbox, Field, Input, Toggle } from '@/design-system';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { WizardShell } from '@/features/onboarding/WizardShell';
import { isValidIndianMobile } from '@/features/onboarding/validators';
import {
  SKILL_IDS,
  SOP_ITEMS,
  TECHNICIAN_KEYS as K,
} from './onboard-technician.types';
import { TECHNICIAN_STEPS, useOnboardTechnician } from './useOnboardTechnician';

/**
 * Screen 006 — Technician onboarding. Adds what a surveyor does not need:
 * provable skills, a live liability policy, and a signed SOP acknowledgement.
 */
export function OnboardTechnicianView() {
  const { t } = useTranslation();
  const s = useOnboardTechnician();
  const { draft, update, stepIndex } = s.wizard;

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <WizardShell
      title={t(K.title)}
      subtitle={t(K.subtitle)}
      steps={TECHNICIAN_STEPS}
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
              <Input id={id} value={draft.city} onChange={(e) => update({ city: e.target.value })} />
            )}
          </Field>

          <Field label={t(K.field.years)} hint={t(K.field.yearsHint)}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                mono
                inputMode="numeric"
                maxLength={2}
                value={draft.yearsExperience}
                onChange={(e) =>
                  update({ yearsExperience: e.target.value.replace(/\D/g, '').slice(0, 2) })
                }
              />
            )}
          </Field>
        </>
      )}

      {stepIndex === 1 && (
        <>
          <div className="stack gap-1">
            <h2 className="t-md t-semibold">{t(K.skill.heading)}</h2>
            <p className="t-sm t-muted">{t(K.skill.body)}</p>
          </div>

          {SKILL_IDS.map((id) => {
            const claim = draft.skills[id];
            return (
              <Card key={id} selected={claim.claimed}>
                <Toggle
                  checked={claim.claimed}
                  onChange={() => s.toggleSkill(id)}
                  label={t(K.skill.name[id])}
                />
                {claim.claimed && (
                  <div className="stack gap-3 mt-3">
                    <DocumentSlot
                      label={t(K.skill.certificate)}
                      value={claim.certificate}
                      onChange={(value) => s.setSkillCertificate(id, value)}
                    />
                    {!claim.certificate && (
                      <p className="t-xs t-warning row gap-2">
                        <Warning size={14} className="shrink-0" />
                        {t(K.skill.unverifiedNote)}
                      </p>
                    )}
                    {claim.certificate && (
                      <Checkbox
                        checked={claim.needsManualReview}
                        onChange={(value) => s.toggleManualReview(id, value)}
                        label={
                          <span className="stack gap-1">
                            <span>{t(K.skill.manualReview)}</span>
                            <span className="t-xs t-muted">{t(K.skill.manualReviewHint)}</span>
                          </span>
                        }
                      />
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {s.verified.length === 0 && s.unverified.length === 0 && (
            <p className="t-xs t-warning">{t(K.skill.required)}</p>
          )}
        </>
      )}

      {stepIndex === 2 && (
        <>
          <div className="stack gap-1">
            <h2 className="t-md t-semibold">{t(K.insurance.heading)}</h2>
            <p className="t-sm t-muted">{t(K.insurance.body)}</p>
          </div>

          <div className="row gap-2">
            <Badge
              tone={
                s.insurance === 'valid'
                  ? 'success'
                  : s.insurance === 'expiringSoon'
                    ? 'warning'
                    : 'error'
              }
              dot
            >
              {t(K.insurance.status[s.insurance])}
            </Badge>
          </div>

          <DocumentSlot
            label={t(K.insurance.doc)}
            required
            value={draft.insuranceDoc}
            onChange={(value) => update({ insuranceDoc: value })}
          />

          <Field
            label={t(K.field.expiry)}
            hint={t(K.field.expiryHint)}
            required
            error={
              draft.insuranceExpiry && draft.insuranceExpiry <= todayIso
                ? t(K.invalid.expiryPast)
                : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="date"
                value={draft.insuranceExpiry}
                onChange={(e) => update({ insuranceExpiry: e.target.value })}
              />
            )}
          </Field>

          {s.insurance === 'expired' && (
            <Card>
              <p className="t-sm t-error row gap-2">
                <Warning size={16} className="shrink-0" />
                {t(K.insurance.expiredBlock)}
              </p>
              <p className="t-xs t-muted mt-2">{t(K.insurance.inProgressNote)}</p>
            </Card>
          )}
        </>
      )}

      {stepIndex === 3 && (
        <>
          <div className="stack gap-1">
            <h2 className="t-md t-semibold row gap-2">
              <ShieldCheck size={20} className="t-emerald" />
              {t(K.sop.heading)}
            </h2>
            <p className="t-sm t-muted">{t(K.sop.body)}</p>
          </div>

          <Card>
            <div className="stack gap-4">
              {SOP_ITEMS.map((item) => (
                <Checkbox
                  key={item}
                  checked={draft.sopAcknowledged[item]}
                  onChange={(value) => s.toggleSop(item, value)}
                  label={t(K.sop.item[item])}
                />
              ))}
            </div>
          </Card>

          {!SOP_ITEMS.every((item) => draft.sopAcknowledged[item]) && (
            <p className="t-xs t-warning">{t(K.sop.required)}</p>
          )}
        </>
      )}
    </WizardShell>
  );
}
