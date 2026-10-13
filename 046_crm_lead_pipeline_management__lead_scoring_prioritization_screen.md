# Prompt 046 of 200 — Lead Scoring & Prioritization Screen
**Module 5 of 20: CRM — Lead & Pipeline Management** · Screen 6 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 045 (Duplicate Lead Merge/Resolution Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Where a captured lead becomes a managed opportunity: the stage-based backbone that everything from communication to quotation reads and writes to. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Lead Scoring & Prioritization Screen** screen, used by: **Admin, Sales**.

### Functional requirements
- Every lead shown with an automatically computed priority score based on building size, construction stage readiness, contact responsiveness, and territory conversion history
- Sortable list defaulting to highest-priority-first, so sales attention naturally flows to the best opportunities
- Score breakdown expandable per lead, showing exactly which factors contributed, avoiding an opaque black-box number
- Admin-adjustable weighting for each scoring factor

### Data this screen touches
- `lead_id`
- `priority_score`
- `score_factor_breakdown`
- `score_last_computed`
- `weighting_profile`

### Business logic & automation rules
- Score recalculates automatically whenever a contributing factor changes (e.g., construction stage updates, or the contact responds to an outreach), not just on a fixed schedule
- Weighting changes made by Admin apply prospectively to score recalculation, and historical scores shown on past records retain the weighting that was active when they were computed, avoiding confusing retroactive score changes on old records
- This score directly feeds the default sort order of both the Lead Inbox and the Follow-Up Task Scheduler, keeping prioritization consistent across the CRM

### Edge cases & validation to handle
- A lead has incomplete data for one scoring factor (e.g., no responsiveness history yet since it's brand new): handle gracefully with a neutral default rather than a broken calculation or artificially low score
- Two leads score identically: break the tie with recency (newer opportunities surfaced slightly higher) as a sensible default, adjustable by Admin
- Scoring weights are changed dramatically overnight: warn Admin if the change would massively reshuffle the entire active pipeline, as a sanity check before applying

### UI / design requirements
**AIEC Design System — "Alabaster & Ascension" (premium royal-white theme)**
- Palette: Alabaster White #F8F6F1 base, pure White #FFFFFF cards, Charcoal Ink #2A2723 text, Antique Gold #B8873D primary accent, Royal Emerald #0E4B3D secondary accent. Keep Error Red #B23B3B reserved strictly for genuine errors/safety alerts — never decorative.
- Type (Latin/English): "Fraunces" (serif, Google Font) for headings/hero numbers, "Plus Jakarta Sans" (Google Font) for all UI/body text, "IBM Plex Mono" tabular figures for money and KPI numbers.
- Type (Devanagari/Hindi & Marathi): "Fraunces" and "Plus Jakarta Sans" do NOT cover Devanagari glyphs — never let Hindi/Marathi text silently fall back to a generic system font. Pair "Martel" (Google Font) for headings and "Hind" (Google Font) for UI/body text in Hindi or Marathi, matching the same heading/body weight relationship as the Latin pair. Keep IBM Plex Mono for all numerals in every language — India's digital finance UI uses Western digits (0-9) regardless of the surrounding script, so amounts don't need a separate numeral font per language. All user-facing text (labels, buttons, headings, messages, notification templates) must render in the user's selected language (English / Hindi / Marathi) via the app's translation system — never hardcoded in one language.
- Icons: Phosphor Icons or Lucide, thin 1.5px line-weight, rounded caps, tinted Royal Emerald by default and Antique Gold when active/selected.
- Cards: 16-20px corner radius, soft ambient shadow (never a harsh flat drop-shadow), 1px hairline border tinted gold at ~15% opacity.
- Grid: 8pt spacing throughout, mobile-first single column, 16-24px screen margins, sticky bottom action bar for primary CTAs, minimum 48x48px touch targets.
- Theme modes: build every color as a CSS custom property (`--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-accent-primary`, `--color-accent-secondary`, `--color-success`, `--color-warning`, `--color-error`, `--color-border`) — never a hardcoded hex value in a component — so the whole app can switch instantly between 7 modes, stored as the signed-in user's own saved preference: **Light/Alabaster** (default — the warm-ivory palette above), **Snow White** (a crisper, cooler, brighter variant — pure `#FFFFFF` background, near-black `#1F2124` text, tighter shadows), **Dark** (warm near-black `#1A1815` background and `#242019` cards, soft off-white `#F0EDE6` text, brightened gold `#D4A855` and emerald `#2E9B78` accents), **Orbital** (a mission-control mood — deep space-black `#0B0E14` background, monospace telemetry-style labels, a fine dot-grid texture, brightened gold `#D9AE5C` and emerald `#35B48A` accents), **Lithium** (a matte, automotive-dashboard mood — flat near-black `#101012` surfaces, oversized clean numerals, desaturated matte gold `#C99A52` and emerald `#2E8968` accents, almost no shadow), **Pure** (an extreme-minimalist mood — pure white `#FFFFFF` background, hairline dividers instead of shadows, maximum whitespace, the same gold `#B8873D`/emerald `#0E4B3D` as Light mode used far more sparingly), and **System** (follows the device's own OS-level light/dark setting, mapping to Light/Alabaster or Dark). All 7 modes keep the *same* AIEC gold-and-emerald brand identity underneath — only mood, texture, density, and typography change between them, never the core brand colors, so the app never looks like it's borrowed someone else's visual identity. Full token values for all seven modes live in `000_DESIGN_SYSTEM.md` — use them exactly, don't invent new ones per screen.
- Signature element — "the Ascension Line": a thin gold vertical rail that fills upward as progress is made, literally a stylized elevator floor-indicator. Use it for every stage-based UI in the app: CRM pipeline, installation SOP steps, onboarding wizards, training progress, negotiation rounds. This is the one motif that should appear, consistently styled, across the entire app, and it should use the `--color-accent-primary` token so it looks correct in every theme mode automatically.
- Motion: subtle and purposeful only — a completed Ascension Line step gets a brief warm glow, cards fade-and-rise on load. No bouncy/spring physics; this is a premium, safety-adjacent brand, not a playful consumer app.
- Voice: confident, clear, warm but not casual, in whichever of the three languages is active. Save exclamation marks for genuine celebratory moments (a deal won, a badge earned).

**Layout-specific guidance for this screen (layout pattern: list):** Establish one consistent row anatomy (leading icon or avatar, primary line, secondary line, trailing status/value) and repeat it exactly across every row so the list reads instantly once learned. Sticky search/filter bar pinned above the scrolling content. Support swipe actions on mobile where a natural quick action exists (e.g., swipe to call, swipe to reassign). Design the empty state (zero results, zero data yet) with the same care as a populated list — a clear icon, one calm sentence, and a next action, never just blank space. Use skeleton row placeholders while loading, and paginate or virtualize any list that could realistically grow large.

### This screen is done when:
- [ ] Sales attention is naturally drawn to the leads most likely to convert without needing manual triage
- [ ] Every score can be explained in plain language on request
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Lead Scoring & Prioritization Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
