# Prompt 134 of 200 — Compliance Certification Screen
**Module 14 of 20: Quality Check & Handover** · Screen 4 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 133 (Quality Checklist — Electrical & Safety Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'final manager handover made to customer after completion, quality check SOP' — grounded in the actual government inspection process so AIEC's internal QC genuinely predicts real-world compliance success. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Compliance Certification Screen** screen, used by: **Admin, QC Inspector**.

### Functional requirements
- Generates AIEC's internal compliance certificate confirming the installation meets the relevant BIS/IS standards (referencing IS 14665 for electric lifts or IS 15259 for hydraulic, as applicable to this configuration) and is ready for the customer's own government inspection application
- Clear guidance summary for the customer on the next external step: applying for their License to Operate with the relevant State Electrical Inspectorate/Lift Inspectorate
- Document package assembly pulling together all the evidence (mechanical, electrical/safety checklists, trial run results) into one clean submission-ready bundle
- Locked/immutable once issued, consistent with other formal documents in the app

### Data this screen touches
- `job_id`
- `applicable_is_standard`
- `certificate_document`
- `government_application_guidance`
- `issued_timestamp`

### Business logic & automation rules
- This certificate is explicitly AIEC's own internal quality assurance document, not a substitute for the actual government-issued operating license — the screen is careful to frame it accurately as 'ready for your government inspection' rather than implying it replaces the legally required State Lift Inspectorate approval
- Which specific IS standard is referenced is determined automatically by the elevator's actual drive type from the original Quotation configuration (electric/traction-type systems reference IS 14665, hydraulic systems reference IS 15259), so the certificate is technically accurate to the specific installed system, not generic boilerplate
- This document package becomes part of the Warranty & AMC Registration and Handover Completion Certificate screens' referenced evidence, and would also be the first thing pulled up in the rare event of a future safety dispute or warranty claim

### Edge cases & validation to handle
- A customer's specific state has an additional local requirement beyond the national BIS standards (state Lift Act variations): the guidance summary should reflect the correct state-specific next steps, consistent with how state-specific contract clauses are already handled elsewhere in the app
- Certificate needs to be reissued due to a later-discovered documentation error (not a quality issue, just a paperwork correction): support a formally superseding reissue that references and voids the original, mirroring the Invoice reissue pattern used in the Payments module
- Customer's installation is for a specialized use case (e.g., a lift for persons with disabilities per IS 14671) requiring reference to a different or additional standard: support the correct standard selection for genuinely non-standard configurations rather than forcing only the two most common standards

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
- [ ] Every customer receives an accurate, standards-referenced internal certificate that genuinely prepares them for real government inspection success
- [ ] The certificate is honestly and clearly framed as AIEC's own QA document, never confused with the legally required government license itself
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Compliance Certification Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
