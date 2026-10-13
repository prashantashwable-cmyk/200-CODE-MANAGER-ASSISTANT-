# Prompt 195 of 200 — Security & Session Management Screen
**Module 20 of 20: Settings, Security, Compliance & Super Admin** · Screen 5 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 194 (Data Privacy & Consent Management Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The governance layer underneath everything else: branding, permissions, data privacy, and the master control panel befitting a single, trusted monitor of an enterprise-grade system. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Security & Session Management Screen** screen, used by: **Admin**.

### Functional requirements
- Two-factor authentication configuration and enforcement policy per role (e.g., mandatory 2FA for Admin given the sensitivity of that access level)
- Active session/device list per account with the ability to remotely revoke a specific session (e.g., if a partner's phone is lost or stolen)
- Login attempt and security-event log (failed logins, unusual-location login attempts) for genuine security monitoring
- Password/authentication policy configuration (minimum complexity, mandatory rotation period if desired)

### Data this screen touches
- `account_id`
- `active_sessions[]`
- `2fa_enabled_status`
- `recent_security_events[]`
- `password_policy_config`

### Business logic & automation rules
- This screen is the security-governance counterpart to the Permission Management screen — that screen governs what an authenticated user can do, this screen governs the integrity of authentication itself, together forming the complete access-control picture appropriate for an 'enterprise-grade' system genuinely handling sensitive financial and personal data
- Remote session revocation directly connects to real-world field-workforce risk scenarios (a lost or stolen phone belonging to a surveyor or technician who has access to real customer and location data) — this isn't a theoretical feature, it's a practical necessity given the field-based, device-dependent nature of much of this workforce
- Security event logging feeds into the same Alerts & Exceptions philosophy used throughout the app — a suspicious pattern of failed logins or an unusual-location access attempt deserves the same kind of proactive surfacing as any other business-risk exception

### Edge cases & validation to handle
- A legitimate user triggers a false-positive unusual-location flag (e.g., genuinely traveling for a valid business reason): ensure the flagging system supports easy legitimate confirmation rather than an overly aggressive lockout that frustrates genuine use
- A lost/stolen device's session is revoked, but the affected partner then can't easily re-authenticate on a new device (e.g., their phone number/SIM was also lost): ensure a reasonable, secure account-recovery path exists distinct from the standard Forgot Password flow, appropriate to this more serious scenario
- Mandatory 2FA policy is configured for a role, but a specific individual has a genuine difficulty complying (e.g., no secondary device): provide a documented, Admin-reviewable exception path rather than either an inflexible policy that blocks a legitimate worker or silently allowing 2FA to be bypassed without any record

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
- [ ] Sensitive access, especially Admin-level, is protected by real, enforced security measures appropriate to the data at stake
- [ ] A lost or compromised field-worker device can be quickly and effectively contained without leaving the affected partner permanently locked out
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Security & Session Management Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
