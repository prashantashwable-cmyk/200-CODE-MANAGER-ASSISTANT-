# Prompt 133 of 200 — Quality Checklist — Electrical & Safety Screen
**Module 14 of 20: Quality Check & Handover** · Screen 3 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 132 (Quality Checklist — Mechanical Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'final manager handover made to customer after completion, quality check SOP' — grounded in the actual government inspection process so AIEC's internal QC genuinely predicts real-world compliance success. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Quality Checklist — Electrical & Safety Screen** screen, used by: **QC Inspector**.

### Functional requirements
- Focused checklist on electrical and safety-critical items: wiring and grounding verification, control panel function, overspeed governor test, buffer function, ARD (Automatic Rescue Device) function during a simulated power failure, door safety sensor test, overload device test, emergency alarm/communication test
- No-load and full-load trial run results recorded here as the culminating test, again directly mirroring the real government inspection's own trial-run procedure
- Any safety-critical fail hard-blocks progression to Handover entirely, with no Admin override available short of a documented, qualified re-test and pass
- Direct feed into the Compliance Certification screen once all items pass

### Data this screen touches
- `job_id`
- `electrical_safety_item`
- `result`
- `trial_run_evidence`
- `hard_block_status`

### Business logic & automation rules
- This checklist is the most safety-critical screen in the entire app, directly reflecting real, current Indian standards (BIS/IS practice codes covering electrical safety, governor and buffer function, ARD, door sensors, and overload protection) and the real state Lift Inspectorate's own pre-commissioning inspection procedure
- Unlike the Mechanical checklist's allowance for a documented 'pass with exception,' there is deliberately no soft-pass path here for a genuine safety-critical failure — this reflects the real-world reality that these specific items are exactly what can cause serious harm if wrong, consistent with the extra caution the business's own no-liability and zero-risk principles demand
- A full pass here is the single specific event that unlocks the Compliance Certification screen, directly connecting genuine safety verification to the customer's ability to obtain their real government License to Operate

### Edge cases & validation to handle
- ARD test reveals the device functions but with a slower-than-ideal response time: this must be treated as a fail requiring investigation and correction, not waved through as 'basically fine,' given the device's specific emergency purpose
- A safety item passes on retest after an initial fail and fix: retain the full history of both the original fail and the passing retest in the permanent record, rather than only showing the final passing result, preserving an honest complete picture
- Trial run reveals an intermittent issue that doesn't reproduce consistently on demand: treat inconsistent/intermittent safety-relevant behavior as a fail requiring root-cause investigation, never as an ambiguous 'sometimes fine' pass, given the stakes involved

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
- [ ] No installation can proceed to handover with any unresolved safety-critical electrical or safety-device failure
- [ ] The full history of any failure and subsequent fix is preserved, never just the final clean result
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Quality Checklist — Electrical & Safety Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
