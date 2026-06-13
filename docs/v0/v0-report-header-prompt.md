# v0 — Report header only (Figma fidelity)

Use a **new v0 chat**. Model: **v0-max** or **v0-pro**.

## Attach (only these two)

1. **Figma audit-report frame** — [Figma design (node 4:4)](https://www.figma.com/design/Cf5KyaEUpnIM1k4bnfWoTC/Untitled?node-id=4-4) (header = nodes `4:5`–`4:24`)
2. **`docs/v0/V0-RULES.md`** — overrides project-brief and sample HTML

Optional: `docs/v0/levelstack-v0-design-tokens.css`

## Do NOT attach

- `assets/levelstack-report-header-v2.png` — deprecated (wrong glass/outline styling)
- `docs/project-brief.md` — §10.3 still described v1 sample HTML (now updated; v0 may cache old version)
- `assets/levelstack-sample-report.html`
- `docs/v0/reports-page-context.md` or `reports-page-variations.md` on first pass

## Paste this prompt

```
Replicate the Figma header (nodes 4:5–4:24) EXACTLY. Follow docs/v0/V0-RULES.md. Not a redesign.

STACK: Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, lucide-react.
Components: ReportHeader + ReportScorecard. Props: LevelstackReportJson meta + sectionCount.

COLORS: #002147 flat header. --rpt-blue #5BC0DE subtitle and /100. --rpt-orange #F0AD4E grade + readiness.
Micro-labels #94a3b8. Flat header only — no glass panels, frosted boxes, or translucent score/stat backgrounds.
NO orange border/outline around grade letter. NO hero mesh. NO hub #FF6633/#00D4F5.

ROW 1:
  LEFT: "Luther Ragsdale · Platinum Real Estate" + "DIGITAL PRESENCE & REVENUE FUNNEL ASSESSMENT" + Info icon
  RIGHT: "OVERALL READINESS SCORE" 68/100 "Developing" | "GRADE" orange letter "D" (text only, no box)

ROW 2 (bg rgba(0,0,0,0.13)):
  LEFT: 3 STACKED meta columns with VERTICAL DIVIDERS between them. Each column:
    icon + uppercase micro-label (#94a3b8) on top + bold white value below
    MARKET / Atlanta, GA | REPORT DATE / June 4, 2026 | ASSESSMENT TYPE / LevelStack Assessment
  RIGHT: 3 stat labels — 17 Findings Identified | 0 Critical Issues | 5 of 6 Sections Complete (flat, no glass pills)

PROPS (no hardcoded customer data):
meta.ownerName, meta.businessName, meta.marketLabel, meta.reportDate, planDisplayName(meta.planId),
meta.overallScore, meta.letterGrade, readinessLabel(meta.overallScore),
meta.totalFindings, meta.criticalCount, `${sectionCount} of 6`

V1 SAMPLE HTML — DO NOT BUILD:
- Market as line 2 under title (instead of assessment subtitle)
- No score/grade display on the right
- Only four meta columns with no stat pills
- Tabs on dark band
- Glass panels or grade outline box

Output: components/report/report-header.tsx (+ report-scorecard.tsx). 1152px frame.
```

## If v0 still builds v1

v0 may be using **project instructions** or a **linked GitHub repo** that still indexes old docs. In v0 project settings, remove custom instructions referencing sample HTML. Attach only `V0-RULES.md` + Figma link.

Follow-up message:

```
You built the v1 sample HTML header. Wrong. Re-read V0-RULES.md and the Figma frame.
Required: assessment subtitle row, score+grade top-right (flat on navy, no grade outline), stacked meta columns bottom-left with vertical dividers, stat labels bottom-right. No glass panels.
```
