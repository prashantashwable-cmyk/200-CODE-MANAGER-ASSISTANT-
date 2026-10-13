# Prompt 122 of 200 — Job Detail & Site Info Screen
**Module 13 of 20: Installation & Technician Module** · Screen 2 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 121 (Technician Home / My Jobs Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Boots on the ground, following a real elevator installation SOP grounded in Indian safety standards, with the photo/video evidence trail the brief explicitly requires. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Job Detail & Site Info Screen** screen, used by: **Technician**.

### Functional requirements
- Full context for one installation job: customer details, site address with map/navigation handoff, elevator configuration specs from the original quotation, and any special notes from the sales/survey stage
- Materials checklist showing what's confirmed delivered and ready on-site versus what's still pending
- Assigned team members if this is a multi-technician job, each with their role
- Direct access into the Installation SOP Checklist to actually begin work

### Data this screen touches
- `job_id`
- `customer_details`
- `site_address`
- `elevator_configuration_spec`
- `materials_status`

### Business logic & automation rules
- Elevator configuration spec shown here is pulled directly and only from the original Quotation Engine's locked configuration for this deal, so the technician always installs exactly what was actually sold and contracted, never a stale or mismatched spec
- Materials status directly reflects the Site Delivery Checklist and Material Received Confirmation records — a technician should never arrive expecting parts that the system already knows haven't actually been confirmed received
- This is a read-mostly context screen; the actual working record of installation progress lives in the SOP Checklist screen it links to, keeping a clean separation between 'here's the job context' and 'here's the live working checklist'

### Edge cases & validation to handle
- Special notes from survey/sales mention something the technician needs to know but that's since become outdated (e.g., a note about difficult site access that's no longer relevant after other construction progressed): notes should be timestamped so the technician can judge relevance rather than treating every old note as equally current
- Job is for a repeat customer's second installation, and some context (contact preferences, site access details) could sensibly carry over: support this convenience without assuming everything is identical to the first installation
- A last-minute configuration change happened after the technician already started reviewing job details: refresh the technician's view of the spec if it changes, rather than letting them work from a view that's gone stale mid-session

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
- [ ] A technician arrives fully informed about exactly what to install and what materials are genuinely ready on-site
- [ ] The installed configuration always traces back exactly to what the customer actually purchased
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Job Detail & Site Info Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
