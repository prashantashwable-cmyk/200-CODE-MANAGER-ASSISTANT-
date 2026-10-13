# Prompt 154 of 200 — Quiz & Certification Test Screen
**Module 16 of 20: Training & SOP Library** · Screen 4 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 153 (SOP Document Repository Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's recruitment pipeline ends in 'trainings, SOP' — this module is where every partner actually learns the standards the rest of the app enforces. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Quiz & Certification Test Screen** screen, used by: **Surveyor, Technician, Supplier**.

### Functional requirements
- Formal assessment following completion of a training module or module group, testing genuine understanding rather than mere content exposure
- Pass threshold configuration per assessment, with clear feedback on incorrect answers to reinforce learning even in a failed attempt
- Retake policy with a reasonable cooldown period, avoiding both an overly punitive one-shot-only approach and an easily-gamed unlimited-immediate-retry approach
- Passing result directly issues the corresponding certification badge

### Data this screen touches
- `assessment_id`
- `partner_id`
- `score_achieved`
- `pass_threshold`
- `attempt_number`

### Business logic & automation rules
- A passing score here is the specific event that issues a certification badge in the Certification Badge & Progress screen and, for safety-critical certifications, unlocks the relevant job-eligibility skill tag referenced in Technician Onboarding — assessment completion has real, connected operational consequences, not just a training-department formality
- Retake cooldown balances giving a genuinely struggling learner enough encouragement and reasonable spacing to actually re-study, against preventing a partner from simply guess-spamming an assessment until they pass by chance
- Assessment content is versioned alongside its corresponding training module, so a partner is always tested against the currently correct standard, never an outdated question set for since-updated content

### Edge cases & validation to handle
- A partner fails an assessment multiple times, suggesting a genuine skill or comprehension gap rather than simple bad luck: surface this pattern to Admin as a coaching opportunity via the Skill Matrix & Gap Analysis screen, rather than the partner being silently and repeatedly blocked with no path to actual improvement support
- Assessment questions become outdated alongside an SOP update: ensure the assessment's own version updates in lockstep with its source training content, avoiding a scenario where a partner is tested on since-changed information
- A partner disputes a specific question's correctness or fairness: provide a flagging mechanism routing to Admin for content review, supporting continuous quality improvement of the assessment content itself

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
- [ ] Certification genuinely reflects demonstrated competence, with real operational consequences correctly and immediately unlocked upon passing
- [ ] Struggling partners are identified as a coaching opportunity rather than being silently and repeatedly blocked
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Quiz & Certification Test Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
