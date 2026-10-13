/**
 * The AIEC design system — the single import surface for every screen.
 *
 * Screens import from '@/design-system' and nothing else for UI primitives.
 * If a screen needs something that isn't here, extend a component in this
 * folder rather than building a second, inconsistent version inside a screen.
 */

export { Card } from './Card';
export { Button } from './Button';
export { AscensionLine } from './AscensionLine';
export type { AscensionStep, AscensionStepStatus } from './AscensionLine';
export { Badge } from './Badge';
export type { BadgeTone } from './Badge';
export { Skeleton, LoadingState, EmptyState, ErrorState } from './States';
export { Field, Input, TextArea, Select, Toggle, Checkbox } from './Field';
export { OtpInput } from './OtpInput';
export { SignaturePad } from './SignaturePad';
export { Tabs, SegBar, Chip } from './Tabs';
export type { TabItem } from './Tabs';
export { Screen, ScreenHeader, ActionBar } from './Screen';
export { StatTile, ListRow, Avatar, ProgressBar } from './misc';
export { Sheet } from './Sheet';
export { ToastProvider, useToast } from './Toast';
export { MapCanvas, DEFAULT_BOUNDS, project } from './MapCanvas';
export type {
  GeoPoint,
  MapBounds,
  MapMarker,
  MapZone,
  MapHeatCell,
  MapRoute,
  MapTone,
} from './MapCanvas';
export {
  formatINR,
  formatINRCompact,
  formatNumber,
  formatPercent,
  formatPhone,
  formatDate,
  formatTime,
  formatDateTime,
  relativeTimeParts,
  haversineKm,
  pointInPolygon,
  polygonBounds,
  polygonAreaKm2,
  polygonsOverlap,
  polygonSelfIntersects,
} from './format';
export type { LatLng } from './format';
