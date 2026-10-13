import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke: every role signs in through the real login screen and reaches its home and its key screens
 * with no page error. Runs against the Vite dev server. Locally the pre-installed Chromium is used
 * (PLAYWRIGHT_BROWSERS_PATH); CI installs its own with `npx playwright install --with-deps chromium`.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  // Real sign-in against a Supabase stack has its own config (playwright.server.config.ts).
  testIgnore: /server-.*\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--no-sandbox'] },
  },
  projects: [
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
