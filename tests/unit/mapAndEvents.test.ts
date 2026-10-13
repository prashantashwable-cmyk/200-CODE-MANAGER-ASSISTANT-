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
  stage: 'captured', surveyorId, source: 'surveyor_field', builderName: 'Test Builders', contactName: 'Mr Test', contactPhone: '9822000111', siteName: 'Privacy Test Heights', address: 'Plot 4', city: 'Pune', pincode: '411057',
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
    for (const pt of real.values()) expect(json).not.toContain(String(pt.lat));
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
