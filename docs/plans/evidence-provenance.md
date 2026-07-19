# LevelStack evidence provenance & freshness (P2-2)

Internal standard for every claim that will back a Recommendation Object `evidence` field.
Locked with OD-3 Option B and OD-10 Option A (`levelstack-vnext-prd.md` §7).
Companion: `confidence-methodology.md` (P2-3). Scoring rules remain in `scoring-methodology.md` (P1).

**Status:** Locked 2026-07-19 (docs only). Consumed by P2-1 schema work. No evidence-store table in V1.

## Storage (V1)

| Layer | Role |
|-------|------|
| `report_json` JSONB — nested `evidence[]` on each Recommendation Object | **Canonical provenance** for customer-facing claims |
| `levelstack_serp_cache` + `SERP_CACHE_TTL_HOURS` (default 24) | **Operational re-fetch cache** during generation — not a provenance store |
| Separate evidence-snapshot / relational tables | **Deferred (P3)** until re-synthesis / support / audit workflows need them |

Do not add `evidence_*` tables, promote cache rows into claim history, or rebuild the pipeline around a new store in V1.

## Evidence item shape (contract for P2-1)

Each citation on a recommendation is a structured object (Zod in P2-1), not prose alone:

| Field | Type | Notes |
|-------|------|-------|
| `sourceType` | enum | See source types below |
| `sourceLabel` | string | Customer-safe label (“Google search”, “Google Business Profile”, …) |
| `provider` | string? | e.g. `serpapi` / `searchapi` / `dataforseo` — support/debug only; never raw in customer copy |
| `capturedAt` | ISO-8601 | Collection time, or cache-hit time used for this report |
| `query` | string? | Search query when applicable |
| `url` | string? | Citation URL / SERP evidence link (OD-13 / P2-4) |
| `rawRef` | string? | Opaque pointer into research bundle or cache key — support only, not customer-facing |
| `freshnessClass` | `fresh` \| `aging` \| `stale` \| `unknown` | Computed at **generation** time from age vs rules below |

## Source types

| `sourceType` | Typical collector | Customer `sourceLabel` example |
|--------------|-------------------|--------------------------------|
| `serp_organic` | Brand / service organic SERP | Google search |
| `serp_maps` | Maps / GBP-style place lookup | Google Business Profile |
| `website` | Site fetch / HTML parse | Website |
| `pagespeed` | PageSpeed Insights | Page speed |
| `ai_overview` | AI Overview field on brand SERP (P0-2) | Google AI Overview |
| `social_serp` | LinkedIn / Facebook (etc.) SERP checks | Social search |
| `directory_serp` | Reviews / directory site: queries | Directory search |
| `intake` | Declared intake fields | Your intake |
| `derived` | LLM / synthesis inference with no direct citation | Derived insight |

**Rule:** `derived` must never be the sole support for a High-confidence recommendation (see `confidence-methodology.md`). Prefer attaching at least one non-`derived` citation when the claim is claimable from live research.

## Staleness rules (generation-time)

Age is measured from `capturedAt` to report generation time.

| Family | `fresh` | `aging` | `stale` (must not support High confidence alone) |
|--------|---------|---------|--------------------------------------------------|
| SERP / Maps / AI Overview / social / directory (`serp_*`, `ai_overview`, `social_serp`, `directory_serp`) | ≤24h (align `SERP_CACHE_TTL_HOURS`) | 24–72h | >72h |
| Website fetch / PageSpeed (`website`, `pagespeed`) | ≤7d | 7–30d | >30d |
| Intake-declared facts (`intake`) | Always `fresh` for that report run | — | — |
| `derived` | Inherits worst `freshnessClass` of cited children; `unknown` if none | — | — |

If age cannot be determined, use `unknown` and treat as no better than `aging` for confidence caps.

## Unavailable / not_checked (P1-2)

Errored or tier-skipped checks (`CheckAvailability` `unavailable` / `not_checked` in `lib/pipeline/check-availability.ts`) produce:

- **No claim evidence** fabricated to fill the gap, and/or
- An explicit “unable to verify” style limitation finding — never a fake citation URL or invented SERP hit.

## SERP evidence links (OD-13 / P2-4)

When a finding cites live search:

1. Prefer `url` = Google (or equivalent) search URL for the query used, or a stable result URL from the research bundle.
2. Set `query` to the exact query string when known.
3. Set `capturedAt` / `freshnessClass` from the SERP response (or cache row) used for this report — not “now” at view time.
4. Do not invent links for checks that never ran.

## Report viewing (point-in-time)

A saved report is a snapshot. Customer UI should show **Observed {date}** from `capturedAt` when citations render.

Out of scope for this lock:

- Re-fetch-on-view
- Auto-invalidating stored recommendations when cache TTL expires
- Optional “report may be outdated” banners for very old PDFs/views (may be added later without changing this provenance shape)

## Why this closes critique §4 / P2-2

Critique required source, timestamp, and staleness before Evidence fields can be trusted. This doc defines those three for every V1 source family, keeps persistence inside `report_json` + the existing SERP cache, and leaves the full evidence store deferred — matching OD-3 / OD-10.

## Implementation note

P2-1 adds Zod types matching this shape. P2-4 populates `evidence[]` for Search Footprint + Reputation. No code ships in this P2-2 lock.
