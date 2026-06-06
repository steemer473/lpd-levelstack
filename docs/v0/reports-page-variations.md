# `/reports/[reportId]` — v0 layout variations (3)

Upload **`docs/v0/V0-RULES.md`** + **`assets/levelstack-executive-summary-v2.png`** first. Optional: tokens JSON/CSS. Then paste **one** variation prompt below.

Do **not** use `levelstack-sample-report.html` for layout — legacy v1 only.

Generate each variation in a **separate v0 chat** for clean comparison.

**Header wrong in v0?** Use **`docs/v0/v0-report-header-prompt.md`** first — do not use Variation A (it asks for hero-mesh + circular grade and will drift from the screenshot).

---

## V2 Screenshot fidelity (use this first)

**Best for:** Matching `levelstack-executive-summary-v2.png` exactly.

```
V2 Screenshot Fidelity — LevelStack report header + chrome

Attached: levelstack-executive-summary-v2.png, levelstack-v0-design-tokens.css

Replicate the screenshot exactly. NOT a redesign. NOT levelstack-sample-report.html.

Build in order:
1. ReportHeader + ReportScorecard — flat #002147, score box + square grade box, stacked meta columns (vertical dividers) + stat pills
2. "How to read this report" light blue panel
3. White tab bar — 7 tabs, Executive Summary active with orange underline
4. Executive summary tab — AI Executive Assessment + What To Do First timeline + competitive snapshot (see screenshot)

Colors: --rpt-orange #F0AD4E, --rpt-blue #5BC0DE, --lpd-dark #002147. NO hero mesh on header.

Mock: Luther Ragsdale · Platinum Real Estate, Atlanta GA, June 4 2026, D / 68 / Developing / 17 findings / 0 critical / 5 of 6 sections.

Stack: Next.js 16, React 19, Tailwind 4, shadcn/ui, lucide-react. Props: LevelstackReportJson.

DO NOT: market under title (v1), missing score boxes, dark-band tabs, hub #FF6633 header accents, sample HTML 6-tab layout.
```

---

## Current report baseline (what v0 should know)

The live report already ships these patterns — variations should **preserve or improve** them, not discard:

| Feature | Behavior |
|---------|----------|
| **7 tabs** | Executive summary (default) → 5 scored sections → Action plan |
| **Exec tab content** | v2: AI executive assessment (3 cols + 3 cards) + 30/60/90 timeline + competitive snapshot — see `executive-summary-v2.tsx` and screenshot |
| **How to read** | Collapsible accordion directly under dark header |
| **Section guides** | `(i)` popover on every panel title — “What this section shows” / “Why it matters” |
| **Finding cards** | `DataPanel`: bordered `bg-muted/40`, micro-label, **orange emphasis** in headline, parsed detail (SERP links, bullets, key-value) |
| **Score rows** | Vertical list: label → bold value → mini bar + **percent** |
| **AI preview** | 2–3 col `DataPanel` grid with parsed result text |
| **Competitive table** | Inside `DataPanel`; “You” column red-tinted background |
| **Tab footer nav** | Previous / Next buttons + “3 of 7” counter |
| **Scroll to top** | Fixed FAB after ~600px scroll |
| **Upsells** | Search footprint + action plan closing → SEO Automator Pro |

---

## Variation A — Polished tab hub (evolution of current)

**Best for:** Lowest migration risk; refine what exists.

```
Variation A — Polished Tab Hub

Using attached LevelStack tokens + page context, redesign the READY report for /reports/[reportId].

BASELINE: Current app uses 7 tabs (Executive summary default), collapsible "How to read this report", DataPanel finding cards with orange emphasis headlines, section (i) guide popovers, prev/next footer nav, scroll-to-top FAB. Preserve all of this.

REDESIGN GOALS (⚠️ diverges from v2 screenshot — use V2 Screenshot fidelity prompt for pixel match):
- Dark header: tighten meta row into responsive chips; grade as circular badge with orange ring; keep hero-mesh dark band
- "How to read": make it a slim banner when collapsed (icon + one-line hint); expanded = 2 short paragraphs + disclaimer
- Executive summary tab: split into clear zones — (1) narrative + critical callout + first steps, (2) readiness dashboard below with visual separator; dashboard grade box larger on lg+
- Tabs: sticky on scroll below site nav; active tab shows section score badge on lg (e.g. "Search footprint · 42")
- DataPanel findings: add 4px left border colored by severity (critical/attention/good); keep parsed detail types (SERP list with orange #position, bullets, key-value)
- Section headers: title + (i) guide + status badge — align on one row; optional section score pill
- Score rows + AI preview + competitive table: keep DataPanel pattern; competitive table sticky first column on scroll
- Footer nav: make Previous/Next more prominent (full-width bar on mobile); keep "X of 7"
- Scroll-to-top: keep FAB; optional "Back to tabs" on long section panels

MOCK: Marcus Carter · MC Fitness & Wellness, D+ / 58, 6 critical, AI invisibility critical issue.

Stack: Next.js 16, shadcn/ui, Tailwind 4, lucide-react. Props: LevelstackReportJson. Include mobile 390px frame.

Feel: Premium consultant PDF brought to web — calm, scannable, owner-friendly.
```

---

## Variation B — Split view with persistent section rail

**Best for:** Owners who tab-hop; keeps guides + parsed findings.

```
Variation B — Split View + Section Rail

Attached tokens + context. Redesign READY /reports/[reportId].

BASELINE FEATURES TO KEEP:
- 7 sections including Executive summary (default) and Action plan
- Collapsible "How to read this report"
- Section (i) popovers with rich What/Why copy
- DataPanel findings with orange emphasis headlines + parsed detail (SERP, bullets, key-value)
- Readiness dashboard on executive summary view only
- SEO Automator Pro upsell strips (search + closing)
- Prev/next semantics (can move to rail or keep footer)

LAYOUT:
- Top: compact dark header — business name, market, grade pill, 4 meta stats (single row desktop, 2×2 mobile)
- Below header: full-width "How to read" accordion (same content as baseline)
- Body lg+: 280px left rail + fluid main
  - Rail: vertical list of 7 sections with severity dot, label, score (or "—" for exec/action plan), active = orange left bar + muted bg
  - Rail sticky below header; scroll independently on long content
- Main: single panel area (no duplicate top tabs on desktop)
  - Executive summary: summary blocks + dashboard (same data as baseline)
  - Section panels: SectionPanelHeader (title + guide + badge) + finding DataPanels + score rows + AI grid + competitive table
  - Action plan: week/month/quarter table groups
- Mobile: horizontal scroll chip nav OR bottom sheet "Sections" button instead of left rail
- Footer: slim prev/next + "3 of 7" OR integrate into rail selection
- Scroll-to-top FAB retained

Do NOT remove: critical issue callout, first steps, diagnostic disclaimer, finding severity flags.

Stack: Next.js 16 + shadcn/ui + Tailwind 4. Props-driven. Desktop + mobile frames.

Feel: Notion sidebar + audit report — structured, not admin-dashboard generic.
```

---

## Variation C — Executive command center + guided sections

**Best for:** Emphasizing urgency and "what to do Monday"; more visual hierarchy.

```
Variation C — Executive Command Center

Use attached LevelStack tokens + page context. READY state for /reports/[reportId].

BASELINE TO RESPECT:
- 7-tab information model (executive_summary, 5 sections, action_plan)
- How to read accordion, section guide (i) popovers, DataPanel + parsed finding details
- Dashboard metrics: grade, overall score, Critical/High/Medium/Low counts, section bars, biggest problems
- Tab prev/next + scroll-to-top

REDESIGN CONCEPT — "Command center" executive tab, "Drill-down" other tabs:

EXECUTIVE SUMMARY TAB (hero tab):
- Top: 3-column command strip (desktop) / stacked (mobile):
  1. Large grade ring (D+) with score inside
  2. Critical issue — bold pull-quote style, red accent border
  3. "This week" preview — first 2 action items from actionPlan.thisWeek with link "View full plan →"
- Middle: collapsible full executive paragraphs (default collapsed if >2 paragraphs)
- Bottom: readiness dashboard as bento grid — priority tiles + section score mini-cards (click card → switches tab)
- How to read: pinned slim bar above command strip

OTHER TABS (drill-down):
- Slim sub-header: section name, score /100, status badge, (i) guide — no repeat of full dark header meta
- Findings: DataPanel cards with severity left border; support SERP/bullet/key-value parsed detail
- Optional: "Related actions" chip linking to action plan items with matching findingRef
- Search footprint: AI preview 3-up + upsell strip
- Competitive: table in DataPanel, you-column highlight

GLOBAL NAV:
- Dark header tabs remain OR replace with pill segment control under command center on exec tab only
- Keep footer Previous/Next ("Executive summary" ↔ "Search footprint" etc.) + 1 of 7
- Floating scroll-to-top

ACTION PLAN TAB:
- Kanban 3 columns (Week | Month | Quarter) on lg+; stacked groups on mobile
- Keep who/time/findingRef; closing upsell strip

MOCK: MC Fitness & Wellness, 58/100, AI search invisibility, 3 competitive columns.

Stack: Next.js 16, shadcn/ui, Tailwind 4. Single component with tab state. Light + dark mode.

Feel: Urgent but trustworthy — owner sees grade + critical issue + this week's tasks in first 5 seconds.
```

---

## Comparison matrix

| Variation | Best for | Builds on |
|-----------|----------|-----------|
| **A Polished tab hub** | Ship-ready polish, minimal refactor | Current `LevelstackReportView` tab model |
| **B Split rail** | Frequent section switching, desktop readers | Same data, sidebar instead of top tabs |
| **C Command center** | Conversion + action focus | Exec tab as dashboard home, bento + action preview |

---

## Suggested v0 workflow

1. Attach `levelstack-v0-design-tokens.json` + `reports-page-context.md`
2. Screenshot from `localhost:3001/reports/{id}` (shows DataPanels, 7 tabs, How to read)
3. Paste **one** variation prompt above
4. Add: *"Match current finding card structure: DataPanel, FindingValueHeadline with orange emphasis, parsed SERP lists. Also output mobile 390px."*
5. Export favorite → map to `components/report/*` + `levelstack-report-view.tsx`
