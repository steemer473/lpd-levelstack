# Phase 3 — Report UI

## Implemented

- **v2 report shell** — flat `#002147` header (score + grade boxes, stacked meta + stat pills), white 7-tab bar (`components/report/levelstack-report-view.tsx`). Visual ref: `assets/levelstack-executive-summary-v2.png`
- **Executive summary** — critical issue callout, first steps, scope note
- **Readiness dashboard** — grade, overall score, priority counts, per-section score bars, biggest problem areas
- **Section panels** — finding cards with critical/attention/good flags
- **AI preview row** — search footprint (when `aiPreview` present in JSON)
- **Score rows** — digital presence website signals (when `scoreRows` present)
- **Competitive table** — You vs competitor domains from Serp (when `competitiveGrid` present)
- **Action plan** — numbered table (This week / month / quarter)
- **Upsell strips** — SEO Automator Pro → hub `/platform/seo`
- **Footer** — LevelStack attribution + report date

## Regenerate for new UI modules

Older `report_json` rows may lack `competitiveGrid` / `scoreRows`. Use **Rebuild report (dev)** to refresh data and optional grid fields.

## Not in Phase 3 (brief follow-ups)

- PDF export
- Report-ready email (Resend)
- GBP / Lighthouse / social API research (sample depth for those metrics)
- Full SEO-audit results page clone as separate route

**Next priority:** analysis quality and $497 launch bar — see [`phase-2.2-analysis-quality.md`](./phase-2.2-analysis-quality.md).

Layout: `assets/levelstack-executive-summary-v2.png`, `docs/v0/V0-RULES.md`. Copy tone only: `assets/levelstack-sample-report.html`.
