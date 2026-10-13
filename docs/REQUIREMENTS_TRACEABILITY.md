# Requirements traceability

Status uses only: **Done** (persisted as designed, tested), **Partial**, **Planned**, **Not started**. "Done" here never means connected to a live provider.
"Persisted" for the Decision Desk means the in-memory repository, the same store as the rest of the app (KNOWN_GAPS G1); it does not survive a refresh yet.

| Source | Requirement | Status | Where |
|---|---|---|---|
| Part B P1 | Owner holds decision authority; Authority Matrix | Partial | `features/authority/authority.ts` (matrix, delegates, limits); no Owner-settings editor yet |
| P1 | Delegates scope/amount/time limited | Partial | per-card delegation for 7 days; no standing delegate setup |
| P2 | Admin read-only, cannot decide or see decision detail | Partial | enforced for decisions in the store; legacy Admin actions not yet restricted |
| P2 | Admin prepares Decision Packets | Done | `prepareDecisionPacket`, Admin sheet |
| P4 | Decision Desk: approve/reject/edit/ask/delegate, evidence, impact, history | Done | screen 201 |
| P4 | "Make this a rule", SLA timers, AI-drafted replies, threads | Not started | |
| P5 | Decision recorded with AI recommendation | Partial | card carries recommendation; outcome labels not yet |
| P9.1 | Hash-chained immutable event | Partial | decision records chained and frozen; verified on Owner home |
| P9.3 | Correction classes 1–4 | Not started | |
| P10.2 | Owner second step, server-side refusal | Partial | in-memory refusal tested; DB-level rule not written |
| P7 | Owner role | Done | role, home 202, nav |
| P7 | Other new roles (Sales, QC, NBFC, Logistics, Mentor, Applicant) | Not started | |
| P8 | Map-first home, fuzzing, presence | Not started | |
| P0 | Facilitator commercial model, fee band, quotes | Not started | |
| P6 | Tier system | Not started (a tier screen exists in the legacy model, 148) | |
| Adaptive screens (user request) | High-resolution adaptive layout | Done for shell, containers, type | `styles/adaptive.css`; per-screen visual review not done |
| Part C | Scout capture, sales flow, QC, payments, SOP, admin analytics | Exists in legacy screens (in-memory); not re-verified against the new model | |
| A9 | Real auth, RLS everywhere, signed URLs, rate limits | Partial | sign-in on Supabase; rest planned |
