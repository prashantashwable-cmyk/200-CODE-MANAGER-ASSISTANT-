# Prompt 110 of 200 — Delivery Analytics Screen
**Module 11 of 20: Material Logistics & Delivery** · Screen 10 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 109 (Delivery Partner Management Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Once a supplier ships, the brief calls for tracked, SOP-governed delivery to site — this module is the physical bridge between a Purchase Order and a technician who can actually start installing. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Delivery Analytics Screen** screen, used by: **Admin**.

### Functional requirements
- On-time delivery rate trend over time, broken down by supplier and by delivery partner
- Average transit time by region, useful for realistic customer timeline-setting during the sales/quotation stage
- Discrepancy/damage rate trend, flagging if it's rising for any specific supplier or component category
- Cost of delivery-related issues (rework, replacement parts, schedule-impact costs) aggregated for a true picture of logistics-related risk

### Data this screen touches
- `metric_name`
- `supplier_or_partner_id`
- `period`
- `metric_value`
- `trend_direction`

### Business logic & automation rules
- This screen synthesizes data already captured in the Site Delivery Checklist, Damaged/Missing Parts Reports, and Delivery Delay Alerts into trend-level insight, rather than maintaining any separately entered analytics data
- Average transit time by region feeds back usefully into how realistic timelines are set during the sales process (Deal Closure's 'next steps' timeline estimate), closing the loop between operational reality and customer-facing promises
- This is one of several analytics screens Admin uses specifically to make the periodic sourcing and process decisions (which suppliers to favor, which SOP steps to tighten) that keep the 'zero risk model' genuinely improving over time rather than static

### Edge cases & validation to handle
- A brand-new delivery lane/region has too little history for a meaningful transit-time average: show it honestly as emerging data rather than a falsely precise number
- A single catastrophic regional event distorts a period's delay statistics broadly across many suppliers at once: annotate known macro disruptions so the trend isn't misread as a systemic AIEC process failure when it was an external event
- Cost-of-issues aggregation needs to avoid double-counting when one discrepancy report already contributed to a supplier's payment retention adjustment elsewhere: ensure the underlying data model attributes cost impact exactly once per incident

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

**Layout-specific guidance for this screen (layout pattern: dashboard):** Card-based grid: 2 columns on mobile, 3-4 on wider viewports. Give the single most important figure top-left reading position. Every KPI card follows the same anatomy — small label, large "Fraunces" or "IBM Plex Mono" number, small trend arrow with percentage — so the eye learns the pattern once and reads every card instantly thereafter. Every card should feel tappable (subtle shadow lift on press) and lead somewhere more detailed. Use skeleton-loading placeholders matching each card's real shape while data loads, never a blank space or a lone centered spinner. Support pull-to-refresh on mobile.

### This screen is done when:
- [ ] Admin can make sourcing and process improvement decisions grounded in real delivery performance trends
- [ ] Customer-facing timeline promises can be realistically calibrated against actual historical transit performance
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Delivery Analytics Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.

---

## Module 11 Checkpoint — before you start the next module

You've now finished all 10 screens in **Module 11: Material Logistics & Delivery**. Before moving on to Module 12:

1. Click through every screen you just built in this module, start to finish, once, as if you were the actual user.
2. Spot-check 2-3 of the most important screens from earlier modules — you don't need to re-test everything back to Prompt 001, just confirm nothing visibly broke.
3. If anything looks wrong, send one more small, targeted prompt to fix it now. Don't carry a visible bug forward into the next module — regressions compound, and they're far cheaper to fix the moment you spot them than 50 screens later.
4. Optional but recommended: this is a natural point to download a ZIP backup or note your current AI Studio checkpoint/version, so you always have a known-good rollback point behind you.

This costs about two minutes and saves far more than that in confused debugging later.
