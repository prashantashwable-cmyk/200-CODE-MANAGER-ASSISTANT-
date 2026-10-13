# Prompt 102 of 200 — Live Shipment Tracking Screen
**Module 11 of 20: Material Logistics & Delivery** · Screen 2 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 101 (Delivery Scheduling Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. Once a supplier ships, the brief calls for tracked, SOP-governed delivery to site — this module is the physical bridge between a Purchase Order and a technician who can actually start installing. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Live Shipment Tracking Screen** screen, used by: **Admin, Customer, Technician**.

### Functional requirements
- Map-based live tracking of an in-transit delivery vehicle (via the supplier's or a logistics partner's location feed) similar in visual language to the staff-tracking map elsewhere in the app
- ETA countdown and distance-remaining shown prominently
- Customer-facing simplified version (just 'on the way, arriving around X time') distinct from the more detailed Admin/technician view
- Delivery milestone timeline: Dispatched, In Transit, Nearby, Arrived

### Data this screen touches
- `po_id`
- `current_transit_lat_lng`
- `eta_estimate`
- `transit_milestone`
- `customer_notified_flag`

### Business logic & automation rules
- This uses the same Google Maps-based live-location visual language and component pattern as the Admin Live Map Dashboard, for consistent design language across the whole app rather than a bespoke tracking widget
- Milestone changes automatically trigger the appropriate customer-facing WhatsApp/SMS notification via the Communication Engine, so the customer's experience of 'watching their elevator arrive' is automated end-to-end without manual updates
- This screen degrades gracefully to a milestone-only view (no live pin) for suppliers/logistics partners who don't provide a live location feed, rather than showing a broken or static map

### Edge cases & validation to handle
- Supplier doesn't support live GPS feed integration (a smaller regional supplier using their own vehicle without telematics): fall back to manual milestone updates from the supplier via the Supplier Communication Thread rather than forcing a live-map experience that isn't actually available
- Delivery vehicle location feed drops mid-transit: show 'last known position' with a timestamp honestly, rather than a frozen pin implying current location
- Multiple line items from the same PO ship separately on different vehicles: support tracking each shipment leg distinctly rather than conflating them into one misleading combined status

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

**Layout-specific guidance for this screen (layout pattern: map):** Full-bleed map as the base layer (built on the Google Maps AI Chip / Maps integration available in AI Studio's Build mode). Never cover the map with a full-screen modal for details — use a floating card or bottom sheet that leaves the map visible and in context underneath. Pins are color-coded by type/status with a small always-visible legend. Cluster pins at low zoom and expand smoothly on zoom-in rather than letting the map become an illegible pile of markers. Any list-under-a-map (e.g., nearby results) uses a draggable bottom sheet, not a separate screen.

### This screen is done when:
- [ ] A customer gets a genuinely satisfying, transparent 'watch your elevator arrive' experience consistent with the premium brand positioning
- [ ] Suppliers without live tracking capability still produce an accurate, if simpler, delivery status
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Live Shipment Tracking Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
