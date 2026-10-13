import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Confetti, User as UserIcon } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  TextArea,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import { useDealWonCelebration } from './useDealWonCelebration';
import { DEAL_WON_CELEBRATION_KEYS as K } from './deal-won-celebration.types';

export function DealWonCelebrationView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useDealWonCelebration();

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="block" />
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

  const { deal, lead, celebration, staffSummaries } = s.view;

  if (!s.view.eligible || !celebration) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} />
        <EmptyState title={t(K.notReady.title)} body={t(K.notReady.body)} />
      </Screen>
    );
  }

  const dealValue = deal.agreedPrice || deal.quotedPrice;
  const canAcknowledge = !celebration.acknowledged;

  return (
    <Screen className="pb-action-bar" width="narrow">
      <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} />

      <Card className="mb-4">
        <div className="stack gap-2 items-start">
          <Confetti size={32} className="t-accent" />
          <h1 className="t-xl t-semibold">{t(K.hero.heading)}</h1>
          <p className="t-sm t-muted">{t(K.hero.subheading, { site: lead.siteName })}</p>
          <p className="t-lg t-mono t-semibold mt-1">{t(K.hero.dealValue)}: {formatINR(dealValue)}</p>
        </div>
      </Card>

      {celebration.acknowledged && (
        <Card className="mb-4">
          <p className="t-sm t-success">{t(K.acknowledged.banner)}</p>
          {celebration.acknowledgedBy && celebration.acknowledgedAt && (
            <p className="t-xs t-muted mt-1">{t(K.acknowledged.by, { date: formatDate(celebration.acknowledgedAt, i18n.language) })}</p>
          )}
        </Card>
      )}

      <h2 className="t-lg mb-2">{t(K.staff.heading)}</h2>
      <div className="stack gap-3 mb-4">
        {staffSummaries.map((staff) => (
          <Card key={staff.userId}>
            <div className="row gap-3 items-start">
              <UserIcon size={20} className="t-emerald shrink-0 mt-1" />
              <div className="grow stack gap-2">
                <div className="row between items-center">
                  <span className="t-medium">{staff.name}</span>
                  <Badge tone={staff.role === 'original_surveyor' ? 'success' : 'neutral'}>
                    {t(staff.role === 'original_surveyor' ? K.staff.roleOriginal : K.staff.roleCurrent)}
                  </Badge>
                </div>
                {staff.entries.length === 0 ? (
                  <p className="t-xs t-muted">{t(K.staff.noEntries)}</p>
                ) : (
                  <div className="stack gap-1">
                    {staff.entries.map((entry) => (
                      <div key={entry.id} className="row between items-center">
                        <span className="t-xs t-muted">{t(K.staff.reasonLine, { reason: t(entry.reasonKey) })}</span>
                        <span className="t-xs t-mono">{formatINR(entry.amount)}</span>
                      </div>
                    ))}
                    <div className="row between items-center hairline-top pt-2">
                      <span className="t-sm t-semibold">{t(K.staff.total)}</span>
                      <span className="t-sm t-mono t-semibold">{formatINR(staff.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <p className="t-sm t-semibold mb-1">{t(K.nextSteps.heading)}</p>
        <p className="t-xs t-muted mb-2">{t(K.nextSteps.viewClosureBody)}</p>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/deals/${deal.id}/closure`)}>
          {t(K.nextSteps.viewClosure)}
        </Button>
      </Card>

      {s.isAdminViewer && celebration.feedbackNote && (
        <Card className="mb-4">
          <p className="label mb-1">{t(K.internalNote.heading)}</p>
          <p className="t-sm t-muted">{celebration.feedbackNote}</p>
        </Card>
      )}

      {canAcknowledge && (
        <Card className="mb-4">
          <p className="t-sm t-semibold mb-1">{t(K.feedback.heading)}</p>
          <p className="t-xs t-muted mb-2">{t(K.feedback.prompt)}</p>
          <TextArea value={s.feedbackNote} onChange={(e) => s.setFeedbackNote(e.target.value)} placeholder={t(K.feedback.placeholder)} rows={3} />
        </Card>
      )}

      {canAcknowledge && (
        <ActionBar>
          <Button block loading={s.acknowledging} onClick={() => void s.acknowledge().then((ok) => toast.push(t(ok ? K.toast.acknowledged : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.actionBar.acknowledge)}
          </Button>
        </ActionBar>
      )}
    </Screen>
  );
}
