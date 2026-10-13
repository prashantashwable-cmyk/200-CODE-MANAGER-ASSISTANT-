# Prompt 158 of 200 — Training Compliance Tracker Screen
**Module 16 of 20: Training & SOP Library** · Screen 8 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 157 (Skill Matrix & Gap Analysis Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's recruitment pipeline ends in 'trainings, SOP' — this module is where every partner actually learns the standards the rest of the app enforces. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Training Compliance Tracker Screen** screen, used by: **Admin**.

### Functional requirements
- Overall compliance rate across the active partner base: percentage with all required training current, broken down by role and territory
- List of specific partners out of compliance with clear reason (never started, failed and not retaken, refresher lapsed)
- Bulk reminder action for all out-of-compliance partners at once
- Historical compliance trend, useful for demonstrating the health of the training program to any future stakeholder or auditor

### Data this screen touches
- `partner_id`
- `compliance_status`
- `non_compliance_reason`
- `role`
- `territory`

### Business logic & automation rules
- This is the Admin's single consolidated view answering 'is my whole workforce properly trained and certified right now,' synthesizing data already tracked individually in Certification Badges, Refresher Reminders, and Quiz results into one governance-level summary appropriate for the 'enterprise-grade, production-ready' standard the brief demands
- Non-compliance reason categorization (never started vs. failed vs. lapsed) supports genuinely different appropriate responses — a 'never started' partner needs a nudge, a 'repeatedly failed' partner needs the coaching-opportunity treatment from the Assessment screen's own gap-flagging logic
- This tracker exists specifically to make an otherwise-easy-to-overlook governance concern (training currency across a growing distributed workforce) visible and actionable for a single monitoring person, consistent with the brief's core operating philosophy

### Edge cases & validation to handle
- A large batch of partners falls out of compliance simultaneously due to a single certification's cadence all landing around the same renewal date (a cohort effect from a shared onboarding date): recognize and handle this as an expected pattern rather than it looking like a sudden, alarming compliance crisis
- Compliance tracking for a role AIEC has very few of (e.g., only one or two suppliers with a specific requirement): present honestly with appropriate small-sample context rather than a misleadingly dramatic percentage
- A partner is technically out of compliance but their specific certification type isn't currently operationally blocking (a lower-stakes, non-safety-critical training item): distinguish this clearly from safety-critical non-compliance, which should be visually and functionally more urgent

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
- [ ] Admin has one clear, always-current view of overall workforce training compliance suitable for genuine governance oversight
- [ ] Non-compliance is categorized clearly enough to support the right specific follow-up action for each case
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Training Compliance Tracker Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
