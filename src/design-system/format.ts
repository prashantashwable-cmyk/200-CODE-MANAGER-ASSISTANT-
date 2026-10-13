/**
 * Shared formatters. Every money figure in the app goes through these so the
 * lakh/crore grouping and the ₹ symbol are consistent on every screen.
 *
 * Digits stay Western (0-9) in all three languages — India's digital finance
 * UI convention, and the reason IBM Plex Mono is the numeral face regardless
 * of the surrounding script.
 */

/** ₹12,45,000 — full Indian digit grouping, no decimals. */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** ₹12.45L / ₹1.24Cr — for KPI tiles where the full figure won't fit. */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}

export function formatNumber(value: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** +91 98765 43210 — the format field staff read back over a phone. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

const LOCALE_BY_LANG: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

export function formatDate(iso: string, lang = 'en'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang] ?? 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(iso: string, lang = 'en'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang] ?? 'en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTime(iso: string, lang = 'en'): string {
  return `${formatDate(iso, lang)}, ${formatTime(iso, lang)}`;
}

/**
 * Relative time in whole units. Returns an i18n key + count so the caller can
 * translate it — this function never produces user-facing English itself.
 */
export function relativeTimeParts(iso: string, now = Date.now()): { key: string; count: number } {
  const then = new Date(iso).getTime();
  const diffSeconds = Math.round((now - then) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return { key: 'time.justNow', count: 0 };
  if (abs < 3600) return { key: 'time.minutesAgo', count: Math.floor(abs / 60) };
  if (abs < 86400) return { key: 'time.hoursAgo', count: Math.floor(abs / 3600) };
  return { key: 'time.daysAgo', count: Math.floor(abs / 86400) };
}

/** Straight-line km between two coordinates — good enough for field distances. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* -------------------------------------------------------------- Polygons --
   Territory geometry, shared by the geo-fence and heatmap screens. Polygons
   here are small enough that treating lat/lng as a flat plane is fine; over a
   city-sized area the projection error is far below the precision anyone acts
   on. Do not reuse these for country-scale shapes. */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Ray casting. Points exactly on an edge may fall either way — that's fine. */
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const straddles = a.lat > point.lat !== b.lat > point.lat;
    if (!straddles) continue;
    const crossingLng = ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (point.lng < crossingLng) inside = !inside;
  }
  return inside;
}

export function polygonBounds(polygon: LatLng[]) {
  const lats = polygon.map((p) => p.lat);
  const lngs = polygon.map((p) => p.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/** Approximate area in square kilometres, via the shoelace formula. */
export function polygonAreaKm2(polygon: LatLng[]): number {
  if (polygon.length < 3) return 0;
  const meanLat = polygon.reduce((sum, p) => sum + p.lat, 0) / polygon.length;
  const kmPerDegLat = 110.574;
  const kmPerDegLng = 111.32 * Math.cos((meanLat * Math.PI) / 180);
  let doubleArea = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].lng * kmPerDegLng;
    const yi = polygon[i].lat * kmPerDegLat;
    const xj = polygon[j].lng * kmPerDegLng;
    const yj = polygon[j].lat * kmPerDegLat;
    doubleArea += xj * yi - xi * yj;
  }
  return Math.abs(doubleArea / 2);
}

/** Do two territories overlap? Bounding boxes are enough for axis-aligned zones. */
export function polygonsOverlap(a: LatLng[], b: LatLng[]): boolean {
  const boxA = polygonBounds(a);
  const boxB = polygonBounds(b);
  return (
    boxA.minLat < boxB.maxLat &&
    boxA.maxLat > boxB.minLat &&
    boxA.minLng < boxB.maxLng &&
    boxA.maxLng > boxB.minLng
  );
}

/**
 * A hand-drawn shape that crosses itself is almost always a mistake, and it
 * makes point-in-polygon results meaningless. Checked before a zone is saved.
 */
export function polygonSelfIntersects(polygon: LatLng[]): boolean {
  const n = polygon.length;
  if (n < 4) return false;
  const intersects = (p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng) => {
    const d = (a: LatLng, b: LatLng, c: LatLng) =>
      (c.lat - a.lat) * (b.lng - a.lng) - (c.lng - a.lng) * (b.lat - a.lat);
    const d1 = d(p3, p4, p1);
    const d2 = d(p3, p4, p2);
    const d3 = d(p1, p2, p3);
    const d4 = d(p1, p2, p4);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
  };
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      // Skip edges that share a vertex — touching there is not crossing.
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      if (
        intersects(
          polygon[i],
          polygon[(i + 1) % n],
          polygon[j],
          polygon[(j + 1) % n],
        )
      ) {
        return true;
      }
    }
  }
  return false;
}
