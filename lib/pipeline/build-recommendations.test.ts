import { describe, expect, it } from "vitest"

import type { AuditScoreBundle } from "@/lib/audit/types"
import { levelstackIntakeDefaults } from "@/lib/intake/schema"
import { assembleFreeReportFromResearch } from "@/lib/pipeline/assemble-free-report"
import { assembleReportJson } from "@/lib/pipeline/build-sections"
import {
  assignConfidenceBand,
  attachSearchReputationRecommendations,
} from "@/lib/pipeline/build-recommendations"
import { recommendationObjectSchema } from "@/lib/pipeline/recommendation-types"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import { buildSectionsFromResearch } from "@/lib/pipeline/serp-backed-sections"

const intake = {
  ...levelstackIntakeDefaults,
  primaryBusinessName: "Test Co",
  ownerName: "Alex Owner",
  primaryService: "Coaching",
  websiteUrl: "https://example.com",
  marketCity: "Atlanta",
  marketState: "GA",
  complaintsAwareness: "None known",
  reputationScale: 5,
}

const audit: AuditScoreBundle = {
  signals: [],
  insights: [],
  overallScore: 60,
  letterGrade: "D",
}

describe("assignConfidenceBand", () => {
  it("requires fresh non-derived evidence and ok/negative support for High", () => {
    const result = assignConfidenceBand({
      evidence: [
        {
          sourceType: "serp_organic",
          sourceLabel: "Google search",
          capturedAt: "2026-07-19T12:00:00.000Z",
          query: "Test Co",
          url: "https://example.com",
          freshnessClass: "fresh",
        },
      ],
      supportAvailability: ["negative"],
      sectionStatus: "attention",
    })
    expect(result.band).toBe("High")
  })

  it("caps at Medium when any supporting check is unavailable", () => {
    const result = assignConfidenceBand({
      evidence: [
        {
          sourceType: "serp_organic",
          sourceLabel: "Google search",
          capturedAt: "2026-07-19T12:00:00.000Z",
          freshnessClass: "fresh",
        },
      ],
      supportAvailability: ["negative", "unavailable"],
      sectionStatus: "attention",
    })
    expect(result.band).toBe("Medium")
  })

  it("never returns High for insufficient_data sections", () => {
    const result = assignConfidenceBand({
      evidence: [
        {
          sourceType: "serp_organic",
          sourceLabel: "Google search",
          capturedAt: "2026-07-19T12:00:00.000Z",
          freshnessClass: "fresh",
        },
      ],
      supportAvailability: ["negative"],
      sectionStatus: "insufficient_data",
    })
    expect(result.band).toBe("Low")
  })
})

describe("attachSearchReputationRecommendations", () => {
  it("dual-writes Search recommendations on free assemble (no Reputation section)", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Test Co",
        results: [
          {
            query: "Test Co",
            position: 1,
            title: "Someone Else",
            link: "https://other.com",
            snippet: "Not your brand",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    bundle.digitalPresence.website.url = intake.websiteUrl

    const searchFootprint = buildSectionsFromResearch(intake, bundle).find(
      (s) => s.id === "search_footprint",
    )!
    let report = assembleFreeReportFromResearch(
      intake,
      bundle,
      audit,
      null,
      searchFootprint,
    )
    report = attachSearchReputationRecommendations(report, bundle, {
      generatedAt: "2026-07-19T12:00:00.000Z",
      intake,
    })

    expect(report.recommendations?.length).toBeGreaterThanOrEqual(1)
    expect(
      report.recommendations?.every((r) => r.sourceSectionId === "search_footprint"),
    ).toBe(true)
    expect(
      report.recommendations?.every(
        (r) => recommendationObjectSchema.safeParse(r).success,
      ),
    ).toBe(true)
    expect(
      report.recommendations?.some((r) => r.evidence.some((e) => e.url)),
    ).toBe(true)
  })

  it("includes Reputation recommendations on paid sections and skips Social", () => {
    const bundle = emptyResearchBundle()
    bundle.searchFootprint.searches = [
      {
        query: "Test Co",
        results: [
          {
            query: "Test Co",
            position: 3,
            title: "Test Co",
            link: "https://example.com",
            snippet: "Coaching",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    bundle.reputation.searches = [
      {
        query: "site:clutch.co Test Co",
        results: [
          {
            query: "site:clutch.co Test Co",
            position: 1,
            title: "Unrelated agencies",
            link: "https://example.com/list",
            snippet: "Top agencies",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
      {
        query: "site:g2.com Test Co",
        results: [
          {
            query: "site:g2.com Test Co",
            position: 1,
            title: "Unrelated",
            link: "https://example.com/g2",
            snippet: "List",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
      {
        query: "site:capterra.com Test Co",
        results: [
          {
            query: "site:capterra.com Test Co",
            position: 1,
            title: "Unrelated",
            link: "https://example.com/cap",
            snippet: "List",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    bundle.socialSearch.platforms = [
      {
        platform: "LinkedIn",
        found: false,
        url: null,
        title: null,
      },
    ]

    const sections = buildSectionsFromResearch(intake, bundle)
    let report = assembleReportJson(intake, sections, null)
    report = attachSearchReputationRecommendations(report, bundle, {
      generatedAt: "2026-07-19T12:00:00.000Z",
      intake,
    })

    const sectionIds = new Set(
      report.recommendations?.map((r) => r.sourceSectionId),
    )
    expect(sectionIds.has("online_reputation")).toBe(true)
    expect(sectionIds.has("social_offsite")).toBe(false)
    expect(
      report.recommendations?.some((r) =>
        /B2B review directories/i.test(r.title),
      ),
    ).toBe(true)
    expect(
      report.recommendations?.every(
        (r) => recommendationObjectSchema.safeParse(r).success,
      ),
    ).toBe(true)
  })
})
