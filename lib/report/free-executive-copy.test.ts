import { describe, expect, it } from "vitest"

import type { AuditSignalResult } from "@/lib/audit/types"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  buildPriorityFindingFromSignals,
  customerFacingTopFinding,
  diagnosticAreaCounts,
  diagnosticAreaGrid,
  freeExecutiveHeadline,
  freeExecutiveNextDecisions,
  freeScanIssueCounts,
  freeScoreBasisLine,
  resolvePriorityFinding,
  verifiedChecksList,
} from "@/lib/report/free-executive-copy"
import { ensureCriticalIssue, resolveExecutiveContent } from "@/lib/report/executive-summary-resolve"
import { resolveDistinctHighlights } from "@/lib/report/executive-dedup"
import { UPGRADE_BANNER, PRODUCT_NAMES, LOCKED_SECTION_MODAL } from "@/lib/report/outcome-copy"

function baseMeta(
  overrides: Partial<LevelstackReportJson["meta"]> = {},
): LevelstackReportJson["meta"] {
  return {
    businessName: "LT Printing & Promotion",
    ownerName: "Owner",
    marketLabel: "Atlanta, GA",
    reportDate: "August 6, 2026",
    planId: "levelstack-free-snapshot",
    reportTier: "free_snapshot",
    overallScore: 79,
    letterGrade: "C",
    totalFindings: 6,
    criticalCount: 1,
    highCount: 1,
    mediumCount: 0,
    lowCount: 4,
    ...overrides,
  }
}

function emptySections(): LevelstackReportJson["sections"] {
  return [
    {
      id: "search_footprint",
      label: "Search",
      status: "good",
      score: 86,
      findings: [
        {
          label: "Brand search",
          value: "You rank #1 for your brand name",
          detail: "Strong brand match.",
          severity: "good",
        },
      ],
    },
    {
      id: "social_offsite",
      label: "Social",
      status: "attention",
      score: 72,
      findings: [],
    },
  ]
}

describe("diagnosticAreaCounts", () => {
  it("counts 2 checked, 6 total, 4 unopened (excludes action_plan)", () => {
    expect(diagnosticAreaCounts()).toEqual({
      checked: 2,
      total: 6,
      unopened: 4,
    })
  })
})

describe("diagnosticAreaGrid", () => {
  it("returns 6 areas with Search and Social unlocked", () => {
    const grid = diagnosticAreaGrid()
    expect(grid).toHaveLength(6)
    expect(grid.filter((a) => a.unlocked)).toHaveLength(2)
    expect(grid.filter((a) => !a.unlocked)).toHaveLength(4)
    expect(grid[0]).toMatchObject({ id: "search_footprint", unlocked: true })
    expect(grid[1]).toMatchObject({ id: "social_offsite", unlocked: true })
    expect(grid.map((a) => a.id)).toEqual([
      "search_footprint",
      "social_offsite",
      "online_reputation",
      "digital_presence",
      "revenue_funnel",
      "competitive_context",
    ])
  })
})

describe("freeScoreBasisLine", () => {
  it("names locked areas and states the grade will change", () => {
    const line = freeScoreBasisLine()
    expect(line).toContain("Based on 2 of 6 areas checked")
    expect(line).toContain("This grade will change as locked areas are opened")
    expect(line).toContain("Reputation")
    expect(line).toContain("Digital Presence")
    expect(line).toContain("Revenue Funnel")
    expect(line).toContain("Competitive Context")
    expect(line).toContain("still locked")
    expect(line).not.toMatch(/\d+\/100/)
    expect(line).not.toMatch(/\([A-F][+-]?\)/)
  })
})

describe("freeScanIssueCounts", () => {
  it("prefers signalRows over meta when present", () => {
    const report = {
      meta: baseMeta({ criticalCount: 9, highCount: 9, lowCount: 9 }),
      executiveSummary: {
        paragraphs: [],
        criticalIssue: "",
        firstSteps: [],
      },
      sections: emptySections(),
      actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
      signalRows: [
        { label: "A", value: "FAIL", percent: 0, tone: "red" },
        { label: "B", value: "WARNING", percent: 50, tone: "amber" },
        { label: "C", value: "WARNING", percent: 50, tone: "amber" },
        { label: "D", value: "PASS", percent: 100, tone: "green" },
      ],
    } as LevelstackReportJson

    expect(freeScanIssueCounts(report)).toEqual({
      failed: 1,
      warnings: 2,
      passed: 1,
    })
  })

  it("falls back to meta when signalRows are absent", () => {
    const report = {
      meta: baseMeta({ criticalCount: 1, highCount: 2, lowCount: 3 }),
      executiveSummary: {
        paragraphs: [],
        criticalIssue: "",
        firstSteps: [],
      },
      sections: emptySections(),
      actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
    } as LevelstackReportJson

    expect(freeScanIssueCounts(report)).toEqual({
      failed: 1,
      warnings: 2,
      passed: 3,
    })
  })
})

describe("freeExecutiveHeadline", () => {
  it("uses failure wording when criticalCount > 0", () => {
    const report = {
      meta: baseMeta({ criticalCount: 1 }),
      executiveSummary: {
        paragraphs: [],
        criticalIssue: "Snippet mismatch",
        firstSteps: [],
      },
      sections: emptySections(),
      actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
    } as LevelstackReportJson

    const h = freeExecutiveHeadline(report)
    expect(h.state).toBe("has_failures")
    expect(h.lead).toContain("We checked 2 of the 6 areas")
    expect(h.lead).toContain("LT Printing & Promotion")
    expect(h.lead).toContain("1 critical issue")
    expect(h.follow).toContain("4 areas we haven't opened")
    expect(h.full).not.toMatch(/both came back clean/i)
    expect(h.full).not.toMatch(/\bin\s*[.,]/)
    expect(h.full).not.toContain(" in .")
    expect(h.full).not.toContain(" in ,")
  })

  it("stays clean when marketLabel is empty (headline never interpolates market)", () => {
    const report = {
      meta: baseMeta({ criticalCount: 1, marketLabel: "" }),
      executiveSummary: {
        paragraphs: [],
        criticalIssue: "Snippet mismatch",
        firstSteps: [],
      },
      sections: emptySections(),
      actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
    } as LevelstackReportJson

    const h = freeExecutiveHeadline(report)
    expect(h.full).not.toMatch(/\bin\s*[.,]/)
    expect(h.full).not.toContain("strengthen conversion in")
  })

  it("uses clean-scan wording when criticalCount is 0", () => {
    const report = {
      meta: baseMeta({ criticalCount: 0, overallScore: 93, letterGrade: "A" }),
      executiveSummary: {
        paragraphs: [],
        criticalIssue: "",
        firstSteps: [],
      },
      sections: emptySections(),
      actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
    } as LevelstackReportJson

    const h = freeExecutiveHeadline(report)
    expect(h.state).toBe("clean_scan")
    expect(h.lead).toContain("both came back clean")
    expect(h.lead).not.toMatch(/critical/i)
    expect(h.follow).toContain("4 areas")
    expect(h.full).not.toMatch(/critical/i)
  })
})

describe("buildPriorityFindingFromSignals", () => {
  it("prefers snippet accuracy and interpolates evidence", () => {
    const signals: AuditSignalResult[] = [
      {
        id: "social_platform_coverage",
        label: "Social Platform Coverage",
        status: "fail",
        finding: "No major social platforms detected.",
        evidence: [],
        tier: "free",
      },
      {
        id: "search_snippet_accuracy",
        label: "Search Snippet Accuracy",
        status: "fail",
        finding: "Google messaging differs.",
        evidence: [
          "Promo products since 1999",
          "Custom printing and branded merchandise",
        ],
        tier: "free",
      },
    ]

    const finding = buildPriorityFindingFromSignals(signals)
    expect(finding?.variantId).toBe("search_snippet_accuracy")
    expect(finding?.observation).toContain("Promo products since 1999")
    expect(finding?.observation).toContain("Custom printing and branded merchandise")
    expect(finding?.consequence).toMatch(/Prospects decide/i)
  })

  it("returns null when nothing failed", () => {
    const signals: AuditSignalResult[] = [
      {
        id: "google_indexing",
        label: "Google Indexing",
        status: "pass",
        finding: "Indexed",
        evidence: [],
        tier: "free",
      },
      {
        id: "meta_og_completeness",
        label: "Meta & OG Completeness",
        status: "warning",
        finding: "2/4 tags present",
        evidence: [],
        tier: "free",
      },
    ]
    expect(buildPriorityFindingFromSignals(signals)).toBeNull()
  })
})

describe("customerFacingTopFinding", () => {
  it("does not email raw meta tag checklists for warnings", () => {
    const signals: AuditSignalResult[] = [
      {
        id: "meta_og_completeness",
        label: "Meta & OG Completeness",
        status: "warning",
        finding: "2/4 tags present: Title tag (✓), Meta description (✗)",
        evidence: [],
        tier: "free",
      },
    ]
    const top = customerFacingTopFinding(signals)
    expect(top).toBeTruthy()
    expect(top).not.toMatch(/✓/)
  })
})

describe("LT Printing contradiction regression", () => {
  it("priority slot uses failed signal, not the #1 brand-rank win", () => {
    const report: LevelstackReportJson = {
      meta: baseMeta({
        overallScore: 79,
        letterGrade: "C",
        criticalCount: 1,
        highCount: 1,
        totalFindings: 6,
      }),
      executiveSummary: {
        paragraphs: ["You rank well."],
        criticalIssue: "You rank #1 for your brand name",
        firstSteps: [],
        strengths: ["You rank #1 for your brand name"],
        topOpportunities: ["Fix snippet mismatch"],
      },
      sections: emptySections(),
      actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
      signalRows: [
        { label: "Google Indexing", value: "PASS", percent: 100, tone: "green" },
        {
          label: "Search Snippet Accuracy",
          value: "FAIL",
          percent: 0,
          tone: "red",
        },
        {
          label: "Social Platform Coverage",
          value: "WARNING",
          percent: 50,
          tone: "amber",
        },
        { label: "Subdomain Exposure", value: "PASS", percent: 100, tone: "green" },
      ],
    }

    const content = resolveExecutiveContent(report)
    expect(content.highlights.criticalIssue).toBeTruthy()
    expect(content.highlights.criticalIssue).not.toMatch(/rank #1/i)
    expect(content.highlights.priorityFinding?.variantId).toBe(
      "search_snippet_accuracy",
    )

    const priority = content.highlights.priorityFinding
    expect(priority).toBeTruthy()
    expect(priority!.observation).toBeTruthy()
    expect(priority!.consequence).toBeTruthy()
    expect(priority!.consequence).not.toContain(priority!.observation)
    expect(priority!.fullText).toBe(
      `${priority!.observation} ${priority!.consequence}`,
    )
    // Print "What it means" cards use observation vs consequence separately —
    // businessImpact must match consequence so cards do not repeat the same sentence.
    expect(content.highlights.businessImpact).toBe(priority!.consequence)
    expect(content.highlights.criticalIssue).toBe(priority!.fullText)

    const headline = freeExecutiveHeadline(report)
    expect(headline.failedCount).toBe(1)
    expect(headline.unopened).toBe(4)
    expect(report.meta.criticalCount).toBe(1)
  })
})

describe("clean-scan state", () => {
  it("suppresses priority finding and omits critical from headline", () => {
    const report: LevelstackReportJson = {
      meta: baseMeta({
        overallScore: 93,
        letterGrade: "A",
        criticalCount: 0,
        highCount: 1,
        totalFindings: 3,
      }),
      executiveSummary: {
        paragraphs: [],
        criticalIssue: "You rank #1 for your brand name",
        firstSteps: [],
        strengths: ["You rank #1 for your brand name"],
        topOpportunities: [],
      },
      sections: emptySections(),
      actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
      signalRows: [
        { label: "Google Indexing", value: "PASS", percent: 100, tone: "green" },
        {
          label: "Search Snippet Accuracy",
          value: "WARNING",
          percent: 50,
          tone: "amber",
        },
        { label: "Meta & OG Completeness", value: "PASS", percent: 100, tone: "green" },
        {
          label: "Social Platform Coverage",
          value: "PASS",
          percent: 100,
          tone: "green",
        },
        { label: "Subdomain Exposure", value: "PASS", percent: 100, tone: "green" },
        {
          label: "Directory Presence",
          value: "PASS",
          percent: 100,
          tone: "green",
        },
      ],
    }

    const content = resolveExecutiveContent(report)
    expect(content.highlights.criticalIssue).toBeNull()
    expect(content.highlights.priorityFinding).toBeNull()

    const headline = freeExecutiveHeadline(report)
    expect(headline.state).toBe("clean_scan")
    expect(headline.full).not.toMatch(/critical/i)
    expect(headline.unopened).toBe(4)

    const verified = verifiedChecksList(report.signalRows)
    expect(verified).not.toContain("Subdomain Exposure")
    expect(verified.length).toBeGreaterThan(0)
  })

  it("ensureCriticalIssue returns null for positive-only findings", () => {
    const report: LevelstackReportJson = {
      meta: baseMeta({ criticalCount: 0, highCount: 0 }),
      executiveSummary: {
        paragraphs: [],
        criticalIssue: "Review search footprint first.",
        firstSteps: [],
      },
      sections: emptySections(),
      actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
      signalRows: [
        { label: "Google Indexing", value: "PASS", percent: 100, tone: "green" },
      ],
    }

    const distinct = resolveDistinctHighlights(report)
    expect(ensureCriticalIssue(report, distinct)).toBeNull()
    expect(resolvePriorityFinding(report)).toBeNull()
  })
})

describe("outcome-copy drift", () => {
  it("keeps approved product names and policy-safe upgrade copy", () => {
    expect(PRODUCT_NAMES.free).toBe("Visibility Snapshot")
    expect(PRODUCT_NAMES.paid).toBe("Action Roadmap")
    expect(UPGRADE_BANNER.button).toBe("Unlock Action Roadmap — $97")
    expect(UPGRADE_BANNER.headerLine(2, 6)).toBe("You've seen 2 of 6 areas.")
    expect(UPGRADE_BANNER.valueLine).toMatch(/opens all six areas/i)
    expect(UPGRADE_BANNER.ctaSuffix).toMatch(/one-time, no subscription/i)
    expect(UPGRADE_BANNER.body).toMatch(/assessment fee credits/i)
    expect(UPGRADE_BANNER.body).not.toMatch(/at capacity/i)
    expect(UPGRADE_BANNER.body).not.toMatch(/spots remaining/i)
    expect(UPGRADE_BANNER.secondaryCta).toMatch(/\$297/)
    expect(LOCKED_SECTION_MODAL.creditNote).toMatch(/founding-rate month/i)
  })
})

describe("freeExecutiveNextDecisions", () => {
  it("returns three fixed DIY steps with distinct incognito copy", () => {
    const decisions = freeExecutiveNextDecisions({
      meta: baseMeta({
        businessName: "LT Printing & Promotion",
        ownerName: "LT Printing & Promotion",
      }),
    })
    expect(decisions).toHaveLength(3)
    expect(decisions[0]?.title).toBe(
      'Confirm what strangers see for "LT Printing & Promotion"',
    )
    expect(decisions[0]?.summary).toBe(
      'Next step: Search in a private/incognito browser for "LT Printing & Promotion" — no personal history.',
    )
    expect(decisions[0]?.summary).not.toMatch(
      /"LT Printing & Promotion" and "LT Printing/,
    )
    expect(decisions[1]?.title).toBe(
      "Check whether prospects can verify you on social",
    )
    expect(decisions[1]?.summary).toBe(
      "Next step: Search your business name on LinkedIn and Facebook. If no credible, active profile appears, that's a trust gap you can't see from inside the business.",
    )
    expect(decisions[2]?.title).toBe(
      "Read your own Google result the way a stranger would",
    )
    expect(decisions[2]?.summary).toBe(
      "Next step: Look at the title and description Google shows under your link. If it doesn't clearly say what you sell and why you're the right call, that's the pitch losing prospects before they click.",
    )
  })

  it("uses distinct owner as second incognito query when available", () => {
    const decisions = freeExecutiveNextDecisions({
      meta: baseMeta({
        businessName: "Test Co",
        ownerName: "Alex",
      }),
    })
    expect(decisions[0]?.summary).toContain('"Test Co" and "Alex"')
  })
})
