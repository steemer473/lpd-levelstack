# v0 rules — report UI (overrides all other docs)

**If anything conflicts with this file, follow this file.**  
Especially: ignore `levelstack-sample-report.html` layout and `docs/project-brief.md` §10.3 sample-HTML header/table.

## Attach for every v0 report chat

1. **Figma audit-report frame** — [Figma design (node 4:4)](https://www.figma.com/design/Cf5KyaEUpnIM1k4bnfWoTC/Untitled?node-id=4-4) (`fileKey: Cf5KyaEUpnIM1k4bnfWoTC`, `nodeId: 4:4`)
2. `docs/v0/levelstack-v0-design-tokens.css`

## Do NOT attach

- `assets/levelstack-report-header-v2.png` or `assets/levelstack-executive-summary-v2.png` — **deprecated** (wrong glass/outline styling)
- `assets/levelstack-sample-report.html` or `/levelstack-sample-report.html`
- `docs/project-brief.md` (legacy §10.3 describes v1 sample HTML)
- `docs/phase-3-report-ui.md` (says "sample-aligned shell")
- `docs/v0/reports-page-variations.md` Variation A/B/C (redesign prompts)

## Page order (canonical)

1. Flat dark header (title, score/grade, meta, stats)
2. "How to read this report" panel
3. White 7-tab bar
4. Active tab content (Executive Summary = Figma frame `4:4` body)
5. Score breakdown (post-content chrome — not between tabs and body)
6. Previous / Next footer nav
7. **$97 UpgradeBanner** (free tier only — bottom of page, not in header)
8. Report footer

## Report header (canonical — Figma `4:5`–`4:24`)

Flat navy `#002147`. **Not** hero-mesh. **Not** market under the title.

**Prohibited in header:**
- Glass / frosted panels on score, grade, or stat areas
- Orange border or outline around the grade letter
- `$97 upsell` inside the header band

**Row 1**
- Left: `{ownerName} · {businessName}` + cyan uppercase `DIGITAL PRESENCE & REVENUE FUNNEL ASSESSMENT` + (i)
- Right: score `68/100` (white score, cyan `/100`, orange readiness label) + large orange grade letter only (no box)

**Row 2** (subtle `rgba(0,0,0,0.13)` band)
- Left: **3 stacked meta columns** separated by vertical rules — each: icon + uppercase micro-label (`#94a3b8`) + bold white value  
  `MARKET` / Atlanta, GA · `REPORT DATE` / June 4, 2026 · `ASSESSMENT TYPE` / LevelStack Assessment
- Right: 3 stat labels — findings, critical issues, sections complete (flat on navy, no glass pills)

**Not v1 (sample HTML)**
- ❌ Market as subtitle under business name (no assessment title line)
- ❌ v1 sample HTML lacks score/grade display (v2/Figma requires them)
- ❌ Four equal meta columns only (no stat pills)
- ❌ Tabs on dark navy band
- ❌ Six tabs without Executive Summary

## Executive summary (Figma `4:95`+)

- AI Executive Assessment: 3 white insight cards + 3 tinted highlight cards (Critical / Impact / Opportunity)
- What To Do First: 3-phase timeline with focus pills (`rounded-md`, not pill-shaped)
- Competitive Snapshot + Key Strengths & Opportunities (two-column bottom)
- Footer disclaimer: "Diagnostic only — LevelStack does not guarantee rankings or revenue outcomes."
- Free tier: keep inline `UpsellBlurOverlay` teasers in exec summary only

## Colors (report — not hub marketing)

| Token | Hex |
|-------|-----|
| `--lpd-dark` / header bg | `#001e46` |
| `--rpt-blue` (subtitle, `/100`) | `#38bdf8` |
| `--rpt-orange` (grade, readiness) | `#f97316` |
| Header micro-labels | `#94a3b8` |

Do **not** use hub `#FF6633` / `#00D4F5` on the report header.

## Tabs

White bar **below** header. Seven tabs. Executive Summary default. Orange active underline.

## Stack

Next.js 16, React 19, Tailwind 4, shadcn/ui, lucide-react. Props: `LevelstackReportJson`.
