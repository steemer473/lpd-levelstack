# LevelStack Codebase Audit — Findings Report

**Purpose:** pre-PRD investigation pass. Read-only audit, no code changed. Each finding is cited with file/function references and carries a confidence label (confirmed / likely / unable to determine) plus a one-line implication for the PRD.

**Scope:** `/Users/stephaniedragsdale/Sites/lpd-levelstack` (product app) and `/Users/stephaniedragsdale/Sites/lpd-redesign` (marketing hub, referenced in §4/§6).

---

## 1. Scoring Logic — why Overall (57) < mean of sections (~70)

**Confidence: confirmed.**

The three numbers on the report card are computed by **three unrelated code paths** that never reference each other's output. "Overall" is not a weighted average, penalty-adjusted average, or function of the visible section scores at all — it's a completely separate calculation over raw signal data that the sections don't display.

| Score | Where computed | Method |
|---|---|---|
| Search Footprint (87) | `synthesizeFreeSearchFootprint` → OpenAI, `lib/pipeline/search-footprint-synthesis.ts:269-316` | LLM freely picks a number. Schema is `score: z.number().min(0).max(100)` (`lib/pipeline/report-types.ts:59`), and the system prompt only says `"score 0-100"` (`lib/pipeline/synthesis-prompts.ts:41`) — no rubric ties it to anything else. |
| Reputation (62), Digital Presence (62) | `scoreFromFindings`, `lib/pipeline/serp-backed-sections.ts:36-46` | A 3-bucket cliff function: any `critical` finding → 42, any `high`/`medium` finding → 62, else → 78. Any single bad finding (including a *failed check*, see §3) puts the whole section at exactly 62. |
| **Overall (57)** | `scoreAllSignals`, `lib/audit/score-all-signals.ts:318-326`, consumed at `lib/pipeline/assemble-free-report.ts:164` (`overallScore: audit.overallScore`) | A weighted average across discrete `AuditSignalResult`s using `statusToPercent` (`lib/audit/types.ts:43-47`: pass=100, **warning=50, fail=0**) times `SIGNAL_WEIGHTS` (types.ts:30-41). For free tier this pool is only the 6 free-tagged signals (`google_indexing`, `search_snippet_accuracy`, `meta_og_completeness`, `social_platform_coverage`, `subdomain_exposure`, `directory_presence` — filtered at `score-all-signals.ts:306-309`). |

Two compounding effects explain the gap:
1. **Different point scales for the same failure.** The section bucket function treats a bad finding as "medium" → 62 (i.e., 62/100). The signal-based Overall treats the same underlying failure as `warning`/`fail` → 50 or **0** points. A finding that costs a section only 16 points (78→62) can cost the Overall pool a full 50-100 points on that signal.
2. **Overall isn't a mean of sections — it's a mean of signals**, several of which (e.g. `meta_og_completeness`, `subdomain_exposure`) aren't independently visible to the user as their own line item, and none of which is weighted to match how the three visible sections are proportioned.

**Implication for PRD:** the PRD must decide on one real scoring model — either derive Overall mathematically from the displayed section scores (with an explicit, documented penalty rule), or stop displaying section scores that don't feed Overall. The current setup will always produce visually inexplicable results.

---

## 2. Error Handling / Leakage — raw backend errors reaching users

**Confidence: confirmed.**

- `serpApiOrganicSearch` (`lib/research/serp/providers/serpapi.ts:71-79`) takes SerpAPI's raw `data.error` string and puts it verbatim into `limitation` with no rewrite: `return { response: { query, results: [], aiOverview: null, limitation: data.error }, ... }`. "Internal SE Server Error" is a known SerpAPI passthrough of a Google-side hiccup, not a quota/config problem.
- **Failover logic only covers quota-type errors.** `shouldFailoverOrganic` → `isProviderQuotaError` (`lib/research/serp/quota-errors.ts:1-28`) matches patterns like `quota`, `credit`, `rate limit`, `payment required`, or HTTP 402/429. "Internal SE Server Error" matches none of these, so `shouldFailover` is `false`: no failover to the next provider in the chain, no retry, the router (`lib/research/serp/router.ts:106-115`) accepts and caches the erroring response as-is.
- **The one sanitization layer that exists doesn't cover this string.** `isInternalLimitation` (`lib/report/customer-copy.ts:3-19,65-69`) is a regex allowlist for internal error text (`"serpapi is not configured"`, `"serpapi http"`, `"all serp providers failed"`, or any string containing `serpapi`/`searchapi`/`dataforseo`). "Internal SE Server Error" contains none of those tokens, so `isInternalLimitation("Internal SE Server Error")` returns `false` — it's treated as legitimate, customer-safe text.
- **And even that sanitizer isn't applied to the Reputation path the user observed.** `buildReputationFindings` (`lib/pipeline/serp-backed-sections.ts:683-690`) does `value: search.limitation.slice(0, 100)` directly, with severity `"medium"`, with no call to `isInternalLimitation` or `polishCustomerFindingCopy`. The GBP-specific helpers (`customerGbpFindingValue`/`customerGbpFindingDetail`, same file, lines 78-107) *do* filter through `isInternalLimitation`, but reputation/review-search findings never route through them.

**Implication for PRD:** needs (a) a broadened, allowlist-based (not denylist-based) internal-error classifier that defaults to hiding anything not explicitly recognized as safe, and (b) that classifier applied uniformly at every `limitation` consumption site, not just GBP.

---

## 3. Scoring Over Failed Data

**Confidence: confirmed.**

There is no "insufficient data / check errored" state anywhere in the type system — every check collapses into the same finding/severity shape used for genuine findings, so a failed external call scores identically to a real negative result.

**Per-section checks and failure handling:**

| Section | Checks (free tier) | On error/empty, what happens |
|---|---|---|
| Reputation | 4 Google SERP queries: `"{business} reviews"`, `site:yelp.com`, `site:bbb.org`, complaints (`lib/pipeline/research-queries.ts:82-89`, run via `collectDirectoryReviewSearch`, `lib/pipeline/collect-research.ts:118-126`) | `buildReputationFindings` (`serp-backed-sections.ts:683-690`): if `search.limitation` is set (any error, quota or backend), pushes a finding with `severity: "medium"` — same severity bucket as "no reviews found." Feeds `scoreFromFindings` directly. Signal side: `scoreDirectories` (`lib/audit/score-all-signals.ts:192-209`) counts directory hits; zero hits (whether real or caused by an errored search) → `status: "fail"` → 0 points in the Overall weighted average. |
| Digital Presence | Homepage signals (`fetchWebsiteSignals`), PageSpeed, GBP lookup | **Free tier never calls PageSpeed or GBP at all** — `collectPaidEnrichment` (which fetches both) only runs `if (reportTier !== "free_snapshot")` (`lib/pipeline/run-report-pipeline.ts:206-208`). `emptyGbp.limitation = "Not fetched yet."` (`lib/pipeline/research-types.ts:110-118`) is indistinguishable in the section builder's severity logic from "we checked and found nothing": the `!gbp.found` branch (`serp-backed-sections.ts:257-288`) always assigns `severity: "high"`, whether the reason is "never checked" (free tier) or "checked, not found" (paid tier). Same 62-point outcome either way. |

No code path excludes a section from scoring, marks it "incomplete," or discounts its confidence when the underlying checks errored or were skipped for tier reasons — it is scored as if the data were fully collected and simply bad.

**Implication for PRD:** requires a first-class "unavailable / not checked" state distinct from "checked, failed," propagated into both the section-bucket score and the signal-weighted Overall, rather than silently defaulting to a negative-severity finding.

---

## 4. Free/Paid Boundary & Shared Codebase

**Confidence: confirmed.**

- **Two separate repos/deployments.** `lpd-levelstack` is the product app (`levelstack.levelplaydigital.com`); `lpd-redesign` is the marketing/commerce hub (`levelplaydigital.com`, hosting `/free` and `/platform/levelstack`), confirmed by `docs/project-brief.md` (repo/deploy table) and separate Vercel projects (`docs/vercel.md`). The hub's `/free` CTA links out to the product app via `getLevelStackFreeSnapshotUrl()` (`lpd-redesign/lib/levelstack-app.ts`).
- **Free-tier gating lives in the product app.** `FREE_TIER_SECTION_IDS` / `PAID_ONLY_SECTION_IDS`, `lib/pipeline/constants.ts:41-51`:
  - Free/unlocked: `search_footprint`, `online_reputation`, `digital_presence`
  - Paid/locked: `revenue_funnel`, `competitive_context`, `action_plan`

  Applied at `assembleFreeReportFromResearch` (`lib/pipeline/assemble-free-report.ts:124`, filters to `FREE_TIER_SECTION_IDS`) and mirrored in the report UI's lock state (`lib/report/display-helpers.ts:245-249`, `components/report/report-shared.tsx`).

- **Marketing copy does not match this.** `lpd-redesign/data/levelstackPlans.ts:12-21` (`levelstackPricingTableFeatures`) explicitly marks:
  ```
  { label: "Search footprint review", free: true, ... }
  { label: "Social & off-site presence", free: true, ... }
  { label: "Reputation review", free: false, ... }   // ← marketed as paid-only
  ```
  `lpd-redesign/app/free/page.tsx:125-130` states: *"Sample Visibility Snapshot — sections 01 and 02 cover search footprint and social presence. The Action Roadmap unlocks reputation, funnel, competitive context, and your prioritized plan."*

  **The mismatch:** marketing sells a 2-section free tier (Search Footprint + "Social & off-site presence," with Reputation gated behind the $97 paid tier), but the actual generated report unlocks a 3-section free tier (Search Footprint + **Reputation** + Digital Presence), and there is no distinct "Social & off-site" section in the report schema at all — social findings are folded into `digital_presence` (`buildSocialFindings`, `serp-backed-sections.ts:710-734`).

  One internal doc is self-consistent with the app (`docs/hub-prd-v2-migration.md`, "free = sections 1-3"), but the live hub pages, pricing table, report preview component, and FAQ structured data all reflect the older 2-section story.

**Implication for PRD:** requires a single source of truth for tier/section entitlement shared (or at least synced) between the two repos, and a decision on which story is correct — ship Reputation free (matching the app) or lock it (matching current revenue model/marketing) — before touching either side.

---

## 5. Existing Recommendation/Finding Schema

**Confidence: confirmed.**

Everything lives in Zod types in `lib/pipeline/report-types.ts`, persisted only as an opaque `report_json JSONB` column (`supabase/migrations/20250603000000_levelstack_product_tables.sql:73` — no relational finding/recommendation tables anywhere in `supabase/migrations/`).

- **Finding** (`findingSchema`, lines 5-15): `label`, `value`, `detail`, `severity` (`critical|high|medium|low|good`), optional `headline`, `bullets`, `riskCategory`, `snippetBefore`, `snippetAfter`. `detail`/`value` serve as informal evidence prose; no dedicated `evidence` field, no `confidence`.
- **Action item** (`actionItemSchema`, lines 66-79): `task`, `sub`, `who` (free-text role like "You"/"Freelancer" — informal owner, not a typed identity), `time` (free-text effort estimate), `findingRef` (loose link back to a finding, by label text — the closest thing to a "dependency"), plus optional `automatorFlag`/`automatorProduct` (`"seo"|"workflow"`) — computed by naive keyword regex in `automatorMatch()` (`lib/pipeline/assemble-from-signals.ts:18-31`), which is the only field resembling "automatability," and it flags whether *LPD's own add-on products* apply, not general task automatability.
- **Explicitly absent:** `evidence` (structured), `confidence`, `priority` (only informally proxied by `severity` and a local, non-persisted sort `weight` in `buildActionPlanFromSections`, `lib/pipeline/action-plan.ts:25-33`), `roi`, `dependencies` (graph), `owner` (typed).
- Separate, unrelated type `AuditSignalResult` (`lib/audit/types.ts:3-10`) does have an `evidence: string[]` field and a `tier` field, but this is pipeline-internal scoring data, not the customer-facing Action Plan object.

**Implication for PRD:** a real recommendation schema (evidence, confidence, priority/ROI, dependency graph, structured owner, automatability) doesn't exist and needs to be designed from scratch — there's no partial implementation to extend beyond the loose `findingRef` string-matching link and the two-value automator flag.

---

## 6. AI-Search-Presence Feature Status

**Confidence: confirmed.**

**Status: partially built, and the missing part is explicitly documented as an out-of-scope v1 decision** — not an oversight.

- `docs/adr/003-research-apis.md:22`: *"AI visibility (ChatGPT / Perplexity) | **Not called** | — | Serp `ai_overview` when present"* — an architecture decision record stating this outright.
- `docs/project-brief.md:740`: *"AI search preview without ChatGPT/Google AIO APIs — v1 approach."*
- What **is** real: Google's own `ai_overview` field, opportunistically returned by SerpAPI/SearchAPI inside a normal organic-search response (`lib/research/serp/types.ts`, parsed at `providers/serpapi.ts:91-96`; DataForSEO's mapper always returns `aiOverview: null`, so this only works on 2 of 3 providers). This surfaces as one card in `aiPreview` when present.
- What is **stubbed as UI-only text, not an API call** (`lib/pipeline/serp-backed-sections.ts:482-493`):
  ```
  { platform: "ChatGPT / Perplexity",
    result: "Live AI citation checks are not automated in v1; improve entity clarity on site and GBP.",
    severity: "medium" }
  ```
  This literal disclaimer ships in every generated report today.
- "AISO/AEO/GEO" terminology appears only in product-brief prose (`docs/project-brief.md:468,655,793`) as aspirational framing — no corresponding signal-collection module exists. `lib/llm/` contains only the OpenAI JSON-synthesis client; there is no ChatGPT/Perplexity client anywhere in the codebase.
- **Meanwhile, `/free` markets this as a real capability**: *"Whether you appear in AI search — ChatGPT, Perplexity, and Google AI Overview responses to questions your business should be answering"* (`lpd-redesign/app/free/page.tsx:24-25`).

**Implication for PRD:** the gap between marketing promise and shipped capability is not a bug to fix incrementally — it's a net-new feature (live ChatGPT/Perplexity querying) that needs its own build, cost, and caching plan (see §8) before the marketing claim is true.

---

## 7. Business Category Taxonomy

**Confidence: confirmed.**

There is no internal taxonomy — fixed or LLM-derived — anywhere in the codebase.

- The "Business category" row shown in the competitive-context grid is a direct passthrough of Google's own Maps/GBP listing category: `yourCategory = bundle.digitalPresence.gbp.category ?? "—"` (`lib/pipeline/serp-backed-sections.ts:357`), sourced from `category: place.type ?? null` in the SerpAPI Maps mapper (`lib/research/serp/providers/serpapi.ts:179`, mirrored in `searchapi.ts` and `dataforseo.ts`). Whatever category string the business's GBP listing happens to carry is what appears — this codebase neither validates nor re-classifies it.
- Separately, the observed "General business services" text is **not a category classification at all** — it's a hardcoded placeholder for the free-text `primaryService` intake field used when a free-snapshot lead doesn't supply one: `primaryService: "General business services"` (`lib/intake/free-snapshot-schema.ts:62`), later flagged as a sentinel to clear on upgrade (`lib/intake/upgrade-prefill.ts`, `PLACEHOLDER_SENTINELS`). The intake schema's `primaryService` field is `z.string()` free text (`lib/intake/schema.ts:50`), not an enum — the schema does have fixed enums elsewhere (`geoMarketOptions`, `ninetyDayGoalOptions`, etc.) but none for business category/vertical.
- No LLM classification step exists; no `supabase/migrations/` table encodes a category/industry list.

**Implication for PRD:** if a rebuilt product wants consistent, comparable categorization (for competitive benchmarking, cross-report analytics, or vertical-specific copy), that taxonomy has to be designed and built from zero — today's "category" is either Google's free-text GBP field or a literal placeholder string.

---

## 8. External Call Cost/Timing Profile

**Confidence: confirmed** (numbers below reflect a cold cache; see caveats).

**Free-tier pipeline** (`FREE_TIER_OPERATION_IDS`, `lib/pipeline/constants.ts:28-34`, orchestrated by `runReportPipeline`, `lib/pipeline/run-report-pipeline.ts`):

| Op | Calls | External service | Cached? |
|---|---|---|---|
| 1. Brand name search | 1 SERP query | SerpAPI/SearchAPI/DataForSEO chain (`router.ts`) | Yes — Supabase `levelstack_serp_cache`, keyed by `sha256(engine:normalized query)`, default 24h TTL (`lib/research/serp/cache.ts`, `serp/config.ts`) |
| 2. Primary domain fetch | 2-3 direct HTTP fetches to the buyer's own site (+ optional Firecrawl scrape; + crt.sh subdomain enumeration, 0-1 call) | Buyer's own domain / `crt.sh` | No |
| 3. Social media search | 2 SERP queries (LinkedIn, Facebook only — free tier restricted, `lib/research/social-search.ts:20-27`) | Same SERP chain | Yes, same cache |
| 4. About/footer fetch | 1-2 direct HTTP fetches | Buyer's own domain | No |
| 5. Directory & review search | 4 SERP queries (`"{biz} reviews"`, `site:yelp.com`, `site:bbb.org`, complaints) | Same SERP chain | Yes, same cache |
| Search-footprint synthesis | 0-1 OpenAI call (only if SERP data present and `OPENAI_API_KEY` set; else deterministic fallback) | `api.openai.com`, `gpt-4o-mini` | No |

**Total for one free-tier report, cold cache: ~12-14 live external calls** (7 SERP + 2-3 website fetches + 1-2 about/footer fetches + 0-1 crt.sh + 0-1 OpenAI), **not counting** post-generation delivery side effects (Resend email, GHL contact sync, Plunk tracking — 2-4 more HTTP calls, `lib/email/send-email.ts`, `lib/ghl/ghl-api.ts`, `lib/plunk/client.ts`).

**Not called at all on free tier**: PageSpeed Insights, Google Maps/GBP lookup, brand-mention search (op 6), competitor snapshots, and per-profile social HTTP checks — all gated behind `collectPaidEnrichment` (`lib/pipeline/collect-research.ts:143-212`, only invoked `if (reportTier !== "free_snapshot")`).

**Yelp/BBB/complaint checks are not platform API calls** — they're plain Google `site:yelp.com`/`site:bbb.org` search queries routed through the same generic SERP provider chain, sharing the same 24h cache. There is no dedicated Yelp or BBB API integration anywhere in the codebase.

**Caching pattern that matters for the AI-platform question**: only SERP/Maps calls go through `levelstack_serp_cache` (keyed by normalized query text + engine, TTL-based). PageSpeed and OpenAI calls have **no caching layer at all** — every report re-runs them live, even for the same business within minutes. If ChatGPT/Perplexity/AI-Overview queries are added, there's an existing pattern (hash-keyed Supabase table + TTL) to extend, but currently nothing caches LLM-style calls; only search-engine calls benefit from the infrastructure that already exists.

**Implication for PRD:** the existing SERP cache table is the natural place to add AI-platform query caching (same key scheme, same TTL knob) rather than building new infrastructure — but PageSpeed and OpenAI calls today are proof that "add a new external check" defaults to zero caching unless someone deliberately wires it into the existing cache layer.

---

## Additional findings outside the numbered scope

- **Two more "score" functions exist with the same 42/62/78 bucket shape** (`lib/pipeline/build-sections.ts:13-23` and `lib/pipeline/serp-backed-sections.ts:36-46`) — near-duplicate code, one of which (`build-sections.ts`) appears to be a legacy/placeholder path (`assembleReportJson`) still wired into the paid full-report flow (`run-report-pipeline.ts:226-238`) alongside the newer signals-based path. Worth clarifying in the PRD which of the two "assemble" pipelines (`build-sections.ts` vs `assemble-from-signals.ts`/`serp-backed-sections.ts`) is the one to keep — right now paid full reports and free snapshots run genuinely different code to build sections and scores, not just different data.
- **Tier-gated data silently reuses "not found" copy.** Because `emptyGbp.limitation` defaults to `"Not fetched yet."` and that string matches `isInternalLimitation`'s pattern, free-tier users see the exact same "No confirmed Google Business Profile listing found" message whether GBP was checked and is genuinely absent, or was never checked at all because they're on the free tier. This understates what upgrading actually buys and could misrepresent a business's real GBP status.
- **The Overall-score letter grade uses yet another threshold set** than the legacy `build-sections.ts` path: `letterGradeFromScore` (`lib/audit/types.ts:49-55`, A/B/C/D/F at 90/80/70/60) vs. the inline thresholds in `assembleReportJson` (`build-sections.ts:220-227`, B/C/D/F at 80/70/55) — another silent inconsistency between the two report-assembly paths.
- **`PAID_ONLY_SECTION_IDS` includes `action_plan`**, yet free reports do render an action plan (just capped to `thisWeek.slice(0, 4)`, no `thisMonth`/`thisQuarter`) — the constant is used only for the `lockedSectionCount` upsell counter, not as an actual gate, so it doesn't fully describe real behavior. Minor but worth flagging since the PRD may read this constant as authoritative.
- **No retry logic anywhere in the external-call layer** beyond provider failover on quota errors — a single non-quota failure (timeout, 500, malformed JSON) on any given SERP query, PageSpeed call, or OpenAI call is final for that report; there's no exponential backoff or single retry attempt.
