# Prompt 187 of 200 — Audit Log of Automated Actions Screen
**Module 19 of 20: Automation Rules & Notification Engine** · Screen 7 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 186 (System Health & Bot Monitoring Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The connective tissue implementing 'fully automated, only monitor by one person' as an actual configurable system rather than a marketing phrase. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Audit Log of Automated Actions Screen** screen, used by: **Admin**.

### Functional requirements
- Complete, searchable, append-only log of every consequential action any automation in the app has ever taken: a message sent, a PO auto-drafted, a payout auto-initiated, a stage auto-transitioned
- Filter by automation type, by date range, or by affected record
- Full detail per entry: exactly which rule fired, what data it acted on, and what the resulting action was
- Export capability for compliance, audit, or dispute-investigation purposes

### Data this screen touches
- `audit_entry_id`
- `automation_source`
- `triggering_condition`
- `action_taken`
- `affected_record_id`

### Business logic & automation rules
- This is deliberately the single, comprehensive, permanent record of everything the automated system has ever done on its own initiative, existing specifically because a genuinely 'fully automated, monitored by one person' business needs an airtight way to answer 'why did the system do that' for literally any past automated action, supporting both trust and accountability
- This log is append-only and immutable, consistent with every other audit-trail principle established throughout the app (Lead Detail timeline, commission ledgers, payment history) — automated actions deserve the same permanent, trustworthy record-keeping as human actions, arguably more so given their sheer volume and the reduced opportunity for real-time human sanity-checking of each one
- This screen is the ultimate backstop for the transparency and accountability the brief's 'zero risk model' depends on — if a dispute or question ever arises about why the system did something, the answer is always fully reconstructable here, never lost or unclear

### Edge cases & validation to handle
- An automated action was later found to be wrong due to a rule misconfiguration (not a bug, just an unintended consequence of how a rule was set up): the log entry itself remains an accurate historical record of what actually happened and why, even though the underlying rule was subsequently corrected — history isn't rewritten, only future behavior changes
- Extremely high volume of automated actions at scale (thousands per day once the business is running at full automation): ensure this log remains genuinely searchable and useful rather than an unusable firehose, likely requiring strong indexing/search rather than only chronological browsing
- A specific past automated action is central to resolving a customer or partner dispute: ensure this log can be reliably searched and referenced as authoritative evidence, consistent with its role supporting the no-liability model's documentation requirements throughout the app

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
- [ ] Any past automated action, however long ago, can be fully explained: what rule, what data, what result
- [ ] This log remains genuinely searchable and useful even at high automation volume, not just a theoretically complete but practically unusable record
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Audit Log of Automated Actions Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
