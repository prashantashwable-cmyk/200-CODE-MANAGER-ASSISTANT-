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
