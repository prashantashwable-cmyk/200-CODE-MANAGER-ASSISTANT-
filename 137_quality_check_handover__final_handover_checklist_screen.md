# Prompt 137 of 200 — Final Handover Checklist Screen
**Module 14 of 20: Quality Check & Handover** · Screen 7 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 136 (Rework Assignment Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'final manager handover made to customer after completion, quality check SOP' — grounded in the actual government inspection process so AIEC's internal QC genuinely predicts real-world compliance success. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Final Handover Checklist Screen** screen, used by: **QC Inspector, Admin**.

### Functional requirements
- The final gate before Handover: confirms all snags are resolved (or explicitly, appropriately waived for cosmetic-only items), all Compliance Certification is issued, and all required documentation (warranty terms, AMC options, user manual) is ready to hand to the customer
- Simple, clean summary view rather than a redundant re-listing of every individual mechanical/electrical item already covered earlier — this is a final completeness gate, not a third detailed inspection
- One-tap 'Ready for Handover' confirmation that unlocks the Customer Handover Walkthrough screen
- Cannot be completed while any Safety-Critical or unresolved Functional snag remains open

### Data this screen touches
- `job_id`
- `all_snags_resolved_flag`
- `compliance_cert_issued_flag`
- `documentation_package_ready_flag`
- `handover_ready_status`

### Business logic & automation rules
- This screen is deliberately a completeness gate synthesizing signals from the Defect/Snag List and Compliance Certification screens, rather than a fourth independent inspection layer, avoiding redundant process while still ensuring nothing is missed before the customer-facing moment
- 'Ready for Handover' is the single event that unlocks the Customer Handover Walkthrough — there's no way to reach that customer-facing moment through any other path, keeping this gate structurally meaningful rather than easily bypassed
- This is the practical technical implementation of the brief's 'quality check SOP' as the deliberate final checkpoint before the also-explicitly-required 'final manager handover made to customer after completion'

### Edge cases & validation to handle
- Documentation package (warranty terms, user manual) has a genuine last-minute issue (e.g., a warranty document referencing the wrong package tier due to a late configuration change): block Handover-readiness specifically on this documentation issue even though all physical quality checks passed, since an accurate customer-facing package matters just as much as the physical installation quality
- All checks pass, but Admin has independent reason for a final personal review before handover (e.g., this is a particularly high-profile or large commercial customer): support an optional Admin-added final review step without weakening the structural checks for the standard case
- A very minor, genuinely trivial documentation typo is found at this final gate: support quick correction within this same flow rather than forcing a return to an earlier screen for something this minor

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
- [ ] Nothing reaches the customer-facing Handover moment with any unresolved safety or functional issue, or incomplete documentation
- [ ] The gate is a genuine synthesis checkpoint, not a redundant re-inspection burden on the QC team
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Final Handover Checklist Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
