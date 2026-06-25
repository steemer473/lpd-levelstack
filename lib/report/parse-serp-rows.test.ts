import { describe, expect, it } from "vitest"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  buildUpgradeTeaserCopy,
  domainsMatch,
  extractPreviewCompetitor,
  parseSerpRowsFromDetail,
  resolvePreviewCompetitorForReport,
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
})
