# Prompt 184 of 200 — Escalation Matrix Configuration Screen
**Module 19 of 20: Automation Rules & Notification Engine** · Screen 4 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 183 (Notification Templates & Channels Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The connective tissue implementing 'fully automated, only monitor by one person' as an actual configurable system rather than a marketing phrase. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Escalation Matrix Configuration Screen** screen, used by: **Admin**.

### Functional requirements
- Defines exactly who gets notified, in what order, and after what delay, when something isn't acknowledged or resolved in time — covering scenarios like an unacknowledged SOS, an unresolved Critical exception, or a payout failure
- Fallback/backup contact configuration for when the primary Admin is unreachable (relevant given the brief's single-person-monitoring model actually still needs a backup path for true emergencies)
- Escalation tier visualization showing the full chain for each scenario type
- Test/drill mode to verify the escalation chain actually works as configured, without waiting for a real emergency to discover a gap

### Data this screen touches
- `escalation_scenario`
- `escalation_tier_chain[]`
- `escalation_delay_per_tier`
- `backup_contact_info`
- `last_drill_test_date`

### Business logic & automation rules
- This screen directly configures the actual escalation behavior referenced by the Emergency/Escalation Alert screen's own logic ('Admin is unreachable and doesn't acknowledge within a configurable window: escalate via a secondary channel') and by the Alerts & Exceptions Dashboard's Critical-item handling — one configuration source for escalation behavior across every scenario that needs it
- Backup contact configuration is a deliberate, honest acknowledgment that a genuinely single-person-monitored business still needs a real fallback plan for true emergencies (e.g., a site safety incident) when that one person is temporarily unreachable, rather than the system pretending no fallback is ever needed
- Drill/test mode exists because an escalation chain that's never been tested is a real operational risk — discovering a gap during an actual emergency is far worse than discovering it during a deliberate, low-stakes test

### Edge cases & validation to handle
- The configured backup contact is also unreachable during a genuine emergency (a true worst-case scenario): define what happens next in the chain (e.g., a third fallback, or a note that this represents the actual limit of the current escalation design) rather than the chain silently ending with no further defined action
- A drill test is run and reveals a real gap (e.g., a notification channel silently failing): this should be treated with real urgency once discovered, prompting an actual fix, not just a passive test result logged and forgotten
- Different scenario types genuinely warrant different escalation chains (an SOS versus a routine payout failure): ensure the configuration structure supports meaningfully different chains per scenario type rather than forcing one universal escalation path onto every kind of issue

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
- [ ] Every critical scenario in the app has a defined, tested escalation path that doesn't dead-end if the primary contact is unreachable
- [ ] Escalation chains are periodically verified through drills rather than only being trusted blindly until a real emergency reveals a gap
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Escalation Matrix Configuration Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
