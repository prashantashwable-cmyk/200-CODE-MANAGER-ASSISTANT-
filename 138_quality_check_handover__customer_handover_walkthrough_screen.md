# Prompt 138 of 200 — Customer Handover Walkthrough Screen
**Module 14 of 20: Quality Check & Handover** · Screen 8 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 137 (Final Handover Checklist Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'final manager handover made to customer after completion, quality check SOP' — grounded in the actual government inspection process so AIEC's internal QC genuinely predicts real-world compliance success. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Customer Handover Walkthrough Screen** screen, used by: **Customer, Admin/Technician**.

### Functional requirements
- Guided, in-person (or video-call) walkthrough script for whoever conducts the handover: demonstrating normal operation, emergency procedures (what to do during a power cut, how the ARD and alarm work), and basic care guidance
- Digital sign-off step where the customer confirms they've received the walkthrough and understand the basics, distinct from and following the Compliance Certification
- Document handover confirmation: warranty terms, AMC option enrollment prompt, user manual, and emergency contact information all provided together
- Feedback prompt immediately following handover while the experience is fresh

### Data this screen touches
- `job_id`
- `walkthrough_conducted_by`
- `customer_signoff_timestamp`
- `documents_provided[]`
- `immediate_feedback_score`

### Business logic & automation rules
- This is explicitly the 'final manager handover made to customer after completion' moment described in the brief — a deliberately human, relationship-oriented moment rather than a purely transactional final step, consistent with the premium brand positioning throughout the app
- Customer sign-off here is a distinct, later event from the Compliance Certification and Final Handover Checklist gates — it specifically confirms the customer's own understanding and acceptance, not a repeat of the technical quality confirmation already completed upstream
- This is the natural, well-timed moment to prompt AMC enrollment, since the customer is engaged, present, and has just seen firsthand the value of professional installation and support, rather than a cold later sales attempt

### Edge cases & validation to handle
- Customer is unavailable for an in-person walkthrough at the actual completion moment (e.g., an investor/NRI owner not on-site): support a scheduled video-call walkthrough or a well-documented handover to a site representative with the customer's own sign-off collected separately and soon after
- Customer has follow-up questions beyond the standard walkthrough script: support capturing these as a warm handoff into ongoing Customer Support rather than the walkthrough conductor needing to have every possible answer on the spot
- Immediate feedback captured here is unusually negative despite all technical checks having passed: this should be visible to Admin as a relationship-quality signal worth understanding, distinct from (but alongside) the technical quality data already captured elsewhere

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

**Layout-specific guidance for this screen (layout pattern: wizard):** Use a horizontal Ascension Line step indicator across the top — each step is a node that lights gold on completion. Show one logical group of fields per step; never cram multiple unrelated decisions into a single step. Back and Next are always visible; allow jumping back to any completed step without discarding progress on later ones. End with a clean review step summarizing every prior step's entries in one glance before final submission, so the user never submits blind. Draft-saves at every step boundary for resilience against interruption.

### This screen is done when:
- [ ] Every customer receives a genuine, documented walkthrough and confirms their own understanding before the project is considered fully complete
- [ ] AMC enrollment is offered at the single most natural, well-timed moment in the entire customer journey
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Customer Handover Walkthrough Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
