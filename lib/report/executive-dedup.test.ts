import { describe, expect, it } from "vitest"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  computeDistinctHighlightsFromSections,
  filterDistinctActionTasks,
  normalizeFindingKey,
  pickDistinctFindings,
} from "@/lib/report/executive-dedup"

const platinumLikeSections: LevelstackReportJson["sections"] = [
  {
    id: "search_footprint",
    label: "Search footprint",
    status: "attention",
    score: 52,
    findings: [
      {
        label: "Brand search",
        value: "Your website was not in the top 10 organic results for this query.",
        detail: "Top results: #1 Example (https://contactplatinum.com/)",
        severity: "high",
      },
      {
        label: "Local search",
        value: "Your site appears around position #1 for this query.",
        detail: "Local pack detail",
        severity: "low",
      },
      {
        label: "Snippet compare",
        value: "Could not compare snippets for the unqualified brand search — your site did not rank in top results.",
        detail: "Snippet detail",
        severity: "high",
      },
    ],
  },
  {
    id: "digital_presence",
    label: "Digital presence",
    status: "attention",
    score: 62,
    findings: [
      {
        label: "Title tag",
        value: "Title tag is generic and may not differentiate your brand in search.",
        detail: "Title detail",
        severity: "high",
      },
    ],
  },
]

describe("executive-dedup", () => {
  it("normalizes finding keys for comparison", () => {
    expect(normalizeFindingKey("Hello World. ")).toBe("hello world")
  })

  it("picks distinct findings and skips duplicates", () => {
    const findings = platinumLikeSections[0]!.findings.map((f) => ({
      ...f,
      sectionId: "search_footprint",
      sectionScore: 52,
    }))
    const picked = pickDistinctFindings(findings, new Set(), 2)
    expect(picked).toHaveLength(2)
    expect(picked[0]).not.toBe(picked[1])
  })

  it("dedupes executive highlights so critical and leverage differ", () => {
    const distinct = computeDistinctHighlightsFromSections(
      platinumLikeSections,
      "Platinum Real Estate",
      { primaryService: "real estate services" },
    )

    expect(distinct.criticalIssue).toContain("top 10")
    expect(distinct.highestLeverageOpportunity).not.toBe(distinct.criticalIssue)
    expect(distinct.topOpportunities[0]).not.toBe(distinct.criticalIssue)
  })

  it("polishes legacy snippet jargon when picking leverage findings", () => {
    const distinct = computeDistinctHighlightsFromSections(
      [platinumLikeSections[0]!],
      "Platinum Real Estate",
    )
    expect(distinct.highestLeverageOpportunity).toContain("business name without a city")
    expect(distinct.highestLeverageOpportunity).not.toContain("unqualified")
  })

  it("filters placeholder leverage findings like Not fetched yet", () => {
    const sections: LevelstackReportJson["sections"] = [
      platinumLikeSections[0]!,
      {
        id: "digital_presence",
        label: "Digital presence",
        status: "attention",
        score: 62,
        findings: [
          {
            label: "Google Business Profile (GBP)",
            value: "Not fetched yet.",
            detail: "internal",
            severity: "high",
          },
          {
            label: "Homepage signals",
            value: "Title tag is generic and may not differentiate your brand in search.",
            detail: "detail",
            severity: "high",
          },
        ],
      },
    ]

    const distinct = computeDistinctHighlightsFromSections(sections, "Platinum Real Estate")

    expect(distinct.highestLeverageOpportunity).not.toBe("Not fetched yet.")
    expect(distinct.highestLeverageOpportunity).toContain("Title tag")
  })

  it("fills strengths and opportunities when only high-severity findings exist", () => {
    const sections: LevelstackReportJson["sections"] = [
      {
        id: "search_footprint",
        label: "Search footprint",
        status: "attention",
        score: 48,
        findings: [
          {
            label: "Brand",
            value: "Your website was not in the top 10 organic results for this query.",
            detail: "detail",
            severity: "high",
          },
        ],
      },
      {
        id: "digital_presence",
        label: "Digital presence",
        status: "attention",
        score: 62,
        findings: [
          {
            label: "Title",
            value: "Homepage title lacks local service keywords prospects expect.",
            detail: "detail",
            severity: "high",
          },
        ],
      },
      {
        id: "online_reputation",
        label: "Reputation",
        status: "attention",
        score: 58,
        findings: [],
      },
    ]

    const distinct = computeDistinctHighlightsFromSections(sections, "Test Co")

    expect(distinct.strengths.length).toBeGreaterThan(0)
    expect(distinct.topOpportunities.length).toBeGreaterThan(0)
    expect(distinct.strengths[0]).toContain("62/100")
    expect(distinct.topOpportunities[0]).toContain("search footprint")
  })

  it("filters duplicate action tasks", () => {
    const tasks = filterDistinctActionTasks(
      [
        { task: "Your website was not in the top 10 organic results for this query." },
        { task: "Update homepage title for clarity" },
      ],
      ["Your website was not in the top 10 organic results for this query."],
    )
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.task).toContain("homepage title")
  })
})
