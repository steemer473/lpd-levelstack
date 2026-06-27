# Phase 3 — Report UI

## Implemented

- **v2 report shell** — flat `#002147` header (score + grade flat on navy, stacked meta + stat pills), white 7-tab bar (`components/report/levelstack-report-view.tsx`). Visual ref: [Figma frame 4:4](https://www.figma.com/design/Cf5KyaEUpnIM1k4bnfWoTC/Untitled?node-id=4-4)
- **Executive summary** — critical issue callout, first steps, scope note
- **Readiness dashboard** — grade, overall score, priority counts, per-section score bars, biggest problem areas
- **Section panels** — finding cards with critical/attention/good flags
- **AI preview row** — search footprint (when `aiPreview` present in JSON)
- **Score rows** — digital presence website signals, PageSpeed, GBP (when `scoreRows` present)
- **Competitive table** — You vs competitor domains from SERP chain (when `competitiveGrid` present)
- **Action plan** — numbered table (This week / month / quarter)
- **Upsell strips** — SEO Automator Pro → hub `/platform/seo`
- **Footer** — LevelStack attribution + report date
- **Free snapshot email** — report-ready + magic link (24h); admin notify on submit

## Regenerate for new UI modules

Older `report_json` rows may lack `competitiveGrid` / `scoreRows`. Use **Rebuild report (dev)** to refresh data and optional grid fields. Dev only — see [phase-2-1-research.md](./phase-2-1-research.md#failed-report-recovery).

## Not in Phase 3 (brief follow-ups)

- PDF export
- Nurture email sequences (Emails 2–5 — GHL UI; app enrichment shipped — [operations/ghl-nurture-workflow.md](./operations/ghl-nurture-workflow.md))
- Full SEO-audit results page clone as separate route

**Next priority:** analysis quality and $497 launch bar — see [`phase-2.2-analysis-quality.md`](./phase-2.2-analysis-quality.md).

Layout: [Figma frame 4:4](https://www.figma.com/design/Cf5KyaEUpnIM1k4bnfWoTC/Untitled?node-id=4-4), `docs/v0/V0-RULES.md`. Copy tone only: `assets/levelstack-sample-report.html`.
