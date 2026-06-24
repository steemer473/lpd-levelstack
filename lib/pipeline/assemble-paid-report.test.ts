import { describe, expect, it } from "vitest"

import type { AuditScoreBundle } from "@/lib/audit/types"
import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { assembleReportFromSignals } from "@/lib/pipeline/assemble-from-signals"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"

const intake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Paid Co",
  ownerName: "Pat Owner",
  priorBusinessNames: ["None"],
  primaryService: "Consulting",
  pricePoint: "$2k/mo",
  websiteUrl: "https://paid.example.com",
  socialProfiles: "LinkedIn",
  emailListSize: "500",
  complaintsAwareness: "None",
  reputationSelfAssessment: "Strong",
  reputationScale: 8,
  purchaseMotivation: "Scale",
  hasActiveAdSpend: "yes" as const,
  adPlatforms: "Google Ads",
  adBudget: "$3k/mo",
}

const audit: AuditScoreBundle = {
  signals: [
    {
      id: "google_indexing",
      label: "Google indexing",
      status: "warning",
      finding: "Partial",
      evidence: ["paid.example.com"],
      tier: "paid",
    },
  ],
  insights: [],
  overallScore: 72,
  letterGrade: "C",
}

describe("assembleReportFromSignals paid tier", () => {
  it("includes all six paid sections and action plan buckets", () => {
    const report = assembleReportFromSignals(
      intake,
      audit,
      "levelstack-full-report",
      "full_report",
    )

    const parsed = levelstackReportJsonSchema.safeParse(report)
    expect(parsed.success).toBe(true)
    expect(report.meta.reportTier).toBe("full_report")

    const ids = report.sections.map((s) => s.id)
    expect(ids).toContain("revenue_funnel")
    expect(ids).toContain("competitive_context")
    expect(ids).not.toContain("action_plan")

    expect(report.actionPlan.thisWeek.length).toBeGreaterThan(0)
    expect(
      report.actionPlan.thisMonth.length +
        report.actionPlan.thisQuarter.length +
        report.actionPlan.thisWeek.length,
    ).toBeGreaterThan(0)
    expect(report.actionPlan.thisWeek[0]?.who).toBeTruthy()
    expect(report.actionPlan.thisWeek[0]?.time).toBeTruthy()
  })
})
