# Prompt 105 of 200 — Delivery Delay Alert & Escalation Screen
**Module 11 of 20: Material Logistics & Delivery** · Screen 5 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 104 (Material Received Confirmation (photo/signature) Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Once a supplier ships, the brief calls for tracked, SOP-governed delivery to site — this module is the physical bridge between a Purchase Order and a technician who can actually start installing. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Delivery Delay Alert & Escalation Screen** screen, used by: **Admin**.

### Functional requirements
- Queue of shipments trending toward or already past their expected delivery date, ranked by how customer-impactful the delay is (e.g., a delay on a deal with an already-committed installation date is more urgent than one with flexible timing)
- One-tap actions: contact supplier, proactively notify the affected customer with an honest updated timeline, or escalate to Admin's own direct supplier relationship management
- Root-cause tagging (supplier production delay, logistics/transit issue, customs/documentation for imported components) feeding back into Supplier Performance analytics
- Direct link to the relevant Supplier Communication Thread for immediate follow-up

### Data this screen touches
- `po_id`
- `delay_severity`
- `expected_vs_current_eta_gap`
- `root_cause_tag`
- `customer_notified_flag`

### Business logic & automation rules
- This screen is the delivery-specific instance of the same proactive-exception philosophy used in the Automation Health Monitor and Alerts & Exceptions Dashboard — problems are surfaced before a customer has to complain, not after
- Proactively notifying a customer about a delay (with an honest, specific updated timeline) is treated as a deliberately positive action supporting the premium brand's trustworthiness, not merely a defensive compliance step
- Root-cause tagging feeds directly and specifically into the same Supplier Performance Scorecard fields used in Admin's supplier-management decisions, so a delay's true cause is properly attributed rather than blending into a generic 'was late' statistic

### Edge cases & validation to handle
- A delay is caused by something entirely outside the supplier's control (e.g., a regional flood disrupting all logistics): tag as an external factor rather than penalizing the specific supplier's own performance score unfairly for a shared, external disruption
- Multiple POs across different customers are delayed by the same root cause simultaneously: support batch-handling (e.g., one proactive customer-communication broadcast referencing the shared cause) rather than requiring the same manual work repeated per affected customer
- A delay resolves itself before Admin gets to act on the alert (supplier catches up faster than expected): auto-clear the alert and reflect the good news, rather than leaving a stale delay warning visible after the fact

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
- [ ] Customers are proactively informed of real delays before they have to ask, protecting trust in the premium brand
- [ ] Root causes are attributed fairly and specifically enough to genuinely improve future supplier selection decisions
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Delivery Delay Alert & Escalation Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
