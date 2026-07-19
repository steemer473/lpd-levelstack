# LevelStack Recommendation Object (P2-1)

Reusable core data model for Action Roadmap decisions.
Persistence: nested Zod inside existing `report_json` JSONB (OD-3 Option B). No recommendation/evidence tables in V1 (OD-10).

**Status:** Schema shipped 2026-07-19. **P2-4 dual-write live** for Search Footprint + Reputation (`attachSearchReputationRecommendations`). Roadmap UI deferred to P2-5.

**Companions:** [`evidence-provenance.md`](./evidence-provenance.md) (P2-2), [`confidence-methodology.md`](./confidence-methodology.md) (P2-3), [`scoring-methodology.md`](./scoring-methodology.md) (P1).

## Implementation

| Piece | Location |
|-------|----------|
| Zod schemas | `lib/pipeline/recommendation-types.ts` |
| Report JSON field | optional `recommendations[]` on `levelstackReportJsonSchema` (`report-types.ts`) |
| Migration helpers | `lib/pipeline/map-to-recommendation.ts` |
| Dual-write (Search + Reputation) | `lib/pipeline/build-recommendations.ts` → hooked in `run-report-pipeline.ts` before sanitize |
| Reputation Clutch/G2/Capterra cluster | `buildReputationFindings` in `serp-backed-sections.ts` |

## Dual-schema period

Until P2-5:

| Surface | Canonical |
|---------|-----------|
| Section findings, scores, free/paid UI | `findingSchema` / `reportSectionSchema` |
| Action plan buckets (thisWeek / thisMonth / thisQuarter) | `actionItemSchema` / `actionPlanSchema` |
| Ranked decisions (Search + Reputation) | `recommendations[]` dual-written on every ready report |

Existing stored reports without `recommendations` remain valid. Do not remove findings/actionPlan until P2-5 UI consumes Recommendations.

## Field table (V1)

| Field | Shape | Notes |
|-------|-------|-------|
| `id` | string | Stable within report, e.g. `rec_search_footprint_…` |
| `title` | string | What to do |
| `summary` | string | Why it matters |
| `evidence` | `EvidenceItem[]` | P2-2 provenance — filled from SERP/directory in P2-4 |
| `confidence` | `{ band, rationale, methodologyRef }` | P2-3 rule-based bands via `assignConfidenceBand` |
| `priority` | `P0`–`P3` | Roadmap sort; distinct from finding `severity` |
| `roi` | `{ kind, rangeLabel, notes? }` | Ranges/labels only — no fake $ points |
| `dependencies` | `{ recommendationIds: string[] }` | ID graph, not label-text `findingRef` |
| `owner` | `{ role }` | Typed role enum |
| `automatability` | `{ automatable, lpdProduct? }` | General flag + LPD product hint |
| `artifact` | `{ kind, content? }` | OD-13 — checklist / copy_rewrite / reply_draft templates in P2-4 |
| `urgency` | string | OD-14 why-now (band-scaled) |
| `consequenceOfInaction` | string | OD-14 inaction risk (band-scaled) |
| `sourceSectionId` | string? | `search_footprint` or `online_reputation` |
| `effortHint` | string? | From `actionItem.time` when mapped |

## Mapping: Finding / ActionItem → Recommendation

| Legacy | Recommendation |
|--------|----------------|
| `finding.label` / `headline` | `title` |
| `finding.detail` / `actionItem.sub` | `summary` |
| `finding.severity` | `priority` via `priorityFromSeverity` |
| SERP / directory results | `evidence[]` (`serp_organic`, `ai_overview`, `directory_serp`) |
| Check availability + freshness | `confidence` via `assignConfidenceBand` |
| Finding type heuristics | `artifact` templates |
| `actionItem.who` | `owner.role` (migration mapper) |
| `actionItem.automatorFlag` / `automatorProduct` | `automatability` |

## OD-14 guardrail

Intensity of `urgency` and `consequenceOfInaction` scales with `confidence.band` (templates in `build-recommendations.ts`). No High-severity urgency language on `band: Low`.

## Next

- **P2-5** — Action Roadmap UI over `recommendations[]`.
