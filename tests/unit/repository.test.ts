/**
 * The repository's own guarantees, exercised through the same `Repository` interface the screens use. These are the rules a
 * server must keep enforcing when the in-memory store is replaced: run them against the new implementation too.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { chaos } from '@/data/repository';
import type { Repository } from '@/data/repository';

const ADMIN = 'u-admin-1';
let repo: Repository;

/** A repository call's refusal code, or 'ok'. */
async function refusal(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'ok';
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

beforeAll(async () => {
  chaos.minLatency = 0;
  chaos.maxLatency = 0;
  chaos.failureRate = 0;
  repo = (await import('@/data/memoryRepository')).memoryRepository;
});

describe('field partner sign-up (005 / 006 → 004)', () => {
  let zones: string[] = [];
  let userId = '';

  it('saves a pending account with what the applicant gave', async () => {
    zones = (await repo.listZones()).filter((z) => z.status === 'active').slice(0, 2).map((z) => z.id);
    const u = await repo.submitFieldPartnerOnboarding({
      role: 'surveyor', name: 'Kiran Patil', phone: '+91 91234 00001', city: 'Pune', preferredZoneIds: zones, aadhaarLast4: '4821', documents: [],
      bank: { holderName: 'Kiran Patil', accountNumber: '123456789011', ifsc: 'HDFC0001234', verified: false },
    });
    userId = u.id;
    expect(u).toMatchObject({ role: 'surveyor', status: 'pending_approval', phone: '9123400001' });
    expect(u.onboarding).toMatchObject({ preferredZoneIds: zones, aadhaarLast4: '4821', bankVerified: false });
    expect((await repo.listUsers({ status: 'pending_approval' })).some((x) => x.id === u.id)).toBe(true);
  });

  it('refuses a second application while the first waits, and a number another role uses', async () => {
    expect(await refusal(repo.submitFieldPartnerOnboarding({ role: 'surveyor', name: 'Kiran Patil', phone: '9123400001', city: 'Pune', preferredZoneIds: zones, documents: [] }))).toBe('already_applied');
    expect(await refusal(repo.submitFieldPartnerOnboarding({ role: 'technician', name: 'Some One', phone: '9822011001', city: 'Pune', skills: ['electrical'], documents: [] }))).toBe('phone_taken');
  });

  it('never accepts more than the last four digits of an Aadhaar number', async () => {
    expect(await refusal(repo.submitFieldPartnerOnboarding({ role: 'technician', name: 'Tara Shinde', phone: '9123400009', city: 'Pune', skills: ['electrical'], aadhaarLast4: '234567890124', documents: [] }))).toBe('invalid_input');
  });

  it('puts the decision in front of Admin as a commitment', async () => {
    await repo.runFollowUpEngine();
    expect(JSON.stringify(await repo.listMyWork(ADMIN))).toContain(`onboarding_review:user:${userId}`);
  });

  it('lets only an active Admin decide, once, and approval assigns the zones asked for', async () => {
    expect(await refusal(repo.decidePendingUser(userId, true, 'u-srv-1'))).toBe('forbidden');
    const approved = await repo.decidePendingUser(userId, true, ADMIN);
    expect(approved.status).toBe('active');
    const after = await repo.listZones();
    for (const id of zones) expect(after.find((z) => z.id === id)?.assignedUserIds).toContain(userId);
    expect(await refusal(repo.decidePendingUser(userId, false, ADMIN))).toBe('not_pending');
    expect((await repo.listRoleAudit(5))[0]).toMatchObject({ userId, decision: 'approved', changedByAdminId: ADMIN });
  });
});

describe('customer confirmation (008)', () => {
  it('creates the account, links the won deal and records the SMS choice', async () => {
    const leads = await repo.listLeads();
    const customers = await repo.listUsers({ role: 'customer' });
    const l10 = (p: string) => p.replace(/\D/g, '').slice(-10);
    const deals = await repo.listDeals();
    const lead = leads.find((l) => !customers.some((c) => l10(c.phone) === l10(l.contactPhone)) && deals.some((d) => d.leadId === l.id && d.status === 'won' && !d.customerId));
    expect(lead).toBeDefined();
    const res = await repo.confirmCustomerAccount({ leadId: lead!.id, name: lead!.contactName, phone: lead!.contactPhone, siteAddress: lead!.address, city: lead!.city, pincode: lead!.pincode, language: 'hi', consent: { sms: false, whatsapp: true, dataUsage: true } });
    expect(res).toMatchObject({ existing: false, linkedDeals: 1 });
    expect(res.user).toMatchObject({ role: 'customer', status: 'active', preferredLanguage: 'hi' });
    expect(await repo.isOptedOut(lead!.contactPhone, 'sms')).toBe(true);
    expect(await repo.isOptedOut(lead!.contactPhone, 'whatsapp')).toBe(false);
    const again = await repo.confirmCustomerAccount({ leadId: lead!.id, name: lead!.contactName, phone: lead!.contactPhone, siteAddress: '', city: lead!.city, pincode: '', language: 'hi', consent: { sms: false, whatsapp: true, dataUsage: true } });
    expect(again.existing).toBe(true);
    expect(again.user.id).toBe(res.user.id);
  });

  it('refuses a number that belongs to a partner', async () => {
    const lead = (await repo.listLeads())[0];
    expect(await refusal(repo.confirmCustomerAccount({ leadId: lead.id, name: 'Some One', phone: '9822022001', siteAddress: '', city: 'Pune', pincode: '', language: 'en', consent: { sms: true, whatsapp: true, dataUsage: true } }))).toBe('phone_taken');
  });
});

describe('partner application identity (142)', () => {
  it('reduces a full Aadhaar number that reaches the repository and refuses a long "last four"', async () => {
    const view = await repo.getPartnerApplication('ap-1', { key: 'demo-key-1' });
    const saved = await repo.savePartnerApplication('ap-1', 'demo-key-1', { identity: { ...view.form.identity, aadhaarNumber: '2345 6789 0124' } });
    expect(saved.form.identity).toMatchObject({ aadhaarNumber: '', aadhaarLast4: '0124', aadhaarChecked: true });
    expect(JSON.stringify(saved)).not.toMatch(/2345\s?6789\s?0124/);
    expect(await refusal(repo.savePartnerApplication('ap-1', 'demo-key-1', { identity: { ...saved.form.identity, aadhaarLast4: '234567890124' } }))).toBe('invalid_input');
  });
});

describe('putting a technician in charge of a job (020)', () => {
  let jobId = '';

  it('gets a job with nobody on it through the real delivery-booking path', async () => {
    const before = new Set((await repo.listJobs()).map((j) => j.id));
    const board = await repo.getDeliveryBoard(ADMIN);
    for (const c of board.cards.filter((x) => !x.schedule)) {
      if ((await repo.listJobs()).some((j) => j.dealId === c.dealId)) continue;
      await repo.setSiteReadiness(c.dealId, { items: { shaft_civil: true, pit_depth: true, machine_room: true, power_supply: true, access_route: true, storage_space: true }, contactName: 'Site Engineer' }, ADMIN);
      const day = (await repo.getDeliverySlots(c.poId, ADMIN))?.days.find((d) => d.windows.some((w) => w.state === 'free'));
      if (!day) continue;
      await repo.scheduleDelivery(c.poId, { date: day.date, window: day.windows.find((w) => w.state === 'free')!.window, lateCause: 'aiec', note: 'booked by the test' }, ADMIN);
      break;
    }
    const created = (await repo.listJobs()).find((j) => !before.has(j.id));
    expect(created?.technicianId).toBeFalsy();
    jobId = created!.id;
  });

  it('reads real reasons, and the repository refuses what the screen would not offer', async () => {
    const facts = await repo.getAssignmentFacts({ jobId }, ADMIN);
    expect(facts.find((f) => f.userId === 'u-tech-3')?.block).toBe('training_incomplete');
    expect(await refusal(repo.getAssignmentFacts({ jobId }, 'u-srv-1'))).toBe('forbidden');
    expect(await refusal(repo.assignJobLead(jobId, 'u-tech-3', ADMIN))).toBe('training_incomplete');
    const free = facts.find((f) => f.block === null)!;
    const job = await repo.assignJobLead(jobId, free.userId, ADMIN);
    expect(job.technicianId).toBe(free.userId);
    expect(job.teamLog?.at(-1)?.kind).toBe('added');
    expect(await refusal(repo.assignJobLead(jobId, free.userId, ADMIN))).toBe('already_assigned');
  });
});

describe('alerts shared across Admins (029)', () => {
  it('keeps a snooze on the alert and bounds it', async () => {
    const alert = (await repo.listAlerts()).find((a) => a.status === 'open')!;
    expect(await refusal(repo.snoozeAlert(alert.id, 100, ADMIN))).toBe('invalid_input');
    expect((await repo.snoozeAlert(alert.id, 24, ADMIN)).snoozedUntil).toBeTruthy();
  });

  it('hands an alert to a real person, who then owns the follow-up', async () => {
    const alert = (await repo.listAlerts()).find((a) => a.status === 'open' && !a.snoozedUntil)!;
    expect(await refusal(repo.delegateAlert(alert.id, 'u-cust-1', ADMIN))).toBe('ineligible_assignee');
    await repo.delegateAlert(alert.id, 'u-srv-1', ADMIN);
    await repo.runFollowUpEngine();
    expect(JSON.stringify(await repo.listMyWork('u-srv-1'))).toContain(`alert_acknowledge:${alert.id}`);
  });
});

describe('saved reports and the supplier watchlist (030 / 026)', () => {
  it('keeps reports per person with unique names', async () => {
    await repo.saveReportDefinition(ADMIN, { name: 'Leads by stage', metric: 'leadCount', dimension: 'stage', range: 'last30' });
    expect(await refusal(repo.saveReportDefinition(ADMIN, { name: 'leads BY stage', metric: 'leadCount', dimension: 'stage', range: 'last30' }))).toBe('name_taken');
    expect((await repo.listSavedReports(ADMIN)).map((r) => r.name)).toContain('Leads by stage');
    expect(await repo.listSavedReports('u-srv-1')).toHaveLength(0);
  });

  it('keeps the manual watchlist on the supplier', async () => {
    const s = (await repo.listSuppliers()).find((x) => x.status === 'active')!;
    expect((await repo.setSupplierWatch(s.id, true, ADMIN)).watchlist?.byName).toBeTruthy();
    expect((await repo.setSupplierWatch(s.id, false, ADMIN)).watchlist).toBeUndefined();
  });
});

describe('performance scores are read from records, never invented (024 / 121 / 148)', () => {
  it('a technician with no quality checks or finished jobs is "not rated", not a number', async () => {
    const scores = await repo.getTechnicianScores();
    expect(scores.length).toBeGreaterThan(0);
    for (const s of scores) {
      expect(s.weeklyJobs).toHaveLength(8);
      expect(s.weeklyJobs.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(s.jobsCompleted);
      if (s.jobsCompleted === 0) {
        expect(s.onTimeRate).toBeNull();
        expect(s.avgDaysPerJob).toBeNull();
      }
      if (s.qcPassRate !== null) expect(s.qcPassRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("a surveyor's weekly wins never exceed their wins, and a lead count gives no response time without contact on record", async () => {
    for (const s of await repo.getSurveyorScores()) {
      expect(s.weeklyConversions).toHaveLength(8);
      expect(s.weeklyConversions.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(s.conversions);
      expect(s.weeklyRevenue.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(s.revenue);
      if (s.leadsCaptured === 0) expect(s.avgResponseHours).toBeNull();
    }
  });

  it('the same records give the same scores (nothing is drawn at random)', async () => {
    expect(await repo.getTechnicianScores()).toEqual(await repo.getTechnicianScores());
    expect(await repo.getSurveyorScores()).toEqual(await repo.getSurveyorScores());
  });
});
