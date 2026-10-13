# Prompt 140 of 200 — Handover Completion Certificate Screen
**Module 14 of 20: Quality Check & Handover** · Screen 10 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 139 (Warranty & AMC Registration Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'final manager handover made to customer after completion, quality check SOP' — grounded in the actual government inspection process so AIEC's internal QC genuinely predicts real-world compliance success. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Handover Completion Certificate Screen** screen, used by: **Customer, Admin**.

### Functional requirements
- Final, single, clean summary document for the customer: project complete, compliance certified, warranty and AMC terms on file, all supporting documentation linked in one place
- This is the formal closing bookend to the entire journey that began with the Surveyor's first site visit, presented with the same premium branded template used throughout the customer's experience
- Permanently accessible from the customer's portal for future reference (e.g., when applying for their own government operating license, or during any future service call)
- Triggers the final commission/reward payouts for every staff member involved in this project's full lifecycle

### Data this screen touches
- `job_id`
- `certificate_document`
- `linked_documents[]`
- `project_lifecycle_summary`
- `final_payout_triggered_flag`

### Business logic & automation rules
- This is the deliberate, single closing artifact bringing together every major milestone across the entire app's workflow (survey, quotation, contract, delivery, installation, QC, warranty) into one clean customer-facing record, mirroring how the Deal Closure Confirmation screen was the closing artifact for the sales phase specifically
- This exact event is what triggers final-stage commission and reward payouts for every involved staff member (surveyor, sales, technician, QC inspector) per the brief's explicit 'each stage completion give workers payment, commission' principle, connecting the full lifecycle's completion to the Commission & Rewards module cleanly
- Because this genuinely represents the end of the active installation project (though the AMC relationship continues), this is also the natural moment the customer's ongoing portal experience shifts from 'tracking my installation' to 'managing my ongoing lift service and support'

### Edge cases & validation to handle
- A project's certificate is needed for a legal/insurance purpose long after handover (e.g., years later during a property sale): ensure this document remains permanently and easily accessible, never archived in a way that's hard for the customer to retrieve independently
- Final payouts are triggered but a late-discovered issue (e.g., a defect only found well after handover) raises a question about whether staff payment should be affected: this is a genuinely difficult business policy question, and the system should support Admin's documented judgment call rather than either an automatically punitive clawback or a rule that ignores legitimate late-discovered problems entirely
- Multiple technicians, surveyors, and QC inspectors were involved across a long project lifecycle: ensure the final summary and payout triggers correctly and fairly attribute the full team's involvement, consistent with the fairness principles established in Lead Reassignment and Deal Won screens

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

**Layout-specific guidance for this screen (layout pattern: detail):** Lead with a hero header carrying the record's key identifying information (name, status badge, one or two headline stats). Break dense content into clear sections — tabs for genuinely separate categories of information, simple stacked sections with headers when the content is more linear. Any history/timeline section within a detail screen uses the vertical Ascension Line motif. Keep one clear primary action reachable via a sticky bottom bar or a prominent header button; secondary actions live in an overflow menu rather than competing visually with the primary one.

### This screen is done when:
- [ ] Every customer has one clean, permanent, comprehensive record of their entire completed project
- [ ] Final payouts to every involved staff member trigger reliably and fairly from this single completion event
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Handover Completion Certificate Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.

---

## Module 14 Checkpoint — before you start the next module

You've now finished all 10 screens in **Module 14: Quality Check & Handover**. Before moving on to Module 15:

1. Click through every screen you just built in this module, start to finish, once, as if you were the actual user.
2. Spot-check 2-3 of the most important screens from earlier modules — you don't need to re-test everything back to Prompt 001, just confirm nothing visibly broke.
3. If anything looks wrong, send one more small, targeted prompt to fix it now. Don't carry a visible bug forward into the next module — regressions compound, and they're far cheaper to fix the moment you spot them than 50 screens later.
4. Optional but recommended: this is a natural point to download a ZIP backup or note your current AI Studio checkpoint/version, so you always have a known-good rollback point behind you.

This costs about two minutes and saves far more than that in confused debugging later.
