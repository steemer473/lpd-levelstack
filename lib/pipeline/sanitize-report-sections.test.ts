import { describe, expect, it } from "vitest"

import { sanitizeReportSections } from "@/lib/pipeline/sanitize-report-sections"

describe("sanitizeReportSections", () => {
  it("replaces internal limitation strings in findings", () => {
    const [section] = sanitizeReportSections([
      {
        id: "search_footprint",
        label: "Search footprint",
        status: "attention",
        score: 50,
        findings: [
          {
            label: "Google visibility",
            value: "Not fetched yet.",
            detail: "SerpAPI is not configured (SERPAPI_KEY missing).",
            severity: "medium",
          },
        ],
      },
    ])

    expect(section!.findings[0]!.value).not.toContain("Not fetched yet")
    expect(section!.findings[0]!.detail).not.toContain("SERPAPI")
  })
})
