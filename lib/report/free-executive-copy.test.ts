import { describe, expect, it } from "vitest"

import type { AuditSignalResult } from "@/lib/audit/types"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  buildPriorityFindingFromSignals,
  customerFacingTopFinding,
  diagnosticAreaCounts,
  freeExecutiveHeadline,
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
    expect(UPGRADE_BANNER.body).toMatch(/assessment fee credits/i)
    expect(UPGRADE_BANNER.body).not.toMatch(/at capacity/i)
    expect(UPGRADE_BANNER.body).not.toMatch(/spots remaining/i)
    expect(UPGRADE_BANNER.secondaryCta).toMatch(/\$297/)
    expect(LOCKED_SECTION_MODAL.creditNote).toMatch(/founding-rate month/i)
  })
})
