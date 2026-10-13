import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

/** Unit and repository tests (Node). Browser journeys live in tests/e2e and run under Playwright. */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20_000,
  },
});
