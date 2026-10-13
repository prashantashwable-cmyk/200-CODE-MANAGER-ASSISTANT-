# Research Notes — What This Build Is Grounded In

This set was built after actually researching three things, not from assumption: (1) what Google AI Studio can currently do, as of July 2026, (2) what current best practice actually is for sequencing prompts to an AI coding agent, and (3) real Indian elevator-industry standards, pricing, and process, so the app's business logic reflects reality rather than generic placeholder numbers. Short version of each below, with what it changed about this build.

## 1. Google AI Studio, current state (researched July 2026)

Google AI Studio's **Build mode** went through a major upgrade in March 2026, moving from a lighter app-generation feature to a genuine full-stack "vibe coding" tool powered by Google's **Antigravity** coding agent (built out of the team and technology behind the Windsurf editor). Build mode now:

- Generates full applications in **React, Angular, or Next.js**, selectable per project, with **Firebase wired in automatically** (Authentication, Firestore, Hosting) — it detects when a feature needs a backend (login, saved data) and provisions it with your approval, rather than you configuring it by hand.
- Also supports a relational option (Cloud SQL for Postgres) for apps that genuinely need it, on a starter tier with shared quota.
- Added **native Android app generation** (Kotlin + Jetpack Compose, with an in-browser emulator and one-click upload to the Play Store's internal test track) at Google I/O in May 2026.
- Has an **Annotation Mode**: click directly on an element in the live preview and describe the change, instead of writing out a full new instruction — genuinely useful for the visual polish passes this set's checkpoints recommend.
- Supports **"AI Chips"** — attaching specific capabilities like Google Maps data or image generation directly to a prompt. This matters directly for this build: the Admin Live Map Dashboard and every other map-based screen in this set are written assuming you'll attach the Maps AI Chip when you build them.
- Lets you download a project as a ZIP or deploy directly to Cloud Run (two free deployments) once you're ready to go live.

**Why this build is a responsive web app (PWA) rather than native Android**: native Android generation is real but very new (May 2026) and doesn't cover iOS at all. AIEC's own brief calls for an Admin who monitors a live map (genuinely better on a larger screen) alongside field staff and customers who'll mostly use phones, including some iOS customers. A responsive, installable web app covers every one of those cases from one build; native Android would leave out the Admin's desktop convenience and every iPhone-owning customer. If you later want a true native app in addition to this, Build mode's Android path is there for that as a separate future project.

**One thing worth knowing before you connect real customer data**: as of April 2026, AI Studio's free tier runs Flash-class models only (Pro moved to paid-only), and conversations on the free tier may be used to help improve Google's models. That's a reasonable trade-off for building and testing this demo — it is *not* a reasonable trade-off once this handles real customers' phone numbers, addresses, and payment information. Move to a paid tier before that happens.

## 2. Vibe-coding sequencing — why this is 200 small prompts, not one

Every current write-up on getting good results from an AI coding agent — including Google Cloud's own explainer on the practice — converges on the same handful of points, and this set is built directly around them:

- **Never one-shot a complex app.** The single most repeated finding: describing an entire multi-feature system in one prompt forces the agent to silently guess at scope and priority, and produces something that looks plausible on the surface but breaks in ways that are hard to trace back to a cause.
- **Slice vertically, one real feature at a time**, and validate each slice before building the next one on top of it — which is exactly why this set is 200 individual screen-prompts in a specific dependency order (foundation → auth → admin visibility → field capture → CRM → communication → quotation → negotiation → payments → suppliers → logistics → installation → quality → recruitment → training → rewards → customer portal → automation config → security/settings), rather than one module dumped all at once.
- **Be explicit about what NOT to touch.** Every prompt in this set ends with an explicit scope line telling the agent not to restyle or refactor anything outside that screen — this single instruction is repeatedly cited as one of the highest-value, lowest-effort things you can add to a prompt for an agentic coding tool.
- **Checkpoint and roll back.** This set's every-10th-screen "Module Checkpoint" and its reminders to keep a ZIP or version checkpoint reflect the standard advice to treat AI-generated progress the way you'd treat any other software checkpoint — verify, then commit, so you always have a known-good point to return to.
- **Treat AI output as a first draft, especially for anything security- or money-related.** This is why the payments, supplier-payment, and security modules in this set repeatedly call for explicit validation, approval gates, and audit trails rather than trusting default agent behavior on financial logic.

## 3. Elevator industry grounding (India, 2026)

Rather than writing generic "add price, add features" logic, this set's Quotation, Installation, and Quality Check modules are grounded in real current standards and figures:

- **Standards referenced**: IS 14665 (electric traction lifts), IS 15259 (hydraulic lift testing), IS 17900 Parts 1 & 2 (BIS safety-component certification), IS 14671 (lifts for persons with disabilities), and the National Building Code 2016.
- **Regulation is state-specific in India**, not centrally governed by one national law — states including Maharashtra, Karnataka, Tamil Nadu, Delhi, and Gujarat each have their own Lift Act/Rules, and a State Electrical Inspectorate or Lift Inspectorate issues both a License to Erect and a separate License to Operate, the latter needing annual renewal. This is why the Digital Contract Generator and Compliance Certification screens in this set are written to select state-specific clauses based on the customer's site address rather than assuming one national template fits everywhere.
- **Real safety-device vocabulary used throughout the Installation and QC modules**: Automatic Rescue Device (ARD), infrared door-curtain sensors, fireman's/fire-recall mode, governor overspeed switches, buffers, and overload/load-weighing devices — matching what an actual pre-commissioning inspection (no-load run, then full-load trial run) checks for.
- **Pricing grounded in current 2026 Indian market figures**: residential lifts broadly range from roughly ₹5 lakh at the basic end to ₹60 lakh+ at the luxury end, with a typical mid-market G+1 to G+4 home installation landing around ₹10-25 lakh; each additional floor/stop typically adds roughly 10-25% depending on drive type; 18% GST applies; AMC contracts typically run ₹15,000-50,000 per year; and installation timelines typically run 10-45 days depending on drive-type complexity. This is why the Pricing Rules & Margin Configuration screen is written as an editable table rather than a fixed formula — real costs and per-floor increments genuinely vary by drive type (hydraulic, geared/gearless traction, machine-room-less, vacuum/pneumatic, screw-driven) and should stay adjustable as your own supplier costs evolve.

## Before you treat this as genuinely production-ready

The 200-screen build gives you a complete, correct, click-through shape of the entire business exactly as your brief described it. Before real customers and real money touch it, line up:

1. A real payment gateway account (Razorpay, PayU, or similar) and API keys, replacing the placeholder checkout flow.
2. A real WhatsApp Business API account and approved message templates, replacing the placeholder communication engine.
3. An actual financing/loan partner integration and agreement, replacing the placeholder EMI flow.
4. A qualified lawyer's review of the generated contract, warranty, and state-specific compliance language before it's presented to a real customer as binding.
5. A basic security review of authentication, payment handling, and data storage before real customer PII and payment data flows through it — treat everything the agent generated as a first draft on these points specifically, not a finished, audited product.
