# Prompt 183 of 200 — Notification Templates & Channels Screen
**Module 19 of 20: Automation Rules & Notification Engine** · Screen 3 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 182 (Workflow Trigger Builder Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The connective tissue implementing 'fully automated, only monitor by one person' as an actual configurable system rather than a marketing phrase. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Notification Templates & Channels Screen** screen, used by: **Admin**.

### Functional requirements
- Central configuration of every internal (Admin/staff-facing) notification type — new lead alert, SOS alert, payout failure, delivery delay — separate from the customer-facing Communication Templates Library, since internal operational notifications serve a different purpose and audience
- Channel configuration per notification type (in-app push, SMS, email) and per recipient role
- Priority/urgency tagging affecting delivery method (e.g., a Critical alert might use every available channel simultaneously, while a routine update uses only in-app)
- Test-send capability to verify a notification renders and delivers correctly before relying on it in production

### Data this screen touches
- `notification_type_id`
- `recipient_roles[]`
- `channel_configuration`
- `urgency_tag`
- `template_content`

### Business logic & automation rules
- This is deliberately the internal, staff-facing counterpart to the customer-facing Communication Templates Library — the two are kept structurally distinct because internal operational alerts (like an SOS or a payout failure) and external customer communications (like a payment reminder) serve fundamentally different purposes and shouldn't share the same governance or accidentally cross-contaminate audiences
- Urgency tagging here directly determines the actual delivery behavior for critical internal alerts like the Emergency/Escalation Alert screen's SOS notifications, ensuring the most important internal alerts genuinely reach Admin through every available channel rather than relying on just one that might be missed
- This screen is a foundational configuration layer read by many other screens throughout the app that need to notify Admin or staff of something (delay alerts, payout failures, verification flags), keeping notification behavior centrally governed rather than each module inventing its own ad hoc notification logic

### Edge cases & validation to handle
- A Critical-urgency notification type is configured to use every channel, but this risks alert fatigue if it's actually triggered too frequently: surface trigger-frequency data alongside the configuration so Admin can make an informed judgment about whether a notification's urgency tagging still matches its real-world frequency and importance
- A new recipient role is added to the system as the business grows (e.g., a future 'Team Lead' role beyond the current Admin-only monitoring model): ensure the channel/role configuration structure can accommodate new roles without requiring a fundamental redesign
- Test-send reveals a rendering issue on a specific channel (e.g., a template too long for SMS): catch this proactively through the test capability rather than discovering it only when a real critical alert fails to render properly in production

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
- [ ] Every internal operational alert reaches the right person through the right channel with appropriately calibrated urgency
- [ ] Internal staff notifications remain structurally and governance-wise separate from customer-facing communications
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Notification Templates & Channels Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
