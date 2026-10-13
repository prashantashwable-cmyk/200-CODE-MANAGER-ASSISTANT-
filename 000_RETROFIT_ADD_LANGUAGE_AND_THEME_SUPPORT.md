# Retrofit Prompt — Add Hindi/Marathi Language & Light/Snow-White/Dark Theme Support
### Only use this if you already started building before these features existed in your Foundation Prompt

---

## When to use this

- **Starting fresh, haven't pasted the Foundation Prompt yet?** Don't use this file — just use the current `000_FIRST_BUILD_FOUNDATION_PROMPT.md`, which already has multi-language and multi-theme support built into it from the start. This retrofit is redundant for you.
- **Already pasted the Foundation Prompt and/or some of the 200 numbered screens using an earlier version of this set?** Paste this prompt now, before continuing the numbered sequence. It adds the same capability as a retrofit, then the rest of the sequence (`001` onward, or wherever you left off) will inherit it correctly.

---

## The prompt to paste

Add two cross-cutting capabilities to the AIEC app we're building, and apply them retroactively to everything already built so far, then continue applying them automatically to every screen we build from this point forward without needing to be told again in each prompt:

### 1. Multi-language support: English, Hindi, Marathi

Set up `react-i18next` (or your framework's standard equivalent) with three translation files — `en.json`, `hi.json`, `mr.json`. Go through every screen already built and replace every hardcoded English string with a translation key, populating all three language files with the actual translations (not placeholder text) for each one.

**Critical font requirement**: neither "Fraunces" nor "Plus Jakarta Sans" (the two fonts already in use) contain Devanagari glyphs, so Hindi and Marathi text rendered in them will silently fall back to an ugly generic system font. Load two additional Google Fonts — "Martel" (for headings, pairing with Fraunces's weight/presence) and "Hind" (for body/UI text, pairing with Plus Jakarta Sans) — and apply them automatically via a `lang` attribute or language-scoped CSS class whenever the active language is Hindi or Marathi. Keep "IBM Plex Mono" for all numerals in every language, since Indian digital finance UI uses Western digits regardless of script.

Add a `preferred_language` field (`en` / `hi` / `mr`) to the `users` collection, and a language switcher reachable from Settings that changes it and takes effect instantly app-wide.

Translate: every navigation label, button, form label, heading, and validation/error message already built. For customer/partner-facing communication templates (SMS/WhatsApp), render each message in that specific recipient's own `preferred_language`, not a single app-wide language. Do **not** auto-translate the legal contract or formal compliance documents and treat the translation as equally binding — keep English as the authoritative legal text if you offer a translated version at all, clearly labeled as a reference translation only.

### 2. Theme modes: Light/Alabaster, Snow White, Dark, System

Refactor every color currently used anywhere in the app into CSS custom properties (`--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-accent-primary`, `--color-accent-secondary`, `--color-success`, `--color-warning`, `--color-error`, `--color-border`) if this isn't already how colors are implemented — no hardcoded hex values inside components. Define four token sets:

| Token | Light / Alabaster | Snow White | Dark |
|---|---|---|---|
| `--color-bg` | `#F8F6F1` | `#FFFFFF` | `#1A1815` |
| `--color-surface` | `#FFFFFF` | `#FBFCFD` | `#242019` |
| `--color-text-primary` | `#2A2723` | `#1F2124` | `#F0EDE6` |
| `--color-text-secondary` | `#6B6560` | `#6B7178` | `#A69F92` |
| `--color-accent-primary` | `#B8873D` | `#B8873D` | `#D4A855` |
| `--color-accent-secondary` | `#0E4B3D` | `#0E4B3D` | `#2E9B78` |
| `--color-success` | `#2F8F5B` | `#2F8F5B` | `#4FBB82` |
| `--color-warning` | `#C97C1F` | `#C97C1F` | `#E0954A` |
| `--color-error` | `#B23B3B` | `#B23B3B` | `#E0605C` |
| `--color-border` | Gold @ 15% opacity | Gold @ 12% opacity | Gold @ 20% opacity |

`System` mode follows the device's own OS-level light/dark setting, mapping to Light/Alabaster or Dark accordingly. Add a `theme_preference` field (`light` / `snow` / `dark` / `system`) to the `users` collection, and a theme switcher reachable from Settings, next to the language switcher, that changes it and re-colors the whole visible app instantly. Confirm the Ascension Line progress component and every icon reference the token variables (not fixed hex values) so they automatically look correct in all four modes.

### Going forward

From this point on, every screen we build in the remaining numbered prompts should be built with translation keys (not hardcoded English) and theme tokens (not hardcoded colors) from the start, without this instruction needing to be repeated in each individual prompt. Confirm you'll do this before we continue.

### Done when

- [ ] Every screen already built renders correctly in all three languages, with Hindi/Marathi using the Martel/Hind font pairing, not a fallback system font.
- [ ] Every screen already built renders correctly in all four theme modes, with no leftover hardcoded colors.
- [ ] Both preferences are saved per-user and take effect instantly, app-wide, the moment they're changed.
- [ ] You've confirmed you'll continue applying both patterns automatically to every subsequent screen without being re-reminded.

---

*Once this is confirmed working, continue the numbered sequence exactly where you left off.*
