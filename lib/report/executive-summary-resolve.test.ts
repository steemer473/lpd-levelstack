import { describe, expect, it } from "vitest"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  resolveCompetitiveSnapshot,
  resolveExecutiveContent,
} from "./executive-summary-resolve"

const baseReport: LevelstackReportJson = {
  meta: {
    businessName: "Test Co",
    ownerName: "Alex",
    marketLabel: "Atlanta, GA",
    reportDate: "June 4, 2026",
    planId: "levelstack-standard",
    overallScore: 68,
    letterGrade: "D",
    totalFindings: 5,
    criticalCount: 0,
    highCount: 1,
    mediumCount: 2,
    lowCount: 1,
  },
  executiveSummary: {
    paragraphs: ["Prospects see X", "Reputation gap Y", "Revenue Z"],
    criticalIssue: "Weak CTA",
    firstSteps: ["Fix homepage"],
    insights: {
      whatProspectsSee: "Structured prospects",
      reputationGap: "Structured gap",
      revenueRisk: "Structured risk",
    },
    highlights: {
      businessImpact: "Impact",
      highestLeverageOpportunity: "Opportunity",
    },
    strengths: ["Strong rank"],
    topOpportunities: ["Fix CTA"],
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
          value: "Not in top 10",
          detail: "Top results: #1 Example (https://example.com); #2 Other (https://other.com)",
          severity: "high",
        },
      ],
    },
    {
      id: "competitive_context",
      label: "Competitive",
      status: "attention",
      score: 55,
      findings: [
        {
          label: 'Service search — "brokerage Atlanta"',
          value: "Competitors ahead",
          detail: "#1 Example (https://example.com)",
          severity: "medium",
        },
      ],
      competitiveGrid: {
        columnHeaders: ["You", "other.com"],
        rows: [
          {
            label: "Page 1 on service search",
            cells: ["Not in top 10", "#1"],
            youColumnIndex: 0,
          },
        ],
      },
    },
    {
      id: "online_reputation",
      label: "Reputation",
      status: "good",
      score: 80,
      findings: [],
    },
    {
      id: "digital_presence",
      label: "Presence",
      status: "attention",
      score: 65,
      findings: [],
    },
    {
      id: "revenue_funnel",
      label: "Funnel",
      status: "attention",
      score: 58,
      findings: [],
    },
  ],
  actionPlan: {
    thisWeek: [{ task: "Fix CTA", who: "You", time: "1h" }],
    thisMonth: [],
    thisQuarter: [],
  },
}

describe("resolveExecutiveContent", () => {
  it("uses structured fields when present", () => {
    const content = resolveExecutiveContent(baseReport)
    expect(content.insights.whatProspectsSee).toBe("Structured prospects")
    expect(content.highlights.criticalIssue).toBe("Weak CTA")
    expect(content.strengths).toContain("Strong rank")
  })

  it("falls back to paragraphs when insights missing", () => {
    const legacy = {
      ...baseReport,
      executiveSummary: {
        paragraphs: ["Para 1", "Para 2", "Para 3"],
        criticalIssue: "Issue",
        firstSteps: [],
      },
    }
    const content = resolveExecutiveContent(legacy)
    expect(content.insights.whatProspectsSee).toBe("Para 1")
    expect(content.insights.reputationGap).toBe("Para 2")
  })
})

describe("resolveCompetitiveSnapshot", () => {
  it("parses SERP rows with honest position labels", () => {
    const snap = resolveCompetitiveSnapshot(baseReport)
    expect(snap?.positionAlert).toContain("Not on Page 1")
    expect(snap?.rows[0]?.domain).toBeTruthy()
    expect(snap?.rows[0]?.serpPosition).toBe(1)
  })
})
