import { describe, expect, it } from "vitest"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  applyFreeTierExecutiveInsights,
  buildFreeTierReputationGap,
  buildFreeTierRevenueRisk,
  buildFreeTierWhatProspectsSee,
  isAboutSubjectReputationFinding,
  isGenericDirectoryListing,
  isPlaceholderReputationGap,
  pickReputationPublicSignal,
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
      id: "social_offsite",
      label: "Social & off-site presence",
      status: "attention",
      score: 55,
      findings: [
        {
          label: "Facebook",
          value: "No clear Facebook profile matched your brand in search",
          detail: "Nothing in the top results clearly matched.",
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

  it("detects generic directory listings as unrelated SERP noise", () => {
    expect(
      isGenericDirectoryListing(
        "Best Digital Marketing Agency near Castleberry Hill, Atlanta, GA",
      ),
    ).toBe(true)
  })

  it("skips unrelated directory SERP titles for Level Play Digital", () => {
    const report: LevelstackReportJson = {
      ...freeReport,
      meta: { ...freeReport.meta, businessName: "Level Play Digital", ownerName: "Stephanie" },
      sections: [
        ...freeReport.sections.filter((s) => s.id !== "online_reputation"),
        {
          id: "online_reputation",
          label: "Reputation",
          status: "attention",
          score: 58,
          findings: [
            {
              label: "Google visibility",
              value: "Best Digital Marketing Agency near Castleberry Hill, Atlanta, GA",
              detail: "Unrelated local directory result",
              severity: "medium",
            },
          ],
        },
      ],
    }

    expect(pickReputationPublicSignal(report)).toBeUndefined()
    const copy = buildFreeTierReputationGap(report)
    expect(copy).not.toContain("Castleberry Hill")
    expect(copy).toContain("Open Social & off-site presence")
    expect(copy).toContain("No clear Facebook profile matched")
  })

  it("prefers review signals over bare business names for reputation teaser", () => {
    const report: LevelstackReportJson = {
      ...freeReport,
      meta: { ...freeReport.meta, businessName: "Level Play Digital" },
      sections: [
        ...freeReport.sections.filter((s) => s.id !== "online_reputation"),
        {
          id: "online_reputation",
          label: "Reputation",
          status: "attention",
          score: 55,
          findings: [
            {
              label: "Yelp visibility",
              value: "Level Play Digital",
              detail: "Listing title only",
              severity: "medium",
            },
            {
              label: "Google reviews",
              value: "Level Play Digital — 4.2★, 18 reviews cited",
              detail: "Review snippet",
              severity: "medium",
            },
          ],
        },
      ],
    }

    expect(pickReputationPublicSignal(report)).toContain("4.2★")
    expect(pickReputationPublicSignal(report)).not.toBe("Level Play Digital")
    expect(
      isAboutSubjectReputationFinding(
        report.sections.find((s) => s.id === "online_reputation")!.findings[1]!,
        "Level Play Digital",
        "Alex",
      ),
    ).toBe(true)
  })

  it("replaces free-tier reputation gap with social presence analysis", () => {
    const copy = buildFreeTierReputationGap(freeReport)
    expect(copy).toContain("Social presence compares")
    expect(copy).toContain("From public research: No clear Facebook profile matched")
    expect(copy).toContain("Open Social & off-site presence")
    expect(copy).toContain("Upgrade to Action Roadmap ($97)")
    expect(copy).not.toContain("Open the Reputation tab")
    expect(copy).not.toContain("From public research so far:")
    expect(copy).not.toMatch(/From public research:.*Upgrade to the Action Roadmap/)
    expect(copy).not.toContain("Intake note: Not specified")
  })

  it("replaces free-tier revenue risk with analysis separate from upgrade", () => {
    const copy = buildFreeTierRevenueRisk(freeReport)
    expect(copy).toContain("From public research:")
    expect(copy).toContain("Search footprint and Social & off-site presence")
    expect(copy).toContain("Upgrade to Action Roadmap ($97)")
    expect(copy).not.toMatch(/From public research:.*Upgrade to the Action Roadmap/)
  })

  it("replaces free-tier what prospects see with structured copy", () => {
    const copy = buildFreeTierWhatProspectsSee(freeReport)
    expect(copy).toContain("When prospects search for Alex or Test Co")
    expect(copy).toContain("From public research:")
    expect(copy).toContain("top 10 organic results")
    expect(copy).toContain("Open the Search footprint tab")
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
    expect(content.insights.reputationGap).toContain("Social presence compares")
    expect(content.insights.revenueRisk).toContain("does not ask about")
    expect(content.insights.whatProspectsSee).toContain("From public research:")
    expect(content.insights.whatProspectsSee).not.toContain("Not specified")
    expect(content.structuredInsights?.whatProspectsSee.some((p) => p.kind === "highlight")).toBe(
      true,
    )
    expect(
      content.structuredInsights?.reputationGap.some((p) => p.kind === "finding"),
    ).toBe(true)
    expect(content.structuredInsights?.reputationGap.some((p) => p.kind === "muted")).toBe(true)
  })

  it("applies finding-driven insights on paid without $97 upgrade teasers", () => {
    const paid = {
      ...freeReport,
      meta: { ...freeReport.meta, reportTier: "full_report" as const },
    }
    const result = applyFreeTierExecutiveInsights(paid, paid.executiveSummary.insights!)
    expect(result.whatProspectsSee).toContain("From public research:")
    expect(result.reputationGap).toContain("Social presence compares")
    expect(result.reputationGap).not.toMatch(/\$97/)
    expect(result.revenueRisk).not.toMatch(/\$97/)
    expect(result.revenueRisk).not.toContain("does not ask about")

    const content = resolveExecutiveContent(paid)
    expect(content.structuredInsights?.reputationGap.some((p) => p.kind === "muted")).toBe(
      false,
    )
    expect(content.structuredInsights?.revenueRisk.some((p) => p.kind === "muted")).toBe(
      false,
    )
  })
})
