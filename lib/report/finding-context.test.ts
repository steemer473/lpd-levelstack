import { describe, expect, it } from "vitest"

import type { ReportFinding } from "@/lib/pipeline/report-types"
import { SNIPPET_COMPARE_SUCCESS } from "@/lib/report/customer-copy"
import {
  effectiveFindingSeverity,
  extractRankFromValue,
  findingContextLine,
  findingSeverityExplanation,
  formatFindingLabel,
  formatPrintFindingBlock,
} from "@/lib/report/finding-context"

describe("formatFindingLabel", () => {
  it("formats raw review queries", () => {
    expect(
      formatFindingLabel(
        "online_reputation",
        "Level Play Digital Atlanta reviews",
      ),
    ).toBe("Review search: Level Play Digital Atlanta")
  })

  it("preserves Google search labels", () => {
    expect(
      formatFindingLabel("search_footprint", 'Google — "Acme Plumbing"'),
    ).toBe('Google — "Acme Plumbing"')
  })
})

describe("findingContextLine", () => {
  it("explains owner-name search findings", () => {
    const finding: ReportFinding = {
      label: 'Google — "Jane Doe"',
      value: "When someone searches your name, page 1 shows: Jane Doe LLC",
      detail: "Top results",
      severity: "medium",
    }
    expect(findingContextLine("search_footprint", finding)).toContain("owner")
  })

  it("explains reputation review searches", () => {
    const finding: ReportFinding = {
      label: "Review search: Acme Plumbing",
      value: "No review profile found — your website ranks instead of third-party reviews",
      detail: "homepage first",
      severity: "high",
    }
    expect(findingContextLine("online_reputation", finding)).toContain("star ratings")
  })
})

describe("effectiveFindingSeverity", () => {
  it("upgrades rank #1 business search to good even when stored as medium", () => {
    const finding: ReportFinding = {
      label: 'Google — "Acme Plumbing"',
      value: "Your site appears around position #1",
      detail: "Top results: #1 Acme (https://acme.com)",
      severity: "medium",
    }
    expect(effectiveFindingSeverity("search_footprint", finding)).toBe("good")
  })

  it("upgrades snippet compare success to good", () => {
    const finding: ReportFinding = {
      label: "What your site says vs what Google shows",
      value: SNIPPET_COMPARE_SUCCESS,
      detail: "Your website description: hello",
      severity: "medium",
    }
    expect(effectiveFindingSeverity("search_footprint", finding)).toBe("good")
  })

  it("keeps medium for automated AI citation placeholder", () => {
    const finding: ReportFinding = {
      label: "ChatGPT / Perplexity",
      value: "Live AI citation checks are not automated in v1; improve entity clarity.",
      detail: "",
      severity: "medium",
    }
    expect(effectiveFindingSeverity("search_footprint", finding)).toBe("medium")
  })
})

describe("extractRankFromValue", () => {
  it("parses position from business search value", () => {
    expect(extractRankFromValue("Your site appears around position #1 for this query.")).toBe(1)
  })
})

describe("findingSeverityExplanation", () => {
  it("explains rank #1 as strong visibility", () => {
    const finding: ReportFinding = {
      label: 'Google — "Acme"',
      value: "Your site appears around position #1",
      detail: "These are the top Google results prospects see: #1 Acme (https://acme.com)",
      severity: "good",
    }
    expect(findingSeverityExplanation("search_footprint", finding)).toContain(
      "Strong visibility",
    )
  })

  it("explains why AI placeholder still shows Attention", () => {
    const finding: ReportFinding = {
      label: "ChatGPT / Perplexity",
      value: "Live AI citation checks are not automated in v1; improve entity clarity.",
      detail: "",
      severity: "medium",
    }
    expect(findingSeverityExplanation("search_footprint", finding)).toContain(
      "not a penalty against your Google rank",
    )
  })

  it("explains own-site review search gap", () => {
    const finding: ReportFinding = {
      label: "Review search: Level Play Digital",
      value:
        "No review profile found — your website ranks instead of third-party reviews",
      detail: "When prospects search for reviews, Google shows your homepage first",
      severity: "high",
    }
    expect(findingSeverityExplanation("online_reputation", finding)).toContain(
      "Yelp or Google review",
    )
  })

  it("explains missing top-10 search placement", () => {
    const finding: ReportFinding = {
      label: 'Google — "Acme"',
      value: "Your website was not in the top 10 organic results for this query.",
      detail: "Top results: #1 rival",
      severity: "high",
    }
    expect(findingSeverityExplanation("search_footprint", finding)).toContain("page 1")
  })
})

describe("formatPrintFindingBlock", () => {
  it("returns structured print fields", () => {
    const finding: ReportFinding = {
      label: "Homepage signals",
      value: "First impression on your homepage: Title: “Acme”",
      detail: "Meta description: …",
      severity: "medium",
    }
    const block = formatPrintFindingBlock("digital_presence", finding)
    expect(block.label).toBe("Homepage signals")
    expect(block.context.length).toBeGreaterThan(10)
    expect(block.flag).toBe("Good")
    expect(block.explanation.length).toBeGreaterThan(10)
  })
})
