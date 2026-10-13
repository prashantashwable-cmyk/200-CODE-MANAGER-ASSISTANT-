# AIEC Code Architecture Pattern — The 3-File Split
### A standing rule for every screen in this project, not a one-off tip

---

## The rule

For every screen with non-trivial state (which, given the "explicit loading/empty/error states" requirement already built into every prompt in this project, is nearly all of them), build it as **three small, hyper-focused files** instead of one large component:

1. **Types & translation keys** — what shape the data and UI states take, and which translation keys resolve their text. No logic, no rendering.
2. **A custom hook** — the state machine. Owns loading/error/empty/success (or whatever states this specific screen needs), owns data fetching or mutation, exposes a clean interface. No rendering, no hardcoded text.
3. **The view component** — thin. Reads the hook's state, picks which branch to render, pulls text via translation keys and components via the shared design system. No business logic.

This is the same reason this whole project has been built as many small sequential prompts instead of one giant one: an AI coding agent (or a human reviewer) asked to hold everything — data shape, async logic, every UI state, and pixel-level presentation — in one file for a screen with real complexity will start cutting corners once it runs long, exactly the failure mode this project has been designed to avoid at the prompt level. This pattern applies the identical principle one level down, inside a single screen's actual code.

## The completeness guarantee — and what actually makes it true

The point of this pattern isn't just "smaller files are nicer." It's a specific, checkable guarantee: **every element of a screen — every localized string in all 3 languages, every error/empty/loading state, and every piece of interactive logic — gets fully implemented, with nothing silently stubbed, skipped, or truncated because a response ran long.** Splitting into 3 files *reduces the risk* of that happening. It does not, by itself, *guarantee* it. Four concrete mechanisms close that gap — use all four, not just the file split on its own:

**1. Never accept a stub.** If any generated file contains a placeholder, a `// TODO`, a `// implement later`, an empty function body where logic was asked for, or an English string duplicated into the `hi` or `mr` translation slot instead of an actual Hindi or Marathi translation — that step isn't done. Ask for the specific missing piece by name before moving on. This applies with zero exceptions to translation coverage specifically: a key present in `en.json` but missing or duplicated in `hi.json`/`mr.json` is exactly the kind of corner-cutting this whole pattern exists to prevent, and it's the easiest one to miss on a quick skim since the app still runs and looks fine in English.

**2. Split further if any single file is still too big.** The 3-way split is a floor, not a ceiling. If a screen's hook genuinely needs to manage several independent pieces of state (say, a live map's connection state *and* a filter-panel's state), split it into `useLiveMapConnection.ts` and `useMapFilters.ts` rather than forcing both into one oversized hook file. If a view has several genuinely distinct sections, extract sub-components. The moment a single file starts to feel long enough that a generation could plausibly run out of room mid-way through it, that's the signal to split it again — the same logic that justified 3 files over 1 applies recursively.

**3. Detect truncation, and never treat a cut-off response as complete.** If a generated file ends mid-line, mid-statement, mid-JSON-object, or the response simply stops without a natural closing point, that's a truncation, not a finished file. The correct response is "continue exactly from where you left off, starting at [last complete line]" — not moving on to the next of the 3 steps and hoping the gap doesn't matter. A truncated hook or view is worse than no code at all, because it looks finished at a glance.

**4. Verify each step by asking the agent to demonstrate it, not just claim it.** After each of the 3 steps below, ask a direct, specific question that forces the actual content to be shown back to you, rather than trusting a "done!" response:
   - After the types/keys step: *"List every translation key you just added, with its actual English, Hindi, and Marathi values side by side."* A missing or empty cell in that table is caught immediately, before any logic or view code is built on top of an incomplete key set.
   - After the hook step: *"Walk through what this hook returns for each of these states: [list every state from the types file]. Show the exact state transition for [a specific edge case from the screen's original prompt]."* This surfaces a silently-unhandled state before it reaches the view.
   - After the view step: *"Show me the exact rendered output for the loading, error, empty, and success states — not the code, the actual markup each branch produces."* An error or empty branch that's technically present but renders nothing useful (a bare `return null`, a generic default with no real copy) is caught here, not discovered later by a user hitting that state in the live app.

## Why the example needed one real adjustment

A generic version of this pattern centralizes literal English strings in a file often called `locale.ts`. AIEC already has a full English/Hindi/Marathi system built on `react-i18next` from the Foundation prompt onward, with real text living in `en.json` / `hi.json` / `mr.json`, resolved via `t('some.key')`. So the AIEC version of file #1 centralizes **which translation keys and UI-state shapes** a screen uses — never the literal text itself. Same benefit (your view logic never touches copy directly, your hook never touches copy at all), fully compatible with the language system already in place instead of quietly working around it.

## Worked example: the Lead Inbox screen (CRM module)

**1. `leads-inbox.types.ts` — types and translation keys, nothing else**
```typescript
export type UIState = 'loading' | 'error' | 'empty' | 'success';

export interface Lead {
  id: string;
  buildingName: string;
  stage: string;
  daysInStage: number;
}

export const LEAD_INBOX_KEYS = {
  loading: 'leads.inbox.loading',
  empty: {
    title: 'leads.inbox.empty.title',
    body: 'leads.inbox.empty.body',
    action: 'leads.inbox.empty.action',
  },
  error: {
    title: 'leads.inbox.error.title',
    body: 'leads.inbox.error.body',
    retry: 'leads.inbox.error.retry',
  },
} as const;
```

**2. `useLeadsInbox.ts` — the state machine, nothing else**
```typescript
import { useState, useEffect } from 'react';
import { UIState, Lead } from './leads-inbox.types';

export function useLeadsInbox(fetchLeads: () => Promise<Lead[]>) {
  const [state, setState] = useState<UIState>('loading');
  const [data, setData] = useState<Lead[]>([]);

  const load = async () => {
    setState('loading');
    try {
      const res = await fetchLeads();
      setData(res);
      setState(res.length === 0 ? 'empty' : 'success');
    } catch {
      setState('error');
    }
  };

  useEffect(() => { load(); }, []);
  return { state, data, retry: load };
}
```

**3. `LeadsInboxView.tsx` — thin, presentational, theme-token-driven throughout**
```tsx
import { useTranslation } from 'react-i18next';
import { useLeadsInbox } from './useLeadsInbox';
import { LEAD_INBOX_KEYS as K } from './leads-inbox.types';
import { Button, Spinner, Card } from '@/design-system'; // reads --color-* tokens, correct in all 5 themes automatically

export const LeadsInboxView = ({ fetchLeads }) => {
  const { t } = useTranslation();
  const { state, data, retry } = useLeadsInbox(fetchLeads);

  if (state === 'loading') return <Spinner label={t(K.loading)} />;

  if (state === 'error') return (
    <Card title={t(K.error.title)} body={t(K.error.body)}
      action={<Button onClick={retry}>{t(K.error.retry)}</Button>} />
  );

  if (state === 'empty') return (
    <Card title={t(K.empty.title)} body={t(K.empty.body)}
      action={<Button>{t(K.empty.action)}</Button>} />
  );

  return (
    <div className="grid gap-4">
      {data.map(lead => <Card key={lead.id} title={lead.buildingName} />)}
    </div>
  );
};
```

Notice what each file *doesn't* contain: the types file has no logic and no literal text; the hook has no rendering and no copy at all; the view has no fetch logic and no hardcoded strings or colors. That separation is the entire point — each file stays small enough that an AI coding agent (or a human) can hold the whole thing in mind at once, which is exactly what keeps quality from degrading as the app grows past a handful of screens.

## The workflow rule — apply this to every screen prompt in this project

Instead of pasting one of this project's numbered screen prompts as a single message and asking for the whole screen at once, split the execution into three steps, each followed immediately by its verification question from the completeness guarantee above — six messages total, not three, because a step you didn't verify is a step you're only assuming was done correctly:

1. *"Write the types and translation keys for [Screen Name], covering these UI states: [list them from the prompt's requirements]."* → then: *"List every key you just added, with its actual English, Hindi, and Marathi values side by side."*
2. *"Write the custom hook that handles the state transitions and data logic for [Screen Name], using the types from step 1."* → then: *"Walk through what this hook returns for [each state], and show the exact transition for [a specific edge case from the prompt]."*
3. *"Write the view component for [Screen Name] using the hook from step 2, pulling all text through `t()` with the translation keys from step 1, and using only the shared design-system components so it's correct in all 5 theme modes automatically."* → then: *"Show me the exact rendered output for the loading, error, empty, and success states."*

This doesn't replace the screen-by-screen sequencing already built into this project (Prompt 047, then 048, then 049...) — it's a further subdivision *within* any single screen prompt that has real state complexity. A simple static screen (a plain settings toggle, a read-only detail view) often doesn't need all three steps split out; a screen like a live map, an installation checklist, or a negotiation thread — anything with real async state, multiple UI states, or non-trivial interaction — benefits from it directly, and is exactly where skipping the verification questions is most tempting and most costly.

## How this maps onto the different screen types in this project
- **List / dashboard / leaderboard screens** (Lead Inbox, KPI Dashboard, Commission Tracker): the worked example above applies almost directly — a fetch-and-render hook plus a thin view.
- **Form / wizard screens** (Lead Capture, Onboarding, Quotation Generator): the "hook" becomes a form/step-state hook (current step, field values, validation state) instead of a fetch hook — same three-way split, different internal shape.
- **Map / live-tracking / chat screens** (Live Map Dashboard, Negotiation Thread, WhatsApp Console): the hook manages a live subscription (socket or polling interval) instead of a one-shot fetch — same principle, the state machine just has more states (`connecting`, `live`, `reconnecting`, `error`) worth naming explicitly in the types file rather than left implicit.
- **Checklist screens** (Installation SOP, Delivery Checklist, QC Checklist): the hook owns step-completion state and evidence-attachment validation; the types file is where "a safety-critical step can't be marked complete without evidence" gets encoded as a real type constraint, not just a comment.

## Adding this to the Foundation prompt
This is now a standing instruction in the Foundation prompt for all three build tiers (200-screen, 100-screen, 20-screen) — every screen built from that point forward should default to this structure without needing to be re-specified per prompt, the same way the theme-token rule and the translation-key rule already work.
