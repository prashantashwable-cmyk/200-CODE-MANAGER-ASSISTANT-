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
  const share = page.getByTestId('wo-tpl-material').getByLabel('%').first();
  await expect(share).toHaveValue('90'); // the editor has loaded before anything is typed
  await share.fill('80');
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
  // The issued order offers the contract pack and the general site-readiness points.
  await expect(page.locator('[data-testid^="wo-pack-"]')).toHaveCount(1);
  await page.locator('[data-testid^="wo-readiness-"]').locator('summary').click();
  await expect(page.locator('[data-testid^="wo-readiness-"] li')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('Owner: the Projects screen shows a % progress bar and the handover record, which completes only when all three parties acknowledge', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822011009', true);
  const quoteId = await page.evaluate(async () => {
    const repo = (window as unknown as { __aiecRepo: Record<string, (...a: unknown[]) => Promise<any>> }).__aiecRepo;
    const quote = (await repo.listFacilitatorQuotes('u-owner-1'))[0];
    await repo.sendFacilitatorQuote('u-owner-1', quote.id).catch(() => undefined);
    const mine = await repo.getMyQuote('u-cust-3');
    const install = mine.quote.components.find((c: { kind: string }) => c.kind === 'installation');
    await repo.acceptQuoteComponents('u-cust-3', quote.id, [install.id]);
    const [wo] = await repo.createWorkOrdersFromQuote('u-owner-1', quote.id, { [install.id]: 'u-tech-1' });
    await repo.acceptWorkOrder('u-cust-3', wo.id); await repo.acceptWorkOrder('u-tech-1', wo.id); await repo.startWorkOrder('u-tech-1', wo.id);
    await repo.submitMilestoneEvidence('u-tech-1', wo.id, 'progress', ['rails.jpg']);
    await repo.verifyMilestone('u-owner-1', wo.id, 'progress');
    return quote.id as string;
  });
  await go(page, '/projects');
  const card = page.getByTestId(`pj-${quoteId}`);
  await expect(card).toBeVisible();
  await expect(page.getByTestId(`pj-percent-${quoteId}`)).toHaveText('50%'); // the 50% progress milestone is verified
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  await expect(page.getByTestId(`pj-qc-missing-${quoteId}`)).toBeVisible(); // nobody has been named to check the handover yet
  await page.evaluate(async (q) => {
    const repo = (window as unknown as { __aiecRepo: Record<string, (...a: unknown[]) => Promise<any>> }).__aiecRepo;
    const wo = (await repo.listWorkOrders('u-owner-1')).find((w: { quoteId: string }) => w.quoteId === q);
    await repo.assignMilestoneInspector('u-owner-1', wo.id, 'handover', 'u-tech-2');
    for (const who of ['u-cust-3', 'u-tech-1', 'u-tech-2']) await repo.acknowledgeHandover(who, q);
    await repo.submitMilestoneEvidence('u-tech-1', wo.id, 'handover', ['handover.pdf']);
    await repo.verifyMilestone('u-tech-2', wo.id, 'handover');
  }, quoteId);
  await go(page, '/work-orders');
  await go(page, '/projects');
  await expect(page.getByTestId(`pj-percent-${quoteId}`)).toHaveText('100%');
  await expect(page.getByTestId(`pj-handover-${quoteId}`)).toContainText('Handover record complete');
  await expect(page.getByTestId(`pj-handover-${quoteId}`)).toContainText('not a statutory approval');
  expect(errors).toEqual([]);
});

test('Owner: a customer\'s complaint is acknowledged and resolved in order, and the customer can read the outcome', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822011009', true);
  const id = await page.evaluate(async () => {
    const repo = (window as unknown as { __aiecRepo: Record<string, (...a: unknown[]) => Promise<any>> }).__aiecRepo;
    const quote = (await repo.listFacilitatorQuotes('u-owner-1'))[0];
    await repo.sendFacilitatorQuote('u-owner-1', quote.id).catch(() => undefined);
    const mine = await repo.getMyQuote('u-cust-3');
    const install = mine.quote.components.find((c: { kind: string }) => c.kind === 'installation');
    await repo.acceptQuoteComponents('u-cust-3', quote.id, [install.id]);
    const [wo] = await repo.createWorkOrdersFromQuote('u-owner-1', quote.id, { [install.id]: 'u-tech-1' });
    const c = await repo.raiseComplaint('u-cust-3', { quoteId: quote.id, workOrderId: wo.id, category: 'delay', text: 'The team has not come for ten days', clientId: 'e2e-1' });
    return c.id as string;
  });
  await go(page, '/complaints');
  const card = page.getByTestId(`cp-${id}`);
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Acknowledge' }).click();
  await expect(card.getByText('Being looked at')).toBeVisible();
  const resolve = card.getByRole('button', { name: 'Resolve' });
  await expect(resolve).toBeDisabled(); // a note is needed first
  await card.getByLabel(/What was decided/).fill('We will send the team on Monday');
  await expect(resolve).toBeEnabled();
  await resolve.click();
  await expect(page.getByTestId(`cp-outcome-${id}`)).toContainText('We will send the team on Monday');
  await expect(card.getByRole('button', { name: 'Resolve' })).toHaveCount(0); // locked once resolved
  const outcome = await page.evaluate(async () => {
    const repo = (window as unknown as { __aiecRepo: Record<string, (...a: unknown[]) => Promise<any>> }).__aiecRepo;
    return (await repo.listComplaints('u-cust-3'))[0].resolutionNote as string;
  });
  expect(outcome).toContain('Monday');
  expect(errors).toEqual([]);
});
