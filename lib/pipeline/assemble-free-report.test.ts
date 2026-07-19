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
  it("emits exactly 2 free sections and strips paid data", () => {
    const bundle = emptyResearchBundle()
    bundle.digitalPresence.website.url = intake.websiteUrl
    bundle.socialSearch.platforms = [
      {
        platform: "LinkedIn",
        found: true,
        url: "https://linkedin.com/company/test",
        title: "Test Co",
      },
      {
        platform: "Facebook",
        found: false,
        url: null,
        title: null,
      },
    ]
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
      "social_offsite",
    ])
    expect(report.sections.some((s) => s.id === "online_reputation")).toBe(false)
    expect(report.sections.some((s) => s.id === "digital_presence")).toBe(false)
    expect(report.sections.some((s) => s.id === "revenue_funnel")).toBe(false)
    expect(report.sections.some((s) => s.id === "competitive_context")).toBe(false)
    expect(report.actionPlan.thisMonth).toEqual([])
    expect(report.actionPlan.thisQuarter).toEqual([])
    const social = report.sections.find((s) => s.id === "social_offsite")
    expect(social?.findings.some((f) => f.label === "LinkedIn")).toBe(true)
    expect(report.meta.upgradeTeasers).toBeDefined()
    expect(report.meta.lockedSectionCount).toBe(5)
    expect(report.meta.teaserActionCount).toBeGreaterThan(0)

    const parsed = levelstackReportJsonSchema.safeParse(report)
    expect(parsed.success).toBe(true)
  })

  it("attaches live Google AI Overview preview without ChatGPT stub", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Test Co Atlanta, GA",
        results: [
          {
            query: "Test Co Atlanta, GA",
            position: 1,
            title: "Test Co",
            link: "https://example.com",
            snippet: "Coaching",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    const override = {
      id: "search_footprint" as const,
      label: "Search footprint",
      status: "attention" as const,
      score: 70,
      findings: [
        {
          label: "Brand search",
          value: "Partial visibility",
          detail: "Top results: #1 Test Co (https://example.com)",
          severity: "medium" as const,
        },
      ],
    }

    const report = assembleFreeReportFromResearch(
      intake,
      bundle,
      audit,
      "levelstack-free-snapshot",
      override,
    )

    const search = report.sections.find((s) => s.id === "search_footprint")
    expect(search?.aiPreview).toHaveLength(1)
    expect(search?.aiPreview?.[0]?.platform).toBe("Google AI Overview")
    expect(search?.aiPreview?.[0]?.result).toMatch(/No Google AI Overview/i)
    expect(JSON.stringify(report)).not.toMatch(/not automated in v1/i)
    expect(JSON.stringify(report)).not.toMatch(/ChatGPT \/ Perplexity/i)
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

  it("uses resolved column domain as previewCompetitor when grid columns exist (P1.8.1)", () => {
    // Grid resolved a local rival — previewCompetitor should name it, not raw SERP #1.
    const bundle = emptyResearchBundle()
    bundle.competitiveContext.competitorColumns = [
      { domain: "local-agency.com", source: "category_peer", title: "Local Agency Atlanta" },
    ]
    const sections = buildSectionsFromResearch(intake, bundle)
    // Service SERP detail has a different domain at #1 — resolved column should win.
    const competitive = sections.find((s) => s.id === "competitive_context")
    if (competitive?.findings[0]) {
      competitive.findings[0].detail =
        "#1 Unrelated Platform (https://unrelated.com/); #2 Other (https://other.com/)"
    }
    const teasers = extractUpgradeTeasers(sections, bundle, "example.com")
    expect(teasers.previewCompetitor?.domain).toBe("local-agency.com")
    expect(teasers.previewCompetitor?.title).toBe("Local Agency Atlanta")
    // No position in service SERP → defaults to 1
    expect(teasers.previewCompetitor?.rank).toBe(1)
  })

  it("picks up serpPosition when resolved column appears in the service SERP detail (P1.8.1)", () => {
    const bundle = emptyResearchBundle()
    bundle.competitiveContext.competitorColumns = [
      { domain: "rival-example.com", source: "service_peer" },
    ]
    const sections = buildSectionsFromResearch(intake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")
    if (competitive?.findings[0]) {
      competitive.findings[0].detail =
        "#1 Google (https://google.com/); #3 Rival Co (https://rival-example.com/)"
    }
    const teasers = extractUpgradeTeasers(sections, bundle, "example.com")
    expect(teasers.previewCompetitor?.domain).toBe("rival-example.com")
    // Position #3 in the service SERP → should be surfaced, not raw #1
    expect(teasers.previewCompetitor?.rank).toBe(3)
  })

  it("falls back to raw SERP parse when no resolved columns exist (P1.8.1 regression guard)", () => {
    const bundle = emptyResearchBundle()
    // competitorColumns empty — original fallback behaviour must still work
    const sections = buildSectionsFromResearch(intake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")
    if (competitive?.findings[0]) {
      competitive.findings[0].detail =
        "#1 Rival Co (https://rival-example.com/); #2 Other (https://other.com/)"
    }
    const teasers = extractUpgradeTeasers(sections, bundle, "example.com")
    expect(teasers.previewCompetitor?.domain).toBe("rival-example.com")
  })

  it("uses brand SERP rival when competitive section has only limitation text (free tier)", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Level Play Digital",
        results: [
          {
            query: "Level Play Digital",
            position: 1,
            title: "Level Play Digital",
            link: "https://levelplaydigital.com/",
            snippet: "",
          },
          {
            query: "Level Play Digital",
            position: 3,
            title: "Level Play Digital Agency — Atlanta",
            link: "https://levelplay-rival.example/",
            snippet: "Level Play Digital namesake",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    const sections = buildSectionsFromResearch(intake, bundle)
    const teasers = extractUpgradeTeasers(
      sections,
      bundle,
      "levelplaydigital.com",
      "Level Play Digital",
    )
    expect(teasers.previewCompetitor?.domain).toBe("levelplay-rival.example")
  })

  it("omits previewCompetitor for weak category peers and unrelated brand co-rankers", () => {
    const bundle = emptyResearchBundle()
    bundle.competitiveContext.competitorColumns = [
      {
        domain: "digitalrealty.com",
        source: "category_peer",
        title: "ATL14 Data Center | 250 Williams Street",
      },
    ]
    bundle.searchFootprint.searches = [
      {
        query: "Level Play Digital Atlanta",
        results: [
          {
            query: "Level Play Digital Atlanta",
            position: 1,
            title: "Level Play Digital",
            link: "https://levelplaydigital.com/",
            snippet: "",
          },
          {
            query: "Level Play Digital Atlanta",
            position: 3,
            title: "ATL14 Data Center | 250 Williams Street",
            link: "https://www.digitalrealty.com/data-centers/americas/atlanta/atl14",
            snippet: "",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    const sections = buildSectionsFromResearch(intake, bundle)
    const competitive = sections.find((s) => s.id === "competitive_context")
    if (competitive?.findings[0]) {
      competitive.findings[0].label = 'Service search — "General business services"'
      competitive.findings[0].detail =
        "#1 ATL14 Data Center (https://www.digitalrealty.com/data-centers/americas/atlanta/atl14)"
    }
    const teasers = extractUpgradeTeasers(
      sections,
      bundle,
      "levelplaydigital.com",
      "Level Play Digital",
    )
    expect(teasers.previewCompetitor).toBeUndefined()
    expect(teasers.competitiveSearchQuery).toMatch(/general business services/i)
  })

  it("sets Overall from equal-weight mean of free diagnostic section scores (P1-1)", () => {
    const bundle = emptyResearchBundle()
    const searchFootprint = {
      id: "search_footprint" as const,
      label: "Search footprint",
      status: "good" as const,
      score: 87,
      findings: [
        {
          label: "Visibility",
          value: "Strong local brand match",
          detail: "Appears in top results for the primary brand query.",
          severity: "good" as const,
        },
      ],
    }
    const report = assembleFreeReportFromResearch(
      intake,
      bundle,
      audit,
      "levelstack-free-snapshot",
      searchFootprint,
    )
    const diagnostic = report.sections.filter((s) => s.id !== "action_plan")
    const scored = diagnostic.filter(
      (s) => typeof s.score === "number" && Number.isFinite(s.score),
    )
    const expected = Math.round(
      scored.reduce((sum, s) => sum + (s.score as number), 0) / scored.length,
    )
    expect(report.meta.overallScore).toBe(expected)
    expect(report.meta.overallScore).not.toBe(audit.overallScore)
  })
})
