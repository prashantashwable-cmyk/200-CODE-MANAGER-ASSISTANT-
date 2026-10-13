# Requirements traceability

Status uses only: **Done** (persisted as designed, tested), **Partial**, **Planned**, **Not started**. "Done" here never means connected to a live provider.
"Persisted" for the Decision Desk means the in-memory repository, the same store as the rest of the app (KNOWN_GAPS G1); it does not survive a refresh yet.

| Source | Requirement | Status | Where |
|---|---|---|---|
| Part B P1 | Owner holds decision authority; Authority Matrix | Partial | `features/authority/authority.ts` (matrix, delegates, limits); no Owner-settings editor yet |
| P1 | Delegates scope/amount/time limited | Partial | per-card delegation for 7 days; no standing delegate setup |
| P2 | Admin read-only, cannot decide or see decision detail | Partial | enforced for decisions in the store; legacy Admin actions not yet restricted |
| P2 | Admin prepares Decision Packets | Done | `prepareDecisionPacket`, Admin sheet |
| P4 | Decision Desk: approve/reject/edit/ask/delegate, evidence, impact, history | Done | screen 201 |
| P4 | "Make this a rule", SLA timers, AI-drafted replies, threads | Not started | |
| P5 | Decision recorded with AI recommendation | Partial | card carries recommendation; outcome labels not yet |
| P10.5 | Event immutability, hash chain, identity, class rules and Admin masking enforced in the database | Done in SQL, not yet used by the app | migrations `20261013000001_owner_role.sql`, `20261013000002_platform_events.sql`; 19 database tests on real Postgres (53 total) prove: the server sets actor, time, source and chain position and a lying browser is overruled; append-only for everyone including the server; tampering is detected and located; Owner reads all of their world, a scout only their own, Admin only a masked view with no place; Admin cannot write or correct; classes 2/3/4 and the 15-minute window; decisions Owner-only; idempotency per person. A unit test fails if the SQL and TypeScript class lists drift. **The app does not read or write this table yet** |
| P9.1 | Hash-chained immutable event with the full field set | Partial | `features/events/eventLog.ts`: device time and server time kept apart, clock skew flagged, evidence hash, AI metadata, correlation id, previous-event hash; idempotent by client event id. In memory only |
| P9.1 | Taxonomy of at least 60 event types | Done | `features/events/taxonomy.ts`: 16 families, 79 types (requirement: at least 60), tested |
| P9.2 | Event Log page, scoped per role | Partial | screen 203 (`/log`): family filter, correction sheet, corrected and clock-off badges. Not built: search, saved views, "needs my attention" tab, filter by map view |
| P9.3 | Correction classes 1–4 | Partial | classes decided in `classOf`; class 2 applies at once and keeps the original; class 3 goes to the Owner (Admin cannot approve); class 4 refuses edits and allows dispute. Window is fixed at 15 minutes (not yet Owner-settable); cascade engine and impact preview not built |
| P8.5 | Pin fuzzing, contact masking, Admin sees density only | Done in the data layer | `features/geo/privacy.ts` + `listMapSites`; tested through the repository including that the real point and site name never appear in a partner's response. In-memory: a database build must move this into views/functions |
| P8.5 | Customers never see partner home locations | Done by omission | no partner location is exposed by any map call |
| P8.5 | Scrape detection | Partial | `scrapeSignal` exists and is tested; nothing feeds it from real map queries yet |
| P8.5 | Lead ownership: first valid capture claims, later ones are supporting evidence, disputes to the Decision Desk | Done in the data layer | `features/leads/ownership.ts` + `submitLeadCapture`: radius widened by GPS error, time window, ordering by clock-corrected capture time clamped to the server receipt and a 72 h offline limit; ambiguous cases (too close, poor-then-good GPS, an earlier capture that syncs late) raise a system Decision Desk card. Owner's decision does not yet move the lead (no action on approve) |
| P9.5 | Offline queue, idempotent events, field-level merge, clock-skew handling | Partial | `features/sync/queue.ts` (order kept, backoff, give-up, conflict kept for a person, merge with critical fields) and the capture screen's phone-side queue. Skew is measured from the phone's clock at send, not guessed. Only lead capture uses the queue; map tiles, photos and other writes do not |
| P8 | Ride-safe capture, auto GPS, OCR/voice contact, duplicate warning before saving | Partial | screen 205 (`/capture`): tap or GPS pin, validation, queue state, outcome messages. No photos, OCR, voice, ride-safe mode or pre-save duplicate warning |
| P8 | Map shell with search, list alternative | Partial | screen 204 (`/map`): one map, list beside it, search, precision badges. Not built: layers, plan mode, time slider, clustering, role tool palettes, offline packs |
| P10.2 | Owner second step, server-side refusal | Partial | in-memory refusal tested; DB-level rule not written |
| P7 | Owner role | Done | role, home 202, nav |
| P7 | Other new roles (Sales, QC, NBFC, Logistics, Mentor, Applicant) | Not started | |
| P8 | Map-first home, fuzzing, presence | Not started | |
| P0 | Facilitator commercial model, fee band, quotes | Partly built | `features/quotes/facilitatorQuote.ts` (fee band 60/30/20, bundle discount from fee only, token, waterfall, alternatives, principal-risk flags); screens 206/207; tests `facilitatorQuote*.test.ts`, `quotes.spec.ts`. Mode P is a flag only (no principal flow). |
| P6 | Tier system | Not started (a tier screen exists in the legacy model, 148) | |
| Adaptive screens (user request) | High-resolution adaptive layout | Done for shell, containers, type | `styles/adaptive.css`; per-screen visual review not done |
| Part C | Scout capture, sales flow, QC, payments, SOP, admin analytics | Exists in legacy screens (in-memory); not re-verified against the new model | |
| A9 | Real auth, RLS everywhere, signed URLs, rate limits | Partial | sign-in on Supabase; rest planned |
