# Prompt 136 of 200 — Rework Assignment Screen
**Module 14 of 20: Quality Check & Handover** · Screen 6 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 135 (Defect/Snag List Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'final manager handover made to customer after completion, quality check SOP' — grounded in the actual government inspection process so AIEC's internal QC genuinely predicts real-world compliance success. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Rework Assignment Screen** screen, used by: **Admin, Technician**.

### Functional requirements
- Assigns a specific snag or group of related snags back to a technician (often, but not necessarily, the original installer) for correction, with the QC finding's full detail and evidence attached
- Due date/urgency based on the snag's severity (Safety-Critical rework is treated as immediately urgent)
- Technician's own notes on the fix applied, plus new evidence captured following the same guided Evidence Capture pattern used during original installation
- Auto-returns the item to the Defect/Snag List as 'Pending Re-Verification' once the technician marks their rework complete

### Data this screen touches
- `rework_id`
- `linked_snag_id`
- `assigned_technician_id`
- `due_urgency`
- `rework_completion_evidence`

### Business logic & automation rules
- Rework assignment reuses the exact same job-detail and evidence-capture infrastructure as original installation, since a rework task is functionally a small, focused installation task in its own right, not a fundamentally different kind of work needing separate tooling
- Marking rework complete never directly closes the underlying snag — it always transitions to 'Pending Re-Verification,' enforcing the independent QC re-check principle structurally rather than relying on process discipline alone
- Safety-Critical rework urgency is reflected consistently with how Safety-Critical issues are prioritized everywhere else in the app (Alerts & Exceptions, the Electrical/Safety checklist's hard-block logic), maintaining one coherent severity philosophy across modules

### Edge cases & validation to handle
- Rework requires a part that wasn't part of the original delivery (e.g., a defective component needs replacement): this should smoothly connect into a new, smaller-scale Purchase Order or Damaged/Missing Parts Report flow rather than the rework process having no path to actually obtain what's needed
- Original installing technician is no longer available (left the company, or is on another job far away): support reassignment to a different qualified technician, with full original context and evidence still available to them despite not being the original installer
- Rework itself reveals a more serious underlying issue than the original snag suggested (e.g., attempting a minor fix uncovers a bigger problem): support escalating the rework's own severity/scope rather than forcing it to stay artificially scoped to the original snag's initial description

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
- [ ] Every rework task has full original context and evidence available regardless of who performs the fix
- [ ] No rework can bypass independent QC re-verification before its snag is considered closed
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Rework Assignment Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
