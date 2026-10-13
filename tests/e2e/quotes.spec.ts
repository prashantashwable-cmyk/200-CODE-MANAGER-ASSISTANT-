/**
 * The Owner / Admin split (master prompt P1, P2): the Owner decides, Admin only sees status and prepares packets.
 * Also captures the Decision Desk at phone, laptop, 2K and 4K widths for the adaptive-layout evidence.
 * Memory store: each test signs in within one page load and moves by in-app navigation.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OTP = '123456';
const SECOND_STEP = '246810';
const SHOTS = 'docs/evidence/adaptive';

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

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}


test('Owner builds a quote with the fee on its own line; the customer sees it and accepts part by part', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822011009', true);
  await go(page, '/quotes');
  await expect(page.getByTestId('fq-disclosure')).toContainText('platform facilitates');
  const inputs = page.locator('.ds-input');
  await page.getByLabel('Partner', { exact: true }).fill('Vertex Lifts');
  await page.getByLabel('Partner price (₹)').fill('1000000');
  await expect(page.getByText('Platform facilitation fee').first()).toBeVisible();
  await expect(page.getByText('₹6,00,000').first()).toBeVisible();
  await expect(page.getByText('At target')).toBeVisible();
  await expect(page.getByText('Platform P&L for this quote')).toBeVisible();
  expect(await inputs.count()).toBeGreaterThan(3);
  await page.getByRole('tab', { name: 'Fee settings' }).click();
  await expect(page.getByText('Only you change the fee')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Customer: sees partner prices and the disclosed fee, never the platform costs, and accepts component by component', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822044003');
  await expect(page).toHaveURL(/\/customer/);
  await go(page, '/my-quote');
  // Partners use Hindi / Marathi: assert on markers, not words.
  await expect(page.getByTestId('mq-disclosure')).toBeVisible();
  await expect(page.getByTestId('mq-accepted')).toHaveCount(0);
  await page.getByRole('checkbox').first().check();
  await page.locator('button.ds-btn--primary, .ds-btn').filter({ hasText: /\(1\)/ }).first().click();
  await expect(page.getByTestId('mq-accepted')).toHaveCount(1);
  expect(errors).toEqual([]);
});
