# Prompt 166 of 200 — Badges & Milestones Screen
**Module 17 of 20: Commission, Rewards & Payouts** · Screen 6 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 165 (Rewards & Gamification Leaderboard Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'each stage completion give workers payment, commission, competition rewards' made concrete and auditable — one ledger every partner-facing screen elsewhere in the app reads from. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Badges & Milestones Screen** screen, used by: **Surveyor, Technician**.

### Functional requirements
- Comprehensive personal collection view of every badge/milestone ever earned across performance, training certification, and tenure categories, in one place
- Progress toward the next few achievable badges shown clearly, giving partners visible, achievable near-term goals
- Shareable badge display for a partner's own professional pride/portfolio
- Rarity/prestige indication for particularly hard-to-earn badges, adding an aspirational element

### Data this screen touches
- `partner_id`
- `badge_id`
- `badge_category`
- `earned_date`
- `badge_rarity_tier`

### Business logic & automation rules
- This screen unifies badges from genuinely different underlying sources (performance milestones from the Leaderboard/Rewards system, training certifications from the Training module) into one coherent personal achievement record, since from the partner's own perspective these all represent meaningful recognition regardless of which backend system technically produced them
- Progress-toward-next-badge display draws on real, live underlying metrics (actual lead counts, actual certification progress) rather than a static list, so it stays genuinely accurate and motivating as a partner's real activity progresses
- Rarity tiering is calculated from actual achievement statistics across the whole partner base (e.g., a badge only 5% of partners have earned is genuinely rarer and more prestigious), keeping the aspirational framing honest rather than an arbitrarily assigned label

### Edge cases & validation to handle
- A badge's earning criteria change over time (mirroring the same principle already established for Training's Certification Badge screen): a partner's already-earned badge is honored under the rules active when they earned it, never retroactively revoked by a later criteria change
- Very new partner has no badges yet: show an encouraging 'here's what you can work toward first' framing rather than a discouraging empty collection
- Rarity tier shifts over time as more partners achieve a previously-rare badge (the whole workforce improves): reflect this honestly rather than freezing rarity at its original calculation, since accurate rarity is what maintains the badge's genuine prestige value

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
- [ ] Partners have one coherent, motivating view of every kind of recognition they've earned, regardless of its underlying source system
- [ ] Rarity and prestige framing remains honest and grounded in real, current achievement statistics
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Badges & Milestones Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
