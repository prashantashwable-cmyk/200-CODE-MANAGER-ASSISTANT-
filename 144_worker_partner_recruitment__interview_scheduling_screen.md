# Prompt 144 of 200 — Interview Scheduling Screen
**Module 15 of 20: Worker & Partner Recruitment** · Screen 4 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 143 (Applicant Screening & Scoring Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The brief's 'one page for automatically new workers aggregation and data collection, recruitment, trainings, SOP' — the pipeline that keeps AIEC's asset-light workforce growing without manual HR overhead. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Interview Scheduling Screen** screen, used by: **Admin, Applicant**.

### Functional requirements
- Simple scheduling tool for a screening call/interview (phone, video, or in-person) between Admin and a promising applicant
- Applicant self-service slot selection from Admin's available windows, minimizing back-and-forth coordination
- Automated reminder to both parties ahead of the scheduled time
- Post-interview quick-notes capture feeding into the final onboarding decision

### Data this screen touches
- `applicant_id`
- `interview_slot`
- `interview_mode`
- `interview_notes`
- `interview_outcome`

### Business logic & automation rules
- Applicant self-service slot selection (rather than manual back-and-forth scheduling) is specifically included because it directly supports the brief's core goal of minimizing the single Admin's manual workload even in the recruitment process, not just in core business operations
- Interview notes and outcome captured here become part of the same applicant record referenced in the final Offer & Onboarding Agreement decision, avoiding information loss between the interview conversation and the eventual approval decision
- This screen is optional in the sense that a very high-volume, low-touch recruitment model (e.g., simply approving well-qualified surveyor applicants without a formal interview) could skip straight from Screening to Offer — the interview step exists for roles or situations where Admin genuinely wants a direct conversation first

### Edge cases & validation to handle
- Applicant misses their scheduled slot: support easy, low-friction rescheduling rather than an unforgiving one-strike process, respecting that this is often someone's first real interaction with AIEC as a potential employer/partner
- Admin's availability changes after slots were already offered and one was selected: support clear rescheduling communication rather than silently cancelling a confirmed appointment
- Interview reveals a concern not evident from the application data alone (e.g., a communication or reliability concern): ensure this qualitative context is clearly captured and weighted appropriately in the final onboarding decision, not lost as a vague unrecorded impression

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
- [ ] Scheduling an interview requires minimal manual back-and-forth for either Admin or the applicant
- [ ] Interview outcomes are clearly captured and directly inform the final onboarding decision
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Interview Scheduling Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
