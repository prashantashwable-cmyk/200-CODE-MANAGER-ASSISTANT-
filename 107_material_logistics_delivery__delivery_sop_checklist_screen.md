# Prompt 107 of 200 — Delivery SOP Checklist Screen
**Module 11 of 20: Material Logistics & Delivery** · Screen 7 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 106 (Inventory/Stock-in-Transit Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Once a supplier ships, the brief calls for tracked, SOP-governed delivery to site — this module is the physical bridge between a Purchase Order and a technician who can actually start installing. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Delivery SOP Checklist Screen** screen, used by: **Admin**.

### Functional requirements
- Admin-configurable master SOP template defining exactly what the Site Delivery Checklist screen should contain per component category, keeping delivery verification standards centrally governed and consistent
- Version history so SOP updates (e.g., adding a new verification step after a lesson learned from a past incident) are tracked and their effective date is clear
- Preview of exactly how a given SOP version will render to the technician doing the actual on-site checklist
- Category-specific SOP variants (e.g., glass cabin panels need an extra fragility-check step that a standard steel panel doesn't)

### Data this screen touches
- `sop_template_id`
- `component_category`
- `checklist_steps[]`
- `sop_version`
- `effective_date`

### Business logic & automation rules
- This is the actual configuration source read by the Site Delivery Checklist screen technicians use in the field — there is no separately hardcoded checklist logic elsewhere, keeping the SOP genuinely centrally governed as the brief's emphasis on standard operating procedures requires
- A new SOP version applies to deliveries scheduled from its effective_date forward; any delivery already in progress under an older SOP version completes under that version, avoiding a confusing mid-checklist rule change
- This screen exists specifically because 'streamlined like a production line' from the brief requires that operational steps be defined once, centrally, and applied consistently — not improvised per technician

### Edge cases & validation to handle
- A new, previously unencountered component category needs its first SOP defined: support creating a new category-specific template rather than forcing an ill-fitting existing one
- An SOP step is found to be genuinely unworkable in real field conditions (discovered via technician feedback): support quick amendment with a clear versioned effective date, treating SOP evolution as a normal continuous-improvement process, not a rare event
- Technician executing an old cached version of the checklist template due to a sync delay: reconcile to the latest applicable version once connectivity returns, flagging if any already-completed steps need re-verification under the new version

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
- [ ] Every technician anywhere follows the exact same, currently correct delivery verification standard for a given component type
- [ ] SOP changes are traceable, versioned, and never silently or inconsistently applied
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Delivery SOP Checklist Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
