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

## P1 — First-view report access

### Problem

```40:42:app/reports/[reportId]/page.tsx
if (!user && !devPreview) {
  redirect(`/auth/sign-in?redirect=/reports/${reportId}`)
}
```

Magic-link email promises instant access; user hits sign-in wall if cookie expired.

### Fix options (pick A for v1)

**A (recommended):** Signed report token in magic-link URL

- Magic link: `/reports/{id}?token={hmac}` (short TTL, single-use or 24h)
- `resolveReportAccess` accepts valid token without `user`
- After view, prompt optional "Save to account" (existing email)

**B:** Supabase session from magic link sets persistent cookie (verify OTP flow sets session before redirect)

### Acceptance criteria

- [ ] User clicking email link sees report within 5s without typing password
- [ ] Token expires per `MAGIC_LINK_EXPIRY_LABEL` (24h)
- [ ] Report still requires auth for non-token access

### Files

| File | Change |
|------|--------|
| `app/reports/[reportId]/page.tsx` | Token-aware access |
| `lib/reports/get-report.ts` | `resolveReportAccess` token path |
| `lib/auth/magic-link-callback.ts` | Append token to redirect |
| `app/reports/[reportId]/print/page.tsx` | Same token rule |

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
- [ ] GHL merge field `top_competitor` populated from `previewCompetitor.domain` or grid column 2

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
