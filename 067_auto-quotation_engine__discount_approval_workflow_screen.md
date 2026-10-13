# Prompt 067 of 200 — Discount & Approval Workflow Screen
**Module 7 of 20: Auto-Quotation Engine** · Screen 7 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 066 (Quotation Version History Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Turns a surveyed building into a priced, branded, sendable quote automatically — grounded in real elevator cost structure (drive type, floors, GST, AMC) rather than generic placeholder numbers. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Discount & Approval Workflow Screen** screen, used by: **Admin, Sales**.

### Functional requirements
- Request form for any discount beyond what a sales user or the auto-negotiation bot is independently authorized to offer, with a reason field and the resulting margin impact shown clearly
- Approval queue for Admin (or a designated approver) to approve/reject with a one-tap decision and optional counter-suggestion
- Escalation path when a request is time-sensitive (e.g., customer waiting on a call) with a visible urgency flag
- Full audit trail of every discount ever requested, approved, or rejected, tied to the specific quote version it produced

### Data this screen touches
- `discount_request_id`
- `requested_discount_pct`
- `resulting_margin_pct`
- `approval_status`
- `approver_id`

### Business logic & automation rules
- This screen is the human-escalation counterpart to the margin-floor guardrail in the Cost Breakdown screen — anything the automated system won't allow on its own routes here rather than being silently blocked with no path forward
- An approved discount request automatically generates the corresponding new quotation version, closing the loop between approval and the actual customer-facing document without a manual re-entry step
- Rejected requests are preserved with the rejection reason, both for the requesting sales user's understanding and for spotting patterns (e.g., if one sales user requests unusually large discounts often)

### Edge cases & validation to handle
- Urgent request comes in while Admin is offline or unavailable: define a fallback (e.g., auto-approve up to a slightly wider secondary threshold, or auto-decline with an apology template to the customer) rather than leaving the customer waiting indefinitely
- A discount is approved but the customer takes days to respond, during which underlying costs change: re-validate the approved discount against current cost inputs before finalizing, rather than honoring a stale approval on outdated numbers
- Sales user submits the same discount request repeatedly after rejection without a new justification: flag the pattern for Admin visibility rather than treating each resubmission as fresh

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

**Layout-specific guidance for this screen (layout pattern: form):** Single-column layout with generous label-above-input spacing following the 8pt grid. Validate inline as the user types wherever practical, not only on submit — show a small success check the instant a field like a phone number or IFSC code becomes valid. Group related fields under a subtle section header with a Gold Hairline divider rather than one undifferentiated long list. For any form with more than 4 fields, auto-save a draft so a partial entry is never lost to an app close or a connectivity drop. Primary action button sticky at the bottom on mobile, full-width, disabled (not hidden) until required fields are valid so the user always sees what's left to do.

### This screen is done when:
- [ ] No discount beyond authorized limits can ever reach a customer without an explicit, logged approval
- [ ] Every approved discount cleanly produces its own proper quotation version
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Discount & Approval Workflow Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
