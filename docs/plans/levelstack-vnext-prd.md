# LevelStack vNext — PRD

**Status:** Draft for review
**Date:** 2026-07-18
**Inputs:**

- `docs/plans/levelstack-vnext-critique.md` (strategic critique, live funnel/report audit §14, fix backlog §15)
- `docs/plans/levelstack-codebase-audit.md` (codebase ground truth — scoring logic, free/paid config, external calls, taxonomy)
- `lpd-planning` tracking files (`PRODUCT_ROADMAP.md`, `CURRENT_SPRINT_GOALS.md`, `STRATEGY.md`, `FUNNELS_AND_MARKETING.md`, `REPORT_VALUE_DELIVERY.md`, `COPY_BANK.md`) — cross-referenced in §10 and folded into §7's Open Decisions where they conflict with or duplicate critique/audit findings
- `level-play-brand-os` (company doctrine, one level above `lpd-planning` per its own `BRAND_SOURCE.md` hierarchy) — specifically `product/AI_PRINCIPLES.md`, `ai/AI_CONSTITUTION.md`, `product/PRODUCT_ARCHITECTURE.md`, `product/PRODUCT_HIERARCHY.md`, `product/PRODUCT_DECISION_FRAMEWORK.md`, `brand/LANGUAGE_RULES.md`, `company/OPERATING_MODEL.md` — checked after drafting, cross-referenced in §10 and folded into §7 as OD-14

**How to read this doc:** Requirements (§4) are scoped to critique §15's P0/P1/P2 items only. P3 and all V2/V3 modules are listed in the Appendix as explicitly out of scope for this PRD. Section 7 ("Open Decisions") contains every point where the critique's recommended architecture, the audit's findings about current code, and `lpd-planning`'s existing tracking/locked decisions do not agree, or where the audit could not confirm something a requirement depends on. **Three of fourteen (OD-9, OD-12, OD-13) are resolved** — marked RESOLVED in §7, with the resolution reflected in the affected requirements. **The remaining eleven (OD-1 through OD-8, OD-10, OD-11, OD-14) are still open** and are gating questions for you to close before engineering starts on the affected requirement(s). §10 maps this PRD against `lpd-planning`'s existing tickets and locked decisions, and against `level-play-brand-os` doctrine, directly.

---



## 1. Context & Why Now

LevelStack's current product is a digital-presence audit tool competing in a market where "AI-driven insights" are now table stakes, not differentiation — Birdeye and Vendasta are both shipping agent-style automation and framing themselves as decision-executors, not report generators, in 2026 (critique §1, §2). At the same time, "Decision Intelligence" has become a defined, actively-marketed enterprise software category (Gartner's inaugural Magic Quadrant, February 2026, naming SAS, Pega, FICO, IBM, Palantir, and Quantexa as leaders of a $50B+ market sold at five- and six-figure ACVs). LevelStack cannot compete there and should not be benchmarked against it — the risk is narrow but real: using "Decision Intelligence" as an external category label invites exactly that comparison (critique §1). The genuine differentiation available to LevelStack is structural, not verbal: a portable Recommendation Object (evidence, confidence, dependencies, ROI, automatability, owner as first-class fields), the comparison of declared intent against observed public signal ("Intent Intelligence"), and a closed loop with Automator Pro that pure-audit competitors can't replicate and execution-only competitors can't diagnose (critique §2, §8).

That strategic opportunity is currently undermined by what a live audit of the funnel and a real generated report found on July 18, 2026 (critique §14). The `/free` page's headline hook — AI search presence across ChatGPT, Perplexity, and Google AI Overviews, plus a "Social & off-site" section — does not exist anywhere in the shipped report; the report contains zero mentions of any of it. Separately, the free/paid boundary is inverted from what's marketed: Reputation and Digital Presence are sold as paid-only but ship free with full computed scores, which both weakens the $97 tier and makes the free tier more expensive to run than intended. And the report itself has active data-integrity problems reaching customers today — raw backend error strings ("Internal SE Server Error") rendering directly in Reputation findings, a score computed confidently over half-failed checks, and an Overall score (57) that doesn't reconcile with the visible section scores (87, 62, 62 → arithmetic mean ≈70) by any explained method. These are not future risks; they are live trust and compliance liabilities sitting on the highest-traffic page in the funnel (critique §14.3).

This PRD exists to sequence the fix to that gap — not to scope the full nine-module "Decision Intelligence" vision the original brief proposed, which the critique explicitly characterizes as a two-to-three-year architecture being requested as a single release (critique §1, §7). V1 here is deliberately narrow: stop the funnel from lying, fix the scoring model so it's explainable, and lock the reusable Recommendation Object schema that every future module — Brand, Messaging, Intent, Competitive, Outcome loop — will write into. Everything else is sequenced as an appendix, not a requirement.

---



## 2. Goals / Non-Goals



### Goals (source: critique §11, revised product vision)

- Turn LevelStack's public-digital-footprint audit into a ranked, evidence-backed **decision roadmap** — not a score, not a report.
- Every recommendation in that roadmap states: why, why now, what it's worth, what it depends on, and whether it can be automated.
- Lay the foundation (schema + provenance standard + confidence methodology) for recommendations to get more accurate over time as outcome data accumulates — without requiring that outcome loop to exist in V1.
- Close the specific, live gaps between what `/free` and `/platform/levelstack` promise and what the generated report actually contains (critique §14).
- Fix the scoring model so the Overall score is explainable in terms of the visible section scores, by one documented method.



### Non-Goals — explicitly deferred or removed (source: critique §5)

- **Automation Intelligence as a standalone nav module.** Automatability is a field on the Recommendation Object (see §5), not a separate destination.
- **Multi-source Authenticity Analysis** (interviews, podcasts, newsletters) for V1 — high collection cost, unclear ingestion pipeline, least differentiated part of Brand Intelligence.
- **Audience Intelligence as a distinct top-level module** for V1 — depends on Messaging Intelligence output, which itself is V2.
- **The full nine-module top nav** as originally briefed — collapsed to four pillars per critique §9, and even that collapse is flagged as an Open Decision below (§7) given how little V1 content exists to fill two of the four pillars.
- **Intent Intelligence as a V1 launch pillar** — cautiously promising as a category (critique §4) but dependent on clean, disclosed intent-intake methodology that doesn't exist yet; scoped to a V2 pilot with a small, willing customer set.
- **The full outcome/feedback loop** (tracking whether an executed recommendation actually worked) — the single most valuable data asset on the roadmap (critique §6) but explicitly sequenced to V2, per critique §12 ("Outcome loop v1" is step 4 of the directional roadmap, after schema and rebuild).

---



## 3. Scope

**In scope for this PRD:** the V1 module list from critique §7 — Executive Summary, Search Intelligence (including AI-answer visibility), Trust Intelligence (reviews/GBP), Brand Intelligence (website + LinkedIn only, "light"), and the Decision Roadmap (Recommendation Object engine, described in critique §7 as "the real v1 deliverable... not a module, it's the core") — narrowed further to exactly the P0/P1/P2 backlog items in critique §15. Every requirement in §4 below maps to one of those items.

Critique §15's P3 items and all V2/V3 modules from critique §7 are **out of scope** for this PRD and are listed in the Appendix for visibility only. They are not folded into any requirement below, and no requirement in §4 should be read as implicitly committing to them.

**Note on "Brand Intelligence (light)":** it appears in critique §7's V1 module list, but no corresponding item exists in critique §15's P0/P1/P2 backlog, and the audit found no existing code path for website/LinkedIn brand scoring. Per this PRD's instruction to scope strictly to §15's P0–P2 items, **Brand Intelligence is not included as a requirement in §4** despite being named in §7's V1 list — it is listed in the Appendix as a V1-adjacent item pulled in from §7 but not yet backlogged with acceptance criteria. This is a gap in the source material, not a decision made here — flagged again in §7 (Open Decisions).

---



## 4. Requirements

Each entry corresponds to one item in critique §15. IDs are assigned here for cross-referencing; they do not exist in the source documents.

### P0 — This week (live trust/compliance risks)



#### P0-1 — `[BUG]` Eliminate raw backend error strings in customer-facing findings

**Description:** Backend/provider error text currently reaches the rendered report verbatim in at least the Reputation section. Replace this with a broadened, allowlist-based classifier (default to hiding anything not explicitly recognized as safe) applied uniformly everywhere a `limitation` string is consumed, plus a catch-and-retry-once pattern before falling back to a labeled "unable to verify" state.

**Acceptance criteria:**

- No SerpAPI/SearchAPI/DataForSEO raw error string (e.g., "Internal SE Server Error") can render in any customer-facing finding, in any section, on any tier.
- The existing `isInternalLimitation` allowlist pattern is extended to cover error text beyond the current `serpapi`/`searchapi`/`dataforseo` token match, and every `limitation`-consumption site — not only the GBP-specific helpers — routes through it.
- A single retry is attempted on non-quota errors (timeout, 500, malformed JSON) before the finding falls back to "unable to verify," rather than the current single-attempt-only behavior.
- "Not fetched yet" (tier-skipped) and "checked, found nothing" no longer collapse into the same customer-visible copy or severity (this criterion overlaps with P1-2 and should be implemented together — see dependency below).

**Audit references:**

- `serpApiOrganicSearch`, `lib/research/serp/providers/serpapi.ts:71-79` — raw `data.error` passthrough into `limitation`.
- `shouldFailoverOrganic` / `isProviderQuotaError`, `lib/research/serp/quota-errors.ts:1-28` — failover only triggers on quota-pattern errors.
- `router.ts:106-115` — router caches an erroring response as-is when failover doesn't trigger.
- `isInternalLimitation`, `lib/report/customer-copy.ts:3-19,65-69` — existing denylist-style sanitizer, doesn't match "Internal SE Server Error."
- `buildReputationFindings`, `lib/pipeline/serp-backed-sections.ts:683-690` — writes `search.limitation.slice(0,100)` directly with no sanitizer call; contrast with `customerGbpFindingValue`/`customerGbpFindingDetail` (same file, lines 78-107), which do filter.

**Dependency:** None (can ship independently). P1-2 depends on the classifier work done here.

---



#### P0-2 — `[FEATURE]` Minimal AI answer-engine visibility check in free tier

**Description:** Build a real check for business presence in ChatGPT / Perplexity / Google AI Overview responses and ship it in the free tier, replacing the current hardcoded disclaimer text. Cache/batch per business on a refresh cycle rather than calling live per report view.

**Acceptance criteria:**

- The literal stub string ("Live AI citation checks are not automated in v1...") no longer ships in any generated report.
- At least one live signal of AI-answer-engine presence is collected per free-tier report (Google's own `ai_overview` field is already available on 2 of 3 SERP providers and can be a starting input, but the stub explicitly names ChatGPT/Perplexity, which have no existing client in the codebase — a net-new integration is required for those two).
- AI-platform queries are cached with a defined TTL, reusing the existing hash-keyed cache pattern (query + engine → cached response) rather than calling live on every report view.
- Cost per report from this addition is measured and documented before this ships to 100% of free-tier traffic, given the free tier is already erroring under current load (see P0-1) and this adds a third live external dependency at $0 revenue.

**Audit references:**

- `docs/adr/003-research-apis.md:22` — ADR stating AI visibility "Not called" as a deliberate v1 decision, not an oversight.
- `providers/serpapi.ts:91-96` — `ai_overview` field parsed opportunistically; DataForSEO's mapper always returns `null` (works on 2 of 3 providers only).
- Stub text location: `lib/pipeline/serp-backed-sections.ts:482-493`.
- `lib/llm/` contains only an OpenAI JSON-synthesis client — no ChatGPT/Perplexity client exists anywhere in the codebase; this is confirmed net-new build, not a wiring fix.
- Caching pattern to extend: `levelstack_serp_cache` (Supabase), keyed `sha256(engine:normalized query)`, 24h default TTL — `lib/research/serp/cache.ts`, `serp/config.ts`. Audit explicitly notes this table is "the natural place to add AI-platform query caching," but also that OpenAI/PageSpeed calls today have **zero** caching, i.e., "add a new external check" defaults to no caching unless deliberately wired in.

**Dependency:** None on other requirements below, but P0-3 depends on this shipping first (or concurrently) — the restructured 2-section free tier folds AI-search-presence into one of the two sections.

---



#### P0-3 — `[PRODUCT]` Restructure free report to exactly two sections

**Description:** Cut the free report to the two sections marketing actually promises — Search Footprint and Social & Off-site (with AI-search-presence built into one of them, per P0-2) — and move Reputation and Digital Presence behind the $97 paywall to match what's already marketed as locked.

**Acceptance criteria:**

- Free-tier report output contains exactly two unlocked sections; Reputation and Digital Presence are no longer computed/displayed for free-tier users (or are shown only as a locked-state teaser, consistent with how Revenue Funnel/Competitive Context/Action Plan are currently teased — see Open Decision in §7 on exact locked-state treatment).
- A distinct "Social & Off-site" section exists in the report schema and UI. Today, social findings are folded into `digital_presence` with no independent section — this requires a schema/section change, not a relabeling.
- `lpd-redesign` marketing copy (`levelstackPlans.ts` pricing table, `/free` page copy) is updated to match the new entitlement exactly, closing the gap the audit found between marketed and actual free/paid boundaries.
- Free-tier external call volume/cost is re-measured after this change (removing Reputation's 4 SERP queries and Digital Presence's homepage/PageSpeed/GBP calls from the free path, while adding AI-platform queries from P0-2) and compared against the current ~12-14 calls/report baseline.

**Audit references:**

- `FREE_TIER_SECTION_IDS` / `PAID_ONLY_SECTION_IDS`, `lib/pipeline/constants.ts:41-51` — confirmed current free set is `search_footprint`, `online_reputation`, `digital_presence`; confirmed current paid-only set is `revenue_funnel`, `competitive_context`, `action_plan`.
- `assembleFreeReportFromResearch`, `lib/pipeline/assemble-free-report.ts:124` — filters to `FREE_TIER_SECTION_IDS`; this is the enforcement point that needs to change.
- Report UI lock state: `lib/report/display-helpers.ts:245-249`, `components/report/report-shared.tsx`.
- `lpd-redesign/data/levelstackPlans.ts:12-21` — current pricing table marks Reputation `free: false` (paid-only), directly contradicting today's shipped behavior; this file needs to move from "already correct, code needs to catch up" to "still correct after the code changes."
- `buildSocialFindings`, `lib/pipeline/serp-backed-sections.ts:710-734` — current implementation folds social into `digital_presence`; no distinct section exists to repoint marketing at.

**Planning cross-reference:** this is not a new problem the critique/audit surfaced — it's an existing, already-tracked issue. `CURRENT_SPRINT_GOALS.md` #13, `REPORT_VALUE_DELIVERY.md` "Free-tier scope drift (active)," and `STRATEGY.md`'s report-sections table all document the same 3-way mismatch (hub pricing table says 2 free sections, `copy-brief.md` says 2, app `FREE_TIER_SECTION_IDS` unlocks 3). Planning's canonical intent already names the second free section **"Social & off-site presence"** (`STRATEGY.md` report-sections table, section 02) — this requirement adopts that name rather than inventing a new one. This PRD's P0 priority for the fix is higher than planning's former P2 brand priority for the same ticket; `PRODUCT_ROADMAP.md` and `CURRENT_SPRINT_GOALS.md` #13 now both point back to this requirement as the merged, authoritative scope (updated 2026-07-18 — see §10).

**Dependency:** Depends on P0-2 (AI-search-presence must exist to be folded into a free section). Also touches the Open Decision in §7 on how "Social & Off-site" is structurally separated from "Digital Presence" given only one combined scoring path exists today (OD-4), and OD-11 on which paid tier ($97 vs. $297) gates the moved sections.

---



#### P0-4 — `[COPY]` Fix or remove the "Funnel readiness: 42%" sample preview on `/free`

**Description:** The sample-report preview on `/free` shows a "Funnel readiness: 42%" figure that doesn't match the Overall Score/Grade model actually shipped in production reports.

**Acceptance criteria:**

- The `/free` sample preview either reflects the real, current scoring model (see P1-1) or is removed until that model is fixed and stable.
- No sample/preview copy anywhere in the funnel references a metric name or score format that doesn't exist in the shipped report schema.

**Audit references:** None found. This item lives in `lpd-redesign` (marketing hub); the codebase audit's stated scope was the product app (`lpd-levelstack`) with the marketing hub referenced only for `levelstackPlans.ts` and `/free/page.tsx` copy content (§4, §6 of the audit) — it did not inventory every component on `/free`, including this specific preview widget. **This is a gap, not a resolved item** — see §7.

**Dependency:** Should ship after or alongside P1-1, since "fix the copy to match the real model" requires the real model to be decided first. If shipped before P1-1, the only safe acceptance criterion is removal, not correction.

---



### P1 — Next sprint (scoring integrity)



#### P1-1 — `[ARCH]` Publish a scoring methodology; fix the 87/62/62 → 57 reconciliation gap

**Description:** Document, even internally first, exactly how section scores are computed, how failed/errored checks are weighted, and how the Overall score derives from subscores — then fix the current setup so Overall is explainable in terms of the visible sections.

**Acceptance criteria:**

- A single documented methodology exists covering: how each visible section score (Search Footprint, Reputation, Digital Presence) is computed, and how Overall relates to them.
- Overall is either (a) mathematically derived from the displayed section scores via an explicit, documented penalty/weighting rule, or (b) sections that don't feed Overall are no longer displayed as if they do. **This PRD does not choose between these two options** — see Open Decision in §7; the audit's own "Implication for PRD" note poses this exact choice.
- The three currently independent scoring code paths (LLM free-form 0-100 for Search Footprint; 3-bucket cliff function for Reputation/Digital Presence; weighted signal average for Overall) are reconciled into the single documented model, or an explicit decision is recorded for why they remain separate.
- The duplicate legacy scoring path is addressed (see Open Decision in §7 — audit found two near-duplicate "score" functions plus two different letter-grade threshold sets across the legacy and current pipelines).

**Audit references:**

- Three-path breakdown: `synthesizeFreeSearchFootprint` (`lib/pipeline/search-footprint-synthesis.ts:269-316`, LLM free-form score, schema `report-types.ts:59`, prompt `synthesis-prompts.ts:41`); `scoreFromFindings` (`lib/pipeline/serp-backed-sections.ts:36-46`, 42/62/78 bucket function); `scoreAllSignals` (`lib/audit/score-all-signals.ts:318-326`, weighted signal average, consumed at `assemble-free-report.ts:164`).
- `statusToPercent` (`lib/audit/types.ts:43-47`: pass=100, warning=50, fail=0) and `SIGNAL_WEIGHTS` (`types.ts:30-41`).
- Free-tier signal pool filter: `score-all-signals.ts:306-309` (6 free-tagged signals only).
- Legacy duplicate: `lib/pipeline/build-sections.ts:13-23` (near-duplicate 42/62/78 bucket function), still wired into the paid full-report flow at `run-report-pipeline.ts:226-238` alongside the newer signals-based path.
- Letter-grade inconsistency: `letterGradeFromScore` (`lib/audit/types.ts:49-55`, A/B/C/D/F at 90/80/70/60) vs. inline thresholds in `assembleReportJson` (`build-sections.ts:220-227`, B/C/D/F at 80/70/55).

**Planning cross-reference:** `CURRENT_SPRINT_GOALS.md` #19, "Debug free vs paid grade mismatch," is already an open ticket for this exact issue, with its own file references (`lib/audit/score-all-signals.ts`, `lib/pipeline/run-report-pipeline.ts`) and its own framing ("reproduce on a single intake... decide expected behavior (continuity vs. expanded scope)... fix if bug"). That framing treats this as a bug-triage task; this requirement treats it as an architecture decision that blocks P2-1. `CURRENT_SPRINT_GOALS.md` #19 is now closed and points back to this requirement as the merged, authoritative scope (updated 2026-07-18) — do not resume it as a separate bug-triage ticket (see §10).

**Dependency:** None required to start, but blocks P2-1 (Recommendation Object schema) per critique §16.1's explicit note that the P1 scoring-methodology fix blocks the P2 schema work. Also should precede P1-3 (cosmetic grade/banner treatment) and P0-4 (copy fix), since both depend on knowing the real model.

---



#### P1-2 — `[ARCH]` Disallow scoring over failed/skipped checks; add an "insufficient data" state

**Description:** Introduce a first-class "unavailable / not checked" state, distinct from "checked, failed," and propagate it into both section-bucket scoring and the signal-weighted Overall. Disallow computing a numeric section score when a threshold proportion of its underlying checks have failed.

**Acceptance criteria:**

- The type system distinguishes at least three states per check: passed, checked-and-failed, and not-checked/errored — today only two effective states exist (the audit found no "insufficient data" state anywhere).
- A section whose checks exceed a defined failure/skip threshold renders "insufficient data" instead of a numeric score, rather than silently scoring the failure as a negative finding.
- Free-tier "not fetched yet" (tier-gated, never called) is visually and textually distinguishable from paid-tier "checked, not found" — today both produce the identical customer-facing message and severity.
- The specific case audited — Reputation scoring 62/100 with 2 of 4 checks having returned raw backend errors — cannot recur once this ships.

**Audit references:**

- No "insufficient data" state exists anywhere in the type system (confirmed).
- `buildReputationFindings` (`serp-backed-sections.ts:683-690`) — any `search.limitation` (quota error, backend error, or genuine "not found") produces the same `severity: "medium"` finding.
- `scoreDirectories` (`score-all-signals.ts:192-209`) — zero directory hits scores `fail` (0 points) regardless of whether zero hits is real or caused by an errored search.
- `emptyGbp.limitation = "Not fetched yet."` (`lib/pipeline/research-types.ts:110-118`) — the `!gbp.found` branch (`serp-backed-sections.ts:257-288`) always assigns `severity: "high"` whether the reason is "never checked" (free tier) or "checked, not found" (paid tier); both produce the same 62-point outcome.

**Dependency:** Depends on P0-1 (the broadened error classifier is the mechanism that distinguishes "this is an error" from "this is a genuine negative finding," which P1-2 needs to decide when to fall back to "insufficient data"). Overlaps with P1-1's scope (how failed checks are weighted is explicitly part of both items) — recommend designing and shipping these together rather than sequentially.

---



#### P1-3 — `[UX]` Re-evaluate the letter-grade + red-banner treatment

**Description:** Re-evaluate the current letter grade and alarm-colored critical banner against the stated positioning ("advisor, not SEO scare tool"), once scoring is trustworthy.

**Acceptance criteria:**

- A design decision is made and documented on whether/how letter grades and severity-colored banners are used post-fix, informed by the corrected scoring model from P1-1.
- The specific combination the audit observed — a red "F" grade paired with an alarm-colored critical banner driven partly by confirmed-failed checks (per P1-2) — cannot recur, since the underlying score it's rendering will no longer include failed-check penalties as if they were real findings.

**Audit references:** None directly (this is a UX/positioning judgment call on top of P1-1/P1-2's fixes); critique §14.3 documents the observed effect ("reads as manufactured anxiety rather than evidence-based diagnosis") and critique §1 names the philosophy this should align to.

**Dependency:** Depends on P1-1 (scoring methodology) and P1-2 (insufficient-data state). A presentation change without the underlying score fix is cosmetic only, per critique's own framing.

---



#### P1-4 — `[DATA]` Broaden business-category taxonomy

**Description:** Build a real category/vertical taxonomy so recommendations that depend on it (BBB listing relevance, GBP category norms) stay relevant for businesses outside literal local-service verticals.

**Acceptance criteria:**

- A defined taxonomy (fixed list or otherwise) exists and is used to classify businesses, replacing today's direct passthrough of Google's raw GBP category string and the "General business services" placeholder.
- The specific case audited — Level Play Digital (a systems/AI consultancy) classified as "General business services" — is correctly categorized under the new taxonomy.
- Category-dependent recommendation logic (BBB, GBP category norms, etc.) checks the new taxonomy field rather than assuming a literal local-service business.

**Audit references:**

- No internal taxonomy exists anywhere in the codebase (confirmed) — zero fixed lists, zero LLM-derived classification, zero migration table encoding category/industry.
- Current passthrough: `yourCategory = bundle.digitalPresence.gbp.category ?? "—"` (`serp-backed-sections.ts:357`), sourced from `category: place.type ?? null` (`providers/serpapi.ts:179`, mirrored in `searchapi.ts`/`dataforseo.ts`).
- Placeholder (not a classification): `primaryService: "General business services"` (`lib/intake/free-snapshot-schema.ts:62`), flagged as a sentinel to clear on upgrade (`lib/intake/upgrade-prefill.ts`, `PLACEHOLDER_SENTINELS`).
- Intake schema: `primaryService` is `z.string()` free text (`lib/intake/schema.ts:50`), not an enum, unlike other intake fields (`geoMarketOptions`, `ninetyDayGoalOptions`) which are enums.

**Dependency:** None required to start. Informs (but does not block) P2-4's recommendation quality/relevance once the schema rebuild happens.

---



### P2 — Foundation (before new modules)



#### P2-1 — `[ARCH]` Define and ship the Recommendation Object schema

**Description:** Design and ship the reusable core data model — evidence, confidence, dependencies, ROI, automatability, owner — that every future module writes into. This is the "real v1 deliverable" per critique §7.

**Acceptance criteria:**

- A schema exists (Zod types minimum, plus persistence — see Open Decision in §7 on relational vs. JSONB) with fields for: structured evidence (not just prose), confidence (value + methodology reference), priority, ROI, a dependency graph (not a loose string match), a typed owner, and an automatability flag.
- Per OD-13's resolution, the schema also includes a structured **artifact/deliverable-content field** (e.g., email template, copy rewrite, reply draft, checklist) — the scope `CURRENT_SPRINT_GOALS.md` #12 ("Report Value Slice 3") was building against the old `actionItemSchema`. This is a new field added to the list above by that resolution, not present in the original critique §8/§13 field set — see §5's Data Model table.
- The schema is reviewed by engineering and design before any individual module (Search, Trust, Brand) is scoped against it, per critique §13's explicit recommendation.
- The schema supersedes, or has a documented migration path from, the current `findingSchema`/`actionItemSchema` pair.

**Audit references:**

- `findingSchema` (`lib/pipeline/report-types.ts:5-15`): `label`, `value`, `detail`, `severity`, optional `headline`/`bullets`/`riskCategory`/`snippetBefore`/`snippetAfter`. No dedicated `evidence` field, no `confidence`.
- `actionItemSchema` (`report-types.ts:66-79`): `task`, `sub`, `who` (free-text, informal owner), `time` (free-text effort estimate), `findingRef` (loose label-text link — closest existing thing to a dependency), `automatorFlag`/`automatorProduct` computed by keyword regex (`automatorMatch()`, `lib/pipeline/assemble-from-signals.ts:18-31`) — flags whether LPD's own add-on products apply, not general automatability.
- Explicitly absent per audit: structured `evidence`, `confidence`, typed `priority` (only proxied by `severity` + a non-persisted local sort `weight` in `buildActionPlanFromSections`, `lib/pipeline/action-plan.ts:25-33`), `roi`, dependency graph, typed `owner`.
- `AuditSignalResult` (`lib/audit/types.ts:3-10`) has an `evidence: string[]` field and a `tier` field but is pipeline-internal scoring data, not the customer-facing object this requirement targets.
- Audit's explicit conclusion: "a real recommendation schema... doesn't exist and needs to be designed from scratch — there's no partial implementation to extend beyond the loose `findingRef` string-matching link and the two-value automator flag."

**Planning cross-reference:** `PRODUCT_ROADMAP.md`'s "Architecture review additions (2026-06-26)" and `STRATEGY.md`'s "Intelligence core architecture" both contain a locked instruction: "Do not rebuild LevelStack from scratch... Additive improvements only." Neither document anticipated a net-new schema of this scope. This requirement should be read as testing that constraint, not automatically exempt from it — see OD-10.

**Dependency:** Depends on P1-1 (scoring methodology fix — explicit blocking dependency per critique §16.1), P2-2 (evidence provenance standard), and P2-3 (confidence methodology). Blocks P2-4 and P2-5.

---



#### P2-2 — `[ARCH]` Define an evidence provenance and freshness standard

**Description:** Define source, timestamp, and staleness rules for every claim before the Evidence field in the Recommendation Object schema can be trusted.

**Acceptance criteria:**

- A documented standard exists specifying, at minimum: source identification, capture timestamp, and a staleness/expiry rule per evidence type (e.g., a GBP check from 90 days ago is not current evidence).
- The standard is referenced by, and precedes, the `evidence` field definition in P2-1's schema.

**Audit references:** None — this is confirmed net-new; no timestamp/provenance field exists on `findingSchema` or `actionItemSchema` today.

**Planning cross-reference:** `REPORT_VALUE_DELIVERY.md` backlogs "Optional evidence snapshot table for re-synthesis/support audits" at **P3** (lowest priority, deferred), and `PRODUCT_ROADMAP.md`'s architecture-review notes say explicitly to "defer full evidence store; SERP cache + report JSON sufficient for v1" and "do not rebuild the pipeline around a new store prematurely." This requirement treats evidence provenance as **P2, foundational, and blocking** P2-1. That is a direct priority conflict with planning's existing P3/deferred stance, not just a sequencing detail — see OD-10.

**Dependency:** Blocks P2-1. No dependencies of its own.

---



#### P2-3 — `[ARCH]` Decide the confidence-scoring methodology explicitly

**Description:** Decide explicitly whether confidence is rule-based certainty, LLM self-report, historical base rate, or some combination — and document it before exposing any confidence percentage to users.

**Acceptance criteria:**

- A documented decision exists on the confidence methodology, with rationale for what's crediblee to ship in V1 (given no outcome data exists yet to validate historical-base-rate confidence) versus what has to wait.
- No confidence percentage renders in the product without a footnote/link to this methodology.
- Per critique §4's caution on "false precision," if the methodology can't yet support numeric precision (e.g., LLM-judgment-based scoring on unstructured text), confidence should ship as a band (Low/Medium/High) with qualitative rationale rather than a fake-precise percentage.

**Audit references:** None — no confidence field exists anywhere in the current schema (confirmed net-new).

**Dependency:** Blocks P2-1. No dependencies of its own.

---



#### P2-4 — `[PRODUCT]` Rebuild current audit output onto the new Recommendation Object schema

**Description:** Rebuild the current Search Footprint and Trust/Reputation output onto the new schema from P2-1 — this is the shippable, differentiated core once the schema exists.

**Acceptance criteria:**

- Search Footprint and Reputation sections generate Recommendation Objects (per P2-1's schema) rather than the current `Finding`/`ActionItem` pair.
- Output for these two sections reflects the fixes from P0-1, P1-1, and P1-2 (no raw errors, reconciled scoring, insufficient-data states) — this is not a like-for-like port of today's buggy output onto a new schema.
- Digital Presence and the other current sections are explicitly out of scope for this rebuild (only Search + Trust/Reputation, per critique §7's V1 list and §12's roadmap step 1).
- Per OD-13's resolution, this rebuild absorbs Report Value Slice 3's scope rather than that work shipping separately against the old schema: Reputation findings are deduplicated (e.g., Clutch/G2/Capterra clustered into one finding, not three), Reputation and Search Footprint Recommendation Objects populate the new artifact field from P2-1 (email template, copy rewrite, reply draft, or checklist, as applicable per finding type), and findings carry SERP evidence links via P2-2's provenance standard rather than as a separate feature.

**Audit references:** Same section-builder code as P1-1/P1-2 (`serp-backed-sections.ts`, `search-footprint-synthesis.ts`) — this requirement is the schema migration of that code, not new data collection. Slice 3's reputation-dedup target (Clutch/G2/Capterra clustering) is not separately audited in the codebase audit; it's carried over from `REPORT_VALUE_DELIVERY.md`'s own description of the gap.

**Dependency:** Depends on P2-1 (schema must exist, including its OD-13 artifact field), P2-2 (evidence provenance standard, for the absorbed SERP-evidence-links scope), P1-2 (insufficient-data state), P0-1 (clean error surfacing), and P1-1 (fixed scoring model). Blocks P2-5.

---



#### P2-5 — `[PRODUCT]` Ship the Decision Roadmap as the primary UI surface, positioned as the paid-tier differentiator

**Description:** Ship the Decision Roadmap — the ranked Recommendation Object list — as the primary product surface, replacing the current findings/action-plan report, and position it as the concrete added value of the $97 tier (per critique §14.4, shifting paid value toward prioritization/sequencing rather than raw finding count).

**Acceptance criteria:**

- A dashboard-style Decision Roadmap UI exists, surfacing ranked Recommendation Objects from P2-4's rebuilt Search + Trust output.
- The Roadmap is gated to paid tier in a way that is consistent (no repeat of the audit's finding that `PAID_ONLY_SECTION_IDS` includes `action_plan` while free tier renders a capped version anyway) — see Open Decision in §7 on exact free-tier treatment.
- Per §6 (UX/Format), the Roadmap is web-dashboard-primary; PDF/CSV are secondary exports of the same underlying Recommendation Objects, not separate content.

**Audit references:**

- Current action plan behavior: `buildActionPlanFromSections` (`lib/pipeline/action-plan.ts:25-33`).
- Gating inconsistency: `PAID_ONLY_SECTION_IDS` includes `action_plan` (`constants.ts:47-51`), but free reports render a capped version (`thisWeek.slice(0,4)`, no `thisMonth`/`thisQuarter`) — the constant is used only for the `lockedSectionCount` upsell counter, not as an actual gate, so it "doesn't fully describe real behavior" per the audit.

**Planning cross-reference — naming, resolved (OD-9):** `STRATEGY.md` Decision #14 (locked) and `COPY_BANK.md` §7.0 establish **"Action Roadmap"** as the canonical customer-facing name for the $97 paid deliverable, enforced by a `lint:customer-copy` script in both repos. Per OD-9, this requirement ships as an upgrade to the existing Action Roadmap — no rename, no new customer-facing term. "Decision Roadmap" is used elsewhere in this PRD as internal/architectural shorthand only.

**Dependency:** Depends on P2-1 (schema) and P2-4 (rebuilt data to populate it). Blocked on OD-9 (naming) before any customer-facing copy ships.

---



#### P2-6 — `[NAMING]` Keep "LevelStack" as external name; audit copy for "Decision Intelligence" as a category label

**Description:** Keep LevelStack as the external product name (already distinct, no change needed). Audit marketing/investor copy for uses of "Decision Intelligence" as a standalone category label and either remove those uses or scope them explicitly to "SMB digital-presence decisions," to avoid collision with the Gartner-defined enterprise category.

**Acceptance criteria:**

- No external marketing, sales, or investor material uses "Decision Intelligence" unscoped as LevelStack's category label.
- Where the concept is referenced externally at all, it is explicitly and repeatedly scoped (e.g., "decision roadmap for your public presence") rather than left to stand alone.
- Internal architecture conversations may continue to use "Decision Intelligence" as a philosophy/architecture term — this restriction is external-facing only.

**Audit references:** None. The codebase audit's stated scope was the product app plus the specific marketing files it cites for the free/paid mismatch (`levelstackPlans.ts`, `/free/page.tsx`) — it did not search `lpd-redesign` copy, investor decks, or sales materials for the phrase "Decision Intelligence." **Whether this phrase currently appears anywhere in external materials is unconfirmed** — flagged in §7.

**Planning cross-reference:** a search of `lpd-planning` (`STRATEGY.md`, `COPY_BANK.md`, `PRODUCT_ROADMAP.md`, `FUNNELS_AND_MARKETING.md`) found zero uses of "Decision Intelligence." This confirms the phrase isn't in LPD's own strategy/copy source of truth, but `lpd-planning` doesn't cover `lpd-redesign`'s full marketing copy, investor decks, or sales materials either — OD-7's gap stands. Separately, this requirement's own new terminology (Recommendation Object, Decision Roadmap, confidence bands) will need new entries in `COPY_BANK.md` and the `lint:customer-copy` / `lint-customer-copy.mjs` rule set before any of it ships customer-facing — not currently an acceptance criterion here, added as OD-9's resolution dependency.

**Dependency:** None (independent copy/positioning workstream, no code dependency).

---



#### P2-7 — `[IA]` Collapse navigation to four pillars

**Description:** Collapse the originally-briefed nine-module navigation into four pillars — Visibility, Brand & Message, Trust, Revenue Readiness — feeding the Decision Roadmap, per critique §9.

**Acceptance criteria:**

- Product navigation reflects four pillars rather than a flat or nine-module structure, with granular "intelligence" concepts as sub-scores feeding each pillar and the Roadmap rather than separate destinations.
- **This PRD does not mandate when this ships** — see Open Decision in §7 on whether four-pillar nav should ship in V1 at all, given that V1's actual module scope (Search + Trust + light Brand + Roadmap) leaves two of the four pillars (Brand & Message, Revenue Readiness) with little or no V1 content to organize.

**Audit references:** None directly — the audit confirms the *current shipped* product has no nine-module nav to collapse in the first place; today's IA is six flat report sections (`search_footprint`, `online_reputation`, `digital_presence`, `revenue_funnel`, `competitive_context`, `action_plan`), not modules. The "nine modules" framing exists only in the original strategic brief the critique responded to, not in shipped code.

**Dependency:** Depends on P2-5 (Decision Roadmap) being scoped, since the pillars are described as organizing content that feeds the Roadmap. Timing is an Open Decision (§7).

---



## 5. Data Model — Recommendation Object

Per critique §8/§13, the object requires: evidence, confidence, dependencies, ROI, automatability, owner. Reconciled against the audit's findings on what partially exists today (audit §5). **This field list has not been checked against `level-play-brand-os`'s locked "standard recommendation anatomy" (`product/AI_PRINCIPLES.md`) — see OD-14 in §7 before treating this table as final.**


| Field            | Status per audit                                                                                                                                                                                                                                                      | Proposed for V1                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evidence`       | **Absent.** `findingSchema` has `value`/`detail` as informal prose; no structured evidence, no source/timestamp.                                                                                                                                                      | Structured object: source identifier, raw signal reference, capture timestamp, staleness rule (per P2-2's provenance standard — not yet defined).                                                                                            |
| `confidence`     | **Absent.** No field anywhere in `findingSchema`/`actionItemSchema`. Unrelated `AuditSignalResult.evidence: string[]` exists but is pipeline-internal, not customer-facing.                                                                                           | Band (Low/Medium/High) + qualitative rationale for V1, per critique §4's caution against false-precision percentages until outcome data exists to validate a numeric score. Methodology reference required (per P2-3, not yet decided).      |
| `priority`       | **Informally proxied**, not a real field. `severity` (critical/high/medium/low/good) on findings, plus a local, non-persisted sort `weight` in `buildActionPlanFromSections` (`action-plan.ts:25-33`).                                                                | Typed priority field, informed by fixed scoring model (P1-1) and confidence (P2-3).                                                                                                                                                          |
| `dependencies`   | **No graph.** Closest analog is `findingRef`, a loose string match back to a finding by label text (`actionItemSchema`, `report-types.ts:66-79`).                                                                                                                     | Structured dependency references (object IDs, not label-text matching), enabling the roadmap UI's filtering/sequencing per critique §16.4.                                                                                                   |
| `roi`            | **Absent.** No field, no calculation path.                                                                                                                                                                                                                            | To be designed as part of P2-1; no existing partial logic to reconcile against. Cold-start risk noted in critique §10 — launch with ranges, not point estimates, given no outcome data exists yet.                                           |
| `automatability` | **Partially exists, narrowly scoped.** `automatorFlag`/`automatorProduct` (`"seo"|"workflow"`), computed by keyword regex `automatorMatch()` (`assemble-from-signals.ts:18-31`) — flags whether *LPD's own* Automator Pro products apply, not general automatability. | Extend/generalize this existing flag rather than replace it outright — it's the one field with a working partial implementation. Needs to answer "can AI automate this" as a general question, not just "does an LPD add-on exist for this." |
| `owner`          | **Free-text only.** `who` field on `actionItemSchema` is free text like "You"/"Freelancer," not a typed identity.                                                                                                                                                     | Typed owner (role or identity reference), replacing free text.                                                                                                                                                                               |
| `artifact`       | **Absent — added by OD-13's resolution, not part of critique §8/§13's original field list.** No structured deliverable-content field exists on `findingSchema`/`actionItemSchema` today; this is the same gap `CURRENT_SPRINT_GOALS.md` #12 ("Report Value Slice 3") was closing separately before OD-13 folded it in.                                            | Typed deliverable content per recommendation, where applicable: email template, copy rewrite, reply draft, or checklist. Populated by P2-4 for Search Footprint + Reputation as part of the OD-13-absorbed Slice 3 scope.                    |


**Persistence:** everything today lives as opaque `report_json` JSONB (`supabase/migrations/20250603000000_levelstack_product_tables.sql:73`) — there are no relational finding/recommendation tables anywhere in the migrations. Whether the Recommendation Object should move to a relational schema is an **Open Decision** (§7) — it is not resolved by either source document, but it directly affects whether the dashboard interactions described in §6 (filtering, sorting, status-tracking) are feasible against the current storage model.

---



## 6. UX / Format

Per critique §16.4: the Decision Roadmap is **web-dashboard-primary**, not PDF- or spreadsheet-primary.

- The core thesis (living system: Automator Pro execution, outcome tracking, re-diagnosis over time) requires a dashboard; a static export can't reflect a decision being executed or re-prioritized.
- Recommendation Object fields (evidence, confidence, dependencies, ROI, owner — §5) are suited to filtering, sorting, and status-tracking interactions a flat document can't support. This depends on the persistence Open Decision in §5/§7.
- The outcome loop (deferred to V2, §2) requires instrumenting what happens after a recommendation is acted on — not possible from a downloaded file, which is part of why the dashboard has to be primary even though the outcome loop itself isn't built in V1.

**Export formats are secondary, not primary:**

- **PDF export** — redesigned with real color-coded priority (not just text labels) and one decision per visual block, for sharing with a stakeholder who won't log into a dashboard, or for printing.
- **CSV/spreadsheet export** of Recommendation Objects — for teams who want to load decisions into Asana/Notion/Excel rather than adopt the dashboard; also demonstrates schema portability (part of the defensibility argument in critique §8).

**Free-tier restructuring as a specific, testable requirement** (this is P0-3 above, restated here as the UX-facing spec): free tier ships exactly 2 sections — Search Footprint and Social & Off-site (AI-search-presence built into one of them) — with Reputation and Digital Presence moved to paid. This is testable directly against the live funnel audit's finding (critique §14.1/14.2): after this ships, `/free`'s promised sections and the actual free-tier report's sections must match exactly, and the $97 paywall must gate Reputation and Digital Presence, not render them free.

---



## 7. Open Decisions

Every point below is a place where the critique's recommended architecture and the audit's findings about current code diverge, where `lpd-planning` or `level-play-brand-os` doctrine conflicts with or wasn't checked against a requirement, or where the audit could not confirm something a requirement above depends on. **OD-9, OD-12, and OD-13 are marked RESOLVED below** with the founder's decision and rationale; the remaining eleven are still open.

### OD-1 — How should Overall reconcile with section scores?

- **Option A: Derive Overall mathematically from displayed section scores**, via an explicit, documented penalty/weighting rule. *Tradeoff: keeps the three visible numbers connected and explainable, but requires deciding a weighting scheme (and possibly discarding the current signal-based Overall calculation entirely).*
- **Option B: Stop displaying section scores that don't feed Overall**, and derive user-facing "sections" purely as groupings of the same signals that produce Overall. *Tradeoff: guarantees mathematical consistency by construction, but is a larger rebuild of the section-builder code (*`scoreFromFindings`*,* `synthesizeFreeSearchFootprint`*) than Option A.*
- This is posed directly by the audit's own "Implication for PRD" note (audit §1) and is not resolved by the critique, which specifies *that* Overall must reconcile (P1-1) but not *how*. **Blocks:** P1-1's acceptance criteria, and downstream, P2-1/P2-4.



### OD-2 — Which report-assembly pipeline is canonical?

- The audit found **two parallel report-assembly pipelines** both wired into the paid full-report flow today: the newer signals-based path (`assemble-from-signals.ts` / `serp-backed-sections.ts`) and a legacy path (`build-sections.ts`, `assembleReportJson`) that appears to be a placeholder still in production, with its own near-duplicate scoring function and a different letter-grade threshold set than the current path.
- **Option A: Consolidate onto the newer signals-based path**, deleting the legacy path. *Tradeoff: removes the inconsistency source cleanly, but requires confirming nothing in paid full-report flow silently depends on legacy-path-only behavior.*
- **Option B: Keep both intentionally** (e.g., legacy path serves a purpose not documented in either source doc). *Tradeoff: avoids a possibly-risky deletion, but perpetuates the exact inconsistency (duplicate scoring logic, mismatched grade thresholds) the audit flagged as a live bug source.*
- Neither the critique nor the audit states which pipeline is intended to be authoritative — the critique wasn't scoped at this code-detail level, and the audit only surfaces the conflict. **Blocks:** P1-1 (can't fix "the" scoring methodology if two pipelines compute it differently), and by extension P2-1/P2-4.



### OD-3 — Should the Recommendation Object be relational or extend the JSONB pattern?

- **Option A: New relational schema** (tables for recommendations, evidence, dependencies) in Supabase. *Tradeoff: directly supports the filtering/sorting/status-tracking interactions critique §16.4 requires for the dashboard, but is a larger migration than anything currently in the codebase (today: zero relational finding/recommendation tables, everything in opaque* `report_json` *JSONB).*
- **Option B: Extend the existing JSONB blob pattern** with a richer nested schema. *Tradeoff: consistent with how the codebase works today and faster to ship, but the audit gives no evidence this pattern can support real filtering/sorting at the dashboard-interaction level critique §16.4 describes — this would need to be validated, not assumed.*
- Critique §3 separately recommends architecting the (unrelated) Brand Intelligence scoring engine "as a decoupled service... from day one" — signaling a general preference for service/schema decoupling that isn't reflected in the current JSONB-only persistence model anywhere in the app. **Blocks:** P2-1's persistence design, and therefore P2-5's dashboard feasibility.



### OD-4 — Exact structural separation of "Social & Off-site" from "Digital Presence"

- Today, social findings are folded into `digital_presence` via `buildSocialFindings` (`serp-backed-sections.ts:710-734`) — there is no independent scoring path for social/off-site presence.
- **Option A: Split into a genuinely separate scoring function/section** for free-tier "Social & Off-site," reusing only the social-relevant signals, while `digital_presence` (with its non-social signals) remains paid-only. *Tradeoff: matches the marketed 2-section free/paid split cleanly, but requires new section-builder code, not just a UI relabel.*
- **Option B: Keep one combined scoring function internally, but present a filtered subset as "Social & Off-site" for free tier.** *Tradeoff: less new code, but risks re-creating exactly the kind of "component doesn't match displayed section" opacity the audit flagged elsewhere (e.g., OD-1).*
- Neither source document specifies this. **Blocks:** P0-3's acceptance criteria on what "a distinct Social & Off-site section" concretely means.



### OD-5 — Free-tier treatment of the Decision Roadmap

- The audit flagged that `PAID_ONLY_SECTION_IDS` includes `action_plan` today, yet free tier renders a capped preview of it anyway (`thisWeek.slice(0,4)`) — the constant doesn't fully gate real behavior.
- **Option A: Decision Roadmap is fully paid-gated, zero preview on free tier.** *Tradeoff: cleanest paywall and matches critique §14.4's intent to give the $97 tier "real added weight," but is a harder sell/conversion motion than a teaser.*
- **Option B: Free tier gets a capped/teaser Roadmap** (consistent with today's `action_plan` pattern). *Tradeoff: consistent with existing free-tier upsell mechanics, but risks recreating the exact "advertised as paid, ships free" problem the audit found with Reputation/Digital Presence (P0-3) — this time for the Roadmap itself.*
- Neither source document picks one. **Blocks:** P2-5's acceptance criteria on gating.



### OD-6 — Timing of four-pillar IA collapse

- Critique §9 proposes four pillars now; but V1's actual module scope (§7: Search + Trust + light Brand + Roadmap) leaves **Brand & Message** (depends on Messaging/Intent Intelligence, both V2) and **Revenue Readiness** (no dedicated V1 module — Revenue Intelligence isn't in the V1 list) with little or no V1 content.
- **Option A: Ship four-pillar nav in V1 anyway**, with two pillars intentionally sparse, as a forward-looking IA investment. *Tradeoff: avoids a second nav migration later, but ships a nav with two visibly empty/thin destinations at launch.*
- **Option B: Defer pillar IA to V2**, keep V1's nav closer to today's flat section list (adapted for the 2-section free tier and Decision Roadmap). *Tradeoff: avoids shipping empty pillars, but means a second IA migration when V2 modules arrive.*
- Also note: the audit confirms the *current shipped product* has no nine-module nav at all — it's six flat report sections — so "collapsing nine modules to four pillars" (critique §9's framing) doesn't map onto any nav migration that exists in code today; it maps onto the original brief's aspirational structure, not a live UI. **Blocks:** P2-7's timing and scope.



### OD-7 — Was "Decision Intelligence" ever used externally, and where?

- Critique §13/§15 (P2-6) recommends auditing marketing/investor copy for "Decision Intelligence" as a category label.
- The codebase audit did not search `lpd-redesign` marketing copy, investor materials, or sales collateral for this specific phrase — its stated scope was the product app plus the specific files cited for the free/paid mismatch.
- **This is an "unable to determine" gap, not a resolved finding:** whether the phrase currently appears anywhere external is unconfirmed by either source document. P2-6's acceptance criteria can't be verified as complete until this audit pass happens — recommend scoping it as the first step of P2-6's execution, not assuming it's already known.



### OD-8 — Is "Brand Intelligence (light)" in or out of this PRD?

- Critique §7 lists Brand Intelligence (website + LinkedIn only) as part of the V1 module set. Critique §15's P0/P1/P2 backlog contains **no corresponding item** for it — it only appears in P3 as full/expanded Brand Intelligence (which is explicitly out of scope here, see Appendix).
- Per this PRD's explicit instruction to scope requirements strictly to §15's P0–P2 items, Brand Intelligence light has no requirement entry in §4, no acceptance criteria, and no audit findings (the codebase audit found no website/LinkedIn brand-scoring code path at all).
- **This is a gap between critique §7 and critique §15, not a decision made in this PRD.** If Brand Intelligence (light) is intended to ship as part of this V1 release, it needs its own backlog item with acceptance criteria before it can be added to §4 — it is not implicitly included by virtue of being named in §7.



### OD-9 — RESOLVED: "Action Roadmap" stays as the customer-facing name; no rename

- `STRATEGY.md` Decision #14 (locked) and `COPY_BANK.md` §7.0 establish **"Action Roadmap"** as the canonical, lint-enforced customer-facing name for the $97 paid deliverable.
- **Resolution:** no rename. "Action Roadmap" remains the sole customer-facing name for this deliverable — not Option A, and not Option B's "new feature inside the tier" framing either, since that would still require introducing a second customer-visible name to distinguish the two. P2-5 ships as an upgrade to the existing Action Roadmap (dashboard UI, ranked Recommendation Objects, filtering/status-tracking) under its current name, with no new customer-facing terminology and no `COPY_BANK.md`/lint rule changes required for naming.
- **"Decision Roadmap" remains valid as internal/architectural shorthand** throughout this PRD and in engineering conversation — consistent with how P2-6 already treats "Decision Intelligence" as an internal-only term. Every other use of "Decision Roadmap" elsewhere in this document — including P2-5's own heading/description and P2-7's description/dependency in §4, plus §3, §6, §9, OD-5, OD-6, OD-11, and Success Metrics — refers to the same underlying P2-5 deliverable and should be read as "Action Roadmap" wherever customer-facing copy is being described. P2-5's requirement heading itself was written before this resolution and still says "Decision Roadmap" throughout §4 — that's the internal engineering label for the requirement, not a signal that a second customer-facing name is being introduced.
- **No longer blocks:** P2-5's customer-facing copy.



### OD-10 — Does "extend, don't rebuild" apply to the Recommendation Object schema and evidence provenance work?

- `PRODUCT_ROADMAP.md`'s "Architecture review additions (2026-06-26)" and `STRATEGY.md`'s "Intelligence core architecture" contain a locked instruction: extend the existing intake → research → scoring → LLM synthesis → JSON → UI/email path additively; do not rebuild from scratch; defer a full evidence-snapshot store until re-synthesis/support/audit workflows clearly need it, rather than building one prematurely. `REPORT_VALUE_DELIVERY.md` backlogs the evidence-snapshot idea at **P3**.
- This PRD's P2-1 (net-new Recommendation Object schema) and P2-2 (evidence provenance/freshness standard, required before P2-1) both describe foundational, blocking, **P2** work of a kind and scope the 2026-06-26 review didn't anticipate.
- **Option A: The Recommendation Object schema and evidence provenance standard are exempt from "additive only"** — they're new, deliberate infrastructure the 2026-06-26 review didn't rule on, not a rebuild of what exists. *Tradeoff: proceeds as scoped in this PRD, but risks being read as contradicting a locked decision if not explicitly re-approved.*
- **Option B: Treat P2-1/P2-2 as subject to "additive only" and design them as an extension of the existing `report_json` JSONB pattern**, deferring anything that looks like a new evidence store. *Tradeoff: stays inside the existing locked constraint, but may not be able to support the dashboard filtering/sorting critique §16.4 describes — this is the same tension as OD-3, from the planning side rather than the audit side.*
- Neither source document (critique or audit) was aware of this locked review. **Blocks:** P2-1, P2-2, and by extension OD-3 — these three should be resolved together, not independently.



### OD-11 — Which paid tier gates Reputation and Digital Presence: $97 or $297?

- `STRATEGY.md` and `FUNNELS_AND_MARKETING.md` describe **three** LevelStack tiers: Visibility Snapshot ($0), Action Roadmap ($97), Action Roadmap + Strategy Call ($297). P0-3 and OD-5 in this PRD refer only to "the $97 paywall" when describing where Reputation and Digital Presence move.
- **Option A: Gate at $97 (Action Roadmap)**, consistent with critique §14.1/14.4's framing of "the $97 tier" as the target. *Tradeoff: matches the critique's stated intent directly, but doesn't address whether the $297 tier needs any additional differentiation once $97 already contains everything except the strategy call.*
- **Option B: Gate at $297**, reserving Reputation/Digital Presence (and possibly the Decision Roadmap, per OD-5) for the top tier, with $97 unlocking a smaller middle ground. *Tradeoff: gives the $297 tier more distinct value, but the critique never scoped a 3-tier restructuring — this would be a new decision beyond what either source document analyzed.*
- Neither source document accounts for the $297 tier at all. **Blocks:** P0-3's and OD-5's acceptance criteria on exact tier boundaries.



### OD-12 — RESOLVED: vNext engineering proceeds without waiting for the 3-paying-customer gate

- `STRATEGY.md`'s Validation gates (3 non-friend paying $97 customers through real channels before building further) and LevelStack's stated portfolio role ("lead gen + brand proof," not the primary MRR product, with SEO Automator Pro named as the primary MRR/exit-planning product) remain accurate context.
- **Resolution:** this gate is a self-imposed internal discipline in a document with a single approver — the founder — not an external constraint (investor covenant, compliance requirement, co-founder agreement). The founder elects **Option B**: proceed with the full P0–P2 sequence as scoped, treating the vNext architecture itself as part of the path to clearing the validation gate rather than a prerequisite blocked behind it.
- This does not retroactively invalidate the gate as a general practice — it remains a useful heuristic for future scope decisions — but it no longer blocks this PRD's P2 tier.
- **Action (required, not conditional):** `STRATEGY.md`'s Validation gates section currently reads as an unmet, unqualified blocker ("before building further"). Leaving it as-is while P2 engineering proceeds recreates the exact kind of doc-vs-reality drift `STRATEGY.md`'s own "Known bugs" log calls out elsewhere (e.g., "BRAND DRIFT" entries). Update that section now to record this specific, dated exception (LevelStack vNext P0–P2 proceeds ahead of the gate, founder decision, this PRD) rather than leaving the gate looking unmet and unaddressed.
- **No longer blocks:** the P2 tier's authorization to start. Technical Open Decisions (OD-1, OD-2, OD-3, OD-10) still gate P2-1 specifically, per the critical path in §9 — this resolution removes the non-technical blocker only.



### OD-13 — RESOLVED: Report Value Slice 3 pauses and folds into P2-1/P2-4

- `CURRENT_SPRINT_GOALS.md` #12 (the active "Next" priority per `REPORT_VALUE_DELIVERY.md`) is **Report Value Slice 3**: reputation dedup, action-plan artifacts (`emailTemplate`, `copyRewrite`, `replyDraft`, checklist), SERP evidence links — all built as enrichments to the **current** `actionItemSchema`/`findingSchema` pair that P2-1 is designed to replace.
- **Resolution:** Option B. Slice 3 pauses; its scope is folded directly into P2-1/P2-4 — action-plan artifacts (email templates, copy rewrites, reply drafts, checklists) and evidence links are designed as native Recommendation Object fields from the start, not built twice.
- **Rationale:** OD-12 already commits to the schema rebuild as real, near-term work rather than deferred/aspirational. Under that commitment, Option A's rework risk is more likely to materialize than Option B's stalled-near-term-win risk — Slice 3's evidence-links feature in particular is functionally a preview of what P2-2's provenance standard is meant to formalize, so building it once against `actionItemSchema` and again against the Recommendation Object a few weeks later is the probable outcome of proceeding with Slice 3 unchanged.
- **Action:** `CURRENT_SPRINT_GOALS.md` #12 should be updated to reflect this — either closed and re-opened as scope inside P2-1/P2-4, or explicitly marked "superseded by vNext schema work" so it isn't picked up as-is by anyone working from the sprint board.
- **No longer blocks:** near-term team allocation is now determined by Track 4's sequencing, not a parallel Slice 3 effort.

### OD-14 — Does the Recommendation Object schema (§5) need to add fields to match brand-os's locked recommendation anatomy, or is the overlap already sufficient?

- `level-play-brand-os/product/AI_PRINCIPLES.md` locks a "standard recommendation anatomy" for any AI-generated recommendation: what should be done, why it matters, **why now**, what evidence supports it, expected benefits, risks/dependencies, **what happens if it is ignored**, confidence, and next action. This PRD's Recommendation Object (§5) was designed from critique §8/§13 alone — `evidence`, `confidence`, `dependencies`, `roi`, `automatability`, `owner` — without checking it against this anatomy, even though `BRAND_SOURCE.md`'s required reading order names `AI_PRINCIPLES.md` as required reading before this kind of work.
- **The mismatch:** brand-os's anatomy has two fields with no clear home in §5's schema — **"why now"** (urgency/timing, distinct from "why it matters") and **"what happens if it is ignored"** (inaction-risk framing). §5's schema has two fields brand-os's anatomy doesn't name explicitly — `automatability` and `owner` (though `owner` arguably maps to "next action").
- **Option A:** Add `urgency` (why-now rationale) and `consequenceOfInaction` as new first-class fields on the Recommendation Object. *Tradeoff: more complete alignment with locked AI doctrine; two more fields to populate on every recommendation, adding synthesis cost and schema complexity before P2-1 has even shipped the six fields already scoped.*
- **Option B:** Treat "why now" and "consequence of ignoring" as content that belongs inside the existing `evidence`/`roi` fields' prose rather than new structured fields, and document that mapping explicitly so the schema is defensible against brand-os's anatomy without growing. *Tradeoff: no new fields or synthesis cost; the two ideas stay as unstructured prose rather than filterable/sortable dashboard data, which weakens the "structured object, not prose" argument critique §8 makes for the schema's value in the first place.*
- **Not resolved here** — this is a founder decision on schema scope, not something either source document (critique or audit) settles, since neither was checked against brand-os during drafting.
- **Dependency:** Should close before P2-1 engineering starts, alongside OD-1, OD-2, OD-3, and OD-10 (see §9) — adding fields after the schema ships is a migration, not a design choice.

---



## 8. Success Metrics

*Proposed — not specified by either source document, not final. Flagged here because the critique doc did not include numeric targets and the audit doesn't produce metrics, only findings. These need review and revision by the team that owns each area.*


| Requirement                         | Proposed metric                                                                                                                                                                                                                         | Notes                                                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 (error leakage)                | 0 raw backend error strings observed in customer-facing findings, sampled weekly post-launch                                                                                                                                            | Directly verifiable via the same audit method used in critique §14.3.                                                                                                           |
| P0-2 (AI-search-presence)           | % of free-tier reports with a non-stub AI-answer-engine finding; cost per report added by this check                                                                                                                                    | No baseline exists today (feature doesn't exist); both numbers need a launch baseline before a target is set.                                                                   |
| P0-3 (free-tier restructure)        | Free-tier report error rate pre/post restructuring; free-tier external call count pre/post (baseline: ~12-14 calls/report cold cache, per audit §8)                                                                                     | Error-rate metric matters because P0-3 removes some free-tier calls (Reputation, GBP/PageSpeed) while P0-2 adds new ones — net reliability effect is unverified until measured. |
| P0-3 / P2-5 (paid tier value)       | $97 conversion rate pre/post restructuring                                                                                                                                                                                              | Named explicitly in the PRD's own instructions as a metric to propose; no baseline conversion rate is available in either source document.                                      |
| P1-1 (scoring reconciliation)       | Score reconciliation accuracy — % of generated reports where Overall is explainable from section scores by the documented method (target: 100% once shipped, since this should be deterministic, not statistical)                       | This is a binary correctness check once OD-1 is resolved, not a rate that should have an acceptable failure floor.                                                              |
| P1-2 (insufficient-data state)      | % of sections rendering "insufficient data" vs. a false numeric score, on reports where underlying checks genuinely failed/were skipped                                                                                                 | Requires instrumentation of check failure/skip events, which doesn't appear to exist today per the audit.                                                                       |
| P1-4 (category taxonomy)            | % of businesses classified outside the generic default bucket ("General business services" or equivalent)                                                                                                                               | No baseline exists; today's system has no taxonomy to measure against.                                                                                                          |
| P2-1 (Recommendation Object schema) | % of Search + Trust recommendations (post P2-4 rebuild) with all required schema fields populated (evidence, confidence, dependencies, roi, automatability, owner) — target 100%, since partial population defeats the schema's purpose | —                                                                                                                                                                               |
| P2-5 (Decision Roadmap)             | Dashboard engagement (sessions, status-tracking actions taken on recommendations) vs. today's report-view-only behavior                                                                                                                 | No current dashboard exists to baseline against; this would be a new metric category.                                                                                           |
| P2-6 (naming audit)                 | Count of external "Decision Intelligence" category-label usages found and corrected                                                                                                                                                     | Depends on OD-7 being resolved (audit pass) before a baseline count exists.                                                                                                     |


---



## 9. Sequencing & Dependencies

Build order below groups requirements by what blocks what; it does not assign dates or team assignments (neither source document specifies those).

**Track 1 — Ship immediately, no blocking dependencies:**

1. **P0-1** (error leakage fix) — live trust risk, standalone.
2. **P0-4** (funnel copy fix) — standalone, though if shipped before P1-1 the only safe fix is removal (see P0-4's own note).
3. **P1-4** (category taxonomy) — standalone.
4. **P2-2** (evidence provenance standard) — foundational, no dependencies.
5. **P2-3** (confidence methodology) — foundational, no dependencies.
6. **P2-6** (naming/copy audit) — standalone, but should start with OD-7's audit pass first since its own completeness can't be verified otherwise.

**Track 2 — Scoring integrity (must resolve OD-1 and OD-2 first):**
7. **P1-1** (scoring methodology + reconciliation) — depends on OD-1 and OD-2 being decided; blocks P2-1.
8. **P1-2** (insufficient-data state) — depends on P0-1's classifier and overlaps with P1-1; recommend designing together.
9. **P1-3** (grade/banner UX) — depends on P1-1 and P1-2.

**Track 3 — Free-tier restructuring (must resolve OD-4 first):**
10. **P0-2** (AI-search-presence check) — no hard dependency on Track 2, can run in parallel.
11. **P0-3** (2-section free tier) — depends on P0-2 and OD-4's resolution.

**Track 4 — Foundation schema (depends on Tracks 1 and 2 completing):**
12. **P2-1** (Recommendation Object schema) — depends on P1-1 (explicit per critique §16.1), P2-2, P2-3, and OD-3's resolution.
13. **P2-4** (rebuild Search + Trust onto schema) — depends on P2-1, P1-2, P0-1, P1-1.
14. **P2-5** (Action Roadmap dashboard UI, internally "Decision Roadmap" — see OD-9) — depends on P2-1, P2-4, and OD-5's resolution.
15. **P2-7** (four-pillar nav) — depends on P2-5's scope being settled and OD-6's timing decision; may not be a V1 item at all depending on that decision.

**Critical path:** OD-1/OD-2 → P1-1 → P2-1 → P2-4 → P2-5. Everything in Track 4 is gated on the scoring-integrity work in Track 2, which is itself gated on two Open Decisions (§7) that neither source document resolves. **No engineering on P2-1 should start before OD-1, OD-2, OD-3, OD-10, and OD-14 are closed** — starting earlier risks building the schema against an unreconciled scoring model, a persistence choice that gets reversed, a locked "additive only" constraint the schema wasn't checked against, or a field set that needs a migration two weeks later once checked against brand-os's locked recommendation anatomy.

**Track 4 authorization:** OD-12 (the 3-paying-customer validation gate) is resolved — the founder, as sole approver, elects to proceed with the full P0–P2 sequence without waiting for the gate to clear. Track 4's remaining blockers are the technical Open Decisions above (OD-1, OD-2, OD-3, OD-10, OD-14). OD-9 (naming) is resolved — "Action Roadmap" stays as the customer-facing name, no rename required. OD-13 is resolved — Report Value Slice 3 pauses and folds into P2-1/P2-4; update `CURRENT_SPRINT_GOALS.md` #12 accordingly so it isn't picked up separately.

---



## 10. Planning Cross-Reference

This PRD was checked against `lpd-planning`'s tracking files (`PRODUCT_ROADMAP.md`, `CURRENT_SPRINT_GOALS.md`, `STRATEGY.md`, `FUNNELS_AND_MARKETING.md`, `REPORT_VALUE_DELIVERY.md`, `COPY_BANK.md`) after drafting, and later against `level-play-brand-os` doctrine (see "Brand OS cross-reference" below). This section summarizes what those checks found; the individual conflicts are folded into §7 as OD-9 through OD-14 and into the affected requirements in §4/§5 as "Planning cross-reference" notes. Nothing here is new analysis beyond those — this is the index. **OD-9, OD-12, and OD-13 have since been resolved by the founder** (see §7); this index is kept as a record of what was found, not a live list of open items — check §7 for current status.

**Updates to `lpd-planning` itself, generated by these resolutions — made 2026-07-18:**

- `STRATEGY.md`'s Validation gates section now records a dated exception for OD-12 — no longer reads as an unmet, unqualified blocker. The same exception was also propagated to the two other places the gate was independently restated (`REPORT_VALUE_DELIVERY.md` "Validation gate," `FUNNELS_AND_MARKETING.md` §7) — a duplication this cross-reference pass surfaced that wasn't previously tracked here.
- `CURRENT_SPRINT_GOALS.md` #12 (Report Value Slice 3), `PRODUCT_ROADMAP.md`'s Slice 3 row, and `REPORT_VALUE_DELIVERY.md`'s Slice 3 priority rows are all now marked superseded/folded into P2-1/P2-4 per OD-13's resolution.
- `CURRENT_SPRINT_GOALS.md` #13's free-tier sub-bullet and #19 (grade mismatch) are now marked merged into this PRD's P0-3 and P1-1/P0-2 respectively, with pointers back here so they aren't worked as separate, differently-scoped tickets. `PRODUCT_ROADMAP.md`'s corresponding rows got the same treatment, plus a new top-of-list P0 row pointing at this PRD as the current authoritative scope for all of the above.

### Already-tracked work this PRD duplicates or re-scopes

| PRD item | Existing planning ticket | What differs |
|---|---|---|
| P0-3 / OD-4 | `CURRENT_SPRINT_GOALS.md` #13, `REPORT_VALUE_DELIVERY.md` "Free-tier scope drift (active)," `STRATEGY.md` report-sections table | Same underlying 3-way mismatch; this PRD raises it from planning's P2 brand priority to P0. Planning's canonical section name ("Social & off-site presence") is adopted here rather than re-derived. |
| P1-1 / OD-1 / OD-2 | `CURRENT_SPRINT_GOALS.md` #19, "Debug free vs paid grade mismatch" | Planning frames it as a bug to reproduce/trace/decide; this PRD frames it as an architecture decision blocking the Recommendation Object schema. Same code (`score-all-signals.ts`, `run-report-pipeline.ts`). |

Both planning tickets now point back to this PRD as the merged, authoritative scope (updated 2026-07-18). Engineering should still treat each as one unified requirement here, not resume the old tickets' narrower framing in parallel.

### Locked planning decisions this PRD's Open Decisions must be checked against

- **"Do not rebuild LevelStack from scratch... additive improvements only"** (`PRODUCT_ROADMAP.md`, `STRATEGY.md`) — bears directly on OD-3 (relational vs. JSONB) and is the basis for the new OD-10.
- **Evidence-snapshot table backlogged at P3** (`REPORT_VALUE_DELIVERY.md`) — conflicts with this PRD's P2-2 treating evidence provenance as P2/foundational/blocking. Also folded into OD-10.
- **"Action Roadmap" as the locked, lint-enforced customer-facing name** (`STRATEGY.md` Decision #14, `COPY_BANK.md` §7.0) — **resolved (OD-9):** "Decision Roadmap" stays internal shorthand only; no rename, no lint/copy-bank changes needed for naming.
- **Three-tier pricing ($0 / $97 / $297)** (`STRATEGY.md`, `FUNNELS_AND_MARKETING.md`) — this PRD's P0-3/OD-5 only reference "the $97 paywall," not the $297 tier. **Still open: OD-11.**
- **Validation gates (3 paying customers before building further) and LevelStack's stated portfolio role** ("lead gen + brand proof," not the primary MRR product) (`STRATEGY.md`) — **resolved (OD-12):** founder elects to proceed with P0–P2 without waiting for the gate; `STRATEGY.md` update made 2026-07-18 (see above).

### In-flight work with an unresolved sequencing relationship to this PRD

- **Report Value Slice 3** (`CURRENT_SPRINT_GOALS.md` #12, formerly "Next") built action-plan artifacts onto the schema P2-1 replaces. **Resolved (OD-13):** folds into P2-1/P2-4 (see updated acceptance criteria in §4 and the new `artifact` field in §5); `CURRENT_SPRINT_GOALS.md` update made 2026-07-18 (see above).

### Checked and found no conflict

- "Decision Intelligence" as a category-label phrase does not appear anywhere in `lpd-planning` — consistent with P2-6/OD-7, though this doesn't cover `lpd-redesign` marketing copy or investor materials, which remain unaudited.
- Planning's canonical free-tier section names ("Search footprint," "Social & off-site presence") align with critique §14's proposed restructuring direction — no conflict, just adopted directly in P0-3.

### Brand OS cross-reference (checked 2026-07-18)

`level-play-brand-os` sits one level above `lpd-planning` in its own hierarchy (`BRAND_SOURCE.md`) and was not checked during initial drafting. Checked after the fact against `product/AI_PRINCIPLES.md`, `ai/AI_CONSTITUTION.md`, `product/PRODUCT_ARCHITECTURE.md`, `product/PRODUCT_HIERARCHY.md`, `product/PRODUCT_DECISION_FRAMEWORK.md`, `brand/LANGUAGE_RULES.md`, and `company/OPERATING_MODEL.md`.

**Confirms, no PRD change required:**

- **OD-9's resolution is doctrinally grounded, not just a naming compromise.** `company/OPERATING_MODEL.md` names LevelStack's own stage in the company's five-stage model literally as "Decide" ("LevelStack prioritizes the work, clarifies why it matters, and produces an actionable roadmap"). "Decision Roadmap" as internal shorthand maps directly onto this.
- **OD-10's tension is real but this PRD doesn't cross the line.** `product/PRODUCT_ARCHITECTURE.md` and `product/PRODUCT_HIERARCHY.md` lock LevelStack as diagnostic-only ("Understand • Explain • Prioritize"); "execute, fix, deploy, monitor" is reserved for Automator Pro. None of this PRD's P0–P2 requirements have LevelStack executing or fixing anything — they're scoring/evidence/recommendation-structure work — so nothing here needs revision on this point. OD-10 remains open for the separate "additive vs. rebuild" architecture question, not a product-boundary violation.
- **The `automatability` field is safe.** `ai/AI_CONSTITUTION.md` Rule 6 ("require appropriate authority before consequential actions") is satisfied because the field is informational — it flags what could be automated by Automator Pro, not LevelStack automating it itself.
- **OD-7 gets supporting evidence, not resolution.** `brand/LANGUAGE_RULES.md`'s avoid-list already bans "operational intelligence" by name, a near-identical phrase to "Decision Intelligence." Brand-os doesn't name "Decision Intelligence" specifically, so OD-7 stays open, but existing doctrine already leans toward the same caution the critique raises.

**Surfaced a gap — folded in above:**

- **The Recommendation Object schema (§5) was never checked against brand-os's locked "standard recommendation anatomy"** (`product/AI_PRINCIPLES.md`), despite `BRAND_SOURCE.md` naming that document as required reading before this kind of work. Folded in as the new **OD-14** (§7).
- **This PRD was never explicitly run through `product/PRODUCT_DECISION_FRAMEWORK.md`'s seven-criteria acceptance gate**, even though `PRODUCT_ROADMAP.md` already quotes that framework verbatim elsewhere as its own prioritization gate. Not folded in as a separate Open Decision — flagged here as a process note, since it's a check to run rather than a decision to close.

---



## Appendix — Out of Scope for This PRD (V2/V3, per critique §7 and §15 P3)

Listed for visibility only. Nothing below is a requirement in this PRD, and nothing in §4 should be read as implicitly committing to these.

**V2 (critique §7, §15 P3):**

- AI answer-engine / LLM visibility tracking as a full Search Intelligence module (P0-2 above ships a minimal version only; the full module is V2).
- Outcome/feedback loop v1 — instrumenting Automator Pro executions to capture recommendation outcomes and feed back into confidence/ROI calibration.
- Brand Intelligence (light) — website + LinkedIn scoring inside the new schema. *(Note: this is named in critique §7's V1 list but has no P0–P2 backlog item — see OD-8. Placed here provisionally as V2/deferred pending that decision, not because either source document explicitly assigns it to V2.)*
- Messaging Intelligence.
- Single-competitor Competitive Intelligence.
- Intent Intelligence pilot, with a small customer set, using banded (Low/Medium/High) alignment rather than fake-precise percentages.

**V3 (critique §7, §15 P3):**

- Audience Intelligence.
- Multi-tenant competitive benchmarking.
- Full multi-source Authenticity Analysis (interviews, podcasts, newsletters).
- Continuous Monitoring.
- Automator Pro closed-loop automation at scale.

