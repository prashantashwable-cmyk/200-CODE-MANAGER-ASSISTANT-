import { defineConfig, devices } from '@playwright/test';

/**
 * S1: real sign-in end to end against a Supabase stack (`npx supabase start`, see docs/SUPABASE_SETUP.md). The app is
 * started with that stack's address and public key; the test reads each sign-in code from the database's outbox, the
 * way an SMS provider would, so nothing about the code is faked. `npm run test:e2e:server`.
 */
const API_URL = process.env.SUPABASE_API_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /server-.*\.spec\.ts/,
  // The first page load waits for the dev server to compile every screen.
  timeout: 420_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--no-sandbox'] },
  },
  projects: [{ name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }],
  webServer: {
    command: 'npm run dev -- --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { VITE_SUPABASE_URL: API_URL, VITE_SUPABASE_ANON_KEY: ANON_KEY },
  },
});
