import { describe, expect, it } from "vitest"

import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { normalizeSynthesisPayload } from "./normalize-llm-synthesis"
import type { ReportSection } from "@/lib/pipeline/report-types"

const baseline: ReportSection[] = [
  {
    id: "search_footprint",
    label: "Search footprint review",
    status: "good",
    score: 78,
    findings: [
      {
        label: "Google — Test Co",
        value: "Your site appears around position #1",
        detail: "Top results: #1 Example (https://example.com)",
        severity: "good",
      },
      {
        label: "Google — Owner",
        value: "Page 1 includes: Example",
        detail: "#1 Example (https://example.com)",
        severity: "low",
      },
    ],
    aiPreview: [
      {
        platform: "Google AI Overview",
        result: "Overview text",
        severity: "medium",
      },
    ],
  },
  {
    id: "online_reputation",
    label: "Reputation",
    status: "attention",
    score: 62,
    findings: [
      {
        label: "Reviews",
        value: "3.2 stars",
        detail: "Six reviews on file.",
        severity: "medium",
      },
    ],
  },
  {
    id: "digital_presence",
    label: "Digital presence",
    status: "attention",
    score: 60,
    findings: [
      {
        label: "Homepage",
        value: "Title present",
        detail: "Meta: Welcome",
        severity: "medium",
      },
    ],
  },
  {
    id: "revenue_funnel",
    label: "Funnel",
    status: "attention",
    score: 55,
    findings: [
      {
        label: "CTA",
        value: "Weak CTA",
        detail: "No clear next step.",
        severity: "high",
      },
    ],
  },
  {
    id: "competitive_context",
    label: "Competitive",
    status: "attention",
    score: 62,
    findings: [
      {
        label: "Service search",
        value: "Competitors ahead",
        detail: "#1 Other (https://other.com)",
        severity: "medium",
      },
    ],
  },
]

const intake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Test Co",
  ownerName: "Alex Owner",
}

describe("normalizeSynthesisPayload", () => {
  it("fills missing finding detail from baseline", () => {
    const payload = normalizeSynthesisPayload(
      {
        sections: [
          {
            id: "search_footprint",
            status: "good",
            score: 80,
            findings: [
              {
                label: "Google — Test Co",
                value: "Strong rank",
                severity: "good",
              },
            ],
          },
        ],
        executiveSummary: {
          paragraphs: ["One", "Two"],
          criticalIssue: "Issue",
          firstSteps: ["Step"],
        },
      },
      baseline,
      intake,
      null,
    )

    expect(payload.sections[0]?.findings[0]?.detail).toContain("Top results")
    expect(payload.sections[0]?.findings[0]?.value).toBe("Strong rank")
  })

  it("normalizes structured executive summary fields", () => {
    const payload = normalizeSynthesisPayload(
      {
        sections: baseline.map((s) => ({ id: s.id, status: s.status, score: s.score })),
        executiveSummary: {
          paragraphs: ["P1", "P2"],
          criticalIssue: "Critical",
          firstSteps: ["Step"],
          insights: {
            whatProspectsSee: "Prospects see example.com at #3",
            reputationGap: "Gap noted",
            revenueRisk: "Ad spend risk",
          },
          highlights: {
            businessImpact: "Impact text",
            highestLeverageOpportunity: "Fix GBP",
          },
          strengths: ["Strong rank", "Extra"],
          topOpportunities: ["Weak CTA"],
        },
      },
      baseline,
      intake,
      null,
    )

    expect(payload.executiveSummary.insights?.whatProspectsSee).toContain("example.com")
    expect(payload.executiveSummary.highlights?.businessImpact).toBe("Impact text")
    expect(payload.executiveSummary.strengths).toHaveLength(2)
    expect(payload.executiveSummary.topOpportunities).toHaveLength(1)
  })
})
