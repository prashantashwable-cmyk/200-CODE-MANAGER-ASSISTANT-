# AIEC — the built application

This folder now contains **a running application**, not just the prompt set that
describes one. The `000_`–`200_` markdown files are unchanged; everything
else here is the implementation of them.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173 and press **Try Demo** — four role tiles, no
form to fill, populated data behind every one.

---

## What was built, and what wasn't

| | |
|---|---|
| **Built** | The Foundation Prompt in full, plus screens `001`–`060` (Modules 1–6, all complete): Onboarding, Field Surveyor & Lead Capture, Admin Command Centre & Live Map, Analytics & Rewards, CRM Lead & Pipeline Management, and the Automated Communication Engine. |
| **Not built** | Screens `061`–`200` (Modules 7–20). Their prompt files exist in this folder now, but implementation hasn't reached them yet. |
| **Real, not simulated** | Maps (Leaflet + OpenStreetMap, genuine geography), GPS (`navigator.geolocation`), camera capture (device camera via `capture="environment"`), business-card OCR (Tesseract.js, on-device). |
| **Stubbed deliberately** | Firebase, payments, WhatsApp, financing, file storage (uploads stay in-tab). Each is explained under *Honest limits* below. |

Roles **Technician**, **Customer** and **Supplier** can sign in, switch language
and theme, and navigate — but their home screens say plainly that their module
(13, 18 and 10 respectively) has no prompt file here yet, rather than showing a
dashboard wired to nothing.

---

## How to run it

Requirements: Node 20+ (built and verified on Node 24, npm 11).

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :5173, hot reload |
| `npm run build` | Type-check and produce `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint:keys` | **Translation completeness gate** — see below |

### Things worth clicking

- **Try Demo → Admin** lands on the executive dashboard; the Map tab is the live
  operations command centre.
- **Try Demo → Surveyor** lands on the field home; the Capture tab runs the full
  five-step lead-capture wizard, including real GPS and duplicate detection.
- **Settings → Appearance** switches all seven modes instantly, app-wide.
- **Settings → Language** switches English / Hindi / Marathi — watch the
  typeface change with it, not just the words.
- **Settings → Developer → Simulate network failures** forces reads to fail so
  you can actually see every error state instead of taking their existence on
  trust.

---

## Architecture

The two structural rules from the prompt set are enforced, not just followed.

### The 3-file split (`000_CODE_ARCHITECTURE_PATTERN.md`)

Every screen with real state is a folder of small, single-purpose files:

```
src/screens/032-capture-gps/
  capture-gps.types.ts     types + translation KEYS. No logic, no text.
  useCaptureGps.ts         the state machine. No rendering, no copy.
  CaptureGpsView.tsx       thin view. No business logic, no literals.
  capture-gps.i18n.ts      en / hi / mr for this screen only.
  route.tsx                this screen's route declaration.
```

### Nothing is centrally registered

Routes and translations are **discovered by glob**, not listed in a shared file:

- `src/navigation/registry.ts` globs `src/screens/**/route.tsx`
- `src/i18n/index.ts` globs `src/screens/**/*.i18n.ts` and deep-merges them

Adding a screen means creating its folder. There is no `routes.tsx` to edit and
no `en.json` to append to — which is what let 40 screens be built in parallel
without collisions, and what will let screens 041–200 be added the same way.

```
src/
  design-system/   Card, Button, AscensionLine, MapCanvas, states, fields, format
  data/            types, seed dataset, Repository interface, in-memory impl
  session/         who is signed in, in what mode, language, theme
  navigation/      route registry, per-role nav config, the app shell
  i18n/            i18next setup + shared vocabulary
  features/        cross-screen state (the lead-capture draft)
  screens/         one folder per screen
  styles/          tokens.css (all 7 modes) + base/utilities/components/shell
```

---

## The seven appearance modes

`000_DESIGN_SYSTEM.md` documents four modes. **The numbered screen prompts
require seven** — they add Orbital, Lithium and Pure, and state that the token
values "live in `000_DESIGN_SYSTEM.md`", which they do not.

All seven are implemented. Light, Snow White and Dark use the documented token
tables exactly. Orbital, Lithium and Pure are built from the background and
accent hexes given inline in the screen prompts; their remaining tokens were
derived to hold the same contrast relationships as the three documented modes.
**If you have canonical values for those three, replace them in one place** —
`src/styles/tokens.css` — and every screen follows automatically.

No component anywhere contains a hex value. That is the property that makes
seven modes a token swap instead of seven times the components.

## Three real languages

English, Hindi and Marathi, switchable per user and saved on their record.
Switching also swaps the font pairing — Latin (Fraunces / Plus Jakarta Sans)
to Devanagari (Martel / Hind) — driven by the `lang` attribute, so Hindi and
Marathi never silently fall back to a system font.

`npm run lint:keys` enforces what the architecture doc asks for and what is
easiest to fake:

- every key in `en` exists in `hi` and `mr`
- no `hi`/`mr` value is a copy of the English string
- no `TODO` / `FIXME` markers survive

Numerals stay Western (0–9) in all three languages, in IBM Plex Mono — India's
digital finance convention, and why money columns line up.

---

## Honest limits

Each of these is a real dependency on an account, key or contract that does not
exist yet. None is faked; each is isolated behind an interface so wiring it up
later is a contained change.

**Firebase is not connected.** The Foundation Prompt specifies Firebase Auth,
Firestore and Hosting. That needs a real project, real keys and an owner-approved
billing tier — none of which can be provisioned from a build session. So the app
ships a seeded in-memory store behind a `Repository` interface, and Demo Mode is
fully functional against it. `src/data/firebase.ts` documents exactly what to
implement, the collection list, the env vars, and — importantly — the security
rule that must forbid a demo session from touching `isDemo: false` records.
Client-side separation is not a boundary; that rule belongs on the server.

**Sign-in is simulated.** Phone+OTP, email/password and Google all render and
behave correctly, including the 3-attempts-then-60-second-cooldown rule, but no
SMS is sent and no credential is verified. Real auth arrives with Firebase.

**Maps are real.** `MapCanvas` is built on Leaflet with OpenStreetMap raster
tiles — genuine geography, real street names, true Mercator projection, no API
key or billing account required (unlike Google Maps, which the original prompt
set assumed). Every map screen (011, 013–017, 019, 020) consumes markers /
zones / heat / routes through the same props either way, so this was a
same-day swap behind one component with zero changes to any consuming screen.
Dark-leaning appearance modes invert and hue-rotate the tile layer — OSM has no
free per-theme dark tile set — while markers, zones and tooltips stay in the
brand's real token colours. Tile requests need network access and carry the
mandatory OpenStreetMap attribution shown on every map; a production
deployment doing meaningful traffic should move to a paid tile provider (or a
self-hosted tile server) per OSM's usage policy rather than hammering the
public tile servers.

**GPS and camera are real too.** The permissions primer (010) genuinely calls
`navigator.geolocation.getCurrentPosition` and `navigator.mediaDevices.getUserMedia`
to request and report actual device permission state — nothing is faked as
granted. Document and photo capture (`DocumentSlot`, used across onboarding and
lead capture) uses `<input type="file" capture="environment">`, which opens the
real device camera on a phone. The one honest gap is storage: captured bytes
stay in the tab as an object URL rather than uploading anywhere, because there
is no storage bucket wired up — previews, retakes and removal all work, the
upload endpoint just doesn't exist yet. Business-card OCR (screen 033) runs
genuine on-device text recognition via Tesseract.js — no server ever sees the
card image; the engine's WASM core and trained-data file load from a CDN on
first use, the same network trade-off already made for map tiles and fonts.

**Manual GPS pin-drop is a real map interaction.** When a GPS fix is poor
(screen 032), `MapCanvas` exposes a genuine `onMapClick` handler — tapping the
map itself corrects the pin, it isn't a decorative gesture.

**Still required before real customers or real money**, each flagged at the
relevant prompt: a payment gateway account and keys, a WhatsApp Business API
account, a financing-partner integration, and a lawyer's review of the generated
contract and compliance copy. The design system's own guidance applies here —
keep the English contract the single binding text and treat any Hindi/Marathi
version as a reference translation.

**The follow-up engine only runs while someone has the app open.** The
manager layer (below) is driven by a one-minute heartbeat in the app shell,
because there is no server to run a scheduler. `runFollowUpEngine` is written
as a pure pass over (data, now) — the same function a Firebase scheduled Cloud
Function would call every few minutes — and every step is idempotent, so
moving it server-side is wiring, not a rewrite. Until then, a reminder due at
3 a.m. goes out when the first person opens the app that morning (catch-up is
built in: nothing is lost, only late). Real push (FCM), WhatsApp Business API
and DLT-registered SMS templates are the channels it will need.

**The data is demo data.** Realistic for the Pune / Pimpri-Chinchwad market —
genuine localities and coordinates, lift prices in the range Indian
passenger-lift quotes actually land in — but invented. Every record carries
`isDemo: true`.

---

## Where to go next

1. Finish Module 7 (`068`–`070`), then build `071`–`200` for Modules 8–20
   (Negotiation & Deal Closing, Payments & Financing, Supplier & Manufacturer
   Management, and the rest) the same way: one folder per screen, no shared
   file to edit. Modules 5 and 6 are complete and checkpoint-verified;
   Module 7 is in progress. See below and `CLAUDE.md`.
2. Stand up the Firebase project and implement `firebaseRepository`.
3. Wire up a storage bucket so `DocumentSlot` uploads actually persist, and
   move off the public OSM tile servers to a paid or self-hosted tile source
   before any real production traffic.
4. Get the contract and safety-compliance copy reviewed before go-live.

---

## Module 5 — CRM Lead & Pipeline Management (`041`–`050`)

Ten admin-facing screens under the new **Leads** tab, all reading and writing
through the same `Lead` records the first four modules already seeded —
there is no second, CRM-specific copy of the data anywhere.

- **041 Lead Inbox** — the master list every other CRM screen treats as ground
  truth, plus a "Go deeper" quick-link grid to the rest of the module (042
  and 049 are reached contextually from a lead instead, via "Open full lead
  detail" and "Mark lost").
- **042 Lead Detail / Timeline** — a 360° view with an append-only timeline
  rendered with the Ascension Line motif; every mutating action (stage
  change, note, follow-up, message) writes through the same repository calls
  the other CRM screens use.
- **043 Pipeline Kanban** — drag-and-drop on wide screens, tap-to-move on a
  phone (native HTML5 drag has no real touch story); moving a card to Quoted
  or Won is gated on a linked deal / an agreed price, with the block
  explained inline rather than silently refused.
- **044 Lead Assignment** — the unassigned-lead queue with a real
  proximity/workload suggestion per lead, plus bulk redistribution off one
  surveyor's book when they leave or a territory gets rebalanced.
- **045 Duplicate Merge** — side-by-side comparison with a commission-impact
  line that's always visible before the merge button, never a second click
  away; a merged-away record is marked, never deleted, so it stays
  directly viewable for audit even though it drops out of every list.
- **046 Lead Scoring** — a transparent, breakdown-on-request priority score;
  admin-adjustable weights warn before a change would meaningfully reshuffle
  the active pipeline, and a closed lead's score is frozen at whatever
  weighting was active when it was computed.
- **047 Follow-Up Scheduler** — a date-bucketed hybrid of the calendar/list
  view the spec asks for, overdue always first regardless of due date; a
  follow-up on a lead that closes before it's actioned cancels itself.
- **048 Source Attribution** — per-channel conversion rate, average deal
  value and cost-per-conversion, read from the `source` field every lead is
  tagged with once, immutably, at capture.
- **049 Lost Disqualification** — a fixed six-reason taxonomy, an optional
  revisit reminder that becomes a real dated follow-up task, and one last
  glance at the lead's recent activity before confirming.
- **050 Import / Export** — a real four-step CSV wizard (upload → column
  mapping → validation preview → commit), no library: imported rows run
  through the exact same required-field and duplicate checks a field
  capture goes through.

Two gaps worth knowing about if you build on top of this module: the
`Quotation`/`Contract` entities the spec references don't exist yet (that's
Module 6/7's job), so the Kanban's Quoted/Won gates use the existing `Deal`
record as the closest real proxy; and "send message" on the Lead Detail
screen logs a real, permanent timeline event but doesn't actually dispatch
anything — delivery wiring arrives with the Communication Engine module.

---

## Module 6 — Automated Communication Engine (`051`–`060`, complete)

All ten screens built under the new **Comms** tab. Like Module 5, everything
reads and writes through one shared repository layer — `CommTemplate`,
`CommSequence`, `Conversation`/`CommMessage`, `CallLogEntry`, `SmsBroadcast`,
`BotConfig`, `OptOutEvent` and `TriggerRule` — extended once up front before
any of the ten screens were built, so e.g. the WhatsApp console's
quick-replies, the call log's disposition, and the compliance screen's
send-blocking check all agree with each other by construction, not by
convention. Checkpoint-verified end to end (all ten screens clicked through,
plus a regression spot-check of 021 and 041) before moving to Module 7.

- **051 Communication Templates** — versioned per-language template bodies
  with merge-field preview; owns the shared `commChannel.*` label set every
  later Comms screen reuses, and hosts the module's own "Go deeper"
  quick-links grid to the other nine screens.
- **052 Sequence Builder** — a multi-step wizard that persists as an inactive
  draft between steps, so the test-send step always operates on a real
  record rather than in-memory wizard state.
- **053 WhatsApp Console** — quick-replies render from the same template
  bodies 051 edits; an inbound "STOP" shows a persistent opt-out banner that
  only clears once actually acknowledged, not just on next render.
- **054 Call Log / Auto-Dialer** — `tel:` links genuinely open the device
  dialer; a `Connected – interested` disposition nudges the lead one real
  pipeline stage forward (capped before Quoted, which still needs a linked
  deal — the same gate 043's Kanban enforces).
- **055 SMS Broadcast** — the segment builder reuses 041's own stage/source/
  city filters; cost estimate and delivery report both exclude opted-out
  contacts from the same `previewBroadcastSegment` call, so the number
  quoted before sending is the number actually billed. TRAI's 9pm–9am
  promotional-SMS restriction blocks scheduling outright.
- **056 AI Bot Configuration** — the discount range is validated against a
  margin-floor constant (`MAX_SAFE_BOT_DISCOUNT_PCT`, `src/features/
  communication/botRules.ts`) before it can save; the simulator tests the
  *current unsaved draft*, not just the last-saved config, so adjusting a
  slider and re-testing never requires leaving the screen.
- **057 Reply Inbox** — a real cross-channel view, not a separate copy: it
  aggregates WhatsApp/SMS messages the bot escalated (`requiresHumanReview`)
  with missed calls still awaiting a callback, computed as "the newest
  call-log entry for this lead is a `no_answer`" — placing a fresh call
  naturally clears the item, no separate "handled" flag needed on
  `CallLogEntry`.
- **058 Compliance & Opt-Out Manager** — per-contact status is computed from
  the same append-only `OptOutEvent` log that `isOptedOut()` checks before
  every send, so this screen's list can never drift from what actually
  blocks a message. Opt-ins are new events, never edits to old opt-out
  records — the compliance history is append-only by construction.
- **059 Trigger Rules** — the actual rule table the automation engine reads,
  not documentation of it; priority ties break on most-recently-created,
  only the top non-stacking match fires per stage, and the built-in
  simulator runs that exact evaluation against a hypothetical stage.
  Disabling a rule tied to a sequence asks explicitly whether in-flight
  leads should finish or stop — "stop" deactivates the linked `CommSequence`
  for real via 052's own `toggleSequence`, not a decorative flag.
- **060 Communication Analytics** — read-only, over the same real
  channel/template/SLA figures the repository computes from actual message
  and reply-inbox records. Templates with too few sends are labelled early
  data and excluded from both the poor-performer check and the
  median/average, so sparse data never gets unfairly ranked.

One gap worth knowing about: `bot.reply.*` and `bot.escalate.*` (056) and
the outage annotation on 060 (`commAnalytics.outageNote`) are the only
places the repository returns a translation *key* rather than raw data — a
deliberate pattern (mirrors `escalateReasonKey` already in the type) so
simulated/demo copy stays real in all three languages instead of leaking
English from the data layer. The outage note itself is a fixed demo
annotation, not a live incident feed — there's no status-page integration
to compute it from yet.

---

## Module 7 — Auto-Quotation Engine (`061`–`070`, checkpoint-verified)

Everything under the **Quotes** tab (`/admin/quotes`). As with Modules 5 and 6,
the data model was extended once up front (`Quotation`, `QuotationTemplate`,
`DiscountRequest`, `PricingConfig` plus about 20 repository methods) before any
screen was built.

- **One pricing engine.** `computeQuotationCost(spec, pricing, marginOverridePct?)`
  in `memoryRepository.ts` is the only place a price is produced. It covers drive-type base
  price, per-floor increment above 4 included stops, finish-tier multiplier
  (1 / 1.15 / 1.35), capacity multiplier (+6% per person above 6), civil work
  (10% of equipment), installation (₹12,000 per stop) and flat transport (₹25,000).
  Every line is rounded to the rupee before summing, so the lines always add
  up exactly to the total shown.
- **Versions, not edits.** `Quotation.supersedesQuotationId` forms a chain.
  Only one version per lead can be `sent`/`viewed`, and a new version
  supersedes the previous one. 062, 066 and 067 all read or extend this chain; there
  is no separate history table.
- **The customer screen can't see costs.** `CustomerQuotationView` (returned only by
  `getQuotationForCustomer`) has no cost or margin fields. 064 never calls
  `getQuotation`.
- **Margin floor.** `PricingConfig.minimumMarginFloorPct` (seed: 15%) is enforced in
  `adjustQuotationCost` (062) and in the discount flow (067).

Screens:

- **061 Quotation Generator** (`/admin/quotes`): draft pre-filled from the lead's
  survey spec. Owns shared `driveType.*`, `finishTier.*`, `quotationStatus.*`.
- **062 Cost Breakdown** (`/admin/quotes/:quotationId/cost`): itemised lines,
  live margin edit blocked below the floor, civil-work override with a
  required note.
- **063 Template & Branding** (`/admin/quotes/templates`): version bump on
  every save; reuses `DocumentSlot` for the logo.
- **064 Customer Preview** (`/admin/quotes/:quotationId/preview`): expired /
  accepted / superseded states; opening a `sent` quote records the view.
- **065 Package Comparison** (`/admin/quotes/compare`): Basic/Premium/Luxury
  from one base spec; AMC figures come from `PricingConfig.amcTiers`; flags
  price gaps under 8%.
- **066 Version History** (`/admin/quotes/history`): field diffs computed live
  between consecutive versions. "Restore" copies the old spec and keeps the
  current margin, so an approved discount is not silently undone. Owns
  `quotation.reason.*`.
- **067 Discount Approvals** (`/admin/quotes/discounts`): request form with a
  live margin preview (same formula as the repository), approval queue
  (urgent first, resubmissions flagged), reject with reason and optional
  counter-offer. An **urgent** request whose margin stays at least 3 points above the
  floor (`URGENT_AUTO_APPROVE_BUFFER_PCT`) is approved automatically. Manual and
  automatic approval share `applyApprovedDiscount`, so both create
  the new version the same way.
- **068 Quotation Send & E-Delivery** (`/admin/quotes/:quotationId/send`): channel
  picker (WhatsApp/email), cover message defaulted from a template, optional
  scheduling, and doubles as the delivery-confirmation view once sent. Picks
  the active template by the quote's own building type and finish tier
  instead of a fixed index. A bounced/opted-out WhatsApp number falls back to
  email automatically when one is on file, with the real per-channel outcome
  always shown (never one blended status). A quotation superseded while it
  still has a pending scheduled send has that send cancelled immediately, in
  both places a new version can be created (`createQuotationVersion` and the
  discount-approval path) — a customer can never receive a stale price.
  Reachable from **064**'s new "Send quotation" / "View delivery status" action.
- **069 Quotation Analytics — Win/Loss** (`/admin/quotes/analytics`): win rate by
  package tier, drive type, price band and territory, each row flagged
  `lowSample` below 3 decided quotes. Decision-to-close time is split by
  outcome (won vs lost) rather than one blended average. A residential/
  commercial segment filter (by the lead's `buildingType`) keeps one large
  commercial deal from skewing the blended price-band numbers. Every stat
  card carries the real `quotationIds`/`leadIds` behind it for one-tap
  drill-through to the lead. `getQuotationAnalytics` excludes `superseded`
  quotations from every count — a revised quote is one decision, not two.
- **070 Pricing Rules & Margin Configuration** (`/admin/quotes/pricing`): the
  single governed root — base price and per-floor increment per drive type,
  the margin floor, GST rate, and the three AMC tiers. Lowering the margin
  floor needs an explicit confirmation and the danger-red treatment; zero or
  negative is blocked outright. A per-floor increment outside the real-world
  10-25% range warns without blocking, since the spec calls that a guideline.
  `effectiveGstRatePct` (shared with `computeQuotationCost`) is what actually
  makes a scheduled, future-dated GST change apply itself on the right day —
  previously `scheduledGstChange` was stored but nothing ever read it.
- **Go deeper grid on 061**: links to 063/065/066/067/069/070 (062/064/068
  need a specific quotation id, so they're reached through the normal
  061→062→064→068 flow instead, same as 042 is reached from 041's list).

**Module 7 checkpoint (passed):** clicked through all 10 screens start to
finish in Demo Mode — new draft → cost breakdown → template → customer
preview → package comparison → send (compose, schedule, cancel, bounce/
fallback, supersede-cancels-schedule) → version history → discount approval
→ win/loss analytics → pricing config — no console errors. Spot-checked 021
(Exec KPI), 011 (Live Map) and 043 (Lead Kanban) from earlier modules; all
render exactly as before. Nothing regressed.

## Module 8 — Negotiation & Deal Closing (`071`–`080`, checkpoint-verified)

Everything under the **Deals** tab (`/admin/deals/...`), plus one screen
(`080`) reachable by Admin *and* Surveyor at `/deals/:dealId/celebration` —
the first screen in this build that isn't role-siloed to one tab bar. Where
the brief's "auto-negotiate with customer and make deal automatically"
becomes real: a bounded, monitored bot, a human escalation path, and a clean
contract close. Extended the data model once per screen as each one needed
it, rather than all up front — this module's records chain together tightly
enough (a negotiation becomes a counter-offer becomes deal terms becomes a
contract becomes a signature becomes a closure becomes a celebration) that
front-loading the whole shape would have meant guessing at fields the
earlier screens couldn't yet justify.

- **The bot's floor is always the company's floor plus a buffer, never
  less.** `NegotiationBotConfig.marginBufferPct` sits on top of
  `PricingConfig.minimumMarginFloorPct` (070); a `Negotiation` snapshots its
  own `floorPrice`/`maxRoundsAllowed`/`autoCloseAuthorityAllowed` at creation
  so an in-flight negotiation always finishes under the rules it started
  with, even if Admin changes the bot config mid-conversation.
- **One version chain per deal, not per screen.** `DealTerms` amendments,
  `Contract` regeneration, and `ContractSignature` all follow the same
  "new version supersedes the old, nothing is edited in place" discipline
  Module 7's `Quotation` chain established — `Contract.status` moves
  `active`→`superseded` exactly like a quotation does.
- **The state-machine spine (074→077):** `DealTerms.status`
  (`draft`→`awaiting_customer`→`confirmed`) → `Contract` generated from the
  confirmed terms → `ContractSignature.status`
  (`unsigned`→`customer_signed`→`fully_signed`) → `Deal.status` becomes
  `'approved'` the moment the customer signs and `'won'` (with `closedAt`
  stamped) the moment AIEC countersigns. That AIEC-countersign instant is
  the one and only "Closed Won" moment everything downstream reads.
- **The closure kickoff is one idempotent event, not three.**
  `triggerDealClosure` (077) fires once per deal — CRM stage to `'won'`,
  `Payment` schedule from `DealTerms.paymentStagePlan`, supplier PO attempt,
  commission entry — and returns the existing `DealClosure` on any repeat
  call rather than re-running side effects. `080`'s celebration and its
  commission summary are a read of that same event, never a second
  calculation: the numbers shown there are the exact `CommissionEntry` rows
  the Commission & Rewards Tracker (038) itself reads.
- **Two internal-only content libraries feed both the human and the bot
  from one well.** Objection scripts (078) and competitor battlecards (079)
  are never customer-facing — battlecards structurally so, since nothing in
  the communication engine ever reads `Competitor`. Three of 078's
  categories (`competitor_comparison`, `price_too_high`, `wants_to_delay`)
  reuse `NegotiationObjectionKey`'s own literal values so the bot's
  Objection Scenario Map (071) and the human quick-reference can never
  drift into two different classifications of the same conversation.

Screens:

- **071 Auto-Negotiation Bot Configuration** (`/admin/deals/bot-config`):
  guardrails (margin buffer, max rounds, tone, auto-close authority — off by
  default), the objection-scenario map, and a live dashboard of in-flight
  negotiations.
- **072 Live Negotiation Thread** (`/admin/deals/:negotiationId/thread`):
  the bot's conversation with a customer, reusing the existing
  `Conversation`/`CommMessage` shape rather than a parallel message model.
- **073 Counter-Offer Approval** (`/admin/deals/counter-offers`): the queue
  for asks outside the bot's own authority but still at or above the
  company's true floor — approve, reject, or counter, shared mechanics with
  067's `DiscountRequest`.
- **074 Deal Terms Finalization** (`/admin/deals/:dealId/terms`): locks in
  the payment split (`DealTerms.paymentStagePlan`, reusing the real
  `PaymentStage` enum from Module 2's Finance screen rather than inventing a
  second one) and both-party confirmation before a contract can generate.
- **075 Digital Contract Generator** (`/admin/deals/:dealId/contract`):
  assembles clauses from confirmed deal terms plus the state-specific Lift
  Act layer (reusing 061's `QuotationTemplate.legalBoilerplate`/
  `stateOverrides` mechanism); a state with no clause set configured falls
  back to the national default and flags Admin rather than blocking.
- **076 E-Signature Capture** (`/admin/deals/:dealId/signature`): OTP
  identity re-verification (same demo pattern as login's own OTP screen,
  `123456`) with a manual-confirmation fallback after repeated wrong codes,
  a canvas `SignaturePad` (new design-system component, DPI-aware, flattens
  to a PNG data URL), and the customer-sign → AIEC-countersign sequence that
  produces Closed Won.
- **077 Deal Closure Confirmation** (`/admin/deals/:dealId/closure`): the
  technical kickoff screen — customer-facing payment schedule and point of
  contact, plus an admin-only internal summary (commission, payment
  schedule, supplier PO status) and a void-closure action that logs a
  reversal rather than deleting the record. Links to **080**.
- **078 Customer Objection/Concern Handling Script Screen**
  (`/admin/deals/objection-scripts`): a searchable, versioned library of
  approved responses (safety of a newer brand, installation disruption,
  timeline worries, price, stalling, comparison to bigger players), each
  with effectiveness scored the same before/after "did the lead reach won"
  logic Communication Analytics (060) uses, broken down per territory. A
  sales user can submit a newly-noticed concern as `suggested`, pending
  Admin review, so an emerging pattern is never lost. Swipe-to-copy on each
  row for a rep mid-call.
- **079 Competitor Comparison Battlecard Screen** (`/admin/deals/battlecards`):
  internal-only positioning against named (fictional) competitors — genuine
  strengths stated constructively, AIEC differentiation grounded only in
  real capabilities. Any sales user can flag a card as stale without
  waiting for Admin to notice; links to 078's "comparison to bigger
  players" category for any "why not brand X" conversation.
- **080 Deal Won — Celebration & Next Steps** (`/deals/:dealId/celebration`,
  Admin **and** Surveyor): the internal, emotionally distinct counterpart to
  077's customer-facing confirmation — recognition and an exact commission
  breakdown for the original capturing surveyor (and the current owner too,
  when a lead was reassigned, per 044's own fairness rule that the capture
  bonus stays with the original surveyor regardless). One-tap acknowledgment
  doubles as an optional feedback prompt whose note is admin-only by
  construction, redacted server-side for any non-admin viewer including the
  person who wrote it. `DealCelebration` mirrors `DealClosure`'s own
  read/trigger split so the moment persists for a staff member who was
  offline when the deal actually closed.

**Module 8 checkpoint (passed):** clicked through all 10 screens — bot
config → negotiation thread → counter-offer approval → deal terms → contract
generator → e-signature (OTP, drawn/typed signature, countersign) → closure
confirmation (payment schedule, void/restore) → objection scripts (search,
approve/edit/archive a suggestion, swipe-to-copy) → battlecards (flag,
edit-new-version, add) → celebration (auto-trigger, acknowledge with
feedback, admin-only note redaction for a surveyor viewer) — no console
errors. Also fixed a seed-data inconsistency surfaced along the way: lead
`l-15` (Tech Park Block C, deal `dl-6`) had been left at stage `negotiation`
even though its deal had already been Closed Won for hours — corrected to
`won` so the Lead Kanban board agrees with the deal record. Spot-checked 027
(Automation Health Monitor), 028 (Finance cash-flow) and 043 (Lead Kanban)
from earlier modules — the `dl-6` supplier-PO failure and its new Payment
rows both surfaced correctly with no separate calculation; nothing
regressed.

## Module 9 — Payments & Financing (`081`–`090`, checkpoint-verified)

Everything under **Analytics → Collections/Financing** (`/admin/analytics/...`)
plus the customer-facing payment/financing screens (`/customer/...`,
`/payments/history`, `/deals/:dealId/invoices`). Real `Payment` records and
a real `PaymentStage` enum already existed from Module 2's Finance screen
(028) and 074's `DealTerms.paymentStagePlan` — this module extends that
shape rather than starting from nothing, the same way Module 8 extended
`Deal`. The spine is a schedule (081) that real money moves against, through
a gateway (084) or financing (085), collected and chased (082/083), reaching
a human only when automation alone can't resolve it (089), documented
(087/088), and — when something goes wrong — refunded or disputed (090)
without ever losing the accounting thread.

- **One aging vocabulary for the whole module.** `@/features/payments/aging`
  (`bucketFor`, `isOutstanding`, `remainingBalance`, `computeCashIn`,
  `computeTotalReceivable`, `receivedAmountOf`, `daysOverdue`) is the single
  definition of "overdue" and "collected" every screen in this module reads
  — 028, 082, 088, 089 and 090 can never quietly disagree on what those words
  mean, which the spec is explicit is a data-integrity bug if it ever
  happens.
- **GST-inclusive money, always.** `Payment.amount`/`Deal.agreedPrice` are
  GST-inclusive, matching `QuotationCostBreakdown.finalPrice`; `splitGst`
  (087) derives taxable value + GST backward from the inclusive total —
  never entered independently, and reused by 090's own credit notes via a
  new shared `createCreditNote` helper rather than a second calculation.
- **Deterministic simulation, never randomness.** 084's card-decline-then-
  retry, 085's income-bracket approval amount, 086's stuck-application
  threshold, and 087/088's auto-generation timing are all computed from real
  input state — the same discipline the rest of the build holds to.
- **Idempotent "ensure on read," not events.** This demo has no event system,
  so several screens guarantee an outcome by the next time anyone looks
  rather than firing the instant something happens: 086's stuck-application
  alert, 087's `ensureStageInvoices` (auto-backfills a `'stage'` invoice for
  any paid-but-uninvoiced `Payment`, now also for a stage disputed
  immediately after paying, for 090's own credit notes), and 089's
  escalation eligibility (computed live from `daysOverdue` against the
  cadence config's own furthest step, never a persisted "exhausted" flag).
- **A reminder pause is a genuine "already handled" signal, reused twice.**
  083's `PaymentReminderPause` was built to stop automated nudges on a deal
  someone's already sorting out by hand — 089 reuses the exact same record
  to exclude that deal from its escalation queue entirely, rather than
  re-deriving "is someone already on this" a second way.
- **A bug found and fixed at the source, not worked around.** `receivedAmountOf`
  (and so remaining-balance math everywhere) keyed off a payment's *current*
  status; disputing a `'paid'` stage that never had `amountReceived` set
  explicitly (several seeded ones hadn't) made it read as "nothing collected"
  the moment it was disputed. Fixed in `disputePayment` itself — it now
  backfills `amountReceived` from `amount` when disputing an already-paid
  stage — so every screen's math stays correct, not just 090's.

Screens:

- **081 Payment Stage/Schedule Setup** (`/admin/deals/:dealId/schedule`):
  turns `DealTerms.paymentStagePlan` into real, dated `Payment` records —
  milestone-triggered stages resolve their due date live against the deal's
  actual `Job`/timeline state, never a stored date that could drift.
- **082 Payment Collection Dashboard** (`/admin/analytics/collections`):
  every payment stage across every deal, aging-bucketed, filterable by
  stage/severity/owner — record a manual payment, send a reminder, escalate,
  or dispute a stage (now including an already-`'paid'` one, extended for
  090's own refund scenario) from one detail sheet.
- **083 Automated Payment Reminder Configuration**
  (`/admin/analytics/collections/reminders`): the cadence (gentle → firm →
  call task) Admin tunes once and 082/089 both read live, plus per-deal
  pause/resume with a required reason and a nudge on a long-standing pause.
- **084 Payment Gateway Checkout Screen** (`/customer/payments/:paymentId/checkout`,
  Customer): UPI/card/netbanking against the live remaining balance only,
  never a client-supplied amount; a deterministic first-attempt card decline
  makes the safe-retry path actually exercisable, and netbanking's
  `'processing'` → resolved state stands in for a webhook this demo has no
  server to receive.
- **085 Loan/EMI Application Screen** (`/customer/deals/:dealId/loan-application`,
  Customer): a non-binding eligibility precheck (never hard-blocks a full
  application) followed by the financing partner's real rate table (its own
  deterministic first-call outage, for the same reason as 084's card
  decline), reusing the domain-agnostic `useWizard` hook rather than a
  parallel draft system.
- **086 Loan Partner Integration & Status Screen**
  (`/admin/analytics/financing`, Admin): every application across every
  customer, auto-escalating (idempotently) any stuck in `'under_review'` too
  long, and settling real `Payment` rows the moment a loan disburses.
- **087 Invoice Generator (Auto)** (`/deals/:dealId/invoices`, Admin +
  Customer): GST-compliant, immutable documents — a `'stage'` invoice
  auto-backfills as each payment clears, a `'final'` invoice only once every
  stage has, and correction is always a `'reissue'` or `'credit_note'`
  referencing the original, never an edit to it.
- **088 Payment Receipt & History Screen** (`/payments/history`, Admin +
  Customer): a customer's full payment history aggregated across every deal
  they own (never assumed to be exactly one), with a working `window.print()`
  receipt/statement and a real, self-contained CSV export.
- **089 Overdue Payment Escalation Screen**
  (`/admin/analytics/collections/escalation`, Admin): the deliberately narrow
  queue of stages that exhausted the automated cadence without paying — a
  tier badge (Gentle Call Needed / Formal Notice / Consider Installation
  Hold) that weighs relationship history but never gates which of the three
  one-tap actions Admin may take, and a Flag-to-Pause-Installation action
  that requires explicit acknowledgment, elevated when a technician is
  genuinely mid-safety-critical-step on site.
- **090 Refund & Dispute Management Screen**
  (`/admin/analytics/collections/disputes`, Admin): every dispute, open and
  resolved, from the exact same `Payment.status === 'disputed'` 082 shows —
  Approve Full/Partial Refund generates a real credit note, Reject restores
  the stage's pre-dispute status with full reasoning preserved; a financing-
  partner routing warning and a downstream-allocation warning (supplier PO
  and/or commission already paid out, read from `DealClosure`) surface
  prominently before Admin finalizes either refund action.

**Module 9 checkpoint (passed):** clicked through all 10 screens — schedule
setup → collections dashboard → reminder config → gateway checkout (card
decline/retry, netbanking pending/resolved) → loan application (precheck,
partner-outage retry, disbursement) → loan partner status (stuck-application
auto-escalation) → invoice generator (stage/final/reissue/credit-note) →
receipt history (print, CSV export) → overdue escalation (tier badges,
good-standing/safety warnings, all three actions, installation hold with
elevated acknowledgment) → refund & dispute management (full refund on a
financing-method payment with its routing warning, partial refund with a
real credit note, rejection with full reasoning) — no console errors, and
082/028 agree on the same Collected total and Disputed count exactly as the
spec requires. Spot-checked 028 (Finance cash-flow), 042 (Lead Detail
timeline), 051 (Comm Templates) and 077 (Deal Closure Confirmation) from
earlier modules — nothing regressed. Two small, necessary fixes surfaced
along the way and are covered above: the `receivedAmountOf`/`amountReceived`
gap disputing a paid stage could hit, and extending 082's own dispute button
to reach an already-paid stage (090's core refund scenario was otherwise
unreachable from the app's own UI, only from seed data).

---

## Manager layer — commitments, the follow-up engine and every role's assistant

Not a numbered screen: a shell-level layer built after Module 9, when the
owner asked for the app to "act as manager and assistant for follow-up
completion of work". An audit of the 92 screens found the gap wasn't a
missing screen. It was three structural ones:

1. **Promises with no owner or deadline.** Terms awaiting the customer,
   pending discount/counter-offer decisions and unacknowledged alerts had no
   due date. The PO chain dead-ended at "sent", and nobody owned "did the
   supplier accept?" or "did the parts arrive?".
2. **Owners with no inbox.** The reminder engine assigned call tasks to
   surveyors, but no surveyor-facing screen showed them. Technician,
   customer and supplier homes are placeholders. Toasts vanish after 4s.
3. **Automation with no clock.** Payment reminders ran only when Admin
   clicked 083's "Run now". Scheduled quote sends (068) were stored and never
   sent. Nothing ran unless someone opened a screen.

What was built, bottom up:

- **Foundation (phase A).**
  - `raiseAlert` is the one deduplicated path to Admin's attention; its
    `sourceRoute` links back to the owning screen.
  - `@/features/sla/clock` is the one definition of hours/days, breach and
    severity.
  - `logAutomatedAction` gives an audit row for anything done without a
    human.
  - 007 supplier onboarding now persists a real pending supplier plus their
    own phone login; approving KYC in 091 activates it.
- **Commitments (phase B).** `src/features/work/commitmentRules.ts` is the
  rulebook as data: 15 kinds, each deriving `{owner, due, done?}` from records
  that already exist. They cover payment due (customer) and collect
  (surveyor); job assign and start; PO send, acknowledge, delivery date and
  delivery; expiring quote; terms awaiting the customer; discount and
  counter-offer decisions; unacknowledged alerts; follow-up tasks; and
  lost-lead revisits.
  - **Chains fall out of the data.** Sending a PO closes `po_send` and opens
    `po_acknowledge` and `po_delivery_date` from the same row, so a chain
    can't drift from the records.
  - **New dated obligations add a rule here** rather than a queue of their
    own; `CLAUDE.md` makes that a house rule.
- **The engine (phase C).** `runFollowUpEngine` does three things each pass:
  - It runs the automations that used to wait for a click: payment
    reminders, scheduled quote sends and invoice backfill.
  - It re-derives every commitment. A new owner or new due date restarts the
    ladder, because it's a new promise.
  - It walks each open commitment up the ladder, one rung per condition:
    1. Nudge the owner before due.
    2. Tell the owner at due.
    3. After the rule's `escalateAfter`, escalate to `User.reportsTo`, or to
       Admin's `backupUserId` if Admin is the owner.
    4. After twice that, raise an Alert, only where the rule says so and the
       owner isn't Admin.

  Levels only move forward. A second pass right after the first sends 0
  notifications and takes 0 actions, which was verified live across two
  heartbeats. Paused items (a disputed payment, a deal with reminders paused
  in 083, a job waiting on materials) are held, not chased.
- **The assistant (phase D).** A bell in the shell (top bar on a phone,
  sidebar on desktop) with an unread count, for **every** role. It opens
  `AssistantDrawer`:
  - **Needs you:** the owner's own open commitments due within 7 days, most
    overdue first, each one tap from the screen where it gets done. Where the
    proof of done is just the owner's say-so, it offers a one-tap action:
    mark a follow-up done, acknowledge a PO, confirm delivery.
  - **Escalated to you:** other people's late work that reached this person.
  - **Updates** from the engine.
  - **Done for you** (Admin only): reminders sent, invoices issued and quotes
    sent without anyone clicking.
  - **On-time record:** the share of finished commitments done by their due
    time, the reusable signal 024, 097 and payouts can read later.

Bugs found and fixed along the way:
- **Call tasks were being cancelled.** 083's auto-created "call about the
  overdue payment" task was cancelled by `reconcileFollowUpTasks` the next
  time 047 loaded, because a payment's lead is always already won.
  `FollowUpTask.purpose: 'collection'` now survives the lead closing.
- **Reminders could be lost for good.** They fired only on the exact
  calendar day of a step, so one day with nobody in the app lost that
  reminder permanently. They now catch up: the latest arrived step fires
  once, and older steps it overtook are marked as superseded. Catch-up is
  capped at 7 days, past which 089 owns the payment.
- **019's resolutions didn't stick.** A resolved alert was reverted to
  "acknowledged" by the screen's own 15s poll. `resolveAlert` now persists
  the resolution.

**Business decisions this layer surfaces but can't make:**
- **Who backs up the owner.** `backupUserId` is deliberately unset, so the
  Admin drawer says plainly that late items escalate no further than them.
- **Who owns delivery receipt.** Admin confirms it until Module 11's delivery
  screens (101–104) take it over.
- **Where scheduling runs.** Server-side scheduling is the one piece the demo
  can't do (see Honest limits).


---

## Module 10 — Supplier & Manufacturer Management (`091`–`100`, checkpoint-verified)

Admin reaches all of it from the new **Suppliers** tab (`/admin/suppliers`). The directory's
"Supplier tools" row links every other screen. Suppliers get their own nav: Orders, Messages,
Catalog, Scorecard, Agreement. The spine is one chain of records, each read by the next rather
than copied:

- the catalog (093) prices a PO;
- the rules (094) choose its supplier;
- the agreement (098) and payment terms (100) are frozen onto it at send;
- its fulfilment (095/096) and delivery produce a rating (097) and a retention;
- the conversation about it (099) stays attached to it throughout.

- **One true status per PO.** `movePoLinesSync` is the only way a line changes stage — supplier
  update, Admin update, assistant quick action, or production sign-off. It keeps
  `acknowledgedAt`/`receivedAt` in step, opens manufacturer production records, and on first full
  delivery creates the order rating and holds the retention.
- **One scoring engine.** `computeSupplierPerformanceScore` is the only supplier score. 097 feeds
  it real per-order ratings (on-time against the promised date; quality from supplier-attributed
  defects and Admin's judgement). 026, 091, 094's matching and 100's graduation all read the same
  number.
- **Paperwork is the threshold.** 098's agreement isn't a document beside the system:
  - its delivery SLA sets each new PO's promised date, which 095's delay flag, 097's on-time rating
    and the `po_delivery` commitment all read (`promisedDeliveryOf`);
  - its net days set when AIEC owes payment (`supplierPaymentDueDate`);
  - a lapsed agreement blocks sending and drops the supplier from matching, while orders already
    in flight finish under their snapshot.
- **Frozen at send.** A PO carries `agreementTerms` and `paymentTerms` snapshots. Amendments,
  renewals, tier changes and overrides apply to new orders only, and every screen says so where
  it matters.
- **The manager layer extended, not bypassed.** Each new dated obligation is a rule in
  `commitmentRules.ts`:
  - catalog price review;
  - PO status update (against each supplier's own typical pace);
  - rating dispute review;
  - agreement renewal (45 days ahead) and acknowledgement;
  - thread reply (24h window, then escalation, then an Alert);
  - retention decision.

  The heartbeat also detects production stalls (Alert) and settles retentions (release at
  handover, pause on a supplier defect). Both are idempotent and logged as automated actions.

Screens:

- **091 Supplier Directory** (`/admin/suppliers`): KYC, status, manufacturer flag, merge, and the
  hub into every other supplier screen.
- **092 Purchase Order Generator** (`/admin/deals/:dealId/purchase-orders`): drafts from the
  catalog and 094's rules. Shows why each supplier was chosen, the approval reasons, and the send
  block when no agreement is in force.
- **093 Supplier Catalog** (`/catalog`, Admin and Supplier): the single cost source. Large price
  changes wait for review.
- **094 Auto-PO Rules** (`/admin/suppliers/po-rules`): trigger, matching strategy and weights,
  approval threshold, with a simulation.
- **095 Supplier Orders** (`/orders`, Admin and Supplier): per-line fulfilment board, delay flags
  against each supplier's own pace, history.
- **096 Production Status** (`/orders/production/:recordId`): a manufacturer's stages inside "in
  production". Evidence to sign off quality testing; batches; stalls.
- **097 Supplier Scorecard** (`/scorecard`): score breakdown, trend, orders, disputes with preview
  and reattribution, context notes. Shows the agreed standard and flags quality below it.
- **098 Supplier Agreement & SLA** (`/agreement`): versioned terms (initial, amendment,
  renewal) with the signed document, mandatory warranty pass-through, supplier acknowledgement, an
  urgency board, and the orders each version governs.
- **099 Supplier Messages** (`/supplier-messages`):
  - per-PO and general threads, apart from customer channels;
  - read receipts, and a flag when a reply is overdue;
  - logged calls and emails (the only channel for suppliers without a portal login);
  - search, and "add to supplier record" into 097.
- **100 Supplier Payment Terms** (`/admin/suppliers/payment-terms`):
  - trust tiers and per-supplier overrides;
  - graduation backed by the scorecard;
  - risk-increasing changes need confirmation;
  - retention released automatically at handover, or decided by Admin with a reason.

**Honest limits.** Jobs aren't tied to specific POs yet, so a retention's release signal is the
deal's first handover after delivery. Module 11's material logistics should sharpen this, and
should replace Admin's interim receipt confirmation. Documents are held by name only (no file
storage). In-app messages reach only suppliers with a portal login; the rest are logged.

**Module 10 checkpoint (passed):**

- Clicked through all 10 screens as Admin and as a supplier (Vertex, 9822055001), at 390, 820 and
  1440px: no console errors and no horizontal overflow.
- Exercised the edge paths each screen's spec names:
  - a lapsed agreement blocking a send, while its in-flight order kept its terms;
  - an SLA-derived promise date;
  - a dispute upheld with reattribution changing the score;
  - an unanswered supplier flagged and chased;
  - a supplier defect pausing a retention, and a withhold with a reason;
  - a tier graduation recorded with the score at that moment.
- Spot-checked 029 (Alerts), 047 (Follow-ups) and 082 (Collections) from earlier modules: nothing
  regressed.

Fixes made at the checkpoint:

- **Admin's Suppliers tab.** Module 10 had no nav entry for Admin. It now does, and routes can
  declare their tab per role (`tab: { admin: 'suppliers', supplier: 'orders' }`).
- **Nav highlighting (app-wide).** The shell used `NavLink`, whose own prefix matching lit Admin's
  Home on every `/admin/...` page and ignored each route's declared tab, so deep screens like
  `/admin/analytics/collections` never lit Analytics. The shell now decides alone: the declared tab
  first, else an exact or sub-path match (never for Home).

## Module 11 — Material Logistics & Delivery (`101`–`110`, checkpoint-verified)

The physical bridge between a sent Purchase Order and a technician who can start installing. Every
screen reads the one true PO status (`movePoLinesSync`, 095) and the one delivery model; none keeps a
parallel status of its own.

| # | Screen | What it owns |
|---|---|---|
| 101 | Delivery Scheduling | Booked day and window per PO, site readiness, supplier dispatch availability, dependency order |
| 102 | Shipment Tracking | `ShipmentLeg` per vehicle, deterministic live position, milestones, feed loss, manual updates |
| 103 | Site Delivery Checklist | Part-by-part receipt with photos; the only path to `delivered`; the discrepancy report is raised here |
| 104 | Delivery Confirmation | The signed, locked summary; offline signature queue; fires "due on material delivery" |
| 105 | Delivery Delay Alert | `judgeDelay` (computed on read), `DeliveryDelayCase`, root cause, one-tap supplier/customer/escalate |
| 106 | Stock in Transit | Parts en route by site (never a warehouse), capacity by week, orphaned orders for cancelled deals |
| 107 | Delivery SOP Checklist | Central, versioned, pinned-per-checklist procedure steps per part category |
| 108 | Damaged/Missing Parts Report | What happened, Admin's judgement, supplier told with photos, replacement or credit, impact on the install |
| 109 | Delivery Partner Management | Third-party carriers, rate cards, live-tracking integration, performance against their own estimate |
| 110 | Delivery Analytics | On-time, transit by region, damage trend, cost of issues: all read off the above |

**Shared vocabulary worth knowing before building on this module**

- One late delivery is judged once. `judgeDelay` (105) says whether it is late; `latenessOf`
  (`@/features/logistics/partnerPerformance`, 109) says whose fault: arrival − promise = (carrier's
  `etaAt` − promise, the supplier's late hand-over) + (arrival − `etaAt`, the carrier's slow transit),
  additive and exact. External events (a 105 tag or an annotated 110 disruption) are nobody's fault.
- A carrier is held to its **own** estimate at dispatch; a supplier to the date on the order. New
  carriers and thin regions read "not rated yet" / "emerging", never a false figure
  (`MIN_RATED_TRIPS` and `MIN_SAMPLE` are both 5).
- `heldLineIds` (`@/features/logistics/discrepancy`) names parts still in question. Module 12's
  supplier payment approval should hold payment for those lines. Retention already honours it: an open
  report on an order keeps that order's retention held.
- 110's cost is per incident, once: parts (only when the fault was not the supplier's), the return
  visit, and priced installation delay. Retention held over the same fault is shown beside, never
  added. Two rates are assumptions, stated on screen: `REVISIT_COST` and `SCHEDULE_DELAY_COST_PER_DAY`
  in `deliveryAnalytics.ts`. **These are business decisions Admin should set.**
- 110 closes the loop into sales: 077's next steps now say how long parts really take to reach the
  site's city (`getTransitEstimate`), or that it is too early to promise.

**Honest limits.** GPS and carrier tracking are simulated (a function of the clock and the leg's own
times); a real integration would replace `legSnapshotOf` and `syncPartnerFeeds`. Photos are kept as
data URLs for the session (no storage bucket). Delivery cost inputs for old incidents are snapshots
seeded by hand. Customer messages go through the Communication Engine templates, in the customer's
language, and skip anyone who has opted out.

**Module 11 checkpoint (passed):**

- Clicked through all 10 screens as Admin at 390px, and each of 101–110 again at 820 and 1440px:
  no console errors beyond blocked map tiles, no horizontal overflow.
- Exercised the paths each spec names: an offline signature queued and locked at its capture time; a
  supplier-attributed defect feeding 097's score while a transport one does not; a rush report raising
  the alert and chasing the supplier again; a carrier's feed outage dropping in-flight legs to
  milestones together and back; a booking refused for a site a carrier does not serve; a thin region
  shown as emerging; an annotated disruption set aside from the trend.
- Spot-checked 028 (the "In transit to sites" tile), 091, 095, 097, 099 and 077 from earlier modules.

Fixes made at the checkpoint:

- **Admin's Logistics tab.** 101 and 102 were reachable for Admin only from 091's hub and 095's header.
  Admin now has a "Logistics" nav tab and every delivery screen declares it.
- **Retention over an open fault.** `settleRetentions` no longer releases a retention while a
  damaged-parts report is open on that order.
- **Photo evidence.** `DocumentSlot` previews are data URLs, so a delivery photo still shows on the
  report after the capture screen is gone.

## Module 12 — Supplier Payment Processing (`111`–`120`, checkpoint-verified)

Cash goes to a supplier only when the terms say it should, and only after a person has looked at anything
that is not routine. A payment exists only once its configured milestone (100) has really fired; every screen
reads the one `SupplierPayment` (111) and the same block/hold flags. Nothing about a match, a schedule, a GST
split, an exposure or a metric is stored: each is derived on read from the records below it.

| # | Screen | What it owns |
|---|---|---|
| 111 | Supplier Payment Approval | `SupplierPayment`, the approval gate, hold flags, a 10-minute reversal window, routine batches |
| 112 | Milestone Payment Release | The payment chain of an order, one-off split deviations, early release with a reason |
| 113 | Supplier Invoice Matching | Invoice lines matched on read against the PO and what was accepted on site; the balance gate |
| 114 | Supplier Payment Schedule | Upcoming outflow by date, heavy weeks, slippage; the one figure Finance reads |
| 115 | Supplier Payment History | The ledger a supplier and Admin both see, adjustments beside a payment, queries, CSV |
| 116 | Tax & GST Compliance | GST split by supply type, supplier standing, credit at risk, hand-over to the accountant |
| 117 | Supplier Dispute Resolution | Disputes decided with a real correction (adjustment, amount, retention, invoice), process flags |
| 118 | Advance Payment & Retention | Money out early and money held back, read from the order and the installation job; recovery |
| 119 | Supplier Payment Analytics | Spend, days to pay, retention over time, dispute rate; flags a supplier whose disputes stand out |
| 120 | Auto-Reconciliation | The bank statement against the app's money in and out; serious mismatches; run log |

**Shared vocabulary worth knowing before building on this module**

- **A payment is blocked, held or informational, never silently fine.** `paymentFlags` (111) is the one place:
  `invoice_unmatched` and `supplier_blocked` cannot be approved; `open_report`, `supplier_dispute` and `orphaned`
  need an explicit acknowledgement; `rating_dispute`, `high_value` and `early_release` are shown. Anything
  flagged, or above ₹1,00,000, is never "routine" and is refused in a batch. Later screens that create a supplier
  payment must go through these flags.
- **Retention release is manual by default** (118). The heartbeat only releases by itself when Admin turns it on,
  and never over an open damaged-parts report (108) or dispute (117). This changes what 100 did; its copy says so.
- **`@/features/suppliers/paymentAnalytics` and `@/features/finance/reconciliation` are the only definitions** of
  "days to pay", "a month that stands out", "a supplier whose disputes stand out", "matched", "serious" and "small
  expected difference". Target for paying is 111's own two days, not a second constant.
- **A run with no bank data is "could not run", never a clean pass** (120). A payment made or recorded twice is a
  critical alert and cannot be explained away as a fee. Small expected differences are listed and reconciled by hand
  with a reason, and raise no alert.
- Every dated obligation added here is a `commitmentRules.ts` rule: `supplier_payment_approve`,
  `supplier_payment_hold_review`, `supplier_invoice_submit`, `supplier_invoice_mismatch_review`,
  `gst_period_handover`, `gst_status_check`, `supplier_dispute_resolve`, `supplier_dispute_process_review`,
  `advance_recovery_followup`, `retention_release_ready`, `reconciliation_exception_review`,
  `reconciliation_feed_restore`.

**Placeholder business decisions Admin should set** (all stated on screen where they apply): the ₹1,00,000 routine
limit and 10-minute reversal window (111); the heavy-week rule of 2× an average week and at least ₹2,00,000 (114);
a 30-day GST recheck and the 7th-day hand-over (116); dispute targets of 7 days, or 3 when the supplier threatens to
stop (117); a 14-day advance recovery threshold and retention auto-release off (118); a spike at 1.8× a typical
month and at least ₹1,00,000, and 3 payments before a supplier's average stops being an "early look" (119); a
₹1,000 small-difference ceiling and 2-day pending grace (120).

**Honest limits.** There is no payment rail: `executeSupplierPayments` stands in for the transfer and mints an
`AIEC-TRF-` reference. The bank statement in 120 is a seeded sample and its connection is a demo switch; a real
bank-feed connector would replace `bankTransactions` and report its own status. GST portal look-ups (116) are
recorded by Admin, not fetched. Adjustments (115) and recovered advances (118) are not separate bank lines in 120:
only the payments themselves are compared. Spend in 119 starts from the seeded history, so a month with nothing
before it reads "Nothing earlier to compare" rather than a percentage.

**Module 12 checkpoint (passed):**

- Clicked through all 10 screens (111–120) as Admin at 390 and 1440px (and 820 while building each): no
  horizontal overflow, no untranslated keys, no console errors beyond a blocked external font. 113 and 115 opened
  as a supplier (Vertex, real phone login); the Admin-only screens correctly show the supplier home instead.
- Exercised the paths each spec names: an invoice mismatch blocking a balance; an early release needing
  acknowledgement; a GST-suspended supplier's credit at risk; a dispute decided into a real payment adjustment; an
  advance recovered in part beside its payment; a batch release skipping what a person should judge; a spike month
  explained by one order and by Admin's note; a first slow payment set aside as an early look; a supplier's repeat
  disputes raising one alert; a bank-feed outage reported as "could not run", with the open list marked unchecked;
  a double debit refusing to be reconciled as a fee.
- Spot-checked 028 (Finance), 082 (collections), 091, 097, 100 (retention wording) and 110 from earlier modules.

Fixes made at the checkpoint:

- **Admin's "Supplier pay" tab.** 111–119 were reachable only from 091's hub. Admin now has a nav tab and each
  declares it (113 and 115 keep the supplier's own tabs).
- **Auto-release over an open dispute.** With 118's setting on, `settleRetentions` released a retention that had an
  open supplier dispute. It now waits for the dispute as it does for a report.
- **A mistranslated alert.** 118's advance-exposure alert used a title key that no translation carried.
- **A blind spot in the totals.** 120's "matched" figure read 0 while the bank was down; it now shows the last real
  comparison, beside a hero that says nothing was compared.

## Module 13 — Installation & Technician (`121`–`130`, checkpoint-verified)

The person on site is the most important role in the product, so this module is built phone-first and
offline-tolerant: whatever a technician does in a basement with no signal is kept on the phone with the time it
was really done, shown at once, and sent when there is signal, and it never blocks physical progress. The job
(`Job` and its `steps`) stays the one working record every other screen reads; each screen adds a view or a
small record beside it rather than a second copy.

| # | Screen | What it owns |
|---|---|---|
| 121 | Technician Home | Today / upcoming / done, schedule clashes, quality score, pending payout, field SOS |
| 122 | Job Detail & Site Info | The accepted configuration (and a banner when it changes), materials actually on site, dated notes, repeat customer, team |
| 123 | Installation SOP Checklist | The versioned procedure, order-flexible steps with dependencies, evidence gates, materials via the signed delivery |
| 124 | Photo/Video Evidence Capture | Camera and file capture, a quality check, offline queue, videos held in memory only |
| 125 | Site Check-in / Check-out | Location-verified arrival, accuracy-aware confidence, leave reasons, forgotten check-outs |
| 126 | Safety & Compliance Checklist | Load and safety-gear style checks with fail–fix–retest, holds, disagreements, Admin override with a named engineer |
| 127 | Issue / Blocker Reporting | Minor / blocking / safety, pauses the job, patterns that point at the procedure itself |
| 128 | Material Usage Logging | The as-installed record against the bill of materials, serial/batch numbers, leftovers, supplier pattern |
| 129 | Installation Progress Timeline | Seven-milestone rail for customer, technician and Admin; an expected date that moves with real pace |
| 130 | Team Coordination | Roles, chat, handoff notes, the lead's sign-off and temporary delegation, disagreements up to Admin |

**Shared vocabulary worth knowing before building on this module**

- **Offline is a first-class state.** Each screen keeps a small per-user localStorage record (`aiec.sopQueue`,
  `aiec.siteQueue`, `aiec.safetyQueue`, `aiec.issueQueue`, `aiec.materialDraft`, `aiec.teamOutbox`) and a pure overlay
  (`applyQueue`-style) that shows what has not synced yet. Every item carries `capturedAt`; the repository refuses a
  time in the future or before the job was booked, and a refusal is reported, never lost. Photos are scaled to 1280px
  before queueing; videos are held in memory only in this build.
- **The lead has one definition.** `roleOf` / `leadIdsOf` (`@/features/technician/jobs`) decide who may act as lead, and
  honour a temporary `JobLeadDelegation` everywhere at once. An assistant only ever acts on their own `crew.stepIds`.
- **Derived on read, never stored:** the timeline and its expected date (129), what the customer may see, who is on
  site, the as-installed parts (128's `getAsInstalledParts`), the safety-check state, the pattern flags. What is stored is
  what a person said or did, append-only where it matters (site visits, safety attempts, issue events, team log, reopenings).
- **The configuration is the accepted quotation** (`lockedSpecOf`), the parts on site are the signed delivery
  records, and the procedure step a job pins is `Job.sopVersion`. New work reads those, never the survey or a flag.
- **Admin hears through Alerts and commitments.** Field SOS, a safety concern, a blocking issue, a repeated SOP gap, a
  supplier whose parts keep being replaced, and a team that cannot agree all call `raiseAlert`; the dated obligations
  (`material_log_confirm`, `handoff_acknowledge`, `lead_signoff`, `job_issue_resolve`, `safety_review`, …) are rows in
  `commitmentRules.ts`.
- **Multi-person jobs go to quality check by the lead's word** (`Job.leadSignOff`), after the safety checklist and
  Admin's evidence exceptions have cleared. A one-person job still moves on its last step.

**Placeholder business decisions to confirm (flagged in code and on screen where they show)**

- 125: `MIN_TYPICAL_JOBS` 2 (typical time on site), `STALE_AFTER` 14 h (a forgotten check-in), the radius constants copied
  across 017 / 032 / 035 / `presence.ts`.
- 126: `MAX_FAILS` 3 before a check needs Admin; the example Maharashtra state item; clause-level references to
  IS 14665 and the National Building Code are left to AIEC's qualified engineer (the app cites them only generically).
- 127: pattern thresholds (3 reports on 2 jobs in 90 days), resolve targets (24 h blocking, 4 h safety).
- 128: supplier pattern (3 supplier-fault deviations on 2 jobs in 90 days); a 48-hour window to confirm a materials log.
- 129: `DEFAULT_PLANNED_DAYS` 12 until two finished jobs exist; a day or more later than first planned counts as a slip.
- 130: authority can be handed over for at most 30 days; a handoff note is acknowledged within 12 hours.

**Honest limits.** Location, camera and video are real browser APIs but nothing is uploaded (photos are data URLs
for the session, videos memory-only). Several jobs on one deal share the deal's order lines, so a 128 material log
is per job against the deal's bill of materials until jobs are tied to specific purchase orders. Surveyor home (031) does
not yet carry the SOS button (`SosButton` can drop straight in). There is no Admin editor for the installation SOP
(107's counterpart) yet. 014 shows only a technician's first non-completed job. The Admin material board (128) and
the field-issue board (127) have no nav entry yet; they are reached from the job screens, alerts and commitments.

**Module 13 checkpoint (passed):**

- Clicked through all ten screens as the lead technician at 390px (in Marathi, the seeded preference), and again at 1440px;
  as the assistant technician; as Admin (014, 127, 128, 129, 130 plus 021, 043, 091, 099, 111 from earlier modules); and as
  the customer (129, 102, 104): no page or console errors, no raw translation keys, no horizontal overflow.
- Exercised the paths each spec names: an offline confirmation and an offline chat message sent later with their own time;
  a delegation giving a crew member lead authority for material logging and step assignment; an assistant finishing the
  last step leaving the job waiting for the lead (and the lead commitment appearing); a blocking report moving the
  customer's expected date at once with a plain cause and no report text; a customer of another deal refused; Admin hiding the
  customer timeline with a reason; a team disagreement filed as a real report and alert.

Fixes made at the checkpoint:

- **123's header** overflowed at 390px once three more job links were added; the row now wraps and gains a Team link.
- **Job links.** 122's action grid, 123's header and 014 now reach materials, timeline and team for a job.

## Module 14 — Quality Check & Handover (`131`–`140`, checkpoint-verified)

The last stretch of a project, from "the crew says it is finished" to "the customer holds one permanent record of it".
Everything here follows one idea: an independent person checks the work, nothing moves on while a problem is open, and the
customer is only ever handed something that is true. As with the rest of the build, the job stays the one working record and
each screen adds a record beside it; what a screen shows is derived on read wherever it can be.

| # | Screen | What it owns |
|---|---|---|
| 131 | QC Inspector Assignment | QC as a *separate role* (a technician with the QC skills who took no part in the job), scheduling against the customer's preference, independence watched on every heartbeat |
| 132 | Mechanical Quality Check | Five measured items read against placeholder reference values, append-only attempts, exceptions for Admin, findings where the lift differs from the install record |
| 133 | Electrical & Safety Checklist | Electrical and safety checks with fail → fix → retest, intermittent faults treated as failures, trial runs |
| 134 | Compliance Certification | AIEC's own internal certificate, by drive type's standard (IS 14665 / IS 15259), frozen evidence package, state-specific next steps |
| 135 | Defect / Snag List | One list for every finding, severity, disputes, waivers with a reason, QC alone closes |
| 136 | Rework Assignment | Who fixes a snag, parts needed (ordered through the supplier flow), rounds, hand back, escalation |
| 137 | Final Handover Checklist | The documentation package and the final gate; nothing goes to the customer while a snag is open |
| 138 | Customer Handover Walkthrough | A wizard: arrange, demonstrate, hand over documents, the customer's own sign-off, AMC choice, feedback, questions |
| 139 | Warranty & AMC Registration | Three distinct layers (maker's parts warranty per installed part, AIEC's service warranty, optional AMC), terms frozen at registration, reminders that send themselves |
| 140 | Handover Completion Certificate | The closing record: a frozen nine-stage summary the customer keeps for good, the job set to completed, every final payout triggered fairly |

**Shared vocabulary worth knowing before building on this module**

- **QC is independent by construction.** Eligibility and involvement are pure rules (`@/features/qc/inspectors`) read by the
  screens and the repository alike. A job only reaches QC after installation, safety checks and the lead's sign-off, and only
  leaves it when mechanical and electrical are signed off with no open finding or snag.
- **Nothing passes quietly.** A failed check creates a `ReworkRequest` (the snag record, 135) and an alert; a later pass closes
  it. A softer verdict than the reference needs an override reason, an exception waits for Admin, a waiver needs words.
  Reference values are AIEC's own placeholders and are flagged on screen: a qualified engineer must confirm them, and
  clause-level figures from IS 14665 / NBC are deliberately never invented.
- **The compliance certificate is AIEC's internal readiness view**, not the government's licence to operate; it says so every
  time it is shown or downloaded. A paperwork correction is a new version that voids the old, never an edit.
- **Handover is gated twice**: the final checklist (137) and the customer's own sign-off (138) are separate from, and after,
  every technical gate. A video call or a site representative is supported; the customer still signs for themselves.
- **Warranty terms are read, never typed** (139): per part from the supplier agreement the part was bought under, so a
  substituted or locally bought part is flagged and says "as stated on the purchase receipt". They are frozen at registration.
- **The certificate is the closing event** (140): issuing it sets the job `completed` (100's retention release already reads
  that), freezes the summary, and triggers the payouts in one step. Its summary is permanent and downloadable, and the
  customer can always open it from their Installation tab.
- **Final payouts follow recorded work** (`@/features/commission/finalPayout`): the original surveyor's conversion commission
  already recorded by 077 is released, never duplicated; the closer of a reassigned lead is paid separately; installers share a
  pool by on-site minutes with a bonus for the lead; the independent inspector has a flat fee. Someone who left midway keeps what
  they did. A defect found later is **Admin's documented judgement** (no change / hold / release / adjust, each with the issue and
  a reason), never an automatic clawback and never ignored; an amount already paid is never touched from there.
- **Admin hears through commitments**: `qc_assign`, `qc_schedule`, `qc_visit`, `qc_certificate_issue`, `snag_*`, `handover_confirm`,
  `handover_admin_review`, `walkthrough_*`, `warranty_register`, `amc_renewal_review`, `handover_certificate_issue` are rows in
  `commitmentRules.ts`. Automations (warranty and AMC reminders) go through the Communication Engine and `logAutomatedAction`.

**Placeholder business decisions to confirm (flagged in code and on screen where they show)**

- 132/133: every reference threshold; 134: the example state guidance wording (not legal advice).
- 135/136: severity → due times; 137/138: sign-off windows (24 h in person, 3 days remote), arrange within 48 h.
- 139: `SERVICE_WARRANTY_MONTHS` 12, visits each AMC tier includes (2 / 4 / 12), reminder cadence (60/30 days before warranty end,
  60/30/7 before an AMC term ends, 90/180 days after "later", 180 after "declined"). AMC prices are not set here: they are the Pricing Rules'.
- 140: `INSTALL_POOL_PCT` 1%, `LEAD_BONUS_SHARE` 25%, `MIN_CREW_SHARE` 5%, `QC_FEE` ₹1,500, `SALES_CLOSE_PCT` 0.5%, 48 h to issue.

**Honest limits.** Payout entries are marked approved, not paid: actually paying them is payroll, which this build does not have.
Historic completed jobs from before this module have no certificate (they are not listed as "not ready"). The customer's
ongoing-service portal is Module 18: `/customer` is still a pending screen, so "tracking my installation" becomes "my certificate" only
through the Installation tab and a link on 129 for a finished job. Quotation and contract have no customer-facing screen yet, so the
certificate summarises them. A rework part joins the deal's order lines once its purchase order is sent.

**Module 14 checkpoint (passed):**

- Clicked through all ten screens as Admin, the independent inspector, the lead technician and the customer (Marathi) at 390px,
  with a job brought through QC, certificate, snags, documents, handover, walkthrough, warranty and certificate; 820 and 1440px
  checked on the screens built last. No page or console errors, no raw keys, no horizontal overflow.
- Earlier screens spot-checked after the changes that touched shared code (commitments, commission reasons, 129 and 138 links):
  Admin home (028), deal closure (077), delivery scheduling (101), supplier payments (111), reconciliation (120), job team (130),
  installation timeline (129), delivery confirmation (104), technician home (121) and job detail (122).
- Exercised the paths each spec names: a customer who never signs off (closed only once overdue, with a documented reason);
  a reassigned lead's closer paid separately while the original keeps the capture commission; an installer who left midway still
  paid for their time; hold / adjust / release on a payout and refusal to touch a paid one; a certificate opened years later
  from the customer's portal and downloaded as a standalone file.

Recheck of 129–132 (after the checkpoint): re-run as Admin, the lead, the inspector and the customer at 390, 820 and 1440px, with
no errors, raw keys or overflow. One real fix: on a job with no assistants, steps finished before names were recorded showed "steps
completed: 0" for the lead on 129/130 (and would have counted nothing in 140's payout); they are now credited to the lead.

## Module 15 — Worker & Partner Recruitment (`141`–`150`, checkpoint-verified)

How a person becomes a partner, how the network is kept honest once they are, and how they leave: from a public front door to
a signed agreement, a tier that changes what they earn or may do, one master directory, and an exit that never strands work or
money. The idea throughout is that **one record follows the person**: an interest becomes a `PartnerApplication`, screening,
interview, verification and the offer all attach to that same application, activation creates the real account, and the later
screens read that account. Nothing is a second copy; what each screen shows is derived on read wherever it can be.

| # | Screen | What it owns |
|---|---|---|
| 141 | Partner Recruitment Landing | The one public front door (`/join`), source tracking (QR / referral / campaign), one interest per phone and role, honest surge waits |
| 142 | Applicant Data Form | The application record: saves as they type, free-text experience is enough, references never block, the applicant's own link is their credential |
| 143 | Applicant Screening | A person decides, the score only ranks; territory need read from coverage; frozen decisions; kind decline messages in the applicant's language |
| 144 | Interview Scheduling | Self-service slots from Admin's windows, nothing silently cancelled, reminders by the heartbeat, a decision signal for the offer |
| 145 | Background Verification | The structural gate in front of the offer: third-party first, a person where it cannot answer, conditional approval with a deadline |
| 146 | Offer & Agreement | Versioned templates, frozen terms, negotiation, identity-verified signature, **signing activates the account** |
| 147 | Recruitment Dashboard | The funnel, where people are now, territory need against applicants on the way, qualified-but-waitlisted |
| 148 | Partner Tier & Category Assignment | Tiers that change real configuration: surveyor commission, technician lead authority, supplier payment terms; versioned criteria |
| 149 | Partner Directory | One searchable master list over every role; multi-role people as one entry; quick actions; CSV export |
| 150 | Partner Deactivation & Exit | A guided exit: work handed on, settlement read from the ledgers, access ended last (first for a serious violation), exit conversation |

**Shared vocabulary worth knowing before building on this module**

- **One application, many stages.** `PartnerApplication` carries `screening`, `interview`, `verification`, `offer` and `waitlist`.
  What the applicant reads is a message *key* rendered in their own language at read time (`messages`), shown on their own link:
  there is no fake external channel. 146's `ofActivate` is the one place an account is created.
- **Gates are structural, not advisory.** 145's gate (`clear` / `conditional` / `blocked`) and the interview signal are read by 146,
  which refuses to prepare or send an offer over them; an override needs a written reason kept on the offer. A conditional approval
  (insurance, a skill, a licence) has a deadline and lapses back to blocked.
- **Scores rank, people decide** (143): weights are visible and tunable, a decision freezes the score and its explanation, and
  the feedback loop only suggests a change once enough rated outcomes exist.
- **A tier is real configuration** (148, `@/features/partners/tiers`): a surveyor's tier adds commission points to the conversion share
  their agreement sets (`surveyorConversionPct`, used by 077's commission and 140's payout plan), a technician below `canLead` is refused
  by the job-team actions (130), a supplier's tier *is* 100's `Supplier.paymentTier`. Criteria are versioned and publishing never
  reassesses anyone: people who no longer meet their tier are put up for a dated review and stay where they are. A recent safety-critical
  snag makes a promotion's timing Admin's documented call.
- **The directory keeps no data** (149): one row per person (the last ten digits of the phone), one line per role, searched, filtered
  and paged in the repository. Its quick actions go to the owning screens; reassigning territory is the one write it makes.
- **Exit is a sequence, not a switch** (150, `@/features/partners/exit`): leads, jobs and orders are handed on (the records are really
  moved), what they are owed is read from the commission ledger or the supplier payment records, a disagreement is decided on the record
  with reasons, and only then does access end. A removal for a serious violation ends access first and can hold the money pending
  review. An exiting partner receives no new work from the moment the exit starts (`acceptsNewWork`).
- **Admin hears through commitments**: `application_screening`, `application_reference_check`, `interview_*`, `verification_*`,
  `offer_*`, `partner_onboarding_finish`, `waitlist_review`, `tier_dispute_decide`, `tier_review_due`, `exit_work_handover`,
  `exit_settlement`, `exit_dispute_decide` are rows in `commitmentRules.ts`; reminders and nudges are heartbeat syncs with
  `logAutomatedAction`.

**Checkpoint (as of this module).** All ten screens were clicked through as Admin (and the applicant's own links as a visitor) at 390,
820 and 1440: no horizontal overflow, no raw translation keys, no console errors. An end-to-end run took a seeded applicant from offer to
signature to an active surveyor on the first tier, found them in the directory, started and finished their exit, and confirmed they were
then deactivated and refused as an assignee. Earlier screens spot-checked after the changes that touched them (130 job team, 100 payment
terms, 013/014 tracking, 140 certificate, 015 territories, 019/029 alerts): all clean.

**Placeholder business decisions to confirm (flagged in code and on screen where they show)**

- 141: busy/surge intake thresholds; the role descriptions are copy for the owner to confirm. 143: factor weights (20/30/25/10/15) and the
  reshuffle share. 144: availability defaults, the miss limit, reminder times. 145: conditional limits (30 days, 2 at a time), the fallback
  note length. 146: term ranges and which are negotiable, `CONVERSION_PCT`, **the clause wording (a starting draft for the owner's advisor)**.
- 147: leads one surveyor keeps busy, the urgent-need threshold. 148: the default criteria numbers, +0.25 / +0.5 commission points, the
  60-day review window, the 30-day incident window. 150: last day ≤ 60 days ahead, settlement within 5 days, payment within 7 days of
  access ending, disputes decided in 3 days.

**Honest limits.** Tier criteria can only be edited, not added or removed (a new measure needs code). There is no payout-dispute screen
for surveyors and technicians, so an exit settlement dispute follows 117's pattern on the exit record itself; a supplier's dispute
adjustment is kept on the exit, not pushed through 115. Paying a field partner is recording a bank reference and marking their approved
entries paid: moving money is payroll, which this build does not have. Alternate sourcing for a leaving supplier's order records the
decision; the new order is placed from the order screens. Directory rows have no swipe actions (the sheet is the quick-action surface).

## Module 16 — Training & SOP Library (`151`–`160`, checkpoint-verified)

How a partner learns what the business needs of them, proves they have learned it, keeps it current, and tells AIEC when the
training itself is wrong. The idea throughout is that **training is a structural gate on work, not a library**: a technician who has
not finished and passed the safety modules cannot be given a job, and the same certifications that decide that are what the partner
sees on their own screen. Nothing here keeps a second copy of anything: the SOP library reads the checklists' own versions, the
skill matrix and the compliance tracker are derived on read, and every deadline is a commitment row.

| # | Screen | What it owns |
|---|---|---|
| 151 | Training Library | One governed curriculum read per person: modules, versions, what is required for your roles, the job gate, save for offline |
| 152 | Video Training Player | Lessons as timed scenes with knowledge checks judged on the server; nobody skips a check; place is kept even offline; reference sheets |
| 153 | SOP Document Viewer | A reading view over the governed procedures (never a copy), version history, bookmarks, offline copies, reference-only categories |
| 154 | Quiz & Certification Test | The test follows the lessons and its pass is the certification; retake waits; coaching flag after repeated fails |
| 155 | Certification Badges | The badges that decide eligibility, renewal, mid-job lapse, a calm peer standing, a downloadable credential |
| 156 | Refresher Training Reminders | A versioned cadence with grace and documented extensions; one pattern of grace, extension, then blocking |
| 157 | Skill Matrix & Gap Analysis | Who can do what, where the workforce is thin against the pipeline; assigning training is a commitment |
| 158 | Training Compliance Tracker | Is the whole workforce trained right now, who is not and why; renewal waves; reminders, snapshots, review record |
| 159 | SOP Update Rollout | Announcing a procedure change with who must read it and a short quiz; urgent changes never block work |
| 160 | Training Feedback | Partners rate and flag trainings (anonymous by default); Admin handles each item with a documented outcome |

**Shared vocabulary worth knowing before building on this module**

- **The gate.** `trainingClear(userId)` is true unless a technician still has a `gatesJobAssignment` module unfinished, its test
  unpassed, a certification past its grace period, or an in-force, non-urgent SOP rollout they have not acknowledged. Every assignment
  path (`addTeamMember`, `changeJobLead`, `delegateLead`, `assignRework`, `assignQcInspector`, candidate lists, 150's exit targets)
  refuses with `training_incomplete`. Work already in hand always finishes.
- **One badge, one truth.** `CertificationBadge` is issued only by a passed test, freezes the module version and the cadence in force the
  day it was issued, and is never rewritten. `badgeStatusOf` (valid / expiring / grace / extended / expired / superseded / retired) is read
  by the job gate, the partner's screen and the compliance tracker alike, so they cannot disagree.
- **Versions send people back only to what moved.** A module revision with a higher `minVersion` returns people to "update needed" and
  asks again only for the lessons whose `changedInVersion` is above what they finished.
- **Content is translation keys.** Titles, lessons, quiz questions and key points live under `trainingLib.content.*`,
  `lessonContent.*` and `assessmentContent.*`; adding a lesson or question is seed plus i18n only. SOP texts return as `SopText`
  (a key with parameters, or words in up to three languages): the repository never returns English for a key-owned text.
- **Admin hears through commitments and one beacon per issue**: `training_assignment`, `certification_renewal`, `compliance_review`,
  `sop_rollout_ack` / `sop_rollout_close`, `training_feedback_urgent` / `training_feedback_review` are rows in `commitmentRules.ts`;
  alerts are raised once per issue and resolve themselves (`certifications.alert.lapsedOnJob`, `assessment.alert.struggling`,
  `sopRollout.alert.overdue`, `trainingFeedback.alert.error`); every automatic step is a `logAutomatedAction`.
- **Small numbers are said plainly.** Skill coverage, compliance trend, certification standing and feedback averages all name how few
  people stand behind a figure instead of drawing a percentage or a ranking from it (`SMALL_WORKFORCE`, `SMALL_GROUP`,
  `MIN_RESPONSES`). Peers appear as first name and initial, and a partner can turn off being named.
- **Anonymous means anonymous.** A feedback reply stores a one-way `authorKey`, never a user id, so the same person can update their
  reply and count once while nobody, Admin included, can tell who wrote it. Moderation hides a comment, never a rating.

**Checkpoint (as of this module).** All ten screens were clicked through as Admin, technician (English, Hindi and Marathi), surveyor and
supplier at 390, 820 and 1440: no horizontal overflow, no raw translation keys, no console errors. The paths exercised end to end include
the lesson check that cannot be skipped, a failed test and its cool-down, the mid-job certification lapse and its Admin alert, an
urgent SOP rollout that does not block work against a routine one that does, a compliance reminder turning into a `TrainingAssignment`,
and a serious feedback flag raising an alert and an urgent commitment that clear when the flag is withdrawn. Checkpoint fixes: 160's
"thank you" card was cleared the instant a first reply saved (the form re-keyed on the new record), and a pluralised sentence read
"1 replies". Earlier screens spot-checked: 121/122 technician home and job, 126 safety checklist, 130 job team (the training gate
refuses an uncleared technician), 107 delivery SOP, 134/137/135 handover screens, 141–150 recruitment screens, 111 supplier payments,
101 deliveries: all clean.

**Placeholder business decisions to confirm (flagged in code and on screen where they show)**

- 151/152: module durations and every seeded module text and lesson wording are **starting drafts for the owner's safety adviser**; only
  eight lessons are authored (ONB-01 ×2, SAF-02 ×3, SAF-03 ×3), every other module says "lessons coming soon".
- 154: pass mark 80%, cool-down waits 1 / 4 / 24 h, the struggle threshold of 3 fails. 156: refresher cadence months and grace days (12
  months, 14 days of grace), the 7-day last reminder, the 120-day extension limit. 155: the 30-day renewal window.
- 157: the drive-to-skill mapping, the 50% gap line, stretched / tight deals per person, the small-workforce limit of 8. 158: the
  small-group limit of 5 and the renewal-wave window. 159: 2 days of notice, 24 h to acknowledge an urgent change, 90 days of away.
- 160: `MIN_RESPONSES` 5, the low average of 3, routine review within 14 days, serious flags within 24 h (4 h for safety modules).

**Honest limits.** There is no real video player: a lesson is a timed presentation of scenes with captions and optional read-aloud
(`hi-IN` / `mr-IN` voices may be missing on a device); a `mediaUrl` per scene would be the way to add one. Installation has no SOP editor,
so its versions come from the seed. SOP rollout quiz questions and summaries are shown in the words Admin wrote (not translated). The
compliance tracker takes a person's territory from their city and its trend leaves out partners who have since left. Suppliers hold
no expiring certifications, so they have no refresher route, and surveyors have no SOP library route. A credential has no public
verification page, only a number AIEC can confirm. Technician home (121) shows no banner for pending safety training; the job screens
show the generic `training_incomplete` message.

## Module 17 — Commission, Rewards & Payouts (`161`–`170`, checkpoint-verified)

Ten screens that make "pay people for what they did, and show them how" one ledger instead of ten. Everything reads the one
`CommissionEntry` ledger; nothing keeps a second copy of a figure.

| # | Screen | Route | What it owns |
|---|---|---|---|
| 161 | Commission Rules Engine | `/commission-rules` | The seven rules with their rates, append-only versions (never reach back), simulation before publishing, advance notice |
| 162 | Workforce Payout Tracker | `/payout-tracker` | Admin's whole-business read of the ledger, spotting the unusual |
| 163 | Payout Approval Queue | `/payout-approval` | A person clears every payout; flags, holds (the partner sees the kind, never the reason) |
| 164 | Automated Payout Disbursement | `/payout-disbursement` | Only cleared entries go out; failures are never silent or retried blindly |
| 165 | Rewards Leaderboard | `/rewards-leaderboard` | One ranking every role reads; a standing never moves without a reason |
| 166 | Badges & Milestones | `/badges` | Honoured under the rules of the day they were earned; rarity stated honestly |
| 167 | Contest Setup | `/contest-setup` | Contest configuration; closing creates real prize entries in 163's queue |
| 168 | Payout History & Statements | `/payout-history` | The partner's own record, statements, a way to ask |
| 169 | Tax Deduction (TDS) Statement | `/tds-statement` | Tax deducted at disbursement, certificates, Admin's deposit / return record |
| 170 | Dispute / Query on Payout | `/payout-dispute` | A fair, audited way to say "this looks wrong"; corrections go through the ledger |

**Decisions that shape everything else**

- **The ledger vocabulary never changed** (`projected | approved | paid | forfeited`). 163's checkpoint (`payoutApproval`), 164's pointer
  (`disbursement`), 168's `reversal` and 170's `correctsId` are separate fields, so 038 / 121 / 150 / 162 / 028 read what they always read.
- **A payout is cleared by a person, sent once, and told to the partner honestly.** 163 clears, 164 sends only cleared entries (one
  transfer per partner, never re-sent while in flight, a failed one blocks that partner until dealt with), 168 shows the stage in the
  partner's words, 169 shows what tax was taken, 170 is the way back when it looks wrong.
- **Nothing is edited after the fact.** A rule change is a new version from a future day; a tier, badge or tax rate keeps the version it
  was earned under; a correction is a *new* entry stamped with the original's rule and version (`correctsId`); a contest's standings
  are frozen at the close.
- **Tax is taken at disbursement** (194H surveyors, 194C technicians): the transfer is gross minus TDS, the first deduction catches up
  on everything paid earlier in the year, a failed transfer voids its deduction, certificates stay provisional until Admin records the
  quarter's return. Suppliers (194Q) are watched, not deducted.
- **Disputes are one record with 168's question.** A dispute adds a topic, a claimed figure, a longer target (5 days, 7 once escalated),
  an update to the partner every 3 days once late, repeat-ask handling that reads new information as new and identical words as a
  repeat, and a **systemic** path: a dispute that points at a rule asks for a rules review and counts who else might be short.
- **Every dated obligation is a commitment** (`payout_approval`, `payout_hold_review`, `payout_disbursement_attention`,
  `contest_live / closing / result`, `payout_query_answer / reply`, `tds_deposit`, `tds_return`, `payout_dispute_resolve`,
  `payout_rule_review`) and every automation logs itself (`payout_dispute.progress`, `payout_dispute.pattern`, `badge.awarded`,
  `payout_tracker.spike`, `payout_disbursement.failed`).

**Checkpoint (as of this module).** All ten screens were clicked through as Admin, surveyor, technician and supplier (English, Hindi
and Marathi) at 390, 820 and 1440 with no horizontal overflow, no raw translation keys and no console errors, exercising the paths that
matter: batch approve and a flagged payout that must be acknowledged, a failed transfer and its retry, a run stopped partway, a contest
that closes into prize entries, a TDS catch-up deduction and a certificate turning final once the return is recorded, a dispute going
from raised to escalated to a correcting entry that appears in 163's queue, and a repeat ask refused when it only repeats. Checkpoint
fixes: 168's / 162's question threads showed an app-written line as "You" with no text once disputes existed (now rendered from its
key), 038's "Something looks wrong" now opens the dispute form, and a supplier dispute needs the amount it is about (the repository
already required it). Earlier screens spot-checked: 120 reconciliation (worker payouts now arrive net of TDS and still match their
bank lines), 115 supplier payment history, 140 handover certificate and its payout judgement (an in-flight entry is locked like a paid
one), 121 technician home, 028 finance overview, 149 partner directory: all clean.

**Placeholder business decisions to confirm (flagged on screen where they show)**

- 161: every rate and the 5% burden warning, the 70% dominance line, 7-day notice. 162: spike 1.8× / ₹25,000, outlier 3×, 7-day wait.
- 163: ₹25,000 routine limit, 2-day look, 7-day hold review. 164: UPI limit ₹1,00,000, Friday 11:00 weekly run, settle times.
- 165–167: closing-soon 24 h, badge catalogue and bars, rarity bands, contest limits (5 places, ₹1,00,000 a place, 120 days).
- 169: rates (2% / 1% / 0.1%), limits (₹20,000 / ₹1,00,000 / ₹50,00,000), 20% without a PAN, deposit by the 7th, return dates.
- 170: answer in 5 days (acknowledge in 24 h), 7 days once escalated, an update every 3 days, correction limit ₹1,00,000, a pattern at
  3 disputes from 2 partners in 30 days, 85% alike is a repeat.

**Honest limits.** A partner cannot enter their own bank details or PAN (Admin records them after speaking to them). Exit settlements
(150) still bypass the approval queue and TDS. `site_visit` / `lead_qualified` entries are seeded, not generated. A recognition prize
gives no badge. Admin can only add to a figure from a dispute, never reduce one. The banking partner and the ID service are
simulated. The rate-based contest metrics (conversion, QC pass) are not offered yet.

## Module 18 — Customer App/Portal (`171`–`180`, checkpoint-verified)

Ten screens that give the customer one window onto the same records the business runs on. Nothing here keeps a second copy of a
fact: each screen is a read over the record that owns it, or a thin write into the owner's own path.

| # | Screen | Route | What it owns |
|---|---|---|---|
| 171 | Customer Home | `/customer` | A summary of the project (stage, next step, payments, documents, support), honest but calm |
| 172 | Project Status Tracker | `/project-status` | The journey as milestones, an honest next date, curated photo highlights, a pause said plainly |
| 173 | Document Vault | `/documents` | The customer's read over the records that issued each document; newer versions never rewrite older ones |
| 174 | Payments & Financing | `/my-payments` | What is owed and when, a disputed stage never "overdue", confirming only on real evidence |
| 175 | Service Requests | `/service-requests` | One ticket, three views; triage by rules where confident and a person where not; an emergency path |
| 176 | Support Chat | `/support-chat` | An assistant that answers only when sure and hands over warm with the whole picture |
| 177 | Feedback & Rating | `/feedback` | Asked at the right moment; a weak part is never lost in a good score; feeds the performance records |
| 178 | AMC / Maintenance Booking | `/maintenance` | Cover said first, real slots, a matched technician, live arrival on the day |
| 179 | Referral Program | `/referrals`, `/refer/:code` | A referral is a lead; its reward is a commission entry through 163 / 164 |
| 180 | Notification Center | `/notifications` | Everything already sent, where it stands now, and preferences that write to the opt-out record |

**Decisions that shape everything else**

- **Derived on read.** 171–174, 177 (the asks) and 180 compute from the real records on each read; what a customer sees cannot drift
  from what Admin sees (172 shares 129's timeline, 174 shares 028 / 082 / 088's aging, 173 reads the issuing records).
- **The customer is told the truth, calmly.** A disputed payment is "being looked into", never overdue; a delay says why in the
  tactful words 129 uses; a date is promised only when it can be kept (178 would rather say "ask us to arrange it" than guess); an
  old notice (180) opens with where things stand today.
- **One ticket, one chat, one ledger.** A maintenance booking *is* a service ticket (175) so the technician's list, 121's card and
  Admin's board needed no change; a support chat is a `Conversation` with `kind: 'support'`, so 057 / 053 see it; a referral reward
  is an `approved` `CommissionEntry` from the `referral_bonus` rule, so 163 clears it and 164 sends it.
- **People, not queues, own every promise.** New commitments: `service_ticket_respond`, `service_visit`, `service_claim_review`,
  `service_visit_followup`, `support_chat_reply`, `feedback_outreach`, `feedback_recognition`, `referral_reward`. Alerts reuse the
  existing vocabulary (emergency and safety words are critical `safety`).
- **Compliance is the customer's lever, and essential notices are never dropped.** 180's SMS / WhatsApp choices append
  `customer_request` opt-out events; `commChannelFor` is now the one rule every customer send reads, so an essential notice to
  someone with an account falls back to the app instead of vanishing.
- **First capture wins.** 179 uses the CRM's own duplicate rule (now shared by `findDuplicateLeads`): a person AIEC already knows is
  said plainly to be known and no reward applies.

**Checkpoint (as of this module).** All ten screens were clicked through as Rajesh (English), Meera (Marathi) and Farhan at 390 and
1440 (and 820 per screen while building) with no horizontal overflow, no raw translation keys and no console errors, exercising the
paths that matter: an emergency ticket and a safety-word ticket, a visit booked, moved and tracked "on the way", a chat handed to a
person, a weak rating routed to outreach, a referral that is already known, one waiting for a site that is not ready and one that
becomes an order (the reward appears in 163's queue and in the customer's list), and a customer who switched off both SMS and
WhatsApp still receiving an essential notice in the app. Nothing regressed at the checkpoint; the fixes made while building (the context card's percentage, the staff-concern false positive, the seed skill gap that left no technician for the gearless lift, the CRM duplicate rule now shared, and the notice fallback) are recorded under each screen in CLAUDE.md. Earlier screens spot-checked:
083 payment reminder run, 102 shipment tracking, 105 delay notices, 139 warranty and AMC, 121 technician home, 163 payout approval
(a customer payee), 044 lead assignment (unassigned referral leads), 161 commission rules: all clean.

**Placeholder business decisions to confirm (flagged on screen where they show)**

- 171–174: the 14-day payment window, the ₹1,00,000 financing floor, the 60-day "ending soon" window.
- 175–176: response targets by urgency, the safety words, the assistant's confidence margin, queue and wait numbers.
- 177: the ask timings (1 / 30 days), thresholds (≤ 2 negative), weights, the minimum sample.
- 178: 12-hour notice, 14 / 45-day horizons, the arrival speed, an indicative price per visit.
- 179: the ₹5,000 reward (versioned in 161). 180: the 14-day "new" window, folding three or more of a kind, which kinds are essential.

**Honest limits.** Videos keep only a poster frame; live arrival depends on the technician's own tap (no continuous GPS); the
service request has no checklist or Job-level service job; Admin has no nav tab for tickets, feedback or the chat board (alerts,
commitments and the assistant lead there); a referral reward has no payout details until Admin records them (164's "needs details"),
no TDS is deducted for a customer payee, and a voided deal closure does not take the reward back; the notification fallback is an
in-app copy only (there is no push), and 174's reminder list still labels an opted-out channel as skipped.

## Module 19 — Automation Rules & Notification Engine (`181`–`190`, checkpoint-verified)

Ten Admin-only screens that turn the automation the app already runs into something that can be seen, configured, audited,
overridden, tested and trusted. They add almost no new business logic of their own: each reads, or configures, the machinery
the earlier modules built, and the rules each screen enforces are pure modules under `@/features/*` that the repository and the
screen share.

| # | Screen | Route | What it owns |
|---|---|---|---|
| 181 | Automation Rules Dashboard | `/automation-rules` | The heartbeat as a table of units and categories; one telemetry for 027 and 181; a pause with a stated, narrow effect |
| 182 | Workflow Trigger Builder | `/workflow-rules` | Custom rules as data: subject, up to four conditions, one action; examine before you commit; retire, never delete |
| 183 | Notification Templates (staff) | `/notification-settings` | Urgency, per-role channels, wording per language, cutting reach confirmed, a test send |
| 184 | Escalation Matrix | `/escalation-matrix` | How an unanswered alert climbs: chains, last resort, backups, drills that prove it |
| 185 | SLA Monitor | `/sla-monitor` | One view over every SLA-governed timer, held to its own process's target; triage and trend |
| 186 | System Health | `/system-health` | Technical health of ten connections; AIEC's own calls decide, the provider's word is recorded beside it |
| 187 | Automation Audit Log | `/audit-log` | The one permanent record, chained and tamper-evident; searchable at volume; exports are themselves recorded |
| 188 | Manual Override Console | `/override-console` | Four things Admin may force, five nobody may; reason, preview, confirmation, every time |
| 189 | Integration Management | `/integrations` | Credentials (masked), test and live, rotation without a scattered failure, demo isolation |
| 190 | Automation Testing & Sandbox | `/automation-sandbox` | Scenario tests that provably touch nothing; expected vs actual; tested-then-live |

**Decisions that shape everything else**

- **Units are what categories are made of.** `HEARTBEAT` / `UNITS` / `CATEGORIES` (181) mean a new automation is one entry in each,
  and a feature shipped later appears on the dashboard by itself (an unknown source key becomes a category of its own).
- **One record, now chained.** `logAutomatedAction` is still the only write path, but every entry carries `seq`, `prevHash`
  and `hash` and is frozen (187). A person's override is written into the same chain tagged "by hand" (188). Tamper-evident,
  not tamper-proof: the hash is a fast non-cryptographic one, and a real backend would add write-once storage.
- **Never a silent dead end.** An alert climbs 184's chain on its own; when the last repeat has had time to be answered the run is
  `exhausted` and a critical alert says so. A broken audit chain, a failing heartbeat unit, a rotation that lapsed, a sandbox
  connection serving real customers and a lapsed SLA each raise one alert and a commitment, never a queue only its own screen reads.
- **A pause, an override and a test each say exactly what they do.** A paused category's own-clock steps do not run and nothing
  already done is undone (181); an override needs a reason, a preview and a tick, and five kinds (QC, safety, handover gate,
  compliance, training gate) have no override path at all (188); a sandbox run counts the real records it could have changed to
  prove it changed none (190).
- **AIEC's own observations beat a third party's word.** 186 judges a connection from probes and real usage and records the
  provider's status page beside it; a provider that says all is well while our calls fail points at our side, and several failures
  starting within minutes read as one cause.
- **Secrets never leave the repository.** 189 keeps test and live credentials apart, shows only a key name and a mask, and demo
  traffic is handed the test key whatever the mode (and is proven so).
- **Tested means tested at exactly this definition.** 190 hashes a rule's definition; any edit makes earlier results stale. Going
  live reuses 182's own activation path with its `fromNow` / `confirmMany` / `acknowledgeConflicts` options.

**Checkpoint (as of this module).** All ten screens were opened as Admin at 390, 820 and 1440 with no horizontal overflow, no raw
translation keys and no console errors. The paths that matter were exercised: a rule built in 182, tested in 190 against its
standard scenarios, accepted as a baseline, edited (the baseline then differs and the old tests go stale), re-tested and taken live
(182 then shows it active, the rule keeps a `simulated` and `activated` event); a declared expectation that the rule does not meet
(not acceptable away); the library's 180-day review and a custom scenario added and removed; the 184 chain, 185 timers, 186
incidents, 187 chain and exports, 188 refusals and 189's rotation and isolation check as exercised while each was built. Spot checks
of earlier screens that these modules reach into, 019 (Emergency alerts: now shows the real chain), 027 (Automation health: shares
181's telemetry), 028 (Cash flow), 057 (Reply inbox: feeds 185) and 090 (Refund & dispute), loaded clean with nothing regressed.
Nothing needed fixing at the checkpoint beyond wording found in 190 itself (a declared expectation that differs no longer offers
"accept as baseline").

**Placeholder business decisions to confirm (flagged on screen where they show)**

- 181: the pause reason length, the failing-unit threshold. 182: four conditions, 20 records per run, 25 matches = "many".
- 183: the 39 core types' urgency, the noisy threshold, SMS segment counts. 184: every default chain, the repeat counts, the drill
  cadence (30 / 60 / 90 days), the demo gateway's timings.
- 185: consequence weights 3–5, the 75% "close" line, the trend and target-fit thresholds. 186: probe rhythm (5 min), degraded 10% /
  down 50%, the cluster window, provider names and status pages.
- 187: the page size and hash. 188: 14 days = stuck, 30 days, 20-letter reasons, three overrides in 30 days. 189: 90-day rotation, the
  2-minute window, the 16-character minimum. 190: the 14 standard scenarios, the 180-day review, the one-week nudge, the tolerances.

**Honest limits.** Every gateway, probe, rail and credential in this module is a demo stand-in: nothing real is called and no provider
receives a secret. The heartbeat runs only while someone has the app open, the audit log lives in memory like every other store,
and Admin has no nav entry for most of these screens (the alerts, commitments and the assistant lead there; 190 and 188 are reached
by their routes). 190 tests rules against today's settings only; escalation and commission cannot be "promoted", and a scenario for
a rule that waits N days then acts cannot exist because 182 has no chaining.

## Module 20 — Settings, Security, Compliance & Super Admin (`191`–`200`, checkpoint-verified)

The governance layer under everything else. Every screen here is Admin's (192 / 195 / 199 / 200 reach other roles too) and every
one follows the same discipline: a change that weakens something is previewed, reasoned and confirmed; history is append-only; a
number or limit that is a business decision is flagged on screen; and where the app cannot really do something (send an SMS,
restore a backup, pay a provider, enforce a rule on a server) the stand-in says so rather than pretending.

- **191 Company profile & branding.** One governed source for who AIEC is, as versioned, effective-dated `CompanyProfileVersion`s: a
  document is read back against the version in force on its own issue day, so nothing issued is re-dressed. A legal change (GSTIN,
  address) is not a styling change: it starts on a stated day, shows the tax impact and is verified afterwards. `BrandProvider`
  applies accent colours and heading font in the light-toned themes only, after a readability floor.
- **192 Users & permissions.** The router asks a permission table before it renders a screen; the code's own route table is the default
  and Admin's decisions are only ever a difference from it. A lockout is impossible by design (essential screens), custom roles grow
  without a rebuild, an exception for one person needs a reason and ends, and risk is derived. Screen-level only: actions inside a
  screen still check roles in the data layer (said on screen).
- **193 Single-person monitor.** A synthesis of the beacons the dedicated screens already raise, never a second source; nothing critical
  can be hidden; "everything is fine" is only recorded when it is true; a backup viewer gets a limited read-only panel.
- **194 Data privacy & consent.** A register over what already exists, plus the requests people make about their own data as a workflow
  with a clock (identity first, a plan before a deletion, outcomes that say what was kept and why); retention is a versioned policy
  applied to data that exists.
- **195 Security & sessions.** The first record of who is signed in where and the one place the app enforces it (`SecurityGate`): a
  second step, unusual-place confirmation, remote revoke, lock and recovery that is not "forgot password", and a documented path for
  a person who cannot comply. Sign-in itself is by one-time code; the second-step code is a demo value.
- **196 Backups & exports.** The backup service is a stand-in (a run records what it would hold, with a checksum), but failure is loud,
  restore points and tests are recorded, and exports are real: purpose-limited, personal columns need a justification, built in
  chunks, expiring.
- **197 Software costs & renewals.** What AIEC pays to keep its own software running: usage that explains cost, plan advice that shows
  trade-offs (a cheaper plan that cannot carry the busiest minute is never a saving), and quiet failure made loud (cards, renewals).
- **198 Legal & contract wording.** A register over the wording the generators actually read: contract and state-clause wording is
  written here as append-only, effective-dated revisions applied through the quotation template (previewed against live contracts),
  the rest is listed read-through with its own screen; a state's sites find its wording by city; a legal review that finds a problem
  in wording in use is a critical alert and a commitment, not information. Not legal advice (said on screen).
- **199 Help & support.** Role-tagged (free strings, so new roles need no change), versioned articles with real en / hi / mr text;
  helpful / not-helpful per version; paths to a person by role; a suggest-a-topic path and searches that found nothing kept without
  who searched; stale help (overdue review, links to screens that no longer exist, reported wrong) is detected and raised.
- **200 App version & ideas.** Plain-language release history with changes that affect how someone works shown apart, an update prompt
  that explains what is new for the person's role and is honest about the device (too old is said, unknown is said), adoption for
  Admin, and general product feedback that groups close suggestions and shows others only what Admin chose to publish.

**Cross-cutting facts added by this module.** Four new heartbeat units are protected (`commitments`, cannot be paused): `security`, `backups`, `billing`,
`legal`; `help` and `appInfo` sit with customer care. The Chip component does not forward `data-*` (tests wrap chips in a span).
Links between screens must use the router, not `<a href>`, because a reload wipes the in-memory repository (198 had this and was fixed
in 199). `ds-badge--wrap` was added to the design system for long labels.

**Checkpoint (as of this module).** All ten screens were opened as Admin at 390, 820 and 1440 with no raw translation keys and no
console errors; one real defect surfaced: 194's register let a long consent label push the page wider than the viewport at 820 and
1440 (fixed with a wrapping badge). The alerts and commitments these screens raise (198 / 199 / 200) show translated titles. Each
screen's paths were exercised while it was built (194 requests and retention, 195 the gate and recovery, 196 failing backups and
async exports, 197 the tier trade-offs and failed card, 198 propagation to a live contract and the review-issue urgency, 199 role
scoping and feedback loops for each role, 200 the update prompt with an old browser). Customer, technician, surveyor and supplier
home screens and Settings were spot-checked with the new gate and access guard active and loaded clean; earlier-module Admin screens
019, 029, 186, 187 and 181 loaded clean.

**Placeholder business decisions to confirm (flagged on screen where they show)**

- 191: effective-day windows (90 / 30 days), contrast floors. 192: reason lengths, 90 / 365 days, "many" thresholds. 193: the 30-day
  overdue line, 15% conversion, the 3-day quote window. 194: 2 / 30-day request clocks, 80% "close", 200 records a run.
- 195: five wrong codes in 15 minutes, session limits per role, 90-day exception maximum. 196: backup rhythm, retries, 90-day restore
  test, 7-day export keep. 197: every plan, price and limit (all seeded). 198: 365-day review, 3 days to fix a finding.
- 199: 180-day article review, 5 answers before a rate, 3 reports flag an article. 200: half the words = "the same idea", 5 ideas a day,
  the minimum browser versions.

**Honest limits.** Gateways, providers, the backup service, the second-step code and the update are stand-ins: nothing real is sent,
paid, restored or downloaded. Access is enforced at the screen, not on every action. The heartbeat runs only while someone has the app
open and every store is in memory. Most of these screens have no nav entry (alerts, commitments, the assistant and the Settings tab
lead there). Release notes, help articles, legal wording and review records seeded here are drafts and examples for the owner to
replace with the real ones.
