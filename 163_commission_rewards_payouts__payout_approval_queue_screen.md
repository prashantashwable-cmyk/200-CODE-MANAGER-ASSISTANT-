# Prompt 163 of 200 — Payout Approval Queue Screen
**Module 17 of 20: Commission, Rewards & Payouts** · Screen 3 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 162 (Stage-Wise Payout Tracker Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'each stage completion give workers payment, commission, competition rewards' made concrete and auditable — one ledger every partner-facing screen elsewhere in the app reads from. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Payout Approval Queue Screen** screen, used by: **Admin**.

### Functional requirements
- Queue of commission/payout entries that have reached Pending status and require Admin approval before actual disbursement, with full context (which deal/job triggered it, which rule calculated the amount) shown for verification
- One-tap Approve or Hold (with reason) per entry, plus efficient batch-approval for routine, low-risk entries
- Direct link to any related open dispute, damaged-parts report, or QC issue that might warrant holding a specific payout pending resolution
- Approval here is what actually triggers the Automated Payout Disbursement engine

### Data this screen touches
- `payout_entry_id`
- `triggering_record_reference`
- `calculated_amount`
- `approval_status`
- `hold_reason`

### Business logic & automation rules
- This mirrors the same human-checkpoint-before-real-money-moves pattern already established in the Supplier Payment Approval screen, applied consistently to worker payouts — Admin retains a final sanity-check role even in a highly automated system, appropriate to the brief's 'monitor by one person' model where the person's real job is exception-handling and final sign-off, not manual calculation
- Any related open issue (an unresolved QC snag traced to this specific technician's work, an open dispute) surfaces as a clear hold-consideration flag, directly connecting quality and payment in the worker-payment context exactly as it does in the Supplier Payment Approval screen's own logic
- Batch approval for routine entries keeps the Admin's actual workload proportionate to genuinely exceptional cases, consistent with the app's broader design philosophy of automating the routine and surfacing only the meaningful exceptions

### Edge cases & validation to handle
- A payout entry's calculated amount seems unusually high or low compared to typical entries of that type: this kind of statistical anomaly is worth a lightweight automatic flag for Admin's attention before batch-approving alongside routine entries, catching a possible rule-configuration or data error before real money moves
- Admin holds a payout pending a QC issue's resolution, and the issue takes an extended time to resolve: ensure the held partner isn't left in indefinite unexplained limbo — a status visible to them (even if the specific reason is kept appropriately professional) supports fairness and trust
- Urgent payout needed outside the normal approval cadence (e.g., a partner's genuine financial hardship): support an expedited path while still preserving the essential approval checkpoint, rather than either an inflexible process or bypassing oversight entirely

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
- [ ] No payout reaches actual disbursement without either routine batch approval or a specific, reasoned hold
- [ ] Statistical anomalies in payout amounts are caught before money moves, not after
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Payout Approval Queue Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
