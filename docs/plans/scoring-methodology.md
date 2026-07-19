# LevelStack scoring methodology (P1-1)

Internal methodology for customer-facing section scores and Overall.
Locked decisions: OD-1 Option A, OD-2 Option A (`levelstack-vnext-prd.md` §7).

## Overall score (customer-facing)

**Rule:** equal-weight rounded arithmetic mean of **displayed diagnostic section scores**.

```
overallScore = round( mean( section.score for each diagnostic section in the report ) )
letterGrade  = letterGradeFromScore(overallScore)   // A≥90, B≥80, C≥70, D≥60, else F
```

**Included:** every section present on the rendered report except:

- `action_plan` — prioritized tasks, not a presence diagnostic
- `executive_summary` — if ever scored as a section

**Not used for Overall:** `scoreAllSignals` weighted signal average. That audit bundle may still power insights, signal rows, and upgrade teasers — it must not set `meta.overallScore` / `meta.letterGrade`.

**Free tier:** mean is over the free snapshot’s unlocked diagnostic sections only (whatever remains after `FREE_TIER_SECTION_IDS` filtering). Locked paid sections do not enter the mean.

**Paid tier:** mean is over all diagnostic sections in the assembled report (Search, Reputation, Digital Presence, Revenue funnel, Competitive, etc.), excluding `action_plan`.

Implementation: `lib/audit/derive-overall-from-sections.ts`.

## Section scores (current formulas)

These remain the section builders’ responsibility. Overall does **not** recompute them — it only averages the scores already shown.

| Section | Primary scorer | Formula (summary) |
|--------|----------------|-------------------|
| Search Footprint (free, LLM path) | `synthesizeFreeSearchFootprint` | Model returns 0–100; schema-constrained |
| Search Footprint (fallback) | `scoreFromSignals` / research findings | Deterministic fallback when LLM unavailable |
| Reputation / Digital Presence (research path) | `scoreFromFindings` in `serp-backed-sections.ts` | Cliff buckets: critical→42, high→62, else→78 (approx.) |
| Other paid sections | LLM synthesis or SERP-backed builders | Same report section schema (`score` 0–100) |

Failed/skipped checks and “insufficient data” states are **P1-2** (not this doc). Until P1-2 ships, errored checks may still depress a section via findings severity.

## Letter grades

**One threshold set everywhere:** `letterGradeFromScore` in `lib/audit/types.ts`.

| Grade | Score |
|-------|-------|
| A | ≥ 90 |
| B | ≥ 80 |
| C | ≥ 70 |
| D | ≥ 60 |
| F | &lt; 60 |

Legacy inline thresholds in `assembleReportJson` (B/C/D at 80/70/55, no A) are removed as of P1-1.

## Canonical assembly path (OD-2)

| Path | Role |
|------|------|
| `serp-backed-sections` / free `assembleFreeReportFromResearch` / paid `synthesizeReportSections` → research builders | **Canonical** for customer-facing section content and scores |
| `buildReportSections` / intake-only legacy in `build-sections.ts` | **Hard-gated** — not used for production assembly when a research bundle exists; retained only for unreachable fallback / tests |
| `assembleReportJson` | Still shapes paid `report_json` meta fields, but Overall/grade come from `deriveOverallFromSections` only |

## Why this closes 87 / 62 / 62 → 57

Previously Overall came from an independent signal pool (`scoreAllSignals`), so three visible section scores could not explain the headline number. Under this methodology, those same three scores average to ~70 (C), and that **is** Overall.
