# Prompt 174 of 200 — Payment & Installments Screen (customer view)
**Module 18 of 20: Customer App/Portal** · Screen 4 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 173 (Document Vault Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The customer's own window into their project — transparent, premium, and reassuring from first survey visit through years of AMC service. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Payment & Installments Screen (customer view)** screen, used by: **Customer**.

### Functional requirements
- Customer's own view into their Payment Stage Schedule, Payment Collection status, and full Payment Receipt & History — presented together in one customer-facing screen for a complete financial picture
- Direct 'Pay Now' action for any currently due stage, linking straight to the Online Payment Gateway Checkout
- Clear remaining balance and, where relevant, a link to explore the Loan/EMI Application option
- Upcoming payment reminders shown proactively here as well as through external channels

### Data this screen touches
- `deal_id`
- `payment_stage_list`
- `current_due_amount`
- `running_balance_remaining`
- `loan_option_available_flag`

### Business logic & automation rules
- This screen brings together data from several backend screens already defined in the Payments module (Payment Stage Schedule, Payment Collection Dashboard's customer-relevant slice, Payment Receipt & History) into one coherent customer-facing view, since a customer shouldn't need to understand AIEC's internal module boundaries to understand their own simple question of 'what do I owe and when'
- The loan option visibility here is contextual and non-pushy — surfaced as a helpful available option rather than aggressive upselling, consistent with the premium brand's tone and the genuinely optional nature of the financing offer
- This is one of the most frequently-visited customer screens in practice, so its design deliberately prioritizes absolute clarity (what's due, when, how much) over comprehensive detail, with drill-down available for anyone wanting more

### Edge cases & validation to handle
- A payment is genuinely disputed and in the Refund & Dispute Management process: reflect this status honestly and calmly rather than showing a confusing 'overdue' flag for something the customer has already raised a legitimate question about
- Customer already paid via an offline method (e.g., bank transfer) that Admin hasn't yet manually reconciled: show a clear 'payment received, confirming' state if there's evidence of this, rather than the customer worrying their payment wasn't received when it may simply be in a brief reconciliation lag
- Multiple linked projects for the same customer (a repeat/multi-site customer): ensure each project's payment schedule is clearly distinguished rather than confusingly combined into one blended view

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
- [ ] A customer can answer 'what do I owe and when' in seconds without needing to understand AIEC's internal systems
- [ ] The loan/financing option is presented helpfully without ever feeling like aggressive upselling
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Payment & Installments Screen (customer view) screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
