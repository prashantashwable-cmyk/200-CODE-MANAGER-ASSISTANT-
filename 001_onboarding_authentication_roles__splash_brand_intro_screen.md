# Prompt 001 of 200 — Splash / Brand Intro Screen
**Module 1 of 20: Onboarding, Authentication & Roles** · Screen 1 of 10 in this module

*Paste this into your AI Studio Build chat right after your initial Foundation prompt (see `000_FIRST_BUILD_FOUNDATION_PROMPT.md`) is built and working. This is the very first follow-up prompt in the 200-screen sequence — see `000_README.md` for how this whole set fits together.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Every person who touches AIEC — admin, surveyor, technician, customer, supplier — enters through this module. It must feel instant for a demo visitor and airtight for a real field worker handling GPS and photo permissions. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Splash / Brand Intro Screen** screen, used by: **All roles**.

### Functional requirements
- Animated AIEC wordmark reveal using the gold ascension-line signature motif (a thin line drawing itself upward, echoing a lift traveling floors)
- Tagline and owner credit line (Mr. Prashant Vasant Wable, Founder) fade in beneath the logo
- Auto-checks for an existing session token in the background while the animation plays, so there is zero dead wait time
- Auto-routes to the correct role home if a valid session exists, or to the Login screen if not

### Data this screen touches
- `session_token`
- `last_role_used`
- `device_id`
- `app_version`
- `first_launch_flag`

### Business logic & automation rules
- If first_launch_flag is true, show a 3-card value-prop carousel (Survey → Sell → Install → Get Paid) before Login, then never show it again
- If a session token exists but is expired or invalid, clear it silently and route to Login without an error dialog
- Log a launch analytics event with device type and role before navigating away

### Edge cases & validation to handle
- No network on cold start: show the splash and cached branding only, never block navigation waiting on an API call
- Corrupted or tampered local session token: clear it and fail safely to Login
- App was updated since last open: show a single-dismiss 'What's new' sheet after splash, not before

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

**Layout-specific guidance for this screen (layout pattern: auth):** This is an authentication/entry screen — keep it the calmest, least busy screen in the app. Full-bleed Alabaster White background, the AIEC wordmark and Ascension Line motif as the visual anchor, generous white space around a small number of elements. Minimum number of fields visible at once. Primary action button anchored to the bottom of the screen (thumb-reachable), full-width, Antique Gold fill. If there's an OTP input, use 6 separate auto-advancing boxes, not one text field. Avoid anything that feels like a form here — auth should feel like a calm doorway, not paperwork.

### This screen is done when:
- [ ] Splash never holds the screen for more than 3 seconds even fully offline
- [ ] A returning, already-logged-in user reaches their role home screen with zero taps
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Splash / Brand Intro Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
