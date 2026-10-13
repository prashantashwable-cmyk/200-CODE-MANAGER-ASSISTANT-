# Prompt 185 of 200 — SLA Timer & Breach Alert Screen
**Module 19 of 20: Automation Rules & Notification Engine** · Screen 5 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 184 (Escalation Matrix Configuration Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The connective tissue implementing 'fully automated, only monitor by one person' as an actual configurable system rather than a marketing phrase. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **SLA Timer & Breach Alert Screen** screen, used by: **Admin**.

### Functional requirements
- Consolidated view of every SLA-governed process across the app (customer reply response time, payment dispute resolution, payout dispute resolution, delivery delay thresholds) and their current status relative to their defined target
- Breach alerts surfaced with the same priority-based visibility as other Critical items in the Alerts & Exceptions Dashboard
- Trend view showing whether SLA compliance is improving or declining over time, per category
- Direct link into the specific record behind any breach for immediate action

### Data this screen touches
- `sla_category`
- `target_duration`
- `current_elapsed_duration`
- `breach_status`
- `related_record_id`

### Business logic & automation rules
- This screen synthesizes SLA timers already individually tracked in their respective specialized screens (Customer Reply Inbox, Refund & Dispute Management, Payout Dispute) into one consolidated cross-system view, giving Admin a single place to assess overall service-level health rather than needing to check each module separately
- SLA breach severity and escalation follows the same Escalation Matrix logic already configured elsewhere, ensuring one consistent approach to 'this is taking too long and someone needs to know' across every different kind of time-sensitive process in the app
- Trend tracking over time supports genuine continuous improvement — if a specific SLA category consistently trends toward breach, that's a signal worth investigating (is the target unrealistic, or is there a genuine process bottleneck) rather than just repeatedly reacting to individual breaches

### Edge cases & validation to handle
- An SLA target itself may be unrealistic for current business volume/capacity (e.g., a response-time target set when the business was much smaller): this screen's trend data should support Admin's periodic reconsideration of whether SLA targets themselves need adjustment, not just enforcement of existing targets
- Multiple SLA categories breach simultaneously during an unusually busy period: ensure this consolidated view helps Admin triage effectively (which breach is most consequential) rather than presenting an undifferentiated wall of alerts
- A record's SLA clock should pause under specific fair circumstances (e.g., waiting on the customer's own response, outside business hours) consistent with the pause-logic already established in the Customer Reply Inbox screen: ensure this consolidated view respects the same fair-pausing logic rather than a simpler, less fair blanket timer

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
- [ ] Admin has one consolidated view of service-level health across every time-sensitive process in the app
- [ ] SLA trend data supports genuine, informed reconsideration of whether targets themselves remain realistic as the business evolves
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the SLA Timer & Breach Alert Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
