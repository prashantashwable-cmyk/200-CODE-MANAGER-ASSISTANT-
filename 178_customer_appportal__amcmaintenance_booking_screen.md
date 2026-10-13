# Prompt 178 of 200 — AMC/Maintenance Booking Screen
**Module 18 of 20: Customer App/Portal** · Screen 8 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 177 (Feedback & Rating Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The customer's own window into their project — transparent, premium, and reassuring from first survey visit through years of AMC service. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **AMC/Maintenance Booking Screen** screen, used by: **Customer**.

### Functional requirements
- Self-service booking for a scheduled AMC maintenance visit, or an ad hoc service call for existing AMC subscribers, showing available slots and confirming a technician assignment
- Clear AMC coverage status shown upfront (active, expiring soon, lapsed) with a renewal prompt if relevant before booking proceeds
- Booking confirmation with the assigned technician's basic profile (name, photo) for reassurance ahead of the visit
- Direct link into the same Live Shipment/Technician Tracking pattern on the day of the scheduled visit, so the customer can see their technician's live arrival status just as they could for original installation delivery

### Data this screen touches
- `customer_id`
- `amc_status`
- `preferred_slot`
- `assigned_technician_id`
- `booking_confirmation_status`

### Business logic & automation rules
- This screen is the recurring-revenue-relationship counterpart to the original installation scheduling flow, deliberately reusing the same technician-assignment, live-tracking, and confirmation patterns established for installation so the ongoing AMC experience feels just as premium and well-organized as the original sale, reinforcing the value of the recurring relationship
- AMC status shown here reads directly from the Warranty & AMC Registration screen's data, and an expiring/lapsed status here is the natural point-of-need moment to prompt renewal, more effective than a disconnected renewal reminder arriving separately without an obvious immediate action to take
- Technician assignment for a service visit reuses the same skill-tag eligibility and Route Optimization-style proximity/workload matching logic used for original installation job assignment, ensuring service visits are staffed just as competently as new installations

### Edge cases & validation to handle
- Customer's AMC has lapsed and they attempt to book a covered maintenance visit: clearly explain the lapsed status and offer straightforward renewal (or a paid ad hoc visit as an alternative) rather than a confusing block with no clear next step
- No technician with the right specific skill tag (e.g., this particular drive type) is available in the customer's area within a reasonable window: be honest about the realistic timeline rather than either overpromising or silently failing to confirm a booking
- Customer needs an urgent, unscheduled service visit (e.g., a lift malfunction) rather than routine scheduled maintenance: support a clearly different urgent-request path (connecting to the Service Request/Support Ticket screen's safety-aware urgency handling) rather than forcing an urgent need through routine scheduling-calendar logic

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

**Layout-specific guidance for this screen (layout pattern: calendar):** Provide Month / Week / Agenda view toggle, defaulting to whichever view suits the screen's typical task (Agenda for a task list, Week for active scheduling). Color-code event/entry types using the same palette used for status elsewhere in the app (so a color a user has already learned means the same thing here). On mobile, tapping a date shows that day's agenda in a panel below the calendar rather than a cramped inline popover balanced awkwardly over a small calendar grid.

### This screen is done when:
- [ ] Booking AMC service feels as premium, transparent, and well-organized as the original installation experience
- [ ] Lapsed AMC status is surfaced at exactly the moment it's actionable, not just as a disconnected reminder
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the AMC/Maintenance Booking Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
