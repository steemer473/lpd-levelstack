# LevelStack Copy Bible

Canonical customer-facing strings for LevelStack. Planning mirror: `lpd-planning/COPY_BANK.md` §7.

## ICP and voice (locked 2026-08-04)

**Primary reader:** ABC / chamber-style business owners and personal brands (solo / 1–20), not agency portfolio operators.

**Voice:** Consultant who simplifies — specific observations about *this* owner’s search, reviews, and local rivals. Prefer “what prospects see when they search your name” over generic “small business digital performance.”

**Partnership path (docs / private outreach only):** ABC leaders use LevelStack → feedback/reviews → recommend to members → warm SEO Automator Pro waitlist. Never invent testimonials. ABC member pricing stays off public site.

**Avoid on primary surfaces:** Agency/network language; “we fix”; managed-service dependency; presenting SAP as live self-serve checkout.

## Product names

| Tier | Name |
|---|---|
| Free | Visibility Snapshot |
| Paid ($97) | Action Roadmap |
| Premium ($297) | Action Roadmap + Strategy Call |

Runtime: `lib/report/outcome-copy.ts` → `PRODUCT_NAMES`.

## Translation engine

See `lib/prompts/levelstackCopyPrompt.ts` and AGENTS.md § LevelStack Data-to-Copy Translation Engine.

## Frontend scannability

- Headline + max 3 bullets (≤15 words each)
- `leading-relaxed tracking-tight` on short fragments
- Lucide severity anchors: AlertTriangle (Revenue Risk), Zap (Performance Leak), Shield (Verified Asset), Lock (locked modules)
- Color tokens: red-50/700 (danger), amber-50/700 (attention), emerald-50/700 (verified)

## Approved static strings

### Free executive summary (Visibility Snapshot)

Runtime: `lib/report/free-executive-copy.ts` (single source for web, print, email topFinding).

**Headline states** (derive 2 / 6 / 4 from diagnostic-area helpers — never hardcode; Action Plan is not a judgment area):

- Failures present: "We checked 2 of the 6 areas prospects use to judge [Business] — and already found [N] critical issue(s). The 4 areas we haven't opened yet are where reputation and revenue problems usually hide."
- Clean free scan: "We checked 2 of the 6 areas prospects use to judge [Business] — both came back clean. The 4 areas we haven't opened yet are where reputation and revenue problems usually hide."

**Priority finding:** Failed audit signals first (snippet mismatch interpolates live evidence). Never promote a positive `#1` rank finding. On clean scans, suppress the slot and show "What we verified" (exclude Subdomain Exposure from that list).

**Score treatment:** Label as **Grade so far** based on 2 of 6 areas (grade will change as locked areas open). KPI "Checks failed" and "Warnings" share one count source (`freeScanIssueCounts`) — audit `fail` / `warning` statuses. Do not use `totalFindings` for those KPIs.

**Executive insight cards** (free only; runtime: `lib/report/free-tier-insights.ts` → `buildFreeTierStructuredExecutiveInsights`):

1. **What prospects see** — When prospects search for [Business or category][market], the first screen shapes trust… Live Google + website signals disclaimer. `From public research:` + best brand/search finding (`pickSearchPublicSignal`). Tab pointer: Search footprint.
2. **Social presence** — LinkedIn/Facebook credibility framing. `From public research:` + best social finding (`pickSocialPublicSignal`). Free limitation + `$97` upgrade for Reputation, Digital presence, trust gap analysis.
3. **Where you're exposed** — Revenue-risk framing (conversion vs. trust/offer/landing-page mismatch). `From public research:` + cross-section signal (`pickRevenuePublicSignal`). Free limitation (no ad-spend intake) + `$97` upgrade for funnel diagnosis.

Paid Action Roadmap uses the same builders with `includeUpgradeTeasers: false` (no `$97` lines).

**Upgrade module (one per free snapshot):** Scope line + policy-safe credit note + `$97` primary + `$297` secondary + Placement-2 monitoring bridge. No scarcity ("at capacity", "spots remaining") on the free snapshot.

### Upgrade banner

- Lead: "Ready for the prioritized plan? Unlock your Action Roadmap."
- Body: "The $97 assessment fee credits toward your first founding-rate month of SEO Automator Pro when an eligible slot opens (same email as purchase)."
- Button: "Unlock Action Roadmap — $97"
- Secondary: "Prefer a walkthrough? Action Roadmap + Strategy Call — $297"
- Monitoring CTA: "Learn about SEO Automator Pro"

### Locked section modal

- Title: "Unlock Your 90-Day Action Blueprint & Competitive Analysis"
- Description: "Your free snapshot found the gaps. The Action Roadmap shows how to close them."
- Bullets: 90-day plan, unlocked modules, dashboard + PDF
- Primary CTA: "Unlock Action Roadmap — $97"
- Credit note (below button): "The $97 assessment fee credits toward your first founding-rate month when an eligible SEO Automator Pro slot opens."
- Secondary: "Return to Visibility Snapshot"

### SAP waitlist modal

- Title: "Secure Your Charter Spot for SEO Automator Pro"
- CTA: "Apply for Early Access & Lock in My $97 Credit"
- URL: `/platform/seo?source=levelstack_report_credit`

### Charter guarantee (hub checkout)

**100% Risk-Free Charter Guarantee:** Secure your Action Roadmap today for $97. Priority waitlist + assessment fee credit at SAP onboarding. Dashboard live immediately.

## Email subjects (Workflow B waitlist)

| ID | Subject |
|---|---|
| W1 | You're on the list (and your $97 credit is locked in) |
| W2 | The anatomy of a "D" Grade (And the local search leak) |
| W3 | Why [Industry/Niche] businesses are ditching traditional agencies |
| W4 | Cohort update: preparing the next automation slots |

## Email subjects (Workflow C agency waitlist)

| ID | Subject |
|---|---|
| A1 | You're on the Agency founding list |
| A2 | The client call you don't want to get |
| A3 | Why operators are replacing quarterly audit deliverables |
| A4 | Cohort update: prep your first client sites |

**Note:** Workflow C remains for **expansion / SAP agency** paths — not LevelStack primary ICP copy.

## App root landing (levelstack.levelplaydigital.com)

Mirror: COPY_BANK §7.2.

**Voice:** Consultant who simplifies — specific observations, diagnosis, honest scope. Write for the owner who networks and runs ads — not a generic SMB SaaS visitor.

| Field | Copy |
|---|---|
| Hero | What prospects see before they call you. |
| Subhead | We look at search, reviews, and gaps rivals use against you. Free snapshot first. Action Roadmap for $97 when you are ready to act. |
| Section h2 | What you get |
| Card 1 | **First impression** — Search and presence. Where prospects decide. |
| Card 2 | **Live research** — Real data from your market. Not a generic checklist. |
| Card 3 | **Honest scope** — We show priorities. SEO Automator Pro fixes them. No rank or sales promises. |
| Footer | We spot gaps. SEO Automator Pro fixes them. No rank or sales promises. |
| Meta | What prospects see before they call. Free snapshot. Action Roadmap $97. |

**Readability (tiered):** Hero FK ≤ 6; body/card FK ≤ 5; CTAs/footer FK ≤ 4; sentences ≤ 15 words.

## Report disclaimers

Mirror: COPY_BANK §7.4.

| ID | Use | Copy |
|---|---|---|
| DISC-01 | Score footer, executive summary, print view | Diagnostic only — LevelStack spots gaps. SEO Automator Pro fixes the technical layer. LevelStack does not guarantee rankings or revenue outcomes. |
| DISC-02 | Action plan section callout | LevelStack lists what to fix. SEO Automator Pro fixes the technical layer. |
| DISC-03 | Pipeline executive summary fallback | This report is diagnostic only — LevelStack identifies gaps. SEO Automator Pro fixes the technical layer. No ranking or revenue outcomes are guaranteed. |

**Runtime:** `lib/report/outcome-copy.ts` (`REPORT_DIAGNOSTIC_DISCLAIMER`, `REPORT_ACTION_PLAN_CALLOUT`, `REPORT_PIPELINE_DISCLAIMER`).

## FAQs

Full canonical list: COPY_BANK §7.1. In-app subset: `data/action-roadmap-faqs.ts`.
