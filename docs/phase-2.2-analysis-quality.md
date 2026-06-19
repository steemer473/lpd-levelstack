# Phase 2.2 — Analysis quality ($497 bar)

**Goal:** Reports justify **standalone** value at $497 (brief §3.3, §12.2, §10.3.2–10.3.5) — not just UI parity with the sample HTML.

**Prerequisite:** Phase 2.1 keys working (≥1 SERP provider + `OPENAI_API_KEY`). Phase 3 UI shipped.

**Do not scale paid acquisition** until this phase + PDF/email (Phase 3.1) pass the launch checklist at the bottom.

---

## What “worth $497” means (buyer outcome)

After reading the report, the owner should be able to say:

1. **“I didn’t know that.”** — At least one finding they would not have predicted (brief §6.1: ≥80% target).
2. **“That’s about my business.”** — Names, URLs, positions, or platforms from *their* research — not industry boilerplate.
3. **“I know what to do Monday.”** — ≤4 this-week actions, ordered (pause / fix / grow), each tied to a finding they just read.
4. **“This respects what I told you.”** — Perceived vs actual when intake self-rating diverges from SERP/reputation signals.
5. **“I can trust the gaps.”** — Missing data is labeled; invented review counts or Lighthouse scores never appear.

The sample report (`assets/levelstack-sample-report.html`) is the **tone and depth** reference; live reports must match that *interpretation* standard, not every fictional metric.

---

## Definition of Done — Standard tier ($497)

Score each generated report (internal QA). **Ship when median ≥4/5** across 5 diverse intakes.

| # | Criterion | Pass when |
|---|-----------|-----------|
| A | **Surprise** | ≥1 finding cites a specific URL, position, or platform the owner likely did not check |
| B | **Executive summary** | §10.3.2: prospects paragraph, single critical issue, perceived vs actual (if applicable), first steps pointer, diagnostic scope note |
| C | **Stakes** | If `hasActiveAdSpend === yes`, funnel section explicitly addresses ad → landing / trust (no ranking guarantees) |
| D | **Action plan** | `actionPlan.thisWeek` has ≤4 items; each `sub` references *why* (finding label or URL); no duplicate generic “claim GBP” unless reputation/presence findings support it |
| E | **Integrity** | No invented metrics; limitations in section copy when source failed; `as of [report date]` on time-sensitive claims |
| F | **Deliverable** | PDF matches web (Phase 3.1); owner can download without support |

---

## Current gaps (code-aware)

| Area | Today | Why it undersells $497 |
|------|--------|-------------------------|
| **Synthesis prompt** | Single `gpt-4o-mini` pass (`lib/pipeline/synthesis.ts`) | No rubric for perceived vs actual, funnel stakes, or anti-boilerplate QA |
| **Action plan** | `buildActionPlan()` in `build-sections.ts` — **template tasks**, not LLM | Tasks often generic; not 1:1 with synthesized findings |
| **Action plan section** | `appendActionPlanSection()` stub when LLM omits section | Tab shows placeholder finding, not real plan depth |
| **Research** | Multi-provider SERP chain + website fetch (ADR 003) | PageSpeed, GBP, competitor snapshots shipped in Sprint 2 |
| **Competitive grid** | Domains + positions from SERP chain | Sample uses named competitors, review counts, activity |
| **Readiness score** | Average of section scores | Brief wants explainable composite + optional funnel readiness % |
| **PDF / email** | Not built | $497 SKU promises PDF (brief §0.4, §10.3.7) |

---

## Implementation phases (recommended order)

### Sprint 1 — Interpretation layer (highest ROI, no new APIs) ✅ Shipped

**Outcome:** Same research bundle, materially better narrative and action plan.

| Task | Status | Files |
|------|--------|-------|
| 2.2.1 Harden system prompt | ✅ | `lib/pipeline/synthesis-prompts.ts`, `synthesis.ts` |
| 2.2.2 LLM action plan + findingRef | ✅ | `report-types.ts`, `action-plan.ts`, `assembleReportJson()` |
| 2.2.3 Quality gate → job metadata | ✅ | `lib/pipeline/quality-gate.ts`, `run-report-pipeline.ts` (`quality_warnings`, `research_mode: "2.2"`) |
| 2.2.4 Serp fallback narrative | ✅ | `serp-backed-sections.ts` |
| 2.2.5 Finding-linked UI | ✅ | `levelstack-report-view.tsx` |

**Verify:** Rebuild report; check `levelstack_research_jobs.metadata` for `quality_warnings`, `synthesis_llm`, `research_mode: "2.2"`.

---

### Sprint 2 — Evidence that changes decisions ✅ Shipped

**Outcome:** Findings can cite numbers the sample uses (mobile score, review volume, GBP gaps).

| Task | Status | Files |
|------|--------|-------|
| 2.2.6 PageSpeed Insights | ✅ | `lib/research/pagespeed.ts` |
| 2.2.7 GBP via SERP Maps chain | ✅ | `lib/research/gbp.ts` → `lib/research/serp/router.ts` |
| 2.2.8 Reputation enrichment | ✅ | `research-queries.ts`, `reputation-parse.ts` |
| 2.2.9 Competitor snapshots + grid rows | ✅ | `lib/research/competitor.ts`, `serp-backed-sections.ts` |
| 2.2.10 Social recency | ✅ | `lib/research/social.ts` |

**Env:** optional `GOOGLE_PAGESPEED_API_KEY` in `.env.local`. **Job metadata:** `research_mode: "2.3"`.

**Verify:** Rebuild report; digital tab shows PageSpeed + GBP score rows; competitive table includes review/title/mobile rows.

---

### Sprint 3 — Product completeness (Phase 3.1)

**Outcome:** Shippable Standard tier per brief §21 Phase 3 remainder.

| Task | Work |
|------|------|
| 3.1.1 | **PDF export** — server route or `@react-pdf`/Playwright; same hierarchy as web (exec → dashboard → six sections → action table) |
| 3.1.2 | **Report-ready email** — Resend; link to report + PDF attachment or download CTA |
| 3.1.3 | **`$694` tier flag** — show review-call booking CTA when `plan_id === levelstack-review-call` |
| 3.1.4 | **Explainable readiness score** — document formula in report footer or dashboard tooltip; optional `funnelReadinessPercent` from intake + PSI + CTA signals |

---

### Sprint 4 — Launch QA & GTM gate

| Task | Work |
|------|------|
| 4.1 | **5-report panel** — industries: RE, coach, contractor, consultant, healthcare-ish; score A–F per DoD table |
| 4.2 | **Cost model** — Serp count + LLM tokens per report; confirm margin at $497 |
| 4.3 | **Brief §19.3 checklist** — zero manual intervention e2e; hub promo policy (§0.7) resolved before ads |

---

## Two-pass synthesis (optional 2.2.1b)

If single-pass quality is inconsistent:

1. **Pass 1 — Evidence:** Sections + findings only (strict JSON, no action plan).
2. **Pass 2 — Interpretation:** Input = findings JSON + intake; output = `executiveSummary` + `actionPlan` only.

Keeps token cost predictable and mirrors brief §10.3.5 (“synthesis after all research completes”).

---

## What to do right now (you)

1. **Rebuild** your dev report after each sprint: **Rebuild report (dev)** or `POST .../run?regenerate=1`.
2. **Score one report** against the DoD table (A–F) in a notes doc — marks what Sprint 1 must fix first.
3. **Pick Sprint 1 start:** interpretation (2.2.1–2.2.5) before new APIs — fastest path to “worth it” copy.

---

## Related docs

- Brief: §10.2–10.3.5, §12.2, §12.4, §21 — `docs/project-brief.md`
- Phase 2.1 research — `docs/phase-2-1-research.md`
- Phase 3 UI — `docs/phase-3-report-ui.md`
- ADR research stack — `docs/adr/003-research-apis.md`
