# Prompt 124 of 200 — Photo/Video Evidence Capture Screen
**Module 13 of 20: Installation & Technician Module** · Screen 4 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 123 (Installation SOP Checklist Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Boots on the ground, following a real elevator installation SOP grounded in Indian safety standards, with the photo/video evidence trail the brief explicitly requires. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Photo/Video Evidence Capture Screen** screen, used by: **Technician**.

### Functional requirements
- Dedicated capture interface invoked from specific SOP steps, guiding the technician through exactly which angles/moments to capture (e.g., 'photograph the governor rope tension setting', 'record a short video of the door sensor test')
- Auto-tagging of each piece of evidence with the job, SOP step, and timestamp
- Gallery view of all evidence captured for this job so far, organized by SOP step for easy review
- Retake option before final submission if a photo is blurry or doesn't clearly show what's needed

### Data this screen touches
- `job_id`
- `sop_step_id`
- `evidence_type`
- `media_url`
- `capture_timestamp`

### Business logic & automation rules
- This capture flow is guided rather than a generic camera roll upload specifically because the evidentiary value of 'proof we followed the SOP correctly' depends on capturing the right thing at the right moment, not just any photo loosely associated with the job
- All evidence captured here becomes part of the permanent job record accessible later during Quality Check, Handover, and any future dispute or warranty claim, so it's stored durably and never able to be silently deleted by the technician after the fact
- Video capture (for dynamic checks like a door-sensor test or a trial run) is supported alongside photos specifically because some safety verifications are inherently about motion/behavior that a static photo can't adequately prove

### Edge cases & validation to handle
- Device storage or connectivity is severely limited on-site: support reasonable compression without so degrading quality that the evidence becomes useless for its verification purpose
- Technician captures evidence that clearly shows a problem (e.g., a visible defect) rather than a clean pass: this should be fully supported and even valuable — evidence capture isn't only for proving success, it's also for documenting exactly what was found, feeding naturally into the Issue/Blocker Reporting flow if needed
- A required evidence item genuinely cannot be captured as specified due to an unusual site constraint (e.g., a physically inaccessible angle in a very tight shaft): support a documented exception with technician's explanation rather than a hard block with no path forward

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

**Layout-specific guidance for this screen (layout pattern: gallery):** Grid of thumbnails with a tap-to-expand full-screen lightbox view. During live capture flows, overlay a simple framing guide (e.g., a ghosted outline of what to photograph) rather than a bare camera viewfinder, since several gallery screens are guided evidence-capture flows, not casual photo albums. Show per-item upload progress (not only one overall progress bar) so a user can see exactly which specific photo is still uploading on a slow connection. Tag each thumbnail clearly with what it's evidence of (e.g., the specific SOP step or checklist item), never an undifferentiated photo dump.

### This screen is done when:
- [ ] Every safety-critical SOP step has clear, well-organized, purpose-specific evidence attached
- [ ] Evidence remains permanently accessible for future QC, handover, warranty, or dispute purposes
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Photo/Video Evidence Capture Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
