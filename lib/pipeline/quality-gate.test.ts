import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { runQualityGate } from "@/lib/pipeline/quality-gate"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

function minimalReport(
  overrides: Partial<LevelstackReportJson> = {},
): LevelstackReportJson {
  return {
    meta: {
      businessName: "Test Co",
      ownerName: "Alex Owner",
      marketLabel: "Local",
      reportDate: "June 3, 2026",
      planId: "levelstack-standard",
      overallScore: 55,
      letterGrade: "D",
      totalFindings: 2,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 1,
      lowCount: 0,
    },
    executiveSummary: {
      paragraphs: [
        "When prospects search for Alex Owner or Test Co, they see example.com at position #2.",
        "Diagnostic only — you execute fixes.",
      ],
      criticalIssue: "Homepage trust signals are weak for Test Co.",
      firstSteps: ["Fix landing CTA"],
    },
    sections: [
      {
        id: "search_footprint",
        label: "Search",
        status: "attention",
        score: 60,
        findings: [
          {
            label: "Google",
            value: "Site at position #2",
            detail: "Top result: https://example.com/page",
            severity: "medium",
          },
          {
            label: "Owner name",
            value: "Page 1 mixed",
            detail: "https://reviews.example.com listed at #4",
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
            value: "Yelp snippet visible",
            detail: "https://yelp.com/biz/test-co on page 1",
            severity: "medium",
          },
        ],
      },
      {
        id: "revenue_funnel",
        label: "Funnel",
        status: "critical",
        score: 40,
        findings: [
          {
            label: "Ads",
            value: "Paid ad spend active",
            detail: "Landing page needs trust before scaling paid traffic.",
            severity: "high",
          },
        ],
      },
    ],
    actionPlan: {
      thisWeek: [
        {
          task: "Pause ads until landing fixed",
          sub: "Why now: weak CTA",
          who: "You",
          time: "1 hr",
          findingRef: "Paid traffic → landing",
        },
        {
          task: "Verify SERP for Test Co",
          sub: "Screenshot page 1",
          who: "You",
          time: "30 min",
          findingRef: "Google",
        },
      ],
      thisMonth: [],
      thisQuarter: [],
    },
    ...overrides,
  }
}

describe("runQualityGate", () => {
  it("passes a well-formed report", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Test Co",
      ownerName: "Alex Owner",
      hasActiveAdSpend: "yes" as const,
      adPlatforms: "Meta",
      adBudget: "$500",
    }
    const result = runQualityGate(minimalReport(), intake)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it("warns on boilerplate and missing ad copy", () => {
    const intake = {
      ...levelstackIntakeDefaults,
      primaryBusinessName: "Test Co",
      ownerName: "Alex Owner",
      hasActiveAdSpend: "yes" as const,
    }
    const report = minimalReport({
      executiveSummary: {
        paragraphs: ["Improve your SEO for Test Co."],
        criticalIssue: "Generic",
        firstSteps: ["Boost visibility"],
      },
      sections: [
        {
          id: "revenue_funnel",
          label: "Funnel",
          status: "good",
          score: 80,
          findings: [
            {
              label: "Offer",
              value: "Coaching only",
              detail: "Homepage does not state the offer clearly.",
              severity: "low",
            },
          ],
        },
      ],
      actionPlan: {
        thisWeek: [{ task: "Do SEO", who: "You", time: "1 hr" }],
        thisMonth: [],
        thisQuarter: [],
      },
    })
    const result = runQualityGate(report, intake)
    expect(result.passed).toBe(false)
    expect(result.warnings.some((w) => /phrase detected|improve your seo/i.test(w))).toBe(
      true,
    )
    expect(result.warnings.some((w) => /paid traffic|ad spend/i.test(w))).toBe(true)
  })
})
