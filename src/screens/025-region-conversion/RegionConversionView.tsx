import { useTranslation } from 'react-i18next';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  formatPercent,
} from '@/design-system';
import { useRegionConversion } from './useRegionConversion';
import { REGION_CONVERSION_KEYS as K } from './region-conversion.types';

/** Green through amber to a neutral surface — never a false-confident colour on a blank. */
function heatColor(rate: number, significant: boolean): string {
  if (!significant) return 'var(--color-surface-alt)';
  if (rate >= 0.6) return 'var(--color-success-soft)';
  if (rate >= 0.3) return 'var(--color-warning-soft)';
  return 'var(--color-error-soft)';
}

/**
 * Screen 025 — Conversion Rate by Surveyor/Region. Star pairings and
 * underperforming ones are both visible at a glance, and a low-sample cell
 * never masquerades as a statistically meaningful result.
 */
export function RegionConversionView() {
  const { t } = useTranslation();
  const s = useRegionConversion();

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

  if (s.status === 'empty') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button size="sm" variant="ghost" icon={<ArrowsLeftRight size={16} />} onClick={s.flip}>
            {t(K.flip)}
          </Button>
        }
      />

      <div className="row wrap gap-3 mb-4">
        <label style={{ minWidth: 180 }}>
          <span className="sr-only">{t(K.sortBy)}</span>
          <Select value={s.sortBy} onChange={(e) => s.setSortBy(e.target.value as typeof s.sortBy)}>
            <option value="volume">{t(K.sort.volume)}</option>
            <option value="rate">{t(K.sort.rate)}</option>
            <option value="name">{t(K.sort.name)}</option>
          </Select>
        </label>
      </div>

      <Card flush>
        <div className="scroll-x">
          <table className="ds-table">
            <thead>
              <tr>
                <th>{t(K.axis[s.axis])}</th>
                {s.columnIds.map((col) => (
                  <th key={col} className="t-center">
                    {s.axis === 'surveyorRows' ? col : s.rowLabel(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.rowIds.map((row) => (
                <tr key={row}>
                  <td className="t-medium truncate" style={{ maxWidth: 140 }}>
                    {s.rowLabel(row)}
                  </td>
                  {s.columnIds.map((col) => {
                    const cell = s.cellFor(row, col);
                    if (!cell) return <td key={col} />;
                    return (
                      <td
                        key={col}
                        className="t-center"
                        style={{ padding: 0 }}
                      >
                        <button
                          type="button"
                          onClick={cell.isBlank ? undefined : () => s.selectCell(cell)}
                          disabled={cell.isBlank}
                          className="full-w"
                          style={{
                            background: heatColor(cell.rate, cell.significant),
                            border: 0,
                            padding: 'var(--space-2)',
                            minHeight: 56,
                            cursor: cell.isBlank ? 'default' : 'pointer',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {cell.isBlank ? (
                            <span className="t-xs t-muted">—</span>
                          ) : (
                            <span className="stack gap-1">
                              <span className="t-sm t-semibold num">{formatPercent(cell.rate, 0)}</span>
                              <span className="t-xs t-muted num">{cell.leadCount}</span>
                              {!cell.significant && (
                                <span className="t-xs t-muted">{t(K.lowSampleLabel)}</span>
                              )}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="stack gap-1 mt-3">
        <p className="t-xs t-muted">{t(K.blankNote)}</p>
        <p className="t-xs t-muted">{t(K.significanceNote)}</p>
        <p className="t-xs t-muted">{t(K.historicalNote)}</p>
      </div>

      <Sheet
        open={s.selectedCell !== null}
        onClose={s.closeSheet}
        title={
          s.selectedCell
            ? t(K.sheetTitle, { name: s.selectedCell.surveyorName, region: s.selectedCell.region })
            : ''
        }
        closeLabel={t('action.close')}
      >
        {s.selectedCell && (
          <>
            <p className="t-sm t-muted mb-3">
              {t(K.cellSummary, {
                leads: s.selectedCell.leadCount,
                deals: s.selectedCell.dealCount,
                rate: formatPercent(s.selectedCell.rate, 0),
              })}
            </p>
            {s.selectedLeads.length === 0 ? (
              <p className="t-sm t-muted">{t(K.noLeads)}</p>
            ) : (
              <Card flush>
                {s.selectedLeads.map((lead) => (
                  <ListRow
                    key={lead.id}
                    title={lead.siteName}
                    subtitle={lead.builderName}
                    trailing={<Badge tone={lead.stage === 'won' ? 'success' : 'neutral'}>{t(`stage.${lead.stage}`)}</Badge>}
                  />
                ))}
              </Card>
            )}
          </>
        )}
      </Sheet>
    </Screen>
  );
}
