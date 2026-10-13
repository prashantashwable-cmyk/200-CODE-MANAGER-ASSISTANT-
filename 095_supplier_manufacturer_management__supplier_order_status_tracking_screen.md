# Prompt 095 of 200 — Supplier Order Status Tracking Screen
**Module 10 of 20: Supplier & Manufacturer Management** · Screen 5 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 094 (Auto-PO Trigger Rules Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The asset-light aggregator core: once a deal closes, parts must flow from real suppliers under real commercial terms, with AIEC as orchestrator rather than owner. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Supplier Order Status Tracking Screen** screen, used by: **Admin, Supplier**.

### Functional requirements
- Kanban-style board of every PO's status: Sent, Acknowledged, In Production, Ready to Ship, Shipped, Delivered — visible to both AIEC Admin and the relevant supplier
- Supplier can update their own PO's status directly (acknowledge, mark in production, mark ready) rather than Admin having to chase updates by phone
- Expected vs. actual delivery date comparison, visually flagging any PO trending toward a delay
- Direct link into the Material Logistics & Delivery module once a PO reaches Shipped

### Data this screen touches
- `po_id`
- `order_status`
- `expected_delivery_date`
- `actual_status_update_timestamp`
- `delay_risk_flag`

### Business logic & automation rules
- This screen's status is the same status shown to Admin in the Material Logistics module's delivery scheduling and tracking screens later — a PO has one true status, viewed from two different functional contexts
- A supplier updating their own PO status directly is a deliberate design choice supporting the aggregator/asset-light model: AIEC orchestrates and monitors rather than manually chasing every update by phone
- delay_risk_flag is computed automatically by comparing time-elapsed-in-current-status against that supplier's own historical typical timing for the same status, personalizing the flag rather than using one generic threshold for every supplier

### Edge cases & validation to handle
- Supplier fails to update status for an extended period even though the order is clearly progressing (e.g., a supplier less comfortable with the digital tool): allow Admin to manually update status on the supplier's behalf, with a note, rather than the record silently going stale
- A PO's status needs to move backward (e.g., a quality issue found in production requires rework, moving from 'Ready to Ship' back to 'In Production'): support this rather than forcing only forward-only transitions
- Multiple line items within one PO are at different actual stages (partial shipment): support per-line-item status granularity where the PO has multiple distinct components

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
- [ ] Admin always knows the real status of every ordered part without needing to phone a supplier for an update
- [ ] Delay risk is flagged proactively based on real historical patterns per supplier, not a one-size-fits-all guess
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Supplier Order Status Tracking Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
