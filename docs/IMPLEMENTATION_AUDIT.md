# Implementation audit (Phase Zero)

Base: `aiec-200-screen-build` @ `68589cf`, branch `claude/production-build-stage`, imported unchanged as the first commit of this branch.
Everything below was observed by running commands or reading the code; nothing is inferred from the prompt.

## What the code is

| Area | Finding |
|---|---|
| Stack | React 18, TypeScript, Vite 5, react-router 6, i18next (en/hi/mr), Leaflet, Recharts, Supabase client, Vitest, Playwright |
| Screens | 200 numbered specs built as `src/screens/<nnn>-<slug>/` (route, view, hook, types, i18n); routes are discovered by glob, translations assembled by glob |
| Data layer | One `Repository` interface (`src/data/repository.ts`, ~10k lines) with an in-memory implementation (`memoryRepository.ts`, ~33k lines) reseeded on load; `withServer()` swaps in Supabase for sign-in and people only |
| Server | Supabase migrations: identity/profiles, hash-chained `audit_events`, heartbeat, storage buckets, phone and Google sign-in; 34 database tests |
| Authorisation | Mostly in the browser/in-memory repository (G3 in KNOWN_GAPS); row-level rules exist only for profiles and the audit log |
| Map | Leaflet with public OSM tiles (G7); `MapCanvas` plus Admin live map (011) |
| Design | Token-based design system in `src/design-system` and `src/styles`; seven themes |
| Baseline | typecheck clean, translations complete, no-mock guard clean, 40 unit tests pass |

## Findings against the consolidated prompt

| # | Severity | Finding | Evidence | Fix | Test |
|---|---|---|---|---|---|
| A1 | High | No Owner role; Admin held every decision | `Role` had 5 values; ~180 `role !== 'admin'` gates | Owner role added; Owner passes Admin gates; Admin barred from the new Decision Desk decisions | `authority.test.ts`, `decisions.test.ts`, `owner-desk.spec.ts` |
| A2 | High | Owner would have had no second step or session limit | Security policy keyed by role; no entry for Owner | Owner added to policy defaults, versions and seed enrolment | `owner-desk.spec.ts` (Owner must pass second step) |
| A3 | High | Existing Admin actions (payouts, tiers, access, fees) still let Admin decide | `grep` of repository gates | **Not fixed.** Staged in Slice 6; see IMPLEMENTATION_PLAN | none yet |
| A4 | High | Persistence is in-memory except sign-in/people | G1 | **Not fixed.** Each module moves to Postgres in turn | none yet |
| A5 | Medium | No event store with the prompt's taxonomy; one chained log exists for automations (187) and now one for decisions | `audit/chain.ts` | Slice 2 generalises to one event table | partial |
| A6 | Medium | Layout stopped growing at 1280/1600px, so 2K/4K showed a small column | screenshot at 3840x2160 | `styles/adaptive.css` | `owner-desk.spec.ts` measures width and type at 390/1440/2560/3840 |
| A7 | Medium | Role labels for Owner missing on many legacy screens (they key on the five roles) | `grep` of `*.i18n.ts` | Shared `role.owner` added; per-screen labels listed in KNOWN_GAPS | none |
| A8 | Low | Desktop screen headers are centred while content is left-aligned (pre-existing) | 4K screenshot | Left as is; design lock | none |

## Conflict resolutions (prompt vs repo)

`AUDIT_REPORT.md` C1–C6 recorded these conflicts. The owner chose to adopt the prompt's model. Resolutions:

| Conflict | Resolution |
|---|---|
| 12 roles vs 5 | Owner added now. Scout=Surveyor, Installer=Technician, QC=custom role `cr-1`. NBFC, Logistics, Mentor, Sales, Applicant planned in Slice 6; not built |
| Admin approves vs Admin only monitors | Done for the Decision Desk. Legacy Admin approvals remain until Slice 6 (A3) |
| Map as every role's home | Not done. Plan in Slice 2; existing homes unchanged so far |
| Event-sourced core | Decision records are chained; general event store is Slice 2 |
| Pin fuzzing | Slice 2, enforced in the database |
| Facilitator model | Not started; quotes still follow the legacy model (Slice 3) |
