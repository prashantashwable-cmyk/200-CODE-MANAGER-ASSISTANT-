# AIEC — 200-Screen AI Studio Build Sequence
### For ALL INDIA ELEVATORS COMPANY · Owner: Mr. Prashant Vasant Wable

This zip contains a complete, **sequential** prompt set for building your elevator business app in Google AI Studio's Build mode — the way vibe coding actually works well: one focused piece at a time, each one verified before the next, never one giant one-shot prompt.

---

## What's in this zip

| File | What it is |
|---|---|
| `000_README.md` | This file |
| `000_DESIGN_SYSTEM.md` | The full "Alabaster & Ascension" premium royal-white design system — read this once before you start, so you understand *why* every prompt references it. Now includes full Hindi/Marathi typography guidance and the 4-mode theme token system (Light/Alabaster, Snow White, Dark, System) |
| `000_INFORMATION_ARCHITECTURE.md` | The complete map of all 20 modules and 200 screens, so you can see the whole app before building any of it |
| `000_FIRST_BUILD_FOUNDATION_PROMPT.md` | **Paste this first.** It's the improved, cleaned-up version of your original brain-dump brief, scoped specifically to build the app's foundation (navigation shell, data model skeleton, role-based routing, demo mode, multi-language support, and multi-theme support) — not every feature at once |
| `000_RETROFIT_ADD_LANGUAGE_AND_THEME_SUPPORT.md` | **Only needed if you already started building before this version of the set.** Paste this once to add Hindi/Marathi language support and Light/Snow-White/Dark theme support to what you've already built, then keep going with the numbered sequence. If you're starting fresh, skip this file entirely — it's already built into the Foundation Prompt. |
| `000_CODE_ARCHITECTURE_PATTERN.md` | A standing code-quality rule, now built into the Foundation Prompt: every screen with real state gets built as 3 small files (types/translation-keys, a state-machine hook, a thin view) instead of one large component, so quality doesn't degrade as the app grows past a handful of screens. Includes a worked example. |
| `000_RESEARCH_NOTES_AI_STUDIO_AND_DOMAIN.md` | What was actually researched to build this set: AI Studio's current (July 2026) capabilities, current vibe-coding best practice, and the real Indian elevator-industry standards and pricing this app is grounded in — with sources |
| `001_...md` through `200_...md` | The 200 sequential follow-up prompts, one per screen, in build order — every one already written to use translation keys and theme tokens rather than hardcoded English text or fixed colors |
| `MVP_01_LIFTOFF_DESIGN_SYSTEM.md` | A second, alternate visual identity — "Liftoff" — blending Apple's Liquid Glass, Tesla, SpaceX, and Stripe into one coherent dark, mission-control-meets-frosted-glass look. Alternative to the main Alabaster & Ascension theme, not a replacement for it. |
| `MVP_02_FULL_BUILD_PROMPT.md` | **A completely different, faster path**: one single comprehensive prompt that builds a working, click-through 16-screen MVP in the Liftoff theme, covering the whole business loop at demo depth rather than production depth. Use this if you want something working and demo-able *today*; use the 200-screen sequence when you're ready to build the real, full-depth production app. |

## Two ways to use this zip

**Path A — Full production build.** Paste `000_FIRST_BUILD_FOUNDATION_PROMPT.md`, then work through `001_...md` → `200_...md` in order, in the warm "Alabaster & Ascension" royal-white theme. This is the complete, every-detail build described everywhere else in this README.

**Path B — Fast MVP demo.** Paste `MVP_02_FULL_BUILD_PROMPT.md` as a single prompt (it references `MVP_01_LIFTOFF_DESIGN_SYSTEM.md`) to get a working, 16-screen, Liftoff-themed click-through demo in one session — good for validating the concept or showing someone quickly, before committing to the full 200-screen build. Each MVP screen notes which fuller prompt(s) it corresponds to in Path A, so you can move from one path to the other without starting over.

## Language and theme support, in short

Every screen in this set — the Foundation Prompt and all 200 numbered prompts — is written assuming: (1) the app renders fully in **English, Hindi, and Marathi**, switchable as each user's own saved preference, with a proper Devanagari font pairing (Martel/Hind) so Hindi and Marathi never fall back to an ugly system font the way they would under the original Latin-only fonts; and (2) the app supports **Light/Alabaster (default), Snow White, Dark, and System** appearance modes, also switchable per user, built on CSS custom properties so no screen ever hardcodes a color. Full technical detail — exact font names, exact color tokens for all four modes, and what should and shouldn't be auto-translated (the legal contract stays English-authoritative) — is in `000_DESIGN_SYSTEM.md`.

## How to actually use this (read this part)

1. **Open Google AI Studio's Build mode** (aistudio.google.com → Build). If you're on the free tier, be aware it currently runs Flash-class models only, and free-tier conversations may be used to improve Google's models — for a real app handling real customer payments and personal data, switch to a paid tier before you go further than the demo build. See the research notes for why.
2. **Paste `000_FIRST_BUILD_FOUNDATION_PROMPT.md` first**, as your opening message. Let it finish and actually click through the result before doing anything else.
3. **Then paste `001_...md`, wait for it to finish, check it actually works, then paste `002_...md`**, and so on, in numeric order. Don't skip ahead and don't batch several together — that's the exact one-shot mistake this whole approach is designed to avoid.
4. Every 10th prompt (the last screen in each module) ends with a **Module Checkpoint** — a short, deliberate pause to click through what you've built and confirm nothing earlier broke, before moving on. Don't skip these; they're where regressions get caught cheaply instead of expensively.
5. If AI Studio's result doesn't match what a prompt describes, don't just move on to the next prompt — use **Annotation Mode** (click the specific element in the live preview and describe the fix) or send one more short follow-up describing exactly what's wrong before continuing the sequence.
6. When you reach the end of a module and everything's working, it's a good moment to download a ZIP backup or note your AI Studio checkpoint, so you always have a rollback point.

## Why 200 separate prompts instead of one big one

Every current write-up on building real apps with AI coding agents — including Google's own guidance — converges on the same finding: **one-shotting a complex, multi-role app produces something that looks plausible but breaks in ways that are hard to untangle**, because the agent has to guess at scope, priority, and how features connect. Small, sequential, verified steps are slower to *start* but dramatically faster to *finish with something that actually works*, because every step is checked before the next one is built on top of it. That's the whole idea behind this set: your original brief already had the right business logic — it just needed to be broken into a build order an AI coding agent (and you) can actually follow and verify one piece at a time.

## The 20 modules at a glance

1. Onboarding, Authentication & Roles
2. Admin Command Center — Live Operations Map
3. Admin Master Dashboard & Analytics
4. Surveyor — Lead Capture
5. CRM — Lead & Pipeline Management
6. Automated Communication Engine
7. Auto-Quotation Engine
8. Negotiation & Deal Closing
9. Payments & Financing
10. Supplier & Manufacturer Management
11. Material Logistics & Delivery
12. Supplier Payment Processing
13. Installation & Technician Module
14. Quality Check & Handover
15. Worker & Partner Recruitment
16. Training & SOP Library
17. Commission, Rewards & Payouts
18. Customer App/Portal
19. Automation Rules & Notification Engine
20. Settings, Security, Compliance & Super Admin

Full detail on every one of the 200 screens inside these modules is in `000_INFORMATION_ARCHITECTURE.md`.

## A note on scope and realism

This set builds a genuinely complete, click-through, demo-ready version of the platform your brief describes, including the Demo Mode bypass tab you asked for at login. It is **not** a substitute for: an actual payment gateway account and keys, an actual WhatsApp Business API account, a real financing-partner integration, or a legal review of the generated contract and compliance language before it touches real customers' money or real elevator installations. Every one of those is called out at the relevant prompt. Treat the 200-screen build as the complete, correct shape of the business running end-to-end — then connect the real-world accounts and get a professional sign-off on the legal and safety-compliance content before going live. `000_RESEARCH_NOTES_AI_STUDIO_AND_DOMAIN.md` has a short, specific list of exactly what to line up before real launch.
