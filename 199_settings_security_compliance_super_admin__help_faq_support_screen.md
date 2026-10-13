# Prompt 199 of 200 — Help, FAQ & Support Screen
**Module 20 of 20: Settings, Security, Compliance & Super Admin** · Screen 9 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 198 (Legal/Contract Templates Repository Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The governance layer underneath everything else: branding, permissions, data privacy, and the master control panel befitting a single, trusted monitor of an enterprise-grade system. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Help, FAQ & Support Screen** screen, used by: **All roles**.

### Functional requirements
- Role-aware help content: a Surveyor sees FAQs about lead capture and commission, a Customer sees FAQs about payments and AMC, an Admin sees FAQs about configuration and system management
- Searchable knowledge base with clear categorization
- Direct escalation to Live Chat Support or a Service Request Ticket for anything the FAQ doesn't resolve
- Feedback mechanism on whether a given help article was actually useful, feeding continuous improvement similar to the Training Feedback screen's approach

### Data this screen touches
- `help_article_id`
- `relevant_roles[]`
- `category`
- `article_content`
- `helpfulness_feedback`

### Business logic & automation rules
- Role-awareness here mirrors the same role-based content philosophy already established in the Training Module Library, ensuring every user type sees genuinely relevant self-service help rather than a generic, undifferentiated FAQ list requiring them to hunt for what's actually relevant to their own role
- This screen exists as the natural first-line self-service layer before escalating to a human via Live Chat or a Service Ticket, reducing unnecessary load on Admin/support for questions genuinely answerable through good self-service content, consistent with the app's broader philosophy of automating the routine so human attention goes to genuine exceptions
- Helpfulness feedback creates the same kind of continuous-improvement loop already established for Training content, ensuring the help content itself gets better over time based on real user experience rather than being authored once and left static

### Edge cases & validation to handle
- A help article becomes outdated as the app's own features evolve (e.g., referencing a screen or process that's since changed): version and review help content periodically, similar to how SOP and legal templates are kept current, rather than allowing stale help content to actively confuse users
- A user's question isn't well-served by any existing FAQ category: support an easy path to suggest a new help topic (feeding into content-gap identification) alongside the direct escalation-to-human option, so genuine content gaps get identified and eventually filled
- Role-specific content needs updating for a newly introduced role (e.g., a future QC Inspector or Team Lead role): ensure the role-tagging system for help content can accommodate new roles cleanly, consistent with how other role-aware systems in the app are designed for extensibility

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
- [ ] Every user type finds genuinely relevant self-service help without wading through irrelevant content meant for other roles
- [ ] Help content quality improves over time based on real feedback rather than remaining static from initial authoring
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Help, FAQ & Support Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
