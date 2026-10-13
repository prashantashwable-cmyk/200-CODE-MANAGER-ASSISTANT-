# Prompt 193 of 200 — Single-Person Monitor Control Panel
**Module 20 of 20: Settings, Security, Compliance & Super Admin** · Screen 3 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 192 (User & Role Permission Management Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The governance layer underneath everything else: branding, permissions, data privacy, and the master control panel befitting a single, trusted monitor of an enterprise-grade system. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Single-Person Monitor Control Panel** screen, used by: **Admin**.

### Functional requirements
- The literal master overview screen embodying the brief's core 'run by system, monitor by one person' principle: a synthesized top-level view combining the most critical signals from every other dashboard in the app (business health, automation health, financial health, workforce health, any Critical alerts) into one true morning-check screen
- Configurable to show exactly the handful of signals this specific Admin cares most about checking daily, since different business phases might warrant different priority signals
- One-tap 'everything's fine' acknowledgment to log that a monitoring check was performed, useful for the Admin's own discipline and, if the business ever grows, for demonstrating consistent oversight practice
- Direct drill-through from any summarized signal into its full dedicated screen for deeper investigation

### Data this screen touches
- `admin_id`
- `configured_signal_set[]`
- `last_check_timestamp`
- `current_signal_snapshot`
- `any_critical_flag`

### Business logic & automation rules
- This screen is deliberately the literal, direct technical realization of the brief's central, most-repeated business principle — 'system runs the business, one person monitors' — synthesizing the Executive KPI Dashboard, Automation Health Monitor, Alerts & Exceptions Dashboard, and Financial Overview's most critical individual signals into the single screen this one person would realistically open every single morning
- Configurability of which signals appear here respects that what matters most to check daily will reasonably evolve as the business matures (e.g., early-stage focus on lead volume and conversion, later-stage focus more on retention and AMC health), without requiring a fixed, one-size-fits-all set of metrics forever
- This screen's own existence is essentially the answer to 'how would Admin actually use this enterprise-grade, production-ready system day to day' — it is the front door to the entire monitoring experience the whole app's automation is designed to make possible

### Edge cases & validation to handle
- All configured signals show healthy, but Admin has independent knowledge of a real concern not reflected in any current metric (e.g., informal feedback from a key customer): this control panel is a powerful aggregation tool, not a replacement for Admin's own broader judgment, and should never be presented as a complete substitute for genuine oversight
- Admin is away (vacation, illness) for an extended period: consider whether a designated backup viewer (connecting to the Escalation Matrix's backup-contact concept) should have appropriate limited visibility into this panel during the primary Admin's absence, given the real operational risk of a true single point of failure
- Business genuinely grows to need more than one active monitor: ensure this panel's design doesn't assume literally only one person will ever use it, supporting a reasonable evolution to a small monitoring team without a fundamental redesign

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
- [ ] A single Admin can genuinely assess the entire business's health in one screen, once daily, as the brief's core operating model intends
- [ ] The panel remains a powerful aggregation tool without ever pretending to replace genuine human judgment and broader awareness
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Single-Person Monitor Control Panel screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
