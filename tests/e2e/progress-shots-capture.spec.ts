/** Review screenshots of quick capture and the ownership dispute card. Only with PROGRESS_DIR: PROGRESS_DIR=03 npx playwright test progress-shots-capture */
import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const DIR = `docs/evidence/progress/${process.env.PROGRESS_DIR ?? 'latest'}`;
async function fill(page: Page, code: string, scope = page.locator('body')) {
  const b = scope.locator('input'); await b.first().waitFor();
  if ((await b.count()) >= code.length) for (let i = 0; i < code.length; i += 1) await b.nth(i).fill(code[i]); else await b.first().fill(code);
}
async function signIn(page: Page, phone: string, second = false) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !document.body.innerText.includes('Getting things ready'));
  const skip = page.getByText('Skip', { exact: true }); const tel = page.locator('input[type="tel"]').first();
  await skip.or(tel).waitFor(); if (await skip.isVisible()) await skip.click();
  await tel.fill(phone); await page.getByRole('button', { name: /Send|Continue|OTP/i }).first().click();
  await page.waitForURL(/\/login\/otp/); await fill(page, '123456', page.getByRole('group', { name: /Verification code/i }));
  const v = page.getByRole('button', { name: /Verify/i }); if (await v.isVisible().catch(() => false)) await v.click();
  if (second) { const gate = page.locator('[data-sec-gate="second_factor"]'); await gate.waitFor(); await fill(page, '246810', gate); }
}
const go = (page: Page, p: string) => page.evaluate((x) => { history.pushState({}, '', x); dispatchEvent(new PopStateEvent('popstate')); }, p);

test('capture and dispute screenshots', async ({ browser }) => {
  test.skip(!process.env.PROGRESS_DIR, 'only when PROGRESS_DIR is set');
  test.setTimeout(240_000);
  mkdirSync(DIR, { recursive: true });

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await signIn(page, '9822022003');
  await page.waitForURL(/\/surveyor/);
  await go(page, '/capture'); await page.locator('.leaflet-container').waitFor();
  await ctx.setOffline(true);
  await page.getByText('No signal: captures wait on this phone').waitFor();
  await page.locator('.leaflet-container').click({ position: { x: 190, y: 150 } });
  await page.getByLabel('Site or project name').fill('Hinjawadi Phase 3, Plot 12');
  await page.getByLabel('Contact mobile number').fill('9822000333');
  await page.getByRole('button', { name: 'Save capture' }).click();
  await page.getByText('1 waiting to send').first().waitFor();
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${DIR}/capture-offline-waiting-phone.png`, fullPage: true });
  await ctx.setOffline(false);
  await page.getByText('Saved as a new lead').waitFor({ timeout: 30_000 });
  await page.locator('.leaflet-container').click({ position: { x: 190, y: 150 } });
  await page.getByLabel('Site or project name').fill('Hinjawadi Phase 3, Plot 12 (second visit)');
  await page.getByRole('button', { name: 'Save capture' }).click();
  await page.getByText('This site was already captured').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/capture-sent-and-supporting-phone.png`, fullPage: true });
  await ctx.close();

  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const owner = await ctx2.newPage();
  await signIn(owner, '9822011009', true);
  await owner.waitForURL(/\/owner/);
  await owner.evaluate(async () => {
    const repo = (window as unknown as { __aiecRepo: { submitLeadCapture(u: string, i: unknown): Promise<unknown> } }).__aiecRepo;
    const draft = (s: string) => ({ stage: 'captured', surveyorId: s, source: 'field_survey', builderName: '', contactName: 'Mr Patil', contactPhone: '9822000444', siteName: 'Baner Hills Block A', address: '', city: 'Pune', pincode: '', location: { lat: 18.5701, lng: 73.7801 }, photos: [], estimatedValue: 0, incentiveAmount: 0, incentiveStatus: 'projected' });
    await repo.submitLeadCapture('u-owner-1', { clientEventId: 'shot-a', draft: draft('u-srv-1'), accuracyM: 6 });
    await repo.submitLeadCapture('u-owner-1', { clientEventId: 'shot-b', draft: draft('u-srv-2'), accuracyM: 6 });
  });
  await go(owner, '/owner/decisions');
  await owner.locator('.ds-card', { hasText: 'Two scouts captured' }).first().waitFor();
  await owner.waitForTimeout(500);
  await owner.locator('.ds-card', { hasText: 'Two scouts captured' }).first().click();
  await owner.getByRole('dialog').waitFor(); await owner.waitForTimeout(500);
  await owner.screenshot({ path: `${DIR}/owner-ownership-dispute-card-laptop.png` });
  await ctx2.close();
});
