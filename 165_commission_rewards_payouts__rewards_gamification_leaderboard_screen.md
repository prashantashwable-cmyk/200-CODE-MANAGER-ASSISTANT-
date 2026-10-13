# Prompt 165 of 200 — Rewards & Gamification Leaderboard Screen
**Module 17 of 20: Commission, Rewards & Payouts** · Screen 5 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 164 (Automated Payout Disbursement Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'each stage completion give workers payment, commission, competition rewards' made concrete and auditable — one ledger every partner-facing screen elsewhere in the app reads from. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Rewards & Gamification Leaderboard Screen** screen, used by: **Surveyor, Technician, Admin**.

### Functional requirements
- Partner-facing view of the current active leaderboard(s) for whatever competition/contest is currently running, consistent in design with the Admin-facing Worker Performance Leaderboard but framed with motivational, celebratory tone
- Real-time or near-real-time standing updates so the competitive element feels genuinely alive
- Clear, honest display of exactly what's at stake (the reward) and how much time remains in the contest period
- Personal rank plus a 'how close to the next rank up' indicator to keep engagement high even for partners not currently in the very top position

### Data this screen touches
- `contest_id`
- `partner_id`
- `current_rank`
- `metric_value`
- `gap_to_next_rank`

### Business logic & automation rules
- This is the partner-facing counterpart to the Admin's Worker Performance Leaderboard and Competition/Contest Configuration screens — one underlying ranking computation, viewed from the Admin's management perspective in one place and the partner's motivational perspective here
- 'Gap to next rank' is a deliberate motivational design choice giving every partner, not just current leaders, a concrete reason to stay engaged, consistent with the brief's emphasis on genuine incentive-driven culture across the whole workforce, not just top performers
- Standings here must always exactly match what Admin's own leaderboard view shows — any discrepancy would undermine partner trust in the fairness of the entire incentive system

### Edge cases & validation to handle
- A contest is very close to ending with standings changing rapidly: ensure updates feel genuinely current rather than stale, since the excitement of a close competition depends on partners trusting the numbers they're seeing are real-time
- No contest is currently active: show a friendly, honest 'no active contest right now, check back soon' state rather than an empty or broken-feeling screen
- A partner's standing changes due to a later data correction (e.g., a previously miscounted lead is corrected): reflect the correction transparently rather than a standing silently shifting with no explanation, since fairness and trust in the ranking matter enormously for a genuinely motivating incentive system

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

**Layout-specific guidance for this screen (layout pattern: leaderboard):** Ranked list with the rank number itself given real visual weight (large "Fraunces" numeral for top ranks). Always keep the current user's own row visible — pin or highlight it even if their actual rank is far down the list, so scrolling to find yourself is never required. Row anatomy: rank, avatar/photo, name, primary metric, small trend indicator. Give the top 3 a slightly elevated visual treatment (e.g., a subtle gold border) without tipping into gaudy trophy-and-confetti territory — this should still read as premium and calm, motivating rather than gamified in a childish way.

### This screen is done when:
- [ ] Every partner has a genuinely motivating, transparent, real-time view of their competitive standing
- [ ] Standings shown to partners always exactly match Admin's own view, with zero discrepancy undermining trust
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Rewards & Gamification Leaderboard Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
