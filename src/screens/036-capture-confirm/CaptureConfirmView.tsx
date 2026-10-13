import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Image as ImageIcon, PencilSimple, WifiSlash } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
  Badge,
  Button,
  Card,
  Screen,
  ScreenHeader,
  formatINR,
  formatPhone,
} from '@/design-system';
import { CaptureStepRail } from '@/features/leadCapture/CaptureStepRail';
import { useCaptureDraft } from '@/features/leadCapture/CaptureDraftProvider';
import { useCaptureConfirm } from './useCaptureConfirm';
import { CAPTURE_CONFIRM_KEYS as K } from './capture-confirm.types';

/**
 * Screen 036 — Lead Submission Confirmation & Incentive Preview. A surveyor
 * always knows roughly what they stand to earn before hitting submit, and no
 * captured evidence is ever lost to a connectivity issue.
 */
export function CaptureConfirmView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { draft } = useCaptureDraft();
  const s = useCaptureConfirm();

  if (s.status === 'success') {
    return (
      <div className="ds-screen ds-screen--narrow stack center gap-4" style={{ minHeight: '100dvh' }}>
        <AscensionLine
          steps={[
            { id: 'captured', label: t(K.success.milestone.captured), status: 'complete' },
            { id: 'locked', label: t(K.success.milestone.locked), status: 'complete' },
            { id: 'pipeline', label: t(K.success.milestone.pipeline), status: 'complete' },
          ]}
          orientation="horizontal"
        />
        <span className="ds-state__icon" style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}>
          <CheckCircle size={28} weight="fill" />
        </span>
        <h1 className="t-center t-balance">{t(K.success.title)}</h1>
        <p className="t-muted t-center" style={{ maxWidth: '34ch' }}>
          {t(K.success.body)}
        </p>
        {s.submittedCode && (
          <Badge tone="emerald">{t(K.success.code, { code: s.submittedCode })}</Badge>
        )}
        <div className="stack gap-2 full-w mt-3">
          <Button block onClick={s.captureAnother}>
            {t(K.success.captureAnother)}
          </Button>
          <Button variant="ghost" block onClick={s.goHome}>
            {t(K.success.backHome)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Screen width="narrow" className="pb-action-bar">
      <div className="mt-4">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      </div>
      <CaptureStepRail current="confirm" />

      {s.status === 'queuedOffline' && (
        <Card className="mb-4">
          <p className="t-sm t-warning row gap-2">
            <WifiSlash size={16} className="shrink-0" />
            {t(K.offlineQueued.title)}
          </p>
          <p className="t-xs t-muted mt-1">{t(K.offlineQueued.body)}</p>
        </Card>
      )}

      {s.status === 'error' && (
        <Card className="mb-4">
          <p className="t-sm t-error">{t(K.error.title)}</p>
          <p className="t-xs t-muted mt-1">{t(K.error.body)}</p>
          <div className="mt-2">
            <Button size="sm" variant="ghost" onClick={() => void s.submit()}>
              {t(K.error.retry)}
            </Button>
          </div>
        </Card>
      )}

      <Card className="mb-3">
        <div className="row between gap-2">
          <h2 className="t-md t-semibold">{t(K.summary.heading)}</h2>
          <Button size="sm" variant="quiet" icon={<PencilSimple size={13} />} onClick={() => navigate('/surveyor/capture')}>
            {t(K.summary.edit)}
          </Button>
        </div>

        <div className="stack gap-3 mt-3">
          <div className="row gap-3">
            <ImageIcon size={18} className="t-emerald shrink-0" />
            <span className="t-sm">{t(K.summary.photos, { count: draft.photos.length })}</span>
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.summary.contact)}</span>
            <span className="t-sm">{draft.contactName || '—'}</span>
            {draft.contactPhone && <span className="t-xs t-muted num">{formatPhone(draft.contactPhone)}</span>}
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.summary.building)}</span>
            <span className="t-sm">
              {draft.spec.floors ?? '—'} floors · {draft.spec.capacityPersons ?? '—'} persons
            </span>
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.summary.location)}</span>
            <span className="t-sm">{draft.address || draft.city}</span>
          </div>
        </div>

        {draft.duplicateAcknowledged && draft.duplicateOfLeadId && (
          <p className="t-xs t-warning mt-3">{t(K.summary.flaggedNote)}</p>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="t-md t-semibold mb-3">{t(K.incentive.heading)}</h2>
        <div className="stack gap-3">
          <div className="row between">
            <span className="stack gap-1">
              <span className="t-sm t-medium">{t(K.incentive.base)}</span>
              <span className="t-xs t-muted">{t(K.incentive.baseNote)}</span>
            </span>
            <span className="t-md t-semibold num t-success">{formatINR(s.baseBonus)}</span>
          </div>
          <div className="divider" />
          <div className="row between">
            <span className="stack gap-1">
              <span className="t-sm t-medium">{t(K.incentive.conversion)}</span>
              <span className="t-xs t-muted">{t(K.incentive.conversionNote)}</span>
            </span>
            <span className="t-md t-semibold num t-accent">{formatINR(s.conversionBonus)}</span>
          </div>
        </div>
        <p className="t-xs t-muted mt-3">{t(K.incentive.estimateNote)}</p>
      </Card>

      <ActionBar>
        <Badge tone="neutral">5 / 5</Badge>
        <Button
          className="grow"
          block
          loading={s.status === 'submitting'}
          disabled={s.status === 'submitting' || s.status === 'queuedOffline'}
          onClick={() => void s.submit()}
        >
          {s.status === 'submitting' ? t(K.submitting) : t(K.submit)}
        </Button>
      </ActionBar>
    </Screen>
  );
}
