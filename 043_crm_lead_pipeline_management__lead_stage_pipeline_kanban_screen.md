# Prompt 043 of 200 — Lead Stage Pipeline (Kanban) Screen
**Module 5 of 20: CRM — Lead & Pipeline Management** · Screen 3 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 042 (Lead Detail & Timeline Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Where a captured lead becomes a managed opportunity: the stage-based backbone that everything from communication to quotation reads and writes to. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Lead Stage Pipeline (Kanban) Screen** screen, used by: **Admin, Sales**.

### Functional requirements
- Classic drag-and-drop Kanban board with columns for each pipeline stage (New, Contacted, Site Revisited, Quoted, Negotiating, Won, Lost)
- Each card shows building name, contact, days-in-stage, and a small thumbnail from the original survey photos
- Column header shows count and total estimated value of leads in that stage
- Drag a card between columns to change stage, triggering any stage-specific automation instantly

### Data this screen touches
- `lead_id`
- `stage_column`
- `days_in_current_stage`
- `card_estimated_value`
- `column_order_position`

### Business logic & automation rules
- Dragging a card to a new stage is equivalent to editing the lead's stage field directly — there is no separate 'confirm' step, keeping the interaction fast for a busy sales operator
- Certain stage transitions trigger mandatory automation (e.g., moving to 'Quoted' requires a linked quotation to exist, prompting the quotation flow if one doesn't) rather than allowing an inconsistent state
- Cards visually age (a subtle color shift) the longer they sit in a stage past a configurable healthy threshold, surfacing stalled deals without a separate report

### Edge cases & validation to handle
- User tries to drag a card to 'Won' without a signed contract on file: block with a clear message rather than allowing an inconsistent state that breaks downstream Payment logic
- Very large number of cards in one column: switch to a scrollable, count-summarized view rather than degrading board performance
- Two sales users drag the same card in different directions near-simultaneously: last valid drop wins, with the other user notified their action didn't apply

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

**Layout-specific guidance for this screen (layout pattern: kanban):** On mobile, do not attempt to cram a multi-column desktop board into a narrow viewport — show one column at a time, full-width, with a horizontal swipe or tab strip to move between stage columns, and a small counter showing position (e.g., "Stage 3 of 6"). Each card shows its most decision-relevant facts only (not everything about the record). Column headers always show both a count and, where relevant, a total value. Drag-and-drop (on wider/tablet viewports where a multi-column view is shown) needs generous touch-friendly drag handles and a clear visual drop-target highlight.

### This screen is done when:
- [ ] Moving a deal forward is as fast as a single drag gesture
- [ ] The board can never enter a state where a card's stage contradicts data required for that stage
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Lead Stage Pipeline (Kanban) Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
