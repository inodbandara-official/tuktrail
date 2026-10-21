# TukTrail

A mobile-first guide to temples, beaches, waterfalls, parks and heritage sites near you in Sri Lanka.

> Status: **v1 in progress — Phase 1 (foundation)**. Full setup and deployment notes arrive in Phase 6.

## Quick start

Requirements: Node 24+, pnpm 10, Docker Desktop.

```bash
pnpm install
cp .env.example .env          # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm bootstrap                # starts Postgres+PostGIS, RustFS, Mailpit; creates buckets; migrates; seeds
pnpm dev                      # http://localhost:3000
```

Useful local URLs:

- App: http://localhost:3000 — design system at `/design`
- API health: http://localhost:3000/api/v1/health
- Mailpit (magic-link emails): http://localhost:8025
- RustFS console: http://localhost:9001

## Scripts

See [CLAUDE.md](CLAUDE.md#commands) for the full list (tests, screenshots, accessibility audit, database tasks).

## Data accuracy

Seeded places carry original descriptions only. Entry fees, opening hours and logistics are intentionally empty and every place is marked **not yet verified** until checked on the ground. Emergency numbers live in `src/shared/constants/emergency.ts` and must be re-verified before each launch.
