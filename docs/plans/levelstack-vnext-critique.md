# LevelStack vNext — Critique & Pre-PRD Recommendations

*Prepared as input to PRD development. Market context current as of July 2026.*

**Live status:** This document is a frozen strategic input. Implementation status, open decisions (OD-6, OD-8), and remaining backlog (including P1-4 taxonomy) live in [`levelstack-vnext-prd.md`](./levelstack-vnext-prd.md) and `lpd-planning/CURRENT_SPRINT_GOALS.md`. Do not treat §15 checkboxes as a live tracker — as of 2026-07-19, PRD P0–P2 through P2-5 (OD-5 Option B) are shipped; ChatGPT/Perplexity AI-visibility remains V2; Brand Intelligence light and four-pillar IA remain open ODs.

---

## 1. Overall Critique

The core instinct — moving from **diagnostic findings** to **evidence-backed decisions** — is correct and matches where the market is heading. It is not, however, novel in isolation: Birdeye's 2026 positioning already promises tools that deliver "insights that drive real business decisions," and Vendasta's "AI employees" are explicitly framed as decision-executing agents, not just report generators. Your differentiation has to come from the *structure* of the decision (evidence, confidence, dependencies, ROI as first-class fields) and the *compounding data* behind it, not from the phrase "decision" itself.

The bigger risk is **scope, not vision**. The brief proposes nine "Intelligence" modules plus an Executive Decision Engine plus a Decision Roadmap plus Automator Pro integration — effectively a full analyst function reimplemented as software, requested for a single version. Every module individually is defensible; all nine together is a two-year enterprise roadmap being scoped as a v1 concept. Treat this brief as a **three-year product architecture**, not a PRD input for the next release.

A second, more subtle risk: **"Decision Intelligence" is now a defined, actively-marketed enterprise software category** — Gartner published its inaugural Magic Quadrant for Decision Intelligence Platforms in February 2026, with SAS, Pega, FICO, IBM, Palantir, DataRobot, and Quantexa as named leaders, describing a $50B+ market of rules engines, simulation, and agentic decisioning software sold to enterprises at five- and six-figure ACVs. This is not a product-naming issue — the product is already called **LevelStack**, which is distinct and fine, and should stay the external product name. The risk is narrower: using the *category label* "Decision Intelligence Platform" to describe LevelStack in marketing copy, investor decks, or SEO-targeted content, where it will be benchmarked by analysts, buyers, and investors against that enterprise category, where it does not belong and cannot compete. Recommend either (a) using "Decision Intelligence" only internally as an architectural philosophy, with LevelStack's external positioning framed in its own terms (e.g., "decision roadmap for your public presence"), or (b) if the phrase is used externally at all, explicitly and repeatedly scoping it to "SMB digital-presence decisions" rather than letting it stand alone.

---

## 2. Differentiation from SEO Tools and AI Content Tools

Genuine differentiation is achievable, but not automatic. Current competitive signal:

- **Birdeye / Podium / Vendasta** are all shipping "AI-driven insights" and agent-style automation in 2026, collapsing the gap between "audit tool" and "advisor."
- The newer battleground is **AI answer-engine visibility** (how a business is represented in ChatGPT/Gemini/AI Overviews responses, sometimes called GEO). Birdeye has already built a dedicated visibility product around this. Your brief does not mention it, and it is a natural fit under Search Intelligence — its absence is a gap, not a strength.

Where LevelStack can actually differentiate:

1. **The Recommendation Object as a portable, structured artifact** (evidence, confidence, dependencies, ROI, owner, automatability) — most competitors surface insights as prose or dashboards, not as a queryable, schema-consistent decision unit that can feed a roadmap, a CRM, or an execution engine.
2. **Intent Intelligence** — comparing *declared* strategic intent against *observed* public signals — is not something reputation/listings tools do; they audit what exists, not the gap between aspiration and reality.
3. **The closed loop with Automator Pro** — diagnose → decide → execute → measure outcome → re-diagnose. Pure-audit competitors (BrightLocal, Whitespark) can't close this loop; execution-only tools (Podium) don't diagnose. This loop, sustained over time, is the actual moat — see Section 8.

Without at least one of these three being sharply built and marketed, "Decision Intelligence" risks reading as a rebrand of the existing audit report with better copywriting.

---

## 3. Brand Intelligence: Standalone, Module, or Both?

**Module inside LevelStack for v1.** A standalone Brand Intelligence product requires its own positioning, pricing, and GTM motion — resourcing you don't need to take on while the core Decision Intelligence architecture is unproven. However, **architect the scoring engine as a decoupled service** (own data model, own API) from day one, so a standalone spin-off is a packaging decision later, not a rebuild. This is a common and low-cost hedge: build modular, ship integrated, decide on unbundling once usage data exists.

---

## 4. Is Intent Intelligence a Defensible Category?

Cautiously yes — it's the most original idea in the brief. Comparing "who you say you want to be" to "who the internet thinks you are" is a genuinely different question than any competitor above is asking, and it gives every other module (Brand, Messaging, Audience, Revenue) a shared frame to roll up into.

Two real risks to manage:

- **Input quality dependency.** The "desired position" side of the comparison (e.g., "Enterprise Systems Partner," "$25,000 engagements") has to come from somewhere — a founder interview, a form, a strategy doc. If that data is thin or self-serving, the alignment percentage is fiction wearing a confidence score. This needs an explicit, disclosed intake methodology, not just an output number.
- **False precision.** Numbers like "Alignment: 43%" imply a rigor the underlying method (LLM judgment over unstructured text) may not support. Recommend banding (Low/Medium/High alignment + qualitative rationale) rather than a fake-precise percentage until you have enough longitudinal data to validate the scoring against real outcomes.

Treat Intent Intelligence as a v2 pilot with a small, willing customer set — not a v1 launch pillar — given its dependency on clean intent capture.

---

## 5. What Should Be Removed or Deferred

- **Automation Intelligence as a standalone top-nav module.** "Can AI automate this / should AI automate this" are already fields on every Recommendation Object (per your own Decision Intelligence spec). A dedicated nav item duplicates that data. Fold it in; don't give it a page.
- **Multi-source Authenticity Analysis** (interviews, podcasts, newsletters) for v1 — high data-collection cost, unclear ingestion pipeline, and it's the least differentiated piece of Brand Intelligence (voice-consistency scoring is a solved, commoditized NLP problem). Ship website + LinkedIn + blog first; add richer sources once the scoring model is validated.
- **Audience Intelligence as a distinct top-level module** for v1 — persona-level messaging resonance is a real capability but better sequenced after Messaging Intelligence is proven, since it depends on that module's output.
- **The full nine-module top nav.** See Section 9 for a consolidated IA.

## 6. What's Missing

- **AI answer-engine / LLM visibility tracking.** Already being built by a direct competitor (Birdeye) in 2026; this belongs under Search Intelligence and is increasingly what "search footprint" means for SMBs.
- **Outcome / feedback loop.** Nothing in the brief tracks whether an executed decision actually worked (ranking moved, reviews increased, revenue changed). This is the single most valuable data asset LevelStack could build — it's what eventually lets confidence and ROI numbers be *earned* rather than *asserted*, and it's what makes the platform get smarter with scale (real defensibility, see Section 8).
- **Evidence provenance / citation methodology.** The spec lists "Evidence" as a field, but not how each claim is sourced or how staleness is handled (a Google Business Profile check from 90 days ago isn't evidence today). Define a provenance and freshness standard before writing the PRD.
- **Confidence calibration methodology.** "94% confidence" needs to mean something specific and consistent across the platform (rule-based certainty vs. LLM self-report vs. historical base rate) or it will read as decoration.
- **Multi-tenant competitive benchmarking data.** "Competitive Intelligence" as scoped is really "audit a competitor's public presence," not true competitive intelligence. Real defensibility here requires aggregate, anonymized benchmark data across your customer base — a data asset that compounds with scale.

## 7. Module Sequencing (V1 vs. Later)

| Release | Modules |
|---|---|
| **V1** | Executive Summary · Search Intelligence (incl. AI-answer visibility) · Trust Intelligence (reviews/GBP — closest to current product) · Brand Intelligence (website + LinkedIn only) · Decision Roadmap (the Recommendation Object engine — this is the real v1 deliverable, not a module, it's the core) |
| **V2** | Messaging Intelligence · Competitive Intelligence (single-competitor audit) · Intent Intelligence (pilot with select customers) · Outcome feedback loop v1 |
| **V3** | Audience Intelligence · Full Authenticity Analysis (multi-source) · Competitive Intelligence (multi-tenant benchmarking) · Continuous Monitoring · Automator Pro closed-loop automation at scale |

The Recommendation Object schema and Decision Roadmap UI are the actual v1 product — every module is just a data source feeding it. Sequence engineering accordingly: build the schema and roadmap UI first, against your *existing* signals (search, reviews, GBP, website), before adding new intelligence modules.

## 8. Defensibility Against Competitors

1. **Recommendation Object schema** (evidence + confidence + dependencies + ROI + automatability + owner) as a consistent, structured, queryable artifact — copyable in concept, slow to replicate well, and becomes the API surface other tools would need to integrate against.
2. **Outcome data loop.** Once you're tracking "we recommended X, customer did X via Automator Pro, here's what happened to the metric," you have something no pure-audit competitor has: real, proprietary evidence that a recommendation type works, at what effort, for what ROI. This compounds — it's a genuine data moat, unlike the audit signals themselves (search rank, reviews, metadata) which are all publicly observable and equally available to every competitor.
3. **Diagnose-to-execute closure with Automator Pro.** Birdeye and Vendasta are both moving into execution ("AI employees"), so this window is closing — the outcome-data loop above is the harder-to-copy piece, not execution itself.

## 9. Simplified Information Architecture

Collapse nine modules into four pillars for navigation; keep the granular "intelligence" concepts as sub-scores feeding each pillar and the Decision Roadmap, not as nine separate destinations.

```
Executive Summary
  → Decision Roadmap (primary surface — ranked Recommendation Objects)

Visibility            (Search Intelligence + AI-answer visibility + Competitive Intelligence)
Brand & Message       (Brand Intelligence + Messaging Intelligence + Intent Intelligence, v2+)
Trust                 (Reputation + Reviews + GBP + Audience Alignment, v3)
Revenue Readiness     (Revenue Intelligence + Automation opportunities as object fields)

Automator Pro (execution — separate product surface, linked from each Decision)
```

This keeps the pitch simple ("four pillars, one roadmap") while preserving the underlying architecture's richness for later expansion.

## 10. Risks & Trade-offs

- **False precision erodes trust.** Executive buyers will distrust unexplained "94% confidence" or "$X expected ROI" figures faster than they'd distrust a plain finding. Every quantified field needs a visible methodology or a qualitative band as fallback, especially before the outcome-data loop exists to ground these numbers in reality.
- **Cold-start problem.** ROI and effort estimates are strongest with historical outcome data you don't have yet on day one. Launch with ranges and directional confidence; tighten as data accumulates.
- **Positioning collision** with the enterprise "Decision Intelligence" category (Section 1) — manage naming carefully in external materials.
- **Nine-module scope** is a multi-year build if taken literally; treat the brief as an architecture doc, not a v1 spec.
- **Subjectivity of brand/intent scoring** risks feeling pseudo-scientific if percentages aren't backed by disclosed methodology — this is a trust risk specific to the "advisor" positioning, where credibility is the entire product.

## 11. Revised Product Vision (one paragraph)

*LevelStack turns a business's public digital footprint into a ranked, evidence-backed decision roadmap — not a score, not a report. Every recommendation states why, why now, what it's worth, what it depends on, and whether it can be automated, and every recommendation gets more accurate over time because LevelStack watches what happened after businesses acted on it.*

## 12. Suggested Roadmap (directional, not dated)

1. **Foundation:** Define and ship the Recommendation Object schema + evidence/provenance standard + confidence methodology. Rebuild the current audit output onto this schema (Search + Trust intelligence only) — this alone is a shippable, differentiated v1.
2. **Roadmap UI:** Ship the Decision Roadmap as the primary product surface, replacing the current findings/action-plan report.
3. **Brand Intelligence (light):** Add website + LinkedIn brand/message scoring into the same schema.
4. **Outcome loop v1:** Instrument Automator Pro executions to feed outcome data back into confidence/ROI calibration.
5. **Expand:** Messaging Intelligence, single-competitor Competitive Intelligence, Intent Intelligence pilot.
6. **Scale:** Audience Intelligence, multi-tenant competitive benchmarking, full Authenticity Analysis, continuous monitoring.

## 13. Recommendations Before Writing the PRD

1. Lock the **Recommendation Object schema** first — it's the reusable core every module writes into. Get this reviewed by engineering and design before scoping any individual module.
2. Decide the **confidence-scoring methodology** explicitly (rule-based vs. LLM self-report vs. historical base rate) and document it — this determines what's crediblee to ship in v1 versus what has to wait for outcome data.
3. Define an **evidence provenance and freshness standard** (source, timestamp, staleness rules) now, since every module depends on it.
4. Keep **LevelStack** as the external product name (it's already distinct and fine); reserve the phrase "Decision Intelligence" for internal architecture conversations, and avoid using it as LevelStack's external category label in marketing/investor materials to prevent confusion with the Gartner-defined enterprise category.
5. Scope the **PRD to Section 7's V1 list only** (Search + Trust + light Brand + Decision Roadmap). Write the other modules as an appendix/roadmap, not as in-scope requirements — this keeps the PRD reviewable and prevents the nine-module ambition from silently becoming the v1 commitment.
6. Decide the **outcome-loop instrumentation** approach early even if you don't build the full loop in v1 — retrofitting outcome tracking after the fact is expensive and you lose the historical data window.

---

## 14. Live Funnel & Report Audit (July 18, 2026)

Findings from comparing the live marketing funnel (`/free`, `/platform/levelstack`) against an actual generated report (Level Play Digital self-report). These are current production issues, not conceptual risks — several directly validate and sharpen the risks flagged in Sections 1, 2, 6, and 10.

### 14.1 Marketing promises a feature that doesn't exist in the product

`/free` leads with: *"Your search footprint, **AI search presence**, and social visibility... ChatGPT, Perplexity, and Google AI Overview responses..."* and lists a "02 Social & off-site" free section. The live report contains **zero mentions** of AI Overviews, ChatGPT, Perplexity, AEO/GEO, or any "Social & off-site" section anywhere in its 7 tabs. This is the single most important finding from this audit: the headline acquisition hook is unbuilt. This elevates "AI answer-engine visibility" (Section 6) from a strategic gap to an active trust/compliance liability sitting on the highest-traffic page in the funnel.

**Resolution: build it into the free tier, don't move it to paid.** Making AI-search-presence a paid-only feature still leaves the free-tier hero copy false — the fix has to make the promise true, not relocate it. This also gives 14.2 (free/paid boundary leakage) a combined fix rather than a separate one: cut the free report back to the two sections marketing actually promises (Search Footprint + Social & Off-site, with AI-search-presence folded into one of them), and move Reputation and Digital Presence — currently free but marketed as locked — behind the $97 paywall. One restructuring closes both gaps and gives the $97 tier real added weight (see 14.4). Engineering note: AI-platform queries (ChatGPT/Perplexity/Google AI Overview) carry real per-report cost and should be cached/batched per business on a refresh cycle rather than called live per report view — the free tier is already erroring under current load (14.3), and a third live external dependency at $0 revenue compounds that risk.

### 14.2 Free tier leaks paid-tier value; locked/unlocked state doesn't match marketing

Marketing states Reputation is part of the **paid** unlock; the live report gives Reputation a full computed score (62/100) with four detailed sub-checks, for free — same for Digital Presence (62/100). Only Revenue Funnel, Competitive Context, and Action Plan are actually locked. The $97 tier is thinner than advertised, and the free tier is more generous than advertised, in both directions simultaneously.

### 14.3 Data integrity issues undermine the "advisor" positioning directly, in production today

- Two of four Reputation checks return **raw backend error text** ("Internal SE Server Error") directly in the customer-facing report.
- Reputation still displays a confident 62/100 score despite half its underlying checks having failed — no visible methodology explains how a score is computed over broken data.
- The Overall score (57) doesn't reconcile with the three visible subscores (87, 62, 62 → arithmetic mean ≈70); likely locked/zeroed sections or a penalty are silently dragging it down, invisible to the user.
- Paired with a red "F" letter grade and an alarm-colored critical banner, the net effect reads as manufactured anxiety rather than evidence-based diagnosis — the exact category the brief says LevelStack should differentiate away from (Section 1, "Product Philosophy").
- "Google PageSpeed Insights data unavailable" is shown as a bare finding rather than suppressed or retried.

This is not a future risk (Section 10's "false precision" concern) — it is happening now, and it's more severe than originally scoped: the numbers aren't just under-explained, some are computed over confirmed-failed data.

### 14.4 Funnel/pricing structure is directionally sound but mis-drawn

Free → $97 one-time report → (implied) Automator Pro recurring is a reasonable low-ticket-to-recurring shape. Per 14.1, the fix is a single restructuring: free tier becomes exactly the two sections marketed (Search Footprint + Social & Off-site, with AI-search-presence built in), and Reputation + Digital Presence move behind the $97 paywall to match what's already marketed as locked. This resolves the leak in one move and gives the paid tier real added weight instead of "more findings" on top of an already-generous free report.

The free report is also specific enough (exact GBP/BBB/homepage findings) that a motivated owner can self-serve without paying, even after this restructuring. Shift paid-tier value further toward **prioritization and sequencing** (i.e., the Decision Roadmap concept from this brief) rather than raw finding count — this also gives the Decision Roadmap a concrete, monetizable home instead of being a diffuse v1 aspiration.

### 14.5 Category taxonomy is too generic

The self-report classifies Level Play Digital (a systems/AI consultancy) as "General business services." If categorization defaults this broad across real customers, several recommendation types (BBB listings, generic GBP category norms) will be low-relevance for anyone outside literal local-service businesses, quietly suppressing both finding quality and upgrade conversion.

---

## 15. Consolidated Fix & Build Roadmap

Flat, priority-ordered list combining this critique's architectural recommendations (Sections 1–13) with the live product/funnel audit (Section 14). Structured for direct use as a task backlog.

### P0 — This week (live trust/compliance risks)

- [ ] `[BUG]` Remove or fix all raw error strings surfaced to users (e.g. "Internal SE Server Error" in Reputation checks). Never render backend exceptions in customer-facing report copy — catch, retry once, then show a labeled "unable to verify" state instead of a fake pass/fail.
- [ ] `[FEATURE]` Build a minimal AI answer-engine visibility check (ChatGPT / Perplexity / Google AI Overview presence) into the free tier — matches the existing `/free` hero promise. Cache/batch queries per business on a refresh cycle rather than calling live per report view, to control cost and avoid adding a third live-dependency failure surface to an already-erroring free tier (see 14.3).
- [ ] `[PRODUCT]` Restructure the free report to exactly two sections (Search Footprint + Social & Off-site, matching `/free`'s promise), moving Reputation and Digital Presence behind the $97 paywall. Resolves 14.1 and 14.2 together and gives the paid tier real added weight.
- [ ] `[COPY]` Update or remove the "Funnel readiness: 42%" sample-report preview on `/free` — it doesn't match the actual report's Overall Score/Grade model shipped in production.

### P1 — Next sprint (scoring integrity)

- [ ] `[ARCH]` Publish (even internally first) a scoring methodology: how section scores are computed, how failed/errored checks are weighted, and how the Overall score derives from subscores. Fix the 87/62/62 → 57 reconciliation gap specifically.
- [ ] `[ARCH]` Disallow computing a section score when a threshold proportion of its underlying checks have failed; show "insufficient data" instead of a numeric score.
- [ ] `[UX]` Re-evaluate the letter-grade + red-banner treatment against the brief's stated positioning ("advisor, not SEO scare tool"); consider a less punitive presentation once scoring is trustworthy.
- [ ] `[DATA]` Broaden business-category taxonomy beyond generic buckets like "General business services" so recommendations (BBB, GBP category norms, etc.) stay relevant outside literal local-service businesses.

### P2 — Foundation (from Sections 1–13, before new modules)

- [ ] `[ARCH]` Define and ship the Recommendation Object schema (evidence, confidence, dependencies, ROI, automatability, owner) as the reusable core data model.
- [ ] `[ARCH]` Define an evidence provenance/freshness standard (source, timestamp, staleness rules) — required before Evidence fields can be trusted.
- [ ] `[ARCH]` Decide confidence-scoring methodology explicitly (rule-based vs. LLM self-report vs. historical base rate); document it before exposing any confidence % to users.
- [ ] `[PRODUCT]` Rebuild current audit output (Search + Trust/Reputation) onto the new Recommendation Object schema.
- [ ] `[PRODUCT]` Ship the Decision Roadmap as the primary UI surface, positioned as the paid-tier differentiator (ties to 14.4 — gives the $97 tier concrete added value beyond "more findings").
- [ ] `[COPY]` Keep "LevelStack" as the external product name. Audit marketing/investor copy for every use of "Decision Intelligence" and ensure it's always scoped to the ICP (mid-market operators, agencies, SMBs) rather than left standing alone as an unqualified category claim — e.g. "the decision layer for your digital presence" or "decision intelligence for local & multi-location businesses," not a bare "Decision Intelligence Platform." This avoids collision with the Gartner-defined enterprise category (SAS/Pega/FICO/IBM/Palantir) while keeping the underlying positioning — evidence-linked, prioritized, ROI-framed recommendations for buyers without an in-house analyst — which is genuine white space relative to the actual competitive set (Birdeye, Vendasta, Podium).
- [ ] `[IA]` Collapse navigation to four pillars (Visibility, Brand & Message, Trust, Revenue Readiness) feeding the Decision Roadmap, per Section 9.

### P3 — Expansion (V2/V3, sequenced per Section 7)

- [ ] `[FEATURE]` AI answer-engine / LLM visibility tracking under Search Intelligence (also closes the P0 marketing gap properly, not just cosmetically).
- [ ] `[FEATURE]` Outcome/feedback loop v1: instrument Automator Pro executions to capture what happened after a recommendation was acted on; feed back into confidence/ROI calibration.
- [ ] `[FEATURE]` Brand Intelligence (light): website + LinkedIn scoring inside the new schema.
- [ ] `[FEATURE]` Messaging Intelligence; single-competitor Competitive Intelligence.
- [ ] `[FEATURE]` Intent Intelligence pilot with a small customer set, using banded (Low/Medium/High) alignment rather than fake-precise percentages until outcome data exists to validate it.
- [ ] `[FEATURE]` Audience Intelligence, multi-tenant competitive benchmarking, full multi-source Authenticity Analysis, continuous monitoring — defer to V3, after outcome loop and schema are proven.

---

## 16. Format & Tooling Recommendations

### 16.1 BRD readiness

This document is a strong **input** to a BRD, not a BRD itself. It's missing the elements a BRD needs: an explicit in-scope/out-of-scope statement, acceptance criteria per item (Section 15 gives one-line tasks, not criteria), success metrics/KPIs, stakeholder ownership, timeline/sizing, and explicit cross-item dependencies (e.g., the P1 scoring-methodology fix blocks the P2 Recommendation Object schema). None of this is a big lift, but it should be added — either by hand or by prompting Cursor with this document plus your team's actual BRD template. Without a template, Cursor will invent a structure, which usually isn't what stakeholders expect back.

### 16.2 Model choice: Fable 5 is not necessary for this task

Converting this document into a BRD is a structured-writing/synthesis task, not the long-horizon autonomous coding or hard multi-step reasoning Fable 5 (Anthropic's Mythos-class model, ~2x the price of Opus 4.8) is built for. Claude Sonnet 5 or Opus 4.8 in Cursor is sufficient and materially cheaper. Reserve Fable 5 for later, when Cursor is autonomously implementing the P2/P3 architecture items across the codebase — that's the kind of long-horizon agentic work it's suited for. Note also: Fable 5 and Mythos 5 both carry a 30-day data-retention requirement on API traffic for safety monitoring, worth checking against data policies before routing this document (or the codebase) through it either way.

### 16.3 Current report readability

The live report's Executive Summary has decent visual hierarchy (score cards, colored severity banner, sidebar nav). The deeper sections and the print/PDF export are weaker — long unbroken paragraphs, repeated boilerplate per finding, and severity conveyed only through a text label ("Good"/"Attention"/"High") rather than consistent color/iconography carried into print. It's readable, not scannable: a business owner has to read prose to find what's urgent rather than pattern-matching color or position.

### 16.4 Paid Decision Roadmap: web dashboard first, exports secondary

The Decision Roadmap should be **web-dashboard-primary**, not PDF- or spreadsheet-primary:

- The core thesis of this brief is a living system (Automator Pro execution, outcome tracking, re-diagnosis over time — Sections 2, 8). A static export can't reflect a decision being executed or re-prioritized; a dashboard can.
- Recommendation Object fields (evidence, confidence, dependencies, ROI, owner) are naturally suited to filtering, sorting, and status-tracking interactions that a flat document can't support.
- The outcome loop (Section 6, 15) requires instrumenting what happens after a recommendation is acted on — not possible from a downloaded file.

Keep export formats as **secondary, not primary** outputs:

- **PDF export** — redesigned with real color-coded priority (not just text labels) and one decision per visual block, for sharing with a partner/stakeholder who won't log into a dashboard, or for printing.
- **CSV/spreadsheet export** of Recommendation Objects — for teams who want to load decisions into their own PM tool (Asana, Notion, Excel) rather than adopt the dashboard; also demonstrates the schema's portability, one of the defensibility arguments in Section 8.
