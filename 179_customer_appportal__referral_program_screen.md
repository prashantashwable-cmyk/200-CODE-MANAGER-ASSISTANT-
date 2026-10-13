# Prompt 179 of 200 — Referral Program Screen
**Module 18 of 20: Customer App/Portal** · Screen 9 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 178 (AMC/Maintenance Booking Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The customer's own window into their project — transparent, premium, and reassuring from first survey visit through years of AMC service. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Referral Program Screen** screen, used by: **Customer**.

### Functional requirements
- Simple referral mechanism: a personal referral link/code the customer can share, with clear terms on what reward they and their referral both receive
- Tracking of referrals sent and their status (Invited, Site Surveyed, Converted) so the customer can see the real impact of their sharing
- Reward issued automatically upon the referred lead's conversion, consistent with the automated commission/reward philosophy used throughout the app
- Simple share actions (WhatsApp, copy link) for maximum ease of actually referring someone

### Data this screen touches
- `customer_id`
- `referral_code`
- `referrals_sent[]`
- `referral_status`
- `reward_earned`

### Business logic & automation rules
- A referred lead entering the CRM pipeline is tagged with 'Referral/Repeat' as its source, exactly matching the Lead Source & Campaign Attribution screen's own defined source taxonomy, so referral-driven business is properly and consistently measured alongside every other acquisition channel
- Reward issuance upon conversion runs through the same Commission Rules Engine and Payout pipeline used for every other commission in the app — a customer referral reward is technically just another rule-triggered commission entry, not a separately bespoke mechanism
- This screen exists because referral is a genuinely valuable, low-cost acquisition channel for a premium, trust-dependent business like AIEC, and making it easy and rewarding for satisfied customers directly supports sustainable, organic growth alongside the surveyor-driven field acquisition model

### Edge cases & validation to handle
- A referred contact was already an existing lead in the system through another channel before this referral (e.g., a surveyor had already captured them independently): apply the same duplicate-detection and fair-attribution logic already established in the CRM's Duplicate Lead Merge screen, rather than a separate, less rigorous referral-specific duplicate check
- Customer refers someone who doesn't convert for a long time (e.g., a 'site not ready' scenario): keep the referral visibly tracked in an appropriate pending state rather than it appearing to silently disappear, consistent with how the CRM's own Lost Lead revisit-reminder pattern handles not-yet-ready opportunities
- Reward structure needs to differ for a very large referred deal versus a small one: support this if genuinely intended, but ensure the terms shown to the customer upfront accurately reflect whatever the real reward structure is, avoiding any surprise or disappointment

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

**Layout-specific guidance for this screen (layout pattern: detail):** Lead with a hero header carrying the record's key identifying information (name, status badge, one or two headline stats). Break dense content into clear sections — tabs for genuinely separate categories of information, simple stacked sections with headers when the content is more linear. Any history/timeline section within a detail screen uses the vertical Ascension Line motif. Keep one clear primary action reachable via a sticky bottom bar or a prominent header button; secondary actions live in an overflow menu rather than competing visually with the primary one.

### This screen is done when:
- [ ] Referring a friend is genuinely effortless for a satisfied customer, with transparent tracking of the outcome
- [ ] Referral rewards flow through the same governed, automated commission pipeline as every other incentive in the app
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Referral Program Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
