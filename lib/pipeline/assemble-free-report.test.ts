import { describe, expect, it } from "vitest"

import type { AuditScoreBundle } from "@/lib/audit/types"
import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import {
  assembleFreeReportFromResearch,
  extractUpgradeTeasers,
} from "@/lib/pipeline/assemble-free-report"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { buildSectionsFromResearch } from "@/lib/pipeline/serp-backed-sections"

const intake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Test Co",
  ownerName: "Alex Owner",
  priorBusinessNames: ["None"],
  primaryService: "Coaching",
  pricePoint: "$500/mo",
  websiteUrl: "https://example.com",
  socialProfiles: "Instagram: @test",
  emailListSize: "200",
  complaintsAwareness: "None known",
  reputationSelfAssessment: "Generally positive",
  reputationScale: 7,
  purchaseMotivation: "Grow leads",
  marketCity: "Atlanta",
  marketState: "GA",
}

const audit: AuditScoreBundle = {
  signals: [
    {
      id: "google_indexing",
      label: "Google indexing",
      status: "warning",
      finding: "Partial visibility",
      evidence: ["example.com"],
      tier: "free",
    },
  ],
  insights: [],
  overallScore: 64,
  letterGrade: "D",
}

describe("assembleFreeReportFromResearch", () => {
  it("emits exactly 3 free sections and strips paid data", () => {
    const bundle = emptyResearchBundle()
    bundle.digitalPresence.website.url = intake.websiteUrl
    const allSections = buildSectionsFromResearch(intake, bundle)
    const searchFootprint = allSections.find((s) => s.id === "search_footprint")!

    const report = assembleFreeReportFromResearch(
      intake,
      bundle,
      audit,
      "levelstack-free-snapshot",
      searchFootprint,
    )

    expect(report.meta.businessName).toBe(intake.primaryBusinessName)
    expect(report.meta.ownerName).toBe(intake.ownerName)
    expect(report.sections.map((s) => s.id)).toEqual([
      "search_footprint",
      "online_reputation",
      "digital_presence",
    ])
    expect(report.sections.some((s) => s.id === "revenue_funnel")).toBe(false)
    expect(report.sections.some((s) => s.id === "competitive_context")).toBe(false)
    expect(report.actionPlan.thisMonth).toEqual([])
    expect(report.actionPlan.thisQuarter).toEqual([])
    const digital = report.sections.find((s) => s.id === "digital_presence")
    const gbpFinding = digital?.findings.find((f) => /gbp|business profile/i.test(f.label))
    if (gbpFinding) {
      expect(gbpFinding.value).not.toContain("Not fetched yet")
    }
    expect(report.meta.upgradeTeasers).toBeDefined()
    expect(report.meta.lockedSectionCount).toBe(3)
    expect(report.meta.teaserActionCount).toBeGreaterThan(0)

    const parsed = levelstackReportJsonSchema.safeParse(report)
    expect(parsed.success).toBe(true)
  })
})

describe("extractUpgradeTeasers", () => {
  it("returns position alert without competitor domains in meta", () => {
    const bundle = emptyResearchBundle()
    const sections = buildSectionsFromResearch(intake, bundle)
    const teasers = extractUpgradeTeasers(sections, bundle)
    expect(teasers.competitiveSearchQuery).toBeTruthy()
    expect(teasers.competitorCount).toBe(0)
  })

  it("populates previewCompetitor when SERP detail includes URLs", () => {
    const bundle = emptyResearchBundle()
    const sections = buildSectionsFromResearch(intake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")
    if (competitive?.findings[0]) {
      competitive.findings[0].detail = ""
    }
    const search = sections.find((s) => s.id === "search_footprint")
    if (search?.findings[0]) {
      search.findings[0].detail =
        "Top results: #1 Rival Co (https://rival-example.com/); #2 Other (https://other.com/)"
    }
    const teasers = extractUpgradeTeasers(sections, bundle, "example.com")
    expect(teasers.previewCompetitor?.domain).toBe("rival-example.com")
    expect(teasers.previewCompetitor?.rank).toBe(1)
  })

  it("skips own domain when picking preview competitor", () => {
    const bundle = emptyResearchBundle()
    const sections = buildSectionsFromResearch(intake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")
    if (competitive?.findings[0]) {
      competitive.findings[0].detail = ""
    }
    const search = sections.find((s) => s.id === "search_footprint")
    if (search?.findings[0]) {
      search.findings[0].detail =
        "Top results: #1 Test Co (https://example.com/); #2 Rival Co (https://rival-example.com/)"
    }
    const teasers = extractUpgradeTeasers(sections, bundle, "example.com")
    expect(teasers.previewCompetitor?.domain).toBe("rival-example.com")
  })
})
