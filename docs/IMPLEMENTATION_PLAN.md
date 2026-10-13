# Implementation plan

Slice order follows the prompt. "Done in this branch" is limited to what the tests above prove.

| Slice | Scope | State |
|---|---|---|
| 1 Foundation | Audit docs, Owner role, authority rules, Decision Desk, Owner security, adaptive layout, tests | **Done in this branch** except: database-level rules and persistence (needs Supabase project; G1) |
| 2 Map and leads | Shared map shell for Scout/Sales/Owner, lead capture persisted, duplicate ownership, offline queue, general event table, corrections 1–2, pin fuzzing | Next |
| 3 Sales and quotes | Handoff, requirement capture, itemised quote with disclosed facilitation fee, customer acceptance | Planned |
| 4 Contracts and readiness | Work orders, e-sign and payment adapters (flagged off until connected), QC tasks | Planned |
| 5 Delivery and install | Supplier/logistics, delivery proof, milestones, handover record | Planned |
| 6 Remaining roles | Move legacy Admin approvals (payouts, tiers, access, fees) onto the Decision Desk and bar Admin; Sales, QC, NBFC, Logistics, Mentor, Applicant; trust and tiers | Planned |
| 7 Hardening | RLS everywhere, privacy review, accessibility, performance on low-end Android, deployment and recovery docs | Planned |

## Needs the owner's decision
1. SMS provider and DLT registration (sign-in codes still read from `sms_outbox`).
2. Map, tile and geocoding provider and budget (public OSM tiles are not allowed at production volume).
3. Whether QC is engaged by the platform or the customer.
4. Correction window length (default 15 minutes assumed).
