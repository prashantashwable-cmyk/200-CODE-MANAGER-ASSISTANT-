# Security and privacy review (Slice 7)

Scope: the facilitator model built in this branch (quotes, work orders, milestones, QC inspectors, handover record, complaints, event stream, Decision Desk, lead ownership) and the database behind it (`supabase/migrations/20261010…` to `20261015000007`). It is a review by the developer, not an independent audit, and it was run against a local Postgres 16 only. **Nothing here has been checked on a hosted Supabase project.** Read it with `KNOWN_GAPS.md`.

## What is enforced where

| Rule | Where it holds | Proof |
|---|---|---|
| Only the Owner decides, issues work orders, names inspectors, resolves complaints | security-definer functions check the caller's profile, never the request | `tests/db/workorders.test.ts`, `decisions.test.ts` (refusals per role) |
| Admin watches and prepares, never decides or writes business events | `app.is_owner()` vs `app.is_admin()` in each function; event log refuses Admin business events | same, and `events.test.ts` |
| A browser cannot choose actor, time, source or chain position of an event | `platform_events` guard trigger; events come only from functions in the same transaction as the step | `events.test.ts` |
| The event stream, closed milestones, resolved complaints, acknowledgements and template versions cannot be edited or deleted, not even by the server | refuse-change triggers | per-file tests (`milestone_is_locked`, `complaint_is_locked`, `handover_is_kept`, `append_only`) |
| A partner never verifies their own work; an inspector verifies only the milestone named for them | `verify_milestone` | `workorders.test.ts` |
| The final milestone waits for the handover record | `verify_milestone` + `app.handover_complete` | `workorders.test.ts` |
| Every public table has row-level security; every security-definer function pins `search_path`; browsers write only to reviewed tables; no browser role can write through a view | catalogue checks | `tests/db/hardening.test.ts` |
| Demo and real data never mix | `is_demo` on every row, checked in every function and policy | tests with a demo Admin and a demo technician |
| SQL and TypeScript decide the same | parity tests (milestone split, ownership, project progress, event classes) | `workorders.test.ts`, `leads.test.ts`, `eventLog.test.ts` |

## Finding fixed in this slice

A customer could insert events into the append-only stream through the view `platform_events_masked` (owner-privileged view, default write privileges). Fixed by `20261015000006_views_read_only.sql` and held by a catalogue test. It lived in a migration that has never been applied to a hosted project. See `KNOWN_GAPS.md`.

## Residual risks, in order of how much they matter

1. **Hosted behaviour is unverified.** Supabase adds its own roles, default privileges and extensions. The hardening tests read the catalogue of the local build, so they must be run again against the hosted project after the first apply (the instructions are in `DEPLOYMENT_AND_RECOVERY.md`).
2. **The app still runs mostly on the in-memory repository.** Server overrides exist for sign-in, quotes, leads, decisions, work orders, projects, complaints and templates. Everything else (older 200 screens) is browser memory and has none of the guarantees above.
3. **Older Admin powers.** The older screens still let Admin approve payouts, tiers, access and fees. The Owner/Admin split holds for the new model only. Moving them is an Owner decision (see the plan).
4. **No real signing or payment provider.** Acceptance and the handover record are in-app acknowledgements, not electronic signatures; payments are recorded by the customer and confirmed by the partner, and the platform moves no money. Do not describe either as a legal signature or a settled payment.
5. **Evidence is recorded by file name only.** No storage, hash or malware scan. A name proves nothing about a file. Needs a storage provider.
6. **An inspector sees the whole order, including amounts**, because row rules are per order, not per milestone.
7. **No rate limiting or abuse controls** on the new functions beyond authentication (Supabase's own limits apply). A customer can raise many complaints.
8. **Entry script is 0.71 MB gzipped (was 1.9 MB).** A performance and availability risk on low-end phones, not a confidentiality one.

## Privacy notes

- **Personal data held by the new tables:** names and phone numbers (profiles), site names and addresses on quotes and orders, complaint text (free text, may contain anything the customer writes), precise coordinates of leads (see below).
- **Locations:** exact lead coordinates are visible to the Owner and the capturing scout; Admin sees density only; others see a fuzzed pin. Partner home locations are never exposed by any map call.
- **Complaint text is shown in full to the customer, the Owner, Admin and the partner named.** Tell customers so before they type (the screen says who reads it only through the generic note; consider adding it).
- **Retention:** no retention or deletion rule exists for the new tables. Orders, milestones, acknowledgements, complaints and events are deliberately never deleted. A data-protection request (access, correction, deletion) has no tool for them; the older privacy screen (194) covers only the older in-memory data. This must be decided with an adviser before real customers.
- **Consent:** recorded for outreach in the older model; the new capture screen records its own consent flag; nothing sends messages in this build (no SMS/WhatsApp provider).
- **Logs:** the event stream contains payloads (amounts, references, names of files). Admin reads a masked view; the Owner reads all of their world. Payment references are kept as typed.
- **Secrets:** no secret is in the repository. The browser holds only the Supabase URL and anon key. The service-role key must never be given to the browser or to CI logs.

## Not reviewed

Supabase Auth settings (OTP length, expiry, rate limits, SMS provider), storage buckets, network/TLS configuration, the hosted project's backups, dependency vulnerabilities (`npm audit` was not run in this review), and the older 200 screens.
