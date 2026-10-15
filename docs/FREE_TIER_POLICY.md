# Free-tier policy (owner decision, 2026-10-13)

"Use Supabase if it is totally free; for every service always choose the better free version."

## Supabase: free plan, with known limits (third-party sources, not yet checked against supabase.com/pricing)
- 2 active projects per owner/admin; 500 MB database (read-only above it); ~1 GB file storage; ~50,000 monthly active users.
- Bandwidth figures conflict between sources (5 GB vs 10 GB incl. cached): verify on the dashboard.
- Project **pauses after a week without activity** (data kept; restore from dashboard).
- **No daily backups** on free. Mitigation already built: Backups & Exports screen (196) export; add a scheduled `pg_dump` GitHub Action to artifact storage `[ASSUMPTION]`.
- No SMS provider included: phone OTP codes land in `sms_outbox` (KNOWN_GAPS).
- Verdict: free is acceptable for build/pilot, NOT for production with real customers. Upgrading is the Owner's call.
- Keep-alive: a weekly scheduled GitHub Action request prevents the pause (allowed use of free tier `[VERIFY]` against Supabase terms).

## Free choices for other services
| Need | Free choice | Trade-off |
|---|---|---|
| Hosting (web) | Vercel Hobby / Cloudflare Pages | Hobby is non-commercial on Vercel `[VERIFY]`; Cloudflare Pages allows commercial use |
| Map tiles (gap G7) | OpenFreeMap / self-hosted PMTiles (no key); public OSM tiles are not for production | Self-hosting Pune extract is free |
| Geocoding | Nominatim only at low volume, cached; or Photon | Usage policy limits |
| Email | Supabase Auth built-in (rate-limited) / Resend free tier | Low daily cap |
| SMS/OTP | None free in India; keep `sms_outbox` stand-in, say so on screen | Real OTP needs paid provider (DLT) |
| Error monitoring | Sentry free developer tier | Low quota |
| CI | GitHub Actions free minutes | Private repo minutes capped |

No account is created and nothing is paid without the Owner's confirmation.
