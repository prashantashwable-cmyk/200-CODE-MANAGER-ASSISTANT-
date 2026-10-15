# Implementation plan

Slice order follows the prompt. "Done in this branch" is limited to what the tests above prove.

| Slice | Scope | State |
|---|---|---|
| 1 Foundation | Audit docs, Owner role, authority rules, Decision Desk, Owner security, adaptive layout, tests | **Done**, and the database now has the Owner role and the event stream's rules, proved on real Postgres. **Left:** connecting the app to the database (needs a running Supabase stack), database tables for decision cards, leads and settings |
| 2 Map and leads | Shared map shell for Scout/Sales/Owner, lead capture persisted, duplicate ownership, offline queue, general event table, corrections 1–2, pin fuzzing | **Mostly done in memory:** event log with correction classes, pin fuzzing and role-scoped map, Activity Log and Map screens, ownership rule, offline queue with conflict handling, quick-capture screen. **Left:** database tables and row-level rules, photos and OCR on capture, wiring the older capture screen (032) to the ownership rule, Owner-editable ownership settings, acting on a decided dispute |
| 3 Sales and quotes | Handoff, requirement capture, itemised quote with disclosed facilitation fee, customer acceptance | **Mostly done:** disclosed-fee quote builder (206) and customer per-component acceptance (207) in memory and in Postgres (local-verified). **Left:** a dedicated requirement-capture/handoff form, Mode P switch, alternatives UI |
| 4 Contracts and readiness | Work orders, e-sign and payment adapters (flagged off until connected), QC tasks | **Done for what can be built without providers:** work orders, Owner-only issue, payment gates, Owner-named QC inspector per milestone, partner receipt confirmation, Owner template editor, Contract Pack download, site-readiness points (migrations `20261015000001`–`3`, local-verified). **Left, needs the Owner or a provider:** real e-signature and payment providers, evidence file storage and hashing, licence/insurance expiry registry, payment dispute path |
| 5 Delivery and install | Supplier/logistics, delivery proof, milestones, handover record | **Partly done:** delivery and installation proof run through work-order milestones (evidence, verification, payment record, partner confirmation) and the Handover and Completion Record with project progress (screen 209, migration `20261015000004`). **Left:** dispatch/container/logistics-partner tracking in the new model, GPS-checked delivery proof, surprise-QC trigger, storage for evidence files |
| 6 Remaining roles | Move legacy Admin approvals (payouts, tiers, access, fees) onto the Decision Desk and bar Admin; Sales, QC, NBFC, Logistics, Mentor, Applicant; trust and tiers | Planned |
| 7 Hardening | RLS everywhere, privacy review, accessibility, performance on low-end Android, deployment and recovery docs | Planned |

## Needs the owner's decision
1. SMS provider and DLT registration (sign-in codes still read from `sms_outbox`).
2. Map, tile and geocoding provider and budget (public OSM tiles are not allowed at production volume).
3. Whether QC is engaged by the platform or the customer.
4. Correction window length (default 15 minutes assumed).
