import { describe, expect, it } from "vitest"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  applyFreeTierExecutiveInsights,
  buildFreeTierReputationGap,
  buildFreeTierWhatProspectsSee,
  isPlaceholderReputationGap,
  polishFreeTierWhatProspectsSee,
} from "@/lib/report/free-tier-insights"
import { resolveExecutiveContent } from "@/lib/report/executive-summary-resolve"

const freeReport: LevelstackReportJson = {
  meta: {
    businessName: "Test Co",
    ownerName: "Alex",
    marketLabel: "Atlanta, GA",
    reportDate: "June 4, 2026",
    planId: "levelstack-free-snapshot",
    reportTier: "free_snapshot",
    overallScore: 64,
    letterGrade: "D",
    totalFindings: 5,
    criticalCount: 1,
    highCount: 1,
    mediumCount: 0,
    lowCount: 0,
  },
  executiveSummary: {
    paragraphs: [
      "When prospects search for Alex at Test Co to book General business services at Not specified.",
      "You rated reputation 5/10. Intake note: Not specified.",
      "Conversion risk remains if trust signals do not match.",
    ],
    criticalIssue: "Weak presence",
    firstSteps: [],
    insights: {
      whatProspectsSee:
        "When prospects search for Alex at Test Co to book General business services at Not specified.",
      reputationGap: "You rated reputation 5/10. Intake note: Not specified.",
      revenueRisk: "Conversion risk remains if trust signals do not match.",
    },
  },
  sections: [
    {
      id: "search_footprint",
      label: "Search footprint",
      status: "attention",
      score: 50,
      findings: [
        {
          label: "Brand search",
          value: "Your website was not in the top 10 organic results for this query.",
          detail: "Long detail with contactplatinum.com that should not appear verbatim.",
          severity: "high",
        },
      ],
    },
    {
      id: "online_reputation",
      label: "Reputation",
      status: "attention",
      score: 55,
      findings: [
        {
          label: "Reviews",
          value: "Mixed review signals on public platforms",
          detail: "Example detail",
          severity: "medium",
        },
      ],
    },
  ],
  actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
}

describe("free-tier-insights", () => {
  it("detects placeholder reputation gap copy", () => {
    expect(
      isPlaceholderReputationGap(
        "You rated reputation 5/10. Intake note: Not specified.",
      ),
    ).toBe(true)
  })

  it("replaces free-tier reputation gap with explanatory copy", () => {
    const copy = buildFreeTierReputationGap(freeReport)
    expect(copy).toContain("Reputation Gap compares")
    expect(copy).toContain("free snapshot only collects")
    expect(copy).toContain("Mixed review signals")
    expect(copy).not.toContain("Intake note: Not specified")
  })

  it("replaces free-tier what prospects see with structured copy", () => {
    const copy = buildFreeTierWhatProspectsSee(freeReport)
    expect(copy).toContain("When prospects search for Alex or Test Co")
    expect(copy).toContain("From public research so far:")
    expect(copy).toContain("top 10 organic results")
    expect(copy).not.toContain("Not specified")
    expect(copy).not.toContain("contactplatinum.com")
  })

  it("polishes what prospects see placeholders", () => {
    const polished = polishFreeTierWhatProspectsSee(
      "Book General business services at Not specified.",
    )
    expect(polished).not.toContain("Not specified")
    expect(polished).toContain("your services")
  })

  it("resolveExecutiveContent applies free-tier insight copy", () => {
    const content = resolveExecutiveContent(freeReport)
    expect(content.insights.reputationGap).toContain("free snapshot only collects")
    expect(content.insights.revenueRisk).toContain("free snapshot does not ask")
    expect(content.insights.whatProspectsSee).toContain("From public research so far:")
    expect(content.insights.whatProspectsSee).not.toContain("Not specified")
  })

  it("leaves paid reports unchanged", () => {
    const paid = {
      ...freeReport,
      meta: { ...freeReport.meta, reportTier: "full_report" as const },
    }
    const result = applyFreeTierExecutiveInsights(paid, paid.executiveSummary.insights!)
    expect(result.reputationGap).toBe(paid.executiveSummary.insights!.reputationGap)
  })
})
