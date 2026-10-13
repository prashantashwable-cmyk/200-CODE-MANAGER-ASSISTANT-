/** Quick capture with no signal: it waits on the phone with its own time, shows as waiting, and sends itself when the signal returns. */
import { expect, test, type Page } from '@playwright/test';

async function fillCode(page: Page, code: string, scope = page.locator('body')): Promise<void> {
  const boxes = scope.locator('input');
  await boxes.first().waitFor();
  if ((await boxes.count()) >= code.length) for (let i = 0; i < code.length; i += 1) await boxes.nth(i).fill(code[i]);
  else await boxes.first().fill(code);
}
async function signIn(page: Page, phone: string): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Getting things ready'), undefined, { timeout: 60_000 });
  const skip = page.getByText('Skip', { exact: true });
  const tel = page.locator('input[type="tel"]').first();
  await expect(skip.or(tel)).toBeVisible({ timeout: 60_000 });
  if (await skip.isVisible()) await skip.click();
  await tel.fill(phone);
  await page.getByRole('button', { name: /Send|Continue|OTP/i }).first().click();
  await page.waitForURL(/\/login\/otp/);
  await fillCode(page, '123456', page.getByRole('group', { name: /Verification code/i }));
  const verify = page.getByRole('button', { name: /Verify/i });
  if (await verify.isVisible().catch(() => false)) await verify.click();
}
async function go(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')); }, path);
  await expect(page).toHaveURL(new RegExp(path.replace(/[/?]/g, (c) => `\\${c}`)));
}

test('Scout: captures with no signal, sees it waiting, and it sends itself when signal returns; a second capture of the same place is kept as supporting evidence', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await signIn(page, '9822022003');
  await expect(page).toHaveURL(/\/surveyor/);
  await go(page, '/capture');
  await expect(page.locator('.leaflet-container')).toBeVisible();

  await context.setOffline(true);
  await expect(page.getByText('No signal: captures wait on this phone')).toBeVisible();
  await page.locator('.leaflet-container').click({ position: { x: 300, y: 160 } });
  await expect(page.getByText(/Pin set/)).toBeVisible();

  // validation first: nothing is queued for an unnamed site
  await page.getByRole('button', { name: 'Save capture' }).click();
  await expect(page.getByText('Give the site a name.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'On this phone' })).toHaveCount(0);

  await page.getByLabel('Site or project name').fill('Offline Test Towers');
  await page.getByLabel('Contact mobile number').fill('12345');
  await expect(page.getByText('Enter a 10-digit mobile number')).toBeVisible();
  await page.getByLabel('Contact mobile number').fill('9822000333');
  await page.getByRole('button', { name: 'Save capture' }).click();
  await expect(page.getByText('1 waiting to send')).toBeVisible();
  const card = page.locator('.ds-card', { hasText: 'Offline Test Towers' });
  await expect(card.getByText('Waiting')).toBeVisible();
  // it survives a reload of the screen's state: the phone kept it
  const stored = await page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('aiec.captureQueue.')).map(([, v]) => v).join(''));
  expect(stored).toContain('Offline Test Towers');

  await context.setOffline(false);
  await expect(page.getByText('Saved as a new lead')).toBeVisible({ timeout: 30_000 });
  await expect(card.getByText('Sent')).toBeVisible();
  await expect(page.getByText('1 waiting to send')).toHaveCount(0);

  // the same place again: supporting evidence, no second lead
  await page.locator('.leaflet-container').click({ position: { x: 300, y: 160 } });
  await page.getByLabel('Site or project name').fill('Offline Test Towers again');
  await page.getByRole('button', { name: 'Save capture' }).click();
  await expect(page.getByText('This site was already captured')).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});
