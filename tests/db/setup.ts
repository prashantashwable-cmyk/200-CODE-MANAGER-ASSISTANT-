import { execFileSync } from 'node:child_process';

/** Points the tests at a fresh database: DATABASE_URL if set (CI), else a throwaway local Postgres. */
export default function setup(): void {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = execFileSync('scripts/db/local-postgres.sh', ['start'], { encoding: 'utf8' }).trim();
  }
  // DB_ALREADY_MIGRATED=1: the target is a Supabase stack that applied supabase/migrations itself
  // (`supabase start`); the stand-in must never be applied there.
  if (process.env.DB_ALREADY_MIGRATED) return;
  execFileSync('node', ['scripts/db/apply.mjs', '--fresh'], { stdio: 'inherit', env: process.env });
}
