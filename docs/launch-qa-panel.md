# Launch QA panel — 5-report gate ($497)

Run before paid acquisition. Target: **median ≥ 4/5** across five diverse intakes per [`phase-2.2-analysis-quality.md`](./phase-2.2-analysis-quality.md).

## Industries (one report each)

1. Real estate / brokerage  
2. Fitness / coaching  
3. Home services / contractor  
4. Consultant / professional services  
5. Healthcare-adjacent (dental, wellness, legal-lite)

## Score each report (1–5) on DoD criteria

| ID | Criterion | 1 = fail | 5 = pass |
|----|-----------|----------|----------|
| A | **Surprise** — ≥1 finding cites URL, position, or platform owner likely missed | Generic only | Specific evidence |
| B | **Executive summary** — structured insights + critical issue + scope note | Missing / filler | All fields evidence-backed |
| C | **Stakes** — ad spend → landing/trust when `hasActiveAdSpend=yes` | Not mentioned | Explicit in revenue risk + funnel |
| D | **Action plan** — ≤4 this-week items with findingRef / why | Generic tasks | Finding-linked, ordered |
| E | **Integrity** — no invented metrics; limitations labeled | Fabricated data | Honest gaps |
| F | **Deliverable** — PDF matches web exec layout | Missing / broken | Print view complete |

## Process

1. Complete intake for each vertical (use distinct business names and markets).  
2. Regenerate reports with **≥1 SERP provider** (`SEARCHAPI_KEY`, `DATAFORSEO_*`, and/or `SERPAPI_KEY`) plus `OPENAI_API_KEY` configured. Run `pnpm verify:research` before the panel.  
3. Review web report + `/reports/{id}/print`.  
4. Check `levelstack_research_jobs.metadata.quality_warnings` — aim for zero on ship candidates.  
5. Record scores in the table below; ship when median ≥ 4 per row.

## Score sheet (fill per report)

| Report | Industry | A | B | C | D | E | F | Notes |
|--------|----------|---|---|---|---|---|---|-------|
| 1 | | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |
| 4 | | | | | | | | |
| 5 | | | | | | | | |

## CLI helper

```bash
node scripts/launch-qa-rubric.mjs
```

Prints the rubric and median calculation reminder.
