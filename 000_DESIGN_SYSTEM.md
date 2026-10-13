# AIEC Design System — "Alabaster & Ascension"

## Why this direction
ALL INDIA ELEVATORS COMPANY sells and installs vertical transport. The one visual idea worth repeating everywhere in this app is the thing an elevator actually does: it ascends, floor by floor, in a fixed sequence. Nearly every part of this business is *also* a fixed sequence — a lead moves through pipeline stages, an installation moves through SOP steps, a new partner moves through onboarding steps, a negotiation moves through rounds. So the brand's own product becomes the app's core information-architecture motif: a vertical "Ascension Line" that fills upward as progress happens, used consistently as the visual language for every stage-based screen in the app. This is what keeps a 200-screen build feeling like one coherent product instead of 200 disconnected screens.

This is a premium-positioned brand (the brief calls for "premium royal white theme"). Premium here means: generous white space, restrained color use, a confident serif for moments that deserve weight (headline numbers, screen titles), and a refusal to over-decorate. It should *not* mean gold-on-every-surface, ornate borders, or anything that reads as gaudy rather than trustworthy — this is still a safety-adjacent business (elevators, real money, real installations) and the design should always read as calm and competent first, premium second.

## Color Palette
| Token | Hex | Use |
|---|---|---|
| Alabaster White | `#F8F6F1` | Primary app background |
| Pure White | `#FFFFFF` | Card and elevated-surface background |
| Charcoal Ink | `#2A2723` | Primary text |
| Warm Grey | `#6B6560` | Secondary / muted text |
| Antique Gold | `#B8873D` | Primary accent — CTAs, active states, the Ascension Line itself, selected icons |
| Royal Emerald | `#0E4B3D` | Secondary accent — headers, default icon tint, secondary emphasis (chosen specifically instead of a maroon/red so it never gets confused with an alert or safety-warning color) |
| Success Green | `#2F8F5B` | Status only — kept visually distinct from Royal Emerald so brand color and status color are never ambiguous |
| Warning Amber | `#C97C1F` | Status only |
| Error Red | `#B23B3B` | Status only — reserved strictly for genuine errors and safety alerts. Never used decoratively, given this app also displays real safety-compliance information. |
| Gold Hairline | `#B8873D` at 15% opacity | Card borders, dividers |

## Typography
- **Display / Headings — "Fraunces"** (Google Font): a warm, crafted serif with real optical presence. Use for screen titles, hero KPI numbers, and the one or two moments per screen that deserve visual weight. Never use it for body copy or dense UI labels — it slows reading at small sizes.
- **UI / Body — "Plus Jakarta Sans"** (Google Font): clean, geometric, highly legible sans-serif for every label, paragraph, button, and form field. This is the workhorse face; 90% of the app's text sits in this font.
- **Numeric / Data — "IBM Plex Mono"** (tabular figures): used specifically for money amounts, KPI figures, invoice line items, and anything financial. A monospace numeral face gives financial data a precise, audit-ready feel that a proportional sans doesn't — appropriate for a business handling real payments and GST-compliant invoices. This numeral face stays the same in every language — India's digital finance UI uses Western Arabic digits (0-9) regardless of the surrounding script, so there's no separate "Hindi numerals" font needed here.

## Multi-Language Typography (English / Hindi / Marathi)
The app must render fully in three languages — English, Hindi (hi), and Marathi (mr) — selectable as the signed-in user's own saved preference, defaulting sensibly per role (Admin and Customer likely default to English or the language they signed up in; Surveyor and Technician onboarding should offer the choice up front, since field staff are often more comfortable in Hindi or Marathi).

**The one real technical trap here: neither "Fraunces" nor "Plus Jakarta Sans" contains Devanagari glyphs.** Hindi and Marathi both use the Devanagari script. If Devanagari text is rendered in either of those two fonts, the browser will silently substitute a generic system font for those characters only — the English parts of a screen would still look premium and on-brand, while the Hindi/Marathi parts would look like a completely different, uglier app sitting right next to it. This is a common, easy-to-miss mistake in Indian multi-language apps and needs to be solved at the font-pairing level, not patched later.

**Devanagari font pairing** (used automatically whenever the active language is Hindi or Marathi):
- **Display / Headings — "Martel"** (Google Font): a Devanagari serif/slab face with real weight and presence, chosen specifically to echo Fraunces's "crafted, has-presence" quality in the Latin pairing, rather than defaulting to something thin or purely utilitarian for headings.
- **UI / Body — "Hind"** (Google Font): designed specifically for Devanagari UI and interface text, clean and modern, with a matching weight range to Plus Jakarta Sans so headings and body text keep the same visual hierarchy relationship across all three languages.
- If either of these isn't available in the specific build tool's font library, fall back to "Noto Serif Devanagari" (headings) and "Noto Sans Devanagari" (body) — safer, more universally available, though slightly more neutral in character than Martel/Hind.

**Implementation requirement:** load both font pairings at the CSS level and switch which one applies via a `lang` attribute or a language-scoped CSS class (e.g., `[lang="hi"], [lang="mr"] { font-family: var(--font-heading-deva), ... }`), driven by the app's translation/i18n system — never by manually picking a font per screen. Every screen built from this point forward should pull its user-facing text from translation keys (e.g., `t('login.title')`) rather than hardcoding English strings, so adding the Hindi and Marathi versions is a translation-file task, not a re-development task.

**What needs translation vs. what stays fixed:**
- Translate: every navigation label, button, form label, heading, validation/error message, and in-app notification.
- Translate, but *per-recipient* rather than app-wide: customer communication templates (SMS/WhatsApp) — these should render in whichever language that specific customer or partner has set as their own preference, pulled from a `preferred_language` field on their own record, since a Hindi-speaking surveyor and an English-speaking customer on the same deal each need their own messages in their own language.
- Do **not** auto-translate and treat as equally authoritative: the generated legal contract and formal compliance documents. Offer a Hindi/Marathi *reference* translation for the customer's understanding if you want to, but keep the English version as the single binding legal text, clearly labeled as such — a subtle mistranslation in a legal document is a real risk, and this isn't a decision to make silently inside a generation prompt. (This isn't legal advice — just flagging that this is worth a real decision, ideally with a lawyer's input, rather than defaulting to "translate everything.")

## Theme Modes: Light, Snow White, Dark, and System
The app ships with four selectable appearance modes, saved as the signed-in user's own preference (a `theme_preference` field alongside their `preferred_language` field), switchable at any time from Settings and taking effect instantly app-wide.

**Engineering requirement — read this before building any screen:** every color used anywhere in the app must be a CSS custom property (`--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-accent-primary`, `--color-accent-secondary`, `--color-success`, `--color-warning`, `--color-error`, `--color-border`), never a hardcoded hex value inside a component. Set these tokens once, at the root, per active theme. This is what makes switching between four modes an instant, app-wide, zero-refactor toggle instead of four times the components to build and maintain.

**Why the accent colors change value between Light and Dark, not just the backgrounds:** the same gold and emerald hex values that read clearly on a light background lose contrast and can look muddy against a dark one — this is a standard, well-understood accessibility consideration, not a stylistic whim. Dark mode uses brightened, slightly more saturated versions of the same two brand colors specifically so they stay legible and still unmistakably "AIEC gold" and "AIEC emerald" rather than needing entirely different accent hues.

| Token | Light / Alabaster (default) | Snow White | Dark |
|---|---|---|---|
| `--color-bg` | `#F8F6F1` (warm ivory) | `#FFFFFF` (pure white) | `#1A1815` (warm near-black, never pure black) |
| `--color-surface` (cards) | `#FFFFFF` | `#FBFCFD` (a whisper cooler than pure white, just enough to separate a card from the background) | `#242019` (elevated warm dark surface) |
| `--color-text-primary` | `#2A2723` (warm charcoal) | `#1F2124` (cooler, crisper near-black for a brighter, higher-contrast feel) | `#F0EDE6` (soft warm off-white — never pure white, to reduce glare/eye strain) |
| `--color-text-secondary` | `#6B6560` | `#6B7178` | `#A69F92` |
| `--color-accent-primary` (gold) | `#B8873D` | `#B8873D` | `#D4A855` (brightened for dark-background contrast) |
| `--color-accent-secondary` (emerald) | `#0E4B3D` | `#0E4B3D` | `#2E9B78` (brightened for dark-background contrast) |
| `--color-success` | `#2F8F5B` | `#2F8F5B` | `#4FBB82` |
| `--color-warning` | `#C97C1F` | `#C97C1F` | `#E0954A` |
| `--color-error` | `#B23B3B` | `#B23B3B` | `#E0605C` (softened slightly so it isn't harsh on a dark background, while still unmistakably a warning color) |
| `--color-border` | Gold at 15% opacity | Gold at 12% opacity (a lighter touch, matching Snow White's crisper, less-decorated character) | Gold (`#D4A855`) at 20% opacity |

**Character of each mode, in one line:**
- **Light / Alabaster** — the default premium-royal-white theme described throughout this document: warm, ivory, jewel-toned gold-and-emerald accents.
- **Snow White** — the same brand, cooler and crisper: pure white background, tighter/less-diffuse shadows, higher-contrast near-black text. For users who want something brighter and cleaner than the warm ivory default.
- **Dark** — a genuine dark mode, not just an inverted light mode: warm near-black surfaces (never pure `#000000`, which looks cheap and causes harsh contrast against white text/icons), with brightened gold and emerald accents that keep the same jewel-tone brand identity readable at night or in low light.
- **System** — follows the device's own OS-level light/dark setting, mapping to Light/Alabaster or Dark accordingly (Snow White is a deliberate user choice, not something an OS-level "light/dark" signal can auto-select, since the OS only knows light-vs-dark, not which specific light variant).

The Ascension Line signature element, all icons, and every status indicator reference `--color-accent-primary` / `--color-accent-secondary` / the semantic status tokens rather than fixed hex values, so they automatically look correct in whichever of the four modes is active — this should never need special-casing per screen.


## Iconography
- **Phosphor Icons** (preferred) or **Lucide** as a fallback if unavailable in the build environment. Thin 1.5px stroke weight, rounded line caps.
- Default tint: Royal Emerald. Active/selected/premium-tier tint: Antique Gold.
- Avoid filled/solid icon variants except for small status dots (online/offline, pass/fail).
- Never use generic flat-color square icon packs — they read as a templated AI-generated app rather than a considered product.

## Layout & Components
- **Grid:** 8pt spacing system throughout (8, 16, 24, 32, 40...). No arbitrary spacing values.
- **Cards:** 16-20px corner radius, soft ambient shadow (a diffuse, low-opacity shadow — never a harsh flat drop-shadow), 1px Gold Hairline border.
- **Mobile-first:** single-column layouts, 16-24px screen margins, sticky bottom action bar for the primary call-to-action on any screen with one.
- **Touch targets:** minimum 48x48px for anything tappable, given a meaningful share of this app's users (surveyors, technicians) are operating it one-handed, outdoors, sometimes in bright sunlight or with gloves.
- **Empty and loading states** are designed with the same care as populated states — skeleton placeholders, not blank space or a lone spinner.

## The Signature Element: The Ascension Line
A thin, gold, vertical rail that fills upward (or a horizontal equivalent on wide layouts) as a multi-step process progresses. Each stage is a node on the rail; completed nodes are solid gold and give a brief warm glow the moment they complete; the current node is gold-outlined; future nodes are hollow/grey. This is quite literally a stylized elevator floor-indicator repurposed as UI chrome.

Use it, consistently styled, for every one of these (and any other genuinely stage-based flow introduced later):
- CRM lead pipeline stages
- Installation SOP step progress
- Delivery checklist progress
- Partner onboarding wizards (surveyor, technician, supplier)
- Training module progress and certification paths
- Negotiation round tracking (internal-facing)
- Deal-to-handover full lifecycle timeline (customer-facing)

This single recurring element is what should make a customer, a surveyor, and an Admin all immediately recognize "this is an AIEC screen" even though their roles see completely different content.

## Motion
Subtle and purposeful only. A completed Ascension Line node gets a brief (150-250ms) warm glow. Cards fade-and-rise slightly on load. Avoid bouncy/spring physics, playful overshoot easing, or anything that reads as a consumer social-app aesthetic — this is a premium, safety-adjacent enterprise brand.

## Voice
Confident, clear, warm but not casual. Plain language over jargon, especially in anything customer-facing (a customer should never need to know what "SOP" stands for to understand their own project status). Reserve exclamation marks for genuinely celebratory moments — a deal won, a badge earned, a project handed over — so they retain their impact.
