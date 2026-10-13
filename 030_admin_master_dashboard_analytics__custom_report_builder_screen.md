# Prompt 030 of 200 — Custom Report Builder Screen
**Module 3 of 20: Admin Master Dashboard & Analytics** · Screen 10 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 029 (Alerts & Exceptions Dashboard) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The strategic view: where the single monitoring person checks whether the whole automated business is actually healthy, profitable, and low-risk. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Custom Report Builder Screen** screen, used by: **Admin**.

### Functional requirements
- Pick-a-metric, pick-a-dimension, pick-a-date-range builder for ad hoc reports beyond the standard dashboards
- Live preview chart/table as selections are made
- Save report configuration for reuse, and schedule it to auto-generate and email/WhatsApp on a recurring basis
- Export to PDF or spreadsheet

### Data this screen touches
- `report_name`
- `selected_metrics[]`
- `selected_dimensions[]`
- `date_range`
- `schedule_frequency`

### Business logic & automation rules
- Available metrics and dimensions are pulled from the same governed data model as every other analytics screen, so a custom report can never show a number that contradicts the standard dashboards
- Scheduled reports run as a background job and delivery failure (e.g., bad email) surfaces as its own exception in the Alerts & Exceptions Dashboard
- Saved reports are personal by default but can be explicitly shared with other Admin-level accounts if the business grows beyond one monitor

### Edge cases & validation to handle
- User selects an incompatible metric/dimension combination (e.g., a technician-only metric sliced by supplier): show a clear compatibility message rather than a broken chart
- A scheduled report's date range logic (e.g., 'last 7 days') must roll forward correctly each time it runs, not freeze to the date it was created
- Extremely wide report (many metrics × many dimensions): warn about performance/readability before generating rather than after

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
- [ ] Admin can answer a one-off business question without waiting on custom development
- [ ] A scheduled report reliably arrives on time, every time, or its failure is visibly flagged
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Custom Report Builder Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.

---

## Module 3 Checkpoint — before you start the next module

You've now finished all 10 screens in **Module 3: Admin Master Dashboard & Analytics**. Before moving on to Module 4:

1. Click through every screen you just built in this module, start to finish, once, as if you were the actual user.
2. Spot-check 2-3 of the most important screens from earlier modules — you don't need to re-test everything back to Prompt 001, just confirm nothing visibly broke.
3. If anything looks wrong, send one more small, targeted prompt to fix it now. Don't carry a visible bug forward into the next module — regressions compound, and they're far cheaper to fix the moment you spot them than 50 screens later.
4. Optional but recommended: this is a natural point to download a ZIP backup or note your current AI Studio checkpoint/version, so you always have a known-good rollback point behind you.

This costs about two minutes and saves far more than that in confused debugging later.
