# Supabase Setup Guide

Hide in Heart runs in **local-only mode by default**. No database, no accounts,
no server — just Scripture memorization saved in your browser's local storage.

If you want multi-user features, cross-device sync, or a real leaderboard, you
can connect a Supabase project. This guide walks you through it.

---

## What You Get With Supabase

| Feature | Local-only (default) | With Supabase |
|---------|---------------------|---------------|
| Verse memorization | ✅ Full set of 451+ verses | ✅ Same, plus DB-managed verses via Admin CMS |
| Translation toggle (NIV/KJV/NKJV/ESV) | ✅ | ✅ |
| Kids mode | ✅ | ✅ |
| Progress tracking | Browser only (localStorage) | Server-side, persists across devices |
| Streaks | Browser only | Server-side, survives clearing browser data |
| Reflections | Browser only | Saved to database, retrievable anywhere |
| Leaderboard | Sample data | Real rankings across all users |
| User accounts | None — everyone is a guest | Email/password sign-up and sign-in |
| Profile stats | Shows zeros | Real totals, streaks, and session bests |
| Admin verse CMS | No-op | Add and update verses via `/admin` |
| Rate limiting | Per-IP, in-memory | Per-IP + per-user, in-memory |

**Bottom line:** local-only mode is fully functional for personal use. Supabase
adds persistence, accounts, and community features.

---

## Prerequisites

- A [Supabase](https://supabase.com/) account (free tier is fine)
- This project cloned and running locally (`npm install && npm run dev`)

---

## Step-by-step Setup

### 1. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a
   new project.
2. Choose a region close to your users.
3. Set a strong database password (you won't need it in the app — Supabase
   handles auth).

### 2. Run the Schema

Open the **SQL Editor** in your Supabase dashboard and run the contents of:

```
supabase/schema.sql
```

This creates the tables (`verses`, `attempts`, `scores`, `streaks`,
`reflections`), enables Row Level Security, and sets up access policies.

### 3. Seed Verse Data (Optional)

If you want the database to have verse records (for the Admin CMS or DB-backed
verse serving), run:

```
supabase/seed.sql
```

This is optional — the app always falls back to the local verse files in
`src/lib/verses-local.ts` and `src/lib/kids-verses.ts`.

### 4. Run Migrations

Apply any pending migrations:

```
supabase/migrations/20260322000000_add_heart_check_tags.sql
```

Run each migration file in the SQL Editor in chronological order.

### 5. Get Your Keys

In your Supabase dashboard, go to **Settings → API** and copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 6. Set Environment Variables

Copy `.env.example` to `.env.local` and fill in the three Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

> **Never commit `.env.local` or expose the service role key in client code.**

### 7. Restart the Dev Server

```bash
npm run dev
```

The app detects Supabase credentials at startup. Once all three env vars are
present, it switches from local-only to Supabase mode automatically.

### 8. Verify

Visit `http://localhost:3000/api/health` — you should see:

```json
{
  "status": "ok",
  "supabaseConfigured": true,
  "supabaseReachable": true
}
```

---

## Setting Up an Admin User

The `/admin` page lets you add or update verses via a JSON editor. When Supabase
is enabled, it requires an authenticated user with the `admin` role.

1. Create an account at `/auth`.
2. In your Supabase dashboard, go to **Authentication → Users**.
3. Find the user and click **Edit User** (or use the SQL Editor).
4. Set `app_metadata` to:

```json
{ "role": "admin" }
```

Or via SQL:

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

---

## Deploying With Supabase on Vercel

1. Add the three Supabase env vars to your Vercel project settings.
2. Deploy as usual — the app will detect the credentials at runtime.
3. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set as a **server-side only**
   variable (no `NEXT_PUBLIC_` prefix — it already isn't).

---

## Switching Back to Local-Only Mode

Remove or blank out the Supabase env vars in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Restart the server. The app returns to local-only mode — no data is lost in the
database, and it will reconnect if you add the keys back.

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| `/api/health` shows `supabaseReachable: false` | Verify the URL and keys in `.env.local` match your dashboard |
| Auth page shows "Accounts are not enabled" | All three env vars must be set — including `SUPABASE_SERVICE_ROLE_KEY` |
| Leaderboard shows sample data | Same as above — Supabase must be fully configured |
| Queries return empty results | Check RLS policies — run `schema.sql` again if policies are missing |
| Admin verse save fails | User needs `app_metadata.role = "admin"` — see admin setup above |
