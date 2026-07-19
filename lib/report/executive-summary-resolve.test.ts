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
  it("uses finding-driven insight copy and preserves distinct highlights", () => {
    const content = resolveExecutiveContent(baseReport)
    expect(content.insights.whatProspectsSee).toContain("When prospects search")
    expect(content.insights.whatProspectsSee).toContain("From public research:")
    expect(content.structuredInsights?.whatProspectsSee.length).toBeGreaterThan(0)
    expect(content.highlights.criticalIssue).toBe("Not in top 10")
    expect(content.highlights.highestLeverageOpportunity).not.toBe(
      content.highlights.criticalIssue,
    )
    expect(content.strengths).toContain("Strong rank")
  })

  it("still builds insights when executiveSummary.insights is missing", () => {
    const legacy = {
      ...baseReport,
      executiveSummary: {
        paragraphs: ["Para 1", "Para 2", "Para 3"],
        criticalIssue: "Issue",
        firstSteps: [],
      },
    }
    const content = resolveExecutiveContent(legacy)
    expect(content.insights.whatProspectsSee).toContain("When prospects search")
    expect(content.insights.reputationGap).toContain("Social presence compares")
  })

  it("falls back to urgent section finding when deduped criticalIssue is generic", () => {
    const report: LevelstackReportJson = {
      ...baseReport,
      executiveSummary: {
        paragraphs: ["Prospects see X", "Reputation gap Y", "Revenue Z"],
        criticalIssue: "Review search footprint first.",
        firstSteps: [],
      },
      sections: [
        {
          id: "search_footprint",
          label: "Search",
          status: "good",
          score: 85,
          findings: [
            {
              label: "Brand search",
              value: "Position #1 for Test Co",
              detail: "Site ranks first.",
              severity: "good",
            },
          ],
        },
        {
          id: "online_reputation",
          label: "Reputation",
          status: "critical",
          score: 30,
          findings: [
            {
              label: "Reviews",
              value: "No reviews found on major platforms",
              detail: "Trust gap for new prospects.",
              severity: "high",
            },
          ],
        },
        ...baseReport.sections.filter(
          (s) => s.id !== "search_footprint" && s.id !== "online_reputation",
        ),
      ],
    }

    const content = resolveExecutiveContent(report)
    expect(content.highlights.criticalIssue).toBe("No reviews found on major platforms")
  })

  it("uses section finding when dedup returns generic but urgent findings exist", () => {
    const report: LevelstackReportJson = {
      ...baseReport,
      executiveSummary: {
        paragraphs: ["A", "B", "C"],
        criticalIssue: "Review search footprint first.",
        firstSteps: [],
      },
      sections: [
        {
          id: "digital_presence",
          label: "Presence",
          status: "attention",
          score: 40,
          findings: [
            {
              label: "GBP",
              value: "Not fetched yet",
              detail: "Internal pipeline note.",
              severity: "high",
            },
          ],
        },
        {
          id: "action_plan",
          label: "Action plan",
          status: "attention",
          score: 55,
          findings: [],
        },
      ],
    }

    const content = resolveExecutiveContent(report)
    expect(content.highlights.criticalIssue).toBe("Not fetched yet")
  })
})

describe("resolveCompetitiveSnapshot", () => {
  it("parses SERP rows with honest position labels", () => {
    const snap = resolveCompetitiveSnapshot(baseReport)
    expect(snap?.positionAlert).toContain("Not on Page 1")
    expect(snap?.rows[0]?.domain).toBeTruthy()
    expect(snap?.rows[0]?.serpPosition).toBe(1)
  })

  it("rejects own domain stored in meta when buyer host is known", () => {
    const freeReport: LevelstackReportJson = {
      ...baseReport,
      meta: {
        ...baseReport.meta,
        reportTier: "free_snapshot",
        upgradeTeasers: {
          previewCompetitor: {
            rank: 1,
            domain: "levelplaydigital.com",
          },
        },
      },
      sections: [
        {
          id: "search_footprint",
          label: "Search",
          status: "good",
          score: 80,
          findings: [
            {
              label: 'Brand search — "Level Play Digital"',
              value: "Your site appears around position #1",
              detail:
                'your domain (levelplaydigital.com) appears at position #1. Top results: #1 Level Play Digital (https://levelplaydigital.com/); #2 Rival (https://rival-example.com/)',
              severity: "good",
            },
          ],
        },
      ],
    }
    const snap = resolveCompetitiveSnapshot(freeReport)
    expect(snap?.rows[0]?.domain).toBe("rival-example.com")
  })

  it("uses upgradeTeasers on free tier and exposes one preview competitor row", () => {
    const freeReport: LevelstackReportJson = {
      ...baseReport,
      meta: {
        ...baseReport.meta,
        reportTier: "free_snapshot",
        upgradeTeasers: {
          competitivePositionAlert: "Your position: Not on Page 1",
          competitiveSearchQuery: "brokerage Atlanta, GA",
          competitorCount: 3,
          previewCompetitor: {
            rank: 1,
            domain: "example.com",
            title: "Example Business",
          },
        },
      },
      sections: baseReport.sections.filter(
        (s) => s.id !== "competitive_context" && s.id !== "revenue_funnel",
      ),
    }
    const snap = resolveCompetitiveSnapshot(freeReport)
    expect(snap?.positionAlert).toContain("Not on Page 1")
    expect(snap?.rows).toHaveLength(1)
    expect(snap?.rows[0]?.domain).toBe("example.com")
    expect(snap?.competitorCount).toBe(3)
    expect(snap?.previewTitle).toBe("Example Business")
  })

  it("dedupes executive highlights for free snapshot reports", () => {
    const freeReport: LevelstackReportJson = {
      ...baseReport,
      meta: { ...baseReport.meta, reportTier: "free_snapshot" },
      executiveSummary: {
        ...baseReport.executiveSummary,
        criticalIssue: "Not in top 10",
        highlights: {
          businessImpact: "Impact",
          highestLeverageOpportunity: "Not in top 10",
        },
        topOpportunities: ["Not in top 10", "Fix CTA"],
      },
      sections: [
        {
          id: "search_footprint",
          label: "Search",
          status: "attention",
          score: 52,
          findings: [
            {
              label: "Brand",
              value: "Not in top 10",
              detail: "detail",
              severity: "high",
            },
            {
              label: "Snippet",
              value: "Snippet comparison unavailable",
              detail: "detail",
              severity: "high",
            },
          ],
        },
        {
          id: "digital_presence",
          label: "Presence",
          status: "attention",
          score: 60,
          findings: [
            {
              label: "Title",
              value: "Homepage title lacks local keywords",
              detail: "detail",
              severity: "high",
            },
          ],
        },
      ],
      actionPlan: baseReport.actionPlan,
    }

    const content = resolveExecutiveContent(freeReport)
    expect(content.highlights.criticalIssue).toBe("Not in top 10")
    expect(content.highlights.highestLeverageOpportunity).not.toBe("Not in top 10")
    expect(content.topOpportunities[0]).not.toBe("Not in top 10")
  })
})
