# Prompt 188 of 200 — Manual Override Console Screen
**Module 19 of 20: Automation Rules & Notification Engine** · Screen 8 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 187 (Audit Log of Automated Actions Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The connective tissue implementing 'fully automated, only monitor by one person' as an actual configurable system rather than a marketing phrase. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Manual Override Console Screen** screen, used by: **Admin**.

### Functional requirements
- Dedicated, clearly-labeled console for Admin to manually override or force a specific automated process's outcome in a genuine exception scenario (e.g., manually advancing a stuck lead's stage, manually forcing a payout that a rule incorrectly blocked)
- Mandatory reason field for every override, since bypassing automation is inherently a higher-risk action deserving explicit justification
- Every override is logged with the same rigor as the Audit Log of Automated Actions, clearly tagged as a manual override rather than a standard automated action
- Confirmation step with a clear warning of what the override will actually do, avoiding an accidental override of something Admin didn't fully intend

### Data this screen touches
- `override_id`
- `target_record_id`
- `override_action`
- `mandatory_reason`
- `admin_id`

### Business logic & automation rules
- This console exists because even a well-designed automated system will occasionally encounter a genuine edge case its rules didn't anticipate, and the brief's 'monitor by one person' model requires that person to have real, direct power to intervene when truly necessary, rather than being helplessly blocked by an automation that's clearly wrong for a specific unusual situation
- Every override is deliberately more heavily logged and justified than a standard action, since bypassing the carefully-designed automated guardrails (margin floors, approval workflows, safety-critical hard-blocks) is inherently higher-risk and deserves a correspondingly higher bar of accountability and traceability
- This console is explicitly NOT a way to bypass genuine hard-blocked safety-critical rules (like the Electrical & Safety Checklist's non-overridable failures) — the override console's own permission model must respect that some guardrails are intentionally not meant to have any override path at all, regardless of how this console is designed

### Edge cases & validation to handle
- Admin attempts to use this console to override something that was deliberately designed to have no override path (e.g., a genuine safety-critical QC failure): the console itself must refuse this specific category of override, structurally enforcing that some guardrails really are absolute, not just difficult to bypass
- An override is used frequently for the same recurring scenario, suggesting the underlying automation rule itself needs updating rather than repeatedly requiring manual override: surface this pattern (e.g., via the Audit Log's own analysis) as a signal that a rule change, not continued manual overriding, is the right long-term fix
- Override is applied but has unintended downstream consequences the Admin didn't fully anticipate (automations are often interconnected): where feasible, show a preview of likely downstream effects before confirming the override, helping Admin make a genuinely informed decision

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
- [ ] Admin retains real power to handle genuine automation edge cases without being helplessly blocked
- [ ] Truly non-negotiable safety guardrails remain structurally un-overridable through this console, no matter how it's used
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Manual Override Console Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
