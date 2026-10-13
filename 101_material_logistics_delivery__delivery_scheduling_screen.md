# Prompt 101 of 200 — Delivery Scheduling Screen
**Module 11 of 20: Material Logistics & Delivery** · Screen 1 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 100 (Supplier Payment Terms Configuration Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Once a supplier ships, the brief calls for tracked, SOP-governed delivery to site — this module is the physical bridge between a Purchase Order and a technician who can actually start installing. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Delivery Scheduling Screen** screen, used by: **Admin, Supplier**.

### Functional requirements
- Calendar view for scheduling a confirmed delivery window per PO, coordinated between the supplier's dispatch capability and the site's readiness (e.g., civil work/shaft prep confirmed complete)
- Site-readiness checklist gate that must be confirmed before a delivery date can be locked in, avoiding a wasted trip to an unprepared site
- Automatic notification to the assigned technician once a delivery date is confirmed, so installation scheduling can align
- Reschedule flow with reason logging if either side needs to shift the date

### Data this screen touches
- `po_id`
- `scheduled_delivery_date`
- `site_readiness_confirmed_flag`
- `delivery_time_window`
- `rescheduled_reason`

### Business logic & automation rules
- A delivery cannot be scheduled until site_readiness_confirmed_flag is true, structurally preventing the common real-world failure mode of a shipment arriving at a site with no completed shaft to receive it
- Confirming a delivery date here is what actually creates the technician's job entry in the Installation module's scheduling, keeping the two modules in lockstep rather than requiring separate manual coordination
- Rescheduling always requires a reason, both to keep the customer's expectations screen accurate and to feed delay-pattern data back into the Supplier Performance Scorecard where the delay originated on the supplier's side

### Edge cases & validation to handle
- Site readiness is confirmed but then discovered inaccurate once the delivery truck arrives (a real-world site coordination gap): support a same-day 'delivery attempted but site not actually ready' outcome that's clearly distinct from a simple reschedule for planning purposes
- Multiple POs for the same customer deal need coordinated, sequenced delivery (e.g., cabin components before drive unit): support dependency ordering between related POs' delivery schedules
- Supplier's own capacity means the requested date isn't available: show real supplier-provided available windows rather than allowing Admin to schedule a date the supplier can't actually meet

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

**Layout-specific guidance for this screen (layout pattern: calendar):** Provide Month / Week / Agenda view toggle, defaulting to whichever view suits the screen's typical task (Agenda for a task list, Week for active scheduling). Color-code event/entry types using the same palette used for status elsewhere in the app (so a color a user has already learned means the same thing here). On mobile, tapping a date shows that day's agenda in a panel below the calendar rather than a cramped inline popover balanced awkwardly over a small calendar grid.

### This screen is done when:
- [ ] No delivery is ever scheduled to an unprepared site
- [ ] Confirming a delivery date reliably and immediately sets up the corresponding installation job
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Delivery Scheduling Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
