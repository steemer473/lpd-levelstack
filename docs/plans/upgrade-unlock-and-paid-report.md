# LevelStack: Upgrade Unlock Flows + Paid Report

**Status:** Draft plan (gstack)  
**Branch:** `main` @ PR #29 merged  
**Date:** 2026-06-23  
**Author:** Auto-plan from codebase + PRD v2  
**Related:** [report-value-delivery-spec.md](./report-value-delivery-spec.md) — P0 competitor grid fix, paid deliverable quality, first-view access (2026-06-25)

---

## Premises (confirm before build)

| # | Premise | Confidence | Challenge if wrong |
|---|---------|------------|-------------------|
| P1 | Checkout stays **hub-owned** (Stripe on `lpd-redesign`); product app never takes payment | High | Would need PCI scope + webhook duplication |
| P2 | Free → paid upgrade **reuses the same report row** via `upgradeFreeSnapshotToPaidIntake` | High | Already implemented; don't fork a second report |
| P3 | Primary conversion path is **free snapshot first**, then $97 full report | High | PRD v2 + `docs/hub-prd-v2-migration.md` |
| P4 | Paid report = **6 sections + exec dashboard + full PDF**, not a separate product surface | High | `project-brief.md` §10.3 |
| P5 | Hub and product must deploy **entitlement alignment** (`levelstack-full-report` in `orders`) | Medium | Blocker if hub still sells legacy SKUs only |

---

## What already exists

### Upgrade / unlock (product)

| Piece | Location | State |
|-------|----------|-------|
| Free tier sections (3) | `FREE_TIER_SECTION_IDS` | Done |
| Locked tabs + panels | `useReportTabs`, `LockedSectionPanel` | Done — generic copy, hub link |
| Exec conversion layout | `ExecutiveSummaryConversion` | Done — teasers, blur overlays |
| Upgrade banner | `UpgradeBanner` + `buildUpgradeTeaserCopy` | Done — contextual competitor copy |
| Blur unlock CTAs | `UpsellBlurOverlay` | Done — all link to hub `#pricing` |
| Free → paid pipeline | `upgradeFreeSnapshotToPaidIntake` | Done — requeues job on same `reportId` |
| Paid intake gate | `requirePaidIntakeAccess`, `/intake` upgrade path | Done |
| Entitlement | `orders` + `levelstack_free_entitlements` | Done |
| Upgrade emails | `report-delivery.ts` | Partial — links hub, not report-scoped |

### Paid report (product)

| Piece | Location | State |
|-------|----------|-------|
| Full research ops (6) | `FULL_TIER_OPERATION_IDS` | Done |
| SERP-backed sections | `buildSectionsFromResearch` | Done — all 6 sections |
| LLM synthesis | `synthesizeReportSections` | Done — with quality gate + fallback |
| Paid exec UI | `ExecutiveSummaryDashboard` | Done — strengths/opportunities unblurred |
| Paid print | `ReportPrintViewFull` | Partial — basic layout, not Figma parity |
| Finding card polish | `finding-context.ts`, CSS | Done for sections — verify paid paths |
| Competitive grid | `competitiveGrid` on section | Partial |

### Hub dependency (out of repo)

- Pricing page, Stripe checkout, `orders.plan_id` write
- Post-checkout CTA → product `/intake` (not `/reports/{id}`)
- See `docs/hub-prd-v2-migration.md`

---

## Dream state (12-month ideal)

```
Free user lands snapshot → sees real findings + locked value previews
        ↓
Clicks Unlock → hub checkout with report context preserved
        ↓
Returns authenticated → intake pre-filled OR one-click "Generate full report"
        ↓
Same report URL unlocks 6 sections + PDF + exec dashboard
        ↓
GHL nurture for non-converters; no dead-end hub pricing tabs
```

---

## Priority A: Upgrade unlock flows

### Problem

Unlock CTAs are **generic outbound links**. The user leaves their report, buys on hub, then must discover `/intake` themselves. Locked sections show **static marketing copy**, not the **teaser data already computed** (`meta.upgradeTeasers`, competitive snapshot). There is no **return URL** or **post-purchase unlock UX** on the original report page.

### A1 — Contextual hub checkout URLs (product + hub)

**Product changes**

- Add `getHubUpgradeUrl({ reportId?, source? })` in `lib/urls.ts`:
  - Base: hub `/platform/levelstack#pricing` or dedicated `/checkout/levelstack-full-report`
  - Query: `?reportId={id}&source=levelstack_report` (hub must read and persist)
- Replace bare `getHubPricingUrl()` in unlock surfaces when `reportId` is available:
  - `UpsellBlurOverlay`, `LockedSectionPanel`, `UpgradeBanner`, `report-sidebar` (optional sticky CTA)
  - `ExecutiveSummaryConversion` competitive CTA
  - `report-print-view-free.tsx` footer
  - Free ready email (`report-delivery.ts`)

**Hub changes** (coordinate deploy)

- Checkout success redirect: `NEXT_PUBLIC_LEVELSTACK_APP_URL/intake?upgraded=1&reportId={id}`
- Or deep link: `/reports/{id}` with banner "Complete intake to unlock" if intake required

**Acceptance:** From report `abc123`, every Unlock button URL includes `reportId=abc123`.

### A2 — Locked section previews (product only)

Use data already built at pipeline time instead of generic `LockedSectionPanel` copy.

| Locked tab | Preview source | UI |
|------------|----------------|-----|
| Revenue funnel | `upgradeTeasers` + intake ad spend flags | 1–2 blurred finding headlines + "Unlock funnel diagnosis" |
| Competitive context | `resolveCompetitiveSnapshot(report)` | Show #1 competitor row (fixed), blur grid |
| Action plan | `actionPlan.thisWeek.length` from full assembly (store count only on free meta) | "N prioritized actions ready" teaser |

**Files:** `LockedSectionPanel` → `LockedSectionPreview` per `sectionId`; pass `report` not just id.

**Acceptance:** Competitive locked tab shows real competitor domain from SERP (excluding own domain per #29).

### A3 — Post-purchase unlock journey (product)

**Flow for free-snapshot buyer who purchases full report:**

1. Hub checkout completes → `orders` row with `levelstack-full-report`
2. User lands `/intake?from=upgrade&reportId={id}` (hub redirect)
3. Intake page: detect paid + existing free report → show **"Generate your full report"** (not full 40-field form if already captured)
4. Submit calls existing `upgradeFreeSnapshotToPaidIntake` path
5. Redirect to `/reports/{id}` progress → full tier JSON

**Files:**

- `app/intake/page.tsx` — upgrade mode UI
- `components/intake/` — slim confirmation form (confirm business, add paid-only fields if missing)
- `app/reports/[reportId]/page.tsx` — post-upgrade banner states
- Optional: `app/api/reports/[id]/upgrade-status` for polling entitlement without reload

**Acceptance:** E2E: free report → mock order → intake → same URL shows 6 unlocked tabs.

### A4 — In-report unlock states (product)

| State | User sees |
|-------|-----------|
| `free_snapshot` + locked tab | Preview panel + Unlock CTA |
| `pending` / `generating` after upgrade | Progress UI on all tabs; locked sections show "Generating…" |
| `full_report` | `ExecutiveSummaryDashboard`, all sections, full PDF |
| `failed` after upgrade | Recovery CTA + support |

**Files:** `LevelstackReportView`, report progress component, `useReportTabs` (disable lock icons when tier ≠ free).

### A5 — Email + GHL alignment (product ops)

- Free ready email: primary CTA = open report; secondary = unlock with `reportId` in URL
- Document GHL workflow tags: `levelstack_free_snapshot` → D1/D3 nurture with same deep link pattern
- Paid ready email: distinct template (no upgrade pitch)

**Out of app scope:** GHL sequence build; document in `docs/free-snapshot-workflow.md`.

### A — NOT in scope (defer)

- In-app Stripe / embedded checkout
- $297 strategy-call booking UI (separate epic)
- SEO Automator waitlist redesign
- Auto-upgrade without intake (paid tier needs funnel/competitive intake fields)

---

## Priority B: Paid report

### Problem

Paid pipeline **runs** and produces 6 sections, but the **buyer-facing experience** still lags the PRD/Figma spec: exec dashboard vs conversion layout is split, section modules (AI row, GBP bars, competitive grid, action plan table) are uneven, and **PDF ≠ web** for paid tier.

### B1 — Paid report UI parity with free polish

Apply recent free-tier improvements to **all** paid section renders:

- `FindingCard` context lines + severity explanations (`finding-context.ts`)
- `DataPanel` / `rpt-finding-card` styling
- `SectionPanel` score header hints
- Print: `FindingPrintBlock` in `ReportPrintViewFull`

**Files:** `report-shared.tsx` `SectionPanel`, `report-print-view.tsx`

**Acceptance:** Paid reputation finding shows context line + explained severity (same as free).

### B2 — Section modules per PRD §10.3.4

| Section | Missing / weak | Build |
|---------|----------------|-------|
| Search footprint | AI preview row | Surface `section.aiPreview` in `SectionPanel` (already on type) |
| Reputation | Profile grid | Add `reputationProfiles` or derive from findings |
| Digital presence | GBP + Lighthouse bars | Wire `section.scoreRows` + PageSpeed from bundle |
| Revenue funnel | Funnel readiness badge | Intake-driven badge + ad spend callout |
| Competitive context | Full grid | Ensure `competitiveGrid` renders in UI (not just JSON) |
| Action plan | Who / Time columns | Extend `ActionPlanPanel` table columns |

**Files:** `serp-backed-sections.ts` (data), `report-shared.tsx` (render), `display-helpers.ts`

### B3 — Paid executive summary

Free uses `ExecutiveSummaryConversion`; paid uses `ExecutiveSummaryDashboard`.

- Ensure paid exec includes: strengths, top opportunities, competitive snapshot (unblurred), section score grid, link to lowest section
- Reuse `resolveExecutiveContent` for both tiers where possible
- Paid should **not** show upgrade CTAs or `UpsellBlurOverlay`

**Files:** `executive-summary-dashboard.tsx`, `executive-summary-resolve.ts`

### B4 — Paid PDF (Figma / brief alignment)

`ReportPrintViewFull` exists but is minimal.

- Mirror web section order and finding cards
- Action plan as **formatted table** (Who, Time, Impact)
- Executive summary + section score grid
- Footer: LevelStack attribution, report date, no upgrade pitch
- Share `/reports/{id}/print` QA checklist

**Files:** `report-print-view.tsx`, `styles/report-final-design.css` (`@media print`)

### B5 — Paid pipeline quality

- Confirm `validateResearchQuality` gates paid tier stricter than free
- Confirm `brand_mention_search` op runs for paid (`FULL_TIER_OPERATION_IDS`)
- Upgrade path clears `report_json` and re-runs full synthesis (`upgradeFreeSnapshotToPaidIntake` already nulls JSON)
- Add integration test: paid assembly includes `revenue_funnel`, `competitive_context`, `action_plan`

**Files:** `run-report-pipeline.ts`, `assemble-free-report.test.ts` (mirror for paid)

### B6 — Sample / marketing paid report

- Internal sample with `Sample Report` badge per §10.3.9
- Dogfood: run paid pipeline for `levelplaydigital.com` in staging

### B — NOT in scope (defer)

- Rebuild entire report from Figma frame 4:4 pixel-perfect (iterate toward it)
- Review-call booking widget
- Multi-report per user
- Re-scoring algorithm overhaul (use existing audit bundle)

---

## Architecture (paid vs free)

```
                    ┌─────────────────────┐
                    │  runReportPipeline  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │ reportTier === free_snapshot?   │
              └────────────────┬────────────────┘
                    yes │              │ no
                        ▼              ▼
         assembleFreeReportFromResearch   synthesizeReportSections
         (3 sections + teasers)           (6 sections + LLM)
                        │              │
                        └──────┬───────┘
                               ▼
                    LevelstackReportView
                    tier → exec component
                    tier → lock flags
```

**Upgrade path:** Same `reportId`, tier flips `free_snapshot` → `full_report`, pipeline re-run, UI hot-swaps on refresh.

---

## Recommended build order

| Phase | Work | Depends on | CC est. | Human est. |
|-------|------|------------|---------|------------|
| **1** | A1 contextual URLs + hub query contract | Hub ticket | 30 min | 2–4 hr hub |
| **2** | A2 locked section previews | — | 45 min | — |
| **3** | A3 post-purchase intake upgrade UX | A1 hub redirect | 1.5 hr | 1 hr QA |
| **4** | B1 finding card parity on paid | — | 30 min | — |
| **5** | B2 section modules (incremental: competitive → funnel → digital) | — | 2–3 hr | design review |
| **6** | B3 paid exec dashboard pass | B2 partial | 45 min | — |
| **7** | B4 paid PDF parity | B1–B3 | 1.5 hr | print QA |
| **8** | A4 + A5 email/GHL docs | A1, A3 | 30 min | ops |

Ship **1→2→3** as "unlock flows" PR; **4→7** as "paid report" PR. Can overlap after phase 2.

---

## Test plan

### Upgrade unlock

- [ ] Free report: all Unlock CTAs include `reportId` when on `/reports/{id}`
- [ ] Locked competitive tab shows teaser competitor (not own domain)
- [ ] Dev: `LEVELSTACK_DEV_BYPASS_ENTITLEMENT` + mock order → intake upgrade → 6 tabs
- [ ] `upgradeFreeSnapshotToPaidIntake` reuses intake/report ids (unit test exists; add E2E)
- [ ] Generating state shows progress after upgrade submit

### Paid report

- [ ] Paid pipeline produces 6 sections (integration test)
- [ ] No `UpsellBlurOverlay` / `UpgradeBanner` on `full_report`
- [ ] AI preview row visible on search tab (paid)
- [ ] Competitive grid renders with You column
- [ ] Action plan table has Who + Time
- [ ] Print view matches web content for paid fixture
- [ ] `pnpm test:unit` + manual print PDF

---

## Hub coordination checklist

- [ ] `levelstack-full-report` ($97) live on hub pricing
- [ ] Checkout writes `orders.plan_id` product recognizes
- [ ] Success URL supports `reportId` passthrough
- [ ] Account page CTA: "Complete your LevelStack intake" with app URL
- [ ] Deploy hub + product same window (`docs/hub-prd-v2-migration.md`)

---

## Risk register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Hub not passing `reportId` | High | Phase 1 blocked on hub PR; product can ship previews without it |
| Intake friction kills conversion | High | Slim upgrade intake (confirm, don't re-ask everything) |
| Paid LLM synthesis fails | Medium | Existing fallback to `buildSectionsFromResearch` |
| PDF drift from web | Medium | Single `SectionPanel` data path into print components |
| User expects instant unlock at payment | Medium | Clear copy: "One more step — confirm details to generate" |

---

## GSTACK REVIEW REPORT

### CEO (scope)

- **Approve** dual priority: unlock conversion first (revenue), paid quality second (retention/refunds).
- **Defer** in-app payments, strategy-call booking, nurture automation in app.
- **User challenge surfaced:** Hub-owned checkout adds latency; alternative is Stripe embedded in product — **rejected** per P1 unless hub migration stalls.

### Design (UI scope: yes)

- Locked previews must feel like **almost-there**, not paywall walls — blur + real data.
- Post-upgrade progress should reuse existing pipeline progress UI (don't invent new spinner).
- Paid exec dashboard is the **hero** for $97; don't downgrade to conversion layout.

### Eng

- Reuse `upgradeTeasers`, `resolveCompetitiveSnapshot`, `buildUpgradeTeaserCopy` — no duplicate SERP parsing in UI.
- Add `getHubUpgradeUrl` single helper; grep-replace call sites.
- Hub query params: validate + strip unknown params (security).

### Cross-phase theme

**"Data exists; UX doesn't surface it"** — teasers, competitive snapshot, and full sections are largely built; this epic is mostly **wiring and polish**.

---

## Implementation tasks (backlog-ready)

### Epic 1: Upgrade unlock flows

- [ ] **P1** — `getHubUpgradeUrl({ reportId, source })` + replace CTA call sites
- [ ] **P1** — Hub: checkout success redirect with `reportId` (hub repo issue)
- [ ] **P1** — `LockedSectionPreview` components with real teaser data
- [ ] **P1** — Intake upgrade mode (`/intake?from=upgrade&reportId=`)
- [ ] **P2** — Report page generating/unlock banner states
- [ ] **P2** — Email templates with contextual unlock URLs
- [ ] **P3** — GHL nurture doc update

### Epic 2: Paid report

- [ ] **P1** — Finding context + card styling on paid `SectionPanel` + print
- [ ] **P1** — Competitive grid UI component wired to section data
- [ ] **P2** — AI preview row on search footprint (paid)
- [ ] **P2** — Action plan Who/Time columns
- [ ] **P2** — Digital presence score rows (GBP / PageSpeed)
- [ ] **P2** — Paid exec dashboard completeness pass
- [ ] **P2** — `ReportPrintViewFull` parity pass
- [ ] **P3** — Paid pipeline integration test (6 sections)
- [ ] **P3** — Staging dogfood report for levelplaydigital.com

---

## Next step

1. **Confirm premises** (especially hub checkout timing).
2. Open **Epic 1 Phase 1** — hub issue for `reportId` passthrough + product `getHubUpgradeUrl`.
3. Run `/ship` per epic when implementation starts.
