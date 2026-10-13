# Prompt 162 of 200 — Stage-Wise Payout Tracker Screen
**Module 17 of 20: Commission, Rewards & Payouts** · Screen 2 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 161 (Commission Rules Engine Configuration Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'each stage completion give workers payment, commission, competition rewards' made concrete and auditable — one ledger every partner-facing screen elsewhere in the app reads from. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Stage-Wise Payout Tracker Screen** screen, used by: **Admin**.

### Functional requirements
- Admin's aggregate view across the entire workforce of every commission/payout entry currently Pending, Approved, or Paid, mirroring the individual Surveyor Commission Tracker but at a whole-business scale
- Breakdown by stage/trigger type (capture bonus, conversion bonus, installation completion, QC fee) showing total business-wide spend per category
- Filter by partner, by date range, or by status
- Total pending-approval amount prominently shown, since this represents a near-term cash obligation worth tracking alongside other cash-flow visibility elsewhere in the app

### Data this screen touches
- `payout_entry_id`
- `partner_id`
- `trigger_type`
- `amount`
- `status`

### Business logic & automation rules
- This is the single business-wide aggregate view over the exact same underlying commission ledger individual partners see their own slice of in their personal Commission Tracker screens — one ledger, viewed at individual and aggregate levels depending on the audience, never two separately maintained datasets
- Total pending-approval amount feeds into the same broader cash-flow awareness as the Financial Overview screen's upcoming outflows, since worker payouts are a real, recurring cash commitment alongside supplier payments
- This dashboard is what makes the brief's 'each stage completion gives workers payment, commission, competition rewards' principle auditable and manageable at scale, rather than each individual payout being tracked informally

### Edge cases & validation to handle
- A very high-volume period (many deals closing, many jobs completing) produces a large payout queue: ensure the aggregate view remains genuinely useful for spotting anything unusual rather than just a large undifferentiated number
- A specific payout category shows unexpectedly high total spend for a period: this should be visible enough for Admin to investigate whether it reflects genuinely higher activity (good) or a possible rule-configuration issue (needs correction)
- Payout entries span multiple currencies or payment methods (rare, but possible for certain partner types): ensure the aggregate correctly and clearly handles this rather than blending incompatible figures

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

**Layout-specific guidance for this screen (layout pattern: dashboard):** Card-based grid: 2 columns on mobile, 3-4 on wider viewports. Give the single most important figure top-left reading position. Every KPI card follows the same anatomy — small label, large "Fraunces" or "IBM Plex Mono" number, small trend arrow with percentage — so the eye learns the pattern once and reads every card instantly thereafter. Every card should feel tappable (subtle shadow lift on press) and lead somewhere more detailed. Use skeleton-loading placeholders matching each card's real shape while data loads, never a blank space or a lone centered spinner. Support pull-to-refresh on mobile.

### This screen is done when:
- [ ] Admin has complete, always-consistent visibility into total business-wide payout obligations at every status stage
- [ ] This aggregate view never disagrees with what any individual partner sees in their own personal tracker
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Stage-Wise Payout Tracker Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
