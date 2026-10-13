# Known gaps

Things that are not real yet, why, and what closes each one. Kept in step with
`AUDIT_REPORT.md`; each slice updates this file. Nothing here is silently
dropped: every item is either disclosed on screen or listed below.

Last updated: 2026-10-11 (after slice S1).

## Blocking production use

| # | Gap | Effect today | Closes in |
|---|---|---|---|
| G1 | The app still keeps its data in browser memory, reseeded on load | Nothing survives a refresh; two users never see each other's changes. Sign-in and people are on the database since S1 (with a Supabase project set); every other screen still shows sample data, and a person signed in for real is told so by a banner on every screen. Their in-memory account is made from their server profile at each sign-in | S2 onward, module by module |
| G2 | Without a Supabase project the sign-in code is the constant `123456`; the second step is always `246810` | **S1 made sign-in real when the app is given a Supabase project**: Supabase makes and checks the code, the database decides who the number is (a known profile, or a new one waiting for Admin with no role), and Admin's decision is stamped and audited by the database. Still open: (a) no SMS company is connected, so codes wait in `sms_outbox` and the owner reads them in the SQL Editor (said on the code screen); (b) the second step stays the app's own `246810` (Supabase's is paid); (c) the owner's project must be set up (`docs/SUPABASE_SETUP.md` steps 7–11) | SMS: owner's provider choice + DLT; second step: paid plan or S9 |
| G3 | All authorisation runs in the browser | Rules can be bypassed with dev tools. The server's row-level rules now exist for people and the audit log (21 database tests); every other record moves with its module | S1 onward |
| G4 | The heartbeat (reminders, escalations, SLA, scheduled jobs) runs only while someone has the app open | Overnight automations do not happen. The server clock exists (`app.heartbeat()`, every minute by pg_cron) but today it only checks the audit log; each module adds its steps as it moves | S1 onward |
| G5 | ~~005 / 006 onboarding and 008 customer confirmation save nothing~~ | Closed in S0a | — |
| G6 | ~~Full Aadhaar number stored on applications (142)~~ | Closed in S0a: last four digits only. Still open: the Aadhaar *photo* (a full card image) is kept, and the applicant's own phone holds the full number in its draft while they type. A masked Aadhaar is now asked for; an offline-KYC / DigiLocker flow would close it | S9 |
| G7 | Public OpenStreetMap tile servers used for the map | Breaches OSM tile policy at production volume | S10 (provider: decision) |

## Providers not connected (disclosed on screen)

WhatsApp and SMS sending, payment gateway and payment links, payouts to banks,
bank account verification (penny-drop), GSTIN registry lookup, Aadhaar e-sign,
identity verification, GPS feeds from carriers, provider status probes, push
notifications, file storage (photos and documents are kept as data URLs in
memory), backups. Each screen that depends on one says so; see
`AUDIT_REPORT.md` section G for recommended providers.

## Not connected, said on screen (added in S0a)

- Bank account verification (penny-drop) on 005 / 007: details are saved unverified; AIEC confirms before the first payment.
- GST registry lookup on 007: format and duplicates are checked; an admin confirms the legal name in KYC review (091).
- Scheduled sending of saved reports (030): needs an email / WhatsApp delivery connection.

## Database (S0c) limits

- Free plan: the project pauses after a week with no activity and has no daily backups; move to the paid plan before live use.
- Supabase's own multi-factor sign-in is a paid-plan feature; 195's second step stays the app's own until then.
- Demo sign-ins are not wired: demo profiles exist as a separate world (`is_demo`), but Demo Mode in the app still runs in memory.
- No CI job runs the full Supabase stack yet: the end-to-end sign-in test (`npm run test:e2e:server`) and `test:db` on Supabase's own Postgres were run on a local `supabase start`; CI runs `test:db` on a plain Postgres 17 with a stand-in for Supabase's roles.
- The send-SMS hook is set in `supabase/config.toml` for local stacks; on the live project it is switched on in the dashboard (setup step 8), since `db push` does not carry auth settings.
- A phone number changed on a Supabase sign-in after the first sign-in is not re-linked to a profile.
- Storage buckets and the pg_cron schedule are skipped on a plain Postgres; they were checked on Supabase's local stack, not yet on a live project.
- Error monitoring (Sentry, listed for S0c) is not set up: it needs an account (it has a free plan); added when the app first talks to the server.

## Smaller items

- The first download is still about 7.5 MB (1.8 MB compressed): screens now load when first opened, but every translation (all three languages) and the in-memory sample data still come with the app. They shrink as modules move to the server and translations load per language. A loading screen shows at once, and a start-up failure is shown on the page instead of a blank screen.
- Many Admin screens are reachable only by URL, alerts or the assistant (no nav entry).
- Tests cover the pure rules and the S0a guarantees; most screens have only the per-role smoke. Each later slice adds tests for what it makes real.
- 027's nine configured (legacy) rules still show seeded run and failure counts, and its Retry re-enables the rule rather than re-running it (said in code; no runner exists until S0c's server scheduler).
- Technician quality and on-time scores are "not rated yet" for every seeded technician, since the seed has few QC checks and finished jobs with start dates; 148's tier criteria read them, so a technician's tier review may show the QC criterion as unmet.
- 009 Forgot password is kept (D3) although sign-in is by one-time code. Nobody has a password on the server yet (sign-in is by phone code only), so 009 still runs on the in-memory build; it gets Supabase's password reset if and when email sign-in is connected.
- 002's email-and-password sign-in says "not connected yet" (S1 removed the stand-in that let anyone in); it needs an email sender.
- Google sign-in is built (anyone may use it; a Google account AIEC does not know confirms a mobile number once and then is that person's account). It shows "not set up yet" until the owner does `docs/SUPABASE_SETUP.md` steps 12–14 (Google Cloud OAuth client, Supabase Google provider and redirect URLs, `VITE_GOOGLE_ENABLED=true`). Proven on a local Supabase stack from the moment Google hands the person back; Google's own screen itself is proven only once the owner's setup exists. Until an SMS company is connected, confirming the mobile needs the code read from `sms_outbox`, like any sign-in code.
- A sign-in's phone, once linked to a profile, is never moved to another profile by changing the number (refused by design); changing someone's registered number is not built yet.
- A person waiting for a role chooses one on the code screen; an applicant's full onboarding (005–007) is still separate from the server profile until S2 moves people's records.
- Alerts have no permission check on acknowledge / resolve (part of G3).
- 026's price and responsiveness scores are a stated neutral 0.7: nothing records them yet.
- 020 cannot rank by distance for a job whose site has no position (a historic seed deal): everyone reads as far away, though Admin can still choose one.
- Closed in S0a: no 403 page, 404 reload, domain data in one device's storage (030, 029, 026, 004), seven copies of the phone rule, the supplier placeholder home.

## Added on branch `claude/new-session-g6fda4` (Owner / Decision Desk / adaptive layout)

- **Legacy Admin approvals are unchanged.** Only the Decision Desk bars Admin from deciding. Payout approval (163), tiers (148), access (192), pricing and discounts (067, 070) still let Admin decide. Moving each onto the Decision Desk is Slice 6.
- **Decision Desk data is in memory** like the rest of the app (G1): it resets on refresh. No database table or row-level rule exists for it yet.
- **Delegation** is per card for 7 days. There is no standing delegate setup, amount editor or revoke screen.
- **No Owner settings editor** for the authority matrix; it is code.
- **Owner role labels** use the shared `role.owner` string only. Many legacy screens switch on the five older roles and show no Owner-specific wording.
- **The Owner opens Admin's screens** as a superset. Those screens still say "Admin" in places.
- **Seed**: the legacy Admin account is now "Control Tower Admin" (9822011001); the Owner is Prashant Vasant Wable (9822011009). Old history text still names Prashant against the Admin role.
- **Adaptive layout** was checked on the Decision Desk at 390, 1440, 2560 and 3840 px only. Other screens were not reviewed at those sizes; the Admin live map and tables are the likely ones to need work. Desktop headers are centred while content is left-aligned (pre-existing).
- Not started: map-first home for all roles, privacy by geometry, general event store, correction classes, facilitator quote model, new partner roles.

## Added with the map, privacy and event-log slice

- **Map tiles are the public OpenStreetMap servers** (G7), and they do not load in this build environment, so screenshots show pins but a blank basemap. A tile provider decision is open.
- **The map has a screen (`/map`) but only the Owner has a nav entry.** Surveyor, technician, customer, supplier and Admin reach it by address. Their tab bars do not yet carry it, and "the map is every role's home" is not done.
- **Approximate pins are tested against one open offer** in the seed (a job with no technician, on the Kulkarni deal). "Offered" means exactly that: a job nobody has accepted. There is no offer, acceptance or token flow yet, so a partner cannot actually accept from the map.
- **The pin salt is generated per run** in memory. A real build keeps it as a server secret; until then fuzzed pins move after a restart.
- **Density for Admin** hides cells under 3 sites at about 1 km. The demo seed is too sparse to show any, so Admin's demo map is empty until real volume exists (the screen says why).
- **Event log is in memory.** A refresh empties it, except that lead creation from the demo seed does not backfill events for the 12 seeded leads. Only leads captured after start-up have a `lead.captured` event.
- **Only lead capture writes events so far.** Quotes, contracts, QC, payouts and the rest do not emit into the stream yet; the taxonomy is ready for them.
- **Owner may correct another person's non-locked event directly.** Class 3 approval is for everyone else; this is the one place the Owner is not sent to themselves. Locked (class 4) events are locked for the Owner too.
- **No Event Log search, saved views, "needs my attention" tab, or Owner-settable correction window.**
- **No sync conflict handling beyond idempotency and clock-skew flags.** The offline queue, field-level merge and conflict cards are not built.

## Added with lead capture, ownership and the offline queue

- **Approving an ownership dispute does nothing yet.** The Owner can decide the card, and the decision is recorded, but the lead stays where it is. Moving the lead (and its capture commission) on approval is not built.
- **Supporting captures carry no photos or contact data yet**, only a note on the lead's timeline and an event. The capture screen has no photo step.
- **No duplicate warning before saving.** The scout learns the outcome after the capture is sent, which is the only honest moment offline. An online pre-check is not built.
- **Backdating is bounded, not prevented.** A capture cannot claim to be more than 72 hours old or later than the server received it, and an earlier-looking capture from a different scout always goes to the Owner. A phone that lies about its whole clock for a lead captured within those 72 hours cannot be caught by software alone.
- **The offline queue lives in browser storage** (`aiec.captureQueue.<user>`). A cleared browser loses what has not been sent. Only lead capture uses it.
- **Ownership settings** (60 m radius, 30 days, 30 m GPS limit, 5 minutes, 72 h offline) are code defaults, not yet Owner-editable.
- **Seeded leads have no recorded GPS accuracy**, so a new capture beside one is judged on position and time only.
- **Capture and Map are reachable from the map's button and by address**; surveyors' bottom tab bar still points at the older capture screen (032), which does not use the ownership rule.

## Added with the database event stream

- **The app does not use the new table yet.** `platform_events` and its rules are written and proved on real Postgres (`npm run test:db`), but the screens still read the in-memory log. Wiring `listEvents` / `appendEvent` into `withServer` needs a running Supabase stack (Docker) to test end to end, which this build environment does not have. Until then nothing the app records survives a refresh.
- **Two hashes exist.** The in-memory log uses a fast non-cryptographic fingerprint; the database uses SHA-256. They are different on purpose and not comparable. Once the app reads from the database, the database's chain is the one that counts.
- **The database does not yet know which scout owns a lead or who a customer is**, because leads, deals and jobs are still in memory. So the database lets a scout read only events they wrote themselves; "a scout sees events on a lead they own" and "a customer sees their own project" still need those tables.
- **No database table yet** for decision cards and records, leads, ownership captures, map sites, the offline queue's server side, or settings. Pin fuzzing and density are still computed in the in-memory repository, not in a database view.
- **The Owner role was added to an existing enum**, and `app.is_admin()` now also returns true for the Owner (the Owner holds every authority Admin holds). The 34 earlier database tests still pass. Any policy added later that must be Owner-only has to check `app.is_owner()`.
- **The correction window is fixed at 15 minutes in SQL**, not Owner-settable. Making it a setting needs a settings table the Owner alone can write; a session setting would let any browser widen it.
- **Admin's view has no `lat`/`lng` and no geo, but the site name still appears** in event payloads. Whether Admin may see site names (as opposed to places) is an open question.

## Free-tier policy (2026-10-13)
See docs/FREE_TIER_POLICY.md. Supabase free plan: pauses after inactivity, no daily backups, 500 MB cap, no SMS. Limits quoted from third-party sources, unverified against the vendor.

## Slice 3 — facilitator quote (2026-10-13)
- In memory only: quotes, fee settings and their history are not in the database yet (no migration, no `withServer` override).
- All fee values are placeholders for the Owner: 60% target markup on partner cost, 30% assistant floor, 20% person floor, 18% GST on the fee `[VERIFY with the accountant]`, Rs 10,000 token, cost rates in the waterfall. A 60% markup on partner cost is 37.5% of the partners-plus-fee total (before GST): whether customers accept that is untested (see the alternatives card).
- Partner prices are typed in by staff here. Real partner offers (RFQ to partners, partner consent to a changed price) are not built.
- Customer acceptance is per component and recorded as events; the booking token is displayed, not collected (no payment provider connected).
- A below-floor quote by Admin raises a `fee_change` Decision Desk card but the quote itself is not saved until the Owner re-saves it; accepting the card does not yet create the quote.
- Mode P (principal) is only a flag: `computeQuote` refuses it. The comparison table is not built.
- The customer's quote is reachable by URL (`/my-quote`, Documents tab); nothing on the customer home links to it yet.

## Quotes on the database (2026-10-14)
- Migration `20261014000001_facilitator_quotes.sql`: fee history (Owner-only, append-only), quotes (server prices them and writes the totals; Admin cannot go below the person floor; the priced facts never change; only a draft can be sent), per-component acceptances (own customer only, once each). Proved on real Postgres 16 (`tests/db/quotes.test.ts`, incl. SQL = TypeScript maths for the same lines).
- `withServer` now overrides the quote and fee methods (`src/data/supabase/serverRepository.ts`). **Not run against PostgREST/Supabase**: this sandbox could not pull the Supabase images (Docker Hub 429, ghcr 403), so the client calls are only type-checked and their row mapping unit-tested (`quoteMapping.test.ts`). First thing to run on a real free project: sign in as Owner, save a fee setting, build and send a quote.
- Leads, deals and users are still in memory, so on the server a quote keeps the lead only as text (`lead_ref`) and has **no customer link** (`customer_id` null) until leads/deals move to the database. A customer therefore cannot yet see a server-side quote.
- Quote and acceptance events are not written to the server event log yet (the in-memory log still receives them); the acceptance rows themselves are the durable record.
- A quote needs the Owner's fee card decision but accepting the card still does not create the quote.
