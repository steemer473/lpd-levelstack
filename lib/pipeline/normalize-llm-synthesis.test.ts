import { describe, expect, it } from "vitest"

import { levelstackIntakeTestDefaults } from "@/lib/intake/schema"
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
    id: "social_offsite",
    label: "Social & off-site presence",
    status: "attention",
    score: 62,
    findings: [
      {
        label: "LinkedIn",
        value: "No LinkedIn profile found in search",
        detail: "Prospects may not find a clear LinkedIn profile.",
        severity: "high",
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
  ...levelstackIntakeTestDefaults,
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

  it("preserves baseline competitive primary finding when LLM rewrites section", () => {
    const payload = normalizeSynthesisPayload(
      {
        sections: [
          {
            id: "competitive_context",
            status: "attention",
            score: 50,
            findings: [
              {
                label: "Competitor Landscape",
                value: "Generic prose",
                detail: "No evidence",
                severity: "medium",
              },
              {
                label: "Market Differentiation",
                value: "More generic prose",
                detail: "Still no evidence",
                severity: "low",
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

    const competitive = payload.sections.find((s) => s.id === "competitive_context")!
    expect(competitive.findings[0]?.label).toBe("Service search")
    expect(competitive.findings[0]?.value).toBe("Competitors ahead")
    expect(competitive.findings.some((f) => f.label === "Competitor Landscape")).toBe(
      false,
    )
  })

  it("preserves good baseline reputation findings when LLM injects alarmist copy", () => {
    const reputationBaseline: ReportSection = {
      ...baseline[2]!,
      findings: [
        {
          label: "Indexed complaints",
          value: "No indexed complaints naming Level Play Digital",
          detail: "We searched complaint-oriented queries and found no hits.",
          severity: "good",
        },
      ],
    }

    const sections = [
      baseline[0]!,
      baseline[1]!,
      reputationBaseline,
      ...baseline.slice(3),
    ]

    const payload = normalizeSynthesisPayload(
      {
        sections: [
          {
            id: "online_reputation",
            status: "critical",
            score: 20,
            findings: [
              {
                label: "High Trust Deficit",
                value: "Negative employee sentiment detected",
                detail: "Unverified LLM prose",
                severity: "critical",
              },
              {
                label: "Indexed complaints",
                value: "Multiple complaints found",
                detail: "Should not override good baseline",
                severity: "critical",
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
      sections,
      intake,
      null,
    )

    const reputation = payload.sections.find((s) => s.id === "online_reputation")!
    expect(reputation.findings).toHaveLength(1)
    expect(reputation.findings[0]?.label).toBe("Indexed complaints")
    expect(reputation.findings[0]?.severity).toBe("good")
    expect(reputation.findings.some((f) => f.label === "High Trust Deficit")).toBe(
      false,
    )
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

  it("floors search_footprint LLM score at baseline when brand rank is strong", () => {
    const payload = normalizeSynthesisPayload(
      {
        sections: [
          {
            id: "search_footprint",
            status: "critical",
            score: 45,
            findings: baseline[0]!.findings,
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

    const search = payload.sections.find((s) => s.id === "search_footprint")!
    expect(search.score).toBe(78)
    expect(search.status).toBe("good")
  })

  it("strips hallucinated Market Positioning / Competitor Visibility supplementals", () => {
    const competitiveBaseline: ReportSection = {
      ...baseline[5]!,
      findings: [
        {
          label:
            'Service search — "marketing operations software Atlanta, GA"',
          value:
            "Top domains on page 1 include: careerbuilder.com, monday.com, workamajig.com",
          detail:
            "#1 Marketing Operations Jobs (https://www.indeed.com/q-jobs.html) [directory/platform]; #2 Director (https://www.careerbuilder.com/job-details/x); #3 monday blog (https://monday.com/blog/x)",
          severity: "medium",
        },
      ],
    }
    const sections = [
      ...baseline.slice(0, 5),
      competitiveBaseline,
    ]

    const payload = normalizeSynthesisPayload(
      {
        sections: [
          {
            id: "competitive_context",
            status: "critical",
            score: 40,
            findings: [
              {
                label:
                  'Service search — "marketing operations software Atlanta, GA"',
                value:
                  "Top domains on page 1 include: careerbuilder.com, monday.com, workamajig.com",
                detail: "Should keep primary",
                severity: "medium",
              },
              {
                label: "Competitor Visibility",
                value:
                  "Top domains on page 1 include: careerbuilder.com, monday.com, workamajig.com",
                detail:
                  "Competitors like Vora Marketing Group rank higher in local searches.",
                severity: "high",
              },
              {
                label: "Market Positioning",
                value:
                  "Top domains on page 1 include: careerbuilder.com, monday.com, workamajig.com",
                detail:
                  "Your unique offerings are not highlighted in search results.",
                severity: "medium",
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
      sections,
      intake,
      null,
    )

    const competitive = payload.sections.find(
      (s) => s.id === "competitive_context",
    )!
    expect(competitive.findings).toHaveLength(1)
    expect(competitive.findings[0]?.label).toContain("Service search")
    expect(
      competitive.findings.some((f) => f.label === "Market Positioning"),
    ).toBe(false)
    expect(
      competitive.findings.some((f) => f.label === "Competitor Visibility"),
    ).toBe(false)
  })
})
