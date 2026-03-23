# Scripture Journey

**[Live Demo ->](https://systemslibrarian.github.io/scripturegame/)**

## About

Scripture Journey is a calm daily companion for hiding God's Word in your heart.

Rooted in Psalm 119:11 — it guides you through reading, reflection,
memorization, and application in a quiet daily journey. No scores. No timers.
Just Scripture, carried deeper each day.

> "Your word I have hidden in my heart, that I might not sin against You."
> — Psalm 119:11

Built with Next.js 15, Supabase, and TypeScript.

## What It Does

Each session you walk through a short journey:

1. **Choose a topic** — Pick a theme that meets you where you are: anxiety, fear, doubt, hope, and more.
2. **Read it** — The verse appears with a brief devotional. Read slowly, two or three times. No timer.
3. **Practice it** — Key words are removed. Place word tiles into the blanks to rebuild the verse from memory.
4. **Live it** — Finish with a short application prompt so the passage moves from recall into real life.

## Features

- **Word-tile memorization** — the central mechanic, designed for mobile and desktop.
- **Topic selection** — choose a theme and let Scripture meet you there.
- **Three depth levels** — beginner, intermediate, and expert control how many blanks appear.
- **NIV / KJV toggle** — switch translations at any time.
- **Offline-capable** — a local verse set works without any backend connection.
- **Reflections** — save short written responses to application prompts after each journey.

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
  lib/           — Journey logic, verse helpers, auth, rate limiting
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

## Supabase Setup

1. Create a new Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Add Supabase keys to env vars.

## App Routes

- `/` home
- `/play` daily journey
- `/auth` sign in/sign up
- `/profile` your journey walk
- `/profile/reflections` devotional journal
- `/admin` verse CMS UI

## API Routes

- `GET /api/verses`
- `POST /api/attempt`
- `GET /api/reflections`
- `POST /api/reflection`
- `GET /api/profile?userId=...`
- `GET /api/leaderboard`
- `POST /api/admin/verse` (requires Supabase authenticated admin role when Supabase is enabled)

## Security Hardening

- Server-side validation and integrity checks on `/api/attempt`.
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

## 10/10 Progress Tracker

Detailed 31-point completion checklist:

- `docs/ten-out-of-ten-checklist.md`
