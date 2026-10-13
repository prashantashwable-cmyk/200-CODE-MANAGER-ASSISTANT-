# Prompt 200 of 200 — App Version, Changelog & Feedback Screen
**Module 20 of 20: Settings, Security, Compliance & Super Admin** · Screen 10 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 199 (Help, FAQ & Support Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The governance layer underneath everything else: branding, permissions, data privacy, and the master control panel befitting a single, trusted monitor of an enterprise-grade system. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **App Version, Changelog & Feedback Screen** screen, used by: **All roles**.

### Functional requirements
- Current app version display with a clear, plain-language changelog of recent updates and improvements, avoiding raw technical release notes in favor of genuinely user-relevant descriptions of what changed
- General product feedback/suggestion submission distinct from role-specific training or help feedback, for broader ideas about the app itself
- Update prompt if a newer version is available, with a clear explanation of what's new before prompting to update
- Acknowledgments/credits section respecting any third-party services or open-source components the app depends on, where appropriate

### Data this screen touches
- `current_version`
- `changelog_entries[]`
- `feedback_submission`
- `update_available_flag`
- `last_checked_timestamp`

### Business logic & automation rules
- Plain-language changelog entries reflect the same 'simple but significant, practically working' design philosophy the brief emphasizes throughout — even a technical changelog should be written for genuine human understanding, not as raw internal engineering notes
- General product feedback captured here is distinct from and complements the specific in-context feedback mechanisms elsewhere (Training Feedback, Customer Feedback & Rating), providing a home for broader 'here's an idea for the app itself' input from any user type, which is valuable given how many different roles interact with this system daily
- This screen represents the natural, appropriate place for the app's own continuous improvement conversation with its users to live, fitting for a system explicitly designed to be iterated on rather than a rigid one-shot build, consistent with the very philosophy behind building this app through a sequence of iterative prompts rather than attempting to build the whole thing at once

### Edge cases & validation to handle
- An update introduces a change that affects a user's established workflow (e.g., a screen's layout changes meaningfully): ensure the changelog clearly flags workflow-affecting changes distinctly from minor bug fixes, so users aren't caught off guard by something that meaningfully affects how they do their daily work
- Feedback submitted here overlaps with something already tracked elsewhere (e.g., a feature request that's actually a duplicate of an existing known issue): support at least basic deduplication awareness so Admin isn't seeing the exact same suggestion logged as if it were entirely new each time
- Update is available but a user is on an older device with compatibility concerns: provide clear, honest information about compatibility rather than an update prompt that might not actually be usable on their specific device

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
- [ ] Every user can understand what's changed in the app in genuinely plain, relevant language
- [ ] There's one clear, accessible home for general product feedback and ideas from any type of user
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the App Version, Changelog & Feedback Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.

---

## Final Module Checkpoint — you've built all 200 screens

Click through the entire app once, role by role (Admin, Surveyor, Technician, Customer, Supplier — use the Demo Mode tab to switch between them quickly). Then open `000_RESEARCH_NOTES_AI_STUDIO_AND_DOMAIN.md` for a short list of sensible next steps (real payment gateway keys, real WhatsApp Business API credentials, a security review before handling real customer money) before treating this as genuinely production-ready rather than a very complete demo.
