import { describe, expect, it } from 'vitest';
import { aggregateDensity, contactLevel, distanceM, fuzzPin, gpsQuality, revealLevel, scrapeSignal, shownDistanceM } from '@/features/geo/privacy';

const SITE = { id: 'site-1', lat: 18.5913, lng: 73.7389 };
const SALT = 'server-only-secret';

describe('pin fuzzing', () => {
  it('is repeatable for one site and differs between sites', () => {
    const a = fuzzPin(SITE, 500, SALT);
    expect(fuzzPin(SITE, 500, SALT)).toEqual(a);
    expect(fuzzPin({ ...SITE, id: 'site-2' }, 500, SALT)).not.toEqual(a);
    expect(fuzzPin(SITE, 500, 'another-salt')).not.toEqual(a);
  });
  it('lands between 30% and 100% of the radius, never on the real place', () => {
    for (let i = 0; i < 200; i += 1) {
      const d = distanceM(SITE, fuzzPin({ ...SITE, id: `s-${i}` }, 500, SALT));
      expect(d).toBeGreaterThanOrEqual(500 * 0.3 - 2);
      expect(d).toBeLessThanOrEqual(500 + 2);
    }
  });
  it('the distance shown is to the fuzzed pin, rounded to 100 m, so readings do not converge on the truth', () => {
    const fuzzed = fuzzPin(SITE, 500, SALT);
    const from = { lat: 18.55, lng: 73.8 };
    const shown = shownDistanceM(from, fuzzed);
    expect(shown % 100).toBe(0);
    expect(Math.abs(shown - distanceM(from, fuzzed))).toBeLessThanOrEqual(50);
  });
});

describe('who sees where', () => {
  it('a partner sees a fuzzed pin when offered and the exact site only after accepting or the token', () => {
    expect(revealLevel('technician', 'lead', {})).toBe('none');
    expect(revealLevel('technician', 'offered', {})).toBe('fuzzed');
    expect(revealLevel('technician', 'accepted', {})).toBe('exact');
    expect(revealLevel('supplier', 'token_paid', {})).toBe('exact');
    expect(contactLevel('technician', 'offered', {})).toBe('masked');
    expect(contactLevel('technician', 'accepted', {})).toBe('full');
  });
  it('a scout sees only their own lead exactly, never others', () => {
    expect(revealLevel('surveyor', 'lead', { ownsLead: true })).toBe('exact');
    expect(revealLevel('surveyor', 'lead', { ownsLead: false })).toBe('none');
    expect(contactLevel('surveyor', 'lead', { ownsLead: false })).toBe('hidden');
  });
  it('Admin never gets an exact pin or an unmasked contact; the Owner gets both', () => {
    for (const stage of ['lead', 'offered', 'accepted', 'token_paid'] as const) {
      expect(revealLevel('admin', stage, {})).toBe('density');
      expect(contactLevel('admin', stage, {})).toBe('masked');
      expect(revealLevel('owner', stage, {})).toBe('exact');
    }
  });
  it('a customer sees only their own site', () => {
    expect(revealLevel('customer', 'accepted', { isCustomerOfSite: true })).toBe('exact');
    expect(revealLevel('customer', 'accepted', { isCustomerOfSite: false })).toBe('none');
  });
});

describe('aggregates and signals', () => {
  it('density hides small cells so one person cannot be located', () => {
    const near = Array.from({ length: 4 }, (_, i) => ({ lat: 18.591 + i * 0.0001, lng: 73.738 }));
    const lone = [{ lat: 18.7, lng: 73.9 }];
    const cells = aggregateDensity([...near, ...lone]);
    expect(cells).toHaveLength(1);
    expect(cells[0].count).toBe(4);
  });
  it('poor GPS accuracy is a flag, a missing one is unknown', () => {
    expect(gpsQuality(8, 30)).toBe('good');
    expect(gpsQuality(60, 30)).toBe('poor');
    expect(gpsQuality(null, 30)).toBe('unknown');
  });
  it('a partner panning across the whole city is a scrape signal; a normal day is not', () => {
    expect(scrapeSignal(Array.from({ length: 200 }, (_, i) => `s${i}`), 30).suspicious).toBe(true);
    expect(scrapeSignal(['a', 'b', 'c', 'a'], 30).suspicious).toBe(false);
  });
});
