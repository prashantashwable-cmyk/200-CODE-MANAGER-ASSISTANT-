# Prompt 198 of 200 — Legal/Contract Templates Repository Screen
**Module 20 of 20: Settings, Security, Compliance & Super Admin** · Screen 8 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 197 (Subscription/Billing (SaaS ops) Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The governance layer underneath everything else: branding, permissions, data privacy, and the master control panel befitting a single, trusted monitor of an enterprise-grade system. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Legal/Contract Templates Repository Screen** screen, used by: **Admin**.

### Functional requirements
- Central repository of every legal template used throughout the app: customer contract boilerplate (from Digital Contract Generator), supplier agreement terms (from Supplier Contract & SLA), partner onboarding agreements (from Offer & Onboarding Agreement) — all viewable and manageable in one place
- Version history and effective-date tracking for every template, consistent with the versioning discipline applied elsewhere to SOPs and pricing rules
- State-specific clause library (referencing the various State Lift Acts) organized for easy reference and correct automatic application based on site location
- Legal review workflow marker (e.g., 'reviewed by counsel on [date]') for Admin's own governance tracking, even though the app itself doesn't provide legal advice

### Data this screen touches
- `template_id`
- `template_category`
- `current_version`
- `effective_date`
- `last_legal_review_date`

### Business logic & automation rules
- This repository is explicitly the human-readable, centrally organized reference view over the same governed legal content actually used by the Digital Contract Generator, Supplier Contract & SLA, and Offer & Onboarding Agreement screens' automated document generation — one true source of legal content, presented both as generation logic and as browsable reference
- State-specific clause organization directly supports the correct automatic clause-selection logic already established in the Digital Contract Generator, giving Admin a clear, organized way to review, update, or add state-specific content as AIEC's operations expand into new states over time
- This screen deliberately includes a legal-review-tracking marker as a governance aid, while being careful not to claim the app itself provides legal advice — actual legal review remains an appropriately human, professional, external process, consistent with how GST/TDS filing similarly remains an external accountant-handled process supported by clean data from the app

### Edge cases & validation to handle
- A template needs updating due to a change in the underlying State Lift Act or a new BIS standard: ensure this repository makes the update, its effective date, and its downstream propagation to the actual document-generation screens clearly connected and correctly synchronized, never a stale repository disconnected from what's actually being generated
- AIEC expands into a new state with its own distinct Lift Act requirements not yet represented in the clause library: support clean addition of a new state's clause set, consistent with how the Digital Contract Generator already anticipated this exact expansion scenario
- A legal review reveals an issue with a template already in active use (a genuine legal risk discovered after the fact): this should be treated with real urgency, prompting immediate correction and re-versioning, rather than the review finding sitting unaddressed as just informational

### UI / design requirements
**AIEC Design System — "Alabaster & Ascension" (premium royal-white theme)**
- Palette: Alabaster White #F8F6F1 base, pure White #FFFFFF cards, Charcoal Ink #2A2723 text, Antique Gold #B8873D primary accent, Royal Emerald #0E4B3D secondary accent. Keep Error Red #B23B3B reserved strictly for genuine errors/safety alerts — never decorative.
- Type (Latin/English): "Fraunces" (serif, Google Font) for headings/hero numbers, "Plus Jakarta Sans" (Google Font) for all UI/body text, "IBM Plex Mono" tabular figures for money and KPI numbers.
- Type (Devanagari/Hindi & Marathi): "Fraunces" and "Plus Jakarta Sans" do NOT cover Devanagari glyphs — never let Hindi/Marathi text silently fall back to a generic system font. Pair "Martel" (Google Font) for headings and "Hind" (Google Font) for UI/body text in Hindi or Marathi, matching the same heading/body weight relationship as the Latin pair. Keep IBM Plex Mono for all numerals in every language — India's digital finance UI uses Western digits (0-9) regardless of the surrounding script, so amounts don't need a separate numeral font per language. All user-facing text (labels, buttons, headings, messages, notification templates) must render in the user's selected language (English / Hindi / Marathi) via the app's translation system — never hardcoded in one language.
- Icons: Phosphor Icons or Lucide, thin 1.5px line-weight, rounded caps, tinted Royal Emerald by default and Antique Gold when active/selected.
- Cards: 16-20px corner radius, soft ambient shadow (never a harsh flat drop-shadow), 1px hairline border tinted gold at ~15% opacity.
- Grid: 8pt spacing throughout, mobile-first single column, 16-24px screen margins, sticky bottom action bar for primary CTAs, minimum 48x48px touch targets.
- Theme modes: build every color as a CSS custom property (`--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-accent-primary`, `--color-accent-secondary`, `--color-success`, `--color-warning`, `--color-error`, `--color-border`) — never a hardcoded hex value in a component — so the whole app can switch instantly between 4 modes, stored as the signed-in user's own saved preference: **Light/Alabaster** (default — the warm-ivory palette above), **Snow White** (a crisper, cooler, brighter variant — pure `#FFFFFF` background, near-black `#1F2124` text, tighter shadows), **Dark** (warm near-black `#1A1815` background and `#242019` cards, soft off-white `#F0EDE6` text, and *brightened* accent colors — gold `#D4A855`, emerald `#2E9B78` — since the light-mode gold/emerald values lose contrast on a dark background), and **System** (follows the device's own OS-level light/dark setting). Full token values for all four modes live in `000_DESIGN_SYSTEM.md` — use them exactly, don't invent new ones per screen.
- Signature element — "the Ascension Line": a thin gold vertical rail that fills upward as progress is made, literally a stylized elevator floor-indicator. Use it for every stage-based UI in the app: CRM pipeline, installation SOP steps, onboarding wizards, training progress, negotiation rounds. This is the one motif that should appear, consistently styled, across the entire app, and it should use the `--color-accent-primary` token so it looks correct in every theme mode automatically.
- Motion: subtle and purposeful only — a completed Ascension Line step gets a brief warm glow, cards fade-and-rise on load. No bouncy/spring physics; this is a premium, safety-adjacent brand, not a playful consumer app.
- Voice: confident, clear, warm but not casual, in whichever of the three languages is active. Save exclamation marks for genuine celebratory moments (a deal won, a badge earned).

**Layout-specific guidance for this screen (layout pattern: list):** Establish one consistent row anatomy (leading icon or avatar, primary line, secondary line, trailing status/value) and repeat it exactly across every row so the list reads instantly once learned. Sticky search/filter bar pinned above the scrolling content. Support swipe actions on mobile where a natural quick action exists (e.g., swipe to call, swipe to reassign). Design the empty state (zero results, zero data yet) with the same care as a populated list — a clear icon, one calm sentence, and a next action, never just blank space. Use skeleton row placeholders while loading, and paginate or virtualize any list that could realistically grow large.

### This screen is done when:
- [ ] Every legal template used anywhere in the app is centrally organized, versioned, and correctly synchronized with the screens that actually generate documents from it
- [ ] State-specific legal content can be cleanly extended as the business expands geographically
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Legal/Contract Templates Repository Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
