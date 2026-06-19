# Phase 2.1 — Real research + synthesis

## Required env (product `.env.local`)

```bash
# At least one SERP provider:
SERPAPI_KEY=your_serpapi_key
# SEARCHAPI_KEY=
# DATAFORSEO_LOGIN=your_account_email
# DATAFORSEO_PASSWORD=raw_api_password_from_dashboard  # NOT Base64, NOT dashboard login password

OPENAI_API_KEY=your_openai_key

# Optional:
FIRECRAWL_API_KEY=
SERP_PROVIDER_CHAIN=searchapi,dataforseo,serpapi   # prefer healthy providers first
SERP_CACHE_TTL_HOURS=24

# Local dev — zero-cost SERP (never set on Vercel):
# LEVELSTACK_DEV_MOCK_SERP=true
```

Restart `pnpm dev` after adding keys. On Vercel, **redeploy after changing env vars** so functions pick up new keys.

Verify:

```bash
pnpm verify:research   # tests each configured SERP provider + OpenAI
pnpm verify:env
```

## What runs per report

| Step | Research |
|------|----------|
| Search footprint | SERP chain: business name (free: 1 query; paid: 2–4) |
| Reputation | SERP chain: reviews + directory queries (free: 4; paid: 9) |
| Social search | SERP chain: platform site queries (free: LinkedIn + Facebook; paid: 6) |
| Digital presence | Website fetch (Firecrawl if configured) + intake socials |
| Revenue funnel | Website CTA signals + intake offer/ad/list data |
| Competitive context | SERP chain service query → top 3 competitor domains |
| Action plan | LLM synthesis from all research |

OpenAI (`gpt-4o-mini`) turns the research bundle into finding cards + executive summary + action plan (Phase 2.2). Without keys, the pipeline falls back to SERP-backed sections.

**Phase 2.3 (Sprint 2):** PageSpeed mobile score, Google Maps/GBP, Yelp/BBB reputation queries, competitor review snapshots, social profile metadata. See [`phase-2.2-analysis-quality.md`](./phase-2.2-analysis-quality.md).

## SERP provider notes

- **Production** requires ≥1 of `SERPAPI_KEY`, `SEARCHAPI_KEY`, or `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` (`env.mjs`).
- **Failover:** On quota/limit errors, the router tries the next provider in `SERP_PROVIDER_CHAIN` per query. See [ADR 003](./adr/003-research-apis.md).
- **Cache:** Successful responses are stored in `levelstack_serp_cache` for 24h. Failed runs do **not** cache empty results.
- **DataForSEO:** Use the auto-generated **API password** from [API Access](https://app.dataforseo.com/api-access) — not your dashboard login password and not the Base64 credential blob.

## Failed report recovery

Reports that fail research gate with *"We couldn't complete live research"* have `status: failed` and **no** `report_json`. Opening the URL again does **not** auto-retry.

| Environment | How to retry |
|-------------|--------------|
| **Local dev** | **Regenerate report** button on failed page, or `POST .../run?regenerate=1` (dev only) |
| **Production** | SQL reset below, then open report URL; or submit a **new** free snapshot (new email) |
| **After fixing keys** | Must have **new code deployed** (multi-provider router) + Vercel redeploy with backup keys |

A rerun always builds a **fresh** research bundle — it does not reuse old missing data. If backup providers are healthy, the same business should succeed on retry.

### SQL reset (production or local)

```sql
UPDATE levelstack_reports
SET status = 'pending', report_json = NULL, error_message = NULL
WHERE id = 'YOUR_REPORT_ID';

UPDATE levelstack_research_jobs
SET status = 'pending', error_message = NULL, metadata = '{}'::jsonb
WHERE id = (SELECT job_id FROM levelstack_reports WHERE id = 'YOUR_REPORT_ID');
```

Then visit `https://levelstack.levelplaydigital.com/reports/YOUR_REPORT_ID` (or localhost equivalent). The progress screen triggers `POST /api/reports/{id}/run`.

### Dev-only regenerate (ready or failed)

```bash
curl -X POST "http://localhost:3001/api/reports/YOUR_REPORT_ID/run?regenerate=1" \
  -H "Cookie: <your session cookie>"
```

## Re-run a report (local dev)

Same as [Failed report recovery](#failed-report-recovery) above. For a **ready** report with stale placeholder data, use **Rebuild report (dev)** on the report page.

## ADRs

- [002-job-orchestration.md](./adr/002-job-orchestration.md)
- [003-research-apis.md](./adr/003-research-apis.md)

## Verify

After generation:

- `levelstack_research_jobs.metadata.synthesis_llm = true` (paid tier)
- Findings reference real SERP titles/snippets in the report UI
- Optional: rows in `levelstack_serp_cache` with `provider` = `searchapi`, `dataforseo`, etc.

Apply migration `supabase/migrations/20250619100000_levelstack_serp_cache.sql` before expecting cache writes.
