# v0 — Report header only (v2 screenshot fidelity)

Use a **new v0 chat**. Model: **v0-max** or **v0-pro**.

## Attach (only these two)

1. **`assets/levelstack-report-header-v2.png`** — header crop (preferred)
2. **`docs/v0/V0-RULES.md`** — overrides project-brief and sample HTML

Optional: `docs/v0/levelstack-v0-design-tokens.css`

## Do NOT attach

- `docs/project-brief.md` — §10.3 still described v1 sample HTML (now updated; v0 may cache old version)
- `assets/levelstack-sample-report.html`
- `docs/v0/reports-page-context.md` or `reports-page-variations.md` on first pass

## Paste this prompt

```
Replicate the attached header screenshot EXACTLY. Follow docs/v0/V0-RULES.md. Not a redesign.

STACK: Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, lucide-react.
Components: ReportHeader + ReportScorecard. Props: LevelstackReportJson meta + sectionCount.

COLORS: #002147 flat header. --rpt-blue #5BC0DE subtitle/labels. --rpt-orange #F0AD4E grade + readiness.
Score boxes: rgba(255,255,255,0.06) bg, rgba(255,255,255,0.14) border. NO hero mesh. NO hub #FF6633/#00D4F5.

ROW 1:
  LEFT: "Luther Ragsdale · Platinum Real Estate" + "DIGITAL PRESENCE & REVENUE FUNNEL ASSESSMENT" + Info icon
  RIGHT: glass box "OVERALL READINESS SCORE" 68/100 "Developing" | glass box "GRADE" orange square border "D"

ROW 2 (top border rgba white 12%):
  LEFT: 3 STACKED meta columns with VERTICAL DIVIDERS between them. Each column:
    icon + uppercase micro-label (cyan/muted) on top + bold white value below
    MARKET / Atlanta, GA | REPORT DATE / June 4, 2026 | ASSESSMENT TYPE / LevelStack Assessment
  RIGHT: 3 pills — 17 Findings Identified | 0 Critical Issues | 5 of 6 Sections Complete

PROPS (no hardcoded customer data):
meta.ownerName, meta.businessName, meta.marketLabel, meta.reportDate, planDisplayName(meta.planId),
meta.overallScore, meta.letterGrade, readinessLabel(meta.overallScore),
meta.totalFindings, meta.criticalCount, `${sectionCount} of 6`

V1 SAMPLE HTML — DO NOT BUILD:
- Market as line 2 under title (instead of assessment subtitle)
- No score/grade boxes on the right
- Only four meta columns with no stat pills
- Tabs on dark band

Output: components/report/report-header.tsx (+ report-scorecard.tsx). 1152px frame.
```

## If v0 still builds v1

v0 may be using **project instructions** or a **linked GitHub repo** that still indexes old docs. In v0 project settings, remove custom instructions referencing sample HTML. Attach only `V0-RULES.md` + header PNG.

Follow-up message:

```
You built the v1 sample HTML header. Wrong. Re-read V0-RULES.md and the screenshot.
Required: assessment subtitle row, score+grade boxes top-right, stacked meta columns bottom-left with vertical dividers, stat pills bottom-right.
```
