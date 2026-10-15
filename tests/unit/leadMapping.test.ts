import { describe, expect, it } from 'vitest';
import { captureErrorCode, captureResultOf } from '@/data/supabase/leadMapping';
import type { LeadCaptureInput } from '@/data/repository';

const input = { clientEventId: 'c1', draft: { surveyorId: 's1', siteName: 'Test', location: { lat: 1, lng: 2 }, contactName: '', contactPhone: '', builderName: '', address: '', city: 'Pune', pincode: '' } } as unknown as LeadCaptureInput;
describe('lead capture result mapping', () => {
  it('maps the server verdicts to the names the screens use', () => {
    expect(captureResultOf({ outcome: 'claims', leadId: 'a', ownerLeadId: null, duplicate: false }, input, 'now').outcome).toBe('claimed');
    const sup = captureResultOf({ outcome: 'supporting', leadId: 'o', ownerLeadId: 'o', duplicate: false }, input, 'now');
    expect(sup.outcome === 'supporting' && sup.ownerLeadId).toBe('o');
    expect(captureResultOf({ outcome: 'review', leadId: 'n', ownerLeadId: 'o', reason: 'too_close_to_order', duplicate: true }, input, 'now').duplicate).toBe(true);
  });
  it('a supporting capture shows the scout only what they sent, never the other lead’s details', () => {
    const r = captureResultOf({ outcome: 'supporting', leadId: 'o', ownerLeadId: 'o', duplicate: false }, input, 'now');
    expect(r.lead.siteName).toBe('Test');
    expect(r.lead.surveyorId).toBe('s1');
  });
  it('turns database errors into known codes', () => {
    expect(captureErrorCode('forbidden')).toBe('forbidden');
    expect(captureErrorCode('fetch failed')).toBe('network');
  });
});
