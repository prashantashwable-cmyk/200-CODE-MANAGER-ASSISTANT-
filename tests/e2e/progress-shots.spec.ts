/** Not a regression test: captures review screenshots into docs/evidence/progress/<PROGRESS_DIR>. Run with PROGRESS_DIR=01 npx playwright test progress-shots. */
import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const DIR = `docs/evidence/progress/${process.env.PROGRESS_DIR ?? 'latest'}`;
async function fill(page: Page, code: string, scope = page.locator('body')) {
  const b = scope.locator('input'); await b.first().waitFor();
  if ((await b.count()) >= code.length) for (let i = 0; i < code.length; i += 1) await b.nth(i).fill(code[i]); else await b.first().fill(code);
}
async function signIn(page: Page, phone: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !document.body.innerText.includes('Getting things ready'));
  const skip = page.getByText('Skip', { exact: true }); const tel = page.locator('input[type="tel"]').first();
  await skip.or(tel).waitFor(); if (await skip.isVisible()) await skip.click();
  await tel.fill(phone); await page.getByRole('button', { name: /Send|Continue|OTP/i }).first().click();
  await page.waitForURL(/\/login\/otp/); await fill(page, '123456', page.getByRole('group', { name: /Verification code/i }));
  const v = page.getByRole('button', { name: /Verify/i }); if (await v.isVisible().catch(() => false)) await v.click();
  const gate = page.locator('[data-sec-gate="second_factor"]'); await gate.waitFor(); await fill(page, '246810', gate);
}
const go = (page: Page, p: string) => page.evaluate((x) => { history.pushState({}, '', x); dispatchEvent(new PopStateEvent('popstate')); }, p);

test('review screenshots', async ({ page }) => {
  test.skip(!process.env.PROGRESS_DIR, 'only when PROGRESS_DIR is set');
  mkdirSync(DIR, { recursive: true });
  await signIn(page, '9822011009');
  for (const [name, w, h] of [['laptop', 1440, 900], ['phone', 390, 844]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await go(page, '/owner'); await page.getByText('Needs your decision').waitFor(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${DIR}/owner-home-${name}.png` });
    await go(page, '/owner/decisions'); await page.locator('.ds-card', { hasText: 'Safety hold' }).waitFor(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${DIR}/decision-desk-${name}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('.ds-card', { hasText: 'Release weekly payout' }).click();
  await page.getByRole('dialog').waitFor(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/decision-detail-laptop.png` });
});
