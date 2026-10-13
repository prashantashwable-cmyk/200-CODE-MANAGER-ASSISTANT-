# Prompt 176 of 200 — Live Chat with AIEC Support Screen
**Module 18 of 20: Customer App/Portal** · Screen 6 of 10 in this module

*Paste this into your AI Studio Build chat once Prompt 175 (Service Request/Support Ticket Screen) is complete and working. Part of the AIEC 200-screen sequential build — see `000_README.md`.*

---

Continue building **ALL INDIA ELEVATORS COMPANY (AIEC)**, the mobile-first, multi-role elevator business platform for owner Mr. Prashant Vasant Wable. The customer's own window into their project — transparent, premium, and reassuring from first survey visit through years of AMC service. Several screens already exist in this build — do not rebuild, restyle, or restructure anything outside this one screen. If you need a shared component (a button style, a card, the Ascension Line progress element, the map component), extend or reuse the existing one rather than creating a second, inconsistent version of it.

Now build the **Live Chat with AIEC Support Screen** screen, used by: **Customer**.

### Functional requirements
- Direct chat access to AIEC support, reusing the same underlying chat infrastructure as the WhatsApp Business Console and Negotiation Thread, but framed for post-sale support rather than sales conversation
- Bot-assisted initial triage for common questions (payment status, AMC renewal, basic troubleshooting tips) with clean human handoff for anything more complex
- Full context available to whichever human agent picks up the conversation (this customer's project history, recent tickets, payment status) so the customer never has to re-explain their situation from scratch
- Consistent premium brand tone throughout, whether bot or human is responding

### Data this screen touches
- `conversation_id`
- `customer_id`
- `message_thread[]`
- `bot_or_human_handling`
- `context_snapshot`

### Business logic & automation rules
- This reuses the same chat, bot-configuration, and human-handoff infrastructure already established for the Communication Engine and Negotiation modules, applying it to a new context (post-sale support) rather than building a separate, disconnected support-chat system from scratch
- Full context availability to a human agent picking up the conversation directly reflects the brief's emphasis on the whole business running as one connected system rather than disconnected silos — a support agent should never need to ask a customer to repeat information the system already has
- This is deliberately the most human-warm-feeling customer touchpoint in the post-handover relationship, appropriate for a moment when a customer likely has a genuine question or concern and values feeling heard, not just processed

### Edge cases & validation to handle
- Customer's question is genuinely outside AIEC's scope (e.g., a question about their building's other facilities unrelated to the elevator): the bot/human should gracefully redirect rather than attempting to force an answer outside AIEC's actual expertise or responsibility
- Bot's confidence in fully resolving a customer's question is borderline: default to a warm human handoff rather than a bot risking an unsatisfying or incorrect automated response for a customer relationship the business values long-term (recurring AMC revenue)
- High support volume during a specific period (e.g., many AMC renewal questions around the same time of year): ensure the human-handoff queue remains manageable and customers aren't left waiting excessively, consistent with the SLA-awareness pattern used in the internal Customer Reply Inbox

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

**Layout-specific guidance for this screen (layout pattern: chat):** Standard message-bubble layout with a clear visual distinction between the customer/other party, an automated bot response, and a human staff response (e.g., a small "Bot" or staff-name tag on non-customer bubbles) — this distinction matters throughout AIEC's app since several chat screens explicitly blend automated and human messages and the user needs to always know which is which. Sticky composer bar pinned to the bottom with quick-reply template chips available directly above the text input. Group consecutive messages with a timestamp on natural breaks rather than stamping every single bubble. Keep read/delivered indicators small and unobtrusive.

### This screen is done when:
- [ ] A customer's support conversation never requires them to re-explain context the system already has
- [ ] The bot reliably recognizes its own limits and hands off warmly rather than risking a poor automated response on a valued ongoing relationship
- [ ] The screen matches the AIEC Alabaster & Ascension design system (colors, type, the Ascension Line motif where applicable) rather than a generic default theme
- [ ] Loading, empty, and error states are all explicitly designed, not left blank or default
- [ ] The screen is fully usable at a mobile viewport width first, then adapted upward for wider screens

### Scope for this prompt
Touch only what's needed for the Live Chat with AIEC Support Screen screen and any shared component it must genuinely reuse. Do not modify unrelated screens, do not restyle already-built screens "while you're in there," and do not refactor the data model beyond what this screen genuinely requires. If a larger refactor actually seems necessary, stop and say so rather than doing it silently.
