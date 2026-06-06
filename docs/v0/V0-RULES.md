# v0 rules — report UI (overrides all other docs)

**If anything conflicts with this file, follow this file.**  
Especially: ignore `levelstack-sample-report.html` layout and `docs/project-brief.md` §10.3 sample-HTML header/table.

## Attach for every v0 report chat

1. `assets/levelstack-report-header-v2.png` (header) or `assets/levelstack-executive-summary-v2.png` (full page)
2. `docs/v0/levelstack-v0-design-tokens.css`

## Do NOT attach

- `assets/levelstack-sample-report.html` or `/levelstack-sample-report.html`
- `docs/project-brief.md` (legacy §10.3 describes v1 sample HTML)
- `docs/phase-3-report-ui.md` (says "sample-aligned shell")
- `docs/v0/reports-page-variations.md` Variation A/B/C (redesign prompts)

## v2 report header (canonical)

Flat navy `#002147`. **Not** hero-mesh. **Not** market under the title.

**Row 1**
- Left: `{ownerName} · {businessName}` + cyan uppercase `DIGITAL PRESENCE & REVENUE FUNNEL ASSESSMENT` + (i)
- Right: two glass boxes — score `68/100` + readiness label; grade letter in **orange square border**

**Row 2** (divider line)
- Left: **3 stacked meta columns** separated by vertical rules — each: icon + uppercase micro-label + bold value  
  `MARKET` / Atlanta, GA · `REPORT DATE` / June 4, 2026 · `ASSESSMENT TYPE` / LevelStack Assessment
- Right: 3 stat pills — findings, critical issues, sections complete

**Not v1 (sample HTML)**
- ❌ Market as subtitle under business name (no assessment title line)
- ❌ No score/grade boxes
- ❌ Four equal meta columns only (no stat pills)
- ❌ Tabs on dark navy band
- ❌ Six tabs without Executive Summary

## Colors (report — not hub marketing)

| Token | Hex |
|-------|-----|
| `--lpd-dark` | `#002147` |
| `--rpt-blue` (subtitle, labels) | `#5BC0DE` |
| `--rpt-orange` (grade, readiness) | `#F0AD4E` |

Do **not** use hub `#FF6633` / `#00D4F5` on the report header.

## Tabs

White bar **below** header. Seven tabs. Executive Summary default. Orange active underline.

## Stack

Next.js 16, React 19, Tailwind 4, shadcn/ui, lucide-react. Props: `LevelstackReportJson`.
