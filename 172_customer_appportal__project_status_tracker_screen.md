# Prompt 172 of 200 — Project Status Tracker Screen
**Module 18 of 20: Customer App/Portal** · Screen 2 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 171 (Customer Home Dashboard Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The customer's own window into their project — transparent, premium, and reassuring from first survey visit through years of AMC service. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Project Status Tracker Screen** screen, used by: **Customer**.

### Functional requirements
- Customer's own view into the Installation Progress Timeline screen (from the Installation module), presented with the same ascension-line visual milestone motif
- Clear current stage, recently completed milestones, and honestly-estimated next milestone with date
- Photo highlights from installation progress where appropriate (e.g., completed cabin installation photo) giving a tangible sense of real progress
- Direct link to relevant documents (quotation, contract) for context at each historical stage

### Data this screen touches
- `deal_id`
- `current_stage`
- `milestone_history[]`
- `estimated_next_milestone_date`
- `progress_photo_highlights[]`

### Business logic & automation rules
- This screen is explicitly the same underlying data as the Installation Progress Timeline's customer-facing view already defined in the Installation module — it's presented here as part of the Customer Portal's own navigation structure, but it is not a separate data source or duplicated screen
- Progress photo highlights are curated from the fuller Evidence Capture library (filtering for customer-appropriate, non-overly-technical images) rather than customers seeing every raw technical evidence photo captured for SOP compliance purposes
- This screen, together with the Payment & Installments screen, gives a customer the complete transparent picture the premium brand promises: exactly where their project stands and exactly what they owe, with nothing hidden

### Edge cases & validation to handle
- Project spans a period before handover but after a temporary pause (e.g., an Overdue Payment Escalation triggered an installation hold): reflect this honestly and calmly, consistent with how the Overdue Payment Escalation screen's own pause-installation action was designed to require deliberate acknowledgment of its customer-facing impact
- Customer wants more technical detail than the simplified milestone view provides (a curious or technically-minded customer): support an optional 'more detail' expand rather than only the simplified default view, respecting that not all customers want the same level of detail
- Very early-stage project with minimal milestones reached yet: show an encouraging, accurately-scoped early-stage view rather than a mostly-empty timeline that feels unfinished or broken

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

**Layout-specific guidance for this screen (layout pattern: timeline):** This is the Ascension Line made literal and central to the screen: a vertical gold rail down one side, with each milestone as a node that's solid-gold-and-glowing once complete, gold-outlined for the current stage, and hollow/grey for what's ahead. Show both estimated and actual dates where both are meaningful, and be visually honest when a estimate has slipped rather than hiding the delay. Keep customer-facing timeline language in plain, warm terms; keep internal/staff-facing timeline views able to show more technical stage detail alongside the same visual rail.

### This screen is done when:
- [ ] A customer always has an honest, visually engaging view of real project progress
- [ ] Nothing shown here can ever contradict the actual underlying installation data used internally
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Project Status Tracker Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
