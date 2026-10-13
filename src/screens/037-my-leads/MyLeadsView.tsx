import { useTranslation } from 'react-i18next';
import { MagnifyingGlass } from '@phosphor-icons/react';
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  StatTile,
  formatDate,
  formatINRCompact,
  formatPercent,
} from '@/design-system';
import { useMyLeads } from './useMyLeads';
import { FILTERABLE_STAGES, MY_LEADS_KEYS as K } from './my-leads.types';

const STAGE_TONE: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
  won: 'success',
  lost: 'error',
  negotiation: 'warning',
};

/**
 * Screen 037 — My Leads History. A surveyor can trace exactly what happened
 * to every lead they ever captured. Read-only beyond the original capture —
 * stage and CRM fields belong to sales, not to this screen.
 */
export function MyLeadsView() {
  const { t, i18n } = useTranslation();
  const s = useMyLeads();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={6} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
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

  if (s.status === 'empty') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-2 gap-3 mb-4">
        <Card>
          <StatTile label={t(K.summary.total)} value={s.summary.total} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.won)} value={s.summary.won} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.conversion)} value={formatPercent(s.summary.conversionRate, 0)} />
        </Card>
      </div>
      <p className="t-xs t-muted mb-4">{t(K.summary.matchesNote)}</p>

      <div className="mb-3" style={{ position: 'relative' }}>
        <MagnifyingGlass
          size={16}
          className="t-muted"
          style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <Input
          placeholder={t(K.searchPlaceholder)}
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
          style={{ paddingLeft: 'calc(var(--space-3) * 2 + 16px)' }}
        />
      </div>

      <div className="row wrap gap-2 mb-4">
        {FILTERABLE_STAGES.map((stage) => (
          <Chip key={stage} pressed={s.activeStages.includes(stage)} onClick={() => s.toggleStage(stage)}>
            {t(`stage.${stage}`)}
          </Chip>
        ))}
      </div>

      {s.hasNoMatches ? (
        <EmptyState title={t(K.noResults.title)} body={t(K.noResults.body)} />
      ) : (
        <>
          <Card flush>
            {s.visible.map((lead) => (
              <ListRow
                key={lead.id}
                title={lead.siteName}
                subtitle={`${lead.builderName} · ${formatDate(lead.createdAt, i18n.language)}`}
                trailing={
                  <span className="stack items-end gap-1">
                    <Badge tone={STAGE_TONE[lead.stage] ?? 'neutral'}>{t(`stage.${lead.stage}`)}</Badge>
                    <span className="t-xs t-muted num">{formatINRCompact(lead.estimatedValue)}</span>
                  </span>
                }
                onClick={() => s.select(lead)}
              />
            ))}
          </Card>

          <div className="row center mt-3">
            {s.hasMore ? (
              <button type="button" className="tappable t-sm t-accent" onClick={s.loadMore}>
                {t(K.loadMore)}
              </button>
            ) : (
              <span className="t-xs t-muted">{t(K.allLoaded)}</span>
            )}
          </div>
        </>
      )}

      <Sheet
        open={s.selected !== null}
        onClose={() => s.select(null)}
        title={s.selected ? t(K.detail.title, { code: s.selected.code }) : ''}
        closeLabel={t('action.close')}
      >
        {s.selected && (
          <div className="stack gap-3">
            <div className="row between">
              <span className="t-sm t-semibold">{s.selected.siteName}</span>
              <Badge tone={STAGE_TONE[s.selected.stage] ?? 'neutral'}>{t(`stage.${s.selected.stage}`)}</Badge>
            </div>
            <div className="stack gap-1">
              <span className="label">{t(K.detail.contact)}</span>
              <span className="t-sm">{s.selected.contactName}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.detail.estimatedValue)}</span>
              <span className="t-sm t-semibold num">{formatINRCompact(s.selected.estimatedValue)}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.detail.incentive)}</span>
              <span className="t-sm t-semibold num">{formatINRCompact(s.selected.incentiveAmount)}</span>
            </div>
            {s.selected.lostReason && (
              <div className="row between">
                <span className="t-sm t-muted">{t(K.detail.lostReason)}</span>
                <span className="t-sm">{s.selected.lostReason}</span>
              </div>
            )}
            <p className="t-xs t-muted mt-2">{t(K.readOnlyNote)}</p>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
