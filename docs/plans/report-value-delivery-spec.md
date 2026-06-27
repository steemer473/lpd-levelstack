# LevelStack: Report Value Delivery Spec

**Status:** Slice 1 (P0) shipped — 2026-06-25  
**Date:** 2026-06-25  
**Source:** gstack CEO review of production report `031e84ed-ae67-437d-8131-774e45655d27`  
**Planning mirror:** `lpd-planning/PRODUCT_ROADMAP.md` (LevelStack value delivery phase)

---

## Problem statement

LevelStack sells a $500-consultant diagnostic at $97. Production reports can under-deliver: generic action items, padded finding counts, intake-form echo in paid sections, and a **broken competitive grid** that compares the buyer to `google.com` instead of real competitors.

Separately, the report URL requires sign-in before first view, which burns the post-email conversion moment.

**Goal:** Make free and paid tiers feel like *more than the price* by increasing specificity, credibility, and ready-to-use output — not more prose.

---

## Evidence (production report `031e84ed…`)

| Signal | Observed |
|--------|----------|
| Tier | `full_report` (paid) |
| Business | Level Play Digital |
| Score | 68/100, grade D |
| Competitive grid column | `google.com` (platform, not competitor) |
| Action plan | Generic tasks ("Develop a customer feedback strategy") |
| Reputation | 3 separate findings for no reviews on Clutch / G2 / Capterra |
| Revenue funnel | Regurgitates intake ("no ad spend", "email list 0") |
| Auth | `/reports/{id}` redirects to sign-in without session |

---

## Value equation (design north star)

| Lever | Current | Target |
|-------|---------|--------|
| Dream outcome | "See what prospects see" | "Know exactly what to fix tonight" |
| Perceived likelihood | Undermined by google.com grid | Named competitor + verifiable SERP links |
| Time delay | Sign-in wall on first open | Instant view from magic link |
| Effort | Vague consultant tasks | Copy-paste deliverables (templates, rewrites) |

---

## Priority stack

| Priority | Theme | Est. effort | Ship gate |
|----------|-------|-------------|-----------|
| **P0** | Competitor grid trust fix | 0.5–1 day | No platform domains in grid; regression tests |
| **P0** | Executive summary completeness | 0.5 day | `criticalIssue` always populated in UI resolve path |
| **P1** | First-view access (magic link) | 1–2 days | Report opens without password on valid token |
| **P1** | Named competitor in paid grid | 1 day | ≥1 real competitor column on service search |
| **P1.7** | Directory/listicle filter + Tier A quality gate | 0.5 day | Shipped 2026-06-25 — directories never become grid columns |
| **P1.7.1** | Service-peer relevance gate + intake search keywords | 0.5 day | Shipped 2026-06-25 — off-vertical vendors dropped; grid agrees with prose |
| **P1** | Finding dedup (reputation) | 0.5 day | Clutch/G2/Capterra merged to one finding |
| **P2** | Action plan specificity | 2–3 days | Tasks include copy-paste artifacts |
| **P2** | SERP evidence links | 1 day | Findings link to search URL used |
| **P2** | Revenue funnel analysis | 2 days | Page-level CTA/trust audit, not intake echo |
| **P2** | Paid unlock moment | 1 day | Welcome banner + print CTA on `full_report` |
| **P3** | AI search visibility parity | 2–3 days | Production matches sample report AI cards |
| **P3** | Dollar framing in exec summary | 1 day | Click-share ranges on rank gaps |
| **P3** | Hub vs product tier alignment | 0.5 day | Pricing table matches `FREE_TIER_SECTION_IDS` |

---

## P0 — Competitor grid bug fix

### Root cause

`topCompetitorDomains()` in `lib/research/serp/router.ts` only excludes the **buyer hostname**. Service-search SERPs often rank `google.com`, `yelp.com`, `facebook.com`, etc. Those pass through into `bundle.competitiveContext.competitorDomains` and become competitive grid columns in `buildSectionsFromResearch()`.

`isExcludedSerpDomain()` in `lib/report/parse-serp-rows.ts` has the same limitation (buyer-only).

### Fix

1. **Add shared denylist** — new module `lib/research/serp/competitor-domains.ts`:

   ```ts
   /** Platforms, aggregators, and directories — never competitor columns. */
   export const NON_COMPETITOR_HOSTS: ReadonlySet<string>
   export function isNonCompetitorHost(host: string): boolean
   export function topCompetitorDomains(results, excludeHost, limit): string[]
   ```

   Denylist (minimum):

   - `google.com`, `google.co.*`, `maps.google.com`
   - `youtube.com`, `facebook.com`, `instagram.com`, `linkedin.com`, `twitter.com`, `x.com`
   - `yelp.com`, `bbb.org`, `trustpilot.com`, `glassdoor.com`
   - `wikipedia.org`, `amazon.com`, `apple.com`, `microsoft.com`
   - `reddit.com`, `quora.com`, `pinterest.com`, `tiktok.com`
   - `clutch.co`, `g2.com`, `capterra.com` (directory list pages, not named rivals)

2. **Move `topCompetitorDomains`** from `router.ts` into `competitor-domains.ts` (re-export from `lib/research/serp.ts` for backward compatibility).

3. **Apply filter in `collectPaidEnrichment`** (`lib/pipeline/collect-research.ts`) — already calls `topCompetitorDomains`; no call-site change after function fix.

4. **Safety net in grid builder** (`lib/pipeline/serp-backed-sections.ts`):

   - Filter `compDomains` through `isNonCompetitorHost` before building `competitiveGrid`.
   - If `compDomains.length === 0` after filter: **omit grid** (do not render You vs google.com).
   - Set finding value to honest fallback: `"No direct competitor domains on page 1 for this query — see search footprint for brand confusion signals."`

5. **Align preview competitor path** — extend `isExcludedSerpDomain` OR call `isNonCompetitorHost` in:
   - `parseSerpRowsFromDetail`
   - `resolvePreviewCompetitorForReport`
   - `extractUpgradeTeasers` / `extractPreviewCompetitor`

6. **Brand-confusion fallback** — when service SERP has no valid competitors, pull named domains from search_footprint findings (e.g. "Level Agency", "LevelPlay" mentioned in brand search) via existing `formatTopResults` detail parsing.

### Tests (required before merge)

| File | Case |
|------|------|
| `lib/research/serp.test.ts` | SERP with google.com #1 + real competitor #2 → only real competitor returned |
| `lib/research/serp.test.ts` | SERP with only platforms → empty array |
| `lib/pipeline/serp-backed-sections.test.ts` (new or extend) | `competitiveGrid` undefined when no valid competitors |
| `lib/report/parse-serp-rows.test.ts` | `google.com` excluded from preview competitor |

### Acceptance criteria

- [x] Report `031e84ed…` regenerated: competitive grid has **no** `google.com` column *(after regen)*
- [x] If no valid competitors: grid hidden, honest copy shown
- [x] Free-tier `previewCompetitor` never uses platform domains
- [x] Existing passing SERP tests updated, not deleted

### Files touched

| File | Change |
|------|--------|
| `lib/research/serp/competitor-domains.ts` | **New** — denylist + `topCompetitorDomains` |
| `lib/research/serp/router.ts` | Remove or delegate `topCompetitorDomains` |
| `lib/research/serp.ts` | Re-export |
| `lib/report/parse-serp-rows.ts` | Use `isNonCompetitorHost` in row parsing |
| `lib/pipeline/serp-backed-sections.ts` | Filter + empty-grid fallback |
| `lib/research/serp.test.ts` | Platform exclusion cases |

---

## P0 — Executive summary completeness

### Problem

`ExecutiveSummaryConversion` reads `content.highlights.criticalIssue` via `resolveExecutiveContent()`. Some reports have empty or missing critical issue text, leaving the pull-quote blank.

### Fix

1. In `resolveExecutiveContent()` (`lib/report/executive-summary-resolve.ts`): if `criticalIssue` is empty after resolve, fallback to highest-severity finding value from sections.
2. In `computeDistinctHighlightsFromSections()` (`lib/report/executive-dedup.ts`): guarantee non-empty `criticalIssue` string.
3. Extend `quality-gate.ts`: fail or warn when `executiveSummary.criticalIssue` is missing or &lt; 20 chars.

### Acceptance criteria

- [ ] No report with status `ready` has empty critical issue in resolved exec content
- [ ] Quality gate test covers missing critical issue

---

## P1 — First-view report access — SHIPPED

### Problem

The report-ready email promised instant access, but two paths hit a sign-in wall:

1. **Supabase OTP magic links are single-use + 24h.** A second click (or any click
   after the OTP is consumed/expired) redirected to `/auth/sign-in`. The plaintext
   fallback URL in the email was the *same* magic link, so copy-paste also died
   after first use.
2. **Paid users got no link at all** — the full-report email pointed at a bare
   `/reports/{id}`, which `proxy.ts` blocks for anyone without a live session.

The real gate is `proxy.ts` (Edge middleware) guarding `/reports/:path*`, which
redirects unauthenticated requests to `/auth/sign-in` *before* the page renders.

### Shipped design — signed token + cookie exchange (revised from original Option A)

Independent, possession-based access tokens, decoupled from Supabase OTP. A
second-opinion review (gpt-5.5) flagged three gaps in the original "token on the
report URL" plan; the shipped design fixes all three:

1. **Token binds `reportId + tier + expiry`** (HMAC-SHA256, constant-time verify).
   Tier binding closes the upgrade hole: `upgradeFreeSnapshotToPaidIntake` reuses
   the same `reportId` row and flips `report_tier` free→full, so a stale free
   token must not unlock the upgraded paid report. `resolveReportAccess` rejects
   on tier mismatch.
2. **Access route `/reports/{id}/access?rtoken=…`** verifies the token (Node
   runtime), sets an HttpOnly+Secure+SameSite=Lax cookie, and **redirects to the
   clean URL** — keeping the token out of browser history, server logs, and the
   Referer header.
3. **The cookie covers report page, print page, and PDF download** with no extra
   plumbing (the print/PDF link never needed its own session).
4. **`proxy.ts` is token-aware**: it exempts the `/access` subroute and passes
   report/print pages through when the possession cookie is present (coarse gate;
   the page does the authoritative crypto + tier check, so forged cookies fail).
5. **Both tiers** get the token link in `sendReportReadyEmail` (button + plaintext).
6. **30-day TTL** (`REPORT_ACCESS_TOKEN_TTL_SECONDS`) — possession access to one's
   own report, not a login session.

Mutations (`/api/reports/{id}/run`, status, regeneration, intake) stay auth-only.
Status polling stays auth-only — report emails are only sent once the report is
`ready`, and the paid-upgrade pending page always has a logged-in user, so token
recipients land on a ready report.

### Acceptance criteria

- [x] User clicking the email link sees the report without typing a password,
      on any device, even after the Supabase OTP is consumed/expired
- [x] Works for both free-snapshot and paid (full-report) tiers
- [x] PDF/print works for token recipients (same cookie)
- [x] Token expires per `REPORT_ACCESS_TOKEN_TTL_SECONDS` (30 days)
- [x] Stale free token cannot unlock an upgraded paid report (tier binding)
- [x] Token kept off the destination URL (clean redirect)
- [x] Report still requires auth/token for any non-token access (proxy + page)
- [x] Fails closed when `LEVELSTACK_REPORT_TOKEN_SECRET` is unset

### Files

| File | Change |
|------|--------|
| `lib/auth/report-access-token.ts` | **New** — sign/verify (reportId+tier+expiry), cookie-name helper |
| `app/reports/[reportId]/access/route.ts` | **New** — verify token, set cookie, clean redirect (`?to=print` supported) |
| `proxy.ts` | Token-aware: exempt `/access`, pass report/print pages with cookie present |
| `lib/reports/get-report.ts` | `resolveReportAccess(reportId, userId, token?)` — admin path with tier check |
| `app/reports/[reportId]/page.tsx` | Read access cookie; serve token recipients; redirect only when no report+no user+no token |
| `app/reports/[reportId]/print/page.tsx` | Same cookie-based access |
| `lib/auth/generate-report-magic-link.ts` | `generateReportAccessUrl` / `generateReportAccessPrintUrl` |
| `lib/auth/magic-link-callback.ts` | `buildReportAccessPath` |
| `lib/email/report-delivery.ts` | `accessUrl` / `accessPrintUrl` on both tiers |
| `lib/pipeline/run-report-pipeline.ts` | Mint token + access URLs for both tiers |
| `env.mjs` | `LEVELSTACK_REPORT_TOKEN_SECRET` (required in production) |

### Notes / follow-ups

- Revocation is by secret rotation only (acceptable for a low-volume $97 product).
  A DB-backed token table (per-link revoke + audit) is the upgrade if needed.
- Optional "Save to account" prompt for token-only viewers — not built (P2).
- Set `Referrer-Policy: no-referrer` on report/print pages as defense-in-depth (P2;
  token is already off the URL).

---

## P1 — Named competitor in paid section

### Problem

COPY_BANK §5: named competitor is the conversion trigger. Paid competitive section still outputs generic prose when grid fails.

### Fix

1. After P0 denylist fix, ensure service-search query uses `serviceMarketQuery(intake)` (already does).
2. Competitive finding **value** must include `#1 {domain}` — not "presence of established competitors".
3. If intake adds `topCompetitor` field later, use as forced column when SERP thin.

### Acceptance criteria

- [ ] Paid report competitive finding names at least one domain or states why none found
- [x] GHL merge field `top_competitor` populated from `previewCompetitor.domain` or grid column 2 — **shipped** via `syncReportCompleteEnrichment` (2026-06-26); nurture Emails 2–5 still require GHL workflow — [ghl-nurture-workflow.md](../operations/ghl-nurture-workflow.md)

---

## P1.5 — Competitive fallback ladder (shipped 2026-06-25)

### Problem

After P0 denylist fix, many paid reports (especially national/SaaS buyers) have **zero** valid service-SERP peer domains. The competitive tab fell back to generic LLM cards with no positions, URLs, or side-by-side table — under-delivering vs COPY_BANK §5.

### Fix

1. **`resolveCompetitorColumns()`** in `lib/research/serp/competitor-resolve.ts` — fallback ladder:
   - Tier A: service-search peer domains (existing)
   - Tier B: namesake / brand-confusion domains from brand-name search
   - Tier C: category-peer organic search (`categoryPeerQuery` from GBP category + market)
   - Tier D: optional intake `topCompetitorUrl`
   - Tier E: SERP evidence table with `[directory/platform]` tags when no grid
2. **`collectPaidEnrichment()`** runs category-peer search when service peers are empty.
3. **`buildSectionsFromResearch()`** — comparison-type row, business category row, `columnSources` + `comparisonMode` on grid; section label "Category & namesake comparison" when not service-peer mode.
4. **`normalize-llm-synthesis.ts`** — pin baseline competitive finding #1; block vague LLM labels ("Competitor Landscape").
5. Optional intake field: `topCompetitorUrl` on `levelstackIntakeSchema`.

### Acceptance criteria

- [x] Paid report with zero service domains still shows **named entity** OR **labeled category/namesake grid**
- [x] No competitive finding without `detail` containing URLs or positions (primary finding + evidence table)
- [x] LPD dogfood scenario (`competitive-lpd-dogfood.test.ts`): namesake grid with `levelagency.com`, no google.com column
- [x] LLM cannot remove baseline `competitiveGrid` or primary SERP finding

### Files

| File | Change |
|------|--------|
| `lib/research/serp/competitor-resolve.ts` | Ladder + evidence formatter |
| `lib/pipeline/collect-research.ts` | Category search + column resolution |
| `lib/pipeline/serp-backed-sections.ts` | Grid rows, evidence findings |
| `lib/pipeline/normalize-llm-synthesis.ts` | Preserve competitive evidence |
| `lib/pipeline/synthesis-prompts.ts` | Forbid vague competitive labels |
| `lib/intake/schema.ts` | Optional `topCompetitorUrl` |

---

## P1.6 — Namesake quality pass (shipped 2026-06-25)

### Problem

P1.5 fallback shipped but the namesake grid named the wrong entities. gstack regen review of `031e84ed…` found:

- Buyer's own alt domain `levelplaydigital.cloud` shown as a competitor (root squat)
- Unrelated product `Unity LevelPlay` and generic `levelplay` ranked over real rivals
- Real confusion brands (Level Agency, Level Workforce) appeared in LLM prose but not the grid
- Review row junk: "Read Customer Service Reviews of truepla", "Unity Reviews 451"
- Verbose `primaryService` ("SAAS and stand alone products, operational efficiency products") produced low-signal service queries

### Fix

1. **Namesake scoring** (`resolveNamesakeColumns` in `lib/research/serp/competitor-resolve.ts`):
   - Brand-token overlap scoring (`brandSignificantTokens`, length >= 4, drops generic descriptors); zero-overlap candidates excluded.
   - `isBuyerRootSquat()` removes same-root / different-TLD buyer domains.
   - Prefer detected `nameCollisions` (typed `direct_competitor` weighted highest) over raw brand-search order.
2. **Wire name collisions** — `collectPaidEnrichment()` passes `bundle.nameCollisions.collisions` into `resolveCompetitorColumns()`.
3. **Snapshot guardrails** (`reviewHitMatchesDomain` in `lib/research/competitor.ts`) — review rating/snippet kept only when the hit text references the competitor's brand root; otherwise cell is `—` with an honest limitation.
4. **Service query normalization** (`normalizeServiceQuery` in `lib/pipeline/research-queries.ts`) — first clause, capped at 6 words; used by `serviceMarketQuery` and `categoryPeerQuery`.

### Acceptance criteria

- [x] Buyer root squats never appear as competitor columns (`competitor-resolve.test.ts`, dogfood test)
- [x] Typed `direct_competitor` collisions surface ahead of raw brand-search hits
- [x] Zero brand-token-overlap domains excluded from namesake grid
- [x] Unrelated review pages do not populate review cells (`competitor.test.ts`)
- [x] Verbose `primaryService` reduced to a searchable phrase (`research-queries.test.ts`)
- [ ] LPD production regen: grid names Level Agency / Level Workforce, no `.cloud` squat, clean review row

### Files

| File | Change |
|------|--------|
| `lib/research/serp/competitor-resolve.ts` | Namesake scoring, squat exclusion, collision merge |
| `lib/pipeline/collect-research.ts` | Pass name collisions into resolver |
| `lib/research/competitor.ts` | Review snapshot domain-match guard |
| `lib/pipeline/research-queries.ts` | `normalizeServiceQuery` |

---

## P1.7 — Directory / listicle filter + Tier A quality gate (shipped 2026-06-25)

### Problem

P1.6 regen of `031e84ed…` shifted the failure rather than fixing the experience. The normalized service query returned a page 1 that was **entirely software directories and "best-of" listicles** (`gregslist.com`, `f6s.com`, `getlatka.com`, `solidfuture.com`). None are in the host denylist, so Tier A (`service_peer`) fired and the grid compared the buyer to three directory pages — confidently labeled **Service peer** with `#1/#2/#3` rankings. The namesake ladder (P1.6) never ran for the grid, so the grid (directories) and the prose (Unity LevelPlay, Level Agency) disagreed.

Secondary leaks: snapshot homepage titles showed bot walls ("Checking your browser" from Cloudflare) and a review cell showed an unrelated entity ("Solid Future HR Consulting | Kathmandu").

### Fix

1. **Directory/aggregator host denylist** — extend `NON_COMPETITOR_HOSTS` in `lib/research/serp/competitor-domains.ts` with software/startup directories and "best-of" aggregators (`gregslist.com`, `f6s.com`, `getlatka.com`, `builtin.com`, `crunchbase.com`, `goodfirms.co`, `designrush.com`, `producthunt.com`, `softwareadvice.com`, `trustradius.com`, `indeed.com`, `thumbtack.com`, etc.). Applies everywhere (Tier A/category/intake/namesake) since all paths route through `isCompetitorCandidate`.
2. **Listicle title heuristic** — `isDirectoryListingTitle()` flags list-page titles ("72 top SaaS companies…", "…Companies in Atlanta, GA", "Best agencies near you", "Top 10…") so a non-denylisted host serving a list page is rejected as a peer.
3. **Bot interstitial heuristic** — `isBotInterstitialTitle()` flags "Checking your browser", "Just a moment", captchas, "Access denied".
4. **Tier A quality gate** — `isQualifiedPeerResult()` / `qualifiedPeerDomains()` combine host-candidate + not-listicle + not-interstitial. `resolveCompetitorColumns()` Tier A and category now use `qualifiedPeerDomains`; when zero qualify it **falls through** to namesake/category/intake instead of showing directories.
5. **Category gate parity** — `collectPaidEnrichment()` decides whether to run the category-peer search using `qualifiedPeerDomains` (fires when page 1 is all aggregators, not only when empty).
6. **Snapshot hygiene** — `cleanCompetitorHomepageTitle()` in `lib/research/competitor.ts` nulls interstitial/listicle homepage titles so the grid shows `—`.
7. **Evidence honesty** — `formatSerpEvidenceTable()` tags listicle-by-title rows with `[directory/platform]`, not just denylisted hosts.

### Acceptance criteria

- [x] Page 1 of all directories/listicles yields **zero** service peers → ladder falls to namesake (`competitor-resolve.test.ts`, `competitor-domains.test.ts`)
- [x] Directory hosts (`gregslist.com`, `f6s.com`, `getlatka.com`, `builtin.com`, `crunchbase.com`) treated as non-competitors
- [x] Listicle titles never become grid columns; bot-wall homepage titles suppressed (`competitor.test.ts`)
- [x] Grid and prose name the same entities for thin-SERP buyers
- [ ] LPD production regen: grid shows Level Agency / Level Workforce (namesake), no directory columns, no "Checking your browser"

### Files

| File | Change |
|------|--------|
| `lib/research/serp/competitor-domains.ts` | Directory hosts, listicle/interstitial heuristics, `qualifiedPeerDomains` |
| `lib/research/serp/competitor-resolve.ts` | Tier A + category use quality gate; evidence tagging |
| `lib/pipeline/collect-research.ts` | Category fallback gated on qualified peers |
| `lib/research/competitor.ts` | `cleanCompetitorHomepageTitle` snapshot hygiene |
| `lib/research/serp.ts` | Re-export new helpers |

---

## P1.7.1 — Service-peer relevance gate + intake search keywords (shipped 2026-06-25)

### Problem

The P1.7 regen of `031e84ed…` confirmed directories were gone, but the grid then promoted **off-vertical SaaS-dev / IT vendor SEO-landing pages** (`centurygroup.net`, `ideapeel.com`, `charterglobal.com`) as "Service peers" — because they are real (non-directory) hosts that rank for the vague query "SAAS and stand alone products Atlanta, GA". The grid still contradicted the prose (which named Unity LevelPlay / Level Agency). Root causes: (a) ambiguous intake `primaryService`, (b) no relevance check on service peers.

### Fix

1. **Service-peer relevance gate** (`relevantServicePeerColumns`, `buyerRelevanceTokens` in `competitor-resolve.ts`): keep a service peer only when its SERP title/snippet/host matches a token from the buyer's **GBP category** (Google's authoritative classification). With no category the gate is disabled (host/title gates still apply). We deliberately do **not** filter on the buyer's own service phrase — a real competitor rarely echoes your wording, so that would prune legit peers.
2. **Broadened SEO-landing title heuristics** (`isDirectoryListingTitle`): `… services in/near …`, `development|consulting|engineering|outsourcing services`. Trailing-geo patterns were intentionally excluded (would wrongly drop "Bob's Plumbing in Dallas").
3. **Intake search keywords** (`primaryServiceKeywords`): optional concise field ("2–5 words a prospect would Google") on the intake form + schema. `serviceSearchTerm()` prefers it over the verbose `primaryService` for the service/category SERP. Addresses the query-quality root cause for future intakes.
4. **Gating parity**: `collectPaidEnrichment` runs the category-peer fallback when no *relevant* peer exists (not just when none qualify), and passes `gbp.category` into `resolveCompetitorColumns`.

### Result (regen `031e84ed…`, 2026-06-25 04:46)

- Off-vertical vendors removed; grid mode = `namesake`, label "Category & namesake comparison".
- **Grid and prose agree** (both lead with Unity LevelPlay).
- **Residual (tracked separately):** namesake *selection* favors full brand-string matches (Unity LevelPlay, a sports-streaming "LevelPlay") over the locally-relevant Level Agency / Level Workforce, because brand-token scoring rewards matching both "level"+"play"; collision typing did not elevate the local rivals this run. Review row still leaks "Unity Reviews 451". This is a P1.6 namesake-quality refinement, not a P1.7 directory issue.

### Acceptance criteria

- [x] Off-vertical service peers dropped when GBP category known (`competitor-resolve.test.ts`)
- [x] Relevance gate disabled (no pruning) when no category — existing service-peer tests still pass
- [x] SEO service-landing titles flagged; local "… in <City>" business titles not flagged (`competitor-domains.test.ts`)
- [x] `serviceSearchTerm` prefers `primaryServiceKeywords` (`research-queries.test.ts`)
- [x] Regen: grid and prose name the same entity; no directory/vendor columns
- [x] Namesake entity quality (local rivals over Unity sports/levelplay) — **resolved by P1.8** (category peers now outrank namesakes)

### Files

| File | Change |
|------|--------|
| `lib/research/serp/competitor-resolve.ts` | Relevance gate, `buyerRelevanceTokens`, `relevantServicePeerColumns`, category in resolver |
| `lib/research/serp/competitor-domains.ts` | Broadened SEO-landing title patterns |
| `lib/pipeline/research-queries.ts` | `serviceSearchTerm` (keywords-first) |
| `lib/intake/schema.ts` | Optional `primaryServiceKeywords` |
| `components/intake/levelstack-intake-form.tsx` | Keywords field + guidance |
| `lib/pipeline/collect-research.ts` | Relevance-gated category fallback; pass category |

---

## P1.8 — Local rivals outrank namesakes (ICP value ordering) (shipped 2026-06-25)

### Problem

After P1.7.1 the grid and prose agreed, but the **fallback ladder put brand-string namesakes above local category rivals**: `service_peer → namesake → category_peer → intake`. For the LPD dogfood that meant the grid led with Unity LevelPlay (a sports-streaming / ad-mediation name-twin) instead of real Atlanta marketing agencies — and the review row leaked "Unity Reviews 451".

This is backwards for LevelStack's ICP. Per `lpd-planning/FUNNELS_AND_MARKETING.md` §1–2, the buyers are **local service businesses** (real estate, HVAC, legal, dental, medical spa) and the funnel's core conversion trigger is **"a real competitor ranking above you"** — surfaced in the free snapshot, nurture Email 3 ("Who's ranking above you right now"), and the GHL `top_competitor` merge field. A locally-relevant category peer is far more valuable and conversion-driving than a name-twin in an unrelated vertical. The "Unity LevelPlay is ranking above you" example in `COPY_BANK.md` §5 was an artifact of this very bug, not a design choice.

### Fix

1. **Reorder the ladder** in `resolveCompetitorColumns` (`competitor-resolve.ts`): `service_peer → category_peer → namesake → intake → evidence`. A real local rival now wins the grid; namesake / brand-confusion drops to the next tier and still surfaces in the LLM prose supplementals.
2. No collection change needed — `collectPaidEnrichment` already fetches the category-peer search whenever no *relevant* service peer exists (P1.7.1), so the local-rival tier is available exactly when it is needed.

### Decision: why category over namesake (not a relevance heuristic on namesakes)

Forcing "local relevance" into the *pure-namesake* fallback was considered and rejected: in that branch there is, by definition, no category/market signal to score against, so any heuristic would be low-signal and prone to misfire (dropping a legitimate same-name direct competitor). The principled fix is ordering: prefer the tier that *is* locally relevant (category peers) over the tier that is about name collision.

### Result (regen `031e84ed…`, 2026-06-25 ~11:10)

- Grid mode = `category_peer`. Columns are real Atlanta agencies: **Modo Modo Agency** (modomodoagency.com), **Brown Bag Marketing**, **Nebo**.
- Finding value: *"No direct service-search peers on page 1 — comparing to Modo Modo Agency - Atlanta (modomodoagency.com) via category peer."*
- Namesakes (Level Agency, Level Workforce) moved to the prose supplemental "Competitor Search Results" as brand-confusion context.
- "Unity Reviews 451" leak gone; review row shows real Atlanta agency snippets.

### Acceptance criteria

- [x] When service peers are thin but a local category peer exists, grid = `category_peer` and excludes namesakes (`competitor-resolve.test.ts`)
- [x] Namesake remains the fallback only when no category peer qualifies (`competitor-resolve.test.ts`)
- [x] Regen: LPD grid shows local agencies, not Unity LevelPlay; review row clean
- [x] Full unit suite + type-check pass

### Follow-up shipped as P1.8.1

See section below.

### Files

| File | Change |
|------|--------|
| `lib/research/serp/competitor-resolve.ts` | Reorder ladder: category peer before namesake |
| `lib/research/serp/competitor-resolve.test.ts` | Tests encoding category-over-namesake + namesake-only fallback |

---

## P1.8.1 — Align conversion trigger to resolved local rival (shipped 2026-06-25)

### Problem

After P1.8, the competitive grid correctly names local rivals (e.g., Modo Modo Agency for LPD). But `meta.upgradeTeasers.previewCompetitor` — which drives the executive summary tease and the planned GHL `top_competitor` email merge field — was still derived from raw brand-search SERP #1 at display time (`resolvePreviewCompetitorForReport`). The two could diverge: grid says "Modo Modo Agency," tease says a brand-name twin.

### Architecture finding

`previewCompetitor` is stored on free snapshots only (competitive analysis is paid). For paid full reports, `meta.upgradeTeasers` was `undefined` and `resolvePreviewCompetitorForReport` fell back to brand SERP parse. The real fix needed to be in the paid-report assembly path (`run-report-pipeline.ts`), not the free-report assembly function.

### Fix

Two complementary changes:

1. **`lib/pipeline/run-report-pipeline.ts`** — after the paid full report is assembled and before schema validation, set `meta.upgradeTeasers.previewCompetitor` from `bundle.competitiveContext.competitorColumns[0]` (the P1.8-ordered local rival). Rank defaults to 1 (top result on the relevant category/service SERP).

2. **`lib/pipeline/assemble-free-report.ts`** — in `extractUpgradeTeasers`, check `bundle.competitiveContext.competitorColumns[0]` before falling back to raw SERP parse. Future-proofing: if competitive analysis is ever included in free-tier bundles, the right rival is automatically used.

### Result (regen `031e84ed…`, 2026-06-25 ~16:35)

```json
"upgradeTeasers": {
  "previewCompetitor": {
    "rank": 1,
    "title": "Modo Modo Agency - Atlanta",
    "domain": "modomodoagency.com"
  }
}
```

The executive summary tease, teaser copy builder, and GHL `top_competitor` field all name the same rival as the grid. Report-complete sync (`syncReportCompleteEnrichment`) writes the field on pipeline finish; nurture workflow build: [ghl-nurture-workflow.md](../operations/ghl-nurture-workflow.md).

### Acceptance criteria

- [x] `meta.upgradeTeasers.previewCompetitor.domain` matches grid column 0 domain on paid full report
- [x] `extractUpgradeTeasers` uses resolved columns when available, raw SERP fallback when empty (4 new unit tests)
- [x] Full suite (231 tests) + type-check pass; .gitignore updated to exclude `.env.local.bak` / `.env.vercel.production`

### Files

| File | Change |
|------|--------|
| `lib/pipeline/run-report-pipeline.ts` | Set `upgradeTeasers.previewCompetitor` from resolved column on paid reports |
| `lib/pipeline/assemble-free-report.ts` | `extractUpgradeTeasers` checks resolved columns first |
| `lib/pipeline/assemble-free-report.test.ts` | 4 new tests for resolved-column and fallback paths |
| `.gitignore` | Add `.env.local.bak`, `.env.vercel.production` |

---

## P1 — Reputation finding dedup

### Problem

Three findings for Clutch / G2 / Capterra "no reviews" pad `totalFindings` without new insight.

### Fix

In `buildReputationFindings()` (`lib/pipeline/serp-backed-sections.ts`):

- Merge directory review searches into one finding: **"B2B review presence"** with sub-bullets per platform.
- Count as 1 finding in meta totals.

### Acceptance criteria

- [ ] Max 1 finding for "no listing on review directories" cluster
- [ ] Detail still lists each platform checked

---

## P2 — Action plan copy-paste deliverables

### Problem

Tasks like "Develop a customer feedback strategy" are ChatGPT-generic; not worth $97.

### Fix

Extend LLM synthesis prompt (`lib/pipeline/synthesis-prompts.ts`) and/or post-processor to attach **artifacts** per action item:

| Artifact type | Example |
|---------------|---------|
| `emailTemplate` | Review request email with `{businessName}` |
| `copyRewrite` | Meta description before/after |
| `replyDraft` | Response to negative review pattern |
| `checklist` | 5-step GBP claim verification |

Add optional `artifact` field to `actionItemSchema` in `report-types.ts`. Render in `ActionPlanPanel` as expandable "Copy this" block.

### Acceptance criteria

- [ ] ≥2 of 6 action items include a copy-paste artifact on paid reports
- [ ] Artifacts use business name from intake (quality-gate checked)

---

## P2 — SERP evidence links

### Fix

- Store `searchUrl` on research bundle per query.
- Append to finding detail: `View search results →` linking to Google search URL (or cached SERP snapshot).

### Files

`lib/pipeline/research-types.ts`, `finding-card.tsx` or `FindingDetailContent`

---

## P2 — Revenue funnel: research not intake echo

### Problem

Paid funnel section surfaces intake answers ("no ad spend", "email list 0") as findings.

### Fix

1. Move intake-only signals to exec summary context, not standalone findings.
2. Funnel findings must come from **page analysis**: CTA presence, offer clarity, PageSpeed, form friction.
3. `funnelFindings` in `serp-backed-sections.ts` already has CTA/PageSpeed logic — ensure LLM synthesis does not replace with intake regurgitation.

### Acceptance criteria

- [ ] Revenue funnel section has ≥1 finding from live page signals when `hasActiveAdSpend === "no"`
- [ ] No finding whose value is only the raw intake field

---

## P2 — Paid unlock UX moment

### Fix

When `meta.reportTier === "full_report"`:

- Show banner: "Full report unlocked — 6 sections + PDF"
- Prominent print/download button (not only upgrade CTA)
- Hide `UpgradeBanner` (already does); add `PaidReportWelcome` component

### Files

`components/report/paid-report-welcome.tsx`, `levelstack-report-view.tsx`

---

## P3 — Backlog (post-validation)

| Item | Notes |
|------|-------|
| AI search visibility cards | Match `public/levelstack-sample-report.html`; wire `aiPreview` on all tiers where data exists |
| Dollar framing | "Position #4 ≈ X% click share" in exec summary |
| Hub pricing alignment | `levelstackPlans.ts` says free excludes reputation; product includes `online_reputation` in free — align one source of truth |
| Post-purchase GHL sequence | Separate spec |

---

## Implementation order (sprint slices)

### Slice 1 — Trust (ship first)

1. P0 competitor grid fix + tests
2. P0 executive summary fallback
3. Regenerate dogfood report `031e84ed…` and QA in browser

### Slice 2 — Access + density

4. P1 magic-link first view
5. P1 reputation dedup
6. P1 named competitor copy in paid findings

### Slice 3 — $97 feels like $300

7. P2 action plan artifacts
8. P2 SERP evidence links
9. P2 revenue funnel rewrite
10. P2 paid welcome banner + print CTA

---

## QA checklist

- [ ] Free snapshot: competitor tease shows real domain (not google.com)
- [ ] Paid report: competitive grid ≥1 real competitor or honest empty state
- [ ] Magic link → report visible without sign-in
- [ ] Executive summary pull-quote never blank
- [ ] Print view works for paid tier
- [ ] `pnpm test` + `pnpm build` pass in `lpd-levelstack`

---

## Related docs

| Doc | Link |
|-----|------|
| Upgrade unlock plan | `docs/plans/upgrade-unlock-and-paid-report.md` |
| COPY_BANK competitor guidance | `lpd-planning/COPY_BANK.md` §5 |
| Free snapshot workflow | `docs/free-snapshot-workflow.md` |
| Funnel architecture | `lpd-planning/FUNNELS_AND_MARKETING.md` |
