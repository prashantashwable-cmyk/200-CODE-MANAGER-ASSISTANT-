# Prompt 075 of 200 — Digital Contract Generator Screen
**Module 8 of 20: Negotiation & Deal Closing** · Screen 5 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 074 (Deal Terms Finalization Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Where the brief's 'auto-negotiate with customer and make deal automatically' becomes real: a bounded, monitored bot backed by a human escalation path and a clean contract close. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Digital Contract Generator Screen** screen, used by: **Admin, Customer**.

### Functional requirements
- Auto-generates a legally structured contract document from the finalized deal terms, AIEC's standard terms, and any state-specific Lift Act clauses relevant to the customer's location
- Clause-by-clause plain-language summary alongside the full legal text, so the customer genuinely understands what they're signing, not just a wall of legalese
- Version-locked once generated — any change requires regenerating from an updated Deal Terms Finalization, never manual editing of the contract text directly
- Direct handoff into the E-Signature Capture screen

### Data this screen touches
- `contract_id`
- `linked_deal_id`
- `contract_document_url`
- `plain_language_summary`
- `generation_timestamp`

### Business logic & automation rules
- State-specific clauses (referencing the applicable State Lift Act and BIS standards like IS 14665) are selected automatically based on the customer's site address, since lift regulation in India is state-specific rather than governed by one central law
- This document is the formal instrument that operationalizes the brief's 'no-liability' model — it must clearly and correctly assign installation, safety-compliance, and warranty responsibilities between AIEC, the technician/installer, and the manufacturer/supplier
- Contract generation is blocked if the underlying deal isn't in a fully confirmed state from the Deal Terms Finalization screen, preventing a contract from ever representing unconfirmed terms

### Edge cases & validation to handle
- Customer's state has no specific Lift Act clause template configured yet (a newly-entered state for the business): fall back to the National Building Code / BIS-standard default language and flag for Admin to add a state-specific clause set
- A contract needs a genuinely custom clause (e.g., a large commercial client's own procurement terms): support an Admin-reviewed custom addendum attached to, rather than replacing, the standard generated contract
- Contract generated but the deal terms are later validly amended before signature: regenerate a new contract version and clearly supersede the prior draft, never leave two valid-looking drafts in circulation

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

**Layout-specific guidance for this screen (layout pattern: detail):** Lead with a hero header carrying the record's key identifying information (name, status badge, one or two headline stats). Break dense content into clear sections — tabs for genuinely separate categories of information, simple stacked sections with headers when the content is more linear. Any history/timeline section within a detail screen uses the vertical Ascension Line motif. Keep one clear primary action reachable via a sticky bottom bar or a prominent header button; secondary actions live in an overflow menu rather than competing visually with the primary one.

### This screen is done when:
- [ ] Every contract correctly reflects both the specific deal and the applicable state's lift regulations
- [ ] Liability and responsibility are unambiguous for every party once the contract is generated
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Digital Contract Generator Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
