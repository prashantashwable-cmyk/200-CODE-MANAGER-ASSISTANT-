import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import {
  polygonAreaKm2,
  polygonBounds,
  polygonSelfIntersects,
  polygonsOverlap,
  pointInPolygon,
} from '@/design-system';
import type { GeoZone, Lead, User } from '@/data/types';
import { MIN_SENSIBLE_AREA_KM2, NUDGE_STEP } from './territories.types';
import type { TerritoryProblem, TerritoryRow, TerritoryStatus } from './territories.types';

type Edge = 'north' | 'south' | 'east' | 'west';

interface TerritoriesState {
  status: TerritoryStatus;
  rows: TerritoryRow[];
  surveyors: User[];
  /** Leads that fall in no territory at all — never silently dropped. */
  unassignedLeads: Lead[];
  selectedId: string | null;
  select: (id: string | null) => void;
  selected: TerritoryRow | null;
  nudge: (edge: Edge, direction: 1 | -1) => void;
  toggleSurveyor: (userId: string) => void;
  toggleStatus: () => void;
  save: () => Promise<void>;
  saving: boolean;
  dirty: boolean;
  reload: () => Promise<void>;
}

/**
 * Owns territory geometry, assignment and the checks that keep it sane.
 *
 * Polygon editing is deliberately not freehand here. The map is a schematic
 * SVG canvas, not a real editing surface, and pretending otherwise would
 * produce shapes nobody could trust. Instead each zone's bounding box is
 * adjustable edge by edge — precise, reversible, and honest about what it is.
 */
export function useTerritories(): TerritoriesState {
  const repository = useData();

  const [status, setStatus] = useState<TerritoryStatus>('loading');
  const [zones, setZones] = useState<GeoZone[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [surveyors, setSurveyors] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const [zoneList, leadList, userList] = await Promise.all([
        repository.listZones(),
        repository.listLeads(),
        repository.listUsers({ role: 'surveyor' }),
      ]);
      setZones(zoneList);
      setLeads(leadList);
      setSurveyors(userList.filter((u) => u.status === 'active'));
      setSelectedId((current) => current ?? zoneList[0]?.id ?? null);
      setStatus(zoneList.length === 0 ? 'empty' : 'ready');
      setDirty(false);
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const rows = useMemo<TerritoryRow[]>(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return zones.map((zone) => {
      const inside = leads.filter((lead) => pointInPolygon(lead.location, zone.points));
      const won = inside.filter((l) => l.stage === 'won');
      const closed = inside.filter((l) => l.stage === 'won' || l.stage === 'lost');
      const areaKm2 = polygonAreaKm2(zone.points);

      const overlapsWith = zones
        .filter((other) => other.id !== zone.id && polygonsOverlap(zone.points, other.points))
        .map((other) => other.name);

      const problems: TerritoryProblem[] = [];
      if (zone.assignedUserIds.length === 0) problems.push('noSurveyor');
      if (polygonSelfIntersects(zone.points)) problems.push('selfIntersecting');
      if (areaKm2 < MIN_SENSIBLE_AREA_KM2) problems.push('tooSmall');
      if (overlapsWith.length > 0) problems.push('overlapping');
      if (zone.status === 'draft') problems.push('draft');

      return {
        zone,
        overlapsWith,
        problems,
        stats: {
          leadsTotal: inside.length,
          leadsThisMonth: inside.filter(
            (l) => new Date(l.createdAt).getTime() >= monthStart.getTime(),
          ).length,
          conversions: won.length,
          conversionRate: closed.length ? won.length / closed.length : 0,
          areaKm2: Math.round(areaKm2 * 10) / 10,
          density: areaKm2 > 0 ? Math.round((inside.length / areaKm2) * 10) / 10 : 0,
          assignedSurveyors: surveyors.filter((u) => zone.assignedUserIds.includes(u.id)),
        },
      };
    });
  }, [zones, leads, surveyors]);

  const unassignedLeads = useMemo(
    () => leads.filter((lead) => !zones.some((zone) => pointInPolygon(lead.location, zone.points))),
    [leads, zones],
  );

  const selected = rows.find((r) => r.zone.id === selectedId) ?? null;

  const mutateSelected = useCallback(
    (mutate: (zone: GeoZone) => GeoZone) => {
      setZones((current) =>
        current.map((zone) => (zone.id === selectedId ? mutate(zone) : zone)),
      );
      setDirty(true);
    },
    [selectedId],
  );

  const nudge = useCallback(
    (edge: Edge, direction: 1 | -1) => {
      mutateSelected((zone) => {
        const box = polygonBounds(zone.points);
        const delta = NUDGE_STEP * direction;
        const next = { ...box };
        if (edge === 'north') next.maxLat += delta;
        if (edge === 'south') next.minLat -= delta;
        if (edge === 'east') next.maxLng += delta;
        if (edge === 'west') next.minLng -= delta;

        // Refuse to invert the box — that would produce a shape with no inside.
        if (next.maxLat <= next.minLat || next.maxLng <= next.minLng) return zone;

        return {
          ...zone,
          points: [
            { lat: next.maxLat, lng: next.minLng },
            { lat: next.maxLat, lng: next.maxLng },
            { lat: next.minLat, lng: next.maxLng },
            { lat: next.minLat, lng: next.minLng },
          ],
        };
      });
    },
    [mutateSelected],
  );

  const toggleSurveyor = useCallback(
    (userId: string) => {
      mutateSelected((zone) => ({
        ...zone,
        assignedUserIds: zone.assignedUserIds.includes(userId)
          ? zone.assignedUserIds.filter((id) => id !== userId)
          : [...zone.assignedUserIds, userId],
      }));
    },
    [mutateSelected],
  );

  const toggleStatus = useCallback(() => {
    mutateSelected((zone) => ({
      ...zone,
      status: zone.status === 'active' ? 'draft' : 'active',
    }));
  }, [mutateSelected]);

  const save = useCallback(async () => {
    const zone = zones.find((z) => z.id === selectedId);
    if (!zone) return;
    setSaving(true);
    try {
      // Boundary changes apply from now on. Leads already captured today keep
      // whatever territory they were assigned at capture time — redrawing a
      // line must not retroactively invalidate a surveyor's completed work.
      await repository.saveZone(zone);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [zones, selectedId, repository]);

  return {
    status,
    rows,
    surveyors,
    unassignedLeads,
    selectedId,
    select: setSelectedId,
    selected,
    nudge,
    toggleSurveyor,
    toggleStatus,
    save,
    saving,
    dirty,
    reload,
  };
}
