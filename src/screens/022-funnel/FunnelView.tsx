import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendDown } from '@phosphor-icons/react';
import {
  Badge,
  Card,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  Tabs,
  formatPercent,
} from '@/design-system';
import { useFunnel } from './useFunnel';
import { FUNNEL_KEYS as K, LOST_REASON_TAXONOMY } from './funnel.types';
import type { BreakdownGroup, FunnelStep, LostReasonBreakdown } from './funnel.types';

/**
 * Screen 022 — Sales Funnel Analytics. The single biggest drop-off point is
 * identifiable within seconds, and every lost-reason bucket ties back to real,
 * individually inspectable leads.
 */
export function FunnelView() {
  const { t } = useTranslation();
  const s = useFunnel();
  const [openReason, setOpenReason] = useState<LostReasonBreakdown | null>(null);

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="block" />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <Tabs
        label={t(K.breakdown.label)}
        value={s.breakdownBy}
        onChange={(id) => s.setBreakdownBy(id as typeof s.breakdownBy)}
        items={[
          { id: 'none', label: t(K.breakdown.none) },
          { id: 'surveyor', label: t(K.breakdown.surveyor) },
          { id: 'territory', label: t(K.breakdown.territory) },
          { id: 'source', label: t(K.breakdown.source) },
        ]}
        className="mb-4"
      />

      {s.biggestDropStage && (
        <Card className="mb-4">
          <p className="t-sm t-warning row gap-2">
            <TrendDown size={16} className="shrink-0" />
            {t(K.biggestDrop, { stage: t(`stage.${s.biggestDropStage}`) })}
          </p>
        </Card>
      )}

      {s.breakdownBy === 'none' ? (
        <FunnelChart steps={s.overall} />
      ) : (
        <div className="stack gap-4">
          {s.groups.map((group) => (
            <BreakdownCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <p className="t-xs t-muted mt-3">{t(K.skipStageNote)}</p>
      <p className="t-xs t-muted">{t(K.reopenedNote)}</p>
      <p className="t-xs t-muted">{t(K.currentStateNote)}</p>

      <h2 className="t-lg mt-5 mb-2">{t(K.lostHeading)}</h2>
      <Card flush>
        {LOST_REASON_TAXONOMY.map((reasonId) => {
          const bucket = s.lostReasons.find((r) => r.reason === reasonId) ?? {
            reason: reasonId,
            count: 0,
            leads: [],
          };
          return (
            <ListRow
              key={reasonId}
              title={t(K.lostReason[reasonId])}
              trailing={<Badge tone="neutral">{bucket.count}</Badge>}
              onClick={bucket.count > 0 ? () => setOpenReason(bucket) : undefined}
            />
          );
        })}
      </Card>

      <Sheet
        open={openReason !== null}
        onClose={() => setOpenReason(null)}
        title={t(K.sheetTitle, {
          reason: openReason ? t(K.lostReason[openReason.reason as keyof typeof K.lostReason]) : '',
        })}
        closeLabel={t('action.close')}
      >
        <Card flush>
          {openReason?.leads.map((lead) => (
            <ListRow key={lead.id} title={lead.siteName} subtitle={`${lead.builderName} · ${lead.code}`} />
          ))}
        </Card>
      </Sheet>
    </Screen>
  );
}

function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const { t } = useTranslation();
  const peak = Math.max(...steps.map((s) => s.reached), 1);

  return (
    <Card>
      <div className="stack gap-4">
        {steps.map((step) => (
          <div key={step.stage} className="stack gap-2">
            <div className="row between gap-2">
              <span className="t-sm t-semibold">{t(`stage.${step.stage}`)}</span>
              <span className="row gap-3 t-xs t-muted">
                <span className="num">{step.reached}</span>
                {step.conversionFromPrevious !== null && (
                  <span className={step.conversionFromPrevious < 0.5 ? 't-warning' : undefined}>
                    {formatPercent(step.conversionFromPrevious, 0)}
                  </span>
                )}
              </span>
            </div>
            <div
              style={{
                height: 12,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-surface-alt)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(4, (step.reached / peak) * 100)}%`,
                  background: 'var(--color-accent-primary)',
                  borderRadius: 'var(--radius-pill)',
                }}
              />
            </div>
            <span className="t-xs t-muted">
              {t(K.avgDays, { days: step.avgDaysInStage })}
              {step.smallSample && ` · ${t(K.smallSample)}`}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BreakdownCard({ group }: { group: BreakdownGroup }) {
  const { t } = useTranslation();
  return (
    <Card title={group.label} aside={<Badge tone="emerald">{formatPercent(group.overallConversion, 0)}</Badge>}>
      <div className="mt-3">
        <FunnelChart steps={group.steps} />
      </div>
    </Card>
  );
}
