# Phase 2.1 — Real research + synthesis

## Required env (product `.env.local`)

```bash
# At least one SERP provider:
SERPAPI_KEY=your_serpapi_key
# SEARCHAPI_KEY=
# DATAFORSEO_LOGIN=
# DATAFORSEO_PASSWORD=

OPENAI_API_KEY=your_openai_key

# Optional:
FIRECRAWL_API_KEY=
SERP_PROVIDER_CHAIN=serpapi,searchapi,dataforseo
SERP_CACHE_TTL_HOURS=24

# Local dev — zero-cost SERP (never set on Vercel):
# LEVELSTACK_DEV_MOCK_SERP=true
```

Restart `pnpm dev` after adding keys.

## What runs per report

| Step | Research |
|------|----------|
| Search footprint | SERP chain: business name (free: 1 query; paid: 2–4) |
| Reputation | SERP chain: reviews + directory queries (free: 4; paid: 9) |
| Social search | SERP chain: platform site queries (free: LinkedIn + Facebook; paid: 6) |
| Digital presence | Website fetch (Firecrawl if configured) + intake socials |
| Revenue funnel | Website CTA signals + intake offer/ad/list data |
| Competitive context | SerpAPI service query → top 3 competitor domains |
| Action plan | LLM synthesis from all research |

OpenAI (`gpt-4o-mini`) turns the research bundle into finding cards + executive summary + action plan (Phase 2.2). Without keys, the pipeline falls back to Serp-backed sections.

**Phase 2.3 (Sprint 2):** PageSpeed mobile score, Google Maps/GBP, Yelp/BBB reputation queries, competitor review snapshots, social profile metadata. See [`phase-2.2-analysis-quality.md`](./phase-2.2-analysis-quality.md).

## Re-run a report (local dev)

Reset rows in Supabase SQL editor, then open the report URL (triggers `POST .../run`):

```sql
UPDATE levelstack_reports
SET status = 'pending', report_json = NULL, error_message = NULL
WHERE id = 'YOUR_REPORT_ID';

UPDATE levelstack_research_jobs
SET status = 'pending', error_message = NULL, metadata = '{}'::jsonb
WHERE id = (SELECT job_id FROM levelstack_reports WHERE id = 'YOUR_REPORT_ID');
```

Then visit `http://localhost:3001/reports/YOUR_REPORT_ID`.

Or call (while signed in on localhost:3001):

```bash
# Dev only — rebuild a report that is already `ready`
curl -X POST "http://localhost:3001/api/reports/YOUR_REPORT_ID/run?regenerate=1" \
  -H "Cookie: <your session cookie>"
```

Verify keys load and APIs respond:

```bash
node scripts/verify-research-keys.mjs
```

## ADRs

- [002-job-orchestration.md](./adr/002-job-orchestration.md)
- [003-research-apis.md](./adr/003-research-apis.md)

## Verify

After generation, check `levelstack_research_jobs.metadata.synthesis_llm = true` and findings reference real SERP titles/snippets in the report UI.
