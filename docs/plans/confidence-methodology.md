# LevelStack confidence methodology (P2-3)

Internal decision for Recommendation Object `confidence` before any band or percentage ships to customers.
Companion: `evidence-provenance.md` (P2-2). Scoring rules remain in `scoring-methodology.md` (P1).
PRD: `levelstack-vnext-prd.md` §4 P2-3, §5 `confidence`, OD-14 urgency guardrail.

**Status:** Locked 2026-07-19 (docs only). Consumed by P2-1 schema work.

## V1 decision

**Rule-based certainty bands** derived from check availability (P1-2) and evidence freshness/completeness (P2-2).

| Approach | V1 |
|----------|-----|
| Rule-based bands from `CheckAvailability` + evidence | **Primary — ship this** |
| LLM self-reported confidence % | **Not used** as the customer-facing value |
| Historical / outcome base rates | **Deferred** until V2 outcome loop exists |

Rationale: no outcome data yet to validate a percentage or base rate (critique §4 / §10 cold-start). LLM self-scores invite false precision. Rule-based Low / Medium / High is explainable and testable against existing pipeline classifiers.

## Customer-facing shape

| Field | V1 value |
|-------|----------|
| `band` | `Low` \| `Medium` \| `High` |
| `rationale` | Short qualitative reason (what evidence / availability drove the band) |
| `methodologyRef` | Stable pointer: `docs/plans/confidence-methodology.md` (or product footnote linking the same rules) |

**No confidence percentage in product UI** until a later, dated revision of this methodology unlocks calibrated numerics. If an internal numeric is ever used for sorting only, it must not render to customers.

Acceptance (P2-3): no % without a footnote/link to this methodology — and V1 ships bands, not %.

## Inputs

1. Supporting checks’ `CheckAvailability` — `ok` \| `negative` \| `unavailable` \| `not_checked` (`lib/pipeline/check-availability.ts`).
2. Cited `evidence[]` items’ `freshnessClass` and `sourceType` (`evidence-provenance.md`).
3. Section status — `insufficient_data` sections do not emit High-confidence recommendations.

`ok` and `negative` are both **checked** outcomes (healthy signal vs genuine gap). They may support High. `unavailable` and `not_checked` are **blocked** and never count as positive proof of a claim.

## Band rules

### High

All of:

- ≥1 direct non-`derived` citation in `evidence[]`
- Every supporting check is `ok` or `negative` (no `unavailable` / `not_checked` in the support set)
- Every cited evidence item is `fresh`

### Medium

Any of:

- Mixed but real citations (thin set, or some `aging` evidence)
- Cap: **at most Medium** if any supporting check is `unavailable`
- Otherwise meets “claimable from live research” but fails a High criterion

### Low

Any of:

- Support is mostly `derived`
- Cited evidence includes `stale` (or majority support blocked via `not_checked` / `unavailable`)
- Only band allowed when urgency / consequence copy must stay modest (OD-14 — see below)

### Section gate

If the parent section is `insufficient_data` (`score: null`), do **not** emit High. Prefer omitting the recommendation or capping at Low / Medium with an explicit “unable to verify” style rationale.

## OD-14 intensity guardrail

`urgency` and `consequenceOfInaction` intensity must scale with `band` (and evidence strength):

| `band` | Urgency / consequence tone |
|--------|----------------------------|
| `High` | May use stronger why-now / inaction language grounded in the cited evidence |
| `Medium` | Moderate; no alarm framing beyond what citations support |
| `Low` | Modest, honest note only — **never** language equivalent in severity to a High recommendation |

Testable: no recommendation with `band: Low` may render urgency/consequence copy that matches High severity.

## Deferred (V2+)

- Outcome-calibrated percentages
- Historical base rates by recommendation type
- LLM self-score as primary confidence signal
- Cross-report confidence learning from Automator Pro execution outcomes

## Why this closes critique §4 / P2-3

Critique required an explicit methodology before exposing confidence, and warned that fake-precise “94%” erodes trust. V1 locks rule-based bands with qualitative rationale and a methodology reference; numeric precision waits for outcome data.

## Implementation note

P2-1 adds Zod for `confidence: { band, rationale, methodologyRef }`. Band assignment ships with P2-4 section rebuild. No confidence UI or % ships in this P2-3 lock.
