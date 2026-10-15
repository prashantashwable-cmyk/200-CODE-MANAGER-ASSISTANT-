/**
 * Basic accessibility and fit for the new screens (208 work orders, 209 projects, 210 complaints) as the Owner, the customer and a partner,
 * at phone and tablet width: nothing scrolls sideways, every control has a name, and touch targets are big enough.
 * This is not a full audit: no screen reader and no automated rules engine (that needs a dependency the Owner has not approved).
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


const SCREENS = ['/work-orders', '/projects', '/complaints'];
const PEOPLE: { who: string; phone: string; second?: boolean }[] = [
  { who: 'owner', phone: '9822011009', second: true },
  { who: 'customer', phone: '9822044003' },
  { who: 'supplier', phone: '9822055001' },
];

async function audit(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => { const r = (el as HTMLElement).getBoundingClientRect(); const s = getComputedStyle(el as HTMLElement); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const nameOf = (el: Element): string => {
      const h = el as HTMLElement;
      const aria = h.getAttribute('aria-label') || '';
      const by = (h.getAttribute('aria-labelledby') || '').split(' ').map((i) => document.getElementById(i)?.textContent || '').join(' ');
      const labels = 'labels' in h ? Array.from((h as HTMLInputElement).labels ?? []).map((l) => l.textContent || '').join(' ') : '';
      return (aria + by + labels + (h.tagName === 'BUTTON' || h.tagName === 'A' ? h.textContent || '' : '') + (h.getAttribute('title') || '') + (h.getAttribute('placeholder') || '')).trim();
    };
    const controls = Array.from(document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button]')).filter(visible);
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      unnamed: controls.filter((c) => nameOf(c) === '').map((c) => c.outerHTML.slice(0, 120)),
      small: controls.filter((c) => { const r = (c as HTMLElement).getBoundingClientRect(); return (c.tagName === 'BUTTON' || c.tagName === 'SELECT' || (c.tagName === 'INPUT' && (c as HTMLInputElement).type !== 'checkbox' && (c as HTMLInputElement).type !== 'radio')) && r.height < 36; }).map((c) => `${c.tagName} ${Math.round((c as HTMLElement).getBoundingClientRect().height)}px ${nameOf(c).slice(0, 30)}`),
      headings: document.querySelectorAll('h1').length, headingTexts: Array.from(document.querySelectorAll('h1')).map((h) => (h.textContent || '').slice(0, 40)),
    };
  });
}

for (const p of PEOPLE) {
  test(`${p.who}: the work-order, project and complaint screens fit a phone and a tablet, with named controls`, async ({ page }) => {
    const errors = watchErrors(page);
    await signIn(page, p.phone, p.second);
    await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 30_000 }); // wait for the home screen before moving about
    await page.waitForTimeout(500);
    for (const size of [{ width: 390, height: 844 }, { width: 820, height: 1180 }]) {
      await page.setViewportSize(size);
      for (const path of SCREENS) {
        await go(page, path);
        await page.waitForTimeout(400);
        const r = await audit(page);
        expect(r.overflow, `${p.who} ${path} ${size.width}px sideways scroll`).toBeLessThanOrEqual(1);
        expect(r.unnamed, `${p.who} ${path} controls without a name`).toEqual([]);
        expect(r.small, `${p.who} ${path} small touch targets`).toEqual([]);
        expect(r.headings, `${p.who} ${path} should have one main heading, found ${r.headingTexts.join(' | ')}`).toBeLessThanOrEqual(1);
      }
    }
    expect(errors).toEqual([]);
  });
}
