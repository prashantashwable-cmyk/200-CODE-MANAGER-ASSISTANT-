# Prompt 148 of 200 — Partner Tier & Category Assignment Screen
**Module 15 of 20: Worker & Partner Recruitment** · Screen 8 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 147 (New Partner Aggregation Dashboard Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'one page for automatically new workers aggregation and data collection, recruitment, trainings, SOP' — the pipeline that keeps AIEC's asset-light workforce growing without manual HR overhead. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Partner Tier & Category Assignment Screen** screen, used by: **Admin**.

### Functional requirements
- Assigns a newly activated (or existing) partner to a tier/category (e.g., a technician's skill-based tier, a surveyor's experience tier, a supplier's trust tier) that determines relevant defaults elsewhere in the app (payment terms, commission rates, autonomy level)
- Clear criteria shown for what each tier requires, supporting transparent, explainable tier assignment rather than an opaque internal label
- Tier change history per partner, since tiers should evolve based on demonstrated performance over time
- Direct connection to wherever tier is consumed elsewhere (Supplier Payment Terms Configuration's tier defaults, Commission Rules Engine's tier-based rates)

### Data this screen touches
- `partner_id`
- `assigned_tier`
- `tier_assignment_criteria_met`
- `tier_change_history[]`
- `tier_effective_date`

### Business logic & automation rules
- Tier assignment here is the actual configuration read by several other modules' tier-based defaults (Supplier Payment Terms, Commission Rules), so changing a partner's tier here has real, immediate, correctly-connected downstream effects rather than being a purely cosmetic label
- Tier criteria are explicit and visible (mirroring the transparency principle already established for Lead Scoring and Applicant Screening), so a partner can understand exactly what's needed to progress to a higher tier, supporting a fair, motivating growth path consistent with the brief's incentive-driven culture
- Tier changes are always logged with an effective date and reason, consistent with the audit-trail discipline applied to Role changes and other consequential account modifications throughout the app

### Edge cases & validation to handle
- A partner qualifies for tier promotion based on recent excellent performance, but a single serious recent incident (e.g., a safety-critical QC fail traced to their work) raises a legitimate question about the timing: support Admin's documented judgment call on timing rather than a purely mechanical, immediate rule-based promotion
- Tier criteria themselves need adjustment as the business matures (e.g., raising the bar for what counts as a top technician tier as the talent pool grows): support this as a clearly versioned criteria change, with existing partners' tier grandfather-reviewed rather than silently and confusingly reassessed against retroactive new criteria
- A partner disputes their tier assignment: provide a clear escalation path referencing the same explicit criteria used to assign it, supporting a fair resolution grounded in visible facts rather than an opaque argument

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

**Layout-specific guidance for this screen (layout pattern: form):** Single-column layout with generous label-above-input spacing following the 8pt grid. Validate inline as the user types wherever practical, not only on submit — show a small success check the instant a field like a phone number or IFSC code becomes valid. Group related fields under a subtle section header with a Gold Hairline divider rather than one undifferentiated long list. For any form with more than 4 fields, auto-save a draft so a partial entry is never lost to an app close or a connectivity drop. Primary action button sticky at the bottom on mobile, full-width, disabled (not hidden) until required fields are valid so the user always sees what's left to do.

### This screen is done when:
- [ ] Every partner's tier assignment has real, correctly connected consequences in payment terms and commission calculations elsewhere in the app
- [ ] Tier criteria and changes are transparent and fair, supporting genuine partner trust in the system
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Partner Tier & Category Assignment Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
