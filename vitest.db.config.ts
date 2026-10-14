import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Database tests: the Supabase migrations against a real Postgres (DATABASE_URL, or a local one started
// by scripts/db/local-postgres.sh). One file, run in order: the last tests deliberately tamper with the log.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/db/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['tests/db/setup.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
