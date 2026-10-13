# Prompt 161 of 200 — Commission Rules Engine Configuration Screen
**Module 17 of 20: Commission, Rewards & Payouts** · Screen 1 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 160 (Training Feedback Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'each stage completion give workers payment, commission, competition rewards' made concrete and auditable — one ledger every partner-facing screen elsewhere in the app reads from. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Commission Rules Engine Configuration Screen** screen, used by: **Admin**.

### Functional requirements
- Central configuration of every commission-earning rule across the business: surveyor lead-capture bonus, conversion bonus, technician per-job completion rate, QC inspector fee, referral bonus — each with its trigger event and amount/percentage logic
- Tier-based rate variation reading directly from the Partner Tier & Category Assignment screen's tier data, so a higher-tier partner's better rate is automatically applied rather than manually set per person
- Simulation tool showing exactly what a hypothetical completed deal or job would pay out to each involved party under current rules
- Version history, since commission rules affecting real partner income deserve the same careful change-tracking as pricing rules

### Data this screen touches
- `commission_rule_id`
- `trigger_event`
- `rate_or_amount_logic`
- `applicable_partner_tier`
- `rule_version`

### Business logic & automation rules
- This is the single true configuration root read by every commission entry generated anywhere in the app (Surveyor Commission Tracker, Deal Won screen, Handover Completion Certificate's final payout trigger) — there is no separately calculated commission logic anywhere else, ensuring perfect consistency between what a partner is promised and what they're actually paid
- Tier-based rate variation directly connects to the Partner Tier & Category Assignment screen, so improving a partner's tier through demonstrated performance has an immediate, correctly-calculated effect on their future earnings, reinforcing the meritocratic, motivating culture the brief emphasizes
- Rule changes apply prospectively to future-triggering events only; already-earned commission entries retain the rule version active when they were actually earned, mirroring the same non-retroactive principle applied to pricing and margin-floor configuration changes

### Edge cases & validation to handle
- A commission rule change is significant enough that partners should be proactively informed ahead of time rather than just discovering a changed rate after the fact: support an optional advance-notice communication tied to the rule change, respecting the trust relationship with the workforce
- Simulation reveals an unintended consequence of a proposed rule change (e.g., a specific combination of tiers and bonuses that pays out more than intended for an edge-case scenario): this is exactly the value of the simulation tool, catching an issue before real partners are affected by a flawed rule
- Two commission rules could both apply to the same triggering event: define clear precedence/stacking rules explicitly (some bonuses stack, some are mutually exclusive) rather than leaving ambiguous double-counting or under-counting risk

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
- [ ] Every commission ever paid anywhere in the app traces back to one specific, versioned rule a partner could review and understand
- [ ] Tier improvements translate immediately and correctly into better future earnings
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Commission Rules Engine Configuration Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
