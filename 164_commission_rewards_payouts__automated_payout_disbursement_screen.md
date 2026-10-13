# Prompt 164 of 200 — Automated Payout Disbursement Screen
**Module 17 of 20: Commission, Rewards & Payouts** · Screen 4 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 163 (Payout Approval Queue Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'each stage completion give workers payment, commission, competition rewards' made concrete and auditable — one ledger every partner-facing screen elsewhere in the app reads from. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Automated Payout Disbursement Screen** screen, used by: **Admin**.

### Functional requirements
- Live status of the actual bank transfer/UPI disbursement process for approved payouts: Initiated, Processing, Completed, Failed
- Failure handling with clear reason (invalid bank details, bank-side rejection) and a direct retry or partner-contact action
- Batch disbursement scheduling (e.g., a weekly payout run) alongside support for individual urgent disbursements outside the normal batch
- Full disbursement history log for reconciliation and audit

### Data this screen touches
- `disbursement_id`
- `payout_entry_id`
- `disbursement_method`
- `disbursement_status`
- `failure_reason`

### Business logic & automation rules
- This is the actual execution engine triggered by Payout Approval — it's the technical realization of the brief's 'fully automated' principle specifically for worker payments, where the human's role (Approval) and the system's role (Disbursement) are cleanly separated
- Failed disbursements automatically surface into the Alerts & Exceptions Dashboard, consistent with how every other automation failure in the app is handled — a failed payout is exactly the kind of thing that shouldn't silently sit unnoticed, since a partner is genuinely waiting on real money
- This screen's disbursement records are what the Auto-Reconciliation screen in the Supplier Payment Processing module's broader financial-integrity check cross-references against actual bank activity, extending that same reconciliation discipline to worker payouts, not just supplier payments

### Edge cases & validation to handle
- A partner's bank details are found invalid only at actual disbursement attempt (despite earlier penny-drop verification during onboarding, e.g., an account was since closed): this needs clear, urgent flagging and a direct path for the partner to update their details and trigger a retry, since this represents a real person genuinely waiting on money they've earned
- Batch disbursement run is interrupted partway (a system or banking-partner issue): ensure a clear record of exactly which entries completed versus which need to be retried, rather than an ambiguous partial-batch state
- A partner has multiple pending payout entries that should logically be disbursed together as one transfer for efficiency: support consolidating multiple approved entries into a single disbursement transaction where sensible, rather than many small separate transfers

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
- [ ] Every approved payout reliably reaches the partner's bank account or is clearly flagged and resolved if it fails
- [ ] Worker payout reconciliation is held to the same financial-integrity standard as supplier payment reconciliation
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Automated Payout Disbursement Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
