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

test('Owner: second step, home, decides a card with a reason, the record is kept, layout adapts to large screens', async ({ page }) => {
  const errors = watchErrors(page);
  mkdirSync(SHOTS, { recursive: true });
  await signIn(page, '9822011009', true);
  await expect(page).toHaveURL(/\/owner$/);
  await expect(page.locator('h1').first()).toBeVisible();
  await go(page, '/owner/decisions');
  const cards = page.locator('.ds-card');
  await expect(cards.first()).toBeVisible();
  const openBefore = await cards.count();
  expect(openBefore).toBeGreaterThanOrEqual(4);

  // The Owner can open Admin's monitoring screens (Owner holds every authority Admin holds).
  await go(page, '/admin/alerts');
  await expect(page.locator('[data-refused]')).toHaveCount(0);
  await go(page, '/owner/decisions');

  await cards.filter({ hasText: 'Release weekly payout' }).first().click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toContainText('Evidence');
  await expect(sheet).toContainText('This is a suggestion only');
  await sheet.locator('textarea').last().fill('no');
  await sheet.getByRole('button', { name: 'Record decision' }).click();
  await expect(sheet).toContainText('at least 10 letters');
  await sheet.locator('textarea').last().fill('QC passed and the customer confirmed.');
  await sheet.getByRole('button', { name: 'Record decision' }).click();
  await expect(sheet).toContainText('Decision history');
  await expect(sheet).toContainText('QC passed and the customer confirmed.');
  await expect(sheet.getByRole('button', { name: 'Record decision' })).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.locator('.ds-card')).toHaveCount(openBefore - 1);

  // The record chain checks out on the Owner home.
  await go(page, '/owner');
  await expect(page.getByText(/Intact/)).toBeVisible();

  // Adaptive layout: no horizontal scroll at any size, and wide screens use their width.
  await go(page, '/owner/decisions');
  const widths: Array<[string, number, number]> = [['phone', 390, 844], ['laptop', 1440, 900], ['qhd-2k', 2560, 1440], ['uhd-4k', 3840, 2160]];
  const measured: Record<string, { content: number; font: number; cardMin: number }> = {};
  for (const [name, width, height] of widths) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('.ds-card', { hasText: 'Safety hold' })).toBeVisible();
    await expect(page.locator('.ds-skeleton')).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${name} scrolls sideways`).toBeLessThanOrEqual(0);
    measured[name] = await page.evaluate(() => ({
      content: document.querySelector('.ds-screen')!.getBoundingClientRect().width,
      font: parseFloat(getComputedStyle(document.documentElement).fontSize),
      cardMin: Math.min(...[...document.querySelectorAll('.ds-card')].map((el) => el.getBoundingClientRect().width)),
    }));
    await page.screenshot({ path: `${SHOTS}/decision-desk-${name}-${width}x${height}.png` });
  }
  // Wider screens get wider content and larger type; a phone gets neither.
  expect(measured['laptop'].content).toBeGreaterThan(measured['phone'].content);
  expect(measured['qhd-2k'].content).toBeGreaterThan(measured['laptop'].content);
  expect(measured['uhd-4k'].content).toBeGreaterThan(measured['qhd-2k'].content);
  expect(measured['phone'].font).toBe(measured['laptop'].font);
  expect(measured['uhd-4k'].font).toBeGreaterThan(measured['laptop'].font);
  // No card stretches into one thin ribbon across a huge screen.
  expect(measured['uhd-4k'].cardMin).toBeLessThan(1400);
  expect(errors).toEqual([]);
});

test('Admin: sees status only, can prepare a packet, can never decide', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822011001', true);
  await expect(page).toHaveURL(/\/admin/);
  await go(page, '/owner/decisions');
  await expect(page.locator('h1').first()).toContainText('Decision Desk');
  await expect(page.getByText('Only the Owner decides')).toBeVisible();
  await expect(page.locator('.ds-card').first()).toBeVisible();
  // Status rows carry no evidence, amounts or assistant notes, and open no decision form.
  await expect(page.getByText('Evidence')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Record decision' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Prepare a packet' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.locator('input').first().fill('Short');
  await sheet.getByRole('button', { name: 'Send to Owner' }).click();
  await expect(sheet).toContainText('at least 8 letters');
  await sheet.locator('input').first().fill('Raise Santosh to Senior Installer');
  await sheet.locator('textarea').first().fill('Fourteen clean jobs and a passed certification this quarter.');
  await sheet.getByRole('button', { name: 'Send to Owner' }).click();
  await expect(page.locator('.ds-card', { hasText: 'Raise Santosh to Senior Installer' })).toBeVisible();

  // The server side refuses, not only the screen: call the repository as Admin.
  const refusal = await page.evaluate(async () => {
    const repo = (window as unknown as { __aiecRepo: { decideDecisionCard(u: string, i: unknown): Promise<unknown>; listDecisionCards(u: string): Promise<{ statusRows: { id: string }[] }> } }).__aiecRepo;
    const list = await repo.listDecisionCards('u-admin-1');
    try { await repo.decideDecisionCard('u-admin-1', { cardId: list.statusRows[0].id, action: 'approve', reason: 'Admin tries to approve it.' }); return 'allowed'; }
    catch (e) { return (e as Error).message; }
  });
  expect(refusal).toBe('admin_cannot_decide');
  expect(errors).toEqual([]);
});

test('Technician: the Decision Desk and Owner home are refused', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822033001');
  await expect(page).toHaveURL(/\/technician/);
  for (const path of ['/owner/decisions', '/owner']) {
    await go(page, path);
    await expect(page.locator('[data-refused]')).toBeVisible();
  }
  expect(errors).toEqual([]);
});
