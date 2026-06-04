# Phase 1 — manual E2E test

## Prerequisites

- Hub (`lpd-redesign`): `NEXT_PUBLIC_LEVELSTACK_APP_URL=http://localhost:3001` in **hub** `.env.local`
- Product (`lpd-levelstack`): `pnpm dev` on port **3001**; `NEXT_PUBLIC_APP_URL=http://localhost:3001`; `NEXT_PUBLIC_HUB_URL=http://localhost:3000`
- Stripe test mode + LevelStack SKUs configured on hub

## Flow

1. **Purchase** — Hub `/platform/levelstack#pricing` → add Standard or Review Call → checkout (test card).
2. **Checkout success** — Page shows “LevelStack order confirmed” and **Continue to intake** (external link to product app).
3. **Product sign-in** — Open intake URL → redirect to `/auth/sign-in` if needed → sign in with **same email** used at hub checkout.
4. **Intake** — Complete all required fields; website must be reachable.
5. **Report progress** — After submit, redirect to `/reports/[reportId]` with live step progress; page refreshes when `levelstack_reports.status = ready`.
6. **Verify Supabase** (optional):
   - `levelstack_intakes` → `status = submitted`
   - `levelstack_research_jobs` → `status = completed`
   - `levelstack_reports` → `status = ready`, `report_json` populated
6. **Hub account** — `/account` shows LevelStack card + sidebar link when user has completed LevelStack `orders` row.

## Intake redirects to hub pricing?

That means you’re **signed in** on the product app but **no completed LevelStack `orders` row** exists for your `user_id`.

**Option A — real purchase:** Complete checkout on the hub with the same email you use on `localhost:3001`.

**Option B — local dev bypass:** In product `.env.local`:

```bash
LEVELSTACK_DEV_BYPASS_ENTITLEMENT=true
```

Restart `pnpm dev`. Never set this in production.

**Option C — verify Supabase** (SQL editor), replace `YOUR_USER_ID`:

```sql
SELECT id, plan_id, status, user_id, created_at
FROM orders
WHERE plan_id IN ('levelstack-standard', 'levelstack-review-call')
ORDER BY created_at DESC
LIMIT 10;
```

If `user_id` is null after checkout, link the order to your auth user or re-run checkout while signed in on the hub.

## Phase 2.1 — live research

Add `SERPAPI_KEY` and `OPENAI_API_KEY` to product `.env.local` (see `docs/phase-2-1-research.md`). Re-run a report via SQL reset + open `/reports/[id]`.

## Cross-domain auth note (v1)

Sessions are **per origin**. Signing in on the hub does not auto-sign you in on `localhost:3000` (product). After purchase, use **Continue to intake** and sign in once on the product app with the same credentials.
