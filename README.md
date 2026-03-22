# Scripture Memory

A calm, daily Scripture practice app. Read a passage slowly, sit with it, place the missing words from memory, and carry one clear response into the rest of your day.

## What It Does

Each day you walk through a short journey:

1. **Read it** — A featured verse, its theme, and a brief devotional set the pace before anything else happens.
2. **Practice it** — The verse reappears with key words removed. Drag word tiles into the correct blanks to rebuild it from memory.
3. **Live it** — Finish with a simple application prompt so the passage moves from recall into real life.

Themes include anxiety, fear, doubt, temptation, waiting, guidance, hope, and more — you choose what your heart needs today.

## Features

- **Drag-and-drop word tiles** — the central memorization mechanic, designed for mobile and desktop.
- **Heart check** — pick a theme that matches where you are right now before your verse is chosen.
- **Three skill levels** — beginner, intermediate, and expert control how many blanks appear.
- **Streaks and scoring** — track daily consistency and see your progress over time.
- **Leaderboard** — optional friendly accountability with other users.
- **Guest mode** — start immediately, no account required. Sign in later to sync progress across devices.
- **Offline-capable** — a local verse set works without any backend connection.
- **Reflections** — save short written responses to application prompts after each practice.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, React 19, TypeScript |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Validation | Zod |
| Testing | Vitest |
| Monitoring | Sentry |
| Hosting | Vercel |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template and fill in your values
cp .env.example .env.local

# Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for the full list. The key ones:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `ADMIN_API_TOKEN` | Protects the admin verse management endpoint |

The app runs in **local-only mode** without Supabase credentials — all verses come from a built-in fallback set and auth features are disabled.

## Project Structure

```
src/
  app/           — Next.js App Router pages and API routes
  components/    — Shared UI components
  lib/           — Game logic, journey flow, auth helpers, rate limiting
  types/         — TypeScript domain types
supabase/
  schema.sql     — Full database schema with row-level security
  seed.sql       — Starter verse data
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (zero warnings) |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run Vitest unit tests |
| `npm run preflight` | Pre-deploy validation |

## License

ISC
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
- `POST /api/admin/verse` (requires Supabase authenticated admin role when Supabase is enabled)

## Security Hardening

- Server-side score validation and anti-cheat checks on `/api/attempt`.
- Per-endpoint rate limiting for attempt, admin, and leaderboard APIs.
- Admin content write path now supports Supabase role-based authorization (`app_metadata.role=admin`).
- Local fallback mode keeps `x-admin-token` support for non-Supabase development.

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run preflight
```

## Notes

- If Supabase env vars are missing, the app uses local fallback data for development.
- Verse text in this repository may require translation licensing review before commercial use.

## Health Endpoint

- `GET /api/health`
- Returns readiness details, including Supabase connectivity when configured.

## Deploy on Vercel

1. Create a Vercel project connected to this repository.
2. Add project environment variables from `.env.example`.
3. Add GitHub repository secrets for workflow deployment:
	- `VERCEL_TOKEN`
4. Trigger deployment via push to `main` or manually from Actions.

Workflow file: `.github/workflows/deploy-vercel.yml`

## Deploy on GitHub Pages

1. Ensure GitHub Pages is set to use GitHub Actions as source.
2. Push to `main` or run the workflow manually.
3. The workflow validates lint/type/test and deploys static PWA assets.

Workflow file: `.github/workflows/deploy-pages.yml`

## 10/10 Progress Tracker

Detailed 31-point completion checklist:

- `docs/ten-out-of-ten-checklist.md`
