import { describe, expect, it } from "vitest"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import type { ReportSection } from "@/lib/pipeline/report-types"
import { emptyResearchBundle } from "@/lib/pipeline/research-types"
import {
  buildUpgradeTeaserCopy,
  deriveBuyerHostFromReport,
  domainsMatch,
  extractPreviewCompetitor,
  parseSerpRowsFromDetail,
  resolvePreviewCompetitorForReport,
  resolvePreviewCompetitorFromBundle,
  serpDetailFromSections,
} from "@/lib/report/parse-serp-rows"

describe("parse-serp-rows", () => {
  const detail =
    'Top results: #1 Platinum Real Estate: Home (https://contactplatinum.com/); #2 Platinum Real Estate | Linwood, NJ (https://www.platinumrealestatenj.com/)'

  it("parses SERP rows with domains and titles", () => {
    const rows = parseSerpRowsFromDetail(detail)
    expect(rows[0]?.domain).toBe("contactplatinum.com")
    expect(rows[0]?.serpPosition).toBe(1)
    expect(rows[0]?.title).toContain("Platinum Real Estate")
    expect(rows[1]?.domain).toBe("platinumrealestatenj.com")
  })

  it("extracts preview competitor from first row", () => {
    const preview = extractPreviewCompetitor(detail)
    expect(preview?.domain).toBe("contactplatinum.com")
    expect(preview?.rank).toBe(1)
  })

  it("excludes the business own domain from preview competitor", () => {
    const ownSiteDetail =
      'These are the top Google results prospects see: #1 Level Play Digital (https://levelplaydigital.com/); #2 Rival Co (https://rival-example.com/)'
    expect(extractPreviewCompetitor(ownSiteDetail, "levelplaydigital.com")?.domain).toBe(
      "rival-example.com",
    )
    expect(parseSerpRowsFromDetail(ownSiteDetail, 3, "levelplaydigital.com")).toHaveLength(1)
  })

  it("excludes google.com from preview competitor", () => {
    const detail =
      'Top results: #1 Google (https://www.google.com/); #2 Rival Co (https://rival-example.com/)'
    expect(extractPreviewCompetitor(detail)?.domain).toBe("rival-example.com")
  })

  it("matches www and bare domains", () => {
    expect(domainsMatch("www.levelplaydigital.com", "levelplaydigital.com")).toBe(true)
  })
})

describe("buildUpgradeTeaserCopy", () => {
  const baseReport = {
    meta: {
      reportTier: "free_snapshot",
      upgradeTeasers: {},
    },
    sections: [
      {
        id: "search_footprint",
        findings: [
          {
            label: 'Google — "Level Play Digital"',
            value: "Your site appears around position #1",
            detail:
              "These are the top Google results prospects see: #1 Level Play Digital (https://levelplaydigital.com/); #2 Rival Co (https://rival-example.com/)",
            severity: "good",
          },
        ],
      },
    ],
  } as unknown as LevelstackReportJson

  it("does not treat own domain as competitor in stored meta", () => {
    baseReport.meta.upgradeTeasers = {
      previewCompetitor: {
        rank: 1,
        domain: "levelplaydigital.com",
      },
    }
    expect(resolvePreviewCompetitorForReport(baseReport)?.domain).toBe("rival-example.com")
  })

  it("uses rank-leading copy when own site is #1 and no external preview", () => {
    baseReport.meta.upgradeTeasers = {}
    baseReport.sections[0]!.findings[0]!.detail =
      "These are the top Google results prospects see: #1 Level Play Digital (https://levelplaydigital.com/)"
    expect(buildUpgradeTeaserCopy(baseReport)).toContain("You rank #1 for your business name")
    expect(buildUpgradeTeaserCopy(baseReport)).not.toContain("#1 competitor")
  })

  it("derives buyer host from your domain (host) in detail copy", () => {
    const report = {
      meta: { reportTier: "free_snapshot", upgradeTeasers: {} },
      sections: [
        {
          id: "search_footprint",
          findings: [
            {
              label: 'Brand search — "Level Play Digital"',
              value: "Your site ranks #1 for this query.",
              detail:
                'When someone searches "Level Play Digital", your domain (levelplaydigital.com) appears at position #1. Top results: #1 Level Play Digital (https://levelplaydigital.com/); #2 Level Agency (https://levelagency.com/)',
              severity: "good",
            },
          ],
        },
      ],
    } as unknown as LevelstackReportJson

    expect(deriveBuyerHostFromReport(report)).toBe("levelplaydigital.com")
    expect(resolvePreviewCompetitorForReport(report)?.domain).toBe("levelagency.com")
  })

  it("prefers search footprint SERP detail over competitive limitation text", () => {
    const competitive = {
      id: "competitive_context",
      findings: [
        {
          label: 'Service search — "marketing"',
          detail: "Run a service-market search with identifiable business competitors to populate this section.",
        },
      ],
    } as unknown as ReportSection
    const search = {
      id: "search_footprint",
      findings: [
        {
          detail:
            "Top results: #1 Level Play Digital (https://levelplaydigital.com/); #2 Rival Co (https://rival-example.com/)",
        },
      ],
    } as unknown as ReportSection
    expect(serpDetailFromSections(competitive, search)).toContain("rival-example.com")
  })

  it("resolves free-tier preview from brand SERP results, skipping own domain", () => {
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
            title: "Level Agency",
            link: "https://levelagency.com/",
            snippet: "",
          },
        ],
        aiOverview: null,
        limitation: null,
      },
    ]
    expect(resolvePreviewCompetitorFromBundle(bundle, "levelplaydigital.com")?.domain).toBe(
      "levelagency.com",
    )
  })
})
