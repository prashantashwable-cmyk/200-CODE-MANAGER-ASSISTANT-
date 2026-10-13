import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Star, WarningCircle } from '@phosphor-icons/react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, Select, formatDate, formatINR, useToast } from '@/design-system';
import { usePackageComparison } from './usePackageComparison';
import { PACKAGE_COMPARISON_KEYS as K, TIER_AMC_INDEX, TIER_WARRANTY_YEARS } from './package-comparison.types';

export function PackageComparisonView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = usePackageComparison();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <h2 className="t-lg mb-2">{t(K.newComparison.heading)}</h2>
      <Card className="mb-4">
        <div className="stack gap-3">
          <Select value={s.pickedLeadId} onChange={(e) => s.setPickedLeadId(e.target.value)}>
            <option value="">{t(K.newComparison.pickLead)}</option>
            {s.leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.siteName} — {lead.contactName}
              </option>
            ))}
          </Select>
          <Button
            disabled={!s.pickedLeadId}
            loading={s.generating}
            onClick={() => void s.generate().then((ok) => toast.push(t(ok ? K.toast.generated : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.newComparison.generate)}
          </Button>
        </div>
      </Card>

      {s.activeQuotations.length > 0 && (
        <>
          {s.activeLead && <p className="t-sm t-muted mb-3">{s.activeLead.siteName} — {s.activeLead.contactName}</p>}
          {s.priceGapFlag && (
            <p className="t-xs t-warning row gap-1 items-center mb-3">
              <WarningCircle size={13} />
              {t(K.priceGapWarning)}
            </p>
          )}
          <div className="grid-auto mb-3" style={{ ['--min' as string]: '220px' }}>
            {s.activeQuotations.map((q) => {
              const tier = q.packageTier ?? 'basic';
              const amcTier = s.pricingConfig?.amcTiers[TIER_AMC_INDEX[tier]];
              return (
                <Card key={q.id}>
                  <div className="stack gap-3">
                    <div className="row between items-start">
                      <span className="t-sm t-semibold">{t(K.tier[tier])}</span>
                      {q.recommended && (
                        <Badge tone="accent">
                          <Star size={12} weight="fill" /> {t(K.recommended)}
                        </Badge>
                      )}
                    </div>
                    <span className="num t-lg t-semibold">{formatINR(q.cost.finalPrice)}</span>
                    <div className="stack gap-1">
                      <div className="row between">
                        <span className="t-xs t-muted">{t(K.feature.finish)}</span>
                        <span className="t-xs">{t(`finishTier.${q.finishTier}`)}</span>
                      </div>
                      <div className="row between">
                        <span className="t-xs t-muted">{t(K.feature.warranty)}</span>
                        <span className="t-xs">{t(K.feature.warrantyValue, { count: TIER_WARRANTY_YEARS[tier] })}</span>
                      </div>
                      {amcTier && (
                        <div className="row between">
                          <span className="t-xs t-muted">{t(K.feature.amc)}</span>
                          <span className="t-xs">{formatINR(amcTier.annualPrice)}/yr</span>
                        </div>
                      )}
                    </div>
                    <Button block onClick={() => navigate(`/admin/quotes/${q.id}/preview`)}>
                      {t(K.select)}
                    </Button>
                    <button type="button" className="tappable t-xs t-accent" onClick={() => navigate('/admin/quotes')}>
                      {t(K.customize)}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="t-xs t-muted mb-4">{t(K.safetyIncludedNote)}</p>
        </>
      )}

      <h2 className="t-lg mb-2">{t(K.pastSets.heading)}</h2>
      {s.pastSets.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.pastSets.map((set) => {
            const lead = s.leads.find((l) => l.id === set.leadId);
            return (
              <Card key={set.comparisonSetId} onClick={() => s.openSet(set.comparisonSetId)}>
                <div className="row between items-center">
                  <span className="t-sm t-medium">{lead?.siteName ?? set.leadId}</span>
                  <span className="t-xs t-muted">{formatDate(set.createdAt, i18n.language)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
