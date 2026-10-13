# Prompt 159 of 200 — New SOP Rollout Notification Screen
**Module 16 of 20: Training & SOP Library** · Screen 9 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 158 (Training Compliance Tracker Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's recruitment pipeline ends in 'trainings, SOP' — this module is where every partner actually learns the standards the rest of the app enforces. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **New SOP Rollout Notification Screen** screen, used by: **Admin, Technician, Surveyor**.

### Functional requirements
- Admin-facing tool to announce a new or updated SOP to all affected partners, with clear versioning and an effective date
- Partner-facing notification with a direct link into the updated SOP Document and, if required, a brief re-certification quiz on just the changed portion
- Acknowledgment tracking so Admin can confirm every affected partner has actually seen and understood the change before its effective date
- Rollback/urgent-correction path for a rare case where a rolled-out SOP update itself needs rapid correction

### Data this screen touches
- `rollout_id`
- `sop_document_id`
- `affected_partner_roles[]`
- `acknowledgment_status`
- `effective_date`

### Business logic & automation rules
- This screen is the deliberate communication layer connecting an SOP change made in the Delivery SOP Checklist or Installation SOP Checklist configuration screens to the actual humans who need to know about and adapt to that change, ensuring an SOP update is a genuine, acknowledged rollout rather than a silent backend configuration change nobody in the field notices
- Acknowledgment tracking gives Admin genuine confidence that safety-critical procedure changes have actually reached and been understood by the field workforce, consistent with the seriousness the brief places on SOP-driven, production-line-like consistency
- A required re-certification quiz on just the changed portion (rather than a full re-test) respects partners' time while still verifying genuine understanding of what specifically changed, a proportionate response appropriate to a targeted update

### Edge cases & validation to handle
- An SOP update needs to take effect faster than the normal acknowledgment-and-training cycle allows (e.g., a genuine safety concern requiring immediate change): support an expedited urgent-rollout path that still tracks acknowledgment but doesn't block field operations on full completion, appropriately balancing urgency against the value of ensuring understanding
- A partner is on leave or otherwise unreachable during a rollout period: track their pending acknowledgment clearly rather than it silently disappearing, ensuring they're caught up upon return before resuming any affected work
- A rolled-out SOP change is found shortly after to have an error needing correction: support a clear, versioned rapid-correction rollout rather than confusingly amending the already-distributed version in place

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

**Layout-specific guidance for this screen (layout pattern: list):** Establish one consistent row anatomy (leading icon or avatar, primary line, secondary line, trailing status/value) and repeat it exactly across every row so the list reads instantly once learned. Sticky search/filter bar pinned above the scrolling content. Support swipe actions on mobile where a natural quick action exists (e.g., swipe to call, swipe to reassign). Design the empty state (zero results, zero data yet) with the same care as a populated list — a clear icon, one calm sentence, and a next action, never just blank space. Use skeleton row placeholders while loading, and paginate or virtualize any list that could realistically grow large.

### This screen is done when:
- [ ] Every SOP change reaches and is genuinely acknowledged by every affected partner before or at its effective date
- [ ] Safety-critical urgent updates have a fast path that doesn't sacrifice acknowledgment tracking
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the New SOP Rollout Notification Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
