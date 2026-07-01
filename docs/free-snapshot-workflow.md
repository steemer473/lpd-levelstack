# Free snapshot workflow

End-to-end flow for the LevelStack free snapshot on `levelstack.levelplaydigital.com`.

## User journey

1. **Hub bridge** — `levelplaydigital.com/free` redirects to product `/free`
2. **Form** — business name, domain, email, optional city → submit **Run my snapshot**
3. **Auth** — magic-link redirect to `/reports/{id}` progress screen
4. **Pipeline** — live SERP research (~7 queries for free tier) + website fetch → report JSON saved
5. **Report** — progress UI refreshes to full report (~1.5s ready state)
6. **Email** — one user email when generation completes; primary CTA uses a **30-day possession token** (`rtoken`). Supabase sign-in links (resend / expired token) use **24-hour OTP**.

## One snapshot per email (production)

Each email gets **one** free snapshot. A second submit returns **409** and opens the existing report.

The form shows: *"You already have a snapshot for {business} — opening your existing report."*

To test a **different business** in production, use a **new email address**.

## Dev re-run (local only)

In `NODE_ENV=development`, the form automatically calls `/api/free-intake?replace=1`, which deletes the prior intake/report/job for that email and creates a fresh snapshot.

Optional env (instead of query param):

```bash
LEVELSTACK_DEV_REPLACE_SNAPSHOT=true
```

Never set this on Vercel.

## Real analysis requirements

Reports only mark `ready` when:

- **SERP data** exists (brand/reputation searches returned results)
- **Website fetch** succeeded (title, H1, meta, or body content)

If research fails, the report status is **failed** with: *"We couldn't complete live research. Try again or contact support."*

### Required env vars (Production)

| Variable | Purpose |
|---|---|
| **≥1 SERP provider** | `SERPAPI_KEY`, and/or `SEARCHAPI_KEY`, and/or `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` |
| `OPENAI_API_KEY` | Search footprint synthesis (free tier) |
| `SUPABASE_*` | Auth + report storage |
| `NEXT_PUBLIC_APP_URL` | Magic-link redirects |

Free tier uses ~7 SERP queries per run (brand 1, social 2, directory 4). Results are cached in Supabase for 24 hours — re-runs for the same business within that window reuse cached data at zero API cost.

Local dev with zero API cost:

```bash
LEVELSTACK_DEV_MOCK_SERP=true
```

Recommended: `RESEND_API_KEY`, `FROM_EMAIL`, `LEVELSTACK_ADMIN_NOTIFY_EMAIL`, `GHL_API_KEY`, `GHL_LOCATION_ID`

**Supabase Auth:** Set **Email OTP expiration** to **86400 seconds (24 hours)** — the maximum allowed on hosted Supabase (Authentication → Providers → Email). Used for sign-in / resend flows only. Report-ready email CTAs use a separate **30-day** possession token (`REPORT_ACCESS_TOKEN_TTL_SECONDS`).

Verify locally:

```bash
pnpm verify:env
pnpm verify:research
vercel env ls production
```

## Failed report recovery

If research fails, the report stays on a **failed** screen — there is no production “Regenerate” button and **no auto-retry** when the user reopens the link.

| Situation | What to do |
|-----------|------------|
| SerpAPI quota exhausted, backup keys added | Merge/deploy SERP failover code, redeploy Vercel, then SQL reset or new submission |
| Same failed report after keys fixed | SQL reset (see [phase-2-1-research.md](./phase-2-1-research.md#failed-report-recovery)) — rerun uses fresh research, not old missing data |
| Dev testing | **Regenerate report** on failed page, or `LEVELSTACK_DEV_REPLACE_SNAPSHOT` + re-submit |
| One email, new business in production | Use a **new email** (one snapshot per email) |

Failed runs do **not** write to `levelstack_serp_cache`. Cache only stores successful provider responses (24h TTL).

## Deploy checklist (SERP updates)

1. Apply `supabase/migrations/20250619100000_levelstack_serp_cache.sql`
2. Set Vercel env: backup provider keys + `SERP_PROVIDER_CHAIN=searchapi,dataforseo,serpapi`
3. **Redeploy** production (env vars alone are not enough)
4. `pnpm verify:research` locally after pulling env into `.env.local`

## Transactional email

| When | Recipient | Email |
|---|---|---|
| Form submit | Admin (`LEVELSTACK_ADMIN_NOTIFY_EMAIL`, default `admin@levelplaydigital.com`) | New submission + contact info |
| Pipeline complete | User (submitter) | Report ready + possession link (**30 days**); sign-in resend link (**24 hours**) |

Nurture / upgrade sequences (Emails 2–5, W1–W4) are **not** sent from either app — Plunk runs them after track events. See [operations/plunk-nurture-workflow.md](./operations/plunk-nurture-workflow.md).

## GHL sync (two phases — CRM mirror only)

| Phase | When | Tags | Key fields |
|-------|------|------|------------|
| **Intake** | Form submit | `levelstack`, `levelstack_free_snapshot` (or `levelstack_paid_intake`) | `website_url`, `intake_source`, `levelstack_report_url`, optional `market_city` |
| **Report complete** | Pipeline `status = ready` | `levelstack` only | `top_competitor`, `top_finding`, `report_tier`, signed `levelstack_report_url` |

Functions: `syncFreeSnapshotLead` / `syncPaidIntakeLead` (intake), `syncReportCompleteEnrichment` (report ready).

**Finish nurture in Plunk:** [operations/plunk-nurture-workflow.md](./operations/plunk-nurture-workflow.md) — event `levelstack_report_ready`, Emails 2–5 copy, exit on `levelstack_purchased`.

Setup custom fields: `pnpm setup:ghl-fields`

## Key files

| Area | File |
|---|---|
| Form | `components/free/free-snapshot-form.tsx` |
| API | `app/api/free-intake/route.ts` |
| Pipeline | `lib/pipeline/run-report-pipeline.ts` |
| Research gate | `lib/pipeline/research-quality.ts` |
| Report UI | `components/report/levelstack-report-view.tsx` |
| Dev replace | `lib/intake/replace-free-snapshot.ts` |

## Manual QA

See [phase-1-e2e-test.md](./phase-1-e2e-test.md) — Free snapshot flow section.
