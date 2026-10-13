# Prompt 123 of 200 — Installation SOP Checklist Screen
**Module 13 of 20: Installation & Technician Module** · Screen 3 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 122 (Job Detail & Site Info Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Boots on the ground, following a real elevator installation SOP grounded in Indian safety standards, with the photo/video evidence trail the brief explicitly requires. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Installation SOP Checklist Screen** screen, used by: **Technician**.

### Functional requirements
- Step-by-step SOP checklist covering the real installation sequence: site/shaft preparation verification, guide rail installation, car frame and cabin assembly, wiring and control panel setup, safety device installation (governor, buffers, door sensors, ARD), and final adjustment
- Each step requires explicit completion confirmation, with several safety-critical steps additionally requiring a photo as evidence before the app allows proceeding to the next step
- Progress rail using the ascension-line motif — quite literally an elevator's own floor indicator repurposed to show installation progress, fitting the brand's signature element perfectly
- Cannot be marked fully complete until every safety-critical step (per the SOP template) has its required evidence attached

### Data this screen touches
- `job_id`
- `sop_step_id`
- `step_completion_status`
- `step_evidence_uploads[]`
- `step_completion_timestamp`

### Business logic & automation rules
- This checklist's actual step sequence and evidence requirements are read from a centrally-governed SOP template (mirroring the Delivery SOP Checklist's own approach), so installation standards stay consistent across every technician and every job rather than being improvised individually
- Safety-critical steps (anything related to the governor, buffers, emergency alarm/ARD, or door safety sensors, consistent with what Indian BIS/IS standards emphasize) are hard-gated: the technician cannot proceed to the next step, and the job cannot reach QC-ready status, without photographic evidence for these specific steps
- This entire evidence trail is exactly the documentation the brief calls for ('installation done by technician by following all SOP and records, photos, videos') and is also the core artifact underpinning AIEC's no-liability model — clear proof of correct SOP-following protects AIEC and the technician alike

### Edge cases & validation to handle
- A step genuinely doesn't apply for this specific configuration (e.g., a feature not included in this customer's package tier): the checklist should support a 'not applicable, confirmed by [reason]' state distinct from skipping a step that does apply, so an incomplete checklist is never confused with a correctly-scoped-down one
- Technician needs to work out of the suggested step order due to real on-site constraints: allow reordering within reason, while still enforcing that dependent safety-critical evidence exists before the checklist can be marked complete overall
- Poor connectivity on-site delays evidence photo upload: allow local capture and completion marking with background upload/sync, never blocking the technician's actual physical progress on a connectivity issue, consistent with the offline-tolerant design pattern used for surveyors

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

**Layout-specific guidance for this screen (layout pattern: checklist):** Large, clearly touch-friendly checkbox or step-card per item — this pattern is used heavily by field staff wearing gloves or working in bright outdoor light, so err toward bigger touch targets and higher contrast than a typical office-app checklist. Visually distinguish mandatory (especially safety-critical) steps from optional ones — a small gold-outlined badge works well. Where a step requires photo/video evidence, the capture control sits inline within that step, not as a separate detour to another screen. Use the vertical Ascension Line as the overall progress indicator across the full checklist. A step that requires evidence should visibly refuse to check off until that evidence is attached, so completion can never silently outrun the real requirement.

### This screen is done when:
- [ ] No installation can be marked complete without full evidence for every safety-critical step
- [ ] Every technician follows the same centrally governed, currently correct SOP regardless of which job or site they're on
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Installation SOP Checklist Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
