# Prompt 090 of 200 — Refund & Dispute Management Screen
**Module 9 of 20: Payments & Financing** · Screen 10 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 089 (Overdue Payment Escalation Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's automated payment follow-up plus a loan/financing option to collect the full amount sooner — modeled on real Indian AMC/GST/EMI conventions. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Refund & Dispute Management Screen** screen, used by: **Admin**.

### Functional requirements
- Queue of customer-raised payment disputes and refund requests, each with the original transaction, the customer's stated reason, and supporting evidence if provided
- Resolution workflow: Approve Full Refund, Approve Partial Refund, Reject with Explanation, each generating the appropriate accounting document (credit note, adjusted invoice)
- SLA tracking for dispute resolution time, since unresolved financial disputes are a meaningful trust and reputational risk
- Full audit trail per dispute from raised to resolved

### Data this screen touches
- `dispute_id`
- `original_transaction_id`
- `dispute_reason`
- `resolution_type`
- `resolution_amount`

### Business logic & automation rules
- Any approved refund here automatically triggers the correct downstream accounting adjustment (credit note against the relevant invoice) rather than requiring separate manual bookkeeping, keeping the financial records genuinely reconciled at all times
- This screen and the Payment Collection Dashboard both reflect the same underlying transaction and dispute-status data — a disputed payment shows consistently as 'Disputed' everywhere it appears, never differently in different screens
- Every dispute resolution decision requires a stated reason, both for the customer's own understanding and for spotting any recurring systemic issue (e.g., a specific supplier's parts causing repeat quality-related refund requests)

### Edge cases & validation to handle
- A refund is approved for a payment made via loan disbursement rather than direct customer payment: correctly route the refund back toward the financing partner relationship rather than incorrectly refunding the customer directly for money AIEC never held from them personally
- Dispute references a payment that's already been fully allocated toward supplier POs and technician payouts downstream: flag the broader financial ripple effect for Admin awareness before finalizing a refund decision
- Customer disputes a charge that was, on investigation, entirely valid: support a clear, respectfully worded rejection with full reasoning, preserving the relationship even when declining the request

### UI / design requirements
**AIEC Design System — "Alabaster & Ascension" (premium royal-white theme)**
- Palette: Alabaster White #F8F6F1 base, pure White #FFFFFF cards, Charcoal Ink #2A2723 text, Antique Gold #B8873D primary accent, Royal Emerald #0E4B3D secondary accent. Keep Error Red #B23B3B reserved strictly for genuine errors/safety alerts — never decorative.
- Type (Latin/English): "Fraunces" (serif, Google Font) for headings/hero numbers, "Plus Jakarta Sans" (Google Font) for all UI/body text, "IBM Plex Mono" tabular figures for money and KPI numbers.
- Type (Devanagari/Hindi & Marathi): "Fraunces" and "Plus Jakarta Sans" do NOT cover Devanagari glyphs — never let Hindi/Marathi text silently fall back to a generic system font. Pair "Martel" (Google Font) for headings and "Hind" (Google Font) for UI/body text in Hindi or Marathi, matching the same heading/body weight relationship as the Latin pair. Keep IBM Plex Mono for all numerals in every language — India's digital finance UI uses Western digits (0-9) regardless of the surrounding script, so amounts don't need a separate numeral font per language. All user-facing text (labels, buttons, headings, messages, notification templates) must render in the user's selected language (English / Hindi / Marathi) via the app's translation system — never hardcoded in one language.
- Icons: Phosphor Icons or Lucide, thin 1.5px line-weight, rounded caps, tinted Royal Emerald by default and Antique Gold when active/selected.
- Cards: 16-20px corner radius, soft ambient shadow (never a harsh flat drop-shadow), 1px hairline border tinted gold at ~15% opacity.
- Grid: 8pt spacing throughout, mobile-first single column, 16-24px screen margins, sticky bottom action bar for primary CTAs, minimum 48x48px touch targets.
- Theme modes: build every color as a CSS custom property (`--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-accent-primary`, `--color-accent-secondary`, `--color-success`, `--color-warning`, `--color-error`, `--color-border`) — never a hardcoded hex value in a component — so the whole app can switch instantly between 7 modes, stored as the signed-in user's own saved preference: **Light/Alabaster** (default — the warm-ivory palette above), **Snow White** (a crisper, cooler, brighter variant — pure `#FFFFFF` background, near-black `#1F2124` text, tighter shadows), **Dark** (warm near-black `#1A1815` background and `#242019` cards, soft off-white `#F0EDE6` text, brightened gold `#D4A855` and emerald `#2E9B78` accents), **Orbital** (a mission-control mood — deep space-black `#0B0E14` background, monospace telemetry-style labels, a fine dot-grid texture, brightened gold `#D9AE5C` and emerald `#35B48A` accents), **Lithium** (a matte, automotive-dashboard mood — flat near-black `#101012` surfaces, oversized clean numerals, desaturated matte gold `#C99A52` and emerald `#2E8968` accents, almost no shadow), **Pure** (an extreme-minimalist mood — pure white `#FFFFFF` background, hairline dividers instead of shadows, maximum whitespace, the same gold `#B8873D`/emerald `#0E4B3D` as Light mode used far more sparingly), and **System** (follows the device's own OS-level light/dark setting, mapping to Light/Alabaster or Dark). All 7 modes keep the *same* AIEC gold-and-emerald brand identity underneath — only mood, texture, density, and typography change between them, never the core brand colors, so the app never looks like it's borrowed someone else's visual identity. Full token values for all seven modes live in `000_DESIGN_SYSTEM.md` — use them exactly, don't invent new ones per screen.
- Signature element — "the Ascension Line": a thin gold vertical rail that fills upward as progress is made, literally a stylized elevator floor-indicator. Use it for every stage-based UI in the app: CRM pipeline, installation SOP steps, onboarding wizards, training progress, negotiation rounds. This is the one motif that should appear, consistently styled, across the entire app, and it should use the `--color-accent-primary` token so it looks correct in every theme mode automatically.
- Motion: subtle and purposeful only — a completed Ascension Line step gets a brief warm glow, cards fade-and-rise on load. No bouncy/spring physics; this is a premium, safety-adjacent brand, not a playful consumer app.
- Voice: confident, clear, warm but not casual, in whichever of the three languages is active. Save exclamation marks for genuine celebratory moments (a deal won, a badge earned).

**Layout-specific guidance for this screen (layout pattern: list):** Establish one consistent row anatomy (leading icon or avatar, primary line, secondary line, trailing status/value) and repeat it exactly across every row so the list reads instantly once learned. Sticky search/filter bar pinned above the scrolling content. Support swipe actions on mobile where a natural quick action exists (e.g., swipe to call, swipe to reassign). Design the empty state (zero results, zero data yet) with the same care as a populated list — a clear icon, one calm sentence, and a next action, never just blank space. Use skeleton row placeholders while loading, and paginate or virtualize any list that could realistically grow large.

### This screen is done when:
- [ ] Every dispute reaches a documented, accounting-consistent resolution within a reasonable SLA
- [ ] Refund decisions correctly account for money that may have already moved further downstream (to suppliers or workers)
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Refund & Dispute Management Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.

---

## Module 9 Checkpoint — before you start the next module

You've now finished all 10 screens in **Module 9: Payments & Financing**. Before moving on to Module 10:

1. Click through every screen you just built in this module, start to finish, once, as if you were the actual user.
2. Spot-check 2-3 of the most important screens from earlier modules — you don't need to re-test everything back to Prompt 001, just confirm nothing visibly broke.
3. If anything looks wrong, send one more small, targeted prompt to fix it now. Don't carry a visible bug forward into the next module — regressions compound, and they're far cheaper to fix the moment you spot them than 50 screens later.
4. Optional but recommended: this is a natural point to download a ZIP backup or note your current AI Studio checkpoint/version, so you always have a known-good rollback point behind you.

This costs about two minutes and saves far more than that in confused debugging later.
