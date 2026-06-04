# LevelStack — Supabase migration guide

LevelStack uses the **same Supabase project** as `lpd-redesign`. The hub already owns `auth.users`, `user_profiles`, and `orders`. This repo adds **product-only** tables: `levelstack_intakes`, `levelstack_research_jobs`, `levelstack_reports`.

**Project ref (LPD):** `lppmbgqsovtfbpbvjvxi`  
**Dashboard:** https://supabase.com/dashboard/project/lppmbgqsovtfbpbvjvxi

---

## Before you migrate

| Check | Why |
|-------|-----|
| You are in the **LPD** project in the dashboard | Applying SQL to the wrong project creates orphan tables |
| Hub migrations already ran | `orders`, `user_profiles` must exist (hub `002_customer_portal_schema.sql`) |
| `.env.local` has Supabase keys | Same URL/anon/service role as `lpd-redesign` |

This repo’s `.env.local` can be synced from the hub (keys only):

```bash
# From lpd-levelstack — or copy the three Supabase lines manually from lpd-redesign/.env.local
grep '^NEXT_PUBLIC_SUPABASE\|^SUPABASE_SERVICE' ../lpd-redesign/.env.local
```

---

## Option A — SQL Editor (fastest, no CLI login)

1. Open **SQL Editor** → **New query** in the [LPD project](https://supabase.com/dashboard/project/lppmbgqsovtfbpbvjvxi/sql/new).
2. Open `supabase/migrations/20250603000000_levelstack_product_tables.sql` in this repo.
3. Copy the **entire file** and paste into the editor.
4. Click **Run**.
5. Expect: `Success. No rows returned` (DDL only).

### Verify (run in SQL Editor)

```sql
-- Tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'levelstack_%'
ORDER BY table_name;

-- RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'levelstack_%';

-- Policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'levelstack_%'
ORDER BY tablename, policyname;
```

Expected tables:

- `levelstack_intakes`
- `levelstack_research_jobs`
- `levelstack_reports`

### Smoke test (optional)

```sql
-- Should return 0 rows, not an error
SELECT COUNT(*) FROM levelstack_intakes;
```

---

## Option B — Supabase CLI (`db push`)

Use this when you want migrations tracked in `supabase_migrations.schema_migrations`.

### 1. Log in (once per machine)

```bash
supabase login
```

Opens a browser; stores an access token locally.

### 2. Link this repo to the LPD project

```bash
cd /path/to/lpd-levelstack
supabase link --project-ref lppmbgqsovtfbpbvjvxi
```

You may be prompted for the database password (from **Project Settings → Database**).

### 3. Push migrations

```bash
supabase db push
```

Applies any files in `supabase/migrations/` that are not yet recorded on the remote.

### 4. Confirm

```bash
supabase migration list
```

You should see `20250603000000` (or the migration name) on **Remote**.

---

## What the migration creates

| Object | Purpose |
|--------|---------|
| Enums | `levelstack_intake_status`, `levelstack_job_status`, `levelstack_report_status` |
| `levelstack_intakes` | Questionnaire answers (§10.1) |
| `levelstack_research_jobs` | Async pipeline runs after submit |
| `levelstack_reports` | Structured report JSON + PDF path |
| Triggers | `updated_at` on all three tables |
| RLS | Users can **select/insert/update** only their own intakes; **select** own jobs/reports |

**Not in this migration:** Stripe, `orders` changes, or Storage buckets (PDF bucket = later Phase 3).

**Service role:** Server jobs use `SUPABASE_SERVICE_ROLE_KEY` and bypass RLS (never expose to the browser).

---

## Entitlement (`orders`) — already on hub

Phase 1 reads hub `orders` via `hasLevelStackAccess()`. The hub migration already includes:

```sql
-- policy name from hub 002_customer_portal_schema.sql
"Users can view own orders"
```

No extra migration is required for entitlement **unless** that policy was removed manually.

Verify:

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'orders' AND schemaname = 'public';
```

---

## Re-run / idempotency

The migration uses `CREATE TABLE IF NOT EXISTS` and named policies. **If you run it twice**, you may get errors on:

- `CREATE TYPE` (enums already exist)
- `CREATE POLICY` (policy names already exist)

If that happens, either:

- Skip re-run (tables already exist), or
- Drop product objects in a **non-production** branch only (see rollback).

---

## Rollback (dev/staging only)

```sql
DROP TABLE IF EXISTS levelstack_reports CASCADE;
DROP TABLE IF EXISTS levelstack_research_jobs CASCADE;
DROP TABLE IF EXISTS levelstack_intakes CASCADE;
DROP FUNCTION IF EXISTS levelstack_set_updated_at() CASCADE;
DROP TYPE IF EXISTS levelstack_report_status;
DROP TYPE IF EXISTS levelstack_job_status;
DROP TYPE IF EXISTS levelstack_intake_status;
```

Do **not** run this on production without a backup and team sign-off.

---

## Generate TypeScript types (optional, after migrate)

```bash
supabase gen types typescript --project-id lppmbgqsovtfbpbvjvxi > lib/database.types.ts
```

Or use the Supabase dashboard **API → Generate types**.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `relation "orders" does not exist` | Wrong Supabase project — switch to LPD project |
| `permission denied for table orders` | User not authenticated, or RLS policy missing on hub |
| CLI `Access token not provided` | Run `supabase login` |
| `policy already exists` | Migration already applied — use verify SQL above |
| App shows “Supabase: set keys” on home | Fill `.env.local` and restart `pnpm dev` |

---

## Next after migration

1. Restart dev: `pnpm dev` — home page should show **Supabase: configured**.
2. Phase 1: `/intake` route + auth gate using `hasLevelStackAccess()`.
3. Hub PR: `NEXT_PUBLIC_LEVELSTACK_APP_URL` + `/account` CTA.
