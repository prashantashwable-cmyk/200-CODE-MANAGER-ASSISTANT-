import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ClockCounterClockwise } from '@phosphor-icons/react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, formatDate, formatINR, useToast } from '@/design-system';
import { useQuotationHistory } from './useQuotationHistory';
import { COLLAPSE_AFTER_VERSIONS, QUOTATION_HISTORY_KEYS as K } from './quotation-history.types';

function formatDiffValue(fieldKey: string, value: string, t: (k: string, o?: Record<string, unknown>) => string, lang: string): string {
  if (fieldKey === 'driveType') return t(`driveType.${value}`);
  if (fieldKey === 'finishTier') return t(`finishTier.${value}`);
  if (fieldKey === 'finalPrice') return formatINR(Number(value));
  if (fieldKey === 'validityDate' && value !== '—') return formatDate(value, lang);
  return value;
}

export function QuotationHistoryView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useQuotationHistory();
  const [showAll, setShowAll] = useState(false);

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  if (s.activeChain.length > 0) {
    const reversedChain = [...s.activeChain].reverse();
    const visibleChain = showAll ? reversedChain : reversedChain.slice(0, COLLAPSE_AFTER_VERSIONS);
    const hiddenCount = reversedChain.length - visibleChain.length;
    return (
      <Screen>
        <ScreenHeader title={s.activeLead?.siteName ?? ''} subtitle={s.activeLead?.contactName} back={s.closeLineage} backLabel={t('action.back')} />
        <div className="stack gap-3">
          {visibleChain.map((version, reverseIndex) => {
            const index = s.activeChain.length - 1 - reverseIndex;
            const isCurrent = index === s.activeChain.length - 1;
            const diffs = s.diffFor(version, index);
            return (
              <Card key={version.id}>
                <div className="row between items-start gap-3 mb-2">
                  <div className="stack gap-1">
                    <span className="t-sm t-semibold">{t(K.versionCard.createdBy, { version: version.version, name: version.createdBy })}</span>
                    <span className="t-xs t-muted">{formatDate(version.createdAt, i18n.language)}</span>
                  </div>
                  {isCurrent && <Badge tone="success">{t(K.versionCard.current)}</Badge>}
                </div>

                {version.createdReasonKey && (
                  <p className="t-xs t-muted mb-2">
                    {t(version.createdReasonKey)}
                    {version.createdReasonNote ? ` — ${version.createdReasonNote}` : ''}
                  </p>
                )}

                {index === 0 ? (
                  <p className="t-sm">{formatINR(version.cost.finalPrice)}</p>
                ) : diffs.length === 0 ? (
                  <p className="t-xs t-muted">{t(K.versionCard.noChanges)}</p>
                ) : (
                  <div className="stack gap-1 mb-2">
                    {diffs.map((d) => (
                      <div key={d.fieldKey} className="row gap-2 items-center t-xs">
                        <span className="t-muted">{t(K.diff[d.fieldKey as keyof typeof K.diff])}:</span>
                        <span>{formatDiffValue(d.fieldKey, d.from, t, i18n.language)}</span>
                        <ArrowRight size={11} className="t-muted" />
                        <span className="t-medium">{formatDiffValue(d.fieldKey, d.to, t, i18n.language)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="t-xs t-muted">
                  {version.sentAt
                    ? t(K.versionCard.delivery, { channels: version.deliveryChannels.join(', '), date: formatDate(version.sentAt, i18n.language) })
                    : t(K.versionCard.notSent)}
                </p>

                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    loading={s.restoring === version.id}
                    icon={<ClockCounterClockwise size={14} />}
                    onClick={() => void s.restoreVersion(version).then((ok) => toast.push(t(ok ? K.toast.restored : K.toast.error), ok ? 'success' : 'error'))}
                  >
                    {t(K.versionCard.restore)}
                  </Button>
                )}
              </Card>
            );
          })}
          {hiddenCount > 0 && (
            <Button variant="ghost" onClick={() => setShowAll(true)}>
              {t(K.showAll, { count: hiddenCount })}
            </Button>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      {s.lineages.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.lineages.map((lineage) => {
            const lead = s.leads.find((l) => l.id === lineage.leadId);
            return (
              <Card
                key={lineage.latest.id}
                onClick={() => {
                  setShowAll(false);
                  s.openLineage(lineage.latest.id);
                }}
              >
                <div className="row between items-center gap-3">
                  <div className="stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-sm t-semibold truncate">{lead?.siteName ?? lineage.latest.code}</span>
                    <span className="t-xs t-muted">{t(`quotationStatus.${lineage.latest.status}`)}</span>
                  </div>
                  <span className="t-xs t-muted">{t(K.lineageRow.versions, { count: lineage.versionCount })}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
