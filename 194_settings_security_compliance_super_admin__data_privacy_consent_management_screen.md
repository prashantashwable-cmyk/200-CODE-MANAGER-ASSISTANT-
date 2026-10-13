# Prompt 194 of 200 — Data Privacy & Consent Management Screen
**Module 20 of 20: Settings, Security, Compliance & Super Admin** · Screen 4 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 193 (Single-Person Monitor Control Panel) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The governance layer underneath everything else: branding, permissions, data privacy, and the master control panel befitting a single, trusted monitor of an enterprise-grade system. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Data Privacy & Consent Management Screen** screen, used by: **Admin**.

### Functional requirements
- Central record of consent status across every customer and partner for data collection, communication, and (where relevant) location tracking, consistent with what's captured at various onboarding and intake screens throughout the app
- Data subject request handling (e.g., a customer or partner requesting to see what data is held about them, or requesting deletion where legally applicable) with a clear workflow and response-time tracking
- Data retention policy configuration (how long different categories of data, like old rejected-applicant records or closed-deal historical data, are retained)
- Privacy policy version management, consistent with the versioning discipline applied to other formal documents throughout the app

### Data this screen touches
- `data_subject_id`
- `consent_status_summary`
- `retention_category`
- `request_type`
- `request_status`

### Business logic & automation rules
- This screen aggregates consent signals already individually captured throughout the app (Customer Quick Signup's consent flags, Surveyor/Technician onboarding's data collection, the Communication Compliance & Opt-Out Manager) into one centralized governance view, appropriate for demonstrating genuine data-privacy discipline for an 'enterprise-grade, production-ready' system handling real personal and location data at scale
- Data subject request handling reflects genuine legal obligations increasingly relevant in India's evolving data-protection regulatory landscape, and having a clear, trackable workflow for such requests is a real operational necessity, not a theoretical nice-to-have, for a business handling this much personal and location data
- Retention policy configuration connects to real, practical questions the app's own data model raises throughout (e.g., how long should a rejected job applicant's documents be retained, how long should detailed GPS trail history be kept) — this screen is where those genuinely important policy decisions are made explicit and enforced consistently rather than left as an unexamined default

### Edge cases & validation to handle
- A data deletion request conflicts with a genuine legal retention requirement (e.g., financial records that must be retained for a statutory period despite an individual's deletion request): the workflow must clearly handle this real tension, likely by explaining what can and cannot be deleted and why, rather than either ignoring the legal retention requirement or refusing every deletion request outright
- A partner who has left the company (per the Partner Deactivation/Exit screen) still has data subject rights regarding their historical data: ensure this screen's request-handling workflow correctly applies to former partners and customers, not only currently active ones
- Retention policy change needs to apply to already-existing historical data, not just new data going forward: carefully define and communicate exactly how a retention policy change affects the substantial amount of data already collected under a prior policy

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
- [ ] Consent and data-subject-request handling across the whole business is centrally governed and genuinely trackable
- [ ] Retention policy decisions are explicit, deliberate, and consistently enforced rather than an unexamined default
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Data Privacy & Consent Management Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
