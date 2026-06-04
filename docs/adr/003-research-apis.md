# ADR 003 — Research API stack (Phase 2.1 → 2.3)

## Status

Accepted (updated June 2026 — Sprint 2 evidence)

## Context

§10.2 requires automated Google footprint, reputation signals, website/presence checks, and competitive context without manual research for Standard tier.

## Decision

| Capability | Vendor | Env | Notes |
|------------|--------|-----|--------|
| Google SERP (organic) | **SerpAPI** | `SERPAPI_KEY` | Footprint, reputation (incl. `site:yelp.com`, `site:bbb.org`), competitor review snippets |
| Google Maps / GBP | **SerpAPI** `google_maps` | `SERPAPI_KEY` | Rating, review count, address when listing found |
| Website signals | **Direct fetch** + optional **Firecrawl** | `FIRECRAWL_API_KEY` | Title, meta, H1, CTA |
| Mobile performance | **PageSpeed Insights API v5** | `GOOGLE_PAGESPEED_API_KEY` optional | Mobile score, LCP, CLS; works without key at low quota |
| Social recency (light) | **Direct fetch** of intake URLs | — | og:title / updated_time; login walls noted as limitation |
| Competitor snapshots | SerpAPI + website fetch | `SERPAPI_KEY` | Per top-3 domain: review SERP + homepage title |
| AI visibility (ChatGPT / Perplexity) | **Not called** | — | Serp `ai_overview` when present |
| Synthesis | **OpenAI** | `OPENAI_API_KEY` | `gpt-4o-mini` + quality gate (Phase 2.2) |
| Fallback | Serp-backed sections | — | When LLM unavailable |

**Pipeline mode:** `research_mode: "2.3"` on completed jobs.

## Consequences

- Higher Serp volume per report (~12–18 organic/maps queries + 3 competitor lookups).
- PageSpeed adds ~5–15s per report; run in parallel with website fetch in `collectDigitalPresence`.
- Social signals may be blocked by platforms — limitations surfaced in findings, never invented metrics.
- Optional `GOOGLE_PAGESPEED_API_KEY` recommended before production scale.
