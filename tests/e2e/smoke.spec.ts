/**
 * One journey per role through the real login (phone → one-time code → second step for Admin), then the screens that
 * role depends on most. A smoke test: it proves each screen renders with its own data and no page error, not every rule.
 * The store is in memory, so each test signs in within one page load and moves by in-app navigation, never a reload.
 */
import { expect, test, type Page } from '@playwright/test';

const OTP = '123456';
const SECOND_STEP = '246810';

async function fillCode(page: Page, code: string, scope = page.locator('body')): Promise<void> {
  const boxes = scope.locator('input');
  await boxes.first().waitFor();
  if ((await boxes.count()) >= code.length) {
    for (let i = 0; i < code.length; i += 1) await boxes.nth(i).fill(code[i]);
  } else {
    await boxes.first().fill(code);
  }
}

async function signIn(page: Page, phone: string): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Getting things ready'), undefined, { timeout: 60_000 });
  // Screens load when first opened, so wait for whichever comes first: the intro carousel (skip it) or the login form.
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
}

/** Move inside the app (a reload would wipe the in-memory store). */
async function go(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => {
    history.pushState({}, '', p);
    dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[/?]/g, (c) => `\\${c}`)}`));
}

/** A screen rendered its own content: a heading, no error state, no unexpected 403 / 404. */
async function expectScreen(page: Page): Promise<void> {
  await expect(page.locator('h1').first()).toBeVisible();
  // Markers, not words: a partner may use the app in Hindi or Marathi.
  await expect(page.locator('[data-refused]')).toHaveCount(0);
  await expect(page.locator('.ds-state[role="alert"]')).toHaveCount(0);
}

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('Admin: second step, home, alerts, job assignment, payouts, leaderboard, automation health', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822011001');
  const gate = page.locator('[data-sec-gate="second_factor"]');
  await gate.waitFor();
  await fillCode(page, SECOND_STEP, gate);
  await expect(gate).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin/);
  await expectScreen(page);
  for (const path of ['/admin/alerts', '/admin/routes', '/payout-approval', '/onboarding/role', '/admin/analytics/leaderboard', '/admin/analytics/automation']) {
    await go(page, path);
    await expectScreen(page);
  }
  expect(errors).toEqual([]);
});

test('Technician: home, a job, its procedure, and admin screens are refused', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822033001');
  await expect(page).toHaveURL(/\/technician/);
  await expectScreen(page);
  for (const path of ['/technician/jobs/j-1', '/technician/jobs/j-1/sop', '/safety-checklist/j-1', '/training']) {
    await go(page, path);
    await expectScreen(page);
  }
  await go(page, '/admin/alerts');
  await expect(page.locator('[data-refused]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Surveyor: home and training', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822022001');
  await expect(page).toHaveURL(/\/surveyor/);
  await expectScreen(page);
  await go(page, '/training');
  await expectScreen(page);
  expect(errors).toEqual([]);
});

test('Customer: home, payments, documents, service requests', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822044001');
  await expect(page).toHaveURL(/\/customer/);
  await expectScreen(page);
  for (const path of ['/my-payments', '/documents', '/service-requests', '/project-status']) {
    await go(page, path);
    await expectScreen(page);
  }
  expect(errors).toEqual([]);
});

test('Supplier: orders, catalog, invoices', async ({ page }) => {
  const errors = watchErrors(page);
  await signIn(page, '9822055001');
  await expect(page).toHaveURL(/\/orders/);
  await expectScreen(page);
  for (const path of ['/catalog', '/supplier-invoices', '/supplier-payment-history']) {
    await go(page, path);
    await expectScreen(page);
  }
  expect(errors).toEqual([]);
});
