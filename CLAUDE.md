# CLAUDE.md — Hide in Heart

> This app exists to help people hide God's Word in their hearts (Psalm 119:11).
> Every change must improve accuracy, usability, and memorization effectiveness.

---

## WHAT

A modern full-stack Scripture memorization app.

**Stack:**
- Framework: Next.js (App Router)
- Language: TypeScript (strict mode)
- Backend: Next.js API routes
- Database + Auth: Supabase (Postgres + Auth)
- Hosting: Vercel

**Core features:**
- Scripture memorization (active recall)
- Kids and Adult verse sets
- Leaderboards and profiles
- Reflection system
- Secure server-side attempt validation
- Verse browsing by book and topic

---

## WHY

Users memorize Scripture more effectively through active recall, structured verse
organization, and progress tracking (leaderboards, profiles).

**Key design decisions:**
- Next.js App Router for full-stack simplicity
- Supabase for auth + scalable Postgres backend
- Local verse files for deterministic Scripture accuracy
- Server-side validation to prevent answer manipulation

---

## PROJECT STRUCTURE

```
/src/app          → Pages + API routes (Next.js App Router)
/src/lib          → Core logic (verse handling, security, validation)
/src/components   → UI components
/src/types        → Domain types (domain.ts is source of truth)
/supabase         → DB schema + migrations
/scripts          → Validation + tooling
/docs             → Verse catalog and documentation
```

---

## ENVIRONMENT

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not hardcode these values anywhere. Do not commit `.env.local`.

---

## TRANSLATION

**Primary translation: NIV (New International Version)**
**Toggleable translations: ESV (English Standard Version), NKJV (New King James Version)**

All Scripture text is authoritative as stored in:
- `/src/lib/verses-local.ts` (adult verses)
- `/src/lib/kids-verses.ts` (kids mode)

Each translation has its own exact wording and must be stored and served
separately. Do not mix translation text or assume one translation's wording
matches another.

**Rules:**
- Do not supply or infer verse text from training data for any translation
- NIV is the default — do not substitute ESV or NKJV wording unless the user
  has explicitly toggled to that translation
- Answer validation must compare against the correct translation's stored text,
  not a generic or blended version
- If adding verse content for a new translation, run `validate-verses.mjs`
  before committing

---

## HOW TO RUN

```bash
npm install
npm run dev        # development
npm run build      # production build
npm start          # serve production build
npm run test       # run test suite
```

**Verse validation (required before adding content):**

```bash
node scripts/validate-verses.mjs
```

This must pass before any new verse data is merged.

---

## DATABASE (Supabase)

- Schema: `/supabase/schema.sql`
- Migrations: `/supabase/migrations/`
- Seed data: `/supabase/seed.sql`

**Rules:**
- Never change schema without creating a migration file
- Never write inline SQL schema changes — always generate a migration
- Never store Scripture text outside of the designated verse files
- Respect RLS (Row Level Security) policies — do not bypass them

---

## CRITICAL FILES — HANDLE WITH CARE

These files are load-bearing. Treat them as stable unless explicitly directed otherwise.

| File | Purpose |
|------|---------|
| `/src/lib/attempt-security.ts` | Validation + anti-cheat |
| `/src/lib/verses-local.ts` | Adult verse data |
| `/src/lib/kids-verses.ts` | Kids mode content |
| `/src/lib/rate-limit.ts` | Rate limiting logic |
| `/src/types/domain.ts` | Authoritative domain types |

**Before modifying any of these files:** state your intent and reasoning explicitly,
and wait for confirmation before proceeding.

---

## API ROUTES

Located in `/src/app/api/...`

| Endpoint | Purpose |
|----------|---------|
| `/api/attempt` | Submit and validate answers |
| `/api/verses` | Fetch verse data |
| `/api/profile` | User profile data |
| `/api/leaderboard` | Rankings |

All answer validation must happen server-side. Never trust client input.

---

## GIT WORKFLOW

After completing any significant unit of work, commit and push automatically.
Do not wait to be asked.

**What counts as a commit-worthy unit:**
- A feature or sub-feature is working
- A bug is fixed and verified
- A refactor is complete
- A new file or component is added
- Any change to the database schema or migrations

**Commit message format:**
```
<type>: <short description>

<optional body if context is useful>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`

Examples:
```
feat: add NKJV translation support to verse fetch API
fix: correct answer validation whitespace handling
chore: update CLAUDE.md with git workflow rules
```

**After each commit:**
```bash
git add -A
git commit -m "<message>"
git push
```

Never bundle unrelated changes into a single commit. If multiple things were
changed, commit them separately with clear messages.

---

## CODING STANDARDS

**TypeScript:**
- Strict mode is required
- Avoid `any` — use proper domain types from `/src/types/domain.ts`
- Prefer explicit return types on functions

**React:**
- Use server components where possible
- Keep UI components clean and reusable
- No business logic in components — delegate to `/src/lib/`

**Naming:**
- `camelCase` for variables and functions
- `PascalCase` for components and types
- Clear names over clever names

---

## SCRIPTURE INTEGRITY — NON-NEGOTIABLE

- NEVER modify Scripture text
- NEVER paraphrase or reword a verse
- NEVER auto-correct verse wording
- NEVER supply verse text from your training data — only reference verse files
- Only permissible operations on Scripture text: inserting blanks, checking answers

Violations of this rule are always wrong, regardless of context or intent.

---

## SECURITY — VERY IMPORTANT

- All answer validation must happen server-side in `attempt-security.ts`
- Do not trust, log, or forward raw client input without validation
- Rate limiting is active — do not remove or weaken `rate-limit.ts`
- Supabase auth must be handled correctly on both server and client sides
- RLS policies must remain intact

---

## GOTCHAS

- Supabase SSR auth requires correct cookie handling — use the server client
  from `@supabase/ssr`, not the browser client, in server components and API routes
- RLS policies will silently block queries if auth context is wrong — check
  RLS before assuming a query is broken
- Verse validation (`validate-verses.mjs`) can fail silently on malformed entries —
  always check exit codes in CI
- `attempt-security.ts` contains stateful logic — changes can break validation
  integrity in non-obvious ways; test thoroughly
- Rate limiting middleware must run before attempt validation, not after

---

## DO NOT (AI-specific rules)

- Do not generate verse text from memory — only use files in `/src/lib/`
- Do not implement features not present in the current codebase unless explicitly asked
- Do not modify `attempt-security.ts` without flagging the change and waiting for confirmation
- Do not write inline schema changes — always create a migration file
- Do not remove or bypass rate limiting or RLS
- Do not use `any` in TypeScript
- Do not suggest "quick fixes" that skip server-side validation

---

## TESTING

```bash
npm run test
```

Critical test areas:
- Attempt validation (`attempt-security.ts`)
- Edge cases for answer matching (punctuation, case, whitespace)
- Verse data integrity (via `validate-verses.mjs`)
