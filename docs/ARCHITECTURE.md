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
