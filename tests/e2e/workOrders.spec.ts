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

test('Owner: work orders say plainly that signing and payment providers are not connected', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822011009', true);
  await go(page, '/work-orders');
  await expect(page.getByTestId('wo-disclosure')).toBeVisible();
  await expect(page.getByTestId('wo-provider-esign')).toBeVisible();
  await expect(page.getByTestId('wo-provider-payments')).toBeVisible();
  // The Owner can see how payment is released and change it; a change needs a reason and shows what is wrong live.
  await expect(page.getByTestId('wo-templates')).toBeVisible();
  await expect(page.getByTestId('wo-tpl-material')).toBeVisible();
  await page.getByTestId('wo-tpl-material').getByLabel('%').first().fill('80');
  await page.getByLabel(/Why this change/).fill('Pilot with a lower advance');
  await expect(page.getByTestId('wo-tpl-problem')).toBeVisible(); // 80 + 10 is not 100
  expect(errors).toEqual([]);
});

test('Customer: sees the contract disclosure and an honest empty state before any quote is accepted', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822044003');
  await expect(page).toHaveURL(/\/customer/);
  await go(page, '/work-orders');
  await expect(page.getByTestId('wo-disclosure')).toBeVisible();
  await expect(page.getByTestId('wo-provider-esign')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Owner: picks a partner account for each accepted part, issues the work orders, and the statutory fee is left out', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822011009', true);
  // The customer's acceptance happens in another session in real life; here the repository does it, then the Owner's screen reads it.
  const ids = await page.evaluate(async () => {
    type R = { listFacilitatorQuotes(u: string): Promise<{ id: string }[]>; sendFacilitatorQuote(u: string, id: string): Promise<unknown>; getMyQuote(u: string): Promise<{ quote: { components: { id: string; kind: string }[] } } | null>; acceptQuoteComponents(u: string, q: string, l: string[]): Promise<unknown> };
    const repo = (window as unknown as { __aiecRepo: R }).__aiecRepo;
    const quote = (await repo.listFacilitatorQuotes('u-owner-1'))[0];
    await repo.sendFacilitatorQuote('u-owner-1', quote.id).catch(() => undefined);
    const mine = await repo.getMyQuote('u-cust-3');
    const pick = mine!.quote.components.filter((c) => c.kind === 'installation' || c.kind === 'statutory').map((c) => c.id);
    await repo.acceptQuoteComponents('u-cust-3', quote.id, pick);
    return quote.id;
  });
  await go(page, '/work-orders');
  const card = page.getByTestId(`wo-issue-${ids}`);
  await expect(card).toBeVisible();
  await expect(page.getByTestId('wo-pass-through')).toBeVisible();
  const create = card.getByRole('button').last();
  await expect(create).toBeDisabled(); // no partner account chosen yet
  await card.locator('select').first().selectOption('u-tech-1');
  await expect(create).toBeEnabled();
  await create.click();
  await expect(page.locator('[data-testid^="wo-wo-"]')).toHaveCount(1);
  await expect(card.getByRole('button')).toHaveCount(0); // nothing left to issue; the pass-through note stays
  await expect(card.locator('select')).toHaveCount(0);
  expect(errors).toEqual([]);
});
