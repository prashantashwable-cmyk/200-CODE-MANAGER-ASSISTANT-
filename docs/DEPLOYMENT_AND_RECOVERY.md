# Deployment and recovery

Everything here is a procedure to follow, **not something that has been done**. No hosted Supabase project exists yet (the Owner will create the free one). Free plan: the project pauses after inactivity and has **no automatic daily backups** (see `FREE_TIER_POLICY.md`), so recovery depends on the dumps below.

## 1. First deployment (new free Supabase project)

1. Create the project (Owner). Note the project URL and the anon key. Keep the database password and the service-role key in a password manager. Never put them in the repository, the browser or CI logs.
2. Apply migrations **in file order** from `supabase/migrations/` (`20261010000001` … `20261015000007`). Either `npx supabase db push` (after `supabase link`) or paste each file into the SQL editor in order. Do not edit an applied file; fix forward with a new one.
3. Run the structural checks against the hosted database (read-only catalogue queries): every public table has RLS; every security-definer function pins `search_path`; no browser role can write through a view; browsers write only to the reviewed tables. The same queries are in `tests/db/hardening.test.ts`; run it with `DATABASE_URL` pointing at the hosted database **only on a throwaway copy**, because the other tests create rows.
4. Auth: enable phone sign-in with a provider (decision needed: SMS provider and DLT registration). Keep `[auth.sms] enable_confirmations` on. Until a provider exists, codes go to `sms_outbox`, which is for development only: do not use it with real customers.
5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the static host. Build with `npm run build`, then `npm run budget`. Deploy `dist/`.
6. Create the first Owner by hand in the SQL editor (profile with role `owner`, active), then sign in and confirm the Owner's second step works. Admin accounts are created by the Owner's approval, never self-assigned.
7. Smoke test by hand as Owner, customer and a partner: issue a quote, accept, issue work orders, accept both sides, evidence, verify, record payment, confirm, handover, complaint. The checklist is the e2e tests in `tests/e2e/workOrders.spec.ts` (they run against the in-memory build; `npm run test:e2e:server` runs a real sign-in against a Supabase stack and has not been run).

## 2. Backups (needed because the free plan does not make daily ones)

- **Weekly at least, and before every migration:** `pg_dump --format=custom --no-owner --file aiec-YYYY-MM-DD.dump "$DATABASE_URL"` from a machine the Owner controls. Store two copies in two places, one offline. Name the dump with the last applied migration.
- A dump holds personal data. Encrypt it at rest (`gpg --symmetric`), restrict who holds it, and delete old ones on the schedule the Owner sets (retention is undecided; see the privacy review).
- Not backed up by a database dump: uploaded files (none exist yet) and Auth provider settings (write them down).

## 3. Restore drill (do it once before real use, then every quarter)

1. Create an empty scratch Supabase project (or a local Postgres). Never restore over production to test.
2. `pg_restore --no-owner --clean --if-exists -d "$SCRATCH_URL" aiec-….dump`.
3. Verify the event chain is intact: `select * from app.verify_event_chain();` returns `ok = true`. Run `tests/db/hardening.test.ts` against the scratch copy. Check row counts of `work_orders`, `work_order_milestones`, `complaints`, `platform_events` against the source.
4. Record the date, the dump used and the result in `KNOWN_GAPS.md`. A restore that was never rehearsed should be described as untested.

## 4. Rolling back a migration

Each new migration has a rollback note in its header. Rules: dump first; roll back newest first; never roll back a migration whose tables hold real data without an Owner decision, because the new tables are append-only by design and dropping them destroys records that are meant to be permanent.

| Order to undo | Migration | Effect of undoing |
|---|---|---|
| 1 | `…15000006_views_read_only` | none needed; do not undo (it removes unsafe privileges) |
| 2 | `…15000005_complaints` | loses complaints and the partner counts |
| 3 | `…15000004_handover_record` | loses acknowledgements; restore the previous `verify_milestone` from `…15000002` first |
| 4 | `…15000003_milestone_payment_confirmation` | closed milestones would be unreadable; restore the previous guard first |
| 5 | `…15000002_milestone_qc_inspectors` | loses inspector assignments |
| 6 | `…15000001_work_orders` | loses all work orders and milestones |

## 5. Incident basics

- **Suspected forged or altered records:** run `select * from app.verify_event_chain();`. If `ok` is false, note `broken_at`, stop writes (pause the project from the dashboard), restore from the last good dump into a scratch project and compare.
- **Leaked key:** rotate the anon and service-role keys in the dashboard, redeploy the static site with the new anon key, and review the event stream for the time window.
- **A wrong payment or acknowledgement:** nothing is edited. Corrections are a new record with a reason (events) or, for milestones, a dispute handled outside the app until a dispute path exists (listed gap).
- **Who to call:** the Owner decides; there is no on-call rota and no monitoring. Add an uptime check and an error tracker (both have free tiers) before real customers; neither is set up.

## 6. What is not ready for production

Signing and payment providers, file storage, SMS/WhatsApp, a payment dispute path, retention and data-request tools for the new tables, monitoring, a hosted-project verification of every security test, and the entry-script size. See `KNOWN_GAPS.md`.
