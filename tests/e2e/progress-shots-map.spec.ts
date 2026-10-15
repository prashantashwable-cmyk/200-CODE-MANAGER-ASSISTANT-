/** Review screenshots of the map and log, per role. Only runs with PROGRESS_DIR set: PROGRESS_DIR=02 npx playwright test progress-shots-map */
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

async function mapShot(page: Page, name: string, ready: string) {
  await go(page, '/map');
  await page.locator('.leaflet-container').waitFor();
  await page.getByText(ready).first().waitFor();
  await page.waitForTimeout(2500); // let map tiles settle
  await page.screenshot({ path: `${DIR}/${name}.png` });
}

test('map and log screenshots', async ({ browser }) => {
  test.setTimeout(240_000);
  test.skip(!process.env.PROGRESS_DIR, 'only when PROGRESS_DIR is set');
  mkdirSync(DIR, { recursive: true });
  const shoot = async (phone: string, second: boolean, fn: (p: Page) => Promise<void>) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await signIn(page, phone, second);
    await fn(page);
    await ctx.close();
  };
  await shoot('9822011009', true, async (page) => {
    await mapShot(page, 'map-owner-laptop', 'Exact');
    await page.setViewportSize({ width: 390, height: 844 });
    await mapShot(page, 'map-owner-phone', 'Exact');
  });
  await shoot('9822011001', true, async (page) => {
    await go(page, '/map'); await page.locator('.leaflet-container').waitFor(); await page.getByText(/busy areas shown|No area has 3/).first().waitFor();
    await page.waitForTimeout(2500); await page.screenshot({ path: `${DIR}/map-admin-areas-only-laptop.png` });
  });
  await shoot('9822033005', true, async (page) => {
    await mapShot(page, 'map-technician-approximate-laptop', 'Approximate');
  });
  await shoot('9822022003', false, async (page) => {
    await page.waitForURL(/\/surveyor/);
    await page.evaluate(async () => {
      const repo = (window as unknown as { __aiecRepo: { createLead(d: unknown): Promise<unknown> } }).__aiecRepo;
      await repo.createLead({ stage: 'captured', surveyorId: 'u-srv-3', source: 'field_survey', builderName: 'B', contactName: 'C', contactPhone: '9822000111', siteName: 'Hinjawadi Phase 3 Plot 12', address: 'A', city: 'Pune', pincode: '411057', location: { lat: 18.59, lng: 73.73 }, photos: [], estimatedValue: 1, incentiveAmount: 1, incentiveStatus: 'projected' });
    });
    await go(page, '/log');
    const card = page.locator('.ds-card', { hasText: 'Hinjawadi Phase 3' }); await card.waitFor(); await card.click();
    const sheet = page.getByRole('dialog'); await sheet.locator('textarea').fill('Wrote the wrong plot number.');
    await sheet.getByRole('button', { name: 'Correct this' }).click();
    await page.getByText('Corrected').first().waitFor(); await page.waitForTimeout(600);
    await page.screenshot({ path: `${DIR}/log-scout-correction-laptop.png` });
  });
});
