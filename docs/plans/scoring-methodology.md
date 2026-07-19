# LevelStack scoring methodology (P1-1 / P1-2)

Internal methodology for customer-facing section scores and Overall.
Locked decisions: OD-1 Option A, OD-2 Option A (`levelstack-vnext-prd.md` §7).

## Overall score (customer-facing)

**Rule:** equal-weight rounded arithmetic mean of **displayed diagnostic section scores that have a numeric score**.

```
overallScore = round( mean( section.score for each scored diagnostic section ) )
letterGrade  = letterGradeFromScore(overallScore)   // A≥90, B≥80, C≥70, D≥60, else F
```

**Included:** every section present on the rendered report except:

- `action_plan` — prioritized tasks, not a presence diagnostic
- `executive_summary` — if ever scored as a section
- sections with `status: "insufficient_data"` or `score: null` (P1-2)

**Not used for Overall:** `scoreAllSignals` weighted signal average. That audit bundle may still power insights, signal rows, and upgrade teasers — it must not set `meta.overallScore` / `meta.letterGrade`. Unavailable signals are skipped from that internal weighted average as well.

**Free tier:** mean is over the free snapshot’s unlocked **scored** diagnostic sections only (whatever remains after `FREE_TIER_SECTION_IDS` filtering). Locked paid sections and insufficient-data sections do not enter the mean.

**Paid tier:** mean is over all scored diagnostic sections in the assembled report (Search, Reputation, Digital Presence, Revenue funnel, Competitive, etc.), excluding `action_plan` and insufficient-data sections.

Implementation: `lib/audit/derive-overall-from-sections.ts`.

## Check availability (P1-2)

Each underlying check is classified before it can affect a section score:

| Availability | Meaning |
|--------------|---------|
| `ok` | Checked; healthy / acceptable signal |
| `negative` | Checked; genuine gap (not found, weak reviews, etc.) |
| `unavailable` | Attempted; provider/error/internal limitation |
| `not_checked` | Tier-skipped / never fetched (e.g. `Not fetched yet.`) |

Implementation: `lib/pipeline/check-availability.ts` (uses P0-1 `isInternalLimitation` / limitation classifiers).

**Insufficient-data rule:** if `(unavailable + not_checked) / checks ≥ 50%` for a section, the section renders `status: "insufficient_data"` with `score: null` — never a numeric cliff score. Failed-check findings may still appear as “Unable to verify…” customer copy, but they do **not** enter the severity cliff.

**Tier copy:** free/tier-skipped GBP (`not_checked`) uses distinct copy from paid “checked, not found.”

## Section scores (current formulas)

These remain the section builders’ responsibility. Overall does **not** recompute them — it only averages the numeric scores already shown.

| Section | Primary scorer | Formula (summary) |
|--------|----------------|-------------------|
| Search Footprint (free, LLM path) | `synthesizeFreeSearchFootprint` | Model returns 0–100; schema-constrained |
| Search Footprint (fallback) | `scoreSectionFromChecks` / research findings | Cliff over scoreable checks only; else insufficient_data |
| Reputation / Digital Presence (research path) | `scoreSectionFromChecks` in `serp-backed-sections.ts` | Cliff buckets on `ok`/`negative` only: critical→42, high/medium→62, else→78; ≥50% blocked → insufficient_data |
| Other paid sections | LLM synthesis or SERP-backed builders | Same report section schema (`score` 0–100 or null) |

## Free-tier AI Overview check (P0-2)

Search Footprint includes a live **Google AI Overview** presence check derived from the brand SERP response already collected for free snapshots.

- **Cost:** +0 additional SERP calls (field on cached brand organic query; `SERP_CACHE_TTL_HOURS`, default 24).
- **Not included:** ChatGPT / Perplexity live clients (deferred).
- **Scoring:** Classified via `check-availability` (`ok` / `negative` / `unavailable` / `not_checked`) and included in serp-backed Search Footprint `searchChecks`. Failed SERP does not cliff-score as a fake “missing from AI” gap.
- **Observability:** Track `% free reports with non-null aiOverview` in dogfood; cost risk is closed at +0 calls regardless of that rate.

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

## Why this closes Reputation 62 with half-failed checks

Previously any `search.limitation` became a medium finding and depressed the section via the cliff. Under P1-2, errored checks are `unavailable` and do not enter the cliff; when ≥50% of checks are blocked, the section shows **Insufficient data** instead of a confident 62.
