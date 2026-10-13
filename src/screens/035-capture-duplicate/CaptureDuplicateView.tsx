import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPinLine, Warning } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  formatDate,
} from '@/design-system';
import { CaptureStepRail } from '@/features/leadCapture/CaptureStepRail';
import { useCaptureDuplicate } from './useCaptureDuplicate';
import { BASELINE_RADIUS_METRES, CAPTURE_DUPLICATE_KEYS as K } from './capture-duplicate.types';
import type { DuplicateMatch } from './capture-duplicate.types';

/**
 * Screen 035 — Duplicate Lead Detection & Warning. Runs automatically right
 * after capture. Overriding it never silently blocks the surveyor — it
 * proceeds, flagged for a light admin review, which is what keeps the
 * commission model fraud-resistant without punishing genuine judgment calls.
 */
export function CaptureDuplicateView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useCaptureDuplicate();

  return (
    <Screen width="narrow" className="pb-action-bar">
      <div className="mt-4">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      </div>
      <CaptureStepRail current="duplicate" />

      {s.status === 'checking' && <LoadingState label={t(K.checking)} variant="cards" rows={1} />}

      {s.status === 'error' && (
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.recheck()}
        />
      )}

      {s.status === 'clear' && (
        <Card>
          <div className="row gap-3">
            <span className="ds-state__icon shrink-0" style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}>
              <CheckCircle size={22} weight="fill" />
            </span>
            <div className="stack gap-1">
              <span className="t-md t-semibold">{t(K.clear.title)}</span>
              <span className="t-sm t-muted">{t(K.clear.body)}</span>
            </div>
          </div>
        </Card>
      )}

      {s.status === 'flagged' && (
        <>
          <Card className="mb-3">
            <p className="t-sm t-muted">{t(K.radiusExplainer, { radius: BASELINE_RADIUS_METRES })}</p>
          </Card>

          <div className="stack gap-3">
            {s.matches.map((match) => (
              <MatchCard
                key={match.lead.id}
                match={match}
                onUpdateExisting={() => s.updateExistingLead(match.lead.id)}
              />
            ))}
          </div>

          <Card className="mt-4">
            <p className="t-sm t-semibold mb-2">{t(K.decision.isDifferentHint)}</p>
            <div className="stack gap-2">
              <Button variant="danger" block onClick={s.markAsDuplicate}>
                {t(K.decision.isDuplicate)}
              </Button>
              <Button variant="ghost" block onClick={s.proceedAsDifferent}>
                {t(K.decision.isDifferent)}
              </Button>
            </div>
          </Card>
        </>
      )}

      {s.cancelPromptOpen && (
        <Card className="mt-4">
          <p className="t-sm t-semibold">{t(K.confirmCancel.title)}</p>
          <p className="t-sm t-muted mt-1">{t(K.confirmCancel.body)}</p>
          <div className="row gap-2 mt-3">
            <Button variant="danger" onClick={s.confirmCancel}>
              {t(K.confirmCancel.confirm)}
            </Button>
            <Button variant="quiet" onClick={s.dismissCancelPrompt}>
              {t(K.confirmCancel.back)}
            </Button>
          </div>
        </Card>
      )}

      <ActionBar>
        <Button variant="ghost" onClick={() => navigate('/surveyor/capture/spec')}>
          {t('action.back')}
        </Button>
        <Badge tone="neutral">4 / 5</Badge>
        {s.status === 'clear' && (
          <Button className="grow" block onClick={s.continueToNext}>
            {t('action.next')}
          </Button>
        )}
      </ActionBar>
    </Screen>
  );
}

function MatchCard({ match, onUpdateExisting }: { match: DuplicateMatch; onUpdateExisting: () => void }) {
  const { t, i18n } = useTranslation();
  const { lead } = match;

  return (
    <Card selected={!match.isOwnLead}>
      {match.isOwnLead ? (
        <>
          <p className="t-sm t-accent row gap-2">
            <MapPinLine size={15} className="shrink-0" />
            {t(K.ownLead.banner)}
          </p>
          <div className="mt-2">
            <Button size="sm" onClick={onUpdateExisting}>
              {t(K.ownLead.updateAction)}
            </Button>
          </div>
        </>
      ) : (
        <p className="t-sm t-warning row gap-2">
          <Warning size={15} className="shrink-0" />
          {t(K.reason[match.reason], { distance: match.distanceMetres })}
        </p>
      )}

      <div className="grid-2 gap-3 mt-3">
        <div className="stack gap-1">
          <span className="label">{t(K.compare.existing)}</span>
          <span className="t-sm t-semibold">{lead.siteName}</span>
          <span className="t-xs t-muted">{t(K.compare.capturedBy, { name: match.surveyorName })}</span>
          <span className="t-xs t-muted">{t(K.compare.capturedOn, { date: formatDate(lead.createdAt, i18n.language) })}</span>
        </div>
        <div className="stack gap-1">
          <span className="label">{t(K.compare.distance)}</span>
          <span className="t-sm t-semibold num">{match.distanceMetres} m</span>
          <Badge tone="neutral">{lead.code}</Badge>
        </div>
      </div>
    </Card>
  );
}
