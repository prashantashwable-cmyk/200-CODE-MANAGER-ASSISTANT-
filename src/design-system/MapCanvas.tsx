import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import L from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';

/**
 * A real, tile-based operations map for every map-pattern screen (live map,
 * tracking detail, geo-fence, heatmap, route optimization).
 *
 * Built on Leaflet + OpenStreetMap raster tiles — no API key or billing
 * account required, unlike Google Maps. Every screen consumes markers, zones,
 * heat cells and routes through the same props as before; only this
 * component's internals changed, so no calling screen needed to change.
 *
 * Attribution to OpenStreetMap contributors is required by their tile usage
 * policy and is rendered by Leaflet's built-in attribution control — do not
 * remove it.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export type MapTone = 'accent' | 'emerald' | 'success' | 'warning' | 'error' | 'muted';

export interface MapMarker extends GeoPoint {
  id: string;
  tone?: MapTone;
  /** Already-translated accessible label. */
  label: string;
  /** Rendered inside the pin — an initial, a count, or nothing. */
  glyph?: string;
  selected?: boolean;
  pulsing?: boolean;
  onClick?: () => void;
}

export interface MapZone {
  id: string;
  points: GeoPoint[];
  tone?: MapTone;
  label?: string;
  onClick?: () => void;
  selected?: boolean;
}

export interface MapHeatCell extends GeoPoint {
  id: string;
  /** 0..1 — drives radius and opacity. */
  weight: number;
}

export interface MapRoute {
  id: string;
  points: GeoPoint[];
  tone?: MapTone;
  /** Dashed reads as "proposed", solid as "actual travelled". */
  dashed?: boolean;
}

interface MapCanvasProps {
  markers?: MapMarker[];
  zones?: MapZone[];
  heat?: MapHeatCell[];
  routes?: MapRoute[];
  bounds?: MapBounds;
  height?: number | string;
  /** Overlay chrome — filter chips, legends, a recentre button. */
  children?: ReactNode;
  /** Accessible name for the map region. */
  label: string;
  className?: string;
  /** Fires with the tapped coordinate — for manual pin-drop adjustment. */
  onMapClick?: (point: GeoPoint) => void;
}

/** Pune / Pimpri-Chinchwad operating area — where the seeded demo data sits. */
export const DEFAULT_BOUNDS: MapBounds = {
  minLat: 18.44,
  maxLat: 18.68,
  minLng: 73.72,
  maxLng: 73.99,
};

const TONE_VAR: Record<MapTone, string> = {
  accent: 'var(--color-accent-primary)',
  emerald: 'var(--color-accent-secondary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  muted: 'var(--color-text-secondary)',
};

/**
 * Kept for callers that still want a flat-plane projection of a point within a
 * bounding box (e.g. laying out a legend) — no longer used by this component
 * itself now that positioning is real lat/lng handled by Leaflet.
 */
export function project(point: GeoPoint, bounds: MapBounds): { x: number; y: number } {
  const spanLng = bounds.maxLng - bounds.minLng || 1;
  const spanLat = bounds.maxLat - bounds.minLat || 1;
  return {
    x: ((point.lng - bounds.minLng) / spanLng) * 1000,
    y: 640 - ((point.lat - bounds.minLat) / spanLat) * 640,
  };
}

function boundsToLatLngBounds(bounds: MapBounds): L.LatLngBoundsExpression {
  return [
    [bounds.minLat, bounds.minLng],
    [bounds.maxLat, bounds.maxLng],
  ];
}

/** Fits the view to `bounds` once on mount and whenever `bounds` itself
 *  changes — not on every marker update, so a live-polling screen never
 *  yanks the map out from under someone who has panned or zoomed. */
function FitToBounds({ bounds }: { bounds: MapBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(boundsToLatLngBounds(bounds), { padding: [24, 24] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng]);
  return null;
}

/** Reports taps on the map itself — used for manual pin-drop adjustment. */
function ClickReporter({ onMapClick }: { onMapClick: (point: GeoPoint) => void }) {
  useMapEvents({
    click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

/** Sets an accessible name on Leaflet's container div, which has no prop for it. */
function AccessibleLabel({ label }: { label: string }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().setAttribute('aria-label', label);
    map.getContainer().setAttribute('role', 'region');
  }, [map, label]);
  return null;
}

function pinIcon(marker: MapMarker): L.DivIcon {
  const color = TONE_VAR[marker.tone ?? 'accent'];
  const size = marker.selected ? 30 : 24;
  return L.divIcon({
    className: 'ds-leaflet-icon',
    html: `
      <div class="ds-leaflet-pin${marker.pulsing ? ' ds-leaflet-pin--pulsing' : ''}" style="--pin-color:${color}">
        ${marker.pulsing ? '<span class="ds-leaflet-pin__ring"></span>' : ''}
        <span class="ds-leaflet-pin__dot" style="width:${size}px;height:${size}px;border-width:${marker.selected ? 4 : 3}px;">
          ${marker.glyph ? `<span class="ds-leaflet-pin__glyph">${marker.glyph}</span>` : ''}
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function MapCanvas({
  markers = [],
  zones = [],
  heat = [],
  routes = [],
  bounds = DEFAULT_BOUNDS,
  height = 320,
  children,
  label,
  className = '',
  onMapClick,
}: MapCanvasProps) {
  const centerRef = useRef<[number, number]>([
    (bounds.minLat + bounds.maxLat) / 2,
    (bounds.minLng + bounds.maxLng) / 2,
  ]);

  return (
    <div
      className={`ds-map ${className}`.trim()}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <MapContainer
        center={centerRef.current}
        zoom={12}
        scrollWheelZoom
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Top-left is reserved for screen overlay chrome (status pills,
            legends) via .ds-map__overlay, so zoom controls move out of the way. */}
        <ZoomControl position="topright" />
        <FitToBounds bounds={bounds} />
        <AccessibleLabel label={label} />
        {onMapClick && <ClickReporter onMapClick={onMapClick} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Heat first — it belongs under everything else. */}
        {heat.map((cell) => (
          <CircleMarker
            key={cell.id}
            center={[cell.lat, cell.lng]}
            radius={16 + cell.weight * 34}
            pathOptions={{
              stroke: false,
              fillColor: 'var(--color-warning)',
              fillOpacity: 0.18 + cell.weight * 0.42,
            }}
          />
        ))}

        {/* Geo-fence territories. */}
        {zones.map((zone) => {
          const color = TONE_VAR[zone.tone ?? 'emerald'];
          return (
            <Polygon
              key={zone.id}
              positions={zone.points.map((p) => [p.lat, p.lng])}
              pathOptions={{
                color,
                weight: zone.selected ? 3 : 2,
                fillColor: color,
                fillOpacity: zone.selected ? 0.22 : 0.1,
                dashArray: '8 6',
              }}
              eventHandlers={zone.onClick ? { click: zone.onClick } : undefined}
            >
              {zone.label && <Tooltip sticky>{zone.label}</Tooltip>}
            </Polygon>
          );
        })}

        {/* Routes — travelled or proposed. */}
        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: TONE_VAR[route.tone ?? 'accent'],
              weight: 4,
              opacity: 0.9,
              dashArray: route.dashed ? '10 8' : undefined,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ))}

        {/* Markers on top. */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={pinIcon(marker)}
            keyboard={Boolean(marker.onClick)}
            eventHandlers={marker.onClick ? { click: marker.onClick } : undefined}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              {marker.label}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      {children}
    </div>
  );
}
