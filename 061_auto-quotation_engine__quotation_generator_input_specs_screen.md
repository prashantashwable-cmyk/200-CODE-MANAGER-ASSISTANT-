# Prompt 061 of 200 — Quotation Generator — Input Specs Screen
**Module 7 of 20: Auto-Quotation Engine** · Screen 1 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 060 (Communication Analytics Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Turns a surveyed building into a priced, branded, sendable quote automatically — grounded in real elevator cost structure (drive type, floors, GST, AMC) rather than generic placeholder numbers. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Quotation Generator — Input Specs Screen** screen, used by: **Admin, Sales**.

### Functional requirements
- Pre-fills every field it can from the linked lead's building specification (floors, usage type, shaft estimate) captured by the surveyor, minimizing manual re-entry
- Elevator configuration picker: drive type (hydraulic, geared/gearless traction, MRL, vacuum/pneumatic, screw-driven), capacity (persons/kg), cabin finish tier (Standard, Premium, Luxury)
- Number-of-stops and travel-height fields, auto-suggested from floor count but always editable since the surveyor's estimate may need refinement
- 'Generate Quote' action that hands off directly into the Cost Breakdown & Profit Margin screen

### Data this screen touches
- `linked_lead_id`
- `drive_type`
- `capacity_persons_or_kg`
- `stops_count`
- `finish_tier`

### Business logic & automation rules
- Drive-type selection changes which downstream cost components apply (e.g., a hydraulic system has different civil/pit requirements than an MRL system), so the pricing engine branches its calculation based on this field rather than using one flat formula for every technology
- Every field pre-filled from the lead is clearly marked as editable-and-sourced-from-survey, so Sales always knows what's an estimate versus a confirmed spec
- This screen cannot be marked complete without a drive type and capacity selected, since both are required inputs for the cost engine downstream

### Edge cases & validation to handle
- Linked lead's floor count was only an estimate at survey time and the actual requirement differs once finalized: allow override here with a note explaining the change, rather than forcing a return trip to re-survey for a minor mismatch
- Building type calls for a configuration outside the standard presets (e.g., a stretcher/hospital lift for a building over 30 meters, per applicable fire-safety guidance): provide a 'custom configuration' path that routes to manual Admin pricing rather than forcing an ill-fitting standard preset
- Very high floor count (20+) outside the typical residential scope: flag for a specialized quotation review rather than the standard auto-quotation flow

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

**Layout-specific guidance for this screen (layout pattern: wizard):** Use a horizontal Ascension Line step indicator across the top — each step is a node that lights gold on completion. Show one logical group of fields per step; never cram multiple unrelated decisions into a single step. Back and Next are always visible; allow jumping back to any completed step without discarding progress on later ones. End with a clean review step summarizing every prior step's entries in one glance before final submission, so the user never submits blind. Draft-saves at every step boundary for resilience against interruption.

### This screen is done when:
- [ ] A sales user can go from an existing lead to a fully specified elevator configuration in under two minutes
- [ ] No quote can be generated with an ambiguous or missing drive type
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Quotation Generator — Input Specs Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
