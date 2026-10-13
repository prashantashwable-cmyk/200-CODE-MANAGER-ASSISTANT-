import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Info, Warning } from '@phosphor-icons/react';
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
  Tabs,
  TextArea,
} from '@/design-system';
import { CaptureStepRail } from '@/features/leadCapture/CaptureStepRail';
import { useCaptureSpec } from './useCaptureSpec';
import { CAPTURE_SPEC_KEYS as K, CONSTRUCTION_STAGES, USAGE_TYPES } from './capture-spec.types';

/**
 * Screen 034 — Building Specification Capture. Every field here feeds the
 * Auto-Quotation Engine's base pricing, so floors and usage are required —
 * but shaft dimensions stay an explicit estimate, never a final measurement.
 */
export function CaptureSpecView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useCaptureSpec();

  return (
    <Screen width="narrow" className="pb-action-bar">
      <div className="mt-4">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      </div>
      <CaptureStepRail current="spec" />

      <div className="stack gap-4">
        <Field label={t(K.field.usage)} required>
          {() => (
            <Tabs
              label={t(K.field.usage)}
              value={s.usage}
              onChange={(id) => s.setUsage(id as typeof s.usage)}
              items={USAGE_TYPES.map((u) => ({ id: u, label: t(K.usage[u]) }))}
            />
          )}
        </Field>

        <Checkbox
          checked={s.mixedUse}
          onChange={s.setMixedUse}
          label={t(K.field.mixedUseToggle)}
        />

        <div className="grid-2 gap-3">
          <Field
            label={t(K.field.floors)}
            required
            error={s.floors.length > 0 && Number(s.floors) === 0 ? t(K.invalid.floors) : undefined}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                mono
                inputMode="numeric"
                value={s.floors}
                onChange={(e) => s.setFloors(e.target.value)}
              />
            )}
          </Field>
          <Field label={t(K.field.basements)}>
            {({ id }) => (
              <Input
                id={id}
                mono
                inputMode="numeric"
                value={s.basements}
                onChange={(e) => s.setBasements(e.target.value.replace(/\D/g, '').slice(0, 2))}
              />
            )}
          </Field>
        </div>

        {s.isSpecialized && (
          <Card>
            <p className="t-sm t-accent row gap-2">
              <Info size={16} className="shrink-0" />
              {t(K.specializedFlag)}
            </p>
          </Card>
        )}

        <Field label={t(K.field.stage)} required>
          {({ id }) => (
            <Select id={id} value={s.stage} onChange={(e) => s.setStage(e.target.value as typeof s.stage)}>
              {CONSTRUCTION_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {t(K.stage[stage])}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <p className="t-xs t-muted">{t(K.stageNote)}</p>

        <div className="grid-2 gap-3">
          <Field
            label={t(K.field.capacity)}
            hint={t(K.field.capacityHint)}
            required
            error={s.capacity.length > 0 && Number(s.capacity) === 0 ? t(K.invalid.capacity) : undefined}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                mono
                inputMode="numeric"
                value={s.capacity}
                onChange={(e) => s.setCapacity(e.target.value)}
              />
            )}
          </Field>
          <Field label={t(K.field.speed)}>
            {({ id }) => (
              <Input
                id={id}
                mono
                inputMode="decimal"
                value={s.speed}
                onChange={(e) => s.setSpeed(e.target.value.replace(/[^\d.]/g, ''))}
              />
            )}
          </Field>
        </div>
        {s.capacity && <p className="t-xs t-muted num">{s.capacityKg} kg</p>}

        <div className="grid-2 gap-3">
          <Field label={t(K.field.shaftWidth)}>
            {({ id }) => (
              <Input
                id={id}
                mono
                inputMode="numeric"
                disabled={s.shaftNotVisible}
                value={s.shaftWidth}
                onChange={(e) => s.setShaftWidth(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            )}
          </Field>
          <Field label={t(K.field.shaftDepth)}>
            {({ id }) => (
              <Input
                id={id}
                mono
                inputMode="numeric"
                disabled={s.shaftNotVisible}
                value={s.shaftDepth}
                onChange={(e) => s.setShaftDepth(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            )}
          </Field>
        </div>
        <Checkbox
          checked={s.shaftNotVisible}
          onChange={(value) => {
            s.setShaftNotVisible(value);
            if (value) {
              s.setShaftWidth('');
              s.setShaftDepth('');
            }
          }}
          label={t(K.field.shaftNotVisible)}
        />
        {!s.shaftNotVisible && (s.shaftWidth || s.shaftDepth) && (
          <p className="t-xs t-warning row gap-2">
            <Warning size={13} className="shrink-0" />
            {t(K.estimateNote)}
          </p>
        )}

        <Field label={t(K.field.notes)} hint={t(K.field.notesHint)}>
          {({ id, describedBy }) => (
            <TextArea id={id} aria-describedby={describedBy} value={s.notes} onChange={(e) => s.setNotes(e.target.value)} />
          )}
        </Field>

        <p className="t-xs t-muted">{t(K.requiredNote)}</p>
      </div>

      <ActionBar>
        <Button variant="ghost" onClick={() => navigate('/surveyor/capture/contact')}>
          {t('action.back')}
        </Button>
        <Badge tone="neutral">3 / 5</Badge>
        <Button className="grow" block disabled={!s.canContinue} onClick={s.continueToNext}>
          {t('action.next')}
        </Button>
      </ActionBar>
    </Screen>
  );
}
