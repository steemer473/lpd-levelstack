import { describe, expect, it } from "vitest"

import { levelstackIntakeTestDefaults } from "@/lib/intake/schema"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { reconcileReportTierFromDb } from "@/lib/reports/reconcile-report-tier"

function baseReport(
  reportTier: LevelstackReportJson["meta"]["reportTier"],
): LevelstackReportJson {
  return {
    meta: {
      businessName: levelstackIntakeTestDefaults.primaryBusinessName,
      ownerName: levelstackIntakeTestDefaults.ownerName,
      marketLabel: "Atlanta, GA",
      reportDate: "July 30, 2026",
      planId: null,
      reportTier,
      overallScore: 70,
      letterGrade: "C",
      totalFindings: 1,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 1,
      lowCount: 0,
    },
    executiveSummary: {
      paragraphs: ["One", "Two"],
      criticalIssue: "Issue",
      firstSteps: [],
    },
    sections: [],
    actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
  }
}

describe("reconcileReportTierFromDb", () => {
  it("overwrites stale free JSON tier when DB is full_report", () => {
    const out = reconcileReportTierFromDb(
      baseReport("free_snapshot"),
      "full_report",
    )
    expect(out.meta.reportTier).toBe("full_report")
  })

  it("leaves JSON free tier unchanged for snapshot view", () => {
    const out = reconcileReportTierFromDb(
      baseReport("free_snapshot"),
      "full_report",
      { snapshotView: true },
    )
    expect(out.meta.reportTier).toBe("free_snapshot")
  })

  it("leaves JSON tier unchanged when DB tier is null", () => {
    const out = reconcileReportTierFromDb(baseReport("full_report"), null)
    expect(out.meta.reportTier).toBe("full_report")
  })

  it("returns same reference when tiers already match", () => {
    const input = baseReport("full_report")
    const out = reconcileReportTierFromDb(input, "full_report")
    expect(out).toBe(input)
  })
})
