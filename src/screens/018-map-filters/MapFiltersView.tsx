import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Warning } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  Chip,
  Screen,
  ScreenHeader,
  Toggle,
} from '@/design-system';
import { useMapFilters } from './useMapFilters';
import {
  ALL_LAYERS,
  ALL_SEVERITIES,
  ALL_STAGES,
  ALL_WINDOWS,
  MAP_FILTER_KEYS as K,
} from './map-filters.types';

/**
 * Screen 018 — Map Filters & Layers. The selection is saved as it changes and
 * read straight back by the live map, so there is no apply-then-hope step.
 */
export function MapFiltersView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useMapFilters();

  return (
    <Screen width="narrow" className="pb-action-bar">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        back={() => navigate('/admin/map')}
        backLabel={t('action.back')}
        action={
          s.activeCount > 0 ? (
            <Badge tone="accent">{t(K.activeCount, { count: s.activeCount })}</Badge>
          ) : (
            <Badge tone="neutral">{t(K.noneHidden)}</Badge>
          )
        }
      />

      <section className="mb-4">
        <h2 className="label mb-2">{t(K.section.layers)}</h2>
        <div className="row wrap gap-2">
          {ALL_LAYERS.map((layer) => (
            <Chip
              key={layer}
              pressed={s.filters.layers.includes(layer)}
              onClick={() => s.toggleLayer(layer)}
            >
              {t(K.layer[layer])}
            </Chip>
          ))}
        </div>
        {s.filters.layers.length === 0 && (
          <p className="t-xs t-warning mt-2 row gap-2">
            <Warning size={14} className="shrink-0" />
            {t(K.emptyLayerWarning)}
          </p>
        )}
      </section>

      <section className="mb-4">
        <h2 className="label mb-2">{t(K.section.stages)}</h2>
        <div className="row wrap gap-2">
          {ALL_STAGES.map((stage) => (
            <Chip
              key={stage}
              pressed={s.filters.stages.includes(stage)}
              onClick={() => s.toggleStage(stage)}
            >
              {t(`stage.${stage}`)}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="label mb-2">{t(K.section.severities)}</h2>
        <div className="row wrap gap-2">
          {ALL_SEVERITIES.map((severity) => (
            <Chip
              key={severity}
              pressed={s.filters.severities.includes(severity)}
              onClick={() => s.toggleSeverity(severity)}
            >
              {t(`severity.${severity}`)}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="label mb-2">{t(K.section.window)}</h2>
        <div className="row wrap gap-2">
          {ALL_WINDOWS.map((window) => (
            <Chip
              key={window}
              pressed={s.filters.window === window}
              onClick={() => s.setWindow(window)}
            >
              {t(K.window[window])}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="label mb-2">{t(K.section.people)}</h2>
        <Card>
          <Toggle
            checked={s.filters.onlyOnDuty}
            onChange={s.setOnlyOnDuty}
            label={t(K.onlyOnDuty)}
            description={t(K.onlyOnDutyHint)}
          />
        </Card>
      </section>

      <Card>
        <div className="row between">
          <span className="t-sm t-muted">{t(K.preview)}</span>
          <span className="t-sm t-semibold num">
            {s.loading ? '—' : t(K.previewCount, { count: s.previewCount })}
          </span>
        </div>
      </Card>

      <ActionBar>
        <Button variant="ghost" onClick={s.clearAll} disabled={s.activeCount === 0}>
          {t(K.clearAll)}
        </Button>
        <Button className="grow" block onClick={() => navigate('/admin/map')}>
          {t(K.backToMap)}
        </Button>
      </ActionBar>
    </Screen>
  );
}
