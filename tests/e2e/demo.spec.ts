/**
 * Screen 002's Try Demo tab offers every role. Each card must open that role's own home with sample data, no codes, no
 * refusal and no page error. Markers, not words: the tab may be shown in Hindi or Marathi.
 */
import { expect, test } from '@playwright/test';

const HOME: Record<string, string> = {
  owner: '/owner',
  admin: '/admin',
  surveyor: '/surveyor',
  technician: '/technician',
  customer: '/customer',
  supplier: '/orders',
};

test('Try Demo lists all six roles', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.getByRole('tab', { name: 'Try Demo' }).click();
  for (const role of Object.keys(HOME)) await expect(page.locator(`[data-demo-role="${role}"]`)).toBeVisible();
  await expect(page.locator('[data-demo-role]')).toHaveCount(6);
});

for (const [role, home] of Object.entries(HOME)) {
  test(`Try Demo as ${role} opens ${home}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 180_000 });
    await page.getByRole('tab', { name: 'Try Demo' }).click();
    await page.locator(`[data-demo-role="${role}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${home}$`), { timeout: 30_000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-refused]')).toHaveCount(0);
    await expect(page.locator('.ds-state[role="alert"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
