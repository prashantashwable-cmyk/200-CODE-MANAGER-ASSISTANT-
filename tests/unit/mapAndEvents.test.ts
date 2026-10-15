/** The map's privacy rules and the event log, through the Repository interface the screens use. A server must keep all of these. */
import { beforeAll, describe, expect, it } from 'vitest';
import { chaos } from '@/data/repository';
import type { Repository } from '@/data/repository';
import type { Lead } from '@/data/types';

let repo: Repository;
const OWNER = 'u-owner-1';
const ADMIN = 'u-admin-1';
const SCOUT = 'u-srv-1';
const OTHER_SCOUT = 'u-srv-2';

async function refusal(p: Promise<unknown>): Promise<string> {
  try { await p; return 'ok'; } catch (e) { return e instanceof Error ? e.message : String(e); }
}

beforeAll(async () => {
  chaos.minLatency = 0; chaos.maxLatency = 0; chaos.failureRate = 0;
  repo = (await import('@/data/memoryRepository')).memoryRepository;
});

const newLead = (surveyorId: string): Omit<Lead, 'id' | 'code' | 'originalSurveyorId' | 'createdAt' | 'updatedAt' | 'stageEnteredAt' | 'isDemo'> => ({
  stage: 'captured', surveyorId, source: 'field_survey', builderName: 'Test Builders', contactName: 'Mr Test', contactPhone: '9822000111', siteName: 'Privacy Test Heights', address: 'Plot 4', city: 'Pune', pincode: '411057',
  location: { lat: 18.5913, lng: 73.7389 }, photos: [], estimatedValue: 900_000, incentiveAmount: 5_000, incentiveStatus: 'projected',
}) as never;

describe('map: what each role may see of a site', () => {
  it('the Owner sees every site exactly; Admin sees no single site, only density', async () => {
    const owner = await repo.listMapSites(OWNER);
    expect(owner.pins.length).toBeGreaterThan(0);
    expect(owner.pins.every((p) => p.level === 'exact' && p.contact === 'full')).toBe(true);
    // Four captures in one spot make a cell Admin may see; a lone lead elsewhere never shows.
    const far = { ...newLead(SCOUT), location: { lat: 18.4701, lng: 73.9201 } } as never;
    await repo.createLead(far);
    for (let i = 0; i < 4; i += 1) await repo.createLead(newLead(SCOUT));
    const admin = await repo.listMapSites(ADMIN);
    expect(admin.pins).toEqual([]);
    const cell = admin.density.find((c) => Math.abs(c.lat - 18.5913) < 0.01 && Math.abs(c.lng - 73.7389) < 0.01);
    expect(cell?.count).toBeGreaterThanOrEqual(4);
    expect(admin.density.every((c) => c.count >= 3)).toBe(true);
    expect(admin.density.some((c) => Math.abs(c.lat - 18.4701) < 0.01 && Math.abs(c.lng - 73.9201) < 0.01)).toBe(false);
    expect(JSON.stringify(admin)).not.toContain('9822000111');
  });
  it('a scout sees only the leads they own, and sees their contact', async () => {
    const mine = await repo.listMapSites(SCOUT);
    const owner = await repo.listMapSites(OWNER);
    expect(mine.pins.length).toBeGreaterThan(0);
    expect(mine.pins.length).toBeLessThan(owner.pins.length);
    expect(mine.pins.every((p) => p.mine && p.level === 'exact')).toBe(true);
  });
  it('a technician with no part in an offered site is shown it approximate; the real point never leaves', async () => {
    const real = new Map((await repo.listMapSites(OWNER)).pins.map((p) => [p.id, p.point!]));
    const view = await repo.listMapSites('u-tech-5', { lat: 18.55, lng: 73.8 });
    expect(view.pins.length).toBeGreaterThan(0); // the seed holds an open offer, so this is never vacuous
    for (const p of view.pins) {
      expect(p.level).toBe('fuzzed');
      expect(p.point).not.toEqual(real.get(p.id));
      expect(p.contact).toBe('masked');
      expect(p.label).toBe('Pune');
      expect(p.distanceM! % 100).toBe(0);
    }
    const json = JSON.stringify(view);
    // exact numbers only: a fuzzed 18.5515587 is not the real 18.5515, though it starts with the same digits
    for (const pt of real.values()) expect(new RegExp(`:${String(pt.lat).replace('.', '\\.')}(?![0-9])`).test(json)).toBe(false);
    expect(json).not.toContain('Kulkarni');
  });
  it('the same technician sees the site exactly once they are on the work', async () => {
    const real = new Map((await repo.listMapSites(OWNER)).pins.map((p) => [p.id, p.point!]));
    const view = await repo.listMapSites('u-tech-3');
    expect(view.pins.length).toBeGreaterThan(0);
    for (const p of view.pins) { expect(p.level).toBe('exact'); expect(p.point).toEqual(real.get(p.id)); }
  });
  it('a customer sees only their own site', async () => {
    const view = await repo.listMapSites('u-cust-1');
    expect(view.pins.length).toBeGreaterThan(0);
    expect(view.pins.length).toBeLessThan((await repo.listMapSites(OWNER)).pins.length);
  });
});

describe('event log through the repository', () => {
  it('capturing a lead writes a lead.captured event that its scout and the Owner can read, and another scout cannot', async () => {
    const lead = await repo.createLead(newLead(SCOUT));
    const mine = await repo.listEvents(SCOUT, { subject: { kind: 'lead', id: lead.id } });
    expect(mine.map((e) => e.type)).toEqual(['lead.captured']);
    expect(mine[0].actor).toEqual({ role: 'surveyor', id: SCOUT });
    expect((await repo.listEvents(OWNER, { subject: { kind: 'lead', id: lead.id } })).length).toBe(1);
    expect(await repo.listEvents(OTHER_SCOUT, { subject: { kind: 'lead', id: lead.id } })).toEqual([]);
    const asAdmin = (await repo.listEvents(ADMIN, { subject: { kind: 'lead', id: lead.id } }))[0];
    expect(asAdmin.type).toBe('lead.captured');
  });
  it('Admin cannot write or correct; the Owner decides a late correction; the chain stays whole', async () => {
    const lead = await repo.createLead(newLead(SCOUT));
    const [captured] = await repo.listEvents(SCOUT, { subject: { kind: 'lead', id: lead.id } });
    expect(await refusal(repo.appendEvent(ADMIN, { type: 'lead.photo_added', subject: { kind: 'lead', id: lead.id } }))).toBe('admin_read_only');
    expect(await refusal(repo.correctEvent(ADMIN, captured.id, { city: 'X' }, 'Admin tries to correct it.'))).toBe('admin_cannot_correct');
    const flagged = await repo.markEvent(ADMIN, captured.id, 'flagged', 'The pin looks off the road.');
    expect(flagged.type).toBe('event.flagged');
    const fix = await repo.correctEvent(SCOUT, captured.id, { siteName: 'Privacy Test Heights, Block B' }, 'Missed the block name.');
    expect(fix.status).toBe('applied');
    expect((await repo.getEffectiveEvent(SCOUT, captured.id)).payload.siteName).toBe('Privacy Test Heights, Block B');
    expect((await repo.listEvents(SCOUT, { subject: { kind: 'lead', id: lead.id } })).find((e) => e.id === captured.id)!.payload.siteName).toBe('Privacy Test Heights');
    expect((await repo.verifyEventLog(OWNER)).ok).toBe(true);
    expect(await refusal(repo.verifyEventLog(SCOUT))).toBe('forbidden');
  });
});

describe('lead capture and ownership through the repository', () => {
  // far from every seeded lead, so nothing here collides with demo data
  const SITE = { lat: 18.4402, lng: 73.9702 };
  const draft = (surveyorId: string, over: Record<string, unknown> = {}) => ({ ...newLead(surveyorId), location: SITE, siteName: 'Ownership Test Towers', contactPhone: '9822000222', ...over }) as never;
  const HOUR = 3_600_000;

  it('the first capture claims; the same site again an hour later, by another scout, is supporting evidence and makes no second lead', async () => {
    const before = (await repo.listMapSites(OWNER)).pins.length;
    const first = await repo.submitLeadCapture(SCOUT, { clientEventId: 'own-1', draft: draft(SCOUT), accuracyM: 8, capturedAt: new Date(Date.now() - 2 * HOUR).toISOString() });
    expect(first.outcome).toBe('claimed');
    const second = await repo.submitLeadCapture(OTHER_SCOUT, { clientEventId: 'own-2', draft: draft(OTHER_SCOUT), accuracyM: 10, capturedAt: new Date(Date.now() - 1 * HOUR).toISOString() });
    expect(second).toMatchObject({ outcome: 'supporting', ownerLeadId: first.lead.id });
    expect((await repo.listMapSites(OWNER)).pins.length).toBe(before + 1);
    // the second scout is not a rival: they are told, on their own log, what happened
    const theirLog = await repo.listEvents(OTHER_SCOUT, { family: 'lead' });
    expect(theirLog.some((e) => e.type === 'lead.duplicate_detected' && e.payload.supportingFor === first.lead.id)).toBe(true);
  });
  it('a retry of the same capture changes nothing (an offline resend after a dropped connection)', async () => {
    const a = await repo.submitLeadCapture(SCOUT, { clientEventId: 'retry-1', draft: draft(SCOUT, { location: { lat: 18.43, lng: 73.95 } }), accuracyM: 7 });
    const b = await repo.submitLeadCapture(SCOUT, { clientEventId: 'retry-1', draft: draft(SCOUT, { location: { lat: 18.43, lng: 73.95 } }), accuracyM: 7 });
    expect(a.outcome).toBe('claimed');
    expect(b.duplicate).toBe(true);
    expect(b.lead.id).toBe(a.lead.id);
    expect((await repo.listEvents(SCOUT, { subject: { kind: 'lead', id: a.lead.id } })).filter((e) => e.type === 'lead.captured')).toHaveLength(1);
  });
  it('two scouts minutes apart cannot be ordered, so both leads exist and the Owner gets a card to settle it', async () => {
    const at = { lat: 18.4301, lng: 73.9301 };
    const a = await repo.submitLeadCapture(SCOUT, { clientEventId: 'race-1', draft: draft(SCOUT, { location: at }), accuracyM: 6 });
    const b = await repo.submitLeadCapture(OTHER_SCOUT, { clientEventId: 'race-2', draft: draft(OTHER_SCOUT, { location: at }), accuracyM: 6 });
    expect(a.outcome).toBe('claimed');
    expect(b.outcome).toBe('review');
    if (b.outcome !== 'review') throw new Error('unreachable');
    expect(b.lead.duplicateOfLeadId).toBe(a.lead.id);
    const cards = await repo.listDecisionCards(OWNER, { status: 'open' });
    const card = cards.cards.find((c) => c.id === b.decisionCardId)!;
    expect(card).toMatchObject({ kind: 'lead_ownership_dispute', proposedBy: { role: 'system' } });
    // the card names the two scouts, not whoever happened to submit
    expect(card.summary).toContain('Ganesh Pawar');
    expect(card.summary).toContain('Sunita Deshmukh');
    // Admin sees that a decision exists, not who the scouts were or what the evidence is
    const adminCards = await repo.listDecisionCards(ADMIN, { status: 'open' });
    expect(JSON.stringify(adminCards)).not.toContain('Second capture');
  });
  it('a scout cannot capture in another scout\'s name, and Admin cannot capture at all', async () => {
    expect(await refusal(repo.submitLeadCapture(SCOUT, { clientEventId: 'imp-1', draft: draft(OTHER_SCOUT) }))).toBe('forbidden');
    expect(await refusal(repo.submitLeadCapture(ADMIN, { clientEventId: 'imp-2', draft: draft(ADMIN) }))).toBe('forbidden');
    expect(await refusal(repo.submitLeadCapture(SCOUT, { clientEventId: '', draft: draft(SCOUT) }))).toBe('client_event_id_required');
    expect(await refusal(repo.submitLeadCapture(SCOUT, { clientEventId: 'bad-loc', draft: draft(SCOUT, { location: { lat: 999, lng: 0 } }) }))).toBe('location_invalid');
  });
  it('an old offline capture keeps its own time in the log, not the time it was sent', async () => {
    const hoursAgo = new Date(Date.now() - 6 * HOUR).toISOString();
    const r = await repo.submitLeadCapture(SCOUT, { clientEventId: 'old-1', draft: draft(SCOUT, { location: { lat: 18.42, lng: 73.92 } }), accuracyM: 9, capturedAt: hoursAgo });
    const [ev] = (await repo.listEvents(SCOUT, { subject: { kind: 'lead', id: r.lead.id } })).filter((e) => e.type === 'lead.captured');
    expect(ev.capturedAt).toBe(hoursAgo);
    expect(ev.receivedAt).not.toBe(hoursAgo);
    expect(ev.geo?.accuracyM).toBe(9);
  });
  it('a different scout claiming an earlier capture that arrives late cannot be verified, so the Owner decides rather than the late one winning', async () => {
    const at = { lat: 18.4101, lng: 73.9101 };
    const onRecord = await repo.submitLeadCapture(SCOUT, { clientEventId: 'late-1', draft: draft(SCOUT, { location: at }), accuracyM: 6, capturedAt: new Date(Date.now() - HOUR).toISOString() });
    const late = await repo.submitLeadCapture(OTHER_SCOUT, { clientEventId: 'late-2', draft: draft(OTHER_SCOUT, { location: at }), accuracyM: 6, capturedAt: new Date(Date.now() - 5 * HOUR).toISOString() });
    expect(onRecord.outcome).toBe('claimed');
    expect(late.outcome).toBe('review');
  });
});
