#!/usr/bin/env node
/**
 * Applies the database to a Postgres: for tests, the Supabase stand-in first (tests/db/supabase-shim.sql),
 * then every file in supabase/migrations in name order. Usage:
 *   DATABASE_URL=postgres://… node scripts/db/apply.mjs [--fresh]
 * --fresh drops and recreates the test database's schemas first. On a real Supabase project use
 * `supabase db push` instead (it applies the same migration files and never the stand-in).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set (scripts/db/local-postgres.sh start prints one)');
  process.exit(1);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  if (process.argv.includes('--fresh')) {
    await client.query(`drop schema if exists public cascade; drop schema if exists app cascade;
      drop schema if exists auth cascade; drop schema if exists extensions cascade; create schema public;`);
  }
  const files = [join(root, 'tests/db/supabase-shim.sql')];
  const dir = join(root, 'supabase/migrations');
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) files.push(join(dir, f));
  for (const f of files) {
    await client.query(readFileSync(f, 'utf8'));
    console.log(`applied ${f.slice(root.length + 1)}`);
  }
} finally {
  await client.end();
}
