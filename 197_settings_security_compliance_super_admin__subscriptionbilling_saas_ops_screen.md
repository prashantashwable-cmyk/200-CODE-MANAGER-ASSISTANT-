# Prompt 197 of 200 — Subscription/Billing (SaaS ops) Screen
**Module 20 of 20: Settings, Security, Compliance & Super Admin** · Screen 7 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 196 (Backup & Data Export Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The governance layer underneath everything else: branding, permissions, data privacy, and the master control panel befitting a single, trusted monitor of an enterprise-grade system. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Subscription/Billing (SaaS ops) Screen** screen, used by: **Admin**.

### Functional requirements
- If AIEC's own use of this app involves any underlying platform/hosting subscription costs (e.g., the Google AI Studio/Firebase hosting tier, SMS/WhatsApp API usage billing, payment gateway fees), this screen consolidates visibility into those operational software costs
- Current plan/tier status per underlying service dependency, with upgrade/downgrade guidance if usage patterns suggest a different tier would be more cost-effective
- Usage trend per billed service (e.g., WhatsApp messages sent this month, SMS volume, Cloud hosting resource consumption) to help Admin understand what's actually driving software operating costs
- Renewal/billing date reminders so no critical underlying service lapses due to an unnoticed billing issue

### Data this screen touches
- `service_name`
- `current_tier`
- `monthly_usage_metric`
- `monthly_cost`
- `renewal_date`

### Business logic & automation rules
- This screen exists because the business's own 'zero risk model' should extend to its own operational technology costs — a business genuinely striving to run on minimal human monitoring cannot afford to have a critical underlying service (hosting, messaging API, payment gateway) unexpectedly lapse due to an unnoticed billing failure, which would be a uniquely embarrassing and avoidable kind of business risk
- Usage trend visibility directly supports smart, informed decisions about which underlying service tier genuinely fits the business's actual current scale, avoiding both overpaying for unused capacity and risking under-provisioning as the business grows
- This is a distinctly different concern from the Financial Overview's customer/supplier-facing cash flow — this is specifically about the cost of the operational technology stack itself, a real and growing cost category worth its own dedicated visibility as the business scales

### Edge cases & validation to handle
- An underlying service's billing fails silently (e.g., an expired payment card on file for a critical API): this is exactly the kind of quietly catastrophic risk (the whole automated system depending on that service could simply stop working) that deserves the same proactive, loud alerting as any other Critical exception in the app
- Usage spikes unexpectedly in a way that significantly increases cost for a period (e.g., an unusually high-volume recruitment or marketing period driving up SMS/WhatsApp costs): this should be visible and understandable rather than just a surprising bill, connecting cost directly to the business activity that drove it
- A service tier change is being considered: ensure any potential functionality trade-offs (not just cost) are clearly presented, since a lower tier might impose limits (e.g., a lower API rate limit) that could genuinely affect business operations, not just cost

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

**Layout-specific guidance for this screen (layout pattern: settings):** Group related settings under clear section headers with generous spacing between groups — settings screens fail when everything looks like one undifferentiated list. Toggle switches right-aligned and consistently sized. Always show the current value next to a setting's name (e.g., "Reminder cadence: 3 days before due") rather than hiding it until tapped into a sub-screen. Any destructive or high-consequence action (deactivating a partner, changing a margin floor, revoking a session) gets distinct visual treatment (e.g., Error Red text or icon) and a confirmation step — never sits visually identical to a routine, reversible setting.

### This screen is done when:
- [ ] No critical underlying operational service can lapse due to an unnoticed billing issue
- [ ] Admin can make informed technology-cost decisions grounded in real usage trends, understanding what's actually driving spend
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Subscription/Billing (SaaS ops) Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
