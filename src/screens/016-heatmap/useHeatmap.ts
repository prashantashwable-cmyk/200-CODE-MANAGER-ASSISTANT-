import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { pointInPolygon, polygonAreaKm2 } from '@/design-system';
import type { GeoZone, Lead } from '@/data/types';
import { MIN_SAMPLE } from './heatmap.types';
import type { HeatMetric, HeatmapStatus, RangeId, ZoneHeat } from './heatmap.types';

interface HeatmapState {
  status: HeatmapStatus;
  metric: HeatMetric;
  setMetric: (metric: HeatMetric) => void;
  range: RangeId;
  setRange: (range: RangeId) => void;
  zones: ZoneHeat[];
  /** Zones producing volume but converting poorly — the point of the screen. */
  conversionGaps: ZoneHeat[];
  reload: () => Promise<void>;
}

/**
 * Owns the strategic view of where leads come from and where they actually
 * close.
 *
 * This is a visualisation layer over the same lead records every other screen
 * reads — there is no separate dataset. It is also explicitly not live: this is
 * a planning view, and a colour that shifts while you are reading it is worse
 * than one that is a few hours old.
 */
export function useHeatmap(): HeatmapState {
  const repository = useData();

  const [status, setStatus] = useState<HeatmapStatus>('loading');
  const [metric, setMetric] = useState<HeatMetric>('leads');
  const [range, setRange] = useState<RangeId>('30');
  const [rawZones, setRawZones] = useState<GeoZone[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const [zoneList, leadList] = await Promise.all([
        repository.listZones(),
        repository.listLeads(),
      ]);
      setRawZones(zoneList);
      setLeads(leadList);
      setStatus(zoneList.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const zones = useMemo<ZoneHeat[]>(() => {
    const days = Number(range);
    const now = Date.now();
    const windowStart = now - days * 86_400_000;
    // The comparison window is the same length, immediately before this one.
    const previousStart = windowStart - days * 86_400_000;

    const rows = rawZones.map((zone) => {
      const inside = leads.filter((lead) => pointInPolygon(lead.location, zone.points));
      const inWindow = inside.filter((l) => new Date(l.createdAt).getTime() >= windowStart);
      const inPrevious = inside.filter((l) => {
        const t = new Date(l.createdAt).getTime();
        return t >= previousStart && t < windowStart;
      });

      const dealCount = inWindow.filter((l) => l.stage === 'won').length;
      const closed = inWindow.filter((l) => l.stage === 'won' || l.stage === 'lost').length;
      const areaKm2 = polygonAreaKm2(zone.points);
      const count = metric === 'leads' ? inWindow.length : dealCount;

      const previousCount =
        metric === 'leads'
          ? inPrevious.length
          : inPrevious.filter((l) => l.stage === 'won').length;

      return {
        zone,
        leadCount: inWindow.length,
        dealCount,
        areaKm2: Math.round(areaKm2 * 10) / 10,
        density: areaKm2 > 0 ? count / areaKm2 : 0,
        intensity: 0,
        conversionRate: closed > 0 ? dealCount / closed : 0,
        // No prior activity at all means there is nothing to compare against —
        // reporting "+100%" from zero would be noise dressed as a signal.
        changePct: previousCount === 0 ? null : (count - previousCount) / previousCount,
        hasEnoughData: inWindow.length >= MIN_SAMPLE,
        // A window entirely before AIEC worked this zone is excluded rather
        // than shown as artificially cold.
        noCoverage: inside.length > 0 && inWindow.length === 0 && inPrevious.length === 0,
        leads: inWindow,
      };
    });

    // Intensity is relative to the busiest zone in this window, after
    // normalising by area.
    const peak = Math.max(...rows.map((r) => r.density), 0);
    return rows
      .map((row) => ({
        ...row,
        intensity: peak > 0 ? row.density / peak : 0,
      }))
      .sort((a, b) => b.density - a.density);
  }, [rawZones, leads, range, metric]);

  const conversionGaps = useMemo(
    () =>
      zones
        .filter((z) => z.hasEnoughData && z.leadCount >= MIN_SAMPLE && z.conversionRate < 0.25)
        .sort((a, b) => b.leadCount - a.leadCount),
    [zones],
  );

  return { status, metric, setMetric, range, setRange, zones, conversionGaps, reload };
}
