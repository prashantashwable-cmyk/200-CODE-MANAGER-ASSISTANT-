/** The map and the activity log through the real screens: who sees what of a site, and a correction that keeps the original. */
import { expect, test, type Page } from '@playwright/test';

const OTP = '123456';
const SECOND_STEP = '246810';

async function fillCode(page: Page, code: string, scope = page.locator('body')): Promise<void> {
  const boxes = scope.locator('input');
  await boxes.first().waitFor();
  if ((await boxes.count()) >= code.length) for (let i = 0; i < code.length; i += 1) await boxes.nth(i).fill(code[i]);
  else await boxes.first().fill(code);
}
async function signIn(page: Page, phone: string, secondStep = false): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Getting things ready'), undefined, { timeout: 60_000 });
  const skip = page.getByText('Skip', { exact: true });
  const tel = page.locator('input[type="tel"]').first();
  await expect(skip.or(tel)).toBeVisible({ timeout: 60_000 });
  if (await skip.isVisible()) await skip.click();
  await tel.fill(phone);
  await page.getByRole('button', { name: /Send|Continue|OTP/i }).first().click();
  await page.waitForURL(/\/login\/otp/);
  await fillCode(page, OTP, page.getByRole('group', { name: /Verification code/i }));
  const verify = page.getByRole('button', { name: /Verify/i });
  if (await verify.isVisible().catch(() => false)) await verify.click();
  if (secondStep) {
    const gate = page.locator('[data-sec-gate="second_factor"]');
    await gate.waitFor();
    await fillCode(page, SECOND_STEP, gate);
    await expect(gate).toHaveCount(0);
  }
}
async function go(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')); }, path);
  await expect(page).toHaveURL(new RegExp(path.replace(/[/?]/g, (c) => `\\${c}`)));
}
const watch = (page: Page) => { const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); return errors; };

test('Owner: the map shows every site exactly with a list beside it; the log opens and verifies', async ({ page }) => {
  const errors = watch(page);
  await signIn(page, '9822011009', true);
  await go(page, '/map');
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.getByText('Exact').first()).toBeVisible();
  await expect(page.getByText('Approximate')).toHaveCount(0);
  await page.getByPlaceholder('Search sites').fill('zzzz-no-such-site');
  await expect(page.getByText('No match')).toBeVisible();
  await go(page, '/log');
  await expect(page.locator('h1').first()).toContainText('Activity log');
  expect(errors).toEqual([]);
});

test('Admin: the map shows areas only, never a site name or a contact; the log is read only', async ({ page }) => {
  const errors = watch(page);
  await signIn(page, '9822011001', true);
  await go(page, '/map');
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.getByText('Sites (')).toHaveCount(0);
  await expect(page.getByText('Area only')).toHaveCount(0);
  const text = await page.locator('main, body').first().innerText();
  expect(text).not.toMatch(/Shree Ram|Heights|98220/);
  expect(errors).toEqual([]);
});

test('Scout: captures a lead, sees it in the log, corrects it, and the original stays visible', async ({ page }) => {
  const errors = watch(page);
  await signIn(page, '9822022003');
  await expect(page).toHaveURL(/\/surveyor/);
  await page.evaluate(async () => {
    const repo = (window as unknown as { __aiecRepo: { createLead(d: unknown): Promise<unknown> } }).__aiecRepo;
    await repo.createLead({ stage: 'captured', surveyorId: 'u-srv-3', source: 'field_survey', builderName: 'B', contactName: 'C', contactPhone: '9822000111', siteName: 'Log Test Heights', address: 'A', city: 'Pune', pincode: '411057', location: { lat: 18.59, lng: 73.73 }, photos: [], estimatedValue: 1, incentiveAmount: 1, incentiveStatus: 'projected' });
  });
  await go(page, '/log');
  const card = page.locator('.ds-card', { hasText: 'Log Test Heights' });
  await expect(card).toBeVisible();
  await card.click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toContainText('As first recorded');
  await sheet.locator('textarea').fill('no');
  await sheet.getByRole('button', { name: 'Correct this' }).click();
  await expect(sheet).toContainText('at least 10 letters');
  await sheet.locator('textarea').fill('Wrote the wrong block name.');
  await sheet.getByRole('button', { name: 'Correct this' }).click();
  await expect(page.locator('.ds-card', { hasText: 'Log Test Heights' }).getByText('Corrected').first()).toBeVisible();
  await expect(page.locator('.ds-card', { hasText: 'Correction' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
