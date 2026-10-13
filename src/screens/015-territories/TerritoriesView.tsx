import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  StatTile,
  formatPercent,
  useToast,
} from '@/design-system';
import type { MapMarker, MapZone } from '@/design-system';
import { useTerritories } from './useTerritories';
import { TERRITORY_KEYS as K } from './territories.types';

const EDGES = ['north', 'south', 'east', 'west'] as const;

/**
 * Screen 015 — Geo-fence & Territory Management. Every active surveyor should
 * hold at least one clearly defined territory, and a lead that falls outside
 * all of them must surface somewhere actionable rather than vanish.
 */
export function TerritoriesView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useTerritories();

  const zones = useMemo<MapZone[]>(
    () =>
      s.rows.map((row) => ({
        id: row.zone.id,
        points: row.zone.points,
        tone: row.zone.status === 'active' ? 'emerald' : 'muted',
        label: row.zone.name,
        selected: row.zone.id === s.selectedId,
        onClick: () => s.select(row.zone.id),
      })),
    [s],
  );

  // Unassigned leads are drawn deliberately, so "somewhere actionable" is
  // literally visible on the map rather than buried in a list.
  const markers = useMemo<MapMarker[]>(
    () =>
      s.unassignedLeads.map((lead) => ({
        id: lead.id,
        lat: lead.location.lat,
        lng: lead.location.lng,
        tone: 'warning',
        glyph: '?',
        label: lead.siteName,
      })),
    [s.unassignedLeads],
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

      <MapCanvas label={t(K.mapLabel)} zones={zones} markers={markers} height={360} />

      {s.unassignedLeads.length > 0 && (
        <Card className="mt-3">
          <h2 className="t-md t-semibold row gap-2 t-warning">
            <Warning size={18} />
            {t(K.unassignedHeading)}
          </h2>
          <p className="t-sm t-muted mt-2">{t(K.unassignedBody)}</p>
          <p className="t-sm t-semibold mt-2">
            {t(K.unassignedCount, { count: s.unassignedLeads.length })}
          </p>
          <div className="mt-3">
            {s.unassignedLeads.slice(0, 5).map((lead) => (
              <ListRow
                key={lead.id}
                title={lead.siteName}
                subtitle={`${lead.address} · ${lead.city}`}
                trailing={<Badge tone="warning">{lead.code}</Badge>}
              />
            ))}
          </div>
        </Card>
      )}

      <h2 className="t-lg mt-5 mb-2">{t(K.title)}</h2>
      <div className="stack gap-2">
        {s.rows.map((row) => (
          <Card
            key={row.zone.id}
            selected={row.zone.id === s.selectedId}
            onClick={() => s.select(row.zone.id)}
          >
            <div className="row between gap-3">
              <span className="stack gap-1 grow">
                <span className="t-md t-semibold">{row.zone.name}</span>
                <span className="t-xs t-muted">
                  {row.stats.assignedSurveyors.map((u) => u.name).join(', ') ||
                    t(K.problem.noSurveyor)}
                </span>
              </span>
              <Badge tone={row.zone.status === 'active' ? 'success' : 'neutral'}>
                {t(`status.${row.zone.status === 'active' ? 'active' : 'pending'}`)}
              </Badge>
            </div>

            {row.problems.length > 0 && (
              <div className="row wrap gap-2 mt-3">
                {row.problems.map((problem) => (
                  <Badge
                    key={problem}
                    tone={problem === 'overlapping' || problem === 'draft' ? 'neutral' : 'warning'}
                  >
                    {t(K.problem[problem])}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {s.selected && (
        <>
          <h2 className="t-lg mt-5 mb-2">{s.selected.zone.name}</h2>

          <div className="grid-auto mb-3" style={{ ['--min' as string]: '140px' }}>
            <Card>
              <StatTile label={t(K.stat.leadsMonth)} value={s.selected.stats.leadsThisMonth} />
            </Card>
            <Card>
              <StatTile label={t(K.stat.leadsTotal)} value={s.selected.stats.leadsTotal} />
            </Card>
            <Card>
              <StatTile
                label={t(K.stat.conversion)}
                value={formatPercent(s.selected.stats.conversionRate, 0)}
              />
            </Card>
            <Card>
              <StatTile
                label={t(K.stat.area)}
                value={
                  <>
                    {s.selected.stats.areaKm2} <span className="t-sm t-muted">km²</span>
                  </>
                }
              />
            </Card>
            <Card>
              <StatTile label={t(K.stat.density)} value={s.selected.stats.density} />
            </Card>
          </div>

          {s.selected.overlapsWith.length > 0 && (
            <Card className="mb-3">
              <p className="t-sm t-muted">
                {t(K.overlapNote, { zones: s.selected.overlapsWith.join(', ') })}
              </p>
              <p className="t-xs t-muted mt-2">{t(K.tieBreakNote)}</p>
            </Card>
          )}

          <Card className="mb-3" title={t(K.assignHeading)}>
            <div className="stack gap-3 mt-3">
              {s.surveyors.map((user) => (
                <Checkbox
                  key={user.id}
                  checked={s.selected!.zone.assignedUserIds.includes(user.id)}
                  onChange={() => s.toggleSurveyor(user.id)}
                  label={user.name}
                />
              ))}
            </div>
          </Card>

          <Card className="mb-3" title={t(K.boundsHeading)}>
            <p className="t-xs t-muted mt-2">{t(K.editorNote)}</p>
            <div className="stack gap-2 mt-3">
              {EDGES.map((edge) => (
                <div key={edge} className="row between gap-3">
                  <span className="t-sm t-medium grow">{t(K.bound[edge])}</span>
                  <span className="row gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Minus size={14} />}
                      onClick={() => s.nudge(edge, -1)}
                      aria-label={`${t(K.bound[edge])} ${t(K.bound.shrink)}`}
                    >
                      {t(K.bound.shrink)}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Plus size={14} />}
                      onClick={() => s.nudge(edge, 1)}
                      aria-label={`${t(K.bound[edge])} ${t(K.bound.grow)}`}
                    >
                      {t(K.bound.grow)}
                    </Button>
                  </span>
                </div>
              ))}
            </div>
            <p className="t-xs t-muted mt-3">{t(K.forwardOnlyNote)}</p>
          </Card>

          <div className="row gap-2 wrap">
            <Button
              loading={s.saving}
              disabled={!s.dirty}
              onClick={() =>
                void s.save().then(() => toast.push(t(K.saved), 'success'))
              }
            >
              {t(K.save)}
            </Button>
            <Button variant="ghost" onClick={s.toggleStatus}>
              {s.selected.zone.status === 'active' ? t(K.makeDraft) : t(K.activate)}
            </Button>
          </div>
        </>
      )}
    </Screen>
  );
}
