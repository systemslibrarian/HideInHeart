# Scripture Memory Web App

Production-ready Scripture Memory app built with Next.js, TypeScript, Supabase, and CI.

## What Was Implemented (All 5 Phases)

1. Frontend migration to Next.js App Router with modular pages.
2. Supabase authentication and server API integration.
3. Database-backed verse catalog model with SQL schema and seed scripts.
4. Profile, streak/stat model, leaderboard, and admin verse CMS route.
5. Tests, GitHub Actions CI, and Sentry monitoring bootstrap.

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Supabase (Auth + Postgres)
- Zod input validation
- Vitest unit tests
- GitHub Actions CI
- Sentry error monitoring

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill values:

```bash
cp .env.example .env.local
```

3. Run the app:

```bash
npm run dev
```

4. Open http://localhost:3000

## Required Environment Variables

See `.env.example`:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL
- ADMIN_API_TOKEN
- SENTRY_DSN
- SENTRY_AUTH_TOKEN
- SENTRY_ORG
- SENTRY_PROJECT

## Supabase Setup

1. Create a new Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Add Supabase keys to env vars.

## App Routes

- `/` home
- `/play` game session
- `/auth` sign in/sign up
- `/profile` user stats
- `/leaderboard` rankings
- `/admin` verse CMS UI

## API Routes

- `GET /api/verses`
- `POST /api/attempt`
- `GET /api/profile?userId=...`
- `GET /api/leaderboard`
- `POST /api/admin/verse` (requires `x-admin-token`)

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Notes

- If Supabase env vars are missing, the app uses local fallback data for development.
- Verse text in this repository may require translation licensing review before commercial use.
