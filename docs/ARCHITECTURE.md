# Architecture notes (as built, plus the decided direction)

## As built
- Screens call `useData()`; the `Repository` interface is the only data seam. `withServer()` overrides the parts moved to Supabase.
- Roles: `owner | admin | surveyor | technician | customer | supplier`. Screen access = the route's `roles`, then Admin's permission decisions (192). A route listing `admin` also admits `owner` (`rolesAdmit`).
- Repository gates: `isAdminRole()` accepts admin and owner. This makes the Owner a strict superset of Admin.

## Authority and decisions (new)
- `features/authority/authority.ts`: pure rules. `canDecide(role, kind, grant)` never allows Admin. Delegates need a grant that is non-revoked, unexpired, in scope, delegable and within the amount limit.
- `features/decisions/decisions.ts`: store built with injected clock/role/name lookups, so a server version can replace it. Owner sees detail; Admin gets status rows without evidence, impact, amounts or assistant notes; others see only cards delegated to them.
- Each decision appends a frozen record linked by the existing hash (`features/audit/chain.ts`). The hash is a fast non-cryptographic fingerprint: it makes tampering visible, it does not prevent it. A real backend writes to storage that cannot be altered.

## Adaptive layout
`styles/adaptive.css`, loaded last. Breakpoints 1280/1600/1920/2560 raise container widths, sidebar width and root type size. Phone and tablet rules are untouched.

## Decided direction (not built)
- One `events` table (type, actor, entity, device time, server time, geometry, accuracy, evidence hash, correlation id, prev hash) with UPDATE/DELETE revoked; map, log, timelines and decision records as projections.
- PostGIS for geometry; fuzzing and contact masking in database views/functions; offline queue with idempotency keys.
- Map: measure Leaflet vs MapLibre on a 2 GB Android phone before choosing; no public OSM tiles in production.

## Database layer for the event stream (built and tested, not yet connected)
- `platform_events` is one append-only table. A before-insert trigger runs as the caller: it takes the sequence, the previous hash, the time and the identity from the session, ignores anything the browser sent for those, forces `source = 'app'` for a browser, and raises for the rules (Admin read-only, decisions Owner-only, correction classes, locked types, the 15-minute window).
- Update, delete and truncate are revoked from browsers and refused by triggers for everyone, the server included. The hash is SHA-256 over a canonical text with UTC times; `app.verify_event_chain()` names the first broken entry.
- Row-level security: the Owner reads their own world (real or demo, never both); everyone else reads only what they did. Admin has no policy on the table and reads `platform_events_masked`, a view that is Admin-only, hides contact data and removes places.
- Event classes are listed in SQL (`app.event_locked`, `app.event_money_or_rank`) and in TypeScript; `tests/unit/eventRulesDrift.test.ts` fails if they differ.
