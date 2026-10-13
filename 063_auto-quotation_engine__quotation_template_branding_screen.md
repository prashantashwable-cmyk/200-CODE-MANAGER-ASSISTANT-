# Prompt 063 of 200 — Quotation Template & Branding Screen
**Module 7 of 20: Auto-Quotation Engine** · Screen 3 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 062 (Cost Breakdown & Profit Margin Calculator Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Turns a surveyed building into a priced, branded, sendable quote automatically — grounded in real elevator cost structure (drive type, floors, GST, AMC) rather than generic placeholder numbers. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Quotation Template & Branding Screen** screen, used by: **Admin**.

### Functional requirements
- Design controls for the customer-facing quotation PDF/message layout: logo placement, the premium royal-white theme applied consistently, footer terms and AIEC's brand tagline
- Multiple template variants selectable per deal type (Residential Standard, Premium/Luxury, Commercial Bulk)
- Legal boilerplate section (validity period, standard terms, no-liability disclaimers) centrally managed so it's never manually retyped per quote
- Live preview pane showing exactly what the customer will see

### Data this screen touches
- `template_variant_id`
- `logo_asset`
- `legal_boilerplate_text`
- `validity_period_days`
- `brand_theme_tokens`

### Business logic & automation rules
- Every generated quotation pulls its visual template and legal boilerplate from here — no individual quote can have ad hoc, un-reviewed legal language slipped in by a sales user
- Validity period set here becomes an enforced expiry on every quote using that template, after which the Quotation Analytics and Negotiation modules treat it as lapsed rather than open-ended
- Brand theme tokens here match the same design system used across the rest of the AIEC app, so a customer's quote visually matches the WhatsApp thread and eventual customer portal, reinforcing trust

### Edge cases & validation to handle
- Legal boilerplate needs a jurisdiction-specific clause added (state Lift Act references vary): support a state-specific override block layered on top of the national default text
- A template is edited while quotes referencing the old version are still open with customers: existing open quotes keep the version they were sent with, only new quotes reflect the edit
- Logo asset upload is a poor-quality image: warn about resolution/print-quality suitability before accepting, since this appears on a customer-facing professional document

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

**Layout-specific guidance for this screen (layout pattern: settings):** Group related settings under clear section headers with generous spacing between groups — settings screens fail when everything looks like one undifferentiated list. Toggle switches right-aligned and consistently sized. Always show the current value next to a setting's name (e.g., "Reminder cadence: 3 days before due") rather than hiding it until tapped into a sub-screen. Any destructive or high-consequence action (deactivating a partner, changing a margin floor, revoking a session) gets distinct visual treatment (e.g., Error Red text or icon) and a confirmation step — never sits visually identical to a routine, reversible setting.

### This screen is done when:
- [ ] Every quotation a customer receives is visually consistent, legally sound, and never manually re-typed
- [ ] Changing the template never silently alters a quote a customer has already received
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Quotation Template & Branding Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
