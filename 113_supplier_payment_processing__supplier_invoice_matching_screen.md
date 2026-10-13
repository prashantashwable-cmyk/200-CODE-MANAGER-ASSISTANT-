# Prompt 113 of 200 — Supplier Invoice Matching Screen
**Module 12 of 20: Supplier Payment Processing** · Screen 3 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 112 (Milestone-Linked Payment Release Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'then payment made to supplier & manufacturer' stage, built on real milestone-linked and retention-based terms so cash only moves when it should. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Supplier Invoice Matching Screen** screen, used by: **Admin**.

### Functional requirements
- Three-way match view comparing the Purchase Order, the supplier's submitted invoice, and the confirmed delivery/receipt record side by side
- Automatic flagging of any mismatch (quantity, price, or item discrepancy) between the three documents before payment can proceed
- Supplier invoice upload/submission interface for suppliers to submit their own invoices directly rather than only via email
- Clean match confirmation that unlocks the payment for that line item

### Data this screen touches
- `po_id`
- `supplier_invoice_doc`
- `matched_quantity_check`
- `matched_price_check`
- `match_status`

### Business logic & automation rules
- Three-way matching (PO, invoice, delivery receipt) is a standard, real-world accounts-payable control specifically included here to protect the business's financial integrity in an asset-light model where AIEC is coordinating payments to many independent external parties
- A payment cannot reach the Supplier Payment Approval queue in a clean, standard way until it passes three-way match — any mismatch instead routes to a dispute/reconciliation path rather than silently proceeding on an unverified invoice
- Supplier-submitted invoices are matched against the PO's own recorded pricing (from the Purchase Order Generator) and the confirmed delivery quantities (from Material Received Confirmation), never against an independently re-entered figure

### Edge cases & validation to handle
- Supplier's invoiced price differs slightly from the PO due to a legitimate agreed adjustment (e.g., an approved price change mid-order): support referencing that specific approved adjustment as the basis for accepting the difference, rather than treating every mismatch as equally suspicious
- Partial delivery means only part of the PO's invoice should currently match: support partial invoice matching against partial delivery confirmation rather than requiring the full order to be complete before any payment can proceed
- Supplier hasn't submitted a formal invoice yet even though delivery is confirmed: block payment progression specifically on missing invoice documentation, distinctly from a mismatch, so Admin knows exactly what's needed to unblock it

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
- [ ] No supplier payment proceeds without passing a genuine three-way match against real PO, delivery, and invoice records
- [ ] Legitimate approved exceptions are distinguishable from genuine unexplained discrepancies
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Supplier Invoice Matching Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
