import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendDown, TrendUp } from '@phosphor-icons/react';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  SegBar,
  Sheet,
  Tabs,
  formatINRCompact,
  formatPercent,
  polygonBounds,
} from '@/design-system';
import type { MapHeatCell, MapZone } from '@/design-system';
import { useHeatmap } from './useHeatmap';
import { HEATMAP_KEYS as K, RANGES } from './heatmap.types';
import type { ZoneHeat } from './heatmap.types';

/**
 * Screen 016 — Heatmap. Answers a strategic question the operational map
 * cannot: which areas produce volume, and which of those actually convert.
 */
export function HeatmapView() {
  const { t } = useTranslation();
  const s = useHeatmap();
  const [drill, setDrill] = useState<ZoneHeat | null>(null);

  const heat = useMemo<MapHeatCell[]>(
    () =>
      s.zones
        .filter((z) => z.hasEnoughData && !z.noCoverage)
        .map((z) => {
          const box = polygonBounds(z.zone.points);
          return {
            id: z.zone.id,
            lat: (box.minLat + box.maxLat) / 2,
            lng: (box.minLng + box.maxLng) / 2,
            weight: z.intensity,
          };
        }),
    [s.zones],
  );

  const zoneShapes = useMemo<MapZone[]>(
    () =>
      s.zones.map((z) => ({
        id: z.zone.id,
        points: z.zone.points,
        tone: z.hasEnoughData ? 'accent' : 'muted',
        label: z.zone.name,
        onClick: () => setDrill(z),
      })),
    [s.zones],
  );

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
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="stack gap-3 mb-3">
        <Tabs
          label={t(K.metric.leads)}
          value={s.metric}
          onChange={(id) => s.setMetric(id as 'leads' | 'deals')}
          items={[
            { id: 'leads', label: t(K.metric.leads) },
            { id: 'deals', label: t(K.metric.deals) },
          ]}
        />
        <SegBar
          label={t(K.range['30'])}
          value={s.range}
          onChange={(id) => s.setRange(id as '7' | '30' | '90')}
          items={RANGES.map((r) => ({ id: r, label: t(K.range[r]) }))}
        />
      </div>

      <MapCanvas label={t(K.mapLabel)} heat={heat} zones={zoneShapes} height={380} />

      <div className="stack gap-1 mt-2">
        <p className="t-xs t-muted">{t(K.normalisedNote)}</p>
        <p className="t-xs t-muted">{t(K.batchNote)}</p>
      </div>

      {s.conversionGaps.length > 0 && (
        <Card className="mt-3">
          <p className="t-sm t-warning">
            {t(K.conversionGap, {
              zones: s.conversionGaps.map((z) => z.zone.name).join(', '),
            })}
          </p>
        </Card>
      )}

      <h2 className="t-lg mt-5 mb-2">{t(K.ranking)}</h2>
      <Card flush>
        <div className="scroll-x">
          <table className="ds-table">
            <thead>
              <tr>
                <th>{t(K.column.zone)}</th>
                <th className="ds-table__num">{t(K.column.leads)}</th>
                <th className="ds-table__num">{t(K.column.deals)}</th>
                <th className="ds-table__num">{t(K.column.density)}</th>
                <th className="ds-table__num">{t(K.column.conversion)}</th>
                <th className="ds-table__num">{t(K.column.change)}</th>
              </tr>
            </thead>
            <tbody>
              {s.zones.map((z) => (
                <tr key={z.zone.id}>
                  <td>
                    <button
                      type="button"
                      className="t-medium"
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--color-accent-secondary)' }}
                      onClick={() => setDrill(z)}
                    >
                      {z.zone.name}
                    </button>
                    {!z.hasEnoughData && (
                      <div className="t-xs t-muted">{t(K.notEnoughData)}</div>
                    )}
                    {z.noCoverage && <div className="t-xs t-muted">{t(K.noCoverage)}</div>}
                  </td>
                  <td className="ds-table__num">{z.leadCount}</td>
                  <td className="ds-table__num">{z.dealCount}</td>
                  <td className="ds-table__num">{z.density.toFixed(1)}</td>
                  <td className="ds-table__num">
                    {z.hasEnoughData ? formatPercent(z.conversionRate, 0) : '—'}
                  </td>
                  <td className="ds-table__num">
                    {z.changePct === null ? (
                      <span className="t-muted">—</span>
                    ) : (
                      <span className={z.changePct >= 0 ? 't-success' : 't-error'}>
                        {z.changePct >= 0 ? <TrendUp size={12} /> : <TrendDown size={12} />}{' '}
                        {formatPercent(Math.abs(z.changePct), 0)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* One tap from a hot zone to the real underlying lead records. */}
      <Sheet
        open={drill !== null}
        onClose={() => setDrill(null)}
        title={t(K.sheet.title, { zone: drill?.zone.name ?? '' })}
        closeLabel={t('action.close')}
      >
        {drill && drill.leads.length === 0 ? (
          <p className="t-sm t-muted">{t(K.sheet.empty)}</p>
        ) : (
          <Card flush>
            {drill?.leads.map((lead) => (
              <ListRow
                key={lead.id}
                title={lead.siteName}
                subtitle={`${lead.builderName} · ${lead.address}`}
                trailing={
                  <span className="stack items-end gap-1">
                    <Badge tone={lead.stage === 'won' ? 'success' : 'neutral'}>
                      {t(`stage.${lead.stage}`)}
                    </Badge>
                    <span className="t-xs t-muted num">
                      {formatINRCompact(lead.estimatedValue)}
                    </span>
                  </span>
                }
              />
            ))}
          </Card>
        )}
      </Sheet>
    </Screen>
  );
}
