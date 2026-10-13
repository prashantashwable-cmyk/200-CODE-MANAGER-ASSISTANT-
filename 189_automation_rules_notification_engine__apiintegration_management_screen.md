# Prompt 189 of 200 — API/Integration Management Screen
**Module 19 of 20: Automation Rules & Notification Engine** · Screen 9 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 188 (Manual Override Console Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The connective tissue implementing 'fully automated, only monitor by one person' as an actual configurable system rather than a marketing phrase. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **API/Integration Management Screen** screen, used by: **Admin**.

### Functional requirements
- Configuration and credential management for every external integration the app depends on: payment gateway, WhatsApp Business API, SMS provider, Google Maps, financing partner, banking/disbursement rails
- Connection status and last-successful-sync timestamp per integration
- Credential rotation/update capability with appropriate security handling (never displaying a full stored secret, only masked)
- Sandbox/test mode toggle per integration for safely testing changes before they affect real production data

### Data this screen touches
- `integration_name`
- `connection_status`
- `last_sync_timestamp`
- `credential_last_rotated`
- `sandbox_mode_enabled`

### Business logic & automation rules
- This is the actual configuration root for every external dependency referenced throughout the app's various modules (the Google Maps AI Chip powering live tracking, the WhatsApp Business API powering the Communication Engine, the payment gateway powering Checkout) — one governed place for connection management rather than credentials or configuration scattered implicitly across many different screens
- Credential masking and secure rotation handling reflects genuine production-grade security practice appropriate to the 'enterprise-grade' standard the brief explicitly demands, especially given this app handles real financial transactions and personal data
- Sandbox mode support is particularly important given the app's own Demo Mode concept established at Login — this screen is where Admin would configure and verify that Demo Mode's sandboxed behavior is genuinely isolated from real production integrations, reinforcing that separation at the technical/configuration level, not just the UI level

### Edge cases & validation to handle
- A credential rotation is performed but not immediately reflected correctly across every part of the app that uses that integration (a caching or propagation delay): ensure a clear 'rotation in progress, some services may briefly reconnect' status rather than a confusing scattered failure across the app during the transition
- An integration's connection silently degrades in a way that isn't a full outage (e.g., intermittent timeouts): ensure the health status reflects this nuance rather than only a binary connected/disconnected state, consistent with the 'Degraded' status concept already established in the Automation Health Monitor
- Sandbox mode is accidentally left enabled for a specific integration in what should be the live production environment: provide a clear, hard-to-miss visual indicator whenever any integration is in sandbox mode, preventing the serious mistake of real customers being served by a test configuration

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

**Layout-specific guidance for this screen (layout pattern: settings):** Group related settings under clear section headers with generous spacing between groups — settings screens fail when everything looks like one undifferentiated list. Toggle switches right-aligned and consistently sized. Always show the current value next to a setting's name (e.g., "Reminder cadence: 3 days before due") rather than hiding it until tapped into a sub-screen. Any destructive or high-consequence action (deactivating a partner, changing a margin floor, revoking a session) gets distinct visual treatment (e.g., Error Red text or icon) and a confirmation step — never sits visually identical to a routine, reversible setting.

### This screen is done when:
- [ ] Every external integration's connection and credentials are centrally, securely managed
- [ ] It is structurally very hard to accidentally serve real customers through a sandbox/test configuration
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the API/Integration Management Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
