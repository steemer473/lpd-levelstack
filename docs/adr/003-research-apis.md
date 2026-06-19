# ADR 003 — Research API stack (Phase 2.1 → 2.3)

## Status

Accepted (updated June 2026 — SERP cost optimization + multi-provider failover)

## Context

§10.2 requires automated Google footprint, reputation signals, website/presence checks, and competitive context without manual research for Standard tier. SerpAPI quota exhaustion blocked free snapshots at ~17 queries per run with no caching or fallback.

## Decision

| Capability | Vendor | Env | Notes |
|------------|--------|-----|--------|
| Google SERP (organic) | **Multi-provider chain** | See below | Footprint, reputation, social platform search |
| Google Maps / GBP | Same chain | Same | Rating, review count, address when listing found |
| SERP cache | **Supabase** `levelstack_serp_cache` | `SERP_CACHE_TTL_HOURS` (default 24) | Read-through cache per engine + query |
| Website signals | **Direct fetch** + optional **Firecrawl** | `FIRECRAWL_API_KEY` | Title, meta, H1, CTA |
| Mobile performance | **PageSpeed Insights API v5** | `GOOGLE_PAGESPEED_API_KEY` optional | Mobile score, LCP, CLS |
| Social recency (light) | **Direct fetch** of intake URLs | — | og:title / updated_time |
| Competitor snapshots | SERP chain + website fetch | ≥1 provider | Per top-3 domain |
| AI visibility (ChatGPT / Perplexity) | **Not called** | — | Serp `ai_overview` when present |
| Synthesis | **OpenAI** | `OPENAI_API_KEY` | `gpt-4o-mini` + quality gate |
| Dev mock | Fixture provider | `LEVELSTACK_DEV_MOCK_SERP` | Local only; blocked on Vercel |

### SERP providers (per-query failover)

Production requires **at least one** configured provider:

| Provider | Env vars |
|----------|----------|
| SerpAPI | `SERPAPI_KEY` |
| SearchAPI.io | `SEARCHAPI_KEY` |
| DataForSEO | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` |

Chain order: `SERP_PROVIDER_CHAIN` (default `serpapi,searchapi,dataforseo`). Providers without keys are skipped. On quota/limit errors (402, 429, or message match), the router tries the next provider for that query only.

Implementation: `lib/research/serp/` (router, cache, providers).

### Query budget

| Tier | Organic SERP queries (approx) |
|------|-------------------------------|
| Free snapshot | ~7 (brand 1, social 2, directory 4) |
| Full report | ~26 organic + 1 Maps (+ competitor lookups) |

Cached queries within TTL cost **0** additional API calls.

**Pipeline mode:** `research_mode: "prd-v2"` on completed jobs.

## Consequences

- Free snapshot Serp cost drops ~60% on first run; repeat runs within 24h reuse cache.
- Provider exhaustion no longer hard-fails the pipeline when a backup provider has quota.
- Optional `GOOGLE_PAGESPEED_API_KEY` recommended before production scale.
- Social signals may be blocked by platforms — limitations surfaced in findings, never invented metrics.
