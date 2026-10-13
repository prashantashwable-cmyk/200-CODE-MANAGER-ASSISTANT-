/**
 * S1, end to end against a real Supabase stack: a phone AIEC does not know signs in and waits with no role, asks to be a
 * technician, Admin (a profile the database already holds) signs in and gives them the role, and the person's next sign-in
 * opens the technician's home. Every code is the one Supabase made, read from the database's outbox (where an SMS
 * provider would pick it up); the browser never chooses a role.
 */
import { randomInt } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:54322/postgres', max: 2 });
test.afterAll(() => db.end());

const SECOND_STEP = '246810';
const freshPhone = () => `9${String(randomInt(100_000_000, 999_999_999))}`;

async function codeFor(phone10: string): Promise<string> {
  // The newest code filed for this number by Supabase Auth's send-SMS hook.
  for (let i = 0; i < 40; i += 1) {
    const r = await db.query<{ code: string }>("select code from public.sms_outbox where right(regexp_replace(phone, '\\D', '', 'g'), 10) = $1 order by id desc limit 1", [phone10]);
    if (r.rows[0]?.code) return r.rows[0].code;
    await new Promise((res) => setTimeout(res, 250));
  }
  throw new Error(`no code filed for ${phone10}`);
}

async function fillCode(page: Page, code: string, scope = page.locator('body')): Promise<void> {
  const boxes = scope.locator('input');
  await boxes.first().waitFor();
  for (let i = 0; i < code.length; i += 1) await boxes.nth(i).fill(code[i]);
}

async function signIn(page: Page, phone10: string): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await expect(page.locator('[data-login-note="server"]')).toBeVisible();
  const before = (await db.query<{ n: string }>('select count(*) as n from public.sms_outbox')).rows[0].n;
  await page.locator('input[type="tel"]').first().fill(phone10);
  await page.getByRole('button', { name: /Continue/i }).first().click();
  await page.waitForURL(/\/login\/otp/);
  await expect(page.locator('[data-otp-note]')).toHaveAttribute('data-otp-note', 'sms-not-connected');
  await expect.poll(async () => (await db.query<{ n: string }>('select count(*) as n from public.sms_outbox')).rows[0].n).not.toBe(before);
  await fillCode(page, await codeFor(phone10), page.getByRole('group', { name: /Verification code/i }));
  // Six digits verify by themselves; the page then leaves the code step (pending screen, gate or home).
  await expect(page.locator('[data-otp-note]')).toHaveCount(0);
}

test('an unknown phone waits for Admin, Admin gives it a role, and the next sign-in opens that role', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const applicant = freshPhone();
  const adminPhone = freshPhone();
  await db.query("insert into public.profiles (phone, name, role, status) values ($1, 'E2E Admin', 'admin', 'active')", [`+91${adminPhone}`]);

  // 1. The unknown phone signs in for real and waits, with no role and nothing to open.
  await signIn(page, applicant);
  await expect(page.locator('[data-otp-phase="pending"]')).toBeVisible();
  await page.getByRole('button', { name: 'Technician', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Technician', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await db.query("select requested_role from public.profiles where right(phone, 10) = $1", [applicant])).rows[0]?.requested_role).toBe('technician');
  // Waiting is not access: no screen behind sign-in opens.
  await page.goto('/technician');
  await expect(page).toHaveURL(/\/login/);

  // 2. Admin signs in (their profile is linked by phone), passes the second step and gives the role.
  await signIn(page, adminPhone);
  const gate = page.locator('[data-sec-gate]');
  await gate.first().waitFor();
  if ((await gate.getAttribute('data-sec-gate')) === 'second_factor') {
    await fillCode(page, SECOND_STEP, gate);
    await expect(gate).toHaveCount(0);
  }
  await expect(page.locator('[data-server-sample]')).toBeVisible();
  await page.goto('/onboarding/role');
  const requests = page.locator('[data-signin-requests]');
  await expect(requests).toBeVisible();
  const card = requests.locator('.ds-card', { hasText: /Asked to join as Technician/ }).filter({ hasText: applicant.slice(-4) });
  await expect(card).toHaveCount(1);
  await expect(card.locator('select')).toHaveValue('technician');
  await card.getByRole('button', { name: /Approve/i }).click();
  await expect(card).toHaveCount(0);
  const decided = await db.query("select role, status, decided_by is not null as stamped from public.profiles where right(phone, 10) = $1", [applicant]);
  expect(decided.rows[0]).toEqual({ role: 'technician', status: 'active', stamped: true });
  const logged = await db.query("select count(*)::int as n from public.audit_events a join public.profiles p on a.record_id = p.id::text where a.source_key = 'profile.decided' and right(p.phone, 10) = $1", [applicant]);
  expect(logged.rows[0].n).toBe(1);

  // 3. Admin signs out through the app; the person's next sign-in opens the technician's home.
  // (The sign-out button lives in the wide-screen sidebar.)
  await page.goto('/admin');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('.shell__side-footer button').click();
  await expect(page).toHaveURL(/\/login|\/$/);
  // Supabase's own session (kept under `aiec.auth`) is gone once the server confirms the sign-out.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('aiec.auth'))).toBeNull();
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, applicant);
  await expect(page).toHaveURL(/\/technician/);
  await expect(page.locator('[data-server-sample]')).toBeVisible();
  expect(errors).toEqual([]);
});

// ---- Google sign-in (owner's decision 2026-10-10: anyone may; a Google account AIEC does not know confirms a mobile once) ----
// Google's own screen cannot be driven without a real Google account, so these start right after it: a sign-in that has an
// email and no phone (what a Google sign-in is to Supabase), made through the local Auth service and placed where
// supabase-js keeps its session. From there everything is the app's real return path, against the real Auth service.
const API_URL = process.env.SUPABASE_API_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

async function emailOnlySignIn(): Promise<Record<string, unknown>> {
  const email = `g${randomInt(1e9)}@example.com`;
  const password = `pw-${randomInt(1e9)}-x`;
  const made = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  expect(made.ok).toBe(true);
  const res = await fetch(`${API_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(res.ok).toBe(true);
  return (await res.json()) as Record<string, unknown>;
}

/** Arrive at the Google return screen already signed in, as supabase-js would be after Google. */
async function returnFromGoogle(page: Page, session: Record<string, unknown>): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.evaluate((s) => localStorage.setItem('aiec.auth', JSON.stringify(s)), session);
  await page.goto('/login/google');
}

async function confirmMobile(page: Page, phone10: string): Promise<void> {
  await expect(page.locator('[data-otp-phase="phone"]')).toBeVisible();
  await page.locator('input[type="tel"]').fill(phone10);
  await page.getByRole('button', { name: /Send the code/i }).click();
  await fillCode(page, await codeFor(phone10), page.getByRole('group', { name: /Verification code/i }));
}

test.describe('Google sign-in', () => {
  test.skip(!SERVICE_KEY || !ANON_KEY, 'needs SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY of the local stack');

  test('a Google sign-in confirms the mobile of a profile Admin added and opens that role\'s home', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const phone = freshPhone();
    await db.query("insert into public.profiles (phone, name, role, status) values ($1, 'E2E Google Tech', 'technician', 'active')", [`+91${phone}`]);

    await returnFromGoogle(page, await emailOnlySignIn());
    await confirmMobile(page, phone);
    await expect(page).toHaveURL(/\/technician/);
    await expect(page.locator('[data-server-sample]')).toBeVisible();
    // The database linked this sign-in to Admin's profile, once a code was entered for the number.
    const linked = await db.query("select count(*)::int as n from public.profiles p join auth.users u on u.id = p.auth_user_id where right(p.phone, 10) = $1 and u.email like 'g%@example.com'", [phone]);
    expect(linked.rows[0].n).toBe(1);
    // Settings lists how this account signs in (a reload asks the server who the person is now).
    await page.goto('/settings');
    await expect(page.locator('[data-signin-methods]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('an unknown number waits for Admin, and a number that already has its own sign-in is refused', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await returnFromGoogle(page, await emailOnlySignIn());
    await confirmMobile(page, freshPhone());
    await expect(page.locator('[data-otp-phase="pending"]')).toBeVisible();

    // Someone who signed in with the phone code before already owns their number: Google cannot take it over.
    const owner = freshPhone();
    await signIn(page, owner);
    await expect(page.locator('[data-otp-phase="pending"]')).toBeVisible();
    await page.evaluate(() => { localStorage.removeItem('aiec.auth'); sessionStorage.clear(); });
    await returnFromGoogle(page, await emailOnlySignIn());
    await expect(page.locator('[data-otp-phase="phone"]')).toBeVisible();
    await page.locator('input[type="tel"]').fill(owner);
    await page.getByRole('button', { name: /Send the code/i }).click();
    await expect(page.getByText(/already has its own AIEC sign-in/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('cancelling on Google\'s screen comes back calmly, with a way to sign in', async ({ page }) => {
    await page.goto('/login/google?error=access_denied', { waitUntil: 'domcontentloaded', timeout: 180_000 });
    await expect(page.locator('[data-google-return="cancelled"]')).toBeVisible();
    await page.getByRole('button', { name: /Back to sign in/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
