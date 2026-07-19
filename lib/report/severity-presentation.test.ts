import { describe, expect, it } from "vitest"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  GBP_NOT_CHECKED_VALUE,
  UNABLE_TO_VERIFY_VALUE,
} from "@/lib/report/customer-copy"
import {
  hasScoreableUrgentFinding,
  isUnavailableStyleFinding,
  shouldUseAlarmSeverity,
} from "@/lib/report/severity-presentation"

function baseReport(
  overrides: Partial<LevelstackReportJson> & {
    meta?: Partial<LevelstackReportJson["meta"]>
  } = {},
): LevelstackReportJson {
  const { meta: metaOverride, sections, ...rest } = overrides
  return {
    meta: {
      businessName: "Test Co",
      ownerName: "Alex",
      marketLabel: "Atlanta, GA",
      reportDate: "July 19, 2026",
      planId: "levelstack-free-snapshot",
      reportTier: "free_snapshot",
      overallScore: 75,
      letterGrade: "C",
      totalFindings: 2,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 1,
      lowCount: 0,
      ...metaOverride,
    },
    executiveSummary: {
      paragraphs: ["Summary."],
      criticalIssue: "Not in top 10 for primary service search",
      firstSteps: [],
      insights: {
        whatProspectsSee: "Prospects see mixed signals.",
        reputationGap: "Reputation gap placeholder text.",
        revenueRisk: "Revenue risk placeholder text.",
      },
    },
    sections: sections ?? [
      {
        id: "search_footprint",
        label: "Search footprint",
        status: "attention",
        score: 75,
        findings: [
          {
            label: "Brand search",
            value: "Your website was not in the top 10 organic results for this query.",
            detail: "Prospects searching your name may land on a competitor first.",
            severity: "high",
          },
        ],
      },
    ],
    actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
    ...rest,
  }
}

describe("isUnavailableStyleFinding", () => {
  it("matches unable-to-verify and GBP not-checked values", () => {
    expect(isUnavailableStyleFinding({ value: UNABLE_TO_VERIFY_VALUE })).toBe(true)
    expect(isUnavailableStyleFinding({ value: GBP_NOT_CHECKED_VALUE })).toBe(true)
    expect(isUnavailableStyleFinding({ value: "Unable to verify Maps listing right now." })).toBe(
      true,
    )
  })

  it("does not match genuine gap copy", () => {
    expect(
      isUnavailableStyleFinding({
        value: "Your website was not in the top 10 organic results for this query.",
      }),
    ).toBe(false)
  })
})

describe("hasScoreableUrgentFinding", () => {
  it("returns true for customer-facing high findings", () => {
    expect(hasScoreableUrgentFinding(baseReport())).toBe(true)
  })

  it("ignores unavailable-style findings even when severity is high", () => {
    const report = baseReport({
      sections: [
        {
          id: "search_footprint",
          label: "Search footprint",
          status: "attention",
          score: 50,
          findings: [
            {
              label: "AI Overview",
              value: UNABLE_TO_VERIFY_VALUE,
              detail: "Provider failed.",
              severity: "high",
            },
          ],
        },
      ],
    })
    expect(hasScoreableUrgentFinding(report)).toBe(false)
  })

  it("ignores action_plan section findings", () => {
    const report = baseReport({
      sections: [
        {
          id: "action_plan",
          label: "Action plan",
          status: "good",
          score: 80,
          findings: [
            {
              label: "Task",
              value: "Fix critical homepage CTA before ads spend increases.",
              detail: "Detail.",
              severity: "critical",
            },
          ],
        },
      ],
    })
    expect(hasScoreableUrgentFinding(report)).toBe(false)
  })
})

describe("shouldUseAlarmSeverity", () => {
  it("is false when overall is 75 with a high finding (dogfood C case)", () => {
    expect(shouldUseAlarmSeverity(baseReport({ meta: { overallScore: 75, letterGrade: "C" } }))).toBe(
      false,
    )
  })

  it("is true when overall is below 60 with a scoreable high finding", () => {
    expect(
      shouldUseAlarmSeverity(
        baseReport({
          meta: { overallScore: 55, letterGrade: "F", criticalCount: 1 },
        }),
      ),
    ).toBe(true)
  })

  it("is false when overall is below 60 but only unavailable-style urgents exist", () => {
    expect(
      shouldUseAlarmSeverity(
        baseReport({
          meta: { overallScore: 42, letterGrade: "F" },
          sections: [
            {
              id: "online_reputation",
              label: "Reputation",
              status: "insufficient_data",
              score: null,
              findings: [
                {
                  label: "Reviews",
                  value: UNABLE_TO_VERIFY_VALUE,
                  detail: "Could not complete check.",
                  severity: "critical",
                },
              ],
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  it("is false at overall 60 even with a high finding", () => {
    expect(
      shouldUseAlarmSeverity(
        baseReport({
          meta: { overallScore: 60, letterGrade: "D" },
        }),
      ),
    ).toBe(false)
  })
})
